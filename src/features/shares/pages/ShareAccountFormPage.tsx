import { type FC, useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Save, Loader2, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/shared/ErrorState";
import { ClientSearch } from "@/components/shared/ClientSearch";
import { ProductSearch } from "@/components/shared/ProductSearch";
import { SavingsAccountSearch } from "@/components/shared/SavingsAccountSearch";
import {
  useShareAccountTemplate,
  useShareAccount,
  useCreateShareAccount,
  useUpdateShareAccount,
} from "../hooks/useShares";

const chargeSchema = z.object({
  chargeId: z.string().min(1, "Charge is required"),
  amount: z.string().min(1, "Amount is required"),
});

const shareAccountFormSchema = z.object({
  clientId: z.number().min(1, "Client is required"),
  productId: z.string().min(1, "Product is required"),
  requestedShares: z.string().min(1, "Requested shares is required"),
  applicationDate: z.string().min(1, "Application date is required"),
  savingsAccountId: z.string().min(1, "Savings account is required"),
  submittedDate: z.string().min(1, "Submitted date is required"),
  minimumActivePeriod: z.string().min(1, "Minimum active period is required"),
  minimumActivePeriodFrequencyType: z.string().min(1, "Minimum active period frequency type is required"),
  lockinPeriodFrequency: z.string().min(1, "Lockin period frequency is required"),
  lockinPeriodFrequencyType: z.string().min(1, "Lockin period frequency type is required"),
  allowDividendCalculationForInactiveClients: z.boolean().optional(),
  externalId: z.string().optional(),
  charges: z.array(chargeSchema).optional().default([]),
});

type ShareAccountFormValues = z.infer<typeof shareAccountFormSchema>;

const ShareAccountFormPage: FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;

  const [selectedClientId, setSelectedClientId] = useState<number>(0);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [cachedProductOptions, setCachedProductOptions] = useState<
    Array<{ id: number; name: string; currency: { code: string } }>
  >([]);

  const { data: template, isLoading: templateLoading } = useShareAccountTemplate(
    selectedClientId || undefined,
    selectedProductId ? Number(selectedProductId) : undefined,
  );
  const { data: account, isLoading: accountLoading } = useShareAccount(id ? Number(id) : undefined);
  const createMutation = useCreateShareAccount();
  const updateMutation = useUpdateShareAccount();
  const [mutationError, setMutationError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ShareAccountFormValues>({
    resolver: zodResolver(shareAccountFormSchema as any),
    defaultValues: {
      clientId: 0,
      productId: "",
      requestedShares: "",
      applicationDate: "",
      savingsAccountId: "",
      submittedDate: "",
      minimumActivePeriod: "",
      minimumActivePeriodFrequencyType: "",
      lockinPeriodFrequency: "",
      lockinPeriodFrequencyType: "",
      allowDividendCalculationForInactiveClients: false,
      externalId: "",
      charges: [],
    },
  });

  useEffect(() => {
    if (!account) return;
    setSelectedClientId(account.clientId);
    setSelectedProductId(String(account.productId));
    reset({
      clientId: account.clientId,
      productId: String(account.productId),
      requestedShares: String(account.summary?.totalShares ?? account.purchasedShares?.[0]?.totalShares ?? ""),
      applicationDate: account.timeline?.submittedOnDate ?? "",
      savingsAccountId: String(account.savingsAccountId ?? ""),
      submittedDate: account.timeline?.submittedOnDate ?? "",
      minimumActivePeriod: String(account.minimumActivePeriod ?? ""),
      minimumActivePeriodFrequencyType: String(account.minimumActivePeriodTypeEnum?.id ?? ""),
      lockinPeriodFrequency: String(account.lockinPeriod ?? ""),
      lockinPeriodFrequencyType: String(account.lockPeriodTypeEnum?.id ?? ""),
      allowDividendCalculationForInactiveClients: account.allowDividendCalculationForInactiveClients ?? false,
      externalId: account.externalId ?? "",
      charges: (account.charges ?? []).map((c) => ({
        chargeId: String(c.id),
        amount: String(c.amount),
      })),
    });
  }, [account, reset]);

  useEffect(() => {
    if (template?.productOptions && template.productOptions.length > 0) {
      setCachedProductOptions(template.productOptions);
    }
  }, [template?.productOptions]);

  const { fields, append, remove } = useFieldArray({
    control,
    name: "charges",
  });

  const productOptions = cachedProductOptions;
  const clientSavingsAccounts = template?.clientSavingsAccounts ?? [];
  const chargeOptions = template?.chargeOptions ?? [];

  const handleClientChange = useCallback(
    (clientId: number) => {
      setSelectedClientId(clientId);
      setValue("clientId", clientId);
      if (!isEdit) {
        setSelectedProductId("");
        setValue("productId", "");
        setValue("savingsAccountId", "");
        setCachedProductOptions([]);
      }
    },
    [setValue, isEdit],
  );

  const onSubmit = async (values: ShareAccountFormValues) => {
    setMutationError(null);
    try {
      const payload: Record<string, unknown> = {
        clientId: values.clientId,
        productId: Number(values.productId),
        requestedShares: Number(values.requestedShares),
        applicationDate: values.applicationDate || undefined,
        savingsAccountId: values.savingsAccountId ? Number(values.savingsAccountId) : undefined,
        submittedDate: values.submittedDate || undefined,
        minimumActivePeriod: values.minimumActivePeriod ? Number(values.minimumActivePeriod) : undefined,
        minimumActivePeriodFrequencyType: values.minimumActivePeriodFrequencyType
          ? Number(values.minimumActivePeriodFrequencyType)
          : undefined,
        lockinPeriodFrequency: values.lockinPeriodFrequency ? Number(values.lockinPeriodFrequency) : undefined,
        lockinPeriodFrequencyType: values.lockinPeriodFrequencyType
          ? Number(values.lockinPeriodFrequencyType)
          : undefined,
        allowDividendCalculationForInactiveClients: values.allowDividendCalculationForInactiveClients ?? false,
        externalId: values.externalId || undefined,
        charges: (values.charges ?? [])
          .filter((c) => c.chargeId && c.amount)
          .map((c) => ({ chargeId: Number(c.chargeId), amount: Number(c.amount) })),
        dateFormat: "yyyy-MM-dd",
        locale: "en",
      };

      if (isEdit) {
        await updateMutation.mutateAsync({ id: Number(id), payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      navigate("/shares/accounts");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { errors?: Array<{ defaultUserMessage: string }> } } };
      const msg = error?.response?.data?.errors?.[0]?.defaultUserMessage ?? t("Failed to save share account.");
      setMutationError(msg);
    }
  };

  if (isEdit && accountLoading) {
    return (
      <div className="max-w-6xl m-auto">
        <Skeleton className="h-10 w-48 mb-6" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl m-auto space-y-6">
      <PageHeader
        title={isEdit ? t("Edit Share Account") : t("New Share Account")}
        description={isEdit ? `${t("Editing account")} #${id}` : t("Create a new share account")}
        actions={
          <Button variant="outline" onClick={() => navigate("/shares/accounts")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> {t("Back")}
          </Button>
        }
      />

      {mutationError && <ErrorState message={mutationError} />}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("Client & Product")}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ClientSearch
              value={watch("clientId")}
              onChange={handleClientChange}
              disabled={isEdit}
              error={errors.clientId?.message}
            />

            <ProductSearch
              value={watch("productId")}
              onChange={(v) => {
                setSelectedProductId(v);
                setValue("productId", v, { shouldValidate: true });
              }}
              products={productOptions}
              disabled={isEdit}
              error={errors.productId?.message}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("Application Details")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium">{t("Requested Shares")} *</label>
                <Input type="number" {...register("requestedShares")} error={errors.requestedShares?.message} />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium">{t("Application Date")}</label>
                <Input type="date" {...register("applicationDate")} error={errors.applicationDate?.message} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <SavingsAccountSearch
                value={watch("savingsAccountId") ?? ""}
                onChange={(v) => setValue("savingsAccountId", v)}
                accounts={clientSavingsAccounts}
                disabled={!selectedProductId}
                error={errors.savingsAccountId?.message}
              />
              <div className="space-y-1.5">
                <label className="block text-sm font-medium">{t("Submitted Date")}</label>
                <Input type="date" {...register("submittedDate")} error={errors.submittedDate?.message} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("Restrictions")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium">{t("Minimum Active Period")}</label>
                <Input type="number" {...register("minimumActivePeriod")} error={errors.minimumActivePeriod?.message} />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium">{t("Minimum Active Period Type")}</label>
                <Select
                  value={watch("minimumActivePeriodFrequencyType")}
                  onValueChange={(v) => setValue("minimumActivePeriodFrequencyType", v, { shouldValidate: true })}
                >
                  <SelectTrigger className={errors.minimumActivePeriodFrequencyType?.message ? "border-red-500" : ""}>
                    <SelectValue placeholder={t("Select type")} />
                  </SelectTrigger>
                  <SelectContent>
                    {(template?.minimumActivePeriodFrequencyTypeOptions ?? []).map((o) => (
                      <SelectItem key={o.id} value={String(o.id)}>
                        {o.value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.minimumActivePeriodFrequencyType?.message && (
                  <p className="text-sm text-red-500">{errors.minimumActivePeriodFrequencyType.message}</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium">{t("Lock-in Period Frequency")}</label>
                <Input
                  type="number"
                  {...register("lockinPeriodFrequency")}
                  error={errors.lockinPeriodFrequency?.message}
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium">{t("Lock-in Period Type")}</label>
                <Select
                  value={watch("lockinPeriodFrequencyType")}
                  onValueChange={(v) => setValue("lockinPeriodFrequencyType", v, { shouldValidate: true })}
                >
                  <SelectTrigger className={errors.lockinPeriodFrequencyType?.message ? "border-red-500" : ""}>
                    <SelectValue placeholder={t("Select type")} />
                  </SelectTrigger>
                  <SelectContent>
                    {(template?.lockinPeriodFrequencyTypeOptions ?? []).map((o) => (
                      <SelectItem key={o.id} value={String(o.id)}>
                        {o.value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.lockinPeriodFrequencyType?.message && (
                  <p className="text-sm text-red-500">{errors.lockinPeriodFrequencyType.message}</p>
                )}
              </div>
            </div>
            <div>
              <Checkbox
                id="allowDividendCalculationForInactiveClients"
                label={t("Allow dividend calculation for inactive clients")}
                checked={watch("allowDividendCalculationForInactiveClients")}
                onCheckedChange={(v) => setValue("allowDividendCalculationForInactiveClients", v === true)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("External ID")}</label>
              <Input {...register("externalId")} placeholder={t("Optional external identifier")} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("Charges")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.length === 0 && <p className="text-sm text-gray-500">{t("No charges applied.")}</p>}
            {fields.map((field, index) => (
              <div key={field.id} className="flex items-end justify-center gap-4">
                <div className="flex-1 space-y-1.5">
                  <label className="block text-sm font-medium">{t("Charge")}</label>
                  <Select
                    value={watch(`charges.${index}.chargeId`)}
                    onValueChange={(v) => setValue(`charges.${index}.chargeId`, v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("Select charge")} />
                    </SelectTrigger>
                    <SelectContent>
                      {chargeOptions.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1 space-y-1.5">
                  <label className="block text-sm font-medium">{t("Amount")}</label>
                  <Input className="mb-1.5" type="number" step="0.01" {...register(`charges.${index}.amount`)} />
                </div>
                <Button className="mb-1.5" type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => append({ chargeId: "", amount: "" })}>
              <Plus className="mr-2 h-4 w-4" /> {t("Add Charge")}
            </Button>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button variant="outline" type="button" onClick={() => navigate("/shares/accounts")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> {t("Cancel")}
          </Button>
          <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
            {(createMutation.isPending || updateMutation.isPending) && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            <Save className="mr-2 h-4 w-4" />
            {isEdit ? t("Save Changes") : t("Create Account")}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ShareAccountFormPage;
