"use server";

import { db } from "@/lib/db";
import { users, countries } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-utils";

export type UserRole = "ADMIN" | "OPS" | "PRODUCT" | "SALES";

export async function getAllUsers() {
  await requireRole(["ADMIN"]);
  return db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      countryScope: users.countryScope,
      createdAt: users.createdAt,
      image: users.image,
      isActive: users.isActive,
    })
    .from(users)
    .orderBy(desc(users.createdAt));
}

export async function getCountriesForSelector() {
  await requireRole(["ADMIN"]);
  return db
    .select({
      id: countries.id,
      code: countries.code,
      name: countries.name,
      flagEmoji: countries.flagEmoji,
    })
    .from(countries)
    .orderBy(countries.name);
}

export async function createUser(formData: {
  name: string;
  email: string;
  role: UserRole;
  countryScope: string[];
}) {
  await requireRole(["ADMIN"]);
  try {
    if (!formData.name.trim()) return { success: false, error: "Name is required" };
    const email = formData.email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { success: false, error: "Invalid email format" };
    }
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    if (existing) return { success: false, error: "A user with this email already exists" };

    const [newUser] = await db
      .insert(users)
      .values({
        name: formData.name.trim(),
        email,
        role: formData.role,
        countryScope: formData.countryScope,
      })
      .returning({ id: users.id });

    revalidatePath("/users");
    return { success: true, userId: newUser.id };
  } catch (error) {
    console.error("createUser error:", error);
    return { success: false, error: "Failed to create user" };
  }
}

export async function updateUser(
  userId: string,
  formData: { name: string; role: UserRole; countryScope: string[] }
) {
  const currentUser = await requireRole(["ADMIN"]);
  try {
    if (!formData.name.trim()) return { success: false, error: "Name is required" };

    // Guard against self-demotion: an admin editing themselves cannot change
    // their own role away from ADMIN. The client UI also disables this, but we
    // re-enforce server-side so a tampered request can't lock the admin out.
    if (userId === currentUser.id && formData.role !== "ADMIN") {
      return {
        success: false,
        error: "You can't change your own role. Ask another admin to do it.",
      };
    }

    await db
      .update(users)
      .set({
        name: formData.name.trim(),
        role: formData.role,
        countryScope: formData.countryScope,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
    revalidatePath("/users");
    return { success: true };
  } catch (error) {
    console.error("updateUser error:", error);
    return { success: false, error: "Failed to update user" };
  }
}

export async function deleteUser(userId: string, currentUserId: string) {
  await requireRole(["ADMIN"]);
  try {
    if (userId === currentUserId) {
      return { success: false, error: "You cannot delete your own account" };
    }
    await db.delete(users).where(eq(users.id, userId));
    revalidatePath("/users");
    return { success: true };
  } catch (error) {
    console.error("deleteUser error:", error);
    return { success: false, error: "Failed to delete user (may have associated bookings)" };
  }
}

export async function toggleUserActive(
  userId: string,
  currentUserId: string,
  makeActive: boolean
) {
  await requireRole(["ADMIN"]);
  try {
    // Guard against self-deactivation: an admin can't lock themselves out.
    // The client UI hides the toggle button for the current user, but we
    // re-enforce server-side so a tampered request can't slip through.
    if (userId === currentUserId && !makeActive) {
      return {
        success: false,
        error: "You can't deactivate your own account.",
      };
    }
    await db
      .update(users)
      .set({ isActive: makeActive, updatedAt: new Date() })
      .where(eq(users.id, userId));
    revalidatePath("/users");
    return { success: true };
  } catch (error) {
    console.error("toggleUserActive error:", error);
    return { success: false, error: "Failed to update user status" };
  }
}
