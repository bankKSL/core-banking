import { type FC, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Plus, Search, Pencil, Trash2, CalendarRange } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, type ColumnDef } from "@/components/shared/DataTable";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDelinquencyRanges, useDeleteDelinquencyRange } from "../hooks/useDelinquencyRanges";
import type { DelinquencyRange } from "../types/delinquencyRange";

const DelinquencyRangeListPage: FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: ranges = [], isLoading } = useDelinquencyRanges();
  const deleteMutation = useDeleteDelinquencyRange();
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<DelinquencyRange | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return ranges;
    return ranges.filter((r) => r.classification.toLowerCase().includes(q));
  }, [ranges, search]);

  const columns: ColumnDef<DelinquencyRange>[] = [
    { key: "classification", header: t("Classification"), cell: (r) => <span className="font-medium">{r.classification}</span> },
    {
      key: "minimumAgeDays",
      header: t("Min. Age (Days)"),
      cell: (r) => <span className="font-mono text-sm">{r.minimumAgeDays}</span>,
    },
    {
      key: "maximumAgeDays",
      header: t("Max. Age (Days)"),
      cell: (r) => (r.maximumAgeDays != null ? <span className="font-mono text-sm">{r.maximumAgeDays}</span> : <span className="text-gray-400">—</span>),
    },
    {
      key: "actions",
      header: "",
      cell: (r) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="sm" onClick={() => navigate(`/delinquency-ranges/edit/${r.id}`)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(r)}>
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("Delinquency Ranges")}
        description={t("Manage delinquency range definitions")}
        actions={
          <Button onClick={() => navigate("/delinquency-ranges/new")} className="bg-[#D32F2F] hover:bg-red-700">
            <Plus className="mr-2 h-4 w-4" /> {t("Create Range")}
          </Button>
        }
      />
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t("All Ranges")}</CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder={t("Search ranges...")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
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
              data={filtered}
              onRowClick={(row) => navigate(`/delinquency-ranges/edit/${row.id}`)}
              emptyState={{
                icon: <CalendarRange className="h-8 w-8 text-gray-300" />,
                message: t("No delinquency ranges defined."),
              }}
              minWidth={600}
            />
          )}
        </CardContent>
      </Card>
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (deleteTarget) {
            await deleteMutation.mutateAsync(deleteTarget.id);
            setDeleteTarget(null);
          }
        }}
        title={t("Delete Range")}
        description={t('Delete "{{name}}"? This will fail if the range is linked to buckets or loans.', { name: deleteTarget?.classification })}
        variant="destructive"
        confirmLabel={t("Delete")}
        loading={deleteMutation.isPending}
      />
    </div>
  );
};

export default DelinquencyRangeListPage;
