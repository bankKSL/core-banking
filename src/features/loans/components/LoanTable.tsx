import type { FC } from "react";
import { useNavigate } from "react-router-dom";
import { DataTable, type ColumnDef } from "@/components/shared/DataTable";
import type { Loan } from "../types/loan";
import { LOAN_STATUS_ID_MAP } from "../constants/status";
import LoanStatusBadge from "./LoanStatusBadge";

interface LoanTableProps {
    data: Loan[];
    loading: boolean;
    onRowClick?: (loan: Loan) => void;
}

const formatCurrency = (n: number, code = "USD") =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: code, maximumFractionDigits: 0 }).format(n);

const LoanTable: FC<LoanTableProps> = ({ data, loading, onRowClick }) => {
    const navigate = useNavigate();

    const resolveStatusCode = (loan: Loan): string => {
        if (loan.status?.code) return loan.status.code;
        if (loan.status?.id != null) return LOAN_STATUS_ID_MAP[loan.status.id] ?? "Unknown";
        return "Unknown";
    };

    const columns: ColumnDef<Loan>[] = [
        {
            key: "accountNo",
            header: "Account No",
            accessorFn: (row) => (
                <span className="font-mono text-sm font-medium">{row.accountNo ?? `#${row.id}`}</span>
            ),
            sortable: true,
        },
        {
            key: "clientName",
            header: "Client Name",
            accessorFn: (row) => (
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {row.clientName ?? `Client #${row.clientId}`}
                </span>
            ),
            sortable: true,
        },
        {
            key: "loanProductName",
            header: "Loan Product",
            accessorFn: (row) => (
                <span className="text-sm">{row.loanProductName}</span>
            ),
            sortable: true,
        },
        {
            key: "principal",
            header: "Principal",
            accessorFn: (row) => (
                <span className="font-mono text-sm">{formatCurrency(row.principal ?? 0)}</span>
            ),
            sortable: true,
        },
        {
            key: "status",
            header: "Status",
            accessorFn: (row) => (
                <LoanStatusBadge code={resolveStatusCode(row)} size="sm" />
            ),
            sortable: true,
        },
    ];

    const handleRowClick = (loan: Loan) => {
        if (onRowClick) {
            onRowClick(loan);
        } else {
            navigate(`/loans/view/${loan.id}`);
        }
    };

    return (
        <DataTable
            columns={columns}
            data={data}
            loading={loading}
            onRowClick={handleRowClick}
            idAccessor={(row) => String(row.id)}
            skeletonRowCount={8}
            emptyState={{
                message: "No loans found. Try adjusting your search or filters.",
            }}
            minWidth={900}
        />
    );
};

export default LoanTable;
export type { LoanTableProps };
