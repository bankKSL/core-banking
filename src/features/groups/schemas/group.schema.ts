import { z } from "zod";

/**
 * Create-group form schema.
 * Fineract rule: when `active` is true, `activationDate` is mandatory.
 */
export const createGroupSchema = z
  .object({
    name: z.string({ message: "Group name is required" }).min(1, "Group name is required").max(100),
    officeId: z.number({ message: "Office is required" }).int().positive("Office is required"),
    externalId: z.string().max(100).optional().or(z.literal("")),
    active: z.boolean().default(true),
    activationDate: z.string().optional().or(z.literal("")),
    dateFormat: z.string().default("yyyy-MM-dd"),
    locale: z.string().default("en"),
  })
  .superRefine((values, ctx) => {
    if (values.active && !values.activationDate) {
      ctx.addIssue({
        code: "custom",
        path: ["activationDate"],
        message: "Activation date is required when the group is active",
      });
    }
  });

export type CreateGroupFormValues = z.infer<typeof createGroupSchema>;

/** Edit-group form schema — only the name is editable */
export const updateGroupSchema = z.object({
  name: z.string({ message: "Group name is required" }).min(1, "Group name is required").max(100),
});

export type UpdateGroupFormValues = z.infer<typeof updateGroupSchema>;

/** Activate-group form schema (pending groups in edit mode) */
export const activateGroupSchema = z.object({
  activationDate: z.string({ message: "Activation date is required" }).min(1, "Activation date is required"),
});

export type ActivateGroupFormValues = z.infer<typeof activateGroupSchema>;
