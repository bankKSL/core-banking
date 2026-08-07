import { type FC } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Database } from "lucide-react";
import { useStandingInstructions } from "@/features/standing-instructions/hooks/useStandingInstructions";

interface LoanStandingInstructionsCardProps {
  loanId: number;
}

const LoanStandingInstructionsCard: FC<LoanStandingInstructionsCardProps> = ({ loanId }) => {
  const { t } = useTranslation();
  const { data: siData, isLoading } = useStandingInstructions({ loanId });
  const instructions = siData?.pageItems ?? siData ?? [];

  if (isLoading) return <Skeleton className="h-32 w-full" />;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Database className="h-5 w-5 text-[#D32F2F]" />
          {t("Standing Instructions")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {Array.isArray(instructions) && instructions.length === 0 ? (
          <p className="text-sm text-gray-500">{t("No standing instructions linked to this loan.")}</p>
        ) : Array.isArray(instructions) && instructions.length > 0 ? (
          <div className="overflow-x-auto rounded-lg border dark:border-gray-700">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("Name")}</TableHead>
                  <TableHead>{t("From Account")}</TableHead>
                  <TableHead>{t("To Account")}</TableHead>
                  <TableHead>{t("Amount")}</TableHead>
                  <TableHead>{t("Status")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {instructions.map((si: any) => (
                  <TableRow key={si.id}>
                    <TableCell className="font-medium">{si.name}</TableCell>
                    <TableCell className="font-mono text-sm">{si.fromAccount?.accountNo ?? si.fromAccountId ?? "—"}</TableCell>
                    <TableCell className="font-mono text-sm">{si.toAccount?.accountNo ?? si.toAccountId ?? "—"}</TableCell>
                    <TableCell className="font-mono">{si.amount?.toLocaleString() ?? "—"}</TableCell>
                    <TableCell>{si.status ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p className="text-sm text-gray-500">{t("No standing instructions linked to this loan.")}</p>
        )}
      </CardContent>
    </Card>
  );
};

export default LoanStandingInstructionsCard;
