import { z } from "zod";

export const partySearchSchema = z.object({
  idType: z.string().min(1, "Identifier type is required"),
  idValue: z.string().min(1, "Identifier value is required"),
  subIdOrType: z.string().optional().or(z.literal("")),
});

export type PartySearchFormValues = z.infer<typeof partySearchSchema>;

export const registerIdentifierSchema = z.object({
  idType: z.string().min(1, "Identifier type is required"),
  idValue: z.string().min(1, "Identifier value is required"),
  accountId: z.string().min(1, "Account external ID is required"),
  subIdOrType: z.string().optional().or(z.literal("")),
});

export type RegisterIdentifierFormValues = z.infer<typeof registerIdentifierSchema>;

export const deleteIdentifierSchema = z.object({
  idType: z.string().min(1, "Identifier type is required"),
  idValue: z.string().min(1, "Identifier value is required"),
  subIdOrType: z.string().optional().or(z.literal("")),
});

export type DeleteIdentifierFormValues = z.infer<typeof deleteIdentifierSchema>;

export const transactionRequestSchema = z.object({
  transactionCode: z.string().min(1, "Transaction code is required"),
  requestCode: z.string().min(1, "Request code is required"),
  accountId: z.string().min(1, "Account ID is required"),
  amount: z.string().min(1, "Amount is required"),
  currency: z.string().min(1, "Currency is required"),
  transactionRole: z.string().min(1, "Role is required"),
  scenario: z.string().min(1, "Scenario is required"),
  initiator: z.string().min(1, "Initiator is required"),
  initiatorType: z.string().min(1, "Initiator type is required"),
  note: z.string().optional().or(z.literal("")),
});

export type TransactionRequestFormValues = z.infer<typeof transactionRequestSchema>;

export const quoteSchema = z.object({
  transactionCode: z.string().min(1, "Transaction code is required"),
  quoteCode: z.string().min(1, "Quote code is required"),
  accountId: z.string().min(1, "Account ID is required"),
  amount: z.string().min(1, "Amount is required"),
  currency: z.string().min(1, "Currency is required"),
  transactionRole: z.string().min(1, "Role is required"),
  scenario: z.string().min(1, "Scenario is required"),
  initiator: z.string().min(1, "Initiator is required"),
  initiatorType: z.string().min(1, "Initiator type is required"),
  note: z.string().optional().or(z.literal("")),
});

export type QuoteFormValues = z.infer<typeof quoteSchema>;

export const transferSchema = z.object({
  transactionCode: z.string().min(1, "Transaction code is required"),
  transferCode: z.string().min(1, "Transfer code is required"),
  accountId: z.string().min(1, "Account ID is required"),
  amount: z.string().min(1, "Amount is required"),
  currency: z.string().min(1, "Currency is required"),
  transactionRole: z.string().min(1, "Role is required"),
  scenario: z.string().min(1, "Scenario is required"),
  initiator: z.string().min(1, "Initiator is required"),
  initiatorType: z.string().min(1, "Initiator type is required"),
  fspFee: z.string().optional().or(z.literal("")),
  fspCommission: z.string().optional().or(z.literal("")),
  note: z.string().optional().or(z.literal("")),
});

export type TransferFormValues = z.infer<typeof transferSchema>;

export const loanDisburseSchema = z.object({
  accountId: z.string().min(1, "Account ID is required"),
  transactionAmount: z.string().min(1, "Amount is required"),
});

export type LoanDisburseFormValues = z.infer<typeof loanDisburseSchema>;

export const loanRepaymentSchema = z.object({
  accountId: z.string().min(1, "Account ID is required"),
  transactionAmount: z.string().min(1, "Amount is required"),
  paymentTypeId: z.string().min(1, "Payment type is required"),
});

export type LoanRepaymentFormValues = z.infer<typeof loanRepaymentSchema>;

export const accountSearchSchema = z.object({
  accountId: z.string().min(1, "Account external ID is required"),
});

export type AccountSearchFormValues = z.infer<typeof accountSearchSchema>;
