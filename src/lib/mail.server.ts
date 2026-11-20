// Server-only email sending via Mailtrap's sending API (demo domain).
const MAILTRAP_URL = "https://send.api.mailtrap.io/api/send";
const FROM_EMAIL = "hello@demomailtrap.co";
const FROM_NAME = "EA Vault";

function wrap(title: string, body: string) {
  return `<!doctype html><html><body style="margin:0;background:#f5f6f8;font-family:Arial,Helvetica,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 12px">
    <table width="100%" style="max-width:520px;background:#ffffff;border-radius:16px;padding:32px" cellpadding="0" cellspacing="0">
      <tr><td style="font-size:13px;letter-spacing:3px;color:#7c3aed;font-weight:bold">EA VAULT</td></tr>
      <tr><td style="padding-top:12px;font-size:20px;font-weight:bold;color:#111827">${title}</td></tr>
      <tr><td style="padding-top:12px;font-size:15px;line-height:1.6;color:#374151">${body}</td></tr>
      <tr><td style="padding-top:24px;font-size:12px;color:#9ca3af">You are receiving this because you registered an EA Vault portal account.</td></tr>
    </table>
  </td></tr></table></body></html>`;
}

export async function sendMail(opts: {
  to: string;
  subject: string;
  text: string;
  title: string;
  html?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const token = process.env["MAILTRAP_API_TOKEN"];
  if (!token) {
    console.error("[mail] MAILTRAP_API_TOKEN is not configured");
    return { ok: false, error: "Email is not configured" };
  }
  try {
    const res = await fetch(MAILTRAP_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Api-Token": token,
      },
      body: JSON.stringify({
        from: { email: FROM_EMAIL, name: FROM_NAME },
        to: [{ email: opts.to }],
        subject: opts.subject,
        text: opts.text,
        html: opts.html ?? wrap(opts.title, opts.text.replace(/\n/g, "<br/>")),
        category: "EA Vault Portal",
      }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error("[mail] send failed", res.status, detail);
      return { ok: false, error: `Mail provider returned ${res.status}` };
    }
    return { ok: true };
  } catch (e) {
    console.error("[mail] send error", e);
    return { ok: false, error: "Could not reach the mail provider" };
  }
}

export const PENDING_SUBJECT = "We received your EA Vault registration";
export const PENDING_BODY =
  "We have received your registration and you are on our waiting list. Our team will review and approve your account shortly.";

export const ACTIVE_SUBJECT = "Your EA Vault portal is active";
export const ACTIVE_BODY =
  "Your portal has been activated successfully! You can now login and manage your EA.";
