// ArtistRadarVisual: the animated Artist Radar disc from the Claude Design
// "Artist Radar Clean" file, ported 1:1 (markup + rAF logic) and recoloured
// onto the music page's neon-green palette (.music-neon tokens). Purely
// decorative: no state, no form. Used on /music, section 03 Artist Radar.
import { useEffect, useRef } from "react";

// Palette: everything that was copper/cyan/red in the design maps onto the
// site's single neon green. "Hot" ramps go white -> pale lime -> neon -> dark.
const NEON = "#C6FF34";
const HOT_WHITE = "#FFFFFF";
const PALE = "#EFFFC4";
const DEEP = "#5C8A00";
const SCORCH = "#1E2E05";
const RAMP: Record<string, [number, string][]> = {
  // outer burn (was red): slightly warmer lime, biased outward beyond the rim
  hot: [[0.16, HOT_WHITE], [0.42, "#E4FF7A"], [0.75, "#8FC41A"], [1, "#2A3F08"]],
  // inner discharge (was blue): the core neon
  core: [[0.16, PALE], [0.42, NEON], [0.75, DEEP], [1, SCORCH]],
  fine: [[1, PALE]],
};

const STYLE = `
.arv{position:relative;width:min(300px,64vw);aspect-ratio:1;margin:34px auto;
  --arv-neon:${NEON};
  --arv-soft:rgba(198,255,52,.10);
  --arv-line:rgba(198,255,52,.34);
  --arv-hair:rgba(255,255,255,.075);
  --arv-hair-2:rgba(255,255,255,.05);
  --arv-muted:#86868F;
}
.arv *{box-sizing:border-box}
@keyframes arv-sweep{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
.arv .arv-spin{animation:arv-sweep 60s linear infinite;transform-origin:50% 50%}
@media (prefers-reduced-motion:reduce){.arv .arv-spin{animation:none}}
`;

const MARKUP = `
<div class="arv-tubes" style="position:absolute;left:50%;top:-30px;transform:translateX(-50%);height:38px;display:flex;align-items:flex-end;gap:9px;pointer-events:none">
  <div class="neon-a" style="width:3px;height:22px;border-radius:2px;background:var(--arv-neon);opacity:.35;will-change:opacity,box-shadow"></div>
  <div class="neon-b" style="width:3px;height:32px;border-radius:2px;background:var(--arv-neon);opacity:.35;will-change:opacity,box-shadow"></div>
</div>
<div style="position:absolute;inset:-30px;pointer-events:none;color:var(--arv-muted)">
  <span style="position:absolute;right:0;top:50%;transform:translate(4px,-50%);font-size:10px;font-weight:700;letter-spacing:.18em;opacity:.62">O</span>
  <span style="position:absolute;bottom:0;left:50%;transform:translate(-50%,2px);font-size:10px;font-weight:700;letter-spacing:.18em;opacity:.62">Z</span>
  <span style="position:absolute;left:0;top:50%;transform:translate(-4px,-50%);font-size:10px;font-weight:700;letter-spacing:.18em;opacity:.62">W</span>
  <svg viewBox="0 0 488 488" style="position:absolute;inset:0;width:100%;height:100%">
    <g stroke="var(--arv-line)" stroke-width="1" stroke-linecap="round" fill="none">
      <line x1="244" y1="16" x2="244" y2="27"></line>
      <line x1="472" y1="244" x2="461" y2="244"></line>
      <line x1="244" y1="472" x2="244" y2="461"></line>
      <line x1="16" y1="244" x2="27" y2="244"></line>
    </g>
    <g stroke="var(--arv-hair)" stroke-width="1" stroke-linecap="round" fill="none" opacity=".8">
      <line x1="313.6" y1="30.7" x2="309.1" y2="41.1"></line>
      <line x1="457.3" y1="174.4" x2="446.9" y2="178.9"></line>
      <line x1="457.3" y1="313.6" x2="446.9" y2="309.1"></line>
      <line x1="313.6" y1="457.3" x2="309.1" y2="446.9"></line>
      <line x1="174.4" y1="457.3" x2="178.9" y2="446.9"></line>
      <line x1="30.7" y1="313.6" x2="41.1" y2="309.1"></line>
      <line x1="30.7" y1="174.4" x2="41.1" y2="178.9"></line>
      <line x1="174.4" y1="30.7" x2="178.9" y2="41.1"></line>
    </g>
  </svg>
</div>
<div class="wood-ring" style="position:absolute;inset:-13px;border-radius:50%;background:repeating-radial-gradient(circle at 50% 50%, #17171B 0px, #1F1F24 1.5px, #2A2A30 3px, #1C1C21 4.5px, #17171B 6px), repeating-conic-gradient(from 0deg at 50% 50%, rgba(0,0,0,.18) 0deg, rgba(255,255,255,.05) 3deg, rgba(0,0,0,.12) 7deg);mask:radial-gradient(circle, transparent calc(100% - 15px), #000 calc(100% - 14px), #000 100%);-webkit-mask:radial-gradient(circle, transparent calc(100% - 15px), #000 calc(100% - 14px), #000 100%);opacity:.6;box-shadow:inset 0 0 8px rgba(0,0,0,.55), 0 1px 3px rgba(0,0,0,.4);will-change:transform"></div>
<div class="arv-spin" style="position:absolute;inset:-13px;border-radius:50%;pointer-events:none;mix-blend-mode:screen">
  <div class="wood-glow" style="position:absolute;top:-6px;left:50%;width:64px;height:64px;transform:translateX(-50%);border-radius:50%;background:radial-gradient(circle, rgba(239,255,196,.6), rgba(198,255,52,.35) 45%, transparent 70%);filter:blur(3px)"></div>
</div>
<div class="radar-halo halo-a" style="position:absolute;inset:-18px;border-radius:50%;border:1px solid var(--arv-line);opacity:0;will-change:transform,opacity"></div>
<div class="radar-halo halo-b" style="position:absolute;inset:-18px;border-radius:50%;border:1px solid var(--arv-line);opacity:0;will-change:transform,opacity"></div>
<div class="radar-disc" style="position:absolute;inset:0;border-radius:50%;background:radial-gradient(circle,var(--arv-soft),transparent 72%);border:1px solid var(--arv-line);will-change:transform">
  <div class="radar-ring ring-a" style="position:absolute;inset:17%;border-radius:50%;border:1px solid var(--arv-hair-2);will-change:transform;transform-origin:50% 50%"></div>
  <div class="radar-ring ring-b" style="position:absolute;inset:34%;border-radius:50%;border:1px solid var(--arv-hair-2);will-change:transform;transform-origin:50% 50%"></div>
  <svg viewBox="0 0 420 420" style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none">
    <defs>
      <radialGradient id="arvBeatGlow" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stop-color="${NEON}" stop-opacity=".26"></stop>
        <stop offset=".6" stop-color="${NEON}" stop-opacity="0"></stop>
      </radialGradient>
    </defs>
    <circle class="radar-beat-glow" cx="210" cy="210" r="200" fill="url(#arvBeatGlow)" opacity="0"></circle>
    <g class="burn-layer-hot" style="filter:drop-shadow(0 0 1.4px #E4FF7A) drop-shadow(0 0 3px #6E9A00)"></g>
    <g class="burn-layer" style="filter:drop-shadow(0 0 1.4px ${NEON}) drop-shadow(0 0 3px ${DEEP})"></g>
    <g class="hub-power" stroke="${PALE}" fill="none" stroke-linecap="round" stroke-linejoin="round" style="filter:drop-shadow(0 0 2px ${NEON})">
      <circle class="hub-core-ring" cx="210" cy="210" r="16" stroke="${PALE}" stroke-width="1.3" opacity="0"></circle>
      <path class="hub-arc hub-arc-0" stroke-width="1.1" opacity="0"></path>
      <path class="hub-arc hub-arc-1" stroke-width="1.0" opacity="0"></path>
      <path class="hub-arc hub-arc-2" stroke-width="0.9" opacity="0"></path>
      <path class="hub-arc hub-arc-3" stroke-width="0.8" opacity="0"></path>
      <path class="hub-arc hub-arc-4" stroke-width="0.75" opacity="0"></path>
      <path class="hub-arc hub-arc-5" stroke-width="0.7" opacity="0"></path>
    </g>
  </svg>
  <div class="arv-spin radar-arm" style="position:absolute;inset:0;border-radius:50%">
    <div style="position:absolute;inset:0;border-radius:50%;background:conic-gradient(from 230deg, transparent 0deg, var(--arv-soft) 60deg, var(--arv-line) 126deg, transparent 132deg);mask:radial-gradient(circle, transparent 2%, #000 4%, #000 92%, transparent 98%);-webkit-mask:radial-gradient(circle, transparent 2%, #000 4%, #000 92%, transparent 98%);opacity:.8"></div>
    <svg viewBox="0 0 420 420" style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none;overflow:visible">
      <defs>
        <linearGradient id="arvEcgFade" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stop-color="${NEON}" stop-opacity=".1"></stop>
          <stop offset=".35" stop-color="${NEON}" stop-opacity=".3"></stop>
          <stop offset=".75" stop-color="${NEON}" stop-opacity=".75"></stop>
          <stop offset="1" stop-color="${NEON}" stop-opacity=".95"></stop>
        </linearGradient>
      </defs>
      <path class="ecg-line" d="M210,210 L210,0" fill="none" stroke="url(#arvEcgFade)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"></path>
      <circle class="neon-tip-glow" cx="210" cy="5" r="9" fill="${NEON}" opacity="0.35" style="filter:blur(4px)"></circle>
      <circle class="neon-tip" cx="210" cy="5" r="3.4" fill="${PALE}" style="filter:drop-shadow(0 0 6px ${NEON}) drop-shadow(0 0 12px #9BE000)"></circle>
      <g class="tip-sparks" stroke-linecap="round"></g>
    </svg>
  </div>
  <div style="position:absolute;left:50%;top:50%;width:38px;height:38px;margin:-19px;border-radius:50%;pointer-events:none;display:grid;place-items:center;z-index:9">
    <div class="radar-hub" style="width:13px;height:13px;border-radius:50%;background:var(--arv-neon);box-shadow:0 0 16px var(--arv-line);will-change:transform"></div>
  </div>
  <div class="radar-blip" style="position:absolute;left:62%;top:30%;transform:translate(-50%,-50%);will-change:transform"><div style="width:11px;height:11px;border-radius:50%;background:${NEON};box-shadow:0 0 12px ${NEON}99;outline:2px solid ${NEON}55;outline-offset:2px"></div></div>
  <div class="radar-blip" style="position:absolute;left:34%;top:58%;transform:translate(-50%,-50%);will-change:transform"><div style="width:9px;height:9px;border-radius:50%;background:#9BE000;box-shadow:0 0 12px #9BE00099"></div></div>
  <div class="radar-blip" style="position:absolute;left:70%;top:68%;transform:translate(-50%,-50%);will-change:transform"><div style="width:6.5px;height:6.5px;border-radius:50%;background:#6F9A1A;box-shadow:0 0 12px #6F9A1A99"></div></div>
</div>
`;

type Spark = { el: SVGLineElement; born: number; life: number; ang: number; spd: number; len: number };
type Spore = { el: SVGRectElement; born: number; life: number; base: number; sz: number; _c?: string | null };

function startAnim(root: HTMLElement): () => void {
  const BEAT = 3400;
  const start = performance.now();
  const q = <T extends Element = HTMLElement>(sel: string) => root.querySelector(sel) as T | null;
  const NS = "http://www.w3.org/2000/svg";
  let raf = 0;
  let ringT = 0;
  const spring = { x: 0, v: 0 };
  let sparks: Spark[] = [];
  let sparkLast = 0;
  let spores: { core: Spore[]; hot: Spore[]; fine: Spore[]; last: number } | null = null;

  const beatAt = (ms: number) => {
    const ph = ((ms - start) % BEAT) / BEAT;
    const lub = Math.exp(-Math.pow((ph - 0.03) / 0.045, 2));
    const dub = 0.6 * Math.exp(-Math.pow((ph - 0.2) / 0.06, 2));
    return Math.max(lub, dub);
  };

  const tick = () => {
    const now = performance.now();
    const t = (now - start) / 1000;
    const beat = beatAt(now);

    // ECG arm
    const line = q<SVGPathElement>(".ecg-line");
    if (line) {
      const ampMain = 0.9 + 0.35 * Math.sin(t * 0.35) + 0.18 * Math.sin(t * 0.11 + 1.3);
      const ampEcho = 0.4 + 0.25 * Math.sin(t * 0.22 + 0.7);
      let d = "M210,210";
      for (let y = 208; y >= 0; y -= 2) {
        const rp = 1 - y / 210;
        let x = 210;
        if (rp > 0.4) {
          const local = (rp - 0.4) / 0.6;
          const wave = Math.sin((local * 4 + t * 0.85) * Math.PI * 2);
          const spike = beat * Math.sin(local * Math.PI * 3.0) * 38 * ampMain;
          const wob = Math.sin(local * 10 + t * 1.2) * 1.6;
          x = 210 + wave * 7 * ampMain + spike * (1 - Math.abs(local - 0.55) * 1.1) + wob;
        } else {
          const local = rp / 0.4;
          const anchor = Math.pow(local, 0.85);
          x = 210 + (Math.sin(local * 9 - t * 1.9) * 2.4 * ampEcho
            + Math.sin(local * 4 + t * 0.75) * 1.5 * ampEcho
            + Math.sin(local * 19 + t * 2.4) * 0.7 * ampEcho
            + beat * Math.sin(local * Math.PI * 1.6) * 2.4) * anchor;
        }
        d += " L" + x.toFixed(2) + "," + y;
      }
      line.setAttribute("d", d);
      line.setAttribute("stroke-width", (2.0 + 0.9 * beat + 0.25 * Math.sin(t * 0.55)).toFixed(2));
    }

    // rings: outer static, inner breathes on a damped spring
    let dt = (now - (ringT || now)) / 1000; ringT = now; if (dt > 0.05) dt = 0.05;
    const ringA = q(".ring-a"); if (ringA && ringA.style.opacity !== "0.55") { ringA.style.transform = "scale(1)"; ringA.style.opacity = "0.55"; }
    const p = { k: 110, c: 10, m: 1.4, amp: 0.04 };
    const a = (p.k * (beat - spring.x) - p.c * spring.v) / p.m;
    spring.v += a * dt; spring.x += spring.v * dt;
    const ringB = q(".ring-b");
    if (ringB) { ringB.style.transform = "scale(" + (1 + spring.x * p.amp).toFixed(4) + ")"; ringB.style.opacity = (0.55 + Math.min(0.45, Math.abs(spring.x) * 0.5)).toFixed(3); }

    const hub = q(".radar-hub"); if (hub) hub.style.transform = "scale(" + (1 + beat * 0.26).toFixed(3) + ")";
    const glow = q(".radar-beat-glow"); if (glow) glow.setAttribute("opacity", (0.08 + beat * 0.34).toFixed(3));
    const setHalo = (sel: string, off: number) => {
      const el = q(sel); if (!el) return;
      const ph = (((now - start) % BEAT) + off * BEAT) % BEAT / BEAT;
      el.style.transform = "scale(" + (1 + ph * 0.22).toFixed(3) + ")";
      el.style.opacity = Math.max(0, 0.34 * (1 - ph) - 0.03).toFixed(3);
    };
    setHalo(".halo-a", 0); setHalo(".halo-b", 0.5);

    // twin neon tubes, offset half a beat
    const beatB = beatAt(now + 0.5 * BEAT);
    const na = q(".neon-a"), nb = q(".neon-b");
    if (na) { na.style.opacity = (0.3 + 0.4 * beat).toFixed(3); na.style.boxShadow = "0 0 " + (4 + beat * 8).toFixed(1) + "px " + (1 + beat * 1.2).toFixed(1) + "px var(--arv-neon)"; }
    if (nb) { nb.style.opacity = (0.3 + 0.4 * beatB).toFixed(3); nb.style.boxShadow = "0 0 " + (4 + beatB * 8).toFixed(1) + "px " + (1 + beatB * 1.2).toFixed(1) + "px var(--arv-neon)"; }

    // blips: gentle bob
    root.querySelectorAll<HTMLElement>(".radar-blip").forEach((b, i) => {
      const bob = 1 + 0.1 * Math.sin(t * (0.5 + i * 0.22) + i);
      b.style.transform = "translate(-50%,-50%) scale(" + bob.toFixed(3) + ")";
      b.style.opacity = (0.62 + 0.28 * (0.5 + 0.5 * Math.sin(t * (0.38 + i * 0.16) + i * 1.7))).toFixed(3);
    });

    // neon tip at the arm end
    const ntip = q<SVGCircleElement>(".neon-tip"), nglow = q<SVGCircleElement>(".neon-tip-glow"), wglow = q(".wood-glow");
    if (ntip) ntip.setAttribute("r", (3.2 + 0.7 * beat).toFixed(2));
    if (nglow) { nglow.setAttribute("opacity", (0.22 + 0.32 * beat).toFixed(3)); nglow.setAttribute("r", (8 + 2.5 * beat).toFixed(1)); }
    if (wglow) wglow.style.opacity = (0.38 + 0.22 * beat).toFixed(3);

    // cooling sparks off the tip (white-hot -> pale -> neon)
    const sg = q<SVGGElement>(".tip-sparks");
    if (sg) {
      if (!sparks.length || !sparks[0].el.isConnected) {
        sg.textContent = ""; sparks = [];
        for (let i = 0; i < 26; i++) {
          const ln = document.createElementNS(NS, "line");
          ln.setAttribute("stroke-width", "1"); ln.setAttribute("stroke-linecap", "round"); ln.setAttribute("opacity", "0");
          sg.appendChild(ln);
          sparks.push({ el: ln, born: -1e9, life: 1, ang: 0, spd: 0, len: 0 });
        }
        sparkLast = 0;
      }
      if (now - sparkLast > 45) {
        sparkLast = now;
        const bursts = 1 + (Math.random() < 0.4 + 0.5 * beat ? 1 : 0);
        for (let b = 0; b < bursts; b++) {
          const slot = sparks.find(s => now - s.born > s.life * 1000); if (!slot) continue;
          slot.born = now; slot.life = 0.35 + Math.random() * 0.5;
          slot.ang = -Math.PI / 2 + (Math.random() - 0.5) * 2.4;
          slot.spd = 14 + Math.random() * 26 + beat * 20;
          slot.len = 2.5 + Math.random() * 4;
        }
      }
      for (const s of sparks) {
        const age = (now - s.born) / 1000;
        if (age > s.life) { if (s.el.getAttribute("opacity") !== "0") s.el.setAttribute("opacity", "0"); continue; }
        const f = age / s.life;
        const dist = s.spd * age * (1 - 0.4 * f);
        const x = 210 + Math.cos(s.ang) * dist, y = 5 + Math.sin(s.ang) * dist;
        const tx = x + Math.cos(s.ang) * s.len * (1 - f), ty = y + Math.sin(s.ang) * s.len * (1 - f);
        s.el.setAttribute("x1", x.toFixed(1)); s.el.setAttribute("y1", y.toFixed(1));
        s.el.setAttribute("x2", tx.toFixed(1)); s.el.setAttribute("y2", ty.toFixed(1));
        s.el.setAttribute("stroke", f < 0.25 ? HOT_WHITE : (f < 0.6 ? PALE : NEON));
        s.el.setAttribute("opacity", (0.9 * (1 - f) * (1 - f)).toFixed(3));
      }
    }

    // burn-trail spores in the arm's wake (static layer; they stay put and fade)
    const coreG = q<SVGGElement>(".burn-layer"), hotG = q<SVGGElement>(".burn-layer-hot");
    if (coreG && hotG) {
      if (!spores || !spores.core.length || !spores.core[0].el.isConnected) {
        coreG.textContent = ""; hotG.textContent = "";
        const make = (g: SVGGElement, n: number, color: string, life: number, sz: number): Spore[] => {
          const arr: Spore[] = [];
          for (let i = 0; i < n; i++) {
            const r = document.createElementNS(NS, "rect");
            r.setAttribute("width", String(sz)); r.setAttribute("height", String(sz));
            r.setAttribute("fill", color); r.setAttribute("opacity", "0"); r.setAttribute("shape-rendering", "crispEdges");
            g.appendChild(r);
            arr.push({ el: r, born: -1e9, life, base: 0.6, sz });
          }
          return arr;
        };
        spores = { core: make(coreG, 220, NEON, 6000, 1), hot: make(hotG, 240, "#E4FF7A", 6000, 1), fine: make(coreG, 200, PALE, 6000, 0.7), last: 0 };
      }
      const sp = spores;
      let ang = 0;
      const armEl = q(".radar-arm");
      if (armEl) { const m = new DOMMatrixReadOnly(getComputedStyle(armEl).transform); ang = Math.atan2(m.b, m.a); }
      if (now - sp.last > 32) {
        sp.last = now;
        const spawn = (arr: Spore[], R: number, base: number, ja: number, jr: number, outward: boolean) => {
          const slot = arr.find(s => now - s.born > s.life); if (!slot) return;
          const aa = ang + (Math.random() - 0.5) * ja;
          const off = outward ? Math.random() * jr : (Math.random() - 0.5) * jr;
          const r = R + off;
          slot.born = now; slot.base = base; slot._c = null;
          slot.el.setAttribute("x", (210 + Math.sin(aa) * r - slot.sz / 2).toFixed(2));
          slot.el.setAttribute("y", (210 - Math.cos(aa) * r - slot.sz / 2).toFixed(2));
        };
        spawn(sp.core, 197, 0.72 + 0.24 * beat, 0.045, 4, false);
        if (Math.random() < 0.5) spawn(sp.core, 197, 0.6 + 0.22 * beat, 0.09, 6, false);
        if (Math.random() < 0.94) spawn(sp.hot, 200, 0.72 + 0.2 * beat, 0.05, 6, true);
        spawn(sp.fine, 192, 0.14 + 0.04 * beat, 0.06, 4, false);
      }
      const rampColor = (stops: [number, string][], f: number) => { for (const [t2, c] of stops) { if (f <= t2) return c; } return stops[stops.length - 1][1]; };
      const fade = (arr: Spore[], type: string, flick?: boolean) => {
        const stops = RAMP[type];
        for (const s of arr) {
          const age = now - s.born;
          if (age > s.life) { if (s.el.getAttribute("opacity") !== "0") s.el.setAttribute("opacity", "0"); continue; }
          const f = age / s.life;
          let o = s.base * (1 - f);
          if (flick) o *= 0.55 + 0.45 * Math.sin(now * 0.018 + s.born * 0.05);
          const c = rampColor(stops, f);
          if (s._c !== c) { s.el.setAttribute("fill", c); s._c = c; }
          s.el.setAttribute("opacity", o.toFixed(3));
        }
      };
      fade(sp.core, "core"); fade(sp.hot, "hot", true); fade(sp.fine, "fine");
    }

    // hub power surge: branching bolts from the centre
    const ring = q<SVGCircleElement>(".hub-core-ring");
    if (ring) { ring.setAttribute("r", (9 + 3 * beat).toFixed(2)); ring.setAttribute("opacity", (0.12 + 0.26 * beat).toFixed(3)); ring.setAttribute("stroke-width", "1"); }
    const bolts = 3;
    for (let i = 0; i < 6; i++) {
      const pth = q<SVGPathElement>(".hub-arc-" + i); if (!pth) continue;
      const main = i < bolts, idx = main ? i : i - bolts;
      const seed = idx * 2.399 + (main ? 0 : 1.3);
      const baseA = t * 0.14 + idx * (Math.PI * 2 / bolts) + Math.sin(t * 0.5 + seed) * 0.4;
      const r0 = main ? 3 : (8 + idx * 2);
      const r1 = main ? (16 + beat * 10) : (24 + beat * 12);
      const segs = 3;
      let aa = baseA;
      let d = "M" + (210 + Math.cos(aa) * r0).toFixed(1) + "," + (210 + Math.sin(aa) * r0).toFixed(1);
      for (let s = 1; s <= segs; s++) {
        const f = s / segs, r = r0 + (r1 - r0) * f;
        const j = Math.sin(t * (6 + idx * 1.7) + s * 3.3 + seed) * 0.5 + Math.sin(t * (11 + s) + seed * 2) * 0.5;
        aa = baseA + j * 0.35 * (main ? 1 : 1.4);
        d += " L" + (210 + Math.cos(aa) * r).toFixed(1) + "," + (210 + Math.sin(aa) * r).toFixed(1);
      }
      pth.setAttribute("d", d);
      const flick = 0.5 + 0.5 * Math.sin(t * (9 + idx * 2.5) + seed * 4);
      const cap = main ? 0.24 : 0.15;
      pth.setAttribute("opacity", ((0.35 + 0.65 * beat) * cap * (0.4 + 0.6 * flick)).toFixed(3));
    }

    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(raf);
}

export default function ArtistRadarVisual() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    if (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    return startAnim(root);
  }, []);
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLE }} />
      <div className="arv" ref={ref} aria-hidden="true" dangerouslySetInnerHTML={{ __html: MARKUP }} />
    </>
  );
}
