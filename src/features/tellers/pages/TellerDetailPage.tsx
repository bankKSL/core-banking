import { type FC, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Pencil, Trash2, Plus, DollarSign, Landmark, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { DataTable, type ColumnDef } from "@/components/shared/DataTable";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import {
  useTeller,
  useCashiers,
  useCashierTemplate,
  useCreateCashier,
  useDeleteCashier,
  useAllocateCash,
  useSettleCash,
  useCashierTransactions,
} from "../index";
import type { Cashier } from "../types/teller";

const STATUS_LABELS: Record<number, string> = { 100: "Pending", 300: "Active", 400: "Inactive", 600: "Closed" };

const TellerDetailPage: FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: teller, isLoading } = useTeller(id);
  const { data: cashiers = [], isLoading: cashiersLoading } = useCashiers(id);
  const { data: template } = useCashierTemplate(id!);
  const createCashierMutation = useCreateCashier();
  const deleteCashierMutation = useDeleteCashier();
  const allocateMutation = useAllocateCash();
  const settleMutation = useSettleCash();

  const [cashierDialogOpen, setCashierDialogOpen] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [cashierStartDate, setCashierStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [cashierEndDate, setCashierEndDate] = useState(new Date().toISOString().split("T")[0]);
  const [isFullDay, setIsFullDay] = useState(true);
  const [cashierDescription, setCashierDescription] = useState("");

  const [deleteCashierId, setDeleteCashierId] = useState<number | null>(null);

  const [cashTxnDialog, setCashTxnDialog] = useState<{ cashierId: number; type: "allocate" | "settle" } | null>(null);
  const [txnAmount, setTxnAmount] = useState("");
  const [txnDate, setTxnDate] = useState(new Date().toISOString().split("T")[0]);
  const [txnNote, setTxnNote] = useState("");

  const [selectedCashierTxns, setSelectedCashierTxns] = useState<number | null>(null);
  const { data: cashierTxns } = useCashierTransactions(
    id,
    selectedCashierTxns != null ? String(selectedCashierTxns) : undefined,
  );

  const handleCreateCashier = useCallback(async () => {
    if (!id || !selectedStaffId) return;
    await createCashierMutation.mutateAsync({
      tellerId: id,
      payload: {
        staffId: Number(selectedStaffId),
        startDate: cashierStartDate,
        endDate: cashierEndDate,
        isFullDay,
        description: cashierDescription || undefined,
        locale: "en",
        dateFormat: "yyyy-MM-dd",
      },
    });
    setCashierDialogOpen(false);
    setSelectedStaffId("");
  }, [id, selectedStaffId, cashierStartDate, cashierEndDate, isFullDay, cashierDescription, createCashierMutation]);

  const handleCashTxn = useCallback(async () => {
    if (!id || !cashTxnDialog || !txnAmount) return;
    const payload = {
      txnDate,
      txnAmount: Number(txnAmount),
      currencyCode: "USD",
      txnNote: txnNote || "Cash operation",
      locale: "en",
      dateFormat: "yyyy-MM-dd",
    };
    if (cashTxnDialog.type === "allocate") {
      await allocateMutation.mutateAsync({ tellerId: id, cashierId: cashTxnDialog.cashierId, payload });
    } else {
      await settleMutation.mutateAsync({ tellerId: id, cashierId: cashTxnDialog.cashierId, payload });
    }
    setCashTxnDialog(null);
    setTxnAmount("");
    setTxnNote("");
  }, [id, cashTxnDialog, txnAmount, txnDate, txnNote, allocateMutation, settleMutation]);

  const cashierColumns: ColumnDef<Cashier>[] = [
    {
      key: "staffName",
      header: "Staff",
      cell: (r) => <span className="font-medium">{r.staffName ?? `#${r.staffId}`}</span>,
    },
    {
      key: "isFullDay",
      header: "Schedule",
      cell: (r) =>
        r.isFullDay
          ? "Full Day"
          : `${r.hourStartTime ?? "?"}:${r.minStartTime ?? "00"} - ${r.hourEndTime ?? "?"}:${r.minEndTime ?? "00"}`,
    },
    { key: "startDate", header: "From", cell: (r) => new Date(r.startDate).toLocaleDateString() },
    { key: "endDate", header: "To", cell: (r) => new Date(r.endDate).toLocaleDateString() },
    {
      key: "actions",
      header: "",
      cell: (r) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCashTxnDialog({ cashierId: r.id, type: "allocate" })}
            title="Allocate Cash"
          >
            <DollarSign className="h-4 w-4 text-green-500" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCashTxnDialog({ cashierId: r.id, type: "settle" })}
            title="Settle Cash"
          >
            <Landmark className="h-4 w-4 text-amber-500" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setSelectedCashierTxns(r.id)} title="View Transactions">
            Txns
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setDeleteCashierId(r.id)}>
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      ),
    },
  ];

  if (isLoading)
    return (
      <div className="p-6 max-w-4xl m-auto">
        <Skeleton className="h-10 w-48 mb-6" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  if (!teller)
    return (
      <div className="p-6">
        <p className="text-red-600">Teller not found.</p>
      </div>
    );

  return (
    <div className="max-w-4xl m-auto space-y-6">
      <PageHeader
        title={teller.name}
        description={teller.officeName ?? `Office #${teller.officeId}`}
        actions={
          <div className="flex items-center gap-2">
            <Badge variant={teller.status === 300 ? "success" : teller.status === 600 ? "default" : "info"}>
              {STATUS_LABELS[teller.status]}
            </Badge>
            <Button variant="outline" size="sm" onClick={() => navigate(`/tellers/edit/${teller.id}`)}>
              <Pencil className="mr-1 h-4 w-4" />
              Edit
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate("/tellers")}>
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back
            </Button>
          </div>
        }
      />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Cashiers</CardTitle>
          <Button size="sm" onClick={() => setCashierDialogOpen(true)}>
            <Plus className="mr-1 h-4 w-4" />
            Assign Cashier
          </Button>
        </CardHeader>
        <CardContent>
          {cashiersLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <DataTable
              columns={cashierColumns}
              data={cashiers ?? []}
              emptyState={{ message: "No cashiers assigned." }}
              minWidth={700}
            />
          )}
        </CardContent>
      </Card>

      {selectedCashierTxns && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Cashier Transactions</CardTitle>
            <Button variant="outline" size="sm" onClick={() => setSelectedCashierTxns(null)}>
              Close
            </Button>
          </CardHeader>
          <CardContent>
            {cashierTxns && cashierTxns.length > 0 ? (
              <div className="space-y-2">
                {cashierTxns.map((t) => (
                  <div key={t.id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                    <span className="font-medium">
                      {t.txnType === 101
                        ? "Allocate"
                        : t.txnType === 102
                          ? "Settle"
                          : t.txnType === 103
                            ? "Cash In"
                            : t.txnType === 104
                              ? "Cash Out"
                              : `Type ${t.txnType}`}
                    </span>
                    <span className="font-mono">${Number(t.txnAmount).toFixed(2)}</span>
                    <span className="text-gray-500">{t.txnDate ? new Date(t.txnDate).toLocaleDateString() : "—"}</span>
                    <span className="text-gray-400 text-xs">{t.txnNote ?? "—"}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No transactions for this cashier.</p>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={cashierDialogOpen} onOpenChange={setCashierDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Cashier</DialogTitle>
            <DialogDescription>Assign a staff member as cashier to this teller.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <Label>Staff *</Label>
              <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select staff" />
                </SelectTrigger>
                <SelectContent>
                  {template?.staffOptions?.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label>Start Date</Label>
                <Input type="date" value={cashierStartDate} onChange={(e) => setCashierStartDate(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>End Date</Label>
                <Input type="date" value={cashierEndDate} onChange={(e) => setCashierEndDate(e.target.value)} />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch id="isFullDay" checked={isFullDay} onCheckedChange={setIsFullDay} />
              <Label htmlFor="isFullDay">Full Day</Label>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Description</Label>
              <Input
                value={cashierDescription}
                onChange={(e) => setCashierDescription(e.target.value)}
                placeholder="Optional"
              />
            </div>
            <Button onClick={handleCreateCashier} disabled={!selectedStaffId || createCashierMutation.isPending}>
              {createCashierMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Assign Cashier
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!cashTxnDialog} onOpenChange={() => setCashTxnDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{cashTxnDialog?.type === "allocate" ? "Allocate Cash" : "Settle Cash"}</DialogTitle>
            <DialogDescription>
              {cashTxnDialog?.type === "allocate" ? "Assign cash to the cashier." : "Settle cash from the cashier."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <Label>Amount *</Label>
              <Input type="number" step="0.01" value={txnAmount} onChange={(e) => setTxnAmount(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Date</Label>
              <Input type="date" value={txnDate} onChange={(e) => setTxnDate(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Note *</Label>
              <Input value={txnNote} onChange={(e) => setTxnNote(e.target.value)} placeholder="e.g. Starting cash" />
            </div>
            <Button
              onClick={handleCashTxn}
              disabled={!txnAmount || !txnNote || allocateMutation.isPending || settleMutation.isPending}
            >
              {(allocateMutation.isPending || settleMutation.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {cashTxnDialog?.type === "allocate" ? "Allocate" : "Settle"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteCashierId}
        onOpenChange={() => setDeleteCashierId(null)}
        onConfirm={async () => {
          if (deleteCashierId && id) {
            await deleteCashierMutation.mutateAsync({ tellerId: id, cashierId: deleteCashierId });
            setDeleteCashierId(null);
          }
        }}
        title="Remove Cashier"
        description="Remove this cashier from the teller?"
        variant="destructive"
        confirmLabel="Remove"
      />
    </div>
  );
};

export default TellerDetailPage;
