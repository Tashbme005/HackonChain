import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import type { ReactNode } from "react";

import { StampBadge, StatusPill } from "./StampBadge";
import { formatAmount, formatStamp, useLedger } from "@/lib/openimpact/store";
import { shortAddress } from "@/lib/openimpact/web3";
import type { Donation } from "@/lib/openimpact/types";
import { hasDonorOnlyShare, recipientPublicLabel } from "@/lib/openimpact/types";
import { cn } from "@/lib/utils";

export function ReceiptShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <article
      className={cn(
        "receipt-edge relative border border-border bg-card px-5 pb-5 pt-7 sm:px-6 sm:pb-6",
        className,
      )}
    >
      {children}
    </article>
  );
}

export function ReceiptCard({
  donation,
  animateStamp = false,
  showLink = true,
}: {
  donation: Donation;
  animateStamp?: boolean;
  showLink?: boolean;
}) {
  const { getRecipient, getOrg } = useLedger();
  const recipient = getRecipient(donation.recipientId);
  const org = getOrg(donation.orgId);
  // Only proof attached to THIS donation counts here — never the org's feed.
  const proof = donation.proof ?? null;

  return (
    <ReceiptShell>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="data-mono text-[11px] uppercase tracking-widest text-muted-foreground">
            Receipt {donation.id}
          </p>
          <h3 className="mt-1 truncate text-xl">{recipientPublicLabel(recipient, "Unknown recipient")}</h3>
          <p className="truncate text-sm text-muted-foreground">
            {org?.name ?? "Direct donation"}
          </p>
        </div>
        <StampBadge status={donation.status} animate={animateStamp} />
      </div>

      <dl className="mt-4 space-y-1.5 text-sm">
        <Row label="Amount">
          <span className="data-mono font-medium">
            {formatAmount(donation.amount, donation.currency)}
          </span>
        </Row>
        <Row label="From">
          <span>{donation.isPublic ? donation.donorName : "Anonymous"}</span>
        </Row>
        <Row label="Sent">
          <span className="data-mono text-xs">{formatStamp(donation.timestamp)}</span>
        </Row>
        <Row label="Tx">
          <span className="data-mono text-xs">{shortAddress(donation.txHash)}</span>
        </Row>
      </dl>

      <div className="dotted-rule mt-4 pt-4">
        <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
          What happened to it
        </p>
        {proof ? (
          <>
            <p className="mt-1.5 line-clamp-2 text-sm">{proof.description}</p>
            {proof.testimonial && (
              <p className="mt-2 line-clamp-2 font-display text-base leading-snug text-verified">
                “{proof.testimonial}”
              </p>
            )}
            {proof.flagged && (
              <p className="mt-2 border-l-2 border-flagged pl-2 text-xs text-flagged">
                {proof.aiReason ?? "Our automated check flagged this submission for review."}
              </p>
            )}
            {hasDonorOnlyShare(proof) && (
              <p className="mt-2 text-xs text-verified">
                Includes private contact details shared with you only — open the receipt to view.
              </p>
            )}
            <p className="data-mono mt-2 text-[11px] text-muted-foreground">
              {recipientPublicLabel(recipient, "Recipient")} →{" "}
              {donation.isPublic ? donation.donorName : "Anonymous"}
            </p>

          </>
        ) : (
          <p className="mt-1.5 text-sm text-muted-foreground">
            {donation.status === "flagged"
              ? "Proof was submitted but our checks matched it to an earlier upload. Under review."
              : donation.status === "received"
                ? `${recipientPublicLabel(recipient, "The recipient")} has the funds and is preparing proof of use.`
                : "Not received yet. You'll see proof here the moment it's uploaded."}
          </p>
        )}

        <div className="mt-3 flex items-center justify-between gap-3">
          <StatusPill status={donation.status} />
          {showLink && (
            <Link
              to="/proof/$donationId"
              params={{ donationId: donation.id }}
              className="inline-flex items-center gap-1 text-sm font-medium underline-offset-4 hover:underline"
            >
              Open receipt
              <ArrowUpRight className="size-4" aria-hidden />
            </Link>
          )}
        </div>
      </div>
    </ReceiptShell>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right">{children}</dd>
    </div>
  );
}
