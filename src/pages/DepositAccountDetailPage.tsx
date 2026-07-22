import { type FC, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    ArrowLeft,
    PiggyBank,
    Calendar,
    Clock,
    DollarSign,
    Percent,
    Building2,
    User,
    Info,
    LayoutGrid,
    Receipt,
    ArrowLeftRight,
    ArrowDownCircle,
    ArrowUpCircle,
    CheckCircle2,
    XCircle,
    Loader2,
    Hash,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    useSavingsAccount,
    useRejectSavingsAccount,
    useWithdrawSavingsAccount,
    useUndoRejectSavingsAccount,
    approveSavingsAccount,
    activateSavingsAccount,
    SAVINGS_STATUS_CONFIG,
} from "@/features/deposits";
import { useMakeDeposit, useMakeWithdrawal } from "@/features/deposits";
import SavingsCharges from "@/features/deposits/components/SavingsCharges";
import DepositWithdrawDialog from "@/features/deposits/components/DepositWithdrawDialog";
import SavingsTransactions from "@/features/deposits/components/SavingsTransactions";

const formatCurrency = (n: number, code = "USD") => new Intl.NumberFormat("en-US", { style: "currency", currency: code, maximumFractionDigits: 2 }).format(n);

const InfoRow: React.FC<{ icon: React.ReactNode; label: string; value: React.ReactNode }> = ({ icon, label, value }) => (
    <div className="flex items-start gap-3 py-2">
        <span className="mt-0.5 text-gray-400">{icon}</span>
        <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-gray-500">{label}</p>
            <p className="text-sm text-gray-900 dark:text-gray-100">{value}</p>
        </div>
    </div>
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
    const [acting, setActing] = useState(false);

    const handleCommand = useCallback(
        async (cmd: string) => {
            if (!account) return;
            setActing(true);
            const date = new Date().toISOString().split("T")[0];
            try {
                if (cmd === "approve") await approveSavingsAccount(account.id, { approvedOnDate: date, dateFormat: "yyyy-MM-dd", locale: "en" });
                else if (cmd === "activate") await activateSavingsAccount(account.id, { activatedOnDate: date, dateFormat: "yyyy-MM-dd", locale: "en" });
                else if (cmd === "reject") await rejectMutation.mutateAsync(account.id);
                else if (cmd === "withdraw") await withdrawMutation.mutateAsync(account.id);
                else if (cmd === "undoreject") await undoRejectMutation.mutateAsync(account.id);
                refetch();
            } finally {
                setActing(false);
            }
        },
        [account, rejectMutation, withdrawMutation, undoRejectMutation, refetch],
    );

    if (isLoading)
        return (
            <div className="p-6 max-w-4xl m-auto space-y-6">
                <Skeleton className="h-10 w-64" />
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-40 rounded-xl" />
                    ))}
                </div>
            </div>
        );

    if (isError || !account)
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <p className="text-red-600">Failed to load: {String(error)}</p>
                    <Button variant="outline" className="mt-2" onClick={() => refetch()}>
                        Retry
                    </Button>
                </div>
            </div>
        );

    const statusCode = account.status?.code ?? "";
    const statusConfig = SAVINGS_STATUS_CONFIG[statusCode];
    const isPending = statusCode.includes("pending") || statusCode.includes("submitted");
    const isActive = statusCode.includes("active");
    const isApproved = statusCode.includes("approved") && !isActive;
    const isRejected = statusCode.includes("rejected");

    return (
        <div className="p-6 max-w-4xl m-auto space-y-6">
            <PageHeader
                title={`Account ${account.accountNo}`}
                description={`${account.savingsProductName ?? "Savings"} — ${account.clientName ?? `Client #${account.clientId}`}`}
                actions={
                    <div className="flex items-center gap-2 flex-wrap">
                        {statusConfig && (
                            <Badge variant={statusConfig.variant === "success" ? "success" : statusConfig.variant === "error" ? "error" : "info"}>{statusConfig.label}</Badge>
                        )}
                        {isPending && (
                            <>
                                <Button variant="outline" size="sm" onClick={() => handleCommand("approve")} disabled={acting} className="text-emerald-600 border-emerald-200">
                                    {acting && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
                                    <CheckCircle2 className="mr-1 h-4 w-4" />
                                    Approve
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => handleCommand("reject")} disabled={acting} className="text-red-600">
                                    <XCircle className="mr-1 h-4 w-4" />
                                    Reject
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => handleCommand("withdraw")} disabled={acting} className="text-amber-600">
                                    Withdraw
                                </Button>
                            </>
                        )}
                        {isApproved && (
                            <Button variant="outline" size="sm" onClick={() => handleCommand("activate")} disabled={acting} className="text-emerald-600">
                                {acting && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
                                <CheckCircle2 className="mr-1 h-4 w-4" />
                                Activate
                            </Button>
                        )}
                        {isActive && (
                            <>
                                <Button variant="outline" size="sm" onClick={() => setTxnDialog("deposit")} className="text-emerald-600">
                                    <ArrowDownCircle className="mr-1 h-4 w-4" />
                                    Deposit
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => setTxnDialog("withdrawal")} className="text-amber-600">
                                    <ArrowUpCircle className="mr-1 h-4 w-4" />
                                    Withdraw
                                </Button>
                            </>
                        )}
                        {isRejected && (
                            <Button variant="outline" size="sm" onClick={() => handleCommand("undoreject")} disabled={acting}>
                                Undo Reject
                            </Button>
                        )}
                        <Button variant="outline" size="sm" onClick={() => navigate("/deposits/saving-accounts")}>
                            <ArrowLeft className="mr-1 h-4 w-4" />
                            Back
                        </Button>
                    </div>
                }
            />

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="general">
                        <Info className="h-4 w-4 mr-1" />
                        General
                    </TabsTrigger>
                    <TabsTrigger value="charges">
                        <Receipt className="h-4 w-4 mr-1" />
                        Charges
                    </TabsTrigger>
                    <TabsTrigger value="transactions">
                        <ArrowLeftRight className="h-4 w-4 mr-1" />
                        Transactions
                    </TabsTrigger>
                </TabsList>
                <Separator className="my-4" />

                <TabsContent value="general" className="mt-0 space-y-6">
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <PiggyBank className="h-4 w-4 text-emerald-500" />
                                    Account Info
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="divide-y divide-gray-100 dark:divide-gray-800">
                                <InfoRow icon={<Hash className="h-4 w-4" />} label="Account No" value={<code className="text-xs">{account.accountNo}</code>} />
                                <InfoRow icon={<Hash className="h-4 w-4" />} label="External ID" value={account.externalId ?? "—"} />
                                <InfoRow icon={<Building2 className="h-4 w-4" />} label="Product" value={account.savingsProductName ?? account.productId} />
                                <InfoRow icon={<User className="h-4 w-4" />} label="Client" value={account.clientName ?? `#${account.clientId}`} />
                                <InfoRow icon={<User className="h-4 w-4" />} label="Field Officer" value={account.fieldOfficerId ?? account.savingsOfficerName ?? "—"} />
                                <InfoRow
                                    icon={<DollarSign className="h-4 w-4" />}
                                    label="Balance"
                                    value={<span className="font-semibold">{formatCurrency(account.accountBalance, account.currency.code)}</span>}
                                />
                                <InfoRow icon={<Percent className="h-4 w-4" />} label="Interest Rate" value={`${account.nominalAnnualInterestRate ?? 0}%`} />
                                <InfoRow
                                    icon={<DollarSign className="h-4 w-4 text-emerald-500" />}
                                    label="Available"
                                    value={formatCurrency(account.availableBalance ?? account.accountBalance, account.currency.code)}
                                />
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <DollarSign className="h-4 w-4 text-gray-400" />
                                    Summary
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="divide-y divide-gray-100 dark:divide-gray-800">
                                <InfoRow
                                    icon={<DollarSign className="h-4 w-4 text-emerald-500" />}
                                    label="Total Deposits"
                                    value={formatCurrency(account.totalDeposits ?? 0, account.currency.code)}
                                />
                                <InfoRow
                                    icon={<DollarSign className="h-4 w-4 text-red-500" />}
                                    label="Total Withdrawals"
                                    value={formatCurrency(account.totalWithdrawals ?? 0, account.currency.code)}
                                />
                                <InfoRow
                                    icon={<DollarSign className="h-4 w-4 text-amber-500" />}
                                    label="Interest Earned"
                                    value={formatCurrency(account.totalInterestEarned ?? 0, account.currency.code)}
                                />
                                <InfoRow
                                    icon={<DollarSign className="h-4 w-4 text-gray-500" />}
                                    label="Fees Paid"
                                    value={formatCurrency(account.totalFeesPaid ?? 0, account.currency.code)}
                                />
                                <InfoRow
                                    icon={<DollarSign className="h-4 w-4 text-red-600" />}
                                    label="Penalties"
                                    value={formatCurrency(account.totalPenaltyPaid ?? 0, account.currency.code)}
                                />
                                <InfoRow
                                    icon={<Clock className="h-4 w-4" />}
                                    label="Last Transaction"
                                    value={account.lastActiveTransactionDate ? new Date(account.lastActiveTransactionDate).toLocaleDateString() : "—"}
                                />
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-gray-400" />
                                    Timeline
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="divide-y divide-gray-100 dark:divide-gray-800">
                                <InfoRow
                                    icon={<Calendar className="h-4 w-4" />}
                                    label="Submitted"
                                    value={account.timeline?.submittedOnDate ? new Date(account.timeline.submittedOnDate).toLocaleDateString() : "—"}
                                />
                                <InfoRow
                                    icon={<Calendar className="h-4 w-4" />}
                                    label="Approved"
                                    value={account.timeline?.approvedOnDate ? new Date(account.timeline.approvedOnDate).toLocaleDateString() : "—"}
                                />
                                <InfoRow
                                    icon={<Calendar className="h-4 w-4" />}
                                    label="Activated"
                                    value={account.timeline?.activatedOnDate ? new Date(account.timeline.activatedOnDate).toLocaleDateString() : "—"}
                                />
                                <InfoRow
                                    icon={<Calendar className="h-4 w-4" />}
                                    label="Closed"
                                    value={account.timeline?.closedOnDate ? new Date(account.timeline.closedOnDate).toLocaleDateString() : "—"}
                                />
                            </CardContent>
                        </Card>

                        <Card className="col-span-full">
                            <CardHeader>
                                <CardTitle className="text-base">
                                    <Percent className="inline mr-2 h-4 w-4" />
                                    Interest Rate &amp; Configuration
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-gray-500">Interest Rate:</span> <span className="font-medium">{account.nominalAnnualInterestRate ?? 0}%</span>
                                </div>
                                <div>
                                    <span className="text-gray-500">Compounding:</span> <span className="font-medium">{account.interestCompoundingPeriodType?.value ?? "—"}</span>
                                </div>
                                <div>
                                    <span className="text-gray-500">Posting:</span> <span className="font-medium">{account.interestPostingPeriodType?.value ?? "—"}</span>
                                </div>
                                <div>
                                    <span className="text-gray-500">Calculation:</span> <span className="font-medium">{account.interestCalculationType?.value ?? "—"}</span>
                                </div>
                                <div>
                                    <span className="text-gray-500">Days/Year:</span> <span className="font-medium">{account.interestCalculationDaysInYearType?.value ?? "—"}</span>
                                </div>
                                <div>
                                    <span className="text-gray-500">Lock-in:</span>{" "}
                                    <span className="font-medium">
                                        {account.lockinPeriodFrequency ? `${account.lockinPeriodFrequency} ${account.lockinPeriodFrequencyType?.value?.toLowerCase() ?? ""}` : "—"}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-gray-500">Min Opening:</span>{" "}
                                    <span className="font-medium">
                                        {account.minRequiredOpeningBalance != null ? formatCurrency(account.minRequiredOpeningBalance, account.currency.code) : "—"}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-gray-500">Withdraw Fee:</span> <span className="font-medium">{account.withdrawalFee ? "Yes" : "No"}</span>
                                </div>
                                <div>
                                    <span className="text-gray-500">Overdraft:</span>{" "}
                                    <span className="font-medium">
                                        {account.allowOverdraft ? `Yes (Limit: ${formatCurrency(account.overdraftLimit ?? 0, account.currency.code)})` : "No"}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-gray-500">Withhold Tax:</span>{" "}
                                    <span className="font-medium">{account.withHoldTax != null ? (account.withHoldTax ? "Yes" : "No") : "—"}</span>
                                </div>
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

            {txnDialog && <DepositWithdrawDialog accountId={account.id} type={txnDialog} open={!!txnDialog} onOpenChange={() => setTxnDialog(null)} onSuccess={() => refetch()} />}
        </div>
    );
};

export default DepositAccountDetailPage;
