"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  {
    label: "Home",
    href: "/dashboard",
    icon: "⌂",
  },
  {
    label: "Money",
    href: "/dashboard/expenses",
    icon: "₦",
  },
  {
    label: "Tasks",
    href: "/dashboard/tasks",
    icon: "✓",
  },
  {
    label: "Inbox",
    href: "/dashboard/inbox",
    icon: "✉",
  },
  {
    label: "Alerts",
    href: "/dashboard/notifications",
    icon: "🔔",
  },
  {
    label: "Settings",
    href: "/dashboard/settings",
    icon: "⚙",
  },
];

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white px-2 py-2 shadow-[0_-4px_20px_rgba(15,23,42,0.06)] lg:hidden">
      <div className="mx-auto flex max-w-2xl items-center justify-between gap-1">
        {items.map((item) => {
          const active =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl px-1 py-2 text-[10px] transition ${
                active
                  ? "bg-blue-50 font-semibold text-blue-600"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
              }`}
            >
              <span className="flex h-6 items-center justify-center text-base">
                {item.icon}
              </span>

              <span className="truncate">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}