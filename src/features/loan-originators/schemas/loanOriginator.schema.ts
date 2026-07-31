import { z } from "zod";

export const loanOriginatorStatusSchema = z.enum(["ACTIVE", "PENDING", "INACTIVE"]);

// POST /v1/loan-originators
export const createLoanOriginatorSchema = z
  .object({
    externalId: z.string({ message: "External ID is required" }).min(1, "External ID is required").max(100, "Max 100 characters"),
    name: z.string().max(255, "Max 255 characters").optional(),
    status: loanOriginatorStatusSchema.optional(),
    originatorTypeId: z.number().int().positive().nullable().optional(),
    channelTypeId: z.number().int().positive().nullable().optional(),
  })
  .strict();

// PUT /v1/loan-originators/{id}
export const updateLoanOriginatorSchema = z
  .object({
    name: z.string().max(255, "Max 255 characters").optional(),
    status: loanOriginatorStatusSchema.optional(),
    originatorTypeId: z.number().int().positive().nullable().optional(),
    channelTypeId: z.number().int().positive().nullable().optional(),
  })
  .strict()
  .refine((v) => Object.keys(v).length > 0, { message: "At least one field must be provided" });

// one element of the originators[] array inside POST /v1/loans
export const loanApplicationOriginatorSchema = z
  .object({
    id: z.number().int().positive().nullable().optional(),
    externalId: z.string().min(1).max(100).nullable().optional(),
    name: z.string().max(255, "Max 255 characters").nullable().optional(),
    originatorTypeId: z.number().int().positive().nullable().optional(),
    channelTypeId: z.number().int().positive().nullable().optional(),
  })
  .strict()
  .refine((v) => v.id != null || (v.externalId != null && v.externalId.length > 0), {
    message: "Either 'id' or 'externalId' must be provided for originator",
  });

export const loanOriginatorsArraySchema = z.array(loanApplicationOriginatorSchema);

export type CreateLoanOriginatorFormValues = z.infer<typeof createLoanOriginatorSchema>;
export type UpdateLoanOriginatorFormValues = z.infer<typeof updateLoanOriginatorSchema>;
export type LoanApplicationOriginatorFormValues = z.infer<typeof loanApplicationOriginatorSchema>;
