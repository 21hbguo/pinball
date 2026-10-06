# Pinball

A single-ball wagered-round 弹珠机 (pinball/bead machine) — one physical ball
drops through a peg field into one of 12 terminal channels per round.

## Game rules

1. Press **START** once to run the multiplier/channel light shuffle.
2. Press **START** again to lock: a base multiplier (2X/4X/6X/8X/10X) and the
   set of active channels among the 12 terminal channels.
3. Set your **BET** (ball-credits wagered) and press **START/GO!** to launch.
4. Exactly **one** physical ball drops through the peg field.
5. Ball terminates in one of 12 channels:
   - active channel → payout = `wager × multiplier`
   - inactive channel → payout = 0
6. Wallet persists in `localStorage`; **+10 BALLS** inserts credits,
   **NEW GAME** resets.

Controls: on-screen buttons, `Space/Enter` = START, `↑/↓` = bet,
`I` = insert 10, `R` = new game.

## Web version

Static site under `web/` — no build step, no dependencies.

```bash
./start.sh          # serves on http://localhost:8000 (binds 0.0.0.0)
./start.sh 9000     # custom port
```

## Repository layout

```
web/            web version (canvas, vanilla JS)
art/mvp/        MVP art pack v1 (SVG, OBJ)
art/mvp-v2/     art direction v2 (warm yellow/cream, red LED)
docs/           (on feat branches) design docs
```

Note: `art/mvp-v2/package/pinball_mvp_art_pack_v2.zip` is currently corrupt
(no central directory) and needs re-uploading.

## License

TBD
