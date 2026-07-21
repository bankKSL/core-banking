// ─── Clients Feature ──────────────────────────────────────────

// Types
export type {
    Client,
    ClientStatus,
    ClientListResponse,
    ClientListParams,
    ClientCreateRequest,
    ClientUpdateRequest,
    ClientTemplate,
    ClientActivateRequest,
    ClientTimeline,
    LegalForm,
    Gender,
} from "./types/client";

// Constants
export { CLIENT_STATUS_LABELS, CLIENT_STATUS_CONFIG, STATUS_ID_MAP, CLIENTS_PAGE_SIZE, SEARCH_DEBOUNCE_MS } from "./constants/status";

// Schemas
export { createClientSchema, editClientSchema } from "./schemas/client.schema";
export type { CreateClientFormValues, EditClientFormValues } from "./schemas/client.schema";

// Utils
export { getClientDisplayName, formatClientName, getClientStatus, formatClientDate, calculateAge } from "./utils/client";

// API — Client CRUD
export {
    fetchClients,
    fetchClient,
    createClient,
    updateClient,
    activateClient,
    deleteClient,
    fetchClientTemplate,
    fetchClientAccounts,
} from "./api/client";

// API — Client Identifiers
export {
    fetchClientIdentifiers,
    fetchClientIdentifier,
    fetchClientIdentifierTemplate,
    createClientIdentifier,
    updateClientIdentifier,
    deleteClientIdentifier,
} from "./api/identifiers";
export type {
    ClientIdentifier,
    ClientIdentifierRequest,
    ClientIdentifierTemplate,
    ClientIdentifierCommandResponse,
} from "./api/identifiers";

// API — Client Addresses
export {
    fetchClientAddresses,
    fetchClientAddressTemplate,
    createClientAddress,
    updateClientAddress,
    deleteClientAddress,
} from "./api/addresses";
export type {
    ClientAddress,
    ClientAddressRequest,
    ClientAddressTemplate,
    ClientAddressCommandResponse,
} from "./api/addresses";

// API — Client Family Members
export {
    fetchClientFamilyMembers,
    fetchClientFamilyMember,
    fetchClientFamilyMemberTemplate,
    createClientFamilyMember,
    updateClientFamilyMember,
    deleteClientFamilyMember,
} from "./api/family-members";
export type {
    ClientFamilyMember,
    ClientFamilyMemberRequest,
    ClientFamilyMemberTemplate,
    ClientFamilyMemberCommandResponse,
} from "./api/family-members";

// API — Client Charges
export {
    fetchClientCharges,
    fetchClientChargesTemplate,
    createClientCharge,
    waiveClientCharge,
    deleteClientCharge,
} from "./api/charges";
export type {
    ClientCharge,
    ClientChargeListResponse,
    PostClientChargeRequest,
    ClientChargesTemplate,
    ClientChargeCommandResponse,
} from "./api/charges";

// API — Client Documents
export {
    fetchClientDocuments,
    fetchClientDocument,
    downloadClientDocument,
    createClientDocument,
    updateClientDocument,
    deleteClientDocument,
} from "./api/documents";
export type {
    ClientDocument,
    ClientDocumentRequest,
    ClientDocumentCommandResponse,
} from "./api/documents";

// API — Client Notes
export {
    fetchClientNotes,
    fetchClientNote,
    createClientNote,
    updateClientNote,
    deleteClientNote,
} from "./api/notes";
export type {
    ClientNote,
    ClientNoteRequest,
    ClientNoteCommandResponse,
} from "./api/notes";

// API — Client Collaterals
export {
    fetchClientCollaterals,
    fetchClientCollateral,
    fetchClientCollateralTemplate,
    createClientCollateral,
    updateClientCollateral,
    deleteClientCollateral,
} from "./api/collaterals";
export type {
    ClientCollateral,
    ClientCollateralRequest,
    ClientCollateralUpdateRequest,
    ClientCollateralTemplate,
    ClientCollateralCommandResponse,
} from "./api/collaterals";

// API — Client Transactions
export {
    fetchClientTransactions,
    undoClientTransaction,
} from "./api/transactions";
export type {
    ClientTransaction,
    ClientTransactionListResponse,
    ClientTransactionCommandResponse,
} from "./api/transactions";

// Hooks
export { useClients, useClientPages, clientKeys } from "./hooks/useClients";
export { useClient } from "./hooks/useClient";
export { useCreateClient } from "./hooks/useCreateClient";
export { useUpdateClient } from "./hooks/useUpdateClient";
export { useActivateClient } from "./hooks/useActivateClient";
export { useDeleteClient } from "./hooks/useDeleteClient";
export { useClientTemplate } from "./hooks/useClientTemplate";
export { useClientAccounts } from "./hooks/useClientAccounts";

// Hooks — Sub-entities
export { useClientIdentifiers, useCreateClientIdentifier, useUpdateClientIdentifier, useDeleteClientIdentifier, clientIdentifierKeys } from "./hooks/useClientIdentifiers";
export { useClientAddresses, useClientAddressTemplate, useCreateClientAddress, useUpdateClientAddress, useDeleteClientAddress, clientAddressKeys } from "./hooks/useClientAddresses";
export { useClientFamilyMembers, useCreateClientFamilyMember, useUpdateClientFamilyMember, useDeleteClientFamilyMember, clientFamilyMemberKeys } from "./hooks/useClientFamilyMembers";
export { useClientCharges, useCreateClientCharge, useWaiveClientCharge, useDeleteClientCharge, clientChargeKeys } from "./hooks/useClientCharges";
export { useClientDocuments, useCreateClientDocument, useUpdateClientDocument, useDeleteClientDocument, clientDocumentKeys } from "./hooks/useClientDocuments";
export { useClientNotes, useCreateClientNote, useUpdateClientNote, useDeleteClientNote, clientNoteKeys } from "./hooks/useClientNotes";
export { useClientCollaterals, useCreateClientCollateral, useUpdateClientCollateral, useDeleteClientCollateral, clientCollateralKeys } from "./hooks/useClientCollaterals";
export { useClientTransactions, useUndoClientTransaction, clientTransactionKeys } from "./hooks/useClientTransactions";

// Hooks — Client Commands
export { useRejectClient, useWithdrawClient, useCloseClient, useReactivateClient, useUndoRejectClient, useUndoWithdrawClient } from "./hooks/useClientCommands";

// Components
export { default as ClientTable } from "./components/ClientTable";
export { default as ClientFilters } from "./components/ClientFilters";
export { default as ClientForm } from "./components/ClientForm";
export { default as ClientDetails } from "./components/ClientDetails";
export { default as ClientStatusBadge } from "./components/ClientStatusBadge";
export { default as ClientIdentifiers } from "./components/ClientIdentifiers";
export { default as ClientAddresses } from "./components/ClientAddresses";
export { default as ClientFamilyMembers } from "./components/ClientFamilyMembers";
export { default as ClientCharges } from "./components/ClientCharges";
export { default as ClientDocuments } from "./components/ClientDocuments";
export { default as ClientNotes } from "./components/ClientNotes";
export { default as ClientCollaterals } from "./components/ClientCollaterals";
export { default as ClientTransactions } from "./components/ClientTransactions";
export { default as ClientCommands } from "./components/ClientCommands";

// Pages
export { default as ClientListPage } from "./pages/ClientListPage";
export { default as CreateClientPage } from "./pages/CreateClientPage";
export { default as ClientDetailPage } from "./pages/ClientDetailPage";
export { default as EditClientPage } from "./pages/EditClientPage";
