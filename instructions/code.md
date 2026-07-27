# Codes — React Implementation Guide

Source: Apache Fineract Infrastructure Codes Feature  
Trace Date: 2026-07-26  
Java Base: `org.apache.fineract.infrastructure.codes`

---

## 1. Feature Overview

Codes define system-wide lookup tables used for dropdowns throughout the application — things like Gender, LoanPurpose, ClientType, GuarantorRelationship, and WriteOffReasons. Each **Code** acts as a category containing multiple **Code Values** (the actual selectable options).

### Structure

```
Code: "Gender" (system-defined)
  ├── CodeValue: "Male"      (position: 1, active: true)
  ├── CodeValue: "Female"    (position: 2, active: true)
  └── CodeValue: "Other"     (position: 3, active: true)

Code: "LoanCollateral" (system-defined)
  ├── CodeValue: "Land & Property"
  ├── CodeValue: "Vehicle"
  ├── CodeValue: "Gold"
  └── ...
```

### System vs User-Defined Codes

| Type                                          | Created By            | Can Edit | Can Delete |
| --------------------------------------------- | --------------------- | -------- | ---------- |
| **System-defined** (`is_system_defined=true`) | Seed data / Liquibase | ❌       | ❌         |
| **User-defined** (`is_system_defined=false`)  | API `POST /codes`     | ✅       | ✅         |

Code values under system-defined codes CAN be freely added, edited, or deleted.

### Main Java Classes

| Layer         | Classes                                                                                                                                                      |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Entity        | `Code`, `CodeValue`                                                                                                                                          |
| API           | `CodesApiResource`, `CodeValuesApiResource`                                                                                                                  |
| Read Service  | `CodeReadPlatformService` / `CodeReadPlatformServiceImpl`, `CodeValueReadPlatformService` / `CodeValueReadPlatformServiceImpl`                               |
| Write Service | `CodeWritePlatformService` / `CodeWritePlatformServiceJpaRepositoryImpl`, `CodeValueWritePlatformService` / `CodeValueWritePlatformServiceJpaRepositoryImpl` |
| Validation    | `CodeCommandFromApiJsonDeserializer`, `CodeValueCommandFromApiJsonDeserializer`                                                                              |
| Repository    | `CodeRepository`, `CodeValueRepository`, `CodeValueRepositoryWrapper`                                                                                        |

---

## 2. API Inventory

### Codes (`/v1/codes`)

| Method | URL                         | Description         | Permission    |
| ------ | --------------------------- | ------------------- | ------------- |
| GET    | `/v1/codes`                 | List all codes      | `READ_CODE`   |
| GET    | `/v1/codes/{codeId}`        | Single code         | `READ_CODE`   |
| GET    | `/v1/codes/name/{codeName}` | Single code by name | `READ_CODE`   |
| POST   | `/v1/codes`                 | Create code         | `CREATE_CODE` |
| PUT    | `/v1/codes/{codeId}`        | Update code name    | `UPDATE_CODE` |
| DELETE | `/v1/codes/{codeId}`        | Delete code         | `DELETE_CODE` |

### Code Values (`/v1/codes/{codeId}/codevalues`)

| Method | URL                                           | Description       | Permission         |
| ------ | --------------------------------------------- | ----------------- | ------------------ |
| GET    | `/v1/codes/{codeId}/codevalues`               | List code values  | `READ_CODEVALUE`   |
| GET    | `/v1/codes/{codeId}/codevalues/{codeValueId}` | Single code value | `READ_CODEVALUE`   |
| POST   | `/v1/codes/{codeId}/codevalues`               | Create code value | `CREATE_CODEVALUE` |
| PUT    | `/v1/codes/{codeId}/codevalues/{codeValueId}` | Update code value | `UPDATE_CODEVALUE` |
| DELETE | `/v1/codes/{codeId}/codevalues/{codeValueId}` | Delete code value | `DELETE_CODEVALUE` |

### Code Values by Name (`/v1/codes/name/{codeName}/codevalues`)

| Method | URL                                                  | Description              | Permission         |
| ------ | ---------------------------------------------------- | ------------------------ | ------------------ |
| GET    | `/v1/codes/name/{codeName}/codevalues`               | List values by code name | `READ_CODEVALUE`   |
| GET    | `/v1/codes/name/{codeName}/codevalues/{codeValueId}` | Single by code name + ID | `READ_CODEVALUE`   |
| POST   | `/v1/codes/name/{codeName}/codevalues`               | Create by code name      | `CREATE_CODEVALUE` |
| PUT    | `/v1/codes/name/{codeName}/codevalues/{codeValueId}` | Update by code name      | `UPDATE_CODEVALUE` |
| DELETE | `/v1/codes/name/{codeName}/codevalues/{codeValueId}` | Delete by code name      | `DELETE_CODEVALUE` |

---

## 3. CRUD Analysis

### Codes

| Operation          | Endpoint                    | Notes                                   |
| ------------------ | --------------------------- | --------------------------------------- |
| **List**           | `GET /v1/codes`             | All codes, both system and user-defined |
| **Detail**         | `GET /v1/codes/{id}`        | Single code                             |
| **Detail by name** | `GET /v1/codes/name/{name}` | Lookup by name                          |
| **Create**         | `POST /v1/codes`            | User-defined only                       |
| **Update**         | `PUT /v1/codes/{id}`        | System-defined codes cannot be updated  |
| **Delete**         | `DELETE /v1/codes/{id}`     | System-defined codes cannot be deleted  |

### Code Values

| Operation             | Endpoint                                    | Notes                                   |
| --------------------- | ------------------------------------------- | --------------------------------------- |
| **List by code ID**   | `GET /v1/codes/{codeId}/codevalues`         |                                         |
| **List by code name** | `GET /v1/codes/name/{name}/codevalues`      | Used by frontends for dynamic dropdowns |
| **Detail**            | `GET /v1/codes/{codeId}/codevalues/{id}`    |                                         |
| **Create**            | `POST /v1/codes/{codeId}/codevalues`        |                                         |
| **Update**            | `PUT /v1/codes/{codeId}/codevalues/{id}`    |                                         |
| **Delete**            | `DELETE /v1/codes/{codeId}/codevalues/{id}` | Fails if referenced by other tables     |

---

## 4. Create Workflow

### Create Code

| Field  | Required | Type        | Validation                 | Source |
| ------ | -------- | ----------- | -------------------------- | ------ |
| `name` | ✅       | string(100) | Not blank, max 100, unique | User   |

### Create Code Value

| Field         | Required | Type        | Validation                          | Source |
| ------------- | -------- | ----------- | ----------------------------------- | ------ |
| `name`        | ✅       | string(100) | Not blank, max 100; unique per code | User   |
| `position`    | ❌       | integer     | Default 0; display order            | User   |
| `description` | ❌       | string(500) | Max 500                             | User   |
| `isActive`    | ❌       | boolean     | Default true                        | Toggle |
| `isMandatory` | ❌       | boolean     | Default false                       | Toggle |

---

## 5. Lookup APIs

| UI Field          | Endpoint                                   | Display | Value | Required |
| ----------------- | ------------------------------------------ | ------- | ----- | -------- |
| Any code dropdown | `GET /v1/codes/name/{codeName}/codevalues` | `name`  | `id`  | ✅       |
| All codes         | `GET /v1/codes`                            | `name`  | `id`  | ✅       |

Common codes used throughout the app: `Gender`, `LoanCollateral`, `LoanPurpose`, `ClientType`, `ClientClassification`, `GuarantorRelationship`, `WriteOffReasons`, `COUNTRY`, `STATE`, `ADDRESS_TYPE`, `Marital Status`, `Profession`.

---

## 6. API Call Order

### Create Code

```
1. POST /v1/codes                              → create code
```

### Create Code Value Under Code

```
1. GET /v1/codes                               → find code ID by name
2. POST /v1/codes/{codeId}/codevalues          → create value
```

### Fetch Dropdown Values

```
1. GET /v1/codes/name/Gender/codevalues        → [ {id:1, name:"Male"}, {id:2, name:"Female"} ]
```

---

## 7. Request Payload Analysis

### Create Code (`POST /v1/codes`)

```json
{
  "name": "Marital Status"
}
```

### Update Code (`PUT /v1/codes/{codeId}`)

```json
{
  "name": "Marital Status (Renamed)"
}
```

### Create Code Value (`POST /v1/codes/{codeId}/codevalues`)

```json
{
  "name": "Single",
  "position": 1,
  "description": "Unmarried",
  "isActive": true,
  "isMandatory": false
}
```

### Update Code Value (`PUT /v1/codes/{codeId}/codevalues/{codeValueId}`)

```json
{
  "name": "Unmarried",
  "position": 2,
  "isActive": false
}
```

### Delete Code Value (`DELETE /v1/codes/{codeId}/codevalues/{codeValueId}`)

No body. Fails if referenced by any other table via FK.

---

## 8. Validation Rules

| Rule                            | Logic                                            | Error                                       |
| ------------------------------- | ------------------------------------------------ | ------------------------------------------- |
| Code name required              | Not blank, max 100                               | `CodeCommandFromApiJsonDeserializer`        |
| Code name unique                | DB unique constraint on `code_name`              | `error.msg.code.duplicate.name`             |
| Code value name required        | Not blank, max 100                               | `CodeValueCommandFromApiJsonDeserializer`   |
| Code value name unique per code | DB unique on `(code_id, code_value)`             | `error.msg.code.value.duplicate.label`      |
| System code protection          | Cannot update/delete if `is_system_defined=true` | `SystemDefinedCodeCannotBeChangedException` |
| Code value in use               | Cannot delete if referenced by FK                | `error.msg.codeValue.in.use`                |

---

## 9. Business Flow

```
CodesApiResource.createCode(command)
  ↓
CodeCommandFromApiJsonDeserializer.validateForCreate()
  ↓
CreateCodeCommandHandler
  ↓
CodeWritePlatformServiceJpaRepositoryImpl.createCode(command)
  ├── Code.fromJson(command) → new Code(name, systemDefined=false)
  ├── CodeRepository.save()
  ├── Cache evict ("codes")
  └── Return result

CodeValuesApiResource.createCodeValue(codeId, command)
  ↓
CodeValueCommandFromApiJsonDeserializer.validateForCreate()
  ↓
CreateCodeValueCommandHandler
  ↓
CodeValueWritePlatformServiceJpaRepositoryImpl.createCodeValue(command)
  ├── CodeRepository.findById(codeId)
  ├── CodeValue.fromJson(code, command)
  ├── code.addValue(codeValue) → cascade persist
  ├── Cache evict ("code_values")
  └── Return result
```

---

## 10. Related Operations

| Operation                  | Description                                                                     |
| -------------------------- | ------------------------------------------------------------------------------- |
| Codes used in Client forms | `Gender`, `ClientType`, `ClientClassification`, `ClientSubStatus`, `Profession` |
| Codes used in Loan forms   | `LoanPurpose`, `LoanCollateral`, `WriteOffReasons`, `LoanRescheduleReason`      |
| Codes used in Address      | `COUNTRY`, `STATE`, `ADDRESS_TYPE`                                              |
| Codes used in Group        | `GROUPROLE`, `GroupClosureReason`, `CenterClosureReason`                        |
| All system-defined codes   | 28+ codes seeded via `load_sample_data.sql` and Liquibase migrations            |

---

## 11. Hidden Dependencies

| Dependency                                                  | Impact                                                                             |
| ----------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| **Codes are cached** (`"codes"` and `"code_values"` caches) | New/changed codes may not appear until cache eviction                              |
| **System-defined flag is set at creation time**             | API-created codes are always user-defined; only seed data has `systemDefined=true` |
| **Code values use `name` field mapped from entity `label`** | The DTO field is `name` but the DB column is `code_value`                          |
| **Code value deletion blocked by FK references**            | Many tables reference `m_code_value.id` — deletion silently fails if in use        |
| **`code_score` column exists in DB but not mapped in JPA**  | This column is unused by the entity                                                |
| **`position` controls display order**                       | Defaults to 0 for all new values if not specified                                  |
| **`isActive=false` hides from dropdowns**                   | Used for soft-hiding values without deleting                                       |

---

## 12. Implementation Checklist

- [ ] Code list (`GET /v1/codes`)
- [ ] Code detail (`GET /v1/codes/{id}`)
- [ ] Code detail by name (`GET /v1/codes/name/{name}`)
- [ ] Create code (`POST /v1/codes`)
- [ ] Update code (`PUT /v1/codes/{id}`)
- [ ] Delete code (`DELETE /v1/codes/{id}`)
- [ ] Code value list (`GET /v1/codes/{id}/codevalues`)
- [ ] Code value list by name (`GET /v1/codes/name/{name}/codevalues`)
- [ ] Code value detail (`GET /v1/codes/{id}/codevalues/{valueId}`)
- [ ] Create code value (`POST /v1/codes/{id}/codevalues`)
- [ ] Update code value (`PUT /v1/codes/{id}/codevalues/{valueId}`)
- [ ] Delete code value (`DELETE /v1/codes/{id}/codevalues/{valueId}`)
- [ ] System-defined badge on codes (read-only indicator)
- [ ] Position-based ordering in value lists
- [ ] Active/inactive toggle for code values
- [ ] Dynamic dropdown component that fetches by `GET /codes/name/{codeName}/codevalues`
- [ ] Error handling: system code change rejection, in-use deletion rejection
