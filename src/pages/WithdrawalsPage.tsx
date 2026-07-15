import React, { useState, useMemo, useCallback } from "react";
import { Search, ArrowUpCircle, ShieldAlert, CreditCard, Building, Smartphone, AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { DataTable, type ColumnDef } from "@/components/shared/DataTable";
import { Pagination } from "@/components/shared/Pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { depositTransactions, depositAccounts, withdrawalLimits } from "@/mock/data";
import type { DepositTransaction, DepositAccount, WithdrawalLimit, DepositAccountType } from "@/types";

const PAGE_SIZE = 8;

const WithdrawalsPage: React.FC = () => {
  const [search, setSearch] = useState("");
  const [channelFilter, setChannelFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [newWithdrawal, setNewWithdrawal] = useState<{ account: DepositAccount | null; amount: number }>({ account: null, amount: 0 });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const withdrawals = useMemo(
    () => depositTransactions.filter((t) => ["cash_withdrawal", "atm_withdrawal", "cheque_withdrawal", "transfer_out", "pos_payment", "fee_debit"].includes(t.type)),
    [],
  );

  const stats = useMemo(() => {
    const today = withdrawals.filter((t) => {
      const d = new Date(t.transactionDate);
      const now = new Date();
      return d.toDateString() === now.toDateString();
    });
    return {
      totalToday: today.length,
      amountToday: today.reduce((s, t) => s + t.amount, 0),
      totalAll: withdrawals.length,
      amountAll: withdrawals.reduce((s, t) => s + t.amount, 0),
    };
  }, [withdrawals]);

  const filtered = useMemo(() => {
    let result = withdrawals;
    const q = search.toLowerCase();
    if (q) result = result.filter((t) => t.accountNumber.includes(q) || t.description.toLowerCase().includes(q));
    if (channelFilter !== "all") result = result.filter((t) => t.channel === channelFilter);
    return result;
  }, [withdrawals, search, channelFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = useMemo(() => filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE), [filtered, safePage]);

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

  const getLimit = (acctType: DepositAccountType): WithdrawalLimit | undefined =>
    withdrawalLimits.find((l) => l.accountType === acctType);

  const openWithdrawDialog = (account: DepositAccount) => {
    setNewWithdrawal({ account, amount: 0 });
    setErrorMsg("");
    setDialogOpen(true);
  };

  const validateWithdrawal = (): boolean => {
    if (!newWithdrawal.account) return false;
    const acct = newWithdrawal.account;
    const amt = newWithdrawal.amount;
    const limit = getLimit(acct.type);
    if (amt <= 0) { setErrorMsg("Amount must be greater than zero"); return false; }
    if (amt > acct.balance) { setErrorMsg(`Insufficient balance. Available: ${formatCurrency(acct.balance)}`); return false; }
    if (limit && amt > limit.perTransactionLimit) { setErrorMsg(`Exceeds per-transaction limit of ${formatCurrency(limit.perTransactionLimit)}`); return false; }
    if (acct.status === "frozen") { setErrorMsg("Account is frozen. Withdrawals not allowed."); return false; }
    if (acct.status === "dormant") { setErrorMsg("Account is dormant. Please reactivate."); return false; }
    setErrorMsg("");
    return true;
  };

  const confirmWithdrawal = useCallback(() => {
    if (!validateWithdrawal() || !newWithdrawal.account) return;
    alert(`Withdrawal of ${formatCurrency(newWithdrawal.amount)} from ${newWithdrawal.account.accountNumber} processed successfully!`);
    setDialogOpen(false);
  }, [newWithdrawal]);

  const columns: ColumnDef<DepositTransaction>[] = [
    { key: "transactionId", header: "Txn ID", cell: (r) => <code className="text-xs font-mono">{r.transactionId}</code> },
    { key: "accountNumber", header: "Account", cell: (r) => <code className="text-xs">{r.accountNumber}</code> },
    {
      key: "type", header: "Type",
      cell: (r) => {
        const labels: Record<string, string> = { cash_withdrawal: "Cash", atm_withdrawal: "ATM", cheque_withdrawal: "Cheque", transfer_out: "Transfer", pos_payment: "POS", fee_debit: "Fee" };
        return <Badge variant="error" size="sm">{labels[r.type] ?? r.type}</Badge>;
      },
    },
    { key: "amount", header: "Amount", cell: (r) => <span className="font-mono text-sm font-semibold text-red-700">−{formatCurrency(r.amount)}</span> },
    { key: "channel", header: "Channel", cell: (r) => <Badge variant="info" size="sm">{r.channel.toUpperCase()}</Badge> },
    { key: "description", header: "Description", cell: (r) => <span className="text-xs max-w-50 truncate inline-block">{r.description}</span> },
    { key: "balanceAfter", header: "Remaining", cell: (r) => <span className="font-mono text-xs">{formatCurrency(r.balanceAfter)}</span> },
    {
      key: "transactionDate", header: "Date",
      cell: (r) => new Date(r.transactionDate).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Withdrawals" description="Monitor and process account withdrawals with limit enforcement" />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard title="Today's Withdrawals" value={stats.totalToday} icon={ArrowUpCircle} variant="error" />
        <StatCard title="Today's Amount" value={formatCurrency(stats.amountToday)} variant="error" />
        <StatCard title="Total Withdrawals" value={stats.totalAll} />
        <StatCard title="Total Amount" value={formatCurrency(stats.amountAll)} />
      </div>

      {/* Quick Withdraw */}
      <Card className="rounded-xl border">
        <CardHeader><CardTitle className="text-lg">Quick Withdraw</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <Select onValueChange={(v) => {
              const acct = depositAccounts.find((a) => a.id === v);
              if (acct) openWithdrawDialog(acct);
            }}>
              <SelectTrigger className="w-full sm:w-72"><SelectValue placeholder="Select account to withdraw from..." /></SelectTrigger>
              <SelectContent>
                {depositAccounts.filter((a) => a.status === "active" && (a.type === "savings" || a.type === "current")).map((a) => (
                  <SelectItem key={a.id} value={a.id}>{a.accountNumber} — {a.customerName} ({formatCurrency(a.balance)})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Search withdrawals..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-10" />
        </div>
        <Select value={channelFilter} onValueChange={(v) => { setChannelFilter(v); setPage(1); }}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Channel" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Channels</SelectItem>
            <SelectItem value="branch">Branch</SelectItem>
            <SelectItem value="atm">ATM</SelectItem>
            <SelectItem value="online">Online</SelectItem>
            <SelectItem value="pos">POS</SelectItem>
            <SelectItem value="mobile">Mobile</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable columns={columns} data={paginated} emptyState={{ message: "No withdrawals found" }} />
      <Pagination currentPage={safePage} totalPages={totalPages} onPageChange={setPage} totalItems={filtered.length} pageSize={PAGE_SIZE} />

      {/* Withdraw Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Process Withdrawal</DialogTitle>
            <DialogDescription>
              Account: <strong>{newWithdrawal.account?.accountNumber}</strong> — {newWithdrawal.account?.customerName}
              <br />Available Balance: <strong>{newWithdrawal.account ? formatCurrency(newWithdrawal.account.balance) : "—"}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Input label="Amount" type="number" value={newWithdrawal.amount || ""}
              onChange={(e) => setNewWithdrawal((w) => ({ ...w, amount: Number(e.target.value) }))} />
            {newWithdrawal.account && (
              <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-3 space-y-1 text-xs">
                <p className="font-medium text-gray-700 dark:text-gray-300">Withdrawal Limits — {newWithdrawal.account.type.toUpperCase()}</p>
                {(() => {
                  const limit = getLimit(newWithdrawal.account.type);
                  if (!limit) return <p className="text-gray-400">No withdrawal allowed (FD/RD accounts)</p>;
                  return (
                    <>
                      <p>Per Transaction: {formatCurrency(limit.perTransactionLimit)}</p>
                      <p>Daily Limit: {formatCurrency(limit.dailyLimit)}</p>
                      <p>ATM Daily: {formatCurrency(limit.atmDailyLimit)}</p>
                    </>
                  );
                })()}
              </div>
            )}
            {errorMsg && (
              <div className="flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-700 dark:text-red-400">
                <AlertTriangle className="h-4 w-4" />{errorMsg}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={confirmWithdrawal}>Confirm Withdrawal</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WithdrawalsPage;
