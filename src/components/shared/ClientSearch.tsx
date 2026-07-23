import { useState, useCallback, useEffect, useRef } from "react";
import { useFormContext } from "react-hook-form";
import { Search, X, BadgeCheck, ExternalLink, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useClients } from "@/features/clients";

export interface ClientSearchProps {
  value: number;
  onChange: (clientId: number) => void;
  onBlur?: () => void;
  disabled?: boolean;
  error?: string;
  label?: string;
  placeholder?: string;
  name?: string;
}

export function ClientSearch({
  value,
  onChange,
  onBlur,
  disabled,
  error,
  label = "Client *",
  placeholder = "Search client by name…",
  name,
}: ClientSearchProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  const { data, isLoading } = useClients(
    query.length >= 2 ? { limit: 20, offset: 0, displayName: query } : { limit: 100 },
  );

  const clients = data?.pageItems ?? [];
  const selected = clients.find((c) => c.id === value);

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
      <Label htmlFor={name ?? "clientSearch"}>{label}</Label>
      {selected ? (
        <div className="flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-800">
          <BadgeCheck className="h-4 w-4 shrink-0 text-emerald-500" />
          <span className="flex-1 text-sm">{selected.displayName ?? `Client #${selected.id}`}</span>
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
            id={name ?? "clientSearch"}
            placeholder={placeholder}
            className="pl-9"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => query.length >= 2 && setOpen(true)}
            disabled={disabled}
          />
        </div>
      )}

      {open && !selected && clients.length > 0 && (
        <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
          {clients.map((c) => (
            <button
              key={c.id}
              type="button"
              className="flex w-full items-center px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => {
                onChange(c.id);
                setOpen(false);
                setQuery("");
              }}
            >
              <span>{c.displayName ?? `Client #${c.id}`}</span>
              {c.accountNo && <span className="ml-2 text-xs text-gray-400">#{c.accountNo}</span>}
            </button>
          ))}
        </div>
      )}

      {open && !selected && query.length >= 2 && clients.length === 0 && !isLoading && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-gray-200 bg-white p-3 text-center text-sm text-gray-500 shadow-lg dark:border-gray-700 dark:bg-gray-800">
          No clients found
        </div>
      )}

      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}

      <Button
        type="button"
        variant="link"
        size="sm"
        className="mt-1 h-auto p-0 text-xs"
        onClick={() => window.open("/clients/new", "_blank")}
      >
        <ExternalLink className="mr-1 h-3 w-3" />
        Create New Client
      </Button>
    </div>
  );
}
