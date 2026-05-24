import { createFileRoute, Link, useNavigate, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

export const Route = createFileRoute("/login")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ to: "/portal" });
  },
  component: LoginPage,
  head: () => ({ meta: [{ title: "Sign in — Algopro Portal" }] }),
});

function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [mobile, setMobile] = useState("");
  const [tiktokUrl, setTiktokUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin + "/portal",
            data: {
              full_name: fullName,
              display_name: displayName || fullName,
              mobile,
              tiktok_url: tiktokUrl,
              instagram_url: instagramUrl,
            },
          },
        });
        if (error) throw error;
        if (!data.session) {
          // No session = email confirmation required. Try sign-in anyway in case auto-confirm is on.
          const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
          if (signInErr) {
            toast.success("Account created! Check your email to confirm.");
            setMode("signin");
            return;
          }
        }
        toast.success("Welcome Master");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome Master");
      }
      navigate({ to: "/portal" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const onGoogle = async () => {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + "/portal",
    });
    if (result.error) toast.error("Google sign-in failed");
  };

  const inputCls =
    "w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-primary";

  return (
    <main className="grid min-h-screen place-items-center bg-[image:var(--gradient-navy)] px-5 py-10">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-6 flex items-center justify-center gap-2 text-white">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-[image:var(--gradient-purple)] font-black">A</span>
          <span className="text-xl font-bold">Algopro</span>
        </Link>
        <div className="rounded-2xl border border-white/10 bg-white/95 p-7 shadow-2xl backdrop-blur">
          <div className="mb-5 flex rounded-lg bg-secondary p-1 text-sm font-medium">
            <button
              type="button"
              onClick={() => setMode("signin")}
              className={`flex-1 rounded-md py-2 transition ${mode === "signin" ? "bg-background shadow" : "text-muted-foreground"}`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`flex-1 rounded-md py-2 transition ${mode === "signup" ? "bg-background shadow" : "text-muted-foreground"}`}
            >
              Sign up
            </button>
          </div>

          <h1 className="text-2xl font-bold tracking-tight">
            {mode === "signin" ? "Welcome back" : "Create your portal"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "signin" ? "Sign in to manage your EAs and licences." : "Start hosting EAs and issuing licences."}
          </p>

          <button
            onClick={onGoogle}
            type="button"
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium hover:bg-secondary"
          >
            <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.83z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/></svg>
            Continue with Google
          </button>

          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={onSubmit} className="space-y-3">
            {mode === "signup" && (
              <>
                <input type="text" placeholder="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} required className={inputCls} />
                <input type="text" placeholder="Display name (shown to clients)" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required className={inputCls} />
                <input type="tel" placeholder="Mobile number" value={mobile} onChange={(e) => setMobile(e.target.value)} required className={inputCls} />
                <input type="url" placeholder="TikTok URL (https://...)" value={tiktokUrl} onChange={(e) => setTiktokUrl(e.target.value)} className={inputCls} />
                <input type="url" placeholder="Instagram URL (https://...)" value={instagramUrl} onChange={(e) => setInstagramUrl(e.target.value)} className={inputCls} />
              </>
            )}
            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required className={inputCls} />
            <input type="password" placeholder="Password (min 6 chars)" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className={inputCls} />
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-[image:var(--gradient-purple)] px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-elegant)] disabled:opacity-60"
            >
              {loading ? "Please wait..." : mode === "signin" ? "Sign in" : "Sign up"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
