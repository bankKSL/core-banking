import React, { useState, useMemo } from "react";
import { Plus, Search, Pencil, Trash2, ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, type ColumnDef } from "@/components/shared/DataTable";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { useFixedDepositProducts } from "@/features/deposits";
import type { FixedDepositProduct } from "@/features/deposits";

const FixedDepositProductsPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: products = [], isLoading, isError, error, refetch } = useFixedDepositProducts();
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<FixedDepositProduct | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return products.filter((p) => p.name.toLowerCase().includes(q) || (p.description ?? "").toLowerCase().includes(q));
  }, [products, search]);

  const columns: ColumnDef<any>[] = [
    { key: "name", header: "Name", accessorFn: (r) => <span className="font-semibold">{r.name}</span> },
    { key: "shortName", header: "Code", accessorFn: (r) => <code className="text-xs">{r.shortName ?? "—"}</code> },
    {
      key: "currency",
      header: "Currency",
      accessorFn: (r) => <span>{r.currency?.displaySymbol ?? r.currency?.code ?? "—"}</span>,
    },
    {
      key: "minDepositTerm",
      header: "Min Term",
      accessorFn: (r) => (
        <span className="font-mono text-sm">
          {r.minDepositTerm} {r.minDepositTermType?.description ?? ""}
        </span>
      ),
    },
    {
      key: "interestRate",
      header: "Rate",
      accessorFn: (r) => {
        const rate = r.activeChart?.chartSlabs?.[0]?.annualInterestRate;
        return <span className="font-mono">{rate != null ? `${rate}%` : "—"}</span>;
      },
    },
    {
      key: "actions",
      header: "",
      cell: (r) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="sm" onClick={() => navigate(`/deposits/fixed-products/edit/${r.id}`)}>
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
        title="Fixed Deposit Products"
        description="Manage fixed deposit product definitions"
        actions={
          <Button onClick={() => navigate("/deposits/fixed-products/new")} className="bg-[#D32F2F] hover:bg-red-700">
            <Plus className="mr-2 h-4 w-4" /> Create Product
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">All Products</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Input
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />
          </div>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : isError ? (
            <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
              <span>Failed to load: {error?.message}</span>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={filtered}
              emptyState={{ message: "No products found." }}
              minWidth={800}
            />
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
        onConfirm={() => setDeleteTarget(null)}
        title="Delete Product"
        description={`Delete "${deleteTarget?.name}"?`}
        confirmLabel="Delete"
        variant="destructive"
      />
    </div>
  );
};

export default FixedDepositProductsPage;
