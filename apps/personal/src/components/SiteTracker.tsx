import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { initSiteTracker, trackPageView } from "@/lib/siteTracker";

/** Mounts the first-party tracker (src/lib/siteTracker.ts) and reports every route change. */
export default function SiteTracker() {
  const { pathname } = useLocation();
  useEffect(() => {
    if (initSiteTracker()) trackPageView(pathname);
  }, [pathname]);
  return null;
}
