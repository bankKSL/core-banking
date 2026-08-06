import { useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, type ColumnDef } from "@/components/shared/DataTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/shared/ErrorState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useShareAccounts } from "../hooks/useShares";
import type { ShareAccount } from "../api/shares";

const ShareAccountListPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch } = useShareAccounts();

  const accounts = useMemo(() => data ?? [], [data]);

  const columns: ColumnDef<ShareAccount>[] = useMemo(
    () => [
      { key: "accountNo", header: t("Account No"), sortable: true },
      {
        key: "clientName",
        header: t("Client"),
        accessorFn: (row) => row.clientName ?? "—",
      },
      {
        key: "productName",
        header: t("Product"),
        accessorFn: (row) => row.productName ?? "—",
      },
      {
        key: "totalShares",
        header: t("Total Shares"),
        accessorFn: (row) => row.summary?.totalShares?.toLocaleString() ?? "0",
      },
      {
        key: "status",
        header: t("Status"),
        accessorFn: (row) => <StatusBadge status={row.status?.code ?? "unknown"} />,
      },
    ],
    [t],
  );

  const handleRowClick = useCallback(
    (row: ShareAccount) => {
      navigate(`/shares/accounts/${row.id}`);
    },
    [navigate],
  );

  if (isError) {
    return (
      <div className="p-6">
        <PageHeader
          title={t("Share Accounts")}
          description={t("Manage client share accounts")}
          actions={
            <Button onClick={() => navigate("/shares/accounts/new")}>
              <Plus className="mr-2 h-4 w-4" /> {t("New Account")}
            </Button>
          }
        />
        <ErrorState message={t("Failed to load share accounts.")} onRetry={refetch} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("Share Accounts")}
        description={t("Manage client share accounts")}
        actions={
          <Button onClick={() => navigate("/shares/accounts/new")}>
            <Plus className="mr-2 h-4 w-4" /> {t("New Account")}
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>{t("All Share Accounts")}</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={accounts}
            onRowClick={handleRowClick}
            loading={isLoading}
            emptyState={{ message: t("No share accounts found.") }}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default ShareAccountListPage;
