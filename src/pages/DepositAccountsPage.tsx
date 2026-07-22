import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, Eye, Pencil, ArrowDownCircle, ArrowUpCircle, CheckCircle2, Wallet, PiggyBank, Building2, TrendingUp, AlertTriangle, EyeIcon } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, type ColumnDef } from "@/components/shared/DataTable";
import { Pagination } from "@/components/shared/Pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useSavingsAccounts, SAVINGS_STATUS_CONFIG } from "@/features/deposits";
import type { SavingsAccount } from "@/features/deposits";

const PAGE_SIZE = 15;

const DepositAccountsPage: React.FC = () => {
    const navigate = useNavigate();
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [page, setPage] = useState(1);

    const {
        data: accountsData,
        isLoading,
        isError,
        error,
    } = useSavingsAccounts({
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
    });

    const data = accountsData?.pageItems ?? [];
    const totalFilteredRecords = accountsData?.totalFilteredRecords ?? 0;
    const totalPages = Math.max(1, Math.ceil(totalFilteredRecords / PAGE_SIZE));
    const safePage = Math.min(page, totalPages);

    const stats = useMemo(
        () => ({
            total: totalFilteredRecords,
            active: data.filter((a) => a.status?.code === "savingsAccountStatusType.active").length,
            totalBalance: data.reduce((s, a) => s + (a.accountBalance ?? 0), 0),
        }),
        [data, totalFilteredRecords],
    );

    const filtered = useMemo(() => {
        let result = data;
        const q = search.toLowerCase();
        if (q) result = result.filter((a) => (a.clientName ?? "").toLowerCase().includes(q) || a.accountNo.includes(q));
        if (statusFilter !== "all") result = result.filter((a) => a.status?.code === statusFilter);
        return result;
    }, [data, search, statusFilter]);

    const formatCurrency = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

    const columns: ColumnDef<SavingsAccount>[] = [
        { key: "accountNo", header: "Account No", cell: (r) => <code className="text-xs font-mono">{r.accountNo}</code> },
        {
            key: "clientName",
            header: "Customer",
            cell: (r) => <span className="font-medium">{r.clientName ?? `Client #${r.clientId}`}</span>,
        },
        { key: "savingsProductName", header: "Product" },
        {
            key: "accountBalance",
            header: "Balance",
            cell: (r) => <span className="font-mono text-sm font-semibold">{formatCurrency(r.accountBalance ?? 0)}</span>,
        },
        { key: "nominalAnnualInterestRate", header: "Rate", cell: (r) => `${r.nominalAnnualInterestRate ?? 0}%` },
        {
            key: "status",
            header: "Status",
            cell: (r) => {
                const c = SAVINGS_STATUS_CONFIG[r.status?.code ?? ""];
                return <StatusBadge status={c?.variant ?? "default"} label={c?.label ?? r.status?.code ?? "Unknown"} size="sm" />;
            },
        },
        { key: "savingsOfficerName", header: "Officer", cell: (r) => r.savingsOfficerName ?? "—" },
        {
            key: "actions",
            header: "",
            cell: (r) => (
                <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
                    {r.status?.code?.includes("submitted") && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 text-emerald-600"
                            onClick={() => navigate(`/deposits/savings-accounts/${r.id}/action/approve`)}
                            title="Approve"
                        >
                            <CheckCircle2 className="h-4 w-4" />
                        </Button>
                    )}
                    <Button variant="ghost" size="sm" className="h-8 w-8 text-blue-600" onClick={() => navigate(`/deposits/saving-accounts/edit/${r.id}`)} title="Edit">
                        <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 text-emerald-600"
                        onClick={() => navigate(`/deposits/saving-accounts/${r.id}/transactions/deposit`)}
                        title="Deposit"
                    >
                        <ArrowDownCircle className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 text-amber-600"
                        onClick={() => navigate(`/deposits/saving-accounts/${r.id}/transactions/withdrawal`)}
                        title="Withdraw"
                    >
                        <ArrowUpCircle className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8" onClick={() => navigate(`/deposits/saving-accounts/${r.id}`)} title="View">
                        <EyeIcon className="h-4 w-4" />
                    </Button>
                </div>
            ),
        },
    ];

    if (isError)
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <AlertTriangle className="mx-auto h-8 w-8 text-red-500 mb-2" />
                    <p className="text-red-600">Failed to load deposit accounts: {String(error)}</p>
                    <Button variant="outline" className="mt-2" onClick={() => window.location.reload()}>
                        Retry
                    </Button>
                </div>
            </div>
        );

    return (
        <div className="space-y-6">
            <PageHeader
                title="Deposit Accounts"
                description="Manage savings, current, fixed deposit and recurring deposit accounts"
                actions={
                    <Button onClick={() => navigate("/deposits/saving-accounts/new")}>
                        <Plus className="mr-2 h-4 w-4" />
                        New Account
                    </Button>
                }
            />

            {isLoading ? (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className="h-24 rounded-xl" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <StatCard title="Total Accounts" value={stats.total} icon={Building2} />
                    <StatCard title="Active" value={stats.active} variant="success" />
                    <StatCard title="Total Balance" value={formatCurrency(stats.totalBalance)} variant="success" />
                    <StatCard title="Dormant/Frozen" value={data.filter((a) => a.subStatus?.code === "dormant" || a.subStatus?.code === "frozen").length} variant="warning" />
                </div>
            )}

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Deposit Accounts</CardTitle>
                    <div className="flex items-center gap-3">
                        <div className="relative w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input placeholder="Search by customer or account..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-36">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All</SelectItem>
                                {Object.entries(SAVINGS_STATUS_CONFIG).map(([code, cfg]) => (
                                    <SelectItem key={code} value={code}>
                                        {cfg.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="space-y-4">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <Skeleton key={i} className="h-12 w-full" />
                            ))}
                        </div>
                    ) : (
                        <>
                            <DataTable
                                columns={columns}
                                data={filtered}
                                emptyState={{ message: "No deposit accounts found" }}
                                onRowClick={(r) => navigate(`/deposits/saving-accounts/${r.id}`)}
                            />
                            {totalPages > 1 && (
                                <div className="mt-4">
                                    <Pagination currentPage={safePage} totalPages={totalPages} onPageChange={setPage} totalItems={totalFilteredRecords} pageSize={PAGE_SIZE} />
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default DepositAccountsPage;
