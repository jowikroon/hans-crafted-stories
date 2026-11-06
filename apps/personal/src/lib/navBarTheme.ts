/** Music and album pages have a fixed dark canvas even when the global site theme is light. */
export const isMusicVisualRoute = (path: string): boolean =>
  path === "/music" || path.startsWith("/music/albums/");

/** Keep backend/light surfaces authoritative and other site routes user-themed. */
export const shouldUseDarkNav = (
  path: string,
  theme: string,
  isLightSurface: boolean,
): boolean => !isLightSurface && (theme === "dark" || isMusicVisualRoute(path));
