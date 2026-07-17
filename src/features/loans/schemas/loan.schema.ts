import { z } from "zod";

export const createLoanSchema = z.object({
    clientId: z.number({ message: "Client is required" }).int(),
    productId: z.number({ message: "Loan product is required" }).int(),
    principal: z.number({ message: "Principal amount is required" }).positive("Principal must be greater than 0"),
    loanTermFrequency: z.number({ message: "Term is required" }).int().positive(),
    loanTermFrequencyType: z.number().int().min(0).max(3),
    numberOfRepayments: z.number({ message: "Number of repayments is required" }).int().positive(),
    repaymentEvery: z.number({ message: "Repayment frequency is required" }).int().positive(),
    repaymentFrequencyType: z.number().int().positive(),
    interestRatePerPeriod: z.number({ message: "Interest rate is required" }).min(0),
    expectedDisbursementDate: z.string({ message: "Disbursement date is required" }).min(1),
    submittedOnDate: z.string().min(1),
    transactionProcessingStrategyId: z.number().int().optional(),
    loanPurposeName: z.string().max(200).optional(),
    loanOfficerId: z.number().int().optional().nullable(),
    fundId: z.number().int().optional().nullable(),
    linkAccountId: z.number().int().optional().nullable(),
    externalId: z.string().max(100).optional(),
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
    currencyCode: z.string().min(1, "Currency is required"),
    digitsAfterDecimal: z.number().int().min(0).default(2),
    principal: z.number({ message: "Principal is required" }).positive(),
    minPrincipal: z.number().positive().optional(),
    maxPrincipal: z.number().positive().optional(),
    numberOfRepayments: z.number({ message: "Number of repayments is required" }).int().positive(),
    minNumberOfRepayments: z.number().int().positive().optional(),
    maxNumberOfRepayments: z.number().int().positive().optional(),
    repaymentEvery: z.number({ message: "Repayment frequency is required" }).int().positive(),
    repaymentFrequencyType: z.number().int().positive(),
    interestRatePerPeriod: z.number({ message: "Interest rate is required" }).min(0),
    minInterestRatePerPeriod: z.number().min(0).optional(),
    maxInterestRatePerPeriod: z.number().min(0).optional(),
    amortizationType: z.number().int(),
    interestType: z.number().int(),
    interestCalculationPeriodType: z.number().int(),
    transactionProcessingStrategyId: z.number().int().optional(),
    locale: z.string().default("en"),
    dateFormat: z.string().default("yyyy-MM-dd"),
});

export type CreateLoanProductFormValues = z.infer<typeof createLoanProductSchema>;
