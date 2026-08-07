import { useState, useCallback, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Search, X, BadgeCheck, Landmark } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface SavingsAccountItem {
  id: number;
  accountNo: string;
  savingsProductName?: string;
  currency?: { code: string; displaySymbol?: string };
  summary?: { accountBalance?: number };
}

export interface SavingsAccountSearchProps {
  value: string;
  onChange: (savingsAccountId: string) => void;
  accounts: SavingsAccountItem[];
  disabled?: boolean;
  error?: string;
  label?: string;
  placeholder?: string;
}

export function SavingsAccountSearch({
  value,
  onChange,
  accounts,
  disabled,
  error,
  label,
  placeholder,
}: SavingsAccountSearchProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  const filtered = query
    ? accounts.filter(
        (a) =>
          a.accountNo.toLowerCase().includes(query.toLowerCase()) ||
          (a.savingsProductName ?? "").toLowerCase().includes(query.toLowerCase()),
      )
    : accounts;

  const selected = accounts.find((a) => String(a.id) === value);

  const resolvedLabel = label ?? t("Savings Account");
  const resolvedPlaceholder = placeholder ?? t("Search savings account…");

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = useCallback((val: string) => {
    setQuery(val);
    clearTimeout(debounceRef.current!);
    debounceRef.current = setTimeout(() => setOpen(true), 200);
  }, []);

  return (
    <div ref={ref} className="relative space-y-1.5">
      <label className="block text-sm font-medium">{resolvedLabel}</label>
      {selected ? (
        <div className="flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-800">
          <BadgeCheck className="h-4 w-4 shrink-0 text-emerald-500" />
          <span className="flex-1 text-sm">
            {selected.accountNo}
            {selected.savingsProductName && <span className="ml-1 text-gray-400">({selected.savingsProductName})</span>}
          </span>
          <span className="text-xs text-gray-400">
            {selected.currency?.displaySymbol ?? selected.currency?.code}{" "}
            {selected.summary?.accountBalance?.toLocaleString()}
          </span>
          {!disabled && (
            <button
              type="button"
              onClick={() => {
                onChange("");
                setQuery("");
                setOpen(false);
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      ) : (
        <div className="relative">
          <Search className="absolute left-3 top-5 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder={resolvedPlaceholder}
            className="pl-9"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => setOpen(true)}
            disabled={disabled}
            error={error}
          />
        </div>
      )}

      {open && !selected && filtered.length > 0 && (
        <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
          {filtered.map((a) => (
            <button
              key={a.id}
              type="button"
              className="flex w-full items-center px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => {
                onChange(String(a.id));
                setOpen(false);
                setQuery("");
              }}
            >
              <Landmark className="mr-2 h-4 w-4 shrink-0 text-gray-400" />
              <div className="flex-1">
                <span className="font-medium">{a.accountNo}</span>
                {a.savingsProductName && <span className="ml-2 text-xs text-gray-400">{a.savingsProductName}</span>}
              </div>
              <span className="text-xs text-gray-400">
                {a.currency?.displaySymbol ?? a.currency?.code} {a.summary?.accountBalance?.toLocaleString()}
              </span>
            </button>
          ))}
        </div>
      )}

      {open && !selected && query.length >= 1 && filtered.length === 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-gray-200 bg-white p-3 text-center text-sm text-gray-500 shadow-lg dark:border-gray-700 dark:bg-gray-800">
          {t("No savings accounts found")}
        </div>
      )}
    </div>
  );
}
