# Architecture

## Principles

1. The source/reference table is data, not code.
2. Physics and session rules are independent.
3. Only one active ball exists at a time on the first table.
4. Platform APIs are isolated behind `TapAdapter`.
5. Visual assets can change without changing rules or physics geometry.

## Runtime layers

### 1. Table configuration
`assets/scripts/config/`

- `TableDefinition.ts`: schema.
- `ClassicSingleBallTable.ts`: first table coordinates, scores and physics tuning.

This is the main file to edit when matching the original machine image.

### 2. Pure game core
`assets/scripts/core/`

- `GameSession.ts`: READY → BALL_ACTIVE → RESOLVE → READY/GAME_OVER.
- `DesignSpace.ts`: converts the 1080×1920 reference coordinate system to Cocos centered Y-up coordinates.
- `ScoreFormat.ts`: HUD formatting.

The core does not import Cocos.

### 3. Physics runtime
`assets/scripts/gameplay/`

- `ReferenceTableRuntime.ts`: builds pegs, walls, sensors and the current ball.
- `BallLifecycle.ts`: speed limiting and stuck-ball detection.

The runtime consumes the table configuration and forwards terminal outcomes to `GameSession`.

### 4. UI
`assets/scripts/ui/`

- `GameHUD.ts`: BALLS, SCORE, result text and START/RESTART state.

### 5. Lobby
`assets/scripts/lobby/`

- `OpeningMachineController.ts`: slow 3D cabinet rotation and transition into `Pinball2D`.

### 6. Platform
`assets/scripts/platform/`

- `TapAdapter.ts`: the only place allowed to access the TapTap mini-game global runtime.

## Scene plan

### Lobby3D
- Camera
- CabinetRoot
  - imported `art/mvp/3d/machine/pinball_machine.obj`
- OpeningInput
  - `OpeningMachineController`

### Pinball2D
- Canvas (design resolution 1080×1920)
- PlayfieldVisual
  - background
  - peg sprites
  - center art
  - slot sprites / number labels
- PhysicsRoot
  - `ReferenceTableRuntime`
- HUD
  - BALLS label
  - SCORE label
  - result label
  - START button
  - `GameHUD`

Physics visuals currently have a simple geometry fallback so collision layout remains inspectable before final sprite binding. Production presentation should place the art sprites on `PlayfieldVisual` while `PhysicsRoot` remains invisible.

## Art source of truth

Use assets from PR #1 / `art/mvp/`:
- `2d/objects/ball.svg`
- `2d/playfield/peg.svg`
- `2d/playfield/slot.svg`
- `2d/playfield/slot_active.svg`
- `2d/playfield/background.svg`
- `2d/ui/hud_panel.svg`
- `2d/ui/button_start*.svg`
- `2d/vfx/hit_flash.svg`
- `3d/machine/pinball_machine.obj`

Do not redraw these in gameplay code. The Graphics shapes in `ReferenceTableRuntime` are fallback/debug visuals only.

## Source-fidelity workflow

When the original physical-machine reference image is available:
1. overlay it at 1080×1920;
2. measure every peg center/radius;
3. update `ClassicSingleBallTable.ts`;
4. measure slot/divider geometry;
5. update the same config;
6. run repeated drop tests;
7. adjust restitution/friction only after geometry matches;
8. keep score rules exactly as shown by the source.

No gameplay system rewrite should be needed.
