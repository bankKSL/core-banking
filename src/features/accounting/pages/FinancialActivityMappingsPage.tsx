import React, { useState } from "react";
import { Plus, Trash2, Link2, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, type ColumnDef } from "@/components/shared/DataTable";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useFinancialActivityAccounts,
  useFinancialActivityAccountTemplate,
  useCreateFinancialActivityMapping,
  useDeleteFinancialActivityMapping,
} from "@/features/accounting";
import type { FinancialActivityAccountData } from "@/features/accounting";

const FinancialActivityMappingsPage: React.FC = () => {
  const { t } = useTranslation();
  const { data: mappings = [], isLoading, isError, error, refetch } = useFinancialActivityAccounts();
  const { data: template } = useFinancialActivityAccountTemplate();
  const createMutation = useCreateFinancialActivityMapping();
  const deleteMutation = useDeleteFinancialActivityMapping();

  const [showForm, setShowForm] = useState(false);
  const [financialActivityId, setFinancialActivityId] = useState(0);
  const [glAccountId, setGlAccountId] = useState(0);
  const [formError, setFormError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<FinancialActivityAccountData | null>(null);

  const activityOptions = template?.financialActivityOptions ?? [];
  const glAccountOptions = template?.glAccountOptions ?? [];

  const handleCreate = async () => {
    if (!financialActivityId || !glAccountId) {
      setFormError(t("Both financial activity and GL account are required."));
      return;
    }
    setFormError("");
    await createMutation.mutateAsync({ financialActivityId, glAccountId });
    setFinancialActivityId(0);
    setGlAccountId(0);
    setShowForm(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteMutation.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  };

  const columns: ColumnDef<FinancialActivityAccountData>[] = [
    {
      key: "financialActivity",
      header: t("Financial Activity"),
      cell: (r) => <span className="font-medium">{r.financialActivityData?.name ?? `#${r.financialActivityId}`}</span>,
    },
    {
      key: "glAccount",
      header: t("GL Account"),
      cell: (r) => (
        <span className="text-sm">
          {r.glAccountData?.name ?? "—"}{" "}
          <code className="text-xs text-gray-400">({r.glAccountData?.glCode ?? ""})</code>
        </span>
      ),
    },
    {
      key: "type",
      header: t("Account Type"),
      cell: (r) => <span className="text-sm">{r.glAccountData?.type?.value ?? "—"}</span>,
    },
    {
      key: "actions",
      header: "",
      cell: (r) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(r)}>
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      ),
    },
  ];

  if (isError) {
    return (
      <div className="space-y-6">
        <PageHeader title={t("Financial Activity Mappings")} description={t("Map financial activities to GL accounts")} />
        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
          <span className="text-sm">{t("Failed to load:")}: {error?.message ?? t("Unknown error")}</span>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            {t("Retry")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("Financial Activity Mappings")}
        description={t("Map financial activities (e.g. Fund Source) to GL accounts")}
        actions={
          <Button onClick={() => setShowForm((s) => !s)} className="bg-[#D32F2F] hover:bg-red-700">
            <Plus className="mr-2 h-4 w-4" /> {t("New Mapping")}
          </Button>
        }
      />

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Link2 className="h-4 w-4" /> {t("Create Mapping")}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-[1fr_1fr_auto] items-end gap-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Financial Activity")} *</label>
              <Select
                value={financialActivityId ? String(financialActivityId) : ""}
                onValueChange={(v) => setFinancialActivityId(Number(v))}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("Select activity")} />
                </SelectTrigger>
                <SelectContent>
                  {activityOptions.map((a) => (
                    <SelectItem key={a.id} value={String(a.id)}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("GL Account")} *</label>
              <Select value={glAccountId ? String(glAccountId) : ""} onValueChange={(v) => setGlAccountId(Number(v))}>
                <SelectTrigger>
                  <SelectValue placeholder={t("Select account")} />
                </SelectTrigger>
                <SelectContent>
                  {glAccountOptions?.map((a) => (
                    <SelectItem key={a.id} value={String(a.id)}>
                      {a.name} ({a.glCode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {t("Create")}
            </Button>
            {formError && <p className="col-span-3 text-sm text-red-500">{formError}</p>}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t("All Mappings")}</CardTitle>
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
              data={mappings}
              emptyState={{ message: t("No mappings found.") }}
              minWidth={700}
            />
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={t("Delete Mapping")}
        description={`${t("Delete mapping for")} "${deleteTarget?.financialActivityData?.name}"?`}
        confirmLabel={t("Delete")}
        variant="destructive"
      />
    </div>
  );
};

export default FinancialActivityMappingsPage;
