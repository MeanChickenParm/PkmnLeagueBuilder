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
- **Tuned in 0.5.0 with `BUILD_PAR`** (design doc 3.5). The four agreed dials (`START_TEAM`, squad picking, gym trainers, tries per gym) stay where they were; they barely move the wall. Retune `BUILD_PAR` if later changes (staffing by hand, hiring, money) shift the balance.
- **Staff moves.** The performance moves are switched off (`AUTO_STAFF_MOVES`): no leader is replaced for poor years, no comeback, no Elite Four seat won by a deep run. Vacancies from retirement are still filled automatically and at once (`staffRetires`), sometimes by the circuit's best challenger. To be figured out with staffing (stage 1b-2 and 2), including competition inside a League for a Champion or Elite Four seat. The leftover code (`g.poor`, `wallStreak`, `COMEBACK_*`, `seatChallenge`) waits for that decision.
- **The meta response is to be redesigned.** Staff no longer add counters for the year's top Pokémon; newcomers still lean toward counter types, and ban replacements still favour them. The owner wants it recontextualized rather than automated off top performers.
- **Untyped leaders are rare and have no counterweight.** Outsiders appointed to gyms are always typed; only a promoted untyped challenger leads a mixed gym. Whether specialists should get anything in return was left for later (the owner chose nothing for now).
- **Team builder dials** (`SCOUT_BST`, `scoutShare`, `STRAT_NOISE`, `TRAIN_IV`, `trainCare`) were set by eye in 0.3.0; since 0.5.0 they read ratings through `bld()`, offset by `BUILD_PAR`. How wide the gap between strong and poor staff should be has not been looked at.
- **Everstone** now simply holds a Pokémon in its current form at every level.
- **Legendary encounters** still set the legendary's level from the challengers' levels, which are now their next gym's level. It works, but was not looked at closely.
- **Interim Champion** boards and profile lines are still in the interface but nothing creates an Interim Champion any more. Remove them when the records pages are next touched.
- **Triple Crown and Champion-of-a-League records** (`champLeaguesOf`) read who held the seat at a season's end, so a challenger's title win no longer counts towards them. To fix with rival Leagues (stage 4).
- **The banlist vote** doesn't include gym trainers.

## Left over from the continuous world (0.4.0)
- **Internal names still say season.** `S.season` is the year, and `seasonHist`, `titleSeasons`, `t.seasons`, `seasonAwards`, `legendOffseason`, `BAN_MAX_SEASONS` and friends all count years. Renaming them is safe but touches hundreds of lines; do it when a chat has room.
- **Career length** should vary more, by factors such as age and ratings (owner, Nov 13): stage 2.
- **The field is older and larger since 0.5.0** (give-up after three years, at 0.2): about 50 to 75 a League. The sim check's alarm moved from 80 to 120. Watch save size and speed with several Leagues.
- **The year in review shows last year only** and no week-by-week story. The full report is stage 1b-2.
- **Gym battles still can't be watched**, and only the last eight title battles of a year are kept.
- **The wild cap** in `wildOffers` and the item tier in `exploreFind` grow with weeks into a run. Tested in 0.5.0: raising or removing the cap does not change how strong a challenger's team is at the Elite Four (they catch strong lines in base form early), so it is not a tuning lever.
- **Speed and save size.** A year takes about a second to sim since 0.5.0 (48 weeks, 150 to 200 runs). A four-League world was about 10 MB after 25 years; the browser's own storage holds about 5 MB before the game falls back to its larger store. Worth measuring before rival Leagues (stage 4).
- **Unused styles** for the old phase buttons can go with the other pruning.

## Carried over from Pokémon League GM's list
- **Doubles battles.** `battle()` assumes one active Pokémon per side. See the source repo's `TODO.md` for the work involved.

## Left over from founding by hand (0.6.0)
- **Balance not measured.** The founding field is larger (36), unplaced founding candidates (strong trainers) join the circuit, gym trainers come from the circuit's best, and staff rarely leave now. None of it has been through the wall report (the owner: balance waits). The report founds Leagues automatically; a hand-placed line was offered and declined for now.
- **Old staff in rival Leagues.** Staff step down only after 10+ years in posts and past their career length, and nobody replaces poor staff yet, so rival Leagues will keep ageing staff whose ratings fall. Replacing staff is stage 2 (the player's decisions; AI Leagues need their own rule).
- **An acting leader fights under their own type.** They share at least one type with the leader who left, but a dual-type gym can narrow to one type, and the remaining gym trainer may share no type with the acting leader while acting.
- **Vacancy outsiders are role `prospect`** until the post is filled (then the unpicked join the circuit). A save with an open vacancy carries them.
- **Promotion is partial.** A vacancy can be filled by any of your gym trainers, but not by a Gym Leader moving to the Elite Four (that would open a second vacancy). Promotion and competition for seats are stage 2.
- **The founding screen shows ratings, not teams.** A candidate's Pokémon are rebuilt for the post anyway; the profile card can't open during founding.
- **The multi-year sim fills your vacancies for you** (best candidate) because nobody is there to choose.
