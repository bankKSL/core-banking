import { type FC, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Pencil, Trash2, Lock, Eye } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, type ColumnDef } from "@/components/shared/DataTable";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUsers, useDeleteUser } from "../hooks/useUsers";
import type { AppUser } from "../types/user";

const UserListPage: FC = () => {
  const navigate = useNavigate();
  const { data: users = [], isLoading, isError, refetch } = useUsers();
  const deleteMutation = useDeleteUser();
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<AppUser | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) => u.username.toLowerCase().includes(q) || u.firstname.toLowerCase().includes(q) || u.lastname.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q),
    );
  }, [users, search]);

  const columns: ColumnDef<AppUser>[] = [
    { key: "username", header: "Username", cell: (r) => <span className="font-medium">{r.username}</span> },
    { key: "firstname", header: "First Name", cell: (r) => r.firstname },
    { key: "lastname", header: "Last Name", cell: (r) => r.lastname },
    { key: "email", header: "Email", cell: (r) => <span className="text-sm text-gray-500">{r.email ?? "—"}</span> },
    { key: "officeName", header: "Office", cell: (r) => r.officeName ?? "—" },
    {
      key: "isActive",
      header: "Status",
      cell: (r) =>
        r.isActive !== false ? <Badge variant="success" size="sm">Active</Badge> : <Badge variant="error" size="sm">Disabled</Badge>,
    },
    {
      key: "actions",
      header: "",
      cell: (r) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="sm" onClick={() => navigate(`/admin/users/${r.id}`)}><Eye className="h-4 w-4" /></Button>
          <Button variant="ghost" size="sm" onClick={() => navigate(`/admin/users/edit/${r.id}`)}><Pencil className="h-4 w-4" /></Button>
          <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(r)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
        </div>
      ),
    },
  ];

  if (isError) {
    return (
      <div className="p-6">
        <PageHeader title="Users" description="Manage application users" />
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">Failed to load users. <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Users"
        description="Manage application users and their roles"
        actions={
          <Button onClick={() => navigate("/admin/users/new")} className="bg-[#D32F2F] hover:bg-red-700">
            <Plus className="mr-2 h-4 w-4" /> Create User
          </Button>
        }
      />
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Application Users</CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : (
            <DataTable columns={columns} data={filtered} emptyState={{ message: "No users found." }} minWidth={800} />
          )}
        </CardContent>
      </Card>
      <ConfirmDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)} onConfirm={async () => { if (deleteTarget) { await deleteMutation.mutateAsync(deleteTarget.id); setDeleteTarget(null); } }} title="Delete User" description={`Delete "${deleteTarget?.username}"? This will disable the account.`} variant="destructive" confirmLabel="Delete" />
    </div>
  );
};

export default UserListPage;
