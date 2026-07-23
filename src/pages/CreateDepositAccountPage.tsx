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
import { Label } from "@/components/ui/label";
import { ClientSearch } from "@/components/shared/ClientSearch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCreateSavingsAccount,
  useUpdateSavingsAccount,
  useSavingsAccount,
  useSavingsProducts,
} from "@/features/deposits";

const savingsAccountSchema = z.object({
  clientId: z.number().min(1, "Client is required"),
  productId: z.number().min(1, "Product is required"),
  externalId: z.string().optional(),
  submittedOnDate: z.string().min(1, "Date is required"),
  nominalAnnualInterestRate: z.number().min(0).optional(),
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
      clientId: clientIdParam ? Number(clientIdParam) : 0,
      productId: 0,
      externalId: "",
      submittedOnDate: new Date().toISOString().split("T")[0],
      nominalAnnualInterestRate: 0,
      dateFormat: "yyyy-MM-dd",
      locale: "en",
    },
  });

  const clientId = watch("clientId");
  const productId = watch("productId");

  // Populate form from existing account data (edit mode)
  useEffect(() => {
    if (existingAccount) {
      const a = existingAccount as any;
      const dob = Array.isArray(a.timeline?.submittedOnDate)
        ? new Date(a.timeline.submittedOnDate[0], a.timeline.submittedOnDate[1] - 1, a.timeline.submittedOnDate[2])
            .toISOString()
            .split("T")[0]
        : new Date().toISOString().split("T")[0];
      reset({
        clientId: a.clientId,
        productId: a.savingsProductId ?? a.productId,
        externalId: a.externalId ?? "",
        submittedOnDate: dob,
        nominalAnnualInterestRate: a.nominalAnnualInterestRate ?? 0,
        dateFormat: "yyyy-MM-dd",
        locale: "en",
      });
    }
  }, [existingAccount, reset]);

  const { data: products = [], isLoading: productsLoading } = useSavingsProducts();
  const isLoading = (isEditMode && accountLoading) || productsLoading;

  const onSubmit = async (values: SavingsAccountFormValues) => {
    const payload = {
      clientId: values.productId ? values.clientId : values.clientId, // always needed
      productId: values.productId,
      externalId: values.externalId || undefined,
      submittedOnDate: values.submittedOnDate,
      nominalAnnualInterestRate: values.nominalAnnualInterestRate,
      dateFormat: values.dateFormat,
      locale: values.locale,
    };

    if (isEditMode) {
      await updateAccount.mutateAsync({ accountId: Number(id), payload: payload as any });
    } else {
      await createAccount.mutateAsync(payload as any);
    }
    navigate(`/deposits/saving-accounts${id ? `/${id}` : ""}`);
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
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <PiggyBank className="h-5 w-5" />
              Client &amp; Product
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <ClientSearch
                value={clientId}
                onChange={(v) => setValue("clientId", v, { shouldValidate: true })}
                disabled={isEditMode}
                error={errors.clientId?.message}
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="productId">Savings Product *</Label>
              <Select
                value={productId ? String(productId) : ""}
                onValueChange={(v) => setValue("productId", Number(v), { shouldValidate: true })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a savings product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.productId && <p className="mt-1 text-xs text-red-500">{errors.productId.message}</p>}
              <Button
                type="button"
                variant="link"
                size="sm"
                className="h-auto p-0 text-xs mt-1"
                onClick={() => window.open("/deposits/products", "_blank")}
              >
                <ExternalLink className="mr-1 h-3 w-3" />
                Create New Product
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Account Details</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="externalId">External ID</Label>
              <Input id="externalId" {...register("externalId")} placeholder="Optional external reference" />
            </div>
            <div>
              <Label htmlFor="nominalAnnualInterestRate">Interest Rate (% annual) *</Label>
              <Input
                id="nominalAnnualInterestRate"
                type="number"
                step="0.01"
                {...register("nominalAnnualInterestRate", { valueAsNumber: true })}
                placeholder="0"
              />
            </div>
            <div>
              <Label htmlFor="submittedOnDate">Submitted On Date *</Label>
              <Input id="submittedOnDate" type="date" {...register("submittedOnDate")} />
              {errors.submittedOnDate && <p className="mt-1 text-xs text-red-500">{errors.submittedOnDate.message}</p>}
            </div>
          </CardContent>
        </Card>

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
