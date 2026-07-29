import { createFileRoute, Link } from "@tanstack/react-router";

import { Breadcrumbs } from "@/components/openimpact/Breadcrumbs";
import { StampBadge, StatusPill } from "@/components/openimpact/StampBadge";
import { formatAmount, formatStamp, useLedger } from "@/lib/openimpact/store";
import {
  PUBLICATION_TYPE_LABEL,
  isFullyAccounted,
  linkHost,
  recipientPublicLabel,
} from "@/lib/openimpact/types";
import { shortAddress } from "@/lib/openimpact/web3";

export const Route = createFileRoute("/cause/$orgId")({
  head: () => ({
    meta: [
      { title: "OpenImpact" },
      {
        name: "description",
        content:
          "An organisation's public page: what they do, their proof-of-use score, the people they fund, and every recent receipt with proof attached.",
      },
      { property: "og:title", content: "OpenImpact" },
      {
        property: "og:description",
        content: "Trust score, funded recipients and recent proof-of-use receipts.",
      },
    ],
  }),
  component: CausePage,
});

function CausePage() {
  const { orgId } = Route.useParams();
  const { organisations, donations, getRecipient, orgTrustScore } = useLedger();
  const org = organisations.find((o) => o.id === orgId);

  if (!org) {
    return (
      <div className="page-shell-narrow page-top max-w-2xl pb-24 text-center text-muted-foreground">
        We don't have a cause with that address.{" "}
        <Link to="/" className="underline">
          Back to all causes
        </Link>
        .
      </div>
    );
  }

  const rows = donations.filter((d) => d.orgId === org.id);
  const raised = rows.reduce((s, d) => s + d.amount, 0);
  const withProof = rows.filter((d) => d.proof);
  const published = rows.filter((d) => d.publication);
  const score = orgTrustScore(org.id);
  const accounted = rows.filter((d) => isFullyAccounted(d)).length;

  return (
    <div>
      <section className="border-b border-border">
        <div className="page-shell page-top grid gap-8 pb-12 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div>
            <Breadcrumbs
              crumbs={[
                { label: "Causes", to: "/" },
                { label: org.name },
              ]}
              className="mb-4"
            />
            <h1 className="mt-3 text-4xl leading-tight sm:text-5xl">{org.name}</h1>
            <p className="mt-2 text-lg text-muted-foreground">{org.tagline}</p>
            <p className="mt-5 max-w-xl text-base leading-relaxed">{org.description}</p>
            <p className="data-mono mt-5 text-xs text-muted-foreground">
              {shortAddress(org.walletAddress)}
            </p>

            <dl className="mt-8 flex flex-wrap gap-x-10 gap-y-4 border-y border-border py-5">
              <Stat label="Raised on OpenImpact" value={formatAmount(raised, "USDC")} />
              <Stat label="Receipts" value={String(rows.length)} />
              <Stat label="Accountability score" value={`${score}%`} accent />
              <Stat
                label="Fully accounted for"
                value={`${accounted}/${rows.length}`}
              />
            </dl>

            <div className="mt-7 flex flex-wrap gap-4">
              <Link
                to="/donate/$recipientId"
                params={{ recipientId: org.recipientIds[0] }}
                className="rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
              >
                Donate to this cause
              </Link>
              <Link
                to="/trust"
                className="py-3 text-sm font-medium underline-offset-4 hover:underline"
              >
                What's public about my donation?
              </Link>
            </div>
          </div>

          <img
            src={org.imageUrl}
            alt={`${org.name} at work`}
            className="aspect-[4/3] w-full border border-border object-cover"
          />
        </div>
      </section>

      <section className="page-shell pb-14">
        <h2 className="text-3xl">People funded through {org.name}</h2>
        {org.recipientIds.length === 0 ? (
          <p className="mt-6 border border-dashed border-input p-8 text-center text-muted-foreground">
            No recipients linked yet. Once this organisation links recipients, they'll appear here.
          </p>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {org.recipientIds.map((id) => {
              const r = getRecipient(id);
              if (!r) return null;
              return (
                <div key={id} className="border border-border bg-card p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-xl leading-tight">{recipientPublicLabel(r)}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{r.story}</p>
                    </div>
                    <StampBadge
                      status={
                        donations.some((d) => d.recipientId === r.id && d.proof)
                          ? "verified"
                          : "pending"
                      }
                      size="sm"
                    />
                  </div>
                  <p className="data-mono mt-4 text-xs text-muted-foreground">
                    {shortAddress(r.walletAddress)} · reputation {r.reputationScore}%
                  </p>
                  <Link
                    to="/donate/$recipientId"
                    params={{ recipientId: r.id }}
                    className="mt-4 inline-block text-sm font-medium underline-offset-4 hover:underline"
                  >
                    Donate to {recipientPublicLabel(r)}
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="page-shell pb-4">
        <h2 className="text-3xl">How {org.name} shared this work</h2>
        <p className="mt-2 max-w-xl text-muted-foreground">
          Organisations on OpenImpact must publicise the impact of every donation somewhere public —
          and link the proof here. {published.length} of {rows.length} donations have a publication
          on file.
        </p>
        {published.length === 0 ? (
          <p className="mt-6 border border-dashed border-input p-8 text-center text-muted-foreground">
            Nothing published yet for this cause.
          </p>
        ) : (
          <ul className="mt-6 grid gap-4 sm:grid-cols-2">
            {published.map((d) => {
              const pub = d.publication!;
              return (
                <li key={d.id} className="border border-border bg-card p-5">
                  <p className="data-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                    {PUBLICATION_TYPE_LABEL[pub.type]} · {formatStamp(pub.submittedAt).slice(0, 10)}
                  </p>
                  <p className="mt-2 text-base">
                    See how the{" "}
                    <span className="data-mono">{formatAmount(d.amount, d.currency)}</span> donation
                    to {recipientPublicLabel(getRecipient(d.recipientId), "a recipient")} was shared:
                  </p>
                  <a
                    href={pub.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="mt-1.5 inline-block break-all font-medium underline underline-offset-4"
                  >
                    {linkHost(pub.url)}
                  </a>
                  {pub.caption && (
                    <p className="mt-1.5 text-sm text-muted-foreground">{pub.caption}</p>
                  )}
                  <p className="data-mono mt-3 text-xs text-muted-foreground">
                    {isFullyAccounted(d)
                      ? "Fully accounted for — proof of use + publication"
                      : "Publication filed · proof of use pending"}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {(org.generalProofs ?? []).length > 0 && (
        <section className="page-shell pb-4">
          <h2 className="text-3xl">Notes from the field</h2>
          <p className="mt-2 max-w-xl text-muted-foreground">
            General updates from the people {org.name} works with — not tied to any one donation.
            Donation-specific proof lives on each receipt below.
          </p>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2">
            {(org.generalProofs ?? []).map((p) => {
              const author = getRecipient(p.recipientId);
              return (
                <li key={p.id} className="flex gap-4 border border-border bg-card p-5">
                  <img
                    src={p.photoUrl}
                    alt=""
                    loading="lazy"
                    className="h-24 w-28 shrink-0 border border-border object-cover"
                  />
                  <div className="min-w-0">
                    {p.testimonial && (
                      <p className="font-display text-lg leading-snug">“{p.testimonial}”</p>
                    )}
                    <p className="mt-1.5 text-sm text-muted-foreground">{p.description}</p>
                    <p className="data-mono mt-2 text-xs text-muted-foreground">
                      — {recipientPublicLabel(author, "Recipient")} · {formatStamp(p.submittedAt).slice(0, 10)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section className="page-shell pb-16">
        <h2 className="text-3xl">Recent receipts</h2>
        <p className="mt-2 max-w-xl text-muted-foreground">
          Every donation to this cause, newest first, with whatever proof has come back so far.
        </p>

        <ul className="mt-6 divide-y divide-border border border-border bg-card">
          {rows.map((d) => {
            const r = getRecipient(d.recipientId);
            const proof = d.proof ?? null;
            return (
              <li key={d.id} className="flex flex-wrap items-start gap-5 p-5">
                <StampBadge status={d.status} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="text-base">
                    <span className="font-medium">
                      {d.isPublic ? d.donorName : "Anonymous"}
                    </span>{" "}
                    gave{" "}
                    <span className="data-mono">{formatAmount(d.amount, d.currency)}</span> to{" "}
                    {recipientPublicLabel(r, "a recipient")}
                  </p>
                  <p className="data-mono mt-1 text-xs text-muted-foreground">
                    {formatStamp(d.timestamp)} · {shortAddress(d.txHash)}
                  </p>
                  {proof && (
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                      {proof.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <StatusPill status={d.status} />
                  <Link
                    to="/proof/$donationId"
                    params={{ donationId: d.id }}
                    className="whitespace-nowrap text-sm font-medium underline-offset-4 hover:underline"
                  >
                    Open receipt
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>

        {withProof.length > 0 && (
          <p className="mt-4 text-sm text-muted-foreground">
            {withProof.length} of {rows.length} donations to {org.name} have proof of use attached.
          </p>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-widest text-muted-foreground">{label}</dt>
      <dd className={`data-mono mt-1 text-2xl ${accent ? "text-verified" : ""}`}>{value}</dd>
    </div>
  );
}
