import { type FC } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertCircle } from "lucide-react";
import type { Loan } from "../types/loan";
import { formatMoney } from "../utils/format";

interface LoanOverdueChargesCardProps {
  loan: Loan;
  currencyCode?: string;
}

const LoanOverdueChargesCard: FC<LoanOverdueChargesCardProps> = ({ loan, currencyCode }) => {
  const { t } = useTranslation();
  const overdueCharges = (loan as any).overdueCharges ?? [];
  const isInArrears = loan.inArrears ?? false;
  const overdueSince = loan.overdueSinceDate;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <AlertCircle className="h-5 w-5 text-[#D32F2F]" />
          {t("Overdue Charges")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">{t("In Arrears")}</span>
            <Badge variant={isInArrears ? "error" : "success"} size="sm">
              {isInArrears ? t("Yes") : t("No")}
            </Badge>
          </div>
          {overdueSince && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">{t("Overdue Since")}</span>
              <span className="font-medium">{String(overdueSince)}</span>
            </div>
          )}
          {loan.summary?.totalOverdue != null && loan.summary.totalOverdue > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">{t("Total Overdue")}</span>
              <span className="font-mono font-semibold text-red-600">
                {formatMoney(loan.summary.totalOverdue, currencyCode)}
              </span>
            </div>
          )}
          {overdueCharges.length > 0 ? (
            <div className="overflow-x-auto rounded-lg border dark:border-gray-700">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("Name")}</TableHead>
                    <TableHead>{t("Amount")}</TableHead>
                    <TableHead>{t("Outstanding")}</TableHead>
                    <TableHead>{t("Type")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {overdueCharges.map((charge: any, i: number) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{charge.name}</TableCell>
                      <TableCell className="font-mono">{formatMoney(charge.amount, currencyCode)}</TableCell>
                      <TableCell className="font-mono">{formatMoney(charge.amountOutstanding, currencyCode)}</TableCell>
                      <TableCell>{charge.chargeTimeType?.value ?? "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-sm text-gray-500">{t("No overdue charges.")}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default LoanOverdueChargesCard;
