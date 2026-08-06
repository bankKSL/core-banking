import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { DataTable, type ColumnDef } from "@/components/shared/DataTable";
import { StandingInstructionStatusBadge } from "./StandingInstructionStatusBadge";
import type { StandingInstruction } from "../types/standing-instruction.types";
import { parseFineractDate } from "../api/standing-instructions";

function formatDate(dateVal: number[] | null | undefined): string {
  const d = parseFineractDate(dateVal);
  if (!d) return "—";
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function formatAmount(amount?: number | null): string {
  if (amount == null) return "—";
  return amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

interface StandingInstructionTableProps {
  data: StandingInstruction[];
  onRowClick?: (row: StandingInstruction) => void;
  loading?: boolean;
}

const StandingInstructionTable: React.FC<StandingInstructionTableProps> = ({ data, onRowClick, loading }) => {
  const { t } = useTranslation();
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
      {
        key: "status",
        header: t("Status"),
        accessorFn: (row) => <StandingInstructionStatusBadge status={row.status} />,
      },
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

  return (
    <DataTable
      columns={columns}
      data={data}
      onRowClick={onRowClick}
      loading={loading}
      emptyState={{ message: t("No standing instructions found.") }}
    />
  );
};

export { StandingInstructionTable };
