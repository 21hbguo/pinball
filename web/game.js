'use strict';
/*
 * Pinball (弹珠机) — web version.
 *
 * Rule model (from docs/GAME_DESIGN.md / ClassicSingleBallTable):
 * - Every round launches exactly ONE physical ball.
 * - Press START once to run the multiplier/channel light shuffle, press again
 *   to lock: one base multiplier (2/4/6/8/10) + a set of active channels.
 * - Choose wager N ball-credits, press START to launch.
 * - Ball drops through the peg field into one of 12 terminal channels.
 * - Active channel -> payout = wager x multiplier, else 0.
 *
 * NOTE: active-channel counts for 4X/6X/8X are provisional interpolations
 * (source confirms only 2X~4-5 and 10X~1). Kept configurable below.
 */
(() => {

// ---------------- config (design space 1080x1920) ----------------
const W = 1080, H = 1920;
const BOUNDS = { left: 84, right: 996, top: 300 };
const BALL_R = 30;
const GRAVITY = 2400;
const MAX_SPEED = 3200;
const REST = { peg: 0.62, wall: 0.45, guide: 0.22, obstacle: 0.72, floor: 0.1 };

const CH_LEFT = 84, CH_W = 76, CH_GUIDE_TOP = 1408, CH_FLOOR = 1655, N_CH = 12;

const MULTS = [2, 4, 6, 8, 10];
const MULT_WEIGHTS = [30, 26, 21, 15, 8];
const ACTIVE_RANGE = { 2: [4, 5], 4: [3, 4], 6: [2, 3], 8: [1, 2], 10: [1, 1] };

const START_CREDITS = 30;

// staggered peg field + center obstacle (denser than the provisional config,
// matching the "dense chrome peg field" art direction)
const PEG_R = 22;
const PEGS = [];
for (const [y, xs] of [
  [430, [300, 540, 780]],
  [560, [200, 400, 680, 880]],
  [690, [300, 780]],
  [820, [200, 400, 680, 880]],
  [950, [300, 540, 780]],
  [1080, [200, 400, 680, 880]],
  [1210, [300, 540, 780]],
  [1330, [200, 400, 680, 880]],
]) for (const x of xs) PEGS.push({ x, y });
const OBSTACLE = { x: 540, y: 715, r: 85 };

// channel guide walls: 13 thin rects -> 12 slots
const GUIDES = [];
for (let i = 0; i <= N_CH; i++)
  GUIDES.push({ x: CH_LEFT + i * CH_W - 5, y: CH_GUIDE_TOP, w: 10, h: 262 });

// ---------------- state ----------------
const S = {
  phase: 'awaiting',        // awaiting | shuffle | locked | ball | resolve | over
  wallet: START_CREDITS,
  wager: 1,
  mult: null,
  active: new Set(),
  lastChannel: null,
  lastPayout: 0,
  lastWin: false,
  status: 'PRESS START',
  shuffleT: 0, shuffleIdx: 0, chaseIdx: 0,
  flashT: 0,
  resolveT: 0,
  winFx: null,              // {ch, t}
  floatText: null,          // {x,y,txt,t}
  pegFlash: new Map(),      // peg -> t
};

const ball = { x: 540, y: -100, vx: 0, vy: 0, live: false, settleT: 0, stuckT: 0 };

try {
  const saved = parseInt(localStorage.getItem('pinball_wallet'), 10);
  if (Number.isFinite(saved) && saved > 0) S.wallet = saved;
} catch (_) {}

const saveWallet = () => {
  try { localStorage.setItem('pinball_wallet', String(S.wallet)); } catch (_) {}
};

// ---------------- audio ----------------
let AC = null;
const audio = () => AC || (AC = new (window.AudioContext || window.webkitAudioContext)());
function beep(freq, dur, type = 'square', vol = 0.05, when = 0) {
  try {
    const ac = audio(), o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(vol, ac.currentTime + when);
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + when + dur);
    o.connect(g).connect(ac.destination);
    o.start(ac.currentTime + when); o.stop(ac.currentTime + when + dur + 0.02);
  } catch (_) {}
}
const sfx = {
  peg:   (v) => beep(900 + Math.min(v, 1400) * 0.35, 0.035, 'square', 0.03),
  click: () => beep(700, 0.05, 'square', 0.05),
  lock:  () => { beep(880, 0.08, 'square', 0.06); beep(1320, 0.12, 'square', 0.06, 0.09); },
  launch:() => beep(440, 0.15, 'sawtooth', 0.05),
  win:   () => [523, 659, 784, 1047].forEach((f, i) => beep(f, 0.14, 'square', 0.06, i * 0.09)),
  lose:  () => beep(150, 0.35, 'sawtooth', 0.05),
};

// ---------------- round logic ----------------
function weightedMult() {
  const tot = MULT_WEIGHTS.reduce((a, b) => a + b, 0);
  let r = Math.random() * tot;
  for (let i = 0; i < MULTS.length; i++) { r -= MULT_WEIGHTS[i]; if (r < 0) return MULTS[i]; }
  return MULTS[MULTS.length - 1];
}
function pickActive(mult) {
  const [lo, hi] = ACTIVE_RANGE[mult];
  const n = lo + Math.floor(Math.random() * (hi - lo + 1));
  const idx = new Set();
  while (idx.size < n) idx.add(1 + Math.floor(Math.random() * N_CH));
  return idx;
}
function setStatus(t) { S.status = t; }

function pressStart() {
  sfx.click();
  if (S.phase === 'over') { newSession(); return; }
  if (S.phase === 'awaiting') {
    if (S.wallet < 1) { S.phase = 'over'; setStatus('GAME OVER - START TO RESTART'); sfx.lose(); return; }
    S.phase = 'shuffle'; S.shuffleT = 0;
    setStatus('SHUFFLING... START TO LOCK');
  } else if (S.phase === 'shuffle') {
    S.mult = weightedMult();
    S.active = pickActive(S.mult);
    S.phase = 'locked'; S.flashT = 1.0;
    setStatus(`${S.mult}X LOCKED - SET BET, START TO LAUNCH`);
    sfx.lock();
  } else if (S.phase === 'locked') {
    if (S.wager > S.wallet) { setStatus('BET TOO BIG - LOWER BET OR INSERT'); return; }
    S.wallet -= S.wager; saveWallet();
    launchBall();
  }
}

function launchBall() {
  S.phase = 'ball';
  ball.live = true;
  ball.x = 540 + (Math.random() * 60 - 30);
  ball.y = BOUNDS.top + 40;
  ball.vx = (Math.random() * 2 - 1) * 120;
  ball.vy = 60;
  ball.settleT = 0; ball.stuckT = 0;
  S.lastChannel = null; S.lastPayout = 0; S.lastWin = false; S.winFx = null;
  setStatus('BALL IN PLAY...');
  sfx.launch();
}

function resolveBall() {
  const ch = Math.min(N_CH, Math.max(1, Math.floor((ball.x - CH_LEFT) / CH_W) + 1));
  S.lastChannel = ch;
  S.lastWin = S.active.has(ch);
  S.lastPayout = S.lastWin ? S.wager * S.mult : 0;
  if (S.lastWin) {
    S.wallet += S.lastPayout;
    S.winFx = { ch, t: 1.2 };
    S.floatText = { x: CH_LEFT + (ch - 0.5) * CH_W, y: 1300, txt: `+${S.lastPayout}`, t: 1.4 };
    sfx.win();
  } else {
    sfx.lose();
  }
  saveWallet();
  S.phase = 'resolve'; S.resolveT = 1.4;
  setStatus(S.lastWin ? `CH${ch} ACTIVE - WIN ${S.lastPayout}` : `CH${ch} - NO WIN`);
}

function endResolve() {
  if (S.wallet < 1) { S.phase = 'over'; setStatus('GAME OVER - START TO RESTART'); }
  else { S.phase = 'awaiting'; setStatus('PRESS START'); }
}

function newSession() {
  S.wallet = START_CREDITS; S.wager = 1;
  S.mult = null; S.active = new Set();
  S.lastChannel = null; S.lastPayout = 0; S.lastWin = false;
  S.phase = 'awaiting'; setStatus('PRESS START');
  saveWallet();
}

function addCredit(n) {
  S.wallet += n; saveWallet(); sfx.click();
  if (S.phase === 'over') { S.phase = 'awaiting'; setStatus('PRESS START'); }
}

function changeBet(d) {
  if (S.phase !== 'locked' && S.phase !== 'awaiting' && S.phase !== 'shuffle') return;
  S.wager = Math.min(99, Math.max(1, S.wager + d));
  sfx.click();
}

// ---------------- physics ----------------
function stepPhysics(dt) {
  if (!ball.live) return;
  ball.vy += GRAVITY * dt;
  const sp = Math.hypot(ball.vx, ball.vy);
  if (sp > MAX_SPEED) { ball.vx *= MAX_SPEED / sp; ball.vy *= MAX_SPEED / sp; }
  ball.x += ball.vx * dt;
  ball.y += ball.vy * dt;

  // outer walls
  if (ball.x - BALL_R < BOUNDS.left)  { ball.x = BOUNDS.left + BALL_R;  ball.vx =  Math.abs(ball.vx) * REST.wall; }
  if (ball.x + BALL_R > BOUNDS.right) { ball.x = BOUNDS.right - BALL_R; ball.vx = -Math.abs(ball.vx) * REST.wall; }
  if (ball.y - BALL_R < BOUNDS.top)   { ball.y = BOUNDS.top + BALL_R;   ball.vy =  Math.abs(ball.vy) * REST.wall; }

  // pegs + obstacle
  for (const p of PEGS) hitCircle(p.x, p.y, PEG_R, REST.peg, p);
  hitCircle(OBSTACLE.x, OBSTACLE.y, OBSTACLE.r, REST.obstacle, null);

  // guide walls (rects)
  for (const g of GUIDES) hitRect(g);

  // channel floor: settle
  if (ball.y + BALL_R > CH_FLOOR && ball.y > CH_GUIDE_TOP) {
    ball.y = CH_FLOOR - BALL_R;
    if (Math.abs(ball.vy) > 60) ball.vy = -Math.abs(ball.vy) * REST.floor;
    else ball.vy = 0;
    ball.vx *= 0.85;
    ball.settleT += dt;
    if (ball.settleT > 0.25) { ball.live = false; resolveBall(); return; }
  } else {
    ball.settleT = 0;
  }

  // anti-stuck nudge
  const speed = Math.hypot(ball.vx, ball.vy);
  if (speed < 10 && ball.y < CH_GUIDE_TOP - 20) {
    ball.stuckT += dt;
    if (ball.stuckT > 1.4) {
      ball.vx = (Math.random() * 2 - 1) * 180;
      ball.vy = -120;
      ball.stuckT = 0;
    }
  } else ball.stuckT = 0;

  // failsafe
  if (ball.y > H + 60) { ball.live = false; resolveBall(); }
}

function hitCircle(cx, cy, cr, rest, peg) {
  const dx = ball.x - cx, dy = ball.y - cy;
  const rr = cr + BALL_R, d2 = dx * dx + dy * dy;
  if (d2 >= rr * rr || d2 === 0) return;
  const d = Math.sqrt(d2), nx = dx / d, ny = dy / d;
  ball.x = cx + nx * rr; ball.y = cy + ny * rr;
  const vn = ball.vx * nx + ball.vy * ny;
  if (vn < 0) {
    ball.vx -= (1 + rest) * vn * nx;
    ball.vy -= (1 + rest) * vn * ny;
    if (peg && Math.abs(vn) > 120) { S.pegFlash.set(peg, 0.15); sfx.peg(-vn); }
  }
}

function hitRect(g) {
  const nx = Math.max(g.x, Math.min(ball.x, g.x + g.w));
  const ny = Math.max(g.y, Math.min(ball.y, g.y + g.h));
  const dx = ball.x - nx, dy = ball.y - ny;
  const d2 = dx * dx + dy * dy;
  if (d2 >= BALL_R * BALL_R) return;
  let nrx, nry, d = Math.sqrt(d2);
  if (d === 0) { // inside: push up
    nrx = 0; nry = -1; d = 1;
  } else { nrx = dx / d; nry = dy / d; }
  ball.x = nx + nrx * BALL_R; ball.y = ny + nry * BALL_R;
  const vn = ball.vx * nrx + ball.vy * nry;
  if (vn < 0) {
    ball.vx -= (1 + REST.guide) * vn * nrx;
    ball.vy -= (1 + REST.guide) * vn * nry;
  }
}

// ---------------- input ----------------
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const BTN = {
  start:  { x: 540, y: 1825, r: 62 },
  betM:   { x: 315, y: 1825, r: 38 },
  betP:   { x: 765, y: 1825, r: 38 },
  insert: { x: 150, y: 1825, r: 38 },
  reset:  { x: 930, y: 1825, r: 38 },
};

function toDesign(e) {
  const r = canvas.getBoundingClientRect();
  return { x: (e.clientX - r.left) * W / r.width, y: (e.clientY - r.top) * H / r.height };
}
canvas.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  const p = toDesign(e);
  for (const [name, b] of Object.entries(BTN)) {
    if (Math.hypot(p.x - b.x, p.y - b.y) <= b.r + 8) {
      if (name === 'start') pressStart();
      else if (name === 'betM') changeBet(-1);
      else if (name === 'betP') changeBet(1);
      else if (name === 'insert') addCredit(10);
      else if (name === 'reset') { sfx.click(); newSession(); }
      return;
    }
  }
}, { passive: false });

window.addEventListener('keydown', (e) => {
  if (e.repeat) return;
  if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); pressStart(); }
  else if (e.code === 'ArrowUp' || e.code === 'Equal') changeBet(1);
  else if (e.code === 'ArrowDown' || e.code === 'Minus') changeBet(-1);
  else if (e.code === 'KeyI') addCredit(10);
  else if (e.code === 'KeyR') newSession();
});

// ---------------- update ----------------
function update(dt) {
  if (S.phase === 'shuffle') {
    S.shuffleT += dt;
    S.shuffleIdx = Math.floor(S.shuffleT / 0.07) % MULTS.length;
    S.chaseIdx = Math.floor(S.shuffleT / 0.05) % N_CH;
  }
  if (S.flashT > 0) S.flashT -= dt;
  if (S.phase === 'resolve') { S.resolveT -= dt; if (S.resolveT <= 0) endResolve(); }
  if (S.winFx) { S.winFx.t -= dt; if (S.winFx.t <= 0) S.winFx = null; }
  if (S.floatText) { S.floatText.t -= dt; S.floatText.y -= 40 * dt; if (S.floatText.t <= 0) S.floatText = null; }
  for (const [k, v] of S.pegFlash) { const t = v - dt; if (t <= 0) S.pegFlash.delete(k); else S.pegFlash.set(k, t); }
}

let last = performance.now(), acc = 0;
function frame(now) {
  let dt = (now - last) / 1000; last = now;
  if (dt > 0.1) dt = 0.1;
  update(dt);
  acc += dt;
  const h = 1 / 120;
  while (acc >= h) { stepPhysics(h); acc -= h; }
  draw();
  requestAnimationFrame(frame);
}

// ---------------- drawing ----------------
function rr(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
function led(txt, x, y, size, color = '#FF5040') {
  ctx.save();
  ctx.font = `700 ${size}px "Courier New", monospace`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.shadowColor = color; ctx.shadowBlur = 18;
  ctx.fillStyle = color;
  ctx.fillText(txt, x, y);
  ctx.restore();
}
function label(txt, x, y, size, color = '#8a6d3b') {
  ctx.font = `700 ${size}px Arial, sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(txt, x, y);
}

function draw() {
  // cabinet
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#F7C948'); bg.addColorStop(1, '#EDA93A');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

  // play panel
  rr(40, 30, W - 80, H - 60, 46);
  ctx.fillStyle = '#FFF3D6'; ctx.fill();

  // playfield inset
  rr(BOUNDS.left - 20, BOUNDS.top - 16, BOUNDS.right - BOUNDS.left + 40, CH_FLOOR + 45 - BOUNDS.top, 30);
  ctx.fillStyle = '#FFE8B8'; ctx.fill();
  ctx.strokeStyle = '#E8C98A'; ctx.lineWidth = 4; ctx.stroke();

  drawHud();
  drawField();
  drawChannels();
  if (ball.live || S.phase === 'resolve') drawBall();
  drawDeck();
  drawFloat();
  if (S.phase === 'over') drawOver();
}

function drawHud() {
  // dark panel
  rr(90, 70, 900, 200, 26);
  ctx.fillStyle = '#33241A'; ctx.fill();

  label('BALLS', 205, 105, 26, '#C9A96B');
  led(String(S.wallet).padStart(3, '0'), 205, 160, 62);

  label('WIN', 875, 105, 26, '#C9A96B');
  led(String(S.lastPayout).padStart(3, '0'), 875, 160, 62, S.lastWin ? '#FFD54A' : '#FF5040');

  // multiplier lamps
  label('MULTIPLIER', 540, 92, 22, '#C9A96B');
  MULTS.forEach((m, i) => {
    const x = 372 + i * 84, y = 132;
    const lit = (S.phase === 'shuffle' && i === S.shuffleIdx) ||
                ((S.phase === 'locked' || S.phase === 'ball' || S.phase === 'resolve') && S.mult === m && Math.floor(S.flashT * 8) % 2 === 0) ||
                ((S.phase === 'ball' || S.phase === 'resolve') && S.mult === m);
    ctx.beginPath(); ctx.arc(x, y, 26, 0, Math.PI * 2);
    ctx.fillStyle = lit ? '#FFD54A' : '#4d3a28';
    if (lit) { ctx.shadowColor = '#FFD54A'; ctx.shadowBlur = 20; }
    ctx.fill(); ctx.shadowBlur = 0;
    label(`${m}`, x, y + 1, 24, lit ? '#5a3a00' : '#8a6d3b');
  });

  // status LCD
  rr(150, 186, 780, 66, 12);
  ctx.fillStyle = '#17324a'; ctx.fill();
  ctx.strokeStyle = '#2E8BC0'; ctx.lineWidth = 3; ctx.stroke();
  ctx.font = '700 34px "Courier New", monospace';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = '#7FD4FF';
  ctx.fillText(S.status, 540, 220);
}

function drawField() {
  // center obstacle
  ctx.save();
  ctx.beginPath(); ctx.arc(OBSTACLE.x, OBSTACLE.y, OBSTACLE.r, 0, Math.PI * 2);
  const og = ctx.createRadialGradient(OBSTACLE.x - 20, OBSTACLE.y - 25, 10, OBSTACLE.x, OBSTACLE.y, OBSTACLE.r);
  og.addColorStop(0, '#FFF8E6'); og.addColorStop(1, '#F0B45A');
  ctx.fillStyle = og; ctx.fill();
  ctx.lineWidth = 8; ctx.strokeStyle = '#C98A3B'; ctx.stroke();
  // star
  ctx.translate(OBSTACLE.x, OBSTACLE.y);
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + i * Math.PI / 5, rad = i % 2 ? 28 : 60;
    ctx[i ? 'lineTo' : 'moveTo'](Math.cos(a) * rad, Math.sin(a) * rad);
  }
  ctx.closePath();
  ctx.fillStyle = '#E8792E'; ctx.fill();
  ctx.restore();

  // pegs
  for (const p of PEGS) {
    ctx.beginPath(); ctx.arc(p.x, p.y, PEG_R, 0, Math.PI * 2);
    const g = ctx.createRadialGradient(p.x - 7, p.y - 9, 2, p.x, p.y, PEG_R);
    g.addColorStop(0, '#ffffff'); g.addColorStop(0.6, '#b9c2cc'); g.addColorStop(1, '#6d7683');
    ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = '#59606b'; ctx.lineWidth = 2; ctx.stroke();
    const fl = S.pegFlash.get(p);
    if (fl) {
      ctx.beginPath(); ctx.arc(p.x, p.y, PEG_R + 8, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255,213,74,${fl / 0.15})`; ctx.lineWidth = 5; ctx.stroke();
    }
  }
}

function drawChannels() {
  // lamp strip
  rr(CH_LEFT - 6, 1348, N_CH * CH_W + 12, 48, 10);
  ctx.fillStyle = '#33241A'; ctx.fill();
  for (let i = 1; i <= N_CH; i++) {
    const x = CH_LEFT + (i - 0.5) * CH_W, y = 1372;
    let lit = false;
    if (S.phase === 'shuffle') lit = (i - 1) === S.chaseIdx || (i - 1) === (N_CH - 1 - S.chaseIdx);
    else if (S.active.has(i)) {
      lit = S.phase === 'locked' ? Math.floor(S.flashT * 8) % 2 === 0 : true;
    }
    if (S.lastChannel === i && S.phase === 'resolve') lit = Math.floor(S.resolveT * 10) % 2 === 0 || S.lastWin;
    ctx.beginPath(); ctx.arc(x, y, 14, 0, Math.PI * 2);
    ctx.fillStyle = lit ? '#7CFC9A' : '#54371f';
    if (lit) { ctx.shadowColor = '#7CFC9A'; ctx.shadowBlur = 12; }
    ctx.fill(); ctx.shadowBlur = 0;
    label(String(i), x, y + 1, 16, lit ? '#143b1d' : '#8a6d3b');
  }

  // slots
  for (let i = 0; i < N_CH; i++) {
    const x = CH_LEFT + i * CH_W + 4;
    const isLast = S.lastChannel === i + 1 && (S.phase === 'resolve' || S.phase === 'awaiting');
    const active = S.active.has(i + 1) && (S.phase === 'locked' || S.phase === 'ball' || S.phase === 'resolve');
    rr(x, CH_GUIDE_TOP + 8, CH_W - 8, CH_FLOOR - CH_GUIDE_TOP + 20, 14);
    ctx.fillStyle = '#4A3325'; ctx.fill();
    if (isLast && S.lastWin) {
      ctx.strokeStyle = '#FFD54A'; ctx.lineWidth = 5;
      ctx.shadowColor = '#FFD54A'; ctx.shadowBlur = 16;
      ctx.stroke(); ctx.shadowBlur = 0;
    } else if (active) {
      ctx.strokeStyle = 'rgba(124,252,154,.55)'; ctx.lineWidth = 3; ctx.stroke();
    }
  }

  // guide rails (drawn over slot frames)
  for (const g of GUIDES) {
    rr(g.x, g.y, g.w, g.h, 5);
    const gg = ctx.createLinearGradient(g.x, 0, g.x + g.w, 0);
    gg.addColorStop(0, '#8a94a0'); gg.addColorStop(0.5, '#e8eef4'); gg.addColorStop(1, '#6d7683');
    ctx.fillStyle = gg; ctx.fill();
  }
}

function drawBall() {
  const g = ctx.createRadialGradient(ball.x - 10, ball.y - 12, 4, ball.x, ball.y, BALL_R);
  g.addColorStop(0, '#ffb3a0'); g.addColorStop(0.5, '#E23B2E'); g.addColorStop(1, '#8c1d12');
  ctx.beginPath(); ctx.arc(ball.x, ball.y, BALL_R, 0, Math.PI * 2);
  ctx.fillStyle = g; ctx.fill();
  ctx.strokeStyle = '#6d150c'; ctx.lineWidth = 2; ctx.stroke();
}

function drawBtn(b, txt, sub, c1, c2, ring) {
  ctx.save();
  ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
  const g = ctx.createRadialGradient(b.x - b.r * .3, b.y - b.r * .35, b.r * .15, b.x, b.y, b.r);
  g.addColorStop(0, c1); g.addColorStop(1, c2);
  ctx.fillStyle = g; ctx.fill();
  if (ring) { ctx.lineWidth = 7; ctx.strokeStyle = ring; ctx.stroke(); }
  label(txt, b.x, b.y - (sub ? 6 : 0), b.r > 60 ? 34 : 26, '#fff');
  if (sub) label(sub, b.x, b.y + 24, 18, 'rgba(255,255,255,.85)');
  ctx.restore();
}

function drawDeck() {
  // deck strip
  rr(60, 1698, W - 120, 194, 30);
  ctx.fillStyle = '#6B4A2A'; ctx.fill();
  rr(72, 1710, W - 144, 170, 22);
  ctx.fillStyle = '#7d5834'; ctx.fill();

  // top row: BET readout + effective multiplier
  label('BET', 420, 1736, 26, '#FFe0a0');
  led(String(S.wager).padStart(2, '0'), 515, 1736, 40);
  if (S.mult) led(`${S.mult}X=${S.mult * S.wager}`, 680, 1738, 30, '#FFD54A');
  else label('x MULT = PAYOUT', 680, 1738, 22, '#C9A96B');

  // bottom row: buttons
  const startLit = S.phase !== 'ball' && S.phase !== 'resolve';
  const startTxt = S.phase === 'over' ? 'AGAIN' : S.phase === 'locked' ? 'GO!' : 'START';
  drawBtn(BTN.start, startTxt, null, startLit ? '#7EC8FF' : '#4a6f8c', startLit ? '#1E6FB8' : '#33506b', '#EAF6FF');
  drawBtn(BTN.betM, '-', null, '#FFC46B', '#E8792E');
  drawBtn(BTN.betP, '+', null, '#FFC46B', '#E8792E');
  drawBtn(BTN.insert, '+10', 'BALLS', '#9BE28A', '#3f9e4d');
  drawBtn(BTN.reset, 'NEW', 'GAME', '#d3b08c', '#8a6d4d');
}

function drawFloat() {
  if (!S.floatText) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1, S.floatText.t);
  ctx.font = '700 64px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.shadowColor = '#FFD54A'; ctx.shadowBlur = 24;
  ctx.fillStyle = '#FFE97A';
  ctx.fillText(S.floatText.txt, S.floatText.x, S.floatText.y);
  ctx.restore();
}

function drawOver() {
  ctx.fillStyle = 'rgba(30,18,8,.72)';
  rr(140, 640, 800, 300, 30); ctx.fill();
  led('GAME OVER', 540, 760, 80);
  label('START to restart with ' + START_CREDITS + ' balls', 540, 860, 34, '#FFE0A0');
}

requestAnimationFrame(frame);

// debug/testing hook
window.__pinball = { S, ball, pressStart, newSession };

})();
