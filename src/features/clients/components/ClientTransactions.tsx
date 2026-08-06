import { type FC, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Undo2, ArrowLeftRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/shared/DataTable";
import { useClientTransactions, useUndoClientTransaction } from "../hooks/useClientTransactions";
import type { ClientTransaction } from "../api/transactions";
import { formatClientDate } from "../utils/client";
import type { ColumnDef } from "@/components/shared/DataTable";

const formatCurrency = (n?: number, currency = "USD") =>
  n != null ? new Intl.NumberFormat("en-US", { style: "currency", currency: currency }).format(n) : "—";

interface ClientTransactionsProps {
  clientId: number;
}

const ClientTransactions: FC<ClientTransactionsProps> = ({ clientId }) => {
  const { t } = useTranslation();
  const { data: txnsData, isLoading } = useClientTransactions(clientId);
  const undoMutation = useUndoClientTransaction();
  const [undoingId, setUndoingId] = useState<number | null>(null);

  const transactions = txnsData?.pageItems ?? [];

  const handleUndo = useCallback(
    async (transactionId: number) => {
      setUndoingId(transactionId);
      try {
        if (window.confirm(t("clients.transactions.undoConfirm"))) {
          await undoMutation.mutateAsync({ clientId, transactionId });
        }
      } finally {
        setUndoingId(null);
      }
    },
    [clientId, undoMutation],
  );

  const columns: ColumnDef<ClientTransaction>[] = [
    { key: "id", header: t("clients.transactions.id"), accessorFn: (row) => <span className="font-mono text-xs">{row.id}</span> },
    {
      key: "date",
      header: t("clients.transactions.date"),
      accessorFn: (row) => <span className="text-sm">{formatClientDate(row.date ?? row.transactionDate)}</span>,
    },
    {
      key: "type",
      header: t("clients.transactions.type"),
      accessorFn: (row) => (
        <Badge variant="info" size="sm">
          {row.type?.value ?? row.type?.code ?? "—"}
        </Badge>
      ),
    },
    {
      key: "amount",
      header: t("clients.transactions.amount"),
      accessorFn: (row) => (
        <span className={`text-sm font-mono ${row.amount < 0 ? "text-red-500" : "text-green-600"}`}>
          {formatCurrency(Math.abs(row.amount), row.currency?.code)}
        </span>
      ),
    },
    {
      key: "reversed",
      header: t("clients.transactions.status"),
      accessorFn: (row) =>
        row.reversed ? (
          <Badge variant="error" size="sm">
            {t("clients.transactions.reversed")}
          </Badge>
        ) : (
          <Badge variant="success" size="sm">
            {t("clients.transactions.active")}
          </Badge>
        ),
    },
    {
      key: "actions",
      header: t("clients.transactions.actions"),
      accessorFn: (row) => (
        <div className="flex items-center gap-1">
          {!row.reversed && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleUndo(row.id);
              }}
              disabled={undoingId === row.id}
              title={t("clients.transactions.undoTransaction")}
            >
              {undoingId === row.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Undo2 className="h-4 w-4 text-amber-500" />
              )}
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium flex items-center gap-2">
        <ArrowLeftRight className="h-5 w-5" />
        {t("clients.transactions.title")}
      </h3>
      <Card>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={transactions}
            loading={isLoading}
            minWidth={700}
            emptyState={{
              icon: <ArrowLeftRight className="h-8 w-8 text-gray-300" />,
              message: t("clients.transactions.noTransactions"),
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientTransactions;
