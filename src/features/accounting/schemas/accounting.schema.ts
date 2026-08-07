import { z } from "zod";
import i18n from "@/i18n";

// ============================================================
// GL Account
// ============================================================

export const glAccountTypeSchema = z.number().int().min(1).max(5);
export const glAccountUsageSchema = z.number().int().min(1).max(2);

export const createGLAccountSchema = z.object({
  name: z.string().min(1, i18n.t("Name is required")).max(200, i18n.t("Name must be 200 characters or less")),
  glCode: z.string().min(1, i18n.t("GL Code is required")).max(45, i18n.t("GL Code must be 45 characters or less")),
  type: glAccountTypeSchema,
  usage: glAccountUsageSchema,
  manualEntriesAllowed: z.boolean(),
  parentId: z.number().int().positive().optional(),
  tagId: z.number().int().positive().optional(),
  description: z.string().max(500).optional(),
});

export type CreateGLAccountFormValues = z.infer<typeof createGLAccountSchema>;

export const updateGLAccountSchema = z
  .object({
    name: z.string().min(1).max(200).optional(),
    glCode: z.string().min(1).max(45).optional(),
    type: glAccountTypeSchema.optional(),
    usage: glAccountUsageSchema.optional(),
    manualEntriesAllowed: z.boolean().optional(),
    parentId: z.number().int().positive().optional(),
    tagId: z.number().int().positive().optional(),
    description: z.string().max(500).optional(),
    disabled: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: i18n.t("At least one field must be provided for update") });

// ============================================================
// Journal Entry
// ============================================================

export const creditDebitSchema = z.object({
  glAccountId: z.number({ message: i18n.t("GL Account is required") }).int().positive(),
  amount: z.number({ message: i18n.t("Amount is required") }).positive(i18n.t("Amount must be positive")),
});

export const createJournalEntrySchema = z
  .object({
    officeId: z.number({ message: i18n.t("Office is required") }).int().positive(),
    transactionDate: z.string({ message: i18n.t("Transaction date is required") }).min(1),
    currencyCode: z.string({ message: i18n.t("Currency is required") }).min(1),
    dateFormat: z.string().optional(),
    locale: z.string().optional(),
    credits: z.array(creditDebitSchema).min(1, i18n.t("At least one credit entry is required")),
    debits: z.array(creditDebitSchema).min(1, i18n.t("At least one debit entry is required")),
    comments: z.string().max(500).optional(),
    referenceNumber: z.string().max(100).optional(),
    accountingRuleId: z.number().int().positive().optional(),
    paymentTypeId: z.number().int().positive().optional(),
    accountNumber: z.string().optional(),
    checkNumber: z.string().optional(),
    routingCode: z.string().optional(),
    receiptNumber: z.string().optional(),
    bankNumber: z.string().optional(),
    externalAssetOwner: z.string().max(100).optional(),
  })
  .refine(
    (data) => {
      const totalCredits = data.credits.reduce((sum, c) => sum + c.amount, 0);
      const totalDebits = data.debits.reduce((sum, d) => sum + d.amount, 0);
      return Math.abs(totalCredits - totalDebits) < 0.001;
    },
    { message: i18n.t("Total debits must equal total credits"), path: ["debits"] },
  );

export type CreateJournalEntryFormValues = z.infer<typeof createJournalEntrySchema>;

// ============================================================
// Accounting Rule
// ============================================================

export const createAccountingRuleSchema = z
  .object({
    name: z.string().min(1, i18n.t("Name is required")),
    officeId: z.number({ message: i18n.t("Office is required") }).int().positive(),
    description: z.string().optional(),
    accountToDebit: z.number().int().positive().optional(),
    accountToCredit: z.number().int().positive().optional(),
    creditTags: z.array(z.object({ tagId: z.number().int().positive() })).optional(),
    debitTags: z.array(z.object({ tagId: z.number().int().positive() })).optional(),
    allowMultipleCreditEntries: z.boolean().optional(),
    allowMultipleDebitEntries: z.boolean().optional(),
  })
  .refine((data) => data.accountToDebit || (data.debitTags && data.debitTags.length > 0), {
    message: i18n.t("Either accountToDebit or debitTags is required"),
    path: ["accountToDebit"],
  })
  .refine((data) => data.accountToCredit || (data.creditTags && data.creditTags.length > 0), {
    message: i18n.t("Either accountToCredit or creditTags is required"),
    path: ["accountToCredit"],
  });

export type CreateAccountingRuleFormValues = z.infer<typeof createAccountingRuleSchema>;

// ============================================================
// Financial Activity Account
// ============================================================

export const createFinancialActivityMappingSchema = z.object({
  financialActivityId: z.number({ message: i18n.t("Financial activity is required") }).int().positive(),
  glAccountId: z.number({ message: i18n.t("GL Account is required") }).int().positive(),
});

export type CreateFinancialActivityMappingFormValues = z.infer<typeof createFinancialActivityMappingSchema>;

// ============================================================
// GL Closure
// ============================================================

export const createGLClosureSchema = z.object({
  officeId: z.number({ message: i18n.t("Office is required") }).int().positive(),
  closingDate: z.string({ message: i18n.t("Closing date is required") }).min(1),
  dateFormat: z.string().optional(),
  locale: z.string().optional(),
  comments: z.string().optional(),
});

export type CreateGLClosureFormValues = z.infer<typeof createGLClosureSchema>;

// ============================================================
// Periodic Accrual
// ============================================================

export const executePeriodicAccrualSchema = z.object({
  tillDate: z.string({ message: i18n.t("Till date is required") }).min(1),
  dateFormat: z.string().optional(),
  locale: z.string().optional(),
});

export type ExecutePeriodicAccrualFormValues = z.infer<typeof executePeriodicAccrualSchema>;

// ============================================================
// Provisioning Entry
// ============================================================

export const createProvisioningEntrySchema = z.object({
  date: z.string({ message: i18n.t("Date is required") }).min(1),
  dateFormat: z.string().optional(),
  locale: z.string().optional(),
  createjournalentries: z.boolean().optional(),
});

export type CreateProvisioningEntryFormValues = z.infer<typeof createProvisioningEntrySchema>;
