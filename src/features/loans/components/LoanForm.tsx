import { type FC, useCallback, useEffect } from "react";
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
import type { Loan, LoanTemplate } from "../types/loan";
import { currentDate } from "@/lib/utils";

interface LoanFormProps {
  products: Array<{ id: number; name: string; multiDisburseLoan?: boolean }>;
  loan?: Loan;
  /** Loans template (doc §3/§4): carries product defaults + option sets. */
  template?: Partial<LoanTemplate>;
  /** Client-scoped template is being fetched (create mode). */
  templateLoading?: boolean;
  onSubmit: (values: CreateLoanFormValues) => Promise<void>;
  isSubmitting: boolean;
  error?: string | null;
  mode: "create" | "edit";
  clientId?: number;
  onClientChange?: (clientId: number) => void;
  onProductIdChange?: (productId: number) => void;
  strategyOptions?: Array<{ code: string; name: string }>;
  fundOptions?: Array<{ id: number; name: string }>;
  loanOfficerOptions?: Array<{ id: number; displayName?: string; name?: string }>;
  loanPurposeOptions?: Array<{ id: number; name: string }>;
  accountLinkingOptions?: Array<{ id: number; accountNo?: string; productName?: string }>;
  /** Preview the repayment schedule before submitting (POST /loans?command=calculateLoanSchedule) */
  onPreviewSchedule?: (values: FormFields) => void;
  previewLoading?: boolean;
}

/** Type override for fields not in the Zod schema yet */
export type FormFields = CreateLoanFormValues & {
  repaymentsStartingFromDate?: string;
};

/** Frequency options (0=Days, 1=Weeks, 2=Months, 3=Years) shared by term & repayment selects */
const FREQUENCY_OPTIONS = [
  { id: 0, label: "Days" },
  { id: 1, label: "Weeks" },
  { id: 2, label: "Months" },
  { id: 3, label: "Years" },
];

// ─── Loan Form Component ─────────────────────────────────────────
const LoanForm: FC<LoanFormProps> = ({
  products,
  loan,
  template,
  templateLoading,
  onSubmit,
  isSubmitting,
  error,
  mode,
  clientId,
  onClientChange,
  onProductIdChange,
  strategyOptions,
  fundOptions,
  loanOfficerOptions,
  loanPurposeOptions,
  accountLinkingOptions,
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
      loanTermFrequency: loan?.termFrequency ?? 0,
      loanTermFrequencyType: loan?.termPeriodFrequencyType?.id ?? 0,
      numberOfRepayments: loan?.numberOfRepayments ?? 0,
      repaymentEvery: loan?.repaymentEvery ?? 1,
      repaymentFrequencyType: loan?.repaymentFrequencyType?.id ?? 0,
      interestRatePerPeriod: loan?.interestRatePerPeriod ?? 0,
      interestRateFrequencyType: loan?.interestRateFrequencyType?.id ?? 0,
      interestType: loan?.interestType?.id ?? 0,
      amortizationType: loan?.amortizationType?.id ?? 0,
      interestCalculationPeriodType: loan?.interestCalculationPeriodType?.id ?? 0,
      expectedDisbursementDate: currentDate(loan?.expectedDisbursementDate) || currentDate(),
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
      maxOutstandingLoanBalance: undefined,
      repaymentsStartingFromDate: "",
      dateFormat: "yyyy-MM-dd",
      locale: "en",
    },
  });

  const productIdVal = watch("productId");
  const clientIdVal = watch("clientId");

  // Report client/product changes so the page can (re)load the template (doc §3).
  useEffect(() => {
    if (mode === "create") onClientChange?.(clientIdVal);
  }, [clientIdVal, onClientChange, mode]);

  useEffect(() => {
    if (mode === "create") onProductIdChange?.(productIdVal);
  }, [productIdVal, onProductIdChange, mode]);

  // ── Prefill product defaults from the product-scoped template (doc §3/§7) ─────
  const prefillFromTemplate = useCallback(
    (tpl: Partial<LoanTemplate>) => {
      if (tpl.principal != null) setValue("principal", tpl.principal);
      if (tpl.termFrequency != null) setValue("loanTermFrequency", tpl.termFrequency);
      if (tpl.termPeriodFrequencyType?.id != null) setValue("loanTermFrequencyType", tpl.termPeriodFrequencyType.id);
      if (tpl.numberOfRepayments != null) setValue("numberOfRepayments", tpl.numberOfRepayments);
      if (tpl.repaymentEvery != null) setValue("repaymentEvery", tpl.repaymentEvery);
      if (tpl.repaymentFrequencyType?.id != null) setValue("repaymentFrequencyType", tpl.repaymentFrequencyType.id);
      if (tpl.interestRatePerPeriod != null) setValue("interestRatePerPeriod", tpl.interestRatePerPeriod);
      if (tpl.interestRateFrequencyType?.id != null)
        setValue("interestRateFrequencyType", tpl.interestRateFrequencyType.id);
      if (tpl.interestType?.id != null) setValue("interestType", tpl.interestType.id);
      if (tpl.amortizationType?.id != null) setValue("amortizationType", tpl.amortizationType.id);
      if (tpl.interestCalculationPeriodType?.id != null)
        setValue("interestCalculationPeriodType", tpl.interestCalculationPeriodType.id);
      if (tpl.transactionProcessingStrategyCode)
        setValue("transactionProcessingStrategyCode", tpl.transactionProcessingStrategyCode);
      if (tpl.graceOnPrincipalPayment != null) setValue("graceOnPrincipalPayment", tpl.graceOnPrincipalPayment);
      if (tpl.graceOnInterestPayment != null) setValue("graceOnInterestPayment", tpl.graceOnInterestPayment);
      if (tpl.graceOnInterestCharged != null) setValue("graceOnInterestCharged", tpl.graceOnInterestCharged);
      if (tpl.graceOnArrearsAgeing != null) setValue("graceOnArrearsAgeing", tpl.graceOnArrearsAgeing);
      if (tpl.inArrearsTolerance != null) setValue("inArrearsTolerance", tpl.inArrearsTolerance);
      if (tpl.maxOutstandingLoanBalance != null) setValue("maxOutstandingLoanBalance", tpl.maxOutstandingLoanBalance);
      if (tpl.expectedDisbursementDate) setValue("expectedDisbursementDate", currentDate(tpl.expectedDisbursementDate));
    },
    [setValue],
  );

  // Apply the template's business-day default for the disbursement date (doc §5).
  useEffect(() => {
    if (template?.expectedDisbursementDate) {
      setValue("expectedDisbursementDate", currentDate(template.expectedDisbursementDate));
    }
  }, [template?.expectedDisbursementDate, setValue]);

  useEffect(() => {
    if (!template) return;
    // Only apply product defaults once a product is selected and the template
    // actually corresponds to the current selection.
    if (template.loanProductId == null && template.principal == null) return;
    if (template.loanProductId != null && template.loanProductId !== productIdVal) return;
    prefillFromTemplate(template);
  }, [template, prefillFromTemplate, productIdVal]);

  // ── Product select handler ───────────────────────────────────────
  const handleProductSelect = (id: number) => {
    if (id === 0) {
      setValue("productId", 0, { shouldValidate: true });
      return;
    }
    setValue("productId", id, { shouldValidate: true });
  };

  // ── Client change handler ────────────────────────────────────────
  const handleClientChange = useCallback(
    (id: number) => {
      setValue("clientId", id, { shouldValidate: true });
      if (mode === "create") {
        setValue("productId", 0, { shouldValidate: true });
      }
    },
    [setValue, mode],
  );

  // ── Sync term frequency type with repayment frequency type (doc §8/§11) ──
  const syncFrequencyType = (v: number) => {
    setValue("loanTermFrequencyType", v, { shouldValidate: true });
    setValue("repaymentFrequencyType", v, { shouldValidate: true });
  };

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
              value={productIdVal}
              onChange={handleProductSelect}
              loading={templateLoading}
              disabled={isSubmitting || mode === "edit" || (mode === "create" && !clientIdVal)}
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

          {/* Row 4: Loan Term Frequency Type | Number of Repayments */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium">Loan Term Frequency Type *</label>
            <Select
              value={String(watch("loanTermFrequencyType") ?? 2)}
              onValueChange={(v) => syncFrequencyType(Number(v))}
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FREQUENCY_OPTIONS.map((o) => (
                  <SelectItem key={o.id} value={String(o.id)}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.loanTermFrequencyType && (
              <p className="text-xs text-red-500">{errors.loanTermFrequencyType.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium">Number of Repayments *</label>
            <Input
              type="number"
              {...register("numberOfRepayments", { valueAsNumber: true })}
              disabled={isSubmitting}
              error={errors.numberOfRepayments?.message}
            />
          </div>

          {/* Row 5: Repayment Every | Repayment Frequency Type */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium">Repayment Every *</label>
            <Input
              type="number"
              {...register("repaymentEvery", { valueAsNumber: true })}
              disabled={isSubmitting}
              error={errors.repaymentEvery?.message}
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium">Repayment Frequency Type *</label>
            <Select
              value={String(watch("repaymentFrequencyType"))}
              onValueChange={(v) => syncFrequencyType(Number(v))}
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FREQUENCY_OPTIONS.map((o) => (
                  <SelectItem key={o.id} value={String(o.id)}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.repaymentFrequencyType && (
              <p className="text-xs text-red-500">{errors.repaymentFrequencyType.message}</p>
            )}
          </div>

          {/* Row 6: Interest Type | Interest Rate Frequency */}
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

          {/* Row 7: Interest Calculation Period | Amortization Type */}
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

          {/* Row 8: Grace Settings */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium">Grace on Principal Payment</label>
            <Input
              type="number"
              {...register("graceOnPrincipalPayment", { valueAsNumber: true })}
              disabled={isSubmitting}
              error={errors.graceOnPrincipalPayment?.message}
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium">Grace on Interest Payment</label>
            <Input
              type="number"
              {...register("graceOnInterestPayment", { valueAsNumber: true })}
              disabled={isSubmitting}
              error={errors.graceOnInterestPayment?.message}
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium">Grace on Interest Charged</label>
            <Input
              type="number"
              {...register("graceOnInterestCharged", { valueAsNumber: true })}
              disabled={isSubmitting}
              error={errors.graceOnInterestCharged?.message}
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

          {/* Row 9: In Arrears Tolerance | Max Outstanding */}
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

          {/* Row 10: Submitted On Date | Expected Disbursement Date */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium">Submitted On Date *</label>
            <Input
              type="date"
              {...register("submittedOnDate")}
              disabled={isSubmitting}
              error={errors.submittedOnDate?.message}
            />
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

          {/* Row 11: Expected First Repayment Date | Repayments Starting From */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium">Repayments Starting From Date</label>
            <Input type="date" {...register("repaymentsStartingFromDate")} disabled={isSubmitting} />
          </div>

          {/* Row 12: Transaction Processing Strategy */}
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
                {(strategyOptions ?? []).length > 0 ? (
                  (strategyOptions ?? []).map((o) => (
                    <SelectItem key={o.code} value={o.code}>
                      {o.name}
                    </SelectItem>
                  ))
                ) : (
                  <>
                    <SelectItem value="mifos-standard-strategy">Mifos Standard Strategy</SelectItem>
                    <SelectItem value="heavensfamily-strategy">Heavensfamily Strategy</SelectItem>
                    <SelectItem value="early-repayment-strategy">Early Repayment Strategy</SelectItem>
                    <SelectItem value="advance-payment-allocation-strategy">
                      Advance Payment Allocation Strategy
                    </SelectItem>
                    <SelectItem value="principal-interest-penalty-fees-order-strategy">
                      P-I-Penalty-Fees Order
                    </SelectItem>
                    <SelectItem value="interest-principal-penalty-fees-order-strategy">
                      I-P-Penalty-Fees Order
                    </SelectItem>
                    <SelectItem value="penalties-fees-interest-principal-order-strategy">
                      Penalties-Fees-I-P Order
                    </SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Row 13: Allow Partial Interest Calculation */}
          <div
            className="col-span-2 flex items-center gap-2 pt-2 cursor-pointer"
            onClick={() =>
              setValue("allowPartialPeriodInterestCalcualtion", !watch("allowPartialPeriodInterestCalcualtion"))
            }
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
            <Select
              value={watch("fundId") ? String(watch("fundId")) : "0"}
              onValueChange={(v) => setValue("fundId", v === "0" ? undefined : Number(v))}
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select fund" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">None</SelectItem>
                {(fundOptions ?? []).map((o) => (
                  <SelectItem key={o.id} value={String(o.id)}>
                    {o.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium">Loan Officer</label>
            <Select
              value={watch("loanOfficerId") ? String(watch("loanOfficerId")) : "0"}
              onValueChange={(v) => setValue("loanOfficerId", v === "0" ? undefined : Number(v))}
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select loan officer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">None</SelectItem>
                {(loanOfficerOptions ?? []).map((o) => (
                  <SelectItem key={o.id} value={String(o.id)}>
                    {o.displayName ?? o.name ?? `Officer #${o.id}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium">Loan Purpose</label>
            <Select
              value={watch("loanPurposeId") ? String(watch("loanPurposeId")) : "0"}
              onValueChange={(v) => setValue("loanPurposeId", v === "0" ? undefined : Number(v))}
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select loan purpose" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">None</SelectItem>
                {(loanPurposeOptions ?? []).map((o) => (
                  <SelectItem key={o.id} value={String(o.id)}>
                    {o.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium">Link Account</label>
            <Select
              value={watch("linkAccountId") ? String(watch("linkAccountId")) : "0"}
              onValueChange={(v) => setValue("linkAccountId", v === "0" ? undefined : Number(v))}
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select linked savings account" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">None</SelectItem>
                {(accountLinkingOptions ?? []).map((o) => (
                  <SelectItem key={o.id} value={String(o.id)}>
                    {o.accountNo ?? o.productName ?? `Account #${o.id}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
