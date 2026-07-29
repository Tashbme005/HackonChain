import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowDownLeft,
  ArrowUpRight,
  BadgeCheck,
  ChartColumn,
  Copy,
  Eye,
  LayoutDashboard,
  Link2,
  Megaphone,
  Trash2,
  UserPlus,
  UserRound,
  Users,
  Wallet,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import {
  DashboardShell,
  DashboardWalletBanner,
  type DashboardNavItem,
} from "@/components/openimpact/DashboardShell";
import { OrganisationAnalytics } from "@/components/openimpact/DashboardAnalytics";
import { OrganisationProfileView } from "@/components/openimpact/PersonaProfiles";
import { PublicationPanel } from "@/components/openimpact/PublicationPanel";
import { StampBadge } from "@/components/openimpact/StampBadge";
import {
  formatAmount,
  formatStamp,
  useLedger,
  useRequireRole,
} from "@/lib/openimpact/store";
import { shortAddress } from "@/lib/openimpact/web3";
import {
  PUBLICATION_STATUS_LABEL,
  STATUS_LABEL,
  isFullyAccounted,
  proofOrgBrief,
  publicationStatus,
  recipientPublicLabel,
  shortWallet,
} from "@/lib/openimpact/types";

const NAV: DashboardNavItem[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "profile", label: "Profile", icon: UserRound },
  { id: "analytics", label: "Analytics", icon: ChartColumn },
  { id: "money", label: "Fund flow", icon: Wallet },
  { id: "publications", label: "Publications", icon: Megaphone },
  { id: "invites", label: "Invites", icon: UserPlus },
  { id: "recipients", label: "Recipients", icon: Users },
  { id: "submissions", label: "Submissions", icon: Link2 },
  { id: "public", label: "What donors see", icon: Eye },
];

const PAGES = new Set(NAV.map((n) => n.id));

export const Route = createFileRoute("/organisation")({
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
          "The organisation's seat: incoming donations beside outgoing disbursements, every linked recipient's status, and the public summary card donors see.",
      },
      { property: "og:title", content: "OpenImpact" },
      {
        property: "og:description",
        content:
          "Money in, money out, and who proved what. Scannable at a glance.",
      },
    ],
  }),
  component: OrganisationConsole,
});

function OrganisationConsole() {
  const { allowed } = useRequireRole("organisation");
  const { page } = Route.useSearch();
  const navigate = Route.useNavigate();
  const {
    donations,
    getOrg,
    getRecipient,
    currentOrgId,
    orgTrustScore,
    orgProofRate,
    orgPublicationRate,
  } = useLedger();
  const org = getOrg(currentOrgId);
  if (!allowed || !org) return null;

  const go = (id: string) => navigate({ search: { page: id }, replace: true });

  const rows = donations.filter((d) => d.orgId === currentOrgId);
  const incoming = rows.reduce((s, d) => s + d.amount, 0);
  const outgoing = rows.filter((d) => d.status !== "pending");
  const disbursed = outgoing.reduce((s, d) => s + d.amount, 0);
  const holding = incoming - disbursed;
  const score = orgTrustScore(org.id);
  const proofRate = orgProofRate(org.id);
  const pubRate = orgPublicationRate(org.id);
  const accounted = rows.filter((d) => isFullyAccounted(d)).length;

  return (
    <DashboardShell role="organisation" nav={NAV} page={page} onPageChange={go}>
      {page === "overview" && (
        <div className="space-y-6">
          <header className="border border-border bg-card px-6 py-7 text-ink sm:px-8">
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-display text-2xl leading-tight sm:text-3xl">
                    {org.name}
                  </h2>
                  <BadgeCheck className="size-6 text-verified" aria-hidden />
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {org.tagline}
                </p>
                <p className="data-mono mt-3 text-xs text-muted-foreground">
                  {org.walletAddress}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase tracking-widest text-muted-foreground">
                  Accountability score
                </p>
                <p className="data-mono text-5xl leading-none text-verified">
                  {score}%
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {proofRate}% proof of use · {pubRate}% publicised
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {accounted} of {rows.length} donations fully accounted for
                </p>
              </div>
            </div>

            <dl className="mt-7 grid gap-x-10 gap-y-4 border-t border-border pt-5 sm:grid-cols-4">
              <LightStat
                label="Funds in"
                value={formatAmount(incoming, "USDC")}
              />
              <LightStat
                label="Disbursed"
                value={formatAmount(disbursed, "USDC")}
              />
              <LightStat
                label="Not yet landed"
                value={formatAmount(holding, "USDC")}
              />
              <LightStat
                label="Linked recipients"
                value={String(org.recipientIds.length)}
              />
            </dl>
          </header>

          <DashboardWalletBanner />
        </div>
      )}

      {page === "profile" && <OrganisationProfileView />}

      {page === "analytics" && (
        <OrganisationAnalytics
          donations={donations}
          getRecipient={getRecipient}
          orgId={org.id}
          score={score}
          proofRate={proofRate}
          pubRate={pubRate}
        />
      )}

      {page === "money" && (
        <section className="grid gap-6 lg:grid-cols-2">
          {rows.length === 0 ? (
            <div className="col-span-2 border border-dashed border-input p-10 text-center">
              <p className="font-display text-xl">No donations yet</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Once donors start giving to your cause, incoming and outgoing
                transactions will appear here.
              </p>
              <Link
                to="/cause/$orgId"
                params={{ orgId: org.id }}
                className="mt-5 inline-block text-sm font-medium underline-offset-4 hover:underline"
              >
                View your public cause page
              </Link>
            </div>
          ) : (
            <>
              <div className="border border-border bg-card">
                <div className="flex items-center gap-2 border-b border-border px-4 py-3">
                  <ArrowDownLeft className="size-4 text-verified" aria-hidden />
                  <p className="text-sm font-medium">Incoming donations</p>
                  <span className="data-mono ml-auto text-sm">
                    {formatAmount(incoming, "USDC")}
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[420px] text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-[11px] uppercase tracking-widest text-muted-foreground">
                        <Th>Receipt</Th>
                        <Th>Donor</Th>
                        <Th className="text-right">Amount</Th>
                        <Th>Sent</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((d) => (
                        <tr
                          key={d.id}
                          className="border-b border-border last:border-0"
                        >
                          <Td className="data-mono text-xs">{d.id}</Td>
                          <Td>{d.isPublic ? d.donorName : "Anonymous"}</Td>
                          <Td className="data-mono text-right">
                            {formatAmount(d.amount, d.currency)}
                          </Td>
                          <Td className="data-mono text-xs">
                            {formatStamp(d.timestamp).slice(0, 10)}
                          </Td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="border border-border bg-card">
                <div className="flex items-center gap-2 border-b border-border px-4 py-3">
                  <ArrowUpRight className="size-4 text-pending" aria-hidden />
                  <p className="text-sm font-medium">Outgoing to recipients</p>
                  <span className="data-mono ml-auto text-sm">
                    {formatAmount(disbursed, "USDC")}
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[460px] text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-[11px] uppercase tracking-widest text-muted-foreground">
                        <Th>Recipient</Th>
                        <Th className="text-right">Amount</Th>
                        <Th>Status</Th>
                        <Th>Publication</Th>
                        <Th />
                      </tr>
                    </thead>
                    <tbody>
                      {outgoing.map((d) => {
                        const r = getRecipient(d.recipientId);
                        return (
                          <tr
                            key={d.id}
                            className="border-b border-border last:border-0"
                          >
                            <Td>{recipientPublicLabel(r, "...")}</Td>
                            <Td className="data-mono text-right">
                              {formatAmount(d.amount, d.currency)}
                            </Td>
                            <Td>
                              <span className="flex items-center gap-2">
                                <StampBadge status={d.status} size="sm" />
                                <span className="whitespace-nowrap text-xs">
                                  {STATUS_LABEL[d.status]}
                                </span>
                              </span>
                            </Td>
                            <Td>
                              <span
                                className={`whitespace-nowrap text-xs ${
                                  publicationStatus(d) === "published"
                                    ? "text-verified"
                                    : "text-pending-foreground"
                                }`}
                              >
                                {PUBLICATION_STATUS_LABEL[publicationStatus(d)]}
                              </span>
                            </Td>
                            <Td>
                              <Link
                                to="/proof/$donationId"
                                params={{ donationId: d.id }}
                                className="whitespace-nowrap text-xs font-medium underline-offset-4 hover:underline"
                              >
                                Receipt
                              </Link>
                            </Td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </section>
      )}

      {page === "publications" && <PublicationPanel orgId={org.id} />}

      {page === "invites" && <InvitePanel orgId={org.id} />}

      {page === "recipients" && (
        <section className="space-y-4">
          <p className="max-w-2xl text-sm text-muted-foreground">
            Pseudonyms and wallets only. Never legal names. Funds settle to the
            wallet; KYC stays with the platform.
          </p>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {org.recipientIds.map((id) => {
              const r = getRecipient(id);
              if (!r) return null;
              const theirs = rows.filter((d) => d.recipientId === id);
              const flagged = theirs.some((d) => d.status === "flagged");
              const mini = flagged
                ? {
                    text: "Flagged by review",
                    cls: "bg-flagged-soft text-flagged",
                  }
                : theirs.some((d) => d.proof)
                  ? { text: "Verified", cls: "bg-verified-soft text-verified" }
                  : theirs.length > 0
                    ? {
                        text: "Proof pending",
                        cls: "bg-pending-soft text-pending-foreground",
                      }
                    : { text: "Active", cls: "bg-muted text-muted-foreground" };

              return (
                <div key={id} className="border border-border bg-card p-5">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-lg leading-tight">
                      {recipientPublicLabel(r)}
                    </h3>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium ${mini.cls}`}
                    >
                      {mini.text}
                    </span>
                  </div>
                  <p className="data-mono mt-3 text-xs text-muted-foreground">
                    {shortAddress(r.walletAddress)}
                  </p>
                  <p className="data-mono mt-1 text-xs text-muted-foreground">
                    {theirs.length} receipt{theirs.length === 1 ? "" : "s"} ·
                    reputation {r.reputationScore}%
                  </p>
                  {(() => {
                    const last = theirs.filter((d) => d.proof).at(-1);
                    if (!last?.proof) {
                      return (
                        <p className="mt-3 border-t border-dashed border-input pt-3 text-xs text-muted-foreground">
                          No submission yet.
                        </p>
                      );
                    }
                    return (
                      <p className="mt-3 border-t border-dashed border-input pt-3 text-xs text-muted-foreground">
                        <span className="font-medium text-verified">
                          Submitted ✓
                        </span>
                        . Brief:{" "}
                        <span className="text-foreground">
                          {proofOrgBrief(last.proof, 60)}
                        </span>
                        <span className="data-mono block pt-1">
                          {formatStamp(last.proof.submittedAt).slice(0, 10)}
                        </span>
                      </p>
                    );
                  })()}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {page === "submissions" && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="max-w-2xl text-sm text-muted-foreground">
              Status, a one line brief, and the date only. Full testimonials and
              contact details go to the funding donor, not to you.
            </p>
            <span className="data-mono text-xs uppercase tracking-widest text-muted-foreground">
              Oversight view
            </span>
          </div>

          {(() => {
            const submitted = rows.filter((d) => d.proof);
            const general = org.generalProofs ?? [];
            if (submitted.length === 0 && general.length === 0) {
              return (
                <p className="border border-dashed border-input p-8 text-center text-muted-foreground">
                  No proof of use submitted yet.
                </p>
              );
            }
            return (
              <div className="overflow-x-auto border border-border bg-card">
                <table className="w-full min-w-[620px] text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-[11px] uppercase tracking-widest text-muted-foreground">
                      <Th>Recipient</Th>
                      <Th>Status</Th>
                      <Th>Brief</Th>
                      <Th>Submitted</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {submitted.map((d) => (
                      <tr
                        key={d.id}
                        className="border-b border-border last:border-0"
                      >
                        <Td>
                          <span className="whitespace-nowrap">
                            {recipientPublicLabel(
                              getRecipient(d.recipientId),
                              "Recipient",
                            )}
                          </span>
                          <span className="data-mono block text-[11px] text-muted-foreground">
                            {d.id}
                          </span>
                        </Td>
                        <Td>
                          <span className="flex items-center gap-2">
                            <StampBadge status={d.status} size="sm" />
                            <span className="whitespace-nowrap text-xs">
                              {d.status === "flagged"
                                ? "Flagged"
                                : d.status === "verified"
                                  ? "Verified"
                                  : "Submitted"}
                            </span>
                          </span>
                        </Td>
                        <Td className="max-w-[280px]">
                          <span className="line-clamp-1 text-muted-foreground">
                            {proofOrgBrief(d.proof!)}
                          </span>
                          {d.proof!.flagged && (
                            <span className="mt-1 block text-[11px] leading-snug text-flagged">
                              Automated check:{" "}
                              {d.proof!.aiReason ?? "flagged for human review."}
                            </span>
                          )}
                        </Td>

                        <Td className="data-mono whitespace-nowrap text-xs">
                          {formatStamp(d.proof!.submittedAt).slice(0, 10)}
                        </Td>
                      </tr>
                    ))}
                    {general.map((p) => (
                      <tr
                        key={p.id}
                        className="border-b border-border bg-muted/40 last:border-0"
                      >
                        <Td>
                          <span className="whitespace-nowrap">
                            {recipientPublicLabel(
                              getRecipient(p.recipientId),
                              "Recipient",
                            )}
                          </span>
                          <span className="block text-[11px] text-muted-foreground">
                            General. Your public page
                          </span>
                        </Td>
                        <Td>
                          <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                            Submitted
                          </span>
                        </Td>
                        <Td className="max-w-[280px]">
                          <span className="line-clamp-1 text-muted-foreground">
                            {proofOrgBrief(p)}
                          </span>
                        </Td>
                        <Td className="data-mono whitespace-nowrap text-xs">
                          {formatStamp(p.submittedAt).slice(0, 10)}
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })()}
        </section>
      )}

      {page === "public" && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Preview of the public summary donors see on your cause page.
            </p>
            <Link
              to="/cause/$orgId"
              params={{ orgId: org.id }}
              className="text-sm font-medium underline-offset-4 hover:underline"
            >
              Open the public page
            </Link>
          </div>

          <div className="receipt-edge border-2 border-verified bg-card px-6 pb-6 pt-9 sm:px-8">
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div className="max-w-xl">
                <p className="data-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                  Public summary
                </p>
                <h3 className="mt-2 font-display text-2xl leading-tight sm:text-3xl">
                  {org.name}
                </h3>
                <p className="mt-2 text-base leading-relaxed">
                  {org.description}
                </p>
              </div>
              <div className="text-right">
                <p className="data-mono text-4xl leading-none text-verified">
                  {score}%
                </p>
                <p className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">
                  donations with proof
                </p>
              </div>
            </div>
            <dl className="dotted-rule mt-6 flex flex-wrap gap-x-12 gap-y-4 pt-5">
              <LightStat
                label="Raised"
                value={formatAmount(incoming, "USDC")}
              />
              <LightStat label="Receipts" value={String(rows.length)} />
              <LightStat
                label="People funded"
                value={String(org.recipientIds.length)}
              />
            </dl>
          </div>
        </section>
      )}
    </DashboardShell>
  );
}

function InvitePanel({ orgId }: { orgId: string }) {
  const { invites, createInvite, revokeInvite } = useLedger();
  const [project, setProject] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const mine = invites.filter((i) => i.orgId === orgId);

  function inviteUrl(code: string) {
    const origin = typeof window === "undefined" ? "" : window.location.origin;
    return `${origin}/auth?invite=${code}`;
  }

  async function copy(code: string) {
    try {
      await navigator.clipboard.writeText(inviteUrl(code));
      toast.success("Invite link copied");
    } catch {
      toast.error("Could not copy. Select the link and copy it manually.");
    }
  }

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!project.trim()) {
      toast.error("Name the project or disbursement this slot is for.");
      return;
    }
    const invite = await createInvite({
      orgId,
      projectLabel: project,
      amount: Number(amount) || undefined,
      note,
    });
    setProject("");
    setAmount("");
    setNote("");
    void copy(invite.code);
  }

  return (
    <section className="space-y-4">
      <p className="max-w-2xl text-sm text-muted-foreground">
        Anyone with the link can claim a slot. You only ever see their
        pseudonym and wallet.
      </p>

      <form
        onSubmit={onCreate}
        className="flex flex-wrap items-end gap-4 border border-border bg-card p-5"
      >
        <label className="min-w-[220px] flex-[2]">
          <span className="text-xs uppercase tracking-widest text-muted-foreground">
            Project / disbursement
          </span>
          <input
            value={project}
            onChange={(e) => setProject(e.target.value)}
            placeholder="Mtwapa borehole caretaker stipend"
            className="mt-1.5 w-full border border-input bg-background px-3 py-2.5 text-sm outline-none focus-visible:border-foreground"
          />
        </label>
        <label className="min-w-[120px]">
          <span className="text-xs uppercase tracking-widest text-muted-foreground">
            Amount (optional)
          </span>
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            inputMode="numeric"
            placeholder="300"
            className="data-mono mt-1.5 w-full border border-input bg-background px-3 py-2.5 text-sm outline-none focus-visible:border-foreground"
          />
        </label>
        <label className="min-w-[220px] flex-[2]">
          <span className="text-xs uppercase tracking-widest text-muted-foreground">
            Internal note (optional)
          </span>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Q1 disbursement, one slot"
            className="mt-1.5 w-full border border-input bg-background px-3 py-2.5 text-sm outline-none focus-visible:border-foreground"
          />
        </label>
        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          <Link2 className="size-4" aria-hidden />
          Open slot &amp; copy link
        </button>
      </form>

      {mine.length > 0 && (
        <ul className="mt-4 divide-y divide-border border border-border bg-card">
          {mine.map((i) => {
            const used = i.usedByAccountId;
            return (
              <li
                key={i.code}
                className="flex flex-wrap items-center gap-4 p-4"
              >
                <span className="data-mono text-xs">{i.code}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">
                    {i.projectLabel}
                    {i.amount ? ` · $${i.amount.toLocaleString()}` : ""}
                  </p>
                  {used && (
                    <p className="data-mono truncate text-xs text-muted-foreground">
                      {i.claimedPseudonym ?? "Recipient"} ·{" "}
                      {shortWallet(i.claimedWallet)}
                    </p>
                  )}
                  <p className="data-mono truncate text-xs text-muted-foreground">
                    {inviteUrl(i.code)}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                    used
                      ? "bg-verified-soft text-verified"
                      : "bg-pending-soft text-pending-foreground"
                  }`}
                >
                  {used
                    ? `Claimed · ${i.claimedPseudonym ?? "pseudonym"}`
                    : "Open. Unclaimed"}
                </span>
                <span className="data-mono text-xs text-muted-foreground">
                  {formatStamp(i.createdAt).slice(0, 10)}
                </span>
                <button
                  type="button"
                  onClick={() => copy(i.code)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-input px-3 py-1.5 text-xs font-medium transition-colors hover:bg-accent"
                >
                  <Copy className="size-3.5" aria-hidden />
                  Copy
                </button>
                {!used && (
                  <button
                    type="button"
                    onClick={async () => {
                      await revokeInvite(i.code);
                      toast.success("Invite revoked");
                    }}
                    className="inline-flex items-center gap-1.5 rounded-full border border-input px-3 py-1.5 text-xs font-medium text-flagged transition-colors hover:bg-accent"
                  >
                    <Trash2 className="size-3.5" aria-hidden />
                    Revoke
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function LightStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-widest text-muted-foreground">
        {label}
      </dt>
      <dd className="data-mono mt-1 text-xl">{value}</dd>
    </div>
  );
}

function Th({
  children,
  className = "",
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return <th className={`px-4 py-2.5 font-medium ${className}`}>{children}</th>;
}

function Td({
  children,
  className = "",
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <td className={`px-4 py-2.5 align-middle ${className}`}>{children}</td>
  );
}
