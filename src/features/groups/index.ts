// ─── Groups Feature ─────────────────────────────────────────────

export type {
  Group,
  GroupDetail,
  GroupStatus,
  GroupListResponse,
  GroupListParams,
  GroupCreateRequest,
  GroupUpdateRequest,
  GroupCommandRequest,
  GroupCommandResponse,
} from "./types/group";

export {
  GROUP_STATUS_CONFIG,
  GROUP_STATUS_ID_MAP,
  resolveGroupStatusLabel,
  GROUPS_PAGE_SIZE,
  GROUP_SEARCH_DEBOUNCE_MS,
  GROUP_DATE_FORMAT,
  GROUP_LOCALE,
} from "./constants/status";

export { createGroupSchema, updateGroupSchema, activateGroupSchema } from "./schemas/group.schema";
export type { CreateGroupFormValues, UpdateGroupFormValues, ActivateGroupFormValues } from "./schemas/group.schema";

export { fetchGroups, fetchGroup, createGroup, updateGroup, deleteGroup, activateGroup } from "./api/group";

export { useGroups, groupKeys } from "./hooks/useGroups";
export { useGroup } from "./hooks/useGroup";
export { useCreateGroup } from "./hooks/useCreateGroup";
export { useUpdateGroup } from "./hooks/useUpdateGroup";
export { useActivateGroup, useDeleteGroup } from "./hooks/useGroupCommands";

// ─── Pages ───────────────────────────────────────────────────────
export { default as GroupListPage } from "./pages/GroupListPage";
export { default as GroupFormPage } from "./pages/GroupFormPage";

// ─── Components ──────────────────────────────────────────────────
export { default as GroupTable } from "./components/GroupTable";
export { default as GroupForm } from "./components/GroupForm";
export { default as GroupStatusBadge } from "./components/GroupStatusBadge";
