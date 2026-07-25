# User Administration — React Implementation Guide

Source: Apache Fineract User Administration Feature  
Trace Date: 2026-07-25  
Java Base: `org.apache.fineract.useradministration`

---

## 1. Feature Overview

User Administration manages application users, roles, permissions, password policies, and authentication. It provides the access control foundation for the entire Fineract system.

### Sub-Features

| Sub-Feature          | Base Path                 | Description                                      |
| -------------------- | ------------------------- | ------------------------------------------------ |
| Users                | `/v1/users`               | Full CRUD + password management                  |
| Roles                | `/v1/roles`               | Role CRUD, enable/disable, permission assignment |
| Permissions          | `/v1/permissions`         | View permissions, configure maker-checker        |
| Password Preferences | `/v1/passwordpreferences` | Active password validation policy                |
| Forgot Password      | `/v1/password`            | Password reset by email                          |

### Entity Relationship

```
AppUser (m_appuser)
  ├── @ManyToOne → Office (m_office)
  ├── @ManyToOne → Staff (m_staff, nullable)
  └── @ManyToMany → Role (m_role) [join: m_appuser_role]
                       └── @ManyToMany → Permission (m_permission) [join: m_role_permission]
```

Permission codes follow pattern: `{ACTION}_{ENTITY}` (e.g., `READ_USER`, `CREATE_ROLE`). Special permissions: `ALL_FUNCTIONS` (full access), `ALL_FUNCTIONS_READ` (read-only access).

### Key Tables

| Table                          | Purpose                                |
| ------------------------------ | -------------------------------------- |
| `m_appuser`                    | Application users                      |
| `m_appuser_role`               | User-to-role mapping                   |
| `m_role`                       | Roles                                  |
| `m_role_permission`            | Role-to-permission mapping             |
| `m_permission`                 | Permission definitions (pre-installed) |
| `m_password_validation_policy` | Password validation rules              |
| `m_appuser_previous_password`  | Password history (reuse prevention)    |

---

## 2. API Inventory

### Users (`/v1/users`)

| Method | URL                          | Description                   | Permission            |
| ------ | ---------------------------- | ----------------------------- | --------------------- |
| GET    | `/v1/users`                  | List users                    | `USER` READ           |
| GET    | `/v1/users/template`         | User creation template        | `USER` READ           |
| GET    | `/v1/users/{userId}`         | Retrieve single user          | `USER` READ (or self) |
| POST   | `/v1/users`                  | Create user                   | Command-level         |
| PUT    | `/v1/users/{userId}`         | Update user                   | Command-level         |
| POST   | `/v1/users/{userId}/pwd`     | Change password               | Command-level         |
| DELETE | `/v1/users/{userId}`         | Delete user (soft)            | Command-level         |
| GET    | `/v1/users/downloadtemplate` | Download bulk import template | —                     |
| POST   | `/v1/users/uploadtemplate`   | Upload bulk import            | —                     |

### Roles (`/v1/roles`)

| Method | URL                                          | Description               | Permission    |
| ------ | -------------------------------------------- | ------------------------- | ------------- |
| GET    | `/v1/roles`                                  | List roles                | `ROLE` READ   |
| GET    | `/v1/roles/{roleId}`                         | Retrieve single role      | `ROLE` READ   |
| POST   | `/v1/roles`                                  | Create role               | Command-level |
| PUT    | `/v1/roles/{roleId}`                         | Update role               | Command-level |
| POST   | `/v1/roles/{roleId}?command=enable\|disable` | Enable/disable role       | Command-level |
| GET    | `/v1/roles/{roleId}/permissions`             | Retrieve role permissions | `ROLE` READ   |
| PUT    | `/v1/roles/{roleId}/permissions`             | Update role permissions   | Command-level |
| DELETE | `/v1/roles/{roleId}`                         | Delete role               | Command-level |

### Permissions (`/v1/permissions`)

| Method | URL               | Description                                 | Permission        |
| ------ | ----------------- | ------------------------------------------- | ----------------- |
| GET    | `/v1/permissions` | List permissions (`?makerCheckerable=true`) | `PERMISSION` READ |
| PUT    | `/v1/permissions` | Enable/disable maker-checker per permission | Command-level     |

### Password Preferences (`/v1/passwordpreferences`)

| Method | URL                                | Description                           | Permission                  |
| ------ | ---------------------------------- | ------------------------------------- | --------------------------- |
| GET    | `/v1/passwordpreferences`          | Get active password validation policy | `PASSWORD_PREFERENCES` READ |
| GET    | `/v1/passwordpreferences/template` | List all available policies           | `PASSWORD_PREFERENCES` READ |
| PUT    | `/v1/passwordpreferences`          | Set active validation policy          | Command-level               |

### Forgot Password (`/v1/password`)

| Method | URL                   | Description                  | Permission |
| ------ | --------------------- | ---------------------------- | ---------- |
| POST   | `/v1/password/forgot` | Request password reset email | Public     |

---

## 3. CRUD Analysis

### Users

| Operation    | Endpoint                    | Notes                                                            |
| ------------ | --------------------------- | ---------------------------------------------------------------- |
| **List**     | `GET /v1/users`             | Returns all users with office/role info                          |
| **Detail**   | `GET /v1/users/{userId}`    | Supports `?template=true` to include dropdowns                   |
| **Create**   | `POST /v1/users`            | Mandatory: username, firstname, lastname, email, officeId, roles |
| **Update**   | `PUT /v1/users/{userId}`    | Can update profile, roles, and settings                          |
| **Delete**   | `DELETE /v1/users/{userId}` | Soft delete — renames username, disables account, clears roles   |
| **Template** | `GET /v1/users/template`    | Returns allowed offices + available roles                        |

### Roles

| Operation          | Endpoint                                          | Notes                              |
| ------------------ | ------------------------------------------------- | ---------------------------------- |
| **List**           | `GET /v1/roles`                                   | All roles                          |
| **Detail**         | `GET /v1/roles/{userId}`                          | Role info + permissions            |
| **Create**         | `POST /v1/roles`                                  | Mandatory: name, description       |
| **Update**         | `PUT /v1/roles/{roleId}`                          | Update name/description            |
| **Delete**         | `DELETE /v1/roles/{roleId}`                       | Fails if role has associated users |
| **Enable/Disable** | `POST /v1/roles/{roleId}?command=enable\|disable` | Toggle role active state           |

### Permissions

| Operation                | Endpoint              | Notes                                             |
| ------------------------ | --------------------- | ------------------------------------------------- |
| **List**                 | `GET /v1/permissions` | All permissions; `?makerCheckerable=true` filters |
| **Update Maker-Checker** | `PUT /v1/permissions` | Toggle maker-checker config per permission        |

### Password Preferences

| Operation    | Endpoint                               | Notes                                |
| ------------ | -------------------------------------- | ------------------------------------ |
| **List**     | `GET /v1/passwordpreferences`          | Current active policy                |
| **Template** | `GET /v1/passwordpreferences/template` | All available policies               |
| **Update**   | `PUT /v1/passwordpreferences`          | Set `validationPolicyId` to activate |

### Missing Operations

- No bulk delete for users or roles
- No user reactivation endpoint (soft-deleted users cannot be restored via API)
- No permission CRUD (permissions are pre-installed, only maker-checker is configurable)

---

## 4. Create Workflow (Highest Priority)

### Pre-requisite Lookups

```
Load Offices (for user's office assignment)
  ↓  GET /offices?orderBy=id
Select Office
  ↓
Load Roles (for role selection)
  ↓  GET /roles
Select Roles (one or more)
  ↓
Load Template (pre-fills office/role dropdowns)
  ↓  GET /users/template
Submit Create User
  ↓  POST /users
```

### Create Request Fields

| Field                    | Type        | Required    | Validation                                                                               | Source         |
| ------------------------ | ----------- | ----------- | ---------------------------------------------------------------------------------------- | -------------- |
| `username`               | String      | **Yes**     | Not blank; max 100; must be unique                                                       | User input     |
| `firstname`              | String      | **Yes**     | Not blank; max 100                                                                       | User input     |
| `lastname`               | String      | **Yes**     | Not blank; max 100                                                                       | User input     |
| `email`                  | String      | Conditional | Max 100; required if `sendPasswordToEmail=true`                                          | User input     |
| `officeId`               | Long        | **Yes**     | > 0; must reference existing office                                                      | `GET /offices` |
| `roles`                  | Array<Long> | **Yes**     | Non-empty; each > 0                                                                      | `GET /roles`   |
| `staffId`                | Long        | No          | > 0; must reference existing staff                                                       | `GET /staff`   |
| `password`               | String      | Conditional | Must match active password policy regex; required if `sendPasswordToEmail` is false/null | User input     |
| `repeatPassword`         | String      | Conditional | Must equal `password`                                                                    | User input     |
| `sendPasswordToEmail`    | Boolean     | No          | If true, email is required and password is sent via email                                | User           |
| `passwordNeverExpires`   | Boolean     | No          | Overrides password expiration                                                            | User           |
| `isLoginRetriesEnabled`  | Boolean     | No          | Enable account lockout on failed attempts                                                | User           |
| `isPasswordResetAllowed` | Boolean     | No          | Allow user to reset password                                                             | User           |
| `locale`                 | String      | **Yes**     | e.g. "en"                                                                                | User           |
| `dateFormat`             | String      | **Yes**     | e.g. "dd MMMM yyyy"                                                                      | User           |

### Role Create Fields

| Field         | Type   | Required | Validation                 |
| ------------- | ------ | -------- | -------------------------- |
| `name`        | String | **Yes**  | Not blank; max 100; unique |
| `description` | String | **Yes**  | Not blank; max 500         |

### Role Permissions Update Fields

```json
{
  "permissionUsageData": [
    { "code": "CREATE_CLIENT", "selected": true },
    { "code": "READ_CLIENT", "selected": true },
    { "code": "READ_LOAN", "selected": false }
  ]
}
```

---

## 5. Lookup APIs

| UI Field          | Endpoint                            | Display       | Value  | Required            |
| ----------------- | ----------------------------------- | ------------- | ------ | ------------------- |
| Office            | `GET /offices`                      | `name`        | `id`   | Yes                 |
| Staff             | `GET /staff?officeId={id}`          | `displayName` | `id`   | No                  |
| Roles             | `GET /roles`                        | `name`        | `id`   | Yes                 |
| Permissions       | `GET /permissions`                  | `code`        | `code` | For role config     |
| Password Policies | `GET /passwordpreferences/template` | `description` | `id`   | For password config |

The **template endpoint** (`GET /users/template`) returns:

- `allowedOffices` — all offices (for dropdown)
- `availableRoles` — all roles (for dropdown)

---

## 6. API Call Order

### Create User

1. `GET /offices` — load offices
2. `GET /roles` — load roles
3. `GET /users/template` — load template (pre-fills office/role options)
4. `POST /users` — submit user creation

### Manage Roles

1. `GET /roles` — list roles
2. `POST /roles` — create role
3. `GET /roles/{roleId}/permissions` — view role's current permissions
4. `PUT /roles/{roleId}/permissions` — update role permissions
5. `POST /roles/{roleId}?command=enable|disable` — toggle role state

### Manage Password Policy

1. `GET /passwordpreferences/template` — list all validation policies
2. `PUT /passwordpreferences` — set active policy

---

## 7. Request Payload Analysis

### Create User (`POST /v1/users`)

```json
{
  "username": "jdoe",
  "firstname": "John",
  "lastname": "Doe",
  "email": "john.doe@example.com",
  "officeId": 1,
  "staffId": 1,
  "roles": [1, 2],
  "sendPasswordToEmail": false,
  "password": "Str0ng!Pass",
  "repeatPassword": "Str0ng!Pass",
  "passwordNeverExpires": false,
  "isLoginRetriesEnabled": true,
  "locale": "en",
  "dateFormat": "dd MMMM yyyy"
}
```

### Update User (`PUT /v1/users/{userId}`)

```json
{
  "username": "jdoe_updated",
  "firstname": "John",
  "lastname": "Doe",
  "email": "john.doe@newdomain.com",
  "officeId": 1,
  "staffId": 1,
  "roles": [1, 3],
  "passwordNeverExpires": true,
  "locale": "en",
  "dateFormat": "dd MMMM yyyy"
}
```

### Change Password (`POST /v1/users/{userId}/pwd`)

```json
{
  "password": "NewStr0ng!Pass456",
  "repeatPassword": "NewStr0ng!Pass456",
  "locale": "en",
  "dateFormat": "dd MMMM yyyy"
}
```

### Create Role (`POST /v1/roles`)

```json
{
  "name": "Loan Officer",
  "description": "Can manage loan applications and disbursements"
}
```

### Update Role Permissions (`PUT /v1/roles/{roleId}/permissions`)

```json
{
  "permissionUsageData": [
    { "code": "ALL_FUNCTIONS", "selected": false },
    { "code": "READ_CLIENT", "selected": true },
    { "code": "CREATE_CLIENT", "selected": true },
    { "code": "UPDATE_CLIENT", "selected": true },
    { "code": "READ_LOAN", "selected": true },
    { "code": "CREATE_LOAN", "selected": true },
    { "code": "APPROVE_LOAN", "selected": true },
    { "code": "DISBURSE_LOAN", "selected": true }
  ]
}
```

### Update Permissions Maker-Checker (`PUT /v1/permissions`)

```json
{
  "permissions": {
    "CREATE_CLIENT": true,
    "CREATE_LOAN": false,
    "DISBURSE_LOAN": true
  }
}
```

### Update Password Preferences (`PUT /v1/passwordpreferences`)

```json
{
  "validationPolicyId": 2,
  "locale": "en",
  "dateFormat": "dd MMMM yyyy"
}
```

### Forgot Password (`POST /v1/password/forgot`)

```json
{
  "email": "john.doe@example.com"
}
```

---

## 8. Validation Rules

### User Create Validation (`UserDataValidator`)

| Field                    | Required    | Validation                                                                      |
| ------------------------ | ----------- | ------------------------------------------------------------------------------- |
| `username`               | **Yes**     | Not blank; max 100 chars; must be unique                                        |
| `firstname`              | **Yes**     | Not blank; max 100 chars                                                        |
| `lastname`               | **Yes**     | Not blank; max 100 chars                                                        |
| `email`                  | Conditional | Max 100 chars; required if `sendPasswordToEmail=true`                           |
| `officeId`               | **Yes**     | > 0; must reference existing office                                             |
| `staffId`                | No          | If provided: > 0                                                                |
| `roles`                  | **Yes**     | Non-empty array of IDs                                                          |
| `password`               | Conditional | Must match active `PasswordValidationPolicy` regex; must equal `repeatPassword` |
| `repeatPassword`         | Conditional | Must equal `password`                                                           |
| `sendPasswordToEmail`    | No          | Boolean                                                                         |
| `passwordNeverExpires`   | No          | Boolean                                                                         |
| `isLoginRetriesEnabled`  | No          | Boolean                                                                         |
| `isPasswordResetAllowed` | No          | Boolean                                                                         |

### User Update Validation

All fields optional (validated only if parameter exists). Same length/format constraints as create.

### Change Password Validation

| Field                  | Required | Validation                                                |
| ---------------------- | -------- | --------------------------------------------------------- |
| `password`             | **Yes**  | Regex match from active policy; must equal repeatPassword |
| `repeatPassword`       | **Yes**  | Must equal password                                       |
| `password` vs previous | —        | Must not match any of last N passwords (default: 3)       |
| `password` vs current  | —        | Must be different from current password                   |

### Field-Level ACL

If the authenticated user lacks `ALL_FUNCTIONS` or `UPDATE_USER` permission, they can only change their own password. Attempting to modify other fields results in a validation error.

### Role Validation (`RoleDataValidator`)

| Field         | Required | Validation                 |
| ------------- | -------- | -------------------------- |
| `name`        | **Yes**  | Not blank; max 100; unique |
| `description` | **Yes**  | Not blank; max 500         |

### Password Preferences Validation

| Field                | Required | Validation                          |
| -------------------- | -------- | ----------------------------------- |
| `validationPolicyId` | **Yes**  | > 0; must reference existing policy |

### Password Validation Policy Rules

| Policy Field  | Description                                               |
| ------------- | --------------------------------------------------------- |
| `regex`       | Regex pattern for password strength validation            |
| `description` | Human-readable description of the policy (shown to users) |
| `active`      | Only one policy can be active at a time                   |

### Business Rule Validations (Write Services)

| Rule                   | Logic                                                                                    | Error                              |
| ---------------------- | ---------------------------------------------------------------------------------------- | ---------------------------------- |
| Username uniqueness    | Check `AppUserRepository` for existing non-deleted user with same username               | `UsernameAlreadyExistsException`   |
| Password reuse         | Check `AppUserPreviousPasswordRepository` for last N passwords (default 3)               | `PasswordPreviouslyUsedException`  |
| New password != old    | Compare with current encoded password                                                    | `PasswordMustBeDifferentException` |
| Username change        | New username must differ from current                                                    | `UsernameMustBeDifferentException` |
| Role delete protection | Check if any users are associated with role before delete                                | `RoleAssociatedException`          |
| Account lockout        | `registerFailedLoginAttempt()` increments counter; locks account if max retries exceeded | Auto-lock                          |

---

## 9. Business Flow

### Create User Flow

```
Controller (UsersApiResource.create)
  ↓
PortfolioCommandSourceWritePlatformService.logCommandSource()
  ↓
CommandHandler (CreateUserCommandHandler)
  ↓  @CommandType(entity = "USER", action = "CREATE")
Service (AppUserWritePlatformServiceJpaRepositoryImpl.createUser)
  ↓
UserDataValidator.validateForCreate(json)
  ↓  validates all required fields, password policy
AppUserRepository.findByUsernameAndDeletedAndEnabled(username)
  ↓  check username uniqueness
UserDomainService.create(appUser, sendPasswordToEmail)
  ↓
  ├─ PlatformPasswordEncoder.encode(password)  → hash password
  ├─ AppUserRepository.save(appUser)            → persist
  └─ PlatformEmailService.sendEmail()           → optional email with credentials
  ↓
Return CommandProcessingResult with userId
```

### Update Role Permissions Flow

```
Controller (RolesApiResource.updateRolePermissions)
  ↓
PortfolioCommandSourceWritePlatformService.logCommandSource()
  ↓
CommandHandler (UpdateRolePermissionsCommandHandler)
  ↓  @CommandType(entity = "ROLE", action = "PERMISSIONS")
Service (RoleWritePlatformServiceJpaRepositoryImpl.updateRolePermissions)
  ↓
RoleDataValidator.validateForUpdate(json)
  ↓  validates name/description if provided
RoleRepository.findById(roleId)
  ↓  throws RoleNotFoundException if not found
PermissionsCommandFromApiJsonDeserializer.commandFromApiJson(json)
  ↓  deserializes permissionUsageData array
For each permission in request:
  ├─ PermissionRepository.findOneByCode(code)  → case-insensitive lookup
  └─ role.updatePermission(permission, isSelected)
  ↓
RoleRepository.saveAndFlush(role)
  ↓
Evict caches: "users", "usersByUsername"
  ↓
Return CommandProcessingResult with roleId
```

---

## 10. Related Operations

| Operation             | Endpoint                                                           | Description                                          |
| --------------------- | ------------------------------------------------------------------ | ---------------------------------------------------- |
| Enable Role           | `POST /v1/roles/{roleId}?command=enable`                           | Activate a disabled role                             |
| Disable Role          | `POST /v1/roles/{roleId}?command=disable`                          | Deactivate a role                                    |
| Make Checker Config   | `PUT /v1/permissions`                                              | Enable/disable maker-checker workflow per permission |
| List User Permissions | `GET /v1/roles/{roleId}/permissions`                               | View permissions assigned to a role                  |
| Forgot Password       | `POST /v1/password/forgot`                                         | Send temporary password via email                    |
| Bulk Import Users     | `GET /v1/users/downloadtemplate` + `POST /v1/users/uploadtemplate` | Excel-based bulk user creation                       |
| Login                 | `POST /v1/authentication`                                          | Basic auth or token-based login                      |
| 2FA                   | `POST /v1/twofactor`                                               | Two-factor authentication                            |
| Current User Details  | `GET /v1/userdetails`                                              | Get authenticated user's info                        |
| OIDC Config           | `GET /v1/tenants/{tenantId}/oidc-config`                           | OIDC tenant configuration                            |

---

## 11. Hidden Dependencies

| Dependency                      | Impact                                                                                                                |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| **Office must exist**           | User cannot be created without a valid office reference                                                               |
| **Password policy configured**  | If no active `PasswordValidationPolicy` exists, password validation will fail                                         |
| **Email service configured**    | Required if `sendPasswordToEmail=true`; also required for forgot password flow                                        |
| **Roles exist**                 | Must have at least one role to assign to a user                                                                       |
| **Permissions pre-installed**   | Permissions are seeded via database migrations; roles can only reference existing permissions                         |
| **Admin/system users**          | `ADMIN_USER_ID=1`, `SYSTEM_USER_ID=2` are hardcoded in constants and must exist                                       |
| **Password history**            | Previous passwords are tracked (default: last 3) to prevent reuse                                                     |
| **Cache eviction**              | User read data is cached (`@Cacheable("users")`). Write operations evict the cache. Cache must be configured.         |
| **Maker-checker integration**   | If maker-checker is enabled for an operation, the command goes through an approval queue first                        |
| **Self-read bypass**            | Users can read their own profile without explicit `READ_USER` permission                                              |
| **Field-level ACL**             | Non-admin users updating user profiles can only change their own password                                             |
| **Soft delete**                 | Deleting a user renames the username to `{id}_DELETED_{username}` — this pattern must be handled in uniqueness checks |
| **Failed login tracking**       | `isLoginRetriesEnabled` + `maxFailedLoginAttempts` config determines account lockout behavior                         |
| **Temporary passwords**         | Forgot password flow creates a temporary password with expiry time                                                    |
| **Spring Security integration** | AppUser implements `PlatformUser` (Spring Security). Changes to roles/permissions take effect on next authentication  |

---

## 12. Implementation Checklist

### Users

- [ ] User List (`GET /v1/users`)
- [ ] User Detail (`GET /v1/users/{userId}`)
- [ ] User Template/Lookup (`GET /v1/users/template`)
- [ ] Create User (`POST /v1/users`)
- [ ] Update User (`PUT /v1/users/{userId}`)
- [ ] Delete User (`DELETE /v1/users/{userId}`)
- [ ] Change Password (`POST /v1/users/{userId}/pwd`)
- [ ] User Search/Filters
- [ ] Bulk Import (downloadtemplate + uploadtemplate)

### Roles

- [ ] Role List (`GET /v1/roles`)
- [ ] Role Detail (`GET /v1/roles/{roleId}`)
- [ ] Create Role (`POST /v1/roles`)
- [ ] Update Role (`PUT /v1/roles/{roleId}`)
- [ ] Delete Role (`DELETE /v1/roles/{roleId}`)
- [ ] Enable Role (`POST /v1/roles/{roleId}?command=enable`)
- [ ] Disable Role (`POST /v1/roles/{roleId}?command=disable`)
- [ ] View Role Permissions (`GET /v1/roles/{roleId}/permissions`)
- [ ] Update Role Permissions (`PUT /v1/roles/{roleId}/permissions`)

### Permissions

- [ ] Permission List (`GET /v1/permissions`)
- [ ] Permission List (maker-checker filter) (`GET /v1/permissions?makerCheckerable=true`)
- [ ] Update Maker-Checker Config (`PUT /v1/permissions`)

### Password Preferences

- [ ] View Active Policy (`GET /v1/passwordpreferences`)
- [ ] List Available Policies (`GET /v1/passwordpreferences/template`)
- [ ] Set Active Policy (`PUT /v1/passwordpreferences`)

### Forgot Password

- [ ] Request Password Reset (`POST /v1/password/forgot`)

### Authentication (Related)

- [ ] Login (`POST /v1/authentication`)
- [ ] Logout
- [ ] Refresh Token
- [ ] Current User Details (`GET /v1/userdetails`)
- [ ] Two-Factor Auth Setup + Verify
- [ ] 2FA Configuration
