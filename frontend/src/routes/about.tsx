import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "OpenImpact" },
      {
        name: "description",
        content:
          "Donors rarely find out what happened to their money. OpenImpact closes that gap: every donation gets a receipt, a status and proof of use from the person who received it.",
      },
      { property: "og:title", content: "OpenImpact" },
      {
        property: "og:description",
        content:
          "The accountability gap in giving, in plain terms — and how a public receipt closes it.",
      },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-16">
      <p className="data-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">About</p>
      <h1 className="mt-4 text-4xl leading-tight sm:text-5xl">
        Giving usually ends at “thank you.” It shouldn't.
      </h1>

      <div className="mt-8 space-y-6 text-base leading-relaxed">
        <p>
          When you give money to a cause, you almost never find out what it bought. You get a
          confirmation email, maybe a newsletter six months later with a photo of someone else's
          project. Between your bank and the person who needed the money there are usually three or
          four hands, and none of them are obliged to show you a receipt.
        </p>
        <p>
          That gap is where trust leaks out. Money gets held up in transfers, spent on overheads
          nobody agreed to, or in the worst cases never arrives at all. Honest organisations suffer
          for it too: they do everything right, and they still can't prove it to a sceptical donor
          in a way that person can check for themselves.
        </p>
        <p>
          Recipients are stuck on the other side of the same gap. Someone who fixed a borehole or
          bought textbooks with donated money has no simple way to say so — and no record that
          builds up into a reputation they can use next time.
        </p>
      </div>

      <h2 className="mt-14 text-2xl">What we do about it</h2>
      <div className="mt-5 space-y-6 text-base leading-relaxed">
        <p>
          OpenImpact turns each donation into a receipt that lives in public. The transfer itself is
          on a wallet-based ledger, so the amount, the time and the destination can be checked by
          anyone. What that money paid for is attached to the same receipt by the person who spent
          it: a photo, a line about what they bought, and a short note in their own words.
        </p>
        <p>
          Nothing about that is a promise. It's a record. If proof never arrives, the receipt says
          so, and that shows up in the organisation's score — the plain share of its donations that
          came back with proof.
        </p>
      </div>

      <h2 className="mt-14 text-2xl">What this prototype is</h2>
      <p className="mt-4 text-base leading-relaxed text-muted-foreground">
        This is a working demo built for a hackathon. The data is realistic but invented, and no
        funds move on a real chain yet — wallet connection and settlement are stubbed so the web3
        work can drop straight in behind the same screens.
      </p>

      <div className="mt-10 flex flex-wrap gap-4">
        <Link
          to="/how-it-works"
          className="rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          See how it works
        </Link>
        <Link to="/trust" className="py-3 text-sm font-medium underline-offset-4 hover:underline">
          What's public and what isn't
        </Link>
      </div>
    </div>
  );
}
