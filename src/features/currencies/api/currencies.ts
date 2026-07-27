import client from "@/api/client";

export interface CurrencyData {
  code: string;
  name: string;
  decimalPlaces: number;
  inMultiplesOf: number;
  displaySymbol: string;
  displayLabel: string;
  nameCode: string;
}

export interface CurrenciesResponse {
  selectedCurrencyOptions: CurrencyData[];
  currencyOptions: CurrencyData[];
  selectedCurrencies?: CurrencyData[];
  currencies?: CurrencyData[];
}

export async function fetchCurrencies(): Promise<CurrenciesResponse> {
  const { data } = await client.get<CurrenciesResponse>("/currencies");
  return data;
}

export async function updateCurrencies(currencies: string[]): Promise<void> {
  await client.put("/currencies", { currencies });
}
