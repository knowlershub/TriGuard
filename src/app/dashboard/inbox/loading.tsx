export default function InboxLoading() {
  return (
    <div className="animate-pulse space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="h-8 w-32 rounded-lg bg-gray-200" />

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <div className="h-16 border-b border-gray-100" />
        <div className="h-20 border-b border-gray-100" />
        <div className="h-20 border-b border-gray-100" />
        <div className="h-20 border-b border-gray-100" />
        <div className="h-20" />
      </div>
    </div>
  );
}
