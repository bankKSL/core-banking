import { type FC } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText } from "lucide-react";
import { useBuydownFees } from "../hooks/useBuydownAndCapitalized";
import { formatMoney } from "../utils/format";

interface LoanBuydownFeesCardProps {
  loanId: number;
  currencyCode?: string;
}

const LoanBuydownFeesCard: FC<LoanBuydownFeesCardProps> = ({ loanId, currencyCode }) => {
  const { t } = useTranslation();
  const { data: fees = [], isLoading } = useBuydownFees(loanId);

  if (isLoading) return <Skeleton className="h-32 w-full" />;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText className="h-5 w-5 text-[#D32F2F]" />
          {t("Buy-down Fees")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {fees.length === 0 ? (
          <p className="text-sm text-gray-500">{t("No buy-down fee entries found.")}</p>
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
                {fees.map((fee) => (
                  <TableRow key={fee.id}>
                    <TableCell className="font-mono">{fee.id}</TableCell>
                    <TableCell>{fee.date}</TableCell>
                    <TableCell className="font-mono">{formatMoney(fee.amount, currencyCode)}</TableCell>
                    <TableCell className="font-mono">{formatMoney(fee.amortizedAmount, currencyCode)}</TableCell>
                    <TableCell className="font-mono">{formatMoney(fee.unamortizedAmount, currencyCode)}</TableCell>
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

export default LoanBuydownFeesCard;
