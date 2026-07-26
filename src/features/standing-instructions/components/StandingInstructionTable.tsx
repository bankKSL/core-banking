import React, { useMemo } from "react";
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
  const columns: ColumnDef<StandingInstruction>[] = useMemo(
    () => [
      { key: "name", header: "Name", accessorFn: (row) => row.name ?? "—" },
      {
        key: "fromClient",
        header: "From Client",
        accessorFn: (row) => row.fromClient?.displayName ?? "—",
      },
      {
        key: "fromAccount",
        header: "From Account",
        accessorFn: (row) => row.fromAccount?.accountNo ?? "—",
      },
      {
        key: "toClient",
        header: "To Client",
        accessorFn: (row) => row.toClient?.displayName ?? "—",
      },
      {
        key: "toAccount",
        header: "To Account",
        accessorFn: (row) => row.toAccount?.accountNo ?? "—",
      },
      {
        key: "amount",
        header: "Amount",
        accessorFn: (row) => formatAmount(row.amount),
      },
      {
        key: "status",
        header: "Status",
        accessorFn: (row) => <StandingInstructionStatusBadge status={row.status} />,
      },
      {
        key: "validFrom",
        header: "Valid From",
        accessorFn: (row) => formatDate(row.validFrom),
      },
      {
        key: "validTill",
        header: "Valid Till",
        accessorFn: (row) => formatDate(row.validTill),
      },
    ],
    [],
  );

  return (
    <DataTable
      columns={columns}
      data={data}
      onRowClick={onRowClick}
      loading={loading}
      emptyState={{ message: "No standing instructions found." }}
    />
  );
};

export { StandingInstructionTable };
