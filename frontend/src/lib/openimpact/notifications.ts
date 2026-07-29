import { formatAmount, formatStamp, type Role } from "@/lib/openimpact/store";
import {
  linkHost,
  recipientPublicLabel,
  type Donation,
  type Organisation,
  type Recipient,
  type RecipientInvite,
} from "@/lib/openimpact/types";

export type NotificationTone = "verified" | "pending" | "flagged" | "neutral";

export type DashboardNotification = {
  id: string;
  title: string;
  detail: string;
  when: string;
  at: string;
  tone: NotificationTone;
  /** Dashboard page to open when the item is clicked. */
  page?: string;
  donationId?: string;
};

type BuildArgs = {
  role: Role;
  donations: Donation[];
  donorName: string;
  recipientId: string;
  orgId: string;
  getOrg: (id?: string) => Organisation | undefined;
  getRecipient: (id: string) => Recipient | undefined;
  invites?: RecipientInvite[];
};

function sortNewest(items: DashboardNotification[]) {
  return items.sort(
    (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime(),
  );
}

export function buildDonorNotifications(
  mine: Donation[],
  getOrg: (id?: string) => { name: string } | undefined,
  getRecipient: (id: string) => Recipient | undefined,
): DashboardNotification[] {
  const items: DashboardNotification[] = [];

  for (const d of mine) {
    const orgName = getOrg(d.orgId)?.name ?? "Organisation";
    const who = recipientPublicLabel(getRecipient(d.recipientId));

    if (d.proof) {
      items.push({
        id: `proof-${d.id}`,
        title: `${who} uploaded proof of use`,
        detail: `${formatAmount(d.amount, d.currency)} via ${orgName}: ${d.proof.description.slice(0, 90)}${d.proof.description.length > 90 ? "…" : ""}`,
        when: formatStamp(d.proof.submittedAt),
        at: d.proof.submittedAt,
        tone: d.status === "flagged" ? "flagged" : "verified",
        page: "updates",
        donationId: d.id,
      });
    }
    if (d.publication) {
      items.push({
        id: `pub-${d.id}`,
        title: `${orgName} filed publication proof`,
        detail: linkHost(d.publication.url),
        when: formatStamp(d.publication.submittedAt),
        at: d.publication.submittedAt,
        tone: "neutral",
        page: "updates",
        donationId: d.id,
      });
    }
    if (d.status === "received" && !d.proof) {
      items.push({
        id: `recv-${d.id}`,
        title: `${who} confirmed funds received`,
        detail: `${formatAmount(d.amount, d.currency)}. Proof of use still pending`,
        when: formatStamp(d.timestamp),
        at: d.timestamp,
        tone: "pending",
        page: "updates",
        donationId: d.id,
      });
    }
    if (d.status === "pending") {
      items.push({
        id: `sent-${d.id}`,
        title: `Gift sent to ${who}`,
        detail: `${formatAmount(d.amount, d.currency)} via ${orgName}. Waiting for confirm`,
        when: formatStamp(d.timestamp),
        at: d.timestamp,
        tone: "pending",
        page: "donations",
        donationId: d.id,
      });
    }
    if (d.status === "flagged") {
      items.push({
        id: `flag-${d.id}`,
        title: `Gift under review`,
        detail: `${formatAmount(d.amount, d.currency)} to ${who}${d.note ? `: ${d.note}` : ""}`,
        when: formatStamp(d.timestamp),
        at: d.timestamp,
        tone: "flagged",
        page: "donations",
        donationId: d.id,
      });
    }
  }

  return sortNewest(items);
}

function buildRecipientNotifications(
  mine: Donation[],
  getOrg: (id?: string) => Organisation | undefined,
): DashboardNotification[] {
  const items: DashboardNotification[] = [];

  for (const d of mine) {
    const orgName = getOrg(d.orgId)?.name ?? "Organisation";
    const donor = d.isPublic ? d.donorName : "Anonymous";

    if (d.status === "pending") {
      items.push({
        id: `need-confirm-${d.id}`,
        title: "Confirm funds received",
        detail: `${formatAmount(d.amount, d.currency)} from ${donor} via ${orgName}`,
        when: formatStamp(d.timestamp),
        at: d.timestamp,
        tone: "pending",
        page: "donations",
        donationId: d.id,
      });
    }
    if (d.status === "received" && !d.proof) {
      items.push({
        id: `need-proof-${d.id}`,
        title: "Upload proof of use",
        detail: `${formatAmount(d.amount, d.currency)} from ${donor} is waiting on deliverables`,
        when: formatStamp(d.timestamp),
        at: d.timestamp,
        tone: "pending",
        page: "upload",
        donationId: d.id,
      });
    }
    if (d.proof) {
      items.push({
        id: `my-proof-${d.id}`,
        title:
          d.status === "flagged"
            ? "Proof flagged for review"
            : "Proof of use on record",
        detail: d.proof.description.slice(0, 100),
        when: formatStamp(d.proof.submittedAt),
        at: d.proof.submittedAt,
        tone: d.status === "flagged" ? "flagged" : "verified",
        page: "proofs",
        donationId: d.id,
      });
    }
    if (d.publication) {
      items.push({
        id: `my-pub-${d.id}`,
        title: `${orgName} published about your gift`,
        detail: linkHost(d.publication.url),
        when: formatStamp(d.publication.submittedAt),
        at: d.publication.submittedAt,
        tone: "neutral",
        page: "proofs",
        donationId: d.id,
      });
    }
  }

  return sortNewest(items);
}

function buildOrganisationNotifications(
  rows: Donation[],
  getRecipient: (id: string) => Recipient | undefined,
  invites: RecipientInvite[] = [],
): DashboardNotification[] {
  const items: DashboardNotification[] = [];

  for (const d of rows) {
    const who = recipientPublicLabel(getRecipient(d.recipientId));
    const donor = d.isPublic ? d.donorName : "Anonymous";

    if (d.status === "pending") {
      items.push({
        id: `in-flight-${d.id}`,
        title: "Gift in transit",
        detail: `${formatAmount(d.amount, d.currency)} from ${donor} to ${who}`,
        when: formatStamp(d.timestamp),
        at: d.timestamp,
        tone: "pending",
        page: "money",
        donationId: d.id,
      });
    }
    if (d.proof && !d.publication) {
      items.push({
        id: `need-pub-${d.id}`,
        title: "File publication proof",
        detail: `${who} submitted proof. Donors still need your publication link`,
        when: formatStamp(d.proof.submittedAt),
        at: d.proof.submittedAt,
        tone: "pending",
        page: "publications",
        donationId: d.id,
      });
    }
    if (d.proof) {
      items.push({
        id: `org-proof-${d.id}`,
        title:
          d.status === "flagged"
            ? `Flagged submission from ${who}`
            : `${who} submitted proof of use`,
        detail: `${formatAmount(d.amount, d.currency)} · ${d.proof.description.slice(0, 80)}${d.proof.description.length > 80 ? "…" : ""}`,
        when: formatStamp(d.proof.submittedAt),
        at: d.proof.submittedAt,
        tone: d.status === "flagged" ? "flagged" : "verified",
        page: "submissions",
        donationId: d.id,
      });
    }
    if (d.publication) {
      items.push({
        id: `org-pub-${d.id}`,
        title: "Publication on file",
        detail: `${linkHost(d.publication.url)} · ${who}`,
        when: formatStamp(d.publication.submittedAt),
        at: d.publication.submittedAt,
        tone: "neutral",
        page: "publications",
        donationId: d.id,
      });
    }
  }

  for (const invite of invites.filter((i) => !i.usedByAccountId)) {
    items.push({
      id: `invite-${invite.code}`,
      title: "Open invite waiting",
      detail: `${invite.projectLabel}${invite.amount != null ? ` · ${invite.amount} USDC` : ""} · code ${invite.code}`,
      when: formatStamp(invite.createdAt),
      at: invite.createdAt,
      tone: "neutral",
      page: "invites",
    });
  }

  return sortNewest(items);
}

export function buildDashboardNotifications(
  args: BuildArgs,
): DashboardNotification[] {
  const {
    role,
    donations,
    donorName,
    recipientId,
    orgId,
    getOrg,
    getRecipient,
    invites = [],
  } = args;

  if (role === "donor") {
    const mine = donations.filter((d) => d.donorName === donorName);
    return buildDonorNotifications(mine, getOrg, getRecipient);
  }

  if (role === "recipient") {
    const mine = donations.filter((d) => d.recipientId === recipientId);
    return buildRecipientNotifications(mine, getOrg);
  }

  const rows = donations.filter((d) => d.orgId === orgId);
  const orgInvites = invites.filter((i) => i.orgId === orgId);
  return buildOrganisationNotifications(rows, getRecipient, orgInvites);
}

const READ_PREFIX = "oi-notif-read:";

function readKey(accountId: string) {
  return `${READ_PREFIX}${accountId}`;
}

export function loadReadNotificationIds(accountId: string): Set<string> {
  if (typeof window === "undefined" || !accountId) return new Set();
  try {
    const raw = window.localStorage.getItem(readKey(accountId));
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((x): x is string => typeof x === "string"));
  } catch {
    return new Set();
  }
}

export function saveReadNotificationIds(accountId: string, ids: Set<string>) {
  if (typeof window === "undefined" || !accountId) return;
  try {
    window.localStorage.setItem(
      readKey(accountId),
      JSON.stringify([...ids]),
    );
  } catch {
    /* ignore quota / private mode */
  }
}

export function unreadNotifications(
  items: DashboardNotification[],
  readIds: Set<string>,
) {
  return items.filter((n) => !readIds.has(n.id));
}
