export type Vec2Def = Readonly<{ x: number; y: number }>;

export type CircleMaterialDef = Readonly<{
  radius: number;
  friction: number;
  restitution: number;
}>;

export type PegDef = Readonly<{
  id: string;
  center: Vec2Def;
  radius: number;
  friction: number;
  restitution: number;
}>;

export type RectSensorDef = Readonly<{
  id: string;
  channel: number;
  x: number;
  y: number;
  width: number;
  height: number;
}>;

export type RectWallDef = Readonly<{
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  friction: number;
  restitution: number;
}>;

export type CircleObstacleDef = Readonly<{
  id: string;
  center: Vec2Def;
  radius: number;
  friction: number;
  restitution: number;
}>;

export type ActiveChannelCountRange = Readonly<{
  min: number;
  max: number;
}>;

export type TableDefinition = Readonly<{
  id: string;
  designWidth: number;
  designHeight: number;

  /** Credit stake options. They never change physical ball count. */
  wagerOptions: readonly number[];
  multiplierOptions: readonly number[];

  /** The physical table has 12 terminal channels. */
  channelCount: number;

  /**
   * Only put source-confirmed values here. Missing multipliers stay undefined
   * until the real machine's rule table is verified.
   */
  activeChannelCountByMultiplier: Readonly<
    Partial<Record<number, ActiveChannelCountRange>>
  >;

  ballSpawn: Vec2Def;
  ball: CircleMaterialDef & Readonly<{
    density: number;
    linearDamping: number;
    angularDamping: number;
    maxSpeed: number;
  }>;

  gravity: Vec2Def;
  fixedTimeStep: number;

  release: Readonly<{
    initialVelocity: Vec2Def;
    horizontalJitter: number;
  }>;

  bounds: Readonly<{
    left: number;
    right: number;
    top: number;
    drainY: number;
  }>;

  pegs: readonly PegDef[];
  centerObstacles: readonly CircleObstacleDef[];
  guideWalls: readonly RectWallDef[];
  channels: readonly RectSensorDef[];

  stuckRecovery: Readonly<{
    minSpeed: number;
    seconds: number;
    impulse: Vec2Def;
  }>;
}>;
