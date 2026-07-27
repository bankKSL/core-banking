import React, { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2, Check, X } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/shared/ErrorState";
import { DataTable, type ColumnDef } from "@/components/shared/DataTable";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Badge } from "@/components/ui/badge";
import { usePaymentTypes, useDeletePaymentType } from "../hooks/usePaymentTypes";
import type { PaymentType } from "../api/payment-types";

const PaymentTypeListPage: React.FC = () => {
  const navigate = useNavigate();
  const [deleteTarget, setDeleteTarget] = useState<PaymentType | null>(null);

  const { data, isLoading, isError, refetch, isRefetching } = usePaymentTypes();

  const paymentTypes = useMemo(() => data?.pageItems ?? [], [data]);

  const deleteMutation = useDeletePaymentType();

  const handleRowClick = useCallback(
    (row: PaymentType) => {
      navigate(`/payment-types/edit/${row.id}`);
    },
    [navigate],
  );

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
    } catch {
      // Error handled by mutation
    }
  }, [deleteTarget, deleteMutation]);

  const columns: ColumnDef<PaymentType>[] = useMemo(
    () => [
      { key: "name", header: "Name" },
      {
        key: "description",
        header: "Description",
        accessorFn: (row) =>
          row.description && row.description.length > 60
            ? `${row.description.slice(0, 60)}...`
            : row.description ?? "—",
      },
      {
        key: "isCashPayment",
        header: "Cash Payment",
        cell: (row) =>
          row.isCashPayment ? (
            <Check className="h-5 w-5 text-emerald-600" />
          ) : (
            <X className="h-5 w-5 text-red-500" />
          ),
      },
      { key: "position", header: "Position" },
      {
        key: "isSystemDefined",
        header: "System Defined",
        cell: (row) =>
          row.isSystemDefined ? (
            <Badge variant="info" size="sm">
              System
            </Badge>
          ) : (
            <Badge variant="default" size="sm">
              Custom
            </Badge>
          ),
      },
      {
        key: "actions",
        header: "",
        cell: (row) => (
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setDeleteTarget(row);
              }}
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        ),
        sortable: false,
      },
    ],
    [],
  );

  if (isError) {
    return (
      <div className="p-6">
        <PageHeader
          title="Payment Types"
          actions={
            <Button onClick={() => navigate("/payment-types/new")}>
              <Plus className="mr-2 h-4 w-4" /> New Payment Type
            </Button>
          }
        />
        <ErrorState message="Failed to load payment types." onRetry={refetch} />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Payment Types"
        actions={
          <Button onClick={() => navigate("/payment-types/new")}>
            <Plus className="mr-2 h-4 w-4" /> New Payment Type
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Payment Types</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={paymentTypes}
            onRowClick={handleRowClick}
            loading={isLoading}
            emptyState={{ message: "No payment types found." }}
          />
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Delete Payment Type"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        variant="destructive"
        loading={deleteMutation.isPending}
      />
    </div>
  );
};

export default PaymentTypeListPage;
