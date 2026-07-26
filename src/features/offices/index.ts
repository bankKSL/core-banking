export { useOffices, useOffice, useCreateOffice, useUpdateOffice } from "@/hooks/useOffices";

export { officeService } from "@/api/office.service";

export type { Office, OfficeCreateRequest, OfficeUpdateRequest } from "@/types";

export { officeCreateSchema, officeUpdateSchema } from "@/lib/validations/office";
export type { OfficeCreateFormData, OfficeUpdateFormData } from "@/lib/validations/office";

export { OfficeTree } from "@/components/organization/OfficeTree";
export { OfficeBreadcrumb } from "@/components/organization/OfficeBreadcrumb";
export { OfficeDrawer } from "@/components/organization/OfficeDrawer";
