import React, { useState, useMemo, useCallback } from "react";
import { Search, TrendingUp, Globe, RefreshCw, Plus, Pencil, Trash2, ArrowUpDown } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { DataTable, type ColumnDef } from "@/components/shared/DataTable";
import { Pagination } from "@/components/shared/Pagination";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { exchangeRates } from "@/mock/data";
import type { ExchangeRate } from "@/types";

const PAGE_SIZE = 8;

const sourceLabels: Record<ExchangeRate["source"], string> = {
  central_bank: "Central Bank",
  commercial_bank: "Commercial Bank",
  market: "Market",
  manual: "Manual",
};

const sourceColors: Record<ExchangeRate["source"], string> = {
  central_bank: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  commercial_bank: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
  market: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
  manual: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
};

const CURRENCY_OPTIONS: Array<{ code: string; name: string; country: string; symbol: string }> = [
  { code: "USD", name: "US Dollar", country: "United States", symbol: "$" },
  { code: "LAK", name: "Lao Kip", country: "Laos", symbol: "₭" },
  { code: "THB", name: "Thai Baht", country: "Thailand", symbol: "฿" },
  { code: "CNY", name: "Chinese Yuan", country: "China", symbol: "¥" },
];

const emptyRate: Omit<ExchangeRate, "id" | "lastUpdated"> = {
  currencyCode: "USD",
  currencyName: "US Dollar",
  country: "United States",
  symbol: "$",
  buyRate: 0,
  sellRate: 0,
  midRate: 0,
  spreadPercent: 0,
  source: "commercial_bank",
  isActive: true,
};

const ExchangeRatePage: React.FC = () => {
  const [data, setData] = useState<ExchangeRate[]>(exchangeRates);
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ExchangeRate | null>(null);
  const [form, setForm] = useState<Omit<ExchangeRate, "id" | "lastUpdated">>(emptyRate);

  const stats = useMemo(
    () => ({
      total: data.length,
      active: data.filter((r) => r.isActive).length,
      avgSpread: data.length > 0 ? (data.reduce((s, r) => s + r.spreadPercent, 0) / data.length).toFixed(2) : "0",
      lastUpdated:
        data.length > 0
          ? new Date(
              data.reduce((a, b) => (new Date(a.lastUpdated) > new Date(b.lastUpdated) ? a : b)).lastUpdated,
            ).toLocaleDateString()
          : "—",
    }),
    [data],
  );

  const filtered = useMemo(() => {
    let result = data;
    const q = search.toLowerCase();
    if (q)
      result = result.filter(
        (r) =>
          r.currencyCode.toLowerCase().includes(q) ||
          r.currencyName.toLowerCase().includes(q) ||
          r.country.toLowerCase().includes(q),
      );
    if (sourceFilter !== "all") result = result.filter((r) => r.source === sourceFilter);
    return result;
  }, [data, search, sourceFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = useMemo(
    () => filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [filtered, safePage],
  );

  const formatRate = (n: number) => {
    if (n >= 1000) return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (n >= 1) return n.toFixed(4);
    return n.toFixed(4);
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyRate);
    setDialogOpen(true);
  };

  const openEdit = (r: ExchangeRate) => {
    setEditingId(r.id);
    setForm({
      currencyCode: r.currencyCode,
      currencyName: r.currencyName,
      country: r.country,
      symbol: r.symbol,
      buyRate: r.buyRate,
      sellRate: r.sellRate,
      midRate: r.midRate,
      spreadPercent: r.spreadPercent,
      source: r.source,
      isActive: r.isActive,
    });
    setDialogOpen(true);
  };

  const handleSave = useCallback(() => {
    if (!form.currencyCode || !form.currencyName) return;
    if (editingId) {
      setData((prev) =>
        prev.map((r) => (r.id === editingId ? { ...r, ...form, lastUpdated: new Date().toISOString() } : r)),
      );
    } else {
      const newRate: ExchangeRate = {
        ...form,
        id: `fx-${Date.now()}`,
        lastUpdated: new Date().toISOString(),
      };
      setData((prev) => [newRate, ...prev]);
    }
    setDialogOpen(false);
  }, [form, editingId]);

  const handleDelete = () => {
    if (!deleteTarget) return;
    setData((prev) => prev.filter((r) => r.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  const handleRefreshRates = () => {
    setData((prev) => prev.map((r) => ({ ...r, lastUpdated: new Date().toISOString() })));
  };

  const columns: ColumnDef<ExchangeRate>[] = [
    {
      key: "currencyCode",
      header: "Code",
      sortable: true,
      accessorFn: (r) => <span className="font-semibold text-gray-900 dark:text-white">{r.currencyCode}</span>,
    },
    {
      key: "currencyName",
      header: "Currency",
      sortable: true,
      accessorFn: (r) => (
        <div className="flex flex-col">
          <span className="text-sm font-medium">{r.currencyName}</span>
          <span className="text-xs text-gray-400">{r.country}</span>
        </div>
      ),
    },
    {
      key: "buyRate",
      header: "Buy Rate",
      sortable: true,
      accessorFn: (r) => (
        <span className="font-mono text-sm text-green-600 dark:text-green-400">
          {r.symbol} {formatRate(r.buyRate)}
        </span>
      ),
    },
    {
      key: "sellRate",
      header: "Sell Rate",
      sortable: true,
      accessorFn: (r) => (
        <span className="font-mono text-sm text-red-600 dark:text-red-400">
          {r.symbol} {formatRate(r.sellRate)}
        </span>
      ),
    },
    {
      key: "midRate",
      header: "Mid Rate",
      sortable: true,
      accessorFn: (r) => (
        <span className="font-mono text-sm">
          {r.symbol} {formatRate(r.midRate)}
        </span>
      ),
    },
    {
      key: "spreadPercent",
      header: "Spread",
      sortable: true,
      accessorFn: (r) => <span className="text-sm">{r.spreadPercent.toFixed(2)}%</span>,
    },
    {
      key: "source",
      header: "Source",
      sortable: true,
      accessorFn: (r) => <Badge className={sourceColors[r.source]}>{sourceLabels[r.source]}</Badge>,
    },
    {
      key: "isActive",
      header: "Status",
      sortable: true,
      accessorFn: (r) => <StatusBadge status={r.isActive ? "active" : "inactive"} />,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Exchange Rates"
        description="Manage foreign exchange rates across currencies"
        actions={
          <>
            <Button variant="outline" onClick={handleRefreshRates}>
              <RefreshCw className="mr-2 h-4 w-4" /> Refresh Rates
            </Button>
            <Button onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" /> Add Rate
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Currencies" value={stats.total} icon={Globe} variant="default" />
        <StatCard title="Active" value={stats.active} icon={TrendingUp} variant="success" />
        <StatCard title="Avg Spread" value={`${stats.avgSpread}%`} icon={ArrowUpDown} variant="warning" />
        <StatCard title="Last Updated" value={stats.lastUpdated} icon={RefreshCw} variant="default" />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>All Rates</CardTitle>
          <div className="flex items-center gap-3">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search currency..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-9"
              />
            </div>
            <Select
              value={sourceFilter}
              onValueChange={(v) => {
                setSourceFilter(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Sources" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="central_bank">Central Bank</SelectItem>
                <SelectItem value="commercial_bank">Commercial Bank</SelectItem>
                <SelectItem value="market">Market</SelectItem>
                <SelectItem value="manual">Manual</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={paginated}
            onRowClick={openEdit}
            emptyState={{ message: "No exchange rates found" }}
          />
          {filtered.length > PAGE_SIZE && (
            <div className="mt-4">
              <Pagination
                currentPage={safePage}
                totalPages={totalPages}
                onPageChange={setPage}
                totalItems={filtered.length}
                pageSize={PAGE_SIZE}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Exchange Rate" : "Add Exchange Rate"}</DialogTitle>
            <DialogDescription>
              {editingId ? "Update the rate details below." : "Add a new currency exchange rate."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="col-span-2">
              <label className="text-sm font-medium">Currency *</label>
              <Select
                value={form.currencyCode}
                onValueChange={(code) => {
                  const opt = CURRENCY_OPTIONS.find((c) => c.code === code);
                  if (opt) {
                    setForm({
                      ...form,
                      currencyCode: opt.code,
                      currencyName: opt.name,
                      country: opt.country,
                      symbol: opt.symbol,
                    });
                  }
                }}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select a currency" />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCY_OPTIONS.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.code} — {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Country</label>
              <Input className="mt-1" value={form.country} disabled />
            </div>
            <div>
              <label className="text-sm font-medium">Symbol</label>
              <Input className="mt-1" value={form.symbol} disabled />
            </div>
            <div>
              <label className="text-sm font-medium">Buy Rate</label>
              <Input
                className="mt-1"
                type="number"
                step="any"
                value={form.buyRate}
                onChange={(e) => setForm({ ...form, buyRate: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Sell Rate</label>
              <Input
                className="mt-1"
                type="number"
                step="any"
                value={form.sellRate}
                onChange={(e) => setForm({ ...form, sellRate: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Mid Rate</label>
              <Input
                className="mt-1"
                type="number"
                step="any"
                value={form.midRate}
                onChange={(e) => setForm({ ...form, midRate: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Spread %</label>
              <Input
                className="mt-1"
                type="number"
                step="any"
                value={form.spreadPercent}
                onChange={(e) => setForm({ ...form, spreadPercent: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium">Source</label>
              <Select
                value={form.source}
                onValueChange={(v: ExchangeRate["source"]) => setForm({ ...form, source: v })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="central_bank">Central Bank</SelectItem>
                  <SelectItem value="commercial_bank">Commercial Bank</SelectItem>
                  <SelectItem value="market">Market</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 flex items-center gap-2">
              <input
                type="checkbox"
                id="fx-active"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-[#D32F2F] focus:ring-[#D32F2F]"
              />
              <label htmlFor="fx-active" className="text-sm font-medium">
                Active
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>{editingId ? "Save Changes" : "Add Rate"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(v) => {
          if (!v) setDeleteTarget(null);
        }}
        title="Delete Exchange Rate"
        description={`Are you sure you want to delete ${deleteTarget?.currencyCode} — ${deleteTarget?.currencyName}? This action cannot be undone.`}
        onConfirm={handleDelete}
        variant="destructive"
      />
    </div>
  );
};

export default ExchangeRatePage;
