import { _decorator, Button, Component, Label, Node } from 'cc';

import type { SessionEvent, SessionSnapshot } from '../core/GameSession';
import { formatBalls, formatScore } from '../core/ScoreFormat';
import { ReferenceTableRuntime } from '../gameplay/ReferenceTableRuntime';

const { ccclass, property } = _decorator;

@ccclass('GameHUD')
export class GameHUD extends Component {
  @property(ReferenceTableRuntime)
  tableRuntime: ReferenceTableRuntime | null = null;

  @property(Label)
  ballsLabel: Label | null = null;

  @property(Label)
  scoreLabel: Label | null = null;

  @property(Label)
  resultLabel: Label | null = null;

  @property(Button)
  startButton: Button | null = null;

  @property(Label)
  startButtonLabel: Label | null = null;

  private readonly onSessionEvent = (event: SessionEvent): void => {
    this.render(event.snapshot);
  };

  onEnable(): void {
    this.tableRuntime?.node.on(
      'pinball-session-event',
      this.onSessionEvent,
      this,
    );

    if (this.tableRuntime) {
      this.render(this.tableRuntime.getSnapshot());
    }
  }

  onDisable(): void {
    this.tableRuntime?.node.off(
      'pinball-session-event',
      this.onSessionEvent,
      this,
    );
  }

  public onStartPressed(): void {
    if (!this.tableRuntime) {
      return;
    }

    const snapshot = this.tableRuntime.getSnapshot();
    if (snapshot.phase === 'game-over') {
      this.tableRuntime.restartSession();
      this.tableRuntime.startNextBall();
      return;
    }

    this.tableRuntime.startNextBall();
  }

  private render(snapshot: SessionSnapshot): void {
    if (this.ballsLabel) {
      this.ballsLabel.string = formatBalls(snapshot.ballsRemaining);
    }

    if (this.scoreLabel) {
      this.scoreLabel.string = formatScore(snapshot.score, 5);
    }

    if (this.resultLabel) {
      if (snapshot.phase === 'game-over') {
        this.resultLabel.string = `FINAL  ${formatScore(snapshot.score, 5)}`;
        this.resultLabel.node.active = true;
      } else if (snapshot.lastSlotId && snapshot.lastAward > 0) {
        this.resultLabel.string = `+${snapshot.lastAward}`;
        this.resultLabel.node.active = true;
      } else {
        this.resultLabel.node.active = false;
      }
    }

    if (this.startButton) {
      this.startButton.interactable =
        snapshot.phase === 'ready' || snapshot.phase === 'game-over';
    }

    if (this.startButtonLabel) {
      this.startButtonLabel.string =
        snapshot.phase === 'game-over' ? 'RESTART' : 'START';
    }
  }
}
