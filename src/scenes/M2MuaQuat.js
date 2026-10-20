import * as Phaser from 'phaser';
import { W, H, FONT } from '../theme.js';
import { CONTENT } from '../content.js';
import { audio } from '../audio.js';
import { bgClub } from '../art.js';
import { Hero } from '../hero.js';
import { Hud, txt, pop, missionIntro, missionPassed, wasted } from '../ui/gta.js';
import { state, afterMission } from '../state.js';

const LANE_X = { L: 120, R: 600 };
const HIT_Y = 1090;
const SPAWN_Y = 170;
const APPROACH = 1.5; // giây từ lúc nốt hiện ra đến lúc chạm vòng
const PERFECT = 0.09; // ±90ms = "QUÁ BẢNH!"
const GOOD = 0.18; // ±180ms = "BẢNH!"

// Bản nốt theo phách (phách 0 = đầu bài, 8 phách đầu là phần đếm vào): [phách, làn]
const CHART = (() => {
  const n = [];
  for (let b = 8; b < 24; b += 2) n.push([b, (b / 2) % 2 ? 'R' : 'L']);
  ['L', 'R', 'L', 'R', 'L', 'L', 'R', 'R', 'L', 'R', 'L', 'R', 'L', 'R', 'L'].forEach((lane, i) => n.push([24 + i, lane]));
  n.push([40, 'R'], [41, 'L'], [42, 'R'], [43, 'L'], [44, 'L'], [46, 'R']);
  return n;
})();

// Phi vụ 2: chạm trái/phải đúng nhịp để chị Ngân "múa quạt"
export default class M2MuaQuat extends Phaser.Scene {
  constructor() {
    super('M2');
  }

  create() {
    this.m = CONTENT.missions.M2;
    this.mode = 'intro';
    this.combo = 0;
    this.hits = 0;
    this.score = 0;
    this.beatIdx = -1;
    this.cameras.main.fadeIn(350, 10, 2, 12);
    this.add.image(0, 0, bgClub(this)).setOrigin(0);

    // đèn sân khấu quét qua lại
    for (const [x, ang, col] of [[150, 20, 0xff4f7b], [570, -20, 0x4fa3ff], [360, 0, 0xffc93c]]) {
      const b = this.add.image(x, 40, 'beam').setOrigin(0.5, 0).setAngle(ang).setTint(col).setAlpha(0.2).setBlendMode('ADD');
      this.tweens.add({ targets: b, angle: ang + (x < W / 2 ? -28 : x > W / 2 ? 28 : 24), duration: 1900, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    }
    this.add.rectangle(W / 2, 110, 4, 130, 0x8a8794);
    this.disco = this.add.image(W / 2, 230, 'disco').setScale(0.85);
    this.tweens.add({ targets: this.disco, angle: 360, duration: 6000, repeat: -1 });
    this.sign = txt(this, W / 2, 380, 'NGÂN CITY CLUB', { font: FONT.pop, size: 58, color: '#ffd6e2' });
    this.sign.setShadow(0, 0, '#ff4f7b', 18, true, true);

    // vũng đèn trên sàn, chớp theo nhịp
    this.pools = [];
    for (const [x, y, col] of [[150, 1040, 0xff4f7b], [570, 1050, 0x4fa3ff], [360, 1140, 0xffc93c], [230, 1220, 0x8ef06b], [500, 1215, 0xff8fab]]) {
      this.pools.push(this.add.ellipse(x, y, 230, 70, col, 0).setBlendMode('ADD'));
    }

    // làn + vòng chạm
    this.rings = {};
    for (const lane of ['L', 'R']) {
      const x = LANE_X[lane];
      this.add.rectangle(x, (SPAWN_Y + HIT_Y) / 2, 8, HIT_Y - SPAWN_Y, 0xffffff, 0.07);
      this.rings[lane] = this.add.image(x, HIT_Y, 'ring').setScale(0.95).setDepth(140);
      txt(this, x, HIT_Y + 92, lane === 'L' ? '◀ TRÁI' : 'PHẢI ▶', { size: 22, weight: '800', color: '#ffd6e2' });
    }

    this.hero = new Hero(this, W / 2, 980 - 240, { scale: 1 }).setDepth(100);
    this.hero.showFans(true);
    this.hud = new Hud(this, { bar: { value: 0, label: 'ĐỘ BẢNH 0%', color: 0xffc93c } });
    this.comboText = txt(this, W / 2, 1060, '', { font: FONT.pop, size: 50, color: '#ffffff', stroke: '#000000', strokeThickness: 8 }).setDepth(160);
    this.fx = this.add
      .particles(0, 0, 'spark', { speed: { min: 140, max: 360 }, scale: { start: 0.9, end: 0 }, lifespan: 450, blendMode: 'ADD', emitting: false, tint: [0xffc93c, 0xff4f7b, 0xffffff] })
      .setDepth(170);

    this.input.on('pointerdown', (p) => this.tap(p.x < W / 2 ? 'L' : 'R'));
    for (const k of ['LEFT', 'A', 'F']) this.input.keyboard?.on(`keydown-${k}`, () => this.tap('L'));
    for (const k of ['RIGHT', 'D', 'J']) this.input.keyboard?.on(`keydown-${k}`, () => this.tap('R'));
    this.events.once('shutdown', () => this.music?.stop());

    missionIntro(this, this.m, () => this.begin(), { withCountdown: false });
  }

  // Đồng hồ của nhạc (trừ độ trễ loa/tai nghe) để chấm nhịp chính xác
  now() {
    return this.audioClock ? audio.now() - audio.latency() : performance.now() / 1000;
  }

  begin() {
    this.audioClock = audio.running();
    this.music = this.audioClock ? audio.loop('m2', { startAt: audio.now() + 0.3, vol: 0.9 }) : null;
    this.spb = this.music?.spb ?? 60 / 128;
    this.t0 = this.music ? this.music.t0 : this.now() + 0.3;
    this.notes = CHART.map(([beat, lane]) => ({ t: this.t0 + beat * this.spb, lane, s: null, done: false }));
    this.endAt = this.t0 + (CHART[CHART.length - 1][0] + 3) * this.spb;
    this.mode = 'play';
  }

  update() {
    if (this.mode !== 'play') return;
    const now = this.now();
    const bi = Math.floor((now - this.t0) / this.spb);
    if (bi >= 0 && bi !== this.beatIdx) {
      this.beatIdx = bi;
      this.onBeat(bi);
    }
    for (const n of this.notes) {
      if (n.done) continue;
      const dt = n.t - now;
      if (!n.s && dt <= APPROACH) n.s = this.add.image(LANE_X[n.lane], SPAWN_Y, n.lane === 'L' ? 'note-L' : 'note-R').setDepth(150);
      if (n.s) n.s.y = HIT_Y - (dt / APPROACH) * (HIT_Y - SPAWN_Y);
      if (dt < -GOOD) this.judge(n, 'miss');
    }
    if (now > this.endAt) this.finish();
  }

  onBeat(bi) {
    const pool = this.pools[bi % this.pools.length];
    pool.fillAlpha = 0.4;
    this.tweens.add({ targets: pool, fillAlpha: 0, duration: this.spb * 900 });
    this.tweens.add({ targets: this.disco, scale: 0.95, duration: 70, yoyo: true });
    this.tweens.add({ targets: this.hero.torso, y: 6, duration: 90, yoyo: true });
    for (const r of Object.values(this.rings)) this.tweens.add({ targets: r, scale: 1.04, duration: 80, yoyo: true });
    // đếm vào trong 8 phách đầu
    const cue = { 0: 'SẴN SÀNG…', 4: '4', 5: '3', 6: '2', 7: '1', 8: 'QUẨY!' }[bi];
    if (cue) {
      const big = cue.length <= 2;
      const t = txt(this, W / 2, 1150, cue, { font: FONT.pop, size: big ? 130 : 80, color: bi === 8 ? '#ffc93c' : '#ffffff', stroke: '#000000', strokeThickness: 10 })
        .setDepth(200)
        .setScale(1.4);
      this.tweens.add({ targets: t, scale: 1, duration: 140, ease: 'Back.Out' });
      this.tweens.add({ targets: t, alpha: 0, delay: big ? 220 : 900, duration: 200, onComplete: () => t.destroy() });
    }
  }

  tap(lane) {
    if (this.mode !== 'play') return;
    this.hero.swing(lane);
    const now = this.now();
    let best = null;
    let bestD = Infinity;
    for (const n of this.notes) {
      if (n.done || n.lane !== lane) continue;
      const d = Math.abs(n.t - now);
      if (d < bestD) {
        bestD = d;
        best = n;
      }
    }
    if (best && bestD <= GOOD) this.judge(best, bestD <= PERFECT ? 'perfect' : 'good');
  }

  judge(n, kind) {
    n.done = true;
    const x = LANE_X[n.lane];
    if (kind === 'miss') {
      this.combo = 0;
      audio.sfx('miss');
      pop(this, x, HIT_Y - 130, 'HỤT!', { color: '#c9c3d6', size: 40 });
      if (n.s) this.tweens.add({ targets: n.s, alpha: 0, y: n.s.y + 60, duration: 200, onComplete: () => n.s.destroy() });
    } else {
      const perfect = kind === 'perfect';
      this.combo++;
      this.hits++;
      this.score += perfect ? 2 : 1;
      if (perfect) state.perfect++;
      else state.good++;
      audio.sfx(kind);
      pop(this, x, HIT_Y - 140, perfect ? 'QUÁ BẢNH!' : 'BẢNH!', { color: perfect ? '#ffc93c' : '#ff8fab', size: perfect ? 52 : 46 });
      this.fx.explode(perfect ? 18 : 10, x, HIT_Y);
      n.s?.destroy();
      const ring = this.rings[n.lane];
      ring.setTint(perfect ? 0xffc93c : 0xff8fab);
      this.time.delayedCall(120, () => ring.clearTint());
    }
    this.comboText.setText(this.combo >= 3 ? `COMBO x${this.combo}` : '');
    const frac = this.score / (this.notes.length * 2);
    this.hud.setBar(frac, `ĐỘ BẢNH ${Math.round(frac * 100)}%`);
  }

  finish() {
    this.mode = 'done';
    this.music?.stop(0.6);
    for (const n of this.notes) n.s?.destroy();
    this.comboText.setText('');
    if (this.hits / this.notes.length >= 0.5) {
      this.hero.celebrate();
      this.hero.dropShades();
      this.time.delayedCall(700, () => missionPassed(this, this.m.passed, () => afterMission(this, 'M2')));
      return;
    }
    state.fails.M2++;
    this.time.delayedCall(300, () =>
      wasted(this, {
        line: this.m.notEnough,
        canSkip: state.fails.M2 >= 2,
        onRetry: () => this.scene.restart(),
        onSkip: () => afterMission(this, 'M2'),
      }),
    );
  }
}
