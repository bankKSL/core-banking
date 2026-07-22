import React, { useState, useMemo } from "react";
import { Plus, Search, Pencil, Trash2, ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, type ColumnDef } from "@/components/shared/DataTable";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { useLoanProducts, createLoanProduct, updateLoanProduct, useFunds } from "@/features/loans";
import type { LoanProduct, LoanProductCreateRequest } from "@/features/loans";

/** Extract string value from Fineract enum objects {id,code,value} or primitive */
function enumVal(v: any, fallback = ""): string {
    if (v == null) return fallback;
    if (typeof v === "object") return v.code ?? v.value ?? String(v.id) ?? fallback;
    return String(v);
}

/** Extract number id from Fineract enum objects {id,code,value} or primitive */
function enumId(v: any, fallback = 0): number {
    if (v == null) return fallback;
    if (typeof v === "object") return v.id ?? fallback;
    return Number(v);
}

const AMORTIZATION_OPTIONS = [
    { id: 1, label: "Equal Installments" },
    { id: 0, label: "Equal Principal" },
];

const REPAYMENT_FREQ_OPTIONS = [
    { id: 0, label: "Days" },
    { id: 1, label: "Weeks" },
    { id: 2, label: "Months" },
];

const CURRENCY_OPTIONS = ["USD", "EUR", "INR"];

const STRATEGY_OPTIONS = [
    { id: "mifos-standard-strategy", label: "Mifos Standard Strategy" },
    { id: "heavensfamily-strategy", label: "Heavensfamily Strategy" },
    { id: "early-repayment-strategy", label: "Early Repayment Strategy" },
    { id: "advance-payment-allocation-strategy", label: "Advance Payment Allocation Strategy" },
    { id: "principal-interest-penalty-fees-order-strategy", label: "P-I-Penalty-Fees Order" },
    { id: "interest-principal-penalty-fees-order-strategy", label: "I-P-Penalty-Fees Order" },
    { id: "penalties-fees-interest-principal-order-strategy", label: "Penalties-Fees-I-P Order" },
];

const LoanProductsPage: React.FC = () => {
    const navigate = useNavigate();
    const { data: products = [], isLoading, refetch } = useLoanProducts();
    const { data: funds = [] } = useFunds();
    const [search, setSearch] = useState("");
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<LoanProduct | null>(null);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState<Record<string, any>>({});
    const [errors, setErrors] = useState<Record<string, string>>({});

    const isProgressive = enumVal(form.loanScheduleType) === "PROGRESSIVE";

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return products.filter((p) => p.name.toLowerCase().includes(q) || (p.description ?? "").toLowerCase().includes(q));
    }, [products, search]);

    const openCreate = () => {
        setEditingId(null);
        setForm({
            name: "",
            description: "",
            externalId: "",
            shortName: "",
            fundId: undefined,
            currencyCode: "USD",
            principal: 0,
            numberOfRepayments: 12,
            repaymentEvery: 1,
            repaymentFrequencyType: 2,
            amortizationType: 1,
            interestCalculationPeriodType: 0,
            transactionProcessingStrategyCode: "mifos-standard-strategy",
            loanScheduleType: "CUMULATIVE",
            daysInYearType: 1,
            daysInMonthType: 1,
            isInterestRecalculationEnabled: false,
            interestRatePerPeriod: 0,
            interestType: 0,
            interestRateFrequencyType: 3,
            digitsAfterDecimal: 2,
            inMultiplesOf: 0,
            accountingRule: 1,
            locale: "en",
            dateFormat: "yyyy-MM-dd",
        });
        setErrors({});
        setDialogOpen(true);
    };

    const openEdit = (p: any) => {
        setEditingId(p.id);
        setForm({
            name: p.name,
            shortName: p.shortName,
            description: p.description,
            externalId: p.externalId,
            fundId: p.fundId,
            currencyCode: p.currency?.code ?? "USD",
            principal: p.principal,
            numberOfRepayments: p.numberOfRepayments,
            repaymentEvery: p.repaymentEvery,
            repaymentFrequencyType: enumId(p.repaymentFrequencyType, 2),
            amortizationType: enumId(p.amortizationType, 1),
            interestCalculationPeriodType: enumId(p.interestCalculationPeriodType, 0),
            transactionProcessingStrategyCode: p.transactionProcessingStrategyCode ?? "mifos-standard-strategy",
            loanScheduleType: enumVal(p.loanScheduleType, "CUMULATIVE"),
            daysInYearType: enumId(p.daysInYearType, 1),
            daysInMonthType: enumId(p.daysInMonthType, 1),
            isInterestRecalculationEnabled: !!p.isInterestRecalculationEnabled,
            interestRatePerPeriod: p.interestRatePerPeriod,
            interestType: enumId(p.interestType, 0),
            interestRateFrequencyType: enumId(p.interestRateFrequencyType, 3),
            digitsAfterDecimal: p.currency?.decimalPlaces ?? 2,
            inMultiplesOf: p.currency?.inMultiplesOf ?? 0,
            accountingRule: enumId(p.accountingRule, 1),
            locale: "en",
            dateFormat: "yyyy-MM-dd",
        });
        setErrors({});
        setDialogOpen(true);
    };

    const validate = (): boolean => {
        const e: Record<string, string> = {};
        if (!form.name?.trim()) e.name = "Name is required";
        if (!form.currencyCode) e.currencyCode = "Currency is required";
        if (!form.principal || form.principal <= 0) e.principal = "Principal must be > 0";
        if (!form.numberOfRepayments || form.numberOfRepayments <= 0) e.numberOfRepayments = "Required";
        if (!form.repaymentEvery || form.repaymentEvery <= 0) e.repaymentEvery = "Required";
        if (form.interestRatePerPeriod == null || form.interestRatePerPeriod < 0) e.interestRatePerPeriod = "Required";
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSave = async () => {
        if (!validate()) return;
        setSaving(true);
        try {
            const payload: Record<string, any> = { ...form };
            Object.keys(payload).forEach((k) => {
                if (payload[k] === undefined) delete payload[k];
            });
            // Hidden defaults per spec
            payload.locale = "en";
            payload.accountingRule = 1;
            payload.inMultiplesOf = 0;
            payload.dateFormat = "yyyy-MM-dd";

            if (editingId) {
                await updateLoanProduct(editingId, payload as any);
            } else {
                await createLoanProduct(payload as any);
            }
            setDialogOpen(false);
            refetch();
        } catch (err) {
            console.error("Failed to save product", err);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = () => {
        setDeleteTarget(null);
    };

    const setField = (key: string, value: any) => setForm((f) => ({ ...f, [key]: value }));

    const columns: ColumnDef<any>[] = [
        { key: "name", header: "Name", accessorFn: (r) => <span className="font-medium">{r.name}</span> },
        { key: "shortName", header: "Short Name", accessorFn: (r) => <span className="text-sm text-gray-500">{r.shortName ?? "—"}</span> },
        { key: "currency", header: "Currency", accessorFn: (r) => <span>{r.currency?.code ?? "—"}</span> },
        { key: "principal", header: "Principal", accessorFn: (r) => <span className="font-mono">{r.principal?.toLocaleString()}</span> },
        { key: "rate", header: "Rate", accessorFn: (r) => <span>{r.interestRatePerPeriod}%</span> },
        {
            key: "repayments",
            header: "Repayments",
            accessorFn: (r) => (
                <span>
                    {r.numberOfRepayments} × {r.repaymentEvery}
                </span>
            ),
        },
        {
            key: "scheduleType",
            header: "Schedule",
            accessorFn: (r) => {
                const st = enumVal(r.loanScheduleType, "CUMULATIVE");
                return <Badge>{st}</Badge>;
            },
        },
        {
            key: "actions",
            header: "",
            cell: (r) => (
                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="sm" onClick={() => navigate(`/lending/products/view/${r.id}`)}>
                        <ExternalLink className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => openEdit(r)}>
                        <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(r)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <PageHeader
                title="Loan Products"
                description="Manage loan product definitions"
                actions={
                    <Button onClick={openCreate} className="bg-[#D32F2F] hover:bg-red-700">
                        <Plus className="mr-2 h-4 w-4" />
                        Create Product
                    </Button>
                }
            />

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Search className="h-4 w-4 text-gray-400" />
                        All Products
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="mb-4">
                        <Input placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
                    </div>
                    {isLoading ? (
                        <div className="space-y-4">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <Skeleton key={i} className="h-12 w-full" />
                            ))}
                        </div>
                    ) : (
                        <DataTable columns={columns} data={filtered} emptyState={{ message: "No products found." }} minWidth={900} />
                    )}
                </CardContent>
            </Card>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>{editingId ? "Edit Loan Product" : "Create Loan Product"}</DialogTitle>
                        <DialogDescription>Configure the loan product terms and settings.</DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-4 py-4 max-h-[65vh] overflow-y-auto">
                        {/* Row 1: Name | Short Name */}
                        <div className="space-y-1.5">
                            <label className="block text-sm font-medium">Name *</label>
                            <Input value={form.name ?? ""} onChange={(e) => setField("name", e.target.value)} error={errors.name} />
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-sm font-medium">Short Name</label>
                            <Input value={form.shortName ?? ""} onChange={(e) => setField("shortName", e.target.value)} />
                        </div>
                        {/* Row 2 FULL: Description */}
                        <div className="space-y-1.5 col-span-2">
                            <label className="block text-sm font-medium">Description</label>
                            <Textarea placeholder="Brief product description" rows={3} value={form.description ?? ""} onChange={(e) => setField("description", e.target.value)} />
                        </div>
                        {/* Row 3 FULL: External ID */}
                        <div className="space-y-1.5 col-span-2">
                            <label className="block text-sm font-medium">External ID</label>
                            <Input value={form.externalId ?? ""} onChange={(e) => setField("externalId", e.target.value)} />
                        </div>
                        {/* Row 4: Fund | Currency Code */}
                        <div className="space-y-1.5">
                            <label className="block text-sm font-medium">Fund</label>
                            <Select value={form.fundId ? String(form.fundId) : ""} onValueChange={(v) => setField("fundId", Number(v))}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select fund" />
                                </SelectTrigger>
                                <SelectContent>
                                    {funds.map((f: any) => (
                                        <SelectItem key={f.id} value={String(f.id)}>
                                            {f.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-sm font-medium">Currency Code *</label>
                            <Select value={form.currencyCode ?? "USD"} onValueChange={(v) => setField("currencyCode", v)}>
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
                            {errors.currencyCode && <p className="text-xs text-red-500">{errors.currencyCode}</p>}
                        </div>
                        {/* Row 5: Principal | # Repayments */}
                        <div className="space-y-1.5">
                            <label className="block text-sm font-medium">Principal *</label>
                            <Input type="number" value={form.principal ?? ""} onChange={(e) => setField("principal", Number(e.target.value))} error={errors.principal} />
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-sm font-medium"># Repayments *</label>
                            <Input
                                type="number"
                                value={form.numberOfRepayments ?? ""}
                                onChange={(e) => setField("numberOfRepayments", Number(e.target.value))}
                                error={errors.numberOfRepayments}
                            />
                        </div>
                        {/* Row 6: Repayment Every | Repayment Frequency Type */}
                        <div className="space-y-1.5">
                            <label className="block text-sm font-medium">Repayment Every</label>
                            <Input
                                type="number"
                                value={form.repaymentEvery ?? ""}
                                onChange={(e) => setField("repaymentEvery", Number(e.target.value))}
                                error={errors.repaymentEvery}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-sm font-medium">Repayment Frequency Type *</label>
                            <Select value={String(form.repaymentFrequencyType ?? 2)} onValueChange={(v) => setField("repaymentFrequencyType", Number(v))}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {REPAYMENT_FREQ_OPTIONS.map((o) => (
                                        <SelectItem key={o.id} value={String(o.id)}>
                                            {o.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        {/* Row 7: Interest Rate | Amortization Type */}
                        <div className="space-y-1.5">
                            <label className="block text-sm font-medium">Interest Rate (% per period)</label>
                            <Input
                                type="number"
                                step="0.01"
                                value={form.interestRatePerPeriod ?? ""}
                                onChange={(e) => setField("interestRatePerPeriod", Number(e.target.value))}
                                error={errors.interestRatePerPeriod}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-sm font-medium">Amortization Type *</label>
                            <Select value={String(form.amortizationType ?? 1)} onValueChange={(v) => setField("amortizationType", Number(v))}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {AMORTIZATION_OPTIONS.map((o) => (
                                        <SelectItem key={o.id} value={String(o.id)}>
                                            {o.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        {/* Row 8: Interest Type | Interest Calc Period Type */}
                        <div className="space-y-1.5">
                            <label className="block text-sm font-medium">Interest Type</label>
                            <Select value={String(form.interestType ?? 0)} onValueChange={(v) => setField("interestType", Number(v))}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="0">Declining Balance</SelectItem>
                                    <SelectItem value="1">Flat</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-sm font-medium">Interest Calc Period Type *</label>
                            <Select value={String(form.interestCalculationPeriodType ?? 0)} onValueChange={(v) => setField("interestCalculationPeriodType", Number(v))}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="0">Daily</SelectItem>
                                    <SelectItem value="1">Same as Repayment</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {/* Row 9: Loan Schedule Type | Transaction Processing Strategy Code */}
                        <div className="space-y-1.5">
                            <label className="block text-sm font-medium">Loan Schedule Type</label>
                            <Select
                                value={enumVal(form.loanScheduleType, "CUMULATIVE")}
                                onValueChange={(v) => {
                                    setField("loanScheduleType", v);
                                    if (v === "PROGRESSIVE") setField("transactionProcessingStrategyCode", "");
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="CUMULATIVE">Cumulative</SelectItem>
                                    <SelectItem value="PROGRESSIVE">Progressive</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-sm font-medium">Transaction Processing Strategy Code *</label>
                            <Select
                                value={form.transactionProcessingStrategyCode ?? ""}
                                onValueChange={(v) => setField("transactionProcessingStrategyCode", v)}
                                disabled={isProgressive}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select strategy" />
                                </SelectTrigger>
                                <SelectContent>
                                    {(isProgressive
                                        ? STRATEGY_OPTIONS.filter((s) => s.id === "advance-payment-allocation-strategy")
                                        : STRATEGY_OPTIONS.filter((s) => s.id !== "advance-payment-allocation-strategy")
                                    ).map((o) => (
                                        <SelectItem key={o.id} value={o.id}>
                                            {o.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.transactionProcessingStrategyCode && <p className="text-xs text-red-500">{errors.transactionProcessingStrategyCode}</p>}
                        </div>
                        {/* Row 10: Days In Year Type */}
                        <div className="space-y-1.5">
                            <label className="block text-sm font-medium">Days In Year Type</label>
                            <Select value={String(form.daysInYearType ?? 1)} onValueChange={(v) => setField("daysInYearType", Number(v))}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1">Actual (365/366)</SelectItem>
                                    <SelectItem value="360">360 Days</SelectItem>
                                    <SelectItem value="365">365 Days</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div />
                        {/* Row 11 FULL: Interest Recalculation Enabled */}
                        <div
                            className="col-span-2 flex items-center gap-2 pt-2 cursor-pointer"
                            onClick={() => setField("isInterestRecalculationEnabled", !form.isInterestRecalculationEnabled)}
                        >
                            <Checkbox
                                id="isInterestRecalculationEnabled"
                                checked={!!form.isInterestRecalculationEnabled}
                                onCheckedChange={(v) => setField("isInterestRecalculationEnabled", v === true)}
                            />
                            <Label htmlFor="isInterestRecalculationEnabled" className="text-sm font-normal cursor-pointer">
                                Interest Recalculation Enabled
                            </Label>
                        </div>
                        {/* Row 12 Progressive only: Payment Credit Allocation Editor */}
                        {isProgressive && (
                            <div className="col-span-2 rounded-lg border border-dashed border-gray-300 p-4 text-sm text-gray-400 text-center">
                                Payment/Credit Allocation Editor — Custom child component (not yet implemented)
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSave} disabled={saving}>
                            {saving ? "Saving…" : editingId ? "Save Changes" : "Create"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={!!deleteTarget}
                onOpenChange={() => setDeleteTarget(null)}
                onConfirm={handleDelete}
                title="Delete Loan Product"
                description={`Delete "${deleteTarget?.name}"?`}
                confirmLabel="Delete"
                variant="destructive"
            />
        </div>
    );
};

export default LoanProductsPage;
