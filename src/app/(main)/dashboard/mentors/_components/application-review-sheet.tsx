"use client";

import * as React from "react";

import { format } from "date-fns";
import {
  Award,
  Briefcase,
  CalendarClock,
  Check,
  CreditCard,
  Download,
  ExternalLink,
  Eye,
  FileText,
  FolderGit2,
  GraduationCap,
  History,
  Languages,
  MapPin,
  Play,
  RotateCw,
  Sparkles,
  User,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  type Application,
  type AuditEntry,
  approveApplication,
  getApplication,
  getAuditLog,
  rejectApplication,
  startReview,
} from "@/lib/api/applications";
import { type Category, listCategories, topicTitlesById } from "@/lib/api/catalog";
import { ApiError } from "@/lib/api/client";
import { cn, getInitials } from "@/lib/utils";

import { type Attachment, AttachmentPreviewDialog, attachmentKind } from "./attachment-preview-dialog";
import { payoutStatusMeta, StatusBadge, statusMeta } from "./status";

// Go time.Weekday convention: 0 = Sunday … 6 = Saturday.
const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

const auditActionLabels: Record<AuditEntry["action"], string> = {
  review_started: "Review started",
  approved: "Approved",
  rejected: "Rejected",
};

function minuteLabel(minute: number): string {
  const hours = String(Math.floor(minute / 60)).padStart(2, "0");
  const minutes = String(minute % 60).padStart(2, "0");
  return `${hours}:${minutes}`;
}

function durationLabel(months: number): string {
  const years = Math.floor(months / 12);
  const rest = months % 12;
  const parts: string[] = [];
  if (years > 0) parts.push(`${years} yr`);
  if (rest > 0 || years === 0) parts.push(`${rest} mo`);
  return parts.join(" ");
}

function formatDateTime(iso: string): string {
  return format(new Date(iso), "d MMM yyyy, h:mm a");
}

function formatDate(iso: string): string {
  return format(new Date(iso), "d MMM yyyy");
}

function errorMessage(error: unknown): string {
  return error instanceof ApiError ? error.message : "Something went wrong. Try again.";
}

// Categories are shared master data; fetch once per session across all sheets.
let categoriesPromise: Promise<Category[]> | null = null;

function loadCategoriesOnce(): Promise<Category[]> {
  categoriesPromise ??= listCategories().catch((error: unknown) => {
    categoriesPromise = null;
    throw error;
  });
  return categoriesPromise;
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="grid gap-3">
      <h3 className="flex items-center gap-2 font-medium text-foreground text-sm">
        <Icon className="size-4 text-muted-foreground" />
        {title}
      </h3>
      {children}
    </section>
  );
}

function DocumentRow({
  title,
  subtitle,
  url,
  onPreview,
}: {
  title: string;
  subtitle: string;
  url: string;
  onPreview: (attachment: Attachment) => void;
}) {
  const previewable = url !== "" && attachmentKind(url) !== "other";

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-md border px-3 py-2.5",
        previewable && "transition-colors hover:bg-muted/50",
      )}
    >
      <FileText className="size-4 shrink-0 text-muted-foreground" />
      {previewable ? (
        <button
          type="button"
          className="grid min-w-0 flex-1 cursor-pointer gap-0.5 text-start hover:[&>span:first-child]:underline"
          onClick={() => onPreview({ name: title, url })}
        >
          <span className="truncate font-medium text-sm">{title}</span>
          <span className="truncate text-muted-foreground text-xs">{subtitle}</span>
        </button>
      ) : (
        <div className="grid min-w-0 flex-1 gap-0.5">
          <span className="truncate font-medium text-sm">{title}</span>
          <span className="truncate text-muted-foreground text-xs">
            {url ? subtitle : `${subtitle} · No document attached`}
          </span>
        </div>
      )}
      {previewable ? (
        <Button
          aria-label={`Preview document for ${title}`}
          size="icon-sm"
          variant="ghost"
          className="text-muted-foreground"
          onClick={() => onPreview({ name: title, url })}
        >
          <Eye />
        </Button>
      ) : null}
      {url ? (
        <Button
          aria-label={`Download document for ${title}`}
          size="icon-sm"
          variant="ghost"
          className="text-muted-foreground"
          asChild
        >
          <a href={url} download>
            <Download />
          </a>
        </Button>
      ) : null}
    </div>
  );
}

export function ApplicationReviewSheet({
  applicationId,
  open,
  onOpenChange,
  onChanged,
}: {
  applicationId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChanged: () => void;
}) {
  const [application, setApplication] = React.useState<Application | null>(null);
  const [auditLog, setAuditLog] = React.useState<AuditEntry[]>([]);
  const [topicTitles, setTopicTitles] = React.useState<Map<string, string> | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [reloadKey, setReloadKey] = React.useState(0);
  const [acting, setActing] = React.useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = React.useState(false);
  const [rejectReason, setRejectReason] = React.useState("");
  const [previewAttachment, setPreviewAttachment] = React.useState<Attachment | null>(null);
  const [previewOpen, setPreviewOpen] = React.useState(false);

  // biome-ignore lint/correctness/useExhaustiveDependencies: reloadKey re-runs the fetch for the retry button
  React.useEffect(() => {
    if (!open || !applicationId) return;
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    setApplication((current) => (current?.id === applicationId ? current : null));
    Promise.all([getApplication(applicationId), getAuditLog(applicationId)])
      .then(([app, log]) => {
        if (cancelled) return;
        setApplication(app);
        setAuditLog(log);
        setLoading(false);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setLoadError(errorMessage(error));
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, applicationId, reloadKey]);

  React.useEffect(() => {
    if (!open || topicTitles) return;
    let cancelled = false;
    loadCategoriesOnce()
      .then((categories) => {
        if (!cancelled) setTopicTitles(topicTitlesById(categories));
      })
      .catch(() => {
        // Topic names stay unresolved; the sheet falls back to a count.
      });
    return () => {
      cancelled = true;
    };
  }, [open, topicTitles]);

  const name = application ? `${application.first_name} ${application.last_name}`.trim() || "Unnamed applicant" : "";

  async function runDecision(action: () => Promise<Application>, successMessage: string) {
    if (!application) return;
    setActing(true);
    try {
      const updated = await action();
      setApplication(updated);
      setAuditLog(await getAuditLog(updated.id).catch(() => auditLog));
      onChanged();
      toast.success(successMessage);
    } catch (error) {
      toast.error("Could not update the application", { description: errorMessage(error) });
    } finally {
      setActing(false);
    }
  }

  function handleReject() {
    if (!application || rejectReason.trim() === "") return;
    const reason = rejectReason.trim();
    setRejectDialogOpen(false);
    setRejectReason("");
    void runDecision(() => rejectApplication(application.id, reason), `${name}'s application rejected`);
  }

  function openPreview(attachment: Attachment) {
    setPreviewAttachment(attachment);
    setPreviewOpen(true);
  }

  const slotsByWeekday = React.useMemo(() => {
    const grouped = new Map<number, { start_minute: number; end_minute: number }[]>();
    for (const slot of application?.availability ?? []) {
      const slots = grouped.get(slot.weekday) ?? [];
      slots.push(slot);
      grouped.set(
        slot.weekday,
        slots.sort((a, b) => a.start_minute - b.start_minute),
      );
    }
    return grouped;
  }, [application]);

  function renderTopics(app: Application) {
    if (app.selected_topic_ids.length === 0) {
      return <p className="text-muted-foreground/60 text-sm">No topics selected.</p>;
    }
    if (!topicTitles) {
      return (
        <p className="text-muted-foreground text-sm">
          {app.selected_topic_ids.length} topic{app.selected_topic_ids.length === 1 ? "" : "s"} selected
        </p>
      );
    }
    return (
      <div className="flex flex-wrap gap-1.5">
        {app.selected_topic_ids.map((topicId) => (
          <Badge key={topicId} variant="secondary" className="py-1 font-normal">
            {topicTitles.get(topicId) ?? "Unknown topic"}
          </Badge>
        ))}
      </div>
    );
  }

  function renderFooterActions(app: Application) {
    if (app.status === "pending") {
      return (
        <Button disabled={acting} onClick={() => runDecision(() => startReview(app.id), `Review started for ${name}`)}>
          <Play /> Start review
        </Button>
      );
    }
    if (app.status === "reviewing") {
      return (
        <>
          <Button variant="destructive" disabled={acting} onClick={() => setRejectDialogOpen(true)}>
            <X /> Reject
          </Button>
          <Button
            disabled={acting}
            onClick={() => runDecision(() => approveApplication(app.id), `${name} approved as a mentor`)}
          >
            <Check /> Approve
          </Button>
        </>
      );
    }
    if (app.status === "draft") {
      return (
        <span className="me-auto text-muted-foreground text-sm">
          Not submitted yet — decisions unlock once the applicant submits.
        </span>
      );
    }
    return (
      <span className="me-auto text-muted-foreground text-sm">
        Decision recorded — this application is {statusMeta[app.status].label.toLowerCase()}.
      </span>
    );
  }

  let sheetBody: React.ReactNode = null;
  if (loading || (!application && !loadError)) {
    sheetBody = (
      <div className="grid gap-4 p-6">
        <SheetHeader className="p-0">
          <SheetTitle className="sr-only">Loading application</SheetTitle>
          <SheetDescription className="sr-only">The application details are loading.</SheetDescription>
        </SheetHeader>
        <div className="flex items-center gap-4">
          <Skeleton className="size-10 rounded-full" />
          <div className="grid flex-1 gap-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-64" />
          </div>
        </div>
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  } else if (loadError) {
    sheetBody = (
      <div className="grid flex-1 content-center justify-items-center gap-3 p-6 text-center">
        <SheetHeader className="p-0">
          <SheetTitle>Could not load the application</SheetTitle>
          <SheetDescription>{loadError}</SheetDescription>
        </SheetHeader>
        <Button variant="outline" onClick={() => setReloadKey((key) => key + 1)}>
          <RotateCw /> Retry
        </Button>
      </div>
    );
  } else if (application) {
    sheetBody = (
      <>
        <SheetHeader className="border-b px-6 py-5">
          <div className="flex items-start gap-4 pe-6">
            <Avatar size="lg" className="mt-0.5">
              <AvatarImage src={application.profile_image_url || undefined} alt={name} />
              <AvatarFallback className="font-medium">{getInitials(name)}</AvatarFallback>
            </Avatar>
            <div className="grid flex-1 gap-1">
              <SheetTitle className="flex flex-wrap items-center gap-2 text-base leading-tight">
                {name}
                <StatusBadge status={application.status} />
              </SheetTitle>
              <SheetDescription className="leading-snug">
                {application.submitted_at ? `Applied ${formatDateTime(application.submitted_at)}` : "Not submitted yet"}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="grid gap-6">
            {application.bio ? (
              <p className="text-muted-foreground text-sm leading-relaxed">{application.bio}</p>
            ) : (
              <p className="text-muted-foreground/60 text-sm">No bio provided.</p>
            )}

            {application.intro_video_url ? (
              <div>
                <Button variant="outline" size="sm" asChild>
                  <a href={application.intro_video_url} target="_blank" rel="noreferrer">
                    <Play /> Watch intro video
                  </a>
                </Button>
              </div>
            ) : null}

            <Section icon={User} title="Profile">
              <div className="grid gap-1 text-sm">
                {application.phone_number ? (
                  <span>
                    {application.phone_country_code} {application.phone_number}
                  </span>
                ) : null}
                <span className="text-muted-foreground">
                  {[
                    application.gender,
                    application.date_of_birth ? `Born ${formatDate(application.date_of_birth)}` : null,
                  ]
                    .filter(Boolean)
                    .join(" · ") || "No profile details provided."}
                </span>
              </div>
            </Section>

            <Section icon={MapPin} title="Residency">
              <div className="text-sm">
                {application.country_of_residence || "Not provided"}
                {application.timezone ? <span className="text-muted-foreground"> · {application.timezone}</span> : null}
              </div>
            </Section>

            <Section icon={Languages} title="Teaching languages">
              {application.taught_languages.length ? (
                <div className="flex flex-wrap gap-1.5">
                  {application.taught_languages.map((language) => (
                    <Badge key={language} variant="outline" className="py-1 font-normal">
                      {language}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground/60 text-sm">No languages listed.</p>
              )}
            </Section>

            <Section icon={Sparkles} title="Topics they want to teach">
              {renderTopics(application)}
            </Section>

            <Section icon={CreditCard} title="Payout verification">
              <div>
                <Badge
                  variant="outline"
                  className={cn(
                    "border px-2 py-1 font-medium",
                    payoutStatusMeta[application.connect_account_status].badgeClass,
                  )}
                >
                  {payoutStatusMeta[application.connect_account_status].label}
                </Badge>
              </div>
            </Section>

            <Separator />

            <Section icon={Briefcase} title="Employment history">
              {application.employment.length ? (
                <div className="grid gap-4">
                  {application.employment.map((job) => (
                    <div key={job.id} className="grid gap-0.5 border-border/60 border-l-2 ps-3">
                      <div className="font-medium text-sm">
                        {job.current_position} <span className="text-muted-foreground">@ {job.company_name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground text-xs">
                        {durationLabel(job.working_duration_months)}
                        {job.is_current_role ? (
                          <Badge variant="outline" className="px-1.5 py-0 font-normal text-[10px]">
                            Current role
                          </Badge>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground/60 text-sm">No employment history listed.</p>
              )}
            </Section>

            <Section icon={GraduationCap} title="Education">
              {application.education.length ? (
                <div className="grid gap-2">
                  {application.education.map((entry) => (
                    <DocumentRow
                      key={entry.id}
                      title={entry.university_name}
                      subtitle={[entry.degree_type, entry.issued_date ? formatDate(entry.issued_date) : null]
                        .filter(Boolean)
                        .join(" · ")}
                      url={entry.supporting_document_url}
                      onPreview={openPreview}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground/60 text-sm">No education listed.</p>
              )}
            </Section>

            <Section icon={Award} title="Certificates">
              {application.certificates.length ? (
                <div className="grid gap-2">
                  {application.certificates.map((certificate) => (
                    <DocumentRow
                      key={certificate.id}
                      title={certificate.certificate_name}
                      subtitle={certificate.issued_date ? formatDate(certificate.issued_date) : "No issue date"}
                      url={certificate.supporting_document_url}
                      onPreview={openPreview}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground/60 text-sm">No certificates attached.</p>
              )}
            </Section>

            <Section icon={FolderGit2} title="Projects">
              {application.projects.length ? (
                <div className="grid gap-2">
                  {application.projects.map((project) => (
                    <a
                      key={project.id}
                      href={project.showcase_url}
                      target="_blank"
                      rel="noreferrer"
                      className="group flex items-center gap-3 rounded-md border px-3 py-2.5 transition-colors hover:bg-muted/50"
                    >
                      <FolderGit2 className="size-4 shrink-0 text-muted-foreground" />
                      <div className="grid min-w-0 flex-1 gap-0.5">
                        <span className="truncate font-medium text-sm group-hover:underline">
                          {project.project_title}
                        </span>
                        <span className="truncate text-muted-foreground text-xs">{project.description}</span>
                      </div>
                      <ExternalLink className="size-3.5 shrink-0 text-muted-foreground" />
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground/60 text-sm">No projects listed.</p>
              )}
            </Section>

            <Separator />

            <Section icon={CalendarClock} title="Weekly availability (UTC)">
              <div className="grid gap-1.5">
                {weekdayLabels.map((label, weekday) => {
                  const slots = slotsByWeekday.get(weekday) ?? [];
                  return (
                    <div key={label} className="flex items-start gap-3">
                      <span className="w-10 pt-1 font-medium text-muted-foreground text-xs">{label}</span>
                      {slots.length ? (
                        <div className="flex flex-wrap gap-1.5">
                          {slots.map((slot) => (
                            <Badge
                              key={`${slot.start_minute}-${slot.end_minute}`}
                              variant="outline"
                              className="font-normal tabular-nums"
                            >
                              {minuteLabel(slot.start_minute)} – {minuteLabel(slot.end_minute)}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="pt-1 text-muted-foreground/60 text-xs">Unavailable</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </Section>

            {auditLog.length ? (
              <Section icon={History} title="Decision history">
                <div className="grid gap-3">
                  {auditLog.map((entry) => (
                    <div key={entry.id} className="grid gap-0.5 border-border/60 border-l-2 ps-3">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium">{auditActionLabels[entry.action] ?? entry.action}</span>
                        <span className="text-muted-foreground text-xs">{formatDateTime(entry.created_at)}</span>
                      </div>
                      {entry.reason ? (
                        <p className="text-muted-foreground text-sm leading-snug">{entry.reason}</p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </Section>
            ) : null}

            {application.terms_accepted_at ? (
              <p className="text-muted-foreground/60 text-xs">
                Accepted terms{application.terms_version ? ` ${application.terms_version}` : ""} on{" "}
                {formatDateTime(application.terms_accepted_at)}.
              </p>
            ) : null}
          </div>
        </div>

        <SheetFooter className="flex-row items-center justify-end gap-2 border-t px-6 py-4">
          {renderFooterActions(application)}
        </SheetFooter>
      </>
    );
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-xl">{sheetBody}</SheetContent>
      </Sheet>

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject application</DialogTitle>
            <DialogDescription>
              Explain the decision for {name}. A reason is required and becomes part of the decision history.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="e.g. Below the experience bar for this cohort..."
            value={rejectReason}
            onChange={(event) => setRejectReason(event.target.value)}
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" disabled={rejectReason.trim() === "" || acting} onClick={handleReject}>
              Reject application
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AttachmentPreviewDialog attachment={previewAttachment} open={previewOpen} onOpenChange={setPreviewOpen} />
    </>
  );
}
