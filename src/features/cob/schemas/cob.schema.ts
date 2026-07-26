import { z } from "zod";

export const updateStepsSchema = z.object({
  jobName: z.string().min(1, "Job name is required"),
  businessSteps: z
    .array(
      z.object({
        stepName: z.string().min(1, "Step name is required"),
        order: z.number().int().positive("Order must be positive"),
      }),
    )
    .min(1, "At least one step is required"),
});

export type UpdateStepsFormValues = z.infer<typeof updateStepsSchema>;
