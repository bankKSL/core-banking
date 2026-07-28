import { useState, useCallback, useEffect, useRef } from "react";
import { Search, X, BadgeCheck, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCurrencies } from "@/features/currencies";
import type { CurrencyData } from "@/features/currencies";

export interface CurrencySelectProps {
  value: string;
  onChange?: (value: string) => void;
  onCurrencyChange?: (currency: CurrencyData) => void;
  error?: string;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
}

export function CurrencySelect({
  value,
  onChange,
  onCurrencyChange,
  error,
  label = "Currency *",
  placeholder = "Search currency…",
  disabled,
}: CurrencySelectProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  const { data, isLoading } = useCurrencies();
  const currencyOptions = data?.selectedCurrencyOptions ?? [];

  const selected = currencyOptions.find((c) => c.code === value);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = query
    ? currencyOptions.filter(
        (c) =>
          c.code.toLowerCase().includes(query.toLowerCase()) ||
          c.name.toLowerCase().includes(query.toLowerCase()) ||
          c.displayLabel.toLowerCase().includes(query.toLowerCase()),
      )
    : currencyOptions;

  const handleSearch = useCallback((val: string) => {
    setQuery(val);
    clearTimeout(debounceRef.current!);
    debounceRef.current = setTimeout(() => setOpen(true), 200);
  }, []);

  return (
    <div ref={ref} className="relative">
      <Label>{label}</Label>
      {selected ? (
        <div className="flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-800">
          <BadgeCheck className="h-4 w-4 shrink-0 text-emerald-500" />
          <span className="flex-1 text-sm">{selected.displayLabel}</span>
          {!disabled && (
            <button
              type="button"
              onClick={() => {
                onChange?.("");
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
            placeholder={placeholder}
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
          {filtered.map((c) => (
            <button
              key={c.code}
              type="button"
              className="flex w-full items-center px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => {
                onChange?.(c.code);
                onCurrencyChange?.(c);
                setOpen(false);
                setQuery("");
              }}
            >
              <span className="font-medium">{c.code}</span>
              <span className="ml-2 text-gray-500">{c.name}</span>
              {c.displaySymbol && <span className="ml-auto text-xs text-gray-400">{c.displaySymbol}</span>}
            </button>
          ))}
        </div>
      )}

      {open && !selected && query.length >= 1 && filtered.length === 0 && !isLoading && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-gray-200 bg-white p-3 text-center text-sm text-gray-500 shadow-lg dark:border-gray-700 dark:bg-gray-800">
          No currencies found
        </div>
      )}
    </div>
  );
}
