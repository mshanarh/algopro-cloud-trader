import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import appPreview from "@/assets/app-preview.jpg.asset.json";
import {
  Cloud,
  Zap,
  ShieldCheck,
  Check,
  X,
  ChevronDown,
  ArrowRight,
  Smartphone,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "EA Vault — Convert your desktop EA to a mobile bot" },
      {
        name: "description",
        content:
          "EA Vault syncs your MT4/MT5 expert advisor signals to every connected mobile client in real time. Any broker, any device.",
      },
      { property: "og:title", content: "EA Vault — Cloud EA hosting for mobile traders" },
      { property: "og:description", content: "Real-time EA + SL/TP sync to your clients' mobile app." },
      { property: "og:image", content: appPreview.url },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: appPreview.url },
    ],
  }),
  component: Landing,
});

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2 text-white">
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-[image:var(--gradient-purple)] text-sm font-black text-primary-foreground">
        A
      </span>
      <span className="text-lg font-bold tracking-tight">EA Vault</span>
    </Link>
  );
}

function Nav() {
  return (
    <header className="sticky top-0 z-30 border-b border-white/5 bg-black/70 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <Logo />
        <nav className="flex items-center gap-3">
          <a href="#features" className="hidden text-sm text-white/70 hover:text-white sm:inline">Features</a>
          <a href="#compare" className="hidden text-sm text-white/70 hover:text-white sm:inline">Compare</a>
          <a href="#faq" className="hidden text-sm text-white/70 hover:text-white sm:inline">FAQ</a>
          <Link
            to="/login" search={{ redirect: "/portal" }}
            className="rounded-md border border-white/15 px-3 py-1.5 text-sm font-medium text-white hover:bg-white/10"
          >
            Login
          </Link>
        </nav>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden px-5 pb-16 pt-14 text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 h-[520px] w-[520px] -translate-x-1/2 rounded-full opacity-20 blur-3xl"
        style={{ background: "radial-gradient(closest-side, #10b981, transparent)" }}
      />
      <div className="mx-auto max-w-3xl text-center">
        <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/70">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          Real-time EA sync for mobile
        </span>
        <h1 className="text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl">
          Convert your desktop EA <br className="hidden sm:block" /> to a mobile bot
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base text-white/70">
          EA Vault streams your MT4/MT5 signals — including SL/TP updates — to every connected
          client's phone in real time.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link
            to="/login" search={{ redirect: "/portal" }}
            className="inline-flex items-center gap-2 rounded-lg bg-[image:var(--gradient-purple)] px-6 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-elegant)] hover:opacity-95"
          >
            Get Started <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/download"
            className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10"
          >
            <Smartphone className="h-4 w-4" /> Download App
          </Link>
        </div>
      </div>

      <div className="mx-auto mt-12 max-w-sm">
        <div
          aria-hidden
          className="absolute inset-x-0 -z-10 mx-auto h-72 w-72 rounded-full opacity-40 blur-3xl"
          style={{ background: "radial-gradient(closest-side, #10b981, transparent)" }}
        />
        <img
          src={appPreview.url}
          alt="EA Vault mobile app showing the Sniper Maestro bot with Delete, Play and Symbols controls"
          className="mx-auto w-full rounded-3xl border border-white/10 shadow-2xl shadow-emerald-500/10"
          loading="eager"
        />
      </div>
    </section>
  );
}

function WhyChoose() {
  const items = [
    {
      icon: Cloud,
      title: "Cloud-Synced",
      desc: "EA signals sync to all connected mobile clients in real-time.",
    },
    {
      icon: Zap,
      title: "Real-time SL/TP Sync",
      desc: "Stop loss and take profit changes sync to all clients instantly.",
    },
    {
      icon: ShieldCheck,
      title: "Any Broker",
      desc: "Works with every MT4/MT5 broker. No limitations.",
    },
  ];
  return (
    <section id="features" className="px-5 py-20 text-white">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Why choose EA Vault?</h2>
        <p className="mt-3 text-white/60">Convert your desktop EA to mobile with real-time SL/TP sync.</p>
      </div>
      <div className="mx-auto mt-12 max-w-2xl space-y-4">
        {items.map((it) => (
          <div
            key={it.title}
            className="flex items-start gap-4 rounded-2xl border border-white/5 bg-white/[0.03] p-5"
          >
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/5 text-white/80">
              <it.icon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">{it.title}</h3>
              <p className="mt-1 text-sm text-white/60">{it.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Compare() {
  const rows: Array<[string, boolean, boolean | "dim"]> = [
    ["Real-time signal sync", true, false],
    ["SL/TP sync", true, false],
    ["Any broker", true, false],
    ["No duplicate trades", true, false],
    ["Multi-client support", true, "dim"],
    ["Mobile app", true, false],
  ];
  return (
    <section id="compare" className="px-5 py-20 text-white">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">EA Vault vs Others</h2>
        <p className="mt-3 text-white/60">See what makes us different</p>
      </div>
      <div className="mx-auto mt-10 max-w-2xl overflow-hidden rounded-2xl border border-white/5 bg-white/[0.03]">
        <div className="grid grid-cols-3 gap-2 px-5 py-4 text-sm font-semibold">
          <div>Feature</div>
          <div className="text-center">EA Vault</div>
          <div className="text-center text-white/50">Others</div>
        </div>
        {rows.map(([label, us, them]) => (
          <div key={label as string} className="grid grid-cols-3 items-center gap-2 border-t border-white/5 px-5 py-4 text-sm">
            <div className="font-medium">{label}</div>
            <div className="flex justify-center">{us ? <Check className="h-5 w-5 text-emerald-400" /> : <X className="h-5 w-5 text-red-400" />}</div>
            <div className="flex justify-center">
              {them === true ? (
                <Check className="h-5 w-5 text-emerald-400" />
              ) : them === "dim" ? (
                <Check className="h-5 w-5 text-white/30" />
              ) : (
                <X className="h-5 w-5 text-red-400" />
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-t border-white/5 first:border-t-0">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <span className="text-sm font-semibold text-white sm:text-base">{q}</span>
        <ChevronDown className={`h-5 w-5 shrink-0 text-white/60 transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <p className="px-5 pb-4 text-sm text-white/70">{a}</p>}
    </div>
  );
}

function FAQ() {
  const faqs = [
    { q: "Which brokers are compatible?", a: "Every MT4 and MT5 broker — over 40,000 worldwide. No restrictions." },
    { q: "How does the EA connection work?", a: "Upload your EA to EA Vault, generate a licence key and share it with your client. Their mobile app connects and mirrors trades." },
    { q: "Do SL/TP changes sync to client mobile apps?", a: "Yes. Any SL/TP edit on the master EA is pushed to every connected mobile client instantly." },
    { q: "How do clients access my EA?", a: "You issue them a licence key from your portal. They enter it in the EA Vault mobile app and are connected." },
    { q: "Is EA Vault a trading robot?", a: "No — EA Vault is the delivery layer. Your EA is the robot; we make it accessible on mobile." },
  ];
  return (
    <section id="faq" className="px-5 py-20 text-white">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Frequently Asked Questions</h2>
        <p className="mt-3 text-white/60">Everything you need to know</p>
      </div>
      <div className="mx-auto mt-10 max-w-2xl overflow-hidden rounded-2xl border border-white/5 bg-white/[0.03]">
        {faqs.map((f) => <FAQItem key={f.q} {...f} />)}
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="px-5 py-20 text-white">
      <div className="mx-auto max-w-2xl rounded-3xl border border-white/10 bg-[image:var(--gradient-purple)] p-10 text-center shadow-[var(--shadow-elegant)]">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Ready to go mobile?</h2>
        <p className="mx-auto mt-3 max-w-md text-white/85">
          Launch your white-label EA hosting in minutes. Your traders get a mobile control panel.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link to="/login" search={{ redirect: "/portal" }} className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-semibold text-black hover:bg-white/90">
            Start Now <ArrowRight className="h-4 w-4" />
          </Link>
          <Link to="/download" className="inline-flex items-center gap-2 rounded-lg border border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold text-white hover:bg-white/20">
            <Smartphone className="h-4 w-4" /> Download App
          </Link>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="text-white/60">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 border-t border-white/5 px-5 py-8 sm:flex-row">
        <div className="flex items-center gap-3">
          <Logo />
          <span className="text-sm text-white/40">© 2026</span>
        </div>
        <nav className="flex items-center gap-6 text-sm">
          <a href="#" className="hover:text-white">Terms</a>
          <a href="#" className="hover:text-white">Privacy</a>
          <a href="#" className="hover:text-white">Contact</a>
        </nav>
      </div>
    </footer>
  );
}

function Landing() {
  return (
    <main className="min-h-screen bg-black">
      <Nav />
      <Hero />
      <WhyChoose />
      <Compare />
      <FAQ />
      <CTA />
      <Footer />
    </main>
  );
}
