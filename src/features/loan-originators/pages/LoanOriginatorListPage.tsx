import { type FC, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Plus, Search, Pencil, Trash2, Handshake } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, type ColumnDef } from "@/components/shared/DataTable";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLoanOriginators, useDeleteLoanOriginator } from "../hooks/useLoanOriginators";
import type { LoanOriginator } from "../types/loanOriginator";

const LoanOriginatorListPage: FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: originators = [], isLoading } = useLoanOriginators();
  const deleteMutation = useDeleteLoanOriginator();
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<LoanOriginator | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return originators;
    return originators.filter(
      (o) =>
        o.externalId.toLowerCase().includes(q) ||
        (o.name ?? "").toLowerCase().includes(q) ||
        (o.originatorType?.name ?? "").toLowerCase().includes(q) ||
        (o.channelType?.name ?? "").toLowerCase().includes(q),
    );
  }, [originators, search]);

  const columns: ColumnDef<LoanOriginator>[] = [
    {
      key: "name",
      header: t("Name"),
      cell: (r) => <span className="font-medium">{r.name || "—"}</span>,
    },
    { key: "externalId", header: t("External ID (Revenue Share ID)"), cell: (r) => <span className="font-mono text-xs">{r.externalId}</span> },
    {
      key: "status",
      header: t("Status"),
      cell: (r) => <StatusBadge status={r.status.toLowerCase()} size="sm" />,
    },
    {
      key: "originatorType",
      header: t("Originator Type"),
      cell: (r) => r.originatorType?.name ?? "—",
    },
    {
      key: "channelType",
      header: t("Channel Type"),
      cell: (r) => r.channelType?.name ?? "—",
    },
    {
      key: "actions",
      header: "",
      cell: (r) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="sm" onClick={() => navigate(`/loan-originators/edit/${r.id}`)}>
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
        title={t("Loan Originators")}
        description={t("Manage the external parties (merchant, broker, affiliate, platform) that source loan applications")}
        actions={
          <Button onClick={() => navigate("/loan-originators/new")} className="bg-[#D32F2F] hover:bg-red-700">
            <Plus className="mr-2 h-4 w-4" /> {t("Create Originator")}
          </Button>
        }
      />
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t("All Originators")}</CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder={t("Search originators...")}
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
                icon: <Handshake className="h-8 w-8 text-gray-300" />,
                message: t("No loan originators defined."),
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
        title={t("Delete Originator")}
        description={t('Delete originator "{{name}}"? Deletion fails if the originator is mapped to any loan.', { name: deleteTarget?.name ?? deleteTarget?.externalId })}
        variant="destructive"
        confirmLabel={t("Delete")}
        loading={deleteMutation.isPending}
      />
    </div>
  );
};

export default LoanOriginatorListPage;
