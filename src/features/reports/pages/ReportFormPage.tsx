import { type FC, useCallback, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2, Plus, X, Save } from "lucide-react";
import { z } from "zod";
import { PageHeader } from "@/components/shared/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/shared/ErrorState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useReport, useReportTemplate, useCreateReport, useUpdateReport } from "../hooks/useReports";

const reportFormSchema = z.object({
  reportName: z.string().min(1, "Report name is required"),
  reportType: z.string(),
  reportSubType: z.string(),
  reportCategory: z.string(),
  description: z.string(),
  reportSql: z.string(),
  useReport: z.boolean(),
  parameters: z.array(
    z.object({
      parameterName: z.string(),
      parameterType: z.string(),
      selectOne: z.boolean(),
      reportParameterName: z.string(),
    }),
  ),
});

type ReportFormValues = z.infer<typeof reportFormSchema>;

const ReportFormPage: FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;

  const { data: template, isLoading: isTemplateLoading } = useReportTemplate();
  const { data: existingReport, isLoading: isReportLoading } = useReport(id ? Number(id) : undefined);

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors },
  } = useForm<ReportFormValues>({
    resolver: zodResolver(reportFormSchema),
    defaultValues: {
      reportName: "",
      reportType: "",
      reportSubType: "",
      reportCategory: "",
      description: "",
      reportSql: "",
      useReport: false,
      parameters: [],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "parameters" });

  useEffect(() => {
    if (existingReport) {
      reset({
        reportName: existingReport.reportName ?? "",
        reportType: existingReport.reportType ?? "",
        reportSubType: existingReport.reportSubType ?? "",
        reportCategory: existingReport.reportCategory ?? "",
        description: existingReport.description ?? "",
        reportSql: existingReport.reportSql ?? "",
        useReport: existingReport.useReport ?? false,
        parameters:
          existingReport.reportParameters?.map((p) => ({
            parameterName: p.parameterName,
            parameterType: p.parameterType,
            selectOne: p.selectOne,
            reportParameterName: p.reportParameterName,
          })) ?? [],
      });
    }
  }, [existingReport, reset]);

  const createMutation = useCreateReport();
  const updateMutation = useUpdateReport();
  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const isLoaded = !!existingReport;

  const reportName = watch("reportName");
  const canSave = !isSubmitting && reportName.trim().length > 0;

  const onSubmit = useCallback(
    async (formValues: ReportFormValues) => {
      const payload: Record<string, unknown> = {
        reportName: formValues.reportName,
        reportType: formValues.reportType,
        reportSubType: formValues.reportSubType,
        reportCategory: formValues.reportCategory,
        description: formValues.description,
        reportSql: formValues.reportSql,
        useReport: formValues.useReport,
        reportParameters: formValues.parameters.map((p) => ({
          parameterName: p.parameterName,
          parameterType: p.parameterType,
          selectOne: p.selectOne,
          reportParameterName: p.reportParameterName,
        })),
      };

      if (isEdit) {
        await updateMutation.mutateAsync({ id: Number(id), payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      navigate("/reports");
    },
    [isEdit, id, createMutation, updateMutation, navigate],
  );

  const isLoading = isTemplateLoading || isReportLoading;

  if (isLoading) {
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
        title={isEdit ? "Edit Report" : "New Report"}
        description="Create or edit a report definition"
        actions={
          <Button variant="outline" onClick={() => navigate("/reports")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
        }
      />

      <form onSubmit={handleSubmit(onSubmit)}>
        {(createMutation.isError || updateMutation.isError) && (
          <div className="mb-6">
            <ErrorState
              title="Failed to save report"
              message={
                createMutation.error instanceof Error
                  ? createMutation.error.message
                  : updateMutation.error instanceof Error
                    ? updateMutation.error.message
                    : "An unexpected error occurred."
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
            <CardTitle>Report Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">Report Name *</label>
              <Input
                {...register("reportName")}
                placeholder="e.g. Client Loan Summary"
                disabled={isLoaded}
                error={errors.reportName?.message}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium">Report Type</label>
                <Controller
                  name="reportType"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange} disabled={isLoaded}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {(template?.paramTypes ?? []).map((opt) => (
                          <SelectItem key={opt.id} value={String(opt.id)}>
                            {opt.value}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div>
                <label className="block text-sm font-medium">Report Sub Type</label>
                <Controller
                  name="reportSubType"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange} disabled={isLoaded}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select sub type" />
                      </SelectTrigger>
                      <SelectContent>
                        {(template?.reportSubTypes ?? []).map((opt) => (
                          <SelectItem key={opt.id} value={String(opt.id)}>
                            {opt.value}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div>
                <label className="block text-sm font-medium">Report Category</label>
                <Controller
                  name="reportCategory"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange} disabled={isLoaded}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {(template?.reportCategories ?? []).map((opt) => (
                          <SelectItem key={opt.id} value={String(opt.id)}>
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
              <label className="block text-sm font-medium">Description</label>
              <Input {...register("description")} placeholder="Brief description of the report" disabled={isLoaded} />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium">Report SQL</label>
              <Textarea {...register("reportSql")} placeholder="SELECT ..." rows={6} disabled={isLoaded} />
            </div>

            <div className="flex items-center gap-2">
              <Controller
                name="useReport"
                control={control}
                render={({ field }) => (
                  <Checkbox id="useReport" checked={field.value} onCheckedChange={field.onChange} disabled={isLoaded} />
                )}
              />
              <label className="block text-sm font-medium">Active</label>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Parameters</CardTitle>
            {!isLoaded && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  append({ parameterName: "", parameterType: "", selectOne: false, reportParameterName: "" })
                }
              >
                <Plus className="mr-1 h-4 w-4" /> Add Parameter
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400">No parameters defined.</p>}
            {fields.map((field, index) => (
              <div key={field.id} className="flex items-start gap-3 p-3 border rounded-md">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium">Parameter Name</label>
                    <Input {...register(`parameters.${index}.parameterName`)} disabled={isLoaded} placeholder="Name" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Parameter Type</label>
                    <Controller
                      name={`parameters.${index}.parameterType`}
                      control={control}
                      render={({ field: controllerField }) => (
                        <Select
                          value={controllerField.value}
                          onValueChange={controllerField.onChange}
                          disabled={isLoaded}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Type" />
                          </SelectTrigger>
                          <SelectContent>
                            {(template?.paramTypes ?? []).map((opt) => (
                              <SelectItem key={opt.id} value={String(opt.id)}>
                                {opt.value}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium">Report Param Name</label>
                    <Input
                      {...register(`parameters.${index}.reportParameterName`)}
                      disabled={isLoaded}
                      placeholder="Report param"
                    />
                  </div>
                  <div className="flex items-end gap-2">
                    <div className="flex items-center gap-2 pb-2">
                      <Controller
                        name={`parameters.${index}.selectOne`}
                        control={control}
                        render={({ field: controllerField }) => (
                          <Checkbox
                            id={`selectOne-${index}`}
                            checked={controllerField.value}
                            onCheckedChange={controllerField.onChange}
                            disabled={isLoaded}
                          />
                        )}
                      />
                      <label className="block text-sm font-medium">Select One</label>
                    </div>
                    {!isLoaded && (
                      <Button type="button" variant="ghost" size="sm" onClick={() => remove(index)}>
                        <X className="h-4 w-4 text-red-500" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate("/reports")}>
            Cancel
          </Button>
          <Button type="submit" disabled={!canSave}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" /> {isEdit ? "Update Report" : "Create Report"}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ReportFormPage;
