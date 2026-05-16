"use server";

import { db } from "@/lib/db";
import {
  bookings,
  bookingStatusHistory,
  users,
  notifications,
} from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-utils";

type BookingStatus =
  | "NEW"
  | "ACK"
  | "SUPPLIER_CONTACTED"
  | "CONFIRMED"
  | "VOUCHER_ISSUED"
  | "OPERATED"
  | "CLOSED"
  | "CANCELLED";

/**
 * Get the full status history for a booking
 */
export async function getStatusHistory(bookingId: string) {
  await requireRole(["OPS", "ADMIN"]);

  const result = await db
    .select({
      id: bookingStatusHistory.id,
      fromStatus: bookingStatusHistory.fromStatus,
      toStatus: bookingStatusHistory.toStatus,
      note: bookingStatusHistory.note,
      changedAt: bookingStatusHistory.changedAt,
      changedBy: bookingStatusHistory.changedBy,
      changedByName: users.name,
      changedByEmail: users.email,
    })
    .from(bookingStatusHistory)
    .leftJoin(users, eq(bookingStatusHistory.changedBy, users.id))
    .where(eq(bookingStatusHistory.bookingId, bookingId))
    .orderBy(desc(bookingStatusHistory.changedAt));

  return result;
}

/**
 * Change booking status with optional note
 * Auto-notifies the sales agent
 */
export async function changeStatus(
  bookingId: string,
  newStatus: BookingStatus,
  note?: string
) {
  const user = await requireRole(["OPS", "ADMIN"]);

  try {
    // Get current booking
    const [current] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, bookingId))
      .limit(1);

    if (!current) {
      return { success: false, error: "Booking not found" };
    }

    if (current.status === newStatus) {
      return { success: false, error: "Booking is already in this status" };
    }

    // Cancellation requires reason
    if (newStatus === "CANCELLED" && !note?.trim()) {
      return { success: false, error: "Cancellation reason is required" };
    }

    // Build update object
    const updateData: Record<string, unknown> = {
      status: newStatus,
      updatedAt: new Date(),
    };

    // Set timestamps based on status
    if (newStatus === "CONFIRMED") {
      updateData.confirmedAt = new Date();
    }
    if (newStatus === "CANCELLED") {
      updateData.cancelledAt = new Date();
      updateData.cancellationReason = note?.trim() || null;
    }

    await db
      .update(bookings)
      .set(updateData)
      .where(eq(bookings.id, bookingId));

    // Log to history
    await db.insert(bookingStatusHistory).values({
      bookingId,
      fromStatus: current.status,
      toStatus: newStatus,
      changedBy: user.id,
      note: note?.trim() || null,
    });

    // Notify sales agent
    const statusLabel = formatStatus(newStatus);
    await db.insert(notifications).values({
      userId: current.salesAgentId,
      type: "BOOKING_STATUS",
      title: `Booking ${current.bookingNo}: ${statusLabel}`,
      message: note?.trim() || `Status updated to ${statusLabel}`,
      relatedBookingId: bookingId,
    });

    revalidatePath(`/ops/bookings/${bookingId}`);
    revalidatePath("/ops/queue");
    revalidatePath(`/bookings/${bookingId}`);
    revalidatePath("/bookings");

    return { success: true };
  } catch (error) {
    console.error("changeStatus error:", error);
    return { success: false, error: "Failed to update status" };
  }
}

/**
 * Update supplier-related fields (ref number, internal notes)
 */
export async function updateBookingMeta(
  bookingId: string,
  data: {
    supplierRef?: string | null;
    internalNotes?: string | null;
  }
) {
  await requireRole(["OPS", "ADMIN"]);

  try {
    await db
      .update(bookings)
      .set({
        supplierRef: data.supplierRef?.trim() || null,
        internalNotes: data.internalNotes?.trim() || null,
        updatedAt: new Date(),
      })
      .where(eq(bookings.id, bookingId));

    revalidatePath(`/ops/bookings/${bookingId}`);
    return { success: true };
  } catch (error) {
    console.error("updateBookingMeta error:", error);
    return { success: false, error: "Failed to update booking details" };
  }
}

function formatStatus(status: BookingStatus): string {
  const labels: Record<BookingStatus, string> = {
    NEW: "New",
    ACK: "Acknowledged",
    SUPPLIER_CONTACTED: "Supplier Contacted",
    CONFIRMED: "Confirmed",
    VOUCHER_ISSUED: "Voucher Issued",
    OPERATED: "Operated",
    CLOSED: "Closed",
    CANCELLED: "Cancelled",
  };
  return labels[status];
}
