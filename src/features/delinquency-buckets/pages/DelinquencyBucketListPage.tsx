import { type FC, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Plus, Search, Pencil, Trash2, Layers } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, type ColumnDef } from "@/components/shared/DataTable";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDelinquencyBuckets, useDeleteDelinquencyBucket } from "../hooks/useDelinquencyBuckets";
import type { DelinquencyBucket } from "../types/delinquencyBucket";

const DelinquencyBucketListPage: FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: buckets = [], isLoading } = useDelinquencyBuckets();
  const deleteMutation = useDeleteDelinquencyBucket();
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<DelinquencyBucket | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return buckets;
    return buckets.filter((b) => b.name.toLowerCase().includes(q));
  }, [buckets, search]);

  const columns: ColumnDef<DelinquencyBucket>[] = [
    { key: "name", header: t("Name"), cell: (r) => <span className="font-medium">{r.name}</span> },
    {
      key: "bucketType",
      header: t("Bucket Type"),
      cell: (r) => (
        <Badge variant={r.bucketType.id === "WORKING_CAPITAL" ? "info" : "default"} size="sm">
          {r.bucketType.value}
        </Badge>
      ),
    },
    {
      key: "ranges",
      header: t("Ranges"),
      cell: (r) => <span className="font-mono text-sm">{r.ranges.length}</span>,
    },
    {
      key: "minimumPaymentRule",
      header: t("Min. Payment Rule"),
      cell: (r) =>
        r.minimumPaymentPeriodAndRule ? (
          <span className="text-sm">
            {r.minimumPaymentPeriodAndRule.frequency} {r.minimumPaymentPeriodAndRule.frequencyType.value} /{" "}
            {r.minimumPaymentPeriodAndRule.minimumPayment} {r.minimumPaymentPeriodAndRule.minimumPaymentType.value}
          </span>
        ) : (
          <span className="text-gray-400">—</span>
        ),
    },
    {
      key: "actions",
      header: "",
      cell: (r) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="sm" onClick={() => navigate(`/delinquency-buckets/edit/${r.id}`)}>
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
        title={t("Delinquency Buckets")}
        description={t("Manage delinquency bucket definitions")}
        actions={
          <Button onClick={() => navigate("/delinquency-buckets/new")} className="bg-[#D32F2F] hover:bg-red-700">
            <Plus className="mr-2 h-4 w-4" /> {t("Create Bucket")}
          </Button>
        }
      />
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t("All Buckets")}</CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder={t("Search buckets...")}
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
              emptyState={{
                icon: <Layers className="h-8 w-8 text-gray-300" />,
                message: t("No delinquency buckets defined."),
              }}
              minWidth={700}
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
        title={t("Delete Bucket")}
        description={t('Delete "{{name}}"? This will fail if the bucket is linked to loan products.', {
          name: deleteTarget?.name,
        })}
        variant="destructive"
        confirmLabel={t("Delete")}
        loading={deleteMutation.isPending}
      />
    </div>
  );
};

export default DelinquencyBucketListPage;
