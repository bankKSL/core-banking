import { useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Pencil } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, type ColumnDef } from "@/components/shared/DataTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/shared/ErrorState";
import { Badge } from "@/components/ui/badge";
import { useShareProducts } from "../hooks/useShares";
import type { ShareProduct } from "../api/shares";

const ShareProductListPage = () => {
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch } = useShareProducts();

  const products = useMemo(() => data ?? [], [data]);

  const columns: ColumnDef<ShareProduct>[] = useMemo(
    () => [
      { key: "name", header: "Name", sortable: true },
      { key: "shortName", header: "Short Name" },
      {
        key: "currency",
        header: "Currency",
        accessorFn: (row) => row.currency?.displaySymbol ?? row.currency?.code ?? "—",
      },
      {
        key: "totalShares",
        header: "Total Shares",
        accessorFn: (row) => (row.totalShares ?? 0).toLocaleString(),
      },
      {
        key: "unitPrice",
        header: "Unit Price",
        accessorFn: (row) => (row.unitPrice ?? 0).toLocaleString(),
      },
      {
        key: "nominalShares",
        header: "Nominal Shares",
        accessorFn: (row) => (row.nominalShares ?? 0).toLocaleString(),
      },
      {
        key: "accountingRule",
        header: "Accounting Rule",
        accessorFn: (row) => row.accountingRule?.value ?? "—",
      },
      {
        key: "actions",
        header: "",
        className: "w-[80px]",
        cell: (row) => (
          <div onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(`/shares/products/edit/${row.id}`)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ],
    [navigate],
  );

  const handleRowClick = useCallback(
    (row: ShareProduct) => {
      navigate(`/shares/products/edit/${row.id}`);
    },
    [navigate],
  );

  if (isError) {
    return (
      <div className="p-6">
        <PageHeader
          title="Share Products"
          description="Manage share product definitions"
          actions={
            <Button onClick={() => navigate("/shares/products/new")}>
              <Plus className="mr-2 h-4 w-4" /> New Product
            </Button>
          }
        />
        <ErrorState message="Failed to load share products." onRetry={refetch} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Share Products"
        description="Manage share product definitions"
        actions={
          <Button onClick={() => navigate("/shares/products/new")}>
            <Plus className="mr-2 h-4 w-4" /> New Product
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>All Share Products</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={products}
            onRowClick={handleRowClick}
            loading={isLoading}
            emptyState={{ message: "No share products found." }}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default ShareProductListPage;
