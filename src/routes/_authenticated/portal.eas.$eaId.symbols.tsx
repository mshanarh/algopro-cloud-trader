import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { ArrowLeft, Copy, X } from "lucide-react";
import { PageHeader } from "@/components/portal/PageHeader";
import { getEA, updateEASymbols } from "@/lib/portal.functions";

const POPULAR = ["EURUSD", "GBPUSD", "USDJPY", "XAUUSD", "BTCUSD", "US30", "NAS100", "GER40"];

const eaQ = (id: string) =>
  queryOptions({ queryKey: ["ea", id], queryFn: () => getEA({ data: { id } }) });

export const Route = createFileRoute("/_authenticated/portal/eas/$eaId/symbols")({
  loader: ({ context, params }) => context.queryClient.ensureQueryData(eaQ(params.eaId)),
  component: SymbolsPage,
});

function SymbolsPage() {
  const { eaId } = Route.useParams();
  const { data: ea } = useSuspenseQuery(eaQ(eaId));
  const qc = useQueryClient();
  const save = useServerFn(updateEASymbols);

  const [symbols, setSymbols] = useState<string[]>(ea.symbols ?? []);
  const [custom, setCustom] = useState("");

  useEffect(() => { setSymbols(ea.symbols ?? []); }, [ea.symbols]);

  const add = (raw: string) => {
    const s = raw.trim().toUpperCase().replace(/[^A-Z0-9_.]/g, "");
    if (!s) return;
    if (symbols.includes(s)) { toast.info(`${s} already added`); return; }
    setSymbols((p) => [...p, s]);
  };
  const remove = (s: string) => setSymbols((p) => p.filter((x) => x !== s));

  const m = useMutation({
    mutationFn: () => save({ data: { id: eaId, symbols } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ea", eaId] });
      toast.success("Symbols saved — synced to mobile app");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to save"),
  });

  return (
    <div>
      <PageHeader title="Manage Symbols" subtitle={`Configure tradable symbols for ${ea.name}`} />
      <div className="mx-auto max-w-2xl p-5 sm:p-8">
        <Link to="/portal/eas" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to EAs
        </Link>

        <div className="rounded-2xl border border-border bg-card shadow-sm">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 p-5">
            <div>
              <h2 className="text-lg font-bold">Symbols</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Click a symbol to add it to {ea.name}
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
              {symbols.length} symbols active
            </span>
          </div>

          <div className="h-px bg-border" />

          {/* Body */}
          <div className="space-y-6 p-5">
            {/* Custom add */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Custom:</label>
              <input
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(custom); setCustom(""); } }}
                placeholder="e.g. USDMXN"
                maxLength={20}
                className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
              <button
                type="button"
                onClick={() => { add(custom); setCustom(""); }}
                className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600"
              >
                Add
              </button>
            </div>

            {/* Empty state OR chips */}
            {symbols.length === 0 ? (
              <div className="grid place-items-center rounded-xl bg-muted/40 py-10 text-center">
                <div className="mb-3 grid h-14 w-14 place-items-center rounded-full bg-muted">
                  <Copy className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-base font-bold">No symbols added yet</p>
                <p className="mt-1 text-sm text-muted-foreground">Click any symbol below to add it.</p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {symbols.map((s) => (
                  <span key={s} className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-sm font-medium text-foreground">
                    {s}
                    <button type="button" onClick={() => remove(s)} aria-label={`Remove ${s}`} className="rounded-full hover:bg-background/60">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="h-px bg-border" />

            {/* Popular */}
            <div>
              <h3 className="mb-3 text-sm font-bold">Popular Symbols</h3>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {POPULAR.map((s) => {
                  const active = symbols.includes(s);
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => add(s)}
                      disabled={active}
                      className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                        active
                          ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                          : "border-border bg-background hover:bg-emerald-50 hover:border-emerald-300"
                      }`}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="space-y-2 border-t border-border p-5">
            <button
              type="button"
              onClick={() => m.mutate()}
              disabled={m.isPending}
              className="w-full rounded-lg bg-emerald-500 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-60"
            >
              {m.isPending ? "Saving..." : "Save Changes"}
            </button>
            <p className="text-center text-xs text-muted-foreground">
              Changes sync to mobile app instantly
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
