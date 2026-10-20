import * as Phaser from 'phaser';
import { W, H, FONT } from '../theme.js';
import { CONTENT } from '../content.js';
import { audio } from '../audio.js';
import { buildTextures, ellipseCrop, squareCrop } from '../art.js';

const SVGS = ['hero-body', 'hero-arm', 'hero-hair-back', 'hero-bangs', 'hero-face', 'shades', 'fan', 'scooter-top', 'admirer-top'];

// Đợi font web (kể cả bộ ký tự tiếng Việt) tải xong rồi mới vẽ chữ lên canvas
async function loadFonts() {
  if (!document.fonts?.load) return;
  const sample = 'Ngân Bảnh ẤẦẨẪẬ ỔỘỚỜ ữ đĐ 20/10';
  const specs = [
    `400 40px "${FONT.gta}"`,
    `400 40px "${FONT.pop}"`,
    `400 40px "${FONT.ui}"`,
    `600 40px "${FONT.ui}"`,
    `800 40px "${FONT.ui}"`,
    `700 40px "${FONT.hand}"`,
  ];
  const all = Promise.all(specs.map((s) => document.fonts.load(s, sample).catch(() => null)));
  await Promise.race([all, new Promise((r) => setTimeout(r, 4000))]);
}

export default class Boot extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload() {
    const label = this.add.text(W / 2, H / 2, 'Đang tải Ngân City…', { fontFamily: 'sans-serif', fontSize: '30px', color: '#ffb3c7' }).setOrigin(0.5);
    this.load.on('progress', (p) => label.setText(`Đang tải Ngân City… ${Math.round(p * 100)}%`));
    this.load.on('loaderror', (f) => console.info('[Ngân City] Bỏ qua file chưa có:', f.url));
    for (const k of SVGS) this.load.svg(k, `assets/${k}.svg`, { scale: 2 });
    const P = CONTENT.photos;
    if (P.face) this.load.image('face-src', P.face);
    if (P.memeFace) this.load.image('meme-face-src', P.memeFace);
    if (P.memeOffice) this.load.image('meme-office', P.memeOffice);
    if (CONTENT.tocTruong.avatar) this.load.image('tt-src', CONTENT.tocTruong.avatar);
  }

  create() {
    this.setup();
  }

  async setup() {
    await loadFonts();
    buildTextures(this);

    const P = CONTENT.photos;
    const mode = P.faceMode === 'blend' ? 'blend' : 'sticker';
    const face = ellipseCrop(this, 'face-src', 'face-photo', P.faceCrop, mode === 'sticker' ? { displayH: 250, ring: 'sticker' } : { displayH: 176, ring: 'soft' });
    this.registry.set('face', face ? { ...face, mode } : null);
    this.registry.set('meme', ellipseCrop(this, 'meme-face-src', 'meme-face', P.memeFaceCrop, { displayH: 250, ring: 'sticker' }));
    ellipseCrop(this, 'tt-src', 'tt-avatar', squareCrop(this, 'tt-src'), { displayH: 96, ring: 'gold' });
    audio.preload();

    // ?scene=M2 để nhảy thẳng vào một màn khi thử nghiệm
    const params = new URLSearchParams(location.search);
    const start = params.get('scene');
    if (start && this.game.scene.keys[start]) this.scene.start(start, { step: Number(params.get('step') || 0) });
    else this.scene.start('Title');
  }
}
