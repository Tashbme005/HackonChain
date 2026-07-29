import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, BadgeCheck, Camera, HandCoins, Loader2 } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { StampBadge, StatusPill } from "@/components/openimpact/StampBadge";
import { Breadcrumbs } from "@/components/openimpact/Breadcrumbs";
import { formatAmount, formatStamp, useLedger, useRequireRole } from "@/lib/openimpact/store";
import { runAiProofCheck, shortAddress, submitToChain } from "@/lib/openimpact/web3";

export const Route = createFileRoute("/recipient")({
  head: () => ({
    meta: [
      { title: "Recipient profile — confirm funds and show what they paid for" },
      {
        name: "description",
        content:
          "The recipient's seat: two big buttons — confirm the money arrived, and upload a photo of what it bought — plus every submission you've made and your record so far.",
      },
 { property: "og:title", content: "Recipient profile — openImpact" },
      {
        property: "og:description",
        content: "Confirm funds, upload proof of use, and build a record donors can check.",
      },
    ],
  }),
  component: RecipientProfile,
});

const SAMPLE_PHOTO =
  "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=1200&q=70";

function RecipientProfile() {
  const { allowed } = useRequireRole("recipient");
  const {
    donations,
    getRecipient,
    getOrg,
    currentRecipientId,
    confirmReceipt,
    attachProofToDonation,
    attachGeneralProof,
    proofsByRecipient,
  } = useLedger();
  const me = getRecipient(currentRecipientId);
  const org = getOrg(me?.orgId);
  const mine = donations.filter((d) => d.recipientId === currentRecipientId);

  const formRef = useRef<HTMLDivElement>(null);
  const [description, setDescription] = useState("");
  const [testimonial, setTestimonial] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [shareContact, setShareContact] = useState("");
  const [shareSocial, setShareSocial] = useState("");
  const [shareNote, setShareNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  /** Which donation this upload answers for. "general" = org page content. */
  const [target, setTarget] = useState<string>("");

  if (!allowed || !me) return null;

  const awaiting = mine.filter((d) => d.status === "pending");
  const needProof = mine.filter((d) => d.status === "received");
  const accounted = mine.filter((d) => d.status === "verified").length;
  const established = me.reputationScore >= 80 && accounted > 0;
  const myProofs = proofsByRecipient(currentRecipientId);
  // Anything already received (or still pending) can be answered with proof.
  const answerable = mine.filter((d) => d.status !== "flagged");
  const targetId = target || (needProof[0]?.id ?? answerable[0]?.id ?? "general");
  const targetDonation = donations.find((d) => d.id === targetId);
  const donorLabel = targetDonation
    ? targetDonation.isPublic
      ? targetDonation.donorName
      : "Anonymous"
    : null;

  async function onConfirmAll() {
    for (const d of awaiting) {
      // eslint-disable-next-line no-await-in-loop
      await submitToChain({ action: "confirmReceipt", donationId: d.id });
      confirmReceipt(d.id);
    }
    toast.success("Marked as received. The people who sent it can see that now.");
  }

  async function onSubmitProof(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim()) return;
    setUploadError(null);
    setBusy(true);
    try {
      const image = photoUrl ?? SAMPLE_PHOTO;
      const donorOnlyShare =
        targetId !== "general" &&
        (shareContact.trim() || shareSocial.trim() || shareNote.trim())
          ? {
              contact: shareContact.trim() || undefined,
              social: shareSocial.trim() || undefined,
              note: shareNote.trim() || undefined,
            }
          : undefined;
      const draft = {
        photoUrl: image,
        description: description.trim(),
        testimonial: testimonial.trim(),
        submittedAt: new Date().toISOString(),
        ...(donorOnlyShare ? { donorOnlyShare } : {}),
      };

      // Lightweight reuse check: same image bytes as an earlier upload of mine.
      const seenBefore = myProofs.some((p) => p.photoUrl === image);
      const check = await runAiProofCheck({
        ...draft,
        amount: targetDonation?.amount,
        currency: targetDonation?.currency,
        seenBefore,
      });
      const reviewed = {
        ...draft,
        flagged: check.flagged,
        aiChecked: check.checked,
        aiReason: check.reason,
        aiInternalNote: check.internalNote,
      };

      if (targetId === "general") {
        if (me?.orgId) {
          await submitToChain({ action: "attachGeneralProof", recipientId: currentRecipientId });
          attachGeneralProof(currentRecipientId, me.orgId, reviewed);
        }
      } else {
        await submitToChain({ action: "attachProof", donationId: targetId });
        attachProofToDonation(targetId, reviewed);
      }

      setBusy(false);
      setDescription("");
      setTestimonial("");
      setPhotoUrl(null);
      setShareContact("");
      setShareSocial("");
      setShareNote("");
      if (check.flagged) {
        toast.error(
          check.reason ?? "Uploaded, but our automated check flagged this photo for review.",
        );
      } else {
        toast.success(
          targetId === "general"
            ? "Posted to your organisation's public page."
            : `Checked and uploaded. ${donorLabel} will see this against their donation.`,
        );
      }
    } catch {
      setBusy(false);
      const msg = "Something went wrong uploading your proof. Please try again.";
      setUploadError(msg);
      toast.error(msg);
    }
  }


  return (
    <div className="mx-auto max-w-3xl px-5 py-10">
      <Breadcrumbs
        crumbs={[
          { label: "Home", to: "/" },
          { label: "Recipient dashboard" },
        ]}
        className="mb-4"
      />
      <p className="data-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
        Recipient view
      </p>

      {/* Profile header — warm and human; this persona is the least technical. */}
      <header className="mt-4 flex flex-wrap items-center gap-5 border-b border-border pb-8">
        <span
          className="grid size-16 shrink-0 place-items-center rounded-full bg-verified-soft font-display text-2xl text-verified"
          aria-hidden
        >
          {me.name.charAt(0)}
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="text-3xl leading-tight sm:text-4xl">{me.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {org ? `${org.name} · ` : ""}
            {me.story}
          </p>
            <p className="data-mono mt-2 text-xs text-muted-foreground">
              {me.pseudonym} · {shortAddress(me.walletAddress)}
            </p>
            <details className="mt-3 max-w-md text-xs text-muted-foreground">
              <summary className="cursor-pointer font-medium text-foreground hover:underline">
                What are a pseudonym and wallet address?
              </summary>
              <div className="mt-2 space-y-2 border-l-2 border-verified pl-3">
                <p>
                  <strong className="text-foreground">Pseudonym</strong> — a randomly generated name
                  like <span className="data-mono">{me.pseudonym}</span> that protects your real
                  identity. Organisations, donors and the public only ever see this.
                </p>
                <p>
                  <strong className="text-foreground">Wallet address</strong> — a public account
                  number on the blockchain (<span className="data-mono">{shortAddress(me.walletAddress)}</span>).
                  Funds settle here. It's not your name and can't identify you on its own.
                </p>
                <p>
                  Your real name is only shown here, to you. Everyone else — including{" "}
                  {org?.name ?? "your organisation"} — sees your pseudonym and wallet address.
                </p>
              </div>
            </details>
        </div>
        {established && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-verified-soft px-3 py-1.5 text-xs font-medium text-verified">
            <BadgeCheck className="size-4" aria-hidden />
            Established account
          </span>
        )}
      </header>

      {/* Unlinked recipients (self-serve signup) finish setup here — same dashboard, one step left. */}
      {!org && (
        <section className="mt-8 border-2 border-pending bg-pending-soft p-6">
          <h2 className="font-display text-2xl leading-tight">
            One step left: link your organisation
          </h2>
          <p className="mt-2 max-w-xl text-sm">
            Your account works, but donations reach you through an organisation. Search for the one
            you're associated with — or open the invite link they sent you.
          </p>
          <Link
            to="/link-org"
            className="mt-5 inline-block rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Find my organisation
          </Link>
        </section>
      )}



      {/* Action area — the two things this person actually came to do. */}
      <section className="mt-8 grid gap-4 sm:grid-cols-2">
        <button
          type="button"
          onClick={onConfirmAll}
          disabled={awaiting.length === 0}
          className="flex flex-col items-start gap-3 border-2 border-primary bg-primary p-6 text-left text-primary-foreground transition-opacity hover:opacity-90 disabled:border-input disabled:bg-card disabled:text-muted-foreground disabled:opacity-100"
        >
          <HandCoins className="size-8" aria-hidden />
          <span className="font-display text-2xl leading-tight">Confirm funds received</span>
          <span className="text-sm opacity-90">
            {awaiting.length > 0
              ? `${awaiting.length} donation${awaiting.length > 1 ? "s are" : " is"} waiting for you to say it arrived.`
              : "Nothing waiting right now — you're up to date."}
          </span>
        </button>

        <button
          type="button"
          onClick={() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
          className="flex flex-col items-start gap-3 border-2 border-primary bg-card p-6 text-left transition-colors hover:bg-accent"
        >
          <Camera className="size-8 text-verified" aria-hidden />
          <span className="font-display text-2xl leading-tight">Upload proof of use</span>
          <span className="text-sm text-muted-foreground">
            {needProof.length > 0
              ? `${needProof.length} donation${needProof.length > 1 ? "s are" : " is"} waiting for a photo of what it bought.`
              : "Show a photo and a sentence about what the money paid for."}
          </span>
        </button>
      </section>

      {/* Reputation, in words rather than a dashboard metric. */}
      <section className="mt-8 border border-border bg-card p-6">
        <p className="font-display text-2xl leading-snug">
          {accounted} of {mine.length} donations accounted for.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          That's how many of the donations sent to you came back with proof of what they bought.
          Donors see this number before they give.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl">Money sent to you</h2>
        {mine.length === 0 ? (
          <p className="mt-4 border border-dashed border-input p-8 text-center text-muted-foreground">
            No donations yet — once someone donates to you, it'll show up here.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {mine.map((d) => (
              <li
                key={d.id}
                className="flex flex-wrap items-center gap-4 border border-border bg-card p-4"
              >
                <StampBadge status={d.status} size="sm" animate={d.status === "verified"} />
                <div className="min-w-0 flex-1">
                  <p className="data-mono text-base font-medium">
                    {formatAmount(d.amount, d.currency)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    From {d.isPublic ? d.donorName : "Anonymous"} ·{" "}
                    <span className="data-mono text-xs">{formatStamp(d.timestamp)}</span>
                  </p>
                </div>
                <StatusPill status={d.status} />
                {d.status === "pending" ? (
                  <button
                    type="button"
                    onClick={async () => {
                      await submitToChain({ action: "confirmReceipt", donationId: d.id });
                      confirmReceipt(d.id);
                      toast.success("Marked as received.");
                    }}
                    className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
                  >
                    I've received this
                  </button>
                ) : (
                  <Link
                    to="/proof/$donationId"
                    params={{ donationId: d.id }}
                    className="text-sm font-medium underline-offset-4 hover:underline"
                  >
                    View receipt
                  </Link>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-12">
        <h2 className="text-2xl">What you've already shown</h2>
        {myProofs.length > 0 ? (
          <ul className="mt-4 space-y-4">
            {myProofs.map((p) => {
              const d = p.donationId ? donations.find((x) => x.id === p.donationId) : undefined;
              return (
                <li key={p.id} className="flex flex-wrap gap-5 border border-border bg-card p-5">
                  <img
                    src={p.photoUrl}
                    alt="Proof you uploaded"
                    loading="lazy"
                    className="h-28 w-40 shrink-0 border border-border object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="data-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                      {d
                        ? `Receipt ${d.id} · for ${d.isPublic ? d.donorName : "Anonymous"}`
                        : "General post · organisation page"}
                    </p>
                    <p className="mt-1.5 text-sm leading-relaxed">{p.description}</p>
                    {p.testimonial && (
                      <p className="mt-2 font-display text-lg leading-snug">“{p.testimonial}”</p>
                    )}
                    <p className="data-mono mt-3 text-xs text-muted-foreground">
                      Uploaded {formatStamp(p.submittedAt)}
                    </p>
                  </div>
                  {d ? (
                    <Link
                      to="/proof/$donationId"
                      params={{ donationId: d.id }}
                      className="h-fit text-sm font-medium underline-offset-4 hover:underline"
                    >
                      View receipt
                    </Link>
                  ) : (
                    <span className="inline-flex h-fit items-center rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                      General
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-4 border border-dashed border-input p-8 text-center text-muted-foreground">
            Nothing uploaded yet. Once you show what a donation paid for, it'll be listed here.
          </p>
        )}
      </section>

      <section ref={formRef} className="mt-12 scroll-mt-24">
        <h2 className="text-2xl">Show what it paid for</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          A photo, a sentence about what you bought, and a thank-you if you'd like. That's it.
        </p>

        <form onSubmit={onSubmitProof} className="relative mt-5 space-y-6 border border-border bg-card p-6">
          {busy && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-card/80 backdrop-blur-sm">
              <div className="text-center">
                <Loader2 className="mx-auto size-8 animate-spin text-verified" />
                <p className="mt-3 text-sm font-medium">Checking your photo for authenticity…</p>
                <p className="mt-1 text-xs text-muted-foreground">This usually takes a few seconds.</p>
              </div>
            </div>
          )}
          <label className="block">
            <span className="text-sm font-medium">Which donation is this for?</span>
            <select
              value={targetId}
              onChange={(e) => setTarget(e.target.value)}
              className="mt-1.5 w-full border border-input bg-background px-3 py-2.5 text-base"
            >
              {answerable.map((d) => (
                <option key={d.id} value={d.id}>
                  {formatAmount(d.amount, d.currency)} from{" "}
                  {d.isPublic ? d.donorName : "Anonymous"} · {formatStamp(d.timestamp).slice(0, 10)}
                </option>
              ))}
              <option value="general">
                Not about one donation — post to {org?.name ?? "my organisation"}'s page
              </option>
            </select>
            <span className="mt-1.5 block text-xs text-muted-foreground">
              {targetId === "general"
                ? "This goes on your organisation's public page as general content — no single donor is notified."
                : `${donorLabel} sent this money. Your photo and thank-you appear on their receipt and in their dashboard.`}
            </span>
          </label>

          <div>
            <span className="text-sm font-medium">Photo or shop receipt</span>
            <div className="mt-2 flex flex-wrap items-center gap-4">
              <label className="cursor-pointer rounded-full border border-input px-5 py-2.5 text-sm font-medium transition-colors hover:bg-accent focus-within:outline focus-within:outline-2 focus-within:outline-ring">
                Choose a photo
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    // Read as a data URL so the automated check can see the
                    // actual image, not a browser-only blob reference.
                    const reader = new FileReader();
                    reader.onload = () => setPhotoUrl(String(reader.result));
                    reader.readAsDataURL(file);
                  }}

                />
              </label>
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt="Proof of use preview"
                  className="size-20 border border-border object-cover"
                />
              ) : (
                <span className="text-sm text-muted-foreground">
                  No photo chosen — we'll attach a sample stock image, which the authenticity check will flag.
                </span>
              )}
            </div>
          </div>

          <label className="block">
            <span className="text-sm font-medium">What did the money buy?</span>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A replacement pump head and two lengths of pipe from Mtwapa Hardware."
              className="mt-1.5 w-full border border-input bg-background px-3 py-2.5 text-base"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium">
              {targetId === "general"
                ? "A short note (optional)"
                : `A short thank-you to ${donorLabel} (optional)`}
            </span>
            <textarea
              rows={2}
              value={testimonial}
              onChange={(e) => setTestimonial(e.target.value)}
              placeholder="The queue at the well is twenty minutes now, not two hours."
              className="mt-1.5 w-full border border-input bg-background px-3 py-2.5 text-base"
            />
            <span className="mt-1.5 block text-xs text-muted-foreground">
              This is signed <span className="data-mono">{me.pseudonym}</span> by default and appears
              on the public receipt. Contact details belong in the private share section below —
              those go only to {donorLabel ?? "the donor"}, never to{" "}
              {org?.name ?? "your organisation"} or the public.
            </span>
          </label>

          {targetId !== "general" && (
            <fieldset className="border border-dashed border-verified/40 bg-verified-soft/30 p-4">
              <legend className="px-1 text-sm font-medium text-verified">
                Share with {donorLabel} only (optional)
              </legend>
              <p className="mt-1 text-xs text-muted-foreground">
                Phone, email, WhatsApp or a social handle — only the person who funded this
                donation can see these. Your organisation never will.
              </p>
              <label className="mt-4 block">
                <span className="text-xs uppercase tracking-widest text-muted-foreground">
                  Contact
                </span>
                <input
                  type="text"
                  value={shareContact}
                  onChange={(e) => setShareContact(e.target.value)}
                  placeholder="WhatsApp +254 … or you@example.com"
                  className="mt-1.5 w-full border border-input bg-background px-3 py-2.5 text-base"
                />
              </label>
              <label className="mt-3 block">
                <span className="text-xs uppercase tracking-widest text-muted-foreground">
                  Social
                </span>
                <input
                  type="text"
                  value={shareSocial}
                  onChange={(e) => setShareSocial(e.target.value)}
                  placeholder="@handle or a profile link"
                  className="mt-1.5 w-full border border-input bg-background px-3 py-2.5 text-base"
                />
              </label>
              <label className="mt-3 block">
                <span className="text-xs uppercase tracking-widest text-muted-foreground">
                  Private note
                </span>
                <input
                  type="text"
                  value={shareNote}
                  onChange={(e) => setShareNote(e.target.value)}
                  placeholder="Happy to send a short video if you'd like."
                  className="mt-1.5 w-full border border-input bg-background px-3 py-2.5 text-base"
                />
              </label>
            </fieldset>
          )}


          <p className="text-xs text-muted-foreground">
            Every upload runs through an automated authenticity check — it looks for reused images,
            signs of editing, and whether a receipt matches the amount claimed. If something looks
            off, the receipt is flagged for review rather than quietly approved.
          </p>

          {uploadError && (
            <div className="flex gap-3 border border-flagged/40 bg-flagged-soft p-4 text-sm">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-flagged" />
              <div>
                <p className="font-medium text-flagged">{uploadError}</p>
                <p className="mt-1 text-xs text-muted-foreground">Your photo and text are still here — just press Upload again.</p>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {busy ? "Checking the photo…" : "Upload proof"}
          </button>

        </form>
      </section>
    </div>
  );
}
