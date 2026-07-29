import { BrandLockup, BrandMark, BrandWordmark } from "@/components/openimpact/BrandLogo";
import { PrototypeNotice } from "@/components/openimpact/PrototypeNotice";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ROLE_HOME, useLedger } from "@/lib/openimpact/store";
import { connectWallet, shortAddress } from "@/lib/openimpact/web3";
import { cn } from "@/lib/utils";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Menu } from "lucide-react";
import { useEffect, useState } from "react";

const PUBLIC_LINKS = [
  { to: "/", label: "About" },
  { to: "/how-it-works", label: "How it works" },
  { to: "/organisations", label: "Organisations" },
  { to: "/trust", label: "Trust & privacy" },
] as const;

const ROLE_LABEL = {
  donor: "Donor",
  recipient: "Recipient",
  organisation: "Organisation",
} as const;

export function SiteHeader() {
  const { walletAddress, setWalletAddress, account, signOut } = useLedger();
  const [busy, setBusy] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  async function onConnect() {
    if (walletAddress) {
      setWalletAddress(null);
      return;
    }
    setBusy(true);
    const conn = await connectWallet();
    setWalletAddress(conn.address);
    setBusy(false);
  }

  function onSignOut() {
    signOut();
    setWalletAddress(null);
    setMenuOpen(false);
    navigate({ to: "/auth", replace: true });
  }

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-30 bg-transparent transition-[padding] duration-300 ease-out",
        scrolled ? "px-0 pt-0" : "page-x pt-3 sm:pt-4",
      )}
    >
      <div
        className={cn(
          "relative mx-auto flex w-full items-center justify-between gap-3 border transition-all duration-300 ease-out",
          scrolled
            ? "page-x w-full rounded-none border-x-0 border-t-0 border-border bg-paper/90 py-3.5 shadow-none backdrop-blur-md"
            : "max-w-[90rem] rounded-full border-paper/50 bg-paper/85 px-4 py-2.5 shadow-[0_8px_28px_oklch(0.25_0.03_214_/_0.14)] backdrop-blur-md sm:px-6",
        )}
      >
        <div className="relative z-10 flex min-w-0 shrink-0 justify-start">
          <BrandLockup />
        </div>

        <nav
          aria-label="Main"
          className="pointer-events-none absolute inset-x-0 hidden justify-center md:flex"
        >
          <div className="pointer-events-auto flex items-center gap-6 text-sm">
            {PUBLIC_LINKS.map((l) => (
              <Link
                key={l.label}
                to={l.to}
                className={cn(
                  "whitespace-nowrap py-1 text-muted-foreground transition-colors hover:text-foreground",
                  pathname === l.to && "font-medium text-foreground",
                )}
              >
                {l.label}
              </Link>
            ))}
          </div>
        </nav>

        <div className="relative z-10 flex shrink-0 items-center justify-end gap-2 sm:gap-3">
          <button
            type="button"
            onClick={onConnect}
            disabled={busy}
            className="hidden rounded-full border border-input px-4 py-2 text-sm font-medium transition-colors hover:bg-accent disabled:opacity-60 lg:block"
          >
            {busy ? (
              "Connecting…"
            ) : walletAddress ? (
              <span className="data-mono text-xs">
                {shortAddress(walletAddress)}
              </span>
            ) : (
              "Connect wallet"
            )}
          </button>

          {account ? (
            <div className="hidden items-center gap-2 sm:flex">
              <Link
                to={ROLE_HOME[account.role]}
                className={cn(
                  "rounded-full border border-input px-3.5 py-2 text-xs font-medium",
                  pathname === ROLE_HOME[account.role] &&
                    "bg-primary text-primary-foreground",
                )}
              >
                <span className="hidden md:inline">{account.name} · </span>
                {ROLE_LABEL[account.role]}
                {account.isDemo ? " (demo)" : ""}
              </Link>
              <button
                type="button"
                onClick={onSignOut}
                className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                Sign out
              </button>
            </div>
          ) : (
            <Link
              to="/auth"
              className="hidden rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground sm:inline-flex"
            >
              Sign in
            </Link>
          )}

          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <button
              type="button"
              className="inline-flex size-9 items-center justify-center rounded-full border border-input text-ink transition-colors hover:bg-accent md:hidden"
              aria-label="Open menu"
              onClick={() => setMenuOpen(true)}
            >
              <Menu className="size-5" aria-hidden />
            </button>
            <SheetContent
              side="right"
              className="flex w-[min(100%,20rem)] flex-col gap-0 border-border bg-paper p-0"
            >
              <SheetHeader className="border-b border-border px-5 py-5 text-left">
                <SheetTitle className="font-display text-xl text-ink">
                  Menu
                </SheetTitle>
              </SheetHeader>

              <nav aria-label="Main mobile" className="flex flex-1 flex-col px-3 py-3">
                {PUBLIC_LINKS.map((l) => (
                  <Link
                    key={l.label}
                    to={l.to}
                    onClick={() => setMenuOpen(false)}
                    className={cn(
                      "rounded-lg px-3 py-3 text-base transition-colors",
                      pathname === l.to
                        ? "bg-verified-soft font-medium text-ink"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground",
                    )}
                  >
                    {l.label}
                  </Link>
                ))}
              </nav>

              <div className="mt-auto space-y-2 border-t border-border px-5 py-5">
                <button
                  type="button"
                  onClick={async () => {
                    await onConnect();
                    setMenuOpen(false);
                  }}
                  disabled={busy}
                  className="w-full rounded-full border border-input px-4 py-2.5 text-sm font-medium transition-colors hover:bg-accent disabled:opacity-60"
                >
                  {busy
                    ? "Connecting…"
                    : walletAddress
                      ? shortAddress(walletAddress)
                      : "Connect wallet"}
                </button>

                {account ? (
                  <>
                    <Link
                      to={ROLE_HOME[account.role]}
                      onClick={() => setMenuOpen(false)}
                      className="block w-full rounded-full border border-input px-4 py-2.5 text-center text-sm font-medium"
                    >
                      {ROLE_LABEL[account.role]}
                      {account.isDemo ? " (demo)" : ""} dashboard
                    </Link>
                    <button
                      type="button"
                      onClick={onSignOut}
                      className="w-full text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                    >
                      Sign out
                    </button>
                  </>
                ) : (
                  <Link
                    to="/auth"
                    onClick={() => setMenuOpen(false)}
                    className="block w-full rounded-full bg-primary px-4 py-2.5 text-center text-sm font-medium text-primary-foreground"
                  >
                    Sign in
                  </Link>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-ink text-paper">
      <div className="page-shell py-12 sm:py-14 lg:py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr] lg:gap-14">
          <div className="max-w-md">
            <Link to="/" className="inline-flex items-center gap-2.5">
              <BrandMark className="size-8" />
              <BrandWordmark className="text-xl [&_.text-ink]:text-paper" />
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-paper/65">
              A public receipt for every donation, so you can see the money
              arrive, who received it, and what it bought.
            </p>
            <Link
              to="/organisations"
              className="mt-6 inline-flex rounded-full bg-verified px-5 py-2.5 text-sm font-medium text-verified-foreground transition-opacity hover:opacity-90"
            >
              Find an organisation
            </Link>
          </div>

          <div>
            <p className="data-mono text-[11px] uppercase tracking-[0.2em] text-verified">
              Explore
            </p>
            <ul className="mt-4 space-y-3 text-sm">
              <li>
                <Link
                  to="/"
                  hash="about"
                  className="text-paper/70 transition-colors hover:text-paper"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  to="/how-it-works"
                  className="text-paper/70 transition-colors hover:text-paper"
                >
                  How it works
                </Link>
              </li>
              <li>
                <Link
                  to="/organisations"
                  className="text-paper/70 transition-colors hover:text-paper"
                >
                  Organisations
                </Link>
              </li>
              <li>
                <a
                  href="/#try-it"
                  className="text-paper/70 transition-colors hover:text-paper"
                >
                  Try the demo
                </a>
              </li>
            </ul>
          </div>

          <div>
            <p className="data-mono text-[11px] uppercase tracking-[0.2em] text-verified">
              Trust
            </p>
            <ul className="mt-4 space-y-3 text-sm">
              <li>
                <Link
                  to="/trust"
                  className="text-paper/70 transition-colors hover:text-paper"
                >
                  Trust & privacy
                </Link>
              </li>
              <li>
                <a
                  href="#get-in-touch"
                  className="text-paper/70 transition-colors hover:text-paper"
                >
                  Get in touch
                </a>
              </li>
              <li>
                <Link
                  to="/auth"
                  className="text-paper/70 transition-colors hover:text-paper"
                >
                  Sign in
                </Link>
              </li>
            </ul>
            <p className="mt-6 text-xs leading-relaxed text-paper/45">
              Built for transparent giving. Receipts stay public; real names
              stay private.
            </p>
          </div>
        </div>

        <div className="mt-12 space-y-4 border-t border-paper/15 pt-6">
          <PrototypeNotice tone="onDark" />

          <div className="flex flex-col gap-2 text-xs text-paper/45 sm:flex-row sm:items-center sm:justify-between">
            <p>© {year} OpenImpact</p>
            <p className="sm:text-right">Transparency you can see</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
