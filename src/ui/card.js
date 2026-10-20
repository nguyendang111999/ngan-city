// Thiệp 20/10 cuối game (HTML đè lên canvas): slideshow ảnh + lá thư gõ từng chữ.
import './card.css';
import { CONTENT } from '../content.js';

const timers = new Set();

function el(tag, cls = '', text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined) n.textContent = text;
  return n;
}

function buildSlideshow(list) {
  if (!list.length) return null;
  const wrap = el('div', 'slideshow');
  const stage = el('div', 'slides');
  const dots = el('div', 'dots');
  const items = [];
  let cur = 0;
  const show = (k) => {
    if (!items.length) return;
    cur = k % items.length;
    items.forEach((it, i) => {
      it.fig.classList.toggle('active', i === cur);
      it.dot.classList.toggle('active', i === cur);
    });
  };
  list.forEach((m, i) => {
    const fig = el('figure', 'polaroid');
    fig.style.setProperty('--rot', `${(i % 2 ? 1 : -1) * (1.5 + Math.random() * 2)}deg`);
    const dot = el('span', 'dot');
    const entry = { fig, dot };
    const img = new Image();
    img.alt = m.caption || '';
    img.decoding = 'async';
    img.addEventListener('error', () => {
      fig.remove();
      dot.remove();
      items.splice(items.indexOf(entry), 1);
      if (!items.length) wrap.remove();
      else show(cur);
    });
    img.src = m.src;
    fig.append(img);
    if (m.caption) fig.append(el('figcaption', '', m.caption));
    items.push(entry);
    stage.append(fig);
    dots.append(dot);
  });
  show(0);
  let auto = setInterval(() => show(cur + 1), 3600);
  timers.add(auto);
  stage.addEventListener('click', () => {
    clearInterval(auto);
    timers.delete(auto);
    show(cur + 1);
    auto = setInterval(() => show(cur + 1), 3600);
    timers.add(auto);
  });
  wrap.append(stage, dots);
  return wrap;
}

function typeLetter(ps, sign, hint) {
  let pi = 0;
  let ci = 0;
  let done = false;
  let timer = 0;
  const finish = () => {
    if (done) return;
    done = true;
    clearTimeout(timer);
    for (const p of ps) p.textContent = p.dataset.text;
    sign.classList.add('show');
    hint.remove();
  };
  const tick = () => {
    if (done) return;
    const p = ps[pi];
    if (!p) {
      finish();
      return;
    }
    const chars = Array.from(p.dataset.text);
    ci++;
    p.textContent = chars.slice(0, ci).join('');
    if (ci >= chars.length) {
      pi++;
      ci = 0;
      timer = setTimeout(tick, 420);
    } else {
      timer = setTimeout(tick, /[.,!?…—]/.test(chars[ci - 1]) ? 170 : 36);
    }
  };
  tick();
  return finish;
}

export function hideCard() {
  for (const t of timers) clearInterval(t);
  timers.clear();
  document.getElementById('card-root').replaceChildren();
}

export function showCard({ onReplay }) {
  const F = CONTENT.finale;
  const root = document.getElementById('card-root');
  root.replaceChildren();

  const overlay = el('div', 'card-overlay');
  const petals = el('div', 'petals');
  for (let i = 0; i < 18; i++) {
    const p = el('span', 'petal');
    p.style.left = `${Math.random() * 100}%`;
    p.style.animationDelay = `${-Math.random() * 12}s`;
    p.style.animationDuration = `${7 + Math.random() * 6}s`;
    p.style.setProperty('--sway', `${Math.round((Math.random() * 2 - 1) * 70)}px`);
    p.style.setProperty('--s', (0.6 + Math.random() * 0.9).toFixed(2));
    petals.append(p);
  }

  const card = el('div', 'card');
  card.append(el('div', 'card-kicker', F.kicker), el('h1', 'card-title', F.heading), el('p', 'card-sub', F.sub));
  const slides = buildSlideshow(CONTENT.photos.memories || []);
  if (slides) card.append(slides);

  const letter = el('div', 'letter');
  const ps = F.letter
    .filter((s) => s && s.trim())
    .map((text, i) => {
      const p = el('p', i === 0 ? 'letter-greet' : '');
      p.dataset.text = text;
      letter.append(p);
      return p;
    });
  const sign = el('div', 'letter-sign');
  sign.append(el('span', '', F.fromName ? F.signOff : F.signOff.replace(/,\s*$/, '')));
  if (F.fromName) sign.append(el('strong', '', F.fromName));
  const hint = el('div', 'letter-hint', 'Chạm vào thư để hiện hết');
  letter.append(sign, hint);
  card.append(letter, el('div', 'bouquet', '💐'));

  const actions = el('div', 'card-actions');
  const replay = el('button', 'card-btn', '↻ Chơi lại');
  replay.type = 'button';
  replay.addEventListener('click', () => {
    hideCard();
    onReplay();
  });
  actions.append(replay);
  card.append(actions);

  overlay.append(petals, card);
  root.append(overlay);
  requestAnimationFrame(() => overlay.classList.add('show'));

  // Bắt đầu gõ thư khi lá thư hiện ra trong màn hình
  let finish = null;
  const start = () => {
    if (!finish) finish = typeLetter(ps, sign, hint);
  };
  letter.addEventListener('click', () => {
    start();
    finish();
  });
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          io.disconnect();
          start();
        }
      },
      { root: overlay, threshold: 0.15 },
    );
    io.observe(letter);
  } else {
    setTimeout(start, 1500);
  }
}
