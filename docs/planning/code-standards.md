# Code Standards & Development Guidelines

**Lộc Xanh CRM - Development Conventions & Best Practices**
**Last Updated**: December 22, 2025

---

## 📋 Table of Contents

1. [General Principles](#general-principles)
2. [TypeScript Standards](#typescript-standards)
3. [React & Next.js Patterns](#react--nextjs-patterns)
4. [Database & Prisma](#database--prisma)
5. [Server Actions](#server-actions)
6. [Validation & Error Handling](#validation--error-handling)
7. [Component Design](#component-design)
8. [Testing Standards](#testing-standards)
9. [Git & Commit Standards](#git--commit-standards)
10. [Vietnamese Language Standards](#vietnamese-language-standards)

---

## 🎯 General Principles

### Core Philosophy

- **YAGNI**: You Aren't Gonna Need It - Build only what's needed now
- **KISS**: Keep It Simple Stupid - Prefer clarity over cleverness
- **DRY**: Don't Repeat Yourself - One source of truth
- **API-First**: All features must have REST/Server Action interface

### Code Quality Gates

```bash
# Before any commit
pnpm run validate        # Full validation
pnpm test                # All tests pass
pnpm run build           # Production build succeeds
```

### Quality Metrics

- **Type Safety**: 100% - No `any` types allowed
- **Test Coverage**: > 95% lines, > 90% functions
- **Linting**: 0 errors, warnings addressed
- **Formatting**: Consistent with Prettier

---

## 🔧 TypeScript Standards

### Type Safety Rules

#### 1. No `any` Types

```typescript
// ❌ BAD
function process(data: any) { ... }

// ✅ GOOD
function process(data: unknown) { ... }
// or
function process<T>(data: T) { ... }
// or
interface CustomerInput { ... }
function process(data: CustomerInput) { ... }
```

#### 2. Explicit Return Types

```typescript
// ❌ BAD
function getCustomer(id: string) {
  return prisma.customer.findUnique({ where: { id } });
}

// ✅ GOOD
async function getCustomer(id: string): Promise<Customer | null> {
  return prisma.customer.findUnique({ where: { id } });
}
```

#### 3. Interface vs Type

```typescript
// Use interfaces for objects
interface Customer {
  id: string;
  companyName: string;
  address: string;
}

// Use types for unions, generics
type CustomerStatus = "LEAD" | "ACTIVE" | "INACTIVE" | "TERMINATED";
type CustomerTier = "STANDARD" | "PREMIUM" | "VIP";
```

#### 4. Null Safety

```typescript
// ❌ BAD
const customer = await prisma.customer.findUnique({ where: { id } });
console.log(customer.companyName); // Potential null error

// ✅ GOOD
const customer = await prisma.customer.findUnique({ where: { id } });
if (!customer) {
  throw new NotFoundError("Khách hàng");
}
console.log(customer.companyName); // Safe
```

### TypeScript Configuration

#### Strict Mode Requirements

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true
  }
}
```

---

## ⚛️ React & Next.js Patterns

### 1. Server vs Client Components

#### Server Components (Default)

```typescript
// ✅ Default: Server Component
import { prisma } from "@/lib/prisma";

export default async function CustomerPage({ params }: { params: { id: string } }) {
  const customer = await prisma.customer.findUnique({ where: { id: params.id } });
  return <CustomerDetail customer={customer} />;
}
```

#### Client Components (Use Sparingly)

```typescript
// ✅ Use "use client" directive when needed
"use client";

import { useState } from "react";

export function CustomerForm() {
  const [formData, setFormData] = useState(...);
  // Client-side logic
}
```

### 2. Data Fetching Patterns

#### Server Actions (Preferred)

```typescript
// ✅ Server Action
"use server";

export async function getCustomers(params: CustomerSearchParams) {
  await requireAuth();
  const validated = customerSearchSchema.parse(params);
  // ... fetch and return
}

// Usage in Client Component
function CustomerList() {
  const [customers, setCustomers] = useState([]);

  useEffect(() => {
    getCustomers({ page: 1 }).then(setCustomers);
  }, []);
}
```

#### React Query (For Real-time Updates)

```typescript
// ✅ With caching and invalidation
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

function CustomerComponent() {
  const queryClient = useQueryClient();

  const { data: customers } = useQuery({
    queryKey: ["customers"],
    queryFn: () => getCustomers({ page: 1 }),
  });

  const mutation = useMutation({
    mutationFn: createCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });
}
```

### 3. Suspense & Loading States

```typescript
// ✅ Granular loading boundaries
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  return (
    <div>
      <h1>Dashboard</h1>

      <Suspense fallback={<Skeleton className="h-32 w-full" />}>
        <StatsSection />
      </Suspense>

      <Suspense fallback={<Skeleton className="h-64 w-full" />}>
        <ChartSection />
      </Suspense>
    </div>
  );
}

async function StatsSection() {
  const stats = await getStats();
  return <StatsCard {...stats} />;
}
```

### 4. Dynamic Imports (Code Splitting)

```typescript
// ✅ For heavy components
import dynamic from "next/dynamic";

const RevenueChart = dynamic(
  () => import("@/components/analytics/revenue-chart"),
  {
    loading: () => <Skeleton className="h-[400px]" />,
    ssr: false  // Disable SSR if not needed
  }
);
```

---

## 🗄 Database & Prisma Standards

### 1. Schema Design

#### Naming Conventions

```prisma
// ✅ Use snake_case for database, PascalCase for models
model Customer {
  id            String   @id @default(cuid())
  companyName   String   // camelCase in code
  company_name_norm String? // snake_case for raw queries
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

#### Index Strategy

```prisma
// ✅ Optimize for Vietnamese search
model Customer {
  companyNameNorm String? @map("company_name_norm")

  @@index([companyNameNorm])  // For trigram search
  @@index([status])
  @@index([tier])
  @@index([district])
  @@unique([code])
}
```

### 2. Query Patterns

#### Prisma Client Usage

```typescript
// ✅ Use Prisma.sql for complex queries
import { Prisma } from "@prisma/client";

const customers = await prisma.$queryRaw`
  SELECT c.*,
         GREATEST(
           similarity(company_name_norm, ${normalized}),
           similarity(COALESCE(address_normalized, ''), ${normalized})
         ) as similarity
  FROM customers c
  WHERE c.status != 'TERMINATED'
  ORDER BY similarity DESC
  LIMIT ${limit} OFFSET ${skip}
`;
```

#### Transaction Handling

```typescript
// ✅ Use transactions for multi-step operations
await prisma.$transaction(async (tx) => {
  const customer = await tx.customer.create({ data: input });
  await tx.activityLog.create({
    data: {
      userId: session.user.id,
      action: "CREATE",
      entityType: "Customer",
      entityId: customer.id,
      newValues: customer as Prisma.JsonObject,
    },
  });
  return customer;
});
```

### 3. Migration Standards

#### Safe Migrations

```sql
-- ✅ Idempotent migrations
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE INDEX IF NOT EXISTS idx_customer_name_norm ON customers(company_name_norm);

-- ✅ Add columns with defaults
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS address_normalized VARCHAR(500);
```

---

## 🚀 Server Actions

### 1. Action Structure

#### Standard Pattern

```typescript
// ✅ Complete server action pattern
"use server";

import { revalidatePath } from "next/cache";
import { createAction } from "@/lib/action-utils";
import { requireAuth } from "@/lib/auth-utils";
import { createCustomerSchema } from "@/lib/validations/customer";

export const createCustomer = createAction(createCustomerSchema, async (input) => {
  // 1. Authentication
  const session = await requireAuth();

  // 2. Business Logic
  const normalized = normalizeVietnamese(input.companyName);
  const existing = await prisma.customer.findFirst({
    where: { companyNameNorm: normalized },
  });

  if (existing) {
    throw new ConflictError(`Khách hàng "${input.companyName}" đã tồn tại`);
  }

  // 3. Database Operation
  const customer = await prisma.customer.create({
    data: {
      ...input,
      companyNameNorm: normalized,
      code: await generateCustomerCode(),
    },
  });

  // 4. Audit Logging
  await prisma.activityLog.create({
    data: {
      userId: session.user.id,
      action: "CREATE",
      entityType: "Customer",
      entityId: customer.id,
      newValues: customer as Prisma.JsonObject,
    },
  });

  // 5. Cache Invalidation
  revalidatePath("/customers");

  return customer;
});
```

### 2. Action Wrappers

#### Reusable Action Utilities

```typescript
// ✅ lib/action-utils.ts
export function createAction<TInput, TOutput>(
  schema: z.ZodSchema<TInput>,
  handler: (input: TInput) => Promise<TOutput>
) {
  return async (input: unknown): Promise<Result<TOutput>> => {
    try {
      const validated = schema.parse(input);
      const result = await handler(validated);
      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        error: error instanceof AppError ? error.message : "Internal server error",
      };
    }
  };
}
```

---

## ✅ Validation & Error Handling

### 1. Zod Validation Standards

#### Schema Design

```typescript
// ✅ lib/validations/customer.ts
import { z } from "zod";
import { CustomerStatus, CustomerTier } from "@prisma/client";

const phoneRegex = /^0[0-9]{9}$/;

export const customerSchema = z.object({
  // Basic Info
  companyName: z
    .string()
    .min(1, "Tên công ty không được để trống")
    .max(255, "Tên công ty tối đa 255 ký tự"),

  address: z.string().min(1, "Địa chỉ không được để trống").max(500, "Địa chỉ tối đa 500 ký tự"),

  // Phone with Vietnamese format
  contactPhone: z
    .string()
    .regex(phoneRegex, "Số điện thoại không hợp lệ (VD: 0901234567)")
    .optional()
    .nullable()
    .or(z.literal("")),

  // Enum validation
  tier: z.nativeEnum(CustomerTier).default("STANDARD"),
  status: z.nativeEnum(CustomerStatus).optional(),

  // Optional with defaults
  city: z.string().max(100).default("TP.HCM").optional(),

  // Numeric validation
  floorCount: z.number().int().positive().optional().nullable(),

  // Coordinates
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
});

// Type exports
export type CustomerInput = z.infer<typeof customerSchema>;
export type CustomerSearchParams = z.input<typeof customerSearchSchema>;
```

### 2. Error Classes

#### Custom Error Types

```typescript
// ✅ lib/errors.ts
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} không tồn tại`, "NOT_FOUND", 404);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, "CONFLICT", 409);
  }
}

export class ForbiddenError extends AppError {
  constructor() {
    super("Không có quyền truy cập", "FORBIDDEN", 403);
  }
}
```

### 3. Error Handling Pattern

#### Try-Catch with Specific Errors

```typescript
// ✅ In Server Actions
try {
  const customer = await prisma.customer.create({ data: input });
  return customer;
} catch (error) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      throw new ConflictError("Khách hàng đã tồn tại");
    }
  }
  throw error; // Re-throw if unknown
}

// ✅ In Client Components
async function handleSubmit(data: CustomerInput) {
  try {
    const result = await createCustomer(data);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Khách hàng created successfully");
    router.push(`/customers/${result.data.id}`);
  } catch (error) {
    toast.error("Có lỗi xảy ra");
  }
}
```

---

## 🎨 Component Design Standards

### 1. Component Structure

#### File Organization

```typescript
// ✅ components/customers/customer-form.tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { customerSchema, CustomerInput } from "@/lib/validations/customer";

interface CustomerFormProps {
  initialData?: Partial<CustomerInput>;
  onSubmit: (data: CustomerInput) => Promise<void>;
}

export function CustomerForm({ initialData, onSubmit }: CustomerFormProps) {
  const form = useForm<CustomerInput>({
    resolver: zodResolver(customerSchema),
    defaultValues: initialData,
  });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* Form fields */}
    </form>
  );
}
```

### 2. Loading States

#### Skeleton Components

```typescript
// ✅ Reusable skeletons
export function CardSkeleton() {
  return (
    <div className="rounded-lg border p-4 space-y-3">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-3 w-40" />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}
```

### 3. Data Display

#### Vietnamese Formatting

```typescript
// ✅ utils/db-utils.ts
export function formatCurrencyDecimal(amount: Decimal): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    minimumFractionDigits: 0,
  }).format(Number(amount));
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export function formatPhone(phone: string): string {
  // 0901234567 → 090 123 4567
  return phone.replace(/(\d{3})(\d{3})(\d{4})/, "$1 $2 $3");
}
```

---

## 🧪 Testing Standards

### 1. Test Structure

#### Unit Tests

```typescript
// ✅ __tests__/lib/utils.test.ts
import { describe, it, expect } from "vitest";
import { normalizeVietnamese, formatCurrencyDecimal } from "@/lib/utils";
import { Decimal } from "@prisma/client/runtime/library";

describe("normalizeVietnamese", () => {
  it("should remove accents", () => {
    expect(normalizeVietnamese("Công Ty TNHH")).toBe("cong ty tnhh");
  });

  it("should handle empty string", () => {
    expect(normalizeVietnamese("")).toBe("");
  });
});

describe("formatCurrencyDecimal", () => {
  it("should format VND correctly", () => {
    const amount = new Decimal(1000000);
    expect(formatCurrencyDecimal(amount)).toBe("1.000.000 ₫");
  });
});
```

#### Integration Tests

```typescript
// ✅ __tests__/actions/customers.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { createCustomer } from "@/actions/customers";
import { prisma } from "@/lib/prisma";

describe("createCustomer", () => {
  beforeEach(async () => {
    await prisma.customer.deleteMany();
  });

  it("should create customer with valid data", async () => {
    const result = await createCustomer({
      companyName: "Test Company",
      address: "123 Test Street",
      tier: "STANDARD",
    });

    expect(result.success).toBe(true);
    expect(result.data?.companyName).toBe("Test Company");
  });

  it("should reject duplicate company names", async () => {
    await createCustomer({
      companyName: "Test Company",
      address: "123 Test Street",
      tier: "STANDARD",
    });

    const result = await createCustomer({
      companyName: "Test Company", // Same name
      address: "456 Different St",
      tier: "STANDARD",
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("đã tồn tại");
  });
});
```

### 2. Test Coverage Requirements

```bash
# ✅ Run tests with coverage
pnpm test --coverage

# Coverage thresholds
lines: 95%
functions: 90%
branches: 85%
statements: 95%
```

---

## 📦 Git & Commit Standards

### 1. Branch Naming

```
✅ feat/customer-search      # New feature
✅ fix/invoice-calculation   # Bug fix
✅ perf/dashboard-queries    # Performance improvement
✅ docs/api-documentation    # Documentation
✅ refactor/auth-system      # Code restructure
✅ test/customer-crud        # Adding tests
✅ chore/dependency-update   # Maintenance
```

### 2. Commit Message Format

```
<type>(<scope>): <description>

<body>

<footer>
```

#### Examples

```bash
# ✅ Good commits
git commit -m "feat(customer): add Vietnamese fuzzy search with pg_trgm"
git commit -m "fix(invoice): handle Decimal serialization in client components"
git commit -m "perf(dashboard): optimize queries with raw SQL aggregation"
git commit -m "docs(readme): update project status to 74% complete"

# ❌ Bad commits
git commit -m "added search"
git commit -m "fixed bug"
git commit -m "WIP"
```

### 3. Pre-commit Checklist

```bash
# ✅ Before committing
pnpm run validate        # Typecheck + lint + format
pnpm test                # All tests pass
git diff --check         # No trailing whitespace
git status               # Review changed files

# ✅ Review changes
git add .
git commit -m "feat(scope): description"
```

---

## 🌐 Vietnamese Language Standards

### 1. User-Facing Text

#### Error Messages

```typescript
// ✅ Clear, actionable Vietnamese
export const ERROR_MESSAGES = {
  REQUIRED: "Trường này không được để trống",
  INVALID_PHONE: "Số điện thoại không hợp lệ (VD: 0901234567)",
  INVALID_EMAIL: "Email không hợp lệ",
  DUPLICATE_COMPANY: "Tên công ty đã tồn tại",
  NOT_FOUND: "Dữ liệu không tồn tại",
  FORBIDDEN: "Bạn không có quyền truy cập",
  SERVER_ERROR: "Có lỗi xảy ra, vui lòng thử lại",
} as const;
```

#### Success Messages

```typescript
// ✅ Positive feedback
export const SUCCESS_MESSAGES = {
  CREATED: "Tạo mới thành công",
  UPDATED: "Cập nhật thành công",
  DELETED: "Xóa thành công",
  SAVED: "Lưu thành công",
} as const;
```

### 2. Formatting Standards

#### Currency

```typescript
// ✅ Vietnamese currency format
const amount = 1000000;
const formatted = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
}).format(amount);
// Result: "1.000.000 ₫"
```

#### Dates

```typescript
// ✅ Vietnamese date format
const date = new Date();
const formatted = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
}).format(date);
// Result: "22/12/2025"
```

#### Phone Numbers

```typescript
// ✅ Vietnamese phone format
function formatVietnamesePhone(phone: string): string {
  // Remove all non-digits
  const cleaned = phone.replace(/\D/g, "");

  // Format: 090 123 4567
  return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, "$1 $2 $3");
}
```

### 3. Database Fields for Vietnamese

#### Normalization Strategy

```typescript
// ✅ Search optimization
const companyName = "Công Ty TNHH ABC";
const normalized = normalizeVietnamese(companyName);
// Result: "cong ty tnhh abc"

// Store both original and normalized
await prisma.customer.create({
  data: {
    companyName: "Công Ty TNHH ABC", // Original
    companyNameNorm: "cong ty tnhh abc", // For search
  },
});
```

---

## 🔒 Security Standards

### 1. Authentication & Authorization

#### Role-Based Access

```typescript
// ✅ Server-side authorization
export async function deleteCustomer(id: string) {
  const session = await requireManager(); // ADMIN or MANAGER only

  const existing = await prisma.customer.findUnique({
    where: { id },
    include: { contracts: { where: { status: "ACTIVE" } } },
  });

  if (existing.contracts.length > 0) {
    throw new AppError("Cannot delete customer with active contracts");
  }

  return prisma.customer.update({
    where: { id },
    data: { status: "TERMINATED" },
  });
}
```

### 2. Data Validation

#### Server-Side Always

```typescript
// ✅ Never trust client input
export const createCustomer = createAction(
  createCustomerSchema, // Always validate
  async (input) => {
    // Even with validation, sanitize
    const sanitized = {
      ...input,
      companyName: input.companyName.trim(),
      contactPhone: input.contactPhone?.replace(/\s/g, ""),
    };

    return prisma.customer.create({ data: sanitized });
  }
);
```

### 3. File Upload Security

#### Presigned URLs

```typescript
// ✅ Secure file access
export async function getUploadUrl(filename: string, contentType: string) {
  const key = `uploads/${uuid()}-${filename}`;

  const command = new PutObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
    ContentType: contentType,
    Expires: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
  });

  const url = await getSignedUrl(s3, command, { expiresIn: 900 });

  // Store file metadata in database
  await prisma.fileUpload.create({
    data: {
      filename,
      storageKey: key,
      mimeType: contentType,
      uploadedById: session.user.id,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    },
  });

  return url;
}
```

---

## 📊 Performance Standards

### 1. Database Optimization

#### Index Strategy

```sql
-- ✅ Essential indexes
CREATE INDEX idx_customer_name_norm ON customers(company_name_norm);
CREATE INDEX idx_customer_status ON customers(status);
CREATE INDEX idx_customer_tier ON customers(tier);
CREATE INDEX idx_customer_district ON customers(district);
CREATE INDEX idx_invoice_due_date ON invoices(dueDate);
CREATE INDEX idx_contract_end_date ON contracts(endDate);
```

#### Query Optimization

```typescript
// ✅ Use raw SQL for complex aggregations
const stats = await prisma.$queryRaw`
  SELECT
    COUNT(*) FILTER (WHERE status != 'TERMINATED') as total,
    COUNT(*) FILTER (WHERE status = 'ACTIVE') as active,
    SUM(monthlyFee) FILTER (WHERE status = 'ACTIVE') as recurring
  FROM customers c
  LEFT JOIN contracts ON contracts.customerId = c.id
`;
```

### 2. Frontend Performance

#### Code Splitting

```typescript
// ✅ Dynamic imports for heavy libraries
import dynamic from "next/dynamic";

const RevenueChart = dynamic(
  () => import("@/components/analytics/revenue-chart"),
  {
    loading: () => <Skeleton className="h-[400px]" />,
    ssr: false  // Skip SSR for client-only components
  }
);
```

#### Caching Strategy

```typescript
// ✅ React Query for server state
const { data: customers } = useQuery({
  queryKey: ["customers", { page, search }],
  queryFn: () => getCustomers({ page, search }),
  staleTime: 1000 * 60 * 5, // 5 minutes
});
```

---

## 🎯 Code Review Checklist

### Before Submitting PR

- [ ] All tests pass (`pnpm test`)
- [ ] Type checking passes (`pnpm run typecheck`)
- [ ] Linting passes (`pnpm run lint:fix`)
- [ ] Formatting is correct (`pnpm run format`)
- [ ] Build succeeds (`pnpm run build`)
- [ ] Documentation updated
- [ ] Vietnamese text is correct
- [ ] Error handling implemented
- [ ] Security considerations addressed
- [ ] Performance optimized

### Code Quality

- [ ] No `any` types
- [ ] Proper error handling
- [ ] Consistent naming conventions
- [ ] Reusable components
- [ ] Test coverage > 95%
- [ ] Comments for complex logic

### Vietnamese Standards

- [ ] All user-facing text in Vietnamese
- [ ] Currency formatted as Vietnamese
- [ ] Dates in DD/MM/YYYY format
- [ ] Phone numbers in 0XX XXX XXXX format
- [ ] Error messages are clear and actionable

---

## 📚 Related Documentation

- **Architecture**: `./docs/system-architecture.md`
- **Codebase**: `./docs/codebase-summary.md`
- **PDR**: `./docs/project-overview-pdr.md`
- **Roadmap**: `./docs/project-roadmap.md`

---

**Document Version**: 1.0
**Last Updated**: December 22, 2025
**Status**: Active
**Next Review**: After Phase 3 completion
