import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({
  broker: z.string().trim().max(100).optional(),
  server: z.string().trim().min(2).max(100),
  login: z.string().trim().min(3).max(50),
  password: z.string().trim().min(3).max(100),
  platform: z.enum(["mt4", "mt5"]).default("mt5"),
  symbol: z.string().trim().min(2).max(20),
  side: z.enum(["BUY", "SELL"]),
  lot: z.number().min(0.01).max(100),
  trades: z.number().int().min(1).max(50),
  sl: z.number().optional(),
  tp: z.number().optional(),
});

type Placed = { ticket: number | string; error?: string };
type MAAccount = { _id?: string; id?: string; login?: string; server?: string; state?: string; region?: string };

const PROVISIONING = "https://mt-provisioning-api-v1.agiliumtrade.agiliumtrade.ai";

async function maFetch(url: string, token: string, init?: RequestInit, timeoutMs = 12000) {
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
async function resolveAccountId(
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

async function waitConnected(base: string, id: string, token: string, ms: number) {
  const deadline = Date.now() + ms;
  while (Date.now() < deadline) {
    const r = await maFetch(`${base}/users/current/accounts/${id}/status`, token);
    const state = r.body["connected"];
    if (r.ok && state === true) return true;
    await new Promise((res) => setTimeout(res, 2000));
  }
  return false;
}

export const executeLiveTrades = createServerFn({ method: "POST" })
  .inputValidator((d) => Input.parse(d))
  .handler(async ({ data }) => {
    const token = process.env["METAAPI_TOKEN"];
    if (!token) {
      return { ok: false as const, reason: "Live trading not configured.", placed: [] as Placed[], filled: 0, total: data.trades };
    }
    const region = process.env["METAAPI_REGION"] || "new-york";
    const base = `https://mt-client-api-v1.${region}.agiliumtrade.ai`;

    const resolved = await resolveAccountId(token, region, {
      server: data.server,
      login: data.login,
      password: data.password,
      platform: data.platform,
      ...(data.broker ? { broker: data.broker } : {}),
    });
    if ("error" in resolved) {
      return { ok: false as const, reason: resolved.error, placed: [] as Placed[], filled: 0, total: data.trades };
    }
    const accountId = resolved.id;

    // Newly provisioned accounts take a moment to connect to the broker.
    await waitConnected(base, accountId, token, 45000);

    const url = `${base}/users/current/accounts/${accountId}/trade`;
    const placed: Placed[] = [];
    for (let i = 0; i < data.trades; i++) {
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { "auth-token": token, "Content-Type": "application/json" },
          body: JSON.stringify({
            actionType: data.side === "BUY" ? "ORDER_TYPE_BUY" : "ORDER_TYPE_SELL",
            symbol: data.symbol,
            volume: data.lot,
            ...(data.sl ? { stopLoss: data.sl } : {}),
            ...(data.tp ? { takeProfit: data.tp } : {}),
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
      total: data.trades,
      reason: success.length === 0 ? placed[0]?.error ?? "All orders rejected" : undefined,
    };
  });
