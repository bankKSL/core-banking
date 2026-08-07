import { z } from "zod";
import i18n from "@/i18n";

const createClientSchemaBase = z.object({
  firstname: z.string().max(100).optional().or(z.literal("")),
  middlename: z.string().max(100).optional().or(z.literal("")),
  lastname: z.string().max(100).optional().or(z.literal("")),
  fullname: z.string().max(200).optional().or(z.literal("")),

  officeId: z.number({ message: i18n.t("Office is required") }).int(),
  staffId: z.number().int().optional().nullable(),
  groupId: z.number().int().optional().nullable(),

  dateOfBirth: z.string().optional().or(z.literal("")),
  genderId: z.number().int().optional().nullable(),
  legalFormId: z.number().int().optional().nullable(),

  externalId: z.string().max(100).optional().or(z.literal("")),
  savingsProductId: z.number().int().optional().nullable(),

  mobileNo: z
    .string()
    .max(50)
    .regex(/^\+?[0-9]{7,15}$/, i18n.t("Mobile number must be 7-15 digits, optional leading +"))
    .optional()
    .or(z.literal("")),
  emailAddress: z.string().email(i18n.t("Please enter a valid email address")).max(100).optional().or(z.literal("")),

  activationDate: z.string().optional().or(z.literal("")),
  submittedOnDate: z.string().optional().or(z.literal("")),
  active: z.boolean().optional(),

  accountNo: z.string().max(20).optional().or(z.literal("")),
  isStaff: z.boolean().optional(),
  clientTypeId: z.number().int().optional().nullable(),
  clientClassificationId: z.number().int().optional().nullable(),

  clientNonPersonDetails: z
    .object({
      constitutionId: z.number().int().optional().nullable(),
      incorpNumber: z.string().max(50).optional().or(z.literal("")),
      mainBusinessLineId: z.number().int().optional().nullable(),
      remarks: z.string().max(150).optional().or(z.literal("")),
      incorpValidityTillDate: z.string().optional().or(z.literal("")),
    })
    .optional()
    .nullable(),

  dateFormat: z.string(),
  locale: z.string(),
});

export const createClientSchema = createClientSchemaBase.superRefine((data, ctx) => {
  const isEntity = data.legalFormId === 2;

  if (isEntity) {
    if (!data.fullname || data.fullname.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: i18n.t("Full name is required for organizations"),
        path: ["fullname"],
      });
    }
  } else {
    if (!data.firstname || data.firstname.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: i18n.t("First name is required"),
        path: ["firstname"],
      });
    }
    if (!data.lastname || data.lastname.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: i18n.t("Last name is required"),
        path: ["lastname"],
      });
    }
  }

  if (data.active === true && (!data.activationDate || data.activationDate.trim() === "")) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: i18n.t("Activation date is required when the client is active"),
      path: ["activationDate"],
    });
  }
});

export type CreateClientFormValues = z.infer<typeof createClientSchema>;

export const editClientSchema = createClientSchemaBase.partial();
export type EditClientFormValues = z.infer<typeof editClientSchema>;

export const activateClientSchema = z.object({
  activationDate: z.string().min(1, i18n.t("activationDate is required")),
  dateFormat: z.string().optional(),
  locale: z.string().optional(),
});
export type ActivateClientFormValues = z.infer<typeof activateClientSchema>;

export const closeClientSchema = z.object({
  closureDate: z.string().min(1, i18n.t("closureDate is required")),
  closureReasonId: z.number().int().positive(i18n.t("closureReasonId is required")),
  dateFormat: z.string().optional(),
  locale: z.string().optional(),
});
export type CloseClientFormValues = z.infer<typeof closeClientSchema>;

export const rejectClientSchema = z.object({
  rejectionDate: z.string().min(1, i18n.t("rejectionDate is required")),
  rejectionReasonId: z.number().int().positive(i18n.t("rejectionReasonId is required")),
  dateFormat: z.string().optional(),
  locale: z.string().optional(),
});
export type RejectClientFormValues = z.infer<typeof rejectClientSchema>;

export const withdrawClientSchema = z.object({
  withdrawalDate: z.string().min(1, i18n.t("withdrawalDate is required")),
  withdrawalReasonId: z.number().int().positive(i18n.t("withdrawalReasonId is required")),
  dateFormat: z.string().optional(),
  locale: z.string().optional(),
});
export type WithdrawClientFormValues = z.infer<typeof withdrawClientSchema>;

export const reactivateClientSchema = z.object({
  reactivationDate: z.string().min(1, i18n.t("reactivationDate is required")),
  dateFormat: z.string().optional(),
  locale: z.string().optional(),
});
export type ReactivateClientFormValues = z.infer<typeof reactivateClientSchema>;

export const reopenedDateSchema = z.object({
  reopenedDate: z.string().min(1, i18n.t("reopenedDate is required")),
  dateFormat: z.string().optional(),
  locale: z.string().optional(),
});
export type UndoRejectClientFormValues = z.infer<typeof reopenedDateSchema>;
export type UndoWithdrawClientFormValues = z.infer<typeof reopenedDateSchema>;
