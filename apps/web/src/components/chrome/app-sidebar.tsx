import { Add01Icon, ArrowLeft02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Link } from "react-router";
import { primaryButton } from "@/components/feedback/button-styles";
import { cx } from "@/lib/cx";
import { appRoutes } from "@/lib/routes";
import { consoleNav } from "./console-nav";
import { SidebarLink } from "./sidebar-link";
import { SidebarWallet } from "./sidebar-wallet";
import { Wordmark } from "./wordmark";

export function AppSidebar() {
  return (
    <aside className="glass sticky top-7 hidden h-[calc(100vh-56px)] w-64 shrink-0 flex-col rounded-[26px] p-5 lg:flex">
      <Link to={appRoutes.landing} aria-label="Reins home" className="mb-8 px-2 pt-2">
        <Wordmark />
      </Link>

      <Link to={appRoutes.newJob} className={cx(primaryButton, "mb-7 w-full")}>
        <HugeiconsIcon icon={Add01Icon} size={18} strokeWidth={2} aria-hidden />
        New job
      </Link>

      <p className="mb-2 px-3.5 text-[11px] font-semibold tracking-[0.16em] text-caption">
        CONSOLE
      </p>
      <nav aria-label="Console" className="flex flex-1 flex-col gap-1">
        {consoleNav.map((item) => (
          <SidebarLink
            key={item.href}
            label={item.label}
            href={item.href}
            icon={item.icon}
            match={item.match}
          />
        ))}
      </nav>

      <SidebarWallet />

      <div className="mt-3 border-t border-line/70 pt-3">
        <Link
          to={appRoutes.landing}
          className="flex items-center gap-2.5 rounded-[11px] px-3.5 py-2.5 text-sm text-muted transition-colors hover:bg-white/60 hover:text-ink"
        >
          <HugeiconsIcon icon={ArrowLeft02Icon} size={16} strokeWidth={1.8} aria-hidden />
          Back to site
        </Link>
      </div>
    </aside>
  );
}
