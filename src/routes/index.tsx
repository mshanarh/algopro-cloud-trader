import { createFileRoute, Link } from "@tanstack/react-router";
import appPreview from "@/assets/app-preview.jpg.asset.json";
import {
  Apple,
  ArrowRight,
  Bot,
  CalendarClock,
  Check,
  Clock,
  Gauge,
  LogIn,
  MessageCircle,
  ShieldCheck,
  Smartphone,
  Trophy,
  TrendingUp,
  Users,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "EA Vault — Mobile VPS on the go" },
      {
        name: "description",
        content:
          "Seamless VPS hosting for your EA on the go. Convert your Expert Advisor into a mobile trading bot while it stays hosted securely on our servers.",
      },
      { property: "og:title", content: "EA Vault — Mobile VPS on the go" },
      {
        property: "og:description",
        content: "24/7 EA hosting, news event trading and MT4/MT5 support from your phone.",
      },
      { property: "og:image", content: appPreview.url },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: appPreview.url },
    ],
  }),
  component: Landing,
});

const RED = "#e11d2f";

function Mark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <span
      className={`grid place-items-center rounded-xl bg-[linear-gradient(140deg,#ff4d4d,#a90c1c)] shadow-[0_10px_30px_-10px_rgba(225,29,47,0.9)] ring-1 ring-[#ff4d4d]/40 ${className}`}
    >
      <Bot className="h-[58%] w-[58%] text-white" />
    </span>
  );
}

function Wordmark({ className = "text-lg" }: { className?: string }) {
  return (
    <span className={`font-extrabold tracking-tight text-[#e11d2f] ${className}`}>EA VAULT</span>
  );
}

function LoginButton({ className = "" }: { className?: string }) {
  return (
    <Link
      to="/login"
      search={{ redirect: "/portal" }}
      className={`group inline-flex items-center gap-2 rounded-full border border-[#e11d2f]/50 bg-[#0e0e10] px-4 py-2 text-sm font-semibold text-white transition-all duration-300 hover:border-[#ff4d4d] hover:bg-[#160607] hover:shadow-[0_0_28px_-8px_rgba(225,29,47,0.9)] ${className}`}
    >
      <LogIn className="h-4 w-4 text-[#ff4d4d]" />
      Mentor Sign In
    </Link>
  );
}

function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b border-[#e11d2f]/25 bg-[#050505]/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3.5">
        <Link to="/" className="flex items-center gap-2.5">
          <Mark className="h-8 w-8" />
          <Wordmark className="text-base sm:text-lg" />
        </Link>
        <nav className="flex items-center gap-6">
          <a
            href="#features"
            className="hidden text-sm text-white/60 transition-colors hover:text-white md:inline"
          >
            Why us
          </a>
          <a
            href="#plans"
            className="hidden text-sm text-white/60 transition-colors hover:text-white md:inline"
          >
            Plans
          </a>
          <a
            href="#setup"
            className="hidden text-sm text-white/60 transition-colors hover:text-white md:inline"
          >
            How it works
          </a>
          <LoginButton />
        </nav>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden px-5 pt-14 pb-16 text-white sm:pt-20">
      <div
        aria-hidden
        className="ea-glow-pulse pointer-events-none absolute left-1/2 top-[-160px] h-[560px] w-[560px] -translate-x-1/2 rounded-full blur-[90px]"
        style={{ background: `radial-gradient(closest-side, ${RED}55, transparent)` }}
      />
      <div className="relative mx-auto max-w-3xl text-center">
        <div className="ea-rise flex items-center justify-center gap-3">
          <Mark className="h-11 w-11" />
          <Wordmark className="text-xl tracking-[0.14em] sm:text-2xl" />
        </div>

        <h1 className="ea-rise ea-rise-1 mt-8 text-5xl font-black leading-[0.95] tracking-tight sm:text-7xl">
          MOBILE VPS
          <br />
          <span className="bg-[linear-gradient(120deg,#ff5f5f,#e11d2f_55%,#8c0a17)] bg-clip-text text-transparent">
            ON THE GO
          </span>
        </h1>

        <p className="ea-rise ea-rise-2 mx-auto mt-6 max-w-xl text-base leading-relaxed text-white/60 sm:text-lg">
          Seamless VPS hosting for your EA on the go. Convert your Expert Advisor into a mobile
          trading bot while it stays hosted securely on our servers for uninterrupted trading,
          low-latency execution, and 24/7 uptime.
        </p>

        <div className="ea-rise ea-rise-3 mt-9 flex flex-col items-center gap-3">
          <Link
            to="/download"
            className="group inline-flex w-full max-w-xs items-center justify-center gap-2.5 rounded-full bg-[linear-gradient(135deg,#ff4747,#c40f22)] px-7 py-3.5 text-sm font-bold text-white shadow-[0_18px_45px_-18px_rgba(225,29,47,0.95)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_60px_-18px_rgba(225,29,47,1)]"
          >
            <Bot className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
            Download Android 3.0
          </Link>
          <Link
            to="/download"
            className="inline-flex w-full max-w-xs items-center justify-center gap-2.5 rounded-full border border-white/15 bg-[#0b0b0c] px-7 py-3.5 text-sm font-bold text-white transition-all duration-300 hover:border-[#e11d2f]/60 hover:bg-[#120708]"
          >
            <Apple className="h-4 w-4" />
            Download iOS
          </Link>
        </div>

        <div className="ea-rise ea-rise-4 mt-5 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/login"
            search={{ redirect: "/portal" }}
            className="relative inline-flex items-center gap-2 rounded-full bg-[#101012] px-5 py-2.5 text-sm font-semibold text-white ring-1 ring-white/10 transition-all duration-300 hover:ring-[#e11d2f]"
          >
            <Users className="h-4 w-4 text-[#ff4d4d]" />
            Mentor Sign Up
            <span className="absolute -right-2 -top-2 rounded-full bg-[#e11d2f] px-2 py-0.5 text-[10px] font-bold tracking-wide text-white">
              FREE
            </span>
          </Link>
          <Link
            to="/login"
            search={{ redirect: "/portal" }}
            className="inline-flex items-center gap-2 rounded-full border border-[#e11d2f]/35 px-5 py-2.5 text-sm font-semibold text-white/85 transition-all duration-300 hover:border-[#e11d2f] hover:text-white"
          >
            <Clock className="h-4 w-4 text-[#ff4d4d]" />
            Reactivate
          </Link>
        </div>

        <p className="ea-rise ea-rise-5 mt-7 text-sm text-white/55">
          <span className="font-semibold text-white/85">100% EA execution guarantee</span>
          <span className="mx-2 text-[#e11d2f]/70">|</span>
          4.8/5 from 337+ reviews
        </p>
      </div>

      <PhoneShowcase />
    </section>
  );
}

function FeaturePill({
  icon: Icon,
  title,
  sub,
  className = "",
}: {
  icon: typeof Clock;
  title: string;
  sub?: string;
  className?: string;
}) {
  return (
    <div
      className={`hidden items-center gap-2.5 rounded-2xl border border-[#e11d2f]/25 bg-[#0b0b0d]/85 px-3.5 py-2.5 backdrop-blur-md sm:flex ${className}`}
    >
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-[#e11d2f]/12 ring-1 ring-[#e11d2f]/25">
        <Icon className="h-4 w-4 text-[#ff4d4d]" />
      </span>
      <span className="leading-tight">
        <span className="block text-xs font-semibold text-white">{title}</span>
        {sub && <span className="block text-[11px] text-white/50">{sub}</span>}
      </span>
    </div>
  );
}

function PhoneShowcase() {
  return (
    <div className="relative mx-auto mt-14 max-w-xl">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[380px] w-[380px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[80px]"
        style={{ background: `radial-gradient(closest-side, ${RED}45, transparent)` }}
      />

      <div className="relative flex items-center justify-center py-6">
        <div
          aria-hidden
          className="absolute left-0 top-10 hidden h-[300px] w-[160px] rotate-[-13deg] overflow-hidden rounded-[1.8rem] border border-white/10 opacity-45 sm:block"
        >
          <img src={appPreview.url} alt="" className="h-full w-full object-cover object-top" />
        </div>
        <div
          aria-hidden
          className="absolute right-0 top-10 hidden h-[300px] w-[160px] rotate-[13deg] overflow-hidden rounded-[1.8rem] border border-white/10 opacity-45 sm:block"
        >
          <img src={appPreview.url} alt="" className="h-full w-full object-cover object-top" />
        </div>

        <div className="ea-float-slow relative z-10 w-[230px] rounded-[2.2rem] border border-[#e11d2f]/40 bg-[#08080a] p-2 shadow-[0_40px_90px_-35px_rgba(225,29,47,0.8)]">
          <img
            src={appPreview.url}
            alt="EA Vault mobile app showing a hosted expert advisor with play controls and licence keys"
            className="w-full rounded-[1.8rem]"
            loading="eager"
          />
        </div>

        <FeaturePill
          icon={TrendingUp}
          title="Hosted 24/7"
          sub="Runs on EA Vault servers"
          className="absolute left-0 top-2 z-20"
        />
        <FeaturePill
          icon={Smartphone}
          title="Phone locked?"
          sub="Your EA keeps trading"
          className="absolute right-0 top-36 z-20"
        />
        <FeaturePill
          icon={CalendarClock}
          title="News event trading"
          sub="Buy or sell around the news"
          className="absolute bottom-20 left-0 z-20"
        />
        <FeaturePill
          icon={ArrowRight}
          title="MT4 & MT5"
          sub="Android and iOS"
          className="absolute bottom-6 right-0 z-20"
        />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-2.5 sm:hidden">
        {[
          ["Hosted 24/7", "On EA Vault servers"],
          ["Phone locked?", "EA keeps trading"],
          ["News event trading", "Around the news"],
          ["MT4 & MT5", "Android and iOS"],
        ].map(([title, sub], i) => (
          <div
            key={title}
            className={`rounded-2xl border border-[#e11d2f]/25 bg-[#0b0b0d] px-3 py-2.5 ea-rise ea-rise-${i + 2}`}
          >
            <p className="text-xs font-semibold text-white">{title}</p>
            <p className="text-[11px] text-white/50">{sub}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function UpdateCard() {
  return (
    <section className="px-5 pb-4">
      <div className="ea-rise mx-auto max-w-3xl rounded-3xl border border-[#e11d2f]/30 bg-[linear-gradient(180deg,#101012,#0a0a0b)] p-6 shadow-[0_30px_80px_-50px_rgba(225,29,47,0.9)] sm:p-8">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e11d2f]/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#ff6b6b] ring-1 ring-[#e11d2f]/30">
          <TrendingUp className="h-3 w-3" /> New update
        </span>
        <h2 className="mt-4 text-2xl font-bold leading-snug text-white sm:text-3xl">
          EA Vault for Android 3.0 is here
        </h2>
        <p className="mt-2 max-w-md text-sm text-white/55">
          Faster startup, smoother charts and a rebuilt bot console — all in the app you already use.
        </p>
        <Link
          to="/download"
          className="mt-5 inline-flex items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,#ff4747,#c40f22)] px-6 py-3 text-sm font-bold text-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-18px_rgba(225,29,47,1)]"
        >
          <Bot className="h-4 w-4" /> Download Android 3.0
        </Link>
      </div>
    </section>
  );
}

const FEATURES = [
  {
    icon: Gauge,
    title: "Ultra-Fast Execution",
    desc: "Execute trades within seconds, on infrastructure built for latency as low as 1ms, helping with precise market entries and time-sensitive trading.*",
  },
  {
    icon: ShieldCheck,
    title: "Secure Hosting",
    desc: "Advanced cybersecurity and secure server infrastructure help protect your trading environment and data from threats.",
  },
  {
    icon: Clock,
    title: "24/7 EA Hosting",
    desc: "Keep your Expert Advisors running continuously on our servers without needing to leave your PC running.",
  },
  {
    icon: CalendarClock,
    title: "News Event Trading",
    desc: "Configure your EA to trigger Buy or Sell actions around scheduled news events, including custom timing in minutes or seconds before or after an event.",
  },
];

function WhyChoose() {
  return (
    <section id="features" className="px-5 py-20">
      <div className="mx-auto max-w-4xl text-center">
        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Why choose EA Vault?
        </h2>
        <p className="mx-auto mt-3 max-w-md text-white/50">
          Built for traders who need their robots awake at 3am, on every device.
        </p>
      </div>

      <div className="mx-auto mt-14 grid max-w-4xl gap-4 sm:grid-cols-2">
        {FEATURES.map((f, i) => (
          <div
            key={f.title}
            className={`ea-rise ea-rise-${(i % 5) + 1} group rounded-3xl border border-white/8 bg-[#0a0a0b] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[#e11d2f]/45 hover:shadow-[0_26px_60px_-35px_rgba(225,29,47,0.9)]`}
          >
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#e11d2f]/10 ring-1 ring-[#e11d2f]/30 transition-colors duration-300 group-hover:bg-[#e11d2f]/20">
              <f.icon className="h-6 w-6 text-[#ff4d4d]" />
            </span>
            <h3 className="mt-5 text-lg font-semibold text-white">{f.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-white/55">{f.desc}</p>
          </div>
        ))}
      </div>

      <p className="mx-auto mt-8 max-w-2xl text-center text-xs leading-relaxed text-white/35">
        *Latency as low as 1ms describes our infrastructure capability. Actual execution speed
        depends on your broker, network and market conditions, and is not guaranteed.
      </p>
    </section>
  );
}

const PLANS = [
  {
    name: "1 Month",
    price: "39.17$",
    note: "One payment, 1 month of access",
    per: "Works out to 39.17$ per month",
    features: ["Up to 3 EAs", "Android / IOS", "24/7 Live", "MT5 / MT4 Platform", "24/7 Support"],
    popular: false,
  },
  {
    name: "3 Months",
    price: "69.17$",
    was: "117.51$",
    note: "One payment, 3 months of access",
    per: "Works out to 23.06$ per month",
    save: "Save 41%",
    features: ["Up to 6 EAs", "Android / IOS", "24/7 Live", "MT5 / MT4 Platform", "24/7 Support"],
    popular: true,
  },
  {
    name: "1 Year",
    price: "199.17$",
    was: "470.04$",
    note: "One payment, 12 months of access",
    per: "Works out to 16.60$ per month",
    save: "Save 58%",
    features: ["Up to 10 EAs", "Android / IOS", "24/7 Live", "MT5 / MT4 Platform", "24/7 Support"],
    popular: false,
  },
];

function Plans() {
  return (
    <section id="plans" className="relative px-5 py-20">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,#e11d2f66,transparent)]"
      />
      <div className="mx-auto max-w-5xl text-center">
        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Access Fee Plan</h2>
        <p className="mt-3 text-white/50">Pick the runway that fits your trading. Cancel anytime.</p>
      </div>

      <div className="mx-auto mt-12 grid max-w-5xl gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {PLANS.map((p, i) => (
          <div
            key={p.name}
            className={`ea-rise ea-rise-${i + 1} relative flex flex-col rounded-3xl border p-6 transition-all duration-300 hover:-translate-y-1.5 ${
              p.popular
                ? "border-[#e11d2f]/60 bg-[linear-gradient(180deg,#150709,#0a0a0b)] shadow-[0_35px_90px_-45px_rgba(225,29,47,1)]"
                : "border-white/8 bg-[#0a0a0b] hover:border-[#e11d2f]/40"
            }`}
          >
            {p.popular && (
              <span className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#e11d2f] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white shadow-[0_10px_30px_-10px_rgba(225,29,47,1)]">
                Most popular
              </span>
            )}

            <h3 className="text-center text-xl font-semibold text-[#ff5c5c]">{p.name}</h3>
            <div className="mt-2 text-center">
              {p.was && (
                <p className="text-sm text-white/30 line-through">{p.was}</p>
              )}
              <p className="text-3xl font-bold text-white">{p.price}</p>
            </div>
            <p className="mt-2 text-center text-[11px] uppercase tracking-[0.12em] text-white/40">
              {p.note}
            </p>
            <p className="mt-1 text-center text-xs text-white/45">{p.per}</p>
            {p.save && (
              <p className="mt-2 text-center text-xs font-semibold text-[#ff6b6b]">{p.save}</p>
            )}

            <ul className="mt-6 flex-1 space-y-3 border-t border-white/8 pt-6">
              {p.features.map((f) => (
                <li key={f} className="flex items-center gap-2.5 text-sm text-white/70">
                  <Check className="h-4 w-4 shrink-0 text-[#ff4d4d]" />
                  {f}
                </li>
              ))}
            </ul>

            <Link
              to="/login"
              search={{ redirect: "/portal" }}
              className={`mt-7 inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-bold transition-all duration-300 ${
                p.popular
                  ? "bg-[linear-gradient(135deg,#ff4747,#c40f22)] text-white hover:shadow-[0_18px_45px_-18px_rgba(225,29,47,1)]"
                  : "border border-[#e11d2f]/40 text-white hover:bg-[#e11d2f]/12"
              }`}
            >
              Get Started
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}

function Trust() {
  const items = [
    {
      icon: Trophy,
      title: "Platform Freeze! No More Freezes on News Release",
      desc: "High-impact news like non-farm payroll reports can freeze your trading platform, costing you profits. EA Vault reserves a resource buffer to prevent freezes, ensuring your mobile EAs stay active during volatile market conditions.",
    },
    {
      icon: ShieldCheck,
      title: "Cutting-Edge Cybersecurity",
      desc: "Real-time monitoring and an anti-DDoS layer protect your mobile EA hosting from volumetric and protocol-based attacks, keeping your trading data secure around the clock.",
    },
    {
      icon: Users,
      title: "We're Here For You 24/7",
      desc: "Our dedicated support team is available around the clock to assist with any issues. Meet our experts ready to help you succeed in your trading journey.",
    },
  ];

  return (
    <section className="px-5 py-20">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Over Years of Happy Traders
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-white/55 sm:text-base">
          Since our launch, EA Vault has empowered thousands of traders with reliable mobile hosting
          solutions. Trusted by the trading community, we've been recognized for our innovation and
          commitment to excellence.
        </p>
        <span className="mt-6 inline-grid h-14 w-14 place-items-center rounded-2xl border border-[#e11d2f]/30 bg-[#e11d2f]/10">
          <Trophy className="h-7 w-7 text-[#ff4d4d]" />
        </span>
      </div>

      <div className="mx-auto mt-14 max-w-3xl space-y-4">
        {items.map((it, i) => (
          <div
            key={it.title}
            className={`ea-rise ea-rise-${i + 1} rounded-3xl border border-white/8 bg-[#0a0a0b] p-6 text-center transition-colors duration-300 hover:border-[#e11d2f]/40 sm:p-8`}
          >
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#e11d2f]/10 ring-1 ring-[#e11d2f]/25">
              <it.icon className="h-6 w-6 text-[#ff4d4d]" />
            </span>
            <h3 className="mt-5 text-lg font-semibold text-white sm:text-xl">{it.title}</h3>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-white/55">{it.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Setup() {
  const steps = [
    "Choose your access plan above",
    "Get your licence key from your mentor",
    "Link your EA and MT4 / MT5 account on the EA Vault VPS",
  ];
  const points = [
    "Accurate Execution",
    "Latency as low as 1ms*",
    "MT4/MT5 Supported",
    "Unlimited Access",
  ];

  return (
    <section id="setup" className="px-5 py-20">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl">
          How to setup
          <br />
          your mobile VPS!
        </h2>
        <p className="mx-auto mt-5 max-w-lg text-sm leading-relaxed text-white/55 sm:text-base">
          A virtual private server you can access from your phone or tablet, designed to run your
          trading software continuously. It hosts your Expert Advisors, or trading robots, so they
          can operate 24/7 without depending on your personal device. And here's the best part: the
          VPS is available as a mobile app, so you can start and stop your robot right from your
          phone — anywhere, anytime.
        </p>
      </div>

      <div className="mx-auto mt-12 max-w-md space-y-7">
        {steps.map((s, i) => (
          <div key={s} className={`ea-rise ea-rise-${i + 1} flex flex-col items-center text-center`}>
            <span className="grid h-12 w-12 place-items-center rounded-full bg-[linear-gradient(140deg,#ff4747,#b30e1f)] text-lg font-bold text-white shadow-[0_14px_35px_-14px_rgba(225,29,47,1)]">
              {i + 1}
            </span>
            <p className="mt-3 max-w-xs text-sm text-white/70">{s}</p>
          </div>
        ))}
      </div>

      <ul className="mx-auto mt-12 max-w-sm space-y-3">
        {points.map((p) => (
          <li key={p} className="flex items-center gap-3 text-sm text-white/70">
            <Check className="h-4 w-4 shrink-0 text-[#ff4d4d]" />
            {p}
          </li>
        ))}
      </ul>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="px-5 pb-20">
      <div className="mx-auto max-w-3xl overflow-hidden rounded-[2rem] border border-[#e11d2f]/35 bg-[radial-gradient(120%_120%_at_50%_0%,#2a060b_0%,#0a0a0b_60%)] p-8 text-center sm:p-12">
        <Mark className="mx-auto h-12 w-12" />
        <h2 className="mt-6 text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Ready to put your EA on the go?
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm text-white/55">
          One licence key, one app. Your robots keep trading while your phone stays in your pocket.
        </p>
        <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            to="/login"
            search={{ redirect: "/portal" }}
            className="inline-flex w-full max-w-xs items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,#ff4747,#c40f22)] px-6 py-3 text-sm font-bold text-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_45px_-18px_rgba(225,29,47,1)] sm:w-auto"
          >
            Start Now <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/download"
            className="inline-flex w-full max-w-xs items-center justify-center gap-2 rounded-full border border-white/15 bg-[#0b0b0c] px-6 py-3 text-sm font-bold text-white transition-colors duration-300 hover:border-[#e11d2f]/60 sm:w-auto"
          >
            <Smartphone className="h-4 w-4" /> Download App
          </Link>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer id="contact" className="border-t border-[#e11d2f]/20 pt-10 text-white/50">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-5 px-5 pb-10 sm:flex-row">
        <div className="flex items-center gap-3">
          <Mark className="h-8 w-8" />
          <Wordmark className="text-base" />
          <span className="text-xs text-white/30">© 2026</span>
        </div>
        <nav className="flex items-center gap-6 text-sm">
          <a href="#plans" className="transition-colors hover:text-white">
            Plans
          </a>
          <a href="#features" className="transition-colors hover:text-white">
            Why us
          </a>
          <a href="#setup" className="transition-colors hover:text-white">
            Support
          </a>
        </nav>
      </div>
    </footer>
  );
}

function ChatBubble() {
  return (
    <a
      href="#contact"
      aria-label="Contact support"
      className="fixed bottom-6 right-6 z-40 grid h-14 w-14 place-items-center rounded-full bg-[linear-gradient(140deg,#ff4747,#c40f22)] text-white shadow-[0_18px_40px_-12px_rgba(225,29,47,0.95)] transition-transform duration-300 hover:scale-105"
    >
      <MessageCircle className="h-6 w-6" />
    </a>
  );
}

function Landing() {
  return (
    <main className="min-h-screen bg-[#050505] antialiased">
      <Nav />
      <Hero />
      <UpdateCard />
      <WhyChoose />
      <Plans />
      <Trust />
      <Setup />
      <FinalCTA />
      <Footer />
      <ChatBubble />
    </main>
  );
}
