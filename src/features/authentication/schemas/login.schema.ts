import { z } from "zod";

/**
 * Validation schema for the login form.
 *
 * Both fields are required. Fineract uses usernames (not emails)
 * for authentication, so no email format validation is applied.
 */
export const loginSchema = z.object({
    username: z.string().min(1, "Username is required"),
    password: z.string().min(1, "Password is required"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
