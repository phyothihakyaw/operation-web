import { apiFetch } from "./client";
import { apiRoutes } from "./config";

/**
 * Wire types for GET/POST /v1/admin/applications*. These mirror openapi.yaml
 * exactly (snake_case included) — the backend domain term is "instructor";
 * UI copy renders these as "mentor" (see CLAUDE.md, "Domain copy").
 */

export type ApplicationStatus = "draft" | "pending" | "reviewing" | "approved" | "rejected";

export type ConnectAccountStatus = "unverified" | "pending" | "verified" | "rejected";

export type ApplicationSummary = {
  id: string;
  user_id: string;
  status: ApplicationStatus;
  first_name: string;
  last_name: string;
  submitted_at: string | null;
  created_at: string;
};

export type ApplicationListPage = {
  items: ApplicationSummary[];
  limit: number;
  offset: number;
  total: number;
};

export type EmploymentEntry = {
  id: string;
  company_name: string;
  current_position: string;
  working_duration_months: number;
  is_current_role: boolean;
};

export type EducationEntry = {
  id: string;
  university_name: string;
  degree_type: string;
  issued_date: string | null;
  supporting_document_url: string;
};

export type CertificateEntry = {
  id: string;
  certificate_name: string;
  issued_date: string | null;
  supporting_document_url: string;
};

export type ProjectEntry = {
  id: string;
  project_title: string;
  description: string;
  showcase_url: string;
};

/** weekday follows Go's time.Weekday: 0 = Sunday … 6 = Saturday. Minutes are UTC on a 30-minute grid. */
export type AvailabilitySlot = {
  id: string;
  weekday: number;
  start_minute: number;
  end_minute: number;
};

export type Application = {
  id: string;
  user_id: string;
  status: ApplicationStatus;
  current_step: number;
  first_name: string;
  last_name: string;
  phone_country_code: string;
  phone_number: string;
  gender: string;
  date_of_birth: string | null;
  country_of_residence: string;
  profile_image_url: string;
  intro_video_url: string;
  bio: string;
  timezone: string;
  stripe_connect_account_id: string | null;
  connect_account_status: ConnectAccountStatus;
  selected_topic_ids: string[];
  taught_languages: string[];
  employment: EmploymentEntry[];
  education: EducationEntry[];
  certificates: CertificateEntry[];
  projects: ProjectEntry[];
  availability: AvailabilitySlot[];
  submitted_at: string | null;
  review_started_at: string | null;
  terms_version: string | null;
  terms_accepted_at: string | null;
  created_at: string;
  updated_at: string;
};

export type AuditAction = "review_started" | "approved" | "rejected";

export type AuditEntry = {
  id: string;
  admin_id: string | null;
  action: AuditAction;
  reason: string;
  created_at: string;
};

export type ApplicationListFilter = {
  status?: ApplicationStatus;
  createdAfter?: Date;
  createdBefore?: Date;
  limit?: number;
  offset?: number;
};

export async function listApplications(filter: ApplicationListFilter = {}): Promise<ApplicationListPage> {
  const params = new URLSearchParams();
  if (filter.status) params.set("status", filter.status);
  if (filter.createdAfter) params.set("created_after", filter.createdAfter.toISOString());
  if (filter.createdBefore) params.set("created_before", filter.createdBefore.toISOString());
  params.set("limit", String(filter.limit ?? 20));
  params.set("offset", String(filter.offset ?? 0));
  return apiFetch<ApplicationListPage>(`${apiRoutes.admin.applications}?${params.toString()}`);
}

export async function getApplication(id: string): Promise<Application> {
  return apiFetch<Application>(apiRoutes.admin.application(id));
}

/** Valid only while the application is pending; the API answers 409 otherwise. */
export async function startReview(id: string): Promise<Application> {
  return apiFetch<Application>(apiRoutes.admin.applicationStartReview(id), { method: "POST" });
}

/** Valid only while the application is in review; the API answers 409 otherwise. */
export async function approveApplication(id: string): Promise<Application> {
  return apiFetch<Application>(apiRoutes.admin.applicationApprove(id), { method: "POST" });
}

/** Valid only while the application is in review; a non-empty reason is required (422 otherwise). */
export async function rejectApplication(id: string, reason: string): Promise<Application> {
  return apiFetch<Application>(apiRoutes.admin.applicationReject(id), {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

export async function getAuditLog(id: string): Promise<AuditEntry[]> {
  const res = await apiFetch<{ entries: AuditEntry[] }>(apiRoutes.admin.applicationAuditLog(id));
  return res.entries;
}
