"use server";

import { db } from "@/lib/db";
import { hotelRateSeasons } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-utils";

export type SeasonInput = {
  hotelId: string;
  name: string;
  validFrom: string;
  validTo: string;
  surchargePerNight?: number | null;
  priority: number;
  isActive: boolean;
};

export async function getSeasonsByHotel(hotelId: string) {
  await requireRole(["PRODUCT", "ADMIN"]);

  return db
    .select()
    .from(hotelRateSeasons)
    .where(eq(hotelRateSeasons.hotelId, hotelId))
    .orderBy(hotelRateSeasons.validFrom);
}

export async function createSeason(input: SeasonInput) {
  await requireRole(["PRODUCT", "ADMIN"]);

  if (!input.name?.trim()) {
    return { success: false, error: "Season name is required" };
  }
  if (new Date(input.validTo) < new Date(input.validFrom)) {
    return { success: false, error: "End date must be after start date" };
  }

  try {
    await db.insert(hotelRateSeasons).values({
      hotelId: input.hotelId,
      name: input.name.trim(),
      validFrom: input.validFrom,
      validTo: input.validTo,
      surchargePerNight: (input.surchargePerNight ?? 0).toString(),
      priority: input.priority,
      isActive: input.isActive,
    });

    revalidatePath(`/admin/hotels/${input.hotelId}/seasons`);
    return { success: true };
  } catch (error) {
    console.error("createSeason error:", error);
    return { success: false, error: "Failed to create season" };
  }
}

export async function updateSeason(id: string, input: SeasonInput) {
  await requireRole(["PRODUCT", "ADMIN"]);

  if (!input.name?.trim()) {
    return { success: false, error: "Season name is required" };
  }
  if (new Date(input.validTo) < new Date(input.validFrom)) {
    return { success: false, error: "End date must be after start date" };
  }

  try {
    await db
      .update(hotelRateSeasons)
      .set({
        name: input.name.trim(),
        validFrom: input.validFrom,
        validTo: input.validTo,
        surchargePerNight: (input.surchargePerNight ?? 0).toString(),
        priority: input.priority,
        isActive: input.isActive,
      })
      .where(eq(hotelRateSeasons.id, id));

    revalidatePath(`/admin/hotels/${input.hotelId}/seasons`);
    return { success: true };
  } catch (error) {
    console.error("updateSeason error:", error);
    return { success: false, error: "Failed to update season" };
  }
}

export async function toggleSeasonActive(id: string, isActive: boolean, hotelId: string) {
  await requireRole(["PRODUCT", "ADMIN"]);
  try {
    await db.update(hotelRateSeasons).set({ isActive }).where(eq(hotelRateSeasons.id, id));
    revalidatePath(`/admin/hotels/${hotelId}/seasons`);
    return { success: true };
  } catch (error) {
    console.error("toggleSeasonActive error:", error);
    return { success: false, error: "Failed to toggle" };
  }
}

export async function deleteSeason(id: string, hotelId: string) {
  await requireRole(["PRODUCT", "ADMIN"]);
  try {
    await db.delete(hotelRateSeasons).where(eq(hotelRateSeasons.id, id));
    revalidatePath(`/admin/hotels/${hotelId}/seasons`);
    return { success: true };
  } catch (error) {
    console.error("deleteSeason error:", error);
    return { success: false, error: "Failed to delete" };
  }
}
