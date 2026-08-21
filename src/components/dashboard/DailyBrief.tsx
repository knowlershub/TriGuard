type DailyBriefProps = {
  monthTotal: number;
  activeTasks: number;
  importantEmails: number;
};

export default function DailyBrief({
  monthTotal,
  activeTasks,
  importantEmails,
}: DailyBriefProps) {
  return (
    <div className="rounded-2xl bg-slate-950 p-6 text-white shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600">
          ✦
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            TriGuard Brief
          </p>

          <h2 className="font-semibold">
            Your day at a glance
          </h2>
        </div>
      </div>

      <p className="text-sm leading-6 text-slate-300">
        You&apos;ve spent ₦{monthTotal.toLocaleString("en-NG")}{" "}
        this month, with {activeTasks} active task
        {activeTasks === 1 ? "" : "s"} and {importantEmails}{" "}
        important email
        {importantEmails === 1 ? "" : "s"} waiting for attention.
      </p>

      <div className="mt-5 grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-white/5 p-3">
          <p className="text-xl font-bold">
            ₦{Math.round(monthTotal / 1000)}k
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Spent
          </p>
        </div>

        <div className="rounded-xl bg-white/5 p-3">
          <p className="text-xl font-bold">
            {activeTasks}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Tasks
          </p>
        </div>

        <div className="rounded-xl bg-white/5 p-3">
          <p className="text-xl font-bold">
            {importantEmails}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Emails
          </p>
        </div>
      </div>
    </div>
  );
}