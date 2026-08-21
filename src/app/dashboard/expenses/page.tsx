"use client";

import { useEffect, useState } from "react";

import ReceiptScanner from "@/components/expenses/ReceiptScanner";
import Sidebar from "@/components/layout/Sidebar";
import MobileNav from "@/components/layout/MobileNav";
import SpendingBreakdown from "@/components/expenses/SpendingBreakdown";
import AddExpense from "@/components/expenses/AddExpense";

import {
  getDashboardData,
  type DashboardData,
} from "@/lib/dashboardApi";

export default function ExpensesPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadExpenses() {
    const testUserId = process.env.NEXT_PUBLIC_TEST_USER_ID;

    if (!testUserId) {
      throw new Error(
        "NEXT_PUBLIC_TEST_USER_ID is not configured."
      );
    }

    const freshData = await getDashboardData(testUserId);
    setData(freshData);
  }

  useEffect(() => {
    loadExpenses().catch((err) => {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load expenses."
      );
    });
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex min-h-screen">
        <Sidebar />

        <main className="min-w-0 flex-1 pb-24 lg:pb-0">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            <div className="mb-8">
              <p className="text-sm font-medium text-slate-500">
                Money Guard
              </p>

              <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
                Expenses
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                Your actual transactions from TriGuard.
              </p>
            </div>

            {error && (
              <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
                {error}
              </div>
            )}

            {!data && !error && (
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                  {[1, 2, 3].map((item) => (
                    <div
                      key={item}
                      className="h-32 animate-pulse rounded-2xl bg-slate-200"
                    />
                  ))}
                </div>

                <div className="h-40 animate-pulse rounded-2xl bg-slate-200" />
              </div>
            )}

            {data && (
              <>
                {/* Summary */}
                <section className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-sm text-slate-500">
                      This month
                    </p>

                    <p className="mt-2 text-2xl font-bold text-slate-950">
                      ₦{data.summary.monthTotal.toLocaleString("en-NG")}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-sm text-slate-500">
                      This week
                    </p>

                    <p className="mt-2 text-2xl font-bold text-slate-950">
                      ₦{data.summary.weekTotal.toLocaleString("en-NG")}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-sm text-slate-500">
                      Transactions this month
                    </p>

                    <p className="mt-2 text-2xl font-bold text-slate-950">
                      {data.summary.transactionCount}
                    </p>
                  </div>
                </section>

                {/* Manual expense entry */}
                <section className="mt-6">
                  <AddExpense onUpdated={setData} />
                </section>

                {/* Receipt OCR */}
                <section className="mt-6">
                  <ReceiptScanner onSaved={loadExpenses} />
                </section>

                {/* Spending breakdown */}
                <section className="mt-6">
                  <SpendingBreakdown expenses={data.expenses} />
                </section>

                {/* Recent expenses */}
                <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-100 px-5 py-4">
                    <h2 className="font-semibold text-slate-950">
                      Recent expenses
                    </h2>

                    <p className="mt-1 text-xs text-slate-500">
                      Your latest transactions from TriGuard.
                    </p>
                  </div>

                  {data.expenses.length === 0 ? (
                    <div className="px-5 py-12 text-center">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-xl">
                        ₦
                      </div>

                      <p className="mt-4 font-medium text-slate-700">
                        No expenses yet
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        Add your first expense above.
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {data.expenses.map((expense) => (
                        <div
                          key={expense.id}
                          className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 font-semibold text-slate-700">
                              ₦
                            </div>

                            <div className="min-w-0">
                              <p className="font-semibold text-slate-900">
                                {expense.merchant ||
                                  expense.category ||
                                  "Expense"}
                              </p>

                              <p className="mt-1 text-xs text-slate-500">
                                {expense.category ||
                                  "Uncategorized"}{" "}
                                · {expense.source} ·{" "}
                                {new Date(
                                  expense.occurredAt
                                ).toLocaleString("en-NG")}
                              </p>
                            </div>
                          </div>

                          <p className="font-bold text-slate-950">
                            ₦{expense.amount.toLocaleString("en-NG")}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </>
            )}
          </div>
        </main>
      </div>

      <MobileNav />
    </div>
  );
}