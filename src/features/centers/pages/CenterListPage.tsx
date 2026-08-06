import { type FC, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Plus, AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable, type ColumnDef } from "@/components/shared/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCenters } from "../hooks/useCenters";
import type { CenterData } from "../api/centers";

const statusVariant: Record<string, "success" | "warning" | "error" | "info" | "default"> = {
  "centerStatusType.pending": "info",
  "centerStatusType.active": "success",
  "centerStatusType.closed": "default",
};

const statusLabel: Record<string, string> = {
  "centerStatusType.pending": "Pending",
  "centerStatusType.active": "Active",
  "centerStatusType.closed": "Closed",
};

const PAGE_SIZE = 10;

const CenterListPage: FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);

  const queryParams = useMemo(
    () => ({
      offset: (page - 1) * PAGE_SIZE,
      limit: PAGE_SIZE,
      paged: true as const,
    }),
    [page],
  );

  const { data, isLoading, isError, error, refetch } = useCenters(queryParams);

  const centers = useMemo(() => data?.pageItems ?? [], [data]);
  const totalRecords = data?.totalFilteredRecords ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalRecords / PAGE_SIZE));

  const columns: ColumnDef<CenterData>[] = [
    {
      key: "name",
      header: t("Name"),
      cell: (row) => <span className="font-medium text-gray-900 dark:text-gray-100">{row.name ?? "—"}</span>,
    },
    { key: "accountNo", header: t("Account No"), cell: (row) => row.accountNo ?? "—" },
    { key: "officeName", header: t("Office"), cell: (row) => row.officeName ?? "—" },
    { key: "staffName", header: t("Staff"), cell: (row) => row.staffName ?? "—" },
    {
      key: "status",
      header: t("Status"),
      sortable: false,
      cell: (row) => {
        const code = row.status?.code ?? "";
        return (
          <Badge variant={statusVariant[code] ?? "default"} size="sm">
            {statusLabel[code] ?? row.status?.value ?? t("Unknown")}
          </Badge>
        );
      },
    },
    { key: "activationDate", header: t("Activation Date"), cell: (row) => row.activationDate ?? "—" },
  ];

  if (isError) {
    return (
      <div className="space-y-6">
        <PageHeader
          title={t("Centers")}
          description={t("Manage centers")}
          actions={
            <Button onClick={() => navigate("/centers/new")} className="bg-[#D32F2F] hover:bg-red-700">
              <Plus className="mr-2 h-4 w-4" /> {t("New Center")}
            </Button>
          }
        />
        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <span className="text-sm">{t("Failed to load centers.")} {error?.message ?? t("Please try again.")}</span>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            {t("Retry")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("Centers")}
        description={t("Manage centers")}
        actions={
          <Button onClick={() => navigate("/centers/new")} className="bg-[#D32F2F] hover:bg-red-700">
            <Plus className="mr-2 h-4 w-4" /> {t("New Center")}
          </Button>
        }
      />

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={centers}
              idAccessor={(row) => String(row.id)}
              emptyState={{ title: t("No centers found"), message: t("Create a new center to get started.") }}
              onRowClick={(row) => navigate(`/centers/${row.id}`)}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CenterListPage;
