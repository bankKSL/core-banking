import React, { useState, useCallback, useMemo, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ErrorState } from "@/components/shared/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";
import { useCharge, useChargeTemplate, useCreateCharge, useUpdateCharge } from "../hooks/useCharges";
import type { EnumOption } from "../api/charges";

const PERCENTAGE_CALC_TYPES = [2, 3, 4, 5];

const PERIODIC_TIME_TYPES = [6, 7, 8, 11];

const ChargeFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;

  const { data: template, isLoading: templateLoading } = useChargeTemplate();
  const { data: existingCharge, isLoading: chargeLoading } = useCharge(id ? Number(id) : undefined);

  const createMutation = useCreateCharge();
  const updateMutation = useUpdateCharge();
  const [mutationError, setMutationError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [chargeAppliesTo, setChargeAppliesTo] = useState<number>(1);
  const [currencyCode, setCurrencyCode] = useState("");
  const [chargeTimeType, setChargeTimeType] = useState<number>(0);
  const [chargeCalculationType, setChargeCalculationType] = useState<number>(0);
  const [amount, setAmount] = useState("");
  const [chargePaymentMode, setChargePaymentMode] = useState<number>(0);
  const [penalty, setPenalty] = useState(false);
  const [active, setActive] = useState(false);
  const [minCap, setMinCap] = useState("");
  const [maxCap, setMaxCap] = useState("");
  const [incomeAccountId, setIncomeAccountId] = useState<number | null>(null);
  const [taxGroupId, setTaxGroupId] = useState<number | null>(null);
  const [feeFrequency, setFeeFrequency] = useState<number | null>(null);
  const [feeInterval, setFeeInterval] = useState("");
  const [feeOnMonthDay, setFeeOnMonthDay] = useState("");
  const [paymentTypeId, setPaymentTypeId] = useState<number | null>(null);
  const [enablePaymentType, setEnablePaymentType] = useState(false);
  const [enableFreeWithdrawalCharge, setEnableFreeWithdrawalCharge] = useState(false);
  const [freeWithdrawalFrequency, setFreeWithdrawalFrequency] = useState<number | null>(null);

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
    setName(existingCharge.name);
    setChargeAppliesTo(existingCharge.chargeAppliesTo?.id);
    setCurrencyCode(existingCharge.currencyCode);
    setChargeTimeType(existingCharge.chargeTimeType?.id);
    setChargeCalculationType(existingCharge.chargeCalculationType?.id);
    setAmount(String(existingCharge.amount));
    setChargePaymentMode(existingCharge.chargePaymentMode?.id ?? 0);
    setPenalty(existingCharge.penalty);
    setActive(existingCharge.active);
    setMinCap(existingCharge.minCap != null ? String(existingCharge.minCap) : "");
    setMaxCap(existingCharge.maxCap != null ? String(existingCharge.maxCap) : "");
    setIncomeAccountId(existingCharge.incomeAccountId);
    setTaxGroupId(existingCharge.taxGroupId);
    setFeeFrequency(existingCharge.feeFrequency?.id ?? null);
    setFeeInterval(existingCharge.feeInterval != null ? String(existingCharge.feeInterval) : "");
    setFeeOnMonthDay(existingCharge.feeOnMonthDay ?? "");
    setPaymentTypeId(existingCharge.paymentTypeId);
    setEnablePaymentType(existingCharge.enablePaymentType ?? false);
  }, [existingCharge]);



  useEffect(() => {
    if (chargeTimeType === 9) setPenalty(true);
  }, [chargeTimeType]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setMutationError(null);
      try {
        const base = {
          name,
          chargeAppliesTo,
          currencyCode,
          chargeTimeType,
          chargeCalculationType,
          amount: Number(amount),
          active,
          locale: "en",
        };

        const extra: Record<string, unknown> = {};

        if (isLoan) extra.chargePaymentMode = chargePaymentMode;
        if (penalty) extra.penalty = true;
        if (isPercentage) {
          if (minCap) extra.minCap = Number(minCap);
          if (maxCap) extra.maxCap = Number(maxCap);
        }
        if (incomeAccountId) extra.incomeAccountId = incomeAccountId;
        if (taxGroupId) extra.taxGroupId = taxGroupId;
        if (isPeriodic && feeFrequency != null) extra.feeFrequency = feeFrequency;
        if (isMonthlyOrAnnual) {
          if (feeInterval) extra.feeInterval = Number(feeInterval);
          if (feeOnMonthDay) {
            extra.feeOnMonthDay = feeOnMonthDay;
            extra.monthDayFormat = "dd";
          }
        }
        if (enablePaymentType && paymentTypeId) {
          extra.enablePaymentType = true;
          extra.paymentTypeId = paymentTypeId;
        }

        if (isEdit) {
          await updateMutation.mutateAsync({ id: Number(id), payload: { ...base, ...extra } });
        } else {
          await createMutation.mutateAsync({ ...base, ...extra });
        }
        navigate("/charges");
      } catch (err: unknown) {
        const error = err as { response?: { data?: { errors?: Array<{ defaultUserMessage: string }> } } };
        const msg = error?.response?.data?.errors?.[0]?.defaultUserMessage ?? "Failed to save charge.";
        setMutationError(msg);
      }
    },
    [
      name,
      chargeAppliesTo,
      currencyCode,
      chargeTimeType,
      chargeCalculationType,
      amount,
      active,
      penalty,
      isLoan,
      chargePaymentMode,
      isPercentage,
      minCap,
      maxCap,
      incomeAccountId,
      taxGroupId,
      isPeriodic,
      feeFrequency,
      isMonthlyOrAnnual,
      feeInterval,
      feeOnMonthDay,
      enablePaymentType,
      paymentTypeId,
      isEdit,
      id,
      createMutation,
      updateMutation,
      navigate,
    ],
  );

  const isLoading = templateLoading || (isEdit && chargeLoading);

  if (isLoading) {
    return (
      <div className="p-6 max-w-3xl m-auto space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-64" />
        <Card>
          <CardContent className="space-y-4 py-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-10 bg-gray-200 dark:bg-gray-700 rounded-md" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

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

      {mutationError && <ErrorState message={mutationError} />}

      <form onSubmit={handleSubmit}>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="chName">Name *</Label>
              <Input
                id="chName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Processing Fee"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Charge Applies To *</Label>
                <Select
                  value={String(chargeAppliesTo)}
                  onValueChange={(v) => {
                    setChargeAppliesTo(Number(v));
                    setChargeTimeType(0);
                    setChargeCalculationType(0);
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
              </div>

              <div>
                <Label>Currency *</Label>
                <Select value={currencyCode} onValueChange={setCurrencyCode}>
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
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Time Type *</Label>
                <Select
                  value={chargeTimeType ? String(chargeTimeType) : ""}
                  onValueChange={(v) => setChargeTimeType(Number(v))}
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
              </div>

              <div>
                <Label>Calculation Type *</Label>
                <Select
                  value={chargeCalculationType ? String(chargeCalculationType) : ""}
                  onValueChange={(v) => setChargeCalculationType(Number(v))}
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
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="chAmount">Amount *</Label>
                <Input
                  id="chAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>

              {isPercentage && (
                <>
                  <div>
                    <Label htmlFor="chMinCap">Min Cap</Label>
                    <Input
                      id="chMinCap"
                      type="number"
                      step="0.01"
                      min="0"
                      value={minCap}
                      onChange={(e) => setMinCap(e.target.value)}
                      placeholder="Optional"
                    />
                  </div>
                  <div>
                    <Label htmlFor="chMaxCap">Max Cap</Label>
                    <Input
                      id="chMaxCap"
                      type="number"
                      step="0.01"
                      min="0"
                      value={maxCap}
                      onChange={(e) => setMaxCap(e.target.value)}
                      placeholder="Optional"
                    />
                  </div>
                </>
              )}
            </div>

            {isLoan && (
              <div>
                <Label>Payment Mode *</Label>
                <Select value={String(chargePaymentMode)} onValueChange={(v) => setChargePaymentMode(Number(v))}>
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
              </div>
            )}

            <div className="flex items-center gap-6 pt-2">
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={penalty}
                  onCheckedChange={(c) => {
                    if (chargeTimeType !== 9) setPenalty(c === true);
                  }}
                  disabled={chargeTimeType === 9 || chargeTimeType === 1}
                />
                Penalty
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={active} onCheckedChange={(c) => setActive(c === true)} />
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
                  <Select
                    value={feeFrequency != null ? String(feeFrequency) : ""}
                    onValueChange={(v) => setFeeFrequency(Number(v))}
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
                </div>

                {isMonthlyOrAnnual && (
                  <>
                    <div>
                      <Label htmlFor="chInterval">Fee Interval (months)</Label>
                      <Input
                        id="chInterval"
                        type="number"
                        min="1"
                        max="12"
                        value={feeInterval}
                        onChange={(e) => setFeeInterval(e.target.value)}
                        placeholder="e.g. 1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="chMonthDay">Day of Month</Label>
                      <Input
                        id="chMonthDay"
                        type="number"
                        min="1"
                        max="31"
                        value={feeOnMonthDay}
                        onChange={(e) => setFeeOnMonthDay(e.target.value)}
                        placeholder="DD"
                      />
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
                <Select
                  value={incomeAccountId ? String(incomeAccountId) : ""}
                  onValueChange={(v) => setIncomeAccountId(v ? Number(v) : null)}
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
              </div>

              <div>
                <Label>Tax Group</Label>
                <Select
                  value={taxGroupId ? String(taxGroupId) : ""}
                  onValueChange={(v) => setTaxGroupId(v ? Number(v) : null)}
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
              </div>
            </div>

            {isSavingsWithdrawal && (
              <div className="space-y-4 border-t border-gray-100 dark:border-gray-700 pt-4">
                <div className="flex items-center gap-2">
                  <Checkbox checked={enablePaymentType} onCheckedChange={(c) => setEnablePaymentType(c === true)} />
                  <Label className="mb-0">Restrict to Payment Type</Label>
                </div>
                {enablePaymentType && (
                  <div>
                    <Label>Payment Type</Label>
                    <Select
                      value={paymentTypeId ? String(paymentTypeId) : ""}
                      onValueChange={(v) => setPaymentTypeId(v ? Number(v) : null)}
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
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={enableFreeWithdrawalCharge}
                    onCheckedChange={(c) => setEnableFreeWithdrawalCharge(c === true)}
                  />
                  <Label className="mb-0">Enable Free Withdrawal</Label>
                </div>
                {enableFreeWithdrawalCharge && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="chFreeWf">Free Withdrawal Frequency</Label>
                      <Input
                        id="chFreeWf"
                        type="number"
                        min="0"
                        value={freeWithdrawalFrequency ?? ""}
                        onChange={(e) => setFreeWithdrawalFrequency(e.target.value ? Number(e.target.value) : null)}
                        placeholder="0"
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
