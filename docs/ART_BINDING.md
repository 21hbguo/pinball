# Art Binding

The gameplay branch inherits the visual style assets from PR #1, but the newly confirmed rules change the required bottom-board geometry.

## Confirmed correction

The old preview interpreted 2 / 4 / 6 / 8 / 10 as five terminal slots. That is no longer the gameplay model.

Correct structure:
- 2 / 4 / 6 / 8 / 10 = multiplier-light states;
- bottom physical result area = 12 terminal channels;
- one physical ball per round.

Therefore the existing five-slot SVGs are style references/placeholders only. Final scene art must provide a 12-channel bottom region and a separate multiplier-light display.

## Reusable PR #1 assets

| Object | Source |
| --- | --- |
| Background style | `art/mvp/2d/playfield/background.svg` |
| Peg style | `art/mvp/2d/playfield/peg.svg` |
| Ball | `art/mvp/2d/objects/ball.svg` |
| HUD style | `art/mvp/2d/ui/hud_panel.svg` |
| START button | `art/mvp/2d/ui/button_start*.svg` |
| Hit VFX | `art/mvp/2d/vfx/hit_flash.svg` |
| 3D cabinet | `art/mvp/3d/machine/pinball_machine.obj` |

## Assets that need revision

- replace five terminal slot visuals with 12 channels;
- add active/inactive state for every channel;
- add separate 2X / 4X / 6X / 8X / 10X multiplier lights;
- add BET / current wager display if it exists on the source machine;
- keep exact locations based on the original reference image.

## Binding rule

Visual transforms and collider geometry must share the same 1080×1920 coordinate spec from `ClassicSingleBallTable.ts`.

Physics colliders remain separate from decorative sprites so visual revisions cannot silently alter the probability distribution.

## Current limitation

The original uploaded physical-machine image is not stored in the repository. Exact 12-channel dimensions and several light positions therefore remain provisional until that image is re-measured.
