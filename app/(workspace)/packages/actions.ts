"use server";

import { db } from "@/lib/db";
import { packages, packageRates, countries } from "@/lib/db/schema";
import { eq, sql, and, asc, desc, gte, lte } from "drizzle-orm";
import { requireAuth } from "@/lib/auth-utils";

export type PackageBrowseFilters = {
  search?: string;
  countryId?: string;
  durationBucket?: "1-3" | "4-7" | "8-14" | "15+";
  minPrice?: number;
  maxPrice?: number;
  sort?: "price-asc" | "price-desc" | "duration-asc" | "name-asc" | "newest";
};

const DURATION_BUCKETS: Record<
  NonNullable<PackageBrowseFilters["durationBucket"]>,
  { min: number; max: number | null }
> = {
  "1-3": { min: 1, max: 3 },
  "4-7": { min: 4, max: 7 },
  "8-14": { min: 8, max: 14 },
  "15+": { min: 15, max: null },
};

/**
 * Browse ACTIVE packages with cover image + "from" sell price.
 * Mirrors searchProducts: MIN(sellAdult) among active rates with validTo >= CURRENT_DATE.
 *
 * Backward-compatible: accepts either a plain search string (legacy callers) or a
 * filters object. Price filtering is applied in JS on the correlated fromPrice
 * subquery result (see note below); all other filters + sort are applied in SQL.
 */
export async function getPackagesForBrowse(
  filters?: string | PackageBrowseFilters
) {
  await requireAuth();

  const f: PackageBrowseFilters =
    typeof filters === "string" ? { search: filters } : filters ?? {};

  const conditions = [eq(packages.status, "ACTIVE")];

  if (f.search?.trim()) {
    const term = `%${f.search.trim().toLowerCase()}%`;
    conditions.push(sql`LOWER(${packages.name}) LIKE ${term}`);
  }

  if (f.countryId) {
    conditions.push(eq(packages.countryId, f.countryId));
  }

  if (f.durationBucket) {
    const bucket = DURATION_BUCKETS[f.durationBucket];
    conditions.push(gte(packages.durationDays, bucket.min));
    if (bucket.max != null) {
      conditions.push(lte(packages.durationDays, bucket.max));
    }
  }

  // ORDER BY (mirrors product-browse sort). fromPrice referenced via its alias.
  let orderClause;
  switch (f.sort) {
    case "price-asc":
      orderClause = sql`from_price ASC NULLS LAST`;
      break;
    case "price-desc":
      orderClause = sql`from_price DESC NULLS LAST`;
      break;
    case "duration-asc":
      orderClause = sql`${packages.durationDays} ASC NULLS LAST`;
      break;
    case "newest":
      orderClause = desc(packages.createdAt);
      break;
    case "name-asc":
    default:
      orderClause = asc(packages.name);
      break;
  }

  const result = await db
    .select({
      id: packages.id,
      name: packages.name,
      slug: packages.slug,
      shortDesc: packages.shortDesc,
      durationDays: packages.durationDays,
      countryId: packages.countryId,
      countryName: countries.name,
      countryCode: countries.code,
      coverImage: sql<string | null>`(
        SELECT url FROM package_images
        WHERE package_images.package_id = ${packages.id}
        ORDER BY package_images.is_cover DESC, package_images.sort_order ASC
        LIMIT 1
      )`.as("cover_image"),
      fromPrice: sql<string | null>`(
        SELECT MIN(${packageRates.sellAdult})
        FROM ${packageRates}
        WHERE ${packageRates.packageId} = ${packages.id}
        AND ${packageRates.isActive} = true
        AND ${packageRates.validTo} >= CURRENT_DATE
      )`.as("from_price"),
    })
    .from(packages)
    .leftJoin(countries, eq(packages.countryId, countries.id))
    .where(and(...conditions))
    .orderBy(orderClause);

  // Price filtering in JS: fromPrice is a correlated subquery alias, so filtering
  // it in SQL would require a HAVING/wrapping subquery. Given the small catalog,
  // filtering here keeps the query clean and preserves the SQL ORDER BY.
  const hasMin = typeof f.minPrice === "number" && !Number.isNaN(f.minPrice);
  const hasMax = typeof f.maxPrice === "number" && !Number.isNaN(f.maxPrice);
  if (!hasMin && !hasMax) return result;

  return result.filter((row) => {
    if (row.fromPrice == null) return false;
    const price = parseFloat(row.fromPrice);
    if (hasMin && price < (f.minPrice as number)) return false;
    if (hasMax && price > (f.maxPrice as number)) return false;
    return true;
  });
}

/**
 * Countries that have at least one ACTIVE package — used to populate the
 * country filter so it only lists countries with browsable packages.
 */
export async function getCountriesForBrowse() {
  await requireAuth();

  return db
    .selectDistinct({
      id: countries.id,
      name: countries.name,
      code: countries.code,
    })
    .from(countries)
    .innerJoin(
      packages,
      and(eq(packages.countryId, countries.id), eq(packages.status, "ACTIVE"))
    )
    .orderBy(asc(countries.name));
}
