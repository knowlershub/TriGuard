"use client";

import type { DashboardExpense } from "@/lib/dashboardApi";

type SpendingBreakdownProps = {
  expenses: DashboardExpense[];
};

export default function SpendingBreakdown({
  expenses,
}: SpendingBreakdownProps) {
  const totals = new Map<string, number>();

  for (const expense of expenses) {
    const category = expense.category?.trim() || "Other";
    const amount = Number(expense.amount);

    totals.set(category, (totals.get(category) ?? 0) + amount);
  }

  const breakdown = Array.from(totals.entries())
    .map(([category, amount]) => ({
      category,
      amount,
    }))
    .sort((a, b) => b.amount - a.amount);

  const total = breakdown.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5">
        <h2 className="font-semibold text-slate-950">
          Spending breakdown
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Where your recent money is going.
        </p>
      </div>

      {breakdown.length === 0 ? (
        <div className="py-8 text-center">
          <p className="font-medium text-slate-700">
            No spending data yet
          </p>

          <p className="mt-1 text-sm text-slate-500">
            Your categories will appear here after expenses are logged.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {breakdown.slice(0, 6).map((item) => {
            const percentage =
              total > 0 ? (item.amount / total) * 100 : 0;

            return (
              <div key={item.category}>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-slate-700">
                    {item.category}
                  </span>

                  <div className="flex items-center gap-2">
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
                    className="h-full rounded-full bg-blue-600 transition-all"
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