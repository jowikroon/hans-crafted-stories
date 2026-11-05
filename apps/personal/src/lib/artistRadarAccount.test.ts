import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const mock = vi.hoisted(() => ({
  rows: [] as Array<{ table: string; op: string; data?: unknown; key?: string; value?: unknown }>,
  preferenceExists: false,
  insertConflict: false,
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: (table: string) => ({
      select: (_columns: string) => ({
        eq: (key: string, value: unknown) => ({
          maybeSingle: async () => {
            mock.rows.push({ table, op: "select", key, value });
            return { data: mock.preferenceExists ? { user_id: value } : null, error: null };
          },
        }),
      }),
      update: (data: unknown) => ({
        eq: async (key: string, value: unknown) => {
          mock.rows.push({ table, op: "update", data, key, value });
          return { data: null, error: null };
        },
      }),
      insert: async (data: unknown) => {
        mock.rows.push({ table, op: "insert", data });
        if (table === "artist_radar_preferences" && mock.insertConflict) return { data: null, error: { code: "23505" } };
        return { data: null, error: null };
      },
    }),
  },
}));

import {
  RADAR_CATEGORIES, radarStatusLabel, recordRadarTicketLinkOpen,
  safeRadarArtist, saveRadarPreferences, validRadarEmail,
} from "./artistRadarAccount";

beforeEach(() => { mock.rows = []; mock.preferenceExists = false; mock.insertConflict = false; });
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe("Artist Radar identity and history contracts", () => {
  it("uses canonical IDs for known artists and labels unsupported manual names as custom", () => {
    expect(safeRadarArtist("   Froukje  ")).toEqual({ id: "froukje", name: "Froukje", genre: "Pop" });
    expect(safeRadarArtist("Angele")).toEqual({ id: "angele", name: "Angèle", genre: "Pop" });
    expect(safeRadarArtist("Test Fantasie-artiest")?.id).toBe("custom:test-fantasie-artiest");
    expect(safeRadarArtist("Test Fantasie-artiest")?.genre).toBe("Eigen keuze");
    expect(safeRadarArtist("a")).toBeNull();
  });

  it("validates login email separately from newsletter consent", () => {
    expect(validRadarEmail("vriend@example.nl")).toBe(true);
    expect(validRadarEmail("onjuist")).toBe(false);
    expect(validRadarEmail(`${"a".repeat(250)}@example.nl`)).toBe(false);
    expect(RADAR_CATEGORIES).toEqual(["rumored", "announced", "available", "sold_out"]);
    expect(radarStatusLabel("rumored")).toContain("onbevestigd");
  });

  it("records only a ticket-link click, never a purchase or reservation", async () => {
    await recordRadarTicketLinkOpen("owner-user", "froukje", "Froukje", "show-2026", "Officiele zaal");
    expect(mock.rows).toEqual([{ table: "artist_radar_activity", op: "insert", data: {
      user_id: "owner-user", kind: "ticket_link_opened", artist_id: "froukje", artist_name: "Froukje",
      event_key: "show-2026", provider: "Officiele zaal",
    } }]);
  });

  it("updates only permitted preference columns on an existing RLS-owned row", async () => {
    mock.preferenceExists = true;
    await saveRadarPreferences("owner-user", { countries: ["NL"], categories: ["available"] });
    expect(mock.rows.find((entry) => entry.op === "update")).toEqual({
      table: "artist_radar_preferences", op: "update", key: "user_id", value: "owner-user",
      data: { countries: ["NL"], categories: ["available"] },
    });
    expect(mock.rows.some((entry) => entry.op === "insert" && entry.table === "artist_radar_preferences")).toBe(false);
  });

  it("recovers a concurrent first-save primary-key conflict without updating user_id", async () => {
    mock.insertConflict = true;
    await saveRadarPreferences("owner-user", { countries: ["BE"], categories: ["announced"] });
    expect(mock.rows.filter((entry) => entry.table === "artist_radar_preferences").map((entry) => entry.op))
      .toEqual(["select", "insert", "update"]);
    expect(mock.rows.find((entry) => entry.op === "update")?.data).not.toHaveProperty("user_id");
  });

  it("rejects empty privacy filters before sending any database query", async () => {
    await expect(saveRadarPreferences("owner-user", { countries: [], categories: ["available"] })).rejects.toThrow(/minstens één land/);
    expect(mock.rows).toHaveLength(0);
  });

  it("guards the supplied user ID before SECURITY DEFINER acquires any auth row lock", () => {
    // A source-level regression guard; not a substitute for staging SQL/RLS tests.
    const sql = readFileSync(resolve(process.cwd(), "../../supabase/migrations/20261105140000_artist_radar_accounts.sql"), "utf8");
    const functionStart = sql.indexOf("FUNCTION public.artist_radar_account_write_guard()");
    const functionBody = sql.slice(functionStart, sql.indexOf("$$;", functionStart));
    const identityGuard = functionBody.indexOf("NEW.user_id IS DISTINCT FROM (SELECT auth.uid())");
    const rowLock = functionBody.indexOf("FROM auth.users WHERE id = NEW.user_id FOR UPDATE");
    expect(identityGuard).toBeGreaterThan(0);
    expect(rowLock).toBeGreaterThan(identityGuard);
    expect(sql).toContain("GRANT INSERT (user_id, kind, artist_id, artist_name, event_key, provider)");
    expect(sql).toContain("CREATE POLICY artist_radar_activity_read_own");
  });
});
