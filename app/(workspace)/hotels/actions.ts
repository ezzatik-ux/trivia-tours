"use server";

import { db } from "@/lib/db";
import {
  hotels,
  hotelImages,
  hotelRoomTypes,
  hotelRates,
  hotelBookings,
  hotelBookingStatusHistory,
  countries,
  notifications,
  users,
} from "@/lib/db/schema";
import { eq, and, gte, lte, sql, inArray, or, ilike } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth-utils";

// ─── TYPES ───────────────────────────────────

export type HotelSearchParams = {
  destination?: string; // Country ID or "ALL"
  query?: string; // free-text: hotel name or address/city
  checkIn?: string;
  checkOut?: string;
  pax?: number;
  starRatings?: number[]; // [3, 4, 5]
  amenities?: string[];
  minPrice?: number;
  maxPrice?: number;
  sortBy?: "best" | "price_asc" | "price_desc" | "stars_desc";
};

export type HotelBookingInput = {
  hotelId: string;
  roomTypeId: string;
  rateId: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  numRooms: number;
  occupancy: "SINGLE" | "DOUBLE" | "TRIPLE" | "QUAD";
  adults: number;
  children: number;
  infants: number;
  customerName: string;
  customerEmail?: string | null;
  customerPhone?: string | null;
  customerCountry?: string | null;
  customerNationality?: string | null;
  unitRate: number;
  childSupplements: number;
  totalPrice: number;
  netCost: number;
  specialRequests?: string | null;
};

// ─── GET COUNTRIES (with hotel counts) ───────

export async function getCountriesWithHotels() {
  await requireAuth();

  const rows = await db
    .select({
      id: countries.id,
      code: countries.code,
      name: countries.name,
      hotelCount: sql<number>`COUNT(${hotels.id})::int`,
    })
    .from(countries)
    .leftJoin(
      hotels,
      and(eq(hotels.countryId, countries.id), eq(hotels.status, "ACTIVE"))
    )
    .where(eq(countries.isActive, true))
    .groupBy(countries.id, countries.code, countries.name, countries.sortOrder)
    .orderBy(countries.sortOrder);

  return rows.filter((r) => r.hotelCount > 0);
}

// ─── SEARCH HOTELS ───────────────────────────

export async function searchHotels(params: HotelSearchParams) {
  await requireAuth();

  // Step 1: Get all active hotels matching basic filters
  const conditions = [eq(hotels.status, "ACTIVE")];

  if (params.destination && params.destination !== "ALL") {
    conditions.push(eq(hotels.countryId, params.destination));
  }

  if (params.starRatings && params.starRatings.length > 0) {
    conditions.push(inArray(hotels.starRating, params.starRatings));
  }

  if (params.query && params.query.trim()) {
    const q = `%${params.query.trim()}%`;
    const nameMatch = ilike(hotels.name, q);
    const addressMatch = ilike(hotels.address, q);
    const orClause = or(nameMatch, addressMatch);
    if (orClause) conditions.push(orClause);
  }

  const allHotels = await db
    .select({
      id: hotels.id,
      name: hotels.name,
      slug: hotels.slug,
      brand: hotels.brand,
      starRating: hotels.starRating,
      shortDesc: hotels.shortDesc,
      amenities: hotels.amenities,
      countryId: hotels.countryId,
      countryName: countries.name,
      countryCode: countries.code,
      coverImage: sql<string | null>`(
        SELECT url FROM ${hotelImages}
        WHERE ${hotelImages.hotelId} = ${hotels.id}
        AND ${hotelImages.isCover} = true
        LIMIT 1
      )`.as("cover_image"),
      // Min sell price across all active rates — cast to float for JS number
      minPrice: sql<number | null>`(
        SELECT MIN(${hotelRates.sellDouble}::numeric)::float
        FROM ${hotelRates}
        WHERE ${hotelRates.hotelId} = ${hotels.id}
        AND ${hotelRates.isActive} = true
        AND ${hotelRates.sellDouble}::numeric > 0
      )`.as("min_price"),
    })
    .from(hotels)
    .leftJoin(countries, eq(hotels.countryId, countries.id))
    .where(and(...conditions))
    .orderBy(hotels.name);

  // Step 2: Filter by date availability if dates provided
  let filtered = allHotels;
  if (params.checkIn && params.checkOut) {
    const hotelIdsWithRates = await db
      .select({ hotelId: hotelRates.hotelId })
      .from(hotelRates)
      .where(
        and(
          eq(hotelRates.isActive, true),
          lte(hotelRates.validFrom, params.checkIn),
          gte(hotelRates.validTo, params.checkOut)
        )
      )
      .groupBy(hotelRates.hotelId);

    const validIds = new Set(hotelIdsWithRates.map((h) => h.hotelId));
    filtered = filtered.filter((h) => validIds.has(h.id));
  }

  // Step 3: Filter by amenities (in-memory, all selected amenities must be present)
  if (params.amenities && params.amenities.length > 0) {
    filtered = filtered.filter((h) =>
      params.amenities!.every((a) =>
        (h.amenities ?? []).some((ha) => ha.toLowerCase() === a.toLowerCase())
      )
    );
  }

  // Step 4: Filter by price range
  if (params.minPrice !== undefined) {
    filtered = filtered.filter((h) => (h.minPrice ?? 0) >= params.minPrice!);
  }
  if (params.maxPrice !== undefined) {
    filtered = filtered.filter((h) => (h.minPrice ?? 99999) <= params.maxPrice!);
  }

  // Step 5: Sort
  switch (params.sortBy) {
    case "price_asc":
      filtered.sort((a, b) => (a.minPrice ?? 99999) - (b.minPrice ?? 99999));
      break;
    case "price_desc":
      filtered.sort((a, b) => (b.minPrice ?? 0) - (a.minPrice ?? 0));
      break;
    case "stars_desc":
      filtered.sort((a, b) => (b.starRating ?? 0) - (a.starRating ?? 0));
      break;
    default:
      filtered.sort((a, b) => {
        const aHasPrice = a.minPrice ? 1 : 0;
        const bHasPrice = b.minPrice ? 1 : 0;
        if (aHasPrice !== bHasPrice) return bHasPrice - aHasPrice;
        return (b.starRating ?? 0) - (a.starRating ?? 0);
      });
  }

  return filtered;
}

// ─── GET HOTEL DETAIL WITH ROOMS + RATES ─────

export async function getHotelDetailForSales(
  hotelId: string,
  checkIn?: string,
  checkOut?: string
) {
  await requireAuth();

  const [hotel] = await db
    .select({
      id: hotels.id,
      name: hotels.name,
      slug: hotels.slug,
      brand: hotels.brand,
      starRating: hotels.starRating,
      shortDesc: hotels.shortDesc,
      longDesc: hotels.longDesc,
      address: hotels.address,
      amenities: hotels.amenities,
      policies: hotels.policies,
      cancellationPolicy: hotels.cancellationPolicy,
      importantInfo: hotels.importantInfo,
      countryName: countries.name,
      countryCode: countries.code,
    })
    .from(hotels)
    .leftJoin(countries, eq(hotels.countryId, countries.id))
    .where(and(eq(hotels.id, hotelId), eq(hotels.status, "ACTIVE")))
    .limit(1);

  if (!hotel) return null;

  const images = await db
    .select()
    .from(hotelImages)
    .where(eq(hotelImages.hotelId, hotelId))
    .orderBy(hotelImages.sortOrder);

  const roomTypes = await db
    .select()
    .from(hotelRoomTypes)
    .where(
      and(eq(hotelRoomTypes.hotelId, hotelId), eq(hotelRoomTypes.isActive, true))
    )
    .orderBy(hotelRoomTypes.sortOrder, hotelRoomTypes.name);

  let applicableRates: (typeof hotelRates.$inferSelect)[] = [];
  if (checkIn && checkOut) {
    applicableRates = await db
      .select()
      .from(hotelRates)
      .where(
        and(
          eq(hotelRates.hotelId, hotelId),
          eq(hotelRates.isActive, true),
          lte(hotelRates.validFrom, checkIn),
          gte(hotelRates.validTo, checkOut)
        )
      );
  } else {
    applicableRates = await db
      .select()
      .from(hotelRates)
      .where(
        and(eq(hotelRates.hotelId, hotelId), eq(hotelRates.isActive, true))
      );
  }

  const roomsWithRates = roomTypes.map((rt) => {
    const ratesForRoom = applicableRates.filter((r) => r.roomTypeId === rt.id);
    const bestRate = ratesForRoom.sort(
      (a, b) =>
        parseFloat(a.sellDouble ?? "0") - parseFloat(b.sellDouble ?? "0")
    )[0];
    return { ...rt, rate: bestRate ?? null, allRates: ratesForRoom };
  });

  return { ...hotel, images, rooms: roomsWithRates };
}

// ─── CREATE HOTEL BOOKING ────────────────────

export async function createHotelBooking(input: HotelBookingInput) {
  const user = await requireAuth();

  if (!input.customerName?.trim()) {
    return { success: false, error: "Customer name is required" };
  }
  if (!input.checkIn || !input.checkOut) {
    return { success: false, error: "Check-in and check-out dates required" };
  }
  if (new Date(input.checkOut) <= new Date(input.checkIn)) {
    return { success: false, error: "Check-out must be after check-in" };
  }

  try {
    const salesOrderNo = `SO-H-${Date.now().toString().slice(-8)}`;
    const now = new Date();
    const yymm = `${now.getFullYear().toString().slice(-2)}${(now.getMonth() + 1).toString().padStart(2, "0")}`;
    const bookingNo = `HB-${yymm}-${Date.now().toString().slice(-5)}`;

    const [booking] = await db
      .insert(hotelBookings)
      .values({
        bookingNo,
        salesOrderNo,
        salesAgentId: user.id,
        hotelId: input.hotelId,
        roomTypeId: input.roomTypeId,
        rateId: input.rateId,
        customerName: input.customerName.trim(),
        customerEmail: input.customerEmail?.trim() || null,
        customerPhone: input.customerPhone?.trim() || null,
        customerCountry: input.customerCountry?.trim() || null,
        customerNationality: input.customerNationality?.trim() || null,
        checkIn: input.checkIn,
        checkOut: input.checkOut,
        nights: input.nights,
        numRooms: input.numRooms,
        occupancy: input.occupancy,
        adults: input.adults,
        children: input.children,
        infants: input.infants,
        unitRate: input.unitRate.toString(),
        childSupplements: input.childSupplements.toString(),
        seasonSurcharge: "0",
        earlyBirdDiscount: "0",
        netCost: input.netCost.toString(),
        totalPrice: input.totalPrice.toString(),
        status: "NEW",
        specialRequests: input.specialRequests?.trim() || null,
      })
      .returning();

    await db.insert(hotelBookingStatusHistory).values({
      bookingId: booking.id,
      fromStatus: null,
      toStatus: "NEW",
      changedBy: user.id,
      note: "Booking created by sales agent",
    });

    const opsUsers = await db
      .select({ id: users.id })
      .from(users)
      .where(and(inArray(users.role, ["OPS", "ADMIN"]), eq(users.isActive, true)));

    if (opsUsers.length > 0) {
      await db.insert(notifications).values(
        opsUsers.map((opsUser) => ({
          userId: opsUser.id,
          type: "HOTEL_BOOKING_NEW",
          title: `New hotel booking: ${booking.bookingNo}`,
          message: `${input.customerName} · ${input.nights} nights · /ops/hotel-queue?booking=${booking.id}`,
        }))
      );
    }

    revalidatePath("/hotels");
    return { success: true, bookingId: booking.id, bookingNo: booking.bookingNo };
  } catch (error) {
    console.error("createHotelBooking error:", error);
    return { success: false, error: "Failed to create booking" };
  }
}

// ─── GET BOOKING FOR CONFIRMATION ────────────

export async function getHotelBookingById(id: string) {
  await requireAuth();

  const [booking] = await db
    .select({
      id: hotelBookings.id,
      bookingNo: hotelBookings.bookingNo,
      salesOrderNo: hotelBookings.salesOrderNo,
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
      status: hotelBookings.status,
      specialRequests: hotelBookings.specialRequests,
      hotelName: hotels.name,
      hotelBrand: hotels.brand,
      roomTypeName: hotelRoomTypes.name,
      countryName: countries.name,
      countryCode: countries.code,
      createdAt: hotelBookings.createdAt,
    })
    .from(hotelBookings)
    .leftJoin(hotels, eq(hotelBookings.hotelId, hotels.id))
    .leftJoin(hotelRoomTypes, eq(hotelBookings.roomTypeId, hotelRoomTypes.id))
    .leftJoin(countries, eq(hotels.countryId, countries.id))
    .where(eq(hotelBookings.id, id))
    .limit(1);

  return booking ?? null;
}
