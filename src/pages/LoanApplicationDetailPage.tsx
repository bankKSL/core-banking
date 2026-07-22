import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Landmark, Calendar, Clock, DollarSign, Percent, User, AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useLoan, LOAN_STATUS_CONFIG, useApproveLoan, useDisburseLoan } from "@/features/loans";
import type { LoanRepaymentPeriod } from "@/features/loans";

const formatCurrency = (n: number, code = "USD") => new Intl.NumberFormat("en-US", { style: "currency", currency: code, maximumFractionDigits: 2 }).format(n);

const InfoRow: React.FC<{ icon: React.ReactNode; label: string; value: React.ReactNode }> = ({ icon, label, value }) => (
    <div className="flex items-start gap-3 py-2">
        <span className="mt-0.5 text-gray-400">{icon}</span>
        <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-gray-500">{label}</p>
            <p className="text-sm text-gray-900 dark:text-gray-100">{value}</p>
        </div>
    </div>
);

const LoanApplicationDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { data: loan, isLoading, isError, error, refetch } = useLoan(id);
    const approveMut = useApproveLoan();
    const disburseMut = useDisburseLoan();

    if (isLoading)
        return (
            <div className="p-6 max-w-3xl m-auto space-y-6">
                <Skeleton className="h-10 w-64" />
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-40 rounded-xl" />
                    ))}
                </div>
            </div>
        );
    if (isError || !loan)
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <AlertTriangle className="mx-auto h-8 w-8 text-red-500 mb-2" />
                    <p className="text-red-600">Failed to load: {String(error)}</p>
                    <Button variant="outline" className="mt-2" onClick={() => refetch()}>
                        Retry
                    </Button>
                </div>
            </div>
        );

    const statusCfg = LOAN_STATUS_CONFIG[loan.status?.code ?? ""];
    const schedule: LoanRepaymentPeriod[] = loan.repaymentSchedule ?? [];
    const summary = loan.summary;

    return (
        <div className="p-6 max-w-4xl m-auto space-y-6">
            <PageHeader
                title={`Loan ${loan.accountNo ?? `#${loan.id}`}`}
                description={`${loan.loanProductName} — ${loan.clientName ?? `Client #${loan.clientId}`}`}
                actions={
                    <div className="flex items-center gap-2">
                        <Badge variant={statusCfg?.variant === "success" ? "success" : statusCfg?.variant === "error" ? "error" : "default"}>
                            {statusCfg?.label ?? loan.status?.code}
                        </Badge>
                        {loan.status?.code === "loanStatusType.approved" && (
                            <Button
                                size="sm"
                                onClick={() =>
                                    disburseMut.mutate({
                                        loanId: loan.id,
                                        payload: { locale: "en", dateFormat: "yyyy-MM-dd", actualDisbursementDate: new Date().toISOString().split("T")[0] },
                                    })
                                }
                                disabled={disburseMut.isPending}
                            >
                                {disburseMut.isPending ? "Disbursing…" : "Disburse"}
                            </Button>
                        )}
                        {loan.status?.code === "loanStatusType.submitted.and.pending.approval" && (
                            <Button
                                size="sm"
                                onClick={() =>
                                    approveMut.mutate({
                                        loanId: loan.id,
                                        payload: { locale: "en", dateFormat: "yyyy-MM-dd", approvedOnDate: new Date().toISOString().split("T")[0] },
                                    })
                                }
                                disabled={approveMut.isPending}
                            >
                                {approveMut.isPending ? "Approving…" : "Approve"}
                            </Button>
                        )}
                        <Button variant="outline" onClick={() => navigate("/lending/applications")}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back
                        </Button>
                    </div>
                }
            />
            <Separator />
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Landmark className="h-4 w-4 text-blue-500" />
                            Loan Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="divide-y divide-gray-100">
                        <InfoRow icon={<DollarSign className="h-4 w-4" />} label="Principal" value={formatCurrency(loan.principal, "USD")} />
                        <InfoRow icon={<DollarSign className="h-4 w-4" />} label="EMI" value={formatCurrency(loan.emiAmount ?? 0, "USD")} />
                        <InfoRow icon={<Percent className="h-4 w-4" />} label="Interest Rate" value={`${loan.annualInterestRate}%`} />
                        <InfoRow
                            icon={<Clock className="h-4 w-4" />}
                            label="Repayments"
                            value={`${loan.numberOfRepayments} × ${loan.repaymentEvery} ${loan.repaymentFrequencyType?.value ?? "months"}`}
                        />
                        <InfoRow icon={<User className="h-4 w-4" />} label="Officer" value={loan.loanOfficerName ?? "—"} />
                        <InfoRow
                            icon={<Calendar className="h-4 w-4" />}
                            label="Applied"
                            value={loan.timeline?.submittedOnDate ? new Date(loan.timeline.submittedOnDate).toLocaleDateString() : "—"}
                        />
                    </CardContent>
                </Card>
                {summary && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <DollarSign className="h-4 w-4 text-emerald-500" />
                                Summary
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="divide-y divide-gray-100">
                            <InfoRow icon={<DollarSign className="h-4 w-4 text-emerald-500" />} label="Disbursed" value={formatCurrency(summary.principalDisbursed, "USD")} />
                            <InfoRow icon={<DollarSign className="h-4 w-4 text-blue-500" />} label="Paid" value={formatCurrency(summary.totalRepayment, "USD")} />
                            <InfoRow icon={<DollarSign className="h-4 w-4 text-red-500" />} label="Outstanding" value={formatCurrency(summary.totalOutstanding, "USD")} />
                            <InfoRow icon={<DollarSign className="h-4 w-4 text-amber-500" />} label="Overdue" value={formatCurrency(summary.totalOverdue, "USD")} />
                        </CardContent>
                    </Card>
                )}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            Schedule Preview
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {schedule.length === 0 ? (
                            <p className="text-sm text-gray-400">No schedule available</p>
                        ) : (
                            <div className="space-y-1 max-h-72 overflow-y-auto">
                                {schedule.slice(0, 12).map((p, i) => (
                                    <div key={i} className="flex justify-between text-xs py-1.5 border-b last:border-0">
                                        <span className="text-gray-500">
                                            #{p.period} {new Date(p.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                        </span>
                                        <span className="font-mono">{formatCurrency(p.totalDueForPeriod, "USD")}</span>
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

export default LoanApplicationDetailPage;
