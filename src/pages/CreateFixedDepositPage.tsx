import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Save, Wallet, ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { createFixedDepositAccount, DEPOSIT_PERIOD_FREQUENCIES } from "@/features/deposits";
import { useClients } from "@/features/clients";
import { useFixedDepositProducts } from "@/features/deposits";
import { currentDate } from "@/lib/utils";

const fixedDepositSchema = z.object({
  clientId: z.string().min(1, "Client is required"),
  productId: z.string().min(1, "Product is required"),
  externalId: z.string().optional(),
  depositAmount: z.string().min(1, "Deposit amount is required"),
  depositPeriod: z.string().min(1, "Period is required"),
  depositPeriodFrequencyId: z.string(),
  submittedOnDate: z.string().min(1, "Date is required"),
  nominalAnnualInterestRate: z.string().optional(),
});

type FixedDepositFormValues = z.infer<typeof fixedDepositSchema>;

const CreateFixedDepositPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const clientIdParam = searchParams.get("clientId");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FixedDepositFormValues>({
    resolver: zodResolver(fixedDepositSchema) as any,
    defaultValues: {
      clientId: clientIdParam || "",
      productId: "",
      externalId: "",
      depositAmount: "",
      depositPeriod: "12",
      depositPeriodFrequencyId: "2",
      submittedOnDate: new Date().toISOString().split("T")[0],
      nominalAnnualInterestRate: "",
    },
  });

  const clientId = watch("clientId");

  const { data: clientsData, isLoading: clientsLoading } = useClients({ limit: 100 });
  const { data: products = [], isLoading: productsLoading } = useFixedDepositProducts();
  const clients = clientsData?.pageItems ?? [];
  const isLoading = clientsLoading || productsLoading;

  const sortedClients = [...clients].sort((a, b) => {
    if (String(a.id) === clientId) return -1;
    if (String(b.id) === clientId) return 1;
    return 0;
  });

  const onSubmit = async (values: FixedDepositFormValues) => {
    await createFixedDepositAccount({
      clientId: Number(values.clientId),
      productId: Number(values.productId),
      externalId: values.externalId || undefined,
      depositAmount: Number(values.depositAmount),
      depositPeriod: Number(values.depositPeriod),
      depositPeriodFrequencyId: Number(values.depositPeriodFrequencyId),
      submittedOnDate: currentDate(values.submittedOnDate),
      locale: "en",
      dateFormat: "yyyy-MM-dd",
    });
    navigate("/deposits/fixed");
  };

  if (isLoading)
    return (
      <div className="max-w-2xl m-auto space-y-6 p-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );

  return (
    <div className="max-w-2xl m-auto space-y-6 p-6">
      <PageHeader
        title="New Fixed Deposit"
        description="Open a fixed deposit account (Section 10.2)"
        actions={
          <Button variant="outline" onClick={() => navigate("/deposits/fixed")}>
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
              <Label>Client *</Label>
              <Select value={clientId} onValueChange={(v) => setValue("clientId", v, { shouldValidate: true })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  {sortedClients.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.displayName ?? `Client #${c.id}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.clientId && <p className="text-sm text-red-500 mt-1">{errors.clientId.message}</p>}
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
                onClick={() => window.open("/deposits/fixed-products", "_blank")}
              >
                <ExternalLink className="mr-1 h-3 w-3" />
                Create New Product
              </Button>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Deposit Details (Section 10.7)</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="externalId">External ID</Label>
              <Input id="externalId" {...register("externalId")} placeholder="Optional external reference" />
            </div>
            <div>
              <Label>Deposit Amount *</Label>
              <Input type="number" {...register("depositAmount")} error={errors.depositAmount?.message} />
            </div>
            <div>
              <Label>Period Length *</Label>
              <Input type="number" {...register("depositPeriod")} error={errors.depositPeriod?.message} />
            </div>
            <div>
              <Label>Frequency (Section 10.7)</Label>
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
              <Label>Interest Rate</Label>
              <Input
                type="number"
                step="0.01"
                {...register("nominalAnnualInterestRate")}
                placeholder="Inherited from product"
              />
            </div>
            <div>
              <Label>Submitted Date</Label>
              <Input type="date" {...register("submittedOnDate")} error={errors.submittedOnDate?.message} />
            </div>
          </CardContent>
        </Card>
        <div className="flex justify-end gap-3">
          <Button variant="outline" type="button" onClick={() => navigate("/deposits/fixed")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            <Save className="mr-2 h-4 w-4" />
            {isSubmitting ? "Creating…" : "Create FD"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateFixedDepositPage;
