/**
 * ArtistRadar.tsx — thin chooser that renders the active radar design.
 *
 * The actual radar UI lives in one component per variant. Which one renders is
 * controlled site-wide by the edit-overlay's activeRadarId (persisted in
 * page_overrides with element_key RADAR_SETTING_KEY). Default: 'clean'.
 *
 * The COMPONENTS map (not a switch/if-chain) is important: Rollup treats
 * dictionary property reads as opaque, so all three imports stay in the bundle
 * even when the string key only becomes known at runtime.
 */
import { useEditOverlay } from "@/components/edit-overlay/EditOverlayProvider";
import { DEFAULT_RADAR_ID, radarVariantById } from "@/lib/radar-variants";
import RadarClean from "./RadarClean";
import RadarMaster from "./RadarMaster";
import RadarCompass from "./RadarCompass";

const COMPONENTS: Record<string, () => JSX.Element> = {
  clean: RadarClean,
  master: RadarMaster,
  compass: RadarCompass,
};

export default function ArtistRadar() {
  const { activeRadarId } = useEditOverlay();
  const chosen = radarVariantById(activeRadarId || DEFAULT_RADAR_ID);
  const id = chosen.status === "live" ? chosen.id : DEFAULT_RADAR_ID;
  const Radar = COMPONENTS[id] ?? RadarClean;
  return <Radar />;
}
