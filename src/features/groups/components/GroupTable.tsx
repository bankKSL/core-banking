import { type FC } from "react";
import { useNavigate } from "react-router-dom";
import { Pencil } from "lucide-react";
import { DataTable, type ColumnDef } from "@/components/shared/DataTable";
import { Button } from "@/components/ui/button";
import GroupStatusBadge from "./GroupStatusBadge";
import type { Group } from "../types/group";

interface GroupTableProps {
  data: Group[];
  loading?: boolean;
}

const GroupTable: FC<GroupTableProps> = ({ data, loading }) => {
  const navigate = useNavigate();

  const columns: ColumnDef<Group>[] = [
    {
      key: "name",
      header: "Group Name",
      cell: (row) => <span className="font-medium text-gray-900 dark:text-gray-100">{row.name ?? "—"}</span>,
    },
    {
      key: "status",
      header: "Status",
      sortable: false,
      cell: (row) => <GroupStatusBadge status={row.status} size="sm" />,
    },
    {
      key: "officeName",
      header: "Office",
      cell: (row) => row.officeName ?? "—",
    },
    {
      key: "hierarchy",
      header: "Hierarchy",
      sortable: false,
      cell: (row) => <span className="text-gray-500 dark:text-gray-400">{row.hierarchy ?? "—"}</span>,
    },
    {
      key: "actions",
      header: "Actions",
      sortable: false,
      headerClassName: "text-right",
      className: "text-right",
      cell: (row) => (
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/groups/edit/${row.id}`);
          }}
        >
          <Pencil className="mr-1.5 h-3.5 w-3.5" />
          Edit
        </Button>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={data}
      loading={loading}
      idAccessor={(row) => String(row.id ?? "")}
      emptyState={{ title: "No groups found", message: "Try adjusting your search, or create a new group." }}
      onRowClick={(row) => navigate(`/groups/edit/${row.id}`)}
    />
  );
};

export default GroupTable;
export type { GroupTableProps };
