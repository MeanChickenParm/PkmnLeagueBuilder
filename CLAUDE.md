# Pokémon League Builder: how to work on this repo

Pokémon League Builder is a fork of Pokémon League GM (`MeanChickenParm/PokemonLeagueGM`, branch `v2`, version 2.0.2, commit `9ae0fb8`) turned inside out: the player runs a League and tries to let no challenger through. The design is the Project doc `claude/game-design.md`. Read it before building anything.

The two games never merge. A battle fix made in one has to be copied to the other by hand, so keep changes to the battle code in `game/3-engine-1.js` small and easy to find.

This repo is the only master copy of the game. Every chat works the same way: clone, build, change, test, push.

## Working rules (agreed Nov 12, 2026)
- The GitHub repo is the only master copy. Never build from a file in the claude.ai Project, an attachment, or an earlier chat's workspace.
- Edit the source pieces in `game/`, never the built HTML.
- One chat = one new version number, with all of that chat's changes in one changelog entry (date and Eastern Time timestamp).
- Test before every push: the Node sim, the headless browser play-through and the two code checks below must all pass.
- **Don't send the game files unless asked.** The build still makes the game HTML and the itch.io zip and they are checked every chat, but they are only sent to the owner when the owner asks for them, once the game is playable. The built game is not committed to the repo (there is no GitHub Pages site yet).
- Keep this file up to date, and keep the design doc in the Project up to date with what was decided and what was built.

## Where the build stands
- **0.1.0 (the seed):** the source with the cut systems removed. The world runs on its own; the player controls nothing yet.
- **0.2.0 (stage 1a, the wall rules):** set-level battles everywhere, challengers without levels, three tries per gym, two gym trainers per gym, the Champion keeps the seat, and the wall report. Staff are still placed automatically and nothing is tuned.
- **0.3.0 (stage 1b-1, first half):** gym types from the leader's class (dual types kept, untyped leaders allowed), gym trainers that share a type with the leader, a staff team builder that reads Scouting, Strategy and Training, teams that stay on type, the meta response and the performance-based staff moves switched off, and a seeded wall report with staff tiers. Not tuned: tuning waited for the continuous-world calendar.
- **Next:** design and build the continuous world (no fixed seasons), then tune (see the design doc, section 12).

## Layout
- `game/`: the source pieces plus `build.py`. Edit these.
- `tests/`: the checks to run before pushing.
- `TODO.md`: things left over or tabled. Add to it; remove an item once it is done.
- `dist/` (not committed): build output.

| Piece | What's in it | Starts at |
|---|---|---|
| `1-page.html` | page head, styles, app container | top of the file |
| `2-pokemon-data.js` | all Pokémon data: SPECIES_RAW, LEGENDS_RAW, BASE_STATS_RAW, PARADOX_RAW, BABY_RAW, MEGA_RAW, MOVES_RAW, SIG_MOVES, ABILITY_RAW | `// ================= POKÉMON DATA =================` |
| `3-engine-1.js` | engine: types, species, world constants (regions, cities, gym and Elite levels), trainers, battle, moves, abilities, items, stats, road battles | `// ================= HALCYON LEAGUE ENGINE =================` |
| `4-engine-2.js` | engine: legendary partners, the season (catching, weekly actions), awards, legacy trainers, legendary events, the world's Leagues, League finals, offseason, world structure, god mode | `// ================= LEGENDARY PARTNERS (v166) =================` |
| `5-engine-3.js` | engine: famous trainers, trainer packs, My Pokédex, newcomers, the sim driver, the banlist, season start, new world, challengers changing Leagues; ends with `module.exports` | `// ================= FAMOUS TRAINERS =================` |
| `6-ui-1.js` | interface: save and load, small renderers, banners, header and nav, setup, Advanced options, trainer packs, Pokédex editor, profiles, images | `// ================= POKÉMON LEAGUE BUILDER UI =================` |
| `7-ui-2.js` | interface: badge circuit, gyms, trainers, Pokémon, news, records, Hall of Fame, history, recap, banlist card, modals, sim dialog, glossary, god mode | `// ---------- the badge circuit, gyms and Elite ----------` |
| `8-ui-3.js` | interface: `const UPDATES = [` (the changelog), the battle viewer, render, the click handler, save files, boot | `const UPDATES = [` |
| `9-end.html` | closing tags | after the last `</script>` |

The build joins 3+4+5 into one script and 6+7+8 into another; the Pokémon data loads first as its own script. A piece over 240 KB makes the build stop: split it at a section comment and update the lists in `build.py`, `tests/unused.py` and this table.

## How the world is stored (things to know before changing it)
- `S` is the whole save. `SAVE_VERSION` (in `3-engine-1.js`) is 2 (bump it whenever a change makes old saves unusable; a save with another number is not loaded); the save key is `plb-save`. Every storage key starts with `plb-` or `pokemon-league-builder-`. This game never reads a Pokémon League GM save.
- **Phases:** `season` (24 weeks, `simWeek()`), `league` (`runLeague()`), `offseason` (`nextSeason()` brings in newcomers, settles League moves and the ban vote, and starts the next season). `autoStep()` does whatever the phase needs; `simOneSeason()` plays a whole one.
- **Leagues:** the bound League's state sits directly on `S` (`S.gyms`, `S.e4`, `S.champion`, `S.challengers`…); the others wait in `S.leagues`. Use `inLeague(i, fn)` / `eachLeague(fn)`; `LEAGUE_FIELDS` lists what belongs to a League. Each League has a `region` (an index into `LEAGUE_SETS`).
- **Cities are world objects**, not part of a League: `S.cities[id] = { id, name, region }`, made by `regionCities(region)` the first time a League is founded in a region. A gym sits in a city: `gym.city` is the city's id. `gymCity(i)` and `townName(i)` give the bound League's gym `i`. Two Leagues founded in the same region share the same city objects.
- **Trainers:** `S.trainers[id]`, with `role` one of `challenger`, `leader`, `gymtrainer`, `e4`, `champion`, `free`, `prospect`, `retired` (`exchamp` exists only for a moment while a Champion retires). `STAFF_ROLES` is the four post roles; `staffIds()` lists everyone holding a post in the bound League. There are no teams: a challenger is on one League's circuit (`S.challengers`), at most `CIRCUIT_SIZE` (24) per League.
- **Newcomers** (`5-engine-3.js`): each offseason `NEWCOMERS_PER_LEAGUE` new trainers set out; they and the free agents take open places on a circuit, or the place of its weakest challenger if they rate higher (`circuitValue`).
- **The wall rules (0.2.0):**
  - Levels and sizes are constants in `3-engine-1.js`: `GYM_LV`, `GYM_SIZE` (3, 3, 4, 4, 5, 5, 6, 6), `E4_LV`, `E4_SIZE` (6), `CHAMP_LV`, `GYM_TRAINERS` (2), `GYM_TRIES` (3).
  - Every circuit battle goes through `setBattle(t, foe, lvl, stakes, title)`: it picks the challenger's squad with `pickSquad` (as many Pokémon as the foe fields, by matchup, with noise from a low Strategy rating) and calls `battle()` with `opts.equal = lvl`. Staff teams still carry levels from `relevelElite`, but they don't matter in a set-level battle.
  - **Challengers have no levels.** `setTeamLevel(t, L)` puts every Pokémon at level `L` in the form it would have there (`stageAt`; `m.top` remembers the furthest form reached, so a line can go back down to its first form and up again along the same branch) with that level's moves. It runs at season start, after every weekly action and before each League battle; `challengerLevel(t)` is the level of the next battle. There is no level gain: `gainLevels`, `PACE` and the Lucky Egg are gone. The weekly actions left are challenge, explore (catch), train (friendship only) and seek (a legendary).
  - **Gym tries:** `gymTry()` in `4-engine-2.js`. A challenger carries `t.gymTries` (losses at the current gym), `t.gymStage` (gym trainers already beaten there) and `t.out` (the week of their third loss; they take no more actions that season). A gym's `w` is tries turned back and `l` badges conceded.
  - **Gym trainers:** `gym.trainers` holds two trainer ids with role `gymtrainer`. `staffGym(i)` fills the gym and lets go of any who no longer fit; it runs at founding and every offseason. `gymFits(t, leader)`: an untyped leader takes any gym trainer, a typed one needs at least one shared type. Each gym trainer fields their own class's types.
  - **Types (0.3.0):** a post's type is its holder's class. `specTypes(t)` gives 0, 1 or 2 types; `typeLabel(t)` puts them in words ('Rock/Flying', 'mixed'). Nothing forces a type on a trainer who takes a post any more, and a dual-type leader keeps `spec2`. `gymWeatherType(leader)` is the first of the leader's types that brings weather; `gymTry` passes it to `setBattle` so gym trainers fight in it too.
  - **The staff team builder (0.3.0, `3-engine-1.js`):** `staffPicks(t, L, n, { lines, team, mixed })` replaces `buildEliteTeam`. `staffPool` lists on-type species under a Scouting ceiling (`SCOUT_BST`) and keeps the strongest `scoutShare(t)` of them; picks are scored by `fitScore` (base stats, stacked weaknesses, answers to the types that beat the trainer's type) with noise from low Strategy (`STRAT_NOISE`); `staffMon` sets IVs from Training (`TRAIN_IV`) and, as often as `trainCare(t)`, a fitting nature and the coverage that answers the Pokémon's own weaknesses. A trainer with 50s builds about what the old builder did. `eliteItems` gives a gym's staff one more held item at Strategy 75+, one fewer under 45. `relevelElite` still sets levels, which don't count in a set-level battle.
  - **Switched off in 0.3.0:** `AUTO_STAFF_MOVES` (false) gates the source's performance moves (a leader replaced after three poor seasons, a leader's comeback to the circuit, a challenger taking an Elite Four seat after a deep run). The meta report still runs, but staff no longer add counters for it. Filling a vacancy (a challenger or an outsider takes a gym; the strongest Elite Four member moves up) still happens.
  - **Titles:** `leagueFinals()` gives each qualifier one run. A challenger who beats the Champion gets a title and stays a challenger; `S.league.conceded` lists them and `S.league.report` holds the season's wall report. Each `S.history` entry carries `titles`, `badges`, `best` (0 to 8 badges, 9 to 12 Elite Four members beaten, 13 the title; `depthName()` puts it in words), `bestId`, `out`, `field` and `winners`. A season is perfect when `titles` is 0.
  - The Champion leaves only by retiring with age, in `leagueOffseason()`; the strongest Elite Four member moves up.
- **Randomness:** every draw goes through `rand()`. `seedRandom(n)` makes a run repeatable; `seedRandom()` goes back to `Math.random`. The game itself is never seeded.
- **Staff tiers (tests only):** `newWorld({ staffBoost: N })` makes every staff member the game creates N rating points better or worse (`staffQ`), and stops challengers walking into posts (`fixedStaff()`), so a run stays in its tier.
- `BATTLE_RULE` in the battle engine still supports special rules (inverse, scalemons, flipped, noitems, trickroom) but nothing sets it. `battle()` takes `opts.equal` for same-level battles.

## Start of every chat
1. Clone the repo (or `git pull` if it's already cloned).
2. `python3 game/build.py game dist`. Note the version it prints: that's the current version.
3. Read the design doc in the Project and `TODO.md`.

## Making changes
- Edit the pieces in `game/`, never the built HTML.
- New Pokémon, moves and abilities go in `game/2-pokemon-data.js`.
- One chat = one new version: add one entry at the top of `UPDATES` in `game/8-ui-3.js` with the next whole-number `id`, the next `ver` (`0.1.0`, `0.2.0`…: the build names its files from it), the date, and an Eastern Time timestamp. All changes in the chat go into that one entry, written for players.
- The changelog starts at 0.1.0. Don't copy Pokémon League GM's history into it.

## Testing (before every push)
Run all of these after `python3 game/build.py game dist`. Each must pass.
- `node tests/sim.js <leagues> <growth 0/1> <seasons> <god 0/1>` sims seasons week by week and checks the world after every step: posts filled, every gym in a city of its League's region, one circuit per challenger, no state from the cut systems, and a save that reloads and keeps running. It also checks the wall rules (team sizes, two gym trainers of the leader's type at every gym, tries and the out flag, challengers' teams at the set level). It prints `ok` and the balance numbers (qualifiers, perfect seasons and badges conceded a season). Run at least `1 0 12 0`, `1 1 30 1` and `3 1 12 1`.
- `python3 tests/browser.py "$PWD/dist/Pokémon League Builder.html"` plays three seasons through the real page in a headless browser, opening every view in every phase, and reloads from the save. Run it on `dist/itch/index.html` too. It must end with `FAILS 0 ERRORS 0`.
- `node tests/report.js [seasons] [worlds] [--seed=N] [--boost=N] [--tiers]` is the wall report (not a pass/fail test): perfect seasons in 100, titles and badges conceded a season, how far the best challenger got, and how often each gym turned a try back. It is seeded (seed 1 by default), so the same command prints the same numbers. `--tiers` prints one line each for strong (+15), average (0) and poor (-15) staff. Seasons in one world share its staff, so for a steady number use more worlds rather than more seasons. Run `node tests/report.js 100 4` and `node tests/report.js 25 12 --tiers` after any change to the wall rules or balance and put the numbers in the design doc.
- `python3 tests/unused.py` lists functions and click handlers nothing can reach. It should report `dead 0 lines 0`.
- `tests/lint.sh` runs ESLint over the joined source for names that are used but never defined. It should print only the browser globals it doesn't know (`indexedDB`, `sessionStorage`) and a few unused locals.

Balance at 0.3.0, not tuned (1 League, seed 1). `node tests/report.js 100 4`: 92.5 perfect seasons in 100, 0.08 titles and 23.4 badges conceded a season, 0.40 of 24 challengers finish the circuit, 23.6 go out on three losses. `node tests/report.js 25 12 --tiers`: strong staff (+15) 98.3 perfect seasons in 100, average (0) 81.7, poor (-15) 35.7. The target is about 10 for a well-built League, so the wall is far too strong; tuning comes after the continuous world. (0.2.0 for comparison: 54.5 to 62 perfect seasons in 100, unseeded.)

## End of every chat
1. `git pull` first. If someone pushed a newer version in the meantime, merge their changes in and give this chat's work the next version number; never overwrite theirs.
2. Rebuild and run every test.
3. Commit `game/`, `tests/` and the docs with a message naming the version (e.g. `v0.2.0: badge-level gym battles`), and push to `main`.
4. Update `claude/game-design.md` in the Project with what was decided and what was built, and say what the next chat should cover.
5. Send the game HTML and the itch.io zip only if the owner asked for them.
