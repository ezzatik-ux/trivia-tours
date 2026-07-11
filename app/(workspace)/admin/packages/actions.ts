"use server";

import { db } from "@/lib/db";
import { packages, countries, cities, packageDays, packageImages, packageDayImages, packageRates } from "@/lib/db/schema";
import { eq, desc, asc, and, inArray, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-utils";

const ROLES = ["OPS", "PRODUCT", "ADMIN"] as const;

export type PackageInput = {
  name: string;
  slug: string;
  countryId: string;
  cityId?: string | null;
  shortDesc?: string | null;
  overview?: string | null;
  durationDays: number;
  durationNights?: number | null;
  inclusions: string[];
  exclusions: string[];
  highlights: string[];
  cancellationPolicy?: string | null;
  importantInfo?: string | null;
  status: "DRAFT" | "ACTIVE" | "INACTIVE";
};

export type PackageDayInput = {
  id?: string; // present = existing day; absent = new day
  title: string;
  description?: string | null;
  locationName?: string | null;
};

export type PackageImageInput = {
  url: string;
  isCover: boolean;
  sortOrder: number;
};

export type PackageRateInput = {
  label?: string | null;
  netAdult: number | string;
  netChild: number | string;
  markupPct: number | string;
  validFrom: string;
  validTo: string;
  minPax: number;
  maxPax?: number | null;
  childAgeMin: number;
  childAgeMax: number;
  isActive: boolean;
};

function computeSell(net: number, markupPct: number): string {
  return (net * (1 + markupPct / 100)).toFixed(2);
}

function validatePackageRateInput(input: PackageRateInput): string | null {
  const netAdult = Number(input.netAdult);
  const netChild = Number(input.netChild);
  const markupPct = Number(input.markupPct);

  if (!Number.isFinite(netAdult) || netAdult < 0) {
    return "Adult net price cannot be negative";
  }
  if (!Number.isFinite(netChild) || netChild < 0) {
    return "Child net price cannot be negative";
  }
  if (!Number.isFinite(markupPct) || markupPct < 0) {
    return "Markup cannot be negative";
  }
  if (!input.validFrom || !input.validTo) {
    return "Valid from and valid to dates are required";
  }
  if (input.validFrom > input.validTo) {
    return "Valid from must be on or before valid to";
  }
  if (!Number.isFinite(input.minPax) || input.minPax < 1) {
    return "Minimum pax must be at least 1";
  }
  if (
    input.maxPax != null &&
    (!Number.isFinite(input.maxPax) || input.maxPax < input.minPax)
  ) {
    return "Maximum pax must be greater than or equal to minimum pax";
  }
  if (!Number.isFinite(input.childAgeMin) || input.childAgeMin < 0) {
    return "Child age min cannot be negative";
  }
  if (
    !Number.isFinite(input.childAgeMax) ||
    input.childAgeMax < input.childAgeMin
  ) {
    return "Child age max must be greater than or equal to child age min";
  }
  return null;
}

function isUniqueViolation(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const e = error as { code?: string; cause?: { code?: string }; message?: string };
  if (e.code === "23505" || e.cause?.code === "23505") return true;
  const msg = (e.message ?? "").toLowerCase();
  return msg.includes("unique") || msg.includes("duplicate");
}

function validatePackageInput(input: PackageInput): string | null {
  if (!input.name?.trim()) return "Package name is required";
  if (!input.slug?.trim()) return "Slug is required";
  if (!input.countryId) return "Country is required";
  if (!Number.isFinite(input.durationDays) || input.durationDays < 1) {
    return "Duration must be at least 1 day";
  }
  return null;
}

export async function getPackages() {
  await requireRole([...ROLES]);

  return db
    .select({
      id: packages.id,
      name: packages.name,
      slug: packages.slug,
      code: packages.code,
      countryName: countries.name,
      durationDays: packages.durationDays,
      status: packages.status,
      updatedAt: packages.updatedAt,
    })
    .from(packages)
    .leftJoin(countries, eq(packages.countryId, countries.id))
    .orderBy(desc(packages.createdAt));
}

export async function getPackageById(id: string) {
  await requireRole([...ROLES]);

  const [row] = await db
    .select({
      id: packages.id,
      name: packages.name,
      slug: packages.slug,
      code: packages.code,
      countryId: packages.countryId,
      cityId: packages.cityId,
      shortDesc: packages.shortDesc,
      overview: packages.overview,
      durationDays: packages.durationDays,
      durationNights: packages.durationNights,
      inclusions: packages.inclusions,
      exclusions: packages.exclusions,
      highlights: packages.highlights,
      cancellationPolicy: packages.cancellationPolicy,
      importantInfo: packages.importantInfo,
      status: packages.status,
      createdBy: packages.createdBy,
      updatedBy: packages.updatedBy,
      createdAt: packages.createdAt,
      updatedAt: packages.updatedAt,
    })
    .from(packages)
    .where(eq(packages.id, id))
    .limit(1);

  return row ?? null;
}

export async function getCountriesForPackages() {
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

export async function getCitiesForPackages() {
  await requireRole([...ROLES]);

  return db
    .select({
      id: cities.id,
      name: cities.name,
      code: cities.code,
      countryId: cities.countryId,
    })
    .from(cities)
    .where(eq(cities.isActive, true))
    .orderBy(cities.name);
}

async function validateCityBelongsToCountry(
  cityId: string,
  countryId: string
): Promise<boolean> {
  const [row] = await db
    .select({ countryId: cities.countryId })
    .from(cities)
    .where(eq(cities.id, cityId))
    .limit(1);
  return !!row && row.countryId === countryId;
}

/**
 * Builds a package code: {CITY_CODE}{DURATION}D FP {SERIAL} with no spaces,
 * e.g. DPS + 8 + D + FP + 001 => "DPS8DFP001".
 * Returns null when the city has no code (caller surfaces a friendly error).
 * The sequence value is consumed on generation; a skipped serial is acceptable
 * (sequences are not gap-free) and is never reclaimed.
 */
async function generatePackageCode(
  cityId: string,
  durationDays: number
): Promise<string | null> {
  const [cityRow] = await db
    .select({ code: cities.code })
    .from(cities)
    .where(eq(cities.id, cityId))
    .limit(1);

  const cityCode = cityRow?.code?.trim();
  if (!cityCode) return null;

  const rows = await db.execute(sql`SELECT nextval('package_code_seq') AS n`);
  const n = Number((rows as unknown as Array<{ n: number | string }>)[0].n);

  return `${cityCode.toUpperCase()}${durationDays}DFP${String(n).padStart(3, "0")}`;
}

export async function createPackage(input: PackageInput) {
  const user = await requireRole([...ROLES]);

  const validationError = validatePackageInput(input);
  if (validationError) {
    return { success: false as const, error: validationError };
  }

  if (!input.cityId) {
    return { success: false as const, error: "City is required" };
  }

  {
    const ok = await validateCityBelongsToCountry(input.cityId, input.countryId);
    if (!ok) {
      return {
        success: false as const,
        error: "Selected city does not belong to the chosen country",
      };
    }
  }

  try {
    const generatedCode = await generatePackageCode(
      input.cityId,
      input.durationDays
    );
    if (!generatedCode) {
      return {
        success: false as const,
        error:
          "Selected city has no code — set a 3-letter code in Manage Cities first",
      };
    }

    await db.insert(packages).values({
      name: input.name.trim(),
      slug: input.slug.trim(),
      code: generatedCode,
      countryId: input.countryId,
      cityId: input.cityId ?? null,
      shortDesc: input.shortDesc?.trim() || null,
      overview: input.overview?.trim() || null,
      durationDays: input.durationDays,
      durationNights: input.durationNights ?? null,
      inclusions: input.inclusions ?? [],
      exclusions: input.exclusions ?? [],
      highlights: input.highlights ?? [],
      cancellationPolicy: input.cancellationPolicy?.trim() || null,
      importantInfo: input.importantInfo?.trim() || null,
      status: input.status,
      createdBy: user.id,
    });

    revalidatePath("/admin/packages");
    return { success: true as const };
  } catch (error) {
    console.error("createPackage error:", error);
    if (isUniqueViolation(error)) {
      return {
        success: false as const,
        error: "A package with this slug already exists.",
      };
    }
    return { success: false as const, error: "Failed to create package" };
  }
}

export async function updatePackage(id: string, input: PackageInput) {
  const user = await requireRole([...ROLES]);

  const validationError = validatePackageInput(input);
  if (validationError) {
    return { success: false as const, error: validationError };
  }

  if (!input.cityId) {
    return { success: false as const, error: "City is required" };
  }

  {
    const ok = await validateCityBelongsToCountry(input.cityId, input.countryId);
    if (!ok) {
      return {
        success: false as const,
        error: "Selected city does not belong to the chosen country",
      };
    }
  }

  try {
    const [current] = await db
      .select({ code: packages.code })
      .from(packages)
      .where(eq(packages.id, id))
      .limit(1);

    let generatedCode: string | null = null;
    if (current && !current.code) {
      generatedCode = await generatePackageCode(
        input.cityId,
        input.durationDays
      );
      if (!generatedCode) {
        return {
          success: false as const,
          error:
            "Selected city has no code — set a 3-letter code in Manage Cities first",
        };
      }
    }

    await db
      .update(packages)
      .set({
        name: input.name.trim(),
        slug: input.slug.trim(),
        ...(generatedCode ? { code: generatedCode } : {}),
        countryId: input.countryId,
        cityId: input.cityId ?? null,
        shortDesc: input.shortDesc?.trim() || null,
        overview: input.overview?.trim() || null,
        durationDays: input.durationDays,
        durationNights: input.durationNights ?? null,
        inclusions: input.inclusions ?? [],
        exclusions: input.exclusions ?? [],
        highlights: input.highlights ?? [],
        cancellationPolicy: input.cancellationPolicy?.trim() || null,
        importantInfo: input.importantInfo?.trim() || null,
        status: input.status,
        updatedBy: user.id,
        updatedAt: new Date(),
      })
      .where(eq(packages.id, id));

    revalidatePath("/admin/packages");
    revalidatePath(`/admin/packages/${id}/edit`);
    return { success: true as const };
  } catch (error) {
    console.error("updatePackage error:", error);
    if (isUniqueViolation(error)) {
      return {
        success: false as const,
        error: "A package with this slug already exists.",
      };
    }
    return { success: false as const, error: "Failed to update package" };
  }
}

export async function deletePackage(id: string) {
  await requireRole([...ROLES]);

  try {
    await db.delete(packages).where(eq(packages.id, id));
    revalidatePath("/admin/packages");
    return { success: true as const };
  } catch (error) {
    console.error("deletePackage error:", error);
    return { success: false as const, error: "Failed to delete package" };
  }
}

export async function getPackageDays(packageId: string) {
  await requireRole([...ROLES]);

  const days = await db
    .select({
      id: packageDays.id,
      dayNumber: packageDays.dayNumber,
      title: packageDays.title,
      description: packageDays.description,
      locationName: packageDays.locationName,
    })
    .from(packageDays)
    .where(eq(packageDays.packageId, packageId))
    .orderBy(asc(packageDays.dayNumber));

  const dayIds = days.map((d) => d.id);

  const imageRows = dayIds.length
    ? await db
        .select({
          dayId: packageDayImages.dayId,
          url: packageDayImages.url,
          isCover: packageDayImages.isCover,
          sortOrder: packageDayImages.sortOrder,
        })
        .from(packageDayImages)
        .where(inArray(packageDayImages.dayId, dayIds))
        .orderBy(asc(packageDayImages.sortOrder))
    : [];

  const imagesByDay = new Map<
    string,
    { url: string; isCover: boolean; sortOrder: number }[]
  >();
  for (const row of imageRows) {
    const list = imagesByDay.get(row.dayId) ?? [];
    list.push({
      url: row.url,
      isCover: row.isCover,
      sortOrder: row.sortOrder ?? 0,
    });
    imagesByDay.set(row.dayId, list);
  }

  return days.map((d) => ({
    ...d,
    images: imagesByDay.get(d.id) ?? [],
  }));
}

export async function savePackageDays(
  packageId: string,
  days: PackageDayInput[]
) {
  await requireRole([...ROLES]);

  for (const day of days) {
    if (!day.title?.trim()) {
      return {
        success: false as const,
        error: "Every day needs a title",
      };
    }
  }

  try {
    await db.transaction(async (tx) => {
      const existing = await tx
        .select({ id: packageDays.id })
        .from(packageDays)
        .where(eq(packageDays.packageId, packageId));
      const existingIds = new Set(existing.map((r) => r.id));

      const incomingIds = new Set(
        days.map((d) => d.id).filter((id): id is string => !!id)
      );

      // Delete removed days (cascade removes their images — correct).
      const toDelete = [...existingIds].filter((id) => !incomingIds.has(id));
      if (toDelete.length > 0) {
        await tx
          .delete(packageDays)
          .where(
            and(
              eq(packageDays.packageId, packageId),
              inArray(packageDays.id, toDelete)
            )
          );
      }

      // PHASE 1 — park existing rows at 1000+i, insert new rows at final i+1.
      // Existing (1000+) and new (1..n) ranges are disjoint → no collision.
      for (let i = 0; i < days.length; i++) {
        const d = days[i];
        const title = d.title.trim();
        const description = d.description?.trim() || null;
        const locationName = d.locationName?.trim() || null;

        if (d.id && existingIds.has(d.id)) {
          await tx
            .update(packageDays)
            .set({ dayNumber: 1000 + i, title, description, locationName })
            .where(
              and(
                eq(packageDays.id, d.id),
                eq(packageDays.packageId, packageId)
              )
            );
        } else {
          await tx.insert(packageDays).values({
            packageId,
            dayNumber: i + 1,
            title,
            description,
            locationName,
          });
        }
      }

      // PHASE 2 — bring parked existing rows down to their final i+1.
      // Each array index maps to exactly one row, so each final number is
      // claimed once → collision-free without a deferrable constraint.
      for (let i = 0; i < days.length; i++) {
        const d = days[i];
        if (d.id && existingIds.has(d.id)) {
          await tx
            .update(packageDays)
            .set({ dayNumber: i + 1 })
            .where(
              and(
                eq(packageDays.id, d.id),
                eq(packageDays.packageId, packageId)
              )
            );
        }
      }
    });

    const savedDays = await db
      .select({
        id: packageDays.id,
        dayNumber: packageDays.dayNumber,
        title: packageDays.title,
        description: packageDays.description,
        locationName: packageDays.locationName,
      })
      .from(packageDays)
      .where(eq(packageDays.packageId, packageId))
      .orderBy(asc(packageDays.dayNumber));

    revalidatePath(`/admin/packages/${packageId}/edit`);
    revalidatePath("/admin/packages");
    return { success: true as const, days: savedDays };
  } catch (error) {
    console.error("savePackageDays error:", error);
    return { success: false as const, error: "Failed to save itinerary" };
  }
}

export async function savePackageDayImages(
  dayId: string,
  images: PackageImageInput[]
) {
  await requireRole([...ROLES]);

  const [day] = await db
    .select({ id: packageDays.id, packageId: packageDays.packageId })
    .from(packageDays)
    .where(eq(packageDays.id, dayId))
    .limit(1);

  if (!day) {
    return { success: false as const, error: "Day not found" };
  }

  try {
    const normalized = images.map((img, idx) => ({
      url: img.url,
      isCover: img.isCover,
      sortOrder: idx,
    }));

    if (normalized.length > 0) {
      const firstCoverIdx = normalized.findIndex((img) => img.isCover);
      if (firstCoverIdx === -1) {
        normalized[0].isCover = true;
      } else {
        for (let i = 0; i < normalized.length; i++) {
          normalized[i].isCover = i === firstCoverIdx;
        }
      }
    }

    await db.transaction(async (tx) => {
      await tx
        .delete(packageDayImages)
        .where(eq(packageDayImages.dayId, dayId));
      if (normalized.length > 0) {
        await tx.insert(packageDayImages).values(
          normalized.map((img) => ({
            dayId,
            url: img.url,
            isCover: img.isCover,
            sortOrder: img.sortOrder,
          }))
        );
      }
    });

    revalidatePath(`/admin/packages/${day.packageId}/edit`);
    return { success: true as const };
  } catch (error) {
    console.error("savePackageDayImages error:", error);
    return { success: false as const, error: "Failed to save day images" };
  }
}

export async function getPackageImages(packageId: string) {
  await requireRole([...ROLES]);

  return db
    .select({
      url: packageImages.url,
      isCover: packageImages.isCover,
      sortOrder: packageImages.sortOrder,
    })
    .from(packageImages)
    .where(eq(packageImages.packageId, packageId))
    .orderBy(asc(packageImages.sortOrder));
}

export async function savePackageImages(
  packageId: string,
  images: PackageImageInput[]
) {
  await requireRole([...ROLES]);

  try {
    const normalized = images.map((img, idx) => ({
      url: img.url,
      isCover: img.isCover,
      sortOrder: idx,
    }));

    if (normalized.length > 0) {
      const firstCoverIdx = normalized.findIndex((img) => img.isCover);
      if (firstCoverIdx === -1) {
        normalized[0].isCover = true;
      } else {
        for (let i = 0; i < normalized.length; i++) {
          normalized[i].isCover = i === firstCoverIdx;
        }
      }
    }

    await db.transaction(async (tx) => {
      await tx
        .delete(packageImages)
        .where(eq(packageImages.packageId, packageId));
      if (normalized.length > 0) {
        await tx.insert(packageImages).values(
          normalized.map((img) => ({
            packageId,
            url: img.url,
            isCover: img.isCover,
            sortOrder: img.sortOrder,
          }))
        );
      }
    });

    revalidatePath(`/admin/packages/${packageId}/edit`);
    revalidatePath("/admin/packages");
    return { success: true as const };
  } catch (error) {
    console.error("savePackageImages error:", error);
    return { success: false as const, error: "Failed to save images" };
  }
}

export async function getPackageRates(packageId: string) {
  await requireRole([...ROLES]);

  return db
    .select({
      id: packageRates.id,
      label: packageRates.label,
      netAdult: packageRates.netAdult,
      netChild: packageRates.netChild,
      markupPct: packageRates.markupPct,
      sellAdult: packageRates.sellAdult,
      sellChild: packageRates.sellChild,
      validFrom: packageRates.validFrom,
      validTo: packageRates.validTo,
      minPax: packageRates.minPax,
      maxPax: packageRates.maxPax,
      childAgeMin: packageRates.childAgeMin,
      childAgeMax: packageRates.childAgeMax,
      isActive: packageRates.isActive,
    })
    .from(packageRates)
    .where(eq(packageRates.packageId, packageId))
    .orderBy(asc(packageRates.validFrom));
}

export async function createPackageRate(
  packageId: string,
  input: PackageRateInput
) {
  const user = await requireRole([...ROLES]);

  const validationError = validatePackageRateInput(input);
  if (validationError) {
    return { success: false as const, error: validationError };
  }

  const netAdult = Number(input.netAdult);
  const netChild = Number(input.netChild);
  const markupPct = Number(input.markupPct);
  const sellAdult = computeSell(netAdult, markupPct);
  const sellChild = computeSell(netChild, markupPct);

  try {
    await db.insert(packageRates).values({
      packageId,
      label: input.label?.trim() || null,
      netAdult: netAdult.toString(),
      netChild: netChild.toString(),
      markupPct: markupPct.toString(),
      sellAdult,
      sellChild,
      validFrom: input.validFrom,
      validTo: input.validTo,
      minPax: input.minPax,
      maxPax: input.maxPax ?? null,
      childAgeMin: input.childAgeMin,
      childAgeMax: input.childAgeMax,
      isActive: input.isActive,
      createdBy: user.id,
    });

    revalidatePath(`/admin/packages/${packageId}/edit`);
    revalidatePath("/admin/packages");
    return { success: true as const };
  } catch (error) {
    console.error("createPackageRate error:", error);
    return { success: false as const, error: "Failed to create rate" };
  }
}

export async function updatePackageRate(id: string, input: PackageRateInput) {
  await requireRole([...ROLES]);

  const validationError = validatePackageRateInput(input);
  if (validationError) {
    return { success: false as const, error: validationError };
  }

  const netAdult = Number(input.netAdult);
  const netChild = Number(input.netChild);
  const markupPct = Number(input.markupPct);
  const sellAdult = computeSell(netAdult, markupPct);
  const sellChild = computeSell(netChild, markupPct);

  try {
    const [existing] = await db
      .select({ packageId: packageRates.packageId })
      .from(packageRates)
      .where(eq(packageRates.id, id))
      .limit(1);

    if (!existing) {
      return { success: false as const, error: "Rate not found" };
    }

    await db
      .update(packageRates)
      .set({
        label: input.label?.trim() || null,
        netAdult: netAdult.toString(),
        netChild: netChild.toString(),
        markupPct: markupPct.toString(),
        sellAdult,
        sellChild,
        validFrom: input.validFrom,
        validTo: input.validTo,
        minPax: input.minPax,
        maxPax: input.maxPax ?? null,
        childAgeMin: input.childAgeMin,
        childAgeMax: input.childAgeMax,
        isActive: input.isActive,
        updatedAt: new Date(),
      })
      .where(eq(packageRates.id, id));

    revalidatePath(`/admin/packages/${existing.packageId}/edit`);
    revalidatePath("/admin/packages");
    return { success: true as const };
  } catch (error) {
    console.error("updatePackageRate error:", error);
    return { success: false as const, error: "Failed to update rate" };
  }
}

export async function deletePackageRate(id: string) {
  await requireRole([...ROLES]);

  try {
    const [existing] = await db
      .select({ packageId: packageRates.packageId })
      .from(packageRates)
      .where(eq(packageRates.id, id))
      .limit(1);

    await db.delete(packageRates).where(eq(packageRates.id, id));

    if (existing) {
      revalidatePath(`/admin/packages/${existing.packageId}/edit`);
    }
    revalidatePath("/admin/packages");
    return { success: true as const };
  } catch (error) {
    console.error("deletePackageRate error:", error);
    return { success: false as const, error: "Failed to delete rate" };
  }
}
