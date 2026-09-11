"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import Sidebar from "@/components/layout/Sidebar";
import MobileNav from "@/components/layout/MobileNav";

type WishlistItem = {
  id: string;
  title: string;
  targetAmount: string;
  savedAmount: string;
  currency: string;
  priority: string;
  status: string;
  remindOnLeak: boolean;
  createdAt: string;
  updatedAt: string;
};

export default function WishlistPage() {
  const [items, setItems] =
    useState<WishlistItem[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [title, setTitle] =
    useState("");

  const [targetAmount, setTargetAmount] =
    useState("");

  const [currency, setCurrency] =
    useState("NGN");

  const [priority, setPriority] =
    useState("medium");

  const loadWishlist = useCallback(
    async () => {
      try {
        setLoading(true);
        setError(null);

        const response =
          await fetch(
            "/api/wishlist",
            {
              cache: "no-store",
            }
          );

        const result: unknown =
          await response.json();

        if (!response.ok) {
          throw new Error(
            getApiError(
              result,
              "Unable to load wishlist."
            )
          );
        }

        const payload =
          result as {
            items?: WishlistItem[];
          };

        setItems(
          Array.isArray(payload.items)
            ? payload.items
            : []
        );
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load wishlist."
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    void loadWishlist();
  }, [loadWishlist]);

  const activeItems =
    useMemo(
      () =>
        items.filter(
          (item) =>
            item.status === "active"
        ),
      [items]
    );

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    try {
      setSaving(true);
      setError(null);

      const response =
        await fetch(
          "/api/wishlist",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              title,
              targetAmount:
                Number(targetAmount),
              currency,
              priority,
            }),
          }
        );

      const result: unknown =
        await response.json();

      if (!response.ok) {
        throw new Error(
          getApiError(
            result,
            "Unable to save wishlist item."
          )
        );
      }

      setTitle("");
      setTargetAmount("");
      setPriority("medium");

      await loadWishlist();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to save wishlist item."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex min-h-screen">
        <Sidebar />

        <main className="min-w-0 flex-1 pb-24 lg:pb-0">
          <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            <header className="mb-8">
              <p className="text-sm font-medium text-slate-500">
                Money Guard
              </p>

              <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
                Wishlist
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Save the things you want to buy and keep unfinished goals visible when your spending starts pulling you away from them.
              </p>
            </header>

            {error && (
              <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
              <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-5 py-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h2 className="font-semibold text-slate-950">
                        Your goals
                      </h2>

                      <p className="mt-1 text-xs text-slate-500">
                        {activeItems.length} active wishlist goal
                        {activeItems.length === 1
                          ? ""
                          : "s"}
                      </p>
                    </div>
                  </div>
                </div>

                {loading ? (
                  <div className="space-y-3 p-5">
                    {[1, 2, 3].map(
                      (item) => (
                        <div
                          key={item}
                          className="h-28 animate-pulse rounded-xl bg-slate-100"
                        />
                      )
                    )}
                  </div>
                ) : activeItems.length === 0 ? (
                  <div className="px-5 py-14 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-xl">
                      ☆
                    </div>

                    <p className="mt-4 font-medium text-slate-700">
                      Nothing on your wishlist yet
                    </p>

                    <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-slate-500">
                      Add something you want to buy and Minderra can keep the unfinished goal in view.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {activeItems.map(
                      (item) => {
                        const target =
                          Number(
                            item.targetAmount
                          );

                        const saved =
                          Number(
                            item.savedAmount
                          );

                        const remaining =
                          Math.max(
                            target - saved,
                            0
                          );

                        const progress =
                          target > 0
                            ? Math.min(
                                (saved /
                                  target) *
                                  100,
                                100
                              )
                            : 0;

                        return (
                          <article
                            key={item.id}
                            className="px-5 py-5"
                          >
                            <div className="flex flex-col gap-4">
                              <div className="flex items-start justify-between gap-4">
                                <div>
                                  <h3 className="font-semibold text-slate-900">
                                    {item.title}
                                  </h3>

                                  <p className="mt-1 text-xs text-slate-500">
                                    {item.priority
                                      .charAt(
                                        0
                                      )
                                      .toUpperCase() +
                                      item.priority.slice(
                                        1
                                      )}{" "}
                                    priority
                                  </p>
                                </div>

                                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                                  {item.currency}
                                </span>
                              </div>

                              <div>
                                <div className="flex items-end justify-between gap-3">
                                  <div>
                                    <p className="text-2xl font-bold text-slate-950">
                                      {formatMoney(
                                        saved,
                                        item.currency
                                      )}
                                    </p>

                                    <p className="mt-1 text-xs text-slate-500">
                                      saved of{" "}
                                      {formatMoney(
                                        target,
                                        item.currency
                                      )}
                                    </p>
                                  </div>

                                  <p className="text-right text-xs font-semibold text-slate-600">
                                    {Math.round(
                                      progress
                                    )}
                                    %
                                  </p>
                                </div>

                                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                                  <div
                                    className="h-full rounded-full bg-slate-950 transition-all"
                                    style={{
                                      width: `${progress}%`,
                                    }}
                                  />
                                </div>
                              </div>

                              <div className="rounded-xl bg-slate-50 p-4">
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                  Still needed
                                </p>

                                <p className="mt-1 text-lg font-bold text-slate-900">
                                  {formatMoney(
                                    remaining,
                                    item.currency
                                  )}
                                </p>

                                {item.remindOnLeak && (
                                  <p className="mt-1 text-xs leading-5 text-slate-500">
                                    Minderra can remind you about this unfinished goal when discretionary spending starts getting in the way.
                                  </p>
                                )}
                              </div>
                            </div>
                          </article>
                        );
                      }
                    )}
                  </div>
                )}
              </section>

              <section className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="font-semibold text-slate-950">
                  Save to wishlist
                </h2>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Add something you want to buy and give it a target amount.
                </p>

                <form
                  onSubmit={
                    handleSubmit
                  }
                  className="mt-5 space-y-4"
                >
                  <div>
                    <label
                      htmlFor="wishlist-title"
                      className="block text-xs font-semibold text-slate-600"
                    >
                      Item
                    </label>

                    <input
                      id="wishlist-title"
                      value={title}
                      onChange={(event) =>
                        setTitle(
                          event.target.value
                        )
                      }
                      placeholder="e.g. New headphones"
                      className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-slate-400"
                      required
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="wishlist-target"
                      className="block text-xs font-semibold text-slate-600"
                    >
                      Target amount
                    </label>

                    <input
                      id="wishlist-target"
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={
                        targetAmount
                      }
                      onChange={(event) =>
                        setTargetAmount(
                          event.target.value
                        )
                      }
                      placeholder="180000"
                      className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-slate-400"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label
                        htmlFor="wishlist-currency"
                        className="block text-xs font-semibold text-slate-600"
                      >
                        Currency
                      </label>

                      <select
                        id="wishlist-currency"
                        value={currency}
                        onChange={(event) =>
                          setCurrency(
                            event.target.value
                          )
                        }
                        className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none"
                      >
                        <option value="NGN">
                          NGN
                        </option>
                        <option value="USD">
                          USD
                        </option>
                        <option value="GBP">
                          GBP
                        </option>
                        <option value="EUR">
                          EUR
                        </option>
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="wishlist-priority"
                        className="block text-xs font-semibold text-slate-600"
                      >
                        Priority
                      </label>

                      <select
                        id="wishlist-priority"
                        value={priority}
                        onChange={(event) =>
                          setPriority(
                            event.target.value
                          )
                        }
                        className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none"
                      >
                        <option value="low">
                          Low
                        </option>
                        <option value="medium">
                          Medium
                        </option>
                        <option value="high">
                          High
                        </option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saving
                      ? "Saving..."
                      : "Save to wishlist"}
                  </button>
                </form>
              </section>
            </div>
          </div>
        </main>
      </div>

      <MobileNav />
    </div>
  );
}

function formatMoney(
  amount: number,
  currency: string
) {
  return new Intl.NumberFormat(
    "en-NG",
    {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }
  ).format(amount);
}

function getApiError(
  result: unknown,
  fallback: string
) {
  if (
    result &&
    typeof result === "object" &&
    "error" in result &&
    typeof (
      result as {
        error?: unknown;
      }
    ).error === "string"
  ) {
    return (
      result as {
        error: string;
      }
    ).error;
  }

  return fallback;
}
