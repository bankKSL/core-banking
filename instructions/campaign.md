Campaigns Feature Analysis

1. Feature Overview
   Business Purpose: The Campaigns module enables bulk communication to clients via SMS and Email. It supports automated outbound campaigns triggered by schedules, direct triggers, or transaction-based events. Includes message composition, business rule-based targeting, campaign lifecycle management (pending → active → closed), and gateway integration.
   Feature Lifecycle:

- Campaigns are created in PENDING state
- They are then ACTIVATED to begin sending
- They can be CLOSED to stop sending
- Closed campaigns can be REACTIVATED
- Only closed campaigns can be DELETED (soft delete via is_visible flag)
- Message flow: Campaign → SmsMessage/EmailMessage outbound → Gateway (SMS/Email)
  Main Package Structure:
  Package Purpose
  campaigns/sms/ SMS Campaign management (CRUD, activation, lifecycle)
  campaigns/email/ Email Campaign management (CRUD, activation, lifecycle)
  campaigns/jobs/ Background batch jobs (execute email, send to SMS gateway, fetch delivery reports, update outbound)
  campaigns/helper/ SMS config utility (gateway HTTP requests)
  campaigns/constants/ Shared campaign type enums
  sms/ Generic SMS messages (assemblers, repository, write/read services)
  Key Java Classes (per function):
  Component SMS Email
  API Resource SmsCampaignApiResource EmailCampaignApiResource
  Entity SmsCampaign EmailCampaign
  Repository SmsCampaignRepository EmailCampaignRepository
  Read Service SmsCampaignReadPlatformServiceImpl (JDBC) EmailCampaignReadPlatformServiceImpl (JDBC)
  Write Service SmsCampaignWritePlatformServiceJpaImpl EmailCampaignWritePlatformCommandHandlerImpl
  Domain Service SmsCampaignDomainServiceImpl EmailCampaignDomainServiceImpl
  Validator SmsCampaignValidator EmailCampaignValidator
  Mapper SmsCampaignMapper (RowMapper) —
  Main DTO SmsCampaignData EmailCampaignData
  Timeline DTO SmsCampaignTimeLine EmailCampaignTimeLine
  Business Rules SmsBusinessRulesData EmailBusinessRulesData
  Database Tables:
  Table Entity Purpose
  sms_campaign SmsCampaign SMS campaign definitions
  sms_messages_outbound SmsMessage Outbound SMS messages
  scheduled_email_campaign EmailCampaign Email campaign definitions
  scheduled_email_messages_outbound EmailMessage Outbound email messages
  scheduled_email_configuration WebSocketEmailConfiguration (actually EmailConfiguration) SMTP configuration
  Campaign Statuses:
  Status Code Description
  PENDING 100 Initial state after creation
  ACTIVE 300 Campaign is active and sending
  CLOSED 600 Campaign is stopped
  Trigger Types:
  Type Code Description
  DIRECT 1 Manual/single-send campaign
  SCHEDULE 2 Recurring scheduled campaign (with recurrence/FREQ rule)
  TRIGGERED 3 Business event triggered
  Campaign Types:
  Type Code
  SMS 1
  NOTIFICATION 2

2. API Inventory
   2.1 SMS Campaigns (/v1/smscampaigns)
   Method URL Description Permission Query/Path Params
   GET /v1/smscampaigns/template Get creation template (providers, business rules, enums) SMS_CAMPAIGN —
   POST /v1/smscampaigns Create an SMS campaign SMS_CAMPAIGN —
   GET /v1/smscampaigns/{resourceId} Get single campaign detail SMS_CAMPAIGN {resourceId}
   GET /v1/smscampaigns List campaigns (paginated) SMS_CAMPAIGN ?offset, ?limit, ?orderBy, ?sortOrder
   PUT /v1/smscampaigns/{campaignId} Update campaign SMS_CAMPAIGN {campaignId}
   POST /v1/smscampaigns/{campaignId}?command=activate|close|reactivate Activate/close/reactivate SMS_CAMPAIGN {campaignId}, ?command
   POST /v1/smscampaigns/preview Preview campaign message SMS_CAMPAIGN —
   DELETE /v1/smscampaigns/{campaignId} Delete campaign (soft, must be closed) SMS_CAMPAIGN {campaignId}
   2.2 Email Campaigns (/v1/email/campaign)
   Method URL Description Permission Path Params
   GET /v1/email/campaign/{resourceId} Get single email campaign EMAIL_CAMPAIGN {resourceId}
   GET /v1/email/campaign List all email campaigns EMAIL_CAMPAIGN —
   POST /v1/email/campaign Create email campaign EMAIL_CAMPAIGN —
   PUT /v1/email/campaign/{resourceId} Update email campaign EMAIL_CAMPAIGN {resourceId}
   POST /v1/email/campaign/{resourceId}?command=activate|close|reactivate Activate/close/reactivate EMAIL_CAMPAIGN {resourceId}, ?command
   POST /v1/email/campaign/preview Preview email campaign message EMAIL_CAMPAIGN —
   GET /v1/email/campaign/template Get template (business rules) EMAIL_CAMPAIGN —
   GET /v1/email/campaign/template/{resourceId} Get single template by ID EMAIL_CAMPAIGN {resourceId}
   DELETE /v1/email/campaign/{resourceId} Delete email campaign EMAIL_CAMPAIGN {resourceId}
   2.3 Email Messages (/v1/email)
   Method URL Description
   GET /v1/email List all email messages
   GET /v1/email/pendingEmail List pending emails
   GET /v1/email/sentEmail List sent emails
   GET /v1/email/messageByStatus List emails by status with date range
   GET /v1/email/failedEmail List failed emails
   POST /v1/email Create email message
   GET /v1/email/{resourceId} Get single email
   PUT /v1/email/{resourceId} Update email message
   DELETE /v1/email/{resourceId} Delete email message
   2.4 Email Configuration (/v1/email/configuration)
   Method URL Description
   GET /v1/email/configuration Get SMTP config
   PUT /v1/email/configuration Update SMTP config
   2.5 SMS Messages (/v1/sms)
   Method URL Description Query Params
   GET /v1/sms/{campaignId}/messageByStatus List SMS by campaign and status ?status, ?offset, ?limit, ?fromDate, ?toDate
   GET /v1/sms List all SMS messages —
   POST /v1/sms Create SMS message —
   GET /v1/sms/{resourceId} Get single SMS —
   PUT /v1/sms/{resourceId} Update SMS —
   DELETE /v1/sms/{resourceId} Delete SMS —
3. CRUD Analysis
   3.1 SMS Campaigns
   Operation Available? Notes
   List YES GET /v1/smscampaigns (paginated with offset/limit/orderBy/sortOrder)
   Detail YES GET /v1/smscampaigns/{id}
   Create YES POST /v1/smscampaigns
   Update YES PUT /v1/smscampaigns/{id} (only when in PENDING/CLOSED state)
   Delete YES DELETE /v1/smscampaigns/{id} (only when CLOSED, soft delete)
   Template YES GET /v1/smscampaigns/template
   Preview YES POST /v1/smscampaigns/preview
   Activate YES POST /v1/smscampaigns/{id}?command=activate
   Close YES POST /v1/smscampaigns/{id}?command=close
   Reactivate YES POST /v1/smscampaigns/{id}?command=reactivate
   3.2 Email Campaigns
   Operation Available? Notes
   List YES GET /v1/email/campaign (non-paginated Collection)
   Detail YES GET /v1/email/campaign/{id}
   Create YES POST /v1/email/campaign
   Update YES PUT /v1/email/campaign/{id}
   Delete YES DELETE /v1/email/campaign/{id} (must be closed)
   Template YES GET /v1/email/campaign/template and GET /v1/email/campaign/template/{id}
   Preview YES POST /v1/email/campaign/preview
   Activate/Close/Reactivate YES POST /v1/email/campaign/{id}?command=...
4. Create Workflow (Highest Priority)
   4.1 Create SMS Campaign (POST /v1/smscampaigns)
   Field Required Type Validation Source Endpoint Notes
   campaignName YES String notBlank, max 100, unique — Unique constraint
   campaignType YES Long(enum) integerGreaterThanZero GET /v1/smscampaigns/template 1=SMS, 2=Notification
   triggerType YES Long(enum) integerGreaterThanZero GET /v1/smscampaigns/template 1=Direct, 2=Schedule, 3=Triggered
   providerId Conditionally YES Long integerGreaterThanZero GET /v1/smscampaigns/template (SmsProviderOptions) Required if campaignType=SMS; null for NOTIFICATION
   runReportId YES Long integerGreaterThanZero GET /v1/smscampaigns/template (BusinessRulesOptions) FK to stretchy_report
   message YES String notBlank, max 480 — Campaign message content
   paramValue Conditionally YES JSON Object notBlank — Required if triggerType≠TRIGGERED; JSON key-value pairs for report params
   frequency Conditionally YES Integer integerGreaterThanZero GET /v1/smscampaigns/template (FrequencyTypeOptions) Required if triggerType=SCHEDULE
   interval Conditionally YES String notBlank — Required if triggerType=SCHEDULE
   repeatsOnDay Conditionally YES String notBlank GET /v1/smscampaigns/template (WeekDays) Required if frequency=WEEKLY
   recurrenceStartDate Conditionally YES DateTime notBlank — Required if triggerType=SCHEDULE; format via dateTimeFormat
   submittedOnDate NO LocalDate notNull if provided — Defaults to business date
   isNotification NO Boolean trueOrFalseRequired — If true, no provider needed
   locale NO String — — For date parsing
   dateFormat NO String — — For date parsing
   dateTimeFormat NO String — — For recurrence date parsing
   Create request example:
   {
   "campaignName": "Loan Arrears Reminder",
   "campaignType": 1,
   "triggerType": 2,
   "providerId": 1,
   "runReportId": 5,
   "message": "Dear client, your loan repayment is overdue.",
   "paramValue": "{\"officeId\": 1}",
   "frequency": 1,
   "interval": "1",
   "repeatsOnDay": 2,
   "recurrenceStartDate": "2024-01-01 00:00:00",
   "dateTimeFormat": "yyyy-MM-dd HH:mm:ss",
   "locale": "en"
   }
   4.2 Create Email Campaign (POST /v1/email/campaign)
   Field Required Type Validation Source Endpoint Notes
   campaignName YES String notBlank, max 100 —
   campaignType YES Long(enum) integerGreaterThanZero GET /v1/email/campaign/template 1=Direct, 2=Schedule, 3=Triggered
   businessRuleId YES Long integerGreaterThanZero GET /v1/email/campaign/template (EmailBusinessRulesData) FK to stretchy_report
   paramValue YES String notBlank — JSON string of report params
   emailSubject YES String notBlank, max 50 — Email subject line
   emailMessage YES String notBlank, max 480 — Email body content
   recurrence Conditionally YES String notBlank — Required if campaignType=SCHEDULE
   recurrenceStartDate Conditionally YES String notBlank — Required if campaignType=SCHEDULE
   submittedOnDate NO LocalDate notNull if provided —
   stretchyReportId NO Long integerGreaterThanZero — Alternative report link
   stretchyReportParamMap NO String — — JSON param map
   emailAttachmentFileFormatId NO Integer — — 1=XLS, 2=PDF, 3=CSV
   locale / dateFormat NO String — —
5. Lookup APIs
   UI Field Endpoint Display Value Required
   SMS Providers GET /v1/smscampaigns/template → smsProviderOptions providerName id YES (SMS) / NO (Notification)
   Business Rules (SMS) GET /v1/smscampaigns/template → businessRulesOptions reportName reportId YES
   Campaign Types GET /v1/smscampaigns/template → campaignTypeOptions value id YES
   Trigger Types GET /v1/smscampaigns/template → triggerTypeOptions value id YES
   Frequency Types GET /v1/smscampaigns/template → frequencyTypeOptions value id Only for Schedule
   Week Days GET /v1/smscampaigns/template → weekDays value id Only for Weekly
   Months GET /v1/smscampaigns/template → months value id UI reference
   Email Business Rules GET /v1/email/campaign/template reportName reportId YES
   Email Attachment Formats Predefined: 1=XLS, 2=PDF, 3=CSV — — NO
6. API Call Order
   6.1 Create SMS Campaign
7. GET /v1/smscampaigns/template → Load providers, business rules, campaign types, trigger types, frequency types, week days
8. Select trigger type:

- SCHEDULE → Requires frequency, interval, repeatsOnDay (if weekly), recurrenceStartDate, dateTimeFormat
- DIRECT → No recurrence fields needed
- TRIGGERED → No paramValue needed

3. Select campaign type: SMS (needs providerId) vs NOTIFICATION (no providerId)
4. Select business rule (report) → determines paramValue structure
5. Compose message (max 480 chars)
6. Optional POST /v1/smscampaigns/preview to test message rendering
7. POST /v1/smscampaigns → Submit create
   6.2 Create Email Campaign
8. GET /v1/email/campaign/template → Load business rules (stretchy reports)
9. Select campaign type: DIRECT vs SCHEDULE vs TRIGGERED
10. Select business rule → determines paramValue
11. Compose subject (max 50) + message (max 480)
12. Optional POST /v1/email/campaign/preview to test
13. POST /v1/email/campaign → Submit create
    6.3 Activate Campaign
14. GET /v1/smscampaigns/{id} or GET /v1/email/campaign/{id} → Verify current status
15. POST /v1/smscampaigns/{id}?command=activate or email equivalent → Submit activation with {"activationDate": "2024-01-01", "locale": "en", "dateFormat": "yyyy-MM-dd"}
    6.4 View Campaign Messages

- GET /v1/sms/{campaignId}/messageByStatus?status=100 → View pending SMS for campaign
- GET /v1/email/pendingEmail → View pending emails
- GET /v1/email/messageByStatus?status=300&fromDate=...&toDate=... → Filter by status + date

7. Request Payload Analysis
   7.1 POST /v1/smscampaigns (Direct)
   {
   "campaignName": "Welcome SMS",
   "campaignType": 1,
   "triggerType": 1,
   "providerId": 1,
   "runReportId": 3,
   "message": "Welcome {{clientName}} to our bank!",
   "paramValue": "{\"officeId\":1}",
   "submittedOnDate": "2024-01-15",
   "locale": "en",
   "dateFormat": "yyyy-MM-dd"
   }
   7.2 POST /v1/smscampaigns (Schedule)
   {
   "campaignName": "Birthday Greetings",
   "campaignType": 1,
   "triggerType": 2,
   "providerId": 1,
   "runReportId": 5,
   "message": "Happy Birthday {{clientName}}!",
   "paramValue": "{\"officeId\":1}",
   "frequency": 3,
   "interval": "1",
   "repeatsOnDay": 1,
   "recurrenceStartDate": "2024-01-01 09:00:00",
   "dateTimeFormat": "yyyy-MM-dd HH:mm:ss",
   "locale": "en",
   "dateFormat": "yyyy-MM-dd"
   }
   7.3 POST /v1/email/campaign
   {
   "campaignName": "Monthly Statement",
   "campaignType": 2,
   "businessRuleId": 4,
   "paramValue": "{\"officeId\":1}",
   "emailSubject": "Your Monthly Statement",
   "emailMessage": "Dear {{clientName}}, please find attached your monthly statement.",
   "recurrence": "FREQ=MONTHLY;INTERVAL=1",
   "recurrenceStartDate": "2024-02-01",
   "emailAttachmentFileFormatId": 2,
   "locale": "en",
   "dateFormat": "yyyy-MM-dd"
   }
   7.4 Activate SMS Campaign
   {
   "activationDate": "2024-01-20",
   "locale": "en",
   "dateFormat": "yyyy-MM-dd"
   }
   7.5 Close Campaign
   {
   "closureDate": "2024-06-30",
   "locale": "en",
   "dateFormat": "yyyy-MM-dd"
   }
   7.6 Preview Campaign
   {
   "paramValue": "{\"officeId\":1}",
   "message": "Welcome {{clientName}}!"
   }
   Response:
   {
   "campaignMessage": "Welcome John Doe!",
   "totalNumberOfMessages": 150
   }
8. Validation Rules
   8.1 SMS Campaign Create (SmsCampaignValidator.validateCreate())

- campaignName → notBlank, max 100 chars
- campaignType → notNull, integerGreaterThanZero
- triggerType → notNull, integerGreaterThanZero
- If triggerType == SCHEDULE:
- frequency → notNull, integerGreaterThanZero
- interval → notBlank
- repeatsOnDay → notBlank (if frequency is WEEKLY)
- recurrenceStartDate → notBlank
- runReportId → notNull, integerGreaterThanZero
- message → notBlank, max 480 chars
- paramValue → notBlank (unless triggerType == TRIGGERED); each param inner value must be notBlank
- submittedOnDate → if provided, notNull
- isNotification → trueOrFalseRequired
- Unsupported parameters rejected (strict set in supportedParams)
  8.2 SMS Campaign Update (SmsCampaignValidator.validateForUpdate())
- Same field validations as create (all fields optional individually)
- campaignName → notBlank, max 100
- message → notBlank, max 480
- Business rule: campaign must be CLOSED to edit (SmsCampaignMustBeClosedToEditException)
  8.3 Email Campaign Create (EmailCampaignValidator.validateCreate())
- campaignName → notBlank, max 100
- campaignType → notNull, integerGreaterThanZero
- If campaignType == SCHEDULE:
- recurrence → notBlank
- recurrenceStartDate → notBlank
- businessRuleId → notNull, integerGreaterThanZero
- emailSubject → notBlank, max 50 chars
- emailMessage → notBlank, max 480 chars
- paramValue → notBlank
  8.4 Activation (validateActivation())
- activationDate → notNull
- Campaign must not already be active (error.msg.campaign.already.active)
- submittedOnDate cannot be in the future
- submittedOnDate cannot be after activationDate
- activationDate cannot be in the future
  8.5 Closure (validateClosure())
- closureDate → notNull
- Campaign must not already be closed (error.msg.campaign.already.closed)
- closureDate cannot be in the future
  8.6 Reactivation (validateReactivate())
- Campaign must be in CLOSED state (error.msg.campaign.must.be.closed)
- Same activation date validations as initial activation
  8.7 Delete
- Campaign must be in CLOSED state (SmsCampaignMustBeClosedToBeDeletedException)
  8.8 Preview (validatePreviewMessage())
- paramValue → notBlank, each inner value notBlank
- message → notBlank, max 480
  8.9 Business Rules (from entity)
- Campaign name uniqueness → campaign_name_UNIQUE constraint on sms_campaign table
- Recurrence construction → Uses FREQ=DAILY/WEEKLY/MONTHLY/YEARLY with optional INTERVAL and BYDAY

9. Business Flow
   9.1 Create SMS Campaign
   SmsCampaignApiResource
   ↓ POST /v1/smscampaigns
   ↓ CommandWrapperBuilder.createSmsCampaign().withJson(json)
   ↓ PortfolioCommandSourceWritePlatformService.logCommandSource()
   ↓ CreateSmsCampaignCommandHandler
   ↓ SmsCampaignWritePlatformServiceJpaImpl.create()
   ↓ SmsCampaignValidator.validateCreate()
   ↓ SmsCampaign.instance() (static factory)
   ↓ SmsCampaignRepository.save(SmsCampaign)
   ↓ Returns CommandProcessingResult
   9.2 Activate SMS Campaign
   SmsCampaignApiResource
   ↓ POST /v1/smscampaigns/{id}?command=activate
   ↓ CommandWrapperBuilder.activateSmsCampaign(id)
   ↓ ActivateSmsCampaignCommandHandler
   ↓ SmsCampaignWritePlatformServiceJpaImpl.activate()
   ↓ SmsCampaignValidator.validateActivation()
   ↓ SmsCampaign.activate() (entity method)
   ↓ - Checks if already active
   ↓ - Sets approvedOnDate, approvedBy, status=ACTIVE
   ↓ - validateActivationDate()
   ↓ SmsCampaignRepository.save(SmsCampaign)
   9.3 Preview SMS Campaign Message
   SmsCampaignApiResource
   ↓ POST /v1/smscampaigns/preview
   ↓ SmsCampaignWritePlatformService.previewMessage(query)
   ↓ SmsCampaignValidator.validatePreviewMessage()
   ↓ CampaignPreviewData (totalNumberOfMessages + campaignMessage)
   ↓ Returns to client
   9.4 SMS Campaign Batch Jobs (Background)
   UpdateSmsOutboundWithCampaignMessageTasklet
   ↓ Reads active SMS campaigns with reports
   ↓ Generates SmsMessage records via SmsMessageAssembler
   ↓ Saves to sms_messages_outbound table
   ↓
   SendMessageToSmsGatewayTasklet
   ↓ Reads PENDING sms_messages_outbound
   ↓ Sends via SmsConfigUtils (HTTP to SMS bridge)
   ↓ Updates status to SENT or FAILED
   ↓
   GetDeliveryReportsFromSmsGatewayTasklet
   ↓ Polls SMS gateway for delivery reports
   ↓ Updates sms_messages_outbound status to DELIVERED
10. Related Operations
    Category Endpoints
    Email Messages GET /v1/email, GET /v1/email/pendingEmail, GET /v1/email/sentEmail, GET /v1/email/messageByStatus, GET /v1/email/failedEmail, POST /v1/email, GET/PUT/DELETE /v1/email/{id}
    Email Config GET/PUT /v1/email/configuration
    SMS Messages GET /v1/sms/{campaignId}/messageByStatus, GET /v1/sms, POST /v1/sms, GET/PUT/DELETE /v1/sms/{id}
    External Services GET/PUT /v1/externalservice/SMS (SMS gateway config)
    Stretchy Reports GET /v1/reports (for business rule lookup)
    Stretchy Report Templates GET /v1/templates (for report param template)
11. Hidden Dependencies
    Feature Flags / Configurations
    These global configurations control campaign behavior:
    Config What It Controls
    amazon-s3 Required for S3 report export attachments
    report-export-s3-folder-name S3 folder for report exports
    Pre-Seeded Data

- SMS gateway connection must be configured via c_external_service_properties for service name SMS (or use GET/PUT /v1/externalservice/SMS)
- Email SMTP configuration via scheduled_email_configuration table or GET/PUT /v1/email/configuration
- Stretchy reports must exist in stretchy_report and stretchy_report_parameter tables for business rule selection
  Permissions
  API Resource Permission Code
  SMS Campaigns SMS_CAMPAIGN (READ, CREATE, UPDATE, DELETE, ACTIVATE, CLOSE, REACTIVATE)
  Email Campaigns EMAIL_CAMPAIGN (READ, CREATE, UPDATE, DELETE, ACTIVATE, CLOSE, REACTIVATE)
  Email Messages EMAIL
  SMS Messages SMS
  Scheduled Jobs (Required for Campaign Execution)
  These batch jobs MUST be registered and running:
  Job Purpose
  Update SMS Outbound with Campaign Message Generates SMS outbound records from active campaigns
  Update Email Outbound with campaign message Generates email outbound records from active campaigns
  Send Message to SMS Gateway Sends queued SMS messages to the SMS bridge
  Get Delivery Reports from SMS Gateway Polls SMS gateway for delivery status
  Execute Email Sends email messages via SMTP
  Critical Sequences / Caveats

1. Template first → Always load GET /v1/smscampaigns/template before creating SMS campaigns to get available providers, reports, enums
2. Report dependency → Campaigns require a stretchy_report (report ID) as their business rule — the report determines the target audience
3. ParamValue structure → Must match the report's parameters structure (e.g., {"officeId":1} or {"loanOfficerId":5})
4. State machine → Campaigns follow PENDING → ACTIVE → CLOSED lifecycle; edits only allowed in PENDING or CLOSED; deletions only in CLOSED
5. Message templating → Message supports {{paramName}} placeholders resolved from report data
6. Campaign name uniqueness → SMS campaign names must be unique (DB constraint campaign_name_UNIQUE)
7. Notification vs SMS → If isNotification=true, no providerId needed — messages target the in-app notification system, not SMS gateway
8. Implementation Checklist
   SMS Campaigns

- GET /v1/smscampaigns/template — load all dropdown options (providers, business rules, enums)
- POST /v1/smscampaigns — create campaign with all validation
- GET /v1/smscampaigns — paginated list with offset/limit/orderBy/sortOrder
- GET /v1/smscampaigns/{id} — single campaign detail with timeline
- PUT /v1/smscampaigns/{id} — update campaign (check closed state requirement)
- POST /v1/smscampaigns/{id}?command=activate — activate with activationDate
- POST /v1/smscampaigns/{id}?command=close — close with closureDate
- POST /v1/smscampaigns/{id}?command=reactivate — reactivate
- POST /v1/smscampaigns/preview — preview message with real client count
- DELETE /v1/smscampaigns/{id} — delete (only if closed)
  Email Campaigns
- GET /v1/email/campaign/template — load business rules
- GET /v1/email/campaign/template/{id} — single template detail
- POST /v1/email/campaign — create email campaign
- GET /v1/email/campaign — list all campaigns
- GET /v1/email/campaign/{id} — single campaign detail
- PUT /v1/email/campaign/{id} — update
- POST /v1/email/campaign/{id}?command=activate|close|reactivate — state transitions
- POST /v1/email/campaign/preview — preview
- DELETE /v1/email/campaign/{id} — delete
  Email Messages
- GET /v1/email — list all
- GET /v1/email/pendingEmail — pending
- GET /v1/email/sentEmail — sent
- GET /v1/email/messageByStatus?status=&fromDate=&toDate= — filter by status + date range
- GET /v1/email/failedEmail — failed
- POST /v1/email — create email message (for direct send)
- GET /v1/email/{id} — detail
- PUT /v1/email/{id} — update
- DELETE /v1/email/{id} — delete
  SMS Messages
- GET /v1/sms/{campaignId}/messageByStatus — campaign-specific messages by status
- GET /v1/sms — list all
- POST /v1/sms — create SMS message
- GET /v1/sms/{id} — detail
- PUT /v1/sms/{id} — update
- DELETE /v1/sms/{id} — delete
  Email Configuration
- GET /v1/email/configuration — read SMTP config
- PUT /v1/email/configuration — update SMTP settings (host, port, username, password, useTLS)
  Infrastructure Dependencies
- Ensure GET /v1/reports is available for business rule (stretchy report) lookup
- Ensure GET/PUT /v1/externalservice/SMS is available for SMS gateway configuration
- Verify all required batch jobs are enabled in the scheduler
- Verify maker-checker and enable-same-maker-checker global configs are accounted for
