import { z } from "zod";

const apiFields = {
  fromOfficeId: z.number({ message: "From office is required" }).int(),
  fromClientId: z.number({ message: "From client is required" }).int(),
  fromAccountType: z.number({ message: "From account type is required" }).int(),
  fromAccountId: z.number({ message: "From account is required" }).int(),
  toOfficeId: z.number({ message: "To office is required" }).int(),
  toClientId: z.number({ message: "To client is required" }).int(),
  toAccountType: z.number({ message: "To account type is required" }).int(),
  toAccountId: z.number({ message: "To account is required" }).int(),
  transferType: z.number({ message: "Transfer type is required" }).int(),
  instructionType: z.number({ message: "Instruction type is required" }).int(),
  priority: z.number({ message: "Priority is required" }).int(),
  status: z.number({ message: "Status is required" }).int(),
  recurrenceType: z.number({ message: "Recurrence type is required" }).int(),
  recurrenceFrequency: z.number().int().optional().nullable(),
  amount: z.coerce.number().positive().optional().nullable(),
  recurrenceInterval: z.coerce.number().int().positive().optional().nullable(),
  dateFormat: z.string().default("dd MMMM yyyy"),
  locale: z.string().default("en"),
  monthDayFormat: z.string().default("dd MMMM"),
};

export const standingInstructionFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  validFrom: z.string().min(1, "Valid from date is required"),
  validTill: z.string().optional().or(z.literal("")),
  amount: z.string().optional(),
  recurrenceInterval: z.string().optional(),
  recurrenceOnMonthDay: z.string().optional().or(z.literal("")),
});

export const createStandingInstructionSchema = standingInstructionFormSchema.merge(z.object(apiFields)).superRefine((data, ctx) => {
  if (data.instructionType === 1 && (data.amount == null || data.amount <= 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Amount is required for fixed instructions",
      path: ["amount"],
    });
  }

  if (data.instructionType === 2 && data.amount != null) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Amount must be empty for dues instructions",
      path: ["amount"],
    });
  }

  if (data.recurrenceType === 1 && (data.recurrenceFrequency == null || data.recurrenceInterval == null)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Recurrence frequency and interval are required for periodic recurrence",
      path: ["recurrenceFrequency"],
    });
  }

  if (data.fromAccountType === 1 && data.toAccountType === 1 && data.transferType !== 1) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Savings-to-savings transfers must use account transfer type",
      path: ["transferType"],
    });
  }

  if (data.validTill && data.validTill <= data.validFrom) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Valid till must be after valid from",
      path: ["validTill"],
    });
  }
});

export const updateStandingInstructionSchema = z.object(apiFields).partial();

export type StandingInstructionFormValues = z.infer<typeof standingInstructionFormSchema>;
export type CreateStandingInstructionFormValues = z.infer<typeof createStandingInstructionSchema>;
export type UpdateStandingInstructionFormValues = z.infer<typeof updateStandingInstructionSchema>;
