import { Link } from "@tanstack/react-router";

import { cn } from "@/lib/utils";

/**
 * OpenImpact brand mark — O as a seal ring, I as a pin through the coin.
 * From assests/openimpact-brand-v2.svg (Brand System v2).
 */
export function BrandMark({
  className,
  title = "OpenImpact",
}: {
  className?: string;
  title?: string;
}) {
  return (
    <svg
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0 text-verified", className)}
      role="img"
      aria-label={title}
    >
      <title>{title}</title>
      <rect width="64" height="64" rx="15" fill="currentColor" />
      <circle cx="32" cy="32" r="15" fill="none" stroke="#F4F6F5" strokeWidth="5" />
      <rect x="29" y="12" width="6" height="40" rx="3" fill="#F4F6F5" />
    </svg>
  );
}

/** Wordmark: Open (ink) + Impact (verified), Fraunces display. */
export function BrandWordmark({ className }: { className?: string }) {
  return (
    <span className={cn("font-display text-lg font-semibold tracking-tight", className)}>
      <span className="text-ink">Open</span>
      <span className="text-verified">Impact</span>
    </span>
  );
}

/** Header / footer lockup: mark + wordmark. */
export function BrandLockup({
  className,
  to = "/",
  showTagline = false,
}: {
  className?: string;
  to?: string;
  showTagline?: boolean;
}) {
  return (
    <Link to={to} className={cn("flex items-center gap-2.5", className)}>
      <BrandMark className="size-7" />
      <span className="flex flex-col leading-none">
        <BrandWordmark />
        {showTagline && (
          <span className="mt-1 text-[9px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Transparency you can see
          </span>
        )}
      </span>
    </Link>
  );
}
