// Giao diện kiểu GTA dùng chung: chữ, nút, HUD, giới thiệu phi vụ, MISSION PASSED, WASTED.
import * as Phaser from 'phaser';
import { W, H, FONT, C } from '../theme.js';
import { CONTENT } from '../content.js';
import { audio } from '../audio.js';
import { state, fmt, fill } from '../state.js';

// Chữ có sẵn đệm cho dấu tiếng Việt (Ấ, Ổ… không bị cắt đầu)
export function txt(scene, x, y, str, o = {}) {
  const size = o.size || 34;
  const st = o.strokeThickness || 0;
  const font = o.font || FONT.ui;
  const style = {
    fontFamily: `"${font}", "${FONT.ui}", sans-serif`,
    fontSize: `${size}px`,
    fontStyle: o.weight || (font === FONT.ui ? '600' : 'normal'),
    color: o.color || '#ffffff',
    align: o.align || 'center',
    resolution: 2,
    testString: '|MÉqgyẤỔỮẬ',
    padding: {
      left: Math.ceil(size * 0.1) + st,
      right: Math.ceil(size * 0.1) + st,
      top: Math.ceil(size * 0.12) + st,
      bottom: Math.ceil(size * 0.12) + st,
    },
  };
  if (st) {
    style.stroke = o.stroke || '#000000';
    style.strokeThickness = st;
  }
  if (o.wrap) style.wordWrap = { width: o.wrap, useAdvancedWrap: true };
  if (o.lineSpacing) style.lineSpacing = o.lineSpacing;
  if (o.shadow) {
    style.shadow = { offsetX: 0, offsetY: o.shadow === true ? 5 : o.shadow, color: '#000000', blur: 0, fill: true, stroke: true };
  }
  return scene.add.text(x, y, str, style).setOrigin(o.ox ?? 0.5, o.oy ?? 0.5);
}

export function button(scene, x, y, label, onClick, o = {}) {
  const { w = 420, h = 96, color = C.pink, size = 34, textColor = '#ffffff' } = o;
  const c = scene.add.container(x, y);
  const g = scene.add.graphics();
  g.fillStyle(0x000000, 0.35).fillRoundedRect(-w / 2, -h / 2 + 8, w, h, h / 2);
  g.fillStyle(color, 1).fillRoundedRect(-w / 2, -h / 2, w, h, h / 2);
  g.lineStyle(4, 0xffffff, 0.9).strokeRoundedRect(-w / 2, -h / 2, w, h, h / 2);
  const t = txt(scene, 0, -2, label, { size, weight: '800', color: textColor });
  c.add([g, t]);
  c.setSize(w, h).setInteractive({ useHandCursor: true });
  let used = false;
  c.on('pointerdown', () => {
    audio.sfx('tap');
    scene.tweens.add({ targets: c, scaleX: c.scaleX * 0.94, scaleY: c.scaleY * 0.94, duration: 70, yoyo: true });
  });
  c.on('pointerup', () => {
    if (used && o.once !== false) return;
    used = true;
    onClick();
  });
  return c;
}

// Chữ nổi lên rồi mờ dần (điểm cộng, "BẢNH!"...)
export function pop(scene, x, y, str, o = {}) {
  const { color = '#ffffff', size = 44, font = FONT.pop, rise = 80, dur = 650 } = o;
  const t = txt(scene, x, y, str, { font, size, color, stroke: '#000000', strokeThickness: 7 }).setDepth(600).setScale(0.6);
  scene.tweens.add({ targets: t, scale: 1, duration: 140, ease: 'Back.Out' });
  scene.tweens.add({ targets: t, y: y - rise, alpha: 0, delay: 220, duration: dur, ease: 'Quad.In', onComplete: () => t.destroy() });
  return t;
}

export class Hud {
  constructor(scene, { hearts = 0, money = false, stars = false, bar = null, counter = null } = {}) {
    this.scene = scene;
    this.L = scene.add.container(0, 0).setDepth(700);
    this.heartImgs = [];
    for (let i = 0; i < hearts; i++) {
      const h = scene.add.image(52 + i * 64, 62, 'e-heart').setDisplaySize(60, 60);
      this.heartImgs.push(h);
      this.L.add(h);
    }
    if (money) {
      this.shown = state.money;
      this.moneyText = txt(scene, W - 26, 54, '$' + fmt(this.shown), { font: FONT.gta, size: 50, color: '#8ef06b', stroke: '#0a2a0a', strokeThickness: 8, ox: 1 });
      this.moneyLabel = txt(scene, W - 30, 102, 'NGÂN LƯỢNG', { size: 17, weight: '800', color: '#e6ffd9', stroke: '#0a2a0a', strokeThickness: 5, ox: 1 });
      this.L.add([this.moneyText, this.moneyLabel]);
    }
    if (stars) {
      this.starImgs = [];
      for (let i = 0; i < 5; i++) {
        const s = scene.add.image(W - 40 - (4 - i) * 50, money ? 150 : 62, 'star-empty').setDisplaySize(46, 46);
        this.starImgs.push(s);
        this.L.add(s);
      }
    }
    if (bar) {
      this.bar = { x: W / 2 - 170, y: money ? 170 : 130, w: 340, h: 28, color: bar.color ?? C.pink };
      if (stars) this.bar.y = 210;
      const b = this.bar;
      const bg = scene.add.graphics();
      bg.fillStyle(0x000000, 0.45).fillRoundedRect(b.x - 5, b.y - 5, b.w + 10, b.h + 10, 19);
      this.barFg = scene.add.graphics();
      this.barText = txt(scene, W / 2, b.y + b.h / 2, bar.label || '', { size: 19, weight: '800', color: '#ffffff', stroke: '#000000', strokeThickness: 4 });
      this.L.add([bg, this.barFg, this.barText]);
      this.setBar(bar.value ?? 0);
    }
    if (counter !== null) {
      this.counter = txt(scene, W / 2, 62, counter, { font: FONT.pop, size: 50, color: '#ffffff', stroke: '#000000', strokeThickness: 8 });
      this.L.add(this.counter);
    }
  }

  setBar(frac, label) {
    const b = this.bar;
    if (!b) return;
    const f = Phaser.Math.Clamp(frac, 0, 1);
    this.barFg.clear();
    if (f > 0) this.barFg.fillStyle(b.color, 1).fillRoundedRect(b.x, b.y, Math.max(b.h, b.w * f), b.h, 14);
    if (label !== undefined) this.barText.setText(label);
  }

  setHearts(n) {
    this.heartImgs.forEach((h, i) => {
      if (i < n) h.clearTint().setAlpha(1);
      else h.setTint(0x333333).setAlpha(0.35);
    });
  }

  loseHeart(n) {
    this.setHearts(n);
    const h = this.heartImgs[n];
    if (h) this.scene.tweens.add({ targets: h, scaleX: h.scaleX * 1.6, scaleY: h.scaleY * 1.6, duration: 120, yoyo: true });
  }

  addMoney(v) {
    state.money += v;
    if (!this.moneyText) return;
    this.moneyTw?.stop();
    this.moneyTw = this.scene.tweens.addCounter({
      from: this.shown,
      to: state.money,
      duration: 380,
      onUpdate: (tw) => {
        this.shown = Math.round(tw.getValue());
        this.moneyText.setText('$' + fmt(this.shown));
      },
    });
  }

  setStars(n) {
    this.starImgs?.forEach((s, i) => {
      const on = i < n;
      const was = s.texture.key === 'star-full';
      s.setTexture(on ? 'star-full' : 'star-empty').setDisplaySize(46, 46);
      if (on && !was) this.scene.tweens.add({ targets: s, scaleX: s.scaleX * 1.8, scaleY: s.scaleY * 1.8, duration: 150, yoyo: true });
    });
  }

  setCounter(str) {
    if (!this.counter) return;
    this.counter.setText(str);
    this.scene.tweens.add({ targets: this.counter, scale: 1.15, duration: 80, yoyo: true });
  }
}

// Đếm ngược 3-2-1-BẮT ĐẦU!
export function countdown(scene, onGo) {
  const seq = CONTENT.countdown;
  let i = 0;
  const next = () => {
    if (i >= seq.length) {
      onGo();
      return;
    }
    const last = i === seq.length - 1;
    const t = txt(scene, W / 2, H * 0.45, seq[i], {
      font: FONT.pop,
      size: last ? 128 : 220,
      color: last ? '#ffc93c' : '#ffffff',
      stroke: '#000000',
      strokeThickness: 12,
      shadow: 6,
    })
      .setDepth(850)
      .setScale(1.8)
      .setAlpha(0);
    audio.sfx(last ? 'go' : 'count');
    scene.tweens.add({ targets: t, scale: 1, alpha: 1, duration: 220, ease: 'Back.Out' });
    scene.tweens.add({ targets: t, alpha: 0, scale: 0.85, delay: last ? 420 : 330, duration: 160, onComplete: () => t.destroy() });
    i++;
    scene.time.delayedCall(last ? 380 : 520, next);
  };
  next();
}

// Màn giới thiệu phi vụ (tag + tên + hướng dẫn), có thể kèm ảnh polaroid
export function missionIntro(scene, m, onGo, { image, withCountdown = true } = {}) {
  const L = scene.add.container(0, 0).setDepth(800);
  const dim = scene.add.rectangle(W / 2, H / 2, W, H, 0x0b0410, 0.62).setInteractive();
  L.add(dim);
  const hasImg = image && scene.textures.exists(image);
  const cy = hasImg ? 730 : 560;
  if (hasImg) {
    const src = scene.textures.get(image).getSourceImage();
    const k = Math.min(320 / src.width, 300 / src.height);
    const pw = src.width * k + 26;
    const ph = src.height * k + 26;
    const frame = scene.add.rectangle(0, 0, pw, ph, 0xffffff);
    const img = scene.add.image(0, 0, image).setScale(k);
    const pol = scene.add.container(W / 2, 330, [frame, img]).setAngle(-5).setScale(0);
    L.add(pol);
    scene.tweens.add({ targets: pol, scale: 1, duration: 450, ease: 'Back.Out', delay: 150 });
  }
  const band = scene.add.rectangle(W / 2, cy + 40, W, 310, 0x000000, 0.72);
  const tag = txt(scene, W / 2, cy - 62, m.tag, { size: 30, weight: '800', color: '#ff8fab' });
  const title = txt(scene, W / 2, cy + 16, m.title, { font: FONT.pop, size: 112, color: '#ffffff', stroke: '#000000', strokeThickness: 10, shadow: 6 });
  const hint = txt(scene, W / 2, cy + 132, m.hint, { size: 29, color: '#ffffff', wrap: 640, lineSpacing: 6 });
  L.add([band, tag, title, hint]);
  title.x = W * 1.6;
  tag.setAlpha(0);
  hint.setAlpha(0);
  scene.tweens.add({ targets: title, x: W / 2, duration: 420, ease: 'Cubic.Out' });
  scene.tweens.add({ targets: [tag, hint], alpha: 1, duration: 300, delay: 250 });
  audio.sfx('whoosh');
  let gone = false;
  const go = () => {
    if (gone) return;
    gone = true;
    scene.tweens.add({
      targets: L,
      alpha: 0,
      duration: 250,
      onComplete: () => {
        L.destroy();
        if (withCountdown) countdown(scene, onGo);
        else onGo();
      },
    });
  };
  scene.time.delayedCall(3200, go);
  scene.time.delayedCall(700, () => dim.once('pointerdown', go)); // chạm để vào nhanh
}

export function missionPassed(scene, lines, onDone) {
  audio.sfx('passed');
  audio.buzz([40, 60, 40]);
  const L = scene.add.container(0, 0).setDepth(900);
  const dim = scene.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0).setInteractive();
  const band = scene.add.rectangle(W / 2, H * 0.46, W, 400, 0x000000, 0);
  const title = txt(scene, W / 2, H * 0.4, 'MISSION PASSED!', {
    font: FONT.pop,
    size: 104,
    color: '#ffc93c',
    stroke: '#1a0d00',
    strokeThickness: 12,
    shadow: 6,
  })
    .setScale(2.4)
    .setAlpha(0);
  L.add([dim, band, title]);
  scene.tweens.add({ targets: dim, fillAlpha: 0.3, duration: 250 });
  scene.tweens.add({ targets: band, fillAlpha: 0.6, duration: 250 });
  scene.tweens.add({ targets: title, scale: 1, alpha: 1, duration: 420, ease: 'Back.Out' });
  lines.forEach((line, i) => {
    const t = txt(scene, W / 2, H * 0.4 + 112 + i * 62, fill(line), { size: 38, weight: '800', color: '#ffffff', stroke: '#000000', strokeThickness: 7 }).setAlpha(0);
    L.add(t);
    scene.tweens.add({ targets: t, alpha: 1, y: t.y - 8, delay: 650 + i * 380, duration: 260, onStart: () => audio.sfx('coin') });
  });
  const hint = txt(scene, W / 2, H * 0.4 + 112 + lines.length * 62 + 50, 'Chạm để tiếp tục ▶', { size: 27, color: '#ffe3ec' }).setAlpha(0);
  L.add(hint);
  let ready = false;
  let done = false;
  const finish = () => {
    if (!ready || done) return;
    done = true;
    onDone();
  };
  scene.time.delayedCall(650 + lines.length * 380 + 400, () => {
    ready = true;
    scene.tweens.add({ targets: hint, alpha: 1, duration: 400, yoyo: true, hold: 600, repeat: -1 });
  });
  dim.on('pointerdown', finish);
  scene.time.delayedCall(9000, () => {
    ready = true;
    finish();
  });
}

export function wasted(scene, { canSkip, onRetry, onSkip, line }) {
  audio.sfx('wasted');
  audio.buzz([80, 60, 160]);
  const L = scene.add.container(0, 0).setDepth(950);
  const gray = scene.add.rectangle(W / 2, H / 2, W, H, 0x161216, 0).setInteractive();
  L.add(gray);
  scene.tweens.add({ targets: gray, fillAlpha: 0.78, duration: 600 });
  const y = H * 0.4;
  if (scene.textures.exists('meme-face')) {
    const m = scene.add.image(W / 2, y - 210, 'meme-face').setScale(0).setAngle(-8);
    L.add(m);
    scene.tweens.add({ targets: m, scale: 0.42, duration: 420, delay: 300, ease: 'Back.Out' });
  }
  const t = txt(scene, W / 2, y, CONTENT.wasted.title, { font: FONT.gta, size: 150, color: '#d7263d', stroke: '#000000', strokeThickness: 10, shadow: 6 })
    .setAlpha(0)
    .setScale(1.3);
  const sub = txt(scene, W / 2, y + 125, line || Phaser.Utils.Array.GetRandom(CONTENT.wasted.lines), { size: 31, color: '#ffffff', wrap: 600 }).setAlpha(0);
  L.add([t, sub]);
  scene.tweens.add({ targets: t, alpha: 1, scale: 1, duration: 500, delay: 200, ease: 'Cubic.Out' });
  scene.tweens.add({ targets: sub, alpha: 1, delay: 700, duration: 300 });
  const buttons = [button(scene, W / 2, y + 270, CONTENT.wasted.retry, onRetry, { w: 420 })];
  if (canSkip) buttons.push(button(scene, W / 2, y + 390, CONTENT.wasted.skip, onSkip, { w: 540, color: 0x3a3340, size: 29 }));
  for (const b of buttons) {
    b.setVisible(false).setAlpha(0);
    L.add(b);
  }
  scene.time.delayedCall(900, () => {
    for (const b of buttons) b.setVisible(true);
    scene.tweens.add({ targets: buttons, alpha: 1, duration: 300 });
  });
}
