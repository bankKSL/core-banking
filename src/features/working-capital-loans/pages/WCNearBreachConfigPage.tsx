import { type FC, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { DataTable, type ColumnDef } from "@/components/shared/DataTable";
import { Pagination } from "@/components/shared/Pagination";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { WC_LOANS_PAGE_SIZE, WC_LOAN_PAGE_SIZE_OPTIONS } from "../constants/status";
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
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(WC_LOANS_PAGE_SIZE);

  const totalRecords = configs.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const safePage = Math.min(page, totalPages);
  const pagedConfigs = useMemo(
    () => configs.slice((safePage - 1) * pageSize, safePage * pageSize),
    [configs, safePage, pageSize],
  );

  const columns: ColumnDef<WCNearBreachConfig>[] = [
    {
      key: "name",
      header: t("Name"),
      accessorFn: (r) => r.nearBreachName ?? r.name ?? `#${r.id}`,
      cell: (r) => <span className="font-medium">{r.nearBreachName ?? r.name ?? `#${r.id}`}</span>,
    },
    {
      key: "frequency",
      header: t("Frequency"),
      accessorFn: (r) =>
        `${r.nearBreachFrequency ?? r.frequency ?? "—"} ${toDisplayText(r.nearBreachFrequencyType ?? r.frequencyType)}`.trim(),
      cell: (r) => (
        <span className="text-sm">
          {r.nearBreachFrequency ?? r.frequency ?? "—"} {toDisplayText(r.nearBreachFrequencyType ?? r.frequencyType)}
        </span>
      ),
    },
    {
      key: "threshold",
      header: t("Threshold (%)"),
      accessorFn: (r) => r.nearBreachThreshold ?? r.threshold,
      cell: (r) => (
        <span className="font-mono text-sm font-semibold">{r.nearBreachThreshold ?? r.threshold ?? "—"}</span>
      ),
    },
    {
      key: "actions",
      header: "",
      sortable: false,
      cell: (r) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              openEdit(r);
            }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-red-600"
            onClick={(e) => {
              e.stopPropagation();
              setDeleteTarget(r);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

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
      nearBreachFrequencyType: (typeof freqType === "string"
        ? freqType
        : "DAYS") as FormState["nearBreachFrequencyType"],
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
        <CardHeader>
          <CardTitle>{t("All WC Near-Breaches")}</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={pagedConfigs}
            loading={isLoading}
            emptyState={{ message: t("No near-breach configurations found.") }}
            onRowClick={openEdit}
          />
          {totalRecords > 0 && (
            <div className="mt-4 flex flex-col items-center justify-between gap-4 sm:flex-row">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">{t("Rows per page")}</span>
                <Select
                  value={String(pageSize)}
                  onValueChange={(v) => {
                    setPageSize(Number(v));
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {WC_LOAN_PAGE_SIZE_OPTIONS.map((size) => (
                      <SelectItem key={size} value={String(size)}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Pagination
                currentPage={safePage}
                totalPages={totalPages}
                onPageChange={setPage}
                totalItems={totalRecords}
                pageSize={pageSize}
              />
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
              <Button
                variant="outline"
                onClick={() => setFormOpen(false)}
                disabled={createMut.isPending || updateMut.isPending}
              >
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
