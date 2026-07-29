import { createFileRoute, Link } from "@tanstack/react-router";
import { Globe, Lock } from "lucide-react";

import { ReceiptCard } from "@/components/trustflow/ReceiptCard";
import { formatAmount, formatStamp, useLedger, useRequireRole } from "@/lib/trustflow/store";
import { shortAddress } from "@/lib/trustflow/web3";

export const Route = createFileRoute("/donor")({
  head: () => ({
    meta: [
      { title: "Donor profile — your donations and their receipts" },
      {
        name: "description",
        content:
          "The donor's seat: your wallet, your giving history as receipt cards, and the current status and proof of use behind every donation you've made.",
      },
      { property: "og:title", content: "Donor profile — TrustFlow" },
      {
        property: "og:description",
        content: "Total given, causes supported, and a verified receipt for each donation.",
      },
    ],
  }),
  component: DonorProfile,
});

function DonorProfile() {
  const { allowed } = useRequireRole("donor");
  const { donations, donorProfile, donorIsPublic, setDonorIsPublic, getOrg } = useLedger();
  const mine = donations.filter((d) => d.donorName === donorProfile.name);
  const total = mine.reduce((s, d) => s + d.amount, 0);
  const causes = new Set(mine.map((d) => d.orgId).filter(Boolean)).size;
  const verified = mine.filter((d) => d.status === "verified").length;
  if (!allowed) return null;

  const displayName = donorIsPublic ? donorProfile.name : "Anonymous";

  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <p className="data-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
        Donor view
      </p>

      {/* Profile header — deliberately paper-and-receipt in feel. */}
      <header className="receipt-edge mt-4 border border-border bg-card px-6 pb-6 pt-9 sm:px-8">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="min-w-0">
            <h1 className="text-4xl leading-tight sm:text-5xl">{displayName}</h1>
            <p className="data-mono mt-3 text-sm">{shortAddress(donorProfile.walletAddress)}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {donorProfile.location} · giving since{" "}
              <span className="data-mono">{formatStamp(donorProfile.memberSince).slice(0, 10)}</span>
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
                className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                  donorIsPublic ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                }`}
              >
                <Globe className="size-3.5" aria-hidden />
                Show my name
              </button>
              <button
                type="button"
                aria-pressed={!donorIsPublic}
                onClick={() => setDonorIsPublic(false)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                  !donorIsPublic ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                }`}
              >
                <Lock className="size-3.5" aria-hidden />
                Anonymous
              </button>
            </div>
            <p className="mt-3 max-w-[16rem] text-xs text-muted-foreground">
              Applies to new donations. Past receipts keep whatever you chose at the time.
            </p>
          </div>
        </div>

        <dl className="dotted-rule mt-7 flex flex-wrap gap-x-12 gap-y-4 pt-6">
          <Stat label="Given in total" value={formatAmount(total, "USDC")} />
          <Stat label="Causes supported" value={String(causes)} />
          <Stat label="Verified receipts" value={`${verified} of ${mine.length}`} accent />
        </dl>
      </header>

      <div className="mt-12 flex flex-wrap items-baseline justify-between gap-4">
        <h2 className="text-3xl">Your donation history</h2>
        <Link to="/" className="text-sm font-medium underline-offset-4 hover:underline">
          Find another cause
        </Link>
      </div>
      <p className="mt-2 max-w-xl text-muted-foreground">
        Each card is a live receipt. Open one to see the public proof page anybody else would see.
      </p>

      {mine.length === 0 ? (
        <div className="mt-10 border border-dashed border-input p-10 text-center">
          <p className="font-display text-xl">No donations yet</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Pick a cause and your first receipt will appear right here.
          </p>
          <Link
            to="/"
            className="mt-5 inline-block rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground"
          >
            Browse causes
          </Link>
        </div>
      ) : (
        <div className="mt-7 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {mine.map((d) => (
            <Link
              key={d.id}
              to="/proof/$donationId"
              params={{ donationId: d.id }}
              className="block rounded-sm transition-transform hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
              aria-label={`Open the public receipt for ${formatAmount(d.amount, d.currency)} to ${getOrg(d.orgId)?.name ?? "a recipient"}`}
            >
              <ReceiptCard donation={d} showLink={false} />
            </Link>
          ))}
        </div>
      )}
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
