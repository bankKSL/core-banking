import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, Eye, Wallet, PiggyBank, Building2, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, type ColumnDef } from "@/components/shared/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { depositAccounts } from "@/mock/data";
import type { DepositAccount, DepositAccountType, DepositAccountStatus } from "@/types";

const TYPE_LABELS: Record<DepositAccountType, string> = {
  savings: "Savings", current: "Current", fixed_deposit: "Fixed Deposit", recurring_deposit: "Recurring Deposit",
};

const TYPE_ICONS: Record<DepositAccountType, React.ComponentType<any>> = {
  savings: PiggyBank, current: Building2, fixed_deposit: Wallet, recurring_deposit: TrendingUp,
};

const DepositAccountsPage: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<DepositAccountType | "all">("all");
  const [statusFilter, setStatusFilter] = useState<DepositAccountStatus | "all">("all");

  const stats = useMemo(() => ({
    total: depositAccounts.length,
    active: depositAccounts.filter((a) => a.status === "active").length,
    totalBalance: depositAccounts.reduce((s, a) => s + a.balance, 0),
    dormantFrozen: depositAccounts.filter((a) => a.status === "dormant" || a.status === "frozen").length,
  }), []);

  const filtered = useMemo(() => {
    let result = depositAccounts;
    const q = search.toLowerCase();
    if (q) result = result.filter((a) => a.customerName.toLowerCase().includes(q) || a.accountNumber.includes(q));
    if (typeFilter !== "all") result = result.filter((a) => a.type === typeFilter);
    if (statusFilter !== "all") result = result.filter((a) => a.status === statusFilter);
    return result;
  }, [search, typeFilter, statusFilter]);

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

  const columns: ColumnDef<DepositAccount>[] = [
    { key: "accountNumber", header: "Account No", cell: (r) => <code className="text-xs font-mono">{r.accountNumber}</code> },
    { key: "customerName", header: "Customer", cell: (r) => <span className="font-medium">{r.customerName}</span> },
    {
      key: "type", header: "Type",
      cell: (r) => { const Icon = TYPE_ICONS[r.type]; return <div className="flex items-center gap-1.5"><Icon className="h-4 w-4 text-gray-500" /><Badge variant="info" size="sm">{TYPE_LABELS[r.type]}</Badge></div>; },
    },
    { key: "balance", header: "Balance", cell: (r) => <span className="font-mono text-sm font-semibold">{formatCurrency(r.balance)}</span> },
    { key: "interestRate", header: "Rate", cell: (r) => r.interestRate > 0 ? `${r.interestRate}%` : <span className="text-gray-400">—</span> },
    { key: "status", header: "Status", cell: (r) => <StatusBadge status={r.status} size="sm" /> },
    { key: "branchName", header: "Branch" },
    { key: "accountOfficer", header: "Officer" },
    {
      key: "actions", header: "",
      cell: (r) => (
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(`/deposits/transactions?account=${r.id}`)}>
          <Eye className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Deposit Accounts" description="Manage savings, current, fixed deposit and recurring deposit accounts"
        actions={<Button onClick={() => navigate("/deposits/accounts/new")}><Plus className="mr-2 h-4 w-4" />New Account</Button>} />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard title="Total Accounts" value={stats.total} icon={Building2} />
        <StatCard title="Active" value={stats.active} variant="success" />
        <StatCard title="Total Balance" value={formatCurrency(stats.totalBalance)} variant="success" />
        <StatCard title="Dormant/Frozen" value={stats.dormantFrozen} variant="warning" />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Deposit Accounts</CardTitle>
          <div className="flex items-center gap-3">
            <div className="relative w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input placeholder="Search by customer or account..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
            </div>
            <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as DepositAccountType | "all")}>
              <SelectTrigger className="w-36"><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="savings">Savings</SelectItem>
                <SelectItem value="current">Current</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as DepositAccountStatus | "all")}>
              <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="dormant">Dormant</SelectItem>
                <SelectItem value="frozen">Frozen</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={filtered} emptyState={{ message: "No deposit accounts found" }} />
        </CardContent>
      </Card>
    </div>
  );
};

export default DepositAccountsPage;
