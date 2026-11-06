# Hans-crafted-stories: operational contract for code agents

This file is for Claude, Codex, OpenClaw and other coding agents working on this repository. Read `CLAUDE.md` and the relevant feature contract before editing. User instructions and safety policies take precedence.

## JOWIKROON music / album interaction (protected)
- Source of truth: `docs/music-album-motion-contract.md` and `docs/music-album-artwork-reveal.md`.
- Do not silently replace the two interactive album sleeves with static covers, rearrange the approved artwork, remove the flip transform, flatten the accelerating track reveal, or hide the reveal on IETS MOOIS.
- For regular motion settings: 760 ms 3D flip, then 9 ordered row timings beginning at 920 ms and accelerating. The five-row IETS MOOIS sleeve teaser uses the same start of the sequence; its album page separately shows 12 planned positions.
- On 2026-11-06, Hans approved **two distinct groups** of four private SoundCloud **website previews** for public website playback and GitHub source disclosure: the first four selected for IETS MOOIS and the first four from the `NEON Official` playlist. These are shareable private-link recordings, not official distributed singles. Do not embed either entire private playlist, publish other tokens, or conflate preview order with definitive LP order. IETS MOOIS's other eight planned titles and owner-only data must not enter the public DOM; its sleeve's five teaser slots stay anonymous. The NEON sleeve retains only its two confirmed official public titles and anonymous other slots.
- Keyboard, Escape focus restoration, reduced motion, mobile/touch and a direct link below the artwork are mandatory.
- `apps/personal/src/components/music/AlbumSleeve.test.tsx` is a hard guard: keep it green, or stop and repair it. Do not weaken or remove it to make CI pass.

## Safe release workflow
1. Read current `main` and existing open PRs; make the smallest branch-scoped change.
2. Include a regression test for every discovered UI failure. Check all relevant album routes.
3. Confirm exact-commit CI gates: lint, typecheck, tests and production build. No skipping or bypassing checks.
4. If checks are green and there is no blocking review/conflict, follow the repository's `CLAUDE.md` merge procedure. Verify exact merge commit and production Vercel deployment.
5. Distinguish code saved, PR opened, CI tested, merged, deployed and browser-verified. Do not invent agent count, round count, browser tests or successful writes.
6. Record the task and evidence in the authorized HansOS vault inbox when available; keep history and private source material private.
