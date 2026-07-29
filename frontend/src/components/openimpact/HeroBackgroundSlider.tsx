import { useEffect, useState } from "react";

import heroLearning from "@/assets/hero/hero-learning-shelter.jpg";
import heroSolar from "@/assets/hero/hero-solar-market.jpg";
import heroWell from "@/assets/hero/hero-well-sunset.jpg";
import { cn } from "@/lib/utils";

const SLIDES = [
  {
    src: heroWell,
    alt: "Rural water well at sunset after repair",
  },
  {
    src: heroSolar,
    alt: "Community solar market stall charging phones and lanterns",
  },
  {
    src: heroLearning,
    alt: "Open air reading shelter with books and wooden benches",
  },
] as const;

const INTERVAL_MS = 6500;

/**
 * Full-bleed crossfading background for the landing hero.
 * Respects prefers-reduced-motion (shows first slide only).
 */
export function HeroBackgroundSlider({ className }: { className?: string }) {
  const [index, setIndex] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (reduceMotion) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % SLIDES.length);
    }, INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [reduceMotion]);

  return (
    <div className={cn("absolute inset-0 overflow-hidden", className)} aria-hidden>
      {SLIDES.map((slide, i) => (
        <img
          key={slide.alt}
          src={slide.src}
          alt=""
          className={cn(
            "absolute inset-0 size-full object-cover transition-opacity duration-1000",
            i === index ? "opacity-100" : "opacity-0",
          )}
        />
      ))}
      <div className="absolute inset-0 bg-ink/55" />
      <div className="absolute inset-0 bg-gradient-to-r from-ink/70 via-ink/40 to-ink/25" />

      {!reduceMotion && (
        <div className="pointer-events-auto absolute bottom-6 left-5 z-10 hidden gap-2.5 bg-transparent p-0 md:flex sm:left-[max(1.25rem,calc((100vw-90rem)/2+3rem))]">
          {SLIDES.map((slide, i) => (
            <button
              key={slide.alt}
              type="button"
              aria-label={`Show slide ${i + 1}`}
              aria-current={i === index ? "true" : undefined}
              onClick={() => setIndex(i)}
              className={cn(
                "appearance-none rounded-full border-2 bg-transparent p-0 shadow-none outline-none transition-all duration-500",
                "hover:border-verified focus-visible:ring-2 focus-visible:ring-verified/50",
                i === index
                  ? "h-2.5 w-8 border-verified"
                  : "size-2.5 border-verified/45",
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
