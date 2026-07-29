"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Github,
  Twitter,
  Youtube,
  Linkedin,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Testimonial {
  name: string;
  title: string;
  description: string;
  imageUrl: string;
  githubUrl?: string;
  twitterUrl?: string;
  youtubeUrl?: string;
  linkedinUrl?: string;
}

const testimonials: Testimonial[] = [
  {
    name: "Amina Okello",
    title: "Donor, Nairobi",
    description:
      "I used to give and hope. With OpenImpact I opened the receipt and saw the school supplies arrive the same week, photo and note included. That is the first time giving felt finished.",
    imageUrl:
      "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=600&q=80",
    linkedinUrl: "#",
    twitterUrl: "#",
  },
  {
    name: "James Mwangi",
    title: "Programme lead, Horizon Relief",
    description:
      "Proof of use used to live in private WhatsApp threads. Now every verified spend sits on a public receipt. Donors ask better questions, and our score reflects the work we actually do.",
    imageUrl:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80",
    linkedinUrl: "#",
    githubUrl: "#",
  },
  {
    name: "Sofia Reyes",
    title: "Recipient, community kitchen",
    description:
      "Uploading a photo and a short note took a minute. Knowing the person who funded the stove could see it mattered more than another thank you email ever did.",
    imageUrl:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=600&q=80",
    twitterUrl: "#",
    linkedinUrl: "#",
  },
];

export interface TestimonialCarouselProps {
  className?: string;
}

export function TestimonialCarousel({ className }: TestimonialCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleNext = () =>
    setCurrentIndex((index) => (index + 1) % testimonials.length);
  const handlePrevious = () =>
    setCurrentIndex(
      (index) => (index - 1 + testimonials.length) % testimonials.length,
    );

  const currentTestimonial = testimonials[currentIndex]!;

  const socialIcons = [
    { icon: Github, url: currentTestimonial.githubUrl, label: "GitHub" },
    { icon: Twitter, url: currentTestimonial.twitterUrl, label: "Twitter" },
    { icon: Youtube, url: currentTestimonial.youtubeUrl, label: "YouTube" },
    { icon: Linkedin, url: currentTestimonial.linkedinUrl, label: "LinkedIn" },
  ].filter((item) => item.url);

  return (
    <div className={cn("mx-auto w-full max-w-5xl", className)}>
      {/* Desktop layout */}
      <div className="relative hidden items-center md:flex">
        <div className="h-[470px] w-[470px] flex-shrink-0 overflow-hidden rounded-3xl bg-muted">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentTestimonial.imageUrl}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="h-full w-full"
            >
              <img
                src={currentTestimonial.imageUrl}
                alt={currentTestimonial.name}
                width={470}
                height={470}
                className="h-full w-full object-cover"
                draggable={false}
              />
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="z-10 ml-[-80px] max-w-xl flex-1 rounded-3xl border border-border bg-card p-8 shadow-xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentTestimonial.name}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
            >
              <div className="mb-6">
                <h3 className="mb-2 font-display text-2xl font-medium text-ink">
                  {currentTestimonial.name}
                </h3>
                <p className="text-sm font-medium text-muted-foreground">
                  {currentTestimonial.title}
                </p>
              </div>

              <p className="mb-8 text-base leading-relaxed text-ink/80">
                {currentTestimonial.description}
              </p>

              {socialIcons.length > 0 && (
                <div className="flex space-x-3">
                  {socialIcons.map(({ icon: IconComponent, url, label }) => (
                    <a
                      key={label}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex size-12 cursor-pointer items-center justify-center rounded-full bg-ink transition-transform hover:scale-105 hover:opacity-90"
                      aria-label={label}
                    >
                      <IconComponent className="size-5 text-paper" />
                    </a>
                  ))}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Mobile layout */}
      <div className="mx-auto max-w-sm bg-transparent text-center md:hidden">
        <div className="mb-6 aspect-square w-full overflow-hidden rounded-3xl bg-muted">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentTestimonial.imageUrl}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="h-full w-full"
            >
              <img
                src={currentTestimonial.imageUrl}
                alt={currentTestimonial.name}
                width={400}
                height={400}
                className="h-full w-full object-cover"
                draggable={false}
              />
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="px-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentTestimonial.name}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
            >
              <h3 className="mb-2 font-display text-xl font-medium text-ink">
                {currentTestimonial.name}
              </h3>
              <p className="mb-4 text-sm font-medium text-muted-foreground">
                {currentTestimonial.title}
              </p>
              <p className="mb-6 text-sm leading-relaxed text-ink/80">
                {currentTestimonial.description}
              </p>
              {socialIcons.length > 0 && (
                <div className="flex justify-center space-x-3">
                  {socialIcons.map(({ icon: IconComponent, url, label }) => (
                    <a
                      key={label}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex size-12 cursor-pointer items-center justify-center rounded-full bg-ink transition-opacity hover:opacity-90"
                      aria-label={label}
                    >
                      <IconComponent className="size-5 text-paper" />
                    </a>
                  ))}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div className="mt-8 flex items-center justify-center gap-6">
        <button
          type="button"
          onClick={handlePrevious}
          aria-label="Previous testimonial"
          className="flex size-12 cursor-pointer items-center justify-center rounded-full border border-border bg-card shadow-sm transition-colors hover:bg-accent"
        >
          <ChevronLeft className="size-6 text-ink" />
        </button>

        <div className="flex gap-2">
          {testimonials.map((_, testimonialIndex) => (
            <button
              key={testimonialIndex}
              type="button"
              onClick={() => setCurrentIndex(testimonialIndex)}
              className={cn(
                "size-3 cursor-pointer rounded-full transition-colors",
                testimonialIndex === currentIndex
                  ? "bg-ink"
                  : "bg-muted-foreground/35",
              )}
              aria-label={`Go to testimonial ${testimonialIndex + 1}`}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={handleNext}
          aria-label="Next testimonial"
          className="flex size-12 cursor-pointer items-center justify-center rounded-full border border-border bg-card shadow-sm transition-colors hover:bg-accent"
        >
          <ChevronRight className="size-6 text-ink" />
        </button>
      </div>
    </div>
  );
}
