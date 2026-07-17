import React, { useState, useMemo } from "react";
import { Plus, Search, Pencil, Trash2, Percent, Clock } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, type ColumnDef } from "@/components/shared/DataTable";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useLoanProducts, createLoanProduct, updateLoanProduct } from "@/features/loans";
import type { LoanProduct, LoanProductCreateRequest } from "@/features/loans";

const INTEREST_TYPE_OPTIONS = [
  { id: 0, label: "Flat Rate", code: "Flat" },
  { id: 1, label: "Reducing Balance", code: "Declining Balance" },
];

const AMORTIZATION_OPTIONS = [
  { id: 1, label: "Equal Installments (EMI)", code: "Equal installments" },
  { id: 2, label: "Equal Principal", code: "Equal principal payments" },
];

const REPAYMENT_FREQ_OPTIONS = [
  { id: 0, label: "Daily" },
  { id: 1, label: "Weekly" },
  { id: 2, label: "Monthly" },
  { id: 3, label: "Quarterly" },
  { id: 4, label: "Semi-Annual" },
  { id: 5, label: "Annual" },
];

const CURRENCY_OPTIONS = ["USD", "EUR", "GBP", "INR", "JPY", "AUD"];

const LoanProductsPage: React.FC = () => {
  const { data: products = [], isLoading, isError, error, refetch } = useLoanProducts();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<LoanProduct | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Partial<LoanProductCreateRequest>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return products.filter((p) => p.name.toLowerCase().includes(q) || (p.description ?? "").toLowerCase().includes(q));
  }, [products, search]);

  const openCreate = () => {
    setEditingId(null);
    setForm({ name: "", currencyCode: "USD", principal: 0, numberOfRepayments: 12, repaymentEvery: 1, repaymentFrequencyType: 2, interestRatePerPeriod: 0, amortizationType: 1, interestType: 1, interestCalculationPeriodType: 0, digitsAfterDecimal: 2 });
    setErrors({});
    setDialogOpen(true);
  };

  const openEdit = (p: LoanProduct) => {
    setEditingId(p.id);
    setForm({ name: p.name, shortName: p.shortName, description: p.description, currencyCode: p.currency.code, principal: p.principal, minPrincipal: p.minPrincipal, maxPrincipal: p.maxPrincipal, numberOfRepayments: p.numberOfRepayments, repaymentEvery: p.repaymentEvery, repaymentFrequencyType: p.repaymentFrequencyType.id, interestRatePerPeriod: p.interestRatePerPeriod, amortizationType: p.amortizationType.id, interestType: p.interestType.id, interestCalculationPeriodType: p.interestCalculationPeriodType.id });
    setErrors({});
    setDialogOpen(true);
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.name?.trim()) e.name = "Required";
    if (!(form.principal ?? 0)) e.principal = "Must be > 0";
    if (!(form.numberOfRepayments ?? 0)) e.numberOfRepayments = "Required";
    if (!(form.interestRatePerPeriod ?? 0)) e.interestRatePerPeriod = "Must be >= 0";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      if (editingId) {
        await updateLoanProduct(editingId, form);
      } else {
        await createLoanProduct(form as LoanProductCreateRequest);
      }
      setDialogOpen(false);
      refetch();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (deleteTarget) {
      try { await updateLoanProduct(deleteTarget.id, {}); } catch { /* no-op */ }
      setDeleteTarget(null);
      refetch();
    }
  };

  const formatCurrency = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

  const columns: ColumnDef<LoanProduct>[] = [
    { key: "name", header: "Name", cell: (r) => <span className="font-semibold">{r.name}</span> },
    { key: "currency", header: "Currency", cell: (r) => <code className="text-xs">{r.currency.code}</code> },
    { key: "principal", header: "Principal Range", cell: (r) => <span className="text-sm">{formatCurrency(r.minPrincipal)} – {formatCurrency(r.maxPrincipal)}</span> },
    { key: "numberOfRepayments", header: "Repayments", cell: (r) => `${r.minNumberOfRepayments} – ${r.maxNumberOfRepayments}` },
    { key: "interestRatePerPeriod", header: "Rate", cell: (r) => <span className="font-mono text-sm">{r.interestRatePerPeriod}%</span> },
    { key: "interestType", header: "Interest Type", cell: (r) => <Badge variant="info" size="sm">{r.interestType.value}</Badge> },
    { key: "amortizationType", header: "Amortization", cell: (r) => <span className="text-xs">{r.amortizationType.value}</span> },
    {
      key: "actions", header: "",
      cell: (r) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(r)}><Pencil className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600" onClick={() => setDeleteTarget(r)}><Trash2 className="h-4 w-4" /></Button>
        </div>
      ),
    },
  ];

  if (isError) return <div className="p-8 text-center text-red-600">Failed to load loan products: {String(error)} <Button variant="outline" className="ml-4" onClick={() => refetch()}>Retry</Button></div>;

  return (
    <div className="space-y-6">
      <PageHeader title="Loan Products" description="Configure and manage loan product offerings" actions={<Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" />New Product</Button>} />
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Products</CardTitle>
          <div className="relative w-80"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" /><Input placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" /></div>
        </CardHeader>
        <CardContent>
          {isLoading ? (<div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => (<Skeleton key={i} className="h-12 w-full" />))}</div>) : (
            <DataTable columns={columns} data={filtered} emptyState={{ message: "No loan products found" }} />
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingId ? "Edit" : "Create"} Loan Product</DialogTitle><DialogDescription>Configure the loan product parameters. Financial fields default to your organization currency.</DialogDescription></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <Input label="Product Name *" value={form.name ?? ""} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} error={errors.name} />
            <Input label="Short Code" value={form.shortName ?? ""} onChange={(e) => setForm((f) => ({ ...f, shortName: e.target.value }))} />
            <div className="col-span-2">
              <label className="text-sm font-medium">Currency *</label>
              <Select value={form.currencyCode ?? "USD"} onValueChange={(v) => setForm((f) => ({ ...f, currencyCode: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CURRENCY_OPTIONS.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <Input label="Principal *" type="number" value={form.principal ?? ""} onChange={(e) => setForm((f) => ({ ...f, principal: Number(e.target.value) }))} error={errors.principal} />
            <Input label="Min Principal" type="number" value={form.minPrincipal ?? ""} onChange={(e) => setForm((f) => ({ ...f, minPrincipal: Number(e.target.value) }))} />
            <Input label="Max Principal" type="number" value={form.maxPrincipal ?? ""} onChange={(e) => setForm((f) => ({ ...f, maxPrincipal: Number(e.target.value) }))} />
            <div />
            <Input label="# Repayments *" type="number" value={form.numberOfRepayments ?? ""} onChange={(e) => setForm((f) => ({ ...f, numberOfRepayments: Number(e.target.value) }))} error={errors.numberOfRepayments} />
            <Input label="Repayment Every" type="number" value={form.repaymentEvery ?? ""} onChange={(e) => setForm((f) => ({ ...f, repaymentEvery: Number(e.target.value) }))} />
            <div>
              <label className="text-sm font-medium">Frequency</label>
              <Select value={String(form.repaymentFrequencyType ?? 2)} onValueChange={(v) => setForm((f) => ({ ...f, repaymentFrequencyType: Number(v) }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{REPAYMENT_FREQ_OPTIONS.map((o) => (<SelectItem key={o.id} value={String(o.id)}>{o.label}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <Input label="Min Repayments" type="number" value={form.minNumberOfRepayments ?? ""} onChange={(e) => setForm((f) => ({ ...f, minNumberOfRepayments: Number(e.target.value) }))} />
            <Input label="Max Repayments" type="number" value={form.maxNumberOfRepayments ?? ""} onChange={(e) => setForm((f) => ({ ...f, maxNumberOfRepayments: Number(e.target.value) }))} />
            <div />
            <Input label="Interest Rate (% per period) *" type="number" step="0.01" value={form.interestRatePerPeriod ?? ""} onChange={(e) => setForm((f) => ({ ...f, interestRatePerPeriod: Number(e.target.value) }))} error={errors.interestRatePerPeriod} />
            <div>
              <label className="text-sm font-medium">Interest Type</label>
              <Select value={String(form.interestType ?? 1)} onValueChange={(v) => setForm((f) => ({ ...f, interestType: Number(v) }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{INTEREST_TYPE_OPTIONS.map((o) => (<SelectItem key={o.id} value={String(o.id)}>{o.label}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Amortization</label>
              <Select value={String(form.amortizationType ?? 1)} onValueChange={(v) => setForm((f) => ({ ...f, amortizationType: Number(v) }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{AMORTIZATION_OPTIONS.map((o) => (<SelectItem key={o.id} value={String(o.id)}>{o.label}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Textarea label="Description" placeholder="Brief product description" value={form.description ?? ""} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Saving…" : editingId ? "Save Changes" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Delete Loan Product" description={`Delete "${deleteTarget?.name}"?`} confirmLabel="Delete" variant="destructive" />
    </div>
  );
};

export default LoanProductsPage;
