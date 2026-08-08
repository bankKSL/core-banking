import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Search, X, BadgeCheck, ExternalLink, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useStaffList } from "@/features/staff";

export interface StaffSearchProps {
  value: number;
  onChange: (staffId: number) => void;
  onBlur?: () => void;
  disabled?: boolean;
  error?: string;
  label?: string;
  placeholder?: string;
  name?: string;
}

export function StaffSearch({
  value,
  onChange,
  onBlur,
  disabled,
  error,
  label,
  placeholder,
  name,
}: StaffSearchProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  const { data: allStaff, isLoading } = useStaffList();
  const staffList = useMemo(() => allStaff ?? [], [allStaff]);

  const filtered = useMemo(() => {
    if (!query) return staffList;
    const q = query.toLowerCase();
    return staffList.filter(
      (s) =>
        s.displayName.toLowerCase().includes(q) ||
        String(s.id).includes(q) ||
        s.officeName.toLowerCase().includes(q),
    );
  }, [staffList, query]);

  const selected = staffList.find((s) => s.id === value);

  const resolvedLabel = label ?? t("Staff");
  const resolvedPlaceholder = placeholder ?? t("Search staff by name…");

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
    <div ref={ref} className="relative space-y-1.5">
      <label className="block text-sm font-medium">{resolvedLabel}</label>
      {selected ? (
        <div className="flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-800">
          <BadgeCheck className="h-4 w-4 shrink-0 text-emerald-500" />
          <span className="flex-1 text-sm">
            {selected.displayName ?? t("Staff #{{id}}", { id: selected.id })}
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
          {isLoading && !selected ? (
            <Loader2 className="absolute left-3 top-5 h-4 w-4 -translate-y-1/2 text-gray-400 animate-spin" />
          ) : (
            <Search className="absolute left-3 top-5 h-4 w-4 -translate-y-1/2 text-gray-400" />
          )}

          <Input
            id={name ?? "staffSearch"}
            placeholder={resolvedPlaceholder}
            className="pl-9"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => query.length >= 0 && setOpen(true)}
            disabled={disabled}
            onFocusCapture={() => setOpen((prev) => !prev)}
            error={error}
          />
        </div>
      )}

      {open && !selected && filtered.length > 0 && (
        <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
          {filtered.map((s) => (
            <button
              key={s.id}
              type="button"
              className="flex w-full items-center px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => {
                onChange(s.id);
                setOpen(false);
                setQuery("");
              }}
            >
              <span>{s.displayName ?? t("Staff #{{id}}", { id: s.id })}</span>
              {s.officeName && (
                <span className="ml-2 text-xs text-gray-400">({s.officeName})</span>
              )}
            </button>
          ))}
        </div>
      )}

      {open && !selected && query.length >= 2 && filtered.length === 0 && !isLoading && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-gray-200 bg-white p-3 text-center text-sm text-gray-500 shadow-lg dark:border-gray-700 dark:bg-gray-800">
          {t("No staff found")}
        </div>
      )}

      <Button
        type="button"
        variant="link"
        size="sm"
        className="mt-1 h-auto p-0 text-xs"
        onClick={() => window.open("/admin/staff/new", "_blank")}
      >
        <ExternalLink className="mr-1 h-3 w-3" />
        {t("Create New Staff")}
      </Button>
    </div>
  );
}
