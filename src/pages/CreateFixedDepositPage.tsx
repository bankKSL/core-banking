import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Save, Wallet, ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { createFixedDepositAccount, DEPOSIT_PERIOD_FREQUENCIES } from "@/features/deposits";
import { useClients } from "@/features/clients";
import { useSavingsProducts } from "@/features/deposits";

const CreateFixedDepositPage: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const clientIdParam = searchParams.get("clientId");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [form, setForm] = useState({
        clientId: clientIdParam ? Number(clientIdParam) : 0,
        productId: 0,
        externalId: "",
        depositAmount: 0,
        depositPeriod: 12,
        depositPeriodFrequencyId: 2,
        submittedOnDate: new Date().toISOString().split("T")[0],
        nominalAnnualInterestRate: 0,
    });

    const { data: clientsData, isLoading: clientsLoading } = useClients({ limit: 100 });
    const { data: products = [], isLoading: productsLoading } = useSavingsProducts();
    const clients = clientsData?.pageItems ?? [];
    const isLoading = clientsLoading || productsLoading;

    const sortedClients = [...clients].sort((a, b) => {
        if (a.id === form.clientId) return -1;
        if (b.id === form.clientId) return 1;
        return 0;
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.clientId || !form.productId || form.depositAmount <= 0) return;
        setIsSubmitting(true);
        try {
            await createFixedDepositAccount({
                clientId: form.clientId,
                productId: form.productId,
                externalId: form.externalId || undefined,
                depositAmount: form.depositAmount,
                depositPeriod: form.depositPeriod,
                depositPeriodFrequencyId: form.depositPeriodFrequencyId,
                submittedOnDate: form.submittedOnDate,
                locale: "en",
                dateFormat: "dd MMMM yyyy",
            });
            navigate("/deposits/fixed");
        } catch (err) {
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const setField = (f: string, v: unknown) => setForm({ ...form, [f]: v });

    if (isLoading)
        return (
            <div className="max-w-2xl m-auto space-y-6 p-6">
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-96 w-full rounded-xl" />
            </div>
        );

    return (
        <div className="max-w-2xl m-auto space-y-6 p-6">
            <PageHeader
                title="New Fixed Deposit"
                description="Open a fixed deposit account (Section 10.2)"
                actions={
                    <Button variant="outline" onClick={() => navigate("/deposits/fixed")}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Cancel
                    </Button>
                }
            />
            <form onSubmit={handleSubmit} className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>
                            <Wallet className="inline mr-2 h-5 w-5" />
                            Client & Product
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 gap-4">
                        <div>
                            <Label>Client *</Label>
                            <Select
                                value={form.clientId ? String(form.clientId) : ""}
                                onValueChange={(v) => setField("clientId", Number(v))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select client" />
                                </SelectTrigger>
                                <SelectContent>
                                    {sortedClients.map((c) => (
                                        <SelectItem key={c.id} value={String(c.id)}>
                                            {c.displayName ?? `#${c.id}`}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <div className="mt-1">
                                <Button type="button" variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => window.open("/clients/new", "_blank")}>
                                    <ExternalLink className="mr-1 h-3 w-3" />Create New Client
                                </Button>
                            </div>
                        </div>
                        <div>
                            <Label>Savings Product *</Label>
                            <Select
                                value={form.productId ? String(form.productId) : ""}
                                onValueChange={(v) => setField("productId", Number(v))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select product" />
                                </SelectTrigger>
                                <SelectContent>
                                    {products.map((p) => (
                                        <SelectItem key={p.id} value={String(p.id)}>
                                            {p.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <div className="mt-1">
                                <Button type="button" variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => window.open("/deposits/fixed-products", "_blank")}>
                                    <ExternalLink className="mr-1 h-3 w-3" />Create New Product
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Deposit Details (Section 10.7)</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <Label htmlFor="externalId">External ID</Label>
                            <Input id="externalId" value={form.externalId} onChange={(e) => setField("externalId", e.target.value)} placeholder="Optional external reference" />
                        </div>
                        <div>
                            <Label>Deposit Amount *</Label>
                            <Input
                                type="number"
                                value={form.depositAmount || ""}
                                onChange={(e) => setField("depositAmount", Number(e.target.value))}
                            />
                        </div>
                        <div>
                            <Label>Period Length *</Label>
                            <Input
                                type="number"
                                value={form.depositPeriod || ""}
                                onChange={(e) => setField("depositPeriod", Number(e.target.value))}
                            />
                        </div>
                        <div>
                            <Label>Frequency (Section 10.7)</Label>
                            <Select
                                value={String(form.depositPeriodFrequencyId)}
                                onValueChange={(v) => setField("depositPeriodFrequencyId", Number(v))}
                            >
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
                        <div>
                            <Label>Interest Rate</Label>
                            <Input type="number" step="0.01" value={form.nominalAnnualInterestRate || ""} onChange={(e) => setField("nominalAnnualInterestRate", parseFloat(e.target.value) || 0)} placeholder="Inherited from product" />
                        </div>
                        <div>
                            <Label>Submitted Date</Label>
                            <Input type="date" value={form.submittedOnDate} onChange={(e) => setField("submittedOnDate", e.target.value)} />
                        </div>
                    </CardContent>
                </Card>
                <div className="flex justify-end gap-3">
                    <Button variant="outline" type="button" onClick={() => navigate("/deposits/fixed")}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                        <Save className="mr-2 h-4 w-4" />
                        {isSubmitting ? "Creating…" : "Create FD"}
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default CreateFixedDepositPage;
