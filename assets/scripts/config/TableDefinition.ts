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
  x: number;
  y: number;
  width: number;
  height: number;
  score: number;
}>;

export type CircleObstacleDef = Readonly<{
  id: string;
  center: Vec2Def;
  radius: number;
  friction: number;
  restitution: number;
  score: number;
}>;

export type TableDefinition = Readonly<{
  id: string;
  designWidth: number;
  designHeight: number;
  ballsPerRun: number;
  scoreDigits: number;

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
  slots: readonly RectSensorDef[];

  stuckRecovery: Readonly<{
    minSpeed: number;
    seconds: number;
    impulse: Vec2Def;
  }>;
}>;
