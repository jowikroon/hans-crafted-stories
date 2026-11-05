import { describe, expect, it } from "vitest";
import { artistRadarAccountsAllowed } from "./artistRadarStagingGate";

describe("Artist Radar staging-only account gate", () => {
  it("never enables accounts on an inherited production backend even with the flag on", () => {
    const production = "https://pesfakewujjwkyybwaom.supabase.co";
    expect(artistRadarAccountsAllowed("true", production)).toBe(false);
    expect(artistRadarAccountsAllowed("true", `${production}/`)).toBe(false);
    expect(artistRadarAccountsAllowed("false", production)).toBe(false);
  });

  it("enables only the explicitly authorized standalone staging backend", () => {
    const staging = "https://wwgmgqxchamvbhaxjezq.supabase.co";
    expect(artistRadarAccountsAllowed("true", staging)).toBe(true);
    expect(artistRadarAccountsAllowed("true", `${staging}/`)).toBe(true);
    expect(artistRadarAccountsAllowed("false", staging)).toBe(false);
    expect(artistRadarAccountsAllowed(undefined, staging)).toBe(false);
    expect(artistRadarAccountsAllowed("true", `${staging}.evil.example`)).toBe(false);
    expect(artistRadarAccountsAllowed("true", `${staging}/rest/v1`)).toBe(false);
    expect(artistRadarAccountsAllowed("true", `http://wwgmgqxchamvbhaxjezq.supabase.co`)).toBe(false);
  });
});
