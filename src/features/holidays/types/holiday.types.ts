export interface Holiday {
  id: number;
  name: string;
  description?: string;
  fromDate: number[];
  toDate: number[];
  repaymentsRescheduledTo?: number[];
  reschedulingType: { id: number; code?: string; value?: string };
  status: { id: number; code?: string; value?: string };
  offices: Array<{ id: number; name: string; nameDecorated: string }>;
}

export interface HolidayListResponse {
  pageItems?: Holiday[];
  totalFilteredRecords?: number;
}

export interface HolidayTemplate {
  reschedulingTypeOptions: EnumOption[];
}

export interface HolidayCreateRequest {
  name: string;
  description?: string;
  fromDate: string;
  toDate: string;
  repaymentsRescheduledTo?: string;
  reschedulingType: number;
  offices: number[];
  dateFormat: string;
  locale: string;
}

export interface HolidayUpdateRequest {
  name?: string;
  description?: string;
  fromDate?: string;
  toDate?: string;
  repaymentsRescheduledTo?: string;
  reschedulingType?: number;
  offices?: number[];
  dateFormat?: string;
  locale?: string;
}

export interface EnumOption {
  id: number;
  code: string;
  value: string;
}

export interface HolidayListParams {
  officeId?: number;
  fromDate?: string;
  toDate?: string;
  offset?: number;
  limit?: number;
  orderBy?: string;
  sortOrder?: "ASC" | "DESC";
}
