export type {
  MiniAccount,
  Transfer,
  TransferListResponse,
  TransferRequest,
  StandingInstruction,
  StandingInstructionListResponse,
  StandingInstructionRequest,
  StandingInstructionHistoryItem,
  StandingInstructionHistoryResponse,
  Office,
  ClientSummary,
} from "./api";

export {
  fetchTransfers,
  createTransfer,
  fetchOffices,
  fetchClientsByOffice,
  fetchClientAccounts2,
  fetchStandingInstructions,
  fetchStandingInstruction,
  createStandingInstruction,
  updateStandingInstruction,
  fetchStandingInstructionHistory,
  buildTransferRequest,
  buildStandingInstructionRequest,
  parseDate,
} from "./api";

// ─── Pages ───────────────────────────────────────────────
export { default as TransferListPage } from "./pages/TransferListPage";
export { default as TransferFormPage } from "./pages/TransferFormPage";
