import { type FC, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Save, Loader2, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/shared/ErrorState";
import { CurrencySelect } from "@/components/shared/CurrencySelect";
import { AccountingRuleSelect } from "@/components/shared/AccountingRuleSelect";
import {
  useShareProductTemplate,
  useShareProduct,
  useCreateShareProduct,
  useUpdateShareProduct,
} from "../hooks/useShares";

const marketPricePeriodSchema = z.object({
  fromDate: z.string().min(1, "Date is required"),
  shareValue: z.string().min(1, "Value is required"),
});

const shareProductSchema = z.object({
  name: z.string().min(1, "Name is required"),
  shortName: z.string().min(1, "Short name is required").max(4, "Max 4 characters"),
  description: z.string().min(1, "Description is required"),
  currencyCode: z.string().min(1, "Currency is required"),
  digitsAfterDecimal: z.string().optional(),
  inMultiplesOf: z.string().optional(),
  totalShares: z.string().min(1, "Total shares is required"),
  sharesIssued: z.string().optional(),
  unitPrice: z.string().min(1, "Unit price is required"),
  minimumShares: z.string().optional(),
  nominalShares: z.string().min(1, "Nominal shares is required"),
  maximumShares: z.string().optional(),
  allowDividendCalculationForInactiveClients: z.boolean().optional(),
  lockinPeriodFrequency: z.string().optional(),
  lockinPeriodFrequencyType: z.string().optional(),
  minimumActivePeriodForDividends: z.string().optional(),
  accountingRule: z.string().min(1, "Accounting rule is required"),
  marketPricePeriods: z.array(marketPricePeriodSchema).optional().default([]),
  chargesSelected: z.array(z.string()).optional().default([]),
  shareReferenceId: z.string().optional(),
  shareSuspenseId: z.string().optional(),
  shareEquityId: z.string().optional(),
  incomeFromFeeAccountId: z.string().optional(),
});

type ShareProductFormValues = z.infer<typeof shareProductSchema>;

const ShareProductFormPage: FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;

  const { data: template, isLoading: templateLoading } = useShareProductTemplate();
  const { data: product, isLoading: productLoading } = useShareProduct(id ? Number(id) : undefined);
  const createMutation = useCreateShareProduct();
  const updateMutation = useUpdateShareProduct();
  const [mutationError, setMutationError] = useState<string | null>(null);

  console.log(template);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ShareProductFormValues>({
    resolver: zodResolver(shareProductSchema as any),
    defaultValues: {
      name: "",
      shortName: "",
      description: "",
      currencyCode: "",
      digitsAfterDecimal: "",
      inMultiplesOf: "",
      totalShares: "",
      sharesIssued: "",
      unitPrice: "",
      minimumShares: "",
      nominalShares: "",
      maximumShares: "",
      allowDividendCalculationForInactiveClients: false,
      lockinPeriodFrequency: "",
      lockinPeriodFrequencyType: "",
      minimumActivePeriodForDividends: "",
      accountingRule: "",
      marketPricePeriods: [],
      chargesSelected: [],
      shareReferenceId: "",
      shareSuspenseId: "",
      shareEquityId: "",
      incomeFromFeeAccountId: "",
    },
  });

  useEffect(() => {
    if (!product) return;
    reset({
      name: product.name,
      shortName: product.shortName,
      description: product.description,
      currencyCode: product.currency?.code ?? "",
      digitsAfterDecimal: String(product.currency?.decimalPlaces ?? ""),
      inMultiplesOf: String(product.currency?.inMultiplesOf ?? ""),
      totalShares: String(product.totalShares),
      sharesIssued: String(product.sharesIssued ?? ""),
      unitPrice: String(product.unitPrice),
      minimumShares: String(product.minimumShares ?? ""),
      nominalShares: String(product.nominalShares),
      maximumShares: String(product.maximumShares ?? ""),
      allowDividendCalculationForInactiveClients: product.allowDividendCalculationForInactiveClients ?? false,
      lockinPeriodFrequency: String(product.lockinPeriodFrequency ?? ""),
      lockinPeriodFrequencyType: String(product.lockinPeriodFrequencyType?.id ?? ""),
      minimumActivePeriodForDividends: String(product.minimumActivePeriodForDividends ?? ""),
      accountingRule: String(product.accountingRule?.id ?? ""),
      marketPricePeriods:
        product.marketPricePeriods?.map((p) => ({
          fromDate: p.fromDate ?? "",
          shareValue: String(p.shareValue ?? ""),
        })) ?? [],
      chargesSelected: product.chargesSelected?.map((c) => String(c.id)) ?? [],
    });
  }, [product, reset]);

  const { fields, append, remove } = useFieldArray({
    control,
    name: "marketPricePeriods",
  });

  const accountingRule = watch("accountingRule");
  const showGLAccounts = accountingRule === "2";

  const selectedCharges = watch("chargesSelected") ?? [];

  const onSubmit = async (values: ShareProductFormValues) => {
    setMutationError(null);
    try {
      const payload: Record<string, unknown> = {
        name: values.name,
        shortName: values.shortName,
        description: values.description,
        currencyCode: values.currencyCode,
        digitsAfterDecimal: values.digitsAfterDecimal ? Number(values.digitsAfterDecimal) : undefined,
        inMultiplesOf: values.inMultiplesOf ? Number(values.inMultiplesOf) : undefined,
        totalShares: Number(values.totalShares),
        sharesIssued: values.sharesIssued ? Number(values.sharesIssued) : undefined,
        unitPrice: Number(values.unitPrice),
        minimumShares: values.minimumShares ? Number(values.minimumShares) : undefined,
        nominalShares: Number(values.nominalShares),
        maximumShares: values.maximumShares ? Number(values.maximumShares) : undefined,
        allowDividendCalculationForInactiveClients: values.allowDividendCalculationForInactiveClients ?? false,
        lockinPeriodFrequency: values.lockinPeriodFrequency ? Number(values.lockinPeriodFrequency) : undefined,
        lockinPeriodFrequencyType: values.lockinPeriodFrequencyType
          ? Number(values.lockinPeriodFrequencyType)
          : undefined,
        minimumActivePeriodForDividends: values.minimumActivePeriodForDividends
          ? Number(values.minimumActivePeriodForDividends)
          : undefined,
        accountingRule: Number(values.accountingRule),
        marketPricePeriods: (values.marketPricePeriods ?? [])
          .filter((p) => p.fromDate && p.shareValue)
          .map((p) => ({
            fromDate: p.fromDate,
            shareValue: Number(p.shareValue),
          })),
        chargesSelected: (values.chargesSelected ?? []).map((c) => ({ id: Number(c) })),
        dateFormat: "dd MMMM yyyy",
        locale: "en",
      };

      if (showGLAccounts) {
        payload.shareReferenceId = values.shareReferenceId ? Number(values.shareReferenceId) : undefined;
        payload.shareSuspenseId = values.shareSuspenseId ? Number(values.shareSuspenseId) : undefined;
        payload.shareEquityId = values.shareEquityId ? Number(values.shareEquityId) : undefined;
        payload.incomeFromFeeAccountId = values.incomeFromFeeAccountId
          ? Number(values.incomeFromFeeAccountId)
          : undefined;
      }

      if (isEdit) {
        await updateMutation.mutateAsync({ id: Number(id), payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      navigate("/shares/products");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { errors?: Array<{ defaultUserMessage: string }> } } };
      const msg = error?.response?.data?.errors?.[0]?.defaultUserMessage ?? "Failed to save share product.";
      setMutationError(msg);
    }
  };

  if ((isEdit && productLoading) || templateLoading) {
    return (
      <div className="max-w-4xl p-6  m-auto">
        <Skeleton className="h-10 w-48 mb-6" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl m-auto space-y-6">
      <PageHeader
        title={isEdit ? "Edit Share Product" : "New Share Product"}
        description={isEdit ? `Editing product #${id}` : "Create a new share product"}
        actions={
          <Button variant="outline" onClick={() => navigate("/shares/products")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
        }
      />

      {mutationError && <ErrorState message={mutationError} />}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Basic Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium">Name *</label>
                <Input {...register("name")} placeholder="e.g. Ordinary Shares" error={errors.name?.message} />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium">Short Name * (max 4 chars)</label>
                <Input
                  {...register("shortName")}
                  placeholder="e.g. ORD"
                  maxLength={4}
                  error={errors.shortName?.message}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea id="description" {...register("description")} placeholder="Product description" rows={2} />
              {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description.message}</p>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Currency & Units</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <CurrencySelect
                value={watch("currencyCode")}
                onChange={(v) => setValue("currencyCode", v, { shouldValidate: true })}
                error={errors.currencyCode?.message}
              />
              <div className="space-y-1.5">
                <label className="block text-sm font-medium">Digits After Decimal</label>
                <Input type="number" {...register("digitsAfterDecimal")} />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium">In Multiples Of</label>
                <Input type="number" {...register("inMultiplesOf")} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Share Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium">Total Shares *</label>
                <Input type="number" {...register("totalShares")} error={errors.totalShares?.message} />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium">Shares Issued</label>
                <Input type="number" {...register("sharesIssued")} />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium">Unit Price *</label>
                <Input type="number" step="0.01" {...register("unitPrice")} error={errors.unitPrice?.message} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium">Minimum Shares</label>
                <Input type="number" {...register("minimumShares")} />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium">Nominal Shares *</label>
                <Input type="number" {...register("nominalShares")} error={errors.nominalShares?.message} />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium">Maximum Shares</label>
                <Input type="number" {...register("maximumShares")} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Restrictions & Dividends</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium">Lock-in Period Frequency</label>
                <Input type="number" {...register("lockinPeriodFrequency")} />
              </div>
              <div>
                <Label>Lock-in Period Type</Label>
                <Select
                  value={watch("lockinPeriodFrequencyType")}
                  onValueChange={(v) => setValue("lockinPeriodFrequencyType", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {(template?.lockinPeriodFrequencyTypeOptions ?? []).map((o) => (
                      <SelectItem key={o.id} value={String(o.id)}>
                        {o.value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium">Minimum Active Period (Days)</label>
                <Input type="number" {...register("minimumActivePeriodForDividends")} />
              </div>
            </div>
            <div>
              <Checkbox
                id="allowDividendCalculationForInactiveClients"
                label="Allow dividend calculation for inactive clients"
                checked={watch("allowDividendCalculationForInactiveClients")}
                onCheckedChange={(v) => setValue("allowDividendCalculationForInactiveClients", v === true)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Accounting</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <AccountingRuleSelect
              value={watch("accountingRule")}
              onChange={(v) => setValue("accountingRule", v, { shouldValidate: true })}
              error={errors.accountingRule?.message}
            />

            {showGLAccounts && (
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-md">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium">Share Reference GL</label>
                  <Input type="number" {...register("shareReferenceId")} />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium">Share Suspense GL</label>
                  <Input type="number" {...register("shareSuspenseId")} />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium">Share Equity GL</label>
                  <Input type="number" {...register("shareEquityId")} />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium">Income from Fee GL</label>
                  <Input type="number" {...register("incomeFromFeeAccountId")} />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Market Price Periods</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.length === 0 && <p className="text-sm text-gray-500">No market price periods defined.</p>}
            {fields.map((field, index) => (
              <div key={field.id} className="flex items-end gap-4">
                <div className="flex-1 space-y-1.5">
                  <label className="block text-sm font-medium">From Date</label>
                  <Input type="date" {...register(`marketPricePeriods.${index}.fromDate`)} />
                </div>
                <div className="flex-1 space-y-1.5">
                  <label className="block text-sm font-medium">Share Value</label>
                  <Input type="number" step="0.01" {...register(`marketPricePeriods.${index}.shareValue`)} />
                </div>
                <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => append({ fromDate: "", shareValue: "" })}>
              <Plus className="mr-2 h-4 w-4" /> Add Period
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Charges</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(template?.chargeOptions ?? []).map((charge) => (
                <Checkbox
                  key={charge.id}
                  id={`charge-${charge.id}`}
                  label={`${charge.name} (${charge.amount})`}
                  checked={selectedCharges.includes(String(charge.id))}
                  onCheckedChange={(v) => {
                    if (v) {
                      setValue("chargesSelected", [...selectedCharges, String(charge.id)]);
                    } else {
                      setValue(
                        "chargesSelected",
                        selectedCharges.filter((c) => c !== String(charge.id)),
                      );
                    }
                  }}
                />
              ))}
              {(template?.chargeOptions ?? []).length === 0 && (
                <p className="text-sm text-gray-500">No charges available.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button variant="outline" type="button" onClick={() => navigate("/shares/products")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Cancel
          </Button>
          <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
            {(createMutation.isPending || updateMutation.isPending) && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            <Save className="mr-2 h-4 w-4" />
            {isEdit ? "Save Changes" : "Create Product"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ShareProductFormPage;
