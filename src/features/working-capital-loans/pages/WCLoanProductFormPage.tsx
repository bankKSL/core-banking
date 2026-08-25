import { type FC, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Save, Loader2, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/shared/ErrorState";
import { useToast } from "@/components/ui/toast";
import { createWCLoanProductSchema, type CreateWCLoanProductFormValues } from "../schemas/workingCapitalLoan.schema";
import { useCreateWCLoanProduct, useWCLoanProductTemplate, useDelinquencyBuckets } from "../hooks/useWCLoanQueries";
import { FREQUENCY_TYPE_OPTIONS, DELINQUENCY_START_TYPE_OPTIONS } from "../constants/status";

interface PaymentAllocationOrderItem {
  paymentAllocationRule: string;
  order: number;
}

interface PaymentAllocationItem {
  transactionType: string;
  paymentAllocationOrder: PaymentAllocationOrderItem[];
}

const WCLoanProductFormPage: FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { success: toastSuccess } = useToast();
  const { data: template, isLoading: templateLoading } = useWCLoanProductTemplate();
  const { data: buckets = [] } = useDelinquencyBuckets();
  const createMutation = useCreateWCLoanProduct();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { errors },
  } = useForm<CreateWCLoanProductFormValues>({
    resolver: zodResolver(createWCLoanProductSchema) as never,
    mode: "onChange",
    defaultValues: {
      name: "",
      shortName: "",
      description: "",
      currencyCode: "USD",
      digitsAfterDecimal: 2,
      inMultiplesOf: 1,
      amortizationType: "EIR",
      npvDayCount: 360,
      principal: undefined,
      periodPaymentRate: undefined,
      minPeriodPaymentRate: undefined,
      maxPeriodPaymentRate: undefined,
      repaymentEvery: 30,
      repaymentFrequencyType: "DAYS",
      delinquencyBucketId: undefined,
      delinquencyGraceDays: 3,
      delinquencyStartType: "DISBURSEMENT",
      accountingRule: "NONE",
    },
  });

  const onSubmit = async (values: CreateWCLoanProductFormValues) => {
    try {
      const payload = {
        ...values,
        paymentAllocation: [
          {
            transactionType: "DEFAULT",
            paymentAllocationOrder: [
              { paymentAllocationRule: "DUE_PENALTY", order: 1 },
              { paymentAllocationRule: "DUE_FEE", order: 2 },
              { paymentAllocationRule: "DUE_PRINCIPAL", order: 3 },
              { paymentAllocationRule: "IN_ADVANCE_PENALTY", order: 4 },
              { paymentAllocationRule: "IN_ADVANCE_FEE", order: 5 },
              { paymentAllocationRule: "IN_ADVANCE_PRINCIPAL", order: 6 },
            ],
          },
        ],
      };
      const minMaxFields = ["minPrincipal", "maxPrincipal", "minPeriodPaymentRate", "maxPeriodPaymentRate"];
      for (const field of minMaxFields) {
        if (
          !(payload[field as keyof typeof payload] as number | undefined) ||
          (payload[field as keyof typeof payload] as number) <= 0
        ) {
          delete payload[field as keyof typeof payload];
        }
      }
      await createMutation.mutateAsync(payload);
      toastSuccess(t("Product created successfully"));
      navigate("/working-capital-loans/products");
    } catch {
      // error handled by mutation state
    }
  };

  if (templateLoading) {
    return (
      <div className="max-w-6xl m-auto space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  const currencyOptions = template?.currencyOptions ?? [];
  const freqOptions =
    template?.repaymentFrequencyTypeOptions ??
    FREQUENCY_TYPE_OPTIONS.map((o, i) => ({ id: i, code: o.value, value: o.label }));
  const bucketOptions = template?.delinquencyBucketOptions ?? buckets.map((b) => ({ id: b.id, name: b.name }));

  return (
    <div className="max-w-6xl m-auto space-y-6">
      <PageHeader
        title={t("Create Working Capital Loan Product")}
        description={t("Configure revolving credit product terms")}
        actions={
          <Button variant="outline" onClick={() => navigate("/working-capital-loans/products")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> {t("Back")}
          </Button>
        }
      />

      {createMutation.isError && (
        <ErrorState
          title={t("Failed to create product")}
          message={createMutation.error?.message ?? t("An unexpected error occurred.")}
          onRetry={() => createMutation.reset()}
        />
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("Product Details")}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-x-6 gap-y-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Name")} *</label>
              <Input {...register("name")} error={errors.name?.message} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Short Name")} *</label>
              <Input {...register("shortName")} error={errors.shortName?.message} />
            </div>
            <div className="space-y-1.5 col-span-2">
              <label className="block text-sm font-medium">{t("Description")}</label>
              <Textarea {...register("description")} rows={3} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Currency")} *</label>
              <Select
                value={watch("currencyCode")}
                onValueChange={(v) => setValue("currencyCode", v, { shouldValidate: true })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("Select currency")} />
                </SelectTrigger>
                <SelectContent>
                  {currencyOptions.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.code} ({c.name})
                    </SelectItem>
                  ))}
                  {currencyOptions.length === 0 && <SelectItem value="USD">USD</SelectItem>}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Decimal Places")}</label>
              <Input
                type="number"
                {...register("digitsAfterDecimal", { valueAsNumber: true })}
                error={errors.digitsAfterDecimal?.message}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("EIR & Amortization")}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-x-6 gap-y-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Amortization Type")} *</label>
              <Input value="EIR (Effective Interest Rate)" disabled />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("NPV Day Count")} *</label>
              <Input
                type="number"
                {...register("npvDayCount", { valueAsNumber: true })}
                error={errors.npvDayCount?.message}
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Period Payment Rate (%)")} *</label>
              <Input
                type="number"
                step="0.01"
                {...register("periodPaymentRate", {
                  onChange: () => {
                    trigger("minPeriodPaymentRate");
                    trigger("maxPeriodPaymentRate");
                  },
                })}
                error={errors.periodPaymentRate?.message}
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Min Rate (%)")}</label>
              <Input
                type="number"
                step="0.01"
                {...register("minPeriodPaymentRate", {
                  onChange: () => {
                    trigger("periodPaymentRate");
                    trigger("maxPeriodPaymentRate");
                  },
                })}
                error={errors.minPeriodPaymentRate?.message}
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Max Rate (%)")}</label>
              <Input
                type="number"
                step="0.01"
                {...register("maxPeriodPaymentRate", {
                  onChange: () => {
                    trigger("periodPaymentRate");
                    trigger("minPeriodPaymentRate");
                  },
                })}
                error={errors.maxPeriodPaymentRate?.message}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("Principal & Repayment")}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-x-6 gap-y-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Principal")} *</label>
              <Input
                type="number"
                step="0.01"
                {...register("principal", {
                  onChange: () => {
                    trigger("minPrincipal");
                    trigger("maxPrincipal");
                  },
                })}
                error={errors.principal?.message}
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Min Principal")}</label>
              <Input
                type="number"
                step="0.01"
                {...register("minPrincipal", {
                  onChange: () => {
                    trigger("principal");
                    trigger("maxPrincipal");
                  },
                })}
                error={errors.minPrincipal?.message}
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Max Principal")}</label>
              <Input
                type="number"
                step="0.01"
                {...register("maxPrincipal", {
                  onChange: () => {
                    trigger("principal");
                    trigger("minPrincipal");
                  },
                })}
                error={errors.maxPrincipal?.message}
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Repayment Every")} *</label>
              <Input
                type="number"
                {...register("repaymentEvery", { valueAsNumber: true })}
                error={errors.repaymentEvery?.message}
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Repayment Frequency")} *</label>
              <Select
                value={watch("repaymentFrequencyType")}
                onValueChange={(v) => setValue("repaymentFrequencyType", v, { shouldValidate: true })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {freqOptions.map((o) => (
                    <SelectItem key={o.id} value={o.code}>
                      {o.value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("Delinquency Settings")}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-x-6 gap-y-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Delinquency Bucket")} *</label>
              <Select
                value={watch("delinquencyBucketId") ? String(watch("delinquencyBucketId")) : ""}
                onValueChange={(v) => setValue("delinquencyBucketId", Number(v), { shouldValidate: true })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("Select bucket")} />
                </SelectTrigger>
                <SelectContent>
                  {bucketOptions.map((b) => (
                    <SelectItem key={b.id} value={String(b.id)}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.delinquencyBucketId && (
                <p className="text-sm text-red-500">{errors.delinquencyBucketId.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Grace Days")}</label>
              <Input
                type="number"
                {...register("delinquencyGraceDays", { valueAsNumber: true })}
                error={errors.delinquencyGraceDays?.message}
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Delinquency Start Type")}</label>
              <Select
                value={watch("delinquencyStartType") ?? "DISBURSEMENT"}
                onValueChange={(v) => setValue("delinquencyStartType", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DELINQUENCY_START_TYPE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Accounting Rule")}</label>
              <Select value={watch("accountingRule") ?? "NONE"} onValueChange={(v) => setValue("accountingRule", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(template?.accountingRuleOptions ?? []).map((o) => (
                    <SelectItem key={o?.id} value={o?.id}>
                      {o.value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate("/working-capital-loans/products")}>
            {t("Cancel")}
          </Button>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" />
            {t("Create Product")}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default WCLoanProductFormPage;
