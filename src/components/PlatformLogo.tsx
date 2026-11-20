import { useState } from "react";
import { Bot } from "lucide-react";

/**
 * Platform logo mark.
 *
 * Drop the brand artwork at `public/logo.png` and it is used automatically;
 * until then the bot glyph is shown, so the layout never breaks.
 */
export function PlatformLogo({ className = "h-20 w-20" }: { className?: string }) {
  const [failed, setFailed] = useState(false);

  return (
    <span
      className={`relative grid shrink-0 place-items-center overflow-hidden rounded-full border border-brand/30 bg-secondary/60 shadow-[var(--brand-glow)] ${className}`}
    >
      {failed ? (
        <Bot className="h-[52%] w-[52%] text-brand" aria-hidden />
      ) : (
        <img
          src="/logo.png"
          alt="EA Vault"
          className="h-full w-full object-contain p-1.5"
          onError={() => setFailed(true)}
        />
      )}
    </span>
  );
}
