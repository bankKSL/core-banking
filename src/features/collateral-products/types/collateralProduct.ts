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
}

export interface CollateralProductTemplate {
  currencies: Array<{ code: string; name: string }>;
}
