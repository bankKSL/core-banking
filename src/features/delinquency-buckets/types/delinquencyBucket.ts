export interface StringEnumOptionData {
  id: string;
  code: string;
  value: string;
}

export interface DelinquencyRange {
  id: number;
  classification: string;
  minimumAgeDays: number;
  maximumAgeDays: number | null;
}

export interface MinimumPaymentPeriodAndRule {
  frequency: number;
  frequencyType: StringEnumOptionData;
  minimumPayment: number;
  minimumPaymentType: StringEnumOptionData;
}

export interface DelinquencyBucket {
  id: number;
  name: string;
  ranges: DelinquencyRange[];
  bucketType: StringEnumOptionData;
  minimumPaymentPeriodAndRule: MinimumPaymentPeriodAndRule | null;
}

export interface MinimumPaymentPeriodAndRuleRequest {
  frequency: number;
  frequencyType: string;
  minimumPayment: number;
  minimumPaymentType: string;
}

export interface DelinquencyBucketCreateRequest {
  name: string;
  ranges: number[];
  bucketType?: string;
  minimumPaymentPeriodAndRule?: MinimumPaymentPeriodAndRuleRequest;
}

export type DelinquencyBucketUpdateRequest = DelinquencyBucketCreateRequest;

export interface DelinquencyBucketTemplate {
  rangesOptions: DelinquencyRange[];
  bucketTypeOptions: StringEnumOptionData[];
  frequencyTypeOptions: StringEnumOptionData[];
  minimumPaymentOptions: StringEnumOptionData[];
}
