import { HugeiconsIcon } from "@hugeicons/react";
import { Link, useLocation } from "react-router";
import { walletStatusSpec } from "@/components/wallet/wallet-status";
import { cx } from "@/lib/cx";
import { appRoutes } from "@/lib/routes";
import { useWallet } from "@/lib/wallet-context";
import { consoleNav } from "./console-nav";

export function MobileNav() {
  const { pathname } = useLocation();
  const walletDot = walletStatusSpec(useWallet()).dot;

  return (
    <nav aria-label="Console" className="border-t border-line/70">
      <ul className="flex gap-0.5 overflow-x-auto px-2 py-2 [scrollbar-width:none]">
        {consoleNav.map((item) => {
          const active = item.match(pathname);
          return (
            <li key={item.href} className="flex-1 shrink-0">
              <Link
                to={item.href}
                aria-current={active ? "page" : undefined}
                className={cx(
                  "flex items-center justify-center gap-1.5 rounded-[10px] px-2 py-2 text-[13px] whitespace-nowrap transition-colors",
                  active ? "bg-accent/9 font-medium text-accent-ink" : "text-muted hover:text-ink",
                )}
              >
                <HugeiconsIcon icon={item.icon} size={15} strokeWidth={1.8} aria-hidden />
                {item.label}
                {item.href === appRoutes.wallet && (
                  <span className={cx("size-2 rounded-full", walletDot)} aria-hidden />
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
