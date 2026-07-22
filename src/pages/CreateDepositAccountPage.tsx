import React, { useState, useMemo, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, Save, PiggyBank, ExternalLink, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useCreateSavingsAccount, useUpdateSavingsAccount, useSavingsAccount, useSavingsProducts } from "@/features/deposits";
import { useClients } from "@/features/clients";

const CreateDepositAccountPage: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const [searchParams] = useSearchParams();
    const clientIdParam = searchParams.get("clientId");
    const isEditMode = !!id;

    const createAccount = useCreateSavingsAccount();
    const updateAccount = useUpdateSavingsAccount();
    const { data: existingAccount, isLoading: accountLoading } = useSavingsAccount(id ?? undefined);

    const [form, setForm] = useState({
        clientId: clientIdParam ? Number(clientIdParam) : 0,
        productId: 0,
        externalId: "",
        submittedOnDate: new Date().toISOString().split("T")[0],
        nominalAnnualInterestRate: 0,
        dateFormat: "yyyy-MM-dd",
        locale: "en",
    });
    const [error, setError] = useState<string | null>(null);

    // Populate form from existing account data (edit mode)
    useEffect(() => {
        if (existingAccount) {
            const a = existingAccount as any;
            const dob = Array.isArray(a.timeline?.submittedOnDate)
                ? new Date(a.timeline.submittedOnDate[0], a.timeline.submittedOnDate[1] - 1, a.timeline.submittedOnDate[2]).toISOString().split("T")[0]
                : new Date().toISOString().split("T")[0];
            setForm({
                clientId: a.clientId,
                productId: a.savingsProductId ?? a.productId,
                externalId: a.externalId ?? "",
                submittedOnDate: dob,
                nominalAnnualInterestRate: a.nominalAnnualInterestRate ?? 0,
                dateFormat: "yyyy-MM-dd",
                locale: "en",
            });
        }
    }, [existingAccount]);

    const { data: products = [], isLoading: productsLoading } = useSavingsProducts();
    const { data: clientsData, isLoading: clientsLoading } = useClients({ limit: 100 });

    const clients = clientsData?.pageItems ?? [];
    const isLoading = (isEditMode && accountLoading) || productsLoading || clientsLoading;

    const sortedClients = useMemo(
        () =>
            [...clients].sort((a, b) => {
                if (a.id === form.clientId) return -1;
                if (b.id === form.clientId) return 1;
                return 0;
            }),
        [clients, form.clientId],
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.clientId || !form.productId) return;
        setError(null);
        try {
            if (isEditMode) {
                await updateAccount.mutateAsync({
                    accountId: Number(id),
                    payload: {
                        clientId: form.clientId,
                        productId: form.productId,
                        externalId: form.externalId || undefined,
                        submittedOnDate: form.submittedOnDate,
                        nominalAnnualInterestRate: form.nominalAnnualInterestRate || undefined,
                        locale: "en",
                        dateFormat: "yyyy-MM-dd",
                    } as any,
                });
                navigate(`/deposits/saving-accounts/${id}`);
            } else {
                await createAccount.mutateAsync({
                    clientId: form.clientId,
                    productId: form.productId,
                    externalId: form.externalId || undefined,
                    submittedOnDate: form.submittedOnDate,
                    nominalAnnualInterestRate: form.nominalAnnualInterestRate || undefined,
                    locale: "en",
                    dateFormat: "yyyy-MM-dd",
                });
                navigate("/deposits/saving-accounts");
            }
        } catch (err: any) {
            setError(err?.response?.data?.message ?? err?.message ?? "Operation failed");
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
        <div className="max-w-4xl m-auto space-y-6 p-6">
            <PageHeader
                title={isEditMode ? "Edit Account" : "New Deposit Account"}
                description={isEditMode ? "Modify savings account details" : "Open a new savings account for a client"}
                actions={
                    <Button variant="outline" size="sm" onClick={() => navigate(isEditMode ? `/deposits/saving-accounts/${id}` : "/deposits/saving-accounts")}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back
                    </Button>
                }
            />

            {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
            )}

            <Card>
                <CardHeader><CardTitle className="text-base"><PiggyBank className="inline mr-2 h-5 w-5" />Client &amp; Product</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                        <Label htmlFor="clientId">Client *</Label>
                        <Select value={form.clientId ? String(form.clientId) : ""} onValueChange={(v) => setField("clientId", Number(v))} disabled={isEditMode}>
                            <SelectTrigger><SelectValue placeholder="Select a client" /></SelectTrigger>
                            <SelectContent>
                                {sortedClients.map((c) => (<SelectItem key={c.id} value={String(c.id)}>{c.displayName ?? `Client #${c.id}`}</SelectItem>))}
                            </SelectContent>
                        </Select>
                        {!isEditMode && (
                            <Button type="button" variant="link" size="sm" className="h-auto p-0 text-xs mt-1" onClick={() => window.open("/clients/new", "_blank")}>
                                <ExternalLink className="mr-1 h-3 w-3" />Create New Client
                            </Button>
                        )}
                    </div>
                    <div className="col-span-2">
                        <Label htmlFor="productId">Savings Product *</Label>
                        <Select value={form.productId ? String(form.productId) : ""} onValueChange={(v) => setField("productId", Number(v))}>
                            <SelectTrigger><SelectValue placeholder="Select a savings product" /></SelectTrigger>
                            <SelectContent>
                                {products.map((p) => (<SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>))}
                            </SelectContent>
                        </Select>
                        <Button type="button" variant="link" size="sm" className="h-auto p-0 text-xs mt-1" onClick={() => window.open("/deposits/products", "_blank")}>
                            <ExternalLink className="mr-1 h-3 w-3" />Create New Product
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle className="text-base">Account Details</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                        <Label htmlFor="externalId">External ID</Label>
                        <Input id="externalId" value={form.externalId} onChange={(e) => setField("externalId", e.target.value)} placeholder="Optional external reference" />
                    </div>
                    <div>
                        <Label htmlFor="nominalAnnualInterestRate">Interest Rate (% annual) *</Label>
                        <Input id="nominalAnnualInterestRate" type="number" step="0.01" value={form.nominalAnnualInterestRate || ""} onChange={(e) => setField("nominalAnnualInterestRate", parseFloat(e.target.value) || 0)} />
                    </div>
                    <div>
                        <Label htmlFor="submittedOnDate">Submitted On Date *</Label>
                        <Input id="submittedOnDate" type="date" value={form.submittedOnDate} onChange={(e) => setField("submittedOnDate", e.target.value)} />
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => navigate(isEditMode ? `/deposits/saving-accounts/${id}` : "/deposits/saving-accounts")}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Cancel
                </Button>
                <Button type="submit" onClick={handleSubmit} disabled={createAccount.isPending || updateAccount.isPending} className="bg-[#D32F2F] hover:bg-red-700">
                    {(createAccount.isPending || updateAccount.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Save className="mr-2 h-4 w-4" /> {isEditMode ? "Save Changes" : "Open Account"}
                </Button>
            </div>
        </div>
    );
};

export default CreateDepositAccountPage;
