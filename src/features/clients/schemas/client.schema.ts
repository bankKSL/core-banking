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
        .regex(/^[+\d\s\-().]*$/, "Mobile number contains invalid characters")
        .optional()
        .or(z.literal("")),
    emailAddress: z.string().email("Please enter a valid email address").max(100).optional().or(z.literal("")),

    // ── Activation ────────────────────────────────────────────
    activationDate: z.string().optional().or(z.literal("")),
    submittedOnDate: z.string().optional().or(z.literal("")),
    active: z.boolean().optional(),

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
});

export type CreateClientFormValues = z.infer<typeof createClientSchema>;

/**
 * Validation schema for editing an existing Fineract client.
 * All fields are optional — only changed fields need to be sent.
 * No conditional refine because we don't enforce required fields during edit.
 */
export const editClientSchema = createClientSchemaBase.partial();

export type EditClientFormValues = z.infer<typeof editClientSchema>;
