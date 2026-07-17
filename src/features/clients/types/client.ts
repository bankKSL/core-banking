// ─── Apache Fineract Client Types ─────────────────────────────

/** Fineract client status codes */
export type ClientStatus =
    | "pending" // 100
    | "active" // 300
    | "closed" // 600
    | "rejected" // 700
    | "transfer in progress" // 800
    | "transfer on hold"; // 900

/** Fineract client legal form */
export type LegalForm = "person" | "entity";

/** Fineract gender options */
export type Gender = "male" | "female";

/** Timeline object returned by Fineract */
export interface ClientTimeline {
    submittedOnDate?: string;
    submittedByUsername?: string;
    submittedByFirstname?: string;
    submittedByLastname?: string;
    activatedOnDate?: string;
    activatedByUsername?: string;
    activatedByFirstname?: string;
    activatedByLastname?: string;
    closedOnDate?: string;
    closedByUsername?: string;
    closedByFirstname?: string;
    closedByLastname?: string;
}

/** Full client object from Fineract */
export interface Client {
    id: number;
    accountNo?: string;
    externalId?: string;
    status: { id: number; code: string; value: string };
    subStatus?: { id: number; code: string; value: string };
    active?: boolean;
    activationDate?: string;
    firstname?: string;
    middlename?: string;
    lastname?: string;
    displayName?: string;
    fullname?: string;
    mobileNo?: string;
    emailAddress?: string;
    gender?: { id: number; name: string; active: boolean };
    dateOfBirth?: string;
    legalForm?: { id: number; code: string; value: string };
    officeId: number;
    officeName?: string;
    staffId?: number;
    staffName?: string;
    savingsAccountId?: number;
    groups?: unknown[];
    transferInProgressOrOnHold?: boolean;
    imagePresent?: boolean;
    imageId?: number;
    isStaff?: boolean;
    clientType?: { id: number; code: string; value: string };
    clientClassification?: { id: number; code: string; value: string };
    timeline?: ClientTimeline;
    lastModifiedDate?: string;
    rowIndex?: number;
    address?: Array<{
        addressId: number;
        street?: string;
        addressLine1?: string;
        addressLine2?: string;
        addressLine3?: string;
        townVillage?: string;
        city?: string;
        countyDistrict?: string;
        stateProvinceId?: number;
        countryId?: number;
        postalCode?: string;
        latitude?: number;
        longitude?: string;
        createdBy?: string;
        createdOn?: string;
        updatedBy?: string;
        updatedOn?: string;
        isActive?: boolean;
    }>;
    familyMembers?: unknown[];
}

/** Paginated response from GET /api/v1/clients */
export interface ClientListResponse {
    totalFilteredRecords: number;
    pageItems: Client[];
}

/** Query parameters for client list API */
export interface ClientListParams {
    offset?: number;
    limit?: number;
    orderBy?: string;
    sortOrder?: "ASC" | "DESC";
    displayName?: string;
    officeId?: number;
    staffId?: number;
    status?: number;
    underHierarchy?: string;
}

/** Request body for creating/updating a client — matches Fineract POST /api/v1/clients */
export interface ClientCreateRequest {
    firstname?: string;
    middlename?: string;
    lastname?: string;
    /** Required for entity/group clients instead of firstname/lastname */
    fullname?: string;
    officeId: number;
    staffId?: number;
    active?: boolean;
    activationDate?: string;
    submittedOnDate?: string;
    dateOfBirth?: string;
    legalFormId?: number;
    genderId?: number;
    externalId?: string;
    mobileNo?: string;
    emailAddress?: string;
    isStaff?: boolean;
    address?: Array<{
        addressTypeId?: number;
        addressLine1?: string;
        addressLine2?: string;
        addressLine3?: string;
        street?: string;
        city?: string;
        stateProvinceId?: number;
        countryId?: number;
        postalCode?: string;
        isActive?: boolean;
    }>;
    /** Date format for all date fields — defaults to yyyy-MM-dd to match HTML date inputs */
    dateFormat?: string;
    locale?: string;
    savingsProductId?: number;
    clientTypeId?: number;
    clientClassificationId?: number;
    /** Required when creating a client under a group */
    groupId?: number;
    /** Fineract data tables — dynamic key-value entries */
    datatables?: Array<{ data: unknown; registeredTableName: string }>;
}

export type ClientUpdateRequest = Partial<ClientCreateRequest>;

/** Template data from GET /api/v1/clients/template */
export interface ClientTemplate {
    officeOptions: Array<{ id: number; name: string; nameDecorated: string }>;
    staffOptions: Array<{ id: number; displayName: string; firstname?: string; lastname?: string }>;
    genderOptions: Array<{ id: number; name: string; active: boolean }>;
    clientTypeOptions?: Array<{ id: number; name: string }>;
    clientClassificationOptions?: Array<{ id: number; name: string }>;
    legalFormOptions?: Array<{ id: number; code: string; value: string }>;
    savingsProductOptions?: Array<{ id: number; name: string }>;
    addressTypeOptions?: Array<{ id: number; name: string }>;
    datatables?: unknown[];
    activationDate?: string;
    dateFormat?: string;
}

/** Activation request */
export interface ClientActivateRequest {
    activationDate?: string;
    dateFormat?: string;
    locale?: string;
}
