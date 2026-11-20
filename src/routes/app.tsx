import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef, useMemo } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  Bot, Play, Square, KeyRound, Home, Settings as SettingsIcon,
  HelpCircle, Wifi, Battery, Signal, Flame,
  TrendingUp, TrendingDown, LogOut, ShieldCheck,
  LineChart, Database, Target, Trash2, BarChart3, Plus, Palette, Film, X,
  Upload, Send, ScanLine, ArrowLeft, FileText, AlertTriangle, Camera as CameraIcon, Image as ImageIcon, Clock, ChevronDown, LayoutGrid, Check,
} from "lucide-react";

import { validateLicense, validateMentor, checkAppAccess, reactivateAppByEmail, getLicenseInfo } from "@/lib/portal.functions";
import { analyzeChart } from "@/lib/scanner.functions";
import { executeLiveTrades, linkBrokerAccount } from "@/lib/trade.functions";


export const Route = createFileRoute("/app")({
  component: PhoneApp,
  head: () => ({
    meta: [{ title: "EA Vault — Mobile" }],
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
const PAIRS_KEY = "algopro.pairs";
const STYLE_KEY = "algopro.style";
const EXEC_TRADES_KEY = "algopro.execTrades";
const DELETED_KEYS_KEY = "algopro.deletedKeys";
const ANIM_KEY = "algopro.anim";

type BrokerBrand = { name: string; domain: string; color: string; keys: string[] };
const BROKER_BRANDS: BrokerBrand[] = [
  { name: "Exness", domain: "exness.com", color: "#ffe600", keys: ["exness"] },
  { name: "IC Markets", domain: "icmarkets.com", color: "#e11d48", keys: ["icmarkets", "ic markets"] },
  { name: "XM", domain: "xm.com", color: "#ef4444", keys: ["xmglobal", "xm global", "xmtrading", "xm-"] },
  { name: "FBS", domain: "fbs.com", color: "#1d4ed8", keys: ["fbs"] },
  { name: "Deriv", domain: "deriv.com", color: "#ff444f", keys: ["deriv", "binary"] },
  { name: "HFM", domain: "hfm.com", color: "#f59e0b", keys: ["hfm", "hfmarkets", "hotforex"] },
  { name: "Pepperstone", domain: "pepperstone.com", color: "#0ea5e9", keys: ["pepperstone"] },
  { name: "OctaFX", domain: "octafx.com", color: "#22c55e", keys: ["octa"] },
  { name: "Tickmill", domain: "tickmill.com", color: "#3b82f6", keys: ["tickmill"] },
  { name: "AvaTrade", domain: "avatrade.com", color: "#f97316", keys: ["avatrade", "ava-", "ava "] },
  { name: "FXTM", domain: "forextime.com", color: "#06b6d4", keys: ["fxtm", "forextime"] },
  { name: "XTB", domain: "xtb.com", color: "#dc2626", keys: ["xtb"] },
  { name: "FxPro", domain: "fxpro.com", color: "#0f766e", keys: ["fxpro"] },
  { name: "Admirals", domain: "admiralmarkets.com", color: "#16a34a", keys: ["admiral"] },
  { name: "Vantage", domain: "vantagemarkets.com", color: "#8b5cf6", keys: ["vantage"] },
  { name: "Alpari", domain: "alpari.com", color: "#ef4444", keys: ["alpari"] },
  { name: "Weltrade", domain: "weltrade.com", color: "#22d3ee", keys: ["weltrade"] },
  { name: "JustMarkets", domain: "justmarkets.com", color: "#f43f5e", keys: ["just"] },
];

/** Detects the broker brand from anything the user typed (broker name or server). */
function brandFor(text: string): BrokerBrand | undefined {
  const n = text.trim().toLowerCase();
  if (!n) return undefined;
  return BROKER_BRANDS.find((b) => b.keys.some((k) => n.includes(k)) || n.includes(b.name.toLowerCase()));
}

function BrokerLogo({ name, size = 40 }: { name: string; size?: number }) {
  const brand = brandFor(name);
  const [failed, setFailed] = useState(false);
  const initials = name.trim().slice(0, 2).toUpperCase() || "?";
  if (brand?.domain && !failed) {
    return (
      <img
        src={`https://logo.clearbit.com/${brand.domain}`}
        alt={`${name} logo`}
        width={size}
        height={size}
        onError={() => setFailed(true)}
        className="rounded-xl bg-white/90 object-contain p-1"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className="flex items-center justify-center rounded-xl text-xs font-bold text-black"
      style={{ width: size, height: size, backgroundColor: brand?.color ?? "#94a3b8" }}
    >
      {initials}
    </div>
  );
}


type Pair = { symbol: string; lot: number; trades: number };
type HomeVariant = "v1" | "v2" | "v3" | "v4" | "v5" | "v6";
type NavVariant = "v1" | "v2" | "v3" | "v4" | "v5" | "v6" | "v7" | "v8";
type UIStyle = { home: HomeVariant; nav: NavVariant };
const DEFAULT_STYLE: UIStyle = { home: "v4", nav: "v1" };
const SCAN_LIMIT = 50;
const SCAN_COUNT_KEY = "algopro.scans";
const DEVICE_KEY = "ea.device";

function getDeletedKeys(): string[] {
  try { return JSON.parse(localStorage.getItem(DELETED_KEYS_KEY) || "[]") as string[]; } catch { return []; }
}
function addDeletedKey(k: string) {
  try {
    const next = Array.from(new Set([...getDeletedKeys(), k.toUpperCase()]));
    localStorage.setItem(DELETED_KEYS_KEY, JSON.stringify(next));
  } catch {}
}
function isDeletedKey(k: string) {
  return getDeletedKeys().includes(k.trim().toUpperCase());
}



function speak(text: string) {
  try {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-US"; u.rate = 0.95; u.pitch = 1;
    const voices = window.speechSynthesis.getVoices();
    const en = voices.find((v) => v.lang?.startsWith("en"));
    if (en) u.voice = en;
    window.speechSynthesis.speak(u);
  } catch {}
}

function getDeviceId() {
  try {
    let d = localStorage.getItem(DEVICE_KEY);
    if (!d) {
      d = (crypto.randomUUID?.() ?? String(Date.now()) + Math.random().toString(36).slice(2));
      localStorage.setItem(DEVICE_KEY, d);
    }
    return d;
  } catch { return "browser"; }
}

function PhoneApp() {
  return (
    <div className="min-h-screen bg-slate-100 px-0 py-0 sm:px-6 sm:py-10 lg:py-14">
      <div className="mx-auto w-full max-w-[420px]">
        <InstallBanner />
        <PhoneFrame>
          <AppRouter />
        </PhoneFrame>
        <p className="mt-4 hidden text-center text-xs text-slate-500 sm:block">
          EA Vault mobile preview — runs full-screen on iOS/Android
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
        📲 Install EA Vault on your phone
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

function AnimatedBackdrop() {
  const [on, setOn] = useState(true);
  useEffect(() => {
    const read = () => {
      try { setOn(localStorage.getItem(ANIM_KEY) !== "off"); } catch {}
    };
    read();
    window.addEventListener("ea:anim", read);
    return () => window.removeEventListener("ea:anim", read);
  }, []);
  if (!on) return null;
  return (

    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      <div
        className="absolute -left-24 -top-24 h-72 w-72 rounded-full blur-3xl opacity-30 animate-[ea-float_14s_ease-in-out_infinite]"
        style={{ background: "radial-gradient(circle, var(--app-accent, #22d3ee), transparent 65%)" }}
      />
      <div
        className="absolute -right-24 top-1/3 h-80 w-80 rounded-full blur-3xl opacity-25 animate-[ea-float_18s_ease-in-out_infinite_reverse]"
        style={{ background: "radial-gradient(circle, var(--app-accent, #22d3ee), transparent 65%)" }}
      />
      <div
        className="absolute -bottom-28 left-1/4 h-72 w-72 rounded-full blur-3xl opacity-20 animate-[ea-float_22s_ease-in-out_infinite]"
        style={{ background: "radial-gradient(circle, #7c3aed, transparent 65%)" }}
      />
      <div className="absolute inset-0 opacity-[0.06] animate-[ea-grid_26s_linear_infinite] [background-image:linear-gradient(rgba(255,255,255,.6)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.6)_1px,transparent_1px)] [background-size:38px_38px]" />
      <div className="absolute inset-x-0 top-0 h-40 animate-[ea-sweep_9s_ease-in-out_infinite] bg-[linear-gradient(180deg,rgba(255,255,255,.10),transparent)]" />
    </div>
  );
}

function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative mx-auto aspect-[9/19.5] w-full overflow-hidden bg-black sm:rounded-[3rem] sm:p-[14px] sm:shadow-[0_30px_80px_-20px_rgba(15,23,42,0.6)] sm:ring-[3px] sm:ring-slate-800">
      <div className="relative h-full w-full overflow-hidden sm:rounded-[2.4rem]" style={{ backgroundColor: "var(--app-bg)" }}>
        <AnimatedBackdrop />
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

type AccessState = "idle" | "checking" | "ok" | "unpaid" | "other_device";

function AppRouter() {
  const [mentor, setMentor] = useState<Mentor | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [tab, setTab] = useState<TabId>("home");
  const [accent, setAccent] = useState<string>("#22d3ee");
  const [bgVideo, setBgVideo] = useState<string>("");
  const [style, setStyle] = useState<UIStyle>(DEFAULT_STYLE);
  const [pairs, setPairs] = useState<Pair[]>([]);
  const [access, setAccess] = useState<AccessState>("idle");
  const [colorsOpen, setColorsOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const check = useServerFn(checkAppAccess);

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
      const st = localStorage.getItem(STYLE_KEY);
      if (st) setStyle({ ...DEFAULT_STYLE, ...JSON.parse(st) });
      const p = localStorage.getItem(PAIRS_KEY);
      if (p) setPairs(JSON.parse(p));
    } catch {}
  }, []);

  useEffect(() => {
    const gotoSymbols = () => setTab("symbols");
    const openColors = () => setColorsOpen(true);
    window.addEventListener("ea:goto-symbols", gotoSymbols);
    window.addEventListener("ea:open-colors", openColors);
    return () => {
      window.removeEventListener("ea:goto-symbols", gotoSymbols);
      window.removeEventListener("ea:open-colors", openColors);
    };
  }, []);

  useEffect(() => {
    if (!mentor) { setAccess("idle"); return; }
    if (mentor.is_admin) { setAccess("ok"); return; }
    setAccess("checking");
    check({ data: { email: mentor.email, device_id: getDeviceId() } })
      .then((r) => {
        if (r.ok) { setAccess("ok"); return; }
        if (r.reason === "other_device") {
          setAccess("other_device");
          speak("Account already used on another device. Please reactivate from your portal.");
        } else {
          setAccess("unpaid");
          speak("Access denied. Here are my banking details below.");
        }
      })
      .catch(() => setAccess("ok"));
  }, [mentor, check]);

  // Keep the bot's symbols in sync with what the owner set in the portal
  const licInfo = useServerFn(getLicenseInfo);
  const sessionKey = session?.key;
  useEffect(() => {
    if (!sessionKey) return;
    licInfo({ data: { key: sessionKey } })
      .then((r) => {
        if (!r.ok) return;
        setSession((prev) => {
          if (!prev) return prev;
          const next = { ...prev, symbols: r.symbols ?? [], ea_name: r.ea_name, ea_image: r.ea_image };
          try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
          return next;
        });
      })
      .catch(() => {});
  }, [sessionKey, licInfo]);


  const updatePairs = (fn: (p: Pair[]) => Pair[]) => {
    setPairs((prev) => {
      const next = fn(prev);
      localStorage.setItem(PAIRS_KEY, JSON.stringify(next));
      return next;
    });
  };

  const onMentor = (m: Mentor) => { setMentor(m); localStorage.setItem(MENTOR_KEY, JSON.stringify(m)); };
  const onLogin = (s: Session) => { setSession(s); localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); };
  const onLogout = () => {
    if (session?.key) addDeletedKey(session.key);
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
  const updateStyle = (patch: Partial<UIStyle>) => {
    setStyle((prev) => {
      const next = { ...prev, ...patch };
      try { localStorage.setItem(STYLE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  };
  const updateVideo = (url: string) => {
    setBgVideo(url);
    if (url) localStorage.setItem(VIDEO_KEY, url);
    else localStorage.removeItem(VIDEO_KEY);
  };

  const onTab = (t: TabId) => {
    if (t === "home" && videoRef.current) {
      const v = videoRef.current;
      if (tab === "home") {
        // Tapping Home while already home toggles the background video
        if (v.paused) { v.play().catch(() => {}); toast.info("Background video playing"); }
        else { v.pause(); toast.info("Background video stopped"); }
      } else {
        v.play().catch(() => {});
      }
    }
    setTab(t);
  };


  const bgTint = useMemo(
    () => `color-mix(in oklab, ${accent} 14%, #06080f)`,
    [accent],
  );

  const gated = mentor && access === "ok";

  return (
    <div
      className="relative flex h-full flex-col text-white"
      style={{
        ["--app-accent" as any]: accent,
        ["--app-bg" as any]: bgTint,
        backgroundColor: "var(--app-bg)",
      }}
    >
      {bgVideo && (
        <video
          key={bgVideo}
          ref={videoRef}
          src={bgVideo}
          muted
          loop
          playsInline
          className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-40"
        />
      )}
      <div className="pointer-events-none absolute inset-0" style={{ backgroundColor: "color-mix(in oklab, var(--app-bg) 70%, transparent)" }} />

      <StatusBar />
      <div className="relative z-10 flex-1 overflow-y-auto pb-24">
        {!mentor && <MentorGate onSuccess={onMentor} />}
        {mentor && access === "checking" && (
          <div className="flex h-full items-center justify-center text-sm text-white/50">Verifying access…</div>
        )}
        {mentor && access === "unpaid" && <AccessDeniedScreen onSignOut={onSignOutAll} />}
        {mentor && access === "other_device" && <OtherDeviceScreen email={mentor.email} onSignOut={onSignOutAll} />}
        {gated && !session && <LicenseGate mentor={mentor!} onSuccess={onLogin} onSignOut={onSignOutAll} />}
        {gated && session && tab === "home" && <HomeScreen session={session} onDelete={onLogout} onLogin={onLogin} style={style} pairs={pairs} />}
        {gated && session && tab === "symbols" && <SymbolsScreen session={session} pairs={pairs} setPairs={updatePairs} />}
        {gated && session && tab === "metatrader" && <MetaTraderScreen />}
        {gated && session && tab === "scanner" && <ScannerScreen session={session} />}
        {gated && session && tab === "settings" && (
          <SettingsScreen
            session={session}
            onLogout={onLogout}
            accent={accent}
            bgVideo={bgVideo}
            onBgVideo={updateVideo}
            style={style}
            onStyle={updateStyle}
          />
        )}
        {gated && session && tab === "help" && <HelpScreen />}
      </div>
      {gated && session && <BottomNav tab={tab} setTab={onTab} style={style} />}
      {colorsOpen && <ColorsDrawer accent={accent} onAccent={updateAccent} onClose={() => setColorsOpen(false)} />}
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
      <h1 className="text-2xl font-bold">EA Vault EA</h1>
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
    if (isDeletedKey(key)) { toast.error("This licence was deleted on this device and can't be used again."); return; }

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

function HomeScreen({ session, onDelete, onLogin, style, pairs }: { session: Session; onDelete: () => void; onLogin: (s: Session) => void; style: UIStyle; pairs: Pair[] }) {
  const [running, setRunning] = useState(false);
  const [bubbleOpen, setBubbleOpen] = useState(false);
  const swipeRef = useRef<{ x: number; y: number } | null>(null);

  const toggle = () => {
    setRunning((r) => {
      const next = !r;
      if (next) {
        speak(`${session.ea_name} is now trading`);
        toast.success("Bot activated");
      } else {
        toast.info("Bot stopped");
        try { window.speechSynthesis?.cancel(); } catch {}
      }
      return next;
    });
    if (!bubbleOpen) setBubbleOpen(true);
  };

  const handleDelete = () => {
    if (!confirm("Delete this licence from the app? You'll need to enter the key again to use it.")) return;
    onDelete();
    toast.success("Licence removed");
  };

  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0]; swipeRef.current = { x: t.clientX, y: t.clientY };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const s = swipeRef.current; swipeRef.current = null; if (!s) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - s.x; const dy = t.clientY - s.y;
    if (dx < -60 && Math.abs(dy) < 60) {
      window.dispatchEvent(new CustomEvent("ea:open-colors"));
    }
  };

  const common = { session, running, toggle, handleDelete, pairs, onOpenBubble: () => setBubbleOpen(true) };

  return (
    <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      {style.home === "v1" && <HomeV1 {...common} />}
      {style.home === "v2" && <HomeV2 {...common} />}
      {style.home === "v3" && <HomeV3 {...common} />}
      {style.home === "v4" && <HomeV4 {...common} />}
      {style.home === "v5" && <HomeV5 {...common} />}
      {style.home === "v6" && <HomeV6 {...common} />}

      <div className="px-5 pb-6">
        <AddLicenceButton onLogin={onLogin} />
      </div>

      <p className="pb-4 text-center text-[10px] text-white/30">← Swipe left to change colors</p>

      {bubbleOpen && (
        <TradeBubble
          session={session}
          running={running}
          onToggle={toggle}
          onClose={() => setBubbleOpen(false)}
          pairs={pairs}
        />
      )}
    </div>
  );
}



type HomeVProps = {
  session: Session;
  running: boolean;
  toggle: () => void;
  handleDelete: () => void;
  pairs: Pair[];
  onOpenBubble: () => void;
};

function LiveBadge({ running }: { running: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold ${running ? "bg-black text-white ring-1 ring-emerald-400/40" : "bg-black text-white/60 ring-1 ring-white/10"}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${running ? "bg-emerald-400 animate-pulse" : "bg-white/30"}`} />
      {running ? "LIVE" : "IDLE"}
    </span>
  );
}

function ActionBar({ running, toggle, handleDelete, onOpenBubble: _onOpenBubble }: { running: boolean; toggle: () => void; handleDelete: () => void; onOpenBubble: () => void }) {
  return (
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
      <PillBtn icon={<BarChart3 className="h-5 w-5" />} label="SYMBOLS" onClick={() => window.dispatchEvent(new CustomEvent("ea:goto-symbols"))} />
    </div>
  );
}


// V1 — Classic: full EA image portrait with gradient overlays
function HomeV1({ session, running, toggle, handleDelete, onOpenBubble }: HomeVProps) {
  return (
    <div className="relative flex flex-col items-center px-5 pt-6 pb-10 text-center">
      <div className="pointer-events-none absolute inset-0" style={{ background: `radial-gradient(circle at 50% 25%, color-mix(in oklab, var(--app-accent) 25%, transparent), transparent 55%)` }} />
      <div className="relative mt-2">
        <div className="absolute -inset-3 rounded-full blur-2xl" style={{ background: `color-mix(in oklab, var(--app-accent) 30%, transparent)` }} />
        <button onClick={onOpenBubble} className="relative h-56 w-56 overflow-hidden rounded-full ring-2 active:scale-[0.98]"
          style={{ borderColor: "var(--app-accent)", boxShadow: `0 0 60px -10px var(--app-accent)` }}>
          {session.ea_image ? <img src={session.ea_image} alt={session.ea_name} className="h-full w-full object-cover" />
            : <div className="grid h-full w-full place-items-center bg-gradient-to-br from-cyan-500/30 to-blue-700/30"><Bot className="h-20 w-20 text-cyan-300" /></div>}
        </button>
        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2"><LiveBadge running={running} /></div>
      </div>
      <p className="mt-10 text-[11px] tracking-[0.25em] text-white/50">YOU'RE TRADING WITH</p>
      <h1 className="mt-1 text-3xl font-extrabold uppercase tracking-tight leading-tight">{session.ea_name}</h1>
      <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-black/70 px-4 py-1.5 ring-1 ring-white/10">
        <Flame className="h-3.5 w-3.5 text-orange-400" />
        <span className="text-[11px] text-white/60">Powered by:</span>
        <span className="text-[11px] font-bold tracking-wider">EA VAULT</span>
      </div>
      <ActionBar running={running} toggle={toggle} handleDelete={handleDelete} onOpenBubble={onOpenBubble} />
      <p className="mt-2 text-[10px] uppercase tracking-[0.3em] text-white/30">{running ? "STOP" : "START"}</p>
    </div>
  );
}

// V2 — Modern: minimalist dark, large centered profile with glass-morphism
function HomeV2({ session, running, toggle, handleDelete, onOpenBubble }: HomeVProps) {
  return (
    <div className="relative flex flex-col items-center px-5 pt-8 pb-10 text-center">
      <div className="relative">
        <button onClick={onOpenBubble} className="relative h-44 w-44 overflow-hidden rounded-full backdrop-blur-xl active:scale-[0.98]"
          style={{ boxShadow: `0 0 0 1px rgba(255,255,255,0.15), 0 20px 60px -10px var(--app-accent)` }}>
          {session.ea_image ? <img src={session.ea_image} alt={session.ea_name} className="h-full w-full object-cover" />
            : <Bot className="mx-auto h-20 w-20 text-white/70" />}
        </button>
      </div>
      <div className="mt-4"><LiveBadge running={running} /></div>
      <h1 className="mt-6 text-2xl font-bold tracking-tight">{session.ea_name}</h1>
      <p className="mt-1 text-[11px] text-white/40">Minimal · Glass interface</p>
      <div className="mt-6 w-full max-w-[320px] rounded-3xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl">
        <ActionBar running={running} toggle={toggle} handleDelete={handleDelete} onOpenBubble={onOpenBubble} />
      </div>
    </div>
  );
}

// V3 — Futuristic: dark with animated glowing rings, card-based
function HomeV3({ session, running, toggle, handleDelete, onOpenBubble }: HomeVProps) {
  return (
    <div className="relative flex flex-col items-center px-5 pt-6 pb-10 text-center">
      <div className="relative mt-4">
        <div className="absolute -inset-8 animate-pulse rounded-full" style={{ boxShadow: `0 0 60px 10px var(--app-accent), inset 0 0 40px var(--app-accent)`, border: `1px dashed var(--app-accent)` }} />
        <div className="absolute -inset-14 rounded-full opacity-40" style={{ border: `1px dashed var(--app-accent)` }} />
        <button onClick={onOpenBubble} className="relative h-48 w-48 overflow-hidden rounded-full ring-4 active:scale-[0.98]"
          style={{ borderColor: "var(--app-accent)", boxShadow: `0 0 80px var(--app-accent)` }}>
          {session.ea_image ? <img src={session.ea_image} alt={session.ea_name} className="h-full w-full object-cover" />
            : <div className="grid h-full w-full place-items-center bg-black"><Bot className="h-20 w-20" style={{ color: "var(--app-accent)" }} /></div>}
        </button>
      </div>
      <div className="mt-8"><LiveBadge running={running} /></div>
      <h1 className="mt-4 text-3xl font-black uppercase" style={{ textShadow: `0 0 20px var(--app-accent)` }}>{session.ea_name}</h1>
      <div className="mt-6 grid w-full max-w-[320px] grid-cols-3 gap-2">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-[9px] uppercase tracking-wider text-white/40">Status</p>
          <p className="mt-1 text-xs font-bold" style={{ color: running ? "#10b981" : "#94a3b8" }}>{running ? "ACTIVE" : "IDLE"}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-[9px] uppercase tracking-wider text-white/40">Plan</p>
          <p className="mt-1 text-xs font-bold uppercase">{session.plan.slice(0, 6)}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-[9px] uppercase tracking-wider text-white/40">Pairs</p>
          <p className="mt-1 text-xs font-bold">{session.symbols.length}</p>
        </div>
      </div>
      <ActionBar running={running} toggle={toggle} handleDelete={handleDelete} onOpenBubble={onOpenBubble} />
    </div>
  );
}

// V4 — Pro: centered avatar with glow, horizontal action cards, image-background robot cards
function HomeV4({ session, running, toggle, handleDelete, onOpenBubble }: HomeVProps) {
  return (
    <div className="relative flex flex-col items-center px-5 pt-8 pb-10">
      <div className="relative">
        <div className="absolute -inset-6 rounded-full blur-3xl" style={{ background: `color-mix(in oklab, var(--app-accent) 55%, transparent)` }} />
        <button onClick={onOpenBubble} className="relative h-40 w-40 overflow-hidden rounded-full ring-4 active:scale-[0.98]"
          style={{ borderColor: "var(--app-accent)", boxShadow: `0 0 90px var(--app-accent)` }}>
          {session.ea_image ? <img src={session.ea_image} alt={session.ea_name} className="h-full w-full object-cover" />
            : <div className="grid h-full w-full place-items-center bg-black"><Bot className="h-16 w-16 text-white" /></div>}
        </button>
      </div>
      <h1 className="mt-6 text-center text-2xl font-black tracking-tight">{session.ea_name}</h1>
      <div className="mt-2"><LiveBadge running={running} /></div>

      <div className="mt-6 grid w-full max-w-[340px] grid-cols-2 gap-2.5">
        <button onClick={onOpenBubble} className="relative flex h-24 overflow-hidden rounded-2xl p-3 text-left active:scale-[0.98]"
          style={{ backgroundImage: session.ea_image ? `linear-gradient(135deg, rgba(0,0,0,0.7), rgba(0,0,0,0.4)), url(${session.ea_image})` : undefined, backgroundColor: "rgba(255,255,255,0.05)", backgroundSize: "cover", backgroundPosition: "center" }}>
          <div className="flex flex-col justify-between">
            <BarChart3 className="h-5 w-5" style={{ color: "var(--app-accent)" }} />
            <div>
              <p className="text-[10px] uppercase tracking-wider text-white/60">My Pairs</p>
              <p className="text-lg font-black">{session.symbols.length}</p>
            </div>
          </div>
        </button>
        <button onClick={toggle} className="relative flex h-24 flex-col justify-between rounded-2xl p-3 text-left active:scale-[0.98]"
          style={{ background: running ? "linear-gradient(135deg, #dc2626, #7f1d1d)" : `linear-gradient(135deg, var(--app-accent), color-mix(in oklab, var(--app-accent) 40%, black))` }}>
          {running ? <Square className="h-5 w-5 fill-white text-white" /> : <Play className="h-5 w-5 fill-white text-white" />}
          <div>
            <p className="text-[10px] uppercase tracking-wider text-white/70">Bot</p>
            <p className="text-lg font-black text-white">{running ? "STOP" : "START"}</p>
          </div>
        </button>
      </div>

      <ActionBar running={running} toggle={toggle} handleDelete={handleDelete} onOpenBubble={onOpenBubble} />
      <p className="mt-4 text-[10px] tracking-[0.35em] text-white/30">POWERED BY: EA VAULT</p>
    </div>
  );
}

function TradeBubble({
  session, running, onToggle, onClose, pairs,
}: {
  session: Session; running: boolean; onToggle: () => void; onClose: () => void; pairs: Pair[];
}) {
  const [expanded, setExpanded] = useState(false);
  const [logsOpen, setLogsOpen] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ dx: number; dy: number; moved: boolean; startX: number; startY: number } | null>(null);

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    dragRef.current = { dx: e.clientX - pos.x, dy: e.clientY - pos.y, moved: false, startX: e.clientX, startY: e.clientY };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const nx = e.clientX - dragRef.current.dx;
    const ny = e.clientY - dragRef.current.dy;
    if (Math.abs(e.clientX - dragRef.current.startX) + Math.abs(e.clientY - dragRef.current.startY) > 6) {
      dragRef.current.moved = true;
    }
    setPos({ x: nx, y: ny });
  };
  const onPointerUp = (e: React.PointerEvent) => {
    (e.target as Element).releasePointerCapture?.(e.pointerId);
    const moved = dragRef.current?.moved;
    dragRef.current = null;
    if (!moved) setExpanded((v) => !v);
  };

  if (!expanded) {
    return (
      <div
        className="fixed z-50 touch-none select-none"
        style={{ left: "50%", top: "60%", transform: `translate(calc(-50% + ${pos.x}px), calc(-50% + ${pos.y}px))` }}
      >
        <button
          type="button"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          className="relative grid h-20 w-20 place-items-center overflow-hidden rounded-full ring-2 shadow-2xl active:scale-95"
          style={{ borderColor: "var(--app-accent)", boxShadow: `0 0 40px var(--app-accent)`, backgroundColor: "#0a0f1a" }}
          aria-label="Open trade card"
        >
          {session.ea_image ? (
            <img src={session.ea_image} alt="" className="h-full w-full object-cover" />
          ) : (
            <Bot className="h-8 w-8 text-white" />
          )}
          <span className={`absolute -bottom-0.5 left-1/2 -translate-x-1/2 rounded-full px-1.5 text-[9px] font-bold ${running ? "bg-emerald-500 text-black" : "bg-white/20 text-white"}`}>
            {running ? "LIVE" : "IDLE"}
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4" onClick={() => setExpanded(false)}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm overflow-hidden rounded-3xl bg-slate-900 text-white ring-1 ring-white/10 shadow-2xl"
      >
        <div className="relative h-56 w-full">
          {session.ea_image ? (
            <img src={session.ea_image} alt={session.ea_name} className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-cyan-600 to-blue-800">
              <Bot className="h-16 w-16 text-white/80" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
          <div className="absolute right-3 top-3 flex gap-2">
            <button
              onClick={() => setExpanded(false)}
              className="grid h-9 w-9 place-items-center rounded-full bg-slate-800/90 text-white ring-1 ring-white/20"
              aria-label="Minimize"
              title="Minimize to bubble"
            >
              <div className="h-0.5 w-3 bg-white" />
            </button>
            <button
              onClick={onClose}
              className="grid h-9 w-9 place-items-center rounded-full bg-slate-800/90 text-white ring-1 ring-white/20"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="absolute bottom-3 left-4 right-4 text-left">
            <h2 className="text-2xl font-extrabold leading-tight">{session.ea_name}</h2>
            <p className="mt-0.5 text-sm font-semibold text-white/80">
              {session.username} <span>💰📶</span>
            </p>
          </div>
        </div>

        <div className="px-5 pb-5 pt-4 text-left">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Server: <span className="text-emerald-400">Connected</span>
          </p>

          {pairs.length > 0 && (
            <p className="mt-1 text-[11px] text-white/50">
              {pairs.length} pair{pairs.length > 1 ? "s" : ""} configured · {pairs.reduce((a, p) => a + p.trades, 0)} trades/cycle
            </p>
          )}

          <div className="mt-4 grid grid-cols-2 gap-3">
            <button
              onClick={onToggle}
              className={`flex items-center justify-center gap-2 rounded-full py-3 text-sm font-bold text-white shadow-lg active:scale-[0.98] ${running ? "bg-red-500 shadow-red-500/40" : "bg-emerald-500 shadow-emerald-500/40"}`}
            >
              {running ? <Square className="h-4 w-4 fill-white" /> : <Play className="h-4 w-4 fill-white" />}
              {running ? "Stop Trade" : "Start Trade"}
            </button>
            <button
              onClick={() => setLogsOpen(!logsOpen)}
              className="flex items-center justify-center gap-2 rounded-full bg-slate-800 py-3 text-sm font-bold text-white ring-1 ring-white/10 active:scale-[0.98]"
            >
              <FileText className="h-4 w-4" />
              {logsOpen ? "Hide Logs" : "Show Logs"}
            </button>
          </div>

          <div className="mt-4 flex justify-end">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500 px-3 py-1 text-[11px] font-bold text-white">
              Powered by <span className="font-extrabold">EA VAULT</span>
            </span>
          </div>

          {logsOpen && (
            <div className="mt-4">
              <TradeLogs running={running} symbols={pairs.length ? pairs.map((p) => p.symbol) : session.symbols} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TradeLogs({ running, symbols: _symbols }: { running: boolean; symbols: string[] }) {
  const [logs, setLogs] = useState<Trade[]>([]);
  useEffect(() => {
    const load = () => {
      try {
        const raw = localStorage.getItem(EXEC_TRADES_KEY);
        setLogs(raw ? (JSON.parse(raw) as Trade[]) : []);
      } catch { setLogs([]); }
    };
    load();
    const on = () => load();
    window.addEventListener("ea:exec-trades", on);
    window.addEventListener("storage", on);
    const t = setInterval(load, 2500);
    return () => {
      window.removeEventListener("ea:exec-trades", on);
      window.removeEventListener("storage", on);
      clearInterval(t);
    };
  }, []);

  return (
    <div className="relative mt-6 w-full max-w-[340px] rounded-2xl border border-white/10 bg-black/40 p-3 text-left">
      <div className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-wider text-white/60">
        <FileText className="h-3.5 w-3.5" style={{ color: "var(--app-accent)" }} />
        My Executed Trades
        {running && <span className="ml-auto inline-flex items-center gap-1 text-emerald-300">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" /> live
        </span>}
      </div>
      <div className="max-h-44 space-y-1.5 overflow-y-auto pr-1">
        {logs.length === 0 && <p className="py-3 text-center text-[11px] text-white/40">No trades executed yet. Use Scanner to execute a signal.</p>}
        {logs.map((t) => (
          <div key={t.id} className="flex items-center gap-2 rounded-lg bg-white/[0.04] px-2 py-1.5 text-[11px]">
            {t.side === "BUY"
              ? <TrendingUp className="h-3.5 w-3.5 text-emerald-300" />
              : <TrendingDown className="h-3.5 w-3.5 text-rose-300" />}
            <span className="font-semibold">{t.symbol}</span>
            <span className="text-white/50">{t.side} {t.lot}</span>
            <span className="ml-auto font-mono tabular-nums">
              <span className="text-white/40">{t.at}</span>
            </span>
          </div>
        ))}
      </div>
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

const DEFAULT_AVAILABLE = [
  "EURUSD", "GBPUSD", "USDJPY", "USDCHF", "AUDUSD", "NZDUSD", "USDCAD",
  "EURGBP", "EURJPY", "GBPJPY", "AUDJPY", "CHFJPY",
  "XAUUSD", "XAGUSD", "XAUUSD.m",
  "BTCUSD", "ETHUSD", "BTCUSD.m", "BTCUSDm",
  "US30", "NAS100", "SPX500", "GER40", "UK100",
];

function SymbolsScreen({ session, pairs, setPairs }: { session: Session; pairs: Pair[]; setPairs: (fn: (p: Pair[]) => Pair[]) => void }) {
  const [tab, setTab] = useState<"mine" | "available">("mine");
  const [query, setQuery] = useState("");
  const [picking, setPicking] = useState<string | null>(null);
  const [editing, setEditing] = useState<Pair | null>(null);

  const available = useMemo(() => {
    const merged = Array.from(new Set([...(session.symbols || []), ...DEFAULT_AVAILABLE]));
    return merged.filter((s) => !pairs.some((p) => p.symbol === s));
  }, [session.symbols, pairs]);

  const filtered = (tab === "available" ? available : pairs.map((p) => p.symbol))
    .filter((s) => s.toLowerCase().includes(query.trim().toLowerCase()));

  const remove = (sym: string) => {
    setPairs((prev) => prev.filter((p) => p.symbol !== sym));
    toast.success(`Removed ${sym}`);
  };

  return (
    <div className="px-5 pt-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Trading Pairs</h1>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 rounded-2xl bg-white/[0.06] p-1">
        <button
          onClick={() => setTab("mine")}
          className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition ${tab === "mine" ? "bg-[var(--app-accent)] text-black" : "text-white/60"}`}
        >
          My Pairs <span className="rounded-md bg-black/20 px-1.5 py-0.5 text-[10px]">{pairs.length}</span>
        </button>
        <button
          onClick={() => setTab("available")}
          className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition ${tab === "available" ? "bg-[var(--app-accent)] text-black" : "text-white/60"}`}
        >
          Available <span className="rounded-md bg-black/20 px-1.5 py-0.5 text-[10px]">{available.length}</span>
        </button>
      </div>

      <div className="mt-4 flex items-center gap-2 rounded-xl bg-white/[0.06] px-3 py-2.5">
        <BarChart3 className="h-4 w-4 text-white/40" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search symbols"
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-white/40"
        />
      </div>

      {tab === "mine" ? (
        <div className="mt-4 space-y-2">
          {pairs.length === 0 && (
            <p className="py-6 text-center text-xs text-white/40">No pairs yet. Open Available to add one.</p>
          )}
          {pairs.filter((p) => p.symbol.toLowerCase().includes(query.trim().toLowerCase())).map((p) => (
            <div key={p.symbol} className="flex items-center justify-between rounded-2xl bg-white/[0.04] p-4 ring-1 ring-white/5">
              <div>
                <p className="text-base font-bold">{p.symbol}</p>
                <p className="mt-0.5 text-[11px] text-white/50">Lot {p.lot.toFixed(2)} · {p.trades} trades</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setEditing(p)} className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold">Edit</button>
                <button onClick={() => remove(p.symbol)} className="grid h-8 w-8 place-items-center rounded-lg bg-rose-500/20 text-rose-300"><X className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-3">
          {filtered.map((s) => (
            <div key={s} className="rounded-2xl bg-white/[0.04] p-4 ring-1 ring-white/5">
              <p className="text-base font-bold">{s}</p>
              <p className="mt-1 text-[11px] text-white/40">min 0.01</p>
              <button
                onClick={() => setPicking(s)}
                className="mt-3 grid h-9 w-9 place-items-center rounded-full text-black shadow-md active:scale-95"
                style={{ backgroundColor: "var(--app-accent)" }}
                aria-label={`Add ${s}`}
              >
                <Plus className="h-4 w-4" strokeWidth={3} />
              </button>
            </div>
          ))}
          {filtered.length === 0 && <p className="col-span-2 py-6 text-center text-xs text-white/40">No matches</p>}
        </div>
      )}

      {(picking || editing) && (
        <PairConfigModal
          initial={editing ?? { symbol: picking!, lot: 0.01, trades: 1 }}
          isEdit={!!editing}
          onClose={() => { setPicking(null); setEditing(null); }}
          onSave={(p) => {
            setPairs((prev) => {
              const others = prev.filter((x) => x.symbol !== p.symbol);
              return [...others, p];
            });
            toast.success(`${p.symbol} saved to My Pairs`);
            setPicking(null); setEditing(null);
            setTab("mine");
          }}
        />
      )}
    </div>
  );
}

function PairConfigModal({ initial, isEdit, onClose, onSave }: { initial: Pair; isEdit: boolean; onClose: () => void; onSave: (p: Pair) => void }) {
  const [lot, setLot] = useState<string>(String(initial.lot));
  const [trades, setTrades] = useState<string>(String(initial.trades));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const l = Number(lot);
    const t = Math.floor(Number(trades));
    if (!Number.isFinite(l) || l <= 0) { toast.error("Enter a valid lot size"); return; }
    if (!Number.isFinite(t) || t < 1) { toast.error("Enter at least 1 trade"); return; }
    onSave({ symbol: initial.symbol, lot: l, trades: t });
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-5" onClick={onClose}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={submit} className="w-full max-w-sm rounded-2xl bg-[#0b1224] p-5 ring-1 ring-white/10">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">{initial.symbol}</h2>
            <p className="text-[11px] text-white/50">{isEdit ? "Edit pair settings" : "Configure this pair"}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-md p-1 text-white/60 hover:bg-white/10">
            <X className="h-4 w-4" />
          </button>
        </div>

        <label className="mb-3 block">
          <span className="mb-1 block text-[11px] uppercase tracking-wider text-white/50">Lot size</span>
          <input
            value={lot}
            onChange={(e) => setLot(e.target.value)}
            inputMode="decimal"
            placeholder="0.01"
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white outline-none focus:border-[var(--app-accent)]"
          />
        </label>
        <label className="mb-4 block">
          <span className="mb-1 block text-[11px] uppercase tracking-wider text-white/50">Number of trades</span>
          <input
            value={trades}
            onChange={(e) => setTrades(e.target.value.replace(/[^\d]/g, ""))}
            inputMode="numeric"
            placeholder="1"
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white outline-none focus:border-[var(--app-accent)]"
          />
        </label>
        <button type="submit" className="w-full rounded-xl py-3 text-sm font-bold text-black" style={{ backgroundColor: "var(--app-accent)" }}>
          Save
        </button>
      </form>
    </div>
  );
}


function Stat({ label, value, valueClass = "" }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="rounded-xl bg-black/30 p-3">
      <p className="text-[10px] uppercase tracking-wider text-white/40">{label}</p>
      <p className={`mt-1 text-lg font-bold tabular-nums ${valueClass}`}>{value}</p>
    </div>
  );
}


type BrokerInfo = { balance: number; equity: number; currency: string; name: string; leverage?: number };
const BROKER_INFO_KEY = "algopro.brokerInfo";

const LINK_STEPS = [
  "Verifying broker credentials",
  "Connecting to broker server",
  "Syncing trading account",
  "Loading account balance",
];

function LinkingOverlay({
  step,
  error,
  info,
  brokerName,
  onClose,
}: {
  step: number;
  error: string | null;
  info: BrokerInfo | null;
  brokerName: string;
  onClose: () => void;
}) {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 px-6 backdrop-blur-sm">
      <div className="w-full rounded-3xl border border-white/10 bg-[#0b0f16] p-5 text-center">
        {!error && !info && (
          <>
            <div className="relative mx-auto h-24 w-24">
              <div
                className="absolute inset-0 animate-spin rounded-full border-2 border-transparent"
                style={{ borderTopColor: "var(--app-accent)", borderRightColor: "var(--app-accent)", animationDuration: "1s" }}
              />
              <div
                className="absolute inset-3 animate-spin rounded-full border-2 border-transparent"
                style={{ borderBottomColor: "var(--app-accent)", animationDuration: "1.6s", animationDirection: "reverse" }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <BrokerLogo name={brokerName} size={38} />
              </div>
            </div>
            <p className="mt-4 text-sm font-bold">Linking {brokerName || "broker"}…</p>
            <div className="mt-4 space-y-2 text-left">
              {LINK_STEPS.map((s, i) => (
                <div key={s} className="flex items-center gap-2.5">
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                      i < step ? "bg-emerald-500 text-black" : i === step ? "bg-white/15 text-white" : "bg-white/5 text-white/30"
                    }`}
                  >
                    {i < step ? "✓" : i + 1}
                  </span>
                  <span className={`text-[12px] ${i <= step ? "text-white/85" : "text-white/35"}`}>{s}</span>
                  {i === step && (
                    <span className="ml-auto h-3 w-3 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {info && (
          <>
            <div className="mx-auto flex h-16 w-16 animate-[scale-in_0.25s_ease-out] items-center justify-center rounded-full bg-emerald-500/15 text-3xl text-emerald-400">
              ✓
            </div>
            <p className="mt-3 text-sm font-bold text-emerald-300">Broker successfully linked</p>
            <p className="text-[11px] text-white/50">{info.name || brokerName}</p>
            <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-[10px] uppercase tracking-wider text-white/40">Available balance</p>
              <p className="mt-1 text-3xl font-black tabular-nums text-white">
                {info.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{" "}
                <span className="text-base font-bold text-white/50">{info.currency}</span>
              </p>
              <div className="mt-2 flex justify-between text-[11px] text-white/50">
                <span>Equity: {info.equity.toFixed(2)}</span>
                {info.leverage ? <span>Leverage 1:{info.leverage}</span> : null}
              </div>
            </div>
            <button
              onClick={onClose}
              className="mt-4 w-full rounded-xl py-3 text-sm font-semibold text-black"
              style={{ backgroundColor: "var(--app-accent)" }}
            >
              Continue
            </button>
          </>
        )}

        {error && (
          <>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-500/15 text-3xl text-rose-400">
              !
            </div>
            <p className="mt-3 text-sm font-bold text-rose-300">Linking failed</p>
            <p className="mt-1 text-[12px] leading-relaxed text-white/60">{error}</p>
            <button
              onClick={onClose}
              className="mt-4 w-full rounded-xl border border-white/15 bg-white/5 py-3 text-sm font-semibold text-white"
            >
              Close
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function MetaTraderScreen() {
  const [broker, setBroker] = useState<Broker>({ broker: "", server: "", login: "", password: "" });
  const [saved, setSaved] = useState(false);
  const [picking, setPicking] = useState(false);
  const [info, setInfo] = useState<BrokerInfo | null>(null);
  const [linking, setLinking] = useState(false);
  const [step, setStep] = useState(0);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [linkedInfo, setLinkedInfo] = useState<BrokerInfo | null>(null);
  const [platform, setPlatform] = useState<"mt4" | "mt5">("mt5");
  const [accountType, setAccountType] = useState("Standard");
  const link = useServerFn(linkBrokerAccount);
  const detected = brandFor(`${broker.broker} ${broker.server}`);
  const displayName = detected?.name || broker.broker.trim() || broker.server.trim();

  useEffect(() => {
    try {
      const raw = localStorage.getItem(BROKER_KEY);
      if (raw) { setBroker(JSON.parse(raw)); setSaved(true); }
      const ri = localStorage.getItem(BROKER_INFO_KEY);
      if (ri) setInfo(JSON.parse(ri));
    } catch {}
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broker.server.trim() || !broker.login.trim() || !broker.password.trim()) {
      toast.error("Enter your server, login and password");
      return;
    }
    if (!broker.broker.trim() && detected) setBroker((p) => ({ ...p, broker: detected.name }));
    setLinking(true);
    setLinkError(null);
    setLinkedInfo(null);
    setStep(0);
    const timers = [
      setTimeout(() => setStep(1), 350),
      setTimeout(() => setStep(2), 900),
      setTimeout(() => setStep(3), 1600),
    ];
    try {
      const res = (await link({
        data: {
          broker: (broker.broker.trim() || displayName),
          server: broker.server.trim(),
          login: broker.login.trim(),
          password: broker.password,
          platform,
        },
      })) as
        | { ok: true; balance: number; equity: number; currency: string; name: string; leverage?: number }
        | { ok: false; reason: string };
      timers.forEach(clearTimeout);
      if (!res.ok) {
        setLinkError(res.reason);
        return;
      }
      const nfo: BrokerInfo = {
        balance: res.balance,
        equity: res.equity,
        currency: res.currency,
        name: res.name,
        ...(res.leverage ? { leverage: res.leverage } : {}),
      };
      setStep(LINK_STEPS.length);
      setLinkedInfo(nfo);
      setInfo(nfo);
      localStorage.setItem(BROKER_KEY, JSON.stringify({ ...broker, broker: broker.broker.trim() || displayName }));
      localStorage.setItem(BROKER_INFO_KEY, JSON.stringify(nfo));
      setSaved(true);
      setPicking(false);
      window.dispatchEvent(new Event("ea:broker"));
      speak(`${displayName} account linked successfully. Available balance ${Math.round(res.balance)} ${res.currency}`);
    } catch {
      timers.forEach(clearTimeout);
      setLinkError("Could not reach the trading server. Please try again.");
    }
  };

  const clear = () => {
    localStorage.removeItem(BROKER_KEY);
    localStorage.removeItem(BROKER_INFO_KEY);
    setBroker({ broker: "", server: "", login: "", password: "" });
    setInfo(null);
    setSaved(false);
    setPicking(true);
    window.dispatchEvent(new Event("ea:broker"));
    toast.info("Broker unlinked");
  };

  const showForm = picking || !saved;

  return (
    <div className="px-5 pt-5">
      <h1 className="text-xl font-bold">MetaTrader</h1>
      <p className="text-xs text-white/50">Link your broker account for live execution</p>

      {saved && (
        <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.05] p-4">
          <div className="flex items-center gap-3">
            <BrokerLogo name={`${broker.broker} ${broker.server}`} size={46} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold">{displayName}</p>
              <p className="truncate text-[11px] text-white/50">{broker.server} · #{broker.login}</p>
            </div>
            <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-[10px] font-semibold text-emerald-300">
              LINKED
            </span>
          </div>
          {info && (
            <div className="mt-3 rounded-xl bg-black/30 p-3">
              <p className="text-[10px] uppercase tracking-wider text-white/40">Available balance</p>
              <p className="mt-0.5 text-2xl font-black tabular-nums">
                {info.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{" "}
                <span className="text-sm font-bold text-white/50">{info.currency}</span>
              </p>
              <p className="mt-0.5 text-[11px] text-white/45">Equity {info.equity.toFixed(2)}</p>
            </div>
          )}
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => setPicking((p) => !p)}
              className="flex-1 rounded-xl border border-white/15 bg-white/5 py-2.5 text-xs font-semibold text-white"
            >
              {picking ? "Cancel" : "Change broker"}
            </button>
            <button
              onClick={clear}
              className="flex-1 rounded-xl border border-rose-500/30 bg-rose-500/10 py-2.5 text-xs font-semibold text-rose-300"
            >
              Unlink
            </button>
          </div>
        </div>
      )}

      {showForm && (
        <>
          {detected && (
            <div className="mt-4 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.05] p-3">
              <BrokerLogo name={detected.name} size={38} />
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-wider text-white/40">Broker detected</p>
                <p className="truncate text-sm font-bold">{detected.name}</p>
              </div>
            </div>
          )}

          <div className="mt-4 grid grid-cols-2 gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-1">
            {(["mt4", "mt5"] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPlatform(p)}
                className={`rounded-xl py-2.5 text-xs font-bold uppercase tracking-wider transition ${
                  platform === p ? "text-black" : "text-white/60"
                }`}
                style={platform === p ? { backgroundColor: "var(--app-accent)" } : undefined}
              >
                {p === "mt4" ? "MetaTrader 4" : "MetaTrader 5"}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="mt-4 space-y-3">
            <Field label="Broker">
              <select
                value={broker.broker}
                onChange={(e) => setBroker({ ...broker, broker: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white outline-none focus:border-[var(--app-accent)]"
              >
                <option value="" className="bg-slate-900">Select your broker</option>
                {BROKER_BRANDS.map((b) => (
                  <option key={b.name} value={b.name} className="bg-slate-900">{b.name}</option>
                ))}
                <option value="Other" className="bg-slate-900">Other</option>
              </select>
            </Field>
            <Field label="Server">
              <input
                value={broker.server}
                onChange={(e) => setBroker({ ...broker, server: e.target.value })}
                placeholder="e.g. Exness-Real5"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white outline-none focus:border-[var(--app-accent)]"
              />
            </Field>

            <Field label="Account Type">
              <select
                value={accountType}
                onChange={(e) => setAccountType(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white outline-none focus:border-[var(--app-accent)]"
              >
                {["Standard", "Cent", "Pro", "Raw Spread", "Zero", "ECN", "Demo"].map((t) => (
                  <option key={t} value={t} className="bg-slate-900">{t}</option>
                ))}
              </select>
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
            <p className="rounded-xl bg-white/5 px-3 py-2 text-[11px] leading-relaxed text-white/50">
              Live execution is handled by EA Vault — no extra API keys needed. Just save your broker
              login and the bot trades straight into your MT4/MT5 account.
            </p>
            <button
              type="submit"
              disabled={linking}
              className="w-full rounded-xl py-3 text-sm font-semibold text-black disabled:opacity-60"
              style={{ backgroundColor: "var(--app-accent)" }}
            >
              {linking ? "Linking…" : saved ? "Update Broker" : "Link Broker Account"}
            </button>
          </form>
        </>
      )}

      {linking && (
        <LinkingOverlay
          step={step}
          error={linkError}
          info={linkedInfo}
          brokerName={displayName}
          onClose={() => { setLinking(false); setLinkError(null); setLinkedInfo(null); }}
        />
      )}
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

type ChatMsg =
  | { id: number; role: "user"; image: string; note: string }
  | { id: number; role: "bot"; text: string; analysis?: AnalysisResult };

type AnalysisResult = {
  symbol: string;
  side: "BUY" | "SELL" | "NEUTRAL";
  confidence: number;
  entry?: string;
  sl?: string;
  tp?: string;
  reason?: string;
};

type ExecPlan = { symbol: string; lot: number; trades: number; side: "BUY" | "SELL"; entry?: string; sl?: string; tp?: string };
type ExecState =
  | { phase: "idle" }
  | { phase: "sending"; plan: ExecPlan; placed: number }
  | { phase: "done"; plan: ExecPlan; tickets: number[] };

function ScannerScreen({ session }: { session: Session }) {
  const analyze = useServerFn(analyzeChart);
  const live = useServerFn(executeLiveTrades);

  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [used, setUsed] = useState(0);
  const [exec, setExec] = useState<ExecState>({ phase: "idle" });
  const galleryRef = useRef<HTMLInputElement | null>(null);
  const cameraRef = useRef<HTMLInputElement | null>(null);
  const [broker, setBrokerState] = useState<Broker | null>(null);
  useEffect(() => {
    const read = () => {
      try {
        const r = localStorage.getItem(BROKER_KEY);
        const b = r ? (JSON.parse(r) as Broker) : null;
        setBrokerState(b && b.broker && b.server && b.login && b.password ? b : null);
      } catch { setBrokerState(null); }
    };
    read();
    window.addEventListener("ea:broker", read);
    window.addEventListener("storage", read);
    window.addEventListener("focus", read);
    return () => {
      window.removeEventListener("ea:broker", read);
      window.removeEventListener("storage", read);
      window.removeEventListener("focus", read);
    };
  }, []);


  useEffect(() => {
    try {
      const raw = localStorage.getItem(SCAN_COUNT_KEY);
      if (raw) {
        const { date, count } = JSON.parse(raw) as { date: string; count: number };
        setUsed(date === new Date().toDateString() ? count : 0);
      }
    } catch {}
  }, []);

  const remaining = Math.max(0, SCAN_LIMIT - used);

  const bumpUsed = () => setUsed((u) => {
    const next = u + 1;
    try { localStorage.setItem(SCAN_COUNT_KEY, JSON.stringify({ date: new Date().toDateString(), count: next })); } catch {}
    return next;
  });

  const onPick = async (f: File) => {
    if (!f.type.startsWith("image/")) { toast.error("Pick an image"); return; }
    if (f.size > 10 * 1024 * 1024) { toast.error("Max 10MB"); return; }
    if (remaining <= 0) { toast.error("Daily scan limit reached (50). Try again tomorrow."); return; }
    const dataUrl: string = await new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(String(r.result || ""));
      r.onerror = () => rej(new Error("read"));
      r.readAsDataURL(f);
    });
    setBusy(true);
    setAnalysis(null);
    try {
      const r = await analyze({ data: { image: dataUrl } });
      if (!r.ok) { toast.error(r.reason); return; }
      bumpUsed();
      setAnalysis(r as AnalysisResult);
      speak(`${r.side} signal on ${r.symbol}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  };

  const startExecute = async (plan: ExecPlan) => {
    if (!broker) { toast.error("Link your MetaTrader account in the Metatrader tab first"); return; }
    setExec({ phase: "sending", plan, placed: 0 });
    speak(`Sending ${plan.trades} ${plan.side} orders on ${plan.symbol}`);

    type LiveResult = {
      ok: boolean;
      reason?: string | undefined;
      placed: { ticket: number | string; error?: string }[];
      filled: number;
      total: number;
    };
    const fail = (reason: string): LiveResult => ({ ok: false, reason, placed: [], filled: 0, total: plan.trades });

    const call = live({
      data: {
        broker: broker.broker,
        server: broker.server,
        login: broker.login,
        password: broker.password,
        platform: "mt5" as const,
        symbol: plan.symbol,
        side: plan.side,
        lot: plan.lot,
        trades: plan.trades,
        ...(Number(plan.sl) ? { sl: Number(plan.sl) } : {}),
        ...(Number(plan.tp) ? { tp: Number(plan.tp) } : {}),
      },
    }).then((v) => v as LiveResult).catch((e: unknown) => fail(e instanceof Error ? e.message : "Failed"));

    const timeout = new Promise<LiveResult>((res) =>
      setTimeout(() => res(fail("Execution timed out. Your account may still be connecting — try again shortly.")), 60000),
    );

    const r = await Promise.race([call, timeout]);

    if (!r.ok) {
      setExec({ phase: "idle" });
      toast.error(r.reason || "Live execution failed");
      speak("Order rejected by MetaTrader.");
      return;
    }
    const tickets: number[] = (r.placed ?? []).filter((p) => !p.error).map((p) => Number(p.ticket) || 0);


    try {
      const raw = localStorage.getItem(EXEC_TRADES_KEY);
      const prev = raw ? (JSON.parse(raw) as Trade[]) : [];
      const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      const rows: Trade[] = tickets.map((tk, idx) => ({
        id: tk, symbol: plan.symbol, side: plan.side,
        lot: plan.lot, price: 0, pnl: 0, at: now,
        ticket: tk, sl: plan.sl, tp: plan.tp, idx,
      }) as Trade);
      const merged = [...rows, ...prev].slice(0, 200);
      localStorage.setItem(EXEC_TRADES_KEY, JSON.stringify(merged));
      window.dispatchEvent(new CustomEvent("ea:exec-trades"));
    } catch {}
    setExec({ phase: "done", plan, tickets });
    speak(`${tickets.length} orders placed. Opening monitor.`);
  };


  return (
    <div className="flex h-full flex-col items-center px-4 pt-4 text-center">
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center gap-2">
          <ScanLine className="h-5 w-5" style={{ color: "var(--app-accent)" }} />
          <h1 className="text-xl font-bold">Scanner</h1>
        </div>
        <span className="rounded-full px-2.5 py-1 text-[11px] font-bold"
          style={{ backgroundColor: "color-mix(in oklab, var(--app-accent) 20%, transparent)", color: "var(--app-accent)" }}>
          {remaining}/{SCAN_LIMIT}
        </span>
      </div>

      {!analysis && !busy && (
        <div className="mt-6 flex flex-col items-center">
          <div className="relative grid h-40 w-40 place-items-center rounded-full"
            style={{ background: "radial-gradient(closest-side, color-mix(in oklab, var(--app-accent) 30%, transparent), transparent 70%)" }}>
            <div className="grid h-32 w-32 place-items-center overflow-hidden rounded-full ring-2"
              style={{ borderColor: "var(--app-accent)", boxShadow: "0 0 40px color-mix(in oklab, var(--app-accent) 60%, transparent)" }}>
              {session.ea_image
                ? <img src={session.ea_image} alt={session.ea_name} className="h-full w-full object-cover" />
                : <Bot className="h-12 w-12 text-white/70" />}
            </div>
          </div>
          <h2 className="mt-4 text-lg font-bold uppercase tracking-wider">{session.ea_name}</h2>
          <p className="mt-1 text-xs uppercase tracking-widest text-white/50">Ready to Scan</p>
          <p className="mt-2 max-w-[260px] text-[11px] text-white/40">Upload a chart. AI gives you a decisive BUY or SELL, then execute to your MT account.</p>
        </div>
      )}

      {busy && (
        <div className="mt-10 flex flex-col items-center gap-3">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-white/10 border-t-transparent" style={{ borderTopColor: "var(--app-accent)" }} />
          <p className="text-sm text-white/70">Building signal…</p>
        </div>
      )}

      {analysis && !busy && (
        <div className="mt-4 w-full max-w-sm rounded-2xl bg-black/40 p-4 ring-1 ring-white/10 text-left">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-widest text-white/50">Signal</p>
              <p className="mt-0.5 text-2xl font-black" style={{ color: analysis.side === "BUY" ? "#10b981" : "#ef4444" }}>
                {analysis.side} {analysis.symbol}
              </p>
            </div>
            <span className="rounded-full bg-white/10 px-2 py-1 text-[10px] font-bold">{analysis.confidence}%</span>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[10px]">
            <div className="rounded bg-white/5 p-1.5"><div className="text-white/40">Entry</div><div className="font-bold">{analysis.entry || "—"}</div></div>
            <div className="rounded bg-white/5 p-1.5"><div className="text-white/40">SL</div><div className="font-bold">{analysis.sl || "—"}</div></div>
            <div className="rounded bg-white/5 p-1.5"><div className="text-white/40">TP</div><div className="font-bold">{analysis.tp || "—"}</div></div>
          </div>
          {analysis.reason && <p className="mt-2 text-[11px] text-white/60">{analysis.reason}</p>}
          <ExecuteForm analysis={analysis} onExecute={startExecute} />
          <button onClick={() => setAnalysis(null)} className="mt-3 w-full rounded-lg bg-white/5 py-2 text-xs text-white/60">New scan</button>
        </div>
      )}

      <div className="mt-auto w-full max-w-sm pb-4">
        <input ref={galleryRef} type="file" accept="image/*" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) onPick(f); e.target.value = ""; }} />
        <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) onPick(f); e.target.value = ""; }} />
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => galleryRef.current?.click()} disabled={busy || remaining <= 0}
            className="flex items-center justify-center gap-2 rounded-2xl bg-white/10 py-3 text-sm font-semibold ring-1 ring-white/10 disabled:opacity-40">
            <ImageIcon className="h-4 w-4" /> Gallery
          </button>
          <button onClick={() => cameraRef.current?.click()} disabled={busy || remaining <= 0}
            className="flex items-center justify-center gap-2 rounded-2xl py-3 text-sm font-bold text-black disabled:opacity-40"
            style={{ backgroundColor: "var(--app-accent)" }}>
            <CameraIcon className="h-4 w-4" /> Camera
          </button>
        </div>
      </div>

      {exec.phase !== "idle" && (
        <ExecuteModal state={exec} broker={broker} onClose={() => setExec({ phase: "idle" })} />
      )}
    </div>
  );
}


function ExecuteForm({ analysis, onExecute }: { analysis: AnalysisResult; onExecute: (p: ExecPlan) => void }) {
  const [symbol, setSymbol] = useState(analysis.symbol && analysis.symbol !== "UNKNOWN" ? analysis.symbol : "XAUUSD");
  const [lot, setLot] = useState(0.01);
  const [trades, setTrades] = useState(1);
  const isBuy = analysis.side === "BUY";
  return (
    <div className="mt-3 rounded-xl bg-black/40 p-3 ring-1 ring-white/10">
      <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-white/50">Set your orders</p>
      <div className="grid grid-cols-3 gap-2">
        <label className="col-span-3">
          <span className="text-[10px] text-white/50">Symbol</span>
          <input value={symbol} onChange={(e) => setSymbol(e.target.value.toUpperCase())} maxLength={20}
            className="mt-1 w-full rounded-lg bg-white/5 px-2.5 py-2 text-sm font-bold outline-none focus:ring-1 focus:ring-white/30" />
        </label>
        <label>
          <span className="text-[10px] text-white/50">Lot size</span>
          <input type="number" min={0.01} step={0.01} value={lot}
            onChange={(e) => setLot(Math.max(0.01, parseFloat(e.target.value) || 0.01))}
            className="mt-1 w-full rounded-lg bg-white/5 px-2 py-2 text-sm font-bold outline-none focus:ring-1 focus:ring-white/30" />
        </label>
        <label className="col-span-2">
          <span className="text-[10px] text-white/50">Number of trades</span>
          <input type="number" min={1} max={50} value={trades}
            onChange={(e) => setTrades(Math.max(1, Math.min(50, parseInt(e.target.value) || 1)))}
            className="mt-1 w-full rounded-lg bg-white/5 px-2 py-2 text-sm font-bold outline-none focus:ring-1 focus:ring-white/30" />
        </label>
      </div>
      <button
        onClick={() => onExecute({ symbol, lot, trades, side: analysis.side as "BUY" | "SELL", entry: analysis.entry, sl: analysis.sl, tp: analysis.tp })}
        className={`mt-3 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold shadow-lg ${isBuy ? "bg-emerald-500 text-black shadow-emerald-500/40" : "bg-rose-500 text-white shadow-rose-500/40"}`}
      >
        {isBuy ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
        Execute {trades}× {analysis.side}
      </button>
    </div>
  );
}

function ExecuteModal({ state, broker, onClose }: { state: ExecState; broker: Broker | null; onClose: () => void }) {
  if (state.phase === "idle") return null;
  const plan = state.plan;
  const isBuy = plan.side === "BUY";
  const accent = isBuy ? "#22e39a" : "#ff5b6e";
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-5">
      <div
        className="w-full max-w-sm rounded-3xl bg-[#0a1518] p-5 text-center"
        style={{ boxShadow: `0 0 0 1.5px ${accent}55, 0 0 40px ${accent}55` }}
      >
        {state.phase === "sending" ? (
          <>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/60">Sending to MetaTrader</p>
            <div className="mt-2 flex items-center justify-center gap-2">
              {isBuy ? <TrendingUp className="h-7 w-7" style={{ color: accent }} /> : <TrendingDown className="h-7 w-7" style={{ color: accent }} />}
              <h2 className="text-4xl font-black tracking-wide" style={{ color: accent }}>{plan.side}</h2>
            </div>
            <p className="mt-1 text-sm font-bold">{plan.symbol} · {plan.trades}× {plan.lot} lot</p>
            <p className="text-[11px] text-white/50">via MetaTrader API · MT5</p>
            <div className="my-8 grid place-items-center">
              <div className="relative grid h-44 w-44 place-items-center rounded-2xl bg-black/50" style={{ boxShadow: `inset 0 0 30px ${accent}22` }}>
                <div className="absolute inset-4 animate-spin rounded-full border-[6px] border-transparent" style={{ borderTopColor: accent, borderRightColor: accent, animationDuration: "1.4s" }} />
                <div className="relative flex items-center gap-1.5 font-bold">
                  <Flame className="h-4 w-4" style={{ color: accent }} />
                  SENDING… {state.placed}/{plan.trades}
                </div>
              </div>
            </div>
            <button onClick={onClose} className="w-full rounded-xl bg-white/5 py-2.5 text-sm text-white/60">Cancel</button>
          </>
        ) : (
          <>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/60">Order Confirmed</p>
            <div className="mt-2 flex items-center justify-center gap-2">
              {isBuy ? <TrendingUp className="h-7 w-7" style={{ color: accent }} /> : <TrendingDown className="h-7 w-7" style={{ color: accent }} />}
              <h2 className="text-4xl font-black tracking-wide" style={{ color: accent }}>{plan.side}</h2>
            </div>
            <p className="mt-1 text-sm font-bold">{plan.symbol} · {plan.trades}× {plan.lot} lot</p>
            <p className="text-[11px] text-white/50">via MetaTrader API · MT5</p>
            <div className="my-6 grid place-items-center">
              <div className="grid h-28 w-28 place-items-center rounded-full" style={{ boxShadow: `0 0 0 6px ${accent}, 0 0 40px ${accent}88` }}>
                <svg viewBox="0 0 24 24" className="h-14 w-14" fill="none" stroke={accent} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12l5 5L20 7" />
                </svg>
              </div>
            </div>
            <p className="text-lg font-bold" style={{ color: accent }}>{state.tickets.length}/{plan.trades} orders placed</p>
            <p className="mt-2 break-words px-2 text-[11px] text-white/60">
              Tickets: {state.tickets.join(", ")}
            </p>
            <p className="mt-1 text-[11px] text-white/50">
              TP {plan.tp || "auto"} · SL {plan.sl || "auto"}{broker ? ` · ${broker.broker} #${broker.login}` : ""}
            </p>
            <button onClick={onClose} className="mt-5 w-full rounded-xl border py-2.5 text-sm font-bold" style={{ borderColor: `${accent}66`, color: accent }}>
              View in Monitor
            </button>
          </>
        )}
      </div>
    </div>
  );
}




const PRESET_COLORS = [
  "#22d3ee", "#3b82f6", "#8b5cf6", "#ec4899",
  "#ef4444", "#f97316", "#eab308", "#22c55e",
  "#10b981", "#14b8a6", "#0ea5e9", "#6366f1",
  "#a855f7", "#d946ef", "#f43f5e", "#facc15",
  "#84cc16", "#ffffff",
];

const INTERFACES: { id: HomeVariant; label: string; desc: string }[] = [
  { id: "v4", label: "Interface 1", desc: "3D core console" },
  { id: "v1", label: "Interface 2", desc: "Full-bleed poster" },
  { id: "v3", label: "Interface 3", desc: "Half-screen halo" },
  { id: "v2", label: "Interface 4", desc: "White-to-red poster" },
];

function InterfaceScreen({
  current, onPick, onBack, accent,
}: { current: HomeVariant; onPick: (v: HomeVariant) => void; onBack: () => void; accent: string }) {
  return (
    <div className="px-5 pt-4">
      <button onClick={onBack} className="mb-3 text-xs font-semibold text-white/60">← Settings</button>
      <h1 className="text-xl font-bold">Interface Style</h1>
      <p className="text-xs text-white/50">Choose how your Home screen looks.</p>
      <div className="mt-4 space-y-2">
        {INTERFACES.map((it) => {
          const active = current === it.id;
          return (
            <button
              key={it.id}
              onClick={() => { onPick(it.id); toast.success(`${it.label} applied`); }}
              className="flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition"
              style={{
                borderColor: active ? accent : "rgba(255,255,255,0.1)",
                backgroundColor: active ? "color-mix(in oklab, var(--app-accent) 12%, transparent)" : "rgba(255,255,255,0.04)",
              }}
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{it.label}</p>
                <p className="text-[11px] text-white/50">{it.desc}</p>
              </div>
              {active && (
                <span className="grid h-6 w-6 place-items-center rounded-full text-black" style={{ backgroundColor: accent }}>
                  <Check className="h-3.5 w-3.5" />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SettingsScreen({
  session, onLogout, accent, bgVideo, onBgVideo, style, onStyle,
}: {
  session: Session;
  onLogout: () => void;
  accent: string;
  bgVideo: string;
  onBgVideo: (url: string) => void;
  style: UIStyle;
  onStyle: (patch: Partial<UIStyle>) => void;
}) {
  const [showInterfaces, setShowInterfaces] = useState(false);


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

  if (showInterfaces) {
    return (
      <InterfaceScreen
        current={style.home}
        accent={accent}
        onPick={(v) => onStyle({ home: v })}
        onBack={() => setShowInterfaces(false)}
      />
    );
  }

  const currentInterface = INTERFACES.find((i) => i.id === style.home)?.label ?? "Interface 1";

  return (
    <div className="px-5 pt-4">
      <h1 className="text-xl font-bold">Settings</h1>

      <p className="mt-4 text-[11px] font-semibold uppercase tracking-wider text-white/40">Appearance</p>
      <button
        onClick={() => setShowInterfaces(true)}
        className="mt-2 flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-left"
      >
        <div className="flex items-center gap-2">
          <LayoutGrid className="h-4 w-4" style={{ color: accent }} />
          <span className="text-sm font-semibold">Interface</span>
        </div>
        <span className="text-xs text-white/50">{currentInterface} ›</span>
      </button>





      {/* App color — swipe left on Home to change */}
      <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
        <div className="mb-1 flex items-center gap-2">
          <Palette className="h-4 w-4" style={{ color: accent }} />
          <span className="text-sm font-semibold">App Color</span>
        </div>
        <p className="text-[11px] text-white/50">Swipe left on the Home screen to pick a color.</p>
      </div>

      {/* Background animation */}
      <BackgroundAnimationCard accent={accent} />




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
        <Row icon={<ShieldCheck className="h-4 w-4" />} label="Encryption" value="AES-256" />
      </div>



      <div className="mt-4 space-y-2 rounded-2xl border border-white/10 bg-white/[0.04] p-2">
        <Row label="User" value={session.username} />
        <Row label="Plan" value={session.plan.replace(/_/g, " ")} />
        <Row label="Expires" value={new Date(session.expires_at).toLocaleDateString()} />
      </div>

      <p className="mt-6 text-center text-[10px] tracking-[0.3em] text-white/30">POWERED BY: EA VAULT</p>
    </div>
  );
}

function BackgroundAnimationCard({ accent }: { accent: string }) {
  const [on, setOn] = useState(true);
  useEffect(() => {
    try { setOn(localStorage.getItem(ANIM_KEY) !== "off"); } catch {}
  }, []);
  const toggle = () => {
    const next = !on;
    setOn(next);
    try { localStorage.setItem(ANIM_KEY, next ? "on" : "off"); } catch {}
    window.dispatchEvent(new Event("ea:anim"));
  };
  return (
    <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">Background Animation</p>
          <p className="mt-0.5 text-[11px] text-white/50">Drifting glows, moving grid and light sweep.</p>
        </div>
        <button
          onClick={toggle}
          aria-label="Toggle background animation"
          className="relative h-7 w-12 shrink-0 rounded-full transition"
          style={{ backgroundColor: on ? accent : "rgba(255,255,255,0.15)" }}
        >
          <span
            className="absolute top-1 h-5 w-5 rounded-full bg-white transition-all"
            style={{ left: on ? 26 : 4 }}
          />
        </button>
      </div>
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
      <p className="mt-6 text-center text-[10px] tracking-[0.3em] text-white/30">POWERED BY: EA VAULT</p>
    </div>
  );
}







type TabId = "home" | "symbols" | "metatrader" | "scanner" | "settings" | "help";

function BottomNav({
  tab, setTab, style,
}: { tab: string; setTab: (t: TabId) => void; style: UIStyle }) {
  const items: { id: TabId; icon: typeof Home; label: string }[] = [
    { id: "home", icon: Home, label: "Home" },
    { id: "metatrader", icon: Database, label: "Metatrader" },
    { id: "scanner", icon: Target, label: "Scanner" },
    { id: "settings", icon: SettingsIcon, label: "Settings" },
  ];
  const v = style.nav;

  // Container styles per variant
  const wrapCommon = "absolute inset-x-0 bottom-0 z-20 pb-5 pt-2";
  if (v === "v5") {
    // Floating chips — no bar
    return (
      <nav className={`${wrapCommon} px-3`}>
        <div className="flex items-center justify-around gap-1">
          {items.map(({ id, icon: Icon, label }) => {
            const active = tab === id;
            return (
              <button key={id} onClick={() => setTab(id)}
                className="flex items-center gap-1.5 rounded-full px-3 py-2 text-[11px] font-semibold transition"
                style={active
                  ? { backgroundColor: "color-mix(in oklab, var(--app-accent) 25%, black)", color: "var(--app-accent)", boxShadow: `0 0 20px var(--app-accent)` }
                  : { backgroundColor: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.55)" }}>
                <Icon className="h-4 w-4" />
                {active && <span>{label}</span>}
              </button>
            );
          })}
        </div>
      </nav>
    );
  }

  if (v === "v2") {
    // Floating glow pill
    return (
      <nav className={`${wrapCommon} px-4`}>
        <div className="flex items-center justify-around rounded-full px-2 py-2"
          style={{ backgroundColor: "rgba(10,15,26,0.9)", boxShadow: `0 0 0 1px var(--app-accent), 0 0 25px -4px var(--app-accent)` }}>
          {items.map(({ id, icon: Icon, label }) => {
            const active = tab === id;
            return (
              <button key={id} onClick={() => setTab(id)}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-full py-2 text-[10px] font-semibold transition ${active ? "" : "text-white/50"}`}
                style={active ? { backgroundColor: "color-mix(in oklab, var(--app-accent) 20%, transparent)", color: "var(--app-accent)" } : undefined}>
                <Icon className="h-4 w-4" />
                {active && <span>{label}</span>}
              </button>
            );
          })}
        </div>
      </nav>
    );
  }

  if (v === "v3") {
    // Active pop dock
    return (
      <nav className={`${wrapCommon} border-t border-white/10 backdrop-blur`}
        style={{ backgroundColor: "color-mix(in oklab, var(--app-bg) 92%, black)" }}>
        <div className="flex items-end justify-around px-2">
          {items.map(({ id, icon: Icon, label }) => {
            const active = tab === id;
            return (
              <button key={id} onClick={() => setTab(id)}
                className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-semibold transition ${active ? "-translate-y-3" : "text-white/50"}`}
                style={active ? { color: "var(--app-accent)" } : undefined}>
                <span className="grid h-10 w-10 place-items-center rounded-full"
                  style={active ? { backgroundColor: "color-mix(in oklab, var(--app-accent) 20%, black)", boxShadow: `0 0 25px var(--app-accent)` } : undefined}>
                  <Icon className="h-5 w-5" />
                </span>
                {active && <span>{label}</span>}
              </button>
            );
          })}
        </div>
      </nav>
    );
  }

  if (v === "v4") {
    // Magnetic slide pill
    const idx = items.findIndex((i) => i.id === tab);
    return (
      <nav className={`${wrapCommon} border-t border-white/10 backdrop-blur`}
        style={{ backgroundColor: "color-mix(in oklab, var(--app-bg) 92%, black)" }}>
        <div className="relative mx-2 flex items-center">
          <div className="pointer-events-none absolute top-1 h-[calc(100%-8px)] rounded-full transition-all duration-300"
            style={{ width: `${100 / items.length}%`, left: `${(idx * 100) / items.length}%`, backgroundColor: "color-mix(in oklab, var(--app-accent) 25%, transparent)", boxShadow: `0 0 20px var(--app-accent)` }} />
          {items.map(({ id, icon: Icon, label }) => {
            const active = tab === id;
            return (
              <button key={id} onClick={() => setTab(id)}
                className={`relative z-10 flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-semibold transition ${active ? "" : "text-white/50"}`}
                style={active ? { color: "var(--app-accent)" } : undefined}>
                <Icon className="h-5 w-5" />
                {label}
              </button>
            );
          })}
        </div>
      </nav>
    );
  }

  if (v === "v6") {
    // Light beam edge
    return (
      <nav className={`${wrapCommon} border-t border-white/10 backdrop-blur`}
        style={{ backgroundColor: "color-mix(in oklab, var(--app-bg) 92%, black)" }}>
        <div className="flex items-center justify-around">
          {items.map(({ id, icon: Icon, label }) => {
            const active = tab === id;
            return (
              <button key={id} onClick={() => setTab(id)}
                className={`relative flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-semibold ${active ? "" : "text-white/50"}`}
                style={active ? { color: "var(--app-accent)" } : undefined}>
                {active && <span className="pointer-events-none absolute -top-3 left-1/2 h-8 w-6 -translate-x-1/2 rounded-full blur-md"
                  style={{ backgroundColor: "var(--app-accent)", opacity: 0.6 }} />}
                <Icon className="h-5 w-5" />
                {label}
                {active && <span className="absolute -bottom-0.5 h-0.5 w-8 rounded-full" style={{ backgroundColor: "var(--app-accent)" }} />}
              </button>
            );
          })}
        </div>
      </nav>
    );
  }

  if (v === "v7") {
    // Liquid glass dock (iOS-style)
    return (
      <nav className={`${wrapCommon} px-3`}>
        <div className="flex items-center justify-around rounded-3xl px-2 py-2 backdrop-blur-2xl"
          style={{ backgroundColor: "rgba(255,255,255,0.08)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.15)" }}>
          {items.map(({ id, icon: Icon, label }) => {
            const active = tab === id;
            return (
              <button key={id} onClick={() => setTab(id)}
                className={`flex flex-1 flex-col items-center gap-0.5 rounded-2xl py-2 text-[10px] font-semibold transition ${active ? "bg-white/20 text-white" : "text-white/50"}`}>
                <Icon className="h-5 w-5" />
                {label}
              </button>
            );
          })}
        </div>
      </nav>
    );
  }

  if (v === "v8") {
    // Minimal dot
    return (
      <nav className={`${wrapCommon}`}>
        <div className="flex items-center justify-around">
          {items.map(({ id, icon: Icon }) => {
            const active = tab === id;
            return (
              <button key={id} onClick={() => setTab(id)}
                className={`relative flex flex-1 items-center justify-center py-2 ${active ? "" : "text-white/40"}`}
                style={active ? { color: "var(--app-accent)" } : undefined}>
                <Icon className="h-5 w-5" />
                {active && <span className="absolute -bottom-0 h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: "var(--app-accent)", boxShadow: `0 0 10px var(--app-accent)` }} />}
              </button>
            );
          })}
        </div>
      </nav>
    );
  }

  // V1 — Classic bar (default)
  return (
    <nav className={`${wrapCommon} border-t border-white/10 backdrop-blur`} style={{ backgroundColor: "color-mix(in oklab, var(--app-bg) 92%, black)" }}>
      <div className="flex items-center justify-around">
        {items.map(({ id, icon: Icon, label }) => {
          const active = tab === id;
          return (
            <button key={id} onClick={() => setTab(id)}
              className={`flex flex-1 flex-col items-center gap-0.5 py-1.5 text-[10px] font-semibold transition ${active ? "" : "text-white/50"}`}
              style={active ? { color: "var(--app-accent)" } : undefined}>
              <Icon className="h-5 w-5" />
              {label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

// ===== Additional Home variants =====
function HomeV5({ session, running, toggle, handleDelete, onOpenBubble }: HomeVProps) {
  return (
    <div className="relative flex flex-col items-center px-5 pt-6 pb-10 text-center">
      <div className="pointer-events-none absolute inset-0 opacity-30" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
      <div className="relative mt-4">
        <button onClick={onOpenBubble} className="relative h-40 w-40 overflow-hidden rounded-3xl ring-2 active:scale-[0.98]"
          style={{ borderColor: "var(--app-accent)", boxShadow: `0 0 60px var(--app-accent), inset 0 0 30px var(--app-accent)` }}>
          {session.ea_image ? <img src={session.ea_image} className="h-full w-full object-cover" alt="" />
            : <div className="grid h-full w-full place-items-center bg-black"><Bot className="h-16 w-16 text-white" /></div>}
        </button>
      </div>
      <div className="relative mt-4"><LiveBadge running={running} /></div>
      <h1 className="relative mt-4 text-2xl font-black uppercase tracking-widest" style={{ textShadow: `0 0 15px var(--app-accent)` }}>{session.ea_name}</h1>
      <p className="relative mt-1 text-[10px] uppercase tracking-[0.3em] text-white/40">Neon Grid</p>
      <div className="relative"><ActionBar running={running} toggle={toggle} handleDelete={handleDelete} onOpenBubble={onOpenBubble} /></div>
    </div>
  );
}

function HomeV6({ session, running, toggle, handleDelete, onOpenBubble }: HomeVProps) {
  return (
    <div className="relative flex flex-col items-center px-5 pt-8 pb-10">
      <div className="w-full max-w-[340px] overflow-hidden rounded-[32px] p-[2px]"
        style={{ background: `linear-gradient(135deg, var(--app-accent), color-mix(in oklab, var(--app-accent) 20%, black))` }}>
        <div className="rounded-[30px] bg-black/70 p-6 text-center backdrop-blur-xl">
          <button onClick={onOpenBubble} className="mx-auto block h-32 w-32 overflow-hidden rounded-2xl ring-2 active:scale-[0.98]"
            style={{ borderColor: "var(--app-accent)" }}>
            {session.ea_image ? <img src={session.ea_image} className="h-full w-full object-cover" alt="" />
              : <div className="grid h-full w-full place-items-center bg-white/5"><Bot className="h-14 w-14 text-white" /></div>}
          </button>
          <h1 className="mt-4 text-xl font-black uppercase">{session.ea_name}</h1>
          <div className="mt-2"><LiveBadge running={running} /></div>
          <p className="mt-2 text-[10px] uppercase tracking-[0.3em] text-white/40">Gradient Card</p>
        </div>
      </div>
      <ActionBar running={running} toggle={toggle} handleDelete={handleDelete} onOpenBubble={onOpenBubble} />
    </div>
  );
}

function AddLicenceButton({ onLogin }: { onLogin: (s: Session) => void }) {
  const validate = useServerFn(validateLicense);
  const [open, setOpen] = useState(false);
  const [key, setKey] = useState("");
  const [loading, setLoading] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!key.trim()) return;
    if (isDeletedKey(key)) { toast.error("This licence was deleted on this device and can't be used again."); return; }

    setLoading(true);
    try {
      const r = await validate({ data: { key } });
      if (!r.ok) { toast.error(r.reason); return; }
      onLogin({
        key: key.toUpperCase(),
        username: r.username, ea_name: r.ea_name, symbols: r.symbols,
        expires_at: r.expires_at, plan: r.plan, ea_image: r.ea_image,
      });
      toast.success("New licence activated");
      setOpen(false); setKey("");
    } catch (err) { toast.error(err instanceof Error ? err.message : "Failed"); }
    finally { setLoading(false); }
  };
  return (
    <>
      <button onClick={() => setOpen(true)}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed py-3 text-sm font-bold active:scale-[0.98]"
        style={{ borderColor: "var(--app-accent)", color: "var(--app-accent)" }}>
        <Plus className="h-4 w-4" /> ADD NEW LICENCE KEY
      </button>
      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-5">
          <div className="w-full max-w-sm rounded-2xl bg-[#0b1224] p-5 ring-1 ring-white/10">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-bold">Enter Licence Key</h2>
              <button onClick={() => setOpen(false)} className="rounded-md p-1 text-white/60 hover:bg-white/10"><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={submit} className="space-y-3">
              <div className="relative">
                <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                <input value={key} onChange={(e) => setKey(e.target.value.toUpperCase())}
                  placeholder="APRO-XXXX-XXXX-XXXX-XXXX"
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-3 text-center font-mono text-sm tracking-wider text-white placeholder:text-white/30 outline-none focus:border-[var(--app-accent)]"
                  maxLength={30} autoCapitalize="characters" autoComplete="off" autoFocus />
              </div>
              <button type="submit" disabled={loading}
                className="w-full rounded-xl py-3 text-sm font-semibold text-black disabled:opacity-60"
                style={{ backgroundColor: "var(--app-accent)" }}>
                {loading ? "Validating..." : "Activate"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

// ===== Paywall / device screens =====
function BankRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-white/5 pb-2 last:border-0 last:pb-0">
      <span className="text-white/50">{label}</span>
      <span className="text-right font-semibold">{value}</span>
    </div>
  );
}

function AccessDeniedScreen({ onSignOut }: { onSignOut: () => void }) {
  return (
    <div className="flex h-full flex-col items-center px-6 pt-10 pb-8 text-center">
      <div className="grid h-20 w-20 place-items-center rounded-2xl bg-red-500/20 ring-2 ring-red-500/50">
        <AlertTriangle className="h-10 w-10 text-red-400" />
      </div>
      <h1 className="mt-5 text-2xl font-black text-red-400">ACCESS DENIED</h1>
      <p className="mt-2 max-w-xs text-sm text-white/70">
        You haven't paid for app access yet. Please pay <span className="font-bold text-white">$10</span> to the account below and message the admin to activate your email.
      </p>
      <div className="mt-6 w-full max-w-sm rounded-2xl border border-white/10 bg-black/40 p-5 text-left">
        <p className="text-center text-[11px] uppercase tracking-[0.3em] text-white/40">Banking Details</p>
        <div className="mt-4 space-y-3 text-sm">
          <BankRow label="Bank name" value="Standard Bank" />
          <BankRow label="Account holder" value="MRS ZANDILE Z MOFOKENG" />
          <BankRow label="Account number" value="10 23 913 954 0" />
          <BankRow label="Account type" value="CURRENT" />
        </div>
      </div>
      <button onClick={onSignOut} className="mt-6 text-xs text-white/40 underline">Use a different email</button>
    </div>
  );
}

function OtherDeviceScreen({ email, onSignOut }: { email: string; onSignOut: () => void }) {
  const reactivate = useServerFn(reactivateAppByEmail);
  const [val, setVal] = useState(email);
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!val.trim()) return;
    setBusy(true);
    try {
      const r = await reactivate({ data: { email: val.trim() } });
      if (!r.ok) { toast.error(r.reason); return; }
      try { localStorage.removeItem(DEVICE_KEY); } catch {}
      toast.success("Reactivated. Reopening…");
      setTimeout(() => window.location.reload(), 700);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally { setBusy(false); }
  };
  return (
    <div className="flex h-full flex-col items-center px-6 pt-10 pb-8 text-center">
      <div className="grid h-20 w-20 place-items-center rounded-2xl bg-amber-500/20 ring-2 ring-amber-500/50">
        <AlertTriangle className="h-10 w-10 text-amber-400" />
      </div>
      <h1 className="mt-5 text-2xl font-black text-amber-400">ACCOUNT ALREADY USED</h1>
      <p className="mt-2 max-w-xs text-sm text-white/70">
        The email <span className="font-semibold text-white">{email}</span> is active on another device. Enter the paid email below to reactivate on this phone.
      </p>
      <form onSubmit={submit} className="mt-6 w-full max-w-sm space-y-3">
        <input
          value={val} onChange={(e) => setVal(e.target.value)} type="email" required
          placeholder="paid@email.com"
          className="w-full rounded-xl border border-white/10 bg-white/5 py-3 px-4 text-sm text-white placeholder:text-white/30 outline-none focus:border-amber-400"
        />
        <button type="submit" disabled={busy}
          className="w-full rounded-xl bg-amber-500 py-3 text-sm font-bold text-black shadow-lg shadow-amber-500/30 disabled:opacity-60">
          {busy ? "Reactivating…" : "Reactivate on this device"}
        </button>
      </form>
      <p className="mt-3 max-w-xs text-[11px] text-white/40">
        Only the email that paid for app access can reactivate. Nobody else can steal your account.
      </p>
      <button onClick={onSignOut} className="mt-6 text-xs text-white/40 underline">Use a different email</button>
    </div>
  );
}

const ACCENT_PRESETS = [
  "#10b981", "#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#ef4444",
  "#06b6d4", "#84cc16", "#f97316", "#a855f7", "#14b8a6", "#eab308",
];

function ColorsDrawer({ accent, onAccent, onClose }: { accent: string; onAccent: (c: string) => void; onClose: () => void }) {
  return (
    <div className="absolute inset-0 z-50 flex" onClick={onClose}>
      <div className="flex-1 bg-black/60 backdrop-blur-sm" />
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-64 border-l border-white/10 bg-[#0b0f1a] p-5"
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4" style={{ color: "var(--app-accent)" }} />
            <h3 className="text-sm font-bold uppercase tracking-wider">Theme color</h3>
          </div>
          <button onClick={onClose} className="rounded-full bg-white/10 p-1"><X className="h-3 w-3" /></button>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {ACCENT_PRESETS.map((c) => (
            <button
              key={c}
              onClick={() => { onAccent(c); onClose(); }}
              className={`h-12 w-12 rounded-full ring-2 transition ${accent === c ? "ring-white scale-110" : "ring-white/10"}`}
              style={{ backgroundColor: c, boxShadow: `0 0 20px ${c}80` }}
            />
          ))}
        </div>
        <label className="mt-5 block text-[11px] uppercase tracking-wider text-white/50">Custom</label>
        <input
          type="color"
          value={accent}
          onChange={(e) => onAccent(e.target.value)}
          className="mt-1 h-10 w-full cursor-pointer rounded-lg border border-white/10 bg-transparent"
        />
      </div>
    </div>
  );
}

