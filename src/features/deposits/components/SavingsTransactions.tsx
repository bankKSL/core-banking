import { type FC } from "react";
import { ArrowLeftRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/shared/DataTable";
import type { SavingsTransaction } from "../api/deposit";
import type { ColumnDef } from "@/components/shared/DataTable";

const formatCurrency = (n?: number) => (n != null ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n) : "—");

interface SavingsTransactionsProps {
    transactions: SavingsTransaction[];
}

const SavingsTransactions: FC<SavingsTransactionsProps> = ({ transactions }) => {
    const columns: ColumnDef<SavingsTransaction>[] = [
        { key: "id", header: "ID", accessorFn: (row) => <span className="font-mono text-xs">{row.id}</span> },
        { key: "date", header: "Date", accessorFn: (row) => <span className="text-sm">{row.date ?? row.transactionDate ?? "—"}</span> },
        {
            key: "type",
            header: "Type",
            accessorFn: (row) => (
                <Badge variant="info" size="sm">
                    {row.type?.value ?? row.type?.code ?? "—"}
                </Badge>
            ),
        },
        {
            key: "amount",
            header: "Amount",
            accessorFn: (row) => <span className={`text-sm font-mono ${row.amount < 0 ? "text-red-500" : "text-green-600"}`}>{formatCurrency(Math.abs(row.amount))}</span>,
        },
        {
            key: "reversed",
            header: "Status",
            accessorFn: (row) =>
                row.reversed ? (
                    <Badge variant="error" size="sm">
                        Reversed
                    </Badge>
                ) : (
                    <Badge variant="success" size="sm">
                        Active
                    </Badge>
                ),
        },
    ];

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
                <ArrowLeftRight className="h-5 w-5" />
                Transactions
            </h3>
            <Card>
                <CardContent className="p-0">
                    <DataTable
                        columns={columns}
                        data={transactions}
                        minWidth={700}
                        emptyState={{ icon: <ArrowLeftRight className="h-8 w-8 text-gray-300" />, message: "No transactions." }}
                    />
                </CardContent>
            </Card>
        </div>
    );
};

export default SavingsTransactions;
