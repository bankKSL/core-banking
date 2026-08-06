import React, { useState, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Plus, Edit, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable, type ColumnDef } from "@/components/shared/DataTable";
import { ErrorState } from "@/components/shared/ErrorState";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useAdhocQueries, useDeleteAdhocQuery } from "../hooks/useReports";
import type { AdhocQuery } from "../api/reports";

const AdhocQueryListPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [deleteTarget, setDeleteTarget] = useState<AdhocQuery | null>(null);

  const { data: queries, isLoading, isError, refetch } = useAdhocQueries();
  const deleteMutation = useDeleteAdhocQuery();

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
    } catch {
      // handled by mutation
    }
  }, [deleteTarget, deleteMutation]);

  const columns: ColumnDef<AdhocQuery>[] = useMemo(
    () => [
      { key: "name", header: t("Name"), accessorFn: (row) => row.name ?? "—" },
      { key: "tableName", header: t("Table"), accessorFn: (row) => row.tableName ?? "—" },
      {
        key: "isActive",
        header: t("Active"),
        accessorFn: (row) =>
          row.isActive ? <Badge variant="default">{t("Yes")}</Badge> : <Badge variant="default">{t("No")}</Badge>,
      },
      { key: "email", header: t("Email"), accessorFn: (row) => row.email ?? "—" },
      {
        key: "actions",
        header: t("Actions"),
        cell: (row) => (
          <div className="flex items-center gap-2">
            <Button
              variant="default"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/adhoc-queries/edit/${row.id}`);
              }}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setDeleteTarget(row);
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ],
    [navigate, t],
  );

  if (isError) {
    return (
      <div className="p-6">
        <PageHeader
          title={t("Adhoc Queries")}
          description={t("Manage adhoc query definitions")}
          actions={
            <Button onClick={() => navigate("/adhoc-queries/new")}>
              <Plus className="mr-2 h-4 w-4" /> {t("New Query")}
            </Button>
          }
        />
        <ErrorState message={t("Failed to load adhoc queries.")} onRetry={refetch} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("Adhoc Queries")}
        description={t("Manage adhoc query definitions")}
        actions={
          <Button onClick={() => navigate("/adhoc-queries/new")}>
            <Plus className="mr-2 h-4 w-4" /> {t("New Query")}
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>{t("All Queries")}</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={queries ?? []}
            loading={isLoading}
            emptyState={{ message: t("No adhoc queries found.") }}
          />
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title={t("Delete Adhoc Query")}
        description={`${t("Are you sure you want to delete")} "${deleteTarget?.name}"?`}
        confirmLabel={t("Delete")}
        onConfirm={handleDelete}
        variant="destructive"
        loading={deleteMutation.isPending}
      />
    </div>
  );
};

export default AdhocQueryListPage;
