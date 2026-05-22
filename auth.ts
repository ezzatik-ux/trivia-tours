/**
 * NextAuth.js v5 Configuration
 * Trivia Tours — Google OAuth + Drizzle Adapter
 */

import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/lib/db";
import { users, accounts, sessions, verificationTokens } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
      authorization: {
        params: {
          prompt: "select_account",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "database",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    /**
     * Only allow login if user exists in DB (pre-provisioned by admin)
     * This is your security gate — strangers can't just sign in.
     */
    async signIn({ user }) {
      if (!user.email) return false;

      const existingUser = await db.query.users.findFirst({
        where: eq(users.email, user.email),
      });

      if (!existingUser) {
        console.log(`🚫 Login denied: ${user.email} not in users table`);
        return false;
      }

      if (!existingUser.isActive) {
        console.log(`🚫 Login denied: ${user.email} is inactive`);
        return false;
      }

      return true;
    },

    /**
     * Inject role + ID into the session for use across the app
     */
    async session({ session, user }) {
      if (session.user && user) {
        const dbUser = await db.query.users.findFirst({
          where: eq(users.id, user.id),
        });

        // Force-invalidate sessions for deleted or deactivated users.
        // Without this, an admin who clicks "Deactivate" on someone already
        // signed in would have to wait up to 30 days (maxAge) for the cookie
        // to expire. With this, the deactivation takes effect on the very
        // next request since the session callback runs server-side per request.
        if (!dbUser || !dbUser.isActive) {
          return { ...session, user: undefined as never };
        }

        session.user.id = dbUser.id;
        session.user.role = dbUser.role;
        session.user.countryScope = dbUser.countryScope ?? [];
      }
      return session;
    },
  },
  trustHost: true, // Required for Vercel deployment
});
