import { Link } from "@tanstack/react-router";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

const STEPS = [
  {
    title: "Send a donation",
    blurb: "Pick a cause, choose an amount, keep your name public or anonymous.",
    Illustration: IllDonate,
  },
  {
    title: "Confirm receipt",
    blurb: "The recipient marks the funds as received. Your receipt updates live.",
    Illustration: IllConfirm,
  },
  {
    title: "File proof of use",
    blurb: "A photo and short note show what the money actually bought.",
    Illustration: IllProof,
  },
  {
    title: "See it verified",
    blurb: "The stamp turns green. You can follow the full trail anytime.",
    Illustration: IllVerified,
  },
] as const;

/**
 * Illustrated How it works flow.
 * Desktop: 4-column path. Mobile: one step at a time via arrows only (no swipe scrollbar).
 */
export function HowItWorksFlow() {
  const [index, setIndex] = useState(0);
  const step = STEPS[index]!;

  return (
    <section className="bg-muted/70">
      <div className="page-shell py-12 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="font-display text-3xl text-ink sm:text-4xl">
            How it works
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
            From the moment you give to the proof that shows where it went,
            every step stays on one receipt you can check.
          </p>
        </div>

        <div className="relative mt-10 sm:mt-14">
          {/* Curved dotted path — desktop only */}
          <svg
            className="pointer-events-none absolute left-[6%] right-[6%] top-[18%] hidden h-28 w-[88%] text-ink/35 md:block"
            viewBox="0 0 1000 120"
            fill="none"
            aria-hidden
          >
            <path
              d="M40 70 C 120 10, 200 10, 280 55 S 440 110, 520 55 S 680 0, 760 55 S 900 110, 960 50"
              stroke="currentColor"
              strokeWidth="2"
              strokeDasharray="6 8"
              strokeLinecap="round"
            />
            <path
              d="M275 52 l8 4 -8 4"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
            />
            <path
              d="M515 52 l8 4 -8 4"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
            />
            <path
              d="M755 52 l8 4 -8 4"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
            />
          </svg>

          {/* Mobile: single step, no overflow scroll */}
          <div className="md:hidden">
            <div className="mx-auto flex max-w-sm flex-col items-center text-center">
              <div className="flex h-28 w-full max-w-[10.5rem] items-center justify-center sm:h-32">
                <step.Illustration />
              </div>
              <p className="data-mono mt-3 text-[11px] tracking-widest text-verified">
                {String(index + 1).padStart(2, "0")}
              </p>
              <h3 className="mt-1.5 text-base font-medium text-ink sm:text-lg">
                {step.title}
              </h3>
              <p className="mt-2 max-w-[16rem] text-sm leading-relaxed text-muted-foreground">
                {step.blurb}
              </p>
            </div>

            <div className="mt-5 flex items-center justify-center gap-4">
              <button
                type="button"
                aria-label="Previous step"
                disabled={index <= 0}
                onClick={() => setIndex((i) => Math.max(0, i - 1))}
                className="inline-flex size-10 items-center justify-center rounded-full border border-border bg-card text-ink transition-colors hover:bg-accent disabled:pointer-events-none disabled:opacity-35"
              >
                <ChevronLeft className="size-5" aria-hidden />
              </button>
              <p className="data-mono text-xs tabular-nums text-muted-foreground">
                {String(index + 1).padStart(2, "0")} /{" "}
                {String(STEPS.length).padStart(2, "0")}
              </p>
              <button
                type="button"
                aria-label="Next step"
                disabled={index >= STEPS.length - 1}
                onClick={() =>
                  setIndex((i) => Math.min(STEPS.length - 1, i + 1))
                }
                className="inline-flex size-10 items-center justify-center rounded-full border border-border bg-card text-ink transition-colors hover:bg-accent disabled:pointer-events-none disabled:opacity-35"
              >
                <ChevronRight className="size-5" aria-hidden />
              </button>
            </div>
          </div>

          {/* Desktop: all four steps */}
          <ol className="hidden md:grid md:grid-cols-4 md:gap-6">
            {STEPS.map((s, i) => (
              <li
                key={s.title}
                className="relative flex flex-col items-center text-center"
              >
                <div className="relative z-10 flex h-36 w-full max-w-[11.5rem] items-center justify-center">
                  <s.Illustration />
                </div>
                <p className="data-mono mt-4 text-[11px] tracking-widest text-verified">
                  {String(i + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-1.5 text-lg font-medium text-ink">{s.title}</h3>
                <p className="mt-2 max-w-[14rem] text-sm leading-relaxed text-muted-foreground">
                  {s.blurb}
                </p>
              </li>
            ))}
          </ol>
        </div>

        <div className="mt-8 text-center sm:mt-12">
          <Link
            to="/how-it-works"
            className="inline-flex items-center gap-2 rounded-full border border-ink/15 bg-card px-5 py-2.5 text-sm font-medium text-ink shadow-sm transition-colors hover:border-ink/30 hover:bg-accent"
          >
            Read the longer walkthrough
            <ArrowRight className="size-4 shrink-0" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}

function IllDonate() {
  return (
    <svg viewBox="0 0 160 120" className="h-full w-full" aria-hidden>
      <rect
        x="28"
        y="18"
        width="104"
        height="84"
        rx="8"
        fill="#fff"
        stroke="#12333B"
        strokeWidth="2"
      />
      <rect x="28" y="18" width="104" height="18" rx="8" fill="#12333B" />
      <rect x="28" y="28" width="104" height="8" fill="#12333B" />
      <rect x="42" y="48" width="28" height="28" rx="4" fill="#3D9B7A" />
      <rect x="78" y="50" width="40" height="6" rx="2" fill="#D5DBD9" />
      <rect x="78" y="62" width="32" height="6" rx="2" fill="#D5DBD9" />
      <rect x="42" y="86" width="76" height="8" rx="4" fill="#12333B" />
    </svg>
  );
}

function IllConfirm() {
  return (
    <svg viewBox="0 0 160 120" className="h-full w-full" aria-hidden>
      {[0, 1, 2].map((i) => (
        <g key={i} transform={`translate(${18 + i * 8} ${28 + i * 10})`}>
          <rect
            width="110"
            height="28"
            rx="6"
            fill="#fff"
            stroke="#12333B"
            strokeWidth="1.5"
          />
          <rect x="10" y="8" width="12" height="12" rx="2" fill="#3D9B7A" />
          <rect x="30" y="9" width="40" height="5" rx="2" fill="#D5DBD9" />
          <rect x="30" y="17" width="28" height="4" rx="2" fill="#E8ECEA" />
          <rect x="78" y="8" width="22" height="12" rx="3" fill="#12333B" />
        </g>
      ))}
    </svg>
  );
}

function IllProof() {
  return (
    <svg viewBox="0 0 160 120" className="h-full w-full" aria-hidden>
      <rect
        x="22"
        y="22"
        width="90"
        height="72"
        rx="8"
        fill="#fff"
        stroke="#12333B"
        strokeWidth="2"
      />
      <rect x="34" y="34" width="36" height="28" rx="4" fill="#3D9B7A" />
      <rect x="78" y="36" width="22" height="5" rx="2" fill="#D5DBD9" />
      <rect x="78" y="46" width="18" height="5" rx="2" fill="#D5DBD9" />
      <rect
        x="50"
        y="40"
        width="78"
        height="58"
        rx="8"
        fill="#fff"
        stroke="#12333B"
        strokeWidth="2"
      />
      <rect x="62" y="54" width="40" height="10" rx="5" fill="#C4E3D6" />
      <rect x="62" y="70" width="54" height="8" rx="4" fill="#12333B" />
      <rect x="62" y="84" width="36" height="6" rx="3" fill="#D5DBD9" />
    </svg>
  );
}

function IllVerified() {
  return (
    <svg viewBox="0 0 160 120" className="h-full w-full" aria-hidden>
      <rect
        x="18"
        y="36"
        width="36"
        height="52"
        rx="6"
        fill="#fff"
        stroke="#12333B"
        strokeWidth="1.5"
        opacity="0.45"
      />
      <rect
        x="106"
        y="36"
        width="36"
        height="52"
        rx="6"
        fill="#fff"
        stroke="#12333B"
        strokeWidth="1.5"
        opacity="0.45"
      />
      <rect
        x="42"
        y="24"
        width="76"
        height="72"
        rx="8"
        fill="#fff"
        stroke="#12333B"
        strokeWidth="2"
      />
      <rect x="56" y="40" width="20" height="16" rx="3" fill="#3D9B7A" />
      <rect x="80" y="42" width="24" height="5" rx="2" fill="#D5DBD9" />
      <rect x="80" y="52" width="18" height="4" rx="2" fill="#E8ECEA" />
      <rect x="56" y="68" width="48" height="10" rx="5" fill="#12333B" />
      <circle cx="108" cy="30" r="12" fill="#3D9B7A" />
      <path
        d="M102 30 l4 4 8 -8"
        stroke="#fff"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}
