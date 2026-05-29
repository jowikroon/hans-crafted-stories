// ConnectBar — Phase E status chip row for GA4 + Search Console.
//
// Shows one chip per configured connector. Configured chips display the last
// synced_at timestamp; unconfigured chips display "Not connected" with a
// link/CTA hint. Clicking an unconfigured chip surfaces a hint about where
// to wire it (the actual OAuth flow + n8n connector lives outside this PR).

import type { ConnectorState } from "./useAnalyticsLive";

function timeAgo(iso: string | null): string {
  if (!iso) return "—";
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60_000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

const LABEL: Record<ConnectorState["source"], string> = {
  ga4: "Google Analytics",
  gsc: "Search Console",
};

export default function ConnectBar({
  connectors,
  onConfigure,
  onRefresh,
  refreshing,
}: {
  connectors: ConnectorState[];
  onConfigure: (source: ConnectorState["source"]) => void;
  onRefresh: () => void;
  refreshing?: boolean;
}) {
  return (
    <div className="connect-bar" role="toolbar" aria-label="Analytics connectors">
      {connectors.map((c) => {
        const isOk = c.configured;
        return (
          <button
            key={c.source}
            className={`connect-chip${isOk ? " connect-chip--ok" : ""}`}
            onClick={() => onConfigure(c.source)}
            title={isOk ? `Last synced ${timeAgo(c.lastSyncedAt)}` : `Click for setup hint`}
          >
            <span className="connect-dot" aria-hidden />
            <span className="connect-label">{LABEL[c.source]}</span>
            <span className="connect-status">{isOk ? timeAgo(c.lastSyncedAt) : "Not connected"}</span>
          </button>
        );
      })}
      <span className="connect-spacer" aria-hidden />
      <button
        className="stamp-btn stamp-btn--ghost stamp-btn--sm"
        onClick={onRefresh}
        disabled={refreshing}
        title="Re-fetch from Supabase"
      >
        {refreshing ? "Refreshing…" : "Refresh"}
      </button>
    </div>
  );
}
