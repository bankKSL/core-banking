Documents & Notes — Feature Analysis
Based on the methodology in docs/agent-implementing-to-frontend-document.md, here is the full analysis.

1. Feature Overview
   Aspect Documents Notes
   Business Purpose Attach files (e.g. ID scans, contracts) to entities Free-text annotations on entities
   Lifecycle Upload → Read → Update → Delete Create → Read → Update → Delete
   Main Java classes DocumentApiResource, Document (entity), DocumentReadPlatformServiceImpl, DocumentWritePlatformServiceImpl, DocumentRepository NotesApiResource, Note (entity), NoteReadPlatformServiceImpl, NoteWritePlatformServiceImpl, NoteRepository
   Related modules fineract-document (standalone JAR), fineract-provider fineract-core (DTOs/interfaces), fineract-provider (impl)
   Supported entity types:
   Entity Documents Notes
   clients ✅ ✅ (type CLIENT, value 100)
   loans ✅ ✅ (type LOAN, value 200)
   groups ✅ ✅ (type GROUP, value 600)
   savings ✅ ✅ (type SAVING_ACCOUNT, value 500)
   staff ✅ ❌
   client_identifiers ✅ ❌
   loanTransactions ❌ ✅ (type 300)
   savingsTransactions ❌ ✅ (type 800)
   accounts/share ❌ ✅ (type SHARE_ACCOUNT, value 700)
2. API Inventory
   Documents API — Base: /v1/{entityType}/{entityId}/documents
   Method URL Description Permission
   GET /v1/{entityType}/{entityId}/documents List all documents READ_DOCUMENT
   GET /v1/{entityType}/{entityId}/documents/{documentId} Get document metadata READ_DOCUMENT
   GET /v1/{entityType}/{entityId}/documents/{documentId}/attachment Download document file READ_DOCUMENT
   POST /v1/{entityType}/{entityId}/documents Upload document (multipart) CREATE_DOCUMENT
   PUT /v1/{entityType}/{entityId}/documents/{documentId} Update document (multipart) UPDATE_DOCUMENT
   DELETE /v1/{entityType}/{entityId}/documents/{documentId} Delete document DELETE_DOCUMENT
   Notes API — Base: /v1/{resourceType}/{resourceId}/notes
   Method URL Description Permission
   GET /v1/{resourceType}/{resourceId}/notes List notes (desc by createdOn) READ_NOTE
   GET /v1/{resourceType}/{resourceId}/notes/{noteId} Get single note READ_NOTE
   POST /v1/{resourceType}/{resourceId}/notes Add a note CREATE_NOTE
   PUT /v1/{resourceType}/{resourceId}/notes/{noteId} Update a note UPDATE_NOTE
   DELETE /v1/{resourceType}/{resourceId}/notes/{noteId} Delete a note DELETE_NOTE
3. CRUD Analysis
   Operation Documents Notes
   List ✅ GET .../documents ✅ GET .../notes
   Detail ✅ GET .../documents/{id} ✅ GET .../notes/{id}
   Create ✅ POST .../documents (multipart) ✅ POST .../notes (JSON)
   Update ✅ PUT .../documents/{id} (multipart) ✅ PUT .../notes/{id} (JSON)
   Delete ✅ DELETE .../documents/{id} ✅ DELETE .../notes/{id}
   Download ✅ GET .../documents/{id}/attachment N/A
   No missing operations — both features have full CRUD.
4. Create Workflow (Highest Priority)
   Documents — POST .../documents
   Field Required Type Validation Notes
   file ✅ File (binary) Content-Length > 0, stream non-null The actual file uploaded as multipart
   name ❌ string(250) Max 250 chars Display name; defaults to filename
   description ❌ string(250) Max 250 chars Optional description
   No lookup endpoints needed — only the file itself and optional metadata.
   Notes — POST .../notes
   Field Required Type Validation Notes
   note ✅ string Not null, max 1000 chars The note text content
   No lookup endpoints needed — only the note text.
5. Lookup APIs
   Neither Documents nor Notes require lookup APIs. They are simple features with:

- Documents: upload file + optional name/description
- Notes: free-text input only

6. API Call Order
   Create Document
1. Render upload form
1. User selects file
1. POST .../documents (multipart: file, name?, description?)
   Create Note
1. Render note form
1. User types note text
1. POST .../notes (JSON: {"note": "..."})
   No pre-fetch dependencies.
1. Request Payload Analysis
   Document Create — multipart/form-data
   Field Type Required Validation Source
   file File ✅ Content-Length>0, InputStream non-null User file picker
   name String ❌ Max 250 User input
   description String ❌ Max 250 User input
   Note Create — application/json
   Field Type Required Validation Source
   note String ✅ Not null, max 1000 chars User text input
1. Validation Rules
   Source Rule Applies to
   FileUploadValidator Content-Length > 0 Documents
   FileUploadValidator InputStream must not be null Documents
   FileUploadValidator FormDataContentDisposition must not be null Documents
   FileUploadValidator FormDataBodyPart must not be null Documents
   ClientNoteCommand (legacy) Note must not be blank, max 1000 chars Client notes
   NoteCreateRequest (@NotNull, @Size(max=1000)) Note not null, max 1000 chars All notes
   DocumentCreateRequest (@Size(max=250)) Name/description max 250 chars Documents
   DocumentRepository query Document must belong to parent entity Documents on read/update/delete
   NoteWritePlatformServiceImpl.getNote() Note must exist for the given resource+type Notes on update/delete
1. Business Flow
   Document flow:
   DocumentApiResource (REST)
   ↓ DocumentCreateCommand
   ↓ CommandDispatcher
   ↓ DocumentCreateCommandHandler
   ↓ DocumentWritePlatformServiceImpl
   ├── FileUploadValidator.validate()
   ├── ContentStoreService.save() ← stores binary
   ├── DocumentRepository.save() ← stores metadata (JdbcAggregateTemplate)
   └── eventPublisher.publish(DocumentCreatedBusinessEvent)
   ↓
   m_document table
   Content store (filesystem/S3/etc.)
   Note flow:
   NotesApiResource (REST)
   ↓ NoteCreateCommand
   ↓ CommandDispatcher
   ↓ NoteCreateCommandHandler
   ↓ NoteWritePlatformServiceImpl
   ├── validates note text (not null, ≤1000)
   ├── finds parent entity (Client/Loan/etc.)
   ├── creates Note entity via factory (e.g. clientNote())
   └── NoteRepository.save()
   ↓
   m_note table
1. Related Operations
   Feature Related APIs
   Documents GET /v1/{entityType}/{entityId}/documents/{id}/attachment (download)
   Notes None (text-only)
   Both The parent entity must support the entity type (see entity-type table above)
1. Hidden Dependencies
   Dependency Impact if missing Feature
   ContentStoreService bean Document upload fails (no storage backend) Documents
   Parent entity must exist Create/read/update/delete returns 404 Both
   Parent entity type must be in supported list Returns 404 or unsupported error Both
   NoteResourceNotSupportedException Thrown for unsupported resourceType URL Notes
   File size limits (application-level) Not enforced in Fineract — rely on servlet container Documents
   storage_type_enum Must be valid (0=filesystem, 1=s3, etc.) Documents
   Multipart config in Spring File upload fails without multipartResolver Documents
1. Implementation Checklist

- Document — List: GET /v1/{entityType}/{entityId}/documents
- Document — Detail: GET /v1/{entityType}/{entityId}/documents/{documentId}
- Document — Download: GET /v1/{entityType}/{entityId}/documents/{documentId}/attachment
- Document — Create: POST /v1/{entityType}/{entityId}/documents (multipart with file, name?, description?)
- Document — Update: PUT /v1/{entityType}/{entityId}/documents/{documentId} (multipart)
- Document — Delete: DELETE /v1/{entityType}/{entityId}/documents/{documentId}
- Note — List: GET /v1/{resourceType}/{resourceId}/notes
- Note — Detail: GET /v1/{resourceType}/{resourceId}/notes/{noteId}
- Note — Create: POST /v1/{resourceType}/{resourceId}/notes ({"note": "..."})
- Note — Update: PUT /v1/{resourceType}/{resourceId}/notes/{noteId} ({"note": "..."})
- Note — Delete: DELETE /v1/{resourceType}/{resourceId}/notes/{noteId}
- UI — Document upload: File picker + optional name/description fields
- UI — Note input: Text area with 1000-char counter
- UI — Entity type routing: Parse entityType/resourceType from URL or parent context
- Error handling: Handle 404 (not found), 400 (validation), unsupported entity types
