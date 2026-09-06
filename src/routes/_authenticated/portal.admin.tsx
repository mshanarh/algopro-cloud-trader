import { createFileRoute, redirect } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { useState } from "react";
import { Check, X, Mail } from "lucide-react";
import { PageHeader } from "@/components/portal/PageHeader";
import { adminListUsers, adminUpdateUser, adminReactivateByEmail, getMyStatus } from "@/lib/portal.functions";

const usersQ = queryOptions({ queryKey: ["admin", "users"], queryFn: () => adminListUsers() });

export const Route = createFileRoute("/_authenticated/portal/admin")({
  loader: async ({ context }) => {
    const status = await getMyStatus();
    if (!status.is_admin) throw redirect({ to: "/portal" });
    await context.queryClient.ensureQueryData(usersQ);
  },
  component: AdminPage,
});

function AdminPage() {
  const { data: users } = useSuspenseQuery(usersQ);
  const qc = useQueryClient();
  const update = useServerFn(adminUpdateUser);
  const reactivate = useServerFn(adminReactivateByEmail);
  const [reEmail, setReEmail] = useState("");
  const m = useMutation({
    mutationFn: (v: { user_id: string; approved?: boolean; license_limit?: number }) => update({ data: v }),
    onSuccess: (r, v) => {
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
      if (v.approved === true) toast.success(r.emailed ? "Approved · activation email sent" : "Approved · email could not be sent");
      else if (v.approved === false) toast.success("Rejected — account set back to pending");
      else toast.success("Updated");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const reM = useMutation({
    mutationFn: (email: string) => reactivate({ data: { email, activations: 1 } }),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
      toast.success(`Reactivated · portal ${r.portal_approved ? "approved" : "n/a"} · ${r.licences_reactivated} licence(s)`);
      setReEmail("");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  return (
    <div>
      <PageHeader title="Admin · User Management" subtitle="Approve sign-ups, set licence limits, and reactivate clients by email." />
      <div className="space-y-6 p-5 sm:p-8">
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
            <Mail className="h-4 w-4" /> Reactivate by email
          </div>
          <p className="mb-3 text-xs text-muted-foreground">
            Approves the portal account (if it exists) and resets every licence issued to this email so the client can open the mobile app one more time.
          </p>
          <form
            onSubmit={(e) => { e.preventDefault(); if (reEmail) reM.mutate(reEmail.trim()); }}
            className="flex flex-col gap-2 sm:flex-row"
          >
            <input
              type="email"
              required
              value={reEmail}
              onChange={(e) => setReEmail(e.target.value)}
              placeholder="client@example.com"
              className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={reM.isPending}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
            >
              {reM.isPending ? "Working..." : "Reactivate"}
            </button>
          </form>
        </div>
        <div className="overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left">User</th>
                <th className="px-4 py-3 text-left">Contact</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Licence limit</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => <UserRow key={u.id} u={u} onSave={(v) => m.mutate({ user_id: u.id, ...v })} pending={m.isPending} />)}
              {users.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No users yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

type User = Awaited<ReturnType<typeof adminListUsers>>[number];

function UserRow({ u, onSave, pending }: { u: User; onSave: (v: { approved?: boolean; license_limit?: number }) => void; pending: boolean }) {
  const [limit, setLimit] = useState(u.license_limit);
  return (
    <tr className="border-t border-border">
      <td className="px-4 py-3">
        <div className="font-medium">{u.display_name || u.full_name || "—"}</div>
        <div className="text-xs text-muted-foreground">{u.full_name}</div>
      </td>
      <td className="px-4 py-3 text-xs">
        <div>{u.email || "—"}</div>
        <div>{u.mobile || "—"}</div>
        <div className="text-muted-foreground">{u.tiktok_url || u.instagram_url || ""}</div>
      </td>

      <td className="px-4 py-3">
        {u.approved ? (
          <span className="rounded-full bg-accent/15 px-2.5 py-1 text-xs font-medium text-accent-foreground">Approved</span>
        ) : (
          <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800">Pending</span>
        )}
      </td>
      <td className="px-4 py-3">
        <input
          type="number"
          min={0}
          max={100000}
          value={limit}
          onChange={(e) => setLimit(parseInt(e.target.value) || 0)}
          className="w-24 rounded-md border border-input bg-background px-2 py-1 text-sm"
        />
      </td>
      <td className="px-4 py-3">
        <div className="flex justify-end gap-2">
          {limit !== u.license_limit && (
            <button onClick={() => onSave({ license_limit: limit })} disabled={pending}
              className="rounded-md bg-primary px-2.5 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90">
              Save limit
            </button>
          )}
          {!u.approved ? (
            <button onClick={() => onSave({ approved: true })} disabled={pending}
              className="inline-flex items-center gap-1 rounded-md bg-accent px-2.5 py-1.5 text-xs font-semibold text-accent-foreground hover:opacity-90">
              <Check className="h-3 w-3" /> Approve
            </button>
          ) : (
            <button onClick={() => onSave({ approved: false })} disabled={pending}
              className="inline-flex items-center gap-1 rounded-md border border-destructive/30 px-2.5 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/10">
              <X className="h-3 w-3" /> Revoke
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}
