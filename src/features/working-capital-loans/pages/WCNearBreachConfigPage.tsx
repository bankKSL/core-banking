import { type FC, useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import {
  useNearBreachConfigs,
  useCreateNearBreachConfig,
  useUpdateNearBreachConfig,
  useDeleteNearBreachConfig,
} from "../hooks/useWCLoanQueries";
import { toDisplayText } from "../utils/format";
import type { WCNearBreachConfig } from "../types/workingCapitalLoan";

const FREQUENCIES = ["DAYS", "WEEKS", "MONTHS", "YEARS"] as const;

interface FormState {
  nearBreachName: string;
  nearBreachFrequency: string;
  nearBreachFrequencyType: (typeof FREQUENCIES)[number];
  nearBreachThreshold: string;
}

const emptyForm: FormState = {
  nearBreachName: "",
  nearBreachFrequency: "",
  nearBreachFrequencyType: "DAYS",
  nearBreachThreshold: "",
};

const WCNearBreachConfigPage: FC = () => {
  const { t } = useTranslation();
  const { success: toastSuccess, error: toastError } = useToast();
  const { data: configs = [], isLoading } = useNearBreachConfigs();
  const createMut = useCreateNearBreachConfig();
  const updateMut = useUpdateNearBreachConfig();
  const deleteMut = useDeleteNearBreachConfig();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<WCNearBreachConfig | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<WCNearBreachConfig | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormOpen(true);
  };

  const openEdit = (cfg: WCNearBreachConfig) => {
    setEditing(cfg);
    const freqType = cfg.nearBreachFrequencyType ?? cfg.frequencyType;
    setForm({
      nearBreachName: cfg.nearBreachName ?? cfg.name ?? "",
      nearBreachFrequency: String(cfg.nearBreachFrequency ?? cfg.frequency ?? ""),
      nearBreachFrequencyType: ((typeof freqType === "string" ? freqType : "DAYS") as FormState["nearBreachFrequencyType"]),
      nearBreachThreshold: String(cfg.nearBreachThreshold ?? cfg.threshold ?? ""),
    });
    setFormOpen(true);
  };

  const valid =
    form.nearBreachName.trim().length > 0 &&
    Number(form.nearBreachFrequency) > 0 &&
    Number(form.nearBreachThreshold) > 0 &&
    Number(form.nearBreachThreshold) <= 100;

  const handleSubmit = async () => {
    if (!valid) return;
    const payload = {
      nearBreachName: form.nearBreachName.trim(),
      nearBreachFrequency: Number(form.nearBreachFrequency),
      nearBreachFrequencyType: form.nearBreachFrequencyType,
      nearBreachThreshold: Number(form.nearBreachThreshold),
    };
    try {
      if (editing) {
        await updateMut.mutateAsync({ nearBreachId: editing.id, payload });
        toastSuccess(t("Near-breach configuration updated"));
      } else {
        await createMut.mutateAsync(payload);
        toastSuccess(t("Near-breach configuration created"));
      }
      setFormOpen(false);
    } catch (e) {
      toastError(e instanceof Error ? e.message : t("An unexpected error occurred."));
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMut.mutateAsync(deleteTarget.id);
      toastSuccess(t("Near-breach configuration deleted"));
      setDeleteTarget(null);
    } catch (e) {
      toastError(e instanceof Error ? e.message : t("An unexpected error occurred."));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("Working Capital Near-Breaches")}
        description={t("Configure early-warning thresholds applied before breach")}
        actions={
          <Button onClick={openCreate} className="bg-[#D32F2F] hover:bg-red-700">
            <Plus className="mr-2 h-4 w-4" />
            {t("New Near-Breach")}
          </Button>
        }
      />
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-4 p-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : configs.length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-gray-400">{t("No near-breach configurations found.")}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-500">
                    <th className="px-6 py-3 font-medium">{t("Name")}</th>
                    <th className="px-6 py-3 font-medium">{t("Frequency")}</th>
                    <th className="px-6 py-3 font-medium">{t("Threshold (%)")}</th>
                    <th className="px-6 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {configs.map((cfg) => (
                    <tr key={cfg.id} className="border-b last:border-0 hover:bg-gray-50 dark:hover:bg-gray-900/40">
                      <td className="px-6 py-3 font-medium">{cfg.nearBreachName ?? cfg.name ?? `#${cfg.id}`}</td>
                      <td className="px-6 py-3">
                        {(cfg.nearBreachFrequency ?? cfg.frequency ?? "—")}{" "}
                        {toDisplayText(cfg.nearBreachFrequencyType ?? cfg.frequencyType)}
                      </td>
                      <td className="px-6 py-3 font-mono">{cfg.nearBreachThreshold ?? cfg.threshold ?? "—"}</td>
                      <td className="px-6 py-3">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(cfg)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600"
                            onClick={() => setDeleteTarget(cfg)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={formOpen} onOpenChange={(o) => !o && setFormOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? t("Edit Near-Breach") : t("New Near-Breach")}</DialogTitle>
            <DialogDescription>{t("Early-warning rule evaluated before breach is reached.")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Name")} *</label>
              <Input
                value={form.nearBreachName}
                maxLength={100}
                onChange={(e) => setForm((f) => ({ ...f, nearBreachName: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium">{t("Frequency")} *</label>
                <Input
                  type="number"
                  min="1"
                  value={form.nearBreachFrequency}
                  onChange={(e) => setForm((f) => ({ ...f, nearBreachFrequency: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium">{t("Frequency Type")}</label>
                <Select
                  value={form.nearBreachFrequencyType}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, nearBreachFrequencyType: v as FormState["nearBreachFrequencyType"] }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FREQUENCIES.map((fq) => (
                      <SelectItem key={fq} value={fq}>
                        {fq}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium">{t("Threshold (%)")} *</label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={form.nearBreachThreshold}
                  onChange={(e) => setForm((f) => ({ ...f, nearBreachThreshold: e.target.value }))}
                />
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-2">
              <Button variant="outline" onClick={() => setFormOpen(false)} disabled={createMut.isPending || updateMut.isPending}>
                {t("Cancel")}
              </Button>
              <Button onClick={handleSubmit} disabled={!valid || createMut.isPending || updateMut.isPending}>
                {editing ? t("Save Changes") : t("Create")}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={t("Delete Near-Breach Configuration")}
        description={deleteTarget?.nearBreachName ?? deleteTarget?.name}
        confirmLabel={t("Delete")}
        variant="destructive"
        loading={deleteMut.isPending}
      />
    </div>
  );
};

export default WCNearBreachConfigPage;
