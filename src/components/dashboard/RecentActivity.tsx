type Activity = {
  id: string;
  time: string;
  title: string;
  description: string;
  type: "expense" | "task" | "email";
};

const icons = {
  expense: "₦",
  task: "✓",
  email: "✉",
};

export default function RecentActivity({
  activities,
}: {
  activities: Activity[];
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <div>
          <h2 className="font-semibold text-slate-950">Recent activity</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            What TriGuard has processed
          </p>
        </div>
      </div>

      <div className="divide-y divide-slate-100">
        {activities.map((activity) => (
          <div key={activity.id} className="flex gap-4 px-5 py-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-sm font-semibold text-slate-700">
              {icons[activity.type]}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-col justify-between gap-1 sm:flex-row">
                <p className="text-sm font-semibold text-slate-900">
                  {activity.title}
                </p>

                <span className="text-xs text-slate-400">
                  {activity.time}
                </span>
              </div>

              <p className="mt-1 text-sm text-slate-500">
                {activity.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}