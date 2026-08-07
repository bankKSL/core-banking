import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Pencil,
  Landmark,
  DollarSign,
  Percent,
  CalendarClock,
  Repeat,
  FileText,
  Shield,
  Clock,
  ChartArea,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useFixedDepositProduct } from "@/features/deposits";

function enumVal(v: any, fallback = ""): string {
  if (v == null) return fallback;
  if (typeof v === "object") return v.description ?? v.value ?? v.code ?? String(v.id) ?? fallback;
  return String(v);
}

const COMPOUNDING_LABELS: Record<number, string> = {
  1: "Daily",
  4: "Monthly",
  5: "Quarterly",
  6: "Semi-Annual",
  7: "Annual",
};
const POSTING_LABELS: Record<number, string> = { 1: "Monthly", 4: "Quarterly", 5: "Semi-Annual", 7: "Annual" };
const CALCULATION_LABELS: Record<number, string> = { 1: "Daily Balance", 2: "Average Daily Balance" };
const DAYS_IN_YEAR_LABELS: Record<number, string> = { 360: "360 Days", 364: "364 Days", 365: "365 Days", 1: "Actual" };

const InfoRow: React.FC<{ icon: React.ReactNode; label: string; value: React.ReactNode }> = ({
  icon,
  label,
  value,
}) => (
  <div className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0 dark:border-gray-800">
    <div className="mt-0.5 shrink-0 text-gray-400">{icon}</div>
    <div className="min-w-0 flex-1">
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{label}</p>
      <div className="mt-0.5 text-sm font-medium text-gray-900 dark:text-gray-100">{value ?? "—"}</div>
    </div>
  </div>
);

const FixedDepositProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { data: product, isLoading, isError, error, refetch } = useFixedDepositProduct(id ? Number(id) : undefined);

  if (isLoading) {
    return (
      <div className="max-w-5xl m-auto space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-32" />
              </CardHeader>
              <CardContent className="space-y-4">
                {[1, 2, 3].map((j) => (
                  <Skeleton key={j} className="h-12 w-full" />
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 max-w-6xl m-auto">
        <PageHeader
          title={t("Error loading product")}
          description={error?.message ?? t("An unexpected error occurred.")}
          actions={
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => navigate("/deposits/fixed-products")}>
                <ArrowLeft className="mr-2 h-4 w-4" /> {t("Back")}
              </Button>
              <Button variant="outline" onClick={() => refetch()}>
                {t("Retry")}
              </Button>
            </div>
          }
        />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="p-6 max-w-6xl m-auto">
        <PageHeader
          title={t("Product Not Found")}
          description={t("The requested fixed deposit product does not exist.")}
          actions={
            <Button variant="outline" onClick={() => navigate("/deposits/fixed-products")}>
              <ArrowLeft className="mr-2 h-4 w-4" /> {t("Back")}
            </Button>
          }
        />
      </div>
    );
  }

  const p = product as any;

  return (
    <div className="p-6 max-w-5xl m-auto space-y-6">
      <PageHeader
        title={p.name}
        description={p.description ?? p.shortName ?? ""}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate("/deposits/fixed-products")}>
              <ArrowLeft className="mr-2 h-4 w-4" /> {t("Back")}
            </Button>
            <Button
              onClick={() => navigate(`/deposits/fixed-products/edit/${id}`)}
              className="bg-[#D32F2F] hover:bg-red-700"
            >
              <Pencil className="mr-2 h-4 w-4" /> {t("Edit")}
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Landmark className="h-5 w-5 text-[#D32F2F]" />
              {t("Basic Info")}
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-gray-100 dark:divide-gray-800">
            <InfoRow icon={<FileText className="h-4 w-4" />} label={t("Product Name")} value={p.name} />
            <InfoRow icon={<FileText className="h-4 w-4" />} label={t("Short Name")} value={p.shortName ?? "—"} />
            <InfoRow icon={<FileText className="h-4 w-4" />} label={t("Description")} value={p.description ?? "—"} />
            <InfoRow
              icon={<DollarSign className="h-4 w-4" />}
              label={t("Currency")}
              value={p.currency?.displaySymbol ?? p.currency?.code ?? "—"}
            />
            <InfoRow
              icon={<DollarSign className="h-4 w-4" />}
              label={t("Deposit Amount")}
              value={p.depositAmount?.toLocaleString() ?? "—"}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Percent className="h-5 w-5 text-[#D32F2F]" />
              {t("Interest Settings")}
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-gray-100 dark:divide-gray-800">
            <InfoRow
              icon={<Repeat className="h-4 w-4" />}
              label={t("Compounding Period")}
              value={
                COMPOUNDING_LABELS[p.interestCompoundingPeriodType?.id] ?? enumVal(p.interestCompoundingPeriodType, "—")
              }
            />
            <InfoRow
              icon={<CalendarClock className="h-4 w-4" />}
              label={t("Posting Period")}
              value={POSTING_LABELS[p.interestPostingPeriodType?.id] ?? enumVal(p.interestPostingPeriodType, "—")}
            />
            <InfoRow
              icon={<CalendarClock className="h-4 w-4" />}
              label={t("Calculation Method")}
              value={CALCULATION_LABELS[p.interestCalculationType?.id] ?? enumVal(p.interestCalculationType, "—")}
            />
            <InfoRow
              icon={<CalendarClock className="h-4 w-4" />}
              label={t("Days in Year")}
              value={
                DAYS_IN_YEAR_LABELS[p.interestCalculationDaysInYearType?.id] ??
                enumVal(p.interestCalculationDaysInYearType, "—")
              }
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-5 w-5 text-[#D32F2F]" />
              {t("Deposit Terms")}
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-gray-100 dark:divide-gray-800">
            <InfoRow
              icon={<Clock className="h-4 w-4" />}
              label={t("Min Deposit Term")}
              value={`${p.minDepositTerm} ${p.minDepositTermType?.description ?? ""}`}
            />
            <InfoRow
              icon={<Clock className="h-4 w-4" />}
              label={t("Max Deposit Term")}
              value={p.maxDepositTerm != null ? `${p.maxDepositTerm} ${p.maxDepositTermType?.description ?? ""}` : "—"}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-5 w-5 text-[#D32F2F]" />
              {t("Pre-Closure Settings")}
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-gray-100 dark:divide-gray-800">
            <InfoRow
              icon={<Shield className="h-4 w-4" />}
              label={t("Penal Applicable")}
              value={p.preClosurePenalApplicable ? t("Yes") : t("No")}
            />
            {p.preClosurePenalApplicable && (
              <>
                <InfoRow
                  icon={<Percent className="h-4 w-4" />}
                  label={t("Penal Interest (%)")}
                  value={p.preClosurePenalInterest != null ? `${p.preClosurePenalInterest}%` : "—"}
                />
                <InfoRow
                  icon={<FileText className="h-4 w-4" />}
                  label={t("Penal Interest On")}
                  value={p.preClosurePenalInterestOnType?.description ?? "—"}
                />
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-5 w-5 text-[#D32F2F]" />
              {t("Tax & Accounting")}
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-gray-100 dark:divide-gray-800">
            <InfoRow
              icon={<FileText className="h-4 w-4" />}
              label={t("Withhold Tax")}
              value={p.withHoldTax ? t("Yes") : t("No")}
            />
            <InfoRow
              icon={<FileText className="h-4 w-4" />}
              label={t("Accounting Rule")}
              value={p.accountingRule?.description ?? "—"}
            />
          </CardContent>
        </Card>
      </div>

      {p.activeChart && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ChartArea className="h-5 w-5 text-[#D32F2F]" />
              {t("Interest Rate Chart")}{p.activeChart.name ? ` — ${p.activeChart.name}` : ""}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-500 mb-3">
              {t("From")} {p.activeChart.fromDate ? new Date(p.activeChart.fromDate).toLocaleDateString() : "—"}
              {p.activeChart.endDate ? ` ${t("to")} ${new Date(p.activeChart.endDate).toLocaleDateString()}` : ""}
            </p>
            <div className="overflow-x-auto rounded-lg border dark:border-gray-700">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">{t("Description")}</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">{t("Period Type")}</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-500">{t("From")}</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-500">{t("To")}</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-500">{t("Annual Rate")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-gray-700">
                  {p.activeChart.chartSlabs?.map((slab: any, i: number) => (
                    <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-4 py-3">{slab.description}</td>
                      <td className="px-4 py-3">{slab.periodType?.description ?? slab.periodType}</td>
                      <td className="px-4 py-3 text-right font-mono">{slab.fromPeriod}</td>
                      <td className="px-4 py-3 text-right font-mono">{slab.toPeriod}</td>
                      <td className="px-4 py-3 text-right font-mono font-semibold">{slab.annualInterestRate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FixedDepositProductDetailPage;
