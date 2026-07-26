import { type FC, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Save, Loader2, ToggleLeft, ToggleRight, Lock } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, type ColumnDef } from "@/components/shared/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useConfigurations, useUpdateConfiguration } from "../hooks/useConfiguration";
import type { GlobalConfiguration } from "../types/configuration";

const GlobalConfigPage: FC = () => {
  const navigate = useNavigate();
  const { data: configs = [], isLoading } = useConfigurations();
  const updateMutation = useUpdateConfiguration();
  const [search, setSearch] = useState("");
  const [editConfig, setEditConfig] = useState<GlobalConfiguration | null>(null);
  const [editEnabled, setEditEnabled] = useState(false);
  const [editValue, setEditValue] = useState("");
  const [editStringValue, setEditStringValue] = useState("");
  const [editDateValue, setEditDateValue] = useState("");

  const filtered = search
    ? configs.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.description?.toLowerCase().includes(search.toLowerCase()),
      )
    : configs;

  const openEdit = (config: GlobalConfiguration) => {
    setEditConfig(config);
    setEditEnabled(config.enabled);
    setEditValue(config.value !== undefined ? String(config.value) : "");
    setEditStringValue(config.stringValue ?? "");
    setEditDateValue(config.dateValue ?? "");
  };

  const handleSave = async () => {
    if (!editConfig) return;
    const payload: Record<string, unknown> = { enabled: editEnabled };
    if (editValue) payload.value = Number(editValue);
    if (editStringValue) payload.stringValue = editStringValue;
    if (editDateValue) payload.dateValue = editDateValue;
    await updateMutation.mutateAsync({ id: editConfig.id, payload });
    setEditConfig(null);
  };

  const columns: ColumnDef<GlobalConfiguration>[] = [
    {
      key: "name",
      header: "Name",
      cell: (r) => (
        <div>
          <span className="font-medium text-sm">{r.name}</span>
          {r.description && <p className="text-xs text-gray-500">{r.description}</p>}
        </div>
      ),
    },
    {
      key: "enabled",
      header: "Enabled",
      cell: (r) =>
        r.trapDoor ? (
          <Badge variant={r.enabled ? "success" : "default"}>{r.enabled ? "Yes" : "No"}</Badge>
        ) : (
          <button
            type="button"
            onClick={() =>
              updateMutation.mutate({
                id: r.id,
                payload: { enabled: !r.enabled },
              })
            }
            className="text-gray-500 hover:text-[#D32F2F]"
          >
            {r.enabled ? <ToggleRight className="h-5 w-5 text-emerald-500" /> : <ToggleLeft className="h-5 w-5" />}
          </button>
        ),
    },
    {
      key: "value",
      header: "Value",
      cell: (r) =>
        r.value !== undefined ? (
          <span className="font-mono text-sm">{r.value}</span>
        ) : (
          <span className="text-gray-400">—</span>
        ),
    },
    {
      key: "stringValue",
      header: "String Value",
      cell: (r) =>
        r.stringValue ? (
          <span className="text-xs max-w-[200px] truncate block">{r.stringValue}</span>
        ) : (
          <span className="text-gray-400">—</span>
        ),
    },
    {
      key: "dateValue",
      header: "Date Value",
      cell: (r) =>
        r.dateValue ? <span className="text-sm">{r.dateValue}</span> : <span className="text-gray-400">—</span>,
    },
    {
      key: "actions",
      header: "",
      cell: (r) =>
        r.trapDoor ? (
          <Lock className="h-4 w-4 text-gray-300" />
        ) : (
          <Button variant="ghost" size="sm" onClick={() => openEdit(r)}>
            <Save className="h-4 w-4" />
          </Button>
        ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Global Configuration"
        description="Manage system-wide settings, feature flags, and configuration values"
        actions={
          <Button variant="outline" onClick={() => navigate("/configuration")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        }
      />
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>All Configurations</CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search configs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={filtered}
              emptyState={{ message: "No configurations found." }}
              minWidth={700}
            />
          )}
        </CardContent>
      </Card>

      <Dialog open={!!editConfig} onOpenChange={(o) => !o && setEditConfig(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Configuration</DialogTitle>
          </DialogHeader>
          {editConfig && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium">{editConfig.name}</p>
                {editConfig.description && <p className="text-xs text-gray-500">{editConfig.description}</p>}
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={editEnabled} onCheckedChange={setEditEnabled} />
                <Label>Enabled</Label>
              </div>
              <div>
                <Label htmlFor="editValue">Value</Label>
                <Input
                  id="editValue"
                  type="number"
                  min="0"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  placeholder="Numeric value"
                />
              </div>
              <div>
                <Label htmlFor="editStringValue">String Value</Label>
                <Input
                  id="editStringValue"
                  value={editStringValue}
                  onChange={(e) => setEditStringValue(e.target.value)}
                  placeholder="Text value"
                />
              </div>
              <div>
                <Label htmlFor="editDateValue">Date Value</Label>
                <Input
                  id="editDateValue"
                  type="date"
                  value={editDateValue}
                  onChange={(e) => setEditDateValue(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => setEditConfig(null)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={updateMutation.isPending}
                  className="bg-[#D32F2F] hover:bg-red-700"
                >
                  {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Save className="mr-2 h-4 w-4" />
                  Save
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GlobalConfigPage;
