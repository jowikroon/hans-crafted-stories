/**
 * Productie-host-gate. Vercel-previews, `vite preview` en localhost gebruiken
 * dezelfde bundle (met de productie-Supabase-sleutel uit .env.production).
 * Alles wat een echte bijwerking heeft — contactinzendingen, GTM/GA4, Hotjar —
 * mag alleen op het echte domein draaien, zodat previews geen leads in
 * productie schrijven en geen KPI-baselines vervuilen.
 */
export const PRODUCTION_HOSTS: readonly string[] = ["hansvanleeuwen.com"];

export function isProductionHost(hostname?: string): boolean {
  const host = hostname ?? (typeof window !== "undefined" ? window.location.hostname : "");
  return PRODUCTION_HOSTS.includes(host.toLowerCase());
}
