import React, { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Save, Loader2, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useRecurringDepositProduct,
  useCreateRecurringDepositProduct,
  useUpdateRecurringDepositProduct,
  fetchRecurringDepositProductTemplate,
} from "@/features/deposits";
import type { RecurringDepositProductCreateRequest, RecurringDepositProductTemplate } from "@/features/deposits";
import { CurrencySelect } from "@/components/shared/CurrencySelect";

const ACCOUNTING_CASH = 2;
const ACCOUNTING_ACCRUAL = 3;

const GL_FIELDS = [
  { name: "savingsReferenceAccountId", label: "Savings Reference Account" },
  { name: "savingsControlAccountId", label: "Savings Control Account" },
  { name: "interestOnSavingsAccountId", label: "Interest on Savings Account" },
  { name: "incomeFromFeeAccountId", label: "Income from Fee Account" },
  { name: "incomeFromPenaltyAccountId", label: "Income from Penalty Account" },
  { name: "transfersInSuspenseAccountId", label: "Transfers in Suspense Account" },
] as const;

const GL_FIELDS_ACCRUAL_ONLY = [
  { name: "feesReceivableAccountId", label: "Fees Receivable Account" },
  { name: "penaltiesReceivableAccountId", label: "Penalties Receivable Account" },
  { name: "interestPayableAccountId", label: "Interest Payable Account" },
  { name: "interestReceivableAccountId", label: "Interest Receivable Account" },
] as const;

const glField = () => z.coerce.number().int().positive().optional().or(z.literal(""));

const rdProductSchema = z.object({
  name: z.string().min(1, "Name is required"),
  shortName: z.string().min(1, "Short name is required").max(4, "Max 4 characters"),
  description: z.string().min(1, "Description is required"),
  currencyCode: z.string().min(1, "Currency is required"),
  digitsAfterDecimal: z.coerce.number().int().min(0).max(6),
  inMultiplesOf: z.coerce.number().int().min(0).optional().or(z.literal("")),
  nominalAnnualInterestRate: z.coerce.number().min(0).optional().or(z.literal("")),
  interestCompoundingPeriodType: z.coerce.number(),
  interestPostingPeriodType: z.coerce.number(),
  interestCalculationType: z.coerce.number(),
  interestCalculationDaysInYearType: z.coerce.number(),
  minBalanceForInterestCalculation: z.coerce.number().min(0).optional().or(z.literal("")),
  lockinPeriodFrequency: z.coerce.number().int().min(0).optional().or(z.literal("")),
  lockinPeriodFrequencyType: z.coerce.number().optional().or(z.literal("")),
  minDepositTerm: z.coerce.number().int().positive("Must be > 0"),
  minDepositTermTypeId: z.coerce.number(),
  maxDepositTerm: z.coerce.number().int().positive().optional().or(z.literal("")),
  maxDepositTermTypeId: z.coerce.number().optional().or(z.literal("")),
  inMultiplesOfDepositTerm: z.coerce.number().int().positive().optional().or(z.literal("")),
  inMultiplesOfDepositTermTypeId: z.coerce.number().optional().or(z.literal("")),
  depositAmount: z.coerce.number().positive("Must be > 0"),
  // minDepositAmount: z.coerce.number().min(0).optional().or(z.literal("")),
  // maxDepositAmount: z.coerce.number().min(0).optional().or(z.literal("")),
  recurringFrequency: z.coerce.number().int().positive(),
  recurringFrequencyType: z.coerce.number(),
  isMandatoryDeposit: z.boolean().optional(),
  allowWithdrawal: z.boolean().optional(),
  adjustAdvanceTowardsFuturePayments: z.boolean().optional(),
  preClosurePenalApplicable: z.boolean().optional(),
  preClosurePenalInterest: z.coerce.number().min(0).optional().or(z.literal("")),
  preClosurePenalInterestOnTypeId: z.coerce.number().optional().or(z.literal("")),
  withHoldTax: z.boolean().optional(),
  taxGroupId: z.coerce.number().int().positive().optional().or(z.literal("")),
  accountingRule: z.coerce.number(),
  savingsReferenceAccountId: glField(),
  savingsControlAccountId: glField(),
  interestOnSavingsAccountId: glField(),
  incomeFromFeeAccountId: glField(),
  incomeFromPenaltyAccountId: glField(),
  transfersInSuspenseAccountId: glField(),
  feesReceivableAccountId: glField(),
  penaltiesReceivableAccountId: glField(),
  interestPayableAccountId: glField(),
  interestReceivableAccountId: glField(),
});

type FormValues = z.infer<typeof rdProductSchema>;

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

const RecurringDepositProductFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const { data: existingProduct, isLoading: productLoading } = useRecurringDepositProduct(id ? Number(id) : undefined);
  const createMutation = useCreateRecurringDepositProduct();
  const updateMutation = useUpdateRecurringDepositProduct();

  const { data: template } = useQuery({
    queryKey: ["recurringdepositproducts", "template"],
    queryFn: fetchRecurringDepositProductTemplate,
    staleTime: 10 * 60_000,
  });

  const [slabs, setSlabs] = React.useState<Slab[]>([{ periodType: 2, fromPeriod: 1, annualInterestRate: 5 }]);

  const interestCompoundingOptions = template?.interestCompoundingPeriodTypeOptions ?? [];
  const interestPostingOptions = template?.interestPostingPeriodTypeOptions ?? [];
  const interestCalcOptions = template?.interestCalculationTypeOptions ?? [];
  const daysInYearOptions = template?.interestCalculationDaysInYearTypeOptions ?? [];
  const lockinTypeOptions = template?.lockinPeriodFrequencyTypeOptions ?? [];
  const periodFreqOptions = template?.periodFrequencyTypeOptions ?? [];
  const preClosurePenaltyOptions = template?.preClosurePenalInterestOnTypeOptions ?? [];
  const accountingOptions = template?.accountingRuleOptions ?? [];
  const chartPeriodTypes = template?.chartTemplate?.periodTypes ?? [];
  const taxGroupOpts = template?.taxGroupOptions ?? [];
  const glAccountOptions = template?.accountingMappingOptions ?? {};

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(rdProductSchema) as any,
    defaultValues: {
      name: "",
      shortName: "",
      description: "",
      currencyCode: "USD",
      digitsAfterDecimal: 2,
      inMultiplesOf: "" as any,
      nominalAnnualInterestRate: "" as any,
      interestCompoundingPeriodType: 1,
      interestPostingPeriodType: 4,
      interestCalculationType: 1,
      interestCalculationDaysInYearType: 365,
      minBalanceForInterestCalculation: "" as any,
      lockinPeriodFrequency: "" as any,
      lockinPeriodFrequencyType: "" as any,
      minDepositTerm: 1,
      minDepositTermTypeId: 2,
      maxDepositTerm: "" as any,
      maxDepositTermTypeId: "" as any,
      inMultiplesOfDepositTerm: "" as any,
      inMultiplesOfDepositTermTypeId: "" as any,
      depositAmount: undefined,
      // minDepositAmount: "" as any,
      // maxDepositAmount: "" as any,
      recurringFrequency: 1,
      recurringFrequencyType: 2,
      isMandatoryDeposit: false,
      allowWithdrawal: false,
      adjustAdvanceTowardsFuturePayments: false,
      preClosurePenalApplicable: false,
      preClosurePenalInterest: "" as any,
      preClosurePenalInterestOnTypeId: "" as any,
      withHoldTax: false,
      taxGroupId: "" as any,
      accountingRule: 1,
      savingsReferenceAccountId: "" as any,
      savingsControlAccountId: "" as any,
      interestOnSavingsAccountId: "" as any,
      incomeFromFeeAccountId: "" as any,
      incomeFromPenaltyAccountId: "" as any,
      transfersInSuspenseAccountId: "" as any,
      feesReceivableAccountId: "" as any,
      penaltiesReceivableAccountId: "" as any,
      interestPayableAccountId: "" as any,
      interestReceivableAccountId: "" as any,
    },
  });

  const preClosurePenalApplicable = watch("preClosurePenalApplicable");
  const withHoldTax = watch("withHoldTax");
  const accountingRule = watch("accountingRule");
  const inMultiplesOfDepositTerm = watch("inMultiplesOfDepositTerm");

  // Apply template defaults on create (not edit)
  useEffect(() => {
    if (!template || isEdit || existingProduct) return;
    const currencies = template.currencyOptions;
    if (currencies?.length === 1) {
      setValue("currencyCode", currencies[0].code);
    }
  }, [template, isEdit, existingProduct, setValue]);

  // Reset GL fields when accountingRule changes to NONE
  useEffect(() => {
    if (accountingRule === 1) {
      const glFields = [
        "savingsReferenceAccountId",
        "savingsControlAccountId",
        "interestOnSavingsAccountId",
        "incomeFromFeeAccountId",
        "incomeFromPenaltyAccountId",
        "transfersInSuspenseAccountId",
        "feesReceivableAccountId",
        "penaltiesReceivableAccountId",
        "interestPayableAccountId",
        "interestReceivableAccountId",
      ];
      glFields.forEach((f) => setValue(f as any, "" as any));
    }
  }, [accountingRule, setValue]);

  useEffect(() => {
    if (!existingProduct) return;
    const p = existingProduct as any;
    const gl = (key: string) => p[key] ?? ("" as any);
    reset({
      name: p.name ?? "",
      shortName: p.shortName ?? "",
      description: p.description ?? "",
      currencyCode: p.currency?.code ?? "USD",
      digitsAfterDecimal: p.currency?.decimalPlaces ?? 2,
      inMultiplesOf: p.currency?.inMultiplesOf ?? ("" as any),
      nominalAnnualInterestRate: p.nominalAnnualInterestRate ?? ("" as any),
      interestCompoundingPeriodType: enumId(p.interestCompoundingPeriodType, 1) ?? 1,
      interestPostingPeriodType: enumId(p.interestPostingPeriodType, 4) ?? 4,
      interestCalculationType: enumId(p.interestCalculationType, 1) ?? 1,
      interestCalculationDaysInYearType: enumId(p.interestCalculationDaysInYearType, 365) ?? 365,
      minBalanceForInterestCalculation: p.minBalanceForInterestCalculation ?? ("" as any),
      lockinPeriodFrequency: p.lockinPeriodFrequency ?? ("" as any),
      lockinPeriodFrequencyType: enumId(p.lockinPeriodFrequencyType, undefined) ?? ("" as any),
      minDepositTerm: p.minDepositTerm ?? 1,
      minDepositTermTypeId: enumId(p.minDepositTermType, 2) ?? 2,
      maxDepositTerm: p.maxDepositTerm ?? ("" as any),
      maxDepositTermTypeId: enumId(p.maxDepositTermType, undefined) ?? ("" as any),
      inMultiplesOfDepositTerm: p.inMultiplesOfDepositTerm ?? ("" as any),
      inMultiplesOfDepositTermTypeId: enumId(p.inMultiplesOfDepositTermType, undefined) ?? ("" as any),
      depositAmount: p.depositAmount ?? undefined,
      // minDepositAmount: p.minDepositAmount ?? ("" as any),
      // maxDepositAmount: p.maxDepositAmount ?? ("" as any),
      recurringFrequency: p.recurringFrequency ?? 1,
      recurringFrequencyType: enumId(p.recurringFrequencyType, 2) ?? 2,
      isMandatoryDeposit: !!p.isMandatoryDeposit,
      allowWithdrawal: !!p.allowWithdrawal,
      adjustAdvanceTowardsFuturePayments: !!p.adjustAdvanceTowardsFuturePayments,
      preClosurePenalApplicable: !!p.preClosurePenalApplicable,
      preClosurePenalInterest: p.preClosurePenalInterest ?? ("" as any),
      preClosurePenalInterestOnTypeId: enumId(p.preClosurePenalInterestOnType, undefined) ?? ("" as any),
      withHoldTax: !!p.withHoldTax,
      taxGroupId: p.taxGroupId ?? ("" as any),
      accountingRule: enumId(p.accountingRule, 1) ?? 1,
      savingsReferenceAccountId: gl("savingsReferenceAccountId"),
      savingsControlAccountId: gl("savingsControlAccountId"),
      interestOnSavingsAccountId: gl("interestOnSavingsAccountId"),
      incomeFromFeeAccountId: gl("incomeFromFeeAccountId"),
      incomeFromPenaltyAccountId: gl("incomeFromPenaltyAccountId"),
      transfersInSuspenseAccountId: gl("transfersInSuspenseAccountId"),
      feesReceivableAccountId: gl("feesReceivableAccountId"),
      penaltiesReceivableAccountId: gl("penaltiesReceivableAccountId"),
      interestPayableAccountId: gl("interestPayableAccountId"),
      interestReceivableAccountId: gl("interestReceivableAccountId"),
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

  const num = (v: any) => (v ? Number(v) : undefined);

  const onSubmit = async (values: Record<string, any>) => {
    const payload: RecurringDepositProductCreateRequest = {
      name: values.name,
      shortName: values.shortName,
      description: values.description,
      currencyCode: values.currencyCode,
      digitsAfterDecimal: values.digitsAfterDecimal,
      minDepositTerm: values.minDepositTerm,
      minDepositTermTypeId: values.minDepositTermTypeId,
      depositAmount: values.depositAmount,
      recurringFrequency: values.recurringFrequency,
      recurringFrequencyType: values.recurringFrequencyType,
      accountingRule: values.accountingRule,
      nominalAnnualInterestRate: values.nominalAnnualInterestRate || undefined,
      inMultiplesOf: values.inMultiplesOf ? Number(values.inMultiplesOf) : undefined,
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
      inMultiplesOfDepositTerm: num(values.inMultiplesOfDepositTerm),
      inMultiplesOfDepositTermTypeId: num(values.inMultiplesOfDepositTermTypeId),
      minDepositAmount: num(values.minDepositAmount),
      maxDepositAmount: num(values.maxDepositAmount),
      preClosurePenalApplicable: !!values.preClosurePenalApplicable,
      preClosurePenalInterest: num(values.preClosurePenalInterest),
      preClosurePenalInterestOnTypeId: num(values.preClosurePenalInterestOnTypeId),
      isMandatoryDeposit: !!values.isMandatoryDeposit,
      allowWithdrawal: !!values.allowWithdrawal,
      adjustAdvanceTowardsFuturePayments: !!values.adjustAdvanceTowardsFuturePayments,
      withHoldTax: !!values.withHoldTax,
      taxGroupId: values.taxGroupId ? Number(values.taxGroupId) : undefined,
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

    // GL account mappings
    const glKeys = [
      "savingsReferenceAccountId",
      "savingsControlAccountId",
      "interestOnSavingsAccountId",
      "incomeFromFeeAccountId",
      "incomeFromPenaltyAccountId",
      "transfersInSuspenseAccountId",
      "feesReceivableAccountId",
      "penaltiesReceivableAccountId",
      "interestPayableAccountId",
      "interestReceivableAccountId",
    ];
    for (const key of glKeys) {
      const v = values[key];
      if (v) (payload as any)[key] = Number(v);
    }

    if (isEdit) {
      await updateMutation.mutateAsync({ productId: Number(id), payload });
    } else {
      await createMutation.mutateAsync(payload);
    }
    navigate("/deposits/recurring-products");
  };

  if (isEdit && productLoading) {
    return (
      <div className="max-w-4xl m-auto space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl m-auto space-y-6">
      <PageHeader
        title={isEdit ? "Edit Recurring Deposit Product" : "Create Recurring Deposit Product"}
        description="Configure recurring deposit product terms, frequency, and interest rates."
        actions={
          <Button variant="outline" onClick={() => navigate("/deposits/recurring-products")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
        }
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Product Details</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1.5">
              <label className="block text-sm font-medium">Name *</label>
              <Input {...register("name")} error={errors.name?.message} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">Short Name *</label>
              <Input
                {...register("shortName")}
                error={errors.shortName?.message}
                maxLength={4}
                placeholder="No spaces"
              />
            </div>
            <CurrencySelect
              value={watch("currencyCode")}
              onChange={(v) => setValue("currencyCode", v, { shouldValidate: true })}
              error={errors.currencyCode?.message}
            />
            <div className="col-span-2 space-y-1.5">
              <label className="block text-sm font-medium">Description *</label>
              <Textarea
                {...register("description")}
                rows={3}
                placeholder="Brief product description"
                error={errors.description?.message}
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">Decimal Places</label>
              <Input type="number" {...register("digitsAfterDecimal", { valueAsNumber: true })} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">In Multiples Of</label>
              <Input
                type="number"
                {...register("inMultiplesOf", { valueAsNumber: true })}
                placeholder="Rounding denomination"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Interest Settings</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">Nominal Annual Interest Rate (%)</label>
              <Input
                type="number"
                step="0.01"
                placeholder="e.g. 5.0"
                {...register("nominalAnnualInterestRate", { valueAsNumber: true })}
              />
            </div>
            <div />
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">Compounding Period *</label>
              <Select
                value={String(watch("interestCompoundingPeriodType"))}
                onValueChange={(v) => setValue("interestCompoundingPeriodType", Number(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {interestCompoundingOptions.map((o: any) => (
                    <SelectItem key={o.id} value={String(o.id)}>
                      {o.value ?? o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">Posting Period *</label>
              <Select
                value={String(watch("interestPostingPeriodType"))}
                onValueChange={(v) => setValue("interestPostingPeriodType", Number(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {interestPostingOptions.map((o: any) => (
                    <SelectItem key={o.id} value={String(o.id)}>
                      {o.value ?? o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">Calculation Type *</label>
              <Select
                value={String(watch("interestCalculationType"))}
                onValueChange={(v) => setValue("interestCalculationType", Number(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {interestCalcOptions.map((o: any) => (
                    <SelectItem key={o.id} value={String(o.id)}>
                      {o.value ?? o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">Days In Year *</label>
              <Select
                value={String(watch("interestCalculationDaysInYearType"))}
                onValueChange={(v) => setValue("interestCalculationDaysInYearType", Number(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {daysInYearOptions.map((o: any) => (
                    <SelectItem key={o.id} value={String(o.id)}>
                      {o.value ?? o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">Min Balance for Interest Calc</label>
              <Input
                type="number"
                step="0.01"
                {...register("minBalanceForInterestCalculation", { valueAsNumber: true })}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Lock-in Period</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">Lock-in Frequency</label>
              <Input type="number" {...register("lockinPeriodFrequency", { valueAsNumber: true })} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">Lock-in Type</label>
              <Select
                value={watch("lockinPeriodFrequencyType") ? String(watch("lockinPeriodFrequencyType")) : ""}
                onValueChange={(v) => setValue("lockinPeriodFrequencyType", v ? Number(v) : ("" as any))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {lockinTypeOptions.map((o: any) => (
                    <SelectItem key={o.id} value={String(o.id)}>
                      {o.value ?? o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Deposit Terms</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">Recurring Deposit Amount *</label>
              <Input
                type="number"
                step="0.01"
                {...register("depositAmount", { valueAsNumber: true })}
                error={errors.depositAmount?.message}
              />
            </div>
            <div />
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">Min Deposit Term *</label>
              <Input
                type="number"
                {...register("minDepositTerm", { valueAsNumber: true })}
                error={errors.minDepositTerm?.message}
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">Min Term Type</label>
              <Select
                value={String(watch("minDepositTermTypeId"))}
                onValueChange={(v) => setValue("minDepositTermTypeId", Number(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {periodFreqOptions.map((o: any) => (
                    <SelectItem key={o.id} value={String(o.id)}>
                      {o.value ?? o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">Max Deposit Term</label>
              <Input type="number" {...register("maxDepositTerm", { valueAsNumber: true })} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">Max Term Type</label>
              <Select
                value={watch("maxDepositTermTypeId") ? String(watch("maxDepositTermTypeId")) : ""}
                onValueChange={(v) => setValue("maxDepositTermTypeId", v ? Number(v) : ("" as any))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {periodFreqOptions.map((o: any) => (
                    <SelectItem key={o.id} value={String(o.id)}>
                      {o.value ?? o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* <div className="space-y-1.5">
              <label className="block text-sm font-medium">Min Deposit Amount</label>
              <Input type="number" step="0.01" {...register("minDepositAmount", { valueAsNumber: true })} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">Max Deposit Amount</label>
              <Input type="number" step="0.01" {...register("maxDepositAmount", { valueAsNumber: true })} />
            </div> */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">In Multiples Of Deposit Term</label>
              <Input type="number" {...register("inMultiplesOfDepositTerm", { valueAsNumber: true })} />
            </div>
            {inMultiplesOfDepositTerm && (
              <div className="space-y-1.5">
                <label className="block text-sm font-medium">Multiples Term Type</label>
                <Select
                  value={watch("inMultiplesOfDepositTermTypeId") ? String(watch("inMultiplesOfDepositTermTypeId")) : ""}
                  onValueChange={(v) => setValue("inMultiplesOfDepositTermTypeId", v ? Number(v) : ("" as any))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {periodFreqOptions.map((o: any) => (
                      <SelectItem key={o.id} value={String(o.id)}>
                        {o.value ?? o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recurring Frequency</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">Deposit Every *</label>
              <Input type="number" {...register("recurringFrequency", { valueAsNumber: true })} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">Frequency Type</label>
              <Select
                value={String(watch("recurringFrequencyType"))}
                onValueChange={(v) => setValue("recurringFrequencyType", Number(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {periodFreqOptions.map((o: any) => (
                    <SelectItem key={o.id} value={String(o.id)}>
                      {o.value ?? o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recurring Details</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="col-span-2 flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="isMandatoryDeposit"
                checked={!!watch("isMandatoryDeposit")}
                onChange={(e) => setValue("isMandatoryDeposit", e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <label htmlFor="isMandatoryDeposit" className="text-sm font-medium">
                Mandatory Deposit
              </label>
            </div>
            <div className="col-span-2 flex items-center gap-2">
              <input
                type="checkbox"
                id="allowWithdrawal"
                checked={!!watch("allowWithdrawal")}
                onChange={(e) => setValue("allowWithdrawal", e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <label htmlFor="allowWithdrawal" className="text-sm font-medium">
                Allow Withdrawal
              </label>
            </div>
            <div className="col-span-2 flex items-center gap-2">
              <input
                type="checkbox"
                id="adjustAdvanceTowardsFuturePayments"
                checked={!!watch("adjustAdvanceTowardsFuturePayments")}
                onChange={(e) => setValue("adjustAdvanceTowardsFuturePayments", e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <label htmlFor="adjustAdvanceTowardsFuturePayments" className="text-sm font-medium">
                Adjust Advance Towards Future Payments
              </label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pre-closure &amp; Tax</CardTitle>
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
                Apply Pre-closure Penalty
              </label>
            </div>
            {preClosurePenalApplicable && (
              <>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium">Penalty Interest (%)</label>
                  <Input type="number" step="0.01" {...register("preClosurePenalInterest", { valueAsNumber: true })} />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium">Penalty Type</label>
                  <Select
                    value={
                      watch("preClosurePenalInterestOnTypeId") ? String(watch("preClosurePenalInterestOnTypeId")) : ""
                    }
                    onValueChange={(v) => setValue("preClosurePenalInterestOnTypeId", v ? Number(v) : ("" as any))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {preClosurePenaltyOptions.map((o: any) => (
                        <SelectItem key={o.id} value={String(o.id)}>
                          {o.value ?? o.label}
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
                Withhold Tax
              </label>
            </div>
            {withHoldTax && (
              <div className="space-y-1.5">
                <label className="block text-sm font-medium">Tax Group</label>
                <Select
                  value={watch("taxGroupId") ? String(watch("taxGroupId")) : ""}
                  onValueChange={(v) => setValue("taxGroupId", v ? Number(v) : ("" as any))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select tax group" />
                  </SelectTrigger>
                  <SelectContent>
                    {taxGroupOpts.map((o: any) => (
                      <SelectItem key={o.id} value={String(o.id)}>
                        {o.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Accounting Rule</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">Accounting Rule *</label>
              <Select
                value={String(watch("accountingRule"))}
                onValueChange={(v) => setValue("accountingRule", Number(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {accountingOptions.map((o: any) => (
                    <SelectItem key={o.id} value={String(o.id)}>
                      {o.value ?? o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          {(accountingRule === ACCOUNTING_CASH || accountingRule === ACCOUNTING_ACCRUAL) && (
            <CardContent className="grid grid-cols-2 gap-4 border-t pt-4">
              {GL_FIELDS.map(({ name, label }) => (
                <div key={name} className="space-y-1.5">
                  <label className="block text-sm font-medium">{label}</label>
                  <Select
                    value={watch(name as any) ? String(watch(name as any)) : ""}
                    onValueChange={(v) => setValue(name as any, v ? Number(v) : ("" as any))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={`Select ${label}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {[
                        ...(glAccountOptions?.assetAccountOptions ?? []),
                        ...(glAccountOptions?.liabilityAccountOptions ?? []),
                        ...(glAccountOptions?.equityAccountOptions ?? []),
                        ...(glAccountOptions?.incomeAccountOptions ?? []),
                        ...(glAccountOptions?.expenseAccountOptions ?? []),
                      ].map((o: any) => (
                        <SelectItem key={o.id} value={String(o.id)}>
                          {o.name} ({o.glCode})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
              {accountingRule === ACCOUNTING_ACCRUAL &&
                GL_FIELDS_ACCRUAL_ONLY.map(({ name, label }) => (
                  <div key={name} className="space-y-1.5">
                    <label className="block text-sm font-medium">{label}</label>
                    <Select
                      value={watch(name as any) ? String(watch(name as any)) : ""}
                      onValueChange={(v) => setValue(name as any, v ? Number(v) : ("" as any))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={`Select ${label}`} />
                      </SelectTrigger>
                      <SelectContent>
                        {[
                          ...(glAccountOptions?.assetAccountOptions ?? []),
                          ...(glAccountOptions?.liabilityAccountOptions ?? []),
                          ...(glAccountOptions?.equityAccountOptions ?? []),
                          ...(glAccountOptions?.incomeAccountOptions ?? []),
                          ...(glAccountOptions?.expenseAccountOptions ?? []),
                        ].map((o: any) => (
                          <SelectItem key={o.id} value={String(o.id)}>
                            {o.name} ({o.glCode})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
            </CardContent>
          )}
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
                    <Select
                      value={String(slab.periodType)}
                      onValueChange={(v) => updateSlab(i, "periodType", Number(v))}
                    >
                      <SelectTrigger className="mt-0.5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(chartPeriodTypes.length > 0
                          ? chartPeriodTypes
                          : [
                              { id: 0, value: "Days" },
                              { id: 1, value: "Weeks" },
                              { id: 2, value: "Months" },
                              { id: 3, value: "Years" },
                            ]
                        ).map((pt: any) => (
                          <SelectItem key={pt.id} value={String(pt.id)}>
                            {pt.value ?? pt.label}
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
          <Button variant="outline" type="button" onClick={() => navigate("/deposits/recurring-products")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} className="bg-[#D32F2F] hover:bg-red-700">
            {isSubmitting ? (
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
      </form>
    </div>
  );
};

export default RecurringDepositProductFormPage;
