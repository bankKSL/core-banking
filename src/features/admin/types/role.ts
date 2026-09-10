export interface Role {
  id: number;
  name: string;
  description: string;
  disabled?: boolean;
  permissionUsageData?: PermissionUsageData[];
}

export interface RoleCreateRequest {
  name: string;
  description: string;
}

export type RoleUpdateRequest = Partial<RoleCreateRequest>;

export interface PermissionUsageData {
  grouping: string;
  code: string;
  entityName: string;
  actionName: string;
  selected: boolean;
}

export interface RolePermissionsUpdateRequest {
  permissions: Record<string, boolean>;
}

export interface Permission {
  code: string;
  description?: string;
  grouping?: string;
  selected?: boolean;
  entityName?: string;
  actionName?: string;
}
