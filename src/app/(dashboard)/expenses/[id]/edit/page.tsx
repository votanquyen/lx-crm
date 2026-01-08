import { getExpense } from "@/actions/expenses";
import { ExpenseForm } from "@/components/expenses/expense-form";
import { notFound } from "next/navigation";

interface EditExpensePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditExpensePage({ params }: EditExpensePageProps) {
  const { id } = await params;

  const result = await getExpense({ id });

  if (!result.success || !result.data) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      <ExpenseForm expense={result.data} mode="edit" />
    </div>
  );
}
