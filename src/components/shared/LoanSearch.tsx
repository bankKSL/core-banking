import { useState, useCallback, useEffect, useRef } from "react";
import { Search, X, BadgeCheck, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLoans, type LoanListParams } from "@/features/loans";

export interface LoanSearchProps {
  value: number;
  onChange: (loanId: number) => void;
  onBlur?: () => void;
  disabled?: boolean;
  error?: string;
  label?: string;
  placeholder?: string;
  name?: string;
}

export function LoanSearch({
  value,
  onChange,
  onBlur,
  disabled,
  error,
  label = "Loan ID *",
  placeholder = "Search loan by ID or account no…",
  name,
}: LoanSearchProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  const params: LoanListParams = query.length >= 2 ? { limit: 20, offset: 0, searchByParam: query } : { limit: 50 };

  const { data, isLoading } = useLoans(params);

  const loans = data?.pageItems ?? [];
  const selected = loans.find((l) => l.id === value);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        onBlur?.();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onBlur]);

  const handleSearch = useCallback((val: string) => {
    setQuery(val);
    clearTimeout(debounceRef.current!);
    debounceRef.current = setTimeout(() => setOpen(true), 200);
  }, []);

  return (
    <div ref={ref} className="relative">
      <label className="block text-sm font-medium" htmlFor={name ?? "loanSearch"}>
        {label}
      </label>
      {selected ? (
        <div className="flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-800">
          <BadgeCheck className="h-4 w-4 shrink-0 text-emerald-500" />
          <span className="flex-1 text-sm">
            Loan #{selected.id}
            {selected.accountNo && <span className="ml-1 text-gray-400">({selected.accountNo})</span>}
            {selected.clientName && <span className="ml-1 text-gray-500">- {selected.clientName}</span>}
          </span>
          {!disabled && (
            <button
              type="button"
              onClick={() => {
                onChange(0);
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
          {isLoading ? (
            <Loader2 className="absolute left-3 top-5 h-4 w-4 -translate-y-1/2 text-gray-400 animate-spin" />
          ) : (
            <Search className="absolute left-3 top-5 h-4 w-4 -translate-y-1/2 text-gray-400" />
          )}

          <Input
            id={name ?? "loanSearch"}
            placeholder={placeholder}
            className="pl-9"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => query.length >= 0 && setOpen(true)}
            disabled={disabled}
            error={error}
          />
        </div>
      )}

      {open && !selected && loans.length > 0 && (
        <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
          {loans.map((l) => (
            <button
              key={l.id}
              type="button"
              className="flex w-full items-center px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => {
                onChange(l.id);
                setOpen(false);
                setQuery("");
              }}
            >
              <span className="font-medium">#{l.id}</span>
              {l.accountNo && <span className="ml-2 text-xs text-gray-400">{l.accountNo}</span>}
              {l.clientName && <span className="ml-2 text-xs text-gray-500">{l.clientName}</span>}
            </button>
          ))}
        </div>
      )}

      {open && !selected && query.length >= 2 && loans.length === 0 && !isLoading && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-gray-200 bg-white p-3 text-center text-sm text-gray-500 shadow-lg dark:border-gray-700 dark:bg-gray-800">
          No loans found
        </div>
      )}
    </div>
  );
}
