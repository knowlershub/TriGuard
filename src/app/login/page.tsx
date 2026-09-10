"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const {
    data: session,
    status: sessionStatus,
  } = useSession();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (sessionStatus === "authenticated") {
      router.replace("/dashboard");
    }
  }, [sessionStatus, router]);

  if (sessionStatus === "loading") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="text-sm font-medium text-slate-500">
          Checking your session...
        </div>
      </main>
    );
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setLoading(true);
    setError(null);

    try {
      const result = await signIn(
        "credentials",
        {
          email,
          password,
          redirect: false,
        }
      );

      if (!result?.ok) {
        const errorCode =
          "code" in (result ?? {})
            ? result?.code
            : undefined;

        if (errorCode === "email_not_found") {
          setError("Mail doesn't exist.");
        } else if (
          errorCode === "wrong_password"
        ) {
          setError("Wrong password.");
        } else if (
          errorCode === "user_not_found"
        ) {
          setError("User account doesn't exist.");
        } else {
          setError("Invalid email or password.");
        }

        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError(
        "Unable to sign in right now."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 font-bold text-white">
              T
            </div>

            <div>
              <div className="font-bold text-slate-950">
                TriGuard
              </div>

              <div className="text-xs text-slate-500">
                Life OS
              </div>
            </div>
          </Link>

          <h1 className="mt-8 text-2xl font-bold text-slate-950">
            Welcome back
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Sign in to your personal TriGuard account.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            aria-live="polite"
            className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700"
          >
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Email
            </label>

            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Password
            </label>

            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading
              ? "Signing in..."
              : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          New to TriGuard?{" "}
          <Link
            href="/signup"
            className="font-semibold text-blue-600 hover:text-blue-700"
          >
            Create an account
          </Link>
        </p>
      </div>
    </main>
  );
}
