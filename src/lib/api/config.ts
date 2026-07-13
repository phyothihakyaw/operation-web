/**
 * Base URL the browser uses for LearnWU API calls, via NEXT_PUBLIC_API_URL
 * (see .env.example). Two modes:
 *
 * - "/api/learnwu" (recommended): same-origin proxy. Requests go to this app's
 *   own origin and src/app/api/learnwu/[...path]/route.ts forwards them
 *   server-side to API_PROXY_TARGET — no CORS involvement at all.
 * - "https://api.dev.learnwu.com": direct mode; only works if the API's CORS
 *   policy allows the frontend origin.
 *
 * When unset, the app falls back to built-in sample data and auth is skipped.
 */
export const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/+$/, "");

export const isApiConfigured = API_BASE_URL.length > 0;

/**
 * Every backend path the app talks to, in one place.
 *
 * NOTE: the swagger doc (https://api.dev.learnwu.com/docs) is not reachable
 * from the development sandbox, so these paths follow common REST conventions.
 * Verify each one against the swagger doc and adjust here only.
 */
export const apiRoutes = {
  auth: {
    login: "/auth/login",
    logout: "/auth/logout",
    me: "/auth/me",
  },
  instructors: {
    applications: "/instructors/applications",
    application: (id: string) => `/instructors/applications/${id}`,
    review: (id: string) => `/instructors/applications/${id}/review`,
  },
} as const;
