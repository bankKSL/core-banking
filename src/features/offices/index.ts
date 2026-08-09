export { useOffices, useOffice, useOfficeTemplate, useCreateOffice, useUpdateOffice } from "@/hooks/useOffices";

export { officeService } from "@/api/office.service";

export type { Office, OfficeTemplate, OfficeCreateRequest, OfficeUpdateRequest } from "@/types";

export { officeCreateSchema, officeUpdateSchema } from "@/lib/validations/office";
export type { OfficeCreateFormData, OfficeUpdateFormData } from "@/lib/validations/office";

export { default as OfficeTree } from "@/components/organization/OfficeTree";
export { default as OfficeBreadcrumb } from "@/components/organization/OfficeBreadcrumb";
export { default as OfficeDrawer } from "@/components/organization/OfficeDrawer";
