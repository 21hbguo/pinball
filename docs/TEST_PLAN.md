# Test Plan

## A. Rule tests

### Session
- New run starts with 5 balls.
- START consumes exactly one ball.
- START cannot create a second active ball.
- Slot 2/4/6/8/10 adds exactly that value.
- Drain adds 0.
- A terminal event cannot resolve the same ball twice.
- After the fifth resolved ball, phase becomes GAME_OVER.
- RESTART clears score and restores 5 balls.

## B. Geometry tests

Use the 1080×1920 reference overlay.

- 17 peg centers match the table spec.
- Peg radius matches the visual circle.
- Central obstacle center/radius align with artwork.
- Five slot sensor rectangles stay inside their visual slots.
- Slot divider colliders do not overlap the sensor centers.
- Left/right wall colliders keep the ball inside the physical playfield.
- Ball spawn does not overlap a peg.

## C. Physics tests

Run at least 100 drops after each material-tuning change.

Record:
- terminal slot distribution;
- drain rate;
- average ball duration;
- stuck-ball recovery count;
- maximum speed;
- any tunnelling through pegs/walls.

Acceptance baseline:
- no duplicate score;
- no ball survives indefinitely;
- no obvious tunnelling at normal speed;
- stuck recovery is rare rather than part of normal play;
- all five slots are physically reachable.

Do not tune the game to equal slot probabilities unless the real machine implies that. Geometry fidelity has priority.

## D. Interaction tests

- START works only in READY.
- START disabled while a ball is active.
- Score updates after the terminal slot event.
- Remaining-ball count is visually correct.
- RESTART works from GAME_OVER.
- Touching the 3D cabinet once triggers one transition only.

## E. Visual/source comparison

Side-by-side checks:
- cabinet aspect ratio;
- HUD location;
- peg row count and staggering;
- central object position;
- numeric slot order;
- slot widths/gaps;
- START button position;
- ball scale relative to peg scale.

The target is close source-machine resemblance, not generic pinball aesthetics.

## F. TapTap device testing

After Cocos build conversion:
- Android TapTap QR debug;
- iOS TapTap debug if available;
- low/mid/high device FPS;
- touch latency;
- app resume/pause during an active ball;
- repeated scene transition;
- local score storage fallback;
- package size and startup time.

## G. Regression checklist

Any table-layout change must re-run:
- 20 manual balls;
- one complete five-ball run;
- each terminal slot forced once;
- one drain;
- one stuck-ball recovery;
- one restart;
- 3D → 2D transition three times.
