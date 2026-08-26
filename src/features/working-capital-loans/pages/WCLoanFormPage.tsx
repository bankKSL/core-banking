import { type FC, useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
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
import { ClientSearch } from "@/components/shared/ClientSearch";
import { useToast } from "@/components/ui/toast";
import { createWCLoanSchema, type CreateWCLoanFormValues } from "../schemas/workingCapitalLoan.schema";
import {
  useCreateWCLoan,
  useUpdateWCLoan,
  useWCLoan,
  useWCLoanProducts,
  useDelinquencyBuckets,
  useWCLoanTemplate,
} from "../hooks/useWCLoanQueries";
import { DELINQUENCY_START_TYPE_OPTIONS } from "../constants/status";
import { WC_LOAN_STATUS_ID } from "../types/workingCapitalLoan";
import { toIsoDate } from "../utils/format";

const WCLoanFormPage: FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id: routeId } = useParams<{ id?: string }>();
  const editLoanId = routeId ? Number(routeId) : undefined;
  const isEditMode = !!editLoanId;
  const [searchParams] = useSearchParams();
  const { success: toastSuccess, error: toastError } = useToast();
  const urlClientId = searchParams.get("clientId") ? Number(searchParams.get("clientId")) : undefined;

  const { data: products = [], isLoading: productsLoading } = useWCLoanProducts();
  const { data: buckets = [] } = useDelinquencyBuckets();
  const createMutation = useCreateWCLoan();
  const updateMutation = useUpdateWCLoan();
  const mutation = isEditMode ? updateMutation : createMutation;
  const { data: editLoan, isLoading: loanLoading, isError: loanError } = useWCLoan(editLoanId);
  const notEditable =
    isEditMode && editLoan != null && editLoan.status?.id !== WC_LOAN_STATUS_ID.SUBMITTED_AND_PENDING_APPROVAL;

  const [selectedProductId, setSelectedProductId] = useState<number | undefined>(undefined);
  const [selectedClientId, setSelectedClientId] = useState<number | undefined>(urlClientId);
  const selectedProduct = products.find((p) => p.id === selectedProductId);

  const { data: template } = useWCLoanTemplate(selectedClientId, selectedProductId);

  const isDelinquencyBucketClassification =
    selectedProduct?.allowAttributeOverrides?.delinquencyBucketClassification ??
    template?.isDelinquencyBucketClassification ??
    false;

  const isDiscountOverrideAllowed = selectedProduct?.allowAttributeOverrides?.discountDefault !== false;

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
      totalPaymentVolume: undefined,
      periodPaymentRate: undefined,
      discount: 0,
      submittedOnDate: new Date().toISOString().split("T")[0],
      expectedDisbursementDate: "",
      delinquencyGraceDays: 3,
    },
  });

  useEffect(() => {
    if (template?.loanData) {
      const ld = template.loanData;
      if (ld.periodPaymentRate != null) setValue("periodPaymentRate", ld.periodPaymentRate);
      if (ld.totalPaymentVolume != null) setValue("totalPaymentVolume", ld.totalPaymentVolume);
      if (ld.discount != null) setValue("discount", ld.discount);
      if (ld.principalAmount != null) setValue("principalAmount", ld.principalAmount);
      if (ld.delinquencyGraceDays != null) setValue("delinquencyGraceDays", ld.delinquencyGraceDays);
      if (ld.delinquencyStartType != null) setValue("delinquencyStartType", ld.delinquencyStartType?.code);
      if (isDelinquencyBucketClassification && ld.delinquencyBucketId != null) {
        setValue("delinquencyBucketId", ld.delinquencyBucketId);
      }
    }
  }, [template, setValue, isDelinquencyBucketClassification]);

  // Edit mode: prefill from the submitted application (docs/WCLoan.md §4.2)
  const prefilledRef = useState({ done: false })[0];
  useEffect(() => {
    if (!isEditMode || !editLoan || prefilledRef.done) return;
    prefilledRef.done = true;
    setSelectedClientId(editLoan.clientId);
    if (editLoan.loanProductId) {
      setSelectedProductId(editLoan.loanProductId);
      setValue("productId", editLoan.loanProductId, { shouldValidate: true });
    }
    if (editLoan.proposedPrincipal != null) setValue("principalAmount", editLoan.proposedPrincipal);
    else if (editLoan.principal != null) setValue("principalAmount", editLoan.principal);
    if (editLoan.totalPaymentVolume != null) setValue("totalPaymentVolume", editLoan.totalPaymentVolume);
    if (editLoan.paymentRate != null) setValue("periodPaymentRate", editLoan.paymentRate);
    if (editLoan.discountFee != null) setValue("discount", editLoan.discountFee);
    if (editLoan.delinquencyGraceDays != null) setValue("delinquencyGraceDays", editLoan.delinquencyGraceDays);
    const submittedOn = toIsoDate(editLoan.timeline?.submittedOnDate);
    if (submittedOn) setValue("submittedOnDate", submittedOn);
    const expectedDisb = toIsoDate(editLoan.timeline?.expectedDisbursementDate);
    if (expectedDisb) setValue("expectedDisbursementDate", expectedDisb);
    if (editLoan.delinquencyBucketId != null) setValue("delinquencyBucketId", editLoan.delinquencyBucketId);
    if (editLoan.delinquencyStartType != null) {
      const dst = editLoan.delinquencyStartType;
      const code = typeof dst === "string" ? dst : (dst.code ?? dst.value);
      if (code) setValue("delinquencyStartType", code);
    }
  }, [isEditMode, editLoan, prefilledRef, setValue]);

  const onSubmit = async (values: CreateWCLoanFormValues) => {
    try {
      const { discount, delinquencyBucketId, ...rest } = values;
      const payload = { ...rest } as CreateWCLoanFormValues;
      if (isDiscountOverrideAllowed) payload.discount = discount;
      if (isDelinquencyBucketClassification && delinquencyBucketId != null)
        payload.delinquencyBucketId = delinquencyBucketId;
      if (isEditMode && editLoanId) {
        await updateMutation.mutateAsync({
          loanId: editLoanId,
          payload: {
            clientId: payload.clientId,
            productId: payload.productId,
            principalAmount: payload.principalAmount,
            totalPaymentVolume: payload.totalPaymentVolume,
            periodPaymentRate: payload.periodPaymentRate,
            expectedDisbursementDate: payload.expectedDisbursementDate,
            submittedOnDate: payload.submittedOnDate,
            delinquencyBucketId,
          },
        });
        toastSuccess(t("Loan application updated"));
        navigate(`/working-capital-loans/view/${editLoanId}`);
        return;
      }
      const result = await createMutation.mutateAsync(payload as never);
      toastSuccess(t("Loan application submitted successfully"));
      navigate(`/working-capital-loans/view/${result.resourceId ?? result.loanId}`);
    } catch (e) {
      toastError(e instanceof Error ? e.message : t("An unexpected error occurred."));
    }
  };

  if ((productsLoading || (isEditMode && loanLoading))) {
    return (
      <div className="max-w-6xl m-auto space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  if (isEditMode && loanError) {
    return (
      <div className="p-6">
        <ErrorState
          title={t("Failed to load loan")}
          message={t("Could not load loan details.")}
          onRetry={() => navigate(`/working-capital-loans/view/${editLoanId}`)}
        />
      </div>
    );
  }

  return (
    <div className="max-w-6xl m-auto space-y-6">
      <PageHeader
        title={
          isEditMode ? t("Edit Working Capital Loan") : t("Create Working Capital Loan")
        }
        description={
          isEditMode && editLoan
            ? `${t("Modify application")} · ${editLoan.accountNo ?? `#${editLoan.id}`}`
            : t("Submit a new revolving credit loan application")
        }
        actions={
          <Button variant="outline" onClick={() => navigate(isEditMode ? `/working-capital-loans/view/${editLoanId}` : "/working-capital-loans")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> {t("Back")}
          </Button>
        }
      />

      {(notEditable || mutation.isError) && (
        <ErrorState
          title={notEditable ? t("Application cannot be modified") : isEditMode ? t("Failed to update loan") : t("Failed to create loan")}
          message={
            notEditable
              ? t("Only submitted applications pending approval can be modified.")
              : (mutation.error?.message ?? t("An unexpected error occurred."))
          }
          onRetry={() =>
            notEditable ? navigate(`/working-capital-loans/view/${editLoanId}`) : mutation.reset()
          }
        />
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("Loan Details")}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-x-6 gap-y-4">
            <div className="space-y-1.5">
              <ClientSearch
                value={watch("clientId") ?? 0}
                onChange={(id) => {
                  setValue("clientId", id, { shouldValidate: true });
                  setSelectedClientId(id);
                }}
                error={errors.clientId?.message}
              />
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
                    setValue("delinquencyGraceDays", product.delinquencyGraceDays);
                    const dst = product.delinquencyStartType;
                    const dstCode = typeof dst === "string" ? dst : (dst?.code ?? dst?.value);
                    if (dstCode) setValue("delinquencyStartType", dstCode);
                  }
                }}
              >
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
              <label className="block text-sm font-medium">{t("Total Payment Volume")} *</label>
              <Input
                type="number"
                step="0.01"
                {...register("totalPaymentVolume", { valueAsNumber: true })}
                error={errors.totalPaymentVolume?.message}
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Period Payment Rate")} *</label>
              <Input
                type="number"
                step="0.0001"
                {...register("periodPaymentRate", { valueAsNumber: true })}
                error={errors.periodPaymentRate?.message}
                min={selectedProduct?.minPeriodPaymentRate}
                max={selectedProduct?.maxPeriodPaymentRate}
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Discount")}</label>
              <Input
                type="number"
                step="0.01"
                {...register("discount", { valueAsNumber: true })}
                error={errors.discount?.message}
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Submitted On")} *</label>
              <Input type="date" {...register("submittedOnDate")} error={errors.submittedOnDate?.message} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Expected Disbursement")} *</label>
              <Input
                type="date"
                {...register("expectedDisbursementDate")}
                error={errors.expectedDisbursementDate?.message}
              />
            </div>
          </CardContent>
        </Card>

        {isDelinquencyBucketClassification && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("Delinquency Configuration")}</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-x-6 gap-y-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium">{t("Delinquency Bucket")}</label>
                <Select
                  value={watch("delinquencyBucketId") ? String(watch("delinquencyBucketId")) : ""}
                  onValueChange={(v) => setValue("delinquencyBucketId", Number(v))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("Select bucket")} />
                  </SelectTrigger>
                  <SelectContent>
                    {(template?.delinquencyBucketOptions ?? buckets).map((b) => (
                      <SelectItem key={b.id} value={String(b.id)}>
                        {b.name}
                      </SelectItem>
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
                <Select
                  value={watch("delinquencyStartType") ?? "DISBURSEMENT"}
                  onValueChange={(v) => setValue("delinquencyStartType", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DELINQUENCY_START_TYPE_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(isEditMode ? `/working-capital-loans/view/${editLoanId}` : "/working-capital-loans")}
          >
            {t("Cancel")}
          </Button>
          <Button type="submit" disabled={mutation.isPending || notEditable}>
            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" />
            {isEditMode ? t("Save Changes") : t("Submit Application")}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default WCLoanFormPage;
