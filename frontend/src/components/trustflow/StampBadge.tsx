import { AlertTriangle, Check, Clock } from "lucide-react";

import { cn } from "@/lib/utils";
import type { DonationStatus } from "@/lib/trustflow/types";

const SIZES = {
  sm: "size-10 text-[9px]",
  md: "size-14 text-[10px]",
  lg: "size-20 text-xs",
} as const;

const ICON = {
  sm: "size-3.5",
  md: "size-5",
  lg: "size-7",
} as const;

export function StampBadge({
  status,
  size = "md",
  animate = false,
  className,
}: {
  status: DonationStatus;
  size?: keyof typeof SIZES;
  animate?: boolean;
  className?: string;
}) {
  const verified = status === "verified";
  const flagged = status === "flagged";

  const label = verified ? "Verified" : flagged ? "Flagged" : status === "received" ? "Received" : "Pending";

  return (
    <span
      role="img"
      aria-label={`${label} stamp`}
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full border-2 font-mono uppercase tracking-wider",
        SIZES[size],
        verified && "border-verified bg-verified text-verified-foreground",
        flagged && "border-flagged bg-flagged text-flagged-foreground",
        !verified && !flagged && "border-dashed border-pending bg-transparent text-pending",
        animate && (verified || flagged) && "stamp-animate",
        className,
      )}
    >
      {verified ? (
        <Check className={ICON[size]} strokeWidth={3} aria-hidden />
      ) : flagged ? (
        <AlertTriangle className={ICON[size]} strokeWidth={2.5} aria-hidden />
      ) : (
        <Clock className={ICON[size]} strokeWidth={2} aria-hidden />
      )}
    </span>
  );
}

export function StatusPill({ status }: { status: DonationStatus }) {
  const map: Record<DonationStatus, { text: string; cls: string }> = {
    pending: { text: "Waiting to be received", cls: "bg-pending-soft text-pending-foreground" },
    received: { text: "Received — proof pending", cls: "bg-pending-soft text-pending-foreground" },
    verified: { text: "Verified", cls: "bg-verified-soft text-verified" },
    flagged: { text: "Flagged for review", cls: "bg-flagged-soft text-flagged" },
  };
  const { text, cls } = map[status];
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium", cls)}>
      {text}
    </span>
  );
}
