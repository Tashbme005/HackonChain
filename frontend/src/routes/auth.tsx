import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import {
  Eye,
  EyeOff,
  HandCoins,
  Landmark,
  ShieldCheck,
  UserRound,
  Wallet,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";

import { BrandLockup } from "@/components/openimpact/BrandLogo";
import { StampBadge } from "@/components/openimpact/StampBadge";
import { DEMO_CREDENTIALS } from "@/lib/supabase/auth";
import { ROLE_HOME, useLedger, type Role } from "@/lib/openimpact/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>) => ({
    next: (["donor", "recipient", "organisation"] as const).includes(
      search.next as Role,
    )
      ? (search.next as Role)
      : undefined,
    invite:
      typeof search.invite === "string" && search.invite
        ? search.invite
        : undefined,
  }),
  head: () => ({
    meta: [
      { title: "OpenImpact" },
      {
        name: "description",
        content:
          "Create a donor, recipient or organisation account on OpenImpact, or open a prefilled demo seat and explore each dashboard without signing up.",
      },
      { property: "og:title", content: "OpenImpact" },
      {
        property: "og:description",
        content:
          "Three seats: donor, recipient, organisation. Real account or instant demo.",
      },
    ],
  }),
  component: AuthPage,
});

const ROLES: {
  role: Role;
  label: string;
  blurb: string;
  icon: typeof UserRound;
}[] = [
  {
    role: "donor",
    label: "Donor",
    blurb: "Give and follow the receipt",
    icon: UserRound,
  },
  {
    role: "recipient",
    label: "Recipient",
    blurb: "Confirm funds, show proof",
    icon: HandCoins,
  },
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

  const [mode, setMode] = useState<"signup" | "signin">("signin");
  const [role, setRole] = useState<Role>(
    inviteValid ? "recipient" : (next ?? "donor"),
  );
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function go(r: Role, recipientLinked?: boolean) {
    if (r === "recipient" && recipientLinked === false) {
      navigate({ to: "/link-org" });
      return;
    }
    navigate({ to: ROLE_HOME[r] });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const effectiveRole: Role = inviteValid ? "recipient" : role;
    const res =
      mode === "signup"
        ? await signUp({
            name,
            email,
            password,
            role: effectiveRole,
            inviteCode: inviteValid ? invite!.code : undefined,
          })
        : await signIn(email, password);
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    toast.success(mode === "signup" ? "Account created" : "Welcome back");
    if (res.role === "recipient") {
      go("recipient", mode === "signup" ? inviteValid : undefined);
      return;
    }
    go(res.role);
  }

  async function onDemo(r: Role) {
    setBusy(true);
    await signInDemo(r);
    setBusy(false);
    toast.success(`Demo ${r} account opened`);
    go(r);
  }

  function fillDemo(r: Role) {
    const creds = DEMO_CREDENTIALS[r];
    setMode("signin");
    setEmail(creds.email);
    setPassword(creds.password);
    setError(null);
    toast.message(`Filled ${r} demo login`);
  }

  if (inviteValid) {
    return (
      <div className="flex min-h-dvh flex-col bg-background">
        <div className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-5 py-10 sm:px-8">
          <BrandLockup />
          <p className="data-mono mt-10 text-[11px] uppercase tracking-[0.2em] text-verified">
            Recipient slot · {invite!.code}
          </p>
          <h1 className="mt-3 font-display text-3xl leading-tight text-ink sm:text-4xl">
            Claim a slot with {inviteOrg!.name}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            This link is for a project, not a named person. Whoever claims it
            becomes the recipient. {inviteOrg!.name} never learns who you are.
          </p>

          <div className="mt-8 rounded-2xl border border-border bg-card p-6 sm:p-8">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Project
            </p>
            <p className="mt-1.5 font-display text-2xl leading-tight text-ink">
              {invite!.projectLabel}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {inviteOrg!.name}
              {invite!.amount
                ? ` · $${invite!.amount.toLocaleString()} earmarked`
                : ""}
            </p>

            <div className="mt-5 flex gap-3 rounded-xl border border-border bg-secondary/40 p-4 text-sm">
              <ShieldCheck
                className="mt-0.5 size-4 shrink-0 text-verified"
                aria-hidden
              />
              <p className="text-muted-foreground">
                <span className="font-medium text-foreground">
                  Your name stays private.
                </span>{" "}
                On the ledger you appear as a pseudonym and wallet only.
              </p>
            </div>

            <form onSubmit={onSubmit} className="mt-6 space-y-5">
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
              <PasswordField
                value={password}
                onChange={setPassword}
                show={showPassword}
                onToggle={() => setShowPassword((v) => !v)}
              />
              {error && (
                <p role="alert" className="text-sm text-flagged">
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-full bg-primary px-6 py-3.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                Claim this slot
              </button>
            </form>
          </div>

          <p className="mt-6 text-sm text-muted-foreground">
            Not expecting this?{" "}
            <Link
              to="/auth"
              search={{ next: undefined, invite: undefined }}
              className="font-medium text-ink underline-offset-4 hover:underline"
            >
              Sign up on your own
            </Link>
          </p>
        </div>
      </div>
    );
  }

  const inviteProblem =
    inviteCode && !inviteValid
      ? invite?.usedByAccountId
        ? "That invite link has already been used. Sign in below or create an account."
        : "We couldn't find that invite link. Sign in below or create an account."
      : null;

  // Lock the document on desktop so only the right panel scrolls.
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const apply = () => {
      const lock = mq.matches;
      document.documentElement.style.overflow = lock ? "hidden" : "";
      document.body.style.overflow = lock ? "hidden" : "";
    };
    apply();
    mq.addEventListener("change", apply);
    return () => {
      mq.removeEventListener("change", apply);
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    };
  }, []);

  const formFields = (
    <>
      <h1
        className={cn(
          "font-display tracking-tight text-ink",
          mode === "signup" ? "text-2xl sm:text-3xl" : "text-3xl sm:text-4xl",
        )}
      >
        {mode === "signin" ? "Welcome back" : "Create your account"}
      </h1>
      <p
        className={cn(
          "text-sm leading-relaxed text-muted-foreground",
          mode === "signup" ? "mt-1.5" : "mt-2",
        )}
      >
        {mode === "signin"
          ? "Enter your email and password to open your seat on the ledger."
          : "Pick a seat: donor, recipient, or organisation. Then fill in the basics."}
      </p>

      {inviteProblem && (
        <p
          role="alert"
          className="mt-3 rounded-xl border border-flagged/40 bg-flagged/10 px-3 py-2.5 text-sm text-flagged"
        >
          {inviteProblem}
        </p>
      )}

      <div
        className={cn(
          "grid grid-cols-2 gap-1 rounded-full border border-border bg-muted/50 p-1",
          mode === "signup" ? "mt-3.5" : "mt-5",
        )}
      >
        <button
          type="button"
          onClick={() => {
            setMode("signin");
            setError(null);
          }}
          className={cn(
            "rounded-full px-4 py-2 text-sm font-medium transition-colors",
            mode === "signin"
              ? "bg-card text-ink shadow-sm"
              : "text-muted-foreground hover:text-ink",
          )}
        >
          Sign in
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("signup");
            setError(null);
          }}
          className={cn(
            "rounded-full px-4 py-2 text-sm font-medium transition-colors",
            mode === "signup"
              ? "bg-card text-ink shadow-sm"
              : "text-muted-foreground hover:text-ink",
          )}
        >
          Register
        </button>
      </div>

      <form
        onSubmit={onSubmit}
        className={cn(
          mode === "signup" ? "mt-3.5 space-y-2.5" : "mt-5 space-y-4",
        )}
      >
        {mode === "signup" && (
          <fieldset>
            <legend className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
              Account type
            </legend>
            <div className="mt-2 grid grid-cols-3 gap-1.5">
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
                      "rounded-xl border px-2 py-2 text-left transition-colors",
                      active
                        ? "border-ink bg-ink text-paper"
                        : "border-border bg-card hover:border-ink/30",
                    )}
                  >
                    <Icon className="size-3.5" aria-hidden />
                    <p className="mt-1 text-[11px] font-medium sm:text-xs">
                      {r.label}
                    </p>
                  </button>
                );
              })}
            </div>
          </fieldset>
        )}

        {mode === "signup" && role === "recipient" && (
          <Hint icon={ShieldCheck} compact>
            You get a <strong>pseudonym</strong> on the ledger. Your real name
            stays private.
          </Hint>
        )}
        {mode === "signup" && role === "donor" && (
          <Hint icon={Wallet} compact>
            You&apos;ll connect a <strong>wallet</strong> on your first
            donation.
          </Hint>
        )}

        {mode === "signup" && (
          <Field
            label={
              role === "organisation" ? "Organisation name" : "Full name"
            }
            value={name}
            onChange={setName}
            placeholder={
              role === "organisation" ? "Kilifi Water Trust" : "Amina Hassan"
            }
            compact
          />
        )}
        <Field
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="you@example.org"
          compact={mode === "signup"}
        />
        <PasswordField
          value={password}
          onChange={setPassword}
          show={showPassword}
          onToggle={() => setShowPassword((v) => !v)}
          compact={mode === "signup"}
        />

        {error && (
          <p role="alert" className="text-sm text-flagged">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className={cn(
            "w-full rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60",
            mode === "signup" ? "py-2.5" : "py-3",
          )}
        >
          {mode === "signup" ? "Create account" : "Sign in"}
        </button>
      </form>

      <p
        className={cn(
          "text-center text-sm text-muted-foreground",
          mode === "signup" ? "mt-3" : "mt-5",
        )}
      >
        {mode === "signin" ? (
          <>
            Don&apos;t have an account?{" "}
            <button
              type="button"
              onClick={() => setMode("signup")}
              className="font-medium text-verified underline-offset-4 hover:underline"
            >
              Register now
            </button>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => setMode("signin")}
              className="font-medium text-verified underline-offset-4 hover:underline"
            >
              Sign in
            </button>
          </>
        )}
      </p>
    </>
  );

  return (
    <>
      {/* Mobile */}
      <div className="flex min-h-dvh flex-col bg-background px-5 py-5 sm:px-8 lg:hidden">
        <BrandLockup className="shrink-0" />
        <div
          className={cn(
            "mx-auto flex w-full max-w-md flex-1 flex-col justify-center",
            mode === "signup" ? "py-2" : "py-4",
          )}
        >
          {formFields}
          <div className="mt-4">
            <DemoPanel onFill={fillDemo} onEnter={onDemo} busy={busy} />
          </div>
        </div>
        <div className="mt-auto flex shrink-0 items-center justify-between gap-4 border-t border-border pt-3 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} OpenImpact</p>
          <Link to="/trust" className="underline-offset-4 hover:underline">
            Privacy
          </Link>
        </div>
      </div>

      {/* Desktop: light canvas + floating rounded dark panel on the right */}
      <div className="relative hidden h-dvh overflow-hidden bg-background lg:block">
        <div className="absolute inset-y-0 left-0 z-10 flex w-[min(52%,34rem)] flex-col overflow-hidden px-10 py-7 xl:w-[min(50%,36rem)] xl:px-12 xl:py-8">
          <BrandLockup className="shrink-0" />
          <div
            className={cn(
              "flex min-h-0 flex-1 flex-col justify-center",
              mode === "signup" ? "py-1" : "py-2",
            )}
          >
            {formFields}
          </div>
          <div className="mt-auto flex shrink-0 items-center justify-between gap-4 border-t border-border pt-3 text-xs text-muted-foreground">
            <p>© {new Date().getFullYear()} OpenImpact</p>
            <Link to="/trust" className="underline-offset-4 hover:underline">
              Privacy
            </Link>
          </div>
        </div>

        <aside className="absolute inset-y-8 right-8 z-20 flex w-[min(44%,34rem)] flex-col overflow-hidden rounded-[1.5rem] bg-ink text-paper shadow-[0_24px_64px_oklch(0.25_0.03_214_/_0.22)] xl:inset-y-10 xl:right-10 xl:w-[min(46%,36rem)] xl:rounded-[1.75rem]">
          <div
            className="pointer-events-none absolute -right-12 top-12 size-52 rounded-full bg-verified/20 blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-10 left-8 size-44 rounded-full bg-verified/12 blur-3xl"
            aria-hidden
          />

          <div className="relative flex h-full min-h-0 flex-col gap-5 overflow-y-auto overscroll-contain p-7 xl:gap-6 xl:p-8">
            <div className="shrink-0">
              <p className="data-mono text-[10px] uppercase tracking-[0.2em] text-verified">
                On the ledger
              </p>
              <h2 className="mt-2 font-display text-2xl leading-tight xl:text-3xl">
                Every donation, a receipt you can verify.
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-paper/65">
                Sign in to follow proof of use, or open a demo seat below.
              </p>
            </div>

            <ol className="grid shrink-0 grid-cols-3 gap-2">
              {[
                { n: "01", label: "Donate" },
                { n: "02", label: "Confirm" },
                { n: "03", label: "Verify" },
              ].map((step) => (
                <li
                  key={step.n}
                  className="rounded-xl border border-paper/12 bg-paper/5 px-2.5 py-2.5"
                >
                  <p className="data-mono text-[10px] tracking-widest text-verified">
                    {step.n}
                  </p>
                  <p className="mt-1 text-xs font-medium text-paper">
                    {step.label}
                  </p>
                </li>
              ))}
            </ol>

            <div className="min-w-0 shrink-0">
              <DemoPanel onFill={fillDemo} onEnter={onDemo} busy={busy} dark />
            </div>

            <div className="mt-auto flex shrink-0 items-end justify-between gap-4 border-t border-paper/10 pt-4">
              <div className="min-w-0 rounded-xl border border-paper/15 bg-paper/5 px-3 py-2.5">
                <p className="data-mono text-[10px] uppercase tracking-widest text-paper/50">
                  Sample receipt
                </p>
                <p className="mt-1 font-display text-base text-paper">
                  $42 · Verified
                </p>
                <p className="mt-0.5 truncate text-xs text-paper/55">
                  Water filter · Kilifi · photo on file
                </p>
              </div>
              <StampBadge status="verified" size="md" className="shrink-0" />
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}


function DemoPanel({
  onFill,
  onEnter,
  busy,
  dark = false,
}: {
  onFill: (r: Role) => void;
  onEnter: (r: Role) => void;
  busy: boolean;
  dark?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border p-2.5",
        dark ? "border-paper/15 bg-paper/5" : "border-border bg-muted/40",
      )}
    >
      <div className="flex items-center justify-between gap-2 px-0.5">
        <p className="data-mono text-[10px] uppercase tracking-[0.18em] text-verified">
          Demo logins
        </p>
        <p
          className={cn(
            "font-mono text-[10px]",
            dark ? "text-paper/70" : "text-muted-foreground",
          )}
        >
          {DEMO_CREDENTIALS.donor.password}
        </p>
      </div>

      <ul
        className={cn(
          "mt-2 divide-y overflow-hidden rounded-lg border",
          dark ? "divide-paper/10 border-paper/10" : "divide-border border-border bg-card",
        )}
      >
        {ROLES.map((r) => {
          const creds = DEMO_CREDENTIALS[r.role];
          const Icon = r.icon;
          return (
            <li
              key={r.role}
              className="flex min-w-0 items-center gap-2 px-2 py-1.5"
            >
              <Icon
                className={cn(
                  "size-3.5 shrink-0",
                  dark ? "text-verified" : "text-ink",
                )}
                aria-hidden
              />
              <div className="min-w-0 flex-1 truncate leading-tight">
                <span
                  className={cn(
                    "text-xs font-medium",
                    dark ? "text-paper" : "text-ink",
                  )}
                >
                  {r.label}
                </span>
                <span
                  className={cn(
                    "ml-1.5 font-mono text-[10px]",
                    dark ? "text-paper/55" : "text-muted-foreground",
                  )}
                >
                  {creds.email}
                </span>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => onFill(r.role)}
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors",
                    dark
                      ? "border border-paper/25 text-paper hover:bg-paper/10"
                      : "border border-border text-ink hover:bg-accent",
                  )}
                >
                  Fill
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => onEnter(r.role)}
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-medium transition-opacity hover:opacity-90",
                    dark
                      ? "bg-verified text-verified-foreground"
                      : "bg-primary text-primary-foreground",
                  )}
                >
                  Enter
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Hint({
  icon: Icon,
  children,
  compact = false,
}: {
  icon: typeof ShieldCheck;
  children: ReactNode;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex gap-2.5 rounded-xl border border-border bg-muted/50",
        compact ? "p-2.5 text-xs" : "p-3.5 text-sm",
      )}
    >
      <Icon
        className={cn(
          "mt-0.5 shrink-0 text-verified",
          compact ? "size-3.5" : "size-4",
        )}
        aria-hidden
      />
      <p className="text-muted-foreground">{children}</p>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  compact = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  compact?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-ink">{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "mt-1 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ink",
          compact ? "py-2" : "py-2.5",
        )}
      />
    </label>
  );
}

function PasswordField({
  value,
  onChange,
  show,
  onToggle,
  compact = false,
}: {
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggle: () => void;
  compact?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-ink">Password</span>
      <div className="relative mt-1">
        <input
          type={show ? "text" : "password"}
          value={value}
          placeholder="At least 6 characters"
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "w-full rounded-xl border border-input bg-background px-4 pr-11 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ink",
            compact ? "py-2" : "py-2.5",
          )}
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-ink"
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? (
            <EyeOff className="size-4" aria-hidden />
          ) : (
            <Eye className="size-4" aria-hidden />
          )}
        </button>
      </div>
    </label>
  );
}
