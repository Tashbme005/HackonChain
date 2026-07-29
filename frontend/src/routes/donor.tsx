import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Bell,
  ChartColumn,
  Compass,
  ExternalLink,
  Globe,
  LayoutDashboard,
  Lock,
  MessageCircle,
  Receipt,
  Route as RouteIcon,
  ShieldCheck,
  UserRound,
  Wallet,
} from "lucide-react";

import {
  DashboardShell,
  DashboardWalletBanner,
  type DashboardNavItem,
} from "@/components/openimpact/DashboardShell";
import { DonorAnalytics } from "@/components/openimpact/DashboardAnalytics";
import { DonorProfileView } from "@/components/openimpact/PersonaProfiles";
import { ReceiptCard } from "@/components/openimpact/ReceiptCard";
import { StampBadge, StatusPill } from "@/components/openimpact/StampBadge";
import {
  formatAmount,
  formatStamp,
  useLedger,
  useRequireRole,
} from "@/lib/openimpact/store";
import { buildDonorNotifications } from "@/lib/openimpact/notifications";
import {
  STATUS_LABEL,
  hasDonorOnlyShare,
  isFullyAccounted,
  linkHost,
  publicationStatus,
  recipientPublicLabel,
  type Donation,
} from "@/lib/openimpact/types";
import { shortAddress } from "@/lib/openimpact/web3";
import { cn } from "@/lib/utils";

const NAV: DashboardNavItem[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "profile", label: "Profile", icon: UserRound },
  { id: "analytics", label: "Analytics", icon: ChartColumn },
  { id: "tracking", label: "Tracking", icon: RouteIcon },
  { id: "impact", label: "Impact and proofs", icon: ShieldCheck },
  { id: "updates", label: "Updates", icon: Bell },
  { id: "discover", label: "Discover", icon: Compass },
  { id: "donations", label: "All receipts", icon: Receipt },
];

const PAGES = new Set(NAV.map((n) => n.id));

export const Route = createFileRoute("/donor")({
  validateSearch: (search: Record<string, unknown>) => ({
    page:
      typeof search.page === "string" && PAGES.has(search.page)
        ? search.page
        : "overview",
  }),
  head: () => ({
    meta: [
      { title: "OpenImpact" },
      {
        name: "description",
        content:
          "The donor's seat: track every gift from sent to proof of use, read full testimonials shared only with you, and discover organisations by trust score.",
      },
      { property: "og:title", content: "OpenImpact" },
      {
        property: "og:description",
        content:
          "Total given, live status, private impact, and trust scores before you give again.",
      },
    ],
  }),
  component: DonorProfile,
});

function DonorProfile() {
  const { allowed } = useRequireRole("donor");
  const { page } = Route.useSearch();
  const navigate = Route.useNavigate();
  const {
    donations,
    donorProfile,
    donorIsPublic,
    setDonorIsPublic,
    getOrg,
    getRecipient,
    organisations,
    orgTrustScore,
    walletAddress,
  } = useLedger();

  if (!allowed) return null;

  const mine = donations
    .filter((d) => d.donorName === donorProfile.name)
    .slice()
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );

  const total = mine.reduce((s, d) => s + d.amount, 0);
  const causes = new Set(mine.map((d) => d.orgId).filter(Boolean)).size;
  const verified = mine.filter((d) => d.status === "verified").length;
  const awaitingReceive = mine.filter((d) => d.status === "pending");
  const awaitingProof = mine.filter((d) => d.status === "received");
  const withProof = mine.filter((d) => d.proof);
  const fullyAccounted = mine.filter((d) => isFullyAccounted(d));
  const flagged = mine.filter((d) => d.status === "flagged");
  const privateShares = withProof.filter((d) => hasDonorOnlyShare(d.proof));
  const recentProofs = withProof
    .filter((d) => d.proof && isRecentProof(d.proof.submittedAt))
    .sort(
      (a, b) =>
        new Date(b.proof!.submittedAt).getTime() -
        new Date(a.proof!.submittedAt).getTime(),
    );

  const displayName = donorIsPublic ? donorProfile.name : "Anonymous";
  const go = (id: string) => navigate({ search: { page: id }, replace: true });

  const updates = buildDonorNotifications(mine, getOrg, getRecipient);

  return (
    <DashboardShell role="donor" nav={NAV} page={page} onPageChange={go}>
      {page === "overview" && (
        <div className="space-y-8">
          <header className="receipt-edge border border-border bg-card px-6 pb-6 pt-9 sm:px-8">
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div className="min-w-0">
                <p className="data-mono text-[10px] uppercase tracking-[0.2em] text-verified">
                  Your seat on the ledger
                </p>
                <h2 className="mt-2 font-display text-4xl leading-tight sm:text-5xl">
                  {displayName}
                </h2>
                <p className="data-mono mt-3 text-sm">
                  Profile wallet · {shortAddress(donorProfile.walletAddress)}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {donorProfile.location} · giving since{" "}
                  <span className="data-mono">
                    {formatStamp(donorProfile.memberSince).slice(0, 10)}
                  </span>
                </p>
                <p className="mt-3 inline-flex items-center gap-2 text-xs text-muted-foreground">
                  <Wallet className="size-3.5" aria-hidden />
                  Session wallet:{" "}
                  <span className="data-mono text-ink">
                    {walletAddress
                      ? shortAddress(walletAddress)
                      : "Not connected yet"}
                  </span>
                </p>
              </div>

              <div className="border border-border p-4">
                <p className="text-xs uppercase tracking-widest text-muted-foreground">
                  How you appear on receipts
                </p>
                <div
                  role="group"
                  aria-label="Public or anonymous identity"
                  className="mt-3 flex items-center rounded-full border border-input p-0.5"
                >
                  <button
                    type="button"
                    aria-pressed={donorIsPublic}
                    onClick={() => setDonorIsPublic(true)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors",
                      donorIsPublic
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground",
                    )}
                  >
                    <Globe className="size-3.5" aria-hidden />
                    Show my name
                  </button>
                  <button
                    type="button"
                    aria-pressed={!donorIsPublic}
                    onClick={() => setDonorIsPublic(false)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors",
                      !donorIsPublic
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground",
                    )}
                  >
                    <Lock className="size-3.5" aria-hidden />
                    Anonymous
                  </button>
                </div>
                <p className="mt-3 max-w-[16rem] text-xs text-muted-foreground">
                  Applies to new donations. Past receipts keep whatever you
                  chose at the time.
                </p>
              </div>
            </div>

            <dl className="dotted-rule mt-7 grid gap-4 pt-6 sm:grid-cols-2 lg:grid-cols-4">
              <Stat
                label="Given in total"
                value={formatAmount(total, "USDC")}
              />
              <Stat label="Causes supported" value={String(causes)} />
              <Stat
                label="Verified receipts"
                value={`${verified} of ${mine.length}`}
                accent
              />
              <Stat
                label="Fully accounted"
                value={`${fullyAccounted.length} of ${mine.length}`}
              />
            </dl>
          </header>

          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <AttentionCard
              label="Waiting to be received"
              count={awaitingReceive.length}
              hint="Recipient has not confirmed arrival yet"
              onClick={() => go("tracking")}
            />
            <AttentionCard
              label="Proof pending"
              count={awaitingProof.length}
              hint="Funds landed. Waiting for proof of use"
              onClick={() => go("tracking")}
            />
            <AttentionCard
              label="New impact for you"
              count={recentProofs.length}
              hint="Proof uploaded in the last 7 days"
              accent
              onClick={() => go("impact")}
            />
            <AttentionCard
              label="Private shares"
              count={privateShares.length}
              hint="Contact or notes shared only with you"
              onClick={() => go("impact")}
            />
          </section>

          <DashboardWalletBanner />

          <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="border border-border bg-card p-5">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-display text-xl">Latest updates</h3>
                <button
                  type="button"
                  onClick={() => go("updates")}
                  className="text-sm font-medium text-verified underline-offset-4 hover:underline"
                >
                  View all
                </button>
              </div>
              <ul className="mt-4 space-y-3">
                {updates.slice(0, 4).map((u) => (
                  <li
                    key={u.id}
                    className="flex gap-3 border-b border-border pb-3 last:border-0 last:pb-0"
                  >
                    <span
                      className={cn(
                        "mt-1 size-2 shrink-0 rounded-full",
                        u.tone === "verified" && "bg-verified",
                        u.tone === "pending" && "bg-pending",
                        u.tone === "flagged" && "bg-flagged",
                        u.tone === "neutral" && "bg-muted-foreground/40",
                      )}
                    />
                    <div className="min-w-0">
                      <p className="text-sm text-ink">{u.title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {u.detail}
                      </p>
                      <p className="data-mono mt-1 text-[10px] text-muted-foreground">
                        {u.when}
                      </p>
                    </div>
                  </li>
                ))}
                {updates.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No activity yet. Donate to a cause and tracking starts here.
                  </p>
                )}
              </ul>
            </div>

            <div className="flex flex-col gap-4">
              <div className="border border-border bg-card p-5">
                <h3 className="font-display text-xl">Give again</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Compare organisation trust scores, then open a cause and send
                  funds with a wallet linked receipt.
                </p>
                <button
                  type="button"
                  onClick={() => go("discover")}
                  className="mt-4 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
                >
                  Discover causes
                </button>
              </div>
              {flagged.length > 0 && (
                <div className="border border-flagged/40 bg-flagged-soft p-5">
                  <p className="text-sm font-medium text-flagged">
                    {flagged.length} receipt
                    {flagged.length === 1 ? "" : "s"} flagged by review
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    AI authenticity check raised a concern. Open Tracking for
                    detail.
                  </p>
                  <button
                    type="button"
                    onClick={() => go("tracking")}
                    className="mt-3 text-sm font-medium underline-offset-4 hover:underline"
                  >
                    Review flagged gifts
                  </button>
                </div>
              )}
            </div>
          </section>
        </div>
      )}

      {page === "profile" && <DonorProfileView />}

      {page === "analytics" && (
        <DonorAnalytics donations={mine} getOrg={getOrg} />
      )}

      {page === "tracking" && (
        <div className="space-y-6">
          <p className="max-w-2xl text-sm text-muted-foreground">
            Live status for every gift: sent, received, proof of use, then org
            publication. You always know if money is sitting idle or already
            accounted for.
          </p>

          {mine.length === 0 ? (
            <EmptyDonations />
          ) : (
            <ul className="space-y-4">
              {mine.map((d) => {
                const org = getOrg(d.orgId);
                const recipient = getRecipient(d.recipientId);
                return (
                  <li
                    key={d.id}
                    className="border border-border bg-card p-5 sm:p-6"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="data-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                          {d.id} · {formatStamp(d.timestamp).slice(0, 10)}
                        </p>
                        <p className="mt-1 font-display text-2xl">
                          {formatAmount(d.amount, d.currency)}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {org?.name ?? "Organisation"} ·{" "}
                          {recipientPublicLabel(recipient)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <StampBadge status={d.status} size="sm" />
                        <StatusPill status={d.status} />
                      </div>
                    </div>

                    <ol className="mt-5 grid gap-2 sm:grid-cols-4">
                      <PipelineStep
                        n="01"
                        label="Sent"
                        done
                        detail={shortAddress(d.txHash)}
                      />
                      <PipelineStep
                        n="02"
                        label="Received"
                        done={d.status !== "pending"}
                        detail={
                          d.status === "pending"
                            ? "Waiting on recipient"
                            : "Confirmed"
                        }
                      />
                      <PipelineStep
                        n="03"
                        label="Proof of use"
                        done={Boolean(d.proof)}
                        detail={
                          d.proof
                            ? formatStamp(d.proof.submittedAt).slice(0, 10)
                            : STATUS_LABEL[d.status]
                        }
                        warn={d.status === "flagged"}
                      />
                      <PipelineStep
                        n="04"
                        label="Published"
                        done={publicationStatus(d) === "published"}
                        detail={
                          d.publication
                            ? linkHost(d.publication.url)
                            : "Org still to file"
                        }
                      />
                    </ol>

                    <div className="mt-4 flex flex-wrap gap-3 text-sm">
                      <Link
                        to="/proof/$donationId"
                        params={{ donationId: d.id }}
                        className="font-medium text-verified underline-offset-4 hover:underline"
                      >
                        Open public receipt
                      </Link>
                      {d.proof && (
                        <button
                          type="button"
                          onClick={() => go("impact")}
                          className="font-medium underline-offset-4 hover:underline"
                        >
                          Read full impact
                        </button>
                      )}
                      {org && (
                        <Link
                          to="/cause/$orgId"
                          params={{ orgId: org.id }}
                          className="text-muted-foreground underline-offset-4 hover:underline"
                        >
                          Organisation page
                        </Link>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {page === "impact" && (
        <div className="space-y-6">
          <p className="max-w-2xl text-sm text-muted-foreground">
            Photos, thank yous, and anything the recipient shared only with you.
            Organisations never see the full testimonial or private contact
            details. That privilege is yours as the funding donor.
          </p>

          {withProof.length === 0 ? (
            <div className="border border-dashed border-input p-10 text-center">
              <p className="font-display text-xl">No proofs yet</p>
              <p className="mt-2 text-sm text-muted-foreground">
                When a recipient uploads proof for one of your gifts, the full
                story appears here.
              </p>
            </div>
          ) : (
            <ul className="space-y-6">
              {withProof.map((d) => {
                const proof = d.proof!;
                const org = getOrg(d.orgId);
                const recipient = getRecipient(d.recipientId);
                const privateShare = hasDonorOnlyShare(proof);
                return (
                  <li
                    key={d.id}
                    className="overflow-hidden border border-border bg-card"
                  >
                    <div className="grid gap-0 md:grid-cols-[minmax(0,14rem)_1fr]">
                      <img
                        src={proof.photoUrl}
                        alt="Proof of use"
                        className="h-48 w-full object-cover md:h-full"
                      />
                      <div className="p-5 sm:p-6">
                        <div className="flex flex-wrap items-center gap-2">
                          <StampBadge status={d.status} size="sm" />
                          <span className="data-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                            {d.id} · {formatAmount(d.amount, d.currency)}
                          </span>
                          {isRecentProof(proof.submittedAt) && (
                            <span className="rounded-full bg-verified px-2 py-0.5 text-[10px] font-medium text-verified-foreground">
                              New
                            </span>
                          )}
                        </div>
                        <p className="mt-3 text-sm text-muted-foreground">
                          {org?.name} · {recipientPublicLabel(recipient)}
                        </p>
                        <p className="mt-3 text-sm leading-relaxed text-ink">
                          {proof.description}
                        </p>
                        {proof.testimonial && (
                          <p className="mt-4 font-display text-xl leading-snug text-ink">
                            “{proof.testimonial}”
                          </p>
                        )}
                        <p className="data-mono mt-3 text-xs text-muted-foreground">
                          Uploaded {formatStamp(proof.submittedAt)}
                          {proof.aiChecked
                            ? ` · AI check: ${proof.aiReason ?? "reviewed"}`
                            : ""}
                        </p>

                        {privateShare && (
                          <div className="mt-5 border border-verified/30 bg-verified-soft/40 p-4">
                            <p className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-verified">
                              <MessageCircle className="size-3.5" aria-hidden />
                              Shared with you only
                            </p>
                            <dl className="mt-3 space-y-2 text-sm">
                              {proof.donorOnlyShare?.contact && (
                                <div>
                                  <dt className="text-xs text-muted-foreground">
                                    Contact
                                  </dt>
                                  <dd>{proof.donorOnlyShare.contact}</dd>
                                </div>
                              )}
                              {proof.donorOnlyShare?.social && (
                                <div>
                                  <dt className="text-xs text-muted-foreground">
                                    Social
                                  </dt>
                                  <dd>{proof.donorOnlyShare.social}</dd>
                                </div>
                              )}
                              {proof.donorOnlyShare?.note && (
                                <div>
                                  <dt className="text-xs text-muted-foreground">
                                    Private note
                                  </dt>
                                  <dd>{proof.donorOnlyShare.note}</dd>
                                </div>
                              )}
                            </dl>
                          </div>
                        )}

                        <div className="mt-4 flex flex-wrap gap-3 text-sm">
                          <Link
                            to="/proof/$donationId"
                            params={{ donationId: d.id }}
                            className="inline-flex items-center gap-1 font-medium text-verified underline-offset-4 hover:underline"
                          >
                            Public impact page
                            <ExternalLink className="size-3.5" aria-hidden />
                          </Link>
                          {d.publication && (
                            <a
                              href={d.publication.url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-muted-foreground underline-offset-4 hover:underline"
                            >
                              Org publication · {linkHost(d.publication.url)}
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {page === "updates" && (
        <div className="space-y-6">
          <p className="max-w-2xl text-sm text-muted-foreground">
            Stay engaged when a recipient confirms funds or publishes
            deliverables tied to your gifts.
          </p>
          {updates.length === 0 ? (
            <div className="border border-dashed border-input p-10 text-center text-sm text-muted-foreground">
              No updates yet.
            </div>
          ) : (
            <ul className="divide-y divide-border border border-border bg-card">
              {updates.map((u) => (
                <li key={u.id} className="flex gap-4 p-4 sm:p-5">
                  <span
                    className={cn(
                      "mt-1.5 size-2.5 shrink-0 rounded-full",
                      u.tone === "verified" && "bg-verified",
                      u.tone === "pending" && "bg-pending",
                      u.tone === "flagged" && "bg-flagged",
                      u.tone === "neutral" && "bg-muted-foreground/40",
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-ink">{u.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {u.detail}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-3">
                      <span className="data-mono text-[10px] text-muted-foreground">
                        {u.when}
                      </span>
                      {u.donationId && (
                        <Link
                          to="/proof/$donationId"
                          params={{ donationId: u.donationId }}
                          className="text-xs font-medium text-verified underline-offset-4 hover:underline"
                        >
                          Open receipt
                        </Link>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {page === "discover" && (
        <div className="space-y-6">
          <p className="max-w-2xl text-sm text-muted-foreground">
            Check an organisation&apos;s trust score before you give. Scores
            come from proof of use and publication rates. Computed on the
            server, not faked in the UI.
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            {organisations.map((org) => {
              const score = orgTrustScore(org.id);
              return (
                <article
                  key={org.id}
                  className="flex flex-col overflow-hidden border border-border bg-card"
                >
                  <img
                    src={org.imageUrl}
                    alt=""
                    className="h-36 w-full object-cover"
                  />
                  <div className="flex flex-1 flex-col p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-display text-xl leading-tight">
                          {org.name}
                        </h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {org.tagline}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="data-mono text-2xl text-verified">
                          {score}%
                        </p>
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                          Trust
                        </p>
                      </div>
                    </div>
                    <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">
                      {org.description}
                    </p>
                    <div className="mt-auto flex flex-wrap gap-3 pt-5">
                      <Link
                        to="/cause/$orgId"
                        params={{ orgId: org.id }}
                        className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                      >
                        View & donate
                      </Link>
                      <Link
                        to="/organisations"
                        className="text-sm text-muted-foreground underline-offset-4 hover:underline"
                      >
                        All organisations
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}

      {page === "donations" && (
        <div>
          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <p className="max-w-xl text-muted-foreground">
              Every card is a live receipt. Open one for the public proof page
              anybody else would see.
            </p>
            <button
              type="button"
              onClick={() => go("discover")}
              className="text-sm font-medium underline-offset-4 hover:underline"
            >
              Find another cause
            </button>
          </div>

          {mine.length === 0 ? (
            <EmptyDonations onDiscover={() => go("discover")} />
          ) : (
            <div className="mt-7 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {mine.map((d) => (
                <Link
                  key={d.id}
                  to="/proof/$donationId"
                  params={{ donationId: d.id }}
                  className="relative block rounded-sm transition-transform hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
                  aria-label={`Open the public receipt for ${formatAmount(d.amount, d.currency)} to ${getOrg(d.orgId)?.name ?? "a recipient"}`}
                >
                  <ReceiptCard donation={d} showLink={false} />
                  {d.proof && isRecentProof(d.proof.submittedAt) && (
                    <span className="absolute right-3 top-3 z-10 rounded-full bg-verified px-2 py-0.5 text-[10px] font-medium text-verified-foreground">
                      New proof
                    </span>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </DashboardShell>
  );
}

function isRecentProof(submittedAt: string) {
  const diff = Date.now() - new Date(submittedAt).getTime();
  return diff < 7 * 24 * 60 * 60 * 1000;
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-widest text-muted-foreground">
        {label}
      </dt>
      <dd
        className={`data-mono mt-1 text-2xl ${accent ? "text-verified" : ""}`}
      >
        {value}
      </dd>
    </div>
  );
}

function AttentionCard({
  label,
  count,
  hint,
  accent,
  onClick,
}: {
  label: string;
  count: number;
  hint: string;
  accent?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="border border-border bg-card p-4 text-left transition-colors hover:bg-muted/40"
    >
      <p className="text-xs uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "data-mono mt-2 text-3xl",
          accent && count > 0 && "text-verified",
        )}
      >
        {count}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </button>
  );
}

function PipelineStep({
  n,
  label,
  done,
  detail,
  warn,
}: {
  n: string;
  label: string;
  done: boolean;
  detail: string;
  warn?: boolean;
}) {
  return (
    <li
      className={cn(
        "rounded-xl border px-3 py-3",
        done
          ? warn
            ? "border-flagged/40 bg-flagged-soft/50"
            : "border-verified/30 bg-verified-soft/40"
          : "border-border bg-muted/30",
      )}
    >
      <p className="data-mono text-[10px] tracking-widest text-muted-foreground">
        {n}
      </p>
      <p className="mt-1 text-sm font-medium text-ink">{label}</p>
      <p className="mt-0.5 truncate text-xs text-muted-foreground">{detail}</p>
    </li>
  );
}

function EmptyDonations({ onDiscover }: { onDiscover?: () => void }) {
  return (
    <div className="mt-4 border border-dashed border-input p-10 text-center">
      <p className="font-display text-xl">No donations yet</p>
      <p className="mt-2 text-sm text-muted-foreground">
        Pick a cause and your first receipt will appear right here.
      </p>
      {onDiscover ? (
        <button
          type="button"
          onClick={onDiscover}
          className="mt-5 inline-block rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground"
        >
          Discover causes
        </button>
      ) : (
        <Link
          to="/organisations"
          className="mt-5 inline-block rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground"
        >
          Browse causes
        </Link>
      )}
    </div>
  );
}
