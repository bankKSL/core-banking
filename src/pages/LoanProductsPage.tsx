import React, { useState, useMemo, useCallback } from "react";
import { Plus, Search, Pencil, Trash2, Shield, Percent, Clock, Banknote } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, type ColumnDef } from "@/components/shared/DataTable";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { loanProducts } from "@/mock/data";
import type { LoanProduct, LoanProductType, InterestType } from "@/types";

const TYPE_LABELS: Record<LoanProductType, string> = {
  personal_loan: "Personal Loan",
  mortgage: "Mortgage",
  auto_loan: "Auto Loan",
  business_loan: "Business Loan",
  education_loan: "Education Loan",
  home_equity: "Home Equity",
};

const INTEREST_LABELS: Record<InterestType, string> = {
  fixed: "Fixed Rate",
  floating: "Floating Rate",
  reducing_balance: "Reducing Balance",
  flat: "Flat Rate",
};

const LoanProductsPage: React.FC = () => {
  const [products, setProducts] = useState<LoanProduct[]>(loanProducts);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<LoanProduct | null>(null);
  const [form, setForm] = useState<Partial<LoanProduct>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        TYPE_LABELS[p.type].toLowerCase().includes(q),
    );
  }, [products, search]);

  const openCreate = () => {
    setEditingId(null);
    setForm({
      name: "", type: "personal_loan", description: "",
      minAmount: 0, maxAmount: 0, minTenure: 6, maxTenure: 60,
      interestType: "reducing_balance", baseInterestRate: 0,
      processingFeePercent: 0, latePaymentPenaltyPercent: 0, prepaymentPenaltyPercent: 0,
      isActive: true, requiresCollateral: false, minCreditScore: 600, gracePeriodDays: 7,
    });
    setErrors({});
    setDialogOpen(true);
  };

  const openEdit = (p: LoanProduct) => {
    setEditingId(p.id);
    setForm({ ...p });
    setErrors({});
    setDialogOpen(true);
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.name?.trim()) e.name = "Required";
    if (!form.description?.trim()) e.description = "Required";
    if ((form.minAmount ?? 0) < 0) e.minAmount = "Must be >= 0";
    if ((form.maxAmount ?? 0) <= (form.minAmount ?? 0)) e.maxAmount = "Must be > min amount";
    if ((form.baseInterestRate ?? 0) <= 0) e.baseInterestRate = "Must be > 0";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = useCallback(() => {
    if (!validate()) return;
    const now = new Date().toISOString();
    if (editingId) {
      setProducts((prev) =>
        prev.map((p) => (p.id === editingId ? { ...p, ...form, updatedAt: now } as LoanProduct : p)),
      );
    } else {
      const newProduct: LoanProduct = {
        id: `lp-${Date.now()}`,
        createdAt: now, updatedAt: now,
        ...form,
      } as LoanProduct;
      setProducts((prev) => [...prev, newProduct]);
    }
    setDialogOpen(false);
  }, [form, editingId]);

  const handleDelete = useCallback(() => {
    if (deleteTarget) setProducts((prev) => prev.filter((p) => p.id !== deleteTarget.id));
    setDeleteTarget(null);
  }, [deleteTarget]);

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

  const columns: ColumnDef<LoanProduct>[] = [
    {
      key: "name", header: "Product Name",
      cell: (row) => <span className="font-medium text-gray-900 dark:text-gray-100">{row.name}</span>,
    },
    {
      key: "type", header: "Type",
      cell: (row) => (
        <Badge variant="info" size="sm">{TYPE_LABELS[row.type]}</Badge>
      ),
    },
    {
      key: "amount", header: "Amount Range",
      cell: (row) => <span className="text-xs font-mono">{formatCurrency(row.minAmount)} - {formatCurrency(row.maxAmount)}</span>,
    },
    {
      key: "tenure", header: "Tenure",
      cell: (row) => <span className="text-xs">{row.minTenure}-{row.maxTenure} months</span>,
    },
    {
      key: "interestType", header: "Interest",
      cell: (row) => (
        <div>
          <span className="text-xs text-gray-500">{INTEREST_LABELS[row.interestType]}</span>
          <p className="text-sm font-semibold">{row.baseInterestRate}%</p>
        </div>
      ),
    },
    {
      key: "requiresCollateral", header: "Collateral",
      cell: (row) => row.requiresCollateral
        ? <Shield className="h-4 w-4 text-amber-600" />
        : <span className="text-xs text-gray-400">None</span>,
    },
    {
      key: "minCreditScore", header: "Min Score",
      cell: (row) => <span className="text-xs font-mono">{row.minCreditScore}</span>,
    },
    {
      key: "isActive", header: "Status",
      cell: (row) => (
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
          row.isActive ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"
        }`}>
          {row.isActive ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      key: "actions", header: "Actions",
      cell: (row) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); openEdit(row); }}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600"
            onClick={(e) => { e.stopPropagation(); setDeleteTarget(row); }}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Loan Products"
        description="Configure lending products with interest types, amortization, and eligibility criteria"
        actions={<Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" />New Loan Product</Button>}
      />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Loan Products</CardTitle>
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input placeholder="Search loan products..." value={search}
              onChange={(e) => setSearch(e.target.value)} className="pl-10" />
          </div>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={filtered} emptyState={{ message: "No loan products found" }} />
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Loan Product" : "New Loan Product"}</DialogTitle>
            <DialogDescription>Configure the lending product parameters below.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2 max-h-[60vh] overflow-y-auto">
            <div className="col-span-2">
              <Input label="Product Name" placeholder="e.g. Home Mortgage - Prime" value={form.name ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} error={errors.name} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">Type</label>
              <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v as LoanProductType }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(TYPE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">Interest Type</label>
              <Select value={form.interestType} onValueChange={(v) => setForm((f) => ({ ...f, interestType: v as InterestType }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(INTEREST_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Input label="Min Amount" type="number" value={form.minAmount ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, minAmount: Number(e.target.value) }))} error={errors.minAmount} />
            <Input label="Max Amount" type="number" value={form.maxAmount ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, maxAmount: Number(e.target.value) }))} error={errors.maxAmount} />
            <Input label="Min Tenure (mo)" type="number" value={form.minTenure ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, minTenure: Number(e.target.value) }))} />
            <Input label="Max Tenure (mo)" type="number" value={form.maxTenure ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, maxTenure: Number(e.target.value) }))} />
            <Input label="Base Interest Rate (%)" type="number" step="0.01" value={form.baseInterestRate ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, baseInterestRate: Number(e.target.value) }))} error={errors.baseInterestRate} />
            <Input label="Processing Fee (%)" type="number" step="0.01" value={form.processingFeePercent ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, processingFeePercent: Number(e.target.value) }))} />
            <Input label="Late Penalty (%)" type="number" step="0.01" value={form.latePaymentPenaltyPercent ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, latePaymentPenaltyPercent: Number(e.target.value) }))} />
            <Input label="Prepayment Penalty (%)" type="number" step="0.01" value={form.prepaymentPenaltyPercent ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, prepaymentPenaltyPercent: Number(e.target.value) }))} />
            <Input label="Min Credit Score" type="number" value={form.minCreditScore ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, minCreditScore: Number(e.target.value) }))} />
            <Input label="Grace Period (days)" type="number" value={form.gracePeriodDays ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, gracePeriodDays: Number(e.target.value) }))} />
            {form.type === "mortgage" || form.type === "home_equity" ? (
              <Input label="Max LTV Ratio (%)" type="number" value={form.maxLTVRatio ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, maxLTVRatio: Number(e.target.value) }))} />
            ) : <div />}
            <div className="col-span-2 flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Requires Collateral</p>
                <p className="text-xs text-gray-500">Enable if collateral is mandatory</p>
              </div>
              <Switch checked={form.requiresCollateral ?? false}
                onCheckedChange={(v) => setForm((f) => ({ ...f, requiresCollateral: v }))} />
            </div>
            <div className="col-span-2 flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Active</p>
                <p className="text-xs text-gray-500">Make product available for applications</p>
              </div>
              <Switch checked={form.isActive ?? true}
                onCheckedChange={(v) => setForm((f) => ({ ...f, isActive: v }))} />
            </div>
            <div className="col-span-2">
              <Textarea label="Description" placeholder="Brief product description" value={form.description ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} error={errors.description} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editingId ? "Save Changes" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)} onConfirm={handleDelete}
        title="Delete Loan Product"
        description={`Delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete" variant="destructive" />
    </div>
  );
};

export default LoanProductsPage;
