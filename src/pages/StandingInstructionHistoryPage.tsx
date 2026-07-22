import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Clock, Repeat } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, type ColumnDef } from "@/components/shared/DataTable";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/shared/ErrorState";
import { EmptyState } from "@/components/shared/EmptyState";
import { fetchStandingInstructionHistory, parseDate } from "@/features/transfers";
import type { StandingInstructionHistoryItem } from "@/features/transfers";

function formatDate(dateVal: number[] | undefined): string {
    const d = parseDate(dateVal);
    if (!d) return "—";
    return d.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function formatAmount(amount?: number): string {
    if (amount == null) return "—";
    return amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const StandingInstructionHistoryPage: React.FC = () => {
    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: ["standingInstructionHistory"],
        queryFn: fetchStandingInstructionHistory,
    });

    const items = useMemo(() => data?.pageItems ?? [], [data]);

    const columns: ColumnDef<StandingInstructionHistoryItem>[] = useMemo(
        () => [
            { key: "name", header: "Name", accessorFn: (row) => row.name ?? "—" },
            { key: "fromClientName", header: "From Client", accessorFn: (row) => row.fromClientName ?? "—" },
            {
                key: "fromAccount",
                header: "From Account",
                accessorFn: (row) => row.fromAccount?.accountNo ?? "—",
            },
            { key: "toClientName", header: "To Client", accessorFn: (row) => row.toClientName ?? "—" },
            {
                key: "toAccount",
                header: "To Account",
                accessorFn: (row) => row.toAccount?.accountNo ?? "—",
            },
            {
                key: "amount",
                header: "Amount",
                accessorFn: (row) => formatAmount(row.amount),
            },
            {
                key: "executionTime",
                header: "Execution Time",
                accessorFn: (row) => formatDate(row.executionTime),
            },
            { key: "status", header: "Status", accessorFn: (row) => row.status ?? "—" },
            {
                key: "errorLog",
                header: "Error Log",
                accessorFn: (row) => row.errorLog ?? "—",
                className: "max-w-[200px] truncate",
            },
        ],
        [],
    );

    if (isError) {
        return (
            <div className="p-6">
                <PageHeader title="Standing Instruction History" description="Execution history of recurring transfers" />
                <ErrorState message="Failed to load history." onRetry={refetch} />
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <PageHeader title="Standing Instruction History" description="Execution history of recurring transfers" />

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        Execution History
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="space-y-2">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <Skeleton key={i} className="h-10 w-full" />
                            ))}
                        </div>
                    ) : items.length === 0 ? (
                        <EmptyState title="No execution history found." />
                    ) : (
                        <DataTable columns={columns} data={items} />
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default StandingInstructionHistoryPage;
