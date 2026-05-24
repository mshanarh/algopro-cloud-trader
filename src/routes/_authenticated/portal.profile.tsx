import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { User } from "lucide-react";
import { getDashboard, updateProfile } from "@/lib/portal.functions";

const dashQ = queryOptions({ queryKey: ["dashboard"], queryFn: () => getDashboard() });

export const Route = createFileRoute("/_authenticated/portal/profile")({
  loader: ({ context }) => context.queryClient.ensureQueryData(dashQ),
  component: ProfilePage,
});

function ProfilePage() {
  const { data } = useSuspenseQuery(dashQ);
  const qc = useQueryClient();
  const update = useServerFn(updateProfile);
  const p = data.profile;
  const [fullName, setFullName] = useState(p?.full_name ?? "");
  const [displayName, setDisplayName] = useState(p?.display_name ?? "");
  const [avatar, setAvatar] = useState(p?.avatar_url ?? "");

  const m = useMutation({
    mutationFn: (v: { full_name: string; display_name: string; avatar_url: string }) => update({ data: v }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Profile updated");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 2 * 1024 * 1024) return toast.error("Image must be under 2MB");
    const reader = new FileReader();
    reader.onload = () => setAvatar(reader.result as string);
    reader.readAsDataURL(f);
  };

  return (
    <div>
      <div className="relative h-40 bg-[image:var(--gradient-navy)] sm:h-48" />
      <div className="mx-auto -mt-16 max-w-2xl px-5 pb-10 sm:px-8">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-elegant)] sm:p-8">
          <div className="-mt-16 mb-6 flex flex-col items-center sm:flex-row sm:items-end sm:gap-5">
            <label className="cursor-pointer">
              <div className="grid h-24 w-24 place-items-center overflow-hidden rounded-full border-4 border-card bg-secondary shadow-lg">
                {avatar ? <img src={avatar} alt="" className="h-full w-full object-cover" /> : <User className="h-10 w-10 text-muted-foreground" />}
              </div>
              <input type="file" accept="image/*" className="hidden" onChange={onFile} />
            </label>
            <div className="mt-3 text-center sm:mt-0 sm:text-left">
              <div className="text-lg font-bold">{displayName || "Trader"}</div>
              <div className="text-xs text-muted-foreground">Mentor ID: <span className="font-mono">{p?.mentor_id}</span></div>
            </div>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); m.mutate({ full_name: fullName, display_name: displayName, avatar_url: avatar }); }} className="space-y-4">
            <Field label="Full name">
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} maxLength={100} className="input" />
            </Field>
            <Field label="Display name">
              <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={50} className="input" />
            </Field>
            <button disabled={m.isPending} className="w-full rounded-lg bg-[image:var(--gradient-purple)] px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-elegant)] disabled:opacity-50">
              {m.isPending ? "Saving..." : "Save changes"}
            </button>
          </form>
        </div>
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
