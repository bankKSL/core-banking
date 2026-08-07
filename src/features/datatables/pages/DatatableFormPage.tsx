import { type FC, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Save, Loader2, Plus, X } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ErrorState } from "@/components/shared/ErrorState";
import { useCreateDatatable } from "../hooks/useDatatables";

const APPTABLE_OPTIONS = [
  { value: "m_client", label: "Client" },
  { value: "m_group", label: "Group" },
  { value: "m_loan", label: "Loan" },
  { value: "m_office", label: "Office" },
  { value: "m_saving_account", label: "Saving Account" },
  { value: "m_product_loan", label: "Product Loan" },
  { value: "m_savings_product", label: "Savings Product" },
];

const COLUMN_TYPE_OPTIONS = ["Boolean", "Date", "DateTime", "Decimal", "Dropdown", "Number", "String", "Text"];

type DatatableFormValues = z.infer<ReturnType<typeof getDatatableFormSchema>>;

function getDatatableFormSchema(t: (key: string) => string) {
  const columnSchema = z.object({
    name: z.string().min(1, t("Column name is required")),
    type: z.string().min(1),
    length: z.number().default(0),
    mandatory: z.boolean().default(false),
  });

  return z.object({
    datatableName: z.string().min(1, t("Datatable name is required")),
    apptableName: z.string().min(1, t("App table is required")),
    multiRow: z.boolean().default(false),
    columns: z.array(columnSchema).min(1, t("At least one column is required")),
  });
}

const DatatableFormPage: FC = () => {
  const { t } = useTranslation();
  const datatableFormSchema = getDatatableFormSchema(t);
  const navigate = useNavigate();
  const createMutation = useCreateDatatable();

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<DatatableFormValues>({
    resolver: zodResolver(datatableFormSchema) as any,
    defaultValues: {
      datatableName: "",
      apptableName: "",
      multiRow: false,
      columns: [{ name: "", type: "String", length: 0, mandatory: false }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "columns",
  });

  const columnsWatch = watch("columns");

  const onSubmit = useCallback(
    async (values: DatatableFormValues) => {
      await createMutation.mutateAsync({
        datatableName: values.datatableName.trim(),
        apptableName: values.apptableName,
        multiRow: values.multiRow,
        columns: values.columns.map((c) => ({
          name: c.name.trim(),
          type: c.type,
          length: c.length ?? 0,
          mandatory: c.mandatory ?? false,
        })),
      });
      navigate("/datatables");
    },
    [createMutation, navigate],
  );

  return (
    <div className="p-6 max-w-6xl m-auto space-y-6">
      <PageHeader
        title={t("New Datatable")}
        description={t("Create or register a new datatable")}
        actions={
          <Button variant="outline" onClick={() => navigate("/datatables")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> {t("Back")}
          </Button>
        }
      />

      {createMutation.isError && (
        <div className="mb-6">
          <ErrorState
            title={t("Failed to create datatable")}
            message={
              createMutation.error instanceof Error ? createMutation.error.message : t("An unexpected error occurred.")
            }
            onRetry={() => createMutation.reset()}
          />
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{t("Datatable Details")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Datatable Name")} *</label>
              <Input
                {...register("datatableName")}
                placeholder={t("e.g. extra_client_details")}
                error={errors.datatableName?.message}
              />
            </div>

            <div>
              <label className="block text-sm font-medium">{t("App Table")} *</label>
              <Controller
                control={control}
                name="apptableName"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="apptableName">
                      <SelectValue placeholder={t("Select app table")} />
                    </SelectTrigger>
                    <SelectContent>
                      {APPTABLE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.apptableName && <p className="text-xs text-red-500">{errors.apptableName.message}</p>}
            </div>

            <div className="flex items-center gap-2">
              <Controller
                control={control}
                name="multiRow"
                render={({ field }) => (
                  <Checkbox id="multiRow" checked={field.value} onCheckedChange={field.onChange} />
                )}
              />
              <label className="block text-sm font-medium cursor-pointer">{t("Allow multiple rows per entity")}</label>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{t("Columns")}</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ name: "", type: "String", length: 0, mandatory: false })}
            >
              <Plus className="h-4 w-4 mr-1" /> {t("Add Column")}
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="flex items-start gap-4 p-4 border rounded-lg relative">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 h-6 w-6"
                  onClick={() => remove(index)}
                >
                  <X className="h-4 w-4" />
                </Button>

                <div className="flex-1 space-y-1.5">
                  <label className="block text-sm font-medium">{t("Name")} *</label>
                  <Input
                    {...register(`columns.${index}.name`)}
                    placeholder={`Column ${index + 1}`}
                    error={errors.columns?.[index]?.name?.message}
                  />
                </div>

                <div className="w-40 space-y-1.5">
                  <label className="block text-sm font-medium">{t("Type")}</label>
                  <Controller
                    control={control}
                    name={`columns.${index}.type`}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {COLUMN_TYPE_OPTIONS.map((opt) => (
                            <SelectItem key={opt} value={opt}>
                              {opt}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                {columnsWatch?.[index]?.type !== "Text" && columnsWatch?.[index]?.type !== "Dropdown" && (
                  <div className="w-24 space-y-1.5">
                    <label className="block text-sm font-medium">{t("Length")}</label>
                    <Input
                      type="number"
                      min="0"
                      {...register(`columns.${index}.length`, { valueAsNumber: true })}
                      placeholder="0"
                    />
                  </div>
                )}

                <div className="flex items-center gap-2 pt-6">
                  <Controller
                    control={control}
                    name={`columns.${index}.mandatory`}
                    render={({ field }) => (
                      <Checkbox id={`mandatory-${field.name}`} checked={field.value} onCheckedChange={field.onChange} />
                    )}
                  />
                  <label className="block text-sm font-medium cursor-pointer">{t("Mandatory")}</label>
                </div>
              </div>
            ))}

            {errors.columns?.root && (
              <p className="text-sm text-red-500 text-center py-4">{errors.columns.root.message}</p>
            )}

            {fields.length === 0 && !errors.columns?.root && (
              <p className="text-sm text-gray-500 text-center py-4">
                {t('No columns defined. Click "Add Column" to add one.')}
              </p>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate("/datatables")}>
            {t("Cancel")}
          </Button>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t("Creating…")}
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" /> {t("Create Datatable")}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default DatatableFormPage;
