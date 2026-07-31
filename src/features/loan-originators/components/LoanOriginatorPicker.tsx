import { useState } from "react";
import { Search, Check, ChevronsUpDown, Loader2, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useLoanOriginators } from "../hooks/useLoanOriginators";
import type { LoanOriginator } from "../types/loanOriginator";

interface LoanOriginatorPickerProps {
  value: LoanOriginator[];
  onChange: (value: LoanOriginator[]) => void;
  disabled?: boolean;
  loading?: boolean;
  /** Originator ids that must not be offered (e.g. already attached to the loan). */
  excludeIds?: number[];
  /** Only offer ACTIVE originators (server rule for attach). Default true. */
  onlyActive?: boolean;
  error?: string;
}

export function LoanOriginatorPicker({
  value,
  onChange,
  disabled,
  loading,
  excludeIds = [],
  onlyActive = true,
  error,
}: LoanOriginatorPickerProps) {
  const { data: originators = [], isLoading } = useLoanOriginators();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selectedIds = new Set(value.map((o) => o.id));
  const excluded = new Set(excludeIds);

  const options = originators.filter((o) => {
    if (onlyActive && o.status !== "ACTIVE") return false;
    if (excluded.has(o.id)) return false;
    const q = query.toLowerCase();
    if (!q) return true;
    return (o.name ?? "").toLowerCase().includes(q) || o.externalId.toLowerCase().includes(q);
  });

  const toggle = (originator: LoanOriginator, checked: boolean) => {
    if (checked) {
      onChange([...value, originator]);
    } else {
      onChange(value.filter((o) => o.id !== originator.id));
    }
  };

  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium">Originators</label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            disabled={disabled || loading}
            className="w-full justify-between font-normal"
          >
            {value.length === 0 ? (
              <span className="text-gray-500">Select originators…</span>
            ) : (
              <span className="flex flex-wrap gap-1">
                {value.map((o) => (
                  <Badge key={o.id} variant="default" size="sm" rounded>
                    {o.name || o.externalId}
                  </Badge>
                ))}
              </span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start">
          <div className="flex items-center gap-2 border-b border-gray-200 px-3 py-2 dark:border-gray-700">
            <Search className="h-4 w-4 text-gray-400" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search originators…"
              className="border-0 shadow-none focus-visible:ring-0 px-0"
            />
            {query && (
              <button type="button" onClick={() => setQuery("")} className="text-gray-400 hover:text-gray-600">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="max-h-60 overflow-auto p-1">
            {isLoading || loading ? (
              <div className="flex items-center justify-center py-8 text-gray-400">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            ) : options.length === 0 ? (
              <p className="px-3 py-8 text-center text-sm text-gray-400">
                {originators.length === 0 ? "No originators defined." : "No matching originators."}
              </p>
            ) : (
              options.map((o) => {
                const checked = selectedIds.has(o.id);
                return (
                  <div
                    key={o.id}
                    role="button"
                    tabIndex={0}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => toggle(o, !checked)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        toggle(o, !checked);
                      }
                    }}
                  >
                    <Checkbox
                      checked={checked}
                      tabIndex={-1}
                      className="pointer-events-none"
                      onCheckedChange={() => undefined}
                    />
                    <span className="flex-1 truncate">{o.name || "—"}</span>
                    <span className="truncate font-mono text-xs text-gray-400">{o.externalId}</span>
                    {checked && <Check className="h-4 w-4 shrink-0 text-[#D32F2F]" />}
                  </div>
                );
              })
            )}
          </div>
        </PopoverContent>
      </Popover>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

export default LoanOriginatorPicker;
