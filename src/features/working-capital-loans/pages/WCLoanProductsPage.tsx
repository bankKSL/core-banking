import { type FC, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Plus, Search, Eye } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, type ColumnDef } from "@/components/shared/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useWCLoanProducts } from "../hooks/useWCLoanQueries";
import { formatMoney } from "../utils/format";
import type { WCLoanProduct } from "../types/workingCapitalLoan";

const WCLoanProductsPage: FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: products = [], isLoading } = useWCLoanProducts();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return products.filter((p) => p.name.toLowerCase().includes(q) || (p.shortName ?? "").toLowerCase().includes(q));
  }, [products, search]);

  const columns: ColumnDef<WCLoanProduct>[] = [
    { key: "name", header: t("Name"), cell: (r) => <span className="font-medium">{r.name}</span> },
    { key: "shortName", header: t("Short Name"), cell: (r) => <span className="text-sm text-gray-500">{r.shortName ?? "—"}</span> },
    { key: "currency", header: t("Currency"), cell: (r) => <span>{r.currency?.code ?? "—"}</span> },
    { key: "principal", header: t("Principal"), cell: (r) => <span className="font-mono">{formatMoney(r.principal, r.currency?.code)}</span> },
    { key: "periodPaymentRate", header: t("Period Rate (%)"), cell: (r) => <span className="font-mono">{r.periodPaymentRate}%</span> },
    { key: "repaymentEvery", header: t("Repayment"), cell: (r) => <span>{t("Every")} {r.repaymentEvery} {r.repaymentFrequencyType?.value ?? ""}</span> },
    { key: "delinquencyBucket", header: t("Delinquency Bucket"), cell: (r) => <span>{r.delinquencyBucket?.name ?? (r.delinquencyBucketId != null ? `#${r.delinquencyBucketId}` : "—")}</span> },
    {
      key: "actions",
      header: "",
      cell: (r) => (
        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); navigate(`/working-capital-loans/products/view/${r.id}`); }}>
          <Eye className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("Working Capital Loan Products")}
        description={t("Manage working capital revolving credit products")}
        actions={
          <Button onClick={() => navigate("/working-capital-loans/products/new")} className="bg-[#D32F2F] hover:bg-red-700">
            <Plus className="mr-2 h-4 w-4" />
            {t("Create Product")}
          </Button>
        }
      />
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t("All Products")}</CardTitle>
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input placeholder={t("Search products...")} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : (
            <DataTable columns={columns} data={filtered} emptyState={{ message: t("No products found.") }} />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default WCLoanProductsPage;
