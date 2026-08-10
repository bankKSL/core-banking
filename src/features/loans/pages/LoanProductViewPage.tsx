import React from "react";
import { useTranslation } from "react-i18next";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Pencil,
  Landmark,
  DollarSign,
  Repeat,
  Percent,
  CalendarClock,
  FileText,
  Shield,
  Settings,
  AlertCircle,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useLoanProduct, formatDate } from "@/features/loans";

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
      <div className="mt-0.5 text-sm font-medium text-gray-900 dark:text-gray-100">{value ?? "—"}</div>
    </div>
  </div>
);

const LoanProductViewPage: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: product, isLoading } = useLoanProduct(id ? Number(id) : undefined);

  if (isLoading) {
    return (
      <div className="max-w-6xl m-auto space-y-6">
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
      <div className="p-6 max-w-6xl m-auto">
        <PageHeader
          title={t("Product Not Found")}
          description={t("The requested loan product does not exist.")}
          actions={
            <Button variant="outline" onClick={() => navigate("/lending/products")}>
              <ArrowLeft className="mr-2 h-4 w-4" /> {t("Back")}
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
              <ArrowLeft className="mr-2 h-4 w-4" /> {t("Back")}
            </Button>
            <Button onClick={() => navigate(`/lending/products/edit/${id}`)} className="bg-[#D32F2F] hover:bg-red-700">
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
              {t("Product Details")}
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-gray-100 dark:divide-gray-800">
            <InfoRow icon={<FileText className="h-4 w-4" />} label={t("Short Name")} value={p.shortName ?? "—"} />
            <InfoRow icon={<FileText className="h-4 w-4" />} label={t("Description")} value={p.description ?? "—"} />
            <InfoRow
              icon={<DollarSign className="h-4 w-4" />}
              label={t("Currency")}
              value={p.currency?.displaySymbol ?? p.currency?.code ?? "—"}
            />
            <InfoRow
              icon={<DollarSign className="h-4 w-4" />}
              label={t("Digits After Decimal")}
              value={p.currency?.decimalPlaces ?? 2}
            />
            <InfoRow
              icon={<DollarSign className="h-4 w-4" />}
              label={t("In Multiples Of")}
              value={p.currency?.inMultiplesOf ?? 0}
            />
            <InfoRow
              icon={<Landmark className="h-4 w-4" />}
              label={t("Fund")}
              value={p.fund?.name ?? p.fundName ?? "—"}
            />
            <InfoRow
              icon={<CalendarClock className="h-4 w-4" />}
              label={t("Start Date")}
              value={formatDate(p.startDate)}
            />
            <InfoRow
              icon={<CalendarClock className="h-4 w-4" />}
              label={t("Close Date")}
              value={formatDate(p.closeDate)}
            />
            <InfoRow
              icon={
                <Badge variant={isProgressive ? "info" : "default"} size="sm" rounded>
                  {isProgressive ? t("Progressive") : t("Cumulative")}
                </Badge>
              }
              label={t("Schedule Type")}
              value={enumVal(p.loanScheduleType, t("Cumulative"))}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Percent className="h-5 w-5 text-[#D32F2F]" />
              {t("Terms")}
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-gray-100 dark:divide-gray-800">
            <InfoRow
              icon={<DollarSign className="h-4 w-4" />}
              label={t("Principal")}
              value={p.principal?.toLocaleString()}
            />
            <InfoRow
              icon={<Percent className="h-4 w-4 text-emerald-500" />}
              label={t("Interest Rate")}
              value={`${p.interestRatePerPeriod}%`}
            />
            <InfoRow
              icon={<Percent className="h-4 w-4" />}
              label={t("Interest Rate Frequency")}
              value={getLabel("interestRateFrequencyType", enumId(p.interestRateFrequencyType))}
            />
            <InfoRow
              icon={<Repeat className="h-4 w-4" />}
              label={t("Amortization")}
              value={getLabel("amortizationType", enumId(p.amortizationType))}
            />
            <InfoRow
              icon={<Repeat className="h-4 w-4" />}
              label={t("Interest Type")}
              value={getLabel("interestType", enumId(p.interestType))}
            />
            <InfoRow
              icon={<CalendarClock className="h-4 w-4" />}
              label={t("Interest Calculation")}
              value={getLabel("interestCalculationPeriodType", enumId(p.interestCalculationPeriodType))}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Repeat className="h-5 w-5 text-[#D32F2F]" />
              {t("Repayment")}
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-gray-100 dark:divide-gray-800">
            <InfoRow
              icon={<Repeat className="h-4 w-4" />}
              label={t("Number of Repayments")}
              value={p.numberOfRepayments}
            />
            <InfoRow
              icon={<Repeat className="h-4 w-4" />}
              label={t("Repayment Every")}
              value={`${p.repaymentEvery} ${getLabel("repaymentFrequencyType", enumId(p.repaymentFrequencyType))}`}
            />
            <InfoRow
              icon={<CalendarClock className="h-4 w-4" />}
              label={t("Days In Year")}
              value={getLabel("daysInYearType", enumId(p.daysInYearType))}
            />
            <InfoRow
              icon={<CalendarClock className="h-4 w-4" />}
              label={t("Days In Month")}
              value={getLabel("daysInMonthType", enumId(p.daysInMonthType))}
            />
            <InfoRow
              icon={
                <Badge variant="info" size="sm">
                  {p.isInterestRecalculationEnabled ? t("Enabled") : t("Disabled")}
                </Badge>
              }
              label={t("Interest Recalculation")}
              value={p.isInterestRecalculationEnabled ? t("Enabled") : t("Disabled")}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-5 w-5 text-[#D32F2F]" />
              {t("Configuration")}
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-gray-100 dark:divide-gray-800">
            <InfoRow
              icon={<FileText className="h-4 w-4" />}
              label={t("Transaction Strategy")}
              value={p.transactionProcessingStrategyName ?? p.transactionProcessingStrategyCode ?? "—"}
            />
            <InfoRow
              icon={<FileText className="h-4 w-4" />}
              label={t("Accounting Rule")}
              value={enumVal(p.accountingRule, "1")}
            />
            <InfoRow icon={<FileText className="h-4 w-4" />} label={t("External ID")} value={p.externalId ?? "—"} />
            <InfoRow
              icon={<DollarSign className="h-4 w-4" />}
              label={t("Min Principal")}
              value={p.minPrincipal?.toLocaleString() ?? "—"}
            />
            <InfoRow
              icon={<DollarSign className="h-4 w-4" />}
              label={t("Max Principal")}
              value={p.maxPrincipal?.toLocaleString() ?? "—"}
            />
            <InfoRow
              icon={<Percent className="h-4 w-4" />}
              label={t("Min Interest Rate")}
              value={p.minInterestRatePerPeriod != null ? `${p.minInterestRatePerPeriod}%` : "—"}
            />
            <InfoRow
              icon={<Percent className="h-4 w-4" />}
              label={t("Max Interest Rate")}
              value={p.maxInterestRatePerPeriod != null ? `${p.maxInterestRatePerPeriod}%` : "—"}
            />
            <InfoRow
              icon={<Repeat className="h-4 w-4" />}
              label={t("Min Repayments")}
              value={p.minNumberOfRepayments ?? "—"}
            />
            <InfoRow
              icon={<Repeat className="h-4 w-4" />}
              label={t("Max Repayments")}
              value={p.maxNumberOfRepayments ?? "—"}
            />
          </CardContent>
        </Card>
      </div>

      {/* Charges */}
      {p.charges?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <DollarSign className="h-5 w-5 text-[#D32F2F]" />
              {t("Charges")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-lg border dark:border-gray-700">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("Name")}</TableHead>
                    <TableHead>{t("Type")}</TableHead>
                    <TableHead>{t("Amount")}</TableHead>
                    <TableHead>{t("Collected As")}</TableHead>
                    <TableHead>{t("Penalty")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {p.charges.map((charge: any, i: number) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{charge.name}</TableCell>
                      <TableCell>{enumVal(charge.chargeTimeType)}</TableCell>
                      <TableCell className="font-mono">{charge.amount?.toLocaleString()}</TableCell>
                      <TableCell>{enumVal(charge.chargeCalculationType)}</TableCell>
                      <TableCell>
                        <Badge variant={charge.isPenalty ? "error" : "default"} size="sm">
                          {charge.isPenalty ? t("Yes") : t("No")}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Accounting */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-5 w-5 text-[#D32F2F]" />
            {t("Accounting")}
          </CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-gray-100 dark:divide-gray-800">
          <InfoRow
            icon={<Shield className="h-4 w-4" />}
            label={t("Accounting Rule")}
            value={
              <Badge
                variant={
                  enumVal(p.accountingRule) === "CASH"
                    ? "info"
                    : enumVal(p.accountingRule) === "ACCRUAL"
                      ? "default"
                      : "warning"
                }
              >
                {enumVal(p.accountingRule, "NONE")}
              </Badge>
            }
          />
          {p.accountingMappings &&
            typeof p.accountingMappings === "object" &&
            Object.entries(p.accountingMappings as Record<string, unknown>).map(([key, val]) => (
              <InfoRow
                key={key}
                icon={<FileText className="h-4 w-4" />}
                label={key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())}
                value={
                  typeof val === "object" && val !== null
                    ? ((val as any).name ?? JSON.stringify(val))
                    : String(val ?? "—")
                }
              />
            ))}
        </CardContent>
      </Card>

      {/* Advanced Rules */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Settings className="h-5 w-5 text-[#D32F2F]" />
            {t("Advanced Rules")}
          </CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-gray-100 dark:divide-gray-800">
          <InfoRow
            icon={<Settings className="h-4 w-4" />}
            label={t("Multi-Disburse")}
            value={
              <Badge variant={p.multiDisburseLoan ? "success" : "default"} size="sm">
                {p.multiDisburseLoan ? t("Enabled") : t("Disabled")}
              </Badge>
            }
          />
          {p.multiDisburseLoan && (
            <>
              <InfoRow
                icon={<FileText className="h-4 w-4" />}
                label={t("Max Tranche Count")}
                value={p.maxTrancheCount ?? "—"}
              />
              <InfoRow
                icon={<DollarSign className="h-4 w-4" />}
                label={t("Max Outstanding Balance")}
                value={p.outstandingLoanBalance?.toLocaleString() ?? "—"}
              />
              <InfoRow
                icon={<FileText className="h-4 w-4" />}
                label={t("Can Define Installment Amount")}
                value={p.canDefineInstallmentAmount ? t("Yes") : t("No")}
              />
            </>
          )}
          <InfoRow
            icon={<Repeat className="h-4 w-4" />}
            label={t("Borrower Cycle")}
            value={
              <Badge variant={p.includeInBorrowerCycle || p.useBorrowerCycle ? "info" : "default"} size="sm">
                {p.includeInBorrowerCycle || p.useBorrowerCycle ? t("Enabled") : t("Disabled")}
              </Badge>
            }
          />
          <InfoRow
            icon={<AlertCircle className="h-4 w-4" />}
            label={t("Interest Recalculation")}
            value={
              <Badge variant={p.isInterestRecalculationEnabled ? "warning" : "default"} size="sm">
                {p.isInterestRecalculationEnabled ? t("Enabled") : t("Disabled")}
              </Badge>
            }
          />
          <InfoRow
            icon={<Percent className="h-4 w-4" />}
            label={t("Floating Interest Rates")}
            value={
              <Badge variant={p.isLinkedToFloatingInterestRates ? "info" : "default"} size="sm">
                {p.isLinkedToFloatingInterestRates ? t("Linked") : t("Not Linked")}
              </Badge>
            }
          />
          <InfoRow
            icon={<FileText className="h-4 w-4" />}
            label={t("Allow Partial Period Interest")}
            value={p.allowPartialPeriodInterestCalculation ? t("Yes") : t("No")}
          />
          <InfoRow
            icon={<FileText className="h-4 w-4" />}
            label={t("Days In Month")}
            value={getLabel("daysInMonthType", enumId(p.daysInMonthType))}
          />
          <InfoRow
            icon={<FileText className="h-4 w-4" />}
            label={t("Days In Year")}
            value={getLabel("daysInYearType", enumId(p.daysInYearType))}
          />
          <InfoRow
            icon={<FileText className="h-4 w-4" />}
            label={t("Grace on Principal")}
            value={p.graceOnPrincipalPayment ?? 0}
          />
          <InfoRow
            icon={<FileText className="h-4 w-4" />}
            label={t("Grace on Interest")}
            value={p.graceOnInterestPayment ?? 0}
          />
          <InfoRow
            icon={<DollarSign className="h-4 w-4" />}
            label={t("Arrears Tolerance")}
            value={p.inArrearsTolerance?.toLocaleString() ?? "0"}
          />
        </CardContent>
      </Card>

      {/* Active Chart (if any) */}
      {(product as any).activeChart?.chartSlabs?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("Interest Rate Chart")}</CardTitle>
          </CardHeader>
          <CardContent>
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
