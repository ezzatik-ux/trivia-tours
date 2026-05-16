"use server";

import { db } from "@/lib/db";
import { rates, suppliers } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-utils";

export type RateInput = {
  productId: string;
  supplierId?: string | null;
  netAdult: number;
  netChild: number;
  netInfant: number;
  markupPct: number;
  minPax?: number | null;
  maxPax?: number | null;
  childAgeMin?: number | null;
  childAgeMax?: number | null;
  validFrom: string; // ISO date
  validTo: string; // ISO date
  isActive: boolean;
};

/**
 * Get all rates for a product with supplier info
 */
export async function getRatesByProduct(productId: string) {
  await requireRole(["PRODUCT", "ADMIN"]);

  return db
    .select({
      id: rates.id,
      supplierId: rates.supplierId,
      supplierName: suppliers.name,
      netAdult: rates.netAdult,
      netChild: rates.netChild,
      netInfant: rates.netInfant,
      markupPct: rates.markupPct,
      sellAdult: rates.sellAdult,
      sellChild: rates.sellChild,
      sellInfant: rates.sellInfant,
      minPax: rates.minPax,
      maxPax: rates.maxPax,
      childAgeMin: rates.childAgeMin,
      childAgeMax: rates.childAgeMax,
      validFrom: rates.validFrom,
      validTo: rates.validTo,
      isActive: rates.isActive,
      createdAt: rates.createdAt,
    })
    .from(rates)
    .leftJoin(suppliers, eq(rates.supplierId, suppliers.id))
    .where(eq(rates.productId, productId))
    .orderBy(desc(rates.validFrom));
}

/**
 * Get active suppliers for the rate form dropdown
 */
export async function getActiveSuppliers() {
  await requireRole(["PRODUCT", "ADMIN"]);

  return db
    .select({
      id: suppliers.id,
      name: suppliers.name,
    })
    .from(suppliers)
    .where(eq(suppliers.isActive, true))
    .orderBy(suppliers.name);
}

/**
 * Create new rate
 * Note: sell_adult/sell_child/sell_infant are auto-calculated by DB trigger
 */
export async function createRate(input: RateInput) {
  await requireRole(["PRODUCT", "ADMIN"]);

  // Validation
  if (input.netAdult < 0 || input.netChild < 0 || input.netInfant < 0) {
    return { success: false, error: "Net prices cannot be negative" };
  }
  if (input.markupPct < 0) {
    return { success: false, error: "Markup cannot be negative" };
  }
  if (new Date(input.validTo) < new Date(input.validFrom)) {
    return { success: false, error: "End date must be after start date" };
  }

  try {
    await db.insert(rates).values({
      productId: input.productId,
      supplierId: input.supplierId || null,
      netAdult: input.netAdult.toString(),
      netChild: input.netChild.toString(),
      netInfant: input.netInfant.toString(),
      markupPct: input.markupPct.toString(),
      // sell prices left at default "0" — DB trigger fills them
      sellAdult: "0",
      sellChild: "0",
      sellInfant: "0",
      minPax: input.minPax ?? 1,
      maxPax: input.maxPax ?? null,
      childAgeMin: input.childAgeMin ?? 2,
      childAgeMax: input.childAgeMax ?? 11,
      validFrom: input.validFrom,
      validTo: input.validTo,
      isActive: input.isActive,
    });

    revalidatePath(`/products/${input.productId}/rates`);
    return { success: true };
  } catch (error) {
    console.error("createRate error:", error);
    return { success: false, error: "Failed to create rate" };
  }
}

/**
 * Update existing rate
 */
export async function updateRate(id: string, input: RateInput) {
  await requireRole(["PRODUCT", "ADMIN"]);

  if (input.netAdult < 0 || input.netChild < 0 || input.netInfant < 0) {
    return { success: false, error: "Net prices cannot be negative" };
  }
  if (input.markupPct < 0) {
    return { success: false, error: "Markup cannot be negative" };
  }
  if (new Date(input.validTo) < new Date(input.validFrom)) {
    return { success: false, error: "End date must be after start date" };
  }

  try {
    await db
      .update(rates)
      .set({
        supplierId: input.supplierId || null,
        netAdult: input.netAdult.toString(),
        netChild: input.netChild.toString(),
        netInfant: input.netInfant.toString(),
        markupPct: input.markupPct.toString(),
        minPax: input.minPax ?? 1,
        maxPax: input.maxPax ?? null,
        childAgeMin: input.childAgeMin ?? 2,
        childAgeMax: input.childAgeMax ?? 11,
        validFrom: input.validFrom,
        validTo: input.validTo,
        isActive: input.isActive,
        updatedAt: new Date(),
      })
      .where(eq(rates.id, id));

    revalidatePath(`/products/${input.productId}/rates`);
    return { success: true };
  } catch (error) {
    console.error("updateRate error:", error);
    return { success: false, error: "Failed to update rate" };
  }
}

/**
 * Toggle rate active status
 */
export async function toggleRateActive(
  id: string,
  isActive: boolean,
  productId: string
) {
  await requireRole(["PRODUCT", "ADMIN"]);

  try {
    await db.update(rates).set({ isActive }).where(eq(rates.id, id));
    revalidatePath(`/products/${productId}/rates`);
    return { success: true };
  } catch (error) {
    console.error("toggleRateActive error:", error);
    return { success: false, error: "Failed to update rate" };
  }
}

/**
 * Delete a rate
 */
export async function deleteRate(id: string, productId: string) {
  await requireRole(["PRODUCT", "ADMIN"]);

  try {
    await db.delete(rates).where(eq(rates.id, id));
    revalidatePath(`/products/${productId}/rates`);
    return { success: true };
  } catch (error) {
    console.error("deleteRate error:", error);
    return { success: false, error: "Failed to delete rate" };
  }
}
