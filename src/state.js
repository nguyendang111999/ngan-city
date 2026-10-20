// Số liệu của lượt chơi + điều hướng giữa các màn.
export const MISSIONS = ['M1', 'M2', 'M3'];

const fresh = () => ({
  money: 0,
  dodged: 0,
  tea: 0,
  perfect: 0,
  good: 0,
  roses: 0,
  stars: 0,
  fails: { M1: 0, M2: 0, M3: 0 },
});

export const state = {
  ...fresh(),
  reset() {
    Object.assign(this, fresh());
  },
};

export const fmt = (v) => (typeof v === 'number' ? v.toLocaleString('vi-VN') : String(v));

// Thay {tên} trong chuỗi bằng số liệu hiện tại, VD 'Hoa nhận được: {roses}'
export const fill = (str) =>
  String(str).replace(/\{(\w+)\}/g, (m, k) => (typeof state[k] === 'number' ? fmt(state[k]) : m));

export function goto(scene, key, data = {}) {
  if (scene.__leaving) return;
  scene.__leaving = true;
  scene.events.once('shutdown', () => {
    scene.__leaving = false;
  });
  const target = scene.game.scene.keys[key] ? key : 'Finale';
  let gone = false;
  const go = () => {
    if (gone) return;
    gone = true;
    scene.scene.start(target, data);
  };
  const cam = scene.cameras.main;
  cam.resetFX();
  cam.fadeOut(320, 10, 2, 12);
  cam.once('camerafadeoutcomplete', go);
  setTimeout(go, 700); // phòng khi hiệu ứng fade bị gián đoạn
}

export const startStep = (scene, step) => goto(scene, step < MISSIONS.length ? MISSIONS[step] : 'Finale');
export const afterMission = (scene, key) => goto(scene, 'Phone', { step: MISSIONS.indexOf(key) + 1 });
