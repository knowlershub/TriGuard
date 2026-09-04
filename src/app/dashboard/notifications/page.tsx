"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import Sidebar from "@/components/layout/Sidebar";
import MobileNav from "@/components/layout/MobileNav";

import {
  getDashboardData,
  getNotificationPreferences,
  type DashboardData,
  type NotificationPreferences,
} from "@/lib/dashboardApi";

type NotificationType =
  | "leak"
  | "task"
  | "email"
  | "subscription"
  | "activity";

type NotificationItem = {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  timestamp: string;
  href: string;
  priority: "high" | "medium" | "low";
};

const DEFAULT_PREFERENCES: NotificationPreferences = {
  emailNotifications: true,
  leakAlerts: true,
  taskReminders: true,
  subscriptionAlerts: true,
  dailyDigest: true,
};

export default function NotificationsPage() {
  const [data, setData] =
    useState<DashboardData | null>(null);

  const [preferences, setPreferences] =
    useState<NotificationPreferences>(
      DEFAULT_PREFERENCES
    );

  const [error, setError] =
    useState<string | null>(null);

  const [showAll, setShowAll] =
    useState(false);

  const [readNotifications, setReadNotifications] =
    useState<Set<string>>(new Set());

  useEffect(() => {
    Promise.all([
      getDashboardData(),
      getNotificationPreferences(),
    ])
      .then(
        ([
          dashboardData,
          notificationPreferences,
        ]) => {
          setData(dashboardData);
          setPreferences(
            notificationPreferences
          );
        }
      )
      .catch((err) => {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load notifications."
        );
      });
  }, []);

  const notifications = useMemo<
    NotificationItem[]
  >(() => {
    if (!data) {
      return [];
    }

    const items: NotificationItem[] = [];

    /*
     * Money Guard
     */
    if (preferences.leakAlerts) {
      for (const leak of data.leaks) {
        items.push({
          id: `leak-${leak.category}`,
          type: "leak",
          title: `${leak.category} spending leak detected`,
          description: `Spending is ${leak.percentage}% higher than your previous-month baseline.`,
          timestamp: new Date().toISOString(),
          href: "/dashboard/expenses",
          priority: "high",
        });
      }
    }

    /*
     * Time Guard
     */
    if (preferences.taskReminders) {
      for (const task of data.tasks) {
        if (!task.dueAt) {
          continue;
        }

        const due = new Date(task.dueAt);
        const now = new Date();

        if (due < now) {
          items.push({
            id: `overdue-${task.id}`,
            type: "task",
            title: `Overdue task: ${task.title}`,
            description:
              "This task has passed its deadline.",
            timestamp: task.dueAt,
            href: "/dashboard/tasks",
            priority: "high",
          });

          continue;
        }

        const days =
          (due.getTime() - now.getTime()) /
          (1000 * 60 * 60 * 24);

        if (days <= 3) {
          items.push({
            id: `task-${task.id}`,
            type: "task",
            title: `Task due soon: ${task.title}`,
            description: due.toLocaleString(
              "en-NG",
              {
                weekday: "short",
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              }
            ),
            timestamp: task.dueAt,
            href: "/dashboard/tasks",
            priority:
              days <= 1
                ? "high"
                : "medium",
          });
        }
      }
    }

    /*
     * Info Guard — action-required email
     */
    if (
      preferences.emailNotifications &&
      data.summary.actionRequiredEmails > 0
    ) {
      items.push({
        id: "action-emails",
        type: "email",
        title: `${data.summary.actionRequiredEmails} email${
          data.summary.actionRequiredEmails === 1
            ? ""
            : "s"
        } need your attention`,
        description:
          "InboxZero identified messages that may require an action.",
        timestamp:
          new Date().toISOString(),
        href: "/dashboard/inbox",
        priority: "high",
      });
    }

    /*
     * Info Guard — subscriptions
     */
    if (
      preferences.subscriptionAlerts &&
      data.summary.subscriptions > 0
    ) {
      items.push({
        id: "subscriptions",
        type: "subscription",
        title: `${data.summary.subscriptions} subscription alert${
          data.summary.subscriptions === 1
            ? ""
            : "s"
        }`,
        description:
          "Review recurring charges and subscription-related messages.",
        timestamp:
          new Date().toISOString(),
        href: "/dashboard/inbox",
        priority: "medium",
      });
    }

    /*
     * Recent activity remains visible regardless
     * of notification preferences.
     */
    for (const activity of data.activities.slice(
      0,
      5
    )) {
      items.push({
        id: `activity-${activity.id}`,
        type: "activity",
        title: activity.title,
        description:
          activity.description,
        timestamp: activity.time,
        href:
          activity.type === "expense"
            ? "/dashboard/expenses"
            : activity.type === "task"
              ? "/dashboard/tasks"
              : "/dashboard/inbox",
        priority: "low",
      });
    }

    return items.sort(
      (a, b) =>
        new Date(
          b.timestamp
        ).getTime() -
        new Date(
          a.timestamp
        ).getTime()
    );
  }, [data, preferences]);

  const visibleNotifications =
    showAll
      ? notifications
      : notifications.slice(0, 8);

  const highCount =
    notifications.filter(
      (item) => item.priority === "high"
    ).length;

  const unreadCount =
    notifications.filter(
      (item) =>
        !readNotifications.has(item.id)
    ).length;

  const filteredAlertCount =
    (preferences.leakAlerts
      ? data?.leaks.length ?? 0
      : 0) +
    (preferences.taskReminders
      ? data?.summary.dueSoonTaskCount ?? 0
      : 0) +
    (preferences.emailNotifications
      ? data?.summary.actionRequiredEmails ?? 0
      : 0) +
    (preferences.subscriptionAlerts
      ? data?.summary.subscriptions ?? 0
      : 0);

  function toggleRead(id: string) {
    setReadNotifications((current) => {
      const next = new Set(current);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });
  }

  function markAllAsRead() {
    setReadNotifications(
      new Set(
        notifications.map(
          (notification) =>
            notification.id
        )
      )
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex min-h-screen">
        <Sidebar />

        <main className="min-w-0 flex-1 pb-24 lg:pb-0">
          <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            <header className="mb-8">
              <p className="text-sm font-medium text-slate-500">
                Command Center
              </p>

              <div className="mt-1 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight text-slate-950">
                    Notifications
                  </h1>

                  <p className="mt-2 text-sm text-slate-500">
                    Everything TriGuard thinks deserves your attention.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {unreadCount > 0 && (
                    <span className="w-fit rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                      {unreadCount} unread
                    </span>
                  )}

                  {highCount > 0 && (
                    <span className="w-fit rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700">
                      {highCount} high priority
                    </span>
                  )}
                </div>
              </div>
            </header>

            {error && (
              <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
                {error}
              </div>
            )}

            {!data && !error && (
              <div className="space-y-3">
                {[1, 2, 3, 4].map(
                  (item) => (
                    <div
                      key={item}
                      className="h-24 animate-pulse rounded-2xl bg-slate-200"
                    />
                  )
                )}
              </div>
            )}

            {data && (
              <>
                <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-950">
                        Notification preferences
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        Showing alerts according to your Settings.
                      </p>
                    </div>

                    <Link
                      href="/dashboard/settings"
                      className="w-fit rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      Manage settings
                    </Link>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <PreferenceBadge
                      label="Leak alerts"
                      enabled={
                        preferences.leakAlerts
                      }
                    />

                    <PreferenceBadge
                      label="Task reminders"
                      enabled={
                        preferences.taskReminders
                      }
                    />

                    <PreferenceBadge
                      label="Email alerts"
                      enabled={
                        preferences.emailNotifications
                      }
                    />

                    <PreferenceBadge
                      label="Subscriptions"
                      enabled={
                        preferences.subscriptionAlerts
                      }
                    />
                  </div>
                </section>

                {notifications.length === 0 ? (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-10 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-xl">
                      ✓
                    </div>

                    <h2 className="mt-4 font-semibold text-emerald-950">
                      You&apos;re all clear
                    </h2>

                    <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-emerald-800">
                      TriGuard has nothing urgent to bring to your attention
                      based on your current notification settings.
                    </p>

                    {filteredAlertCount === 0 && (
                      <Link
                        href="/dashboard/settings"
                        className="mt-5 inline-flex rounded-xl border border-emerald-200 bg-white px-4 py-2.5 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-50"
                      >
                        Review notification settings
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-100 px-5 py-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <h2 className="font-semibold text-slate-950">
                            Your notifications
                          </h2>

                          <p className="mt-0.5 text-xs text-slate-500">
                            {notifications.length} item
                            {notifications.length === 1
                              ? ""
                              : "s"} across TriGuard.
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={markAllAsRead}
                          disabled={
                            unreadCount === 0
                          }
                          className="w-fit rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Mark all as read
                        </button>
                      </div>
                    </div>

                    <div className="divide-y divide-slate-100">
                      {visibleNotifications.map(
                        (notification) => {
                          const isRead =
                            readNotifications.has(
                              notification.id
                            );

                          return (
                            <NotificationRow
                              key={notification.id}
                              notification={
                                notification
                              }
                              isRead={isRead}
                              onToggleRead={() =>
                                toggleRead(
                                  notification.id
                                )
                              }
                            />
                          );
                        }
                      )}
                    </div>

                    {notifications.length > 8 && (
                      <div className="border-t border-slate-100 px-5 py-4 text-center">
                        <button
                          type="button"
                          onClick={() =>
                            setShowAll(
                              (current) =>
                                !current
                            )
                          }
                          className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                        >
                          {showAll
                            ? "Show less"
                            : `Show all ${notifications.length}`}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>

      <MobileNav />
    </div>
  );
}

function PreferenceBadge({
  label,
  enabled,
}: {
  label: string;
  enabled: boolean;
}) {
  return (
    <span
      className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
        enabled
          ? "bg-emerald-50 text-emerald-700"
          : "bg-slate-100 text-slate-500"
      }`}
    >
      {label}: {enabled ? "On" : "Off"}
    </span>
  );
}

function NotificationRow({
  notification,
  isRead,
  onToggleRead,
}: {
  notification: NotificationItem;
  isRead: boolean;
  onToggleRead: () => void;
}) {
  const icon =
    notification.type === "leak"
      ? "⚠"
      : notification.type === "task"
        ? "✓"
        : notification.type === "email"
          ? "✉"
          : notification.type ===
              "subscription"
            ? "↻"
            : "•";

  const iconClass =
    notification.priority === "high"
      ? "bg-red-50 text-red-600"
      : notification.priority === "medium"
        ? "bg-amber-50 text-amber-600"
        : "bg-slate-100 text-slate-600";

  return (
    <div
      className={`flex gap-4 px-5 py-5 transition ${
        isRead
          ? "bg-white"
          : "bg-blue-50/25"
      }`}
    >
      <Link
        href={notification.href}
        className="flex min-w-0 flex-1 gap-4"
      >
        <div
          className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-semibold ${iconClass}`}
        >
          {icon}

          {!isRead && (
            <span
              className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-blue-600 ring-2 ring-white"
              aria-label="Unread"
            />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p
              className={`font-semibold ${
                isRead
                  ? "text-slate-700"
                  : "text-slate-900"
              }`}
            >
              {notification.title}
            </p>

            <PriorityBadge
              priority={
                notification.priority
              }
            />
          </div>

          <p className="mt-1 text-sm leading-6 text-slate-500">
            {notification.description}
          </p>

          <p className="mt-2 text-xs text-slate-400">
            {new Date(
              notification.timestamp
            ).toLocaleString("en-NG", {
              weekday: "short",
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
          </p>
        </div>

        <span className="hidden items-center text-slate-300 sm:flex">
          →
        </span>
      </Link>

      <div className="flex shrink-0 items-start pt-1">
        <button
          type="button"
          onClick={onToggleRead}
          className="text-xs font-semibold text-blue-600 hover:text-blue-700"
        >
          {isRead
            ? "Mark unread"
            : "Mark read"}
        </button>
      </div>
    </div>
  );
}

function PriorityBadge({
  priority,
}: {
  priority: "high" | "medium" | "low";
}) {
  const classes =
    priority === "high"
      ? "bg-red-50 text-red-700"
      : priority === "medium"
        ? "bg-amber-50 text-amber-700"
        : "bg-slate-100 text-slate-500";

  const label =
    priority === "high"
      ? "High"
      : priority === "medium"
        ? "Medium"
        : "Info";

  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${classes}`}
    >
      {label}
    </span>
  );
}