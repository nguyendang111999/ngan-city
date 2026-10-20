// Âm thanh tự tổng hợp bằng WebAudio: nhạc nền + hiệu ứng, không cần file nhạc.
// Nếu content.js khai báo nhạc riêng (music.*) thì dùng file đó thay cho nhạc tổng hợp.
import { CONTENT } from './content.js';

let ctx = null;
let master = null;
let musicBus = null;
let sfxBus = null;
let noiseBuf = null;
let unlocked = false;
let muted = loadMuted();
const buffers = new Map();

function loadMuted() {
  try {
    return localStorage.getItem('ngan-muted') === '1';
  } catch {
    return false;
  }
}

function saveMuted(v) {
  try {
    localStorage.setItem('ngan-muted', v ? '1' : '0');
  } catch {
    /* chế độ ẩn danh: bỏ qua */
  }
}

const mtof = (m) => 440 * 2 ** ((m - 69) / 12);

function init() {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC({ latencyHint: 'interactive' });
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -12;
  comp.ratio.value = 4;
  master = ctx.createGain();
  master.gain.value = muted ? 0 : 0.9;
  musicBus = ctx.createGain();
  musicBus.gain.value = 0.6;
  sfxBus = ctx.createGain();
  sfxBus.gain.value = 0.85;
  musicBus.connect(master);
  sfxBus.connect(master);
  master.connect(comp);
  comp.connect(ctx.destination);
  noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const d = noiseBuf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) ctx.suspend();
    else if (unlocked) ctx.resume();
  });
  return ctx;
}

// ---------- các "nhạc cụ" ----------

function env(t, peak, attack, decay, dest) {
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
  g.connect(dest);
  return g;
}

function osc(t, dest, o) {
  const { type = 'square', freq = 440, to = 0, toTime = 0, dur = 0.2, vol = 0.2, attack = 0.005 } = o;
  const n = ctx.createOscillator();
  n.type = type;
  n.detune.value = o.detune || 0;
  n.frequency.setValueAtTime(freq, t);
  if (to) n.frequency.exponentialRampToValueAtTime(to, t + (toTime || attack + dur));
  const g = env(t, vol, attack, dur, dest);
  if (o.cutoff) {
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.Q.value = o.q || 1;
    f.frequency.setValueAtTime(o.cutoff, t);
    if (o.cutoffTo) f.frequency.exponentialRampToValueAtTime(o.cutoffTo, t + attack + dur);
    n.connect(f);
    f.connect(g);
  } else {
    n.connect(g);
  }
  n.start(t);
  n.stop(t + attack + dur + 0.05);
}

function hiss(t, dest, o) {
  const { dur = 0.05, vol = 0.2, type = 'highpass', freq = 7000, q = 0.7, attack = 0.002, sweepTo = 0 } = o;
  const s = ctx.createBufferSource();
  s.buffer = noiseBuf;
  s.loop = true;
  const f = ctx.createBiquadFilter();
  f.type = type;
  f.Q.value = q;
  f.frequency.setValueAtTime(freq, t);
  if (sweepTo) f.frequency.exponentialRampToValueAtTime(sweepTo, t + attack + dur);
  const g = env(t, vol, attack, dur, dest);
  s.connect(f);
  f.connect(g);
  s.start(t, Math.random() * 0.5);
  s.stop(t + attack + dur + 0.05);
}

const kick = (t, d, v = 0.9) => osc(t, d, { type: 'sine', freq: 160, to: 45, toTime: 0.11, dur: 0.3, vol: v, attack: 0.002 });
const hat = (t, d, v = 0.1, open = false) => hiss(t, d, { dur: open ? 0.16 : 0.035, vol: v, freq: 8000 });
const snare = (t, d, v = 0.3) => {
  hiss(t, d, { dur: 0.14, vol: v, type: 'bandpass', freq: 1900, q: 0.8 });
  osc(t, d, { type: 'triangle', freq: 230, to: 150, toTime: 0.06, dur: 0.08, vol: v * 0.7 });
};
const clap = (t, d, v = 0.3) => {
  for (let k = 0; k < 3; k++) hiss(t + k * 0.011, d, { dur: k === 2 ? 0.15 : 0.012, vol: v, type: 'bandpass', freq: 1300, q: 1.2 });
};
const bass = (t, d, m, dur = 0.18, v = 0.3) =>
  osc(t, d, { type: 'sawtooth', freq: mtof(m), dur, vol: v, cutoff: 900, cutoffTo: 180, q: 3 });
const pluck = (t, d, m, v = 0.08, dur = 0.2) => {
  osc(t, d, { type: 'square', freq: mtof(m), dur, vol: v, cutoff: 3400, cutoffTo: 600, q: 2 });
  osc(t, d, { type: 'sawtooth', freq: mtof(m), dur, vol: v * 0.6, detune: 8, cutoff: 3400, cutoffTo: 600 });
};
const keys = (t, d, m, v = 0.1, dur = 1) => {
  osc(t, d, { type: 'triangle', freq: mtof(m), dur, vol: v, attack: 0.004 });
  osc(t, d, { type: 'sine', freq: mtof(m + 12), dur: dur * 0.5, vol: v * 0.3, attack: 0.004 });
};
const pad = (t, d, notes, dur, v = 0.04) => {
  for (const m of notes)
    for (const det of [-7, 7])
      osc(t, d, { type: 'sawtooth', freq: mtof(m), dur, vol: v, attack: Math.min(0.5, dur * 0.3), cutoff: 1200, cutoffTo: 700, detune: det });
};

// ---------- các bản nhạc (mỗi bước = 1 nốt móc kép) ----------

const _ = 0;
const PATTERNS = {
  title: {
    bpm: 100,
    play(i, t, d, st) {
      const s = i % 16;
      const bar = Math.floor(i / 16) % 4;
      const ch = [[57, 60, 64], [57, 60, 65], [55, 60, 64], [55, 59, 62]][bar];
      const root = [45, 41, 48, 43][bar];
      if (s === 0) {
        pad(t, d, ch, st * 16, 0.03);
        bass(t, d, root, st * 6, 0.16);
      }
      if (s === 8) bass(t, d, root + 12, st * 4, 0.1);
      if (s === 0 || s === 8) kick(t, d, 0.5);
      if (s === 4 || s === 12) snare(t, d, 0.1);
      if (s % 2 === 0) {
        hat(t, d, 0.04);
        pluck(t, d, ch[(s / 2) % 3] + 12, 0.045, 0.25);
      }
    },
  },

  m1: {
    bpm: 136,
    play(i, t, d, st) {
      const s = i % 16;
      const bar = Math.floor(i / 16) % 4;
      const root = [50, 47, 43, 45][bar];
      const mel = [
        [74, _, _, 78, _, _, 81, _, 79, _, 78, _, 76, _, 74, _],
        [71, _, _, 74, _, _, 78, _, 76, _, 74, _, 73, _, 71, _],
        [71, _, _, 74, _, _, 79, _, 78, _, 76, _, 74, _, 76, _],
        [73, _, 76, _, 81, _, 79, _, 78, _, 76, _, 73, _, _, _],
      ][bar];
      if (s % 4 === 0) kick(t, d, 0.75);
      if (s === 4 || s === 12) snare(t, d, 0.22);
      if (s % 2 === 0) {
        hat(t, d, 0.06);
        bass(t, d, s % 4 === 0 ? root : root + 12, st * 1.6, 0.2);
      }
      if (mel[s]) pluck(t, d, mel[s], 0.06, 0.18);
    },
  },

  // Kiểu "Vinahouse": kick đều, bass nảy phách lẻ. 2 ô nhịp đầu là phần đếm vào.
  m2: {
    bpm: 128,
    play(i, t, d, st) {
      const s = i % 16;
      const b = Math.floor(i / 16);
      if (s % 4 === 0) kick(t, d, 0.95);
      if (b < 2) {
        if (s % 2 === 0) hat(t, d, 0.07);
        if (b === 1 && (s === 4 || s === 12)) clap(t, d, 0.22);
        if (b === 1 && s === 0) hiss(t, d, { attack: st * 14, dur: st * 2, vol: 0.12, type: 'bandpass', freq: 400, sweepTo: 6000, q: 1.5 });
        return;
      }
      const bar = (b - 2) % 4;
      const root = [45, 41, 48, 43][bar];
      if (s % 4 === 2) {
        bass(t, d, root, st * 1.7, 0.32);
        hat(t, d, 0.09, true);
      }
      if (s % 2 === 1) hat(t, d, 0.035);
      if (s === 4 || s === 12) clap(t, d, 0.28);
      const mel = [
        [69, _, _, 72, _, _, 76, _, 74, _, 72, _, 69, _, 67, _],
        [65, _, _, 69, _, _, 72, _, 74, _, 72, _, 69, _, 65, _],
        [67, _, _, 72, _, _, 76, _, 79, _, 76, _, 72, _, 74, _],
        [71, _, _, 74, _, _, 79, _, 76, _, 74, _, 71, _, 74, _],
      ][bar];
      if (mel[s]) pluck(t, d, mel[s], 0.075, 0.2);
      if (s === 0 && bar === 0) hiss(t, d, { dur: 0.6, vol: 0.07, freq: 5000 });
    },
  },

  m3: {
    bpm: 150,
    play(i, t, d, st) {
      const s = i % 16;
      const bar = Math.floor(i / 16) % 4;
      const root = [40, 36, 43, 38][bar];
      if (s % 4 === 0) kick(t, d, 0.85);
      if (s === 4 || s === 12) snare(t, d, 0.24);
      hat(t, d, s % 2 === 0 ? 0.06 : 0.025);
      if (s % 2 === 0) bass(t, d, root + 12, st * 0.9, 0.2);
      else if (s % 4 === 3) bass(t, d, root + 24, st * 0.8, 0.1);
      const arp = [[64, 67, 71, 76], [64, 67, 72, 76], [67, 71, 74, 79], [66, 69, 74, 78]][bar];
      if (s % 2 === 0) pluck(t, d, arp[(s / 2) % 4], 0.045, 0.14);
    },
  },

  finale: {
    bpm: 72,
    play(i, t, d, st) {
      const s = i % 16;
      const bar = Math.floor(i / 16) % 4;
      const ch = [[53, 57, 60], [52, 55, 60], [53, 57, 62], [53, 58, 62]][bar];
      const root = [41, 36, 38, 34][bar];
      const mel = [[77, 76], [76, 72], [74, 77], [74, 70]][bar];
      if (s === 0) {
        pad(t, d, ch, st * 16, 0.025);
        keys(t, d, root + 12, 0.09, st * 14);
      }
      if (s % 2 === 0) keys(t, d, ch[(s / 2) % 3] + 12, 0.055, st * 6);
      if (s === 0 || s === 8) keys(t, d, mel[s ? 1 : 0], 0.075, st * 8);
    },
  },
};

// ---------- hiệu ứng ----------

const SFX = {
  tap: (t, d) => osc(t, d, { type: 'triangle', freq: 660, to: 880, dur: 0.06, vol: 0.15 }),
  coin: (t, d) => {
    osc(t, d, { type: 'square', freq: 988, dur: 0.07, vol: 0.1 });
    osc(t + 0.07, d, { type: 'square', freq: 1319, dur: 0.16, vol: 0.1 });
  },
  heal: (t, d) => [523, 659, 784, 1047].forEach((f, k) => osc(t + k * 0.05, d, { type: 'triangle', freq: f, dur: 0.12, vol: 0.14 })),
  hit: (t, d) => {
    osc(t, d, { type: 'sine', freq: 180, to: 50, dur: 0.25, vol: 0.6 });
    hiss(t, d, { dur: 0.15, vol: 0.35, type: 'lowpass', freq: 1800 });
  },
  msg: (t, d) => {
    osc(t, d, { type: 'sine', freq: 1175, dur: 0.08, vol: 0.18 });
    osc(t + 0.08, d, { type: 'sine', freq: 1568, dur: 0.14, vol: 0.18 });
  },
  ring: (t, d) => {
    for (let k = 0; k < 2; k++)
      for (let j = 0; j < 8; j++) osc(t + k * 0.42 + j * 0.04, d, { type: 'sine', freq: j % 2 ? 1320 : 1760, dur: 0.035, vol: 0.12 });
  },
  whoosh: (t, d) => hiss(t, d, { attack: 0.05, dur: 0.25, vol: 0.18, type: 'bandpass', freq: 500, sweepTo: 3200, q: 1.2 }),
  count: (t, d) => osc(t, d, { type: 'square', freq: 660, dur: 0.12, vol: 0.12 }),
  go: (t, d) => {
    osc(t, d, { type: 'square', freq: 990, dur: 0.3, vol: 0.12 });
    osc(t, d, { type: 'square', freq: 1320, dur: 0.3, vol: 0.07 });
  },
  perfect: (t, d) => {
    osc(t, d, { type: 'triangle', freq: 1568, dur: 0.12, vol: 0.14 });
    osc(t + 0.04, d, { type: 'triangle', freq: 2093, dur: 0.16, vol: 0.1 });
  },
  good: (t, d) => osc(t, d, { type: 'triangle', freq: 1175, dur: 0.1, vol: 0.12 }),
  miss: (t, d) => osc(t, d, { type: 'sawtooth', freq: 140, to: 90, dur: 0.18, vol: 0.1, cutoff: 800 }),
  lane: (t, d) => hiss(t, d, { attack: 0.01, dur: 0.12, vol: 0.12, type: 'bandpass', freq: 900, sweepTo: 2400, q: 1.5 }),
  star: (t, d) => {
    for (let k = 0; k < 3; k++) {
      osc(t + k * 0.22, d, { type: 'sine', freq: 900, to: 1400, dur: 0.11, vol: 0.12 });
      osc(t + k * 0.22 + 0.11, d, { type: 'sine', freq: 1400, to: 900, dur: 0.11, vol: 0.12 });
    }
  },
  passed: (t, d) => {
    [60, 64, 67, 72, 76].forEach((m, k) =>
      osc(t + k * 0.09, d, { type: 'sawtooth', freq: mtof(m), dur: 0.16, vol: 0.11, cutoff: 3500, cutoffTo: 1200 }),
    );
    const tc = t + 0.5;
    [60, 64, 67, 72].forEach((m) => {
      osc(tc, d, { type: 'sawtooth', freq: mtof(m), dur: 1.3, vol: 0.07, attack: 0.02, cutoff: 3000, cutoffTo: 900 });
      osc(tc, d, { type: 'square', freq: mtof(m + 12), dur: 0.9, vol: 0.03, attack: 0.02 });
    });
    hiss(tc, d, { dur: 1.4, vol: 0.1, freq: 6000, attack: 0.01 });
    kick(tc, d, 0.7);
  },
  wasted: (t, d) => {
    kick(t, d, 1);
    osc(t, d, { type: 'sawtooth', freq: 220, to: 55, dur: 1.4, vol: 0.16, cutoff: 1200, cutoffTo: 200 });
    osc(t + 0.05, d, { type: 'sawtooth', freq: 233, to: 58, dur: 1.4, vol: 0.1, cutoff: 1200, cutoffTo: 200 });
    hiss(t, d, { dur: 0.9, vol: 0.2, type: 'lowpass', freq: 900 });
  },
  shades: (t, d) => {
    osc(t, d, { type: 'square', freq: 523, dur: 0.08, vol: 0.1 });
    osc(t + 0.1, d, { type: 'square', freq: 784, dur: 0.2, vol: 0.1 });
  },
  firework: (t, d) => {
    hiss(t, d, { dur: 0.5, vol: 0.1, type: 'lowpass', freq: 2500, sweepTo: 400, attack: 0.005 });
    osc(t, d, { type: 'sine', freq: 90, to: 40, dur: 0.3, vol: 0.2 });
  },
};

// ---------- phát nhạc ----------

function fadeOut(node, fade) {
  const t = ctx.currentTime;
  node.gain.cancelScheduledValues(t);
  node.gain.setValueAtTime(node.gain.value, t);
  node.gain.linearRampToValueAtTime(0, t + fade);
  setTimeout(() => node.disconnect(), (fade + 0.2) * 1000);
}

function playBuffer(buf, { at, vol = 1, bpm = 0, offset = 0 } = {}) {
  const s = ctx.createBufferSource();
  s.buffer = buf;
  s.loop = true;
  const g = ctx.createGain();
  g.gain.value = vol;
  s.connect(g);
  g.connect(musicBus);
  const t = at ?? ctx.currentTime + 0.06;
  s.start(t);
  return {
    t0: t + (offset || 0),
    spb: bpm ? 60 / bpm : 0.5,
    custom: true,
    stop(fade = 0.3) {
      fadeOut(g, fade);
      try {
        s.stop(ctx.currentTime + fade + 0.1);
      } catch {
        /* đã dừng */
      }
    },
  };
}

// Phát nhạc nền theo tên ('title' | 'm1' | 'm2' | 'm3' | 'finale'). Trả về { t0, spb, stop() }.
function loop(name, { startAt, bars = Infinity, vol = 1 } = {}) {
  if (!init()) return null;
  const custom = CONTENT.music?.[name];
  const src = typeof custom === 'string' ? custom : custom?.src;
  if (src && buffers.get(src)) return playBuffer(buffers.get(src), { at: startAt, vol, bpm: custom.bpm, offset: custom.offset });
  const p = PATTERNS[name];
  if (!p) return null;
  const st = 60 / p.bpm / 4;
  const bus = ctx.createGain();
  bus.gain.value = vol;
  bus.connect(musicBus);
  let next = startAt ?? ctx.currentTime + 0.06;
  const t0 = next;
  let i = 0;
  const total = bars * 16;
  const tick = () => {
    while (i < total && next < ctx.currentTime + 0.2) {
      p.play(i, next, bus, st);
      next += st;
      i++;
    }
  };
  tick();
  const timer = setInterval(tick, 40);
  return {
    t0,
    spb: st * 4,
    custom: false,
    stop(fade = 0.25) {
      clearInterval(timer);
      fadeOut(bus, fade);
    },
  };
}

async function preload() {
  const list = Object.values(CONTENT.music || {})
    .map((m) => (typeof m === 'string' ? m : m?.src))
    .filter(Boolean);
  if (!list.length || !init()) return;
  await Promise.all(
    list.map(async (src) => {
      try {
        const res = await fetch(src);
        if (!res.ok) throw new Error(String(res.status));
        buffers.set(src, await ctx.decodeAudioData(await res.arrayBuffer()));
      } catch {
        console.info('[Ngân City] Không tải được nhạc, dùng nhạc tổng hợp:', src);
      }
    }),
  );
}

function unlock() {
  if (unlocked && ctx?.state === 'running') return;
  if (!init()) return;
  unlocked = true;
  try {
    if (navigator.audioSession) navigator.audioSession.type = 'playback'; // iOS: vẫn kêu khi gạt im lặng
  } catch {
    /* không hỗ trợ */
  }
  if (ctx.state !== 'running') ctx.resume();
  const b = ctx.createBuffer(1, 1, 22050);
  const s = ctx.createBufferSource();
  s.buffer = b;
  s.connect(ctx.destination);
  s.start(0);
}

function setMuted(v) {
  muted = v;
  saveMuted(v);
  if (master) master.gain.setTargetAtTime(v ? 0 : 0.9, ctx.currentTime, 0.02);
}

export const audio = {
  unlock,
  preload,
  loop,
  sfx(name) {
    if (!init() || !SFX[name]) return;
    SFX[name](ctx.currentTime + 0.005, sfxBus);
  },
  now: () => (ctx ? ctx.currentTime : performance.now() / 1000),
  running: () => !!ctx && ctx.state === 'running',
  latency: () => (ctx ? Math.min(0.3, (ctx.outputLatency || 0) + (ctx.baseLatency || 0)) : 0),
  buzz(pattern) {
    try {
      navigator.vibrate?.(pattern);
    } catch {
      /* không hỗ trợ rung */
    }
  },
  isMuted: () => muted,
  toggleMute() {
    setMuted(!muted);
    return muted;
  },
};
