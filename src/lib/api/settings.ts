import { apiFetch } from "./client";
import { apiRoutes } from "./config";

/** Wire type for GET/PUT /v1/admin/platform-settings (a singleton resource). */
export type PlatformSettings = {
  minimum_notice_hours: number;
  updated_at: string;
};

export async function getPlatformSettings(): Promise<PlatformSettings> {
  return apiFetch<PlatformSettings>(apiRoutes.admin.platformSettings);
}

export async function updatePlatformSettings(minimumNoticeHours: number): Promise<PlatformSettings> {
  return apiFetch<PlatformSettings>(apiRoutes.admin.platformSettings, {
    method: "PUT",
    body: JSON.stringify({ minimum_notice_hours: minimumNoticeHours }),
  });
}
