import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How OpenImpact works — donate, confirm, prove, verify" },
      {
        name: "description",
        content:
          "A step-by-step walkthrough of an OpenImpact donation, written for people who have never used a crypto wallet: donate, the recipient confirms, they show proof, you verify it.",
      },
      { property: "og:title", content: "How OpenImpact works" },
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
    lede: "You pick a cause and an amount. That's the whole decision.",
    body: [
      "A wallet is just an account that holds money you can send. If you already have one, you connect it with one click. If you don't, you'll be walked through making one — it takes about a minute and there's nothing to download in this demo.",
      "You choose whether your name shows on the receipt or whether it reads “Anonymous.” Either way the donation itself is recorded; only your name is optional.",
      "When you send it, the receipt is created immediately with an amber stamp: waiting to be received.",
    ],
  },
  {
    n: "02",
    title: "Confirm",
    lede: "The person or organisation receiving the money says it arrived.",
    body: [
      "They see one button: “I've received this.” No forms, no jargon, no finance vocabulary.",
      "The moment they press it, your receipt updates from waiting to received. You don't have to email anyone to ask.",
      "If a receipt sits at “waiting” for too long, that's visible too — to you, to them, and on the organisation's public page.",
    ],
  },
  {
    n: "03",
    title: "Prove",
    lede: "They show what the money paid for.",
    body: [
      "The recipient uploads a photo — the thing they bought, the repair they made, the receipt from the shop — plus one sentence explaining it, and a short note in their own words if they want to add one.",
      "That's the part most giving platforms never get to. It's attached to your specific receipt, not to a general annual report.",
    ],
  },
  {
    n: "04",
    title: "Verify",
    lede: "The receipt turns green, and anyone can check it.",
    body: [
      "An automated check compares the uploaded photo against earlier uploads. If it's been used before, the receipt is flagged red for human review rather than quietly approved.",
      "Otherwise the stamp fills in green. The receipt page is public and shareable: amount, date, transaction, proof, and testimonial on one page.",
      "Every verified receipt lifts the organisation's score, which is simply the share of its donations that came back with proof.",
    ],
  },
];

function HowItWorksPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-16">
      <p className="data-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
        How it works
      </p>
      <h1 className="mt-4 text-4xl leading-tight sm:text-5xl">
        Four steps between your money and the proof it worked.
      </h1>
      <p className="mt-5 text-base leading-relaxed text-muted-foreground">
        No experience with wallets or crypto needed. Here's what actually happens, in order.
      </p>

      <ol className="mt-14 space-y-12">
        {STEPS.map((s) => (
          <li key={s.n} className="dotted-rule pt-8 first:border-t-0 first:pt-0">
            <div className="flex items-baseline gap-4">
              <span className="data-mono text-sm tracking-widest text-verified">{s.n}</span>
              <h2 className="text-3xl">{s.title}</h2>
            </div>
            <p className="mt-3 font-display text-xl leading-snug">{s.lede}</p>
            <div className="mt-4 space-y-4 text-base leading-relaxed text-muted-foreground">
              {s.body.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-16 border border-border bg-card p-6">
        <h2 className="text-2xl">What the stamps mean</h2>
        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex gap-3">
            <dt className="w-40 shrink-0 font-medium text-pending">Amber, dashed</dt>
            <dd className="text-muted-foreground">
              Waiting to be received, or received and waiting for proof.
            </dd>
          </div>
          <div className="flex gap-3">
            <dt className="w-40 shrink-0 font-medium text-verified">Green, filled</dt>
            <dd className="text-muted-foreground">
              Proof of use is attached and the receipt is public.
            </dd>
          </div>
          <div className="flex gap-3">
            <dt className="w-40 shrink-0 font-medium text-flagged">Red, filled</dt>
            <dd className="text-muted-foreground">
              Something didn't check out. Held for review rather than approved.
            </dd>
          </div>
        </dl>
      </div>

      <div className="mt-10 flex flex-wrap gap-4">
        <Link
          to="/"
          className="rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          Find a cause
        </Link>
        <Link to="/trust" className="py-3 text-sm font-medium underline-offset-4 hover:underline">
          What's public and what isn't
        </Link>
      </div>
    </div>
  );
}
