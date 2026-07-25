import { type FC, useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Pencil, Shield, Search, Save, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useRole, useRolePermissions, useUpdateRolePermissions } from "../hooks/useRoles";

const RoleDetailPage: FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: role, isLoading } = useRole(id);
  const { data: rolePermissions, isLoading: permsLoading } = useRolePermissions(id);
  const updatePermsMutation = useUpdateRolePermissions();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  const permissions = rolePermissions?.permissionUsageData ?? [];

  useEffect(() => {
    if (!permissions.length) return;

    const map: Record<string, boolean> = {};
    for (const p of permissions) {
      map[p.code] = p.selected ?? false;
    }
    setSelected(map);
  }, [permissions]);

  const grouped = useMemo(() => {
    if (!permissions) return {};
    const groups: Record<string, typeof permissions> = {};

    for (const p of permissions) {
      const g = p.grouping ?? "Other";
      if (!groups[g]) groups[g] = [];
      groups[g].push(p);
    }
    return groups;
  }, [permissions]);

  const filteredGroups = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return grouped;
    const result: Record<string, typeof permissions> = {};
    for (const [group, perms] of Object.entries(grouped)) {
      const filtered = perms.filter((p) => p.code.toLowerCase().includes(q));
      if (filtered.length > 0) result[group] = filtered;
    }
    return result;
  }, [grouped, search]);

  const handleSavePermissions = async () => {
    if (!id || !permissions) return;
    const permissionUsageData = permissions.map((p) => ({
      grouping: p.grouping,
      code: p.code,
      entityName: p.entityName,
      actionName: p.actionName,
      selected: selected[p.code] ?? false,
    }));
    await updatePermsMutation.mutateAsync({ roleId: id, payload: { permissionUsageData } });
  };

  if (isLoading || permsLoading) {
    return (
      <div className="p-6 max-w-4xl m-auto">
        <Skeleton className="h-10 w-48 mb-6" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }
  if (!role)
    return (
      <div className="p-6">
        <p className="text-red-600">Role not found.</p>
      </div>
    );

  return (
    <div className="p-6 max-w-4xl m-auto space-y-6">
      <PageHeader
        title={role.name}
        description={role.description}
        actions={
          <div className="flex items-center gap-2">
            <Badge variant={role.disabled ? "error" : "success"}>{role.disabled ? "Disabled" : "Active"}</Badge>
            <Button variant="outline" size="sm" onClick={() => navigate(`/admin/roles/edit/${role.id}`)}>
              <Pencil className="mr-1 h-4 w-4" />
              Edit
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate("/admin/roles")}>
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back
            </Button>
          </div>
        }
      />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Permissions
          </CardTitle>
          <div className="flex items-center gap-3">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search permissions..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={handleSavePermissions} disabled={updatePermsMutation.isPending} size="sm">
              {updatePermsMutation.isPending && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
              <Save className="mr-1 h-4 w-4" />
              Save
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {Object.entries(filteredGroups).map(([group, perms]) => (
            <div key={group} className="mb-6">
              <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-2">{group}</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {perms?.map((p) => (
                  <label
                    key={p.code}
                    className="flex items-center gap-2 rounded-md border p-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 text-sm"
                  >
                    <Checkbox
                      checked={selected[p.code] ?? false}
                      onCheckedChange={(checked) => setSelected((prev) => ({ ...prev, [p.code]: checked === true }))}
                    />
                    <span className="truncate">{p.code}</span>
                  </label>
                ))}
              </div>
              <Separator className="mt-4" />
            </div>
          ))}
          {Object.keys(filteredGroups).length === 0 && <p className="text-sm text-gray-500">No permissions found.</p>}
        </CardContent>
      </Card>
    </div>
  );
};

export default RoleDetailPage;
