import { API_BASE_URL, isApiConfigured } from "./config";

export class ApiError extends Error {
  readonly status: number;
  readonly details: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

function extractErrorMessage(details: unknown, fallback: string): string {
  if (details && typeof details === "object") {
    // Learnwu error envelope: { "error": { "code": "...", "message": "..." } }.
    // The message is written as UI copy — surface it verbatim.
    const body = details as { message?: string; error?: { message?: string } | string };
    if (typeof body.error === "object" && body.error !== null && typeof body.error.message === "string") {
      return body.error.message;
    }
    if (typeof body.message === "string") return body.message;
    if (typeof body.error === "string") return body.error;
  }
  return fallback;
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!isApiConfigured) {
    throw new ApiError(0, "API URL is not configured. Set NEXT_PUBLIC_API_URL in your environment.");
  }

  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let response: Response;
  try {
    // The only auth mechanism is the HttpOnly `access_token` cookie (see openapi.yaml);
    // `credentials: "include"` ensures it's sent on this same-origin proxy request.
    response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers, credentials: "include" });
  } catch (error) {
    throw new ApiError(0, `Could not reach the API at ${API_BASE_URL}.`, error);
  }

  if (!response.ok) {
    let details: unknown;
    try {
      details = await response.json();
    } catch {
      // non-JSON error body
    }
    throw new ApiError(
      response.status,
      extractErrorMessage(details, `Request failed with status ${response.status}.`),
      details,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}
