import { useState, useCallback, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Search, X, BadgeCheck, Package } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface ProductItem {
  id: number;
  name: string;
  shortName?: string;
  currency?: { code: string };
}

export interface ProductSearchProps {
  value: string;
  onChange: (productId: string) => void;
  products: ProductItem[];
  disabled?: boolean;
  error?: string;
  label?: string;
  placeholder?: string;
}

export function ProductSearch({
  value,
  onChange,
  products,
  disabled,
  error,
  label,
  placeholder,
}: ProductSearchProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  const filtered = query
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(query.toLowerCase()) ||
          (p.shortName ?? "").toLowerCase().includes(query.toLowerCase()),
      )
    : products;

  const selected = products.find((p) => String(p.id) === value);

  const resolvedLabel = label ?? t("Product *");
  const resolvedPlaceholder = placeholder ?? t("Search product by name…");

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
            {selected.name}
            {selected.currency?.code && <span className="ml-1 text-gray-400">({selected.currency.code})</span>}
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
          {filtered.map((p) => (
            <button
              key={p.id}
              type="button"
              className="flex w-full items-center px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => {
                onChange(String(p.id));
                setOpen(false);
                setQuery("");
              }}
            >
              <Package className="mr-2 h-4 w-4 shrink-0 text-gray-400" />
              <div className="flex-1">
                <span className="font-medium">{p.name}</span>
                {p.shortName && <span className="ml-2 text-xs text-gray-400">({p.shortName})</span>}
              </div>
              {p.currency?.code && <span className="text-xs text-gray-400">{p.currency.code}</span>}
            </button>
          ))}
        </div>
      )}

      {open && !selected && query.length >= 1 && filtered.length === 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-gray-200 bg-white p-3 text-center text-sm text-gray-500 shadow-lg dark:border-gray-700 dark:bg-gray-800">
          {t("No products found")}
        </div>
      )}
    </div>
  );
}
