import { type NextRequest, NextResponse } from "next/server";

/**
 * Guards the dashboard with auth state. This is an optimistic, cookie-presence
 * check only (cheap, no network call) — it can't validate the session against
 * the API, so an expired-but-present cookie still passes here. The real check
 * happens client-side via GET /v1/auth/me (see src/lib/auth/auth-context.tsx),
 * which redirects to the login screen on a 401 despite a present cookie.
 */
const ACCESS_TOKEN_COOKIE = "access_token";
const LOGIN_PATH = "/auth/login";
const DEFAULT_AUTHENTICATED_PATH = "/dashboard";
const LOGIN_ROUTE_PREFIXES = ["/auth/login", "/auth/v1/login", "/auth/v2/login"];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isAuthenticated = Boolean(req.cookies.get(ACCESS_TOKEN_COOKIE)?.value);
  const isDashboardRoute = pathname === "/" || pathname.startsWith("/dashboard");
  const isLoginRoute = LOGIN_ROUTE_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  if (isDashboardRoute && !isAuthenticated) {
    return NextResponse.redirect(new URL(LOGIN_PATH, req.url));
  }

  if (isLoginRoute && isAuthenticated) {
    return NextResponse.redirect(new URL(DEFAULT_AUTHENTICATED_PATH, req.url));
  }

  return NextResponse.next();
}

/**
 * Skips static assets and API routes — the Learnwu proxy in particular must
 * never be intercepted here, since it needs to see the request through to
 * src/app/api/learnwu/[...path]/route.ts regardless of auth state.
 */
export const config = {
  matcher: ["/((?!_next/|api/|favicon.ico).*)"],
};
