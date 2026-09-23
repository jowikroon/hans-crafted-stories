import { describe, it, expect } from "vitest";
import {
  addDays, daysBetween, defaultPeriod, makePeriod, periodFromPreset,
  matchPreset, deltaPct, formatRange, ymd,
} from "./dashboardPeriod";

const at = (iso: string) => new Date(iso);

describe("dashboardPeriod — standaardvenster", () => {
  it("is 14 volledige dagen en eindigt gisteren", () => {
    const p = defaultPeriod(at("2026-08-10T09:00:00Z"));
    expect(p.to).toBe("2026-08-09");
    expect(p.from).toBe("2026-07-27");
    expect(p.days).toBe(14);
  });

  it("sluit vandaag uit, ook laat op de avond (22:30 Amsterdam = 20:30 UTC)", () => {
    expect(defaultPeriod(at("2026-08-10T20:30:00Z")).to).toBe("2026-08-09");
  });

  it("rekent in Amsterdamse dagen, niet in UTC: 22:30 UTC is daar al de volgende dag", () => {
    // 2026-08-10T22:30Z = 2026-08-11 00:30 in Amsterdam (CEST), dus 'gisteren' is de 10e.
    expect(defaultPeriod(at("2026-08-10T22:30:00Z")).to).toBe("2026-08-10");
  });

  it("vergelijkt met de direct voorafgaande periode van gelijke lengte", () => {
    const p = defaultPeriod(at("2026-08-10T09:00:00Z"));
    expect(p.prevFrom).toBe("2026-07-13");
    expect(p.prevTo).toBe("2026-07-26");
    expect(daysBetween(p.prevFrom!, p.prevTo!)).toBe(p.days);
  });
});

describe("randgevallen", () => {
  it("maandgrens", () => {
    const p = makePeriod("2026-03-01", "2026-03-07", "prev", at("2026-04-01T10:00:00Z"));
    expect(p.prevFrom).toBe("2026-02-22");
    expect(p.prevTo).toBe("2026-02-28");
  });

  it("schrikkeljaar telt 29 februari mee", () => {
    expect(daysBetween("2024-02-01", "2024-02-29")).toBe(29);
    expect(addDays("2024-02-28", 1)).toBe("2024-02-29");
  });

  it("zomertijdovergang laat geen dag verspringen", () => {
    expect(addDays("2026-03-28", 1)).toBe("2026-03-29");
    expect(daysBetween("2026-03-27", "2026-03-31")).toBe(5);
    expect(addDays("2026-10-24", 1)).toBe("2026-10-25");
    expect(daysBetween("2026-10-23", "2026-10-27")).toBe(5);
  });

  it("jaargrens", () => {
    const p = makePeriod("2026-01-01", "2026-01-07", "prev", at("2026-02-01T10:00:00Z"));
    expect(p.prevFrom).toBe("2025-12-25");
    expect(p.prevTo).toBe("2025-12-31");
  });

  it("kapt een einddatum in de toekomst af naar gisteren", () => {
    expect(makePeriod("2026-08-05", "2027-01-01", "prev", at("2026-08-10T09:00:00Z")).to)
      .toBe("2026-08-09");
  });

  it("draait een omgekeerd bereik om", () => {
    const p = makePeriod("2026-08-09", "2026-08-01", "prev", at("2026-08-10T09:00:00Z"));
    expect(p.from).toBe("2026-08-01");
    expect(p.to).toBe("2026-08-09");
  });

  it("jaar-op-jaar verschuift exact 365 dagen", () => {
    const p = makePeriod("2026-07-27", "2026-08-09", "yoy", at("2026-08-10T09:00:00Z"));
    expect(p.prevFrom).toBe("2025-07-27");
    expect(p.prevTo).toBe("2025-08-09");
  });

  it("compare none levert geen vergelijkperiode", () => {
    expect(makePeriod("2026-08-01", "2026-08-07", "none", at("2026-08-10T09:00:00Z")).prevFrom)
      .toBeNull();
  });

  it("Amsterdamse dag wijkt af van UTC net voor middernacht", () => {
    expect(ymd(at("2026-07-14T23:30:00Z"))).toBe("2026-07-15");
  });
});

describe("presets en delta", () => {
  it("14d is de standaardpreset", () => {
    const now = at("2026-08-10T09:00:00Z");
    expect(matchPreset(defaultPeriod(now), now)).toBe("14d");
  });

  it("vorige maand loopt van de eerste tot de laatste dag", () => {
    const p = periodFromPreset("lastMonth", "prev", at("2026-08-10T09:00:00Z"));
    expect(p.from).toBe("2026-07-01");
    expect(p.to).toBe("2026-07-31");
  });

  it("geeft geen delta zonder vergelijkbasis", () => {
    expect(deltaPct(10, 0)).toBeNull();
    expect(deltaPct(10, null)).toBeNull();
    expect(deltaPct(null, 10)).toBeNull();
    expect(deltaPct(15, 10)).toBe(50);
    expect(deltaPct(5, 10)).toBe(-50);
  });

  it("formatteert een bereik leesbaar", () => {
    expect(formatRange("2026-07-27", "2026-08-09")).toBe("27 jul – 9 aug");
  });
});
