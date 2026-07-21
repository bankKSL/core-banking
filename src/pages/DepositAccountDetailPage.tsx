import { type FC, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, PiggyBank, Calendar, Clock, DollarSign, Percent, Building2, User, Info, LayoutGrid, Receipt, ArrowLeftRight, ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSavingsAccount, useRejectSavingsAccount, useWithdrawSavingsAccount, useUndoRejectSavingsAccount, SAVINGS_STATUS_CONFIG } from "@/features/deposits";
import { useMakeDeposit, useMakeWithdrawal } from "@/features/deposits";
import SavingsCharges from "@/features/deposits/components/SavingsCharges";
import DepositWithdrawDialog from "@/features/deposits/components/DepositWithdrawDialog";
import SavingsTransactions from "@/features/deposits/components/SavingsTransactions";

function Hash(props: React.SVGProps<SVGSVGElement>) {
    return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="9" y2="9"/><line x1="4" x2="20" y1="15" y2="15"/><line x1="10" x2="8" y1="3" y2="21"/><line x1="16" x2="14" y1="3" y2="21"/></svg>;
}

const formatCurrency = (n: number, code = "USD") => new Intl.NumberFormat("en-US", { style: "currency", currency: code, maximumFractionDigits: 2 }).format(n);

const InfoRow: React.FC<{ icon: React.ReactNode; label: string; value: React.ReactNode }> = ({ icon, label, value }) => (
    <div className="flex items-start gap-3 py-2"><span className="mt-0.5 text-gray-400">{icon}</span><div className="min-w-0 flex-1"><p className="text-xs font-medium text-gray-500">{label}</p><p className="text-sm text-gray-900 dark:text-gray-100">{value}</p></div></div>
);

const DepositAccountDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { data: account, isLoading, isError, error, refetch } = useSavingsAccount(id);
    const rejectMutation = useRejectSavingsAccount();
    const withdrawMutation = useWithdrawSavingsAccount();
    const undoRejectMutation = useUndoRejectSavingsAccount();
    const [activeTab, setActiveTab] = useState("general");
    const [txnDialog, setTxnDialog] = useState<"deposit" | "withdrawal" | null>(null);

    const handleCommand = useCallback(async (cmd: string) => {
        if (!account) return;
        if (cmd === "reject") await rejectMutation.mutateAsync(account.id);
        else if (cmd === "withdraw") await withdrawMutation.mutateAsync(account.id);
        else if (cmd === "undoreject") await undoRejectMutation.mutateAsync(account.id);
        refetch();
    }, [account, rejectMutation, withdrawMutation, undoRejectMutation, refetch]);
    if (isLoading) return (
        <div className="p-6 max-w-4xl m-auto space-y-6"><Skeleton className="h-10 w-64" /><div className="grid grid-cols-1 gap-6 lg:grid-cols-2">{[1,2,3,4].map(i=>(<Skeleton key={i} className="h-40 rounded-xl" />))}</div></div>
    );

    if (isError || !account) return (
        <div className="flex items-center justify-center h-64"><div className="text-center"><p className="text-red-600">Failed to load: {String(error)}</p><Button variant="outline" className="mt-2" onClick={() => refetch()}>Retry</Button></div></div>
    );

    const statusCode = account.status?.code ?? "";
    const statusConfig = SAVINGS_STATUS_CONFIG[statusCode];
    const isPending = statusCode.includes("pending") || statusCode.includes("submitted");
    const isActive = statusCode.includes("active");
    const isApproved = statusCode.includes("approved") && !isActive;
    const isRejected = statusCode.includes("rejected");

    return (
        <div className="p-6 max-w-4xl m-auto space-y-6">
            <PageHeader title={`Account ${account.accountNo}`}
                description={`${account.savingsProductName ?? "Savings"} — ${account.clientName ?? `Client #${account.clientId}`}`}
                actions={
                    <div className="flex items-center gap-2 flex-wrap">
                        {statusConfig && <Badge variant={statusConfig.variant === "success" ? "success" : statusConfig.variant === "error" ? "error" : "info"}>{statusConfig.label}</Badge>}
                        {isActive && (
                            <>
                                <Button variant="outline" size="sm" onClick={() => setTxnDialog("deposit")} className="text-emerald-600"><ArrowDownCircle className="mr-1 h-4 w-4" />Deposit</Button>
                                <Button variant="outline" size="sm" onClick={() => setTxnDialog("withdrawal")} className="text-amber-600"><ArrowUpCircle className="mr-1 h-4 w-4" />Withdraw</Button>
                            </>
                        )}
                        {isPending && (
                            <>
                                <Button variant="outline" size="sm" onClick={() => handleCommand("reject")} className="text-red-600">Reject</Button>
                                <Button variant="outline" size="sm" onClick={() => handleCommand("withdraw")} className="text-amber-600">Withdraw</Button>
                            </>
                        )}
                        {isRejected && (
                            <Button variant="outline" size="sm" onClick={() => handleCommand("undoreject")}>Undo Reject</Button>
                        )}
                        <Button variant="outline" size="sm" onClick={() => navigate("/deposits/accounts")}><ArrowLeft className="mr-1 h-4 w-4" />Back</Button>
                    </div>
                }
            />
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="general"><Info className="h-4 w-4 mr-1" />General</TabsTrigger>
                    <TabsTrigger value="charges"><Receipt className="h-4 w-4 mr-1" />Charges</TabsTrigger>
                    <TabsTrigger value="transactions"><ArrowLeftRight className="h-4 w-4 mr-1" />Transactions</TabsTrigger>
                </TabsList>
                <Separator className="my-4" />

                <TabsContent value="general" className="mt-0 space-y-6">
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                        <Card>
                            <CardHeader><CardTitle className="text-base flex items-center gap-2"><PiggyBank className="h-4 w-4 text-emerald-500" />Account Info</CardTitle></CardHeader>
                            <CardContent className="divide-y divide-gray-100 dark:divide-gray-800">
                                <InfoRow icon={<Hash className="h-4 w-4" />} label="Account No" value={<code className="text-xs">{account.accountNo}</code>} />
                                <InfoRow icon={<Building2 className="h-4 w-4" />} label="Product" value={account.savingsProductName ?? account.productId} />
                                <InfoRow icon={<User className="h-4 w-4" />} label="Client" value={account.clientName ?? `#${account.clientId}`} />
                                <InfoRow icon={<DollarSign className="h-4 w-4" />} label="Balance" value={<span className="font-semibold">{formatCurrency(account.accountBalance, account.currency.code)}</span>} />
                                <InfoRow icon={<Percent className="h-4 w-4" />} label="Interest Rate" value={`${account.nominalAnnualInterestRate ?? 0}%`} />
                                <InfoRow icon={<DollarSign className="h-4 w-4 text-emerald-500" />} label="Available" value={formatCurrency(account.availableBalance ?? account.accountBalance, account.currency.code)} />
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader><CardTitle className="text-base flex items-center gap-2"><DollarSign className="h-4 w-4 text-gray-400" />Summary</CardTitle></CardHeader>
                            <CardContent className="divide-y divide-gray-100 dark:divide-gray-800">
                                <InfoRow icon={<DollarSign className="h-4 w-4 text-emerald-500" />} label="Total Deposits" value={formatCurrency(account.totalDeposits ?? 0, account.currency.code)} />
                                <InfoRow icon={<DollarSign className="h-4 w-4 text-red-500" />} label="Total Withdrawals" value={formatCurrency(account.totalWithdrawals ?? 0, account.currency.code)} />
                                <InfoRow icon={<DollarSign className="h-4 w-4 text-amber-500" />} label="Interest Earned" value={formatCurrency(account.totalInterestEarned ?? 0, account.currency.code)} />
                                <InfoRow icon={<DollarSign className="h-4 w-4 text-gray-500" />} label="Fees Paid" value={formatCurrency(account.totalFeesPaid ?? 0, account.currency.code)} />
                                <InfoRow icon={<DollarSign className="h-4 w-4 text-red-600" />} label="Penalties" value={formatCurrency(account.totalPenaltyPaid ?? 0, account.currency.code)} />
                                <InfoRow icon={<Clock className="h-4 w-4" />} label="Last Transaction" value={account.lastActiveTransactionDate ? new Date(account.lastActiveTransactionDate).toLocaleDateString() : "—"} />
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Calendar className="h-4 w-4 text-gray-400" />Timeline</CardTitle></CardHeader>
                            <CardContent className="divide-y divide-gray-100 dark:divide-gray-800">
                                <InfoRow icon={<Calendar className="h-4 w-4" />} label="Submitted" value={account.timeline?.submittedOnDate ? new Date(account.timeline.submittedOnDate).toLocaleDateString() : "—"} />
                                <InfoRow icon={<Calendar className="h-4 w-4" />} label="Approved" value={account.timeline?.approvedOnDate ? new Date(account.timeline.approvedOnDate).toLocaleDateString() : "—"} />
                                <InfoRow icon={<Calendar className="h-4 w-4" />} label="Activated" value={account.timeline?.activatedOnDate ? new Date(account.timeline.activatedOnDate).toLocaleDateString() : "—"} />
                                <InfoRow icon={<Calendar className="h-4 w-4" />} label="Closed" value={account.timeline?.closedOnDate ? new Date(account.timeline.closedOnDate).toLocaleDateString() : "—"} />
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
                <TabsContent value="charges" className="mt-0">
                    <SavingsCharges accountId={account.id} />
                </TabsContent>

                <TabsContent value="transactions" className="mt-0">
                    <SavingsTransactions accountId={account.id} />
                </TabsContent>
            </Tabs>

            {txnDialog && (
                <DepositWithdrawDialog accountId={account.id} type={txnDialog} open={!!txnDialog} onOpenChange={() => setTxnDialog(null)} onSuccess={() => refetch()} />
            )}
        </div>
    );
};

export default DepositAccountDetailPage;
