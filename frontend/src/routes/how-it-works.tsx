import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { StampBadge } from "@/components/openimpact/StampBadge";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "OpenImpact" },
      {
        name: "description",
        content:
          "A step-by-step walkthrough of an OpenImpact donation, written for people who have never used a crypto wallet: donate, the recipient confirms, they show proof, you verify it.",
      },
      { property: "og:title", content: "OpenImpact" },
      {
        property: "og:description",
        content: "Donate, confirm, prove, verify — four steps, no crypto jargon.",
      },
    ],
  }),
  component: HowItWorksPage,
});

const STEPS = [
  {
    n: "01",
    title: "Donate",
    lede: "Pick a cause and an amount. That is the whole decision.",
    points: [
      "Connect a wallet, or create one in about a minute.",
      "Show your name on the receipt, or stay anonymous.",
      "The receipt appears right away with an amber stamp: waiting to be received.",
    ],
  },
  {
    n: "02",
    title: "Confirm",
    lede: "The recipient marks that the money arrived.",
    points: [
      "One button: “I've received this.” No forms or jargon.",
      "Your receipt updates from waiting to received, live.",
      "If it sits waiting too long, that stays visible on the public page.",
    ],
  },
  {
    n: "03",
    title: "Prove",
    lede: "They show what the money paid for.",
    points: [
      "Upload a photo of the purchase or repair, plus a short note.",
      "Proof attaches to your specific receipt, not a yearly report.",
    ],
  },
  {
    n: "04",
    title: "Verify",
    lede: "The receipt turns green. Anyone can check it.",
    points: [
      "Reuse of an old photo flags the receipt red for review.",
      "Otherwise the stamp fills green with amount, date, and proof.",
      "Each verified receipt lifts the organisation's public score.",
    ],
  },
] as const;

const STAMPS = [
  {
    status: "pending" as const,
    label: "Amber, dashed",
    detail: "Waiting to be received, or received and waiting for proof.",
  },
  {
    status: "verified" as const,
    label: "Green, filled",
    detail: "Proof of use is attached and the receipt is public.",
  },
  {
    status: "flagged" as const,
    label: "Red, filled",
    detail: "Something didn't check out. Held for review rather than approved.",
  },
];

function HowItWorksPage() {
  return (
    <div className="page-shell page-top pb-16 sm:pb-20">
      <header className="max-w-3xl">
        <p className="data-mono text-[11px] uppercase tracking-[0.2em] text-verified sm:text-xs">
          How it works
        </p>
        <h1 className="mt-3 font-display text-[clamp(1.85rem,4.2vw,3.25rem)] leading-[1.12] tracking-tight text-ink">
          Four steps between your money and the proof it worked.
        </h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          No experience with wallets or crypto needed. Here&apos;s what actually
          happens, in order.
        </p>
        <div className="mt-7 flex flex-wrap items-center gap-3">
          <Link
            to="/"
            hash="try-it"
            className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 sm:px-6 sm:py-3"
          >
            Try the 40 second demo
          </Link>
          <Link
            to="/organisations"
            className="inline-flex items-center justify-center rounded-full border border-border bg-background px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-accent sm:px-6 sm:py-3"
          >
            Browse organisations
          </Link>
        </div>
      </header>

      <nav aria-label="Steps overview" className="mt-10 sm:mt-12">
        <ol className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
          {STEPS.map((s) => (
            <li key={s.n}>
              <a
                href={`#step-${s.n}`}
                className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5 transition-colors hover:border-ink/25 hover:bg-accent sm:gap-2.5 sm:px-4 sm:py-3"
              >
                <span className="data-mono text-[11px] tracking-widest text-verified">
                  {s.n}
                </span>
                <span className="min-w-0 truncate text-sm font-medium text-ink">
                  {s.title}
                </span>
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <ol className="mt-10 grid grid-cols-2 gap-3 sm:mt-14 sm:gap-5 lg:gap-6">
        {STEPS.map((s, i) => (
          <li
            key={s.n}
            id={`step-${s.n}`}
            className="min-w-0 scroll-mt-28"
          >
            <StepCard step={s} index={i} />
          </li>
        ))}
      </ol>

      <section
        className="mt-12 border-t border-border pt-10 sm:mt-16 sm:pt-14"
        aria-labelledby="stamps-heading"
      >
        <p className="data-mono text-[11px] uppercase tracking-[0.2em] text-verified">
          Receipt stamps
        </p>
        <h2
          id="stamps-heading"
          className="mt-2 font-display text-2xl text-ink sm:text-3xl"
        >
          What the stamps mean
        </h2>
        <ul className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-5">
          {STAMPS.map((stamp) => (
            <li
              key={stamp.label}
              className="flex flex-col items-start gap-3 rounded-2xl border border-border bg-card/60 p-5"
            >
              <StampBadge status={stamp.status} size="md" />
              <div>
                <p className="text-sm font-medium text-ink">{stamp.label}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {stamp.detail}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-12 flex flex-wrap items-center gap-3 border-t border-border pt-10 sm:mt-14 sm:gap-4">
        <Link
          to="/organisations"
          className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          Find a cause
          <ArrowRight className="size-4" aria-hidden />
        </Link>
        <Link
          to="/trust"
          className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-6 py-3 text-sm font-medium text-ink transition-colors hover:bg-accent"
        >
          What&apos;s public and what isn&apos;t
        </Link>
      </div>
    </div>
  );
}

function StepCard({
  step,
  index,
}: {
  step: (typeof STEPS)[number];
  index: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.25 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={cn(
        "flex h-full min-w-0 flex-col rounded-2xl border border-border bg-card p-3.5 sm:p-6 lg:p-7",
        "transition-all duration-700",
        visible ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0",
      )}
      style={{ transitionDelay: visible ? `${index * 80}ms` : "0ms" }}
    >
      <div className="flex items-start gap-2 sm:gap-3">
        <span className="data-mono flex size-8 shrink-0 items-center justify-center rounded-full border border-verified/45 bg-background text-[10px] tracking-widest text-verified sm:size-10 sm:text-xs">
          {step.n}
        </span>
        <h2 className="font-display text-lg leading-tight text-ink sm:text-2xl lg:text-3xl">
          {step.title}
        </h2>
      </div>

      <p className="mt-2.5 text-sm font-medium leading-snug text-ink sm:mt-3 sm:text-base lg:text-lg">
        {step.lede}
      </p>

      <ul className="mt-3 space-y-2 sm:mt-4 sm:space-y-2.5">
        {step.points.map((point) => (
          <li
            key={point}
            className="flex gap-2 text-[12px] leading-relaxed text-muted-foreground sm:gap-2.5 sm:text-sm"
          >
            <span
              className="mt-1.5 size-1.5 shrink-0 rounded-full bg-verified"
              aria-hidden
            />
            <span>{point}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
