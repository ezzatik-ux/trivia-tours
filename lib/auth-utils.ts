import { auth } from "@/auth";
import { redirect } from "next/navigation";

export type UserRole = "SALES" | "OPS" | "PRODUCT" | "ADMIN";

/**
 * Server-side: require authentication. Redirects to login if not authenticated.
 */
export async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  return session.user;
}

/**
 * Server-side: require specific role(s). Redirects to /unauthorized if role mismatch.
 */
export async function requireRole(allowedRoles: UserRole[]) {
  const user = await requireAuth();
  if (!allowedRoles.includes(user.role)) {
    redirect("/unauthorized");
  }
  return user;
}

/**
 * Check if user has any of the given roles (no redirect).
 */
export function hasRole(userRole: UserRole, allowedRoles: UserRole[]): boolean {
  return allowedRoles.includes(userRole);
}
