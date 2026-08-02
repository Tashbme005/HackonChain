import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Check, Loader2, Play, RotateCcw } from "lucide-react";

import { StampBadge } from "@/components/openimpact/StampBadge";
import { formatAmount, useLedger } from "@/lib/openimpact/store";
import { recipientPublicLabel, shortWallet } from "@/lib/openimpact/types";
import {
  confirmReceiptOnChain,
  createDonationOnChain,
  isContractConfigured,
  mockTxHash,
  rememberOnChainDonationId,
  submitProofHashOnChain,
} from "@/lib/openimpact/web3";
import { cn } from "@/lib/utils";

/**
 * Guided, no-account preview of the whole OpenImpact loop for hackathon judges.
 * Everything here is scripted mock data — it deliberately looks like a preview
 * panel, not the real product surface.
 */

interface DemoScript {
  amount: number;
  donorNote: string;
  description: string;
  testimonial: string;
}

const DEFAULT_SCRIPT: DemoScript = {
  amount: 75,
  donorNote: "Use it wherever it's needed most.",
  description:
    "Spent the same week on supplies for the project, with the receipt photographed at the counter.",
  testimonial: "It arrived fast and we could show exactly what it paid for.",
};

const SCRIPTS: Record<string, DemoScript> = {
  "org-kilifi": {
    amount: 120,
    donorNote: "For the borehole repair.",
    description:
      "A replacement pump head and two lengths of pipe from Mtwapa Hardware. The borehole was running again the same afternoon.",
    testimonial: "The queue at the well is twenty minutes now, not two hours.",
  },
  "a1000000-0000-4000-8000-000000000001": {
    amount: 120,
    donorNote: "For the borehole repair.",
    description:
      "A replacement pump head and two lengths of pipe from Mtwapa Hardware. The borehole was running again the same afternoon.",
    testimonial: "The queue at the well is twenty minutes now, not two hours.",
  },
  "org-booklift": {
    amount: 60,
    donorNote: "Books, please.",
    description:
      "Forty second-hand readers and a shelf, collected from the district depot and logged into the classroom library.",
    testimonial: "Every child in the class has a book on their desk this term.",
  },
  "a1000000-0000-4000-8000-000000000002": {
    amount: 60,
    donorNote: "Books, please.",
    description:
      "Forty second-hand readers and a shelf, collected from the district depot and logged into the classroom library.",
    testimonial: "Every child in the class has a book on their desk this term.",
  },
  "org-nightshift": {
    amount: 90,
    donorNote: "Hot meals for the winter shift.",
    description:
      "Bulk rice, oil and vegetables for four nights of service, bought at the wholesale market.",
    testimonial: "Nobody was turned away at the door last week.",
  },
  "a1000000-0000-4000-8000-000000000003": {
    amount: 90,
    donorNote: "Hot meals for the winter shift.",
    description:
      "Bulk rice, oil and vegetables for four nights of service, bought at the wholesale market.",
    testimonial: "Nobody was turned away at the door last week.",
  },
  "org-solarseed": {
    amount: 150,
    donorNote: "Towards the panel.",
    description:
      "One 200W panel and a charge controller, installed on the workshop roof by the local fitter.",
    testimonial: "The sewing machines run all day now, no generator fuel.",
  },
  "a1000000-0000-4000-8000-000000000004": {
    amount: 150,
    donorNote: "Towards the panel.",
    description:
      "One 200W panel and a charge controller, installed on the workshop roof by the local fitter.",
    testimonial: "The sewing machines run all day now, no generator fuel.",
  },
};

const STEPS = ["Cause", "Donate", "Confirm", "Proof", "Receipt"] as const;

export function DemoSimulator() {
  const { organisations, recipients, addDonation, confirmReceipt, attachProofToDonation } =
    useLedger();

  const [step, setStep] = useState(0);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [donationId, setDonationId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const org = organisations.find((o) => o.id === orgId);
  const recipient = recipients.find((r) => r.orgId === orgId);
  const script = (orgId && SCRIPTS[orgId]) || DEFAULT_SCRIPT;
  const currency = isContractConfigured() ? "ETH" : "USDC";

  function reset() {
    setStep(0);
    setOrgId(null);
    setDonationId(null);
  }

  async function next() {
    if (busy || !org || !recipient) return;
    setBusy(true);
    try {
      if (step === 1) {
        const id = `dn-demo-${Date.now().toString(36)}`;
        const result = await createDonationOnChain({
          organisation: org.walletAddress,
          recipient: recipient.walletAddress,
          amountUsdc: script.amount,
        }).catch(() => ({
          txHash: mockTxHash(),
          onChainDonationId: undefined as string | undefined,
        }));
        if (result.onChainDonationId) {
          rememberOnChainDonationId(id, result.onChainDonationId);
        }
        const saved = await addDonation({
          id,
          donorName: "Demo Visitor",
          isPublic: true,
          amount: script.amount,
          currency,
          recipientId: recipient.id,
          orgId: org.id,
          status: "pending",
          txHash: result.txHash,
          onChainDonationId: result.onChainDonationId,
          timestamp: new Date().toISOString(),
          note: script.donorNote,
          proof: null,
        });
        setDonationId(saved.id);
      } else if (step === 2 && donationId) {
        await wait(600);
        await confirmReceiptOnChain(donationId);
        await confirmReceipt(donationId);
      } else if (step === 3 && donationId) {
        await wait(700);
        await submitProofHashOnChain(donationId, {
          photoUrl: org.imageUrl,
          description: script.description,
          testimonial: script.testimonial,
        });
        await attachProofToDonation(donationId, {
          photoUrl: org.imageUrl,
          description: script.description,
          testimonial: script.testimonial,
          submittedAt: new Date().toISOString(),
        });
      }
      setStep((s) => s + 1);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section id="try-it" className="scroll-mt-20 border-y border-border bg-ink text-paper">
      <div className="page-shell grid gap-8 py-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-stretch lg:gap-14 lg:py-16">
        {/* Left — intro + steps (horizontal on small screens, vertical on lg) */}
        <div className="lg:sticky lg:top-28 lg:self-start">
          <p className="data-mono text-[11px] uppercase tracking-[0.2em] text-paper/55">
            Guided preview · ~40s · no wallet
          </p>
          <h2 className="mt-3 font-display text-3xl text-paper sm:text-4xl">Try it yourself</h2>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-paper/70 sm:text-base">
            Walk the full loop on a scripted example — then open the public receipt it creates.
          </p>

          {/* Mobile / tablet: one horizontal line */}
          <ol className="mt-6 flex items-center gap-1 lg:hidden">
            {STEPS.map((label, i) => {
              const done = i < step;
              const active = i === step;
              return (
                <li key={label} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
                  <div className="flex w-full items-center">
                    {i > 0 && (
                      <span
                        className={cn("h-px flex-1", done || active ? "bg-verified" : "bg-paper/20")}
                        aria-hidden
                      />
                    )}
                    <span
                      className={cn(
                        "flex size-7 shrink-0 items-center justify-center rounded-full text-[11px] font-medium",
                        done && "bg-verified text-verified-foreground",
                        active && "bg-paper text-ink",
                        !done && !active && "border border-paper/25 text-paper/45",
                      )}
                    >
                      {done ? <Check className="size-3.5" strokeWidth={3} aria-hidden /> : i + 1}
                    </span>
                    {i < STEPS.length - 1 && (
                      <span
                        className={cn("h-px flex-1", done ? "bg-verified" : "bg-paper/20")}
                        aria-hidden
                      />
                    )}
                  </div>
                  <span
                    className={cn(
                      "data-mono max-w-full truncate text-[9px] uppercase tracking-wider",
                      active && "text-paper",
                      done && "text-verified",
                      !done && !active && "text-paper/45",
                    )}
                  >
                    {label}
                  </span>
                </li>
              );
            })}
          </ol>

          {/* Desktop: vertical list */}
          <ol className="mt-8 hidden space-y-0 lg:block">
            {STEPS.map((label, i) => {
              const done = i < step;
              const active = i === step;
              return (
                <li key={label} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <span
                      className={cn(
                        "flex size-7 shrink-0 items-center justify-center rounded-full text-[11px] font-medium",
                        done && "bg-verified text-verified-foreground",
                        active && "bg-paper text-ink",
                        !done && !active && "border border-paper/25 text-paper/45",
                      )}
                    >
                      {done ? <Check className="size-3.5" strokeWidth={3} aria-hidden /> : i + 1}
                    </span>
                    {i < STEPS.length - 1 && (
                      <span
                        className={cn(
                          "my-1 h-5 w-px",
                          done ? "bg-verified/70" : "bg-paper/20",
                        )}
                        aria-hidden
                      />
                    )}
                  </div>
                  <span
                    className={cn(
                      "pt-1 text-sm",
                      active && "font-medium text-paper",
                      done && "text-verified",
                      !done && !active && "text-paper/45",
                    )}
                  >
                    {label}
                  </span>
                </li>
              );
            })}
          </ol>

          {step < 4 && (
            <div className="mt-8 hidden flex-wrap items-center gap-3 lg:flex">
              <button
                type="button"
                onClick={next}
                disabled={!orgId || busy}
                className="inline-flex items-center gap-2 rounded-full bg-paper px-5 py-2.5 text-sm font-medium text-ink transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                {busy ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : (
                  <Play className="size-4" aria-hidden />
                )}
                {step === 0 ? "Start the demo" : "Next"}
              </button>
              {step > 0 && (
                <button
                  type="button"
                  onClick={reset}
                  className="text-sm text-paper/60 underline-offset-4 hover:text-paper hover:underline"
                >
                  Start over
                </button>
              )}
            </div>
          )}
          {step === 0 && !orgId && (
            <p className="mt-3 hidden text-xs text-paper/50 lg:block">
              Pick an organisation on the right to begin.
            </p>
          )}
        </div>

        {/* Right — interactive stage + mobile actions below the card */}
        <div className="flex min-w-0 flex-col gap-4">
        <div className="receipt-edge flex min-h-[24rem] w-full flex-col justify-center border border-paper/15 bg-paper px-5 py-8 text-ink sm:px-8 sm:py-10 lg:min-h-full">
          {step === 0 && (
            <div>
              <StageHeader
                kicker="Step 1"
                title="Pick an organisation"
                subtitle="The demo donation will go to this organisation."
              />
              <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
                {organisations.map((o) => {
                  const selected = o.id === orgId;
                  return (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => setOrgId(o.id)}
                      aria-pressed={selected}
                      className={cn(
                        "flex items-center gap-3 overflow-hidden border p-2 text-left transition-all",
                        selected
                          ? "border-verified bg-verified-soft ring-1 ring-verified/40"
                          : "border-border hover:border-ink/30 hover:bg-accent/60",
                      )}
                    >
                      <img
                        src={o.imageUrl}
                        alt=""
                        loading="lazy"
                        className="size-12 shrink-0 object-cover"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{o.name}</span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {o.tagline}
                        </span>
                      </span>
                      {selected && (
                        <span className="mr-1 flex size-5 shrink-0 items-center justify-center rounded-full bg-verified text-verified-foreground">
                          <Check className="size-3" strokeWidth={3} aria-hidden />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 1 && org && recipient && (
            <div>
              <StageHeader
                kicker="Step 2"
                title="Send the donation"
                subtitle="Pre-filled for the demo — in the real flow you'd connect a wallet here."
              />
              <div className="mt-5 flex items-end justify-between gap-4 border border-border bg-card px-4 py-4">
                <div>
                  <p className="data-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                    Amount
                  </p>
                  <p className="data-mono mt-1 text-3xl font-medium">
                    {formatAmount(script.amount, currency)}
                  </p>
                </div>
                <StampBadge status="pending" />
              </div>
              <dl className="mt-4 space-y-2.5 text-sm">
                <Row label="To" value={org.name} />
                <Row
                  label="Recipient"
                  value={`${recipientPublicLabel(recipient)} · ${shortWallet(recipient.walletAddress)}`}
                />
                <Row label="Donor" value="Demo Visitor (public)" />
                <Row label="Note" value={script.donorNote} />
              </dl>
            </div>
          )}

          {step === 2 && recipient && (
            <div>
              <div className="flex items-start gap-4">
                <StampBadge status="pending" size="lg" />
                <StageHeader
                  kicker="Step 3"
                  title={`${recipientPublicLabel(recipient)} confirms receipt`}
                  subtitle="The receipt is waiting. Next marks the funds as received for them."
                />
              </div>
            </div>
          )}

          {step === 3 && org && recipient && (
            <div>
              <div className="flex items-start gap-4">
                <StampBadge status="received" size="lg" />
                <StageHeader
                  kicker="Step 4"
                  title="Attach proof of use"
                  subtitle={`Next files the scripted proof for ${recipientPublicLabel(recipient)}.`}
                />
              </div>
              <div className="mt-5 overflow-hidden border border-border bg-card">
                <img src={org.imageUrl} alt="" className="h-32 w-full object-cover" />
                <div className="px-4 py-4">
                  <p className="text-sm leading-relaxed">{script.description}</p>
                  <p className="mt-3 font-display text-base leading-snug">
                    “{script.testimonial}”
                  </p>
                </div>
              </div>
            </div>
          )}

          {step === 4 && donationId && (
            <div>
              <div className="flex items-start gap-4">
                <StampBadge status="verified" size="lg" animate />
                <StageHeader
                  kicker="Step 5"
                  title="Receipt verified"
                  subtitle="That's the full loop. Open it exactly as any donor — or anyone with the link — would."
                />
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  to="/proof/$donationId"
                  params={{ donationId }}
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
                >
                  Open the public receipt
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
                <button
                  type="button"
                  onClick={reset}
                  className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-medium transition-colors hover:bg-accent"
                >
                  <RotateCcw className="size-4" aria-hidden />
                  Run it again
                </button>
              </div>
            </div>
          )}
        </div>

          {step < 4 && (
            <div className="flex flex-wrap items-center gap-3 lg:hidden">
              <button
                type="button"
                onClick={next}
                disabled={!orgId || busy}
                className="inline-flex items-center gap-2 rounded-full bg-paper px-5 py-2.5 text-sm font-medium text-ink transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                {busy ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : (
                  <Play className="size-4" aria-hidden />
                )}
                {step === 0 ? "Start the demo" : "Next"}
              </button>
              {step > 0 && (
                <button
                  type="button"
                  onClick={reset}
                  className="text-sm text-paper/60 underline-offset-4 hover:text-paper hover:underline"
                >
                  Start over
                </button>
              )}
            </div>
          )}
          {step === 0 && !orgId && (
            <p className="text-xs text-paper/50 lg:hidden">
              Pick an organisation in the card above to begin.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

function StageHeader({
  kicker,
  title,
  subtitle,
}: {
  kicker: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div>
      <p className="data-mono text-[11px] uppercase tracking-[0.2em] text-verified">{kicker}</p>
      <h3 className="mt-1.5 font-display text-2xl leading-snug text-ink">{title}</h3>
      <p className="mt-2 max-w-xl text-sm text-muted-foreground">{subtitle}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-border/70 pb-2.5 last:border-0 last:pb-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="data-mono text-right text-xs text-ink sm:text-sm">{value}</dd>
    </div>
  );
}

function wait(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
