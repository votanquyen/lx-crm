# Tech Stack Documentation Reference

Comprehensive documentation reference for Lộc Xanh CRM tech stack.

---

## Next.js 15

### Official Documentation
- **Main Docs**: https://nextjs.org/docs
- **App Router**: https://nextjs.org/docs/app
- **Server Actions**: https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations
- **API Routes**: https://nextjs.org/docs/app/building-your-application/routing/route-handlers

### Key Concepts

#### App Router Architecture
- **File-based routing** in `app/` directory
- **Layouts** for shared UI across routes
- **Server Components** by default (RSC)
- **Client Components** with `'use client'` directive

#### Server Actions
```typescript
'use server'

export async function createCustomer(formData: FormData) {
  const name = formData.get('name')
  // Database operations
  await prisma.customer.create({ data: { name } })
  revalidatePath('/customers')
}
```

#### Data Fetching Patterns
- **Server Components**: Direct database queries, no API needed
- **Client Components**: Use React Query for client-side fetching
- **Streaming**: Use `loading.tsx` and Suspense boundaries
- **Caching**: Automatic request memoization, opt-out with `{ cache: 'no-store' }`

#### Best Practices
- Use Server Components by default
- Only use Client Components when needed (interactivity, hooks, browser APIs)
- Leverage Server Actions for mutations
- Use `revalidatePath()` or `revalidateTag()` for cache invalidation
- Implement proper error boundaries with `error.tsx`

---

## React 19

### Official Documentation
- **Main Docs**: https://react.dev
- **React 19 Release**: https://react.dev/blog/2024/12/05/react-19
- **Hooks Reference**: https://react.dev/reference/react

### New Features in React 19

#### 1. Actions
Built-in support for async functions in transitions:
```typescript
function UpdateName({ name }) {
  const [isPending, startTransition] = useTransition()

  const updateName = async (formData: FormData) => {
    startTransition(async () => {
      await updateCustomerName(formData)
    })
  }

  return <form action={updateName}>...</form>
}
```

#### 2. useFormStatus Hook
Access form submission state:
```typescript
import { useFormStatus } from 'react-dom'

function SubmitButton() {
  const { pending } = useFormStatus()
  return <button disabled={pending}>Submit</button>
}
```

#### 3. useOptimistic Hook
Optimistic UI updates:
```typescript
function TodoList({ todos }) {
  const [optimisticTodos, addOptimisticTodo] = useOptimistic(
    todos,
    (state, newTodo) => [...state, newTodo]
  )

  return (
    <form action={async (formData) => {
      const newTodo = { id: Date.now(), text: formData.get('todo') }
      addOptimisticTodo(newTodo)
      await createTodo(formData)
    }}>
      {optimisticTodos.map(todo => <li key={todo.id}>{todo.text}</li>)}
    </form>
  )
}
```

#### 4. use() Hook
Unwrap promises and context in render:
```typescript
function CustomerData({ customerPromise }) {
  const customer = use(customerPromise)
  return <div>{customer.name}</div>
}
```

#### Best Practices
- Embrace Server Components + Server Actions pattern
- Use `useOptimistic` for better UX during mutations
- Leverage `useFormStatus` for form state
- Avoid unnecessary client boundaries

---

## TypeScript 5.7+

### Official Documentation
- **Main Docs**: https://www.typescriptlang.org/docs
- **Handbook**: https://www.typescriptlang.org/docs/handbook/intro.html
- **tsconfig Reference**: https://www.typescriptlang.org/tsconfig

### Key Configuration for Next.js
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2023", "DOM", "DOM.Iterable"],
    "jsx": "preserve",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "allowJs": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### Best Practices
- Enable `strict` mode always
- Use proper type imports: `import type { User } from './types'`
- Define Prisma types: `type Customer = Prisma.CustomerGetPayload<{}>`
- Use Zod for runtime validation + type inference
- Avoid `any` - use `unknown` for truly unknown types

---

## Prisma ORM

### Official Documentation
- **Main Docs**: https://www.prisma.io/docs
- **Schema Reference**: https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference
- **Client API**: https://www.prisma.io/docs/reference/api-reference/prisma-client-reference
- **PostgreSQL**: https://www.prisma.io/docs/concepts/database-connectors/postgresql

### Schema Example
```prisma
generator client {
  provider = "prisma-client-js"
  previewFeatures = ["postgresqlExtensions"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  extensions = [postgis]
}

model Customer {
  id        String   @id @default(cuid())
  name      String
  email     String   @unique
  phone     String?
  address   String?
  location  Unsupported("geography(Point,4326)")?
  orders    Order[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([email])
  @@map("customers")
}

model Order {
  id         String   @id @default(cuid())
  customerId String
  customer   Customer @relation(fields: [customerId], references: [id], onDelete: Cascade)
  status     OrderStatus
  total      Decimal  @db.Decimal(10, 2)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@index([customerId])
  @@index([status])
  @@map("orders")
}

enum OrderStatus {
  PENDING
  CONFIRMED
  DELIVERED
  CANCELLED
}
```

### Common Queries
```typescript
// Create
const customer = await prisma.customer.create({
  data: { name: 'John', email: 'john@example.com' }
})

// Read with relations
const customerWithOrders = await prisma.customer.findUnique({
  where: { id: 'xxx' },
  include: { orders: true }
})

// Update
await prisma.customer.update({
  where: { id: 'xxx' },
  data: { name: 'Jane' }
})

// Delete
await prisma.customer.delete({ where: { id: 'xxx' } })

// Complex queries
const customers = await prisma.customer.findMany({
  where: {
    orders: { some: { status: 'PENDING' } }
  },
  orderBy: { createdAt: 'desc' },
  take: 10
})
```

### Migrations
```bash
# Development
pnpm db:migrate        # Create and apply migration
pnpm db:generate       # Generate Prisma Client
pnpm db:push          # Push schema without migration (prototyping)
pnpm db:studio        # Open Prisma Studio

# Production
pnpm db:migrate:prod  # Apply migrations in production
```

### Best Practices
- Use `@@map()` for custom table names (snake_case)
- Add indexes on foreign keys and frequently queried fields
- Use `onDelete: Cascade` for cleanup
- Leverage `select` to fetch only needed fields
- Use transactions for multi-table operations
- Enable preview features in schema when needed

---

## TailwindCSS

### Official Documentation
- **Main Docs**: https://tailwindcss.com/docs
- **Configuration**: https://tailwindcss.com/docs/configuration
- **Customization**: https://tailwindcss.com/docs/theme

### Configuration Example
```javascript
// tailwind.config.ts
import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        // ... other colors
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
export default config
```

### Common Patterns
```tsx
// Responsive design
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

// Flexbox centering
<div className="flex items-center justify-center min-h-screen">

// Card component
<div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">

// Button states
<button className="bg-primary hover:bg-primary/90 active:scale-95 transition-all">
```

### Best Practices
- Use CSS variables for theming (`hsl(var(--primary))`)
- Leverage `@apply` sparingly (prefer utilities)
- Use `cn()` utility for conditional classes
- Mobile-first responsive design
- Use consistent spacing scale

---

## shadcn/ui

### Official Documentation
- **Main Docs**: https://ui.shadcn.com
- **Components**: https://ui.shadcn.com/docs/components
- **Installation**: https://ui.shadcn.com/docs/installation/next

### Installation
```bash
# Initialize
npx shadcn-ui@latest init

# Add components
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add form
npx shadcn-ui@latest add table
npx shadcn-ui@latest add dialog
```

### Component Usage Examples

#### Button
```tsx
import { Button } from "@/components/ui/button"

<Button variant="default">Click me</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline" size="sm">Small</Button>
<Button variant="ghost">Ghost</Button>
```

#### Form with React Hook Form + Zod
```tsx
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

const formSchema = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email(),
})

function CustomerForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", email: "" },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    await createCustomer(values)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  )
}
```

#### Data Table
```tsx
import { DataTable } from "@/components/ui/data-table"
import { ColumnDef } from "@tanstack/react-table"

const columns: ColumnDef<Customer>[] = [
  { accessorKey: "name", header: "Name" },
  { accessorKey: "email", header: "Email" },
  { accessorKey: "phone", header: "Phone" },
]

function CustomersTable({ customers }: { customers: Customer[] }) {
  return <DataTable columns={columns} data={customers} />
}
```

### Best Practices
- Copy component source to `src/components/ui/` for customization
- Use Radix UI primitives (included via shadcn/ui)
- Combine with React Hook Form + Zod for forms
- Customize via `components.json` and CSS variables
- Use TanStack Table for complex data tables

---

## Additional Resources

### State Management
- **Zustand**: https://zustand-demo.pmnd.rs
- **TanStack Query**: https://tanstack.com/query/latest/docs/react/overview

### PostGIS (Geospatial)
- **PostGIS Docs**: https://postgis.net/documentation
- **Leaflet**: https://leafletjs.com
- **React Leaflet**: https://react-leaflet.js.org

### Authentication
- **NextAuth.js v5**: https://authjs.dev

---

## Project-Specific Patterns

### Server Action Pattern
```typescript
// app/actions/customers.ts
'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const createCustomerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
})

export async function createCustomer(data: FormData) {
  const validated = createCustomerSchema.parse({
    name: data.get('name'),
    email: data.get('email'),
  })

  const customer = await prisma.customer.create({ data: validated })
  revalidatePath('/customers')
  return customer
}
```

### API Route Pattern (when needed)
```typescript
// app/api/customers/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const customers = await prisma.customer.findMany()
  return NextResponse.json(customers)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const customer = await prisma.customer.create({ data: body })
  return NextResponse.json(customer, { status: 201 })
}
```

### File Structure
```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── layout.tsx
│   ├── (dashboard)/
│   │   ├── customers/
│   │   │   ├── page.tsx
│   │   │   ├── [id]/page.tsx
│   │   │   └── actions.ts
│   │   └── layout.tsx
│   ├── api/
│   │   └── customers/route.ts
│   └── layout.tsx
├── components/
│   ├── ui/              # shadcn/ui components
│   ├── customers/       # Feature components
│   └── layout/          # Layout components
├── lib/
│   ├── prisma.ts
│   ├── auth.ts
│   └── utils.ts
└── types/
    └── index.ts
```

---

**Last Updated**: December 2025
