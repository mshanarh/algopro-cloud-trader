import { createFileRoute, Link } from "@tanstack/react-router";
import heroPhone from "@/assets/hero-phone.png";
import {
  Cloud,
  KeyRound,
  ActivitySquare,
  LineChart,
  Palette,
  ShieldCheck,
  Smartphone,
  Apple,
  Check,
  ArrowRight,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Algopro — Host Forex EAs in the Cloud, control from your phone" },
      {
        name: "description",
        content:
          "Algopro is a secure mobile hosting platform for MetaTrader EAs. Run MT4/MT5 bots 24/7 across 40,000+ brokers and control everything from your phone.",
      },
      { property: "og:title", content: "Algopro — Cloud hosting for Forex EAs" },
      {
        property: "og:description",
        content: "Run MetaTrader EAs 24/7 on secure cloud VPS. Control from your phone.",
      },
      { property: "og:image", content: heroPhone },
    ],
  }),
  component: Landing,
});

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2">
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-[image:var(--gradient-purple)] text-primary-foreground shadow-[var(--shadow-elegant)]">
        <span className="text-sm font-black">A</span>
      </span>
      <span className="text-lg font-bold tracking-tight">Algopro</span>
    </Link>
  );
}

function Nav() {
  return (
    <header className="absolute inset-x-0 top-0 z-20">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <div className="text-white">
          <Logo />
        </div>
        <nav className="flex items-center gap-2 sm:gap-4">
          <a
            href="#features"
            className="hidden text-sm font-medium text-white/80 hover:text-white sm:inline"
          >
            Features
          </a>
          <Link
            to="/login"
            className="rounded-md border border-white/20 px-4 py-2 text-sm font-medium text-white hover:bg-white/10"
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
    <section className="relative overflow-hidden bg-[image:var(--gradient-navy)] pb-24 pt-28 text-white sm:pb-32 sm:pt-32">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-32 top-10 h-[480px] w-[480px] rounded-full opacity-30 blur-3xl"
        style={{ background: "radial-gradient(closest-side, var(--accent), transparent)" }}
      />
      <Nav />
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-white/80 backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            Trusted by traders in 40,000+ brokers
          </span>
          <h1 className="text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
            Host Your Forex EAs in the{" "}
            <span className="bg-gradient-to-r from-accent to-[oklch(0.78_0.15_180)] bg-clip-text text-transparent">
              Cloud
            </span>{" "}
            with Algopro
          </h1>
          <p className="mt-5 max-w-xl text-base text-white/75 sm:text-lg">
            A secure mobile hosting platform that lets you run MetaTrader EAs 24/7 and control
            everything from your phone. Supports 40,000+ MT4/MT5 brokers worldwide.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-lg bg-[image:var(--gradient-purple)] px-6 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-elegant)] transition hover:opacity-95"
            >
              Get Started <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/app"
              className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-6 py-3 text-sm font-semibold text-white backdrop-blur hover:bg-white/10"
            >
              <Smartphone className="h-4 w-4" /> <Apple className="h-4 w-4" /> Open Mobile App
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-xs text-white/70">
            {["24/7 uptime", "Bank-grade encryption", "No phone battery drain"].map((t) => (
              <span key={t} className="inline-flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-accent" /> {t}
              </span>
            ))}
          </div>
        </div>
        <div className="relative mx-auto w-full max-w-md">
          <div
            aria-hidden
            className="absolute inset-0 -z-10 rounded-[40px] opacity-60 blur-3xl"
            style={{ background: "var(--gradient-purple)" }}
          />
          <img
            src={heroPhone}
            alt="Algopro mobile app showing the Bot Console with a glowing teal bot icon"
            width={1024}
            height={1280}
            className="mx-auto w-full max-w-sm drop-shadow-2xl"
          />
        </div>
      </div>
    </section>
  );
}

function TrustBar() {
  const brokers = ["IC Markets", "Exness", "FTMO", "XM", "Pepperstone"];
  return (
    <section className="border-y border-border bg-secondary/40">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-5 px-5 py-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Compatible with all major brokers — 40,000+ supported
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
          {brokers.map((b) => (
            <span
              key={b}
              className="text-base font-semibold text-foreground/70 sm:text-lg"
            >
              {b}
            </span>
          ))}
          <span className="text-sm text-muted-foreground">+ 40,000 others</span>
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      n: "01",
      title: "Upload Your EA",
      desc: "Drop your MT4/MT5 expert advisor into Algopro's secure cloud workspace.",
    },
    {
      n: "02",
      title: "Generate License",
      desc: "Create license keys tied to a username, EA, and expiry — share with clients.",
    },
    {
      n: "03",
      title: "Trade 24/7",
      desc: "Your EA runs on a dedicated VPS. Monitor and control it from your phone.",
    },
  ];
  return (
    <section className="bg-background py-20">
      <div className="mx-auto max-w-6xl px-5">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">How it works</h2>
          <p className="mt-3 text-muted-foreground">Three steps from EA file to live trading.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {steps.map((s) => (
            <div
              key={s.n}
              className="group rounded-2xl border border-border bg-card p-7 transition hover:-translate-y-1 hover:shadow-[var(--shadow-elegant)]"
            >
              <div className="mb-5 text-sm font-bold text-accent">{s.n}</div>
              <h3 className="mb-2 text-lg font-semibold">{s.title}</h3>
              <p className="text-sm text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Features() {
  const items = [
    { icon: Cloud, title: "Cloud Hosting", desc: "Dedicated VPS keeps your EA online 24/7." },
    { icon: KeyRound, title: "License Control", desc: "Issue, extend, and revoke keys instantly." },
    { icon: ActivitySquare, title: "Live Trade Logs", desc: "Stream every order to your phone in real time." },
    { icon: LineChart, title: "Chart Scanner", desc: "Scan pairs and surface signals as they form." },
    { icon: Palette, title: "Custom Branding", desc: "White-label the bot console for your brand." },
    { icon: ShieldCheck, title: "Secure MT4/MT5", desc: "Encrypted credentials. Works with any broker." },
  ];
  return (
    <section id="features" className="bg-secondary/40 py-20">
      <div className="mx-auto max-w-6xl px-5">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Everything you need to run a Forex bot business</h2>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((it) => (
            <div key={it.title} className="rounded-2xl border border-border bg-card p-6 transition hover:border-accent/50">
              <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-accent/15 text-accent">
                <it.icon className="h-5 w-5" />
              </div>
              <h3 className="mb-1.5 font-semibold">{it.title}</h3>
              <p className="text-sm text-muted-foreground">{it.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section id="get-started" className="relative overflow-hidden bg-[image:var(--gradient-navy)] py-20 text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-40 -top-20 h-[420px] w-[420px] rounded-full opacity-30 blur-3xl"
        style={{ background: "radial-gradient(closest-side, var(--accent), transparent)" }}
      />
      <div className="mx-auto max-w-3xl px-5 text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-5xl">
          Ready to Automate Your Forex Business?
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-white/75">
          Launch your white-label EA hosting in minutes. Your traders get a mobile control panel.
        </p>
        <div id="download" className="mt-8 flex flex-wrap justify-center gap-3">
          <a
            href="#"
            className="inline-flex items-center gap-2 rounded-lg bg-[image:var(--gradient-purple)] px-7 py-3 text-sm font-semibold shadow-[var(--shadow-elegant)] hover:opacity-95"
          >
            Start Now <ArrowRight className="h-4 w-4" />
          </a>
          <a
            href="#"
            className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-7 py-3 text-sm font-semibold backdrop-blur hover:bg-white/10"
          >
            <Smartphone className="h-4 w-4" /> Download Algopro App
          </a>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-8 sm:flex-row">
        <div className="flex items-center gap-3">
          <Logo />
          <span className="text-sm text-muted-foreground">© 2026</span>
        </div>
        <nav className="flex items-center gap-6 text-sm text-muted-foreground">
          <a href="#" className="hover:text-foreground">Terms</a>
          <a href="#" className="hover:text-foreground">Privacy</a>
          <a href="#" className="hover:text-foreground">Contact</a>
        </nav>
      </div>
    </footer>
  );
}

function Landing() {
  return (
    <main>
      <Hero />
      <TrustBar />
      <HowItWorks />
      <Features />
      <CTA />
      <Footer />
    </main>
  );
}
