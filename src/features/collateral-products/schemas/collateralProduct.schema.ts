import { z } from "zod";

export const createCollateralProductSchema = z.object({
  name: z.string().min(1, "Name is required").max(20, "Max 20 characters"),
  quality: z.string().min(1, "Quality is required").max(40, "Max 40 characters"),
  basePrice: z.number({ message: "Base price is required" }).positive("Must be positive"),
  pctToBase: z.number({ message: "Pct to base is required" }).positive("Must be positive"),
  unitType: z.string().min(1, "Unit type is required").max(10, "Max 10 characters"),
  currency: z.string().min(1, "Currency is required"),
});

export const updateCollateralProductSchema = z.object({
  name: z.string().max(20, "Max 20 characters").optional().or(z.literal("")),
  quality: z.string().max(40, "Max 40 characters").optional().or(z.literal("")),
  basePrice: z.number({ message: "Base price is required" }).positive("Must be positive").optional(),
  pctToBase: z.number({ message: "Pct to base is required" }).positive("Must be positive").optional(),
  unitType: z.string().max(10, "Max 10 characters").optional().or(z.literal("")),
  currency: z.string().optional().or(z.literal("")),
});

export type CreateCollateralProductFormValues = z.infer<typeof createCollateralProductSchema>;
export type UpdateCollateralProductFormValues = z.infer<typeof updateCollateralProductSchema>;
