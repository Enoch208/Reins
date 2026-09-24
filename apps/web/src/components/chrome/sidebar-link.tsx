import type { IconSvgElement } from "@hugeicons/react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Link, useLocation } from "react-router";
import { cx } from "@/lib/cx";
import { isActiveRoute, type AppHref } from "@/lib/routes";

export function SidebarLink({
  label,
  href,
  icon,
  match = (pathname: string) => isActiveRoute(pathname, href),
}: {
  label: string;
  href: AppHref;
  icon: IconSvgElement;
  match?: (pathname: string) => boolean;
}) {
  const { pathname } = useLocation();
  const active = match(pathname);

  return (
    <Link
      to={href}
      aria-current={active ? "page" : undefined}
      className={cx(
        "flex items-center gap-3 rounded-[11px] px-3.5 py-2.5 text-[15px] transition-colors",
        active
          ? "bg-accent/9 font-medium text-accent-ink"
          : "text-muted hover:bg-white/60 hover:text-ink",
      )}
    >
      <HugeiconsIcon icon={icon} size={18} strokeWidth={1.8} aria-hidden />
      {label}
    </Link>
  );
}
