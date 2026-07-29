import { createFileRoute, Link } from "@tanstack/react-router";
import { Eye, EyeOff } from "lucide-react";

export const Route = createFileRoute("/trust")({
  head: () => ({
    meta: [
      { title: "Trust & privacy — what's public on TrustFlow" },
      {
        name: "description",
        content:
          "Plain-language answers: your name is optional, transactions are traceable by amount and wallet, and personal details never go on the ledger.",
      },
      { property: "og:title", content: "Trust & privacy on TrustFlow" },
      {
        property: "og:description",
        content: "What's public, what's private, and what you control — in plain words.",
      },
    ],
  }),
  component: TrustPage,
});

const PUBLIC_ITEMS = [
  "The amount of each donation and the currency.",
  "The date and time it was sent.",
  "The transaction reference and the wallet addresses involved.",
  "Which cause and which recipient it went to.",
  "The proof of use: photo, description and testimonial the recipient uploads.",
  "Your display name — only if you choose to show it on that donation.",
];

const PRIVATE_ITEMS = [
  "Your email address, phone number and postal address. We don't put them on the ledger.",
  "Your legal name, unless you type it in as your display name yourself.",
  "Your payment details. Nothing about your card or bank is stored here.",
  "Recipients' home addresses and contact details.",
  "Any note you mark private when you donate.",
];

function TrustPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-16">
      <p className="data-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
        Trust &amp; privacy
      </p>
      <h1 className="mt-4 text-4xl leading-tight sm:text-5xl">
        You can be transparent about the money without being public about yourself.
      </h1>
      <p className="mt-5 text-base leading-relaxed text-muted-foreground">
        A public ledger only works if people know exactly what it shows. Here it is, without the
        legal wording.
      </p>

      <div className="mt-12 grid gap-6 sm:grid-cols-2">
        <section className="border border-border bg-card p-6">
          <div className="flex items-center gap-2">
            <Eye className="size-5 text-verified" aria-hidden />
            <h2 className="text-xl">Public to anyone</h2>
          </div>
          <ul className="mt-4 space-y-3 text-sm leading-relaxed">
            {PUBLIC_ITEMS.map((i) => (
              <li key={i} className="dotted-rule pt-3 first:border-t-0 first:pt-0">
                {i}
              </li>
            ))}
          </ul>
        </section>

        <section className="border border-border bg-card p-6">
          <div className="flex items-center gap-2">
            <EyeOff className="size-5 text-muted-foreground" aria-hidden />
            <h2 className="text-xl">Never on the ledger</h2>
          </div>
          <ul className="mt-4 space-y-3 text-sm leading-relaxed">
            {PRIVATE_ITEMS.map((i) => (
              <li key={i} className="dotted-rule pt-3 first:border-t-0 first:pt-0">
                {i}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <h2 className="mt-14 text-2xl">Giving anonymously</h2>
      <p className="mt-4 text-base leading-relaxed">
        Every donation has one switch: show my name, or show “Anonymous.” You set it per donation,
        and you can change it later from your donor profile. Turning your name off doesn't hide the
        donation — the amount and the proof stay public, which is the point — it only removes you
        from the receipt.
      </p>

      <h2 className="mt-12 text-2xl">What “traceable” honestly means</h2>
      <p className="mt-4 text-base leading-relaxed">
        Wallet transactions are public by design. Anyone can follow the amounts in and out of a
        wallet address, including yours. A wallet address isn't your name, but if you tell people
        it's yours, they can see its history. If that matters to you, give anonymously from a wallet
        you use only for donations.
      </p>

      <h2 className="mt-12 text-2xl">Photos of people</h2>
      <p className="mt-4 text-base leading-relaxed">
        Proof of use is meant to show what the money bought, not to parade the people who received
        it. Recipients are asked to photograph the thing — the pump, the desks, the shop receipt —
        and to get permission before including anyone's face. Any receipt can be reported and pulled
        from public view while it's reviewed.
      </p>

      <h2 className="mt-12 text-2xl">When something looks wrong</h2>
      <p className="mt-4 text-base leading-relaxed">
        Uploaded proof is checked automatically against earlier uploads. A match doesn't quietly
        disappear: the receipt is stamped red, stays visible, and says it's under review. We'd
        rather show you a flagged receipt than a tidy one you can't check.
      </p>

      <div className="mt-14 border border-border bg-card p-6">
        <p className="font-display text-xl leading-snug">
          Rule of thumb: the money is public, you are optional, and your personal details are never
          part of the record.
        </p>
        <div className="mt-6 flex flex-wrap gap-4">
          <Link
            to="/"
            className="rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Find a cause
          </Link>
          <Link
            to="/how-it-works"
            className="py-3 text-sm font-medium underline-offset-4 hover:underline"
          >
            How it works
          </Link>
        </div>
      </div>

      <p className="mt-8 text-sm text-muted-foreground">
        This prototype runs on invented data and stubbed wallet calls — nothing described here has
        been independently audited or certified. It's a description of how the product is designed
        to behave, maintained by the TrustFlow team.
      </p>
    </div>
  );
}
