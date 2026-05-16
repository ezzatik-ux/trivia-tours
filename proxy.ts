import { auth } from "@/auth";
import { NextResponse } from "next/server";

const PUBLIC_ROUTES = ["/login", "/api/auth"];

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Allow public routes
  if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Redirect unauthenticated users to login
  if (!req.auth) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match all routes EXCEPT:
     * - api/auth (NextAuth endpoints)
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public folder
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};
