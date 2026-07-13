"use client";

import * as React from "react";

import {
  Award,
  Briefcase,
  CalendarClock,
  Check,
  Download,
  ExternalLink,
  Eye,
  FileImage,
  FileText,
  FolderGit2,
  GraduationCap,
  Languages,
  MapPin,
  Sparkles,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { Textarea } from "@/components/ui/textarea";
import { cn, getInitials } from "@/lib/utils";

import { AttachmentPreviewDialog, attachmentPreviewUrl } from "./attachment-preview-dialog";
import { type ApplicationStatus, type CertificateAttachment, type MentorApplication, statusMeta } from "./data";

function StatusBadge({ status }: { status: ApplicationStatus }) {
  const meta = statusMeta[status];

  return (
    <Badge className={cn("gap-1.5 border px-2 py-1 font-medium", meta.badgeClass)} variant="outline">
      <span className={cn("size-1.5 rounded-full", meta.dotClass)} />
      {status}
    </Badge>
  );
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

const proficiencyRank: Record<string, number> = {
  Native: 0,
  Fluent: 1,
  Professional: 2,
  Conversational: 3,
};

export function ApplicationReviewSheet({
  application,
  open,
  onOpenChange,
  onDecision,
}: {
  application: MentorApplication | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDecision: (id: string, status: ApplicationStatus, note?: string) => void;
}) {
  const [rejectDialogOpen, setRejectDialogOpen] = React.useState(false);
  const [rejectReason, setRejectReason] = React.useState("");
  const [previewAttachment, setPreviewAttachment] = React.useState<CertificateAttachment | null>(null);
  const [previewOpen, setPreviewOpen] = React.useState(false);

  if (!application) return null;

  const isDecided = application.status === "Accepted" || application.status === "Rejected";
  const sortedLanguages = [...application.languages].sort(
    (a, b) => (proficiencyRank[a.proficiency] ?? 9) - (proficiencyRank[b.proficiency] ?? 9),
  );

  function handleAccept() {
    if (!application) return;
    onDecision(application.id, "Accepted");
    onOpenChange(false);
    toast.success(`${application.name} accepted as a mentor`, {
      description: "They will receive an onboarding email. (mock)",
    });
  }

  function handleReject() {
    if (!application) return;
    onDecision(application.id, "Rejected", rejectReason.trim() || undefined);
    setRejectDialogOpen(false);
    setRejectReason("");
    onOpenChange(false);
    toast(`${application.name}'s application rejected`, {
      description: "A notification email will be sent to the applicant. (mock)",
    });
  }

  function openPreview(attachment: CertificateAttachment) {
    setPreviewAttachment(attachment);
    setPreviewOpen(true);
  }

  function handleStartReview() {
    if (!application) return;
    onDecision(application.id, "In review");
    toast(`Marked ${application.name}'s application as in review`);
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-xl">
          <SheetHeader className="border-b px-6 py-5">
            <div className="flex items-start gap-4 pe-6">
              <Avatar size="lg" className="mt-0.5">
                <AvatarFallback className="font-medium">{getInitials(application.name)}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 gap-1">
                <SheetTitle className="flex flex-wrap items-center gap-2 text-base leading-tight">
                  {application.name}
                  <StatusBadge status={application.status} />
                </SheetTitle>
                <SheetDescription className="leading-snug">
                  {application.headline} · {application.email}
                </SheetDescription>
                <span className="text-muted-foreground text-xs">
                  {application.id} · Applied {application.appliedDate}
                </span>
              </div>
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-6 py-5">
            <div className="grid gap-6">
              <p className="text-muted-foreground text-sm leading-relaxed">{application.bio}</p>

              {application.decisionNote ? (
                <div
                  className={cn(
                    "rounded-md border px-3 py-2.5 text-sm leading-snug",
                    statusMeta[application.status].badgeClass,
                  )}
                >
                  <span className="font-medium">Decision note:</span> {application.decisionNote}
                </div>
              ) : null}

              <Section icon={MapPin} title="Residency">
                <div className="text-sm">
                  {application.residency.city}, {application.residency.country}
                  <span className="text-muted-foreground"> · {application.residency.timezone}</span>
                </div>
              </Section>

              <Section icon={Languages} title="Spoken languages">
                <div className="flex flex-wrap gap-1.5">
                  {sortedLanguages.map(({ language, proficiency }) => (
                    <Badge key={language} variant="outline" className="gap-1.5 py-1 font-normal">
                      {language}
                      <span className="text-muted-foreground text-xs">{proficiency}</span>
                    </Badge>
                  ))}
                </div>
              </Section>

              <Section icon={Sparkles} title="Topics they want to teach">
                <div className="flex flex-wrap gap-1.5">
                  {application.topics.map((topic) => (
                    <Badge key={topic} variant="secondary" className="py-1 font-normal">
                      {topic}
                    </Badge>
                  ))}
                </div>
              </Section>

              <Separator />

              <Section icon={Briefcase} title="Employment history">
                <div className="grid gap-4">
                  {application.employment.map((job) => (
                    <div key={`${job.company}-${job.start}`} className="grid gap-0.5 border-border/60 border-l-2 ps-3">
                      <div className="font-medium text-sm">
                        {job.title} <span className="text-muted-foreground">@ {job.company}</span>
                      </div>
                      <div className="text-muted-foreground text-xs">
                        {job.start} – {job.end ?? "Present"}
                      </div>
                      <p className="mt-1 text-muted-foreground text-sm leading-snug">{job.summary}</p>
                    </div>
                  ))}
                </div>
              </Section>

              <Section icon={GraduationCap} title="Education">
                <div className="grid gap-3">
                  {application.education.map((entry) => (
                    <div key={entry.school} className="grid gap-0.5">
                      <div className="font-medium text-sm">{entry.school}</div>
                      <div className="text-muted-foreground text-xs">
                        {entry.degree} · {entry.start} – {entry.end}
                      </div>
                    </div>
                  ))}
                </div>
              </Section>

              <Section icon={Award} title="Certificates">
                {application.certificates.length ? (
                  <div className="grid gap-2">
                    {application.certificates.map((certificate) => {
                      const previewable = attachmentPreviewUrl(certificate) !== null;
                      const CertificateIcon = certificate.fileType === "image" ? FileImage : FileText;

                      const details = (
                        <>
                          <span className="truncate font-medium text-sm">{certificate.name}</span>
                          <span className="truncate text-muted-foreground text-xs">
                            {certificate.issuer} · {certificate.year} · {certificate.fileSize}
                          </span>
                        </>
                      );

                      return (
                        <div
                          key={certificate.fileName}
                          className={cn(
                            "flex items-center gap-3 rounded-md border px-3 py-2.5",
                            previewable && "transition-colors hover:bg-muted/50",
                          )}
                        >
                          <CertificateIcon className="size-4 shrink-0 text-muted-foreground" />
                          {previewable ? (
                            <button
                              type="button"
                              className="grid min-w-0 flex-1 cursor-pointer gap-0.5 text-start hover:[&>span:first-child]:underline"
                              onClick={() => openPreview(certificate)}
                            >
                              {details}
                            </button>
                          ) : (
                            <div className="grid min-w-0 flex-1 gap-0.5">{details}</div>
                          )}
                          {previewable ? (
                            <Button
                              aria-label={`Preview ${certificate.fileName}`}
                              size="icon-sm"
                              variant="ghost"
                              className="text-muted-foreground"
                              onClick={() => openPreview(certificate)}
                            >
                              <Eye />
                            </Button>
                          ) : null}
                          <Button
                            aria-label={`Download ${certificate.fileName}`}
                            size="icon-sm"
                            variant="ghost"
                            className="text-muted-foreground"
                            asChild
                          >
                            <a href={certificate.url} download={certificate.fileName}>
                              <Download />
                            </a>
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">No certificates attached.</p>
                )}
              </Section>

              <Section icon={FolderGit2} title="Open source projects">
                <div className="grid gap-2">
                  {application.openSource.map((project) => (
                    <a
                      key={project.url}
                      href={project.url}
                      target="_blank"
                      rel="noreferrer"
                      className="group flex items-center gap-3 rounded-md border px-3 py-2.5 transition-colors hover:bg-muted/50"
                    >
                      <FolderGit2 className="size-4 shrink-0 text-muted-foreground" />
                      <div className="grid min-w-0 flex-1 gap-0.5">
                        <span className="truncate font-medium text-sm group-hover:underline">{project.name}</span>
                        <span className="truncate text-muted-foreground text-xs">{project.description}</span>
                      </div>
                      <ExternalLink className="size-3.5 shrink-0 text-muted-foreground" />
                    </a>
                  ))}
                </div>
              </Section>

              <Separator />

              <Section icon={CalendarClock} title="Weekly availability">
                <div className="grid gap-1.5">
                  {application.weeklyAvailability.map(({ day, slots }) => (
                    <div key={day} className="flex items-start gap-3">
                      <span className="w-10 pt-1 font-medium text-muted-foreground text-xs">{day}</span>
                      {slots.length ? (
                        <div className="flex flex-wrap gap-1.5">
                          {slots.map((slot) => (
                            <Badge key={slot} variant="outline" className="font-normal tabular-nums">
                              {slot}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="pt-1 text-muted-foreground/60 text-xs">Unavailable</span>
                      )}
                    </div>
                  ))}
                </div>
              </Section>
            </div>
          </div>

          <SheetFooter className="flex-row justify-end gap-2 border-t px-6 py-4">
            {isDecided ? (
              <Button variant="outline" onClick={handleStartReview}>
                Reopen review
              </Button>
            ) : (
              <>
                {application.status === "Pending review" ? (
                  <Button variant="outline" className="me-auto" onClick={handleStartReview}>
                    Mark as in review
                  </Button>
                ) : null}
                <Button variant="destructive" onClick={() => setRejectDialogOpen(true)}>
                  <X /> Reject
                </Button>
                <Button onClick={handleAccept}>
                  <Check /> Accept
                </Button>
              </>
            )}
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject application</DialogTitle>
            <DialogDescription>
              Add an optional note for {application.name}. It will be included in the rejection email.
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
            <Button variant="destructive" onClick={handleReject}>
              Reject application
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AttachmentPreviewDialog attachment={previewAttachment} open={previewOpen} onOpenChange={setPreviewOpen} />
    </>
  );
}
