import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, Loader2, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useFixedDepositProduct,
  useCreateFixedDepositProduct,
  useUpdateFixedDepositProduct,
} from "@/features/deposits";
import type { FixedDepositProductCreateRequest } from "@/features/deposits";

const DEFAULT_DATE_FORMAT = "yyyy-MM-dd";
const DEFAULT_LOCALE = "en";

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

const ACCOUNTING_OPTIONS = [
  { id: 1, label: "Accrual (periodic)" },
  { id: 2, label: "Cash" },
  { id: 3, label: "Upfront Accrual" },
];

function enumId(v: any, fallback = 2): number {
  if (v == null) return fallback;
  if (typeof v === "object") return v.id ?? fallback;
  return Number(v);
}

const FixedDepositProductFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const { data: existingProduct, isLoading: productLoading } = useFixedDepositProduct(id ? Number(id) : undefined);
  const createMutation = useCreateFixedDepositProduct();
  const updateMutation = useUpdateFixedDepositProduct();

  const [saving, setSaving] = useState(false);
  const [slabs, setSlabs] = useState<
    Array<{
      periodType: number;
      fromPeriod: number;
      annualInterestRate: number;
    }>
  >([{ periodType: 2, fromPeriod: 1, annualInterestRate: 5 }]);

  const [form, setForm] = useState({
    name: "",
    shortName: "",
    description: "",
    currencyCode: "USD",
    digitsAfterDecimal: 2,
    depositAmount: 1000,
    minDepositTerm: 1,
    minDepositTermTypeId: 2,
    accountingRule: 1,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Populate form in edit mode
  useEffect(() => {
    if (!existingProduct) return;
    const p = existingProduct as any;
    setForm({
      name: p.name ?? "",
      shortName: p.shortName ?? "",
      description: p.description ?? "",
      currencyCode: p.currency?.code ?? "USD",
      digitsAfterDecimal: p.currency?.decimalPlaces ?? 2,
      depositAmount: p.depositAmount ?? 1000,
      minDepositTerm: p.minDepositTerm ?? 1,
      minDepositTermTypeId: enumId(p.minDepositTermType, 2),
      accountingRule: enumId(p.accountingRule, 1),
    });
    if (p.activeChart?.chartSlabs?.length) {
      setSlabs(
        p.activeChart.chartSlabs.map((s: any) => ({
          periodType: enumId(s.periodType, 2),
          fromPeriod: s.fromPeriod ?? 0,
          annualInterestRate: s.annualInterestRate ?? 0,
        })),
      );
    }
  }, [existingProduct]);

  const updateForm = (field: string, value: any) => setForm((f) => ({ ...f, [field]: value }));

  const updateSlab = (i: number, field: string, value: any) => {
    setSlabs((prev) => prev.map((s, idx) => (idx === i ? { ...s, [field]: value } : s)));
  };

  const addSlab = () => {
    setSlabs((prev) => [...prev, { periodType: 2, fromPeriod: 1, annualInterestRate: 5 }]);
  };

  const removeSlab = (i: number) => {
    setSlabs((prev) => prev.filter((_, idx) => idx !== i));
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.shortName.trim()) e.shortName = "Short name is required";
    if (!form.currencyCode) e.currencyCode = "Currency is required";
    if (form.depositAmount <= 0) e.depositAmount = "Deposit amount must be > 0";
    if (form.minDepositTerm <= 0) e.minDepositTerm = "Min deposit term must be > 0";
    if (!form.description) e.description = "Description is required";
    slabs.forEach((slab, i) => {
      if (slab.annualInterestRate <= 0) e[`slab_${i}_rate`] = "Rate must be > 0";
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload: FixedDepositProductCreateRequest = {
        name: form.name,
        shortName: form.shortName,
        description: form.description || undefined,
        currencyCode: form.currencyCode,
        digitsAfterDecimal: form.digitsAfterDecimal,
        minDepositTerm: form.minDepositTerm,
        minDepositTermTypeId: form.minDepositTermTypeId,
        depositAmount: form.depositAmount,
        accountingRule: form.accountingRule,
        interestCompoundingPeriodType: 1,
        interestPostingPeriodType: 4,
        interestCalculationType: 1,
        interestCalculationDaysInYearType: "365",
        locale: DEFAULT_LOCALE,
        charts: [
          {
            fromDate: new Date().toISOString().split("T")[0],
            dateFormat: DEFAULT_DATE_FORMAT,
            locale: DEFAULT_LOCALE,
            chartSlabs: slabs.map((s) => ({
              periodType: s.periodType,
              fromPeriod: s.fromPeriod,
              annualInterestRate: s.annualInterestRate,
            })),
          },
        ],
      };

      if (isEdit) {
        await updateMutation.mutateAsync({ productId: Number(id), payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      navigate("/deposits/fixed-products");
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (isEdit && productLoading) {
    return (
      <div className="p-6 max-w-4xl m-auto space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl m-auto space-y-6">
      <PageHeader
        title={isEdit ? "Edit Fixed Deposit Product" : "Create Fixed Deposit Product"}
        description="Configure fixed deposit product terms, interest rates, and chart slabs."
        actions={
          <Button variant="outline" onClick={() => navigate("/deposits/fixed-products")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Product Details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="col-span-2 space-y-1.5">
            <Label>Name *</Label>
            <Input value={form.name} onChange={(e) => updateForm("name", e.target.value)} error={errors.name} />
          </div>
          <div className="space-y-1.5">
            <Label>Short Name *</Label>
            <Input
              value={form.shortName}
              onChange={(e) => updateForm("shortName", e.target.value)}
              error={errors.shortName}
              placeholder="No spaces"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Currency *</Label>
            <Select value={form.currencyCode} onValueChange={(v) => updateForm("currencyCode", v)}>
              <SelectTrigger>
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
            {errors.currencyCode && <p className="text-xs text-red-500">{errors.currencyCode}</p>}
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label>Description *</Label>
            <Textarea
              value={form.description}
              onChange={(e) => updateForm("description", e.target.value)}
              rows={3}
              placeholder="Brief product description"
              error={errors.description}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Decimal Places</Label>
            <Input
              type="number"
              value={form.digitsAfterDecimal}
              onChange={(e) => updateForm("digitsAfterDecimal", Number(e.target.value))}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Deposit Terms</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Deposit Amount *</Label>
            <Input
              type="number"
              step="0.01"
              value={form.depositAmount}
              onChange={(e) => updateForm("depositAmount", Number(e.target.value))}
              error={errors.depositAmount}
            />
          </div>
          <div />
          <div className="space-y-1.5">
            <Label>Min Deposit Term *</Label>
            <Input
              type="number"
              value={form.minDepositTerm}
              onChange={(e) => updateForm("minDepositTerm", Number(e.target.value))}
              error={errors.minDepositTerm}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Min Term Type</Label>
            <Select
              value={String(form.minDepositTermTypeId)}
              onValueChange={(v) => updateForm("minDepositTermTypeId", Number(v))}
            >
              <SelectTrigger>
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Accounting Rule</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Select value={String(form.accountingRule)} onValueChange={(v) => updateForm("accountingRule", Number(v))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ACCOUNTING_OPTIONS.map((o) => (
                  <SelectItem key={o.id} value={String(o.id)}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Interest Rate Chart (Slabs)</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={addSlab}>
              <Plus className="mr-1 h-4 w-4" /> Add Slab
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {slabs.map((slab, i) => (
            <div key={i} className="rounded-lg border border-gray-200 p-4 space-y-3 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Slab #{i + 1}</span>
                {slabs.length > 1 && (
                  <button type="button" onClick={() => removeSlab(i)} className="text-gray-400 hover:text-red-500">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium">Period Type</label>
                  <Select value={String(slab.periodType)} onValueChange={(v) => updateSlab(i, "periodType", Number(v))}>
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
                <div className="space-y-1">
                  <label className="text-xs font-medium">Annual Rate (%)</label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 4.5"
                    value={slab.annualInterestRate || ""}
                    onChange={(e) => updateSlab(i, "annualInterestRate", parseFloat(e.target.value) || 0)}
                  />
                  {errors[`slab_${i}_rate`] && <p className="text-xs text-red-500">{errors[`slab_${i}_rate`]}</p>}
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">From Period</label>
                  <Input
                    type="number"
                    placeholder="e.g. 0"
                    value={slab.fromPeriod ?? ""}
                    onChange={(e) => updateSlab(i, "fromPeriod", parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button variant="outline" type="button" onClick={() => navigate("/deposits/fixed-products")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Cancel
        </Button>
        <Button onClick={handleSave} disabled={saving} className="bg-[#D32F2F] hover:bg-red-700">
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" /> {isEdit ? "Save Changes" : "Create Product"}
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default FixedDepositProductFormPage;
