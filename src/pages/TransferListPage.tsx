import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Plus, ArrowLeftRight } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/shared/ErrorState";
import { EmptyState } from "@/components/shared/EmptyState";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fetchTransfers, parseDate } from "@/features/transfers";
import type { Transfer } from "@/features/transfers";

/** Format number to 2 decimal places */
function formatAmount(amount?: number): string {
    if (amount == null) return "—";
    return amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Format a Date to a readable string */
function formatDate(date: Date | null): string {
    if (!date) return "—";
    return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
}

const TransferListPage: React.FC = () => {
    const navigate = useNavigate();

    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: ["accountTransfers"],
        queryFn: fetchTransfers,
    });

    const transfers = useMemo(() => data?.pageItems ?? [], [data]);

    if (isError) {
        return (
            <div className="p-6">
                <PageHeader
                    title="Account Transfers"
                    description="View all account transfers"
                    actions={
                        <Button onClick={() => navigate("/transfers/new")}>
                            <Plus className="mr-2 h-4 w-4" /> New Transfer
                        </Button>
                    }
                />
                <ErrorState message="Failed to load transfers." onRetry={refetch} />
            </div>
        );
    }

    return (
        <div className="p-6">
            <PageHeader
                title="Account Transfers"
                description="View all account transfers"
                actions={
                    <Button onClick={() => navigate("/transfers/new")}>
                        <Plus className="mr-2 h-4 w-4" /> New Transfer
                    </Button>
                }
            />

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ArrowLeftRight className="h-5 w-5" />
                        Transfer History
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="space-y-2">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <Skeleton key={i} className="h-10 w-full" />
                            ))}
                        </div>
                    ) : transfers.length === 0 ? (
                        <EmptyState title="No transfers found." />
                    ) : (
                        <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>ID</TableHead>
                                        <TableHead>From Account</TableHead>
                                        <TableHead>To Account</TableHead>
                                        <TableHead>Currency</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Description</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {transfers.map((t: Transfer) => (
                                        <TableRow key={t.id}>
                                            <TableCell>{t.id ?? "—"}</TableCell>
                                            <TableCell>{t.fromAccount?.id ?? "—"}</TableCell>
                                            <TableCell>{t.toAccount?.id ?? "—"}</TableCell>
                                            <TableCell>{t.currency?.code ?? "—"}</TableCell>
                                            <TableCell>{formatAmount(t.transferAmount)}</TableCell>
                                            <TableCell>{formatDate(parseDate(t.transferDate))}</TableCell>
                                            <TableCell>{t.transferDescription ?? "—"}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default TransferListPage;
