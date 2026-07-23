import React, { useState, useMemo, useCallback } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
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

const productSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  shortName: z.string().min(1, "Short name is required"),
  description: z.string().optional(),
  currencyCode: z.string().min(1, "Currency is required"),
  digitsAfterDecimal: z.string().min(1, "Valid decimal places required"),
  nominalAnnualInterestRate: z.string().min(1, "Interest rate is required"),
});

type ProductFormValues = z.infer<typeof productSchema>;

const SavingsProductsPage: React.FC = () => {
  const { data: products = [], isLoading, isError, error, refetch } = useSavingsProducts();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      shortName: "",
      currencyCode: "USD",
      digitsAfterDecimal: "2",
      nominalAnnualInterestRate: "",
    },
  });

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return products.filter((p) => p.name.toLowerCase().includes(q) || (p.description ?? "").toLowerCase().includes(q));
  }, [products, search]);

  const openCreate = useCallback(() => {
    setEditingId(null);
    reset({
      name: "",
      shortName: "",
      description: "",
      currencyCode: "USD",
      digitsAfterDecimal: "2",
      nominalAnnualInterestRate: "",
    });
    setDialogOpen(true);
  }, [reset]);

  const openEdit = useCallback(
    (p: SavingsProduct) => {
      setEditingId(p.id);
      reset({
        name: p.name,
        shortName: p.shortName ?? "",
        description: p.description ?? "",
        currencyCode: p.currency.code,
        digitsAfterDecimal: String(p.currency.decimalPlaces ?? 2),
        nominalAnnualInterestRate: String(p.nominalAnnualInterestRate),
      });
      setDialogOpen(true);
    },
    [reset],
  );

  const columns: ColumnDef<SavingsProduct>[] = useMemo(
    () => [
      { key: "name", header: "Name", cell: (r) => <span className="font-semibold">{r.name}</span> },
      { key: "shortName", header: "Code", cell: (r) => <code className="text-xs">{r.shortName ?? "—"}</code> },
      {
        key: "currency",
        header: "Currency",
        cell: (r) => <span className="text-sm">{r.currency.displaySymbol ?? r.currency.code}</span>,
      },
      {
        key: "nominalAnnualInterestRate",
        header: "Interest Rate",
        cell: (r) => <span className="text-sm font-mono">{r.nominalAnnualInterestRate}%</span>,
      },
      {
        key: "actions",
        header: "",
        cell: (r) => (
          <Button variant="ghost" size="sm" onClick={() => openEdit(r)}>
            <Pencil className="h-4 w-4" />
          </Button>
        ),
      },
    ],
    [openEdit],
  );

  const handleSave = async (values: ProductFormValues) => {
    setSaving(true);
    try {
      const payload: SavingsProductCreateRequest = {
        name: values.name,
        shortName: values.shortName,
        description: values.description || undefined,
        currencyCode: values.currencyCode,
        digitsAfterDecimal: Number(values.digitsAfterDecimal),
        nominalAnnualInterestRate: Number(values.nominalAnnualInterestRate),
        locale: "en",
        interestCompoundingPeriodType: 4,
        interestPostingPeriodType: 4,
        interestCalculationType: 1,
        interestCalculationDaysInYearType: 360,
        accountingRule: 2,
        minRequiredOpeningBalance: 0,
        lockinPeriodFrequency: 0,
        lockinPeriodFrequencyType: 0,
        withdrawalFeeForTransfers: false,
        allowOverdraft: false,
        overdraftLimit: 0,
        minRequiredBalance: 0,
        enforceMinRequiredBalance: false,
      };

      if (editingId) {
        await updateSavingsProduct(editingId, payload);
      } else {
        await createSavingsProduct(payload);
      }
      await refetch();
      setDialogOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (isError) {
    return (
      <div className="p-6 max-w-5xl m-auto">
        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
          <AlertTriangle className="h-5 w-5" />
          <span>Failed to load savings products: {error?.message || "Unknown error"}</span>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl m-auto space-y-6">
      <PageHeader
        title="Savings Products"
        description="Manage savings product definitions"
        actions={
          <div className="flex items-center gap-3">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search products..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" /> New Product
            </Button>
          </div>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">All Products</CardTitle>
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
          <form onSubmit={handleSubmit(handleSave)}>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="col-span-2">
                <Input label="Product Name *" {...register("name")} error={errors.name?.message} />
              </div>
              <Input
                label="Short Name *"
                {...register("shortName")}
                error={errors.shortName?.message}
                placeholder="No spaces (e.g. REGSAV01)"
              />
              <div>
                <label className="text-sm font-medium">Currency *</label>
                <Select
                  value={watch("currencyCode")}
                  onValueChange={(v) => setValue("currencyCode", v, { shouldValidate: true })}
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
                {errors.currencyCode && <p className="text-sm text-red-500 mt-1">{errors.currencyCode.message}</p>}
              </div>
              <div className="col-span-2">
                <Textarea label="Description" placeholder="Brief product description" {...register("description")} />
              </div>
              <Input
                label="Decimal Places *"
                type="number"
                {...register("digitsAfterDecimal")}
                error={errors.digitsAfterDecimal?.message}
              />
              <Input
                label="Nominal Annual Rate (%) *"
                type="number"
                step="0.01"
                {...register("nominalAnnualInterestRate")}
                error={errors.nominalAnnualInterestRate?.message}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving…" : editingId ? "Save Changes" : "Create Product"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SavingsProductsPage;
