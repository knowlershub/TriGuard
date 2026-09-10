"use client";

import { useEffect, useState } from "react";

import Sidebar from "@/components/layout/Sidebar";
import MobileNav from "@/components/layout/MobileNav";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import InstallAppButton from "@/components/pwa/InstallAppButton";

import {
  getDashboardData,
  type DashboardData,
} from "@/lib/dashboardApi";

export default function DashboardPage() {
  const [data, setData] =
    useState<DashboardData | null>(null);

  const [error, setError] =
    useState<string | null>(null);

  const [refreshing, setRefreshing] =
    useState(false);

  async function loadDashboard() {
    const freshData =
      await getDashboardData();

    setData(freshData);
  }

  useEffect(() => {
    loadDashboard().catch((err) => {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load dashboard."
      );
    });
  }, []);

  async function handleRefresh() {
    setRefreshing(true);
    setError(null);

    try {
      await loadDashboard();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to refresh dashboard."
      );
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex min-h-screen">
        <Sidebar />

        <main className="min-w-0 flex-1 pb-24 lg:pb-0">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            {!data && !error && (
              <div className="space-y-6">
                <div className="h-32 animate-pulse rounded-2xl bg-slate-200" />

                <div className="grid gap-4 md:grid-cols-3">
                  {[1, 2, 3].map((item) => (
                    <div
                      key={item}
                      className="h-32 animate-pulse rounded-2xl bg-slate-200"
                    />
                  ))}
                </div>

                <div className="h-64 animate-pulse rounded-2xl bg-slate-200" />
              </div>
            )}

            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
                <p className="font-semibold">
                  We couldn't load your dashboard.
                </p>

                <p className="mt-1">
                  {error}
                </p>

                <button
                  type="button"
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="mt-4 rounded-xl bg-red-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-800 disabled:cursor-wait disabled:opacity-60"
                >
                  {refreshing
                    ? "Retrying..."
                    : "Try again"}
                </button>
              </div>
            )}

            {data && (
              <>
                {/* Early access notice */}
                <div className="mb-6 rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-blue-950">
                        TriGuard Early Access
                      </p>

                      <p className="mt-1 text-sm text-blue-800">
                        You&apos;re using an early version of
                        TriGuard. Some integrations and account
                        features are still coming soon.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <InstallAppButton />

                      <span className="w-fit rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-blue-700">
                        Early access
                      </span>
                    </div>
                  </div>
                </div>

                <DashboardHeader
                  displayName={data.user.displayName}
                  onRefresh={handleRefresh}
                  refreshing={refreshing}
                />

                {/* Summary */}
                <section className="grid gap-4 md:grid-cols-3">
                  <SummaryCard
                    label="Spent this month"
                    value={`₦${data.summary.monthTotal.toLocaleString(
                      "en-NG"
                    )}`}
                    description={
                      data.summary.monthChange >= 0
                        ? `${data.summary.monthChange}% from last month`
                        : `${Math.abs(
                            data.summary.monthChange
                          )}% lower than last month`
                    }
                  />

                  <SummaryCard
                    label="Active tasks"
                    value={String(
                      data.summary.activeTaskCount
                    )}
                    description={
                      data.summary.dueSoonTaskCount > 0
                        ? `${data.summary.dueSoonTaskCount} due soon`
                        : "Nothing due soon"
                    }
                  />

                  <SummaryCard
                    label="Emails processed today"
                    value={String(
                      data.summary.emailProcessedToday
                    )}
                    description={
                      data.summary.actionRequiredEmails > 0
                        ? `${data.summary.actionRequiredEmails} need attention`
                        : "Nothing requires attention"
                    }
                  />
                </section>

                {/* Quick overview */}
                <section className="mt-6 grid gap-6 lg:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-100 px-5 py-4">
                      <h2 className="font-semibold text-slate-950">
                        Money Guard
                      </h2>

                      <p className="mt-1 text-xs text-slate-500">
                        Your recent spending picture.
                      </p>
                    </div>

                    <div className="space-y-4 p-5">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-500">
                          This week
                        </span>

                        <span className="font-semibold text-slate-900">
                          ₦
                          {data.summary.weekTotal.toLocaleString(
                            "en-NG"
                          )}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-500">
                          Transactions this month
                        </span>

                        <span className="font-semibold text-slate-900">
                          {data.summary.transactionCount}
                        </span>
                      </div>

                      {data.leaks.length > 0 ? (
                        <div className="rounded-xl bg-red-50 p-4">
                          <p className="text-sm font-semibold text-red-900">
                            Spending leaks detected
                          </p>

                          <p className="mt-1 text-sm text-red-700">
                            {data.leaks.length} categor
                            {data.leaks.length === 1
                              ? "y"
                              : "ies"}{" "}
                            spending above baseline.
                          </p>
                        </div>
                      ) : (
                        <div className="rounded-xl bg-emerald-50 p-4">
                          <p className="text-sm font-semibold text-emerald-900">
                            Spending looks healthy
                          </p>

                          <p className="mt-1 text-sm text-emerald-700">
                            No major spending leaks detected.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-100 px-5 py-4">
                      <h2 className="font-semibold text-slate-950">
                        Today&apos;s attention
                      </h2>

                      <p className="mt-1 text-xs text-slate-500">
                        Things TriGuard thinks may need you.
                      </p>
                    </div>

                    <div className="space-y-3 p-5">
                      <AttentionRow
                        label="Tasks due today"
                        value={
                          data.summary.todayTaskCount
                        }
                        href="/dashboard/tasks"
                      />

                      <AttentionRow
                        label="Tasks due soon"
                        value={
                          data.summary.dueSoonTaskCount
                        }
                        href="/dashboard/tasks"
                      />

                      <AttentionRow
                        label="Action-required emails"
                        value={
                          data.summary.actionRequiredEmails
                        }
                        href="/dashboard/inbox"
                      />

                      <AttentionRow
                        label="Subscription alerts"
                        value={
                          data.summary.subscriptions
                        }
                        href="/dashboard/inbox"
                      />
                    </div>
                  </div>
                </section>

                {/* Recent activity */}
                <section className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-100 px-5 py-4">
                    <h2 className="font-semibold text-slate-950">
                      Recent activity
                    </h2>

                    <p className="mt-1 text-xs text-slate-500">
                      The latest activity across TriGuard.
                    </p>
                  </div>

                  {data.activities.length === 0 ? (
                    <div className="px-5 py-12 text-center">
                      <p className="font-medium text-slate-700">
                        No recent activity
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        Activity will appear here as you use TriGuard.
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {data.activities
                        .slice(0, 6)
                        .map((activity) => (
                          <div
                            key={activity.id}
                            className="flex items-start gap-3 px-5 py-4"
                          >
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-sm text-slate-600">
                              {activity.type ===
                              "expense"
                                ? "₦"
                                : activity.type ===
                                    "task"
                                  ? "✓"
                                  : "✉"}
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-slate-900">
                                {activity.title}
                              </p>

                              <p className="mt-1 text-sm text-slate-500">
                                {activity.description}
                              </p>
                            </div>

                            <span className="shrink-0 text-xs text-slate-400">
                              {formatActivityTime(
                                activity.time
                              )}
                            </span>
                          </div>
                        ))}
                    </div>
                  )}
                </section>

                {/* Coming soon */}
                <section className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold text-slate-950">
                        More TriGuard features are coming soon
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        More integrations, account features, and automation
                        will be added during early access.
                      </p>
                    </div>

                    <span className="w-fit rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                      Coming soon
                    </span>
                  </div>
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

function SummaryCard({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
        {value}
      </p>

      <p className="mt-1 text-xs text-slate-400">
        {description}
      </p>
    </div>
  );
}

function AttentionRow({
  label,
  value,
  href,
}: {
  label: string;
  value: number;
  href: string;
}) {
  return (
    <a
      href={href}
      className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-3 transition hover:bg-slate-50"
    >
      <span className="text-sm text-slate-600">
        {label}
      </span>

      <span
        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
          value > 0
            ? "bg-amber-50 text-amber-700"
            : "bg-slate-100 text-slate-500"
        }`}
      >
        {value}
      </span>
    </a>
  );
}

function formatActivityTime(value: string) {
  return new Date(value).toLocaleTimeString(
    "en-NG",
    {
      hour: "2-digit",
      minute: "2-digit",
    }
  );
}