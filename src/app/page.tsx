import { redirect } from "next/navigation";

<div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
  <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
  Early access
</div>

export default function HomePage() {
  redirect("/dashboard");
}

