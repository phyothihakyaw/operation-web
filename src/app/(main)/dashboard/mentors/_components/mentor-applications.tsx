"use client";

import * as React from "react";

import { endOfDay, format, startOfDay } from "date-fns";
import { Check, ChevronLeft, ChevronRight, MoreHorizontal, Play, RotateCw, X } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { toast } from "sonner";

import { DateRangePicker } from "@/components/date-range-picker";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  type ApplicationListPage,
  type ApplicationSummary,
  approveApplication,
  listApplications,
  startReview,
} from "@/lib/api/applications";
import { ApiError } from "@/lib/api/client";
import { cn, getInitials } from "@/lib/utils";

import { ApplicationReviewSheet } from "./application-review-sheet";
import { StatusBadge, statusMeta } from "./status";

const PAGE_SIZE = 20;

const statusTabs = ["all", "pending", "reviewing", "approved", "rejected", "draft"] as const;

type StatusTab = (typeof statusTabs)[number];

function tabLabel(tab: StatusTab): string {
  return tab === "all" ? "All" : statusMeta[tab].label;
}

function applicantName(application: ApplicationSummary): string {
  return `${application.first_name} ${application.last_name}`.trim() || "Unnamed applicant";
}

function errorMessage(error: unknown): string {
  return error instanceof ApiError ? error.message : "Something went wrong. Try again.";
}

const skeletonRows = Array.from({ length: 5 }, (_, index) => (
  // biome-ignore lint/suspicious/noArrayIndexKey: static placeholder rows have no identity
  <TableRow key={index}>
    <TableCell className="px-3 py-4">
      <div className="flex items-center gap-3">
        <Skeleton className="size-10 rounded-full" />
        <Skeleton className="h-4 w-40" />
      </div>
    </TableCell>
    <TableCell className="px-3 py-4">
      <Skeleton className="h-4 w-24" />
    </TableCell>
    <TableCell className="px-3 py-4">
      <Skeleton className="h-4 w-24" />
    </TableCell>
    <TableCell className="px-3 py-4">
      <Skeleton className="h-6 w-28 rounded-full" />
    </TableCell>
    <TableCell className="px-3 py-4 text-right">
      <Skeleton className="ms-auto size-8 rounded-md" />
    </TableCell>
  </TableRow>
));

export function MentorApplications() {
  const [statusTab, setStatusTab] = React.useState<StatusTab>("all");
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>();
  const [offset, setOffset] = React.useState(0);
  const [page, setPage] = React.useState<ApplicationListPage | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [refreshKey, setRefreshKey] = React.useState(0);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = React.useState(false);

  const refresh = React.useCallback(() => setRefreshKey((key) => key + 1), []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: refreshKey re-runs the fetch after decisions and for retry
  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    listApplications({
      status: statusTab === "all" ? undefined : statusTab,
      createdAfter: dateRange?.from ? startOfDay(dateRange.from) : undefined,
      createdBefore: dateRange?.to ? endOfDay(dateRange.to) : undefined,
      limit: PAGE_SIZE,
      offset,
    })
      .then((loaded) => {
        if (cancelled) return;
        setPage(loaded);
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
  }, [statusTab, dateRange, offset, refreshKey]);

  function changeTab(tab: StatusTab) {
    setStatusTab(tab);
    setOffset(0);
  }

  function changeDateRange(range: DateRange | undefined) {
    setDateRange(range);
    setOffset(0);
  }

  function openReview(id: string) {
    setSelectedId(id);
    setSheetOpen(true);
  }

  async function runAction(action: () => Promise<unknown>, successMessage: string) {
    try {
      await action();
      toast.success(successMessage);
      refresh();
    } catch (error) {
      toast.error("Could not update the application", { description: errorMessage(error) });
    }
  }

  const items = page?.items ?? [];
  const showSkeleton = loading && !page;

  let tableRows: React.ReactNode;
  if (showSkeleton) {
    tableRows = skeletonRows;
  } else if (loadError) {
    tableRows = (
      <TableRow>
        <TableCell colSpan={5} className="h-32 text-center">
          <div className="grid justify-items-center gap-2">
            <p className="text-muted-foreground text-sm">{loadError}</p>
            <Button size="sm" variant="outline" onClick={refresh}>
              <RotateCw /> Retry
            </Button>
          </div>
        </TableCell>
      </TableRow>
    );
  } else if (items.length === 0) {
    tableRows = (
      <TableRow>
        <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
          No applications match the current filters.
        </TableCell>
      </TableRow>
    );
  } else {
    tableRows = items.map((application) => (
      <TableRow
        key={application.id}
        className="cursor-pointer border-border/60 hover:bg-muted/30"
        onClick={() => openReview(application.id)}
      >
        <TableCell className="px-3 py-4 align-middle">
          <div className="flex items-center gap-3">
            <Avatar size="lg" className="font-medium">
              <AvatarFallback>{getInitials(applicantName(application))}</AvatarFallback>
            </Avatar>
            <span className="truncate font-medium text-foreground text-sm">{applicantName(application)}</span>
          </div>
        </TableCell>
        <TableCell className="whitespace-nowrap px-3 py-4 align-middle text-sm">
          {application.submitted_at ? (
            format(new Date(application.submitted_at), "d MMM yyyy")
          ) : (
            <span className="text-muted-foreground">Not submitted</span>
          )}
        </TableCell>
        <TableCell className="whitespace-nowrap px-3 py-4 align-middle text-sm">
          {format(new Date(application.created_at), "d MMM yyyy")}
        </TableCell>
        <TableCell className="px-3 py-4 align-middle">
          <StatusBadge status={application.status} />
        </TableCell>
        <TableCell className="px-3 py-4 text-right align-middle">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                aria-label={`Open actions for ${applicantName(application)}`}
                className="size-8 rounded-md text-muted-foreground hover:bg-muted/50"
                size="icon-sm"
                variant="ghost"
                onClick={(event) => event.stopPropagation()}
              >
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(event) => event.stopPropagation()}>
              <DropdownMenuItem onSelect={() => openReview(application.id)}>Review application</DropdownMenuItem>
              {application.status === "pending" ? (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onSelect={() =>
                      runAction(() => startReview(application.id), `Review started for ${applicantName(application)}`)
                    }
                  >
                    <Play /> Start review
                  </DropdownMenuItem>
                </>
              ) : null}
              {application.status === "reviewing" ? (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onSelect={() =>
                      runAction(
                        () => approveApplication(application.id),
                        `${applicantName(application)} approved as a mentor`,
                      )
                    }
                  >
                    <Check /> Approve
                  </DropdownMenuItem>
                </>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
    ));
  }

  return (
    <>
      <Card>
        <CardHeader className="border-b has-data-[slot=card-action]:grid-cols-1 md:has-data-[slot=card-action]:grid-cols-[1fr_auto]">
          <CardTitle className="text-xl leading-none">Mentor applications</CardTitle>
          <CardDescription className="max-w-sm leading-snug">
            Review mentor applications and decide who joins the program.
          </CardDescription>
          <CardAction className="col-start-1 row-start-auto flex w-full flex-wrap items-center justify-start gap-2 justify-self-stretch md:col-start-2 md:row-span-2 md:row-start-1 md:w-auto md:flex-nowrap md:justify-end md:justify-self-end">
            <DateRangePicker value={dateRange ?? { from: undefined, to: undefined }} onChange={changeDateRange} />
            {dateRange?.from ? (
              <Button
                aria-label="Clear date filter"
                size="icon-sm"
                variant="ghost"
                className="text-muted-foreground"
                onClick={() => changeDateRange(undefined)}
              >
                <X className="size-4" />
              </Button>
            ) : null}
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 px-0">
          <div className="flex flex-wrap items-center justify-between gap-3 px-4">
            <Tabs value={statusTab} onValueChange={(value) => changeTab(value as StatusTab)}>
              <TabsList>
                {statusTabs.map((tab) => (
                  <TabsTrigger key={tab} value={tab}>
                    {tabLabel(tab)}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          <Table
            className={cn(
              "**:data-[slot='table-cell']:px-4 **:data-[slot='table-head']:px-4",
              loading && page && "opacity-60",
            )}
          >
            <TableHeader className="[&_tr]:border-t">
              <TableRow>
                <TableHead className="py-4 font-normal">Applicant</TableHead>
                <TableHead className="py-4 font-normal">Submitted</TableHead>
                <TableHead className="py-4 font-normal">Created</TableHead>
                <TableHead className="py-4 font-normal">Status</TableHead>
                <TableHead className="py-4 text-right font-normal">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>{tableRows}</TableBody>
          </Table>

          {page && page.total > 0 ? (
            <div className="flex flex-wrap items-center justify-between gap-3 px-4">
              <span className="text-muted-foreground text-sm">
                Showing {page.offset + 1}–{page.offset + items.length} of {page.total}
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={offset === 0 || loading}
                  onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
                >
                  <ChevronLeft /> Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={offset + PAGE_SIZE >= page.total || loading}
                  onClick={() => setOffset(offset + PAGE_SIZE)}
                >
                  Next <ChevronRight />
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <ApplicationReviewSheet
        applicationId={selectedId}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onChanged={refresh}
      />
    </>
  );
}
