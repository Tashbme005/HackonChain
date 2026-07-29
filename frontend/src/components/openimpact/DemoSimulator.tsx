import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Loader2, Play, RotateCcw, Wand2 } from "lucide-react";

import { StampBadge } from "@/components/openimpact/StampBadge";
import { formatAmount, useLedger } from "@/lib/openimpact/store";
import { recipientPublicLabel, shortWallet } from "@/lib/openimpact/types";
import { mockTxHash, submitToChain } from "@/lib/openimpact/web3";

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
  // Seed UUID aliases (backend/supabase/seed.sql)
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

const STEPS = ["Pick a cause", "Donate", "Recipient confirms", "Proof of use", "Receipt"];

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
        const txHash = await submitToChain({
          demo: true,
          orgId: org.id,
          recipientId: recipient.id,
          amount: script.amount,
        }).catch(() => mockTxHash());
        const saved = await addDonation({
          id,
          donorName: "Demo Visitor",
          isPublic: true,
          amount: script.amount,
          currency: "USDC",
          recipientId: recipient.id,
          orgId: org.id,
          status: "pending",
          txHash,
          timestamp: new Date().toISOString(),
          note: script.donorNote,
          proof: null,
        });
        setDonationId(saved.id);
      } else if (step === 2 && donationId) {
        await wait(600);
        await confirmReceipt(donationId);
      } else if (step === 3 && donationId) {
        await wait(700);
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
    <section
      id="try-it"
      className="scroll-mt-16 border-y-2 border-dashed border-pending/60 bg-pending/[0.06]"
    >
      <div className="mx-auto max-w-4xl px-5 py-14">
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-full border border-dashed border-pending px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-pending data-mono">
            <Wand2 className="size-3.5" aria-hidden />
            Guided preview
          </span>
          <span className="text-xs text-muted-foreground">
            Mock data · no account · about 40 seconds
          </span>
        </div>

        <h2 className="mt-4 text-3xl sm:text-4xl">Try it yourself</h2>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Walk the whole loop — donation, confirmation, proof of use — on a scripted example, then
          land on the public receipt it produced. Nothing here is real money.
        </p>

        <ol className="data-mono mt-7 flex flex-wrap gap-x-5 gap-y-2 text-[11px] uppercase tracking-widest">
          {STEPS.map((label, i) => (
            <li
              key={label}
              className={
                i === step
                  ? "text-pending"
                  : i < step
                    ? "text-verified"
                    : "text-muted-foreground/60"
              }
            >
              {String(i + 1).padStart(2, "0")} {label}
            </li>
          ))}
        </ol>

        <div className="mt-6 border border-dashed border-pending/60 bg-card p-5 sm:p-7">
          {step === 0 && (
            <div>
              <p className="text-sm text-muted-foreground">
                Step 1 — choose the cause the demo donation goes to.
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {organisations.map((o) => {
                  const selected = o.id === orgId;
                  return (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => setOrgId(o.id)}
                      aria-pressed={selected}
                      className={`flex items-center gap-3 border p-3 text-left transition-colors ${selected
                          ? "border-pending bg-pending/10"
                          : "border-border hover:bg-accent"
                        }`}
                    >
                      <img
                        src={o.imageUrl}
                        alt=""
                        loading="lazy"
                        className="size-12 shrink-0 object-cover"
                      />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">{o.name}</span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {o.tagline}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 1 && org && recipient && (
            <PanelBody
              caption="Step 2 — the donation, pre-filled"
              title={`Send ${formatAmount(script.amount, "USDC")} to ${org.name}`}
            >
              <Line label="Recipient" value={`${recipientPublicLabel(recipient)} · ${shortWallet(recipient.walletAddress)}`} />
              <Line label="Donor" value="Demo Visitor (public)" />
              <Line label="Note" value={script.donorNote} />
              <p className="pt-2 text-xs text-muted-foreground">
                In the real flow you'd connect a wallet here. Press Next to submit the scripted
                transaction.
              </p>
            </PanelBody>
          )}

          {step === 2 && recipient && (
            <PanelBody
              caption="Step 3 — recipient's view"
              title={`${recipientPublicLabel(recipient)} sees the funds land`}
            >
              <div className="flex items-center gap-3">
                <StampBadge status="pending" />
                <p className="text-sm text-muted-foreground">
                  The receipt is waiting. Next presses “Confirm funds received” for them.
                </p>
              </div>
            </PanelBody>
          )}

          {step === 3 && recipient && (
            <PanelBody
              caption="Step 4 — proof of use"
              title="A photo, a description and a testimonial get attached"
            >
              <div className="flex items-center gap-3">
                <StampBadge status="received" />
                <p className="text-sm text-muted-foreground">
                  Next uploads the scripted proof on behalf of {recipientPublicLabel(recipient)}.
                </p>
              </div>
              <p className="mt-3 border-l-2 border-border pl-3 text-sm leading-relaxed">
                {script.description}
              </p>
            </PanelBody>
          )}

          {step === 4 && donationId && (
            <PanelBody caption="Step 5 — done" title="The receipt is now public and verified">
              <div className="flex items-center gap-3">
                <StampBadge status="verified" size="lg" animate />
                <p className="text-sm text-muted-foreground">
                  That's the full loop. Open the receipt to see the proof exactly as any donor —
                  or anyone with the link — would.
                </p>
              </div>
              <div className="mt-5 flex flex-wrap items-center gap-3">
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
                  className="inline-flex items-center gap-2 text-sm font-medium underline-offset-4 hover:underline"
                >
                  <RotateCcw className="size-4" aria-hidden />
                  Run it again
                </button>
              </div>
            </PanelBody>
          )}

          {step < 4 && (
            <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-dashed border-border pt-5">
              <button
                type="button"
                onClick={next}
                disabled={!orgId || busy}
                className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
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
                  className="text-sm text-muted-foreground underline-offset-4 hover:underline"
                >
                  Start over
                </button>
              )}
              {!orgId && (
                <span className="text-xs text-muted-foreground">Pick a cause to begin.</span>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function PanelBody({
  caption,
  title,
  children,
}: {
  caption: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="data-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
        {caption}
      </p>
      <h3 className="mt-2 text-2xl leading-snug">{title}</h3>
      <div className="mt-4 space-y-1.5 text-sm">{children}</div>
    </div>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="data-mono text-right text-xs">{value}</span>
    </div>
  );
}

function wait(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
