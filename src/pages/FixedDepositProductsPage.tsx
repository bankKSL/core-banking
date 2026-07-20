import React, { useState, useMemo } from "react";
import { Plus, Search, Pencil, AlertTriangle, Calendar } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, type ColumnDef } from "@/components/shared/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { createFixedDepositProduct, fetchFixedDepositProducts } from "@/features/deposits";
import { useFixedDepositProducts } from "@/features/deposits/hooks/useFixedDepositProducts";
import { DEPOSIT_PERIOD_FREQUENCIES, PRE_CLOSURE_PENALTY_TYPES, ACCOUNTING_RULES } from "@/features/deposits";
import type { FixedDepositProduct, FixedDepositProductCreateRequest } from "@/features/deposits";

const COMPOUNDING_OPTS = [
    { id: 1, label: "Daily" },
    { id: 4, label: "Monthly" },
    { id: 5, label: "Quarterly" },
    { id: 6, label: "Semi-Annual" },
    { id: 7, label: "Annual" },
];
const POSTING_OPTS = [
    { id: 1, label: "Monthly" },
    { id: 4, label: "Quarterly" },
    { id: 5, label: "Semi-Annual" },
    { id: 7, label: "Annual" },
];
const CALC_OPTS = [
    { id: 1, label: "Daily Balance" },
    { id: 2, label: "Avg Daily Balance" },
];
const DAYS_YEAR_OPTS = [
    { id: 360, label: "360" },
    { id: 364, label: "364" },
    { id: 365, label: "365" },
];
const CHART_PERIODS = [
    { id: 0, label: "Days" },
    { id: 2, label: "Months" },
    { id: 3, label: "Years" },
];

const formatCurrency = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(n);

const CURRENCIES = ["USD", "EUR", "GBP", "INR", "JPY", "AUD"];

const FixedDepositProductsPage: React.FC = () => {
    const { data: products = [], isLoading, isError, error, refetch } = useFixedDepositProducts();
    const [search, setSearch] = useState("");
    const [dialogOpen, setDialogOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState<Partial<FixedDepositProductCreateRequest>>({
        name: "",
        shortName: "",
        description: "",
        currencyCode: "USD",
        digitsAfterDecimal: 2,
        inMultiplesOf: 0,
        interestCompoundingPeriodType: 1,
        interestPostingPeriodType: 4,
        interestCalculationType: 1,
        interestCalculationDaysInYearType: 365,
        accountingRule: 1,
        minDepositTerm: 6,
        minDepositTermTypeId: 2,
        depositAmount: 1000,
        locale: "en",
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [slabs, setSlabs] = useState([{ description: "", periodType: 2, fromPeriod: 6, toPeriod: 6, annualInterestRate: 5 }]);

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return products.filter((p) => p.name.toLowerCase().includes(q) || (p.description ?? "").toLowerCase().includes(q));
    }, [products, search]);

    const validate = (): boolean => {
        const e: Record<string, string> = {};
        if (!form.name?.trim()) e.name = "Required";
        if (!form.shortName?.trim()) e.shortName = "Required";
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSave = async () => {
        if (!validate()) return;
        setSaving(true);
        try {
            await createFixedDepositProduct({
                ...(form as FixedDepositProductCreateRequest),
                charts: [
                    {
                        fromDate: new Date().toISOString().split("T")[0],
                        locale: "en",
                        dateFormat: "dd MMMM yyyy",
                        chartSlabs: slabs
                            .filter((s) => s.description && s.annualInterestRate > 0)
                            .map((s) => ({ ...s, fromDate: undefined as any })),
                    },
                ],
            });
            setDialogOpen(false);
            refetch();
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    const columns: ColumnDef<FixedDepositProduct>[] = [
        { key: "name", header: "Name", cell: (r) => <span className="font-semibold">{r.name}</span> },
        { key: "shortName", header: "Code", cell: (r) => <code className="text-xs">{r.shortName ?? "—"}</code> },
        { key: "currency", header: "Currency", cell: (r) => <code className="text-xs">{r.currency.code}</code> },
        {
            key: "minDepositTerm",
            header: "Min Term",
            cell: (r) => `${r.minDepositTerm} ${r.minDepositTermType?.description?.toLowerCase() ?? "mo"}`,
        },
        {
            key: "preClosurePenalApplicable",
            header: "Penalty?",
            cell: (r) => (
                <Badge variant={r.preClosurePenalApplicable ? "warning" : "default"} size="sm">
                    {r.preClosurePenalApplicable ? "Yes" : "No"}
                </Badge>
            ),
        },
        {
            key: "activeChart",
            header: "Rate",
            cell: (r) => (r.activeChart?.chartSlabs?.[0] ? `${r.activeChart.chartSlabs[0].annualInterestRate}%` : "—"),
        },
    ];

    if (isError)
        return (
            <div className="p-8 text-center text-red-600">
                Failed to load FD products: {String(error)}{" "}
                <Button variant="outline" className="ml-4" onClick={() => refetch()}>
                    Retry
                </Button>
            </div>
        );

    return (
        <div className="space-y-6">
            <PageHeader
                title="Fixed Deposit Products"
                description="Section 11: Manage FD product configurations with interest rate slabs"
                actions={
                    <Button
                        onClick={() => {
                            setForm({
                                name: "",
                                shortName: "",
                                description: "",
                                currencyCode: "USD",
                                digitsAfterDecimal: 2,
                                inMultiplesOf: 0,
                                interestCompoundingPeriodType: 1,
                                interestPostingPeriodType: 4,
                                interestCalculationType: 1,
                                interestCalculationDaysInYearType: 365,
                                accountingRule: 1,
                                minDepositTerm: 6,
                                minDepositTermTypeId: 2,
                                depositAmount: 1000,
                                locale: "en",
                            });
                            setSlabs([{ description: "", periodType: 2, fromPeriod: 6, toPeriod: 6, annualInterestRate: 5 }]);
                            setDialogOpen(true);
                        }}
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        New FD Product
                    </Button>
                }
            />
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>
                        {products.length} Product{products.length !== 1 && "s"}
                    </CardTitle>
                    <div className="relative w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
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
                        <DataTable columns={columns} data={filtered} emptyState={{ message: "No FD products found" }} />
                    )}
                </CardContent>
            </Card>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Create Fixed Deposit Product</DialogTitle>
                        <DialogDescription>Section 11.1: Configure product with interest rate slabs.</DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-4 py-4">
                        <Input
                            label="Name *"
                            value={form.name ?? ""}
                            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                            error={errors.name}
                        />
                        <Input
                            label="Short Code *"
                            value={form.shortName ?? ""}
                            onChange={(e) => setForm((f) => ({ ...f, shortName: e.target.value }))}
                            error={errors.shortName}
                        />
                        <div className="col-span-2">
                            <Textarea
                                label="Description"
                                value={form.description ?? ""}
                                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Currency</label>
                            <Select value={form.currencyCode ?? "USD"} onValueChange={(v) => setForm((f) => ({ ...f, currencyCode: v }))}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {CURRENCIES.map((c) => (
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
                        <div>
                            <label className="text-sm font-medium">Compounding *</label>
                            <Select
                                value={String(form.interestCompoundingPeriodType ?? 1)}
                                onValueChange={(v) => setForm((f) => ({ ...f, interestCompoundingPeriodType: Number(v) }))}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {COMPOUNDING_OPTS.map((o) => (
                                        <SelectItem key={o.id} value={String(o.id)}>
                                            {o.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className="text-sm font-medium">Posting *</label>
                            <Select
                                value={String(form.interestPostingPeriodType ?? 4)}
                                onValueChange={(v) => setForm((f) => ({ ...f, interestPostingPeriodType: Number(v) }))}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {POSTING_OPTS.map((o) => (
                                        <SelectItem key={o.id} value={String(o.id)}>
                                            {o.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className="text-sm font-medium">Calculation *</label>
                            <Select
                                value={String(form.interestCalculationType ?? 1)}
                                onValueChange={(v) => setForm((f) => ({ ...f, interestCalculationType: Number(v) }))}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {CALC_OPTS.map((o) => (
                                        <SelectItem key={o.id} value={String(o.id)}>
                                            {o.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className="text-sm font-medium">Days/Year *</label>
                            <Select
                                value={String(form.interestCalculationDaysInYearType ?? 365)}
                                onValueChange={(v) => setForm((f) => ({ ...f, interestCalculationDaysInYearType: Number(v) }))}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {DAYS_YEAR_OPTS.map((o) => (
                                        <SelectItem key={o.id} value={String(o.id)}>
                                            {o.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className="text-sm font-medium">Accounting Rule *</label>
                            <Select
                                value={String(form.accountingRule ?? 1)}
                                onValueChange={(v) => setForm((f) => ({ ...f, accountingRule: Number(v) }))}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {ACCOUNTING_RULES.map((o) => (
                                        <SelectItem key={o.id} value={String(o.id)}>
                                            {o.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div />
                        <Input
                            label="Deposit Amount *"
                            type="number"
                            value={form.depositAmount ?? ""}
                            onChange={(e) => setForm((f) => ({ ...f, depositAmount: Number(e.target.value) }))}
                        />
                        <Input
                            label="Min Deposit Term *"
                            type="number"
                            value={form.minDepositTerm ?? ""}
                            onChange={(e) => setForm((f) => ({ ...f, minDepositTerm: Number(e.target.value) }))}
                        />
                        <div>
                            <label className="text-sm font-medium">Min Term Type *</label>
                            <Select
                                value={String(form.minDepositTermTypeId ?? 2)}
                                onValueChange={(v) => setForm((f) => ({ ...f, minDepositTermTypeId: Number(v) }))}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {DEPOSIT_PERIOD_FREQUENCIES.map((o) => (
                                        <SelectItem key={o.id} value={String(o.id)}>
                                            {o.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <Input
                            label="Max Deposit Term"
                            type="number"
                            value={form.maxDepositTerm ?? ""}
                            onChange={(e) => setForm((f) => ({ ...f, maxDepositTerm: Number(e.target.value) || undefined }))}
                        />
                        <div>
                            <label className="text-sm font-medium">Max Term Type</label>
                            <Select
                                value={String(form.maxDepositTermTypeId ?? "")}
                                onValueChange={(v) => setForm((f) => ({ ...f, maxDepositTermTypeId: v ? Number(v) : undefined }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="—" />
                                </SelectTrigger>
                                <SelectContent>
                                    {DEPOSIT_PERIOD_FREQUENCIES.map((o) => (
                                        <SelectItem key={o.id} value={String(o.id)}>
                                            {o.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Section 11.6: Pre-closure penalty */}
                        <div className="col-span-2 border-t pt-3">
                            <p className="text-sm font-medium mb-2 text-gray-500">Pre-Closure Penalty (Section 11.6)</p>
                            <label className="flex items-center gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    className="accent-[#D32F2F]"
                                    checked={!!form.preClosurePenalApplicable}
                                    onChange={(e) => setForm((f) => ({ ...f, preClosurePenalApplicable: e.target.checked }))}
                                />{" "}
                                Penalty applicable
                            </label>
                            {form.preClosurePenalApplicable && (
                                <div className="grid grid-cols-2 gap-2 mt-2">
                                    <Input
                                        label="Penalty Rate (%)"
                                        type="number"
                                        step="0.01"
                                        value={form.preClosurePenalInterest ?? ""}
                                        onChange={(e) => setForm((f) => ({ ...f, preClosurePenalInterest: Number(e.target.value) }))}
                                    />
                                    <div>
                                        <label className="text-sm font-medium">Applies To</label>
                                        <Select
                                            value={String(form.preClosurePenalInterestOnTypeId ?? 1)}
                                            onValueChange={(v) => setForm((f) => ({ ...f, preClosurePenalInterestOnTypeId: Number(v) }))}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {PRE_CLOSURE_PENALTY_TYPES.map((o) => (
                                                    <SelectItem key={o.id} value={String(o.id)}>
                                                        {o.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Rate Slabs */}
                        <div className="col-span-2 border-t pt-3">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-sm font-medium text-gray-500">Interest Rate Slabs</p>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                        setSlabs([
                                            ...slabs,
                                            { description: "", periodType: 2, fromPeriod: 1, toPeriod: 12, annualInterestRate: 5 },
                                        ])
                                    }
                                >
                                    + Add Slab
                                </Button>
                            </div>
                            {slabs.map((s, i) => (
                                <div key={i} className="grid grid-cols-5 gap-2 mb-2 p-2 border rounded">
                                    <Input
                                        placeholder="Label"
                                        value={s.description}
                                        onChange={(e) => {
                                            const ns = [...slabs];
                                            ns[i] = { ...ns[i], description: e.target.value };
                                            setSlabs(ns);
                                        }}
                                    />
                                    <div>
                                        <Select
                                            value={String(s.periodType)}
                                            onValueChange={(v) => {
                                                const ns = [...slabs];
                                                ns[i] = { ...ns[i], periodType: Number(v) };
                                                setSlabs(ns);
                                            }}
                                        >
                                            <SelectTrigger className="h-9 text-xs">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {CHART_PERIODS.map((o) => (
                                                    <SelectItem key={o.id} value={String(o.id)}>
                                                        {o.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <Input
                                        placeholder="From"
                                        type="number"
                                        value={s.fromPeriod || ""}
                                        onChange={(e) => {
                                            const ns = [...slabs];
                                            ns[i] = { ...ns[i], fromPeriod: Number(e.target.value) };
                                            setSlabs(ns);
                                        }}
                                    />
                                    <Input
                                        placeholder="To"
                                        type="number"
                                        value={s.toPeriod || ""}
                                        onChange={(e) => {
                                            const ns = [...slabs];
                                            ns[i] = { ...ns[i], toPeriod: Number(e.target.value) };
                                            setSlabs(ns);
                                        }}
                                    />
                                    <div className="flex gap-1">
                                        <Input
                                            placeholder="Rate%"
                                            type="number"
                                            step="0.01"
                                            value={s.annualInterestRate || ""}
                                            onChange={(e) => {
                                                const ns = [...slabs];
                                                ns[i] = { ...ns[i], annualInterestRate: Number(e.target.value) };
                                                setSlabs(ns);
                                            }}
                                        />
                                        {slabs.length > 1 && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-9 w-9 text-red-500"
                                                onClick={() => setSlabs(slabs.filter((_, j) => j !== i))}
                                            >
                                                ×
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSave} disabled={saving}>
                            {saving ? "Creating…" : "Create FD Product"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default FixedDepositProductsPage;
