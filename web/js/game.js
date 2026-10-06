'use strict';
/*
 * Round logic: shuffle -> lock (multiplier + active channels) -> wager ->
 * charge plunger -> release to fire -> terminal channel settlement.
 * One physical ball per round; the wager only scales the payout.
 */

import {
  MULTS, MULT_WEIGHTS, ACTIVE_RANGE, N_CH, CH_LEFT, CH_W, DIV_L,
  START_CREDITS, LAUNCH_MIN, LAUNCH_SPAN, TAP_POWER, CHARGE_FULL_MS,
  LANE_CX, FLOOR_Y, BALL_R,
} from './config.js';
import { S, ball, saveWallet } from './state.js';
import { sfx } from './audio.js';

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

export function setStatus(t) { S.status = t; }

export function parkBall() {
  ball.x = LANE_CX; ball.y = FLOOR_Y - BALL_R;
  ball.vx = ball.vy = 0;
  ball.live = true; S.parked = true;
}

// START advance: awaiting->shuffle->lock. Launch is charge+release, not here.
export function pressStart() {
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
    setStatus(`${S.mult}X LOCKED - SET BET, HOLD GO TO FIRE`);
    sfx.lock();
  }
}

export function canCharge() {
  return S.phase === 'locked' || (S.phase === 'ball' && S.parked);
}

export function startCharge() {
  S.chargeOn = true; S.chargeT = 0; S.chargeStamp = performance.now();
}

export function releaseCharge() {
  if (!S.chargeOn) return;
  S.chargeOn = false;
  // quick tap = preset shot so the button still works like "GO"
  const held = performance.now() - S.chargeStamp;
  const power = held < 140 ? TAP_POWER : Math.min(1, S.chargeT / (CHARGE_FULL_MS / 1000));
  if (S.phase === 'locked') {
    if (S.wager > S.wallet) { setStatus('BET TOO BIG - LOWER BET OR INSERT'); return; }
    S.wallet -= S.wager; saveWallet();
    S.phase = 'ball';
    S.lastChannel = null; S.lastPayout = 0; S.lastWin = false; S.winFx = null;
  }
  if (S.phase !== 'ball') return;
  fire(power);
}

export function fire(power) {
  S.parked = false;
  ball.live = true;
  ball.x = LANE_CX; ball.y = FLOOR_Y - BALL_R;
  ball.vx = 0;
  ball.vy = -(LAUNCH_MIN + LAUNCH_SPAN * power);
  ball.settleT = 0; ball.parkT = 0; ball.stuckT = 0;
  setStatus('BALL IN PLAY...');
  sfx.launch(power);
}

// called by physics once the ball settles inside a terminal channel
export function resolveBall() {
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
  else { S.phase = 'awaiting'; setStatus('PRESS START'); parkBall(); }
}

export function newSession() {
  S.wallet = START_CREDITS; S.wager = 1;
  S.mult = null; S.active = new Set();
  S.lastChannel = null; S.lastPayout = 0; S.lastWin = false;
  S.phase = 'awaiting'; setStatus('PRESS START');
  S.chargeOn = false;
  parkBall();
  saveWallet();
}

export function addCredit(n) {
  S.wallet += n; saveWallet(); sfx.click();
  if (S.phase === 'over') { S.phase = 'awaiting'; setStatus('PRESS START'); }
}

export function changeBet(d) {
  if (S.phase === 'ball' || S.phase === 'resolve') return;
  S.wager = Math.min(99, Math.max(1, S.wager + d));
  sfx.click();
}

// per-frame round timers (called from the main loop)
export function updateGame(dt) {
  if (S.phase === 'shuffle') {
    S.shuffleT += dt;
    S.shuffleIdx = Math.floor(S.shuffleT / 0.07) % MULTS.length;
    S.chaseIdx = Math.floor(S.shuffleT / 0.05) % N_CH;
  }
  if (S.chargeOn) S.chargeT += dt;
  if (S.flashT > 0) S.flashT -= dt;
  if (S.phase === 'resolve') { S.resolveT -= dt; if (S.resolveT <= 0) endResolve(); }
  if (S.winFx) { S.winFx.t -= dt; if (S.winFx.t <= 0) S.winFx = null; }
  if (S.floatText) { S.floatText.t -= dt; S.floatText.y -= 40 * dt; if (S.floatText.t <= 0) S.floatText = null; }
  for (const [k, v] of S.pegFlash) { const t = v - dt; if (t <= 0) S.pegFlash.delete(k); else S.pegFlash.set(k, t); }
}
