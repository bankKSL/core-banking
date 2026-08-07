import React from "react";
import { Pencil, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { DataTable, type ColumnDef } from "@/components/shared/DataTable";
import { Button } from "@/components/ui/button";
import type { Office } from "@/types";

interface OfficeTableProps {
  data: Office[];
  onRowClick?: (office: Office) => void;
  onEdit?: (office: Office) => void;
  onDelete?: (office: Office) => void;
}

const OfficeTable: React.FC<OfficeTableProps> = ({ data, onRowClick, onEdit, onDelete }) => {
  const { t } = useTranslation();
  const columns: ColumnDef<Office>[] = [
    { key: "nameDecorated", header: t("Office Name"), sortable: true },
    { key: "externalId", header: t("External ID") },
    { key: "openingDate", header: t("Opening Date") },
    {
      key: "parentName",
      header: t("Parent Office"),
      cell: (row) => row.parentName ?? "—",
    },
    {
      key: "actions",
      header: "",
      className: "w-[100px]",
      cell: (row) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          {onEdit && (
            <Button variant="ghost" size="icon" onClick={() => onEdit(row)}>
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          {onDelete && (
            <Button variant="ghost" size="icon" onClick={() => onDelete(row)}>
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return <DataTable columns={columns} data={data} onRowClick={onRowClick} />;
};

export default OfficeTable;
