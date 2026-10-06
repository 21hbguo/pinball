# Pinball — Game Design v0.1

## Direction

The first table is a portrait, one-active-ball-at-a-time physical marble machine inspired by the supplied reference images. It is not a flipper-driven American pinball table.

The repository art pack is the current implementation reference. The exact source image is not embedded in the repository, so values that cannot be verified from the image are isolated in configuration and must not be hard-coded into gameplay logic.

## Player loop

1. Enter the 3D cabinet view.
2. Tap the cabinet to move into the 2D playfield.
3. Press START to release one ball.
4. The player watches the ball fall through the peg field.
5. The ball enters one of five scoring slots.
6. Add the slot value to the total score.
7. Repeat until the configured ball count is exhausted.
8. Show final score and allow replay.

Only one ball is active at a time.

## Reference-layout baseline

Design coordinate system: 1080 × 1920, origin at top-left.

Visible elements currently recovered from the art/reference work:
- HUD near the top with BALLS and SCORE.
- Ball release position around (520, 350).
- 17 circular pegs in five staggered rows.
- Central large visual/obstacle around (540, 745).
- Five terminal scoring slots with visible values 2 / 4 / 6 / 8 / 10.
- START button near the bottom.

### Peg centers

Row 1: (300,430), (540,430), (780,430)

Row 2: (220,570), (420,570), (660,570), (860,570)

Row 3: (300,710), (540,710), (780,710)

Row 4: (220,850), (420,850), (660,850), (860,850)

Row 5: (300,990), (540,990), (780,990)

### Slot centers / values

- x=188 → 2
- x=364 → 4
- x=540 → 6
- x=716 → 8
- x=892 → 10

Slot top is approximately y=1460, width 144, height 194 in the current art preview.

## Scoring

For the reference-faithful rule set:
- Peg collisions do not directly add score.
- The primary score is the terminal slot value.
- The running total persists across all balls in the session.
- A ball that leaves the playfield without entering a scoring slot scores 0.

No combo, multiplier, bonus-ball, flipper, or nudge mechanic is enabled in the reference-faithful preset unless later source-image evidence supports it.

## Physics goals

The game should feel physical rather than scripted:
- fixed physics timestep;
- circular dynamic ball;
- circular static pegs;
- low friction;
- moderately elastic ball/peg contacts;
- terminal slot sensors;
- anti-stuck recovery only after the ball has remained nearly stationary for a configurable time.

Randomness should come primarily from physical collisions. Any launch jitter must remain very small and configurable.

## Interaction

START has three states:
- READY: enabled and starts the next ball;
- BALL_ACTIVE: disabled;
- GAME_OVER: becomes RESTART.

During a ball, the default reference-faithful preset has no steering input.

## Presentation

3D opening:
- low-poly cabinet slowly rotates;
- player taps cabinet;
- camera pushes toward the playfield glass;
- crossfade/match-cut into the 2D playfield.

2D play:
- keep the cabinet proportions and number placement close to the source;
- HUD updates immediately;
- slot lights briefly on score;
- collision VFX remain subtle and must not obscure the physical path.

## Data-driven requirement

All of the following live in table configuration:
- board size;
- balls per run;
- ball spawn;
- ball radius/material;
- gravity;
- peg positions/radius/material;
- obstacle geometry;
- slot positions/sizes/values;
- launch parameters;
- stuck-ball thresholds;
- scoring rules.

This lets us refine the table to pixel-level source-image fidelity later without rewriting game systems.
