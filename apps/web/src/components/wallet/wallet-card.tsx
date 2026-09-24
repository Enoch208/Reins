import { appRoutes } from "@/lib/routes";
import { useWallet } from "@/lib/wallet-context";
import { Panel } from "@/components/overview/panel";
import { ExplorerLink } from "./explorer-link";
import { WalletFacts } from "./wallet-facts";
import { walletStatusExplanations, walletStatusSpec } from "./wallet-status";

export function WalletCard() {
  const wallet = useWallet();
  const spec = walletStatusSpec(wallet);
  const view = wallet.data;

  return (
    <Panel
      title="Payer wallet"
      description="The OKX Agentic Wallet Reins pays from."
      link={{ href: appRoutes.wallet, label: "Details" }}
    >
      {view ? (
        <div className="flex flex-col gap-4">
          <WalletFacts wallet={view} spec={spec} />
          {view.status !== "READY" && (
            <p className="text-sm text-ink-soft">{walletStatusExplanations[view.status]}</p>
          )}
          {view.explorerUrl && (
            <ExplorerLink href={view.explorerUrl} networkName={view.networkName} />
          )}
        </div>
      ) : wallet.error ? (
        <div className="rounded-[14px] border border-dashed border-line px-4 py-4 text-sm text-muted">
          <p className="font-medium text-ink">Wallet status unavailable</p>
          <p className="mt-1">{wallet.error.message}</p>
        </div>
      ) : (
        <p className="text-sm text-muted">Checking the wallet…</p>
      )}
    </Panel>
  );
}
