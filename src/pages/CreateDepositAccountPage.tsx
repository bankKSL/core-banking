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
import { depositAccounts } from "@/mock/data";
import type { DepositAccount, DepositAccountType, DepositAccountStatus } from "@/types";

const CreateDepositAccountPage: React.FC = () => {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        customerName: "",
        customerId: "",
        type: "savings" as DepositAccountType,
        currency: "USD",
        balance: 0,
        interestRate: 0,
        branchName: "",
        branchCode: "",
        nomineeName: "",
        accountOfficer: "",
        remarks: "",
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newAccount: DepositAccount = {
            id: `acc-${Date.now()}`,
            accountNumber: `AC-${String(depositAccounts.length + 1).padStart(8, "0")}`,
            ...form,
            status: "active",
            openedDate: new Date().toISOString().split("T")[0],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        navigate("/deposits/accounts", { state: { newAccount } });
    };

    const setField = (field: string, value: unknown) => setForm({ ...form, [field]: value });

    return (
        <div className="max-w-4xl m-auto space-y-6">
            <PageHeader
                title="New Deposit Account"
                description="Open a new savings or current account"
                actions={
                    <div className="flex items-center gap-3">
                        <Button variant="outline" onClick={() => navigate("/deposits/accounts")}>
                            <ArrowLeft className="mr-2 h-4 w-4" /> Cancel
                        </Button>
                        <Button onClick={handleSubmit}>
                            <Save className="mr-2 h-4 w-4" /> Open Account
                        </Button>
                    </div>
                }
            />

            <form onSubmit={handleSubmit} className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <PiggyBank className="h-5 w-5" /> Customer Information
                        </CardTitle>
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
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Account Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <Label>Account Type *</Label>
                                <Select value={form.type} onValueChange={(v: DepositAccountType) => setField("type", v)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="savings">Savings Account</SelectItem>
                                        <SelectItem value="current">Current Account</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="currency">Currency</Label>
                                <Select value={form.currency} onValueChange={(v) => setField("currency", v)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="USD">USD</SelectItem>
                                        <SelectItem value="EUR">EUR</SelectItem>
                                        <SelectItem value="GBP">GBP</SelectItem>
                                        <SelectItem value="SAR">SAR</SelectItem>
                                        <SelectItem value="AED">AED</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="balance">Initial Deposit</Label>
                                <Input
                                    id="balance"
                                    type="number"
                                    min={0}
                                    value={form.balance || ""}
                                    onChange={(e) => setField("balance", parseFloat(e.target.value) || 0)}
                                />
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
                                <Label htmlFor="branchName">Branch Name *</Label>
                                <Input
                                    id="branchName"
                                    placeholder="e.g. Riyadh Main"
                                    value={form.branchName}
                                    onChange={(e) => setField("branchName", e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <Label htmlFor="branchCode">Branch Code</Label>
                                <Input
                                    id="branchCode"
                                    placeholder="e.g. B001"
                                    value={form.branchCode}
                                    onChange={(e) => setField("branchCode", e.target.value)}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Additional Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="nomineeName">Nominee Name</Label>
                                <Input
                                    id="nomineeName"
                                    placeholder="Beneficiary name"
                                    value={form.nomineeName}
                                    onChange={(e) => setField("nomineeName", e.target.value)}
                                />
                            </div>
                            <div>
                                <Label htmlFor="accountOfficer">Account Officer</Label>
                                <Input
                                    id="accountOfficer"
                                    placeholder="Assigned officer"
                                    value={form.accountOfficer}
                                    onChange={(e) => setField("accountOfficer", e.target.value)}
                                />
                            </div>
                            <div className="col-span-2">
                                <Label htmlFor="remarks">Remarks</Label>
                                <Textarea
                                    id="remarks"
                                    className="mt-2"
                                    placeholder="Any special instructions..."
                                    value={form.remarks}
                                    onChange={(e) => setField("remarks", e.target.value)}
                                    rows={2}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-3">
                    <Button variant="outline" type="button" onClick={() => navigate("/deposits/accounts")}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Cancel
                    </Button>
                    <Button type="submit">
                        <Save className="mr-2 h-4 w-4" /> Open Account
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default CreateDepositAccountPage;
