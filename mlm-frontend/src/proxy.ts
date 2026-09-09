import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that don't need authentication
const publicRoutes = ["/", "/login", "/register", "/forgot-password"];
// Routes only admins can access
const adminRoutes = ["/admin"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check for access token cookie
  const accessToken = request.cookies.get("access_token")?.value;

  const isPublicRoute =
    pathname === "/" || publicRoutes.some((route) => route !== "/" && pathname.startsWith(route));

  // If accessing a protected route without a token → redirect to login
  if (!isPublicRoute && !accessToken) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // If accessing login/register with a valid token → redirect to dashboard
  if ((pathname === "/login" || pathname === "/register") && accessToken) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:jpg|jpeg|gif|png|svg|webp|ico)).*)",
  ],
};
