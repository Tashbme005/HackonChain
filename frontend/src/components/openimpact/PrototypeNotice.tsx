import { AlertTriangle } from "lucide-react";

import { cn } from "@/lib/utils";

/** Shared hackathon / prototype warning banner. */
export function PrototypeNotice({
  className,
  tone = "onLight",
}: {
  className?: string;
  tone?: "onLight" | "onDark";
}) {
  return (
    <div
      role="status"
      className={cn(
        "flex gap-3 rounded-xl border border-flagged/35 bg-flagged/10 px-4 py-3 text-sm sm:items-center",
        className,
      )}
    >
      <AlertTriangle
        className="mt-0.5 size-4 shrink-0 text-flagged sm:mt-0"
        aria-hidden
      />
      <div className="min-w-0">
        <p className="data-mono text-[10px] uppercase tracking-[0.18em] text-flagged">
          Prototype notice
        </p>
        <p
          className={cn(
            "mt-1 leading-relaxed",
            tone === "onDark" ? "text-paper/85" : "text-ink/80",
          )}
        >
          Hackathon build with sample data. No real funds move on chain yet, and
          settlement is still being wired behind these screens.
        </p>
      </div>
    </div>
  );
}
