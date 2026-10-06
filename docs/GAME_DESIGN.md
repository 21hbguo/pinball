# Pinball — Game Design v0.2

## Core rule

Every round launches exactly **one physical ball**.

When the player chooses to "put in" multiple balls, those balls are **wager credits**. They do not become multiple physical balls on the playfield.

Example:
- wallet: 899 ball-credits
- wager: 5
- locked base multiplier: 4X
- physical balls launched: 1
- if the one ball lands in an active channel: payout = 5 × 4 = 20 ball-credits
- if it lands in an inactive channel: payout = 0

## Round flow

1. Player has a ball-credit balance.
2. First START press begins the multiplier/channel light shuffle.
3. Second START press locks:
   - one base multiplier from 2X / 4X / 6X / 8X / 10X;
   - a set of active channels among the 12 terminal channels.
4. Player chooses wager N.
5. The game deducts N ball-credits.
6. Exactly one physical ball is released.
7. The ball travels through the peg field.
8. It ends in one of 12 terminal channels, or a special/bonus destination if the machine supports one.
9. If the terminal channel is active:
   payout = base multiplier × wager.
10. Otherwise payout = 0.
11. Add payout to wallet.
12. Return to START randomization for the next round.

## Risk / reward

The machine couples higher multipliers with fewer active channels.

Source-confirmed examples from the supplied rule description:
- 2X: roughly 4-5 of 12 channels may be active.
- 10X: roughly 1 of 12 channels may be active.

The exact 4X / 6X / 8X active-channel counts and exact random-selection probabilities are not yet verified. They must stay configurable rather than guessed in production logic.

## Important distinction

The values 2 / 4 / 6 / 8 / 10 are **multiplier states**, not five terminal scoring slots.

The physical terminal result is one of **12 channels**.

## Physical model

Only one dynamic ball exists per round:
- fixed physics timestep;
- circular dynamic ball;
- static peg field;
- low friction;
- moderate restitution;
- terminal channel sensors;
- anti-stuck recovery only if required.

Wager size must never alter ball mass, radius, physics, or number of balls. It affects settlement only.

## UI data

Recommended live fields:
- BALLS / wallet balance
- BET / wager
- current base multiplier
- effective multiplier = base multiplier × wager
- active-channel lights
- current/last terminal channel
- actual payout
- card count, only if a non-cash game feature is later implemented

## Source fidelity

Layout geometry should be measured from the original machine image:
- peg count and centers;
- ball size;
- 12 channel positions and widths;
- multiplier-light positions;
- central bonus structure;
- labels and display locations.

Current geometry in code is provisional where the source image is unavailable.
