"use client";

import * as React from "react";

import { Check, MoreHorizontal, Search, X } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn, getInitials } from "@/lib/utils";

import { ApplicationReviewSheet } from "./application-review-sheet";
import { type ApplicationStatus, type MentorApplication, statusMeta } from "./data";

const statusTabs = ["All", "Pending review", "In review", "Accepted", "Rejected"] as const;

type StatusTab = (typeof statusTabs)[number];

function StatusBadge({ status }: { status: ApplicationStatus }) {
  const meta = statusMeta[status];

  return (
    <Badge className={cn("gap-1.5 border px-2 py-1 font-medium", meta.badgeClass)} variant="outline">
      <span className={cn("size-1.5 rounded-full", meta.dotClass)} />
      {status}
    </Badge>
  );
}

function BadgeOverflowList({ values, max = 2 }: { values: string[]; max?: number }) {
  const visible = values.slice(0, max);
  const remaining = values.length - visible.length;

  return (
    <div className="flex flex-wrap items-center gap-1">
      {visible.map((value) => (
        <Badge key={value} variant="secondary" className="font-normal">
          {value}
        </Badge>
      ))}
      {remaining > 0 ? <span className="text-muted-foreground text-xs">+{remaining}</span> : null}
    </div>
  );
}

export function MentorApplications({ initialApplications }: { initialApplications: MentorApplication[] }) {
  const [applications, setApplications] = React.useState(initialApplications);
  const [statusTab, setStatusTab] = React.useState<StatusTab>("All");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [topicFilter, setTopicFilter] = React.useState("All");
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = React.useState(false);

  const topics = React.useMemo(
    () => ["All", ...new Set(applications.flatMap((application) => application.topics))],
    [applications],
  );

  const statusCounts = React.useMemo(() => {
    const counts = new Map<StatusTab, number>([["All", applications.length]]);
    for (const application of applications) {
      counts.set(application.status, (counts.get(application.status) ?? 0) + 1);
    }
    return counts;
  }, [applications]);

  const filteredApplications = applications.filter((application) => {
    if (statusTab !== "All" && application.status !== statusTab) return false;
    if (topicFilter !== "All" && !application.topics.includes(topicFilter)) return false;
    if (searchQuery) {
      const haystack =
        `${application.name} ${application.email} ${application.residency.country} ${application.residency.city}`.toLowerCase();
      if (!haystack.includes(searchQuery.toLowerCase())) return false;
    }
    return true;
  });

  const selectedApplication = applications.find((application) => application.id === selectedId) ?? null;

  function openReview(id: string) {
    setSelectedId(id);
    setSheetOpen(true);
  }

  function applyDecision(id: string, status: ApplicationStatus, note?: string) {
    setApplications((previous) =>
      previous.map((application) =>
        application.id === id
          ? { ...application, status, decisionNote: note ?? application.decisionNote }
          : application,
      ),
    );
  }

  function quickDecision(application: MentorApplication, status: ApplicationStatus) {
    applyDecision(application.id, status);
    if (status === "Accepted") {
      toast.success(`${application.name} accepted as a mentor`);
    } else if (status === "Rejected") {
      toast(`${application.name}'s application rejected`);
    }
  }

  return (
    <>
      <Card>
        <CardHeader className="border-b has-data-[slot=card-action]:grid-cols-1 md:has-data-[slot=card-action]:grid-cols-[1fr_auto]">
          <CardTitle className="text-xl leading-none">Mentor Applications</CardTitle>
          <CardDescription className="max-w-sm leading-snug">
            Review mentor applications and decide who joins the program.
          </CardDescription>
          <CardAction className="col-start-1 row-start-auto flex w-full flex-wrap justify-start gap-2 justify-self-stretch md:col-start-2 md:row-span-2 md:row-start-1 md:w-auto md:flex-nowrap md:justify-end md:justify-self-end">
            <InputGroup className="h-7 w-full md:w-64">
              <InputGroupAddon align="inline-start">
                <Search className="size-3.5" />
              </InputGroupAddon>
              <InputGroupInput
                className="h-7"
                placeholder="Search applicants..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </InputGroup>
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 px-0">
          <div className="flex flex-wrap items-center justify-between gap-3 px-4">
            <Tabs value={statusTab} onValueChange={(value) => setStatusTab(value as StatusTab)}>
              <TabsList>
                {statusTabs.map((tab) => (
                  <TabsTrigger key={tab} value={tab} className="gap-1.5">
                    {tab}
                    <span className="text-muted-foreground text-xs tabular-nums">{statusCounts.get(tab) ?? 0}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            <Select value={topicFilter} onValueChange={setTopicFilter}>
              <SelectTrigger size="sm">
                <span className="text-muted-foreground">Topic:</span>
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" align="end">
                <SelectGroup>
                  {topics.map((topic) => (
                    <SelectItem key={topic} value={topic}>
                      {topic}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <Table className="**:data-[slot='table-cell']:px-4 **:data-[slot='table-head']:px-4">
            <TableHeader className="[&_tr]:border-t">
              <TableRow>
                <TableHead className="py-4 font-normal">Applicant</TableHead>
                <TableHead className="py-4 font-normal">Residency</TableHead>
                <TableHead className="py-4 font-normal">Languages</TableHead>
                <TableHead className="py-4 font-normal">Topics</TableHead>
                <TableHead className="py-4 font-normal">Applied</TableHead>
                <TableHead className="py-4 font-normal">Status</TableHead>
                <TableHead className="py-4 text-right font-normal">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredApplications.length ? (
                filteredApplications.map((application) => (
                  <TableRow
                    key={application.id}
                    className="cursor-pointer border-border/60 hover:bg-white/2.5"
                    onClick={() => openReview(application.id)}
                  >
                    <TableCell className="px-3 py-4 align-middle">
                      <div className="flex items-center gap-3">
                        <Avatar size="lg" className="font-medium">
                          <AvatarFallback>{getInitials(application.name)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="truncate font-medium text-foreground text-sm">{application.name}</div>
                          <div className="truncate text-muted-foreground text-sm">{application.headline}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-3 py-4 align-middle">
                      <div className="grid gap-0.5">
                        <span className="whitespace-nowrap text-sm">{application.residency.country}</span>
                        <span className="text-muted-foreground text-xs">
                          {application.residency.city} · {application.residency.timezone}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="px-3 py-4 align-middle">
                      <BadgeOverflowList values={application.languages.map(({ language }) => language)} />
                    </TableCell>
                    <TableCell className="px-3 py-4 align-middle">
                      <BadgeOverflowList values={application.topics} />
                    </TableCell>
                    <TableCell className="whitespace-nowrap px-3 py-4 align-middle text-sm">
                      {application.appliedDate.split(",")[0]}
                    </TableCell>
                    <TableCell className="px-3 py-4 align-middle">
                      <StatusBadge status={application.status} />
                    </TableCell>
                    <TableCell className="px-3 py-4 text-right align-middle">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            aria-label={`Open actions for ${application.name}`}
                            className="size-8 rounded-md text-muted-foreground hover:bg-muted/50"
                            size="icon-sm"
                            variant="ghost"
                            onClick={(event) => event.stopPropagation()}
                          >
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" onClick={(event) => event.stopPropagation()}>
                          <DropdownMenuItem onSelect={() => openReview(application.id)}>
                            Review application
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onSelect={() => quickDecision(application, "Accepted")}>
                            <Check /> Accept
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            variant="destructive"
                            onSelect={() => quickDecision(application, "Rejected")}
                          >
                            <X /> Reject
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    No applications match the current filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ApplicationReviewSheet
        application={selectedApplication}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onDecision={applyDecision}
      />
    </>
  );
}
