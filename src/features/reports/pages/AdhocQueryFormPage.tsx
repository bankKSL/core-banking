import { type FC, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { z } from "zod";
import { PageHeader } from "@/components/shared/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/shared/ErrorState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useAdhocQuery, useCreateAdhocQuery, useUpdateAdhocQuery } from "../hooks/useReports";

type AdhocQueryFormValues = z.infer<ReturnType<typeof getAdhocQueryFormSchema>>;

function getAdhocQueryFormSchema(t: (key: string) => string) {
  return z.object({
    name: z.string().min(1, t("Name is required")),
    query: z.string().min(1, t("Query is required")),
    tableName: z.string(),
    tableFields: z.string(),
    email: z.string(),
    isActive: z.boolean(),
  });
}

const AdhocQueryFormPage: FC = () => {
  const { t } = useTranslation();
  const adhocQueryFormSchema = getAdhocQueryFormSchema(t);
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;

  const { data: existingQuery, isLoading: isQueryLoading } = useAdhocQuery(id ? Number(id) : undefined);

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors },
  } = useForm<AdhocQueryFormValues>({
    resolver: zodResolver(adhocQueryFormSchema) as any,
    defaultValues: {
      name: "",
      query: "",
      tableName: "",
      tableFields: "",
      email: "",
      isActive: false,
    },
  });

  useEffect(() => {
    if (existingQuery) {
      reset({
        name: existingQuery.name ?? "",
        query: existingQuery.query ?? "",
        tableName: existingQuery.tableName ?? "",
        tableFields: existingQuery.tableFields ?? "",
        email: existingQuery.email ?? "",
        isActive: existingQuery.isActive ?? false,
      });
    }
  }, [existingQuery, reset]);

  const createMutation = useCreateAdhocQuery();
  const updateMutation = useUpdateAdhocQuery();
  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const isLoaded = !!existingQuery;

  const name = watch("name");
  const query = watch("query");
  const canSave = !isSubmitting && name.trim().length > 0 && query.trim().length > 0;

  const onSubmit = useCallback(
    async (formValues: AdhocQueryFormValues) => {
      const payload: Record<string, unknown> = {
        name: formValues.name,
        query: formValues.query,
        tableName: formValues.tableName,
        tableFields: formValues.tableFields,
        email: formValues.email,
        isActive: formValues.isActive,
      };

      if (isEdit) {
        await updateMutation.mutateAsync({ id: Number(id), payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      navigate("/adhoc-queries");
    },
    [isEdit, id, createMutation, updateMutation, navigate],
  );

  if (isQueryLoading) {
    return (
      <div className="p-6 max-w-6xl m-auto space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl m-auto space-y-6">
      <PageHeader
        title={isEdit ? t("Edit Adhoc Query") : t("New Adhoc Query")}
        description={t("Create or edit an adhoc query definition")}
        actions={
          <Button variant="outline" onClick={() => navigate("/adhoc-queries")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> {t("Back")}
          </Button>
        }
      />

      <form onSubmit={handleSubmit(onSubmit)}>
        {(createMutation.isError || updateMutation.isError) && (
          <div className="mb-6">
            <ErrorState
              title={t("Failed to save adhoc query")}
              message={
                createMutation.error instanceof Error
                  ? createMutation.error.message
                  : updateMutation.error instanceof Error
                    ? updateMutation.error.message
                    : t("An unexpected error occurred.")
              }
              onRetry={() => {
                createMutation.reset();
                updateMutation.reset();
              }}
            />
          </div>
        )}

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{t("Query Details")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Name")} *</label>
              <Input
                {...register("name")}
                placeholder={t("e.g. Active Loans Report")}
                disabled={isLoaded}
                error={errors.name?.message}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Query")} *</label>
              <Textarea
                {...register("query")}
                placeholder="SELECT ..."
                rows={6}
                disabled={isLoaded}
                error={errors.query?.message}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium">{t("Table Name")}</label>
                <Input {...register("tableName")} placeholder={t("e.g. m_loan")} disabled={isLoaded} />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium">{t("Table Fields")}</label>
                <Input {...register("tableFields")} placeholder={t("e.g. id, display_name")} disabled={isLoaded} />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Email")}</label>
              <Input type="email" {...register("email")} placeholder={t("recipient@example.com")} disabled={isLoaded} />
            </div>

            <div className="flex items-center gap-2">
              <Controller
                name="isActive"
                control={control}
                render={({ field }) => (
                  <Checkbox id="isActive" checked={field.value} onCheckedChange={field.onChange} disabled={isLoaded} />
                )}
              />
              <label className="block text-sm font-medium">{t("Active")}</label>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate("/adhoc-queries")}>
            {t("Cancel")}
          </Button>
          <Button type="submit" disabled={!canSave}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t("Saving…")}
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" /> {isEdit ? t("Update Query") : t("Create Query")}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AdhocQueryFormPage;
