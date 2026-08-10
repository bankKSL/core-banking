import { type FC } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Building } from "lucide-react";
import { useActiveTransfer } from "@/features/external-asset-owners";
import { formatDate } from "../utils/format";

interface LoanExternalAssetOwnerCardProps {
  loanId: number;
}

const LoanExternalAssetOwnerCard: FC<LoanExternalAssetOwnerCardProps> = ({ loanId }) => {
  const { t } = useTranslation();
  const { data: transfer, isLoading } = useActiveTransfer(loanId);

  if (isLoading) return <Skeleton className="h-32 w-full" />;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Building className="h-5 w-5 text-[#D32F2F]" />
          {t("External Asset Owner")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!transfer ? (
          <p className="text-sm text-gray-500">{t("No active external asset owner transfer for this loan.")}</p>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">{t("Owner")}</span>
              <span className="font-medium">{(transfer as any).ownerName ?? (transfer as any).owner ?? "—"}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">{t("Status")}</span>
              <Badge variant="info" size="sm">
                {(transfer as any).status ?? "—"}
              </Badge>
            </div>
            {(transfer as any).effectiveDate && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">{t("Effective Date")}</span>
                <span>{formatDate((transfer as any).effectiveDate)}</span>
              </div>
            )}
            {(transfer as any).settlementDate && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">{t("Settlement Date")}</span>
                <span>{formatDate((transfer as any).settlementDate)}</span>
              </div>
            )}
            {(transfer as any).transferExternalId && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">{t("Transfer External ID")}</span>
                <span className="font-mono">{(transfer as any).transferExternalId}</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LoanExternalAssetOwnerCard;
