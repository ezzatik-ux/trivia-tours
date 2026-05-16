"use server";

import { db } from "@/lib/db";
import {
  bookings,
  products,
  countries,
  bookingStatusHistory,
  notifications,
} from "@/lib/db/schema";
import { eq, asc, sql, or, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-utils";

export type OpsBooking = {
  id: string;
  bookingNo: string;
  salesOrderNo: string;
  customerName: string;
  customerPhone: string | null;
  travelDate: string;
  totalPax: number;
  totalPrice: string;
  status: "NEW" | "ACK" | "SUPPLIER_CONTACTED" | "CONFIRMED" | "VOUCHER_ISSUED" | "OPERATED" | "CLOSED" | "CANCELLED";
  paymentStatus: string;
  createdAt: Date;
  assignedOpsId: string | null;
  assignedOpsName: string | null;
  salesAgentId: string;
  salesAgentName: string | null;
  productName: string | null;
  productType: "TOUR" | "EXCURSION" | "ACTIVITY" | "TRANSFER" | null;
  countryFlag: string | null;
  countryName: string | null;
  supplierRef: string | null;
};

/**
 * Get all bookings for the Ops queue.
 * Sorted: unassigned & active first, then by travel date ascending
 */
export async function getOpsQueue() {
  await requireRole(["OPS", "ADMIN"]);

  // Alias users twice — once for ops agent, once for sales agent
  const opsUser = sql<string | null>`(
    SELECT name FROM users WHERE id = ${bookings.assignedOpsId}
  )`.as("ops_user_name");

  const salesUser = sql<string | null>`(
    SELECT name FROM users WHERE id = ${bookings.salesAgentId}
  )`.as("sales_user_name");

  const result = await db
    .select({
      id: bookings.id,
      bookingNo: bookings.bookingNo,
      salesOrderNo: bookings.salesOrderNo,
      customerName: bookings.customerName,
      customerPhone: bookings.customerPhone,
      travelDate: bookings.travelDate,
      totalPax: bookings.totalPax,
      totalPrice: bookings.totalPrice,
      status: bookings.status,
      paymentStatus: bookings.paymentStatus,
      createdAt: bookings.createdAt,
      assignedOpsId: bookings.assignedOpsId,
      assignedOpsName: opsUser,
      salesAgentId: bookings.salesAgentId,
      salesAgentName: salesUser,
      productName: products.name,
      productType: products.type,
      countryFlag: countries.flagEmoji,
      countryName: countries.name,
      supplierRef: bookings.supplierRef,
    })
    .from(bookings)
    .leftJoin(products, eq(bookings.productId, products.id))
    .leftJoin(countries, eq(products.countryId, countries.id))
    .where(
      // Hide CLOSED bookings older than 30 days
      or(
        ne(bookings.status, "CLOSED"),
        sql`${bookings.updatedAt} > NOW() - INTERVAL '30 days'`
      )
    )
    // Sort: NEW first, then by travel_date ascending
    .orderBy(
      sql`CASE 
        WHEN ${bookings.status} = 'NEW' THEN 1
        WHEN ${bookings.status} = 'ACK' THEN 2
        WHEN ${bookings.status} = 'SUPPLIER_CONTACTED' THEN 3
        WHEN ${bookings.status} = 'CONFIRMED' THEN 4
        WHEN ${bookings.status} = 'VOUCHER_ISSUED' THEN 5
        WHEN ${bookings.status} = 'OPERATED' THEN 6
        ELSE 7
      END`,
      asc(bookings.travelDate)
    );

  return result;
}

/**
 * Assign a booking to the current ops user
 */
export async function assignToMe(bookingId: string) {
  const user = await requireRole(["OPS", "ADMIN"]);

  try {
    // Get current status
    const [current] = await db
      .select({ status: bookings.status, salesAgentId: bookings.salesAgentId })
      .from(bookings)
      .where(eq(bookings.id, bookingId))
      .limit(1);

    if (!current) {
      return { success: false, error: "Booking not found" };
    }

    // Update assignment + auto-advance NEW → ACK
    const newStatus = current.status === "NEW" ? "ACK" : current.status;

    await db
      .update(bookings)
      .set({
        assignedOpsId: user.id,
        status: newStatus,
        updatedAt: new Date(),
      })
      .where(eq(bookings.id, bookingId));

    // Log status change if transitioned
    if (newStatus !== current.status) {
      await db.insert(bookingStatusHistory).values({
        bookingId,
        fromStatus: current.status,
        toStatus: newStatus,
        changedBy: user.id,
        note: `Assigned to ${user.name} & acknowledged`,
      });

      // Notify sales agent
      await db.insert(notifications).values({
        userId: current.salesAgentId,
        type: "BOOKING_STATUS",
        title: `Booking acknowledged by Ops`,
        message: `${user.name} is now handling this booking`,
        relatedBookingId: bookingId,
      });
    }

    revalidatePath("/ops/queue");
    revalidatePath(`/ops/bookings/${bookingId}`);
    return { success: true };
  } catch (error) {
    console.error("assignToMe error:", error);
    return { success: false, error: "Failed to assign booking" };
  }
}

/**
 * Unassign a booking (return to queue)
 */
export async function unassign(bookingId: string) {
  await requireRole(["OPS", "ADMIN"]);

  try {
    await db
      .update(bookings)
      .set({
        assignedOpsId: null,
        updatedAt: new Date(),
      })
      .where(eq(bookings.id, bookingId));

    revalidatePath("/ops/queue");
    return { success: true };
  } catch (error) {
    console.error("unassign error:", error);
    return { success: false, error: "Failed to unassign" };
  }
}

/**
 * Stats for the queue header
 */
export async function getOpsStats() {
  const user = await requireRole(["OPS", "ADMIN"]);

  const today = new Date().toISOString().split("T")[0];
  const threeDaysFromNow = new Date();
  threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
  const threeDaysIso = threeDaysFromNow.toISOString().split("T")[0];

  const [stats] = await db
    .select({
      totalActive: sql<number>`COUNT(*) FILTER (WHERE ${bookings.status} NOT IN ('CLOSED', 'CANCELLED'))::int`.as("total_active"),
      unassigned: sql<number>`COUNT(*) FILTER (WHERE ${bookings.assignedOpsId} IS NULL AND ${bookings.status} NOT IN ('CLOSED', 'CANCELLED'))::int`.as("unassigned"),
      myAssigned: sql<number>`COUNT(*) FILTER (WHERE ${bookings.assignedOpsId} = ${user.id} AND ${bookings.status} NOT IN ('CLOSED', 'CANCELLED'))::int`.as("my_assigned"),
      urgent: sql<number>`COUNT(*) FILTER (
        WHERE ${bookings.travelDate} <= ${threeDaysIso}
        AND ${bookings.travelDate} >= ${today}
        AND ${bookings.status} IN ('NEW', 'ACK', 'SUPPLIER_CONTACTED')
      )::int`.as("urgent"),
      newBookings: sql<number>`COUNT(*) FILTER (WHERE ${bookings.status} = 'NEW')::int`.as("new_bookings"),
    })
    .from(bookings);

  return stats;
}
