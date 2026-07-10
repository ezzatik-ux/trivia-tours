"use server";

import { db } from "@/lib/db";
import {
  packages,
  packageDays,
  packageImages,
  packageRates,
  countries,
} from "@/lib/db/schema";
import { eq, and, asc, sql } from "drizzle-orm";
import { requireAuth } from "@/lib/auth-utils";

/**
 * Agent-facing package detail by slug.
 * Returns null if missing or not ACTIVE (drafts not viewable).
 */
export async function getPackageDetailBySlug(slug: string) {
  await requireAuth();

  const [pkg] = await db
    .select()
    .from(packages)
    .where(eq(packages.slug, slug))
    .limit(1);

  if (!pkg) return null;
  if (pkg.status !== "ACTIVE") return null;

  const [days, images, countryRows, priceRows] = await Promise.all([
    db
      .select({
        id: packageDays.id,
        dayNumber: packageDays.dayNumber,
        title: packageDays.title,
        description: packageDays.description,
        locationName: packageDays.locationName,
      })
      .from(packageDays)
      .where(eq(packageDays.packageId, pkg.id))
      .orderBy(asc(packageDays.dayNumber)),

    db
      .select({
        id: packageImages.id,
        url: packageImages.url,
        altText: packageImages.altText,
        isCover: packageImages.isCover,
        sortOrder: packageImages.sortOrder,
      })
      .from(packageImages)
      .where(eq(packageImages.packageId, pkg.id))
      .orderBy(asc(packageImages.sortOrder)),

    db
      .select({
        name: countries.name,
        code: countries.code,
      })
      .from(countries)
      .where(eq(countries.id, pkg.countryId))
      .limit(1),

    // Mirror searchProducts: MIN(sellAdult) among active rates with validTo >= CURRENT_DATE
    db
      .select({
        fromPrice: sql<string | null>`MIN(${packageRates.sellAdult})`.as(
          "from_price"
        ),
      })
      .from(packageRates)
      .where(
        and(
          eq(packageRates.packageId, pkg.id),
          eq(packageRates.isActive, true),
          sql`${packageRates.validTo} >= CURRENT_DATE`
        )
      ),
  ]);

  const country = countryRows[0] ?? null;

  return {
    id: pkg.id,
    name: pkg.name,
    slug: pkg.slug,
    shortDesc: pkg.shortDesc,
    overview: pkg.overview,
    durationDays: pkg.durationDays,
    durationNights: pkg.durationNights,
    inclusions: pkg.inclusions ?? [],
    exclusions: pkg.exclusions ?? [],
    highlights: pkg.highlights ?? [],
    cancellationPolicy: pkg.cancellationPolicy,
    importantInfo: pkg.importantInfo,
    countryName: country?.name ?? null,
    countryCode: country?.code ?? null,
    days,
    images,
    fromPrice: priceRows[0]?.fromPrice ?? null,
  };
}
