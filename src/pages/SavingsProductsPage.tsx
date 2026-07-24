import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Pencil, AlertTriangle, Building2, Percent, DollarSign } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, type ColumnDef } from "@/components/shared/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useSavingsProducts } from "@/features/deposits";
import type { SavingsProduct } from "@/features/deposits";

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

const SavingsProductsPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: products = [], isLoading, isError, error, refetch } = useSavingsProducts();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return products.filter((p) => p.name.toLowerCase().includes(q) || (p.description ?? "").toLowerCase().includes(q));
  }, [products, search]);

  const stats = useMemo(
    () => ({
      total: products.length,
      avgRate:
        products.length > 0 ? products.reduce((s, p) => s + p.nominalAnnualInterestRate, 0) / products.length : 0,
      uniqueCurrencies: new Set(products.map((p) => p.currency.code)).size,
      totalMinBalance: products.reduce((s, p) => s + (p.minRequiredOpeningBalance ?? 0), 0),
    }),
    [products],
  );

  const columns: ColumnDef<SavingsProduct>[] = [
    {
      key: "name",
      header: "Name",
      cell: (r) => <span className="font-semibold">{r.name}</span>,
    },
    {
      key: "shortName",
      header: "Code",
      cell: (r) => <code className="text-xs">{r.shortName ?? "—"}</code>,
    },
    {
      key: "currency",
      header: "Currency",
      cell: (r) => <span className="text-sm">{r.currency.displaySymbol ?? r.currency.code}</span>,
    },
    {
      key: "nominalAnnualInterestRate",
      header: "Interest Rate",
      cell: (r) => <span className="text-sm font-mono font-semibold">{r.nominalAnnualInterestRate}%</span>,
    },
    {
      key: "actions",
      header: "",
      cell: (r) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="sm" onClick={() => navigate(`/deposits/products/edit/${r.id}`)}>
            <Pencil className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  if (isError) {
    return (
      <div className="p-6 space-y-6">
        <PageHeader
          title="Savings Products"
          description="Manage savings product definitions"
          actions={
            <Button onClick={() => navigate("/deposits/products/new")} className="bg-[#D32F2F] hover:bg-red-700">
              <Plus className="mr-2 h-4 w-4" /> New Product
            </Button>
          }
        />
        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <span className="text-sm">Failed to load savings products. {error?.message ?? "Please try again."}</span>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Savings Products"
        description="Manage savings product definitions"
        actions={
          <Button onClick={() => navigate("/deposits/products/new")} className="bg-[#D32F2F] hover:bg-red-700">
            <Plus className="mr-2 h-4 w-4" /> New Product
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
          <StatCard title="Total Products" value={stats.total} icon={Building2} />
          <StatCard title="Avg Interest Rate" value={`${stats.avgRate.toFixed(2)}%`} variant="success" />
          <StatCard title="Currencies" value={stats.uniqueCurrencies} icon={DollarSign} />
          <StatCard title="Min Opening Balance" value={formatCurrency(stats.totalMinBalance)} variant="warning" />
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>All Products</CardTitle>
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search products..."
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
            <DataTable columns={columns} data={filtered} emptyState={{ message: "No savings products found" }} />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SavingsProductsPage;
