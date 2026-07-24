import { z } from "zod";

export const createSavingsAccountSchema = z.object({
  clientId: z.number({ message: "Client is required" }).int(),
  productId: z.number({ message: "Savings product is required" }).int(),
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
  transactionDate: z.string().min(1, "Date is required"),
  transactionAmount: z.number({ message: "Amount is required" }).positive("Amount must be positive"),
  paymentTypeId: z.number().int().optional(),
  receiptNumber: z.string().optional(),
  locale: z.string().default("en"),
  dateFormat: z.string().default("yyyy-MM-dd"),
});

export type DepositTransactionFormValues = z.infer<typeof depositTransactionSchema>;

/** Schema for savings product creation — matches Finfact POST /savingsproducts */
export const createSavingsProductSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  shortName: z.string().min(1, "Short name is required").max(20).regex(/^\S+$/, "No spaces allowed"),
  description: z.string().max(500).optional(),
  currencyCode: z.string().min(1, "Currency is required"),
  digitsAfterDecimal: z.number().int().min(0).max(6).default(2),
  inMultiplesOf: z.number().int().min(0).optional(),
  nominalAnnualInterestRate: z.number({ message: "Interest rate is required" }).min(0),
  interestCompoundingPeriodType: z.number({ message: "Required" }).int(),
  interestPostingPeriodType: z.number({ message: "Required" }).int(),
  interestCalculationType: z.number({ message: "Required" }).int(),
  interestCalculationDaysInYearType: z.number({ message: "Required" }).int(),
  minRequiredOpeningBalance: z.number().min(0).optional(),
  lockinPeriodFrequency: z.number().int().positive().optional(),
  lockinPeriodFrequencyType: z.number().int().optional(),
  withdrawalFeeForTransfers: z.boolean().optional(),
  allowOverdraft: z.boolean().optional(),
  overdraftLimit: z.number().optional(),
  minRequiredBalance: z.number().optional(),
  enforceMinRequiredBalance: z.boolean().optional(),
  accountingRule: z.number().int().optional(),
  isDormancyTrackingActive: z.boolean().optional(),
  daysToInactive: z.number().int().min(0).optional(),
  daysToDormancy: z.number().int().min(0).optional(),
  daysToEscheat: z.number().int().min(0).optional(),
  withHoldTax: z.boolean().optional(),
  // accountMappingForPayment: z.string().max(100).optional(),
  locale: z.string().default("en"),
  dateFormat: z.string().default("yyyy-MM-dd"),
});

export type CreateSavingsProductFormValues = z.infer<typeof createSavingsProductSchema>;

/** Schema for recurring deposit account creation — matches Fineract POST /recurringdepositaccounts */
export const createRecurringDepositAccountSchema = z.object({
  clientId: z.string().min(1, "Client is required"),
  productId: z.string().min(1, "Product is required"),
  externalId: z.string().optional(),
  depositAmount: z.string().min(1, "Deposit amount is required"),
  depositPeriod: z.string().min(1, "Period is required"),
  depositPeriodFrequencyId: z.string(),
  submittedOnDate: z.string().min(1, "Date is required"),
  recurringFrequency: z.string().optional(),
  recurringFrequencyType: z.string().optional(),
});

export type CreateRecurringDepositAccountFormValues = z.infer<typeof createRecurringDepositAccountSchema>;

/** Schema for recurring deposit product creation — matches Fineract POST /recurringdepositproducts */
export const createRecurringDepositProductSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  shortName: z.string().min(1, "Short name is required").max(20).regex(/^\S+$/, "No spaces allowed"),
  description: z.string().max(500).optional(),
  currencyCode: z.string().min(1, "Currency is required"),
  digitsAfterDecimal: z.number().int().min(0).max(6).default(2),
  inMultiplesOf: z.number().int().min(0).optional(),
  depositAmount: z.number({ message: "Deposit amount is required" }).min(0, "Deposit amount must be >= 0"),
  minDepositTerm: z.number({ message: "Min term is required" }).int().positive("Min term must be > 0"),
  minDepositTermTypeId: z.number({ message: "Required" }).int(),
  maxDepositTerm: z.number().int().positive().optional(),
  maxDepositTermTypeId: z.number().int().optional(),
  recurringDepositFrequency: z.number({ message: "Frequency is required" }).int().positive("Frequency must be > 0"),
  recurringDepositFrequencyType: z.number({ message: "Required" }).int(),
  preClosurePenalApplicable: z.boolean().optional(),
  preClosurePenalInterest: z.number().min(0).optional(),
  preClosurePenalInterestOnTypeId: z.number().int().optional(),
  interestCompoundingPeriodType: z.number({ message: "Required" }).int(),
  interestPostingPeriodType: z.number({ message: "Required" }).int(),
  interestCalculationType: z.number({ message: "Required" }).int(),
  interestCalculationDaysInYearType: z.number({ message: "Required" }).int(),
  accountingRule: z.number().int().optional(),
  withHoldTax: z.boolean().optional(),
  locale: z.string().default("en"),
  dateFormat: z.string().default("yyyy-MM-dd"),
});

export type CreateRecurringDepositProductFormValues = z.infer<typeof createRecurringDepositProductSchema>;
