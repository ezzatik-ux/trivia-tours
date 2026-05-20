"use server";

import { db } from "@/lib/db";
import {
  hotels,
  hotelBookings,
  hotelRoomTypes,
  hotelRates,
  countries,
} from "@/lib/db/schema";
import { eq, and, desc, gte, sql, or, inArray } from "drizzle-orm";
import { requireAuth } from "@/lib/auth-utils";

// ─── HOTEL STATS FOR DASHBOARD ───────────────

export async function getHotelDashboardStats() {
  const user = await requireAuth();
  const role = user.role;

  // Date math: this month + last 30 days
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // ─── Catalog stats (all roles) ───
  const [catalogStats] = await db
    .select({
      totalHotels: sql<number>`COUNT(DISTINCT ${hotels.id})::int`,
      activeHotels: sql<number>`COUNT(DISTINCT ${hotels.id}) FILTER (WHERE ${hotels.status} = 'ACTIVE')::int`,
      countriesCount: sql<number>`COUNT(DISTINCT ${hotels.countryId})::int`,
    })
    .from(hotels);

  // ─── Booking stats ───
  // For SALES role: only their bookings
  // For OPS/ADMIN/PRODUCT: all bookings
  const bookingConditions =
    role === "SALES"
      ? [eq(hotelBookings.salesAgentId, user.id)]
      : [];

  const [bookingStats] = await db
    .select({
      totalBookings: sql<number>`COUNT(*)::int`,
      thisMonth: sql<number>`COUNT(*) FILTER (WHERE ${hotelBookings.createdAt} >= ${startOfMonth.toISOString()})::int`,
      last30Days: sql<number>`COUNT(*) FILTER (WHERE ${hotelBookings.createdAt} >= ${thirtyDaysAgo.toISOString()})::int`,
      pending: sql<number>`COUNT(*) FILTER (WHERE ${hotelBookings.status} IN ('NEW', 'ACK', 'HOTEL_CONTACTED', 'AWAITING_INVOICE'))::int`,
      confirmed: sql<number>`COUNT(*) FILTER (WHERE ${hotelBookings.status} IN ('CONFIRMED', 'VOUCHER_ISSUED', 'CHECKED_IN'))::int`,
      revenue: sql<number>`COALESCE(SUM(${hotelBookings.totalPrice}::numeric) FILTER (WHERE ${hotelBookings.createdAt} >= ${startOfMonth.toISOString()}), 0)::float`,
    })
    .from(hotelBookings)
    .where(bookingConditions.length > 0 ? and(...bookingConditions) : undefined);

  return {
    catalog: {
      totalHotels: catalogStats?.totalHotels ?? 0,
      activeHotels: catalogStats?.activeHotels ?? 0,
      countries: catalogStats?.countriesCount ?? 0,
    },
    bookings: {
      total: bookingStats?.totalBookings ?? 0,
      thisMonth: bookingStats?.thisMonth ?? 0,
      last30Days: bookingStats?.last30Days ?? 0,
      pending: bookingStats?.pending ?? 0,
      confirmed: bookingStats?.confirmed ?? 0,
      revenue: bookingStats?.revenue ?? 0,
    },
  };
}

// ─── RECENT HOTEL BOOKINGS ───────────────────

export async function getRecentHotelBookings(limit: number = 5) {
  const user = await requireAuth();
  const role = user.role;

  // SALES: only their bookings; others: all
  const conditions =
    role === "SALES" ? [eq(hotelBookings.salesAgentId, user.id)] : [];

  return db
    .select({
      id: hotelBookings.id,
      bookingNo: hotelBookings.bookingNo,
      customerName: hotelBookings.customerName,
      status: hotelBookings.status,
      totalPrice: hotelBookings.totalPrice,
      checkIn: hotelBookings.checkIn,
      nights: hotelBookings.nights,
      createdAt: hotelBookings.createdAt,
      hotelName: hotels.name,
      countryCode: countries.code,
    })
    .from(hotelBookings)
    .leftJoin(hotels, eq(hotelBookings.hotelId, hotels.id))
    .leftJoin(countries, eq(hotels.countryId, countries.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(hotelBookings.createdAt))
    .limit(limit);
}

// ─── URGENT HOTEL BOOKINGS (Ops only) ────────

export async function getUrgentHotelBookings(limit: number = 5) {
  await requireAuth();

  return db
    .select({
      id: hotelBookings.id,
      bookingNo: hotelBookings.bookingNo,
      customerName: hotelBookings.customerName,
      status: hotelBookings.status,
      totalPrice: hotelBookings.totalPrice,
      checkIn: hotelBookings.checkIn,
      nights: hotelBookings.nights,
      createdAt: hotelBookings.createdAt,
      hotelName: hotels.name,
      countryCode: countries.code,
    })
    .from(hotelBookings)
    .leftJoin(hotels, eq(hotelBookings.hotelId, hotels.id))
    .leftJoin(countries, eq(hotels.countryId, countries.id))
    .where(
      inArray(hotelBookings.status, ["NEW", "ACK", "HOTEL_CONTACTED"])
    )
    .orderBy(hotelBookings.checkIn) // Sooner check-ins = more urgent
    .limit(limit);
}
