import { type FC, useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Plus, Search, ArrowRightLeft } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, type ColumnDef } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTransfers } from "../hooks/useExternalAssetOwners";
import { STATUS_LABELS, type ExternalAssetOwnerTransfer } from "../types/externalAssetOwner";

const TransferListPage: FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loanIdFilter, setLoanIdFilter] = useState(searchParams.get("loanId") ?? "");
  const [transferExternalIdFilter, setTransferExternalIdFilter] = useState(
    searchParams.get("transferExternalId") ?? "",
  );

  useEffect(() => {
    const loanId = searchParams.get("loanId");
    if (loanId) setLoanIdFilter(loanId);
    const extId = searchParams.get("transferExternalId");
    if (extId) setTransferExternalIdFilter(extId);
  }, [searchParams]);

  const params: { loanId?: number; loanExternalId?: string; transferExternalId?: string } = {};
  if (loanIdFilter) params.loanId = Number(loanIdFilter);
  if (transferExternalIdFilter) params.transferExternalId = transferExternalIdFilter;

  const { data: transfers = [], isLoading } = useTransfers(Object.keys(params).length > 0 ? params : undefined);

  const columns: ColumnDef<ExternalAssetOwnerTransfer>[] = [
    { key: "id", header: t("ID"), cell: (r) => <span className="font-medium">{r.id}</span> },
    {
      key: "status",
      header: t("Status"),
      cell: (r) => <StatusBadge status={r.status.toLowerCase()} label={STATUS_LABELS[r.status]} />,
    },
    {
      key: "ownerExternalId",
      header: t("Owner"),
      cell: (r) => <span className="font-mono text-sm">{r.ownerExternalId ?? "—"}</span>,
    },
    {
      key: "loanId",
      header: t("Loan ID"),
      cell: (r) => <Badge>{r.loanId}</Badge>,
    },
    {
      key: "settlementDate",
      header: t("Settlement Date"),
      cell: (r) => (r.settlementDate ? new Date(r.settlementDate).toLocaleDateString() : "—"),
    },
    {
      key: "purchasePriceRatio",
      header: t("Price Ratio"),
      cell: (r) => (r.purchasePriceRatio ? r.purchasePriceRatio : "—"),
    },
    {
      key: "externalId",
      header: t("Transfer External ID"),
      cell: (r) => (r.externalId ? <span className="font-mono text-xs">{r.externalId}</span> : "—"),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("Transfers")}
        description={t("Loan sale and buyback transactions to external asset owners")}
        actions={
          <Button
            onClick={() => navigate("/external-asset-owners/transfers/new")}
            className="bg-[#D32F2F] hover:bg-red-700"
          >
            <Plus className="mr-2 h-4 w-4" /> {t("New Transfer")}
          </Button>
        }
      />
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle>{t("All Transfers")}</CardTitle>
          <div className="flex items-center gap-3">
            <div className="relative w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder={t("Loan ID...")}
                value={loanIdFilter}
                onChange={(e) => setLoanIdFilter(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="relative w-64">
              <Input
                placeholder={t("Transfer External ID...")}
                value={transferExternalIdFilter}
                onChange={(e) => setTransferExternalIdFilter(e.target.value)}
              />
            </div>
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
              data={transfers}
              emptyState={{
                icon: <ArrowRightLeft className="h-8 w-8 text-gray-300" />,
                message: t("No transfers found."),
              }}
              minWidth={800}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TransferListPage;
