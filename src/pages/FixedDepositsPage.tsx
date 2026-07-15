import React, { useState, useMemo } from "react";
import { Search, Plus, Wallet, TrendingUp, Clock, CalendarClock, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, type ColumnDef } from "@/components/shared/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fixedDeposits, recurringDeposits } from "@/mock/data";
import type { FixedDeposit, RecurringDeposit, FixedDepositStatus, RecurringDepositStatus } from "@/types";

const FixedDepositsPage: React.FC = () => {
  const [fdSearch, setFdSearch] = useState("");
  const [fdStatus, setFdStatus] = useState<FixedDepositStatus | "all">("all");
  const [rdSearch, setRdSearch] = useState("");
  const [rdStatus, setRdStatus] = useState<RecurringDepositStatus | "all">("all");

  const fdStats = useMemo(() => ({
    total: fixedDeposits.length,
    active: fixedDeposits.filter((f) => f.status === "active").length,
    totalValue: fixedDeposits.filter((f) => f.status === "active").reduce((s, f) => s + f.principal, 0),
    matured: fixedDeposits.filter((f) => f.status === "matured").length,
  }), []);

  const rdStats = useMemo(() => ({
    total: recurringDeposits.length,
    active: recurringDeposits.filter((r) => r.status === "active").length,
    totalMonthly: recurringDeposits.filter((r) => r.status === "active").reduce((s, r) => s + r.monthlyInstallment, 0),
  }), []);

  const fdFiltered = useMemo(() => {
    let result = fixedDeposits;
    if (fdSearch) result = result.filter((f) => f.customerName.toLowerCase().includes(fdSearch.toLowerCase()) || f.fdNumber.includes(fdSearch));
    if (fdStatus !== "all") result = result.filter((f) => f.status === fdStatus);
    return result;
  }, [fdSearch, fdStatus]);

  const rdFiltered = useMemo(() => {
    let result = recurringDeposits;
    if (rdSearch) result = result.filter((r) => r.customerName.toLowerCase().includes(rdSearch.toLowerCase()) || r.rdNumber.includes(rdSearch));
    if (rdStatus !== "all") result = result.filter((r) => r.status === rdStatus);
    return result;
  }, [rdSearch, rdStatus]);

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

  const fdColumns: ColumnDef<FixedDeposit>[] = [
    { key: "fdNumber", header: "FD Number", cell: (r) => <code className="text-xs font-mono">{r.fdNumber}</code> },
    { key: "customerName", header: "Customer", cell: (r) => <span className="font-medium">{r.customerName}</span> },
    { key: "principal", header: "Principal", cell: (r) => <span className="font-mono text-sm font-semibold">{formatCurrency(r.principal)}</span> },
    { key: "interestRate", header: "Rate", cell: (r) => <span className="text-sm">{r.interestRate}%</span> },
    { key: "tenureMonths", header: "Tenure", cell: (r) => `${r.tenureMonths} mo` },
    {
      key: "maturityAmount", header: "Maturity",
      cell: (r) => <span className="font-mono text-sm text-emerald-700 dark:text-emerald-400">{formatCurrency(r.maturityAmount)}</span>,
    },
    { key: "maturityDate", header: "Matures On", cell: (r) => new Date(r.maturityDate).toLocaleDateString() },
    { key: "status", header: "Status", cell: (r) => <StatusBadge status={r.status} size="sm" /> },
    { key: "interestPayoutFrequency", header: "Payout", cell: (r) => <span className="text-xs capitalize">{r.interestPayoutFrequency}</span> },
    {
      key: "autoRenew", header: "Auto-Renew",
      cell: (r) => r.autoRenew ? <RefreshCw className="h-4 w-4 text-emerald-600" /> : <span className="text-xs text-gray-400">No</span>,
    },
    { key: "branchName", header: "Branch" },
  ];

  const rdColumns: ColumnDef<RecurringDeposit>[] = [
    { key: "rdNumber", header: "RD Number", cell: (r) => <code className="text-xs font-mono">{r.rdNumber}</code> },
    { key: "customerName", header: "Customer", cell: (r) => <span className="font-medium">{r.customerName}</span> },
    { key: "monthlyInstallment", header: "Monthly", cell: (r) => <span className="font-mono text-sm font-semibold">{formatCurrency(r.monthlyInstallment)}</span> },
    { key: "interestRate", header: "Rate", cell: (r) => `${r.interestRate}%` },
    {
      key: "installmentsPaid", header: "Progress",
      cell: (r) => (
        <div className="flex items-center gap-2">
          <span className="text-sm font-mono">{r.installmentsPaid}/{r.totalInstallments}</span>
          <div className="h-1.5 w-20 rounded-full bg-gray-200 dark:bg-gray-700">
            <div className="h-1.5 rounded-full bg-emerald-500" style={{ width: `${(r.installmentsPaid / r.totalInstallments) * 100}%` }} />
          </div>
        </div>
      ),
    },
    {
      key: "maturityAmount", header: "Maturity",
      cell: (r) => <span className="font-mono text-sm text-emerald-700">{formatCurrency(r.maturityAmount)}</span>,
    },
    { key: "maturityDate", header: "Matures On", cell: (r) => new Date(r.maturityDate).toLocaleDateString() },
    { key: "status", header: "Status", cell: (r) => <StatusBadge status={r.status} size="sm" /> },
    { key: "missedInstallments", header: "Missed", cell: (r) => r.missedInstallments > 0 ? <Badge variant="error" size="sm">{r.missedInstallments}</Badge> : <span className="text-xs text-gray-400">0</span> },
    { key: "branchName", header: "Branch" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Fixed & Recurring Deposits" description="Manage term deposits, track maturity, and monitor recurring deposit progress"
        actions={<Button><Plus className="mr-2 h-4 w-4" />New Deposit</Button>} />

      <Tabs defaultValue="fd" className="w-full">
        <TabsList>
          <TabsTrigger value="fd"><Wallet className="mr-2 h-4 w-4" />Fixed Deposits</TabsTrigger>
          <TabsTrigger value="rd"><TrendingUp className="mr-2 h-4 w-4" />Recurring Deposits</TabsTrigger>
        </TabsList>

        <TabsContent value="fd" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard title="Total FDs" value={fdStats.total} icon={Wallet} />
            <StatCard title="Active" value={fdStats.active} variant="success" />
            <StatCard title="Total Principal" value={formatCurrency(fdStats.totalValue)} variant="success" />
            <StatCard title="Matured" value={fdStats.matured} icon={Clock} />
          </div>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Fixed Deposits</CardTitle>
              <div className="flex items-center gap-3">
                <div className="relative w-80">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input placeholder="Search FDs..." value={fdSearch} onChange={(e) => setFdSearch(e.target.value)} className="pl-10" />
                </div>
                <Select value={fdStatus} onValueChange={(v) => setFdStatus(v as FixedDepositStatus | "all")}>
                  <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="matured">Matured</SelectItem>
                    <SelectItem value="premature_withdrawn">Premature</SelectItem>
                    <SelectItem value="renewed">Renewed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <DataTable columns={fdColumns} data={fdFiltered} emptyState={{ message: "No fixed deposits found" }} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rd" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <StatCard title="Total RDs" value={rdStats.total} icon={TrendingUp} />
            <StatCard title="Active" value={rdStats.active} variant="success" />
            <StatCard title="Monthly Commitment" value={formatCurrency(rdStats.totalMonthly)} />
          </div>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recurring Deposits</CardTitle>
              <div className="flex items-center gap-3">
                <div className="relative w-80">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input placeholder="Search RDs..." value={rdSearch} onChange={(e) => setRdSearch(e.target.value)} className="pl-10" />
                </div>
                <Select value={rdStatus} onValueChange={(v) => setRdStatus(v as RecurringDepositStatus | "all")}>
                  <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="matured">Matured</SelectItem>
                    <SelectItem value="premature_closed">Premature Closed</SelectItem>
                    <SelectItem value="defaulted">Defaulted</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <DataTable columns={rdColumns} data={rdFiltered} emptyState={{ message: "No recurring deposits found" }} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FixedDepositsPage;
