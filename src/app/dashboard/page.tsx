"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import Sidebar from "@/components/layout/Sidebar";
import MobileNav from "@/components/layout/MobileNav";

import DashboardHeader from "@/components/dashboard/DashboardHeader";
import SpendingCard from "@/components/dashboard/SpendingCard";
import TaskCard from "@/components/dashboard/TaskCard";
import LeakAlert from "@/components/dashboard/LeakAlert";
import RecentActivity from "@/components/dashboard/RecentActivity";
import DailyBrief from "@/components/dashboard/DailyBrief";
import QuickActions from "@/components/dashboard/QuickActions";
import CommandBar from "@/components/dashboard/CommandBar";
import CategorySpending from "@/components/dashboard/CategorySpending";

import {
  getDashboardData,
  type DashboardData,
} from "@/lib/dashboardApi";

function LoadingState() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((item) => (
          <div
            key={item}
            className="h-32 animate-pulse rounded-2xl bg-slate-200"
          />
        ))}
      </div>

      <div className="h-24 animate-pulse rounded-2xl bg-slate-200" />

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <div className="h-64 animate-pulse rounded-2xl bg-slate-200" />
        <div className="h-64 animate-pulse rounded-2xl bg-slate-200" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  async function loadDashboard() {
    const testUserId = process.env.NEXT_PUBLIC_TEST_USER_ID;

    if (!testUserId) {
      throw new Error(
        "NEXT_PUBLIC_TEST_USER_ID is not configured."
      );
    }

    return getDashboardData(testUserId);
  }

  async function refresh() {
    setRefreshing(true);
    setError(null);

    try {
      const freshData = await loadDashboard();
      setData(freshData);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load dashboard."
      );
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex min-h-screen">
        <Sidebar />

        <main className="min-w-0 flex-1 pb-24 lg:pb-0">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            <DashboardHeader
              displayName={data?.user.displayName}
              onRefresh={refresh}
              refreshing={refreshing}
            />

            {error && (
              <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
                <p className="font-semibold">
                  Unable to load dashboard
                </p>

                <p className="mt-1">{error}</p>
              </div>
            )}

            {!data && !error && <LoadingState />}

            {data && (
              <>
                <section className="grid gap-4 md:grid-cols-3">
                  <SpendingCard
                    amount={data.summary.monthTotal}
                    label="Spent this month"
                    change={data.summary.monthChange}
                    previousAmount={
                      data.summary.previousMonthTotal
                    }
                    transactionCount={
                      data.summary.transactionCount
                    }
                  />

                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="mb-4 flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-500">
                          Leak alerts
                        </p>

                        <p className="mt-1 text-2xl font-bold text-slate-950">
                          {data.leaks.length}
                        </p>
                      </div>

                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                        ⚠
                      </div>
                    </div>

                    <p
                      className={`text-sm font-medium ${
                        data.leaks.length > 0
                          ? "text-amber-700"
                          : "text-emerald-700"
                      }`}
                    >
                      {data.leaks.length > 0
                        ? `${data.leaks.length} alert${
                            data.leaks.length === 1
                              ? ""
                              : "s"
                          }`
                        : "No leaks detected"}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="mb-4 flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-500">
                          Active tasks
                        </p>

                        <p className="mt-1 text-2xl font-bold text-slate-950">
                          {data.summary.activeTaskCount}
                        </p>
                      </div>

                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                        ✓
                      </div>
                    </div>

                    <p className="text-sm font-medium text-emerald-700">
                      {data.summary.dueSoonTaskCount} due soon
                    </p>
                  </div>
                </section>

                {data.leaks.length > 0 && (
                  <section className="mt-6 space-y-3">
                    {data.leaks.slice(0, 3).map((leak) => (
                      <LeakAlert
                        key={leak.category}
                        category={leak.category}
                        percentage={leak.percentage}
                        message={`You've spent ${leak.percentage}% more on ${leak.category.toLowerCase()} than the previous month.`}
                      />
                    ))}
                  </section>
                )}

                <section className="mt-6">
                  <QuickActions onUpdated={setData} />
                </section>

                <section className="mt-6">
                  <CommandBar onUpdated={setData} />
                </section>

                <section className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_1fr]">
                  <CategorySpending
                    expenses={data.expenses}
                  />

                  <DailyBrief
                    monthTotal={data.summary.monthTotal}
                    activeTasks={data.summary.activeTaskCount}
                    importantEmails={
                      data.summary.actionRequiredEmails
                    }
                  />
                </section>

                <section className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        <h2 className="font-semibold text-slate-950">
                          Priority tasks
                        </h2>

                        <p className="mt-0.5 text-xs text-slate-500">
                          What needs doing
                        </p>
                      </div>

                      <Link
                        href="/dashboard/tasks"
                        className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                      >
                        View all
                      </Link>
                    </div>

                    {data.tasks.length === 0 ? (
                      <div className="py-8 text-center">
                        <p className="font-medium text-slate-700">
                          No open tasks
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                          You&apos;re all caught up.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {data.tasks.slice(0, 3).map((task) => (
                          <TaskCard
                            key={task.id}
                            task={{
                              id: task.id,
                              title: task.title,
                              due: task.dueAt
                                ? new Date(
                                    task.dueAt
                                  ).toLocaleString(
                                    "en-NG",
                                    {
                                      month: "short",
                                      day: "numeric",
                                      hour: "numeric",
                                      minute: "2-digit",
                                    }
                                  )
                                : "No deadline",
                              priority:
                                task.priority === "high"
                                  ? "High"
                                  : task.priority ===
                                      "low"
                                    ? "Low"
                                    : "Medium",
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        <h2 className="font-semibold text-slate-950">
                          Attention
                        </h2>

                        <p className="mt-0.5 text-xs text-slate-500">
                          Things TriGuard wants you to notice
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {data.leaks.length > 0 && (
                        <Link
                          href="/dashboard/expenses"
                          className="block rounded-xl border border-amber-200 bg-amber-50 p-4 transition hover:bg-amber-100"
                        >
                          <p className="text-sm font-semibold text-amber-950">
                            {data.leaks.length} spending alert
                            {data.leaks.length === 1
                              ? ""
                              : "s"}
                          </p>

                          <p className="mt-1 text-xs text-amber-800">
                            Review your Money Guard activity.
                          </p>
                        </Link>
                      )}

                      {data.summary.dueSoonTaskCount > 0 && (
                        <Link
                          href="/dashboard/tasks"
                          className="block rounded-xl border border-red-200 bg-red-50 p-4 transition hover:bg-red-100"
                        >
                          <p className="text-sm font-semibold text-red-950">
                            {data.summary.dueSoonTaskCount} task
                            {data.summary.dueSoonTaskCount === 1
                              ? ""
                              : "s"} due soon
                          </p>

                          <p className="mt-1 text-xs text-red-800">
                            Open Time Guard to review deadlines.
                          </p>
                        </Link>
                      )}

                      {data.summary.actionRequiredEmails > 0 && (
                        <Link
                          href="/dashboard/inbox"
                          className="block rounded-xl border border-blue-200 bg-blue-50 p-4 transition hover:bg-blue-100"
                        >
                          <p className="text-sm font-semibold text-blue-950">
                            {data.summary.actionRequiredEmails} email
                            {data.summary.actionRequiredEmails ===
                            1
                              ? ""
                              : "s"} need attention
                          </p>

                          <p className="mt-1 text-xs text-blue-800">
                            Review InboxZero.
                          </p>
                        </Link>
                      )}

                      {data.leaks.length === 0 &&
                        data.summary.dueSoonTaskCount === 0 &&
                        data.summary.actionRequiredEmails ===
                          0 && (
                          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                            <p className="text-sm font-semibold text-emerald-950">
                              You&apos;re in good shape
                            </p>

                            <p className="mt-1 text-xs text-emerald-800">
                              Nothing important is currently demanding
                              your attention.
                            </p>
                          </div>
                        )}
                    </div>
                  </div>
                </section>

                <section className="mt-6">
                  <RecentActivity
                    activities={data.activities}
                  />
                </section>

                <section className="mt-6 grid gap-4 md:grid-cols-3">
                  <Link
                    href="/dashboard/expenses"
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
                  >
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      ₦
                    </div>

                    <h3 className="font-semibold text-slate-900">
                      Money Guard
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      Review your spending and transactions.
                    </p>
                  </Link>

                  <Link
                    href="/dashboard/tasks"
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
                  >
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                      ✓
                    </div>

                    <h3 className="font-semibold text-slate-900">
                      Time Guard
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      Keep deadlines and tasks under control.
                    </p>
                  </Link>

                  <Link
                    href="/dashboard/inbox"
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
                  >
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                      ✉
                    </div>

                    <h3 className="font-semibold text-slate-900">
                      InboxZero
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      See the information that needs attention.
                    </p>
                  </Link>
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