import React, { useState, useMemo } from "react";
import { Search, Plus, Pencil, Trash2, Building2, Car, Gem, Landmark,
  FileCheck, Shield, AlertTriangle, Banknote } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, type ColumnDef } from "@/components/shared/DataTable";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { collaterals } from "@/mock/data";
import type { Collateral, CollateralType, CollateralStatus } from "@/types";

const TYPE_LABELS: Record<CollateralType, string> = {
  property: "Property",
  vehicle: "Vehicle",
  fixed_deposit: "Fixed Deposit",
  gold: "Gold",
  securities: "Securities",
  guarantee: "Guarantee",
  equipment: "Equipment",
};

const TYPE_ICONS: Record<CollateralType, React.ComponentType<any>> = {
  property: Building2,
  vehicle: Car,
  fixed_deposit: Landmark,
  gold: Gem,
  securities: FileCheck,
  guarantee: Shield,
  equipment: AlertTriangle,
};

const CollateralPage: React.FC = () => {
  const [data, setData] = useState<Collateral[]>(collaterals);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Collateral | null>(null);
  const [form, setForm] = useState<Partial<Collateral>>({});

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return data.filter(
      (c) =>
        c.collateralId.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.ownerName.toLowerCase().includes(q),
    );
  }, [data, search]);

  const openCreate = () => {
    setEditingId(null);
    setForm({
      type: "property", description: "", estimatedValue: 0, forcedSaleValue: 0,
      currency: "USD", ownerName: "", ownerId: "", status: "under_valuation",
    });
    setDialogOpen(true);
  };

  const openEdit = (c: Collateral) => {
    setEditingId(c.id);
    setForm({ ...c });
    setDialogOpen(true);
  };

  const handleSave = () => {
    const now = new Date().toISOString();
    if (editingId) {
      setData((prev) =>
        prev.map((c) => (c.id === editingId ? { ...c, ...form, updatedAt: now } as Collateral : c)),
      );
    } else {
      const newItem: Collateral = {
        id: `col-${Date.now()}`,
        collateralId: `COL-${new Date().getFullYear()}-${String(data.length + 1).padStart(3, "0")}`,
        createdAt: now, updatedAt: now,
        ...form,
      } as Collateral;
      setData((prev) => [...prev, newItem]);
    }
    setDialogOpen(false);
  };

  const handleDelete = () => {
    if (deleteTarget) setData((prev) => prev.filter((c) => c.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

  const columns: ColumnDef<Collateral>[] = [
    {
      key: "collateralId", header: "Collateral ID",
      cell: (row) => <code className="text-xs font-mono">{row.collateralId}</code>,
    },
    {
      key: "type", header: "Type",
      cell: (row) => {
        const Icon = TYPE_ICONS[row.type];
        return (
          <div className="flex items-center gap-1.5">
            <Icon className="h-4 w-4 text-gray-500" />
            <span className="text-sm">{TYPE_LABELS[row.type]}</span>
          </div>
        );
      },
    },
    {
      key: "description", header: "Description",
      cell: (row) => <span className="text-sm max-w-50 truncate inline-block">{row.description}</span>,
    },
    {
      key: "estimatedValue", header: "Est. Value",
      cell: (row) => <span className="font-mono text-sm font-medium">{formatCurrency(row.estimatedValue)}</span>,
    },
    {
      key: "forcedSaleValue", header: "Forced Sale",
      cell: (row) => <span className="font-mono text-xs text-gray-500">{formatCurrency(row.forcedSaleValue)}</span>,
    },
    { key: "ownerName", header: "Owner" },
    { key: "status", header: "Status", cell: (row) => <StatusBadge status={row.status} size="sm" /> },
    {
      key: "pledgedLoanId", header: "Linked Loan",
      cell: (row) => row.pledgedLoanId
        ? <code className="text-xs font-mono text-blue-600">{row.pledgedLoanId.toUpperCase()}</code>
        : <span className="text-xs text-gray-400">—</span>,
    },
    {
      key: "valuationDate", header: "Valuation Date",
      cell: (row) => new Date(row.valuationDate).toLocaleDateString(),
    },
    {
      key: "actions", header: "Actions",
      cell: (row) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); openEdit(row); }}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600"
            onClick={(e) => { e.stopPropagation(); setDeleteTarget(row); }}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Collateral Management"
        description="Manage pledged assets, valuations, and collateral linked to loans"
        actions={<Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" />Register Collateral</Button>}
      />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Collateral</CardTitle>
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input placeholder="Search collateral..." value={search}
              onChange={(e) => setSearch(e.target.value)} className="pl-10" />
          </div>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={filtered} emptyState={{ message: "No collateral records found" }} />
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Collateral" : "Register Collateral"}</DialogTitle>
            <DialogDescription>Record collateral asset details and valuation.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">Type</label>
              <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v as CollateralType }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(TYPE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">Status</label>
              <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v as CollateralStatus }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="under_valuation">Under Valuation</SelectItem>
                  <SelectItem value="pledged">Pledged</SelectItem>
                  <SelectItem value="released">Released</SelectItem>
                  <SelectItem value="foreclosed">Foreclosed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Textarea label="Description" placeholder="Describe the collateral asset" value={form.description ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            </div>
            <Input label="Owner Name" value={form.ownerName ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, ownerName: e.target.value }))} />
            <Input label="Owner ID" value={form.ownerId ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, ownerId: e.target.value }))} />
            <Input label="Estimated Value" type="number" value={form.estimatedValue ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, estimatedValue: Number(e.target.value) }))} />
            <Input label="Forced Sale Value" type="number" value={form.forcedSaleValue ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, forcedSaleValue: Number(e.target.value) }))} />
            <Input label="Currency" value={form.currency ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))} />
            <Input label="Insurance Provider" value={form.insuranceProvider ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, insuranceProvider: e.target.value }))} />
            <Input label="Valuation Report Ref" value={form.valuationReportRef ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, valuationReportRef: e.target.value }))} />
            <Input label="Linked Loan ID" value={form.pledgedLoanId ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, pledgedLoanId: e.target.value }))} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editingId ? "Save Changes" : "Register"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)} onConfirm={handleDelete}
        title="Delete Collateral"
        description={`Delete collateral "${deleteTarget?.collateralId}"? This cannot be undone.`}
        confirmLabel="Delete" variant="destructive" />
    </div>
  );
};

export default CollateralPage;
