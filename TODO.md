# Pokémon League Builder: to-do list

Things left over from the seed, and ideas tabled for later. Remove an item once it is done.

## Broken tests
- **(0.72.0) The hand-placed sim's `a prize counter past its quarter`** fails now and then (seen on an unchanged 0.71.0 build too): a counter goes 20 to 30 weeks without restocking while the League is solvent at the week's check. Likely the League is in the red when the week's money runs (the Corner is closed) and the sim's own steps top its money up before the check. The check now has a week's slack and prints the counter's state.
- **(0.61.0) Very old trainers:** nothing makes a trainer retire by a set age. A staff member steps down only after 10 years in posts and past their career length, so Opal (famous, starts at 88) or an old custom trainer can serve past 100 (that crashed the growth table until 0.61.0). Ask the owner whether there should be an age cap or a stronger push to step down from about 75.
- **The browser test's year-2 staffing step fails (found Nov 24 at 0.58.0, also on an unchanged 0.57.0 build):** `nobody to pick at once`, `vacancies left open: 2`, `posts not filled properly`, or `posts left open after the move`, varying by run. Find which change caused it (0.57.0's famous share or the talks changes are suspects), fix the game or the test, and remove this item.

## City buildings part 1 (0.63.0)
- **Every number is a first guess:** size thresholds, city income and visitor spending by size, crowds (`CROWD_AT`), ticket prices, hype, Hotel rooms and rates, `VISIT_PARTY` 3, Center draw and rest cut, Berry Farm yields, the seat Stadium's free level 2 (+3% edge at the seat from founding, multiplied with the claim edge ×1.05; not settled), the Cup gates the seat Stadium was to absorb (still separate).
- **The economy needs the retune** planned since 0.41.0: tickets alone are now a big share of every League's income, money-makers (Hotels, Berry Farms) pull far ahead and then turn wall or star (AIM_RICH), and the passive player ends rich. Run `econ.js` and decide targets with the owner.
- **Visitors are few** (about 3 to 5 a week in a gym city), so Hotels pay through `VISIT_PARTY`; part 3's Airport and out-of-region arrivals are meant to add more.
- **The multi-year sim managing your League** doesn't set your Berry Farm plots (it leaves your settings alone).
- **The Shrine, the Poffin Kitchen (Berry Farm level 3), landmarks and shared buildings** are still to design; the Sanctuary is unchanged.

## The Game Corner (0.70.0)
- **Every number is a first guess:** seats, residents and spend by size, the swing (±30%, a jackpot ×3 about 1 in 12, a losing week of half an average about 1 in 50), prize slots, the 1.25 markup, the rarest quarter of the region's lines as the pool, prizes at grade 2+. Measured once at about 900 a week a Corner in a hand-placed run.
- **Open (design doc):** whether a jackpot week also brings turnout or prestige; a "suggested" tag for prizes that fill your steer gaps; a yearly cap on rivals' prize buys.

## The Bank and the Fan Club (0.71.0)
- **Every number is a first guess:** Bank costs, grace 4/8/12 weeks, the 12-week refill, credit 20/30/40% of buildings, rates 8% to 4% by wealth rank, 48/96-week terms, seizure after 4 missed weeks at 30%; rivals' loan sizes (clear the red plus four weeks' wages; a money-maker's growth loan a quarter of the time). Fan Club caps 2,000/5,000/12,000 × (1 + 0.25 a city size), the monthly record gain (4,000 × held above the region's average), heroes (leader 150, gym trainer 50, Elite Four 100, Champion 150 a month), the 30-a-level trickle (not in the design: added so an average gym's club grows), standing 1 per 1,000 members, Stadium fill up to 10%, poach shares.
- **Rival loans in the red are often missed** (in a 7-League 12-year sim: 7 loans, 27 missed payments, 3 levels seized): a rival borrows over 96 weeks in the red and then can't pay while still in debt. Check with the economy retune whether rivals should borrow smaller or only once the books turn.
- **Not measured:** whether the grace speeds crash recovery (`econ.js` doesn't build Banks for L1 on purpose); whether Fan Clubs make control change hands more often.
- **Upkeep is still paid during the grace** (the buildings work, so they cost), which deepens the debt a little; the design didn't say either way.

## Build times and the utility buildings (0.72.0)
- **Every number is a first guess:** build weeks 2/4/8/12 (add-ons 2, restores half), the Power Plant's 15/25/35% and prices, the Wind Farm's 4% a turbine, 1 calm week in 8 and prices, the 50% cap, the Yard's 20–65% time, 26–17% restore and 15–60% slower decay and prices, the Quarry's 10/20/30% and prices, the 3-turn tailwind.
- **The upkeep cuts are small at 5% upkeep a year:** a level 1 Power Plant saves 0.75% of its city's buildings a year, so its 25,000 pays back in about 17 years in a city with 200,000 built. Rivals (payback 3 years) almost never build Plants or Wind Farms (none in `3 1 12 1`). Decide with the owner: cheaper prices, bigger cuts, or a longer payback for rivals.
- **Rivals rarely build the Quarry** (needs ruins or 2+ free slots) and the Yard only after the red or as money-makers (one in `3 1 12 1`).
- **Builds under way don't count in wealth** (`estateCost`, the League table, `econ.js`) until they finish; the money is simply gone for those weeks.
- **The Construction Yard keeps working in the red** (the design said "among the last to lapse"; every building lapses at once, so it was built as working through the red and lost just before the Bank).
- **Not measured:** build times' effect on the economy and the crash recovery; the tailwind and the level 3 fields in real battles (no League reached them in the sims; checked on levels put in place by the hand-placed sim and in a scratch battle).
- **The Dam (Water)** was tabled by the owner until more types have buildings.

## City buildings part 3 (0.65.0)
- **Every number is a first guess:** Airport costs, fee, landing income, visitors a route and the renown boost, the movers' pull (`AIR_GAIN`, `AIR_DRAW`); Contest prize grades, gate and crowd; Pier and Fossil Lab prices and cadence; fossil weights; rivals' keep grades.
- **Rivals rarely build the new four** in 8 to 12 year sims (Airports need a City, Piers a port, a Water gym or a Fisherman, Fossil Labs a level 2 Lab); look again with the economy retune.
- **Not built:** an Airport's yearly renown in its routed regions (an open idea); rivals choosing Airport routes (they keep the default neighbours); the Lake of Rage and National Park landmarks (landmarks round); custom fossil species for custom regions.

## Left over from the seed (0.1.0)
- **Unused styles.** `game/1-page.html` still has the CSS for the screens that were cut (office, party, draft, ranch, trade desk, tournament, villain banner, team marks). It does no harm; prune it when the new screens are built and it is clear what they reuse.
- **Traits and temperaments that lost their effect.** The Mentor and Hero traits were removed (they acted on teammates and villains). The Naive, Quiet and Docile natures have no temperament now (theirs were about trades and the ranch), and Lonely, Adamant, Relaxed and Naughty lost half of theirs. To revisit when staff and gym trainers exist.
- **Battle rules.** `BATTLE_RULE` still works in the battle engine but nothing sets it. Could serve gym features later.
- **Custom trainer packs** made for Pokémon League GM import as before, but a pack trainer whose trait is Mentor or Hero gets a random trait.

## Left over from the wall rules (0.2.0)
- **Retuned in 0.14.0 (Nov 14):** the wall was far too strong (passive player 0.92 let through a year, strong fixed staff 2.60). The owner's target is passive 5 to 6 and strong 3 to 4; no lever tried reaches both (the passive player's staff drift back to OVR 72 to 75, because the multi-year sim always hires the best and approves every challenge), so the nearest was built: `BUILD_PAR` 105 and the circuit's best kept on the circuit (design doc 3.5 has the numbers). **Money doesn't weaken anyone yet:** being in the red only blocks spending (salaries ×1.5 left the wall unchanged with the League millions in the red). Revisit with rival Leagues (stage 4), which will compete for the same challengers. **Tuned in 0.5.0 with `BUILD_PAR`** (design doc 3.5). The four agreed dials (`START_TEAM`, squad picking, gym trainers, tries per gym) stay where they were; they barely move the wall. Retune `BUILD_PAR` if later changes (staffing by hand, hiring, money) shift the balance.
- **Staff moves.** Since 0.9.0 rival Leagues replace poor staff (`replacePoorStaff`); since 0.10.0 the comeback is the another-run ambition. Since 0.11.0 a deep run can win an Elite Four seat in a seat challenge. Still switched off (`AUTO_STAFF_MOVES`): only the dead poor-leader branch in the New Year gym loop; remove it and the switch when that loop is next touched.
- **Untyped leaders are rare and have no counterweight.** Outsiders appointed to gyms are always typed; only a promoted untyped challenger leads a mixed gym. Whether specialists should get anything in return was left for later (the owner chose nothing for now).
- **Team builder dials** (`SCOUT_BST`, `scoutShare`, `STRAT_NOISE`, `TRAIN_IV`, `trainCare`) were set by eye in 0.3.0; since 0.5.0 they read ratings through `bld()`, offset by `BUILD_PAR`. How wide the gap between strong and poor staff should be has not been looked at.
- **Everstone** now simply holds a Pokémon in its current form at every level.
- **Legendary encounters** still set the legendary's level from the challengers' levels, which are now their next gym's level. It works, but was not looked at closely.
- **Interim Champion** boards and profile lines are still in the interface but nothing creates an Interim Champion any more. Remove them when the records pages are next touched.
- **The banlist vote** doesn't include gym trainers.

## Left over from the continuous world (0.4.0)
- **Internal names still say season.** `S.season` is the year, and `seasonHist`, `titleSeasons`, `t.seasons`, `seasonAwards`, `legendOffseason`, `BAN_MAX_SEASONS` and friends all count years. Renaming them is safe but touches hundreds of lines; do it when a chat has room.
- **The field is older and larger since 0.5.0** (give-up after three years, at 0.2): about 50 to 75 a League. The sim check's alarm moved from 80 to 120, then to 160 in 0.7.0 (several-League worlds peaked at 122 to 147, 0.6.0 included; unmeasured, see open item 17). Watch save size and speed with several Leagues.
- **Battles kept to watch:** the last eight title battles of a year, and (0.7.0) each of the player's gyms' last three badges conceded. Gym trainer battles, tries turned back and Elite Four battles are not kept (the owner chose badges conceded only; a battle is about 5.7 KB and a League fights about 1,000 gym battles a year).
- **The wild cap** in `wildOffers` and the item tier in `exploreFind` grow with weeks into a run. Tested in 0.5.0: raising or removing the cap does not change how strong a challenger's team is at the Elite Four (they catch strong lines in base form early), so it is not a tuning lever.
- **Speed and save size.** A year takes about a second to sim since 0.5.0 (48 weeks, 150 to 200 runs). A four-League world was about 10 MB after 25 years; the browser's own storage holds about 5 MB before the game falls back to its larger store. Worth measuring before rival Leagues (stage 4).
- **Unused styles** for the old phase buttons can go with the other pruning.

## Left over from the ranch core (0.25.0)
- **All the numbers are provisional** (item 43): capacities, upkeep, values and grade multipliers, the grade odds, trip costs, lengths and odds, the area trip, the market's size and life, the sale share and sell-back, the starting stock (about 45 to 55 at founding, sized to fill every post beside its holder's own starter-sized team, larger than the 20 to 25 the design guessed), and the AI's spending shares.
- **Not measured:** the wall and the economy with the ranch (lighter testing). In single-League sims an AI League alone in its world built a strong wall (77% perfect years over 12 years in one run, seed-dependent); the passive player buys nothing and lives on its stock and staff exchanges. Run `report.js --hand` and `econ.js` when the owner wants balance.
- **Stopgaps** are free weak stand-ins so a post always fields a full team; the design said nothing comes free. They are only used when nothing in the ranch fits.
- **A demoted senior member (to gym trainer) counts as leaving the ranch:** they keep the ranch Pokémon they held.
- **Other places that still hand out Pokémon outside the ranch:** a Gym Leader's temporary top-up for a seat challenge draws on the ranch but an acting Elite Four stand-in and acting leaders keep the old builder; legendary departures refill through `staffPicks` (so from the ranch); the `keep` steer no longer conjures signature Pokémon for senior staff (it only favours their lines).
- **The AI doesn't use reserves or locks.** Since 0.26.0 it lists and sells back spares it won't keep (`ranchSpares`, `AI_IDLE`).
- **Ranch Pokémon aren't counted in wealth** (the economy report counts cash and buildings); a ranch is a sink.
- **Part 3** built in 0.37.0 (storage, picking at hire, the Sanctuary rework). Breeding waits for its own design round (the owner, Nov 18).

## Left over from regional encounters (0.27.0)
- **All the numbers are provisional** (item 41): `REGION_SIZE` 250 (350 before 0.28.0), `REGION_FLOOR` 5 at `FLOOR_BST` 450, the neighbour ring, migration odds, length and size, the far share, lane and route prices and the weekly fee, charter cost and size, safari sizes, refresh and grade bonus, `FOREIGN_MAX` 3, `STEER_GAP` 0.5. Which port cities count is a judgment call (`PORTS`).
- **The lists are algorithmic,** not the real regional dexes: each generation to its own region (regional forms to their region too), then borrowing for the type floor and to reach `REGION_SIZE`. Borrowing spreads some starters widely (Rowlet is in five regions). Hand-tuning by theme is still open.
- **Delta forms** stay with their base species' regions; the owner may want Deltas found elsewhere as flavour (open).
- **Not measured:** the wall and the economy under regional rules (lighter testing). Thinner home pools may mean more stopgaps early; worth a look when balance comes back.
- **Obedience by region** left as is (owner, Nov 17).
- **Steer gaps** are shown, not acted on; rivals don't read them.

## Left over from nine regions (0.28.0)
- **The League cap stays at 6 (2 a region)** with nine regions, for speed and save size; reconsider once the game is played with more regions.
- **Place names are judgment calls:** each new region's three towns, its two seats (Unova: Dragonspiral Tower, Giant Chasm; Kalos: Battle Château, Terminus Cave; Alola: Mount Lanakila, Battle Tree; Galar: Wyndon, Crown Tundra; Paldea: Mesagoza, Great Crater), the neighbour map and the new ports and railways.
- **Alola's flavour is only names:** its gyms are the island challenge's stops, its Gym Leaders show as Kahunas and its gym trainers as Trial Captains (`postName`); everywhere else says Gym Leader. The League itself works like every other (the owner asked for the same size).
- **Paradox Pokémon and Area Zero** are not tied to Paldea (Koraidon, Miraidon and Terapagos are Paldea's legendaries, so Area Zero opens there more often).
- **Not measured:** the wall and the economy with 250-species regions.

## Left over from custom regions (0.31.0)
- **All the numbers are provisional** (item 44): the warning band 180 to 330 species, the generator's power bands (gentle ≤ 540 and nothing rare; standard at most 3 lines reaching 600; strong weighted by strength cubed), two built-in neighbours for a new region with none chosen.
- **Baby legendaries in the waiting pool (found in 0.31.0, not fixed):** two Cosmog were seen waiting in `S.wPool` at once in a `1 1 20 1` sim (a former partner can be handed a fresh baby legendary while the old one waits). Nothing holds both, and the sim's pool check skips babies, as it always did.
- **Shared legendaries** (owner, Nov 17): a custom region's claimed legendaries stay home in their built-in region too, and the world holds one for each region that has it at home (`legendCap`). Baby legendary lines count by their own species' homes. Provisional: whether a region should be able to take a legendary instead of sharing it.
- **A region's own legendary encounters** (owner, Nov 17) use My Pokédex's bar (`DEX_LEGEND_BST` 650) and odds (`DEX_LEGEND_CHANCE` 0.001 a week) × the home multiplier (3 at home, 0.5 away, 0 away when locked). They can't be picked as another region's legendary in the editor (the list is the built-in legendaries).
- **Neighbours are built-in regions only.** Two custom regions can't neighbour each other (design: the creator picks from the built-in nine). A whole replacement's neighbours are listed by built-in name, so naming the replaced region's own slot points at the replacement.
- **Locked Pokémon can still change hands between Leagues** through ranch sales (listings); the lock covers the wild, migration, lanes, the safari, charters and challengers moving region.
- **The size estimate on setup counts Leagues only,** not regions or list sizes (a world's speed barely depends on them).
- **Strict borders** (only the regions in play's Pokémon) and **a shared library in the game** stay open (the owner: later, far later).
- **Not measured:** the wall or the economy in a world with custom regions (lighter testing).

## Left over from gyms in any order (0.32.0)
- **The wall is much weaker.** Passive player (`report.js 15 4 --hand`, seed 1): 23.97 let through a year against 1.85 at 0.31.0; 4.05 badges a run against 0.45; every gym holds 59–66% of tries (was 93% at gym 1 down to 28% at gym 7). Not tuned by the owner's choice (targets after playing). Levers: `BUILD_PAR`, `ROUTE_NOISE` (sharper routing helps challengers), `ROUTE_MEM`, `GYM_TRIES`, the badge ladder, `START_TEAM`.
- **Provisional:** the stage bands (0–2, 3–5, 6–7), `ROUTE_MEM` 0.5, `ROUTE_TRY` 0.2, `ROUTE_NOISE` 1.6.
- **Staff build for the top stage only.** A gym's team is built at level 77 and devolves for early challengers; a builder that weighs how a line does at early levels too might suit gyms that mostly see beginners. `adaptGym` swaps against what beats the gym at any stage.
- **Rival Leagues' poor-gym rule** (`replacePoorStaff`, held under 30% of 12+ tries) and Gym Leader of the Year read the whole gym record; with every gym seeing every stage that's fairer than before, but not checked.

## Left over from post names and themes (0.42.0)
- **Most explanatory text still says Gym Leader, Elite Four and Champion** (help paragraphs, glossary entries, the challenge notices, the year report's notes): the game's terms. Names, headings, labels on the main pages, the year report's seat rows, Hall cards and a few news lines use each League's own words. Widen if the owner wants it.
- **The year's history entry keeps the year-end words** (a mid-year rename shows the new words for that year).
- **Provisional:** the theme list and its names, the aim and region leanings (`AIM_THEMES`, `REGION_THEMES`, `THEME_LEAN` 2.5), `REBRAND_ODDS` 0.5, the news phrasings. Island trials' Elite Four is "Island Elders" (the design doc's sketch had Captain / Trial Hand, changed to match Alola's own Kahuna and Trial Captain).

## Carried over from Pokémon League GM's list
- **Doubles battles.** `battle()` assumes one active Pokémon per side. See the source repo's `TODO.md` for the work involved.

## Left over from founding by hand (0.6.0)
- **Balance not measured.** The founding field is larger (36), unplaced founding candidates (strong trainers) join the circuit, gym trainers come from the circuit's best, and staff rarely leave now. None of it has been through the wall report (the owner: balance waits). The report founds Leagues automatically; a hand-placed line was offered and declined for now.
- **An acting leader fights under their own type.** They share at least one type with the leader who left, but a dual-type gym can narrow to one type, and the remaining gym trainer may share no type with the acting leader while acting.
- **Vacancy outsiders are role `prospect`** until the post is filled (then the unpicked join the circuit). A save with an open vacancy carries them.
- **The founding screen shows ratings, not teams.** A candidate's Pokémon are rebuilt for the post anyway; the profile card can't open during founding.
- **The multi-year sim fills your vacancies for you** (best candidate) because nobody is there to choose.

## Left over from the staffing screen (0.7.0)
- **The Champion can't be replaced by hand** (confirmed in 2c). Since 0.11.0 the seat changes through seat challenges from the League's own Elite Four; Elite Four members of other Leagues challenging wait for stage 4.
- **A grudge does little yet.** Since 0.10.0 staff leaving over an ignored ambition hold one too, and with another League open half of them go to its circuit (where it can hire them). It only lowers the odds of accepting your offer; challengers holding a grudge don't fight your League any harder. `t.grudge` records the year.
- **No cost or limit on staffing moves** before money exists (owner, Nov 13).
- **Swapping teams.** A swap or move rebuilds the trainer's team with `installElite` (keeps up to two on-type Pokémon at a gym; an Elite Four newcomer keeps a team of three or more and is topped up to six), so a Gym Leader moving up to the Elite Four keeps their gym team.
- **Saves from 0.6.0 mid-gym:** a challenger part-way through a gym when the save was made starts that gym's line again once (they have no `gymLine` yet). Harmless.

## Left over from the year report (0.8.0)
- **Replays in the report** (owner, Nov 13: not a concern yet, revisit once the game is playable and situations can be compared). A gym row links only the badges conceded its gym still keeps (`GYM_WATCH` 3, rolling, League 0 only), so older years usually show none; title battles show for the latest year only.
- **Latest year only:** world changes, development and the World Championship panel are shown only for the year just ended (they are not kept per year).
- **History grows with the years.** Each year's history entry now carries the report's detail (a few KB a year per League). Watch save size in long worlds with several Leagues.
- **Comparisons with other Leagues** wait for rival Leagues (stage 4): the report compares a year only with the same League's last year, best year and average.
- **Best challengers who moved League mid-year** are not in the top ten of the League they left.

## Left over from hiring and turnover (0.9.0)
- **All the numbers are provisional:** the refusal odds (`acceptsOffer`), `HIRE_NOTICE` 8, `REFUSED_WEEKS` 24, the retiree limits (3 years, under 55, OVR 55+), `GYM_HIRE_MIN` 48 (58 until 0.23.0), `E4_HIRE_MIN` 64, `E4_HIRE_EDGE` 5, `POOR_YEARS` 3 and the 30% poor-year line. Balance is unmeasured: rival Leagues now hire their circuit's best every time and replace poor staff.
- **Rival Leagues' refusals aren't remembered:** a challenger who turns a rival League down can be asked again at once; only the player's refusals start the half-year wait.
- **Retirees don't age or change while retired;** their age catches up when they return, their ratings don't.
- **"Impressed" reads the trainer's own year tally,** which can include runs at another League if they moved mid-year.

## Left over from ambitions (0.10.0)
- **All the numbers are provisional:** the ambition weights (`pickAmbition`), `AMB_WAIT_YEARS` 3, restless from 2, `QUIT_NOTICE` 12, `RUN_HOLD` a year, `COMEBACK_STREAK` 5 (1 in 3 a birthday), `AMB_DRIFT` 0.12, `GRUDGE_AWAY` 0.5, `BACKOUT_CHANCE` 0.5, `PROMOTE_EDGE` 5, the career ranges by starting age, `CAREER_MERIT` 3, `CAREER_SERVICE` 2 and the new step-down odds. Balance is unmeasured: rival Leagues now turn staff over much more (promotion within, quits after three years), and staff of every League leave over ambitions.
- **Any new post re-picks the ambition,** with a fresh clock: a demotion or sideways move the trainer accepted resets their wait too, and an acting leader's ambition is re-picked when they act and again when they go back.
- **Challengers still retire for age only from 50,** whatever their career length; career length by factors mainly changes when staff step down (it keeps an older field, the owner's earlier choice).
- **Fill it for me never promotes your staff** (as since 0.7.0); only the multi-year sim answers ambitions for you.
- **Fixed in 0.10.0, found by the longer vacancies:** an acting Gym Leader was topped up to a full leader's team after a ban or a legendary leaving (`eliteSlot` gave them the leader's size), and kept it when going back to gym trainer (a 0.6.0 bug). Also fixed: `retireHere` left a protected gym trainer (one guaranteed years on the circuit after another run) in limbo. **Explained and fixed in 0.11.0:** a rival gym trainer fielding one Pokémon too many (seen once in 0.10.0 and again in 0.11.0's `3 1 12 1`) was a legendary joining them (`joinLegend`, `giveWildLegend`: an award gift, a storm, the Missingno glitch), which only made room once a team had six; they now make room at the post's size (`teamCap`).
- **Ambitions don't show in the year report** or the news filter; only on Your staff, the hiring pages, the profile and the staff notices.

## Left over from seat challenges (0.11.0)
- **All the numbers are provisional:** one challenge of each kind a League a year, `CHAL_WAIT` 2, `CHAL_ANSWER` 4 weeks, `CHAL_EDGE` 2, `CHAL_OLD` 50, `CHAL_SEAT_YEARS` 2, `SEAT_LOGS` 6, the restless year, and the targets (the strongest eligible goes; the weakest seat by record, then OVR for age). Balance is unmeasured: the sims show about one to one and a half challenges a League a year (of at most two), roughly half won, so Champions and Elite Four seats turn over much more than before.
- **A pending challenge is fought when you approve it,** mid-week, not at New Year; one left alone goes ahead after four weeks. A challenge whose people moved first lapses.
- **Only Elite Four members challenge the Champion,** and only for the Champion's seat (not the seat above). Gym Leaders and deep runs target the weakest seat. Retirees never challenge. Other Leagues' Elite Four members wait for stage 4.
- **Approval is per challenge.** A standing League rule (challenges on or off, who may challenge) was offered and not chosen.
- **A Gym Leader who wins a seat keeps the team they challenged with** (topped up to six); the beaten Elite Four member taking their gym builds a gym team as on any move.
- **The year's title winner hired mid-year** now stays in the year report's top ten (fixed in 0.11.0; it could fail the sim's top-ten check since 0.9.0).

## Left over from steers and the meta (0.12.0)
- **All the numbers are provisional:** the steer weights in `steerScore` (×8 for bulk and power, the cover and counter weights), `steerFollow` ((Strategy − 30)/50, 0.2 to 1), `STEER_EDGE` 0.25, `KEEP_CORE` 4, `META_MONTHS` 3 (the trend), `META_LOG` 24, `META_MIN_B` 8, `TREND_SHIFT` 3 (plus a new top counter type), the signature bonus (2 × follow) and the off-type pool (6, under the Scouting ceiling + 40). Balance is unmeasured: steered and countering staff teams change the wall, and rival Leagues counter by rule.
- **The trend-shift stop** comes about three to four times a year in the hand-placed sim. Watch whether that's too often once the game is playable.
- **The ranch rework (the owner, Nov 14):** the ranch is to come back, reworked entirely, as a League's own pool of Pokémon, in a different way from Pokémon League GM. It bears on steers (what staff pick from). Not designed yet; no stage assigned.
- **Steers act only on team building.** Battle style (lead order) stays `acelast` for all staff; a battle steer was offered and not chosen.
- **Rival Leagues' steers are a simple rule** (counter when their type answers, else Balanced). Each League's own aim (5.5) waits for stage 4.
- **Only the meta readings are monthly;** the year's meta report at New Year (`metaMons`) still drives newcomers' counter types (the owner chose to keep that), the History column and the ban ballot's year.
- **Off-type Pokémon go when the steer stops countering,** one a month; a Gym Leader who moves keeps none (they are left behind like any off-type Pokémon).

## Left over from the balance retune (0.14.0)
- **All the numbers are provisional:** `BUILD_PAR` 105, `GT_CIRCUIT_CUT` 0.5 (gym trainers from the circuit's lower half), `IMPRESS_REFUSE` 0.6, circuit seat challenges only against a holder of 50+.
- **The passive player can't reach the owner's 5 to 6:** it walls better than fixed strong staff at every `BUILD_PAR` tried (115 gave passive about 3.4 and strong 6.6). Its staff stay strong because the multi-year sim fills every vacancy with the best candidate and approves every challenge. A budget for Fill the rest (founding) and for the sim's fills was tried and barely helped (staff drift back up). Untried: weaker gym trainers from the circuit (the lower quarter), the sim refusing some challenges, debt with consequences.
- **The field is larger** with fewer challengers taken onto staff: the hand-placed sim peaked at 142 (alarm 160). Watch it, especially with several Leagues.
- **Automatic gym trainer fills can now be refused,** so more places go to retirees and made-up trainers when the lower half has nobody willing who fits.

## Left over from money and cities (0.13.0)
- **All the numbers are provisional:** `START_FUND` 200,000, `ENTRY_FEE` 600, `WALL_PRIZE` 150,000 less 20,000 a title, `PAY_BASE` and the (OVR/60)² curve, `PAY_FAMOUS` 1.25, `PAY_TITLE` 1.15, `SIGN_WEEKS`, `SEVER_WEEKS` and `RAISE_WEEKS` 12, `RAISE_MUL` 1.2, `BIDS` and `BID_ODDS` 0.12, `BAN_PRICE` 15,000 (×3 to ×1), `BAN_PAID_MAX` 3, `BAN_PROTECT` 2, `CITY_GROW` 60,000/180,000, `UP_COST` 25,000/50,000/100,000, `MOVE_FEE` 40,000, the upgrade effects (hall +1 a level a birthday up to 95, feature +1.5% a level, attraction 250/550/900 a week (200/400/650 since 0.15.0), scouting +1 outsider, +2 quality and +4% a level).
- **Money doesn't limit hiring yet in practice:** the passive player roughly breaks even (+4,500 a year, 10 of 300 years in the red) and the AI Leagues have no money at all. Whether salaries should bite harder (so stars are a real trade-off) is the balance question for the next chat.
- **Salaries are reviewed only at New Year** (from OVR then); a hire made mid-year keeps their hiring OVR until then.
- **Automatic hires always go through**, even in the red: gym trainer fills, the multi-year sim's vacancies and seat-challenge winners from the circuit pay their signing fee and can deepen the red.
- **Severance is charged whenever `letGo` runs in the player's League,** including a gym trainer let go because the gym changed type, but not for someone who leaves on their own (notice, stepping down, a lost challenge, another run).
- **A moved gym keeps its staff and record**; only the League's buildings in the old city are lost. Its gym number (and level) stays the same. The year report and history still name gyms by their city at the time they are shown, not by the city in that year.
- **The paid banlist reads the meta log (24 months).** A Pokémon needs 8 battles there to be listed. The trainers' vote (and its ballot) no longer runs in the player's League; `buildBanBallot` and the vote still run in rival Leagues.
- **The old Banlist panels** (the ballot card) only show votes; paid bans show in the ban history with their price.
- **The training hall works on birthdays only,** so a new hall takes up to a year to show; staff at 95 in a rating gain nothing there.

## Left over from rival Leagues (0.15.0)
- **All the numbers are provisional:** `AIMS` reserves and build orders, `pickAim` 40/30/30, `AIM_MIN_YEARS` 3, `AIM_RICH` 2.5, `AIM_BAN_ODDS` 0.25, `RED_BITE_WEEKS` 4, `RICH_PAY_MAX` 0.2 and `RICH_PAY_AT` 4, `EASE_MOVE` 0.25, `EASE_EDGE` 0.03, `EASE_OVR` 66, `REGION_CAP` 2, `MAX_LEAGUES` 4, `FOUNDER_RETIRED` 5, `FOUNDER_CHAMP_CHANCE` 0.15, `FOUNDER_CHAMP_YEARS` 10, `FOUNDER_CHAMP_OVR` 70, `STAND_SPEND` 2,000, `STAND_FADE` 0.25, `CITY_INCOME` 250/350/500, `CITY_CTRL_SHARE` 0.5, `POACH_ACCEPT` 0.6, `ALUMNI_KEEP` 10, `ALUMNI_QUIET` 3, `H2H_KEEP` 20.
- **The economy was tuned in 0.16.0** (design doc 5.7): the AI Leagues' poorest holds 0.72 of their average wealth at year 25, the richest 1.29, and a League crashed to 40% of the others recovers in about 5.7 years, but in one world of eight it never does (it stays deep in the red after the relative crash). Rival Leagues now spend down to their reserve on buildings and upkeep instead of hoarding.
- **Offers to other Leagues' circuits** go only to challengers resting between runs (they come at once); one out on a run is not listed.
- **A League's aim is not shown anywhere but the League table and the news.** Rival steers by aim are simple.
- **New Leagues still need the growth option.** Since 0.17.0 founders drive openings (prestige ≥ 60, 8+ years apart), up to 6 Leagues.
- **Cross-League title challenges** come only when a League has no challenger of its own that year; at most one challenge for the Champion's seat a year.
- **Poaching skips staff with a notice, acting holders and founder Champions;** a poached member's new post picks a new ambition. Rival Leagues remember nothing about who poached whom.
- **Speed and saves with four Leagues:** about 10 seconds a simulated year in Node; saves were about 18 MB after 25 years before the trims (re-measure).

## Left over from the economy tuning (0.16.0)
- **All the numbers are provisional:** attractions 120/240/360, `ENTRY_FEE` 700, `WALL_PRIZE_LOSS` 15,000, `UP_COST` levels 4–5 (200,000, 400,000), `UPKEEP` 0.05, the academy's prices (100,000/200,000/400,000), `ACADEMY_PAY` 0.85, `ACADEMY_LOYAL` 0.25, `ACADEMY_Q` 6, `AIM_BID` 150,000/400,000, `AIM_UPGRADE` 300,000, `UPGRADE_EDGE` 6.
- **Losing buildings** (the owner, Nov 15: "interesting"): no League can sell or lose what it built; a crash is only cash. An idea for later, not decided.
- **The academy's prospects** can be sent as contenders since 0.17.0 (they always agree).
- **Upkeep is charged in the red too,** and halls and features never pay it back; a League deep in the red keeps paying it. The relative-crash test's one world that never recovers may be this.
- **The passive player hoards:** it buys nothing, so in a four-League world it ends on about 1.9M cash with no buildings (0.7 of the AI average wealth); alone in a one-League world (`--hand`), 3.2M. Not a target (the owner chose AI-only targets).
- **AI upgrades** replace at most one senior member a year and only with 300,000 spare; the player has no matching button (the player can already bid and let staff go).
- **The economy report** (`tests/econ.js`) now splits worlds over two workers (`--jobs`), measures wealth (money + buildings at cost) and reads the three AI Leagues for the targets; 25 years × 8 worlds take about 17 minutes on two cores.

## Long-term ideas (the owner; design doc item 31)
- **League folding and selling or losing buildings:** built in 0.18.0. Still an idea: losing buildings when a rival takes control of a city.
- **Pokémon finds tied to money, and regional encounters (the owner, Nov 15, 0.18.0 chat):** maybe tie the chance to find rarer Pokémon to money as well, and make encounters more environmental by region. Not designed; no stage.

## Left over from stage 5 (0.17.0)
- **All the numbers are provisional:** `PRESTIGE_BAR` 60 (set so a hands-off player alone in a region reaches it around year 10 to 14, and a strong retiree founds a League from about year 10), `PRESTIGE_FADE` 0.1 and the yearly gains (10 a perfect year, 2 a title under the average up to 10, 10 a World Championship, 1 a city, 6/4/2/1 by wealth), `FOUNDER_ODDS` 0.3, `LEAGUE_MIN_GAP` 8, `MAX_LEAGUES` 6, `SPON_YEARS` 2, `SPON_MAX` 4, `SPON_BASE` 60, `SPON_BOUNTY` 40,000, `SPON_E4_BOUNTY` 5,000, `SPON_ACCEPT` 0.6, `SPON_RENEW_WEEKS` 24, `SPON_AIM` 3/2/1, `SPON_AIM_SPARE` 50,000, `SPON_AIM_ODDS` 0.5, `SPON_AIM_OVR` 60, `LEAVE_FEE` 750,000, `LEAVE_TAKE` 3.
- **Measured in 0.18.0:** contenders barely move the economy (about 0.6 out per AI League, 3 to 8k a year in bounties, neutral on spread and recovery); the economy report now counts them. Not retuned, by the owner's choice.
- **A League's prestige** is earned by the League, not the player: a new League you found starts at 0, and the one you leave keeps its prestige.
- **The Champion can't come with you** when you leave (kept simple); the carried staff are placed at the same gym number or seat when it is free.
- **Contracts the player made stay with the League left** (it carries on paying and may renew them as an AI).
- **A contender out on a run when signed or recalled** goes when the run ends; until then they still count toward the cap.
- **Contenders and the Triple Crown:** a contender who wins a title counts it like anyone (a Triple Crown chaser who is under contract doesn't move League until the contract ends).
- **League folding** (item 31) stays a long-term idea; the higher cap makes room for openings without it.
- **Fixed in 0.17.0:** the League table view was missing from the list of views since 0.15.0, so its menu item led to the circuit; a new Gym Leader could keep a Pokémon that evolved off the gym's type at its level (seen once in the growth sim).

## Left over from the red, selling and folding (0.18.0)
- **All the numbers are provisional:** `FOUNDER_BAR_BASE` 30, `FOUNDER_BAR_STEP` 10, `PRESTIGE_PULL` 0.06, `PRESTIGE_DRAW` 0.3, `SELL_SHARE` 0.5, `DISTRESS_SHARE` 0.3, `DECAY_WEEKS` 24, `FOLD_YEARS` 3, `FOLD_QUIT_AGE` 30, `FOLD_QUIT_EARLY` 2.
- **Recovery from a crash** was 10.0 years at 0.18.0; restoring at 30% (0.19.0) brought it back near the target (see the design doc 5.10).
- **A folded League's records:** its history goes with it; `S.folded` keeps its name, region, years and prestige, and old references name it. Since 0.19.0 its titles count toward the Triple Crown again (from trainers' own `titleLgs`).

## Left over from crash recovery (0.19.0)
- **All the numbers are provisional:** `RESTORE_SHARE` 0.3, `DISTRESS_OFFER_WEEKS` 4.
- **Ruins only from the red:** a level sold while solvent leaves no ruin (selling pays 50%, restoring costs 30%). Going into the red on purpose to sell and restore is still a 20% gain per level, at the cost of being in the red (lapsed buildings, staff notices). Ruins have no time limit and go when the gym leaves the city.
- **Wealth counts a restored level at full cost** (the owner's choice), so restoring adds more wealth than it costs.
- **Distress offers to the player come first:** while an offer is open no AI League buys that level, and the seller is paid only if the player buys. The multi-year sim buys nothing, so its offers lapse. An offer is checked again when bought (the gym may have moved, or the level been built).
- **The region picker after a fold** offers any region with room; the fresh League's cities follow the region, and its name becomes `<Region> Founders League` when the region already has a League.
- **Merging fields:** a folded League's younger challengers move to the emptiest circuit; in the hand-placed sim the single remaining circuit peaked at 142 to 155 (alarm 160). Watch it.
- **Lapsed buildings still count in wealth and in the League table's Built column.**

## Left over from legendaries reworked (0.20.0)
- **All the numbers are provisional:** `OBEY_BADGES` (4/6/8 by base stats under 600/680), `LEGEND_HOME_MUL` 3, `LEGEND_AWAY_MUL` 0.5, the `LEGEND_HOME` map, `AREA_ZERO_WEEKS` 48, `PARADOX_FIND` 0.004, `SITE_YEARS` 10, the Sanctuary's income (250/500/800, an attraction's after) and `SANCT_PRESTIGE` 1, and the Swords of Justice's and Keldeo's choices.
- **The wall is far harder:** obedience took the passive player from 2.92 to 0.85 let through a year (3 worlds × 25 years). **Measured Nov 16 (twenty-first chat, scratch, `report.js 25 6 --hand`, 0.20.0 0.87):** `BUILD_PAR` 115/125/135/150/170 gave 1.32/1.82/2.13/2.28/1.65 (it tops out near 2: gyms 1 and 2 turn back 85 to 89% of tries whatever the staff build, since legendaries no longer carry challengers through them); 4 tries a gym 1.06; gym sizes 2,3,3,4,4,5,5,6 1.26; `START_TEAM` 4 1.79; `BUILD_PAR` 135 + `START_TEAM` 4 2.87; that plus the smaller gyms 4.71. **Not retuned: the owner will set targets after playing the game.** The owner wants obedience revisited once the ranch is designed, perhaps per League or per region.
- **Paradox Pokémon are to be evaluated later** (the owner): only through Area Zero, not legendaries, no partner years, held for a trainer's career.
- **Sanctuaries are generous (left for the ranch, the owner's choice, Nov 16):** sites come from every legendary that joins a challenger, so a region holds several live sites at once, and AI Leagues earn 145k to 160k a year from Sanctuaries (exempt from the running-income rule, like attractions). `econ.js 25 8` at 0.20.0: AI wealth 7.2 million at year 25 (2.9 at 0.19.0), the crashed League folds in 4 of 8 worlds (recovery 10.7 years in the rest). Scratch, Nov 16: sites only from encounters and roamers 6.0 million, folds 5 of 8, recovery 9.7; that plus income 150/300/450 4.9 million, folds 2 of 8, recovery 8.8. The harder wall adds to it (bigger wall prizes, 113k to 137k a year). The owner expects the ranch and species moving to a regional basis to be the money sinks that answer this.
- **Old legendary records** (`m.lgHome`, `t.greatLegends[].lg`) still name the League where a legendary was found; the pool no longer belongs to a League.
- **Unova and later legendaries have no home region** (only four regions exist); they turn up at their usual rate everywhere.
- **A site comes from where a legendary joined** (the encounter's town, the roamer's town, else the challenger's next gym, or a random gym for one with eight badges); storms and gifts have no town of their own.
- **Legendary encounters still set their level from the circuit** (`circuitLevel()`), as before.

## Left over from 0.21.0 (three Leagues, the progress board, the Hall of Fame on winning, gym memory)
- **Gym memory is not tuned.** `GMEM_CHANGE` 0.3, `GMEM_SQUAD` 1.2, `GMEM_CATCH` 0.35, `GMEM_EXPLORE` 0.3 and `gmemLearn` were set by eye; how much it loosens the early gyms has not been measured (wall targets wait for the owner's play, design doc 3.5). The backstop dials of 3.5 stay ready. Challengers don't share what they learn (the owner: later, with contenders).
- **Three Leagues from the start** spread the field over three walls; let-through numbers, save size and speed with three Leagues from year 1 have not been measured. Whether a rival in your own region should be an option is open.
- **The progress board** has no week scrubber yet (the owner: later). It could become the home screen once the owner has played with it. Elite Four and Champion "lately" lists come from this year's and last year's runs only.
- **Hall of Fame title battles** can be watched only while the League keeps them (this year's and last year's last few title battles).
- **The cross-League stats page** (career honours for trainers and post holders) waits (design doc 6.2).

## From 0.22.0 (title claims)
- The title-claim numbers are provisional: `CLAIM_WANT` 0.3 (and its age, title and grudge steps), `CLAIM_GRACE` 2 years, `CLAIM_ANSWER` 8 weeks, `CLAIM_EDGE` 1.05, `CLAIM_PRESTIGE` 2, `CLAIM_ACCEPT` 0.35, `CLAIM_SPON` 0.5, `CLAIM_AI_YES` wall 0.35 / star 0.7 / money 0.5. Seen in the sims: about 6 to 12 claims in 12 to 20 years across a world of 1 to 6 Leagues.
- Staff seat challenges (Elite Four for the Champion, Gym Leaders and deep runs for an Elite Four seat) still go ahead when unanswered; only title claims wait for the player. Ask the owner whether they should too.
- **Traced and fixed in 0.31.0:** the intermittent `two of <legendary> in the world` / `(Paradox) held` failure. A retiree keeps any Ultra Beast, Paradox Pokémon or legendary without partner years (`retire` only lets partner legendaries go), retirees don't count toward one of each, and `unretire` (hiring a retiree, a founder Champion) brought it back while another was out. `unretire` now lets go of any whose places are taken.


- **New, 0.23.0 (prestige gating): all numbers provisional.** `PM_FREE` 62, `PM_PER` 4.5, `PM_REC` 0.3 (cap 20), `PM_FAMOUS` 15, `PM_HUNGRY` 0.7, `PM_HUNGRY_SHARE` 25, `PM_GRUDGE` 0.6; the founding pool (40, OVR 45–55, 4–6 at 58–62); rival floors 48/54. **League prestige climbs fast** (often 30–70 by year 3 and 100–250 by year 8, mostly from perfect years and wealth rank), so the gate mostly matters in the first three to five years; whether prestige earning should slow is open. **Rival Leagues stay weak for long** even with high prestige: they only hire at vacancies, poor-staff replacements and the yearly upgrade (300,000 spare), so some sat at senior OVR 55–60 after 8–14 years in the sims. Growth (0.24.0) may answer it; if not, the AI needs a reason to upgrade when prestige lets it.
- **Seen once, 0.23.0 (`3 0 10 0 1`, hand-placed, three Leagues): a Bug/Flying gym trainer fielding an off-type Hisuian Decidueye** (the Rowlet line evolving off type). `takeGymTrainer` replaces such Pokémon; another path (perhaps an acting leader going back to a gym trainer's place in `fillVacancy`, where the leader check allowed a caught one) doesn't. Not traced.

- **New, 0.24.0 (growth): all numbers provisional.** `GROW_PEAK` 28, `GROW_DECLINE` 35, `GROW_LATE` 4, `GROW_LATE_DECLINE` 6, `GROW_DECLINE_MAX` 40, `GROW_BLOOM` 3, `GROW_STEP` 3.0/2.0/1.2, `GROW_DROP` 0.7/1.2/1.8, `GROW_TALENT` 0.6–1.4, the coach multiplier (0.7 to 1.3), `GROW_HALL` 0.12, `GROW_HALL_SLOW` 0.1. Measured (passive player, 3 Leagues, 3 worlds × 20 years, seeds 500+): let through a League a year 1.38 in years 1–5 and 1.28 in years 11–20 (0.23.0: 1.00 and 0.61; 0.22.0: 3.09 and 0.99), senior OVR 57 → 60 at year 3 → 77 at year 20, Champions 80 at year 20 (0.22.0: 87). Early walls are not looser than 0.22.0's because 0.22.0's unplaced founding stars started on the circuit; now both sides start weak.

## From 0.29.0 (no League cap)
- *(Done in 0.30.0: the save moved to IndexedDB.)* Long worlds outgrew `localStorage` (about 5.1 million characters at year 121 with six Leagues). IndexedDB usually allows hundreds of MB, but history and retired trainers still grow about 0.09 MB deflated a year at six Leagues; trimming old history stays an option if saves get slow to write.
- **Speed with many Leagues:** about 60 to 70 seconds a simulated year at 18 Leagues in Node (13 at 6). Natural growth stalled at 6 by year 121 (the founder bar), so this only bites if founding gets easier, through god mode or a later change.

## From 0.30.0 (bigger worlds; groundwork for custom regions)
- **Custom regions, part 2 (next chat):** the region editor (copy, blank, generate by types, generations and strength), the list checks, names, ports, two-way neighbours, legendaries, post names, a region's own new species (behaving as if added to My Pokédex: a region never changes an existing species), sharing by file and paste code with a format number (`REGION_FMT`), picking custom regions at a new game (a 10th region or a replacement), the creator's switch for rival Leagues, and re-homing orphaned species when a replacement drops them. `regionLines()` already reads a region's `pool`; `applyRegions()` already makes neighbours two-way and legendary homes from `legends`.
- **Strict borders (the owner, idea, not a priority):** an option to see only the Pokémon of the regions in play (e.g. a world with Kanto and Hoenn only), instead of re-homing orphans and migration from regions with no League.
- **The speed estimate** (`SPEED_AT`, amber over 20 s, red over 40 s a simulated year) is from Node at 0.29.0; a browser, especially a phone, is slower. Remeasure in a browser, and with region count once custom regions add more.
- **A name clash for a region's new species** (a name already in My Pokédex or another region's file): decided (the owner): the species is left out of the import and the import flags it (which species, and why), so clashes never reach a game.

## Left over from League names (0.33.0)
- **The field alarm with gyms in any order.** In 0.33.0's chat one run of `sim.js 3 1 12 1` (growth and god mode on, seven Leagues by year 14) failed on a field of 164 to 173 against the 160 alarm; a rerun of the same build, and 0.32.0 at the same time, passed (the sims aren't seeded). Gyms in any order (0.32.0) let far more through, so fields run larger; retune the wall or move the alarm when wall targets are set.
- **Pool swaps keep the built-in names.** A custom region used as a pool swap keeps the built-in region's League names (as it keeps its region name); only an added region or a whole replacement uses the region's own seat names.
- **Naming a League you found mid-game:** leaving your League and the fresh start after a fold take the seat's default name (no name field on the leave panel or the founding screen); rename it from the League table afterwards. A name field there would be small.

## Left over from calling challenges (0.34.0)
- **All the numbers are provisional** (design doc 6.11): `CALL_MAX` 3, `CALL_WEEKS` 4, `CALL_UNHAPPY` 0.2, `CALL_AI` by aim, the Champion's ambition weights, `CHAMP_DRIFT` 0.25, `CHAMP_STEP_AGE` 40, and the loosened gates (`CHAL_SEAT_YEARS` 1, `CLAIM_GRACE` 1, `CLAIM_WANT` 0.5).
- **Rival Champions rarely last the three-year clock:** in a three-League probe (15 years) rival Champions changed often through their own New Year challenges, so no Champion left over an ambition. Your Champion only changes through your calls and claims you allow, so its clocks run.
- **A Champion who wants a bigger League's seat** goes to that League's circuit and must win its seat through a claim; a direct move between Leagues (trading Champions, or another League signing them) is not built.
- **Your own Elite Four members can still challenge rival Champions** (`rivalChampChallenger` in their League) and trade places on a win, without your say. Whether that should need your approval too is open.
- **The field alarm (160, 200 after a fold)** fails now and then in the hand-placed sim, on 0.33.0 too (fields of 201 to 206 after the forced folds). **Seen again in 0.40.0's chat, often:** the hand-placed sim's field peaked at 206 to 213 in four of five runs after the forced folds, and `1 1 20 1` failed once at 165; the untouched 0.39.0 build run alongside failed the same way (`1 1 20 1` peaked at 280; the hand-placed sim reached 198 and failed on a vacancy with no acting holder, another intermittent failure not traced). Since 0.32.0 gyms in any order let more through and fields run larger; settle with the wall targets.


## Left over from conditions in the ranch (0.36.0)
- **Not measured:** how much conditioned Pokémon strengthen walls, or how often the showcase cap (400 a week) is hit. The 0.36.0 sims showed AI Elite Fours and Champions often at the cap, mostly from alphas and Deltas staff bring with them.
- **Challengers' wild Delta odds ignore the regional Delta lines** (only ranch finds and hunts use `deltaMul`). Could follow later if Deltas should feel regional on the circuit too.
- **Hires' storage** (ranch part 3) will be a further source of conditioned Pokémon; until then a hire's own conditioned Pokémon that they don't field go into the ranch through `dropMon`.
- **Conditioned ranch Pokémon are never swapped out for value** (`ranchSwap` leaves special Pokémon alone, as it did for staff's own); only a lock, listing, reservation elsewhere or an off-type steer change moves them.

## Left over from ranch part 3 (0.37.0)
- **All the numbers are provisional** (item 43): `STORE_MAX` 12, `STORE_PICKS` 3 (+ a scouting office level), `STORE_PICK_WEEKS` 8, `STORE_PAY_MAX` 0.25 at `STORE_PAY_PER` 150,000, `SITE_KEEP` 4, `VAULT_STAFF` 0.3 and its steps, `VAULT_FEE` 50,000–200,000, `VAULT_ASK_WEEKS` 24, `AI_VAULT` 0.25, `GRUDGE_AWAY_LEG` 0.75, `LEGEND_TENURE` 5–8.
- **A challenger's fee or a post:** the design said a challenger may want money or a post; built as a fee, with hiring them (then asking as staff) as the other road. No direct "store it for a post" offer.
- **Sanctuaries flicker:** a challenger on your circuit counts, so a Sanctuary can open and close as challengers move between circuits. Not measured. Whether Sanctuaries are still too generous (item 36) needs the balance pass.
- **Unpicked storage picks lapse** after 8 weeks with nothing taken (no automatic pick for the player).
- **Storage on staff** stays with them (it's theirs) and keeps their pay multiplier fixed at hire; it is cleared on retirement. Save size not measured (12 slim entries a challenger).
- **The AI's judgement** for storing is simple (a monthly chance, the strongest candidate); it never takes a legendary back from a holder or moves one between its posts.
- **Seen once, 0.38.0 (`1 1 20 1`, god mode, five Leagues by year 22): "two off-type Pokémon on Terry"** (role not recorded). A rerun of the same command passed it, and no link to backup types was found (a backup is never marked off-type, and every swap passes `noOff` when the team already holds one). The sim's message now names the role, type and each flagged Pokémon (ranch, backup, how it was met) so the next sighting says which path it came from.
- **Backup types (0.38.0): the numbers are provisional:** `BACKUP_N` 3, `BACKUP_COVER` 2, `BACKUP_SHARE` 0.5. The balance pass should see how much backups strengthen walls in thin regions (the sims field roughly one backup-type Pokémon per team-week where one is used, most 3).

## Left over from city control (0.40.0)
- **All the numbers are provisional** (design doc item 51): presence per ₽10,000 a year, spillover 0.1 of prestige (a quarter of that away), local heroes 6/4/3/1, catch-up ×1.5 under half the leader, renown's weight ⅓, cap ½ of the leader, fade, the slice (10%), badges 1, titles 4, World titles 5, the tier lines 1.1/1.5/2, the shares 40/50/60%, prestige 0.5/1 × 1/1.25/1.5, the crowd edge (1%), the hometown discount (20%).
- **Most city-years are Strongholds** (a League alone in a city with no renown against it is one): in a three-League sim about 65% Stronghold, 25% Held, the rest Leaning or Contested. Part 2 (four Leagues a region, 0.41.0) makes more cities shared in regions with several Leagues; revisit the tier lines with the balance pass.
- **Not measured:** prestige (a lone League's Strongholds give about as much as the old point a city) and the economy. The economy retune after part 2 should cover city income and renown's slice.
- **Exhibition tours** (design doc 6.19) are not built: the lowest priority (the owner may fold them and contenders into one pool of hireable trainers).

## Left over from the regional field (0.41.0)
- **All the numbers are provisional** (design doc item 51): 30 a League and growth to ×1.5 by city slots, newcomers stopping at 1.1 of the aim (one extra under 0.8), the crowd give-up (1 + 3 × (crowd − 1), 0.5 to 4), the draw (prestige 1, ×1.5 for OVR 66+, hometown standing 1.5, loyalty 1.5 for 3 years, beatable walls ±0.8, underdog ±0.6, renown 0.6), tours avoiding regions over 1.25, the founder bars 30/30/50/70, rebuild at 0.6 and back at 0.85 of an even share, the trim (3 OVR below).
- **Single-League regions run over their aim** (1.2 to 1.6 in the growth sims): challengers who reach the Elite Four tour to other regions three times in four, and Triple Crown chasers and Globetrotters ignore the crowd rule. Revisit with the balance pass (a gentler tour rate, or a stricter crowd rule).
- **Challengers change League within a region often** (about two runs in three in a four-League region), so gym memory, kept per League, resets often. Could add a pull toward the League they challenged last if the owner wants steadier circuits.
- **Speed:** the setup estimate is rescaled from this chat's measurements (see the design doc, 0.41.0); worlds with 18+ Leagues are still slow (roughly 2 s a League a simulated year on a fast computer). Re-measure once fields settle (they were still above their aims at year 3).
- **The economy retune** for smaller fields (entry fees, the wall prize, city income) is next; `econ.js` keeps one rival beside the player and two elsewhere.
- **The field alarm (160 a circuit)** still applies per League; the hand-placed sim's forced folds pile everything onto the one League left (Johto 80 against an aim of 31 in this chat's run).
- **Fixed in 0.40.0 (found by the hand-placed sim):** a team plan could name a ranch Pokémon reserved for another post (the monthly swap then sent it there) or one of the same line as a Pokémon the holder always keeps (a special or the Mega holder; the plan could never field it). `planResolve` now treats both as gaps (the steer fills the place); planning still overrides a reservation elsewhere when the plan is set.

## Seat rules (0.43.0)
- Every number is provisional: the rules' openness scale, `SEAT_PREST`, `DRAW_SEAT`, `SEAT_HUNGRY`, the change cost and cooldown, Cup gates, Council sway and calm, Merit's weighting and edge, Term's answer window, `CONQ_WANT`, rivals' leanings and redraw odds.
- Not built: a Champion's ambitions working around a Term's end date (e.g. stepping down at the term's end rather than giving notice mid-term).
- Not built: watching Cup and Gauntlet battles from the year report (the Cup final and a Gauntlet's last battle are kept in `S.seatLogs`, but the year report lists the seat rule's events as text only).
- Open: whether rival Leagues should be able to pick their rule at setup (Advanced → Where rival Leagues start), as with themes.

## Left over from breeding (0.45.0)
- **All the numbers are provisional** (item 50): 5 years in the pool, half upkeep, the retiree's price (half the value), 8 weeks' notice, the Day Care's prices, pairs (1 to 5) and egg times (10 to 6 weeks), the IV rule (the better parent's 70% of the time, + 1 to 4), conditions ×2 and ×5 with 10% more a level, 8 weeks waiting for room, the AI's 2 a month.
- **Egg groups are typed in by hand** (`EGG_RAW`) for the 424 lines' first stages, from the games; worth a check. Babies' lines use the grown-up's groups; Undiscovered lines (Unown, the Galar fossils, Gimmighoul) can't breed. Custom species with no egg field take one from their main type (`TYPE_EGG`).
- **Not measured:** how breeding moves the wall or the economy. In 12-year sims an AI League's pool reached about 40 with 4 pairs; its offspring rarely beat their parents' grade, because rivals mostly breed their best (grade 5) Pokémon.
- **The AI never ends a pair** and keeps every parent until it expires or is bumped.
- **Bred Pokémon and the regional Pokédex (6.22, not built):** they register like any ranch Pokémon when the dex is built.
- **Flaky sim checks.** The hand-placed sim's plan step (`a planned Pokémon left … team`, `the review did not build … plan`) fails now and then on 0.44.0 as well. Seen once on 0.45.0 only (in about six hand-placed runs): `nobody was carried` (leaving the League). **`3 1 12 1` failed twice in six runs on 0.45.0 with `two off-type Pokémon on <an Elite Four member>`** (both ranch Pokémon stamped assigned, in runs where no rival had bred anything); 0.44.0 passed five runs. The cause wasn't found: every `staffPicks` call limits a team to one off-type pick, so a stale `offType` flag carried through a post change is the likeliest suspect. Worth instrumenting (a copy of `sim.js` printing the team and its stamps at the first failure) in the next chat.
- (0.47.0) 16 famous trainers (pack trainers and some base ones, e.g. Magic Johnson, Raiden, Mustard, Briar) have the trait `'mentor'` in `FAMOUS_TRAITS`, which isn't a key of `TRAITS`: give them a real trait or add a Mentor trait.
- (0.47.0) **Flaky browser test:** in 2 of 5 runs of the main page on 0.47.0 (0 of 3 on 0.46.0, which proves little with random worlds) the Your staff steps in year 2 failed (`posts left open after the move`, `a stay-put swap was offered`, `the swap`); the itch copy and 3 reruns passed. 0.47.0 only added famous trainers, so it is most likely the scripted staffing steps meeting an unlucky world; worth tracing.
- (Nov 23, 0.49.0) The browser test's contender step ("nobody to send": every Send button disabled) failed once in four runs; not looked into. (The year-2 vacancy flake was the test picking a region's-field challenger, who only accepts as an offer; fixed in the test.)

## Left over from contracts (0.52.0)
- **All the numbers are provisional:** lengths (1 to 4 years; 3, 6, 9 months), the 4-week window, `CON_ODDS` 0.06 and `CON_PAY` 0.05 a step from the preferred length, `CON_MORE` 0.25 for a restless renewal, `CON_REFUSE` 0.5, the rivals' keep odds by aim, and how preference is read (ambition for staff; hunger and age for anyone else).
- **Renewal is free** apart from the pay asked (in the window); signing bonuses came with talks in 0.53.0.
- **Poaching between rival Leagues still ignores contracts** (`otherStaffFor`); since 0.53.0 your staff are approached only through talks (the Retention stop). Part 3 should bring rival-to-rival poaching into talks too.
- **Done in 0.53.0:** a senior contract not renewed goes to open talks (the Champion's and a run asker's still end at once).
- **Champion's contracts:** a Champion whose contract ends leaves like any member of staff (the heir moves up). Whether the seat rules (Term especially) should drive the Champion's contract instead is open.
- **Not measured:** the wall and the economy with contracts (rivals now turn staff over at contract ends; restless staff stay longer).
- (0.53.0) **Talks, part 2 left open:** rival bidding is a simple rule (part 3: by aim, counters, money-makers lowballing and selling for the fee, variance); rival-to-rival poaching is still the instant `otherStaffFor` move and ignores contracts (only your staff are protected, through talks and the Retention stop); the Champion is never in talks (a Champion who wants a bigger League's seat still leaves through `champQuits`, and Term seat rules don't touch contracts); gym trainers have no talks; the `own` promise only blocks team plans for their post. Measured in the hand-placed sims (12 years): about 50 to 150 star talks a world, most with no offer at all (rivals rarely have a post the star clears by `UPGRADE_EDGE`), 8 to 16 signings, a few walk-aways; a rival goes after your staff a few times a decade. Every number (`TALK_W`, `talkNeed`, `TALK_AI`, `TALK_STAR_OVR`, `TALK_WALK`) is provisional, and nothing was measured on the wall or the economy.

## Left over from rival bidding (0.54.0)
- **All the numbers are provisional** (item 55): `TALK_AIM` (first-offer odds star 0.8, wall 0.6, money 0.35; raises 3/2/0; edges 3/4/6, the wall's 2 with a gap; ceilings +75% and 48 weeks, +50% and 24, nothing), the tempers (×1.3/1/0.7, ±1 raise), `TALK_KEEN` 0.15, `GAP_W` 6, `GAP_TYPES` 3, poaching odds a month (0.1/0.08/0.03). Measured once (four-League probe, 8 years × 4 seeds): star talks drawing 0/1/2/3+ rival offers 37/27/24/12%; the main reason for none is no post the star would improve (`TALK_AIM_LOG.miss`).
- **Gym trainers still move up to other Leagues' gyms at once** (`rivalHire` with `otherStaffFor('leader')`), ignoring contracts; only Gym Leaders going to Elite Four seats go through talks.
- **A seat can be offered under any seat rule** once its Champion is leaving, Succession and the Council included (the incoming Champion skips the heir).
- **The Champion's talks are rare in practice:** a contract holds against a Champion's wish for a bigger seat, so the wish mostly comes due as a refusal at renewal (expiry talks); bigger-seat notices (`'champ'` talks) come only when no contract holds.
- **Seen once each in the sims while building, not traced:** `a hire off the circuit` (a hired challenger not on your circuit) in `3 0 10 0 1`; `a contract past its end` for a gym trainer by one week, twice in about five `1 0 12 0 1` runs (both former senior staff demoted to gym trainer; the contract step skipped them that week, so something set and cleared a step-down or notice around it; `conCatchUp` now handles a notice withdrawn out of the red or by a raise, which didn't stop the second). Gym trainers aren't in talks, so probably not new, but 0.53.0 wasn't rerun to check. Fixed while building: a run asker whose contract held them past their leaving date announced a notice already due (they now go at once), and a window held off by a pay notice opened after the contract's end (`c.win` is now at most `c.until`).
- **Another flaky sim check (seen Nov 24, 0.56.0's chat):** `3 1 12 1` failed once with `a rival kept an unwanted ranch Pokémon 48 weeks past its limit` (on reload) and once with the known `two off-type Pokémon` (above); two more runs passed. Neither touches talks (no player in that sim). Not traced.
- **Flaky hand-placed sim checks on 0.56.0 (seen Nov 24, 0.57.0's chat):** `a contract past its end` (a gym trainer one week past `until`), `nobody was carried`, `a vacancy with no acting holder` and `setPlan refused: … not of the post's type` each failed once in about five hand-placed runs, on the unchanged 0.56.0 build too (a worktree at its commit). Not traced.
- **Famous gym trainers (0.57.0):** at a 100% famous share about 72–78% of gym trainers are famous, because most come from the circuit's lower half and from retirees rather than being made new. Left as is.

- **City buildings part 2 (0.64.0), left open:** team plans naming an item or a coverage type (neither slot exists yet); a pay ask for a hire's items; your League's School step 3 as a suggestion (graduates go to the field now); a class bonus for the Move Tutor; research grants moving to the regional Pokédex when it is built; the Fossil Lab unlock (part 3). Seen again on 0.64.0: `two off-type Pokémon on <an Elite Four member>` once in `1 1 20 1` (both ranch Pokémon, assigned); the rerun passed.
- (0.69.0) **The Weather Institute's open items:** every number (prices, `FIELD_TERRAIN` 1.2, `FIELD_PREP` 0.6); which classes count as weather-themed (`WX_CLASS`, matched on the class name: no base-game class matches, only custom ones such as Storm's Weather Witch); an untyped gym's choices (its leader's team's types); rivals built none in `1 1 20 1` or `3 1 12 1` (a City-size gym city is rare for them, as with the Airport); a Hoenn landmark version later. The engine's weather has no turn count (a weather lasts until replaced), so level 2's "holds all battle" means nothing can replace it. Not measured on the wall.
- (0.69.0) `1 1 20 1` failed once with the known `a contract past its end` (a Gym Leader one week past `until` with a won't-renew window); a rerun passed.
