import { type FC, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Search, Save, Loader2, ToggleLeft, ToggleRight, Lock } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, type ColumnDef } from "@/components/shared/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/shared/ErrorState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useConfigurations, useUpdateConfiguration } from "../hooks/useConfiguration";
import type { GlobalConfiguration } from "../types/configuration";

const editConfigSchema = z.object({
  enabled: z.boolean(),
  value: z.string().optional(),
  stringValue: z.string().optional(),
  dateValue: z.string().optional(),
});

type EditConfigFormValues = z.infer<typeof editConfigSchema>;

const GlobalConfigPage: FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: configs, isLoading } = useConfigurations();
  const updateMutation = useUpdateConfiguration();
  const [search, setSearch] = useState("");
  const [editConfig, setEditConfig] = useState<GlobalConfiguration | null>(null);

  const { register, handleSubmit, control, reset } = useForm<EditConfigFormValues>({
    resolver: zodResolver(editConfigSchema),
    defaultValues: { enabled: false, value: "", stringValue: "", dateValue: "" },
  });

  const configurations = configs?.globalConfiguration ?? [];

  const filtered = search
    ? configurations.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.description?.toLowerCase().includes(search.toLowerCase()),
      )
    : configurations;

  const openEdit = (config: GlobalConfiguration) => {
    setEditConfig(config);
    reset({
      enabled: config.enabled,
      value: config.value !== undefined ? String(config.value) : "",
      stringValue: config.stringValue ?? "",
      dateValue: config.dateValue ?? "",
    });
  };

  const onSubmit = useCallback(
    async (values: EditConfigFormValues) => {
      if (!editConfig) return;
      const payload: Record<string, unknown> = { enabled: values.enabled };
      if (values.value) payload.value = Number(values.value);
      if (values.stringValue) payload.stringValue = values.stringValue;
      if (values.dateValue) payload.dateValue = values.dateValue;
      await updateMutation.mutateAsync({ id: editConfig.id, payload });
      setEditConfig(null);
    },
    [editConfig, updateMutation],
  );

  const columns: ColumnDef<GlobalConfiguration>[] = [
    {
      key: "name",
      header: t("Name"),
      cell: (r) => (
        <div>
          <span className="font-medium text-sm">{r.name}</span>
          {r.description && <p className="text-xs text-gray-500">{r.description}</p>}
        </div>
      ),
    },
    {
      key: "enabled",
      header: t("Enabled"),
      cell: (r) =>
        r.trapDoor ? (
          <Badge variant={r.enabled ? "success" : "default"}>{r.enabled ? t("Yes") : t("No")}</Badge>
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
      header: t("Value"),
      cell: (r) =>
        r.value !== undefined ? (
          <span className="font-mono text-sm">{r.value}</span>
        ) : (
          <span className="text-gray-400">—</span>
        ),
    },
    {
      key: "stringValue",
      header: t("String Value"),
      cell: (r) =>
        r.stringValue ? (
          <span className="text-xs max-w-50 truncate block">{r.stringValue}</span>
        ) : (
          <span className="text-gray-400">—</span>
        ),
    },
    {
      key: "dateValue",
      header: t("Date Value"),
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
    <div className="space-y-6">
      <PageHeader
        title={t("Global Configuration")}
        description={t("Manage system-wide settings, feature flags, and configuration values")}
        actions={
          <Button variant="outline" onClick={() => navigate("/configuration")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("Back")}
          </Button>
        }
      />
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t("All Configurations")}</CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder={t("Search configs...")}
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
              emptyState={{ message: t("No configurations found.") }}
              minWidth={700}
            />
          )}
        </CardContent>
      </Card>

      {updateMutation.isError && (
        <ErrorState
          title={t("Failed to save configuration")}
          message={
            updateMutation.error instanceof Error ? updateMutation.error.message : t("An unexpected error occurred.")
          }
          onRetry={() => updateMutation.reset()}
        />
      )}

      <Dialog open={!!editConfig} onOpenChange={(o) => !o && setEditConfig(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("Edit Configuration")}</DialogTitle>
          </DialogHeader>
          {editConfig && (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <p className="text-sm font-medium">{editConfig.name}</p>
                {editConfig.description && <p className="text-xs text-gray-500">{editConfig.description}</p>}
              </div>
              <div className="flex items-center gap-2">
                <Controller
                  control={control}
                  name="enabled"
                  render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />}
                />
                <label className="block text-sm font-medium">{t("Enabled")}</label>
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium">{t("Value")}</label>
                <Input type="number" min="0" {...register("value")} placeholder={t("Numeric value")} />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium">{t("String Value")}</label>
                <Input {...register("stringValue")} placeholder={t("Text value")} />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium">{t("Date Value")}</label>
                <Input type="date" {...register("dateValue")} />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" type="button" onClick={() => setEditConfig(null)}>
                  {t("Cancel")}
                </Button>
                <Button type="submit" disabled={updateMutation.isPending} className="bg-[#D32F2F] hover:bg-red-700">
                  {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Save className="mr-2 h-4 w-4" />
                  {t("Save")}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GlobalConfigPage;
