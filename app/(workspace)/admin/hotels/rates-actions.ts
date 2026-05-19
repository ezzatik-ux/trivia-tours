"use server";

import { db } from "@/lib/db";
import {
  hotelRates,
  hotelRoomTypes,
  hotelRateSeasons,
} from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-utils";

export type RateInput = {
  hotelId: string;
  roomTypeId: string;
  seasonId?: string | null;
  validFrom: string;
  validTo: string;

  // Net costs (USD)
  netSingle?: number | null;
  netDouble: number;
  netTriple?: number | null;
  netQuad?: number | null;

  // Pricing model (one of these will be > 0)
  markupPct?: number | null;
  commissionPct?: number | null;

  // Meal plan
  mealPlan: "RO" | "BB" | "HB" | "FB" | "AI";

  // Child policy
  childAgeMin?: number | null;
  childAgeMax?: number | null;
  childRate?: number | null;
  childMealSupplement?: number | null;

  // Early bird
  earlyBirdDays?: number | null;
  earlyBirdPct?: number | null;

  // Booking rules
  minNights?: number | null;
  maxNights?: number | null;

  // Currency reference
  originalCurrency?: string | null;
  exchangeRateAtUpload?: number | null;

  isActive: boolean;
};

/**
 * Get all rates for a hotel with room type + season info
 */
export async function getRatesByHotel(hotelId: string) {
  await requireRole(["PRODUCT", "ADMIN"]);

  return db
    .select({
      // Rate fields
      id: hotelRates.id,
      roomTypeId: hotelRates.roomTypeId,
      seasonId: hotelRates.seasonId,
      validFrom: hotelRates.validFrom,
      validTo: hotelRates.validTo,
      netSingle: hotelRates.netSingle,
      netDouble: hotelRates.netDouble,
      netTriple: hotelRates.netTriple,
      netQuad: hotelRates.netQuad,
      markupPct: hotelRates.markupPct,
      commissionPct: hotelRates.commissionPct,
      sellSingle: hotelRates.sellSingle,
      sellDouble: hotelRates.sellDouble,
      sellTriple: hotelRates.sellTriple,
      sellQuad: hotelRates.sellQuad,
      mealPlan: hotelRates.mealPlan,
      childAgeMin: hotelRates.childAgeMin,
      childAgeMax: hotelRates.childAgeMax,
      childRate: hotelRates.childRate,
      childMealSupplement: hotelRates.childMealSupplement,
      earlyBirdDays: hotelRates.earlyBirdDays,
      earlyBirdPct: hotelRates.earlyBirdPct,
      minNights: hotelRates.minNights,
      maxNights: hotelRates.maxNights,
      originalCurrency: hotelRates.originalCurrency,
      exchangeRateAtUpload: hotelRates.exchangeRateAtUpload,
      isActive: hotelRates.isActive,
      // Joined fields
      roomTypeName: hotelRoomTypes.name,
      seasonName: hotelRateSeasons.name,
    })
    .from(hotelRates)
    .leftJoin(hotelRoomTypes, eq(hotelRates.roomTypeId, hotelRoomTypes.id))
    .leftJoin(hotelRateSeasons, eq(hotelRates.seasonId, hotelRateSeasons.id))
    .where(eq(hotelRates.hotelId, hotelId))
    .orderBy(desc(hotelRates.validFrom));
}

/**
 * Create a new rate
 */
export async function createRate(input: RateInput) {
  await requireRole(["PRODUCT", "ADMIN"]);

  if (input.netDouble < 0) {
    return { success: false, error: "Net prices cannot be negative" };
  }
  if (new Date(input.validTo) < new Date(input.validFrom)) {
    return { success: false, error: "End date must be after start date" };
  }
  if (!input.markupPct && !input.commissionPct) {
    return { success: false, error: "Either markup % or commission % is required" };
  }

  try {
    await db.insert(hotelRates).values({
      hotelId: input.hotelId,
      roomTypeId: input.roomTypeId,
      seasonId: input.seasonId || null,
      validFrom: input.validFrom,
      validTo: input.validTo,
      netSingle: (input.netSingle ?? 0).toString(),
      netDouble: input.netDouble.toString(),
      netTriple: (input.netTriple ?? 0).toString(),
      netQuad: (input.netQuad ?? 0).toString(),
      markupPct: (input.markupPct ?? 0).toString(),
      commissionPct: (input.commissionPct ?? 0).toString(),
      // Sell prices auto-calculated by DB trigger
      sellSingle: "0",
      sellDouble: "0",
      sellTriple: "0",
      sellQuad: "0",
      mealPlan: input.mealPlan,
      childAgeMin: input.childAgeMin ?? 2,
      childAgeMax: input.childAgeMax ?? 11,
      childRate: (input.childRate ?? 0).toString(),
      childMealSupplement: (input.childMealSupplement ?? 0).toString(),
      earlyBirdDays: input.earlyBirdDays ?? null,
      earlyBirdPct: input.earlyBirdPct?.toString() ?? null,
      minNights: input.minNights ?? 1,
      maxNights: input.maxNights ?? null,
      originalCurrency: input.originalCurrency ?? "USD",
      exchangeRateAtUpload: (input.exchangeRateAtUpload ?? 1).toString(),
      isActive: input.isActive,
    });

    revalidatePath(`/admin/hotels/${input.hotelId}/rates`);
    return { success: true };
  } catch (error) {
    console.error("createRate error:", error);
    return { success: false, error: "Failed to create rate" };
  }
}

/**
 * Update a rate
 */
export async function updateRate(id: string, input: RateInput) {
  await requireRole(["PRODUCT", "ADMIN"]);

  if (input.netDouble < 0) {
    return { success: false, error: "Net prices cannot be negative" };
  }
  if (new Date(input.validTo) < new Date(input.validFrom)) {
    return { success: false, error: "End date must be after start date" };
  }
  if (!input.markupPct && !input.commissionPct) {
    return { success: false, error: "Either markup % or commission % is required" };
  }

  try {
    await db
      .update(hotelRates)
      .set({
        roomTypeId: input.roomTypeId,
        seasonId: input.seasonId || null,
        validFrom: input.validFrom,
        validTo: input.validTo,
        netSingle: (input.netSingle ?? 0).toString(),
        netDouble: input.netDouble.toString(),
        netTriple: (input.netTriple ?? 0).toString(),
        netQuad: (input.netQuad ?? 0).toString(),
        markupPct: (input.markupPct ?? 0).toString(),
        commissionPct: (input.commissionPct ?? 0).toString(),
        mealPlan: input.mealPlan,
        childAgeMin: input.childAgeMin ?? 2,
        childAgeMax: input.childAgeMax ?? 11,
        childRate: (input.childRate ?? 0).toString(),
        childMealSupplement: (input.childMealSupplement ?? 0).toString(),
        earlyBirdDays: input.earlyBirdDays ?? null,
        earlyBirdPct: input.earlyBirdPct?.toString() ?? null,
        minNights: input.minNights ?? 1,
        maxNights: input.maxNights ?? null,
        originalCurrency: input.originalCurrency ?? "USD",
        exchangeRateAtUpload: (input.exchangeRateAtUpload ?? 1).toString(),
        isActive: input.isActive,
        updatedAt: new Date(),
      })
      .where(eq(hotelRates.id, id));

    revalidatePath(`/admin/hotels/${input.hotelId}/rates`);
    return { success: true };
  } catch (error) {
    console.error("updateRate error:", error);
    return { success: false, error: "Failed to update rate" };
  }
}

/**
 * Toggle active
 */
export async function toggleRateActive(id: string, isActive: boolean, hotelId: string) {
  await requireRole(["PRODUCT", "ADMIN"]);
  try {
    await db.update(hotelRates).set({ isActive }).where(eq(hotelRates.id, id));
    revalidatePath(`/admin/hotels/${hotelId}/rates`);
    return { success: true };
  } catch (error) {
    console.error("toggleRateActive error:", error);
    return { success: false, error: "Failed to toggle" };
  }
}

/**
 * Delete a rate
 */
export async function deleteRate(id: string, hotelId: string) {
  await requireRole(["PRODUCT", "ADMIN"]);
  try {
    await db.delete(hotelRates).where(eq(hotelRates.id, id));
    revalidatePath(`/admin/hotels/${hotelId}/rates`);
    return { success: true };
  } catch (error) {
    console.error("deleteRate error:", error);
    return { success: false, error: "Failed to delete" };
  }
}

/**
 * Duplicate a rate (useful for copying across seasons)
 */
export async function duplicateRate(id: string, hotelId: string) {
  await requireRole(["PRODUCT", "ADMIN"]);

  try {
    const [original] = await db
      .select()
      .from(hotelRates)
      .where(eq(hotelRates.id, id))
      .limit(1);

    if (!original) {
      return { success: false, error: "Original rate not found" };
    }

    await db.insert(hotelRates).values({
      hotelId: original.hotelId,
      roomTypeId: original.roomTypeId,
      seasonId: original.seasonId,
      validFrom: original.validFrom,
      validTo: original.validTo,
      netSingle: original.netSingle,
      netDouble: original.netDouble,
      netTriple: original.netTriple,
      netQuad: original.netQuad,
      markupPct: original.markupPct,
      commissionPct: original.commissionPct,
      sellSingle: "0",
      sellDouble: "0",
      sellTriple: "0",
      sellQuad: "0",
      mealPlan: original.mealPlan,
      childAgeMin: original.childAgeMin,
      childAgeMax: original.childAgeMax,
      childRate: original.childRate,
      childMealSupplement: original.childMealSupplement,
      earlyBirdDays: original.earlyBirdDays,
      earlyBirdPct: original.earlyBirdPct,
      minNights: original.minNights,
      maxNights: original.maxNights,
      originalCurrency: original.originalCurrency,
      exchangeRateAtUpload: original.exchangeRateAtUpload,
      isActive: false, // Start as inactive so user reviews before activating
    });

    revalidatePath(`/admin/hotels/${hotelId}/rates`);
    return { success: true };
  } catch (error) {
    console.error("duplicateRate error:", error);
    return { success: false, error: "Failed to duplicate rate" };
  }
}
