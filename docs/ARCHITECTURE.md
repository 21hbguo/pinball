# Architecture

## Core model

The first table is a **one-physical-ball-per-round** machine.

A round contains:
- wager N (ball-credit stake);
- base multiplier (2 / 4 / 6 / 8 / 10);
- active channel set among 12 terminal channels;
- exactly one physical ball;
- one terminal result;
- one payout.

There is never a need to create N physical balls when the player wagers N credits.

## Layers

### Table configuration
`assets/scripts/config/`

`ClassicSingleBallTable.ts` owns:
- 1080×1920 table coordinate system;
- multiplier options;
- 12 terminal channels;
- known active-channel-count rules;
- peg geometry;
- channel/divider geometry;
- ball and collision parameters.

Unverified source rules remain absent/configurable rather than guessed.

### Pure rule core
`assets/scripts/core/GameSession.ts`

State flow:
- `awaiting-start`
- `round-locked`
- `ball-active`
- `round-resolving`
- back to `awaiting-start`

Settlement:
- wager is deducted before launch;
- one ball is launched;
- active-channel hit → payout = wager × baseMultiplier;
- inactive channel / miss → payout = 0.

### Physics runtime
`assets/scripts/gameplay/ReferenceTableRuntime.ts`

Creates:
- one dynamic ball when a locked round launches;
- static pegs and walls;
- 12 terminal channel sensors.

Physics has no knowledge of stake size beyond the session result.

### UI
`assets/scripts/ui/GameHUD.ts`

Shows:
- wallet;
- wager;
- base/effective multiplier;
- payout;
- launch availability.

START-light randomization is intentionally a separate controller because exact 4X/6X/8X channel-count and probability rules still need source verification.

### Lobby
`OpeningMachineController.ts`

Rotating 3D cabinet → tap → 2D machine view.

### Platform
`TapAdapter.ts`

TapTap-specific APIs remain isolated from game rules.

## Source-fidelity workflow

When the original machine image is available:
1. measure peg coordinates/radii;
2. measure all 12 channel boundaries;
3. measure multiplier-light/UI positions;
4. update table configuration;
5. verify exact active-channel counts per multiplier;
6. verify randomization probabilities;
7. run physical drop tests;
8. tune material parameters only after geometry matches.
