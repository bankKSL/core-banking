import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save, PiggyBank } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCreateSavingsAccount, useSavingsTemplate, useSavingsProducts } from "@/features/deposits";
import { useClients } from "@/features/clients";
import { Skeleton } from "@/components/ui/skeleton";

const CreateDepositAccountPage: React.FC = () => {
    const navigate = useNavigate();
    const createAccount = useCreateSavingsAccount();

    const [form, setForm] = useState({
        clientId: 0,
        productId: 0,
        submittedOnDate: new Date().toISOString().split("T")[0],
        nominalAnnualInterestRate: 0,
        minRequiredOpeningBalance: 0,
        dateFormat: "yyyy-MM-dd",
        locale: "en",
    });

    const { data: products = [], isLoading: productsLoading } = useSavingsProducts();
    const { data: clientsData, isLoading: clientsLoading } = useClients({ limit: 100 });

    const clients = clientsData?.pageItems ?? [];

    const isLoading = productsLoading || clientsLoading;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.clientId || !form.productId) return;
        try {
            await createAccount.mutateAsync({
                clientId: form.clientId,
                productId: form.productId,
                submittedOnDate: form.submittedOnDate,
                nominalAnnualInterestRate: form.nominalAnnualInterestRate || undefined,
                minRequiredOpeningBalance: form.minRequiredOpeningBalance || undefined,
                locale: "en",
                dateFormat: "yyyy-MM-dd",
            });
            navigate("/deposits/accounts");
        } catch (err) {
            console.error("Failed to create savings account:", err);
        }
    };

    const setField = (field: string, value: unknown) => setForm({ ...form, [field]: value });

    if (isLoading) {
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
                title="New Deposit Account"
                description="Open a new savings account for a client"
                actions={
                    <div className="flex items-center gap-3">
                        <Button variant="outline" onClick={() => navigate("/deposits/accounts")}><ArrowLeft className="mr-2 h-4 w-4" /> Cancel</Button>
                    </div>
                }
            />

            <form onSubmit={handleSubmit} className="space-y-6">
                <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2"><PiggyBank className="h-5 w-5" /> Customer Information</CardTitle></CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <Label htmlFor="clientId">Client *</Label>
                                <Select value={form.clientId ? String(form.clientId) : ""} onValueChange={(v) => setField("clientId", Number(v))}>
                                    <SelectTrigger><SelectValue placeholder="Select a client" /></SelectTrigger>
                                    <SelectContent>
                                        {clients.map((c) => (<SelectItem key={c.id} value={String(c.id)}>{c.displayName ?? `Client #${c.id}`}</SelectItem>))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle>Account Details</CardTitle></CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <Label htmlFor="productId">Savings Product *</Label>
                                <Select value={form.productId ? String(form.productId) : ""} onValueChange={(v) => setField("productId", Number(v))}>
                                    <SelectTrigger><SelectValue placeholder="Select a savings product" /></SelectTrigger>
                                    <SelectContent>
                                        {products.map((p) => (<SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="nominalAnnualInterestRate">Interest Rate (% annual)</Label>
                                <Input id="nominalAnnualInterestRate" type="number" step="0.01" value={form.nominalAnnualInterestRate || ""} onChange={(e) => setField("nominalAnnualInterestRate", parseFloat(e.target.value) || 0)} />
                            </div>
                            <div>
                                <Label htmlFor="minRequiredOpeningBalance">Opening Balance</Label>
                                <Input id="minRequiredOpeningBalance" type="number" value={form.minRequiredOpeningBalance || ""} onChange={(e) => setField("minRequiredOpeningBalance", parseFloat(e.target.value) || 0)} />
                            </div>
                            <div>
                                <Label htmlFor="submittedOnDate">Submitted Date</Label>
                                <Input id="submittedOnDate" type="date" value={form.submittedOnDate} onChange={(e) => setField("submittedOnDate", e.target.value)} />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-3">
                    <Button variant="outline" type="button" onClick={() => navigate("/deposits/accounts")}><ArrowLeft className="mr-2 h-4 w-4" /> Cancel</Button>
                    <Button type="submit" disabled={createAccount.isPending}><Save className="mr-2 h-4 w-4" /> {createAccount.isPending ? "Opening…" : "Open Account"}</Button>
                </div>
            </form>
        </div>
    );
};

export default CreateDepositAccountPage;
