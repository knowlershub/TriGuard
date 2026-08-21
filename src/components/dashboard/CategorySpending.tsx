import type { DashboardExpense } from "@/lib/dashboardApi";

type CategorySpendingProps = {
  expenses: DashboardExpense[];
};

export default function CategorySpending({
  expenses,
}: CategorySpendingProps) {
  const totals = new Map<string, number>();

  for (const expense of expenses) {
    const category = expense.category?.trim() || "Other";
    const amount = Number(expense.amount);

    totals.set(
      category,
      (totals.get(category) ?? 0) + amount
    );
  }

  const categories = Array.from(totals.entries())
    .map(([category, amount]) => ({
      category,
      amount,
    }))
    .sort((a, b) => b.amount - a.amount);

  const total = categories.reduce(
    (sum, category) => sum + category.amount,
    0
  );

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="font-semibold text-slate-950">
            Where your money is going
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Current-month spending by category.
          </p>
        </div>
      </div>

      {categories.length === 0 ? (
        <div className="py-8 text-center">
          <p className="font-medium text-slate-700">
            No spending yet
          </p>

          <p className="mt-1 text-sm text-slate-500">
            Your category breakdown will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {categories.slice(0, 5).map((item) => {
            const percentage =
              total > 0 ? (item.amount / total) * 100 : 0;

            return (
              <div key={item.category}>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-700">
                      {item.category}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-xs text-slate-400">
                      {percentage.toFixed(0)}%
                    </span>

                    <span className="text-sm font-semibold text-slate-950">
                      ₦{item.amount.toLocaleString("en-NG")}
                    </span>
                  </div>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-blue-600 transition-all duration-500"
                    style={{
                      width: `${Math.max(percentage, 2)}%`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}