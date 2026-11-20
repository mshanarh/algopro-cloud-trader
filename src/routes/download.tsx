import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Smartphone, Apple, Share, Plus, Download } from "lucide-react";

export const Route = createFileRoute("/download")({
  component: DownloadPage,
  head: () => ({
    meta: [
      { title: "Download EA Vault — Install on iPhone or Android" },
      { name: "description", content: "Install the EA Vault mobile app on your iPhone or Android phone in seconds." },
    ],
    links: [{ rel: "manifest", href: "/manifest.webmanifest" }],
  }),
});

type BIPEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function DownloadPage() {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showIos, setShowIos] = useState(false);

  useEffect(() => {
    setIsIos(/iphone|ipad|ipod/i.test(navigator.userAgent));
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true;
    if (standalone) setInstalled(true);

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
      toast.success("EA Vault installed");
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const onInstall = async () => {
    if (installed) {
      window.location.href = "/app";
      return;
    }
    if (deferred) {
      await deferred.prompt();
      const r = await deferred.userChoice;
      if (r.outcome === "accepted") setInstalled(true);
      setDeferred(null);
      return;
    }
    if (isIos) {
      setShowIos(true);
      return;
    }
    toast.info("Open your browser menu and tap 'Install app' or 'Add to Home Screen'.");
  };

  return (
    <main className="min-h-screen bg-[#0b1020] text-white">
      <div className="mx-auto max-w-2xl px-5 py-10">
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-sm font-medium text-white hover:bg-white/20"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>

        <div className="text-center">
          <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-2xl shadow-violet-500/40">
            <Download className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Download EA Vault</h1>
          <p className="mt-3 text-white/70">
            Install the EA Vault mobile app on your phone and control your bots from anywhere.
          </p>

          <button
            onClick={onInstall}
            className="mt-7 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-8 py-4 text-base font-bold shadow-lg shadow-violet-500/30 active:scale-[0.98]"
          >
            <Download className="h-5 w-5" />
            {installed ? "Open App" : "Install App"}
          </button>
          <p className="mt-3 text-xs text-white/40">Free · Works offline · No store needed</p>
        </div>

        {showIos && (
          <div className="mt-6 rounded-xl border border-amber-400/40 bg-amber-400/10 p-4 text-sm">
            On iPhone, use Safari → tap <Share className="inline h-4 w-4" /> → choose{" "}
            <b>Add to Home Screen</b>.
            <button onClick={() => setShowIos(false)} className="ml-2 underline">
              Got it
            </button>
          </div>
        )}

        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="mb-4 flex items-center gap-3">
              <Smartphone className="h-6 w-6 text-emerald-400" />
              <h2 className="text-lg font-semibold">Android</h2>
            </div>
            <ol className="space-y-3 text-sm text-white/80">
              <li className="flex gap-3">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white/10 text-xs font-bold">1</span>
                Tap <b className="mx-1">Install App</b> above.
              </li>
              <li className="flex gap-3">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white/10 text-xs font-bold">2</span>
                Confirm <b className="mx-1">Install</b> in the Chrome prompt.
              </li>
              <li className="flex gap-3">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white/10 text-xs font-bold">3</span>
                Open <b className="mx-1">EA Vault</b> from your home screen.
              </li>
            </ol>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="mb-4 flex items-center gap-3">
              <Apple className="h-6 w-6 text-sky-300" />
              <h2 className="text-lg font-semibold">iPhone / iPad</h2>
            </div>
            <ol className="space-y-3 text-sm text-white/80">
              <li className="flex gap-3">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white/10 text-xs font-bold">1</span>
                Open this page in <b className="mx-1">Safari</b>.
              </li>
              <li className="flex gap-3">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white/10 text-xs font-bold">2</span>
                Tap the <Share className="mx-1 inline h-4 w-4" /> <b>Share</b> button.
              </li>
              <li className="flex gap-3">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white/10 text-xs font-bold">3</span>
                Choose <Plus className="mx-1 inline h-4 w-4" /> <b>Add to Home Screen</b>.
              </li>
            </ol>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link to="/app" className="text-sm text-white/60 underline hover:text-white">
            Or open the web app without installing →
          </Link>
        </div>
      </div>
    </main>
  );
}
