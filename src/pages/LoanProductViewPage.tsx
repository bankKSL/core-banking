import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Pencil, Landmark, DollarSign, Repeat, Percent, CalendarClock, FileText } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useLoanProduct } from "@/features/loans";

function enumVal(v: any, fallback = ""): string {
  if (v == null) return fallback;
  if (typeof v === "object") return v.value ?? v.code ?? String(v.id) ?? fallback;
  return String(v);
}

function enumId(v: any, fallback = 0): number {
  if (v == null) return fallback;
  if (typeof v === "object") return v.id ?? fallback;
  return Number(v);
}

const LABELS: Record<string, Record<number, string>> = {
  amortizationType: { 0: "Equal Principal", 1: "Equal Installments" },
  interestType: { 0: "Flat", 1: "Declining Balance" },
  interestCalculationPeriodType: { 0: "Daily", 1: "Same as Repayment" },
  repaymentFrequencyType: { 0: "Days", 1: "Weeks", 2: "Months" },
  interestRateFrequencyType: { 2: "Per Month", 3: "Per Year", 4: "Per Year" },
  daysInYearType: { 1: "Actual (365/366)", 360: "360 Days", 365: "365 Days" },
  daysInMonthType: { 1: "Actual Days", 30: "30 Days" },
};

function getLabel(mapKey: string, id: number | undefined): string {
  if (id == null) return "—";
  return LABELS[mapKey]?.[id] ?? String(id);
}

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

const LoanProductViewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: product, isLoading } = useLoanProduct(id ? Number(id) : undefined);

  if (isLoading) {
    return (
      <div className="p-6 max-w-4xl m-auto space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
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

  if (!product) {
    return (
      <div className="p-6 max-w-4xl m-auto">
        <PageHeader
          title="Product Not Found"
          description="The requested loan product does not exist."
          actions={
            <Button variant="outline" onClick={() => navigate("/lending/products")}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
          }
        />
      </div>
    );
  }

  const p = product as any;
  const isProgressive = enumVal(p.loanScheduleType) === "PROGRESSIVE";

  return (
    <div className="p-6 max-w-5xl m-auto space-y-6">
      <PageHeader
        title={p.name}
        description={p.description ?? enumVal(p.shortName)}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate("/lending/products")}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            <Button onClick={() => navigate(`/lending/products/edit/${id}`)} className="bg-[#D32F2F] hover:bg-red-700">
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
              Product Details
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-gray-100 dark:divide-gray-800">
            <InfoRow icon={<FileText className="h-4 w-4" />} label="Short Name" value={p.shortName ?? "—"} />
            <InfoRow icon={<FileText className="h-4 w-4" />} label="Description" value={p.description ?? "—"} />
            <InfoRow
              icon={<DollarSign className="h-4 w-4" />}
              label="Currency"
              value={p.currency?.displaySymbol ?? p.currency?.code ?? "—"}
            />
            <InfoRow
              icon={<DollarSign className="h-4 w-4" />}
              label="Digits After Decimal"
              value={p.currency?.decimalPlaces ?? 2}
            />
            <InfoRow
              icon={<DollarSign className="h-4 w-4" />}
              label="In Multiples Of"
              value={p.currency?.inMultiplesOf ?? 0}
            />
            <InfoRow icon={<Landmark className="h-4 w-4" />} label="Fund" value={p.fundName ?? "—"} />
            <InfoRow
              icon={
                <Badge variant={isProgressive ? "info" : "default"} size="sm" rounded>
                  {isProgressive ? "Progressive" : "Cumulative"}
                </Badge>
              }
              label="Schedule Type"
              value={enumVal(p.loanScheduleType, "Cumulative")}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Percent className="h-5 w-5 text-[#D32F2F]" />
              Terms
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-gray-100 dark:divide-gray-800">
            <InfoRow
              icon={<DollarSign className="h-4 w-4" />}
              label="Principal"
              value={p.principal?.toLocaleString()}
            />
            <InfoRow
              icon={<Percent className="h-4 w-4 text-emerald-500" />}
              label="Interest Rate"
              value={`${p.interestRatePerPeriod}%`}
            />
            <InfoRow
              icon={<Percent className="h-4 w-4" />}
              label="Interest Rate Frequency"
              value={getLabel("interestRateFrequencyType", enumId(p.interestRateFrequencyType))}
            />
            <InfoRow
              icon={<Repeat className="h-4 w-4" />}
              label="Amortization"
              value={getLabel("amortizationType", enumId(p.amortizationType))}
            />
            <InfoRow
              icon={<Repeat className="h-4 w-4" />}
              label="Interest Type"
              value={getLabel("interestType", enumId(p.interestType))}
            />
            <InfoRow
              icon={<CalendarClock className="h-4 w-4" />}
              label="Interest Calculation"
              value={getLabel("interestCalculationPeriodType", enumId(p.interestCalculationPeriodType))}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Repeat className="h-5 w-5 text-[#D32F2F]" />
              Repayment
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-gray-100 dark:divide-gray-800">
            <InfoRow icon={<Repeat className="h-4 w-4" />} label="Number of Repayments" value={p.numberOfRepayments} />
            <InfoRow
              icon={<Repeat className="h-4 w-4" />}
              label="Repayment Every"
              value={`${p.repaymentEvery} ${getLabel("repaymentFrequencyType", enumId(p.repaymentFrequencyType))}`}
            />
            <InfoRow
              icon={<CalendarClock className="h-4 w-4" />}
              label="Days In Year"
              value={getLabel("daysInYearType", enumId(p.daysInYearType))}
            />
            <InfoRow
              icon={<CalendarClock className="h-4 w-4" />}
              label="Days In Month"
              value={getLabel("daysInMonthType", enumId(p.daysInMonthType))}
            />
            <InfoRow
              icon={
                <Badge variant="info" size="sm">
                  {p.isInterestRecalculationEnabled ? "Enabled" : "Disabled"}
                </Badge>
              }
              label="Interest Recalculation"
              value={p.isInterestRecalculationEnabled ? "Enabled" : "Disabled"}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-5 w-5 text-[#D32F2F]" />
              Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-gray-100 dark:divide-gray-800">
            <InfoRow
              icon={<FileText className="h-4 w-4" />}
              label="Transaction Strategy"
              value={p.transactionProcessingStrategyName ?? p.transactionProcessingStrategyCode ?? "—"}
            />
            <InfoRow
              icon={<FileText className="h-4 w-4" />}
              label="Accounting Rule"
              value={enumVal(p.accountingRule, "1")}
            />
            <InfoRow icon={<FileText className="h-4 w-4" />} label="External ID" value={p.externalId ?? "—"} />
            <InfoRow
              icon={<DollarSign className="h-4 w-4" />}
              label="Min Principal"
              value={p.minPrincipal?.toLocaleString() ?? "—"}
            />
            <InfoRow
              icon={<DollarSign className="h-4 w-4" />}
              label="Max Principal"
              value={p.maxPrincipal?.toLocaleString() ?? "—"}
            />
            <InfoRow
              icon={<Percent className="h-4 w-4" />}
              label="Min Interest Rate"
              value={p.minInterestRatePerPeriod != null ? `${p.minInterestRatePerPeriod}%` : "—"}
            />
            <InfoRow
              icon={<Percent className="h-4 w-4" />}
              label="Max Interest Rate"
              value={p.maxInterestRatePerPeriod != null ? `${p.maxInterestRatePerPeriod}%` : "—"}
            />
            <InfoRow
              icon={<Repeat className="h-4 w-4" />}
              label="Min Repayments"
              value={p.minNumberOfRepayments ?? "—"}
            />
            <InfoRow
              icon={<Repeat className="h-4 w-4" />}
              label="Max Repayments"
              value={p.maxNumberOfRepayments ?? "—"}
            />
          </CardContent>
        </Card>
      </div>

      {/* Active Chart (if any) */}
      {(product as any).activeChart?.chartSlabs?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Interest Rate Chart</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-lg border dark:border-gray-700">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Description</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Period Type</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-500">From</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-500">To</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-500">Annual Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-gray-700">
                  {(product as any).activeChart.chartSlabs.map((slab: any, i: number) => (
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

export default LoanProductViewPage;
