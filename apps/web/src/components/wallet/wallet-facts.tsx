import type { ReactNode } from "react";
import type { WalletView } from "@reins/core";
import { HashValue } from "@/components/evidence/hash-value";
import { StatusChip } from "@/components/status/status-chip";
import { formatAmount } from "@/lib/money";
import type { WalletStatusSpec } from "./wallet-status";

function Fact({ term, children }: { term: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <dt className="text-[11px] font-semibold tracking-[0.14em] text-caption uppercase">{term}</dt>
      <dd className="min-w-0 text-[15px] text-ink">{children}</dd>
    </div>
  );
}

export function WalletFacts({
  wallet,
  spec,
  fullAddress = false,
}: {
  wallet: WalletView;
  spec: WalletStatusSpec;
  fullAddress?: boolean;
}) {
  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-5">
      <Fact term="Status">
        <StatusChip tone={spec.tone} icon={spec.icon} label={spec.label} size="sm" />
      </Fact>
      <Fact term="Balance">
        {wallet.balance === null ? (
          <span className="text-muted">Not readable</span>
        ) : (
          <span className="font-mono tabular-nums">
            {formatAmount(wallet.balance)}{" "}
            <span className="font-sans text-sm text-muted">{wallet.asset}</span>
          </span>
        )}
      </Fact>
      <Fact term="Network">
        {wallet.networkName}
        <span className="ml-1.5 font-mono text-xs text-caption">{wallet.network}</span>
      </Fact>
      <Fact term="Asset">{wallet.asset}</Fact>
      <div className="col-span-2">
        <Fact term="Address">
          {wallet.address === null ? (
            <span className="text-muted">No address until the wallet is logged in</span>
          ) : (
            <HashValue value={wallet.address} label="wallet address" full={fullAddress} />
          )}
        </Fact>
      </div>
    </dl>
  );
}
