// ─── Apache Fineract Group Types ───────────────────────────────

/** Status of a group as returned by the Fineract API */
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
  officeId?: number;
  officeName?: string;
  externalId?: string;
  active?: boolean;
  hierarchy?: string;
  status?: GroupStatus;
  timeline?: {
    submittedOnDate?: string;
    activatedOnDate?: string;
    closedOnDate?: string;
  };
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
 * Create body (POST /groups). The generated Fineract model only types
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

/** Fineract command/mutation response */
export interface GroupCommandResponse {
  officeId?: number;
  groupId?: number;
  resourceId?: number;
  changes?: Record<string, unknown>;
}
