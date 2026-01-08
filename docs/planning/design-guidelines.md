# Design Guidelines

**Lộc Xanh CRM - UI/UX Design Principles & Component Standards**
**Last Updated**: December 22, 2025
**Version**: 1.0

---

## Table of Contents

- [Design Philosophy](#design-philosophy)
- [Vietnamese-First Design](#vietnamese-first-design)
- [Color Palette](#color-palette)
- [Typography](#typography)
- [Component Architecture](#component-architecture)
- [Layout & Spacing](#layout--spacing)
- [Form Design](#form-design)
- [Data Display](#data-display)
- [Navigation Patterns](#navigation-patterns)
- [Loading & Feedback](#loading--feedback)
- [Accessibility](#accessibility)
- [Mobile Responsiveness](#mobile-responsiveness)
- [Performance Considerations](#performance-considerations)
- [Design System Components](#design-system-components)

---

## Design Philosophy

### Core Principles

**1. Vietnamese-First**
- All user-facing text in Vietnamese
- Currency: Vietnamese Dong (₫) with proper formatting
- Dates: DD/MM/YYYY format
- Phone numbers: 0XX XXX XXXX format
- Addresses: Vietnamese address hierarchy

**2. Clarity Over Decoration**
- Every element must serve a purpose
- White space is a design element, not wasted space
- Clear visual hierarchy
- Consistent patterns across all screens

**3. Accessibility First**
- WCAG 2.1 AA compliance
- Keyboard navigation support
- Screen reader compatibility
- Color contrast minimum 4.5:1
- Focus indicators on all interactive elements

**4. Performance-Centric**
- Fast initial load (< 2 seconds)
- Smooth interactions (60fps)
- Optimized images and assets
- Lazy loading for heavy content

**5. Mobile-Responsive**
- Mobile-first approach
- Touch-friendly targets (min 44x44px)
- Responsive breakpoints: 320px, 768px, 1024px, 1280px
- Offline-capable where possible

---

## Vietnamese-First Design

### Text & Content

**User-Facing Messages:**
```typescript
// ✅ Correct - Vietnamese
export const MESSAGES = {
  success: {
    created: "Tạo mới thành công",
    updated: "Cập nhật thành công",
    deleted: "Xóa thành công",
    saved: "Lưu thành công",
  },
  error: {
    required: "Trường này không được để trống",
    invalidPhone: "Số điện thoại không hợp lệ (VD: 0901234567)",
    invalidEmail: "Email không hợp lệ",
    duplicate: "Dữ liệu đã tồn tại",
    notFound: "Không tìm thấy dữ liệu",
    forbidden: "Bạn không có quyền truy cập",
    serverError: "Có lỗi xảy ra, vui lòng thử lại",
  },
  warning: {
    unsavedChanges: "Có thay đổi chưa được lưu",
    deleteConfirm: "Bạn có chắc muốn xóa?",
  },
} as const;
```

### Currency Formatting

```typescript
// ✅ Vietnamese currency format
export function formatCurrency(amount: number | Decimal): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(amount));
}

// Examples:
// 1000000 → "1.000.000 ₫"
// 123456789 → "123.456.789 ₫"
```

### Date & Time Formatting

```typescript
// ✅ Vietnamese date format
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

// Examples:
// formatDate(new Date()) → "22/12/2025"
// formatDateTime(new Date()) → "22/12/2025, 14:30"
```

### Phone Number Formatting

```typescript
// ✅ Vietnamese phone format
export function formatVietnamesePhone(phone: string): string {
  // Remove all non-digits
  const cleaned = phone.replace(/\D/g, "");

  // Format: 090 123 4567
  return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, "$1 $2 $3");
}

// Examples:
// "0901234567" → "090 123 4567"
// "0359876543" → "035 987 6543"
```

### Address Display

```typescript
// ✅ Vietnamese address format
export function formatAddress(
  street: string,
  ward: string,
  district: string,
  city: string = "TP.HCM"
): string {
  return `${street}, ${ward}, ${district}, ${city}`;
}

// Example:
// formatAddress("123 Đường Lê Lợi", "Phường Bến Nghé", "Quận 1")
// → "123 Đường Lê Lợi, Phường Bến Nghé, Quận 1, TP.HCM"
```

---

## Color Palette

### Primary Colors

```css
:root {
  /* Brand Colors */
  --primary-50: #f0fdf4;   /* Lightest */
  --primary-100: #dcfce7;
  --primary-200: #bbf7d0;
  --primary-300: #86efac;
  --primary-400: #4ade80;
  --primary-500: #22c55e;  /* Main brand */
  --primary-600: #16a34a;
  --primary-700: #15803d;
  --primary-800: #166534;
  --primary-900: #14532d;  /* Darkest */

  /* Secondary - Plant Green */
  --secondary-500: #10b981;
  --secondary-600: #059669;

  /* Accent - Nature */
  --accent-500: #84cc16;
}
```

### Neutral Colors

```css
:root {
  /* Grays */
  --gray-50: #f9fafb;
  --gray-100: #f3f4f6;
  --gray-200: #e5e7eb;
  --gray-300: #d1d5db;
  --gray-400: #9ca3af;
  --gray-500: #6b7280;
  --gray-600: #4b5563;
  --gray-700: #374151;
  --gray-800: #1f2937;
  --gray-900: #111827;

  /* Semantic */
  --text-primary: var(--gray-900);
  --text-secondary: var(--gray-600);
  --text-tertiary: var(--gray-500);
  --border: var(--gray-200);
  --border-hover: var(--gray-300);
  --background: #ffffff;
  --background-alt: var(--gray-50);
}
```

### Semantic Colors

```css
:root {
  /* Success */
  --success-50: #f0fdf4;
  --success-500: #22c55e;
  --success-600: #16a34a;

  /* Warning */
  --warning-50: #fffbeb;
  --warning-500: #f59e0b;
  --warning-600: #d97706;

  /* Error */
  --error-50: #fef2f2;
  --error-500: #ef4444;
  --error-600: #dc2626;

  /* Info */
  --info-50: #eff6ff;
  --info-500: #3b82f6;
  --info-600: #2563eb;
}
```

### Usage Examples

```typescript
// Button variants
const buttonVariants = {
  primary: "bg-primary-500 hover:bg-primary-600 text-white",
  secondary: "bg-secondary-500 hover:bg-secondary-600 text-white",
  success: "bg-success-500 hover:bg-success-600 text-white",
  warning: "bg-warning-500 hover:bg-warning-600 text-white",
  error: "bg-error-500 hover:bg-error-600 text-white",
  outline: "border border-gray-300 hover:border-gray-400 text-gray-700",
  ghost: "hover:bg-gray-100 text-gray-700",
} as const;
```

---

## Typography

### Font Family

```css
:root {
  /* Primary - System fonts for performance */
  --font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
               "Helvetica Neue", Arial, sans-serif;

  /* Vietnamese support */
  --font-vietnamese: "SF Pro VN", "Segoe UI", system-ui, sans-serif;

  /* Monospace for code/data */
  --font-mono: "SF Mono", Monaco, "Cascadia Code", "Roboto Mono", monospace;
}
```

### Font Sizes & Scale

```css
:root {
  /* Base: 16px (1rem) */

  /* Text sizes */
  --text-xs: 0.75rem;    /* 12px */
  --text-sm: 0.875rem;   /* 14px */
  --text-base: 1rem;     /* 16px */
  --text-lg: 1.125rem;   /* 18px */
  --text-xl: 1.25rem;    /* 20px */
  --text-2xl: 1.5rem;    /* 24px */
  --text-3xl: 1.875rem;  /* 30px */
  --text-4xl: 2.25rem;   /* 36px */

  /* Line heights */
  --leading-none: 1;
  --leading-tight: 1.25;
  --leading-normal: 1.5;
  --leading-relaxed: 1.75;
}
```

### Font Weights

```css
:root {
  --font-light: 300;
  --font-normal: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;
}
```

### Typography Scale

```typescript
// Typography scale for components
export const typography = {
  // Headings
  h1: { size: "text-4xl", weight: "font-bold", leading: "leading-tight" },
  h2: { size: "text-3xl", weight: "font-bold", leading: "leading-tight" },
  h3: { size: "text-2xl", weight: "font-semibold", leading: "leading-normal" },
  h4: { size: "text-xl", weight: "font-semibold", leading: "leading-normal" },

  // Body
  bodyLarge: { size: "text-lg", weight: "font-normal", leading: "leading-relaxed" },
  bodyBase: { size: "text-base", weight: "font-normal", leading: "leading-normal" },
  bodySmall: { size: "text-sm", weight: "font-normal", leading: "leading-normal" },
  bodyTiny: { size: "text-xs", weight: "font-normal", leading: "leading-none" },

  // Labels & Buttons
  label: { size: "text-sm", weight: "font-medium", leading: "leading-none" },
  button: { size: "text-base", weight: "font-medium", leading: "leading-none" },

  // Data display
  dataValue: { size: "text-lg", weight: "font-semibold", leading: "leading-normal" },
  dataLabel: { size: "text-sm", weight: "font-medium", leading: "leading-none" },
} as const;
```

---

## Component Architecture

### Component Structure

```
src/components/
├── ui/                    # Base UI components (shadcn/ui)
│   ├── button.tsx
│   ├── card.tsx
│   ├── dialog.tsx
│   ├── form.tsx
│   ├── input.tsx
│   ├── table.tsx
│   └── ...
├── features/              # Feature-specific components
│   ├── customers/
│   │   ├── customer-form.tsx
│   │   ├── customer-search.tsx
│   │   └── customer-card.tsx
│   ├── contracts/
│   ├── invoices/
│   └── ...
├── shared/                # Shared components
│   ├── loading-skeleton.tsx
│   ├── error-boundary.tsx
│   ├── data-table.tsx
│   └── ...
└── analytics/             # Charts & visualizations
    ├── revenue-dashboard.tsx
    └── ...
```

### Component Pattern

**Standard Component Template:**
```typescript
// ✅ Standard component structure
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// 1. Variants (if applicable)
const componentVariants = cva("base-classes", {
  variants: {
    variant: {
      primary: "bg-primary-500 text-white",
      secondary: "bg-gray-200 text-gray-900",
    },
    size: {
      sm: "px-3 py-1 text-sm",
      md: "px-4 py-2 text-base",
      lg: "px-6 py-3 text-lg",
    },
  },
  defaultVariants: {
    variant: "primary",
    size: "md",
  },
});

// 2. Props interface
interface ComponentProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof componentVariants> {
  loading?: boolean;
  disabled?: boolean;
  // Add custom props
}

// 3. Component
export const Component = React.forwardRef<HTMLDivElement, ComponentProps>(
  ({ className, variant, size, loading, disabled, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(componentVariants({ variant, size, className }))}
        data-loading={loading}
        data-disabled={disabled}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Component.displayName = "Component";
```

### Server Component Pattern

```typescript
// ✅ Server component with data fetching
import { Suspense } from "react";
import { CustomerCard } from "@/components/features/customers/customer-card";
import { CustomerListSkeleton } from "@/components/shared/loading-skeleton";

interface CustomerListProps {
  page?: number;
  search?: string;
}

export default async function CustomerList({ page = 1, search = "" }: CustomerListProps) {
  const customers = await getCustomers({ page, search });

  return (
    <div className="space-y-4">
      {customers.map((customer) => (
        <CustomerCard key={customer.id} customer={customer} />
      ))}
    </div>
  );
}

// Usage with Suspense
<Suspense fallback={<CustomerListSkeleton />}>
  <CustomerList page={1} search={searchQuery} />
</Suspense>
```

### Client Component Pattern

```typescript
// ✅ Client component with interactions
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { customerSchema, CustomerInput } from "@/lib/validations/customer";
import { createCustomer } from "@/actions/customers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function CustomerForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CustomerInput>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      companyName: "",
      address: "",
    },
  });

  const onSubmit = async (data: CustomerInput) => {
    setIsSubmitting(true);
    try {
      const result = await createCustomer(data);
      if (result.success) {
        form.reset();
        // Show success toast
      } else {
        // Show error toast
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <Input
        {...form.register("companyName")}
        placeholder="Tên công ty"
        error={form.formState.errors.companyName?.message}
      />
      <Button type="submit" loading={isSubmitting}>
        Lưu
      </Button>
    </form>
  );
}
```

---

## Layout & Spacing

### Grid System

```css
/* ✅ 12-column responsive grid */
.container {
  width: 100%;
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 1rem;
}

.grid {
  display: grid;
  gap: 1rem;
}

/* Responsive columns */
.grid-cols-1 { grid-template-columns: repeat(1, 1fr); }
.grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
.grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
.grid-cols-4 { grid-template-columns: repeat(4, 1fr); }

@media (min-width: 768px) {
  .md\:grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
  .md\:grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
  .md\:grid-cols-4 { grid-template-columns: repeat(4, 1fr); }
}

@media (min-width: 1024px) {
  .lg\:grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
  .lg\:grid-cols-4 { grid-template-columns: repeat(4, 1fr); }
  .lg\:grid-cols-6 { grid-template-columns: repeat(6, 1fr); }
}
```

### Spacing Scale

```css
:root {
  /* 4px base unit */
  --space-1: 0.25rem;  /* 4px */
  --space-2: 0.5rem;   /* 8px */
  --space-3: 0.75rem;  /* 12px */
  --space-4: 1rem;     /* 16px */
  --space-5: 1.25rem;  /* 20px */
  --space-6: 1.5rem;   /* 24px */
  --space-8: 2rem;     /* 32px */
  --space-10: 2.5rem;  /* 40px */
  --space-12: 3rem;    /* 48px */
  --space-16: 4rem;    /* 64px */
  --space-20: 5rem;    /* 80px */
}
```

### Common Layout Patterns

**Dashboard Layout:**
```typescript
// ✅ Dashboard with sidebar
export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-bold text-primary-600">Lộc Xanh</h1>
        </div>
        <nav className="p-4 space-y-2">
          {/* Navigation items */}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
```

**Card Layout:**
```typescript
// ✅ Card component
export function Card({ children, className }: CardProps) {
  return (
    <div className={cn(
      "bg-white rounded-lg border border-gray-200",
      "shadow-xs hover:shadow-md transition-shadow",
      className
    )}>
      {children}
    </div>
  );
}

// Usage
<Card className="p-6">
  <CardHeader>
    <CardTitle>Customer Details</CardTitle>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
  <CardFooter>
    <Button>Save</Button>
  </CardFooter>
</Card>
```

---

## Form Design

### Form Structure

```typescript
// ✅ Standard form pattern
export function CustomerForm({ initialData }: { initialData?: Customer }) {
  const form = useForm<CustomerInput>({
    resolver: zodResolver(customerSchema),
    defaultValues: initialData || {
      companyName: "",
      address: "",
      contactPhone: "",
      tier: "STANDARD",
    },
  });

  const onSubmit = async (data: CustomerInput) => {
    const result = initialData
      ? await updateCustomer({ id: initialData.id, ...data })
      : await createCustomer(data);

    if (result.success) {
      toast.success("Lưu thành công");
      router.push(`/customers/${result.data.id}`);
    } else {
      toast.error(result.error);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormInput
          control={form.control}
          name="companyName"
          label="Tên công ty"
          required
        />
        <FormInput
          control={form.control}
          name="contactPhone"
          label="Số điện thoại"
          placeholder="090 123 4567"
        />
      </div>

      <FormTextarea
        control={form.control}
        name="address"
        label="Địa chỉ"
        required
      />

      <FormSelect
        control={form.control}
        name="tier"
        label="Cấp độ"
        options={[
          { value: "STANDARD", label: "Tiêu chuẩn" },
          { value: "PREMIUM", label: "Cao cấp" },
          { value: "VIP", label: "VIP" },
        ]}
      />

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Hủy
        </Button>
        <Button type="submit" loading={form.formState.isSubmitting}>
          Lưu
        </Button>
      </div>
    </form>
  );
}
```

### Form Components

```typescript
// ✅ Reusable form components
export function FormInput({
  control,
  name,
  label,
  required,
  placeholder,
}: FormInputProps) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <FormItem>
          <FormLabel>
            {label}
            {required && <span className="text-error-500 ml-1">*</span>}
          </FormLabel>
          <FormControl>
            <Input
              {...field}
              placeholder={placeholder}
              error={fieldState.error?.message}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
```

### Validation & Error Display

```typescript
// ✅ Real-time validation with Vietnamese messages
export const customerSchema = z.object({
  companyName: z
    .string()
    .min(1, "Tên công ty không được để trống")
    .max(255, "Tên công ty tối đa 255 ký tự"),

  contactPhone: z
    .string()
    .regex(/^0[0-9]{9}$/, "Số điện thoại không hợp lệ (VD: 0901234567)")
    .optional()
    .nullable()
    .or(z.literal("")),

  address: z
    .string()
    .min(1, "Địa chỉ không được để trống")
    .max(500, "Địa chỉ tối đa 500 ký tự"),

  tier: z.enum(["STANDARD", "PREMIUM", "VIP"]).default("STANDARD"),

  floorCount: z
    .number()
    .int()
    .positive("Số tầng phải lớn hơn 0")
    .optional()
    .nullable(),
});
```

---

## Data Display

### Table Design

```typescript
// ✅ Data table with sorting and filtering
export function CustomerTable({ data }: { data: Customer[] }) {
  const [sortField, setSortField] = useState<keyof Customer>("companyName");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const sortedData = [...data].sort((a, b) => {
    const aVal = a[sortField];
    const bVal = b[sortField];
    if (aVal === bVal) return 0;
    const direction = sortDirection === "asc" ? 1 : -1;
    return aVal > bVal ? direction : -direction;
  });

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer"
              onClick={() => {
                setSortField("companyName");
                setSortDirection(d => d === "asc" ? "desc" : "asc");
              }}
            >
              Tên công ty {sortField === "companyName" && (sortDirection === "asc" ? "↑" : "↓")}
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Địa chỉ
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Cấp độ
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Trạng thái
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
              Hành động
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sortedData.map((customer) => (
            <tr key={customer.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-medium text-gray-900">
                {customer.companyName}
              </td>
              <td className="px-4 py-3 text-gray-600 text-sm">
                {customer.address}
              </td>
              <td className="px-4 py-3">
                <Badge variant={customer.tier === "VIP" ? "success" : "default"}>
                  {customer.tier}
                </Badge>
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={customer.status} />
              </td>
              <td className="px-4 py-3 text-right">
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/customers/${customer.id}`}>Xem</Link>
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

### Card Design

```typescript
// ✅ Statistic card
export function StatCard({
  title,
  value,
  change,
  icon
}: StatCardProps) {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
        </div>
        <div className="p-3 bg-primary-50 rounded-full">
          {icon}
        </div>
      </div>
      {change && (
        <div className="mt-4 flex items-center text-sm">
          <span className={cn(
            "font-medium",
            change > 0 ? "text-success-600" : "text-error-600"
          )}>
            {change > 0 ? "↑" : "↓"} {Math.abs(change)}%
          </span>
          <span className="text-gray-500 ml-2">so với tháng trước</span>
        </div>
      )}
    </Card>
  );
}
```

### Data Display Patterns

```typescript
// ✅ Empty state
export function EmptyState({
  icon,
  title,
  description,
  action
}: EmptyStateProps) {
  return (
    <div className="text-center py-12">
      <div className="inline-block p-4 bg-gray-50 rounded-full mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-medium text-gray-900">{title}</h3>
      <p className="text-sm text-gray-500 mt-1">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

// Usage
<EmptyState
  icon={<Users className="h-8 w-8 text-gray-400" />}
  title="Chưa có khách hàng"
  description="Bấm vào nút bên dưới để tạo khách hàng mới"
  action={<Button asChild><Link href="/customers/new">Thêm khách hàng</Link></Button>}
/>
```

---

## Navigation Patterns

### Sidebar Navigation

```typescript
// ✅ Main navigation
export function SidebarNav() {
  const pathname = usePathname();

  const navItems = [
    { href: "/dashboard", label: "Tổng quan", icon: LayoutDashboard },
    { href: "/customers", label: "Khách hàng", icon: Users },
    { href: "/contracts", label: "Hợp đồng", icon: FileText },
    { href: "/invoices", label: "Hóa đơn", icon: CreditCard },
    { href: "/care", label: "Chăm sóc", icon: Calendar },
    { href: "/exchanges", label: "Đổi cây", icon: RefreshCw },
    { href: "/analytics", label: "Thống kê", icon: ChartLine },
    { href: "/admin", label: "Quản trị", icon: Settings },
  ];

  return (
    <nav className="space-y-1">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
              isActive
                ? "bg-primary-50 text-primary-600"
                : "text-gray-700 hover:bg-gray-100"
            )}
          >
            <item.icon className={cn(
              "h-5 w-5",
              isActive ? "text-primary-600" : "text-gray-400"
            )} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
```

### Breadcrumb Navigation

```typescript
// ✅ Breadcrumb component
export function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav className="flex" aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2">
        {items.map((item, index) => (
          <li key={item.href} className="flex items-center">
            {index > 0 && (
              <ChevronRight className="h-4 w-4 text-gray-400 mx-2" />
            )}
            <Link
              href={item.href}
              className={cn(
                "text-sm font-medium",
                index === items.length - 1
                  ? "text-gray-900"
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ol>
    </nav>
  );
}

// Usage
<Breadcrumb items={[
  { href: "/dashboard", label: "Trang chủ" },
  { href: "/customers", label: "Khách hàng" },
  { href: "/customers/123", label: "Công ty ABC" },
]} />
```

### Tab Navigation

```typescript
// ✅ Tab navigation
export function Tabs({ tabs, value, onChange }: TabsProps) {
  return (
    <div className="border-b border-gray-200">
      <nav className="-mb-px flex space-x-8">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => onChange(tab.value)}
            className={cn(
              "whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors",
              value === tab.value
                ? "border-primary-500 text-primary-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            )}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
```

---

## Loading & Feedback

### Loading States

```typescript
// ✅ Skeleton loaders
export function CardSkeleton() {
  return (
    <div className="rounded-lg border p-4 space-y-3 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-1/3"></div>
      <div className="h-8 bg-gray-200 rounded w-1/2"></div>
      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-12 bg-gray-200 rounded animate-pulse"></div>
      ))}
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-8 bg-gray-200 rounded w-1/4 animate-pulse"></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
      <TableSkeleton />
    </div>
  );
}
```

### Toast Notifications

```typescript
// ✅ Toast system
export function useToast() {
  const toast = useToastShadcn();

  return {
    success: (message: string) => {
      toast.toast({
        title: "Thành công",
        description: message,
        variant: "success",
      });
    },
    error: (message: string) => {
      toast.toast({
        title: "Lỗi",
        description: message,
        variant: "error",
      });
    },
    warning: (message: string) => {
      toast.toast({
        title: "Cảnh báo",
        description: message,
        variant: "warning",
      });
    },
    info: (message: string) => {
      toast.toast({
        title: "Thông tin",
        description: message,
        variant: "info",
      });
    },
  };
}

// Usage
const toast = useToast();

try {
  await createCustomer(data);
  toast.success("Khách hàng đã được tạo");
} catch (error) {
  toast.error("Có lỗi xảy ra khi tạo khách hàng");
}
```

### Loading Buttons

```typescript
// ✅ Button with loading state
export function LoadingButton({
  loading,
  children,
  ...props
}: LoadingButtonProps) {
  return (
    <Button {...props} disabled={loading || props.disabled}>
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {children}
    </Button>
  );
}
```

---

## Accessibility

### Color Contrast

```typescript
// ✅ Ensure minimum 4.5:1 contrast ratio
// Primary text on white background
const textColors = {
  primary: "text-gray-900",    // 15.9:1
  secondary: "text-gray-700",  // 7.0:1
  tertiary: "text-gray-500",   // 4.6:1 (minimum)
} as const;

// On colored backgrounds
const buttonColors = {
  primary: "bg-primary-600 text-white",  // 5.7:1
  secondary: "bg-gray-600 text-white",   // 5.7:1
  error: "bg-error-600 text-white",      // 5.7:1
} as const;
```

### Keyboard Navigation

```typescript
// ✅ Focus indicators
export const focusStyles = `
  focus:outline-hidden
  focus-visible:ring-2
  focus-visible:ring-primary-500
  focus-visible:ring-offset-2
  focus-visible:ring-offset-white
`;

// Usage
<button className={`... ${focusStyles}`}>
  Click me
</button>
```

### Screen Reader Support

```typescript
// ✅ ARIA labels and live regions
export function LoadingSpinner({ message }: { message?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={message || "Đang tải"}
      className="flex items-center space-x-2"
    >
      <svg className="animate-spin h-5 w-5 text-primary-500" viewBox="0 0 24 24">
        {/* spinner */}
      </svg>
      {message && <span>{message}</span>}
    </div>
  );
}

// Announce changes to screen readers
export function Announce({ message }: { message: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="sr-only"
    >
      {message}
    </div>
  );
}
```

### Form Accessibility

```typescript
// ✅ Accessible form fields
export function AccessibleInput({
  id,
  label,
  error,
  ...props
}: InputProps) {
  const describedBy = error ? `${id}-error` : undefined;

  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <input
        id={id}
        aria-describedby={describedBy}
        aria-invalid={!!error}
        className={cn(
          "w-full rounded-md border px-3 py-2 text-sm",
          error ? "border-error-500" : "border-gray-300 focus:border-primary-500"
        )}
        {...props}
      />
      {error && (
        <p id={id} className="text-sm text-error-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
```

---

## Mobile Responsiveness

### Mobile-First Breakpoints

```css
/* ✅ Mobile-first responsive design */
.container {
  width: 100%;
  padding: 0 1rem;
}

/* Mobile: 320px - 767px (default styles) */

/* Tablet: 768px - 1023px */
@media (min-width: 768px) {
  .container {
    max-width: 768px;
    margin: 0 auto;
  }

  .md\:grid-cols-2 {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Desktop: 1024px - 1279px */
@media (min-width: 1024px) {
  .container {
    max-width: 1024px;
  }

  .lg\:grid-cols-3 {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* Large Desktop: 1280px+ */
@media (min-width: 1280px) {
  .container {
    max-width: 1280px;
  }
}
```

### Touch-Friendly Targets

```typescript
// ✅ Minimum 44x44px touch targets
export const touchStyles = `
  min-h-[44px]
  min-w-[44px]
  p-2
`;

// Button example
<button className={`... ${touchStyles}`}>
  <Icon />
</button>

// Link example
<Link href="/dashboard" className={`... ${touchStyles}`}>
  Dashboard
</Link>
```

### Responsive Typography

```css
/* ✅ Fluid typography */
h1 {
  font-size: 1.875rem; /* 30px mobile */
  line-height: 2.25rem;
}

@media (min-width: 768px) {
  h1 {
    font-size: 2.25rem; /* 36px tablet */
    line-height: 2.5rem;
  }
}

@media (min-width: 1024px) {
  h1 {
    font-size: 3rem; /* 48px desktop */
    line-height: 1;
  }
}
```

### Mobile Navigation

```typescript
// ✅ Mobile hamburger menu
export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(!open)}
        aria-label="Menu"
      >
        <Menu className="h-6 w-6" />
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 bg-white">
          <div className="p-4">
            <Button
              variant="ghost"
              onClick={() => setOpen(false)}
              aria-label="Đóng menu"
            >
              <X className="h-6 w-6" />
            </Button>
          </div>
          <nav className="p-4 space-y-2">
            {/* Mobile navigation items */}
          </nav>
        </div>
      )}
    </>
  );
}
```

---

## Performance Considerations

### Image Optimization

```typescript
// ✅ Next.js Image component
import Image from "next/image";

export function OptimizedImage({ src, alt, ...props }: ImageProps) {
  return (
    <Image
      src={src}
      alt={alt}
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,..."
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      quality={75}
      {...props}
    />
  );
}
```

### Code Splitting

```typescript
// ✅ Dynamic imports for heavy components
import dynamic from "next/dynamic";

const RevenueChart = dynamic(
  () => import("@/components/analytics/revenue-chart"),
  {
    loading: () => <Skeleton className="h-[400px]" />,
    ssr: false, // Disable SSR for client-only components
  }
);

const MapComponent = dynamic(
  () => import("@/components/maps/customer-map"),
  {
    loading: () => <Skeleton className="h-[400px]" />,
    ssr: false,
  }
);
```

### Virtual Scrolling

```typescript
// ✅ For large lists
import { FixedSizeList as List } from "react-window";

export function VirtualizedList({ items }: { items: Customer[] }) {
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
    <div style={style}>
      <CustomerCard customer={items[index]} />
    </div>
  );

  return (
    <List
      height={600}
      itemCount={items.length}
      itemSize={100}
      width="100%"
    >
      {Row}
    </List>
  );
}
```

### Memoization

```typescript
// ✅ Prevent unnecessary re-renders
import { memo, useMemo } from "react";

export const CustomerCard = memo(({ customer }: { customer: Customer }) => {
  const formattedRevenue = useMemo(() => {
    return formatCurrency(customer.totalRevenue);
  }, [customer.totalRevenue]);

  return (
    <div>
      <h3>{customer.companyName}</h3>
      <p>{formattedRevenue}</p>
    </div>
  );
});

CustomerCard.displayName = "CustomerCard";
```

---

## Design System Components

### Component Library

**Available Components (from shadcn/ui):**
- Button
- Input
- Textarea
- Select
- Checkbox
- Radio Group
- Switch
- Slider
- Dialog
- Drawer
- Dropdown Menu
- Tabs
- Accordion
- Card
- Table
- Badge
- Alert
- Toast
- Skeleton
- Progress
- Avatar
- Calendar
- Date Picker

**Custom Components:**
- Data Table (with sorting/filtering)
- Search Bar (with debouncing)
- Pagination
- Status Badge
- Loading Spinner
- Empty State
- Error Boundary
- Form Builder
- Chart Components

### Component Usage Examples

```typescript
// ✅ Complete example: Customer list page
export default function CustomerListPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Khách hàng</h1>
          <p className="text-sm text-gray-500 mt-1">
            Quản lý thông tin khách hàng và hợp đồng
          </p>
        </div>
        <Button asChild>
          <Link href="/customers/new">
            <Plus className="mr-2 h-4 w-4" />
            Thêm khách hàng
          </Link>
        </Button>
      </div>

      {/* Search & Filters */}
      <div className="flex gap-4">
        <div className="flex-1">
          <Input
            placeholder="Tìm kiếm khách hàng..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select defaultValue="all">
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Lọc theo cấp độ" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="VIP">VIP</SelectItem>
            <SelectItem value="PREMIUM">Cao cấp</SelectItem>
            <SelectItem value="STANDARD">Tiêu chuẩn</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Data Table */}
      <Card>
        <Suspense fallback={<TableSkeleton />}>
          <CustomerTable search={search} page={page} />
        </Suspense>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Hiển thị kết quả {(page - 1) * 10 + 1} - {page * 10}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
          >
            Trước
          </Button>
          <Button
            variant="outline"
            onClick={() => setPage(p => p + 1)}
          >
            Sau
          </Button>
        </div>
      </div>
    </div>
  );
}
```

---

## Design Checklist

### Before Implementing a Component

- [ ] **Functionality**: Does it solve the user's problem?
- [ ] **Accessibility**: Is it keyboard navigable and screen reader friendly?
- [ ] **Responsiveness**: Does it work on mobile, tablet, and desktop?
- [ ] **Performance**: Is it optimized (lazy loading, memoization)?
- [ ] **Consistency**: Does it follow existing patterns?
- [ ] **Validation**: Are inputs validated with clear error messages?
- [ ] **Loading**: Are loading states implemented?
- [ ] **Error Handling**: Are error states handled gracefully?
- [ ] **Vietnamese**: Is all text in Vietnamese with proper formatting?
- [ ] **Testing**: Is it testable and covered by tests?

### Design Review Questions

1. **Clarity**: Can users understand what to do immediately?
2. **Efficiency**: Can users complete tasks quickly?
3. **Consistency**: Does it match existing patterns?
4. **Feedback**: Do users know what's happening?
5. **Error Prevention**: Are mistakes prevented or easy to fix?
6. **Accessibility**: Can everyone use it?
7. **Performance**: Does it load fast and run smoothly?

---

## Related Documentation

- **Code Standards**: `./code-standards.md`
- **System Architecture**: `./system-architecture.md`
- **Codebase Summary**: `./codebase-summary.md`
- **Project Roadmap**: `./project-roadmap.md`

---

## Changelog

| Date | Version | Changes |
|------|---------|---------|
| 2025-12-22 | 1.0.0 | Initial design guidelines with Vietnamese-first principles, component patterns, and accessibility standards |

---

## Unresolved Questions

1. **Design Tokens**: Should we create a formal design tokens system (CSS variables vs. Tailwind config)?
2. **Dark Mode**: When to implement dark mode support?
3. **Custom Theme**: Should we create a custom Tailwind theme for Lộc Xanh brand colors?
4. **Figma Integration**: Should we document Figma file structure and handoff process?
5. **Component Library**: Should we publish internal components as a private package?

**Next Review**: After Phase 3 completion (Performance Optimization)