import { type FC } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Repeat } from "lucide-react";
import type { Loan } from "../types/loan";
import { formatDate } from "../utils/format";

interface LoanTermVariationsCardProps {
  loan: Loan;
}

const LoanTermVariationsCard: FC<LoanTermVariationsCardProps> = ({ loan }) => {
  const { t } = useTranslation();
  const variations = (loan as any).loanTermVariationsData ?? (loan as any).termVariations ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Repeat className="h-5 w-5 text-[#D32F2F]" />
          {t("Term Variations")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {variations.length === 0 ? (
          <p className="text-sm text-gray-500">{t("No term variations found.")}</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border dark:border-gray-700">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("Type")}</TableHead>
                  <TableHead>{t("Applicable From")}</TableHead>
                  <TableHead>{t("Value")}</TableHead>
                  <TableHead>{t("Processed")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {variations.map((v: any, i: number) => (
                  <TableRow key={i}>
                    <TableCell>{v.termType?.value ?? v.termType?.code ?? "—"}</TableCell>
                    <TableCell>{formatDate(v.termVariationApplicableFrom)}</TableCell>
                    <TableCell className="font-mono">{v.decimalValue ?? v.dateValue ?? "—"}</TableCell>
                    <TableCell>{v.isProcessed ? t("Yes") : t("No")}</TableCell>
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

export default LoanTermVariationsCard;
