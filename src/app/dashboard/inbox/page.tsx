"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import Sidebar from "@/components/layout/Sidebar";
import MobileNav from "@/components/layout/MobileNav";

import {
  getDashboardData,
  getGmailConnectionStatus,
  sendCommand,
  type DashboardData,
  type GmailConnectionStatus,
} from "@/lib/dashboardApi";

type EmailFilter =
  | "all"
  | "action_item"
  | "bill"
  | "subscription"
  | "other";

export default function InboxPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [gmail, setGmail] =
    useState<GmailConnectionStatus | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [lastChecked, setLastChecked] =
    useState<Date | null>(null);

  const [expandedEmails, setExpandedEmails] =
    useState<Set<string>>(new Set());

  const [emailFilter, setEmailFilter] =
    useState<EmailFilter>("all");

  async function loadInbox() {
    const testUserId =
      process.env.NEXT_PUBLIC_TEST_USER_ID;

    if (!testUserId) {
      throw new Error(
        "NEXT_PUBLIC_TEST_USER_ID is not configured."
      );
    }

    const [dashboardData, gmailStatus] =
      await Promise.all([
        getDashboardData(testUserId),
        getGmailConnectionStatus(testUserId),
      ]);

    setData(dashboardData);
    setGmail(gmailStatus);
  }

  useEffect(() => {
    loadInbox()
      .then(() => {
        setLastChecked(new Date());
      })
      .catch((err) => {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load inbox."
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  async function runEmailPipeline() {
    const testUserId =
      process.env.NEXT_PUBLIC_TEST_USER_ID;

    if (!testUserId) {
      setError(
        "NEXT_PUBLIC_TEST_USER_ID is not configured."
      );
      return;
    }

    if (!gmail?.connected) {
      setError(
        "Gmail is not connected. Connect Gmail before checking the inbox."
      );
      return;
    }

    if (gmail.needsReauth) {
      setError(
        "Your Gmail connection needs to be reconnected."
      );
      return;
    }

    setRefreshing(true);
    setError(null);
    setMessage(null);

    try {
      const result = await sendCommand(
        testUserId,
        "/email"
      );

      setMessage(result.reply);

      await loadInbox();
      setLastChecked(new Date());
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to run the Gmail pipeline."
      );
    } finally {
      setRefreshing(false);
    }
  }

  function toggleEmail(id: string) {
    setExpandedEmails((current) => {
      const next = new Set(current);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });
  }

  const testUserId =
    process.env.NEXT_PUBLIC_TEST_USER_ID;

  const gmailConnectUrl = testUserId
    ? `/api/auth/gmail/start?userId=${encodeURIComponent(
        testUserId
      )}`
    : "#";

  const gmailConnected =
    gmail?.connected === true &&
    gmail?.needsReauth !== true;

  const filteredEmails =
    data?.emails.filter((email) => {
      if (emailFilter === "all") {
        return true;
      }

      if (emailFilter === "other") {
        return (
          email.detectedType === null ||
          ![
            "action_item",
            "bill",
            "subscription",
          ].includes(email.detectedType)
        );
      }

      return email.detectedType === emailFilter;
    }) ?? [];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex min-h-screen">
        <Sidebar />

        <main className="min-w-0 flex-1 pb-24 lg:pb-0">
          <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            <header className="mb-8">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Info Guard
                  </p>

                  <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
                    InboxZero
                  </h1>

                  <p className="mt-2 text-sm text-slate-500">
                    Summaries and routed information from your email
                    pipeline.
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  {gmailConnected ? (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5">
                      <p className="text-xs font-semibold text-emerald-700">
                        Gmail connected
                      </p>

                      <p className="mt-0.5 text-xs text-emerald-600">
                        {gmail?.emailAddress}
                      </p>
                    </div>
                  ) : gmail?.needsReauth ? (
                    <Link
                      href={gmailConnectUrl}
                      className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-700 transition hover:bg-amber-100"
                    >
                      Reconnect Gmail
                    </Link>
                  ) : (
                    <Link
                      href={gmailConnectUrl}
                      className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                    >
                      Connect Gmail
                    </Link>
                  )}

                  <button
                    type="button"
                    onClick={runEmailPipeline}
                    disabled={
                      refreshing ||
                      loading ||
                      !gmailConnected
                    }
                    className="flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span
                      className={
                        refreshing
                          ? "animate-spin"
                          : ""
                      }
                      aria-hidden="true"
                    >
                      ↻
                    </span>

                    {refreshing
                      ? "Checking Gmail..."
                      : "Check Gmail"}
                  </button>
                </div>
              </div>

              {lastChecked && (
                <p className="mt-3 text-xs text-slate-400">
                  Last checked{" "}
                  {lastChecked.toLocaleTimeString("en-NG", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              )}
            </header>

            {error && (
              <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
                {error}
              </div>
            )}

            {message && (
              <div className="mb-6 whitespace-pre-line rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-700">
                {message}
              </div>
            )}

            {!data && loading && (
              <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-3">
                  {[1, 2, 3].map((item) => (
                    <div
                      key={item}
                      className="h-32 animate-pulse rounded-2xl bg-slate-200"
                    />
                  ))}
                </div>

                <div className="h-96 animate-pulse rounded-2xl bg-slate-200" />
              </div>
            )}

            {!loading && data && (
              <>
                {!gmailConnected &&
                  !gmail?.needsReauth && (
                    <section className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
                      <p className="text-sm font-semibold text-amber-950">
                        Gmail is not connected
                      </p>

                      <p className="mt-1 text-sm leading-6 text-amber-800">
                        Connect Gmail to let InboxZero retrieve,
                        summarize, and route your messages.
                      </p>

                      <Link
                        href={gmailConnectUrl}
                        className="mt-4 inline-flex rounded-xl bg-amber-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-900"
                      >
                        Connect Gmail
                      </Link>
                    </section>
                  )}

                {gmail?.needsReauth && (
                  <section className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
                    <p className="text-sm font-semibold text-amber-950">
                      Gmail connection needs attention
                    </p>

                    <p className="mt-1 text-sm leading-6 text-amber-800">
                      Your Gmail refresh token could not be used.
                      Reconnect Gmail to continue processing your inbox.
                    </p>

                    <Link
                      href={gmailConnectUrl}
                      className="mt-4 inline-flex rounded-xl bg-amber-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-900"
                    >
                      Reconnect Gmail
                    </Link>
                  </section>
                )}

                <section className="grid gap-4 sm:grid-cols-3">
                  <SummaryCard
                    label="Processed today"
                    value={
                      data.summary.emailProcessedToday
                    }
                  />

                  <SummaryCard
                    label="Action required"
                    value={
                      data.summary.actionRequiredEmails
                    }
                    valueClassName="text-red-600"
                  />

                  <SummaryCard
                    label="Subscriptions"
                    value={
                      data.summary.subscriptions
                    }
                  />
                </section>

                <section className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-100 px-5 py-4">
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <h2 className="font-semibold text-slate-950">
                            Recent summaries
                          </h2>

                          <p className="mt-1 text-xs text-slate-500">
                            AI summaries and routing decisions from your
                            Gmail.
                          </p>
                        </div>

                        {gmailConnected && (
                          <button
                            type="button"
                            onClick={runEmailPipeline}
                            disabled={refreshing}
                            className="w-fit rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                          >
                            {refreshing
                              ? "Checking..."
                              : "Check for new mail"}
                          </button>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <EmailFilterButton
                          label="All"
                          count={data.emails.length}
                          active={
                            emailFilter === "all"
                          }
                          onClick={() =>
                            setEmailFilter("all")
                          }
                        />

                        <EmailFilterButton
                          label="Action"
                          count={
                            data.emails.filter(
                              (email) =>
                                email.detectedType ===
                                "action_item"
                            ).length
                          }
                          active={
                            emailFilter === "action_item"
                          }
                          onClick={() =>
                            setEmailFilter(
                              "action_item"
                            )
                          }
                        />

                        <EmailFilterButton
                          label="Bills"
                          count={
                            data.emails.filter(
                              (email) =>
                                email.detectedType ===
                                "bill"
                            ).length
                          }
                          active={
                            emailFilter === "bill"
                          }
                          onClick={() =>
                            setEmailFilter("bill")
                          }
                        />

                        <EmailFilterButton
                          label="Subscriptions"
                          count={
                            data.emails.filter(
                              (email) =>
                                email.detectedType ===
                                "subscription"
                            ).length
                          }
                          active={
                            emailFilter ===
                            "subscription"
                          }
                          onClick={() =>
                            setEmailFilter(
                              "subscription"
                            )
                          }
                        />

                        <EmailFilterButton
                          label="Other"
                          count={
                            data.emails.filter(
                              (email) =>
                                email.detectedType ===
                                  null ||
                                ![
                                  "action_item",
                                  "bill",
                                  "subscription",
                                ].includes(
                                  email.detectedType
                                )
                            ).length
                          }
                          active={
                            emailFilter === "other"
                          }
                          onClick={() =>
                            setEmailFilter("other")
                          }
                        />
                      </div>

                      {emailFilter !== "all" && (
                        <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
                          <p className="text-xs text-slate-500">
                            Showing{" "}
                            <span className="font-semibold text-slate-700">
                              {getFilterLabel(
                                emailFilter
                              )}
                            </span>{" "}
                            emails
                          </p>

                          <button
                            type="button"
                            onClick={() =>
                              setEmailFilter("all")
                            }
                            className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                          >
                            Clear filter
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {filteredEmails.length === 0 ? (
                    <div className="px-5 py-14 text-center">
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-xl">
                        ✉
                      </div>

                      <p className="mt-4 font-medium text-slate-700">
                        {data.emails.length === 0
                          ? "No email summaries yet"
                          : "No matching emails"}
                      </p>

                      <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-slate-500">
                        {data.emails.length === 0
                          ? gmailConnected
                            ? "Your Gmail account is connected. Click Check Gmail to process new messages."
                            : "Connect Gmail first, then run the email pipeline."
                          : "There are no emails in this category."}
                      </p>

                      {data.emails.length === 0 &&
                        !gmailConnected && (
                          <Link
                            href={gmailConnectUrl}
                            className="mt-5 inline-flex rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                          >
                            {gmail?.needsReauth
                              ? "Reconnect Gmail"
                              : "Connect Gmail"}
                          </Link>
                        )}
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {filteredEmails.map((email) => {
                        const expanded =
                          expandedEmails.has(
                            email.id
                          );

                        const summaryLines =
                          getSummaryLines(
                            email.summary
                          );

                        return (
                          <article
                            key={email.id}
                            className="px-5 py-5 transition hover:bg-slate-50/60"
                          >
                            <div className="flex flex-col gap-4">
                              <div className="flex items-start gap-3">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-sm font-semibold text-slate-700">
                                  ✉
                                </div>

                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                    <div className="min-w-0">
                                      <h3 className="truncate font-semibold text-slate-900">
                                        {email.subject ||
                                          "Untitled email"}
                                      </h3>

                                      <p className="mt-1 text-xs text-slate-500">
                                        {formatDate(
                                          email.createdAt
                                        )}
                                      </p>
                                    </div>

                                    {email.detectedType && (
                                      <TypeBadge
                                        type={
                                          email.detectedType
                                        }
                                      />
                                    )}
                                  </div>

                                  {summaryLines.length > 0 ? (
                                    <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-4">
                                      <div className="flex items-center justify-between gap-3">
                                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                          AI summary
                                        </p>

                                        {summaryLines.length >
                                          2 && (
                                          <button
                                            type="button"
                                            onClick={() =>
                                              toggleEmail(
                                                email.id
                                              )
                                            }
                                            className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                                          >
                                            {expanded
                                              ? "Show less"
                                              : "Show more"}
                                          </button>
                                        )}
                                      </div>

                                      <ul className="mt-3 space-y-2">
                                        {(expanded
                                          ? summaryLines
                                          : summaryLines.slice(
                                              0,
                                              2
                                            )
                                        ).map(
                                          (
                                            line,
                                            index
                                          ) => (
                                            <li
                                              key={`${email.id}-${index}`}
                                              className="flex gap-2 text-sm leading-6 text-slate-700"
                                            >
                                              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />

                                              <span>
                                                {line}
                                              </span>
                                            </li>
                                          )
                                        )}
                                      </ul>
                                    </div>
                                  ) : (
                                    <div className="mt-4 rounded-xl border border-dashed border-slate-200 p-4">
                                      <p className="text-sm text-slate-400">
                                        No summary was generated for
                                        this email.
                                      </p>
                                    </div>
                                  )}

                                  <div className="mt-4 flex flex-wrap items-center gap-2">
                                    {email.routedTo && (
                                      <>
                                        <span className="text-xs font-medium text-slate-400">
                                          Routed to
                                        </span>

                                        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                                          {email.routedTo}
                                        </span>
                                      </>
                                    )}

                                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
                                      Gmail
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  )}
                </section>
              </>
            )}
          </div>
        </main>
      </div>

      <MobileNav />
    </div>
  );
}

function SummaryCard({
  label,
  value,
  valueClassName = "text-slate-950",
}: {
  label: string;
  value: number;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">
        {label}
      </p>

      <p
        className={`mt-2 text-2xl font-bold ${valueClassName}`}
      >
        {value}
      </p>
    </div>
  );
}

function TypeBadge({
  type,
}: {
  type: string;
}) {
  const normalized = type.toLowerCase();

  let classes =
    "bg-blue-50 text-blue-700";

  if (normalized === "action_item") {
    classes = "bg-red-50 text-red-700";
  } else if (normalized === "subscription") {
    classes = "bg-amber-50 text-amber-700";
  } else if (normalized === "bill") {
    classes = "bg-purple-50 text-purple-700";
  }

  return (
    <span
      className={`w-fit shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${classes}`}
    >
      {formatDetectedType(type)}
    </span>
  );
}

function formatDetectedType(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}

function getSummaryLines(
  summary: string | null
): string[] {
  if (!summary) {
    return [];
  }

  return summary
    .split(/\r?\n/)
    .map((line) =>
      line
        .replace(/^\s*[-•*]\s*/, "")
        .replace(/^\s*\d+[.)]\s*/, "")
        .trim()
    )
    .filter(Boolean);
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function getFilterLabel(
  filter: EmailFilter
) {
  switch (filter) {
    case "action_item":
      return "Action required";

    case "bill":
      return "Bills";

    case "subscription":
      return "Subscriptions";

    case "other":
      return "Other";

    default:
      return "All";
  }
}

function EmailFilterButton({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
        active
          ? "bg-slate-950 text-white shadow-sm"
          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
      }`}
    >
      <span>{label}</span>

      <span
        className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
          active
            ? "bg-white/15 text-white"
            : "bg-white text-slate-500"
        }`}
      >
        {count}
      </span>
    </button>
  );
}