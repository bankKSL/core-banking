import React, { useMemo, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Save, Wallet, ExternalLink, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { OfficeSelect } from "@/components/shared/OfficeSelect";
import { useClients } from "@/features/clients";
import {
  DEPOSIT_PERIOD_FREQUENCIES,
  useRecurringDepositProducts,
  useCreateRecurringDepositAccount,
  useUpdateRecurringDepositAccount,
  useRecurringDepositAccount,
  fetchRecurringDepositAccountTemplate,
} from "@/features/deposits";

const MATURITY_INSTRUCTION_OPTIONS = [
  { id: 100, label: "Withdraw Deposit" },
  { id: 200, label: "Transfer to Savings" },
  { id: 300, label: "Reinvest Principal + Interest" },
  { id: 400, label: "Reinvest Principal Only" },
];

const baseSchema = z.object({
  officeId: z.string().min(1, "Office is required"),
  clientId: z.string().min(1, "Client or Group is required"),
  groupId: z.string().optional(),
  productId: z.string().min(1, "Product is required"),
  accountNo: z.string().optional(),
  externalId: z.string().optional(),
  mandatoryRecommendedDepositAmount: z
    .string()
    .min(1, "Recurring amount is required")
    .refine((v) => !isNaN(Number(v)) && Number(v) > 0, "Must be a positive number"),
  depositPeriod: z.string().min(1, "Period is required"),
  depositPeriodFrequencyId: z.string().min(1, "Period frequency is required"),
  submittedOnDate: z.string().min(1, "Date is required"),
  isCalendarInherited: z.boolean().optional(),
  recurringFrequency: z.string().optional(),
  recurringFrequencyType: z.string().optional(),
  isMandatoryDeposit: z.boolean().optional(),
  allowWithdrawal: z.boolean().optional(),
  adjustAdvanceTowardsFuturePayments: z.boolean().optional(),
  expectedFirstDepositOnDate: z.string().optional(),
  nominalAnnualInterestRate: z.string().optional(),
  interestCompoundingPeriodType: z.string().optional(),
  interestPostingPeriodType: z.string().optional(),
  interestCalculationType: z.string().optional(),
  interestCalculationDaysInYearType: z.string().optional(),
  lockinPeriodFrequency: z.string().optional(),
  lockinPeriodFrequencyType: z.string().optional(),
  preClosurePenalApplicable: z.boolean().optional(),
  preClosurePenalInterest: z.string().optional(),
  preClosurePenalInterestOnTypeId: z.string().optional(),
  withHoldTax: z.boolean().optional(),
  fieldOfficerId: z.string().optional(),
  transferInterestToSavings: z.boolean().optional(),
  linkAccountId: z.string().optional(),
  maturityInstructionId: z.string().optional(),
  transferToSavingsId: z.string().optional(),
});

const rdSchema = baseSchema.superRefine((data, ctx) => {
  if (!data.isCalendarInherited) {
    if (!data.recurringFrequency || data.recurringFrequency === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Recurring frequency is required when calendar is not inherited",
        path: ["recurringFrequency"],
      });
    }
    if (!data.recurringFrequencyType || data.recurringFrequencyType === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Recurring frequency type is required when calendar is not inherited",
        path: ["recurringFrequencyType"],
      });
    }
  }
  if (data.preClosurePenalApplicable) {
    if (!data.preClosurePenalInterest || data.preClosurePenalInterest === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Penalty interest rate is required when penalty is applicable",
        path: ["preClosurePenalInterest"],
      });
    }
    if (!data.preClosurePenalInterestOnTypeId || data.preClosurePenalInterestOnTypeId === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Penalty applied on type is required when penalty is applicable",
        path: ["preClosurePenalInterestOnTypeId"],
      });
    }
  }
  if (data.transferInterestToSavings) {
    if (!data.linkAccountId || data.linkAccountId === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Linked savings account is required when transfer interest to savings is enabled",
        path: ["linkAccountId"],
      });
    }
  }
  if (data.maturityInstructionId === "200") {
    if (!data.transferToSavingsId || data.transferToSavingsId === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Transfer to savings account is required when maturity instruction is Transfer to Savings",
        path: ["transferToSavingsId"],
      });
    }
  }
});

type RDFormValues = z.infer<typeof rdSchema>;

const CreateRecurringDepositPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const clientIdParam = searchParams.get("clientId");
  const isEdit = !!id;

  const createMutation = useCreateRecurringDepositAccount();
  const updateMutation = useUpdateRecurringDepositAccount();
  const { data: existingAccount, isLoading: existingLoading } = useRecurringDepositAccount(id ? Number(id) : undefined);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RDFormValues>({
    resolver: zodResolver(rdSchema) as any,
    defaultValues: {
      officeId: "",
      clientId: clientIdParam || "",
      groupId: "",
      productId: "",
      accountNo: "",
      externalId: "",
      mandatoryRecommendedDepositAmount: "",
      depositPeriod: "",
      depositPeriodFrequencyId: "2",
      submittedOnDate: new Date().toISOString().split("T")[0],
      isCalendarInherited: true,
      recurringFrequency: "1",
      recurringFrequencyType: "2",
      isMandatoryDeposit: true,
      allowWithdrawal: false,
      adjustAdvanceTowardsFuturePayments: false,
      expectedFirstDepositOnDate: "",
      nominalAnnualInterestRate: "",
      interestCompoundingPeriodType: "",
      interestPostingPeriodType: "",
      interestCalculationType: "",
      interestCalculationDaysInYearType: "",
      lockinPeriodFrequency: "",
      lockinPeriodFrequencyType: "",
      preClosurePenalApplicable: false,
      preClosurePenalInterest: "",
      preClosurePenalInterestOnTypeId: "",
      withHoldTax: false,
      fieldOfficerId: "",
      transferInterestToSavings: false,
      linkAccountId: "",
      maturityInstructionId: "",
      transferToSavingsId: "",
    },
  });

  const officeId = watch("officeId");
  const clientId = watch("clientId");
  const productId = watch("productId");
  const isCalendarInherited = watch("isCalendarInherited");
  const preClosurePenalApplicable = watch("preClosurePenalApplicable");
  const transferInterestToSavings = watch("transferInterestToSavings");
  const maturityInstructionId = watch("maturityInstructionId");

  const clientsQuery = useMemo(
    () => (officeId && officeId !== "all" ? { officeId: Number(officeId) } : {}),
    [officeId],
  );
  const { data: clientsData, isLoading: clientsLoading } = useClients(clientsQuery);
  const { data: products = [], isLoading: productsLoading } = useRecurringDepositProducts();

  const selectedProduct = useMemo(() => {
    if (!productId || !products.length) return null;
    return products.find((p) => String(p.id) === productId) ?? null;
  }, [productId, products]);

  const { data: template, isLoading: templateLoading } = useQuery({
    queryKey: ["recurringdepositaccounts", "template", clientId, productId],
    queryFn: () =>
      fetchRecurringDepositAccountTemplate({
        clientId: clientId ? Number(clientId) : undefined,
        productId: productId ? Number(productId) : undefined,
      }),
    enabled: !!clientId && !!productId,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (!template) return;
    const t = template as Record<string, any>;
    if (t.nominalAnnualInterestRate != null) setValue("nominalAnnualInterestRate", String(t.nominalAnnualInterestRate));
    if (t.interestCompoundingPeriodType?.id != null)
      setValue("interestCompoundingPeriodType", String(t.interestCompoundingPeriodType.id));
    if (t.interestPostingPeriodType?.id != null)
      setValue("interestPostingPeriodType", String(t.interestPostingPeriodType.id));
    if (t.interestCalculationType?.id != null)
      setValue("interestCalculationType", String(t.interestCalculationType.id));
    if (t.interestCalculationDaysInYearType?.id != null)
      setValue("interestCalculationDaysInYearType", String(t.interestCalculationDaysInYearType.id));
    if (t.lockinPeriodFrequency != null) setValue("lockinPeriodFrequency", String(t.lockinPeriodFrequency));
    if (t.lockinPeriodFrequencyType?.id != null)
      setValue("lockinPeriodFrequencyType", String(t.lockinPeriodFrequencyType.id));
    if (t.preClosurePenalApplicable != null) setValue("preClosurePenalApplicable", t.preClosurePenalApplicable);
    if (t.preClosurePenalInterest != null) setValue("preClosurePenalInterest", String(t.preClosurePenalInterest));
    if (t.preClosurePenalInterestOnType?.id != null)
      setValue("preClosurePenalInterestOnTypeId", String(t.preClosurePenalInterestOnType.id));
    if (t.mandatoryRecommendedDepositAmount != null)
      setValue("mandatoryRecommendedDepositAmount", String(t.mandatoryRecommendedDepositAmount));
  }, [template, setValue]);

  const isLoading = clientsLoading || productsLoading;
  const clients = clientsData?.pageItems ?? [];

  const onSubmit = async (values: RDFormValues) => {
    const payload: Record<string, unknown> = {
      clientId: Number(values.clientId),
      productId: Number(values.productId),
      submittedOnDate: values.submittedOnDate,
      mandatoryRecommendedDepositAmount: Number(values.mandatoryRecommendedDepositAmount),
      depositPeriod: Number(values.depositPeriod),
      depositPeriodFrequencyId: Number(values.depositPeriodFrequencyId),
      isCalendarInherited: !!values.isCalendarInherited,
      locale: "en",
      dateFormat: "yyyy-MM-dd",
      externalId: values.externalId || undefined,
      isMandatoryDeposit: !!values.isMandatoryDeposit,
      allowWithdrawal: !!values.allowWithdrawal,
      adjustAdvanceTowardsFuturePayments: !!values.adjustAdvanceTowardsFuturePayments,
    };

    if (values.groupId) payload.groupId = Number(values.groupId);
    if (values.accountNo) payload.accountNo = values.accountNo;

    if (!values.isCalendarInherited) {
      payload.recurringFrequency = Number(values.recurringFrequency);
      payload.recurringFrequencyType = Number(values.recurringFrequencyType);
    }
    if (values.expectedFirstDepositOnDate) payload.expectedFirstDepositOnDate = values.expectedFirstDepositOnDate;
    if (values.nominalAnnualInterestRate) payload.nominalAnnualInterestRate = Number(values.nominalAnnualInterestRate);
    if (values.interestCompoundingPeriodType)
      payload.interestCompoundingPeriodType = Number(values.interestCompoundingPeriodType);
    if (values.interestPostingPeriodType) payload.interestPostingPeriodType = Number(values.interestPostingPeriodType);
    if (values.interestCalculationType) payload.interestCalculationType = Number(values.interestCalculationType);
    if (values.interestCalculationDaysInYearType)
      payload.interestCalculationDaysInYearType = Number(values.interestCalculationDaysInYearType);
    if (values.lockinPeriodFrequency) payload.lockinPeriodFrequency = Number(values.lockinPeriodFrequency);
    if (values.lockinPeriodFrequencyType) payload.lockinPeriodFrequencyType = Number(values.lockinPeriodFrequencyType);
    if (values.fieldOfficerId) payload.fieldOfficerId = Number(values.fieldOfficerId);

    if (values.preClosurePenalApplicable) {
      payload.preClosurePenalApplicable = true;
      payload.preClosurePenalInterest = Number(values.preClosurePenalInterest);
      payload.preClosurePenalInterestOnTypeId = Number(values.preClosurePenalInterestOnTypeId);
    }
    if (values.withHoldTax) payload.withHoldTax = true;

    if (values.transferInterestToSavings) {
      payload.transferInterestToSavings = true;
      payload.linkAccountId = Number(values.linkAccountId);
    }
    if (values.maturityInstructionId) {
      payload.maturityInstructionId = Number(values.maturityInstructionId);
      if (values.maturityInstructionId === "200") {
        payload.transferToSavingsId = Number(values.transferToSavingsId);
      }
    }

    if (isEdit) {
      await updateMutation.mutateAsync({ accountId: Number(id), payload });
    } else {
      await createMutation.mutateAsync(payload);
    }
    navigate("/deposits/recurring");
  };

  useEffect(() => {
    if (!existingAccount) return;
    const rd = existingAccount;
    setValue("officeId", "");
    setValue("clientId", String(rd.clientId));
    if (rd.group?.id) setValue("groupId", String(rd.group.id));
    setValue("productId", String(rd.depositProductId));
    setValue("accountNo", rd.accountNo ?? "");
    setValue("externalId", rd.externalId ?? "");
    setValue("mandatoryRecommendedDepositAmount", String(rd.recurringDepositAmount ?? ""));
    setValue("depositPeriod", String(rd.depositPeriod ?? ""));
    setValue("depositPeriodFrequencyId", String(rd.depositPeriodFrequencyType?.id ?? "2"));
    const submittedDate = rd.timeline?.submittedOnDate;
    setValue(
      "submittedOnDate",
      Array.isArray(submittedDate)
        ? `${submittedDate[0]}-${String(submittedDate[1]).padStart(2, "0")}-${String(submittedDate[2]).padStart(2, "0")}`
        : (submittedDate?.split("T")[0] ?? new Date().toISOString().split("T")[0]),
    );
    setValue("nominalAnnualInterestRate", String(rd.nominalAnnualInterestRate ?? ""));
    setValue("interestCompoundingPeriodType", String(rd.interestCompoundingPeriodType?.id ?? ""));
    setValue("interestPostingPeriodType", String(rd.interestPostingPeriodType?.id ?? ""));
    setValue("interestCalculationType", String(rd.interestCalculationType?.id ?? ""));
    setValue("interestCalculationDaysInYearType", String(rd.interestCalculationDaysInYearType?.id ?? ""));
    setValue("preClosurePenalApplicable", rd.preClosurePenalApplicable ?? false);
    setValue("preClosurePenalInterest", String(rd.preClosurePenalInterest ?? ""));
    setValue("preClosurePenalInterestOnTypeId", String(rd.preClosurePenalInterestOnType?.id ?? ""));
    setValue("withHoldTax", rd.withHoldTax ?? false);
    setValue("fieldOfficerId", String(rd.fieldOfficerId ?? ""));
    setValue("isCalendarInherited", rd.isCalendarInherited ?? false);
    setValue("isMandatoryDeposit", rd.isMandatoryDeposit ?? true);
    setValue("allowWithdrawal", rd.allowWithdrawal ?? false);
    setValue("adjustAdvanceTowardsFuturePayments", rd.adjustAdvanceTowardsFuturePayments ?? false);
    const firstDepositDate = rd.expectedFirstDepositOnDate;
    setValue(
      "expectedFirstDepositOnDate",
      Array.isArray(firstDepositDate)
        ? `${firstDepositDate[0]}-${String(firstDepositDate[1]).padStart(2, "0")}-${String(firstDepositDate[2]).padStart(2, "0")}`
        : (firstDepositDate?.split("T")[0] ?? ""),
    );
    setValue("lockinPeriodFrequency", String(rd.lockinPeriodFrequency ?? ""));
    setValue("lockinPeriodFrequencyType", String(rd.lockinPeriodFrequencyType?.id ?? ""));
    setValue("transferInterestToSavings", rd.transferInterestToSavings ?? false);
    setValue("linkAccountId", String(rd.linkAccountId ?? ""));
    setValue("maturityInstructionId", String(rd.maturityInstructionId ?? ""));
    setValue("transferToSavingsId", String(rd.transferToSavingsId ?? ""));
    if (rd.recurringFrequency) setValue("recurringFrequency", String(rd.recurringFrequency));
    if (rd.recurringFrequencyType?.id) setValue("recurringFrequencyType", String(rd.recurringFrequencyType.id));
  }, [existingAccount, setValue]);

  if (isLoading || existingLoading)
    return (
      <div className="max-w-6xl m-auto space-y-6 p-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );

  return (
    <div className="max-w-6xl m-auto space-y-6 p-6">
      <PageHeader
        title={isEdit ? t("Edit Recurring Deposit") : t("New Recurring Deposit")}
        description={isEdit ? t("Update recurring deposit account") : t("Open a recurring deposit account")}
        actions={
          <Button variant="outline" onClick={() => navigate("/deposits/recurring")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("Cancel")}
          </Button>
        }
      />
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Office & Client */}
        <Card>
          <CardHeader>
            <CardTitle>
              <Wallet className="mr-2 inline h-5 w-5" />
              {t("Office & Client")}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <OfficeSelect
              value={officeId}
              onChange={(v) => {
                setValue("officeId", v, { shouldValidate: true });
                setValue("clientId", "");
              }}
              label={t("Office *")}
            />
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Client")} *</label>
              <Select
                value={clientId}
                onValueChange={(v) => setValue("clientId", v, { shouldValidate: true })}
                disabled={!officeId}
              >
                <SelectTrigger>
                  <SelectValue placeholder={!officeId ? t("Select office first") : t("Select client")} />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.displayName ?? `#${c.id}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.clientId && <p className="text-sm text-red-500 mt-1">{errors.clientId.message}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Group")}</label>
              <Input
                type="number"
                {...register("groupId")}
                placeholder={t("Group ID (optional)")}
                error={errors.groupId?.message}
              />
            </div>
          </CardContent>
        </Card>

        {/* Product */}
        <Card>
          <CardHeader>
            <CardTitle>{t("Recurring Deposit Product")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Product")} *</label>
              <Select value={productId} onValueChange={(v) => setValue("productId", v, { shouldValidate: true })}>
                <SelectTrigger>
                  <SelectValue placeholder={t("Select product")} />
                </SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.productId && <p className="text-sm text-red-500 mt-1">{errors.productId.message}</p>}
              <Button
                type="button"
                variant="link"
                size="sm"
                className="h-auto p-0 text-xs"
                onClick={() => window.open("/deposits/recurring-products/new", "")}
              >
                <ExternalLink className="mr-1 h-3 w-3" />
                {t("Create New Product")}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Deposit Details */}
        <Card>
          <CardHeader>
            <CardTitle>{t("Deposit Details")}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="col-span-2 grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium">{t("Account No")}</label>
                <Input {...register("accountNo")} placeholder={t("Optional")} error={errors.accountNo?.message} />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium">{t("External ID")}</label>
                <Input {...register("externalId")} placeholder={t("Optional")} error={errors.externalId?.message} />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Recurring Deposit Amount")} *</label>
              <Input
                type="number"
                {...register("mandatoryRecommendedDepositAmount")}
                error={errors.mandatoryRecommendedDepositAmount?.message}
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Period Length")} *</label>
              <Input
                type="number"
                {...register("depositPeriod")}
                placeholder={
                  selectedProduct
                    ? `${t("Between")} ${selectedProduct.minDepositTerm} ${t("and")} ${selectedProduct.maxDepositTerm}`
                    : t("Select product first")
                }
                disabled={!selectedProduct}
                min={selectedProduct?.minDepositTerm}
                max={selectedProduct?.maxDepositTerm}
                step={selectedProduct?.inMultiplesOfDepositTerm}
                error={errors.depositPeriod?.message}
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Period Frequency")}</label>
              <Select
                value={watch("depositPeriodFrequencyId")}
                onValueChange={(v) => setValue("depositPeriodFrequencyId", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DEPOSIT_PERIOD_FREQUENCIES.map((f) => (
                    <SelectItem key={f.id} value={String(f.id)}>
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Submitted Date")} *</label>
              <Input type="date" {...register("submittedOnDate")} error={errors.submittedOnDate?.message} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Field Officer")}</label>
              <Select value={watch("fieldOfficerId")} onValueChange={(v) => setValue("fieldOfficerId", v)}>
                <SelectTrigger>
                  <SelectValue placeholder={t("Select field officer")} />
                </SelectTrigger>
                <SelectContent>
                  {(template as any)?.fieldOfficerOptions?.map((o: any) => (
                    <SelectItem key={o.id} value={String(o.id)}>
                      {o.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Recurring Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>{t("Recurring Configuration")}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3 pt-2">
              <Switch
                id="isCalendarInherited"
                checked={isCalendarInherited}
                onCheckedChange={(v) => setValue("isCalendarInherited", v)}
              />
              <label className="block text-sm font-medium" htmlFor="isCalendarInherited">
                {t("Use Group Calendar")}
              </label>
            </div>
            {!isCalendarInherited && (
              <>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium">{t("Deposit Every")}</label>
                  <Input
                    type="number"
                    {...register("recurringFrequency")}
                    placeholder={t("e.g. 1")}
                    error={errors.recurringFrequency?.message}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium">{t("Frequency Type")}</label>
                  <Select
                    value={watch("recurringFrequencyType")}
                    onValueChange={(v) => setValue("recurringFrequencyType", v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(template as any)?.periodFrequencyTypeOptions?.map((f: any) => (
                        <SelectItem key={f.id} value={String(f.id)}>
                          {f.value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
            <div className="flex items-center gap-3 pt-2">
              <Switch
                id="isMandatoryDeposit"
                onCheckedChange={(v) => setValue("isMandatoryDeposit", v)}
                defaultChecked
              />
              <label className="block text-sm font-medium" htmlFor="isMandatoryDeposit">
                {t("Mandatory Deposit")}
              </label>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <Switch id="allowWithdrawal" onCheckedChange={(v) => setValue("allowWithdrawal", v)} />
              <label className="block text-sm font-medium" htmlFor="allowWithdrawal">
                {t("Allow Withdrawal")}
              </label>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <Switch
                id="adjustAdvanceTowardsFuturePayments"
                onCheckedChange={(v) => setValue("adjustAdvanceTowardsFuturePayments", v)}
              />
              <label className="block text-sm font-medium" htmlFor="adjustAdvanceTowardsFuturePayments">
                {t("Advance Payment Adjustment")}
              </label>
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("First Deposit Expected On")}</label>
              <Input
                type="date"
                {...register("expectedFirstDepositOnDate")}
                error={errors.expectedFirstDepositOnDate?.message}
              />
            </div>
          </CardContent>
        </Card>

        {/* Interest Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>{t("Interest Configuration")}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Interest Rate (% annual)")}</label>
              <Input
                type="number"
                step="0.01"
                {...register("nominalAnnualInterestRate")}
                placeholder={
                  (template as any)?.nominalAnnualInterestRate != null
                    ? String((template as any).nominalAnnualInterestRate)
                    : ""
                }
                error={errors.nominalAnnualInterestRate?.message}
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Compounding Period")}</label>
              <Select
                value={watch("interestCompoundingPeriodType")}
                onValueChange={(v) => setValue("interestCompoundingPeriodType", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("Select")} />
                </SelectTrigger>
                <SelectContent>
                  {(template as any)?.interestCompoundingPeriodTypeOptions?.map((f: any) => (
                    <SelectItem key={f.id} value={String(f.id)}>
                      {f.value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Posting Period")}</label>
              <Select
                value={watch("interestPostingPeriodType")}
                onValueChange={(v) => setValue("interestPostingPeriodType", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("Select")} />
                </SelectTrigger>
                <SelectContent>
                  {(template as any)?.interestPostingPeriodTypeOptions?.map((o: any) => (
                    <SelectItem key={o.id} value={String(o.id)}>
                      {o.value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Calculation Type")}</label>
              <Select
                value={watch("interestCalculationType")}
                onValueChange={(v) => setValue("interestCalculationType", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("Select")} />
                </SelectTrigger>
                <SelectContent>
                  {(template as any)?.interestCalculationTypeOptions?.map((o: any) => (
                    <SelectItem key={o.id} value={String(o.id)}>
                      {o.value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Days in Year")}</label>
              <Select
                value={watch("interestCalculationDaysInYearType")}
                onValueChange={(v) => setValue("interestCalculationDaysInYearType", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("Select")} />
                </SelectTrigger>
                <SelectContent>
                  {(template as any)?.interestCalculationDaysInYearTypeOptions?.map((o: any) => (
                    <SelectItem key={o.id} value={String(o.id)}>
                      {o.value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Lock-in Period")}</label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  {...register("lockinPeriodFrequency")}
                  placeholder={t("Period")}
                  className="flex-1"
                  error={errors.lockinPeriodFrequency?.message}
                />
                <Select
                  value={watch("lockinPeriodFrequencyType")}
                  onValueChange={(v) => setValue("lockinPeriodFrequencyType", v)}
                >
                  <SelectTrigger className="w-28">
                    <SelectValue placeholder={t("Type")} />
                  </SelectTrigger>
                  <SelectContent>
                    {(template as any)?.lockinPeriodFrequencyTypeOptions?.map((o: any) => (
                      <SelectItem key={o.id} value={String(o.id)}>
                        {o.value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pre-closure & Tax */}
        <Card>
          <CardHeader>
            <CardTitle>{t("Pre-closure & Tax")}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3 pt-2">
              <Switch
                id="preClosurePenalApplicable"
                onCheckedChange={(v) => setValue("preClosurePenalApplicable", v)}
              />
              <label className="block text-sm font-medium" htmlFor="preClosurePenalApplicable">
                {t("Apply Pre-closure Penalty")}
              </label>
            </div>
            {preClosurePenalApplicable && (
              <>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium">{t("Penalty Interest Rate (%)")}</label>
                  <Input
                    type="number"
                    step="0.01"
                    {...register("preClosurePenalInterest")}
                    error={errors.preClosurePenalInterest?.message}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">{t("Penalty Applied On")}</label>
                  <Select
                    value={watch("preClosurePenalInterestOnTypeId")}
                    onValueChange={(v) => setValue("preClosurePenalInterestOnTypeId", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("Select")} />
                    </SelectTrigger>
                    <SelectContent>
                      {(template as any)?.preClosurePenalInterestOnTypeOptions?.map((o: any) => (
                        <SelectItem key={o.id} value={String(o.id)}>
                          {o.value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
            <div className="flex items-center gap-3 pt-2">
              <Switch id="withHoldTax" onCheckedChange={(v) => setValue("withHoldTax", v)} />
              <label className="block text-sm font-medium" htmlFor="withHoldTax">
                {t("Withhold Tax")}
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Maturity & Transfer */}
        <Card>
          <CardHeader>
            <CardTitle>{t("Maturity & Transfer")}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Maturity Instruction")}</label>
              <Select value={maturityInstructionId} onValueChange={(v) => setValue("maturityInstructionId", v)}>
                <SelectTrigger>
                  <SelectValue placeholder={t("Select instruction")} />
                </SelectTrigger>
                <SelectContent>
                  {MATURITY_INSTRUCTION_OPTIONS.map((o) => (
                    <SelectItem key={o.id} value={String(o.id)}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {maturityInstructionId === "200" && (
              <div className="space-y-1.5">
                <label className="block text-sm font-medium">{t("Transfer to Savings Account ID")}</label>
                <Input
                  type="number"
                  {...register("transferToSavingsId")}
                  placeholder={t("Savings account ID")}
                  error={errors.transferToSavingsId?.message}
                />
              </div>
            )}
            <div className="flex items-center gap-3 pt-2">
              <Switch
                id="transferInterestToSavings"
                onCheckedChange={(v) => setValue("transferInterestToSavings", v)}
              />
              <label className="block text-sm font-medium" htmlFor="transferInterestToSavings">
                {t("Transfer Interest to Savings")}
              </label>
            </div>
            {transferInterestToSavings && (
              <div className="space-y-1.5">
                <label className="block text-sm font-medium">{t("Link Savings Account ID")}</label>
                <Input
                  type="number"
                  {...register("linkAccountId")}
                  placeholder={t("Savings account ID")}
                  error={errors.linkAccountId?.message}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button variant="outline" type="button" onClick={() => navigate("/deposits/recurring")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("Cancel")}
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {isSubmitting ? t("Saving...") : isEdit ? t("Update RD") : t("Create RD")}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateRecurringDepositPage;
