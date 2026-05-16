"use server";

import { db } from "@/lib/db";
import { suppliers, countries } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-utils";

export type SupplierInput = {
  name: string;
  countryId?: string | null;
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  paymentTerms?: string | null;
  notes?: string | null;
};

/**
 * Fetch all suppliers with their country info
 */
export async function getSuppliers() {
  await requireRole(["PRODUCT", "ADMIN"]);

  const result = await db
    .select({
      id: suppliers.id,
      name: suppliers.name,
      countryId: suppliers.countryId,
      countryName: countries.name,
      countryFlag: countries.flagEmoji,
      contactName: suppliers.contactName,
      contactEmail: suppliers.contactEmail,
      contactPhone: suppliers.contactPhone,
      paymentTerms: suppliers.paymentTerms,
      notes: suppliers.notes,
      isActive: suppliers.isActive,
      createdAt: suppliers.createdAt,
    })
    .from(suppliers)
    .leftJoin(countries, eq(suppliers.countryId, countries.id))
    .orderBy(desc(suppliers.createdAt));

  return result;
}

/**
 * Fetch active countries for the dropdown
 */
export async function getCountries() {
  return db
    .select({
      id: countries.id,
      name: countries.name,
      flagEmoji: countries.flagEmoji,
    })
    .from(countries)
    .where(eq(countries.isActive, true))
    .orderBy(countries.sortOrder);
}

/**
 * Create a new supplier
 */
export async function createSupplier(input: SupplierInput) {
  await requireRole(["PRODUCT", "ADMIN"]);

  if (!input.name?.trim()) {
    return { success: false, error: "Supplier name is required" };
  }

  try {
    const [created] = await db
      .insert(suppliers)
      .values({
        name: input.name.trim(),
        countryId: input.countryId || null,
        contactName: input.contactName?.trim() || null,
        contactEmail: input.contactEmail?.trim() || null,
        contactPhone: input.contactPhone?.trim() || null,
        paymentTerms: input.paymentTerms?.trim() || null,
        notes: input.notes?.trim() || null,
      })
      .returning();

    revalidatePath("/suppliers");
    return { success: true, supplier: created };
  } catch (error) {
    console.error("createSupplier error:", error);
    return { success: false, error: "Failed to create supplier" };
  }
}

/**
 * Update an existing supplier
 */
export async function updateSupplier(id: string, input: SupplierInput) {
  await requireRole(["PRODUCT", "ADMIN"]);

  if (!input.name?.trim()) {
    return { success: false, error: "Supplier name is required" };
  }

  try {
    const [updated] = await db
      .update(suppliers)
      .set({
        name: input.name.trim(),
        countryId: input.countryId || null,
        contactName: input.contactName?.trim() || null,
        contactEmail: input.contactEmail?.trim() || null,
        contactPhone: input.contactPhone?.trim() || null,
        paymentTerms: input.paymentTerms?.trim() || null,
        notes: input.notes?.trim() || null,
      })
      .where(eq(suppliers.id, id))
      .returning();

    revalidatePath("/suppliers");
    return { success: true, supplier: updated };
  } catch (error) {
    console.error("updateSupplier error:", error);
    return { success: false, error: "Failed to update supplier" };
  }
}

/**
 * Toggle supplier active status (soft delete)
 */
export async function toggleSupplierActive(id: string, isActive: boolean) {
  await requireRole(["PRODUCT", "ADMIN"]);

  try {
    await db
      .update(suppliers)
      .set({ isActive })
      .where(eq(suppliers.id, id));

    revalidatePath("/suppliers");
    return { success: true };
  } catch (error) {
    console.error("toggleSupplierActive error:", error);
    return { success: false, error: "Failed to update supplier status" };
  }
}
