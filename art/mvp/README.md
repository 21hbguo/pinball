# MVP Art Pack

This folder contains the smallest coherent art set for the first playable pinball prototype.

## Structure

- `3d/machine/`: lightweight cabinet model for the rotating opening screen.
- `2d/playfield/`: background and repeatable gameplay pieces.
- `2d/objects/`: gameplay objects such as the ball.
- `2d/ui/`: HUD and interaction controls.
- `2d/vfx/`: lightweight hit feedback.
- `preview/`: visual composition reference for implementation.

## Visual direction

Original generic retro-arcade look using:
- deep navy playfield
- electric blue edge lighting
- warm orange interaction accents
- cream cabinet shell

No third-party character/IP artwork is included.

## Opening transition

MVP target:
1. Rotate `pinball_machine.obj` slowly on the opening screen.
2. On machine tap, stop rotation and move camera toward the playfield glass.
3. Crossfade / match-cut into the 2D playfield scene.
4. Keep the transition around 2-3 seconds.

## 2D usage

SVG files are intentionally vector-based for easy scaling and recoloring. Export PNGs at engine-specific resolutions only when needed.
