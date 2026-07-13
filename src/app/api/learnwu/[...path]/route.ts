import type { NextRequest } from "next/server";

/**
 * Same-origin proxy for the LearnWU API, used to avoid CORS issues in the
 * browser: the client calls /api/learnwu/* on its own origin and this route
 * forwards the request server-side to API_PROXY_TARGET.
 *
 * Enable it by setting (see .env.example):
 *   NEXT_PUBLIC_API_URL=/api/learnwu
 *   API_PROXY_TARGET=https://api.dev.learnwu.com
 */
const target = (process.env.API_PROXY_TARGET ?? "").replace(/\/+$/, "");

const forwardedRequestHeaders = ["authorization", "content-type", "accept"];
const forwardedResponseHeaders = ["content-type", "content-disposition"];

async function proxy(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  if (!target) {
    return Response.json(
      { message: "API proxy target is not configured. Set API_PROXY_TARGET in your environment." },
      { status: 502 },
    );
  }

  const { path } = await params;
  const url = `${target}/${path.join("/")}${request.nextUrl.search}`;

  const headers = new Headers();
  for (const name of forwardedRequestHeaders) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
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
    return Response.json({ message: `The API at ${target} could not be reached.` }, { status: 502 });
  }

  const responseHeaders = new Headers();
  for (const name of forwardedResponseHeaders) {
    const value = upstream.headers.get(name);
    if (value) responseHeaders.set(name, value);
  }

  return new Response(upstream.body, { status: upstream.status, headers: responseHeaders });
}

export { proxy as DELETE, proxy as GET, proxy as PATCH, proxy as POST, proxy as PUT };
