"use server";

import { db } from "@/lib/db";
import { countries, products, rates } from "@/lib/db/schema";
import { eq, sql, and, gte, lte, inArray, gte as gteOp, lte as lteOp } from "drizzle-orm";
import { requireAuth } from "@/lib/auth-utils";

/**
 * Get all countries with their active product counts
 */
export async function getCountriesWithProductCounts() {
  await requireAuth();

  const result = await db
    .select({
      id: countries.id,
      code: countries.code,
      name: countries.name,
      sortOrder: countries.sortOrder,
      productCount: sql<number>`COALESCE(COUNT(${products.id})::int, 0)`.as("product_count"),
    })
    .from(countries)
    .leftJoin(
      products,
      and(eq(products.countryId, countries.id), eq(products.status, "ACTIVE"))
    )
    .where(eq(countries.isActive, true))
    .groupBy(countries.id)
    .orderBy(countries.sortOrder);

  return result;
}

/**
 * Get total stats for the search hub
 */
export async function getSearchStats() {
  await requireAuth();

  const [stats] = await db
    .select({
      totalActiveProducts: sql<number>`COUNT(*)::int`.as("total_active_products"),
      totalCountriesWithProducts: sql<number>`COUNT(DISTINCT ${products.countryId})::int`.as(
        "total_countries_with_products"
      ),
    })
    .from(products)
    .where(eq(products.status, "ACTIVE"));

  return stats;
}

export type BrowseFilters = {
  countryId?: string | null; // null = all countries
  types?: Array<"TOUR" | "EXCURSION" | "ACTIVITY" | "TRANSFER">;
  search?: string;
  minDuration?: number | null;
  maxDuration?: number | null;
  sortBy?: "price-asc" | "price-desc" | "name-asc" | "duration-asc";
};

/**
 * Search/browse products with filters + "from price" calculation.
 * Returns active products with their cover image and lowest current sell price.
 */
export async function searchProducts(filters: BrowseFilters) {
  await requireAuth();

  const conditions = [eq(products.status, "ACTIVE")];

  if (filters.countryId) {
    conditions.push(eq(products.countryId, filters.countryId));
  }

  if (filters.types && filters.types.length > 0) {
    conditions.push(inArray(products.type, filters.types));
  }

  if (filters.minDuration != null) {
    conditions.push(gte(products.durationHours, filters.minDuration.toString()));
  }
  if (filters.maxDuration != null) {
    conditions.push(lte(products.durationHours, filters.maxDuration.toString()));
  }

  if (filters.search) {
    const term = `%${filters.search.toLowerCase()}%`;
    conditions.push(sql`LOWER(${products.name}) LIKE ${term}`);
  }

  // Determine SQL ordering
  let orderClause;
  switch (filters.sortBy) {
    case "price-desc":
      orderClause = sql`from_price DESC NULLS LAST`;
      break;
    case "name-asc":
      orderClause = sql`${products.name} ASC`;
      break;
    case "duration-asc":
      orderClause = sql`${products.durationHours} ASC NULLS LAST`;
      break;
    case "price-asc":
    default:
      orderClause = sql`from_price ASC NULLS LAST`;
      break;
  }

  const result = await db
    .select({
      id: products.id,
      type: products.type,
      name: products.name,
      shortDesc: products.shortDesc,
      durationHours: products.durationHours,
      countryId: products.countryId,
      countryName: countries.name,
      countryCode: countries.code,
      coverImage: sql<string | null>`(
        SELECT url FROM product_images
        WHERE product_images.product_id = ${products.id}
        AND product_images.is_cover = true
        LIMIT 1
      )`.as("cover_image"),
      fromPrice: sql<string | null>`(
        SELECT MIN(${rates.sellAdult})
        FROM ${rates}
        WHERE ${rates.productId} = ${products.id}
        AND ${rates.isActive} = true
        AND ${rates.validTo} >= CURRENT_DATE
      )`.as("from_price"),
    })
    .from(products)
    .leftJoin(countries, eq(products.countryId, countries.id))
    .where(and(...conditions))
    .orderBy(orderClause);

  return result;
}

/**
 * Get a single country by ID
 */
export async function getCountryById(countryId: string) {
  await requireAuth();

  const [country] = await db
    .select()
    .from(countries)
    .where(eq(countries.id, countryId))
    .limit(1);

  return country ?? null;
}

export type QuoteCalculation = {
  rateId: string;
  rateName: string | null;
  supplierName: string | null;
  unitAdult: number;
  unitChild: number;
  unitInfant: number;
  adults: number;
  children: number;
  infants: number;
  totalPrice: number;
  validFrom: string;
  validTo: string;
};

/**
 * Get the active rate for a product on a specific travel date
 * Returns the cheapest available rate
 */
export async function getApplicableRate(productId: string, travelDate: string) {
  await requireAuth();

  const result = await db
    .select({
      id: rates.id,
      supplierId: rates.supplierId,
      supplierName: sql<string | null>`(
        SELECT name FROM suppliers WHERE id = ${rates.supplierId}
      )`.as("supplier_name"),
      sellAdult: rates.sellAdult,
      sellChild: rates.sellChild,
      sellInfant: rates.sellInfant,
      minPax: rates.minPax,
      maxPax: rates.maxPax,
      childAgeMin: rates.childAgeMin,
      childAgeMax: rates.childAgeMax,
      validFrom: rates.validFrom,
      validTo: rates.validTo,
    })
    .from(rates)
    .where(
      and(
        eq(rates.productId, productId),
        eq(rates.isActive, true),
        lteOp(rates.validFrom, travelDate),
        gteOp(rates.validTo, travelDate)
      )
    )
    .orderBy(rates.sellAdult)
    .limit(1);

  return result[0] ?? null;
}

/**
 * Calculate quote total based on selected rate and pax
 */
export async function calculateQuote(
  productId: string,
  travelDate: string,
  adults: number,
  children: number,
  infants: number
): Promise<{ success: boolean; quote?: QuoteCalculation; error?: string }> {
  await requireAuth();

  if (adults < 1) {
    return { success: false, error: "At least 1 adult is required" };
  }

  const rate = await getApplicableRate(productId, travelDate);
  if (!rate) {
    return {
      success: false,
      error: "No active rates available for this date. Try another date.",
    };
  }

  const totalPax = adults + children + infants;

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
  const unitInfant = parseFloat(rate.sellInfant);

  const totalPrice =
    adults * unitAdult + children * unitChild + infants * unitInfant;

  return {
    success: true,
    quote: {
      rateId: rate.id,
      rateName: null,
      supplierName: rate.supplierName,
      unitAdult,
      unitChild,
      unitInfant,
      adults,
      children,
      infants,
      totalPrice: Math.round(totalPrice * 100) / 100,
      validFrom: rate.validFrom,
      validTo: rate.validTo,
    },
  };
}
