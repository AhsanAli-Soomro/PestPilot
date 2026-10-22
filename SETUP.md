# PestPilot Setup & Connection Guide

This guide is a numbered, copy-paste checklist for setting up and deploying PestPilot. Follow each step in order.

---

## Table of Contents
1. [Local Database (Docker)](#1-local-database-docker)
2. [Production Database (Neon or Supabase)](#2-production-database-neon-or-supabase)
3. [Authentication Secret (AUTH_SECRET)](#3-authentication-secret-auth_secret)
4. [Google OAuth Login (Optional)](#4-google-oauth-login-optional)
5. [Stripe Payments, Billing & Webhooks](#5-stripe-payments-billing--webhooks)
6. [Email Notifications (Resend)](#6-email-notifications-resend)
7. [SMS Notifications (Twilio - Optional)](#7-sms-notifications-twilio---optional)
8. [Automated Cron Secret (CRON_SECRET)](#8-automated-cron-secret-cron_secret)
9. [Deploying to Production (Vercel + Neon)](#9-deploying-to-production-vercel--neon)

---

### 1. Local Database (Docker)
PestPilot includes a `docker-compose.yml` file for zero-config local PostgreSQL.

1. Start the container:
   ```bash
   docker compose up -d
   ```
2. Your `.env` variable is already pre-configured for this:
   ```env
   DATABASE_URL="postgresql://pestpilot:pestpilot_password@localhost:5432/pestpilot_db"
   ```
3. Run the Prisma schema push and seed script:
   ```bash
   pnpm db:push
   pnpm db:seed
   ```
   *(Note: If you ever see `The table public.User does not exist`, it simply means the database was restarted or empty without running `pnpm db:push`. Running `pnpm db:push && pnpm db:seed` creates all tables and demo accounts in seconds.)*

---

### 2. Production Database (Neon Hosted PostgreSQL)

Your live Neon PostgreSQL instance is pre-configured and connected:

- **Database Host:** `ep-square-art-b50bjud9-pooler.c-7.us-east-2.aws.neon.tech`
- **Database Name:** `PastSite`
- **Live Connection String:**
  ```env
  DATABASE_URL="postgresql://neondb_owner:npg_LphFQwI7qPX1@ep-square-art-b50bjud9-pooler.c-7.us-east-2.aws.neon.tech/PastSite?sslmode=require&channel_binding=require"
  ```
- **Local vs Live Separation:**
  - Local development runs against your local Docker PostgreSQL in `.env` (`localhost:5432`).
  - Production deployments (Vercel / cloud) automatically use `.env.production` containing the Neon connection.
  - To sync or seed Neon from your CLI at any time:
    ```bash
    pnpm db:neon:push   # Pushes Prisma schema to Neon
    pnpm db:neon:seed   # Seeds Apex Pest Solutions demo fleet into Neon
    ```

---

### 3. Authentication Secret (AUTH_SECRET)
Auth.js (NextAuth v5) encrypts session cookies using this key.

1. Generate a secure random 32-byte secret in your terminal:
   ```bash
   openssl rand -base64 33
   ```
2. Copy the resulting string.
3. Paste into `.env`:
   ```env
   AUTH_SECRET="LZMl/woPBGf8e/L4E42jmvecMFtXwxTVGhd9CKPDPuE="
   AUTH_TRUST_HOST=true
   ```
   *(Note: In local development, the active port is dynamically detected automatically whether Next.js runs on 3000, 3001, 3002, or any other port. In production on Vercel, set `AUTH_URL="https://your-domain.com"`).*

---

### 4. Google OAuth Login (Optional)
If you want to allow Google sign-in alongside email/password:

1. Open the [Google Cloud Console](https://console.cloud.google.com).
2. Go to **APIs & Services** → **Credentials**.
3. Click **"Create Credentials"** → **"OAuth client ID"**.
4. Application type: **Web application**. Name: `PestPilot`.
5. Under **Authorized redirect URIs**, add:
   - For local development: `http://localhost:3000/api/auth/callback/google`
   - For production: `https://your-domain.com/api/auth/callback/google`
6. Click **Create**.
7. Copy the **Client ID** and **Client Secret**.
8. Paste into `.env`:
   ```env
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   ```
   *(If you don't need Google login, leave these blank; email/password authentication will work out of the box).*

---

### 5. Stripe Payments, Billing & Webhooks

#### Step 5A: Get API Keys
1. Open the [Stripe Dashboard](https://dashboard.stripe.com).
2. Toggle on **Test mode** (top right switch).
3. Go to **Developers** → **API keys**.
4. Copy the **Publishable key** (`pk_test_...`) and **Secret key** (`sk_test_...`).
5. Paste into `.env`:
   ```env
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
   STRIPE_SECRET_KEY="sk_test_..."
   ```

#### Step 5B: Create Subscription Products & Prices
1. In the Stripe Dashboard, go to **Product Catalog** → **Add Product**.
2. **Product 1 (Pro Plan):**
   - Name: `PestPilot Pro`
   - Price: `$29.00`
   - Billing period: **Monthly recurring**
   - Click **Save Product**.
   - Copy the Price ID (starts with `price_...`).
   - Paste into `.env`:
     ```env
     STRIPE_PRO_PRICE_ID="price_1Q..."
     ```
3. **Product 2 (Business Plan):**
   - Name: `PestPilot Business`
   - Price: `$59.00`
   - Billing period: **Monthly recurring**
   - Click **Save Product**.
   - Copy the Price ID (starts with `price_...`).
   - Paste into `.env`:
     ```env
     STRIPE_BUSINESS_PRICE_ID="price_1Q..."
     ```

#### Step 5C: Local Webhook Testing via Stripe CLI
To test subscription upgrades and card checkout locally:
1. Install the Stripe CLI:
   - macOS: `brew install stripe/stripe-cli/stripe`
   - Windows: `scoop install stripe` or download executable
2. Login to Stripe CLI:
   ```bash
   stripe login
   ```
3. Forward webhook events to your local Next.js server:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```
4. The CLI will output a webhook signing secret:
   ```text
   > Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxxxxxxxxxxx
   ```
5. Copy that secret and paste it into `.env`:
   ```env
   STRIPE_WEBHOOK_SECRET="whsec_xxxxxxxxxxxxxxxxxxxxxx"
   ```

#### Step 5D: Production Webhook Configuration
1. In Stripe Dashboard, go to **Developers** → **Webhooks** → **Add endpoint**.
2. Endpoint URL: `https://your-domain.com/api/webhooks/stripe`.
3. Select events to listen to:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
4. Click **Add endpoint**.
5. Reveal the **Signing secret** (`whsec_...`) and add to production environment variables.

---

### 6. Email Notifications (Nodemailer or Resend)

PestPilot supports two email delivery adapters:
1. **Nodemailer via Gmail / SMTP (100% Free & No Custom Domain Required)**
2. **Resend API (Requires custom verified domain with DNS access)**

---

#### Option A: Nodemailer via Gmail (Recommended - 100% Free, Zero Domain Needed)
Send real client emails (quotes, invoices, reminders) straight from your standard Gmail account for $0:

1. Open your Google Account: [https://myaccount.google.com/security](https://myaccount.google.com/security)
2. Ensure **2-Step Verification** is turned **ON**.
3. Open the App Passwords page: [https://myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
4. App name: type `PestPilot` and click **Create**.
5. Google will generate a 16-character password (e.g., `abcd efgh ijkl mnop`).
6. Copy that 16-character code and paste into your `.env` (or Vercel Environment Variables):
   ```env
   GMAIL_USER="your-email@gmail.com"
   GMAIL_PASS="abcdefghijklmnop"
   ```
7. Done! Real quotes, invoices, and reminders will now be delivered via Gmail with zero configuration or domain fees!

---

#### Option B: Resend API (Alternative if you own a verified domain)
1. Go to [https://resend.com](https://resend.com) and create an account.
2. Add your custom domain and verify DNS records (SPF/DKIM).
3. In the sidebar, click **API Keys** → **Create API Key**.
4. Name it `PestPilot` and copy the key (`re_...`).
5. Paste into `.env`:
   ```env
   RESEND_API_KEY="re_xxxxxxxxxxxxxx"
   EMAIL_FROM="notifications@yourdomain.com"
   ```

*(Note: If neither is configured, PestPilot automatically runs in simulation mode, logging emails safely to your console with zero crashes).*

---

### 7. SMS Notifications (Twilio - Optional)
PestPilot includes an SMS notification adapter for appointment reminders.

1. Log in to [Twilio Console](https://console.twilio.com).
2. On your dashboard, find the **Account Info** box.
3. Copy **Account SID**, **Auth Token**, and your active **Twilio Phone Number**.
4. Paste into `.env`:
   ```env
   TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
   TWILIO_AUTH_TOKEN="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
   TWILIO_PHONE_NUMBER="+15125550199"
   ```
   *(If omitted, the SMS adapter automatically disables itself cleanly).*

---

### 8. Automated Cron Secret (CRON_SECRET)
Secures the automated reminder endpoint `/api/cron/reminders`.

1. Choose a random secret token (e.g. `cron_pestpilot_sec_778899`).
2. Paste into `.env`:
   ```env
   CRON_SECRET="your-chosen-secret-token"
   ```
3. To trigger the cron job externally:
   ```bash
   curl -X GET http://localhost:3000/api/cron/reminders \
     -H "Authorization: Bearer your-chosen-secret-token"
   ```
4. On Vercel, this is triggered automatically via `vercel.json` or external cron services (such as cron-job.org or GitHub Actions).

---

### 9. Deploying to Production (Vercel + Neon)

1. Push your repository to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit of PestPilot SaaS"
   git remote add origin https://github.com/your-username/pestpilot.git
   git push -u origin main
   ```
2. Open [Vercel](https://vercel.com) and click **"Add New Project"**.
3. Import your `pestpilot` GitHub repository.
4. In the **Environment Variables** section, copy and paste all variables from your completed `.env`:
   - `DATABASE_URL` (Neon / Supabase pooled connection string)
   - `AUTH_SECRET`
   - `AUTH_URL` (`https://your-vercel-domain.vercel.app`)
   - `NEXT_PUBLIC_APP_URL` (`https://your-vercel-domain.vercel.app`)
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - `STRIPE_PRO_PRICE_ID`
   - `STRIPE_BUSINESS_PRICE_ID`
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - `RESEND_API_KEY`
   - `EMAIL_FROM`
   - `CRON_SECRET`
5. Click **Deploy**.
6. After deployment finishes, run the database migrations against production:
   ```bash
   DATABASE_URL="<your-production-db-url>" pnpm db:deploy
   DATABASE_URL="<your-production-db-url>" pnpm db:seed
   ```
7. Visit your live PestPilot URL!

