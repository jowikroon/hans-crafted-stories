/**
 * ArtistRadar.tsx — thin chooser that renders the active radar design.
 *
 * The actual radar UI lives in one component per variant. Which one renders is
 * controlled site-wide by the edit-overlay's activeRadarId (persisted in
 * page_overrides with element_key RADAR_SETTING_KEY). Default: 'clean'.
 *
 * Keep the default Clean variant server-renderable. Alternative designs
 * are loaded only when chosen, preserving the public-page JS budget.
 */
import { lazy, Suspense, type ComponentType } from "react";
import { useEditOverlay } from "@/components/edit-overlay/EditOverlayProvider";
import { DEFAULT_RADAR_ID, radarVariantById } from "@/lib/radar-variants";
import RadarClean from "./RadarClean";

const RadarMaster = lazy(() => import("./RadarMaster"));
const RadarCompass = lazy(() => import("./RadarCompass"));

const COMPONENTS: Record<string, ComponentType> = {
  clean: RadarClean,
  master: RadarMaster,
  compass: RadarCompass,
};

export default function ArtistRadar() {
  const { activeRadarId } = useEditOverlay();
  const chosen = radarVariantById(activeRadarId || DEFAULT_RADAR_ID);
  const id = chosen.status === "live" ? chosen.id : DEFAULT_RADAR_ID;
  const Radar = COMPONENTS[id] ?? RadarClean;
  return <Suspense fallback={<RadarClean />}><Radar /></Suspense>;
}
