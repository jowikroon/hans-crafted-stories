import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { HangingOnProcess } from "./HangingOnProcess";
import data from "@/data/hangingOnAnalysis.json";
import { songs } from "@/data/music";

afterEach(cleanup);

describe("Hanging On measured process", () => {
  it("keeps the public recording identity while comparing two separate source traces", () => {
    const song = songs.find((entry) => entry.slug === "hanging-on");
    expect(song?.soundcloudTrackId).toBe(2419106913);
    expect(song?.listenUrl).toBe("https://soundcloud.com/jowikroon/s06-hanging-on-jowikroon-neon-master-96k-24-bit-14");
    expect(song?.duration).toBe("7:59");
    expect(data.comparisonLufs).toBe(-18);
    // Independent anchors from the original 100 ms exports, rounded to 0.01 dB.
    // A swapped trace or accidentally substituted 96 kHz archive must fail here.
    expect(data.series.master[61]).toEqual([61.5, -17.22, 7.37]);
    expect(data.series.source[61]).toEqual([61.5, -17.64, 8.75]);
  });

  it("plots finite paired one-second windows within the recording and chart axes", () => {
    for (const values of Object.values(data.series)) {
      expect(values).toHaveLength(479);
      values.forEach(([second, rmsDbfs, crestDb], index) => {
        expect(second).toBe(index + 0.5);
        expect([second, rmsDbfs, crestDb].every(Number.isFinite)).toBe(true);
        expect(second).toBeLessThan(479);
        expect(rmsDbfs).toBeGreaterThanOrEqual(-64);
        expect(rmsDbfs).toBeLessThanOrEqual(-12);
        expect(crestDb).toBeGreaterThanOrEqual(0);
        expect(crestDb).toBeLessThanOrEqual(18);
      });
    }
    expect(data.series.master.map(([second]) => second)).toEqual(data.series.source.map(([second]) => second));
  });

  it("uses signed energy dB at equal loudness, not amplitude dB or percent changes", () => {
    // Original measurement records: sample peak - global crest = overall RMS.
    const masterRms = -0.10000041715304564 - 8.34033846218939;
    const sourceRms = -4.4024957583402795 - 11.876961079281012;
    const normalizedRmsDifference = (masterRms - -7.73) - (sourceRms - -15.37);
    const references = [
      { hz: "30-60", masterShare: 43.55507038192504, sourceShare: 41.946622116630465 },
      { hz: "10000-16000", masterShare: 0.5025117448834183, sourceShare: 0.7635706943192588 },
    ];
    for (const reference of references) {
      const expectedDb = 10 * Math.log10(reference.masterShare / reference.sourceShare) + normalizedRmsDifference;
      expect(data.bands.find((band) => band.hz === reference.hz)?.deltaDb).toBeCloseTo(expectedDb, 3);
    }
    for (const band of data.bands) {
      expect(Number.isFinite(band.deltaDb)).toBe(true);
      expect(band.deltaDb).toBeGreaterThanOrEqual(-2);
      expect(band.deltaDb).toBeLessThanOrEqual(1);
    }
    expect(data.bands.slice(0, 3).every((band) => band.deltaDb > 0)).toBe(true);
    expect(data.bands.slice(3).every((band) => band.deltaDb < 0)).toBe(true);
  });

  it("exposes named graphs and keyboard-accessible scroll regions without requiring hover", () => {
    render(<HangingOnProcess />);
    const graphs = screen.getAllByRole("img");
    expect(graphs).toHaveLength(3);
    for (const graph of graphs) {
      expect(graph).toHaveAccessibleName();
      expect(graph).toHaveAccessibleDescription();
      expect(graph.querySelector("desc")?.textContent).toBeTruthy();
    }
    for (const region of screen.getAllByRole("region", { name: /Scroll horizontally/ })) {
      expect(region).toHaveAttribute("tabindex", "0");
    }
    expect(screen.getByText(/not an EQ prescription/)).toBeInTheDocument();
    const balance = screen.getByRole("img", { name: "Frequency balance at matched loudness" });
    for (const band of data.bands) {
      expect(balance).toHaveAccessibleDescription(new RegExp(`${band.deltaDb.toFixed(2).replace(".", "\\.")} dB`));
    }
  });
});
