import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, Wallet, TrendingUp, Clock, Eye, AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, type ColumnDef } from "@/components/shared/DataTable";
import { Pagination } from "@/components/shared/Pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useFixedDepositAccounts, useRecurringDepositAccounts, FIXED_DEPOSIT_STATUS_CONFIG } from "@/features/deposits";
import type { FixedDepositAccount, RecurringDepositAccount } from "@/features/deposits";

const PAGE_SIZE = 15;

const formatCurrency = (n: number, code = "USD") => new Intl.NumberFormat("en-US", { style: "currency", currency: code, maximumFractionDigits: 0 }).format(n);

const FixedDepositsPage: React.FC = () => {
  const navigate = useNavigate();
  const [fdSearch, setFdSearch] = useState("");
  const [fdPage, setFdPage] = useState(1);
  const [rdSearch, setRdSearch] = useState("");
  const [rdPage, setRdPage] = useState(1);

  const { data: fdData, isLoading: fdLoading, isError: fdError } = useFixedDepositAccounts({ limit: PAGE_SIZE, offset: (fdPage - 1) * PAGE_SIZE });
  const { data: rdData, isLoading: rdLoading, isError: rdError } = useRecurringDepositAccounts({ limit: PAGE_SIZE, offset: (rdPage - 1) * PAGE_SIZE });

  const fds = fdData?.pageItems ?? [];
  const rds = rdData?.pageItems ?? [];

  const rdFiltered = useMemo(() => {
    if (!rdSearch) return rds;
    return rds.filter(r => (r.clientName??"").toLowerCase().includes(rdSearch.toLowerCase()) || r.accountNo.includes(rdSearch));
  }, [rds, rdSearch]);

  const fdStats = { total: fdData?.totalFilteredRecords ?? 0, active: fds.filter(f => f.status?.code?.includes("active")).length, totalValue: fds.reduce((s,f) => s + (f.depositAmount ?? 0), 0), matured: fds.filter(f => f.status?.code?.includes("matured")).length };
  const rdStats = { total: rdData?.totalFilteredRecords ?? 0, active: rds.filter(r => r.status?.code?.includes("active")).length, totalMonthly: rds.filter(r => r.status?.code?.includes("active")).reduce((s,r) => s + (r.recurringDepositAmount ?? 0), 0) };

  const fdColumns: ColumnDef<FixedDepositAccount>[] = [
    { key: "accountNo", header: "FD #", cell: r => <code className="text-xs font-mono">{r.accountNo}</code> },
    { key: "clientName", header: "Customer", cell: r => <span className="font-medium">{r.clientName ?? `#${r.clientId}`}</span> },
    { key: "depositProductName", header: "Product" },
    { key: "depositAmount", header: "Amount", cell: r => <span className="font-mono text-sm">{formatCurrency(r.depositAmount, r.currency.code)}</span> },
    { key: "interestRate", header: "Rate", cell: r => `${r.interestRate}%` },
    { key: "depositPeriod", header: "Period", cell: r => `${r.depositPeriod} ${r.depositPeriodFrequencyType?.value?.toLowerCase() ?? "mo"}` },
    { key: "maturityDate", header: "Matures", cell: r => r.maturityDate ? new Date(r.maturityDate).toLocaleDateString() : "—" },
    { key: "status", header: "Status", cell: r => { const c = FIXED_DEPOSIT_STATUS_CONFIG[r.status?.code ?? ""]; return <StatusBadge status={c?.variant ?? "default"} label={c?.label ?? r.status?.code} size="sm" />; } },
    { key: "actions", header: "", cell: r => (<Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(`/deposits/fixed/${r.id}`)}><Eye className="h-4 w-4" /></Button>) },
  ];

  const rdColumns: ColumnDef<RecurringDepositAccount>[] = [
    { key: "accountNo", header: "RD #", cell: r => <code className="text-xs font-mono">{r.accountNo}</code> },
    { key: "clientName", header: "Customer", cell: r => <span className="font-medium">{r.clientName ?? `#${r.clientId}`}</span> },
    { key: "depositProductName", header: "Product" },
    { key: "recurringDepositAmount", header: "Monthly", cell: r => <span className="font-mono text-sm">{formatCurrency(r.recurringDepositAmount, r.currency.code)}</span> },
    { key: "depositPeriod", header: "Period", cell: r => `${r.depositPeriod} ${r.depositPeriodFrequencyType?.value?.toLowerCase() ?? "mo"}` },
    { key: "expectedMaturityDate", header: "Matures", cell: r => r.expectedMaturityDate ? new Date(r.expectedMaturityDate).toLocaleDateString() : "—" },
    { key: "status", header: "Status", cell: r => { const c = FIXED_DEPOSIT_STATUS_CONFIG[r.status?.code ?? ""]; return <StatusBadge status={c?.variant ?? "default"} label={c?.label ?? r.status?.code} size="sm" />; } },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Fixed & Recurring Deposits" description="Manage term deposit accounts" actions={<Button onClick={() => navigate("/deposits/fixed/new")}><Plus className="mr-2 h-4 w-4" />New Fixed Deposit</Button>} />
      <Tabs defaultValue="fixed" className="w-full">
        <TabsList className="mb-4"><TabsTrigger value="fixed">Fixed Deposits</TabsTrigger><TabsTrigger value="recurring">Recurring Deposits</TabsTrigger></TabsList>
        <TabsContent value="fixed" className="space-y-6">
          {fdLoading ? (<div className="grid grid-cols-2 gap-4 sm:grid-cols-4">{Array.from({length:4}).map((_,i)=><Skeleton key={i} className="h-24 rounded-xl" />)}</div>) : fdError ? (<div className="text-red-600"><AlertTriangle className="inline h-4 w-4 mr-1" />Failed loading FDs</div>) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4"><StatCard title="Total FDs" value={fdStats.total} icon={Wallet} /><StatCard title="Active" value={fdStats.active} variant="success" /><StatCard title="Total Value" value={formatCurrency(fdStats.totalValue)} variant="success" /><StatCard title="Matured" value={fdStats.matured} icon={Clock} /></div>
          )}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between"><CardTitle>Fixed Deposits</CardTitle><div className="relative w-72"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" /><Input placeholder="Search..." value={fdSearch} onChange={e => setFdSearch(e.target.value)} className="pl-10" /></div></CardHeader>
            <CardContent>
              {fdLoading ? (<div className="space-y-2">{Array.from({length:5}).map((_,i)=><Skeleton key={i} className="h-12 w-full" />)}</div>) : fdError ? <p className="text-red-500">Failed to load fixed deposits.</p> : (<><DataTable columns={fdColumns} data={fds} emptyState={{message:"No fixed deposits found"}} />{fdData && fdData.totalFilteredRecords > PAGE_SIZE && <Pagination currentPage={fdPage} totalPages={Math.ceil(fdData.totalFilteredRecords/PAGE_SIZE)} onPageChange={setFdPage} totalItems={fdData.totalFilteredRecords} pageSize={PAGE_SIZE} />}</>)}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="recurring" className="space-y-6">
          {rdLoading ? (<div className="grid grid-cols-2 gap-4 sm:grid-cols-3">{Array.from({length:3}).map((_,i)=><Skeleton key={i} className="h-24 rounded-xl" />)}</div>) : rdError ? (<div className="text-red-600"><AlertTriangle className="inline h-4 w-4 mr-1" />Failed loading RDs</div>) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3"><StatCard title="Total RDs" value={rdStats.total} icon={TrendingUp} /><StatCard title="Active" value={rdStats.active} variant="success" /><StatCard title="Monthly Total" value={formatCurrency(rdStats.totalMonthly)} /></div>
          )}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between"><CardTitle>Recurring Deposits</CardTitle><div className="relative w-72"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" /><Input placeholder="Search..." value={rdSearch} onChange={e => setRdSearch(e.target.value)} className="pl-10" /></div></CardHeader>
            <CardContent>
              {rdLoading ? (<div className="space-y-2">{Array.from({length:5}).map((_,i)=><Skeleton key={i} className="h-12 w-full" />)}</div>) : rdError ? <p className="text-red-500">Failed to load recurring deposits.</p> : (<><DataTable columns={rdColumns} data={rdFiltered} emptyState={{message:"No recurring deposits found"}} />{rdData && rdData.totalFilteredRecords > PAGE_SIZE && <Pagination currentPage={rdPage} totalPages={Math.ceil(rdData.totalFilteredRecords/PAGE_SIZE)} onPageChange={setRdPage} totalItems={rdData.totalFilteredRecords} pageSize={PAGE_SIZE} />}</>)}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FixedDepositsPage;
