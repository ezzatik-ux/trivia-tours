"use server";

import { db } from "@/lib/db";
import { cities, countries } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-utils";

const ROLES = ["OPS", "PRODUCT", "ADMIN"] as const;

export type CityInput = {
  name: string;
  countryId: string;
  code?: string | null;
};

function isUniqueViolation(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const e = error as { code?: string; cause?: { code?: string }; message?: string };
  if (e.code === "23505" || e.cause?.code === "23505") return true;
  const msg = (e.message ?? "").toLowerCase();
  return msg.includes("unique") || msg.includes("duplicate");
}

function isForeignKeyViolation(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const e = error as { code?: string; cause?: { code?: string }; message?: string };
  if (e.code === "23503" || e.cause?.code === "23503") return true;
  const msg = (e.message ?? "").toLowerCase();
  return msg.includes("foreign key") || msg.includes("violates foreign key");
}

function validateCity(input: CityInput): string | null {
  if (!input.name?.trim()) return "Name is required";
  if (!input.countryId) return "Country is required";
  const code = input.code?.trim();
  if (code && !/^[A-Za-z]{3}$/.test(code)) return "Code must be 3 letters";
  return null;
}

export async function getCities() {
  await requireRole([...ROLES]);

  return db
    .select({
      id: cities.id,
      name: cities.name,
      code: cities.code,
      countryId: cities.countryId,
      countryName: countries.name,
      countryCode: countries.code,
      isActive: cities.isActive,
    })
    .from(cities)
    .leftJoin(countries, eq(cities.countryId, countries.id))
    .orderBy(asc(countries.name), asc(cities.name));
}

export async function getCountriesForCities() {
  await requireRole([...ROLES]);

  return db
    .select({
      id: countries.id,
      code: countries.code,
      name: countries.name,
    })
    .from(countries)
    .where(eq(countries.isActive, true))
    .orderBy(countries.name);
}

export async function createCity(input: CityInput) {
  await requireRole([...ROLES]);

  const validationError = validateCity(input);
  if (validationError) {
    return { success: false as const, error: validationError };
  }

  try {
    await db.insert(cities).values({
      name: input.name.trim(),
      countryId: input.countryId,
      code: input.code?.trim()?.toUpperCase() || null,
    });
    revalidatePath("/admin/cities");
    return { success: true as const };
  } catch (error) {
    console.error("createCity error:", error);
    if (isUniqueViolation(error)) {
      return {
        success: false as const,
        error: "That code is already used by another city",
      };
    }
    return { success: false as const, error: "Failed to create city" };
  }
}

export async function updateCity(id: string, input: CityInput & { isActive: boolean }) {
  await requireRole([...ROLES]);

  const validationError = validateCity(input);
  if (validationError) {
    return { success: false as const, error: validationError };
  }

  try {
    await db
      .update(cities)
      .set({
        name: input.name.trim(),
        countryId: input.countryId,
        code: input.code?.trim()?.toUpperCase() || null,
        isActive: input.isActive,
      })
      .where(eq(cities.id, id));
    revalidatePath("/admin/cities");
    return { success: true as const };
  } catch (error) {
    console.error("updateCity error:", error);
    if (isUniqueViolation(error)) {
      return {
        success: false as const,
        error: "That code is already used by another city",
      };
    }
    return { success: false as const, error: "Failed to update city" };
  }
}

export async function deleteCity(id: string) {
  await requireRole([...ROLES]);

  try {
    await db.delete(cities).where(eq(cities.id, id));
    revalidatePath("/admin/cities");
    return { success: true as const };
  } catch (error) {
    console.error("deleteCity error:", error);
    if (isForeignKeyViolation(error)) {
      return {
        success: false as const,
        error: "Cannot delete — city may be used by a package",
      };
    }
    return { success: false as const, error: "Failed to delete city" };
  }
}
