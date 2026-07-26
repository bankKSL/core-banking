import { z } from "zod";

export const updateConfigSchema = z.object({
  enabled: z.boolean().optional(),
  value: z.number().min(0).optional(),
  dateValue: z.string().optional().or(z.literal("")),
  stringValue: z.string().optional().or(z.literal("")),
});

export type UpdateConfigFormValues = z.infer<typeof updateConfigSchema>;

export const updateBusinessDateSchema = z.object({
  type: z.string().min(1, "Type is required"),
  date: z.string().min(1, "Date is required"),
});

export type UpdateBusinessDateFormValues = z.infer<typeof updateBusinessDateSchema>;
