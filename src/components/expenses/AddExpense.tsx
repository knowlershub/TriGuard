"use client";

import { FormEvent, useState } from "react";

import {
  getDashboardData,
  sendCommand,
  type DashboardData,
} from "@/lib/dashboardApi";

type AddExpenseProps = {
  onUpdated: (data: DashboardData) => void;
};

export default function AddExpense({
  onUpdated,
}: AddExpenseProps) {
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const testUserId = process.env.NEXT_PUBLIC_TEST_USER_ID;

    if (!testUserId) {
      setError("NEXT_PUBLIC_TEST_USER_ID is not configured.");
      return;
    }

    const trimmed = value.trim();

    if (!trimmed) {
      setError("Enter an amount and description, for example: 1500 data");
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const response = await sendCommand(
        testUserId,
        `/expense ${trimmed}`
      );

      setMessage(response.reply);
      setValue("");

      const freshData = await getDashboardData(testUserId);
      onUpdated(freshData);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to add expense."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="font-semibold text-slate-950">
          Add expense
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Use the same expense parser used by your existing command API.
        </p>
      </div>

      <form
        onSubmit={submit}
        className="flex flex-col gap-3 sm:flex-row"
      >
        <input
          type="text"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          disabled={saving}
          placeholder="e.g. 1500 data"
          className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
        />

        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60"
        >
          {saving ? "Saving..." : "Add expense"}
        </button>
      </form>

      {message && (
        <div className="mt-4 whitespace-pre-line rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {message}
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
    </div>
  );
}