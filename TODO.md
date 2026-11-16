# Pokémon League Builder: to-do list

Things left over from the seed, and ideas tabled for later. Remove an item once it is done.

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
- **All the numbers are provisional:** the refusal odds (`acceptsOffer`), `HIRE_NOTICE` 8, `REFUSED_WEEKS` 24, the retiree limits (3 years, under 55, OVR 55+), `GYM_HIRE_MIN` 58, `E4_HIRE_MIN` 64, `E4_HIRE_EDGE` 5, `POOR_YEARS` 3 and the 30% poor-year line. Balance is unmeasured: rival Leagues now hire their circuit's best every time and replace poor staff.
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
