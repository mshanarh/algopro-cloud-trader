import {
  createFileRoute,
  Outlet,
  Link,
  redirect,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";
import { LayoutDashboard, KeyRound, Bot, Users, Settings, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/login" });
  },
  component: PortalLayout,
});

const NAV = [
  { to: "/portal", label: "Dashboard", icon: LayoutDashboard },
  { to: "/portal/generate", label: "Generate Licence", icon: KeyRound },
  { to: "/portal/eas", label: "Expert Advisors", icon: Bot },
  { to: "/portal/clients", label: "Clients", icon: Users },
  { to: "/portal/profile", label: "Profile", icon: Settings },
] as const;

function PortalLayout() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  };

  return (
    <div className="min-h-screen bg-secondary/30">
      {/* Top bar (mobile) */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background px-4 py-3 md:hidden">
        <Link to="/portal" className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-[image:var(--gradient-purple)] text-sm font-black text-primary-foreground">A</span>
          <span className="font-bold">Algopro Portal</span>
        </Link>
        <button onClick={() => setOpen(!open)} aria-label="Menu" className="rounded-md p-2 hover:bg-secondary">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-40 w-64 transform border-r border-border bg-background transition-transform md:sticky md:top-0 md:h-screen md:translate-x-0 ${
            open ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex h-full flex-col">
            <Link to="/portal" className="hidden items-center gap-2 border-b border-border px-5 py-5 md:flex">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-[image:var(--gradient-purple)] text-sm font-black text-primary-foreground">A</span>
              <span className="text-base font-bold">Algopro Portal</span>
            </Link>
            <nav className="flex-1 space-y-1 px-3 py-5">
              {NAV.map((item) => {
                const active = pathname === item.to;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                      active ? "bg-[image:var(--gradient-purple)] text-primary-foreground shadow-[var(--shadow-elegant)]" : "text-foreground/70 hover:bg-secondary"
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <button
              onClick={signOut}
              className="mx-3 mb-5 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        </aside>

        {open && <div onClick={() => setOpen(false)} className="fixed inset-0 z-30 bg-black/40 md:hidden" />}

        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
