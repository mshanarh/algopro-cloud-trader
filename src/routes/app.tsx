import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef, useMemo } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  Bot, Play, Square, KeyRound, Home, Settings as SettingsIcon,
  HelpCircle, Wifi, Battery, Signal, Flame,
  TrendingUp, TrendingDown, LogOut, ShieldCheck,
  LineChart, Database, Target, Trash2, BarChart3, Plus, Palette, Film, X,
  Upload, Send, ScanLine, ArrowLeft, FileText,
} from "lucide-react";
import { validateLicense, validateMentor } from "@/lib/portal.functions";
import { analyzeChart } from "@/lib/scanner.functions";

export const Route = createFileRoute("/app")({
  component: PhoneApp,
  head: () => ({
    meta: [{ title: "Algopro EA — Mobile" }],
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

type Pair = { symbol: string; lot: number; trades: number };
type UIStyle = { home: "classic" | "minimal" | "neon"; nav: "icons" | "labels" | "pill"; trading: "scalping" | "day" | "swing" };
const DEFAULT_STYLE: UIStyle = { home: "classic", nav: "icons", trading: "day" };

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
      <div className="relative h-full w-full overflow-hidden sm:rounded-[2.4rem]" style={{ backgroundColor: "var(--app-bg)" }}>
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
  const [style, setStyle] = useState<UIStyle>(DEFAULT_STYLE);
  const [pairs, setPairs] = useState<Pair[]>([]);

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

  const updateStyle = (s: Partial<UIStyle>) => {
    setStyle((prev) => {
      const next = { ...prev, ...s };
      localStorage.setItem(STYLE_KEY, JSON.stringify(next));
      return next;
    });
  };
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

  const bgTint = useMemo(
    () => `color-mix(in oklab, ${accent} 14%, #06080f)`,
    [accent],
  );

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
          src={bgVideo}
          autoPlay
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
        {mentor && !session && <LicenseGate mentor={mentor} onSuccess={onLogin} onSignOut={onSignOutAll} />}
        {mentor && session && tab === "home" && <HomeScreen session={session} onDelete={onLogout} style={style} pairs={pairs} />}
        {mentor && session && tab === "symbols" && <SymbolsScreen session={session} pairs={pairs} setPairs={updatePairs} />}
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
            style={style}
            onStyle={updateStyle}
          />
        )}
        {mentor && session && tab === "help" && <HelpScreen />}
      </div>
      {mentor && session && <BottomNav tab={tab} setTab={setTab} style={style} />}
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
      <h1 className="text-2xl font-bold">Algopro EA</h1>
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

function HomeScreen({ session, onDelete, style, pairs }: { session: Session; onDelete: () => void; style: UIStyle; pairs: Pair[] }) {
  const [running, setRunning] = useState(false);
  const [bubbleOpen, setBubbleOpen] = useState(false);

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

  const isMinimal = style.home === "minimal";
  const isNeon = style.home === "neon";
  const portraitSize = isMinimal ? "h-40 w-40" : "h-56 w-56";

  return (
    <div className="relative flex flex-col items-center px-5 pt-6 pb-10 text-center">
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: `radial-gradient(circle at 50% 25%, color-mix(in oklab, var(--app-accent) ${isNeon ? 45 : 25}%, transparent), transparent 55%)` }}
      />

      <div className="relative mt-2">
        <div className={`absolute -inset-3 rounded-full ${isNeon ? "blur-3xl" : "blur-2xl"}`} style={{ background: `color-mix(in oklab, var(--app-accent) ${isNeon ? 55 : 30}%, transparent)` }} />
        <button
          type="button"
          onClick={() => setBubbleOpen(true)}
          className={`relative ${portraitSize} overflow-hidden rounded-full ring-2 active:scale-[0.98] transition`}
          style={{
            borderColor: "var(--app-accent)",
            boxShadow: `0 0 ${isNeon ? 90 : 60}px -10px var(--app-accent)`,
          }}
        >
          {session.ea_image ? (
            <img src={session.ea_image} alt={session.ea_name} className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full w-full place-items-center bg-gradient-to-br from-cyan-500/30 to-blue-700/30">
              <Bot className="h-20 w-20 text-cyan-300" />
            </div>
          )}
        </button>
        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold ${running ? "bg-black text-white ring-1 ring-emerald-400/40" : "bg-black text-white/60 ring-1 ring-white/10"}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${running ? "bg-emerald-400 animate-pulse" : "bg-white/30"}`} />
            {running ? "LIVE" : "IDLE"}
          </span>
        </div>
      </div>

      {!isMinimal && <p className="mt-10 text-[11px] tracking-[0.25em] text-white/50">YOU'RE TRADING WITH</p>}
      <h1 className={`${isMinimal ? "mt-6 text-2xl" : "mt-1 text-3xl"} font-extrabold uppercase tracking-tight leading-tight`}>
        {session.ea_name}
      </h1>

      {!isMinimal && (
        <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-black/70 px-4 py-1.5 ring-1 ring-white/10">
          <Flame className="h-3.5 w-3.5 text-orange-400" />
          <span className="text-[11px] text-white/60">Powered by:</span>
          <span className="text-[11px] font-bold tracking-wider">ALGOPRO</span>
        </div>
      )}

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
        <PillBtn icon={<BarChart3 className="h-5 w-5" />} label="SYMBOLS" onClick={() => setBubbleOpen(true)} />
      </div>
      <p className="mt-2 text-[10px] uppercase tracking-[0.3em] text-white/30">
        {running ? "STOP" : "START"}
      </p>

      <p className="mt-6 text-[10px] tracking-[0.35em] text-white/30">
        POWERED BY: ALGOPRO
      </p>

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
              Powered by <span className="font-extrabold">ALGOPRO</span>
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

function TradeLogs({ running, symbols }: { running: boolean; symbols: string[] }) {
  const [logs, setLogs] = useState<Trade[]>([]);
  const idRef = useRef(1);
  useEffect(() => {
    if (!running) return;
    const pool = symbols.length ? symbols : ["EURUSD", "XAUUSD"];
    const t = setInterval(() => {
      const sym = pool[Math.floor(Math.random() * pool.length)];
      const side: "BUY" | "SELL" = Math.random() > 0.5 ? "BUY" : "SELL";
      setLogs((p) => [{
        id: idRef.current++, symbol: sym, side,
        lot: +(Math.random() * 0.5 + 0.01).toFixed(2),
        price: +(1 + Math.random() * 2000).toFixed(2),
        pnl: +(Math.random() * 80 - 30).toFixed(2),
        at: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      }, ...p].slice(0, 15));
    }, 2200);
    return () => clearInterval(t);
  }, [running, symbols]);

  return (
    <div className="relative mt-6 w-full max-w-[340px] rounded-2xl border border-white/10 bg-black/40 p-3 text-left">
      <div className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-wider text-white/60">
        <FileText className="h-3.5 w-3.5" style={{ color: "var(--app-accent)" }} />
        Trade logs
        {running && <span className="ml-auto inline-flex items-center gap-1 text-emerald-300">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" /> live
        </span>}
      </div>
      <div className="max-h-44 space-y-1.5 overflow-y-auto pr-1">
        {!running && <p className="py-3 text-center text-[11px] text-white/40">Bot is stopped</p>}
        {running && logs.length === 0 && <p className="py-3 text-center text-[11px] text-white/40">Waiting for trades…</p>}
        {logs.map((t) => (
          <div key={t.id} className="flex items-center gap-2 rounded-lg bg-white/[0.04] px-2 py-1.5 text-[11px]">
            {t.side === "BUY"
              ? <TrendingUp className="h-3.5 w-3.5 text-emerald-300" />
              : <TrendingDown className="h-3.5 w-3.5 text-rose-300" />}
            <span className="font-semibold">{t.symbol}</span>
            <span className="text-white/50">{t.side} {t.lot}</span>
            <span className="ml-auto font-mono tabular-nums">
              <span className={t.pnl >= 0 ? "text-emerald-300" : "text-rose-300"}>
                {t.pnl >= 0 ? "+" : ""}{t.pnl.toFixed(2)}
              </span>
              <span className="ml-2 text-white/40">{t.at}</span>
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

function ScannerScreen({ session: _session }: { session: Session }) {
  const analyze = useServerFn(analyzeChart);
  const [msgs, setMsgs] = useState<ChatMsg[]>([
    { id: 0, role: "bot", text: "Upload a chart screenshot and I'll tell you BUY or SELL." },
  ]);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const idRef = useRef(1);
  const broker = useMemo<Broker | null>(() => {
    try { const r = localStorage.getItem(BROKER_KEY); return r ? JSON.parse(r) : null; } catch { return null; }
  }, []);

  const onPick = async (f: File) => {
    if (!f.type.startsWith("image/")) { toast.error("Pick an image"); return; }
    if (f.size > 10 * 1024 * 1024) { toast.error("Max 10MB"); return; }
    const dataUrl: string = await new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(String(r.result || ""));
      r.onerror = () => rej(new Error("read"));
      r.readAsDataURL(f);
    });
    const userMsg: ChatMsg = { id: idRef.current++, role: "user", image: dataUrl, note };
    setMsgs((m) => [...m, userMsg]);
    setNote("");
    setBusy(true);
    try {
      const r = await analyze({ data: { image: dataUrl, note } });
      if (!r.ok) {
        setMsgs((m) => [...m, { id: idRef.current++, role: "bot", text: `Could not analyze: ${r.reason}` }]);
        return;
      }
      const a: AnalysisResult = r;
      setMsgs((m) => [...m, {
        id: idRef.current++, role: "bot",
        text: `${a.side} ${a.symbol} • ${a.confidence}% confidence`,
        analysis: a,
      }]);
    } catch (e) {
      setMsgs((m) => [...m, { id: idRef.current++, role: "bot", text: e instanceof Error ? e.message : "Failed" }]);
    } finally {
      setBusy(false);
    }
  };

  const execute = (a: AnalysisResult) => {
    if (!broker) {
      toast.error("Link your MetaTrader account first");
      return;
    }
    if (!confirm(`Execute ${a.side} on ${a.symbol} via ${broker.broker} (account ${broker.login})?`)) return;
    toast.success(`Sent ${a.side} ${a.symbol} to MT`);
    setMsgs((m) => [...m, {
      id: idRef.current++, role: "bot",
      text: `✅ Trade sent: ${a.side} ${a.symbol} on ${broker.broker} #${broker.login}`,
    }]);
  };

  return (
    <div className="flex h-full flex-col px-4 pt-4">
      <div className="flex items-center gap-2">
        <ScanLine className="h-5 w-5" style={{ color: "var(--app-accent)" }} />
        <h1 className="text-xl font-bold">Chart Scanner</h1>
      </div>
      <p className="text-xs text-white/50">Send a screenshot, get BUY / SELL, execute to MT</p>

      <div className="mt-3 flex-1 space-y-3 overflow-y-auto pb-4">
        {msgs.map((m) => m.role === "user" ? (
          <div key={m.id} className="ml-auto max-w-[80%] rounded-2xl rounded-tr-sm bg-white/10 p-2 text-right">
            <img src={m.image} alt="chart" className="rounded-lg" />
            {m.note && <p className="mt-1 text-[11px] text-white/60">{m.note}</p>}
          </div>
        ) : (
          <div key={m.id} className="mr-auto max-w-[85%] rounded-2xl rounded-tl-sm bg-black/40 p-3 ring-1 ring-white/10">
            <p className="text-sm font-medium">{m.text}</p>
            {m.analysis && m.analysis.side !== "NEUTRAL" && (
              <>
                <div className="mt-2 grid grid-cols-3 gap-2 text-center text-[10px]">
                  <div className="rounded bg-white/5 p-1.5"><div className="text-white/40">Entry</div><div className="font-bold">{m.analysis.entry || "—"}</div></div>
                  <div className="rounded bg-white/5 p-1.5"><div className="text-white/40">SL</div><div className="font-bold">{m.analysis.sl || "—"}</div></div>
                  <div className="rounded bg-white/5 p-1.5"><div className="text-white/40">TP</div><div className="font-bold">{m.analysis.tp || "—"}</div></div>
                </div>
                {m.analysis.reason && <p className="mt-2 text-[11px] text-white/60">{m.analysis.reason}</p>}
                <button
                  onClick={() => execute(m.analysis!)}
                  className={`mt-2 w-full rounded-lg py-2 text-xs font-bold ${m.analysis.side === "BUY" ? "bg-emerald-500 text-black" : "bg-rose-500 text-white"}`}
                >
                  Execute {m.analysis.side} on MT
                </button>
              </>
            )}
          </div>
        ))}
        {busy && <p className="text-center text-xs text-white/40">Analyzing chart…</p>}
      </div>

      <div className="sticky bottom-0 mb-2 flex items-center gap-2 rounded-2xl bg-black/60 p-2 ring-1 ring-white/10">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) onPick(f); e.target.value = ""; }}
        />
        <button
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          className="grid h-9 w-9 place-items-center rounded-xl text-black disabled:opacity-50"
          style={{ backgroundColor: "var(--app-accent)" }}
        >
          <Upload className="h-4 w-4" />
        </button>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Optional note (timeframe, pair…)"
          maxLength={200}
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-white/30"
        />
        <button
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          className="grid h-9 w-9 place-items-center rounded-xl bg-white/10 disabled:opacity-50"
          title="Send screenshot"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}


const PRESET_COLORS = [
  "#22d3ee", "#3b82f6", "#8b5cf6", "#ec4899",
  "#ef4444", "#f97316", "#eab308", "#22c55e",
];

function SettingsScreen({
  session, onLogout, accent, onAccent, bgVideo, onBgVideo, style, onStyle,
}: {
  session: Session;
  onLogout: () => void;
  accent: string;
  onAccent: (c: string) => void;
  bgVideo: string;
  onBgVideo: (url: string) => void;
  style: UIStyle;
  onStyle: (s: Partial<UIStyle>) => void;
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

      {/* Interface style */}
      <div className="mt-4 space-y-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
        <div className="flex items-center gap-2">
          <SettingsIcon className="h-4 w-4" style={{ color: accent }} />
          <span className="text-sm font-semibold">Interface style</span>
        </div>
        <StyleRow
          label="Home"
          value={style.home}
          onChange={(v) => onStyle({ home: v as UIStyle["home"] })}
          options={[{ v: "classic", l: "Classic" }, { v: "minimal", l: "Minimal" }, { v: "neon", l: "Neon" }]}
        />
        <StyleRow
          label="Bottom navigation"
          value={style.nav}
          onChange={(v) => onStyle({ nav: v as UIStyle["nav"] })}
          options={[{ v: "icons", l: "Icons" }, { v: "labels", l: "Labels" }, { v: "pill", l: "Pill" }]}
        />
        <StyleRow
          label="Trading style"
          value={style.trading}
          onChange={(v) => onStyle({ trading: v as UIStyle["trading"] })}
          options={[{ v: "scalping", l: "Scalping" }, { v: "day", l: "Day" }, { v: "swing", l: "Swing" }]}
        />
      </div>


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
        <Row icon={<ShieldCheck className="h-4 w-4" />} label="Encryption" value="AES-256" />
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

function StyleRow({ label, value, options, onChange }: { label: string; value: string; options: { v: string; l: string }[]; onChange: (v: string) => void }) {
  return (
    <div>
      <p className="mb-1.5 text-[11px] uppercase tracking-wider text-white/50">{label}</p>
      <div className="grid grid-cols-3 gap-1.5 rounded-xl bg-white/[0.04] p-1">
        {options.map((o) => (
          <button
            key={o.v}
            type="button"
            onClick={() => onChange(o.v)}
            className={`rounded-lg px-2 py-2 text-xs font-semibold transition ${value === o.v ? "bg-[var(--app-accent)] text-black" : "text-white/60"}`}
          >
            {o.l}
          </button>
        ))}
      </div>
    </div>
  );
}

type TabId = "home" | "symbols" | "metatrader" | "scanner" | "settings" | "help";

function BottomNav({
  tab, setTab, style,
}: { tab: string; setTab: (t: TabId) => void; style: UIStyle }) {
  const items: { id: TabId; icon: typeof Home; label: string }[] = [
    { id: "home", icon: Home, label: "Home" },
    { id: "symbols", icon: LineChart, label: "Symbols" },
    { id: "metatrader", icon: Database, label: "MetaTrader" },
    { id: "scanner", icon: Target, label: "Scanner" },
    { id: "settings", icon: SettingsIcon, label: "Settings" },
    { id: "help", icon: HelpCircle, label: "Help" },
  ];
  const showLabels = style.nav !== "icons";
  const isPill = style.nav === "pill";
  return (
    <nav className="absolute inset-x-0 bottom-0 z-20 border-t border-white/10 px-1 pb-5 pt-2 backdrop-blur" style={{ backgroundColor: "color-mix(in oklab, var(--app-bg) 92%, black)" }}>
      <div className={`flex items-center justify-around ${isPill ? "mx-2 rounded-full bg-white/[0.06] px-1 py-1" : ""}`}>
        {items.map(({ id, icon: Icon, label }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex flex-1 flex-col items-center gap-0.5 rounded-xl py-1.5 text-[9px] transition ${active ? "" : "text-white/50"} ${isPill && active ? "bg-[var(--app-accent)] text-black" : ""}`}
              style={active && !isPill ? { color: "var(--app-accent)" } : undefined}
            >
              <Icon className="h-5 w-5" />
              {showLabels && label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
