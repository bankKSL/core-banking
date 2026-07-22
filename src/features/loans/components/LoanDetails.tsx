import type { FC } from "react";
import { User, DollarSign, Calendar, Clock, Percent, Hash, Building2, Landmark } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Loan } from "../types/loan";
import { LOAN_STATUS_ID_MAP } from "../constants/status";
import LoanStatusBadge from "./LoanStatusBadge";

interface LoanDetailsProps { loan: Loan; }

const formatCurrency = (n: number, code = "USD") =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: code, maximumFractionDigits: 2 }).format(n);

const InfoRow: FC<{ icon: React.ReactNode; label: string; value: React.ReactNode }> = ({ icon, label, value }) => (
    <div className="flex items-start gap-3 py-2">
        <span className="mt-0.5 text-gray-400">{icon}</span>
        <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</p>
            <p className="text-sm text-gray-900 dark:text-gray-100">{value}</p>
        </div>
    </div>
);

const resolveStatus = (loan: Loan): string => {
    if (loan.status?.code) return loan.status.code;
    if (loan.status?.id != null) return LOAN_STATUS_ID_MAP[loan.status.id] ?? "Unknown";
    return "Unknown";
};

const LoanDetails: FC<LoanDetailsProps> = ({ loan }) => {
    const status = resolveStatus(loan);
    const summary = loan.summary;

    return (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base"><Hash className="h-4 w-4 text-gray-400" />Loan Information</CardTitle>
                </CardHeader>
                <CardContent className="divide-y divide-gray-100 dark:divide-gray-800">
                    <InfoRow icon={<Hash className="h-4 w-4" />} label="Account No" value={loan.accountNo ?? `#${loan.id}`} />
                    <InfoRow icon={<Hash className="h-4 w-4" />} label="External ID" value={loan.externalId ?? "—"} />
                    <InfoRow icon={<Building2 className="h-4 w-4" />} label="Status" value={<LoanStatusBadge code={status} />} />
                    <InfoRow icon={<Landmark className="h-4 w-4" />} label="Product" value={loan.loanProductName} />
                    <InfoRow icon={<User className="h-4 w-4" />} label="Client" value={loan.clientName ?? `Client #${loan.clientId}`} />
                    <InfoRow icon={<User className="h-4 w-4" />} label="Loan Officer" value={loan.loanOfficerName ?? "—"} />
                    <InfoRow icon={<Hash className="h-4 w-4" />} label="Loan Purpose" value={loan.loanPurposeName ?? "—"} />
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base"><DollarSign className="h-4 w-4 text-gray-400" />Financial Details</CardTitle>
                </CardHeader>
                <CardContent className="divide-y divide-gray-100 dark:divide-gray-800">
                    <InfoRow icon={<DollarSign className="h-4 w-4 text-emerald-500" />} label="Principal" value={formatCurrency(loan.principal ?? 0)} />
                    <InfoRow icon={<Percent className="h-4 w-4 text-blue-500" />} label="Interest Rate" value={`${loan.annualInterestRate ?? loan.interestRatePerPeriod ?? 0}%`} />
                    <InfoRow icon={<Clock className="h-4 w-4" />} label="Repayments" value={`${loan.numberOfRepayments ?? "—"} × ${loan.repaymentEvery ?? "—"} ${loan.repaymentFrequencyType?.value ?? "months"}`} />
                    <InfoRow icon={<Clock className="h-4 w-4" />} label="Term" value={`${loan.termFrequency ?? "—"} ${loan.termPeriodFrequencyType === 0 ? "Days" : loan.termPeriodFrequencyType === 1 ? "Weeks" : loan.termPeriodFrequencyType === 2 ? "Months" : "Years"}`} />
                    <InfoRow icon={<Percent className="h-4 w-4" />} label="Amortization" value={loan.amortizationType?.value ?? "—"} />
                    <InfoRow icon={<Percent className="h-4 w-4" />} label="Interest Type" value={loan.interestType?.value ?? "—"} />
                </CardContent>
            </Card>
            {summary && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base"><DollarSign className="h-4 w-4 text-emerald-500" />Loan Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="divide-y divide-gray-100 dark:divide-gray-800">
                        <InfoRow icon={<DollarSign className="h-4 w-4 text-emerald-500" />} label="Disbursed" value={formatCurrency(summary.principalDisbursed ?? 0)} />
                        <InfoRow icon={<DollarSign className="h-4 w-4 text-blue-500" />} label="Principal Paid" value={formatCurrency(summary.principalPaid ?? 0)} />
                        <InfoRow icon={<DollarSign className="h-4 w-4 text-blue-500" />} label="Interest Paid" value={formatCurrency(summary.interestPaid ?? 0)} />
                        <InfoRow icon={<DollarSign className="h-4 w-4 text-red-500" />} label="Outstanding" value={formatCurrency(summary.totalOutstanding ?? 0)} />
                        <InfoRow icon={<DollarSign className="h-4 w-4 text-amber-500" />} label="Overdue" value={formatCurrency(summary.totalOverdue ?? 0)} />
                    </CardContent>
                </Card>
            )}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base"><Calendar className="h-4 w-4 text-gray-400" />Timeline</CardTitle>
                </CardHeader>
                <CardContent className="divide-y divide-gray-100 dark:divide-gray-800">
                    <InfoRow icon={<Calendar className="h-4 w-4" />} label="Submitted On" value={loan.timeline?.submittedOnDate ? new Date(loan.timeline.submittedOnDate).toLocaleDateString() : "—"} />
                    <InfoRow icon={<Calendar className="h-4 w-4" />} label="Approved On" value={loan.timeline?.approvedOnDate ? new Date(loan.timeline.approvedOnDate).toLocaleDateString() : "—"} />
                    <InfoRow icon={<Calendar className="h-4 w-4" />} label="Disbursed On" value={loan.timeline?.actualDisbursementDate ? new Date(loan.timeline.actualDisbursementDate).toLocaleDateString() : "—"} />
                    <InfoRow icon={<Calendar className="h-4 w-4" />} label="Expected Disbursement" value={loan.timeline?.expectedDisbursementDate ? new Date(loan.timeline.expectedDisbursementDate).toLocaleDateString() : "—"} />
                    <InfoRow icon={<Calendar className="h-4 w-4" />} label="Closed On" value={loan.timeline?.closedOnDate ? new Date(loan.timeline.closedOnDate).toLocaleDateString() : "—"} />
                </CardContent>
            </Card>
        </div>
    );
};

export default LoanDetails;
export type { LoanDetailsProps };
