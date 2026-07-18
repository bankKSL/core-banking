import { type FC, useCallback, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Pencil, CheckCircle2, Trash2, Landmark, PiggyBank } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { ErrorState } from "@/components/shared/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useClient } from "../hooks/useClient";
import { useActivateClient } from "../hooks/useActivateClient";
import { useDeleteClient } from "../hooks/useDeleteClient";
import { useClientAccounts } from "../hooks/useClientAccounts";
import ClientDetails from "../components/ClientDetails";
import ClientStatusBadge from "../components/ClientStatusBadge";
import { getClientStatus, getClientDisplayName } from "../utils/client";
import type { ClientLoanAccount, ClientSavingsAccount } from "../api/client";

const formatCurrency = (n: number, code = "USD") => new Intl.NumberFormat("en-US", { style: "currency", currency: code, maximumFractionDigits: 0 }).format(n);

const ClientDetailPage: FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { data: client, isLoading, isError, refetch } = useClient(id);
    const { data: accounts, isLoading: accountsLoading } = useClientAccounts(id);
    const activateMutation = useActivateClient();
    const deleteMutation = useDeleteClient();
    const [showActivateConfirm, setShowActivateConfirm] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const handleActivate = useCallback(async () => {
        if (!client) return;
        await activateMutation.mutateAsync({ clientId: client.id });
        setShowActivateConfirm(false);
    }, [client, activateMutation]);

    const handleDelete = useCallback(async () => {
        if (!client) return;
        try { await deleteMutation.mutateAsync(client.id); navigate("/clients"); } catch { /* error shown via mutation state */ }
    }, [client, deleteMutation, navigate]);

    if (isLoading) {
        return (
            <div className="p-6">
                <Skeleton className="h-8 w-64 mb-2" /><Skeleton className="h-5 w-96 mb-6" />
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {[1,2,3,4].map(i=>(<div key={i} className="space-y-3 rounded-xl border p-6"><Skeleton className="h-5 w-32" />{[1,2,3,4].map(j=>(<Skeleton key={j} className="h-8 w-full" />))}</div>))}
                </div>
            </div>
        );
    }

    if (isError || !client) {
        return (<div className="p-6"><ErrorState title="Failed to load client" message="Could not fetch client details." onRetry={() => refetch()} /></div>);
    }

    const status = getClientStatus(client);
    const displayName = getClientDisplayName(client);
    const isPending = status === "pending";

    return (
        <div className="p-6">
            <PageHeader title={displayName} description={`Client #${client.id}`}
                actions={
                    <div className="flex items-center gap-2">
                        <ClientStatusBadge status={status} size="lg" />
                        {isPending && (
                            <>
                                <Button variant="outline" onClick={() => setShowActivateConfirm(true)} disabled={activateMutation.isPending} className="text-green-600 border-green-300 hover:bg-green-50">
                                    <CheckCircle2 className="mr-2 h-4 w-4" />{activateMutation.isPending ? "Activating..." : "Activate"}
                                </Button>
                                <Button variant="outline" onClick={() => setShowDeleteConfirm(true)} disabled={deleteMutation.isPending} className="text-red-600 border-red-300 hover:bg-red-50">
                                    <Trash2 className="mr-2 h-4 w-4" />{deleteMutation.isPending ? "Deleting..." : "Delete"}
                                </Button>
                            </>
                        )}
                        <Button variant="outline" onClick={() => navigate(`/clients/${client.id}/edit`)}><Pencil className="mr-2 h-4 w-4" />Edit</Button>
                        <Button variant="outline" onClick={() => navigate("/clients")}><ArrowLeft className="mr-2 h-4 w-4" />Back</Button>
                    </div>
                }
            />

            <Separator className="my-6" />
            <ClientDetails client={client} />

            {/* Step 8: Client Accounts Overview */}
            <div className="mt-6">
                <h3 className="text-lg font-semibold mb-4">Accounts</h3>
                {accountsLoading ? (
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2"><Skeleton className="h-32 rounded-xl" /><Skeleton className="h-32 rounded-xl" /></div>
                ) : accounts ? (
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                        <Card>
                            <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-base"><Landmark className="h-4 w-4 text-blue-500" />Loan Accounts ({accounts.loanAccounts.length})</CardTitle></CardHeader>
                            <CardContent>
                                {accounts.loanAccounts.length === 0 ? <p className="text-sm text-gray-400">No loans</p> : (
                                    <div className="space-y-3">
                                        {accounts.loanAccounts.map((loan: ClientLoanAccount) => (
                                            <div key={loan.id} className="rounded-lg border p-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer" onClick={() => navigate(`/lending/applications/${loan.id}`)}>
                                                <div className="flex items-center justify-between mb-1"><span className="font-mono text-xs font-semibold">{loan.accountNo}</span><Badge variant={loan.status.active?"success":loan.status.closed?"default":"info"} size="sm">{loan.status.description}</Badge></div>
                                                <p className="text-sm font-medium">{loan.productName}</p>
                                                <div className="flex justify-between mt-2 text-xs text-gray-500"><span>Balance: {formatCurrency(loan.accountBalance??0, loan.currency.code)}</span><span>Out: {formatCurrency(loan.amountOutstanding??0, loan.currency.code)}</span></div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-base"><PiggyBank className="h-4 w-4 text-emerald-500" />Savings Accounts ({accounts.savingsAccounts.length})</CardTitle></CardHeader>
                            <CardContent>
                                {accounts.savingsAccounts.length === 0 ? <p className="text-sm text-gray-400">No savings accounts</p> : (
                                    <div className="space-y-3">
                                        {accounts.savingsAccounts.map((sav: ClientSavingsAccount) => (
                                            <div key={sav.id} className="rounded-lg border p-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer" onClick={() => navigate(`/deposits/accounts/${sav.id}`)}>
                                                <div className="flex items-center justify-between mb-1"><span className="font-mono text-xs font-semibold">{sav.accountNo}</span><Badge variant={sav.status.active?"success":sav.status.closed?"default":"warning"} size="sm">{sav.status.description??sav.status.code}</Badge></div>
                                                <p className="text-sm font-medium">{sav.productName}</p>
                                                <div className="flex justify-between mt-2 text-xs text-gray-500"><span>Balance: {formatCurrency(sav.accountBalance, sav.currency.code)}</span><span>Deposits: {formatCurrency(sav.totalDeposits??0, sav.currency.code)}</span></div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                ) : <p className="text-sm text-gray-400">Could not load accounts.</p>}
            </div>

            {deleteMutation.isError && (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
                    {deleteMutation.error instanceof Error ? deleteMutation.error.message : "Failed to delete client. Only pending clients can be deleted."}
                </div>
            )}

            <ConfirmDialog open={showActivateConfirm} onOpenChange={setShowActivateConfirm} title="Activate Client"
                description={`Activate ${displayName}? The client will become active and eligible for financial services.`} onConfirm={handleActivate} variant="default" />
            <ConfirmDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm} title="Delete Client"
                description={`⚠️ Delete ${displayName}? Only pending clients with no active loans or savings can be deleted. This cannot be undone.`} onConfirm={handleDelete} variant="destructive" confirmLabel="Delete" />
        </div>
    );
};

export default ClientDetailPage;
