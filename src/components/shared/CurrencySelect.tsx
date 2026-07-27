import type { CurrencyData } from "@/features/currencies";
import { useCurrencies } from "@/features/currencies";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";

export interface CurrencySelectProps {
  value: string;
  onChange?: (value: string) => void;
  onCurrencyChange?: (currency: CurrencyData) => void;
  error?: string;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
}

export function CurrencySelect({
  value,
  onChange,
  onCurrencyChange,
  error,
  label = "Currency *",
  placeholder = "Select currency",
  disabled,
}: CurrencySelectProps) {
  const { data, isLoading } = useCurrencies();
  const currencyOptions = data?.selectedCurrencyOptions ?? [];

  if (isLoading) {
    return (
      <div className="space-y-1.5">
        {label && <Label>{label}</Label>}
        <Skeleton className="h-10 w-full rounded-md" />
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {label && <Label>{label}</Label>}
      <Select
        value={value}
        onValueChange={(v) => {
          onChange?.(v);
          const currency = currencyOptions.find((c) => c.code === v);
          if (currency && onCurrencyChange) {
            onCurrencyChange(currency);
          }
        }}
        disabled={disabled}
      >
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {currencyOptions.map((c) => (
            <SelectItem key={c.code} value={c.code}>
              {c.code}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
