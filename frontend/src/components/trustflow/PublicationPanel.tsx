import { ExternalLink, Megaphone, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { formatAmount, formatStamp, useLedger } from "@/lib/trustflow/store";
import {
  PUBLICATION_STATUS_LABEL,
  PUBLICATION_TYPE_LABEL,
  isFullyAccounted,
  linkHost,
  publicationStatus,
  recipientPublicLabel,
} from "@/lib/trustflow/types";
import type { PublicationType } from "@/lib/trustflow/types";

const TYPES = Object.keys(PUBLICATION_TYPE_LABEL) as PublicationType[];

/**
 * The organisation's own mandatory accountability leg: proof that the impact
 * of each donation was publicised somewhere the public can independently check.
 */
export function PublicationPanel({ orgId }: { orgId: string }) {
  const {
    donations,
    getRecipient,
    getOrg,
    attachPublicationProof,
    removePublicationProof,
    orgPublicationRate,
    orgAccountedRate,
  } = useLedger();

  const rows = donations.filter((d) => d.orgId === orgId);
  const org = getOrg(orgId);
  const [openFor, setOpenFor] = useState<string | null>(null);

  const pending = rows.filter((d) => !d.publication).length;

  return (
    <section className="mt-12">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div className="flex items-center gap-2">
          <Megaphone className="size-5 text-pending" aria-hidden />
          <h2 className="text-2xl">Publication proof</h2>
          <span className="rounded-full bg-flagged-soft px-2.5 py-1 text-[11px] font-medium uppercase tracking-widest text-flagged">
            Required
          </span>
        </div>
        <span className="data-mono text-xs uppercase tracking-widest text-muted-foreground">
          {orgPublicationRate(orgId)}% published · {orgAccountedRate(orgId)}% fully accounted
        </span>
      </div>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        For every donation you receive, you must show where its impact was publicised — a news
        article, a social post, a blog entry, or a photo of a printed publication. A donation is
        only <strong className="font-medium text-foreground">fully accounted for</strong> once the
        recipient's proof of use and your publication proof are both filed.
        {pending > 0 && (
          <>
            {" "}
            <span className="text-flagged">
              {pending} donation{pending === 1 ? "" : "s"} still pending publication.
            </span>
          </>
        )}
      </p>

      <div className="mt-4 overflow-x-auto border border-border bg-card">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-[11px] uppercase tracking-widest text-muted-foreground">
              <th className="px-4 py-3 font-medium">Donation</th>
              <th className="px-4 py-3 font-medium">Publication status</th>
              <th className="px-4 py-3 font-medium">Where it was shared</th>
              <th className="px-4 py-3 font-medium">Accounted</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  No donations to publicise yet.
                </td>
              </tr>
            )}
            {rows.map((d) => {
              const status = publicationStatus(d);
              const pub = d.publication;
              const accounted = isFullyAccounted(d);
              return (
                <tr key={d.id} className="border-b border-border align-top last:border-0">
                  <td className="px-4 py-3">
                    <span className="data-mono text-xs text-muted-foreground">{d.id}</span>
                    <span className="block whitespace-nowrap">
                      {formatAmount(d.amount, d.currency)}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {recipientPublicLabel(getRecipient(d.recipientId), "Recipient")}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-medium ${
                        status === "published"
                          ? "bg-verified-soft text-verified"
                          : "bg-pending-soft text-pending-foreground"
                      }`}
                    >
                      {PUBLICATION_STATUS_LABEL[status]}
                    </span>
                    {pub && (
                      <span className="data-mono mt-1.5 block text-[11px] text-muted-foreground">
                        {formatStamp(pub.submittedAt).slice(0, 10)}
                      </span>
                    )}
                  </td>
                  <td className="max-w-[280px] px-4 py-3">
                    {pub ? (
                      <>
                        <span className="data-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                          {PUBLICATION_TYPE_LABEL[pub.type]}
                        </span>
                        <a
                          href={pub.url}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="mt-0.5 flex items-center gap-1 text-sm underline-offset-4 hover:underline"
                        >
                          <span className="truncate">{linkHost(pub.url)}</span>
                          <ExternalLink className="size-3 shrink-0" aria-hidden />
                        </a>
                        {pub.caption && (
                          <span className="mt-0.5 block text-xs text-muted-foreground">
                            {pub.caption}
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-muted-foreground">Not filed</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`whitespace-nowrap text-xs ${accounted ? "text-verified" : "text-muted-foreground"}`}
                    >
                      {accounted
                        ? "Fully accounted ✓"
                        : d.proof
                          ? "Awaiting publication"
                          : "Awaiting proof of use"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setOpenFor(openFor === d.id ? null : d.id)}
                        className="whitespace-nowrap text-xs font-medium underline-offset-4 hover:underline"
                      >
                        {pub ? "Replace" : "Add proof"}
                      </button>
                      {pub && (
                        <button
                          type="button"
                          aria-label="Remove publication proof"
                          onClick={() => {
                            removePublicationProof(d.id);
                            toast("Publication proof removed — this donation is pending again.");
                          }}
                          className="text-muted-foreground transition-colors hover:text-flagged"
                        >
                          <Trash2 className="size-4" aria-hidden />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {openFor && (
        <PublicationForm
          key={openFor}
          onCancel={() => setOpenFor(null)}
          onSubmit={(draft) => {
            attachPublicationProof(openFor, { ...draft, submittedBy: org?.name });
            setOpenFor(null);
            toast.success("Publication proof filed — this donation now shows as Published.");
          }}
          donationId={openFor}
        />
      )}
    </section>
  );
}

function PublicationForm({
  donationId,
  onSubmit,
  onCancel,
}: {
  donationId: string;
  onSubmit: (draft: { url: string; type: PublicationType; caption?: string }) => void;
  onCancel: () => void;
}) {
  const [url, setUrl] = useState("");
  const [type, setType] = useState<PublicationType>("social");
  const [caption, setCaption] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const clean = url.trim();
        if (!/^https?:\/\/\S+\.\S+/.test(clean)) {
          toast.error("Add a full public link, starting with https://");
          return;
        }
        onSubmit({ url: clean, type, caption: caption.trim() || undefined });
      }}
      className="mt-4 border border-border bg-card p-5"
    >
      <p className="data-mono text-[11px] uppercase tracking-widest text-muted-foreground">
        Publication proof · {donationId}
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-[1.4fr_0.8fr]">
        <label className="block">
          <span className="data-mono text-[11px] uppercase tracking-widest text-muted-foreground">
            Public link (required)
          </span>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.org/story-about-this-donation"
            className="mt-1.5 w-full border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-ring"
          />
        </label>
        <label className="block">
          <span className="data-mono text-[11px] uppercase tracking-widest text-muted-foreground">
            Type
          </span>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as PublicationType)}
            className="mt-1.5 w-full border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-ring"
          >
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {PUBLICATION_TYPE_LABEL[t]}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="mt-4 block">
        <span className="data-mono text-[11px] uppercase tracking-widest text-muted-foreground">
          Short caption (optional)
        </span>
        <input
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Where it ran and what it showed"
          className="mt-1.5 w-full border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-ring"
        />
      </label>
      <p className="mt-3 text-xs text-muted-foreground">
        For a printed publication, upload a photo of the page and paste its link here. This entry
        appears on your public cause page for anyone to check.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="submit"
          className="rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          File publication proof
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-2 py-2.5 text-sm font-medium underline-offset-4 hover:underline"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
