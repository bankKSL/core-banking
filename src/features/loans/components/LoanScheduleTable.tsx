import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { CalendarClock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { LoanRepaymentPeriod } from "../types/loan";
import { formatDate, formatMoney, toIsoDate } from "../utils/format";

interface LoanScheduleTableProps {
  periods: LoanRepaymentPeriod[];
  currencyCode?: string;
  loading?: boolean;
}

type PeriodStatus = "paid" | "partial" | "overdue" | "upcoming";

const getPeriodStatus = (p: LoanRepaymentPeriod): PeriodStatus => {
  const outstanding = p.totalOutstandingForPeriod ?? 0;
  const paid = p.totalPaidForPeriod ?? 0;
  const completed = p.completed ?? p.complete ?? false;
  if (completed || outstanding <= 0) return "paid";
  const dueIso = toIsoDate(p.dueDate);
  const isLate = p.late ?? (dueIso ? new Date(dueIso) < new Date() : false);
  if (isLate) return "overdue";
  if (paid > 0) return "partial";
  return "upcoming";
};

const LoanScheduleTable: FC<LoanScheduleTableProps> = ({ periods, currencyCode = "USD", loading }) => {
  const { t } = useTranslation();
  const STATUS_BADGE: Record<PeriodStatus, { variant: "success" | "warning" | "error" | "default"; label: string }> = {
    paid: { variant: "success", label: t("Paid") },
    partial: { variant: "warning", label: t("Partial") },
    overdue: { variant: "error", label: t("Overdue") },
    upcoming: { variant: "default", label: t("Upcoming") },
  };
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-gray-400" />
            {t("Repayment Schedule")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-10 bg-gray-100 dark:bg-gray-700 animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!periods || periods.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-gray-400" />
            {t("Repayment Schedule")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-400">{t("No repayment schedule available.")}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <CalendarClock className="h-4 w-4 text-gray-400" />
          {t("Repayment Schedule")} ({periods.length} {t("installments")})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>{t("Due Date")}</TableHead>
              <TableHead className="text-right">{t("Principal")}</TableHead>
              <TableHead className="text-right">{t("Interest")}</TableHead>
              <TableHead className="text-right">{t("Fees")}</TableHead>
              <TableHead className="text-right">{t("Total Due")}</TableHead>
              <TableHead className="text-right">{t("Paid")}</TableHead>
              <TableHead className="text-right">{t("Outstanding")}</TableHead>
              <TableHead>{t("Status")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {periods.map((p) => {
              const status = getPeriodStatus(p);
              const badge = STATUS_BADGE[status];
              return (
                <TableRow key={p.period} className={status === "overdue" ? "bg-red-50/50 dark:bg-red-950/20" : ""}>
                  <TableCell className="font-mono text-xs">{p.period}</TableCell>
                  <TableCell className="text-sm">{formatDate(p.dueDate)}</TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {formatMoney(p.principalDue ?? p.principalOriginalDue, currencyCode)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm text-amber-600">
                    {formatMoney(p.interestDue ?? p.interestOriginalDue, currencyCode)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {formatMoney((p.feeChargesDue ?? 0) + (p.penaltyChargesDue ?? 0), currencyCode)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm font-semibold">
                    {formatMoney(p.totalDueForPeriod ?? p.totalOriginalDueForPeriod, currencyCode)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm text-emerald-600">
                    {formatMoney(p.totalPaidForPeriod ?? 0, currencyCode)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm text-red-600">
                    {formatMoney(p.totalOutstandingForPeriod ?? 0, currencyCode)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={badge.variant} size="sm">
                      {badge.label}
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default LoanScheduleTable;
export type { LoanScheduleTableProps };
