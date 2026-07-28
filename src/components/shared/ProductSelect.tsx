import { useState, useCallback, useEffect, useRef } from "react";
import { Search, X, BadgeCheck, ExternalLink, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useSavingsProducts } from "@/features/deposits";

export interface ProductSelectProps {
  value: number;
  onChange: (value: number) => void;
  error?: string;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
}

export function ProductSelect({
  value,
  onChange,
  error,
  label = "Savings Product *",
  placeholder = "Search product by name\u2026",
  disabled,
}: ProductSelectProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  const { data: products, isLoading } = useSavingsProducts();

  const filtered = (products ?? []).filter(
    (p) => !query || p.name.toLowerCase().includes(query.toLowerCase()),
  );
  const selected = (products ?? []).find((p) => p.id === value);

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
      <Label>{label}</Label>
      {selected ? (
        <div className="flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-800">
          <BadgeCheck className="h-4 w-4 shrink-0 text-emerald-500" />
          <span className="flex-1 text-sm">{selected.name}</span>
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
            placeholder={placeholder}
            className="pl-9"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => setOpen(true)}
            disabled={disabled}
          />
        </div>
      )}

      {isLoading && !selected && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-gray-200 bg-white p-3 text-center text-sm text-gray-500 shadow-lg dark:border-gray-700 dark:bg-gray-800">
          <Loader2 className="mx-auto h-5 w-5 animate-spin" />
        </div>
      )}

      {open && !selected && !isLoading && filtered.length > 0 && (
        <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
          {filtered.map((p) => (
            <button
              key={p.id}
              type="button"
              className="flex w-full items-center px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => {
                onChange(p.id);
                setOpen(false);
                setQuery("");
              }}
            >
              <span>{p.name}</span>
            </button>
          ))}
        </div>
      )}

      {open && !selected && !isLoading && query && filtered.length === 0 && (
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
        onClick={() => window.open("/deposits/products", "_blank")}
      >
        <ExternalLink className="mr-1 h-3 w-3" />
        Create New Product
      </Button>
    </div>
  );
}
