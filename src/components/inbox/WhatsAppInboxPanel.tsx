"use client";

import { useCallback, useEffect, useState } from "react";

type WhatsAppMessage = {
  id: string;
  direction: string;
  messageType: string;
  body: string | null;
  mediaId: string | null;
  sentAt: string;
  createdAt: string;
};

type WhatsAppResponse = {
  connected: boolean;
  whatsappId: string | null;
  messages: WhatsAppMessage[];
};

export default function WhatsAppInboxPanel() {
  const [data, setData] =
    useState<WhatsAppResponse | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const loadMessages = useCallback(
    async (manual = false) => {
      try {
        if (manual) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError(null);

        const response = await fetch(
          "/api/inbox/whatsapp",
          {
            cache: "no-store",
          }
        );

        const result: unknown =
          await response.json();

        if (!response.ok) {
          const message =
            result &&
            typeof result === "object" &&
            "error" in result &&
            typeof (
              result as {
                error?: unknown;
              }
            ).error === "string"
              ? (
                  result as {
                    error: string;
                  }
                ).error
              : "Unable to load WhatsApp messages.";

          throw new Error(message);
        }

        setData(
          result as WhatsAppResponse
        );
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load WhatsApp messages."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    void loadMessages();
  }, [loadMessages]);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-5 py-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-lg">
                💬
              </div>

              <div>
                <h2 className="font-semibold text-slate-950">
                  WhatsApp messages
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Your messages to Minderra, including receipt and wishlist activity.
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              void loadMessages(true)
            }
            disabled={
              loading || refreshing
            }
            className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {refreshing
              ? "Refreshing..."
              : "Refresh"}
          </button>
        </div>
      </div>

      {error && (
        <div className="m-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading && !data && (
        <div className="space-y-3 p-5">
          {[1, 2, 3].map(
            (item) => (
              <div
                key={item}
                className="h-20 animate-pulse rounded-xl bg-slate-100"
              />
            )
          )}
        </div>
      )}

      {data && (
        <>
          <div className="grid gap-4 border-b border-slate-100 p-5 sm:grid-cols-3">
            <MiniCard
              label="Connection"
              value={
                data.connected
                  ? "Connected"
                  : "Not connected"
              }
              valueClassName={
                data.connected
                  ? "text-emerald-700"
                  : "text-amber-700"
              }
            />

            <MiniCard
              label="Messages"
              value={String(
                data.messages.length
              )}
            />

            <MiniCard
              label="Receipt support"
              value="User-only"
            />
          </div>

          {!data.connected ? (
            <div className="px-5 py-14 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-xl">
                🔗
              </div>

              <p className="mt-4 font-medium text-slate-700">
                WhatsApp is not connected
              </p>

              <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-slate-500">
                Connect your WhatsApp account in Minderra before messages and receipt photos can be processed.
              </p>
            </div>
          ) : data.messages.length === 0 ? (
            <div className="px-5 py-14 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-xl">
                💬
              </div>

              <p className="mt-4 font-medium text-slate-700">
                No WhatsApp messages yet
              </p>

              <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-slate-500">
                Messages you send to Minderra from your connected WhatsApp number will appear here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {data.messages.map(
                (message) => (
                  <article
                    key={message.id}
                    className="px-5 py-5 transition hover:bg-slate-50/60"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm ${
                          message.messageType ===
                          "image"
                            ? "bg-blue-50 text-blue-700"
                            : "bg-emerald-50 text-emerald-700"
                        }`}
                      >
                        {message.messageType ===
                        "image"
                          ? "🧾"
                          : "💬"}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <h3 className="font-semibold text-slate-900">
                              {message.messageType ===
                              "image"
                                ? "Receipt / image"
                                : "WhatsApp message"}
                            </h3>

                            <p className="mt-1 text-xs text-slate-500">
                              {formatDate(
                                message.sentAt
                              )}
                            </p>
                          </div>

                          <span className="w-fit rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                            User message
                          </span>
                        </div>

                        {message.body && (
                          <div className="mt-3 rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                            {message.body}
                          </div>
                        )}

                        {message.messageType ===
                          "image" && (
                          <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50 p-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                              Receipt scanner
                            </p>

                            <p className="mt-1 text-sm leading-6 text-blue-900">
                              This image was eligible for receipt scanning because it came from the connected Minderra user.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </article>
                )
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
}

function MiniCard({
  label,
  value,
  valueClassName = "text-slate-950",
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-medium text-slate-500">
        {label}
      </p>

      <p
        className={`mt-1 text-lg font-bold ${valueClassName}`}
      >
        {value}
      </p>
    </div>
  );
}

function formatDate(
  value: string
) {
  return new Date(value).toLocaleString(
    "en-NG",
    {
      dateStyle: "medium",
      timeStyle: "short",
    }
  );
}
