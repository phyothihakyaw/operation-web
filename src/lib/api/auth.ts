import { apiFetch } from "./client";
import { apiRoutes, isApiConfigured } from "./config";
import { clearAccessToken, setAccessToken } from "./token.client";

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
  /**
   * Only present in direct mode. In proxy mode (NEXT_PUBLIC_API_URL=/api/learnwu)
   * the proxy moves the token into an HttpOnly cookie and strips it from the
   * body, so it never reaches client-side JavaScript.
   */
  accessToken?: string;
  user: AuthUser;
};

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  const result = await apiFetch<LoginResponse>(apiRoutes.auth.login, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (result.accessToken) {
    setAccessToken(result.accessToken);
  }
  return result;
}

/**
 * Ends the session server-side when possible (in proxy mode this also clears
 * the HttpOnly session cookie), and always clears any locally stored token —
 * signing out must never fail from the user's point of view.
 */
export async function logout(): Promise<void> {
  try {
    if (isApiConfigured) {
      await apiFetch<void>(apiRoutes.auth.logout, { method: "POST" });
    }
  } catch {
    // best effort — local credentials are cleared regardless
  } finally {
    clearAccessToken();
  }
}

/**
 * The session lives in an HttpOnly cookie the browser can't read, so this is
 * the way to check auth state client-side: it succeeds with the profile when
 * signed in and throws a 401 ApiError otherwise.
 */
export async function getCurrentUser(): Promise<AuthUser> {
  return apiFetch<AuthUser>(apiRoutes.auth.me);
}
