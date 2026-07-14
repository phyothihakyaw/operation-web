import { Badge } from "@/components/ui/badge";
import type { ApplicationStatus, ConnectAccountStatus } from "@/lib/api/applications";
import { cn } from "@/lib/utils";

export const statusMeta: Record<ApplicationStatus, { label: string; badgeClass: string; dotClass: string }> = {
  draft: {
    label: "Draft",
    badgeClass: "border-border bg-muted/50 text-muted-foreground",
    dotClass: "bg-muted-foreground",
  },
  pending: {
    label: "Pending review",
    badgeClass: "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400",
    dotClass: "bg-amber-500",
  },
  reviewing: {
    label: "In review",
    badgeClass: "border-sky-500/20 bg-sky-500/10 text-sky-600 dark:text-sky-400",
    dotClass: "bg-sky-500",
  },
  approved: {
    label: "Approved",
    badgeClass: "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    dotClass: "bg-emerald-500",
  },
  rejected: {
    label: "Rejected",
    badgeClass: "border-destructive/20 bg-destructive/10 text-destructive",
    dotClass: "bg-destructive",
  },
};

export function StatusBadge({ status }: { status: ApplicationStatus }) {
  const meta = statusMeta[status];

  return (
    <Badge className={cn("gap-1.5 border px-2 py-1 font-medium", meta.badgeClass)} variant="outline">
      <span className={cn("size-1.5 rounded-full", meta.dotClass)} />
      {meta.label}
    </Badge>
  );
}

export const payoutStatusMeta: Record<ConnectAccountStatus, { label: string; badgeClass: string }> = {
  unverified: { label: "Unverified", badgeClass: "border-border bg-muted/50 text-muted-foreground" },
  pending: { label: "Pending", badgeClass: "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  verified: {
    label: "Verified",
    badgeClass: "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  rejected: { label: "Rejected", badgeClass: "border-destructive/20 bg-destructive/10 text-destructive" },
};
