import { type FC, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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

function buildRrule(selectedDays: string[]): string {
  const days = DAYS.map((d) => d.value).filter((d) => selectedDays.includes(d));
  if (days.length === 0) return "";
  return `FREQ=WEEKLY;BYDAY=${days.join(",")}`;
}

const workingDaysSchema = z.object({
  selectedDays: z.array(z.string()).min(1, "Select at least one working day"),
  rescheduleTypeId: z.number({ message: "Repayment reschedule type is required" }),
  extendTermDaily: z.boolean(),
  extendTermHolidays: z.boolean(),
});

type WorkingDaysFormValues = z.infer<typeof workingDaysSchema>;

const WorkingDaysPage: FC = () => {
  const { t } = useTranslation();
  const {
    data: config,
    isLoading: isConfigLoading,
    isError: isConfigError,
    refetch: refetchConfig,
  } = useWorkingDaysConfig();
  const { data: template, isLoading: isTemplateLoading } = useWorkingDaysTemplate();
  const updateMutation = useUpdateWorkingDays();

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    getValues,
    reset,
    formState: { errors },
  } = useForm<WorkingDaysFormValues>({
    resolver: zodResolver(workingDaysSchema),
    defaultValues: {
      selectedDays: [],
      rescheduleTypeId: undefined,
      extendTermDaily: false,
      extendTermHolidays: false,
    },
  });

  useEffect(() => {
    if (!config) return;
    reset({
      selectedDays: Array.from(parseRruleDays(config.recurrence)),
      rescheduleTypeId: config.repaymentRescheduleType?.id ?? undefined,
      extendTermDaily: config.extendTermForDailyRepayments,
      extendTermHolidays: config.extendTermForRepaymentsOnHolidays,
    });
  }, [config, reset]);

  const selectedDays = watch("selectedDays");

  const toggleDay = useCallback(
    (day: string) => {
      const current = getValues("selectedDays");
      if (current.includes(day)) {
        setValue(
          "selectedDays",
          current.filter((d) => d !== day),
          { shouldValidate: true },
        );
      } else {
        setValue("selectedDays", [...current, day], { shouldValidate: true });
      }
    },
    [getValues, setValue],
  );

  const isLoading = isConfigLoading || isTemplateLoading;
  const isSaving = updateMutation.isPending;

  const onSubmit = useCallback(
    async (values: WorkingDaysFormValues) => {
      await updateMutation.mutateAsync({
        recurrence: buildRrule(values.selectedDays),
        repaymentRescheduleType: values.rescheduleTypeId,
        extendTermForDailyRepayments: values.extendTermDaily,
        extendTermForRepaymentsOnHolidays: values.extendTermHolidays,
      });
    },
    [updateMutation],
  );

  if (isConfigError) {
    return (
      <div className="p-6 max-w-4xl m-auto space-y-6">
        <PageHeader title={t("Working Days")} description={t("Configure business working days and repayment rescheduling")} />
        <ErrorState message={t("Failed to load working days configuration")} onRetry={() => refetchConfig()} />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl m-auto space-y-6">
      <PageHeader title={t("Working Days")} description={t("Configure business working days and repayment rescheduling")} />

      {updateMutation.isError && (
        <ErrorState
          title={t("Failed to update working days")}
          message={
            updateMutation.error instanceof Error ? updateMutation.error.message : t("An unexpected error occurred.")
          }
          onRetry={() => updateMutation.reset()}
        />
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("Working Days")}</CardTitle>
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
                  <Label className="mb-3 block">{t("Select Working Days")}</Label>
                  <div className="flex flex-wrap gap-3">
                    {DAYS.map((day) => (
                      <Checkbox
                        key={day.value}
                        id={`day-${day.value}`}
                        label={day.label}
                        checked={selectedDays.includes(day.value)}
                        onCheckedChange={() => toggleDay(day.value)}
                      />
                    ))}
                  </div>
                  {errors.selectedDays && <p className="text-xs text-red-500 mt-2">{errors.selectedDays.message}</p>}
                </div>

                <Separator />

                <div>
                  <Label htmlFor="reschedule-type">{t("Repayment Reschedule Type")}</Label>
                  <Controller
                    name="rescheduleTypeId"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value ? String(field.value) : ""}
                        onValueChange={(v) => field.onChange(Number(v))}
                      >
                        <SelectTrigger id="reschedule-type" className="mt-1">
                          <SelectValue placeholder={t("Select reschedule type")} />
                        </SelectTrigger>
                        <SelectContent>
                          {(template?.repaymentRescheduleOptions ?? []).map((opt) => (
                            <SelectItem key={opt.id} value={String(opt.id)}>
                              {opt.value ?? opt.code}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.rescheduleTypeId && (
                    <p className="text-xs text-red-500 mt-1">{errors.rescheduleTypeId.message}</p>
                  )}
                </div>

                <Separator />

                <div className="space-y-4">
                  <Controller
                    name="extendTermDaily"
                    control={control}
                    render={({ field }) => (
                      <Checkbox
                        id="extend-daily"
                        label={t("Extend term for daily repayments")}
                        checked={field.value}
                        onCheckedChange={(checked) => field.onChange(checked === true)}
                      />
                    )}
                  />
                  <Controller
                    name="extendTermHolidays"
                    control={control}
                    render={({ field }) => (
                      <Checkbox
                        id="extend-holidays"
                        label={t("Extend term for repayments on holidays")}
                        checked={field.value}
                        onCheckedChange={(checked) => field.onChange(checked === true)}
                      />
                    )}
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {!isLoading && (
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => refetchConfig()}>
              <ArrowLeft className="mr-2 h-4 w-4" /> {t("Reset")}
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t("Saving…")}
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" /> {t("Save Configuration")}
                </>
              )}
            </Button>
          </div>
        )}
      </form>
    </div>
  );
};

export default WorkingDaysPage;
