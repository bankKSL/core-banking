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
    digitsAfterDecimal: z.number().int().min(0).default(2),
    inMultiplesOf: z.number().int().min(0).default(1),
    amortizationType: z.string().default("EIR"),
    npvDayCount: z.number().int().positive("NPV day count must be positive"),
    principal: z.coerce.number().positive("Principal must be > 0"),
    minPrincipal: z.preprocess((v) => (v === "" || v === null ? undefined : v), z.coerce.number().optional()),
    maxPrincipal: z.preprocess((v) => (v === "" || v === null ? undefined : v), z.coerce.number().optional()),
    periodPaymentRate: z.coerce.number().positive("Period payment rate must be > 0"),
    minPeriodPaymentRate: z.preprocess((v) => (v === "" || v === null ? undefined : v), z.coerce.number().optional()),
    maxPeriodPaymentRate: z.preprocess((v) => (v === "" || v === null ? undefined : v), z.coerce.number().optional()),
    repaymentEvery: z.number().int().positive("Repayment frequency is required"),
    repaymentFrequencyType: z.string().min(1, "Repayment frequency type is required"),
    delinquencyBucketId: z.number().int().positive("Delinquency bucket is required"),
    delinquencyGraceDays: z.number().int().min(0).optional(),
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
