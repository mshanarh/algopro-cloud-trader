export type Placed = { ticket: number | string; error?: string };
type MAAccount = { _id?: string; id?: string; login?: string; server?: string; state?: string; region?: string };

export const PROVISIONING = "https://mt-provisioning-api-v1.agiliumtrade.agiliumtrade.ai";

export async function maFetch(url: string, token: string, init?: RequestInit, timeoutMs = 12000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      ...init,
      signal: ctrl.signal,
      headers: { "auth-token": token, "Content-Type": "application/json", ...(init?.headers ?? {}) },
    });
    const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    return { ok: res.ok, status: res.status, body };
  } catch {
    return { ok: false, status: 408, body: {} as Record<string, unknown> };
  } finally {
    clearTimeout(t);
  }
}

/**
 * Finds (or provisions) a MetaApi account for the given broker credentials
 * using the platform-owned MetaApi token — clients never supply anything.
 */
export async function resolveAccountId(
  token: string,
  region: string,
  d: { server: string; login: string; password: string; platform: "mt4" | "mt5"; broker?: string },
): Promise<{ id: string } | { error: string }> {
  const list = await maFetch(`${PROVISIONING}/users/current/accounts`, token);
  if (!list.ok) {
    if (list.status === 401) {
      return { error: "Live trading token is invalid or expired. Please update the MetaApi token in EA Force settings." };
    }
    return { error: `MetaApi accounts lookup failed (${list.status})` };
  }
  const accounts = (Array.isArray(list.body) ? list.body : []) as MAAccount[];
  const match = accounts.find(
    (a) => String(a.login ?? "") === d.login && (a.server ?? "").toLowerCase() === d.server.toLowerCase(),
  );
  if (match) {
    const id = match._id ?? match.id;
    if (id) {
      if (match.state !== "DEPLOYED") {
        await maFetch(`${PROVISIONING}/users/current/accounts/${id}/deploy`, token, { method: "POST" });
      }
      return { id };
    }
  }

  const create = await maFetch(`${PROVISIONING}/users/current/accounts`, token, {
    method: "POST",
    body: JSON.stringify({
      name: `EAForce-${d.login}`,
      type: "cloud-g2",
      login: d.login,
      password: d.password,
      server: d.server,
      platform: d.platform,
      magic: 0,
      region,
      keywords: d.broker ? [d.broker] : undefined,
    }),
  });
  if (!create.ok) {
    const msg = (create.body["message"] as string) || `MetaApi account creation failed (${create.status})`;
    return { error: msg };
  }
  const id = (create.body["id"] as string) || (create.body["_id"] as string);
  if (!id) return { error: "MetaApi did not return an account id" };
  return { id };
}

export async function waitConnected(base: string, id: string, token: string, ms: number) {
  const deadline = Date.now() + ms;
  while (Date.now() < deadline) {
    const r = await maFetch(`${base}/users/current/accounts/${id}/status`, token);
    const state = r.body["connected"];
    if (r.ok && state === true) return true;
    await new Promise((res) => setTimeout(res, 2000));
  }
  return false;
}

export function clientBase(region: string) {
  return `https://mt-client-api-v1.${region}.agiliumtrade.ai`;
}

export type LinkResult =
  | { ok: true; balance: number; equity: number; currency: string; name: string; leverage?: number; login: string; server: string }
  | { ok: false; reason: string };

export async function linkBroker(d: {
  broker?: string;
  server: string;
  login: string;
  password: string;
  platform: "mt4" | "mt5";
}): Promise<LinkResult> {
  const token = process.env["METAAPI_TOKEN"];
  if (!token) return { ok: false, reason: "Live trading is not configured yet." };
  const region = process.env["METAAPI_REGION"] || "new-york";
  const base = clientBase(region);

  const resolved = await resolveAccountId(token, region, {
    server: d.server,
    login: d.login,
    password: d.password,
    platform: d.platform,
    ...(d.broker ? { broker: d.broker } : {}),
  });
  if ("error" in resolved) return { ok: false, reason: resolved.error };

  // Fast path: poll account-information directly — it succeeds as soon as the
  // broker connection is up, usually within a couple of seconds.
  const deadline = Date.now() + 22000;
  let info = await maFetch(`${base}/users/current/accounts/${resolved.id}/account-information`, token, undefined, 8000);
  while (!info.ok && Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 700));
    info = await maFetch(`${base}/users/current/accounts/${resolved.id}/account-information`, token, undefined, 8000);
  }
  if (!info.ok) {
    return { ok: false, reason: "Broker did not respond. Check your server, login and password, then link again." };
  }

  const b = info.body as Record<string, unknown>;
  return {
    ok: true,
    balance: Number(b["balance"] ?? 0),
    equity: Number(b["equity"] ?? 0),
    currency: String(b["currency"] ?? "USD"),
    name: String(b["name"] ?? ""),
    leverage: b["leverage"] ? Number(b["leverage"]) : undefined,
    login: d.login,
    server: d.server,
  };
}

export async function placeOrders(d: {
  server: string;
  login: string;
  password: string;
  platform: "mt4" | "mt5";
  broker?: string;
  symbol: string;
  side: "BUY" | "SELL";
  lot: number;
  trades: number;
  sl?: number;
  tp?: number;
}) {
  const token = process.env["METAAPI_TOKEN"];
  if (!token) {
    return { ok: false as const, reason: "Live trading not configured.", placed: [] as Placed[], filled: 0, total: d.trades };
  }
  const region = process.env["METAAPI_REGION"] || "new-york";
  const base = clientBase(region);

  const resolved = await resolveAccountId(token, region, {
    server: d.server,
    login: d.login,
    password: d.password,
    platform: d.platform,
    ...(d.broker ? { broker: d.broker } : {}),
  });
  if ("error" in resolved) {
    return { ok: false as const, reason: resolved.error, placed: [] as Placed[], filled: 0, total: d.trades };
  }
  const accountId = resolved.id;

  const connected = await waitConnected(base, accountId, token, 25000);
  if (!connected) {
    return {
      ok: false as const,
      reason: "Your trading account is still connecting to the broker. Please wait a minute and press execute again.",
      placed: [] as Placed[],
      filled: 0,
      total: d.trades,
    };
  }

  const url = `${base}/users/current/accounts/${accountId}/trade`;
  const placed: Placed[] = [];
  for (let i = 0; i < d.trades; i++) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "auth-token": token, "Content-Type": "application/json" },
        body: JSON.stringify({
          actionType: d.side === "BUY" ? "ORDER_TYPE_BUY" : "ORDER_TYPE_SELL",
          symbol: d.symbol,
          volume: d.lot,
          ...(d.sl ? { stopLoss: d.sl } : {}),
          ...(d.tp ? { takeProfit: d.tp } : {}),
          comment: "EAForce",
        }),
      });
      const j = (await res.json().catch(() => ({}))) as {
        orderId?: string | number;
        positionId?: string | number;
        message?: string;
        stringCode?: string;
      };
      if (!res.ok) {
        placed.push({ ticket: 0, error: j.message || j.stringCode || `HTTP ${res.status}` });
      } else {
        placed.push({ ticket: j.orderId ?? j.positionId ?? 0 });
      }
    } catch (e) {
      placed.push({ ticket: 0, error: e instanceof Error ? e.message : "Network error" });
    }
  }

  const success = placed.filter((p) => !p.error);
  return {
    ok: success.length > 0,
    placed,
    filled: success.length,
    total: d.trades,
    reason: success.length === 0 ? placed[0]?.error ?? "All orders rejected" : undefined,
  };
}
