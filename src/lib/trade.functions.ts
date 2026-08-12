import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { linkBroker, placeOrders } from "./metaapi.server";

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

const LinkInput = z.object({
  broker: z.string().trim().max(100).optional(),
  server: z.string().trim().min(2).max(100),
  login: z.string().trim().min(3).max(50),
  password: z.string().trim().min(3).max(100),
  platform: z.enum(["mt4", "mt5"]).default("mt5"),
});

export const executeLiveTrades = createServerFn({ method: "POST" })
  .inputValidator((d) => Input.parse(d))
  .handler(async ({ data }) => placeOrders(data));

export const linkBrokerAccount = createServerFn({ method: "POST" })
  .inputValidator((d) => LinkInput.parse(d))
  .handler(async ({ data }) => linkBroker(data));
