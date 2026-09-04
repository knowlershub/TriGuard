export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-[#f7f8fa]">
      <div className="flex min-h-screen">
        <div className="hidden w-64 border-r border-gray-200 bg-white lg:block" />

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl animate-pulse space-y-6">
            <div className="h-10 w-56 rounded-lg bg-gray-200" />

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="h-32 rounded-2xl bg-white shadow-sm" />
              <div className="h-32 rounded-2xl bg-white shadow-sm" />
              <div className="h-32 rounded-2xl bg-white shadow-sm" />
              <div className="h-32 rounded-2xl bg-white shadow-sm" />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="h-80 rounded-2xl bg-white shadow-sm" />
              <div className="h-80 rounded-2xl bg-white shadow-sm" />
            </div>

            <div className="h-72 rounded-2xl bg-white shadow-sm" />
          </div>
        </main>
      </div>
    </div>
  );
}
