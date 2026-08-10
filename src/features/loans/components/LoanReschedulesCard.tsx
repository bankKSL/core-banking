import { type FC } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Repeat } from "lucide-react";
import { useRescheduleRequests } from "../hooks/useRescheduleLoans";
import { formatDate } from "../utils/format";

interface LoanReschedulesCardProps {
  loanId: number;
}

const LoanReschedulesCard: FC<LoanReschedulesCardProps> = ({ loanId }) => {
  const { t } = useTranslation();
  const { data: reschedules = [], isLoading } = useRescheduleRequests({ loanId });

  if (isLoading) return <Skeleton className="h-32 w-full" />;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Repeat className="h-5 w-5 text-[#D32F2F]" />
          {t("Reschedule Requests")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {reschedules.length === 0 ? (
          <p className="text-sm text-gray-500">{t("No reschedule requests found.")}</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border dark:border-gray-700">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("ID")}</TableHead>
                  <TableHead>{t("Status")}</TableHead>
                  <TableHead>{t("From Date")}</TableHead>
                  <TableHead>{t("Submitted On")}</TableHead>
                  <TableHead>{t("Reason")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reschedules.map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono">{r.id}</TableCell>
                    <TableCell>
                      <Badge
                        variant={r.status?.id === 200 ? "success" : r.status?.id === 300 ? "error" : "info"}
                        size="sm"
                      >
                        {r.status?.value ?? "—"}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(r.rescheduleFromDate)}</TableCell>
                    <TableCell>{formatDate(r.submittedOnDate)}</TableCell>
                    <TableCell>{r.rescheduleReasonName ?? r.rescheduleReasonComment ?? "—"}</TableCell>
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

export default LoanReschedulesCard;
