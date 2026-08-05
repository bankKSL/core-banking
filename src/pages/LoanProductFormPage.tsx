import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

import { Skeleton } from "@/components/ui/skeleton";
import {
  createLoanProduct,
  updateLoanProduct,
  useLoanProduct,
  useLoanProductTemplate,
  useFunds,
} from "@/features/loans";
import type { LoanProductCreateRequest, LoanProductTemplate } from "@/features/loans";
import { CurrencySelect } from "@/components/shared/CurrencySelect";

/** Extract string value from Finfact enum objects {id,code,value} or primitive */
function enumVal(v: any, fallback = ""): string {
  if (v == null) return fallback;
  if (typeof v === "object") return v.code ?? v.value ?? String(v.id) ?? fallback;
  return String(v);
}

const loanProductSchema = z.object({
  name: z.string().min(1, "Name is required"),
  shortName: z.string().min(1, "Short name is required").max(4, "Max 4 chars"),
  description: z.string().optional(),
  externalId: z.string().optional(),
  currencyCode: z.string().min(1, "Currency is required"),
  digitsAfterDecimal: z.coerce.number().int().min(0).max(6),
  principal: z.coerce.number().positive("Principal must be > 0"),
  minPrincipal: z.coerce.number().optional(),
  maxPrincipal: z.coerce.number().optional(),
  numberOfRepayments: z.coerce.number().int().positive("Required"),
  minNumberOfRepayments: z.coerce.number().optional(),
  maxNumberOfRepayments: z.coerce.number().optional(),
  repaymentEvery: z.coerce.number().int().positive("Required"),
  repaymentFrequencyType: z.coerce.number(),
  amortizationType: z.coerce.number(),
  interestCalculationPeriodType: z.coerce.number(),
  allowPartialPeriodInterestCalculation: z.boolean().optional(),
  transactionProcessingStrategyCode: z.string().min(1, "Required"),
  loanScheduleType: z.string().optional(),
  daysInYearType: z.coerce.number(),
  daysInMonthType: z.coerce.number(),
  isInterestRecalculationEnabled: z.boolean(),
  interestRatePerPeriod: z.coerce.number().min(0, "Required"),
  minInterestRatePerPeriod: z.coerce.number().optional(),
  maxInterestRatePerPeriod: z.coerce.number().optional(),
  interestType: z.coerce.number(),
  interestRateFrequencyType: z.coerce.number().optional(),
  graceOnPrincipalPayment: z.coerce.number().optional(),
  graceOnInterestPayment: z.coerce.number().optional(),
  graceOnInterestCharged: z.coerce.number().optional(),
  graceOnArrearsAgeing: z.coerce.number().optional(),
  multiDisburseLoan: z.boolean().optional(),
  maxTrancheCount: z.coerce.number().optional(),
  outstandingLoanBalance: z.coerce.number().optional(),
  canDefineInstallmentAmount: z.boolean().optional(),
  installmentAmountInMultiplesOf: z.coerce.number().optional(),
  interestRecalculationCompoundingMethod: z.coerce.number().optional(),
  rescheduleStrategyMethod: z.coerce.number().optional(),
  recalculationRestFrequencyType: z.coerce.number().optional(),
  preClosureInterestCalculationStrategy: z.coerce.number().optional(),
  enableDownPayment: z.boolean().optional(),
  enableAutoRepaymentForDownPayment: z.boolean().optional(),
  repaymentStartDateType: z.coerce.number().optional(),
  enableBuyDownFee: z.boolean().optional(),
  merchantBuyDownFee: z.boolean().optional(),
  buyDownFeeCalculationType: z.string().optional(),
  buyDownFeeStrategy: z.string().optional(),
  buyDownFeeIncomeType: z.string().optional(),
  enableIncomeCapitalization: z.boolean().optional(),
  capitalizedIncomeCalculationType: z.string().optional(),
  capitalizedIncomeStrategy: z.string().optional(),
  capitalizedIncomeType: z.string().optional(),
  chargeOffBehaviour: z.string().optional(),
  enableAccrualActivityPosting: z.boolean().optional(),
  interestRecognitionOnDisbursementDate: z.boolean().optional(),
  isEqualAmortization: z.boolean().optional(),
  canUseForTopup: z.boolean().optional(),
  syncExpectedWithDisbursementDate: z.boolean().optional(),
  disallowExpectedDisbursements: z.boolean().optional(),
  allowApprovedDisbursedAmountsOverApplied: z.boolean().optional(),
  holdGuaranteeFunds: z.boolean().optional(),
  enableInstallmentLevelDelinquency: z.boolean().optional(),
  includeInBorrowerCycle: z.boolean().optional(),
  useBorrowerCycle: z.boolean().optional(),
  overdueDaysForNpa: z.coerce.number().optional(),
  minDaysBetweenDisbursalAndFirstRepayment: z.coerce.number().optional(),
  principalThresholdForLastInstallment: z.coerce.number().optional(),
  fixedPrincipalPercentagePerInstallment: z.coerce.number().optional(),
  dueDaysForRepaymentEvent: z.coerce.number().optional(),
  overdueDaysForRepaymentEvent: z.coerce.number().optional(),
  overAppliedCalculationType: z.string().optional(),
  overAppliedNumber: z.coerce.number().optional(),
  minimumGap: z.coerce.number().optional(),
  maximumGap: z.coerce.number().optional(),
  delinquencyBucketId: z.coerce.number().optional(),
  compoundingFrequencyType: z.coerce.number().optional(),
  isArrearsBasedOnOriginalSchedule: z.boolean().optional(),
  inArrearsTolerance: z.coerce.number().optional(),
  fundId: z.coerce.number().optional(),
  inMultiplesOf: z.coerce.number().optional(),
  accountingRule: z.coerce.number(),
  locale: z.string(),
  dateFormat: z.string(),
});

type LoanProductFormValues = z.infer<typeof loanProductSchema>;

const LoanProductFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const queryClient = useQueryClient();
  const { data: existingProduct, isLoading: productLoading } = useLoanProduct(id ? Number(id) : undefined);
  const { data: template } = useLoanProductTemplate();
  const { data: funds = [] } = useFunds();

  const createMutation = useMutation({
    mutationFn: (payload: LoanProductCreateRequest) => createLoanProduct(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loanProducts"] });
      navigate("/lending/products");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: Partial<LoanProductCreateRequest>) => updateLoanProduct(Number(id), payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loanProducts"] });
      navigate("/lending/products");
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<LoanProductFormValues>({
    resolver: zodResolver(loanProductSchema) as any,
    mode: "onChange",
    defaultValues: {
      name: "",
      shortName: "",
      currencyCode: "",
      digitsAfterDecimal: 2,
      principal: undefined,
      numberOfRepayments: 0,
      repaymentEvery: 1,
      repaymentFrequencyType: 2,
      amortizationType: 1,
      interestType: 0,
      interestCalculationPeriodType: 1,
      transactionProcessingStrategyCode: "mifos-standard-strategy",
      interestRatePerPeriod: 5,
      interestRateFrequencyType: 2,
      daysInYearType: undefined,
      daysInMonthType: undefined,
      isInterestRecalculationEnabled: false,
      accountingRule: 1,
      locale: "en",
      dateFormat: "yyyy-MM-dd",
      minInterestRatePerPeriod: 0,
      maxInterestRatePerPeriod: 100,
    },
  });

  const loanScheduleType = watch("loanScheduleType");
  const isProgressive = enumVal(loanScheduleType) === "PROGRESSIVE";

  // Populate form in edit mode
  useEffect(() => {
    if (!existingProduct) return;
    const p = existingProduct as any;
    reset({
      name: p.name ?? "",
      shortName: p.shortName ?? "",
      description: p.description ?? "",
      externalId: p.externalId ?? "",
      currencyCode: p.currency?.code ?? "USD",
      principal: p.principal ?? 0,
      minPrincipal: undefined,
      maxPrincipal: undefined,
      numberOfRepayments: p.numberOfRepayments ?? 12,
      minNumberOfRepayments: p.minNumberOfRepayments > 0 ? p.minNumberOfRepayments : undefined,
      maxNumberOfRepayments: p.maxNumberOfRepayments > 0 ? p.maxNumberOfRepayments : undefined,
      repaymentEvery: p.repaymentEvery ?? 1,
      repaymentFrequencyType: p.repaymentFrequencyType?.id ?? 2,
      amortizationType: p.amortizationType?.id ?? 1,
      interestCalculationPeriodType: p.interestCalculationPeriodType?.id ?? 0,
      allowPartialPeriodInterestCalculation: !!p.allowPartialPeriodInterestCalculation,
      transactionProcessingStrategyCode: p.transactionProcessingStrategyCode ?? "mifos-standard-strategy",
      loanScheduleType: enumVal(p.loanScheduleType, "CUMULATIVE"),
      daysInYearType: p.daysInYearType?.id ?? 1,
      daysInMonthType: p.daysInMonthType?.id ?? 1,
      isInterestRecalculationEnabled: !!p.isInterestRecalculationEnabled,
      interestRatePerPeriod: p.interestRatePerPeriod ?? 0,
      minInterestRatePerPeriod: p.minInterestRatePerPeriod ?? undefined,
      maxInterestRatePerPeriod: p.maxInterestRatePerPeriod ?? undefined,
      interestType: p.interestType?.id ?? 0,
      interestRateFrequencyType: p.interestRateFrequencyType?.id ?? 3,
      graceOnPrincipalPayment: p.graceOnPrincipalPayment ?? undefined,
      graceOnInterestPayment: p.graceOnInterestPayment ?? undefined,
      graceOnInterestCharged: p.graceOnInterestCharged ?? undefined,
      graceOnArrearsAgeing: p.graceOnArrearsAgeing ?? undefined,
      multiDisburseLoan: !!p.multiDisburseLoan,
      maxTrancheCount: p.maxTrancheCount ?? undefined,
      outstandingLoanBalance: p.outstandingLoanBalance ?? undefined,
      canDefineInstallmentAmount: !!p.canDefineInstallmentAmount,
      installmentAmountInMultiplesOf: p.installmentAmountInMultiplesOf ?? undefined,
      interestRecalculationCompoundingMethod: p.interestRecalculationCompoundingMethod?.id ?? undefined,
      rescheduleStrategyMethod: p.rescheduleStrategyMethod?.id ?? undefined,
      recalculationRestFrequencyType: p.recalculationRestFrequencyType?.id ?? undefined,
      preClosureInterestCalculationStrategy: p.preClosureInterestCalculationStrategy?.id ?? undefined,
      enableDownPayment: !!p.enableDownPayment,
      enableAutoRepaymentForDownPayment: p.enableDownPayment ? p.enableAutoRepaymentForDownPayment : undefined,
      repaymentStartDateType: p.repaymentStartDateType?.id ?? undefined,
      enableBuyDownFee: !!p.enableBuyDownFee,
      merchantBuyDownFee: !!p.merchantBuyDownFee,
      buyDownFeeCalculationType: p.buyDownFeeCalculationType?.id ?? undefined,
      buyDownFeeStrategy: p.buyDownFeeStrategy?.id ?? undefined,
      buyDownFeeIncomeType: p.buyDownFeeIncomeType?.id ?? undefined,
      enableIncomeCapitalization: !!p.enableIncomeCapitalization,
      capitalizedIncomeCalculationType: p.capitalizedIncomeCalculationType?.id ?? undefined,
      capitalizedIncomeStrategy: p.capitalizedIncomeStrategy?.id ?? undefined,
      capitalizedIncomeType: p.capitalizedIncomeType?.id ?? undefined,
      chargeOffBehaviour: enumVal(p.chargeOffBehaviour.id, undefined) || undefined,
      enableAccrualActivityPosting: !!p.enableAccrualActivityPosting,
      interestRecognitionOnDisbursementDate: !!p.interestRecognitionOnDisbursementDate,
      isEqualAmortization: !!p.isEqualAmortization,
      canUseForTopup: !!p.canUseForTopup,
      syncExpectedWithDisbursementDate: !!p.syncExpectedWithDisbursementDate,
      disallowExpectedDisbursements: !!p.disallowExpectedDisbursements,
      allowApprovedDisbursedAmountsOverApplied: !!p.allowApprovedDisbursedAmountsOverApplied,
      holdGuaranteeFunds: !!p.holdGuaranteeFunds,
      enableInstallmentLevelDelinquency: !!p.enableInstallmentLevelDelinquency,
      includeInBorrowerCycle: !!p.includeInBorrowerCycle,
      useBorrowerCycle: !!p.useBorrowerCycle,
      overdueDaysForNpa: p.overdueDaysForNpa ?? undefined,
      minDaysBetweenDisbursalAndFirstRepayment: p.minDaysBetweenDisbursalAndFirstRepayment ?? undefined,
      principalThresholdForLastInstallment: p.principalThresholdForLastInstallment ?? undefined,
      fixedPrincipalPercentagePerInstallment: p.fixedPrincipalPercentagePerInstallment ?? undefined,
      dueDaysForRepaymentEvent: p.dueDaysForRepaymentEvent ?? undefined,
      overdueDaysForRepaymentEvent: p.overdueDaysForRepaymentEvent ?? undefined,
      overAppliedCalculationType: p.overAppliedCalculationType ?? undefined,
      overAppliedNumber: p.allowApprovedDisbursedAmountsOverApplied ? p.overAppliedNumber : undefined,
      minimumGap: p.minimumGap > 0 ? p.minimumGap : undefined,
      maximumGap: p.maximumGap > 0 ? p.maximumGap : undefined,
      delinquencyBucketId: p.delinquencyBucketId ?? undefined,
      compoundingFrequencyType: p.interestRecalculationData?.compoundingFrequencyType?.id ?? undefined,
      isArrearsBasedOnOriginalSchedule: !!p.interestRecalculationData?.isArrearsBasedOnOriginalSchedule,
      inArrearsTolerance: p.inArrearsTolerance ?? undefined,
      fundId: p.fundId ?? undefined,
      digitsAfterDecimal: p.currency?.decimalPlaces ?? 2,
      inMultiplesOf: p.currency?.inMultiplesOf ?? 0,
      accountingRule: p.accountingRule?.id ?? 1,
      locale: "en",
      dateFormat: "yyyy-MM-dd",
    });
  }, [existingProduct, reset]);

  const onSubmit = async (values: LoanProductFormValues) => {
    const payload: Record<string, any> = { ...values };

    console.log({ payload });

    Object.keys(payload).forEach((k) => {
      if (payload[k] === undefined) delete payload[k];
    });

    try {
      if (isEdit) {
        await updateMutation.mutateAsync(payload as any);
      } else {
        await createMutation.mutateAsync(payload as any);
      }
    } catch {
      // error handled by onError
    }
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
        title={isEdit ? "Edit Loan Product" : "Create Loan Product"}
        description="Configure the loan product terms and settings."
        actions={
          <Button variant="outline" onClick={() => navigate("/lending/products")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
        }
      />

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Product Details</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-x-6 gap-y-4">
            {/* Row 1: Name | Short Name */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">Name *</label>
              <Input {...register("name")} error={errors.name?.message} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">Short Name</label>
              <Input {...register("shortName")} error={errors.shortName?.message} />
            </div>
            {/* Row 2 FULL: Description */}
            <div className="space-y-1.5 col-span-2">
              <label className="block text-sm font-medium">Description</label>
              <Textarea {...register("description")} rows={3} placeholder="Brief product description" />
            </div>
            {/* Row 3 FULL: External ID */}
            <div className="space-y-1.5 col-span-2">
              <label className="block text-sm font-medium">External ID</label>
              <Input {...register("externalId")} error={errors.externalId?.message} />
            </div>
            {/* Row 4: Fund | Currency Code */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">Fund</label>
              <Select
                value={watch("fundId") ? String(watch("fundId")) : ""}
                onValueChange={(v) => setValue("fundId", Number(v))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select fund" />
                </SelectTrigger>
                <SelectContent>
                  {funds.map((f: any) => (
                    <SelectItem key={f.id} value={String(f.id)}>
                      {f.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <CurrencySelect
              value={watch("currencyCode")}
              onChange={(v) => setValue("currencyCode", v, { shouldValidate: true })}
              error={errors.currencyCode?.message}
            />
            {/* Row 5: Principal | Interest Rate */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">Principal *</label>
              <Input type="number" step="0.01" {...register("principal")} error={errors.principal?.message} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">Interest Rate (%) *</label>
              <Input
                type="number"
                step="0.01"
                {...register("interestRatePerPeriod")}
                error={errors.interestRatePerPeriod?.message}
              />
            </div>
            {/* Row 5b: Min/Max Principal */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">Min Principal</label>
              <Input type="number" step="0.01" {...register("minPrincipal")} error={errors.minPrincipal?.message} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">Max Principal</label>
              <Input type="number" step="0.01" {...register("maxPrincipal")} error={errors.maxPrincipal?.message} />
            </div>
            {/* Row 6: Repayments | Every */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">Number of Repayments *</label>
              <Input type="number" {...register("numberOfRepayments")} error={errors.numberOfRepayments?.message} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">Repayment Every *</label>
              <Input type="number" {...register("repaymentEvery")} error={errors.repaymentEvery?.message} />
            </div>
            {/* Row 6b: Min/Max Repayments */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">Min Number of Repayments</label>
              <Input type="number" {...register("minNumberOfRepayments")} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">Max Number of Repayments</label>
              <Input type="number" {...register("maxNumberOfRepayments")} />
            </div>
            {/* Row 7: Repayment Frequency | Interest Type */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">Repayment Frequency *</label>
              <Select
                value={String(watch("repaymentFrequencyType"))}
                onValueChange={(v) => setValue("repaymentFrequencyType", Number(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(template?.repaymentFrequencyTypeOptions ?? []).map((o) => (
                    <SelectItem key={o.id} value={String(o.id)}>
                      {o.value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">Interest Rate Frequency</label>
              <Select
                value={String(watch("interestRateFrequencyType") ?? 3)}
                onValueChange={(v) => setValue("interestRateFrequencyType", Number(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(template?.interestRateFrequencyTypeOptions ?? []).map((o) => (
                    <SelectItem key={o.id} value={String(o.id)}>
                      {o.value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Row 8: Amortization | Interest Calculation Period */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">Amortization Type</label>
              <Select
                value={String(watch("amortizationType"))}
                onValueChange={(v) => setValue("amortizationType", Number(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(template?.amortizationTypeOptions ?? []).map((o) => (
                    <SelectItem key={o.id} value={String(o.id)}>
                      {o.value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">Interest Type</label>
              <Select value={String(watch("interestType"))} onValueChange={(v) => setValue("interestType", Number(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(template?.interestTypeOptions ?? []).map((o) => (
                    <SelectItem key={o.id} value={String(o.id)}>
                      {o.value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Row 8b: Grace Settings */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">Grace on Principal Payment</label>
              <Input type="number" {...register("graceOnPrincipalPayment")} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">Grace on Interest Payment</label>
              <Input type="number" {...register("graceOnInterestPayment")} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">Grace on Interest Charged</label>
              <Input type="number" {...register("graceOnInterestCharged")} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">Grace on Arrears Ageing</label>
              <Input type="number" {...register("graceOnArrearsAgeing")} />
            </div>
            {/* Row 8c: Allow Partial Period Interest */}
            <div
              className="col-span-2 flex items-center gap-2 pt-2 cursor-pointer"
              onClick={() =>
                setValue("allowPartialPeriodInterestCalculation", !watch("allowPartialPeriodInterestCalculation"))
              }
            >
              <Checkbox
                id="allowPartialPeriodInterestCalculation"
                checked={!!watch("allowPartialPeriodInterestCalculation")}
                onCheckedChange={(v) => setValue("allowPartialPeriodInterestCalculation", v === true)}
              />
              <label htmlFor="allowPartialPeriodInterestCalculation" className="block text-sm font-medium">
                Allow Partial Period Interest Calculation
              </label>
            </div>
            {/* Row 8d: Days In Month Type */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">Days In Month Type</label>
              <Select
                value={String(watch("daysInMonthType") ?? 1)}
                onValueChange={(v) => setValue("daysInMonthType", Number(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(template?.daysInMonthTypeOptions ?? []).map((o) => (
                    <SelectItem key={o.id} value={String(o.id)}>
                      {o.value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Row 9: Loan Schedule Type | Transaction Strategy */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">Loan Schedule Type</label>
              <Select
                value={String(watch("loanScheduleType") ?? "CUMULATIVE")}
                onValueChange={(v) => setValue("loanScheduleType", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(template?.loanScheduleTypeOptions ?? []).map((o) => (
                    <SelectItem key={o.id} value={o.code}>
                      {o.value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">Transaction Processing Strategy</label>
              <Select
                value={watch("transactionProcessingStrategyCode") ?? ""}
                onValueChange={(v) => setValue("transactionProcessingStrategyCode", v)}
                disabled={isProgressive}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select strategy" />
                </SelectTrigger>
                <SelectContent>
                  {(template?.transactionProcessingStrategyOptions ?? [])
                    .filter((s) =>
                      isProgressive
                        ? s.code === "advance-payment-allocation-strategy"
                        : s.code !== "advance-payment-allocation-strategy",
                    )
                    .map((o) => (
                      <SelectItem key={o.code} value={o.code}>
                        {o.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            {/* Row 10: Days In Year Type */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">Days In Year Type</label>
              <Select
                value={String(watch("daysInYearType") ?? 1)}
                onValueChange={(v) => setValue("daysInYearType", Number(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(template?.daysInYearTypeOptions ?? []).map((o) => (
                    <SelectItem key={o.id} value={String(o.id)}>
                      {o.value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div />
            {/* ── Recalculation ── */}
            <div
              className="col-span-2 flex items-center gap-2 pt-2 cursor-pointer"
              onClick={() => setValue("isInterestRecalculationEnabled", !watch("isInterestRecalculationEnabled"))}
            >
              <Checkbox
                id="isInterestRecalculationEnabled"
                checked={!!watch("isInterestRecalculationEnabled")}
                onCheckedChange={(v) => setValue("isInterestRecalculationEnabled", v === true)}
              />
              <label htmlFor="isInterestRecalculationEnabled" className="block text-sm font-medium">
                Interest Recalculation Enabled
              </label>
            </div>
            {watch("isInterestRecalculationEnabled") && (
              <>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium">Compounding Method</label>
                  <Select
                    value={
                      watch("interestRecalculationCompoundingMethod")
                        ? String(watch("interestRecalculationCompoundingMethod"))
                        : ""
                    }
                    onValueChange={(v) => setValue("interestRecalculationCompoundingMethod", Number(v))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {(template?.interestRecalculationCompoundingTypeOptions ?? []).map((o) => (
                        <SelectItem key={o.id} value={String(o.id)}>
                          {o.value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium">Reschedule Strategy Method</label>
                  <Select
                    value={watch("rescheduleStrategyMethod") ? String(watch("rescheduleStrategyMethod")) : ""}
                    onValueChange={(v) => setValue("rescheduleStrategyMethod", Number(v))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {(template?.rescheduleStrategyTypeOptions ?? []).map((o) => (
                        <SelectItem key={o.id} value={String(o.id)}>
                          {o.value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium">Rest Frequency Type</label>
                  <Select
                    value={
                      watch("recalculationRestFrequencyType") ? String(watch("recalculationRestFrequencyType")) : ""
                    }
                    onValueChange={(v) => setValue("recalculationRestFrequencyType", Number(v))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {(template?.interestRecalculationFrequencyTypeOptions ?? []).map((o) => (
                        <SelectItem key={o.id} value={String(o.id)}>
                          {o.value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium">Pre-Closure Interest Calculation</label>
                  <Select
                    value={
                      watch("preClosureInterestCalculationStrategy")
                        ? String(watch("preClosureInterestCalculationStrategy"))
                        : ""
                    }
                    onValueChange={(v) => setValue("preClosureInterestCalculationStrategy", Number(v))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {(template?.preClosureInterestCalculationStrategyOptions ?? []).map((o) => (
                        <SelectItem key={o.id} value={String(o.id)}>
                          {o.value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {/* ── Multi-Disburse ── */}
            <div
              className="col-span-2 flex items-center gap-2 pt-2 cursor-pointer"
              onClick={() => setValue("multiDisburseLoan", !watch("multiDisburseLoan"))}
            >
              <Checkbox
                id="multiDisburseLoan"
                checked={!!watch("multiDisburseLoan")}
                onCheckedChange={(v) => setValue("multiDisburseLoan", v === true)}
              />
              <label htmlFor="multiDisburseLoan" className="block text-sm font-medium">
                Multi-Disburse Loan
              </label>
            </div>
            {watch("multiDisburseLoan") && (
              <>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium">Max Tranche Count</label>
                  <Input type="number" {...register("maxTrancheCount")} />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium">Outstanding Loan Balance</label>
                  <Input type="number" step="0.01" {...register("outstandingLoanBalance")} />
                </div>
                <div
                  className="col-span-2 flex items-center gap-2 pt-2 cursor-pointer"
                  onClick={() => setValue("canDefineInstallmentAmount", !watch("canDefineInstallmentAmount"))}
                >
                  <Checkbox
                    id="canDefineInstallmentAmount"
                    checked={!!watch("canDefineInstallmentAmount")}
                    onCheckedChange={(v) => setValue("canDefineInstallmentAmount", v === true)}
                  />
                  <label htmlFor="canDefineInstallmentAmount" className="block text-sm font-medium">
                    Can Define Installment Amount
                  </label>
                </div>
                {watch("canDefineInstallmentAmount") && (
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium">Installment Amount In Multiples Of</label>
                    <Input type="number" step="0.01" {...register("installmentAmountInMultiplesOf")} />
                  </div>
                )}
              </>
            )}

            {/* ── Down Payment ── */}
            <div
              className="col-span-2 flex items-center gap-2 pt-2 cursor-pointer"
              onClick={() => setValue("enableDownPayment", !watch("enableDownPayment"))}
            >
              <Checkbox
                id="enableDownPayment"
                checked={!!watch("enableDownPayment")}
                onCheckedChange={(v) => setValue("enableDownPayment", v === true)}
              />
              <label htmlFor="enableDownPayment" className="block text-sm font-medium">
                Enable Down Payment
              </label>
            </div>
            {watch("enableDownPayment") && (
              <>
                <div
                  className="col-span-2 flex items-center gap-2 pt-2 cursor-pointer"
                  onClick={() =>
                    setValue("enableAutoRepaymentForDownPayment", !watch("enableAutoRepaymentForDownPayment"))
                  }
                >
                  <Checkbox
                    id="enableAutoRepaymentForDownPayment"
                    checked={!!watch("enableAutoRepaymentForDownPayment")}
                    onCheckedChange={(v) => setValue("enableAutoRepaymentForDownPayment", v === true)}
                  />
                  <label htmlFor="enableAutoRepaymentForDownPayment" className="block text-sm font-medium">
                    Auto Repayment for Down Payment
                  </label>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium">Repayment Start Date Type</label>
                  <Input type="number" {...register("repaymentStartDateType")} />
                </div>
              </>
            )}

            {/* ── Progressive-only sections ── */}
            {isProgressive && (
              <>
                {/* Buydown Fee */}
                <div
                  className="col-span-2 flex items-center gap-2 pt-2 cursor-pointer"
                  onClick={() => setValue("enableBuyDownFee", !watch("enableBuyDownFee"))}
                >
                  <Checkbox
                    id="enableBuyDownFee"
                    checked={!!watch("enableBuyDownFee")}
                    onCheckedChange={(v) => setValue("enableBuyDownFee", v === true)}
                  />
                  <label htmlFor="enableBuyDownFee" className="block text-sm font-medium">
                    Enable Buy Down Fee
                  </label>
                </div>
                {watch("enableBuyDownFee") && (
                  <>
                    <div
                      className="col-span-2 flex items-center gap-2 pt-2 cursor-pointer"
                      onClick={() => setValue("merchantBuyDownFee", !watch("merchantBuyDownFee"))}
                    >
                      <Checkbox
                        id="merchantBuyDownFee"
                        checked={!!watch("merchantBuyDownFee")}
                        onCheckedChange={(v) => setValue("merchantBuyDownFee", v === true)}
                      />
                      <label htmlFor="merchantBuyDownFee" className="block text-sm font-medium">
                        Merchant Buy Down Fee
                      </label>
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium">Buy Down Fee Calculation Type</label>
                      <Select
                        value={watch("buyDownFeeCalculationType") ?? ""}
                        onValueChange={(v) => setValue("buyDownFeeCalculationType", v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {(template?.buyDownFeeCalculationTypeOptions ?? []).map((o) => (
                            <SelectItem key={o.id} value={o.id}>
                              {o.value}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium">Buy Down Fee Strategy</label>
                      <Select
                        value={watch("buyDownFeeStrategy") ?? ""}
                        onValueChange={(v) => setValue("buyDownFeeStrategy", v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {(template?.buyDownFeeStrategyOptions ?? []).map((o) => (
                            <SelectItem key={o.id} value={o.id}>
                              {o.value}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium">Buy Down Fee Income Type</label>
                      <Select
                        value={watch("buyDownFeeIncomeType") ?? ""}
                        onValueChange={(v) => setValue("buyDownFeeIncomeType", v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {(template?.buyDownFeeIncomeTypeOptions ?? []).map((o) => (
                            <SelectItem key={o.id} value={o.id}>
                              {o.value}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}

                {/* Income Capitalization */}
                <div
                  className="col-span-2 flex items-center gap-2 pt-2 cursor-pointer"
                  onClick={() => setValue("enableIncomeCapitalization", !watch("enableIncomeCapitalization"))}
                >
                  <Checkbox
                    id="enableIncomeCapitalization"
                    checked={!!watch("enableIncomeCapitalization")}
                    onCheckedChange={(v) => setValue("enableIncomeCapitalization", v === true)}
                  />
                  <label htmlFor="enableIncomeCapitalization" className="block text-sm font-medium">
                    Enable Income Capitalization
                  </label>
                </div>
                {watch("enableIncomeCapitalization") && (
                  <>
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium">Capitalized Income Calculation Type</label>
                      <Select
                        value={watch("capitalizedIncomeCalculationType") ?? ""}
                        onValueChange={(v) => setValue("capitalizedIncomeCalculationType", v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {(template?.capitalizedIncomeCalculationTypeOptions ?? []).map((o) => (
                            <SelectItem key={o.id} value={o.id}>
                              {o.value}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium">Capitalized Income Strategy</label>
                      <Select
                        value={watch("capitalizedIncomeStrategy") ?? ""}
                        onValueChange={(v) => setValue("capitalizedIncomeStrategy", v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {(template?.capitalizedIncomeStrategyOptions ?? []).map((o) => (
                            <SelectItem key={o.id} value={o.id}>
                              {o.value}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium">Capitalized Income Type</label>
                      <Select
                        value={watch("capitalizedIncomeType") ?? ""}
                        onValueChange={(v) => setValue("capitalizedIncomeType", v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {(template?.capitalizedIncomeTypeOptions ?? []).map((o) => (
                            <SelectItem key={o.id} value={o.id}>
                              {o.value}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}

                {/* Payment/Credit Allocation Editor */}
                <div className="col-span-2 rounded-lg border border-dashed border-gray-300 p-4 text-sm text-gray-400 text-center">
                  Payment/Credit Allocation Editor — Custom child component (not yet implemented)
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" type="button" onClick={() => navigate("/lending/products")}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={createMutation.isPending || updateMutation.isPending}
            className="bg-[#D32F2F] hover:bg-red-700"
          >
            {createMutation.isPending || updateMutation.isPending ? (
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

export default LoanProductFormPage;
