import React, { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Save, Loader2, Plus, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useFixedDepositProduct,
  useCreateFixedDepositProduct,
  useUpdateFixedDepositProduct,
  fetchFixedDepositProductTemplate,
} from "@/features/deposits";
import type { FixedDepositProductCreateRequest, FixedDepositProductTemplate } from "@/features/deposits";
import { CurrencySelect } from "@/components/shared/CurrencySelect";

const INTEREST_COMPOUNDING_OPTIONS = [
  { id: 1, label: "Daily" },
  { id: 4, label: "Monthly" },
  { id: 5, label: "Quarterly" },
  { id: 6, label: "Semi-Annual" },
  { id: 7, label: "Annual" },
];

const INTEREST_POSTING_OPTIONS = [
  { id: 1, label: "Daily" },
  { id: 4, label: "Monthly" },
  { id: 5, label: "Quarterly" },
  { id: 6, label: "Semi-Annual" },
  { id: 7, label: "Annual" },
  { id: 8, label: "Anniversary Monthly" },
  { id: 9, label: "Anniversary Quarterly" },
  { id: 10, label: "Anniversary Bi-Annual" },
  { id: 11, label: "Anniversary Annual" },
];

const INTEREST_CALCULATION_OPTIONS = [
  { id: 1, label: "Daily Balance" },
  { id: 2, label: "Average Daily Balance" },
];

const DAYS_IN_YEAR_OPTIONS = [
  { id: 360, label: "360" },
  { id: 365, label: "365" },
];

const LOCKIN_PERIOD_TYPE_OPTIONS = [
  { id: 0, label: "Days" },
  { id: 1, label: "Weeks" },
  { id: 2, label: "Months" },
  { id: 3, label: "Years" },
];

const PERIOD_FREQUENCIES = [
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
  { id: 1, label: "None" },
  { id: 2, label: "Cash" },
  { id: 3, label: "Accrual" },
];

const PRE_CLOSURE_PENALTY_ON_OPTIONS = [
  { id: 1, label: "Whole Term" },
  { id: 2, label: "Till Premature Withdrawal" },
];

const fdProductSchema = z.object({
  name: z.string().min(1, "Name is required"),
  shortName: z.string().min(1, "Short name is required").max(4, "Max 4 characters"),
  description: z.string().min(1, "Description is required"),
  currencyCode: z.string().min(1, "Currency is required"),
  digitsAfterDecimal: z.coerce.number().int().min(0).max(6),
  nominalAnnualInterestRate: z.coerce.number().min(0).optional(),
  interestCompoundingPeriodType: z.coerce.number(),
  interestPostingPeriodType: z.coerce.number(),
  interestCalculationType: z.coerce.number(),
  interestCalculationDaysInYearType: z.coerce.number(),
  depositAmount: z.coerce.number().positive("Must be > 0"),
  minDepositTerm: z.coerce.number().int().positive("Must be > 0"),
  minDepositTermTypeId: z.coerce.number(),
  maxDepositTerm: z.coerce.number().int().positive().optional().or(z.literal("")),
  maxDepositTermTypeId: z.coerce.number().optional().or(z.literal("")),
  lockinPeriodFrequency: z.coerce.number().int().min(0).optional().or(z.literal("")),
  lockinPeriodFrequencyType: z.coerce.number().optional().or(z.literal("")),
  preClosurePenalApplicable: z.boolean().optional(),
  preClosurePenalInterest: z.coerce.number().min(0).optional().or(z.literal("")),
  preClosurePenalInterestOnTypeId: z.coerce.number().optional().or(z.literal("")),
  withHoldTax: z.boolean().optional(),
  accountingRule: z.coerce.number(),
});

type FormValues = z.infer<typeof fdProductSchema>;

interface Slab {
  periodType: number;
  fromPeriod: number;
  annualInterestRate: number;
}

function enumId(v: any, fallback: number | undefined = 2): number | undefined {
  if (v == null) return fallback;
  if (typeof v === "object") return v.id ?? fallback;
  return Number(v);
}

const FixedDepositProductFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const { data: existingProduct, isLoading: productLoading } = useFixedDepositProduct(id ? Number(id) : undefined);
  const createMutation = useCreateFixedDepositProduct();
  const updateMutation = useUpdateFixedDepositProduct();

  const { data: template } = useQuery<FixedDepositProductTemplate>({
    queryKey: ["fixeddepositproducts", "template"],
    queryFn: fetchFixedDepositProductTemplate,
    staleTime: 10 * 60_000,
  });

  const [slabs, setSlabs] = React.useState<Slab[]>([{ periodType: 2, fromPeriod: 1, annualInterestRate: 5 }]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(fdProductSchema) as any,
    defaultValues: {
      name: "",
      shortName: "",
      description: "",
      currencyCode: "USD",
      digitsAfterDecimal: 2,
      nominalAnnualInterestRate: undefined,
      interestCompoundingPeriodType: 1,
      interestPostingPeriodType: 4,
      interestCalculationType: 1,
      interestCalculationDaysInYearType: 365,
      depositAmount: 1000,
      minDepositTerm: 1,
      minDepositTermTypeId: 2,
      maxDepositTerm: "" as any,
      maxDepositTermTypeId: "" as any,
      lockinPeriodFrequency: "" as any,
      lockinPeriodFrequencyType: "" as any,
      preClosurePenalApplicable: false,
      preClosurePenalInterest: "" as any,
      preClosurePenalInterestOnTypeId: "" as any,
      withHoldTax: false,
      accountingRule: 1,
    },
  });

  const preClosurePenalApplicable = watch("preClosurePenalApplicable");
  const withHoldTax = watch("withHoldTax");

  // Apply template defaults on create (not edit)
  useEffect(() => {
    if (!template || isEdit || existingProduct) return;
    const currencies = template.currencyOptions;
    if (currencies?.length === 1) {
      setValue("currencyCode", currencies[0].code);
    }
  }, [template, isEdit, existingProduct, setValue]);

  useEffect(() => {
    if (!existingProduct) return;
    const p = existingProduct as any;
    reset({
      name: p.name ?? "",
      shortName: p.shortName ?? "",
      description: p.description ?? "",
      currencyCode: p.currency?.code ?? "USD",
      digitsAfterDecimal: p.currency?.decimalPlaces ?? 2,
      nominalAnnualInterestRate: p.nominalAnnualInterestRate ?? undefined,
      interestCompoundingPeriodType: enumId(p.interestCompoundingPeriodType, 1) ?? 1,
      interestPostingPeriodType: enumId(p.interestPostingPeriodType, 4) ?? 4,
      interestCalculationType: enumId(p.interestCalculationType, 1) ?? 1,
      interestCalculationDaysInYearType: enumId(p.interestCalculationDaysInYearType, 365) ?? 365,
      depositAmount: p.depositAmount ?? 1000,
      minDepositTerm: p.minDepositTerm ?? 1,
      minDepositTermTypeId: enumId(p.minDepositTermType, 2) ?? 2,
      maxDepositTerm: p.maxDepositTerm ?? ("" as any),
      maxDepositTermTypeId: enumId(p.maxDepositTermType, undefined) ?? ("" as any),
      lockinPeriodFrequency: p.lockinPeriodFrequency ?? ("" as any),
      lockinPeriodFrequencyType: enumId(p.lockinPeriodFrequencyType, undefined) ?? ("" as any),
      preClosurePenalApplicable: !!p.preClosurePenalApplicable,
      preClosurePenalInterest: p.preClosurePenalInterest ?? ("" as any),
      preClosurePenalInterestOnTypeId: enumId(p.preClosurePenalInterestOnType, undefined) ?? ("" as any),
      withHoldTax: !!p.withHoldTax,
      accountingRule: enumId(p.accountingRule, 1) ?? 1,
    });
    if (p.activeChart?.chartSlabs?.length) {
      setSlabs(
        p.activeChart.chartSlabs.map((s: any) => ({
          periodType: enumId(s.periodType, 2) ?? 2,
          fromPeriod: s.fromPeriod ?? 0,
          annualInterestRate: s.annualInterestRate ?? 0,
        })),
      );
    }
  }, [existingProduct, reset]);

  const updateSlab = (i: number, field: keyof Slab, value: any) => {
    setSlabs((prev) => prev.map((s, idx) => (idx === i ? { ...s, [field]: value } : s)));
  };

  const addSlab = () => {
    setSlabs((prev) => [...prev, { periodType: 2, fromPeriod: 1, annualInterestRate: 5 }]);
  };

  const removeSlab = (i: number) => {
    setSlabs((prev) => prev.filter((_, idx) => idx !== i));
  };

  const onSubmit = async (values: Record<string, any>) => {
    const payload: FixedDepositProductCreateRequest = {
      name: values.name,
      shortName: values.shortName,
      description: values.description,
      currencyCode: values.currencyCode,
      digitsAfterDecimal: values.digitsAfterDecimal,
      minDepositTerm: values.minDepositTerm,
      minDepositTermTypeId: values.minDepositTermTypeId,
      depositAmount: values.depositAmount,
      accountingRule: values.accountingRule,
      nominalAnnualInterestRate: values.nominalAnnualInterestRate || undefined,
      interestCompoundingPeriodType: values.interestCompoundingPeriodType,
      interestPostingPeriodType: values.interestPostingPeriodType,
      interestCalculationType: values.interestCalculationType,
      interestCalculationDaysInYearType: values.interestCalculationDaysInYearType,
      maxDepositTerm: values.maxDepositTerm ? Number(values.maxDepositTerm) : undefined,
      maxDepositTermTypeId: values.maxDepositTermTypeId ? Number(values.maxDepositTermTypeId) : undefined,
      lockinPeriodFrequency: values.lockinPeriodFrequency ? Number(values.lockinPeriodFrequency) : undefined,
      lockinPeriodFrequencyType: values.lockinPeriodFrequencyType
        ? Number(values.lockinPeriodFrequencyType)
        : undefined,
      preClosurePenalApplicable: !!values.preClosurePenalApplicable,
      preClosurePenalInterest: values.preClosurePenalInterest ? Number(values.preClosurePenalInterest) : undefined,
      preClosurePenalInterestOnTypeId: values.preClosurePenalInterestOnTypeId
        ? Number(values.preClosurePenalInterestOnTypeId)
        : undefined,
      withHoldTax: !!values.withHoldTax,
      locale: "en",
      charts: [
        {
          fromDate: new Date().toISOString().split("T")[0],
          dateFormat: "yyyy-MM-dd",
          locale: "en",
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
  };

  if (isEdit && productLoading) {
    return (
      <div className="max-w-6xl m-auto space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl m-auto space-y-6">
      <PageHeader
        title={isEdit ? t("Edit Fixed Deposit Product") : t("Create Fixed Deposit Product")}
        description={t("Configure fixed deposit product terms, interest rates, and chart slabs.")}
        actions={
          <Button variant="outline" onClick={() => navigate("/deposits/fixed-products")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> {t("Back")}
          </Button>
        }
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("Product Details")}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1.5">
              <label className="block text-sm font-medium">{t("Name")} *</label>
              <Input {...register("name")} error={errors.name?.message} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Short Name")} *</label>
              <Input
                {...register("shortName")}
                error={errors.shortName?.message}
                maxLength={4}
                placeholder={t("No spaces")}
              />
            </div>
            <CurrencySelect
              value={watch("currencyCode")}
              onChange={(v) => setValue("currencyCode", v, { shouldValidate: true })}
              error={errors.currencyCode?.message}
            />
            <div className="col-span-2 space-y-1.5">
              <label className="block text-sm font-medium">{t("Description")} *</label>
              <Textarea
                {...register("description")}
                rows={3}
                placeholder={t("Brief product description")}
                error={errors.description?.message}
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Decimal Places")}</label>
              <Input type="number" {...register("digitsAfterDecimal", { valueAsNumber: true })} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("Interest Settings")}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Compounding Period")} *</label>
              <Select
                value={String(watch("interestCompoundingPeriodType"))}
                onValueChange={(v) => setValue("interestCompoundingPeriodType", Number(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INTEREST_COMPOUNDING_OPTIONS.map((o) => (
                    <SelectItem key={o.id} value={String(o.id)}>
                      {t(o.label)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Posting Period")} *</label>
              <Select
                value={String(watch("interestPostingPeriodType"))}
                onValueChange={(v) => setValue("interestPostingPeriodType", Number(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INTEREST_POSTING_OPTIONS.map((o) => (
                    <SelectItem key={o.id} value={String(o.id)}>
                      {t(o.label)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Calculation Type")} *</label>
              <Select
                value={String(watch("interestCalculationType"))}
                onValueChange={(v) => setValue("interestCalculationType", Number(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INTEREST_CALCULATION_OPTIONS.map((o) => (
                    <SelectItem key={o.id} value={String(o.id)}>
                      {t(o.label)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Days In Year")} *</label>
              <Select
                value={String(watch("interestCalculationDaysInYearType"))}
                onValueChange={(v) => setValue("interestCalculationDaysInYearType", Number(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DAYS_IN_YEAR_OPTIONS.map((o) => (
                    <SelectItem key={o.id} value={String(o.id)}>
                      {t(o.label)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("Deposit Terms")}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Deposit Amount")} *</label>
              <Input
                type="number"
                step="0.01"
                {...register("depositAmount", { valueAsNumber: true })}
                error={errors.depositAmount?.message}
              />
            </div>
            <div />
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Min Deposit Term")} *</label>
              <Input
                type="number"
                {...register("minDepositTerm", { valueAsNumber: true })}
                error={errors.minDepositTerm?.message}
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Min Term Type")}</label>
              <Select
                value={String(watch("minDepositTermTypeId"))}
                onValueChange={(v) => setValue("minDepositTermTypeId", Number(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PERIOD_FREQUENCIES.map((f) => (
                    <SelectItem key={f.id} value={String(f.id)}>
                      {t(f.label)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Max Deposit Term")}</label>
              <Input type="number" {...register("maxDepositTerm", { valueAsNumber: true })} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Max Term Type")}</label>
              <Select
                value={watch("maxDepositTermTypeId") ? String(watch("maxDepositTermTypeId")) : ""}
                onValueChange={(v) => setValue("maxDepositTermTypeId", v ? Number(v) : ("" as any))}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("Select")} />
                </SelectTrigger>
                <SelectContent>
                  {PERIOD_FREQUENCIES.map((f) => (
                    <SelectItem key={f.id} value={String(f.id)}>
                      {t(f.label)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("Lock-in Period")}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Lock-in Frequency")}</label>
              <Input type="number" {...register("lockinPeriodFrequency", { valueAsNumber: true })} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Lock-in Type")}</label>
              <Select
                value={watch("lockinPeriodFrequencyType") ? String(watch("lockinPeriodFrequencyType")) : ""}
                onValueChange={(v) => setValue("lockinPeriodFrequencyType", v ? Number(v) : ("" as any))}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("Select")} />
                </SelectTrigger>
                <SelectContent>
                  {LOCKIN_PERIOD_TYPE_OPTIONS.map((o) => (
                    <SelectItem key={o.id} value={String(o.id)}>
                      {t(o.label)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("Pre-closure & Tax")}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="col-span-2 flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="preClosurePenalApplicable"
                checked={!!preClosurePenalApplicable}
                onChange={(e) => setValue("preClosurePenalApplicable", e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <label htmlFor="preClosurePenalApplicable" className="text-sm font-medium">
                {t("Apply Pre-closure Penalty")}
              </label>
            </div>
            {preClosurePenalApplicable && (
              <>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium">{t("Penalty Interest (%)")}</label>
                  <Input type="number" step="0.01" {...register("preClosurePenalInterest", { valueAsNumber: true })} />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium">{t("Penalty Type")}</label>
                  <Select
                    value={
                      watch("preClosurePenalInterestOnTypeId") ? String(watch("preClosurePenalInterestOnTypeId")) : ""
                    }
                    onValueChange={(v) => setValue("preClosurePenalInterestOnTypeId", v ? Number(v) : ("" as any))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("Select")} />
                    </SelectTrigger>
                    <SelectContent>
                      {PRE_CLOSURE_PENALTY_ON_OPTIONS.map((o) => (
                        <SelectItem key={o.id} value={String(o.id)}>
                          {t(o.label)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
            <div className="col-span-2 flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="withHoldTax"
                checked={!!withHoldTax}
                onChange={(e) => setValue("withHoldTax", e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <label htmlFor="withHoldTax" className="text-sm font-medium">
                {t("Withhold Tax")}
              </label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("Accounting Rule")}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Select
                value={String(watch("accountingRule"))}
                onValueChange={(v) => setValue("accountingRule", Number(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACCOUNTING_OPTIONS.map((o) => (
                    <SelectItem key={o.id} value={String(o.id)}>
                      {t(o.label)}
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
              <CardTitle className="text-base">{t("Interest Rate Chart (Slabs)")}</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={addSlab}>
                <Plus className="mr-1 h-4 w-4" /> {t("Add Slab")}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {slabs.map((slab, i) => (
              <div key={i} className="rounded-lg border border-gray-200 p-4 space-y-3 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{t("Slab")} #{i + 1}</span>
                  {slabs.length > 1 && (
                    <button type="button" onClick={() => removeSlab(i)} className="text-gray-400 hover:text-red-500">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium">{t("Period Type")}</label>
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
                            {t(pt.label)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">{t("Annual Rate (%)")}</label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder={t("e.g. 4.5")}
                      value={slab.annualInterestRate || ""}
                      onChange={(e) => updateSlab(i, "annualInterestRate", parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">{t("From Period")}</label>
                    <Input
                      type="number"
                      placeholder={t("e.g. 0")}
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
            <ArrowLeft className="mr-2 h-4 w-4" /> {t("Cancel")}
          </Button>
          <Button type="submit" disabled={isSubmitting} className="bg-[#D32F2F] hover:bg-red-700">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t("Saving…")}
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" /> {isEdit ? t("Save Changes") : t("Create Product")}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default FixedDepositProductFormPage;
