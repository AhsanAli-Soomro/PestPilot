import Dexie, { type Table } from "dexie";

export interface LocalJob {
  id: string;
  organizationId: string;
  customerId: string;
  propertyId: string;
  technicianId?: string | null;
  title: string;
  description?: string | null;
  status: "SCHEDULED" | "EN_ROUTE" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  scheduledDate: string; // ISO string
  scheduledStartTime?: string | null;
  scheduledEndTime?: string | null;
  routeOrder: number;
  completedAt?: string | null;
  notes?: string | null;
  customerName?: string;
  customerPhone?: string;
  propertyAddress?: string;
  gateCode?: string | null;
  petsKidsWarnings?: string | null;
  updatedAt: string;
  version: number;
  deletedAt?: string | null;
}

export interface LocalCustomer {
  id: string;
  organizationId: string;
  firstName: string;
  lastName: string;
  companyName?: string | null;
  email: string;
  phone: string;
  tags?: string | null;
  notes?: string | null;
  updatedAt: string;
  version: number;
  deletedAt?: string | null;
}

export interface LocalProperty {
  id: string;
  organizationId: string;
  customerId: string;
  address: string;
  unit?: string | null;
  city: string;
  state: string;
  postalCode: string;
  gateCode?: string | null;
  petsKidsWarnings?: string | null;
  notes?: string | null;
  updatedAt: string;
  version: number;
  deletedAt?: string | null;
}

export interface LocalTreatmentLog {
  id: string;
  organizationId: string;
  jobId: string;
  technicianId: string;
  pestType: string;
  chemicalProduct: string;
  epaRegistrationNumber: string;
  quantity: string;
  areasTreated: string;
  applicatorName?: string | null;
  licenseNumber?: string | null;
  technicianSignature?: string | null;
  photos?: string | null;
  notes?: string | null;
  windSpeed?: string | null;
  temperature?: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface LocalPayment {
  id: string;
  invoiceId: string;
  amountCents: number;
  method: "CASH" | "CARD" | "BANK" | "CHECK";
  reference?: string | null;
  notes?: string | null;
  paidAt: string;
  createdAt: string;
}

export interface LocalInvoice {
  id: string;
  organizationId: string;
  customerId: string;
  jobId?: string | null;
  invoiceNumber: string;
  status: "DRAFT" | "SENT" | "PAID" | "PARTIALLY_PAID" | "OVERDUE" | "CANCELLED";
  subtotalCents: number;
  taxCents: number;
  totalCents: number;
  paidCents: number;
  dueDate: string;
  publicToken: string;
  notes?: string | null;
  updatedAt: string;
  version: number;
  deletedAt?: string | null;
}

export interface OutboxMutation {
  id: string; // UUID mutationId
  entity: "job" | "treatmentLog" | "payment" | "customer" | "property" | "invoice";
  action: "CREATE" | "UPDATE" | "DELETE";
  payload: Record<string, unknown>;
  timestamp: number;
  attempts: number;
  lastError?: string | null;
}

export interface ConflictRecord {
  id: string;
  entity: string;
  entityId: string;
  serverVersion: number;
  clientVersion: number;
  resolvedAt: string;
  resolution: string;
}

export class PestPilotOfflineDatabase extends Dexie {
  jobs!: Table<LocalJob, string>;
  customers!: Table<LocalCustomer, string>;
  properties!: Table<LocalProperty, string>;
  treatmentLogs!: Table<LocalTreatmentLog, string>;
  payments!: Table<LocalPayment, string>;
  invoices!: Table<LocalInvoice, string>;
  outbox!: Table<OutboxMutation, string>;
  conflictsLog!: Table<ConflictRecord, string>;
  syncMeta!: Table<{ key: string; value: string }, string>;

  constructor() {
    super("PestPilotLocalDB");
    this.version(1).stores({
      jobs: "id, organizationId, customerId, propertyId, technicianId, scheduledDate, status, updatedAt",
      customers: "id, organizationId, email, phone, updatedAt",
      properties: "id, organizationId, customerId, updatedAt",
      treatmentLogs: "id, organizationId, jobId, technicianId, createdAt",
      payments: "id, invoiceId, paidAt",
      invoices: "id, organizationId, customerId, jobId, invoiceNumber, status, updatedAt",
      outbox: "id, entity, action, timestamp, attempts",
      conflictsLog: "id, entity, entityId, resolvedAt",
      syncMeta: "key",
    });
  }
}

export const localDb = new PestPilotOfflineDatabase();

