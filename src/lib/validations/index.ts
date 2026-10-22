import { z } from "zod";

export const customerSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  companyName: z.string().optional().nullable(),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(7, "Valid phone number is required"),
  tags: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const propertySchema = z.object({
  customerId: z.string().uuid("Customer ID must be a valid UUID"),
  address: z.string().min(3, "Street address is required"),
  unit: z.string().optional().nullable(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(2, "State is required"),
  postalCode: z.string().min(3, "Postal code is required"),
  country: z.string().default("US"),
  gateCode: z.string().optional().nullable(),
  petsKidsWarnings: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  squareFeet: z.coerce.number().optional().nullable(),
});

export const jobSchema = z.object({
  customerId: z.string().uuid(),
  propertyId: z.string().uuid(),
  servicePlanId: z.string().uuid().optional().nullable(),
  technicianId: z.string().uuid().optional().nullable(),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional().nullable(),
  scheduledDate: z.string().min(1, "Date is required"),
  scheduledStartTime: z.string().optional().nullable(),
  scheduledEndTime: z.string().optional().nullable(),
  routeOrder: z.coerce.number().default(0),
  status: z.enum(["SCHEDULED", "EN_ROUTE", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).default("SCHEDULED"),
  notes: z.string().optional().nullable(),
});

export const treatmentLogSchema = z.object({
  jobId: z.string().uuid(),
  pestType: z.string().min(1, "Target pest type is required (e.g., Termites, Roaches, Bedbugs)"),
  chemicalProduct: z.string().min(1, "EPA chemical or product name is required"),
  epaRegistrationNumber: z.string().min(1, "EPA Registration Number is required for compliance"),
  quantity: z.string().min(1, "Dilution or quantity used is required"),
  areasTreated: z.string().min(1, "Specific areas treated are required"),
  applicatorName: z.string().optional().nullable(),
  licenseNumber: z.string().optional().nullable(),
  technicianSignature: z.string().optional().nullable(), // base64 canvas signature
  photos: z.string().optional().nullable(), // JSON array string
  windSpeed: z.string().optional().nullable(),
  temperature: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const lineItemSchema = z.object({
  description: z.string().min(1, "Description is required"),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
  unitPriceCents: z.coerce.number().min(0, "Unit price must be positive"),
});

export const quoteSchema = z.object({
  customerId: z.string().uuid(),
  propertyId: z.string().uuid().optional().nullable(),
  title: z.string().min(1, "Quote title is required"),
  validUntil: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  lineItems: z.array(lineItemSchema).min(1, "At least one line item is required"),
});

export const invoiceSchema = z.object({
  customerId: z.string().uuid(),
  jobId: z.string().uuid().optional().nullable(),
  quoteId: z.string().uuid().optional().nullable(),
  dueDate: z.string().min(1, "Due date is required"),
  notes: z.string().optional().nullable(),
  lineItems: z.array(lineItemSchema).min(1, "At least one line item is required"),
});

export const paymentSchema = z.object({
  invoiceId: z.string().uuid(),
  amountCents: z.coerce.number().min(1, "Payment amount must be greater than 0"),
  method: z.enum(["CASH", "CARD", "BANK", "CHECK"]),
  reference: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const servicePlanSchema = z.object({
  propertyId: z.string().uuid(),
  name: z.string().min(1, "Plan name is required"),
  description: z.string().optional().nullable(),
  frequency: z.enum(["MONTHLY", "QUARTERLY", "BIANNUAL", "ANNUAL"]),
  priceCents: z.coerce.number().min(0),
  nextServiceDate: z.string().min(1, "Next service date is required"),
  autoInvoice: z.boolean().default(true),
});

export const onboardingSchema = z.object({
  companyName: z.string().min(2, "Company name must be at least 2 characters"),
  currency: z.string().default("USD"),
  timezone: z.string().default("America/New_York"),
  taxRatePercent: z.coerce.number().min(0).max(100).default(0),
  customerFirstName: z.string().min(1, "First name is required"),
  customerLastName: z.string().min(1, "Last name is required"),
  customerEmail: z.string().email("Valid email required"),
  customerPhone: z.string().min(7, "Valid phone required"),
  propertyAddress: z.string().min(3, "Property address is required"),
  propertyCity: z.string().min(1, "City is required"),
  propertyState: z.string().min(2, "State is required"),
  propertyPostalCode: z.string().min(3, "Postal code is required"),
});

export const organizationSettingsSchema = z.object({
  name: z.string().min(2, "Company name is required"),
  currency: z.string().default("USD"),
  timezone: z.string().default("America/New_York"),
  taxRatePercent: z.coerce.number().min(0).max(100),
  invoicePrefix: z.string().default("INV-"),
  quotePrefix: z.string().default("QTE-"),
  address: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
});

