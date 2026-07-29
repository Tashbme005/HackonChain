import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useState } from "react";

import { ROLE_HOME, useLedger } from "@/lib/trustflow/store";
import { connectWallet, shortAddress } from "@/lib/trustflow/web3";
import { cn } from "@/lib/utils";

const PUBLIC_LINKS = [
  { to: "/", label: "Causes" },
  { to: "/how-it-works", label: "How it works" },
  { to: "/about", label: "About" },
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
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();

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
    navigate({ to: "/auth", replace: true });
  }


  return (
    <header className="sticky top-0 z-30 border-b border-border bg-paper/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-5 py-3.5">
        <Link to="/" className="flex items-center gap-2">
          <span
            className="grid size-7 place-items-center rounded-full border-2 border-dashed border-verified"
            aria-hidden
          >
            <span className="size-2 rounded-full bg-verified" />
          </span>
          <span className="text-lg font-semibold tracking-tight">TrustFlow</span>
        </Link>

        <nav aria-label="Main" className="order-3 flex w-full gap-5 text-sm sm:order-none sm:w-auto">
          {PUBLIC_LINKS.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={cn(
                "py-1 text-muted-foreground transition-colors hover:text-foreground",
                pathname === l.to && "font-medium text-foreground",
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <button
            type="button"
            onClick={onConnect}
            disabled={busy}
            className="hidden rounded-full border border-input px-4 py-2 text-sm font-medium transition-colors hover:bg-accent disabled:opacity-60 sm:block"
          >
            {busy ? (
              "Connecting…"
            ) : walletAddress ? (
              <span className="data-mono text-xs">{shortAddress(walletAddress)}</span>
            ) : (
              "Connect wallet"
            )}
          </button>

          {account ? (
            <div className="flex items-center gap-2">
              <Link
                to={ROLE_HOME[account.role]}
                className={cn(
                  "rounded-full border border-input px-3.5 py-2 text-xs font-medium",
                  pathname === ROLE_HOME[account.role] && "bg-primary text-primary-foreground",
                )}
              >
                <span className="hidden sm:inline">{account.name} · </span>
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
              className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              Sign in
            </Link>
          )}
        </div>

      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-wrap gap-x-10 gap-y-3 px-5 py-8 text-sm text-muted-foreground">
        <p className="w-full sm:w-auto sm:flex-1">
          TrustFlow — a receipt for every donation. Prototype data; no funds move on chain yet.
        </p>
        <Link to="/how-it-works" className="hover:text-foreground">
          How it works
        </Link>
        <Link to="/about" className="hover:text-foreground">
          About
        </Link>
        <Link to="/trust" className="hover:text-foreground">
          Trust & privacy
        </Link>
      </div>
    </footer>
  );
}
