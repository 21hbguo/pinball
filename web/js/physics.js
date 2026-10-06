'use strict';
/*
 * Fixed-step ball physics: gravity, circle/rect/segment colliders,
 * terminal-channel settle detection, plunger parking, anti-stuck.
 *
 * stepPhysics(dt, onSettle) — onSettle(channel resolved by game.js) is
 * injected by main.js so this module stays free of round logic.
 */

import {
  H, BALL_R, GRAVITY, MAX_SPEED, REST,
  WALL_L, DIV_L, DIV_R, WALL_R, DIV_TOP, FLOOR_Y,
  TOP_ARC, DIV_TIP, PEG_R, PEGS, OBSTACLE, GUIDES, DIVIDER, CH_GUIDE_TOP,
} from './config.js';
import { S, ball } from './state.js';
import { sfx } from './audio.js';

export function stepPhysics(dt, onSettle) {
  if (!ball.live) return;

  // while charging, a parked ball stays pinned on the plunger
  if (S.chargeOn && S.parked) { ball.vx = ball.vy = 0; return; }

  ball.vy += GRAVITY * dt;
  const sp = Math.hypot(ball.vx, ball.vy);
  if (sp > MAX_SPEED) { ball.vx *= MAX_SPEED / sp; ball.vy *= MAX_SPEED / sp; }
  ball.x += ball.vx * dt;
  ball.y += ball.vy * dt;

  // global side walls
  if (ball.x - BALL_R < WALL_L) { ball.x = WALL_L + BALL_R; ball.vx = Math.abs(ball.vx) * REST.wall; }
  if (ball.x + BALL_R > WALL_R) { ball.x = WALL_R - BALL_R; ball.vx = -Math.abs(ball.vx) * REST.wall; }

  // top arc rail
  for (let i = 0; i < TOP_ARC.length - 1; i++)
    hitSegment(TOP_ARC[i], TOP_ARC[i + 1], REST.arc);

  // launch-lane divider + rounded tip
  hitRect(DIVIDER);
  hitCircle(DIV_TIP.x, DIV_TIP.y, DIV_TIP.r, REST.wall, null);

  // pegs + center obstacle
  for (const p of PEGS) hitCircle(p.x, p.y, PEG_R, REST.peg, p);
  hitCircle(OBSTACLE.x, OBSTACLE.y, OBSTACLE.r, REST.obstacle, null);

  // channel guide walls
  for (const g of GUIDES) hitRect(g);

  // floors: terminal channels vs plunger plate
  if (ball.y + BALL_R > FLOOR_Y && ball.y > CH_GUIDE_TOP) {
    ball.y = FLOOR_Y - BALL_R;
    if (ball.x < DIV_L) {
      if (Math.abs(ball.vy) > 60) ball.vy = -Math.abs(ball.vy) * REST.floor;
      else ball.vy = 0;
      ball.vx *= 0.85;
      ball.settleT += dt;
      if (ball.settleT > 0.25) { ball.live = false; onSettle(); return; }
    } else {
      if (Math.abs(ball.vy) > 60) ball.vy = -Math.abs(ball.vy) * REST.floor;
      else ball.vy = 0;
      ball.vx *= 0.7;
      ball.settleT = 0;
    }
  } else {
    ball.settleT = 0;
  }

  // parked detection: ball came to rest back on the plunger
  const speed = Math.hypot(ball.vx, ball.vy);
  if (S.phase === 'ball' && !S.parked && ball.x > DIV_R &&
      ball.y > FLOOR_Y - BALL_R - 4 && speed < 40) {
    ball.parkT += dt;
    if (ball.parkT > 0.3) {
      S.parked = true; ball.vx = ball.vy = 0;
      S.status = 'BALL BACK ON PLUNGER - HOLD START TO RELAUNCH';
    }
  } else ball.parkT = 0;

  // anti-stuck nudge (peg field only)
  if (speed < 10 && ball.x < DIV_L && ball.y < CH_GUIDE_TOP - 20) {
    ball.stuckT += dt;
    if (ball.stuckT > 1.4) {
      ball.vx = (Math.random() * 2 - 1) * 180;
      ball.vy = -120;
      ball.stuckT = 0;
    }
  } else ball.stuckT = 0;

  // failsafe
  if (ball.y > H + 60) { ball.live = false; onSettle(); }
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
  let nrx, nry;
  const d = Math.sqrt(d2);
  if (d === 0) { nrx = 0; nry = -1; }
  else { nrx = dx / d; nry = dy / d; }
  ball.x = nx + nrx * BALL_R; ball.y = ny + nry * BALL_R;
  const vn = ball.vx * nrx + ball.vy * nry;
  if (vn < 0) {
    ball.vx -= (1 + REST.guide) * vn * nrx;
    ball.vy -= (1 + REST.guide) * vn * nry;
  }
}

function hitSegment(a, b, rest) {
  const abx = b[0] - a[0], aby = b[1] - a[1];
  const len2 = abx * abx + aby * aby;
  let t = ((ball.x - a[0]) * abx + (ball.y - a[1]) * aby) / len2;
  t = Math.max(0, Math.min(1, t));
  const px = a[0] + abx * t, py = a[1] + aby * t;
  const dx = ball.x - px, dy = ball.y - py;
  const d2 = dx * dx + dy * dy;
  if (d2 >= BALL_R * BALL_R || d2 === 0) return;
  const d = Math.sqrt(d2), nx = dx / d, ny = dy / d;
  ball.x = px + nx * BALL_R; ball.y = py + ny * BALL_R;
  const vn = ball.vx * nx + ball.vy * ny;
  if (vn < 0) {
    ball.vx -= (1 + rest) * vn * nx;
    ball.vy -= (1 + rest) * vn * ny;
    // slight tangential friction so the ball rolls along the rail
    const tx = -ny, ty = nx, vt = ball.vx * tx + ball.vy * ty;
    ball.vx -= vt * 0.02 * tx; ball.vy -= vt * 0.02 * ty;
  }
}
