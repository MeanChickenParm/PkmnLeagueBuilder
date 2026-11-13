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
- **Nothing is tuned.** 62 perfect seasons in 100 against a target of about 10. Dials for stage 1b: tries per gym, gym trainers per gym and their team sizes, whether a beaten gym trainer stays beaten, how well challengers pick their squad, how many Pokémon a challenger starts the season with (`START_TEAM`, 3) and how fast they catch more.
- **The season is front-loaded.** With no levels to gain, challengers take on the gyms as soon as they have enough Pokémon. The average challenger who goes out is out by week 7, and the last gym try of a season comes around week 18 of 24. The season's length and the midseason window (after week 12) need a look.
- **Gym teams lose their type.** The meta response (and bans) swap off-type Pokémon into small gym teams season after season, so a Fire gym can end up with no Fire Pokémon. The team builder rework in stage 1b should fix this; gym trainers are not touched by the meta response.
- **Staff ratings still barely matter.** In a set-level battle the level bonus from a staff member's OVR is gone, so only the in-battle effects of ratings are left. Stage 1b makes the team builder read ratings.
- **Staff moves are still the source's.** A challenger can still leave the circuit to lead a gym or win an Elite Four seat after a deep League run; leaders still step down, come back and get replaced automatically. The owner wants competition inside a League for a Champion or Elite Four seat left by a retiree or an underperformer to be a point of interest (stage 2).
- **Everstone** now simply holds a Pokémon in its current form at every level.
- **Legendary encounters** still set the legendary's level from the challengers' levels, which are now their next gym's level. It works, but was not looked at closely.
- **Interim Champion** boards and profile lines are still in the interface but nothing creates an Interim Champion any more. Remove them when the records pages are next touched.
- **Triple Crown and Champion-of-a-League records** (`champLeaguesOf`) read who held the seat at a season's end, so a challenger's title win no longer counts towards them. To fix with rival Leagues (stage 4).
- **The banlist vote** doesn't include gym trainers.

## Carried over from Pokémon League GM's list
- **Doubles battles.** `battle()` assumes one active Pokémon per side. See the source repo's `TODO.md` for the work involved.
