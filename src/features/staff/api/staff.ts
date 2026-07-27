import client from "@/api/client";

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
  dateFormat: string;
  locale: string;
}

export interface StaffUpdateRequest {
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

export async function fetchStaffList(params?: { officeId?: number; loanOfficersOnly?: boolean; status?: string }): Promise<Staff[]> {
  const { data } = await client.get<Staff[]>("/staff", { params });
  return Array.isArray(data) ? data : [];
}

export async function fetchStaff(id: number): Promise<Staff> {
  const { data } = await client.get<Staff>(`/staff/${id}`);
  return data;
}

export async function createStaff(payload: StaffCreateRequest): Promise<{ resourceId: number }> {
  const { data } = await client.post<{ resourceId: number }>("/staff", payload);
  return data;
}

export async function updateStaff(id: number, payload: StaffUpdateRequest): Promise<{ resourceId: number }> {
  const { data } = await client.put<{ resourceId: number }>(`/staff/${id}`, payload);
  return data;
}
