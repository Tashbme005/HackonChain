import { createFileRoute, Link } from "@tanstack/react-router";
import { Copy, Lock } from "lucide-react";
import { toast } from "sonner";

import { Breadcrumbs } from "@/components/openimpact/Breadcrumbs";
import { StampBadge, StatusPill } from "@/components/openimpact/StampBadge";
import { formatAmount, formatStamp, useLedger } from "@/lib/openimpact/store";
import {
  STATUS_LABEL,
  hasDonorOnlyShare,
  recipientPublicLabel,
} from "@/lib/openimpact/types";

export const Route = createFileRoute("/proof/$donationId")({
  head: () => ({
    meta: [
      { title: "OpenImpact" },
      {
        name: "description",
        content:
          "A public receipt: who gave, how much, what it paid for, and the photo and testimonial that prove it.",
      },
      { property: "og:title", content: "OpenImpact" },
      {
        property: "og:description",
        content: "See the proof of use behind this donation — photo, description and testimonial.",
      },
    ],
  }),
  component: ProofPage,
});

function ProofPage() {
  const { donationId } = Route.useParams();
  const { donations, getRecipient, getOrg, account, currentDonorName } = useLedger();
  const donation = donations.find((d) => d.id === donationId);
  const recipient = donation ? getRecipient(donation.recipientId) : undefined;
  const org = getOrg(donation?.orgId);
  const proof = donation?.proof ?? null;
  const donorLabel = donation ? (donation.isPublic ? donation.donorName : "Anonymous") : "";

  // Contact/social share is gated to the signed-in donor who funded this receipt.
  const isFundingDonor =
    !!donation &&
    account?.role === "donor" &&
    (account.name === donation.donorName || currentDonorName === donation.donorName);
  const share = proof?.donorOnlyShare;
  const showDonorShare = isFundingDonor && hasDonorOnlyShare(proof);

  if (!donation || !recipient) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-24 text-center text-muted-foreground">
        That receipt doesn't exist.{" "}
        <Link to="/donor" className="underline">
          Back to your donations
        </Link>
        .
      </div>
    );
  }

  function copyLink() {
    navigator.clipboard?.writeText(window.location.href);
    toast.success("Link copied — share the receipt anywhere.");
  }

  return (
    <div className="mx-auto max-w-2xl px-5 py-12">
      <Breadcrumbs
        crumbs={[
          { label: "Causes", to: "/" },
          ...(org ? [{ label: org.name, to: `/cause/${org.id}` }] : []),
          { label: `Receipt ${donation.id}` },
        ]}
        className="mb-6"
      />
      <div className="receipt-edge border border-border bg-card px-6 pb-8 pt-9 sm:px-9">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="data-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              OpenImpact receipt · {donation.id}
            </p>
            <h1 className="mt-2 text-3xl leading-tight sm:text-4xl">
              {donation.isPublic ? donation.donorName : "Anonymous"} gave{" "}
              <span className="data-mono">{formatAmount(donation.amount, donation.currency)}</span>{" "}
              to {recipientPublicLabel(recipient)}
            </h1>
            {org && <p className="mt-2 text-sm text-muted-foreground">Through {org.name}</p>}
          </div>
          <StampBadge status={donation.status} size="lg" animate={donation.status === "verified"} />
        </div>

        <dl className="mt-6 space-y-2 text-sm">
          <Row label="Status">
            <StatusPill status={donation.status} />
          </Row>
          <Row label="Sent">
            <span className="data-mono text-xs">{formatStamp(donation.timestamp)}</span>
          </Row>
          <Row label="Transaction">
            <span className="data-mono break-all text-xs">{donation.txHash}</span>
          </Row>
          <Row label="Recipient wallet">
            <span className="data-mono break-all text-xs">{recipient.walletAddress}</span>
          </Row>
          {donation.note && <Row label="Donor note">{donation.note}</Row>}
        </dl>

        <div className="dotted-rule mt-7 pt-7">
          <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            What happened to it
          </p>

          {proof ? (
            <>
              <img
                src={proof.photoUrl}
                alt={`Proof of use submitted by ${recipientPublicLabel(recipient)}`}
                loading="lazy"
                className="mt-4 aspect-[16/10] w-full border border-border object-cover"
              />
              <p className="mt-4 text-base leading-relaxed">{proof.description}</p>
              {proof.testimonial && (
                <blockquote className="mt-6 border-l-2 border-verified pl-4 font-display text-xl leading-snug">
                  <p className="text-base font-sans text-muted-foreground">
                    Thank you, {donorLabel}, for this donation.
                  </p>
                  <p className="mt-2">“{proof.testimonial}”</p>
                  <footer className="mt-2 font-sans text-sm text-muted-foreground">
                    — {recipientPublicLabel(recipient)}, written for receipt{" "}
                    <span className="data-mono">{donation.id}</span>
                  </footer>
                </blockquote>
              )}

              {showDonorShare && share && (
                <div className="mt-6 border border-verified/40 bg-verified-soft/40 p-5">
                  <div className="flex items-center gap-2">
                    <Lock className="size-4 text-verified" aria-hidden />
                    <p className="text-[11px] uppercase tracking-[0.2em] text-verified">
                      Shared with you only
                    </p>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {recipientPublicLabel(recipient)} chose to share these details with you as the
                    donor. They are not shown to {org?.name ?? "the organisation"} or on the public
                    receipt.
                  </p>
                  <dl className="mt-4 space-y-2 text-sm">
                    {share.contact && (
                      <div>
                        <dt className="text-xs uppercase tracking-widest text-muted-foreground">
                          Contact
                        </dt>
                        <dd className="mt-0.5">{share.contact}</dd>
                      </div>
                    )}
                    {share.social && (
                      <div>
                        <dt className="text-xs uppercase tracking-widest text-muted-foreground">
                          Social
                        </dt>
                        <dd className="mt-0.5 break-all">{share.social}</dd>
                      </div>
                    )}
                    {share.note && (
                      <div>
                        <dt className="text-xs uppercase tracking-widest text-muted-foreground">
                          Note
                        </dt>
                        <dd className="mt-0.5">{share.note}</dd>
                      </div>
                    )}
                  </dl>
                </div>
              )}

              {!isFundingDonor && hasDonorOnlyShare(proof) && (
                <p className="mt-5 flex items-start gap-2 text-xs text-muted-foreground">
                  <Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                  The recipient also shared private contact details with the donor who funded this
                  receipt. Those stay off the public page.
                </p>
              )}

              <div className="mt-5 flex flex-wrap items-center gap-3 border border-border bg-background px-4 py-3">
                <StampBadge status={proof.flagged ? "flagged" : "verified"} size="sm" />
                <p className="min-w-0 flex-1 text-sm">
                  {proof.flagged ? (
                    <>
                      <span className="font-medium text-flagged">
                        Flagged by the automated check.
                      </span>{" "}
                      {proof.aiReason ?? "This submission needs a human to look at it."}
                    </>
                  ) : proof.aiChecked === false ? (
                    "The automated authenticity check could not run on this submission."
                  ) : (
                    "Checked for reused images, signs of editing, and consistency with the amount donated — nothing suspicious found."
                  )}
                </p>
              </div>
              <p className="data-mono mt-4 text-xs text-muted-foreground">
                Proof uploaded {formatStamp(proof.submittedAt)}
              </p>
            </>
          ) : (
            <p className="mt-3 text-base text-muted-foreground">
              {STATUS_LABEL[donation.status]}. Proof of use will appear on this page the moment{" "}
              {recipientPublicLabel(recipient)} uploads it.
            </p>
          )}
        </div>

        {proof && !proof.flagged && (
          <div className="dotted-rule mt-7 border border-verified/30 bg-verified-soft/40 p-5 pt-5">
            <p className="text-[11px] uppercase tracking-[0.2em] text-verified">
              Impact report · shareable
            </p>
            <p className="mt-2 font-display text-lg leading-snug">
              {donorLabel} donated{" "}
              <span className="data-mono">{formatAmount(donation.amount, donation.currency)}</span>{" "}
              to {recipientPublicLabel(recipient)}
              {org ? ` through ${org.name}` : ""} — and it paid for real, verified goods.
            </p>
            {proof.testimonial && (
              <p className="mt-2 text-sm text-muted-foreground">
                "{proof.testimonial}" — {recipientPublicLabel(recipient)}
              </p>
            )}
            {/* TODO: web3 team — generate an on-chain attestation link here */}
          </div>
        )}

        <div className="dotted-rule mt-7 flex flex-wrap items-center gap-3 pt-6">
          <button
            type="button"
            onClick={copyLink}
            className="inline-flex items-center gap-2 rounded-full border border-input px-5 py-2.5 text-sm font-medium transition-colors hover:bg-accent"
          >
            <Copy className="size-4" aria-hidden />
            Copy share link
          </button>
          <Link
            to="/donate/$recipientId"
            params={{ recipientId: recipient.id }}
            className="rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Donate to {recipientPublicLabel(recipient)}
          </Link>
        </div>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-6">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-right">{children}</dd>
    </div>
  );
}
