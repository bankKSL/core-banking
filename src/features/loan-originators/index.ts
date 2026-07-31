export type {
  LoanOriginator,
  LoanOriginatorStatus,
  CodeValueData,
  LoanOriginatorTemplate,
  LoanOriginatorRequest,
  LoanOriginatorUpdateRequest,
  LoanOriginatorsResponse,
  LoanOriginatorMappingResponse,
  LoanApplicationOriginator,
  LoanOriginatorCommandResponse,
} from "./types/loanOriginator";

export {
  fetchLoanOriginators,
  fetchLoanOriginator,
  fetchLoanOriginatorByExternalId,
  fetchLoanOriginatorTemplate,
  createLoanOriginator,
  updateLoanOriginator,
  deleteLoanOriginator,
} from "./api/loanOriginators";

export {
  fetchLoanOriginatorsByLoan,
  attachLoanOriginator,
  detachLoanOriginator,
} from "./api/loanOriginatorMapping";

export {
  loanOriginatorStatusSchema,
  createLoanOriginatorSchema,
  updateLoanOriginatorSchema,
  loanApplicationOriginatorSchema,
  loanOriginatorsArraySchema,
} from "./schemas/loanOriginator.schema";
export type {
  CreateLoanOriginatorFormValues,
  UpdateLoanOriginatorFormValues,
  LoanApplicationOriginatorFormValues,
} from "./schemas/loanOriginator.schema";

export {
  loanOriginatorKeys,
  useLoanOriginators,
  useLoanOriginator,
  useLoanOriginatorByExternalId,
  useLoanOriginatorTemplate,
  useCreateLoanOriginator,
  useUpdateLoanOriginator,
  useDeleteLoanOriginator,
} from "./hooks/useLoanOriginators";

export {
  useLoanOriginatorsByLoan,
  useAttachLoanOriginator,
  useDetachLoanOriginator,
} from "./hooks/useLoanOriginatorsByLoan";

export { default as LoanOriginatorListPage } from "./pages/LoanOriginatorListPage";
export { default as LoanOriginatorFormPage } from "./pages/LoanOriginatorFormPage";

export { default as LoanOriginatorPicker } from "./components/LoanOriginatorPicker";
export { default as LoanOriginatorsCard } from "./components/LoanOriginatorsCard";
export type { LoanOriginatorsCardProps } from "./components/LoanOriginatorsCard";
