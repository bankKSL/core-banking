import React, { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Search, Pencil, Ban, Eye } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, type ColumnDef } from "@/components/shared/DataTable";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { useLoanProducts, useUpdateLoanProduct, formatDate } from "@/features/loans";
import type { LoanProduct } from "@/features/loans";

const LoanProductsPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: products = [], isLoading } = useLoanProducts();
  const [search, setSearch] = useState("");
  const [deactivateTarget, setDeactivateTarget] = useState<LoanProduct | null>(null);
  const updateMutation = useUpdateLoanProduct();

  const isInactive = (p: LoanProduct) =>
    p.status === "inactive" || p.status === "closed" || !!p.closeDate;

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return products.filter((p) => p.name.toLowerCase().includes(q) || (p.description ?? "").toLowerCase().includes(q));
  }, [products, search]);

  const handleDeactivate = async () => {
    if (!deactivateTarget) return;
    try {
      await updateMutation.mutateAsync({
        productId: deactivateTarget.id,
        payload: { status: "inactive", locale: "en", dateFormat: "yyyy-MM-dd" },
      });
    } catch {
      // handled
    }
    setDeactivateTarget(null);
  };

  const columns: ColumnDef<any>[] = [
    { key: "name", header: t("Name"), accessorFn: (r) => <span className="font-medium">{r.name}</span> },
    {
      key: "shortName",
      header: t("Short Name"),
      accessorFn: (r) => <span className="text-sm text-gray-500">{r.shortName ?? "—"}</span>,
    },
    {
      key: "description",
      header: t("Description"),
      accessorFn: (r) => <span className="text-sm">{r.description ?? "—"}</span>,
    },
    { key: "currency", header: t("Currency"), accessorFn: (r) => <span>{r.currency?.code ?? "—"}</span> },
    {
      key: "fund",
      header: t("Fund"),
      accessorFn: (r) => <span>{r.fund?.name ?? r.fundName ?? "—"}</span>,
    },
    {
      key: "startDate",
      header: t("Start Date"),
      accessorFn: (r) => <span>{formatDate(r.startDate)}</span>,
    },
    {
      key: "closeDate",
      header: t("Close Date"),
      accessorFn: (r) => <span>{formatDate(r.closeDate)}</span>,
    },
    {
      key: "status",
      header: t("Status"),
      accessorFn: (r) => {
        const s = r.status ?? (r.closeDate ? "closed" : "active");
        return (
          <Badge variant={s === "active" ? "success" : s === "inactive" || s === "closed" ? "default" : "default"} size="sm">
            {s}
          </Badge>
        );
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
          {!isInactive(r) && (
            <Button variant="ghost" size="sm" onClick={() => setDeactivateTarget(r)}>
              <Ban className="h-4 w-4 text-amber-500" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("Loan Products")}
        description={t("Manage loan product definitions")}
        actions={
          <Button onClick={() => navigate("/lending/products/new")} className="bg-[#D32F2F] hover:bg-red-700">
            <Plus className="mr-2 h-4 w-4" />
            {t("Create Product")}
          </Button>
        }
      />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t("All Products")}</CardTitle>
          <div className="flex items-center gap-3">
            <div className="relative w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder={t("Search products...")}
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
              emptyState={{ message: t("No products found.") }}
              minWidth={1200}
            />
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!deactivateTarget}
        onOpenChange={() => setDeactivateTarget(null)}
        onConfirm={handleDeactivate}
        title={t("Deactivate Loan Product")}
        description={t('Deactivate "{{name}}"? Deactivated products cannot be used for new loans.', {
          name: deactivateTarget?.name,
        })}
        confirmLabel={t("Deactivate")}
        variant="destructive"
        loading={updateMutation.isPending}
      />
    </div>
  );
};

export default LoanProductsPage;
