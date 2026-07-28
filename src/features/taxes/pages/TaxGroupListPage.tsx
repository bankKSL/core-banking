import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/shared/ErrorState";
import { DataTable } from "@/components/shared/DataTable";
import { useTaxGroups } from "../hooks/useTaxes";
import type { TaxGroup } from "../api/taxes";
import type { ColumnDef } from "@/components/shared/DataTable";

const columns: ColumnDef<TaxGroup>[] = [
  { key: "name", header: "Name" },
  {
    key: "taxComponents",
    header: "Components",
    accessorFn: (row) => `${row.taxComponents.length} component${row.taxComponents.length !== 1 ? "s" : ""}`,
  },
];

const TaxGroupListPage = () => {
  const navigate = useNavigate();
  const { data: groups, isLoading, isError, refetch, isRefetching } = useTaxGroups();

  const handleRowClick = useCallback(
    (row: TaxGroup) => {
      navigate(`/taxes/groups/edit/${row.id}`);
    },
    [navigate],
  );

  if (isError) {
    return (
      <div className="p-6">
        <PageHeader
          title="Tax Groups"
          actions={
            <Button onClick={() => navigate("/taxes/groups/new")}>
              <Plus className="mr-2 h-4 w-4" /> New Group
            </Button>
          }
        />
        <ErrorState message="Failed to load tax groups." onRetry={refetch} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tax Groups"
        actions={
          <Button onClick={() => navigate("/taxes/groups/new")}>
            <Plus className="mr-2 h-4 w-4" /> New Group
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Groups</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={groups ?? []}
            onRowClick={handleRowClick}
            loading={isLoading}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default TaxGroupListPage;
