import type { FC } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();

  const columns: ColumnDef<Client>[] = [
    {
      key: "id",
      header: t("clients.table.clientId"),
      accessorFn: (row) => <span className="font-mono text-xs font-medium">{row.id}</span>,
      sortable: true,
    },
    {
      key: "accountNo",
      header: t("clients.table.accountNo"),
      accessorFn: (row) => <span className="text-sm">{row.accountNo ?? "—"}</span>,
      sortable: true,
    },
    {
      key: "externalId",
      header: t("clients.table.externalId"),
      accessorFn: (row) => <span className="text-sm text-gray-500">{row.externalId ?? "—"}</span>,
      sortable: true,
    },
    {
      key: "displayName",
      header: t("clients.table.fullName"),
      accessorFn: (row) => (
        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{getClientDisplayName(row)}</span>
      ),
      sortable: true,
    },
    {
      key: "officeName",
      header: t("clients.table.office"),
      accessorFn: (row) => <span className="text-sm">{row.officeName ?? "—"}</span>,
      sortable: true,
    },
    {
      key: "staffName",
      header: t("clients.table.staff"),
      accessorFn: (row) => <span className="text-sm">{row.staffName ?? "—"}</span>,
      sortable: true,
    },
    {
      key: "mobileNo",
      header: t("clients.table.mobile"),
      accessorFn: (row) => <span className="text-sm">{row.mobileNo ?? "—"}</span>,
    },
    {
      key: "status",
      header: t("clients.table.status"),
      accessorFn: (row) => <ClientStatusBadge status={getClientStatus(row)} size="sm" />,
      sortable: true,
    },
    {
      key: "activationDate",
      header: t("clients.table.activationDate"),
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
        message: t("clients.table.noClients"),
      }}
      minWidth={900}
    />
  );
};

export default ClientTable;
