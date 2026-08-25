"use client";

import Link from "next/link";

import Sidebar from "@/components/layout/Sidebar";
import MobileNav from "@/components/layout/MobileNav";
import ComingSoon from "@/components/ui/ComingSoon";

export default function ComingSoonPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex min-h-screen">
        <Sidebar />

        <main className="min-w-0 flex-1 pb-24 lg:pb-0">
          <div className="mx-auto flex min-h-screen max-w-4xl items-center px-4 py-12 sm:px-6 lg:px-8">
            <div className="w-full">
              <div className="mb-8 text-center">
                <p className="text-sm font-medium text-slate-500">
                  TriGuard Early Access
                </p>

                <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
                  Something useful is on the way
                </h1>

                <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
                  We&apos;re building this part of TriGuard carefully
                  so it works well when it arrives.
                </p>
              </div>

              <ComingSoon
                title="Feature coming soon"
                description="This capability isn't available in the current early-access release yet."
              />

              <div className="mt-6 text-center">
                <Link
                  href="/dashboard"
                  className="inline-flex rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Back to dashboard
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>

      <MobileNav />
    </div>
  );
}