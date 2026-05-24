import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Copy, KeyRound, Check } from "lucide-react";
import { PageHeader } from "@/components/portal/PageHeader";
import { listEAs, createLicense } from "@/lib/portal.functions";

const easQ = queryOptions({ queryKey: ["eas"], queryFn: () => listEAs() });

export const Route = createFileRoute("/_authenticated/portal/generate")({
  loader: ({ context }) => context.queryClient.ensureQueryData(easQ),
  component: GeneratePage,
});

const PLANS = [
  { v: "3_days", l: "3 Days" },
  { v: "5_days", l: "5 Days" },
  { v: "30_days", l: "30 Days" },
  { v: "3_months", l: "3 Months" },
  { v: "6_months", l: "6 Months" },
  { v: "1_year", l: "1 Year" },
] as const;

function GeneratePage() {
  const { data: eas } = useSuspenseQuery(easQ);
  const qc = useQueryClient();
  const create = useServerFn(createLicense);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [eaId, setEaId] = useState<string>("");
  const [plan, setPlan] = useState<(typeof PLANS)[number]["v"]>("30_days");
  const [generated, setGenerated] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const m = useMutation({
    mutationFn: (vars: Parameters<typeof create>[0]["data"]) => create({ data: vars }),
    onSuccess: (row) => {
      setGenerated(row.key);
      qc.invalidateQueries({ queryKey: ["licenses"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Licence generated");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return toast.error("Username required");
    m.mutate({ username, client_email: email || undefined, ea_id: eaId || null, plan });
  };

  const copy = async () => {
    if (!generated) return;
    await navigator.clipboard.writeText(generated);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div>
      <PageHeader title="Generate Licence Key" subtitle="Create a new licence tied to a username, EA, and plan." />
      <div className="mx-auto max-w-2xl p-5 sm:p-8">
        <form onSubmit={submit} className="space-y-5 rounded-2xl border border-border bg-card p-6 sm:p-8">
          <Field label="Username">
            <input value={username} onChange={(e) => setUsername(e.target.value)} required maxLength={50} className="input" placeholder="trader_jane" />
          </Field>
          <Field label="Client email (optional)">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input" placeholder="client@example.com" />
          </Field>
          <Field label="Expert Advisor">
            <select value={eaId} onChange={(e) => setEaId(e.target.value)} className="input">
              <option value="">— No EA assigned —</option>
              {eas.map((ea) => <option key={ea.id} value={ea.id}>{ea.name}</option>)}
            </select>
          </Field>
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Subscription plan</label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {PLANS.map((p) => (
                <button
                  type="button"
                  key={p.v}
                  onClick={() => setPlan(p.v)}
                  className={`rounded-lg border px-3 py-3 text-sm font-medium transition ${
                    plan === p.v ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/50"
                  }`}
                >
                  {p.l}
                </button>
              ))}
            </div>
          </div>
          <button
            type="submit"
            disabled={m.isPending}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-3 text-sm font-semibold text-accent-foreground hover:opacity-90 disabled:opacity-50"
          >
            <KeyRound className="h-4 w-4" /> {m.isPending ? "Generating..." : "Generate Key"}
          </button>

          {generated && (
            <div className="rounded-xl border-2 border-dashed border-accent/50 bg-accent/5 p-4">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Generated Key</div>
              <div className="flex items-center gap-2">
                <code className="flex-1 break-all rounded-lg bg-background px-3 py-2 font-mono text-sm">{generated}</code>
                <button type="button" onClick={copy} className="rounded-lg border border-border bg-background p-2.5 hover:bg-secondary">
                  {copied ? <Check className="h-4 w-4 text-accent" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
      <style>{`.input{width:100%;border:1px solid var(--border);border-radius:.5rem;padding:.625rem .875rem;font-size:.875rem;background:var(--background);outline:none}.input:focus{border-color:var(--primary)}`}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}
