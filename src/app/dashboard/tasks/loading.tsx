export default function TasksLoading() {
  return (
    <div className="animate-pulse space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="h-8 w-32 rounded-lg bg-gray-200" />

      <div className="h-16 rounded-xl bg-white shadow-sm" />

      <div className="space-y-3">
        <div className="h-20 rounded-xl bg-white shadow-sm" />
        <div className="h-20 rounded-xl bg-white shadow-sm" />
        <div className="h-20 rounded-xl bg-white shadow-sm" />
      </div>
    </div>
  );
}
