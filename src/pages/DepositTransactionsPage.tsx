import React, { useState, useMemo } from "react";
import { Search, ArrowUpCircle, ArrowDownCircle, Download, Filter } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, type ColumnDef } from "@/components/shared/DataTable";
import { Pagination } from "@/components/shared/Pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { depositTransactions } from "@/mock/data";
import type { DepositTransaction, TransactionType, TransactionStatus } from "@/types";

const PAGE_SIZE = 10;

const TXN_LABELS: Record<TransactionType, string> = {
  cash_deposit: "Cash Deposit", cash_withdrawal: "Cash Withdrawal",
  cheque_deposit: "Cheque Deposit", cheque_withdrawal: "Cheque Withdrawal",
  transfer_in: "Transfer In", transfer_out: "Transfer Out",
  interest_credit: "Interest Credit", fee_debit: "Fee Debit",
  atm_withdrawal: "ATM Withdrawal", pos_payment: "POS Payment", standing_order: "Standing Order",
};

const isCredit = (t: TransactionType): boolean =>
  ["cash_deposit", "cheque_deposit", "transfer_in", "interest_credit"].includes(t);

const DepositTransactionsPage: React.FC = () => {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TransactionType | "all">("all");
  const [statusFilter, setStatusFilter] = useState<TransactionStatus | "all">("all");
  const [page, setPage] = useState(1);

  const stats = useMemo(() => {
    const credits = depositTransactions.filter((t) => isCredit(t.type) && t.status === "completed");
    const debits = depositTransactions.filter((t) => !isCredit(t.type) && t.status === "completed");
    return {
      total: depositTransactions.length,
      totalCredits: credits.reduce((s, t) => s + t.amount, 0),
      totalDebits: debits.reduce((s, t) => s + t.amount, 0),
    };
  }, []);

  const filtered = useMemo(() => {
    let result = depositTransactions;
    const q = search.toLowerCase();
    if (q) result = result.filter((t) => t.transactionId.toLowerCase().includes(q) || t.description.toLowerCase().includes(q) || t.accountNumber.includes(q));
    if (typeFilter !== "all") result = result.filter((t) => t.type === typeFilter);
    if (statusFilter !== "all") result = result.filter((t) => t.status === statusFilter);
    return result;
  }, [search, typeFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = useMemo(() => filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE), [filtered, safePage]);

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

  const columns: ColumnDef<DepositTransaction>[] = [
    { key: "transactionId", header: "Txn ID", cell: (r) => <code className="text-xs font-mono">{r.transactionId}</code> },
    { key: "accountNumber", header: "Account", cell: (r) => <code className="text-xs">{r.accountNumber}</code> },
    {
      key: "type", header: "Type",
      cell: (r) => {
        const credit = isCredit(r.type);
        return (
          <div className="flex items-center gap-1.5">
            {credit ? <ArrowDownCircle className="h-4 w-4 text-emerald-600" /> : <ArrowUpCircle className="h-4 w-4 text-red-600" />}
            <Badge variant={credit ? "success" : "error"} size="sm">{TXN_LABELS[r.type]}</Badge>
          </div>
        );
      },
    },
    {
      key: "amount", header: "Amount",
      cell: (r) => (
        <span className={`font-mono text-sm font-semibold ${isCredit(r.type) ? "text-emerald-700 dark:text-emerald-400" : "text-red-700 dark:text-red-400"}`}>
          {isCredit(r.type) ? "+" : "−"}{formatCurrency(r.amount)}
        </span>
      ),
    },
    { key: "balanceBefore", header: "Before", cell: (r) => <span className="font-mono text-xs text-gray-500">{formatCurrency(r.balanceBefore)}</span> },
    { key: "balanceAfter", header: "After", cell: (r) => <span className="font-mono text-sm">{formatCurrency(r.balanceAfter)}</span> },
    { key: "description", header: "Description", cell: (r) => <span className="text-xs max-w-45 truncate inline-block">{r.description}</span> },
    { key: "channel", header: "Channel", cell: (r) => <Badge variant="info" size="sm">{r.channel.toUpperCase()}</Badge> },
    { key: "status", header: "Status", cell: (r) => <StatusBadge status={r.status} size="sm" /> },
    {
      key: "transactionDate", header: "Date",
      cell: (r) => new Date(r.transactionDate).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }),
    },
    { key: "referenceNo", header: "Reference", cell: (r) => <code className="text-[10px]">{r.referenceNo}</code> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Transaction History" description="View all deposit and withdrawal transactions across accounts"
        actions={<Button variant="outline" size="sm"><Download className="mr-2 h-4 w-4" />Export</Button>} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard title="Total Transactions" value={stats.total} />
        <StatCard title="Total Credits" value={formatCurrency(stats.totalCredits)} variant="success" />
        <StatCard title="Total Debits" value={formatCurrency(stats.totalDebits)} variant="error" />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Transactions</CardTitle>
          <div className="flex items-center gap-3">
            <div className="relative w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input placeholder="Search by ID, description, account..." value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-10" />
            </div>
            <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v as TransactionType | "all"); setPage(1); }}>
              <SelectTrigger className="w-40"><Filter className="mr-2 h-4 w-4" /><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {Object.entries(TXN_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v as TransactionStatus | "all"); setPage(1); }}>
              <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="reversed">Reversed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={paginated} emptyState={{ message: "No transactions found" }} />
          <Pagination currentPage={safePage} totalPages={totalPages} onPageChange={setPage} totalItems={filtered.length} pageSize={PAGE_SIZE} />
        </CardContent>
      </Card>
    </div>
  );
};

export default DepositTransactionsPage;
