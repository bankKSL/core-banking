import React, { useState, useMemo } from "react";
import { Plus, Search, Pencil, AlertTriangle } from "lucide-react";
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
import { useFixedDepositProducts, createFixedDepositProduct } from "@/features/deposits";
import type { FixedDepositProduct, FixedDepositProductCreateRequest } from "@/features/deposits";
import { currentDate } from "@/lib/utils";

const CURRENCIES = ["LAK", "THB", "CNY", "USD"];

const DEPOSIT_PERIOD_FREQUENCIES = [
    { id: 0, label: "Days" },
    { id: 1, label: "Weeks" },
    { id: 2, label: "Months" },
    { id: 3, label: "Years" },
];

const formatCurrency = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(n);

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
        depositAmount: 1000,
        minDepositTerm: 1,
        minDepositTermTypeId: 2,
        locale: "en",
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return products.filter((p) => p.name.toLowerCase().includes(q) || (p.description ?? "").toLowerCase().includes(q));
    }, [products, search]);

    const openCreate = () => {
        setForm({
            name: "",
            shortName: "",
            description: "",
            currencyCode: "USD",
            digitsAfterDecimal: 2,
            depositAmount: 1000,
            minDepositTerm: 1,
            minDepositTermTypeId: 2,
            locale: "en",
        });
        setErrors({});
        setDialogOpen(true);
    };

    const validate = (): boolean => {
        const e: Record<string, string> = {};
        if (!form.name?.trim()) e.name = "Product name is required";
        if (!form.shortName?.trim()) e.shortName = "Short name is required";
        if (!form.currencyCode) e.currencyCode = "Currency is required";
        if (form.digitsAfterDecimal == null || form.digitsAfterDecimal < 0) e.digitsAfterDecimal = "Valid decimal places required";
        if (!form.depositAmount || form.depositAmount <= 0) e.depositAmount = "Deposit amount is required";
        if (!form.minDepositTerm || form.minDepositTerm <= 0) e.minDepositTerm = "Min deposit term is required";
        if (!form.minDepositTermTypeId) e.minDepositTermTypeId = "Term type is required";
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSave = async () => {
        if (!validate()) return;
        setSaving(true);
        console.log(currentDate());

        try {
            await createFixedDepositProduct({
                name: form.name!,
                shortName: form.shortName!,
                description: form.description || undefined,
                currencyCode: form.currencyCode!,
                digitsAfterDecimal: form.digitsAfterDecimal!,
                inMultiplesOf: 0,
                interestCompoundingPeriodType: 1,
                interestPostingPeriodType: 4,
                interestCalculationType: 1,
                interestCalculationDaysInYearType: 365,
                accountingRule: 1,
                minDepositTerm: form.minDepositTerm!,
                minDepositTermTypeId: form.minDepositTermTypeId!,
                depositAmount: form.depositAmount!,
                locale: "en",
                charts: [
                    {
                        fromDate: currentDate(),
                        dateFormat: "yyyy-MM-dd",
                        locale: "en",
                        chartSlabs: [
                            {
                                description: "Default",
                                periodType: 2,
                                fromPeriod: 1,
                                toPeriod: 1,
                                annualInterestRate: 5,
                            },
                        ],
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
        { key: "currency.code", header: "Currency", cell: (r) => <code className="text-xs">{r.currency.code}</code> },
        {
            key: "nominalAnnualInterestRate",
            header: "Rate",
            cell: (r) => <span className="font-mono text-sm">{r.activeChart?.chartSlabs?.[0]?.annualInterestRate ?? "—"}%</span>,
        },
        {
            key: "minDepositTerm",
            header: "Min Term",
            cell: (r) => `${r.minDepositTerm} ${r.minDepositTermType?.description?.toLowerCase() ?? "mo"}`,
        },
        {
            key: "actions",
            header: "",
            cell: (r) => (
                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="sm" className="h-8 w-8" onClick={() => window.open(`/deposits/fixed-products/${r.id}`, "_blank")}>
                        <Pencil className="h-4 w-4" />
                    </Button>
                </div>
            ),
        },
    ];

    if (isError) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <AlertTriangle className="mx-auto h-8 w-8 text-red-500 mb-2" />
                    <p className="text-red-600">Failed to load: {String(error)}</p>
                    <Button variant="outline" className="mt-2" onClick={() => refetch()}>
                        Retry
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <PageHeader
                title="Fixed Deposit Products"
                description="Manage fixed deposit products available in the system"
                actions={
                    <Button onClick={openCreate}>
                        <Plus className="mr-2 h-4 w-4" />
                        Create FD Product
                    </Button>
                }
            />

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Products</CardTitle>
                    <div className="relative w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
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
                        <DataTable columns={columns} data={filtered} emptyState={{ message: "No fixed deposit products found" }} />
                    )}
                </CardContent>
            </Card>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle>Create Fixed Deposit Product</DialogTitle>
                        <DialogDescription>Fields marked with * are required.</DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-4 py-4">
                        {/* Row 1: Name (full width) */}
                        <div className="col-span-2">
                            <Input label="Product Name *" value={form.name ?? ""} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} error={errors.name} />
                        </div>

                        {/* Row 2: Short Name + Currency */}
                        <Input
                            label="Short Name *"
                            value={form.shortName ?? ""}
                            onChange={(e) => setForm((f) => ({ ...f, shortName: e.target.value }))}
                            error={errors.shortName}
                            placeholder="No spaces"
                        />
                        <div>
                            <label className="text-sm font-medium">Currency *</label>
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

                        {/* Row 3: Description (full width) */}
                        <div className="col-span-2">
                            <Textarea
                                label="Description"
                                placeholder="Brief product description"
                                value={form.description ?? ""}
                                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                            />
                        </div>

                        {/* Row 4: Decimal Places + Deposit Amount */}
                        <Input
                            label="Decimal Places *"
                            type="number"
                            value={form.digitsAfterDecimal ?? 2}
                            onChange={(e) => setForm((f) => ({ ...f, digitsAfterDecimal: Number(e.target.value) }))}
                        />
                        <Input
                            label="Deposit Amount *"
                            type="number"
                            value={form.depositAmount ?? ""}
                            onChange={(e) => setForm((f) => ({ ...f, depositAmount: Number(e.target.value) }))}
                            error={errors.depositAmount}
                        />

                        {/* Row 5: Min Deposit Term + Min Term Type */}
                        <Input
                            label="Min Deposit Term *"
                            type="number"
                            value={form.minDepositTerm ?? ""}
                            onChange={(e) => setForm((f) => ({ ...f, minDepositTerm: Number(e.target.value) }))}
                            error={errors.minDepositTerm}
                        />
                        <div>
                            <label className="text-sm font-medium">Min Term Type *</label>
                            <Select value={String(form.minDepositTermTypeId ?? 2)} onValueChange={(v) => setForm((f) => ({ ...f, minDepositTermTypeId: Number(v) }))}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {DEPOSIT_PERIOD_FREQUENCIES.map((f) => (
                                        <SelectItem key={f.id} value={String(f.id)}>
                                            {f.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
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
