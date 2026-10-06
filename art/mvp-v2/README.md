# Pinball MVP Art Pack v2

Reference-grounded refresh based on the supplied real arcade pinball/bead machines.

## Visual direction

- Warm yellow + cream arcade cabinet, replacing the generic navy sci-fi look.
- Red LED counters and a blue LCD / illuminated start-button accent.
- Dense chrome peg field and bottom scoring lanes labelled 2 / 4 / 6 / 8 / 10.
- Cute original bear mascot theme, grounded in the physical-machine references without reusing third-party source artwork.

## Package structure

The full art pack is stored in `package/pinball_mvp_art_pack_v2.zip` and expands to:

```
art/mvp-v2/
├── 2d/
│   ├── board/
│   │   └── board_concept.jpg
│   ├── objects/
│   │   └── ball.png
│   ├── playfield/
│   │   ├── peg.png
│   │   ├── bumper.png
│   │   ├── slot_6.png
│   │   └── slot_10_active.png
│   ├── ui/
│   │   ├── start_button.png
│   │   └── info_panel.png
│   └── vfx/
│       └── hit_flash.png
├── 3d/
│   └── concept/
│       └── machine_concept.jpg
├── preview/
│   └── overview.jpg
├── README.md
└── manifest.json
```

## Intended MVP flow

1. Opening scene: a lightweight 3D cabinet based on `3d/concept/machine_concept.jpg` rotates slowly.
2. Player taps the cabinet.
3. Rotation stops and the camera pushes toward the playfield.
4. Match-cut / crossfade into the 2D board.
5. Core gameplay remains 2D.

## Important

`machine_concept.jpg` is the modeling / look-development target, not a finished rotatable 3D mesh. The MVP 3D mesh should remain lightweight; the detailed game art is concentrated in the 2D scene.
