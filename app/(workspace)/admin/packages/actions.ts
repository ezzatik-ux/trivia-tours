"use server";

import { db } from "@/lib/db";
import { packages, countries, packageDays, packageImages } from "@/lib/db/schema";
import { eq, desc, asc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-utils";

const ROLES = ["OPS", "PRODUCT", "ADMIN"] as const;

export type PackageInput = {
  name: string;
  slug: string;
  countryId: string;
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
  title: string;
  description?: string | null;
  locationName?: string | null;
};

export type PackageImageInput = {
  url: string;
  isCover: boolean;
  sortOrder: number;
};

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
      countryId: packages.countryId,
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

export async function createPackage(input: PackageInput) {
  const user = await requireRole([...ROLES]);

  const validationError = validatePackageInput(input);
  if (validationError) {
    return { success: false as const, error: validationError };
  }

  try {
    await db.insert(packages).values({
      name: input.name.trim(),
      slug: input.slug.trim(),
      countryId: input.countryId,
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

  try {
    await db
      .update(packages)
      .set({
        name: input.name.trim(),
        slug: input.slug.trim(),
        countryId: input.countryId,
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

  return db
    .select({
      dayNumber: packageDays.dayNumber,
      title: packageDays.title,
      description: packageDays.description,
      locationName: packageDays.locationName,
    })
    .from(packageDays)
    .where(eq(packageDays.packageId, packageId))
    .orderBy(asc(packageDays.dayNumber));
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
      await tx
        .delete(packageDays)
        .where(eq(packageDays.packageId, packageId));
      if (days.length > 0) {
        await tx.insert(packageDays).values(
          days.map((d, i) => ({
            packageId,
            dayNumber: i + 1,
            title: d.title.trim(),
            description: d.description?.trim() || null,
            locationName: d.locationName?.trim() || null,
          }))
        );
      }
    });

    revalidatePath(`/admin/packages/${packageId}/edit`);
    revalidatePath("/admin/packages");
    return { success: true as const };
  } catch (error) {
    console.error("savePackageDays error:", error);
    return { success: false as const, error: "Failed to save itinerary" };
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
