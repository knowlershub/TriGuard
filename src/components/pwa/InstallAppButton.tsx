"use client";

import { useEffect, useState } from "react";

type BeforeInstallPromptEvent =
  Event & {
    prompt: () => Promise<void>;
    userChoice: Promise<{
      outcome: "accepted" | "dismissed";
    }>;
  };

function isIosDevice() {
  return /iphone|ipad|ipod/i.test(
    window.navigator.userAgent
  );
}

function isStandaloneMode() {
  const navigatorWithStandalone =
    window.navigator as Navigator & {
      standalone?: boolean;
    };

  return (
    window.matchMedia(
      "(display-mode: standalone)"
    ).matches ||
    navigatorWithStandalone.standalone === true
  );
}

export default function InstallAppButton() {
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  const [installed, setInstalled] =
    useState(false);

  const [showHelp, setShowHelp] =
    useState(false);

  const [isIos, setIsIos] =
    useState(false);

  const [browserName, setBrowserName] =
    useState("your browser");

  useEffect(() => {
    setIsIos(isIosDevice());
    setInstalled(isStandaloneMode());

    const userAgent =
      window.navigator.userAgent;

    if (/edg/i.test(userAgent)) {
      setBrowserName("Edge");
    } else if (/chrome|chromium/i.test(userAgent)) {
      setBrowserName("Chrome");
    } else if (/firefox/i.test(userAgent)) {
      setBrowserName("Firefox");
    } else if (/safari/i.test(userAgent)) {
      setBrowserName("Safari");
    }

    function handleBeforeInstallPrompt(
      event: Event
    ) {
      event.preventDefault();

      setInstallPrompt(
        event as BeforeInstallPromptEvent
      );
    }

    function handleAppInstalled() {
      setInstalled(true);
      setInstallPrompt(null);
      setShowHelp(false);
    }

    window.addEventListener(
      "beforeinstallprompt",
      handleBeforeInstallPrompt
    );

    window.addEventListener(
      "appinstalled",
      handleAppInstalled
    );

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );

      window.removeEventListener(
        "appinstalled",
        handleAppInstalled
      );
    };
  }, []);

  async function handleInstall() {
    if (installed) {
      return;
    }

    if (installPrompt) {
      try {
        await installPrompt.prompt();

        const choice =
          await installPrompt.userChoice;

        if (choice.outcome === "accepted") {
          setInstalled(true);
        }
      } catch (error) {
        console.error(
          "[pwa] Install prompt error:",
          error
        );
      } finally {
        setInstallPrompt(null);
      }

      return;
    }

    setShowHelp(true);
  }

  if (installed) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        onClick={handleInstall}
        className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
      >
        Install Minderra
      </button>

      {showHelp && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="install-title"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2
                  id="install-title"
                  className="text-lg font-bold text-slate-950"
                >
                  Install Minderra
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Add Minderra to your phone or computer
                  for faster access.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowHelp(false)
                }
                className="rounded-lg px-2 py-1 text-lg text-slate-500 hover:bg-slate-100"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {isIos ? (
              <div className="mt-5 space-y-4 text-sm text-slate-700">
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="font-semibold text-slate-900">
                    1. Open the Share menu
                  </p>

                  <p className="mt-1">
                    Tap the Share button in Safari.
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="font-semibold text-slate-900">
                    2. Choose Add to Home Screen
                  </p>

                  <p className="mt-1">
                    Scroll through the Share options and
                    select &quot;Add to Home Screen.&quot;
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="font-semibold text-slate-900">
                    3. Tap Add
                  </p>

                  <p className="mt-1">
                    Minderra will appear on your home
                    screen like an app.
                  </p>
                </div>
              </div>
            ) : (
              <div className="mt-5 space-y-4 text-sm text-slate-700">
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="font-semibold text-slate-900">
                    Your browser hasn't provided the
                    automatic install prompt yet.
                  </p>

                  <p className="mt-1">
                    Open the {browserName} browser menu
                    and look for &quot;Install Minderra&quot;,
                    &quot;Install app&quot;, or
                    &quot;Add to Home screen.&quot;
                  </p>
                </div>

                <div className="rounded-xl bg-blue-50 p-4">
                  <p className="font-semibold text-blue-950">
                    Tip
                  </p>

                  <p className="mt-1 text-blue-800">
                    Make sure you are visiting Minderra
                    over HTTPS:
                  </p>

                  <p className="mt-2 break-all font-medium text-blue-900">
                    https://triguard-mgoo.onrender.com
                  </p>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() =>
                setShowHelp(false)
              }
              className="mt-6 w-full rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
