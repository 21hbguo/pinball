import type { Vec2Def } from '../config/TableDefinition';

/**
 * Converts the 1080x1920 top-left reference coordinate system into Cocos'
 * centered, Y-up local coordinate space.
 */
export class DesignSpace {
  constructor(
    readonly width: number,
    readonly height: number,
  ) {}

  toLocal(point: Vec2Def): Vec2Def {
    return {
      x: point.x - this.width / 2,
      y: this.height / 2 - point.y,
    };
  }

  rectCenter(x: number, y: number, width: number, height: number): Vec2Def {
    return this.toLocal({
      x: x + width / 2,
      y: y + height / 2,
    });
  }

  clampX(x: number, radius = 0): number {
    const half = this.width / 2;
    return Math.max(-half + radius, Math.min(half - radius, x));
  }
}
