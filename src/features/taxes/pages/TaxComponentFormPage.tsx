import { type FC, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/shared/PageHeader";
import { ErrorState } from "@/components/shared/ErrorState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useTaxComponent,
  useTaxComponentTemplate,
  useCreateTaxComponent,
  useUpdateTaxComponent,
} from "../hooks/useTaxes";
import { parseDate } from "../api/taxes";

function formatDateInput(dateVal: number[] | null | undefined): string {
  const d = parseDate(dateVal);
  if (!d) return "";
  return d.toISOString().split("T")[0];
}

type TaxComponentFormValues = z.input<ReturnType<typeof getTaxComponentFormSchema>>;

function getTaxComponentFormSchema(t: (key: string) => string) {
  return z.object({
    name: z.string().min(1, t("Name is required")),
    percentage: z.string().min(1, t("Percentage is required")),
    startDate: z.string().optional().default(""),
    debitAccountType: z.number().nullable().default(null),
    debitAccountId: z.number().nullable().default(null),
    creditAccountType: z.number().nullable().default(null),
    creditAccountId: z.number().nullable().default(null),
  });
}

const TaxComponentFormPage: FC = () => {
  const { t } = useTranslation();
  const taxComponentFormSchema = getTaxComponentFormSchema(t);
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;

  const { data: template, isLoading: templateLoading } = useTaxComponentTemplate();
  const { data: existingComponent, isLoading: componentLoading } = useTaxComponent(id ? Number(id) : undefined);

  const createMutation = useCreateTaxComponent();
  const updateMutation = useUpdateTaxComponent();

  const {
    control,
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<TaxComponentFormValues>({
    resolver: zodResolver(taxComponentFormSchema) as any,
    defaultValues: {
      name: "",
      percentage: "",
      startDate: "",
      debitAccountType: null,
      debitAccountId: null,
      creditAccountType: null,
      creditAccountId: null,
    },
  });

  const glAccountTypeOptions = useMemo(() => template?.glAccountTypeOptions ?? [], [template]);
  const glAccountOptions = useMemo(
    () => (Array.isArray(template?.glAccountOptions) ? template!.glAccountOptions : []),
    [template],
  );

  const debitAccountType = useMemo(
    () => glAccountTypeOptions.find((o) => o.id === (existingComponent?.debitAccountType?.id ?? null)),
    [glAccountTypeOptions, existingComponent],
  );

  const creditAccountType = useMemo(
    () => glAccountTypeOptions.find((o) => o.id === (existingComponent?.creditAccountType?.id ?? null)),
    [glAccountTypeOptions, existingComponent],
  );

  useEffect(() => {
    if (!existingComponent) return;
    reset({
      name: existingComponent.name,
      percentage: String(existingComponent.percentage),
      startDate: formatDateInput(
        existingComponent.startDate
          ? (existingComponent.startDate.split("-").map(Number) as unknown as number[])
          : null,
      ),
      debitAccountType: existingComponent.debitAccountType?.id ?? null,
      debitAccountId: existingComponent.debitAccount?.id ?? null,
      creditAccountType: existingComponent.creditAccountType?.id ?? null,
      creditAccountId: existingComponent.creditAccount?.id ?? null,
    });
  }, [existingComponent, reset]);

  const onSubmit = useCallback(
    async (values: TaxComponentFormValues) => {
      const payload: Record<string, unknown> = {
        name: values.name,
        percentage: Number(values.percentage),
        dateFormat: "dd MMMM yyyy",
        locale: "en",
      };

      if (values.startDate) {
        payload.startDate = values.startDate;
      }

      if (!isEdit) {
        if (values.debitAccountType) payload.debitAccountType = values.debitAccountType;
        if (values.debitAccountId) payload.debitAccountId = values.debitAccountId;
        if (values.creditAccountType) payload.creditAccountType = values.creditAccountType;
        if (values.creditAccountId) payload.creditAccountId = values.creditAccountId;
      }

      if (isEdit) {
        await updateMutation.mutateAsync({ id: Number(id), payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      navigate("/taxes/components");
    },
    [isEdit, id, createMutation, updateMutation, navigate],
  );

  const isLoading = templateLoading || (isEdit && componentLoading);

  if (isLoading) {
    return (
      <div className="p-6 max-w-4xl m-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
        <Card>
          <CardContent className="space-y-4 py-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  const saveError = createMutation.error ?? updateMutation.error;

  return (
    <div className="p-6 max-w-4xl m-auto space-y-6">
      <PageHeader
        title={isEdit ? t("Edit Tax Component") : t("New Tax Component")}
        actions={
          <Button variant="outline" onClick={() => navigate("/taxes/components")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> {t("Back")}
          </Button>
        }
      />

      {(createMutation.isError || updateMutation.isError) && (
        <ErrorState
          title={t("Failed to save tax component")}
          message={saveError instanceof Error ? saveError.message : t("An unexpected error occurred.")}
          onRetry={() => {
            createMutation.reset();
            updateMutation.reset();
          }}
        />
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{t("Basic Information")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Name")} *</label>
              <Input {...register("name")} placeholder="e.g. VAT" error={errors.name?.message} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium">{t("Percentage")} *</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  {...register("percentage")}
                  placeholder="e.g. 16"
                  error={errors.percentage?.message}
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium">{t("Start Date")}</label>
                <Input type="date" {...register("startDate")} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{t("GL Account Mapping (Optional)")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium">{t("Debit Account Type")}</label>
                <Controller
                  name="debitAccountType"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value != null ? String(field.value) : ""}
                      onValueChange={(v) => field.onChange(v ? Number(v) : null)}
                      disabled={isEdit}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t("Select")} />
                      </SelectTrigger>
                      <SelectContent>
                        {glAccountTypeOptions.map((o) => (
                          <SelectItem key={o.id} value={String(o.id)}>
                            {o.value}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div>
                <label className="block text-sm font-medium">{t("Debit Account")}</label>
                <Controller
                  name="debitAccountId"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value != null ? String(field.value) : ""}
                      onValueChange={(v) => field.onChange(v ? Number(v) : null)}
                      disabled={isEdit}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t("Select")} />
                      </SelectTrigger>
                      <SelectContent>
                        {glAccountOptions.map((a) => (
                          <SelectItem key={a.id} value={String(a.id)}>
                            {a.name} ({a.glCode})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium">{t("Credit Account Type")}</label>
                <Controller
                  name="creditAccountType"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value != null ? String(field.value) : ""}
                      onValueChange={(v) => field.onChange(v ? Number(v) : null)}
                      disabled={isEdit}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t("Select")} />
                      </SelectTrigger>
                      <SelectContent>
                        {glAccountTypeOptions.map((o) => (
                          <SelectItem key={o.id} value={String(o.id)}>
                            {o.value}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div>
                <label className="block text-sm font-medium">{t("Credit Account")}</label>
                <Controller
                  name="creditAccountId"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value != null ? String(field.value) : ""}
                      onValueChange={(v) => field.onChange(v ? Number(v) : null)}
                      disabled={isEdit}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t("Select")} />
                      </SelectTrigger>
                      <SelectContent>
                        {glAccountOptions.map((a) => (
                          <SelectItem key={a.id} value={String(a.id)}>
                            {a.name} ({a.glCode})
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

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate("/taxes/components")}>
            {t("Cancel")}
          </Button>
          <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
            {createMutation.isPending || updateMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t("Saving…")}
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" /> {isEdit ? t("Update Component") : t("Create Component")}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default TaxComponentFormPage;
