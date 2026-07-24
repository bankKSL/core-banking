import React, { useState, useMemo } from "react";
import { Plus, Search, Pencil, Trash2, Eye } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, type ColumnDef } from "@/components/shared/DataTable";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { useLoanProducts } from "@/features/loans";
import type { LoanProduct } from "@/features/loans";

/** Extract string value from Finfact enum objects {id,code,value} or primitive */
function enumVal(v: any, fallback = ""): string {
  if (v == null) return fallback;
  if (typeof v === "object") return v.code ?? v.value ?? String(v.id) ?? fallback;
  return String(v);
}

const LoanProductsPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: products = [], isLoading, refetch } = useLoanProducts();
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<LoanProduct | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return products.filter((p) => p.name.toLowerCase().includes(q) || (p.description ?? "").toLowerCase().includes(q));
  }, [products, search]);

  const handleDelete = () => {
    setDeleteTarget(null);
  };

  const columns: ColumnDef<any>[] = [
    { key: "name", header: "Name", accessorFn: (r) => <span className="font-medium">{r.name}</span> },
    {
      key: "shortName",
      header: "Short Name",
      accessorFn: (r) => <span className="text-sm text-gray-500">{r.shortName ?? "—"}</span>,
    },
    { key: "currency", header: "Currency", accessorFn: (r) => <span>{r.currency?.code ?? "—"}</span> },
    {
      key: "principal",
      header: "Principal",
      accessorFn: (r) => <span className="font-mono">{r.principal?.toLocaleString()}</span>,
    },
    { key: "rate", header: "Rate", accessorFn: (r) => <span>{r.interestRatePerPeriod}%</span> },
    {
      key: "repayments",
      header: "Repayments",
      accessorFn: (r) => (
        <span>
          {r.numberOfRepayments} × {r.repaymentEvery}
        </span>
      ),
    },
    {
      key: "scheduleType",
      header: "Schedule",
      accessorFn: (r) => {
        const st = enumVal(r.loanScheduleType, "CUMULATIVE");
        return <Badge>{st}</Badge>;
      },
    },
    {
      key: "actions",
      header: "",
      cell: (r) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="sm" onClick={() => navigate(`/lending/products/view/${r.id}`)}>
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => navigate(`/lending/products/edit/${r.id}`)}>
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
        title="Loan Products"
        description="Manage loan product definitions"
        actions={
          <Button onClick={() => navigate("/lending/products/new")} className="bg-[#D32F2F] hover:bg-red-700">
            <Plus className="mr-2 h-4 w-4" />
            Create Product
          </Button>
        }
      />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>All Products</CardTitle>
          <div className="flex items-center gap-3">
            <div className="relative w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
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
              emptyState={{ message: "No products found." }}
              minWidth={900}
            />
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Loan Product"
        description={`Delete "${deleteTarget?.name}"?`}
        confirmLabel="Delete"
        variant="destructive"
      />
    </div>
  );
};

export default LoanProductsPage;
