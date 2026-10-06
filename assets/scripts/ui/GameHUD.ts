import { _decorator, Button, Component, Label } from 'cc';

import type { SessionEvent, SessionSnapshot } from '../core/GameSession';
import { formatBalls } from '../core/ScoreFormat';
import { ReferenceTableRuntime } from '../gameplay/ReferenceTableRuntime';

const { ccclass, property } = _decorator;

@ccclass('GameHUD')
export class GameHUD extends Component {
  @property(ReferenceTableRuntime)
  tableRuntime: ReferenceTableRuntime | null = null;

  @property(Label)
  balanceLabel: Label | null = null;

  @property(Label)
  wagerLabel: Label | null = null;

  @property(Label)
  multiplierLabel: Label | null = null;

  @property(Label)
  payoutLabel: Label | null = null;

  @property(Button)
  launchButton: Button | null = null;

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

  /** Launches exactly one physical ball after START/randomization is locked. */
  public onLaunchPressed(): void {
    this.tableRuntime?.launchCurrentRound();
  }

  private render(snapshot: SessionSnapshot): void {
    if (this.balanceLabel) {
      this.balanceLabel.string = formatBalls(snapshot.walletBalls);
    }

    if (this.wagerLabel) {
      this.wagerLabel.string = `BET ${snapshot.wager}`;
    }

    if (this.multiplierLabel) {
      this.multiplierLabel.string =
        snapshot.baseMultiplier === null
          ? '--'
          : `${snapshot.baseMultiplier}X × ${snapshot.wager} = ${snapshot.effectiveMultiplier}X`;
    }

    if (this.payoutLabel) {
      if (snapshot.lastPayout > 0) {
        this.payoutLabel.string = `WIN +${snapshot.lastPayout}`;
        this.payoutLabel.node.active = true;
      } else if (snapshot.lastChannel !== null) {
        this.payoutLabel.string = 'NO WIN';
        this.payoutLabel.node.active = true;
      } else {
        this.payoutLabel.node.active = false;
      }
    }

    if (this.launchButton) {
      this.launchButton.interactable = snapshot.phase === 'round-locked';
    }
  }
}
