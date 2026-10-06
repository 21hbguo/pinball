# Pinball

A TapTap mini-game project for a portrait, physical one-ball-at-a-time marble machine.

## Current direction

The first table follows the supplied single-ball machine reference rather than a generic flipper pinball layout.

Current recovered structure:
- 1080×1920 portrait table;
- BALLS / SCORE HUD;
- 17 staggered pegs;
- one central obstacle/art element;
- five terminal slots scored 2 / 4 / 6 / 8 / 10;
- START-driven one-active-ball-at-a-time loop;
- 5 balls per run in the current reference baseline;
- rotating 3D cabinet opening → 2D playfield.

## Repository structure

```
art/mvp/                     source art from PR #1
assets/scripts/config/       table geometry and tunable parameters
assets/scripts/core/         engine-independent game rules
assets/scripts/gameplay/     Cocos 2D physics runtime
assets/scripts/lobby/        3D opening transition
assets/scripts/ui/           HUD interaction
assets/scripts/platform/     TapTap isolation layer
docs/                        design, architecture, art binding, test plan
```

## Important files

- `docs/GAME_DESIGN.md`
- `docs/ARCHITECTURE.md`
- `docs/ART_BINDING.md`
- `docs/TEST_PLAN.md`
- `assets/scripts/config/ClassicSingleBallTable.ts`

The table config is intentionally the single source of truth for peg coordinates, scoring slots and physics tuning. When the original reference image is re-measured, update the config rather than rewriting gameplay.

## Cocos setup

Target engine: Cocos Creator 3.8.x.

The repository currently contains gameplay scripts and art sources, but not hand-authored Cocos scene serialization. Create/open the project with Creator, keep these `assets/scripts`, then build two scenes:

- `Lobby3D`
- `Pinball2D`

Use `docs/ARCHITECTURE.md` for the required node/component hierarchy and `docs/ART_BINDING.md` for art mapping.

Use Box2D as the 2D physics backend.

## Git workflow

- `main`: stable branch
- `feat/mvp-art-assets`: art pack (PR #1)
- `feat/full-pinball-gameplay`: gameplay architecture and first table implementation

## License

TBD
