import type { FC } from "react";
import { useNavigate } from "react-router-dom";
import { DataTable, type ColumnDef } from "@/components/shared/DataTable";
import type { Client } from "../types/client";
import ClientStatusBadge from "./ClientStatusBadge";
import { getClientDisplayName, getClientStatus, formatClientDate } from "../utils/client";

interface ClientTableProps {
  data: Client[];
  loading: boolean;
  onRowClick?: (client: Client) => void;
}

const ClientTable: FC<ClientTableProps> = ({ data, loading, onRowClick }) => {
  const navigate = useNavigate();

  const columns: ColumnDef<Client>[] = [
    {
      key: "id",
      header: "Client ID",
      accessorFn: (row) => <span className="font-mono text-xs font-medium">{row.id}</span>,
      sortable: true,
    },
    {
      key: "accountNo",
      header: "Account No",
      accessorFn: (row) => <span className="text-sm">{row.accountNo ?? "—"}</span>,
      sortable: true,
    },
    {
      key: "externalId",
      header: "External ID",
      accessorFn: (row) => <span className="text-sm text-gray-500">{row.externalId ?? "—"}</span>,
      sortable: true,
    },
    {
      key: "displayName",
      header: "Full Name",
      accessorFn: (row) => (
        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{getClientDisplayName(row)}</span>
      ),
      sortable: true,
    },
    {
      key: "officeName",
      header: "Office",
      accessorFn: (row) => <span className="text-sm">{row.officeName ?? "—"}</span>,
      sortable: true,
    },
    {
      key: "staffName",
      header: "Staff",
      accessorFn: (row) => <span className="text-sm">{row.staffName ?? "—"}</span>,
      sortable: true,
    },
    {
      key: "mobileNo",
      header: "Mobile",
      accessorFn: (row) => <span className="text-sm">{row.mobileNo ?? "—"}</span>,
    },
    {
      key: "status",
      header: "Status",
      accessorFn: (row) => <ClientStatusBadge status={getClientStatus(row)} size="sm" />,
      sortable: true,
    },
    {
      key: "activationDate",
      header: "Activation Date",
      accessorFn: (row) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">{formatClientDate(row.activationDate)}</span>
      ),
      sortable: true,
    },
  ];

  const handleRowClick = (client: Client) => {
    if (onRowClick) {
      onRowClick(client);
    } else {
      navigate(`/clients/${client.id}`);
    }
  };

  return (
    <DataTable
      columns={columns}
      data={data}
      loading={loading}
      onRowClick={handleRowClick}
      idAccessor={(row) => String(row.id)}
      skeletonRowCount={8}
      emptyState={{
        message: "No clients found. Try adjusting your search or filters.",
      }}
      minWidth={900}
    />
  );
};

export default ClientTable;
