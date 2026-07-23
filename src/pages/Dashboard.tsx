import { useState, useEffect } from "react";
import { Users, Landmark, PiggyBank, Settings, DollarSign, Calendar, ArrowUpRight, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { fetchClients } from "@/features/clients";
import { fetchLoans } from "@/features/loans";
import { fetchSavingsAccounts } from "@/features/deposits";
import { LOAN_STATUS_ID_MAP } from "@/features/loans/constants/status";
import type { Loan } from "@/features/loans/types/loan";

// ─── Constants ───────────────────────────────────────────────────────────

const LOAN_STATUS_PENDING = 100;
const LOAN_STATUS_ACTIVE = 300;
const LOAN_STATUS_CLOSED = 600;

const LOAN_DONUT_COLORS = {
    active: "#2ecc71",
    pending: "#f39c12",
    closed: "#95a5a6",
} as const;

const SAVINGS_DONUT_COLORS = {
    active: "#3498db",
    pending: "#f39c12",
} as const;

// ─── SVG Donut Chart Component ──────────────────────────────────────────

interface DonutChartProps {
    data: Array<{ label: string; value: number; color: string }>;
}

const DonutChart: React.FC<DonutChartProps> = ({ data }) => {
    const total = data.reduce((s, d) => s + d.value, 0);
    const radius = 40;
    const circumference = 2 * Math.PI * radius;

    let cumulative = 0;
    const segments = data.map((d) => {
        const fraction = total > 0 ? d.value / total : 0;
        const offset = cumulative * circumference;
        const length = fraction * circumference;
        cumulative += fraction;
        return { ...d, offset, length };
    });

    return (
        <div className="flex flex-col items-center gap-3">
            <svg width="100" height="100" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="12" />
                {segments.map((seg) => (
                    <circle
                        key={seg.label}
                        cx="50"
                        cy="50"
                        r={radius}
                        fill="none"
                        stroke={seg.color}
                        strokeWidth="12"
                        strokeDasharray={`${seg.length} ${circumference - seg.length}`}
                        strokeDashoffset={-seg.offset}
                        transform="rotate(-90 50 50)"
                        style={{ transition: "stroke-dasharray 0.5s ease" }}
                    />
                ))}
                <text x="50" y="48" textAnchor="middle" className="text-lg font-bold fill-gray-900 dark:fill-gray-100" fontSize="16">
                    {total}
                </text>
                <text x="50" y="62" textAnchor="middle" className="text-[8px] fill-gray-500 dark:fill-gray-400" fontSize="8">
                    Total
                </text>
            </svg>
            <div className="flex flex-wrap justify-center gap-3">
                {segments.map((seg) => (
                    <div key={seg.label} className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: seg.color }} />
                        <span>{seg.label}</span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">{seg.value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

// ─── Helpers ───────────────────────────────────────────────────────────────

const formatCurrency = (n: number, code = "USD") => new Intl.NumberFormat("en-US", { style: "currency", currency: code, maximumFractionDigits: 0 }).format(n);

const formatDate = (d: string) => {
    const date = new Date(d);
    return isNaN(date.getTime()) ? d : date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const resolveStatusString = (loan: Loan): string => {
    if (loan.status?.code) return loan.status.code;
    if (loan.status?.id != null) return LOAN_STATUS_ID_MAP[loan.status.id] ?? "Unknown";
    return "Unknown";
};

// ─── Dashboard Component ─────────────────────────────────────────────────

const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [clientCount, setClientCount] = useState(0);
    const [activeLoans, setActiveLoans] = useState(0);
    const [pendingLoans, setPendingLoans] = useState<Loan[]>([]);
    const [closedLoans, setClosedLoans] = useState(0);
    const [savingsCount, setSavingsCount] = useState(0);
    const [savingsPending, setSavingsPending] = useState(0);
    const [savingsActive, setSavingsActive] = useState(0);
    const [apiUrl, setApiUrl] = useState("");

    useEffect(() => {
        setApiUrl(import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080");
    }, []);

    useEffect(() => {
        let cancelled = false;

        async function loadDashboard() {
            setLoading(true);
            try {
                const [clientRes, activeRes, pendingRes, closedRes, savingsRes] = await Promise.all([
                    fetchClients({ offset: 0, limit: 1 }),
                    fetchLoans({ offset: 0, limit: 1, loanStatus: LOAN_STATUS_ACTIVE }),
                    fetchLoans({ offset: 0, limit: 50, loanStatus: LOAN_STATUS_PENDING }),
                    fetchLoans({ offset: 0, limit: 1, loanStatus: LOAN_STATUS_CLOSED }),
                    fetchSavingsAccounts({ offset: 0, limit: 100 }),
                ]);

                if (cancelled) return;

                setClientCount(clientRes.totalFilteredRecords ?? 0);
                setActiveLoans(activeRes.totalFilteredRecords ?? 0);
                setPendingLoans(pendingRes.pageItems ?? []);
                setClosedLoans(closedRes.totalFilteredRecords ?? 0);

                const totalSavings = savingsRes.totalFilteredRecords ?? 0;
                setSavingsCount(totalSavings);

                const items = savingsRes.pageItems ?? [];
                let act = 0;
                let pend = 0;
                for (const acct of items) {
                    if (acct.status?.id === 300) act++;
                    if (acct.status?.id === 100) pend++;
                }
                setSavingsActive(act);
                setSavingsPending(pend);
            } catch {
                // Silently handle — dashboard should not crash the app
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        loadDashboard();
        return () => {
            cancelled = true;
        };
    }, []);

    const loanChartData = [
        { label: "Active", value: activeLoans, color: LOAN_DONUT_COLORS.active },
        { label: "Pending", value: pendingLoans.length, color: LOAN_DONUT_COLORS.pending },
        { label: "Closed", value: closedLoans, color: LOAN_DONUT_COLORS.closed },
    ];

    const savingsChartData = [
        { label: "Active", value: savingsActive, color: SAVINGS_DONUT_COLORS.active },
        { label: "Pending", value: savingsPending, color: SAVINGS_DONUT_COLORS.pending },
    ];

    return (
        <div className="space-y-6">
            <PageHeader title="Dashboard" description="Core Banking System Overview" actions={<></>} />

            {/* ─── Widget Cards ───────────────────────────────────────── */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard title="Total Clients" value={loading ? "—" : clientCount.toLocaleString()} icon={Users} variant="default" />
                <StatCard title="Active Loans" value={loading ? "—" : activeLoans.toLocaleString()} icon={Landmark} variant="success" />
                <StatCard title="Savings Accounts" value={loading ? "—" : savingsCount.toLocaleString()} icon={PiggyBank} variant="default" />
                <StatCard title="API Configuration" value={loading ? "—" : "Connected"} icon={Settings} variant="default" />
            </div>

            {/* ─── Donut Charts Row ───────────────────────────────────── */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <Card className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <DollarSign className="h-4 w-4 text-emerald-500" />
                            Loan Portfolio
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex justify-center py-6">
                                <Skeleton className="h-24 w-24 rounded-full" />
                            </div>
                        ) : (
                            <DonutChart data={loanChartData} />
                        )}
                    </CardContent>
                </Card>
                <Card className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <PiggyBank className="h-4 w-4 text-blue-500" />
                            Savings
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex justify-center py-6">
                                <Skeleton className="h-24 w-24 rounded-full" />
                            </div>
                        ) : (
                            <DonutChart data={savingsChartData} />
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* ─── Pending Approvals Table ────────────────────────────── */}
            <Card className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Calendar className="h-4 w-4 text-amber-500" />
                        Pending Loan Approvals
                    </CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => navigate("/loans")} className="text-xs">
                        View All
                        <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
                    </Button>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="space-y-2 p-4">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <Skeleton key={i} className="h-10 w-full" />
                            ))}
                        </div>
                    ) : pendingLoans.length === 0 ? (
                        <p className="px-6 pb-4 text-sm text-gray-400">No pending loan approvals.</p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Account No</TableHead>
                                    <TableHead>Client Name</TableHead>
                                    <TableHead>Product</TableHead>
                                    <TableHead className="text-right">Principal</TableHead>
                                    <TableHead>Submitted On</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="w-10" />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {pendingLoans.slice(0, 50).map((loan) => (
                                    <TableRow
                                        key={loan.id}
                                        className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50"
                                        onClick={() => navigate(`/loans/view/${loan.id}`)}
                                    >
                                        <TableCell className="font-mono text-xs font-medium">{loan.accountNo ?? `#${loan.id}`}</TableCell>
                                        <TableCell className="text-sm">{loan.clientName ?? `Client #${loan.clientId}`}</TableCell>
                                        <TableCell className="text-sm">{loan.loanProductName}</TableCell>
                                        <TableCell className="text-right font-mono text-sm">{formatCurrency(loan.proposedPrincipal ?? loan.principal ?? 0)}</TableCell>
                                        <TableCell className="text-xs text-gray-500">{loan.timeline?.submittedOnDate ? formatDate(loan.timeline.submittedOnDate) : "—"}</TableCell>
                                        <TableCell>
                                            <StatusBadge status={resolveStatusString(loan)} size="sm" />
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigate(`/loans/view/${loan.id}`);
                                                }}
                                            >
                                                <ExternalLink className="h-3.5 w-3.5" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default Dashboard;
