/**
 * Care Schedule Completion Page
 * Staff completes care tasks with photos and assessments
 */
import { Suspense } from "react";
import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CareCompletionForm } from "@/components/care/care-completion-form";
import { Skeleton } from "@/components/ui/skeleton";

interface CompletePageProps {
  params: Promise<{ id: string }>;
}

async function CompletionFormContent({ params }: CompletePageProps) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;

  const schedule = await prisma.careSchedule.findUnique({
    where: { id },
    include: {
      customer: {
        select: {
          id: true,
          code: true,
          companyName: true,
          address: true,
          district: true,
        },
      },
    },
  });

  if (!schedule) notFound();

  // Only allow completion for SCHEDULED or IN_PROGRESS schedules
  if (!["SCHEDULED", "IN_PROGRESS"].includes(schedule.status)) {
    redirect(`/care/${id}`);
  }

  return <CareCompletionForm schedule={schedule} />;
}

export default async function CompleteCarePage(props: CompletePageProps) {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-96 w-full" />
        </div>
      }
    >
      <CompletionFormContent params={props.params} />
    </Suspense>
  );
}
