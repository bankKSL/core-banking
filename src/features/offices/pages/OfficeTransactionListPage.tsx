import React, { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, ArrowLeft, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/shared/ErrorState";
import { DataTable, type ColumnDef } from "@/components/shared/DataTable";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useOfficeTransactions, useDeleteOfficeTransaction } from "../hooks/useOfficeTransactions";
import type { OfficeTransaction } from "../api/office-transactions";

function formatAmount(amount?: number): string {
  if (amount == null) return "—";
  return amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const OfficeTransactionListPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: transactions = [], isLoading, isError, refetch } = useOfficeTransactions();
  const deleteMutation = useDeleteOfficeTransaction();

  const [deleteTarget, setDeleteTarget] = useState<OfficeTransaction | null>(null);

  const columns: ColumnDef<OfficeTransaction>[] = useMemo(
    () => [
      {
        key: "fromOffice",
        header: "From Office",
        accessorFn: (row) => row.fromOffice?.name ?? "—",
      },
      {
        key: "toOffice",
        header: "To Office",
        accessorFn: (row) => row.toOffice?.name ?? "—",
      },
      { key: "transactionDate", header: "Date" },
      { key: "currencyCode", header: "Currency" },
      {
        key: "transactionAmount",
        header: "Amount",
        accessorFn: (row) => formatAmount(row.transactionAmount),
      },
      {
        key: "description",
        header: "Description",
        accessorFn: (row) => row.description ?? "—",
        className: "max-w-[200px] truncate",
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

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
    } catch {
      // handled by mutation
    }
    setDeleteTarget(null);
  }, [deleteTarget, deleteMutation]);

  if (isError) {
    return (
      <div className="p-6">
        <PageHeader
          title="Office Transactions"
          description="Money transfers between offices"
          actions={
            <Button variant="outline" onClick={() => navigate("/offices")}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Offices
            </Button>
          }
        />
        <ErrorState message="Failed to load transactions." onRetry={refetch} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Office Transactions"
        description="Money transfers between offices"
        actions={
          <>
            <Button variant="outline" onClick={() => navigate("/offices")}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Offices
            </Button>
            <Button variant="outline" onClick={() => navigate("/office-transactions/new")}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Offices
            </Button>
            <Button onClick={() => navigate("/office-transactions/new")}>
              <Plus className="mr-2 h-4 w-4" /> New Transaction
            </Button>
          </>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>All Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={transactions}
            loading={isLoading}
            emptyState={{ message: "No office transactions found." }}
          />
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Delete Transaction"
        description="Are you sure you want to delete this office transaction?"
        confirmLabel="Delete"
        onConfirm={handleDelete}
        variant="destructive"
        loading={deleteMutation.isPending}
      />
    </div>
  );
};

export default OfficeTransactionListPage;
