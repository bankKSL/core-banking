Configuration & Admin Feature Analysis

1. Feature Overview
   Business Purpose: The Configuration & Admin module manages the entire platform's global settings, external service integrations, and user/role/permission administration. It is the control center for all system-wide operational parameters.
   Feature Lifecycle:

- Configuration properties are pre-seeded via Liquibase migrations (0002_initial_data.xml and ~40+ incremental migrations)
- Admin can read, update (toggling enable/disable, or setting numeric/date/string values)
- Configuration properties CANNOT be deleted or created via the API (except survey configs)
- Users, Roles, and Permissions follow full CRUD lifecycle
  Main Java Classes:
  Module Key Classes
  Global Configuration GlobalConfigurationApiResource, GlobalConfigurationWritePlatformServiceJpaRepositoryImpl, ConfigurationDomainServiceJpa, GlobalConfigurationProperty (entity)
  External Services ExternalServicesConfigurationApiResource, ExternalServicesPropertiesReadPlatformServiceImpl, ExternalServicesProperties (entity)
  Users UsersApiResource, AppUserReadPlatformServiceImpl, AppUserWritePlatformServiceJpaRepositoryImpl, AppUser (entity)
  Roles RolesApiResource, RoleReadPlatformServiceImpl, RoleWritePlatformServiceJpaRepositoryImpl, Role (entity)
  Permissions PermissionsApiResource, PermissionReadPlatformServiceImpl
  Password Policy PasswordPreferencesApiResource, PasswordValidationPolicy (entity)
  2FA TwoFactorConfigurationApiResource (fineract-security)
  External Events ExternalEventConfigurationApiResource (fineract-core)
  Business Date BusinessDateApiResource (fineract-core)
  Cache CacheApiResource (fineract-core)
  Email EmailConfigurationApiResource (campaigns/email)
  Credit Bureau CreditBureauConfigurationApiResource
  Entity Field Config EntityFieldConfigurationApiResource
  OIDC / Tenant TenantOidcConfigApiResource (fineract-security)
  Database Tables:
  Table Purpose
  c_configuration Global configuration (name, enabled, value, date_value, string_value, is_trap_door)
  c_external_service Service definitions (S3, SMTP, SMS, Notification)
  c_external_service_properties Key-value config for external services
  m_external_event_configuration Per-event-type enable/disable for external events
  m_permission Pre-installed permissions
  m_role Application roles
  m_role_permission Role-to-permission join
  m_appuser Application users
  m_appuser_role User-to-role join
  r_enum_value Validation policy types
  m_password_validation_policy Password validation rules
  twofactor_configuration 2FA settings
  scheduled_email_configuration Email campaign config
  m_field_configuration Entity field enable/disable

2. API Inventory
   2.1 Global Configuration (/v1/configurations)
   Method URL Description
   GET /v1/configurations List all configurations
   GET /v1/configurations/{configId} Get one config by ID
   GET /v1/configurations/name/{name} Get one config by name
   PUT /v1/configurations/{configId} Update config by ID
   PUT /v1/configurations/name/{configName} Update config by name
   2.2 External Services (/v1/externalservice)
   Method URL Description Permission
   GET /v1/externalservice/{servicename} Get external service config externalServiceConfiguration
   PUT /v1/externalservice/{servicename} Update external service config externalServiceConfiguration
   2.3 External Events Configuration (/v1/externalevents/configuration)
   Method URL Description
   GET /v1/externalevents/configuration List event configurations
   PUT /v1/externalevents/configuration Update event configurations
   2.4 Email Configuration (/v1/email/configuration)
   Method URL Description
   GET /v1/email/configuration Get email SMTP config
   PUT /v1/email/configuration Update email SMTP config
   2.5 Two-Factor Configuration (/v1/twofactor/configure)
   Method URL
   GET /v1/twofactor/configure
   PUT /v1/twofactor/configure
   2.6 Users (/v1/users)
   Method URL Description
   GET /v1/users List all users
   GET /v1/users/{userId} Get user details (supports ?template=true)
   GET /v1/users/template Get user creation template
   POST /v1/users Create user
   PUT /v1/users/{userId} Update user
   POST /v1/users/{userId}/pwd Change user password
   DELETE /v1/users/{userId} Delete user
   GET /v1/users/downloadtemplate Download bulk import template
   POST /v1/users/uploadtemplate Upload bulk import
   2.7 Roles (/v1/roles)
   Method URL Description
   GET /v1/roles List all roles
   POST /v1/roles Create role
   GET /v1/roles/{roleId} Get role detail
   POST /v1/roles/{roleId}?command=enable|disable Enable/disable role
   PUT /v1/roles/{roleId} Update role
   GET /v1/roles/{roleId}/permissions Get role permissions
   PUT /v1/roles/{roleId}/permissions Update role permissions
   DELETE /v1/roles/{roleId} Delete role
   2.8 Permissions (/v1/permissions)
   Method URL Description
   GET /v1/permissions List permissions (?makerCheckerable=true)
   PUT /v1/permissions Enable/disable maker-checker on permissions
   2.9 Password Preferences (/v1/passwordpreferences)
   Method URL Description
   GET /v1/passwordpreferences Get active password policy
   PUT /v1/passwordpreferences Update password policy
   GET /v1/passwordpreferences/template List all available policies
   2.10 Additional Admin Endpoints
   Method URL
   GET /v1/businessdate
   GET /v1/businessdate/{type}
   POST /v1/businessdate
   GET /v1/caches
   PUT /v1/caches
   POST /v1/password/forgot
   GET /v1/fieldconfiguration/{entity}
   GET /v1/CreditBureauConfiguration
   GET /v1/tenants/{tenantId}/oidc-config
   GET/PUT/POST/DELETE /v1/tenants/{tenantId}/oidc-config
3. CRUD Analysis
   3.1 Global Configuration
   Operation Available? Notes
   List YES GET /v1/configurations or GET /v1/configurations?survey=true
   Detail YES GET /v1/configurations/{id} or GET /v1/configurations/name/{name}
   Create NO (via API) Only via DB migration or addSurveyConfig() (internal)
   Update YES PUT /v1/configurations/{id} or PUT /v1/configurations/name/{name}
   Delete NO Config properties cannot be deleted
   3.2 Users
   Operation Available? Notes
   List YES GET /v1/users
   Detail YES GET /v1/users/{id} (supports ?template=true)
   Create YES POST /v1/users
   Update YES PUT /v1/users/{id}
   Delete YES DELETE /v1/users/{id}
   Template YES GET /v1/users/template
   3.3 Roles
   Operation Available? Notes
   List YES GET /v1/roles
   Detail YES GET /v1/roles/{id}
   Create YES POST /v1/roles
   Update YES PUT /v1/roles/{id}
   Delete YES DELETE /v1/roles/{id} (only if no users associated)
   Enable/Disable YES POST /v1/roles/{id}?command=enable|disable
   Permissions YES GET/PUT /v1/roles/{id}/permissions
   3.4 External Services
   Operation Available? Notes
   List YES GET /v1/externalservice/{servicename}
   Update YES PUT /v1/externalservice/{servicename}
   Create NO Pre-seeded via DB
   Delete NO Cannot delete
   3.5 Password Preferences
   Operation Available? Notes
   List YES GET /v1/passwordpreferences
   Template YES GET /v1/passwordpreferences/template (all policies)
   Update YES PUT /v1/passwordpreferences
   Create NO Pre-installed
   Delete NO Cannot delete
4. Create Workflow (Highest Priority)
   4.1 Create User (POST /v1/users)
   Field Required Type Validation
   username YES String notBlank, max 100 chars
   firstname YES String notBlank, max 100 chars
   lastname YES String notBlank, max 100 chars
   email Conditionally YES String notBlank, max 100 chars
   officeId YES Long integerGreaterThanZero
   roles YES Array<Long> arrayNotEmpty
   sendPasswordToEmail YES Boolean trueOrFalseRequired
   staffId NO Long integerGreaterThanZero
   passwordNeverExpires NO Boolean validateForBooleanValue
   isLoginRetriesEnabled NO Boolean validateForBooleanValue
   isPasswordResetAllowed NO Boolean validateForBooleanValue
   password Conditionally YES String regex validation against active policy
   repeatPassword Conditionally YES String must match password
   4.2 Create Role (POST /v1/roles)
   Field Required Type
   name YES String
   description YES String
   4.3 Update Global Configuration (PUT /v1/configurations/{id})
   Field Required Type
   enabled NO Boolean
   value NO Long
   dateValue NO LocalDate
   stringValue NO String
   locale NO String
   dateFormat NO String
5. Lookup APIs
   UI Field Endpoint Display
   Office GET /offices?limit=-1 name
   Roles (for user) GET /roles name
   Staff GET /staff?officeId={officeId} displayName
   Available Policies GET /passwordpreferences/template description
   External Services Pre-seeded: S3, SMTP, SMS, NOTIFICATION name
   Config List GET /configurations name
   Roles (for perm) GET /roles/{roleId}/permissions perms grouped
   All Permissions GET /permissions grouping + code
6. API Call Order
   6.1 Create User
7. GET /offices → Load offices for dropdown
8. Select office
9. GET /staff?officeId={officeId} → Load staff for selected office (optional)
10. GET /roles → Load roles for assignment
11. Determine if sendPasswordToEmail is true/false
12. If sendPasswordToEmail=false, password must be provided and validated
13. POST /users → Submit create user
    6.2 Update Config
14. GET /configurations or GET /configurations/name/{name} → Load current values
15. Decide which fields to update (enabled, value, dateValue, stringValue)
16. PUT /configurations/{id} → Submit update
    6.3 Manage Role Permissions
17. GET /roles → Load roles
18. Select role → GET /roles/{roleId}/permissions → Load current permissions
19. Modify permission selections
20. PUT /roles/{roleId}/permissions → Submit
    6.4 Enable/Disable Maker-Checker
21. GET /permissions?makerCheckerable=true → Load permissions with maker-checker status
22. Modify selected flags on permissions
23. PUT /permissions → Submit
24. Request Payload Analysis
    7.1 PUT /v1/configurations/{configId}
    {
    "enabled": true,
    "value": 30,
    "dateValue": "2024-01-15",
    "stringValue": "some_text",
    "locale": "en",
    "dateFormat": "yyyy-MM-dd"
    }
    All fields are optional — you can send only the fields to update.
    7.2 POST /v1/users
    {
    "username": "jdoe",
    "firstname": "John",
    "lastname": "Doe",
    "email": "john@example.com",
    "officeId": 1,
    "staffId": 2,
    "roles": [1, 2, 3],
    "sendPasswordToEmail": true,
    "passwordNeverExpires": false,
    "isLoginRetriesEnabled": true,
    "isPasswordResetAllowed": false
    }
    If sendPasswordToEmail: false, must also provide:
    {
    "password": "MyP@ssw0rd123",
    "repeatPassword": "MyP@ssw0rd123"
    }
    7.3 POST /v1/roles
    {
    "name": "Loan Officer",
    "description": "Role for loan officers"
    }
    7.4 PUT /v1/roles/{roleId}/permissions
    {
    "permissions": [
    {"code": "CREATE_LOAN", "selected": true},
    {"code": "READ_LOAN", "selected": true}
    ]
    }
    7.5 PUT /v1/permissions
    {
    "permissions": [
    {"code": "CREATE_LOAN", "selected": true, "isMakerChecker": true}
    ]
    }
    7.6 PUT /v1/externalservice/SMTP
    {
    "username": "user@example.com",
    "password": "secret",
    "host": "smtp.example.com",
    "port": "587",
    "useTLS": "true"
    }
25. Validation Rules
    8.1 Global Configuration Update (GlobalConfigurationDataValidator)

- JSON must not be blank
- Unsupported parameters rejected: only enabled, value, dateValue, stringValue, locale, dateFormat allowed
- enabled → must be a boolean
- value → must be zero or positive long
- dateValue → must not be null if provided
- stringValue → must not be null if provided
- Some config properties cannot be modified (trapDoor=true) → GlobalConfigurationPropertyCannotBeModfied
  8.2 Create User (UserDataValidator)
- username → notBlank, max 100 chars
- firstname → notBlank, max 100 chars
- lastname → notBlank, max 100 chars
- email → notBlank, max 100 chars (if sendPasswordToEmail=true)
- officeId → notNull, integerGreaterThanZero
- staffId → if provided, integerGreaterThanZero
- roles → arrayNotEmpty
- sendPasswordToEmail → trueOrFalseRequired
- password → must match active regex policy, repeatPassword must equal password
- passwordNeverExpires → must be boolean
- isLoginRetriesEnabled → must be boolean
- isPasswordResetAllowed → must be boolean
- Unsupported parameters check: CREATE_SUPPORTED_PARAMETERS set
  8.3 Change Password (UserDataValidator)
- Only password and repeatPassword allowed
- Password validation against active PasswordValidationPolicy regex
- repeatPassword must equal password
- Field-level ACL: non-admin users can only change their own password
  8.4 Update User (UserDataValidator)
- Each field validated individually if present (same rules as create)
- Field-level ACL enforced
  8.5 Role Operations
- Create: name and description required, notBlank
- Delete: fails if role is associated with any users (RoleAssociatedException)
- Disable: fails if role is associated with users
  8.6 Password Preferences
- Only one policy can be active at a time
- The regex pattern and description come from pre-installed policies
  8.7 External Services
- Service name must exist (pre-seeded: S3, SMTP, SMS, NOTIFICATION)
- Only valid property names for each service type are accepted
  8.8 Business Rules (from ConfigurationDomainService)
- isMakerCheckerEnabledForTask(taskPermissionCode) → checks both master maker-checker AND task-level flag
- isSameMakerCheckerEnabled() → checks enable-same-maker-checker
- Password validation uses regex from active PasswordValidationPolicy
- Login retry uses max-login-retry-attempts config
- Force password reset uses force-password-reset-on-first-login config
- Password reuse uses password-reuse-check-history-count config

9. Business Flow
   9.1 Global Configuration (Update)
   GlobalConfigurationApiResource
   ↓ PUT /v1/configurations/{configId}
   ↓ CommandWrapperBuilder.updateGlobalConfiguration(configId).withJson(json)
   ↓ PortfolioCommandSourceWritePlatformService.logCommandSource()
   ↓ UpdateGlobalConfigurationCommandHandler
   ↓ GlobalConfigurationWritePlatformServiceJpaRepositoryImpl.update()
   ↓ GlobalConfigurationDataValidator.validateForUpdate()
   ↓ GlobalConfigurationPropertyUpdateService.update()
   ↓ repository.save(GlobalConfigurationProperty)
   ↓ configurationDomainService.removeGlobalConfigurationPropertyDataFromCache(name)
   ↓ Returns CommandProcessingResult
   9.2 Users (Create)
   UsersApiResource
   ↓ POST /v1/users
   ↓ CommandWrapperBuilder.createUser().withJson(json)
   ↓ PortfolioCommandSourceWritePlatformService.logCommandSource()
   ↓ CreateUserCommandHandler
   ↓ AppUserWritePlatformServiceJpaRepositoryImpl.createUser()
   ↓ UserDataValidator.validateForCreate()
   ↓ AppUser domain logic (new user creation, role assignment)
   ↓ AppUserRepository.save(appUser)
   ↓ [Optional] Send email with auto-generated password
   ↓ Returns CommandProcessingResult
   9.3 Roles (Create)
   RolesApiResource
   ↓ POST /v1/roles
   ↓ CommandWrapperBuilder.createRole().withJson(json)
   ↓ CreateRoleCommandHandler
   ↓ RoleWritePlatformServiceJpaRepositoryImpl.create()
   ↓ RoleDataValidator.validateForCreate()
   ↓ RoleRepository.save(role)
   ↓ Returns CommandProcessingResult
10. Related Operations
    Category Endpoints
    Authentication POST /v1/authenticate, POST /v1/logout
    Two-Factor Auth GET /v1/twofactor, POST /v1/twofactor, POST /v1/twofactor/validate, POST /v1/twofactor/invalidate
    Self-Service GET /v1/self/user/details
    Business Date GET /v1/businessdate, GET /v1/businessdate/{type}, POST /v1/businessdate
    Cache GET /v1/caches, PUT /v1/caches
    Email Config GET /v1/email/configuration, PUT /v1/email/configuration
    Credit Bureau GET/PUT/POST /v1/CreditBureauConfiguration/**
    Entity Field Config GET /v1/fieldconfiguration/{entity}
    Tenant OIDC GET/POST/PUT/DELETE /v1/tenants/{tenantId}/oidc-config
    Forgot Password POST /v1/password/forgot
    Bulk Import GET /v1/users/downloadtemplate, POST /v1/users/uploadtemplate
11. Hidden Dependencies
    Feature Flags (Global Configurations)
    These configurations gate features and MUST be loaded:
    Config Constant What It Controls
    maker-checker Enables maker-checker approval workflow
    enable-same-maker-checker Allows same user to make & check
    force-password-reset-on-first-login Enables forced password reset
    max-login-retry-attempts Enables login retry limiting
    password-reuse-check-history-count Enables password reuse checking
    enable-business-date Enables business date override
    Permissions Required
    API Resource Permission Code
    Global Configuration CONFIGURATION
    External Services EXTERNAL_SERVICES_CONFIGURATION (or similar)
    Users USER
    Roles ROLE
    Permissions PERMISSION
    Password Preferences PASSWORD_PREFERENCES
    External Events Config EXTERNAL_EVENT_CONFIGURATION
    Email Config EMAIL_CONFIGURATION
    Critical Sequences
12. Create User requires → GET /offices resolved first, GET /roles for role selection, then POST /users
13. Role Permissions requires → GET /roles/{id}/permissions to see current state, then PUT /roles/{id}/permissions
14. Maker-Checker setup requires → GET /permissions?makerCheckerable=true (different response than without flag)
15. Password policy update requires → GET /passwordpreferences/template to see available policies first
    System Properties

- fineract.security.2fa.enabled — gates 2FA endpoints entirely
- The is_trap_door flag on c_configuration indicates whether a config can be modified via API
- InternalConfigurationsApiResource only available in TEST profile

12. Implementation Checklist
    Global Configuration

- GET /v1/configurations — list all configs with pagination/filtering
- GET /v1/configurations/{id} — get single config detail
- GET /v1/configurations/name/{name} — get config by name
- PUT /v1/configurations/{id} — update config (enabled/value/dateValue/stringValue)
- PUT /v1/configurations/name/{name} — update config by name
- Handle trapDoor read-only configs (disable edit UI)
  External Services Configuration
- GET /v1/externalservice/{servicename} — read S3, SMTP, SMS, NOTIFICATION config
- PUT /v1/externalservice/{servicename} — update external service properties
- Show masked values (password, secret key) in UI
  User Administration
- GET /v1/users/template — load user creation template (offices, roles)
- GET /v1/users — list all users
- GET /v1/users/{id} — get user detail (with ?template=true for edit context)
- POST /v1/users — create user with validation
- PUT /v1/users/{id} — update user
- POST /v1/users/{id}/pwd — change password with repeatPassword validation
- DELETE /v1/users/{id} — delete user
- GET /v1/users/downloadtemplate — bulk import template
- POST /v1/users/uploadtemplate — bulk import
  Role Administration
- GET /v1/roles — list all roles
- POST /v1/roles — create role (name + description)
- GET /v1/roles/{id} — get role detail
- PUT /v1/roles/{id} — update role
- POST /v1/roles/{id}?command=enable|disable — enable/disable
- DELETE /v1/roles/{id} — delete role (check for user association)
- GET /v1/roles/{id}/permissions — get role permissions
- PUT /v1/roles/{id}/permissions — update role permissions
  Permissions
- GET /v1/permissions — list all permissions (grouped by entity)
- GET /v1/permissions?makerCheckerable=true — list with maker-checker status
- PUT /v1/permissions — enable/disable maker-checker on permissions
  Password Preferences
- GET /v1/passwordpreferences — get active password policy
- GET /v1/passwordpreferences/template — get all available policies
- PUT /v1/passwordpreferences — activate a different policy
  Additional Admin Features
- GET /v1/externalevents/configuration — list external event configs
- PUT /v1/externalevents/configuration — toggle event types
- GET /v1/businessdate — get current business dates
- POST /v1/businessdate — update business date
- GET /v1/caches — list cache types
- PUT /v1/caches — switch cache implementation
- GET/PUT /v1/email/configuration — email SMTP config
- GET /v1/fieldconfiguration/{entity} — entity field enable/disable
- Two-Factor Authentication management
