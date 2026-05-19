"use server";

import { db } from "@/lib/db";
import {
  hotelBookings,
  hotelBookingStatusHistory,
  hotels,
  hotelRoomTypes,
  hotelRates,
  users,
  notifications,
  countries,
} from "@/lib/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireRole, requireAuth } from "@/lib/auth-utils";

export type HotelBookingStatus =
  | "NEW"
  | "ACK"
  | "HOTEL_CONTACTED"
  | "AWAITING_INVOICE"
  | "CONFIRMED"
  | "VOUCHER_ISSUED"
  | "CHECKED_IN"
  | "CHECKED_OUT"
  | "COMPLETED"
  | "CANCELLED";

// ─── QUEUE LIST ──────────────────────────────

export async function getHotelBookingsQueue() {
  await requireRole(["OPS", "ADMIN"]);

  return db
    .select({
      id: hotelBookings.id,
      bookingNo: hotelBookings.bookingNo,
      salesOrderNo: hotelBookings.salesOrderNo,
      customerName: hotelBookings.customerName,
      checkIn: hotelBookings.checkIn,
      checkOut: hotelBookings.checkOut,
      nights: hotelBookings.nights,
      numRooms: hotelBookings.numRooms,
      occupancy: hotelBookings.occupancy,
      totalPrice: hotelBookings.totalPrice,
      status: hotelBookings.status,
      assignedOpsId: hotelBookings.assignedOpsId,
      createdAt: hotelBookings.createdAt,
      hotelName: hotels.name,
      hotelBrand: hotels.brand,
      countryName: countries.name,
      countryFlag: countries.flagEmoji,
      roomTypeName: hotelRoomTypes.name,
      salesAgentName: users.name,
      assignedOpsName: sql<string | null>`(
        SELECT name FROM ${users} 
        WHERE id = ${hotelBookings.assignedOpsId}
      )`.as("assigned_ops_name"),
    })
    .from(hotelBookings)
    .leftJoin(hotels, eq(hotelBookings.hotelId, hotels.id))
    .leftJoin(countries, eq(hotels.countryId, countries.id))
    .leftJoin(hotelRoomTypes, eq(hotelBookings.roomTypeId, hotelRoomTypes.id))
    .leftJoin(users, eq(hotelBookings.salesAgentId, users.id))
    .orderBy(desc(hotelBookings.createdAt));
}

// ─── BOOKING DETAIL ──────────────────────────

export async function getHotelBookingDetail(id: string) {
  await requireRole(["OPS", "ADMIN", "SALES"]);

  const [booking] = await db
    .select({
      id: hotelBookings.id,
      bookingNo: hotelBookings.bookingNo,
      salesOrderNo: hotelBookings.salesOrderNo,
      invoiceNoOdoo: hotelBookings.invoiceNoOdoo,
      salesAgentId: hotelBookings.salesAgentId,
      assignedOpsId: hotelBookings.assignedOpsId,
      customerName: hotelBookings.customerName,
      customerEmail: hotelBookings.customerEmail,
      customerPhone: hotelBookings.customerPhone,
      customerNationality: hotelBookings.customerNationality,
      checkIn: hotelBookings.checkIn,
      checkOut: hotelBookings.checkOut,
      nights: hotelBookings.nights,
      numRooms: hotelBookings.numRooms,
      occupancy: hotelBookings.occupancy,
      adults: hotelBookings.adults,
      children: hotelBookings.children,
      infants: hotelBookings.infants,
      unitRate: hotelBookings.unitRate,
      netCost: hotelBookings.netCost,
      totalPrice: hotelBookings.totalPrice,
      hotelConfirmationRef: hotelBookings.hotelConfirmationRef,
      emailSentToHotel: hotelBookings.emailSentToHotel,
      emailSentAt: hotelBookings.emailSentAt,
      status: hotelBookings.status,
      specialRequests: hotelBookings.specialRequests,
      internalNotes: hotelBookings.internalNotes,
      confirmedAt: hotelBookings.confirmedAt,
      voucherIssuedAt: hotelBookings.voucherIssuedAt,
      createdAt: hotelBookings.createdAt,
      // Hotel info
      hotelId: hotelBookings.hotelId,
      hotelName: hotels.name,
      hotelBrand: hotels.brand,
      hotelAddress: hotels.address,
      hotelReservationEmail: hotels.reservationEmail,
      hotelContactEmail: hotels.contactEmail,
      hotelContactPhone: hotels.contactPhone,
      hotelCancellationPolicy: hotels.cancellationPolicy,
      countryName: countries.name,
      countryFlag: countries.flagEmoji,
      // Room
      roomTypeName: hotelRoomTypes.name,
      roomBedConfig: hotelRoomTypes.bedConfig,
      roomView: hotelRoomTypes.view,
      // Rate
      rateMealPlan: hotelRates.mealPlan,
      // Sales agent
      salesAgentName: users.name,
      salesAgentEmail: users.email,
    })
    .from(hotelBookings)
    .leftJoin(hotels, eq(hotelBookings.hotelId, hotels.id))
    .leftJoin(countries, eq(hotels.countryId, countries.id))
    .leftJoin(hotelRoomTypes, eq(hotelBookings.roomTypeId, hotelRoomTypes.id))
    .leftJoin(hotelRates, eq(hotelBookings.rateId, hotelRates.id))
    .leftJoin(users, eq(hotelBookings.salesAgentId, users.id))
    .where(eq(hotelBookings.id, id))
    .limit(1);

  if (!booking) return null;

  // Get status history
  const history = await db
    .select({
      id: hotelBookingStatusHistory.id,
      fromStatus: hotelBookingStatusHistory.fromStatus,
      toStatus: hotelBookingStatusHistory.toStatus,
      note: hotelBookingStatusHistory.note,
      changedAt: hotelBookingStatusHistory.changedAt,
      changedByName: users.name,
    })
    .from(hotelBookingStatusHistory)
    .leftJoin(users, eq(hotelBookingStatusHistory.changedBy, users.id))
    .where(eq(hotelBookingStatusHistory.bookingId, id))
    .orderBy(desc(hotelBookingStatusHistory.changedAt));

  return { ...booking, history };
}

// ─── ASSIGN TO SELF ──────────────────────────

export async function assignHotelBookingToSelf(bookingId: string) {
  const user = await requireRole(["OPS", "ADMIN"]);

  try {
    await db
      .update(hotelBookings)
      .set({ assignedOpsId: user.id })
      .where(eq(hotelBookings.id, bookingId));

    revalidatePath("/ops/hotel-queue");
    revalidatePath(`/ops/hotel-bookings/${bookingId}`);
    return { success: true };
  } catch (error) {
    console.error("assignHotelBookingToSelf error:", error);
    return { success: false, error: "Failed to assign" };
  }
}

// ─── CHANGE STATUS ───────────────────────────

export async function changeHotelBookingStatus(
  bookingId: string,
  newStatus: HotelBookingStatus,
  note?: string
) {
  const user = await requireRole(["OPS", "ADMIN"]);

  try {
    // Get current status
    const [current] = await db
      .select({ status: hotelBookings.status, salesAgentId: hotelBookings.salesAgentId })
      .from(hotelBookings)
      .where(eq(hotelBookings.id, bookingId))
      .limit(1);

    if (!current) return { success: false, error: "Booking not found" };

    // Update booking
    const updateData: Record<string, unknown> = { status: newStatus };
    if (newStatus === "CONFIRMED") updateData.confirmedAt = new Date();
    if (newStatus === "VOUCHER_ISSUED") updateData.voucherIssuedAt = new Date();
    if (newStatus === "CANCELLED") updateData.cancelledAt = new Date();

    await db.update(hotelBookings).set(updateData).where(eq(hotelBookings.id, bookingId));

    // History
    await db.insert(hotelBookingStatusHistory).values({
      bookingId,
      fromStatus: current.status,
      toStatus: newStatus,
      changedBy: user.id,
      note: note?.trim() || null,
    });

    // Notify sales agent of important changes
    const notifyStatuses: HotelBookingStatus[] = ["CONFIRMED", "VOUCHER_ISSUED", "CANCELLED"];
    if (notifyStatuses.includes(newStatus)) {
      await db.insert(notifications).values({
        userId: current.salesAgentId,
        type: "HOTEL_BOOKING_STATUS_CHANGE",
        title: `Hotel booking ${newStatus.toLowerCase().replace(/_/g, " ")}`,
        message: `Booking is now ${newStatus.replace(/_/g, " ")} · /bookings`,
      });
    }

    revalidatePath("/ops/hotel-queue");
    revalidatePath(`/ops/hotel-bookings/${bookingId}`);
    return { success: true };
  } catch (error) {
    console.error("changeHotelBookingStatus error:", error);
    return { success: false, error: "Failed to change status" };
  }
}

// ─── SAVE HOTEL CONFIRMATION REF ─────────────

export async function saveHotelConfirmationRef(
  bookingId: string,
  ref: string
) {
  await requireRole(["OPS", "ADMIN"]);

  try {
    await db
      .update(hotelBookings)
      .set({ hotelConfirmationRef: ref.trim() || null })
      .where(eq(hotelBookings.id, bookingId));

    revalidatePath(`/ops/hotel-bookings/${bookingId}`);
    return { success: true };
  } catch (error) {
    console.error("saveHotelConfirmationRef error:", error);
    return { success: false, error: "Failed to save reference" };
  }
}

// ─── SAVE INVOICE NUMBER (Sales/Ops) ─────────

export async function saveInvoiceNumber(bookingId: string, invoiceNo: string) {
  await requireAuth(); // Anyone authorized can update

  try {
    await db
      .update(hotelBookings)
      .set({ invoiceNoOdoo: invoiceNo.trim() || null })
      .where(eq(hotelBookings.id, bookingId));

    revalidatePath(`/ops/hotel-bookings/${bookingId}`);
    return { success: true };
  } catch (error) {
    console.error("saveInvoiceNumber error:", error);
    return { success: false, error: "Failed to save invoice number" };
  }
}

// ─── INTERNAL NOTES ──────────────────────────

export async function saveInternalNotes(bookingId: string, notes: string) {
  await requireRole(["OPS", "ADMIN"]);

  try {
    await db
      .update(hotelBookings)
      .set({ internalNotes: notes.trim() || null })
      .where(eq(hotelBookings.id, bookingId));

    revalidatePath(`/ops/hotel-bookings/${bookingId}`);
    return { success: true };
  } catch (error) {
    console.error("saveInternalNotes error:", error);
    return { success: false, error: "Failed to save notes" };
  }
}

// ─── MARK EMAIL AS SENT ──────────────────────

export async function markEmailSent(bookingId: string) {
  await requireRole(["OPS", "ADMIN"]);

  try {
    await db
      .update(hotelBookings)
      .set({ emailSentToHotel: true, emailSentAt: new Date() })
      .where(eq(hotelBookings.id, bookingId));

    revalidatePath(`/ops/hotel-bookings/${bookingId}`);
    return { success: true };
  } catch (error) {
    console.error("markEmailSent error:", error);
    return { success: false, error: "Failed to update" };
  }
}
