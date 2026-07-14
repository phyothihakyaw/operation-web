import { apiFetch } from "./client";
import { apiRoutes, isApiConfigured } from "./config";

/** Mirrors components.schemas.MeResponse in openapi.yaml. */
export type MeResponse = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  account_type: "learner" | "instructor";
  access_role: "user" | "admin";
  status: "pending_verification" | "active" | "disabled";
  email_verified: boolean;
};

export type LoginPayload = {
  email: string;
  password: string;
};

/** Mirrors components.schemas.LoginResponse in openapi.yaml. */
export type LoginResponse = {
  status: "ok";
  verified: boolean;
  account_type: "" | "learner" | "instructor";
  access_role: "user" | "admin";
};

/**
 * Signs in against POST /v1/auth/login/admin — the persona this dashboard
 * exclusively supports. The API sets the HttpOnly `access_token` cookie
 * itself (via src/app/api/learnwu/[...path]/route.ts); no token ever reaches
 * client-side JavaScript.
 */
export async function login(payload: LoginPayload): Promise<LoginResponse> {
  return apiFetch<LoginResponse>(apiRoutes.auth.loginAdmin, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * Revokes the server-side session and clears the HttpOnly cookie. Always
 * resolves — signing out must never fail from the user's point of view.
 */
export async function logout(): Promise<void> {
  try {
    if (isApiConfigured) {
      await apiFetch<void>(apiRoutes.auth.logout, { method: "POST" });
    }
  } catch {
    // best effort — the proxy clears the local cookie regardless of upstream outcome
  }
}

/**
 * The session lives in an HttpOnly cookie the browser can't read, so this is
 * the way to check auth state client-side: it succeeds with the profile when
 * signed in and throws a 401 ApiError otherwise.
 */
export async function getCurrentUser(): Promise<MeResponse> {
  return apiFetch<MeResponse>(apiRoutes.auth.me);
}
