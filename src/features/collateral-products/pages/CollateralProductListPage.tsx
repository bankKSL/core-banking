import { type FC, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Pencil, Trash2, Gem } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, type ColumnDef } from "@/components/shared/DataTable";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCollateralProducts, useDeleteCollateralProduct } from "../hooks/useCollateralProducts";
import type { CollateralProduct } from "../types/collateralProduct";

const formatCurrency = (v: number, code: string) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: code }).format(v);

const CollateralProductListPage: FC = () => {
  const navigate = useNavigate();
  const { data: products = [], isLoading } = useCollateralProducts();
  const deleteMutation = useDeleteCollateralProduct();
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<CollateralProduct | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return products;
    return products.filter((p) => p.name.toLowerCase().includes(q) || p.quality.toLowerCase().includes(q) || p.unitType.toLowerCase().includes(q));
  }, [products, search]);

  const columns: ColumnDef<CollateralProduct>[] = [
    { key: "name", header: "Name", cell: (r) => <span className="font-medium">{r.name}</span> },
    { key: "quality", header: "Quality", cell: (r) => r.quality },
    { key: "basePrice", header: "Base Price", cell: (r) => <span className="font-mono">{formatCurrency(r.basePrice, r.currency)}</span> },
    { key: "pctToBase", header: "Pct to Base", cell: (r) => <span className="font-mono">{r.pctToBase}%</span> },
    { key: "unitType", header: "Unit Type", cell: (r) => r.unitType },
    { key: "currency", header: "Currency", cell: (r) => r.currency },
    {
      key: "actions", header: "",
      cell: (r) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="sm" onClick={() => navigate(`/collateral-products/edit/${r.id}`)}><Pencil className="h-4 w-4" /></Button>
          <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(r)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Collateral Products"
        description="Manage collateral product definitions"
        actions={
          <Button onClick={() => navigate("/collateral-products/new")} className="bg-[#D32F2F] hover:bg-red-700">
            <Plus className="mr-2 h-4 w-4" /> Create Product
          </Button>
        }
      />
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>All Products</CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : (
            <DataTable columns={columns} data={filtered} emptyState={{ icon: <Gem className="h-8 w-8 text-gray-300" />, message: "No collateral products defined." }} minWidth={700} />
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
        title="Delete Product"
        description={`Delete "${deleteTarget?.name}"? Fails if any client has this collateral assigned.`}
        variant="destructive"
        confirmLabel="Delete"
        loading={deleteMutation.isPending}
      />
    </div>
  );
};

export default CollateralProductListPage;
