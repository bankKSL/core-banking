import { z } from "zod";

export const createLoanSchema = z.object({
  clientId: z.number({ message: "Client is required" }).int().positive("Client is required"),
  productId: z.number({ message: "Loan product is required" }).int().positive("Loan product is required"),
  principal: z.number({ message: "Principal amount is required" }).positive("Principal must be greater than 0"),
  loanTermFrequency: z.number({ message: "Term is required" }).int().positive(),
  loanTermFrequencyType: z.number().int().min(0).max(3),
  numberOfRepayments: z.number({ message: "Number of repayments is required" }).int().positive(),
  repaymentEvery: z.number({ message: "Repayment frequency is required" }).int().positive(),
  repaymentFrequencyType: z.number().int().positive(),
  interestRatePerPeriod: z.number({ message: "Interest rate is required" }).min(0),
  interestRateFrequencyType: z.number().int().optional(),
  interestType: z.number().int().optional(),
  amortizationType: z.number().int().optional(),
  interestCalculationPeriodType: z.number().int().optional(),
  expectedDisbursementDate: z.string({ message: "Disbursement date is required" }).min(1),
  expectedFirstRepaymentOnDate: z.string().optional(),
  submittedOnDate: z.string().min(1),
  transactionProcessingStrategyCode: z.string().optional(),
  loanPurposeId: z.number().int().optional().nullable(),
  loanOfficerId: z.number().int().optional().nullable(),
  fundId: z.number().int().optional().nullable(),
  linkAccountId: z.number().int().optional().nullable(),
  externalId: z.string().max(100).optional(),
  graceOnPrincipalPayment: z.number().int().min(0).optional(),
  graceOnInterestPayment: z.number().int().min(0).optional(),
  graceOnInterestCharged: z.number().int().min(0).optional(),
  graceOnArrearsAgeing: z.number().int().min(0).optional(),
  inArrearsTolerance: z.number().min(0).optional(),
  allowPartialPeriodInterestCalcualtion: z.boolean().optional(),
  maxOutstandingLoanBalance: z.number().optional(),
  dateFormat: z.string().default("yyyy-MM-dd"),
  locale: z.string().default("en"),
  charges: z.array(z.object({ chargeId: z.number(), amount: z.number() })).optional(),
});

export type CreateLoanFormValues = z.infer<typeof createLoanSchema>;

/** Schema for loan product creation */
export const createLoanProductSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  shortName: z.string().max(20).optional(),
  description: z.string().max(500).optional(),
  externalId: z.string().max(100).optional(),
  fundId: z.number().int().optional(),
  currencyCode: z.string().min(1, "Currency is required"),
  digitsAfterDecimal: z.number().int().min(0).default(2),
  inMultiplesOf: z.number().int().min(0).default(0),
  principal: z.number({ message: "Principal is required" }).positive(),
  numberOfRepayments: z.number({ message: "Number of repayments is required" }).int().positive(),
  repaymentEvery: z.number({ message: "Repayment frequency is required" }).int().positive(),
  repaymentFrequencyType: z.number().int().positive(),
  interestRatePerPeriod: z.number({ message: "Interest rate is required" }).min(0),
  interestRateFrequencyType: z.number().int().optional(),
  amortizationType: z.number().int(),
  interestType: z.number().int(),
  interestCalculationPeriodType: z.number().int(),
  loanScheduleType: z.string().optional(),
  loanScheduleProcessingType: z.string().optional(),
  transactionProcessingStrategyCode: z.string().optional(),
  daysInYearType: z.number().int().optional(),
  daysInMonthType: z.number().int().optional(),
  isInterestRecalculationEnabled: z.boolean().optional(),
  paymentAllocation: z.array(z.unknown()).optional(),
  creditAllocation: z.array(z.unknown()).optional(),
  accountingRule: z.number().int().default(1),
  locale: z.string().default("en"),
  dateFormat: z.string().default("yyyy-MM-dd"),
});

export type CreateLoanProductFormValues = z.infer<typeof createLoanProductSchema>;

// ─── Loan Charge ─────────────────────────────────────────────────

export const createLoanChargeSchema = z.object({
  chargeId: z.number({ message: "Charge is required" }).int().positive(),
  amount: z.number({ message: "Amount is required" }).positive("Amount must be greater than 0"),
  dueDate: z.string().optional(),
});
export type CreateLoanChargeFormValues = z.infer<typeof createLoanChargeSchema>;

export const payLoanChargeSchema = z.object({
  transactionDate: z.string({ message: "Transaction date is required" }).min(1, "Transaction date is required"),
  amount: z.number().positive().optional(),
});
export type PayLoanChargeFormValues = z.infer<typeof payLoanChargeSchema>;

// ─── Loan Collateral ─────────────────────────────────────────────

export const createLoanCollateralSchema = z.object({
  collateralTypeId: z.number({ message: "Collateral type is required" }).int().positive(),
  value: z.number({ message: "Value is required" }).positive("Value must be greater than 0"),
  description: z.string().max(500).optional(),
});
export type CreateLoanCollateralFormValues = z.infer<typeof createLoanCollateralSchema>;

// ─── Loan Guarantor ──────────────────────────────────────────────

export const createLoanGuarantorSchema = z.object({
  clientId: z.number({ message: "Guarantor client is required" }).int().positive(),
  amount: z.number({ message: "Amount is required" }).positive("Amount must be greater than 0"),
});
export type CreateLoanGuarantorFormValues = z.infer<typeof createLoanGuarantorSchema>;

// ─── Loan Reschedule ─────────────────────────────────────────────

export const createRescheduleRequestSchema = z.object({
  loanId: z.number({ message: "Loan is required" }).int().positive(),
  rescheduleFromDate: z.string({ message: "Reschedule from date is required" }).min(1),
  rescheduleReasonId: z.number({ message: "Reason is required" }).int().positive(),
  submittedOnDate: z.string({ message: "Submitted date is required" }).min(1),
  adjustedDueDate: z.string().optional(),
  graceOnPrincipal: z.number().int().min(0).optional(),
  graceOnInterest: z.number().int().min(0).optional(),
  newInterestRate: z.number().min(0).optional(),
  extraTerms: z.number().int().min(0).optional(),
});
export type CreateRescheduleRequestFormValues = z.infer<typeof createRescheduleRequestSchema>;

// ─── Loan Transaction ────────────────────────────────────────────

export const createLoanTransactionSchema = z.object({
  transactionDate: z.string({ message: "Transaction date is required" }).min(1),
  transactionAmount: z.number().positive("Amount must be greater than 0").optional(),
  paymentTypeId: z.number().int().positive().optional(),
  note: z.string().max(500).optional(),
  receiptNumber: z.string().max(100).optional(),
  bankNumber: z.string().max(100).optional(),
  checkNumber: z.string().max(100).optional(),
  routingCode: z.string().max(100).optional(),
});
export type CreateLoanTransactionFormValues = z.infer<typeof createLoanTransactionSchema>;
