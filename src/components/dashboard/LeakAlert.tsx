type LeakAlertProps = {
  category: string;
  percentage: number;
  message: string;
};

export default function LeakAlert({
  category,
  percentage,
  message,
}: LeakAlertProps) {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
      <div className="flex gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
          ⚠
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-amber-950">
              Spending leak detected
            </h3>

            <span className="rounded-full bg-amber-200 px-2 py-0.5 text-xs font-bold text-amber-800">
              +{percentage}%
            </span>
          </div>

          <p className="mt-1 text-sm text-amber-800">
            {message}
          </p>

          <p className="mt-2 text-xs font-medium text-amber-700">
            Category: {category}
          </p>
        </div>
      </div>
    </div>
  );
}