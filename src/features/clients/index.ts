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

// API
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

// Hooks
export { useClients, useClientPages, clientKeys } from "./hooks/useClients";
export { useClient } from "./hooks/useClient";
export { useCreateClient } from "./hooks/useCreateClient";
export { useUpdateClient } from "./hooks/useUpdateClient";
export { useActivateClient } from "./hooks/useActivateClient";
export { useDeleteClient } from "./hooks/useDeleteClient";
export { useClientTemplate } from "./hooks/useClientTemplate";
export { useClientAccounts } from "./hooks/useClientAccounts";

// Components
export { default as ClientTable } from "./components/ClientTable";
export { default as ClientFilters } from "./components/ClientFilters";
export { default as ClientForm } from "./components/ClientForm";
export { default as ClientDetails } from "./components/ClientDetails";
export { default as ClientStatusBadge } from "./components/ClientStatusBadge";

// Pages
export { default as ClientListPage } from "./pages/ClientListPage";
export { default as CreateClientPage } from "./pages/CreateClientPage";
export { default as ClientDetailPage } from "./pages/ClientDetailPage";
export { default as EditClientPage } from "./pages/EditClientPage";
