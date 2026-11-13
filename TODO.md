# Pokémon League Builder: to-do list

Things left over from the seed, and ideas tabled for later. Remove an item once it is done.

## Left over from the seed (0.1.0)
- **Unused styles.** `game/1-page.html` still has the CSS for the screens that were cut (office, party, draft, ranch, trade desk, tournament, villain banner, team marks). It does no harm; prune it when the new screens are built and it is clear what they reuse.
- **Legendaries with no way in.** Xerneas, Genesect, Cobalion, Terrakion, Virizion and Keldeo only entered the world through villain events. Paradox Pokémon only came from the Champion's reward and promotions. They wait for the legendaries rework (design doc, section 7).
- **Traits and temperaments that lost their effect.** The Mentor and Hero traits were removed (they acted on teammates and villains). The Naive, Quiet and Docile natures have no temperament now (theirs were about trades and the ranch), and Lonely, Adamant, Relaxed and Naughty lost half of theirs. To revisit when staff and gym trainers exist.
- **Ambition.** The source's ambitions (wants the title, happy to support) were about party roles and were removed with parties. Staff wishes (design doc, 4.5) are a new build.
- **Battle rules.** `BATTLE_RULE` still works in the battle engine but nothing sets it. Could serve gym features later.
- **No battles to watch in season.** Only title battles are kept for replay. Stage 1b needs gym battles the player can watch (gym trainer battles included).
- **Custom trainer packs** made for Pokémon League GM import as before, but a pack trainer whose trait is Mentor or Hero gets a random trait.

## Left over from the wall rules (0.2.0)
- **Nothing is tuned.** At 0.3.0 the wall is stronger still (see CLAUDE.md for the numbers). Tuning waits for the continuous world. Agreed order: challenger rosters first (how many Pokémon a challenger starts with, `START_TEAM`, and how fast they catch more), then squad picking, then gym trainers, with tries per gym last.
- **The season is front-loaded,** and the owner wants no fixed seasons at all: one continuous world where challengers set out, rest and leave on their own clocks (design doc, 4.1). This is the next chat's main job.
- **Staff moves.** The performance moves are switched off (`AUTO_STAFF_MOVES`): no leader is replaced for poor seasons, no comeback, no Elite Four seat won by a deep run. Vacancies from retirement are still filled automatically, sometimes by the circuit's best challenger. To be figured out with staffing (stage 1b-2 and 2), including competition inside a League for a Champion or Elite Four seat. The leftover code (`g.poor`, `wallStreak`, `COMEBACK_*`, `seatChallenge`) waits for that decision.
- **The meta response is to be redesigned.** Staff no longer add counters for the season's top Pokémon; newcomers still lean toward counter types, and ban replacements still favour them. The owner wants it recontextualized rather than automated off top performers.
- **Untyped leaders are rare and have no counterweight.** Outsiders appointed to gyms are always typed; only a promoted untyped challenger leads a mixed gym. Whether specialists should get anything in return was left for later (the owner chose nothing for now).
- **Team builder dials** (`SCOUT_BST`, `scoutShare`, `STRAT_NOISE`, `TRAIN_IV`, `trainCare`) were set by eye so a trainer with 50s builds about what the old builder did. Revisit when tuning.
- **Manual staff placement at setup.** The owner expects to place staff by hand when founding a League (stage 1b-2 staffing screens).
- **Everstone** now simply holds a Pokémon in its current form at every level.
- **Legendary encounters** still set the legendary's level from the challengers' levels, which are now their next gym's level. It works, but was not looked at closely.
- **Interim Champion** boards and profile lines are still in the interface but nothing creates an Interim Champion any more. Remove them when the records pages are next touched.
- **Triple Crown and Champion-of-a-League records** (`champLeaguesOf`) read who held the seat at a season's end, so a challenger's title win no longer counts towards them. To fix with rival Leagues (stage 4).
- **The banlist vote** doesn't include gym trainers.

## Carried over from Pokémon League GM's list
- **Doubles battles.** `battle()` assumes one active Pokémon per side. See the source repo's `TODO.md` for the work involved.
