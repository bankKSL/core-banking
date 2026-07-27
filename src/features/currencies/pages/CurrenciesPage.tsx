import React, { useState } from "react";
import { Check, ChevronLeft, ChevronRight, Loader2, Save } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/shared/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrencies, useUpdateCurrencies } from "../hooks/useCurrencies";
import type { CurrencyData } from "../api/currencies";

const CurrenciesPage: React.FC = () => {
  const { data, isLoading, isError, refetch } = useCurrencies();
  const updateCurrencies = useUpdateCurrencies();

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [available, setAvailable] = useState<CurrencyData[]>([]);
  const [selectedCurrencies, setSelectedCurrencies] = useState<CurrencyData[]>([]);
  const [dirty, setDirty] = useState(false);

  React.useEffect(() => {
    if (data) {
      setAvailable(data.currencyOptions ?? []);
      setSelectedCurrencies(data.selectedCurrencyOptions ?? []);
      setSelected(new Set());
      setDirty(false);
    }
  }, [data]);

  const toggleAvailableItem = (code: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  };

  const handleAdd = () => {
    const toMove = available.filter((c) => selected.has(c.code));
    setSelectedCurrencies((prev) => [...prev, ...toMove]);
    setAvailable((prev) => prev.filter((c) => !selected.has(c.code)));
    setSelected(new Set());
    setDirty(true);
  };

  const handleRemove = (code: string) => {
    const toMove = selectedCurrencies.find((c) => c.code === code);
    if (!toMove) return;
    setAvailable((prev) => [...prev, toMove]);
    setSelectedCurrencies((prev) => prev.filter((c) => c.code !== code));
    setDirty(true);
  };

  const handleSave = () => {
    updateCurrencies.mutate(selectedCurrencies.map((c) => c.code), {
      onSuccess: () => setDirty(false),
    });
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
        <Card>
          <CardContent className="space-y-4 py-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6">
        <PageHeader title="Currencies" description="Configure supported currencies" />
        <ErrorState message="Failed to load currencies." onRetry={refetch} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Currencies"
        description="Configure supported currencies"
        actions={
          <Button onClick={handleSave} disabled={!dirty || updateCurrencies.isPending}>
            {updateCurrencies.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">Available Currencies</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {available.map((currency) => (
                <li key={currency.code}>
                  <button
                    type="button"
                    onClick={() => toggleAvailableItem(currency.code)}
                    className={`w-full flex items-center gap-3 rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                      selected.has(currency.code)
                        ? "border-[#D32F2F] bg-[#D32F2F]/5"
                        : "border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600"
                    }`}
                  >
                    <span
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                        selected.has(currency.code)
                          ? "border-[#D32F2F] bg-[#D32F2F] text-white"
                          : "border-gray-300 dark:border-gray-600"
                      }`}
                    >
                      {selected.has(currency.code) && <Check className="h-3 w-3" />}
                    </span>
                    <span className="font-medium">{currency.displaySymbol}</span>
                    <span className="text-gray-500 dark:text-gray-400">{currency.displayLabel}</span>
                  </button>
                </li>
              ))}
              {available.length === 0 && (
                <li className="py-8 text-center text-sm text-gray-400">All currencies selected</li>
              )}
            </ul>

            <Button
              variant="outline"
              className="mt-4 w-full"
              onClick={handleAdd}
              disabled={selected.size === 0}
            >
              <ChevronRight className="mr-2 h-4 w-4" />
              Add Selected ({selected.size})
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">Selected Currencies</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {selectedCurrencies.map((currency) => (
                <li key={currency.code}>
                  <div className="flex items-center justify-between rounded-md border border-gray-200 px-3 py-2 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                      <span className="font-medium">{currency.displaySymbol}</span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">{currency.displayLabel}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemove(currency.code)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Remove
                    </Button>
                  </div>
                </li>
              ))}
              {selectedCurrencies.length === 0 && (
                <li className="py-8 text-center text-sm text-gray-400">No currencies selected</li>
              )}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CurrenciesPage;
