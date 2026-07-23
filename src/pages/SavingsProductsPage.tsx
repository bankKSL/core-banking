import React, { useState, useMemo } from "react";
import { Plus, Search, Pencil, AlertTriangle } from "lucide-react";
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
import { useSavingsProducts, createSavingsProduct, updateSavingsProduct } from "@/features/deposits";
import type { SavingsProduct, SavingsProductCreateRequest } from "@/features/deposits";

const CURRENCY_OPTIONS = ["LAK", "THB", "CNY", "USD"];

const SavingsProductsPage: React.FC = () => {
  const { data: products = [], isLoading, isError, error, refetch } = useSavingsProducts();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Partial<SavingsProductCreateRequest>>({});
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
      currencyCode: "USD",
      digitsAfterDecimal: 2,
      nominalAnnualInterestRate: 0,
    });
    setErrors({});
    setDialogOpen(true);
  };

  const openEdit = (p: SavingsProduct) => {
    setEditingId(p.id);
    setForm({
      name: p.name,
      shortName: p.shortName ?? "",
      description: p.description,
      currencyCode: p.currency.code,
      digitsAfterDecimal: p.currency.decimalPlaces ?? 2,
      nominalAnnualInterestRate: p.nominalAnnualInterestRate,
    });
    setErrors({});
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const e: Record<string, string> = {};
    if (!form.name?.trim()) e.name = "Product name is required";
    if (!form.shortName?.trim()) e.shortName = "Short name is required";
    if (!form.currencyCode) e.currencyCode = "Currency is required";
    if (form.digitsAfterDecimal == null || form.digitsAfterDecimal < 0)
      e.digitsAfterDecimal = "Valid decimal places required";
    if (form.nominalAnnualInterestRate == null || form.nominalAnnualInterestRate < 0)
      e.nominalAnnualInterestRate = "Interest rate is required";
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    setSaving(true);
    try {
      const payload = {
        name: form.name!,
        shortName: form.shortName!,
        description: form.description || undefined,
        currencyCode: form.currencyCode!,
        digitsAfterDecimal: form.digitsAfterDecimal!,
        nominalAnnualInterestRate: form.nominalAnnualInterestRate!,
        interestCompoundingPeriodType: 4,
        interestPostingPeriodType: 4,
        interestCalculationType: 1,
        interestCalculationDaysInYearType: 365,
        accountingRule: 1,
        locale: "en",
      };
      if (editingId) {
        await updateSavingsProduct(editingId, payload);
      } else {
        await createSavingsProduct(payload);
      }
      setDialogOpen(false);
      refetch();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const columns: ColumnDef<SavingsProduct>[] = [
    { key: "name", header: "Name", cell: (r) => <span className="font-semibold">{r.name}</span> },
    { key: "shortName", header: "Code", cell: (r) => <code className="text-xs">{r.shortName ?? "—"}</code> },
    { key: "currency.code", header: "Currency", cell: (r) => <code className="text-xs">{r.currency.code}</code> },
    {
      key: "nominalAnnualInterestRate",
      header: "Rate",
      cell: (r) => <span className="font-mono">{r.nominalAnnualInterestRate ?? 0}%</span>,
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
        title="Savings Products"
        description="Manage savings products available in the system"
        actions={
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Create Product
          </Button>
        }
      />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Products</CardTitle>
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <DataTable columns={columns} data={filtered} emptyState={{ message: "No savings products found" }} />
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit" : "Create"} Savings Product</DialogTitle>
            <DialogDescription>Fields marked with * are required.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="col-span-2">
              <Input
                label="Product Name *"
                value={form.name ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                error={errors.name}
              />
            </div>
            <Input
              label="Short Name *"
              value={form.shortName ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, shortName: e.target.value }))}
              error={errors.shortName}
              placeholder="No spaces (e.g. REGSAV01)"
            />
            <div>
              <label className="text-sm font-medium">Currency *</label>
              <Select
                value={form.currencyCode ?? "USD"}
                onValueChange={(v) => setForm((f) => ({ ...f, currencyCode: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCY_OPTIONS.map((c) => (
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
              label="Nominal Annual Rate (%) *"
              type="number"
              step="0.01"
              value={form.nominalAnnualInterestRate ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, nominalAnnualInterestRate: Number(e.target.value) }))}
              error={errors.nominalAnnualInterestRate}
            />
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

export default SavingsProductsPage;
