import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";

import { Globe } from "@/components/ui/cobe-globe";
import { useCountUp } from "@/hooks/use-motion-text";
import { useLedger } from "@/lib/openimpact/store";

/**
 * Spread pins across continents so labels don't stack.
 * Coordinates are [lat, lng].
 */
const IMPACT_MARKERS = [
  {
    id: "nairobi",
    location: [-1.2921, 36.8219] as [number, number],
    label: "Nairobi",
  },
  {
    id: "accra",
    location: [5.6037, -0.187] as [number, number],
    label: "Accra",
  },
  {
    id: "cape-town",
    location: [-33.9249, 18.4241] as [number, number],
    label: "Cape Town",
  },
  {
    id: "addis",
    location: [9.032, 38.7469] as [number, number],
    label: "Addis",
  },
  {
    id: "lagos",
    location: [6.5244, 3.3792] as [number, number],
    label: "Lagos",
  },
  {
    id: "london",
    location: [51.5074, -0.1278] as [number, number],
    label: "London",
  },
  {
    id: "nyc",
    location: [40.7128, -74.006] as [number, number],
    label: "New York",
  },
  {
    id: "saopaulo",
    location: [-23.5505, -46.6333] as [number, number],
    label: "São Paulo",
  },
  {
    id: "mumbai",
    location: [19.076, 72.8777] as [number, number],
    label: "Mumbai",
  },
  {
    id: "singapore",
    location: [1.3521, 103.8198] as [number, number],
    label: "Singapore",
  },
  {
    id: "berlin",
    location: [52.52, 13.405] as [number, number],
    label: "Berlin",
  },
  {
    id: "melbourne",
    location: [-37.8136, 144.9631] as [number, number],
    label: "Melbourne",
  },
];

/** Long-haul arcs only — short regional hops pile labels on East Africa. */
const IMPACT_ARCS = [
  {
    id: "london-nairobi",
    from: [51.5074, -0.1278] as [number, number],
    to: [-1.2921, 36.8219] as [number, number],
    label: "Gift → Nairobi",
  },
  {
    id: "nyc-accra",
    from: [40.7128, -74.006] as [number, number],
    to: [5.6037, -0.187] as [number, number],
    label: "Gift → Accra",
  },
  {
    id: "berlin-addis",
    from: [52.52, 13.405] as [number, number],
    to: [9.032, 38.7469] as [number, number],
  },
  {
    id: "saopaulo-cape",
    from: [-23.5505, -46.6333] as [number, number],
    to: [-33.9249, 18.4241] as [number, number],
    label: "Gift → Cape Town",
  },
  {
    id: "singapore-mumbai",
    from: [1.3521, 103.8198] as [number, number],
    to: [19.076, 72.8777] as [number, number],
  },
  {
    id: "melbourne-singapore",
    from: [-37.8136, 144.9631] as [number, number],
    to: [1.3521, 103.8198] as [number, number],
  },
  {
    id: "lagos-nairobi",
    from: [6.5244, 3.3792] as [number, number],
    to: [-1.2921, 36.8219] as [number, number],
  },
];

export const Route = createFileRoute("/organisations")({
  head: () => ({
    meta: [
      { title: "OpenImpact" },
      {
        name: "description",
        content:
          "Browse organisations on OpenImpact. Trust score is the share of donations that came back with proof of use.",
      },
      { property: "og:title", content: "OpenImpact" },
      {
        property: "og:description",
        content: "Organisations accepting donations with verified proof of use.",
      },
    ],
  }),
  component: OrganisationsPage,
});

function OrganisationsPage() {
  const { organisations, orgTrustScore, donations } = useLedger();
  const verified = donations.filter((d) => d.status === "verified").length;

  const markers = useMemo(() => IMPACT_MARKERS, []);
  const arcs = useMemo(() => IMPACT_ARCS, []);

  return (
    <div className="page-shell page-top pb-10 sm:pb-14">
      <section aria-labelledby="organisations-heading">
        <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-12 xl:gap-16">
          <div className="min-w-0">
            <p className="data-mono text-[11px] uppercase tracking-[0.2em] text-verified">
              On the ledger
            </p>
            <h1
              id="organisations-heading"
              className="mt-2 font-display text-3xl text-ink sm:text-4xl lg:text-5xl"
            >
              Organisations
            </h1>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
              Trust score is the share of each organisation&apos;s donations that
              came back with proof of use. Drag the globe to see where verified
              gifts land.
            </p>

            <dl className="mt-8 grid max-w-md grid-cols-3 gap-3 sm:gap-4">
              <LedgerStat
                value={organisations.length}
                label="Orgs"
                detail="on the ledger"
              />
              <LedgerStat
                value={verified}
                label="Verified"
                detail="with proof"
                delayMs={120}
              />
              <LedgerStat
                value={markers.length}
                label="Pins"
                detail="on the map"
                delayMs={220}
              />
            </dl>
          </div>

          <div className="relative mx-auto w-full max-w-md lg:mx-0 lg:max-w-none">
            <div
              className="pointer-events-none absolute inset-8 rounded-full bg-verified/10 blur-3xl sm:inset-12"
              aria-hidden
            />
            <Globe
              markers={markers}
              arcs={arcs}
              className="relative mx-auto w-full max-w-[20rem] sm:max-w-md lg:max-w-lg"
              markerColor={[0.12, 0.56, 0.44]}
              baseColor={[0.96, 0.97, 0.96]}
              arcColor={[0.12, 0.56, 0.44]}
              glowColor={[0.94, 0.96, 0.95]}
              dark={0}
              mapBrightness={8}
              markerSize={0.028}
              theta={0.15}
              speed={0.0025}
            />
          </div>
        </div>
      </section>

      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:mt-16 lg:grid-cols-4">
        {organisations.map((org) => {
          const score = orgTrustScore(org.id);
          return (
            <div
              key={org.id}
              className="flex flex-col border border-border bg-card"
            >
              <img
                src={org.imageUrl}
                alt={`${org.name} at work`}
                loading="lazy"
                className="h-36 w-full object-cover"
              />
              <div className="flex flex-1 flex-col p-5">
                <h2 className="text-xl leading-tight">
                  <Link
                    to="/cause/$orgId"
                    params={{ orgId: org.id }}
                    className="underline-offset-4 hover:underline"
                  >
                    {org.name}
                  </Link>
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {org.tagline}
                </p>
                <p className="mt-3 flex-1 text-sm leading-relaxed">
                  {org.description}
                </p>

                <div className="dotted-rule mt-4 flex items-center justify-between pt-4">
                  <div>
                    <p className="data-mono text-lg font-medium text-verified">
                      {score}%
                    </p>
                    <p className="text-xs text-muted-foreground">
                      donations with proof
                    </p>
                  </div>
                  <Link
                    to="/cause/$orgId"
                    params={{ orgId: org.id }}
                    className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
                  >
                    View
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LedgerStat({
  value,
  label,
  detail,
  delayMs = 0,
}: {
  value: number;
  label: string;
  detail: string;
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
      { threshold: 0.4 },
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
      className="flex min-w-0 flex-col rounded-xl border border-border bg-card px-3 py-3 sm:px-3.5 sm:py-3.5"
    >
      <dt className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground sm:text-[11px]">
        {label}
      </dt>
      <dd className="data-mono mt-1.5 text-2xl tabular-nums leading-none text-ink sm:text-3xl">
        {shown}
      </dd>
      <p className="mt-1.5 text-[11px] leading-snug text-muted-foreground">
        {detail}
      </p>
    </div>
  );
}
