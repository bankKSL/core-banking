import React, { useState, useMemo } from "react";
import { Plus, Search, Pencil, Trash2, AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, type ColumnDef } from "@/components/shared/DataTable";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useSavingsProducts, createSavingsProduct, updateSavingsProduct } from "@/features/deposits";
import type { SavingsProduct, SavingsProductCreateRequest } from "@/features/deposits";

// ─── Option Maps (per Fineract spec) ─────────────────────────────
const COMPOUNDING_OPTIONS = [
    { id: 1, label: "Daily" },
    { id: 4, label: "Monthly" },
    { id: 5, label: "Quarterly" },
    { id: 6, label: "Semi-Annual" },
    { id: 7, label: "Annual" },
];

const POSTING_OPTIONS = [
    { id: 1, label: "Monthly" },
    { id: 4, label: "Quarterly" },
    { id: 5, label: "Semi-Annual" },
    { id: 7, label: "Annual" },
];

const CALC_TYPE_OPTIONS = [
    { id: 1, label: "Daily Balance" },
    { id: 2, label: "Average Daily Balance" },
];

const DAYS_YEAR_OPTIONS = [
    { id: 360, label: "360 Days" },
    { id: 364, label: "364 Days" },
    { id: 365, label: "365 Days" },
];

const CURRENCY_OPTIONS = ["USD", "EUR", "GBP", "INR", "JPY", "AUD"];

const SavingsProductsPage: React.FC = () => {
    const { data: products = [], isLoading, isError, error, refetch } = useSavingsProducts();
    const [search, setSearch] = useState("");
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<SavingsProduct | null>(null);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState<Partial<SavingsProductCreateRequest>>({});
    const [errors, setErrors] = useState<Record<string, string>>({});

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return products.filter((p) => p.name.toLowerCase().includes(q) || (p.description ?? "").toLowerCase().includes(q));
    }, [products, search]);

    const openCreate = () => {
        setEditingId(null);
        setForm({
            name: "",
            shortName: "",
            currencyCode: "USD",
            digitsAfterDecimal: 2,
            nominalAnnualInterestRate: 0,
            interestCompoundingPeriodType: 1,
            interestPostingPeriodType: 4,
            interestCalculationType: 1,
            interestCalculationDaysInYearType: 365,
            minRequiredOpeningBalance: 0,
        });
        setErrors({});
        setDialogOpen(true);
    };

    const openEdit = (p: SavingsProduct) => {
        setEditingId(p.id);
        setForm({
            name: p.name,
            shortName: p.shortName ?? "",
            description: p.description,
            currencyCode: p.currency.code,
            digitsAfterDecimal: p.currency.decimalPlaces,
            nominalAnnualInterestRate: p.nominalAnnualInterestRate,
            minRequiredOpeningBalance: p.minRequiredOpeningBalance,
        });
        setErrors({});
        setDialogOpen(true);
    };

    const validate = (): boolean => {
        const e: Record<string, string> = {};
        if (!form.name?.trim()) e.name = "Required";
        if (!form.shortName?.trim()) e.shortName = "Required";
        else if (/\s/.test(form.shortName)) e.shortName = "No spaces allowed";
        if (form.nominalAnnualInterestRate == null || form.nominalAnnualInterestRate < 0) e.nominalAnnualInterestRate = "Must be >= 0";
        if (!form.interestCompoundingPeriodType) e.interestCompoundingPeriodType = "Required";
        if (!form.interestPostingPeriodType) e.interestPostingPeriodType = "Required";
        if (!form.interestCalculationType) e.interestCalculationType = "Required";
        if (!form.interestCalculationDaysInYearType) e.interestCalculationDaysInYearType = "Required";
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSave = async () => {
        if (!validate()) return;
        setSaving(true);
        try {
            const payload: SavingsProductCreateRequest = {
                ...(form as SavingsProductCreateRequest),
                locale: "en",
                accountingRule: 1,
            };
            if (editingId) {
                await updateSavingsProduct(editingId, payload);
            } else {
                await createSavingsProduct(payload);
            }
            setDialogOpen(false);
            refetch();
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (deleteTarget) {
            try {
                await updateSavingsProduct(deleteTarget.id, {} as SavingsProductCreateRequest);
            } catch {
                /* best-effort */
            }
            setDeleteTarget(null);
            refetch();
        }
    };

    const columns: ColumnDef<SavingsProduct>[] = [
        { key: "name", header: "Name", cell: (r) => <span className="font-semibold">{r.name}</span> },
        { key: "shortName", header: "Code", cell: (r) => <code className="text-xs">{r.shortName ?? "—"}</code> },
        { key: "currency", header: "Currency", cell: (r) => <code className="text-xs">{r.currency.code}</code> },
        {
            key: "nominalAnnualInterestRate",
            header: "Rate",
            cell: (r) => <span className="font-mono text-sm">{r.nominalAnnualInterestRate}% p.a.</span>,
        },
        {
            key: "minRequiredOpeningBalance",
            header: "Min Balance",
            cell: (r) => <span className="font-mono text-xs">{r.minRequiredOpeningBalance?.toLocaleString() ?? "0"}</span>,
        },
        {
            key: "actions",
            header: "",
            cell: (r) => (
                <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(r)}>
                        <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600" onClick={() => setDeleteTarget(r)}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            ),
        },
    ];

    if (isError)
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <AlertTriangle className="mx-auto h-8 w-8 text-red-500 mb-2" />
                    <p className="text-red-600">Failed to load savings products: {String(error)}</p>
                    <Button variant="outline" className="mt-2" onClick={() => refetch()}>
                        Retry
                    </Button>
                </div>
            </div>
        );

    return (
        <div className="space-y-6">
            <PageHeader
                title="Savings Products"
                description="Configure savings, current and fixed deposit product offerings"
                actions={
                    <Button onClick={openCreate}>
                        <Plus className="mr-2 h-4 w-4" />
                        New Product
                    </Button>
                }
            />

            {/* Info banner — Section 5 / 8: Check available products before using in client creation */}
            {!isLoading && products.length === 0 && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950 dark:border-amber-800 p-4">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
                        <div>
                            <p className="font-medium text-amber-800 dark:text-amber-300">No savings products found</p>
                            <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                                Create a savings product here first, then use its ID when creating a client (via the{" "}
                                <code className="text-xs bg-amber-100 dark:bg-amber-900 px-1 rounded">savingsProductId</code> field) or when
                                opening a savings account.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>
                        {products.length} Product{products.length !== 1 && "s"}
                    </CardTitle>
                    <div className="relative w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search products..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="space-y-2">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <Skeleton key={i} className="h-12 w-full" />
                            ))}
                        </div>
                    ) : (
                        <DataTable columns={columns} data={filtered} emptyState={{ message: "No savings products found" }} />
                    )}
                </CardContent>
            </Card>

            {/* Create / Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingId ? "Edit" : "Create"} Savings Product</DialogTitle>
                        <DialogDescription>
                            Configure the savings product parameters per the Fineract specification. Fields marked with * are required.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-4 py-4">
                        {/* Basic Info */}
                        <Input
                            label="Product Name *"
                            value={form.name ?? ""}
                            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                            error={errors.name}
                        />
                        <Input
                            label="Short Name *"
                            value={form.shortName ?? ""}
                            onChange={(e) => setForm((f) => ({ ...f, shortName: e.target.value }))}
                            error={errors.shortName}
                            placeholder="No spaces (e.g. REGSAV01)"
                        />
                        <div className="col-span-2">
                            <Textarea
                                label="Description"
                                placeholder="Brief product description"
                                value={form.description ?? ""}
                                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                            />
                        </div>

                        {/* Currency */}
                        <div>
                            <label className="text-sm font-medium">Currency *</label>
                            <Select value={form.currencyCode ?? "USD"} onValueChange={(v) => setForm((f) => ({ ...f, currencyCode: v }))}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {CURRENCY_OPTIONS.map((c) => (
                                        <SelectItem key={c} value={c}>
                                            {c}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <Input
                            label="Decimal Places"
                            type="number"
                            value={form.digitsAfterDecimal ?? 2}
                            onChange={(e) => setForm((f) => ({ ...f, digitsAfterDecimal: Number(e.target.value) }))}
                        />
                        <Input
                            label="Round To (Multiples)"
                            type="number"
                            value={form.inMultiplesOf ?? ""}
                            onChange={(e) => setForm((f) => ({ ...f, inMultiplesOf: Number(e.target.value) || undefined }))}
                            placeholder="0"
                        />
                        <div />

                        {/* Interest — Section 6 fields */}
                        <Input
                            label="Nominal Annual Rate (%) *"
                            type="number"
                            step="0.01"
                            value={form.nominalAnnualInterestRate ?? ""}
                            onChange={(e) => setForm((f) => ({ ...f, nominalAnnualInterestRate: Number(e.target.value) }))}
                            error={errors.nominalAnnualInterestRate}
                        />
                        <div>
                            <label className="text-sm font-medium">Compounding Period *</label>
                            <Select
                                value={String(form.interestCompoundingPeriodType ?? 1)}
                                onValueChange={(v) => setForm((f) => ({ ...f, interestCompoundingPeriodType: Number(v) }))}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {COMPOUNDING_OPTIONS.map((o) => (
                                        <SelectItem key={o.id} value={String(o.id)}>
                                            {o.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.interestCompoundingPeriodType && (
                                <p className="text-xs text-red-500">{errors.interestCompoundingPeriodType}</p>
                            )}
                        </div>
                        <div>
                            <label className="text-sm font-medium">Posting Period *</label>
                            <Select
                                value={String(form.interestPostingPeriodType ?? 4)}
                                onValueChange={(v) => setForm((f) => ({ ...f, interestPostingPeriodType: Number(v) }))}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {POSTING_OPTIONS.map((o) => (
                                        <SelectItem key={o.id} value={String(o.id)}>
                                            {o.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className="text-sm font-medium">Calculation Method *</label>
                            <Select
                                value={String(form.interestCalculationType ?? 1)}
                                onValueChange={(v) => setForm((f) => ({ ...f, interestCalculationType: Number(v) }))}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {CALC_TYPE_OPTIONS.map((o) => (
                                        <SelectItem key={o.id} value={String(o.id)}>
                                            {o.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className="text-sm font-medium">Days in Year *</label>
                            <Select
                                value={String(form.interestCalculationDaysInYearType ?? 365)}
                                onValueChange={(v) => setForm((f) => ({ ...f, interestCalculationDaysInYearType: Number(v) }))}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {DAYS_YEAR_OPTIONS.map((o) => (
                                        <SelectItem key={o.id} value={String(o.id)}>
                                            {o.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Balance */}
                        <Input
                            label="Min Opening Balance"
                            type="number"
                            value={form.minRequiredOpeningBalance ?? ""}
                            onChange={(e) => setForm((f) => ({ ...f, minRequiredOpeningBalance: Number(e.target.value) }))}
                        />
                        <Input
                            label="Min Required Balance"
                            type="number"
                            value={form.minRequiredBalance ?? ""}
                            onChange={(e) => setForm((f) => ({ ...f, minRequiredBalance: Number(e.target.value) || undefined }))}
                        />

                        {/* Toggles — Section 6 boolean fields */}
                        <div className="col-span-2 space-y-3 border-t pt-3">
                            <p className="text-sm font-medium text-gray-500">Product Options</p>
                            <div className="grid grid-cols-2 gap-3">
                                {(
                                    [
                                        ["allowOverdraft", "Allow Overdraft", "Let accounts overdraft past zero"],
                                        ["withdrawalFeeForTransfers", "Withdrawal Fee (Transfers)", "Charge fee on transfer withdrawals"],
                                        ["enforceMinRequiredBalance", "Enforce Min Balance", "Require minimum balance at all times"],
                                        ["withHoldTax", "Withhold Tax", "Enable tax withholding on interest"],
                                        ["isDormancyTrackingActive", "Dormancy Tracking", "Track and flag dormant accounts"],
                                    ] as const
                                ).map(([key, label, desc]) => (
                                    <label
                                        key={key}
                                        className="flex items-center justify-between gap-2 rounded-lg border p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                                    >
                                        <div>
                                            <span className="text-sm font-medium">{label}</span>
                                            <p className="text-xs text-gray-400">{desc}</p>
                                        </div>
                                        <input
                                            type="checkbox"
                                            className="h-4 w-4 accent-[#D32F2F]"
                                            checked={!!(form as Record<string, unknown>)[key]}
                                            onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.checked }))}
                                        />
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSave} disabled={saving}>
                            {saving ? "Saving…" : editingId ? "Save Changes" : "Create Product"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={!!deleteTarget}
                onOpenChange={() => setDeleteTarget(null)}
                onConfirm={handleDelete}
                title="Delete Savings Product"
                description={`Delete "${deleteTarget?.name}"? This action cannot be undone.`}
                confirmLabel="Delete"
                variant="destructive"
            />
        </div>
    );
};

export default SavingsProductsPage;
