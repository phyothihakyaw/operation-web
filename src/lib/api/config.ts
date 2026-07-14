/**
 * Base URL the browser uses for Learnwu API calls, via NEXT_PUBLIC_API_URL
 * (see .env.example). Two modes:
 *
 * - "/api/learnwu" (recommended): same-origin proxy. Requests go to this app's
 *   own origin and src/app/api/learnwu/[...path]/route.ts forwards them
 *   server-side to API_PROXY_TARGET — no CORS involvement at all.
 * - "https://api.dev.learnwu.com": direct mode; only works if the API's CORS
 *   policy allows the frontend origin.
 */
export const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/+$/, "");

export const isApiConfigured = API_BASE_URL.length > 0;

/**
 * Every backend path the app talks to, in one place. Paths mirror openapi.yaml
 * and are relative to NEXT_PUBLIC_API_URL, which already includes the `/v1`
 * prefix (see .env.example).
 */
export const apiRoutes = {
  auth: {
    // The backoffice only ever signs in through the admin persona.
    // Learner/mentor accounts use POST /v1/auth/login instead.
    loginAdmin: "/auth/login/admin",
    logout: "/auth/logout",
    me: "/auth/me",
  },
  admin: {
    applications: "/admin/applications",
    application: (id: string) => `/admin/applications/${id}`,
    applicationStartReview: (id: string) => `/admin/applications/${id}/start-review`,
    applicationApprove: (id: string) => `/admin/applications/${id}/approve`,
    applicationReject: (id: string) => `/admin/applications/${id}/reject`,
    applicationAuditLog: (id: string) => `/admin/applications/${id}/audit-log`,
    platformSettings: "/admin/platform-settings",
  },
  catalog: {
    categories: "/catalog/categories",
  },
} as const;
