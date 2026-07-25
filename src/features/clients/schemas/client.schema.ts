import { z } from "zod";

/**
 * Validation schema for creating a new Fineract client.
 * Matches Fineract's POST /api/v1/clients request body.
 *
 * Notes:
 * - Dates are sent as yyyy-MM-dd (HTML date input) with dateFormat="yyyy-MM-dd"
 * - firstname/lastname are required for Person (legalFormId=1); fullname for Entity
 * - Fineract default dateFormat is "yyyy-MM-dd" but we override for HTML compatibility
 */
/**
 * Base object schema (no conditional refine) — used by editClientSchema.partial()
 */
const createClientSchemaBase = z.object({
  // ── Personal ──────────────────────────────────────────────
  firstname: z.string().max(100).optional().or(z.literal("")),
  middlename: z.string().max(100).optional().or(z.literal("")),
  lastname: z.string().max(100).optional().or(z.literal("")),
  /** Required for Entity / Group clients */
  fullname: z.string().max(200).optional().or(z.literal("")),

  // ── Organization ──────────────────────────────────────────
  officeId: z.number({ message: "Office is required" }).int(),
  staffId: z.number().int().optional().nullable(),
  groupId: z.number().int().optional().nullable(),

  // ── Demographics ──────────────────────────────────────────
  dateOfBirth: z.string().optional().or(z.literal("")),
  genderId: z.number().int().optional().nullable(),
  legalFormId: z.number().int().optional().nullable(),

  // ── Identifiers ───────────────────────────────────────────
  externalId: z.string().max(100).optional().or(z.literal("")),
  savingsProductId: z.number().int().optional().nullable(),

  // ── Contact ───────────────────────────────────────────────
  mobileNo: z
    .string()
    .max(50)
    .regex(/^\+?[0-9]{7,15}$/, "Mobile number must be 7-15 digits, optional leading +")
    .optional()
    .or(z.literal("")),
  emailAddress: z.string().email("Please enter a valid email address").max(100).optional().or(z.literal("")),

  // ── Activation ────────────────────────────────────────────
  activationDate: z.string().optional().or(z.literal("")),
  submittedOnDate: z.string().optional().or(z.literal("")),
  active: z.boolean().optional(),

  // ── Account ───────────────────────────────────────────────
  accountNo: z.string().max(20).optional().or(z.literal("")),
  isStaff: z.boolean().optional(),
  clientTypeId: z.number().int().optional().nullable(),
  clientClassificationId: z.number().int().optional().nullable(),

  // ── Entity details (Legal Form = Entity) ──────────────────
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

  // ── Fineract metadata ─────────────────────────────────────
  dateFormat: z.string(),
  locale: z.string(),
});

/**
 * Validation schema for creating a new Fineract client.
 * - Person (legalFormId=1 or unspecified): firstname + lastname required
 * - Entity (legalFormId=2): fullname required
 */
export const createClientSchema = createClientSchemaBase.superRefine((data, ctx) => {
  const isEntity = data.legalFormId === 2;

  if (isEntity) {
    if (!data.fullname || data.fullname.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Full name is required for organizations",
        path: ["fullname"],
      });
    }
  } else {
    if (!data.firstname || data.firstname.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "First name is required",
        path: ["firstname"],
      });
    }
    if (!data.lastname || data.lastname.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Last name is required",
        path: ["lastname"],
      });
    }
  }

  // activationDate required when active=true
  if (data.active === true && (!data.activationDate || data.activationDate.trim() === "")) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Activation date is required when the client is active",
      path: ["activationDate"],
    });
  }
});

export type CreateClientFormValues = z.infer<typeof createClientSchema>;

/**
 * Validation schema for editing an existing Fineract client.
 * All fields are optional — only changed fields need to be sent.
 * No conditional refine because we don't enforce required fields during edit.
 */
export const editClientSchema = createClientSchemaBase.partial();

export type EditClientFormValues = z.infer<typeof editClientSchema>;

// ─── State-Transition Schemas ────────────────────────────────
// Per client.md §10 — see instructions/client.md.

export const activateClientSchema = z.object({
  activationDate: z.string({ required_error: "activationDate is required" }).min(1, "activationDate is required"),
  dateFormat: z.string().optional(),
  locale: z.string().optional(),
});
export type ActivateClientFormValues = z.infer<typeof activateClientSchema>;

export const closeClientSchema = z.object({
  closureDate: z.string({ required_error: "closureDate is required" }).min(1, "closureDate is required"),
  closureReasonId: z
    .number({ required_error: "closureReasonId is required" })
    .int()
    .positive("closureReasonId is required"),
  dateFormat: z.string().optional(),
  locale: z.string().optional(),
});
export type CloseClientFormValues = z.infer<typeof closeClientSchema>;

export const rejectClientSchema = z.object({
  rejectionDate: z.string({ required_error: "rejectionDate is required" }).min(1, "rejectionDate is required"),
  rejectionReasonId: z
    .number({ required_error: "rejectionReasonId is required" })
    .int()
    .positive("rejectionReasonId is required"),
  dateFormat: z.string().optional(),
  locale: z.string().optional(),
});
export type RejectClientFormValues = z.infer<typeof rejectClientSchema>;

export const withdrawClientSchema = z.object({
  withdrawalDate: z.string({ required_error: "withdrawalDate is required" }).min(1, "withdrawalDate is required"),
  withdrawalReasonId: z
    .number({ required_error: "withdrawalReasonId is required" })
    .int()
    .positive("withdrawalReasonId is required"),
  dateFormat: z.string().optional(),
  locale: z.string().optional(),
});
export type WithdrawClientFormValues = z.infer<typeof withdrawClientSchema>;

export const reactivateClientSchema = z.object({
  reactivationDate: z
    .string({ required_error: "reactivationDate is required" })
    .min(1, "reactivationDate is required"),
  dateFormat: z.string().optional(),
  locale: z.string().optional(),
});
export type ReactivateClientFormValues = z.infer<typeof reactivateClientSchema>;

export const reopenedDateSchema = z.object({
  reopenedDate: z.string({ required_error: "reopenedDate is required" }).min(1, "reopenedDate is required"),
  dateFormat: z.string().optional(),
  locale: z.string().optional(),
});
export type UndoRejectClientFormValues = z.infer<typeof reopenedDateSchema>;
export type UndoWithdrawClientFormValues = z.infer<typeof reopenedDateSchema>;
