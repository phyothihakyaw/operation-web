"use client";

import { Download, ExternalLink, FileImage, FileText } from "lucide-react";

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

import type { CertificateAttachment } from "./data";

export function attachmentPreviewUrl(attachment: CertificateAttachment): string | null {
  if (attachment.fileType === "docx") return attachment.previewUrl ?? null;
  return attachment.previewUrl ?? attachment.url;
}

function PreviewBody({ attachment, previewUrl }: { attachment: CertificateAttachment; previewUrl: string | null }) {
  if (!previewUrl) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
        <FileText className="size-8 text-muted-foreground" />
        <p className="font-medium text-sm">No inline preview available</p>
        <p className="text-muted-foreground text-sm">Download the file to view it.</p>
      </div>
    );
  }

  if (attachment.fileType === "image") {
    return (
      <div className="flex h-full items-center justify-center overflow-auto p-6">
        {/* biome-ignore lint/performance/noImgElement: previews are user-uploaded files of unknown dimensions */}
        <img
          src={previewUrl}
          alt={`Preview of ${attachment.name}`}
          className="max-h-full max-w-full rounded-md border shadow-sm"
        />
      </div>
    );
  }

  return <iframe src={previewUrl} title={`Preview of ${attachment.name}`} className="size-full border-0" />;
}

export function AttachmentPreviewDialog({
  attachment,
  open,
  onOpenChange,
}: {
  attachment: CertificateAttachment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!attachment) return null;

  const previewUrl = attachmentPreviewUrl(attachment);
  const FileIcon = attachment.fileType === "image" ? FileImage : FileText;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[85vh] flex-col gap-0 p-0 sm:max-w-4xl">
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle className="flex flex-wrap items-center gap-2 pe-6 text-base">
            <FileIcon className="size-4 shrink-0 text-muted-foreground" />
            <span className="truncate">{attachment.name}</span>
            {attachment.fileType === "docx" ? (
              <Badge variant="secondary" className="font-normal">
                Converted preview
              </Badge>
            ) : null}
          </DialogTitle>
          <DialogDescription>
            {attachment.fileName} · {attachment.issuer} · {attachment.year} · {attachment.fileSize}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden bg-muted/30">
          <PreviewBody attachment={attachment} previewUrl={previewUrl} />
        </div>

        <DialogFooter className="flex-row justify-end gap-2 border-t px-6 py-4">
          {previewUrl ? (
            <Button variant="outline" asChild>
              <a href={previewUrl} target="_blank" rel="noreferrer">
                <ExternalLink /> Open in new tab
              </a>
            </Button>
          ) : null}
          <Button asChild>
            <a href={attachment.url} download={attachment.fileName}>
              <Download /> Download
            </a>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
