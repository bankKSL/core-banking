import { type FC, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, RefreshCw, Pencil, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { ErrorState } from "@/components/shared/ErrorState";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/toast";
import { useWCLoanProduct, useDeleteWCLoanProduct } from "../hooks/useWCLoanQueries";
import { formatMoney, toDisplayText } from "../utils/format";

const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex justify-between gap-4 text-sm">
    <span className="text-gray-500 shrink-0">{label}</span>
    <span className="text-right">{value}</span>
  </div>
);

const WCLoanProductViewPage: FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success: toastSuccess, error: toastError } = useToast();
  const { data: product, isLoading, isError, refetch, isRefetching } = useWCLoanProduct(id ? Number(id) : undefined);
  const deleteMutation = useDeleteWCLoanProduct();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const handleDelete = async () => {
    if (!product) return;
    try {
      await deleteMutation.mutateAsync(product.id);
      toastSuccess(t("Product deleted"));
      navigate("/working-capital-loans/products");
    } catch (e) {
      toastError(e instanceof Error ? e.message : t("An unexpected error occurred."));
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-5xl m-auto space-y-6">
        <Skeleton className="h-10 w-72" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-44 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="p-6">
        <ErrorState title={t("Failed to load product")} message={t("Could not load product details.")} onRetry={() => refetch()} />
      </div>
    );
  }

  const currencyCode = product.currency?.code ?? "USD";

  return (
    <div className="max-w-5xl m-auto space-y-6">
      <PageHeader
        title={product.name}
        description={product.description ?? `${t("Working Capital Loan Product")} · ${product.shortName ?? ""}`}
        actions={
          <div className="flex items-center gap-2">
            {product.externalId && <Badge variant="default">ext: {product.externalId}</Badge>}
            <Badge variant="info">{product.currency?.code}</Badge>
            <Button variant="outline" size="sm" onClick={() => navigate(`/working-capital-loans/products/edit/${product.id}`)}>
              <Pencil className="mr-1 h-4 w-4" /> {t("Edit")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteOpen(true)}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              <Trash2 className="mr-1 h-4 w-4" /> {t("Delete")}
            </Button>
            <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isRefetching}>
              <RefreshCw className={`h-4 w-4 ${isRefetching ? "animate-spin" : ""}`} />
            </Button>
            <Button variant="outline" onClick={() => navigate("/working-capital-loans/products")}>
              <ArrowLeft className="mr-2 h-4 w-4" /> {t("Back")}
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("Loan Terms")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Row label={t("Currency")} value={toDisplayText(product.currency?.name ?? product.currency?.code)} />
            <Row label={t("Principal")} value={formatMoney(product.principal, currencyCode)} />
            <Row label={t("Min Principal")} value={product.minPrincipal != null ? formatMoney(product.minPrincipal, currencyCode) : "—"} />
            <Row label={t("Max Principal")} value={product.maxPrincipal != null ? formatMoney(product.maxPrincipal, currencyCode) : "—"} />
            <Separator />
            <Row label={t("Amortization Type")} value={toDisplayText(product.amortizationType)} />
            <Row label={t("NPV Day Count")} value={product.npvDayCount} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("Payments")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Row label={t("Period Payment Rate")} value={`${product.periodPaymentRate}%`} />
            <Row label={t("Min Period Rate")} value={product.minPeriodPaymentRate != null ? `${product.minPeriodPaymentRate}%` : "—"} />
            <Row label={t("Max Period Rate")} value={product.maxPeriodPaymentRate != null ? `${product.maxPeriodPaymentRate}%` : "—"} />
            <Separator />
            <Row
              label={t("Repayment")}
              value={`${t("Every")} ${product.repaymentEvery} ${toDisplayText(product.repaymentFrequencyType)}`}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("Delinquency")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Row
              label={t("Delinquency Bucket")}
              value={
                product.delinquencyBucket?.name ??
                (product.delinquencyBucketId != null ? `#${product.delinquencyBucketId}` : "—")
              }
            />
            <Row label={t("Grace Days")} value={product.delinquencyGraceDays ?? "—"} />
            <Row label={t("Delinquency Start")} value={toDisplayText(product.delinquencyStartType)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("Accounting")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Row label={t("Accounting Rule")} value={toDisplayText(product.accountingRule)} />
            <Row label={t("External ID")} value={product.externalId ?? "—"} />
            {product.allowAttributeOverrides && (
              <>
                <Separator />
                <Row
                  label={t("Attribute Overrides Allowed")}
                  value={Object.entries(product.allowAttributeOverrides)
                    .filter(([, v]) => v === true)
                    .map(([k]) => k)
                    .join(", ") || t("None")}
                />
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {product.description && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("Description")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{product.description}</p>
          </CardContent>
        </Card>
      )}

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={handleDelete}
        title={t("Delete Product")}
        description={t("This will permanently delete the product configuration. This action cannot be undone.")}
        confirmLabel={t("Delete")}
        variant="destructive"
        loading={deleteMutation.isPending}
      />
    </div>
  );
};

export default WCLoanProductViewPage;
