import { Add01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Fragment } from "react";
import { Link, useLocation } from "react-router";
import { primaryButton } from "@/components/feedback/button-styles";
import { WalletChip } from "@/components/wallet/wallet-chip";
import { cx } from "@/lib/cx";
import { appRoutes } from "@/lib/routes";
import { breadcrumbsFor } from "./breadcrumbs";

export function AppTopBar() {
  const { pathname } = useLocation();
  const crumbs = breadcrumbsFor(pathname);

  return (
    <div className="mb-10 hidden items-center justify-between gap-6 border-b border-line/70 pb-5 lg:flex">
      <nav aria-label="Breadcrumb" className="min-w-0">
        <ol className="flex items-center gap-2 text-sm">
          <li className="text-caption">Console</li>
          {crumbs.map((crumb, index) => (
            <Fragment key={`${crumb.label}-${String(index)}`}>
              <li aria-hidden className="text-faint">
                <HugeiconsIcon icon={ArrowRight01Icon} size={14} strokeWidth={1.8} />
              </li>
              <li className="min-w-0 truncate">
                {crumb.href ? (
                  <Link to={crumb.href} className="text-muted transition-colors hover:text-ink">
                    {crumb.label}
                  </Link>
                ) : (
                  <span aria-current="page" className="font-medium text-ink">
                    {crumb.label}
                  </span>
                )}
              </li>
            </Fragment>
          ))}
        </ol>
      </nav>
      <div className="flex shrink-0 items-center gap-3">
        <WalletChip />
        <Link to={appRoutes.newJob} className={cx(primaryButton, "h-10 py-0 text-sm")}>
          <HugeiconsIcon icon={Add01Icon} size={16} strokeWidth={2} aria-hidden />
          New job
        </Link>
      </div>
    </div>
  );
}
