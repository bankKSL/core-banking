import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fetchOffices, fetchClientsByOffice, fetchClientAccounts2, createTransfer, buildTransferRequest } from "@/features/transfers";
import type { Office, ClientSummary, MiniAccount } from "@/features/transfers";

const STABLE_EMPTY_CLIENTS: ClientSummary[] = [];
const STABLE_EMPTY_ACCOUNTS: MiniAccount[] = [];

const ACCOUNT_TYPES = [
    { id: 1, label: "Loans" },
    { id: 2, label: "Savings" },
];

interface SideState {
    officeId: number | null;
    clientId: number | null;
    accountType: number | null;
    accountId: number | null;
}

const INITIAL_SIDE: SideState = { officeId: null, clientId: null, accountType: null, accountId: null };

const TransferFormPage: React.FC = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [from, setFrom] = useState<SideState>(INITIAL_SIDE);
    const [to, setTo] = useState<SideState>(INITIAL_SIDE);
    const [transferDate, setTransferDate] = useState("");
    const [transferAmount, setTransferAmount] = useState<number | "">("");
    const [transferDescription, setTransferDescription] = useState("");

    // ─── Offices ─────────────────────────────────────────────────
    const { data: offices = [] } = useQuery({
        queryKey: ["offices"],
        queryFn: fetchOffices,
    });

    // ─── From Clients (derived from query, not stored in state) ──
    const fromClientsQuery = useQuery({
        queryKey: ["clientsByOffice", from.officeId],
        queryFn: () => fetchClientsByOffice(from.officeId!),
        enabled: !!from.officeId,
    });
    const fromClients: ClientSummary[] = fromClientsQuery.data ?? STABLE_EMPTY_CLIENTS;

    // ─── From Accounts (derived from query) ──────────────────────
    const fromAccountsQuery = useQuery({
        queryKey: ["clientAccounts", from.clientId],
        queryFn: () => fetchClientAccounts2(from.clientId!),
        enabled: !!from.clientId,
    });
    const fromAccounts: MiniAccount[] =
        from.accountType === 1
            ? (fromAccountsQuery.data?.loanAccounts ?? STABLE_EMPTY_ACCOUNTS)
            : from.accountType === 2
              ? (fromAccountsQuery.data?.savingsAccounts ?? STABLE_EMPTY_ACCOUNTS)
              : STABLE_EMPTY_ACCOUNTS;

    // ─── To Clients (derived from query) ─────────────────────────
    const toClientsQuery = useQuery({
        queryKey: ["clientsByOffice", to.officeId],
        queryFn: () => fetchClientsByOffice(to.officeId!),
        enabled: !!to.officeId,
    });
    const toClients: ClientSummary[] = toClientsQuery.data ?? STABLE_EMPTY_CLIENTS;

    // ─── To Accounts (derived from query) ────────────────────────
    const toAccountsQuery = useQuery({
        queryKey: ["clientAccounts", to.clientId],
        queryFn: () => fetchClientAccounts2(to.clientId!),
        enabled: !!to.clientId,
    });
    const toAccounts: MiniAccount[] =
        to.accountType === 1
            ? (toAccountsQuery.data?.loanAccounts ?? STABLE_EMPTY_ACCOUNTS)
            : to.accountType === 2
              ? (toAccountsQuery.data?.savingsAccounts ?? STABLE_EMPTY_ACCOUNTS)
              : STABLE_EMPTY_ACCOUNTS;

    // ─── Mutation ────────────────────────────────────────────────
    const transferMutation = useMutation({
        mutationFn: () => {
            if (
                !from.officeId ||
                !from.clientId ||
                !from.accountType ||
                !from.accountId ||
                !to.officeId ||
                !to.clientId ||
                !to.accountType ||
                !to.accountId ||
                !transferDate ||
                !transferAmount
            ) {
                throw new Error("All fields are required");
            }
            const payload = buildTransferRequest({
                fromOfficeId: from.officeId,
                fromClientId: from.clientId,
                fromAccountType: from.accountType,
                fromAccountId: from.accountId,
                toOfficeId: to.officeId,
                toClientId: to.clientId,
                toAccountType: to.accountType,
                toAccountId: to.accountId,
                transferDate,
                transferAmount: Number(transferAmount),
                transferDescription,
            });
            return createTransfer(payload);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["accountTransfers"] });
            navigate("/transfers/history");
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        transferMutation.mutate();
    };

    const updateSide = (side: "from" | "to", field: keyof SideState, value: number | null) => {
        const setter = side === "from" ? setFrom : setTo;
        if (field === "officeId") {
            setter((prev) => ({ ...prev, officeId: value ?? null, clientId: null, accountType: null, accountId: null }));
        } else if (field === "clientId") {
            setter((prev) => ({ ...prev, clientId: value ?? null, accountType: null, accountId: null }));
        } else if (field === "accountType") {
            setter((prev) => ({ ...prev, accountType: value ?? null, accountId: null }));
        } else {
            setter((prev) => ({ ...prev, [field]: value ?? null }));
        }
    };

    console.log({ clients: fromClientsQuery.data });

    const renderSide = (side: "from" | "to", state: SideState) => {
        const clients = side === "from" ? fromClients : toClients;
        const accounts = side === "from" ? fromAccounts : toAccounts;

        return (
            <div className="space-y-4">
                {/* Office */}
                <div>
                    <Label>Office</Label>
                    <Select value={state.officeId ? String(state.officeId) : ""} onValueChange={(v) => updateSide(side, "officeId", Number(v))}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select Office" />
                        </SelectTrigger>
                        <SelectContent>
                            {offices.map((o: Office) => (
                                <SelectItem key={o.id} value={String(o.id)}>
                                    {o.nameDecorated || o.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Client */}
                <div>
                    <Label>Client</Label>
                    <Select value={state.clientId ? String(state.clientId) : ""} onValueChange={(v) => updateSide(side, "clientId", Number(v))} disabled={!state.officeId}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select Client" />
                        </SelectTrigger>
                        <SelectContent>
                            {clients.map((c: ClientSummary) => (
                                <SelectItem key={c.id} value={String(c.id)}>
                                    {c.displayName}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Account Type */}
                <div>
                    <Label>Account Type</Label>
                    <Select value={state.accountType ? String(state.accountType) : ""} onValueChange={(v) => updateSide(side, "accountType", Number(v))} disabled={!state.clientId}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select Type" />
                        </SelectTrigger>
                        <SelectContent>
                            {ACCOUNT_TYPES.map((at) => (
                                <SelectItem key={at.id} value={String(at.id)}>
                                    {at.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Account */}
                <div>
                    <Label>Account</Label>
                    <Select value={state.accountId ? String(state.accountId) : ""} onValueChange={(v) => updateSide(side, "accountId", Number(v))} disabled={!state.accountType}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select Account" />
                        </SelectTrigger>
                        <SelectContent>
                            {accounts.map((a: MiniAccount) => (
                                <SelectItem key={a.id} value={String(a.id)}>
                                    {a.accountNo} - {a.productName}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
        );
    };

    const isValid =
        from.officeId &&
        from.clientId &&
        from.accountType &&
        from.accountId &&
        to.officeId &&
        to.clientId &&
        to.accountType &&
        to.accountId &&
        transferDate &&
        transferAmount !== "";

    return (
        <div className="p-6 max-w-5xl m-auto space-y-6">
            <PageHeader
                title="New Account Transfer"
                description="Transfer funds between accounts"
                actions={
                    <Button variant="outline" onClick={() => navigate("/transfers/history")}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back
                    </Button>
                }
            />

            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* FROM Section */}
                    <Card>
                        <CardHeader>
                            <CardTitle>From</CardTitle>
                        </CardHeader>
                        <CardContent>{renderSide("from", from)}</CardContent>
                    </Card>

                    {/* TO Section */}
                    <Card>
                        <CardHeader>
                            <CardTitle>To</CardTitle>
                        </CardHeader>
                        <CardContent>{renderSide("to", to)}</CardContent>
                    </Card>
                </div>

                {/* Bottom fields */}
                <Card className="mt-6">
                    <CardContent className="pt-6 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="transferDate">
                                    Transfer Date <span className="text-red-500">*</span>
                                </Label>
                                <Input id="transferDate" type="date" value={transferDate} onChange={(e) => setTransferDate(e.target.value)} required />
                            </div>
                            <div>
                                <Label htmlFor="transferAmount">
                                    Amount <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="transferAmount"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder="0.00"
                                    value={transferAmount}
                                    onChange={(e) => setTransferAmount(e.target.value ? Number(e.target.value) : "")}
                                    required
                                />
                            </div>
                        </div>
                        <div>
                            <Label htmlFor="transferDescription">Description</Label>
                            <Textarea
                                id="transferDescription"
                                placeholder="Optional description"
                                value={transferDescription}
                                onChange={(e) => setTransferDescription(e.target.value)}
                                rows={3}
                            />
                        </div>
                        <div className="flex justify-end gap-3">
                            <Button type="button" variant="outline" onClick={() => navigate("/transfers/history")}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={!isValid || transferMutation.isPending}>
                                {transferMutation.isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-2 h-4 w-4" /> Submit Transfer
                                    </>
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </form>
        </div>
    );
};

export default TransferFormPage;
