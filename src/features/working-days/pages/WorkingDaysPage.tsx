import React, { useState, useEffect, useCallback } from "react";
import { Save, Loader2, ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ErrorState } from "@/components/shared/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useWorkingDaysConfig, useWorkingDaysTemplate, useUpdateWorkingDays } from "../hooks/useWorkingDays";

const DAYS = [
  { value: "MO", label: "Monday" },
  { value: "TU", label: "Tuesday" },
  { value: "WE", label: "Wednesday" },
  { value: "TH", label: "Thursday" },
  { value: "FR", label: "Friday" },
  { value: "SA", label: "Saturday" },
  { value: "SU", label: "Sunday" },
] as const;

function parseRruleDays(recurrence: string): Set<string> {
  const byDayMatch = recurrence.match(/BYDAY=([A-Z,]+)/);
  if (!byDayMatch) return new Set();
  return new Set(byDayMatch[1].split(","));
}

function buildRrule(selectedDays: Set<string>): string {
  const days = DAYS.map((d) => d.value).filter((d) => selectedDays.has(d));
  if (days.length === 0) return "";
  return `FREQ=WEEKLY;BYDAY=${days.join(",")}`;
}

const WorkingDaysPage: React.FC = () => {
  const { data: config, isLoading: isConfigLoading, isError: isConfigError, refetch: refetchConfig } = useWorkingDaysConfig();
  const { data: template, isLoading: isTemplateLoading } = useWorkingDaysTemplate();
  const updateMutation = useUpdateWorkingDays();

  const [selectedDays, setSelectedDays] = useState<Set<string>>(new Set());
  const [rescheduleTypeId, setRescheduleTypeId] = useState<number | null>(null);
  const [extendTermDaily, setExtendTermDaily] = useState(false);
  const [extendTermHolidays, setExtendTermHolidays] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);

  useEffect(() => {
    if (!config) return;
    setSelectedDays(parseRruleDays(config.recurrence));
    setRescheduleTypeId(config.repaymentRescheduleType?.id ?? null);
    setExtendTermDaily(config.extendTermForDailyRepayments);
    setExtendTermHolidays(config.extendTermForRepaymentsOnHolidays);
  }, [config]);

  const toggleDay = useCallback((day: string) => {
    setSelectedDays((prev) => {
      const next = new Set(prev);
      if (next.has(day)) {
        next.delete(day);
      } else {
        next.add(day);
      }
      return next;
    });
  }, []);

  const handleSave = useCallback(async () => {
    if (rescheduleTypeId == null) return;
    setMutationError(null);
    try {
      await updateMutation.mutateAsync({
        recurrence: buildRrule(selectedDays),
        repaymentRescheduleType: rescheduleTypeId,
        extendTermForDailyRepayments: extendTermDaily,
        extendTermForRepaymentsOnHolidays: extendTermHolidays,
      });
    } catch (err: unknown) {
      const error = err as { response?: { data?: { errors?: Array<{ defaultUserMessage: string }> } } };
      const msg =
        error?.response?.data?.errors?.[0]?.defaultUserMessage ?? "Failed to update working days configuration.";
      setMutationError(msg);
    }
  }, [selectedDays, rescheduleTypeId, extendTermDaily, extendTermHolidays, updateMutation]);

  const isLoading = isConfigLoading || isTemplateLoading;
  const isSaving = updateMutation.isPending;

  if (isConfigError) {
    return (
      <div className="p-6 max-w-3xl m-auto space-y-6">
        <PageHeader title="Working Days" description="Configure business working days and repayment rescheduling" />
        <ErrorState message="Failed to load working days configuration" onRetry={() => refetchConfig()} />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl m-auto space-y-6">
      <PageHeader
        title="Working Days"
        description="Configure business working days and repayment rescheduling"
      />

      {mutationError && (
        <div className="mb-6">
          <ErrorState message={mutationError} />
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Working Days</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-4 w-48" />
              <div className="flex flex-wrap gap-3">
                {Array.from({ length: 7 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-24" />
                ))}
              </div>
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-8 w-64" />
            </div>
          ) : (
            <>
              <div>
                <Label className="mb-3 block">Select Working Days</Label>
                <div className="flex flex-wrap gap-3">
                  {DAYS.map((day) => (
                    <Checkbox
                      key={day.value}
                      id={`day-${day.value}`}
                      label={day.label}
                      checked={selectedDays.has(day.value)}
                      onCheckedChange={() => toggleDay(day.value)}
                    />
                  ))}
                </div>
              </div>

              <Separator />

              <div>
                <Label htmlFor="reschedule-type">Repayment Reschedule Type</Label>
                <Select
                  value={rescheduleTypeId != null ? String(rescheduleTypeId) : ""}
                  onValueChange={(v) => setRescheduleTypeId(Number(v))}
                >
                  <SelectTrigger id="reschedule-type" className="mt-1">
                    <SelectValue placeholder="Select reschedule type" />
                  </SelectTrigger>
                  <SelectContent>
                    {(template?.repaymentRescheduleOptions ?? []).map((opt) => (
                      <SelectItem key={opt.id} value={String(opt.id)}>
                        {opt.value ?? opt.code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="space-y-4">
                <Checkbox
                  id="extend-daily"
                  label="Extend term for daily repayments"
                  checked={extendTermDaily}
                  onCheckedChange={(checked) => setExtendTermDaily(checked === true)}
                />
                <Checkbox
                  id="extend-holidays"
                  label="Extend term for repayments on holidays"
                  checked={extendTermHolidays}
                  onCheckedChange={(checked) => setExtendTermHolidays(checked === true)}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {!isLoading && (
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => refetchConfig()}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Reset
          </Button>
          <Button onClick={handleSave} disabled={isSaving || selectedDays.size === 0 || rescheduleTypeId == null}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" /> Save Configuration
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

export default WorkingDaysPage;
