import { z } from "zod";

export const createWCDelinquencyBucketSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  bucketType: z.string().default("WORKING_CAPITAL"),
  ranges: z
    .array(
      z.object({
        classification: z.string().min(1, "Classification is required"),
        minimumAgeDays: z.number().int().min(0),
        maximumAgeDays: z.number().int().min(1),
      }),
    )
    .min(1, "At least one range is required"),
});
export type CreateWCDelinquencyBucketFormValues = z.infer<typeof createWCDelinquencyBucketSchema>;

export const createWCLoanProductSchema = z
  .object({
    name: z.string().min(1, "Name is required").max(100),
    shortName: z.string().min(1, "Short name is required").max(4, "Max 4 characters"),
    description: z.string().max(500).optional(),
    currencyCode: z.string().min(1, "Currency is required"),
    digitsAfterDecimal: z.coerce.number().min(0).default(2),
    inMultiplesOf: z.coerce.number().min(0).default(1),
    amortizationType: z.string().default("EIR"),
    npvDayCount: z.coerce.number().positive("NPV day count must be positive"),
    principal: z.coerce.number().positive("Principal must be > 0"),
    minPrincipal: z.preprocess((v) => (v === "" || v === null ? undefined : v), z.coerce.number().optional()),
    maxPrincipal: z.preprocess((v) => (v === "" || v === null ? undefined : v), z.coerce.number().optional()),
    periodPaymentRate: z.coerce.number().positive("Period payment rate must be > 0"),
    minPeriodPaymentRate: z.preprocess((v) => (v === "" || v === null ? undefined : v), z.coerce.number().optional()),
    maxPeriodPaymentRate: z.preprocess((v) => (v === "" || v === null ? undefined : v), z.coerce.number().optional()),
    repaymentEvery: z.coerce.number().positive("Repayment frequency is required"),
    repaymentFrequencyType: z.string().min(1, "Repayment frequency type is required"),
    delinquencyBucketId: z.preprocess(
      (v) => (v === "" || v == null ? undefined : v),
      z.coerce.number({ error: "Delinquency bucket is required" }).positive("Delinquency bucket is required"),
    ),
    delinquencyGraceDays: z.coerce.number().min(0).optional(),
    delinquencyStartType: z.string().optional(),
    accountingRule: z.string().default("NONE"),
    locale: z.string().default("en"),
    dateFormat: z.string().default("yyyy-MM-dd"),
  })
  .superRefine((data, ctx) => {
    if (data.amortizationType !== "EIR") {
      ctx.addIssue({
        code: "custom",
        path: ["amortizationType"],
        message: "Amortization type must be EIR for Working Capital Loans",
      });
    }

    const { principal, minPrincipal, maxPrincipal } = data;
    const hasMin = minPrincipal != null && !Number.isNaN(minPrincipal);
    const hasMax = maxPrincipal != null && !Number.isNaN(maxPrincipal);
    const hasPrincipal = principal != null && !Number.isNaN(principal);

    if (hasMin && hasMax && minPrincipal > maxPrincipal) {
      ctx.addIssue({
        code: "custom",
        path: ["maxPrincipal"],
        message: "Max Principal must be greater than or equal to Min Principal",
      });
    }
    if (hasPrincipal && hasMin && principal < minPrincipal) {
      ctx.addIssue({
        code: "custom",
        path: ["principal"],
        message: "Principal must not be less than Min Principal",
      });
    }
    if (hasPrincipal && hasMax && principal > maxPrincipal) {
      ctx.addIssue({
        code: "custom",
        path: ["principal"],
        message: "Principal must not be greater than Max Principal",
      });
    }

    const { periodPaymentRate, minPeriodPaymentRate, maxPeriodPaymentRate } = data;
    const hasPeriodMin = minPeriodPaymentRate != null && !Number.isNaN(minPeriodPaymentRate);
    const hasPeriodMax = maxPeriodPaymentRate != null && !Number.isNaN(maxPeriodPaymentRate);
    const hasPeriodPaymentRate = periodPaymentRate != null && !Number.isNaN(periodPaymentRate);

    if (hasPeriodMin && hasPeriodMax && minPeriodPaymentRate > maxPeriodPaymentRate) {
      ctx.addIssue({
        code: "custom",
        path: ["maxPeriodPaymentRate"],
        message: "Max Period Payment Rate must be greater than or equal to Min Period Payment Rate",
      });
    }

    if (hasPeriodPaymentRate && hasPeriodMin && periodPaymentRate < minPeriodPaymentRate) {
      ctx.addIssue({
        code: "custom",
        path: ["periodPaymentRate"],
        message: "Period Payment Rate must not be less than Min Period Payment Rate",
      });
    }

    if (hasPeriodPaymentRate && hasPeriodMax && periodPaymentRate > maxPeriodPaymentRate) {
      ctx.addIssue({
        code: "custom",
        path: ["periodPaymentRate"],
        message: "Period Payment Rate must not be greater than Max Period Payment Rate",
      });
    }
  });
export type CreateWCLoanProductFormValues = z.infer<typeof createWCLoanProductSchema>;

export const createWCLoanSchema = z
  .object({
    clientId: z.number({ message: "Client is required" }).int().positive(),
    productId: z.number({ message: "Product is required" }).int().positive(),
    principalAmount: z.number({ message: "Principal is required" }).positive(),
    totalPaymentVolume: z.number({ message: "Total payment volume is required" }).positive(),
    periodPaymentRate: z.number({ message: "Period payment rate is required" }).positive(),
    discount: z.number({ message: "Discount is required" }).min(0),
    submittedOnDate: z.string().min(1, "Submission date is required"),
    expectedDisbursementDate: z.string().min(1, "Expected disbursement date is required"),
    delinquencyBucketId: z.number().int().positive().optional(),
    delinquencyGraceDays: z.number().int().min(0).optional(),
    delinquencyStartType: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.submittedOnDate > data.expectedDisbursementDate) {
      ctx.addIssue({
        code: "custom",
        path: ["submittedOnDate"],
        message: "Submitted date cannot be after expected disbursement date",
      });
    }
  });
export type CreateWCLoanFormValues = z.infer<typeof createWCLoanSchema>;

export const wcPauseActionSchema = z
  .object({
    action: z.literal("pause"),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
    locale: z.string().default("en"),
    dateFormat: z.string().default("yyyy-MM-dd"),
  })
  .superRefine((data, ctx) => {
    if (data.startDate >= data.endDate) {
      ctx.addIssue({ code: "custom", path: ["endDate"], message: "End date must be after start date" });
    }
  });
export type WCPauseActionFormValues = z.infer<typeof wcPauseActionSchema>;

export const wcRescheduleActionSchema = z
  .object({
    action: z.literal("reschedule"),
    minimumPayment: z.number().positive("Minimum payment must be > 0").optional(),
    minimumPaymentType: z.string().optional(),
    frequency: z.number().int().positive().optional(),
    frequencyType: z.string().optional(),
    locale: z.string().default("en"),
  })
  .superRefine((data, ctx) => {
    if (data.minimumPayment == null && data.frequency == null) {
      ctx.addIssue({
        code: "custom",
        path: ["minimumPayment"],
        message: "At least payment or frequency must be provided",
      });
    }
  });
export type WCRescheduleActionFormValues = z.infer<typeof wcRescheduleActionSchema>;

export const wcRateChangeSchema = z.object({
  periodPaymentRate: z.number().positive("Rate must be > 0"),
  note: z.string().max(500).optional(),
  locale: z.string().default("en"),
});
export type WCRateChangeFormValues = z.infer<typeof wcRateChangeSchema>;

export const wcRepaymentSchema = z.object({
  transactionDate: z.string().min(1, "Transaction date is required"),
  transactionAmount: z.number().positive("Amount must be > 0"),
  paymentTypeId: z.number().int().positive().optional(),
  locale: z.string().default("en"),
  dateFormat: z.string().default("yyyy-MM-dd"),
});
export type WCRepaymentFormValues = z.infer<typeof wcRepaymentSchema>;

// ─── Schemas below derived from docs/WCLoan.md §8 ───

export const rejectWCLoanSchema = z.object({
  rejectedOnDate: z.string().min(1, "Rejection date is required"),
  note: z.string().max(1000).optional(),
  locale: z.string().default("en"),
  dateFormat: z.string().default("yyyy-MM-dd"),
});
export type RejectWCLoanFormValues = z.infer<typeof rejectWCLoanSchema>;

export const undoCommandSchema = z.object({
  note: z.string().max(1000).optional(),
  locale: z.string().default("en"),
  dateFormat: z.string().default("yyyy-MM-dd"),
});
export type UndoCommandFormValues = z.infer<typeof undoCommandSchema>;

export const markAsFraudSchema = z.object({ fraud: z.boolean() });
export type MarkAsFraudFormValues = z.infer<typeof markAsFraudSchema>;

export const updateDiscountSchema = z.object({
  discountAmount: z.number({ message: "Discount amount is required" }).min(0),
  note: z.string().max(1000).optional(),
  locale: z.string().default("en"),
  dateFormat: z.string().default("yyyy-MM-dd"),
});
export type UpdateDiscountFormValues = z.infer<typeof updateDiscountSchema>;

const paymentDetailsShape = z.object({
  paymentTypeId: z.number().int().positive().optional(),
  accountNumber: z.string().max(50).optional(),
  checkNumber: z.string().max(50).optional(),
  routingCode: z.string().max(50).optional(),
  receiptNumber: z.string().max(50).optional(),
  bankNumber: z.string().max(50).optional(),
});

export const disburseWCLoanSchema = z
  .object({
    actualDisbursementDate: z.string().min(1, "Disbursement date is required"),
    transactionAmount: z.number({ message: "Amount is required" }).positive("Amount must be > 0"),
    discountAmount: z.number().min(0).optional(),
    note: z.string().max(1000).optional(),
    paymentDetails: paymentDetailsShape.optional(),
    externalId: z.string().max(100).optional(),
    discountExternalId: z.string().max(100).optional(),
    classificationId: z.number().int().positive().optional(),
    locale: z.string().default("en"),
    dateFormat: z.string().default("yyyy-MM-dd"),
  })
  .superRefine((v, ctx) => {
    if (v.discountExternalId && !v.discountAmount) {
      ctx.addIssue({
        code: "custom",
        path: ["discountExternalId"],
        message: "Discount external id requires a positive discount amount",
      });
    }
    if (v.externalId && v.discountExternalId && v.externalId === v.discountExternalId) {
      ctx.addIssue({
        code: "custom",
        path: ["discountExternalId"],
        message: "External ids must differ",
      });
    }
  });
export type DisburseWCLoanFormValues = z.infer<typeof disburseWCLoanSchema>;

export const repaymentLikeSchema = wcRepaymentSchema.extend({
  classificationId: z.number().int().positive().optional(),
  note: z.string().max(1000).optional(),
  externalId: z.string().max(100).optional(),
});
export type RepaymentLikeFormValues = z.infer<typeof repaymentLikeSchema>;

export const creditBalanceRefundSchema = repaymentLikeSchema;
export type CreditBalanceRefundFormValues = z.infer<typeof creditBalanceRefundSchema>;

export const discountFeeSchema = z.object({
  transactionAmount: z.number().min(0, "Amount must be >= 0").optional(),
  transactionDate: z.string().min(1, "Transaction date is required"),
  note: z.string().max(1000).optional(),
  externalId: z.string().max(100).optional(),
  locale: z.string().default("en"),
  dateFormat: z.string().default("yyyy-MM-dd"),
});
export type DiscountFeeFormValues = z.infer<typeof discountFeeSchema>;

export const discountFeeAdjustmentSchema = z.object({
  transactionAmount: z.number({ message: "Amount is required" }).positive("Amount must be > 0"),
  transactionDate: z.string().min(1, "Transaction date is required"),
  note: z.string().max(1000).optional(),
  externalId: z.string().max(100).optional(),
  locale: z.string().default("en"),
  dateFormat: z.string().default("yyyy-MM-dd"),
});
export type DiscountFeeAdjustmentFormValues = z.infer<typeof discountFeeAdjustmentSchema>;

export const chargeOffSchema = z.object({
  transactionDate: z.string().min(1, "Transaction date is required"),
  chargeOffReasonId: z.number().int().positive().optional(),
  note: z.string().max(1000).optional(),
  externalId: z.string().max(100).optional(),
  locale: z.string().default("en"),
  dateFormat: z.string().default("yyyy-MM-dd"),
});
export type ChargeOffFormValues = z.infer<typeof chargeOffSchema>;

export const undoChargeOffSchema = z.object({
  reversalExternalId: z.string().max(100).optional(),
  note: z.string().max(1000).optional(),
  locale: z.string().default("en"),
});
export type UndoChargeOffFormValues = z.infer<typeof undoChargeOffSchema>;

export const undoTransactionSchema = z.object({
  reversalExternalId: z.string().max(100).optional(),
  note: z.string().max(1000).optional(),
  locale: z.string().default("en"),
  dateFormat: z.string().default("yyyy-MM-dd"),
});
export type UndoTransactionFormValues = z.infer<typeof undoTransactionSchema>;

export const createLoanChargeSchema = z.object({
  chargeId: z.number({ message: "Charge is required" }).int().positive("Charge is required"),
  amount: z.number({ message: "Amount is required" }).positive("Amount must be > 0"),
  dueDate: z.string().optional(),
  externalId: z.string().max(100).optional(),
  locale: z.string().default("en"),
  dateFormat: z.string().default("yyyy-MM-dd"),
});
export type CreateLoanChargeFormValues = z.infer<typeof createLoanChargeSchema>;

export const chargeAdjustmentSchema = z.object({
  amount: z.number({ message: "Amount is required" }).positive("Amount must be > 0"),
  note: z.string().max(1000).optional(),
  paymentTypeId: z.number().int().positive().optional(),
  locale: z.string().default("en"),
  dateFormat: z.string().default("yyyy-MM-dd"),
});
export type ChargeAdjustmentFormValues = z.infer<typeof chargeAdjustmentSchema>;

export const breachActionSchema = z.discriminatedUnion("action", [
  z
    .object({
      action: z.literal("pause"),
      startDate: z.string().min(1, "Start date is required"),
      endDate: z.string().min(1, "End date is required"),
      locale: z.string().default("en"),
      dateFormat: z.string().default("yyyy-MM-dd"),
    })
    .superRefine((v, ctx) => {
      if (v.startDate >= v.endDate) {
        ctx.addIssue({ code: "custom", path: ["endDate"], message: "End date must be after start date" });
      }
    }),
  z
    .object({
      action: z.literal("reschedule"),
      minimumPayment: z.number().positive("Minimum payment must be > 0").optional(),
      minimumPaymentType: z.enum(["PERCENTAGE", "FLAT"]).optional(),
      frequency: z.number().int().positive().optional(),
      frequencyType: z.enum(["DAYS", "WEEKS", "MONTHS", "YEARS"]).optional(),
      locale: z.string().default("en"),
    })
    .superRefine((v, ctx) => {
      if (v.minimumPayment == null && v.frequency == null) {
        ctx.addIssue({
          code: "custom",
          path: ["minimumPayment"],
          message: "Provide minimum payment or frequency",
        });
      }
    }),
  z.object({ action: z.literal("resume"), startDate: z.string().min(1, "Start date is required") }),
  z.object({ action: z.literal("reset"), startNewPeriod: z.boolean().optional() }),
  z.object({ action: z.literal("undo_reset") }),
  z.object({ action: z.literal("disable"), startDate: z.string().min(1, "Start date is required") }),
  z.object({ action: z.literal("enable"), startDate: z.string().min(1, "Start date is required") }),
]);
export type BreachActionFormValues = z.infer<typeof breachActionSchema>;
