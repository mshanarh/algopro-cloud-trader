import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const PlanEnum = z.enum(["3_days", "5_days", "30_days", "3_months", "6_months", "1_year"]);
const PlanDays: Record<z.infer<typeof PlanEnum>, number> = {
  "3_days": 3, "5_days": 5, "30_days": 30,
  "3_months": 90, "6_months": 180, "1_year": 365,
};

export const getDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [profile, licensesAll, eas] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      supabase.from("licenses").select("id,status,expires_at,created_at").eq("owner_id", userId),
      supabase.from("expert_advisors").select("id,name").eq("owner_id", userId),
    ]);
    const all = licensesAll.data ?? [];
    const active = all.filter((l) => l.status === "active" && new Date(l.expires_at) > new Date()).length;
    return {
      profile: profile.data,
      eas: eas.data ?? [],
      stats: { total: all.length, active, eas: (eas.data ?? []).length },
    };
  });

export const listEAs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("expert_advisors").select("*").eq("owner_id", context.userId).order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const createEA = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({
    name: z.string().trim().min(1).max(100),
    description: z.string().trim().max(500).optional(),
    file_url: z.string().trim().max(500).optional(),
  }).parse(input))
  .handler(async ({ context, data }) => {
    const { error, data: row } = await context.supabase
      .from("expert_advisors").insert({ ...data, owner_id: context.userId }).select().single();
    if (error) throw new Error(error.message);
    return row;
  });

export const getEA = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }) => {
    const { data: row, error } = await context.supabase
      .from("expert_advisors").select("*").eq("id", data.id).eq("owner_id", context.userId).single();
    if (error) throw new Error(error.message);
    return row;
  });

export const updateEASymbols = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({
    id: z.string().uuid(),
    symbols: z.array(z.string().trim().min(1).max(20).regex(/^[A-Z0-9_.]+$/i)).max(100),
  }).parse(input))
  .handler(async ({ context, data }) => {
    const normalized = Array.from(new Set(data.symbols.map((s) => s.toUpperCase())));
    const { error } = await context.supabase
      .from("expert_advisors").update({ symbols: normalized }).eq("id", data.id).eq("owner_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true, symbols: normalized };
  });

export const listLicenses = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("licenses")
      .select("*, expert_advisors(name)")
      .eq("owner_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

function genKey() {
  const chunks = Array.from({ length: 4 }, () =>
    Math.random().toString(36).slice(2, 7).toUpperCase()
  );
  return `APRO-${chunks.join("-")}`;
}

export const createLicense = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({
    username: z.string().trim().min(1).max(50),
    client_email: z.string().trim().email().optional().or(z.literal("")),
    ea_id: z.string().uuid().optional().nullable(),
    plan: PlanEnum,
  }).parse(input))
  .handler(async ({ context, data }) => {
    const days = PlanDays[data.plan];
    const expires_at = new Date(Date.now() + days * 86400 * 1000).toISOString();
    const { data: row, error } = await context.supabase
      .from("licenses").insert({
        owner_id: context.userId,
        username: data.username,
        client_email: data.client_email || null,
        ea_id: data.ea_id || null,
        plan: data.plan,
        expires_at,
        key: genKey(),
      }).select().single();
    if (error) throw new Error(error.message);
    return row;
  });

export const updateLicenseStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({
    id: z.string().uuid(),
    status: z.enum(["active", "revoked"]),
  }).parse(input))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("licenses").update({ status: data.status }).eq("id", data.id).eq("owner_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const extendLicense = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({
    id: z.string().uuid(),
    days: z.number().int().min(1).max(365),
  }).parse(input))
  .handler(async ({ context, data }) => {
    const { data: current, error: fErr } = await context.supabase
      .from("licenses").select("expires_at").eq("id", data.id).eq("owner_id", context.userId).single();
    if (fErr) throw new Error(fErr.message);
    const base = new Date(current.expires_at);
    const newExp = new Date(Math.max(base.getTime(), Date.now()) + data.days * 86400 * 1000);
    const { error } = await context.supabase
      .from("licenses").update({ expires_at: newExp.toISOString(), status: "active" })
      .eq("id", data.id).eq("owner_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const updateProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({
    full_name: z.string().trim().max(100).optional(),
    display_name: z.string().trim().max(50).optional(),
    avatar_url: z.string().trim().max(500).optional(),
  }).parse(input))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("profiles").update(data).eq("id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
