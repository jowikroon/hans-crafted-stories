import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cookie, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useLang } from "@/hooks/useLang";
import { translations } from "@/data/translations";

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
  const { lang } = useLang();
  const t = translations[lang].cookie;

  useEffect(() => {
    const stored = localStorage.getItem(CONSENT_KEY) as ConsentValue | null;
    pushConsentDefault();

    if (stored === "accepted") {
      pushConsentUpdate(true);
    } else if (stored === "declined") {
      // defaults already denied
    } else {
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
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
          className="fixed bottom-6 left-1/2 z-[9999] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 rounded-2xl border border-border bg-card p-5 shadow-2xl"
        >
          <button
            onClick={handleDecline}
            className="absolute right-3 top-3 rounded-full p-1 text-muted-foreground transition-colors hover:text-foreground"
            aria-label={t.close}
          >
            <X size={16} />
          </button>

          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <Cookie size={18} className="text-primary" />
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground">{t.title}</h3>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {t.description}{" "}
                <Link to="/privacy" className="underline text-primary hover:text-primary/80 transition-colors">
                  {t.privacyLink}
                </Link>
              </p>
              <div className="flex items-center gap-2 pt-1">
                <Button size="sm" onClick={handleAccept} className="h-8 text-xs">
                  {t.accept}
                </Button>
                <Button size="sm" variant="ghost" onClick={handleDecline} className="h-8 text-xs text-muted-foreground">
                  {t.decline}
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
