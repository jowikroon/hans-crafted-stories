/**
 * Radar variants — registry of Artist Radar designs Hans can pick from in the
 * edit-overlay. Mirrors the LOGOS/HEADERS pattern (id + label + description).
 * The 'active' variant is persisted via the site-wide page_overrides system
 * (element_key RADAR_SETTING_KEY).
 */

export interface RadarVariant {
  id: string;
  label: string;
  description: string;
  status: "live" | "beta" | "coming-soon";
}

export const DEFAULT_RADAR_ID = "clean";

export const RADAR_SETTING_KEY = "__site__:radar-variant";

export const RADAR_VARIANTS: RadarVariant[] = [
  { id: "clean",   label: "Radar Clean",   description: "Kompas + hartslag, warm koper, event-dots per artiest. Default.", status: "live" },
  { id: "master",  label: "Radar Master",  description: "Rijkere layout met hero, Fogg-flow, signaal-niveaus.",           status: "live" },
  { id: "compass", label: "Radar Compass", description: "Editorial hero-variant, lichter en rustiger. Nu beschikbaar.", status: "live" },
];

export function radarVariantById(id?: string | null): RadarVariant {
  return (
    RADAR_VARIANTS.find((r) => r.id === id) ??
    RADAR_VARIANTS.find((r) => r.id === DEFAULT_RADAR_ID) ??
    RADAR_VARIANTS[0]
  );
}
