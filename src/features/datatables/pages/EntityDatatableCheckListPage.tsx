import React, { useState, useMemo, useCallback } from "react";
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
import type { EntityDatatableCheck, EntityDatatableCheckTemplate } from "../api/datatables";

const EntityDatatableCheckListPage: React.FC = () => {
  const { data: checks = [], isLoading, isError, refetch } = useEntityDatatableChecks();
  const { data: template } = useEntityDatatableCheckTemplate();
  const createMutation = useCreateEntityDatatableCheck();
  const deleteMutation = useDeleteEntityDatatableCheck();

  const [deleteTarget, setDeleteTarget] = useState<EntityDatatableCheck | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [formEntity, setFormEntity] = useState("");
  const [formDatatable, setFormDatatable] = useState("");
  const [formStatus, setFormStatus] = useState<number | null>(null);
  const [formProductId, setFormProductId] = useState("");

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
    } catch {
      // handled by mutation
    }
    setDeleteTarget(null);
  }, [deleteTarget, deleteMutation]);

  const handleCreate = useCallback(async () => {
    if (!formEntity || !formDatatable || formStatus == null) return;
    try {
      await createMutation.mutateAsync({
        entity: formEntity,
        datatableName: formDatatable,
        status: formStatus,
        ...(formProductId ? { productId: Number(formProductId) } : {}),
      });
      setDialogOpen(false);
      setFormEntity("");
      setFormDatatable("");
      setFormStatus(null);
      setFormProductId("");
    } catch {
      // handled by mutation
    }
  }, [formEntity, formDatatable, formStatus, formProductId, createMutation]);

  const openDialog = useCallback(() => {
    if (!template) return;
    setFormEntity(template.entities[0]?.value ?? "");
    setFormDatatable(template.datatables[0]?.datatableName ?? "");
    setFormStatus(template.statuses[0]?.id ?? null);
    setFormProductId("");
    setDialogOpen(true);
  }, [template]);

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
        <ErrorState message="Failed to load entity datatable checks." onRetry={refetch} />
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
          <div className="space-y-4">
            <div>
              <Label htmlFor="checkEntity">Entity</Label>
              <Select value={formEntity} onValueChange={setFormEntity}>
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
            </div>

            <div>
              <Label htmlFor="checkDatatable">Datatable</Label>
              <Select value={formDatatable} onValueChange={setFormDatatable}>
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
            </div>

            <div>
              <Label htmlFor="checkStatus">Status</Label>
              <Select value={formStatus != null ? String(formStatus) : ""} onValueChange={(v) => setFormStatus(Number(v))}>
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
            </div>

            <div>
              <Label htmlFor="checkProductId">Product ID (optional)</Label>
              <Input
                id="checkProductId"
                type="number"
                min="0"
                value={formProductId}
                onChange={(e) => setFormProductId(e.target.value)}
                placeholder="Leave empty for all products"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={createMutation.isPending || !formEntity || !formDatatable || formStatus == null}
              >
                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" />
                Create
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EntityDatatableCheckListPage;
