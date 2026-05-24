import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Download, Search } from "lucide-react";
import { PageHeader } from "@/components/portal/PageHeader";
import { listLicenses, updateLicenseStatus, extendLicense } from "@/lib/portal.functions";

const licQ = queryOptions({ queryKey: ["licenses"], queryFn: () => listLicenses() });

export const Route = createFileRoute("/_authenticated/portal/clients")({
  loader: ({ context }) => context.queryClient.ensureQueryData(licQ),
  component: ClientsPage,
});

function statusOf(l: { status: string; expires_at: string }) {
  if (l.status === "revoked") return "revoked";
  if (new Date(l.expires_at) < new Date()) return "expired";
  return "active";
}

function ClientsPage() {
  const { data: licenses } = useSuspenseQuery(licQ);
  const qc = useQueryClient();
  const updateStatus = useServerFn(updateLicenseStatus);
  const extend = useServerFn(extendLicense);
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return licenses;
    return licenses.filter((l) =>
      [l.username, l.client_email, l.key, l.expert_advisors?.name].some((v) =>
        v?.toLowerCase().includes(term)
      )
    );
  }, [licenses, q]);

  const mRevoke = useMutation({
    mutationFn: (id: string) => updateStatus({ data: { id, status: "revoked" } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["licenses"] }); toast.success("Revoked"); },
  });
  const mExtend = useMutation({
    mutationFn: (id: string) => extend({ data: { id, days: 30 } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["licenses"] }); toast.success("Extended by 30 days"); },
  });

  const exportCsv = () => {
    const rows = [
      ["Username", "Email", "EA", "Plan", "Key", "Status", "Expires", "Created"],
      ...filtered.map((l) => [
        l.username, l.client_email || "", l.expert_advisors?.name || "", l.plan,
        l.key, statusOf(l), new Date(l.expires_at).toISOString(), new Date(l.created_at).toISOString(),
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `algopro-clients-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <PageHeader title="Clients" subtitle={`${licenses.length} licence${licenses.length === 1 ? "" : "s"} issued`}>
        <button onClick={exportCsv} className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium backdrop-blur hover:bg-white/20">
          <Download className="h-4 w-4" /> Export CSV
        </button>
      </PageHeader>
      <div className="p-5 sm:p-8">
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by username, email, key..." className="w-full bg-transparent text-sm outline-none" />
        </div>

        <div className="overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full min-w-[800px] text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3 font-semibold">Username</th>
                <th className="px-4 py-3 font-semibold">EA</th>
                <th className="px-4 py-3 font-semibold">Key</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Expires</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">No clients yet.</td></tr>
              )}
              {filtered.map((l) => {
                const s = statusOf(l);
                const color = s === "active" ? "bg-accent/15 text-accent-foreground" : s === "expired" ? "bg-muted text-muted-foreground" : "bg-destructive/15 text-destructive";
                return (
                  <tr key={l.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3">
                      <div className="font-medium">{l.username}</div>
                      {l.client_email && <div className="text-xs text-muted-foreground">{l.client_email}</div>}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{l.expert_advisors?.name || "—"}</td>
                    <td className="px-4 py-3 font-mono text-xs">{l.key}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold uppercase ${color}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${s === "active" ? "bg-accent" : s === "expired" ? "bg-muted-foreground" : "bg-destructive"}`} />
                        {s}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{new Date(l.expires_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => mExtend.mutate(l.id)} className="rounded-md border border-border bg-background px-2.5 py-1 text-xs font-medium hover:bg-secondary">Extend</button>
                        {s !== "revoked" && (
                          <button onClick={() => mRevoke.mutate(l.id)} className="rounded-md bg-destructive/10 px-2.5 py-1 text-xs font-medium text-destructive hover:bg-destructive/20">Revoke</button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
