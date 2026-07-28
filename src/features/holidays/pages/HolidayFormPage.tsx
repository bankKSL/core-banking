import { type FC, useCallback, useMemo, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Save, Loader2, Calendar } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ErrorState } from "@/components/shared/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";
import { useOffices } from "@/hooks/useOffices";
import {
  useHoliday,
  useHolidayTemplate,
  useCreateHoliday,
  useUpdateHoliday,
} from "../hooks/useHolidays";
import { parseFineractDate } from "../api/holidays";
import type { EnumOption } from "../types/holiday.types";

function formatDateInput(dateVal: number[] | null | undefined): string {
  const d = parseFineractDate(dateVal);
  if (!d) return "";
  return d.toISOString().split("T")[0];
}

const holidayFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional().default(""),
  fromDate: z.string().min(1, "From date is required"),
  toDate: z.string().min(1, "To date is required"),
  reschedulingType: z.number().nullable().default(null),
  repaymentsRescheduledTo: z.string().optional().default(""),
  selectedOfficeIds: z.array(z.number()).min(1, "At least one office must be selected"),
});

type HolidayFormValues = z.input<typeof holidayFormSchema>;

const HolidayFormPage: FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;

  const { data: template, isLoading: isTemplateLoading } = useHolidayTemplate();
  const { data: existingHoliday, isLoading: isHolidayLoading } = useHoliday(
    id ? Number(id) : undefined,
  );
  const { data: offices = [], isLoading: officesLoading } = useOffices();

  const createMutation = useCreateHoliday();
  const updateMutation = useUpdateHoliday();
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<HolidayFormValues>({
    resolver: zodResolver(holidayFormSchema),
    defaultValues: {
      name: "",
      description: "",
      fromDate: "",
      toDate: "",
      reschedulingType: null,
      repaymentsRescheduledTo: "",
      selectedOfficeIds: [],
    },
  });

  useEffect(() => {
    if (existingHoliday) {
      setValue("name", existingHoliday.name);
      setValue("description", existingHoliday.description ?? "");
      setValue("fromDate", formatDateInput(existingHoliday.fromDate));
      setValue("toDate", formatDateInput(existingHoliday.toDate));
      setValue("reschedulingType", existingHoliday.reschedulingType?.id ?? null);
      setValue("repaymentsRescheduledTo", formatDateInput(existingHoliday.repaymentsRescheduledTo));
      setValue("selectedOfficeIds", existingHoliday.offices?.map((o) => o.id) ?? []);
    }
  }, [existingHoliday, setValue]);

  const reschedulingTypeOptions: EnumOption[] = useMemo(
    () => template?.reschedulingTypeOptions ?? [],
    [template],
  );

  const reschedulingType = watch("reschedulingType");

  const selectedReschedulingTypeOption = useMemo(
    () => reschedulingTypeOptions.find((o) => o.id === reschedulingType),
    [reschedulingTypeOptions, reschedulingType],
  );

  const isSpecificDate = useMemo(() => {
    if (!selectedReschedulingTypeOption) return false;
    const val = (
      selectedReschedulingTypeOption.value ?? selectedReschedulingTypeOption.code ?? ""
    ).toLowerCase();
    return val.includes("specific") || val.includes("date");
  }, [selectedReschedulingTypeOption]);

  const onSubmit = useCallback(
    async (values: HolidayFormValues) => {
      const payload: Record<string, unknown> = {
        name: values.name,
        description: values.description || undefined,
        fromDate: values.fromDate,
        toDate: values.toDate,
        reschedulingType: values.reschedulingType,
        offices: values.selectedOfficeIds,
      };

      if (isSpecificDate && values.repaymentsRescheduledTo) {
        payload.repaymentsRescheduledTo = values.repaymentsRescheduledTo;
      }

      if (isEdit) {
        await updateMutation.mutateAsync({ id: Number(id), values: payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      navigate("/holidays");
    },
    [isSpecificDate, isEdit, id, createMutation, updateMutation, navigate],
  );

  const isLoading = isTemplateLoading || isHolidayLoading || officesLoading;

  if (isLoading) {
    return (
      <div className="p-6 max-w-5xl m-auto space-y-6">
        <Skeleton className="h-8 w-64" variant="text" />
        <Skeleton className="h-4 w-96" variant="text" />
        <Card>
          <CardContent className="space-y-4 py-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  const saveError = createMutation.isError ? createMutation.error : updateMutation.error;

  return (
    <div className="p-6 max-w-5xl m-auto space-y-6">
      <PageHeader
        title={isEdit ? "Edit Holiday" : "New Holiday"}
        description="Create or edit a bank holiday"
        actions={
          <Button variant="outline" onClick={() => navigate("/holidays")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
        }
      />

      {(createMutation.isError || updateMutation.isError) && (
        <ErrorState
          title="Failed to save holiday"
          message={saveError instanceof Error ? saveError.message : "An unexpected error occurred."}
          onRetry={() => {
            createMutation.reset();
            updateMutation.reset();
          }}
        />
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Holiday Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">Name *</label>
              <Input
                {...register("name")}
                placeholder="e.g. New Year's Day"
                error={errors.name?.message}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium">Description</label>
              <Textarea
                {...register("description")}
                placeholder="Optional description"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium">From Date *</label>
                <Input
                  type="date"
                  {...register("fromDate")}
                  error={errors.fromDate?.message}
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium">To Date *</label>
                <Input
                  type="date"
                  {...register("toDate")}
                  error={errors.toDate?.message}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium">Rescheduling Type *</label>
              <Controller
                name="reschedulingType"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value != null ? String(field.value) : ""}
                    onValueChange={(v) => field.onChange(v ? Number(v) : null)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select rescheduling type" />
                    </SelectTrigger>
                    <SelectContent>
                      {reschedulingTypeOptions.map((opt) => (
                        <SelectItem key={opt.id} value={String(opt.id)}>
                          {opt.value ?? opt.code ?? String(opt.id)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.reschedulingType && <p className="text-xs text-red-500">{errors.reschedulingType.message}</p>}
            </div>

            {isSpecificDate && (
              <div className="space-y-1.5">
                <label className="block text-sm font-medium">
                  Repayments Rescheduled To
                </label>
                <Input
                  type="date"
                  {...register("repaymentsRescheduledTo")}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium">Offices *</label>
              <Controller
                name="selectedOfficeIds"
                control={control}
                render={({ field }) => (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mt-1 max-h-60 overflow-y-auto border rounded-md p-3">
                      {offices.map((office) => {
                        const checked = field.value.includes(office.id);
                        return (
                          <div key={office.id} className="flex items-center gap-2">
                            <Checkbox
                              id={`office-${office.id}`}
                              checked={checked}
                              onCheckedChange={() => {
                                if (checked) {
                                  field.onChange(field.value.filter((oid) => oid !== office.id));
                                } else {
                                  field.onChange([...field.value, office.id]);
                                }
                              }}
                            />
                            <label
                              htmlFor={`office-${office.id}`}
                              className="text-sm font-medium leading-none cursor-pointer"
                            >
                              {office.name}
                            </label>
                          </div>
                        );
                      })}
                      {offices.length === 0 && (
                        <p className="text-sm text-gray-500 col-span-full">
                          No offices available.
                        </p>
                      )}
                    </div>
                    {errors.selectedOfficeIds && (
                      <p className="text-xs text-red-500">{errors.selectedOfficeIds.message}</p>
                    )}
                  </>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate("/holidays")}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />{" "}
                {isEdit ? "Update Holiday" : "Create Holiday"}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default HolidayFormPage;
