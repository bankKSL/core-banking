import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Save, Wallet, ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { ClientSearch } from "@/components/shared/ClientSearch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DEPOSIT_PERIOD_FREQUENCIES,
  RECURRING_DEPOSIT_FREQUENCY_TYPES,
  createRecurringDepositAccountSchema,
  useRecurringDepositProducts,
  useCreateRecurringDepositAccount,
} from "@/features/deposits";
import type { CreateRecurringDepositAccountFormValues } from "@/features/deposits";
import { currentDate } from "@/lib/utils";

const CreateRecurringDepositPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const clientIdParam = searchParams.get("clientId");

  const createMutation = useCreateRecurringDepositAccount();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateRecurringDepositAccountFormValues>({
    resolver: zodResolver(createRecurringDepositAccountSchema) as any,
    defaultValues: {
      clientId: clientIdParam || "",
      productId: "",
      externalId: "",
      depositAmount: "",
      depositPeriod: "12",
      depositPeriodFrequencyId: "2",
      submittedOnDate: new Date().toISOString().split("T")[0],
      recurringFrequency: "1",
      recurringFrequencyType: "2",
    },
  });

  const clientId = watch("clientId");

  const { data: products = [], isLoading: productsLoading } = useRecurringDepositProducts();

  const onSubmit = async (values: CreateRecurringDepositAccountFormValues) => {
    await createMutation.mutateAsync({
      clientId: Number(values.clientId),
      productId: Number(values.productId),
      externalId: values.externalId || undefined,
      depositAmount: Number(values.depositAmount),
      depositPeriod: Number(values.depositPeriod),
      depositPeriodFrequencyId: Number(values.depositPeriodFrequencyId),
      recurringFrequency: values.recurringFrequency ? Number(values.recurringFrequency) : undefined,
      recurringFrequencyType: values.recurringFrequencyType ? Number(values.recurringFrequencyType) : undefined,
      submittedOnDate: currentDate(values.submittedOnDate),
      locale: "en",
      dateFormat: "yyyy-MM-dd",
    });
    navigate("/deposits/recurring");
  };

  if (productsLoading)
    return (
      <div className="max-w-4xl m-auto space-y-6 p-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );

  return (
    <div className="max-w-4xl m-auto space-y-6 p-6">
      <PageHeader
        title="New Recurring Deposit"
        description="Open a recurring deposit account"
        actions={
          <Button variant="outline" onClick={() => navigate("/deposits/recurring")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Cancel
          </Button>
        }
      />
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>
              <Wallet className="mr-2 inline h-5 w-5" />
              Client &amp; Product
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div>
              <ClientSearch
                value={clientId ? Number(clientId) : 0}
                onChange={(v) => setValue("clientId", String(v || ""), { shouldValidate: true })}
                error={errors.clientId?.message}
              />
            </div>
            <div>
              <Label>Product *</Label>
              <Select
                value={watch("productId")}
                onValueChange={(v) => setValue("productId", v, { shouldValidate: true })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select product" />
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
                onClick={() => window.open("/deposits/recurring-products", "_blank")}
              >
                <ExternalLink className="mr-1 h-3 w-3" />
                Create New Product
              </Button>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Deposit Details</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="externalId">External ID</Label>
              <Input id="externalId" {...register("externalId")} placeholder="Optional external reference" />
            </div>
            <div>
              <Label>Recurring Deposit Amount *</Label>
              <Input type="number" {...register("depositAmount")} error={errors.depositAmount?.message} />
            </div>
            <div>
              <Label>Period Length *</Label>
              <Input type="number" {...register("depositPeriod")} error={errors.depositPeriod?.message} />
            </div>
            <div>
              <Label>Period Frequency</Label>
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
            <div>
              <Label>Submitted Date</Label>
              <Input type="date" {...register("submittedOnDate")} error={errors.submittedOnDate?.message} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recurring Frequency</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div>
              <Label>Deposit Every</Label>
              <Input type="number" {...register("recurringFrequency")} placeholder="e.g. 1" />
            </div>
            <div>
              <Label>Frequency Type</Label>
              <Select
                value={watch("recurringFrequencyType")}
                onValueChange={(v) => setValue("recurringFrequencyType", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RECURRING_DEPOSIT_FREQUENCY_TYPES.map((f) => (
                    <SelectItem key={f.id} value={String(f.id)}>
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
        <div className="flex justify-end gap-3">
          <Button variant="outline" type="button" onClick={() => navigate("/deposits/recurring")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            <Save className="mr-2 h-4 w-4" />
            {isSubmitting ? "Creating…" : "Create RD"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateRecurringDepositPage;
