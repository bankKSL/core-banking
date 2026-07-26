export type TransferStatus =
  | "ACTIVE"
  | "ACTIVE_INTERMEDIATE"
  | "DECLINED"
  | "PENDING"
  | "PENDING_INTERMEDIATE"
  | "BUYBACK"
  | "BUYBACK_INTERMEDIATE"
  | "CANCELLED";

export const TRANSFER_STATUS_OPTIONS: { id: TransferStatus; label: string }[] = [
  { id: "ACTIVE", label: "Active" },
  { id: "ACTIVE_INTERMEDIATE", label: "Active (Intermediate)" },
  { id: "DECLINED", label: "Declined" },
  { id: "PENDING", label: "Pending" },
  { id: "PENDING_INTERMEDIATE", label: "Pending (Intermediate)" },
  { id: "BUYBACK", label: "Buyback" },
  { id: "BUYBACK_INTERMEDIATE", label: "Buyback (Intermediate)" },
  { id: "CANCELLED", label: "Cancelled" },
];

export const STATUS_LABELS: Record<TransferStatus, string> = {
  ACTIVE: "Active",
  ACTIVE_INTERMEDIATE: "Active (Intermediate)",
  DECLINED: "Declined",
  PENDING: "Pending",
  PENDING_INTERMEDIATE: "Pending (Intermediate)",
  BUYBACK: "Buyback",
  BUYBACK_INTERMEDIATE: "Buyback (Intermediate)",
  CANCELLED: "Cancelled",
};

export type TransferSubStatus =
  | "BALANCE_ZERO"
  | "BALANCE_NEGATIVE"
  | "SAMEDAY_TRANSFERS"
  | "USER_REQUESTED"
  | "UNSOLD";

export const SUB_STATUS_LABELS: Record<TransferSubStatus, string> = {
  BALANCE_ZERO: "Balance Zero",
  BALANCE_NEGATIVE: "Balance Negative",
  SAMEDAY_TRANSFERS: "Same-Day Transfers",
  USER_REQUESTED: "User Requested",
  UNSOLD: "Unsold",
};

export type TransferCommand = "sale" | "buyback" | "intermediarySale" | "cancel" | "create";

export interface ExternalAssetOwner {
  id: number;
  externalId: string;
}

export interface ExternalAssetOwnerTransfer {
  id: number;
  ownerId: number;
  ownerExternalId?: string;
  previousOwnerId?: number;
  previousOwnerExternalId?: string;
  loanId: number;
  loanExternalId?: string;
  externalId?: string;
  externalLoanId?: string;
  externalGroupId?: string;
  status: TransferStatus;
  subStatus?: TransferSubStatus;
  purchasePriceRatio?: string;
  settlementDate: string;
  effectiveDateFrom?: string;
  effectiveDateTo?: string;
  totalOutstanding?: number;
  principalOutstanding?: number;
  interestOutstanding?: number;
  feeChargesOutstanding?: number;
  penaltyChargesOutstanding?: number;
  totalOverpaid?: number;
}

export interface ExternalAssetOwnerTransferDetails {
  totalOutstandingDerived: number;
  principalOutstandingDerived: number;
  interestOutstandingDerived: number;
  feeChargesOutstandingDerived: number;
  penaltyChargesOutstandingDerived: number;
  totalOverpaidDerived: number;
}

export interface CreateOwnerRequest {
  ownerExternalId: string;
}

export interface SaleTransferRequest {
  ownerExternalId: string;
  settlementDate: string;
  purchasePriceRatio: string;
  transferExternalId?: string;
  transferExternalGroupId?: string;
  dateFormat: string;
  locale: string;
}

export interface BuybackTransferRequest {
  settlementDate: string;
  transferExternalId?: string;
  dateFormat: string;
  locale: string;
}

export interface SearchRequest {
  text?: string;
  settlementDateFrom?: string;
  settlementDateTo?: string;
  effectiveDateFrom?: string;
  effectiveDateTo?: string;
}

export interface SearchPayload {
  page?: number;
  size?: number;
  request: SearchRequest;
}

export interface CommandResponse {
  resourceId: number;
  resourceExternalId?: string;
  subResourceId?: number;
  subResourceExternalId?: string;
  changes?: Record<string, unknown>;
}

export interface ActiveTransferResponse {
  id: number;
  ownerId: number;
  ownerExternalId?: string;
  loanId: number;
  status: TransferStatus;
  settlementDate: string;
  purchasePriceRatio?: string;
  externalId?: string;
  details?: ExternalAssetOwnerTransferDetails;
}

export interface LoanProductAttribute {
  id: number;
  attributeKey: string;
  attributeValue: string;
  loanProductId: number;
}

export interface CreateLoanProductAttributeRequest {
  attributeKey: string;
  attributeValue: string;
}

export type UpdateLoanProductAttributeRequest = CreateLoanProductAttributeRequest;

export interface JournalEntry {
  id: number;
  transactionId?: string;
  transactionDate?: string;
  glAccountId?: number;
  glAccountName?: string;
  glAccountCode?: string;
  entryType?: "DEBIT" | "CREDIT";
  amount?: number;
  currencyCode?: string;
  referenceNumber?: string;
  officeId?: number;
  officeName?: string;
  comments?: string;
}

export interface TransferListResponse {
  pageItems?: ExternalAssetOwnerTransfer[];
  totalFilteredRecords?: number;
}

export interface OwnerListResponse {
  pageItems?: ExternalAssetOwner[];
  totalFilteredRecords?: number;
}
