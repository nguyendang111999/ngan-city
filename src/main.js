import * as Phaser from 'phaser';
import '@fontsource/anton/400.css';
import '@fontsource/bangers/400.css';
import '@fontsource/be-vietnam-pro/400.css';
import '@fontsource/be-vietnam-pro/600.css';
import '@fontsource/be-vietnam-pro/800.css';
import '@fontsource/dancing-script/700.css';
import './style.css';
import { W, H } from './theme.js';
import { audio } from './audio.js';
import Boot from './scenes/Boot.js';
import Title from './scenes/Title.js';
import Phone from './scenes/Phone.js';
import M1Deadline from './scenes/M1Deadline.js';
import M2MuaQuat from './scenes/M2MuaQuat.js';
import M3SanDon from './scenes/M3SanDon.js';
import Finale from './scenes/Finale.js';

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#140812',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH, width: W, height: H },
  audio: { noAudio: true }, // âm thanh do src/audio.js tự tổng hợp
  input: { activePointers: 3 },
  render: { antialias: true, powerPreference: 'high-performance' },
  scene: [Boot, Title, Phone, M1Deadline, M2MuaQuat, M3SanDon, Finale],
});

if (import.meta.env.DEV) window.__game = game; // chỉ để thử nghiệm khi chạy npm run dev

// Chặn zoom bằng hai ngón trên iOS Safari (iOS bỏ qua user-scalable=no)
document.addEventListener('gesturestart', (e) => e.preventDefault());

// Mở khoá âm thanh ở lần chạm đầu (iOS cần touchend/click, không nhận pointerdown)
for (const ev of ['pointerup', 'touchend', 'click', 'keydown']) {
  window.addEventListener(ev, () => audio.unlock(), { capture: true, passive: true });
}

const muteBtn = document.getElementById('mute');
const syncMute = () => (muteBtn.textContent = audio.isMuted() ? '🔇' : '🔊');
muteBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  audio.toggleMute();
  syncMute();
});
syncMute();
