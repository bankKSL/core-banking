import React, { useCallback, useState } from "react";
import { ChevronUp, ChevronDown, ChevronsUpDown, Inbox } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

export interface ColumnDef<T> {
  key: string;
  header: string;
  accessorFn?: (row: T) => React.ReactNode;
  cell?: (row: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
  headerClassName?: string;
}

interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  onRowClick?: (row: T) => void;
  loading?: boolean;
  emptyState?: {
    icon?: React.ReactNode;
    title?: string;
    message: string;
  };
  selectable?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  idAccessor?: (row: T) => string;
  rowClassName?: (row: T) => string;
  skeletonRowCount?: number;
  /**
   * When true (default), the table is constrained to its container width
   * and a horizontal scrollbar appears INSIDE the table card whenever the
   * content is wider than the viewport. When false, the table is allowed
   * to grow beyond its container (legacy behavior).
   */
  responsive?: boolean;
  /**
   * Minimum width of the table in pixels. When the screen is narrower than
   * this value, the table will scroll horizontally instead of squashing
   * columns.
   * @default 640
   */
  minWidth?: number;
}

type SortDirection = "asc" | "desc" | null;

function DataTable<T>({
  columns,
  data,
  onRowClick,
  loading = false,
  emptyState,
  selectable = false,
  selectedIds = [],
  onSelectionChange,
  idAccessor = (row: any) => row.id,
  rowClassName,
  skeletonRowCount = 5,
  responsive = true,
  minWidth = 640,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  const handleSort = useCallback(
    (key: string) => {
      if (sortKey === key) {
        const next: SortDirection = sortDirection === "asc" ? "desc" : sortDirection === "desc" ? null : "asc";
        setSortDirection(next);
        if (next === null) setSortKey(null);
      } else {
        setSortKey(key);
        setSortDirection("asc");
      }
    },
    [sortKey, sortDirection],
  );

  const sortedData = React.useMemo(() => {
    if (!sortKey || !sortDirection) return data;
    const col = columns.find((c) => c.key === sortKey);
    if (!col) return data;

    return [...data].sort((a: any, b: any) => {
      const aVal = col.accessorFn ? col.accessorFn(a) : a[sortKey];
      const bVal = col.accessorFn ? col.accessorFn(b) : b[sortKey];

      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;

      const comparison =
        typeof aVal === "string" && typeof bVal === "string"
          ? aVal.localeCompare(bVal)
          : aVal < bVal
            ? -1
            : aVal > bVal
              ? 1
              : 0;

      return sortDirection === "desc" ? -comparison : comparison;
    });
  }, [data, sortKey, sortDirection, columns]);

  const handleSelectAll = useCallback(
    (checked: boolean) => {
      if (!onSelectionChange) return;
      if (checked) {
        onSelectionChange(data.map((row) => idAccessor(row)));
      } else {
        onSelectionChange([]);
      }
    },
    [data, idAccessor, onSelectionChange],
  );

  const handleSelectRow = useCallback(
    (id: string, checked: boolean) => {
      if (!onSelectionChange) return;
      if (checked) {
        onSelectionChange([...selectedIds, id]);
      } else {
        onSelectionChange(selectedIds.filter((sid) => sid !== id));
      }
    },
    [selectedIds, onSelectionChange],
  );

  const allSelected = data.length > 0 && data.every((row) => selectedIds.includes(idAccessor(row)));
  const someSelected = data.some((row) => selectedIds.includes(idAccessor(row))) && !allSelected;

  const renderSortIcon = (key: string) => {
    if (sortKey !== key) {
      return <ChevronsUpDown className="ml-1 h-3.5 w-3.5 text-gray-400" />;
    }
    if (sortDirection === "asc") {
      return <ChevronUp className="ml-1 h-3.5 w-3.5 text-[#D32F2F]" />;
    }
    if (sortDirection === "desc") {
      return <ChevronDown className="ml-1 h-3.5 w-3.5 text-[#D32F2F]" />;
    }
    return <ChevronsUpDown className="ml-1 h-3.5 w-3.5 text-gray-400" />;
  };

  // Loading skeleton
  if (loading) {
    return (
      <div
        className={cn(
          "rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800",
          responsive ? "block w-full max-w-full overflow-x-auto" : "w-full overflow-auto",
        )}
      >
        <Table className={cn(responsive && "w-full")} style={responsive ? { minWidth: `${minWidth}px` } : undefined}>
          <TableHeader>
            <TableRow>
              {selectable && (
                <TableHead className="w-12">
                  <Skeleton className="h-4 w-4 rounded" />
                </TableHead>
              )}
              {columns.map((col) => (
                <TableHead key={col.key} className={col.headerClassName}>
                  <Skeleton className="h-4 w-20" />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: skeletonRowCount }).map((_, i) => (
              <TableRow key={`skel-${i}`}>
                {selectable && (
                  <TableCell>
                    <Skeleton className="h-4 w-4 rounded" />
                  </TableCell>
                )}
                {columns.map((col) => (
                  <TableCell key={col.key}>
                    <Skeleton className="h-4 w-full max-w-30" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  // Empty state
  if (data.length === 0) {
    return (
      <div className="w-full overflow-x-auto rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        <div className="flex flex-col items-center justify-center py-16 px-4">
          {emptyState?.icon ?? <Inbox className="h-12 w-12 text-gray-300 dark:text-gray-600" />}
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-gray-100">
            {emptyState?.title ?? "No data found"}
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{emptyState?.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800",
        responsive ? "block w-full max-w-full overflow-x-auto" : "w-full overflow-auto",
      )}
    >
      <Table className={cn(responsive && "w-full")} style={responsive ? { minWidth: `${minWidth}px` } : undefined}>
        <TableHeader>
          <TableRow>
            {selectable && (
              <TableHead className="w-12">
                <Checkbox
                  checked={allSelected}
                  indeterminate={someSelected}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all"
                />
              </TableHead>
            )}
            {columns.map((col) => (
              <TableHead
                key={col.key}
                className={cn(col.sortable !== false && "cursor-pointer select-none", col.headerClassName)}
                onClick={() => {
                  if (col.sortable !== false) handleSort(col.key);
                }}
              >
                <span className="inline-flex items-center">
                  {col.header}
                  {col.sortable !== false && renderSortIcon(col.key)}
                </span>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedData.map((row, idx) => {
            const rowId = idAccessor(row);
            return (
              <TableRow
                key={rowId ?? idx}
                className={cn(onRowClick && "cursor-pointer", rowClassName?.(row))}
                onClick={() => onRowClick?.(row)}
                data-state={selectedIds.includes(rowId) ? "selected" : undefined}
              >
                {selectable && (
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedIds.includes(rowId)}
                      onCheckedChange={(checked) => handleSelectRow(rowId, checked === true)}
                      aria-label={`Select row ${rowId}`}
                    />
                  </TableCell>
                )}
                {columns.map((col) => (
                  <TableCell key={col.key} className={col.className}>
                    {col.cell ? col.cell(row) : col.accessorFn ? col.accessorFn(row) : (row as any)[col.key]}
                  </TableCell>
                ))}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

export { DataTable };
export type { DataTableProps };
