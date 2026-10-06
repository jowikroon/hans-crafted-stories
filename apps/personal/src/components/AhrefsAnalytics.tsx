import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  CONSENT_EVENT,
  isAhrefsLoaded,
  isPrivatePath,
  loadAhrefs,
  pageNavigator,
  readConsent,
  shouldLoadAhrefs,
  type ConsentChoice,
} from "@/lib/ahrefsAnalytics";

/**
 * Laadt Ahrefs Web Analytics na toestemming, alleen op het productiedomein en
 * nooit op private routes. Een eenmaal geladen script volgt URL-wijzigingen en
 * kan niet worden uitgeladen; daarom wordt intrekken, of in-app navigeren naar
 * een private route, een volledige paginaload (daarna laadt het niet meer).
 */
const AhrefsAnalytics = () => {
  const { pathname } = useLocation();
  const [consent, setConsent] = useState<ConsentChoice | null>(() => (typeof window === "undefined" ? null : readConsent()));

  useEffect(() => {
    const onConsent = (e: Event) => {
      const choice = (e as CustomEvent<ConsentChoice>).detail;
      setConsent(choice);
      if (choice === "declined" && isAhrefsLoaded()) pageNavigator.reload();
    };
    window.addEventListener(CONSENT_EVENT, onConsent);
    return () => window.removeEventListener(CONSENT_EVENT, onConsent);
  }, []);

  useEffect(() => {
    if (isPrivatePath(pathname) && isAhrefsLoaded()) {
      pageNavigator.assign(window.location.href);
      return;
    }
    if (shouldLoadAhrefs({ hostname: window.location.hostname, pathname, consent })) loadAhrefs();
  }, [consent, pathname]);

  return null;
};

export default AhrefsAnalytics;
