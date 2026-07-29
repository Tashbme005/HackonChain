import { Globe, Lock, BadgeCheck, Shield } from "lucide-react";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";

import { formatStamp, useLedger } from "@/lib/openimpact/store";
import { shortAddress } from "@/lib/openimpact/web3";
import { cn } from "@/lib/utils";

function Field({
  label,
  value,
  hint,
  mono,
}: {
  label: string;
  value: string;
  hint?: string;
  mono?: boolean;
}) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <p className={cn("mt-1 text-sm text-ink", mono && "data-mono")}>{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function ProfileCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <section className="border border-border bg-card px-5 py-6 sm:px-6">
      <h2 className="font-display text-xl text-ink">{title}</h2>
      {subtitle && (
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      )}
      <div className="mt-5 space-y-5">{children}</div>
    </section>
  );
}

export function DonorProfileView() {
  const {
    account,
    donorProfile,
    donorIsPublic,
    setDonorIsPublic,
    walletAddress,
    updateAccountProfile,
  } = useLedger();
  const [name, setName] = useState(donorProfile.name);
  const [location, setLocation] = useState(donorProfile.location);
  const [editing, setEditing] = useState(false);

  function save() {
    updateAccountProfile({ name, location });
    setEditing(false);
    toast.success("Profile saved");
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <p className="text-sm text-muted-foreground">
        Your donor seat: identity on receipts, wallet link, and account details.
      </p>

      <ProfileCard title="Identity" subtitle="How you appear when you give">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Display name" value={donorProfile.name} />
          <Field
            label="Email"
            value={account?.email ?? "—"}
            mono
            hint={account?.isDemo ? "Demo account" : undefined}
          />
          <Field label="Location" value={donorProfile.location} />
          <Field
            label="Member since"
            value={formatStamp(donorProfile.memberSince).slice(0, 10)}
            mono
          />
        </div>

        <div className="border border-border p-4">
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
            Receipt visibility
          </p>
          <div
            role="group"
            aria-label="Public or anonymous identity"
            className="mt-3 flex flex-wrap items-center rounded-full border border-input p-0.5"
          >
            <button
              type="button"
              aria-pressed={donorIsPublic}
              onClick={() => setDonorIsPublic(true)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors",
                donorIsPublic
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground",
              )}
            >
              <Globe className="size-3.5" aria-hidden />
              Show my name
            </button>
            <button
              type="button"
              aria-pressed={!donorIsPublic}
              onClick={() => setDonorIsPublic(false)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors",
                !donorIsPublic
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground",
              )}
            >
              <Lock className="size-3.5" aria-hidden />
              Anonymous
            </button>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Applies to new donations. Past receipts keep whatever you chose at
            the time.
          </p>
        </div>

        {editing ? (
          <div className="space-y-3 border-t border-border pt-5">
            <label className="block">
              <span className="text-[11px] uppercase tracking-widest text-muted-foreground">
                Name
              </span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1.5 w-full border border-input bg-background px-3 py-2.5 text-sm"
              />
            </label>
            <label className="block">
              <span className="text-[11px] uppercase tracking-widest text-muted-foreground">
                Location
              </span>
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="mt-1.5 w-full border border-input bg-background px-3 py-2.5 text-sm"
              />
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={save}
                className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => {
                  setName(donorProfile.name);
                  setLocation(donorProfile.location);
                  setEditing(false);
                }}
                className="rounded-full border border-border px-4 py-2 text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-sm font-medium text-verified underline-offset-4 hover:underline"
          >
            Edit name and location
          </button>
        )}
      </ProfileCard>

      <ProfileCard title="Wallets" subtitle="Profile wallet vs session wallet">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="Profile wallet"
            value={shortAddress(donorProfile.walletAddress)}
            mono
            hint="Tied to your account record"
          />
          <Field
            label="Session wallet"
            value={
              walletAddress ? shortAddress(walletAddress) : "Not connected"
            }
            mono
            hint="Use Connect wallet in the top bar"
          />
        </div>
      </ProfileCard>
    </div>
  );
}

export function RecipientProfileView() {
  const {
    account,
    currentRecipientId,
    getRecipient,
    getOrg,
    updateRecipientStory,
    updateAccountProfile,
    walletAddress,
  } = useLedger();
  const me = getRecipient(currentRecipientId);
  const org = getOrg(me?.orgId);
  const [story, setStory] = useState(me?.story ?? "");
  const [name, setName] = useState(account?.name ?? me?.name ?? "");
  const [editing, setEditing] = useState(false);

  if (!me) return null;

  function save() {
    updateAccountProfile({ name });
    updateRecipientStory(me!.id, story);
    setEditing(false);
    toast.success("Profile saved");
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <p className="text-sm text-muted-foreground">
        Your private identity stays here. Organisations only see your pseudonym
        and wallet.
      </p>

      <ProfileCard
        title="Private identity"
        subtitle="Visible only to you on this dashboard"
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Legal name" value={me.name} />
          <Field
            label="Email"
            value={account?.email ?? "—"}
            mono
            hint={account?.isDemo ? "Demo account" : undefined}
          />
          <Field
            label="Member since"
            value={formatStamp(account?.createdAt ?? "").slice(0, 10) || "—"}
            mono
          />
          {org ? (
            <Field label="Organisation" value={org.name} />
          ) : (
            <Field
              label="Organisation"
              value="Not linked yet"
              hint="Finish setup from Overview"
            />
          )}
        </div>
      </ProfileCard>

      <ProfileCard
        title="Public facing"
        subtitle="What donors and organisations can see"
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="Pseudonym"
            value={me.pseudonym}
            mono
            hint="Never your legal name"
          />
          <Field
            label="Wallet"
            value={shortAddress(me.walletAddress)}
            mono
          />
          <Field
            label="Reputation"
            value={`${me.reputationScore}%`}
          />
          <Field
            label="Session wallet"
            value={
              walletAddress ? shortAddress(walletAddress) : "Not connected"
            }
            mono
          />
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
            Your story
          </p>
          <p className="mt-1 text-sm leading-relaxed text-ink">{me.story}</p>
        </div>
      </ProfileCard>

      <ProfileCard title="Edit profile">
        {editing ? (
          <div className="space-y-3">
            <label className="block">
              <span className="text-[11px] uppercase tracking-widest text-muted-foreground">
                Legal name (private)
              </span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1.5 w-full border border-input bg-background px-3 py-2.5 text-sm"
              />
            </label>
            <label className="block">
              <span className="text-[11px] uppercase tracking-widest text-muted-foreground">
                Story shown on your seat
              </span>
              <textarea
                rows={3}
                value={story}
                onChange={(e) => setStory(e.target.value)}
                className="mt-1.5 w-full border border-input bg-background px-3 py-2.5 text-sm"
              />
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={save}
                className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => {
                  setName(account?.name ?? me.name);
                  setStory(me.story);
                  setEditing(false);
                }}
                className="rounded-full border border-border px-4 py-2 text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-sm font-medium text-verified underline-offset-4 hover:underline"
          >
            Edit name and story
          </button>
        )}
      </ProfileCard>
    </div>
  );
}

export function OrganisationProfileView() {
  const {
    account,
    currentOrgId,
    getOrg,
    orgTrustScore,
    orgProofRate,
    orgPublicationRate,
    updateOrganisationProfile,
    walletAddress,
  } = useLedger();
  const org = getOrg(currentOrgId);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(org?.name ?? "");
  const [tagline, setTagline] = useState(org?.tagline ?? "");
  const [description, setDescription] = useState(org?.description ?? "");

  if (!org) return null;

  const score = orgTrustScore(org.id);

  function save() {
    updateOrganisationProfile(org!.id, { name, tagline, description });
    setEditing(false);
    toast.success("Organisation profile saved");
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <p className="text-sm text-muted-foreground">
        Public organisation record donors see when they choose a cause.
      </p>

      <ProfileCard title="Organisation">
        <div className="flex flex-wrap items-start gap-4">
          {org.imageUrl && (
            <img
              src={org.imageUrl}
              alt=""
              className="size-20 border border-border object-cover"
            />
          )}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-display text-2xl text-ink">{org.name}</p>
              <BadgeCheck className="size-5 text-verified" aria-hidden />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{org.tagline}</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
              Trust score
            </p>
            <p className="data-mono text-3xl text-verified">{score}%</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {orgProofRate(org.id)}% proof · {orgPublicationRate(org.id)}%
              published
            </p>
          </div>
        </div>
        <p className="text-sm leading-relaxed text-ink">{org.description}</p>
      </ProfileCard>

      <ProfileCard title="Account and wallet">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="Login email"
            value={account?.email ?? "—"}
            mono
            hint={account?.isDemo ? "Demo account" : undefined}
          />
          <Field
            label="Member since"
            value={formatStamp(account?.createdAt ?? "").slice(0, 10) || "—"}
            mono
          />
          <Field
            label="Organisation wallet"
            value={shortAddress(org.walletAddress)}
            mono
          />
          <Field
            label="Session wallet"
            value={
              walletAddress ? shortAddress(walletAddress) : "Not connected"
            }
            mono
          />
          <Field
            label="Linked recipients"
            value={String(org.recipientIds.length)}
          />
          <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <Shield className="size-4 text-verified" aria-hidden />
            Reputation computed server side
          </div>
        </div>
      </ProfileCard>

      <ProfileCard title="Edit public profile">
        {editing ? (
          <div className="space-y-3">
            <label className="block">
              <span className="text-[11px] uppercase tracking-widest text-muted-foreground">
                Name
              </span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1.5 w-full border border-input bg-background px-3 py-2.5 text-sm"
              />
            </label>
            <label className="block">
              <span className="text-[11px] uppercase tracking-widest text-muted-foreground">
                Tagline
              </span>
              <input
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className="mt-1.5 w-full border border-input bg-background px-3 py-2.5 text-sm"
              />
            </label>
            <label className="block">
              <span className="text-[11px] uppercase tracking-widest text-muted-foreground">
                Description
              </span>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1.5 w-full border border-input bg-background px-3 py-2.5 text-sm"
              />
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={save}
                className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => {
                  setName(org.name);
                  setTagline(org.tagline);
                  setDescription(org.description);
                  setEditing(false);
                }}
                className="rounded-full border border-border px-4 py-2 text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-sm font-medium text-verified underline-offset-4 hover:underline"
          >
            Edit name, tagline, and description
          </button>
        )}
      </ProfileCard>
    </div>
  );
}
