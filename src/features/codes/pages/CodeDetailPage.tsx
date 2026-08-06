import { type FC, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Plus, Pencil, Trash2, Shield } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ErrorState } from "@/components/shared/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTable, type ColumnDef } from "@/components/shared/DataTable";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  useCode,
  useCodeValues,
  useCreateCodeValue,
  useUpdateCodeValue,
  useDeleteCodeValue,
  useDeleteCode,
} from "../hooks/useCodes";
import type { CodeValue } from "../api/codes";

const codeValueSchema = z.object({
  name: z.string().min(1, "Value name is required"),
  position: z.string().optional(),
  description: z.string().optional(),
  isActive: z.boolean(),
  isMandatory: z.boolean(),
});

type CodeValueFormValues = z.infer<typeof codeValueSchema>;

const CodeDetailPage: FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const codeId = id ? Number(id) : undefined;

  const { data: code, isLoading: codeLoading, isError: codeError, refetch: refetchCode } = useCode(codeId);
  const { data: values = [], isLoading: valuesLoading } = useCodeValues(codeId);

  const createValueMutation = useCreateCodeValue(codeId);
  const updateValueMutation = useUpdateCodeValue(codeId);
  const deleteValueMutation = useDeleteCodeValue(codeId);
  const deleteCodeMutation = useDeleteCode();

  const [valueDialog, setValueDialog] = useState<{ open: boolean; editValue?: CodeValue }>({ open: false });
  const [deleteTarget, setDeleteTarget] = useState<CodeValue | null>(null);
  const [showDeleteCodeDialog, setShowDeleteCodeDialog] = useState(false);

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CodeValueFormValues>({
    resolver: zodResolver(codeValueSchema),
    defaultValues: {
      name: "",
      position: "",
      description: "",
      isActive: true,
      isMandatory: false,
    },
  });

  const openCreateDialog = useCallback(() => {
    reset({ name: "", position: "", description: "", isActive: true, isMandatory: false });
    setValueDialog({ open: true });
  }, [reset]);

  const openEditDialog = useCallback(
    (value: CodeValue) => {
      reset({
        name: value.name,
        position: String(value.position),
        description: value.description ?? "",
        isActive: value.isActive,
        isMandatory: value.isMandatory,
      });
      setValueDialog({ open: true, editValue: value });
    },
    [reset],
  );

  const onSubmit = useCallback(
    async (data: CodeValueFormValues) => {
      if (!codeId) return;
      const payload = {
        name: data.name,
        position: data.position ? Number(data.position) : undefined,
        description: data.description || undefined,
        isActive: data.isActive,
        isMandatory: data.isMandatory,
      };
      if (valueDialog.editValue) {
        await updateValueMutation.mutateAsync({ valueId: valueDialog.editValue.id, payload });
      } else {
        await createValueMutation.mutateAsync(payload);
      }
      setValueDialog({ open: false });
    },
    [codeId, valueDialog.editValue, createValueMutation, updateValueMutation],
  );

  const handleDeleteValue = useCallback(async () => {
    if (!codeId || !deleteTarget) return;
    await deleteValueMutation.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  }, [codeId, deleteTarget, deleteValueMutation]);

  const handleDeleteCode = useCallback(async () => {
    if (!codeId) return;
    try {
      await deleteCodeMutation.mutateAsync(codeId);
      navigate("/codes");
    } catch {
      setShowDeleteCodeDialog(false);
    }
  }, [codeId, deleteCodeMutation, navigate]);

  const columns: ColumnDef<CodeValue>[] = [
    {
      key: "name",
      header: t("Value Name"),
      accessorFn: (row) => <span className="font-medium">{row.name}</span>,
    },
    { key: "position", header: t("Position") },
    {
      key: "description",
      header: t("Description"),
      accessorFn: (row) => row.description ?? "—",
      className: "max-w-[200px] truncate",
    },
    {
      key: "isActive",
      header: t("Active"),
      accessorFn: (row) =>
        row.isActive ? (
          <Badge variant="success" size="sm">
            {t("Active")}
          </Badge>
        ) : (
          <Badge variant="default" size="sm">
            {t("Inactive")}
          </Badge>
        ),
    },
    {
      key: "isMandatory",
      header: t("Mandatory"),
      accessorFn: (row) => (row.isMandatory ? t("Yes") : t("No")),
    },
    {
      key: "actions",
      header: "",
      className: "w-[80px]",
      cell: (row) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="icon" onClick={() => openEditDialog(row)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(row)}>
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      ),
    },
  ];

  if (codeLoading) {
    return (
      <div className="max-w-6xl m-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
        <Card>
          <CardContent className="py-6 space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (codeError || !code) {
    return (
      <div className="p-6 max-w-6xl m-auto">
        <PageHeader
          title={t("Code Details")}
          description={t("View and manage code values")}
          actions={
            <Button variant="outline" onClick={() => navigate("/codes")}>
              <ArrowLeft className="mr-2 h-4 w-4" /> {t("Back")}
            </Button>
          }
        />
        <ErrorState
          title={t("Failed to load code")}
          message={t("An unexpected error occurred while loading the code.")}
          onRetry={() => refetchCode()}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={code.name}
        description={t("Manage code values for this lookup table")}
        actions={
          <>
            <Button variant="outline" onClick={() => navigate("/codes")}>
              <ArrowLeft className="mr-2 h-4 w-4" /> {t("Back")}
            </Button>
            {!code.systemDefined && (
              <Button variant="outline" onClick={() => setShowDeleteCodeDialog(true)}>
                <Trash2 className="mr-2 h-4 w-4 text-red-500" /> {t("Delete Code")}
              </Button>
            )}
            <Button onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" /> {t("New Value")}
            </Button>
          </>
        }
      />

      {code.systemDefined && (
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <Shield className="h-4 w-4" />
          {t("System-defined code. Values can be managed but the code itself cannot be deleted.")}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t("Code Values")}</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={values}
            loading={valuesLoading}
            emptyState={{ message: t("No values defined for this code.") }}
          />
        </CardContent>
      </Card>

      <Dialog open={valueDialog.open} onOpenChange={(o) => setValueDialog({ open: o })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{valueDialog.editValue ? t("Edit Code Value") : t("New Code Value")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            {(createValueMutation.isError || updateValueMutation.isError) && (
              <ErrorState
                title={t("Failed to save code value")}
                message={
                  (createValueMutation.error ?? updateValueMutation.error)?.message ?? t("An unexpected error occurred.")
                }
                onRetry={() => {
                  createValueMutation.reset();
                  updateValueMutation.reset();
                }}
              />
            )}
            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium">{t("Value Name")} *</label>
                <Input {...register("name")} placeholder={t("e.g. Male")} error={errors.name?.message} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium">{t("Position")}</label>
                  <Input type="number" min="0" {...register("position")} placeholder="0" />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium">{t("Description")}</label>
                  <Input {...register("description")} placeholder={t("Optional")} />
                </div>
              </div>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 text-sm">
                  <Controller
                    name="isActive"
                    control={control}
                    render={({ field }) => (
                      <Checkbox checked={field.value} onCheckedChange={(checked) => field.onChange(checked === true)} />
                    )}
                  />
                  {t("Active")}
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Controller
                    name="isMandatory"
                    control={control}
                    render={({ field }) => (
                      <Checkbox checked={field.value} onCheckedChange={(checked) => field.onChange(checked === true)} />
                    )}
                  />
                  {t("Mandatory")}
                </label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setValueDialog({ open: false })}>
                {t("Cancel")}
              </Button>
              <Button type="submit" disabled={createValueMutation.isPending || updateValueMutation.isPending}>
                {createValueMutation.isPending || updateValueMutation.isPending ? t("Saving...") : t("Save")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => {
          if (!o) setDeleteTarget(null);
        }}
        title={t("Delete Code Value")}
        description={t("Are you sure you want to delete this code value?")}
        confirmLabel={t("Delete")}
        onConfirm={handleDeleteValue}
        variant="destructive"
        loading={deleteValueMutation.isPending}
      />

      <ConfirmDialog
        open={showDeleteCodeDialog}
        onOpenChange={setShowDeleteCodeDialog}
        title={t("Delete Code")}
        description={`${t("Are you sure you want to delete")} "${code.name}"? ${t("This will also remove all its values.")}`}
        confirmLabel={t("Delete")}
        onConfirm={handleDeleteCode}
        variant="destructive"
        loading={deleteCodeMutation.isPending}
      />
    </div>
  );
};

export default CodeDetailPage;
