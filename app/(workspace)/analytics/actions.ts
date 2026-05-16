"use server";

import { db } from "@/lib/db";
import {
  bookings,
  products,
  countries,
  users,
} from "@/lib/db/schema";
import { eq, and, gte, lte, sql, desc, ne } from "drizzle-orm";
import { requireRole } from "@/lib/auth-utils";

export type DateRange = "week" | "month" | "quarter" | "year" | "all";

/**
 * Calculate date filter based on range
 */
function getDateFilter(range: DateRange): Date | null {
  const now = new Date();
  switch (range) {
    case "week": {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      return d;
    }
    case "month": {
      const d = new Date();
      d.setMonth(d.getMonth() - 1);
      return d;
    }
    case "quarter": {
      const d = new Date();
      d.setMonth(d.getMonth() - 3);
      return d;
    }
    case "year": {
      const d = new Date();
      d.setFullYear(d.getFullYear() - 1);
      return d;
    }
    case "all":
    default:
      return null;
  }
}

/**
 * Build WHERE clauses for date range
 */
function dateConditions(range: DateRange) {
  const from = getDateFilter(range);
  const conditions = [ne(bookings.status, "CANCELLED")];

  if (from) {
    conditions.push(gte(bookings.createdAt, from));
  }

  return conditions;
}

/**
 * KPI hero stats — current period vs previous period
 */
export async function getKpiStats(range: DateRange) {
  await requireRole(["OPS", "ADMIN", "SALES"]);

  const from = getDateFilter(range);

  // Current period
  const currentConditions = [ne(bookings.status, "CANCELLED")];
  if (from) currentConditions.push(gte(bookings.createdAt, from));

  const [current] = await db
    .select({
      revenue: sql<string>`COALESCE(SUM(${bookings.totalPrice}), 0)::text`.as("revenue"),
      bookingCount: sql<number>`COUNT(*)::int`.as("booking_count"),
      avgValue: sql<string>`COALESCE(AVG(${bookings.totalPrice}), 0)::text`.as("avg_value"),
      totalPax: sql<number>`COALESCE(SUM(${bookings.totalPax}), 0)::int`.as("total_pax"),
    })
    .from(bookings)
    .where(and(...currentConditions));

  // Previous period (same length back) — only for "month" / "quarter" / "week" / "year"
  let previous = { revenue: "0", bookingCount: 0, avgValue: "0" };
  if (from && range !== "all") {
    const periodLength = Date.now() - from.getTime();
    const previousStart = new Date(from.getTime() - periodLength);

    const [prev] = await db
      .select({
        revenue: sql<string>`COALESCE(SUM(${bookings.totalPrice}), 0)::text`.as("revenue"),
        bookingCount: sql<number>`COUNT(*)::int`.as("booking_count"),
        avgValue: sql<string>`COALESCE(AVG(${bookings.totalPrice}), 0)::text`.as("avg_value"),
      })
      .from(bookings)
      .where(
        and(
          ne(bookings.status, "CANCELLED"),
          gte(bookings.createdAt, previousStart),
          lte(bookings.createdAt, from)
        )
      );

    previous = prev;
  }

  function pctChange(curr: number, prev: number): number {
    if (prev === 0) return curr > 0 ? 100 : 0;
    return Math.round(((curr - prev) / prev) * 1000) / 10;
  }

  return {
    revenue: parseFloat(current.revenue),
    bookingCount: current.bookingCount,
    avgValue: parseFloat(current.avgValue),
    totalPax: current.totalPax,
    revenueChange: pctChange(parseFloat(current.revenue), parseFloat(previous.revenue)),
    bookingChange: pctChange(current.bookingCount, previous.bookingCount),
    avgValueChange: pctChange(parseFloat(current.avgValue), parseFloat(previous.avgValue)),
  };
}

/**
 * Bookings grouped by status — for donut chart
 */
export async function getStatusDistribution(range: DateRange) {
  await requireRole(["OPS", "ADMIN", "SALES"]);

  const from = getDateFilter(range);
  const conditions = [];
  if (from) conditions.push(gte(bookings.createdAt, from));

  const result = await db
    .select({
      status: bookings.status,
      count: sql<number>`COUNT(*)::int`.as("count"),
    })
    .from(bookings)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .groupBy(bookings.status);

  return result;
}

/**
 * Monthly revenue for last 12 months
 */
export async function getRevenueTrend() {
  await requireRole(["OPS", "ADMIN", "SALES"]);

  const result = await db
    .select({
      month: sql<string>`TO_CHAR(${bookings.createdAt}, 'YYYY-MM')`.as("month"),
      revenue: sql<string>`COALESCE(SUM(${bookings.totalPrice}), 0)::text`.as("revenue"),
      bookings: sql<number>`COUNT(*)::int`.as("bookings"),
    })
    .from(bookings)
    .where(
      and(
        ne(bookings.status, "CANCELLED"),
        gte(bookings.createdAt, sql`NOW() - INTERVAL '12 months'`)
      )
    )
    .groupBy(sql`TO_CHAR(${bookings.createdAt}, 'YYYY-MM')`)
    .orderBy(sql`TO_CHAR(${bookings.createdAt}, 'YYYY-MM')`);

  return result.map((r) => ({
    month: r.month,
    revenue: parseFloat(r.revenue),
    bookings: r.bookings,
  }));
}

/**
 * Top 10 countries by booking count + revenue
 */
export async function getTopCountries(range: DateRange) {
  await requireRole(["OPS", "ADMIN", "SALES"]);

  const conditions = dateConditions(range);

  const result = await db
    .select({
      countryId: products.countryId,
      countryName: countries.name,
      countryFlag: countries.flagEmoji,
      bookings: sql<number>`COUNT(*)::int`.as("bookings"),
      revenue: sql<string>`COALESCE(SUM(${bookings.totalPrice}), 0)::text`.as("revenue"),
    })
    .from(bookings)
    .leftJoin(products, eq(bookings.productId, products.id))
    .leftJoin(countries, eq(products.countryId, countries.id))
    .where(and(...conditions))
    .groupBy(products.countryId, countries.name, countries.flagEmoji)
    .orderBy(desc(sql`COALESCE(SUM(${bookings.totalPrice}), 0)`))
    .limit(10);

  return result.map((r) => ({
    countryName: r.countryName,
    countryFlag: r.countryFlag,
    bookings: r.bookings,
    revenue: parseFloat(r.revenue),
  }));
}

/**
 * Top sales agents by revenue
 */
export async function getTopAgents(range: DateRange) {
  await requireRole(["OPS", "ADMIN"]);

  const conditions = dateConditions(range);

  const result = await db
    .select({
      agentId: bookings.salesAgentId,
      agentName: users.name,
      agentEmail: users.email,
      bookings: sql<number>`COUNT(*)::int`.as("bookings"),
      revenue: sql<string>`COALESCE(SUM(${bookings.totalPrice}), 0)::text`.as("revenue"),
      totalPax: sql<number>`COALESCE(SUM(${bookings.totalPax}), 0)::int`.as("total_pax"),
    })
    .from(bookings)
    .leftJoin(users, eq(bookings.salesAgentId, users.id))
    .where(and(...conditions))
    .groupBy(bookings.salesAgentId, users.name, users.email)
    .orderBy(desc(sql`COALESCE(SUM(${bookings.totalPrice}), 0)`))
    .limit(10);

  return result.map((r) => ({
    agentId: r.agentId,
    agentName: r.agentName,
    agentEmail: r.agentEmail,
    bookings: r.bookings,
    revenue: parseFloat(r.revenue),
    totalPax: r.totalPax,
  }));
}

/**
 * Top products by booking count
 */
export async function getTopProducts(range: DateRange) {
  await requireRole(["OPS", "ADMIN", "SALES"]);

  const conditions = dateConditions(range);

  const result = await db
    .select({
      productId: bookings.productId,
      productName: products.name,
      productType: products.type,
      countryFlag: countries.flagEmoji,
      bookings: sql<number>`COUNT(*)::int`.as("bookings"),
      revenue: sql<string>`COALESCE(SUM(${bookings.totalPrice}), 0)::text`.as("revenue"),
    })
    .from(bookings)
    .leftJoin(products, eq(bookings.productId, products.id))
    .leftJoin(countries, eq(products.countryId, countries.id))
    .where(and(...conditions))
    .groupBy(bookings.productId, products.name, products.type, countries.flagEmoji)
    .orderBy(desc(sql`COUNT(*)`))
    .limit(10);

  return result.map((r) => ({
    productName: r.productName,
    productType: r.productType,
    countryFlag: r.countryFlag,
    bookings: r.bookings,
    revenue: parseFloat(r.revenue),
  }));
}

/**
 * Upcoming bookings — next 7 days
 */
export async function getUpcomingTravel() {
  await requireRole(["OPS", "ADMIN", "SALES"]);

  const today = new Date().toISOString().split("T")[0];
  const sevenDaysOut = new Date();
  sevenDaysOut.setDate(sevenDaysOut.getDate() + 7);
  const sevenIso = sevenDaysOut.toISOString().split("T")[0];

  const result = await db
    .select({
      id: bookings.id,
      bookingNo: bookings.bookingNo,
      customerName: bookings.customerName,
      travelDate: bookings.travelDate,
      totalPax: bookings.totalPax,
      status: bookings.status,
      productName: products.name,
      productType: products.type,
      countryFlag: countries.flagEmoji,
    })
    .from(bookings)
    .leftJoin(products, eq(bookings.productId, products.id))
    .leftJoin(countries, eq(products.countryId, countries.id))
    .where(
      and(
        gte(bookings.travelDate, today),
        lte(bookings.travelDate, sevenIso),
        ne(bookings.status, "CANCELLED")
      )
    )
    .orderBy(bookings.travelDate);

  return result;
}

/**
 * Export bookings to CSV-friendly format
 */
export async function exportBookings(range: DateRange) {
  await requireRole(["OPS", "ADMIN"]);

  const conditions = dateConditions(range);

  const result = await db
    .select({
      bookingNo: bookings.bookingNo,
      salesOrderNo: bookings.salesOrderNo,
      status: bookings.status,
      customerName: bookings.customerName,
      customerEmail: bookings.customerEmail,
      customerPhone: bookings.customerPhone,
      customerCountry: bookings.customerCountry,
      productName: products.name,
      productType: products.type,
      countryName: countries.name,
      travelDate: bookings.travelDate,
      adults: bookings.adults,
      children: bookings.children,
      infants: bookings.infants,
      totalPax: bookings.totalPax,
      totalPrice: bookings.totalPrice,
      netCost: bookings.netCost,
      paymentStatus: bookings.paymentStatus,
      salesAgent: users.name,
      createdAt: bookings.createdAt,
    })
    .from(bookings)
    .leftJoin(products, eq(bookings.productId, products.id))
    .leftJoin(countries, eq(products.countryId, countries.id))
    .leftJoin(users, eq(bookings.salesAgentId, users.id))
    .where(and(...conditions))
    .orderBy(desc(bookings.createdAt));

  return result;
}
