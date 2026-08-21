"use client";

import {
  ChangeEvent,
  DragEvent,
  useRef,
  useState,
} from "react";

import {
  getDashboardData,
  saveReceiptExpense,
} from "@/lib/dashboardApi";

type ParsedReceipt = {
  amount: string | null;
  merchant: string | null;
};

type OcrProvider = "google_vision" | "tesseract";

type OcrResponse = {
  rawText: string;
  parsed: ParsedReceipt;
  provider: OcrProvider;
};

type ReceiptScannerProps = {
  onSaved?: () => Promise<void> | void;
};

const currencies = [
  { code: "NGN", symbol: "₦" },
  { code: "USD", symbol: "$" },
  { code: "GBP", symbol: "£" },
  { code: "EUR", symbol: "€" },
];

export default function ReceiptScanner({
  onSaved,
}: ReceiptScannerProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const previewUrlRef = useRef<string | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    null
  );

  const [result, setResult] = useState<OcrResponse | null>(
    null
  );

  const [merchant, setMerchant] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("NGN");
  const [category, setCategory] = useState("Other");
  const [occurredAt, setOccurredAt] = useState(
    new Date().toISOString().slice(0, 10)
  );

  const [dragging, setDragging] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState<string | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  function clearPreviewUrl() {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
  }

  function selectFile(selectedFile: File | null) {
    setError(null);
    setMessage(null);
    setResult(null);

    setMerchant("");
    setAmount("");
    setCurrency("NGN");
    setCategory("Other");
    setOccurredAt(
      new Date().toISOString().slice(0, 10)
    );

    clearPreviewUrl();

    if (!selectedFile) {
      setFile(null);
      setPreviewUrl(null);
      return;
    }

    if (!selectedFile.type.startsWith("image/")) {
      setFile(null);
      setPreviewUrl(null);
      setError("Please select an image file.");
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setFile(null);
      setPreviewUrl(null);
      setError("The image must be 10MB or smaller.");
      return;
    }

    const nextPreviewUrl =
      URL.createObjectURL(selectedFile);

    previewUrlRef.current = nextPreviewUrl;

    setFile(selectedFile);
    setPreviewUrl(nextPreviewUrl);
  }

  function handleFileChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    selectFile(event.target.files?.[0] ?? null);
  }

  function handleDrop(
    event: DragEvent<HTMLDivElement>
  ) {
    event.preventDefault();
    setDragging(false);

    selectFile(event.dataTransfer.files?.[0] ?? null);
  }

  async function scanReceipt() {
    if (!file) {
      setError("Select a receipt image first.");
      return;
    }

    setScanning(true);
    setError(null);
    setMessage(null);
    setResult(null);

    try {
      const formData = new FormData();

      formData.append("image", file);

      const response = await fetch("/api/test/ocr", {
        method: "POST",
        body: formData,
      });

      const data = (await response.json().catch(() => null)) as
        | OcrResponse
        | { error?: string }
        | null;

      if (!response.ok) {
        throw new Error(
          data &&
            "error" in data &&
            typeof data.error === "string"
            ? data.error
            : `OCR request failed with status ${response.status}.`
        );
      }

      if (
        !data ||
        !("rawText" in data) ||
        !("parsed" in data)
      ) {
        throw new Error(
          "OCR returned an unexpected response."
        );
      }

      const provider =
        "provider" in data &&
        (data.provider === "google_vision" ||
          data.provider === "tesseract")
          ? data.provider
          : "tesseract";

      const detectedMerchant =
        data.parsed?.merchant ?? "";

      const detectedAmount =
        data.parsed?.amount ?? "";

      setMerchant(detectedMerchant);
      setAmount(detectedAmount);

      setResult({
        rawText: data.rawText,
        parsed: {
          amount: detectedAmount || null,
          merchant: detectedMerchant || null,
        },
        provider,
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to scan this receipt."
      );
    } finally {
      setScanning(false);
    }
  }

  async function saveExpense() {
    const testUserId =
      process.env.NEXT_PUBLIC_TEST_USER_ID;

    if (!testUserId) {
      setError(
        "NEXT_PUBLIC_TEST_USER_ID is not configured."
      );
      return;
    }

    const trimmedMerchant = merchant.trim();
    const numericAmount = Number(amount);

    if (!trimmedMerchant) {
      setError("Enter a merchant name before saving.");
      return;
    }

    if (
      !amount ||
      !Number.isFinite(numericAmount) ||
      numericAmount <= 0
    ) {
      setError("Enter a valid positive amount.");
      return;
    }

    if (!occurredAt) {
      setError("Select the expense date.");
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      await saveReceiptExpense({
        testUserId,
        merchant: trimmedMerchant,
        amount: numericAmount,
        currency,
        category:
          category.trim() || "Other",
        occurredAt,
        rawText: result?.rawText ?? "",
      });

      setMessage(
        "Receipt expense saved successfully."
      );

      const freshData =
        await getDashboardData(testUserId);

      void freshData;

      if (onSaved) {
        await onSaved();
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to save expense."
      );
    } finally {
      setSaving(false);
    }
  }

  function resetScanner() {
    clearPreviewUrl();

    setFile(null);
    setPreviewUrl(null);
    setResult(null);

    setMerchant("");
    setAmount("");
    setCurrency("NGN");
    setCategory("Other");
    setOccurredAt(
      new Date().toISOString().slice(0, 10)
    );

    setMessage(null);
    setError(null);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  const currencySymbol =
    currencies.find(
      (item) => item.code === currency
    )?.symbol ?? "₦";

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            📷
          </div>

          <div>
            <h2 className="font-semibold text-slate-950">
              Scan a receipt
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Tesseract will extract the receipt text. Review and
              correct the details before saving.
            </p>
          </div>
        </div>
      </div>

      {!file ? (
        <div
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition ${
            dragging
              ? "border-blue-500 bg-blue-50"
              : "border-slate-200 bg-slate-50 hover:border-blue-300 hover:bg-blue-50/40"
          }`}
        >
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm">
            🧾
          </div>

          <p className="mt-4 font-semibold text-slate-800">
            Upload your receipt
          </p>

          <p className="mt-1 text-sm text-slate-500">
            Click to browse or drag and drop an image here.
          </p>

          <p className="mt-3 text-xs text-slate-400">
            JPG, PNG, WEBP · Maximum 10MB
          </p>

          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Receipt preview"
                className="max-h-80 w-full object-contain"
              />
            ) : (
              <div className="flex h-64 items-center justify-center text-slate-400">
                No preview
              </div>
            )}

            <div className="border-t border-slate-200 bg-white p-3">
              <p className="truncate text-sm font-medium text-slate-700">
                {file.name}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>

          <div className="flex flex-col justify-between">
            <div>
              <p className="text-sm font-medium text-slate-700">
                Ready to scan
              </p>

              <p className="mt-1 text-sm leading-6 text-slate-500">
                Upload first, then review the detected information.
              </p>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={scanReceipt}
                disabled={scanning || saving}
                className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60"
              >
                {scanning
                  ? "Scanning..."
                  : "Scan receipt"}
              </button>

              <button
                type="button"
                onClick={resetScanner}
                disabled={scanning || saving}
                className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
              >
                Choose another
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {message && (
        <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {message}
        </div>
      )}

      {result && (
        <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                OCR complete
              </p>

              <h3 className="mt-1 font-semibold text-emerald-950">
                Review receipt details
              </h3>
            </div>

            <span className="w-fit rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              {result.provider === "google_vision"
                ? "Google Vision"
                : "Tesseract"}
            </span>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label
                htmlFor="receipt-merchant"
                className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500"
              >
                Merchant
              </label>

              <input
                id="receipt-merchant"
                value={merchant}
                onChange={(event) =>
                  setMerchant(event.target.value)
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="Merchant name"
              />
            </div>

            <div>
              <label
                htmlFor="receipt-category"
                className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500"
              >
                Category
              </label>

              <input
                id="receipt-category"
                value={category}
                onChange={(event) =>
                  setCategory(event.target.value)
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="Food, transport, shopping..."
              />
            </div>

            <div>
              <label
                htmlFor="receipt-amount"
                className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500"
              >
                Total amount
              </label>

              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
                  {currencySymbol}
                </span>

                <input
                  id="receipt-amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={amount}
                  onChange={(event) =>
                    setAmount(event.target.value)
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm font-semibold text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="receipt-currency"
                className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500"
              >
                Currency
              </label>

              <select
                id="receipt-currency"
                value={currency}
                onChange={(event) =>
                  setCurrency(event.target.value)
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                {currencies.map((item) => (
                  <option
                    key={item.code}
                    value={item.code}
                  >
                    {item.code}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label
                htmlFor="receipt-date"
                className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500"
              >
                Expense date
              </label>

              <input
                id="receipt-date"
                type="date"
                value={occurredAt}
                onChange={(event) =>
                  setOccurredAt(event.target.value)
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          <div className="mt-5 rounded-xl bg-white/80 p-4">
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Extracted text
              </p>

              <span className="text-xs text-slate-400">
                Editable
              </span>
            </div>

            <textarea
              value={result.rawText}
              onChange={(event) => {
                setResult((current) =>
                  current
                    ? {
                        ...current,
                        rawText: event.target.value,
                      }
                    : current
                );
              }}
              rows={10}
              className="w-full resize-y rounded-xl border border-slate-200 bg-white p-3 text-sm leading-6 text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-medium text-amber-950">
              Review before saving
            </p>

            <p className="mt-1 text-xs leading-5 text-amber-800">
              Tesseract can misread receipts. Verify the merchant,
              amount, currency, category, and date before saving.
            </p>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={resetScanner}
              disabled={saving}
              className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Scan another
            </button>

            <button
              type="button"
              onClick={saveExpense}
              disabled={saving}
              className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-wait disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save expense"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}