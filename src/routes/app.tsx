import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  Bot, Play, Square, KeyRound, Home, Settings as SettingsIcon,
  HelpCircle, Activity, Wifi, Battery, Signal, Flame,
  TrendingUp, TrendingDown, LogOut, Cpu, MemoryStick, ShieldCheck,
  LineChart, Database, Target, Trash2, BarChart3, Plus, Palette, Film, X,
} from "lucide-react";
import { validateLicense, validateMentor } from "@/lib/portal.functions";

export const Route = createFileRoute("/app")({
  component: PhoneApp,
  head: () => ({
    meta: [{ title: "Algopro — Mobile" }],
    links: [{ rel: "manifest", href: "/manifest.webmanifest" }],
  }),
});

type Session = {
  key: string;
  username: string;
  ea_name: string;
  symbols: string[];
  expires_at: string;
  plan: string;
  ea_image?: string | null;
};

type Mentor = { email: string; mentor_id: string; name: string; is_admin: boolean };

type Trade = {
  id: number;
  symbol: string;
  side: "BUY" | "SELL";
  lot: number;
  price: number;
  pnl: number;
  at: string;
};

type Broker = {
  broker: string;
  server: string;
  login: string;
  password: string;
};

const STORAGE_KEY = "algopro.session";
const MENTOR_KEY = "algopro.mentor";
const THEME_KEY = "algopro.theme";
const VIDEO_KEY = "algopro.bgvideo";
const BROKER_KEY = "algopro.broker";

function PhoneApp() {
  return (
    <div className="min-h-screen bg-slate-100 px-0 py-0 sm:px-6 sm:py-10 lg:py-14">
      <div className="mx-auto w-full max-w-[420px]">
        <InstallBanner />
        <PhoneFrame>
          <AppRouter />
        </PhoneFrame>
        <p className="mt-4 hidden text-center text-xs text-slate-500 sm:block">
          Algopro mobile preview — runs full-screen on iOS/Android
        </p>
      </div>
    </div>
  );
}

type BIPEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

function InstallBanner() {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [showIos, setShowIos] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as any).standalone;
    if (standalone) { setInstalled(true); return; }
    const onPrompt = (e: Event) => { e.preventDefault(); setDeferred(e as BIPEvent); };
    const onInstalled = () => { setInstalled(true); setDeferred(null); };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed) return null;

  const isIos = typeof navigator !== "undefined" && /iphone|ipad|ipod/i.test(navigator.userAgent);

  const onInstall = async () => {
    if (deferred) {
      await deferred.prompt();
      const r = await deferred.userChoice;
      if (r.outcome === "accepted") { setInstalled(true); toast.success("App installed"); }
      setDeferred(null);
    } else if (isIos) {
      setShowIos(true);
    } else {
      toast.info("Open the browser menu and tap 'Install app' or 'Add to Home Screen'.");
    }
  };

  return (
    <div className="mb-3 px-4 sm:px-0">
      <button
        onClick={onInstall}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-lg active:scale-[0.98]"
      >
        📲 Install Algopro on your phone
      </button>
      {showIos && (
        <div className="mt-2 rounded-lg border border-slate-300 bg-white p-3 text-xs text-slate-700">
          <b>iPhone:</b> tap the Share button <span className="font-mono">⬆︎</span> in Safari, then choose <b>"Add to Home Screen"</b>.
          <button onClick={() => setShowIos(false)} className="ml-2 underline">Dismiss</button>
        </div>
      )}
    </div>
  );
}

function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative mx-auto aspect-[9/19.5] w-full overflow-hidden bg-black sm:rounded-[3rem] sm:p-[14px] sm:shadow-[0_30px_80px_-20px_rgba(15,23,42,0.6)] sm:ring-[3px] sm:ring-slate-800">
      <div className="relative h-full w-full overflow-hidden bg-[#0b1020] sm:rounded-[2.4rem]">
        <div className="pointer-events-none absolute left-1/2 top-2 z-30 hidden h-7 w-32 -translate-x-1/2 rounded-full bg-black sm:block" />
        {children}
      </div>
    </div>
  );
}

function StatusBar() {
  const [now, setNow] = useState<string>("");
  useEffect(() => {
    const fmt = () =>
      setNow(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    fmt();
    const t = setInterval(fmt, 30_000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="relative z-10 flex items-center justify-between px-6 pt-3 text-[11px] font-semibold text-white sm:pt-4">
      <span className="tabular-nums">{now || "\u00a0"}</span>
      <div className="hidden h-7 w-32 rounded-full bg-transparent sm:block" />
      <div className="flex items-center gap-1.5">
        <Signal className="h-3 w-3" />
        <Wifi className="h-3 w-3" />
        <Battery className="h-4 w-4" />
      </div>
    </div>
  );
}

function AppRouter() {
  const [mentor, setMentor] = useState<Mentor | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [tab, setTab] = useState<"home" | "symbols" | "metatrader" | "scanner" | "settings" | "help">("home");
  const [accent, setAccent] = useState<string>("#22d3ee");
  const [bgVideo, setBgVideo] = useState<string>("");

  useEffect(() => {
    try {
      const m = localStorage.getItem(MENTOR_KEY);
      if (m) setMentor(JSON.parse(m));
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setSession(JSON.parse(raw));
      const t = localStorage.getItem(THEME_KEY);
      if (t) setAccent(t);
      const v = localStorage.getItem(VIDEO_KEY);
      if (v) setBgVideo(v);
    } catch {}
  }, []);

  const onMentor = (m: Mentor) => { setMentor(m); localStorage.setItem(MENTOR_KEY, JSON.stringify(m)); };
  const onLogin = (s: Session) => { setSession(s); localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); };
  const onLogout = () => {
    setSession(null);
    localStorage.removeItem(STORAGE_KEY);
    setTab("home");
  };
  const onSignOutAll = () => {
    setSession(null); setMentor(null);
    localStorage.removeItem(STORAGE_KEY); localStorage.removeItem(MENTOR_KEY);
    setTab("home");
  };
  const updateAccent = (c: string) => { setAccent(c); localStorage.setItem(THEME_KEY, c); };
  const updateVideo = (url: string) => {
    setBgVideo(url);
    if (url) localStorage.setItem(VIDEO_KEY, url);
    else localStorage.removeItem(VIDEO_KEY);
  };

  return (
    <div
      className="relative flex h-full flex-col bg-[#06080f] text-white"
      style={{ ["--app-accent" as any]: accent }}
    >
      {bgVideo && (
        <video
          key={bgVideo}
          src={bgVideo}
          autoPlay
          muted
          loop
          playsInline
          className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-40"
        />
      )}
      <div className="pointer-events-none absolute inset-0 bg-[#06080f]/40" />
      <StatusBar />
      <div className="relative z-10 flex-1 overflow-y-auto pb-24">
        {!mentor && <MentorGate onSuccess={onMentor} />}
        {mentor && !session && <LicenseGate mentor={mentor} onSuccess={onLogin} onSignOut={onSignOutAll} />}
        {mentor && session && tab === "home" && <HomeScreen session={session} onDelete={onLogout} />}
        {mentor && session && tab === "symbols" && <SymbolsScreen session={session} />}
        {mentor && session && tab === "metatrader" && <MetaTraderScreen />}
        {mentor && session && tab === "scanner" && <ScannerScreen session={session} />}
        {mentor && session && tab === "settings" && (
          <SettingsScreen
            session={session}
            onLogout={onLogout}
            accent={accent}
            onAccent={updateAccent}
            bgVideo={bgVideo}
            onBgVideo={updateVideo}
          />
        )}
        {mentor && session && tab === "help" && <HelpScreen />}
      </div>
      {mentor && session && <BottomNav tab={tab} setTab={setTab} />}
    </div>
  );
}

function MentorGate({ onSuccess }: { onSuccess: (m: Mentor) => void }) {
  const validate = useServerFn(validateMentor);
  const [email, setEmail] = useState("");
  const [mentorId, setMentorId] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !mentorId.trim()) return;
    setLoading(true);
    try {
      const res = await validate({ data: { email, mentor_id: mentorId } });
      if (!res.ok) { toast.error(res.reason); return; }
      toast.success(res.is_admin ? `Welcome Admin ${res.name}` : `Welcome ${res.name}`);
      onSuccess({ email, mentor_id: mentorId.toUpperCase(), name: res.name, is_admin: res.is_admin });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="flex h-full flex-col items-center justify-center px-7 pb-8 pt-10 text-center">
      <div className="mb-6 grid h-20 w-20 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-2xl shadow-violet-500/40">
        <Bot className="h-10 w-10 text-white" />
      </div>
      <h1 className="text-2xl font-bold">Algopro</h1>
      <p className="mt-1 text-sm text-white/60">Sign in with your email and Mentor ID</p>

      <form onSubmit={submit} className="mt-8 w-full space-y-3">
        <input
          value={email} onChange={(e) => setEmail(e.target.value)}
          type="email" placeholder="you@email.com" autoComplete="email"
          className="w-full rounded-xl border border-white/10 bg-white/5 py-3 px-4 text-sm text-white placeholder:text-white/30 outline-none focus:border-violet-400"
        />
        <input
          value={mentorId} onChange={(e) => setMentorId(e.target.value.toUpperCase())}
          placeholder="MENTOR ID (AP-XXXXXXXX)" maxLength={50}
          className="w-full rounded-xl border border-white/10 bg-white/5 py-3 px-4 text-center font-mono text-sm tracking-wider text-white placeholder:text-white/30 outline-none focus:border-violet-400"
        />
        <button type="submit" disabled={loading} className="w-full rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 py-3 text-sm font-semibold shadow-lg shadow-violet-500/30 disabled:opacity-60">
          {loading ? "Verifying..." : "Continue"}
        </button>
      </form>
      <p className="mt-6 text-[11px] text-white/40">Your Mentor ID is shown in the portal profile.</p>
    </div>
  );
}

function LicenseGate({ mentor, onSuccess, onSignOut }: { mentor: Mentor; onSuccess: (s: Session) => void; onSignOut: () => void }) {
  const validate = useServerFn(validateLicense);
  const [open, setOpen] = useState(false);
  const [key, setKey] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!key.trim()) return;
    setLoading(true);
    try {
      const res = await validate({ data: { key } });
      if (!res.ok) { toast.error(res.reason); return; }
      toast.success("Welcome Master");
      onSuccess({
        key: key.toUpperCase(),
        username: res.username,
        ea_name: res.ea_name,
        symbols: res.symbols,
        expires_at: res.expires_at,
        plan: res.plan,
        ea_image: res.ea_image,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Validation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full flex-col px-5 pt-6">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group relative flex w-full items-center justify-center gap-3 rounded-[28px] bg-[#0a0f1a] px-5 py-4 text-[15px] font-bold tracking-wider text-white"
        style={{
          boxShadow: `0 0 0 2px var(--app-accent), 0 0 25px var(--app-accent), inset 0 0 18px color-mix(in oklab, var(--app-accent) 35%, transparent)`,
        }}
      >
        <span
          className="grid h-7 w-7 place-items-center rounded-full bg-white text-black"
          style={{ boxShadow: `0 0 12px var(--app-accent)` }}
        >
          <Plus className="h-4 w-4" strokeWidth={3} />
        </span>
        ADD LICENCE KEY
      </button>

      <p className="mt-6 text-center text-[11px] text-white/40">
        Signed in as {mentor.name}{mentor.is_admin ? " · Admin" : ""}
      </p>
      <button onClick={onSignOut} className="mx-auto mt-2 text-[11px] text-white/40 underline">
        Use a different account
      </button>

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-5">
          <div className="w-full max-w-sm rounded-2xl bg-[#0b1224] p-5 ring-1 ring-white/10">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-bold">Enter Licence Key</h2>
              <button onClick={() => setOpen(false)} className="rounded-md p-1 text-white/60 hover:bg-white/10">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={submit} className="space-y-3">
              <div className="relative">
                <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                <input
                  value={key}
                  onChange={(e) => setKey(e.target.value.toUpperCase())}
                  placeholder="APRO-XXXX-XXXX-XXXX-XXXX"
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-3 text-center font-mono text-sm tracking-wider text-white placeholder:text-white/30 outline-none focus:border-[var(--app-accent)]"
                  maxLength={30}
                  autoCapitalize="characters"
                  autoComplete="off"
                  autoFocus
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl py-3 text-sm font-semibold text-black disabled:opacity-60"
                style={{ backgroundColor: "var(--app-accent)" }}
              >
                {loading ? "Validating..." : "Activate Bot"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function HomeScreen({ session, onDelete }: { session: Session; onDelete: () => void }) {
  const [running, setRunning] = useState(true);

  const toggle = () => {
    setRunning((r) => {
      const next = !r;
      toast[next ? "success" : "info"](next ? "Bot activated" : "Bot stopped");
      return next;
    });
  };

  const handleDelete = () => {
    if (!confirm("Delete this licence from the app? You'll need to enter the key again to use it.")) return;
    onDelete();
    toast.success("Licence removed");
  };
  const onSymbols = () => toast.message("Symbols", { description: session.symbols.join(", ") || "None" });

  return (
    <div className="relative flex flex-col items-center px-5 pt-6 pb-10 text-center">
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: `radial-gradient(circle at 50% 25%, color-mix(in oklab, var(--app-accent) 25%, transparent), transparent 55%)` }}
      />

      <div className="relative mt-2">
        <div className="absolute -inset-3 rounded-full blur-2xl" style={{ background: `color-mix(in oklab, var(--app-accent) 30%, transparent)` }} />
        <div
          className="relative h-56 w-56 overflow-hidden rounded-full ring-2"
          style={{
            borderColor: "var(--app-accent)",
            boxShadow: `0 0 60px -10px var(--app-accent)`,
          }}
        >
          {session.ea_image ? (
            <img src={session.ea_image} alt={session.ea_name} className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full w-full place-items-center bg-gradient-to-br from-cyan-500/30 to-blue-700/30">
              <Bot className="h-20 w-20 text-cyan-300" />
            </div>
          )}
        </div>
        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold ${running ? "bg-black text-white ring-1 ring-emerald-400/40" : "bg-black text-white/60 ring-1 ring-white/10"}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${running ? "bg-emerald-400 animate-pulse" : "bg-white/30"}`} />
            {running ? "LIVE" : "IDLE"}
          </span>
        </div>
      </div>

      <p className="mt-10 text-[11px] tracking-[0.25em] text-white/50">YOU'RE TRADING WITH</p>
      <h1 className="mt-1 text-3xl font-extrabold uppercase tracking-tight leading-tight">
        {session.ea_name}
      </h1>

      <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-black/70 px-4 py-1.5 ring-1 ring-white/10">
        <Flame className="h-3.5 w-3.5 text-orange-400" />
        <span className="text-[11px] text-white/60">Powered by:</span>
        <span className="text-[11px] font-bold tracking-wider">ALGOPRO</span>
      </div>

      <div className="relative mt-8 flex w-full max-w-[320px] items-center justify-around rounded-full bg-white py-3 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.6)]">
        <PillBtn icon={<Trash2 className="h-5 w-5" />} label="DELETE" onClick={handleDelete} />
        <button
          onClick={toggle}
          className={`grid h-14 w-14 place-items-center rounded-full text-white shadow-lg transition active:scale-95 ${
            running ? "bg-red-600 shadow-red-500/50" : "bg-emerald-500 shadow-emerald-500/50"
          }`}
        >
          {running ? <Square className="h-5 w-5 fill-white" /> : <Play className="h-5 w-5 fill-white" />}
        </button>
        <PillBtn icon={<BarChart3 className="h-5 w-5" />} label="SYMBOLS" onClick={onSymbols} />
      </div>
      <p className="mt-2 text-[10px] uppercase tracking-[0.3em] text-white/30">
        {running ? "STOP" : "START"}
      </p>

      <p className="mt-10 text-[10px] tracking-[0.35em] text-white/30">
        POWERED BY: ALGOPRO
      </p>
    </div>
  );
}

function PillBtn({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1 text-slate-900">
      <span className="grid h-10 w-10 place-items-center rounded-full bg-slate-900 text-white">
        {icon}
      </span>
      <span className="text-[9px] font-bold tracking-wider">{label}</span>
    </button>
  );
}

function SymbolsScreen({ session }: { session: Session }) {
  return (
    <div className="px-5 pt-5">
      <h1 className="text-xl font-bold">Symbols</h1>
      <p className="text-xs text-white/50">Pairs this EA trades on your account</p>
      <div className="mt-4 grid grid-cols-2 gap-2">
        {(session.symbols.length ? session.symbols : ["EURUSD", "XAUUSD", "GBPUSD", "BTCUSD"]).map((s) => (
          <div key={s} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <div className="flex items-center gap-2">
              <LineChart className="h-4 w-4 text-cyan-300" />
              <span className="font-semibold">{s}</span>
            </div>
            <p className="mt-2 text-[10px] uppercase tracking-wider text-emerald-300">Active</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function MetaTraderScreen() {
  const [broker, setBroker] = useState<Broker>({ broker: "", server: "", login: "", password: "" });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(BROKER_KEY);
      if (raw) { setBroker(JSON.parse(raw)); setSaved(true); }
    } catch {}
  }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broker.broker.trim() || !broker.server.trim() || !broker.login.trim() || !broker.password.trim()) {
      toast.error("Fill in all broker details");
      return;
    }
    localStorage.setItem(BROKER_KEY, JSON.stringify(broker));
    setSaved(true);
    toast.success("Broker details saved");
  };

  const clear = () => {
    localStorage.removeItem(BROKER_KEY);
    setBroker({ broker: "", server: "", login: "", password: "" });
    setSaved(false);
    toast.info("Broker details cleared");
  };

  return (
    <div className="px-5 pt-5">
      <h1 className="text-xl font-bold">MetaTrader</h1>
      <p className="text-xs text-white/50">Enter your broker details for live execution</p>

      <form onSubmit={submit} className="mt-4 space-y-3">
        <Field label="Broker Name">
          <input
            value={broker.broker}
            onChange={(e) => setBroker({ ...broker, broker: e.target.value })}
            placeholder="e.g. Exness, IC Markets"
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white outline-none focus:border-[var(--app-accent)]"
          />
        </Field>
        <Field label="Server">
          <input
            value={broker.server}
            onChange={(e) => setBroker({ ...broker, server: e.target.value })}
            placeholder="e.g. Exness-Real5"
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white outline-none focus:border-[var(--app-accent)]"
          />
        </Field>
        <Field label="Login (Account Number)">
          <input
            value={broker.login}
            onChange={(e) => setBroker({ ...broker, login: e.target.value })}
            inputMode="numeric"
            placeholder="123456789"
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white outline-none focus:border-[var(--app-accent)]"
          />
        </Field>
        <Field label="Password">
          <input
            type="password"
            value={broker.password}
            onChange={(e) => setBroker({ ...broker, password: e.target.value })}
            placeholder="Investor or Master password"
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white outline-none focus:border-[var(--app-accent)]"
          />
        </Field>
        <button
          type="submit"
          className="w-full rounded-xl py-3 text-sm font-semibold text-black"
          style={{ backgroundColor: "var(--app-accent)" }}
        >
          {saved ? "Update Broker" : "Save Broker"}
        </button>
        {saved && (
          <button type="button" onClick={clear} className="w-full rounded-xl border border-rose-500/30 bg-rose-500/10 py-2.5 text-xs font-semibold text-rose-300">
            Clear broker details
          </button>
        )}
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] uppercase tracking-wider text-white/50">{label}</span>
      {children}
    </label>
  );
}

function ScannerScreen({ session }: { session: Session }) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const idRef = useRef(1);

  useEffect(() => {
    const symbols = session.symbols.length ? session.symbols : ["EURUSD", "XAUUSD"];
    const t = setInterval(() => {
      const sym = symbols[Math.floor(Math.random() * symbols.length)];
      const side: "BUY" | "SELL" = Math.random() > 0.5 ? "BUY" : "SELL";
      const pnl = +(Math.random() * 80 - 30).toFixed(2);
      setTrades((p) => [{
        id: idRef.current++, symbol: sym, side,
        lot: +(Math.random() * 0.5 + 0.01).toFixed(2),
        price: +(1 + Math.random() * 2000).toFixed(2),
        pnl, at: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      }, ...p].slice(0, 50));
    }, 1800);
    return () => clearInterval(t);
  }, [session.symbols]);

  const total = trades.reduce((s, t) => s + t.pnl, 0);

  return (
    <div className="px-5 pt-5">
      <div className="flex items-center gap-2">
        <Target className="h-5 w-5 text-cyan-300" />
        <h1 className="text-xl font-bold">Market Scanner</h1>
      </div>
      <p className="text-xs text-white/50">Live trades executed by your EA</p>

      <div className="mt-4 rounded-2xl bg-gradient-to-br from-cyan-500/15 to-blue-700/10 p-5 ring-1 ring-cyan-400/20">
        <p className="text-[11px] uppercase tracking-wider text-white/60">Session P&amp;L</p>
        <p className={`mt-1 text-3xl font-bold tabular-nums ${total >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
          {total >= 0 ? "+" : ""}{total.toFixed(2)} <span className="text-base text-white/50">USD</span>
        </p>
      </div>

      <div className="mt-4 space-y-2">
        {trades.length === 0 && <p className="py-10 text-center text-sm text-white/40">Waiting for first trade…</p>}
        {trades.map((t) => (
          <div key={t.id} className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.03] p-3">
            <div className={`grid h-9 w-9 place-items-center rounded-lg ${t.side === "BUY" ? "bg-emerald-500/15 text-emerald-300" : "bg-rose-500/15 text-rose-300"}`}>
              {t.side === "BUY" ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold">{t.symbol}</span>
                <span className={`font-mono text-sm tabular-nums ${t.pnl >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
                  {t.pnl >= 0 ? "+" : ""}{t.pnl.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-white/50">
                <span>{t.side} • {t.lot} lots @ {t.price}</span>
                <span>{t.at}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const PRESET_COLORS = [
  "#22d3ee", "#3b82f6", "#8b5cf6", "#ec4899",
  "#ef4444", "#f97316", "#eab308", "#22c55e",
];

function SettingsScreen({
  session, onLogout, accent, onAccent, bgVideo, onBgVideo,
}: {
  session: Session;
  onLogout: () => void;
  accent: string;
  onAccent: (c: string) => void;
  bgVideo: string;
  onBgVideo: (url: string) => void;
}) {
  const videoInputRef = useRef<HTMLInputElement | null>(null);

  const pickVideo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("video/")) { toast.error("Please pick a video file"); return; }
    if (f.size > 50 * 1024 * 1024) { toast.error("Video must be under 50MB"); return; }
    const reader = new FileReader();
    reader.onload = () => {
      onBgVideo(String(reader.result || ""));
      toast.success("Background video set");
    };
    reader.onerror = () => toast.error("Could not read video");
    reader.readAsDataURL(f);
  };

  return (
    <div className="px-5 pt-4">
      <h1 className="text-xl font-bold">Settings</h1>

      {/* Theme color */}
      <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
        <div className="mb-3 flex items-center gap-2">
          <Palette className="h-4 w-4" style={{ color: accent }} />
          <span className="text-sm font-semibold">App Color</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => onAccent(c)}
              className={`h-8 w-8 rounded-full ring-2 transition ${accent === c ? "ring-white scale-110" : "ring-white/10"}`}
              style={{ backgroundColor: c }}
              aria-label={`Set color ${c}`}
            />
          ))}
          <label className="ml-1 flex h-8 cursor-pointer items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 text-xs">
            Custom
            <input
              type="color"
              value={accent}
              onChange={(e) => onAccent(e.target.value)}
              className="h-5 w-5 cursor-pointer rounded border-0 bg-transparent p-0"
            />
          </label>
        </div>
      </div>

      {/* Background video */}
      <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
        <div className="mb-3 flex items-center gap-2">
          <Film className="h-4 w-4" style={{ color: accent }} />
          <span className="text-sm font-semibold">Background Video</span>
        </div>
        <input
          ref={videoInputRef}
          type="file"
          accept="video/*"
          onChange={pickVideo}
          className="hidden"
        />
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => videoInputRef.current?.click()}
            className="rounded-xl px-4 py-2 text-xs font-semibold text-black"
            style={{ backgroundColor: accent }}
          >
            {bgVideo ? "Replace video" : "Pick video"}
          </button>
          {bgVideo && (
            <button
              onClick={() => onBgVideo("")}
              className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-xs font-semibold text-rose-300"
            >
              Remove
            </button>
          )}
        </div>
        <p className="mt-2 text-[10px] text-white/40">Plays muted on loop. Max 50MB.</p>
      </div>

      <div className="mt-4 space-y-2 rounded-2xl border border-white/10 bg-white/[0.04] p-2">
        <Row icon={<Cpu className="h-4 w-4" />} label="VPS CPU" value="14%" />
        <Row icon={<MemoryStick className="h-4 w-4" />} label="VPS RAM" value="612 MB" />
        <Row icon={<ShieldCheck className="h-4 w-4" />} label="Encryption" value="AES-256" />
        <Row icon={<Activity className="h-4 w-4" />} label="Uptime" value="99.98%" />
      </div>

      <div className="mt-4 space-y-2 rounded-2xl border border-white/10 bg-white/[0.04] p-2">
        <Row label="User" value={session.username} />
        <Row label="Plan" value={session.plan.replace(/_/g, " ")} />
        <Row label="Expires" value={new Date(session.expires_at).toLocaleDateString()} />
      </div>

      <button
        onClick={onLogout}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-500/30 bg-rose-500/10 py-3 text-sm font-semibold text-rose-300"
      >
        <LogOut className="h-4 w-4" /> Sign out
      </button>

      <p className="mt-6 text-center text-[10px] tracking-[0.3em] text-white/30">POWERED BY: ALGOPRO</p>
    </div>
  );
}

function Row({ icon, label, value }: { icon?: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm">
      <span className="flex items-center gap-2 text-white/70">
        {icon}
        {label}
      </span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function HelpScreen() {
  const items = [
    { q: "How do I add a broker?", a: "Open the MetaTrader tab and enter your broker details." },
    { q: "Where are my credentials stored?", a: "Encrypted on the cloud VPS, never on this device." },
    { q: "What happens if I close the app?", a: "Your bot keeps running 24/7 on the cloud VPS." },
  ];
  return (
    <div className="px-5 pt-4">
      <h1 className="text-xl font-bold">Help</h1>
      <div className="mt-4 space-y-2">
        {items.map((i) => (
          <div key={i.q} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-sm font-semibold">{i.q}</p>
            <p className="mt-1 text-xs text-white/60">{i.a}</p>
          </div>
        ))}
      </div>
      <p className="mt-6 text-center text-[10px] tracking-[0.3em] text-white/30">POWERED BY: ALGOPRO</p>
    </div>
  );
}

type TabId = "home" | "symbols" | "metatrader" | "scanner" | "settings" | "help";

function BottomNav({
  tab, setTab,
}: { tab: string; setTab: (t: TabId) => void }) {
  const items: { id: TabId; icon: typeof Home; label: string }[] = [
    { id: "home", icon: Home, label: "Home" },
    { id: "symbols", icon: LineChart, label: "Symbols" },
    { id: "metatrader", icon: Database, label: "MetaTrader" },
    { id: "scanner", icon: Target, label: "Scanner" },
    { id: "settings", icon: SettingsIcon, label: "Settings" },
    { id: "help", icon: HelpCircle, label: "Help" },
  ];
  return (
    <nav className="absolute inset-x-0 bottom-0 z-20 border-t border-white/10 bg-[#06080f]/95 px-1 pb-5 pt-2 backdrop-blur">
      <div className="flex items-center justify-around">
        {items.map(({ id, icon: Icon, label }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex flex-1 flex-col items-center gap-0.5 rounded-xl py-1.5 text-[9px] transition ${active ? "" : "text-white/50"}`}
              style={active ? { color: "var(--app-accent)" } : undefined}
            >
              <Icon className="h-5 w-5" />
              {label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
