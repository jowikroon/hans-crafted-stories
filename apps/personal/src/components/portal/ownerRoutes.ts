const ownerRoutes = [
  '/write',
  '/blog-cms',
  '/music-cms',
  '/release-set',
  '/god-structure',
  '/dashboards',
  '/bijlagen',
  '/samantha',
] as const;

/** Only owner tools are protected; public Artist Radar signup stays accessible. */
export const isOwnerRoute = (path: string): boolean =>
  ownerRoutes.some((route) => path === route || path.startsWith(`${route}/`));
