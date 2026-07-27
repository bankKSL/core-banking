import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Pencil, Trash2, BookOpen } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, type ColumnDef } from "@/components/shared/DataTable";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useAccountingRules, useDeleteAccountingRule } from "@/features/accounting";
import type { AccountingRuleData } from "@/features/accounting";

const AccountingRulesPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: rules = [], isLoading, isError, error, refetch } = useAccountingRules();
  const deleteMutation = useDeleteAccountingRule();
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<AccountingRuleData | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return rules;
    return rules.filter((r) => r.name.toLowerCase().includes(q) || (r.description ?? "").toLowerCase().includes(q));
  }, [rules, search]);

  const columns: ColumnDef<AccountingRuleData>[] = [
    { key: "name", header: "Name", cell: (r) => <span className="font-semibold">{r.name}</span> },
    { key: "officeName", header: "Office" },
    { key: "description", header: "Description", cell: (r) => <span className="text-sm">{r.description ?? "—"}</span> },
    {
      key: "debit",
      header: "Debit",
      cell: (r) => {
        const accounts = r.debitAccounts?.map((a) => a.name).join(", ");
        const tags = r.debitTags?.map((t) => t.tag?.name).join(", ");
        return <span className="text-sm">{accounts || (tags ? `Tags: ${tags}` : "—")}</span>;
      },
    },
    {
      key: "credit",
      header: "Credit",
      cell: (r) => {
        const accounts = r.creditAccounts?.map((a) => a.name).join(", ");
        const tags = r.creditTags?.map((t) => t.tag?.name).join(", ");
        return <span className="text-sm">{accounts || (tags ? `Tags: ${tags}` : "—")}</span>;
      },
    },
    {
      key: "systemDefined",
      header: "Type",
      cell: (r) =>
        r.systemDefined ? (
          <Badge variant="default" size="sm">
            System
          </Badge>
        ) : (
          <Badge variant="info" size="sm">
            Custom
          </Badge>
        ),
    },
    {
      key: "actions",
      header: "",
      cell: (r) =>
        !r.systemDefined ? (
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="sm" onClick={() => navigate(`/accounting/rules/edit/${r.id}`)}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(r)}>
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        ) : null,
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
        <PageHeader title="Accounting Rules" description="Manage accounting rules" />
        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
          <span className="text-sm">Failed to load: {error?.message ?? "Unknown error"}</span>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Accounting Rules"
        description="Predefined debit/credit templates for non-accountant users"
        actions={
          <Button onClick={() => navigate("/accounting/rules/new")} className="bg-[#D32F2F] hover:bg-red-700">
            <Plus className="mr-2 h-4 w-4" /> Create Rule
          </Button>
        }
      />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" /> All Rules
          </CardTitle>
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search rules..."
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
              emptyState={{ message: "No accounting rules found." }}
              minWidth={900}
            />
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Accounting Rule"
        description={`Delete "${deleteTarget?.name}"?`}
        confirmLabel="Delete"
        variant="destructive"
      />
    </div>
  );
};

export default AccountingRulesPage;
