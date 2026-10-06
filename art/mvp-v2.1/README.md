# Pinball MVP Art Pack v2.1

Corrected reference-grounded art pack matching the confirmed physical-machine layout.

## Critical layout / rule correction

- `2 / 4 / 6 / 8 / 10` are **upper multiplier indicator lights**.
- The bottom of the playfield contains **12 narrow terminal channels**.
- Each terminal channel has a small indicator light above it (idle / active state).
- One round launches **one physical ball**. Wager changes stake / payout, not the number of balls simultaneously spawned.

## Visual direction

- warm yellow + cream arcade cabinet
- red LED displays
- blue LCD / illuminated start-button accent
- dense chrome peg field
- bright yellow edge lighting
- original cute bear mascot styling

## Package structure

The full organized art pack is stored in:

`package/pinball_mvp_art_pack_v2_1.zip`

and expands to:

```
art/mvp-v2.1/
├── 2d/
│   ├── board/
│   │   └── board_concept.jpg
│   ├── objects/
│   │   └── ball.png
│   ├── playfield/
│   │   ├── peg.png
│   │   ├── bumper.png
│   │   ├── terminal_channel_idle.png
│   │   └── terminal_channel_active.png
│   ├── ui/
│   │   ├── multiplier_strip.png
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

## MVP transition

3D cabinet rotates slowly → player taps cabinet → rotation stops → camera pushes toward playfield → match-cut / crossfade → corrected 2D board.

The 3D cabinet image is a modeling / look-development reference, not a finished rotatable mesh.
