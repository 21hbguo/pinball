'use strict';
/* Shared game state + wallet persistence. */

import { START_CREDITS, LANE_CX, FLOOR_Y, BALL_R } from './config.js';

export const S = {
  phase: 'awaiting',        // awaiting | shuffle | locked | ball | resolve | over
  wallet: START_CREDITS,
  wager: 1,
  mult: null,               // locked base multiplier
  active: new Set(),        // active channel numbers (1..12)
  lastChannel: null,
  lastPayout: 0,
  lastWin: false,
  status: '按【开始】',
  shuffleT: 0, shuffleIdx: 0, chaseIdx: 0,
  flashT: 0,
  resolveT: 0,
  chargeOn: false, chargeT: 0, chargeStamp: 0,
  parked: false,            // ball resting on the plunger
  winFx: null,              // {ch, t}
  floatText: null,          // {x,y,txt,t}
  pegFlash: new Map(),      // peg -> t
};

export const ball = {
  x: LANE_CX, y: FLOOR_Y - BALL_R,
  vx: 0, vy: 0, live: true,
  settleT: 0, parkT: 0, stuckT: 0,
};

try {
  const saved = parseInt(localStorage.getItem('pinball_wallet'), 10);
  if (Number.isFinite(saved) && saved > 0) S.wallet = saved;
} catch (_) {}

export function saveWallet() {
  try { localStorage.setItem('pinball_wallet', String(S.wallet)); } catch (_) {}
}
