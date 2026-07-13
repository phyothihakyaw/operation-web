import { format } from "date-fns";

import type {
  ApplicationStatus,
  AttachmentFileType,
  AvailabilityDay,
  EducationEntry,
  EmploymentEntry,
  LanguageProficiency,
  MentorApplication,
  OpenSourceLink,
  SpokenLanguage,
  WeekDay,
} from "@/app/(main)/dashboard/mentors/_components/data";

import { apiFetch } from "./client";
import { apiRoutes } from "./config";

/**
 * Wire types for the instructor endpoints. These mirror common REST/NestJS
 * conventions and must be verified against the swagger doc
 * (https://api.dev.learnwu.com/docs) once it is reachable — adjust the DTOs
 * and mappers here; the UI only ever sees `MentorApplication`.
 */

export type InstructorApplicationStatusDto = "pending_review" | "in_review" | "accepted" | "rejected";

export type InstructorApplicationDto = {
  id: string;
  name: string;
  email: string;
  headline: string;
  bio: string;
  appliedAt: string; // ISO 8601
  status: InstructorApplicationStatusDto;
  decisionNote?: string | null;
  residency: { country: string; city: string; timezone: string };
  languages: { language: string; proficiency: LanguageProficiency }[];
  topics: string[];
  employment: { title: string; company: string; start: string; end: string | null; summary: string }[];
  education: { school: string; degree: string; start: string; end: string }[];
  certificates: {
    name: string;
    issuer: string;
    year: string;
    fileName: string;
    fileSize: string;
    fileType: AttachmentFileType;
    url: string;
    previewUrl?: string | null;
  }[];
  openSource: { name: string; url: string; description: string }[];
  weeklyAvailability: { day: WeekDay; slots: string[] }[];
};

export type ReviewDecisionDto = {
  decision: InstructorApplicationStatusDto;
  note?: string;
};

const statusFromDto: Record<InstructorApplicationStatusDto, ApplicationStatus> = {
  pending_review: "Pending review",
  in_review: "In review",
  accepted: "Accepted",
  rejected: "Rejected",
};

const statusToDto: Record<ApplicationStatus, InstructorApplicationStatusDto> = {
  "Pending review": "pending_review",
  "In review": "in_review",
  Accepted: "accepted",
  Rejected: "rejected",
};

export function mapInstructorApplication(dto: InstructorApplicationDto): MentorApplication {
  return {
    id: dto.id,
    name: dto.name,
    email: dto.email,
    headline: dto.headline,
    bio: dto.bio,
    appliedDate: format(new Date(dto.appliedAt), "dd MMM yyyy, h:mm a"),
    status: statusFromDto[dto.status],
    decisionNote: dto.decisionNote ?? undefined,
    residency: dto.residency,
    languages: dto.languages satisfies SpokenLanguage[],
    topics: dto.topics,
    employment: dto.employment satisfies EmploymentEntry[],
    education: dto.education satisfies EducationEntry[],
    certificates: dto.certificates.map((certificate) => ({
      ...certificate,
      previewUrl: certificate.previewUrl ?? undefined,
    })),
    openSource: dto.openSource satisfies OpenSourceLink[],
    weeklyAvailability: dto.weeklyAvailability satisfies AvailabilityDay[],
  };
}

export async function listInstructorApplications(): Promise<MentorApplication[]> {
  const dtos = await apiFetch<InstructorApplicationDto[]>(apiRoutes.instructors.applications);
  return dtos.map(mapInstructorApplication);
}

export async function getInstructorApplication(id: string): Promise<MentorApplication> {
  const dto = await apiFetch<InstructorApplicationDto>(apiRoutes.instructors.application(id));
  return mapInstructorApplication(dto);
}

export async function reviewInstructorApplication(id: string, status: ApplicationStatus, note?: string): Promise<void> {
  const body: ReviewDecisionDto = { decision: statusToDto[status], note };
  await apiFetch<void>(apiRoutes.instructors.review(id), {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}
