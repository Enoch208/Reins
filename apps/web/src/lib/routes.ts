export const appRoutes = {
  landing: "/",
  dashboard: "/dashboard",
  jobs: "/jobs",
  activity: "/activity",
  wallet: "/wallet",
  newJob: "/jobs/new",
} as const;

export type AppHref = (typeof appRoutes)[keyof typeof appRoutes];

export const jobHref = (jobId: string): string => `/jobs/${encodeURIComponent(jobId)}`;

export const evidenceHref = (jobId: string, entryId: string): string =>
  `${jobHref(jobId)}/evidence/${encodeURIComponent(entryId)}`;

export function isActiveRoute(pathname: string, route: string): boolean {
  return pathname === route || pathname.startsWith(`${route}/`);
}
