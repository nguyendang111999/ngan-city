import * as Phaser from 'phaser';
import { W, H, C } from '../theme.js';
import { CONTENT } from '../content.js';
import { audio } from '../audio.js';
import { bgSunset } from '../art.js';
import { txt, button } from '../ui/gta.js';
import { startStep } from '../state.js';

const P = { x: 70, y: 80, w: 580, h: 1120, r: 64 };

// Điện thoại của Tộc trưởng: gọi đến (lần đầu) rồi nhắn tin giao nhiệm vụ
export default class Phone extends Phaser.Scene {
  constructor() {
    super('Phone');
  }

  init(data) {
    this.step = data?.step ?? 0;
  }

  create() {
    const list = CONTENT.phone;
    this.cfg = list[Math.min(this.step, list.length - 1)];
    this.fast = false;
    this.picked = false;
    this.cameras.main.fadeIn(350, 10, 2, 12);
    this.add.image(0, 0, bgSunset(this)).setOrigin(0);
    this.add.rectangle(W / 2, H / 2, W, H, 0x0b0410, 0.62);
    this.music = audio.loop('title', { vol: 0.45 });
    this.events.once('shutdown', () => this.music?.stop());

    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.4).fillRoundedRect(P.x + 10, P.y + 16, P.w, P.h, P.r);
    g.fillStyle(0x0d0c12, 1).fillRoundedRect(P.x, P.y, P.w, P.h, P.r);
    g.lineStyle(6, 0x3a3644, 1).strokeRoundedRect(P.x, P.y, P.w, P.h, P.r);
    g.fillStyle(0x17161f, 1).fillRoundedRect(P.x + 14, P.y + 14, P.w - 28, P.h - 28, P.r - 14);
    g.fillStyle(0x0d0c12, 1).fillRoundedRect(W / 2 - 70, P.y + 22, 140, 32, 16);
    txt(this, P.x + 62, P.y + 40, '20:10', { size: 22, weight: '800', ox: 0 });
    txt(this, P.x + P.w - 56, P.y + 40, '5G  100%', { size: 20, weight: '800', ox: 1 });

    if (this.cfg.call) this.showCall();
    else this.showChat(false);
  }

  avatar(x, y, r) {
    const c = this.add.container(x, y);
    if (this.textures.exists('tt-avatar')) {
      c.add(this.add.image(0, 0, 'tt-avatar').setScale(r / 96));
    } else {
      c.add([
        this.add.circle(0, 0, r, C.gold).setStrokeStyle(Math.max(3, r * 0.08), 0xffffff),
        this.add.image(0, 2, 'e-crown').setDisplaySize(r * 1.25, r * 1.25),
      ]);
    }
    return c;
  }

  showCall() {
    const L = this.add.container(0, 0);
    for (let i = 0; i < 2; i++) {
      const ring = this.add.circle(W / 2, 430, 110, 0xffffff, 0).setStrokeStyle(4, C.pink, 0.8);
      this.tweens.add({ targets: ring, scale: 1.6, alpha: 0, duration: 1400, delay: i * 700, repeat: -1 });
      L.add(ring);
    }
    L.add([
      this.avatar(W / 2, 430, 100),
      txt(this, W / 2, 600, CONTENT.tocTruong.name, { size: 56, weight: '800' }),
      txt(this, W / 2, 662, 'đang gọi cho bạn…', { size: 28, color: '#b9b4c7' }),
    ]);
    audio.sfx('ring');
    const ringing = this.time.addEvent({ delay: 1500, loop: true, callback: () => audio.sfx('ring') });

    let answered = false;
    const answer = (declined) => {
      if (answered) return;
      answered = true;
      ringing.remove();
      audio.sfx('tap');
      this.time.delayedCall(10, () => {
        L.destroy();
        btns.destroy();
        this.showChat(declined);
      });
    };
    const btns = this.add.container(0, 0);
    const mk = (x, color, icon, label, fn) => {
      const c = this.add.container(x, 960);
      c.add([this.add.circle(0, 0, 66, color), txt(this, 0, -2, icon, { size: 52 }), txt(this, 0, 104, label, { size: 26, color: '#d8d3e3' })]);
      c.setSize(140, 140).setInteractive({ useHandCursor: true });
      c.once('pointerup', fn);
      btns.add(c);
      return c;
    };
    mk(W / 2 - 150, 0xe5394d, '✕', 'Từ chối', () => answer(true));
    const accept = mk(W / 2 + 150, 0x2ecc71, '📞', 'Nghe', () => answer(false));
    this.tweens.add({ targets: accept, angle: { from: -10, to: 10 }, duration: 110, yoyo: true, repeat: -1, repeatDelay: 650 });
  }

  showChat(declined) {
    const hy = P.y + 128;
    this.avatar(P.x + 92, hy, 42);
    txt(this, P.x + 152, hy - 18, CONTENT.tocTruong.name, { size: 32, weight: '800', ox: 0 });
    txt(this, P.x + 152, hy + 20, '● ' + CONTENT.tocTruong.status, { size: 20, color: '#5be38a', ox: 0 });
    this.add.rectangle(W / 2, hy + 64, P.w - 28, 2, 0x2c2a36);

    this.chatTop = hy + 92;
    this.chatBottom = P.y + P.h - 190;
    this.cursorY = this.chatTop;
    this.bubbles = [];
    const shape = this.make.graphics({ add: false });
    shape.fillStyle(0xffffff).fillRect(P.x + 14, this.chatTop - 10, P.w - 28, this.chatBottom - this.chatTop + 20);
    this.chatMask = shape.createGeometryMask();

    const msgs = [...(declined && this.cfg.declined ? [this.cfg.declined] : []), ...this.cfg.messages];
    // chạm màn hình để tin nhắn hiện nhanh hơn
    this.time.delayedCall(300, () => this.input.on('pointerdown', () => (this.fast = true)));
    this.time.delayedCall(450, () => this.playMessages(msgs, () => this.showReplies()));
  }

  playMessages(list, done) {
    if (!list.length) {
      done();
      return;
    }
    const [first, ...rest] = list;
    const dots = this.typing();
    const wait = this.fast ? 160 : Phaser.Math.Clamp(350 + first.length * 16, 650, 1500);
    this.time.delayedCall(wait, () => {
      dots.destroy();
      this.bubble(first, false);
      audio.sfx('msg');
      this.time.delayedCall(this.fast ? 120 : 380, () => this.playMessages(rest, done));
    });
  }

  typing() {
    const g = this.add.graphics();
    g.fillStyle(0x2d2b38, 1).fillRoundedRect(0, 0, 96, 52, 26);
    const dots = [0, 1, 2].map((i) => {
      const d = this.add.circle(26 + i * 22, 26, 6, 0xb9b4c7);
      this.tweens.add({ targets: d, alpha: 0.25, duration: 300, yoyo: true, repeat: -1, delay: i * 150 });
      return d;
    });
    const c = this.add.container(P.x + 40, Math.min(this.cursorY, this.chatBottom - 52), [g, ...dots]);
    c.setMask(this.chatMask);
    return c;
  }

  bubble(text, mine) {
    const t = txt(this, 14, 8, text, { size: 28, weight: '400', color: '#ffffff', wrap: 400, align: 'left', ox: 0, oy: 0 });
    const w = t.width + 28;
    const h = t.height + 16;
    const overflow = this.cursorY + h - this.chatBottom;
    if (overflow > 0) {
      for (const b of this.bubbles) {
        b.targetY -= overflow;
        this.tweens.add({ targets: b, y: b.targetY, duration: 220, ease: 'Cubic.Out' });
      }
      this.cursorY -= overflow;
    }
    const g = this.add.graphics();
    g.fillStyle(mine ? C.pink : 0x2d2b38, 1).fillRoundedRect(0, 0, w, h, Math.min(26, h / 2));
    const x = mine ? P.x + P.w - 40 - w : P.x + 40;
    const c = this.add.container(x, this.cursorY + 16, [g, t]).setAlpha(0);
    c.targetY = this.cursorY;
    c.setMask(this.chatMask);
    this.tweens.add({ targets: c, alpha: 1, y: c.targetY, duration: 220, ease: 'Back.Out' });
    this.bubbles.push(c);
    this.cursorY += h + 16;
    return c;
  }

  showReplies() {
    const rs = this.cfg.replies;
    const two = rs.length === 2;
    const y = P.y + P.h - 108;
    const btns = [];
    const pick = (r) => {
      if (this.picked) return;
      this.picked = true;
      this.time.delayedCall(10, () => {
        for (const b of btns) b.destroy();
        this.bubble(r, true);
        audio.sfx('msg');
        this.time.delayedCall(800, () => startStep(this, this.step));
      });
    };
    rs.forEach((r, i) => {
      const x = two ? W / 2 + (i ? 1 : -1) * 132 : W / 2;
      const b = button(this, x, y, r, () => pick(r), { w: two ? 248 : 420, h: 84, size: 28 }).setScale(0);
      this.tweens.add({ targets: b, scale: 1, duration: 300, ease: 'Back.Out', delay: i * 80 });
      btns.push(b);
    });
  }
}
