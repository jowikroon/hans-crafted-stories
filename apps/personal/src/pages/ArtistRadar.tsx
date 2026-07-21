/**
 * ArtistRadar.tsx — thin chooser that renders the active radar design.
 *
 * The actual radar UI lives in one component per variant (RadarClean, RadarMaster,
 * …). Which one renders is controlled site-wide by the edit-overlay's activeRadarId
 * (persisted in page_overrides with element_key RADAR_SETTING_KEY). Default: 'clean'.
 */
import { useEditOverlay } from "@/components/edit-overlay/EditOverlayProvider";
import { radarVariantById, DEFAULT_RADAR_ID } from "@/lib/radar-variants";
import RadarClean from "./RadarClean";
import RadarMaster from "./RadarMaster";
import RadarCompass from "./RadarCompass";

export default function ArtistRadar() {
  const { activeRadarId } = useEditOverlay();
  const chosen = radarVariantById(activeRadarId || DEFAULT_RADAR_ID);
  // 'compass' is coming-soon → fall back to clean until its port ships
  const id = chosen.status === "live" ? chosen.id : DEFAULT_RADAR_ID;
  if (id === "master") return <RadarMaster />;
  if (id === "compass") return <RadarCompass />;
  return <RadarClean />;
}
