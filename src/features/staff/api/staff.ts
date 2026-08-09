import client from "@/api/client";

export interface OfficeDropdown {
  id: number;
  name: string;
  nameDecorated: string;
}

export interface Staff {
  id: number;
  officeId: number;
  officeName: string;
  firstname: string;
  lastname: string;
  displayName: string;
  isLoanOfficer: boolean;
  isActive: boolean;
  joiningDate: number[] | string | null;
  externalId: string | null;
  mobileNo: string | null;
  emailAddress: string | null;
}

export interface StaffWithTemplate extends Staff {
  allowedOffices: OfficeDropdown[];
}

export interface StaffCreateRequest {
  officeId: number;
  firstname: string;
  lastname: string;
  isLoanOfficer?: boolean;
  isActive?: boolean;
  joiningDate?: string;
  mobileNo?: string;
  emailAddress?: string;
  externalId?: string;
  forceStatus?: boolean;
  dateFormat: string;
  locale: string;
}

export interface StaffUpdateRequest {
  officeId?: number;
  firstname?: string;
  lastname?: string;
  isLoanOfficer?: boolean;
  isActive?: boolean;
  forceStatus?: boolean;
  joiningDate?: string;
  mobileNo?: string;
  emailAddress?: string;
  externalId?: string;
  dateFormat: string;
  locale: string;
}

export interface StaffCreateResponse {
  officeId: number;
  resourceId: number;
}

export interface StaffUpdateResponse {
  officeId: number;
  resourceId: number;
  changes?: Record<string, unknown>;
}

export interface StaffListParams {
  officeId?: number;
  staffInOfficeHierarchy?: boolean;
  loanOfficersOnly?: boolean;
  status?: "active" | "inactive" | "inActive" | "all";
}

export async function fetchStaffList(params?: StaffListParams): Promise<Staff[]> {
  const { data } = await client.get<Staff[]>("/staff", { params });
  return Array.isArray(data) ? data : [];
}

export async function fetchStaff(id: number): Promise<Staff> {
  const { data } = await client.get<Staff>(`/staff/${id}`);
  return data;
}

export async function fetchStaffWithTemplate(id: number): Promise<StaffWithTemplate> {
  const { data } = await client.get<StaffWithTemplate>(`/staff/${id}`, {
    params: { template: true },
  });
  return data;
}

export async function createStaff(payload: StaffCreateRequest): Promise<StaffCreateResponse> {
  const { data } = await client.post<StaffCreateResponse>("/staff", payload);
  return data;
}

export async function updateStaff(id: number, payload: StaffUpdateRequest): Promise<StaffUpdateResponse> {
  const { data } = await client.put<StaffUpdateResponse>(`/staff/${id}`, payload);
  return data;
}

export async function downloadStaffTemplate(officeId?: number, dateFormat?: string): Promise<Blob> {
  const params: Record<string, string | number> = {};
  if (officeId) params.officeId = officeId;
  if (dateFormat) params.dateFormat = dateFormat;
  const { data } = await client.get("/staff/downloadtemplate", {
    params,
    responseType: "blob",
  });
  return data;
}

export async function uploadStaffTemplate(
  file: File,
  locale?: string,
  dateFormat?: string,
): Promise<number> {
  const formData = new FormData();
  formData.append("file", file);
  if (locale) formData.append("locale", locale);
  if (dateFormat) formData.append("dateFormat", dateFormat);
  const { data } = await client.post<number>("/staff/uploadtemplate", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}
