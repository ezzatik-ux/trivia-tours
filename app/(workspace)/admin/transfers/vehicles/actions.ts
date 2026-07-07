"use server";

import { db } from "@/lib/db";
import { transferVehicleClasses } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-utils";

const ROLES = ["OPS", "PRODUCT", "ADMIN"] as const;

export type VehicleClassInput = {
  name: string;
  tier: number;
  exampleModels?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  maxPax: number;
  maxLuggage?: number | null;
  amenities: string[];
  driverLanguages: string[];
};

export async function getVehicleClasses() {
  await requireRole([...ROLES]);
  return db
    .select()
    .from(transferVehicleClasses)
    .orderBy(asc(transferVehicleClasses.tier), asc(transferVehicleClasses.sortOrder), asc(transferVehicleClasses.name));
}

export async function createVehicleClass(input: VehicleClassInput) {
  await requireRole([...ROLES]);
  try {
    if (!input.name.trim()) return { success: false, error: "Name is required" };
    await db.insert(transferVehicleClasses).values({
      name: input.name.trim(),
      tier: input.tier,
      exampleModels: input.exampleModels?.trim() || null,
      description: input.description?.trim() || null,
      imageUrl: input.imageUrl?.trim() || null,
      maxPax: input.maxPax,
      maxLuggage: input.maxLuggage ?? null,
      amenities: input.amenities,
      driverLanguages: input.driverLanguages,
    });
    revalidatePath("/admin/transfers/vehicles");
    return { success: true };
  } catch (e) {
    console.error("createVehicleClass error:", e);
    return { success: false, error: "Failed to create vehicle class" };
  }
}

export async function updateVehicleClass(
  id: string,
  input: VehicleClassInput & { isActive: boolean }
) {
  await requireRole([...ROLES]);
  try {
    await db
      .update(transferVehicleClasses)
      .set({
        name: input.name.trim(),
        tier: input.tier,
        exampleModels: input.exampleModels?.trim() || null,
        description: input.description?.trim() || null,
        imageUrl: input.imageUrl?.trim() || null,
        maxPax: input.maxPax,
        maxLuggage: input.maxLuggage ?? null,
        amenities: input.amenities,
        driverLanguages: input.driverLanguages,
        isActive: input.isActive,
        updatedAt: new Date(),
      })
      .where(eq(transferVehicleClasses.id, id));
    revalidatePath("/admin/transfers/vehicles");
    return { success: true };
  } catch (e) {
    console.error("updateVehicleClass error:", e);
    return { success: false, error: "Failed to update vehicle class" };
  }
}

export async function deleteVehicleClass(id: string) {
  await requireRole([...ROLES]);
  try {
    await db.delete(transferVehicleClasses).where(eq(transferVehicleClasses.id, id));
    revalidatePath("/admin/transfers/vehicles");
    return { success: true };
  } catch {
    return { success: false, error: "Cannot delete — class may be used by a rate" };
  }
}
