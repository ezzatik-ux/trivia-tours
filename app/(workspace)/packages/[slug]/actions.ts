"use server";

import { db } from "@/lib/db";
import {
  packages,
  packageDays,
  packageDayImages,
  packageImages,
  packageRates,
  packageAccommodations,
  packageAccommodationImages,
  countries,
} from "@/lib/db/schema";
import {
  eq,
  and,
  asc,
  sql,
  inArray,
  gte as gteOp,
  lte as lteOp,
} from "drizzle-orm";
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

  const dayIds = days.map((d) => d.id);
  const dayImageRows = dayIds.length
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
  for (const row of dayImageRows) {
    const list = imagesByDay.get(row.dayId) ?? [];
    list.push({
      url: row.url,
      isCover: row.isCover,
      sortOrder: row.sortOrder ?? 0,
    });
    imagesByDay.set(row.dayId, list);
  }

  const daysWithImages = days.map((d) => ({
    ...d,
    images: imagesByDay.get(d.id) ?? [],
  }));

  const accommodations = await db
    .select({
      id: packageAccommodations.id,
      hotelName: packageAccommodations.hotelName,
      cityName: packageAccommodations.cityName,
      nights: packageAccommodations.nights,
      boardBasis: packageAccommodations.boardBasis,
      startDate: packageAccommodations.startDate,
      roomType: packageAccommodations.roomType,
    })
    .from(packageAccommodations)
    .where(eq(packageAccommodations.packageId, pkg.id))
    .orderBy(asc(packageAccommodations.sortOrder));

  const accIds = accommodations.map((a) => a.id);
  const accImageRows = accIds.length
    ? await db
        .select({
          accommodationId: packageAccommodationImages.accommodationId,
          url: packageAccommodationImages.url,
          isCover: packageAccommodationImages.isCover,
          sortOrder: packageAccommodationImages.sortOrder,
        })
        .from(packageAccommodationImages)
        .where(inArray(packageAccommodationImages.accommodationId, accIds))
        .orderBy(asc(packageAccommodationImages.sortOrder))
    : [];

  const imagesByAcc = new Map<
    string,
    { url: string; isCover: boolean; sortOrder: number }[]
  >();
  for (const row of accImageRows) {
    const list = imagesByAcc.get(row.accommodationId) ?? [];
    list.push({
      url: row.url,
      isCover: row.isCover,
      sortOrder: row.sortOrder ?? 0,
    });
    imagesByAcc.set(row.accommodationId, list);
  }

  const accommodationsWithImages = accommodations.map((a) => ({
    ...a,
    images: imagesByAcc.get(a.id) ?? [],
  }));

  return {
    id: pkg.id,
    name: pkg.name,
    slug: pkg.slug,
    code: pkg.code,
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
    days: daysWithImages,
    accommodations: accommodationsWithImages,
    images,
    fromPrice: priceRows[0]?.fromPrice ?? null,
  };
}

/**
 * Cheapest active package rate covering the travel date.
 * Mirrors getApplicableRate (no supplier / infant).
 */
export async function getApplicablePackageRate(
  packageId: string,
  travelDate: string
) {
  await requireAuth();

  const result = await db
    .select({
      id: packageRates.id,
      sellAdult: packageRates.sellAdult,
      sellChild: packageRates.sellChild,
      minPax: packageRates.minPax,
      maxPax: packageRates.maxPax,
      childAgeMin: packageRates.childAgeMin,
      childAgeMax: packageRates.childAgeMax,
      validFrom: packageRates.validFrom,
      validTo: packageRates.validTo,
    })
    .from(packageRates)
    .where(
      and(
        eq(packageRates.packageId, packageId),
        eq(packageRates.isActive, true),
        lteOp(packageRates.validFrom, travelDate),
        gteOp(packageRates.validTo, travelDate)
      )
    )
    .orderBy(packageRates.sellAdult)
    .limit(1);

  return result[0] ?? null;
}

export type PackageQuoteCalculation = {
  unitAdult: number;
  unitChild: number;
  adults: number;
  children: number;
  totalPax: number;
  totalPrice: number;
  childAgeMin: number | null;
  childAgeMax: number | null;
};

/**
 * Server-side package quote. Total is always recomputed here — never trust client.
 */
export async function calculatePackageQuote(
  packageId: string,
  travelDate: string,
  adults: number,
  children: number
): Promise<{
  success: boolean;
  quote?: PackageQuoteCalculation;
  error?: string;
}> {
  await requireAuth();

  if (adults < 1) {
    return { success: false, error: "At least 1 adult required." };
  }

  const rate = await getApplicablePackageRate(packageId, travelDate);
  if (!rate) {
    return {
      success: false,
      error: "No active rates available for this date. Try another date.",
    };
  }

  const totalPax = adults + children;

  if (rate.minPax && totalPax < rate.minPax) {
    return {
      success: false,
      error: `Minimum ${rate.minPax} passenger${rate.minPax > 1 ? "s" : ""} required for this rate`,
    };
  }

  if (rate.maxPax && totalPax > rate.maxPax) {
    return {
      success: false,
      error: `Maximum ${rate.maxPax} passengers allowed for this rate`,
    };
  }

  const unitAdult = parseFloat(rate.sellAdult);
  const unitChild = parseFloat(rate.sellChild);
  const totalPrice =
    Math.round((adults * unitAdult + children * unitChild) * 100) / 100;

  return {
    success: true,
    quote: {
      unitAdult,
      unitChild,
      adults,
      children,
      totalPax,
      totalPrice,
      childAgeMin: rate.childAgeMin,
      childAgeMax: rate.childAgeMax,
    },
  };
}
