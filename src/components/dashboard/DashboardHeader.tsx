"use client";

type DashboardHeaderProps = {
  displayName?: string | null;
  onRefresh?: () => Promise<void>;
  refreshing?: boolean;
};

export default function DashboardHeader({
  displayName,
  onRefresh,
  refreshing = false,
}: DashboardHeaderProps) {
  const hour = new Date().getHours();

  const greeting =
    hour < 12
      ? "Good morning"
      : hour < 18
        ? "Good afternoon"
        : "Good evening";

  const firstName = displayName?.trim()
    ? displayName.trim().split(/\s+/)[0]
    : null;

  return (
    <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="mb-1 text-sm font-medium text-slate-500">
          {new Date().toLocaleDateString("en-NG", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </p>

        <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
          {greeting}
          {firstName ? `, ${firstName}` : ""} 👋
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Here&apos;s what needs your attention today.
        </p>
      </div>

      <div className="flex items-center gap-3">
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60"
          >
            <span className={refreshing ? "animate-spin" : ""}>
              ↻
            </span>

            {refreshing ? "Refreshing" : "Refresh"}
          </button>
        )}

        <button
          type="button"
          className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50"
          aria-label="Notifications"
        >
          🔔
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
        </button>

        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-sm font-bold text-white">
          {firstName
            ? firstName.slice(0, 2).toUpperCase()
            : "TG"}
        </div>
      </div>
    </header>
  );
}