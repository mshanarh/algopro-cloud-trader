import { isAutoApprovedEmail } from "./auto-approval";

/**
 * Local-only session for the platform owner while Supabase auth is not wired up.
 * It never touches the network — it simply lets the allowlisted account open the
 * mentor portal in the browser.
 */
const STORAGE_KEY = "eavault.local-session";

export type LocalSession = { email: string; name: string; startedAt: string };

function storage(): Storage | null {
  try {
    if (typeof window === "undefined") return null;
    return window.localStorage;
  } catch {
    return null;
  }
}

export function startLocalSession(email: string, name: string): LocalSession | null {
  const store = storage();
  if (!store) return null;
  const session: LocalSession = {
    email: email.trim().toLowerCase(),
    name: name.trim() || "Mentor",
    startedAt: new Date().toISOString(),
  };
  store.setItem(STORAGE_KEY, JSON.stringify(session));
  return session;
}

export function getLocalSession(): LocalSession | null {
  const store = storage();
  if (!store) return null;
  try {
    const raw = store.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<LocalSession>;
    if (!isAutoApprovedEmail(parsed?.email)) return null;
    return {
      email: String(parsed.email),
      name: parsed.name || "Mentor",
      startedAt: parsed.startedAt || "",
    };
  } catch {
    return null;
  }
}

export function isLocalOwnerSession(): boolean {
  return getLocalSession() !== null;
}

export function endLocalSession(): void {
  storage()?.removeItem(STORAGE_KEY);
}
