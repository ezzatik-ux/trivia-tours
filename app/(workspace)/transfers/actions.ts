"use server";

import { db } from "@/lib/db";
import {
  transferBookings,
  transferBookingStatusHistory,
  transferRates,
  users,
  notifications,
} from "@/lib/db/schema";
import { sql, eq, and, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth-utils";

export type TransferSearchLocation = {
  id: string;
  name: string;
  type: string;
  city_name: string | null;
  code: string | null;
};

export type TransferVehicleOption = {
  rateId: string;
  vehicleType: string;
  maxPax: number;
  maxLuggage: number | null;
  sellPrice: number;
};

export type TransferSearchResult = {
  routeId: string;
  fromName: string;
  fromType: string;
  toName: string;
  toType: string;
  countryName: string | null;
  estimatedDurationMin: number | null;
  vehicles: TransferVehicleOption[];
};

// Locations that are endpoints of at least one active route with active rates.
// Used to populate From/To dropdowns (only valid choices).
export async function getTransferSearchOptions(): Promise<TransferSearchLocation[]> {
  await requireAuth();
  const rows = await db.execute(sql`
    SELECT DISTINCT l.id, l.name, l.type, l.city_name, l.code
    FROM transfer_locations l
    WHERE l.is_active = true
      AND (
        l.id IN (SELECT from_location_id FROM transfer_routes WHERE is_active = true)
        OR l.id IN (SELECT to_location_id FROM transfer_routes WHERE is_active = true)
      )
    ORDER BY l.name
  `);
  return rows as unknown as TransferSearchLocation[];
}

// Search: given from + to (+ optional pax filter), return the matching active
// route with its active vehicle rate cards (per-vehicle pricing).
export async function searchTransfers(params: {
  fromLocationId: string;
  toLocationId: string;
  pax?: number;
}): Promise<TransferSearchResult[]> {
  await requireAuth();
  if (!params.fromLocationId || !params.toLocationId) return [];

  const rows = await db.execute(sql`
    SELECT
      r.id AS route_id,
      r.estimated_duration_min,
      fl.name AS from_name, fl.type AS from_type,
      tl.name AS to_name, tl.type AS to_type,
      c.name AS country_name,
      tr.id AS rate_id,
      tr.vehicle_type,
      tr.max_pax,
      tr.max_luggage,
      tr.sell_price::float AS sell_price
    FROM transfer_routes r
    JOIN transfer_locations fl ON fl.id = r.from_location_id
    JOIN transfer_locations tl ON tl.id = r.to_location_id
    LEFT JOIN countries c ON c.id = r.country_id
    JOIN transfer_rates tr ON tr.route_id = r.id AND tr.is_active = true
    WHERE r.is_active = true
      AND r.from_location_id = ${params.fromLocationId}
      AND r.to_location_id = ${params.toLocationId}
      ${params.pax ? sql`AND tr.max_pax >= ${params.pax}` : sql``}
    ORDER BY tr.sell_price ASC
  `);

  const flat = rows as unknown as Array<{
    route_id: string;
    estimated_duration_min: number | null;
    from_name: string; from_type: string;
    to_name: string; to_type: string;
    country_name: string | null;
    rate_id: string;
    vehicle_type: string;
    max_pax: number;
    max_luggage: number | null;
    sell_price: number;
  }>;

  // Group vehicle rows under their route
  const map = new Map<string, TransferSearchResult>();
  for (const row of flat) {
    if (!map.has(row.route_id)) {
      map.set(row.route_id, {
        routeId: row.route_id,
        fromName: row.from_name,
        fromType: row.from_type,
        toName: row.to_name,
        toType: row.to_type,
        countryName: row.country_name,
        estimatedDurationMin: row.estimated_duration_min,
        vehicles: [],
      });
    }
    map.get(row.route_id)!.vehicles.push({
      rateId: row.rate_id,
      vehicleType: row.vehicle_type,
      maxPax: row.max_pax,
      maxLuggage: row.max_luggage,
      sellPrice: row.sell_price,
    });
  }
  return Array.from(map.values());
}

// ─── BOOKING CONTEXT (load route + selected vehicle for booking page) ───

export type TransferBookingContext = {
  routeId: string;
  rateId: string;
  fromName: string;
  toName: string;
  countryName: string | null;
  estimatedDurationMin: number | null;
  vehicleType: string;
  maxPax: number;
  maxLuggage: number | null;
  sellPrice: number;
  supplierId: string | null;
};

export async function getTransferBookingContext(
  routeId: string,
  rateId: string
): Promise<TransferBookingContext | null> {
  await requireAuth();
  const rows = await db.execute(sql`
    SELECT
      r.id AS route_id,
      r.estimated_duration_min,
      r.supplier_id,
      fl.name AS from_name,
      tl.name AS to_name,
      c.name AS country_name,
      tr.id AS rate_id,
      tr.vehicle_type,
      tr.max_pax,
      tr.max_luggage,
      tr.sell_price::float AS sell_price,
      tr.net_price::float AS net_price
    FROM transfer_routes r
    JOIN transfer_locations fl ON fl.id = r.from_location_id
    JOIN transfer_locations tl ON tl.id = r.to_location_id
    LEFT JOIN countries c ON c.id = r.country_id
    JOIN transfer_rates tr ON tr.route_id = r.id
    WHERE r.id = ${routeId} AND tr.id = ${rateId} AND tr.is_active = true AND r.is_active = true
    LIMIT 1
  `);
  const arr = rows as unknown as Array<{
    route_id: string; estimated_duration_min: number | null; supplier_id: string | null;
    from_name: string; to_name: string; country_name: string | null;
    rate_id: string; vehicle_type: string; max_pax: number; max_luggage: number | null;
    sell_price: number; net_price: number;
  }>;
  const row = arr[0];
  if (!row) return null;
  return {
    routeId: row.route_id,
    rateId: row.rate_id,
    fromName: row.from_name,
    toName: row.to_name,
    countryName: row.country_name,
    estimatedDurationMin: row.estimated_duration_min,
    vehicleType: row.vehicle_type,
    maxPax: row.max_pax,
    maxLuggage: row.max_luggage,
    sellPrice: row.sell_price,
    supplierId: row.supplier_id,
  };
}

// ─── CREATE TRANSFER BOOKING ───

export type TransferBookingInput = {
  routeId: string;
  rateId: string;
  numVehicles: number;
  transferDate: string;
  pickupTime?: string | null;
  flightNumber?: string | null;
  pax: number;
  luggageCount?: number | null;
  pickupAddress?: string | null;
  dropoffAddress?: string | null;
  customerName: string;
  customerEmail?: string | null;
  customerPhone?: string | null;
  customerNationality?: string | null;
  specialRequests?: string | null;
  tripType?: "ONE_WAY" | "ROUND_TRIP";
  arrivalTerminal?: string | null;
  greetingSign?: string | null;
  returnDate?: string | null;
  returnPickupTime?: string | null;
  returnFlightNumber?: string | null;
  returnTerminal?: string | null;
  returnFlightDeparture?: string | null;
};

export async function createTransferBooking(input: TransferBookingInput) {
  const user = await requireAuth();

  if (!input.customerName?.trim()) {
    return { success: false, error: "Customer name is required" };
  }
  if (!input.transferDate) {
    return { success: false, error: "Transfer date is required" };
  }

  try {
    // SERVER-SIDE PRICE RECOMPUTE — never trust client price.
    // Re-read the rate from DB and compute total = sellPrice * numVehicles.
    const [rate] = await db
      .select()
      .from(transferRates)
      .where(and(eq(transferRates.id, input.rateId), eq(transferRates.isActive, true)))
      .limit(1);

    if (!rate) {
      return { success: false, error: "Selected vehicle rate is no longer available" };
    }

    const numVehicles = Math.max(1, input.numVehicles || 1);
    const tripType = input.tripType === "ROUND_TRIP" ? "ROUND_TRIP" : "ONE_WAY";
    const legMultiplier = tripType === "ROUND_TRIP" ? 2 : 1;
    const unitPrice = Number(rate.sellPrice ?? 0);
    const unitNet = Number(rate.netPrice ?? 0);
    const totalPrice = unitPrice * numVehicles * legMultiplier;
    const netCost = unitNet * numVehicles * legMultiplier;

    const salesOrderNo = `SO-T-${Date.now().toString().slice(-8)}`;
    const now = new Date();
    const yymm = `${now.getFullYear().toString().slice(-2)}${(now.getMonth() + 1).toString().padStart(2, "0")}`;
    const bookingNo = `TR-${yymm}-${Date.now().toString().slice(-5)}`;

    const [booking] = await db
      .insert(transferBookings)
      .values({
        bookingNo,
        salesOrderNo,
        salesAgentId: user.id,
        routeId: input.routeId,
        rateId: input.rateId,
        supplierId: null,
        vehicleType: rate.vehicleType,
        numVehicles,
        tripType,
        arrivalTerminal: input.arrivalTerminal?.trim() || null,
        greetingSign: input.greetingSign?.trim() || null,
        returnDate: input.returnDate || null,
        returnPickupTime: input.returnPickupTime?.trim() || null,
        returnFlightNumber: input.returnFlightNumber?.trim() || null,
        returnTerminal: input.returnTerminal?.trim() || null,
        returnFlightDeparture: input.returnFlightDeparture?.trim() || null,
        customerName: input.customerName.trim(),
        customerEmail: input.customerEmail?.trim() || null,
        customerPhone: input.customerPhone?.trim() || null,
        customerNationality: input.customerNationality?.trim() || null,
        transferDate: input.transferDate,
        pickupTime: input.pickupTime?.trim() || null,
        flightNumber: input.flightNumber?.trim() || null,
        pax: input.pax,
        luggageCount: input.luggageCount ?? null,
        pickupAddress: input.pickupAddress?.trim() || null,
        dropoffAddress: input.dropoffAddress?.trim() || null,
        unitPrice: unitPrice.toString(),
        netCost: netCost.toString(),
        totalPrice: totalPrice.toString(),
        status: "NEW",
        specialRequests: input.specialRequests?.trim() || null,
      })
      .returning();

    await db.insert(transferBookingStatusHistory).values({
      bookingId: booking.id,
      fromStatus: null,
      toStatus: "NEW",
      changedBy: user.id,
      note: "Transfer booking created by sales agent",
    });

    // Notify OPS + ADMIN (relatedBookingId left null — its FK points at the
    // tours bookings table, not transfers; link is embedded in the message)
    const opsUsers = await db
      .select({ id: users.id })
      .from(users)
      .where(and(inArray(users.role, ["OPS", "ADMIN"]), eq(users.isActive, true)));

    if (opsUsers.length > 0) {
      await db.insert(notifications).values(
        opsUsers.map((u) => ({
          userId: u.id,
          type: "TRANSFER_BOOKING_NEW",
          title: `New transfer booking: ${booking.bookingNo}`,
          message: `${input.customerName} · ${input.transferDate} · /ops/transfer-queue?booking=${booking.id}`,
        }))
      );
    }

    revalidatePath("/transfers");
    return { success: true, bookingId: booking.id, bookingNo: booking.bookingNo };
  } catch (error) {
    console.error("createTransferBooking error:", error);
    return { success: false, error: "Failed to create transfer booking" };
  }
}

// ─── GET TRANSFER BOOKING (confirmation view) ───

export async function getTransferBookingById(id: string) {
  await requireAuth();
  const rows = await db.execute(sql`
    SELECT
      b.id, b.booking_no, b.sales_order_no, b.customer_name, b.customer_email,
      b.customer_phone, b.transfer_date, b.pickup_time, b.flight_number,
      b.pax, b.num_vehicles, b.vehicle_type, b.luggage_count,
      b.pickup_address, b.dropoff_address, b.total_price::float AS total_price,
      b.status, b.special_requests, b.created_at,
      fl.name AS from_name, tl.name AS to_name,
      c.name AS country_name, r.estimated_duration_min
    FROM transfer_bookings b
    JOIN transfer_routes r ON r.id = b.route_id
    JOIN transfer_locations fl ON fl.id = r.from_location_id
    JOIN transfer_locations tl ON tl.id = r.to_location_id
    LEFT JOIN countries c ON c.id = r.country_id
    WHERE b.id = ${id}
    LIMIT 1
  `);
  const arr = rows as unknown as Array<Record<string, unknown>>;
  return arr[0] ?? null;
}
