import React, { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Play, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable, type ColumnDef } from "@/components/shared/DataTable";
import { ErrorState } from "@/components/shared/ErrorState";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useReports, useDeleteReport } from "../hooks/useReports";
import { ReportRunDialog } from "./ReportRunDialog";
import type { Report } from "../api/reports";

const ReportListPage: React.FC = () => {
  const navigate = useNavigate();
  const [deleteTarget, setDeleteTarget] = useState<Report | null>(null);
  const [runTarget, setRunTarget] = useState<Report | null>(null);

  const { data: reports, isLoading, isError, refetch } = useReports();
  const deleteMutation = useDeleteReport();

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
    } catch {
      // handled by mutation
    }
  }, [deleteTarget, deleteMutation]);

  const columns: ColumnDef<Report>[] = useMemo(
    () => [
      { key: "reportName", header: "Report Name", accessorFn: (row) => row.reportName ?? "—" },
      { key: "reportType", header: "Type", accessorFn: (row) => row.reportType ?? "—" },
      { key: "reportCategory", header: "Category", accessorFn: (row) => row.reportCategory ?? "—" },
      {
        key: "coreReport",
        header: "Core",
        accessorFn: (row) =>
          row.coreReport ? <Badge variant="default">Yes</Badge> : <Badge variant="default">No</Badge>,
      },
      {
        key: "useReport",
        header: "Active",
        accessorFn: (row) =>
          row.useReport ? <Badge variant="default">Yes</Badge> : <Badge variant="default">No</Badge>,
      },
      {
        key: "actions",
        header: "Actions",
        cell: (row) => (
          <div className="flex items-center gap-2">
            <Button
              variant="default"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setRunTarget(row);
              }}
            >
              <Play className="h-4 w-4" />
            </Button>
            {!row.coreReport && (
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
            )}
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
          title="Reports"
          description="Manage report definitions"
          actions={
            <Button onClick={() => navigate("/reports/new")}>
              <Plus className="mr-2 h-4 w-4" /> New Report
            </Button>
          }
        />
        <ErrorState message="Failed to load reports." onRetry={refetch} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Manage report definitions"
        actions={
          <Button onClick={() => navigate("/reports/new")}>
            <Plus className="mr-2 h-4 w-4" /> New Report
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>All Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={reports ?? []}
            onRowClick={(row) => navigate(`/reports/${row.id}`)}
            loading={isLoading}
            emptyState={{ message: "No reports found." }}
          />
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title="Delete Report"
        description={`Are you sure you want to delete "${deleteTarget?.reportName}"?`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        variant="destructive"
        loading={deleteMutation.isPending}
      />

      <ReportRunDialog
        report={runTarget}
        open={!!runTarget}
        onOpenChange={(open) => { if (!open) setRunTarget(null); }}
      />
    </div>
  );
};

export default ReportListPage;
