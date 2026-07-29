import React, { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  createSavingsProductSchema,
  type CreateSavingsProductFormValues,
  useSavingsProduct,
  createSavingsProduct,
  updateSavingsProduct,
} from "@/features/deposits";
import type { SavingsProductCreateRequest } from "@/features/deposits";
import { CurrencySelect } from "@/components/shared/CurrencySelect";

const INTEREST_COMPOUNDING_OPTIONS = [
  { id: 1, label: "Daily" },
  { id: 4, label: "Monthly" },
  { id: 5, label: "Quarterly" },
  { id: 6, label: "Semi-Annual" },
  { id: 7, label: "Annual" },
];

const INTEREST_POSTING_OPTIONS = [
  { id: 1, label: "Daily" },
  { id: 4, label: "Monthly" },
  { id: 5, label: "Quarterly" },
  { id: 6, label: "Semi-Annual" },
  { id: 7, label: "Annual" },
  { id: 8, label: "Anniversary Monthly" },
  { id: 9, label: "Anniversary Quarterly" },
  { id: 10, label: "Anniversary Bi-Annual" },
  { id: 11, label: "Anniversary Annual" },
];

const INTEREST_CALCULATION_OPTIONS = [
  { id: 1, label: "Daily Balance" },
  { id: 2, label: "Average Daily Balance" },
];

const DAYS_IN_YEAR_OPTIONS = [
  { id: 360, label: "360" },
  { id: 365, label: "365" },
];

const LOCKIN_PERIOD_TYPE_OPTIONS = [
  { id: 0, label: "Days" },
  { id: 1, label: "Weeks" },
  { id: 2, label: "Months" },
  { id: 3, label: "Years" },
];

const ACCOUNTING_RULE_OPTIONS = [
  { id: 1, label: "None" },
  { id: 2, label: "Cash" },
  { id: 3, label: "Accrual" },
];

type FormValues = CreateSavingsProductFormValues;

const SavingsProductFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const { data: existingProduct, isLoading: productLoading } = useSavingsProduct(id ? Number(id) : undefined);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(createSavingsProductSchema) as any,
    defaultValues: {
      name: "",
      shortName: "",
      currencyCode: "USD",
      digitsAfterDecimal: 2,
      nominalAnnualInterestRate: 0,
      interestCompoundingPeriodType: 1,
      interestPostingPeriodType: 4,
      interestCalculationType: 1,
      interestCalculationDaysInYearType: 365,
      accountingRule: 1,
      inMultiplesOf: 0,
      allowOverdraft: false,
      isDormancyTrackingActive: false,
      withHoldTax: false,
      withdrawalFeeForTransfers: false,
      enforceMinRequiredBalance: false,
    },
  });

  const allowOverdraft = watch("allowOverdraft");
  const isDormancyTrackingActive = watch("isDormancyTrackingActive");
  const withHoldTax = watch("withHoldTax");

  useEffect(() => {
    if (!existingProduct) return;
    const p = existingProduct as any;
    reset({
      name: p.name ?? "",
      shortName: p.shortName ?? "",
      description: p.description ?? "",
      currencyCode: p.currency?.code ?? "USD",
      digitsAfterDecimal: p.currency?.decimalPlaces ?? 2,
      inMultiplesOf: p.currency?.inMultiplesOf ?? 0,
      nominalAnnualInterestRate: p.nominalAnnualInterestRate ?? 0,
      interestCompoundingPeriodType: p.interestCompoundingPeriodType?.id ?? 1,
      interestPostingPeriodType: p.interestPostingPeriodType?.id ?? 4,
      interestCalculationType: p.interestCalculationType?.id ?? 1,
      interestCalculationDaysInYearType: p.interestCalculationDaysInYearType?.id ?? 365,
      minRequiredOpeningBalance: p.minRequiredOpeningBalance ?? undefined,
      lockinPeriodFrequency: p.lockinPeriodFrequency ?? undefined,
      lockinPeriodFrequencyType: p.lockinPeriodFrequencyType?.id ?? undefined,
      withdrawalFeeForTransfers: !!p.withdrawalFeeForTransfers,
      allowOverdraft: !!p.allowOverdraft,
      overdraftLimit: p.overdraftLimit ?? undefined,
      minRequiredBalance: p.minRequiredBalance ?? undefined,
      enforceMinRequiredBalance: !!p.enforceMinRequiredBalance,
      accountingRule: p.accountingType ?? 1,
      isDormancyTrackingActive: !!p.isDormancyTrackingActive,
      daysToInactive: p.daysToInactive ?? undefined,
      daysToDormancy: p.daysToDormancy ?? undefined,
      daysToEscheat: p.daysToEscheat ?? undefined,
      withHoldTax: !!p.withHoldTax,
    });
  }, [existingProduct, reset]);

  const handleSave = async (values: FormValues) => {
    const payload: SavingsProductCreateRequest = {
      name: values.name,
      shortName: values.shortName,
      description: values.description,
      currencyCode: values.currencyCode,
      digitsAfterDecimal: values.digitsAfterDecimal,
      inMultiplesOf: values.inMultiplesOf ?? 0,
      locale: "en",
      nominalAnnualInterestRate: values.nominalAnnualInterestRate,
      interestCompoundingPeriodType: values.interestCompoundingPeriodType,
      interestPostingPeriodType: values.interestPostingPeriodType,
      interestCalculationType: values.interestCalculationType,
      interestCalculationDaysInYearType: values.interestCalculationDaysInYearType,
      minRequiredOpeningBalance: values.minRequiredOpeningBalance,
      lockinPeriodFrequency: values.lockinPeriodFrequency,
      lockinPeriodFrequencyType: values.lockinPeriodFrequencyType,
      withdrawalFeeForTransfers: values.withdrawalFeeForTransfers,
      allowOverdraft: values.allowOverdraft,
      overdraftLimit: values.overdraftLimit,
      minRequiredBalance: values.minRequiredBalance,
      enforceMinRequiredBalance: values.enforceMinRequiredBalance,
      accountingRule: values.accountingRule ?? 1,
      isDormancyTrackingActive: values.isDormancyTrackingActive,
      daysToInactive: values.daysToInactive,
      daysToDormancy: values.daysToDormancy,
      daysToEscheat: values.daysToEscheat,
      withHoldTax: values.withHoldTax,
    };

    if (isEdit) {
      await updateSavingsProduct(Number(id), payload);
    } else {
      await createSavingsProduct(payload);
    }
    navigate("/deposits/products");
  };

  if (isEdit && productLoading) {
    return (
      <div className="max-w-4xl m-auto space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl m-auto space-y-6">
      <PageHeader
        title={isEdit ? "Edit Savings Product" : "Create Savings Product"}
        description="Fields marked with * are required."
        actions={
          <Button variant="outline" onClick={() => navigate("/deposits/products")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
        }
      />
      <form onSubmit={handleSubmit(handleSave)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Product Details</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1.5">
              <label className="block text-sm font-medium">Product Name *</label>
              <Input {...register("name")} error={errors.name?.message} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">Short Name *</label>
              <Input
                {...register("shortName")}
                error={errors.shortName?.message}
                maxLength={4}
                placeholder="e.g. REG"
              />
            </div>
            <CurrencySelect
              value={watch("currencyCode")}
              onChange={(v) => setValue("currencyCode", v, { shouldValidate: true })}
              error={errors.currencyCode?.message}
            />
            <div className="col-span-2">
              <Textarea {...register("description")} placeholder="Brief product description" />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">Decimal Places *</label>
              <Input
                type="number"
                {...register("digitsAfterDecimal", { valueAsNumber: true })}
                error={errors.digitsAfterDecimal?.message}
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">Nominal Annual Rate (%) *</label>
              <Input
                type="number"
                step="0.01"
                {...register("nominalAnnualInterestRate", { valueAsNumber: true })}
                error={errors.nominalAnnualInterestRate?.message}
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">Compounding Period *</label>
              <Select
                value={String(watch("interestCompoundingPeriodType"))}
                onValueChange={(v) => setValue("interestCompoundingPeriodType", Number(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INTEREST_COMPOUNDING_OPTIONS.map((o) => (
                    <SelectItem key={o.id} value={String(o.id)}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">Posting Period *</label>
              <Select
                value={String(watch("interestPostingPeriodType"))}
                onValueChange={(v) => setValue("interestPostingPeriodType", Number(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INTEREST_POSTING_OPTIONS.map((o) => (
                    <SelectItem key={o.id} value={String(o.id)}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">Calculation Type *</label>
              <Select
                value={String(watch("interestCalculationType"))}
                onValueChange={(v) => setValue("interestCalculationType", Number(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INTEREST_CALCULATION_OPTIONS.map((o) => (
                    <SelectItem key={o.id} value={String(o.id)}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">Days In Year *</label>
              <Select
                value={String(watch("interestCalculationDaysInYearType"))}
                onValueChange={(v) => setValue("interestCalculationDaysInYearType", Number(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DAYS_IN_YEAR_OPTIONS.map((o) => (
                    <SelectItem key={o.id} value={String(o.id)}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">Min Required Opening Balance</label>
              <Input type="number" step="0.01" {...register("minRequiredOpeningBalance", { valueAsNumber: true })} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Lock-in Period &amp; Withdrawal</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">Lock-in Frequency</label>
              <Input type="number" {...register("lockinPeriodFrequency", { valueAsNumber: true })} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">Lock-in Type</label>
              <Select
                value={watch("lockinPeriodFrequencyType") ? String(watch("lockinPeriodFrequencyType")) : ""}
                onValueChange={(v) => setValue("lockinPeriodFrequencyType", v ? Number(v) : undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {LOCKIN_PERIOD_TYPE_OPTIONS.map((o) => (
                    <SelectItem key={o.id} value={String(o.id)}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 flex items-center gap-2 pt-2">
              <Checkbox
                id="withdrawalFeeForTransfers"
                checked={!!watch("withdrawalFeeForTransfers")}
                onCheckedChange={(v) => setValue("withdrawalFeeForTransfers", v === true)}
              />
              <label htmlFor="withdrawalFeeForTransfers" className="text-sm font-medium">
                Withdrawal Fee for Transfers
              </label>
            </div>
            <div className="col-span-2 flex items-center gap-2">
              <Checkbox
                id="enforceMinRequiredBalance"
                checked={!!watch("enforceMinRequiredBalance")}
                onCheckedChange={(v) => setValue("enforceMinRequiredBalance", v === true)}
              />
              <label htmlFor="enforceMinRequiredBalance" className="text-sm font-medium">
                Enforce Min Required Balance
              </label>
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">Min Required Balance</label>
              <Input type="number" step="0.01" {...register("minRequiredBalance", { valueAsNumber: true })} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Overdraft</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="col-span-2 flex items-center gap-2">
              <Checkbox
                id="allowOverdraft"
                checked={!!allowOverdraft}
                onCheckedChange={(v) => setValue("allowOverdraft", v === true)}
              />
              <label htmlFor="allowOverdraft" className="text-sm font-medium">
                Allow Overdraft
              </label>
            </div>
            {allowOverdraft && (
              <div className="space-y-1.5">
                <label className="block text-sm font-medium">Overdraft Limit</label>
                <Input type="number" step="0.01" {...register("overdraftLimit", { valueAsNumber: true })} />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Dormancy Tracking</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="col-span-2 flex items-center gap-2">
              <Checkbox
                id="isDormancyTrackingActive"
                checked={!!isDormancyTrackingActive}
                onCheckedChange={(v) => setValue("isDormancyTrackingActive", v === true)}
              />
              <label htmlFor="isDormancyTrackingActive" className="text-sm font-medium">
                Enable Dormancy Tracking
              </label>
            </div>
            {isDormancyTrackingActive && (
              <>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium">Days to Inactive</label>
                  <Input type="number" {...register("daysToInactive", { valueAsNumber: true })} />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium">Days to Dormancy</label>
                  <Input type="number" {...register("daysToDormancy", { valueAsNumber: true })} />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium">Days to Escheat</label>
                  <Input type="number" {...register("daysToEscheat", { valueAsNumber: true })} />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tax &amp; Accounting</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">Accounting Rule *</label>
              <Select
                value={String(watch("accountingRule"))}
                onValueChange={(v) => setValue("accountingRule", Number(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACCOUNTING_RULE_OPTIONS.map((o) => (
                    <SelectItem key={o.id} value={String(o.id)}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 flex items-center gap-2 pt-2">
              <Checkbox
                id="withHoldTax"
                checked={!!withHoldTax}
                onCheckedChange={(v) => setValue("withHoldTax", v === true)}
              />
              <label htmlFor="withHoldTax" className="text-sm font-medium">
                Withhold Tax
              </label>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button variant="outline" type="button" onClick={() => navigate("/deposits/products")}>
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

export default SavingsProductFormPage;
