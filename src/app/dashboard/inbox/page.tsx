"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import MobileNav from "@/components/layout/MobileNav";
import {
  getDashboardData,
  type DashboardData,
} from "@/lib/dashboardApi";

export default function InboxPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const testUserId = process.env.NEXT_PUBLIC_TEST_USER_ID;

    if (!testUserId) {
      setError("NEXT_PUBLIC_TEST_USER_ID is not configured.");
      return;
    }

    getDashboardData(testUserId)
      .then(setData)
      .catch((err) => {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load inbox."
        );
      });
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex min-h-screen">
        <Sidebar />

        <main className="min-w-0 flex-1 pb-24 lg:pb-0">
          <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            <div className="mb-8">
              <p className="text-sm font-medium text-slate-500">
                Info Guard
              </p>

              <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
                InboxZero
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                Summaries and routed information from your email pipeline.
              </p>
            </div>

            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
                {error}
              </div>
            )}

            {!data && !error && (
              <div className="h-80 animate-pulse rounded-2xl bg-slate-200" />
            )}

            {data && (
              <>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-sm text-slate-500">Processed today</p>
                    <p className="mt-2 text-2xl font-bold">
                      {data.summary.emailProcessedToday}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-sm text-slate-500">
                      Action required
                    </p>
                    <p className="mt-2 text-2xl font-bold text-red-600">
                      {data.summary.actionRequiredEmails}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-sm text-slate-500">
                      Subscriptions
                    </p>
                    <p className="mt-2 text-2xl font-bold">
                      {data.summary.subscriptions}
                    </p>
                  </div>
                </div>

                <div className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-100 px-5 py-4">
                    <h2 className="font-semibold text-slate-950">
                      Recent summaries
                    </h2>
                  </div>

                  {data.emails.length === 0 ? (
                    <div className="px-5 py-12 text-center">
                      <p className="font-medium text-slate-700">
                        No email summaries yet
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Connect Gmail and run the email pipeline.
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {data.emails.map((email) => (
                        <article
                          key={email.id}
                          className="px-5 py-5"
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="flex gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 font-semibold text-slate-700">
                                ✉
                              </div>

                              <div>
                                <h3 className="font-semibold text-slate-900">
                                  {email.subject || "Untitled email"}
                                </h3>

                                <p className="mt-1 text-xs text-slate-500">
                                  {new Date(
                                    email.createdAt
                                  ).toLocaleString("en-NG")}
                                </p>
                              </div>
                            </div>

                            {email.detectedType && (
                              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                                {email.detectedType}
                              </span>
                            )}
                          </div>

                          {email.summary && (
                            <div className="mt-4 rounded-xl bg-slate-50 p-4">
                              <p className="text-sm leading-6 text-slate-600">
                                {email.summary}
                              </p>
                            </div>
                          )}

                          {email.routedTo && (
                            <p className="mt-3 text-xs font-medium text-slate-500">
                              Routed to: {email.routedTo}
                            </p>
                          )}
                        </article>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </main>
      </div>

      <MobileNav />
    </div>
  );
}