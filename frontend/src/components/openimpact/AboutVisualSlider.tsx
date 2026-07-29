import { useEffect, useState } from "react";

import heroLearning from "@/assets/hero/hero-learning-shelter.jpg";
import heroSolar from "@/assets/hero/hero-solar-market.jpg";
import heroWell from "@/assets/hero/hero-well-sunset.jpg";
import { cn } from "@/lib/utils";

const SLIDES = [
  {
    src: heroSolar,
    alt: "Community solar stall supporting local livelihoods",
  },
  {
    src: heroWell,
    alt: "Rural water well at sunset after repair",
  },
  {
    src: heroLearning,
    alt: "Open air reading shelter with books and benches",
  },
] as const;

const INTERVAL_MS = 5500;

/** Crossfading photo strip for the About section. */
export function AboutVisualSlider({ className }: { className?: string }) {
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
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl bg-muted",
        className,
      )}
    >
      <div className="relative aspect-[16/11] w-full sm:aspect-[16/10] lg:aspect-[16/11] lg:min-h-[18rem] xl:min-h-[20rem]">
        {SLIDES.map((slide, i) => (
          <img
            key={slide.alt}
            src={slide.src}
            alt={i === index ? slide.alt : ""}
            className={cn(
              "absolute inset-0 size-full object-cover transition-opacity duration-1000",
              i === index ? "opacity-100" : "opacity-0",
            )}
          />
        ))}
      </div>

      {!reduceMotion && (
        <div className="absolute bottom-3 left-3 z-10 flex gap-2">
          {SLIDES.map((slide, i) => (
            <button
              key={slide.alt}
              type="button"
              aria-label={`Show photo ${i + 1}`}
              aria-current={i === index ? "true" : undefined}
              onClick={() => setIndex(i)}
              className={cn(
                "appearance-none rounded-full border-2 bg-transparent p-0 shadow-none outline-none transition-all duration-500",
                "hover:border-paper focus-visible:ring-2 focus-visible:ring-paper/60",
                i === index
                  ? "h-2 w-7 border-paper"
                  : "size-2 border-paper/50",
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
