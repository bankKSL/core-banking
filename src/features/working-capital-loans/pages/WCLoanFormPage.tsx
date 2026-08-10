import { type FC, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/shared/ErrorState";
import { useToast } from "@/components/ui/toast";
import { createWCLoanSchema, type CreateWCLoanFormValues } from "../schemas/workingCapitalLoan.schema";
import { useCreateWCLoan, useWCLoanProducts, useDelinquencyBuckets } from "../hooks/useWCLoanQueries";
import { DELINQUENCY_START_TYPE_OPTIONS } from "../constants/status";

const WCLoanFormPage: FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { success: toastSuccess } = useToast();
  const urlClientId = searchParams.get("clientId") ? Number(searchParams.get("clientId")) : undefined;

  const { data: products = [], isLoading: productsLoading } = useWCLoanProducts();
  const { data: buckets = [] } = useDelinquencyBuckets();
  const createMutation = useCreateWCLoan();

  const [selectedProductId, setSelectedProductId] = useState<number | undefined>(undefined);
  const selectedProduct = products.find((p) => p.id === selectedProductId);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateWCLoanFormValues>({
    resolver: zodResolver(createWCLoanSchema) as never,
    mode: "onChange",
    defaultValues: {
      clientId: urlClientId,
      productId: undefined,
      principalAmount: undefined,
      submittedOnDate: new Date().toISOString().split("T")[0],
      expectedDisbursementDate: "",
      delinquencyBucketId: undefined,
      delinquencyGraceDays: 3,
      delinquencyStartType: "DISBURSEMENT",
    },
  });

  const onSubmit = async (values: CreateWCLoanFormValues) => {
    try {
      const result = await createMutation.mutateAsync(values);
      toastSuccess(t("Loan application submitted successfully"));
      navigate(`/working-capital-loans/view/${result.resourceId ?? result.loanId}`);
    } catch {
      // error handled by mutation state
    }
  };

  if (productsLoading) {
    return (
      <div className="max-w-6xl m-auto space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl m-auto space-y-6">
      <PageHeader
        title={t("Create Working Capital Loan")}
        description={t("Submit a new revolving credit loan application")}
        actions={
          <Button variant="outline" onClick={() => navigate("/working-capital-loans")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> {t("Back")}
          </Button>
        }
      />

      {createMutation.isError && (
        <ErrorState
          title={t("Failed to create loan")}
          message={createMutation.error?.message ?? t("An unexpected error occurred.")}
          onRetry={() => createMutation.reset()}
        />
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader><CardTitle className="text-base">{t("Loan Details")}</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-x-6 gap-y-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Client ID")} *</label>
              <Input type="number" {...register("clientId", { valueAsNumber: true })} error={errors.clientId?.message} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Product")} *</label>
              <Select
                value={watch("productId") ? String(watch("productId")) : ""}
                onValueChange={(v) => {
                  const pid = Number(v);
                  setValue("productId", pid, { shouldValidate: true });
                  setSelectedProductId(pid);
                  const product = products.find((p) => p.id === pid);
                  if (product) {
                    setValue("delinquencyBucketId", product.delinquencyBucketId);
                    setValue("delinquencyGraceDays", product.delinquencyGraceDays);
                    setValue("delinquencyStartType", product.delinquencyStartType);
                  }
                }}
              >
                <SelectTrigger><SelectValue placeholder={t("Select product")} /></SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.productId && <p className="text-sm text-red-500">{errors.productId.message}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Principal Amount")} *</label>
              <Input
                type="number"
                step="0.01"
                {...register("principalAmount", { valueAsNumber: true })}
                error={errors.principalAmount?.message}
                min={selectedProduct?.minPrincipal}
                max={selectedProduct?.maxPrincipal}
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Submitted On")} *</label>
              <Input type="date" {...register("submittedOnDate")} error={errors.submittedOnDate?.message} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Expected Disbursement")} *</label>
              <Input type="date" {...register("expectedDisbursementDate")} error={errors.expectedDisbursementDate?.message} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">{t("Delinquency Configuration")}</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-x-6 gap-y-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Delinquency Bucket")}</label>
              <Select
                value={watch("delinquencyBucketId") ? String(watch("delinquencyBucketId")) : ""}
                onValueChange={(v) => setValue("delinquencyBucketId", Number(v))}
              >
                <SelectTrigger><SelectValue placeholder={t("Select bucket")} /></SelectTrigger>
                <SelectContent>
                  {buckets.map((b) => (
                    <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Grace Days")}</label>
              <Input type="number" {...register("delinquencyGraceDays", { valueAsNumber: true })} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Start Type")}</label>
              <Select value={watch("delinquencyStartType") ?? "DISBURSEMENT"} onValueChange={(v) => setValue("delinquencyStartType", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DELINQUENCY_START_TYPE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate("/working-capital-loans")}>
            {t("Cancel")}
          </Button>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" />
            {t("Submit Application")}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default WCLoanFormPage;
