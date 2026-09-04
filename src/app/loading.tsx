export default function Loading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f8fa]">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-gray-900" />

        <div className="text-center">
          <p className="text-sm font-medium text-gray-900">
            Loading TriGuard
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Preparing your dashboard...
          </p>
        </div>
      </div>
    </main>
  );
}
