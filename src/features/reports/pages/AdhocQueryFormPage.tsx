import { type FC, useCallback, useEffect } from "react";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useAdhocQuery, useCreateAdhocQuery, useUpdateAdhocQuery } from "../hooks/useReports";

const adhocQueryFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  query: z.string().min(1, "Query is required"),
  tableName: z.string(),
  tableFields: z.string(),
  email: z.string(),
  isActive: z.boolean(),
});

type AdhocQueryFormValues = z.infer<typeof adhocQueryFormSchema>;

const AdhocQueryFormPage: FC = () => {
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
    resolver: zodResolver(adhocQueryFormSchema),
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
      <div className="p-6 max-w-4xl m-auto space-y-6">
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
    <div className="p-6 max-w-4xl m-auto space-y-6">
      <PageHeader
        title={isEdit ? "Edit Adhoc Query" : "New Adhoc Query"}
        description="Create or edit an adhoc query definition"
        actions={
          <Button variant="outline" onClick={() => navigate("/adhoc-queries")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
        }
      />

      <form onSubmit={handleSubmit(onSubmit)}>
        {(createMutation.isError || updateMutation.isError) && (
          <div className="mb-6">
            <ErrorState
              title="Failed to save adhoc query"
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
            <CardTitle>Query Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                {...register("name")}
                placeholder="e.g. Active Loans Report"
                disabled={isLoaded}
              />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>

            <div>
              <Label htmlFor="query">Query *</Label>
              <Textarea
                id="query"
                {...register("query")}
                placeholder="SELECT ..."
                rows={6}
                disabled={isLoaded}
              />
              {errors.query && <p className="text-xs text-red-500">{errors.query.message}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tableName">Table Name</Label>
                <Input
                  id="tableName"
                  {...register("tableName")}
                  placeholder="e.g. m_loan"
                  disabled={isLoaded}
                />
              </div>
              <div>
                <Label htmlFor="tableFields">Table Fields</Label>
                <Input
                  id="tableFields"
                  {...register("tableFields")}
                  placeholder="e.g. id, display_name"
                  disabled={isLoaded}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...register("email")}
                placeholder="recipient@example.com"
                disabled={isLoaded}
              />
            </div>

            <div className="flex items-center gap-2">
              <Controller
                name="isActive"
                control={control}
                render={({ field }) => (
                  <Checkbox id="isActive" checked={field.value} onCheckedChange={field.onChange} disabled={isLoaded} />
                )}
              />
              <Label htmlFor="isActive">Active</Label>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate("/adhoc-queries")}>
            Cancel
          </Button>
          <Button type="submit" disabled={!canSave}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" /> {isEdit ? "Update Query" : "Create Query"}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AdhocQueryFormPage;
