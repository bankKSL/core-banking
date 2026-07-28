import { type FC, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Save, Loader2, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { ErrorState } from "@/components/shared/ErrorState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useTaxGroup, useTaxGroupTemplate, useCreateTaxGroup, useUpdateTaxGroup, useTaxComponents } from "../hooks/useTaxes";
import { parseFineractDate } from "../api/taxes";

function formatDateInput(dateVal: number[] | null | undefined): string {
  const d = parseFineractDate(dateVal);
  if (!d) return "";
  return d.toISOString().split("T")[0];
}

const taxComponentEntrySchema = z.object({
  taxComponentId: z.number({ message: "Tax component is required" }),
  startDate: z.string().optional().default(""),
  endDate: z.string().optional().default(""),
});

const taxGroupFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  taxComponents: z.array(taxComponentEntrySchema),
});

type TaxGroupFormValues = z.input<typeof taxGroupFormSchema>;

const TaxGroupFormPage: FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;

  const { data: existingGroup, isLoading: groupLoading } = useTaxGroup(id ? Number(id) : undefined);
  const { data: template, isLoading: templateLoading } = useTaxGroupTemplate();
  const { data: allTaxComponents, isLoading: componentsLoading } = useTaxComponents();

  const createMutation = useCreateTaxGroup();
  const updateMutation = useUpdateTaxGroup();

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TaxGroupFormValues>({
    resolver: zodResolver(taxGroupFormSchema),
    defaultValues: {
      name: "",
      taxComponents: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "taxComponents",
  });

  const componentOptions = useMemo(() => {
    if (template?.taxComponents) return template.taxComponents;
    if (allTaxComponents) return allTaxComponents.map((c) => ({ id: c.id, name: c.name, percentage: c.percentage }));
    return [];
  }, [template, allTaxComponents]);

  useEffect(() => {
    if (!existingGroup) return;
    reset({
      name: existingGroup.name,
      taxComponents: existingGroup.taxComponents.map((tc) => ({
        taxComponentId: tc.taxComponent.id,
        startDate: formatDateInput(tc.startDate ? tc.startDate.split("-").map(Number) as unknown as number[] : null),
        endDate: formatDateInput(tc.endDate ? tc.endDate.split("-").map(Number) as unknown as number[] : null),
      })),
    });
  }, [existingGroup, reset]);

  const onSubmit = useCallback(
    async (values: TaxGroupFormValues) => {
      const payload: Record<string, unknown> = {
        name: values.name,
        taxComponents: values.taxComponents.map((tc) => {
          const entry: Record<string, unknown> = {
            taxComponentId: tc.taxComponentId,
            startDate: tc.startDate || undefined,
            dateFormat: "dd MMMM yyyy",
            locale: "en",
          };
          return entry;
        }),
      };

      if (isEdit) {
        await updateMutation.mutateAsync({ id: Number(id), payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      navigate("/taxes/groups");
    },
    [isEdit, id, createMutation, updateMutation, navigate],
  );

  const isLoading = templateLoading || componentsLoading || (isEdit && groupLoading);

  if (isLoading) {
    return (
      <div className="p-6 max-w-3xl m-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
        <Card>
          <CardContent className="space-y-4 py-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  const saveError = createMutation.error ?? updateMutation.error;

  return (
    <div className="p-6 max-w-3xl m-auto space-y-6">
      <PageHeader
        title={isEdit ? "Edit Tax Group" : "New Tax Group"}
        actions={
          <Button variant="outline" onClick={() => navigate("/taxes/groups")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
        }
      />

      {(createMutation.isError || updateMutation.isError) && (
        <ErrorState
          title="Failed to save tax group"
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
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">Name *</label>
              <Input {...register("name")} placeholder="e.g. Standard Tax" error={errors.name?.message} />
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Tax Components</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="flex items-start gap-4 p-4 border rounded-lg">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium">Tax Component</label>
                    <Controller
                      name={`taxComponents.${index}.taxComponentId`}
                      control={control}
                      render={({ field: controllerField }) => (
                        <Select
                          value={controllerField.value ? String(controllerField.value) : ""}
                          onValueChange={(v) => controllerField.onChange(Number(v))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            {componentOptions.map((c) => (
                              <SelectItem key={c.id} value={String(c.id)}>
                                {c.name} ({c.percentage}%)
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium">Start Date</label>
                    <Input type="date" {...register(`taxComponents.${index}.startDate`)} />
                  </div>

                  {isEdit && (
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium">End Date</label>
                      <Input type="date" {...register(`taxComponents.${index}.endDate`)} />
                    </div>
                  )}
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="mt-6 shrink-0"
                  onClick={() => remove(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              onClick={() => append({ taxComponentId: 0, startDate: "", endDate: "" })}
            >
              <Plus className="mr-2 h-4 w-4" /> Add Component
            </Button>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate("/taxes/groups")}>
            Cancel
          </Button>
          <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
            {createMutation.isPending || updateMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" /> {isEdit ? "Update Group" : "Create Group"}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default TaxGroupFormPage;
