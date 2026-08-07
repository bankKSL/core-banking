import { type FC } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Percent } from "lucide-react";
import type { Loan } from "../types/loan";

interface LoanFloatingRatesCardProps {
  loan: Loan;
}

const LoanFloatingRatesCard: FC<LoanFloatingRatesCardProps> = ({ loan }) => {
  const { t } = useTranslation();
  const floatingData = (loan as any).interestRateDifferential ?? null;
  const floatingRate = (loan as any).floatingRateName ?? (loan as any).floatingRateId ?? null;
  const isLinked = loan.isFloatingInterestRate ?? (loan as any).isLinkedToFloatingInterestRates ?? false;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Percent className="h-5 w-5 text-[#D32F2F]" />
          {t("Floating Interest Rates")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">{t("Linked to Floating Rate")}</span>
            <Badge variant={isLinked ? "info" : "default"} size="sm">
              {isLinked ? t("Yes") : t("No")}
            </Badge>
          </div>
          {floatingRate && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">{t("Floating Rate")}</span>
              <span className="font-medium">{floatingRate}</span>
            </div>
          )}
          {floatingData != null && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">{t("Interest Rate Differential")}</span>
              <span className="font-medium">{floatingData}%</span>
            </div>
          )}
          {!isLinked && !floatingRate && (
            <p className="text-sm text-gray-500">{t("This loan is not linked to a floating interest rate.")}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default LoanFloatingRatesCard;
