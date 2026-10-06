'use strict';
/* Minimal WebAudio blips. AudioContext is created lazily on first use
 * (browsers require a user gesture before audio can start). */

let AC = null;
const audio = () => AC || (AC = new (window.AudioContext || window.webkitAudioContext)());

export function beep(freq, dur, type = 'square', vol = 0.05, when = 0) {
  try {
    const ac = audio(), o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(vol, ac.currentTime + when);
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + when + dur);
    o.connect(g).connect(ac.destination);
    o.start(ac.currentTime + when); o.stop(ac.currentTime + when + dur + 0.02);
  } catch (_) {}
}

export const sfx = {
  peg:    (v) => beep(900 + Math.min(v, 1400) * 0.35, 0.035, 'square', 0.03),
  click:  () => beep(700, 0.05, 'square', 0.05),
  lock:   () => { beep(880, 0.08, 'square', 0.06); beep(1320, 0.12, 'square', 0.06, 0.09); },
  launch: (p) => beep(300 + p * 500, 0.18, 'sawtooth', 0.06),
  win:    () => [523, 659, 784, 1047].forEach((f, i) => beep(f, 0.14, 'square', 0.06, i * 0.09)),
  lose:   () => beep(150, 0.35, 'sawtooth', 0.05),
};
