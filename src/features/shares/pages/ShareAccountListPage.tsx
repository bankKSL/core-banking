import { useMemo, useCallback } from "react";
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
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch } = useShareAccounts();

  const accounts = useMemo(() => data ?? [], [data]);

  const columns: ColumnDef<ShareAccount>[] = useMemo(
    () => [
      { key: "accountNo", header: "Account No", sortable: true },
      {
        key: "clientName",
        header: "Client",
        accessorFn: (row) => row.clientName ?? "—",
      },
      {
        key: "productName",
        header: "Product",
        accessorFn: (row) => row.productName ?? "—",
      },
      {
        key: "totalShares",
        header: "Total Shares",
        accessorFn: (row) => row.summary?.totalShares?.toLocaleString() ?? "0",
      },
      {
        key: "status",
        header: "Status",
        accessorFn: (row) => <StatusBadge status={row.status?.code ?? "unknown"} />,
      },
    ],
    [],
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
          title="Share Accounts"
          description="Manage client share accounts"
          actions={
            <Button onClick={() => navigate("/shares/accounts/new")}>
              <Plus className="mr-2 h-4 w-4" /> New Account
            </Button>
          }
        />
        <ErrorState message="Failed to load share accounts." onRetry={refetch} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Share Accounts"
        description="Manage client share accounts"
        actions={
          <Button onClick={() => navigate("/shares/accounts/new")}>
            <Plus className="mr-2 h-4 w-4" /> New Account
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>All Share Accounts</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={accounts}
            onRowClick={handleRowClick}
            loading={isLoading}
            emptyState={{ message: "No share accounts found." }}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default ShareAccountListPage;
