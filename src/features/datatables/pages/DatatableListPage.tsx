import React, { useState, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/shared/ErrorState";
import { DataTable, type ColumnDef } from "@/components/shared/DataTable";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useDatatables, useDeleteDatatable } from "../hooks/useDatatables";
import type { Datatable } from "../api/datatables";

const DatatableListPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: datatables = [], isLoading, isError, refetch } = useDatatables();
  const deleteMutation = useDeleteDatatable();
  const [deleteTarget, setDeleteTarget] = useState<Datatable | null>(null);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.datatableName);
    } catch {
      // handled by mutation
    }
    setDeleteTarget(null);
  }, [deleteTarget, deleteMutation]);

  const columns: ColumnDef<Datatable>[] = useMemo(
    () => [
      {
        key: "datatableName",
        header: t("Datatable Name"),
        accessorFn: (row) => <span className="font-medium">{row.datatableName}</span>,
      },
      {
        key: "apptableName",
        header: t("App Table"),
        accessorFn: (row) => row.apptableName ?? "—",
      },
      {
        key: "multiRow",
        header: t("Multi Row"),
        accessorFn: (row) =>
          row.multiRow ? <Badge variant="success" size="sm">{t("Yes")}</Badge> : <Badge variant="default" size="sm">{t("No")}</Badge>,
      },
      {
        key: "columns",
        header: t("Columns"),
        accessorFn: (row) => row.columns?.length ?? 0,
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

  const handleRowClick = useCallback(
    (row: Datatable) => {
      navigate(`/datatables/${row.datatableName}`);
    },
    [navigate],
  );

  if (isError) {
    return (
      <div className="p-6">
        <PageHeader
          title={t("Datatables")}
          description={t("Manage custom datatables")}
          actions={
            <Button onClick={() => navigate("/datatables/new")}>
              <Plus className="mr-2 h-4 w-4" /> {t("New Datatable")}
            </Button>
          }
        />
        <ErrorState message={t("Failed to load datatables.")} onRetry={refetch} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("Datatables")}
        description={t("Manage custom datatables")}
        actions={
          <Button onClick={() => navigate("/datatables/new")}>
            <Plus className="mr-2 h-4 w-4" /> {t("New Datatable")}
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>{t("All Datatables")}</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={datatables}
            onRowClick={handleRowClick}
            loading={isLoading}
            emptyState={{ message: t("No datatables found.") }}
          />
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}
        title={t("Delete Datatable")}
        description={t("Are you sure you want to delete this datatable? This action cannot be undone.")}
        confirmLabel={t("Delete")}
        onConfirm={handleDelete}
        variant="destructive"
        loading={deleteMutation.isPending}
      />
    </div>
  );
};

export default DatatableListPage;
