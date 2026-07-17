import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Calculator, AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useCreateLoan, useLoanTemplate, useLoanProducts } from "@/features/loans";
import { useClients } from "@/features/clients";

const CreateLoanApplicationPage: React.FC = () => {
    const navigate = useNavigate();
    const createLoan = useCreateLoan();

    const [form, setForm] = useState({
        clientId: 0,
        productId: 0,
        principal: 0,
        loanTermFrequency: 12,
        loanTermFrequencyType: 2,
        numberOfRepayments: 12,
        repaymentEvery: 1,
        repaymentFrequencyType: 2,
        interestRatePerPeriod: 0,
        expectedDisbursementDate: new Date().toISOString().split("T")[0],
        submittedOnDate: new Date().toISOString().split("T")[0],
        transactionProcessingStrategyId: undefined as number | undefined,
        loanPurposeName: "",
        loanOfficerId: undefined as number | undefined,
        dateFormat: "yyyy-MM-dd",
        locale: "en",
    });

    // ─── Fetch template and products ─────────────────────────────
    const { data: template, isLoading: templateLoading } = useLoanTemplate(form.clientId || undefined, form.productId || undefined);
    const { data: products = [], isLoading: productsLoading } = useLoanProducts();
    const { data: clientsData, isLoading: clientsLoading } = useClients({ limit: 100 });

    const clients = clientsData?.pageItems ?? [];

    const isLoading = templateLoading || productsLoading || clientsLoading;

    const selectedProduct = useMemo(() =>
        products.find((p) => p.id === form.productId),
        [form.productId, products]
    );

    const handleProductSelect = (productId: string) => {
        const product = products.find((p) => p.id === Number(productId));
        if (!product) return;
        setForm({
            ...form,
            productId: product.id,
            principal: product.principal,
            numberOfRepayments: product.numberOfRepayments,
            repaymentEvery: product.repaymentEvery,
            repaymentFrequencyType: product.repaymentFrequencyType.id,
            interestRatePerPeriod: product.interestRatePerPeriod,
        });
    };

    const monthlyEMI = useMemo(() => {
        if (form.principal <= 0 || form.numberOfRepayments <= 0 || form.interestRatePerPeriod <= 0) return 0;
        const r = form.interestRatePerPeriod / 100 / 12;
        const n = form.numberOfRepayments;
        return (form.principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    }, [form.principal, form.numberOfRepayments, form.interestRatePerPeriod]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.clientId || !form.productId || form.principal <= 0) return;
        try {
            await createLoan.mutateAsync({
                ...form,
                loanTermFrequencyType: 2,
                repaymentFrequencyType: 2,
            });
            navigate("/lending/applications");
        } catch (err) {
            console.error("Failed to create loan:", err);
        }
    };

    const setField = (field: string, value: unknown) => setForm({ ...form, [field]: value });

    if (isLoading) {
        return (
            <div className="space-y-6 max-w-4xl mx-auto">
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-96 w-full rounded-xl" />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <PageHeader title="New Loan Application" description="Create a new loan application for a client"
                actions={
                    <div className="flex items-center gap-3">
                        <Button variant="outline" onClick={() => navigate("/lending/applications")}><ArrowLeft className="mr-2 h-4 w-4" /> Cancel</Button>
                    </div>
                }
            />

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Client Selection */}
                <Card>
                    <CardHeader><CardTitle>Client Information</CardTitle></CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 gap-4">
                            <div>
                                <Label htmlFor="clientId">Client *</Label>
                                <Select value={form.clientId ? String(form.clientId) : ""} onValueChange={(v) => { setField("clientId", Number(v)); }}>
                                    <SelectTrigger><SelectValue placeholder="Select a client" /></SelectTrigger>
                                    <SelectContent>
                                        {clients.map((c) => (<SelectItem key={c.id} value={String(c.id)}>{c.displayName ?? `Client #${c.id}`}</SelectItem>))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Loan Product */}
                <Card>
                    <CardHeader><CardTitle>Loan Details</CardTitle></CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <Label htmlFor="productId">Loan Product *</Label>
                                <Select value={form.productId ? String(form.productId) : ""} onValueChange={handleProductSelect}>
                                    <SelectTrigger><SelectValue placeholder="Select a product" /></SelectTrigger>
                                    <SelectContent>
                                        {products.map((p) => (<SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>))}
                                    </SelectContent>
                                </Select>
                            </div>
                            {selectedProduct && (
                                <p className="col-span-2 text-xs text-gray-500">Min: {selectedProduct.minPrincipal.toLocaleString()} – Max: {selectedProduct.maxPrincipal.toLocaleString()} | {selectedProduct.interestType.value}</p>
                            )}
                            <div>
                                <Label htmlFor="principal">Principal Amount *</Label>
                                <Input id="principal" type="number" value={form.principal || ""} onChange={(e) => setField("principal", parseFloat(e.target.value) || 0)} />
                            </div>
                            <div>
                                <Label htmlFor="loanTermFrequency">Term (months)</Label>
                                <Input id="loanTermFrequency" type="number" value={form.loanTermFrequency || ""} onChange={(e) => setField("loanTermFrequency", parseFloat(e.target.value) || 0)} />
                            </div>
                            <div>
                                <Label htmlFor="numberOfRepayments"># Repayments *</Label>
                                <Input id="numberOfRepayments" type="number" value={form.numberOfRepayments || ""} onChange={(e) => setField("numberOfRepayments", parseInt(e.target.value) || 0)} />
                            </div>
                            <div>
                                <Label htmlFor="repaymentEvery">Repayment Every (months)</Label>
                                <Input id="repaymentEvery" type="number" value={form.repaymentEvery || ""} onChange={(e) => setField("repaymentEvery", parseInt(e.target.value) || 0)} />
                            </div>
                            <div>
                                <Label htmlFor="interestRatePerPeriod">Interest Rate (% per period) *</Label>
                                <Input id="interestRatePerPeriod" type="number" step="0.01" value={form.interestRatePerPeriod || ""} onChange={(e) => setField("interestRatePerPeriod", parseFloat(e.target.value) || 0)} />
                            </div>
                            <div>
                                <Label htmlFor="expectedDisbursementDate">Expected Disbursement Date *</Label>
                                <Input id="expectedDisbursementDate" type="date" value={form.expectedDisbursementDate} onChange={(e) => setField("expectedDisbursementDate", e.target.value)} />
                            </div>
                            <div className="col-span-2">
                                <Label htmlFor="loanPurposeName">Loan Purpose</Label>
                                <Textarea id="loanPurposeName" className="mt-2" placeholder="Purpose of the loan..." value={form.loanPurposeName} onChange={(e) => setField("loanPurposeName", e.target.value)} rows={2} />
                            </div>
                        </div>

                        {/* EMI Calculator */}
                        {form.principal > 0 && form.numberOfRepayments > 0 && form.interestRatePerPeriod > 0 && (
                            <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800 p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <Calculator className="h-5 w-5 text-blue-600" />
                                    <span className="font-medium text-blue-900 dark:text-blue-300">EMI Calculator</span>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div><p className="text-xs text-gray-500">Monthly EMI</p><p className="text-lg font-bold text-blue-700 dark:text-blue-400">{monthlyEMI.toLocaleString("en-US", { style: "currency", currency: "USD" })}</p></div>
                                    <div><p className="text-xs text-gray-500">Total Interest</p><p className="text-sm font-semibold">{(monthlyEMI * form.numberOfRepayments - form.principal).toLocaleString("en-US", { style: "currency", currency: "USD" })}</p></div>
                                    <div><p className="text-xs text-gray-500">Total Repayment</p><p className="text-sm font-semibold">{(monthlyEMI * form.numberOfRepayments).toLocaleString("en-US", { style: "currency", currency: "USD" })}</p></div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-3">
                    <Button variant="outline" type="button" onClick={() => navigate("/lending/applications")}><ArrowLeft className="mr-2 h-4 w-4" /> Cancel</Button>
                    <Button type="submit" disabled={createLoan.isPending}><Save className="mr-2 h-4 w-4" /> {createLoan.isPending ? "Submitting…" : "Submit Application"}</Button>
                </div>
            </form>
        </div>
    );
};

export default CreateLoanApplicationPage;
