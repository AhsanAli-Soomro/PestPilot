"use server";

import { getScopedDb } from "@/lib/session";
import { customerSchema, propertySchema } from "@/lib/validations";
import { revalidatePath } from "next/cache";

export async function createCustomerAction(formData: FormData) {
  try {
    const db = await getScopedDb();

    const rawData = {
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      companyName: (formData.get("companyName") as string) || null,
      email: (formData.get("email") as string)?.toLowerCase().trim(),
      phone: formData.get("phone") as string,
      tags: (formData.get("tags") as string) || null,
      notes: (formData.get("notes") as string) || null,
    };

    const validated = customerSchema.safeParse(rawData);
    if (!validated.success) {
      return { success: false, error: validated.error.errors[0]?.message };
    }

    const customer = await db.customers.create(validated.data);

    // If property address was also provided on customer creation
    const address = formData.get("address") as string;
    if (address && address.trim().length > 0) {
      await db.properties.create({
        customerId: customer.id,
        address,
        unit: (formData.get("unit") as string) || null,
        city: (formData.get("city") as string) || "Austin",
        state: (formData.get("state") as string) || "TX",
        postalCode: (formData.get("postalCode") as string) || "78701",
        gateCode: (formData.get("gateCode") as string) || null,
        petsKidsWarnings: (formData.get("petsKidsWarnings") as string) || null,
        notes: (formData.get("propertyNotes") as string) || null,
      });
    }

    await db.logAudit("CREATE", "Customer", customer.id, { name: `${customer.firstName} ${customer.lastName}` });

    revalidatePath("/customers");
    return { success: true, customerId: customer.id };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to create customer";
    return { success: false, error: msg };
  }
}

export async function updateCustomerAction(customerId: string, formData: FormData) {
  try {
    const db = await getScopedDb();

    const rawData = {
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      companyName: (formData.get("companyName") as string) || null,
      email: (formData.get("email") as string)?.toLowerCase().trim(),
      phone: formData.get("phone") as string,
      tags: (formData.get("tags") as string) || null,
      notes: (formData.get("notes") as string) || null,
    };

    const validated = customerSchema.safeParse(rawData);
    if (!validated.success) {
      return { success: false, error: validated.error.errors[0]?.message };
    }

    const updated = await db.customers.update(customerId, validated.data);
    await db.logAudit("UPDATE", "Customer", customerId, validated.data);

    revalidatePath("/customers");
    revalidatePath(`/customers/${customerId}`);
    return { success: true, customer: updated };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to update customer";
    return { success: false, error: msg };
  }
}

export async function createPropertyAction(formData: FormData) {
  try {
    const db = await getScopedDb();

    const rawData = {
      customerId: formData.get("customerId") as string,
      address: formData.get("address") as string,
      unit: (formData.get("unit") as string) || null,
      city: formData.get("city") as string,
      state: formData.get("state") as string,
      postalCode: formData.get("postalCode") as string,
      country: "US",
      gateCode: (formData.get("gateCode") as string) || null,
      petsKidsWarnings: (formData.get("petsKidsWarnings") as string) || null,
      notes: (formData.get("notes") as string) || null,
      squareFeet: formData.get("squareFeet") ? Number(formData.get("squareFeet")) : null,
    };

    const validated = propertySchema.safeParse(rawData);
    if (!validated.success) {
      return { success: false, error: validated.error.errors[0]?.message };
    }

    const property = await db.properties.create(validated.data);
    await db.logAudit("CREATE", "Property", property.id, { address: property.address });

    revalidatePath(`/customers/${validated.data.customerId}`);
    return { success: true, propertyId: property.id };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to create property";
    return { success: false, error: msg };
  }
}

