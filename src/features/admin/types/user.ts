export interface AppUser {
  id: number;
  username: string;
  firstname: string;
  lastname: string;
  email?: string;
  officeId: number;
  officeName?: string;
  staffId?: number;
  staffName?: string;
  roles: Array<{ id: number; name: string }>;
  passwordNeverExpires?: boolean;
  isLoginRetriesEnabled?: boolean;
  isPasswordResetAllowed?: boolean;
  isSelfServiceUser?: boolean;
  isLocked?: boolean;
  isActive?: boolean;
  lastTimePasswordUpdated?: string;
  createdDate?: string;
}

export interface UserCreateRequest {
  username: string;
  firstname: string;
  lastname: string;
  email?: string;
  officeId: number;
  staffId?: number;
  roles: number[];
  sendPasswordToEmail?: boolean;
  password?: string;
  repeatPassword?: string;
  passwordNeverExpires?: boolean;
  isLoginRetriesEnabled?: boolean;
  isPasswordResetAllowed?: boolean;
  isSelfServiceUser?: boolean;
  locale: string;
  dateFormat: string;
}

export type UserUpdateRequest = Partial<UserCreateRequest>;

export interface UserTemplate {
  allowedOffices: Array<{ id: number; name: string; nameDecorated: string }>;
  availableRoles: Array<{ id: number; name: string; description?: string }>;
}

export interface ChangePasswordRequest {
  password: string;
  repeatPassword: string;
}
