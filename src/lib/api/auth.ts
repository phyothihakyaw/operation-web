import { apiFetch } from "./client";
import { apiRoutes, isApiConfigured } from "./config";
import { clearAccessToken, getAccessToken, setAccessToken } from "./token.client";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role?: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type LoginResponse = {
  accessToken: string;
  user: AuthUser;
};

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  const result = await apiFetch<LoginResponse>(apiRoutes.auth.login, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  setAccessToken(result.accessToken);
  return result;
}

/**
 * Ends the session server-side when possible, and always clears the local
 * token — signing out must never fail from the user's point of view.
 */
export async function logout(): Promise<void> {
  try {
    if (isApiConfigured && getAccessToken()) {
      await apiFetch<void>(apiRoutes.auth.logout, { method: "POST" });
    }
  } catch {
    // best effort — the local token is cleared regardless
  } finally {
    clearAccessToken();
  }
}

export async function getCurrentUser(): Promise<AuthUser> {
  return apiFetch<AuthUser>(apiRoutes.auth.me);
}

export function isAuthenticated(): boolean {
  return getAccessToken() !== null;
}
