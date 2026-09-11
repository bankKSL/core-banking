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
    startDate: z.string().optional(),
    closeDate: z.string().optional(),
    currencyCode: z.string().min(1, "Currency is required"),
    digitsAfterDecimal: z.coerce.number().int().min(0).max(6),
    inMultiplesOf: z.coerce.number().min(0).optional(),
    principal: z.coerce.number().positive("Principal must be > 0"),
    minPrincipal: z.preprocess(
      (v) => (v === "" || v === null ? undefined : v),
      z.coerce.number().positive().optional(),
    ),
    maxPrincipal: z.preprocess(
      (v) => (v === "" || v === null ? undefined : v),
      z.coerce.number().positive().optional(),
    ),
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
    interestRatePerPeriod: z.preprocess(
      (v) => (v === "" || v === null ? undefined : v),
      z.coerce.number("Interest rate per period is required").int().positive(),
    ),
    minInterestRatePerPeriod: z.preprocess(
      (v) => (v === "" || v === null || v === undefined || v === 0 ? undefined : v),
      z.coerce.number().int().positive().optional(),
    ),
    maxInterestRatePerPeriod: z.preprocess(
      (v) => (v === "" || v === null || v === undefined || v === 0 ? undefined : v),
      z.coerce.number().int().positive().optional(),
    ),
    interestRateFrequencyType: z.coerce.number().optional(),
    amortizationType: z.coerce.number(),
    interestType: z.coerce.number(),
    interestCalculationPeriodType: z.coerce.number(),
    allowPartialPeriodInterestCalculation: z.boolean().optional(),
    transactionProcessingStrategyCode: z.string().min(1, "Transaction processing strategy is required"),
    loanScheduleType: z.string().optional(),
    loanScheduleProcessingType: z.string().optional(),
    daysInYearType: z.coerce.number("Days in year type is required").int(),
    daysInMonthType: z.coerce.number("Days in month type is required").int(),
    isInterestRecalculationEnabled: z.boolean(),
    graceOnPrincipalPayment: z.coerce.number().min(0).optional(),
    graceOnInterestPayment: z.coerce.number().min(0).optional(),
    graceOnInterestCharged: z.coerce.number().min(0).optional(),
    graceOnArrearsAgeing: z.coerce.number().min(0).optional(),
    multiDisburseLoan: z.boolean().optional(),
    maxTrancheCount: z.coerce.number().int().positive().optional(),
    outstandingLoanBalance: z.coerce.number().min(0).optional(),
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
    mandatoryGuarantee: z.coerce.number().optional(),
    minimumGuaranteeFromGuarantor: z.coerce.number().optional(),
    minimumGuaranteeFromOwnFunds: z.coerce.number().optional(),
    enableInstallmentLevelDelinquency: z.boolean().optional(),
    includeInBorrowerCycle: z.boolean().optional(),
    useBorrowerCycle: z.boolean().optional(),
    accountMovesOutOfNpaOnlyOnArrearsCompletion: z.boolean().optional(),
    overdueDaysForNpa: z.coerce.number().min(0).optional(),
    minDaysBetweenDisbursalAndFirstRepayment: z.preprocess(
      (val) => (val === "" || val === null || val === undefined || val === 0 ? undefined : val),
      z.coerce.number().positive().optional(),
    ),
    principalThresholdForLastInstallment: z.coerce.number().min(0).max(100).optional(),
    fixedPrincipalPercentagePerInstallment: z.preprocess(
      (val) => (val === "" || val === null || val === undefined || val === 0 ? undefined : val),
      z.coerce.number().min(1).max(100).optional(),
    ),
    fixedLength: z.preprocess(
      (val) => (val === "" || val === null || val === undefined || val === 0 ? undefined : val),
      z.coerce.number().int().positive().optional(),
    ),
    recurringMoratoriumOnPrincipalPeriods: z.coerce.number().min(0).optional(),
    daysInYearCustomStrategy: z.string().optional(),
    dueDaysForRepaymentEvent: z.coerce.number().min(0).optional(),
    overdueDaysForRepaymentEvent: z.coerce.number().min(0).optional(),
    overAppliedCalculationType: z.string().optional(),
    overAppliedNumber: z.coerce.number().optional(),
    allowFullTermForTranche: z.boolean().optional(),
    isLinkedToFloatingInterestRates: z.boolean().optional(),
    floatingRatesId: z.coerce.number().optional(),
    interestRateDifferential: z.coerce.number().optional(),
    minDifferentialLendingRate: z.coerce.number().optional(),
    defaultDifferentialLendingRate: z.coerce.number().optional(),
    maxDifferentialLendingRate: z.coerce.number().optional(),
    isFloatingInterestRateCalculationAllowed: z.boolean().optional(),
    recalculationRestFrequencyInterval: z.coerce.number().optional(),
    recalculationRestFrequencyNthDayType: z.coerce.number().optional(),
    recalculationRestFrequencyDayOfWeekType: z.coerce.number().optional(),
    recalculationRestFrequencyOnDayType: z.coerce.number().optional(),
    recalculationCompoundingFrequencyType: z.coerce.number().optional(),
    recalculationCompoundingFrequencyInterval: z.coerce.number().optional(),
    recalculationCompoundingFrequencyNthDayType: z.coerce.number().optional(),
    recalculationCompoundingFrequencyDayOfWeekType: z.coerce.number().optional(),
    recalculationCompoundingFrequencyOnDayType: z.coerce.number().optional(),
    isCompoundingToBePostedAsTransaction: z.boolean().optional(),
    allowCompoundingOnEod: z.boolean().optional(),
    disallowInterestCalculationOnPastDue: z.boolean().optional(),
    supportedInterestRefundTypes: z.array(z.string()).optional(),
    paymentAllocation: z.array(z.any()).optional(),
    creditAllocation: z.array(z.any()).optional(),
    allowAttributeOverrides: z.record(z.string(), z.boolean()).optional(),
    charges: z.array(z.any()).optional(),
    rates: z.array(z.any()).optional(),
    minimumGap: z.coerce.number().positive().optional(),
    maximumGap: z.coerce.number().positive().optional(),
    allowVariableInstallments: z.boolean().optional(),
    delinquencyBucketId: z.preprocess(
      (val) => (val === "" || val === null || val === undefined || val === 0 ? undefined : val),
      z.coerce.number().positive().optional(),
    ),
    compoundingFrequencyType: z.coerce.number().optional(),
    isArrearsBasedOnOriginalSchedule: z.boolean().optional(),
    inArrearsTolerance: z.coerce.number().min(0).optional(),
    fundId: z.coerce.number().optional(),
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

    // Interest rate cross-field validation: min <= max, rate within [min, max]
    const { interestRatePerPeriod, minInterestRatePerPeriod, maxInterestRatePerPeriod } = data;
    const hasMinRate = minInterestRatePerPeriod != null && !Number.isNaN(minInterestRatePerPeriod);
    const hasMaxRate = maxInterestRatePerPeriod != null && !Number.isNaN(maxInterestRatePerPeriod);
    const hasRate = interestRatePerPeriod != null && !Number.isNaN(interestRatePerPeriod);

    if (hasMinRate && hasMaxRate && minInterestRatePerPeriod > maxInterestRatePerPeriod) {
      ctx.addIssue({
        code: "custom",
        path: ["maxInterestRatePerPeriod"],
        message: "Max Interest Rate must be greater than or equal to Min Interest Rate",
      });
    }
    if (hasRate && hasMinRate && interestRatePerPeriod < minInterestRatePerPeriod) {
      ctx.addIssue({
        code: "custom",
        path: ["interestRatePerPeriod"],
        message: "Interest Rate per Period must not be less than Min Interest Rate",
      });
    }
    if (hasRate && hasMaxRate && interestRatePerPeriod > maxInterestRatePerPeriod) {
      ctx.addIssue({
        code: "custom",
        path: ["interestRatePerPeriod"],
        message: "Interest Rate per Period must not be greater than Max Interest Rate",
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

    // Loan Schedule Processing Type VERTICAL requires advanced-payment-allocation strategy
    if (
      data.loanScheduleProcessingType === "VERTICAL" &&
      data.transactionProcessingStrategyCode !== ADVANCED_PAYMENT_ALLOCATION_STRATEGY
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["loanScheduleProcessingType"],
        message: "Vertical processing requires advance-payment-allocation-strategy",
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
      // Buy Down Fee requires buy down expense and income accounts for accrual accounting
      if (data.accountingRule === 3 || data.accountingRule === 4) {
        if (!data.buyDownExpenseAccountId) {
          ctx.addIssue({
            code: "custom",
            path: ["buyDownExpenseAccountId"],
            message: "Buy Down Expense Account is required for Accrual accounting with Buy Down Fee",
          });
        }
        if (!data.incomeFromBuyDownAccountId) {
          ctx.addIssue({
            code: "custom",
            path: ["incomeFromBuyDownAccountId"],
            message: "Income from Buy Down Account is required for Accrual accounting with Buy Down Fee",
          });
        }
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

    // Interest recalculation enabled requires compounding method, reschedule strategy, and rest frequency
    if (data.isInterestRecalculationEnabled) {
      if (data.interestRecalculationCompoundingMethod == null) {
        ctx.addIssue({
          code: "custom",
          path: ["interestRecalculationCompoundingMethod"],
          message: "Compounding Method is required when Interest Recalculation is enabled",
        });
      }
      if (data.rescheduleStrategyMethod == null) {
        ctx.addIssue({
          code: "custom",
          path: ["rescheduleStrategyMethod"],
          message: "Reschedule Strategy Method is required when Interest Recalculation is enabled",
        });
      }
      if (data.recalculationRestFrequencyType == null) {
        ctx.addIssue({
          code: "custom",
          path: ["recalculationRestFrequencyType"],
          message: "Rest Frequency Type is required when Interest Recalculation is enabled",
        });
      }
    }

    // Hold Guarantee Funds requires mandatory guarantee
    if (data.holdGuaranteeFunds) {
      if (data.mandatoryGuarantee == null) {
        ctx.addIssue({
          code: "custom",
          path: ["mandatoryGuarantee"],
          message: "Mandatory Guarantee is required when Hold Guarantee Funds is enabled",
        });
      }
      const minOwn = data.minimumGuaranteeFromOwnFunds ?? 0;
      const minGuarantor = data.minimumGuaranteeFromGuarantor ?? 0;
      if (data.mandatoryGuarantee != null && data.mandatoryGuarantee < minOwn + minGuarantor) {
        ctx.addIssue({
          code: "custom",
          path: ["mandatoryGuarantee"],
          message: "Mandatory Guarantee must be >= Minimum Guarantee from Own Funds + Minimum Guarantee from Guarantor",
        });
      }
    }

    // Variable installments requires minimumGap and maximumGap > minimumGap
    if (data.allowVariableInstallments) {
      if (data.minimumGap == null) {
        ctx.addIssue({
          code: "custom",
          path: ["minimumGap"],
          message: "Minimum Gap is required when Variable Installments is enabled",
        });
      }
      if (data.minimumGap != null && data.maximumGap != null && data.maximumGap <= data.minimumGap) {
        ctx.addIssue({
          code: "custom",
          path: ["maximumGap"],
          message: "Maximum Gap must be greater than Minimum Gap",
        });
      }
    }

    // Installment level delinquency requires delinquency bucket
    if (data.enableInstallmentLevelDelinquency && data.delinquencyBucketId == null) {
      ctx.addIssue({
        code: "custom",
        path: ["delinquencyBucketId"],
        message: "Delinquency Bucket is required when Installment Level Delinquency is enabled",
      });
    }

    // Partial period interest calculation not allowed with daily interest calculation
    if (data.allowPartialPeriodInterestCalculation && data.interestCalculationPeriodType === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["allowPartialPeriodInterestCalculation"],
        message: "Partial Period Interest Calculation is not allowed with Daily interest calculation",
      });
    }

    // Income Capitalization only with advanced payment allocation strategy
    if (
      data.enableIncomeCapitalization &&
      data.transactionProcessingStrategyCode !== ADVANCED_PAYMENT_ALLOCATION_STRATEGY
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["enableIncomeCapitalization"],
        message: "Income Capitalization is only supported for Advanced Payment Allocation Strategy",
      });
    }

    // Enable Accrual Activity Posting only with accrual accounting rules
    if (data.enableAccrualActivityPosting && data.accountingRule !== 3 && data.accountingRule !== 4) {
      ctx.addIssue({
        code: "custom",
        path: ["enableAccrualActivityPosting"],
        message: "Accrual Activity Posting is only allowed with Accrual accounting rules",
      });
    }

    // fixedPrincipalPercentagePerInstallment only with Equal Principal amortization
    if (data.fixedPrincipalPercentagePerInstallment != null && data.amortizationType !== 0) {
      ctx.addIssue({
        code: "custom",
        path: ["fixedPrincipalPercentagePerInstallment"],
        message: "Fixed Principal Percentage is only allowed with Equal Principal amortization",
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
      if (!data.incomeFromRecoveryAccountId) {
        ctx.addIssue({
          code: "custom",
          path: ["incomeFromRecoveryAccountId"],
          message: "Income from Recovery Account is required for Cash/Accrual accounting",
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

    // Close date must be after start date
    if (data.startDate && data.closeDate && new Date(data.closeDate) <= new Date(data.startDate)) {
      ctx.addIssue({
        code: "custom",
        path: ["closeDate"],
        message: "Close Date must be after Start Date",
      });
    }

    // Floating interest rates validation: when linked, floating rate fields required
    if (data.isLinkedToFloatingInterestRates) {
      if (data.floatingRatesId == null) {
        ctx.addIssue({
          code: "custom",
          path: ["floatingRatesId"],
          message: "Floating Rates ID is required when linked to floating interest rates",
        });
      }
      if (data.interestRateDifferential == null) {
        ctx.addIssue({
          code: "custom",
          path: ["interestRateDifferential"],
          message: "Interest Rate Differential is required when linked to floating interest rates",
        });
      }
      if (data.minDifferentialLendingRate == null) {
        ctx.addIssue({
          code: "custom",
          path: ["minDifferentialLendingRate"],
          message: "Min Differential Lending Rate is required when linked to floating interest rates",
        });
      }
      if (data.defaultDifferentialLendingRate == null) {
        ctx.addIssue({
          code: "custom",
          path: ["defaultDifferentialLendingRate"],
          message: "Default Differential Lending Rate is required when linked to floating interest rates",
        });
      }
      if (data.maxDifferentialLendingRate == null) {
        ctx.addIssue({
          code: "custom",
          path: ["maxDifferentialLendingRate"],
          message: "Max Differential Lending Rate is required when linked to floating interest rates",
        });
      }
      if (data.isFloatingInterestRateCalculationAllowed == null) {
        ctx.addIssue({
          code: "custom",
          path: ["isFloatingInterestRateCalculationAllowed"],
          message: "Floating Interest Rate Calculation Allowed is required when linked to floating interest rates",
        });
      }
      // When linked to floating rates, standard interest rate fields should NOT be set
      if (data.interestRatePerPeriod != null && data.interestRatePerPeriod > 0) {
        ctx.addIssue({
          code: "custom",
          path: ["interestRatePerPeriod"],
          message: "Interest Rate per Period should not be set when linked to floating rates",
        });
      }
    }

    // Floating rate differentials cross-validation
    if (
      data.minDifferentialLendingRate != null &&
      data.maxDifferentialLendingRate != null &&
      data.minDifferentialLendingRate > data.maxDifferentialLendingRate
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["maxDifferentialLendingRate"],
        message: "Max Differential Lending Rate must be >= Min Differential Lending Rate",
      });
    }
    if (
      data.defaultDifferentialLendingRate != null &&
      data.minDifferentialLendingRate != null &&
      data.defaultDifferentialLendingRate < data.minDifferentialLendingRate
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["defaultDifferentialLendingRate"],
        message: "Default Differential Lending Rate must be >= Min Differential Lending Rate",
      });
    }
    if (
      data.defaultDifferentialLendingRate != null &&
      data.maxDifferentialLendingRate != null &&
      data.defaultDifferentialLendingRate > data.maxDifferentialLendingRate
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["defaultDifferentialLendingRate"],
        message: "Default Differential Lending Rate must be <= Max Differential Lending Rate",
      });
    }

    // Floating rates require DECLINING_BALANCE interest type
    if (data.isLinkedToFloatingInterestRates && data.interestType !== 0) {
      ctx.addIssue({
        code: "custom",
        path: ["interestType"],
        message: "Floating interest rates require Declining Balance interest type",
      });
    }

    // Floating rates require interest recalculation enabled
    if (data.isLinkedToFloatingInterestRates && !data.isInterestRecalculationEnabled) {
      ctx.addIssue({
        code: "custom",
        path: ["isInterestRecalculationEnabled"],
        message: "Floating interest rates require Interest Recalculation to be enabled",
      });
    }

    // Interest recalculation requires unequal amortization
    if (data.isInterestRecalculationEnabled && data.isEqualAmortization) {
      ctx.addIssue({
        code: "custom",
        path: ["isInterestRecalculationEnabled"],
        message: "Interest Recalculation cannot be combined with Equal Amortization",
      });
    }

    // Fixed length only for advanced-payment-allocation strategy with zero interest
    if (data.fixedLength != null && data.transactionProcessingStrategyCode !== ADVANCED_PAYMENT_ALLOCATION_STRATEGY) {
      ctx.addIssue({
        code: "custom",
        path: ["fixedLength"],
        message: "Fixed Length is only supported for Advanced Payment Allocation Strategy",
      });
    }

    // allowFullTermForTranche requires multi-disburse + PROGRESSIVE
    if (data.allowFullTermForTranche && !data.multiDisburseLoan) {
      ctx.addIssue({
        code: "custom",
        path: ["allowFullTermForTranche"],
        message: "Allow Full Term for Tranche requires Multi-Disburse Loan",
      });
    }
    if (data.allowFullTermForTranche && enumVal(data.loanScheduleType) !== "PROGRESSIVE") {
      ctx.addIssue({
        code: "custom",
        path: ["allowFullTermForTranche"],
        message: "Allow Full Term for Tranche requires Progressive Loan Schedule",
      });
    }

    // disallowExpectedDisbursements and allowApprovedDisbursedAmountsOverApplied require multi-disburse
    if (data.disallowExpectedDisbursements && !data.multiDisburseLoan) {
      ctx.addIssue({
        code: "custom",
        path: ["disallowExpectedDisbursements"],
        message: "Disallow Expected Disbursements requires Multi-Disburse Loan",
      });
    }
    if (data.allowApprovedDisbursedAmountsOverApplied && !data.multiDisburseLoan) {
      ctx.addIssue({
        code: "custom",
        path: ["allowApprovedDisbursedAmountsOverApplied"],
        message: "Allow Approved Disbursed Amounts Over Applied requires Multi-Disburse Loan",
      });
    }

    // Grace periods recurring moratorium validation
    if (
      data.recurringMoratoriumOnPrincipalPeriods != null &&
      data.recurringMoratoriumOnPrincipalPeriods > 0 &&
      data.graceOnPrincipalPayment != null
    ) {
      const expected =
        (data.numberOfRepayments - data.graceOnPrincipalPayment) % (data.recurringMoratoriumOnPrincipalPeriods + 1);
      if (expected !== 1) {
        ctx.addIssue({
          code: "custom",
          path: ["recurringMoratoriumOnPrincipalPeriods"],
          message: "Recurring Moratorium: (numberOfRepayments - graceOnPrincipal) % (moratorium + 1) must equal 1",
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
      startDate: undefined,
      closeDate: undefined,
      isEqualAmortization: undefined,
      inArrearsTolerance: undefined,
      principalThresholdForLastInstallment: undefined,
      fixedPrincipalPercentagePerInstallment: undefined,
      fixedLength: undefined,
      recurringMoratoriumOnPrincipalPeriods: undefined,
      daysInYearCustomStrategy: undefined,
      isLinkedToFloatingInterestRates: undefined,
      floatingRatesId: undefined,
      interestRateDifferential: undefined,
      minDifferentialLendingRate: undefined,
      defaultDifferentialLendingRate: undefined,
      maxDifferentialLendingRate: undefined,
      isFloatingInterestRateCalculationAllowed: undefined,
      recalculationRestFrequencyInterval: undefined,
      recalculationCompoundingFrequencyType: undefined,
      recalculationCompoundingFrequencyInterval: undefined,
      isArrearsBasedOnOriginalSchedule: undefined,
      isCompoundingToBePostedAsTransaction: undefined,
      allowCompoundingOnEod: undefined,
      disallowInterestCalculationOnPastDue: undefined,
      allowFullTermForTranche: undefined,
      loanScheduleProcessingType: undefined,
      chargeOffBehaviour: undefined,
      repaymentStartDateType: undefined,
      interestRecognitionOnDisbursementDate: undefined,
      enableAccrualActivityPosting: undefined,
      mandatoryGuarantee: undefined,
      minimumGuaranteeFromGuarantor: undefined,
      minimumGuaranteeFromOwnFunds: undefined,
      accountMovesOutOfNpaOnlyOnArrearsCompletion: undefined,
      dueDaysForRepaymentEvent: undefined,
      overdueDaysForRepaymentEvent: undefined,
      minDaysBetweenDisbursalAndFirstRepayment: undefined,
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
      startDate: p.startDate ?? undefined,
      closeDate: p.closeDate ?? undefined,
      includeInBorrowerCycle: !!p.includeInBorrowerCycle,
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
      loanScheduleProcessingType: p.loanScheduleProcessingType?.code ?? undefined,
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
      chargeOffBehaviour: p.chargeOffBehaviour?.code ?? undefined,
      interestRecognitionOnDisbursementDate: !!p.interestRecognitionOnDisbursementDate,
      enableAccrualActivityPosting: !!p.enableAccrualActivityPosting,
      enableIncomeCapitalization: !!p.enableIncomeCapitalization,
      capitalizedIncomeCalculationType: p.capitalizedIncomeCalculationType?.id ?? undefined,
      capitalizedIncomeStrategy: p.capitalizedIncomeStrategy?.id ?? undefined,
      capitalizedIncomeType: p.capitalizedIncomeType?.id ?? undefined,
      isEqualAmortization: !!p.isEqualAmortization,
      inArrearsTolerance: p.inArrearsTolerance ?? undefined,
      principalThresholdForLastInstallment: p.principalThresholdForLastInstallment ?? undefined,
      canUseForTopup: !!p.canUseForTopup,
      syncExpectedWithDisbursementDate: !!p.syncExpectedWithDisbursementDate,
      disallowExpectedDisbursements: !!p.disallowExpectedDisbursements,
      allowApprovedDisbursedAmountsOverApplied: !!p.allowApprovedDisbursedAmountsOverApplied,
      holdGuaranteeFunds: !!p.holdGuaranteeFunds,
      mandatoryGuarantee: p.mandatoryGuarantee ?? undefined,
      minimumGuaranteeFromGuarantor: p.minimumGuaranteeFromGuarantor ?? undefined,
      minimumGuaranteeFromOwnFunds: p.minimumGuaranteeFromOwnFunds ?? undefined,
      enableInstallmentLevelDelinquency: !!p.enableInstallmentLevelDelinquency,
      useBorrowerCycle: !!p.useBorrowerCycle,
      accountMovesOutOfNpaOnlyOnArrearsCompletion: !!p.accountMovesOutOfNpaOnlyOnArrearsCompletion,
      overdueDaysForNpa: p.overdueDaysForNpa ?? undefined,
      minDaysBetweenDisbursalAndFirstRepayment: p.minDaysBetweenDisbursalAndFirstRepayment ?? undefined,
      fixedPrincipalPercentagePerInstallment: p.fixedPrincipalPercentagePerInstallment ?? undefined,
      fixedLength: p.fixedLength ?? undefined,
      recurringMoratoriumOnPrincipalPeriods: p.recurringMoratoriumOnPrincipalPeriods ?? undefined,
      daysInYearCustomStrategy: p.daysInYearCustomStrategy?.code ?? undefined,
      isLinkedToFloatingInterestRates: !!p.isLinkedToFloatingInterestRates,
      floatingRatesId: p.floatingRatesId ?? undefined,
      interestRateDifferential: p.interestRateDifferential ?? undefined,
      minDifferentialLendingRate: p.minDifferentialLendingRate ?? undefined,
      defaultDifferentialLendingRate: p.defaultDifferentialLendingRate ?? undefined,
      maxDifferentialLendingRate: p.maxDifferentialLendingRate ?? undefined,
      isFloatingInterestRateCalculationAllowed: !!p.isFloatingInterestRateCalculationAllowed,
      recalculationRestFrequencyInterval: p.interestRecalculationData?.restFrequencyInterval ?? undefined,
      recalculationCompoundingFrequencyType: p.interestRecalculationData?.compoundingFrequencyType?.id ?? undefined,
      recalculationCompoundingFrequencyInterval: p.interestRecalculationData?.compoundingInterval ?? undefined,
      isArrearsBasedOnOriginalSchedule: !!p.interestRecalculationData?.isArrearsBasedOnOriginalSchedule,
      isCompoundingToBePostedAsTransaction: !!p.interestRecalculationData?.isCompoundingToBePostedAsTransaction,
      allowCompoundingOnEod: !!p.interestRecalculationData?.allowCompoundingOnEod,
      disallowInterestCalculationOnPastDue: !!p.disallowInterestCalculationOnPastDue,
      allowFullTermForTranche: !!p.allowFullTermForTranche,
      dueDaysForRepaymentEvent: p.dueDaysForRepaymentEvent ?? undefined,
      overdueDaysForRepaymentEvent: p.overdueDaysForRepaymentEvent ?? undefined,
      overAppliedCalculationType: p.overAppliedCalculationType ?? undefined,
      overAppliedNumber: p.allowApprovedDisbursedAmountsOverApplied ? p.overAppliedNumber : undefined,
      minimumGap: p.minimumGap > 0 ? p.minimumGap : undefined,
      maximumGap: p.maximumGap > 0 ? p.maximumGap : undefined,
      allowVariableInstallments: !!p.allowVariableInstallments,
      delinquencyBucketId: p.delinquencyBucketId ?? undefined,
      compoundingFrequencyType: p.interestRecalculationData?.compoundingFrequencyType?.id ?? undefined,
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
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Start Date")}</label>
              <Input type="date" {...register("startDate")} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Close Date")}</label>
              <Input type="date" {...register("closeDate")} error={errors.closeDate?.message} />
            </div>
            <div
              className="col-span-2 flex items-center gap-2 pt-2 cursor-pointer"
              onClick={() => setValue("includeInBorrowerCycle", !watch("includeInBorrowerCycle"))}
            >
              <Checkbox
                id="includeInBorrowerCycle"
                checked={!!watch("includeInBorrowerCycle")}
                onCheckedChange={(v) => setValue("includeInBorrowerCycle", v === true)}
              />
              <label htmlFor="includeInBorrowerCycle" className="block text-sm font-medium">
                {t("Include in Borrower Cycle")}
              </label>
            </div>
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
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Min Interest Rate (%)")}</label>
              <Input type="number" step="0.01" {...register("minInterestRatePerPeriod")} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Max Interest Rate (%)")}</label>
              <Input type="number" step="0.01" {...register("maxInterestRatePerPeriod")} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Interest Calculation Period Type")}</label>
              <Select
                value={String(watch("interestCalculationPeriodType") ?? 1)}
                onValueChange={(v) => setValue("interestCalculationPeriodType", Number(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(template?.interestCalculationPeriodTypeOptions ?? []).map((o) => (
                    <SelectItem key={o.id} value={String(o.id)}>
                      {o.value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("In Arrears Tolerance")}</label>
              <Input type="number" step="0.01" {...register("inArrearsTolerance")} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Principal Threshold for Last Installment (%)")}</label>
              <Input type="number" step="0.01" {...register("principalThresholdForLastInstallment")} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Fixed Principal Percentage per Installment (%)")}</label>
              <Input type="number" step="0.01" {...register("fixedPrincipalPercentagePerInstallment")} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Fixed Length")}</label>
              <Input type="number" {...register("fixedLength")} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Recurring Moratorium on Principal Periods")}</label>
              <Input type="number" {...register("recurringMoratoriumOnPrincipalPeriods")} />
            </div>
            <div
              className="col-span-2 flex items-center gap-2 pt-2 cursor-pointer"
              onClick={() => setValue("isLinkedToFloatingInterestRates", !watch("isLinkedToFloatingInterestRates"))}
            >
              <Checkbox
                id="isLinkedToFloatingInterestRates"
                checked={!!watch("isLinkedToFloatingInterestRates")}
                onCheckedChange={(v) => setValue("isLinkedToFloatingInterestRates", v === true)}
              />
              <label htmlFor="isLinkedToFloatingInterestRates" className="block text-sm font-medium">
                {t("Linked to Floating Interest Rates")}
              </label>
            </div>
            {watch("isLinkedToFloatingInterestRates") && (
              <>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium">{t("Floating Rates ID")}</label>
                  <Input type="number" {...register("floatingRatesId")} />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium">{t("Interest Rate Differential")}</label>
                  <Input type="number" step="0.01" {...register("interestRateDifferential")} />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium">{t("Min Differential Lending Rate")}</label>
                  <Input type="number" step="0.01" {...register("minDifferentialLendingRate")} />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium">{t("Default Differential Lending Rate")}</label>
                  <Input type="number" step="0.01" {...register("defaultDifferentialLendingRate")} />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium">{t("Max Differential Lending Rate")}</label>
                  <Input type="number" step="0.01" {...register("maxDifferentialLendingRate")} />
                </div>
                <div
                  className="col-span-2 flex items-center gap-2 pt-2 cursor-pointer"
                  onClick={() =>
                    setValue(
                      "isFloatingInterestRateCalculationAllowed",
                      !watch("isFloatingInterestRateCalculationAllowed"),
                    )
                  }
                >
                  <Checkbox
                    id="isFloatingInterestRateCalculationAllowed"
                    checked={!!watch("isFloatingInterestRateCalculationAllowed")}
                    onCheckedChange={(v) => setValue("isFloatingInterestRateCalculationAllowed", v === true)}
                  />
                  <label htmlFor="isFloatingInterestRateCalculationAllowed" className="block text-sm font-medium">
                    {t("Floating Interest Rate Calculation Allowed")}
                  </label>
                </div>
              </>
            )}
            <div
              className="col-span-2 flex items-center gap-2 pt-2 cursor-pointer"
              onClick={() => setValue("isEqualAmortization", !watch("isEqualAmortization"))}
            >
              <Checkbox
                id="isEqualAmortization"
                checked={!!watch("isEqualAmortization")}
                onCheckedChange={(v) => setValue("isEqualAmortization", v === true)}
              />
              <label htmlFor="isEqualAmortization" className="block text-sm font-medium">
                {t("Equal Amortization")}
              </label>
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
              <label className="block text-sm font-medium">{t("Days In Month Type")} *</label>
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
              <label className="block text-sm font-medium">{t("Days In Year Type")} *</label>
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
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Loan Schedule Processing Type")}</label>
              <Select
                value={watch("loanScheduleProcessingType") ?? ""}
                onValueChange={(v) => setValue("loanScheduleProcessingType", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("Select")} />
                </SelectTrigger>
                <SelectContent>
                  {(template?.loanScheduleProcessingTypeOptions ?? []).map((o) => (
                    <SelectItem key={o.code} value={o.code}>
                      {o.value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Charge-Off Behaviour")}</label>
              <Select
                value={watch("chargeOffBehaviour") ?? ""}
                onValueChange={(v) => setValue("chargeOffBehaviour", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("Select")} />
                </SelectTrigger>
                <SelectContent>
                  {(template?.chargeOffBehaviourOptions ?? []).map((o) => (
                    <SelectItem key={o.code} value={o.code}>
                      {o.value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Repayment Start Date Type")}</label>
              <Select
                value={watch("repaymentStartDateType") ? String(watch("repaymentStartDateType")) : ""}
                onValueChange={(v) => setValue("repaymentStartDateType", Number(v))}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("Select")} />
                </SelectTrigger>
                <SelectContent>
                  {(template?.repaymentStartDateTypeOptions ?? []).map((o) => (
                    <SelectItem key={o.id} value={String(o.id)}>
                      {o.value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Days in Year Custom Strategy")}</label>
              <Select
                value={watch("daysInYearCustomStrategy") ?? ""}
                onValueChange={(v) => setValue("daysInYearCustomStrategy", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("Select")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FULL_LEAP_YEAR">{t("Full Leap Year")}</SelectItem>
                  <SelectItem value="FEB_29_PERIOD_ONLY">{t("Feb 29 Period Only")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div
              className="col-span-2 flex items-center gap-2 pt-2 cursor-pointer"
              onClick={() =>
                setValue("interestRecognitionOnDisbursementDate", !watch("interestRecognitionOnDisbursementDate"))
              }
            >
              <Checkbox
                id="interestRecognitionOnDisbursementDate"
                checked={!!watch("interestRecognitionOnDisbursementDate")}
                onCheckedChange={(v) => setValue("interestRecognitionOnDisbursementDate", v === true)}
              />
              <label htmlFor="interestRecognitionOnDisbursementDate" className="block text-sm font-medium">
                {t("Interest Recognition on Disbursement Date")}
              </label>
            </div>
            <div
              className="col-span-2 flex items-center gap-2 pt-2 cursor-pointer"
              onClick={() => setValue("enableAccrualActivityPosting", !watch("enableAccrualActivityPosting"))}
            >
              <Checkbox
                id="enableAccrualActivityPosting"
                checked={!!watch("enableAccrualActivityPosting")}
                onCheckedChange={(v) => setValue("enableAccrualActivityPosting", v === true)}
              />
              <label htmlFor="enableAccrualActivityPosting" className="block text-sm font-medium">
                {t("Enable Accrual Activity Posting")}
              </label>
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
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium">{t("Rest Frequency Interval")}</label>
                  <Input type="number" {...register("recalculationRestFrequencyInterval")} />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium">{t("Compounding Frequency Type")}</label>
                  <Select
                    value={
                      watch("recalculationCompoundingFrequencyType")
                        ? String(watch("recalculationCompoundingFrequencyType"))
                        : ""
                    }
                    onValueChange={(v) => setValue("recalculationCompoundingFrequencyType", Number(v))}
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
                  <label className="block text-sm font-medium">{t("Compounding Frequency Interval")}</label>
                  <Input type="number" {...register("recalculationCompoundingFrequencyInterval")} />
                </div>
                <div
                  className="col-span-2 flex items-center gap-2 pt-2 cursor-pointer"
                  onClick={() =>
                    setValue("isArrearsBasedOnOriginalSchedule", !watch("isArrearsBasedOnOriginalSchedule"))
                  }
                >
                  <Checkbox
                    id="isArrearsBasedOnOriginalSchedule"
                    checked={!!watch("isArrearsBasedOnOriginalSchedule")}
                    onCheckedChange={(v) => setValue("isArrearsBasedOnOriginalSchedule", v === true)}
                  />
                  <label htmlFor="isArrearsBasedOnOriginalSchedule" className="block text-sm font-medium">
                    {t("Arrears Based on Original Schedule")}
                  </label>
                </div>
                <div
                  className="col-span-2 flex items-center gap-2 pt-2 cursor-pointer"
                  onClick={() =>
                    setValue("isCompoundingToBePostedAsTransaction", !watch("isCompoundingToBePostedAsTransaction"))
                  }
                >
                  <Checkbox
                    id="isCompoundingToBePostedAsTransaction"
                    checked={!!watch("isCompoundingToBePostedAsTransaction")}
                    onCheckedChange={(v) => setValue("isCompoundingToBePostedAsTransaction", v === true)}
                  />
                  <label htmlFor="isCompoundingToBePostedAsTransaction" className="block text-sm font-medium">
                    {t("Compounding to be Posted as Transaction")}
                  </label>
                </div>
                <div
                  className="col-span-2 flex items-center gap-2 pt-2 cursor-pointer"
                  onClick={() => setValue("allowCompoundingOnEod", !watch("allowCompoundingOnEod"))}
                >
                  <Checkbox
                    id="allowCompoundingOnEod"
                    checked={!!watch("allowCompoundingOnEod")}
                    onCheckedChange={(v) => setValue("allowCompoundingOnEod", v === true)}
                  />
                  <label htmlFor="allowCompoundingOnEod" className="block text-sm font-medium">
                    {t("Allow Compounding on EOD")}
                  </label>
                </div>
                <div
                  className="col-span-2 flex items-center gap-2 pt-2 cursor-pointer"
                  onClick={() =>
                    setValue("disallowInterestCalculationOnPastDue", !watch("disallowInterestCalculationOnPastDue"))
                  }
                >
                  <Checkbox
                    id="disallowInterestCalculationOnPastDue"
                    checked={!!watch("disallowInterestCalculationOnPastDue")}
                    onCheckedChange={(v) => setValue("disallowInterestCalculationOnPastDue", v === true)}
                  />
                  <label htmlFor="disallowInterestCalculationOnPastDue" className="block text-sm font-medium">
                    {t("Disallow Interest Calculation on Past Due")}
                  </label>
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
                <div
                  className="col-span-2 flex items-center gap-2 pt-2 cursor-pointer"
                  onClick={() => setValue("disallowExpectedDisbursements", !watch("disallowExpectedDisbursements"))}
                >
                  <Checkbox
                    id="disallowExpectedDisbursements"
                    checked={!!watch("disallowExpectedDisbursements")}
                    onCheckedChange={(v) => setValue("disallowExpectedDisbursements", v === true)}
                  />
                  <label htmlFor="disallowExpectedDisbursements" className="block text-sm font-medium">
                    {t("Disallow Expected Disbursements")}
                  </label>
                </div>
                <div
                  className="col-span-2 flex items-center gap-2 pt-2 cursor-pointer"
                  onClick={() =>
                    setValue(
                      "allowApprovedDisbursedAmountsOverApplied",
                      !watch("allowApprovedDisbursedAmountsOverApplied"),
                    )
                  }
                >
                  <Checkbox
                    id="allowApprovedDisbursedAmountsOverApplied"
                    checked={!!watch("allowApprovedDisbursedAmountsOverApplied")}
                    onCheckedChange={(v) => setValue("allowApprovedDisbursedAmountsOverApplied", v === true)}
                  />
                  <label htmlFor="allowApprovedDisbursedAmountsOverApplied" className="block text-sm font-medium">
                    {t("Allow Approved Disbursed Amounts Over Applied")}
                  </label>
                </div>
                {watch("allowApprovedDisbursedAmountsOverApplied") && (
                  <>
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium">{t("Over Applied Calculation Type")}</label>
                      <Input {...register("overAppliedCalculationType")} placeholder={t("percentage or flat")} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium">{t("Over Applied Number")}</label>
                      <Input type="number" {...register("overAppliedNumber")} />
                    </div>
                  </>
                )}
                <div
                  className="col-span-2 flex items-center gap-2 pt-2 cursor-pointer"
                  onClick={() => setValue("allowFullTermForTranche", !watch("allowFullTermForTranche"))}
                >
                  <Checkbox
                    id="allowFullTermForTranche"
                    checked={!!watch("allowFullTermForTranche")}
                    onCheckedChange={(v) => setValue("allowFullTermForTranche", v === true)}
                  />
                  <label htmlFor="allowFullTermForTranche" className="block text-sm font-medium">
                    {t("Allow Full Term for Tranche")}
                  </label>
                </div>
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

        {/* ── Guarantee ── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("Guarantee")}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-x-6 gap-y-4">
            <div
              className="col-span-2 flex items-center gap-2 pt-2 cursor-pointer"
              onClick={() => setValue("holdGuaranteeFunds", !watch("holdGuaranteeFunds"))}
            >
              <Checkbox
                id="holdGuaranteeFunds"
                checked={!!watch("holdGuaranteeFunds")}
                onCheckedChange={(v) => setValue("holdGuaranteeFunds", v === true)}
              />
              <label htmlFor="holdGuaranteeFunds" className="block text-sm font-medium">
                {t("Hold Guarantee Funds")}
              </label>
            </div>
            {watch("holdGuaranteeFunds") && (
              <>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium">{t("Mandatory Guarantee")}</label>
                  <Input
                    type="number"
                    step="0.01"
                    {...register("mandatoryGuarantee")}
                    error={errors.mandatoryGuarantee?.message}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium">{t("Minimum Guarantee from Guarantor")}</label>
                  <Input type="number" step="0.01" {...register("minimumGuaranteeFromGuarantor")} />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium">{t("Minimum Guarantee from Own Funds")}</label>
                  <Input type="number" step="0.01" {...register("minimumGuaranteeFromOwnFunds")} />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* ── Arrears / NPA ── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("Arrears / NPA")}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-x-6 gap-y-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Overdue Days for NPA")}</label>
              <Input type="number" {...register("overdueDaysForNpa")} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Delinquency Bucket")}</label>
              <Input type="number" {...register("delinquencyBucketId")} placeholder={t("Bucket ID")} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Due Days for Repayment Event")}</label>
              <Input type="number" {...register("dueDaysForRepaymentEvent")} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Overdue Days for Repayment Event")}</label>
              <Input type="number" {...register("overdueDaysForRepaymentEvent")} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">
                {t("Minimum Days Between Disbursal and First Repayment")}
              </label>
              <Input type="number" {...register("minDaysBetweenDisbursalAndFirstRepayment")} />
            </div>
            <div
              className="col-span-2 flex items-center gap-2 pt-2 cursor-pointer"
              onClick={() =>
                setValue(
                  "accountMovesOutOfNpaOnlyOnArrearsCompletion",
                  !watch("accountMovesOutOfNpaOnlyOnArrearsCompletion"),
                )
              }
            >
              <Checkbox
                id="accountMovesOutOfNpaOnlyOnArrearsCompletion"
                checked={!!watch("accountMovesOutOfNpaOnlyOnArrearsCompletion")}
                onCheckedChange={(v) => setValue("accountMovesOutOfNpaOnlyOnArrearsCompletion", v === true)}
              />
              <label htmlFor="accountMovesOutOfNpaOnlyOnArrearsCompletion" className="block text-sm font-medium">
                {t("Account Moves Out of NPA Only on Arrears Completion")}
              </label>
            </div>
            <div
              className="col-span-2 flex items-center gap-2 pt-2 cursor-pointer"
              onClick={() => setValue("enableInstallmentLevelDelinquency", !watch("enableInstallmentLevelDelinquency"))}
            >
              <Checkbox
                id="enableInstallmentLevelDelinquency"
                checked={!!watch("enableInstallmentLevelDelinquency")}
                onCheckedChange={(v) => setValue("enableInstallmentLevelDelinquency", v === true)}
              />
              <label htmlFor="enableInstallmentLevelDelinquency" className="block text-sm font-medium">
                {t("Enable Installment Level Delinquency")}
              </label>
            </div>
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
