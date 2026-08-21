"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden min-h-screen w-64 shrink-0 flex-col bg-slate-950 text-white lg:flex">
      <div className="flex h-20 items-center border-b border-white/10 px-6">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 font-bold">
            T
          </div>

          <div>
            <div className="text-lg font-bold tracking-tight">TriGuard</div>
            <div className="text-xs text-slate-400">Life OS</div>
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

        <div className="mt-8 mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Connections
        </div>

        <div className="space-y-2 px-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-300">WhatsApp</span>
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-300">Gmail</span>
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 p-4">
        <Link
          href="/settings"
          className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-300 hover:bg-white/5 hover:text-white"
        >
          <span>⚙</span>
          Settings
        </Link>
      </div>
    </aside>
  );
}