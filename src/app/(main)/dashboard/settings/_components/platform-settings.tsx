"use client";

import * as React from "react";

import { Bell, Globe, Plug, UserCheck } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldContent, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/api/client";
import { API_BASE_URL, isApiConfigured } from "@/lib/api/config";
import { listInstructorApplications } from "@/lib/api/instructors";

const timezones = ["UTC", "Asia/Yangon (GMT+6:30)", "Asia/Singapore (GMT+8)", "Europe/Berlin (GMT+2)"];
const languages = ["English", "Burmese", "German", "Portuguese"];

const defaultSettings = {
  platformName: "LearnWU Admin",
  supportEmail: "support@learnwu.com",
  timezone: timezones[0],
  language: languages[0],
  maintenanceMode: false,

  minYearsExperience: "5",
  requireCertificates: false,
  autoStartReview: true,
  acceptTemplate:
    "Hi {{name}},\n\nCongratulations — your mentor application has been accepted! Here's how to get started...",
  rejectTemplate:
    "Hi {{name}},\n\nThank you for applying to become a mentor. After careful review we won't be moving forward this time.\n\n{{note}}",

  notifyNewApplication: true,
  notifyDecision: true,
  weeklyDigest: false,
  notificationRecipients: "admins@learnwu.com",

  webhookUrl: "",
};

type SettingsState = typeof defaultSettings;

function SettingsSection({ title, description }: { title: string; description: string }) {
  return (
    <div className="grid gap-0.5">
      <h3 className="font-medium text-sm">{title}</h3>
      <p className="text-muted-foreground text-sm leading-snug">{description}</p>
    </div>
  );
}

export function PlatformSettings() {
  const [settings, setSettings] = React.useState<SettingsState>(defaultSettings);
  const [testing, setTesting] = React.useState(false);

  function set<K extends keyof SettingsState>(key: K, value: SettingsState[K]) {
    setSettings((previous) => ({ ...previous, [key]: value }));
  }

  function handleSave() {
    toast.success("Settings saved", {
      description: "Changes are stored locally for now — the settings API is coming later.",
    });
  }

  async function handleTestConnection() {
    if (!isApiConfigured) {
      toast("API is not configured", {
        description: "Set NEXT_PUBLIC_API_URL (and API_PROXY_TARGET for proxy mode) to connect.",
      });
      return;
    }
    setTesting(true);
    try {
      const applications = await listInstructorApplications();
      toast.success("API connection is working", {
        description: `Fetched ${applications.length} instructor application${applications.length === 1 ? "" : "s"}.`,
      });
    } catch (error) {
      const description = error instanceof ApiError ? error.message : "Unexpected error.";
      toast.error("API connection failed", { description });
    } finally {
      setTesting(false);
    }
  }

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle className="text-xl leading-none">Platform Settings</CardTitle>
        <CardDescription className="leading-snug">
          Configure how the platform behaves for admins, mentors, and applicants.
        </CardDescription>
        <CardAction>
          <Button size="sm" onClick={handleSave}>
            Save changes
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="general" className="gap-6">
          <TabsList>
            <TabsTrigger value="general" className="gap-1.5">
              <Globe className="size-3.5" /> General
            </TabsTrigger>
            <TabsTrigger value="vetting" className="gap-1.5">
              <UserCheck className="size-3.5" /> Mentor Vetting
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-1.5">
              <Bell className="size-3.5" /> Notifications
            </TabsTrigger>
            <TabsTrigger value="api" className="gap-1.5">
              <Plug className="size-3.5" /> API & Integrations
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <FieldGroup className="max-w-2xl gap-6">
              <Field className="gap-1.5">
                <FieldLabel htmlFor="settings-platform-name">Platform name</FieldLabel>
                <Input
                  id="settings-platform-name"
                  value={settings.platformName}
                  onChange={(event) => set("platformName", event.target.value)}
                />
              </Field>
              <Field className="gap-1.5">
                <FieldLabel htmlFor="settings-support-email">Support email</FieldLabel>
                <Input
                  id="settings-support-email"
                  type="email"
                  value={settings.supportEmail}
                  onChange={(event) => set("supportEmail", event.target.value)}
                />
                <FieldDescription>Shown to applicants in every notification email.</FieldDescription>
              </Field>
              <div className="grid gap-6 sm:grid-cols-2">
                <Field className="gap-1.5">
                  <FieldLabel htmlFor="settings-timezone">Default timezone</FieldLabel>
                  <Select value={settings.timezone} onValueChange={(value) => set("timezone", value)}>
                    <SelectTrigger id="settings-timezone">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {timezones.map((timezone) => (
                          <SelectItem key={timezone} value={timezone}>
                            {timezone}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>
                <Field className="gap-1.5">
                  <FieldLabel htmlFor="settings-language">Default language</FieldLabel>
                  <Select value={settings.language} onValueChange={(value) => set("language", value)}>
                    <SelectTrigger id="settings-language">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {languages.map((language) => (
                          <SelectItem key={language} value={language}>
                            {language}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              <Separator />
              <Field orientation="horizontal">
                <FieldContent>
                  <FieldLabel htmlFor="settings-maintenance">Maintenance mode</FieldLabel>
                  <FieldDescription>Temporarily block non-admin access to the platform.</FieldDescription>
                </FieldContent>
                <Switch
                  id="settings-maintenance"
                  checked={settings.maintenanceMode}
                  onCheckedChange={(checked) => set("maintenanceMode", checked)}
                />
              </Field>
            </FieldGroup>
          </TabsContent>

          <TabsContent value="vetting">
            <FieldGroup className="max-w-2xl gap-6">
              <SettingsSection
                title="Application requirements"
                description="Rules applied when new mentor applications arrive."
              />
              <Field className="gap-1.5">
                <FieldLabel htmlFor="settings-min-experience">Minimum years of experience</FieldLabel>
                <Input
                  id="settings-min-experience"
                  type="number"
                  min={0}
                  className="w-32"
                  value={settings.minYearsExperience}
                  onChange={(event) => set("minYearsExperience", event.target.value)}
                />
                <FieldDescription>Applications below the bar are flagged for reviewers.</FieldDescription>
              </Field>
              <Field orientation="horizontal">
                <FieldContent>
                  <FieldLabel htmlFor="settings-require-certificates">Require certificate attachments</FieldLabel>
                  <FieldDescription>Applicants must upload at least one certificate.</FieldDescription>
                </FieldContent>
                <Switch
                  id="settings-require-certificates"
                  checked={settings.requireCertificates}
                  onCheckedChange={(checked) => set("requireCertificates", checked)}
                />
              </Field>
              <Field orientation="horizontal">
                <FieldContent>
                  <FieldLabel htmlFor="settings-auto-review">Auto-move opened applications to “In review”</FieldLabel>
                  <FieldDescription>When an admin opens a pending application, mark it as in review.</FieldDescription>
                </FieldContent>
                <Switch
                  id="settings-auto-review"
                  checked={settings.autoStartReview}
                  onCheckedChange={(checked) => set("autoStartReview", checked)}
                />
              </Field>
              <Separator />
              <SettingsSection
                title="Decision emails"
                description="Templates sent when an application is accepted or rejected. Supports {{name}} and {{note}}."
              />
              <Field className="gap-1.5">
                <FieldLabel htmlFor="settings-accept-template">Acceptance email</FieldLabel>
                <Textarea
                  id="settings-accept-template"
                  rows={4}
                  value={settings.acceptTemplate}
                  onChange={(event) => set("acceptTemplate", event.target.value)}
                />
              </Field>
              <Field className="gap-1.5">
                <FieldLabel htmlFor="settings-reject-template">Rejection email</FieldLabel>
                <Textarea
                  id="settings-reject-template"
                  rows={4}
                  value={settings.rejectTemplate}
                  onChange={(event) => set("rejectTemplate", event.target.value)}
                />
                <FieldDescription>{"{{note}}"} is replaced with the reviewer’s decision note.</FieldDescription>
              </Field>
            </FieldGroup>
          </TabsContent>

          <TabsContent value="notifications">
            <FieldGroup className="max-w-2xl gap-6">
              <Field orientation="horizontal">
                <FieldContent>
                  <FieldLabel htmlFor="settings-notify-new">New application received</FieldLabel>
                  <FieldDescription>Email admins when a mentor application is submitted.</FieldDescription>
                </FieldContent>
                <Switch
                  id="settings-notify-new"
                  checked={settings.notifyNewApplication}
                  onCheckedChange={(checked) => set("notifyNewApplication", checked)}
                />
              </Field>
              <Field orientation="horizontal">
                <FieldContent>
                  <FieldLabel htmlFor="settings-notify-decision">Decision made</FieldLabel>
                  <FieldDescription>Email admins when an application is accepted or rejected.</FieldDescription>
                </FieldContent>
                <Switch
                  id="settings-notify-decision"
                  checked={settings.notifyDecision}
                  onCheckedChange={(checked) => set("notifyDecision", checked)}
                />
              </Field>
              <Field orientation="horizontal">
                <FieldContent>
                  <FieldLabel htmlFor="settings-weekly-digest">Weekly digest</FieldLabel>
                  <FieldDescription>A Monday summary of pending applications and decisions.</FieldDescription>
                </FieldContent>
                <Switch
                  id="settings-weekly-digest"
                  checked={settings.weeklyDigest}
                  onCheckedChange={(checked) => set("weeklyDigest", checked)}
                />
              </Field>
              <Separator />
              <Field className="gap-1.5">
                <FieldLabel htmlFor="settings-recipients">Notification recipients</FieldLabel>
                <Input
                  id="settings-recipients"
                  placeholder="comma-separated emails"
                  value={settings.notificationRecipients}
                  onChange={(event) => set("notificationRecipients", event.target.value)}
                />
              </Field>
            </FieldGroup>
          </TabsContent>

          <TabsContent value="api">
            <FieldGroup className="max-w-2xl gap-6">
              <div className="flex items-center gap-3 rounded-md border px-4 py-3">
                <div className="grid flex-1 gap-0.5">
                  <span className="font-medium text-sm">LearnWU API</span>
                  <span className="text-muted-foreground text-sm">
                    {isApiConfigured
                      ? `Connected via ${API_BASE_URL.startsWith("/") ? `same-origin proxy (${API_BASE_URL})` : API_BASE_URL}`
                      : "Not configured — the app is running on built-in sample data."}
                  </span>
                </div>
                <Badge
                  variant="outline"
                  className={
                    isApiConfigured
                      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                  }
                >
                  {isApiConfigured ? "Configured" : "Sample data"}
                </Badge>
              </div>
              <div>
                <Button variant="outline" onClick={handleTestConnection} disabled={testing}>
                  {testing ? <Spinner /> : null}
                  Test connection
                </Button>
              </div>
              <FieldDescription>
                The base URL is configured through environment variables (NEXT_PUBLIC_API_URL, API_PROXY_TARGET) — see
                .env.example.
              </FieldDescription>
              <Separator />
              <Field className="gap-1.5">
                <FieldLabel htmlFor="settings-webhook">Webhook URL</FieldLabel>
                <Input
                  id="settings-webhook"
                  placeholder="https://hooks.example.com/mentor-decisions"
                  value={settings.webhookUrl}
                  onChange={(event) => set("webhookUrl", event.target.value)}
                />
                <FieldDescription>Receive a POST whenever an application decision is made.</FieldDescription>
              </Field>
            </FieldGroup>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
