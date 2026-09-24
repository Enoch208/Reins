import { HugeiconsIcon } from "@hugeicons/react";
import { Link } from "react-router";
import { cx } from "@/lib/cx";
import { middleTruncate } from "@/lib/labels";
import { appRoutes } from "@/lib/routes";
import { useWallet } from "@/lib/wallet-context";
import { walletStatusSpec } from "./wallet-status";

export function WalletChip({ className }: { className?: string }) {
  const wallet = useWallet();
  const spec = walletStatusSpec(wallet);
  const address = wallet.data?.address ?? null;

  return (
    <Link
      to={appRoutes.wallet}
      aria-label={`Payer wallet: ${spec.label}${address ? `, ${address}` : ""}. Open wallet.`}
      className={cx(
        "inline-flex h-10 items-center gap-2.5 rounded-[12px] border border-line bg-white/70 px-3 text-sm transition-colors hover:bg-white",
        className,
      )}
    >
      <span className={cx("size-2 shrink-0 rounded-full", spec.dot)} aria-hidden />
      <HugeiconsIcon
        icon={spec.icon}
        size={15}
        strokeWidth={1.9}
        className="text-muted"
        aria-hidden
      />
      <span className="font-medium text-ink">{spec.label}</span>
      {address && (
        <span className="font-mono text-[13px] text-caption tabular-nums">
          {middleTruncate(address, 4)}
        </span>
      )}
    </Link>
  );
}
