import { z } from "zod";

export const createLoanSchema = z
  .object({
    clientId: z.number({ message: "Client is required" }).int().positive("Client is required"),
    productId: z.number({ message: "Loan product is required" }).int().positive("Loan product is required"),
    principal: z.number({ message: "Principal amount is required" }).positive("Principal must be greater than 0"),
    loanTermFrequency: z.number({ message: "Term is required" }).int().positive(),
    loanTermFrequencyType: z.number().int().min(0).max(3),
    numberOfRepayments: z.number({ message: "Number of repayments is required" }).int().positive(),
    repaymentEvery: z.number({ message: "Repayment frequency is required" }).int().positive(),
    repaymentFrequencyType: z.number().int().min(0).max(3),
    interestRatePerPeriod: z.number({ message: "Interest rate is required" }).min(0),
    interestRateFrequencyType: z.number().int().optional(),
    interestType: z.number().int().optional(),
    amortizationType: z.number().int().optional(),
    interestCalculationPeriodType: z.number().int().optional(),
    expectedDisbursementDate: z.string({ message: "Disbursement date is required" }).min(1),
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
    allowPartialPeriodInterestCalculation: z.boolean().optional(),
    maxOutstandingLoanBalance: z.number().optional(),
    dateFormat: z.string().default("yyyy-MM-dd"),
    locale: z.string().default("en"),
    charges: z.array(z.object({ chargeId: z.number(), amount: z.number() })).optional(),
  })
  .superRefine((data, ctx) => {
    // Cross-field rules (doc §8/§11): term & repayment frequency types must match
    if (data.loanTermFrequencyType !== data.repaymentFrequencyType) {
      ctx.addIssue({
        code: "custom",
        path: ["loanTermFrequencyType"],
        message: "Loan term frequency type must match repayment frequency type",
      });
      ctx.addIssue({
        code: "custom",
        path: ["repaymentFrequencyType"],
        message: "Repayment frequency type must match loan term frequency type",
      });
    }
    // loanTermFrequency must equal repaymentEvery × numberOfRepayments
    const impliedTerm = data.repaymentEvery * data.numberOfRepayments;
    if (data.loanTermFrequency !== impliedTerm) {
      ctx.addIssue({
        code: "custom",
        path: ["loanTermFrequency"],
        message: `Loan term must equal repayment frequency × number of repayments (${impliedTerm})`,
      });
    }
    // submittedOnDate ≤ expectedDisbursementDate
    if (data.submittedOnDate && data.expectedDisbursementDate && data.submittedOnDate > data.expectedDisbursementDate) {
      ctx.addIssue({
        code: "custom",
        path: ["submittedOnDate"],
        message: "Submitted on date cannot be after the expected disbursement date",
      });
    }
    // grace periods must be < numberOfRepayments
    if (data.graceOnPrincipalPayment != null && data.graceOnPrincipalPayment >= data.numberOfRepayments) {
      ctx.addIssue({
        code: "custom",
        path: ["graceOnPrincipalPayment"],
        message: "Grace on principal payment must be less than number of repayments",
      });
    }
    if (data.graceOnInterestPayment != null && data.graceOnInterestPayment >= data.numberOfRepayments) {
      ctx.addIssue({
        code: "custom",
        path: ["graceOnInterestPayment"],
        message: "Grace on interest payment must be less than number of repayments",
      });
    }
    if (data.graceOnInterestCharged != null && data.graceOnInterestCharged >= data.numberOfRepayments) {
      ctx.addIssue({
        code: "custom",
        path: ["graceOnInterestCharged"],
        message: "Grace on interest charged must be less than number of repayments",
      });
    }
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

export const createRescheduleRequestSchema = z
  .object({
    loanId: z.number({ message: "Loan is required" }).int().positive(),
    rescheduleFromDate: z.string({ message: "Reschedule from date is required" }).min(1),
    rescheduleReasonId: z.number({ message: "Reason is required" }).int().positive(),
    submittedOnDate: z.string({ message: "Submitted date is required" }).min(1),
    rescheduleReasonComment: z.string().max(500).optional(),
    adjustedDueDate: z.string().optional(),
    graceOnPrincipal: z.number().int().min(1).optional(),
    graceOnInterest: z.number().int().min(1).optional(),
    newInterestRate: z.number().min(0).optional(),
    extraTerms: z.number().int().min(1).optional(),
    emi: z.number().positive().optional(),
    endDate: z.string().optional(),
    recalculateInterest: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    const hasChange =
      (data.graceOnPrincipal != null && data.graceOnPrincipal > 0) ||
      (data.graceOnInterest != null && data.graceOnInterest > 0) ||
      (data.extraTerms != null && data.extraTerms > 0) ||
      (data.newInterestRate != null && data.newInterestRate > 0) ||
      (data.adjustedDueDate != null && data.adjustedDueDate.length > 0) ||
      (data.emi != null && data.emi > 0);

    if (!hasChange) {
      ctx.addIssue({
        code: "custom",
        path: ["graceOnPrincipal"],
        message: "At least one change (grace, extra terms, interest rate, due date, or EMI) must be provided",
      });
    }

    if (data.emi != null && data.emi > 0 && (!data.endDate || data.endDate.length === 0)) {
      ctx.addIssue({
        code: "custom",
        path: ["endDate"],
        message: "End date is required when EMI is specified",
      });
    }

    if (data.endDate && data.endDate.length > 0 && (data.emi == null || data.emi <= 0)) {
      ctx.addIssue({
        code: "custom",
        path: ["emi"],
        message: "EMI amount is required when end date is specified",
      });
    }
  });
export type CreateRescheduleRequestFormValues = z.infer<typeof createRescheduleRequestSchema>;

// ─── Loan Transaction ────────────────────────────────────────────

export const createLoanTransactionSchema = z.object({
  transactionDate: z.string({ message: "Transaction date is required" }).min(1),
  transactionAmount: z.number().positive("Amount must be greater than 0").optional(),
  paymentTypeId: z.number().int().positive().optional(),
  // doc §15.3: notes (state and transaction) are capped at 1000 chars.
  note: z.string().max(1000).optional(),
  receiptNumber: z.string().max(50).optional(),
  bankNumber: z.string().max(50).optional(),
  checkNumber: z.string().max(50).optional(),
  routingCode: z.string().max(50).optional(),
});
export type CreateLoanTransactionFormValues = z.infer<typeof createLoanTransactionSchema>;
