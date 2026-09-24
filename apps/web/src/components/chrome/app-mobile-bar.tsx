import { Add01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Link } from "react-router";
import { appRoutes } from "@/lib/routes";
import { MobileNav } from "./mobile-nav";
import { Wordmark } from "./wordmark";

export function AppMobileBar() {
  return (
    <header className="glass sticky top-4 z-20 mb-8 rounded-[18px] lg:hidden">
      <div className="flex h-[58px] items-center justify-between px-5">
        <Link to={appRoutes.landing} aria-label="Reins home">
          <Wordmark />
        </Link>
        <Link
          to={appRoutes.newJob}
          className="inline-flex items-center gap-1.5 rounded-[11px] bg-accent px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
        >
          <HugeiconsIcon icon={Add01Icon} size={16} strokeWidth={2} aria-hidden />
          New job
        </Link>
      </div>
      <MobileNav />
    </header>
  );
}
