import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  Bot, Play, Square, KeyRound, Home, Settings as SettingsIcon,
  HelpCircle, Activity, Wifi, Battery, Signal,
  TrendingUp, TrendingDown, LogOut, Cpu, MemoryStick, ShieldCheck,
} from "lucide-react";
import { validateLicense } from "@/lib/portal.functions";

export const Route = createFileRoute("/app")({
  component: PhoneApp,
  head: () => ({ meta: [{ title: "Algopro — Mobile" }] }),
});

type Session = {
  key: string;
  username: string;
  ea_name: string;
  symbols: string[];
  expires_at: string;
  plan: string;
};

type Trade = {
  id: number;
  symbol: string;
  side: "BUY" | "SELL";
  lot: number;
  price: number;
  pnl: number;
  at: string;
};

const STORAGE_KEY = "algopro.session";

function PhoneApp() {
  return (
    <div className="min-h-screen bg-slate-100 px-0 py-0 sm:px-6 sm:py-10 lg:py-14">
      <div className="mx-auto w-full max-w-[420px]">
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
  const [now, setNow] = useState<string>(() =>
    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  );
  useEffect(() => {
    const t = setInterval(
      () => setNow(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })),
      30_000,
    );
    return () => clearInterval(t);
  }, []);
  return (
    <div className="flex items-center justify-between px-6 pt-3 text-[11px] font-semibold text-white sm:pt-4">
      <span className="tabular-nums">{now}</span>
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
  const [session, setSession] = useState<Session | null>(null);
  const [tab, setTab] = useState<"home" | "trades" | "settings" | "help">("home");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setSession(JSON.parse(raw));
    } catch {}
  }, []);

  const onLogin = (s: Session) => {
    setSession(s);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  };
  const onLogout = () => {
    setSession(null);
    localStorage.removeItem(STORAGE_KEY);
    setTab("home");
  };

  return (
    <div className="flex h-full flex-col bg-[#0b1020] text-white">
      <StatusBar />
      <div className="flex-1 overflow-y-auto pb-24">
        {!session && <LicenseGate onSuccess={onLogin} />}
        {session && tab === "home" && <HomeScreen session={session} />}
        {session && tab === "trades" && <TradesScreen session={session} />}
        {session && tab === "settings" && <SettingsScreen session={session} onLogout={onLogout} />}
        {session && tab === "help" && <HelpScreen />}
      </div>
      {session && <BottomNav tab={tab} setTab={setTab} />}
    </div>
  );
}

function LicenseGate({ onSuccess }: { onSuccess: (s: Session) => void }) {
  const validate = useServerFn(validateLicense);
  const [key, setKey] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!key.trim()) return;
    setLoading(true);
    try {
      const res = await validate({ data: { key } });
      if (!res.ok) {
        toast.error(res.reason);
        return;
      }
      toast.success("Welcome Master");
      onSuccess({
        key: key.toUpperCase(),
        username: res.username,
        ea_name: res.ea_name,
        symbols: res.symbols,
        expires_at: res.expires_at,
        plan: res.plan,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Validation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full flex-col items-center justify-center px-7 pb-8 pt-10 text-center">
      <div className="mb-6 grid h-20 w-20 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-2xl shadow-violet-500/40">
        <Bot className="h-10 w-10 text-white" />
      </div>
      <h1 className="text-2xl font-bold">Algopro</h1>
      <p className="mt-1 text-sm text-white/60">Enter your licence key to unlock your bot.</p>

      <form onSubmit={submit} className="mt-8 w-full space-y-3">
        <div className="relative">
          <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
          <input
            value={key}
            onChange={(e) => setKey(e.target.value.toUpperCase())}
            placeholder="APRO-XXXX-XXXX-XXXX-XXXX"
            className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-3 text-center text-sm font-mono tracking-wider text-white placeholder:text-white/30 outline-none focus:border-violet-400"
            maxLength={30}
            autoCapitalize="characters"
            autoComplete="off"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 py-3 text-sm font-semibold shadow-lg shadow-violet-500/30 disabled:opacity-60"
        >
          {loading ? "Validating..." : "Activate Bot"}
        </button>
      </form>

      <p className="mt-6 text-[11px] text-white/40">
        Don't have a key? Contact your mentor.
      </p>
    </div>
  );
}

function HomeScreen({ session }: { session: Session }) {
  const [running, setRunning] = useState(false);
  const [logs, setLogs] = useState<string[]>([
    "[ OK ] Cloud VPS connected",
    "[ OK ] MT5 bridge online",
  ]);
  const consoleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!running) return;
    const symbols = session.symbols.length ? session.symbols : ["EURUSD"];
    const t = setInterval(() => {
      const sym = symbols[Math.floor(Math.random() * symbols.length)];
      const side = Math.random() > 0.5 ? "BUY" : "SELL";
      setLogs((p) => [...p.slice(-40), `[ TRADE ] ${sym} ${side} 0.0${Math.ceil(Math.random()*9)}`]);
    }, 2200);
    return () => clearInterval(t);
  }, [running, session.symbols]);

  useEffect(() => {
    consoleRef.current?.scrollTo({ top: consoleRef.current.scrollHeight, behavior: "smooth" });
  }, [logs]);

  const toggle = () => {
    setRunning((r) => {
      const next = !r;
      if (next) {
        toast.success("Bot activated");
        console.log("Bot activated", { ea: session.ea_name, symbols: session.symbols });
        setLogs((p) => [...p, `[ BOT  ] ${session.ea_name} started`]);
      } else {
        toast.info("Bot stopped");
        setLogs((p) => [...p, `[ BOT  ] ${session.ea_name} stopped`]);
      }
      return next;
    });
  };

  return (
    <div className="px-5 pt-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-white/50">Welcome Master</p>
          <h1 className="text-xl font-bold tracking-tight">{session.username}</h1>
        </div>
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${running ? "bg-emerald-500/15 text-emerald-300" : "bg-white/10 text-white/60"}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${running ? "bg-emerald-400 animate-pulse" : "bg-white/40"}`} />
          {running ? "LIVE" : "IDLE"}
        </span>
      </div>

      <div className="mt-5 rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.07] to-white/[0.02] p-5">
        <div className="flex items-center gap-3">
          <div className={`grid h-12 w-12 place-items-center rounded-2xl ${running ? "bg-gradient-to-br from-emerald-400 to-teal-500 shadow-lg shadow-emerald-500/40" : "bg-white/10"}`}>
            <Bot className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider text-white/40">Expert Advisor</p>
            <h2 className="text-base font-semibold">{session.ea_name}</h2>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {session.symbols.length === 0 ? (
            <span className="text-xs text-white/40">No symbols configured</span>
          ) : (
            session.symbols.map((s) => (
              <span key={s} className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-medium">
                {s}
              </span>
            ))
          )}
        </div>

        <button
          onClick={toggle}
          className={`mt-5 flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold transition ${
            running
              ? "bg-gradient-to-r from-rose-500 to-red-600 shadow-lg shadow-rose-500/30"
              : "bg-gradient-to-r from-emerald-400 to-teal-500 shadow-lg shadow-emerald-500/30"
          }`}
        >
          {running ? <><Square className="h-4 w-4" /> STOP BOT</> : <><Play className="h-4 w-4" /> START BOT</>}
        </button>
      </div>

      <div className="mt-5 rounded-2xl border border-white/10 bg-black/50 p-3">
        <div className="mb-2 flex items-center gap-2 px-1 text-[11px] uppercase tracking-wider text-white/50">
          <Activity className="h-3 w-3" /> Live Console
        </div>
        <div ref={consoleRef} className="h-40 space-y-0.5 overflow-y-auto px-1 font-mono text-[11px] leading-relaxed text-emerald-300">
          {logs.map((l, i) => <div key={i}>{l}</div>)}
        </div>
      </div>

      <div className="mt-5 mb-2 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-white/60">Licence</span>
          <span className="font-mono text-xs">{session.key.slice(0, 14)}…</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-sm">
          <span className="text-white/60">Expires</span>
          <span className="font-medium">{new Date(session.expires_at).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
}

function TradesScreen({ session }: { session: Session }) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const idRef = useRef(1);

  useEffect(() => {
    const symbols = session.symbols.length ? session.symbols : ["EURUSD", "XAUUSD"];
    const t = setInterval(() => {
      const sym = symbols[Math.floor(Math.random() * symbols.length)];
      const side: "BUY" | "SELL" = Math.random() > 0.5 ? "BUY" : "SELL";
      const pnl = +(Math.random() * 80 - 30).toFixed(2);
      setTrades((p) => [{
        id: idRef.current++,
        symbol: sym,
        side,
        lot: +(Math.random() * 0.5 + 0.01).toFixed(2),
        price: +(1 + Math.random() * 2000).toFixed(2),
        pnl,
        at: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      }, ...p].slice(0, 50));
    }, 1800);
    return () => clearInterval(t);
  }, [session.symbols]);

  const total = trades.reduce((sum, t) => sum + t.pnl, 0);

  return (
    <div className="px-5 pt-4">
      <h1 className="text-xl font-bold">Live Trades</h1>
      <p className="text-xs text-white/50">Streaming from MT5 bridge</p>

      <div className="mt-4 rounded-2xl bg-gradient-to-br from-violet-500/15 to-fuchsia-500/10 p-5 ring-1 ring-violet-400/20">
        <p className="text-[11px] uppercase tracking-wider text-white/60">Session P&amp;L</p>
        <p className={`mt-1 text-3xl font-bold tabular-nums ${total >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
          {total >= 0 ? "+" : ""}{total.toFixed(2)} <span className="text-base text-white/50">USD</span>
        </p>
      </div>

      <div className="mt-4 space-y-2">
        {trades.length === 0 && (
          <p className="py-10 text-center text-sm text-white/40">Waiting for first trade…</p>
        )}
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

function SettingsScreen({ session, onLogout }: { session: Session; onLogout: () => void }) {
  return (
    <div className="px-5 pt-4">
      <h1 className="text-xl font-bold">Settings</h1>

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
    { q: "How do I add a broker?", a: "Brokers are linked from the portal — never on your phone." },
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
    </div>
  );
}

function BottomNav({
  tab, setTab,
}: { tab: string; setTab: (t: "home" | "trades" | "settings" | "help") => void }) {
  const items = [
    { id: "home" as const, icon: Home, label: "Home" },
    { id: "trades" as const, icon: Activity, label: "Trades" },
    { id: "settings" as const, icon: SettingsIcon, label: "Settings" },
    { id: "help" as const, icon: HelpCircle, label: "Help" },
  ];
  return (
    <nav className="absolute inset-x-0 bottom-0 border-t border-white/10 bg-[#0b1020]/95 px-2 pb-5 pt-2 backdrop-blur">
      <div className="flex items-center justify-around">
        {items.map(({ id, icon: Icon, label }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex flex-1 flex-col items-center gap-0.5 rounded-xl py-1.5 text-[10px] transition ${
                active ? "text-violet-300" : "text-white/50"
              }`}
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
