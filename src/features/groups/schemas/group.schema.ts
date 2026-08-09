import { z } from "zod";
import i18n from "@/i18n";

/**
 * Create-group form schema.
 * Fineract rule: when `active` is true, `activationDate` is mandatory.
 */
export const createGroupSchema = z
  .object({
    name: z.string({ message: i18n.t("Group name is required") }).min(1, i18n.t("Group name is required")).max(100),
    officeId: z.number({ message: i18n.t("Office is required") }).int().positive(i18n.t("Office is required")),
    staffId: z.number().optional().or(z.literal("")),
    clientMembers: z.array(z.number()).optional().default([]),
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
        message: i18n.t("Activation date is required when the group is active"),
      });
    }
  });

export type CreateGroupFormValues = z.infer<typeof createGroupSchema>;

/** Edit-group form schema — only the name is editable */
export const updateGroupSchema = z.object({
  name: z.string({ message: i18n.t("Group name is required") }).min(1, i18n.t("Group name is required")).max(100),
});

export type UpdateGroupFormValues = z.infer<typeof updateGroupSchema>;

/** Activate-group form schema (pending groups in edit mode) */
export const activateGroupSchema = z.object({
  activationDate: z.string({ message: i18n.t("Activation date is required") }).min(1, i18n.t("Activation date is required")),
});

export type ActivateGroupFormValues = z.infer<typeof activateGroupSchema>;
