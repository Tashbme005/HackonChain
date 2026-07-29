import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Flag,
  Image,
  Shield,
  UserRound,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { PrototypeNotice } from "@/components/openimpact/PrototypeNotice";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/trust")({
  head: () => ({
    meta: [
      { title: "OpenImpact" },
      {
        name: "description",
        content:
          "Plain-language answers: your name is optional, transactions are traceable by amount and wallet, and personal details never go on the ledger.",
      },
      { property: "og:title", content: "OpenImpact" },
      {
        property: "og:description",
        content:
          "What's public, what's private, and what you control — in plain words.",
      },
    ],
  }),
  component: TrustPage,
});

const PUBLIC_ITEMS = [
  "Amount and currency",
  "Date and time sent",
  "Transaction reference and wallet addresses",
  "Cause and recipient",
  "Proof of use: photo, note, testimonial",
  "Display name, only if you choose it",
];

const PRIVATE_ITEMS = [
  "Email, phone, and postal address",
  "Legal name, unless you type it as your display name",
  "Card or bank payment details",
  "Recipients' home addresses and contact details",
  "Any note you mark private",
];

const DETAILS = [
  {
    icon: UserRound,
    title: "Giving anonymously",
    lede: "One switch per donation: show your name, or show “Anonymous.”",
    points: [
      "Change it later from your donor profile.",
      "Amount and proof stay public either way.",
      "Only your name is removed from the receipt.",
    ],
  },
  {
    icon: Shield,
    title: "What “traceable” means",
    lede: "Wallet amounts in and out are public by design.",
    points: [
      "A wallet address is not your name.",
      "If you link it to yourself, its history is visible.",
      "Prefer a wallet you use only for donations.",
    ],
  },
  {
    icon: Image,
    title: "Photos of people",
    lede: "Proof should show what was bought, not parade recipients.",
    points: [
      "Photograph the item, repair, or shop receipt.",
      "Get permission before including anyone's face.",
      "Any receipt can be reported and pulled for review.",
    ],
  },
  {
    icon: Flag,
    title: "When something looks wrong",
    lede: "Reused photos are flagged, not quietly approved.",
    points: [
      "The receipt stamps red and stays visible.",
      "It says it is under review.",
      "We'd rather show a flag than a tidy lie.",
    ],
  },
] as const;

function TrustPage() {
  return (
    <div className="page-shell page-top pb-16 sm:pb-20">
      <header className="max-w-3xl">
        <p className="data-mono text-[11px] uppercase tracking-[0.2em] text-verified sm:text-xs">
          Trust &amp; privacy
        </p>
        <h1 className="mt-3 font-display text-[clamp(1.85rem,4.2vw,3.25rem)] leading-[1.12] tracking-tight text-ink">
          Transparent about the money. Optional about yourself.
        </h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          A public ledger only works if people know exactly what it shows. Here
          it is, without the legal wording.
        </p>
      </header>

      <section
        className="mt-10 sm:mt-12"
        aria-labelledby="ledger-split-heading"
      >
        <h2 id="ledger-split-heading" className="sr-only">
          What is public and what stays private
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:gap-6">
          <div className="min-w-0 rounded-2xl border border-border bg-verified/8 p-3.5 sm:p-6 lg:p-7">
            <div className="flex items-start gap-2 sm:gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-verified text-verified-foreground sm:size-10">
                <Eye className="size-4 sm:size-5" aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="data-mono text-[10px] uppercase tracking-widest text-verified">
                  On the ledger
                </p>
                <h3 className="font-display text-base text-ink sm:text-xl lg:text-2xl">
                  Public to anyone
                </h3>
              </div>
            </div>
            <ul className="mt-4 space-y-2 sm:mt-5 sm:space-y-2.5">
              {PUBLIC_ITEMS.map((item) => (
                <li
                  key={item}
                  className="flex gap-2 text-[12px] leading-relaxed text-ink/80 sm:gap-2.5 sm:text-sm"
                >
                  <span
                    className="mt-1.5 size-1.5 shrink-0 rounded-full bg-verified"
                    aria-hidden
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="min-w-0 rounded-2xl border border-border bg-card p-3.5 sm:p-6 lg:p-7">
            <div className="flex items-start gap-2 sm:gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-ink text-paper sm:size-10">
                <EyeOff className="size-4 sm:size-5" aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="data-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  Kept off-chain
                </p>
                <h3 className="font-display text-base text-ink sm:text-xl lg:text-2xl">
                  Never on the ledger
                </h3>
              </div>
            </div>
            <ul className="mt-4 space-y-2 sm:mt-5 sm:space-y-2.5">
              {PRIVATE_ITEMS.map((item) => (
                <li
                  key={item}
                  className="flex gap-2 text-[12px] leading-relaxed text-ink/80 sm:gap-2.5 sm:text-sm"
                >
                  <span
                    className="mt-1.5 size-1.5 shrink-0 rounded-full bg-ink/35"
                    aria-hidden
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="mt-12 sm:mt-16" aria-labelledby="details-heading">
        <p className="data-mono text-[11px] uppercase tracking-[0.2em] text-verified">
          The finer points
        </p>
        <h2
          id="details-heading"
          className="mt-2 font-display text-2xl text-ink sm:text-3xl"
        >
          How your choices work in practice
        </h2>

        <ul className="mt-8 grid grid-cols-2 gap-3 sm:gap-5 lg:gap-6">
          {DETAILS.map((detail, i) => (
            <li key={detail.title} className="min-w-0">
              <DetailCard detail={detail} index={i} />
            </li>
          ))}
        </ul>
      </section>

      <aside className="mt-12 border-t border-border pt-10 sm:mt-14">
        <p className="max-w-2xl font-display text-2xl leading-snug text-ink sm:text-3xl">
          The money is public. You are optional. Your personal details are never
          part of the record.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            to="/organisations"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Find a cause
            <ArrowRight className="size-4" aria-hidden />
          </Link>
          <Link
            to="/how-it-works"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-6 py-3 text-sm font-medium text-ink transition-colors hover:bg-accent"
          >
            How it works
          </Link>
        </div>
        <PrototypeNotice className="mt-10 max-w-xl" />
      </aside>
    </div>
  );
}

function DetailCard({
  detail,
  index,
}: {
  detail: (typeof DETAILS)[number];
  index: number;
}) {
  const Icon = detail.icon;
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
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-border bg-background text-ink sm:size-10">
          <Icon className="size-4 sm:size-5" aria-hidden />
        </span>
        <h3 className="font-display text-base leading-tight text-ink sm:text-xl lg:text-2xl">
          {detail.title}
        </h3>
      </div>

      <p className="mt-2.5 text-sm font-medium leading-snug text-ink sm:mt-3 sm:text-base">
        {detail.lede}
      </p>

      <ul className="mt-3 space-y-2 sm:mt-4 sm:space-y-2.5">
        {detail.points.map((point) => (
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
