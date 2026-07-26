import { z } from "zod";

export const createDocumentSchema = z.object({
  name: z.string().min(1, "Name is required").max(250, "Name must be at most 250 characters"),
  description: z.string().max(250, "Description must be at most 250 characters").optional().or(z.literal("")),
});

export const editDocumentSchema = z.object({
  name: z.string().min(1, "Name is required").max(250, "Name must be at most 250 characters"),
  description: z.string().max(250, "Description must be at most 250 characters").optional().or(z.literal("")),
});

export type CreateDocumentFormValues = z.infer<typeof createDocumentSchema>;
export type EditDocumentFormValues = z.infer<typeof editDocumentSchema>;
