import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowDownLeft, ArrowUpRight, BadgeCheck, Copy, Link2, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Breadcrumbs } from "@/components/openimpact/Breadcrumbs";
import { PublicationPanel } from "@/components/openimpact/PublicationPanel";
import { StampBadge } from "@/components/openimpact/StampBadge";
import { formatAmount, formatStamp, useLedger, useRequireRole } from "@/lib/openimpact/store";
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

export const Route = createFileRoute("/organisation")({
  head: () => ({
    meta: [
      { title: "Organisation console — funds in, funds out, proof back" },
      {
        name: "description",
        content:
          "The organisation's seat: incoming donations beside outgoing disbursements, every linked recipient's status, and the public summary card donors see.",
      },
      { property: "og:title", content: "Organisation console — OpenImpact" },
      {
        property: "og:description",
        content: "Money in, money out, and who proved what — scannable at a glance.",
      },
    ],
  }),
  component: OrganisationConsole,
});

function OrganisationConsole() {
  const { allowed } = useRequireRole("organisation");
  const { donations, getOrg, getRecipient, currentOrgId, orgTrustScore, orgProofRate, orgPublicationRate } =
    useLedger();
  const org = getOrg(currentOrgId);
  if (!allowed || !org) return null;

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
    <div className="mx-auto max-w-6xl px-5 py-10">
      <Breadcrumbs
        crumbs={[
          { label: "Home", to: "/" },
          { label: "Organisation console" },
        ]}
        className="mb-4"
      />
      <p className="data-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
        Organisation view · internal console
      </p>

      {/* Internal header — dense, dark, operational. Deliberately unlike the donor/recipient screens. */}
      <header className="mt-4 bg-ink px-6 py-7 text-paper sm:px-8">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl leading-tight sm:text-4xl">{org.name}</h1>
              <BadgeCheck className="size-6 text-verified" aria-hidden />
            </div>
            <p className="mt-1 text-sm opacity-70">{org.tagline}</p>
            <p className="data-mono mt-3 text-xs opacity-70">{org.walletAddress}</p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-widest opacity-60">Accountability score</p>
            <p className="data-mono text-5xl leading-none text-verified">{score}%</p>
            <p className="mt-1 text-xs opacity-60">
              {proofRate}% proof of use · {pubRate}% publicised
            </p>
            <p className="mt-1 text-xs opacity-60">
              {accounted} of {rows.length} donations fully accounted for
            </p>
          </div>
        </div>

        <dl className="mt-7 grid gap-x-10 gap-y-4 border-t border-paper/20 pt-5 sm:grid-cols-4">
          <DarkStat label="Funds in" value={formatAmount(incoming, "USDC")} />
          <DarkStat label="Disbursed" value={formatAmount(disbursed, "USDC")} />
          <DarkStat label="Not yet landed" value={formatAmount(holding, "USDC")} />
          <DarkStat label="Linked recipients" value={String(org.recipientIds.length)} />
        </dl>
      </header>

      {/* Fund flow, side by side. */}
      <section className="mt-10 grid gap-6 lg:grid-cols-2">
        {rows.length === 0 ? (
          <div className="col-span-2 border border-dashed border-input p-10 text-center">
            <p className="font-display text-xl">No donations yet</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Once donors start giving to your cause, incoming and outgoing transactions will appear here.
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
                <h2 className="text-lg">Incoming donations</h2>
                <span className="data-mono ml-auto text-sm">{formatAmount(incoming, "USDC")}</span>
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
                      <tr key={d.id} className="border-b border-border last:border-0">
                        <Td className="data-mono text-xs">{d.id}</Td>
                        <Td>{d.isPublic ? d.donorName : "Anonymous"}</Td>
                        <Td className="data-mono text-right">{formatAmount(d.amount, d.currency)}</Td>
                        <Td className="data-mono text-xs">{formatStamp(d.timestamp).slice(0, 10)}</Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="border border-border bg-card">
              <div className="flex items-center gap-2 border-b border-border px-4 py-3">
                <ArrowUpRight className="size-4 text-pending" aria-hidden />
                <h2 className="text-lg">Outgoing to recipients</h2>
                <span className="data-mono ml-auto text-sm">{formatAmount(disbursed, "USDC")}</span>
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
                        <tr key={d.id} className="border-b border-border last:border-0">
                          <Td>{recipientPublicLabel(r, "—")}</Td>
                          <Td className="data-mono text-right">{formatAmount(d.amount, d.currency)}</Td>
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

      <PublicationPanel orgId={org.id} />

      <InvitePanel orgId={org.id} />

      <section className="mt-12">
        <h2 className="text-2xl">Linked recipients</h2>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          You see pseudonyms and wallet addresses only — never legal names or personal identity.
          Funds settle to the wallet, so nothing about disbursement needs a real name. Identity
          verification (KYC) is held by the platform, not by your organisation.
        </p>


        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {org.recipientIds.map((id) => {
            const r = getRecipient(id);
            if (!r) return null;
            const theirs = rows.filter((d) => d.recipientId === id);
            const flagged = theirs.some((d) => d.status === "flagged");
            const mini = flagged
              ? { text: "Flagged by review", cls: "bg-flagged-soft text-flagged" }
              : theirs.some((d) => d.proof)
                ? { text: "Verified", cls: "bg-verified-soft text-verified" }
                : theirs.length > 0
                  ? { text: "Proof pending", cls: "bg-pending-soft text-pending-foreground" }
                  : { text: "Active", cls: "bg-muted text-muted-foreground" };

            return (
              <div key={id} className="border border-border bg-card p-5">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-lg leading-tight">{recipientPublicLabel(r)}</h3>
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
                  {theirs.length} receipt{theirs.length === 1 ? "" : "s"} · reputation{" "}
                  {r.reputationScore}%
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
                      <span className="font-medium text-verified">Submitted ✓</span> — brief:{" "}
                      <span className="text-foreground">{proofOrgBrief(last.proof, 60)}</span>
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

      {/* Oversight only — status, brief and date. Full content is the donor's. */}
      <section className="mt-12">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="text-2xl">Submissions from your recipients</h2>
          <span className="data-mono text-xs uppercase tracking-widest text-muted-foreground">
            Oversight view
          </span>
        </div>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          You see that something was submitted, a one-line brief and the date — nothing more. The
          full testimonial, photos and any contact details the recipient chose to share go only to
          the donor who funded that donation.
        </p>

        {(() => {
          const submitted = rows.filter((d) => d.proof);
          const general = org.generalProofs ?? [];
          if (submitted.length === 0 && general.length === 0) {
            return (
              <p className="mt-4 border border-dashed border-input p-8 text-center text-muted-foreground">
                No proof of use submitted yet.
              </p>
            );
          }
          return (
            <div className="mt-4 overflow-x-auto border border-border bg-card">
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
                    <tr key={d.id} className="border-b border-border last:border-0">
                      <Td>
                        <span className="whitespace-nowrap">
                          {recipientPublicLabel(getRecipient(d.recipientId), "Recipient")}
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
                    <tr key={p.id} className="border-b border-border bg-muted/40 last:border-0">
                      <Td>
                        <span className="whitespace-nowrap">
                          {recipientPublicLabel(getRecipient(p.recipientId), "Recipient")}
                        </span>
                        <span className="block text-[11px] text-muted-foreground">
                          General — your public page
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

      {/* Public-facing summary — visually separated from the internal console above. */}
      <section className="mt-14">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="text-2xl">What donors see</h2>
          <Link
            to="/cause/$orgId"
            params={{ orgId: org.id }}
            className="text-sm font-medium underline-offset-4 hover:underline"
          >
            Open the public page
          </Link>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          This card is public. Everything above it is internal to your team.
        </p>

        <div className="receipt-edge mt-5 border-2 border-verified bg-card px-6 pb-6 pt-9 sm:px-8">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="max-w-xl">
              <p className="data-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                Public summary
              </p>
              <h3 className="mt-2 text-3xl leading-tight">{org.name}</h3>
              <p className="mt-2 text-base leading-relaxed">{org.description}</p>
            </div>
            <div className="text-right">
              <p className="data-mono text-4xl leading-none text-verified">{score}%</p>
              <p className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">
                donations with proof
              </p>
            </div>
          </div>
          <dl className="dotted-rule mt-6 flex flex-wrap gap-x-12 gap-y-4 pt-5">
            <LightStat label="Raised" value={formatAmount(incoming, "USDC")} />
            <LightStat label="Receipts" value={String(rows.length)} />
            <LightStat label="People funded" value={String(org.recipientIds.length)} />
          </dl>
        </div>
      </section>
    </div>
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
      toast.error("Couldn't copy — select the link and copy it manually.");
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
    <section className="mt-12">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-2xl">Open a recipient slot</h2>
        <p className="text-sm text-muted-foreground">
          Anyone with the link can claim it. You'll only ever see their pseudonym and wallet.
        </p>
      </div>

      <form
        onSubmit={onCreate}
        className="mt-4 flex flex-wrap items-end gap-4 border border-border bg-card p-5"
      >
        <label className="min-w-[220px] flex-[2]">
          <span className="text-xs uppercase tracking-widest text-muted-foreground">
            Project / disbursement
          </span>
          <input
            value={project}
            onChange={(e) => setProject(e.target.value)}
            placeholder="Mtwapa borehole — caretaker stipend"
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
              <li key={i.code} className="flex flex-wrap items-center gap-4 p-4">
                <span className="data-mono text-xs">{i.code}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">
                    {i.projectLabel}
                    {i.amount ? ` · $${i.amount.toLocaleString()}` : ""}
                  </p>
                  {used && (
                    <p className="data-mono truncate text-xs text-muted-foreground">
                      {i.claimedPseudonym ?? "Recipient"} · {shortWallet(i.claimedWallet)}
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
                  {used ? `Claimed · ${i.claimedPseudonym ?? "pseudonym"}` : "Open — unclaimed"}
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

function DarkStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-widest opacity-60">{label}</dt>
      <dd className="data-mono mt-1 text-xl">{value}</dd>
    </div>
  );
}

function LightStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-widest text-muted-foreground">{label}</dt>
      <dd className="data-mono mt-1 text-xl">{value}</dd>
    </div>
  );
}

function Th({ children, className = "" }: { children?: React.ReactNode; className?: string }) {
  return <th className={`px-4 py-2.5 font-medium ${className}`}>{children}</th>;
}

function Td({ children, className = "" }: { children?: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-2.5 align-middle ${className}`}>{children}</td>;
}
