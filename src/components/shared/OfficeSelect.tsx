import { useState, useCallback, useEffect, useRef } from "react";
import { Search, X, BadgeCheck, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useOffices } from "@/hooks/useOffices";

export interface OfficeSelectProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  includeAll?: string;
  includeNone?: string;
}

export function OfficeSelect({
  value,
  onChange,
  error,
  label = "Office *",
  placeholder = "Search office by name\u2026",
  disabled,
  includeAll,
  includeNone,
}: OfficeSelectProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  const { data: offices, isLoading } = useOffices();

  const filtered = (offices ?? []).filter((o) => !query || o.name.toLowerCase().includes(query.toLowerCase()));
  const selected = (offices ?? []).find((o) => String(o.id) === value);

  const isSpecialValue = (includeAll && value === "all") || (includeNone && value === "");

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

  const handleSelect = (id: string) => {
    onChange(id);
    setOpen(false);
    setQuery("");
  };

  const displayLabel = () => {
    if (selected) return selected.name;
    if (includeAll && value === "all") return includeAll;
    if (includeNone && value === "") return includeNone;
    return "";
  };

  return (
    <div ref={ref} className="relative">
      {label && <Label>{label}</Label>}
      {selected || isSpecialValue ? (
        <div className="flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-800">
          <BadgeCheck className="h-4 w-4 shrink-0 text-emerald-500" />
          <span className="flex-1 text-sm">{displayLabel()}</span>
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
          {isLoading && !selected && !isSpecialValue ? (
            <Loader2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 animate-spin" />
          ) : (
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          )}

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

      {open && !selected && !isSpecialValue && !isLoading && filtered.length > 0 && (
        <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
          {includeAll && (
            <button
              type="button"
              className="flex w-full items-center px-3 py-2 text-left text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
              onClick={() => handleSelect("all")}
            >
              {includeAll}
            </button>
          )}
          {includeNone && (
            <button
              type="button"
              className="flex w-full items-center px-3 py-2 text-left text-sm text-gray-500 italic hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => handleSelect("")}
            >
              {includeNone}
            </button>
          )}
          {filtered.map((o) => (
            <button
              key={o.id}
              type="button"
              className="flex w-full items-center px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => handleSelect(String(o.id))}
            >
              <span>{o.name}</span>
            </button>
          ))}
        </div>
      )}

      {open &&
        !selected &&
        !isSpecialValue &&
        !isLoading &&
        query &&
        filtered.length === 0 &&
        !includeAll &&
        !includeNone && (
          <div className="absolute z-50 mt-1 w-full rounded-md border border-gray-200 bg-white p-3 text-center text-sm text-gray-500 shadow-lg dark:border-gray-700 dark:bg-gray-800">
            No offices found
          </div>
        )}

      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
