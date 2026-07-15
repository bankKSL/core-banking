import React, { useMemo } from "react";
import {
    LayoutDashboard,
    PlayCircle,
    Clock,
    AlertCircle,
    ArrowRight,
    Banknote,
    Users,
    TrendingUp,
    DollarSign,
    PiggyBank,
    ArrowDownCircle,
    ArrowUpCircle,
    Wallet,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { campaigns, executionLogs, loanApplications, depositAccounts, depositTransactions } from "@/mock/data";
import type { Campaign } from "@/types";
import { useNavigate } from "react-router-dom";

const Dashboard: React.FC = () => {
    const navigate = useNavigate();

    const stats = useMemo(() => {
        const total = campaigns.length;
        const active = campaigns.filter((c) => c.status === "active").length;
        const scheduled = campaigns.filter((c) => c.status === "scheduled").length;
        const expired = campaigns.filter((c) => c.status === "expired").length;
        return { total, active, scheduled, expired };
    }, []);

    const recentCampaigns = useMemo(() => {
        return [...campaigns].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 5);
    }, []);

    const recentLogs = useMemo(() => {
        return [...executionLogs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 5);
    }, []);

    const formatDate = (d: string) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

    const formatCurrency = (n: number) =>
        new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

    const lendingStats = useMemo(() => {
        const total = loanApplications.length;
        const pending = loanApplications.filter((a) => a.status === "pending" || a.status === "under_review").length;
        const approved = loanApplications.filter((a) => a.status === "approved" || a.status === "disbursed").length;
        const active = loanApplications.filter((a) => a.status === "active").length;
        const disbursed = loanApplications
            .filter((a) => a.status === "active" || a.status === "disbursed" || a.status === "closed")
            .reduce((sum, a) => sum + a.amount, 0);
        return { total, pending, approved, active, disbursed };
    }, []);

    const depositStats = useMemo(
        () => ({
            totalAccounts: depositAccounts.filter((a) => a.status === "active").length,
            totalBalance: depositAccounts.filter((a) => a.status === "active").reduce((s, a) => s + a.balance, 0),
            totalCredits: depositTransactions
                .filter((t) => ["cash_deposit", "transfer_in", "cheque_deposit", "interest_credit"].includes(t.type))
                .reduce((s, t) => s + t.amount, 0),
            totalDebits: depositTransactions
                .filter((t) => ["cash_withdrawal", "transfer_out", "atm_withdrawal", "pos_payment"].includes(t.type))
                .reduce((s, t) => s + t.amount, 0),
        }),
        [],
    );

    const priorityLabel: Record<Campaign["priority"], string> = {
        1: "P1 - Critical",
        2: "P2 - High",
        3: "P3 - Medium",
        4: "P4 - Low",
        5: "P5 - Lowest",
    };
    const priorityColor: Record<Campaign["priority"], string> = {
        1: "text-red-600 dark:text-red-400 font-semibold",
        2: "text-orange-600 dark:text-orange-400 font-semibold",
        3: "text-yellow-600 dark:text-yellow-400",
        4: "text-blue-600 dark:text-blue-400",
        5: "text-gray-500 dark:text-gray-400",
    };

    return (
        <div className="space-y-8">
            <PageHeader title="Dashboard" description="Formula Engine Overview" actions={<></>} />
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard title="Total Campaigns" value={stats.total} icon={LayoutDashboard} variant="default" />
                <StatCard title="Active" value={stats.active} icon={PlayCircle} variant="success" />
                <StatCard title="Scheduled" value={stats.scheduled} icon={Clock} variant="warning" />
                <StatCard title="Expired" value={stats.expired} icon={AlertCircle} variant="error" />
            </div>

            {/* Lending Overview */}
            <div className="mt-2">
                <h2 className="mb-4 text-lg font-semibold text-gray-700 dark:text-gray-300">Lending Overview</h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
                    <StatCard title="Loan Applications" value={lendingStats.total} icon={Banknote} />
                    <StatCard title="Pending Review" value={lendingStats.pending} variant="warning" />
                    <StatCard title="Approved" value={lendingStats.approved} icon={Users} variant="success" />
                    <StatCard title="Active Loans" value={lendingStats.active} icon={TrendingUp} variant="success" />
                    <StatCard title="Total Disbursed" value={formatCurrency(lendingStats.disbursed)} icon={DollarSign} />
                </div>
            </div>

            {/* Deposits Overview */}
            <div className="mt-2">
                <h2 className="mb-4 text-lg font-semibold text-gray-700 dark:text-gray-300">Deposits Overview</h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard title="Active Accounts" value={depositStats.totalAccounts} icon={PiggyBank} />
                    <StatCard title="Total Balance" value={formatCurrency(depositStats.totalBalance)} icon={Wallet} variant="success" />
                    <StatCard
                        title="Total Deposits"
                        value={formatCurrency(depositStats.totalCredits)}
                        icon={ArrowDownCircle}
                        variant="success"
                    />
                    <StatCard
                        title="Total Withdrawals"
                        value={formatCurrency(depositStats.totalDebits)}
                        icon={ArrowUpCircle}
                        variant="error"
                    />
                </div>
            </div>

            {/* Recent Loan Applications */}
            <Card className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-lg font-semibold">Recent Loan Applications</CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => navigate("/lending/applications")}>
                        View All
                        <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Application ID</TableHead>
                                <TableHead>Customer</TableHead>
                                <TableHead>Product</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Date</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loanApplications.slice(0, 5).map((app) => (
                                <TableRow key={app.id} className="cursor-pointer" onClick={() => navigate("/lending/applications")}>
                                    <TableCell className="font-mono text-xs">{app.applicationId}</TableCell>
                                    <TableCell className="font-medium">{app.customerName}</TableCell>
                                    <TableCell>{app.productName}</TableCell>
                                    <TableCell>{formatCurrency(app.amount)}</TableCell>
                                    <TableCell>
                                        <StatusBadge status={app.status} size="sm" />
                                    </TableCell>
                                    <TableCell className="text-xs text-gray-500">
                                        {new Date(app.appliedDate).toLocaleDateString()}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {loanApplications.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                                        No loan applications found
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Recent Campaigns */}
            <Card className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-lg font-semibold">Recent Campaigns</CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => navigate("/campaigns")}>
                        View All
                        <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Campaign Name</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Priority</TableHead>
                                <TableHead>Start Date</TableHead>
                                <TableHead>End Date</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {recentCampaigns.map((c) => (
                                <TableRow key={c.id} className="cursor-pointer" onClick={() => navigate("/campaigns")}>
                                    <TableCell className="font-medium text-gray-900 dark:text-gray-100">{c.name}</TableCell>
                                    <TableCell>
                                        <StatusBadge status={c.status} />
                                    </TableCell>
                                    <TableCell>
                                        <span className={priorityColor[c.priority]}>{priorityLabel[c.priority]}</span>
                                    </TableCell>
                                    <TableCell>{formatDate(c.startDate)}</TableCell>
                                    <TableCell>{formatDate(c.endDate)}</TableCell>
                                </TableRow>
                            ))}
                            {recentCampaigns.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                                        No campaigns found
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Recent Execution Logs */}
            <Card className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-lg font-semibold">Recent Execution Logs</CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => navigate("/execution-logs")}>
                        View All
                        <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Execution ID</TableHead>
                                <TableHead>Campaign</TableHead>
                                <TableHead>Matched</TableHead>
                                <TableHead>Duration</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Timestamp</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {recentLogs.map((log) => (
                                <TableRow key={log.id}>
                                    <TableCell className="font-mono text-xs">{log.executionId}</TableCell>
                                    <TableCell className="max-w-50 truncate">{log.campaignName}</TableCell>
                                    <TableCell>
                                        <span
                                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${log.matched ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"}`}
                                        >
                                            {log.matched ? "Yes" : "No"}
                                        </span>
                                    </TableCell>
                                    <TableCell>{log.duration} ms</TableCell>
                                    <TableCell>
                                        <StatusBadge status={log.status} />
                                    </TableCell>
                                    <TableCell className="text-gray-500 text-xs">{new Date(log.timestamp).toLocaleString()}</TableCell>
                                </TableRow>
                            ))}
                            {recentLogs.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                                        No execution logs found
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
};

export default Dashboard;
