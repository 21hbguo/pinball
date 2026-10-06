import {
  _decorator,
  BoxCollider2D,
  CircleCollider2D,
  Color,
  Component,
  Contact2DType,
  ERigidBody2DType,
  Graphics,
  Node,
  PhysicsSystem2D,
  RigidBody2D,
  Size,
  Vec2,
} from 'cc';

import { CLASSIC_SINGLE_BALL_TABLE } from '../config/ClassicSingleBallTable';
import type { RectWallDef } from '../config/TableDefinition';
import { DesignSpace } from '../core/DesignSpace';
import { GameSession, type RoundSetup, type SessionSnapshot } from '../core/GameSession';
import { BallLifecycle } from './BallLifecycle';

const { ccclass } = _decorator;

@ccclass('ReferenceTableRuntime')
export class ReferenceTableRuntime extends Component {
  private readonly table = CLASSIC_SINGLE_BALL_TABLE;
  private readonly design = new DesignSpace(this.table.designWidth, this.table.designHeight);
  private readonly session = new GameSession(this.table);
  private readonly lifecycle = new BallLifecycle(this.table);

  private activeBall: Node | null = null;
  private activeBody: RigidBody2D | null = null;
  private lastSnapshot: SessionSnapshot = this.session.getSnapshot();

  @property
  initialBallCredits = 100;

  onLoad(): void {
    this.configurePhysics();
    this.buildPhysicalTable();

    this.session.on((event) => {
      this.lastSnapshot = event.snapshot;
      this.node.emit('pinball-session-event', event);
    });

    this.lastSnapshot = this.session.startSession(this.initialBallCredits);
  }

  /** Lock one randomized round: multiplier + active channels + wager. */
  public configureRound(setup: RoundSetup): void {
    if (this.activeBall) {
      return;
    }
    this.lastSnapshot = this.session.configureRound(setup);
  }

  /** Launch exactly one physical ball for the already-locked round. */
  public launchCurrentRound(): void {
    if (!this.session.canLaunch() || this.activeBall) {
      return;
    }

    this.lastSnapshot = this.session.launchSingleBall();
    this.spawnBall();
  }

  public resetSession(initialBallCredits = this.initialBallCredits): void {
    this.destroyActiveBall();
    this.lastSnapshot = this.session.startSession(initialBallCredits);
  }

  public getSnapshot(): SessionSnapshot {
    return this.lastSnapshot;
  }

  update(dt: number): void {
    if (!this.activeBall || !this.activeBody) {
      return;
    }

    const velocity = this.activeBody.linearVelocity;
    const clamped = this.lifecycle.clampVelocity({ x: velocity.x, y: velocity.y });
    if (clamped.x !== velocity.x || clamped.y !== velocity.y) {
      this.activeBody.linearVelocity = new Vec2(clamped.x, clamped.y);
    }

    const local = this.activeBall.position;
    const tableY = this.table.designHeight / 2 - local.y;

    if (tableY > this.table.bounds.drainY) {
      this.resolveDrain();
      return;
    }

    const stuck = this.lifecycle.updateStuck(
      {
        position: { x: local.x, y: local.y },
        velocity: { x: velocity.x, y: velocity.y },
      },
      dt,
    );

    if (stuck) {
      // Table-space +Y is downward; Cocos +Y is upward.
      this.activeBody.applyLinearImpulseToCenter(
        new Vec2(
          this.table.stuckRecovery.impulse.x,
          -this.table.stuckRecovery.impulse.y,
        ),
        true,
      );
    }
  }

  private configurePhysics(): void {
    const physics = PhysicsSystem2D.instance;
    physics.enable = true;
    physics.fixedTimeStep = this.table.fixedTimeStep;
    physics.maxSubSteps = 2;
    physics.gravity = new Vec2(this.table.gravity.x, -this.table.gravity.y);
  }

  private buildPhysicalTable(): void {
    for (const peg of this.table.pegs) {
      const local = this.design.toLocal(peg.center);
      const node = this.makeNode(peg.id, local.x, local.y);
      const body = node.addComponent(RigidBody2D);
      body.type = ERigidBody2DType.Static;

      const collider = node.addComponent(CircleCollider2D);
      collider.radius = peg.radius;
      collider.friction = peg.friction;
      collider.restitution = peg.restitution;
      collider.apply();

      this.drawCircle(node, peg.radius, new Color(76, 185, 232, 255));
    }

    for (const obstacle of this.table.centerObstacles) {
      const local = this.design.toLocal(obstacle.center);
      const node = this.makeNode(obstacle.id, local.x, local.y);
      const body = node.addComponent(RigidBody2D);
      body.type = ERigidBody2DType.Static;

      const collider = node.addComponent(CircleCollider2D);
      collider.radius = obstacle.radius;
      collider.friction = obstacle.friction;
      collider.restitution = obstacle.restitution;
      collider.apply();

      this.drawCircle(node, obstacle.radius, new Color(23, 56, 88, 255));
    }

    for (const wall of this.table.guideWalls) {
      this.createWall(wall);
    }

    this.createOuterWall(
      'wall-left',
      this.table.bounds.left - 12,
      this.table.bounds.top,
      24,
      this.table.bounds.drainY - this.table.bounds.top,
    );
    this.createOuterWall(
      'wall-right',
      this.table.bounds.right - 12,
      this.table.bounds.top,
      24,
      this.table.bounds.drainY - this.table.bounds.top,
    );

    for (const channel of this.table.channels) {
      const center = this.design.rectCenter(channel.x, channel.y, channel.width, channel.height);
      const node = this.makeNode(channel.id, center.x, center.y);
      const body = node.addComponent(RigidBody2D);
      body.type = ERigidBody2DType.Static;

      const sensor = node.addComponent(BoxCollider2D);
      sensor.size = new Size(channel.width - 12, channel.height - 12);
      sensor.sensor = true;
      sensor.apply();

      sensor.on(
        Contact2DType.BEGIN_CONTACT,
        (_self, other) => {
          if (this.activeBall && other.node === this.activeBall) {
            this.resolveChannel(channel.channel);
          }
        },
        this,
      );
    }
  }

  private createWall(wall: RectWallDef): void {
    const center = this.design.rectCenter(wall.x, wall.y, wall.width, wall.height);
    const node = this.makeNode(wall.id, center.x, center.y);
    const body = node.addComponent(RigidBody2D);
    body.type = ERigidBody2DType.Static;

    const collider = node.addComponent(BoxCollider2D);
    collider.size = new Size(wall.width, wall.height);
    collider.friction = wall.friction;
    collider.restitution = wall.restitution;
    collider.apply();
  }

  private createOuterWall(
    id: string,
    x: number,
    y: number,
    width: number,
    height: number,
  ): void {
    this.createWall({
      id,
      x,
      y,
      width,
      height,
      friction: 0.08,
      restitution: 0.45,
    });
  }

  private spawnBall(): void {
    const spawn = this.design.toLocal(this.table.ballSpawn);
    const node = this.makeNode('active-ball', spawn.x, spawn.y);

    const body = node.addComponent(RigidBody2D);
    body.type = ERigidBody2DType.Dynamic;
    body.enabledContactListener = true;
    body.allowSleep = false;
    body.bullet = true;
    body.linearDamping = this.table.ball.linearDamping;
    body.angularDamping = this.table.ball.angularDamping;

    const collider = node.addComponent(CircleCollider2D);
    collider.radius = this.table.ball.radius;
    collider.density = this.table.ball.density;
    collider.friction = this.table.ball.friction;
    collider.restitution = this.table.ball.restitution;
    collider.apply();

    const jitter =
      (Math.random() * 2 - 1) * this.table.release.horizontalJitter;

    body.linearVelocity = new Vec2(
      this.table.release.initialVelocity.x + jitter,
      -this.table.release.initialVelocity.y,
    );

    this.drawBall(node, this.table.ball.radius);
    this.lifecycle.reset();
    this.activeBall = node;
    this.activeBody = body;
  }

  private resolveChannel(channel: number): void {
    if (!this.activeBall) {
      return;
    }
    this.lastSnapshot = this.session.resolveChannel(channel);
    this.destroyActiveBall();
  }

  private resolveDrain(): void {
    if (!this.activeBall) {
      return;
    }
    this.lastSnapshot = this.session.resolveMiss();
    this.destroyActiveBall();
  }

  private destroyActiveBall(): void {
    if (this.activeBall?.isValid) {
      this.activeBall.destroy();
    }
    this.activeBall = null;
    this.activeBody = null;
    this.lifecycle.reset();
  }

  private makeNode(name: string, x: number, y: number): Node {
    const node = new Node(name);
    node.setParent(this.node);
    node.setPosition(x, y, 0);
    return node;
  }

  private drawCircle(node: Node, radius: number, color: Color): void {
    const graphics = node.addComponent(Graphics);
    graphics.fillColor = color;
    graphics.circle(0, 0, radius);
    graphics.fill();
  }

  private drawBall(node: Node, radius: number): void {
    const graphics = node.addComponent(Graphics);
    graphics.fillColor = new Color(220, 235, 244, 255);
    graphics.circle(0, 0, radius);
    graphics.fill();
    graphics.strokeColor = new Color(255, 255, 255, 255);
    graphics.lineWidth = 3;
    graphics.circle(0, 0, radius - 1.5);
    graphics.stroke();
  }
}
