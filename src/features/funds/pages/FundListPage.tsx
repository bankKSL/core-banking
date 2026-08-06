import { type FC, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, type ColumnDef } from "@/components/shared/DataTable";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorState } from "@/components/shared/ErrorState";
import { useFunds } from "../hooks/useFunds";
import type { Fund } from "../api/funds";

const FundListPage: FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch } = useFunds();

  const funds = useMemo(() => data ?? [], [data]);

  const columns: ColumnDef<Fund>[] = [
    { key: "name", header: t("Name"), cell: (r) => <span className="font-medium">{r.name}</span> },
    {
      key: "externalId",
      header: t("External ID"),
      cell: (r) => (r.externalId ? <span className="font-mono text-sm">{r.externalId}</span> : "—"),
    },
  ];

  if (isError) {
    return (
      <div className="p-6">
        <PageHeader
          title={t("Funds")}
          description={t("Manage fund definitions")}
          actions={
            <Button onClick={() => navigate("/funds/new")}>
              <Plus className="mr-2 h-4 w-4" /> {t("New Fund")}
            </Button>
          }
        />
        <ErrorState message={t("Failed to load funds.")} onRetry={refetch} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("Funds")}
        description={t("Manage fund definitions")}
        actions={
          <Button onClick={() => navigate("/funds/new")}>
            <Plus className="mr-2 h-4 w-4" /> {t("New Fund")}
          </Button>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle>{t("All Funds")}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={funds}
              onRowClick={(row) => navigate(`/funds/edit/${row.id}`)}
              emptyState={{ message: t("No funds found.") }}
              minWidth={600}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FundListPage;
