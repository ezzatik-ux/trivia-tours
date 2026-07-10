"use server";

import { db } from "@/lib/db";
import { packages, packageRates, countries } from "@/lib/db/schema";
import { eq, sql, and, asc } from "drizzle-orm";
import { requireAuth } from "@/lib/auth-utils";

/**
 * Browse ACTIVE packages with cover image + "from" sell price.
 * Mirrors searchProducts: MIN(sellAdult) among active rates with validTo >= CURRENT_DATE.
 */
export async function getPackagesForBrowse(search?: string) {
  await requireAuth();

  const conditions = [eq(packages.status, "ACTIVE")];

  if (search?.trim()) {
    const term = `%${search.trim().toLowerCase()}%`;
    conditions.push(sql`LOWER(${packages.name}) LIKE ${term}`);
  }

  const result = await db
    .select({
      id: packages.id,
      name: packages.name,
      slug: packages.slug,
      shortDesc: packages.shortDesc,
      durationDays: packages.durationDays,
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
    .orderBy(asc(packages.name));

  return result;
}
