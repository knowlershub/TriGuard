"use client";

import { useEffect, useMemo, useState } from "react";

import Sidebar from "@/components/layout/Sidebar";
import MobileNav from "@/components/layout/MobileNav";

import {
  getDashboardData,
  type DashboardData,
  type DashboardTask,
} from "@/lib/dashboardApi";

type TaskFilter = "all" | "today" | "upcoming" | "no_deadline";

function isToday(dateString: string | null): boolean {
  if (!dateString) {
    return false;
  }

  const date = new Date(dateString);
  const now = new Date();

  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

function isUpcoming(dateString: string | null): boolean {
  if (!dateString) {
    return false;
  }

  const date = new Date(dateString);
  const now = new Date();

  const limit = new Date(now);
  limit.setDate(limit.getDate() + 7);

  return date > now && date <= limit;
}

function formatDueDate(dateString: string | null): string {
  if (!dateString) {
    return "No deadline";
  }

  const date = new Date(dateString);
  const now = new Date();

  if (isToday(dateString)) {
    return `Today · ${date.toLocaleTimeString("en-NG", {
      hour: "numeric",
      minute: "2-digit",
    })}`;
  }

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (
    date.getFullYear() === tomorrow.getFullYear() &&
    date.getMonth() === tomorrow.getMonth() &&
    date.getDate() === tomorrow.getDate()
  ) {
    return `Tomorrow · ${date.toLocaleTimeString("en-NG", {
      hour: "numeric",
      minute: "2-digit",
    })}`;
  }

  return date.toLocaleString("en-NG", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function priorityClass(priority: string): string {
  switch (priority.toLowerCase()) {
    case "high":
      return "bg-red-50 text-red-700";

    case "low":
      return "bg-slate-100 text-slate-600";

    default:
      return "bg-amber-50 text-amber-700";
  }
}

function priorityDot(priority: string): string {
  switch (priority.toLowerCase()) {
    case "high":
      return "bg-red-500";

    case "low":
      return "bg-slate-400";

    default:
      return "bg-amber-500";
  }
}

function filterTasks(
  tasks: DashboardTask[],
  filter: TaskFilter
): DashboardTask[] {
  switch (filter) {
    case "today":
      return tasks.filter((task) => isToday(task.dueAt));

    case "upcoming":
      return tasks.filter((task) => isUpcoming(task.dueAt));

    case "no_deadline":
      return tasks.filter((task) => !task.dueAt);

    default:
      return tasks;
  }
}

export default function TasksPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [filter, setFilter] = useState<TaskFilter>("all");
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  async function loadTasks() {
    const freshData = await getDashboardData();
    setData(freshData);
  }

  async function refresh() {
    setRefreshing(true);
    setError(null);

    try {
      await loadTasks();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load tasks."
      );
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const visibleTasks = useMemo(() => {
    if (!data) {
      return [];
    }

    return filterTasks(data.tasks, filter);
  }, [data, filter]);

  const highPriorityCount =
    data?.tasks.filter(
      (task) => task.priority.toLowerCase() === "high"
    ).length ?? 0;

  const mediumPriorityCount =
    data?.tasks.filter(
      (task) => task.priority.toLowerCase() === "medium"
    ).length ?? 0;

  const lowPriorityCount =
    data?.tasks.filter(
      (task) => task.priority.toLowerCase() === "low"
    ).length ?? 0;

  const filterButtons: Array<{
    id: TaskFilter;
    label: string;
    count: number;
  }> = [
    {
      id: "all",
      label: "All",
      count: data?.tasks.length ?? 0,
    },
    {
      id: "today",
      label: "Today",
      count: data?.summary.todayTaskCount ?? 0,
    },
    {
      id: "upcoming",
      label: "Upcoming",
      count: data?.summary.dueSoonTaskCount ?? 0,
    },
    {
      id: "no_deadline",
      label: "No deadline",
      count:
        data?.tasks.filter((task) => !task.dueAt).length ?? 0,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex min-h-screen">
        <Sidebar />

        <main className="min-w-0 flex-1 pb-24 lg:pb-0">
          <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Time Guard
                </p>

                <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
                  Tasks
                </h1>

                <p className="mt-2 text-sm text-slate-500">
                  Everything Minderra has turned into actionable work.
                </p>
              </div>

              <button
                type="button"
                onClick={refresh}
                disabled={refreshing}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60"
              >
                {refreshing ? "Refreshing..." : "Refresh tasks"}
              </button>
            </header>

            {error && (
              <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
                <p className="font-semibold">
                  Unable to load tasks
                </p>

                <p className="mt-1">{error}</p>
              </div>
            )}

            {!data && !error && (
              <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-3">
                  {[1, 2, 3].map((item) => (
                    <div
                      key={item}
                      className="h-28 animate-pulse rounded-2xl bg-slate-200"
                    />
                  ))}
                </div>

                <div className="h-96 animate-pulse rounded-2xl bg-slate-200" />
              </div>
            )}

            {data && (
              <>
                <section className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-sm font-medium text-slate-500">
                      Active tasks
                    </p>

                    <p className="mt-2 text-3xl font-bold text-slate-950">
                      {data.summary.activeTaskCount}
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      {data.summary.todayTaskCount} due today
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-sm font-medium text-slate-500">
                      Due soon
                    </p>

                    <p className="mt-2 text-3xl font-bold text-amber-600">
                      {data.summary.dueSoonTaskCount}
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      Within the next few days
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-sm font-medium text-slate-500">
                      High priority
                    </p>

                    <p className="mt-2 text-3xl font-bold text-red-600">
                      {highPriorityCount}
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      Requires closer attention
                    </p>
                  </div>
                </section>

                <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_280px]">
                  <div className="min-w-0 rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-100 px-5 py-4">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <h2 className="font-semibold text-slate-950">
                            Your tasks
                          </h2>

                          <p className="mt-0.5 text-xs text-slate-500">
                            Created from commands, messages, notes, and email.
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {filterButtons.map((button) => {
                            const active = filter === button.id;

                            return (
                              <button
                                key={button.id}
                                type="button"
                                onClick={() => setFilter(button.id)}
                                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                                  active
                                    ? "bg-slate-950 text-white"
                                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                }`}
                              >
                                {button.label} {button.count}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {visibleTasks.length === 0 ? (
                      <div className="px-5 py-16 text-center">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-xl text-slate-500">
                          ✓
                        </div>

                        <h3 className="mt-4 font-semibold text-slate-900">
                          {filter === "all"
                            ? "No open tasks"
                            : "No tasks in this view"}
                        </h3>

                        <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-slate-500">
                          {filter === "all"
                            ? "You're all caught up. New tasks created through Minderra will appear here."
                            : "Try another filter or create a new task through the dashboard command bar."}
                        </p>
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {visibleTasks.map((task) => (
                          <TaskRow key={task.id} task={task} />
                        ))}
                      </div>
                    )}
                  </div>

                  <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div>
                      <p className="text-sm font-semibold text-slate-950">
                        Priority mix
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        Current open-task distribution.
                      </p>
                    </div>

                    <div className="mt-5 space-y-4">
                      <PriorityRow
                        label="High"
                        count={highPriorityCount}
                        total={data.tasks.length}
                        dotClass="bg-red-500"
                        textClass="text-red-700"
                      />

                      <PriorityRow
                        label="Medium"
                        count={mediumPriorityCount}
                        total={data.tasks.length}
                        dotClass="bg-amber-500"
                        textClass="text-amber-700"
                      />

                      <PriorityRow
                        label="Low"
                        count={lowPriorityCount}
                        total={data.tasks.length}
                        dotClass="bg-slate-400"
                        textClass="text-slate-600"
                      />
                    </div>
                  </aside>
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

function TaskRow({ task }: { task: DashboardTask }) {
  const overdue =
    task.dueAt !== null &&
    new Date(task.dueAt).getTime() < Date.now();

  return (
    <article className="px-5 py-5 transition hover:bg-slate-50">
      <div className="flex gap-4">
        <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-slate-300">
          <span className="h-2 w-2 rounded-full bg-transparent" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h3 className="font-semibold text-slate-900">
                {task.title}
              </h3>

              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${priorityClass(
                    task.priority
                  )}`}
                >
                  {task.priority}
                </span>

                <span
                  className={`text-xs ${
                    overdue
                      ? "font-semibold text-red-600"
                      : "text-slate-500"
                  }`}
                >
                  {overdue ? "Overdue · " : ""}
                  {formatDueDate(task.dueAt)}
                </span>
              </div>
            </div>

            <span className="shrink-0 rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-500">
              {task.source || "Minderra"}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}

function PriorityRow({
  label,
  count,
  total,
  dotClass,
  textClass,
}: {
  label: string;
  count: number;
  total: number;
  dotClass: string;
  textClass: string;
}) {
  const percentage = total > 0 ? (count / total) * 100 : 0;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={`h-2.5 w-2.5 rounded-full ${dotClass}`}
          />

          <span className={`text-sm font-medium ${textClass}`}>
            {label}
          </span>
        </div>

        <span className="text-sm font-semibold text-slate-900">
          {count}
        </span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full ${dotClass}`}
          style={{
            width: `${Math.max(percentage, count > 0 ? 4 : 0)}%`,
          }}
        />
      </div>
    </div>
  );
}