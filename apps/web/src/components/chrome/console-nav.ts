import {
  Activity01Icon,
  Briefcase01Icon,
  DashboardSquare01Icon,
  Wallet01Icon,
} from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@hugeicons/react";
import { appRoutes, isActiveRoute, type AppHref } from "@/lib/routes";

export interface ConsoleNavItem {
  readonly label: string;
  readonly href: AppHref;
  readonly icon: IconSvgElement;
  readonly match: (pathname: string) => boolean;
}

const matchRoute = (route: string) => (pathname: string) => isActiveRoute(pathname, route);

export const consoleNav: readonly ConsoleNavItem[] = [
  {
    label: "Overview",
    href: appRoutes.dashboard,
    icon: DashboardSquare01Icon,
    match: matchRoute(appRoutes.dashboard),
  },
  {
    label: "Jobs",
    href: appRoutes.jobs,
    icon: Briefcase01Icon,
    match: matchRoute(appRoutes.jobs),
  },
  {
    label: "Activity",
    href: appRoutes.activity,
    icon: Activity01Icon,
    match: matchRoute(appRoutes.activity),
  },
  {
    label: "Wallet",
    href: appRoutes.wallet,
    icon: Wallet01Icon,
    match: matchRoute(appRoutes.wallet),
  },
];
