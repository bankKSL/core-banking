export type {
  ExternalAssetOwner,
  ExternalAssetOwnerTransfer,
  ExternalAssetOwnerTransferDetails,
  TransferStatus,
  TransferSubStatus,
  TransferCommand,
  CreateOwnerRequest,
  SaleTransferRequest,
  BuybackTransferRequest,
  SearchRequest,
  SearchPayload,
  CommandResponse,
  ActiveTransferResponse,
  LoanProductAttribute,
  CreateLoanProductAttributeRequest,
  UpdateLoanProductAttributeRequest,
  JournalEntry,
  OwnerListResponse,
  TransferListResponse,
} from "./types/externalAssetOwner";
export {
  TRANSFER_STATUS_OPTIONS,
  STATUS_LABELS,
  SUB_STATUS_LABELS,
} from "./types/externalAssetOwner";

export {
  fetchExternalAssetOwners,
  createExternalAssetOwner,
  fetchTransfers,
  fetchActiveTransfer,
  executeTransferByLoanId,
  executeTransferByLoanExternalId,
  executeTransferById,
  executeTransferByExternalId,
  searchTransfers,
  fetchLoanProductAttributes,
  createLoanProductAttribute,
  updateLoanProductAttribute,
  fetchJournalEntriesByTransfer,
  fetchJournalEntriesByOwner,
} from "./api/externalAssetOwners";

export {
  externalAssetOwnerKeys,
  useExternalAssetOwners,
  useCreateExternalAssetOwner,
  useTransfers,
  useActiveTransfer,
  useExecuteTransferByLoanId,
  useExecuteTransferByLoanExternalId,
  useExecuteTransferById,
  useExecuteTransferByExternalId,
  useSearchTransfers,
  useLoanProductAttributes,
  useCreateLoanProductAttribute,
  useUpdateLoanProductAttribute,
  useJournalEntriesByTransfer,
  useJournalEntriesByOwner,
} from "./hooks/useExternalAssetOwners";

export {
  createOwnerSchema,
  saleTransferSchema,
  buybackTransferSchema,
  searchTransferSchema,
  createLoanProductAttributeSchema,
} from "./schemas/externalAssetOwner.schema";
export type {
  CreateOwnerFormValues,
  SaleTransferFormValues,
  BuybackTransferFormValues,
  SearchTransferFormValues,
  CreateLoanProductAttributeFormValues,
} from "./schemas/externalAssetOwner.schema";

export { default as ExternalAssetOwnerListPage } from "./pages/ExternalAssetOwnerListPage";
export { default as ExternalAssetOwnerFormPage } from "./pages/ExternalAssetOwnerFormPage";
export { default as TransferListPage } from "./pages/TransferListPage";
export { default as TransferFormPage } from "./pages/TransferFormPage";
export { default as LoanProductAttributesPage } from "./pages/LoanProductAttributesPage";
