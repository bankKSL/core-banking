import { z } from "zod";
import i18n from "@/i18n";

export const createDelinquencyRangeSchema = z
  .object({
    classification: z.string({ message: i18n.t("Classification is required") }).min(1, i18n.t("Classification is required")).max(100, i18n.t("Max 100 characters")),
    minimumAgeDays: z.number({ message: i18n.t("Minimum age days is required") }).int(i18n.t("Must be an integer")).min(0, i18n.t("Must be 0 or greater")),
    maximumAgeDays: z.number().int(i18n.t("Must be an integer")).positive(i18n.t("Must be greater than 0")).optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.maximumAgeDays != null && data.maximumAgeDays < data.minimumAgeDays) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: i18n.t("Maximum age days must be greater than or equal to minimum age days"),
        path: ["maximumAgeDays"],
      });
    }
  });

export const updateDelinquencyRangeSchema = createDelinquencyRangeSchema;

export type CreateDelinquencyRangeFormValues = z.infer<typeof createDelinquencyRangeSchema>;
export type UpdateDelinquencyRangeFormValues = z.infer<typeof updateDelinquencyRangeSchema>;
