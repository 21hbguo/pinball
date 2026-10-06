# Test Plan

## Rule tests

- A round always spawns exactly one physical ball.
- Wager 1, 3, 5, 10, or any other supported positive integer never changes physical ball count.
- Wager is deducted once, before launch.
- Example: wager 5 + base multiplier 4X + active-channel hit => payout 20.
- Same example + inactive-channel hit => payout 0.
- One ball can settle only once.
- After settlement, a new START/randomization is required before another launch.
- Active channels must be valid channel numbers 1-12.
- Base multiplier must be one of 2 / 4 / 6 / 8 / 10.

## Random-selection tests

Known rule constraints:
- 2X can activate roughly 4-5 channels.
- 10X can activate roughly 1 channel.

Do not finalize 4X / 6X / 8X channel counts or multiplier probabilities until they are verified from the machine/reference.

## Geometry tests

- 12 terminal channels cover the intended bottom playfield.
- Channel sensor rectangles do not overlap adjacent channel centers.
- Divider colliders correctly funnel the one ball into one terminal channel.
- Peg/central geometry matches the source image once re-measured.
- Ball spawn does not overlap fixed geometry.

## Physics tests

Run repeated one-ball drops:
- no tunnelling;
- no duplicate terminal events;
- no persistent stuck ball;
- every physically reachable channel reports the correct index;
- wager size has zero effect on trajectory.

## UI tests

- First START starts light/random-selection state.
- Second START locks multiplier and active channels.
- BET changes wager only.
- LAUNCH releases exactly one physical ball.
- wallet decrements by wager once;
- WIN updates by payout once;
- active-channel lights visually match the locked round.

## TapTap device tests

- Android QR debug;
- iOS debug if available;
- low/mid/high device FPS;
- pause/resume during an active ball;
- repeated 3D → 2D transition;
- local wallet persistence;
- startup/package-size checks.
