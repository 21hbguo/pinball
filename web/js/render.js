'use strict';
/*
 * All canvas drawing: cabinet, HUD (LED/LCD), launch lane + plunger,
 * walls/rails, peg field, channels/lamps, control deck, overlays.
 */

import {
  W, H, BALL_R, WALL_L, DIV_L, DIV_R, WALL_R, DIV_TOP, FLOOR_Y, LANE_CX,
  TOP_ARC, DIV_TIP, N_CH, CH_LEFT, CH_W, CH_GUIDE_TOP,
  MULTS, PEG_R, PEGS, OBSTACLE, GUIDES, BTN, CHARGE_FULL_MS,
  START_CREDITS,
} from './config.js';
import { S, ball } from './state.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

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

export function draw() {
  // cabinet
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#F7C948'); bg.addColorStop(1, '#EDA93A');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

  // face panel
  rr(40, 30, W - 80, H - 60, 46);
  ctx.fillStyle = '#FFF3D6'; ctx.fill();

  // playfield inset (covers field + launch lane)
  rr(62, 200, 1012, FLOOR_Y + 55 - 200, 30);
  ctx.fillStyle = '#FFE8B8'; ctx.fill();
  ctx.strokeStyle = '#E8C98A'; ctx.lineWidth = 4; ctx.stroke();

  drawLane();
  drawHud();
  drawField();
  drawChannels();
  drawWalls();
  if (ball.live || S.phase === 'resolve') drawBall();
  drawDeck();
  drawFloat();
  if (S.phase === 'over') drawOver();
}

function drawLane() {
  // lane interior shading (mouth zone above the divider tip included)
  ctx.fillStyle = '#F3D9A0';
  ctx.fillRect(DIV_R, 340, WALL_R - DIV_R, FLOOR_Y - 340);

  // power fill while charging
  if (S.chargeOn) {
    const p = Math.min(1, S.chargeT / (CHARGE_FULL_MS / 1000));
    const fh = (FLOOR_Y - 340) * p;
    const g = ctx.createLinearGradient(0, FLOOR_Y, 0, FLOOR_Y - fh);
    g.addColorStop(0, 'rgba(232,121,46,.75)'); g.addColorStop(1, 'rgba(255,213,74,.15)');
    ctx.fillStyle = g;
    ctx.fillRect(DIV_R + 2, FLOOR_Y - fh, WALL_R - DIV_R - 4, fh);
  }

  // plunger: spring zigzag + plate under the ball
  const plateY = FLOOR_Y + 8;
  const compress = S.chargeOn ? Math.min(1, S.chargeT / (CHARGE_FULL_MS / 1000)) * 14 : 0;
  ctx.strokeStyle = '#8a94a0'; ctx.lineWidth = 7; ctx.lineCap = 'round';
  ctx.beginPath();
  const coils = 6, top = plateY + 8 + compress, bot = 1690;
  for (let i = 0; i <= coils * 2; i++) {
    const y = top + (bot - top) * i / (coils * 2);
    const x = LANE_CX + (i % 2 ? 22 : -22);
    i === 0 ? ctx.moveTo(LANE_CX, top) : ctx.lineTo(x, y);
  }
  ctx.stroke();
  rr(DIV_R + 4, plateY + compress - 14, WALL_R - DIV_R - 8, 14, 5);
  const pg = ctx.createLinearGradient(DIV_R, 0, WALL_R, 0);
  pg.addColorStop(0, '#8a94a0'); pg.addColorStop(0.5, '#e8eef4'); pg.addColorStop(1, '#6d7683');
  ctx.fillStyle = pg; ctx.fill();

  label('LAUNCH', LANE_CX, 460, 20, '#b08d4f');
}

function drawWalls() {
  // top arc rail
  ctx.strokeStyle = '#8a94a0'; ctx.lineWidth = 10; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath();
  TOP_ARC.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
  ctx.stroke();
  ctx.strokeStyle = '#e8eef4'; ctx.lineWidth = 4;
  ctx.beginPath();
  TOP_ARC.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
  ctx.stroke();

  // left rail
  rr(WALL_L - 10, 345, 10, FLOOR_Y + 15 - 345, 5); ctx.fillStyle = '#8a94a0'; ctx.fill();

  // divider rail (runs below the arc gap into the channel row)
  rr(DIV_L, DIV_TOP, DIV_R - DIV_L, 1670 - DIV_TOP, 5);
  const dg = ctx.createLinearGradient(DIV_L, 0, DIV_R, 0);
  dg.addColorStop(0, '#8a94a0'); dg.addColorStop(0.5, '#e8eef4'); dg.addColorStop(1, '#6d7683');
  ctx.fillStyle = dg; ctx.fill();
  // rounded tip
  ctx.beginPath(); ctx.arc(DIV_TIP.x, DIV_TIP.y, 9, 0, Math.PI * 2);
  ctx.fillStyle = '#e8eef4'; ctx.fill();

  // outer right rail
  rr(WALL_R, 404, 10, FLOOR_Y + 15 - 404, 5); ctx.fillStyle = '#8a94a0'; ctx.fill();
}

function drawHud() {
  rr(90, 70, 900, 200, 26);
  ctx.fillStyle = '#33241A'; ctx.fill();

  label('BALLS', 205, 105, 26, '#C9A96B');
  led(String(S.wallet).padStart(3, '0'), 205, 160, 62);

  label('WIN', 875, 105, 26, '#C9A96B');
  led(String(S.lastPayout).padStart(3, '0'), 875, 160, 62, S.lastWin ? '#FFD54A' : '#FF5040');

  label('MULTIPLIER', 540, 92, 22, '#C9A96B');
  MULTS.forEach((m, i) => {
    const x = 372 + i * 84, y = 132;
    const lit = (S.phase === 'shuffle' && i === S.shuffleIdx) ||
                (S.phase === 'locked' && S.mult === m && Math.floor(S.flashT * 8) % 2 === 0) ||
                ((S.phase === 'ball' || S.phase === 'resolve') && S.mult === m);
    ctx.beginPath(); ctx.arc(x, y, 26, 0, Math.PI * 2);
    ctx.fillStyle = lit ? '#FFD54A' : '#4d3a28';
    if (lit) { ctx.shadowColor = '#FFD54A'; ctx.shadowBlur = 20; }
    ctx.fill(); ctx.shadowBlur = 0;
    label(`${m}`, x, y + 1, 24, lit ? '#5a3a00' : '#8a6d3b');
  });

  rr(150, 186, 780, 66, 12);
  ctx.fillStyle = '#17324a'; ctx.fill();
  ctx.strokeStyle = '#2E8BC0'; ctx.lineWidth = 3; ctx.stroke();
  ctx.font = '700 32px "Courier New", monospace';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = '#7FD4FF';
  ctx.fillText(S.status, 540, 220);
}

function drawField() {
  ctx.save();
  ctx.beginPath(); ctx.arc(OBSTACLE.x, OBSTACLE.y, OBSTACLE.r, 0, Math.PI * 2);
  const og = ctx.createRadialGradient(OBSTACLE.x - 20, OBSTACLE.y - 25, 10, OBSTACLE.x, OBSTACLE.y, OBSTACLE.r);
  og.addColorStop(0, '#FFF8E6'); og.addColorStop(1, '#F0B45A');
  ctx.fillStyle = og; ctx.fill();
  ctx.lineWidth = 8; ctx.strokeStyle = '#C98A3B'; ctx.stroke();
  ctx.translate(OBSTACLE.x, OBSTACLE.y);
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + i * Math.PI / 5, rad = i % 2 ? 28 : 60;
    ctx[i ? 'lineTo' : 'moveTo'](Math.cos(a) * rad, Math.sin(a) * rad);
  }
  ctx.closePath();
  ctx.fillStyle = '#E8792E'; ctx.fill();
  ctx.restore();

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
  rr(CH_LEFT - 6, 1348, DIV_L - CH_LEFT + 12, 48, 10);
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

  for (let i = 0; i < N_CH; i++) {
    const x = CH_LEFT + i * CH_W + 4;
    const isLast = S.lastChannel === i + 1 && (S.phase === 'resolve' || S.phase === 'awaiting');
    const active = S.active.has(i + 1) && (S.phase === 'locked' || S.phase === 'ball' || S.phase === 'resolve');
    rr(x, CH_GUIDE_TOP + 8, CH_W - 8, FLOOR_Y - CH_GUIDE_TOP + 20, 14);
    ctx.fillStyle = '#4A3325'; ctx.fill();
    if (isLast && S.lastWin) {
      ctx.strokeStyle = '#FFD54A'; ctx.lineWidth = 5;
      ctx.shadowColor = '#FFD54A'; ctx.shadowBlur = 16;
      ctx.stroke(); ctx.shadowBlur = 0;
    } else if (active) {
      ctx.strokeStyle = 'rgba(124,252,154,.55)'; ctx.lineWidth = 3; ctx.stroke();
    }
  }

  for (const g of GUIDES) {
    if (g.x >= DIV_L - 1) continue;   // rightmost guide is the divider itself
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
  label(txt, b.x, b.y - (sub ? 6 : 0), b.r > 60 ? 30 : 24, '#fff');
  if (sub) label(sub, b.x, b.y + 22, 16, 'rgba(255,255,255,.85)');
  ctx.restore();
}

function drawDeck() {
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
  const startLit = S.phase !== 'resolve';
  const startTxt = S.phase === 'over' ? 'AGAIN'
    : S.phase === 'locked' ? 'GO!'
    : (S.phase === 'ball' && S.parked) ? 'GO!' : 'START';
  const charging = S.chargeOn;
  drawBtn(BTN.start, charging ? '...' : startTxt, null,
    charging ? '#FFD54A' : startLit ? '#7EC8FF' : '#4a6f8c',
    charging ? '#E8792E' : startLit ? '#1E6FB8' : '#33506b', '#EAF6FF');
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
