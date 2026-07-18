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

/** Schema for savings product creation — matches Fineract POST /savingsproducts */
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
    dateFormat: z.string().default("dd MMMM yyyy"),
});

export type CreateSavingsProductFormValues = z.infer<typeof createSavingsProductSchema>;
