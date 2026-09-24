import { appRoutes, jobHref } from "@/lib/routes";

export interface Crumb {
  readonly label: string;
  readonly href: string | null;
}

const jobsCrumb: Crumb = { label: "Jobs", href: appRoutes.jobs };

const fixedTrails: Record<string, readonly Crumb[]> = {
  [appRoutes.dashboard]: [{ label: "Overview", href: null }],
  [appRoutes.jobs]: [{ label: "Jobs", href: null }],
  [appRoutes.newJob]: [jobsCrumb, { label: "New job", href: null }],
  [appRoutes.activity]: [{ label: "Activity", href: null }],
  [appRoutes.wallet]: [{ label: "Wallet", href: null }],
};

export function breadcrumbsFor(pathname: string): readonly Crumb[] {
  const trimmed = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  const fixed = fixedTrails[trimmed];
  if (fixed) return fixed;
  const [, section, jobId, sub] = trimmed.split("/");
  if (section === "jobs" && jobId) {
    const job = { label: "Job", href: sub ? jobHref(decodeURIComponent(jobId)) : null };
    return sub === "evidence"
      ? [jobsCrumb, job, { label: "Evidence", href: null }]
      : [jobsCrumb, job];
  }
  return [{ label: "Not found", href: null }];
}
