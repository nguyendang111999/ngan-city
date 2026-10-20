import * as Phaser from 'phaser';
import { W, H } from '../theme.js';
import { CONTENT } from '../content.js';
import { audio } from '../audio.js';
import { bgOffice } from '../art.js';
import { Hero } from '../hero.js';
import { Hud, txt, pop, missionIntro, missionPassed, wasted } from '../ui/gta.js';
import { state, afterMission } from '../state.js';

const GROUND = 1238;
const SCALE = 0.62;

function hitCircleRect(cx, cy, r, b) {
  const nx = Phaser.Math.Clamp(cx, b.x, b.x + b.w);
  const ny = Phaser.Math.Clamp(cy, b.y, b.y + b.h);
  const dx = cx - nx;
  const dy = cy - ny;
  return dx * dx + dy * dy < r * r;
}

// Phi vụ 1: kéo ngang để né deadline/sếp/họp, hứng trà sữa và tim
export default class M1Deadline extends Phaser.Scene {
  constructor() {
    super('M1');
  }

  create() {
    this.m = CONTENT.missions.M1;
    this.cameras.main.fadeIn(350, 10, 2, 12);
    this.add.image(0, 0, bgOffice(this)).setOrigin(0);
    this.hero = new Hero(this, W / 2, GROUND - 240 * SCALE, { scale: SCALE }).setDepth(100);
    this.hero.idle();
    this.hud = new Hud(this, { hearts: 3, money: true, bar: { value: 1, label: `⏱ ${this.m.duration}s` } });

    this.hearts = 3;
    this.items = [];
    this.elapsed = 0;
    this.spawnIn = 0.4;
    this.inv = 0;
    this.mode = 'intro';
    this.targetX = W / 2;
    this.input.on('pointerdown', (p) => (this.targetX = p.x));
    this.input.on('pointermove', (p) => {
      if (p.isDown) this.targetX = p.x;
    });
    this.keys = this.input.keyboard?.createCursorKeys();
    this.fx = this.add
      .particles(0, 0, 'spark', { speed: { min: 120, max: 320 }, scale: { start: 0.9, end: 0 }, lifespan: 450, blendMode: 'ADD', emitting: false })
      .setDepth(300);
    this.events.once('shutdown', () => this.music?.stop());
    missionIntro(this, this.m, () => this.begin(), { image: 'meme-office' });
  }

  begin() {
    this.mode = 'play';
    this.music = audio.loop('m1', { vol: 0.8 });
  }

  heroBox() {
    const s = SCALE;
    const top = this.hero.y + (this.hero.topY + 14) * s;
    return { x: this.hero.x - 55, y: top, w: 110, h: GROUND - 30 - top };
  }

  spawn(k) {
    const x = Phaser.Math.Between(70, W - 70);
    const vy = Phaser.Math.Linear(360, 600, k) * Phaser.Math.FloatBetween(0.9, 1.15);
    if (Math.random() < 0.33) {
      const r = Math.random();
      const kind = r < 0.18 && this.hearts < 3 ? 'heart' : r < 0.4 ? 'money' : 'tea';
      const c = this.add.container(x, -60, [this.add.image(0, 0, `e-${kind}`).setDisplaySize(84, 84)]).setDepth(200);
      this.items.push({ c, vy, r: 42, bad: false, kind, spin: Phaser.Math.Between(-120, 120) });
      return;
    }
    const b = Phaser.Utils.Array.GetRandom(this.m.bad);
    const icon = this.add.image(0, -10, `e-${b.icon}`).setDisplaySize(88, 88);
    const tag = txt(this, 0, 44, b.label, { size: 18, weight: '800', color: '#ffffff' });
    const bg = this.add.graphics();
    bg.fillStyle(0xd7263d, 1).fillRoundedRect(-tag.width / 2 - 4, 44 - tag.height / 2, tag.width + 8, tag.height, 10);
    const c = this.add.container(x, -80, [icon, bg, tag]).setDepth(200);
    this.items.push({ c, vy, r: 42, bad: true, b, spin: 0 });
  }

  update(_, dms) {
    if (this.mode !== 'play') return;
    const dt = Math.min(dms, 50) / 1000;
    this.elapsed += dt;
    const D = this.m.duration;
    const k = Math.min(1, this.elapsed / D);

    if (this.keys?.left.isDown) this.targetX -= 760 * dt;
    if (this.keys?.right.isDown) this.targetX += 760 * dt;
    this.targetX = Phaser.Math.Clamp(this.targetX, 70, W - 70);
    const dx = this.targetX - this.hero.x;
    this.hero.x += dx * Math.min(1, dt * 14);
    this.hero.angle = Phaser.Math.Clamp(dx * 0.06, -10, 10);

    this.spawnIn -= dt;
    if (this.spawnIn <= 0) {
      this.spawn(k);
      this.spawnIn = Phaser.Math.Linear(0.85, 0.48, k) * Phaser.Math.FloatBetween(0.85, 1.15);
    }

    this.inv = Math.max(0, this.inv - dt);
    const box = this.heroBox();
    for (let i = this.items.length - 1; i >= 0; i--) {
      const it = this.items[i];
      it.c.y += it.vy * dt;
      it.c.angle += it.spin * dt;
      if (hitCircleRect(it.c.x, it.c.y, it.r, box)) {
        this.items.splice(i, 1);
        this.collect(it);
        if (this.mode !== 'play') return;
      } else if (it.c.y > H + 90) {
        if (it.bad) state.dodged++;
        it.c.destroy();
        this.items.splice(i, 1);
      }
    }

    const left = Math.max(0, D - this.elapsed);
    this.hud.setBar(left / D, `⏱ ${Math.ceil(left)}s`);
    if (left <= 0) this.win();
  }

  collect(it) {
    const { x, y } = it.c;
    it.c.destroy();
    if (!it.bad) {
      this.fx.explode(10, x, y);
      if (it.kind === 'heart') {
        this.hearts = Math.min(3, this.hearts + 1);
        this.hud.setHearts(this.hearts);
        audio.sfx('heal');
        pop(this, x, y - 40, '+1 💖', { color: '#ff8fab' });
      } else {
        const v = it.kind === 'money' ? 200 : 100;
        if (it.kind === 'tea') state.tea++;
        this.hud.addMoney(v);
        audio.sfx('coin');
        pop(this, x, y - 40, `+$${v}`, { color: '#8ef06b' });
      }
      return;
    }
    if (this.inv > 0) {
      state.dodged++;
      return;
    }
    this.hearts--;
    this.inv = 1.1;
    this.hud.loseHeart(this.hearts);
    this.hero.hurt();
    audio.sfx('hit');
    audio.buzz(90);
    this.cameras.main.shake(140, 0.01);
    pop(this, Phaser.Math.Clamp(x, 160, W - 160), 860, it.b.ouch, { color: '#ffd1d9', size: 50 });
    if (this.hearts <= 0) this.lose();
  }

  clearItems() {
    for (const it of this.items) {
      this.fx.explode(6, it.c.x, it.c.y);
      it.c.destroy();
    }
    this.items = [];
  }

  win() {
    this.mode = 'won';
    this.music?.stop();
    this.clearItems();
    this.hero.angle = 0;
    this.hero.celebrate();
    this.hero.dropShades();
    this.time.delayedCall(700, () => missionPassed(this, this.m.passed, () => afterMission(this, 'M1')));
  }

  lose() {
    this.mode = 'dead';
    this.music?.stop();
    state.fails.M1++;
    this.time.delayedCall(350, () =>
      wasted(this, {
        canSkip: state.fails.M1 >= 2,
        onRetry: () => this.scene.restart(),
        onSkip: () => afterMission(this, 'M1'),
      }),
    );
  }
}
