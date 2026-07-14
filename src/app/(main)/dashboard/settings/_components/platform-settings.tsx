"use client";

import * as React from "react";

import { format } from "date-fns";
import { RotateCw } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { ApiError } from "@/lib/api/client";
import { getPlatformSettings, updatePlatformSettings } from "@/lib/api/settings";

// The API currently exposes exactly one platform setting (minimum_notice_hours via
// GET/PUT /v1/admin/platform-settings). Settings without a backing endpoint
// (branding, vetting rules, notifications, webhooks) are deliberately not rendered —
// add them back one by one as their APIs ship.

function errorMessage(error: unknown): string {
  return error instanceof ApiError ? error.message : "Something went wrong. Try again.";
}

export function PlatformSettings() {
  const [minimumNoticeHours, setMinimumNoticeHours] = React.useState("");
  const [updatedAt, setUpdatedAt] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [reloadKey, setReloadKey] = React.useState(0);
  const [saving, setSaving] = React.useState(false);

  // biome-ignore lint/correctness/useExhaustiveDependencies: reloadKey re-runs the fetch for the retry button
  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    getPlatformSettings()
      .then((settings) => {
        if (cancelled) return;
        setMinimumNoticeHours(String(settings.minimum_notice_hours));
        setUpdatedAt(settings.updated_at);
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
  }, [reloadKey]);

  async function handleSave() {
    const hours = Number(minimumNoticeHours);
    if (!Number.isInteger(hours) || hours < 0) {
      toast.error("Minimum notice must be a whole number of hours, 0 or more.");
      return;
    }
    setSaving(true);
    try {
      const saved = await updatePlatformSettings(hours);
      setMinimumNoticeHours(String(saved.minimum_notice_hours));
      setUpdatedAt(saved.updated_at);
      toast.success("Settings saved");
    } catch (error) {
      toast.error("Could not save settings", { description: errorMessage(error) });
    } finally {
      setSaving(false);
    }
  }

  let cardBody: React.ReactNode;
  if (loading) {
    cardBody = (
      <div className="grid max-w-2xl gap-3">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-4 w-72" />
      </div>
    );
  } else if (loadError) {
    cardBody = (
      <div className="grid max-w-2xl justify-items-start gap-2">
        <p className="text-muted-foreground text-sm">{loadError}</p>
        <Button size="sm" variant="outline" onClick={() => setReloadKey((key) => key + 1)}>
          <RotateCw /> Retry
        </Button>
      </div>
    );
  } else {
    cardBody = (
      <FieldGroup className="max-w-2xl gap-6">
        <Field className="gap-1.5">
          <FieldLabel htmlFor="settings-minimum-notice">Minimum booking notice (hours)</FieldLabel>
          <Input
            id="settings-minimum-notice"
            type="number"
            min={0}
            step={1}
            className="w-32"
            value={minimumNoticeHours}
            onChange={(event) => setMinimumNoticeHours(event.target.value)}
          />
          <FieldDescription>
            How far in advance a learner must book a session. Set 0 to allow booking any open slot.
          </FieldDescription>
        </Field>
        {updatedAt ? (
          <p className="text-muted-foreground text-xs">
            Last updated {format(new Date(updatedAt), "d MMM yyyy, h:mm a")}.
          </p>
        ) : null}
      </FieldGroup>
    );
  }

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle className="text-xl leading-none">Platform settings</CardTitle>
        <CardDescription className="leading-snug">
          Booking policy for the Learnwu platform. Changes apply to all learners and mentors.
        </CardDescription>
        <CardAction>
          <Button size="sm" onClick={handleSave} disabled={saving || loading || loadError !== null}>
            {saving ? <Spinner /> : null}
            Save changes
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>{cardBody}</CardContent>
    </Card>
  );
}
