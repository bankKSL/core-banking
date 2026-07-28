import { type FC, useMemo, useCallback, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2, Loader2, Save } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/shared/ErrorState";
import { DataTable, type ColumnDef } from "@/components/shared/DataTable";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  useEntityDatatableChecks,
  useEntityDatatableCheckTemplate,
  useCreateEntityDatatableCheck,
  useDeleteEntityDatatableCheck,
} from "../hooks/useDatatables";
import type { EntityDatatableCheck } from "../api/datatables";

const createCheckSchema = z.object({
  entity: z.string().min(1, "Entity is required"),
  datatableName: z.string().min(1, "Datatable is required"),
  status: z.number({ message: "Status is required" }),
  productId: z.string().optional(),
});

type CreateCheckFormValues = z.infer<typeof createCheckSchema>;

const EntityDatatableCheckListPage: FC = () => {
  const { data: checks = [], isLoading, isError, refetch } = useEntityDatatableChecks();
  const { data: template } = useEntityDatatableCheckTemplate();
  const createMutation = useCreateEntityDatatableCheck();
  const deleteMutation = useDeleteEntityDatatableCheck();

  const [deleteTarget, setDeleteTarget] = useState<EntityDatatableCheck | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { isValid },
  } = useForm<CreateCheckFormValues>({
    resolver: zodResolver(createCheckSchema),
    defaultValues: { entity: "", datatableName: "", status: 0, productId: "" },
    mode: "onChange",
  });

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
    } catch {
      // handled by mutation
    }
    setDeleteTarget(null);
  }, [deleteTarget, deleteMutation]);

  const onSubmit = useCallback(
    async (values: CreateCheckFormValues) => {
      try {
        await createMutation.mutateAsync({
          entity: values.entity,
          datatableName: values.datatableName,
          status: values.status,
          ...(values.productId ? { productId: Number(values.productId) } : {}),
        });
        setDialogOpen(false);
        reset();
      } catch {
        // handled by mutation
      }
    },
    [createMutation, reset],
  );

  const openDialog = useCallback(() => {
    if (!template) return;
    reset({
      entity: template.entities[0]?.value ?? "",
      datatableName: template.datatables[0]?.datatableName ?? "",
      status: template.statuses[0]?.id ?? 0,
      productId: "",
    });
    setDialogOpen(true);
  }, [template, reset]);

  const columns: ColumnDef<EntityDatatableCheck>[] = useMemo(
    () => [
      {
        key: "entity",
        header: "Entity",
        accessorFn: (row) => <span className="font-medium">{row.entity}</span>,
      },
      {
        key: "datatableName",
        header: "Datatable",
        accessorFn: (row) => row.datatableName,
      },
      {
        key: "status",
        header: "Status",
        accessorFn: (row) => row.status,
      },
      {
        key: "productId",
        header: "Product ID",
        accessorFn: (row) => row.productId ?? "—",
      },
      {
        key: "actions",
        header: "",
        className: "w-[60px]",
        cell: (row) => (
          <div onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(row)}>
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        ),
      },
    ],
    [],
  );

  if (isError) {
    return (
      <div className="p-6">
        <PageHeader
          title="Entity Datatable Checks"
          description="Configure datatable validation rules per entity"
          actions={
            <Button onClick={openDialog}>
              <Plus className="mr-2 h-4 w-4" /> New Check
            </Button>
          }
        />
        <ErrorState title="Failed to load checks" message="Failed to load entity datatable checks." onRetry={refetch} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Entity Datatable Checks"
        description="Configure datatable validation rules per entity"
        actions={
          <Button onClick={openDialog}>
            <Plus className="mr-2 h-4 w-4" /> New Check
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>All Checks</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={checks}
            loading={isLoading}
            emptyState={{ message: "No entity datatable checks found." }}
          />
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}
        title="Delete Check"
        description="Are you sure you want to delete this entity datatable check?"
        confirmLabel="Delete"
        onConfirm={handleDelete}
        variant="destructive"
        loading={deleteMutation.isPending}
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Entity Datatable Check</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="checkEntity">Entity</Label>
              <Controller
                control={control}
                name="entity"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="checkEntity">
                      <SelectValue placeholder="Select entity" />
                    </SelectTrigger>
                    <SelectContent>
                      {(template?.entities ?? []).map((e) => (
                        <SelectItem key={e.id} value={e.value}>
                          {e.value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div>
              <Label htmlFor="checkDatatable">Datatable</Label>
              <Controller
                control={control}
                name="datatableName"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="checkDatatable">
                      <SelectValue placeholder="Select datatable" />
                    </SelectTrigger>
                    <SelectContent>
                      {(template?.datatables ?? []).map((d) => (
                        <SelectItem key={d.datatableName} value={d.datatableName}>
                          {d.datatableName} ({d.apptableName})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div>
              <Label htmlFor="checkStatus">Status</Label>
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <Select value={field.value ? String(field.value) : ""} onValueChange={(v) => field.onChange(Number(v))}>
                    <SelectTrigger id="checkStatus">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {(template?.statuses ?? []).map((s) => (
                        <SelectItem key={s.id} value={String(s.id)}>
                          {s.value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div>
              <Label htmlFor="checkProductId">Product ID (optional)</Label>
              <Input
                id="checkProductId"
                type="number"
                min="0"
                {...register("productId")}
                placeholder="Leave empty for all products"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" type="button" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || !isValid}
              >
                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" />
                Create
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EntityDatatableCheckListPage;
