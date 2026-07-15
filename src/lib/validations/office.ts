import { z } from "zod";

/** Create office form schema */
export const officeCreateSchema = z.object({
    name: z
        .string()
        .min(2, "Office name must be at least 2 characters")
        .max(100, "Office name must be at most 100 characters"),
    parentId: z.number().int().positive().optional(),
    openingDate: z.string().min(1, "Opening date is required"),
    externalId: z.string().max(100).optional(),
});

/** Update office form schema */
export const officeUpdateSchema = z.object({
    name: z
        .string()
        .min(2, "Office name must be at least 2 characters")
        .max(100, "Office name must be at most 100 characters")
        .optional(),
    parentId: z.number().int().positive().optional(),
    openingDate: z.string().optional(),
    externalId: z.string().max(100).optional(),
});

export type OfficeCreateFormData = z.infer<typeof officeCreateSchema>;
export type OfficeUpdateFormData = z.infer<typeof officeUpdateSchema>;
