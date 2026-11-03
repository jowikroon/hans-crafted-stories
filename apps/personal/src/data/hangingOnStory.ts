/** Public, source-grounded story for Hanging On. Analysis dated 3 November 2026. */
export const hangingOnStory = {
  eyebrow: "Inside the recording",
  title: "Keeping its force.",
  intro: "I wanted to give the voice more room while keeping its force against the music. Comparing the audio traced the SoundCloud upload to an existing loud master, then recovered an earlier, quieter source from the same performance.",
  chapters: [
    {
      id: "shape",
      title: "The shape stays.",
      body: "With overall loudness matched, the broad rise and fall of the two versions stays close. The build still arrives. The quieter passages still make space. Those movements are part of the song's pull.",
      caption: "Both versions are matched to −18 LUFS. The two lines show the full mix's level through the recording, including voice and instruments.",
    },
    {
      id: "peaks",
      title: "Room around the peaks.",
      body: "The earlier source generally leaves more distance between an attack and the body of the sound. That gives the next mastering pass room to work with. The voice's place against the music remains the reference.",
      caption: "Short-term peak-to-average distance across the full mix. Listening determines how much of that space to keep.",
    },
    {
      id: "balance",
      title: "Keep the foundation.",
      body: "The low end carries much of the recording's energy. The measurements did not point to a need for a broad bass cut. The closer checks are local: the dense stretch from 3:30 to 4:00, the upper-midrange around 2:11, and narrow high-frequency peaks already present in the earlier source.",
      caption: "At matched loudness, positive values mean more band energy in the existing master; negative values mean less. These are full-mix measurements.",
    },
  ],
  closing: "Keep the voice present, the bass grounded and the pauses intact. These graphs document the analysis stage and guide the next listening comparison. A new remaster has not yet been selected.",
  method: {
    title: "About these measurements",
    paragraphs: [
      "Analysis dated 3 November 2026. The existing master was matched to the public SoundCloud stream at six points across the recording. The comparison uses that WAV and the recovered earlier source from the same performance.",
      "LUFS describes measured overall loudness. Both versions were brought to −18 LUFS for these comparisons so the louder version would not have an automatic advantage. Peak space is the distance between short peaks and the surrounding average level.",
      "The measurements describe the complete mix and cannot isolate the singer, bass or other instruments. Audible distortion and improvements in sound quality still require listening. The player above carries the existing public SoundCloud recording.",
    ],
  },
} as const;
