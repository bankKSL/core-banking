import React from "react";
import { Badge } from "@/components/ui/badge";
import type { CampaignStatus, ExecutionStatus, LoanStatus, InstallmentStatus, CollateralStatus, DepositAccountStatus, TransactionStatus, FixedDepositStatus, RecurringDepositStatus } from "@/types";

type StatusType = CampaignStatus | ExecutionStatus | LoanStatus | InstallmentStatus | CollateralStatus | DepositAccountStatus | TransactionStatus | FixedDepositStatus | RecurringDepositStatus | string;

interface StatusBadgeProps {
    status: StatusType;
    label?: string;
    className?: string;
    size?: "sm" | "md" | "lg";
}

const statusVariantMap: Record<
    string,
    {
        variant: "success" | "warning" | "error" | "info" | "default";
        rounded?: boolean;
    }
> = {
    active: { variant: "success" },
    success: { variant: "success" },
    inactive: { variant: "default" },
    scheduled: { variant: "info" },
    expired: { variant: "warning" },
    failed: { variant: "error" },
    draft: { variant: "default", rounded: false },
    skipped: { variant: "default" },
    // ─── Lending Statuses ───
    pending: { variant: "info" },
    under_review: { variant: "warning" },
    approved: { variant: "success" },
    rejected: { variant: "error" },
    disbursed: { variant: "success" },
    closed: { variant: "default" },
    defaulted: { variant: "error" },
    restructured: { variant: "info" },
    // Installment / Collateral
    paid: { variant: "success" },
    overdue: { variant: "error" },
    partial: { variant: "warning" },
    waived: { variant: "default", rounded: false },
    pledged: { variant: "info" },
    released: { variant: "default" },
    foreclosed: { variant: "error" },
    under_valuation: { variant: "warning" },
    processed: { variant: "success" },
    // ─── Deposit / Transaction Statuses ───
    completed: { variant: "success" },
    reversed: { variant: "error" },
    dormant: { variant: "warning" },
    frozen: { variant: "error" },
    matured: { variant: "success" },
    renewed: { variant: "info" },
    premature_withdrawn: { variant: "warning" },
    premature_closed: { variant: "warning" },
};

const statusLabelMap: Record<string, string> = {
    active: "Active",
    inactive: "Inactive",
    scheduled: "Scheduled",
    expired: "Expired",
    draft: "Draft",
    success: "Success",
    failed: "Failed",
    skipped: "Skipped",
    // ─── Lending Labels ───
    pending: "Pending",
    under_review: "Under Review",
    approved: "Approved",
    rejected: "Rejected",
    disbursed: "Disbursed",
    closed: "Closed",
    defaulted: "Defaulted",
    restructured: "Restructured",
    paid: "Paid",
    overdue: "Overdue",
    partial: "Partial",
    waived: "Waived",
    pledged: "Pledged",
    released: "Released",
    foreclosed: "Foreclosed",
    under_valuation: "Under Valuation",
    processed: "Processed",
    // ─── Deposit Labels ───
    completed: "Completed",
    reversed: "Reversed",
    dormant: "Dormant",
    frozen: "Frozen",
    matured: "Matured",
    renewed: "Renewed",
    premature_withdrawn: "Premature Withdrawn",
    premature_closed: "Premature Closed",
};

function getStatusConfig(status: string) {
    return (
        statusVariantMap[status] ?? {
            variant: "default" as const,
        }
    );
}

const sizeClasses: Record<"sm" | "md" | "lg", string> = {
    sm: "h-5 px-2 text-[10px] gap-0.5",
    md: "h-6 px-2.5 text-xs gap-1",
    lg: "h-8 px-3 text-sm gap-1.5",
};

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label: labelOverride, className, size = "md" }) => {
    const config = getStatusConfig(status);
    const label = labelOverride ?? statusLabelMap[status] ?? status;

    // For draft, skipped, waived — render as a secondary/outline style
    if (status === "draft" || status === "skipped" || status === "waived" || status === "released" || status === "reversed") {
        return (
            <span
                className={`inline-flex items-center justify-center font-medium whitespace-nowrap rounded-md border border-gray-300 bg-gray-50 text-gray-600 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400 ${sizeClasses[size]} ${className ?? ""}`}
            >
                {label}
            </span>
        );
    }

    return (
        <Badge variant={config.variant} size={size} rounded={config.rounded ?? true} className={className}>
            {label}
        </Badge>
    );
};

export { StatusBadge };
export type { StatusBadgeProps };
