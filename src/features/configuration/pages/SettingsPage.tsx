import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Save, Check } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { CurrencySelect } from "@/components/shared/CurrencySelect";
const TIMEZONES = [
  "America/New_York (EST)",
  "America/Chicago (CST)",
  "America/Denver (MST)",
  "America/Los_Angeles (PST)",
  "Europe/London (GMT)",
  "Europe/Paris (CET)",
  "Asia/Tokyo (JST)",
  "Asia/Singapore (SGT)",
  "Asia/Kolkata (IST)",
  "Australia/Sydney (AEST)",
] as const;
const PRIORITIES = ["1", "2", "3", "4", "5"] as const;

const SettingsPage: React.FC = () => {
  const { t } = useTranslation();
  const [systemName, setSystemName] = useState("Formula Engine");
  const [defaultCurrency, setDefaultCurrency] = useState("USD");
  const [timeZone, setTimeZone] = useState("America/New_York (EST)");

  const [emailNotifications, setEmailNotifications] = useState(true);
  const [slackIntegration, setSlackIntegration] = useState(false);
  const [slackWebhookUrl, setSlackWebhookUrl] = useState("");

  const [maxRules, setMaxRules] = useState(20);
  const [defaultPriority, setDefaultPriority] = useState("3");
  const [autoApproveThreshold, setAutoApproveThreshold] = useState(95);

  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      <PageHeader title={t("Settings")} description={t("Configure system-wide settings for the formula engine.")} />

      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle>{t("General Settings")}</CardTitle>
          <CardDescription>{t("Basic system configuration and defaults.")}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-900 dark:text-gray-100">{t("System Name")}</label>
            <Input value={systemName} onChange={(e) => setSystemName(e.target.value)} placeholder={t("System name")} />
          </div>

          <CurrencySelect value={defaultCurrency} onChange={setDefaultCurrency} label={t("Default Currency")} />

          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-sm font-medium text-gray-900 dark:text-gray-100">{t("Time Zone")}</label>
            <Select value={timeZone} onValueChange={setTimeZone}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONES.map((tz) => (
                  <SelectItem key={tz} value={tz}>
                    {tz}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle>{t("Notification Settings")}</CardTitle>
          <CardDescription>{t("Manage how the system sends alerts and notifications.")}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{t("Email Notifications")}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t("Receive email alerts for campaign status changes.")}
              </p>
            </div>
            <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{t("Slack Integration")}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t("Send notifications to a Slack channel.")}
                </p>
              </div>
              <Switch checked={slackIntegration} onCheckedChange={setSlackIntegration} />
            </div>

            {slackIntegration && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-900 dark:text-gray-100">{t("Webhook URL")}</label>
                <Input
                  value={slackWebhookUrl}
                  onChange={(e) => setSlackWebhookUrl(e.target.value)}
                  placeholder="https://hooks.slack.com/services/…"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Formula Engine Settings */}
      <Card>
        <CardHeader>
          <CardTitle>{t("Formula Engine Settings")}</CardTitle>
          <CardDescription>{t("Tune the behavior of the formula evaluation engine.")}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {t("Max Rules Per Campaign")}
            </label>
            <Input
              type="number"
              value={maxRules}
              onChange={(e) => setMaxRules(Number(e.target.value))}
              min={1}
              max={100}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-900 dark:text-gray-100">{t("Default Priority")}</label>
            <Select value={defaultPriority} onValueChange={setDefaultPriority}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRIORITIES.map((p) => (
                  <SelectItem key={p} value={p}>
                    {t("Priority")} {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {t("Auto-Approve Threshold (%)")}
            </label>
            <Input
              type="number"
              value={autoApproveThreshold}
              onChange={(e) => setAutoApproveThreshold(Number(e.target.value))}
              min={0}
              max={100}
              placeholder="95"
            />
          </div>
        </CardContent>
      </Card>

      {/* Save */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saved}
          style={{ backgroundColor: "#D32F2F" }}
          className="hover:opacity-90 text-white"
        >
          {saved ? (
            <>
              <Check className="mr-2 h-4 w-4" />
              {t("Saved")}
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              {t("Save Settings")}
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default SettingsPage;
