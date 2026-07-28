import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/shared/ErrorState";
import { DataTable } from "@/components/shared/DataTable";
import { useTaxComponents } from "../hooks/useTaxes";
import type { TaxComponent } from "../api/taxes";
import type { ColumnDef } from "@/components/shared/DataTable";

const columns: ColumnDef<TaxComponent>[] = [
  { key: "name", header: "Name" },
  { key: "percentage", header: "Percentage", accessorFn: (row) => `${row.percentage}%` },
  { key: "startDate", header: "Start Date" },
  {
    key: "debitAccount",
    header: "Debit Account",
    accessorFn: (row) => row.debitAccount ? `${row.debitAccount.name} (${row.debitAccount.glCode})` : "-",
  },
  {
    key: "creditAccount",
    header: "Credit Account",
    accessorFn: (row) => row.creditAccount ? `${row.creditAccount.name} (${row.creditAccount.glCode})` : "-",
  },
];

const TaxComponentListPage = () => {
  const navigate = useNavigate();
  const { data: components, isLoading, isError, refetch, isRefetching } = useTaxComponents();

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
          title="Tax Components"
          actions={
            <Button onClick={() => navigate("/taxes/components/new")}>
              <Plus className="mr-2 h-4 w-4" /> New Component
            </Button>
          }
        />
        <ErrorState message="Failed to load tax components." onRetry={refetch} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tax Components"
        actions={
          <Button onClick={() => navigate("/taxes/components/new")}>
            <Plus className="mr-2 h-4 w-4" /> New Component
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Components</CardTitle>
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
