import { type FC } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText } from "lucide-react";
import type { Loan } from "../types/loan";
import { formatDate } from "../utils/format";

interface LoanTrancheDetailsCardProps {
  loan: Loan;
}

const LoanTrancheDetailsCard: FC<LoanTrancheDetailsCardProps> = ({ loan }) => {
  const { t } = useTranslation();
  const disbursementData = (loan as any).disbursementDetails ?? (loan as any).disbursementData ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText className="h-5 w-5 text-[#D32F2F]" />
          {t("Tranche Details")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">{t("Multi-Disburse")}</span>
            <Badge variant={loan.multiDisburseLoan ? "success" : "default"} size="sm">
              {loan.multiDisburseLoan ? t("Enabled") : t("Disabled")}
            </Badge>
          </div>
          {loan.maxTrancheCount != null && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">{t("Max Tranche Count")}</span>
              <span className="font-medium">{loan.maxTrancheCount}</span>
            </div>
          )}
          {loan.outstandingLoanBalance != null && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">{t("Max Outstanding Balance")}</span>
              <span className="font-medium">{loan.outstandingLoanBalance?.toLocaleString()}</span>
            </div>
          )}
          {disbursementData.length > 0 && (
            <div className="mt-4 overflow-x-auto rounded-lg border dark:border-gray-700">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium text-gray-500">{t("Expected Date")}</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-500">{t("Actual Date")}</th>
                    <th className="px-4 py-2 text-right font-medium text-gray-500">{t("Principal")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-gray-700">
                  {disbursementData.map((tranche: any, i: number) => (
                    <tr key={i}>
                      <td className="px-4 py-2">{formatDate(tranche.expectedDisbursementDate)}</td>
                      <td className="px-4 py-2">{formatDate(tranche.actualDisbursementDate)}</td>
                      <td className="px-4 py-2 text-right font-mono">{tranche.principal?.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {disbursementData.length === 0 && (
            <p className="text-sm text-gray-500">{t("No tranche details available.")}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default LoanTrancheDetailsCard;
