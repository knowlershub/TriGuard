"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[TriGuard] Application error:", error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f8fa] px-6">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
          !
        </div>

        <h1 className="mt-5 text-xl font-semibold text-gray-900">
          Something went wrong
        </h1>

        <p className="mt-2 text-sm leading-6 text-gray-500">
          TriGuard ran into an unexpected problem. Please try again.
        </p>

        <button
          type="button"
          onClick={() => reset()}
          className="mt-6 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
