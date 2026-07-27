import { type FC, useState, useMemo } from "react";
import { Save, Loader2, Search } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { usePermissions, useUpdateMakerChecker } from "../hooks/useRoles";

const PermissionsPage: FC = () => {
  const { data: permissions, isLoading } = usePermissions(true);
  const updateMutation = useUpdateMakerChecker();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  useMemo(() => {
    if (!permissions) return;
    const map: Record<string, boolean> = {};
    for (const p of permissions) map[p.code] = false;
    setSelected((prev) => (Object.keys(prev).length === 0 ? map : prev));
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
      const f = perms.filter((p) => p.code.toLowerCase().includes(q));
      if (f.length > 0) result[group] = f;
    }
    return result;
  }, [grouped, search]);

  const handleSave = async () => {
    await updateMutation.mutateAsync(selected);
  };

  if (isLoading)
    return (
      <div className="p-6">
        <Skeleton className="h-10 w-48 mb-6" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Maker-Checker Permissions"
        description="Enable or disable maker-checker workflow for each permission"
        actions={
          <Button onClick={handleSave} disabled={updateMutation.isPending} className="bg-[#D32F2F] hover:bg-red-700">
            {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" />
            Save Configuration
          </Button>
        }
      />
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Maker-Checker Permissions</CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
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
          {Object.keys(filteredGroups).length === 0 && (
            <p className="text-sm text-gray-500">No maker-checker permissions available.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PermissionsPage;
