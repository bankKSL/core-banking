import React, { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { createLoanProduct, updateLoanProduct, useLoanProduct, useFunds } from "@/features/loans";
import type { LoanProductCreateRequest } from "@/features/loans";

const AMORTIZATION_OPTIONS = [
  { id: 1, label: "Equal Installments" },
  { id: 0, label: "Equal Principal" },
];

const REPAYMENT_FREQ_OPTIONS = [
  { id: 0, label: "Days" },
  { id: 1, label: "Weeks" },
  { id: 2, label: "Months" },
];

const CURRENCY_OPTIONS = ["LAK", "THB", "CNY", "USD"];

const STRATEGY_OPTIONS = [
  { id: "mifos-standard-strategy", label: "Mifos Standard Strategy" },
  { id: "heavensfamily-strategy", label: "Heavensfamily Strategy" },
  { id: "early-repayment-strategy", label: "Early Repayment Strategy" },
  { id: "advance-payment-allocation-strategy", label: "Advance Payment Allocation Strategy" },
  { id: "principal-interest-penalty-fees-order-strategy", label: "P-I-Penalty-Fees Order" },
  { id: "interest-principal-penalty-fees-order-strategy", label: "I-P-Penalty-Fees Order" },
  { id: "penalties-fees-interest-principal-order-strategy", label: "Penalties-Fees-I-P Order" },
];

/** Extract string value from Finfact enum objects {id,code,value} or primitive */
function enumVal(v: any, fallback = ""): string {
  if (v == null) return fallback;
  if (typeof v === "object") return v.code ?? v.value ?? String(v.id) ?? fallback;
  return String(v);
}

const loanProductSchema = z.object({
  name: z.string().min(1, "Name is required"),
  shortName: z.string().optional(),
  description: z.string().optional(),
  externalId: z.string().optional(),
  currencyCode: z.string().min(1, "Currency is required"),
  principal: z.coerce.number().positive("Principal must be > 0"),
  numberOfRepayments: z.coerce.number().int().positive("Required"),
  repaymentEvery: z.coerce.number().int().positive("Required"),
  repaymentFrequencyType: z.coerce.number(),
  amortizationType: z.coerce.number(),
  interestCalculationPeriodType: z.coerce.number(),
  transactionProcessingStrategyCode: z.string().optional(),
  loanScheduleType: z.string().optional(),
  daysInYearType: z.coerce.number().optional(),
  daysInMonthType: z.coerce.number().optional(),
  isInterestRecalculationEnabled: z.boolean().optional(),
  interestRatePerPeriod: z.coerce.number().min(0, "Required"),
  interestType: z.coerce.number(),
  interestRateFrequencyType: z.coerce.number().optional(),
  fundId: z.coerce.number().optional(),
  digitsAfterDecimal: z.coerce.number().optional(),
  inMultiplesOf: z.coerce.number().optional(),
  accountingRule: z.coerce.number(),
  locale: z.string(),
  dateFormat: z.string(),
});

type LoanProductFormValues = z.infer<typeof loanProductSchema>;

const LoanProductFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const { data: existingProduct, isLoading: productLoading } = useLoanProduct(id ? Number(id) : undefined);
  const { data: funds = [] } = useFunds();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<LoanProductFormValues>({
    resolver: zodResolver(loanProductSchema) as any,
    defaultValues: {
      name: "",
      shortName: "",
      description: "",
      externalId: "",
      currencyCode: "USD",
      principal: 0,
      numberOfRepayments: 12,
      repaymentEvery: 1,
      repaymentFrequencyType: 2,
      amortizationType: 1,
      interestCalculationPeriodType: 0,
      transactionProcessingStrategyCode: "mifos-standard-strategy",
      loanScheduleType: "CUMULATIVE",
      daysInYearType: 1,
      daysInMonthType: 1,
      isInterestRecalculationEnabled: false,
      interestRatePerPeriod: 0,
      interestType: 0,
      interestRateFrequencyType: 3,
      fundId: undefined,
      digitsAfterDecimal: 2,
      inMultiplesOf: 0,
      accountingRule: 1,
      locale: "en",
      dateFormat: "yyyy-MM-dd",
    },
  });

  const loanScheduleType = watch("loanScheduleType");
  const isProgressive = enumVal(loanScheduleType) === "PROGRESSIVE";

  // Populate form in edit mode
  useEffect(() => {
    if (!existingProduct) return;
    const p = existingProduct as any;
    reset({
      name: p.name ?? "",
      shortName: p.shortName ?? "",
      description: p.description ?? "",
      externalId: p.externalId ?? "",
      currencyCode: p.currency?.code ?? "USD",
      principal: p.principal ?? 0,
      numberOfRepayments: p.numberOfRepayments ?? 12,
      repaymentEvery: p.repaymentEvery ?? 1,
      repaymentFrequencyType: p.repaymentFrequencyType?.id ?? 2,
      amortizationType: p.amortizationType?.id ?? 1,
      interestCalculationPeriodType: p.interestCalculationPeriodType?.id ?? 0,
      transactionProcessingStrategyCode: p.transactionProcessingStrategyCode ?? "mifos-standard-strategy",
      loanScheduleType: enumVal(p.loanScheduleType, "CUMULATIVE"),
      daysInYearType: p.daysInYearType?.id ?? 1,
      daysInMonthType: p.daysInMonthType?.id ?? 1,
      isInterestRecalculationEnabled: !!p.isInterestRecalculationEnabled,
      interestRatePerPeriod: p.interestRatePerPeriod ?? 0,
      interestType: p.interestType?.id ?? 0,
      interestRateFrequencyType: p.interestRateFrequencyType?.id ?? 3,
      fundId: p.fundId ?? undefined,
      digitsAfterDecimal: p.currency?.decimalPlaces ?? 2,
      inMultiplesOf: p.currency?.inMultiplesOf ?? 0,
      accountingRule: p.accountingRule?.id ?? 1,
      locale: "en",
      dateFormat: "yyyy-MM-dd",
    });
  }, [existingProduct, reset]);

  const onSubmit = async (values: LoanProductFormValues) => {
    const payload: Record<string, any> = { ...values };
    Object.keys(payload).forEach((k) => {
      if (payload[k] === undefined) delete payload[k];
    });
    if (isEdit) {
      await updateLoanProduct(Number(id), payload as any);
    } else {
      await createLoanProduct(payload as any);
    }
    navigate("/lending/products");
  };

  if (isEdit && productLoading) {
    return (
      <div className="p-6 max-w-4xl m-auto space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl m-auto space-y-6">
      <PageHeader
        title={isEdit ? "Edit Loan Product" : "Create Loan Product"}
        description="Configure the loan product terms and settings."
        actions={
          <Button variant="outline" onClick={() => navigate("/lending/products")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
        }
      />

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Product Details</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-x-6 gap-y-4">
            {/* Row 1: Name | Short Name */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">Name *</label>
              <Input {...register("name")} error={errors.name?.message} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">Short Name</label>
              <Input {...register("shortName")} />
            </div>
            {/* Row 2 FULL: Description */}
            <div className="space-y-1.5 col-span-2">
              <label className="block text-sm font-medium">Description</label>
              <Textarea {...register("description")} rows={3} placeholder="Brief product description" />
            </div>
            {/* Row 3 FULL: External ID */}
            <div className="space-y-1.5 col-span-2">
              <label className="block text-sm font-medium">External ID</label>
              <Input {...register("externalId")} />
            </div>
            {/* Row 4: Fund | Currency Code */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">Fund</label>
              <Select
                value={watch("fundId") ? String(watch("fundId")) : ""}
                onValueChange={(v) => setValue("fundId", Number(v))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select fund" />
                </SelectTrigger>
                <SelectContent>
                  {funds.map((f: any) => (
                    <SelectItem key={f.id} value={String(f.id)}>
                      {f.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">Currency *</label>
              <Select
                value={watch("currencyCode")}
                onValueChange={(v) => setValue("currencyCode", v, { shouldValidate: true })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCY_OPTIONS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.currencyCode && <p className="text-xs text-red-500">{errors.currencyCode.message}</p>}
            </div>
            {/* Row 5: Principal | Interest Rate */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">Principal *</label>
              <Input type="number" step="0.01" {...register("principal")} error={errors.principal?.message} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">Interest Rate (%) *</label>
              <Input
                type="number"
                step="0.01"
                {...register("interestRatePerPeriod")}
                error={errors.interestRatePerPeriod?.message}
              />
            </div>
            {/* Row 6: Repayments | Every */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">Number of Repayments *</label>
              <Input type="number" {...register("numberOfRepayments")} error={errors.numberOfRepayments?.message} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">Repayment Every *</label>
              <Input type="number" {...register("repaymentEvery")} error={errors.repaymentEvery?.message} />
            </div>
            {/* Row 7: Repayment Frequency | Interest Type */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">Repayment Frequency *</label>
              <Select
                value={String(watch("repaymentFrequencyType"))}
                onValueChange={(v) => setValue("repaymentFrequencyType", Number(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REPAYMENT_FREQ_OPTIONS.map((o) => (
                    <SelectItem key={o.id} value={String(o.id)}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">Interest Rate Frequency</label>
              <Select
                value={String(watch("interestRateFrequencyType") ?? 3)}
                onValueChange={(v) => setValue("interestRateFrequencyType", Number(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">Per Month</SelectItem>
                  <SelectItem value="4">Per Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* Row 8: Amortization | Interest Calculation Period */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">Amortization Type</label>
              <Select
                value={String(watch("amortizationType"))}
                onValueChange={(v) => setValue("amortizationType", Number(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AMORTIZATION_OPTIONS.map((o) => (
                    <SelectItem key={o.id} value={String(o.id)}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">Interest Type</label>
              <Select value={String(watch("interestType"))} onValueChange={(v) => setValue("interestType", Number(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Flat</SelectItem>
                  <SelectItem value="1">Declining Balance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* Row 9: Loan Schedule Type | Transaction Strategy */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">Loan Schedule Type</label>
              <Select
                value={String(watch("loanScheduleType") ?? "CUMULATIVE")}
                onValueChange={(v) => setValue("loanScheduleType", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CUMULATIVE">Cumulative</SelectItem>
                  <SelectItem value="PROGRESSIVE">Progressive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">Transaction Processing Strategy</label>
              <Select
                value={watch("transactionProcessingStrategyCode") ?? ""}
                onValueChange={(v) => setValue("transactionProcessingStrategyCode", v)}
                disabled={isProgressive}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select strategy" />
                </SelectTrigger>
                <SelectContent>
                  {(isProgressive
                    ? STRATEGY_OPTIONS.filter((s) => s.id === "advance-payment-allocation-strategy")
                    : STRATEGY_OPTIONS.filter((s) => s.id !== "advance-payment-allocation-strategy")
                  ).map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Row 10: Days In Year Type */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">Days In Year Type</label>
              <Select
                value={String(watch("daysInYearType") ?? 1)}
                onValueChange={(v) => setValue("daysInYearType", Number(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Actual (365/366)</SelectItem>
                  <SelectItem value="360">360 Days</SelectItem>
                  <SelectItem value="365">365 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div />
            {/* Row 11 FULL: Interest Recalculation Enabled */}
            <div
              className="col-span-2 flex items-center gap-2 pt-2 cursor-pointer"
              onClick={() => setValue("isInterestRecalculationEnabled", !watch("isInterestRecalculationEnabled"))}
            >
              <Checkbox
                id="isInterestRecalculationEnabled"
                checked={!!watch("isInterestRecalculationEnabled")}
                onCheckedChange={(v) => setValue("isInterestRecalculationEnabled", v === true)}
              />
              <Label htmlFor="isInterestRecalculationEnabled" className="text-sm font-normal cursor-pointer">
                Interest Recalculation Enabled
              </Label>
            </div>
            {/* Row 12 Progressive only: Payment Credit Allocation Editor */}
            {isProgressive && (
              <div className="col-span-2 rounded-lg border border-dashed border-gray-300 p-4 text-sm text-gray-400 text-center">
                Payment/Credit Allocation Editor — Custom child component (not yet implemented)
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" type="button" onClick={() => navigate("/lending/products")}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} className="bg-[#D32F2F] hover:bg-red-700">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" /> {isEdit ? "Save Changes" : "Create Product"}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default LoanProductFormPage;
