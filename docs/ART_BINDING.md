# Art Binding

The gameplay branch is based on PR #1 (`feat/mvp-art-assets`).

## 2D

Place the final visual layer above the physics layer.

| Game object | Source asset |
| --- | --- |
| Table background | `art/mvp/2d/playfield/background.svg` |
| Peg | `art/mvp/2d/playfield/peg.svg` |
| Slot normal | `art/mvp/2d/playfield/slot.svg` |
| Slot active | `art/mvp/2d/playfield/slot_active.svg` |
| Ball | `art/mvp/2d/objects/ball.svg` |
| HUD | `art/mvp/2d/ui/hud_panel.svg` |
| START | `art/mvp/2d/ui/button_start.svg` |
| START pressed | `art/mvp/2d/ui/button_start_pressed.svg` |
| Collision flash | `art/mvp/2d/vfx/hit_flash.svg` |

Keep visual transforms driven by the same 1080×1920 coordinates as `ClassicSingleBallTable.ts`.

## 3D

Import:
- `art/mvp/3d/machine/pinball_machine.obj`
- `art/mvp/3d/machine/pinball_machine.mtl`

Attach the imported cabinet root to `OpeningMachineController.cabinet`.

## Why physics and sprites are separate

Collision geometry must stay deterministic and easy to tune. Decorative artwork should not determine collider shape automatically. This prevents an art revision from silently changing the game's probability distribution.

## Current limitation

The repository contains the derived art/reference layout, not the original uploaded photograph/screenshot itself. Therefore the current coordinates reproduce the derived preview. Pixel-level matching to the original image requires re-measuring that original image when it is available again.
