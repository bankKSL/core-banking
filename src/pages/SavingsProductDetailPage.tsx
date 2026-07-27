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
  AlertTriangle,
  PiggyBank,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, type ColumnDef } from "@/components/shared/DataTable";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useSavingsProduct } from "@/features/deposits";

function enumVal(v: any, fallback = ""): string {
  if (v == null) return fallback;
  if (typeof v === "object") return v.value ?? v.code ?? v.description ?? String(v.id) ?? fallback;
  return String(v);
}

const PERIOD_TYPE_LABELS: Record<number, string> = { 0: "Days", 1: "Weeks", 2: "Months", 3: "Years" };
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
      <p className="mt-0.5 text-sm font-medium text-gray-900 dark:text-gray-100">{value ?? "—"}</p>
    </div>
  </div>
);

const SavingsProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: product, isLoading, isError, error, refetch } = useSavingsProduct(id ? Number(id) : undefined);

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
      <div className="p-6  m-auto">
        <PageHeader
          title="Error loading product"
          description={error?.message ?? "An unexpected error occurred."}
          actions={
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => navigate("/deposits/products")}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button variant="outline" onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          }
        />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="p-6  m-auto">
        <PageHeader
          title="Product Not Found"
          description="The requested savings product does not exist."
          actions={
            <Button variant="outline" onClick={() => navigate("/deposits/products")}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
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
            <Button variant="outline" onClick={() => navigate("/deposits/products")}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            <Button onClick={() => navigate(`/deposits/products/edit/${id}`)} className="bg-[#D32F2F] hover:bg-red-700">
              <Pencil className="mr-2 h-4 w-4" /> Edit
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Landmark className="h-5 w-5 text-[#D32F2F]" />
              Basic Info
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-gray-100 dark:divide-gray-800">
            <InfoRow icon={<FileText className="h-4 w-4" />} label="Product Name" value={p.name} />
            <InfoRow icon={<FileText className="h-4 w-4" />} label="Short Name" value={p.shortName ?? "—"} />
            <InfoRow icon={<FileText className="h-4 w-4" />} label="Description" value={p.description ?? "—"} />
            <InfoRow
              icon={<DollarSign className="h-4 w-4" />}
              label="Currency"
              value={p.currency?.displaySymbol ?? p.currency?.code ?? "—"}
            />
            <InfoRow
              icon={<Percent className="h-4 w-4 text-emerald-500" />}
              label="Nominal Annual Interest Rate"
              value={`${p.nominalAnnualInterestRate}%`}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Percent className="h-5 w-5 text-[#D32F2F]" />
              Interest Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-gray-100 dark:divide-gray-800">
            <InfoRow
              icon={<Repeat className="h-4 w-4" />}
              label="Compounding Period"
              value={
                COMPOUNDING_LABELS[p.interestCompoundingPeriodType?.id ?? p.interestCompoundingPeriodType] ??
                enumVal(p.interestCompoundingPeriodType, "—")
              }
            />
            <InfoRow
              icon={<CalendarClock className="h-4 w-4" />}
              label="Posting Period"
              value={
                POSTING_LABELS[p.interestPostingPeriodType?.id ?? p.interestPostingPeriodType] ??
                enumVal(p.interestPostingPeriodType, "—")
              }
            />
            <InfoRow
              icon={<CalendarClock className="h-4 w-4" />}
              label="Calculation Method"
              value={
                CALCULATION_LABELS[p.interestCalculationType?.id ?? p.interestCalculationType] ??
                enumVal(p.interestCalculationType, "—")
              }
            />
            <InfoRow
              icon={<CalendarClock className="h-4 w-4" />}
              label="Days in Year"
              value={
                DAYS_IN_YEAR_LABELS[p.interestCalculationDaysInYearType?.id ?? p.interestCalculationDaysInYearType] ??
                enumVal(p.interestCalculationDaysInYearType, "—")
              }
            />
            <InfoRow
              icon={<DollarSign className="h-4 w-4" />}
              label="Min Balance for Interest Calc"
              value={p.minBalanceForInterestCalculation?.toLocaleString() ?? "—"}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <PiggyBank className="h-5 w-5 text-[#D32F2F]" />
              Balance & Access
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-gray-100 dark:divide-gray-800">
            <InfoRow
              icon={<DollarSign className="h-4 w-4" />}
              label="Min Opening Balance"
              value={p.minRequiredOpeningBalance?.toLocaleString() ?? "—"}
            />
            <InfoRow
              icon={<Clock className="h-4 w-4" />}
              label="Lock-in Period"
              value={
                p.lockinPeriodFrequency != null
                  ? `${p.lockinPeriodFrequency} ${PERIOD_TYPE_LABELS[p.lockinPeriodFrequencyType?.id] ?? enumVal(p.lockinPeriodFrequencyType, "")}`
                  : "None"
              }
            />
            <InfoRow
              icon={<DollarSign className="h-4 w-4" />}
              label="Min Required Balance"
              value={p.minRequiredBalance?.toLocaleString() ?? "—"}
            />
            <InfoRow
              icon={<Shield className="h-4 w-4" />}
              label="Enforce Min Balance"
              value={p.enforceMinRequiredBalance ? "Yes" : "No"}
            />
            <InfoRow
              icon={<DollarSign className="h-4 w-4" />}
              label="Withdrawal Fee for Transfers"
              value={p.withdrawalFeeForTransfers ? "Yes" : "No"}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-5 w-5 text-[#D32F2F]" />
              Overdraft Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-gray-100 dark:divide-gray-800">
            <InfoRow
              icon={<Shield className="h-4 w-4" />}
              label="Allow Overdraft"
              value={p.allowOverdraft ? "Yes" : "No"}
            />
            <InfoRow
              icon={<DollarSign className="h-4 w-4" />}
              label="Overdraft Limit"
              value={p.overdraftLimit?.toLocaleString() ?? "—"}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-5 w-5 text-[#D32F2F]" />
              Dormancy Tracking
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-gray-100 dark:divide-gray-800">
            <InfoRow
              icon={<AlertTriangle className="h-4 w-4" />}
              label="Dormancy Tracking"
              value={p.isDormancyTrackingActive ? "Active" : "Inactive"}
            />
            {p.isDormancyTrackingActive && (
              <>
                <InfoRow
                  icon={<Clock className="h-4 w-4" />}
                  label="Days to Inactive"
                  value={p.daysToInactive ?? "—"}
                />
                <InfoRow
                  icon={<Clock className="h-4 w-4" />}
                  label="Days to Dormancy"
                  value={p.daysToDormancy ?? "—"}
                />
                <InfoRow icon={<Clock className="h-4 w-4" />} label="Days to Escheat" value={p.daysToEscheat ?? "—"} />
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-5 w-5 text-[#D32F2F]" />
              Tax
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-gray-100 dark:divide-gray-800">
            <InfoRow
              icon={<FileText className="h-4 w-4" />}
              label="Withhold Tax"
              value={p.withHoldTax ? "Yes" : "No"}
            />
          </CardContent>
        </Card>
      </div>

      {p.charges?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <DollarSign className="h-5 w-5 text-[#D32F2F]" />
              Charges ({p.charges.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={
                [
                  { key: "name", header: "Name", cell: (r: any) => r.name },
                  {
                    key: "amount",
                    header: "Amount",
                    cell: (r: any) => <span className="font-mono">{(r.amount ?? 0).toLocaleString()}</span>,
                  },
                  {
                    key: "chargeTimeType",
                    header: "Time",
                    cell: (r: any) => r.chargeTimeType?.value ?? "—",
                  },
                  {
                    key: "chargeCalculationType",
                    header: "Calculation",
                    cell: (r: any) => r.chargeCalculationType?.value ?? "—",
                  },
                  {
                    key: "isPenalty",
                    header: "Penalty",
                    cell: (r: any) => (r.isPenalty ? "Yes" : "No"),
                  },
                ] as ColumnDef<any>[]
              }
              data={p.charges}
              emptyState={{ message: "No charges defined." }}
              minWidth={600}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SavingsProductDetailPage;
