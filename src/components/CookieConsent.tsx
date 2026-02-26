import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cookie, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const CONSENT_KEY = "cookie_consent";
type ConsentValue = "accepted" | "declined";

const EEA_REGIONS = [
  "BE","BG","CZ","DK","DE","EE","IE","EL","ES","FR",
  "HR","IT","CY","LV","LT","LU","HU","MT","NL","AT",
  "PL","PT","RO","SI","SK","FI","SE","IS","LI","NO",
];

declare global {
  interface Window {
    dataLayer: Record<string, unknown>[];
  }
}

/** Push default consent state (all denied for EEA) */
const pushConsentDefault = () => {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: "consent_default",
    consent: {
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
      analytics_storage: "denied",
      functionality_storage: "denied",
      personalization_storage: "denied",
      security_storage: "granted",
      wait_for_update: 500,
      region: EEA_REGIONS,
    },
  });
};

/** Push consent update (granted or denied) */
const pushConsentUpdate = (granted: boolean) => {
  window.dataLayer = window.dataLayer || [];
  const value = granted ? "granted" : "denied";
  window.dataLayer.push({
    event: "consent_update",
    consent: {
      ad_storage: value,
      ad_user_data: value,
      ad_personalization: value,
      analytics_storage: value,
      functionality_storage: granted ? "granted" : "denied",
      personalization_storage: granted ? "granted" : "denied",
    },
  });
};

const CookieConsent = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(CONSENT_KEY) as ConsentValue | null;

    // Always push defaults first so GTM Consent Initialization picks them up
    pushConsentDefault();

    if (stored === "accepted") {
      pushConsentUpdate(true);
    } else if (stored === "declined") {
      // defaults already denied, nothing extra needed
    } else {
      const t = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(t);
    }
  }, []);

  const handleAccept = useCallback(() => {
    localStorage.setItem(CONSENT_KEY, "accepted");
    setVisible(false);
    pushConsentUpdate(true);
  }, []);

  const handleDecline = useCallback(() => {
    localStorage.setItem(CONSENT_KEY, "declined");
    setVisible(false);
    pushConsentUpdate(false);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed bottom-4 left-4 right-4 z-[9999] mx-auto max-w-lg rounded-2xl border border-border bg-card p-5 shadow-2xl sm:left-auto sm:right-6 sm:bottom-6"
        >
          <button
            onClick={handleDecline}
            className="absolute right-3 top-3 rounded-full p-1 text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Sluiten"
          >
            <X size={16} />
          </button>

          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <Cookie size={18} className="text-primary" />
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground">Cookies & Privacy</h3>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Wij gebruiken analytische cookies om het gebruik van de website te begrijpen en te verbeteren. Geen persoonlijke data wordt gedeeld met derden.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <Button size="sm" onClick={handleAccept} className="h-8 text-xs">
                  Accepteren
                </Button>
                <Button size="sm" variant="ghost" onClick={handleDecline} className="h-8 text-xs text-muted-foreground">
                  Weigeren
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CookieConsent;
