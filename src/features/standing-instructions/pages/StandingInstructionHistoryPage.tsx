import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Clock } from "lucide-react";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, type ColumnDef } from "@/components/shared/DataTable";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/shared/ErrorState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useHistory } from "../hooks/useStandingInstructions";
import { parseFineractDate } from "../api/standing-instructions";
import type { StandingInstructionHistoryItem } from "../types/standing-instruction.types";

function formatDate(dateVal: number[] | null | undefined): string {
  const d = parseFineractDate(dateVal);
  if (!d) return "—";
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatAmount(amount?: number | null): string {
  if (amount == null) return "—";
  return amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const StandingInstructionHistoryPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { data, isLoading, isError, refetch } = useHistory();

  const items = useMemo(() => data?.pageItems ?? [], [data]);

  const columns: ColumnDef<StandingInstructionHistoryItem>[] = useMemo(
    () => [
      { key: "name", header: t("Name"), accessorFn: (row) => row.name ?? "—" },
      { key: "fromClientName", header: t("From Client"), accessorFn: (row) => row.fromClientName ?? "—" },
      {
        key: "fromAccount",
        header: t("From Account"),
        accessorFn: (row) => row.fromAccount?.accountNo ?? "—",
      },
      { key: "toClientName", header: t("To Client"), accessorFn: (row) => row.toClientName ?? "—" },
      {
        key: "toAccount",
        header: t("To Account"),
        accessorFn: (row) => row.toAccount?.accountNo ?? "—",
      },
      {
        key: "amount",
        header: t("Amount"),
        accessorFn: (row) => formatAmount(row.amount),
      },
      {
        key: "executionTime",
        header: t("Execution Time"),
        accessorFn: (row) => formatDate(row.executionTime),
      },
      {
        key: "status",
        header: t("Status"),
        accessorFn: (row) => <StatusBadge status={row.status ?? "unknown"} />,
      },
      {
        key: "errorLog",
        header: t("Error Log"),
        accessorFn: (row) => row.errorLog ?? "—",
        className: "max-w-[200px] truncate",
      },
    ],
    [t],
  );

  if (isError) {
    return (
      <div className="p-6">
        <PageHeader
          title={t("Standing Instruction History")}
          description={t("Execution history of recurring transfers")}
          actions={
            <Button variant="outline" onClick={() => navigate("/transfers/standing-instructions")}>
              <ArrowLeft className="mr-2 h-4 w-4" /> {t("Back")}
            </Button>
          }
        />
        <ErrorState message={t("Failed to load history.")} onRetry={refetch} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("Standing Instruction History")}
        description={t("Execution history of recurring transfers")}
        actions={
          <Button variant="outline" onClick={() => navigate("/transfers/standing-instructions")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> {t("Back")}
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            {t("Execution History")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={items}
            loading={isLoading}
            emptyState={{ message: t("No execution history found.") }}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default StandingInstructionHistoryPage;
