import { useState, type FormEvent } from "react";
import { toast } from "sonner";

/**
 * Contact strip above the footer. Prototype: validates and confirms locally.
 */
export function GetInTouch() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedMessage = message.trim();

    if (!trimmedName || !trimmedEmail || !trimmedMessage) {
      toast.error("Please fill in your name, email, and message.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      toast.error("Enter a valid email address.");
      return;
    }

    setBusy(true);
    await new Promise((r) => setTimeout(r, 450));
    setBusy(false);
    setName("");
    setEmail("");
    setMessage("");
    toast.success("Message noted. We'll get back to you soon.");
  }

  const fieldClass =
    "mt-1.5 w-full border border-input bg-background px-3.5 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-foreground";

  return (
    <section
      id="get-in-touch"
      className="scroll-mt-24 border-t border-border bg-muted/50"
    >
      <div className="page-shell py-12 sm:py-16 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start lg:gap-16">
          <div>
            <p className="data-mono text-[11px] uppercase tracking-[0.2em] text-verified">
              Get in touch
            </p>
            <h2 className="mt-3 font-display text-3xl leading-tight text-ink sm:text-4xl">
              Questions, feedback, or a partnership idea?
            </h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
              Tell us what you need. This is a prototype inbox for the hackathon,
              so messages stay on this device for now.
            </p>
          </div>

          <form
            onSubmit={onSubmit}
            className="space-y-4 rounded-2xl border border-border bg-card p-5 sm:p-7"
            noValidate
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="font-medium text-ink">Name</span>
                <input
                  type="text"
                  name="name"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className={fieldClass}
                />
              </label>
              <label className="block text-sm">
                <span className="font-medium text-ink">Email</span>
                <input
                  type="email"
                  name="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.org"
                  className={fieldClass}
                />
              </label>
            </div>

            <label className="block text-sm">
              <span className="font-medium text-ink">Message</span>
              <textarea
                name="message"
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="How can we help?"
                className={`${fieldClass} min-h-[8rem] resize-y`}
              />
            </label>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <p className="text-xs text-muted-foreground">
                We never share your details with organisations.
              </p>
              <button
                type="submit"
                disabled={busy}
                className="rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {busy ? "Sending…" : "Send"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
