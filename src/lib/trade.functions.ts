import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({
  account_id: z.string().trim().min(6).max(100),
  symbol: z.string().trim().min(2).max(20),
  side: z.enum(["BUY", "SELL"]),
  lot: z.number().min(0.01).max(100),
  trades: z.number().int().min(1).max(50),
  sl: z.number().optional(),
  tp: z.number().optional(),
});

type Placed = { ticket: number | string; error?: string };

/**
 * Places live market orders on a MetaTrader 4/5 account through MetaApi.cloud.
 * Requires the METAAPI_TOKEN secret and a provisioned MetaApi account id.
 */
export const executeLiveTrades = createServerFn({ method: "POST" })
  .inputValidator((d) => Input.parse(d))
  .handler(async ({ data }) => {
    const token = process.env["METAAPI_TOKEN"];
    if (!token) {
      return { ok: false as const, reason: "Live trading not configured (missing MetaApi token)." };
    }
    const region = process.env["METAAPI_REGION"] || "new-york";
    const base = `https://mt-client-api-v1.${region}.agiliumtrade.ai`;
    const url = `${base}/users/current/accounts/${data.account_id}/trade`;

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
