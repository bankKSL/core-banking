import { z } from "zod";

/**
 * Validation schema for creating a new Fineract client.
 * Matches Fineract's POST /api/v1/clients request body.
 *
 * Notes:
 * - Dates are sent as yyyy-MM-dd (HTML date input) with dateFormat="yyyy-MM-dd"
 * - firstname/lastname are required for Person (legalFormId=1); fullname for Entity
 * - Fineract default dateFormat is "dd MMMM yyyy" but we override for HTML compatibility
 */
export const createClientSchema = z.object({
    // ── Personal ──────────────────────────────────────────────
    firstname: z.string().min(1, "First name is required for individuals").max(100).optional().or(z.literal("")),
    middlename: z.string().max(100).optional().or(z.literal("")),
    lastname: z.string().min(1, "Last name is required for individuals").max(100).optional().or(z.literal("")),
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

export type CreateClientFormValues = z.infer<typeof createClientSchema>;

/**
 * Validation schema for editing an existing Fineract client.
 * All fields are optional — only changed fields need to be sent.
 */
export const editClientSchema = createClientSchema.partial();

export type EditClientFormValues = z.infer<typeof editClientSchema>;
