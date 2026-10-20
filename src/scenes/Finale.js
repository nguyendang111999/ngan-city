import * as Phaser from 'phaser';
import { W, H, FONT } from '../theme.js';
import { CONTENT } from '../content.js';
import { audio } from '../audio.js';
import { bgSunset } from '../art.js';
import { Hero } from '../hero.js';
import { txt, button } from '../ui/gta.js';
import { fill, goto } from '../state.js';
import { showCard } from '../ui/card.js';

// Màn phá đảo: pháo hoa, bảng chỉ số, nút mở thư (thiệp HTML)
export default class Finale extends Phaser.Scene {
  constructor() {
    super('Finale');
  }

  create() {
    const F = CONTENT.finale;
    this.cardOpen = false;
    this.cameras.main.fadeIn(500, 10, 2, 12);
    this.add.image(0, 0, bgSunset(this)).setOrigin(0);
    this.add.rectangle(W / 2, H / 2, W, H, 0x0b0410, 0.55);
    this.music = audio.loop('finale', { vol: 0.85 });
    this.events.once('shutdown', () => this.music?.stop());

    const fw = this.add
      .particles(0, 0, 'spark', {
        speed: { min: 140, max: 420 },
        scale: { start: 0.9, end: 0 },
        alpha: { start: 1, end: 0 },
        lifespan: 1200,
        gravityY: 260,
        blendMode: 'ADD',
        emitting: false,
        tint: [0xff4f7b, 0xffc93c, 0xffffff, 0xff8fab],
      })
      .setDepth(5);
    this.time.addEvent({
      delay: 700,
      loop: true,
      callback: () => {
        fw.explode(46, Phaser.Math.Between(90, W - 90), Phaser.Math.Between(140, 600));
        if (Math.random() < 0.5) audio.sfx('firework');
      },
    });

    txt(this, W / 2, 104, 'MISSION COMPLETE', { size: 30, weight: '800', color: '#ffc93c', stroke: '#140812', strokeThickness: 6 }).setDepth(10);
    const head = txt(this, W / 2, 182, F.complete, { font: FONT.pop, size: 86, color: '#ffc93c', stroke: '#1a0d00', strokeThickness: 10, shadow: 6 })
      .setDepth(10)
      .setScale(0);
    this.tweens.add({ targets: head, scale: 1, duration: 600, ease: 'Back.Out' });

    const hero = new Hero(this, W / 2, 470, { scale: 0.78 }).setDepth(10);
    hero.idle();
    this.time.delayedCall(900, () => {
      hero.dropShades();
      hero.celebrate();
    });

    const g = this.add.graphics().setDepth(10);
    g.fillStyle(0x000000, 0.5).fillRoundedRect(60, 690, W - 120, 400, 28);
    g.lineStyle(3, 0xffc93c, 0.8).strokeRoundedRect(60, 690, W - 120, 400, 28);
    F.stats.forEach((line, i) => {
      const t = txt(this, W / 2, 742 + i * 60, fill(line), { size: 31, color: '#ffffff' }).setDepth(11).setAlpha(0);
      this.tweens.add({ targets: t, alpha: 1, x: { from: W / 2 - 30, to: W / 2 }, delay: 1300 + i * 280, duration: 260, onStart: () => audio.sfx('coin') });
    });

    this.time.delayedCall(1300 + F.stats.length * 280 + 300, () => {
      const b = button(this, W / 2, 1176, F.openLetter, () => this.openCard(), { w: 460, h: 100, size: 38 }).setDepth(20).setScale(0);
      this.tweens.add({ targets: b, scale: 1, duration: 400, ease: 'Back.Out' });
      this.tweens.add({ targets: b, angle: { from: -2, to: 2 }, duration: 600, yoyo: true, repeat: -1, delay: 400 });
    });
  }

  openCard() {
    if (this.cardOpen) return;
    this.cardOpen = true;
    audio.sfx('whoosh');
    showCard({
      onReplay: () => {
        this.game.loop.wake();
        goto(this, 'Title');
      },
    });
    // tạm dừng vẽ canvas phía sau cho đỡ tốn pin (nhạc vẫn chạy)
    this.time.delayedCall(700, () => this.game.loop.sleep());
  }
}
