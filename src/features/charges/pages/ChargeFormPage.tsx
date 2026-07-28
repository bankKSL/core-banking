import { type FC, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { ErrorState } from "@/components/shared/ErrorState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useCharge, useChargeTemplate, useCreateCharge, useUpdateCharge } from "../hooks/useCharges";
import type { EnumOption } from "../api/charges";

const PERCENTAGE_CALC_TYPES = [2, 3, 4, 5];
const PERIODIC_TIME_TYPES = [6, 7, 8, 11];

const chargeFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  chargeAppliesTo: z.number({ message: "Charge applies to is required" }).int().min(1),
  currencyCode: z.string().min(1, "Currency is required"),
  chargeTimeType: z.number().int(),
  chargeCalculationType: z.number().int(),
  amount: z.string().min(1, "Amount is required"),
  chargePaymentMode: z.number().int(),
  penalty: z.boolean(),
  active: z.boolean(),
  minCap: z.string().optional().default(""),
  maxCap: z.string().optional().default(""),
  incomeAccountId: z.number().int().nullable().default(null),
  taxGroupId: z.number().int().nullable().default(null),
  feeFrequency: z.number().int().nullable().default(null),
  feeInterval: z.string().optional().default(""),
  feeOnMonthDay: z.string().optional().default(""),
  paymentTypeId: z.number().int().nullable().default(null),
  enablePaymentType: z.boolean().default(false),
  enableFreeWithdrawalCharge: z.boolean().default(false),
  freeWithdrawalFrequency: z.number().int().nullable().default(null),
});

type ChargeFormValues = z.input<typeof chargeFormSchema>;

const ChargeFormPage: FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;

  const { data: template, isLoading: templateLoading } = useChargeTemplate();
  const { data: existingCharge, isLoading: chargeLoading } = useCharge(id ? Number(id) : undefined);

  const createMutation = useCreateCharge();
  const updateMutation = useUpdateCharge();

  const {
    control,
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ChargeFormValues>({
    resolver: zodResolver(chargeFormSchema),
    defaultValues: {
      name: "",
      chargeAppliesTo: 1,
      currencyCode: "",
      chargeTimeType: 0,
      chargeCalculationType: 0,
      amount: "",
      chargePaymentMode: 0,
      penalty: false,
      active: false,
      minCap: "",
      maxCap: "",
      incomeAccountId: null,
      taxGroupId: null,
      feeFrequency: null,
      feeInterval: "",
      feeOnMonthDay: "",
      paymentTypeId: null,
      enablePaymentType: false,
      enableFreeWithdrawalCharge: false,
      freeWithdrawalFrequency: null,
    },
  });

  const chargeAppliesTo = watch("chargeAppliesTo");
  const chargeTimeType = watch("chargeTimeType");
  const chargeCalculationType = watch("chargeCalculationType");

  const chargeAppliesToOptions: EnumOption[] = template?.chargeAppliesToOptions ?? [];
  const currencyOptions = template?.currencyOptions ?? [];
  const glAccountOptions = Array.isArray(template?.incomeOrLiabilityAccountOptions) ? template.incomeOrLiabilityAccountOptions : [];
  const taxGroupOptions = Array.isArray(template?.taxGroupOptions) ? template.taxGroupOptions : [];
  const feeFrequencyOptions = Array.isArray(template?.feeFrequencyOptions) ? template.feeFrequencyOptions : [];
  const paymentTypeOptions = Array.isArray(template?.paymentTypeOptions) ? template.paymentTypeOptions : [];

  const timeTypeOptions: EnumOption[] = useMemo(() => {
    if (!template) return [];
    switch (chargeAppliesTo) {
      case 1:
        return template.loanChargeTimeTypeOptions;
      case 2:
        return template.savingsChargeTimeTypeOptions;
      case 3:
        return template.clientChargeTimeTypeOptions;
      case 4:
        return template.sharesChargeTimeTypeOptions;
      default:
        return [];
    }
  }, [template, chargeAppliesTo]);

  const calcTypeOptions: EnumOption[] = useMemo(() => {
    if (!template) return [];
    switch (chargeAppliesTo) {
      case 1:
        return template.loanChargeCalculationTypeOptions;
      case 2:
        return template.savingsChargeCalculationTypeOptions;
      case 3:
        return template.clientChargeCalculationTypeOptions;
      case 4:
        return template.sharesChargeCalculationTypeOptions;
      default:
        return [];
    }
  }, [template, chargeAppliesTo]);

  const isPercentage = PERCENTAGE_CALC_TYPES.includes(chargeCalculationType);
  const isPeriodic = PERIODIC_TIME_TYPES.includes(chargeTimeType);
  const isMonthlyOrAnnual = chargeTimeType === 6 || chargeTimeType === 7;
  const isLoan = chargeAppliesTo === 1;
  const isSavingsWithdrawal = chargeAppliesTo === 2 && chargeTimeType === 5;

  useEffect(() => {
    if (!existingCharge) return;
    reset({
      name: existingCharge.name,
      chargeAppliesTo: existingCharge.chargeAppliesTo?.id,
      currencyCode: existingCharge.currencyCode,
      chargeTimeType: existingCharge.chargeTimeType?.id,
      chargeCalculationType: existingCharge.chargeCalculationType?.id,
      amount: String(existingCharge.amount),
      chargePaymentMode: existingCharge.chargePaymentMode?.id ?? 0,
      penalty: existingCharge.penalty,
      active: existingCharge.active,
      minCap: existingCharge.minCap != null ? String(existingCharge.minCap) : "",
      maxCap: existingCharge.maxCap != null ? String(existingCharge.maxCap) : "",
      incomeAccountId: existingCharge.incomeAccountId,
      taxGroupId: existingCharge.taxGroupId,
      feeFrequency: existingCharge.feeFrequency?.id ?? null,
      feeInterval: existingCharge.feeInterval != null ? String(existingCharge.feeInterval) : "",
      feeOnMonthDay: existingCharge.feeOnMonthDay ?? "",
      paymentTypeId: existingCharge.paymentTypeId,
      enablePaymentType: existingCharge.enablePaymentType ?? false,
      enableFreeWithdrawalCharge: existingCharge.enableFreeWithdrawalCharge ?? false,
      freeWithdrawalFrequency: existingCharge.freeWithdrawalFrequency ?? null,
    });
  }, [existingCharge, reset]);

  useEffect(() => {
    if (chargeTimeType === 9) setValue("penalty", true);
  }, [chargeTimeType, setValue]);

  const onSubmit = useCallback(
    async (values: ChargeFormValues) => {
      const base = {
        name: values.name,
        chargeAppliesTo: values.chargeAppliesTo,
        currencyCode: values.currencyCode,
        chargeTimeType: values.chargeTimeType,
        chargeCalculationType: values.chargeCalculationType,
        amount: Number(values.amount),
        active: values.active,
        locale: "en",
      };

      const extra: Record<string, unknown> = {};

      if (isLoan) extra.chargePaymentMode = values.chargePaymentMode;
      if (values.penalty) extra.penalty = true;
      if (isPercentage) {
        if (values.minCap) extra.minCap = Number(values.minCap);
        if (values.maxCap) extra.maxCap = Number(values.maxCap);
      }
      if (values.incomeAccountId) extra.incomeAccountId = values.incomeAccountId;
      if (values.taxGroupId) extra.taxGroupId = values.taxGroupId;
      if (isPeriodic && values.feeFrequency != null) extra.feeFrequency = values.feeFrequency;
      if (isMonthlyOrAnnual) {
        if (values.feeInterval) extra.feeInterval = Number(values.feeInterval);
        if (values.feeOnMonthDay) {
          extra.feeOnMonthDay = values.feeOnMonthDay;
          extra.monthDayFormat = "dd";
        }
      }
      if (values.enablePaymentType && values.paymentTypeId) {
        extra.enablePaymentType = true;
        extra.paymentTypeId = values.paymentTypeId;
      }

      if (isEdit) {
        await updateMutation.mutateAsync({ id: Number(id), payload: { ...base, ...extra } });
      } else {
        await createMutation.mutateAsync({ ...base, ...extra });
      }
      navigate("/charges");
    },
    [isEdit, id, isLoan, isPercentage, isPeriodic, isMonthlyOrAnnual, createMutation, updateMutation, navigate],
  );

  const isLoading = templateLoading || (isEdit && chargeLoading);

  if (isLoading) {
    return (
      <div className="p-6 max-w-3xl m-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
        <Card>
          <CardContent className="space-y-4 py-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  const saveError = createMutation.error ?? updateMutation.error;

  return (
    <div className="p-6 max-w-3xl m-auto space-y-6">
      <PageHeader
        title={isEdit ? "Edit Charge" : "New Charge"}
        description={isEdit ? "Update charge definition" : "Define a new fee or penalty"}
        actions={
          <Button variant="outline" onClick={() => navigate("/charges")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
        }
      />

      {(createMutation.isError || updateMutation.isError) && (
        <ErrorState
          title="Failed to save charge"
          message={saveError instanceof Error ? saveError.message : "An unexpected error occurred."}
          onRetry={() => {
            createMutation.reset();
            updateMutation.reset();
          }}
        />
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="chName">Name *</Label>
              <Input id="chName" {...register("name")} placeholder="e.g. Processing Fee" />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Charge Applies To *</Label>
                <Controller
                  name="chargeAppliesTo"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={String(field.value)}
                      onValueChange={(v) => {
                        field.onChange(Number(v));
                        setValue("chargeTimeType", 0);
                        setValue("chargeCalculationType", 0);
                      }}
                      disabled={isEdit}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {chargeAppliesToOptions.map((o) => (
                          <SelectItem key={o.id} value={String(o.id)}>
                            {o.value}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.chargeAppliesTo && <p className="text-xs text-red-500">{errors.chargeAppliesTo.message}</p>}
              </div>

              <div>
                <Label>Currency *</Label>
                <Controller
                  name="currencyCode"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        {currencyOptions.map((c) => (
                          <SelectItem key={c.code} value={c.code}>
                            {c.name} ({c.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.currencyCode && <p className="text-xs text-red-500">{errors.currencyCode.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Time Type *</Label>
                <Controller
                  name="chargeTimeType"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value ? String(field.value) : ""}
                      onValueChange={(v) => field.onChange(Number(v))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select time" />
                      </SelectTrigger>
                      <SelectContent>
                        {timeTypeOptions.map((o) => (
                          <SelectItem key={o.id} value={String(o.id)}>
                            {o.value}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div>
                <Label>Calculation Type *</Label>
                <Controller
                  name="chargeCalculationType"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value ? String(field.value) : ""}
                      onValueChange={(v) => field.onChange(Number(v))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select calculation" />
                      </SelectTrigger>
                      <SelectContent>
                        {calcTypeOptions.map((o) => (
                          <SelectItem key={o.id} value={String(o.id)}>
                            {o.value}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="chAmount">Amount *</Label>
                <Input id="chAmount" type="number" step="0.01" min="0" {...register("amount")} placeholder="0.00" />
                {errors.amount && <p className="text-xs text-red-500">{errors.amount.message}</p>}
              </div>

              {isPercentage && (
                <>
                  <div>
                    <Label htmlFor="chMinCap">Min Cap</Label>
                    <Input id="chMinCap" type="number" step="0.01" min="0" {...register("minCap")} placeholder="Optional" />
                  </div>
                  <div>
                    <Label htmlFor="chMaxCap">Max Cap</Label>
                    <Input id="chMaxCap" type="number" step="0.01" min="0" {...register("maxCap")} placeholder="Optional" />
                  </div>
                </>
              )}
            </div>

            {isLoan && (
              <div>
                <Label>Payment Mode *</Label>
                <Controller
                  name="chargePaymentMode"
                  control={control}
                  render={({ field }) => (
                    <Select value={String(field.value)} onValueChange={(v) => field.onChange(Number(v))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {(template?.chargePaymetModeOptions ?? []).map((o) => (
                          <SelectItem key={o.id} value={String(o.id)}>
                            {o.value}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            )}

            <div className="flex items-center gap-6 pt-2">
              <label className="flex items-center gap-2 text-sm">
                <Controller
                  name="penalty"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(c) => {
                        if (chargeTimeType !== 9) field.onChange(c === true);
                      }}
                      disabled={chargeTimeType === 9 || chargeTimeType === 1}
                    />
                  )}
                />
                Penalty
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Controller
                  name="active"
                  control={control}
                  render={({ field }) => (
                    <Checkbox checked={field.value} onCheckedChange={(c) => field.onChange(c === true)} />
                  )}
                />
                Active
              </label>
            </div>

            {chargeTimeType === 1 && <p className="text-xs text-gray-500">Disbursement charges cannot be penalties.</p>}
          </CardContent>
        </Card>

        {isPeriodic && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Fee Schedule</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Fee Frequency</Label>
                  <Controller
                    name="feeFrequency"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value != null ? String(field.value) : ""}
                        onValueChange={(v) => field.onChange(v ? Number(v) : null)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {feeFrequencyOptions.map((o) => (
                            <SelectItem key={o.id} value={String(o.id)}>
                              {o.value}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                {isMonthlyOrAnnual && (
                  <>
                    <div>
                      <Label htmlFor="chInterval">Fee Interval (months)</Label>
                      <Input id="chInterval" type="number" min="1" max="12" {...register("feeInterval")} placeholder="e.g. 1" />
                    </div>
                    <div>
                      <Label htmlFor="chMonthDay">Day of Month</Label>
                      <Input id="chMonthDay" type="number" min="1" max="31" {...register("feeOnMonthDay")} placeholder="DD" />
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Accounting & Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>GL Income Account</Label>
                <Controller
                  name="incomeAccountId"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value ? String(field.value) : ""}
                      onValueChange={(v) => field.onChange(v ? Number(v) : null)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Optional" />
                      </SelectTrigger>
                      <SelectContent>
                        {glAccountOptions?.map((a) => (
                          <SelectItem key={a.id} value={String(a.id)}>
                            {a.name} ({a.glCode})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div>
                <Label>Tax Group</Label>
                <Controller
                  name="taxGroupId"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value ? String(field.value) : ""}
                      onValueChange={(v) => field.onChange(v ? Number(v) : null)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Optional" />
                      </SelectTrigger>
                      <SelectContent>
                        {taxGroupOptions.map((t) => (
                          <SelectItem key={t.id} value={String(t.id)}>
                            {t.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            {isSavingsWithdrawal && (
              <div className="space-y-4 border-t border-gray-100 dark:border-gray-700 pt-4">
                <div className="flex items-center gap-2">
                  <Controller
                    name="enablePaymentType"
                    control={control}
                    render={({ field }) => (
                      <Checkbox checked={field.value} onCheckedChange={(c) => field.onChange(c === true)} />
                    )}
                  />
                  <Label className="mb-0">Restrict to Payment Type</Label>
                </div>
                {watch("enablePaymentType") && (
                  <div>
                    <Label>Payment Type</Label>
                    <Controller
                      name="paymentTypeId"
                      control={control}
                      render={({ field }) => (
                        <Select
                          value={field.value ? String(field.value) : ""}
                          onValueChange={(v) => field.onChange(v ? Number(v) : null)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            {paymentTypeOptions.map((p) => (
                              <SelectItem key={p.id} value={String(p.id)}>
                                {p.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Controller
                    name="enableFreeWithdrawalCharge"
                    control={control}
                    render={({ field }) => (
                      <Checkbox checked={field.value} onCheckedChange={(c) => field.onChange(c === true)} />
                    )}
                  />
                  <Label className="mb-0">Enable Free Withdrawal</Label>
                </div>
                {watch("enableFreeWithdrawalCharge") && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="chFreeWf">Free Withdrawal Frequency</Label>
                      <Controller
                        name="freeWithdrawalFrequency"
                        control={control}
                        render={({ field }) => (
                          <Input
                            id="chFreeWf"
                            type="number"
                            min="0"
                            value={field.value ?? ""}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                            placeholder="0"
                          />
                        )}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate("/charges")}>
            Cancel
          </Button>
          <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
            {createMutation.isPending || updateMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" /> {isEdit ? "Update Charge" : "Create Charge"}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ChargeFormPage;
