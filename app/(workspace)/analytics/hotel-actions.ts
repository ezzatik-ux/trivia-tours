"use server";

import { db } from "@/lib/db";
import {
  hotels,
  hotelBookings,
  hotelRoomTypes,
  countries,
  users,
} from "@/lib/db/schema";
import { eq, and, gte, lte, sql, desc, inArray } from "drizzle-orm";
import { requireRole } from "@/lib/auth-utils";

export type DateRange = "week" | "month" | "quarter" | "year" | "all";

// ─── Range helpers ───────────────────────────

function getRangeDates(range: DateRange) {
  const now = new Date();
  const start = new Date(now);

  switch (range) {
    case "week":
      start.setDate(now.getDate() - 7);
      break;
    case "month":
      start.setMonth(now.getMonth() - 1);
      break;
    case "quarter":
      start.setMonth(now.getMonth() - 3);
      break;
    case "year":
      start.setFullYear(now.getFullYear() - 1);
      break;
    case "all":
      start.setFullYear(2000);
      break;
  }

  return { start: start.toISOString(), end: now.toISOString() };
}

// ─── HOTEL KPIs ──────────────────────────────

export async function getHotelKpiStats(range: DateRange) {
  await requireRole(["SALES", "OPS", "ADMIN"]);
  const { start, end } = getRangeDates(range);

  const [stats] = await db
    .select({
      totalBookings: sql<number>`COUNT(*)::int`,
      totalRevenue: sql<number>`COALESCE(SUM(${hotelBookings.totalPrice}::numeric), 0)::float`,
      totalNetCost: sql<number>`COALESCE(SUM(${hotelBookings.netCost}::numeric), 0)::float`,
      confirmedBookings: sql<number>`COUNT(*) FILTER (WHERE ${hotelBookings.status} IN ('CONFIRMED', 'VOUCHER_ISSUED', 'CHECKED_IN', 'CHECKED_OUT', 'COMPLETED'))::int`,
      cancelledBookings: sql<number>`COUNT(*) FILTER (WHERE ${hotelBookings.status} = 'CANCELLED')::int`,
      totalNights: sql<number>`COALESCE(SUM(${hotelBookings.nights}), 0)::int`,
      avgBookingValue: sql<number>`COALESCE(AVG(${hotelBookings.totalPrice}::numeric), 0)::float`,
    })
    .from(hotelBookings)
    .where(
      and(
        gte(hotelBookings.createdAt, new Date(start)),
        lte(hotelBookings.createdAt, new Date(end))
      )
    );

  const totalRevenue = stats?.totalRevenue ?? 0;
  const totalNetCost = stats?.totalNetCost ?? 0;
  const margin = totalRevenue - totalNetCost;
  const marginPct = totalRevenue > 0 ? (margin / totalRevenue) * 100 : 0;

  return {
    totalBookings: stats?.totalBookings ?? 0,
    totalRevenue,
    totalNetCost,
    margin,
    marginPct,
    confirmedBookings: stats?.confirmedBookings ?? 0,
    cancelledBookings: stats?.cancelledBookings ?? 0,
    conversionRate:
      stats && stats.totalBookings > 0
        ? (stats.confirmedBookings / stats.totalBookings) * 100
        : 0,
    totalNights: stats?.totalNights ?? 0,
    avgBookingValue: stats?.avgBookingValue ?? 0,
  };
}

// ─── HOTEL STATUS DISTRIBUTION ───────────────

export async function getHotelStatusDistribution(range: DateRange) {
  await requireRole(["SALES", "OPS", "ADMIN"]);
  const { start, end } = getRangeDates(range);

  const rows = await db
    .select({
      status: hotelBookings.status,
      count: sql<number>`COUNT(*)::int`,
    })
    .from(hotelBookings)
    .where(
      and(
        gte(hotelBookings.createdAt, new Date(start)),
        lte(hotelBookings.createdAt, new Date(end))
      )
    )
    .groupBy(hotelBookings.status);

  return rows;
}

// ─── TOP HOTELS BY REVENUE ───────────────────

export async function getTopHotels(range: DateRange, limit: number = 10) {
  await requireRole(["SALES", "OPS", "ADMIN"]);
  const { start, end } = getRangeDates(range);

  return db
    .select({
      hotelId: hotelBookings.hotelId,
      hotelName: hotels.name,
      countryCode: countries.code,
      countryName: countries.name,
      bookingCount: sql<number>`COUNT(*)::int`,
      totalRevenue: sql<number>`COALESCE(SUM(${hotelBookings.totalPrice}::numeric), 0)::float`,
      totalNights: sql<number>`COALESCE(SUM(${hotelBookings.nights}), 0)::int`,
    })
    .from(hotelBookings)
    .leftJoin(hotels, eq(hotelBookings.hotelId, hotels.id))
    .leftJoin(countries, eq(hotels.countryId, countries.id))
    .where(
      and(
        gte(hotelBookings.createdAt, new Date(start)),
        lte(hotelBookings.createdAt, new Date(end))
      )
    )
    .groupBy(hotelBookings.hotelId, hotels.name, countries.code, countries.name)
    .orderBy(desc(sql`COALESCE(SUM(${hotelBookings.totalPrice}::numeric), 0)`))
    .limit(limit);
}

// ─── REVENUE COMPARISON (Tours vs Hotels) ────

export async function getRevenueComparison(range: DateRange, tourRevenue: number) {
  await requireRole(["SALES", "OPS", "ADMIN"]);
  const { start, end } = getRangeDates(range);

  const [hotelData] = await db
    .select({
      revenue: sql<number>`COALESCE(SUM(${hotelBookings.totalPrice}::numeric), 0)::float`,
      bookings: sql<number>`COUNT(*)::int`,
    })
    .from(hotelBookings)
    .where(
      and(
        gte(hotelBookings.createdAt, new Date(start)),
        lte(hotelBookings.createdAt, new Date(end))
      )
    );

  const hotelRevenue = hotelData?.revenue ?? 0;
  const total = tourRevenue + hotelRevenue;

  return {
    tours: { revenue: tourRevenue, share: total > 0 ? (tourRevenue / total) * 100 : 0 },
    hotels: { revenue: hotelRevenue, share: total > 0 ? (hotelRevenue / total) * 100 : 0 },
    total,
    hotelBookings: hotelData?.bookings ?? 0,
  };
}

// ─── HOTEL CSV EXPORT ────────────────────────

export async function exportHotelBookingsCSV(range: DateRange) {
  await requireRole(["OPS", "ADMIN"]);
  const { start, end } = getRangeDates(range);

  const rows = await db
    .select({
      bookingNo: hotelBookings.bookingNo,
      status: hotelBookings.status,
      customerName: hotelBookings.customerName,
      customerEmail: hotelBookings.customerEmail,
      customerPhone: hotelBookings.customerPhone,
      checkIn: hotelBookings.checkIn,
      checkOut: hotelBookings.checkOut,
      nights: hotelBookings.nights,
      numRooms: hotelBookings.numRooms,
      occupancy: hotelBookings.occupancy,
      adults: hotelBookings.adults,
      children: hotelBookings.children,
      totalPrice: hotelBookings.totalPrice,
      netCost: hotelBookings.netCost,
      hotelConfirmationRef: hotelBookings.hotelConfirmationRef,
      invoiceNoOdoo: hotelBookings.invoiceNoOdoo,
      hotelName: hotels.name,
      roomTypeName: hotelRoomTypes.name,
      countryName: countries.name,
      salesAgentName: users.name,
      createdAt: hotelBookings.createdAt,
    })
    .from(hotelBookings)
    .leftJoin(hotels, eq(hotelBookings.hotelId, hotels.id))
    .leftJoin(hotelRoomTypes, eq(hotelBookings.roomTypeId, hotelRoomTypes.id))
    .leftJoin(countries, eq(hotels.countryId, countries.id))
    .leftJoin(users, eq(hotelBookings.salesAgentId, users.id))
    .where(
      and(
        gte(hotelBookings.createdAt, new Date(start)),
        lte(hotelBookings.createdAt, new Date(end))
      )
    )
    .orderBy(desc(hotelBookings.createdAt));

  return rows;
}
