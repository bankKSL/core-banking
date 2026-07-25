import { type FC, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Pencil, Trash2, Eye, ToggleLeft, ToggleRight } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, type ColumnDef } from "@/components/shared/DataTable";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRoles, useDeleteRole, useEnableRole, useDisableRole } from "../hooks/useRoles";
import type { Role } from "../types/role";

const RoleListPage: FC = () => {
  const navigate = useNavigate();
  const { data: roles = [], isLoading, isError, refetch } = useRoles();
  const deleteMutation = useDeleteRole();
  const enableMutation = useEnableRole();
  const disableMutation = useDisableRole();
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Role | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return roles;
    return roles.filter((r) => r.name.toLowerCase().includes(q) || r.description.toLowerCase().includes(q));
  }, [roles, search]);

  const columns: ColumnDef<Role>[] = [
    { key: "name", header: "Name", cell: (r) => <span className="font-medium">{r.name}</span> },
    { key: "description", header: "Description", cell: (r) => <span className="text-sm text-gray-500">{r.description}</span> },
    {
      key: "disabled",
      header: "Status",
      cell: (r) => (r.disabled ? <Badge variant="error" size="sm">Disabled</Badge> : <Badge variant="success" size="sm">Active</Badge>),
    },
    {
      key: "actions",
      header: "",
      cell: (r) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="sm" onClick={() => navigate(`/admin/roles/${r.id}`)}><Eye className="h-4 w-4" /></Button>
          <Button variant="ghost" size="sm" onClick={() => navigate(`/admin/roles/edit/${r.id}`)}><Pencil className="h-4 w-4" /></Button>
          {r.disabled ? (
            <Button variant="ghost" size="sm" onClick={() => enableMutation.mutate(r.id)}><ToggleRight className="h-4 w-4 text-green-500" /></Button>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => disableMutation.mutate(r.id)}><ToggleLeft className="h-4 w-4 text-amber-500" /></Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(r)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Roles"
        description="Manage application roles and permissions"
        actions={
          <Button onClick={() => navigate("/admin/roles/new")} className="bg-[#D32F2F] hover:bg-red-700">
            <Plus className="mr-2 h-4 w-4" /> Create Role
          </Button>
        }
      />
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Application Roles</CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input placeholder="Search roles..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : isError ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">Failed to load roles. <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button></div>
          ) : (
            <DataTable columns={columns} data={filtered} emptyState={{ message: "No roles found." }} minWidth={700} />
          )}
        </CardContent>
      </Card>
      <ConfirmDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)} onConfirm={async () => { if (deleteTarget) { await deleteMutation.mutateAsync(deleteTarget.id); setDeleteTarget(null); } }} title="Delete Role" description={`Delete "${deleteTarget?.name}"? This will fail if users are assigned to this role.`} variant="destructive" confirmLabel="Delete" />
    </div>
  );
};

export default RoleListPage;
