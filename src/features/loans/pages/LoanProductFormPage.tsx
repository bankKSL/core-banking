import React, { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
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
import type { LoanProductCreateRequest } from "@/features/loans";
import { CurrencySelect } from "@/components/shared/CurrencySelect";

/** Extract string value from service enum objects {id,code,value} or primitive */
function enumVal(v: any, fallback = ""): string {
  if (v == null) return fallback;
  if (typeof v === "object") return v.code ?? v.value ?? String(v.id) ?? fallback;
  return String(v);
}

/** Transaction processing strategy required for Buy Down Fee support */
export const ADVANCED_PAYMENT_ALLOCATION_STRATEGY = "advance-payment-allocation-strategy";

/** Buy Down Fee only supports a single calculation mode, amortization strategy and income types (doc §BuyDownFee) */
export const BUYDOWN_CALCULATION_TYPE_FLAT = "FLAT";
export const BUYDOWN_STRATEGY_EQUAL_AMORTIZATION = "EQUAL_AMORTIZATION";
export const BUYDOWN_INCOME_TYPE_FEE = "FEE";
export const BUYDOWN_INCOME_TYPE_INTEREST = "INTEREST";

/** Canonical option lists (only these values are currently supported) */
const BUYDOWN_CALCULATION_TYPE_OPTIONS = [
  { id: BUYDOWN_CALCULATION_TYPE_FLAT, code: BUYDOWN_CALCULATION_TYPE_FLAT, value: "Flat" },
];
const BUYDOWN_STRATEGY_OPTIONS = [
  { id: BUYDOWN_STRATEGY_EQUAL_AMORTIZATION, code: BUYDOWN_STRATEGY_EQUAL_AMORTIZATION, value: "Equal Amortization" },
];
const BUYDOWN_INCOME_TYPE_OPTIONS = [
  { id: BUYDOWN_INCOME_TYPE_FEE, code: BUYDOWN_INCOME_TYPE_FEE, value: "Fee" },
  { id: BUYDOWN_INCOME_TYPE_INTEREST, code: BUYDOWN_INCOME_TYPE_INTEREST, value: "Interest" },
];

/** Resolve template options for a Buy Down Fee enum, restricted to the allowed codes, with a canonical fallback */
function buyDownOptions(
  templateOptions: Array<{ id: string; code: string; value: string }> | undefined,
  allowedCodes: string[],
  fallback: Array<{ id: string; code: string; value: string }>,
): Array<{ id: string; code: string; value: string }> {
  const matched = (templateOptions ?? []).filter((o) => allowedCodes.includes(o.code));
  return matched.length ? matched : fallback;
}

const loanProductSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    shortName: z.string().min(1, "Short name is required").max(4, "Max 4 chars"),
    description: z.string().optional(),
    externalId: z.string().optional(),
    currencyCode: z.string().min(1, "Currency is required"),
    digitsAfterDecimal: z.coerce.number().int().min(0).max(6),
    principal: z.coerce.number().positive("Principal must be > 0"),
    minPrincipal: z.preprocess((v) => (v === "" || v === null ? undefined : v), z.coerce.number().optional()),
    maxPrincipal: z.preprocess((v) => (v === "" || v === null ? undefined : v), z.coerce.number().optional()),
    numberOfRepayments: z.coerce.number().int().positive("Number of repayments is required"),
    minNumberOfRepayments: z.preprocess(
      (v) => (v === "" || v === null ? undefined : v),
      z.coerce.number().int().positive().optional(),
    ),
    maxNumberOfRepayments: z.preprocess(
      (v) => (v === "" || v === null ? undefined : v),
      z.coerce.number().int().positive().optional(),
    ),
    repaymentEvery: z.coerce.number().int().positive("Repayment every is required"),
    repaymentFrequencyType: z.coerce.number(),
    amortizationType: z.coerce.number(),
    interestCalculationPeriodType: z.coerce.number(),
    allowPartialPeriodInterestCalculation: z.boolean().optional(),
    transactionProcessingStrategyCode: z.string().min(1, "Transaction processing strategy is required"),
    loanScheduleType: z.string().optional(),
    daysInYearType: z.coerce.number(),
    daysInMonthType: z.coerce.number(),
    isInterestRecalculationEnabled: z.boolean(),
    interestRatePerPeriod: z.preprocess(
      (v) => (v === "" || v === null ? undefined : v),
      z.coerce.number("Interest rate per period is required").int().positive(),
    ),
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
    disbursedAmountPercentageForDownPayment: z.coerce.number().min(1).max(100).optional(),
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
    allowVariableInstallments: z.boolean().optional(),
    delinquencyBucketId: z.coerce.number().optional(),
    compoundingFrequencyType: z.coerce.number().optional(),
    isArrearsBasedOnOriginalSchedule: z.boolean().optional(),
    inArrearsTolerance: z.coerce.number().optional(),
    fundId: z.coerce.number().optional(),
    inMultiplesOf: z.coerce.number().optional(),
    accountingRule: z.coerce.number(),
    fundSourceAccountId: z.coerce.number().optional(),
    loanPortfolioAccountId: z.coerce.number().optional(),
    receivableInterestAccountId: z.coerce.number().optional(),
    receivableFeeAccountId: z.coerce.number().optional(),
    receivablePenaltyAccountId: z.coerce.number().optional(),
    interestOnLoanAccountId: z.coerce.number().optional(),
    incomeFromFeeAccountId: z.coerce.number().optional(),
    incomeFromPenaltyAccountId: z.coerce.number().optional(),
    overpaymentLiabilityAccountId: z.coerce.number().optional(),
    writeOffAccountId: z.coerce.number().optional(),
    transfersInSuspenseAccountId: z.coerce.number().optional(),
    incomeFromRecoveryAccountId: z.coerce.number().optional(),
    goodwillCreditAccountId: z.coerce.number().optional(),
    incomeFromChargeOffInterestAccountId: z.coerce.number().optional(),
    incomeFromChargeOffFeesAccountId: z.coerce.number().optional(),
    incomeFromChargeOffPenaltyAccountId: z.coerce.number().optional(),
    chargeOffExpenseAccountId: z.coerce.number().optional(),
    chargeOffFraudExpenseAccountId: z.coerce.number().optional(),
    incomeFromGoodwillCreditInterestAccountId: z.coerce.number().optional(),
    incomeFromGoodwillCreditFeesAccountId: z.coerce.number().optional(),
    incomeFromGoodwillCreditPenaltyAccountId: z.coerce.number().optional(),
    deferredIncomeLiabilityAccountId: z.coerce.number().optional(),
    incomeFromCapitalizationAccountId: z.coerce.number().optional(),
    buyDownExpenseAccountId: z.coerce.number().optional(),
    incomeFromBuyDownAccountId: z.coerce.number().optional(),
    locale: z.string(),
    dateFormat: z.string(),
  })
  .superRefine((data, ctx) => {
    const { principal, minPrincipal, maxPrincipal } = data;
    const hasMin = minPrincipal != null && !Number.isNaN(minPrincipal);
    const hasMax = maxPrincipal != null && !Number.isNaN(maxPrincipal);
    const hasPrincipal = principal != null && !Number.isNaN(principal);

    if (hasMin && hasMax && minPrincipal > maxPrincipal) {
      ctx.addIssue({
        code: "custom",
        path: ["maxPrincipal"],
        message: "Max Principal must be greater than or equal to Min Principal",
      });
    }
    if (hasPrincipal && hasMin && principal < minPrincipal) {
      ctx.addIssue({
        code: "custom",
        path: ["principal"],
        message: "Principal must not be less than Min Principal",
      });
    }
    if (hasPrincipal && hasMax && principal > maxPrincipal) {
      ctx.addIssue({
        code: "custom",
        path: ["principal"],
        message: "Principal must not be greater than Max Principal",
      });
    }

    const { numberOfRepayments, minNumberOfRepayments, maxNumberOfRepayments } = data;
    const hasMinRep = minNumberOfRepayments != null && !Number.isNaN(minNumberOfRepayments);
    const hasMaxRep = maxNumberOfRepayments != null && !Number.isNaN(maxNumberOfRepayments);
    const hasRepayments = numberOfRepayments != null && !Number.isNaN(numberOfRepayments);

    if (hasMinRep && hasMaxRep && minNumberOfRepayments > maxNumberOfRepayments) {
      ctx.addIssue({
        code: "custom",
        path: ["maxNumberOfRepayments"],
        message: "Max Number of Repayments must be greater than or equal to Min Number of Repayments",
      });
    }
    if (hasRepayments && hasMinRep && numberOfRepayments < minNumberOfRepayments) {
      ctx.addIssue({
        code: "custom",
        path: ["numberOfRepayments"],
        message: "Number of Repayments must not be less than Min Number of Repayments",
      });
    }
    if (hasRepayments && hasMaxRep && numberOfRepayments > maxNumberOfRepayments) {
      ctx.addIssue({
        code: "custom",
        path: ["numberOfRepayments"],
        message: "Number of Repayments must not be greater than Max Number of Repayments",
      });
    }

    // Validation rule 3: multiDisburseLoan=true requires maxTrancheCount
    if (data.multiDisburseLoan && (data.maxTrancheCount == null || data.maxTrancheCount <= 0)) {
      ctx.addIssue({
        code: "custom",
        path: ["maxTrancheCount"],
        message: "Max Tranche Count is required when Multi-Disburse Loan is enabled",
      });
    }

    // Validation rule 4: enableDownPayment=true requires disbursedAmountPercentageForDownPayment (1-100)
    if (data.enableDownPayment) {
      if (data.disbursedAmountPercentageForDownPayment == null) {
        ctx.addIssue({
          code: "custom",
          path: ["disbursedAmountPercentageForDownPayment"],
          message: "Disbursed Amount Percentage is required when Down Payment is enabled",
        });
      } else if (
        data.disbursedAmountPercentageForDownPayment < 1 ||
        data.disbursedAmountPercentageForDownPayment > 100
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["disbursedAmountPercentageForDownPayment"],
          message: "Disbursed Amount Percentage must be between 1 and 100",
        });
      }
    }

    // Validation rule 1: isEqualAmortization=true is incompatible with several features
    if (data.isEqualAmortization) {
      if (data.isInterestRecalculationEnabled) {
        ctx.addIssue({
          code: "custom",
          path: ["isEqualAmortization"],
          message: "Equal Amortization is incompatible with Interest Recalculation",
        });
      }
      if (data.allowVariableInstallments) {
        ctx.addIssue({
          code: "custom",
          path: ["isEqualAmortization"],
          message: "Equal Amortization is incompatible with Variable Installments",
        });
      }
      if (data.multiDisburseLoan) {
        ctx.addIssue({
          code: "custom",
          path: ["isEqualAmortization"],
          message: "Equal Amortization is incompatible with Multi-Disburse Loan",
        });
      }
    }

    // Validation rules 5 & 6: loanScheduleType and transactionProcessingStrategyCode
    if (
      data.loanScheduleType === "PROGRESSIVE" &&
      data.transactionProcessingStrategyCode !== ADVANCED_PAYMENT_ALLOCATION_STRATEGY
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["transactionProcessingStrategyCode"],
        message: "Progressive schedule type requires advance-payment-allocation-strategy",
      });
    }
    if (
      data.loanScheduleType === "CUMULATIVE" &&
      data.transactionProcessingStrategyCode === ADVANCED_PAYMENT_ALLOCATION_STRATEGY
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["transactionProcessingStrategyCode"],
        message: "Cumulative schedule type cannot use advance-payment-allocation-strategy",
      });
    }

    // Buy Down Fee: only supported for Advanced Payment Allocation Strategy + Progressive schedule.
    // When enabled, only Flat calculation, Equal Amortization strategy and Fee/Interest income type are allowed.
    if (data.enableBuyDownFee) {
      if (enumVal(data.loanScheduleType) !== "PROGRESSIVE") {
        ctx.addIssue({
          code: "custom",
          path: ["enableBuyDownFee"],
          message: "Buy Down Fee is only supported for Progressive Loan Schedule",
        });
      }
      if (data.transactionProcessingStrategyCode !== ADVANCED_PAYMENT_ALLOCATION_STRATEGY) {
        ctx.addIssue({
          code: "custom",
          path: ["enableBuyDownFee"],
          message: "Buy Down Fee is only supported for Advanced Payment Allocation Strategy",
        });
      }
      if (data.buyDownFeeCalculationType !== BUYDOWN_CALCULATION_TYPE_FLAT) {
        ctx.addIssue({
          code: "custom",
          path: ["buyDownFeeCalculationType"],
          message: "Only Flat calculation mode is supported",
        });
      }
      if (data.buyDownFeeStrategy !== BUYDOWN_STRATEGY_EQUAL_AMORTIZATION) {
        ctx.addIssue({
          code: "custom",
          path: ["buyDownFeeStrategy"],
          message: "Only Equal Amortization strategy is supported",
        });
      }
      if (
        data.buyDownFeeIncomeType !== BUYDOWN_INCOME_TYPE_FEE &&
        data.buyDownFeeIncomeType !== BUYDOWN_INCOME_TYPE_INTEREST
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["buyDownFeeIncomeType"],
          message: "Income Type must be Fee or Interest",
        });
      }
    }

    // Validation rule 7: Grace periods must be less than numberOfRepayments
    if (data.graceOnPrincipalPayment != null && data.graceOnPrincipalPayment >= data.numberOfRepayments) {
      ctx.addIssue({
        code: "custom",
        path: ["graceOnPrincipalPayment"],
        message: "Grace on Principal Payment must be less than Number of Repayments",
      });
    }
    if (data.graceOnInterestPayment != null && data.graceOnInterestPayment >= data.numberOfRepayments) {
      ctx.addIssue({
        code: "custom",
        path: ["graceOnInterestPayment"],
        message: "Grace on Interest Payment must be less than Number of Repayments",
      });
    }
    if (data.graceOnInterestCharged != null && data.graceOnInterestCharged >= data.numberOfRepayments) {
      ctx.addIssue({
        code: "custom",
        path: ["graceOnInterestCharged"],
        message: "Grace on Interest Charged must be less than Number of Repayments",
      });
    }

    // Accounting validation: CASH/ACCRUAL rules require certain accounts
    if (data.accountingRule !== 1) {
      if (!data.fundSourceAccountId) {
        ctx.addIssue({
          code: "custom",
          path: ["fundSourceAccountId"],
          message: "Fund Source Account is required for Cash/Accrual accounting",
        });
      }
      if (!data.loanPortfolioAccountId) {
        ctx.addIssue({
          code: "custom",
          path: ["loanPortfolioAccountId"],
          message: "Loan Portfolio Account is required for Cash/Accrual accounting",
        });
      }
      if (!data.interestOnLoanAccountId) {
        ctx.addIssue({
          code: "custom",
          path: ["interestOnLoanAccountId"],
          message: "Interest on Loan Account is required for Cash/Accrual accounting",
        });
      }
      if (!data.incomeFromFeeAccountId) {
        ctx.addIssue({
          code: "custom",
          path: ["incomeFromFeeAccountId"],
          message: "Income from Fee Account is required for Cash/Accrual accounting",
        });
      }
      if (!data.incomeFromPenaltyAccountId) {
        ctx.addIssue({
          code: "custom",
          path: ["incomeFromPenaltyAccountId"],
          message: "Income from Penalty Account is required for Cash/Accrual accounting",
        });
      }
      if (!data.writeOffAccountId) {
        ctx.addIssue({
          code: "custom",
          path: ["writeOffAccountId"],
          message: "Write-off Account is required for Cash/Accrual accounting",
        });
      }
      if (!data.overpaymentLiabilityAccountId) {
        ctx.addIssue({
          code: "custom",
          path: ["overpaymentLiabilityAccountId"],
          message: "Overpayment Liability Account is required for Cash/Accrual accounting",
        });
      }
      if (!data.transfersInSuspenseAccountId) {
        ctx.addIssue({
          code: "custom",
          path: ["transfersInSuspenseAccountId"],
          message: "Transfers in Suspense Account is required for Cash/Accrual accounting",
        });
      }

      // Accrual-specific accounts
      if (data.accountingRule === 3 || data.accountingRule === 4) {
        if (!data.receivableInterestAccountId) {
          ctx.addIssue({
            code: "custom",
            path: ["receivableInterestAccountId"],
            message: "Receivable Interest Account is required for Accrual accounting",
          });
        }
        if (!data.receivableFeeAccountId) {
          ctx.addIssue({
            code: "custom",
            path: ["receivableFeeAccountId"],
            message: "Receivable Fee Account is required for Accrual accounting",
          });
        }
        if (!data.receivablePenaltyAccountId) {
          ctx.addIssue({
            code: "custom",
            path: ["receivablePenaltyAccountId"],
            message: "Receivable Penalty Account is required for Accrual accounting",
          });
        }
      }
    }

    // Income Capitalization: enabling it requires the capitalization config and accounts
    if (data.enableIncomeCapitalization) {
      if (!data.capitalizedIncomeCalculationType) {
        ctx.addIssue({
          code: "custom",
          path: ["capitalizedIncomeCalculationType"],
          message: "Capitalized Income Calculation Type is required when Income Capitalization is enabled",
        });
      }
      if (!data.capitalizedIncomeStrategy) {
        ctx.addIssue({
          code: "custom",
          path: ["capitalizedIncomeStrategy"],
          message: "Capitalized Income Strategy is required when Income Capitalization is enabled",
        });
      }
      if (!data.capitalizedIncomeType) {
        ctx.addIssue({
          code: "custom",
          path: ["capitalizedIncomeType"],
          message: "Capitalized Income Type is required when Income Capitalization is enabled",
        });
      }
      if (!data.deferredIncomeLiabilityAccountId) {
        ctx.addIssue({
          code: "custom",
          path: ["deferredIncomeLiabilityAccountId"],
          message: "Deferred Income Liability Account is required when Income Capitalization is enabled",
        });
      }
      if (!data.incomeFromCapitalizationAccountId) {
        ctx.addIssue({
          code: "custom",
          path: ["incomeFromCapitalizationAccountId"],
          message: "Income from Capitalization Account is required when Income Capitalization is enabled",
        });
      }
    }
  });

type LoanProductFormValues = z.infer<typeof loanProductSchema>;

const LoanProductFormPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const queryClient = useQueryClient();
  const { data: existingProduct, isLoading: productLoading } = useLoanProduct(id ? Number(id) : undefined);
  const { data: template, isLoading: templateLoading } = useLoanProductTemplate();
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
    trigger,
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
      numberOfRepayments: undefined,
      repaymentEvery: 1,
      repaymentFrequencyType: 2,
      amortizationType: 1,
      interestType: 0,
      interestCalculationPeriodType: 1,
      transactionProcessingStrategyCode: "mifos-standard-strategy",
      interestRatePerPeriod: undefined,
      interestRateFrequencyType: 2,
      daysInYearType: 0,
      daysInMonthType: 0,
      isInterestRecalculationEnabled: false,
      accountingRule: 1,
      fundSourceAccountId: undefined,
      loanPortfolioAccountId: undefined,
      receivableInterestAccountId: undefined,
      receivableFeeAccountId: undefined,
      receivablePenaltyAccountId: undefined,
      interestOnLoanAccountId: undefined,
      incomeFromFeeAccountId: undefined,
      incomeFromPenaltyAccountId: undefined,
      overpaymentLiabilityAccountId: undefined,
      writeOffAccountId: undefined,
      transfersInSuspenseAccountId: undefined,
      incomeFromRecoveryAccountId: undefined,
      goodwillCreditAccountId: undefined,
      incomeFromChargeOffInterestAccountId: undefined,
      incomeFromChargeOffFeesAccountId: undefined,
      incomeFromChargeOffPenaltyAccountId: undefined,
      chargeOffExpenseAccountId: undefined,
      chargeOffFraudExpenseAccountId: undefined,
      incomeFromGoodwillCreditInterestAccountId: undefined,
      incomeFromGoodwillCreditFeesAccountId: undefined,
      incomeFromGoodwillCreditPenaltyAccountId: undefined,
      deferredIncomeLiabilityAccountId: undefined,
      incomeFromCapitalizationAccountId: undefined,
      buyDownExpenseAccountId: undefined,
      incomeFromBuyDownAccountId: undefined,
      locale: "en",
      dateFormat: "yyyy-MM-dd",
      minInterestRatePerPeriod: undefined,
      maxInterestRatePerPeriod: undefined,
    },
  });

  const loanScheduleType = watch("loanScheduleType");
  const isProgressive = enumVal(loanScheduleType) === "PROGRESSIVE";
  const isAdvancedStrategy = watch("transactionProcessingStrategyCode") === ADVANCED_PAYMENT_ALLOCATION_STRATEGY;
  const buyDownFeeSupported = isProgressive && isAdvancedStrategy;

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
      disbursedAmountPercentageForDownPayment: p.disbursedAmountPercentageForDownPayment ?? undefined,
      enableAutoRepaymentForDownPayment: p.enableDownPayment ? p.enableAutoRepaymentForDownPayment : undefined,
      repaymentStartDateType: p.repaymentStartDateType?.id ?? undefined,
      enableBuyDownFee: !!p.enableBuyDownFee,
      merchantBuyDownFee: !!p.merchantBuyDownFee,
      buyDownFeeCalculationType: p.buyDownFeeCalculationType?.code ?? undefined,
      buyDownFeeStrategy: p.buyDownFeeStrategy?.code ?? undefined,
      buyDownFeeIncomeType: p.buyDownFeeIncomeType?.code ?? undefined,
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
      allowVariableInstallments: !!p.allowVariableInstallments,
      delinquencyBucketId: p.delinquencyBucketId ?? undefined,
      compoundingFrequencyType: p.interestRecalculationData?.compoundingFrequencyType?.id ?? undefined,
      isArrearsBasedOnOriginalSchedule: !!p.interestRecalculationData?.isArrearsBasedOnOriginalSchedule,
      inArrearsTolerance: p.inArrearsTolerance ?? undefined,
      fundId: p.fund?.id ?? p.fundId ?? undefined,
      digitsAfterDecimal: p.currency?.decimalPlaces ?? 2,
      inMultiplesOf: p.currency?.inMultiplesOf ?? 0,
      accountingRule: p.accountingRule?.id ?? 1,
      fundSourceAccountId: p.accountingMappings?.fundSourceAccount?.id ?? undefined,
      loanPortfolioAccountId: p.accountingMappings?.loanPortfolioAccount?.id ?? undefined,
      receivableInterestAccountId: p.accountingMappings?.receivableInterestAccount?.id ?? undefined,
      receivableFeeAccountId: p.accountingMappings?.receivableFeeAccount?.id ?? undefined,
      receivablePenaltyAccountId: p.accountingMappings?.receivablePenaltyAccount?.id ?? undefined,
      interestOnLoanAccountId: p.accountingMappings?.interestOnLoanAccount?.id ?? undefined,
      incomeFromFeeAccountId: p.accountingMappings?.incomeFromFeeAccount?.id ?? undefined,
      incomeFromPenaltyAccountId: p.accountingMappings?.incomeFromPenaltyAccount?.id ?? undefined,
      overpaymentLiabilityAccountId: p.accountingMappings?.overpaymentLiabilityAccount?.id ?? undefined,
      writeOffAccountId: p.accountingMappings?.writeOffAccount?.id ?? undefined,
      transfersInSuspenseAccountId: p.accountingMappings?.transfersInSuspenseAccount?.id ?? undefined,
      incomeFromRecoveryAccountId: p.accountingMappings?.incomeFromRecoveryAccount?.id ?? undefined,
      goodwillCreditAccountId: p.accountingMappings?.goodwillCreditAccount?.id ?? undefined,
      incomeFromChargeOffInterestAccountId: p.accountingMappings?.incomeFromChargeOffInterestAccount?.id ?? undefined,
      incomeFromChargeOffFeesAccountId: p.accountingMappings?.incomeFromChargeOffFeesAccount?.id ?? undefined,
      incomeFromChargeOffPenaltyAccountId: p.accountingMappings?.incomeFromChargeOffPenaltyAccount?.id ?? undefined,
      chargeOffExpenseAccountId: p.accountingMappings?.chargeOffExpenseAccount?.id ?? undefined,
      chargeOffFraudExpenseAccountId: p.accountingMappings?.chargeOffFraudExpenseAccount?.id ?? undefined,
      incomeFromGoodwillCreditInterestAccountId:
        p.accountingMappings?.incomeFromGoodwillCreditInterestAccount?.id ?? undefined,
      incomeFromGoodwillCreditFeesAccountId: p.accountingMappings?.incomeFromGoodwillCreditFeesAccount?.id ?? undefined,
      incomeFromGoodwillCreditPenaltyAccountId:
        p.accountingMappings?.incomeFromGoodwillCreditPenaltyAccount?.id ?? undefined,
      deferredIncomeLiabilityAccountId: p.accountingMappings?.deferredIncomeLiabilityAccount?.id ?? undefined,
      incomeFromCapitalizationAccountId: p.accountingMappings?.incomeFromCapitalizationAccount?.id ?? undefined,
      buyDownExpenseAccountId: p.accountingMappings?.buyDownExpenseAccount?.id ?? undefined,
      incomeFromBuyDownAccountId: p.accountingMappings?.incomeFromBuyDownAccount?.id ?? undefined,
      locale: "en",
      dateFormat: "yyyy-MM-dd",
    });
  }, [existingProduct, reset]);

  const onSubmit = async (values: LoanProductFormValues) => {
    const payload: Record<string, any> = { ...values };

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

  if (isEdit && productLoading && templateLoading) {
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
        title={isEdit ? t("Edit Loan Product") : t("Create Loan Product")}
        description={t("Configure the loan product terms and settings.")}
        actions={
          <Button variant="outline" onClick={() => navigate("/lending/products")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> {t("Back")}
          </Button>
        }
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* ── Product Details ── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("Product Details")}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-x-6 gap-y-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Name")} *</label>
              <Input {...register("name")} error={errors.name?.message} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Short Name")}</label>
              <Input {...register("shortName")} error={errors.shortName?.message} />
            </div>
            <div className="space-y-1.5 col-span-2">
              <label className="block text-sm font-medium">{t("Description")}</label>
              <Textarea {...register("description")} rows={3} placeholder={t("Brief product description")} />
            </div>
            <div className="space-y-1.5 col-span-2">
              <label className="block text-sm font-medium">{t("External ID")}</label>
              <Input {...register("externalId")} error={errors.externalId?.message} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Fund")}</label>
              <Select
                value={watch("fundId") ? String(watch("fundId")) : ""}
                onValueChange={(v) => setValue("fundId", Number(v))}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("Select fund")} />
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
          </CardContent>
        </Card>

        {/* ── Loan Terms ── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("Loan Terms")}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-x-6 gap-y-4">
            <div className="space-y-1.5 col-span-2">
              <label className="block text-sm font-medium">{t("Principal")} *</label>
              <Input
                type="number"
                step="0.01"
                {...register("principal", {
                  onChange: () => {
                    trigger("minPrincipal");
                    trigger("maxPrincipal");
                  },
                })}
                error={errors.principal?.message}
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Max Principal")}</label>
              <Input
                type="number"
                step="0.01"
                {...register("maxPrincipal", {
                  onChange: () => {
                    trigger("principal");
                    trigger("minPrincipal");
                  },
                })}
                error={errors.maxPrincipal?.message}
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Min Principal")}</label>
              <Input
                type="number"
                step="0.01"
                {...register("minPrincipal", {
                  onChange: () => {
                    trigger("principal");
                    trigger("maxPrincipal");
                  },
                })}
                error={errors.minPrincipal?.message}
              />
            </div>
            <div className="space-y-1.5 col-span-2">
              <label className="block text-sm font-medium">{t("Number of Repayments")} *</label>
              <Input
                type="number"
                {...register("numberOfRepayments", {
                  onChange: () => {
                    trigger("minNumberOfRepayments");
                    trigger("maxNumberOfRepayments");
                  },
                })}
                error={errors.numberOfRepayments?.message}
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Min Number of Repayments")}</label>
              <Input
                type="number"
                {...register("minNumberOfRepayments", {
                  onChange: () => {
                    trigger("numberOfRepayments");
                    trigger("maxNumberOfRepayments");
                  },
                })}
                error={errors.minNumberOfRepayments?.message}
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Max Number of Repayments")}</label>
              <Input
                type="number"
                {...register("maxNumberOfRepayments", {
                  onChange: () => {
                    trigger("numberOfRepayments");
                    trigger("minNumberOfRepayments");
                  },
                })}
                error={errors.maxNumberOfRepayments?.message}
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Repayment Every")} *</label>
              <Input type="number" {...register("repaymentEvery")} error={errors.repaymentEvery?.message} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Repayment Frequency")} *</label>
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
              <label className="block text-sm font-medium">{t("Interest Rate (%)")} *</label>
              <Input
                type="number"
                step="0.01"
                {...register("interestRatePerPeriod")}
                error={errors.interestRatePerPeriod?.message}
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Interest Rate Frequency")}</label>
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
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Amortization Type")}</label>
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
              <label className="block text-sm font-medium">{t("Interest Type")}</label>
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
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Grace on Principal Payment")}</label>
              <Input type="number" {...register("graceOnPrincipalPayment")} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Grace on Interest Payment")}</label>
              <Input type="number" {...register("graceOnInterestPayment")} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Grace on Interest Charged")}</label>
              <Input type="number" {...register("graceOnInterestCharged")} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Grace on Arrears Ageing")}</label>
              <Input type="number" {...register("graceOnArrearsAgeing")} />
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
              <label htmlFor="allowPartialPeriodInterestCalculation" className="block text-sm font-medium">
                {t("Allow Partial Period Interest Calculation")}
              </label>
            </div>
          </CardContent>
        </Card>

        {/* ── Schedule & Calendar ── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("Schedule & Calendar")}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-x-6 gap-y-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Loan Schedule Type")}</label>
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
              <label className="block text-sm font-medium">{t("Transaction Processing Strategy")}</label>
              <Select
                value={watch("transactionProcessingStrategyCode") ?? ""}
                onValueChange={(v) => setValue("transactionProcessingStrategyCode", v)}
                disabled={isProgressive}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("Select strategy")} />
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
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Days In Month Type")}</label>
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
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Days In Year Type")}</label>
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
          </CardContent>
        </Card>

        {/* ── Accounting ── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("Accounting")}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-x-6 gap-y-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Accounting Rule")} *</label>
              <Select
                value={String(watch("accountingRule") ?? 1)}
                onValueChange={(v) => setValue("accountingRule", Number(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(template?.accountingRuleOptions ?? []).map((o) => (
                    <SelectItem key={o.id} value={String(o.id)}>
                      {o.value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {watch("accountingRule") !== 1 && (
              <>
                <div className="col-span-2 mt-4 mb-2">
                  <h4 className="text-sm font-semibold text-gray-700">{t("Asset Accounts")}</h4>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium">{t("Fund Source")}</label>
                  <Input type="number" {...register("fundSourceAccountId")} placeholder={t("Account ID")} />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium">{t("Loan Portfolio")}</label>
                  <Input type="number" {...register("loanPortfolioAccountId")} placeholder={t("Account ID")} />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium">{t("Transfers in Suspense")}</label>
                  <Input type="number" {...register("transfersInSuspenseAccountId")} placeholder={t("Account ID")} />
                </div>

                <div className="col-span-2 mt-4 mb-2">
                  <h4 className="text-sm font-semibold text-gray-700">{t("Income Accounts")}</h4>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium">{t("Interest on Loans")}</label>
                  <Input type="number" {...register("interestOnLoanAccountId")} placeholder={t("Account ID")} />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium">{t("Income from Fees")}</label>
                  <Input type="number" {...register("incomeFromFeeAccountId")} placeholder={t("Account ID")} />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium">{t("Income from Penalties")}</label>
                  <Input type="number" {...register("incomeFromPenaltyAccountId")} placeholder={t("Account ID")} />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium">{t("Income from Recovery")}</label>
                  <Input type="number" {...register("incomeFromRecoveryAccountId")} placeholder={t("Account ID")} />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium">{t("Income from Charge-off Interest")}</label>
                  <Input
                    type="number"
                    {...register("incomeFromChargeOffInterestAccountId")}
                    placeholder={t("Account ID")}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium">{t("Income from Charge-off Fees")}</label>
                  <Input
                    type="number"
                    {...register("incomeFromChargeOffFeesAccountId")}
                    placeholder={t("Account ID")}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium">{t("Income from Charge-off Penalty")}</label>
                  <Input
                    type="number"
                    {...register("incomeFromChargeOffPenaltyAccountId")}
                    placeholder={t("Account ID")}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium">{t("Income from Goodwill Credit Interest")}</label>
                  <Input
                    type="number"
                    {...register("incomeFromGoodwillCreditInterestAccountId")}
                    placeholder={t("Account ID")}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium">{t("Income from Goodwill Credit Fees")}</label>
                  <Input
                    type="number"
                    {...register("incomeFromGoodwillCreditFeesAccountId")}
                    placeholder={t("Account ID")}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium">{t("Income from Goodwill Credit Penalty")}</label>
                  <Input
                    type="number"
                    {...register("incomeFromGoodwillCreditPenaltyAccountId")}
                    placeholder={t("Account ID")}
                  />
                </div>
                {watch("accountingRule") === 3 || watch("accountingRule") === 4 ? (
                  <>
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium">{t("Deferred Income Liability")}</label>
                      <Input
                        type="number"
                        {...register("deferredIncomeLiabilityAccountId")}
                        placeholder={t("Account ID")}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium">{t("Income from Capitalization")}</label>
                      <Input
                        type="number"
                        {...register("incomeFromCapitalizationAccountId")}
                        placeholder={t("Account ID")}
                      />
                    </div>
                  </>
                ) : null}

                <div className="col-span-2 mt-4 mb-2">
                  <h4 className="text-sm font-semibold text-gray-700">{t("Expense Accounts")}</h4>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium">{t("Write-off")}</label>
                  <Input type="number" {...register("writeOffAccountId")} placeholder={t("Account ID")} />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium">{t("Charge-off Expense")}</label>
                  <Input type="number" {...register("chargeOffExpenseAccountId")} placeholder={t("Account ID")} />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium">{t("Charge-off Fraud Expense")}</label>
                  <Input type="number" {...register("chargeOffFraudExpenseAccountId")} placeholder={t("Account ID")} />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium">{t("Goodwill Credit")}</label>
                  <Input type="number" {...register("goodwillCreditAccountId")} placeholder={t("Account ID")} />
                </div>
                {watch("enableBuyDownFee") && (
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium">{t("Buy Down Expense")}</label>
                    <Input type="number" {...register("buyDownExpenseAccountId")} placeholder={t("Account ID")} />
                  </div>
                )}
                {watch("enableBuyDownFee") && (
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium">{t("Income from Buy Down")}</label>
                    <Input type="number" {...register("incomeFromBuyDownAccountId")} placeholder={t("Account ID")} />
                  </div>
                )}

                <div className="col-span-2 mt-4 mb-2">
                  <h4 className="text-sm font-semibold text-gray-700">{t("Liability Accounts")}</h4>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium">{t("Overpayment Liability")}</label>
                  <Input type="number" {...register("overpaymentLiabilityAccountId")} placeholder={t("Account ID")} />
                </div>

                {(watch("accountingRule") === 3 || watch("accountingRule") === 4) && (
                  <>
                    <div className="col-span-2 mt-4 mb-2">
                      <h4 className="text-sm font-semibold text-gray-700">{t("Receivable Accounts (Accrual)")}</h4>
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium">{t("Receivable Interest")}</label>
                      <Input type="number" {...register("receivableInterestAccountId")} placeholder={t("Account ID")} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium">{t("Receivable Fees")}</label>
                      <Input type="number" {...register("receivableFeeAccountId")} placeholder={t("Account ID")} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium">{t("Receivable Penalties")}</label>
                      <Input type="number" {...register("receivablePenaltyAccountId")} placeholder={t("Account ID")} />
                    </div>
                  </>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* ── Interest Recalculation ── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("Interest Recalculation")}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-x-6 gap-y-4">
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
                {t("Interest Recalculation Enabled")}
              </label>
            </div>
            {watch("isInterestRecalculationEnabled") && (
              <>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium">{t("Compounding Method")}</label>
                  <Select
                    value={
                      watch("interestRecalculationCompoundingMethod")
                        ? String(watch("interestRecalculationCompoundingMethod"))
                        : ""
                    }
                    onValueChange={(v) => setValue("interestRecalculationCompoundingMethod", Number(v))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("Select")} />
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
                  <label className="block text-sm font-medium">{t("Reschedule Strategy Method")}</label>
                  <Select
                    value={watch("rescheduleStrategyMethod") ? String(watch("rescheduleStrategyMethod")) : ""}
                    onValueChange={(v) => setValue("rescheduleStrategyMethod", Number(v))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("Select")} />
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
                  <label className="block text-sm font-medium">{t("Rest Frequency Type")}</label>
                  <Select
                    value={
                      watch("recalculationRestFrequencyType") ? String(watch("recalculationRestFrequencyType")) : ""
                    }
                    onValueChange={(v) => setValue("recalculationRestFrequencyType", Number(v))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("Select")} />
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
                  <label className="block text-sm font-medium">{t("Pre-Closure Interest Calculation")}</label>
                  <Select
                    value={
                      watch("preClosureInterestCalculationStrategy")
                        ? String(watch("preClosureInterestCalculationStrategy"))
                        : ""
                    }
                    onValueChange={(v) => setValue("preClosureInterestCalculationStrategy", Number(v))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("Select")} />
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
          </CardContent>
        </Card>

        {/* ── Multi-Disburse ── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("Multi-Disburse")}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-x-6 gap-y-4">
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
                {t("Multi-Disburse Loan")}
              </label>
            </div>
            {watch("multiDisburseLoan") && (
              <>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium">{t("Max Tranche Count")}</label>
                  <Input type="number" {...register("maxTrancheCount")} />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium">{t("Outstanding Loan Balance")}</label>
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
                    {t("Can Define Installment Amount")}
                  </label>
                </div>
                {watch("canDefineInstallmentAmount") && (
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium">{t("Installment Amount In Multiples Of")}</label>
                    <Input type="number" step="0.01" {...register("installmentAmountInMultiplesOf")} />
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* ── Variable Installments ── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("Variable Installments")}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-x-6 gap-y-4">
            <div
              className="col-span-2 flex items-center gap-2 pt-2 cursor-pointer"
              onClick={() => setValue("allowVariableInstallments", !watch("allowVariableInstallments"))}
            >
              <Checkbox
                id="allowVariableInstallments"
                checked={!!watch("allowVariableInstallments")}
                onCheckedChange={(v) => setValue("allowVariableInstallments", v === true)}
              />
              <label htmlFor="allowVariableInstallments" className="block text-sm font-medium">
                {t("Allow Variable Installments")}
              </label>
            </div>
            {watch("allowVariableInstallments") && (
              <>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium">{t("Minimum Gap Between Installments")}</label>
                  <Input type="number" {...register("minimumGap")} />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium">{t("Maximum Gap Between Installments")}</label>
                  <Input type="number" {...register("maximumGap")} />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* ── Down Payment ── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("Down Payment")}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-x-6 gap-y-4">
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
                {t("Enable Down Payment")}
              </label>
            </div>
            {watch("enableDownPayment") && (
              <>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium">
                    {t("Disbursed Amount Percentage for Down Payment")} *
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    min="1"
                    max="100"
                    {...register("disbursedAmountPercentageForDownPayment")}
                    error={errors.disbursedAmountPercentageForDownPayment?.message}
                  />
                </div>
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
                    {t("Auto Repayment for Down Payment")}
                  </label>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium">{t("Repayment Start Date Type")}</label>
                  <Input type="number" {...register("repaymentStartDateType")} />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* ── Progressive-only sections ── */}
        {isProgressive && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("Progressive Settings")}</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-x-6 gap-y-4">
              {/* Buydown Fee — only supported for Advanced Payment Allocation Strategy + Progressive schedule */}
              {buyDownFeeSupported ? (
                <>
                  <div
                    className="col-span-2 flex items-center gap-2 pt-2 cursor-pointer"
                    onClick={() => {
                      const next = !watch("enableBuyDownFee");
                      setValue("enableBuyDownFee", next, { shouldValidate: true });
                      if (next) {
                        setValue("buyDownFeeCalculationType", BUYDOWN_CALCULATION_TYPE_FLAT);
                        setValue("buyDownFeeStrategy", BUYDOWN_STRATEGY_EQUAL_AMORTIZATION);
                        if (!watch("buyDownFeeIncomeType")) {
                          setValue("buyDownFeeIncomeType", BUYDOWN_INCOME_TYPE_FEE);
                        }
                      } else {
                        setValue("buyDownFeeCalculationType", undefined);
                        setValue("buyDownFeeStrategy", undefined);
                        setValue("buyDownFeeIncomeType", undefined);
                      }
                    }}
                  >
                    <Checkbox
                      id="enableBuyDownFee"
                      checked={!!watch("enableBuyDownFee")}
                      onCheckedChange={(v) => setValue("enableBuyDownFee", v === true, { shouldValidate: true })}
                    />
                    <label htmlFor="enableBuyDownFee" className="block text-sm font-medium">
                      {t("Enable Buy Down Fee")}
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
                          {t("Merchant Buy Down Fee")}
                        </label>
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-sm font-medium">{t("Buy Down Fee Calculation Type")}</label>
                        <Select
                          value={watch("buyDownFeeCalculationType") ?? ""}
                          onValueChange={(v) => setValue("buyDownFeeCalculationType", v, { shouldValidate: true })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={t("Select")} />
                          </SelectTrigger>
                          <SelectContent>
                            {buyDownOptions(
                              template?.buyDownFeeCalculationTypeOptions,
                              [BUYDOWN_CALCULATION_TYPE_FLAT],
                              BUYDOWN_CALCULATION_TYPE_OPTIONS,
                            ).map((o) => (
                              <SelectItem key={o.code} value={o.code}>
                                {o.value}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-sm font-medium">{t("Buy Down Fee Strategy")}</label>
                        <Select
                          value={watch("buyDownFeeStrategy") ?? ""}
                          onValueChange={(v) => setValue("buyDownFeeStrategy", v, { shouldValidate: true })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={t("Select")} />
                          </SelectTrigger>
                          <SelectContent>
                            {buyDownOptions(
                              template?.buyDownFeeStrategyOptions,
                              [BUYDOWN_STRATEGY_EQUAL_AMORTIZATION],
                              BUYDOWN_STRATEGY_OPTIONS,
                            ).map((o) => (
                              <SelectItem key={o.code} value={o.code}>
                                {o.value}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-sm font-medium">{t("Buy Down Fee Income Type")}</label>
                        <Select
                          value={watch("buyDownFeeIncomeType") ?? ""}
                          onValueChange={(v) => setValue("buyDownFeeIncomeType", v, { shouldValidate: true })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={t("Select")} />
                          </SelectTrigger>
                          <SelectContent>
                            {buyDownOptions(
                              template?.buyDownFeeIncomeTypeOptions,
                              [BUYDOWN_INCOME_TYPE_FEE, BUYDOWN_INCOME_TYPE_INTEREST],
                              BUYDOWN_INCOME_TYPE_OPTIONS,
                            ).map((o) => (
                              <SelectItem key={o.code} value={o.code}>
                                {o.value}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="col-span-2 rounded-lg border border-dashed border-gray-300 p-4 text-sm text-gray-400 text-center">
                  {t(
                    "Buy Down Fee is only supported for loans using the Advanced Payment Allocation Strategy and a Progressive Loan Schedule.",
                  )}
                </div>
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
                  {t("Enable Income Capitalization")}
                </label>
              </div>
              {watch("enableIncomeCapitalization") && (
                <>
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium">{t("Capitalized Income Calculation Type")}</label>
                    <Select
                      value={watch("capitalizedIncomeCalculationType") ?? ""}
                      onValueChange={(v) => setValue("capitalizedIncomeCalculationType", v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t("Select")} />
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
                    <label className="block text-sm font-medium">{t("Capitalized Income Strategy")}</label>
                    <Select
                      value={watch("capitalizedIncomeStrategy") ?? ""}
                      onValueChange={(v) => setValue("capitalizedIncomeStrategy", v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t("Select")} />
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
                    <label className="block text-sm font-medium">{t("Capitalized Income Type")}</label>
                    <Select
                      value={watch("capitalizedIncomeType") ?? ""}
                      onValueChange={(v) => setValue("capitalizedIncomeType", v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t("Select")} />
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
                {t("Payment/Credit Allocation Editor — Custom child component (not yet implemented)")}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end gap-3">
          <Button variant="outline" type="button" onClick={() => navigate("/lending/products")}>
            {t("Cancel")}
          </Button>
          <Button
            type="submit"
            disabled={createMutation.isPending || updateMutation.isPending}
            className="bg-[#D32F2F] hover:bg-red-700"
          >
            {createMutation.isPending || updateMutation.isPending ? (
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

export default LoanProductFormPage;
