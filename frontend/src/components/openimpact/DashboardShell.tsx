import { Link, useNavigate } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import {
  Bell,
  ChevronsLeft,
  ChevronsRight,
  LogOut,
  Menu,
  Search,
  UserRound,
  Wallet,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";

import { BrandLockup, BrandMark } from "@/components/openimpact/BrandLogo";
import {
  buildDashboardNotifications,
  loadReadNotificationIds,
  saveReadNotificationIds,
  unreadNotifications,
  type DashboardNotification,
} from "@/lib/openimpact/notifications";
import { useLedger, type Role } from "@/lib/openimpact/store";
import { connectWallet, shortAddress } from "@/lib/openimpact/web3";
import { cn } from "@/lib/utils";

export type DashboardNavItem = {
  id: string;
  label: string;
  icon: LucideIcon;
};

const ROLE_LABEL: Record<Role, string> = {
  donor: "Donor",
  recipient: "Recipient",
  organisation: "Organisation",
};

const FOOTER_PAGE: Partial<Record<Role, { id: string; label: string }>> = {
  donor: { id: "updates", label: "Open updates" },
  recipient: { id: "donations", label: "Open money sent to you" },
  organisation: { id: "money", label: "Open fund flow" },
};

type DashboardShellProps = {
  role: Role;
  nav: DashboardNavItem[];
  page: string;
  onPageChange: (id: string) => void;
  children: ReactNode;
  title?: string;
};

/** Prominent connect / disconnect wallet strip for dashboard overview bodies. */
export function DashboardWalletBanner() {
  const { walletAddress, setWalletAddress } = useLedger();
  const [walletBusy, setWalletBusy] = useState(false);

  async function onConnect() {
    if (walletAddress) {
      setWalletAddress(null);
      toast.message("Wallet disconnected");
      return;
    }
    setWalletBusy(true);
    try {
      const conn = await connectWallet();
      setWalletAddress(conn.address);
      toast.success("Wallet connected");
    } catch {
      toast.error("Could not connect wallet");
    } finally {
      setWalletBusy(false);
    }
  }

  return (
    <section
      className={cn(
        "flex flex-col gap-4 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5",
        walletAddress
          ? "border-verified/30 bg-verified-soft/40"
          : "border-verified/40 bg-ink text-paper",
      )}
    >
      <div className="min-w-0">
        <p className="data-mono text-[10px] uppercase tracking-[0.18em] text-verified">
          Wallet
        </p>
        <p
          className={cn(
            "mt-1 font-display text-xl leading-tight sm:text-2xl",
            walletAddress ? "text-ink" : "text-paper",
          )}
        >
          {walletAddress
            ? "Wallet connected"
            : "Connect your wallet to donate and settle"}
        </p>
        <p
          className={cn(
            "mt-1 text-sm",
            walletAddress ? "text-muted-foreground" : "text-paper/70",
          )}
        >
          {walletAddress
            ? `Active session · ${shortAddress(walletAddress)}`
            : "This is how gifts are tied to a verifiable identity on the ledger. Sign in is separate."}
        </p>
      </div>
      <div className="shrink-0">
        <button
          type="button"
          onClick={onConnect}
          disabled={walletBusy}
          className={cn(
            "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-50 sm:text-base",
            walletAddress
              ? "border-2 border-verified bg-verified-soft text-verified"
              : "bg-verified text-verified-foreground shadow-[0_8px_24px_oklch(0.45_0.1_160_/_0.35)]",
          )}
        >
          <Wallet className="size-5 shrink-0" aria-hidden />
          {walletBusy
            ? "Connecting…"
            : walletAddress
              ? shortAddress(walletAddress)
              : "Connect wallet"}
        </button>
      </div>
    </section>
  );
}

export function DashboardShell({
  role,
  nav,
  page,
  onPageChange,
  children,
  title,
}: DashboardShellProps) {
  const {
    walletAddress,
    setWalletAddress,
    account,
    signOut,
    donations,
    donorProfile,
    currentRecipientId,
    currentOrgId,
    getOrg,
    getRecipient,
    invites,
  } = useLedger();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [walletBusy, setWalletBusy] = useState(false);
  const [query, setQuery] = useState("");
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [readIds, setReadIds] = useState<Set<string>>(() => new Set());
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const accountKey = account?.id ?? `guest-${role}`;

  useEffect(() => {
    setReadIds(loadReadNotificationIds(accountKey));
  }, [accountKey]);

  const notifications = useMemo(
    () =>
      buildDashboardNotifications({
        role,
        donations,
        donorName: donorProfile.name,
        recipientId: currentRecipientId,
        orgId: currentOrgId,
        getOrg,
        getRecipient,
        invites,
      }),
    [
      role,
      donations,
      donorProfile.name,
      currentRecipientId,
      currentOrgId,
      getOrg,
      getRecipient,
      invites,
    ],
  );

  const preview = notifications.slice(0, 8);
  const unread = unreadNotifications(notifications, readIds);
  const notifCount = unread.length;
  const footer = FOOTER_PAGE[role];
  const footerNav =
    footer && nav.some((n) => n.id === footer.id) ? footer : null;

  const active = nav.find((n) => n.id === page) ?? nav[0];
  const pageTitle = title ?? active?.label ?? "Dashboard";
  const initial = (account?.name ?? ROLE_LABEL[role]).charAt(0).toUpperCase();

  const searchHits = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return nav.filter((n) => n.label.toLowerCase().includes(q));
  }, [nav, query]);

  useEffect(() => {
    setMobileOpen(false);
  }, [page]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      const t = e.target as Node;
      if (notifRef.current && !notifRef.current.contains(t))
        setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(t))
        setProfileOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function persistRead(next: Set<string>) {
    setReadIds(next);
    saveReadNotificationIds(accountKey, next);
  }

  function markAllRead() {
    const next = new Set(readIds);
    for (const n of notifications) next.add(n.id);
    persistRead(next);
  }

  function onNotificationClick(n: DashboardNotification) {
    const next = new Set(readIds);
    next.add(n.id);
    persistRead(next);
    if (n.donationId && role === "donor") {
      setNotifOpen(false);
      navigate({
        to: "/proof/$donationId",
        params: { donationId: n.donationId },
      });
      return;
    }
    if (n.page && nav.some((item) => item.id === n.page)) {
      go(n.page);
      return;
    }
    setNotifOpen(false);
  }

  async function onConnect() {
    if (walletAddress) {
      setWalletAddress(null);
      toast.message("Wallet disconnected");
      return;
    }
    setWalletBusy(true);
    try {
      const conn = await connectWallet();
      setWalletAddress(conn.address);
      toast.success("Wallet connected");
    } catch {
      toast.error("Could not connect wallet");
    } finally {
      setWalletBusy(false);
    }
  }

  function onSignOut() {
    signOut();
    setWalletAddress(null);
    navigate({ to: "/auth", replace: true });
  }

  function go(id: string) {
    onPageChange(id);
    setMobileOpen(false);
    setQuery("");
    setNotifOpen(false);
    setProfileOpen(false);
  }

  const walletButton = (opts?: {
    size?: "sm" | "md" | "lg";
    block?: boolean;
  }) => {
    const size = opts?.size ?? "md";
    const connected = Boolean(walletAddress);
    return (
      <button
        type="button"
        onClick={onConnect}
        disabled={walletBusy}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-opacity hover:opacity-90 disabled:opacity-50",
          connected
            ? "border-2 border-verified bg-verified-soft text-verified"
            : "bg-verified text-verified-foreground shadow-[0_8px_24px_oklch(0.45_0.1_160_/_0.35)]",
          size === "sm" && "px-3 py-1.5 text-xs",
          size === "md" && "px-4 py-2 text-sm",
          size === "lg" && "px-6 py-3 text-sm sm:text-base",
          opts?.block && "w-full",
        )}
      >
        <Wallet
          className={cn(size === "lg" ? "size-5" : "size-4", "shrink-0")}
          aria-hidden
        />
        {walletBusy
          ? "Connecting…"
          : connected
            ? shortAddress(walletAddress!)
            : "Connect wallet"}
      </button>
    );
  };

  const navList = (
    <nav aria-label="Dashboard" className="flex flex-1 flex-col gap-0.5 px-2">
      {nav.map((item) => {
        const Icon = item.icon;
        const isActive = item.id === (active?.id ?? page);
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => go(item.id)}
            title={item.label}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
              isActive
                ? "bg-ink text-paper"
                : "text-muted-foreground hover:bg-muted hover:text-ink",
              collapsed && "justify-center px-2",
            )}
          >
            <Icon className="size-4 shrink-0" aria-hidden />
            {!collapsed && (
              <span className="truncate font-medium">{item.label}</span>
            )}
          </button>
        );
      })}
    </nav>
  );

  const topBar = (
    <div className="sticky top-0 z-20 border-b border-border bg-card/95 backdrop-blur">
      <div className="flex h-14 items-center gap-2 px-3 sm:gap-3 sm:px-4 lg:px-6">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="inline-flex size-9 items-center justify-center rounded-lg border border-border text-ink md:hidden"
          aria-label="Open menu"
        >
          <Menu className="size-5" />
        </button>

        <div className="relative min-w-0 flex-1 max-w-xl">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search dashboard…"
            className="w-full rounded-full border border-border bg-background py-2 pl-9 pr-3 text-sm outline-none ring-verified/30 placeholder:text-muted-foreground focus:ring-2"
            aria-label="Search dashboard"
          />
          {searchHits.length > 0 && (
            <ul className="absolute left-0 right-0 top-[calc(100%+0.35rem)] z-30 overflow-hidden rounded-xl border border-border bg-card shadow-lg">
              {searchHits.map((hit) => {
                const Icon = hit.icon;
                return (
                  <li key={hit.id}>
                    <button
                      type="button"
                      onClick={() => go(hit.id)}
                      className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm hover:bg-muted"
                    >
                      <Icon className="size-4 text-muted-foreground" />
                      {hit.label}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
          <div className="hidden sm:block">{walletButton({ size: "md" })}</div>

          <div className="relative" ref={notifRef}>
            <button
              type="button"
              onClick={() => {
                setNotifOpen((o) => !o);
                setProfileOpen(false);
              }}
              className="relative inline-flex size-9 items-center justify-center rounded-full border border-border text-ink hover:bg-muted"
              aria-label="Notifications"
              aria-expanded={notifOpen}
            >
              <Bell className="size-4" />
              {notifCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 grid min-w-4 place-items-center rounded-full bg-flagged px-1 text-[9px] font-bold leading-4 text-paper">
                  {notifCount > 9 ? "9+" : notifCount}
                </span>
              )}
            </button>
            {notifOpen && (
              <div className="absolute right-0 top-[calc(100%+0.4rem)] z-30 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-border bg-card shadow-lg">
                <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
                  <p className="text-sm font-medium text-ink">Notifications</p>
                  {notifCount > 0 && (
                    <button
                      type="button"
                      onClick={markAllRead}
                      className="text-xs font-medium text-verified hover:underline"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                {preview.length === 0 ? (
                  <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                    No notifications yet.
                  </p>
                ) : (
                  <ul className="max-h-72 overflow-y-auto py-1 text-sm">
                    {preview.map((n, i) => {
                      const isUnread = !readIds.has(n.id);
                      return (
                        <li
                          key={n.id}
                          className={cn(
                            i < preview.length - 1 && "border-b border-border",
                          )}
                        >
                          <button
                            type="button"
                            onClick={() => onNotificationClick(n)}
                            className={cn(
                              "flex w-full gap-2.5 px-3 py-2.5 text-left hover:bg-muted",
                              isUnread && "bg-verified-soft/30",
                            )}
                          >
                            <span
                              className={cn(
                                "mt-1.5 size-2 shrink-0 rounded-full",
                                n.tone === "verified" && "bg-verified",
                                n.tone === "pending" && "bg-pending",
                                n.tone === "flagged" && "bg-flagged",
                                n.tone === "neutral" &&
                                  "bg-muted-foreground/40",
                              )}
                              aria-hidden
                            />
                            <span className="min-w-0 flex-1">
                              <span className="flex items-start justify-between gap-2">
                                <span
                                  className={cn(
                                    "text-ink",
                                    isUnread ? "font-semibold" : "font-medium",
                                  )}
                                >
                                  {n.title}
                                </span>
                                {isUnread && (
                                  <span className="mt-1 size-1.5 shrink-0 rounded-full bg-flagged" />
                                )}
                              </span>
                              <span className="mt-0.5 line-clamp-2 block text-xs text-muted-foreground">
                                {n.detail}
                              </span>
                              <span className="data-mono mt-1 block text-[10px] text-muted-foreground">
                                {n.when}
                              </span>
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
                {footerNav && notifications.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      markAllRead();
                      go(footerNav.id);
                    }}
                    className="w-full border-t border-border px-3 py-2.5 text-left text-sm font-medium text-verified hover:bg-muted"
                  >
                    {footerNav.label}
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="relative" ref={profileRef}>
            <button
              type="button"
              onClick={() => {
                setProfileOpen((o) => !o);
                setNotifOpen(false);
              }}
              className="inline-flex size-9 items-center justify-center rounded-full bg-verified text-sm font-semibold text-verified-foreground"
              aria-label="Profile menu"
              aria-expanded={profileOpen}
            >
              {account?.name ? initial : <UserRound className="size-4" />}
            </button>
            {profileOpen && (
              <div className="absolute right-0 top-[calc(100%+0.4rem)] z-30 w-56 overflow-hidden rounded-xl border border-border bg-card shadow-lg">
                <div className="border-b border-border px-3 py-3">
                  <p className="truncate text-sm font-medium text-ink">
                    {account?.name ?? ROLE_LABEL[role]}
                  </p>
                  <p className="data-mono mt-0.5 text-[10px] uppercase tracking-widest text-muted-foreground">
                    {ROLE_LABEL[role]}
                    {account?.isDemo ? " · demo" : ""}
                  </p>
                </div>
                <div className="p-1">
                  {nav.some((n) => n.id === "profile") && (
                    <button
                      type="button"
                      onClick={() => go("profile")}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-ink"
                    >
                      <UserRound className="size-3.5" aria-hidden />
                      View profile
                    </button>
                  )}
                  <Link
                    to="/"
                    className="block rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-ink"
                    onClick={() => setProfileOpen(false)}
                  >
                    Public site
                  </Link>
                  <button
                    type="button"
                    onClick={onSignOut}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-flagged hover:bg-flagged-soft"
                  >
                    <LogOut className="size-3.5" aria-hidden />
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile wallet row */}
      <div className="border-t border-border px-3 py-2 sm:hidden">
        {walletButton({ size: "md", block: true })}
      </div>
    </div>
  );

  return (
    <div className="flex min-h-dvh bg-background">
      <aside
        className={cn(
          "sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-border bg-card md:flex",
          collapsed ? "w-[4.25rem]" : "w-60",
        )}
      >
        <div
          className={cn(
            "flex items-center border-b border-border px-3",
            collapsed
              ? "h-auto flex-col justify-center gap-1 py-3"
              : "h-14 justify-between gap-2",
          )}
        >
          {!collapsed ? (
            <BrandLockup to="/" className="min-w-0 origin-left scale-95" />
          ) : (
            <Link to="/" aria-label="OpenImpact home" className="shrink-0">
              <BrandMark className="size-7" />
            </Link>
          )}
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-ink"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronsRight className="size-4" />
            ) : (
              <ChevronsLeft className="size-4" />
            )}
          </button>
        </div>
        <div className="flex min-h-0 flex-1 flex-col py-3">{navList}</div>
        <div
          className={cn(
            "border-t border-border p-3",
            collapsed && "flex justify-center",
          )}
        >
          <button
            type="button"
            onClick={onSignOut}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-flagged transition-colors hover:bg-flagged-soft",
              collapsed && "justify-center",
            )}
            title="Sign out"
          >
            <LogOut className="size-3.5 shrink-0" aria-hidden />
            {!collapsed && "Sign out"}
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {topBar}

        <div className="hidden items-end justify-between gap-4 border-b border-border/60 px-6 pb-4 pt-4 md:flex lg:px-8">
          <div>
            <p className="data-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              {ROLE_LABEL[role]} dashboard
            </p>
            <h1 className="mt-0.5 font-display text-xl leading-tight text-ink lg:text-2xl">
              {pageTitle}
            </h1>
          </div>
        </div>

        <main className="flex-1 overflow-x-hidden px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden" role="dialog" aria-modal>
          <button
            type="button"
            className="absolute inset-0 bg-ink/40"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 flex w-[min(18rem,88vw)] flex-col bg-card shadow-xl">
            <div className="flex h-14 items-center justify-between border-b border-border px-3">
              <BrandLockup to="/" />
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
                aria-label="Close menu"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="flex min-h-0 flex-1 flex-col py-3">
              <nav
                aria-label="Dashboard"
                className="flex flex-1 flex-col gap-0.5 px-2"
              >
                {nav.map((item) => {
                  const Icon = item.icon;
                  const isActive = item.id === (active?.id ?? page);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => go(item.id)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                        isActive
                          ? "bg-ink text-paper"
                          : "text-muted-foreground hover:bg-muted hover:text-ink",
                      )}
                    >
                      <Icon className="size-4 shrink-0" aria-hidden />
                      <span className="font-medium">{item.label}</span>
                    </button>
                  );
                })}
              </nav>
              <div className="space-y-2 border-t border-border p-3">
                {walletButton({ size: "md", block: true })}
                <button
                  type="button"
                  onClick={onSignOut}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium text-flagged hover:bg-flagged-soft"
                >
                  <LogOut className="size-3.5" aria-hidden />
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
