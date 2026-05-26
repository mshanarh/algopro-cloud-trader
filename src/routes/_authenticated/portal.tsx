import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { getDashboard } from "@/lib/portal.functions";
import { PageHeader } from "@/components/portal/PageHeader";
import { CheckCircle2, KeyRound, Bot, Activity } from "lucide-react";

const dashQ = queryOptions({ queryKey: ["dashboard"], queryFn: () => getDashboard() });

export const Route = createFileRoute("/_authenticated/portal")({
  loader: ({ context }) => context.queryClient.ensureQueryData(dashQ),
  component: Dashboard,
});

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function Dashboard() {
  const { data } = useSuspenseQuery(dashQ);
  const name = data.profile?.display_name || data.profile?.full_name || "Trader";
  const usedPct = Math.min(100, (data.stats.active / 25) * 100);

  return (
    <div>
      <PageHeader title={`${greeting()}, ${name}`} subtitle={`Welcome to Algopro Portal — All systems are running smoothly. You have ${data.stats.active} active licences.`}>
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur">
            Mentor ID: <span className="font-mono">{data.profile?.mentor_id}</span>
          </span>
          <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
          </span>
        </div>
      </PageHeader>

      <div className="grid gap-5 p-5 sm:p-8 lg:grid-cols-3">
        {/* Status */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">System Status</h2>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/15 px-2.5 py-1 text-xs font-medium text-accent-foreground">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" /> Operational
            </span>
          </div>
          <p className="text-sm text-muted-foreground">All cloud VPS nodes are healthy. License API responding normally.</p>
          <div className="mt-5 grid grid-cols-3 gap-2 text-center">
            {[
              { l: "VPS", v: "100%" },
              { l: "API", v: "100%" },
              { l: "Auth", v: "100%" },
            ].map((s) => (
              <div key={s.l} className="rounded-lg bg-secondary py-2">
                <div className="text-sm font-bold">{s.v}</div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Licence usage */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Licence Usage</h2>
            <KeyRound className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mb-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold">{data.stats.active}</span>
            <span className="text-sm text-muted-foreground">/ 25 keys</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-secondary">
            <div className="h-full bg-[image:var(--gradient-purple)]" style={{ width: `${usedPct}%` }} />
          </div>
          <Link to="/portal/generate" className="mt-5 block w-full rounded-lg bg-accent px-4 py-2 text-center text-sm font-semibold text-accent-foreground hover:opacity-90">
            Generate Licence Key
          </Link>
        </div>

        {/* Active subs */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Active Subscriptions</h2>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="space-y-3">
            <Row icon={<CheckCircle2 className="h-4 w-4 text-accent" />} label="Active licences" value={data.stats.active} />
            <Row icon={<KeyRound className="h-4 w-4 text-muted-foreground" />} label="Total issued" value={data.stats.total} />
            <Row icon={<Bot className="h-4 w-4 text-muted-foreground" />} label="Expert Advisors" value={data.stats.eas} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-secondary/50 px-3 py-2.5">
      <div className="flex items-center gap-2 text-sm">{icon}{label}</div>
      <span className="font-bold">{value}</span>
    </div>
  );
}
