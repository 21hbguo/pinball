'use strict';
/*
 * Table geometry & tuning constants (design space 1080x1920).
 * Peg/channel layout follows assets/scripts/config/ClassicSingleBallTable.ts
 * with a denser peg field per the v2 art direction.
 */

export const W = 1080, H = 1920;
export const BALL_R = 30;
export const GRAVITY = 2400;
export const MAX_SPEED = 3400;
export const REST = { peg: 0.62, wall: 0.45, guide: 0.22, obstacle: 0.72, floor: 0.1, arc: 0.35 };

// playfield: left wall x=84, divider (launch-lane inner wall) x=979..989,
// outer right wall x=1070. Launch lane interior: 989..1070.
export const WALL_L = 84, DIV_L = 979, DIV_R = 989, WALL_R = 1070;
export const DIV_TOP = 400;            // divider ends here; ball crosses above this
export const FLOOR_Y = 1655;           // channel floor & plunger plate rest height
export const LANE_CX = (DIV_R + WALL_R) / 2;   // 1029.5

// top arc: inner wall polyline from top of left wall, over the field,
// curving down into the launch lane mouth
export const TOP_ARC = [
  [84, 345], [240, 305], [420, 290], [620, 286], [800, 294],
  [920, 308], [1000, 330], [1046, 362], [1070, 404],
];
export const DIV_TIP = { x: (DIV_L + DIV_R) / 2, y: DIV_TOP, r: 8 };

// 12 terminal channels between CH_LEFT and the divider
export const N_CH = 12, CH_LEFT = 84, CH_W = (DIV_L - CH_LEFT) / N_CH;
export const CH_GUIDE_TOP = 1408;

// multiplier lamps + wagered-round configuration.
// NOTE: 4X/6X/8X active-channel counts are provisional interpolations
// (source confirms only 2X~4-5 and 10X~1).
export const MULTS = [2, 4, 6, 8, 10];
export const MULT_WEIGHTS = [30, 26, 21, 15, 8];
export const ACTIVE_RANGE = { 2: [4, 5], 4: [3, 4], 6: [2, 3], 8: [1, 2], 10: [1, 1] };

export const START_CREDITS = 30;
export const LAUNCH_MIN = 1400, LAUNCH_SPAN = 1650;   // vy = -(MIN + SPAN*power)
export const TAP_POWER = 0.85;                        // quick tap = preset shot
export const CHARGE_FULL_MS = 1500;                   // hold time for full power

// staggered peg field + center obstacle
export const PEG_R = 22;
export const PEGS = [];
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
export const OBSTACLE = { x: 540, y: 715, r: 85 };

// channel guide walls: 13 thin rects -> 12 slots (rightmost sits under divider)
export const GUIDES = [];
for (let i = 0; i <= N_CH; i++)
  GUIDES.push({ x: CH_LEFT + i * CH_W - 5, y: CH_GUIDE_TOP, w: 10, h: 262 });
export const DIVIDER = { x: DIV_L, y: DIV_TOP, w: DIV_R - DIV_L, h: 1670 - DIV_TOP };

// control-deck buttons (deck strip y 1698..1892)
export const BTN = {
  start:  { x: 540, y: 1825, r: 62 },
  betM:   { x: 315, y: 1825, r: 38 },
  betP:   { x: 765, y: 1825, r: 38 },
  insert: { x: 150, y: 1825, r: 38 },
  reset:  { x: 930, y: 1825, r: 38 },
};
