import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, PiggyBank, Calendar, Clock, DollarSign, Percent, Building2, User, AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useSavingsAccount, SAVINGS_STATUS_CONFIG } from "@/features/deposits";
import type { SavingsTransaction } from "@/features/deposits";

const formatCurrency = (n: number, code = "USD") => new Intl.NumberFormat("en-US", { style: "currency", currency: code, maximumFractionDigits: 2 }).format(n);

const InfoRow: React.FC<{ icon: React.ReactNode; label: string; value: React.ReactNode }> = ({ icon, label, value }) => (
  <div className="flex items-start gap-3 py-2"><span className="mt-0.5 text-gray-400">{icon}</span><div className="min-w-0 flex-1"><p className="text-xs font-medium text-gray-500">{label}</p><p className="text-sm text-gray-900 dark:text-gray-100">{value}</p></div></div>
);

const DepositAccountDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: account, isLoading, isError, error, refetch } = useSavingsAccount(id);

  if (isLoading) return (
    <div className="p-6 max-w-3xl m-auto space-y-6"><Skeleton className="h-10 w-64" /><div className="grid grid-cols-1 gap-6 lg:grid-cols-2">{[1,2,3,4].map(i=>(<Skeleton key={i} className="h-40 rounded-xl" />))}</div></div>
  );

  if (isError || !account) return (
    <div className="flex items-center justify-center h-64"><div className="text-center"><AlertTriangle className="mx-auto h-8 w-8 text-red-500 mb-2" /><p className="text-red-600">Failed to load: {String(error)}</p><Button variant="outline" className="mt-2" onClick={() => refetch()}>Retry</Button></div></div>
  );

  const statusConfig = SAVINGS_STATUS_CONFIG[account.status?.code ?? ""];
  const txns: SavingsTransaction[] = account.transactions ?? [];

  return (
    <div className="p-6 max-w-4xl m-auto space-y-6">
      <PageHeader title={`Account ${account.accountNo}`} description={`${account.savingsProductName ?? "Savings Account"} — ${account.clientName ?? `Client #${account.clientId}`}`}
        actions={
          <div className="flex items-center gap-2">
            {statusConfig && <Badge variant={statusConfig.variant === "success" ? "success" : statusConfig.variant === "error" ? "error" : "default" }>{statusConfig.label}</Badge>}
            <Button variant="outline" onClick={() => navigate("/deposits/accounts")}><ArrowLeft className="mr-2 h-4 w-4" />Back</Button>
          </div>
        }
      />

      <Separator />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><PiggyBank className="h-4 w-4 text-emerald-500" />Account Info</CardTitle></CardHeader>
          <CardContent className="divide-y divide-gray-100 dark:divide-gray-800">
            <InfoRow icon={<Hash className="h-4 w-4" />} label="Account No" value={<code className="text-xs">{account.accountNo}</code>} />
            <InfoRow icon={<Building2 className="h-4 w-4" />} label="Product" value={account.savingsProductName ?? account.productId} />
            <InfoRow icon={<User className="h-4 w-4" />} label="Client" value={account.clientName ?? `#${account.clientId}`} />
            <InfoRow icon={<User className="h-4 w-4" />} label="Officer" value={account.savingsOfficerName ?? "—"} />
            <InfoRow icon={<DollarSign className="h-4 w-4 text-emerald-600" />} label="Current Balance" value={<span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">{formatCurrency(account.accountBalance, account.currency.code)}</span>} />
            <InfoRow icon={<DollarSign className="h-4 w-4 text-blue-600" />} label="Available Balance" value={<span className="font-mono">{formatCurrency(account.availableBalance ?? account.accountBalance, account.currency.code)}</span>} />
            <InfoRow icon={<Percent className="h-4 w-4" />} label="Interest Rate" value={`${account.nominalAnnualInterestRate}% p.a.`} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><DollarSign className="h-4 w-4 text-blue-500" />Activity</CardTitle></CardHeader>
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

        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><DollarSign className="h-4 w-4 text-gray-400" />Recent Transactions</CardTitle></CardHeader>
          <CardContent>
            {txns.length === 0 ? <p className="text-sm text-gray-400">No transactions yet</p> : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {txns.slice(-10).reverse().map((t) => (
                  <div key={t.id} className="flex items-center justify-between rounded border p-2 text-xs">
                    <div><span className="font-mono text-xs">{t.transactionType?.value ?? t.transactionType?.code}</span><br /><span className="text-gray-400">{new Date(t.date).toLocaleDateString()}</span></div>
                    <span className={`font-mono font-semibold ${t.amount > 0 ? "text-emerald-600" : "text-red-600"}`}>{formatCurrency(t.amount, t.currency.code)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

function Hash(props: React.SVGProps<SVGSVGElement>) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="9" y2="9"/><line x1="4" x2="20" y1="15" y2="15"/><line x1="10" x2="8" y1="3" y2="21"/><line x1="16" x2="14" y1="3" y2="21"/></svg>;
}

export default DepositAccountDetailPage;
