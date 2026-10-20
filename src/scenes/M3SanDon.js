import * as Phaser from 'phaser';
import { W, H } from '../theme.js';
import { CONTENT } from '../content.js';
import { audio } from '../audio.js';
import { roadTile } from '../art.js';
import { Hud, pop, missionIntro, missionPassed, wasted } from '../ui/gta.js';
import { state, afterMission } from '../state.js';

const LANES = [200, 360, 520];
const PLAYER_Y = 1000;
const SVG = 0.5; // SVG tải ở 2x

const overlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

// Phi vụ 3 (nhìn từ trên xuống kiểu GTA 1/2): chạy xe máy 3 làn, né chướng ngại, gom hoa hồng.
// Càng nhiều hoa, "độ săn đón" (sao truy nã) càng cao, thêm người cầm hoa rượt phía sau.
export default class M3SanDon extends Phaser.Scene {
  constructor() {
    super('M3');
  }

  create() {
    this.m = CONTENT.missions.M3;
    this.goal = this.m.goal || 20;
    this.cameras.main.fadeIn(350, 10, 2, 12);
    this.road = this.add.tileSprite(W / 2, H / 2, W, H, roadTile(this));
    this.lane = 1;
    this.player = this.add.image(LANES[1], PLAYER_Y, 'scooter-top').setScale(SVG * 1.15).setDepth(100);
    this.hud = new Hud(this, { hearts: 3, stars: true, counter: `🌹 0/${this.goal}` });
    this.fx = this.add
      .particles(0, 0, 'spark', { speed: { min: 100, max: 280 }, scale: { start: 0.8, end: 0 }, lifespan: 420, blendMode: 'ADD', emitting: false, tint: [0xff4f7b, 0xffffff] })
      .setDepth(300);

    this.items = [];
    this.admirers = [];
    this.hearts = 3;
    this.roses = 0;
    this.stars = 0;
    this.elapsed = 0;
    this.spawnIn = 0.6;
    this.inv = 0;
    this.mode = 'intro';

    this.input.on('pointerdown', (p) => this.steer(p.x < W / 2 ? -1 : 1));
    this.input.keyboard?.on('keydown-LEFT', () => this.steer(-1));
    this.input.keyboard?.on('keydown-RIGHT', () => this.steer(1));
    this.input.keyboard?.on('keydown-A', () => this.steer(-1));
    this.input.keyboard?.on('keydown-D', () => this.steer(1));
    this.events.once('shutdown', () => this.music?.stop());
    missionIntro(this, this.m, () => this.begin());
  }

  begin() {
    this.mode = 'play';
    this.music = audio.loop('m3', { vol: 0.75 });
  }

  steer(dir) {
    if (this.mode !== 'play') return;
    const next = Phaser.Math.Clamp(this.lane + dir, 0, 2);
    if (next === this.lane) return;
    this.lane = next;
    audio.sfx('lane');
    this.tweens.killTweensOf(this.player);
    this.tweens.add({ targets: this.player, x: LANES[next], duration: 130, ease: 'Quad.Out' });
    this.player.setAngle(dir * 12);
    this.tweens.add({ targets: this.player, angle: 0, duration: 220, delay: 90 });
  }

  spawnRow(k) {
    const lanes = Phaser.Utils.Array.Shuffle([0, 1, 2]);
    const nBlock = Math.random() < 0.22 ? 0 : k > 0.35 && Math.random() < 0.35 ? 2 : 1;
    lanes.slice(0, nBlock).forEach((l) => this.spawnObstacle(l));
    const free = lanes.slice(nBlock);
    // càng thiếu hoa thì hoa xuất hiện càng dày
    const roseChance = Phaser.Math.Clamp(0.62 + this.elapsed * 0.01, 0.62, 0.9);
    if (free.length && Math.random() < roseChance) this.spawnRose(Phaser.Utils.Array.GetRandom(free));
  }

  spawnObstacle(lane) {
    const x = LANES[lane];
    const r = Math.random();
    if (r < 0.4) {
      const o = this.add.image(x, -120, `car-${Phaser.Math.Between(1, 3)}`).setDepth(60);
      this.items.push({ o, kind: 'car', w: 66, h: 128, rel: 0.55 });
    } else if (r < 0.72) {
      const o = this.add.image(x, -80, 'pothole').setDepth(50);
      this.items.push({ o, kind: 'pothole', w: 92, h: 52, rel: 1 });
    } else {
      const o = this.add.image(x, -80, 'e-barrier').setDisplaySize(96, 96).setDepth(60);
      this.items.push({ o, kind: 'barrier', w: 80, h: 64, rel: 1 });
    }
  }

  spawnRose(lane) {
    const o = this.add.image(LANES[lane], -80, 'e-rose').setDisplaySize(76, 76).setDepth(70);
    this.tweens.add({ targets: o, angle: { from: -12, to: 12 }, duration: 400, yoyo: true, repeat: -1 });
    this.items.push({ o, kind: 'rose', w: 84, h: 84, rel: 1 });
  }

  update(_, dms) {
    const dt = Math.min(dms, 50) / 1000;
    if (this.mode === 'intro') {
      this.road.tilePositionY -= 160 * dt;
      return;
    }
    if (this.mode === 'won') {
      this.road.tilePositionY -= 900 * dt;
      return;
    }
    if (this.mode !== 'play') return;

    this.elapsed += dt;
    const k = Math.min(1, this.elapsed / 30);
    const speed = Phaser.Math.Linear(520, 720, k);
    this.road.tilePositionY -= speed * dt;

    this.spawnIn -= dt;
    if (this.spawnIn <= 0) {
      this.spawnRow(k);
      this.spawnIn = Phaser.Math.Linear(0.72, 0.5, k) * Phaser.Math.FloatBetween(0.9, 1.1);
    }

    this.inv = Math.max(0, this.inv - dt);
    const p = { x: this.player.x - 26, y: PLAYER_Y - 66, w: 52, h: 132 };
    for (let i = this.items.length - 1; i >= 0; i--) {
      const it = this.items[i];
      it.o.y += speed * it.rel * dt;
      const box = { x: it.o.x - it.w / 2, y: it.o.y - it.h / 2, w: it.w, h: it.h };
      if (overlap(p, box)) {
        if (it.kind === 'rose') {
          this.items.splice(i, 1);
          this.collectRose(it);
          if (this.mode !== 'play') return;
          continue;
        }
        if (this.inv <= 0) {
          this.crash();
          if (this.mode !== 'play') return;
        }
      }
      if (it.o.y > H + 140) {
        it.o.destroy();
        this.items.splice(i, 1);
      }
    }

    this.admirers.forEach((a, i) => {
      a.x += (this.player.x + a.off - a.x) * Math.min(1, dt * 3);
      if (a.arrived) a.y = a.baseY + Math.sin(this.elapsed * 6 + i) * 6;
    });
  }

  collectRose(it) {
    const { x, y } = it.o;
    it.o.destroy();
    this.fx.explode(12, x, y);
    this.roses++;
    state.roses++;
    audio.sfx('coin');
    this.hud.setCounter(`🌹 ${this.roses}/${this.goal}`);
    const stars = Math.min(5, Math.floor(this.roses / 4));
    if (stars > this.stars) {
      this.stars = stars;
      state.stars = Math.max(state.stars, stars);
      this.hud.setStars(stars);
      audio.sfx('star');
      this.addAdmirer();
      pop(this, W / 2, 560, 'ĐỘ SĂN ĐÓN TĂNG! ★', { color: '#ffc93c', size: 46 });
    }
    if (this.roses >= this.goal) this.win();
  }

  addAdmirer() {
    const i = this.admirers.length;
    const offs = [-130, 130, -60, 70, 0];
    const c = this.add.container(this.player.x + offs[i % 5], H + 140).setDepth(90);
    const lightL = this.add.circle(-13, -80, 8, 0xff4f7b);
    const lightR = this.add.circle(13, -80, 8, 0x4fa3ff);
    this.tweens.add({ targets: lightL, alpha: 0.15, duration: 170, yoyo: true, repeat: -1 });
    this.tweens.add({ targets: lightR, alpha: 0.15, duration: 170, yoyo: true, repeat: -1, delay: 170 });
    c.add([this.add.image(0, 0, 'admirer-top').setScale(SVG * 1.05), lightL, lightR]);
    c.off = offs[i % 5];
    c.baseY = 1185 + (i % 2) * 55;
    this.tweens.add({ targets: c, y: c.baseY, duration: 700, ease: 'Cubic.Out', onComplete: () => (c.arrived = true) });
    this.admirers.push(c);
  }

  crash() {
    this.hearts--;
    this.inv = 1.2;
    this.hud.loseHeart(this.hearts);
    audio.sfx('hit');
    audio.buzz(90);
    this.cameras.main.shake(160, 0.012);
    this.tweens.add({ targets: this.player, alpha: 0.3, duration: 90, yoyo: true, repeat: 5, onComplete: () => this.player.setAlpha(1) });
    pop(this, this.player.x, PLAYER_Y - 130, 'Ối!', { color: '#ffd1d9', size: 54 });
    if (this.hearts <= 0) this.lose();
  }

  win() {
    this.mode = 'won';
    this.music?.stop();
    for (const it of this.items) {
      this.fx.explode(6, it.o.x, it.o.y);
      it.o.destroy();
    }
    this.items = [];
    this.tweens.add({ targets: this.player, y: -220, duration: 1000, ease: 'Cubic.In' });
    this.admirers.forEach((a, i) => {
      a.arrived = false;
      this.tweens.add({ targets: a, y: -200, duration: 1300, delay: 250 + i * 80, ease: 'Cubic.In' });
    });
    this.time.delayedCall(1150, () => missionPassed(this, this.m.passed, () => afterMission(this, 'M3')));
  }

  lose() {
    this.mode = 'dead';
    this.music?.stop();
    state.fails.M3++;
    this.time.delayedCall(350, () =>
      wasted(this, {
        canSkip: state.fails.M3 >= 2,
        onRetry: () => this.scene.restart(),
        onSkip: () => afterMission(this, 'M3'),
      }),
    );
  }
}
