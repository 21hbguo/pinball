'use strict';
/*
 * Pinball (弹珠机) — web version.
 *
 * Round model (docs/GAME_DESIGN.md):
 *   START runs the multiplier/channel light shuffle -> second press locks a
 *   base multiplier (2/4/6/8/10) + active channels -> set BET -> HOLD START
 *   to compress the spring plunger -> RELEASE fires one ball up the launch
 *   lane, over the top arc, through the peg field into one of 12 channels.
 *   Active channel: payout = wager x multiplier, else 0.
 *
 * Module map:
 *   config.js  table geometry & tuning constants
 *   state.js   shared state + wallet persistence
 *   audio.js   WebAudio sfx
 *   game.js    round/session logic
 *   physics.js ball physics & collisions
 *   render.js  all canvas drawing
 *   input.js   pointer/keyboard controls
 *   main.js    this file — wiring + main loop
 */

import { S, ball } from './state.js';
import {
  updateGame, resolveBall, pressStart, newSession,
  startCharge, releaseCharge, fire,
} from './game.js';
import { stepPhysics } from './physics.js';
import { draw } from './render.js';
import { initInput } from './input.js';

initInput();

let last = performance.now(), acc = 0;
function frame(now) {
  let dt = (now - last) / 1000; last = now;
  if (dt > 0.1) dt = 0.1;
  updateGame(dt);
  acc += dt;
  const h = 1 / 120;
  while (acc >= h) { stepPhysics(h, resolveBall); acc -= h; }
  draw();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// debug/testing hook
window.__pinball = { S, ball, pressStart, newSession, startCharge, releaseCharge, fire };
