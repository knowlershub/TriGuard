type Task = {
  id: string;
  title: string;
  due: string;
  priority: "High" | "Medium" | "Low";
};

const priorityStyles = {
  High: "bg-red-50 text-red-700",
  Medium: "bg-amber-50 text-amber-700",
  Low: "bg-slate-100 text-slate-600",
};

export default function TaskCard({ task }: { task: Task }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-100 p-3">
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
          task.priority === "High"
            ? "bg-red-50 text-red-600"
            : task.priority === "Medium"
              ? "bg-amber-50 text-amber-600"
              : "bg-slate-100 text-slate-500"
        }`}
      >
        {task.priority === "High" ? "!" : "✓"}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-slate-900">
          {task.title}
        </p>
        <p className="mt-0.5 text-xs text-slate-500">{task.due}</p>
      </div>

      <span
        className={`rounded-full px-2 py-1 text-[10px] font-semibold ${priorityStyles[task.priority]}`}
      >
        {task.priority}
      </span>
    </div>
  );
}