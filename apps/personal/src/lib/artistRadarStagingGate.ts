// Artist Radar accounts are staging-only until a separately reviewed release.
// Preview builds can inherit production variables, so a feature flag alone is
// not evidence of backend isolation. Never ship this allowlist as a production
// rollout without an explicit source change and renewed account acceptance.
const APPROVED_RADAR_STAGING_URL = "https://wwgmgqxchamvbhaxjezq.supabase.co";

export function artistRadarAccountsAllowed(flag: string | undefined, backendUrl: string | undefined): boolean {
  return flag === "true" &&
    (backendUrl === APPROVED_RADAR_STAGING_URL || backendUrl === `${APPROVED_RADAR_STAGING_URL}/`);
}
