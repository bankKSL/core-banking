import { type FC, useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Save, Loader2, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/shared/ErrorState";
import { ClientSearch } from "@/components/shared/ClientSearch";
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
  applicationDate: z.string().optional(),
  savingsAccountId: z.string().optional(),
  submittedDate: z.string().optional(),
  minimumActivePeriod: z.string().optional(),
  lockinPeriodFrequency: z.string().optional(),
  lockinPeriodFrequencyType: z.string().optional(),
  allowDividendCalculationForInactiveClients: z.boolean().optional(),
  externalId: z.string().optional(),
  charges: z.array(chargeSchema).optional().default([]),
});

type ShareAccountFormValues = z.infer<typeof shareAccountFormSchema>;

const ShareAccountFormPage: FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;

  const [selectedClientId, setSelectedClientId] = useState<number>(0);
  const [selectedProductId, setSelectedProductId] = useState<string>("");

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

  const { fields, append, remove } = useFieldArray({
    control,
    name: "charges",
  });

  const clientSavingsAccounts = template?.clientSavingsAccounts ?? [];
  const chargeOptions = template?.chargeOptions ?? [];

  const handleClientChange = useCallback(
    (clientId: number) => {
      setSelectedClientId(clientId);
      setValue("clientId", clientId);
      if (!isEdit) {
        setSelectedProductId("");
        setValue("productId", "");
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
        lockinPeriodFrequency: values.lockinPeriodFrequency ? Number(values.lockinPeriodFrequency) : undefined,
        lockinPeriodFrequencyType: values.lockinPeriodFrequencyType
          ? Number(values.lockinPeriodFrequencyType)
          : undefined,
        allowDividendCalculationForInactiveClients: values.allowDividendCalculationForInactiveClients ?? false,
        externalId: values.externalId || undefined,
        charges: (values.charges ?? [])
          .filter((c) => c.chargeId && c.amount)
          .map((c) => ({ chargeId: Number(c.chargeId), amount: Number(c.amount) })),
        dateFormat: "dd MMMM yyyy",
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
      const msg = error?.response?.data?.errors?.[0]?.defaultUserMessage ?? "Failed to save share account.";
      setMutationError(msg);
    }
  };

  if ((isEdit && accountLoading) || templateLoading) {
    return (
      <div className="p-6 max-w-4xl m-auto">
        <Skeleton className="h-10 w-48 mb-6" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl m-auto space-y-6">
      <PageHeader
        title={isEdit ? "Edit Share Account" : "New Share Account"}
        description={isEdit ? `Editing account #${id}` : "Create a new share account"}
        actions={
          <Button variant="outline" onClick={() => navigate("/shares/accounts")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
        }
      />

      {mutationError && <ErrorState message={mutationError} />}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Client & Product</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ClientSearch
              value={watch("clientId")}
              onChange={handleClientChange}
              disabled={isEdit}
              error={errors.clientId?.message}
            />

            <div>
              <Label>Product *</Label>
              <Select
                value={watch("productId")}
                onValueChange={(v) => {
                  setSelectedProductId(v);
                  setValue("productId", v, { shouldValidate: true });
                }}
                disabled={isEdit}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  {(template?.productOptions ?? []).map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.name} ({p.currency?.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Application Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="requestedShares">Requested Shares *</Label>
                <Input id="requestedShares" type="number" {...register("requestedShares")} />
                {errors.requestedShares && (
                  <p className="text-xs text-red-500 mt-1">{errors.requestedShares.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="applicationDate">Application Date</Label>
                <Input id="applicationDate" type="date" {...register("applicationDate")} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Savings Account</Label>
                <Select value={watch("savingsAccountId")} onValueChange={(v) => setValue("savingsAccountId", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select savings account" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientSavingsAccounts.map((a) => (
                      <SelectItem key={a.id} value={String(a.id)}>
                        {a.accountNo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="submittedDate">Submitted Date</Label>
                <Input id="submittedDate" type="date" {...register("submittedDate")} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Restrictions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="minimumActivePeriod">Minimum Active Period (Days)</Label>
                <Input id="minimumActivePeriod" type="number" {...register("minimumActivePeriod")} />
              </div>
              <div>
                <Label htmlFor="lockinPeriodFrequency">Lock-in Period Frequency</Label>
                <Input id="lockinPeriodFrequency" type="number" {...register("lockinPeriodFrequency")} />
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
            </div>
            <div>
              <Checkbox
                id="allowDividendCalculationForInactiveClients"
                label="Allow dividend calculation for inactive clients"
                checked={watch("allowDividendCalculationForInactiveClients")}
                onCheckedChange={(v) => setValue("allowDividendCalculationForInactiveClients", v === true)}
              />
            </div>
            <div>
              <Label htmlFor="externalId">External ID</Label>
              <Input id="externalId" {...register("externalId")} placeholder="Optional external identifier" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Charges</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.length === 0 && <p className="text-sm text-gray-500">No charges applied.</p>}
            {fields.map((field, index) => (
              <div key={field.id} className="flex items-end gap-4">
                <div className="flex-1">
                  <Label>Charge</Label>
                  <Select
                    value={watch(`charges.${index}.chargeId`)}
                    onValueChange={(v) => setValue(`charges.${index}.chargeId`, v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select charge" />
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
                <div className="flex-1">
                  <Label htmlFor={`charges.${index}.amount`}>Amount</Label>
                  <Input
                    id={`charges.${index}.amount`}
                    type="number"
                    step="0.01"
                    {...register(`charges.${index}.amount`)}
                  />
                </div>
                <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => append({ chargeId: "", amount: "" })}>
              <Plus className="mr-2 h-4 w-4" /> Add Charge
            </Button>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button variant="outline" type="button" onClick={() => navigate("/shares/accounts")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Cancel
          </Button>
          <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
            {(createMutation.isPending || updateMutation.isPending) && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            <Save className="mr-2 h-4 w-4" />
            {isEdit ? "Save Changes" : "Create Account"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ShareAccountFormPage;
