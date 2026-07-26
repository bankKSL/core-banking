import { z } from "zod";

export const createOwnerSchema = z.object({
  ownerExternalId: z.string().min(1, "Owner external ID is required").max(100, "Max 100 characters"),
});

export type CreateOwnerFormValues = z.infer<typeof createOwnerSchema>;

export const saleTransferSchema = z.object({
  ownerExternalId: z.string().min(1, "Owner external ID is required").max(100, "Max 100 characters"),
  settlementDate: z.string().min(1, "Settlement date is required"),
  purchasePriceRatio: z.string().min(1, "Purchase price ratio is required").max(50, "Max 50 characters"),
  transferExternalId: z.string().max(100, "Max 100 characters").optional().or(z.literal("")),
  transferExternalGroupId: z.string().max(100, "Max 100 characters").optional().or(z.literal("")),
});

export type SaleTransferFormValues = z.infer<typeof saleTransferSchema>;

export const buybackTransferSchema = z.object({
  settlementDate: z.string().min(1, "Settlement date is required"),
  transferExternalId: z.string().max(100, "Max 100 characters").optional().or(z.literal("")),
});

export type BuybackTransferFormValues = z.infer<typeof buybackTransferSchema>;

export const searchTransferSchema = z.object({
  text: z.string().optional().or(z.literal("")),
  settlementDateFrom: z.string().optional().or(z.literal("")),
  settlementDateTo: z.string().optional().or(z.literal("")),
  effectiveDateFrom: z.string().optional().or(z.literal("")),
  effectiveDateTo: z.string().optional().or(z.literal("")),
});

export type SearchTransferFormValues = z.infer<typeof searchTransferSchema>;

export const createLoanProductAttributeSchema = z.object({
  attributeKey: z.string().min(1, "Attribute key is required"),
  attributeValue: z.string().min(1, "Attribute value is required"),
});

export type CreateLoanProductAttributeFormValues = z.infer<typeof createLoanProductAttributeSchema>;
