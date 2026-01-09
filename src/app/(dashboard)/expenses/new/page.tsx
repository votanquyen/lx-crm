import { ExpenseForm } from "@/components/expenses/expense-form";

export default function NewExpensePage() {
  return (
    <div className="mx-auto max-w-2xl p-6">
      <ExpenseForm mode="create" />
    </div>
  );
}
