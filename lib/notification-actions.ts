"use server";

import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth-utils";

/**
 * Get recent notifications for the current user
 */
export async function getMyNotifications(limit = 20) {
  const user = await requireAuth();

  const result = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, user.id))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);

  return result;
}

/**
 * Get count of unread notifications for the current user
 */
export async function getUnreadCount() {
  const user = await requireAuth();

  const [result] = await db
    .select({
      count: sql<number>`COUNT(*)::int`.as("count"),
    })
    .from(notifications)
    .where(and(eq(notifications.userId, user.id), eq(notifications.isRead, false)));

  return result?.count ?? 0;
}

/**
 * Mark single notification as read
 */
export async function markAsRead(notificationId: string) {
  const user = await requireAuth();

  try {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.id, notificationId), eq(notifications.userId, user.id)));

    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    console.error("markAsRead error:", error);
    return { success: false, error: "Failed to mark as read" };
  }
}

/**
 * Mark all notifications as read
 */
export async function markAllAsRead() {
  const user = await requireAuth();

  try {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.userId, user.id), eq(notifications.isRead, false)));

    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    console.error("markAllAsRead error:", error);
    return { success: false, error: "Failed to mark all as read" };
  }
}
