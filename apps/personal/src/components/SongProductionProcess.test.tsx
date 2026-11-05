import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { songs } from "@/data/music";
import { songProduction } from "@/data/songProduction";
import { ProductionMetrics, SongProductionProcess } from "./SongProductionProcess";

afterEach(cleanup);

describe("version-specific production evidence", () => {
  it("keeps studio measurements separate from the public recording and preserves peaks above full scale", () => {
    const song = songs.find((entry) => entry.slug === "loop-in-control")!;
    render(<SongProductionProcess song={song}/>);
    expect(screen.getByText(/a match between that stream and these studio files has not been established/)).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /True peak.*Modern master · 8.1: 1.8 dBTP/ })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /Overall loudness.*Original source: -17.0 LUFS/ })).toBeInTheDocument();
    expect(screen.getByText("48 kHz · 16-bit · Stereo")).toBeInTheDocument();
    expect(song.soundcloudTrackId).toBe(2426601855);
  });

  it("does not turn missing evidence into a chart", () => {
    const song = { ...songs[0], slug: "unmeasured-test-recording" };
    render(<SongProductionProcess song={song}/>);
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getByText(/A measured studio comparison for this exact recording is not available/)).toBeInTheDocument();
  });

  it("derives overall peak distance without inventing loudness range or reusing the normalized timeline level", () => {
    render(<SongProductionProcess song={songs.find((entry) => entry.slug === "hanging-on")!}/>);
    expect(screen.getByRole("img", { name: /Peak-to-loudness distance.*Earlier source: 10.97 dB.*Matched archive master: 7.90 dB/ })).toBeInTheDocument();
    expect(screen.queryByRole("img", { name: /^Loudness range/ })).not.toBeInTheDocument();
    expect(screen.getByRole("img", { name: /Overall loudness.*Earlier source: -15.37 LUFS/ })).toBeInTheDocument();
  });

  it("gives charts and their descriptions unique IDs when a song is open behind its dialog", () => {
    const song = songs.find((entry) => entry.slug === "hanging-on")!;
    const { container } = render(<><SongProductionProcess song={song}/><SongProductionProcess song={song} sectionId="dialog-song-process"/></>);
    const ids = Array.from(container.querySelectorAll("[id]"), (element) => element.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const image of screen.getAllByRole("img")) expect(image).toHaveAccessibleName();
  });

  it("keeps physical units finite and private provenance out of the public dataset", () => {
    expect(Object.keys(songProduction).sort()).toEqual(songs.map((song) => song.slug).sort());
    for (const [slug, entry] of Object.entries(songProduction)) {
      expect(songs.some((song) => song.slug === slug)).toBe(true);
      expect(new Set(entry.versions.map((v) => v.key)).size).toBe(entry.versions.length);
      for (const version of entry.versions) {
        expect([version.integratedLufs, version.truePeakDbtp].every(Number.isFinite)).toBe(true);
        if (version.loudnessRangeLu !== undefined) expect(version.loudnessRangeLu).toBeGreaterThanOrEqual(0);
        if (version.sampleRateHz !== undefined) expect(version.sampleRateHz).toBeGreaterThan(0);
      }
    }
    expect(JSON.stringify(songProduction)).not.toMatch(/\bsuno\b|\bai\b|drive\.google|[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}|\/workspace\/|C:\\\\/i);
  });

  it("keeps an above-scale studio peak visible without clamping or turning a target into a reading", () => {
    const { container } = render(<SongProductionProcess song={songs.find((entry) => entry.slug === "beat-between-our-years")!}/>);
    expect(screen.getByRole("img", { name: /True peak.*Modern master · version 2: 3.3 dBTP/ })).toBeInTheDocument();
    expect(screen.getByText(/targeted −8 LUFS; the studio’s measured result is −8.4 LUFS/)).toBeInTheDocument();
    for (const point of container.querySelectorAll<HTMLElement>(".sp-meter__point")) {
      expect(parseFloat(point.style.left)).toBeGreaterThanOrEqual(0);
      expect(parseFloat(point.style.left)).toBeLessThanOrEqual(100);
    }
  });

  it("retains uncertain identity and unknown source format instead of silently certifying a public master", () => {
    render(<SongProductionProcess song={songs.find((entry) => entry.slug === "that-spark")!}/>);
    expect(screen.getByText(/this candidate’s exact relationship.*remains unconfirmed/)).toBeInTheDocument();
    expect(songProduction["that-spark"].versions[0].bitDepth).toBeUndefined();
    expect(songProduction["hanging-on"].versions.every((version) => version.loudnessRangeLu === undefined)).toBe(true);
    expect(songProduction["beat-drop-original"].scope).toMatch(/same studio import.*not a separate measurement/);
  });

  it("shows both measured range and calculated peak distance, including on a single-version page", () => {
    const { container } = render(<SongProductionProcess song={songs.find((entry) => entry.slug === "neon-house-of-glass")!}/>);
    expect(screen.getAllByRole("img")).toHaveLength(4);
    expect(screen.getByRole("img", { name: /Loudness range.*6.9 LU/ })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /Peak-to-loudness distance.*10.6 dB/ })).toBeInTheDocument();
    expect(container.querySelector(".sp-table")?.textContent).toContain("10.6 dB");
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });

  it("compares distinct versions, reports the correct physical differences, and reverses the direction", () => {
    render(<SongProductionProcess song={songs.find((entry) => entry.slug === "loop-in-control")!}/>);
    const status = within(screen.getByRole("status"));
    expect(status.getByText("+8.9")).toBeInTheDocument();
    expect(status.getByText("+5.9")).toBeInTheDocument();
    expect(status.getByText("+0.8")).toBeInTheDocument();
    expect(status.getByText("−3.0")).toBeInTheDocument();
    expect(status.queryByText("LUFS")).not.toBeInTheDocument();
    const compared = screen.getByRole("combobox", { name: "Compared version" });
    expect(within(compared).getByRole("option", { name: "Original source" })).toBeDisabled();
    fireEvent.change(compared, { target: { value: "stereo-12" } });
    expect(status.getByText("+2.4")).toBeInTheDocument();
    expect(status.getByText("+0.6")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Swap versions" }));
    expect(screen.getByRole("combobox", { name: "Reference version" })).toHaveValue("stereo-12");
    expect(compared).toHaveValue("source");
    expect(status.getByText("−2.4")).toBeInTheDocument();
    expect(status.getByText("−0.6")).toBeInTheDocument();
  });

  it("uses the newly verified intermediate readings and displays a real zero without a misleading sign", () => {
    render(<SongProductionProcess song={songs.find((entry) => entry.slug === "loop-in-control")!}/>);
    fireEvent.change(screen.getByRole("combobox", { name: "Compared version" }), { target: { value: "enhancement-8" } });
    const status = within(screen.getByRole("status"));
    expect(status.getAllByText("+4.7")).toHaveLength(2);
    expect(status.getByText("0.0")).toBeInTheDocument();
    expect(status.queryByText("−0.0")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Swap versions" }));
    expect(status.getByText("0.0")).toBeInTheDocument();
    expect(status.queryByText("−0.0")).not.toBeInTheDocument();
  });

  it("attributes saved processing to the recorded input without making every version a serial chain", () => {
    const { container } = render(<SongProductionProcess song={songs.find((entry) => entry.slug === "loop-in-control")!}/>);
    const records = [...container.querySelectorAll(".sp-processing__list > li")];
    expect(records).toHaveLength(3);
    expect(records.find((record) => record.querySelector("h4")?.textContent === "Modern master · 8.1")?.textContent).toContain("Source versionEnhancement · version 8");
    expect(records.find((record) => record.querySelector("h4")?.textContent === "Stereo version · 12")?.textContent).toContain("Source versionOriginal source");
    expect(records.find((record) => record.querySelector("h4")?.textContent === "Enhancement · version 8")?.textContent).toContain("Source versionOriginal source");
    expect(container.querySelector('time[datetime="2026-10-27"]')).toBeInTheDocument();
  });

  it("preserves PCM precision and omits unavailable range differences", () => {
    render(<SongProductionProcess song={songs.find((entry) => entry.slug === "hanging-on")!}/>);
    fireEvent.change(screen.getByRole("combobox", { name: "Compared version" }), { target: { value: "decoded-stream" } });
    fireEvent.change(screen.getByRole("combobox", { name: "Reference version" }), { target: { value: "matched-master" } });
    const status = within(screen.getByRole("status"));
    expect(status.getByText("−0.06")).toBeInTheDocument();
    expect(status.getByText("+0.83")).toBeInTheDocument();
    expect(status.getByText("+0.89")).toBeInTheDocument();
    expect(status.queryByText("Loudness range")).not.toBeInTheDocument();
  });

  it("does not infer a missing range or add precision when the two records have different precision", () => {
    const original = songProduction["loop-in-control"];
    const data = { ...original, versions: [
      { ...original.versions[0], integratedLufs: -17.04, truePeakDbtp: -4.10, loudnessRangeLu: undefined, provenance: "PCM comparison" as const },
      original.versions[1],
    ] };
    render(<ProductionMetrics data={data} id="mixed-precision"/>);
    const status = within(screen.getByRole("status"));
    expect(status.getByText("+8.9")).toBeInTheDocument();
    expect(status.queryByText("+8.94")).not.toBeInTheDocument();
    expect(status.queryByText("Loudness range")).not.toBeInTheDocument();
    expect(screen.getByRole("img", { name: /^Loudness range/ })).toBeInTheDocument();
  });

  it("isolates comparison state in simultaneous page/dialog instances and resets when the song changes", () => {
    const loop = songs.find((entry) => entry.slug === "loop-in-control")!;
    const hanging = songs.find((entry) => entry.slug === "hanging-on")!;
    const { container, rerender } = render(<><SongProductionProcess song={loop}/><SongProductionProcess song={loop} sectionId="dialog-process"/></>);
    const references = screen.getAllByRole("combobox", { name: "Reference version" });
    fireEvent.click(screen.getAllByRole("button", { name: "Swap versions" })[1]);
    expect(references[0]).toHaveValue("source");
    expect(references[1]).toHaveValue("modern-8-1");
    const ids = Array.from(container.querySelectorAll("[id]"), (element) => element.id);
    expect(new Set(ids).size).toBe(ids.length);
    rerender(<SongProductionProcess song={hanging}/>);
    expect(screen.getByRole("combobox", { name: "Reference version" })).toHaveValue("earlier-source");
    expect(screen.getByRole("combobox", { name: "Compared version" })).toHaveValue("matched-master");
  });
});
