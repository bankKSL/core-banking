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
  useApproveSavingsAccount,
  useActivateSavingsAccount,
  useCloseSavingsAccount,
  SAVINGS_STATUS_CONFIG,
} from "@/features/deposits";
import { useMakeDeposit, useMakeWithdrawal } from "@/features/deposits";
import SavingsCharges from "@/features/deposits/components/SavingsCharges";
import DepositWithdrawDialog from "@/features/deposits/components/DepositWithdrawDialog";
import SavingsTransactions from "@/features/deposits/components/SavingsTransactions";

/** Normalize a date value from Finfact (string or number[]) to display string */
function fmtDate(v: unknown): string {
  if (!v) return "—";
  if (Array.isArray(v) && v.length >= 3) {
    const [y, m, d] = v;
    return new Date(y, m - 1, d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  }
  const s = String(v).split("T")[0];
  try {
    return new Date(s).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return s;
  }
}

const formatCurrency = (n?: number, code = "USD") =>
  n != null
    ? new Intl.NumberFormat("en-US", { style: "currency", currency: code, maximumFractionDigits: 2 }).format(n)
    : "—";

const InfoRow: React.FC<{ icon: React.ReactNode; label: string; value: React.ReactNode }> = ({
  icon,
  label,
  value,
}) => (
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
  const approveMutation = useApproveSavingsAccount();
  const activateMutation = useActivateSavingsAccount();
  const closeMutation = useCloseSavingsAccount();
  const [activeTab, setActiveTab] = useState("general");
  const [txnDialog, setTxnDialog] = useState<"deposit" | "withdrawal" | null>(null);
  const [acting, setActing] = useState(false);

  const summary = (account as any)?.summary ?? {};

  const handleCommand = useCallback(
    async (cmd: string) => {
      if (!account) return;
      setActing(true);
      const date = new Date().toISOString().split("T")[0];
      try {
        if (cmd === "approve")
          await approveMutation.mutateAsync({
            accountId: account.id,
            payload: { approvedOnDate: date, dateFormat: "yyyy-MM-dd", locale: "en" },
          });
        else if (cmd === "activate")
          await activateMutation.mutateAsync({
            accountId: account.id,
            payload: { activatedOnDate: date, dateFormat: "yyyy-MM-dd", locale: "en" },
          });
        else if (cmd === "close")
          await closeMutation.mutateAsync({
            accountId: account.id,
            payload: { closedOnDate: date, dateFormat: "yyyy-MM-dd", locale: "en" },
          });
        else if (cmd === "reject") await rejectMutation.mutateAsync(account.id);
        else if (cmd === "withdraw") await withdrawMutation.mutateAsync(account.id);
        else if (cmd === "undoreject") await undoRejectMutation.mutateAsync(account.id);
        refetch();
      } finally {
        setActing(false);
      }
    },
    [
      account,
      approveMutation,
      activateMutation,
      closeMutation,
      rejectMutation,
      withdrawMutation,
      undoRejectMutation,
      refetch,
    ],
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

  const a = account as any;
  const statusCode = a.status?.code ?? "";
  const statusConfig = SAVINGS_STATUS_CONFIG[statusCode];
  const isPending = a.status?.submittedAndPendingApproval === true;
  const isActive = a.status?.active === true;
  const isApproved = a.status?.approved === true && !isActive;
  const isRejected = a.status?.rejected === true;

  return (
    <div className="p-6 max-w-4xl m-auto space-y-6">
      <PageHeader
        title={`Account ${a.accountNo}`}
        description={`${a.savingsProductName ?? "Savings"} — ${a.clientName ?? `Client #${a.clientId}`}`}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            {statusConfig && (
              <Badge
                variant={
                  statusConfig.variant === "success" ? "success" : statusConfig.variant === "error" ? "error" : "info"
                }
              >
                {statusConfig.label}
              </Badge>
            )}
            {isPending && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCommand("approve")}
                  disabled={acting}
                  className="text-emerald-600 border-emerald-200"
                >
                  {acting && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
                  <CheckCircle2 className="mr-1 h-4 w-4" />
                  Approve
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCommand("reject")}
                  disabled={acting}
                  className="text-red-600"
                >
                  <XCircle className="mr-1 h-4 w-4" />
                  Reject
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCommand("withdraw")}
                  disabled={acting}
                  className="text-amber-600"
                >
                  Withdraw
                </Button>
              </>
            )}
            {isApproved && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCommand("activate")}
                disabled={acting}
                className="text-emerald-600"
              >
                {acting && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
                <CheckCircle2 className="mr-1 h-4 w-4" />
                Activate
              </Button>
            )}
            {isActive && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setTxnDialog("deposit")}
                  className="text-emerald-600"
                >
                  <ArrowDownCircle className="mr-1 h-4 w-4" />
                  Deposit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setTxnDialog("withdrawal")}
                  className="text-amber-600"
                >
                  <ArrowUpCircle className="mr-1 h-4 w-4" />
                  Withdraw
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCommand("close")}
                  disabled={acting}
                  className="text-gray-600"
                >
                  <XCircle className="mr-1 h-4 w-4" />
                  Close
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
                <InfoRow
                  icon={<Hash className="h-4 w-4" />}
                  label="Account No"
                  value={<code className="text-xs">{a.accountNo}</code>}
                />
                <InfoRow
                  icon={<Building2 className="h-4 w-4" />}
                  label="Product"
                  value={a.savingsProductName ?? a.savingsProductId}
                />
                <InfoRow icon={<User className="h-4 w-4" />} label="Client" value={a.clientName ?? `#${a.clientId}`} />
                <InfoRow
                  icon={<User className="h-4 w-4" />}
                  label="Field Officer ID"
                  value={a.fieldOfficerId != null && a.fieldOfficerId !== 0 ? a.fieldOfficerId : "—"}
                />
                <InfoRow
                  icon={<DollarSign className="h-4 w-4" />}
                  label="Balance"
                  value={
                    <span className="font-semibold">{formatCurrency(summary.accountBalance, a.currency?.code)}</span>
                  }
                />
                <InfoRow
                  icon={<Percent className="h-4 w-4" />}
                  label="Interest Rate"
                  value={`${a.nominalAnnualInterestRate ?? 0}%`}
                />
                <InfoRow
                  icon={<DollarSign className="h-4 w-4 text-emerald-500" />}
                  label="Available"
                  value={formatCurrency(summary.availableBalance, a.currency?.code)}
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
                  value={formatCurrency(summary.totalDeposits, a.currency?.code)}
                />
                <InfoRow
                  icon={<DollarSign className="h-4 w-4 text-amber-500" />}
                  label="Interest Earned"
                  value={formatCurrency(summary.totalInterestEarned, a.currency?.code)}
                />
                <InfoRow
                  icon={<DollarSign className="h-4 w-4 text-amber-500" />}
                  label="Interest Posted"
                  value={formatCurrency(summary.totalInterestPosted, a.currency?.code)}
                />
                <InfoRow
                  icon={<Clock className="h-4 w-4" />}
                  label="Last Transaction"
                  value={fmtDate(a.lastActiveTransactionDate)}
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
                  value={fmtDate(a.timeline?.submittedOnDate)}
                />
                <InfoRow
                  icon={<Calendar className="h-4 w-4" />}
                  label="Approved"
                  value={fmtDate(a.timeline?.approvedOnDate)}
                />
                <InfoRow
                  icon={<Calendar className="h-4 w-4" />}
                  label="Activated"
                  value={fmtDate(a.timeline?.activatedOnDate)}
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
                  <span className="text-gray-500">Interest Rate:</span>{" "}
                  <span className="font-medium">{a.nominalAnnualInterestRate ?? 0}%</span>
                </div>
                <div>
                  <span className="text-gray-500">Compounding:</span>{" "}
                  <span className="font-medium">{a.interestCompoundingPeriodType?.value ?? "—"}</span>
                </div>
                <div>
                  <span className="text-gray-500">Posting:</span>{" "}
                  <span className="font-medium">{a.interestPostingPeriodType?.value ?? "—"}</span>
                </div>
                <div>
                  <span className="text-gray-500">Calculation:</span>{" "}
                  <span className="font-medium">{a.interestCalculationType?.value ?? "—"}</span>
                </div>
                <div>
                  <span className="text-gray-500">Days/Year:</span>{" "}
                  <span className="font-medium">{a.interestCalculationDaysInYearType?.value ?? "—"}</span>
                </div>
                <div>
                  <span className="text-gray-500">Min Opening Balance:</span>{" "}
                  <span className="font-medium">
                    {a.minRequiredOpeningBalance != null
                      ? formatCurrency(a.minRequiredOpeningBalance, a.currency?.code)
                      : "—"}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Withdrawal Fee (Transfers):</span>{" "}
                  <span className="font-medium">{a.withdrawalFeeForTransfers ? "Yes" : "No"}</span>
                </div>
                <div>
                  <span className="text-gray-500">Allow Overdraft:</span>{" "}
                  <span className="font-medium">{a.allowOverdraft ? "Yes" : "No"}</span>
                </div>
                <div>
                  <span className="text-gray-500">Withhold Tax:</span>{" "}
                  <span className="font-medium">{a.withHoldTax ? "Yes" : "No"}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="charges" className="mt-0">
          <SavingsCharges accountId={a.id} />
        </TabsContent>
        <TabsContent value="transactions" className="mt-0">
          <SavingsTransactions transactions={a?.transactions ?? []} />
        </TabsContent>
      </Tabs>

      {txnDialog && (
        <DepositWithdrawDialog
          accountId={a.id}
          type={txnDialog}
          open={!!txnDialog}
          onOpenChange={() => setTxnDialog(null)}
          onSuccess={() => refetch()}
        />
      )}
    </div>
  );
};

export default DepositAccountDetailPage;
