import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({
  image: z.string().min(50).max(20_000_000),
  note: z.string().max(500).optional(),
});

export const analyzeChart = createServerFn({ method: "POST" })
  .inputValidator((d) => Input.parse(d))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      return { ok: false as const, reason: "AI not configured" };
    }
    const prompt =
      "You are a decisive trading chart analyst. Look at this chart screenshot and ALWAYS commit to a direction. " +
      "You are NEVER allowed to answer NEUTRAL, WAIT, HOLD, or UNKNOWN — you must pick BUY or SELL. " +
      "If the chart is unclear, still pick the marginally stronger side. " +
      "Respond ONLY in strict JSON: " +
      `{"symbol":"<pair>","side":"BUY"|"SELL","confidence":50-100,"entry":"<approx price>","sl":"<approx>","tp":"<approx>","reason":"<one short sentence>"}.` +
      (data.note ? ` User note: ${data.note}` : "");
    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: prompt },
                { type: "image_url", image_url: { url: data.image } },
              ],
            },
          ],
        }),
      });
      if (!res.ok) {
        return { ok: false as const, reason: `AI error ${res.status}` };
      }
      const j = (await res.json()) as { choices?: { message?: { content?: string } }[] };
      const raw = j.choices?.[0]?.message?.content ?? "";
      const m = raw.match(/\{[\s\S]*\}/);
      if (!m) return { ok: false as const, reason: "No analysis returned" };
      const parsed = JSON.parse(m[0]) as {
        symbol: string; side: "BUY" | "SELL" | string; confidence: number;
        entry?: string; sl?: string; tp?: string; reason?: string;
      };
      // Force BUY/SELL — never let a NEUTRAL slip through.
      let side: "BUY" | "SELL" = parsed.side === "SELL" ? "SELL" : parsed.side === "BUY" ? "BUY" : "BUY";
      return { ok: true as const, ...parsed, side };

    } catch (e) {
      return { ok: false as const, reason: e instanceof Error ? e.message : "Failed" };
    }
  });
