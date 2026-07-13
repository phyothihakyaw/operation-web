import { type NextRequest, NextResponse } from "next/server";

/**
 * Same-origin proxy for the LearnWU API. Solves two problems at once:
 *
 * 1. CORS — the browser only talks to this app's origin; requests are
 *    forwarded server-side to API_PROXY_TARGET.
 * 2. Token hardening — the access token never reaches client-side JS. On
 *    login the proxy captures `accessToken` from the upstream response into
 *    an HttpOnly cookie and strips it from the JSON body; on every request it
 *    turns that cookie back into an `Authorization: Bearer` header; on logout
 *    it clears the cookie.
 *
 * Enable via (see .env.example):
 *   NEXT_PUBLIC_API_URL=/api/learnwu
 *   API_PROXY_TARGET=https://api.dev.learnwu.com
 */
const target = (process.env.API_PROXY_TARGET ?? "").replace(/\/+$/, "");

const ACCESS_TOKEN_COOKIE = "learnwu_access_token";

// Scoped to the proxy path so the cookie is not sent with page requests.
const cookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/api/learnwu",
} as const;

const forwardedRequestHeaders = ["authorization", "content-type", "accept"];
const forwardedResponseHeaders = ["content-type", "content-disposition"];

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
  const isLogin = request.method === "POST" && pathname === "auth/login";
  const isLogout = request.method === "POST" && pathname === "auth/logout";

  const headers = new Headers();
  for (const name of forwardedRequestHeaders) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  const cookieToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  if (cookieToken && !headers.has("authorization")) {
    headers.set("authorization", `Bearer ${cookieToken}`);
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

  // Successful login: move the token out of the body and into an HttpOnly cookie.
  if (isLogin && upstream.ok) {
    let payload: { accessToken?: string } & Record<string, unknown>;
    try {
      payload = await upstream.json();
    } catch {
      return NextResponse.json({ message: "The API returned an unexpected login response." }, { status: 502 });
    }
    const { accessToken, ...body } = payload;
    const response = NextResponse.json(body, { status: upstream.status });
    if (accessToken) {
      response.cookies.set({ name: ACCESS_TOKEN_COOKIE, value: accessToken, ...cookieOptions });
    }
    return response;
  }

  const response = new NextResponse(upstream.body, { status: upstream.status, headers: responseHeaders });

  // Logout always ends the browser session, even if the upstream call failed.
  if (isLogout) {
    response.cookies.set({ name: ACCESS_TOKEN_COOKIE, value: "", ...cookieOptions, maxAge: 0 });
  }

  return response;
}

export { proxy as DELETE, proxy as GET, proxy as PATCH, proxy as POST, proxy as PUT };
