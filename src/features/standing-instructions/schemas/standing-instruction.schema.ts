import { z } from "zod";
import i18n from "@/i18n";

const apiFields = {
  fromOfficeId: z.number({ message: i18n.t("From office is required") }).int(),
  fromClientId: z.number({ message: i18n.t("From client is required") }).int(),
  fromAccountType: z.number({ message: i18n.t("From account type is required") }).int(),
  fromAccountId: z.number({ message: i18n.t("From account is required") }).int(),
  toOfficeId: z.number({ message: i18n.t("To office is required") }).int(),
  toClientId: z.number({ message: i18n.t("To client is required") }).int(),
  toAccountType: z.number({ message: i18n.t("To account type is required") }).int(),
  toAccountId: z.number({ message: i18n.t("To account is required") }).int(),
  transferType: z.number({ message: i18n.t("Transfer type is required") }).int(),
  instructionType: z.number({ message: i18n.t("Instruction type is required") }).int(),
  priority: z.number({ message: i18n.t("Priority is required") }).int(),
  status: z.number({ message: i18n.t("Status is required") }).int(),
  recurrenceType: z.number({ message: i18n.t("Recurrence type is required") }).int(),
  recurrenceFrequency: z.number().int().optional().nullable(),
  amount: z.coerce.number().positive().optional().nullable(),
  recurrenceInterval: z.coerce.number().int().positive().optional().nullable(),
  dateFormat: z.string().default("dd MMMM yyyy"),
  locale: z.string().default("en"),
  monthDayFormat: z.string().default("dd MMMM"),
};

export const standingInstructionFormSchema = z.object({
  name: z.string().min(1, i18n.t("Name is required")),
  validFrom: z.string().min(1, i18n.t("Valid from date is required")),
  validTill: z.string().optional().or(z.literal("")),
  amount: z.string().optional(),
  recurrenceInterval: z.string().optional(),
  recurrenceOnMonthDay: z.string().optional().or(z.literal("")),
});

export const createStandingInstructionSchema = standingInstructionFormSchema.merge(z.object(apiFields)).superRefine((data, ctx) => {
  if (data.instructionType === 1 && (data.amount == null || data.amount <= 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: i18n.t("Amount is required for fixed instructions"),
      path: ["amount"],
    });
  }

  if (data.instructionType === 2 && data.amount != null) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: i18n.t("Amount must be empty for dues instructions"),
      path: ["amount"],
    });
  }

  if (data.recurrenceType === 1 && (data.recurrenceFrequency == null || data.recurrenceInterval == null)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: i18n.t("Recurrence frequency and interval are required for periodic recurrence"),
      path: ["recurrenceFrequency"],
    });
  }

  if (data.fromAccountType === 1 && data.toAccountType === 1 && data.transferType !== 1) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: i18n.t("Savings-to-savings transfers must use account transfer type"),
      path: ["transferType"],
    });
  }

  if (data.validTill && data.validTill <= data.validFrom) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: i18n.t("Valid till must be after valid from"),
      path: ["validTill"],
    });
  }
});

export const updateStandingInstructionSchema = z.object(apiFields).partial();

export type StandingInstructionFormValues = z.infer<typeof standingInstructionFormSchema>;
export type CreateStandingInstructionFormValues = z.infer<typeof createStandingInstructionSchema>;
export type UpdateStandingInstructionFormValues = z.infer<typeof updateStandingInstructionSchema>;
