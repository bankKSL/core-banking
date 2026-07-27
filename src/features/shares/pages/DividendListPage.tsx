import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, ThumbsUp, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DataTable, type ColumnDef } from "@/components/shared/DataTable";
import { ErrorState } from "@/components/shared/ErrorState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useShareProducts, useDividends, useCreateDividend, useApproveDividend, useDeleteDividend } from "../hooks/useShares";
import type { Dividend } from "../api/shares";

function formatAmount(amount?: number | null): string {
  if (amount == null) return "—";
  return amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

const DividendListPage = () => {
  const navigate = useNavigate();
  const { data: products } = useShareProducts();
  const [selectedProductId, setSelectedProductId] = useState<string>("");

  const productIdNum = selectedProductId ? Number(selectedProductId) : undefined;
  const { data: dividends, isLoading, isError, refetch } = useDividends(productIdNum);

  const createMutation = useCreateDividend();
  const approveMutation = useApproveDividend();
  const deleteMutation = useDeleteDividend();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createForm, setCreateForm] = useState({
    dividendPeriodStartDate: "",
    dividendPeriodEndDate: "",
    amount: "",
  });

  const [approveTarget, setApproveTarget] = useState<Dividend | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Dividend | null>(null);

  const dividendList = useMemo(() => dividends ?? [], [dividends]);

  const columns: ColumnDef<Dividend>[] = useMemo(
    () => [
      { key: "id", header: "ID" },
      {
        key: "amount",
        header: "Amount",
        accessorFn: (row) => formatAmount(row.amount),
      },
      {
        key: "dividendPeriodStartDate",
        header: "Period Start",
        accessorFn: (row) => formatDate(row.dividendPeriodStartDate),
      },
      {
        key: "dividendPeriodEndDate",
        header: "Period End",
        accessorFn: (row) => formatDate(row.dividendPeriodEndDate),
      },
      {
        key: "status",
        header: "Status",
        accessorFn: (row) => <StatusBadge status={row.status?.code?.toLowerCase() ?? "unknown"} />,
      },
      {
        key: "actions",
        header: "",
        className: "w-[120px]",
        cell: (row) => (
          <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
            {row.status?.initiated && (
              <>
                <Button variant="ghost" size="icon" onClick={() => setApproveTarget(row)}>
                  <ThumbsUp className="h-4 w-4 text-emerald-500" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(row)}>
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </>
            )}
          </div>
        ),
      },
    ],
    [],
  );

  const handleCreateDividend = useCallback(async () => {
    if (!productIdNum) return;
    try {
      await createMutation.mutateAsync({
        productId: productIdNum,
        payload: {
          dividendPeriodStartDate: createForm.dividendPeriodStartDate,
          dividendPeriodEndDate: createForm.dividendPeriodEndDate,
          amount: Number(createForm.amount),
          dateFormat: "dd MMMM yyyy",
          locale: "en",
        },
      });
      setShowCreateDialog(false);
      setCreateForm({ dividendPeriodStartDate: "", dividendPeriodEndDate: "", amount: "" });
    } catch {
      // handled by mutation
    }
  }, [productIdNum, createForm, createMutation]);

  const handleApprove = useCallback(async () => {
    if (!approveTarget || !productIdNum) return;
    try {
      await approveMutation.mutateAsync({ productId: productIdNum, dividendId: approveTarget.id });
    } catch {
      // handled by mutation
    }
    setApproveTarget(null);
  }, [approveTarget, productIdNum, approveMutation]);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget || !productIdNum) return;
    try {
      await deleteMutation.mutateAsync({ productId: productIdNum, dividendId: deleteTarget.id });
    } catch {
      // handled by mutation
    }
    setDeleteTarget(null);
  }, [deleteTarget, productIdNum, deleteMutation]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dividends"
        description="Manage share product dividends"
        actions={
          <Button variant="outline" onClick={() => navigate("/shares/products")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Products
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Select Product</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <Label>Share Product</Label>
              <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a product" />
                </SelectTrigger>
                <SelectContent>
                  {(products ?? []).map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedProductId && (
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="mr-2 h-4 w-4" /> Create Dividend
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedProductId && (
        <Card>
          <CardHeader>
            <CardTitle>Dividends</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={columns}
              data={dividendList}
              loading={isLoading}
              emptyState={{ message: "No dividends found for this product." }}
            />
          </CardContent>
        </Card>
      )}

      {!selectedProductId && (
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-sm text-gray-500">Select a share product to view its dividends.</p>
          </CardContent>
        </Card>
      )}

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Dividend</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="periodStart">Period Start Date</Label>
              <Input
                id="periodStart"
                type="date"
                value={createForm.dividendPeriodStartDate}
                onChange={(e) => setCreateForm((v) => ({ ...v, dividendPeriodStartDate: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="periodEnd">Period End Date</Label>
              <Input
                id="periodEnd"
                type="date"
                value={createForm.dividendPeriodEndDate}
                onChange={(e) => setCreateForm((v) => ({ ...v, dividendPeriodEndDate: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={createForm.amount}
                onChange={(e) => setCreateForm((v) => ({ ...v, amount: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateDividend} disabled={!createForm.amount || !createForm.dividendPeriodStartDate || !createForm.dividendPeriodEndDate}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!approveTarget}
        onOpenChange={(open) => { if (!open) setApproveTarget(null); }}
        title="Approve Dividend"
        description="Are you sure you want to approve this dividend?"
        confirmLabel="Approve"
        onConfirm={handleApprove}
        loading={approveMutation.isPending}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title="Delete Dividend"
        description="Are you sure you want to delete this dividend?"
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDelete}
        loading={deleteMutation.isPending}
      />
    </div>
  );
};

export default DividendListPage;
