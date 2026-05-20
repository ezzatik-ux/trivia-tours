"use server";

import { db } from "@/lib/db";
import { bookings, products, countries, users } from "@/lib/db/schema";
import { eq, and, desc, sql, inArray } from "drizzle-orm";
import { requireAuth } from "@/lib/auth-utils";

export async function getTourDashboardStats() {
  const user = await requireAuth();
  const role = user.role;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // ─── Catalog stats ───
  const [catalogStats] = await db
    .select({
      totalProducts: sql<number>`COUNT(DISTINCT ${products.id})::int`,
      activeProducts: sql<number>`COUNT(DISTINCT ${products.id}) FILTER (WHERE ${products.status} = 'ACTIVE')::int`,
    })
    .from(products);

  // ─── Booking stats ───
  const bookingConditions =
    role === "SALES" ? [eq(bookings.salesAgentId, user.id)] : [];

  const [bookingStats] = await db
    .select({
      total: sql<number>`COUNT(*)::int`,
      thisMonth: sql<number>`COUNT(*) FILTER (WHERE ${bookings.createdAt} >= ${startOfMonth.toISOString()})::int`,
      pending: sql<number>`COUNT(*) FILTER (WHERE ${bookings.status} IN ('NEW', 'ACK', 'SUPPLIER_CONTACTED'))::int`,
      confirmed: sql<number>`COUNT(*) FILTER (WHERE ${bookings.status} IN ('CONFIRMED', 'VOUCHER_ISSUED', 'OPERATED'))::int`,
      revenue: sql<number>`COALESCE(SUM(${bookings.totalPrice}::numeric) FILTER (WHERE ${bookings.createdAt} >= ${startOfMonth.toISOString()}), 0)::float`,
    })
    .from(bookings)
    .where(bookingConditions.length > 0 ? and(...bookingConditions) : undefined);

  return {
    catalog: {
      totalProducts: catalogStats?.totalProducts ?? 0,
      activeProducts: catalogStats?.activeProducts ?? 0,
    },
    bookings: {
      total: bookingStats?.total ?? 0,
      thisMonth: bookingStats?.thisMonth ?? 0,
      pending: bookingStats?.pending ?? 0,
      confirmed: bookingStats?.confirmed ?? 0,
      revenue: bookingStats?.revenue ?? 0,
    },
  };
}

export async function getRecentTourBookings(limit: number = 5) {
  const user = await requireAuth();
  const role = user.role;

  const conditions =
    role === "SALES" ? [eq(bookings.salesAgentId, user.id)] : [];

  return db
    .select({
      id: bookings.id,
      bookingNo: bookings.bookingNo,
      customerName: bookings.customerName,
      status: bookings.status,
      totalPrice: bookings.totalPrice,
      travelDate: bookings.travelDate,
      createdAt: bookings.createdAt,
      productName: products.name,
      countryCode: countries.code,
    })
    .from(bookings)
    .leftJoin(products, eq(bookings.productId, products.id))
    .leftJoin(countries, eq(products.countryId, countries.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(bookings.createdAt))
    .limit(limit);
}
