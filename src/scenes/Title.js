import * as Phaser from 'phaser';
import { W, FONT, C } from '../theme.js';
import { CONTENT } from '../content.js';
import { audio } from '../audio.js';
import { bgSunset } from '../art.js';
import { Hero } from '../hero.js';
import { txt } from '../ui/gta.js';
import { goto, state } from '../state.js';

// Màn hình chờ kiểu GTA: logo, nhân vật đeo kính, thanh loading + mẹo vui
export default class Title extends Phaser.Scene {
  constructor() {
    super('Title');
  }

  create() {
    const T = CONTENT.title;
    state.reset();
    this.cameras.main.fadeIn(450, 10, 2, 12);
    this.add.image(0, 0, bgSunset(this)).setOrigin(0);

    const hero = new Hero(this, W / 2, 800, { scale: 1.05, shades: true });
    hero.idle();
    hero.wave();

    const logo = this.add.container(W / 2, 0).setAngle(-4);
    const gta = txt(this, 0, 180, T.top, { font: FONT.gta, size: 200, color: '#ffffff', stroke: '#140812', strokeThickness: 14, shadow: 10 });
    const city = txt(this, 0, 330, T.main, { font: FONT.pop, size: 118, color: '#ff4f7b', stroke: '#ffffff', strokeThickness: 10, shadow: 8 });
    const badgeBg = this.add.graphics();
    badgeBg.fillStyle(C.gold, 1).fillRoundedRect(-140, 410, 280, 66, 33);
    badgeBg.lineStyle(5, C.ink, 1).strokeRoundedRect(-140, 410, 280, 66, 33);
    const badge = txt(this, 0, 443, T.badge, { font: FONT.pop, size: 44, color: '#3a1020' });
    logo.add([gta, city, badgeBg, badge]);
    gta.setScale(0);
    city.setAlpha(0).setX(220);
    this.tweens.add({ targets: gta, scale: 1, duration: 600, ease: 'Back.Out' });
    this.tweens.add({ targets: city, alpha: 1, x: 0, duration: 500, delay: 250, ease: 'Cubic.Out' });
    const edition = txt(this, W / 2, 518, T.edition, { size: 26, color: '#ffe3ec', stroke: '#140812', strokeThickness: 5 }).setAlpha(0);
    this.tweens.add({ targets: edition, alpha: 1, delay: 700, duration: 400 });

    // mẹo vui + thanh loading giả kiểu GTA
    const tip = txt(this, W / 2, 1128, T.tips[0], { size: 25, color: '#ffffff', wrap: 640, stroke: '#140812', strokeThickness: 5 });
    let ti = 0;
    this.time.addEvent({
      delay: 2600,
      loop: true,
      callback: () => {
        ti = (ti + 1) % T.tips.length;
        this.tweens.add({ targets: tip, alpha: 0, duration: 200, yoyo: true, onYoyo: () => tip.setText(T.tips[ti]) });
      },
    });
    const bar = this.add.graphics();
    const prog = { v: 0 };
    const drawBar = () => {
      bar.clear();
      bar.fillStyle(0x000000, 0.5).fillRoundedRect(W / 2 - 240, 1186, 480, 16, 8);
      bar.fillStyle(C.pink, 1).fillRoundedRect(W / 2 - 240, 1186, Math.max(16, 480 * prog.v), 16, 8);
    };
    drawBar();
    this.tweens.add({ targets: prog, v: 1, duration: 2600, ease: 'Sine.InOut', onUpdate: drawBar, onComplete: () => this.ready(bar) });
  }

  ready(bar) {
    bar.destroy();
    const T = CONTENT.title;
    const tap = txt(this, W / 2, 1190, T.tapToStart, { font: FONT.pop, size: 60, color: '#ffffff', stroke: '#140812', strokeThickness: 9 });
    this.tweens.add({ targets: tap, scale: 1.08, duration: 520, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    txt(this, W / 2, 1248, T.soundHint, { size: 20, color: '#ffe3ec' });
    const start = () => {
      audio.unlock();
      audio.sfx('go');
      goto(this, 'Phone', { step: 0 });
    };
    this.input.once('pointerup', start);
    this.input.keyboard?.once('keydown', start);
  }
}
