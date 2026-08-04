import React, { useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Save, PiggyBank, ExternalLink, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { OfficeSelect } from "@/components/shared/OfficeSelect";
import { ClientSearch } from "@/components/shared/ClientSearch";
import { SavingProductSelect } from "@/components/shared/SavingProductSelect";
import {
  useCreateSavingsAccount,
  useUpdateSavingsAccount,
  useSavingsAccount,
  useSavingsTemplate,
} from "@/features/deposits";

const INTEREST_COMPOUNDING_OPTIONS = [
  { id: 1, label: "Daily" },
  { id: 4, label: "Monthly" },
  { id: 5, label: "Quarterly" },
  { id: 6, label: "Semi-Annual" },
  { id: 7, label: "Annual" },
];

const INTEREST_POSTING_OPTIONS = [
  { id: 1, label: "Monthly" },
  { id: 4, label: "Quarterly" },
  { id: 5, label: "Semi-Annual" },
  { id: 6, label: "Annual" },
  { id: 8, label: "Daily" },
  { id: 9, label: "Weekly" },
  { id: 11, label: "At Maturity" },
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

const savingsAccountSchema = z.object({
  officeId: z.string().min(1, "Office is required"),
  clientId: z.number().min(1, "Client is required"),
  productId: z.number().min(1, "Product is required"),
  externalId: z.string().optional(),
  submittedOnDate: z.string().min(1, "Date is required"),
  nominalAnnualInterestRate: z.string().optional(),
  interestCompoundingPeriodType: z.string().optional(),
  interestPostingPeriodType: z.string().optional(),
  interestCalculationType: z.string().optional(),
  interestCalculationDaysInYearType: z.string().optional(),
  minRequiredOpeningBalance: z.string().optional(),
  lockinPeriodFrequency: z.string().optional(),
  lockinPeriodFrequencyType: z.string().optional(),
  withdrawalFeeForTransfers: z.boolean().optional(),
  allowOverdraft: z.boolean().optional(),
  overdraftLimit: z.string().optional(),
  enforceMinRequiredBalance: z.boolean().optional(),
  minRequiredBalance: z.string().optional(),
  lienAllowed: z.boolean().optional(),
  maxAllowedLienLimit: z.string().optional(),
  withHoldTax: z.boolean().optional(),
  fieldOfficerId: z.string().optional(),
  dateFormat: z.string(),
  locale: z.string(),
});

type SavingsAccountFormValues = z.infer<typeof savingsAccountSchema>;

const CreateDepositAccountPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const clientIdParam = searchParams.get("clientId");
  const isEditMode = !!id;

  const createAccount = useCreateSavingsAccount();
  const updateAccount = useUpdateSavingsAccount();
  const { data: existingAccount, isLoading: accountLoading } = useSavingsAccount(id ?? undefined);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<SavingsAccountFormValues>({
    defaultValues: {
      officeId: "",
      clientId: clientIdParam ? Number(clientIdParam) : 0,
      productId: 0,
      externalId: "",
      submittedOnDate: new Date().toISOString().split("T")[0],
      nominalAnnualInterestRate: "",
      interestCompoundingPeriodType: "",
      interestPostingPeriodType: "",
      interestCalculationType: "",
      interestCalculationDaysInYearType: "",
      minRequiredOpeningBalance: "",
      lockinPeriodFrequency: "",
      lockinPeriodFrequencyType: "",
      withdrawalFeeForTransfers: false,
      allowOverdraft: false,
      overdraftLimit: "",
      enforceMinRequiredBalance: false,
      minRequiredBalance: "",
      lienAllowed: false,
      maxAllowedLienLimit: "",
      withHoldTax: false,
      fieldOfficerId: "",
      dateFormat: "yyyy-MM-dd",
      locale: "en",
    },
  });

  const officeId = watch("officeId");
  const clientId = watch("clientId");
  const productId = watch("productId");
  const allowOverdraft = watch("allowOverdraft");
  const enforceMinRequiredBalance = watch("enforceMinRequiredBalance");
  const lienAllowed = watch("lienAllowed");
  const withdrawalFeeForTransfers = watch("withdrawalFeeForTransfers");
  const lockinPeriodFrequency = watch("lockinPeriodFrequency");

  const { data: template, isLoading: templateLoading } = useSavingsTemplate(
    clientId || undefined,
    productId || undefined,
  );

  useEffect(() => {
    if (existingAccount) {
      const a = existingAccount as any;
      const dob = Array.isArray(a.timeline?.submittedOnDate)
        ? new Date(a.timeline.submittedOnDate[0], a.timeline.submittedOnDate[1] - 1, a.timeline.submittedOnDate[2])
            .toISOString()
            .split("T")[0]
        : new Date().toISOString().split("T")[0];
      reset({
        officeId: "",
        clientId: a.clientId,
        productId: a.savingsProductId ?? a.productId,
        externalId: a.externalId ?? "",
        submittedOnDate: dob,
        nominalAnnualInterestRate: String(a.nominalAnnualInterestRate ?? ""),
        dateFormat: "yyyy-MM-dd",
        locale: "en",
      });
    }
  }, [existingAccount, reset]);

  const isLoading = isEditMode && accountLoading;

  const onSubmit = async (values: SavingsAccountFormValues) => {
    const payload: Record<string, unknown> = {
      clientId: values.productId ? values.clientId : values.clientId,
      productId: values.productId,
      submittedOnDate: values.submittedOnDate,
      dateFormat: "yyyy-MM-dd",
      locale: "en",
      externalId: values.externalId || undefined,
    };

    if (values.nominalAnnualInterestRate) payload.nominalAnnualInterestRate = Number(values.nominalAnnualInterestRate);
    if (values.interestCompoundingPeriodType)
      payload.interestCompoundingPeriodType = Number(values.interestCompoundingPeriodType);
    if (values.interestPostingPeriodType) payload.interestPostingPeriodType = Number(values.interestPostingPeriodType);
    if (values.interestCalculationType) payload.interestCalculationType = Number(values.interestCalculationType);
    if (values.interestCalculationDaysInYearType)
      payload.interestCalculationDaysInYearType = Number(values.interestCalculationDaysInYearType);
    if (values.minRequiredOpeningBalance) payload.minRequiredOpeningBalance = Number(values.minRequiredOpeningBalance);
    if (values.lockinPeriodFrequency) payload.lockinPeriodFrequency = Number(values.lockinPeriodFrequency);
    if (values.lockinPeriodFrequencyType) payload.lockinPeriodFrequencyType = Number(values.lockinPeriodFrequencyType);
    if (values.fieldOfficerId) payload.fieldOfficerId = Number(values.fieldOfficerId);

    payload.withdrawalFeeForTransfers = !!values.withdrawalFeeForTransfers;
    payload.allowOverdraft = !!values.allowOverdraft;
    if (values.allowOverdraft && values.overdraftLimit) payload.overdraftLimit = Number(values.overdraftLimit);
    payload.enforceMinRequiredBalance = !!values.enforceMinRequiredBalance;
    if (values.enforceMinRequiredBalance && values.minRequiredBalance)
      payload.minRequiredBalance = Number(values.minRequiredBalance);
    payload.lienAllowed = !!values.lienAllowed;
    if (values.lienAllowed && values.maxAllowedLienLimit)
      payload.maxAllowedLienLimit = Number(values.maxAllowedLienLimit);
    payload.withHoldTax = !!values.withHoldTax;

    if (isEditMode) {
      await updateAccount.mutateAsync({ accountId: Number(id), payload: payload as any });
    } else {
      await createAccount.mutateAsync(payload as any);
    }
    navigate(`/deposits/saving-accounts${id ? `/${id}` : ""}`);
  };

  if (isLoading) {
    return (
      <div className="m-auto max-w-6xl space-y-6 p-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="m-auto max-w-6xl space-y-6 p-6">
      <PageHeader
        title={isEditMode ? "Edit Savings Account" : "New Savings Account"}
        description={isEditMode ? `Editing account #${id}` : "Open a new savings account"}
        actions={
          <Button
            variant="outline"
            onClick={() => navigate(isEditMode ? `/deposits/saving-accounts/${id}` : "/deposits/saving-accounts")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Cancel
          </Button>
        }
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
        {/* Office & Client */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <PiggyBank className="h-5 w-5" />
              Office & Client
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <OfficeSelect
              value={officeId}
              onChange={(v) => {
                setValue("officeId", v, { shouldValidate: true });
                setValue("clientId", 0);
              }}
              disabled={isEditMode}
            />
            <ClientSearch
              value={clientId}
              onChange={(v) => setValue("clientId", v, { shouldValidate: true })}
              disabled={isEditMode || !officeId}
              placeholder={!officeId ? "Select office first" : "Search client by name\u2026"}
              error={errors.clientId?.message}
            />
          </CardContent>
        </Card>

        {/* Product */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Savings Product</CardTitle>
          </CardHeader>
          <CardContent>
            <SavingProductSelect
              value={productId}
              onChange={(v) => setValue("productId", v, { shouldValidate: true })}
              error={errors.productId?.message}
            />
          </CardContent>
        </Card>

        {/* Account Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Account Details</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1.5">
              <label className="block text-sm font-medium">External ID</label>
              <Input
                {...register("externalId")}
                placeholder="Optional external reference"
                error={errors.externalId?.message}
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">Submitted On Date *</label>
              <Input type="date" {...register("submittedOnDate")} error={errors.submittedOnDate?.message} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">Field Officer ID</label>
              <Input
                type="number"
                {...register("fieldOfficerId")}
                placeholder="Optional"
                error={errors.fieldOfficerId?.message}
              />
            </div>
          </CardContent>
        </Card>

        {/* Interest Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Interest Configuration</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">Interest Rate (% annual)</label>
              <Input
                type="number"
                step="0.01"
                {...register("nominalAnnualInterestRate")}
                placeholder={
                  template?.nominalAnnualInterestRate != null
                    ? String(template.nominalAnnualInterestRate)
                    : "From product"
                }
                error={errors.nominalAnnualInterestRate?.message}
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Compounding Period</label>
              <Select
                value={watch("interestCompoundingPeriodType")}
                onValueChange={(v) => setValue("interestCompoundingPeriodType", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={template?.interestCompoundingPeriodType?.value ?? "Select"} />
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
            <div>
              <label className="block text-sm font-medium">Posting Period</label>
              <Select
                value={watch("interestPostingPeriodType")}
                onValueChange={(v) => setValue("interestPostingPeriodType", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={template?.interestPostingPeriodType?.value ?? "Select"} />
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
            <div>
              <label className="block text-sm font-medium">Calculation Type</label>
              <Select
                value={watch("interestCalculationType")}
                onValueChange={(v) => setValue("interestCalculationType", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={template?.interestCalculationType?.value ?? "Select"} />
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
            <div>
              <label className="block text-sm font-medium">Days in Year</label>
              <Select
                value={watch("interestCalculationDaysInYearType")}
                onValueChange={(v) => setValue("interestCalculationDaysInYearType", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={template?.interestCalculationDaysInYearType?.value ?? "Select"} />
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
          </CardContent>
        </Card>

        {/* Balance & Lock-in */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Balance & Lock-in</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">Min Opening Balance</label>
              <Input
                type="number"
                {...register("minRequiredOpeningBalance")}
                error={errors.minRequiredOpeningBalance?.message}
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">Lock-in Period</label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  {...register("lockinPeriodFrequency")}
                  placeholder="Period"
                  className="flex-1"
                  error={errors.lockinPeriodFrequency?.message}
                />
                <Select
                  value={watch("lockinPeriodFrequencyType")}
                  onValueChange={(v) => setValue("lockinPeriodFrequencyType", v)}
                >
                  <SelectTrigger className="w-28">
                    <SelectValue placeholder="Type" />
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
            </div>
            <div className="flex items-center gap-3 pt-2">
              <Switch
                id="withdrawalFeeForTransfers"
                onCheckedChange={(v) => setValue("withdrawalFeeForTransfers", v)}
                defaultChecked={template?.withdrawalFeeForTransfers ?? false}
              />
              <label className="block text-sm font-medium" htmlFor="withdrawalFeeForTransfers">
                Withdrawal Fee for Transfers
              </label>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <Switch
                id="enforceMinRequiredBalance"
                onCheckedChange={(v) => setValue("enforceMinRequiredBalance", v)}
              />
              <label className="block text-sm font-medium" htmlFor="enforceMinRequiredBalance">
                Enforce Min Balance
              </label>
            </div>
            {enforceMinRequiredBalance && (
              <div className="space-y-1.5">
                <label className="block text-sm font-medium">Min Required Balance</label>
                <Input type="number" {...register("minRequiredBalance")} error={errors.minRequiredBalance?.message} />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Overdraft */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Overdraft</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3 pt-2">
              <Switch id="allowOverdraft" onCheckedChange={(v) => setValue("allowOverdraft", v)} />
              <label className="block text-sm font-medium" htmlFor="allowOverdraft">
                Allow Overdraft
              </label>
            </div>
            {allowOverdraft && (
              <div className="space-y-1.5">
                <label className="block text-sm font-medium">Overdraft Limit</label>
                <Input type="number" {...register("overdraftLimit")} error={errors.overdraftLimit?.message} />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Lien & Tax */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Lien & Tax</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3 pt-2">
              <Switch id="lienAllowed" onCheckedChange={(v) => setValue("lienAllowed", v)} />
              <label className="block text-sm font-medium" htmlFor="lienAllowed">
                Allow Lien
              </label>
            </div>
            {lienAllowed && (
              <div className="space-y-1.5">
                <label className="block text-sm font-medium">Max Lien Limit</label>
                <Input type="number" {...register("maxAllowedLienLimit")} error={errors.maxAllowedLienLimit?.message} />
              </div>
            )}
            <div className="flex items-center gap-3 pt-2">
              <Switch id="withHoldTax" onCheckedChange={(v) => setValue("withHoldTax", v)} />
              <label className="block text-sm font-medium" htmlFor="withHoldTax">
                Withhold Tax
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => navigate(isEditMode ? `/deposits/saving-accounts/${id}` : "/deposits/saving-accounts")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Cancel
          </Button>
          <Button
            type="submit"
            disabled={createAccount.isPending || updateAccount.isPending}
            className="bg-[#D32F2F] hover:bg-red-700"
          >
            {(createAccount.isPending || updateAccount.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" /> {isEditMode ? "Save Changes" : "Open Account"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateDepositAccountPage;
