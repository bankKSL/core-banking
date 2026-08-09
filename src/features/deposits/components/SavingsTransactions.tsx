import { type FC, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ArrowLeftRight, RotateCcw, Undo2, Lock, Unlock, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DataTable } from "@/components/shared/DataTable";
import { Pagination } from "@/components/shared/Pagination";
import type { SavingsTransaction } from "../types/deposit";
import type { ColumnDef } from "@/components/shared/DataTable";

const formatCurrency = (currency?: string, n?: number) =>
  n != null ? new Intl.NumberFormat("en-US", { style: "currency", currency: currency ?? "USD" }).format(n) : "—";

const TXN_PAGE_SIZE = 15;

interface SavingsTransactionsProps {
  transactions: SavingsTransaction[];
  onUndo?: (transactionId: number) => void;
  onReverse?: (transactionId: number) => void;
  onRelease?: (transactionId: number) => void;
  canRelease?: boolean;
  currencyCode?: string;
}

const SavingsTransactions: FC<SavingsTransactionsProps> = ({
  transactions,
  onUndo,
  onReverse,
  onRelease,
  canRelease = false,
  currencyCode,
}) => {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    let result = transactions ?? [];
    const q = search.toLowerCase();
    if (q) {
      result = result.filter(
        (txn) =>
          String(txn.id).includes(q) ||
          (txn.transactionType?.value ?? "").toLowerCase().includes(q) ||
          (txn.reasonForBlock ?? "").toLowerCase().includes(q) ||
          formatCurrency(currencyCode, txn.amount).toLowerCase().includes(q),
      );
    }
    if (typeFilter !== "all") {
      result = result.filter((txn) => {
        if (typeFilter === "hold") return txn.transactionType?.amountHold === true;
        if (typeFilter === "release") return txn.transactionType?.amountRelease === true;
        if (typeFilter === "deposit") return txn.transactionType?.deposit === true;
        if (typeFilter === "withdrawal") return txn.transactionType?.withdrawal === true;
        if (typeFilter === "interest") return txn.transactionType?.interestPosting === true;
        if (typeFilter === "fee") return txn.transactionType?.feeDeduction === true;
        return true;
      });
    }
    return result;
  }, [transactions, search, typeFilter, currencyCode]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / TXN_PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * TXN_PAGE_SIZE, safePage * TXN_PAGE_SIZE);

  const columns: ColumnDef<SavingsTransaction>[] = [
    { key: "id", header: t("ID"), accessorFn: (row) => <span className="font-mono text-xs">{row.id}</span> },
    {
      key: "date",
      header: t("Date"),
      accessorFn: (row) => <span className="text-sm">{row.date ?? row.transactionDate ?? "—"}</span>,
    },
    {
      key: "type",
      header: t("Type"),
      accessorFn: (row: SavingsTransaction) => {
        const isHold = row.transactionType?.amountHold === true;
        const isRelease = row.transactionType?.amountRelease === true;
        if (isHold) {
          return (
            <div className="flex items-center gap-1">
              <Badge variant="warning" size="sm">
                <Lock className="mr-1 h-3 w-3" />
                {t("Amount on Hold")}
              </Badge>
            </div>
          );
        }
        if (isRelease) {
          return (
            <Badge variant="success" size="sm">
              <Unlock className="mr-1 h-3 w-3" />
              {t("Amount Released")}
            </Badge>
          );
        }
        return (
          <Badge variant={row.transactionType?.transactionTypeEnum === "WITHDRAWAL" ? "error" : "info"} size="sm">
            {row.transactionType?.value ?? "—"}
          </Badge>
        );
      },
    },
    {
      key: "amount",
      header: t("Amount"),
      accessorFn: (row) => (
        <span className={`text-sm font-mono ${row.entryType === "DEBIT" ? "text-red-500" : "text-green-600"}`}>
          {formatCurrency(row.currency?.code ?? currencyCode, Math.abs(row.amount))}
        </span>
      ),
    },
    {
      key: "runningBalance",
      header: t("Balance"),
      accessorFn: (row) => (
        <span className="text-sm font-mono">
          {formatCurrency(row.currency?.code ?? currencyCode, row.runningBalance)}
        </span>
      ),
    },
    {
      key: "reason",
      header: t("Reason"),
      accessorFn: (row) =>
        row.reasonForBlock ? (
          <span className="text-xs text-gray-600 dark:text-gray-400 max-w-[200px] truncate" title={row.reasonForBlock}>
            {row.reasonForBlock}
          </span>
        ) : (
          <span className="text-xs text-gray-400">—</span>
        ),
    },
    {
      key: "status",
      header: t("Status"),
      accessorFn: (row) => {
        if (row.reversed) {
          return (
            <Badge variant="error" size="sm">
              {t("Reversed")}
            </Badge>
          );
        }
        if (row.transactionType?.amountHold === true) {
          if (row.releaseTransactionId) {
            return (
              <Badge variant="info" size="sm">
                {t("Released")}
              </Badge>
            );
          }
          return (
            <Badge variant="warning" size="sm">
              {t("On Hold")}
            </Badge>
          );
        }
        return (
          <Badge variant="success" size="sm">
            {t("Active")}
          </Badge>
        );
      },
    },
    {
      key: "actions",
      header: "",
      cell: (row: SavingsTransaction) => {
        const isHold = row.transactionType?.amountHold === true;
        const isUnreleasedHold = isHold && !row.releaseTransactionId;
        return !row.reversed ? (
          <div className="flex items-center gap-1">
            {isUnreleasedHold && canRelease && onRelease && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRelease(row.id)}
                title={t("Release Hold")}
                className="text-amber-600"
              >
                <Unlock className="h-4 w-4" />
              </Button>
            )}
            {onUndo && (
              <Button variant="ghost" size="sm" onClick={() => onUndo(row.id)} title={t("Undo")}>
                <Undo2 className="h-4 w-4" />
              </Button>
            )}
            {onReverse && (
              <Button variant="ghost" size="sm" onClick={() => onReverse(row.id)} title={t("Reverse")}>
                <RotateCcw className="h-4 w-4" />
              </Button>
            )}
          </div>
        ) : null;
      },
    },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium flex items-center gap-2">
        <ArrowLeftRight className="h-5 w-5" />
        {t("Transactions")}
      </h3>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder={t("Search transactions...")}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>
        <Select
          value={typeFilter}
          onValueChange={(v) => {
            setTypeFilter(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={t("All Types")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("All Types")}</SelectItem>
            <SelectItem value="deposit">{t("Deposit")}</SelectItem>
            <SelectItem value="withdrawal">{t("Withdrawal")}</SelectItem>
            <SelectItem value="interest">{t("Interest Posting")}</SelectItem>
            <SelectItem value="fee">{t("Fee")}</SelectItem>
            <SelectItem value="hold">{t("Amount on Hold")}</SelectItem>
            <SelectItem value="release">{t("Amount Release")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={paged}
            minWidth={900}
            emptyState={{ icon: <ArrowLeftRight className="h-8 w-8 text-gray-300" />, message: t("No transactions.") }}
          />
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <Pagination
          currentPage={safePage}
          totalPages={totalPages}
          onPageChange={setPage}
          totalItems={filtered.length}
          pageSize={TXN_PAGE_SIZE}
        />
      )}
    </div>
  );
};

export default SavingsTransactions;
