import type { TableDefinition } from './TableDefinition';

const peg = (id: string, x: number, y: number) => ({
  id,
  center: { x, y },
  radius: 22,
  friction: 0.06,
  restitution: 0.82,
} as const);

const CHANNEL_LEFT = 84;
const CHANNEL_TOP = 1460;
const CHANNEL_HEIGHT = 194;
const CHANNEL_WIDTH = 76;

/**
 * Reference-faithful baseline.
 *
 * Confirmed gameplay facts:
 * - one physical ball per round;
 * - multiplier choices are 2 / 4 / 6 / 8 / 10;
 * - the physical result is one of 12 terminal channels;
 * - wagering N ball-credits multiplies the round payout, but still launches
 *   only one physical ball;
 * - at 2X, roughly 4-5 channels may be active;
 * - at 10X, roughly 1 channel may be active.
 *
 * Exact channel geometry and the 4X/6X/8X activation counts still need to be
 * re-measured from the original machine image. Current 12-channel geometry is
 * a provisional equal-width layout so the runtime matches the confirmed rule
 * structure without inventing unverified probability rules.
 */
export const CLASSIC_SINGLE_BALL_TABLE: TableDefinition = {
  id: 'classic-single-ball-v2',
  designWidth: 1080,
  designHeight: 1920,

  multiplierOptions: [2, 4, 6, 8, 10],
  channelCount: 12,
  activeChannelCountByMultiplier: {
    2: { min: 4, max: 5 },
    10: { min: 1, max: 1 },
  },

  ballSpawn: { x: 520, y: 350 },
  ball: {
    radius: 30,
    density: 1.0,
    friction: 0.05,
    restitution: 0.72,
    linearDamping: 0.06,
    angularDamping: 0.04,
    maxSpeed: 18,
  },

  gravity: { x: 0, y: 14 },
  fixedTimeStep: 1 / 60,

  release: {
    initialVelocity: { x: 0, y: 0.4 },
    horizontalJitter: 0.12,
  },

  bounds: {
    left: 84,
    right: 996,
    top: 300,
    drainY: 1680,
  },

  pegs: [
    peg('p01', 300, 430), peg('p02', 540, 430), peg('p03', 780, 430),
    peg('p04', 220, 570), peg('p05', 420, 570), peg('p06', 660, 570), peg('p07', 860, 570),
    peg('p08', 300, 710), peg('p09', 540, 710), peg('p10', 780, 710),
    peg('p11', 220, 850), peg('p12', 420, 850), peg('p13', 660, 850), peg('p14', 860, 850),
    peg('p15', 300, 990), peg('p16', 540, 990), peg('p17', 780, 990),
  ],

  centerObstacles: [
    {
      id: 'center',
      center: { x: 540, y: 745 },
      radius: 88,
      friction: 0.08,
      restitution: 0.66,
    },
  ],

  guideWalls: Array.from({ length: 13 }, (_, index) => ({
    id: `channel-guide-${index}`,
    x: CHANNEL_LEFT + index * CHANNEL_WIDTH - 5,
    y: 1408,
    width: 10,
    height: 260,
    friction: 0.08,
    restitution: 0.18,
  })),

  channels: Array.from({ length: 12 }, (_, index) => ({
    id: `channel-${index + 1}`,
    channel: index + 1,
    x: CHANNEL_LEFT + index * CHANNEL_WIDTH + 3,
    y: CHANNEL_TOP,
    width: CHANNEL_WIDTH - 6,
    height: CHANNEL_HEIGHT,
  })),

  stuckRecovery: {
    minSpeed: 0.12,
    seconds: 2.25,
    impulse: { x: 0.02, y: 0.08 },
  },
};
