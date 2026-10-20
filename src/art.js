// Vẽ texture bằng canvas: nền các màn, emoji, hình khối, cắt ảnh mặt.
import { W, H } from './theme.js';

const rand = (a, b) => a + Math.random() * (b - a);

function canvasTex(scene, key, w, h) {
  if (scene.textures.exists(key)) return null;
  return scene.textures.createCanvas(key, w, h);
}

function rr(c, x, y, w, h, r) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}

function starPath(c, cx, cy, R, r, n = 5) {
  c.beginPath();
  for (let i = 0; i < n * 2; i++) {
    const rad = i % 2 ? r : R;
    const a = -Math.PI / 2 + (i * Math.PI) / n;
    const x = cx + Math.cos(a) * rad;
    const y = cy + Math.sin(a) * rad;
    if (i) c.lineTo(x, y);
    else c.moveTo(x, y);
  }
  c.closePath();
}

// ---------- emoji & hình khối nhỏ ----------

export const EMOJI = {
  deadline: '📅',
  boss: '👔',
  meeting: '💬',
  mail: '📧',
  heart: '💖',
  money: '💰',
  rose: '🌹',
  barrier: '🚧',
  crown: '👑',
  fire: '🔥',
  clap: '👏',
};

function emoji(scene) {
  for (const [name, ch] of Object.entries(EMOJI)) {
    const t = canvasTex(scene, `e-${name}`, 128, 128);
    if (!t) continue;
    const c = t.context;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.font = '104px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", "Segoe UI Symbol", sans-serif';
    c.fillText(ch, 64, 70);
    t.refresh();
  }
}

// Cốc trà sữa trân châu tự vẽ (emoji 🧋 còn mới, nhiều máy hiện ô vuông)
function bubbleTea(scene) {
  const t = canvasTex(scene, 'e-tea', 128, 128);
  if (!t) return;
  const c = t.context;
  c.save();
  c.translate(74, 6);
  c.rotate(0.22);
  c.fillStyle = '#ff4f7b';
  rr(c, -6, 0, 12, 54, 5);
  c.fill();
  c.restore();
  c.beginPath();
  c.moveTo(28, 42);
  c.lineTo(100, 42);
  c.lineTo(91, 120);
  c.lineTo(37, 120);
  c.closePath();
  const g = c.createLinearGradient(0, 42, 0, 120);
  g.addColorStop(0, '#f6dcc0');
  g.addColorStop(1, '#cf9466');
  c.fillStyle = g;
  c.fill();
  c.lineWidth = 4;
  c.strokeStyle = '#7a4a2a';
  c.stroke();
  c.fillStyle = '#2b1a14';
  for (const [x, y] of [[46, 110], [58, 112], [70, 110], [82, 108], [52, 99], [64, 101], [76, 99]]) {
    c.beginPath();
    c.arc(x, y, 5.5, 0, Math.PI * 2);
    c.fill();
  }
  c.fillStyle = 'rgba(255,255,255,0.9)';
  c.beginPath();
  c.ellipse(64, 42, 39, 10, 0, 0, Math.PI * 2);
  c.fill();
  c.lineWidth = 3;
  c.stroke();
  c.fillStyle = 'rgba(255,255,255,0.35)';
  c.fillRect(40, 54, 7, 40);
  t.refresh();
}

function note(scene, key, c1, c2) {
  const t = canvasTex(scene, key, 120, 120);
  if (!t) return;
  const c = t.context;
  const g = c.createRadialGradient(48, 44, 6, 60, 60, 58);
  g.addColorStop(0, c2);
  g.addColorStop(1, c1);
  c.fillStyle = g;
  c.beginPath();
  c.arc(60, 60, 54, 0, Math.PI * 2);
  c.fill();
  c.lineWidth = 6;
  c.strokeStyle = '#ffffff';
  c.stroke();
  // biểu tượng cây quạt
  c.save();
  c.translate(60, 76);
  c.fillStyle = 'rgba(255,255,255,0.95)';
  c.beginPath();
  c.moveTo(0, 0);
  c.arc(0, 0, 36, Math.PI * 1.18, Math.PI * 1.82);
  c.closePath();
  c.fill();
  c.strokeStyle = c1;
  c.lineWidth = 2.5;
  for (let k = 0; k <= 5; k++) {
    const a = Math.PI * (1.18 + k * 0.128);
    c.beginPath();
    c.moveTo(0, 0);
    c.lineTo(Math.cos(a) * 36, Math.sin(a) * 36);
    c.stroke();
  }
  c.restore();
  t.refresh();
}

function car(scene, key, body, roof) {
  const t = canvasTex(scene, key, 84, 150);
  if (!t) return;
  const c = t.context;
  c.fillStyle = 'rgba(0,0,0,0.25)';
  rr(c, 6, 8, 76, 140, 18);
  c.fill();
  c.fillStyle = body;
  rr(c, 4, 2, 76, 142, 18);
  c.fill();
  c.fillStyle = '#1f2a3a';
  rr(c, 12, 34, 60, 26, 8);
  c.fill();
  c.fillStyle = roof;
  rr(c, 12, 62, 60, 46, 8);
  c.fill();
  c.fillStyle = '#1f2a3a';
  rr(c, 14, 110, 56, 18, 6);
  c.fill();
  c.fillStyle = '#fff6c2';
  rr(c, 10, 4, 16, 8, 3);
  c.fill();
  rr(c, 58, 4, 16, 8, 3);
  c.fill();
  c.fillStyle = '#ff3b3b';
  rr(c, 10, 136, 16, 6, 3);
  c.fill();
  rr(c, 58, 136, 16, 6, 3);
  c.fill();
  t.refresh();
}

function shapes(scene) {
  let t;
  let c;
  if ((t = canvasTex(scene, 'spark', 32, 32))) {
    c = t.context;
    const g = c.createRadialGradient(16, 16, 0, 16, 16, 16);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.35, 'rgba(255,255,255,0.85)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g;
    c.fillRect(0, 0, 32, 32);
    t.refresh();
  }
  if ((t = canvasTex(scene, 'petal', 30, 22))) {
    c = t.context;
    c.fillStyle = '#ff5c86';
    c.beginPath();
    c.ellipse(15, 11, 13, 8, 0.4, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = 'rgba(255,255,255,0.35)';
    c.beginPath();
    c.ellipse(11, 9, 5, 3, 0.4, 0, Math.PI * 2);
    c.fill();
    t.refresh();
  }
  if ((t = canvasTex(scene, 'confetti', 12, 20))) {
    t.context.fillStyle = '#ffffff';
    t.context.fillRect(0, 0, 12, 20);
    t.refresh();
  }
  if ((t = canvasTex(scene, 'star-full', 64, 64))) {
    c = t.context;
    starPath(c, 32, 33, 29, 12);
    c.fillStyle = '#ffffff';
    c.fill();
    c.lineWidth = 4;
    c.strokeStyle = '#1a1020';
    c.stroke();
    t.refresh();
  }
  if ((t = canvasTex(scene, 'star-empty', 64, 64))) {
    c = t.context;
    starPath(c, 32, 33, 29, 12);
    c.fillStyle = 'rgba(20,10,30,0.45)';
    c.fill();
    c.lineWidth = 4;
    c.strokeStyle = 'rgba(255,255,255,0.75)';
    c.stroke();
    t.refresh();
  }
  if ((t = canvasTex(scene, 'ring', 150, 150))) {
    c = t.context;
    c.lineWidth = 8;
    c.strokeStyle = 'rgba(255,255,255,0.85)';
    c.beginPath();
    c.arc(75, 75, 64, 0, Math.PI * 2);
    c.stroke();
    c.lineWidth = 3;
    c.strokeStyle = 'rgba(255,79,123,0.9)';
    c.beginPath();
    c.arc(75, 75, 54, 0, Math.PI * 2);
    c.stroke();
    t.refresh();
  }
  note(scene, 'note-L', '#ff4f7b', '#ffd36b');
  note(scene, 'note-R', '#ff8a1f', '#fff1a8');
  if ((t = canvasTex(scene, 'pothole', 130, 84))) {
    c = t.context;
    c.fillStyle = '#26232c';
    c.beginPath();
    c.ellipse(65, 42, 60, 36, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#141218';
    c.beginPath();
    c.ellipse(66, 45, 44, 24, 0.1, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = '#141218';
    c.lineWidth = 3;
    for (const [x1, y1, x2, y2] of [[10, 30, 30, 38], [104, 20, 118, 12], [96, 70, 116, 78], [24, 66, 8, 76]]) {
      c.beginPath();
      c.moveTo(x1, y1);
      c.lineTo(x2, y2);
      c.stroke();
    }
    t.refresh();
  }
  car(scene, 'car-1', '#4fc3f7', '#9be0ff');
  car(scene, 'car-2', '#ffb74d', '#ffe0b2');
  car(scene, 'car-3', '#9575cd', '#c5b3ee');
  if ((t = canvasTex(scene, 'beam', 160, 900))) {
    c = t.context;
    const g = c.createLinearGradient(0, 0, 0, 900);
    g.addColorStop(0, 'rgba(255,255,255,0.85)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(70, 0);
    c.lineTo(90, 0);
    c.lineTo(160, 900);
    c.lineTo(0, 900);
    c.closePath();
    c.fill();
    t.refresh();
  }
  if ((t = canvasTex(scene, 'disco', 140, 140))) {
    c = t.context;
    c.save();
    c.beginPath();
    c.arc(70, 70, 66, 0, Math.PI * 2);
    c.clip();
    for (let y = 0; y < 140; y += 14)
      for (let x = 0; x < 140; x += 14) {
        const v = 150 + Math.floor(Math.random() * 105);
        c.fillStyle = `rgb(${v},${v},${Math.min(255, v + 12)})`;
        c.fillRect(x, y, 13, 13);
      }
    const g = c.createRadialGradient(48, 44, 4, 70, 70, 70);
    g.addColorStop(0, 'rgba(255,255,255,0.7)');
    g.addColorStop(1, 'rgba(60,30,90,0.55)');
    c.fillStyle = g;
    c.fillRect(0, 0, 140, 140);
    c.restore();
    t.refresh();
  }
}

export function buildTextures(scene) {
  emoji(scene);
  bubbleTea(scene);
  shapes(scene);
}

// ---------- nền các màn (tạo khi cần) ----------

function palm(c, x, y, dir) {
  c.strokeStyle = '#12061a';
  c.lineCap = 'round';
  c.lineWidth = 16;
  c.beginPath();
  c.moveTo(x, y);
  c.quadraticCurveTo(x + dir * 30, y - 200, x + dir * 10, y - 360);
  c.stroke();
  const tx = x + dir * 10;
  const ty = y - 360;
  c.lineWidth = 10;
  for (const [dx, dy] of [[-120, 40], [-90, -30], [-20, -60], [60, -40], [120, 30], [90, 80], [-70, 90]]) {
    c.beginPath();
    c.moveTo(tx, ty);
    c.quadraticCurveTo(tx + dx * 0.5, ty + dy * 0.5 - 40, tx + dx, ty + dy);
    c.stroke();
  }
}

export function bgSunset(scene) {
  const key = 'bg-sunset';
  const t = canvasTex(scene, key, W, H);
  if (!t) return key;
  const c = t.context;
  let g = c.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#1b0a33');
  g.addColorStop(0.3, '#4a1260');
  g.addColorStop(0.5, '#b8195a');
  g.addColorStop(0.62, '#ff5d6c');
  g.addColorStop(0.72, '#ffa66b');
  g.addColorStop(1, '#ffc27a');
  c.fillStyle = g;
  c.fillRect(0, 0, W, H);
  for (let i = 0; i < 80; i++) {
    c.fillStyle = `rgba(255,255,255,${rand(0.2, 0.8).toFixed(2)})`;
    const s = Math.random() < 0.15 ? 3 : 2;
    c.fillRect(rand(0, W), rand(0, H * 0.4), s, s);
  }
  // mặt trời sọc kiểu retro
  const sun = document.createElement('canvas');
  sun.width = 460;
  sun.height = 460;
  const s = sun.getContext('2d');
  g = s.createLinearGradient(0, 0, 0, 460);
  g.addColorStop(0, '#ffe79a');
  g.addColorStop(0.55, '#ff8a5c');
  g.addColorStop(1, '#ff3d7f');
  s.fillStyle = g;
  s.beginPath();
  s.arc(230, 230, 220, 0, Math.PI * 2);
  s.fill();
  s.globalCompositeOperation = 'destination-out';
  for (let k = 0; k < 7; k++) s.fillRect(0, 250 + k * 30, 460, 4 + k * 2.2);
  c.drawImage(sun, W / 2 - 230, 520);
  // các toà nhà
  const base = 1010;
  let x = -10;
  while (x < W + 10) {
    const bw = rand(46, 110);
    const bh = rand(140, 420);
    c.fillStyle = '#1d0b2a';
    c.fillRect(x, base - bh, bw, H - base + bh);
    for (let wy = base - bh + 14; wy < base - 12; wy += 22)
      for (let wx = x + 8; wx < x + bw - 10; wx += 16)
        if (Math.random() < 0.35) {
          c.fillStyle = Math.random() < 0.5 ? 'rgba(255,207,107,0.85)' : 'rgba(255,122,168,0.85)';
          c.fillRect(wx, wy, 7, 10);
        }
    x += bw + rand(2, 10);
  }
  c.fillStyle = '#12061a';
  c.fillRect(0, base, W, H - base);
  palm(c, 70, base + 30, 1);
  palm(c, W - 60, base + 40, -1);
  t.refresh();
  return key;
}

export function bgOffice(scene) {
  const key = 'bg-office';
  const t = canvasTex(scene, key, W, H);
  if (!t) return key;
  const c = t.context;
  let g = c.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#ffe6ee');
  g.addColorStop(1, '#f7c3d3');
  c.fillStyle = g;
  c.fillRect(0, 0, W, H);
  // cửa sổ nhìn ra thành phố
  c.fillStyle = '#ffffff';
  rr(c, 46, 190, 628, 420, 20);
  c.fill();
  g = c.createLinearGradient(0, 204, 0, 596);
  g.addColorStop(0, '#78c4ff');
  g.addColorStop(1, '#dff3ff');
  c.fillStyle = g;
  c.fillRect(60, 204, 600, 392);
  c.fillStyle = '#9cc3e6';
  let x = 60;
  while (x < 660) {
    const bw = rand(34, 80);
    const bh = rand(90, 260);
    c.fillRect(x, 596 - bh, Math.min(bw, 660 - x), bh);
    x += bw + 6;
  }
  c.fillStyle = '#ffffff';
  c.fillRect(356, 204, 8, 392);
  c.fillRect(60, 396, 600, 8);
  // đồng hồ chỉ 5 giờ chiều
  const cx = 600;
  const cy = 730;
  c.fillStyle = '#ffffff';
  c.beginPath();
  c.arc(cx, cy, 58, 0, Math.PI * 2);
  c.fill();
  c.lineWidth = 8;
  c.strokeStyle = '#3a2430';
  c.stroke();
  c.lineCap = 'round';
  c.lineWidth = 7;
  const ha = -Math.PI / 2 + (5 / 12) * Math.PI * 2;
  c.beginPath();
  c.moveTo(cx, cy);
  c.lineTo(cx + Math.cos(ha) * 30, cy + Math.sin(ha) * 30);
  c.stroke();
  c.lineWidth = 5;
  c.beginPath();
  c.moveTo(cx, cy);
  c.lineTo(cx, cy - 44);
  c.stroke();
  c.fillStyle = '#e8435a';
  c.font = '800 24px "Be Vietnam Pro", sans-serif';
  c.textAlign = 'center';
  c.fillText('17:00', cx, cy + 94);
  // poster KPI đi xuống
  c.fillStyle = '#ffffff';
  rr(c, 70, 650, 190, 210, 12);
  c.fill();
  c.strokeStyle = '#3a2430';
  c.lineWidth = 4;
  c.stroke();
  c.fillStyle = '#3a2430';
  c.font = '800 30px "Be Vietnam Pro", sans-serif';
  c.fillText('KPI', 165, 694);
  [120, 96, 70, 40].forEach((bh, i) => {
    c.fillStyle = i === 3 ? '#e8435a' : '#ff9db5';
    c.fillRect(96 + i * 38, 840 - bh, 26, bh);
  });
  // dãy bàn làm việc
  c.fillStyle = '#b07a5b';
  c.fillRect(0, 900, W, 26);
  c.fillStyle = '#8c5c42';
  c.fillRect(0, 926, W, 14);
  for (const mx of [70, 290, 510]) {
    c.fillStyle = '#2b2b33';
    rr(c, mx, 806, 140, 92, 8);
    c.fill();
    c.fillStyle = '#5fb2ff';
    rr(c, mx + 8, 814, 124, 70, 4);
    c.fill();
    c.fillStyle = 'rgba(255,255,255,0.6)';
    for (let k = 0; k < 4; k++) c.fillRect(mx + 18, 826 + k * 14, rand(40, 96), 5);
    c.fillStyle = '#2b2b33';
    c.fillRect(mx + 62, 896, 16, 8);
  }
  // sàn gỗ
  g = c.createLinearGradient(0, 940, 0, H);
  g.addColorStop(0, '#d7b08f');
  g.addColorStop(1, '#bf9372');
  c.fillStyle = g;
  c.fillRect(0, 940, W, H - 940);
  c.strokeStyle = 'rgba(120,80,50,0.25)';
  c.lineWidth = 2;
  for (let y = 980; y < H; y += 48) {
    c.beginPath();
    c.moveTo(0, y);
    c.lineTo(W, y);
    c.stroke();
  }
  t.refresh();
  return key;
}

export function bgClub(scene) {
  const key = 'bg-club';
  const t = canvasTex(scene, key, W, H);
  if (!t) return key;
  const c = t.context;
  let g = c.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#0d0016');
  g.addColorStop(0.5, '#2a0047');
  g.addColorStop(1, '#12001f');
  c.fillStyle = g;
  c.fillRect(0, 0, W, H);
  for (let x = 0; x < W; x += 60) {
    c.fillStyle = x % 120 ? 'rgba(255,255,255,0.025)' : 'rgba(255,79,123,0.05)';
    c.fillRect(x, 0, 60, 960);
  }
  // loa hai bên
  for (const sx of [20, W - 140]) {
    c.fillStyle = '#16121c';
    rr(c, sx, 640, 120, 300, 14);
    c.fill();
    c.strokeStyle = '#3b2f48';
    c.lineWidth = 4;
    c.stroke();
    for (const [cy, r] of [[720, 40], [850, 52]]) {
      c.fillStyle = '#0a080d';
      c.beginPath();
      c.arc(sx + 60, cy, r, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = '#ff4f7b';
      c.lineWidth = 3;
      c.stroke();
      c.fillStyle = '#2a2233';
      c.beginPath();
      c.arc(sx + 60, cy, r * 0.35, 0, Math.PI * 2);
      c.fill();
    }
  }
  // sàn nhảy phối cảnh
  g = c.createLinearGradient(0, 960, 0, H);
  g.addColorStop(0, '#2b0a3d');
  g.addColorStop(1, '#100016');
  c.fillStyle = g;
  c.fillRect(0, 960, W, H - 960);
  c.strokeStyle = 'rgba(255,79,123,0.35)';
  c.lineWidth = 2;
  for (let i = -8; i <= 8; i++) {
    c.beginPath();
    c.moveTo(W / 2 + i * 30, 960);
    c.lineTo(W / 2 + i * 150, H);
    c.stroke();
  }
  for (let k = 0; k < 7; k++) {
    const y = 960 + (H - 960) * Math.pow(k / 6, 1.6);
    c.beginPath();
    c.moveTo(0, y);
    c.lineTo(W, y);
    c.stroke();
  }
  t.refresh();
  return key;
}

// Đoạn đường nhìn từ trên xuống (lặp theo chiều dọc). Làn xe ở x = 200 / 360 / 520.
export function roadTile(scene) {
  const key = 'road';
  const TH = 512;
  const t = canvasTex(scene, key, W, TH);
  if (!t) return key;
  const c = t.context;
  const roofs = (x0, w, heights, seed) => {
    let y = 0;
    heights.forEach((h, i) => {
      c.fillStyle = ['#6c5b7b', '#c06c84', '#355c7d', '#99b898', '#f8b195'][(i + seed) % 5];
      c.fillRect(x0, y, w, h);
      c.strokeStyle = 'rgba(0,0,0,0.35)';
      c.lineWidth = 4;
      c.strokeRect(x0 + 2, y + 2, w - 4, h - 4);
      c.fillStyle = 'rgba(255,255,255,0.18)';
      c.fillRect(x0 + 12, y + 14, 18, 14);
      c.fillRect(x0 + 14, y + h - 32, 14, 12);
      y += h;
    });
  };
  roofs(0, 58, [96, 160, 128, 128], 0);
  roofs(W - 58, 58, [128, 96, 192, 96], 2);
  c.fillStyle = '#cbc5cf';
  c.fillRect(58, 0, 62, TH);
  c.fillRect(600, 0, 62, TH);
  c.strokeStyle = 'rgba(0,0,0,0.12)';
  c.lineWidth = 2;
  for (let y = 0; y < TH; y += 32) {
    c.beginPath();
    c.moveTo(58, y);
    c.lineTo(120, y);
    c.moveTo(600, y);
    c.lineTo(662, y);
    c.stroke();
  }
  for (const [tx, ty] of [[89, 80], [89, 330], [631, 200], [631, 440]]) {
    c.fillStyle = 'rgba(0,0,0,0.2)';
    c.beginPath();
    c.arc(tx + 4, ty + 6, 26, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#3fae5a';
    c.beginPath();
    c.arc(tx, ty, 26, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#5fd27a';
    c.beginPath();
    c.arc(tx - 7, ty - 7, 12, 0, Math.PI * 2);
    c.fill();
  }
  c.fillStyle = '#3b3842';
  c.fillRect(120, 0, 480, TH);
  for (let i = 0; i < 500; i++) {
    c.fillStyle = `rgba(255,255,255,${rand(0.02, 0.06).toFixed(3)})`;
    c.fillRect(rand(120, 600), rand(0, TH), 2, 2);
  }
  c.fillStyle = '#e8e2ea';
  c.fillRect(118, 0, 6, TH);
  c.fillRect(596, 0, 6, TH);
  c.fillStyle = '#ffd34d';
  c.fillRect(132, 0, 5, TH);
  c.fillRect(583, 0, 5, TH);
  c.fillStyle = '#f4f1f6';
  for (let y = 0; y < TH; y += 128) {
    c.fillRect(276, y + 20, 8, 72);
    c.fillRect(436, y + 20, 8, 72);
  }
  t.refresh();
  return key;
}

// ---------- cắt ảnh ----------

function drawClamped(c, img, sx, sy, sw, sh, dx, dy, dw, dh) {
  const x0 = Math.max(0, sx);
  const y0 = Math.max(0, sy);
  const x1 = Math.min(img.width, sx + sw);
  const y1 = Math.min(img.height, sy + sh);
  if (x1 <= x0 || y1 <= y0) return;
  const kx = dw / sw;
  const ky = dh / sh;
  c.drawImage(img, x0, y0, x1 - x0, y1 - y0, dx + (x0 - sx) * kx, dy + (y0 - sy) * ky, (x1 - x0) * kx, (y1 - y0) * ky);
}

// Cắt ảnh thành hình bầu dục (vẽ ở 2x, hiển thị ở 0.5). Trả về kích thước + vị trí mắt/cằm so với tâm.
export function ellipseCrop(scene, srcKey, dstKey, crop, { displayH = 250, ring = 'sticker' } = {}) {
  if (!crop || !scene.textures.exists(srcKey) || scene.textures.exists(dstKey)) {
    return null;
  }
  const img = scene.textures.get(srcKey).getSourceImage();
  const sw = crop.w * img.width;
  const sh = crop.h * img.height;
  const sx = crop.cx * img.width - sw / 2;
  const sy = crop.cy * img.height - sh / 2;
  const dh = displayH;
  const dw = dh * (sw / sh);
  const k = 2;
  const pad = 8;
  const tw = Math.ceil((dw + pad * 2) * k);
  const th = Math.ceil((dh + pad * 2) * k);
  const t = scene.textures.createCanvas(dstKey, tw, th);
  const c = t.context;
  const cx = tw / 2;
  const cy = th / 2;
  const rx = (dw / 2) * k;
  const ry = (dh / 2) * k;
  c.save();
  c.beginPath();
  c.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  c.clip();
  drawClamped(c, img, sx, sy, sw, sh, cx - rx, cy - ry, rx * 2, ry * 2);
  c.restore();
  const stroke = (r, width, color) => {
    c.lineWidth = width * k;
    c.strokeStyle = color;
    c.beginPath();
    c.ellipse(cx, cy, rx + r * k, ry + r * k, 0, 0, Math.PI * 2);
    c.stroke();
  };
  if (ring === 'sticker') {
    stroke(0, 6, '#ffffff');
    stroke(3.5, 2.5, '#ff4f7b');
  } else if (ring === 'gold') {
    stroke(0, 4, '#ffffff');
    stroke(2.5, 2.5, '#ffc93c');
  } else {
    stroke(0, 2, 'rgba(233,90,90,0.6)');
  }
  t.refresh();
  return {
    dw,
    dh,
    eyes: crop.eyes != null ? ((crop.eyes - crop.cy) / crop.h) * dh : 0,
    chin: crop.chin != null ? ((crop.chin - crop.cy) / crop.h) * dh : dh * 0.45,
  };
}

// Vùng cắt vuông ở giữa ảnh (cho avatar)
export function squareCrop(scene, key) {
  if (!scene.textures.exists(key)) return null;
  const img = scene.textures.get(key).getSourceImage();
  const s = Math.min(img.width, img.height);
  return { cx: 0.5, cy: 0.5, w: s / img.width, h: s / img.height };
}
