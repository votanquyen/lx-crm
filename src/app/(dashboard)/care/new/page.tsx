/**
 * Create New Care Schedule Page
 */
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CareScheduleForm } from "@/components/care/care-schedule-form";
import { Skeleton } from "@/components/ui/skeleton";

interface NewCarePageProps {
  searchParams: Promise<{ date?: string; customerId?: string }>;
}

async function NewCareFormContent({ searchParams }: NewCarePageProps) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const params = await searchParams;

  // Fetch active customers
  const customers = await prisma.customer.findMany({
    where: {
      status: {
        in: ["ACTIVE", "INACTIVE"],
      },
    },
    select: {
      id: true,
      code: true,
      companyName: true,
      address: true,
      district: true,
    },
    orderBy: {
      companyName: "asc",
    },
  });

  // Fetch staff (users with STAFF or ADMIN role)
  const staff = await prisma.user.findMany({
    where: {
      role: {
        in: ["STAFF", "ADMIN"],
      },
    },
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  const defaultDate = params.date ? new Date(params.date) : undefined;
  const defaultCustomerId = params.customerId;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Tạo lịch chăm sóc mới</h1>
        <p className="mt-1 text-gray-600">Lên lịch chăm sóc cây thuê tại khách hàng</p>
      </div>

      <CareScheduleForm
        customers={customers}
        staff={staff}
        defaultDate={defaultDate}
        defaultCustomerId={defaultCustomerId}
      />
    </div>
  );
}

export default async function NewCarePage(props: NewCarePageProps) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-4xl space-y-6">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-96 w-full" />
        </div>
      }
    >
      <NewCareFormContent searchParams={props.searchParams} />
    </Suspense>
  );
}
