// InfraStatusCard — heartbeat-kaart voor het Command Center (Analytics-mode).
//
// KERNREGEL — leeftijd is waarheid: age = now − reported_at.
//   age < 40 min  → gemelde status tonen (up/degraded/down, kleurtoken-dot)
//   age ≥ 40 min  → status negeren, grijs "offline" met "laatst gezien Xm geleden"
// Een host waarvan ALLE rijen stale zijn krijgt een offline-band. Nooit nep-groen.
//
// De `_host`-service is de kopregel van de hostgroep (mem/disk/temp compact).
// Down-services staan bovenaan binnen hun groep. Auto-refresh elke 60 s via
// useInfraHeartbeats + handmatige ververs-knop.

import { useMemo } from "react";
import { useInfraHeartbeats, type HeartbeatDetail, type HeartbeatRow } from "./useInfraHeartbeats";

const STALE_MS = 40 * 60_000;

type EffectiveStatus = "up" | "degraded" | "down" | "offline";

function ageMs(row: HeartbeatRow, now: number): number {
  const t = new Date(row.reported_at).getTime();
  return Number.isFinite(t) ? now - t : Number.POSITIVE_INFINITY;
}

function effectiveStatus(row: HeartbeatRow, now: number): EffectiveStatus {
  if (ageMs(row, now) >= STALE_MS) return "offline";
  if (row.status === "up" || row.status === "degraded" || row.status === "down") return row.status;
  // Onbekende statuswaarde: grijs tonen, nooit nep-groen.
  return "offline";
}

function ageLabel(row: HeartbeatRow, now: number): string {
  const mins = Math.max(1, Math.floor(ageMs(row, now) / 60_000));
  if (!Number.isFinite(mins)) return "onbekend";
  if (mins < 60) return `${mins}m geleden`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}u geleden`;
  return `${Math.floor(hours / 24)}d geleden`;
}

const nl1 = (n: number) => n.toLocaleString("nl-NL", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

function hostMeta(detail: HeartbeatDetail | null): string | null {
  if (!detail) return null;
  const parts: string[] = [];
  if (typeof detail.mem_free_mb === "number") parts.push(`${nl1(detail.mem_free_mb / 1024)} GB vrij`);
  if (typeof detail.disk_free_mb === "number") parts.push(`${Math.round(detail.disk_free_mb / 1024).toLocaleString("nl-NL")} GB disk`);
  if (typeof detail.cpu_temp_c === "number") parts.push(`${nl1(detail.cpu_temp_c)} °C`);
  return parts.length > 0 ? parts.join(" · ") : null;
}

function serviceNote(row: HeartbeatRow): string | null {
  const models = row.detail?.models;
  if (typeof models === "number") return `${models} ${models === 1 ? "model" : "modellen"}`;
  return null;
}

// Down bovenaan, dan offline (onbekend is verdacht), degraded, up — daarna alfabetisch.
const STATUS_RANK: Record<EffectiveStatus, number> = { down: 0, offline: 1, degraded: 2, up: 3 };

interface HostGroup {
  host: string;
  hostRow: HeartbeatRow | null;
  services: HeartbeatRow[];
  allStale: boolean;
  lastSeen: HeartbeatRow | null;
}

function groupByHost(rows: HeartbeatRow[], now: number): HostGroup[] {
  const byHost = new Map<string, HeartbeatRow[]>();
  for (const row of rows) {
    const list = byHost.get(row.host) ?? [];
    list.push(row);
    byHost.set(row.host, list);
  }
  const groups: HostGroup[] = [];
  for (const [host, list] of byHost) {
    const hostRow = list.find((r) => r.service === "_host") ?? null;
    const services = list
      .filter((r) => r.service !== "_host")
      .sort((a, b) => {
        const rank = STATUS_RANK[effectiveStatus(a, now)] - STATUS_RANK[effectiveStatus(b, now)];
        return rank !== 0 ? rank : a.service.localeCompare(b.service);
      });
    const allStale = list.every((r) => ageMs(r, now) >= STALE_MS);
    const lastSeen = list.reduce<HeartbeatRow | null>(
      (best, r) => (best === null || ageMs(r, now) < ageMs(best, now) ? r : best),
      null,
    );
    groups.push({ host, hostRow, services, allStale, lastSeen });
  }
  return groups.sort((a, b) => a.host.localeCompare(b.host));
}

export default function InfraStatusCard() {
  const { rows, loading, error, lastRefreshed, refresh } = useInfraHeartbeats();
  const now = Date.now();
  const groups = useMemo(() => groupByHost(rows, now), [rows, now]);
  const showSkeleton = loading && rows.length === 0 && !error;
  const showEmpty = !loading && (error !== null || rows.length === 0);

  return (
    <div className="chart-card infra-card">
      <h3>
        Infra status <span className="infra-h-sub">heartbeats · elke 60 s ververst</span>
      </h3>

      {showSkeleton && (
        <div className="infra-skel" aria-hidden="true">
          <span /><span /><span />
        </div>
      )}

      {showEmpty && (
        <div className="infra-empty">
          Geen heartbeat-data (login vereist)
          {error && <div className="infra-error-detail">{error}</div>}
        </div>
      )}

      {!showSkeleton && !showEmpty && (
        <div className="infra-hosts">
          {groups.map((g) => (
            <div key={g.host} className={`infra-host${g.allStale ? " offline" : ""}`}>
              <div className="infra-host-head">
                <span className="infra-host-name">{g.host}</span>
                {g.hostRow && hostMeta(g.hostRow.detail) && (
                  <span className="infra-host-meta">{hostMeta(g.hostRow.detail)}</span>
                )}
              </div>
              {g.allStale && (
                <div className="infra-offline-band" role="status">
                  Host offline — laatst gezien {g.lastSeen ? ageLabel(g.lastSeen, now) : "onbekend"}
                </div>
              )}
              <div className="infra-rows">
                {g.services.map((s) => {
                  const st = effectiveStatus(s, now);
                  const note = serviceNote(s);
                  return (
                    <div key={s.service} className="infra-row">
                      <span className={`infra-dot ${st}`} aria-hidden="true" />
                      <span className="infra-svc">{s.service}</span>
                      {note && <span className="infra-note">{note}</span>}
                      <span className={`infra-state ${st}`}>
                        {st === "offline" ? `offline · laatst gezien ${ageLabel(s, now)}` : st}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="infra-foot">
        <button type="button" className="infra-refresh" onClick={refresh} disabled={loading}>
          {loading ? "verversen…" : "↻ ververs"}
        </button>
        <span className="infra-updated">
          Laatst ververst {lastRefreshed ? lastRefreshed.toLocaleTimeString("nl-NL", { hour12: false }) : "–"}
        </span>
      </div>
    </div>
  );
}
