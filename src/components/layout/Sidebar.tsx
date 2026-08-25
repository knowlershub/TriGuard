"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { getGmailConnectionStatus } from "@/lib/dashboardApi";

const navigation = [
  {
    label: "Overview",
    href: "/dashboard",
    icon: "⌂",
  },
  {
    label: "Expenses",
    href: "/dashboard/expenses",
    icon: "₦",
  },
  {
    label: "Tasks",
    href: "/dashboard/tasks",
    icon: "✓",
  },
  {
    label: "InboxZero",
    href: "/dashboard/inbox",
    icon: "✉",
  },
  {
    label: "Notifications",
    href: "/dashboard/notifications",
    icon: "🔔",
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  const [gmailConnected, setGmailConnected] =
    useState(false);
  const [gmailEmail, setGmailEmail] =
    useState<string | null>(null);

  useEffect(() => {
    const testUserId =
      process.env.NEXT_PUBLIC_TEST_USER_ID;

    if (!testUserId) {
      return;
    }

    getGmailConnectionStatus(testUserId)
      .then((status) => {
        setGmailConnected(
          status.connected && !status.expired
        );
        setGmailEmail(status.emailAddress);
      })
      .catch(() => {
        setGmailConnected(false);
        setGmailEmail(null);
      });
  }, []);

  return (
    <aside className="hidden min-h-screen w-64 shrink-0 flex-col bg-slate-950 text-white lg:flex">
      <div className="flex h-20 items-center border-b border-white/10 px-6">
        <Link
          href="/dashboard"
          className="flex items-center gap-3"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 font-bold">
            T
          </div>

          <div>
            <div className="text-lg font-bold tracking-tight">
              TriGuard
            </div>

            <div className="text-xs text-slate-400">
              Life OS
            </div>
          </div>
        </Link>
      </div>

      <div className="flex-1 px-4 py-6">
        <div className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Command Center
        </div>

        <nav className="space-y-1">
          {navigation.map((item) => {
            const active =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
                  active
                    ? "bg-blue-600 text-white"
                    : "text-slate-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-sm">
                  {item.icon}
                </span>

                {item.label}
              </Link>
            );
          })}
        </nav>

<div className="mb-3 mt-8 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
  Connections
</div>

<div className="space-y-3 px-3">
  <div className="flex items-center justify-between text-sm">
    <div>
      <p className="text-slate-300">
        Gmail
      </p>

      <p className="text-xs text-slate-500">
        Connected
      </p>
    </div>

    <span
      className="h-2 w-2 rounded-full bg-emerald-400"
      aria-label="Gmail connected"
    />
  </div>

  <div className="flex items-center justify-between text-sm">
    <div>
      <p className="text-slate-300">
        WhatsApp
      </p>

      <p className="text-xs text-slate-500">
        Coming soon
      </p>
    </div>

    <span
      className="h-2 w-2 rounded-full bg-slate-600"
      aria-label="WhatsApp coming soon"
    />
  </div>
</div>
        <div className="space-y-3 px-3">
          <ConnectionStatus
            label="WhatsApp"
            connected={false}
          />

          <div>
            <ConnectionStatus
              label="Gmail"
              connected={gmailConnected}
            />

            {gmailConnected && gmailEmail && (
              <p
                className="mt-1 truncate text-[10px] text-slate-500"
                title={gmailEmail}
              >
                {gmailEmail}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 p-4">
        <div className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Account
        </div>

        <Link
          href="/dashboard/profile"
          className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
            pathname.startsWith("/dashboard/profile")
              ? "bg-blue-600 text-white"
              : "text-slate-300 hover:bg-white/5 hover:text-white"
          }`}
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10">
            👤
          </span>

          Profile
        </Link>

        <Link
          href="/dashboard/settings"
          className={`mt-1 flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
            pathname.startsWith("/dashboard/settings")
              ? "bg-blue-600 text-white"
              : "text-slate-300 hover:bg-white/5 hover:text-white"
          }`}
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10">
            ⚙
          </span>

          Settings
        </Link>
      </div>
    </aside>
  );
}

function ConnectionStatus({
  label,
  connected,
}: {
  label: string;
  connected: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-slate-300">
        {label}
      </span>

      <div className="flex items-center gap-2">
        <span
          className={`h-2 w-2 rounded-full ${
            connected
              ? "bg-emerald-400"
              : "bg-slate-600"
          }`}
        />

        <span
          className={`text-xs ${
            connected
              ? "text-emerald-400"
              : "text-slate-500"
          }`}
        >
          {connected
            ? "Connected"
            : "Not connected"}
        </span>
      </div>
    </div>
  );
}