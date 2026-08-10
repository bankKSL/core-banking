// ─── Group Types ───────────────────────────────

/** Status of a group as returned by the API */
export interface GroupStatus {
  id?: number;
  code?: string;
  description?: string;
}

/** A single row in the paged groups list (GET /groups) */
export interface Group {
  id?: number;
  accountNo?: string;
  name?: string;
  officeId?: number;
  officeName?: string;
  active?: boolean;
  hierarchy?: string;
  status?: GroupStatus;
}

/** Detail of a single group (GET /groups/{groupId}) */
export interface GroupDetail {
  id?: number;
  name?: string;
  accountNo?: string;
  officeId?: number;
  officeName?: string;
  staffId?: number;
  staffName?: string;
  externalId?: string;
  active?: boolean;
  hierarchy?: string;
  activationDate?: string;
  submittedDate?: string;
  status?: GroupStatus;
  timeline?: {
    submittedOnDate?: string;
    activatedOnDate?: string;
    closedOnDate?: string;
  };
  clientMembers?: Array<{
    id: number;
    accountNo?: string;
    displayName?: string;
    officeId?: number;
    officeName?: string;
    status?: { id?: number; code?: string; description?: string; active?: boolean };
  }>;
  groupRoles?: GroupRoleData[];
  collectionMeetingCalendar?: {
    id: number;
    title?: string;
    description?: string;
    startDate?: string;
    frequency?: { id?: number; description?: string };
    repeating?: boolean;
    recurrences?: string[];
    createdByUserId?: number;
    createdByUsername?: string;
    updatedByUserId?: number;
    updatedByUsername?: string;
  };
  closureReasons?: GroupClosureReason[];
}

/** Paged list response (GET /groups?paged=true) */
export interface GroupListResponse {
  totalFilteredRecords?: number;
  pageItems?: Group[];
}

/** Query params accepted by the list endpoint */
export interface GroupListParams {
  officeId?: number;
  staffId?: number;
  externalId?: string;
  name?: string;
  underHierarchy?: string;
  paged?: boolean;
  offset?: number;
  limit?: number;
  orderBy?: string;
  sortOrder?: "ASC" | "DESC";
  orphansOnly?: boolean;
}

// ─── Group Create/Update/Command Requests ───────────────────────

/**
 * Create body (POST /groups). The generated model only types
 * { active?, name?, officeId? } — activationDate/dateFormat/locale are
 * required by the server when active = true and are added at runtime.
 */
export interface GroupCreateRequest {
  name: string;
  officeId: number;
  active: boolean;
  activationDate?: string;
  externalId?: string;
  staffId?: number;
  clientMembers?: number[];
  dateFormat?: string;
  locale?: string;
}

/** Update body (PUT /groups/{groupId}) — only the name is editable */
export interface GroupUpdateRequest {
  name?: string;
}

/** Command body (POST /groups/{groupId}?command=activate) */
export interface GroupCommandRequest {
  activationDate?: string;
  dateFormat?: string;
  locale?: string;
}

/** Commands that require only closureDate + closureReasonId */
export interface GroupCloseRequest {
  closureDate: string;
  closureReasonId: number;
  dateFormat?: string;
  locale?: string;
}

/** Associates / disassociates clients from the group */
export interface GroupClientIdsPayload {
  clientIds: number[];
}

/** Assigns a staff member (or role) */
export interface GroupAssignStaffPayload {
  staffId: number;
}

export interface GroupAssignRolePayload {
  clientId: number;
  roleId: number;
}

/** A loan / savings summary returned by GET /groups/{id}/accounts */
export interface GroupAccountSummary {
  loanAccounts?: Array<{
    id: number;
    accountNo?: string;
    productName?: string;
    status?: { id?: number; code?: string; description?: string; active?: boolean; closed?: boolean };
    accountBalance?: number;
    currency?: { code?: string; name?: string; displaySymbol?: string };
  }>;
  savingsAccounts?: Array<{
    id: number;
    accountNo?: string;
    productName?: string;
    status?: { id?: number; code?: string; description?: string; active?: boolean; closed?: boolean };
    accountBalance?: number;
    currency?: { code?: string; name?: string; displaySymbol?: string };
  }>;
}

/** A role assignment within the group */
export interface GroupRoleData {
  id: number;
  clientId: number;
  clientName?: string;
  role?: { id: number; name?: string };
}

/** A closure reason returned by the template */
export interface GroupClosureReason {
  id: number;
  name: string;
}

/** command/mutation response */
export interface GroupCommandResponse {
  officeId?: number;
  groupId?: number;
  resourceId?: number;
  changes?: Record<string, unknown>;
}

/** Template data returned by GET /groups/template */
export interface GroupTemplate {
  officeId?: number;
  officeOptions?: Array<{ id: number; name: string; nameDecorated?: string }>;
  staffOptions?: Array<{ id: number; displayName: string }>;
  centerOptions?: Array<{ id: number; name: string }>;
  clientOptions?: Array<{ id: number; displayName: string; officeId?: number; officeName?: string }>;
  availableRoles?: Array<{ id: number; name: string }>;
  datatables?: Array<{
    applicationTableName: string;
    registeredTableName: string;
    columnHeaderData?: Array<Record<string, unknown>>;
  }>;
}

/** Query params for GET /groups/template */
export interface GroupTemplateParams {
  officeId?: number;
  center?: boolean;
  centerId?: number;
  command?: string;
  staffInSelectedOfficeOnly?: boolean;
}
