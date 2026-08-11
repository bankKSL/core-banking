import { z } from "zod";
import i18n from "@/i18n";

const minimumPaymentPeriodAndRuleSchema = z.object({
  frequency: z.number({ message: i18n.t("Frequency is required") }).int(i18n.t("Must be an integer")).positive(i18n.t("Must be positive")),
  frequencyType: z.string({ message: i18n.t("Frequency type is required") }).min(1, i18n.t("Frequency type is required")),
  minimumPayment: z.number({ message: i18n.t("Minimum payment is required") }).positive(i18n.t("Must be greater than 0")),
  minimumPaymentType: z.string({ message: i18n.t("Minimum payment type is required") }).min(1, i18n.t("Minimum payment type is required")),
});

export const delinquencyBucketSchema = z
  .object({
    name: z.string({ message: i18n.t("Name is required") }).min(1, i18n.t("Name is required")).max(100, i18n.t("Max 100 characters")),
    ranges: z.array(z.number()).min(1, i18n.t("At least one range is required")),
    bucketType: z.string({ message: i18n.t("Bucket type is required") }).min(1, i18n.t("Bucket type is required")),
    minimumPaymentPeriodAndRule: minimumPaymentPeriodAndRuleSchema.optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.bucketType === "WORKING_CAPITAL") {
      const rule = data.minimumPaymentPeriodAndRule;
      if (!rule) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: i18n.t("Minimum payment rule is required for Working Capital buckets"),
          path: ["minimumPaymentPeriodAndRule"],
        });
        return;
      }
      if (rule.frequency == null) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: i18n.t("Frequency is required"), path: ["minimumPaymentPeriodAndRule", "frequency"] });
      }
      if (!rule.frequencyType) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: i18n.t("Frequency type is required"), path: ["minimumPaymentPeriodAndRule", "frequencyType"] });
      }
      if (rule.minimumPayment == null || rule.minimumPayment <= 0) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: i18n.t("Minimum payment must be greater than 0"), path: ["minimumPaymentPeriodAndRule", "minimumPayment"] });
      }
      if (!rule.minimumPaymentType) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: i18n.t("Minimum payment type is required"), path: ["minimumPaymentPeriodAndRule", "minimumPaymentType"] });
      }
    }
  });

export type DelinquencyBucketFormValues = z.infer<typeof delinquencyBucketSchema>;
