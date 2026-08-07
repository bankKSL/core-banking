import { type FC, useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClientSearch } from "@/components/shared/ClientSearch";
import { LoanProductSearch } from "@/components/shared/LoanProductSearch";
import { LoanOriginatorPicker } from "@/features/loan-originators";
import type { LoanOriginator } from "@/features/loan-originators";
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
  originators?: Array<{ id: number; name?: string | null }>;
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
    resolver: zodResolver(createLoanSchema) as Resolver<FormFields>,
    defaultValues: {
      clientId: loan?.clientId ?? clientId ?? undefined,
      productId: loan?.loanProductId ?? undefined,
      principal: loan?.principal ?? undefined,
      loanTermFrequency: loan?.termFrequency ?? undefined,
      loanTermFrequencyType: loan?.termPeriodFrequencyType?.id ?? 0,
      numberOfRepayments: loan?.numberOfRepayments ?? undefined,
      repaymentEvery: loan?.repaymentEvery ?? undefined,
      repaymentFrequencyType: loan?.repaymentFrequencyType?.id ?? 0,
      interestRatePerPeriod: loan?.interestRatePerPeriod ?? undefined,
      interestRateFrequencyType: loan?.interestRateFrequencyType?.id ?? undefined,
      interestType: loan?.interestType?.id ?? undefined,
      amortizationType: loan?.amortizationType?.id ?? undefined,
      interestCalculationPeriodType: loan?.interestCalculationPeriodType?.id ?? undefined,
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

  const { t } = useTranslation();
  const productIdVal = watch("productId");
  const clientIdVal = watch("clientId");
  const [selectedOriginators, setSelectedOriginators] = useState<LoanOriginator[]>([]);

  // Per-field read-only matrix (doc §22 / §16.1):
  //   clientId & loanProductId  → locked after submission
  //   principal, numberOfRepayments, interestRatePerPeriod → locked after approval
  //   approvedPrincipal        → locked after disbursement
  const statusId = loan?.status?.id;
  const afterApproval = statusId != null && statusId >= 200;

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
    <form onSubmit={handleSubmit((values) => onSubmit(values as FormFields))} className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Row 1 (full width) — Client Search */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("Client & Product")}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-2">
          <div className="col-span-1">
            <ClientSearch
              value={clientIdVal}
              onChange={handleClientChange}
              disabled={isSubmitting || mode === "edit"}
              error={t(errors.clientId?.message ?? "")}
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
              error={t(errors.productId?.message ?? "")}
            />
          </div>
        </CardContent>
      </Card>

      {/* ── Loan Terms ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("Loan Terms")}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-x-6 gap-y-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium">{t("Principal")} *</label>
            <Input
              type="number"
              step="0.01"
              {...register("principal")}
              disabled={isSubmitting || afterApproval}
              error={t(errors.principal?.message ?? "")}
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium">{t("Loan Term Frequency")}</label>
            <Input
              type="number"
              {...register("loanTermFrequency")}
              disabled={isSubmitting}
              error={t(errors.loanTermFrequency?.message ?? "")}
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium">{t("Loan Term Frequency Type")} *</label>
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
              <p className="text-xs text-red-500">{t(errors.loanTermFrequencyType.message ?? "")}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium">{t("Number of Repayments")} *</label>
            <Input
              type="number"
              {...register("numberOfRepayments")}
              disabled={isSubmitting || afterApproval}
              error={t(errors.numberOfRepayments?.message ?? "")}
            />
          </div>
        </CardContent>
      </Card>

      {/* ── Repayment Schedule ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("Repayment Schedule")}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-x-6 gap-y-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium">{t("Repayment Every")} *</label>
            <Input
              type="number"
              {...register("repaymentEvery")}
              disabled={isSubmitting}
              error={t(errors.repaymentEvery?.message ?? "")}
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium">{t("Repayment Frequency Type")} *</label>
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
              <p className="text-xs text-red-500">{t(errors.repaymentFrequencyType.message ?? "")}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Interest ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("Interest")}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-x-6 gap-y-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium">{t("Interest Type")} *</label>
            <Select
              value={String(watch("interestType") ?? 0)}
              onValueChange={(v) => setValue("interestType", Number(v))}
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">{t("Declining Balance")}</SelectItem>
                <SelectItem value="1">{t("Flat")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium">{t("Interest Rate Frequency")}</label>
            <Select
              value={String(watch("interestRateFrequencyType") ?? 3)}
              onValueChange={(v) => setValue("interestRateFrequencyType", Number(v))}
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2">{t("Per Month")}</SelectItem>
                <SelectItem value="3">{t("Per Year")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium">{t("Interest Calculation Period Type")} *</label>
            <Select
              value={String(watch("interestCalculationPeriodType") ?? 0)}
              onValueChange={(v) => setValue("interestCalculationPeriodType", Number(v))}
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">{t("Daily")}</SelectItem>
                <SelectItem value="1">{t("Same as Repayment")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium">{t("Amortization Type")}</label>
            <Select
              value={String(watch("amortizationType") ?? 1)}
              onValueChange={(v) => setValue("amortizationType", Number(v))}
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">{t("Equal Principal")}</SelectItem>
                <SelectItem value="1">{t("Equal Installments")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* ── Grace Periods ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("Grace Periods")}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-x-6 gap-y-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium">{t("Grace on Principal Payment")}</label>
            <Input
              type="number"
              {...register("graceOnPrincipalPayment")}
              disabled={isSubmitting}
              error={t(errors.graceOnPrincipalPayment?.message ?? "")}
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium">{t("Grace on Interest Payment")}</label>
            <Input
              type="number"
              {...register("graceOnInterestPayment")}
              disabled={isSubmitting}
              error={t(errors.graceOnInterestPayment?.message ?? "")}
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium">{t("Grace on Interest Charged")}</label>
            <Input
              type="number"
              {...register("graceOnInterestCharged")}
              disabled={isSubmitting}
              error={t(errors.graceOnInterestCharged?.message ?? "")}
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium">{t("Grace on Arrears Ageing")}</label>
            <Input
              type="number"
              {...register("graceOnArrearsAgeing")}
              disabled={isSubmitting}
              error={t(errors.graceOnArrearsAgeing?.message ?? "")}
            />
          </div>
        </CardContent>
      </Card>

      {/* ── Limits & Tolerance ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("Limits & Tolerance")}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-x-6 gap-y-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium">{t("In Arrears Tolerance")}</label>
            <Input
              type="number"
              step="0.01"
              {...register("inArrearsTolerance")}
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium">{t("Max Outstanding Loan Balance")}</label>
            <Input
              type="number"
              step="0.01"
              {...register("maxOutstandingLoanBalance")}
              disabled={isSubmitting}
            />
          </div>
        </CardContent>
      </Card>

      {/* ── Dates ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("Dates")}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-x-6 gap-y-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium">{t("Submitted On Date")} *</label>
            <Input
              type="date"
              {...register("submittedOnDate")}
              disabled={isSubmitting}
              error={t(errors.submittedOnDate?.message ?? "")}
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium">{t("Expected Disbursement Date")} *</label>
            <Input
              type="date"
              {...register("expectedDisbursementDate")}
              disabled={isSubmitting}
              error={t(errors.expectedDisbursementDate?.message ?? "")}
            />
          </div>
          <div className="space-y-1.5 col-span-2">
            <label className="block text-sm font-medium">{t("Repayments Starting From Date")}</label>
            <Input type="date" {...register("repaymentsStartingFromDate")} disabled={isSubmitting} />
          </div>
        </CardContent>
      </Card>

      {/* ── Processing ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("Processing")}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-x-6 gap-y-4">
          <div className="space-y-1.5 col-span-2">
            <label className="block text-sm font-medium">{t("Transaction Processing Strategy")}</label>
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
                    <SelectItem value="mifos-standard-strategy">{t("Mifos Standard Strategy")}</SelectItem>
                    <SelectItem value="heavensfamily-strategy">{t("Heavensfamily Strategy")}</SelectItem>
                    <SelectItem value="early-repayment-strategy">{t("Early Repayment Strategy")}</SelectItem>
                    <SelectItem value="advance-payment-allocation-strategy">
                      {t("Advance Payment Allocation Strategy")}
                    </SelectItem>
                    <SelectItem value="principal-interest-penalty-fees-order-strategy">
                      {t("P-I-Penalty-Fees Order")}
                    </SelectItem>
                    <SelectItem value="interest-principal-penalty-fees-order-strategy">
                      {t("I-P-Penalty-Fees Order")}
                    </SelectItem>
                    <SelectItem value="penalties-fees-interest-principal-order-strategy">
                      {t("Penalties-Fees-I-P Order")}
                    </SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>
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
            <label htmlFor="allowPartialPeriodInterestCalculation" className="block text-sm font-medium cursor-pointer">
              {t("Allow Partial Period Interest Calculation")}
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Additional Options Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("Additional Options")}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium">{t("Fund")}</label>
            <Select
              value={watch("fundId") ? String(watch("fundId")) : "0"}
              onValueChange={(v) => setValue("fundId", v === "0" ? undefined : Number(v))}
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("Select fund")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">{t("None")}</SelectItem>
                {(fundOptions ?? []).map((o) => (
                  <SelectItem key={o.id} value={String(o.id)}>
                    {o.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium">{t("Loan Officer")}</label>
            <Select
              value={watch("loanOfficerId") ? String(watch("loanOfficerId")) : "0"}
              onValueChange={(v) => setValue("loanOfficerId", v === "0" ? undefined : Number(v))}
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("Select loan officer")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">{t("None")}</SelectItem>
                {(loanOfficerOptions ?? []).map((o) => (
                  <SelectItem key={o.id} value={String(o.id)}>
                    {o.displayName ?? o.name ?? `Officer #${o.id}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium">{t("Loan Purpose")}</label>
            <Select
              value={watch("loanPurposeId") ? String(watch("loanPurposeId")) : "0"}
              onValueChange={(v) => setValue("loanPurposeId", v === "0" ? undefined : Number(v))}
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("Select loan purpose")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">{t("None")}</SelectItem>
                {(loanPurposeOptions ?? []).map((o) => (
                  <SelectItem key={o.id} value={String(o.id)}>
                    {o.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium">{t("Link Account")}</label>
            <Select
              value={watch("linkAccountId") ? String(watch("linkAccountId")) : "0"}
              onValueChange={(v) => setValue("linkAccountId", v === "0" ? undefined : Number(v))}
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("Select linked savings account")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">{t("None")}</SelectItem>
                {(accountLinkingOptions ?? []).map((o) => (
                  <SelectItem key={o.id} value={String(o.id)}>
                    {o.accountNo ?? o.productName ?? `Account #${o.id}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2 space-y-1.5">
            <label className="block text-sm font-medium">{t("External ID")}</label>
            <Input
              {...register("externalId")}
              disabled={isSubmitting}
              placeholder={t("External reference")}
              className="max-w-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Originators (create only) — attached at application time */}
      {mode === "create" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("Originators")}</CardTitle>
          </CardHeader>
          <CardContent>
            <LoanOriginatorPicker
              value={selectedOriginators}
              onChange={setSelectedOriginators}
              disabled={isSubmitting}
            />
              <p className="mt-2 text-xs text-gray-500">
                {t("Link the external party (merchant, broker, affiliate, platform) that sourced this application.")}
              </p>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        <Button type="submit" disabled={isSubmitting} className="bg-[#D32F2F] hover:bg-red-700">
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                {mode === "create" ? t("Creating...") : t("Saving...")}
              </span>
            ) : mode === "create" ? (
              t("Create Loan")
            ) : (
              t("Save Changes")
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
                  {t("Calculating...")}
                </span>
              ) : (
                t("Preview Schedule")
              )}
          </Button>
        )}
        <Button type="button" variant="outline" disabled={isSubmitting} onClick={() => window.history.back()}>
          {t("Cancel")}
        </Button>
      </div>
    </form>
  );
};

export default LoanForm;
export type { LoanFormProps };
