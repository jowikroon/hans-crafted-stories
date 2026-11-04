import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { songs } from "@/data/music";
import { songProduction } from "@/data/songProduction";
import { SongProductionProcess } from "./SongProductionProcess";

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
});
