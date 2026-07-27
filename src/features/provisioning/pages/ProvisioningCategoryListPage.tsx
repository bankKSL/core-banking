import React, { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, type ColumnDef } from "@/components/shared/DataTable";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/shared/ErrorState";
import { useProvisioningCategories, useDeleteProvisioningCategory } from "../hooks/useProvisioning";
import type { ProvisioningCategory } from "../api/provisioning";

const ProvisioningCategoryListPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: categories = [], isLoading, isError, refetch } = useProvisioningCategories();
  const deleteMutation = useDeleteProvisioningCategory();
  const [deleteTarget, setDeleteTarget] = useState<ProvisioningCategory | null>(null);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
    } catch {
      // handled by mutation
    }
    setDeleteTarget(null);
  }, [deleteTarget, deleteMutation]);

  const columns: ColumnDef<ProvisioningCategory>[] = useMemo(
    () => [
      {
        key: "categoryName",
        header: "Name",
        accessorFn: (row) => <span className="font-medium">{row.categoryName}</span>,
      },
      {
        key: "categoryDescription",
        header: "Description",
        accessorFn: (row) => row.categoryDescription ?? "—",
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
              onClick={() => navigate(`/provisioning/categories/edit/${row.id}`)}
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
    (row: ProvisioningCategory) => {
      navigate(`/provisioning/categories/edit/${row.id}`);
    },
    [navigate],
  );

  if (isError) {
    return (
      <div className="p-6">
        <PageHeader
          title="Provisioning Categories"
          description="Manage provisioning categories"
          actions={
            <Button onClick={() => navigate("/provisioning/categories/new")}>
              <Plus className="mr-2 h-4 w-4" /> New Category
            </Button>
          }
        />
        <ErrorState message="Failed to load provisioning categories." onRetry={refetch} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Provisioning Categories"
        description="Manage provisioning categories"
        actions={
          <Button onClick={() => navigate("/provisioning/categories/new")}>
            <Plus className="mr-2 h-4 w-4" /> New Category
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>All Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={categories}
            onRowClick={handleRowClick}
            loading={isLoading}
            emptyState={{ message: "No provisioning categories found." }}
          />
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}
        title="Delete Category"
        description={`Are you sure you want to delete "${deleteTarget?.categoryName}"?`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        variant="destructive"
        loading={deleteMutation.isPending}
      />
    </div>
  );
};

export default ProvisioningCategoryListPage;
