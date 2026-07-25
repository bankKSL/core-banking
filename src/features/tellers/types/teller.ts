export type TellerStatus = 100 | 300 | 400 | 600;

export const TELLER_STATUS_OPTIONS = [
  { id: 100, label: "Pending" },
  { id: 300, label: "Active" },
  { id: 400, label: "Inactive" },
  { id: 600, label: "Closed" },
];

export interface Teller {
  id: number;
  officeId: number;
  officeName?: string;
  name: string;
  description?: string;
  status: TellerStatus;
  startDate: string;
  endDate?: string;
  debitAccountId?: number;
  creditAccountId?: number;
}

export interface TellerCreateRequest {
  officeId: number;
  name: string;
  description?: string;
  status: TellerStatus;
  startDate: string;
  endDate?: string;
  locale: string;
  dateFormat: string;
}

export type TellerUpdateRequest = Partial<TellerCreateRequest>;

export interface Cashier {
  id: number;
  tellerId: number;
  staffId: number;
  staffName?: string;
  startDate: string;
  endDate: string;
  isFullDay: boolean;
  hourStartTime?: number;
  minStartTime?: number;
  hourEndTime?: number;
  minEndTime?: number;
  description?: string;
}

export interface CashierCreateRequest {
  staffId: number;
  startDate: string;
  endDate: string;
  isFullDay: boolean;
  hourStartTime?: number;
  minStartTime?: number;
  hourEndTime?: number;
  minEndTime?: number;
  description?: string;
  locale: string;
  dateFormat: string;
}

export type CashierUpdateRequest = Partial<CashierCreateRequest>;

export interface CashierTemplate {
  staffOptions: Array<{ id: number; displayName: string }>;
}

export interface CashTxnRequest {
  txnDate: string;
  txnAmount: number;
  currencyCode: string;
  txnNote: string;
  locale: string;
  dateFormat: string;
}

export interface CashierTransaction {
  id: number;
  cashierId: number;
  txnType: number;
  txnAmount: number;
  txnDate: string;
  txnNote?: string;
  entityType?: string;
  entityId?: number;
  createdDate?: string;
}

export interface CashierSummary {
  netCash: number;
  cashAllocated: number;
  cashIn: number;
  cashOut: number;
  cashSettled: number;
}
