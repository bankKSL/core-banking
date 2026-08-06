import React, { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, type ColumnDef } from "@/components/shared/DataTable";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/shared/ErrorState";
import { useProvisioningCriterias, useDeleteProvisioningCriteria } from "../hooks/useProvisioning";
import type { ProvisioningCriteria } from "../api/provisioning";

const ProvisioningCriteriaListPage: React.FC = () => {
  const { t } = useTranslation();
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
        header: t("Name"),
        accessorFn: (row) => <span className="font-medium">{row.criteriaName}</span>,
      },
      {
        key: "createdBy",
        header: t("Created By"),
        accessorFn: (row) => row.createdBy ?? "—",
      },
      {
        key: "loanProducts",
        header: t("Loan Products"),
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
    [navigate, t],
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
          title={t("Provisioning Criteria")}
          description={t("Manage provisioning criteria")}
          actions={
            <Button onClick={() => navigate("/provisioning/criterias/new")}>
              <Plus className="mr-2 h-4 w-4" /> {t("New Criteria")}
            </Button>
          }
        />
        <ErrorState message={t("Failed to load provisioning criteria.")} onRetry={refetch} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("Provisioning Criteria")}
        description={t("Manage provisioning criteria")}
        actions={
          <Button onClick={() => navigate("/provisioning/criterias/new")}>
            <Plus className="mr-2 h-4 w-4" /> {t("New Criteria")}
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>{t("All Criteria")}</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={criterias}
            onRowClick={handleRowClick}
            loading={isLoading}
            emptyState={{ message: t("No provisioning criteria found.") }}
          />
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}
        title={t("Delete Criteria")}
        description={t("Are you sure you want to delete \"{{name}}\"?", { name: deleteTarget?.criteriaName })}
        confirmLabel={t("Delete")}
        onConfirm={handleDelete}
        variant="destructive"
        loading={deleteMutation.isPending}
      />
    </div>
  );
};

export default ProvisioningCriteriaListPage;