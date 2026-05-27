import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Bot, Plus } from "lucide-react";
import { PageHeader } from "@/components/portal/PageHeader";
import { listEAs, createEA } from "@/lib/portal.functions";

const easQ = queryOptions({ queryKey: ["eas"], queryFn: () => listEAs() });

export const Route = createFileRoute("/_authenticated/portal/eas")({
  loader: ({ context }) => context.queryClient.ensureQueryData(easQ),
  component: EAsPage,
});

function EAsPage() {
  const { data: eas } = useSuspenseQuery(easQ);
  const qc = useQueryClient();
  const create = useServerFn(createEA);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [file, setFile] = useState("");
  const [image, setImage] = useState("");

  const m = useMutation({
    mutationFn: (v: { name: string; description?: string; file_url?: string; image_url?: string }) => create({ data: v }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["eas"] });
      setName(""); setDesc(""); setFile(""); setImage("");
      toast.success("EA added");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  return (
    <div>
      <PageHeader title="Expert Advisors" subtitle="Add the EAs you want to license and host." />
      <div className="grid gap-5 p-5 sm:p-8 lg:grid-cols-[1fr_2fr]">
        <form onSubmit={(e) => { e.preventDefault(); if (!name.trim()) return; m.mutate({ name, description: desc, file_url: file, image_url: image }); }} className="space-y-4 rounded-2xl border border-border bg-card p-6 h-fit">
          <h2 className="font-semibold">Add New EA</h2>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="EA Name (e.g. Ultra Space Prime)" maxLength={100} required className="input" />
          <textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Description" rows={3} maxLength={500} className="input" />
          <input value={file} onChange={(e) => setFile(e.target.value)} placeholder="File URL (.ex5 / .ex4)" maxLength={500} className="input" />
          <input value={image} onChange={(e) => setImage(e.target.value)} placeholder="Image URL (shown in mobile app)" maxLength={500} className="input" />
          {image && <img src={image} alt="preview" className="h-24 w-24 rounded-lg object-cover" />}
          <button type="submit" disabled={m.isPending} className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground hover:opacity-90 disabled:opacity-50">
            <Plus className="h-4 w-4" /> Add Expert Advisor
          </button>
        </form>

        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="mb-4 font-semibold">Your Expert Advisors</h2>
          {eas.length === 0 ? (
            <div className="grid place-items-center py-12 text-center">
              <Bot className="mb-3 h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No EAs yet — add your first on the left.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="py-2 pr-3 font-semibold">Name</th>
                    <th className="py-2 pr-3 font-semibold">Symbols</th>
                    <th className="py-2 pr-3 font-semibold">Added</th>
                    <th className="py-2 font-semibold"></th>
                  </tr>
                </thead>
                <tbody>
                  {eas.map((ea) => (
                    <tr key={ea.id} className="border-b border-border last:border-0">
                      <td className="py-3 pr-3 font-medium">{ea.name}</td>
                      <td className="py-3 pr-3 text-muted-foreground">{(ea.symbols ?? []).length}</td>
                      <td className="py-3 pr-3 text-muted-foreground">{new Date(ea.created_at).toLocaleDateString()}</td>
                      <td className="py-3 text-right">
                        <Link to="/portal/eas/$eaId/symbols" params={{ eaId: ea.id }} className="text-sm font-medium text-primary hover:underline">
                          Manage symbols
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      <style>{`.input{width:100%;border:1px solid var(--border);border-radius:.5rem;padding:.625rem .875rem;font-size:.875rem;background:var(--background);outline:none}.input:focus{border-color:var(--primary)}`}</style>
    </div>
  );
}
