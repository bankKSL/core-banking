import { type FC } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign } from "lucide-react";
import { useCapitalizedIncomes } from "../hooks/useBuydownAndCapitalized";
import { formatMoney } from "../utils/format";

interface LoanDeferredIncomeCardProps {
  loanId: number;
  currencyCode?: string;
}

const LoanDeferredIncomeCard: FC<LoanDeferredIncomeCardProps> = ({ loanId, currencyCode }) => {
  const { t } = useTranslation();
  const { data: incomes = [], isLoading } = useCapitalizedIncomes(loanId);

  if (isLoading) return <Skeleton className="h-32 w-full" />;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <DollarSign className="h-5 w-5 text-[#D32F2F]" />
          {t("Deferred Income")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {incomes.length === 0 ? (
          <p className="text-sm text-gray-500">{t("No deferred income entries found.")}</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border dark:border-gray-700">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("ID")}</TableHead>
                  <TableHead>{t("Date")}</TableHead>
                  <TableHead>{t("Amount")}</TableHead>
                  <TableHead>{t("Amortized")}</TableHead>
                  <TableHead>{t("Unamortized")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {incomes.map((inc) => (
                  <TableRow key={inc.id}>
                    <TableCell className="font-mono">{inc.id}</TableCell>
                    <TableCell>{inc.date}</TableCell>
                    <TableCell className="font-mono">{formatMoney(inc.amount, currencyCode)}</TableCell>
                    <TableCell className="font-mono">{formatMoney(inc.amortizedAmount, currencyCode)}</TableCell>
                    <TableCell className="font-mono">{formatMoney(inc.unamortizedAmount, currencyCode)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LoanDeferredIncomeCard;
