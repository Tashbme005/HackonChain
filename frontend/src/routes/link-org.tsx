import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { toast } from "sonner";

import { formatAmount, useLedger, useRequireRole } from "@/lib/trustflow/store";
import { shortAddress } from "@/lib/trustflow/web3";

export const Route = createFileRoute("/link-org")({
  head: () => ({
    meta: [
      { title: "Find your organisation — TrustFlow recipients" },
      {
        name: "description",
        content:
          "Signed up as a recipient without an invite link? Search the organisations on TrustFlow and link your account to the one you work with.",
      },
      { property: "og:title", content: "Find your organisation — TrustFlow" },
      {
        property: "og:description",
        content: "Search organisations and link your recipient account — no invite needed.",
      },
    ],
  }),
  component: LinkOrgPage,
});

function LinkOrgPage() {
  const { allowed } = useRequireRole("recipient");
  const {
    organisations,
    donations,
    getRecipient,
    currentRecipientId,
    orgTrustScore,
    linkRecipientToOrg,
  } = useLedger();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const me = getRecipient(currentRecipientId);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return organisations;
    return organisations.filter((o) =>
      `${o.name} ${o.tagline} ${o.description}`.toLowerCase().includes(q),
    );
  }, [organisations, query]);

  if (!allowed || !me) return null;

  function onLink(orgId: string, orgName: string) {
    linkRecipientToOrg(currentRecipientId, orgId);
    toast.success(`You're linked to ${orgName}.`);
    navigate({ to: "/recipient" });
  }

  return (
    <div className="mx-auto max-w-5xl px-5 py-12">
      <p className="data-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
        Recipient setup · step 2 of 2
      </p>
      <h1 className="mt-3 max-w-2xl text-4xl leading-tight sm:text-5xl">
        Which organisation are you with?
      </h1>
      <p className="mt-3 max-w-xl text-muted-foreground">
        Find the organisation you work with and link your account. If someone sent you an invite
        link instead, opening it does this for you automatically.
      </p>

      {me.orgId && (
        <p className="mt-5 border border-verified/40 bg-verified-soft px-4 py-3 text-sm text-verified">
          You're already linked to{" "}
          {organisations.find((o) => o.id === me.orgId)?.name ?? "an organisation"}.{" "}
          <Link to="/recipient" className="underline underline-offset-4">
            Back to your dashboard
          </Link>
          . Picking another below moves your account across.
        </p>
      )}

      <label className="mt-8 flex items-center gap-3 border border-input bg-background px-4 py-3">
        <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        <span className="sr-only">Search organisations</span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or what they do — e.g. water, books, solar"
          className="w-full bg-transparent text-base outline-none"
        />
      </label>

      <ul className="mt-8 grid gap-4 sm:grid-cols-2">
        {results.map((o) => {
          const rows = donations.filter((d) => d.orgId === o.id);
          const raised = rows.reduce((s, d) => s + d.amount, 0);
          return (
            <li key={o.id} className="flex flex-col border border-border bg-card p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="text-xl leading-tight">{o.name}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{o.tagline}</p>
                </div>
                <span className="data-mono shrink-0 text-lg text-verified">
                  {orgTrustScore(o.id)}%
                </span>
              </div>
              <p className="data-mono mt-4 text-xs text-muted-foreground">
                {shortAddress(o.walletAddress)} · {formatAmount(raised, "USDC")} raised ·{" "}
                {o.recipientIds.length} people funded
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={() => onLink(o.id, o.name)}
                  disabled={me.orgId === o.id}
                  className="rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
                >
                  {me.orgId === o.id ? "Linked" : "Link my account"}
                </button>
                <Link
                  to="/cause/$orgId"
                  params={{ orgId: o.id }}
                  className="text-sm font-medium underline-offset-4 hover:underline"
                >
                  See their public page
                </Link>
              </div>
            </li>
          );
        })}
      </ul>

      {results.length === 0 && (
        <p className="mt-8 border border-dashed border-input p-10 text-center text-muted-foreground">
          No organisation matches “{query}”. Ask them to send you an invite link instead.
        </p>
      )}
    </div>
  );
}
