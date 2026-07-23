import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
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

const INTEREST_OPTIONS = [
  { id: 4, label: "Monthly" },
  { id: 1, label: "Daily" },
  { id: 5, label: "Quarterly" },
  { id: 6, label: "Semi-Annual" },
  { id: 7, label: "Annual" },
];

const CALCULATION_TYPE_OPTIONS = [
  { id: 1, label: "Daily Balance" },
  { id: 0, label: "Average Daily Balance" },
];

const DAYS_IN_YEAR_OPTIONS = [
  { id: 360, label: "360 Days" },
  { id: 365, label: "365 Days" },
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
      description: string;
      periodType: number;
      fromPeriod: number;
      toPeriod: number;
      annualInterestRate: number;
    }>
  >([{ description: "", periodType: 2, fromPeriod: 0, toPeriod: 0, annualInterestRate: 0 }]);

  const [form, setForm] = useState({
    name: "",
    shortName: "",
    description: "",
    currencyCode: "USD",
    digitsAfterDecimal: 2,
    depositAmount: 1000,
    minDepositTerm: 1,
    minDepositTermTypeId: 2,
    maxDepositTerm: 0,
    maxDepositTermTypeId: 2,
    interestCompoundingPeriodType: 4,
    interestPostingPeriodType: 4,
    interestCalculationType: 1,
    interestCalculationDaysInYearType: 360,
    accountingRule: 2,
    preClosurePenalApplicable: false,
    preClosurePenalInterest: 0,
    preClosurePenalInterestOnTypeId: 2,
    withHoldTax: false,
    locale: "en",
    inMultiplesOf: 0,
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
      maxDepositTerm: p.maxDepositTerm ?? 0,
      maxDepositTermTypeId: enumId(p.maxDepositTermType, 2),
      interestCompoundingPeriodType: enumId(p.interestCompoundingPeriodType, 4),
      interestPostingPeriodType: enumId(p.interestPostingPeriodType, 4),
      interestCalculationType: enumId(p.interestCalculationType, 1),
      interestCalculationDaysInYearType: enumId(p.interestCalculationDaysInYearType, 360),
      accountingRule: enumId(p.accountingRule, 2),
      preClosurePenalApplicable: !!p.preClosurePenalApplicable,
      preClosurePenalInterest: p.preClosurePenalInterest ?? 0,
      preClosurePenalInterestOnTypeId: enumId(p.preClosurePenalInterestOnType, 2),
      withHoldTax: !!p.withHoldTax,
      locale: "en",
      inMultiplesOf: p.currency?.inMultiplesOf ?? 0,
    });
    if (p.activeChart?.chartSlabs?.length) {
      setSlabs(
        p.activeChart.chartSlabs.map((s: any) => ({
          description: s.description ?? "",
          periodType: enumId(s.periodType, 2),
          fromPeriod: s.fromPeriod ?? 0,
          toPeriod: s.toPeriod ?? 0,
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
    setSlabs((prev) => [
      ...prev,
      { description: "", periodType: 2, fromPeriod: 0, toPeriod: 0, annualInterestRate: 0 },
    ]);
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
    slabs.forEach((slab, i) => {
      if (!slab.description.trim()) e[`slab_${i}_desc`] = "Description required";
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
        inMultiplesOf: form.inMultiplesOf,
        locale: "en",
        interestCompoundingPeriodType: form.interestCompoundingPeriodType,
        interestPostingPeriodType: form.interestPostingPeriodType,
        interestCalculationType: form.interestCalculationType,
        interestCalculationDaysInYearType: form.interestCalculationDaysInYearType,
        accountingRule: form.accountingRule,
        minDepositTerm: form.minDepositTerm,
        minDepositTermTypeId: form.minDepositTermTypeId,
        depositAmount: form.depositAmount,
        maxDepositTerm: form.maxDepositTerm > 0 ? form.maxDepositTerm : undefined,
        maxDepositTermTypeId: form.maxDepositTerm > 0 ? form.maxDepositTermTypeId : undefined,
        preClosurePenalApplicable: form.preClosurePenalApplicable,
        preClosurePenalInterest: form.preClosurePenalApplicable ? form.preClosurePenalInterest : undefined,
        preClosurePenalInterestOnTypeId: form.preClosurePenalApplicable
          ? form.preClosurePenalInterestOnTypeId
          : undefined,
        withHoldTax: form.withHoldTax,
        charts:
          slabs.length > 0 && slabs[0].description.trim()
            ? [
                {
                  fromDate: new Date().toISOString().split("T")[0],
                  locale: "en",
                  dateFormat: "yyyy-MM-dd",
                  chartSlabs: slabs.map((s) => ({
                    description: s.description,
                    periodType: s.periodType,
                    fromPeriod: s.fromPeriod,
                    toPeriod: s.toPeriod,
                    annualInterestRate: s.annualInterestRate,
                  })),
                },
              ]
            : undefined,
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
            <Label>Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) => updateForm("description", e.target.value)}
              rows={3}
              placeholder="Brief product description"
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
          <div className="space-y-1.5">
            <Label>In Multiples Of</Label>
            <Input
              type="number"
              value={form.inMultiplesOf}
              onChange={(e) => updateForm("inMultiplesOf", Number(e.target.value))}
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
          <div className="space-y-1.5">
            <Label>Max Deposit Term</Label>
            <Input
              type="number"
              value={form.maxDepositTerm}
              onChange={(e) => updateForm("maxDepositTerm", Number(e.target.value))}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Max Term Type</Label>
            <Select
              value={String(form.maxDepositTermTypeId)}
              onValueChange={(v) => updateForm("maxDepositTermTypeId", Number(v))}
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
          <CardTitle className="text-base">Interest Settings</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Compounding Period</Label>
            <Select
              value={String(form.interestCompoundingPeriodType)}
              onValueChange={(v) => updateForm("interestCompoundingPeriodType", Number(v))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {INTEREST_OPTIONS.map((o) => (
                  <SelectItem key={o.id} value={String(o.id)}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Posting Period</Label>
            <Select
              value={String(form.interestPostingPeriodType)}
              onValueChange={(v) => updateForm("interestPostingPeriodType", Number(v))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {INTEREST_OPTIONS.map((o) => (
                  <SelectItem key={o.id} value={String(o.id)}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Calculation Type</Label>
            <Select
              value={String(form.interestCalculationType)}
              onValueChange={(v) => updateForm("interestCalculationType", Number(v))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CALCULATION_TYPE_OPTIONS.map((o) => (
                  <SelectItem key={o.id} value={String(o.id)}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Days In Year</Label>
            <Select
              value={String(form.interestCalculationDaysInYearType)}
              onValueChange={(v) => updateForm("interestCalculationDaysInYearType", Number(v))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DAYS_IN_YEAR_OPTIONS.map((o) => (
                  <SelectItem key={o.id} value={String(o.id)}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Accounting Rule</Label>
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
          <CardTitle className="text-base">Pre-closure Penalty</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="preClosurePenalApplicable"
              className="h-4 w-4 rounded border-gray-300"
              checked={form.preClosurePenalApplicable}
              onChange={(e) => updateForm("preClosurePenalApplicable", e.target.checked)}
            />
            <Label htmlFor="preClosurePenalApplicable" className="text-sm font-normal cursor-pointer">
              Apply pre-closure penalty
            </Label>
          </div>
          {form.preClosurePenalApplicable && (
            <div className="grid grid-cols-2 gap-4 ml-6">
              <div className="space-y-1.5">
                <Label>Penalty Interest (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.preClosurePenalInterest}
                  onChange={(e) => updateForm("preClosurePenalInterest", Number(e.target.value))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Penalty Period Type</Label>
                <Select
                  value={String(form.preClosurePenalInterestOnTypeId)}
                  onValueChange={(v) => updateForm("preClosurePenalInterestOnTypeId", Number(v))}
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
            </div>
          )}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="withHoldTax"
              className="h-4 w-4 rounded border-gray-300"
              checked={form.withHoldTax}
              onChange={(e) => updateForm("withHoldTax", e.target.checked)}
            />
            <Label htmlFor="withHoldTax" className="text-sm font-normal cursor-pointer">
              Enable tax withholding
            </Label>
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
                <div className="col-span-2 space-y-1">
                  <label className="text-xs font-medium">Description</label>
                  <Input
                    placeholder="e.g. from 0 to 90 days"
                    value={slab.description}
                    onChange={(e) => updateSlab(i, "description", e.target.value)}
                  />
                  {errors[`slab_${i}_desc`] && <p className="text-xs text-red-500">{errors[`slab_${i}_desc`]}</p>}
                </div>
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
                <div className="space-y-1">
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
