import { type NextRequest, NextResponse } from "next/server";

/**
 * Same-origin proxy for the Learnwu API. Solves two problems at once:
 *
 * 1. CORS — the browser only talks to this app's origin; requests are
 *    forwarded server-side to API_PROXY_TARGET.
 * 2. Token hardening — per openapi.yaml, the API's only auth mechanism is an
 *    HttpOnly, same-site `access_token` cookie it sets directly via
 *    `Set-Cookie` on login. That cookie is scoped to the upstream API's own
 *    origin, so the browser can't use it against this app's origin (and
 *    SameSite=Strict would block it cross-site anyway). This proxy reads the
 *    upstream Set-Cookie, re-issues the token as our own first-party cookie,
 *    and forwards it back as a Cookie header on every subsequent request —
 *    the token itself never reaches client-side JavaScript.
 *
 * Enable via (see .env.example):
 *   NEXT_PUBLIC_API_URL=/api/learnwu/v1
 *   API_PROXY_TARGET=https://api.dev.learnwu.com
 */
const target = (process.env.API_PROXY_TARGET ?? "").replace(/\/+$/, "");

const ACCESS_TOKEN_COOKIE = "access_token";

// Path "/" (not scoped to the proxy) so middleware can read it on normal
// page navigations to guard the dashboard.
const cookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/",
} as const;

const forwardedRequestHeaders = ["content-type", "accept"];
const forwardedResponseHeaders = ["content-type", "content-disposition"];

function extractCookieValue(setCookieHeader: string, name: string): string | undefined {
  const match = setCookieHeader.match(new RegExp(`(?:^|,\\s*)${name}=([^;]*)`));
  return match?.[1];
}

function extractMaxAge(setCookieHeader: string): number | undefined {
  const match = setCookieHeader.match(/max-age=(\d+)/i);
  return match ? Number(match[1]) : undefined;
}

async function proxy(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  if (!target) {
    return NextResponse.json(
      { message: "API proxy target is not configured. Set API_PROXY_TARGET in your environment." },
      { status: 502 },
    );
  }

  const { path } = await params;
  const pathname = path.join("/");
  const url = `${target}/${pathname}${request.nextUrl.search}`;
  const isLogout = request.method === "POST" && pathname.endsWith("auth/logout");

  const headers = new Headers();
  for (const name of forwardedRequestHeaders) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  const sessionToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  if (sessionToken) {
    headers.set("cookie", `${ACCESS_TOKEN_COOKIE}=${sessionToken}`);
  }

  let upstream: Response;
  try {
    upstream = await fetch(url, {
      method: request.method,
      headers,
      body: request.method === "GET" || request.method === "HEAD" ? undefined : await request.arrayBuffer(),
      redirect: "manual",
      cache: "no-store",
    });
  } catch {
    return NextResponse.json({ message: `The API at ${target} could not be reached.` }, { status: 502 });
  }

  const responseHeaders = new Headers();
  for (const name of forwardedResponseHeaders) {
    const value = upstream.headers.get(name);
    if (value) responseHeaders.set(name, value);
  }

  const response = new NextResponse(upstream.body, { status: upstream.status, headers: responseHeaders });

  // Capture the upstream Set-Cookie (login, or any refreshed session) and
  // re-issue it as our own first-party cookie.
  const upstreamSetCookie = upstream.headers.get("set-cookie");
  const newToken = upstreamSetCookie ? extractCookieValue(upstreamSetCookie, ACCESS_TOKEN_COOKIE) : undefined;
  if (newToken) {
    const maxAge = extractMaxAge(upstreamSetCookie ?? "");
    response.cookies.set({
      name: ACCESS_TOKEN_COOKIE,
      value: newToken,
      ...cookieOptions,
      ...(maxAge ? { maxAge } : {}),
    });
  }

  // Logout always ends the browser session, even if the upstream call failed.
  if (isLogout) {
    response.cookies.set({ name: ACCESS_TOKEN_COOKIE, value: "", ...cookieOptions, maxAge: 0 });
  }

  return response;
}

export { proxy as DELETE, proxy as GET, proxy as PATCH, proxy as POST, proxy as PUT };
