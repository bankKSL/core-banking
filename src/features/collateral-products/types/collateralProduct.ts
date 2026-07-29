export interface CollateralProduct {
  id: number;
  name: string;
  quality: string;
  basePrice: number;
  pctToBase: number;
  unitType: string;
  currency: string;
}

export interface CollateralProductCreateRequest {
  name: string;
  quality: string;
  basePrice: number;
  pctToBase: number;
  unitType: string;
  currency: string;
  locale: string;
}

export type CollateralProductUpdateRequest = Partial<CollateralProductCreateRequest>;

export interface CollateralProductCommandResponse {
  resourceId: number;
  changes?: Record<string, unknown>;
}

export interface CollateralProductTemplate {
  currencies: Array<{
    code: string;
    name: string;
    decimalPlaces?: number;
    inMultiplesOf?: number;
    displaySymbol?: string;
    nameCode?: string;
  }>;
}
