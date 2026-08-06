import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/shared/ErrorState";
import { DataTable } from "@/components/shared/DataTable";
import { useTaxComponents } from "../hooks/useTaxes";
import type { TaxComponent } from "../api/taxes";
import type { ColumnDef } from "@/components/shared/DataTable";

const TaxComponentListPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: components, isLoading, isError, refetch, isRefetching } = useTaxComponents();

  const columns: ColumnDef<TaxComponent>[] = [
    { key: "name", header: t("Name") },
    { key: "percentage", header: t("Percentage"), accessorFn: (row) => `${row.percentage}%` },
    { key: "startDate", header: t("Start Date") },
    {
      key: "debitAccount",
      header: t("Debit Account"),
      accessorFn: (row) => row.debitAccount ? `${row.debitAccount.name} (${row.debitAccount.glCode})` : "-",
    },
    {
      key: "creditAccount",
      header: t("Credit Account"),
      accessorFn: (row) => row.creditAccount ? `${row.creditAccount.name} (${row.creditAccount.glCode})` : "-",
    },
  ];

  const handleRowClick = useCallback(
    (row: TaxComponent) => {
      navigate(`/taxes/components/edit/${row.id}`);
    },
    [navigate],
  );

  if (isError) {
    return (
      <div className="p-6">
        <PageHeader
          title={t("Tax Components")}
          actions={
            <Button onClick={() => navigate("/taxes/components/new")}>
              <Plus className="mr-2 h-4 w-4" /> {t("New Component")}
            </Button>
          }
        />
        <ErrorState message={t("Failed to load tax components.")} onRetry={refetch} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("Tax Components")}
        actions={
          <Button onClick={() => navigate("/taxes/components/new")}>
            <Plus className="mr-2 h-4 w-4" /> {t("New Component")}
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>{t("Components")}</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={components ?? []}
            onRowClick={handleRowClick}
            loading={isLoading}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default TaxComponentListPage;