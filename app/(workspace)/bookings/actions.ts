"use server";

import { db } from "@/lib/db";
import {
  bookings,
  bookingStatusHistory,
  rates,
  products,
  countries,
  users,
  notifications,
} from "@/lib/db/schema";
import { eq, desc, and, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth-utils";

export type CreateBookingInput = {
  productId: string;
  rateId: string;
  travelDate: string;
  adults: number;
  children: number;
  infants: number;
  unitAdult: number;
  unitChild: number;
  unitInfant: number;
  totalPrice: number;
  salesOrderNo: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  customerCountry?: string;
  customerNationality?: string;
  pickupTime?: string;
  pickupLocation?: string;
  dropoffLocation?: string;
  specialRequests?: string;
  internalNotes?: string;
};

/**
 * Get product details for booking review
 */
export async function getProductForBooking(productId: string) {
  await requireAuth();

  const result = await db
    .select({
      id: products.id,
      type: products.type,
      name: products.name,
      countryId: products.countryId,
      countryName: countries.name,
      countryFlag: countries.flagEmoji,
      durationHours: products.durationHours,
    })
    .from(products)
    .leftJoin(countries, eq(products.countryId, countries.id))
    .where(eq(products.id, productId))
    .limit(1);

  return result[0] ?? null;
}

/**
 * Get rate details including supplier for booking
 */
export async function getRateForBooking(rateId: string) {
  await requireAuth();

  const [rate] = await db
    .select()
    .from(rates)
    .where(eq(rates.id, rateId))
    .limit(1);

  return rate ?? null;
}

/**
 * Create a booking — wraps creation, status history, and notifications
 */
export async function createBooking(input: CreateBookingInput) {
  const user = await requireAuth();

  // Validation
  if (!input.salesOrderNo?.trim()) {
    return { success: false, error: "Sales Order # is required" };
  }
  if (!input.customerName?.trim()) {
    return { success: false, error: "Customer name is required" };
  }
  if (input.adults < 1) {
    return { success: false, error: "At least 1 adult required" };
  }

  try {
    // Fetch the rate for net cost snapshot
    const rate = await getRateForBooking(input.rateId);
    if (!rate) {
      return { success: false, error: "Selected rate no longer exists" };
    }

    // Calculate net cost (what we owe supplier)
    const netCost =
      input.adults * parseFloat(rate.netAdult) +
      input.children * parseFloat(rate.netChild) +
      input.infants * parseFloat(rate.netInfant);

    // Insert booking
    const [created] = await db
      .insert(bookings)
      .values({
        salesOrderNo: input.salesOrderNo.trim(),
        salesAgentId: user.id,
        productId: input.productId,
        rateId: input.rateId,
        supplierId: rate.supplierId || null,
        customerName: input.customerName.trim(),
        customerEmail: input.customerEmail?.trim() || null,
        customerPhone: input.customerPhone?.trim() || null,
        customerCountry: input.customerCountry?.trim() || null,
        customerNationality: input.customerNationality?.trim() || null,
        travelDate: input.travelDate,
        pickupTime: input.pickupTime?.trim() || null,
        pickupLocation: input.pickupLocation?.trim() || null,
        dropoffLocation: input.dropoffLocation?.trim() || null,
        adults: input.adults,
        children: input.children,
        infants: input.infants,
        totalPax: input.adults + input.children + input.infants,
        unitAdult: input.unitAdult.toString(),
        unitChild: input.unitChild.toString(),
        unitInfant: input.unitInfant.toString(),
        netCost: netCost.toString(),
        totalPrice: input.totalPrice.toString(),
        status: "NEW",
        paymentStatus: "PENDING",
        specialRequests: input.specialRequests?.trim() || null,
        internalNotes: input.internalNotes?.trim() || null,
      })
      .returning();

    // Log status history (initial creation)
    await db.insert(bookingStatusHistory).values({
      bookingId: created.id,
      fromStatus: null,
      toStatus: "NEW",
      changedBy: user.id,
      note: "Booking created",
    });

    // Notify OPS team
    const opsUsers = await db
      .select({ id: users.id })
      .from(users)
      .where(and(inArray(users.role, ["OPS", "ADMIN"]), eq(users.isActive, true)));

    if (opsUsers.length > 0) {
      await db.insert(notifications).values(
        opsUsers.map((u) => ({
          userId: u.id,
          type: "NEW_BOOKING",
          title: `New booking: ${created.bookingNo}`,
          message: `${input.customerName} · ${input.adults + input.children + input.infants} pax · ${input.travelDate}`,
          relatedBookingId: created.id,
        }))
      );
    }

    revalidatePath("/bookings");
    revalidatePath("/ops/queue");

    return {
      success: true,
      bookingId: created.id,
      bookingNo: created.bookingNo,
    };
  } catch (error) {
    console.error("createBooking error:", error);
    return { success: false, error: "Failed to create booking. Please try again." };
  }
}

/**
 * Get all bookings for the current user (sales agent's own)
 */
export async function getMyBookings() {
  const user = await requireAuth();

  const result = await db
    .select({
      id: bookings.id,
      bookingNo: bookings.bookingNo,
      salesOrderNo: bookings.salesOrderNo,
      customerName: bookings.customerName,
      travelDate: bookings.travelDate,
      totalPax: bookings.totalPax,
      totalPrice: bookings.totalPrice,
      status: bookings.status,
      paymentStatus: bookings.paymentStatus,
      createdAt: bookings.createdAt,
      productName: products.name,
      productType: products.type,
      countryFlag: countries.flagEmoji,
      countryName: countries.name,
    })
    .from(bookings)
    .leftJoin(products, eq(bookings.productId, products.id))
    .leftJoin(countries, eq(products.countryId, countries.id))
    .where(eq(bookings.salesAgentId, user.id))
    .orderBy(desc(bookings.createdAt));

  return result;
}

/**
 * Get a single booking by ID (with full details, for confirmation page)
 */
export async function getBookingById(id: string) {
  await requireAuth();

  const result = await db
    .select({
      booking: bookings,
      productName: products.name,
      productType: products.type,
      countryName: countries.name,
      countryFlag: countries.flagEmoji,
    })
    .from(bookings)
    .leftJoin(products, eq(bookings.productId, products.id))
    .leftJoin(countries, eq(products.countryId, countries.id))
    .where(eq(bookings.id, id))
    .limit(1);

  return result[0] ?? null;
}
