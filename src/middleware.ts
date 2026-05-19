import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_ROUTES = ["/", "/auth"];
const PROTECTED_ROUTE_PREFIXES = ["/chat/", "/characters", "/onboarding", "/profile"];

function isProtectedRoute(pathname: string): boolean {
  if (PUBLIC_ROUTES.includes(pathname)) return false;
  if (pathname.startsWith("/api/")) return false;
  return PROTECTED_ROUTE_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function hasSessionCookie(request: NextRequest): boolean {
  return (
    !!request.cookies.get("better-auth.session_token")?.value ||
    !!request.cookies.get("__Secure-better-auth.session_token")?.value
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isLoggedIn = hasSessionCookie(request);

  if (pathname === "/auth" && isLoggedIn) {
    return NextResponse.redirect(new URL("/characters", request.url));
  }

  if (isProtectedRoute(pathname) && !isLoggedIn) {
    return NextResponse.redirect(new URL("/auth", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)",
  ],
};
