import type { FC } from "react";
import { DollarSign, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/shared/StatusBadge";
import type { LoanTransaction } from "../types/loan";

interface LoanTransactionsTableProps {
    transactions: LoanTransaction[];
    loading?: boolean;
}

const formatCurrency = (n: number, code = "USD") =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: code, maximumFractionDigits: 2 }).format(n);

const getTransactionStatus = (tx: LoanTransaction): string => {
    if (tx.reversed) return "reversed";
    return "completed";
};

const LoanTransactionsTable: FC<LoanTransactionsTableProps> = ({ transactions, loading }) => {
    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-gray-400" />
                        Transactions
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="h-10 bg-gray-100 dark:bg-gray-700 animate-pulse rounded" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (!transactions || transactions.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-gray-400" />
                        Transactions
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-gray-400">No transactions found.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-gray-400" />
                    Transactions ({transactions.length})
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead className="text-right">Principal</TableHead>
                            <TableHead className="text-right">Interest</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {transactions.map((tx) => (
                            <TableRow key={tx.id}>
                                <TableCell className="font-mono text-xs">
                                    {tx.date ? new Array(tx.date).join("-") : tx.submittedOnDate ? new Date(tx.submittedOnDate).toLocaleDateString() : "—"}
                                </TableCell>
                                <TableCell className="text-sm">{tx.type?.value ?? "—"}</TableCell>
                                <TableCell className="text-right font-mono text-sm">{formatCurrency(tx.amount ?? 0)}</TableCell>
                                <TableCell className="text-right font-mono text-sm text-emerald-600">{formatCurrency(tx.principalPortion ?? 0)}</TableCell>
                                <TableCell className="text-right font-mono text-sm text-amber-600">{formatCurrency(tx.interestPortion ?? 0)}</TableCell>
                                <TableCell>
                                    <StatusBadge status={getTransactionStatus(tx)} label={tx.reversed ? "Reversed" : "Completed"} size="sm" />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
};

export default LoanTransactionsTable;
export type { LoanTransactionsTableProps };
