import { Coins01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { WalletView } from "@reins/core";
import { microsOf } from "@/lib/money";

export function FundPanel({ wallet }: { wallet: WalletView }) {
  return (
    <section aria-labelledby="fund-heading" className="glass rounded-[24px] p-6">
      <div className="flex items-center gap-3">
        <span className="glass-tile flex size-10 items-center justify-center rounded-[12px] text-ink">
          <HugeiconsIcon icon={Coins01Icon} size={20} strokeWidth={1.7} aria-hidden />
        </span>
        <h2 id="fund-heading" className="text-[17px] font-medium">
          Fund this wallet
        </h2>
      </div>
      {wallet.address === null ? (
        <p className="mt-4 text-sm leading-relaxed text-muted">
          The wallet address appears here once the wallet is logged in on the Reins API host. Fund
          it after that.
        </p>
      ) : (
        <ol className="mt-4 flex list-decimal flex-col gap-2 pl-5 text-sm leading-relaxed text-ink-soft">
          <li>
            Send {wallet.asset} on {wallet.networkName} (
            <span className="font-mono">{wallet.network}</span>) to the payer wallet address.
          </li>
          <li>About 10 {wallet.asset} covers roughly ten demo runs.</li>
        </ol>
      )}
      {wallet.balance !== null && microsOf(wallet.balance) === 0 && (
        <p className="mt-4 rounded-[14px] border border-unresolved/40 bg-unresolved-tint px-4 py-3 text-sm text-unresolved-ink">
          The balance is zero, so Reins can authorize spending but no payment can go through yet.
        </p>
      )}
    </section>
  );
}
