// THE SUNDAY WORLD — a one-page newspaper front page summing up
// Sunday 22 November 2026, drawn procedurally with the Node standard
// library only. No network, no assets: every pixel is computed here,
// so two runs write byte-identical PNGs.
//
// Stories (all reported on 22 November 2026, verified from the wires):
//  - Gulf, overnight: Iran's IRGC claims missile/drone strikes hit two
//    US Patriot radars at bases in Bahrain; Bahrain reports a fire at a
//    civilian industrial plant, no injuries; Washington has not
//    confirmed damage to the radars.
//  - COP31, Antalya: a new deal package is put to a Sunday vote after
//    two days of overtime; fossil fuels and finance for poorer nations
//    divided nearly 200 countries.
//  - Tennis, Turin: Alcaraz meets Zverev for the ATP Finals title.
//  - Myanmar: a magnitude 4.1 quake in the early hours of Sunday.
//  - Trade, New Delhi: India and Canada close a sixth round of talks.
//  - Kyiv: Zelensky repeats that NATO membership is Ukraine's clearest
//    security guarantee.
//  - Also today: UAE-US security talks, Israel coalition talks, four
//    cheetah cubs born in India, Rahul's 136 in Wellington.

import { mkdirSync, writeFileSync } from "node:fs";
import { deflateSync } from "node:zlib";

const W = 1024;
const H = 1024;

// ---------------------------------------------------------------------------
// 5x7 bitmap font, hand-drawn. Each glyph is 7 rows of 5 bits ("1" = ink).
// Capitals use rows 0-5, lowercase x-height rows 2-5, descenders row 6.
// ---------------------------------------------------------------------------
const FONT: Record<string, string[]> = {
  A: ["01110", "10001", "10001", "11111", "10001", "10001", "00000"],
  B: ["11110", "10001", "10001", "11110", "10001", "10001", "11110"],
  C: ["01110", "10001", "10000", "10000", "10000", "10001", "01110"],
  D: ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
  E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
  F: ["11111", "10000", "10000", "11110", "10000", "10000", "10000"],
  G: ["01110", "10001", "10000", "10111", "10001", "10001", "01111"],
  H: ["10001", "10001", "10001", "11111", "10001", "10001", "10001"],
  I: ["01110", "00100", "00100", "00100", "00100", "00100", "01110"],
  J: ["00111", "00010", "00010", "00010", "00010", "10010", "01100"],
  K: ["10001", "10010", "10100", "11000", "10100", "10010", "10001"],
  L: ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
  M: ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
  N: ["10001", "11001", "10101", "10011", "10001", "10001", "10001"],
  O: ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
  P: ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
  Q: ["01110", "10001", "10001", "10001", "10101", "10010", "01101"],
  R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
  S: ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
  T: ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
  U: ["10001", "10001", "10001", "10001", "10001", "10001", "01110"],
  V: ["10001", "10001", "10001", "10001", "10001", "01010", "00100"],
  W: ["10001", "10001", "10001", "10101", "10101", "10101", "01010"],
  X: ["10001", "10001", "01010", "00100", "01010", "10001", "10001"],
  Y: ["10001", "10001", "01010", "00100", "00100", "00100", "00100"],
  Z: ["11111", "00001", "00010", "00100", "01000", "10000", "11111"],
  a: ["00000", "00000", "01110", "00001", "01111", "10001", "01111"],
  b: ["10000", "10000", "11110", "10001", "10001", "10001", "11110"],
  c: ["00000", "00000", "01110", "10000", "10000", "10001", "01110"],
  d: ["00001", "00001", "01111", "10001", "10001", "10001", "01111"],
  e: ["00000", "00000", "01110", "10001", "11111", "10000", "01110"],
  f: ["00110", "01001", "01000", "11110", "01000", "01000", "01000"],
  g: ["00000", "00000", "01111", "10001", "10001", "01111", "00110"],
  h: ["10000", "10000", "11110", "10001", "10001", "10001", "10001"],
  i: ["00100", "00000", "01100", "00100", "00100", "00100", "01110"],
  j: ["00010", "00000", "00110", "00010", "00010", "00010", "01100"],
  k: ["10000", "10000", "10010", "10100", "11000", "10100", "10010"],
  l: ["01100", "00100", "00100", "00100", "00100", "00100", "01110"],
  m: ["00000", "00000", "11010", "10101", "10101", "10101", "10101"],
  n: ["00000", "00000", "11110", "10001", "10001", "10001", "10001"],
  o: ["00000", "00000", "01110", "10001", "10001", "10001", "01110"],
  p: ["00000", "00000", "11110", "10001", "10001", "11110", "10000"],
  q: ["00000", "00000", "01111", "10001", "10001", "01111", "00001"],
  r: ["00000", "00000", "10110", "11001", "10000", "10000", "10000"],
  s: ["00000", "00000", "01111", "10000", "01110", "00001", "11110"],
  t: ["01000", "01000", "11110", "01000", "01000", "01000", "00110"],
  u: ["00000", "00000", "10001", "10001", "10001", "10011", "01101"],
  v: ["00000", "00000", "10001", "10001", "10001", "01010", "00100"],
  w: ["00000", "00000", "10001", "10101", "10101", "10101", "01010"],
  x: ["00000", "00000", "10001", "01010", "00100", "01010", "10001"],
  y: ["00000", "00000", "10001", "10001", "10001", "01111", "00010"],
  z: ["00000", "00000", "11111", "00010", "00100", "01000", "11111"],
  "0": ["01110", "10001", "10011", "10101", "11001", "10001", "01110"],
  "1": ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
  "2": ["01110", "10001", "00001", "00110", "01000", "10000", "11111"],
  "3": ["11111", "00010", "00100", "00010", "00001", "10001", "01110"],
  "4": ["00010", "00110", "01010", "10010", "11111", "00010", "00010"],
  "5": ["11111", "10000", "11110", "00001", "00001", "10001", "01110"],
  "6": ["00110", "01000", "10000", "11110", "10001", "10001", "01110"],
  "7": ["11111", "00001", "00010", "00100", "01000", "01000", "01000"],
  "8": ["01110", "10001", "10001", "01110", "10001", "10001", "01110"],
  "9": ["01110", "10001", "10001", "01111", "00001", "00010", "01100"],
  " ": ["00000", "00000", "00000", "00000", "00000", "00000", "00000"],
  ".": ["00000", "00000", "00000", "00000", "00000", "01100", "01100"],
  ",": ["00000", "00000", "00000", "00000", "00000", "01100", "01000"],
  ":": ["00000", "01100", "01100", "00000", "01100", "01100", "00000"],
  ";": ["00000", "01100", "01100", "00000", "01100", "01100", "01000"],
  "!": ["00100", "00100", "00100", "00100", "00100", "00000", "00100"],
  "?": ["01110", "10001", "00001", "00110", "00100", "00000", "00100"],
  "'": ["00100", "00100", "01000", "00000", "00000", "00000", "00000"],
  '"': ["01010", "01010", "01010", "00000", "00000", "00000", "00000"],
  "-": ["00000", "00000", "00000", "01110", "00000", "00000", "00000"],
  "—": ["00000", "00000", "00000", "11111", "00000", "00000", "00000"],
  "(": ["00010", "00100", "01000", "01000", "01000", "00100", "00010"],
  ")": ["01000", "00100", "00010", "00010", "00010", "00100", "01000"],
  "/": ["00001", "00010", "00010", "00100", "01000", "01000", "10000"],
  "&": ["01100", "10010", "10100", "01000", "10101", "10010", "01101"],
  "+": ["00000", "00100", "00100", "11111", "00100", "00100", "00000"],
  "=": ["00000", "00000", "11111", "00000", "11111", "00000", "00000"],
  "*": ["00000", "10101", "01110", "10101", "00000", "00000", "00000"],
  "%": ["11001", "11010", "00010", "00100", "01000", "01011", "10011"],
  "°": ["01100", "10010", "10010", "01100", "00000", "00000", "00000"],
  "•": ["00000", "00000", "00000", "01100", "01100", "00000", "00000"],
  _: ["00000", "00000", "00000", "00000", "00000", "00000", "11111"],
  $: ["00100", "01111", "10100", "01110", "00101", "11110", "00100"],
};

// ---------------------------------------------------------------------------
// Rasterizer: an RGBA buffer with alpha compositing, plus the shapes the
// front page needs. All coordinates are integers; everything is clipped.
// ---------------------------------------------------------------------------
const buf = new Uint8Array(W * H * 4);
type RGB = [number, number, number];

function fillPaper(r: number, g: number, b: number): void {
  for (let i = 0; i < W * H; i++) {
    buf[i * 4] = r;
    buf[i * 4 + 1] = g;
    buf[i * 4 + 2] = b;
    buf[i * 4 + 3] = 255;
  }
}

// Deterministic PRNG (mulberry32) so the star field, windows and smoke are
// identical on every run.
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function setPx(x: number, y: number, c: RGB, alpha: number): void {
  if (x < 0 || y < 0 || x >= W || y >= H || alpha <= 0) return;
  const i = (y * W + x) * 4;
  if (alpha >= 1) {
    buf[i] = c[0];
    buf[i + 1] = c[1];
    buf[i + 2] = c[2];
    buf[i + 3] = 255;
    return;
  }
  const inv = 1 - alpha;
  buf[i] = Math.round(c[0] * alpha + buf[i] * inv);
  buf[i + 1] = Math.round(c[1] * alpha + buf[i + 1] * inv);
  buf[i + 2] = Math.round(c[2] * alpha + buf[i + 2] * inv);
}

function rect(x0: number, y0: number, x1: number, y1: number, c: RGB, alpha = 1): void {
  const xa = Math.max(0, Math.floor(x0));
  const ya = Math.max(0, Math.floor(y0));
  const xb = Math.min(W, Math.ceil(x1));
  const yb = Math.min(H, Math.ceil(y1));
  for (let y = ya; y < yb; y++) {
    for (let x = xa; x < xb; x++) setPx(x, y, c, alpha);
  }
}

function hline(x0: number, x1: number, y: number, c: RGB, alpha = 1): void {
  rect(x0, y, x1, y + 1, c, alpha);
}

function frame(x0: number, y0: number, x1: number, y1: number, w: number, c: RGB): void {
  rect(x0, y0, x1, y0 + w, c);
  rect(x0, y1 - w, x1, y1, c);
  rect(x0, y0, x0 + w, y1, c);
  rect(x1 - w, y0, x1, y1, c);
}

function circle(cx: number, cy: number, r: number, c: RGB, alpha = 1): void {
  const rr = Math.max(0, Math.round(r));
  for (let dy = -rr; dy <= rr; dy++) {
    const dx = Math.floor(Math.sqrt(rr * rr - dy * dy));
    for (let x = cx - dx; x <= cx + dx; x++) setPx(x, cy + dy, c, alpha);
  }
}

function circleOutline(cx: number, cy: number, r: number, c: RGB, alpha = 1): void {
  const steps = Math.max(24, Math.round(r * 6));
  for (let s = 0; s < steps; s++) {
    const a = (s / steps) * Math.PI * 2;
    setPx(Math.round(cx + r * Math.cos(a)), Math.round(cy + r * Math.sin(a)), c, alpha);
  }
}

function ellipse(cx: number, cy: number, rx: number, ry: number, c: RGB, alpha = 1): void {
  for (let dy = -ry; dy <= ry; dy++) {
    const t = 1 - (dy * dy) / (ry * ry);
    if (t < 0) continue;
    const dx = Math.floor(rx * Math.sqrt(t));
    for (let x = cx - dx; x <= cx + dx; x++) setPx(x, cy + dy, c, alpha);
  }
}

// Thick line drawn as a chain of discs; deterministic.
function line(x0: number, y0: number, x1: number, y1: number, w: number, c: RGB, alpha = 1): void {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len = Math.max(1, Math.hypot(dx, dy));
  const steps = Math.ceil(len);
  const rad = Math.max(1, Math.round(w / 2));
  for (let s = 0; s <= steps; s++) {
    const t = s / steps;
    circle(Math.round(x0 + dx * t), Math.round(y0 + dy * t), rad, c, alpha);
  }
}

function triangle(
  x0: number, y0: number, x1: number, y1: number, x2: number, y2: number,
  c: RGB, alpha = 1,
): void {
  const minY = Math.max(0, Math.floor(Math.min(y0, y1, y2)));
  const maxY = Math.min(H - 1, Math.ceil(Math.max(y0, y1, y2)));
  for (let y = minY; y <= maxY; y++) {
    const xs: number[] = [];
    const edges: [number, number, number, number][] = [
      [x0, y0, x1, y1],
      [x1, y1, x2, y2],
      [x2, y2, x0, y0],
    ];
    for (const [ax, ay, bx, by] of edges) {
      if ((ay <= y && by > y) || (by <= y && ay > y)) {
        xs.push(ax + ((y - ay) / (by - ay)) * (bx - ax));
      }
    }
    if (xs.length < 2) continue;
    const xa = Math.floor(Math.min(...xs));
    const xb = Math.ceil(Math.max(...xs));
    for (let x = xa; x <= xb; x++) setPx(x, y, c, alpha);
  }
}

function vgrad(x0: number, y0: number, x1: number, y1: number, top: RGB, bot: RGB): void {
  const span = Math.max(1, y1 - y0);
  for (let y = y0; y < y1; y++) {
    const t = (y - y0) / span;
    const c: RGB = [
      Math.round(top[0] + (bot[0] - top[0]) * t),
      Math.round(top[1] + (bot[1] - top[1]) * t),
      Math.round(top[2] + (bot[2] - top[2]) * t),
    ];
    hline(x0, x1, y, c);
  }
}

// ---------------------------------------------------------------------------
// Text. One glyph cell is 6*scale wide (5 ink + 1 spacing), 7*scale tall.
// ---------------------------------------------------------------------------
function textWidth(s: string, scale: number): number {
  return s.length * 6 * scale - scale;
}

function drawText(
  x: number, y: number, s: string, scale: number, c: RGB, align: "left" | "center" = "left",
): void {
  let ox = x;
  if (align === "center") ox = x - Math.floor(textWidth(s, scale) / 2);
  let cx = ox;
  for (const ch of s) {
    const g = FONT[ch] ?? FONT["?"];
    for (let row = 0; row < 7; row++) {
      const bits = g[row];
      for (let col = 0; col < 5; col++) {
        if (bits[col] === "1") {
          rect(cx + col * scale, y + row * scale, cx + (col + 1) * scale, y + (row + 1) * scale, c);
        }
      }
    }
    cx += 6 * scale;
  }
}

function centerText(xCenter: number, y: number, s: string, scale: number, c: RGB): void {
  drawText(xCenter, y, s, scale, c, "center");
}

// ---------------------------------------------------------------------------
// Palette
// ---------------------------------------------------------------------------
const PAPER: RGB = [246, 241, 230];
const INK: RGB = [22, 20, 18];
const RED: RGB = [163, 44, 34];
const GREY: RGB = [74, 70, 64];
const NIGHT_TOP: RGB = [10, 18, 48];
const NIGHT_BOT: RGB = [30, 58, 110];
const SILH: RGB = [7, 10, 20];
const FAC: RGB = [11, 11, 20];
const WIN: RGB = [255, 207, 110];
const FLAME_RED: RGB = [214, 60, 14];
const FLAME_OR: RGB = [240, 125, 18];
const FLAME_YE: RGB = [255, 194, 28];
const SMOKE: RGB = [107, 111, 120];

fillPaper(...PAPER);

// ---------------------------------------------------------------------------
// Page frame
// ---------------------------------------------------------------------------
frame(10, 10, 1014, 1014, 3, INK);
frame(18, 18, 1006, 1006, 1, INK);

// ---------------------------------------------------------------------------
// Masthead
// ---------------------------------------------------------------------------
centerText(512, 34, "THE SUNDAY WORLD", 8, INK);
hline(24, 1000, 96, INK);
drawText(24, 106, "ONE DAY, ONE PAGE", 1, GREY);
drawText(1000 - textWidth("ANTALYA • MANAMA • TURIN", 1), 106, "ANTALYA • MANAMA • TURIN", 1, GREY);
centerText(512, 102, "SUNDAY 22 NOVEMBER 2026", 3, RED);
hline(24, 1000, 128, INK);

// ---------------------------------------------------------------------------
// Hero illustration: the Gulf overnight — an industrial plant burning
// under missile streaks, Manama skyline behind it.
// ---------------------------------------------------------------------------
const HX0 = 24;
const HX1 = 1000;
const HY0 = 138;
const HY1 = 412;
vgrad(HX0, HY0, HX1, 380, NIGHT_TOP, NIGHT_BOT);

const rnd = mulberry32(20261122);
// Stars
for (let i = 0; i < 70; i++) {
  const sx = HX0 + 8 + Math.floor(rnd() * (HX1 - HX0 - 16));
  const sy = HY0 + 6 + Math.floor(rnd() * 150);
  const bright = rnd();
  circle(sx, sy, bright > 0.85 ? 2 : 1, bright > 0.6 ? [255, 233, 168] : [235, 240, 255], 0.55 + bright * 0.45);
}
// Moon
circle(905, 176, 20, [242, 236, 216]);
circle(898, 170, 4, [216, 207, 174]);
circle(912, 182, 3, [216, 207, 174]);
circle(908, 168, 2, [216, 207, 174]);
// Searchlight beams (faint, behind the buildings)
triangle(300, HY1, 258, 180, 322, 180, [255, 255, 255], 0.07);
triangle(760, HY1, 728, 200, 788, 200, [255, 255, 255], 0.07);

// Distant skyline silhouettes with lit windows
const skyline: [number, number, number, number][] = [
  [40, 330, 140, HY1],
  [150, 308, 262, HY1],
  [700, 322, 822, HY1],
  [832, 300, 962, HY1],
];
for (const [x0, y0, x1, y1] of skyline) rect(x0, y0, x1, y1, SILH);
for (const [x0, y0, x1, y1] of skyline) {
  for (let wy = y0 + 12; wy < y1 - 8; wy += 18) {
    for (let wx = x0 + 8; wx < x1 - 8; wx += 16) {
      if (rnd() < 0.4) rect(wx, wy, wx + 4, wy + 6, WIN, 0.85);
    }
  }
}

// Industrial plant (mid-ground)
rect(90, 348, 340, HY1, FAC);
rect(370, 330, 650, HY1, FAC);
rect(690, 356, 950, HY1, FAC);
// Chimneys with red warning lights
rect(420, 272, 434, 330, FAC);
rect(470, 258, 484, 330, FAC);
circle(427, 268, 3, [255, 60, 40]);
circle(477, 254, 3, [255, 60, 40]);
// Plant windows
for (let wy = 344; wy < HY1 - 10; wy += 16) {
  for (let wx = 100; wx < 330; wx += 18) {
    if (rnd() < 0.35) rect(wx, wy, wx + 5, wy + 6, WIN, 0.8);
  }
  for (let wx = 380; wx < 640; wx += 18) {
    if (rnd() < 0.3) rect(wx, wy, wx + 5, wy + 6, WIN, 0.8);
  }
}

// Water strip at the bottom with fire reflections
rect(HX0, 398, HX1, HY1, [5, 7, 15]);
for (const fx of [210, 510, 840]) {
  for (let i = 0; i < 5; i++) {
    const rx = fx - 24 + i * 12 + Math.floor(rnd() * 6);
    line(rx, 400, rx, 408 + Math.floor(rnd() * 4), 2, FLAME_OR, 0.4);
  }
}

// Fires: glow, layered flame triangles, drifting smoke
function fire(bx: number, by: number, size: number): void {
  circle(bx, by - 10, Math.round(95 * size), FLAME_OR, 0.11);
  circle(bx, by - 8, Math.round(62 * size), FLAME_OR, 0.17);
  circle(bx, by - 6, Math.round(38 * size), FLAME_OR, 0.28);
  const flames = 6;
  for (let i = 0; i < flames; i++) {
    const off = (i - (flames - 1) / 2) * 16 * size + (rnd() - 0.5) * 8;
    const hgt = (52 + rnd() * 34) * size;
    const wdt = 13 * size;
    const fx = bx + off;
    triangle(fx - wdt, by, fx + wdt, by, fx, by - hgt, FLAME_RED, 0.95);
    triangle(fx - wdt * 0.62, by, fx + wdt * 0.62, by, fx, by - hgt * 0.68, FLAME_OR, 0.95);
    triangle(fx - wdt * 0.34, by, fx + wdt * 0.34, by, fx, by - hgt * 0.42, FLAME_YE, 0.95);
  }
  for (let i = 0; i < 5; i++) {
    const sy = by - 46 - i * 16;
    const sx = bx + i * 9 + (rnd() - 0.5) * 10;
    circle(sx, sy, Math.round(11 + i * 2.4), SMOKE, 0.32);
  }
}
fire(210, 372, 1);
fire(510, 352, 1.15);
fire(840, 372, 0.8);

// Missile streaks crossing the night sky
line(140, 150, 470, 330, 5, [255, 217, 138], 0.5);
line(140, 150, 470, 330, 2, [255, 243, 196], 0.95);
circle(470, 330, 10, [255, 243, 196], 0.8);
line(870, 160, 640, 320, 5, [255, 217, 138], 0.5);
line(870, 160, 640, 320, 2, [255, 243, 196], 0.95);
circle(640, 320, 10, [255, 243, 196], 0.8);

frame(HX0, HY0, HX1, HY1, 2, INK);

// ---------------------------------------------------------------------------
// Hero headline + deck
// ---------------------------------------------------------------------------
centerText(512, 428, "THE GULF — OVERNIGHT", 2, RED);
centerText(512, 452, "IRAN SAYS IT HIT U.S. PATRIOT", 4, INK);
centerText(512, 484, "RADARS IN BAHRAIN", 4, INK);
centerText(512, 524, "Bahrain reports fire at a civilian plant; no injuries.", 2, GREY);
centerText(512, 542, "Washington has not confirmed damage to the two radars.", 2, GREY);
hline(24, 1000, 566, INK);

// ---------------------------------------------------------------------------
// COP31 block: globe panel + text
// ---------------------------------------------------------------------------
const CX0 = 24;
const CY0 = 578;
const CY1 = 706;
rect(CX0, CY0, 224, CY1, [220, 239, 226]);
frame(CX0, CY0, 224, CY1, 2, INK);
// Globe
circle(124, 622, 46, [47, 111, 180]);
ellipse(106, 606, 15, 9, [63, 158, 77]);
ellipse(142, 630, 17, 10, [63, 158, 77]);
ellipse(116, 646, 10, 7, [63, 158, 77]);
ellipse(140, 604, 8, 6, [63, 158, 77]);
circleOutline(124, 622, 46, [20, 50, 74]);
circleOutline(124, 622, 30, [255, 255, 255], 0.5);
centerText(124, 668, "1.5°C", 3, RED);
// Text
drawText(244, 582, "CLIMATE — ANTALYA", 2, RED);
drawText(244, 604, "COP31 NEARS A DEAL", 4, INK);
drawText(244, 640, "New text goes to a Sunday vote after two days of overtime;", 2, GREY);
drawText(244, 658, "fossil fuels and money for poorer nations divided nearly", 2, GREY);
drawText(244, 676, "200 countries. The draft admits the 1.5°C limit will pass.", 2, GREY);
hline(24, 1000, 718, INK);

// ---------------------------------------------------------------------------
// Four small stories, each with a drawn spot illustration
// ---------------------------------------------------------------------------
const COLW = 238;
const COLGAP = 8;
const ROWY = 730;
const ICONH = 86;

function iconTennis(x0: number, y0: number): void {
  rect(x0, y0, x0 + COLW, y0 + ICONH, [46, 125, 50]);
  rect(x0 + 10, y0 + 10, x0 + COLW - 10, y0 + ICONH - 10, [76, 175, 80]);
  // Court lines
  rect(x0 + 10, y0 + 10, x0 + COLW - 10, y0 + 13, [255, 255, 255]);
  rect(x0 + 10, y0 + ICONH - 13, x0 + COLW - 10, y0 + ICONH - 10, [255, 255, 255]);
  rect(x0 + 10, y0 + 10, x0 + 13, y0 + ICONH - 10, [255, 255, 255]);
  rect(x0 + COLW - 13, y0 + 10, x0 + COLW - 10, y0 + ICONH - 10, [255, 255, 255]);
  line(x0 + COLW / 2, y0 + 10, x0 + COLW / 2, y0 + ICONH - 10, 3, [255, 255, 255]);
  // Ball
  circle(x0 + 168, y0 + 34, 17, [204, 243, 52]);
  circleOutline(x0 + 168, y0 + 34, 17, [255, 255, 255]);
  line(x0 + 156, y0 + 24, x0 + 164, y0 + 44, 2, [255, 255, 255]);
}

function iconQuake(x0: number, y0: number): void {
  rect(x0, y0, x0 + COLW, y0 + ICONH, [28, 39, 51]);
  drawText(x0 + 12, y0 + 10, "M4.1", 3, [255, 194, 28]);
  // Seismograph trace
  const pts: [number, number][] = [
    [0, 58], [28, 58], [40, 58], [52, 30], [64, 78], [76, 44], [88, 66],
    [100, 58], [118, 58], [132, 40], [146, 72], [160, 58], [190, 58], [226, 58],
  ];
  for (let i = 0; i < pts.length - 1; i++) {
    line(x0 + pts[i][0], y0 + pts[i][1], x0 + pts[i + 1][0], y0 + pts[i + 1][1], 3, [255, 255, 255]);
  }
  circle(x0 + 64, y0 + 78, 4, [255, 60, 40]);
}

function iconTrade(x0: number, y0: number): void {
  rect(x0, y0, x0 + COLW, y0 + ICONH, [243, 226, 199]);
  // India flag (saffron / white / green + wheel dot)
  rect(x0 + 22, y0 + 22, x0 + 82, y0 + 34, [255, 153, 51]);
  rect(x0 + 22, y0 + 34, x0 + 82, y0 + 46, [255, 255, 255]);
  rect(x0 + 22, y0 + 46, x0 + 82, y0 + 58, [19, 136, 8]);
  circle(x0 + 52, y0 + 40, 5, [6, 56, 120]);
  // Canada flag (red / white / red + maple dot)
  rect(x0 + 156, y0 + 22, x0 + 176, y0 + 58, [255, 0, 0]);
  rect(x0 + 176, y0 + 22, x0 + 196, y0 + 58, [255, 255, 255]);
  rect(x0 + 196, y0 + 22, x0 + 216, y0 + 58, [255, 0, 0]);
  circle(x0 + 186, y0 + 40, 6, [255, 0, 0]);
  // Exchange arrows between the flags
  line(x0 + 92, y0 + 32, x0 + 146, y0 + 32, 3, INK);
  triangle(x0 + 146, y0 + 26, x0 + 146, y0 + 38, x0 + 158, y0 + 32, INK);
  line(x0 + 146, y0 + 52, x0 + 92, y0 + 52, 3, INK);
  triangle(x0 + 92, y0 + 46, x0 + 92, y0 + 58, x0 + 80, y0 + 52, INK);
}

function iconShield(x0: number, y0: number): void {
  rect(x0, y0, x0 + COLW, y0 + ICONH, [238, 243, 248]);
  const cx = x0 + COLW / 2;
  // Shield: blue top half, yellow bottom half, pointed base
  triangle(cx - 34, y0 + 12, cx + 34, y0 + 12, cx, y0 + 78, [0, 91, 187]);
  triangle(cx - 34, y0 + 44, cx + 34, y0 + 44, cx, y0 + 78, [255, 213, 0]);
  // Shield outline (top edge + sides)
  line(cx - 34, y0 + 12, cx + 34, y0 + 12, 3, INK);
  line(cx - 34, y0 + 12, cx, y0 + 78, 3, INK);
  line(cx + 34, y0 + 12, cx, y0 + 78, 3, INK);
  centerText(cx, y0 + 20, "UA", 2, [255, 255, 255]);
}

const stories: {
  kicker: string;
  head: string[];
  deck: string[];
  icon: (x0: number, y0: number) => void;
}[] = [
  {
    kicker: "TENNIS — TURIN",
    head: ["ALCARAZ v ZVEREV", "FOR THE ATP", "FINALS TITLE"],
    deck: ["Title decider", "tonight in Turin.", "Alcaraz beat Shelton."],
    icon: iconTennis,
  },
  {
    kicker: "QUAKE — MYANMAR",
    head: ["M4.1 QUAKE", "SHAKES MYANMAR"],
    deck: ["Early hours of", "Sunday, NCS says."],
    icon: iconQuake,
  },
  {
    kicker: "TRADE — NEW DELHI",
    head: ["INDIA, CANADA", "CLOSE TRADE", "ROUND SIX"],
    deck: ["Sixth round of", "talks ends in", "New Delhi."],
    icon: iconTrade,
  },
  {
    kicker: "UKRAINE — KYIV",
    head: ["ZELENSKY: NATO", "IS UKRAINE'S", "BEST SHIELD"],
    deck: ["Membership is the", "clearest security", "guarantee, he says."],
    icon: iconShield,
  },
];

for (let i = 0; i < stories.length; i++) {
  const x0 = 24 + i * (COLW + COLGAP);
  const st = stories[i];
  st.icon(x0, ROWY);
  drawText(x0, ROWY + ICONH + 10, st.kicker, 2, RED);
  let hy = ROWY + ICONH + 30;
  for (const ln of st.head) {
    drawText(x0, hy, ln, 2, INK);
    hy += 15;
  }
  let dy = hy + 4;
  for (const ln of st.deck) {
    drawText(x0, dy, ln, 2, GREY);
    dy += 15;
  }
}

hline(24, 1000, 940, INK);

// ---------------------------------------------------------------------------
// Footer: also today
// ---------------------------------------------------------------------------
drawText(24, 952, "ALSO TODAY:", 2, RED);
drawText(24 + textWidth("ALSO TODAY: ", 2), 952, "UAE president receives the U.S. homeland security chief •", 2, GREY);
drawText(24, 968, "Israel coalition talks open • Four cheetah cubs born in India •", 2, GREY);
drawText(24, 984, "Rahul's 136 puts India on top in Wellington", 2, GREY);

// ---------------------------------------------------------------------------
// PNG encode (filter 0, zlib level 9) and write the file.
// ---------------------------------------------------------------------------
const CRC_TABLE = new Int32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  CRC_TABLE[n] = c;
}
function crc32(data: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < data.length; i++) c = CRC_TABLE[(c ^ data[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function pngChunk(type: string, data: Buffer): Buffer {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, "ascii");
  data.copy(out, 8);
  out.writeUInt32BE(crc32(Buffer.concat([Buffer.from(type, "ascii"), data])), 8 + data.length);
  return out;
}

const raw = Buffer.alloc(H * (1 + W * 4));
for (let y = 0; y < H; y++) {
  raw[y * (1 + W * 4)] = 0;
  Buffer.from(buf.buffer, y * W * 4, W * 4).copy(raw, y * (1 + W * 4) + 1);
}
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(W, 0);
ihdr.writeUInt32BE(H, 4);
ihdr[8] = 8; // bit depth
ihdr[9] = 6; // RGBA
ihdr[10] = 0;
ihdr[11] = 0;
ihdr[12] = 0;
const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  pngChunk("IHDR", ihdr),
  pngChunk("IDAT", deflateSync(raw, { level: 9 })),
  pngChunk("IEND", Buffer.alloc(0)),
]);

const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
mkdirSync(outDir, { recursive: true });
writeFileSync(`${outDir}/entry.png`, png);
console.log(`wrote ${outDir}/entry.png (${png.length} bytes, ${W}x${H})`);
