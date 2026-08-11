import type { DelinquencyRange } from "./delinquencyBucket";

export type { DelinquencyRange };

export interface DelinquencyRangeCreateRequest {
  classification: string;
  minimumAgeDays: number;
  maximumAgeDays?: number | null;
  locale: string;
}

export interface DelinquencyRangeUpdateRequest {
  classification?: string;
  minimumAgeDays?: number;
  maximumAgeDays?: number | null;
  locale: string;
}

export interface DelinquencyRangeCommandResponse {
  resourceId: number;
  changes?: Record<string, unknown>;
}
