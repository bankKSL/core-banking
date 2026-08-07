import { type FC } from "react";
import { useTranslation } from "react-i18next";
import { Landmark } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Loan } from "../types/loan";

interface LoanAccountingCardProps {
  loan: Loan;
}

const currency = (loan: Loan) => loan.summary?.currency?.code ?? "USD";

const money = (n: number, code: string) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: code, maximumFractionDigits: 2 }).format(n);

/**
 * Accounting summary built from the documented loan response shape
 * (summary blocks + transaction portions). Built client-side against the
 * documented payload; hidden when the accounting data is unavailable.
 */
const LoanAccountingCard: FC<LoanAccountingCardProps> = ({ loan }) => {
  const { t } = useTranslation();
  const code = currency(loan);
  const summary = loan.summary;
  const transactions = loan.transactions ?? [];

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Landmark className="h-4 w-4 text-gray-400" />
            {t("Principal & Interest")}
          </CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-gray-100 dark:divide-gray-800 text-sm">
          {[
            { label: t("Principal Disbursed"), value: money(summary?.principalDisbursed ?? 0, code) },
            { label: t("Principal Paid"), value: money(summary?.principalPaid ?? 0, code) },
            { label: t("Principal Written Off"), value: money(summary?.principalWrittenOff ?? 0, code) },
            { label: t("Principal Outstanding"), value: money(summary?.principalOutstanding ?? 0, code) },
            { label: t("Interest Accrued"), value: money(summary?.totalExpectedCostOfLoan ?? 0, code) },
            { label: t("Interest Paid"), value: money(summary?.interestPaid ?? 0, code) },
            { label: t("Interest Written Off"), value: money(summary?.interestWrittenOff ?? 0, code) },
            { label: t("Interest Outstanding"), value: money(summary?.interestOutstanding ?? 0, code) },
          ].map((row) => (
            <div key={row.label} className="flex items-center justify-between py-2">
              <span className="text-gray-500 dark:text-gray-400">{row.label}</span>
              <span className="font-mono font-medium">{row.value}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Landmark className="h-4 w-4 text-gray-400" />
            {t("Fees, Penalties & Total")}
          </CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-gray-100 dark:divide-gray-800 text-sm">
          {[
            { label: t("Fee Charges Paid"), value: money(summary?.feeChargesPaid ?? 0, code) },
            { label: t("Fee Charges Outstanding"), value: money(summary?.feeChargesOutstanding ?? 0, code) },
            { label: t("Penalty Charges Paid"), value: money(summary?.penaltyChargesPaid ?? 0, code) },
            { label: t("Penalty Charges Outstanding"), value: money(summary?.penaltyChargesOutstanding ?? 0, code) },
            { label: t("Total Written Off"), value: money(summary?.totalWrittenOff ?? 0, code) },
            { label: t("Total Repaid"), value: money(summary?.totalRepayment ?? 0, code) },
            { label: t("Total Outstanding"), value: money(summary?.totalOutstanding ?? 0, code) },
          ].map((row) => (
            <div key={row.label} className="flex items-center justify-between py-2">
              <span className="text-gray-500 dark:text-gray-400">{row.label}</span>
              <span className="font-mono font-medium">{row.value}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {transactions.length > 0 && (
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Landmark className="h-4 w-4 text-gray-400" />
              {t("Transaction Contributions")}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("Type")}</TableHead>
                  <TableHead className="text-right">{t("Amount")}</TableHead>
                  <TableHead className="text-right">{t("Principal")}</TableHead>
                  <TableHead className="text-right">{t("Interest")}</TableHead>
                  <TableHead className="text-right">{t("Fees")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="text-sm">{tx.type?.value ?? "—"}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{money(tx.amount ?? 0, code)}</TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {money(tx.principalPortion ?? 0, code)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">{money(tx.interestPortion ?? 0, code)}</TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {money((tx.feeChargesPortion ?? 0) + (tx.penaltyChargesPortion ?? 0), code)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default LoanAccountingCard;
export type { LoanAccountingCardProps };