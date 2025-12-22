# Lộc Xanh CRM - Functions & Workflows

**Complete Business Logic & Technical Workflows**
**Last Updated**: December 22, 2025
**Version**: 1.0

---

## 📋 Table of Contents

1. [Core Business Functions](#core-business-functions)
2. [User Workflows](#user-workflows)
3. [Technical Workflows](#technical-workflows)
4. [Data Flow Patterns](#data-flow-patterns)
5. [Integration Workflows](#integration-workflows)
6. [Error Handling Workflows](#error-handling-workflows)
7. [Performance Optimization Workflows](#performance-optimization-workflows)

---

## 🎯 Core Business Functions

### 1. Customer Management Function

**Purpose**: Manage customer lifecycle from lead to terminated

**Key Operations**:
```typescript
// CRUD Operations
createCustomer(data: CustomerInput) → Customer
getCustomer(id: string) → Customer | null
updateCustomer(id: string, data: CustomerInput) → Customer
deleteCustomer(id: string) → void

// Search Operations
searchCustomers(query: string) → Customer[]
fuzzySearchCustomers(query: string) → Customer[]  // Vietnamese trigram search
filterCustomers(filters: CustomerFilters) → Customer[]

// Bulk Operations
bulkUpdateCustomerStatus(ids: string[], status: CustomerStatus) → number
exportCustomers(format: 'csv' | 'excel') → Blob
```

**Vietnamese-Specific Features**:
- **Fuzzy Search**: `pg_trgm` + `unaccent` for Vietnamese name matching
- **Normalization**: Store both original and normalized names
- **Address Parsing**: District/Ward/City hierarchy
- **Phone Validation**: Vietnamese format (0XX XXX XXXX)

**Customer Status Flow**:
```
LEAD → ACTIVE → INACTIVE → TERMINATED
   ↓        ↓          ↓
   └─ Can reactivate anytime
```

**Customer Tier Rules**:
- **STANDARD**: Basic pricing, standard support
- **PREMIUM**: 10% discount, priority scheduling
- **VIP**: 15% discount, dedicated account manager

---

### 2. Contract Management Function

**Purpose**: Full lifecycle management of rental contracts

**Key Operations**:
```typescript
// Lifecycle Management
createContract(data: ContractInput) → Contract
sendContract(id: string) → Contract  // DRAFT → SENT
negotiateContract(id: string) → Contract  // SENT → NEGOTIATING
signContract(id: string, signature: File) → Contract  // NEGOTIATING → SIGNED
activateContract(id: string) → Contract  // SIGNED → ACTIVE
expireContract(id: string) → Contract  // ACTIVE → EXPIRED
terminateContract(id: string, reason: string) → Contract  // → TERMINATED

// Calculations
calculateContractTotal(items: ContractItem[]) → {
  subtotal: Decimal,
  discount: Decimal,
  vat: Decimal,
  total: Decimal
}

// Renewal
autoRenewContract(id: string) → Contract  // Creates new contract from old
sendRenewalReminder(id: string) → void  // 30 days before expiry
```

**Contract Status Flow**:
```
DRAFT → SENT → NEGOTIATING → SIGNED → ACTIVE → EXPIRED/TERMINATED
   ↓                                                      ↑
   └─────────────────── Can cancel anytime ──────────────┘
```

**Financial Calculations**:
```typescript
// Contract total calculation
subtotal = sum(contractItems.map(item => item.price * item.quantity))
discount = subtotal * (discountPercent / 100)
vat = (subtotal - discount) * (vatRate / 100)  // Default 10%
total = subtotal - discount + vat

// Monthly fee calculation (for invoices)
monthlyFee = total / contractDurationMonths
```

**Contract Number Format**: `HĐ-YYYY-NNN` (e.g., `HĐ-2025-001`)

---

### 3. Invoicing & Payment Function

**Purpose**: Generate invoices, track payments, manage outstanding amounts

**Key Operations**:
```typescript
// Invoice Generation
createInvoiceFromContract(contractId: string) → Invoice
generateInvoicePDF(invoiceId: string) → Blob
sendInvoice(invoiceId: string) → Invoice  // DRAFT → SENT

// Payment Recording
recordPayment(data: PaymentInput) → Payment
applyPaymentToInvoice(invoiceId: string, paymentId: string) → Invoice
recordPartialPayment(invoiceId: string, amount: Decimal) → Invoice

// Status Management
markAsPaid(invoiceId: string) → Invoice  // → PAID
markAsOverdue(invoiceId: string) → Invoice  // → OVERDUE
cancelInvoice(invoiceId: string) → Invoice  // → CANCELLED
refundInvoice(invoiceId: string, reason: string) → Invoice  // → REFUNDED

// Calculations
calculateOutstanding(invoiceId: string) → Decimal
calculateAging(invoiceId: string) → {
  current: Decimal,
  days1_30: Decimal,
  days31_60: Decimal,
  days61_90: Decimal,
  over90: Decimal
}
```

**Invoice Status Flow**:
```
DRAFT → SENT → PARTIAL → PAID → OVERDUE → CANCELLED/REFUNDED
   ↓         ↓          ↓
   └─ Can be cancelled anytime
```

**Payment Methods**:
- **BANK_TRANSFER**: Chuyển khoản ngân hàng
- **CASH**: Tiền mặt
- **CARD**: Thẻ tín dụng/ghi nợ
- **MOMO**: Ví MoMo
- **ZALOPAY**: Ví ZaloPay
- **VNPAY**: Ví VNPay

**Invoice Number Format**: `INV-YYYY-NNN` (e.g., `INV-2025-001`)

**Due Date Calculation**:
```typescript
dueDate = invoiceDate + paymentTermDays  // Default 30 days
```

---

### 4. Care Scheduling Function

**Purpose**: Schedule and track plant care visits

**Key Operations**:
```typescript
// Schedule Generation
generateDailySchedule(date: Date, staffId?: string) → CareSchedule[]
generateWeeklySchedule(weekStart: Date) → CareSchedule[]

// Visit Management
createVisit(data: VisitInput) → CareSchedule
startVisit(id: string, gps: {lat: number, lng: number}) → CareSchedule
completeVisit(id: string, data: VisitCompletion) → CareSchedule
cancelVisit(id: string, reason: string) → CareSchedule

// GPS & Location
recordCheckIn(id: string, gps: {lat: number, lng: number}) → void
recordCheckOut(id: string, gps: {lat: number, lng: number}) → void
verifyLocation(gps: {lat: number, lng: number}, customerId: string) → boolean

// Documentation
uploadVisitPhoto(visitId: string, photo: File, type: 'before' | 'after') → string
recordFeedback(visitId: string, rating: number, comment: string) → void
```

**Visit Status Flow**:
```
SCHEDULED → IN_PROGRESS → COMPLETED
   ↓              ↓
   └─ Can be cancelled anytime
```

**Care Frequency Options**:
- **WEEKLY**: Every week
- **BI_WEEKLY**: Every 2 weeks
- **MONTHLY**: Every month

**Time Slots**:
- **MORNING**: 08:00 - 10:00
- **MIDDAY**: 10:00 - 12:00
- **AFTERNOON**: 14:00 - 16:00
- **EVENING**: 16:00 - 18:00

**Route Optimization**:
```typescript
// Group by district
// Sort by proximity within district
// Calculate travel time between stops
// Optimize for minimal total travel time
```

---

### 5. Plant Exchange Function

**Purpose**: Manage plant replacement requests

**Key Operations**:
```typescript
// Exchange Request
createExchangeRequest(data: ExchangeInput) → Exchange
calculatePriorityScore(request: ExchangeRequest) → number  // 1-10

// Daily Routes
generateExchangeRoutes(date: Date) → Exchange[]
groupExchangesByLocation(exchanges: Exchange[]) → {[district: string]: Exchange[]}

// Execution
startExchange(id: string, gps: {lat: number, lng: number}) → Exchange
completeExchange(id: string, data: ExchangeCompletion) → Exchange
cancelExchange(id: string, reason: string) → Exchange

// Verification
recordCustomerSignature(exchangeId: string, signature: File) → void
recordBeforeAfterPhotos(exchangeId: string, before: File, after: File) → void
```

**Exchange Status Flow**:
```
PENDING → SCHEDULED → IN_PROGRESS → COMPLETED
   ↓           ↓            ↓
   └─ Can be cancelled anytime
```

**Priority Scoring**:
```typescript
score = baseScore + urgencyBonus + conditionPenalty

// Base scores
URGENT: 9-10 (Same day/next day)
HIGH: 7-8 (Within 3 days)
MEDIUM: 4-6 (Within week)
LOW: 1-3 (Flexible)

// Urgency bonus
customerCalled: +2
urgentNote: +1

// Condition penalty
poor_condition: +2
dead_plant: +3
```

**Exchange Data Structure**:
```typescript
{
  plantsData: [
    { action: "remove", plantType: "Kim Tiền", qty: 3, condition: "poor" },
    { action: "install", plantType: "Phát Tài", qty: 3, potType: "composite" }
  ],
  notes: "Replace dead plants, customer requested larger pots"
}
```

---

### 6. Monthly Statements (Bảng Kê) Function

**Purpose**: Generate monthly billing statements

**Key Operations**:
```typescript
// Statement Generation
generateMonthlyStatement(customerId: string, month: Date) → MonthlyStatement
copyFromPreviousMonth(customerId: string, month: Date) → MonthlyStatement
autoGenerateAllStatements(month: Date) → MonthlyStatement[]

// Plant Listing
getCustomerPlants(customerId: string, month: Date) → Plant[]
calculateMonthlyFees(plants: Plant[]) → {
  plantFees: Decimal,
  serviceFee: Decimal,
  total: Decimal
}

// Confirmation Workflow
sendStatementToCustomer(statementId: string) → void
recordCustomerConfirmation(statementId: string, confirmed: boolean) → void
finalizeStatement(statementId: string) → void

// Export
exportStatementToExcel(statementId: string) → Blob
exportStatementToPDF(statementId: string) → Blob
```

**Billing Cycle**: 24th → 23rd of following month

**Statement Status Flow**:
```
DRAFT → SENT → CONFIRMED → FINALIZED
   ↓        ↓
   └─ Can be edited until finalized
```

**VAT Rate**: 8% (different from contract VAT of 10%)

---

### 7. Analytics & Reporting Function

**Purpose**: Generate business insights and reports

**Key Operations**:
```typescript
// Revenue Analytics
getRevenueOverview(month?: Date) → {
  recurringRevenue: Decimal,
  totalRevenue: Decimal,
  growthRate: number,
  monthlyBreakdown: MonthlyRevenue[]
}

// Customer Analytics
getCustomerStats() → {
  total: number,
  active: number,
  newThisMonth: number,
  churnRate: number,
  lifetimeValue: Decimal
}

// Invoice Analytics
getInvoiceAging() → {
  current: Decimal,
  overdue1_30: Decimal,
  overdue31_60: Decimal,
  overdue61_90: Decimal,
  over90: Decimal,
  collectionRate: number
}

// Contract Analytics
getContractStats() → {
  total: number,
  active: number,
  expiringSoon: number,
  renewalRate: number,
  avgDuration: number
}

// Top Customers
getTopCustomers(limit: number) → CustomerWithRevenue[]
```

**Performance Optimization**:
- **Raw SQL**: Single query vs 5 separate queries
- **Caching**: Redis-ready architecture
- **Dynamic Imports**: Code splitting for heavy charts

---

### 8. AI-Powered Notes Function

**Purpose**: Analyze sticky notes with AI

**Key Operations**:
```typescript
// Note Analysis
analyzeNote(content: string) → AIAnalysis
extractEntities(content: string) → Entity[]
classifyIntent(content: string) → Intent
analyzeSentiment(content: string) → Sentiment
suggestPriority(content: string) → {priority: number, reasoning: string}

// Integration Points
autoAnalyzeOnCreate(note: StickyNote) → void
suggestActions(note: StickyNote) → string[]
linkToEntity(note: StickyNote, entityId: string, entityType: string) → void

// Batch Processing
processUnanalyzedNotes() → number
reanalyzeAllNotes() → number
```

**AI Analysis Output**:
```typescript
{
  entities: ["Customer ABC", "15/12/2025", "5.000.000 ₫"],
  intent: "URGENT_COMPLAINT",
  sentiment: "NEGATIVE",
  priority: 9,
  suggestions: [
    "Gọi khách hàng ngay",
    "Lập yêu cầu đổi cây",
    "Kiểm tra hợp đồng"
  ],
  processedAt: "2025-12-22T14:30:00Z"
}
```

---

## 👥 User Workflows

### 1. Customer Onboarding Workflow

**Role**: Sales Staff / Manager

```
1. Lead Capture
   ├─ Receive inquiry (phone/email)
   ├─ Create customer record (LEAD status)
   ├─ Geocode address
   └─ Assign to sales rep

2. Site Survey
   ├─ Schedule site visit
   ├─ Record plant requirements
   ├─ Take photos
   └─ Update customer preferences

3. Qu


  ─










































 to











 Create







 customer
 status

      create
 Contract contract

0 customer


 Contract


 customer







>



































 →



.



 Contract

 |  +
  + (
 customer

 customer









.2
 (


 customer

 .









 to
,

 (





 .

 +
.


.




 � →4. Quotation
   ├─ Generate quotation PDF
   ├─ Send to customer
   ├─ Track negotiation
   └─ Update status

5. Contract Signing
   ├─ Convert quotation to contract
   ├─ Send contract (DRAFT → SENT)
   ├─ Customer signs (NEGOTIATING → SIGNED)
   └─ Activate contract (SIGNED → ACTIVE)

6. Installation
   ├─ Schedule installation visit
   ├─ Record installation details
   ├─ Upload photos
   └─ Complete installation

7. Billing Setup
   ├─ Generate first invoice
   ├─ Set up payment terms
   └─ Send invoice
```

**Success Metrics**:
- Time from lead to contract: < 7 days
- Conversion rate: > 60%
- Customer satisfaction: > 4.5/5

---

### 2. Care Operations Workflow

**Role**: Care Staff / Operations Manager

```
1. Schedule Generation (Daily)
   ├─ System generates daily schedule (6:00 AM)
   ├─ Group by location (district)
   ├─ Optimize route order
   └─ Send to staff mobile app

2. Pre-Visit Preparation
   ├─ Review customer preferences
   ├─ Check plant history
   ├─ Prepare equipment
   └─ Confirm appointment

3. On-Site Visit
   ├─ GPS check-in (system verifies location)
   ├─ Take before photos
   ├─ Perform care work
   ├─ Take after photos
   ├─ Record issues found
   └─ GPS check-out

4. Customer Interaction
   ├─ Get customer feedback
   ├─ Record satisfaction rating
   ├─ Note special requests
   └─ Get signature confirmation

5. Post-Visit
   ├─ Upload photos to system
   ├─ Update plant status
   ├─ Flag issues for exchange
   ├─ Log time spent
   └─ Complete visit

6. Issue Escalation
   ├─ Create sticky note for issues
   ├─ AI analyzes priority
   ├─ Generate exchange request
   └─ Notify operations manager
```

**Success Metrics**:
- Visit completion rate: 100%
- On-time arrival: > 90%
- Customer satisfaction: > 4.5/5
- Issue resolution: < 48 hours

---

### 3. Invoicing & Collections Workflow

**Role**: Accountant / Finance Manager

```
1. Invoice Generation (Monthly)
   ├─ System auto-generates on 24th
   ├─ Calculate fees (plants + service)
   ├─ Apply VAT (8% for statements)
   ├─ Generate PDF with Vietnamese fonts
   └─ Send to customer

2. Payment Tracking
   ├─ Record incoming payments
   ├─ Match to invoices
   ├─ Update outstanding amounts
   └─ Send payment confirmations

3. Collections Process
   ├─ 7 days before due: Gentle reminder
   ├─ On due date: Formal notice
   ├─ 7 days overdue: Phone call
   ├─ 30 days overdue: Escalation letter
   ├─ 60 days overdue: Site visit
   └─ 90+ days: Legal action

4. Payment Recording
   ├─ Multiple payment methods supported
   ├─ Partial payments tracked
   ├─ Payment history maintained
   └─ Receipt generation

5. Reconciliation
   ├─ Bank statement matching
   ├─ Outstanding report
   ├─ Aging analysis
   └─ Bad debt provision

6. Reporting
   ├─ Monthly revenue report
   ├─ Collection rate analysis
   ├─ Customer debt summary
   └─ Executive dashboard
```

**Success Metrics**:
- Collection rate: > 95%
- Days sales outstanding: < 45 days
- Overdue rate: < 5%
- Invoice accuracy: 100%

---

### 4. Exchange Management Workflow

**Role**: Operations Manager / Exchange Specialist

```
1. Request Intake
   ├─ Customer calls/emails
   ├─ Create exchange request
   ├─ Record issue details
   ├─ Upload photos
   └─ AI calculates priority

2. Priority Assessment
   ├─ Review AI suggestion
   ├─ Adjust priority if needed
   ├─ Assign urgency level
   └─ Schedule based on priority

3. Route Planning
   ├─ Group exchanges by date
   ├─ Optimize by location
   ├─ Assign to staff
   └─ Generate daily routes

4. Execution
   ├─ Staff receives notification
   ├─ Review exchange details
   ├─ Remove old plants
   ├─ Install new plants
   ├─ Record before/after
   ├─ Get customer signature
   └─ Complete exchange

5. Verification & Follow-up
   ├─ Manager reviews completion
   ├─ Customer satisfaction survey
   ├─ Update inventory
   ├─ Generate invoice if needed
   └─ Close request
```

**Priority Levels**:
- **URGENT** (9-10): Same day/next day
- **HIGH** (7-8): Within 3 days
- **MEDIUM** (4-6): Within week
- **LOW** (1-3): Flexible scheduling

---

### 5. Monthly Statement (Bảng Kê) Workflow

**Role**: Accountant / Customer Service

```
1. Statement Generation (24th of month)
   ├─ System auto-generates all statements
   ├─ List all plants with quantities
   ├─ Calculate monthly fees
   ├─ Apply 8% VAT
   ├─ Copy from previous month with rollover
   └─ Save as DRAFT

2. Customer Review
   ├─ Send statement to customer
   ├─ Customer reviews online portal
   ├─ Customer confirms or disputes
   └─ Record confirmation status

3. Dispute Resolution
   ├─ Review disputed items
   ├─ Verify against contract
   ├─ Adjust if needed
   ├─ Resend corrected statement
   └─ Get new confirmation

4. Finalization
   ├─ Lock confirmed statements
   ├─ Generate PDF/Excel
   ├─ Send to customer
   └─ Create invoice from statement

5. Payment Integration
   ├─ Link to payment system
   ├─ Track payment status
   ├─ Send reminders
   └─ Update statement status
```

**Billing Cycle**: 24th → 23rd of following month
**VAT Rate**: 8% (different from contract 10%)

---

## ⚙️ Technical Workflows

### 1. Authentication & Authorization Workflow

```
1. Login
   ├─ User clicks "Login"
   ├─ Choose method: Google OAuth or Credentials
   ├─ Redirect to provider
   ├─ Provider returns token
   └─ NextAuth validates token

2. Session Creation
   ├─ Generate JWT token
   ├─ Extract user info
   ├─ Fetch user role from DB
   ├─ Store in session cookie
   └─ Return session to client

3. Role-Based Access Check
   ├─ User accesses protected route
   ├─ Middleware checks session
   ├─ Verify user role
   ├─ Check permission matrix
   └─ Allow/Deny access

4. Permission Enforcement
   ├─ Server Action: requireAuth()
   ├─ Server Action: requireRole(requiredRole)
   ├─ UI: Conditional rendering based on role
   └─ API: Role-based endpoint protection

5. Session Management
   ├─ Token refresh on activity
   ├─ Auto-logout after inactivity
   ├─ Session expiration handling
   └─ Graceful degradation
```

**RBAC Matrix**:
| Role | Customer | Contract | Invoice | Care | Exchange | Analytics | Admin |
|------|----------|----------|---------|------|----------|-----------|-------|
| **ADMIN** | Full | Full | Full | Full | Full | Full | Full |
| **MANAGER** | Full | Full | Full | Full | Full | Full | Read |
| **STAFF** | Create/Read | Create/Read | Read | Full | Full | Read | No |
| **ACCOUNTANT** | Read | Read | Full | Read | Read | Read | No |
| **VIEWER** | Read | Read | Read | Read | Read | Read | No |

---

### 2. Data Validation & Error Handling Workflow

```
1. Input Validation (Client-Side)
   ├─ React Hook Form captures input
   ├─ Zod schema validates
   ├─ Real-time error display
   ├─ Vietnamese error messages
   └─ Prevent invalid submission

2. Server-Side Validation
   ├─ Server Action receives data
   ├─ Zod schema re-validates
   ├─ Business rule checks
   ├─ Duplicate detection
   └─ Format normalization

3. Database Constraints
   ├─ Unique constraints (codes, numbers)
   ├─ Foreign key constraints
   ├─ Check constraints
   └─ Not null constraints

4. Error Categorization
   ├─ ValidationError: 400 (Bad Request)
   ├─ ConflictError: 409 (Duplicate)
   ├─ NotFoundError: 404 (Not Found)
   ├─ ForbiddenError: 403 (No Permission)
   └─ ServerError: 500 (Internal)

5. Error Response
   ├─ Structured error object
   ├─ Vietnamese user message
   ├─ Detailed developer log
   ├─ Suggested fix (if applicable)
   └─ Toast notification to user

6. Recovery
   ├─ Form retains data
   ├─ Retry mechanism
   ├─ Rollback on failure
   └─ Activity log entry
```

**Error Message Examples**:
```typescript
{
  userMessage: "Khách hàng đã tồn tại",
  developerMessage: "Duplicate customer: companyNameNorm='cong ty abc'",
  field: "companyName",
  suggestion: "Try searching for existing customer or use different name"
}
```

---

### 3. Database Transaction Workflow

```
1. Transaction Start
   ├─ Begin database transaction
   ├─ Set isolation level
   ├─ Prepare operation chain

2. Operation Chain
   ├─ Operation 1: Validate input
   ├─ Operation 2: Check constraints
   ├─ Operation 3: Insert primary record
   ├─ Operation 4: Insert related records
   ├─ Operation 5: Update aggregates
   ├─ Operation 6: Create audit log
   └─ Operation 7: Invalidate cache

3. Success Path
   ├─ Commit transaction
   ├─ Return success response
   ├─ Send notifications (if needed)
   └─ Log success

4. Failure Path
   ├─ Rollback transaction
   ├─ Return error response
   ├─ Log failure details
   └─ Alert admin (if critical)

5. Idempotency
   ├─ Check operation already done
   ├─ Safe to retry
   ├─ No duplicate data
   └─ Consistent state
```

**Example: Create Customer with Geocoding**
```typescript
await prisma.$transaction(async (tx) => {
  // 1. Check duplicate
  const existing = await tx.customer.findFirst({...});
  if (existing) throw new ConflictError(...);

  // 2. Geocode address
  const geo = await geocodeAddress(input.address);

  // 3. Create customer
  const customer = await tx.customer.create({
    data: { ...input, ...geo }
  });

  // 4. Create activity log
  await tx.activityLog.create({
    data: { userId, action: "CREATE", ... }
  });

  // 5. All operations successful - commit
  return customer;
});
```

---

### 4. Cache Invalidation Workflow

```
1. Cache Layers
   ├─ Layer 1: Request-level memory cache
   ├─ Layer 2: Redis (cross-request)
   ├─ Layer 3: Next.js data cache
   └─ Layer 4: CDN (for static assets)

2. Write Operations
   ├─ Perform database operation
   ├─ Identify affected cache keys
   ├─ Invalidate Layer 1 (memory)
   ├─ Invalidate Layer 2 (Redis)
   ├─ Revalidate Next.js paths
   └─ Clear CDN if needed

3. Cache Key Strategy
   ├─ Single resource: "customer:{id}"
   ├─ List: "customers:page:{page}:search:{query}"
   ├─ Stats: "stats:customer"
   ├─ Aggregates: "analytics:revenue:{month}"
   └─ User-specific: "user:{userId}:notifications"

4. Invalidation Triggers
   ├─ Create: Clear list caches, clear stats
   ├─ Update: Clear detail cache, clear related
   ├─ Delete: Clear detail, lists, related
   └─ Bulk: Clear all affected patterns

5. Revalidation
   ├─ Background re-fetch
   ├─ Stale-while-revalidate
   ├─ Progressive updates
   └─ User feedback (toasts)
```

**Example: Customer Update**
```typescript
export const updateCustomer = createAction(schema, async (input) => {
  // 1. Update database
  const customer = await prisma.customer.update({...});

  // 2. Invalidate caches
  revalidatePath("/customers");  // List view
  revalidatePath(`/customers/${customer.id}`);  // Detail view
  revalidatePath("/dashboard");  // Stats

  // 3. Clear Redis if configured
  if (redis) {
    await redis.del("customer:*");
    await redis.del("stats:*");
  }

  return customer;
});
```

---

### 5. File Upload Workflow

```
1. Upload Request
   ├─ User selects file
   ├─ Client validates file type/size
   ├─ Request presigned URL from server

2. Presigned URL Generation
   ├─ Server Action validates request
   ├─ Generate unique key (timestamp + uuid)
   ├─ Create S3 presigned URL (expires in 15 min)
   ├─ Store metadata in database
   └─ Return URL to client

3. Direct Upload to S3
   ├─ Client uploads file directly to S3
   ├─ No server bandwidth used
   ├─ Progress tracking
   └─ Success/failure callback

4. Post-Upload Processing
   ├─ Verify upload success
   ├─ Update file metadata (status: UPLOADED)
   ├─ Link to entity (contract, invoice, etc.)
   ├─ Generate thumbnail (if image)
   └─ Trigger any processing (PDF generation)

5. Access Control
   ├─ Generate presigned download URL
   ├─ Set expiration time
   ├─ Track access in audit log
   └─ Cleanup expired files

6. Cleanup
   ├─ Scheduled job removes old temp files
   ├─ Orphaned file detection
   ├─ Storage usage monitoring
   └─ Cost optimization
```

**Supported File Types**:
- **Documents**: PDF, DOCX, XLSX
- **Images**: JPG, PNG (max 5MB)
- **Signatures**: PNG (max 1MB)

---

## 🔗 Integration Workflows

### 1. Google Maps Integration Workflow

```
1. Geocoding (Address → Coordinates)
   ├─ Input: "123 Đường Lê Lợi, Q1, HCM"
   ├─ Call Google Maps Geocoding API
   ├─ Parse response
   ├─ Extract: lat, lng, formatted_address, place_id
   ├─ Store in customer record
   └─ Display on map

2. Distance Calculation
   ├─ Input: Origin + Destination coordinates
   ├─ Call Distance Matrix API
   ├─ Extract: distance (meters), duration (seconds)
   ├─ Calculate travel time
   └─ Optimize route order

3. Route Optimization
   ├─ Input: List of customer locations
   ├─ Group by district
   ├─ Sort by proximity within group
   ├─ Calculate total travel time
   └─ Generate optimal route

4. Error Handling
   ├─ API quota exceeded → Use cached results
   ├─ Invalid address → Prompt user to correct
   ├─ No results → Manual coordinate entry
   └─ API error → Log and continue
```

**API Calls**:
```typescript
// Geocoding
const response = await mapsClient.geocode({
  params: {
    address: `${address}, Hồ Chí Minh, Việt Nam`,
    key: process.env.GOOGLE_MAPS_API_KEY,
  }
});

// Distance Matrix
const response = await mapsClient.distancematrix({
  params: {
    origins: [`${lat},${lng}`],
    destinations: [...],
    key: process.env.GOOGLE_MAPS_API_KEY,
    mode: "driving",
  }
});
```

---

### 2. MinIO/S3 Storage Integration Workflow

```
1. Configuration
   ├─ S3Client with endpoint (MinIO) or AWS
   ├─ Credentials from environment
   ├─ Force path style for MinIO
   └─ Bucket policy configured

2. Upload Flow
   ├─ Client requests upload
   ├─ Server generates presigned URL
   ├─ Client uploads directly to S3
   ├─ Server verifies upload
   └─ Store metadata in DB

3. Download Flow
   ├─ Request file access
   ├─ Verify permissions
   ├─ Generate presigned URL (expires in 1 hour)
   ├─ Client downloads from S3
   └─ Log access

4. File Management
   ├─ List files by entity
   ├─ Delete files
   ├─ Update metadata
   └─ Cleanup orphaned files

5. Monitoring
   ├─ Storage usage tracking
   ├─ Upload success rate
   ├─ Access patterns
   └─ Cost optimization
```

**Bucket Structure**:
```
locxanh/
├── uploads/
│   ├── contracts/          # Contract PDFs
│   ├── invoices/           # Invoice PDFs
│   ├── care/               # Visit photos
│   ├── exchanges/          # Exchange photos
│   └── signatures/         # Customer signatures
└── temp/                   # Temporary uploads
```

---

### 3. AI (Gemini) Integration Workflow

```
1. Trigger
   ├─ Sticky note created
   ├─ Exchange request submitted
   ├─ Care report with issues
   └─ Manual analysis request

2. Prompt Construction
   ├─ Extract content
   ├─ Add context (customer info, history)
   ├─ Format prompt with instructions
   └─ Send to Gemini API

3. Response Processing
   ├─ Parse JSON response
   ├─ Validate structure
   ├─ Extract entities
   ├─ Classify intent
   ├─ Analyze sentiment
   └─ Suggest priority

4. Storage
   ├─ Store AI analysis in record
   ├─ Timestamp processing
   ├─ Link suggestions to actions
   └─ Track AI confidence

5. User Display
   ├─ Show AI suggestions
   ├─ Allow manual override
   ├─ Track user acceptance
   └─ Learn from feedback

6. Error Handling
   ├─ API timeout → Retry once
   ├─ Invalid response → Log and skip
   ├─ API error → Mark as pending
   └─ Rate limit → Queue for later
```

**Prompt Template**:
```
Analyze this customer note in Vietnamese:

Note: "{content}"

Provide JSON response with:
1. entities: array of extracted entities
2. intent: COMPLAINT/REQUEST/FEEDBACK/URGENT
3. sentiment: POSITIVE/NEUTRAL/NEGATIVE
4. priority: 1-10
5. suggestions: array of recommended actions
```

---

### 4. Email/SMS Integration (Future)

```
1. Invoice Delivery
   ├─ Generate invoice PDF
   ├─ Compose email
   ├─ Attach PDF
   ├─ Send via email service
   └─ Track delivery status

2. Payment Reminders
   ├─ Check due dates
   ├─ Filter overdue invoices
   ├─ Compose reminder message
   ├─ Send email/SMS
   └─ Log reminder sent

3. Contract Renewal
   ├─ Check contracts expiring in 30 days
   ├─ Compose renewal offer
   ├─ Send to customer
   ├─ Track response
   └─ Follow up if no response

4. Care Schedule Notifications
   ├─ Daily schedule ready
   ├─ Visit confirmation (24h before)
   ├─ Visit completion notification
   └─ Feedback request

5. Error Handling
   ├─ Invalid email → Flag customer
   ├─ Bounce → Update status
   ├─ Failed send → Retry queue
   └─ Track delivery metrics
```

---

## 🚨 Error Handling Workflows

### 1. Database Error Workflow

```
1. Error Detection
   ├─ Prisma throws error
   ├─ Error caught in try-catch
   ├─ Error categorized by type
   └─ Log with context

2. Error Types & Handling
   ├─ UniqueConstraintViolation
   │  └─ Return "Already exists" to user
   ├─ ForeignKeyViolation
   │  └─ Return "Related data not found"
   ├─ NotNullViolation
   │  └─ Return "Missing required field"
   ├─ ConnectionError
   │  └─ Retry 3x, then "System busy"
   └─ UnknownError
      └─ "Unexpected error" + log details

3. User Feedback
   ├─ Clear Vietnamese message
   ├─ Suggested fix
   ├─ Preserve form data
   └─ Allow retry

4. Developer Logging
   ├─ Full error stack
   ├─ Request context
   ├─ User info
   ├─ Timestamp
   └─ Environment

5. Alerting (Critical)
   ├─ Database down → Immediate alert
   ├─ Data corruption → Immediate alert
   ├─ High error rate → Warning
   └─ Failed transactions → Log
```

---

### 2. External API Error Workflow

```
1. Error Detection
   ├─ API call fails
   ├─ Timeout (5s default)
   ├─ Invalid response
   └─ Rate limit exceeded

2. Retry Strategy
   ├─ Retry 3 times with exponential backoff
   ├─ 1s, 2s, 4s delays
   ├─ Check if error is transient
   └─ Fail fast for permanent errors

3. Fallback Mechanism
   ├─ Google Maps fails → Use cached coordinates
   ├─ AI API fails → Manual entry option
   ├─ S3 fails → Queue for later
   └─ Email fails → Log and retry

4. User Experience
   ├─ Show loading state
   ├─ Display retry progress
   ├─ Offer alternative action
   └─ Graceful degradation

5. Monitoring
   ├─ Track API success rate
   ├─ Monitor response times
   ├─ Alert on high failure rate
   └─ Log all failures
```

---

### 3. Concurrent Modification Workflow

```
1. Detection
   ├─ Check record version/timestamp
   ├─ Compare with expected state
   ├─ Detect conflict
   └─ Abort operation

2. Resolution Options
   ├─ Auto-merge (if safe)
   ├─ Show diff to user
   ├─ Prompt user to choose
   └─ Lock record for editing

3. User Notification
   ├─ "Data was modified by another user"
   ├─ Show current vs expected
   ├─ Offer refresh or overwrite
   └─ Preserve user's changes

4. Prevention
   ├─ Optimistic locking
   ├─ Short session timeouts
   ├─ Real-time updates (future)
   └─ Conflict-free merge strategies
```

---

## ⚡ Performance Optimization Workflows

### 1. Query Optimization Workflow

```
1. Identify Slow Queries
   ├─ Monitor query execution time
   ├─ Log queries > 500ms
   ├─ Check database logs
   └─ Use EXPLAIN ANALYZE

2. Optimization Steps
   ├─ Add missing indexes
   ├─ Rewrite complex joins
   ├─ Use raw SQL for aggregations
   ├─ Implement cursor pagination
   └─ Add query hints

3. Testing
   ├─ Benchmark before/after
   ├─ Load testing
   ├─ Verify correctness
   └─ Monitor in production

4. Common Optimizations
   ├─ Replace count() with FILTER
   ├─ Use CTE for complex queries
   ├─ Batch operations
   ├─ Select only needed columns
   └─ Avoid N+1 queries
```

**Example Optimization**:
```typescript
// ❌ Before: 5 queries
const total = await prisma.customer.count({...});
const active = await prisma.customer.count({...});
const vip = await prisma.customer.count({...});

// ✅ After: 1 query
const stats = await prisma.$queryRaw`
  SELECT
    COUNT(*) FILTER (WHERE status != 'TERMINATED') as total,
    COUNT(*) FILTER (WHERE status = 'ACTIVE') as active,
    COUNT(*) FILTER (WHERE tier = 'VIP') as vip
  FROM customers
`;
```

---

### 2. Caching Strategy Workflow

```
1. Cache Key Design
   ├─ Unique per request
   ├─ Include all parameters
   ├─ User-specific if needed
   └─ Versioned for changes

2. Cache Population
   ├─ On-demand (first request)
   ├─ Background refresh
   ├─ Pre-warm critical data
   └─ Batch update

3. Invalidation Strategy
   ├─ Time-based (TTL)
   ├─ Event-based (on write)
   ├─ Manual (admin action)
   �─ Pattern on-demand (force refresh)

4. Layered Caching
   ├─ Memory: Per-request (< 1s)
   ├─ Redis: Cross-request (< 5min)
   ├─ Database: Materialized views
   └─ CDN: Static assets

5. Monitoring
   ├─ Cache hit rate (> 80% target)
   ├─ Memory usage
   ├─ Stale data detection
   └─ Performance impact
```

---

### 3. Code Splitting Workflow

```
1. Identify Heavy Components
   ├─ Chart libraries (Recharts)
   ├─ Map components (Leaflet)
   ├─ PDF generation (jsPDF)
   └─ Large datasets

2. Dynamic Imports
   ├─ Use next/dynamic
   ├─ Set loading skeletons
   ├─ SSR: false for client-only
   └─ Prefetch on hover

3. Route Splitting
   ├─ Group routes by feature
   ├─ Lazy load route modules
   ├─ Optimize shared dependencies
   └─ Analyze bundle size

4. Bundle Analysis
   ├─ Run bundle analyzer
   ├─ Identify large dependencies
   ├─ Split vendor chunks
   └─ Tree-shake unused code

5. Performance Metrics
   ├─ Initial bundle size
   ├─ Time to interactive
   ├─ Total page load time
   └─ User-perceived speed
```

---

## 📊 Monitoring & Observability Workflows

### 1. Performance Monitoring

```
1. Metrics Collection
   ├─ Query execution time
   ├─ API response time
   ├─ Page load time
   ├─ Bundle size
   └─ Error rates

2. Alerting Thresholds
   ├─ Query > 1s → Warning
   ├─ API > 500ms → Warning
   ├─ Error rate > 1% → Alert
   └─ Bundle > 500KB → Review

3. Dashboard
   ├─ Real-time metrics
   ├─ Historical trends
   ├─ User experience metrics
   └─ System health

4. Optimization Loop
   ├─ Identify bottleneck
   ├─ Implement fix
   ├─ Measure impact
   └─ Document results
```

---

### 2. Error Tracking Workflow

```
1. Error Capture
   ├─ Client-side errors
   ├─ Server-side errors
   ├─ API failures
   └─ Database errors

2. Classification
   ├─ User errors (validation)
   ├─ System errors (bugs)
   ├─ External errors (API)
   └─ Infrastructure (DB down)

3. Prioritization
   ├─ Critical: Data loss, security
   ├─ High: Core features broken
   ├─ Medium: Degraded experience
   └─ Low: Minor UI issues

4. Resolution
   ├─ Reproduce issue
   ├─ Fix and test
   ├─ Deploy fix
   └─ Verify resolution

5. Prevention
   ├─ Add tests
   ├─ Improve validation
   ├─ Add monitoring
   └─ Document learnings
```

---

## 🎯 Success Metrics & KPIs

### Business Metrics
- **Customer Retention**: > 95%
- **Collection Rate**: > 95%
- **Contract Renewal**: > 80%
- **Customer Satisfaction**: > 4.5/5
- **Response Time**: < 2 seconds

### Technical Metrics
- **System Uptime**: 99.9%
- **API Response**: < 200ms average
- **Test Coverage**: > 95%
- **Cache Hit Rate**: > 80%
- **Error Rate**: < 0.5%

### Operational Metrics
- **Visit Completion**: 100%
- **On-Time Arrival**: > 90%
- **Invoice Accuracy**: 100%
- **Exchange Resolution**: < 48 hours
- **Support Response**: < 1 hour

---

## 📚 Related Documentation

- **Project Overview**: `./project-overview-pdr.md`
- **System Architecture**: `./system-architecture.md`
- **Code Standards**: `./code-standards.md`
- **Codebase Summary**: `./codebase-summary.md`
- **Deployment Guide**: `./deployment-guide.md`

---

**Document Version**: 1.0
**Last Updated**: December 22, 2025
**Status**: Active
**Next Review**: After Phase 3 completion