import { describe, expect, it } from "vitest";
import radarHistoryJson from "@/data/ccpCompetitionRadar.json";
import { filterRadarRuns, type RadarRun } from "@/lib/competitionRadar";

describe("CompetitionRadarPanel history", () => {
  const history = radarHistoryJson as RadarRun[];

  it("filters inclusively between two selected runs", () => {
    const selected = filterRadarRuns(history, "2026-05-27", "2026-07-01");
    expect(selected.map((run) => run.run)).toEqual([
      "2026-05-27",
      "2026-06-03",
      "2026-06-10",
      "2026-07-01",
    ]);
  });

  it("keeps the latest structured signals available", () => {
    const latest = history.at(-1);
    expect(latest?.run).toBe("2026-07-08");
    expect(latest?.summary).toHaveLength(3);
    expect(latest?.actions.length).toBeGreaterThanOrEqual(4);
    expect(latest?.kpi.euro7Days).toBe(144);
  });
});
