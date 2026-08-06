import { type FC, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Plus, Search, ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, type ColumnDef } from "@/components/shared/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useExternalAssetOwners } from "../hooks/useExternalAssetOwners";
import type { ExternalAssetOwner } from "../types/externalAssetOwner";

const ExternalAssetOwnerListPage: FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: owners = [], isLoading } = useExternalAssetOwners();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return owners;
    return owners.filter((o) => o.externalId.toLowerCase().includes(q) || String(o.id).includes(q));
  }, [owners, search]);

  const columns: ColumnDef<ExternalAssetOwner>[] = [
    { key: "id", header: t("ID"), cell: (r) => <span className="font-medium">{r.id}</span> },
    {
      key: "externalId",
      header: t("External ID"),
      cell: (r) => <span className="font-mono text-sm">{r.externalId}</span>,
    },
    {
      key: "actions",
      header: "",
      cell: (r) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="sm" onClick={() => navigate("/external-asset-owners/transfers")}>
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("External Asset Owners")}
        description={t("Manage external investors who purchase loans from the bank")}
        actions={
          <Button onClick={() => navigate("/external-asset-owners/new")} className="bg-[#D32F2F] hover:bg-red-700">
            <Plus className="mr-2 h-4 w-4" /> {t("Create Owner")}
          </Button>
        }
      />
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t("All Owners")}</CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder={t("Search by external ID...")}
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
              emptyState={{ message: t("No external asset owners found.") }}
              minWidth={500}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ExternalAssetOwnerListPage;
