import { useState, useCallback, useEffect, useRef } from "react";
import { Search, X, BadgeCheck, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { LoanProduct } from "@/features/loans";

export interface ProductSearchProps {
  products: LoanProduct[];
  value: number;
  onChange: (productId: number) => void;
  disabled?: boolean;
  error?: string;
  label?: string;
  placeholder?: string;
  name?: string;
}

export function ProductSearch({
  products,
  value,
  onChange,
  disabled,
  error,
  label = "Loan Product *",
  placeholder = "Search product by name…",
  name,
}: ProductSearchProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  const filtered =
    query.length >= 2 ? products.filter((p) => p.name.toLowerCase().includes(query.toLowerCase())) : products;

  const selected = products.find((p) => p.id === value);
  const isProgressive =
    selected &&
    ((selected as any).loanScheduleType?.code === "PROGRESSIVE" ||
      (selected as any).loanScheduleType === "PROGRESSIVE");
  const scheduleLabel = selected && isProgressive ? "Progressive" : selected ? "Cumulative" : null;

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
    <div ref={ref} className="relative">
      <Label htmlFor={name ?? "productSearch"}>{label}</Label>
      {selected ? (
        <div className="flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-800">
          <BadgeCheck className="h-4 w-4 shrink-0 text-emerald-500" />
          <span className="flex-1 text-sm">{selected.name}</span>
          {scheduleLabel && (
            <Badge variant={isProgressive ? "info" : "default"} size="sm" rounded>
              {scheduleLabel}
            </Badge>
          )}
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
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            id={name ?? "productSearch"}
            placeholder={placeholder}
            className="pl-9"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => query.length >= 2 && setOpen(true)}
            disabled={disabled}
          />
        </div>
      )}

      {open && !selected && filtered.length > 0 && (
        <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
          {filtered.map((p) => {
            const prog =
              (p as any).loanScheduleType?.code === "PROGRESSIVE" || (p as any).loanScheduleType === "PROGRESSIVE";
            return (
              <button
                key={p.id}
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => {
                  onChange(p.id);
                  setOpen(false);
                  setQuery("");
                }}
              >
                <span className="flex-1">{p.name}</span>
                <Badge variant={prog ? "info" : "default"} size="sm" rounded>
                  {prog ? "Progressive" : "Cumulative"}
                </Badge>
              </button>
            );
          })}
        </div>
      )}

      {open && !selected && query.length >= 2 && filtered.length === 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-gray-200 bg-white p-3 text-center text-sm text-gray-500 shadow-lg dark:border-gray-700 dark:bg-gray-800">
          No products found
        </div>
      )}

      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}

      <Button
        type="button"
        variant="link"
        size="sm"
        className="mt-1 h-auto p-0 text-xs"
        onClick={() => window.open("/lending/products", "_blank")}
      >
        <ExternalLink className="mr-1 h-3 w-3" />
        Create New Product
      </Button>
    </div>
  );
}
