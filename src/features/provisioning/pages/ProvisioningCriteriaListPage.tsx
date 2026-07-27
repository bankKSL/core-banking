import React, { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, type ColumnDef } from "@/components/shared/DataTable";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/shared/ErrorState";
import { useProvisioningCriterias, useDeleteProvisioningCriteria } from "../hooks/useProvisioning";
import type { ProvisioningCriteria } from "../api/provisioning";

const ProvisioningCriteriaListPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: criterias = [], isLoading, isError, refetch } = useProvisioningCriterias();
  const deleteMutation = useDeleteProvisioningCriteria();
  const [deleteTarget, setDeleteTarget] = useState<ProvisioningCriteria | null>(null);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
    } catch {
      // handled by mutation
    }
    setDeleteTarget(null);
  }, [deleteTarget, deleteMutation]);

  const columns: ColumnDef<ProvisioningCriteria>[] = useMemo(
    () => [
      {
        key: "criteriaName",
        header: "Name",
        accessorFn: (row) => <span className="font-medium">{row.criteriaName}</span>,
      },
      {
        key: "createdBy",
        header: "Created By",
        accessorFn: (row) => row.createdBy ?? "—",
      },
      {
        key: "loanProducts",
        header: "Loan Products",
        accessorFn: (row) => String(row.loanProducts?.length ?? 0),
      },
      {
        key: "actions",
        header: "",
        className: "w-[100px]",
        cell: (row) => (
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/provisioning/criterias/edit/${row.id}`)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(row)}>
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        ),
      },
    ],
    [navigate],
  );

  const handleRowClick = useCallback(
    (row: ProvisioningCriteria) => {
      navigate(`/provisioning/criterias/edit/${row.id}`);
    },
    [navigate],
  );

  if (isError) {
    return (
      <div className="p-6">
        <PageHeader
          title="Provisioning Criteria"
          description="Manage provisioning criteria"
          actions={
            <Button onClick={() => navigate("/provisioning/criterias/new")}>
              <Plus className="mr-2 h-4 w-4" /> New Criteria
            </Button>
          }
        />
        <ErrorState message="Failed to load provisioning criteria." onRetry={refetch} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Provisioning Criteria"
        description="Manage provisioning criteria"
        actions={
          <Button onClick={() => navigate("/provisioning/criterias/new")}>
            <Plus className="mr-2 h-4 w-4" /> New Criteria
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>All Criteria</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={criterias}
            onRowClick={handleRowClick}
            loading={isLoading}
            emptyState={{ message: "No provisioning criteria found." }}
          />
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}
        title="Delete Criteria"
        description={`Are you sure you want to delete "${deleteTarget?.criteriaName}"?`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        variant="destructive"
        loading={deleteMutation.isPending}
      />
    </div>
  );
};

export default ProvisioningCriteriaListPage;
