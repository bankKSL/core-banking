import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Pencil, Trash2, BookOpen } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, type ColumnDef } from "@/components/shared/DataTable";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useGLAccounts, useDeleteGLAccount, GL_ACCOUNT_TYPE_LABELS, GL_ACCOUNT_USAGE_LABELS } from "@/features/accounting";
import type { GLAccountData } from "@/features/accounting";

const GLAccountsPage: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [usageFilter, setUsageFilter] = useState<string>("all");
  const [deleteTarget, setDeleteTarget] = useState<GLAccountData | null>(null);

  const params = useMemo(() => {
    const p: Record<string, unknown> = {};
    if (typeFilter !== "all") p.type = Number(typeFilter);
    if (usageFilter !== "all") p.usage = Number(usageFilter);
    return p;
  }, [typeFilter, usageFilter]);

  const { data: accounts = [], isLoading, isError, error, refetch } = useGLAccounts(params);
  const deleteMutation = useDeleteGLAccount();

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return accounts;
    return accounts.filter(
      (a) => a.name.toLowerCase().includes(q) || a.glCode.toLowerCase().includes(q),
    );
  }, [accounts, search]);

  const stats = useMemo(
    () => ({
      total: accounts.length,
      detail: accounts.filter((a) => a.usage?.id === 1).length,
      header: accounts.filter((a) => a.usage?.id === 2).length,
      disabled: accounts.filter((a) => a.disabled).length,
    }),
    [accounts],
  );

  const columns: ColumnDef<GLAccountData>[] = [
    {
      key: "glCode",
      header: "GL Code",
      cell: (r) => <code className="text-xs font-mono">{r.glCode}</code>,
    },
    {
      key: "name",
      header: "Account Name",
      cell: (r) => <span className="font-medium whitespace-pre">{r.nameDecorated || r.name}</span>,
    },
    {
      key: "type",
      header: "Type",
      cell: (r) => (
        <Badge variant="info" size="sm">
          {r.type?.value ?? GL_ACCOUNT_TYPE_LABELS[r.type?.id] ?? "—"}
        </Badge>
      ),
    },
    {
      key: "usage",
      header: "Usage",
      cell: (r) => <span className="text-sm">{r.usage?.value ?? GL_ACCOUNT_USAGE_LABELS[r.usage?.id] ?? "—"}</span>,
    },
    {
      key: "manualEntriesAllowed",
      header: "Manual Entries",
      cell: (r) =>
        r.manualEntriesAllowed ? (
          <Badge variant="success" size="sm">Allowed</Badge>
        ) : (
          <Badge variant="default" size="sm">No</Badge>
        ),
    },
    {
      key: "disabled",
      header: "Status",
      cell: (r) =>
        r.disabled ? (
          <Badge variant="error" size="sm">Disabled</Badge>
        ) : (
          <Badge variant="success" size="sm">Active</Badge>
        ),
    },
    {
      key: "actions",
      header: "",
      cell: (r) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="sm" onClick={() => navigate(`/accounting/gl-accounts/edit/${r.id}`)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(r)}>
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      ),
    },
  ];

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteMutation.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  };

  if (isError) {
    return (
      <div className="p-6 space-y-6">
        <PageHeader title="Chart of Accounts" description="Manage GL accounts" />
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
    <div className="p-6 space-y-6">
      <PageHeader
        title="Chart of Accounts"
        description="Manage general ledger accounts"
        actions={
          <Button onClick={() => navigate("/accounting/gl-accounts/new")} className="bg-[#D32F2F] hover:bg-red-700">
            <Plus className="mr-2 h-4 w-4" /> Create Account
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
          <StatCard title="Total Accounts" value={stats.total} icon={BookOpen} />
          <StatCard title="Detail Accounts" value={stats.detail} variant="success" />
          <StatCard title="Header Accounts" value={stats.header} variant="default" />
          <StatCard title="Disabled" value={stats.disabled} variant="warning" />
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>GL Accounts</CardTitle>
          <div className="flex items-center gap-3">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search name or code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {Object.entries(GL_ACCOUNT_TYPE_LABELS).map(([id, label]) => (
                  <SelectItem key={id} value={id}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={usageFilter} onValueChange={setUsageFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Usage" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {Object.entries(GL_ACCOUNT_USAGE_LABELS).map(([id, label]) => (
                  <SelectItem key={id} value={id}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <DataTable columns={columns} data={filtered} emptyState={{ message: "No GL accounts found." }} minWidth={900} />
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete GL Account"
        description={`Delete "${deleteTarget?.name}" (${deleteTarget?.glCode})? Only accounts with no journal entries can be deleted.`}
        confirmLabel="Delete"
        variant="destructive"
      />
    </div>
  );
};

export default GLAccountsPage;
