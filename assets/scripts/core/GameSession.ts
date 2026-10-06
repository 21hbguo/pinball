import type { TableDefinition } from '../config/TableDefinition';

export type SessionPhase =
  | 'idle'
  | 'round-ready'
  | 'ball-active'
  | 'round-resolving';

export type RoundSetup = Readonly<{
  baseMultiplier: number;
  activeChannels: readonly number[];
  wager: number;
}>;

export type SessionSnapshot = Readonly<{
  phase: SessionPhase;
  walletBalls: number;
  wager: number;
  baseMultiplier: number | null;
  effectiveMultiplier: number | null;
  activeChannels: readonly number[];
  lastChannel: number | null;
  lastWin: boolean;
  lastPayout: number;
  roundsPlayed: number;
}>;

export type SessionEvent =
  | { type: 'session-started'; snapshot: SessionSnapshot }
  | { type: 'round-configured'; snapshot: SessionSnapshot }
  | { type: 'ball-started'; snapshot: SessionSnapshot }
  | { type: 'round-settled'; snapshot: SessionSnapshot };

type Listener = (event: SessionEvent) => void;

/**
 * Rule layer for the physical machine:
 *
 * - Every round launches exactly ONE physical ball.
 * - "Wagering multiple balls" means spending N ball-credits on that single
 *   round. It does NOT spawn N physical balls.
 * - The wager multiplies the selected base multiplier.
 * - A channel hit is checked against the round's active-channel set.
 */
export class GameSession {
  private phase: SessionPhase = 'idle';
  private walletBalls = 0;
  private wager = 1;
  private baseMultiplier: number | null = null;
  private activeChannels: readonly number[] = [];
  private lastChannel: number | null = null;
  private lastWin = false;
  private lastPayout = 0;
  private roundsPlayed = 0;
  private readonly listeners = new Set<Listener>();

  constructor(private readonly table: TableDefinition) {}

  on(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getSnapshot(): SessionSnapshot {
    return Object.freeze({
      phase: this.phase,
      walletBalls: this.walletBalls,
      wager: this.wager,
      baseMultiplier: this.baseMultiplier,
      effectiveMultiplier:
        this.baseMultiplier === null ? null : this.baseMultiplier * this.wager,
      activeChannels: [...this.activeChannels],
      lastChannel: this.lastChannel,
      lastWin: this.lastWin,
      lastPayout: this.lastPayout,
      roundsPlayed: this.roundsPlayed,
    });
  }

  startSession(initialBallCredits: number): SessionSnapshot {
    this.phase = 'round-ready';
    this.walletBalls = Math.max(0, Math.floor(initialBallCredits));
    this.wager = 1;
    this.baseMultiplier = null;
    this.activeChannels = [];
    this.lastChannel = null;
    this.lastWin = false;
    this.lastPayout = 0;
    this.roundsPlayed = 0;

    const snapshot = this.getSnapshot();
    this.emit({ type: 'session-started', snapshot });
    return snapshot;
  }

  /**
   * Called after START/random-light selection has locked the current round.
   * Randomization itself is kept outside this class so the machine's exact
   * probability table can be configured independently.
   */
  configureRound(setup: RoundSetup): SessionSnapshot {
    if (this.phase === 'ball-active') {
      throw new Error('Cannot configure a round while the physical ball is active');
    }

    if (!this.table.multiplierOptions.includes(setup.baseMultiplier)) {
      throw new Error(`Unsupported multiplier: ${setup.baseMultiplier}`);
    }

    if (!this.table.wagerOptions.includes(setup.wager)) {
      throw new Error(`Unsupported wager: ${setup.wager}`);
    }

    const active = [...new Set(setup.activeChannels)].sort((a, b) => a - b);
    if (
      active.some(
        (channel) =>
          !Number.isInteger(channel) ||
          channel < 1 ||
          channel > this.table.channelCount,
      )
    ) {
      throw new Error('Active channel is outside the configured table range');
    }

    this.wager = setup.wager;
    this.baseMultiplier = setup.baseMultiplier;
    this.activeChannels = active;
    this.lastChannel = null;
    this.lastWin = false;
    this.lastPayout = 0;
    this.phase = 'round-ready';

    const snapshot = this.getSnapshot();
    this.emit({ type: 'round-configured', snapshot });
    return snapshot;
  }

  canLaunch(): boolean {
    return (
      this.phase === 'round-ready' &&
      this.baseMultiplier !== null &&
      this.activeChannels.length > 0 &&
      this.walletBalls >= this.wager
    );
  }

  /**
   * Deducts the wager and launches exactly one physical ball.
   */
  launchSingleBall(): SessionSnapshot {
    if (!this.canLaunch()) {
      throw new Error(
        `Cannot launch: phase=${this.phase}, wallet=${this.walletBalls}, wager=${this.wager}`,
      );
    }

    this.walletBalls -= this.wager;
    this.phase = 'ball-active';
    this.lastChannel = null;
    this.lastWin = false;
    this.lastPayout = 0;

    const snapshot = this.getSnapshot();
    this.emit({ type: 'ball-started', snapshot });
    return snapshot;
  }

  resolveChannel(channel: number): SessionSnapshot {
    if (this.phase !== 'ball-active') {
      return this.getSnapshot();
    }

    if (
      !Number.isInteger(channel) ||
      channel < 1 ||
      channel > this.table.channelCount
    ) {
      throw new Error(`Unknown terminal channel: ${channel}`);
    }

    this.phase = 'round-resolving';
    this.lastChannel = channel;
    this.lastWin = this.activeChannels.includes(channel);

    // User-confirmed rule example: wager 5 × base 4X => payout 20.
    this.lastPayout =
      this.lastWin && this.baseMultiplier !== null
        ? this.wager * this.baseMultiplier
        : 0;

    this.walletBalls += this.lastPayout;
    this.roundsPlayed += 1;
    this.phase = 'round-ready';

    const snapshot = this.getSnapshot();
    this.emit({ type: 'round-settled', snapshot });
    return snapshot;
  }

  resolveMiss(): SessionSnapshot {
    if (this.phase !== 'ball-active') {
      return this.getSnapshot();
    }

    this.phase = 'round-resolving';
    this.lastChannel = null;
    this.lastWin = false;
    this.lastPayout = 0;
    this.roundsPlayed += 1;
    this.phase = 'round-ready';

    const snapshot = this.getSnapshot();
    this.emit({ type: 'round-settled', snapshot });
    return snapshot;
  }

  private emit(event: SessionEvent): void {
    for (const listener of this.listeners) {
      listener(event);
    }
  }
}
