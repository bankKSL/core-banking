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
  useBreachConfigs,
  useCreateBreachConfig,
  useUpdateBreachConfig,
  useDeleteBreachConfig,
} from "../hooks/useWCLoanQueries";
import { WC_LOANS_PAGE_SIZE, WC_LOAN_PAGE_SIZE_OPTIONS } from "../constants/status";
import { toDisplayText } from "../utils/format";
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
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(WC_LOANS_PAGE_SIZE);

  const totalRecords = configs.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const safePage = Math.min(page, totalPages);
  const pagedConfigs = useMemo(
    () => configs.slice((safePage - 1) * pageSize, safePage * pageSize),
    [configs, safePage, pageSize],
  );

  const columns: ColumnDef<WCBreachConfig>[] = [
    {
      key: "name",
      header: t("Name"),
      cell: (r) => <span className="font-medium">{r.name ?? `#${r.id}`}</span>,
    },
    {
      key: "breachFrequency",
      header: t("Frequency"),
      accessorFn: (r) => `${r.breachFrequency ?? "—"} ${toDisplayText(r.breachFrequencyType)}`.trim(),
      cell: (r) => (
        <span className="text-sm">
          {r.breachFrequency ?? "—"} {toDisplayText(r.breachFrequencyType)}
        </span>
      ),
    },
    {
      key: "breachAmountCalculationType",
      header: t("Amount Type"),
      accessorFn: (r) => toDisplayText(r.breachAmountCalculationType),
      cell: (r) => <span className="text-sm">{toDisplayText(r.breachAmountCalculationType)}</span>,
    },
    {
      key: "breachAmount",
      header: t("Amount"),
      cell: (r) => <span className="font-mono text-sm font-semibold">{r.breachAmount ?? "—"}</span>,
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

  const openEdit = (cfg: WCBreachConfig) => {
    setEditing(cfg);
    setForm({
      name: cfg.name ?? "",
      breachFrequency: String(cfg.breachFrequency ?? ""),
      breachFrequencyType: (typeof cfg.breachFrequencyType === "string"
        ? cfg.breachFrequencyType
        : "DAYS") as FormState["breachFrequencyType"],
      breachAmountCalculationType: (typeof cfg.breachAmountCalculationType === "string"
        ? cfg.breachAmountCalculationType
        : "PERCENTAGE") as FormState["breachAmountCalculationType"],
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
        <CardHeader>
          <CardTitle>{t("All WC Breaches")}</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={pagedConfigs}
            loading={isLoading}
            emptyState={{ message: t("No breach configurations found.") }}
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
              <Button
                variant="outline"
                onClick={() => setFormOpen(false)}
                disabled={createMut.isPending || updateMut.isPending}
              >
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
