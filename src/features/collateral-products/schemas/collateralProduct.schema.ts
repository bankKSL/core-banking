import { z } from "zod";
import i18n from "@/i18n";

export const createCollateralProductSchema = z.object({
  name: z.string().min(1, i18n.t("Name is required")).max(20, i18n.t("Max 20 characters")),
  quality: z.string().min(1, i18n.t("Quality is required")).max(40, i18n.t("Max 40 characters")),
  basePrice: z.number({ message: i18n.t("Base price is required") }).positive(i18n.t("Must be positive")),
  pctToBase: z.number({ message: i18n.t("Pct to base is required") }).positive(i18n.t("Must be positive")).max(100, i18n.t("Max 100%")),
  unitType: z.string().min(1, i18n.t("Unit type is required")).max(10, i18n.t("Max 10 characters")),
  currency: z.string().min(1, i18n.t("Currency is required")),
});

export const updateCollateralProductSchema = z.object({
  name: z.string().max(20, i18n.t("Max 20 characters")).optional().or(z.literal("")),
  quality: z.string().max(40, i18n.t("Max 40 characters")).optional().or(z.literal("")),
  basePrice: z.number({ message: i18n.t("Base price is required") }).positive(i18n.t("Must be positive")).optional(),
  pctToBase: z.number({ message: i18n.t("Pct to base is required") }).positive(i18n.t("Must be positive")).max(100, i18n.t("Max 100%")).optional(),
  unitType: z.string().max(10, i18n.t("Max 10 characters")).optional().or(z.literal("")),
  currency: z.string().optional().or(z.literal("")),
});

export type CreateCollateralProductFormValues = z.infer<typeof createCollateralProductSchema>;
export type UpdateCollateralProductFormValues = z.infer<typeof updateCollateralProductSchema>;
