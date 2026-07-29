import { type FC, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClientSearch } from "@/components/shared/ClientSearch";
import { LoanProductSearch } from "@/components/shared/LoanProductSearch";
import { createLoanSchema, type CreateLoanFormValues } from "../schemas/loan.schema";
import type { LoanProduct, Loan } from "../types/loan";
import { currentDate } from "@/lib/utils";

interface LoanFormProps {
  products: LoanProduct[];
  loan?: Loan;
  onSubmit: (values: CreateLoanFormValues) => Promise<void>;
  isSubmitting: boolean;
  error?: string | null;
  mode: "create" | "edit";
  clientId?: number;
  strategyOptions?: Array<{ code: string; name: string }>;
  /** Preview the repayment schedule before submitting (POST /loans?command=calculateLoanSchedule) */
  onPreviewSchedule?: (values: FormFields) => void;
  previewLoading?: boolean;
}

/** Type override for fields not in the Zod schema yet */
export type FormFields = CreateLoanFormValues & {
  repaymentsStartingFromDate?: string;
};

// ─── Loan Form Component ─────────────────────────────────────────
const LoanForm: FC<LoanFormProps> = ({
  products,
  loan,
  onSubmit,
  isSubmitting,
  error,
  mode,
  clientId,
  strategyOptions,
  onPreviewSchedule,
  previewLoading,
}) => {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    getValues,
    formState: { errors },
  } = useForm<FormFields>({
    resolver: zodResolver(createLoanSchema) as any,
    defaultValues: {
      clientId: loan?.clientId ?? clientId ?? 0,
      productId: loan?.loanProductId ?? 0,
      principal: loan?.principal ?? 0,
      loanTermFrequency: loan?.termFrequency ?? 12,
      loanTermFrequencyType: loan?.termPeriodFrequencyType?.id ?? 2,
      numberOfRepayments: loan?.numberOfRepayments ?? 12,
      repaymentEvery: loan?.repaymentEvery ?? 1,
      repaymentFrequencyType: loan?.repaymentFrequencyType?.id ?? 2,
      interestRatePerPeriod: loan?.interestRatePerPeriod ?? 0,
      interestRateFrequencyType: loan?.interestRateFrequencyType?.id ?? 3,
      interestType: loan?.interestType?.id ?? 0,
      amortizationType: loan?.amortizationType?.id ?? 1,
      interestCalculationPeriodType: loan?.interestCalculationPeriodType?.id ?? 0,
      expectedDisbursementDate: currentDate(loan?.expectedDisbursementDate) || currentDate(),
      expectedFirstRepaymentOnDate: loan?.expectedFirstRepaymentOnDate ?? "",
      submittedOnDate: currentDate(loan?.submittedOnDate) || currentDate(),
      transactionProcessingStrategyCode: loan?.transactionProcessingStrategyCode ?? "mifos-standard-strategy",
      loanPurposeId: undefined,
      loanOfficerId: undefined,
      fundId: undefined,
      linkAccountId: undefined,
      externalId: loan?.externalId ?? "",
      graceOnPrincipalPayment: undefined,
      graceOnInterestPayment: undefined,
      graceOnInterestCharged: undefined,
      graceOnArrearsAgeing: undefined,
      inArrearsTolerance: undefined,
      allowPartialPeriodInterestCalcualtion: false,
      maxOutstandingLoanBalance: undefined,
      repaymentsStartingFromDate: "",
      dateFormat: "yyyy-MM-dd",
      locale: "en",
    },
  });

  const productId = watch("productId");

  // ── Product select handler ───────────────────────────────────────
  const handleProductSelect = (id: number) => {
    if (id === 0) {
      setValue("productId", 0, { shouldValidate: true });
      return;
    }

    const prod = products.find((p) => p.id === id);
    if (!prod) return;
    setValue("productId", prod.id);
    setValue("principal", prod.principal);
    setValue("numberOfRepayments", prod.numberOfRepayments);
    setValue("repaymentEvery", prod.repaymentEvery);
    setValue("repaymentFrequencyType", prod.repaymentFrequencyType.id);
    setValue("interestRatePerPeriod", prod.interestRatePerPeriod);
    if (prod.amortizationType?.id != null) setValue("amortizationType", prod.amortizationType.id as any);
    if (prod.interestType?.id != null) setValue("interestType", prod.interestType.id as any);
    if (prod.interestCalculationPeriodType?.id != null)
      setValue("interestCalculationPeriodType", prod.interestCalculationPeriodType.id as any);
  };

  const clientIdVal = watch("clientId");

  // ── Client change handler ────────────────────────────────────────
  const handleClientChange = useCallback(
    (id: number) => setValue("clientId", id, { shouldValidate: true }),
    [setValue],
  );

  return (
    <form onSubmit={handleSubmit((values) => onSubmit(values as any))} className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Row 1 (full width) — Client Search */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Client & Product</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-2">
          <div className="col-span-1">
            <ClientSearch
              value={clientIdVal}
              onChange={handleClientChange}
              disabled={isSubmitting || mode === "edit"}
              error={errors.clientId?.message}
            />
          </div>

          {/* Row 2 (full width) — Product select + create button */}
          <div className="col-span-1">
            <LoanProductSearch
              products={products}
              value={productId}
              onChange={handleProductSelect}
              disabled={isSubmitting || mode === "edit"}
              error={errors.productId?.message}
            />
          </div>
        </CardContent>
      </Card>

      {/* Rows 3-6: 2-column grid */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Loan Details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Row 3: Principal | Loan Term Frequency */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium">Principal *</label>
            <Input
              type="number"
              step="0.01"
              {...register("principal", { valueAsNumber: true })}
              disabled={isSubmitting}
              error={errors.principal?.message}
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium">Loan Term Frequency</label>
            <Input
              type="number"
              {...register("loanTermFrequency", { valueAsNumber: true })}
              disabled={isSubmitting}
              error={errors.loanTermFrequency?.message}
            />
          </div>

          {/* Row 4: # Repayments | Repayment Frequency Type */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium">Number of Repayments *</label>
            <Input
              type="number"
              {...register("numberOfRepayments", { valueAsNumber: true })}
              disabled={isSubmitting}
              error={errors.numberOfRepayments?.message}
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium">Repayment Frequency Type *</label>
            <Select
              value={String(watch("repaymentFrequencyType"))}
              onValueChange={(v) => setValue("repaymentFrequencyType", Number(v))}
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Days</SelectItem>
                <SelectItem value="1">Weeks</SelectItem>
                <SelectItem value="2">Months</SelectItem>
              </SelectContent>
            </Select>
            {errors.repaymentFrequencyType && (
              <p className="text-xs text-red-500">{errors.repaymentFrequencyType.message}</p>
            )}
          </div>

          {/* Row 5: Interest Type | Interest Calculation Period Type */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium">Interest Type *</label>
            <Select
              value={String(watch("interestType") ?? 0)}
              onValueChange={(v) => setValue("interestType", Number(v) as any)}
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Declining Balance</SelectItem>
                <SelectItem value="1">Flat</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium">Interest Rate Frequency</label>
            <Select
              value={String(watch("interestRateFrequencyType") ?? 3)}
              onValueChange={(v) => setValue("interestRateFrequencyType", Number(v) as any)}
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2">Per Month</SelectItem>
                <SelectItem value="3">Per Year</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Row 6: Interest Calculation Period | Amortization Type */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium">Interest Calculation Period Type *</label>
            <Select
              value={String(watch("interestCalculationPeriodType") ?? 0)}
              onValueChange={(v) => setValue("interestCalculationPeriodType", Number(v) as any)}
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Daily</SelectItem>
                <SelectItem value="1">Same as Repayment</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium">Amortization Type</label>
            <Select
              value={String(watch("amortizationType") ?? 1)}
              onValueChange={(v) => setValue("amortizationType", Number(v) as any)}
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Equal Principal</SelectItem>
                <SelectItem value="1">Equal Installments</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Row 7: Grace Settings */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium">Grace on Principal Payment</label>
            <Input
              type="number"
              {...register("graceOnPrincipalPayment", { valueAsNumber: true })}
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium">Grace on Interest Payment</label>
            <Input
              type="number"
              {...register("graceOnInterestPayment", { valueAsNumber: true })}
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium">Grace on Interest Charged</label>
            <Input
              type="number"
              {...register("graceOnInterestCharged", { valueAsNumber: true })}
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium">Grace on Arrears Ageing</label>
            <Input
              type="number"
              {...register("graceOnArrearsAgeing", { valueAsNumber: true })}
              disabled={isSubmitting}
            />
          </div>

          {/* Row 8: In Arrears Tolerance | Max Outstanding */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium">In Arrears Tolerance</label>
            <Input
              type="number"
              step="0.01"
              {...register("inArrearsTolerance", { valueAsNumber: true })}
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium">Max Outstanding Loan Balance</label>
            <Input
              type="number"
              step="0.01"
              {...register("maxOutstandingLoanBalance", { valueAsNumber: true })}
              disabled={isSubmitting}
            />
          </div>

          {/* Row 9: Submitted On Date | Expected Disbursement Date */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium">Submitted On Date *</label>
            <Input type="date" {...register("submittedOnDate")} disabled={isSubmitting} error={errors.submittedOnDate?.message} />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium">Expected Disbursement Date *</label>
            <Input
              type="date"
              {...register("expectedDisbursementDate")}
              disabled={isSubmitting}
              error={errors.expectedDisbursementDate?.message}
            />
          </div>

          {/* Row 10: Expected First Repayment Date | Repayments Starting From */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium">Expected First Repayment On Date</label>
            <Input
              type="date"
              {...register("expectedFirstRepaymentOnDate")}
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium">Repayments Starting From Date</label>
            <Input
              type="date"
              {...register("repaymentsStartingFromDate")}
              disabled={isSubmitting}
            />
          </div>

          {/* Row 11: Transaction Processing Strategy */}
          <div className="col-span-2 space-y-1.5">
            <label className="block text-sm font-medium">Transaction Processing Strategy</label>
            <Select
              value={watch("transactionProcessingStrategyCode") ?? "mifos-standard-strategy"}
              onValueChange={(v) => setValue("transactionProcessingStrategyCode", v)}
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(strategyOptions ?? []).length > 0
                  ? (strategyOptions ?? []).map((o) => (
                      <SelectItem key={o.code} value={o.code}>{o.name}</SelectItem>
                    ))
                  : (
                    <>
                      <SelectItem value="mifos-standard-strategy">Mifos Standard Strategy</SelectItem>
                      <SelectItem value="heavensfamily-strategy">Heavensfamily Strategy</SelectItem>
                      <SelectItem value="early-repayment-strategy">Early Repayment Strategy</SelectItem>
                      <SelectItem value="advance-payment-allocation-strategy">Advance Payment Allocation Strategy</SelectItem>
                      <SelectItem value="principal-interest-penalty-fees-order-strategy">P-I-Penalty-Fees Order</SelectItem>
                      <SelectItem value="interest-principal-penalty-fees-order-strategy">I-P-Penalty-Fees Order</SelectItem>
                      <SelectItem value="penalties-fees-interest-principal-order-strategy">Penalties-Fees-I-P Order</SelectItem>
                    </>
                  )}
              </SelectContent>
            </Select>
          </div>

          {/* Row 12: Allow Partial Interest Calculation */}
          <div
            className="col-span-2 flex items-center gap-2 pt-2 cursor-pointer"
            onClick={() => setValue("allowPartialPeriodInterestCalcualtion", !watch("allowPartialPeriodInterestCalcualtion"))}
          >
            <Checkbox
              id="allowPartialPeriodInterestCalcualtion"
              checked={!!watch("allowPartialPeriodInterestCalcualtion")}
              onCheckedChange={(v) => setValue("allowPartialPeriodInterestCalcualtion", v === true)}
            />
            <label htmlFor="allowPartialPeriodInterestCalcualtion" className="block text-sm font-medium cursor-pointer">
              Allow Partial Period Interest Calculation
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Additional Options Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Additional Options</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium">Fund</label>
            <Input
              type="number"
              placeholder="Fund ID"
              {...register("fundId", { valueAsNumber: true })}
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium">Loan Officer</label>
            <Input
              type="number"
              placeholder="Officer ID"
              {...register("loanOfficerId", { valueAsNumber: true })}
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium">Loan Purpose</label>
            <Input
              type="number"
              placeholder="Purpose ID"
              {...register("loanPurposeId", { valueAsNumber: true })}
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium">Link Account ID</label>
            <Input
              type="number"
              placeholder="Savings account ID"
              {...register("linkAccountId", { valueAsNumber: true })}
              disabled={isSubmitting}
            />
          </div>
          <div className="col-span-2 space-y-1.5">
            <label className="block text-sm font-medium">External ID</label>
            <Input
              {...register("externalId")}
              disabled={isSubmitting}
              placeholder="External reference"
              className="max-w-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        <Button type="submit" disabled={isSubmitting} className="bg-[#D32F2F] hover:bg-red-700">
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              {mode === "create" ? "Creating..." : "Saving..."}
            </span>
          ) : mode === "create" ? (
            "Create Loan"
          ) : (
            "Save Changes"
          )}
        </Button>
        {onPreviewSchedule && (
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting || previewLoading}
            onClick={() => onPreviewSchedule(getValues())}
          >
            {previewLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Calculating...
              </span>
            ) : (
              "Preview Schedule"
            )}
          </Button>
        )}
        <Button type="button" variant="outline" disabled={isSubmitting} onClick={() => window.history.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
};

export default LoanForm;
export type { LoanFormProps };
