"use server";

import { db } from "@/lib/db";
import { hotelRoomTypes } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-utils";

export type RoomTypeInput = {
  hotelId: string;
  name: string;
  description?: string | null;
  maxOccupancy: number;
  bedConfig?: string | null;
  sizeM2?: number | null;
  view?: string | null;
  images?: string[];
  amenities?: string[];
  totalRooms?: number | null;
  isActive: boolean;
};

export async function getRoomTypesByHotel(hotelId: string) {
  await requireRole(["PRODUCT", "ADMIN"]);

  return db
    .select()
    .from(hotelRoomTypes)
    .where(eq(hotelRoomTypes.hotelId, hotelId))
    .orderBy(hotelRoomTypes.sortOrder, hotelRoomTypes.name);
}

export async function createRoomType(input: RoomTypeInput) {
  await requireRole(["PRODUCT", "ADMIN"]);

  if (!input.name?.trim()) {
    return { success: false, error: "Room type name is required" };
  }

  try {
    await db.insert(hotelRoomTypes).values({
      hotelId: input.hotelId,
      name: input.name.trim(),
      description: input.description?.trim() || null,
      maxOccupancy: input.maxOccupancy,
      bedConfig: input.bedConfig?.trim() || null,
      sizeM2: input.sizeM2?.toString() ?? null,
      view: input.view?.trim() || null,
      images: input.images ?? [],
      amenities: input.amenities ?? [],
      totalRooms: input.totalRooms ?? null,
      isActive: input.isActive,
    });

    revalidatePath(`/admin/hotels/${input.hotelId}/rooms`);
    return { success: true };
  } catch (error) {
    console.error("createRoomType error:", error);
    return { success: false, error: "Failed to create room type" };
  }
}

export async function updateRoomType(id: string, input: RoomTypeInput) {
  await requireRole(["PRODUCT", "ADMIN"]);

  if (!input.name?.trim()) {
    return { success: false, error: "Room type name is required" };
  }

  try {
    await db
      .update(hotelRoomTypes)
      .set({
        name: input.name.trim(),
        description: input.description?.trim() || null,
        maxOccupancy: input.maxOccupancy,
        bedConfig: input.bedConfig?.trim() || null,
        sizeM2: input.sizeM2?.toString() ?? null,
        view: input.view?.trim() || null,
        images: input.images ?? [],
        amenities: input.amenities ?? [],
        totalRooms: input.totalRooms ?? null,
        isActive: input.isActive,
        updatedAt: new Date(),
      })
      .where(eq(hotelRoomTypes.id, id));

    revalidatePath(`/admin/hotels/${input.hotelId}/rooms`);
    return { success: true };
  } catch (error) {
    console.error("updateRoomType error:", error);
    return { success: false, error: "Failed to update room type" };
  }
}

export async function toggleRoomTypeActive(id: string, isActive: boolean, hotelId: string) {
  await requireRole(["PRODUCT", "ADMIN"]);

  try {
    await db.update(hotelRoomTypes).set({ isActive }).where(eq(hotelRoomTypes.id, id));
    revalidatePath(`/admin/hotels/${hotelId}/rooms`);
    return { success: true };
  } catch (error) {
    console.error("toggleRoomTypeActive error:", error);
    return { success: false, error: "Failed to toggle" };
  }
}

export async function deleteRoomType(id: string, hotelId: string) {
  await requireRole(["PRODUCT", "ADMIN"]);

  try {
    await db.delete(hotelRoomTypes).where(eq(hotelRoomTypes.id, id));
    revalidatePath(`/admin/hotels/${hotelId}/rooms`);
    return { success: true };
  } catch (error) {
    console.error("deleteRoomType error:", error);
    return { success: false, error: "Failed to delete room type" };
  }
}
