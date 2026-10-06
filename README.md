# Pinball

TapTap mini-game recreation of the supplied physical single-ball marble machine.

## Confirmed gameplay direction

- one physical ball per round;
- wager can consume multiple ball-credits, but never creates multiple physical balls;
- START randomizes/locks a base multiplier and active terminal channels;
- multiplier options: 2X / 4X / 6X / 8X / 10X;
- 12 physical terminal channels;
- active-channel hit pays `wager × base multiplier`;
- inactive-channel hit pays 0;
- higher multipliers correspond to fewer active channels;
- rotating 3D cabinet opening → 2D physical playfield.

Example: wager 5 at 4X still launches one physical ball. If that ball hits an active channel, payout is 20 ball-credits.

## Repository

```
art/mvp/                     art source from PR #1
assets/scripts/config/       table/rule configuration
assets/scripts/core/         engine-independent round + settlement rules
assets/scripts/gameplay/     Cocos 2D physics
assets/scripts/lobby/        3D opening transition
assets/scripts/ui/           wallet / wager / multiplier / payout HUD
assets/scripts/platform/     TapTap boundary
docs/                        design, architecture, art binding, tests
```

Target engine: Cocos Creator 3.8.x.

The original source-machine image is not stored in the repo, so exact 12-channel geometry and some randomization parameters remain provisional until the image is re-measured.
