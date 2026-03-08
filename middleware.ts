import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    // If not logged in, redirect to login
    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    const role = token.role as string;

    // Admin-only routes
    if (pathname.startsWith("/admin") && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    // Staff + Admin routes
    if (pathname.startsWith("/staff") && !["ADMIN", "STAFF"].includes(role)) {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    // Guest routes — all authenticated users can access
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized({ token }) {
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: ["/admin/:path*", "/staff/:path*", "/guest/:path*", "/dashboard"],
};
