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
  useBreachConfigs,
  useCreateBreachConfig,
  useUpdateBreachConfig,
  useDeleteBreachConfig,
} from "../hooks/useWCLoanQueries";
import type { WCBreachConfig } from "../types/workingCapitalLoan";

const FREQUENCIES = ["DAYS", "WEEKS", "MONTHS", "YEARS"] as const;
const CALC_TYPES = ["PERCENTAGE", "FLAT"] as const;

interface FormState {
  name: string;
  breachFrequency: string;
  breachFrequencyType: (typeof FREQUENCIES)[number];
  breachAmountCalculationType: (typeof CALC_TYPES)[number];
  breachAmount: string;
}

const emptyForm: FormState = {
  name: "",
  breachFrequency: "",
  breachFrequencyType: "DAYS",
  breachAmountCalculationType: "PERCENTAGE",
  breachAmount: "",
};

const WCBreachConfigPage: FC = () => {
  const { t } = useTranslation();
  const { success: toastSuccess, error: toastError } = useToast();
  const { data: configs = [], isLoading } = useBreachConfigs();
  const createMut = useCreateBreachConfig();
  const updateMut = useUpdateBreachConfig();
  const deleteMut = useDeleteBreachConfig();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<WCBreachConfig | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<WCBreachConfig | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormOpen(true);
  };

  const openEdit = (cfg: WCBreachConfig) => {
    setEditing(cfg);
    setForm({
      name: cfg.name ?? "",
      breachFrequency: String(cfg.breachFrequency ?? ""),
      breachFrequencyType: ((typeof cfg.breachFrequencyType === "string"
        ? cfg.breachFrequencyType
        : "DAYS") as FormState["breachFrequencyType"]),
      breachAmountCalculationType: ((typeof cfg.breachAmountCalculationType === "string"
        ? cfg.breachAmountCalculationType
        : "PERCENTAGE") as FormState["breachAmountCalculationType"]),
      breachAmount: String(cfg.breachAmount ?? ""),
    });
    setFormOpen(true);
  };

  const valid =
    form.name.trim().length > 0 &&
    form.name.length <= 100 &&
    Number(form.breachFrequency) > 0 &&
    Number(form.breachAmount) >= 0;

  const handleSubmit = async () => {
    if (!valid) return;
    const payload = {
      name: form.name.trim(),
      breachFrequency: Number(form.breachFrequency),
      breachFrequencyType: form.breachFrequencyType,
      breachAmountCalculationType: form.breachAmountCalculationType,
      breachAmount: Number(form.breachAmount),
    };
    try {
      if (editing) {
        await updateMut.mutateAsync({ breachId: editing.id, payload });
        toastSuccess(t("Breach configuration updated"));
      } else {
        await createMut.mutateAsync(payload);
        toastSuccess(t("Breach configuration created"));
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
      toastSuccess(t("Breach configuration deleted"));
      setDeleteTarget(null);
    } catch (e) {
      toastError(e instanceof Error ? e.message : t("An unexpected error occurred."));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("Working Capital Breaches")}
        description={t("Configure breach rules applied to working capital loans")}
        actions={
          <Button onClick={openCreate} className="bg-[#D32F2F] hover:bg-red-700">
            <Plus className="mr-2 h-4 w-4" />
            {t("New Breach")}
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
            <p className="px-6 py-8 text-center text-sm text-gray-400">{t("No breach configurations found.")}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-500">
                    <th className="px-6 py-3 font-medium">{t("Name")}</th>
                    <th className="px-6 py-3 font-medium">{t("Frequency")}</th>
                    <th className="px-6 py-3 font-medium">{t("Amount Type")}</th>
                    <th className="px-6 py-3 font-medium">{t("Amount")}</th>
                    <th className="px-6 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {configs.map((cfg) => (
                    <tr key={cfg.id} className="border-b last:border-0 hover:bg-gray-50 dark:hover:bg-gray-900/40">
                      <td className="px-6 py-3 font-medium">{cfg.name}</td>
                      <td className="px-6 py-3">
                        {cfg.breachFrequency} {typeof cfg.breachFrequencyType === "string" ? cfg.breachFrequencyType : ""}
                      </td>
                      <td className="px-6 py-3">
                        {typeof cfg.breachAmountCalculationType === "string" ? cfg.breachAmountCalculationType : ""}
                      </td>
                      <td className="px-6 py-3 font-mono">{cfg.breachAmount}</td>
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
            <DialogTitle>{editing ? t("Edit Breach") : t("New Breach")}</DialogTitle>
            <DialogDescription>{t("Define frequency and amount criteria for breach detection.")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">{t("Name")} *</label>
              <Input
                value={form.name}
                maxLength={100}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium">{t("Frequency")} *</label>
                <Input
                  type="number"
                  min="1"
                  value={form.breachFrequency}
                  onChange={(e) => setForm((f) => ({ ...f, breachFrequency: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium">{t("Frequency Type")}</label>
                <Select
                  value={form.breachFrequencyType}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, breachFrequencyType: v as FormState["breachFrequencyType"] }))
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
                <label className="block text-sm font-medium">{t("Amount Type")}</label>
                <Select
                  value={form.breachAmountCalculationType}
                  onValueChange={(v) =>
                    setForm((f) => ({
                      ...f,
                      breachAmountCalculationType: v as FormState["breachAmountCalculationType"],
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CALC_TYPES.map((ct) => (
                      <SelectItem key={ct} value={ct}>
                        {ct}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium">{t("Amount")} *</label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.breachAmount}
                  onChange={(e) => setForm((f) => ({ ...f, breachAmount: e.target.value }))}
                />
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-2">
              <Button variant="outline" onClick={() => setFormOpen(false)} disabled={createMut.isPending || updateMut.isPending}>
                {t("Cancel")}
              </Button>
              <Button onClick={handleSubmit} disabled={!valid || createMut.isPending || updateMut.isPending}>
                {(createMut.isPending || updateMut.isPending) && <span className="mr-1">…</span>}
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
        title={t("Delete Breach Configuration")}
        description={deleteTarget?.name}
        confirmLabel={t("Delete")}
        variant="destructive"
        loading={deleteMut.isPending}
      />
    </div>
  );
};

export default WCBreachConfigPage;
