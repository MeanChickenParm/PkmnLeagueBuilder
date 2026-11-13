# Pokémon League Builder: to-do list

Things left over from the seed, and ideas tabled for later. Remove an item once it is done.

## Left over from the seed (0.1.0)
- **Unused styles.** `game/1-page.html` still has the CSS for the screens that were cut (office, party, draft, ranch, trade desk, tournament, villain banner, team marks). It does no harm; prune it when the new screens are built and it is clear what they reuse.
- **Legendaries with no way in.** Xerneas, Genesect, Cobalion, Terrakion, Virizion and Keldeo only entered the world through villain events. Paradox Pokémon only came from the Champion's reward and promotions. They wait for the legendaries rework (design doc, section 7).
- **Traits and temperaments that lost their effect.** The Mentor and Hero traits were removed (they acted on teammates and villains). The Naive, Quiet and Docile natures have no temperament now (theirs were about trades and the ranch), and Lonely, Adamant, Relaxed and Naughty lost half of theirs. To revisit when staff and gym trainers exist.
- **Ambition.** The source's ambitions (wants the title, happy to support) were about party roles and were removed with parties. Staff wishes (design doc, 4.5) are a new build.
- **Battle rules.** `BATTLE_RULE` still works in the battle engine but nothing sets it. Could serve gym features later.
- **No gym battles to watch.** Only title battles are kept for replay. Stage 1b-2 needs gym battles the player can watch (gym trainer battles included).
- **Custom trainer packs** made for Pokémon League GM import as before, but a pack trainer whose trait is Mentor or Hero gets a random trait.

## Left over from the wall rules (0.2.0)
- **Nothing is tuned, and the agreed dials don't do it.** At 0.4.0 strong staff hold a perfect year about 9 years in 10 against a target of 1 in 10 (CLAUDE.md has the numbers). Starting teams (`START_TEAM`), squad picking, gym trainers and tries per gym were each tested alone and all together at their extreme and barely move it: challengers who reach the Elite Four almost never win all five battles. The owner has to choose another lever before tuning can go on (design doc, section 12): what challengers catch and keep (the wild cap in `wildOffers`, which only rises with weeks into a run, so short runs keep teams weak), the staff team builder dials, or the rules of the Elite Four run. None of the dials was moved.
- **Staff moves.** The performance moves are switched off (`AUTO_STAFF_MOVES`): no leader is replaced for poor years, no comeback, no Elite Four seat won by a deep run. Vacancies from retirement are still filled automatically and at once (`staffRetires`), sometimes by the circuit's best challenger. To be figured out with staffing (stage 1b-2 and 2), including competition inside a League for a Champion or Elite Four seat. The leftover code (`g.poor`, `wallStreak`, `COMEBACK_*`, `seatChallenge`) waits for that decision.
- **The meta response is to be redesigned.** Staff no longer add counters for the year's top Pokémon; newcomers still lean toward counter types, and ban replacements still favour them. The owner wants it recontextualized rather than automated off top performers.
- **Untyped leaders are rare and have no counterweight.** Outsiders appointed to gyms are always typed; only a promoted untyped challenger leads a mixed gym. Whether specialists should get anything in return was left for later (the owner chose nothing for now).
- **Team builder dials** (`SCOUT_BST`, `scoutShare`, `STRAT_NOISE`, `TRAIN_IV`, `trainCare`) were set by eye so a trainer with 50s builds about what the old builder did. Revisit when tuning.
- **Manual staff placement at setup.** The owner expects to place staff by hand when founding a League (stage 1b-2 staffing screens).
- **Everstone** now simply holds a Pokémon in its current form at every level.
- **Legendary encounters** still set the legendary's level from the challengers' levels, which are now their next gym's level. It works, but was not looked at closely.
- **Interim Champion** boards and profile lines are still in the interface but nothing creates an Interim Champion any more. Remove them when the records pages are next touched.
- **Triple Crown and Champion-of-a-League records** (`champLeaguesOf`) read who held the seat at a season's end, so a challenger's title win no longer counts towards them. To fix with rival Leagues (stage 4).
- **The banlist vote** doesn't include gym trainers.

## Left over from the continuous world (0.4.0)
- **Internal names still say season.** `S.season` is the year, and `seasonHist`, `titleSeasons`, `t.seasons`, `seasonAwards`, `legendOffseason`, `BAN_MAX_SEASONS` and friends all count years. Renaming them is safe but touches hundreds of lines; do it when a chat has room.
- **Sims stop for any League.** `stopFor` pauses a sim for a title conceded or a vacant post in any League, because there is no player's League yet. Narrow it to the player's League with the staffing screens (1b-2).
- **Provisional rules, flagged in the design doc (4.1):** the rest lengths, the give-up rule and its numbers, a challenger who reached the Elite Four moving to another League half the time (`TOUR_CHANCE`), newcomers arriving every six weeks, a founding field setting out over seven weeks, and bans and the new-League timer counting years.
- **The field is young.** Most challengers are in their first few years, because the give-up rule removes the weak after two. Whether that is the world the owner wants is worth a look once tuning is settled.
- **The year in review shows last year only** and no week-by-week story. The full report is stage 1b-2.
- **Gym battles still can't be watched**, and only the last eight title battles of a year are kept.
- **The wild cap** in `wildOffers` and the item tier in `exploreFind` grow with weeks into a run (the source: weeks into the season). See the tuning note above.
- **Speed and save size.** A year takes about half a second to sim (48 weeks, 100+ runs). A four-League world was about 10 MB after 25 years; the browser's own storage holds about 5 MB before the game falls back to its larger store. Worth measuring before rival Leagues (stage 4).
- **Unused styles** for the old phase buttons can go with the other pruning.

## Carried over from Pokémon League GM's list
- **Doubles battles.** `battle()` assumes one active Pokémon per side. See the source repo's `TODO.md` for the work involved.
