import { Wallet01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Link } from "react-router";
import { walletStatusSpec } from "@/components/wallet/wallet-status";
import { cx } from "@/lib/cx";
import { middleTruncate } from "@/lib/labels";
import { formatAmount } from "@/lib/money";
import { appRoutes } from "@/lib/routes";
import { useWallet } from "@/lib/wallet-context";

export function SidebarWallet() {
  const wallet = useWallet();
  const spec = walletStatusSpec(wallet);
  const view = wallet.data;
  const detail = view?.balance
    ? `${formatAmount(view.balance)} ${view.asset}`
    : view?.address
      ? middleTruncate(view.address, 5)
      : null;

  return (
    <Link
      to={appRoutes.wallet}
      aria-label={`Payer wallet: ${spec.label}. Open wallet.`}
      className="flex items-center gap-3 rounded-[16px] border border-line/80 bg-white/55 px-3.5 py-3 transition-colors hover:bg-white/85"
    >
      <span className="relative flex size-9 shrink-0 items-center justify-center rounded-[11px] bg-white/80 text-ink">
        <HugeiconsIcon icon={Wallet01Icon} size={18} strokeWidth={1.8} aria-hidden />
        <span
          className={cx(
            "absolute -top-0.5 -right-0.5 size-2.5 rounded-full ring-2 ring-white",
            spec.dot,
          )}
          aria-hidden
        />
      </span>
      <span className="min-w-0">
        <span className="block text-xs text-caption">Payer wallet</span>
        <span className="block text-[13px] font-medium text-ink">{spec.label}</span>
        {detail && (
          <span className="block truncate font-mono text-xs text-caption tabular-nums">
            {detail}
          </span>
        )}
      </span>
    </Link>
  );
}
