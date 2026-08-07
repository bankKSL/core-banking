import { z } from "zod";
import i18n from "@/i18n";

export const createSavingsAccountSchema = z.object({
  clientId: z.number({ message: i18n.t("Client is required") }).int(),
  productId: z.number({ message: i18n.t("Savings product is required") }).int(),
  submittedOnDate: z.string().min(1),
  externalId: z.string().max(100).optional(),
  fieldOfficerId: z.number().int().optional().nullable(),
  nominalAnnualInterestRate: z.number().min(0).optional(),
  minRequiredOpeningBalance: z.number().min(0).optional(),
  lockinPeriodFrequency: z.number().int().positive().optional(),
  lockinPeriodFrequencyType: z.number().int().optional(),
  withdrawalFeeForTransfers: z.boolean().optional(),
  allowOverdraft: z.boolean().optional(),
  overdraftLimit: z.number().optional(),
  enforceMinRequiredBalance: z.boolean().optional(),
  minRequiredBalance: z.number().optional(),
  locale: z.string().default("en"),
  dateFormat: z.string().default("yyyy-MM-dd"),
});

export type CreateSavingsAccountFormValues = z.infer<typeof createSavingsAccountSchema>;

/** Schema for deposit transaction */
export const depositTransactionSchema = z.object({
  transactionDate: z.string().min(1, i18n.t("Date is required")),
  transactionAmount: z.number({ message: i18n.t("Amount is required") }).positive(i18n.t("Amount must be positive")),
  paymentTypeId: z.number().int().optional(),
  receiptNumber: z.string().optional(),
  locale: z.string().default("en"),
  dateFormat: z.string().default("yyyy-MM-dd"),
});

export type DepositTransactionFormValues = z.infer<typeof depositTransactionSchema>;

/** Schema for savings product creation — matches Finfact POST /savingsproducts */
export const createSavingsProductSchema = z
  .object({
    name: z.string().min(1, i18n.t("Name is required")).max(100),
    shortName: z.string().min(1, i18n.t("Short name is required")).max(4, i18n.t("Max 4 characters")).regex(/^\S+$/, i18n.t("No spaces allowed")),
    description: z.string().max(500).optional(),
    currencyCode: z.string().min(1, i18n.t("Currency is required")),
    digitsAfterDecimal: z.number().int().min(0).max(6).default(2),
    inMultiplesOf: z.number().int().min(0).optional(),
    nominalAnnualInterestRate: z.number({ message: i18n.t("Interest rate is required") }).min(0),
    interestCompoundingPeriodType: z.number({ message: i18n.t("Required") }).int(),
    interestPostingPeriodType: z.number({ message: i18n.t("Required") }).int(),
    interestCalculationType: z.number({ message: i18n.t("Required") }).int(),
    interestCalculationDaysInYearType: z.number({ message: i18n.t("Required") }).int(),
    minRequiredOpeningBalance: z.number().min(0).optional(),
    minBalanceForInterestCalculation: z.number().min(0).optional(),
    lockinPeriodFrequency: z.number().int().min(0).optional(),
    lockinPeriodFrequencyType: z.number().int().min(0).max(3).optional(),
    withdrawalFeeAmount: z.number().min(0).optional(),
    withdrawalFeeType: z.number().int().optional(),
    withdrawalFeeForTransfers: z.boolean().optional(),
    feeAmount: z.number().min(0).optional(),
    feeOnMonthDay: z
      .string()
      .regex(/^(0[1-9]|[12]\d|3[01]) (January|February|March|April|May|June|July|August|September|October|November|December)$/, i18n.t("Must be in 'dd MMMM' format, e.g. '01 January'"))
      .optional(),
    allowOverdraft: z.boolean().optional(),
    overdraftLimit: z.number().min(0).optional(),
    nominalAnnualInterestRateOverdraft: z.number().min(0).optional(),
    minOverdraftForInterestCalculation: z.number().min(0).optional(),
    minRequiredBalance: z.number().min(0).optional(),
    enforceMinRequiredBalance: z.boolean().optional(),
    lienAllowed: z.boolean().optional(),
    maxAllowedLienLimit: z.number().min(0).optional(),
    accountingRule: z.number().int().min(1).max(3).default(1),
    isDormancyTrackingActive: z.boolean().optional(),
    daysToInactive: z.number().int().min(1).optional(),
    daysToDormancy: z.number().int().min(1).optional(),
    daysToEscheat: z.number().int().min(1).optional(),
    withHoldTax: z.boolean().optional(),
    taxGroupId: z.number().int().positive().optional(),
    locale: z.string().default("en"),
    dateFormat: z.string().default("yyyy-MM-dd"),
    monthDayFormat: z.string().default("dd MMMM"),
  })
  .superRefine((data, ctx) => {
    // lockinPeriodFrequency + lockinPeriodFrequencyType pair
    if (data.lockinPeriodFrequency && data.lockinPeriodFrequency > 0 && !data.lockinPeriodFrequencyType) {
      ctx.addIssue({ code: "custom", path: ["lockinPeriodFrequencyType"], message: i18n.t("Lock-in type is required when frequency is set") });
    }
    if (data.lockinPeriodFrequencyType !== undefined && data.lockinPeriodFrequencyType >= 0 && !data.lockinPeriodFrequency) {
      ctx.addIssue({ code: "custom", path: ["lockinPeriodFrequency"], message: i18n.t("Lock-in frequency is required when type is set") });
    }
    // feeAmount + feeOnMonthDay pair
    if (data.feeAmount && data.feeAmount > 0 && !data.feeOnMonthDay) {
      ctx.addIssue({ code: "custom", path: ["feeOnMonthDay"], message: i18n.t("Fee month/day is required when fee amount is set. Format: 'dd MMMM' e.g. '01 January'") });
    }
    if (data.feeOnMonthDay && !data.feeAmount) {
      ctx.addIssue({ code: "custom", path: ["feeAmount"], message: i18n.t("Fee amount is required when month/day is set") });
    }
    // dormancy day ordering
    if (data.isDormancyTrackingActive) {
      if (!data.daysToInactive) {
        ctx.addIssue({ code: "custom", path: ["daysToInactive"], message: i18n.t("Days to inactive is required") });
      }
      if (!data.daysToDormancy) {
        ctx.addIssue({ code: "custom", path: ["daysToDormancy"], message: i18n.t("Days to dormancy is required") });
      } else if (data.daysToInactive && data.daysToDormancy <= data.daysToInactive) {
        ctx.addIssue({ code: "custom", path: ["daysToDormancy"], message: i18n.t("Must be greater than days to inactive") });
      }
      if (!data.daysToEscheat) {
        ctx.addIssue({ code: "custom", path: ["daysToEscheat"], message: i18n.t("Days to escheat is required") });
      } else if (data.daysToDormancy && data.daysToEscheat <= data.daysToDormancy) {
        ctx.addIssue({ code: "custom", path: ["daysToEscheat"], message: i18n.t("Must be greater than days to dormancy") });
      }
    }
    // withHoldTax + taxGroupId
    if (data.withHoldTax && !data.taxGroupId) {
      ctx.addIssue({ code: "custom", path: ["taxGroupId"], message: i18n.t("Tax group is required when withholding tax is enabled") });
    }
    // lien + overdraft limit check
    if (data.lienAllowed && data.allowOverdraft && data.overdraftLimit && data.maxAllowedLienLimit && data.overdraftLimit > data.maxAllowedLienLimit) {
      ctx.addIssue({ code: "custom", path: ["maxAllowedLienLimit"], message: i18n.t("Lien limit must be greater than or equal to overdraft limit") });
    }
  });

export type CreateSavingsProductFormValues = z.infer<typeof createSavingsProductSchema>;

/** Schema for recurring deposit account creation — matches finfact POST /recurringdepositaccounts */
export const createRecurringDepositAccountSchema = z.object({
  clientId: z.string().min(1, i18n.t("Client is required")),
  productId: z.string().min(1, i18n.t("Product is required")),
  externalId: z.string().optional(),
  mandatoryRecommendedDepositAmount: z.string().min(1, i18n.t("Recurring amount is required")),
  depositPeriod: z.string().min(1, i18n.t("Period is required")),
  depositPeriodFrequencyId: z.string(),
  submittedOnDate: z.string().min(1, i18n.t("Date is required")),
  recurringFrequency: z.string().optional(),
  recurringFrequencyType: z.string().optional(),
});

export type CreateRecurringDepositAccountFormValues = z.infer<typeof createRecurringDepositAccountSchema>;

/** Schema for recurring deposit product creation — matches finfact POST /recurringdepositproducts */
export const createRecurringDepositProductSchema = z.object({
  name: z.string().min(1, i18n.t("Name is required")).max(100),
  shortName: z.string().min(1, i18n.t("Short name is required")).max(4, i18n.t("Max 4 characters")).regex(/^\S+$/, i18n.t("No spaces allowed")),
  description: z.string().max(500).optional(),
  currencyCode: z.string().min(1, i18n.t("Currency is required")),
  digitsAfterDecimal: z.number().int().min(0).max(6).default(2),
  inMultiplesOf: z.number().int().min(0).optional(),
  depositAmount: z.number({ message: i18n.t("Deposit amount is required") }).min(0, i18n.t("Deposit amount must be >= 0")),
  minDepositTerm: z.number({ message: i18n.t("Min term is required") }).int().positive(i18n.t("Min term must be > 0")),
  minDepositTermTypeId: z.number({ message: i18n.t("Required") }).int(),
  maxDepositTerm: z.number().int().positive().optional(),
  maxDepositTermTypeId: z.number().int().optional(),
  recurringDepositFrequency: z.number({ message: i18n.t("Frequency is required") }).int().positive(i18n.t("Frequency must be > 0")),
  recurringDepositFrequencyType: z.number({ message: i18n.t("Required") }).int(),
  preClosurePenalApplicable: z.boolean().optional(),
  preClosurePenalInterest: z.number().min(0).optional(),
  preClosurePenalInterestOnTypeId: z.number().int().optional(),
  interestCompoundingPeriodType: z.number({ message: i18n.t("Required") }).int(),
  interestPostingPeriodType: z.number({ message: i18n.t("Required") }).int(),
  interestCalculationType: z.number({ message: i18n.t("Required") }).int(),
  interestCalculationDaysInYearType: z.number({ message: i18n.t("Required") }).int(),
  accountingRule: z.number().int().optional(),
  withHoldTax: z.boolean().optional(),
  locale: z.string().default("en"),
  dateFormat: z.string().default("yyyy-MM-dd"),
});

export type CreateRecurringDepositProductFormValues = z.infer<typeof createRecurringDepositProductSchema>;
