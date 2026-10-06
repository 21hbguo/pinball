import type { TableDefinition, Vec2Def } from '../config/TableDefinition';

export type BallTelemetry = Readonly<{
  position: Vec2Def;
  velocity: Vec2Def;
}>;

/**
 * Engine-independent helpers for speed limiting and stuck detection.
 */
export class BallLifecycle {
  private slowForSeconds = 0;

  constructor(private readonly table: TableDefinition) {}

  reset(): void {
    this.slowForSeconds = 0;
  }

  speed(velocity: Vec2Def): number {
    return Math.hypot(velocity.x, velocity.y);
  }

  clampVelocity(velocity: Vec2Def): Vec2Def {
    const speed = this.speed(velocity);
    const max = this.table.ball.maxSpeed;
    if (speed <= max || speed === 0) {
      return velocity;
    }
    const scale = max / speed;
    return { x: velocity.x * scale, y: velocity.y * scale };
  }

  updateStuck(telemetry: BallTelemetry, dt: number): boolean {
    if (this.speed(telemetry.velocity) < this.table.stuckRecovery.minSpeed) {
      this.slowForSeconds += dt;
    } else {
      this.slowForSeconds = 0;
    }

    if (this.slowForSeconds >= this.table.stuckRecovery.seconds) {
      this.slowForSeconds = 0;
      return true;
    }

    return false;
  }
}
