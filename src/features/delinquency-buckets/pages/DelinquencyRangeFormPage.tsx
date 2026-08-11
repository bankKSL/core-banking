import { type FC, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Save, Loader2, CalendarRange } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  createDelinquencyRangeSchema,
  type CreateDelinquencyRangeFormValues,
} from "../schemas/delinquencyRange.schema";
import {
  useDelinquencyRange,
  useCreateDelinquencyRange,
  useUpdateDelinquencyRange,
} from "../hooks/useDelinquencyRanges";
import type { DelinquencyRangeCreateRequest } from "../types/delinquencyRange";

const DelinquencyRangeFormPage: FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const { data: range, isLoading: rangeLoading } = useDelinquencyRange(id ? Number(id) : undefined);
  const createMutation = useCreateDelinquencyRange();
  const updateMutation = useUpdateDelinquencyRange();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateDelinquencyRangeFormValues>({
    resolver: zodResolver(createDelinquencyRangeSchema),
    defaultValues: {
      classification: "",
      minimumAgeDays: 0,
      maximumAgeDays: null,
    },
  });

  useEffect(() => {
    if (!range) return;
    reset({
      classification: range.classification,
      minimumAgeDays: range.minimumAgeDays,
      maximumAgeDays: range.maximumAgeDays,
    });
  }, [range, reset]);

  const onSubmit = async (values: CreateDelinquencyRangeFormValues) => {
    const payload: DelinquencyRangeCreateRequest = {
      classification: values.classification,
      minimumAgeDays: values.minimumAgeDays,
      maximumAgeDays: values.maximumAgeDays ?? null,
      locale: "en",
    };

    if (isEdit) {
      await updateMutation.mutateAsync({ id: Number(id), payload });
    } else {
      await createMutation.mutateAsync(payload);
    }
    navigate("/delinquency-ranges");
  };

  if (isEdit && rangeLoading) {
    return (
      <div className="p-6 max-w-6xl m-auto">
        <Skeleton className="h-10 w-48 mb-6" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl m-auto space-y-6">
      <PageHeader
        title={isEdit ? t("Edit Delinquency Range") : t("Create Delinquency Range")}
        description={
          isEdit ? t('Editing "{{name}}"', { name: range?.classification }) : t("Define a new delinquency range")
        }
        actions={
          <Button variant="outline" onClick={() => navigate("/delinquency-ranges")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("Back")}
          </Button>
        }
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarRange className="h-5 w-5" />
              {t("Range Details")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Classification")} *</label>
              <Input
                {...register("classification")}
                placeholder={t("e.g. 0-30 days")}
                error={errors.classification?.message}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium">{t("Minimum Age (Days)")} *</label>
                <Input
                  type="number"
                  {...register("minimumAgeDays", { valueAsNumber: true })}
                  placeholder={t("e.g. 0")}
                  error={errors.minimumAgeDays?.message}
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium">{t("Maximum Age (Days)")}</label>
                <Input
                  type="number"
                  {...register("maximumAgeDays", { valueAsNumber: true })}
                  placeholder={t("Leave empty for open-ended")}
                  error={errors.maximumAgeDays?.message}
                />
              </div>
            </div>
          </CardContent>
        </Card>
        <div className="flex justify-end gap-3">
          <Button variant="outline" type="button" onClick={() => navigate("/delinquency-ranges")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("Cancel")}
          </Button>
          <Button type="submit" disabled={isSubmitting} className="bg-[#D32F2F] hover:bg-red-700">
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" />
            {isEdit ? t("Save Changes") : t("Create Range")}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default DelinquencyRangeFormPage;
