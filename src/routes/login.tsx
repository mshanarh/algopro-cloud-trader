import { createFileRoute, Link, useNavigate, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AlertCircle, CheckCircle2, LogIn, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { claimSignupApproval, notifyRegistrationPending } from "@/lib/portal.functions";
import { isAutoApprovedEmail } from "@/lib/auto-approval";
import { getLocalSession, startLocalSession } from "@/lib/local-session";
import { PlatformLogo } from "@/components/PlatformLogo";

export const Route = createFileRoute("/login")({
  validateSearch: (search) => ({
    redirect: typeof search.redirect === "string" && search.redirect.startsWith("/") ? search.redirect : "/portal",
  }),
  beforeLoad: async ({ search }) => {
    if (getLocalSession()) throw redirect({ to: "/portal" });
    let hasSession = false;
    try {
      const { data } = await supabase.auth.getSession();
      hasSession = !!data.session;
    } catch {
      // Supabase is not configured on this deployment yet.
    }
    if (hasSession) throw redirect({ to: search.redirect });
  },
  component: LoginPage,
  head: () => ({ meta: [{ title: "Sign in — EA Vault Portal" }] }),
});

const inputCls =
  "w-full rounded-full border border-border bg-secondary/40 px-5 py-3.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all duration-300 focus:border-brand focus:bg-secondary/60 focus:ring-2 focus:ring-brand/30";

const labelCls = "mb-2 block text-[10px] font-bold uppercase tracking-[0.22em] text-brand";

function Field({
  label,
  action,
  children,
}: {
  label: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-end justify-between gap-3">
        <label className={labelCls}>{label}</label>
        {action}
      </div>
      {children}
    </div>
  );
}

function LoginPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [mobile, setMobile] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<
    { kind: "error" | "info"; message: string; action?: "reset" | "resend" } | null
  >(null);

  const enterPortal = async (welcome: string) => {
    await claimSignupApproval().catch(() => null);
    toast.success(welcome);
    navigate({ to: search.redirect || "/portal", replace: true });
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotice(null);
    if (mode === "signup") {
      if (!agreed) {
        toast.error("Please accept the Terms and Privacy Policy");
        return;
      }
      if (password !== confirmPassword) {
        toast.error("Passwords do not match");
        return;
      }
    }

    // Owner account: open the mentor portal locally, without Supabase.
    if (isAutoApprovedEmail(email)) {
      startLocalSession(email, displayName || fullName || "Mentor");
      toast.success("Welcome to your mentor portal");
      navigate({ to: "/portal", replace: true });
      return;
    }

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
              username,
              mobile,
            },
          },
        });

        // The email may already exist from an earlier attempt. Try the password
        // they just typed before telling them anything is wrong.
        if (error && /already registered|already exists|user_already_exists/i.test(error.message)) {
          const { error: retryErr } = await supabase.auth.signInWithPassword({ email, password });
          if (!retryErr) {
            await enterPortal("You already have an account — signed you in");
            return;
          }
          setMode("signin");
          setNotice({
            kind: "error",
            message:
              "This email is already registered, but that password didn't work. Reset it below, or sign in.",
            action: "reset",
          });
          return;
        }
        if (error) throw error;

        if (!data.session) {
          const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
          if (signInErr) {
            setMode("signin");
            setNotice({
              kind: "info",
              message: "Account created — confirm your email address, then sign in.",
              action: "resend",
            });
            return;
          }
        }

        const approval = await claimSignupApproval().catch(() => null);
        if (approval?.approved) {
          toast.success("Account created and approved — welcome!");
          navigate({ to: "/portal", replace: true });
          return;
        }

        try { await notifyRegistrationPending(); } catch { /* email is best-effort */ }
        toast.success("Account created — waiting for admin approval");

        navigate({ to: "/pending", replace: true });
        return;
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        // Covers accounts created before auto-approval existed.
        await enterPortal("Welcome Master");
        return;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Authentication failed";
      if (/invalid login credentials/i.test(message)) {
        setNotice({
          kind: "error",
          message: "Incorrect email or password for this account.",
          action: "reset",
        });
      } else if (/email not confirmed/i.test(message)) {
        setNotice({
          kind: "info",
          message: "Confirm your email address before signing in.",
          action: "resend",
        });
      } else {
        toast.error(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const resendConfirmation = async () => {
    if (!email.trim()) {
      toast.error("Enter your email address first");
      return;
    }
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin + "/portal" },
    });
    if (error) toast.error(error.message);
    else toast.success("Confirmation email sent — check your inbox");
  };

  const onGoogle = async () => {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + "/portal",
    });
    if (result.error) toast.error("Google sign-in failed");
  };

  const onForgotPassword = async () => {
    if (!email.trim()) {
      toast.error("Enter your email address first");
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: window.location.origin + "/login",
    });
    if (error) toast.error(error.message);
    else toast.success("Password reset link sent to your email");
  };

  return (
    <main className="dark relative min-h-screen overflow-hidden bg-background px-5 py-10 text-foreground">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[-180px] h-[460px] w-[460px] -translate-x-1/2 rounded-full opacity-40 blur-[110px]"
        style={{ background: "radial-gradient(closest-side, var(--brand), transparent)" }}
      />

      <div className="relative mx-auto flex w-full max-w-md flex-col">
        <div className="flex flex-col items-center text-center">
          <PlatformLogo className="h-24 w-24" />
          <h1 className="ea-rise mt-5 text-4xl font-black tracking-tight">
            <span className="text-foreground">EA</span> <span className="text-brand">Vault</span>
          </h1>
          <p className="ea-rise ea-rise-1 mt-2 text-[10px] font-bold uppercase tracking-[0.32em] text-brand">
            Premium EA hosting &amp; bot management
          </p>
        </div>

        <div className="ea-rise ea-rise-2 mt-7 grid grid-cols-2 gap-1 rounded-full border border-border bg-secondary/40 p-1.5">
          <button
            type="button"
            onClick={() => { setMode("signin"); setNotice(null); }}
            aria-pressed={mode === "signin"}
            className={`rounded-full py-3 text-xs font-bold uppercase tracking-[0.2em] transition-all duration-300 ${
              mode === "signin"
                ? "bg-brand text-brand-foreground shadow-[var(--brand-glow)]"
                : "text-brand/60 hover:text-brand"
            }`}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => { setMode("signup"); setNotice(null); }}
            aria-pressed={mode === "signup"}
            className={`rounded-full py-3 text-xs font-bold uppercase tracking-[0.2em] transition-all duration-300 ${
              mode === "signup"
                ? "bg-brand text-brand-foreground shadow-[var(--brand-glow)]"
                : "text-brand/60 hover:text-brand"
            }`}
          >
            Register
          </button>
        </div>

        {notice && (
          <div
            role="alert"
            className={`mt-6 rounded-2xl border p-4 text-sm ${
              notice.kind === "error"
                ? "border-destructive/40 bg-destructive/10 text-destructive"
                : "border-brand/40 bg-brand/10 text-brand"
            }`}
          >
            <div className="flex items-start gap-2.5">
              {notice.kind === "error" ? (
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              ) : (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              )}
              <p className="flex-1 leading-relaxed">{notice.message}</p>
            </div>
            {notice.action === "reset" && (
              <button
                type="button"
                onClick={onForgotPassword}
                className="mt-3 w-full rounded-full bg-brand px-4 py-2.5 text-xs font-bold uppercase tracking-[0.15em] text-brand-foreground transition-all duration-300 hover:brightness-110"
              >
                Email me a reset link
              </button>
            )}
            {notice.action === "resend" && (
              <button
                type="button"
                onClick={resendConfirmation}
                className="mt-3 w-full rounded-full bg-brand px-4 py-2.5 text-xs font-bold uppercase tracking-[0.15em] text-brand-foreground transition-all duration-300 hover:brightness-110"
              >
                Resend confirmation email
              </button>
            )}
          </div>
        )}

        <form onSubmit={onSubmit} className="mt-7 space-y-5">
          {mode === "signup" && (
            <>
              <Field label="First name">
                <input
                  type="text"
                  placeholder="Enter your first name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  autoComplete="given-name"
                  className={inputCls}
                />
              </Field>

              <Field label="Display name">
                <input
                  type="text"
                  placeholder="Name shown on the robot app"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                  className={inputCls}
                />
              </Field>
            </>
          )}

          <Field label={mode === "signup" ? "Email" : "Email address"}>
            <input
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className={inputCls}
            />
          </Field>

          {mode === "signup" && (
            <Field label="Username">
              <input
                type="text"
                placeholder="Choose a username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
                className={inputCls}
              />
            </Field>
          )}

          <Field
            label="Password"
            action={
              mode === "signin" ? (
                <button
                  type="button"
                  onClick={onForgotPassword}
                  className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-brand/80 transition-colors hover:text-brand"
                >
                  Forgot password?
                </button>
              ) : undefined
            }
          >
            <input
              type="password"
              placeholder={mode === "signup" ? "Create a password" : "Enter your password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              className={inputCls}
            />
          </Field>

          {mode === "signup" && (
            <>
              <Field label="Confirm password">
                <input
                  type="password"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className={inputCls}
                />
              </Field>

              <Field label="WhatsApp number">
                <input
                  type="tel"
                  placeholder="e.g. +27 71 234 5678"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  required
                  autoComplete="tel"
                  className={inputCls}
                />
              </Field>

              <label className="flex cursor-pointer items-start gap-2.5 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-brand"
                />
                <span>
                  I agree to the{" "}
                  <a href="#" className="font-semibold text-brand hover:underline">Terms</a>{" "}
                  and{" "}
                  <a href="#" className="font-semibold text-brand hover:underline">Privacy Policy</a>
                </span>
              </label>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="group flex w-full items-center justify-center gap-2 rounded-full bg-brand px-5 py-4 text-sm font-bold uppercase tracking-[0.2em] text-brand-foreground shadow-[var(--brand-glow)] transition-all duration-300 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {mode === "signin" ? (
              <LogIn className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
            ) : (
              <UserPlus className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
            )}
            {loading ? "Please wait..." : mode === "signin" ? "Sign in" : "Create account"}
          </button>

          <button
            type="button"
            onClick={onGoogle}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-border bg-secondary/30 px-5 py-3.5 text-xs font-semibold text-foreground/80 transition-all duration-300 hover:border-brand/40 hover:text-foreground"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.83z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
            </svg>
            Continue with Google
          </button>
        </form>

        <div className="ea-rise ea-rise-3 mt-6 text-center text-sm text-muted-foreground">
          {mode === "signin" ? (
            <Link to="/" className="transition-colors hover:text-foreground">
              Back home
            </Link>
          ) : (
            <span>
              Already registered?{" "}
              <button
                type="button"
                onClick={() => setMode("signin")}
                className="font-semibold text-brand hover:underline"
              >
                Sign in
              </button>
            </span>
          )}
        </div>
      </div>
    </main>
  );
}
