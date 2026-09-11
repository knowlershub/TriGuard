"use client";

import { FormEvent, useState } from "react";

import {
  getDashboardData,
  sendCommand,
  type DashboardData,
} from "@/lib/dashboardApi";

type QuickActionsProps = {
  onUpdated: (data: DashboardData) => void;
};

export default function QuickActions({
  onUpdated,
}: QuickActionsProps) {
  const [mode, setMode] =
    useState<"expense" | "task">("expense");

  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] =
    useState<string | null>(null);

  const [error, setError] =
    useState<string | null>(null);

  async function refreshDashboard() {
    const freshData = await getDashboardData();

    onUpdated(freshData);
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const trimmed = value.trim();

    if (!trimmed) {
      setError(
        mode === "expense"
          ? 'Example: "2350 fuel"'
          : 'Example: "Submit assignment"'
      );
      return;
    }

    setBusy(true);
    setError(null);
    setMessage(null);

    try {
      const command =
        mode === "expense"
          ? `/expense ${trimmed}`
          : `/task ${trimmed}`;

      const result = await sendCommand(command);

      setMessage(result.reply);
      setValue("");

      await refreshDashboard();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5">
        <h2 className="font-semibold text-slate-950">
          Quick actions
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Update Minderra without leaving the dashboard.
        </p>
      </div>

      <div className="mb-4 flex gap-2">
        <button
          type="button"
          onClick={() => {
            setMode("expense");
            setMessage(null);
            setError(null);
          }}
          className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
            mode === "expense"
              ? "bg-blue-600 text-white"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          Log expense
        </button>

        <button
          type="button"
          onClick={() => {
            setMode("task");
            setMessage(null);
            setError(null);
          }}
          className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
            mode === "task"
              ? "bg-blue-600 text-white"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          Add task
        </button>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-3 sm:flex-row"
      >
        <div className="flex-1">
          <label
            htmlFor="quick-action"
            className="sr-only"
          >
            {mode === "expense"
              ? "Expense"
              : "Task"}
          </label>

          <input
            id="quick-action"
            value={value}
            onChange={(event) =>
              setValue(event.target.value)
            }
            placeholder={
              mode === "expense"
                ? "e.g. 2350 fuel"
                : "e.g. Submit assignment"
            }
            disabled={busy}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
          />
        </div>

        <button
          type="submit"
          disabled={busy}
          className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-wait disabled:opacity-60"
        >
          {busy
            ? "Saving..."
            : mode === "expense"
              ? "Log"
              : "Create"}
        </button>
      </form>

      {message && (
        <div className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
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