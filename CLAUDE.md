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
- **Next: stage 1a**, the wall rules in the sim (see the design doc, section 8).

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
- `S` is the whole save. `SAVE_VERSION` (in `3-engine-1.js`) is 1; the save key is `plb-save`. Every storage key starts with `plb-` or `pokemon-league-builder-`. This game never reads a Pokémon League GM save.
- **Phases:** `season` (24 weeks, `simWeek()`), `league` (`runLeague()`), `offseason` (`nextSeason()` brings in newcomers, settles League moves and the ban vote, and starts the next season). `autoStep()` does whatever the phase needs; `simOneSeason()` plays a whole one.
- **Leagues:** the bound League's state sits directly on `S` (`S.gyms`, `S.e4`, `S.champion`, `S.challengers`…); the others wait in `S.leagues`. Use `inLeague(i, fn)` / `eachLeague(fn)`; `LEAGUE_FIELDS` lists what belongs to a League. Each League has a `region` (an index into `LEAGUE_SETS`).
- **Cities are world objects**, not part of a League: `S.cities[id] = { id, name, region }`, made by `regionCities(region)` the first time a League is founded in a region. A gym sits in a city: `gym.city` is the city's id. `gymCity(i)` and `townName(i)` give the bound League's gym `i`. Two Leagues founded in the same region share the same city objects.
- **Trainers:** `S.trainers[id]`, with `role` one of `challenger`, `leader`, `e4`, `champion`, `exchamp`, `free`, `prospect`, `retired`. There are no teams: a challenger is on one League's circuit (`S.challengers`), at most `CIRCUIT_SIZE` (24) per League.
- **Newcomers** (`5-engine-3.js`): each offseason `NEWCOMERS_PER_LEAGUE` new trainers set out; they and the free agents take open places on a circuit, or the place of its weakest challenger if they rate higher (`circuitValue`).
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
- `node tests/sim.js <leagues> <growth 0/1> <seasons> <god 0/1>` sims seasons week by week and checks the world after every step: posts filled, every gym in a city of its League's region, one circuit per challenger, no state from the cut systems, and a save that reloads and keeps running. It prints `ok` and the balance numbers (qualifiers a season, how often the title changes). Run at least `1 0 12 0`, `1 1 30 1` and `3 1 12 1`.
- `python3 tests/browser.py "$PWD/dist/Pokémon League Builder.html"` plays three seasons through the real page in a headless browser, opening every view in every phase, and reloads from the save. Run it on `dist/itch/index.html` too. It must end with `FAILS 0 ERRORS 0`.
- `python3 tests/unused.py` lists functions and click handlers nothing can reach. It should print nothing.
- `tests/lint.sh` runs ESLint over the joined source for names that are used but never defined. It should print only the browser globals it doesn't know (`indexedDB`, `sessionStorage`) and a few unused locals.

Balance at 0.1.0, before any tuning (1 League, 12 seasons): about 8 challengers finish the circuit and the title changes in about 4 seasons in 10. The design target is a perfect season about 1 in 10 for a well-built League; re-check after any change to growth, levels or the circuit.

## End of every chat
1. `git pull` first. If someone pushed a newer version in the meantime, merge their changes in and give this chat's work the next version number; never overwrite theirs.
2. Rebuild and run every test.
3. Commit `game/`, `tests/` and the docs with a message naming the version (e.g. `v0.2.0: badge-level gym battles`), and push to `main`.
4. Update `claude/game-design.md` in the Project with what was decided and what was built, and say what the next chat should cover.
5. Send the game HTML and the itch.io zip only if the owner asked for them.
