import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useQuery, queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Bot, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/portal/PageHeader";
import { listEAs, createEA, deleteEA } from "@/lib/portal.functions";

const easQ = queryOptions({ queryKey: ["eas"], queryFn: () => listEAs() });

function compressImage(file: File, maxDim = 600, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("read failed"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("decode failed"));
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("no canvas"));
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export const Route = createFileRoute("/_authenticated/portal/eas")({
  component: EAsRoute,
});

function EAsRoute() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return pathname === "/portal/eas" || pathname === "/portal/eas/" ? <EAsPage /> : <Outlet />;
}

function EAsPage() {
  const { data: eas = [], isLoading } = useQuery(easQ);
  const qc = useQueryClient();
  const create = useServerFn(createEA);
  const del = useServerFn(deleteEA);
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

  const delM = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["eas"] });
      toast.success("EA deleted");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to delete"),
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

          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">EA Image (shown in mobile app)</label>
            <input
              type="file"
              accept="image/*"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                if (!f.type.startsWith("image/")) { toast.error("Pick an image file"); return; }
                if (f.size > 10 * 1024 * 1024) { toast.error("Image too large (max 10MB)"); return; }
                try {
                  const dataUrl = await compressImage(f, 600, 0.82);
                  setImage(dataUrl);
                } catch (err) {
                  toast.error("Couldn't read image");
                }
              }}
              className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-accent file:px-3 file:py-2 file:text-xs file:font-semibold file:text-accent-foreground"
            />
            {image && (
              <div className="flex items-center gap-3">
                <img src={image} alt="preview" className="h-20 w-20 rounded-lg object-cover ring-1 ring-border" />
                <button type="button" onClick={() => setImage("")} className="text-xs text-muted-foreground hover:text-foreground underline">Remove</button>
              </div>
            )}
          </div>

          <button type="submit" disabled={m.isPending} className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground hover:opacity-90 disabled:opacity-50">
            <Plus className="h-4 w-4" /> Add Expert Advisor
          </button>
        </form>

        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="mb-4 font-semibold">Your Expert Advisors</h2>
          {isLoading ? (
            <div className="grid place-items-center py-12 text-center text-sm text-muted-foreground">Loading Expert Advisors...</div>
          ) : eas.length === 0 ? (
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
