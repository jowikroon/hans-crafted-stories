/** Public production notes. Every number belongs to a named, observed version. */
export interface ProductionVersion {
  key: string;
  label: string;
  provenance: "Neural Analog Studio" | "Archive measurement" | "PCM comparison";
  measuredOn: string;
  integratedLufs: number;
  truePeakDbtp: number;
  loudnessRangeLu?: number;
  sampleRateHz?: number;
  bitDepth?: number;
  channels?: "Stereo";
  durationSeconds?: number;
}

export interface ProductionStep {
  title: string;
  text: string;
}

export interface SongProduction {
  title: string;
  intro: string;
  scope: string;
  versions: ProductionVersion[];
  steps: ProductionStep[];
  method: string[];
}

export const STUDIO_REVIEW_DATE = "2026-11-04";

const studioMethod = [
  "The studio readings were checked in Neural Analog on 4 November 2026, after the selected version finished loading. They are the service’s displayed measurements; no new processing was started for this page.",
  "LUFS measures overall loudness. True peak estimates the highest reconstructed peak. Loudness range describes variation across the recording. These measures describe different things and do not rate musical quality.",
  "A value above 0 dBTP indicates a reconstructed peak above digital full scale. It is a reason to check the export and playback path, not proof that every listener hears distortion.",
];

const studioScope = "These are named versions from the studio session. The player above carries the public recording; a match between that stream and these studio files has not been established.";

export const songProduction: Record<string, SongProduction> = {
  "beat-drop": {
    title: "Before the drop.",
    intro: "The studio keeps an imported version of Beat Drop alongside its release story. These readings put numbers beside the recording’s energy and the space around its peaks.",
    scope: studioScope,
    versions: [{ key: "studio-import", label: "Studio import", provenance: "Neural Analog Studio", measuredOn: STUDIO_REVIEW_DATE, integratedLufs: -13.5, truePeakDbtp: -1.4, loudnessRangeLu: 5.1, sampleRateHz: 48000, channels: "Stereo" }],
    steps: [
      { title: "The saved source", text: "The studio record contains an imported MP3 of Beat Drop. Its file label is kept separate from the official release identity." },
      { title: "Measure the movement", text: "The imported stereo file reports a 5.1 LU loudness range. That describes variation through this version, rather than a quality score." },
      { title: "Listen for the beginning", text: "Return to the moment when the rhythm takes hold. The anticipation is part of the song as much as the arrival." },
    ],
    method: studioMethod,
  },
  "beat-drop-original": {
    title: "The studio reference.",
    intro: "The Beat Drop session keeps a named stereo import beside the song’s release history. Its measurements provide a reference for exploring the recording’s loudness and movement.",
    scope: "This is the same studio import shown on the Beat Drop release page, not a separate measurement of the SoundCloud version. Its exact match to either public stream has not been established.",
    versions: [{ key: "studio-import", label: "Beat Drop · shared studio import", provenance: "Neural Analog Studio", measuredOn: STUDIO_REVIEW_DATE, integratedLufs: -13.5, truePeakDbtp: -1.4, loudnessRangeLu: 5.1, sampleRateHz: 48000, channels: "Stereo" }],
    steps: [
      { title: "Keep the version in view", text: "This page carries the original public SoundCloud recording. The measurement record comes from a separately imported MP3 named Beat Drop." },
      { title: "Read the studio reference", text: "The stereo import is stored at 48 kHz. Its overall loudness, highest reconstructed peak and loudness range are shown below." },
      { title: "Follow the release history", text: "The original upload and the official release remain separate listening destinations. The shared studio reference does not establish that their audio is identical." },
    ],
    method: studioMethod,
  },
  "neon-house-of-glass": {
    title: "The recording behind the glow.",
    intro: "A voice reaches outward while the room stays quiet. The studio import gives a closer view of the recording’s level, peak space and changing intensity.",
    scope: studioScope,
    versions: [{ key: "studio-import", label: "Studio import · remastered version", provenance: "Neural Analog Studio", measuredOn: STUDIO_REVIEW_DATE, integratedLufs: -13.9, truePeakDbtp: -3.3, loudnessRangeLu: 6.9, sampleRateHz: 48000, channels: "Stereo" }],
    steps: [
      { title: "The saved recording", text: "The session contains an imported MP3 labelled as a remastered version of Neon House of Glass." },
      { title: "A measured view", text: "The studio reports a stereo recording at 48 kHz. Its loudness and peak readings are shown together below." },
      { title: "Return to the song", text: "Listen for the distance between the outward energy of the music and the voice reaching for someone close." },
    ],
    method: studioMethod,
  },
  "loop-in-control": {
    title: "A loop, with room to move.",
    intro: "The same session holds an earlier source, a saved Modern master and a later stereo version. Comparing their readings shows how level and dynamic space change between those choices.",
    scope: studioScope,
    versions: [
      { key: "source", label: "Original source", provenance: "Neural Analog Studio", measuredOn: STUDIO_REVIEW_DATE, integratedLufs: -17.0, truePeakDbtp: -4.1, loudnessRangeLu: 5.7, sampleRateHz: 48000, bitDepth: 16, channels: "Stereo" },
      { key: "modern-8-1", label: "Modern master · 8.1", provenance: "Neural Analog Studio", measuredOn: STUDIO_REVIEW_DATE, integratedLufs: -8.1, truePeakDbtp: 1.8, loudnessRangeLu: 6.5, sampleRateHz: 44100, bitDepth: 24, channels: "Stereo" },
      { key: "stereo-12", label: "Stereo version · 12", provenance: "Neural Analog Studio", measuredOn: STUDIO_REVIEW_DATE, integratedLufs: -14.6, truePeakDbtp: -1.1, loudnessRangeLu: 6.9, sampleRateHz: 44100, bitDepth: 24, channels: "Stereo" },
    ],
    steps: [
      { title: "Start with the source", text: "The original stereo source is preserved at 48 kHz and 16-bit. It gives the session a reference to return to." },
      { title: "Explore the versions", text: "The saved session includes Modern and Techno mastering versions, separate instrument stems and a later stereo treatment. They remain distinct versions." },
      { title: "Compare the space", text: "The Modern master reads louder and has a higher true peak than the earlier source. The stereo version sits at a lower overall level. Listening decides which movement best serves the song." },
    ],
    method: studioMethod,
  },
  "78-thz-texture": {
    title: "Texture, under the surface.",
    intro: "An original stereo source and a saved enhancement sit together in the session. Their readings show a small change in overall level and a different peak boundary.",
    scope: studioScope,
    versions: [
      { key: "source", label: "Original source", provenance: "Neural Analog Studio", measuredOn: STUDIO_REVIEW_DATE, integratedLufs: -15.0, truePeakDbtp: -2.9, loudnessRangeLu: 5.9, sampleRateHz: 48000, bitDepth: 16, channels: "Stereo" },
      { key: "enhancement-1", label: "Enhancement · version 1", provenance: "Neural Analog Studio", measuredOn: STUDIO_REVIEW_DATE, integratedLufs: -14.8, truePeakDbtp: -2.0, loudnessRangeLu: 6.0, sampleRateHz: 48000, bitDepth: 24, channels: "Stereo" },
    ],
    steps: [
      { title: "Preserve the source", text: "The original stereo file is saved at 48 kHz and 16-bit. Its measurements form the first reference in this session." },
      { title: "Revisit the texture", text: "A saved enhancement is available at 48 kHz and 24-bit. It is shown as its own studio version, with its own readings." },
      { title: "Look at the difference", text: "The enhancement reads 0.2 LU louder overall, with a true peak 0.9 dB higher. Its loudness range changes from 5.9 to 6.0 LU. These differences invite a listening comparison." },
    ],
    method: studioMethod,
  },
  "with-a-grin": {
    title: "Inside the stem mix.",
    intro: "The saved stem mix and a later enhancement offer two views of With a Grin. The measurements make the shift in level and dynamic movement visible.",
    scope: studioScope,
    versions: [
      { key: "stem-mix-source", label: "Original stem mix", provenance: "Neural Analog Studio", measuredOn: STUDIO_REVIEW_DATE, integratedLufs: -10.7, truePeakDbtp: 0.1, loudnessRangeLu: 4.2, sampleRateHz: 96000, bitDepth: 24, channels: "Stereo" },
      { key: "enhancement-3-1", label: "Enhancement · version 3.1", provenance: "Neural Analog Studio", measuredOn: STUDIO_REVIEW_DATE, integratedLufs: -10.3, truePeakDbtp: 0.4, loudnessRangeLu: 3.2, sampleRateHz: 44100, bitDepth: 24, channels: "Stereo" },
    ],
    steps: [
      { title: "Open the stem mix", text: "The session starts from a stereo file named With a Grin (Stem Mix), saved at 96 kHz and 24-bit." },
      { title: "Keep the treatments separate", text: "The saved session contains enhancement, restoration and denoising versions. The comparison here uses the original import and enhancement version 3.1." },
      { title: "Check the movement", text: "The later version reads 0.4 LU louder overall, while its loudness range is 1.0 LU smaller. Both report a positive reconstructed true peak, which calls for a check of the export and playback path." },
    ],
    method: studioMethod,
  },
  "that-spark": {
    title: "A session under its earlier title.",
    intro: "That Spark’s public address retains the title Pressure. A historical studio session named Pressure (Remastered x2) contains an imported source and a saved high-frequency restoration.",
    scope: "These measurements belong to a historical Pressure (Remastered x2) studio candidate. The public title alias is confirmed, but this candidate’s exact relationship to That Spark’s public recording remains unconfirmed.",
    versions: [
      { key: "pressure-source", label: "Pressure candidate · source", provenance: "Neural Analog Studio", measuredOn: STUDIO_REVIEW_DATE, integratedLufs: -12.7, truePeakDbtp: -1.2, loudnessRangeLu: 5.2, sampleRateHz: 48000, channels: "Stereo" },
      { key: "pressure-restoration-1", label: "Pressure candidate · restoration 1", provenance: "Neural Analog Studio", measuredOn: STUDIO_REVIEW_DATE, integratedLufs: -12.9, truePeakDbtp: -0.2, loudnessRangeLu: 5.1, sampleRateHz: 48000, bitDepth: 24, channels: "Stereo" },
    ],
    steps: [
      { title: "Trace the earlier name", text: "The public recording uses That Spark as its title and retains Pressure in its address. Several studio versions share that earlier name, so the source identity remains open." },
      { title: "Read the saved treatment", text: "This candidate’s restoration was saved on 3 August 2026 and explicitly names its original source. It applies high-frequency restoration to the whole track, using mid/side processing and a medium setting with an 8 kHz boundary." },
      { title: "Compare within the session", text: "The source and restoration can be compared as studio versions. Their numbers are not attributed to the public stream without an audio identity check." },
    ],
    method: studioMethod,
  },
  "beat-between-our-years": {
    title: "The space between the beats.",
    intro: "A saved restored-mix session holds an original import and a Modern master. Their readings show how a mastering choice can change overall level while the song keeps its movement.",
    scope: studioScope,
    versions: [
      { key: "restored-mix-source", label: "Restored-mix session · source", provenance: "Neural Analog Studio", measuredOn: STUDIO_REVIEW_DATE, integratedLufs: -14.0, truePeakDbtp: -0.9, loudnessRangeLu: 9.2, sampleRateHz: 96000, bitDepth: 24, channels: "Stereo" },
      { key: "modern-master-2", label: "Modern master · version 2", provenance: "Neural Analog Studio", measuredOn: STUDIO_REVIEW_DATE, integratedLufs: -8.4, truePeakDbtp: 3.3, loudnessRangeLu: 8.7, sampleRateHz: 48000, bitDepth: 24, channels: "Stereo" },
    ],
    steps: [
      { title: "Keep the mix as a reference", text: "The original import in this restored-mix session is a 96 kHz, 24-bit stereo file. It provides the reference for this version comparison." },
      { title: "Read the saved master", text: "The Modern master was saved on 2 October 2026 from that original import, with the whole track selected. Its setting targeted −8 LUFS; the studio’s measured result is −8.4 LUFS." },
      { title: "Review the peak space", text: "The master reads 5.6 LU louder overall and reports a +3.3 dBTP reconstructed peak. That reading needs an export and playback check before treating this studio version as a finished delivery master." },
    ],
    method: studioMethod,
  },
  "hanging-on": {
    title: "The versions, in numbers.",
    intro: "The earlier source, the archived master matched to the public stream, and the decoded streaming version each tell a different part of the same recording’s journey.",
    scope: "The archived master was matched to the public recording at six points. The earlier source is the same performance. The streaming reading includes the effect of its delivery format.",
    versions: [
      { key: "earlier-source", label: "Earlier source", provenance: "PCM comparison", measuredOn: "2026-11-03", integratedLufs: -15.37, truePeakDbtp: -4.40, sampleRateHz: 48000, bitDepth: 16, channels: "Stereo" },
      { key: "matched-master", label: "Matched archive master", provenance: "PCM comparison", measuredOn: "2026-11-03", integratedLufs: -7.73, truePeakDbtp: 0.17, sampleRateHz: 48000, bitDepth: 24, channels: "Stereo" },
      { key: "decoded-stream", label: "Decoded public stream", provenance: "PCM comparison", measuredOn: "2026-11-03", integratedLufs: -7.79, truePeakDbtp: 1.00, channels: "Stereo" },
    ],
    steps: [
      { title: "Find the same performance", text: "The archived master was compared with the public stream at six points across the recording. An earlier source from that performance was recovered." },
      { title: "Compare at equal loudness", text: "For the timeline and frequency graphs, both lossless versions were matched to −18 LUFS. The summary meters below retain their measured original levels." },
      { title: "Keep the next choice open", text: "The source comparison guides the next listening pass. It does not announce a selected new remaster." },
    ],
    method: ["Full-mix PCM analysis dated 3 November 2026. The decoded stream true peak was also checked with 16× FIR reconstruction. Summary readings are original levels; the timeline comparison uses loudness-matched levels.", "Peak-to-loudness distance is calculated as true peak minus integrated loudness. It is an overall distance in dB, distinct from the short-window RMS crest chart and from loudness range."],
  },
};

/** Use only when the route has no verified per-version production record. */
export function recordingNotes(title: string, duration: string, provider: "spotify" | "soundcloud"): SongProduction {
  return {
    title: "A closer listen.",
    intro: `Stay with ${title} for ${duration}. The recording, its notes and the space around them are here to explore at your own pace.`,
    scope: "A measured studio comparison for this exact recording is not available here yet.",
    versions: [],
    steps: [
      { title: "The recording", text: `The player opens the ${provider === "spotify" ? "official Spotify release" : "public SoundCloud recording"} linked to this song.` },
      { title: "The details that return", text: "Follow a phrase, a rhythmic change or a quieter passage. Notice what feels different when it comes back." },
      { title: "Your own reading", text: "The notes offer a starting point. What the song brings to mind is yours to decide." },
    ],
    method: [],
  };
}
