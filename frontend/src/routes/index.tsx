import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

import { AboutVisualSlider } from "@/components/openimpact/AboutVisualSlider";
import { BrandWordmark } from "@/components/openimpact/BrandLogo";
import { DemoSimulator } from "@/components/openimpact/DemoSimulator";
import { HeroBackgroundSlider } from "@/components/openimpact/HeroBackgroundSlider";
import { HowItWorksFlow } from "@/components/openimpact/HowItWorksFlow";
import { PrototypeNotice } from "@/components/openimpact/PrototypeNotice";
import { StampBadge } from "@/components/openimpact/StampBadge";
import { TestimonialCarousel } from "@/components/ui/profile-card-testimonial-carousel";
import { useCountUp, useTypewriter } from "@/hooks/use-motion-text";
import { useLedger } from "@/lib/openimpact/store";
import { shortAddress } from "@/lib/openimpact/web3";

/** Home = About: hero story, proof strip, about copy, how it works, demo. */
export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "OpenImpact" },
      {
        name: "description",
        content:
          "Giving usually ends at thank you. OpenImpact closes the gap with a public receipt and proof of use for every donation.",
      },
      { property: "og:title", content: "OpenImpact" },
      {
        property: "og:description",
        content:
          "The accountability gap in giving, and how a public receipt closes it.",
      },
    ],
  }),
  component: AboutHome,
});

function AboutHome() {
  const { recipients, donations, organisations } = useLedger();
  const verified = donations.filter((d) => d.status === "verified").length;
  const headline = "Every donation, a receipt you can verify.";
  const { shown: typedHeadline, done: headlineDone } = useTypewriter(headline, {
    speedMs: 36,
    delayMs: 500,
  });

  const proofRate =
    donations.length === 0
      ? 0
      : Math.round((verified / donations.length) * 100);

  return (
    <div>
      <section className="relative isolate flex min-h-dvh flex-col overflow-hidden bg-ink">
          <HeroBackgroundSlider />
          <div className="page-shell relative z-10 flex min-h-0 w-full flex-1 flex-col justify-center py-8 pt-28 sm:py-10 sm:pt-32">
            <div className="grid w-full gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.9fr)] lg:items-center lg:gap-14 xl:gap-20">
              <div className="min-w-0">
                <p className="data-mono text-xs uppercase tracking-[0.2em] text-paper/70 sm:text-sm">
                  Transparency you can see
                </p>
                <BrandWordmark className="mt-3 block text-5xl text-paper sm:mt-4 sm:text-6xl lg:text-7xl xl:text-8xl [&_.text-ink]:text-paper" />
                <h1
                  className="mt-4 max-w-3xl text-2xl leading-snug text-paper/90 sm:mt-5 sm:text-3xl lg:text-4xl xl:text-[2.75rem]"
                  aria-label={headline}
                >
                  {typedHeadline}
                  <span
                    className={
                      headlineDone
                        ? "ml-0.5 inline-block h-[1em] w-[2px] translate-y-[0.1em] bg-verified/80 opacity-0"
                        : "ml-0.5 inline-block h-[1em] w-[2px] translate-y-[0.1em] animate-pulse bg-verified"
                    }
                    aria-hidden
                  />
                </h1>
                <p className="mt-4 max-w-2xl text-base leading-relaxed text-paper/75 sm:mt-5 sm:text-lg">
                  Most giving ends at &ldquo;thank you.&rdquo; OpenImpact keeps
                  going: you see when the money arrives, who received it, what
                  they bought, and the photo and receipt that prove it.
                </p>
                <div className="mt-6 flex flex-wrap items-center gap-3 sm:mt-8 sm:gap-4">
                  <Link
                    to="/organisations"
                    className="rounded-full bg-paper px-6 py-3 text-sm font-medium text-ink transition-opacity hover:opacity-90 sm:px-7 sm:py-3.5 sm:text-base"
                  >
                    Find an organisation
                  </Link>
                  <a
                    href="#try-it"
                    className="rounded-full border border-dashed border-pending px-6 py-3 text-sm font-medium text-pending transition-colors hover:bg-pending/20 sm:px-7 sm:py-3.5 sm:text-base"
                  >
                    Try the 40 second demo
                  </a>
                  <a
                    href="#about"
                    className="text-sm font-medium text-paper underline-offset-4 hover:underline sm:text-base"
                  >
                    Why this exists
                  </a>
                </div>
                <dl className="mt-8 flex flex-nowrap items-start gap-3 sm:mt-10 sm:gap-10 lg:gap-14">
                  <Stat label="Donations logged" target={donations.length} />
                  <Stat
                    label="With proof of use"
                    target={verified}
                    delayMs={180}
                  />
                  <Stat
                    label="Recipients on the ledger"
                    target={recipients.length}
                    delayMs={320}
                  />
                </dl>
              </div>

              <div className="receipt-edge hidden w-full max-w-md justify-self-end border border-paper/60 bg-paper/85 px-6 pb-6 pt-7 shadow-[0_8px_32px_oklch(0.2_0.03_214_/_0.2)] backdrop-blur-xl supports-[backdrop-filter]:bg-paper/75 sm:block lg:max-w-none lg:px-8 lg:pb-8 lg:pt-9">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="data-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                      Sample receipt
                    </p>
                    <p className="data-mono mt-2 text-3xl font-medium tracking-tight text-ink lg:mt-3 lg:text-4xl">
                      120 USDC
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground sm:text-base">
                      to Kilifi Water Trust
                    </p>
                  </div>
                  <StampBadge status="verified" size="lg" animate />
                </div>

                <ol className="mt-5 space-y-3 lg:mt-7 lg:space-y-3.5">
                  <JourneyStep done label="Sent" detail="16 Jul" />
                  <JourneyStep done label="Received" detail="Same day" />
                  <JourneyStep
                    done
                    label="Proof filed"
                    detail="Pump repaired"
                  />
                </ol>

                <div className="dotted-rule mt-5 pt-5 lg:mt-7 lg:pt-6">
                  <p className="font-display text-lg leading-snug text-ink sm:text-xl">
                    “The queue at the well is twenty minutes now, not two
                    hours.”
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground sm:text-sm">
                    Recipient ·{" "}
                    {shortAddress("0xA1d4F7c02B9e35D6a8C1740bE39fD25c60B8a913")}
                  </p>
                </div>
              </div>
            </div>
          </div>
      </section>

      <section
        id="about"
        className="scroll-mt-24 bg-background"
      >
        <div className="page-shell py-12 sm:py-16 lg:py-20">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-stretch lg:gap-12 xl:gap-16">
            {/* Story */}
            <div className="flex flex-col justify-between gap-8 lg:py-1">
              <div className="space-y-5 sm:space-y-6">
                <p className="data-mono text-[11px] font-medium uppercase tracking-[0.2em] text-verified sm:text-xs">
                  About OpenImpact
                </p>
                <h2 className="font-display text-[clamp(1.85rem,4.2vw,3.25rem)] leading-[1.12] tracking-tight text-ink">
                  Giving usually ends at “thank you.”
                  <span className="mt-1 block text-verified">
                    It shouldn&apos;t.
                  </span>
                </h2>
                <div className="space-y-4 text-[clamp(1rem,1.35vw,1.2rem)] leading-relaxed text-ink/75">
                  <p>
                    When you give today, you often get a confirmation email and
                    little else. Between your wallet and the person who needed
                    the money, the trail goes dark.
                  </p>
                  <p>
                    OpenImpact keeps that trail open. Every donation becomes a
                    public receipt: sent, received, and backed by proof of what
                    it bought, a photo and a short note from the person who
                    spent it.
                  </p>
                  <p>
                    If proof never arrives, the receipt says so. That honesty
                    shapes each organisation&apos;s score, so trust is earned in
                    public, not promised in private.
                  </p>
                </div>
              </div>

              <div className="flex flex-nowrap gap-2 sm:gap-3">
                <a
                  href="#how-it-works"
                  className="inline-flex min-w-0 flex-1 items-center justify-center rounded-full bg-primary px-4 py-3 text-center text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 sm:flex-none sm:px-6"
                >
                  See how it works
                </a>
                <Link
                  to="/organisations"
                  className="inline-flex min-w-0 flex-1 items-center justify-center rounded-full border border-border bg-background px-4 py-3 text-center text-sm font-medium transition-colors hover:bg-accent sm:flex-none sm:px-6"
                >
                  Browse organisations
                </Link>
              </div>
            </div>

            {/* Visual + stats */}
            <div className="flex min-w-0 flex-col gap-4">
              <AboutVisualSlider />

              <dl className="flex flex-nowrap items-stretch gap-2 sm:gap-3">
                <AboutStat
                  value={organisations.length}
                  label="Organisations"
                />
                <AboutStat value={donations.length} label="Donations logged" />
                <AboutStat
                  value={verified}
                  label="With proof of use"
                  delayMs={120}
                />
                <AboutStat
                  value={proofRate}
                  label="Proof rate"
                  suffix="%"
                  delayMs={220}
                />
              </dl>
            </div>
          </div>

          <PrototypeNotice className="mx-auto mt-8 max-w-2xl sm:mt-10" />
        </div>
      </section>

      <div id="how-it-works" className="scroll-mt-24">
        <HowItWorksFlow />
      </div>

      <DemoSimulator />

      <section
        id="testimonials"
        className="scroll-mt-24 border-b border-border bg-background"
        aria-labelledby="testimonials-heading"
      >
        <div className="page-shell py-12 sm:py-16 lg:py-20">
          <div className="mx-auto mb-10 max-w-2xl text-center sm:mb-12">
            <p className="data-mono text-[11px] font-medium uppercase tracking-[0.2em] text-verified sm:text-xs">
              Voices from the loop
            </p>
            <h2
              id="testimonials-heading"
              className="mt-3 font-display text-[clamp(1.85rem,4.2vw,3rem)] leading-[1.12] tracking-tight text-ink"
            >
              What donors, orgs, and recipients say
            </h2>
            <p className="mt-3 text-base leading-relaxed text-ink/70 sm:text-lg">
              Prototype stories from people who closed the gap between a gift and
              proof of use.
            </p>
          </div>
          <TestimonialCarousel />
        </div>
      </section>
    </div>
  );
}

function AboutStat({
  value,
  label,
  suffix = "",
  delayMs = 0,
}: {
  value: number;
  label: string;
  suffix?: string;
  delayMs?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!inView) return;
    if (delayMs === 0) {
      setReady(true);
      return;
    }
    const id = window.setTimeout(() => setReady(true), delayMs);
    return () => window.clearTimeout(id);
  }, [inView, delayMs]);

  const shown = useCountUp(ready ? value : 0, 1100);

  return (
    <div
      ref={ref}
      className="flex h-[5.75rem] min-w-0 flex-1 flex-col justify-between rounded-xl border border-border bg-card px-2 py-2.5 sm:h-[6.25rem] sm:px-3 sm:py-3"
    >
      <dt className="line-clamp-2 min-h-[2.25rem] text-[9px] uppercase leading-snug tracking-wider text-muted-foreground sm:min-h-[2.5rem] sm:text-[10px] sm:tracking-widest">
        {label}
      </dt>
      <dd className="data-mono text-xl font-medium tabular-nums leading-none text-ink sm:text-2xl lg:text-3xl">
        {shown}
        {suffix}
      </dd>
    </div>
  );
}

function JourneyStep({
  done,
  label,
  detail,
}: {
  done?: boolean;
  label: string;
  detail: string;
}) {
  return (
    <li className="flex items-center gap-3 text-sm">
      <span
        className={
          done
            ? "flex size-5 shrink-0 items-center justify-center rounded-full bg-verified text-[10px] font-bold text-verified-foreground"
            : "size-5 shrink-0 rounded-full border border-dashed border-pending"
        }
        aria-hidden
      >
        {done ? "✓" : null}
      </span>
      <span className="font-medium text-ink">{label}</span>
      <span className="data-mono ml-auto text-xs text-muted-foreground">
        {detail}
      </span>
    </li>
  );
}

function Stat({
  label,
  target,
  delayMs = 0,
}: {
  label: string;
  target: number;
  delayMs?: number;
}) {
  const [ready, setReady] = useState(delayMs === 0);
  useEffect(() => {
    if (delayMs === 0) return;
    const id = window.setTimeout(() => setReady(true), delayMs);
    return () => window.clearTimeout(id);
  }, [delayMs]);
  const value = useCountUp(ready ? target : 0, 1100);

  return (
    <div className="min-w-0 flex-1">
      <dt className="text-[10px] uppercase leading-snug tracking-wider text-paper/65 sm:text-xs sm:tracking-widest">
        {label}
      </dt>
      <dd className="data-mono mt-1 text-2xl tabular-nums text-paper sm:text-3xl lg:text-4xl">
        {value}
      </dd>
    </div>
  );
}
