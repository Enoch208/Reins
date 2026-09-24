import { SecurityLockIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { PageHeading } from "@/components/chrome/page-heading";
import { ErrorPanel } from "@/components/feedback/error-panel";
import { LoadingPanel } from "@/components/feedback/loading-panel";
import { ExplorerLink } from "@/components/wallet/explorer-link";
import { FundPanel } from "@/components/wallet/fund-panel";
import { WalletFacts } from "@/components/wallet/wallet-facts";
import { walletStatusExplanations, walletStatusSpec } from "@/components/wallet/wallet-status";
import { useDocumentTitle } from "@/lib/use-document-title";
import { useWallet } from "@/lib/wallet-context";

function CustodyNote() {
  return (
    <p className="mb-6 flex items-start gap-2.5 text-sm text-muted">
      <HugeiconsIcon
        icon={SecurityLockIcon}
        size={17}
        strokeWidth={1.8}
        className="mt-px shrink-0 text-ink"
        aria-hidden
      />
      Keys are held by OKX inside a trusted execution environment. Reins never holds a private key;
      it only asks the wallet to pay for purchases it has already authorized.
    </p>
  );
}

export function WalletPage() {
  useDocumentTitle("Wallet");
  const wallet = useWallet();
  const view = wallet.data;
  const spec = walletStatusSpec(wallet);

  return (
    <>
      <PageHeading
        title="The wallet Reins"
        accent="pays from"
        description="Approved purchases are paid from this OKX Agentic Wallet and settle on X Layer."
      />
      <CustodyNote />
      {view === null && wallet.error && (
        <>
          <ErrorPanel
            title="Wallet status is unavailable"
            error={wallet.error}
            onRetry={wallet.reload}
          />
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted">
            The Reins API did not report a payer wallet, so this page cannot show an address or a
            balance. Spend authorization still works; paying for an approved purchase needs the
            wallet to report as ready here.
          </p>
        </>
      )}
      {view === null && !wallet.error && <LoadingPanel label="Checking the wallet" />}
      {view && (
        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
          <section aria-labelledby="wallet-heading" className="glass rounded-[24px] p-6 sm:p-8">
            <h2 id="wallet-heading" className="mb-6 text-[17px] font-medium">
              Payer wallet
            </h2>
            <WalletFacts wallet={view} spec={spec} fullAddress />
            <p className="mt-6 border-t border-line/70 pt-4 text-sm leading-relaxed text-ink-soft">
              {walletStatusExplanations[view.status]}
            </p>
            {view.explorerUrl && (
              <div className="mt-4">
                <ExplorerLink href={view.explorerUrl} networkName={view.networkName} />
              </div>
            )}
          </section>
          <FundPanel wallet={view} />
        </div>
      )}
    </>
  );
}
