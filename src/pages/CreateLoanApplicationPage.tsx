import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Calculator } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { loanProducts, loanApplications } from "@/mock/data";
import type { LoanApplication, LoanProductType, InterestType, AmortizationType } from "@/types";

const CreateLoanApplicationPage: React.FC = () => {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        customerName: "",
        customerId: "",
        customerType: "individual" as "individual" | "business",
        productId: "",
        productType: "personal_loan" as LoanProductType,
        amount: 0,
        tenure: 12,
        interestRate: 0,
        interestType: "fixed" as InterestType,
        amortizationType: "emi" as AmortizationType,
        purpose: "",
        creditScore: 700,
        monthlyIncome: 0,
        existingDebtObligation: 0,
        collateralValue: 0,
        assignedTo: "",
        remarks: "",
    });

    const selectedProduct = useMemo(() => loanProducts.find((p) => p.id === form.productId), [form.productId]);

    const productTypes = useMemo(() => {
        const types = [...new Set(loanProducts.map((p) => p.type))];
        return types;
    }, []);

    const filteredProducts = useMemo(() => loanProducts.filter((p) => p.type === form.productType), [form.productType]);

    const handleProductSelect = (productId: string) => {
        const product = loanProducts.find((p) => p.id === productId);
        if (!product) return;
        setForm({
            ...form,
            productId: product.id,
            productType: product.type,
            interestRate: product.baseInterestRate,
            interestType: product.interestType,
        });
    };

    const monthlyEMI = useMemo(() => {
        if (form.amount <= 0 || form.tenure <= 0 || form.interestRate <= 0) return 0;
        const r = form.interestRate / 100 / 12;
        const n = form.tenure;
        return (form.amount * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    }, [form.amount, form.tenure, form.interestRate]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newApp: LoanApplication = {
            id: `app-${Date.now()}`,
            applicationId: `LA-${String(loanApplications.length + 1).padStart(6, "0")}`,
            ...form,
            productName: selectedProduct?.name ?? "",
            status: "draft",
            appliedDate: new Date().toISOString().split("T")[0],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        navigate("/lending/applications", { state: { newApplication: newApp } });
    };

    const setField = (field: string, value: unknown) => setForm({ ...form, [field]: value });

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <PageHeader
                title="New Loan Application"
                description="Create a new loan origination application"
                actions={
                    <div className="flex items-center gap-3">
                        <Button variant="outline" onClick={() => navigate("/lending/applications")}>
                            <ArrowLeft className="mr-2 h-4 w-4" /> Cancel
                        </Button>
                        <Button onClick={handleSubmit}>
                            <Save className="mr-2 h-4 w-4" /> Submit Application
                        </Button>
                    </div>
                }
            />

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Customer Information */}
                <Card>
                    <CardHeader>
                        <CardTitle>Customer Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="customerName">Customer Name *</Label>
                                <Input
                                    id="customerName"
                                    placeholder="Full legal name"
                                    value={form.customerName}
                                    onChange={(e) => setField("customerName", e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <Label htmlFor="customerId">Customer ID *</Label>
                                <Input
                                    id="customerId"
                                    placeholder="e.g. CUST-100001"
                                    value={form.customerId}
                                    onChange={(e) => setField("customerId", e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <Label>Customer Type</Label>
                                <Select
                                    value={form.customerType}
                                    onValueChange={(v: "individual" | "business") => setField("customerType", v)}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="individual">Individual</SelectItem>
                                        <SelectItem value="business">Business</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="purpose">Loan Purpose</Label>
                                <Input
                                    id="purpose"
                                    placeholder="e.g. Home renovation, Business expansion"
                                    value={form.purpose}
                                    onChange={(e) => setField("purpose", e.target.value)}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Product Selection */}
                <Card>
                    <CardHeader>
                        <CardTitle>Loan Product</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Product Type</Label>
                                <Select
                                    value={form.productType}
                                    onValueChange={(v: LoanProductType) => {
                                        setField("productType", v);
                                        setField("productId", "");
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {productTypes.map((t) => (
                                            <SelectItem key={t} value={t}>
                                                {t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Product *</Label>
                                <Select value={form.productId} onValueChange={handleProductSelect} required>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a product" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {filteredProducts.map((p) => (
                                            <SelectItem key={p.id} value={p.id}>
                                                {p.name} — {p.baseInterestRate}% | {p.minAmount.toLocaleString()}–
                                                {p.maxAmount.toLocaleString()}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            {selectedProduct && (
                                <div className="col-span-2 rounded-lg bg-gray-50 p-3 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                                    <p className="font-medium">{selectedProduct.description}</p>
                                    <p className="mt-1">
                                        Min: {selectedProduct.minAmount.toLocaleString()} | Max:{" "}
                                        {selectedProduct.maxAmount.toLocaleString()} | Tenure: {selectedProduct.minTenure}–
                                        {selectedProduct.maxTenure} months
                                    </p>
                                    {selectedProduct.requiresCollateral && (
                                        <p className="mt-1 text-amber-600 dark:text-amber-400">⚠ Requires collateral</p>
                                    )}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Loan Details */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calculator className="h-5 w-5" /> Loan Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <Label htmlFor="amount">Loan Amount *</Label>
                                <Input
                                    id="amount"
                                    type="number"
                                    min={selectedProduct?.minAmount ?? 1}
                                    max={selectedProduct?.maxAmount}
                                    value={form.amount || ""}
                                    onChange={(e) => setField("amount", parseFloat(e.target.value) || 0)}
                                    required
                                />
                                {selectedProduct && (
                                    <p className="mt-1 text-xs text-gray-400">
                                        Range: {selectedProduct.minAmount.toLocaleString()} – {selectedProduct.maxAmount.toLocaleString()}
                                    </p>
                                )}
                            </div>
                            <div>
                                <Label htmlFor="tenure">Tenure (months) *</Label>
                                <Input
                                    id="tenure"
                                    type="number"
                                    min={selectedProduct?.minTenure ?? 1}
                                    max={selectedProduct?.maxTenure}
                                    value={form.tenure}
                                    onChange={(e) => setField("tenure", parseInt(e.target.value) || 0)}
                                    required
                                />
                                {selectedProduct && (
                                    <p className="mt-1 text-xs text-gray-400">
                                        Range: {selectedProduct.minTenure} – {selectedProduct.maxTenure} months
                                    </p>
                                )}
                            </div>
                            <div>
                                <Label htmlFor="interestRate">Interest Rate (%)</Label>
                                <Input
                                    id="interestRate"
                                    type="number"
                                    step="0.01"
                                    value={form.interestRate}
                                    onChange={(e) => setField("interestRate", parseFloat(e.target.value) || 0)}
                                />
                            </div>
                            <div>
                                <Label>Interest Type</Label>
                                <Select value={form.interestType} onValueChange={(v: InterestType) => setField("interestType", v)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="fixed">Fixed</SelectItem>
                                        <SelectItem value="floating">Floating</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Amortization Type</Label>
                                <Select
                                    value={form.amortizationType}
                                    onValueChange={(v: AmortizationType) => setField("amortizationType", v)}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="emi">EMI (Equal Monthly)</SelectItem>
                                        <SelectItem value="bullet">Bullet (Balloon)</SelectItem>
                                        <SelectItem value="step_up">Step-Up</SelectItem>
                                        <SelectItem value="step_down">Step-Down</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {monthlyEMI > 0 && (
                            <div className="mt-4 rounded-lg border border-[#D32F2F]/20 bg-[#D32F2F]/5 p-4 dark:border-[#D32F2F]/30 dark:bg-[#D32F2F]/10">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Estimated Monthly EMI</span>
                                    <span className="text-xl font-bold text-[#D32F2F]">
                                        {monthlyEMI.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                </div>
                                <div className="mt-1 flex items-center justify-between text-xs text-gray-500">
                                    <span>
                                        Total repayment:{" "}
                                        {(monthlyEMI * form.tenure).toLocaleString("en-US", {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                        })}
                                    </span>
                                    <span>
                                        Interest:{" "}
                                        {(monthlyEMI * form.tenure - form.amount).toLocaleString("en-US", {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                        })}
                                    </span>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Risk & Financials */}
                <Card>
                    <CardHeader>
                        <CardTitle>Risk & Financial Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <Label htmlFor="creditScore">Credit Score</Label>
                                <Input
                                    id="creditScore"
                                    type="number"
                                    min={300}
                                    max={900}
                                    value={form.creditScore}
                                    onChange={(e) => setField("creditScore", parseInt(e.target.value) || 0)}
                                />
                            </div>
                            <div>
                                <Label htmlFor="monthlyIncome">Monthly Income</Label>
                                <Input
                                    id="monthlyIncome"
                                    type="number"
                                    value={form.monthlyIncome || ""}
                                    onChange={(e) => setField("monthlyIncome", parseFloat(e.target.value) || 0)}
                                />
                            </div>
                            <div>
                                <Label htmlFor="existingDebt">Existing Debt Obligations</Label>
                                <Input
                                    id="existingDebt"
                                    type="number"
                                    value={form.existingDebtObligation || ""}
                                    onChange={(e) => setField("existingDebtObligation", parseFloat(e.target.value) || 0)}
                                />
                            </div>
                        </div>
                        {form.monthlyIncome > 0 && monthlyEMI > 0 && (
                            <div className="mt-3 text-xs text-gray-500">
                                DTI Ratio: {(((monthlyEMI + form.existingDebtObligation) / form.monthlyIncome) * 100).toFixed(1)}%
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Collateral */}
                <Card>
                    <CardHeader>
                        <CardTitle>Collateral (if required)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="collateralValue">Collateral Value</Label>
                                <Input
                                    id="collateralValue"
                                    type="number"
                                    value={form.collateralValue || ""}
                                    onChange={(e) => setField("collateralValue", parseFloat(e.target.value) || 0)}
                                />
                            </div>
                            <div>
                                <Label htmlFor="assignedTo">Assigned To</Label>
                                <Input
                                    id="assignedTo"
                                    placeholder="Loan officer name"
                                    value={form.assignedTo}
                                    onChange={(e) => setField("assignedTo", e.target.value)}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Remarks */}
                <Card>
                    <CardHeader>
                        <CardTitle>Additional Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Label htmlFor="remarks">Remarks / Notes</Label>
                        <Textarea
                            id="remarks"
                            className="mt-2"
                            placeholder="Any special instructions or notes for this application..."
                            value={form.remarks}
                            onChange={(e) => setField("remarks", e.target.value)}
                            rows={3}
                        />
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-3">
                    <Button variant="outline" type="button" onClick={() => navigate("/lending/applications")}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Cancel
                    </Button>
                    <Button type="submit">
                        <Save className="mr-2 h-4 w-4" /> Submit Application
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default CreateLoanApplicationPage;
