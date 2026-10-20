// Nhân vật chị Ngân (nhìn chính diện): thân SVG + 2 tay xoay được + đầu (ảnh thật hoặc hoạt hình).
// Gốc toạ độ của nhân vật là đỉnh cổ; chân ở y = +240, vai ở y = +34.
import * as Phaser from 'phaser';
import { audio } from './audio.js';

const S = 0.5; // SVG được tải ở 2x cho nét, hiển thị ở 0.5

export class Hero extends Phaser.GameObjects.Container {
  constructor(scene, x, y, { scale = 1, shades = false } = {}) {
    super(scene, x, y);
    scene.add.existing(this);
    this.setScale(scale);

    const face = scene.registry.get('face');
    this.mode = face?.mode || 'cartoon';
    this.meme = scene.registry.get('meme');

    this.torso = scene.add.image(0, 0, 'hero-body').setOrigin(0.5, 0).setScale(S);
    this.head = scene.add.container(0, -80);
    this.hairBack = scene.add.image(0, 0, 'hero-hair-back').setScale(S);
    this.bangs = scene.add.image(0, 0, 'hero-bangs').setScale(S);

    if (this.mode === 'sticker') {
      // cằm chạm cổ: cổ nằm ở y = +86 trong toạ độ của đầu
      this.faceY = 86 - face.chin;
      this.face = scene.add.image(0, this.faceY, 'face-photo').setScale(S);
      this.eyesY = this.faceY + face.eyes;
      this.topY = -80 + this.faceY - face.dh / 2;
    } else {
      this.faceY = this.mode === 'blend' ? 13 : 0;
      this.face = scene.add.image(0, this.faceY, this.mode === 'blend' ? 'face-photo' : 'hero-face').setScale(S);
      this.eyesY = 21;
      this.topY = -80 - 103;
    }
    this.faceKey = this.face.texture.key;
    this.showHair(this.mode !== 'sticker');

    this.shades = scene.add.image(0, this.eyesY, 'shades').setScale(S).setVisible(shades);
    this.head.add([this.hairBack, this.face, this.bangs, this.shades]);

    this.armL = this.makeArm(-56, 34, 12, false);
    this.armR = this.makeArm(56, 34, -12, true);
    this.add([this.torso, this.head, this.armL, this.armR]);
  }

  makeArm(x, y, rest, flip) {
    const c = this.scene.add.container(x, y);
    const sleeve = this.scene.add.image(0, 0, 'hero-arm').setOrigin(0.5, 10 / 140).setScale(S).setFlipX(flip);
    const fan = this.scene.add.image(0, 112, 'fan').setOrigin(0.5, 86 / 90).setScale(0, S).setAngle(180).setVisible(false);
    c.add([sleeve, fan]);
    c.rest = rest;
    c.fan = fan;
    c.setAngle(rest);
    return c;
  }

  showHair(on) {
    this.hairBack.setVisible(on);
    this.bangs.setVisible(on);
  }

  idle() {
    this.idleTw?.stop();
    this.head.y = -80;
    this.idleTw = this.scene.tweens.add({ targets: this.head, y: -85, duration: 520, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
  }

  pose(l, r, dur = 160) {
    this.scene.tweens.killTweensOf([this.armL, this.armR]);
    this.scene.tweens.add({ targets: this.armL, angle: l, duration: dur, ease: 'Back.Out' });
    this.scene.tweens.add({ targets: this.armR, angle: r, duration: dur, ease: 'Back.Out' });
  }

  rest(dur = 200) {
    this.pose(this.armL.rest, this.armR.rest, dur);
  }

  wave() {
    this.scene.tweens.killTweensOf(this.armL);
    this.armL.setAngle(150);
    this.scene.tweens.add({ targets: this.armL, angle: 118, duration: 320, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
  }

  celebrate() {
    this.scene.tweens.killTweensOf([this.armL, this.armR]);
    this.armL.setAngle(150);
    this.armR.setAngle(-150);
    this.scene.tweens.add({ targets: this.armL, angle: 168, duration: 180, yoyo: true, repeat: 5 });
    this.scene.tweens.add({ targets: this.armR, angle: -168, duration: 180, yoyo: true, repeat: 5, delay: 90 });
    const y0 = this.y;
    this.scene.tweens.add({ targets: this, y: y0 - 30, duration: 180, yoyo: true, repeat: 2, ease: 'Quad.Out', onComplete: () => (this.y = y0) });
  }

  // Một nhịp "múa quạt": vung tay bên trái hoặc phải lên rồi về
  swing(side) {
    const arm = side === 'L' ? this.armL : this.armR;
    const dir = side === 'L' ? 1 : -1;
    this.scene.tweens.killTweensOf([arm, arm.fan]);
    arm.setAngle(arm.rest);
    this.scene.tweens.add({ targets: arm, angle: dir * 150, duration: 100, hold: 60, yoyo: true, ease: 'Quad.Out' });
    if (arm.fan.visible) {
      arm.fan.scaleX = S * 0.35;
      this.scene.tweens.add({ targets: arm.fan, scaleX: S, duration: 100, hold: 60, yoyo: true });
    }
    this.tiltTw?.stop();
    this.head.angle = 0;
    this.tiltTw = this.scene.tweens.add({ targets: this.head, angle: -8 * dir, duration: 100, yoyo: true });
  }

  showFans(on) {
    for (const a of [this.armL, this.armR]) {
      a.fan.setVisible(on);
      a.fan.scaleX = on ? S * 0.35 : 0;
    }
  }

  hurt() {
    this.scene.tweens.add({ targets: this, alpha: 0.35, duration: 80, yoyo: true, repeat: 4, onComplete: () => this.setAlpha(1) });
    if (this.meme && this.scene.textures.exists('meme-face')) {
      this.face.setTexture('meme-face').setY(86 - this.meme.chin);
      this.showHair(false);
      this.shades.setVisible(false);
      this.restoreTimer?.remove();
      this.restoreTimer = this.scene.time.delayedCall(700, () => this.restoreFace());
    }
  }

  restoreFace() {
    this.face.setTexture(this.faceKey).setY(this.faceY);
    this.showHair(this.mode !== 'sticker');
  }

  dropShades() {
    this.shades.setVisible(true).setY(this.eyesY - 280);
    this.scene.tweens.add({
      targets: this.shades,
      y: this.eyesY,
      duration: 650,
      ease: 'Bounce.Out',
      onComplete: () => audio.sfx('shades'),
    });
  }
}
