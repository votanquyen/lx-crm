# Codebase Summary

**Lộc Xanh CRM - Complete File Structure & Component Overview**
**Last Updated**: December 22, 2025

---

## 📁 Project Structure

```
locxanh.vn/
├── 📄 Root Files
│   ├── README.md                    # Project overview & quick start
│   ├── package.json                 # Dependencies & scripts
│   ├── tsconfig.json                # TypeScript configuration
│   ├── next.config.js               # Next.js config (Webpack for PDF)
│   ├── tailwind.config.js           # TailwindCSS configuration
│   ├── eslint.config.js             # ESLint rules
│   └── CLAUDE.md                    # AI assistant guidelines
│
├── 📂 docs/                         # Comprehensive documentation
│   ├── project-overview-pdr.md      # Requirements & specifications
│   ├── codebase-summary.md          # This file
│   ├── code-standards.md            # Development guidelines
│   ├── system-architecture.md       # Technical architecture
│   ├── project-roadmap.md           # Future development
│   ├── deployment-guide.md          # Deployment instructions
│   ├── coolify-deployment-guide.md  # Coolify deployment (NEW)
│   ├── coolify-quick-start.md       # Quick start guide (NEW)
│   ├── design-guidelines.md         # UI/UX principles
│   └── neon-setup-guide.md          # Database setup
│
├── 📂 prisma/                       # Database schema & migrations
│   ├── schema.prisma                # Complete database models
│   ├── migrations/                  # Generated migrations
│   └── seed.ts                      # Database seeding
│
├── 📂 src/
│   ├── 📂 app/                      # Next.js App Router
│   │   ├── (auth)/                  # Authentication routes
│   │   │   └── login/page.tsx       # Login page
│   │   ├── (dashboard)/             # Main application
│   │   │   ├── page.tsx             # Dashboard home
│   │   │   ├── analytics/           # Analytics & reports
│   │   │   ├── customers/           # Customer management
│   │   │   ├── contracts/           # Contract management
│   │   │   ├── invoices/            # Invoicing
│   │   │   ├── payments/            # Payment tracking
│   │   │   ├── care/                # Care scheduling
│   │   │   ├── exchanges/           # Plant exchanges
│   │   │   ├── quotations/          # Quotations
│   │   │   ├── plant-types/         # Plant catalog
│   │   │   ├── bang-ke/             # Monthly statements
│   │   │   └── admin/               # Admin panel
│   │   ├── (protected)/             # Protected routes
│   │   ├── api/                     # API routes (export, webhooks)
│   │   └── unauthorized/page.tsx    # 403 page
│   │
│   ├── 📂 actions/                  # Server Actions
│   │   ├── customers.ts             # Customer CRUD + search
│   │   ├── contracts.ts             # Contract operations
│   │   ├── invoices.ts              # Invoicing & payments
│   │   ├── care-schedules.ts        # Care scheduling
│   │   ├── exchanges.ts             # Exchange management
│   │   ├── quotations.ts            # Quotation operations
│   │   ├── plant-types.ts           # Plant catalog
│   │   ├── sticky-notes.ts          # AI-powered notes
│   │   ├── reports.ts               # Analytics queries
│   │   └── monthly-statements.ts    # Bảng Kê (Phase 2.5)
│   │
│   ├── 📂 components/               # React components
│   │   ├── ui/                      # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── table.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── form.tsx
│   │   │   └── ... (30+ components)
│   │   ├── analytics/               # Analytics charts
│   │   │   ├── revenue-dashboard.tsx
│   │   │   ├── invoice-aging.tsx
│   │   │   └── export-buttons.tsx
│   │   ├── customers/               # Customer components
│   │   │   ├── customer-form.tsx
│   │   │   ├── customer-search.tsx
│   │   │   └── customer-card.tsx
│   │   ├── contracts/               # Contract components
│   │   │   ├── contract-form.tsx
│   │   │   └── contract-list.tsx
│   │   ├── invoices/                # Invoice components
│   │   │   ├── invoice-form.tsx
│   │   │   └── payment-record.tsx
│   │   └── shared/                  # Shared components
│   │       ├── loading-skeleton.tsx
│   │       ├── error-boundary.tsx
│   │       └── data-table.tsx
│   │
│   ├── 📂 lib/                      # Core utilities
│   │   ├── prisma.ts                # Prisma client singleton
│   │   ├── auth.ts                  # NextAuth.js configuration
│   │   ├── auth-utils.ts            # Authorization helpers
│   │   ├── action-utils.ts          # Server action wrappers
│   │   ├── errors.ts                # Custom error classes
│   │   ├── utils.ts                 # General utilities
│   │   ├── db-utils.ts              # Database utilities
│   │   └── validations/             # Zod schemas
│   │       ├── customer.ts
│   │       ├── contract.ts
│   │       ├── invoice.ts
│   │       ├── payment.ts
│   │       ├── care.ts
│   │       ├── exchange.ts
│   │       ├── quotation.ts
│   │       ├── plant-type.ts
│   │       ├── sticky-note.ts
│   │       ├── schedule.ts
│   │       └── monthly-statement.ts
│   │
│   └── 📂 styles/                   # Global styles
│       ├── globals.css              # Global CSS
│       └── leaflet.css              # Map styles
│
├── 📂 public/                       # Static assets
│   ├── favicon.ico
│   └── images/                      # Images & logos
│
├── 📂 scripts/                      # Utility scripts
│   ├── setup-neon.sh               # Neon database setup
│   ├── format_code.sh              # Code formatting
│   └── run_tests.sh                # Test runner
│
├── 📂 .github/                      # GitHub Actions
│   └── workflows/
│       ├── ci.yml                   # Continuous integration
│       └── cd.yml                   # Continuous deployment
│
└── 📂 docker/                       # Docker configuration
    ├── docker-compose.yml           # Local development
    └── postgres/Dockerfile          # PostgreSQL + PostGIS
```

---

## 🔧 Core Modules Overview

### 1. Database Layer (`prisma/schema.prisma`)

**Models**: 15 core models with 40+ indexes

#### Key Models
```prisma
// User & Authentication
model User { ... }
model Account { ... }
model Session { ... }

// Core Business
model Customer { ... }           // 40+ fields, Vietnamese search
model Contract { ... }           // Lifecycle management
model Invoice { ... }            // Financial tracking
model Payment { ... }            // Transaction records

// Operations
model CareSchedule { ... }       // GPS-enabled scheduling
model ExchangeRequest { ... }    // Plant replacement
model DailySchedule { ... }      // Route optimization

// Content & AI
model PlantType { ... }          // Catalog
model StickyNote { ... }         // AI-powered notes
model ActivityLog { ... }        // Audit trail
```

**Database Features**:
- **Extensions**: postgis, pg_trgm, unaccent
- **Indexes**: 40+ for performance
- **Views**: 6 complex aggregations
- **Enums**: 10+ for type safety

### 2. Server Actions (`src/actions/`)

**Pattern**: Full-stack type safety with Zod validation

#### Core Actions
```typescript
// customers.ts - Vietnamese fuzzy search
export async function getCustomers(params: CustomerSearchParams) {
  // pg_trgm search + filters + pagination
}

// contracts.ts - Lifecycle management
export async function createContract(input: CreateContractInput) {
  // Validation → Calculation → DB Insert → Activity Log
}

// invoices.ts - Financial operations
export async function recordPayment(invoiceId: string, amount: Decimal) {
  // Payment tracking → Status update → Balance calculation
}

// reports.ts - Analytics with raw SQL
export async function getRevenueOverview() {
  // Single query with PostgreSQL FILTER for performance
}
```

**Validation Pattern**:
```typescript
export const createCustomer = createAction(
  createCustomerSchema,
  async (input) => {
    // Auth check → Duplicate detection → Geocoding → DB Insert
  }
);
```

### 3. Frontend Components (`src/components/`)

**Architecture**: Reusable, type-safe components with shadcn/ui

#### Component Categories
- **UI Components**: 30+ shadcn/ui components (button, card, table, dialog, etc.)
- **Analytics**: Dynamic imports with loading skeletons
- **Forms**: React Hook Form + Zod validation
- **Data Display**: Tables, cards, lists with Vietnamese formatting
- **Maps**: Google Maps + React Leaflet integration
- **PDF Export**: jsPDF with Vietnamese font support

#### Performance Optimizations
```typescript
// Dynamic imports for heavy components
const RevenueDashboard = dynamic(
  () => import('@/components/analytics/revenue-dashboard'),
  { loading: () => <Skeleton className="h-[400px]" /> }
);

// Suspense boundaries for granular loading
<Suspense fallback={<LoadingSkeleton />}>
  <DashboardStats />
</Suspense>
```

### 4. Authentication & Security (`src/lib/`)

**NextAuth.js 5 Configuration**:
```typescript
// auth.ts - Provider setup
export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [Google, Credentials],
  callbacks: {
    jwt: ({ token, user }) => { ... },
    session: ({ session, token }) => { ... },
  },
});

// auth-utils.ts - Authorization helpers
export async function requireManager() {
  return requireRole(["ADMIN", "MANAGER"]);
}
```

**RBAC Levels**:
1. **ADMIN**: Full system access
2. **MANAGER**: Can delete customers, view all
3. **STAFF**: Create/edit records, view assigned
4. **ACCOUNTANT**: Invoice/payment management
5. **VIEWER**: Read-only access

### 5. Validation Layer (`src/lib/validations/`)

**Zod Schemas with Vietnamese Messages**:
```typescript
// customer.ts
export const customerSchema = z.object({
  companyName: z.string().min(1, "Tên công ty không được để trống"),
  contactPhone: z.string().regex(phoneRegex, "Số điện thoại không hợp lệ"),
  taxCode: z.string().max(20).optional(),
  // ... 30+ fields
});

// Type exports for TypeScript
export type CustomerInput = z.infer<typeof customerSchema>;
```

**Validation Features**:
- Vietnamese error messages
- Phone number validation (0XX XXX XXXX)
- Email validation
- Decimal precision for financial data
- Optional/nullable field handling

### 6. Utilities & Helpers (`src/lib/`)

#### Core Utilities
```typescript
// utils.ts - General utilities
export function normalizeVietnamese(str: string): string {
  // Remove accents, lowercase for search
}

// db-utils.ts - Database helpers
export function formatCurrencyDecimal(amount: Decimal): string {
  // Vietnamese currency formatting: 1.000.000 ₫
}

// errors.ts - Custom error classes
export class NotFoundError extends AppError { ... }
export class ConflictError extends AppError { ... }

// action-utils.ts - Server action wrappers
export function createAction(schema, handler) {
  // Validation + error handling + logging
}
```

---

## 🎯 Key Technical Patterns

### 1. Vietnamese-First Design
```typescript
// Search normalization
const normalized = normalizeVietnamese("Công Ty TNHH ABC");
// Result: "cong ty tnhh abc"

// pg_trgm search
WHERE company_name_norm % ${normalized}

// Vietnamese formatting
new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" })
```

### 2. Performance Optimization
```typescript
// Raw SQL aggregation (vs 5 separate queries)
const stats = await prisma.$queryRaw`
  SELECT
    COUNT(*) FILTER (WHERE status != 'TERMINATED') as total,
    COUNT(*) FILTER (WHERE status = 'ACTIVE') as active,
    COUNT(*) FILTER (WHERE tier = 'VIP') as vip
  FROM customers;
`;

// Query caching pattern
const cacheKey = `customer:${id}`;
const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached);
const data = await fetchFromDB();
await redis.setex(cacheKey, 3600, JSON.stringify(data));
```

### 3. Type Safety Chain
```typescript
// Database Schema → Prisma Types → Zod Schema → TypeScript Types
model Customer { ... }           // Prisma Client type
z.infer<typeof customerSchema>   // Zod inference
CustomerInput                    // TypeScript type
```

### 4. Server Actions Pattern
```typescript
// 1. Authentication
await requireAuth();

// 2. Validation
const validated = schema.parse(input);

// 3. Business Logic
const result = await prisma.customer.create({ data: validated });

// 4. Activity Logging
await prisma.activityLog.create({ ... });

// 5. Cache Invalidation
revalidatePath("/customers");

// 6. Return Typed Response
return result;
```

---

## 📊 Code Statistics

### File Count
- **Total Files**: ~150
- **Components**: 50+
- **Server Actions**: 10 modules
- **Validation Schemas**: 11 files
- **Database Models**: 15 models
- **Tests**: 121 test cases

### Lines of Code (Estimated)
- **TypeScript**: ~15,000 lines
- **SQL (Migrations)**: ~2,000 lines
- **Configuration**: ~500 lines
- **Documentation**: ~3,000 lines

### Test Coverage
- **Lines**: 97.5%
- **Functions**: 94.55%
- **Branches**: 92.3%
- **Statements**: 96.8%

---

## 🔗 Integration Points

### External Services
1. **Google Maps API**: Geocoding, distance calculations
2. **Google OAuth**: Authentication provider
3. **MinIO/S3**: File storage with presigned URLs
4. **Gemini API**: AI note analysis (optional)

### Internal Systems
1. **PostgreSQL**: Primary data store
2. **Redis**: Ready for caching (future)
3. **Email**: Invoice delivery (future)
4. **SMS**: Payment confirmations (future)

---

## 🚀 Development Workflow

### Code Quality Gates
```bash
# Before commit
pnpm run validate        # Typecheck + lint + format
pnpm test                # All tests pass
pnpm run build           # Production build succeeds

# Auto-fix issues
pnpm run lint:fix        # ESLint auto-fix
pnpm run format          # Prettier formatting
```

### Git Workflow
```bash
# Feature development
git checkout dev
git pull origin dev
git checkout -b feat/new-feature
# ... make changes ...
git commit -m "feat(scope): add new feature"
git push -u origin feat/new-feature
# Create PR to dev
```

---

## 📝 Configuration Files

### Next.js (`next.config.js`)
- Webpack config for Vietnamese PDF fonts
- Image optimization settings
- Security headers

### TypeScript (`tsconfig.json`)
- Strict mode enabled
- Path aliases configured
- Type checking for Server Actions

### TailwindCSS (`tailwind.config.js`)
- shadcn/ui theme integration
- Vietnamese font families
- Custom color palette

### ESLint (`eslint.config.js`)
- TypeScript strict rules
- React hooks rules
- Import ordering

---

## 🎯 Key Files to Understand

### Must-Read Files
1. **`prisma/schema.prisma`** - Complete database structure
2. **`src/lib/auth.ts`** - Authentication configuration
3. **`src/actions/customers.ts`** - Server Actions pattern example
4. **`src/lib/validations/customer.ts`** - Zod validation patterns
5. **`src/app/(dashboard)/page.tsx`** - Dashboard architecture

### Architecture Files
1. **`src/lib/prisma.ts`** - Database client singleton
2. **`src/lib/errors.ts`** - Error handling system
3. **`src/lib/action-utils.ts`** - Server action wrappers
4. **`src/lib/db-utils.ts`** - Database utilities

---

## 🔄 Common Patterns

### 1. Form Handling
```typescript
// Component
<form action={createCustomer}>
  <input name="companyName" />
  <button type="submit">Create</button>
</form>

// Server Action
export const createCustomer = createAction(
  createCustomerSchema,
  async (input) => { ... }
);
```

### 2. Data Fetching
```typescript
// Server Component with Suspense
async function CustomerList() {
  const customers = await getCustomers({ page: 1 });
  return customers.map(c => <CustomerCard key={c.id} {...c} />);
}

// Usage
<Suspense fallback={<Skeleton />}>
  <CustomerList />
</Suspense>
```

### 3. Error Handling
```typescript
try {
  await updateCustomer(input);
} catch (error) {
  if (error instanceof NotFoundError) {
    toast.error("Khách hàng không tồn tại");
  } else if (error instanceof ConflictError) {
    toast.error("Tên công ty đã tồn tại");
  }
}
```

---

## 📚 Related Documentation

- **Architecture**: `./docs/system-architecture.md` - Detailed technical design
- **Standards**: `./docs/code-standards.md` - Development conventions
- **Roadmap**: `./docs/project-roadmap.md` - Future development
- **PDR**: `./docs/project-overview-pdr.md` - Requirements & specifications

---

**Summary Version**: 1.0
**Last Updated**: December 22, 2025
**Codebase Status**: 74% Complete, Phase 2.5