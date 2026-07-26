import { z } from "zod";

export const createNoteSchema = z.object({
  note: z
    .string()
    .min(1, "Note content is required")
    .max(1000, "Note must be at most 1000 characters"),
});

export const editNoteSchema = z.object({
  note: z
    .string()
    .min(1, "Note content is required")
    .max(1000, "Note must be at most 1000 characters"),
});

export type CreateNoteFormValues = z.infer<typeof createNoteSchema>;
export type EditNoteFormValues = z.infer<typeof editNoteSchema>;
