import { type FC, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Save, Loader2, Layers } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { delinquencyBucketSchema, type DelinquencyBucketFormValues } from "../schemas/delinquencyBucket.schema";
import {
  useDelinquencyBucket,
  useDelinquencyBucketTemplate,
  useCreateDelinquencyBucket,
  useUpdateDelinquencyBucket,
} from "../hooks/useDelinquencyBuckets";
import type { DelinquencyBucketCreateRequest } from "../types/delinquencyBucket";

const DelinquencyBucketFormPage: FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const { data: bucket, isLoading: bucketLoading } = useDelinquencyBucket(id ? Number(id) : undefined);
  const { data: template, isLoading: templateLoading } = useDelinquencyBucketTemplate();
  const createMutation = useCreateDelinquencyBucket();
  const updateMutation = useUpdateDelinquencyBucket();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<DelinquencyBucketFormValues>({
    resolver: zodResolver(delinquencyBucketSchema),
    defaultValues: {
      name: "",
      ranges: [],
      bucketType: "REGULAR",
      minimumPaymentPeriodAndRule: null,
    },
  });

  const selectedBucketType = watch("bucketType");
  const showMinPaymentRule = selectedBucketType === "WORKING_CAPITAL";

  useEffect(() => {
    if (!bucket) return;
    reset({
      name: bucket.name,
      ranges: bucket.ranges.map((r) => r.id),
      bucketType: bucket.bucketType.id,
      minimumPaymentPeriodAndRule: bucket.minimumPaymentPeriodAndRule
        ? {
            frequency: bucket.minimumPaymentPeriodAndRule.frequency,
            frequencyType: bucket.minimumPaymentPeriodAndRule.frequencyType.id,
            minimumPayment: bucket.minimumPaymentPeriodAndRule.minimumPayment,
            minimumPaymentType: bucket.minimumPaymentPeriodAndRule.minimumPaymentType.id,
          }
        : null,
    });
  }, [bucket, reset]);

  const onSubmit = async (values: DelinquencyBucketFormValues) => {
    const payload: DelinquencyBucketCreateRequest = {
      name: values.name,
      ranges: values.ranges,
      bucketType: values.bucketType,
    };

    if (values.bucketType === "WORKING_CAPITAL" && values.minimumPaymentPeriodAndRule) {
      payload.minimumPaymentPeriodAndRule = {
        frequency: values.minimumPaymentPeriodAndRule.frequency,
        frequencyType: values.minimumPaymentPeriodAndRule.frequencyType,
        minimumPayment: values.minimumPaymentPeriodAndRule.minimumPayment,
        minimumPaymentType: values.minimumPaymentPeriodAndRule.minimumPaymentType,
      };
    }

    if (isEdit) {
      await updateMutation.mutateAsync({ id: Number(id), payload });
    } else {
      await createMutation.mutateAsync(payload);
    }
    navigate("/delinquency-buckets");
  };

  if ((isEdit && bucketLoading) || templateLoading) {
    return (
      <div className="p-6 max-w-6xl m-auto">
        <Skeleton className="h-10 w-48 mb-6" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl m-auto space-y-6">
      <PageHeader
        title={isEdit ? t("Edit Delinquency Bucket") : t("Create Delinquency Bucket")}
        description={isEdit ? t('Editing "{{name}}"', { name: bucket?.name }) : t("Define a new delinquency bucket")}
        actions={
          <Button variant="outline" onClick={() => navigate("/delinquency-buckets")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("Back")}
          </Button>
        }
      />
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Layers className="h-5 w-5" />
              {t("Bucket Details")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium">{t("Name")} *</label>
                <Input {...register("name")} placeholder={t("e.g. Standard Bucket")} error={errors.name?.message} />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium">{t("Bucket Type")} *</label>
                <Controller
                  name="bucketType"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className={errors.bucketType?.message ? "border-red-500" : ""}>
                        <SelectValue placeholder={t("Select bucket type")} />
                      </SelectTrigger>
                      {errors.bucketType?.message && (
                        <p className="text-sm text-red-500">{errors.bucketType.message}</p>
                      )}
                      <SelectContent>
                        {template?.bucketTypeOptions.map((opt) => (
                          <SelectItem key={opt.id} value={opt.id}>
                            {opt.value}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Delinquency Ranges")} *</label>
              {errors.ranges?.message && <p className="text-sm text-red-500">{errors.ranges.message}</p>}
              <div className="border border-gray-200 rounded-lg p-4 max-h-60 overflow-y-auto space-y-2 dark:border-gray-700">
                {template?.rangesOptions.length === 0 && (
                  <p className="text-sm text-gray-500">{t("No ranges available.")}</p>
                )}
                {template?.rangesOptions.map((range) => {
                  const isSelected = watch("ranges")?.includes(range.id) ?? false;
                  return (
                    <div
                      key={range.id}
                      className="flex items-center justify-between rounded-md px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => {
                            const current = watch("ranges") ?? [];
                            if (checked) {
                              setValue("ranges", [...current, range.id], { shouldValidate: true });
                            } else {
                              setValue(
                                "ranges",
                                current.filter((id) => id !== range.id),
                                { shouldValidate: true },
                              );
                            }
                          }}
                        />
                        <div>
                          <span className="text-sm font-medium">{range.classification}</span>
                          <span className="ml-2 text-xs text-gray-500">
                            ({range.minimumAgeDays}–{range.maximumAgeDays} {t("days")})
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {showMinPaymentRule && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("Minimum Payment Rule")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium">{t("Frequency")} *</label>
                  <Input
                    type="number"
                    {...register("minimumPaymentPeriodAndRule.frequency", { valueAsNumber: true })}
                    placeholder={t("e.g. 5")}
                    error={errors.minimumPaymentPeriodAndRule?.frequency?.message}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium">{t("Frequency Type")} *</label>
                  <Controller
                    name="minimumPaymentPeriodAndRule.frequencyType"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger
                          className={errors.minimumPaymentPeriodAndRule?.frequencyType?.message ? "border-red-500" : ""}
                        >
                          <SelectValue placeholder={t("Select frequency type")} />
                        </SelectTrigger>
                        {errors.minimumPaymentPeriodAndRule?.frequencyType?.message && (
                          <p className="text-sm text-red-500">
                            {errors.minimumPaymentPeriodAndRule.frequencyType.message}
                          </p>
                        )}
                        <SelectContent>
                          {template?.frequencyTypeOptions.map((opt) => (
                            <SelectItem key={opt.id} value={opt.id}>
                              {opt.value}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium">{t("Minimum Payment")} *</label>
                  <Input
                    type="number"
                    step="0.01"
                    {...register("minimumPaymentPeriodAndRule.minimumPayment", { valueAsNumber: true })}
                    placeholder={t("e.g. 100.00")}
                    error={errors.minimumPaymentPeriodAndRule?.minimumPayment?.message}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium">{t("Minimum Payment Type")} *</label>
                  <Controller
                    name="minimumPaymentPeriodAndRule.minimumPaymentType"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger
                          className={
                            errors.minimumPaymentPeriodAndRule?.minimumPaymentType?.message ? "border-red-500" : ""
                          }
                        >
                          <SelectValue placeholder={t("Select payment type")} />
                        </SelectTrigger>
                        {errors.minimumPaymentPeriodAndRule?.minimumPaymentType?.message && (
                          <p className="text-sm text-red-500">
                            {errors.minimumPaymentPeriodAndRule.minimumPaymentType.message}
                          </p>
                        )}
                        <SelectContent>
                          {template?.minimumPaymentOptions.map((opt) => (
                            <SelectItem key={opt.id} value={opt.id}>
                              {opt.value}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end gap-3">
          <Button variant="outline" type="button" onClick={() => navigate("/delinquency-buckets")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("Cancel")}
          </Button>
          <Button type="submit" disabled={isSubmitting} className="bg-[#D32F2F] hover:bg-red-700">
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" />
            {isEdit ? t("Save Changes") : t("Create Bucket")}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default DelinquencyBucketFormPage;
