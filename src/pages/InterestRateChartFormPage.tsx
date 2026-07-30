import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, Loader2, Plus, Trash2, Pencil } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTable, type ColumnDef } from "@/components/shared/DataTable";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  useInterestRateChart,
  useCreateInterestRateChart,
  useUpdateInterestRateChart,
  useInterestRateChartTemplate,
  useChartSlabs,
  useCreateChartSlab,
  useUpdateChartSlab,
  useDeleteChartSlab,
} from "@/features/deposits/hooks/useInterestRateCharts";
import type { InterestRateChartSlab, InterestRateChartTemplate } from "@/features/deposits/api/deposit";

interface SlabForm {
  description: string;
  periodType: string;
  fromPeriod: number | null;
  toPeriod: number | null;
  annualInterestRate: number;
}

const emptySlab = (template?: InterestRateChartTemplate): SlabForm => ({
  description: "",
  periodType: String(template?.periodTypes?.[0]?.id ?? 2),
  fromPeriod: null,
  toPeriod: null,
  annualInterestRate: 0,
});

const InterestRateChartFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const chartId = id ? Number(id) : undefined;

  const { data: existingChart, isLoading: chartLoading } = useInterestRateChart(chartId);
  const { data: template } = useInterestRateChartTemplate();
  const { data: slabs = [], isLoading: slabsLoading } = useChartSlabs(chartId);
  const createMutation = useCreateInterestRateChart();
  const updateMutation = useUpdateInterestRateChart();
  const createSlabMutation = useCreateChartSlab();
  const updateSlabMutation = useUpdateChartSlab();
  const deleteSlabMutation = useDeleteChartSlab();

  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", fromDate: "", endDate: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [slabDialogOpen, setSlabDialogOpen] = useState(false);
  const [editingSlab, setEditingSlab] = useState<InterestRateChartSlab | null>(null);
  const [slabForm, setSlabForm] = useState<SlabForm>(emptySlab(template));
  const [savingSlab, setSavingSlab] = useState(false);
  const [deleteSlabTarget, setDeleteSlabTarget] = useState<InterestRateChartSlab | null>(null);

  useEffect(() => {
    if (!existingChart) return;
    setForm({
      name: existingChart.name ?? "",
      description: existingChart.description ?? "",
      fromDate: existingChart.fromDate ?? "",
      endDate: existingChart.endDate ?? "",
    });
  }, [existingChart]);

  useEffect(() => {
    if (!template) return;
    setSlabForm((prev) => ({
      ...prev,
      periodType: prev.periodType || String(template.periodTypes?.[0]?.id ?? 2),
    }));
  }, [template]);

  const updateForm = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.fromDate.trim()) e.fromDate = "From date is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        name: form.name,
        description: form.description || undefined,
        fromDate: form.fromDate,
        endDate: form.endDate || undefined,
        dateFormat: "yyyy-MM-dd",
        locale: "en",
      };

      if (isEdit) {
        await updateMutation.mutateAsync({ chartId: chartId!, payload });
      } else {
        const result = await createMutation.mutateAsync(payload);
        navigate(`/interest-rate-charts/${result.resourceId}`);
        return;
      }
      navigate("/interest-rate-charts");
    } catch {
    } finally {
      setSaving(false);
    }
  };

  const openAddSlab = () => {
    setEditingSlab(null);
    setSlabForm(emptySlab(template));
    setSlabDialogOpen(true);
  };

  const openEditSlab = (slab: InterestRateChartSlab) => {
    setEditingSlab(slab);
    setSlabForm({
      description: slab.description ?? "",
      periodType: String(slab.periodType?.id ?? 2),
      fromPeriod: slab.fromPeriod,
      toPeriod: slab.toPeriod,
      annualInterestRate: slab.annualInterestRate,
    });
    setSlabDialogOpen(true);
  };

  const handleSaveSlab = async () => {
    if (!chartId) return;
    setSavingSlab(true);
    try {
      const payload: Record<string, unknown> = {
        description: slabForm.description || undefined,
        periodType: Number(slabForm.periodType),
        fromPeriod: slabForm.fromPeriod ?? 0,
        toPeriod: slabForm.toPeriod ?? 0,
        annualInterestRate: slabForm.annualInterestRate,
        locale: "en",
      };

      if (editingSlab) {
        await updateSlabMutation.mutateAsync({ chartId, slabId: editingSlab.id, payload });
      } else {
        await createSlabMutation.mutateAsync({ chartId, payload });
      }
      setSlabDialogOpen(false);
    } catch {
    } finally {
      setSavingSlab(false);
    }
  };

  const handleDeleteSlab = async () => {
    if (!deleteSlabTarget || !chartId) return;
    await deleteSlabMutation.mutateAsync({ chartId, slabId: deleteSlabTarget.id });
    setDeleteSlabTarget(null);
  };

  const periodOptions = template?.periodTypes ?? [];

  const slabColumns: ColumnDef<InterestRateChartSlab>[] = [
    { key: "description", header: "Description", cell: (r) => r.description || "—" },
    {
      key: "periodType",
      header: "Period Type",
      cell: (r) => r.periodType?.value ?? String(r.periodType?.id ?? ""),
    },
    { key: "fromPeriod", header: "From Period" },
    { key: "toPeriod", header: "To Period" },
    {
      key: "annualInterestRate",
      header: "Rate (%)",
      cell: (r) => <span className="font-mono font-semibold">{r.annualInterestRate}%</span>,
    },
    {
      key: "actions",
      header: "",
      cell: (r) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="sm" onClick={() => openEditSlab(r)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setDeleteSlabTarget(r)}>
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      ),
    },
  ];

  if (isEdit && chartLoading) {
    return (
      <div className="max-w-4xl m-auto space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl m-auto space-y-6">
      <PageHeader
        title={isEdit ? "Edit Interest Rate Chart" : "Create Interest Rate Chart"}
        description="Define interest rate charts and their slabs."
        actions={
          <Button variant="outline" onClick={() => navigate("/interest-rate-charts")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Chart Details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="col-span-2 space-y-1.5">
            <label className="block text-sm font-medium">Name *</label>
            <Input value={form.name} onChange={(e) => updateForm("name", e.target.value)} error={errors.name} />
          </div>
          <div className="col-span-2 space-y-1.5">
            <label className="block text-sm font-medium">Description</label>
            <Textarea
              value={form.description}
              onChange={(e) => updateForm("description", e.target.value)}
              rows={3}
              placeholder="Chart description"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium">From Date *</label>
            <Input
              type="date"
              value={form.fromDate}
              onChange={(e) => updateForm("fromDate", e.target.value)}
              error={errors.fromDate}
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium">End Date</label>
            <Input type="date" value={form.endDate} onChange={(e) => updateForm("endDate", e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Chart Slabs</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={openAddSlab} disabled={!chartId && !isEdit}>
              <Plus className="mr-1 h-4 w-4" /> Add Slab
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {slabsLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <DataTable
              columns={slabColumns}
              data={slabs}
              emptyState={{ message: "No slabs defined. Click 'Add Slab' to create one." }}
            />
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button variant="outline" type="button" onClick={() => navigate("/interest-rate-charts")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Cancel
        </Button>
        <Button onClick={handleSave} disabled={saving} className="bg-[#D32F2F] hover:bg-red-700">
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" /> {isEdit ? "Save Changes" : "Create Chart"}
            </>
          )}
        </Button>
      </div>

      <Dialog open={slabDialogOpen} onOpenChange={setSlabDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingSlab ? "Edit Slab" : "Add Slab"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="col-span-2 space-y-1.5">
              <label className="block text-sm font-medium">Description</label>
              <Input
                value={slabForm.description}
                onChange={(e) => setSlabForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Slab description"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">Period Type</label>
              <Select value={slabForm.periodType} onValueChange={(v) => setSlabForm((f) => ({ ...f, periodType: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {periodOptions.map((opt) => (
                    <SelectItem key={opt.id} value={String(opt.id)}>
                      {opt.value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">Annual Rate (%)</label>
              <Input
                type="number"
                step="0.01"
                value={slabForm.annualInterestRate || ""}
                onChange={(e) => setSlabForm((f) => ({ ...f, annualInterestRate: parseFloat(e.target.value) || 0 }))}
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">From Period</label>
              <Input
                type="number"
                value={slabForm.fromPeriod ?? ""}
                onChange={(e) =>
                  setSlabForm((f) => ({ ...f, fromPeriod: e.target.value === "" ? null : parseInt(e.target.value) }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">To Period</label>
              <Input
                type="number"
                value={slabForm.toPeriod ?? ""}
                onChange={(e) =>
                  setSlabForm((f) => ({ ...f, toPeriod: e.target.value === "" ? null : parseInt(e.target.value) }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSlabDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveSlab} disabled={savingSlab} className="bg-[#D32F2F] hover:bg-red-700">
              {savingSlab ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" /> {editingSlab ? "Update" : "Add"}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteSlabTarget}
        onOpenChange={() => setDeleteSlabTarget(null)}
        onConfirm={handleDeleteSlab}
        loading={deleteSlabMutation.isPending}
        title="Delete Slab"
        description={`Delete this slab?`}
        confirmLabel="Delete"
        variant="destructive"
      />
    </div>
  );
};

export default InterestRateChartFormPage;
