"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import Sidebar from "@/components/layout/Sidebar";
import MobileNav from "@/components/layout/MobileNav";

import {
  getNotificationPreferences,
  updateNotificationPreferences,
  type NotificationPreferences,
} from "@/lib/dashboardApi";

const DEFAULT_PREFERENCES: NotificationPreferences = {
  emailNotifications: true,
  leakAlerts: true,
  taskReminders: true,
  subscriptionAlerts: true,
  dailyDigest: true,
};

export default function SettingsPage() {
  const [settings, setSettings] =
    useState<NotificationPreferences>(DEFAULT_PREFERENCES);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const testUserId = process.env.NEXT_PUBLIC_TEST_USER_ID;

    if (!testUserId) {
      setError("NEXT_PUBLIC_TEST_USER_ID is not configured.");
      setLoading(false);
      return;
    }

    getNotificationPreferences(testUserId)
      .then((preferences) => {
        setSettings(preferences);
      })
      .catch((err) => {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load settings."
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  function updateSetting(
    key: keyof NotificationPreferences,
    value: boolean
  ) {
    setSettings((current) => ({
      ...current,
      [key]: value,
    }));

    setSaved(false);
  }

  async function saveSettings() {
    const testUserId = process.env.NEXT_PUBLIC_TEST_USER_ID;

    if (!testUserId) {
      setError("NEXT_PUBLIC_TEST_USER_ID is not configured.");
      return;
    }

    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      const updated = await updateNotificationPreferences(
        testUserId,
        settings
      );

      setSettings(updated);
      setSaved(true);

      window.setTimeout(() => {
        setSaved(false);
      }, 2500);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to save settings."
      );
    } finally {
      setSaving(false);
    }
  }

  const testUserId = process.env.NEXT_PUBLIC_TEST_USER_ID;

  const gmailConnectUrl = testUserId
    ? `/api/auth/gmail/start?userId=${encodeURIComponent(testUserId)}`
    : "#";

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex min-h-screen">
        <Sidebar />

        <main className="min-w-0 flex-1 pb-24 lg:pb-0">
          <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            <header className="mb-8">
              <p className="text-sm font-medium text-slate-500">
                Command Center
              </p>

              <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
                Settings
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                Control how TriGuard behaves and how it keeps you informed.
              </p>
            </header>

            {error && (
              <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
                {error}
              </div>
            )}

            {loading ? (
              <div className="space-y-6">
                <div className="h-80 animate-pulse rounded-2xl bg-slate-200" />
                <div className="h-52 animate-pulse rounded-2xl bg-slate-200" />
              </div>
            ) : (
              <div className="space-y-6">
                {/* Notification settings */}
                <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-100 px-6 py-5">
                    <h2 className="font-semibold text-slate-950">
                      Notifications
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      These preferences are stored with your TriGuard account.
                    </p>
                  </div>

                  <div className="divide-y divide-slate-100">
                    <SettingToggle
                      title="Email notifications"
                      description="Show important InboxZero email alerts."
                      checked={settings.emailNotifications}
                      onChange={(value) =>
                        updateSetting("emailNotifications", value)
                      }
                    />

                    <SettingToggle
                      title="Spending leak alerts"
                      description="Notify me when category spending rises significantly."
                      checked={settings.leakAlerts}
                      onChange={(value) =>
                        updateSetting("leakAlerts", value)
                      }
                    />

                    <SettingToggle
                      title="Task reminders"
                      description="Show reminders for tasks approaching their deadlines."
                      checked={settings.taskReminders}
                      onChange={(value) =>
                        updateSetting("taskReminders", value)
                      }
                    />

                    <SettingToggle
                      title="Subscription alerts"
                      description="Surface recurring-charge and subscription activity."
                      checked={settings.subscriptionAlerts}
                      onChange={(value) =>
                        updateSetting("subscriptionAlerts", value)
                      }
                    />

                    <SettingToggle
                      title="Daily digest"
                      description="Prepare a daily TriGuard summary when digest support is connected."
                      checked={settings.dailyDigest}
                      onChange={(value) =>
                        updateSetting("dailyDigest", value)
                      }
                    />
                  </div>
                </section>

                {/* Connections */}
                <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-100 px-6 py-5">
                    <h2 className="font-semibold text-slate-950">
                      Connections
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Connect the services that feed information into TriGuard.
                    </p>
                  </div>

                  <div className="divide-y divide-slate-100">
                    <ConnectionRow
                      name="WhatsApp"
                      description="Expense messages, commands, and receipt images."
                      status="Not connected"
                    />

                    <ConnectionRow
                      name="Gmail"
                      description="InboxZero email summaries and routing."
                      status="Connect Gmail"
                      href={gmailConnectUrl}
                    />
                  </div>
                </section>

                {/* Profile */}
                <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div>
                    <h2 className="font-semibold text-slate-950">
                      Account
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      View and edit your TriGuard profile.
                    </p>
                  </div>

                  <div className="mt-5">
                    <Link
                      href="/dashboard/profile"
                      className="inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      Open profile
                    </Link>
                  </div>
                </section>

                {/* Save */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                  {saved && (
                    <p className="text-sm font-medium text-emerald-600">
                      Settings saved.
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={saveSettings}
                    disabled={saving}
                    className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-wait disabled:opacity-50"
                  >
                    {saving ? "Saving..." : "Save settings"}
                  </button>
                </div>

                {/* Prototype note */}
                <section className="rounded-2xl border border-blue-200 bg-blue-50 p-6">
                  <p className="text-sm font-semibold text-blue-950">
                    Connection status
                  </p>

                  <p className="mt-1 text-sm leading-6 text-blue-800">
                    WhatsApp and Gmail are not marked as connected until their
                    actual integrations are linked. Gmail can be connected
                    from this page.
                  </p>
                </section>
              </div>
            )}
          </div>
        </main>
      </div>

      <MobileNav />
    </div>
  );
}

function SettingToggle({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-6 px-6 py-5">
      <div className="min-w-0">
        <p className="font-medium text-slate-900">{title}</p>

        <p className="mt-1 text-sm leading-6 text-slate-500">
          {description}
        </p>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition ${
          checked ? "bg-blue-600" : "bg-slate-300"
        }`}
      >
        <span
          className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition ${
            checked ? "left-6" : "left-1"
          }`}
        />
      </button>
    </div>
  );
}

function ConnectionRow({
  name,
  description,
  status,
  href,
}: {
  name: string;
  description: string;
  status: string;
  href?: string;
}) {
  const connected = status === "Connected";

  const content = (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-medium text-slate-900">{name}</p>

        <p className="mt-1 text-sm leading-6 text-slate-500">
          {description}
        </p>
      </div>

      <span
        className={`w-fit rounded-full px-3 py-1.5 text-xs font-semibold ${
          connected
            ? "bg-emerald-50 text-emerald-700"
            : "bg-slate-100 text-slate-600"
        }`}
      >
        {status}
      </span>
    </div>
  );

  return href && href !== "#" ? (
    <Link
      href={href}
      className="block px-6 py-5 transition hover:bg-slate-50"
    >
      {content}
    </Link>
  ) : (
    <div className="px-6 py-5">{content}</div>
  );
}