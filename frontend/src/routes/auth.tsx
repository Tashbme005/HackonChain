import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { HandCoins, Landmark, ShieldCheck, UserRound, Wallet } from "lucide-react";
import { toast } from "sonner";

import { ROLE_HOME, useLedger, type Role } from "@/lib/openimpact/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>) => ({
    next: (["donor", "recipient", "organisation"] as const).includes(search.next as Role)
      ? (search.next as Role)
      : undefined,
    invite: typeof search.invite === "string" && search.invite ? search.invite : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Sign in or create your OpenImpact account" },
      {
        name: "description",
        content:
          "Create a donor, recipient or organisation account on OpenImpact — or open a pre-filled demo seat and explore each dashboard without signing up.",
      },
      { property: "og:title", content: "Sign in to OpenImpact" },
      {
        property: "og:description",
        content: "Three seats — donor, recipient, organisation. Real account or instant demo.",
      },
    ],
  }),
  component: AuthPage,
});

const ROLES: { role: Role; label: string; blurb: string; icon: typeof UserRound }[] = [
  { role: "donor", label: "Donor", blurb: "Give and follow the receipt", icon: UserRound },
  { role: "recipient", label: "Recipient", blurb: "Confirm funds, show proof", icon: HandCoins },
  {
    role: "organisation",
    label: "Organisation",
    blurb: "Run a cause and its ledger",
    icon: Landmark,
  },
];

function AuthPage() {
  const { next, invite: inviteCode } = Route.useSearch();
  const { signUp, signIn, signInDemo, getInvite, getOrg } = useLedger();
  const navigate = useNavigate();

  const invite = getInvite(inviteCode);
  const inviteOrg = getOrg(invite?.orgId);
  const inviteValid = !!invite && !invite.usedByAccountId && !!inviteOrg;

  const [mode, setMode] = useState<"signup" | "signin">("signup");
  const [role, setRole] = useState<Role>(inviteValid ? "recipient" : (next ?? "donor"));
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  /** Both recipient paths land on /recipient; unlinked ones stop at /link-org first. */
  function go(r: Role, recipientLinked?: boolean) {
    if (r === "recipient" && recipientLinked === false) {
      navigate({ to: "/link-org" });
      return;
    }
    navigate({ to: ROLE_HOME[r] });
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    // A claimed slot is always a recipient signup, even if local state hydrated
    // after the role selector initialised.
    const effectiveRole: Role = inviteValid ? "recipient" : role;
    const res =
      mode === "signup"
        ? signUp({
            name,
            email,
            password,
            role: effectiveRole,
            inviteCode: inviteValid ? invite!.code : undefined,
          })
        : signIn(email, password);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    toast.success(mode === "signup" ? "Account created" : "Welcome back");
    if (res.role === "recipient") {
      // Invite signups arrive already linked; everyone else picks their org next.
      go("recipient", mode === "signup" ? inviteValid : undefined);
      return;
    }
    go(res.role);
  }

  function onDemo(r: Role) {
    signInDemo(r);
    toast.success(`Demo ${r} account opened`);
    go(r);
  }

  // ── Path 1: invite link — simplified, org already attached ─────────
  if (inviteValid) {
    return (
      <div className="mx-auto max-w-xl px-5 py-14">
        <p className="data-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Recipient slot · {invite!.code}
        </p>
        <h1 className="mt-3 text-4xl leading-tight">
          Claim a recipient slot with {inviteOrg!.name}
        </h1>
        <p className="mt-3 text-muted-foreground">
          This link was opened for a project, not for a named person. Whoever claims it becomes the
          recipient for that disbursement — {inviteOrg!.name} never learns who you are.
        </p>

        <div className="receipt-edge mt-8 border border-border bg-card px-6 pb-8 pt-9">
          <div className="dotted-rule pb-5">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              Project / disbursement
            </p>
            <p className="mt-1.5 font-display text-2xl leading-tight">{invite!.projectLabel}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {inviteOrg!.name}
              {invite!.amount ? ` · $${invite!.amount.toLocaleString()} earmarked` : ""}
            </p>
            {invite!.note && (
              <p className="mt-1 text-sm text-muted-foreground">{invite!.note}</p>
            )}
          </div>

          <div className="mt-5 flex gap-3 border border-border bg-secondary/40 p-4 text-sm">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-verified" aria-hidden />
            <p className="text-muted-foreground">
              <span className="font-medium text-foreground">Your name stays private.</span> It is
              stored for your own dashboard only. On the ledger you appear as a generated pseudonym
              and wallet address — the same as anyone who signs up on their own.
            </p>
          </div>

          <form onSubmit={onSubmit} className="mt-6 space-y-6">
            <Field
              label="Your name (private)"
              value={name}
              onChange={setName}
              placeholder="Amina Hassan"
            />
            <Field
              label="Email"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="you@example.org"
            />
            <Field
              label="Password"
              type="password"
              value={password}
              onChange={setPassword}
              placeholder="At least 6 characters"
            />
            {error && (
              <p role="alert" className="text-sm text-flagged">
                {error}
              </p>
            )}
            <button
              type="submit"
              className="w-full rounded-full bg-primary px-6 py-3.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              Claim this slot
            </button>
          </form>
        </div>

        <p className="mt-6 text-sm text-muted-foreground">
          Not expecting this?{" "}
          <Link to="/auth" search={{ next: undefined, invite: undefined }} className="underline underline-offset-4">
            Sign up on your own instead
          </Link>{" "}
          — you can search for your organisation afterwards.
        </p>
      </div>
    );
  }

  const inviteProblem =
    inviteCode && !inviteValid
      ? invite?.usedByAccountId
        ? "That invite link has already been used. Sign up below and search for your organisation."
        : "We couldn't find that invite link. Sign up below and search for your organisation."
      : null;

  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <p className="data-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
        Sign in · OpenImpact
      </p>
      <h1 className="mt-3 max-w-2xl text-4xl leading-tight sm:text-5xl">
        Pick your seat at the ledger
      </h1>
      <p className="mt-3 max-w-xl text-muted-foreground">
        Everyone sees the same receipts — donors, the people receiving funds, and the organisations
        in between just work with them differently.
      </p>
      {inviteProblem && (
        <p role="alert" className="mt-5 border border-flagged/40 bg-flagged-soft px-4 py-3 text-sm text-flagged">
          {inviteProblem}
        </p>
      )}


      <div className="mt-10 grid gap-10 lg:grid-cols-[1.15fr_0.85fr]">
        {/* ── Path 1: real account ───────────────────────────── */}
        <section className="receipt-edge border border-border bg-card px-6 pb-8 pt-9 sm:px-8">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="text-3xl">{mode === "signup" ? "Create your account" : "Sign in"}</h2>
            <button
              type="button"
              onClick={() => {
                setMode(mode === "signup" ? "signin" : "signup");
                setError(null);
              }}
              className="text-sm font-medium underline-offset-4 hover:underline"
            >
              {mode === "signup" ? "I already have one" : "Create one instead"}
            </button>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Your own profile, filled in with your own activity as you go.
          </p>

          <form onSubmit={onSubmit} className="mt-7 space-y-6">
            {mode === "signup" && (
              <fieldset>
                <legend className="text-xs uppercase tracking-widest text-muted-foreground">
                  Account type
                </legend>
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  {ROLES.map((r) => {
                    const Icon = r.icon;
                    const active = role === r.role;
                    return (
                      <button
                        type="button"
                        key={r.role}
                        aria-pressed={active}
                        onClick={() => setRole(r.role)}
                        className={cn(
                          "border p-4 text-left transition-colors",
                          active
                            ? "border-ink bg-ink text-paper"
                            : "border-input hover:border-foreground",
                        )}
                      >
                        <Icon className="size-5" aria-hidden />
                        <p className="mt-2 font-medium">{r.label}</p>
                        <p
                          className={cn(
                            "mt-1 text-xs",
                            active ? "opacity-70" : "text-muted-foreground",
                          )}
                        >
                          {r.blurb}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            )}

            {mode === "signup" && role === "recipient" && (
              <div className="flex gap-3 border border-border bg-secondary/40 p-4 text-sm">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-verified" aria-hidden />
                <p className="text-muted-foreground">
                  When you sign up as a recipient, you'll get a <strong>pseudonym</strong> (like
                  'Coral-4821') — a randomly generated name that protects your real identity.
                  Organisations and the public only ever see this pseudonym and your wallet address,
                  never your real name.
                </p>
              </div>
            )}

            {mode === "signup" && role === "donor" && (
              <div className="flex gap-3 border border-border bg-secondary/40 p-4 text-sm">
                <Wallet className="mt-0.5 size-4 shrink-0 text-verified" aria-hidden />
                <p className="text-muted-foreground">
                  A <strong>wallet address</strong> is like a public account number on the
                  blockchain. It lets you send and receive funds without sharing your real identity.
                  You'll connect one when you make your first donation.
                </p>
              </div>
            )}

            {mode === "signup" && (
              <Field
                label={role === "organisation" ? "Organisation name" : "Full name"}
                value={name}
                onChange={setName}
                placeholder={role === "organisation" ? "Kilifi Water Trust" : "Amina Hassan"}
              />
            )}
            <Field
              label="Email"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="you@example.org"
            />
            <Field
              label="Password"
              type="password"
              value={password}
              onChange={setPassword}
              placeholder="At least 6 characters"
            />

            {error && (
              <p role="alert" className="text-sm text-flagged">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="w-full rounded-full bg-primary px-6 py-3.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              {mode === "signup" ? "Create account" : "Sign in"}
            </button>
            <p className="text-xs text-muted-foreground">
              Prototype auth — accounts live in this browser only. No funds move on chain yet.
            </p>
          </form>
        </section>

        {/* ── Path 2: demo seats ─────────────────────────────── */}
        <section className="border border-dashed border-input bg-muted/40 p-6 sm:p-8">
          <h2 className="text-3xl">Explore a demo</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            For reviewers: jump straight into a pre-populated dashboard — donations, statuses and
            proof of use already filled in. Nothing to sign up for.
          </p>

          <div className="mt-7 space-y-3">
            {ROLES.map((r) => {
              const Icon = r.icon;
              return (
                <button
                  key={r.role}
                  type="button"
                  onClick={() => onDemo(r.role)}
                  className="flex w-full items-center gap-4 border border-border bg-card px-5 py-4 text-left transition-transform hover:-translate-y-0.5"
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-full border border-input">
                    <Icon className="size-4" aria-hidden />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-medium">Demo {r.label}</span>
                    <span className="block text-xs text-muted-foreground">{r.blurb}</span>
                  </span>
                </button>
              );
            })}
          </div>

          <p className="dotted-rule mt-7 pt-5 text-xs text-muted-foreground">
            Demo data is shared and resettable. Prefer to look around first?{" "}
            <Link to="/" className="underline underline-offset-4">
              Browse the public causes
            </Link>
            .
          </p>
        </section>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full border border-input bg-background px-4 py-3 text-sm outline-none focus-visible:border-foreground"
      />
    </label>
  );
}
