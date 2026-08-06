import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Plus, Repeat } from "lucide-react";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable, type ColumnDef } from "@/components/shared/DataTable";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/shared/ErrorState";
import { EmptyState } from "@/components/shared/EmptyState";
import { fetchStandingInstructions, parseDate } from "@/features/transfers";
import type { StandingInstruction } from "@/features/transfers";

function formatDate(dateVal: number[] | undefined): string {
  const d = parseDate(dateVal);
  if (!d) return "—";
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function formatAmount(amount?: number): string {
  if (amount == null) return "—";
  return amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const StandingInstructionsPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["standingInstructions"],
    queryFn: fetchStandingInstructions,
  });

  const instructions = useMemo(() => data?.pageItems ?? [], [data]);

  const columns: ColumnDef<StandingInstruction>[] = useMemo(
    () => [
      { key: "name", header: t("Name"), accessorFn: (row) => row.name ?? "—" },
      {
        key: "fromClient",
        header: t("From Client"),
        accessorFn: (row) => row.fromClient?.displayName ?? "—",
      },
      {
        key: "fromAccount",
        header: t("From Account"),
        accessorFn: (row) => row.fromAccount?.accountNo ?? "—",
      },
      {
        key: "toClient",
        header: t("To Client"),
        accessorFn: (row) => row.toClient?.displayName ?? "—",
      },
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
      { key: "status", header: t("Status"), accessorFn: (row) => row.status ?? "—" },
      {
        key: "validFrom",
        header: t("Valid From"),
        accessorFn: (row) => formatDate(row.validFrom),
      },
      {
        key: "validTill",
        header: t("Valid Till"),
        accessorFn: (row) => formatDate(row.validTill),
      },
    ],
    [t],
  );

  if (isError) {
    return (
      <div className="p-6">
        <PageHeader
          title={t("Standing Instructions")}
          description={t("Manage recurring transfer instructions")}
          actions={
            <Button onClick={() => navigate("/transfers/standing-instructions/new")}>
              <Plus className="mr-2 h-4 w-4" /> {t("New Instruction")}
            </Button>
          }
        />
        <ErrorState message={t("Failed to load standing instructions.")} onRetry={refetch} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("Standing Instructions")}
        description={t("Manage recurring transfer instructions")}
        actions={
          <Button onClick={() => navigate("/transfers/standing-instructions/new")}>
            <Plus className="mr-2 h-4 w-4" /> {t("New Instruction")}
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Repeat className="h-5 w-5" />
            {t("Instructions")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : instructions.length === 0 ? (
            <EmptyState title={t("No standing instructions found.")} />
          ) : (
            <DataTable
              columns={columns}
              data={instructions}
              onRowClick={(row) => navigate(`/transfers/standing-instructions/edit/${row.id}`)}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StandingInstructionsPage;
