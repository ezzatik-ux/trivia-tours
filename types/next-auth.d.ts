/**
 * Extends NextAuth's default Session type to include
 * Trivia Tours-specific fields (role, country scope, etc.)
 */

import { DefaultSession } from "next-auth";

type UserRole = "SALES" | "OPS" | "PRODUCT" | "ADMIN";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      countryScope: string[];
    } & DefaultSession["user"];
  }

  interface User {
    role?: UserRole;
    countryScope?: string[] | null;
  }
}
