# PestPilot 🚁

> **Production-Ready Field-Service Management SaaS for Small Pest Control Companies (1 to 5 Trucks)**  
> **Core Promise:** Quote → Schedule → Service → Invoice → Recurring Reminders in one simple tool that also works 100% offline in the field.

---

## 🛠 Tech Stack

- **Framework:** Next.js (App Router, React 19, Node.js runtime)
- **Styling & Theming:** Tailwind CSS with CSS Variables (`next-themes`: Light, Dark, System; Forest Green primary, Warm Amber accent, Neutral grays)
- **Database & ORM:** PostgreSQL + Prisma ORM (client-generated UUIDs, soft deletes, version counters)
- **Authentication:** Auth.js (NextAuth v5) with Credentials (bcrypt) & Google OAuth
- **Validation:** Zod schemas shared client-side and server-side
- **UI & Icons:** Radix-inspired accessible primitives + Lucide React (minimum 44px touch targets for technicians outdoors)
- **Billing & Subscriptions:** Stripe Checkout, Customer Portal, Webhook signature verification, and server-side tier enforcement
- **Notifications:** Resend (Email) & Twilio (SMS), behind resilient adapter interfaces
- **Offline & PWA:** Progressive Web App (manifest + service worker) + IndexedDB via Dexie.js + bidirectional mutation outbox sync engine
- **Testing:** Vitest for offline sync engine and business logic; Playwright for critical end-to-end flows

---

## 🏗 Architecture & Multi-Tenancy

### Multi-Tenant Isolation
- **Organization (Company)** is the root tenant boundary.
- Every relational table contains `organizationId` (`Customer`, `Property`, `Job`, `Quote`, `Invoice`, `TreatmentLog`, `ServicePlan`, `Reminder`, `Subscription`, `AuditLog`).
- The `getTenantDb(tenantContext)` helper (`src/lib/tenant.ts`) scopes every read and write operation to `organizationId`, preventing cross-tenant data leakage.

### Role-Based Access Control (RBAC)
1. **OWNER:** Full access to billing, subscription management, team member invitations, settings, company configuration, and all field routes.
2. **ADMIN:** Dispatch scheduling, customer records, quotes, invoices, and reports.
3. **TECHNICIAN:** Field-first mobile view (`/mobile/today`). Scoped strictly to jobs assigned to their user ID. Can update route progress, record EPA treatment logs, capture signatures, and record on-site payments.

---

## 📡 Offline-First Field Architecture & Sync Engine

Technicians frequently work in concrete basements, crawlspaces, or rural estates where cellular signal drops. PestPilot is engineered so that **no field operation is ever blocked by connectivity**.

```
[ Field Mobile App ]
        │
   (Offline Write)
        ▼
[ Dexie.js (IndexedDB) ] ────► [ Outbox Queue (Mutations) ]
                                          │
                            (Online Detected / Interval Ping)
                                          ▼
                                POST /api/sync/push
                                          │
                        ┌─────────────────┴─────────────────┐
                        ▼                                   ▼
          [ Last-Write-Wins (Per Field) ]       [ Append-Only Preservation ]
              Jobs, Customers, Properties          TreatmentLogs & Payments
                        │
                        ▼
                                GET /api/sync/pull?since=cursor
                        │
                        ▼
[ Local Dexie Store Updated with Remote Changes ]
```

### 1. Local Database (Dexie.js)
The technician's device maintains a local replica in IndexedDB:
- `jobs`, `customers`, `properties`, `treatmentLogs`, `payments`, `invoices`, `outbox`, `conflictsLog`, `syncMeta`.

### 2. Mutation Outbox Queue
When a technician updates a job, enters a chemical log, or collects a signature:
1. The record is written to the local Dexie table immediately for instant UI feedback.
2. A mutation object is queued in `outbox`: `{ id: uuid, entity, action, payload, timestamp, attempts }`.
3. The persistent `SyncStatusBadge` in the header immediately reflects pending changes (e.g. `2 changes pending`).

### 3. Push & Pull Sync Engine (`src/lib/offline/sync-engine.ts`)
When internet connectivity is restored:
- **Push:** The engine pushes pending outbox mutations to `POST /api/sync/push`. The server processes them idempotently using client-generated UUIDs.
- **Pull:** The client calls `GET /api/sync/pull?since=lastPullCursor` to fetch remote updates from dispatch and updates the local tables.

### 4. Conflict Resolution Policy
- **Last-Write-Wins:** For mutable records (`Job`, `Customer`, `Property`), the server compares version and `updatedAt`. If client version is outdated, the newer server record is retained and a conflict entry is logged in `conflictsLog`.
- **Append-Only Guarantee:** `TreatmentLog` (EPA compliance records) and `Payment` records are strictly **append-only**. They can never be overwritten by remote updates.
- **Audit:** A dedicated "Offline Conflicts" tab in `/settings` allows managers to inspect any automatic resolution.

---

## 📁 Project Structure

```
├── prisma/
│   ├── schema.prisma         # Multi-tenant data model (UUIDs, integer cents, versioning)
│   └── seed.ts               # Realistic demo seed: 1 company, 3 users, 20 customers, 40 jobs, EPA logs
├── public/
│   ├── manifest.json         # PWA web manifest
│   ├── sw.js                 # Service worker caching app shell and static assets
│   └── offline.html          # Fallback offline page
├── src/
│   ├── actions/
│   │   ├── auth.ts           # User registration & 3-minute onboarding actions
│   │   ├── billing.ts        # Stripe checkout, portal, settings, and team invites
│   │   ├── customers.ts      # Customer & multi-property CRUD
│   │   ├── invoices.ts       # Invoicing, payments, and online card checkout
│   │   ├── jobs.ts           # Dispatch scheduling, status updates, and EPA treatment logs
│   │   └── quotes.ts         # Service template quotes & public acceptance/decline
│   ├── app/
│   │   ├── (auth)/           # Login, Signup, Onboarding
│   │   ├── (dashboard)/
│   │   │   ├── customers/    # Customer CRM, address book, gate codes, pet warnings
│   │   │   ├── dashboard/    # KPI metrics, route progression, monthly revenue
│   │   │   ├── invoices/     # Invoices, partial payments, PDF downloads
│   │   │   ├── mobile/today/ # Field technician view (44px targets, one-tap navigation, chemical log)
│   │   │   ├── quotes/       # Estimate builder with 1-click pest service templates
│   │   │   ├── reminders/    # Automated reminders log & manual dispatcher
│   │   │   ├── reports/      # EPA chemical compliance reports (CSV and PDF exports)
│   │   │   ├── schedule/     # Calendar (day/week/list), drag-and-drop route ordering
│   │   │   ├── service-plans/# Recurring maintenance contracts & auto-invoicing
│   │   │   └── settings/     # Company profile, tax rate, team invites, Stripe billing
│   │   ├── api/
│   │   │   ├── auth/         # NextAuth handler
│   │   │   ├── cron/reminders# Secured automated reminder cron handler
│   │   │   ├── sync/pull     # Sync pull cursor endpoint
│   │   │   ├── sync/push     # Idempotent mutation push endpoint
│   │   │   └── webhooks/stripe# Stripe subscription and payment webhooks
│   │   ├── invoice/[token]/  # Public customer invoice & online payment page
│   │   ├── quote/[token]/    # Public customer quote review & acceptance page
│   │   ├── page.tsx          # High-converting landing page
│   │   ├── privacy/page.tsx  # Privacy policy
│   │   └── terms/page.tsx    # Terms of service
│   ├── components/
│   │   ├── layout/           # Sidebar, Header, MobileNav, SyncStatusBadge
│   │   ├── ui/               # Button, Card, Badge, Input, Label, Modal, Skeleton
│   │   ├── signature-pad.tsx # Touch canvas signature capture component
│   │   └── theme-toggle.tsx  # Light/Dark/System theme switcher
│   ├── lib/
│   │   ├── auth.ts           # NextAuth v5 configuration
│   │   ├── db.ts             # Prisma client singleton
│   │   ├── notifications.ts  # Resend & Twilio notification adapters
│   │   ├── pdf.ts            # jsPDF generator for invoices & compliance reports
│   │   ├── session.ts        # Server session & tenant validation helpers
│   │   ├── stripe.ts         # Stripe client, plan tiers, and server-side limit checks
│   │   ├── templates.ts      # Pest service templates (Initial cleanout, Termites, Rodents, etc.)
│   │   ├── tenant.ts         # Scoped tenant queries & audit logging
│   │   └── utils.ts          # Money formatter (integer cents), date formatters, UUIDs
│   └── test/
│       ├── setup.ts          # Fake IndexedDB test harness
│       ├── sync-engine.test.ts # Vitest unit tests (conflicts, retries, idempotency)
│       └── e2e/flows.spec.ts # Playwright critical flow tests
├── docker-compose.yml        # Local PostgreSQL service
└── package.json
```

---

## 💡 Key Design & Engineering Assumptions

1. **Client-Generated UUIDs:** All syncable records use client-generated UUIDs (`crypto.randomUUID()`) so records created while offline in the field (e.g. a new treatment log or payment) maintain stable identifiers across sync cycles.
2. **Integer Cents for Currency:** All monetary values (`totalCents`, `priceCents`, `subtotalCents`, `paidCents`) are stored as integers to eliminate floating-point arithmetic errors.
3. **Soft Deletes:** Syncable tables implement `deletedAt DateTime?` and integer `version` counters to allow deleted records to be propagated cleanly across client offline replicas.
4. **Resilient Notification Adapters:** If `RESEND_API_KEY` or `TWILIO_*` environment variables are omitted, notifications fail open and log formatted messages to the console rather than crashing customer workflows.
5. **Free Tier Viral Loop:** Invoices and quotes rendered for companies on the `FREE` plan display a "Powered by PestPilot" footer linking back to the platform. Upgrading to `PRO` or `BUSINESS` automatically removes this branding.

---

## ⚡ Quick Start

```bash
# 1. Install dependencies
pnpm install

# 2. Launch PostgreSQL container
pnpm db:up

# 3. Run database migrations
pnpm db:migrate

# 4. Seed with realistic demo company, 20 customers, 40 jobs, and EPA logs
pnpm db:seed

# 5. Start development server
pnpm dev
```

Visit [http://localhost:3000](http://localhost:3000)

### Quick Demo Logins (from seed script)
- **Company Owner:** `owner@apexcontrol.com` / `PestPilot123!` (Full dashboard & billing access)
- **Lead Field Tech:** `tech1@apexcontrol.com` / `PestPilot123!` (Field-service mobile view)

