import type { TableDefinition } from '../config/TableDefinition';

export type SessionPhase =
  | 'idle'
  | 'ready'
  | 'ball-active'
  | 'ball-resolving'
  | 'game-over';

export type SessionSnapshot = Readonly<{
  phase: SessionPhase;
  score: number;
  ballsRemaining: number;
  ballsPlayed: number;
  activeBallIndex: number | null;
  lastSlotId: string | null;
  lastAward: number;
}>;

export type SessionEvent =
  | { type: 'session-started'; snapshot: SessionSnapshot }
  | { type: 'ball-started'; snapshot: SessionSnapshot }
  | { type: 'score-awarded'; amount: number; slotId: string; snapshot: SessionSnapshot }
  | { type: 'ball-ended'; snapshot: SessionSnapshot }
  | { type: 'game-over'; snapshot: SessionSnapshot };

type Listener = (event: SessionEvent) => void;

/**
 * Pure rule/state layer. No Cocos dependency.
 *
 * One session can contain several balls, but only one ball may be active at
 * any time. A terminal slot (or drain) resolves the active ball exactly once.
 */
export class GameSession {
  private phase: SessionPhase = 'idle';
  private score = 0;
  private ballsRemaining = 0;
  private ballsPlayed = 0;
  private activeBallIndex: number | null = null;
  private lastSlotId: string | null = null;
  private lastAward = 0;
  private readonly listeners = new Set<Listener>();

  constructor(private readonly table: TableDefinition) {}

  on(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getSnapshot(): SessionSnapshot {
    return Object.freeze({
      phase: this.phase,
      score: this.score,
      ballsRemaining: this.ballsRemaining,
      ballsPlayed: this.ballsPlayed,
      activeBallIndex: this.activeBallIndex,
      lastSlotId: this.lastSlotId,
      lastAward: this.lastAward,
    });
  }

  startSession(): SessionSnapshot {
    this.phase = 'ready';
    this.score = 0;
    this.ballsRemaining = this.table.ballsPerRun;
    this.ballsPlayed = 0;
    this.activeBallIndex = null;
    this.lastSlotId = null;
    this.lastAward = 0;

    const snapshot = this.getSnapshot();
    this.emit({ type: 'session-started', snapshot });
    return snapshot;
  }

  canStartBall(): boolean {
    return this.phase === 'ready' && this.ballsRemaining > 0;
  }

  startBall(): SessionSnapshot {
    if (!this.canStartBall()) {
      throw new Error(`Cannot start ball while phase=${this.phase}, remaining=${this.ballsRemaining}`);
    }

    this.ballsRemaining -= 1;
    this.ballsPlayed += 1;
    this.activeBallIndex = this.ballsPlayed;
    this.lastSlotId = null;
    this.lastAward = 0;
    this.phase = 'ball-active';

    const snapshot = this.getSnapshot();
    this.emit({ type: 'ball-started', snapshot });
    return snapshot;
  }

  resolveSlot(slotId: string): SessionSnapshot {
    if (this.phase !== 'ball-active') {
      return this.getSnapshot();
    }

    const slot = this.table.slots.find((item) => item.id === slotId);
    if (!slot) {
      throw new Error(`Unknown slot: ${slotId}`);
    }

    this.phase = 'ball-resolving';
    this.lastSlotId = slot.id;
    this.lastAward = slot.score;
    this.score += slot.score;

    let snapshot = this.getSnapshot();
    this.emit({ type: 'score-awarded', amount: slot.score, slotId: slot.id, snapshot });

    return this.finishActiveBall();
  }

  resolveDrain(): SessionSnapshot {
    if (this.phase !== 'ball-active') {
      return this.getSnapshot();
    }

    this.phase = 'ball-resolving';
    this.lastSlotId = null;
    this.lastAward = 0;
    return this.finishActiveBall();
  }

  private finishActiveBall(): SessionSnapshot {
    this.activeBallIndex = null;

    if (this.ballsRemaining > 0) {
      this.phase = 'ready';
      const snapshot = this.getSnapshot();
      this.emit({ type: 'ball-ended', snapshot });
      return snapshot;
    }

    this.phase = 'game-over';
    const snapshot = this.getSnapshot();
    this.emit({ type: 'ball-ended', snapshot });
    this.emit({ type: 'game-over', snapshot });
    return snapshot;
  }

  private emit(event: SessionEvent): void {
    for (const listener of this.listeners) {
      listener(event);
    }
  }
}
