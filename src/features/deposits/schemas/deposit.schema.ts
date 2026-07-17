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

/** Schema for savings product creation */
export const createSavingsProductSchema = z.object({
    name: z.string().min(1, "Name is required").max(100),
    shortName: z.string().max(20).optional(),
    description: z.string().max(500).optional(),
    currencyCode: z.string().min(1, "Currency is required"),
    digitsAfterDecimal: z.number().int().min(0).default(2),
    nominalAnnualInterestRate: z.number({ message: "Interest rate is required" }).min(0),
    minRequiredOpeningBalance: z.number().min(0).optional(),
    lockinPeriodFrequency: z.number().int().positive().optional(),
    lockinPeriodFrequencyType: z.number().int().optional(),
    withdrawalFeeForTransfers: z.boolean().optional(),
    allowOverdraft: z.boolean().optional(),
    overdraftLimit: z.number().optional(),
    minRequiredBalance: z.number().optional(),
    enforceMinRequiredBalance: z.boolean().optional(),
    accountingRule: z.number().int().optional(),
    locale: z.string().default("en"),
    dateFormat: z.string().default("yyyy-MM-dd"),
});

export type CreateSavingsProductFormValues = z.infer<typeof createSavingsProductSchema>;
