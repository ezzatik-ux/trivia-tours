"use server";

import { db } from "@/lib/db";
import {
  hotels,
  hotelImages,
  countries,
} from "@/lib/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-utils";

export type HotelInput = {
  name: string;
  slug: string;
  brand?: string | null;
  starRating?: number | null;
  countryId: string;
  cityId?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  shortDesc?: string | null;
  longDesc?: string | null;
  amenities?: string[];
  policies?: string | null;
  cancellationPolicy?: string | null;
  importantInfo?: string | null;
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  reservationEmail?: string | null;
  status: "DRAFT" | "ACTIVE" | "INACTIVE";
};

export type HotelImageInput = {
  url: string;
  caption?: string | null;
  isCover: boolean;
  sortOrder: number;
};

/**
 * Get all hotels with country info and cover image
 */
export async function getHotels() {
  await requireRole(["PRODUCT", "ADMIN"]);

  return db
    .select({
      id: hotels.id,
      name: hotels.name,
      slug: hotels.slug,
      brand: hotels.brand,
      starRating: hotels.starRating,
      shortDesc: hotels.shortDesc,
      status: hotels.status,
      countryId: hotels.countryId,
      countryName: countries.name,
      countryCode: countries.code,
      createdAt: hotels.createdAt,
      coverImage: sql<string | null>`(
        SELECT url FROM ${hotelImages}
        WHERE ${hotelImages.hotelId} = ${hotels.id}
        AND ${hotelImages.isCover} = true
        LIMIT 1
      )`.as("cover_image"),
    })
    .from(hotels)
    .leftJoin(countries, eq(hotels.countryId, countries.id))
    .orderBy(desc(hotels.createdAt));
}

/**
 * Get hotel by ID with images
 */
export async function getHotelById(id: string) {
  await requireRole(["PRODUCT", "ADMIN"]);

  const [hotel] = await db
    .select()
    .from(hotels)
    .where(eq(hotels.id, id))
    .limit(1);

  if (!hotel) return null;

  const images = await db
    .select()
    .from(hotelImages)
    .where(eq(hotelImages.hotelId, id))
    .orderBy(hotelImages.sortOrder);

  return { ...hotel, images };
}

/**
 * Get countries for dropdown
 */
export async function getCountriesForHotels() {
  return db
    .select({
      id: countries.id,
      code: countries.code,
      name: countries.name,
    })
    .from(countries)
    .where(eq(countries.isActive, true))
    .orderBy(countries.sortOrder);
}

/**
 * Create hotel
 */
export async function createHotel(
  input: HotelInput,
  images: HotelImageInput[]
) {
  await requireRole(["PRODUCT", "ADMIN"]);

  if (!input.name?.trim()) {
    return { success: false, error: "Hotel name is required" };
  }
  if (!input.countryId) {
    return { success: false, error: "Country is required" };
  }
  if (!input.slug?.trim()) {
    return { success: false, error: "Slug is required" };
  }

  try {
    const [created] = await db
      .insert(hotels)
      .values({
        name: input.name.trim(),
        slug: input.slug.trim(),
        brand: input.brand?.trim() || null,
        starRating: input.starRating ?? null,
        countryId: input.countryId,
        cityId: input.cityId || null,
        address: input.address?.trim() || null,
        latitude: input.latitude?.toString() ?? null,
        longitude: input.longitude?.toString() ?? null,
        shortDesc: input.shortDesc?.trim() || null,
        longDesc: input.longDesc?.trim() || null,
        amenities: input.amenities ?? [],
        policies: input.policies?.trim() || null,
        cancellationPolicy: input.cancellationPolicy?.trim() || null,
        importantInfo: input.importantInfo?.trim() || null,
        contactName: input.contactName?.trim() || null,
        contactEmail: input.contactEmail?.trim() || null,
        contactPhone: input.contactPhone?.trim() || null,
        reservationEmail: input.reservationEmail?.trim() || null,
        status: input.status,
      })
      .returning();

    if (images.length > 0) {
      await db.insert(hotelImages).values(
        images.map((img, idx) => ({
          hotelId: created.id,
          url: img.url,
          caption: img.caption || null,
          isCover: img.isCover,
          sortOrder: idx,
        }))
      );
    }

    revalidatePath("/admin/hotels");
    return { success: true, hotelId: created.id };
  } catch (error) {
    console.error("createHotel error:", error);
    return { success: false, error: "Failed to create hotel. Slug may already exist." };
  }
}

/**
 * Update hotel
 */
export async function updateHotel(
  id: string,
  input: HotelInput,
  images: HotelImageInput[]
) {
  await requireRole(["PRODUCT", "ADMIN"]);

  if (!input.name?.trim()) {
    return { success: false, error: "Hotel name is required" };
  }

  try {
    await db
      .update(hotels)
      .set({
        name: input.name.trim(),
        slug: input.slug.trim(),
        brand: input.brand?.trim() || null,
        starRating: input.starRating ?? null,
        countryId: input.countryId,
        cityId: input.cityId || null,
        address: input.address?.trim() || null,
        latitude: input.latitude?.toString() ?? null,
        longitude: input.longitude?.toString() ?? null,
        shortDesc: input.shortDesc?.trim() || null,
        longDesc: input.longDesc?.trim() || null,
        amenities: input.amenities ?? [],
        policies: input.policies?.trim() || null,
        cancellationPolicy: input.cancellationPolicy?.trim() || null,
        importantInfo: input.importantInfo?.trim() || null,
        contactName: input.contactName?.trim() || null,
        contactEmail: input.contactEmail?.trim() || null,
        contactPhone: input.contactPhone?.trim() || null,
        reservationEmail: input.reservationEmail?.trim() || null,
        status: input.status,
        updatedAt: new Date(),
      })
      .where(eq(hotels.id, id));

    // Replace images
    await db.delete(hotelImages).where(eq(hotelImages.hotelId, id));
    if (images.length > 0) {
      await db.insert(hotelImages).values(
        images.map((img, idx) => ({
          hotelId: id,
          url: img.url,
          caption: img.caption || null,
          isCover: img.isCover,
          sortOrder: idx,
        }))
      );
    }

    revalidatePath("/admin/hotels");
    revalidatePath(`/admin/hotels/${id}/edit`);
    return { success: true };
  } catch (error) {
    console.error("updateHotel error:", error);
    return { success: false, error: "Failed to update hotel" };
  }
}

/**
 * Cycle hotel status
 */
export async function cycleHotelStatus(
  id: string,
  currentStatus: "DRAFT" | "ACTIVE" | "INACTIVE"
) {
  await requireRole(["PRODUCT", "ADMIN"]);

  const nextStatus: "DRAFT" | "ACTIVE" | "INACTIVE" =
    currentStatus === "DRAFT" ? "ACTIVE"
    : currentStatus === "ACTIVE" ? "INACTIVE"
    : "DRAFT";

  try {
    await db.update(hotels).set({ status: nextStatus }).where(eq(hotels.id, id));
    revalidatePath("/admin/hotels");
    return { success: true, status: nextStatus };
  } catch (error) {
    console.error("cycleHotelStatus error:", error);
    return { success: false, error: "Failed to update status" };
  }
}

/**
 * Delete hotel (and cascade everything)
 */
export async function deleteHotel(id: string) {
  await requireRole(["PRODUCT", "ADMIN"]);

  try {
    await db.delete(hotels).where(eq(hotels.id, id));
    revalidatePath("/admin/hotels");
    return { success: true };
  } catch (error) {
    console.error("deleteHotel error:", error);
    return { success: false, error: "Failed to delete hotel" };
  }
}
