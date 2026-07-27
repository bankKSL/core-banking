import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Trash2, Percent } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, type ColumnDef } from "@/components/shared/DataTable";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useInterestRateCharts,
  useDeleteInterestRateChart,
} from "@/features/deposits/hooks/useInterestRateCharts";
import type { InterestRateChart } from "@/features/deposits/api/deposit";

const InterestRateChartListPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: charts = [], isLoading, isError, error, refetch } = useInterestRateCharts();
  const deleteMutation = useDeleteInterestRateChart();
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<InterestRateChart | null>(null);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteMutation.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return charts.filter((c) => c.name.toLowerCase().includes(q) || (c.description ?? "").toLowerCase().includes(q));
  }, [charts, search]);

  const columns: ColumnDef<InterestRateChart>[] = [
    {
      key: "name",
      header: "Name",
      cell: (r) => <span className="font-semibold">{r.name}</span>,
    },
    {
      key: "description",
      header: "Description",
      cell: (r) => <span className="text-sm text-gray-500">{r.description || "—"}</span>,
    },
    {
      key: "fromDate",
      header: "From Date",
      cell: (r) => <span className="font-mono text-sm">{r.fromDate}</span>,
    },
    {
      key: "endDate",
      header: "End Date",
      cell: (r) => <span className="font-mono text-sm">{r.endDate ?? "—"}</span>,
    },
    {
      key: "slabs",
      header: "Slabs",
      cell: (r) => <span>{r.chartSlabs?.length ?? 0}</span>,
    },
    {
      key: "actions",
      header: "",
      cell: (r) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(r)}>
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      ),
    },
  ];

  if (isError) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Interest Rate Charts"
          description="Manage interest rate chart definitions"
          actions={
            <Button onClick={() => navigate("/interest-rate-charts/new")} className="bg-[#D32F2F] hover:bg-red-700">
              <Plus className="mr-2 h-4 w-4" /> New Chart
            </Button>
          }
        />
        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
          <span className="text-sm">Failed to load: {error?.message ?? "Unknown error"}</span>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Interest Rate Charts"
        description="Manage interest rate chart definitions"
        actions={
          <Button onClick={() => navigate("/interest-rate-charts/new")} className="bg-[#D32F2F] hover:bg-red-700">
            <Plus className="mr-2 h-4 w-4" /> New Chart
          </Button>
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard title="Total Charts" value={charts.length} icon={Percent} />
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>All Charts</CardTitle>
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search charts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={filtered}
              onRowClick={(row) => navigate(`/interest-rate-charts/${row.id}`)}
              emptyState={{ message: "No interest rate charts found." }}
            />
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleteMutation.isPending}
        title="Delete Chart"
        description={`Delete "${deleteTarget?.name}"?`}
        confirmLabel="Delete"
        variant="destructive"
      />
    </div>
  );
};

export default InterestRateChartListPage;
