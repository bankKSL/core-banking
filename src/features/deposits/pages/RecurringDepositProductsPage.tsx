import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Pencil, Eye, Trash2, Building2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, type ColumnDef } from "@/components/shared/DataTable";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useRecurringDepositProducts, useDeleteRecurringDepositProduct, useRecurringDepositProduct } from "@/features/deposits";
import type { RecurringDepositProduct } from "@/features/deposits";

const ProductRateCell: React.FC<{ productId: number }> = ({ productId }) => {
  const { data: detail, isLoading } = useRecurringDepositProduct(productId);
  if (isLoading) return <Skeleton className="h-4 w-12" />;
  const rate = detail?.activeChart?.chartSlabs?.[0]?.annualInterestRate;
  return <span className="font-mono font-semibold">{rate != null ? `${rate}%` : "—"}</span>;
};

const RecurringDepositProductsPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { data: products = [], isLoading, isError, error, refetch } = useRecurringDepositProducts();
  const deleteMutation = useDeleteRecurringDepositProduct();
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<RecurringDepositProduct | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return products.filter((p) => p.name.toLowerCase().includes(q) || (p.description ?? "").toLowerCase().includes(q));
  }, [products, search]);

  const stats = useMemo(
    () => ({
      total: products.length,
      avgRate:
        products.length > 0
          ? products.reduce((s, p) => s + (p.activeChart?.chartSlabs?.[0]?.annualInterestRate ?? 0), 0) /
            products.length
          : 0,
      uniqueCurrencies: new Set(products.map((p) => p.currency.code)).size,
    }),
    [products],
  );

  const columns: ColumnDef<any>[] = [
    { key: "name", header: t("Name"), cell: (r) => <span className="font-semibold">{r.name}</span> },
    { key: "shortName", header: t("Code"), cell: (r) => <code className="text-xs">{r.shortName ?? "—"}</code> },
    {
      key: "currency",
      header: t("Currency"),
      cell: (r) => <span>{r.currency?.displaySymbol ?? r.currency?.code ?? "—"}</span>,
    },
    {
      key: "minDepositTerm",
      header: t("Min Term"),
      cell: (r) => (
        <span className="font-mono text-sm">
          {r.minDepositTerm} {r.minDepositTermType?.description ?? ""}
        </span>
      ),
    },
    {
      key: "interestRate",
      header: t("Rate"),
      cell: (r) => <ProductRateCell productId={r.id} />,
    },
    {
      key: "actions",
      header: "",
      cell: (r) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="sm" onClick={() => navigate(`/deposits/recurring-products/view/${r.id}`)}>
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => navigate(`/deposits/recurring-products/edit/${r.id}`)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(r)}>
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      ),
    },
  ];

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteMutation.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  };

  if (isError) {
    return (
      <div className="space-y-6">
        <PageHeader
          title={t("Recurring Deposit Products")}
          description={t("Manage recurring deposit product definitions")}
          actions={
            <Button
              onClick={() => navigate("/deposits/recurring-products/new")}
              className="bg-[#D32F2F] hover:bg-red-700"
            >
              <Plus className="mr-2 h-4 w-4" /> {t("Create Product")}
            </Button>
          }
        />
        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
          <span className="text-sm">{t("Failed to load")}: {error?.message ?? t("Unknown error")}</span>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            {t("Retry")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("Recurring Deposit Products")}
        description={t("Manage recurring deposit product definitions")}
        actions={
          <Button
            onClick={() => navigate("/deposits/recurring-products/new")}
            className="bg-[#D32F2F] hover:bg-red-700"
          >
            <Plus className="mr-2 h-4 w-4" /> {t("Create Product")}
          </Button>
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <StatCard title={t("Total Products")} value={stats.total} icon={Building2} />
          <StatCard title={t("Avg Interest Rate")} value={`${stats.avgRate.toFixed(2)}%`} variant="success" />
          <StatCard title={t("Currencies")} value={stats.uniqueCurrencies} variant="default" />
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t("All Products")}</CardTitle>
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder={t("Search products...")}
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
              emptyState={{ message: t("No products found.") }}
              minWidth={800}
            />
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={t("Delete Product")}
        description={`${t("Delete")} "${deleteTarget?.name}"?`}
        confirmLabel={t("Delete")}
        variant="destructive"
      />
    </div>
  );
};

export default RecurringDepositProductsPage;
