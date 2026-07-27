import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Clock, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/pending")({
  component: PendingPage,
  head: () => ({ meta: [{ title: "Awaiting approval — EA Force Portal" }] }),
});

function PendingPage() {
  const navigate = useNavigate();
  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  };
  return (
    <main className="grid min-h-screen place-items-center bg-[image:var(--gradient-navy)] px-5 py-10">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/95 p-8 text-center shadow-2xl">
        <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-amber-100">
          <Clock className="h-8 w-8 text-amber-600" />
        </div>
        <h1 className="text-2xl font-bold">Waiting for admin approval</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your account has been created. An administrator will review and approve it shortly. You'll be able to access the portal once approved.
        </p>
        <button
          onClick={signOut}
          className="mt-6 inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium hover:bg-secondary"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </button>
        <div className="mt-4">
          <Link to="/" className="text-xs text-muted-foreground hover:underline">← Back to landing page</Link>
        </div>
      </div>
    </main>
  );
}
