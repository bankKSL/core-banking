import React, { useState, useMemo } from "react";
import { Plus, Search, Pencil, AlertTriangle, X } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, type ColumnDef } from "@/components/shared/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useFixedDepositProducts,
  useCreateFixedDepositProduct,
  useUpdateFixedDepositProduct,
} from "@/features/deposits";
import type { FixedDepositProduct, FixedDepositProductCreateRequest } from "@/features/deposits";

const CURRENCIES = ["LAK", "THB", "CNY", "USD"];

const DEPOSIT_PERIOD_FREQUENCIES = [
  { id: 0, label: "Days" },
  { id: 1, label: "Weeks" },
  { id: 2, label: "Months" },
  { id: 3, label: "Years" },
];

const CHART_PERIOD_TYPES = [
  { id: 0, label: "Days" },
  { id: 1, label: "Weeks" },
  { id: 2, label: "Months" },
  { id: 3, label: "Years" },
];

const formatDateForApi = (date: Date): string => {
  const day = date.getDate().toString().padStart(2, "0");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${day} ${months[date.getMonth()]} ${date.getFullYear()}`;
};

interface ChartSlabForm {
  description: string;
  periodType: number;
  fromPeriod: number;
  toPeriod: number;
  annualInterestRate: number;
}

const emptySlab = (): ChartSlabForm => ({
  description: "",
  periodType: 2,
  fromPeriod: 0,
  toPeriod: 0,
  annualInterestRate: 0,
});

const FixedDepositProductsPage: React.FC = () => {
  const { data: products = [], isLoading, isError, error, refetch } = useFixedDepositProducts();
  const createMutation = useCreateFixedDepositProduct();
  const updateMutation = useUpdateFixedDepositProduct();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Partial<FixedDepositProductCreateRequest>>({
    name: "",
    shortName: "",
    description: "",
    currencyCode: "USD",
    digitsAfterDecimal: 2,
    depositAmount: 1000,
    minDepositTerm: 1,
    minDepositTermTypeId: 2,
    locale: "en",
  });
  const [slabs, setSlabs] = useState<ChartSlabForm[]>([emptySlab()]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return products.filter((p) => p.name.toLowerCase().includes(q) || (p.description ?? "").toLowerCase().includes(q));
  }, [products, search]);

  const openCreate = () => {
    setEditingId(null);
    setForm({
      name: "",
      shortName: "",
      description: "",
      currencyCode: "USD",
      digitsAfterDecimal: 2,
      depositAmount: 1000,
      minDepositTerm: 1,
      minDepositTermTypeId: 2,
      locale: "en",
    });
    setSlabs([emptySlab()]);
    setErrors({});
    setDialogOpen(true);
  };

  const openEdit = (product: FixedDepositProduct) => {
    setEditingId(product.id);
    setForm({
      name: product.name,
      shortName: product.shortName ?? "",
      description: product.description ?? "",
      currencyCode: product.currency.code,
      digitsAfterDecimal: product.currency.decimalPlaces ?? 2,
      depositAmount: 0,
      minDepositTerm: product.minDepositTerm,
      minDepositTermTypeId: product.minDepositTermType?.id ?? 2,
      locale: "en",
    });
    if (product.activeChart?.chartSlabs?.length) {
      setSlabs(
        product.activeChart.chartSlabs.map((s) => ({
          description: s.description,
          periodType: s.periodType?.id ?? 2,
          fromPeriod: s.fromPeriod,
          toPeriod: s.toPeriod,
          annualInterestRate: s.annualInterestRate,
        })),
      );
    } else {
      setSlabs([emptySlab()]);
    }
    setErrors({});
    setDialogOpen(true);
  };

  const updateSlab = (index: number, field: keyof ChartSlabForm, value: string | number) => {
    setSlabs((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const addSlab = () => setSlabs((prev) => [...prev, emptySlab()]);
  const removeSlab = (index: number) => setSlabs((prev) => prev.filter((_, i) => i !== index));

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.name?.trim()) e.name = "Product name is required";
    if (!form.shortName?.trim()) e.shortName = "Short name is required";
    if (!form.currencyCode) e.currencyCode = "Currency is required";
    if (form.digitsAfterDecimal == null || form.digitsAfterDecimal < 0)
      e.digitsAfterDecimal = "Valid decimal places required";
    if (!form.depositAmount || form.depositAmount <= 0) e.depositAmount = "Deposit amount is required";
    if (!form.minDepositTerm || form.minDepositTerm <= 0) e.minDepositTerm = "Min deposit term is required";
    if (!form.minDepositTermTypeId) e.minDepositTermTypeId = "Term type is required";
    slabs.forEach((s, i) => {
      if (!s.description?.trim()) e[`slab_${i}_desc`] = `Slab ${i + 1}: description required`;
      if (s.annualInterestRate == null || s.annualInterestRate < 0)
        e[`slab_${i}_rate`] = `Slab ${i + 1}: rate required`;
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);

    const payload: any = {
      name: form.name!,
      shortName: form.shortName!,
      description: form.description || undefined,
      currencyCode: form.currencyCode!,
      digitsAfterDecimal: form.digitsAfterDecimal!,
      inMultiplesOf: 0,
      interestCompoundingPeriodType: 1,
      interestPostingPeriodType: 4,
      interestCalculationType: 1,
      interestCalculationDaysInYearType: 365,
      accountingRule: 1,
      minDepositTerm: form.minDepositTerm!,
      minDepositTermTypeId: form.minDepositTermTypeId!,
      depositAmount: form.depositAmount!,
      locale: "en",
      charts: [
        {
          fromDate: formatDateForApi(new Date()),
          dateFormat: "dd MMMM yyyy",
          locale: "en",
          chartSlabs: slabs.map((s) => ({
            description: s.description,
            periodType: s.periodType,
            fromPeriod: s.fromPeriod,
            toPeriod: s.toPeriod,
            annualInterestRate: s.annualInterestRate,
          })),
        },
      ],
    };

    try {
      if (editingId) {
        await updateMutation.mutateAsync({ productId: editingId, payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      setDialogOpen(false);
    } catch {
      // Error is handled globally by ApiErrorHandler → toast
    } finally {
      setSaving(false);
    }
  };

  const columns: ColumnDef<FixedDepositProduct>[] = [
    { key: "name", header: "Name", cell: (r) => <span className="font-semibold">{r.name}</span> },
    { key: "shortName", header: "Code", cell: (r) => <code className="text-xs">{r.shortName ?? "—"}</code> },
    { key: "currency.code", header: "Currency", cell: (r) => <code className="text-xs">{r.currency.code}</code> },
    {
      key: "rateRange",
      header: "Rate",
      cell: (r) => (
        <span className="font-mono text-sm">
          {r.activeChart?.chartSlabs?.length
            ? `${Math.min(...r.activeChart.chartSlabs.map((s) => s.annualInterestRate))}% – ${Math.max(...r.activeChart.chartSlabs.map((s) => s.annualInterestRate))}%`
            : "—"}
        </span>
      ),
    },
    {
      key: "minDepositTerm",
      header: "Min Term",
      cell: (r) => `${r.minDepositTerm} ${r.minDepositTermType?.description?.toLowerCase() ?? "mo"}`,
    },
    {
      key: "actions",
      header: "",
      cell: (r) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="sm" className="h-8 w-8" onClick={() => openEdit(r)}>
            <Pencil className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  if (isError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-8 w-8 text-red-500 mb-2" />
          <p className="text-red-600">Failed to load: {String(error)}</p>
          <Button variant="outline" className="mt-2" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Fixed Deposit Products"
        description="Manage fixed deposit products available in the system"
        actions={
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Create FD Product
          </Button>
        }
      />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Products</CardTitle>
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              className="pl-10"
              placeholder="Search by name or description…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-md" />
              ))}
            </div>
          ) : (
            <DataTable columns={columns} data={filtered} />
          )}
        </CardContent>
      </Card>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit" : "Create"} Fixed Deposit Product</DialogTitle>
            <DialogDescription>
              {editingId
                ? "Update the product details and interest rate chart below."
                : "Fields marked with * are required."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 py-4">
            <Input
              label="Product Name *"
              value={form.name ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              error={errors.name}
            />
            <Input
              label="Short Name *"
              value={form.shortName ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, shortName: e.target.value }))}
              error={errors.shortName}
              placeholder="No spaces"
            />

            <div>
              <label className="text-sm font-medium">Currency *</label>
              <Select
                value={form.currencyCode ?? "USD"}
                onValueChange={(v) => setForm((f) => ({ ...f, currencyCode: v }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2">
              <Textarea
                label="Description"
                placeholder="Brief product description"
                value={form.description ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>

            <Input
              label="Decimal Places *"
              type="number"
              value={form.digitsAfterDecimal ?? 2}
              onChange={(e) => setForm((f) => ({ ...f, digitsAfterDecimal: Number(e.target.value) }))}
            />
            <Input
              label="Deposit Amount *"
              type="number"
              value={form.depositAmount ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, depositAmount: Number(e.target.value) }))}
              error={errors.depositAmount}
            />

            <Input
              label="Min Deposit Term *"
              type="number"
              value={form.minDepositTerm ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, minDepositTerm: Number(e.target.value) }))}
              error={errors.minDepositTerm}
            />
            <div>
              <label className="text-sm font-medium">Min Term Type *</label>
              <Select
                value={String(form.minDepositTermTypeId ?? 2)}
                onValueChange={(v) => setForm((f) => ({ ...f, minDepositTermTypeId: Number(v) }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DEPOSIT_PERIOD_FREQUENCIES.map((f) => (
                    <SelectItem key={f.id} value={String(f.id)}>
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Interest Rate Chart Slabs */}
          <div className="border-t pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold">Interest Rate Chart Slabs</h4>
              <Button variant="outline" size="sm" onClick={addSlab} type="button">
                + Add Slab
              </Button>
            </div>

            {slabs.map((slab, i) => (
              <div key={i} className="rounded-lg border p-3 space-y-3 relative">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500">Slab #{i + 1}</span>
                  {slabs.length > 1 && (
                    <button type="button" onClick={() => removeSlab(i)} className="text-red-500 hover:text-red-700">
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="text-xs font-medium">Description</label>
                    <Input
                      placeholder="e.g. from 0 to 90 days"
                      value={slab.description}
                      onChange={(e) => updateSlab(i, "description", e.target.value)}
                    />
                    {errors[`slab_${i}_desc`] && (
                      <p className="text-xs text-red-500 mt-0.5">{errors[`slab_${i}_desc`]}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-xs font-medium">Period Type</label>
                    <Select
                      value={String(slab.periodType)}
                      onValueChange={(v) => updateSlab(i, "periodType", Number(v))}
                    >
                      <SelectTrigger className="mt-0.5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CHART_PERIOD_TYPES.map((pt) => (
                          <SelectItem key={pt.id} value={String(pt.id)}>
                            {pt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs font-medium">Annual Interest Rate (%)</label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="e.g. 4.5"
                      value={slab.annualInterestRate || ""}
                      onChange={(e) => updateSlab(i, "annualInterestRate", parseFloat(e.target.value) || 0)}
                    />
                    {errors[`slab_${i}_rate`] && (
                      <p className="text-xs text-red-500 mt-0.5">{errors[`slab_${i}_rate`]}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-xs font-medium">From Period</label>
                    <Input
                      type="number"
                      placeholder="e.g. 0"
                      value={slab.fromPeriod ?? ""}
                      onChange={(e) => updateSlab(i, "fromPeriod", parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium">To Period</label>
                    <Input
                      type="number"
                      placeholder="e.g. 90"
                      value={slab.toPeriod ?? ""}
                      onChange={(e) => updateSlab(i, "toPeriod", parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : editingId ? "Save Changes" : "Create Product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FixedDepositProductsPage;
