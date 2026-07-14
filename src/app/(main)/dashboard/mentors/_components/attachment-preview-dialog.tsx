"use client";

import { Download, ExternalLink, FileImage, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type Attachment = {
  name: string;
  url: string;
};

export type AttachmentKind = "image" | "pdf" | "other";

/** The API stores bare document URLs; the renderable kind is derived from the file extension. */
export function attachmentKind(url: string): AttachmentKind {
  const path = (url.split(/[?#]/)[0] ?? "").toLowerCase();
  if (/\.(png|jpe?g|webp|gif|avif|svg)$/.test(path)) return "image";
  if (path.endsWith(".pdf")) return "pdf";
  return "other";
}

function PreviewBody({ attachment }: { attachment: Attachment }) {
  const kind = attachmentKind(attachment.url);

  if (kind === "other") {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
        <FileText className="size-8 text-muted-foreground" />
        <p className="font-medium text-sm">No inline preview available</p>
        <p className="text-muted-foreground text-sm">Download the file to view it.</p>
      </div>
    );
  }

  if (kind === "image") {
    return (
      <div className="flex h-full items-center justify-center overflow-auto p-6">
        {/* biome-ignore lint/performance/noImgElement: previews are user-uploaded files of unknown dimensions */}
        <img
          src={attachment.url}
          alt={`Preview of ${attachment.name}`}
          className="max-h-full max-w-full rounded-md border shadow-sm"
        />
      </div>
    );
  }

  return <iframe src={attachment.url} title={`Preview of ${attachment.name}`} className="size-full border-0" />;
}

export function AttachmentPreviewDialog({
  attachment,
  open,
  onOpenChange,
}: {
  attachment: Attachment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!attachment) return null;

  const kind = attachmentKind(attachment.url);
  const FileIcon = kind === "image" ? FileImage : FileText;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[85vh] flex-col gap-0 p-0 sm:max-w-4xl">
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle className="flex flex-wrap items-center gap-2 pe-6 text-base">
            <FileIcon className="size-4 shrink-0 text-muted-foreground" />
            <span className="truncate">{attachment.name}</span>
          </DialogTitle>
          <DialogDescription className="truncate">Supporting document</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden bg-muted/30">
          <PreviewBody attachment={attachment} />
        </div>

        <DialogFooter className="flex-row justify-end gap-2 border-t px-6 py-4">
          <Button variant="outline" asChild>
            <a href={attachment.url} target="_blank" rel="noreferrer">
              <ExternalLink /> Open in new tab
            </a>
          </Button>
          <Button asChild>
            <a href={attachment.url} download>
              <Download /> Download
            </a>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
