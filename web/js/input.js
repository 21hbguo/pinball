'use strict';
/*
 * Input: canvas pointer hit-testing for the on-screen buttons and
 * keyboard controls. Plunger is press-and-hold to charge, release to fire.
 */

import { W, H, BTN } from './config.js';
import {
  pressStart, canCharge, startCharge, releaseCharge,
  changeBet, addCredit, newSession,
} from './game.js';
import { sfx } from './audio.js';

const canvas = document.getElementById('game');

function toDesign(e) {
  const r = canvas.getBoundingClientRect();
  return { x: (e.clientX - r.left) * W / r.width, y: (e.clientY - r.top) * H / r.height };
}
function hitBtn(p) {
  for (const [name, b] of Object.entries(BTN))
    if (Math.hypot(p.x - b.x, p.y - b.y) <= b.r + 8) return name;
  return null;
}

export function initInput() {
  canvas.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    const name = hitBtn(toDesign(e));
    if (!name) return;
    if (name === 'start') {
      if (canCharge()) startCharge(); else pressStart();
    }
    else if (name === 'betM') changeBet(-1);
    else if (name === 'betP') changeBet(1);
    else if (name === 'insert') addCredit(10);
    else if (name === 'reset') { sfx.click(); newSession(); }
  }, { passive: false });
  window.addEventListener('pointerup', releaseCharge);
  window.addEventListener('pointercancel', releaseCharge);

  window.addEventListener('keydown', (e) => {
    if (e.repeat) return;
    if (e.code === 'Space' || e.code === 'Enter') {
      e.preventDefault();
      if (canCharge()) startCharge(); else pressStart();
    }
    else if (e.code === 'ArrowUp' || e.code === 'Equal') changeBet(1);
    else if (e.code === 'ArrowDown' || e.code === 'Minus') changeBet(-1);
    else if (e.code === 'KeyI') addCredit(10);
    else if (e.code === 'KeyR') newSession();
  });
  window.addEventListener('keyup', (e) => {
    if (e.code === 'Space' || e.code === 'Enter') releaseCharge();
  });
}
