"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import MobileNav from "@/components/layout/MobileNav";
import {
  getDashboardData,
  sendCommand,
  type DashboardData,
} from "@/lib/dashboardApi";

export default function TasksPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState<string | null>(null);

  async function load() {
    const testUserId = process.env.NEXT_PUBLIC_TEST_USER_ID;

    if (!testUserId) {
      setError("NEXT_PUBLIC_TEST_USER_ID is not configured.");
      return;
    }

    try {
      setError(null);
      setData(await getDashboardData(testUserId));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load tasks."
      );
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function completeTask(taskIndex: number) {
    const testUserId = process.env.NEXT_PUBLIC_TEST_USER_ID;

    if (!testUserId || !data) {
      return;
    }

    setWorking(data.tasks[taskIndex]?.id ?? null);

    try {
      await sendCommand(testUserId, `/done ${taskIndex + 1}`);
      await load();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to complete task."
      );
    } finally {
      setWorking(null);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex min-h-screen">
        <Sidebar />

        <main className="min-w-0 flex-1 pb-24 lg:pb-0">
          <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            <div className="mb-8">
              <p className="text-sm font-medium text-slate-500">
                Time Guard
              </p>

              <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
                Tasks
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                Tasks created and enriched by TriGuard.
              </p>
            </div>

            {error && (
              <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
                {error}
              </div>
            )}

            {!data && !error && (
              <div className="h-80 animate-pulse rounded-2xl bg-slate-200" />
            )}

            {data && (
              <>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-sm text-slate-500">Active</p>
                    <p className="mt-2 text-2xl font-bold">
                      {data.summary.activeTaskCount}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-sm text-slate-500">Due soon</p>
                    <p className="mt-2 text-2xl font-bold text-amber-600">
                      {data.summary.dueSoonTaskCount}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-sm text-slate-500">Due today</p>
                    <p className="mt-2 text-2xl font-bold text-red-600">
                      {data.summary.todayTaskCount}
                    </p>
                  </div>
                </div>

                <div className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-100 px-5 py-4">
                    <h2 className="font-semibold">Open tasks</h2>
                  </div>

                  {data.tasks.length === 0 ? (
                    <div className="px-5 py-12 text-center">
                      <p className="font-medium text-slate-700">
                        No open tasks
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        You&apos;re all caught up.
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {data.tasks.map((task, index) => (
                        <div
                          key={task.id}
                          className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center"
                        >
                          <button
                            type="button"
                            onClick={() => completeTask(index)}
                            disabled={working === task.id}
                            className="h-6 w-6 shrink-0 rounded-full border-2 border-slate-300 transition hover:border-blue-500 disabled:cursor-wait disabled:opacity-50"
                            aria-label={`Complete ${task.title}`}
                          />

                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-slate-900">
                              {task.title}
                            </p>

                            <p className="mt-1 text-sm text-slate-500">
                              {task.source || "TriGuard"}
                              {task.dueAt &&
                                ` · Due ${new Date(
                                  task.dueAt
                                ).toLocaleString("en-NG")}`}
                            </p>
                          </div>

                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                              task.priority === "high"
                                ? "bg-red-50 text-red-700"
                                : task.priority === "low"
                                  ? "bg-slate-100 text-slate-600"
                                  : "bg-amber-50 text-amber-700"
                            }`}
                          >
                            {task.priority}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </main>
      </div>

      <MobileNav />
    </div>
  );
}