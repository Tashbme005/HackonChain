import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";

import {
  CURRENT_DONOR_NAME,
  CURRENT_ORG_ID,
  CURRENT_RECIPIENT_ID,
  MOCK_DONATIONS,
  MOCK_ORGS,
  MOCK_RECIPIENTS,
  DONOR_PROFILE,
} from "./mock-data";
import { mockTxHash } from "./web3";
import type { Donation, Organisation, ProofOfUse, PublicationProof, Recipient } from "./types";
import { isFullyAccounted } from "./types";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import {
  getSessionProfile,
  onAuthChange,
  signInDemoWithSupabase,
  signInWithSupabase,
  signOutSupabase,
  signUpWithSupabase,
  type AuthProfile,
} from "@/lib/supabase/auth";

const STORAGE_KEY = "openimpact.state.v8";

export type Role = "donor" | "recipient" | "organisation";

export const ROLE_HOME: Record<Role, string> = {
  donor: "/donor",
  recipient: "/recipient",
  organisation: "/organisation",
};

export interface Account {
  id: string;
  email: string;
  /** DEMO ONLY — plaintext, in local state. Real auth replaces this entirely. */
  password: string;
  name: string;
  role: Role;
  isDemo: boolean;
  createdAt: string;
  walletAddress: string;
  location?: string;
  /** Recipient / organisation record this account drives. */
  entityId?: string;
}

function profileToAccount(p: AuthProfile): Account {
  return {
    id: p.id,
    email: p.email,
    password: "",
    name: p.name,
    role: p.role,
    isDemo: p.isDemo,
    createdAt: p.createdAt,
    walletAddress: p.walletAddress ?? "",
    location: p.location ?? undefined,
    entityId: p.entityId,
  };
}

/** Pre-populated accounts a judge can log straight into. */
const DEMO_ACCOUNTS: Account[] = [
  {
    id: "acc-demo-donor",
    email: "demo.donor@openimpact.app",
    password: "demo",
    name: CURRENT_DONOR_NAME,
    role: "donor",
    isDemo: true,
    createdAt: DONOR_PROFILE.memberSince,
    walletAddress: DONOR_PROFILE.walletAddress,
    location: DONOR_PROFILE.location,
  },
  {
    id: "acc-demo-recipient",
    email: "demo.recipient@openimpact.app",
    password: "demo",
    name: "Amina Hassan",
    role: "recipient",
    isDemo: true,
    createdAt: "2025-12-02T00:00:00.000Z",
    walletAddress: MOCK_RECIPIENTS[0].walletAddress,
    entityId: CURRENT_RECIPIENT_ID,
  },
  {
    id: "acc-demo-org",
    email: "demo.org@openimpact.app",
    password: "demo",
    name: "Kilifi Water Trust",
    role: "organisation",
    isDemo: true,
    createdAt: "2025-09-18T00:00:00.000Z",
    walletAddress: MOCK_ORGS[0].walletAddress,
    entityId: CURRENT_ORG_ID,
  },
];

/**
 * A generic, unassigned "recipient slot" an organisation opens against a
 * project or disbursement. The org does NOT know who will claim it — whoever
 * opens the link signs up with their real identity (private) and the org only
 * ever sees the pseudonym + wallet that gets assigned on claim.
 */
export interface RecipientInvite {
  code: string;
  orgId: string;
  /** The project or disbursement this slot belongs to. */
  projectLabel: string;
  /** Optional amount earmarked for the slot. */
  amount?: number;
  note?: string;
  createdAt: string;
  usedByAccountId?: string;
  /** Set on claim — the pseudonym assigned to whoever opened the link. */
  claimedPseudonym?: string;
  claimedWallet?: string;
  claimedAt?: string;
}

const PSEUDONYM_WORDS = [
  "Coral", "Baobab", "Kestrel", "Marigold", "Almendro", "Harbour", "Tamarind", "Juniper",
  "Cinder", "Meridian", "Saffron", "Pelican", "Quartz", "Willow", "Anchor", "Lantern",
];

/** Pseudonyms are the ONLY recipient identity organisations ever receive. */
export function generatePseudonym(existing: string[] = []) {
  for (let i = 0; i < 50; i += 1) {
    const word = PSEUDONYM_WORDS[Math.floor(Math.random() * PSEUDONYM_WORDS.length)];
    const candidate = `${word}-${Math.floor(1000 + Math.random() * 9000)}`;
    if (!existing.includes(candidate)) return candidate;
  }
  return `Recipient-${Date.now().toString(36).toUpperCase()}`;
}

interface LedgerState {
  donations: Donation[];
  recipients: Recipient[];
  organisations: Organisation[];
  walletAddress: string | null;
  donorIsPublic: boolean;
  accounts: Account[];
  sessionId: string | null;
  invites: RecipientInvite[];
}

interface DonorProfile {
  name: string;
  walletAddress: string;
  memberSince: string;
  location: string;
}

interface LedgerValue extends LedgerState {
  hydrated: boolean;
  account: Account | null;
  currentDonorName: string;
  currentRecipientId: string;
  currentOrgId: string;
  donorProfile: DonorProfile;
  signUp: (input: {
    name: string;
    email: string;
    password: string;
    role: Role;
    /** Invite code (recipient path 1) or chosen org (recipient path 2). */
    inviteCode?: string;
    orgId?: string;
  }) => Promise<{ ok: true; role: Role } | { ok: false; error: string }>;
  signIn: (
    email: string,
    password: string,
  ) => Promise<{ ok: true; role: Role } | { ok: false; error: string }>;
  signInDemo: (role: Role) => Promise<Role>;
  signOut: () => void;
  setDonorIsPublic: (v: boolean) => void;
  setWalletAddress: (address: string | null) => void;
  addDonation: (donation: Donation) => void;
  confirmReceipt: (donationId: string) => void;
  /** Primary case: proof answers ONE donation, so ONE donor sees it first. */
  attachProofToDonation: (
    donationId: string,
    proof: Omit<ProofOfUse, "id" | "scope" | "donationId" | "recipientId" | "donorName" | "donorIsPublic">,
  ) => void;
  /** Secondary case: general testimonial, posted to the organisation's page. */
  attachGeneralProof: (
    recipientId: string,
    orgId: string,
    proof: Omit<ProofOfUse, "id" | "scope" | "recipientId" | "orgId">,
  ) => void;
  /** Every proof this recipient has published, newest first. */
  proofsByRecipient: (recipientId: string) => ProofOfUse[];
  getRecipient: (id: string) => Recipient | undefined;
  getOrg: (id?: string) => Organisation | undefined;
  orgTrustScore: (orgId: string) => number;
  /** % of this org's donations with recipient proof of use. */
  orgProofRate: (orgId: string) => number;
  /** % of this org's donations with the org's own publication proof filed. */
  orgPublicationRate: (orgId: string) => number;
  /** % of donations with BOTH legs in — the "fully accounted for" rate. */
  orgAccountedRate: (orgId: string) => number;
  /** Organisation files the mandatory publication proof for one donation. */
  attachPublicationProof: (
    donationId: string,
    draft: Omit<PublicationProof, "id" | "submittedAt">,
  ) => void;
  removePublicationProof: (donationId: string) => void;
  /** Organisation console: open an unassigned recipient slot on a project. */
  createInvite: (input: {
    orgId: string;
    projectLabel: string;
    amount?: number;
    note?: string;
  }) => RecipientInvite;
  revokeInvite: (code: string) => void;
  getInvite: (code?: string) => RecipientInvite | undefined;
  /** Self-serve path: attach an existing recipient account to an organisation. */
  linkRecipientToOrg: (recipientId: string, orgId: string) => void;
  updateRecipientStory: (recipientId: string, story: string) => void;
}

const initialState: LedgerState = {
  donations: MOCK_DONATIONS,
  recipients: MOCK_RECIPIENTS,
  organisations: MOCK_ORGS,
  walletAddress: null,
  donorIsPublic: true,
  accounts: DEMO_ACCOUNTS,
  sessionId: null,
  invites: [
    {
      code: "KILIFI-7QX2",
      orgId: CURRENT_ORG_ID,
      projectLabel: "Mtwapa borehole — caretaker stipend",
      amount: 300,
      note: "One slot, Q1 disbursement",
      createdAt: "2026-01-08T09:12:00.000Z",
    },
  ],
};

const LedgerContext = createContext<LedgerValue | null>(null);

function newWallet() {
  return mockTxHash().slice(0, 42);
}

export function LedgerProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<LedgerState>(initialState);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate after mount. Prefer Supabase session when configured; else localStorage mock.
  useEffect(() => {
    let unsub = () => {};
    (async () => {
      try {
        if (isSupabaseConfigured()) {
          const profile = await getSessionProfile();
          if (profile) {
            const account = profileToAccount(profile);
            setState((s) => ({
              ...s,
              accounts: s.accounts.some((a) => a.id === account.id)
                ? s.accounts.map((a) => (a.id === account.id ? account : a))
                : [...s.accounts, account],
              sessionId: account.id,
              walletAddress: account.walletAddress || s.walletAddress,
            }));
          }
          unsub = onAuthChange((next) => {
            if (!next) {
              setState((s) => ({ ...s, sessionId: null }));
              return;
            }
            const account = profileToAccount(next);
            setState((s) => ({
              ...s,
              accounts: s.accounts.some((a) => a.id === account.id)
                ? s.accounts.map((a) => (a.id === account.id ? account : a))
                : [...s.accounts, account],
              sessionId: account.id,
              walletAddress: account.walletAddress || s.walletAddress,
            }));
          });
        } else {
          const raw = window.localStorage.getItem(STORAGE_KEY);
          if (raw) setState({ ...initialState, ...(JSON.parse(raw) as LedgerState) });
        }
      } catch {
        /* ignore corrupt local state / missing supabase */
      }
      setHydrated(true);
    })();
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!hydrated || isSupabaseConfigured()) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage unavailable */
    }
  }, [state, hydrated]);

  const setWalletAddress = useCallback((address: string | null) => {
    setState((s) => ({ ...s, walletAddress: address }));
  }, []);

  const setDonorIsPublic = useCallback((v: boolean) => {
    setState((s) => ({ ...s, donorIsPublic: v }));
  }, []);

  const addDonation = useCallback((donation: Donation) => {
    setState((s) => ({ ...s, donations: [donation, ...s.donations] }));
  }, []);

  const confirmReceipt = useCallback((donationId: string) => {
    setState((s) => ({
      ...s,
      donations: s.donations.map((d) =>
        d.id === donationId && d.status === "pending" ? { ...d, status: "received" } : d,
      ),
    }));
  }, []);

  const attachProofToDonation = useCallback<LedgerValue["attachProofToDonation"]>(
    (donationId, draft) => {
      setState((s) => {
        const target = s.donations.find((d) => d.id === donationId);
        if (!target) return s;
        // The donor is read off the donation record, so the proof lands in that
        // donor's dashboard rather than a generic organisation feed.
        const proof: ProofOfUse = {
          ...draft,
          id: `pf-${Date.now().toString(36)}`,
          scope: "donation",
          donationId,
          recipientId: target.recipientId,
          donorName: target.donorName,
          donorIsPublic: target.isPublic,
        };
        return {
          ...s,
          donations: s.donations.map((d) =>
            d.id === donationId
              ? { ...d, proof, status: proof.flagged ? "flagged" : "verified" }
              : d,
          ),
          recipients: s.recipients.map((r) =>
            r.id === target.recipientId ? { ...r, proofOfUse: proof } : r,
          ),
        };
      });
    },
    [],
  );

  const attachPublicationProof = useCallback<LedgerValue["attachPublicationProof"]>(
    (donationId, draft) => {
      const publication: PublicationProof = {
        ...draft,
        url: draft.url.trim(),
        caption: draft.caption?.trim() || undefined,
        id: `pub-${Date.now().toString(36)}`,
        submittedAt: new Date().toISOString(),
      };
      setState((s) => ({
        ...s,
        donations: s.donations.map((d) => (d.id === donationId ? { ...d, publication } : d)),
      }));
    },
    [],
  );

  const removePublicationProof = useCallback((donationId: string) => {
    setState((s) => ({
      ...s,
      donations: s.donations.map((d) => (d.id === donationId ? { ...d, publication: null } : d)),
    }));
  }, []);

  const attachGeneralProof = useCallback<LedgerValue["attachGeneralProof"]>(
    (recipientId, orgId, draft) => {
      const proof: ProofOfUse = {
        ...draft,
        id: `pf-gen-${Date.now().toString(36)}`,
        scope: "general",
        recipientId,
        orgId,
      };
      setState((s) => ({
        ...s,
        organisations: s.organisations.map((o) =>
          o.id === orgId ? { ...o, generalProofs: [proof, ...(o.generalProofs ?? [])] } : o,
        ),
        recipients: s.recipients.map((r) => (r.id === recipientId ? { ...r, proofOfUse: proof } : r)),
      }));
    },
    [],
  );

  /** Sign-up: Supabase Auth + complete_signup RPC when configured; else local mock. */
  const signUp = useCallback<LedgerValue["signUp"]>(
    async ({ name, email, password, role, inviteCode, orgId }) => {
      const cleanEmail = email.trim().toLowerCase();
      if (!name.trim()) return { ok: false as const, error: "Please add your name." };
      if (!cleanEmail.includes("@"))
        return { ok: false as const, error: "That email doesn't look right." };
      if (password.length < 6)
        return { ok: false as const, error: "Use at least 6 characters for your password." };

      if (isSupabaseConfigured()) {
        const res = await signUpWithSupabase({
          name,
          email: cleanEmail,
          password,
          role,
          inviteCode,
          orgId,
        });
        if (!res.ok) return res;
        const account = profileToAccount(res.profile);
        setState((s) => ({
          ...s,
          accounts: s.accounts.some((a) => a.id === account.id)
            ? s.accounts.map((a) => (a.id === account.id ? account : a))
            : [...s.accounts, account],
          sessionId: account.id,
          walletAddress: account.walletAddress || s.walletAddress,
        }));
        return { ok: true as const, role: account.role };
      }

      let failure: string | null = null;
      setState((s) => {
        if (s.accounts.some((a) => a.email.toLowerCase() === cleanEmail)) {
          failure = "An account with that email already exists.";
          return s;
        }
        const id = `acc-${Date.now().toString(36)}`;
        const wallet = newWallet();
        const account: Account = {
          id,
          email: cleanEmail,
          password,
          name: name.trim(),
          role,
          isDemo: false,
          createdAt: new Date().toISOString(),
          walletAddress: wallet,
          entityId: role === "donor" ? undefined : `${role === "recipient" ? "rcp" : "org"}-${id}`,
        };

        const pseudonym =
          role === "recipient"
            ? generatePseudonym(s.recipients.map((r) => r.pseudonym))
            : "";

        const invite = inviteCode
          ? s.invites.find((i) => i.code === inviteCode && !i.usedByAccountId)
          : undefined;
        const linkedOrgId = role === "recipient" ? (invite?.orgId ?? orgId) : undefined;

        const recipients =
          role === "recipient"
            ? [
                ...s.recipients,
                {
                  id: account.entityId!,
                  name: account.name,
                  pseudonym,
                  orgId: linkedOrgId,
                  story: "Tell donors what you're raising for — you can edit this any time.",
                  walletAddress: wallet,
                  proofOfUse: null,
                  reputationScore: 50,
                } satisfies Recipient,
              ]
            : s.recipients;

        let organisations =
          role === "organisation"
            ? [
                ...s.organisations,
                {
                  id: account.entityId!,
                  name: account.name,
                  tagline: "A new organisation on OpenImpact",
                  description:
                    "Add a description of your work so donors know what their money pays for.",
                  imageUrl: "",
                  walletAddress: wallet,
                  reputationScore: 50,
                  recipientIds: [],
                } satisfies Organisation,
              ]
            : s.organisations;

        if (linkedOrgId) {
          organisations = organisations.map((o) =>
            o.id === linkedOrgId && !o.recipientIds.includes(account.entityId!)
              ? { ...o, recipientIds: [...o.recipientIds, account.entityId!] }
              : o,
          );
        }

        const invites = invite
          ? s.invites.map((i) =>
              i.code === invite.code
                ? {
                    ...i,
                    usedByAccountId: id,
                    claimedPseudonym: pseudonym,
                    claimedWallet: wallet,
                    claimedAt: new Date().toISOString(),
                  }
                : i,
            )
          : s.invites;

        return {
          ...s,
          accounts: [...s.accounts, account],
          recipients,
          organisations,
          invites,
          sessionId: id,
        };
      });

      return failure ? { ok: false as const, error: failure } : { ok: true as const, role };
    },
    [],
  );

  const createInvite = useCallback<LedgerValue["createInvite"]>(
    ({ orgId, projectLabel, amount, note }) => {
      const code = `INV-${Math.random().toString(36).slice(2, 6).toUpperCase()}${Math.random()
        .toString(36)
        .slice(2, 4)
        .toUpperCase()}`;
      const invite: RecipientInvite = {
        code,
        orgId,
        projectLabel: projectLabel.trim() || "Unassigned recipient slot",
        amount: amount && amount > 0 ? amount : undefined,
        note: note?.trim() || undefined,
        createdAt: new Date().toISOString(),
      };
      setState((s) => ({ ...s, invites: [invite, ...s.invites] }));
      return invite;
    },
    [],
  );

  const revokeInvite = useCallback((code: string) => {
    setState((s) => ({ ...s, invites: s.invites.filter((i) => i.code !== code) }));
  }, []);

  const linkRecipientToOrg = useCallback((recipientId: string, orgId: string) => {
    setState((s) => ({
      ...s,
      recipients: s.recipients.map((r) => (r.id === recipientId ? { ...r, orgId } : r)),
      organisations: s.organisations.map((o) =>
        o.id === orgId && !o.recipientIds.includes(recipientId)
          ? { ...o, recipientIds: [...o.recipientIds, recipientId] }
          : o,
      ),
    }));
  }, []);

  const updateRecipientStory = useCallback((recipientId: string, story: string) => {
    setState((s) => ({
      ...s,
      recipients: s.recipients.map((r) => (r.id === recipientId ? { ...r, story } : r)),
    }));
  }, []);


  const signIn = useCallback<LedgerValue["signIn"]>(async (email, password) => {
    if (isSupabaseConfigured()) {
      const res = await signInWithSupabase(email, password);
      if (!res.ok) return res;
      const account = profileToAccount(res.profile);
      setState((s) => ({
        ...s,
        accounts: s.accounts.some((a) => a.id === account.id)
          ? s.accounts.map((a) => (a.id === account.id ? account : a))
          : [...s.accounts, account],
        sessionId: account.id,
        walletAddress: account.walletAddress || s.walletAddress,
      }));
      return { ok: true as const, role: account.role };
    }

    const cleanEmail = email.trim().toLowerCase();
    const match = state.accounts.find(
      (a) => a.email.toLowerCase() === cleanEmail && a.password === password,
    );
    if (!match) return { ok: false as const, error: "No account matches that email and password." };
    setState((s) => ({ ...s, sessionId: match.id }));
    return { ok: true as const, role: match.role };
  }, [state.accounts]);

  const signInDemo = useCallback(async (role: Role) => {
    if (isSupabaseConfigured()) {
      const res = await signInDemoWithSupabase(role);
      if (res.ok) {
        const account = profileToAccount(res.profile);
        setState((s) => ({
          ...s,
          accounts: s.accounts.some((a) => a.id === account.id)
            ? s.accounts.map((a) => (a.id === account.id ? account : a))
            : [...s.accounts, account],
          sessionId: account.id,
          walletAddress: account.walletAddress || s.walletAddress,
        }));
        return account.role;
      }
      // Demo Auth users may not exist yet — fall through to local mock seats.
      console.warn("[auth] Supabase demo sign-in failed, using local demo seat:", res.error);
    }
    const demo = DEMO_ACCOUNTS.find((a) => a.role === role)!;
    setState((s) => ({ ...s, sessionId: demo.id }));
    return role;
  }, []);

  const signOut = useCallback(() => {
    if (isSupabaseConfigured()) {
      void signOutSupabase();
    }
    setState((s) => ({ ...s, sessionId: null }));
  }, []);

  const value = useMemo<LedgerValue>(() => {
    const orgRows = (orgId: string) => state.donations.filter((d) => d.orgId === orgId);
    const pct = (n: number, total: number) => (total === 0 ? 0 : Math.round((n / total) * 100));

    const orgProofRate = (orgId: string) => {
      const rows = orgRows(orgId);
      return pct(rows.filter((d) => d.proof).length, rows.length);
    };
    const orgPublicationRate = (orgId: string) => {
      const rows = orgRows(orgId);
      return pct(rows.filter((d) => d.publication).length, rows.length);
    };
    const orgAccountedRate = (orgId: string) => {
      const rows = orgRows(orgId);
      return pct(rows.filter((d) => isFullyAccounted(d)).length, rows.length);
    };

    // Reputation now weighs BOTH mandatory legs equally: the recipient's proof
    // of use and the organisation's publication proof.
    const orgTrustScore = (orgId: string) => {
      const rows = orgRows(orgId);
      if (rows.length === 0)
        return state.organisations.find((o) => o.id === orgId)?.reputationScore ?? 0;
      return Math.round((orgProofRate(orgId) + orgPublicationRate(orgId)) / 2);
    };

    const account = state.accounts.find((a) => a.id === state.sessionId) ?? null;

    const donorProfile: DonorProfile =
      account && account.role === "donor"
        ? {
          name: account.name,
          walletAddress: account.walletAddress,
          memberSince: account.createdAt,
          location: account.location ?? "Somewhere on the internet",
        }
        : DONOR_PROFILE;

    return {
      ...state,
      hydrated,
      account,
      currentDonorName: donorProfile.name,
      currentRecipientId:
        account?.role === "recipient" ? (account.entityId ?? CURRENT_RECIPIENT_ID) : CURRENT_RECIPIENT_ID,
      currentOrgId:
        account?.role === "organisation" ? (account.entityId ?? CURRENT_ORG_ID) : CURRENT_ORG_ID,
      donorProfile,
      signUp,
      signIn,
      signInDemo,
      signOut,
      setDonorIsPublic,
      setWalletAddress,
      addDonation,
      confirmReceipt,
      attachProofToDonation,
      attachGeneralProof,
      proofsByRecipient: (recipientId) =>
        [
          ...state.donations
            .filter((d) => d.recipientId === recipientId && d.proof)
            .map((d) => d.proof!),
          ...state.organisations.flatMap((o) =>
            (o.generalProofs ?? []).filter((p) => p.recipientId === recipientId),
          ),
        ].sort((a, b) => b.submittedAt.localeCompare(a.submittedAt)),
      getRecipient: (id) => state.recipients.find((r) => r.id === id),
      getOrg: (id) => state.organisations.find((o) => o.id === id),
      orgTrustScore,
      orgProofRate,
      orgPublicationRate,
      orgAccountedRate,
      attachPublicationProof,
      removePublicationProof,
      createInvite,
      revokeInvite,
      getInvite: (code) => (code ? state.invites.find((i) => i.code === code) : undefined),
      linkRecipientToOrg,
      updateRecipientStory,
    };
  }, [
    state,
    hydrated,
    signUp,
    signIn,
    signInDemo,
    signOut,
    setDonorIsPublic,
    setWalletAddress,
    addDonation,
    confirmReceipt,
    attachProofToDonation,
    attachGeneralProof,
    attachPublicationProof,
    removePublicationProof,
    createInvite,
    revokeInvite,
    linkRecipientToOrg,
    updateRecipientStory,
  ]);

  return <LedgerContext.Provider value={value}>{children}</LedgerContext.Provider>;
}

export function useLedger(): LedgerValue {
  const ctx = useContext(LedgerContext);
  if (!ctx) throw new Error("useLedger must be used inside <LedgerProvider>");
  return ctx;
}

/** Client-side gate: sends anyone without the right seat back to /auth. */
export function useRequireRole(role: Role) {
  const { account, hydrated } = useLedger();
  const navigate = useNavigate();
  const ok = account?.role === role;

  useEffect(() => {
    if (!hydrated) return;
    if (!account) {
      navigate({ to: "/auth", search: { next: role }, replace: true });
    } else if (account.role !== role) {
      navigate({ to: ROLE_HOME[account.role], replace: true });
    }
  }, [hydrated, account, role, navigate]);

  return { allowed: ok, checking: !hydrated };
}

export function formatAmount(amount: number, currency: string) {
  return `${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
}

export function formatStamp(iso: string) {
  const d = new Date(iso);
  return d.toISOString().slice(0, 16).replace("T", " ") + " UTC";
}
