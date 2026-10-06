import type { TableDefinition } from './TableDefinition';

const peg = (id: string, x: number, y: number) => ({
  id,
  center: { x, y },
  radius: 22,
  friction: 0.06,
  restitution: 0.82,
} as const);

/**
 * Reference-faithful baseline built from art/mvp/preview/mvp_board.svg.
 * Coordinates stay in 1080x1920 top-left design space.
 *
 * Important: when the original reference image is available in the active
 * conversation, update this file rather than changing gameplay systems.
 */
export const CLASSIC_SINGLE_BALL_TABLE: TableDefinition = {
  id: 'classic-single-ball-v1',
  designWidth: 1080,
  designHeight: 1920,

  ballsPerRun: 5,
  scoreDigits: 5,

  ballSpawn: { x: 520, y: 350 },
  ball: {
    radius: 30,
    density: 1.0,
    friction: 0.05,
    restitution: 0.72,
    linearDamping: 0.06,
    angularDamping: 0.04,
    maxSpeed: 1450,
  },

  // Expressed in design-units / s^2. Runtime scales this to physics units.
  gravity: { x: 0, y: 1900 },
  fixedTimeStep: 1 / 60,

  // The reference machine behaves primarily as a gravity drop.
  release: {
    initialVelocity: { x: 0, y: 40 },
    horizontalJitter: 12,
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

  // The current preview contains a large central element. Keep it as a
  // non-scoring obstacle until the source rule can be verified.
  centerObstacles: [
    {
      id: 'center',
      center: { x: 540, y: 745 },
      radius: 88,
      friction: 0.08,
      restitution: 0.66,
      score: 0,
    },
  ],

  guideWalls: [
    // Invisible collection guides aligned to the five visual slots.
    { id: 'guide-left', x: 100, y: 1408, width: 16, height: 260, friction: 0.08, restitution: 0.18 },
    { id: 'guide-1', x: 276, y: 1408, width: 16, height: 260, friction: 0.08, restitution: 0.18 },
    { id: 'guide-2', x: 452, y: 1408, width: 16, height: 260, friction: 0.08, restitution: 0.18 },
    { id: 'guide-3', x: 628, y: 1408, width: 16, height: 260, friction: 0.08, restitution: 0.18 },
    { id: 'guide-4', x: 804, y: 1408, width: 16, height: 260, friction: 0.08, restitution: 0.18 },
    { id: 'guide-right', x: 964, y: 1408, width: 16, height: 260, friction: 0.08, restitution: 0.18 },
  ],

  slots: [
    { id: 'slot-2', x: 116, y: 1460, width: 144, height: 194, score: 2 },
    { id: 'slot-4', x: 292, y: 1460, width: 144, height: 194, score: 4 },
    { id: 'slot-6', x: 468, y: 1460, width: 144, height: 194, score: 6 },
    { id: 'slot-8', x: 644, y: 1460, width: 144, height: 194, score: 8 },
    { id: 'slot-10', x: 820, y: 1460, width: 144, height: 194, score: 10 },
  ],

  stuckRecovery: {
    minSpeed: 12,
    seconds: 2.25,
    impulse: { x: 8, y: 45 },
  },
};
