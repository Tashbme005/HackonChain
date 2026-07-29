import { createFileRoute, Link } from "@tanstack/react-router";

import { useLedger } from "@/lib/trustflow/store";
import { StampBadge } from "@/components/trustflow/StampBadge";
import { DemoSimulator } from "@/components/trustflow/DemoSimulator";
import { shortAddress } from "@/lib/trustflow/web3";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TrustFlow — see exactly where your donation went" },
      {
        name: "description",
        content:
          "Give to causes and follow every dollar: each donation becomes a receipt with a status, a timestamp and proof of use uploaded by the person who received it.",
      },
      { property: "og:title", content: "TrustFlow — see exactly where your donation went" },
      {
        property: "og:description",
        content: "A wallet-based donation ledger with photo, receipt and testimonial proof of use.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { organisations, recipients, donations, orgTrustScore } = useLedger();
  const verified = donations.filter((d) => d.status === "verified").length;

  return (
    <div>
      <section className="mx-auto max-w-6xl px-5 pb-14 pt-16 sm:pt-24">
        <div className="grid gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div>
            <p className="data-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Open ledger giving
            </p>
            <h1 className="mt-4 max-w-xl text-4xl leading-[1.05] sm:text-6xl">
              Every donation, a receipt you can verify.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-muted-foreground">
              Most giving ends at "thank you." TrustFlow keeps going: you see when the money
              arrives, who received it, what they bought, and the photo and receipt that prove it.
              Transparency you can see, not just promise.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <a
                href="#causes"
                className="rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
              >
                Find a cause
              </a>
              <a
                href="#try-it"
                className="rounded-full border border-dashed border-pending px-6 py-3 text-sm font-medium text-pending transition-colors hover:bg-pending/10"
              >
                Try the 40-second demo
              </a>
              <Link
                to="/donor"
                className="text-sm font-medium underline-offset-4 hover:underline"
              >
                See a live donation trail
              </Link>

            </div>
            <dl className="mt-10 flex flex-wrap gap-x-10 gap-y-4">
              <Stat label="Donations logged" value={String(donations.length)} />
              <Stat label="With proof of use" value={String(verified)} />
              <Stat label="Recipients on the ledger" value={String(recipients.length)} />
            </dl>
          </div>

          <div className="receipt-edge border border-border bg-card px-6 pb-6 pt-8">
            <div className="flex items-start justify-between">
              <div>
                <p className="data-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                  Receipt dn-1001
                </p>
                <h2 className="mt-1 text-2xl">Amina Hassan</h2>
                <p className="text-sm text-muted-foreground">Kilifi Water Trust</p>
              </div>
              <StampBadge status="verified" size="lg" />
            </div>
            <div className="mt-5 space-y-1.5 text-sm">
              <LineItem label="Amount" value="120.00 USDC" mono />
              <LineItem label="Sent" value="2026-07-16 09:12 UTC" mono />
              <LineItem label="Tx" value={shortAddress("0x8f2a41c7d90b35e6a1c04f7b28de5931ac60f4b7e21d8305c9a7b40e16fd2c85")} mono />
            </div>
            <div className="dotted-rule mt-5 pt-5">
              <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
                What happened to it
              </p>
              <p className="mt-2 text-sm leading-relaxed">
                A replacement pump head and two lengths of pipe, bought at Mtwapa Hardware. The
                borehole was running again the same afternoon.
              </p>
              <p className="mt-4 font-display text-lg leading-snug">
                “The queue at the well is twenty minutes now, not two hours.”
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-border">
        <div className="mx-auto max-w-6xl px-5 pt-14">
          <h2 className="text-3xl">How it works, in three steps</h2>
        </div>
        <div className="mx-auto grid max-w-6xl gap-8 px-5 pb-6 pt-8 sm:grid-cols-3">
          <Step n="01" title="You send a donation">
            Pick a cause, choose an amount, and decide whether your name shows publicly.
          </Step>
          <Step n="02" title="The recipient confirms receipt">
            The moment funds land, the receipt flips from waiting to received.
          </Step>
          <Step n="03" title="Proof of use gets stamped">
            A photo, a short note and a testimonial are attached. The stamp turns green.
          </Step>
        </div>
        <div className="mx-auto max-w-6xl px-5 pb-14">
          <Link to="/how-it-works" className="text-sm font-medium underline-offset-4 hover:underline">
            Read the longer walkthrough
          </Link>
        </div>
      </section>

      <DemoSimulator />


      <section id="causes" className="mx-auto max-w-6xl scroll-mt-16 px-5 py-16">
        <h2 className="text-3xl sm:text-4xl">Causes accepting donations</h2>
        <p className="mt-2 max-w-xl text-muted-foreground">
          The trust score is simply the share of this organisation's donations that came back with
          proof of use.
        </p>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {organisations.map((org) => {
            const score = orgTrustScore(org.id);
            return (
              <div key={org.id} className="flex flex-col border border-border bg-card">
                <img
                  src={org.imageUrl}
                  alt={`${org.name} at work`}
                  loading="lazy"
                  className="h-36 w-full object-cover"
                />
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="text-xl leading-tight">
                    <Link
                      to="/cause/$orgId"
                      params={{ orgId: org.id }}
                      className="underline-offset-4 hover:underline"
                    >
                      {org.name}
                    </Link>
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">{org.tagline}</p>
                  <p className="mt-3 flex-1 text-sm leading-relaxed">{org.description}</p>

                  <div className="dotted-rule mt-4 flex items-center justify-between pt-4">
                    <div>
                      <p className="data-mono text-lg font-medium text-verified">{score}%</p>
                      <p className="text-xs text-muted-foreground">donations with proof</p>
                    </div>
                    <Link
                      to="/cause/$orgId"
                      params={{ orgId: org.id }}
                      className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
                    >
                      View cause
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-widest text-muted-foreground">{label}</dt>
      <dd className="data-mono mt-1 text-2xl">{value}</dd>
    </div>
  );
}

function LineItem({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className={mono ? "data-mono text-right" : "text-right"}>{value}</span>
    </div>
  );
}

function Step({ n, title, children }: { n: string; title: string; children: string }) {
  return (
    <div>
      <p className="data-mono text-xs tracking-widest text-verified">{n}</p>
      <h3 className="mt-2 text-xl">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{children}</p>
    </div>
  );
}
