"use client";

import { FormEvent, useState } from "react";

import {
  getDashboardData,
  sendCommand,
  type DashboardData,
} from "@/lib/dashboardApi";

type CommandBarProps = {
  onUpdated: (data: DashboardData) => void;
};

const examples = [
  "/expense 1500 data",
  "/task Submit assignment",
  "/email",
  "/digest",
];

export default function CommandBar({
  onUpdated,
}: CommandBarProps) {
  const [command, setCommand] = useState("");
  const [busy, setBusy] = useState(false);
  const [reply, setReply] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const trimmed = command.trim();

    if (!trimmed) {
      setError("Enter a TriGuard command.");
      return;
    }

    setBusy(true);
    setReply(null);
    setError(null);

    try {
      const result = await sendCommand(trimmed);

      setReply(result.reply);
      setCommand("");

      const freshData = await getDashboardData();

      onUpdated(freshData);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Command failed."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-white">
          &gt;_
        </div>

        <div>
          <h2 className="font-semibold text-slate-950">
            Talk to TriGuard
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Use the same command system as WhatsApp.
          </p>
        </div>
      </div>

      <form onSubmit={submit}>
        <div className="flex flex-col gap-3 md:flex-row">
          <input
            type="text"
            value={command}
            onChange={(event) =>
              setCommand(event.target.value)
            }
            disabled={busy}
            placeholder="/expense 1500 data"
            className="min-w-0 flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-mono outline-none transition placeholder:font-sans placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
          />

          <button
            type="submit"
            disabled={busy}
            className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60"
          >
            {busy ? "Processing..." : "Run command"}
          </button>
        </div>
      </form>

      <div className="mt-4 flex flex-wrap gap-2">
        {examples.map((example) => (
          <button
            key={example}
            type="button"
            onClick={() => setCommand(example)}
            disabled={busy}
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 font-mono text-xs text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-50"
          >
            {example}
          </button>
        ))}
      </div>

      {reply && (
        <div className="mt-4 whitespace-pre-line rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-800">
          {reply}
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
    </section>
  );
}