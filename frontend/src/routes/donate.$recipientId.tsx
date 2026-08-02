import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { Breadcrumbs } from "@/components/openimpact/Breadcrumbs";
import { StampBadge } from "@/components/openimpact/StampBadge";
import { ReceiptShell } from "@/components/openimpact/ReceiptCard";
import { formatAmount, formatStamp, useLedger } from "@/lib/openimpact/store";
import {
  connectWallet,
  createDonationOnChain,
  isContractConfigured,
  mockTxHash,
  rememberOnChainDonationId,
  shortAddress,
} from "@/lib/openimpact/web3";
import { recipientPublicLabel } from "@/lib/openimpact/types";
import type { Donation } from "@/lib/openimpact/types";
import { checkUSDCBalance, mintTestUSDC } from "@/lib/openimpact/services/token";

export const Route = createFileRoute("/donate/$recipientId")({
  head: () => ({
    meta: [
      { title: "OpenImpact" },
      {
        name: "description",
        content:
          "Connect a wallet, choose an amount, and send a donation that comes back to you as a tracked receipt with proof of use.",
      },
      { property: "og:title", content: "OpenImpact" },
      {
        property: "og:description",
        content: "Choose an amount, give publicly or anonymously, and follow the money after it lands.",
      },
    ],
  }),
  component: DonateFlow,
});

const PRESETS = [25, 60, 120, 250];

function DonateFlow() {
  const { recipientId } = Route.useParams();
  const navigate = useNavigate();
  const { getRecipient, getOrg, walletAddress, setWalletAddress, addDonation, currentDonorName } =
    useLedger();

  const recipient = getRecipient(recipientId);
  const org = getOrg(recipient?.orgId);

  const [step, setStep] = useState<"amount" | "confirm" | "done">("amount");
  const [amount, setAmount] = useState(60);
  const [isPublic, setIsPublic] = useState(true);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [minting, setMinting] = useState(false);
  const [usdcBalance, setUsdcBalance] = useState<string | null>(null);
  const [created, setCreated] = useState<Donation | null>(null);
  const assetLabel = "mUSDC";

  useEffect(() => {
    if (walletAddress) {
      checkUSDCBalance(walletAddress).then(setUsdcBalance);
    }
  }, [walletAddress]);

  if (!recipient) {
    return (
      <Empty>
        We couldn't find that recipient. <Link to="/" className="underline">Back to causes</Link>.
      </Empty>
    );
  }

  async function onConnect() {
    setBusy(true);
    try {
      const conn = await connectWallet();
      setWalletAddress(conn.address);
      const bal = await checkUSDCBalance(conn.address);
      setUsdcBalance(bal);
    } catch (err) {
      console.error(err);
    } finally {
      setBusy(false);
    }
  }

  async function onMintFaucet() {
    setMinting(true);
    try {
      await mintTestUSDC(walletAddress || undefined, 1000);
      if (walletAddress) {
        const bal = await checkUSDCBalance(walletAddress);
        setUsdcBalance(bal);
      }
      window.alert("Successfully minted 1,000 mUSDC to your wallet!");
    } catch (err) {
      console.error(err);
      window.alert(err instanceof Error ? err.message : "Faucet minting failed.");
    } finally {
      setMinting(false);
    }
  }

  async function onSend() {
    setBusy(true);
    try {
      if (!org?.walletAddress) {
        throw new Error("Organisation wallet is missing.");
      }
      const chain = await createDonationOnChain({
        organisation: org.walletAddress,
        recipient: recipient!.walletAddress,
        amountUsdc: amount,
      });
      const donation: Donation = {
        id: `dn-${crypto.randomUUID().slice(0, 8)}`,
        donorName: isPublic ? currentDonorName : "Anonymous",
        isPublic,
        amount,
        currency: assetLabel,
        recipientId: recipient!.id,
        orgId: recipient!.orgId,
        status: "pending",
        txHash: chain.txHash || mockTxHash(),
        onChainDonationId: chain.onChainDonationId,
        timestamp: new Date().toISOString(),
        note: note.trim() || undefined,
      };
      if (chain.onChainDonationId) {
        rememberOnChainDonationId(donation.id, chain.onChainDonationId);
      }
      const saved = await addDonation(donation);
      setCreated(saved);
      setStep("done");
    } catch (err) {
      console.error(err);
      window.alert(err instanceof Error ? err.message : "Could not save donation.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page-shell-narrow page-top pb-12">
      <Breadcrumbs
        crumbs={[
          { label: "Causes", to: "/" },
          ...(org ? [{ label: org.name, to: `/cause/${org.id}` }] : []),
          { label: `Donate to ${recipientPublicLabel(recipient)}` },
        ]}
        className="mb-6"
      />
      <p className="data-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
        Step {step === "amount" ? "1" : step === "confirm" ? "2" : "3"} of 3
      </p>
      <h1 className="mt-3 text-4xl">Send a donation to {recipientPublicLabel(recipient)}</h1>
      <p className="mt-2 text-muted-foreground">
        {recipient.story} {org ? `Through ${org.name}.` : ""}
      </p>

      {step === "amount" && (
        <div className="mt-8 space-y-8 border border-border bg-card p-6">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-lg">Your wallet</h2>
              {walletAddress && (
                <button
                  type="button"
                  onClick={onMintFaucet}
                  disabled={minting}
                  className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary transition-colors hover:bg-primary/20 disabled:opacity-60"
                >
                  {minting && <span className="size-3 animate-spin rounded-full border-2 border-current border-t-transparent" />}
                  {minting ? "Minting…" : "🚰 Get 1,000 Test mUSDC"}
                </button>
              )}
            </div>

            {walletAddress ? (
              <div className="mt-2 text-sm text-muted-foreground">
                <p>
                  Connected as{" "}
                  <span className="data-mono text-foreground">{shortAddress(walletAddress)}</span>
                </p>
                {usdcBalance !== null && (
                  <p className="mt-1 text-xs">
                    Balance: <span className="data-mono font-medium text-foreground">{usdcBalance} mUSDC</span>
                  </p>
                )}
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={onConnect}
                  disabled={busy}
                  className="mt-3 inline-flex items-center gap-2 rounded-full border border-input px-5 py-2.5 text-sm font-medium transition-colors hover:bg-accent disabled:opacity-60"
                >
                  {busy && <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />}
                  {busy ? "Connecting to your wallet…" : "Connect wallet"}
                </button>
                <p className="mt-2 max-w-md text-xs text-muted-foreground">
                  Connect a wallet (MetaMask/Base Sepolia) to send USDC to the TrustFlow smart contract.
                </p>
              </>
            )}
          </div>

          <div className="dotted-rule pt-6">
            <h2 className="text-lg">How much are you sending?</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setAmount(p)}
                  aria-pressed={amount === p}
                  className={`data-mono rounded-full border px-4 py-2 text-sm transition-colors ${
                    amount === p
                      ? "border-transparent bg-primary text-primary-foreground"
                      : "border-input hover:bg-accent"
                  }`}
                >
                  {p} {assetLabel}
                </button>
              ))}
            </div>
            <label className="mt-4 block text-sm">
              <span className="text-muted-foreground">Or enter another amount</span>
              <input
                type="number"
                min={1}
                value={amount}
                onChange={(e) => setAmount(Math.max(1, Number(e.target.value) || 0))}
                className="data-mono mt-1.5 w-full border border-input bg-background px-3 py-2.5 text-base"
              />
            </label>
          </div>

          <div className="dotted-rule pt-6">
            <h2 className="text-lg">Show your name?</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              <Toggle active={isPublic} onClick={() => setIsPublic(true)}>
                Public — show “{currentDonorName}”
              </Toggle>
              <Toggle active={!isPublic} onClick={() => setIsPublic(false)}>
                Anonymous
              </Toggle>
            </div>
            <label className="mt-4 block text-sm">
              <span className="text-muted-foreground">A short note (optional)</span>
              <input
                type="text"
                value={note}
                maxLength={90}
                placeholder="For the pump repair fund."
                onChange={(e) => setNote(e.target.value)}
                className="mt-1.5 w-full border border-input bg-background px-3 py-2.5 text-base"
              />
            </label>
          </div>

          <button
            type="button"
            disabled={!walletAddress}
            onClick={() => setStep("confirm")}
            className="w-full rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {walletAddress ? "Review donation" : "Connect a wallet to continue"}
          </button>
        </div>
      )}

      {step === "confirm" && (
        <div className="mt-8">
          <ReceiptShell>
            <h2 className="text-2xl font-serif">Check this over</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <Row label="To">{recipientPublicLabel(recipient)}</Row>
              <Row label="Organisation">{org?.name ?? "Direct"}</Row>
              <Row label="Amount">
                <span className="data-mono font-medium">{formatAmount(amount, assetLabel)}</span>
              </Row>
              <Row label="From">{isPublic ? currentDonorName : "Anonymous"}</Row>
              <Row label="Their wallet">
                <span className="data-mono text-xs">{shortAddress(recipient.walletAddress)}</span>
              </Row>
              {note && <Row label="Note">{note}</Row>}
            </dl>

            <div className="mt-4 rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">
              <p className="font-semibold text-foreground">💡 2-Step Smart Contract Execution:</p>
              <ol className="mt-1 list-decimal space-y-0.5 pl-4">
                <li>Approve TrustFlow contract to spend {amount} mUSDC</li>
                <li>Execute <code>createDonation()</code> to hold funds in escrow</li>
              </ol>
            </div>

            <div className="dotted-rule mt-5 pt-5">
              <p className="text-sm text-muted-foreground">
                Once sent, {recipientPublicLabel(recipient)} confirms receipt and uploads proof of what the money
                bought. You'll see both on your receipt.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={onSend}
                  disabled={busy}
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
                >
                  {busy && <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />}
                  {busy ? "Executing approval & escrow…" : `Send ${formatAmount(amount, assetLabel)}`}
                </button>
                <button
                  type="button"
                  onClick={() => setStep("amount")}
                  className="rounded-full border border-input px-6 py-3 text-sm font-medium transition-colors hover:bg-accent"
                >
                  Go back
                </button>
              </div>
            </div>
          </ReceiptShell>
        </div>
      )}

      {step === "done" && created && (
        <div className="mt-8">
          <ReceiptShell>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="data-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                  Receipt {created.id}
                </p>
                <h2 className="mt-1 text-2xl">Donation sent</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Waiting for {recipientPublicLabel(recipient)} to confirm receipt.
                </p>
              </div>
              <StampBadge status="pending" size="lg" animate />
            </div>
            <dl className="mt-5 space-y-2 text-sm">
              <Row label="Amount">
                <span className="data-mono font-medium">
                  {formatAmount(created.amount, created.currency)}
                </span>
              </Row>
              <Row label="Sent">
                <span className="data-mono text-xs">{formatStamp(created.timestamp)}</span>
              </Row>
              <Row label="Tx">
                <span className="data-mono text-xs">{shortAddress(created.txHash)}</span>
              </Row>
            </dl>
            <div className="dotted-rule mt-5 flex flex-wrap gap-3 pt-5">
              <button
                type="button"
                onClick={() => navigate({ to: "/donor" })}
                className="rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
              >
                Track this donation
              </button>
              <Link
                to="/proof/$donationId"
                params={{ donationId: created.id }}
                className="rounded-full border border-input px-6 py-3 text-sm font-medium transition-colors hover:bg-accent"
              >
                Open public receipt
              </Link>
            </div>
          </ReceiptShell>
        </div>
      )}
    </div>
  );
}

function Toggle({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full border px-4 py-2 text-sm transition-colors ${
        active ? "border-transparent bg-primary text-primary-foreground" : "border-input hover:bg-accent"
      }`}
    >
      {children}
    </button>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right">{children}</dd>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div className="page-shell-narrow page-top pb-24 text-center text-muted-foreground">{children}</div>;
}
