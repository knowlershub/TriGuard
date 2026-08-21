type SpendingCardProps = {
  amount: number;
  label: string;
  change: number;
  previousAmount?: number;
  transactionCount?: number;
};

export default function SpendingCard({
  amount,
  label,
  change,
  previousAmount = 0,
  transactionCount = 0,
}: SpendingCardProps) {
  const hasComparison = previousAmount > 0;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {label}
          </p>

          <p className="mt-1 text-2xl font-bold tracking-tight text-slate-950">
            ₦{amount.toLocaleString("en-NG")}
          </p>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          ₦
        </div>
      </div>

      {hasComparison ? (
        <div
          className={`text-sm font-medium ${
            change > 0
              ? "text-red-600"
              : change < 0
                ? "text-emerald-600"
                : "text-slate-500"
          }`}
        >
          {change > 0 ? "↑" : change < 0 ? "↓" : "→"}{" "}
          {Math.abs(change).toFixed(1)}%
          <span className="ml-1 font-normal text-slate-500">
            vs last month
          </span>
        </div>
      ) : (
        <div className="text-sm font-medium text-slate-500">
          {transactionCount}{" "}
          {transactionCount === 1 ? "transaction" : "transactions"} this month
        </div>
      )}
    </div>
  );
}