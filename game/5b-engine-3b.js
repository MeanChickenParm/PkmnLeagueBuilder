// ================= CITIES (0.63.0, split from 5-engine-3) =================
// ---------- cities ----------
// A region has its 8 gym cities and more without a gym (LEAGUE_SETS extra); a League also has its seat (the Elite Four and
// the Champion). A League builds only where it has a gym (and at its seat). Every level owned costs UPKEEP of its price a year.
// (0.63.0, city buildings part 1, design doc cities-and-economy.md) slots have no ceiling: a city gains one at each of
// slotAt(n) spent there by all Leagues (60,000, 180,000, then 400,000 doubling); the seat keeps SEAT_SLOTS. A city's
// size (citySize: Town, City, Metropolis, …) comes from the same total (sizeAt: 100,000, 400,000, then ×3 each) and sets
// its income, its visitors' spending, ticket prices and crowds, and which building levels it can hold (U.tierAt). The
// Attraction and the gym feature are gone: the Stadium (every gym has one at level 0) carries the home edge and sells
// tickets, and the Hotel, the Pokémon Center and the Berry Farm are new. All numbers provisional.
const SEAT_SLOTS = 3, UP_COST = [25000, 50000, 100000, 200000, 400000], MOVE_FEE = 40000, UPKEEP = 0.05;
const UPGRADES = {
  // (0.63.0) a gym's own Stadium: every gym has one at level 0 (500 seats); the seat's starts at level 2 (base)
  stadium: { name: 'Stadium',         text: 'Every gym has one (500 seats at level 0) and the seat starts with a level 2 one. Battles are fought here: each try at the gym, and each Elite Four and title battle at the seat, sells tickets to the crowd its hype and the city\'s size bring, up to its seats (1,000, 2,000, 4,000, 7,000, 12,000). Each level is also a home edge of +1.5% in your staff\'s battles there. Level 3 needs a City, 4 a Metropolis, 5 a Megalopolis.', slotless: true, max: 5, tierAt: [0, 0, 1, 2, 3] },
  hotel:   { name: 'Hotel',           text: 'Gym cities only. Rooms (4, 8, 14, 22, 32 by level) for the challengers in town each week: a room filled pays by the city\'s size. Every Hotel in the city shares the week\'s guests; the League that controls the city fills a little more. From level 3 a guest from another region counts twice. Level 3 needs a City, 4 a Metropolis, 5 a Megalopolis.', city: true, max: 5, cost: [20000, 40000, 80000, 160000, 320000], tierAt: [0, 0, 1, 2, 3] },
  center:  { name: 'Pokémon Center',  text: 'Gym cities only. Challengers whose hometown it is lean toward your League (+0.5 a level in the draw), and everyone in the region a little (+0.1 a level). Your circuit\'s challengers rest at your Centers: each Center you have cuts a week off their rest (up to 3), and a resting challenger is a visitor in its city. Level 3 needs a City.', city: true, max: 3, cost: [10000, 20000, 40000], tierAt: [0, 0, 1] },
  berry:   { name: 'Berry Farm',      text: 'Gym cities only. Plots (2, 4, 7, 10 by level) harvested every 4 weeks: each plot you set to sell brings in about 50 a week, the same in any city; each plot set to feed cuts your ranch\'s upkeep by 2% (up to 20%), and any fed plot makes Day Care eggs come a week sooner. A Grass gym in the city, or an Aroma Lady or Gardener on your staff, adds a plot\'s yield.', city: true, max: 4, cost: [15000, 30000, 60000, 120000] },
  hall:    { name: 'Training hall',   text: 'Seat only (0.64.0: a gym city has a Trainer\'s School instead). The Elite Four and the Champion grow faster while they are still improving (+12% a level) and decline more slowly once past their peak (10% a level).', seat: true, max: 5 },
  // (0.64.0, city buildings part 2: 5c-engine-3c) the Trainer's School, the Move Tutor, the Research Lab, the Department Store
  school:  { name: 'Trainer\'s School', text: 'Gym cities only. Graduates one young gym trainer a year a level (one more level with a Professor on your staff), from this city and of a class that fits its gym, a little stronger each level: they take an open gym trainer place, else set out on the field, likelier to take your offers. Your graduates are paid 10%, 18%, 26%, 35% less by you. Also the old training hall for this gym: its Gym Leader and gym trainers grow 12% faster a level and decline more slowly. Level 3 needs a City, 4 a Metropolis.', city: true, max: 4, cost: [15000, 30000, 60000, 120000], tierAt: [0, 0, 1, 2] },
  tutor:   { name: 'Move Tutor',      text: 'In a gym city (its Gym Leader and gym trainers) or at the seat (the Elite Four and Champion). A tutored Pokémon learns all three of its line\'s coverage types, each 10 levels sooner, and keeps the lesson for good. Level 1 teaches 2 Pokémon a post, level 2 the whole team, level 3 puts a backup-type Pokémon\'s coverage on its trainer\'s threats first (needs a City).', max: 3, cost: [20000, 40000, 80000], tierAt: [0, 0, 1] },
  lab:     { name: 'Research Lab',    text: 'Gym cities only; your best Lab works League-wide (a Scientist on your staff counts as a level more). Catching trips +3 Scouting a level; finds of grade 2 or better from level 2 and 3 or better from level 4; one more trip out at once from level 3; condition hunts 5% likelier a level; at level 4 ordinary trips find conditions 1.5× as often. A research grant of 500 × its level for each new species of your region the ranch takes in. Level 3 needs a City, 4 a Metropolis.', city: true, max: 4, cost: [25000, 50000, 100000, 200000], tierAt: [0, 0, 1, 2] },
  store:   { name: 'Department Store', text: 'Gym cities only. Sells held items for your item bag (your best Store\'s floors, League-wide): the Poké Mart floor tier 1 items, 2F Leftovers, Eviolite and Assault Vest, 3F Expert Belt and Focus Sash (needs a City), 4F Life Orb, Choice Band and Choice Specs (needs a Metropolis); each floor above a shelf takes 10% off it. Your staff only hold tier 2 and 3 items from the bag. Shoppers (the city\'s visitors and residents) spend there too.', city: true, max: 4, cost: [15000, 30000, 60000, 120000], tierAt: [0, 0, 1, 2] },
  scout:   { name: 'Scouting office', text: 'Seat only. Each level adds an outsider to every hiring page, makes outsiders 2 points stronger and adds 4% to the odds an offer is taken.', seat: true },
  // (0.20.0) only in a gym city that is a legendary site: earns while open, and adds prestige
  sanct:   { name: 'Sanctuary',       text: 'Only in a city that is a legendary site. Brings in income every week and a point of prestige a level each New Year while it is open (one of the site\'s legendaries is with your League).', site: true, income: [250, 500, 800] },
  // (0.25.0) the Ranch: how many Pokémon the League's ranch holds
  ranch:   { name: 'Ranch',           text: 'Seat only, takes no slot. Each level lets your ranch hold more Pokémon (60 with none, then 80, 105, 135, 170, 210).', seat: true, slotless: true, max: 5, cost: [30000, 60000, 120000, 240000, 480000] },
  // (0.27.0) a port city's shipping lane (Goldenrod's railway): a source region's Pokémon on trips and at the market
  lane:    { name: 'Shipping lane',   text: 'Only in a port city (Goldenrod: the railway). Choose a region on the Ranch page: its Pokémon can then be caught on your targeted trips and turn up at your market all the time. 400 a week on top of upkeep; changing the route costs 10,000.', port: true, max: 1, cost: [60000] },
  // (0.27.0) the safari: one per League, in a gym city; foreign Pokémon for its own trips, changing every few months
  safari:  { name: 'Safari Zone',     text: 'One per League, in a gym city. Holds 10 Pokémon from other regions (13, 16 at levels 2 and 3), changing every 12 weeks, that only your targeted trips can catch; each level also makes those finds better.', one: true },
  // (0.45.0) the Day Care: breeds from the League's breeding pool (the Ranch page's Day Care tab)
  daycare: { name: 'Day Care',        text: 'Seat only, takes no slot. Breeds Pokémon from your breeding pool (Ranch page, Day Care tab): 1 pair at once, then 2, 3, 4, 5, with an egg every 10 weeks, down to 6 at level 5, and slightly better odds of a condition each level.', seat: true, slotless: true, max: 5, cost: [40000, 80000, 160000, 320000, 640000] },
  academy: { name: 'Youth academy',   text: 'Seat only, takes no slot. Each level raises a young prospect a year who sets out on your circuit as one of your own: likelier to take your offers and cheaper to hire.', seat: true, slotless: true, cost: [100000, 200000, 400000] },
};
const upMax = k => UPGRADES[k].max || 3;
const upCost = (k, lv) => (UPGRADES[k].cost || UP_COST)[lv];
// what a building has cost so far (every level paid), for upkeep and the economy report; (0.63.0) a level it came with
// (x.base: the seat's Stadium) cost nothing and can't be sold
const slotsUsed = b => b.filter(x => !UPGRADES[x.k].slotless).length;
const builtCost = x => { let c = 0; for (let n = x.base || 0; n < x.lv; n++) c += upCost(x.k, n); return c; };
const cityLg = () => S.lg || 0;
function cityB(c, i = cityLg()) { c.b = c.b || {}; return c.b[i] = c.b[i] || []; }
const citySpent = c => Object.values(c.spent || {}).reduce((a, b) => a + b, 0);
// (0.63.0) slots and sizes without a ceiling
const slotAt = n => n === 0 ? 60000 : n === 1 ? 180000 : 400000 * Math.pow(2, n - 2);
function citySlots(c) { const sp = citySpent(c); let n = 0; while (sp >= slotAt(n)) n++; return 1 + n; }
const SIZE_NAMES = ['Town', 'City', 'Metropolis', 'Megalopolis', 'World City'];
const sizeAt = k => k === 1 ? 100000 : 400000 * Math.pow(3, k - 2);
function citySize(c) { if (!c) return 0; const sp = citySpent(c); let k = 0; while (sp >= sizeAt(k + 1)) k++; return k; }
const sizeName = k => SIZE_NAMES[Math.min(k, SIZE_NAMES.length - 1)] + (k >= SIZE_NAMES.length ? ' ' + (k - SIZE_NAMES.length + 2) : '');
// what a city of size k gives: weekly city income, each visitor-week's spending, a ticket's price, the crowd a battle of
// ordinary hype draws, a Hotel room's nightly… weekly rate, and the prestige weight of a city controlled
const CITY_INCOME_AT = k => Math.round(250 * Math.pow(1.4, k) / 10) * 10;
const VISIT_SPEND_AT = k => Math.round(8 * Math.pow(1.4, k));
const TICKET_AT = k => Math.round(100 * Math.pow(1.25, k)) / 100;
const CROWD_AT = k => Math.round(90 * Math.pow(1.6, k));
const ROOM_AT = k => Math.round(30 * Math.pow(1.5, k));
const SIZE_PREST_AT = k => 1 + 0.25 * k;
const seatPlace = () => S.seatName || LEAGUE_SETS[S.region].seat;
function seatB() { return S.seatB = S.seatB || []; }
// the League's places: its seat, then the gym cities in gym order, then the region's cities where it has no gym
function myPlaces() {
  const all = regionCities(S.region), gymC = S.gyms.map(g => g.city);
  return [{ seat: true, name: seatPlace(), slots: SEAT_SLOTS, b: seatB() }]
    .concat(S.gyms.map((g, i) => { const c = S.cities[g.city]; return { c, gym: i, name: c.name, slots: citySlots(c), b: cityB(c) }; }))
    .concat(all.filter(c => !gymC.includes(c.id)).map(c => ({ c, gym: null, name: c.name, slots: citySlots(c), b: cityB(c), none: true })));
}
const upLevel = (b, k) => (b.find(x => x.k === k) || { lv: 0 }).lv;
// the level of upgrade k at gym i ('seat' for the seat), in the bound League
function placeLv(where, k) { if (where === 'seat') return upLevel(seatB(), k); const g = S.gyms[where]; return g && S.cities[g.city] ? upLevel(cityB(S.cities[g.city]), k) : 0; }
// what the next level of upgrade k costs at a place, or a reason it can't be built
function buildCheck(where, k) {
  const U = UPGRADES[k]; if (!U) return { why: 'No such upgrade.' };
  if (U.seat && where !== 'seat') return { why: 'Only at the seat.' };
  if (U.city && where === 'seat') return { why: 'Only in a gym city.' };
  if (U.site && (where === 'seat' || !siteOn(S.cities[(S.gyms[where] || {}).city]))) return { why: 'Only at a legendary site.' };
  // (0.27.0) lanes only in ports (and only with regional encounters), one safari a League
  if (U.port && (where === 'seat' || !isPort(S.cities[(S.gyms[where] || {}).city]) || !homeSet(S.region))) return { why: 'Only in a port city (or Goldenrod, for its railway).' };
  if ((U.one || U.port) && !homeSet(S.region)) return { why: 'Every species is found everywhere (National Dex rules).' };
  if (U.one && (where === 'seat' || S.gyms.some((g, i) => i !== where && S.cities[g.city] && upLevel(cityB(S.cities[g.city]), k)))) return { why: where === 'seat' ? 'Only in a gym city.' : 'Your League already has one.' };
  const pl = where === 'seat' ? { b: seatB(), slots: SEAT_SLOTS } : (() => { const g = S.gyms[where]; const c = g && S.cities[g.city]; return c ? { b: cityB(c), slots: citySlots(c) } : null; })();
  if (!pl) return { why: 'Your League has no gym there.' };
  const lv = upLevel(pl.b, k);
  if (lv >= upMax(k)) return { why: 'Fully built.' };
  if (!lv && !U.slotless && slotsUsed(pl.b) >= pl.slots) return { why: 'No free slot.' };
  // (0.63.0) bigger levels need a bigger city (the seat counts as the League's biggest gym city)
  const need = U.tierAt ? U.tierAt[lv] || 0 : 0, size = where === 'seat' ? seatSize() : citySize(S.cities[S.gyms[where].city]);
  if (need > size) return { why: `Level ${lv + 1} needs a ${sizeName(need)} (this is a ${sizeName(size)}).` };
  // (0.19.0) a level the League lost here (sold or decayed) is restored at RESTORE_SHARE of its price
  const ru = ruinsAt(where, k) > 0;
  return { cost: Math.round(upCost(k, lv) * (ru ? RESTORE_SHARE : 1)), lv: lv + 1, restore: ru };
}
function build(where, k, lg = ME()) {
  return inLeague(lg, () => {
    if (!booksOn()) return 'Money is off.';
    const ck = buildCheck(where, k); if (ck.why) return ck.why;
    if (!canSpend(ck.cost)) return 'Not enough money.';
    const b = where === 'seat' ? seatB() : cityB(S.cities[S.gyms[where].city]);
    const ex = b.find(x => x.k === k); if (ex) ex.lv++; else b.push(k === 'lane' ? { k, lv: 1, src: (NEIGHBOURS[S.region] || [0])[0] } : { k, lv: 1 });
    if (ck.restore) addRuin(where === 'seat' ? 'seat' : S.gyms[where].city, k, -1);
    const name = where === 'seat' ? seatPlace() : townName(where);
    if (where !== 'seat') { const c = S.cities[S.gyms[where].city]; c.spent = c.spent || {}; c.spent[cityLg()] = (c.spent[cityLg()] || 0) + ck.cost; }
    book(-ck.cost, 'building', `${UPGRADES[k].name} ${ck.lv > 1 ? `to level ${ck.lv}` : 'built'} in ${name}${ck.restore ? ' (restored)' : ''}`);
    news(`The League ${ck.restore ? `restored its ${UPGRADES[k].name.toLowerCase()} in ${name}${ck.lv > 1 ? ` to level ${ck.lv}` : ''}` : ck.lv > 1 ? `raised its ${UPGRADES[k].name.toLowerCase()} in ${name} to level ${ck.lv}` : `built a ${UPGRADES[k].name.toLowerCase()} in ${name}`}.`, 'league');
    return null;
  });
}
// a gym moves to a city of the region where the League has no gym: the fee, and everything the League built in the
// old city is lost (the city keeps its size)
function moveGym(i, cityId, lg = ME()) {
  return inLeague(lg, () => {
    if (!booksOn()) return 'Money is off.';
    const g = S.gyms[i], to = S.cities[cityId];
    if (!g || !to || to.region !== S.region || S.gyms.some(x => x.city === cityId)) return 'That city is not free.';
    if (!canSpend(MOVE_FEE)) return 'Not enough money.';
    const from = S.cities[g.city], lost = cityB(from).length;
    from.b[cityLg()] = []; if (from.st) delete from.st[cityLg()]; from.tier = from.ctrl === cityLg() ? null : from.tier;
    if (S.fin && S.fin.ruins) delete S.fin.ruins[from.id];
    g.city = cityId;
    safariTrim(); // (0.44.0) a safari left behind sends its stock back
    book(-MOVE_FEE, 'building', `Moved ${from.name} Gym to ${to.name}`);
    const text = `${from.name} Gym moved to ${to.name}${lost ? `; what the League had built in ${from.name} is lost` : ''}.`;
    news(text, 'league'); noteChange(text);
    return null;
  });
}
// ---------- city standing, control and income (0.15.0, stage 4; reworked in 0.40.0, design doc 6.19) ----------
// Standing is a League's local reputation in a city where it has a gym. Each New Year it gains from how its gym held
// against the region's average (a point per percentage point), from its presence (a point a year per PRESENCE_PER of
// buildings standing there, nothing while they have lapsed), from prestige spillover (SPILL of its prestige in every
// home city) and from local heroes (staff whose hometown it is: HERO_PTS by post). A League under CATCHUP_UNDER of the
// leader's standing gains CATCHUP_MUL as fast. Then all standing fades by STAND_FADE.
// Renown (c.rn) is what a League with no gym in a city earns there: spillover in other regions' cities (SPILL_AWAY of
// the home rate), its contenders' badges and titles, and World titles. It counts at RN_WEIGHT, capped at RN_CAP of the
// leader's standing: it narrows the leader's lead and takes up to RN_SLICE of the city's income. It never controls.
// Control is graded by the leader's lead over the second (another League's standing or the strongest renown):
// Contested, Leaning, Held, Stronghold (TIER_AT). The controller takes TIER_SHARE of the city's income (Contested:
// split by standing), Held and Stronghold earn prestige (TIER_PREST × SIZE_PREST_AT by size), and a Stronghold gives its
// gym a crowd edge (STRONG_EDGE), its hometown trainers a lower prestige minimum (STRONG_RECRUIT) and first refusal on
// a rival's distress sale there. All numbers provisional.
const STAND_FADE = 0.25;
const PRESENCE_PER = 10000, SPILL = 0.1, SPILL_AWAY = 0.25, HERO_PTS = { champion: 6, e4: 4, leader: 3, gymtrainer: 1 }, CATCHUP_UNDER = 0.5, CATCHUP_MUL = 1.5;
const RN_WEIGHT = 1 / 3, RN_CAP = 0.5, RN_FADE = 0.25, RN_BADGE = 1, RN_TITLE = 4, RN_WORLD = 5, RN_SLICE = 0.1;
const TIER_AT = [1.1, 1.5, 2], TIER_NAMES = ['Contested', 'Leaning', 'Held', 'Stronghold'], TIER_SHARE = [0, 0.4, 0.5, 0.6], TIER_PREST = [0, 0, 0.5, 1];
const STRONG_EDGE = 0.01, STRONG_RECRUIT = 0.8;
// which Leagues have a gym in each city: { cityId: [league, …] }, read from every League without binding
function gymMap() {
  const out = {};
  for (let i = 0; i < nLeagues(); i++) { const L = i === (S.lg || 0) ? S : S.leagues[i]; for (const g of (L && L.gyms) || []) (out[g.city] = out[g.city] || []).push(i); }
  return out;
}
const r1 = n => Math.round(n * 10) / 10;
function addStanding(c, n, lg = cityLg()) { c.st = c.st || {}; c.st[lg] = r1((c.st[lg] || 0) + n); }
const standing = (c, lg = cityLg()) => (c.st && c.st[lg]) || 0;
function addRenown(c, lg, n) { if (!c || lg == null || lg < 0 || !(n > 0)) return; c.rn = c.rn || {}; c.rn[lg] = r1((c.rn[lg] || 0) + n); }
const renown = (c, lg = cityLg()) => (c && c.rn && c.rn[lg]) || 0;
// the League with most standing among those with a gym in city c (a tie keeps the controller); lgs: those Leagues
function cityCtrl(c, lgs) {
  if (!lgs || !lgs.length) return null;
  if (lgs.length === 1) return lgs[0];
  const best = Math.max(...lgs.map(i => standing(c, i)));
  return lgs.includes(c.ctrl) && standing(c, c.ctrl) >= best ? c.ctrl : lgs.find(i => standing(c, i) === best);
}
// city c now: { ctrl, tier (0 Contested … 3 Stronghold), lead, second, rn: [{ lg, eff }] (renown that counts), slice }
function cityState(c, lgs) {
  const out = { ctrl: null, tier: 0, lead: 0, second: 0, rn: [], slice: 0 };
  if (!c || !lgs || !lgs.length) return out;
  const ctrl = out.ctrl = cityCtrl(c, lgs), lead = out.lead = standing(c, ctrl), cap = Math.max(0, lead) * RN_CAP;
  out.rn = Object.keys(c.rn || {}).map(Number).filter(j => !lgs.includes(j) && c.rn[j] > 0).map(j => ({ lg: j, eff: Math.min(cap, c.rn[j] * RN_WEIGHT) })).filter(x => x.eff > 0);
  const second = out.second = Math.max(0, ...lgs.filter(i => i !== ctrl).map(i => standing(c, i)), ...out.rn.map(x => x.eff));
  if (lead <= 0) out.tier = lgs.length > 1 ? 0 : 2;
  else if (second <= 0) out.tier = 3;
  else { const r = lead / second; out.tier = r < TIER_AT[0] ? 0 : r < TIER_AT[1] ? 1 : r <= TIER_AT[2] ? 2 : 3; }
  const sum = out.rn.reduce((a, x) => a + x.eff, 0);
  out.slice = lead > 0 && sum > 0 ? Math.min(RN_SLICE, RN_SLICE * sum / (lead * RN_CAP)) : 0;
  return out;
}
// League lg's share of city c's weekly income (the bound League by default): by tier for those with a gym there, by
// renown out of the slice for those without
function cityShare(c, lgs, lg = cityLg()) {
  if (!c || !lgs || !lgs.length) return 0;
  const inc = cityPool(c), s = cityState(c, lgs);
  if (!lgs.includes(lg)) { const x = s.rn.find(y => y.lg === lg), sum = s.rn.reduce((a, y) => a + y.eff, 0); return x && sum ? Math.round(inc * s.slice * x.eff / sum) : 0; }
  const rest = inc * (1 - s.slice);
  if (lgs.length === 1) return Math.round(rest);
  const split = ids => { const tot = ids.reduce((a, i) => a + Math.max(0, standing(c, i)), 0); return tot > 0 ? Math.max(0, standing(c, lg)) / tot : 1 / ids.length; };
  if (s.tier === 0) return Math.round(rest * split(lgs));
  if (lg === s.ctrl) return Math.round(rest * TIER_SHARE[s.tier]);
  return Math.round(rest * (1 - TIER_SHARE[s.tier]) * split(lgs.filter(i => i !== s.ctrl)));
}
// the bound League's city income: its gym cities, plus its renown's slice where it has no gym
function cityIncome() {
  const m = gymMap(), lg = cityLg();
  let a = S.gyms.reduce((x, g) => x + cityShare(S.cities[g.city], m[g.city]), 0);
  for (const c of Object.values(S.cities)) if (c.rn && c.rn[lg] > 0 && m[c.id] && !m[c.id].includes(lg)) a += cityShare(c, m[c.id], lg);
  return a;
}
// a Stronghold of League lg (as set at the last New Year)
const strongholdOf = (c, lg) => !!c && c.tier === 3 && c.ctrl === lg;
// ---------- hometowns (0.40.0) ----------
// Every trainer has a hometown, drawn evenly (from the id, so no random draw is used) from the cities and towns of the region they were made in: t.home =
// { r, i } (the region, and the index in its towns then its places with no gym). homeCity(t) is its city id, once that
// region's cities exist.
let homeCache = null;
function setHome(t, r = S.region) {
  const L = r != null && LEAGUE_SETS[r]; if (!t || !L) return;
  t.home = { r, i: ((t.id * 2246822519) >>> 0) % (L.towns.length + (L.extra || []).length) }; // even, a stable draw from the id
}
function homeCity(t) {
  if (!t || !t.home || !S.cities) return null;
  if (!homeCache || homeCache.of !== S.cities || homeCache.n !== S.nextCity) {
    const by = {}; for (const c of Object.values(S.cities).sort((a, b) => a.id - b.id)) (by[c.region] = by[c.region] || []).push(c.id);
    homeCache = { of: S.cities, n: S.nextCity, by };
  }
  const ids = homeCache.by[t.home.r]; return ids && ids[t.home.i] != null ? ids[t.home.i] : null;
}
const homeName = t => { const id = homeCity(t); if (id != null) return S.cities[id].name; const L = t && t.home && LEAGUE_SETS[t.home.r]; return L ? L.towns.concat(L.extra || [])[t.home.i] || null : null; };
// New Year, before the gyms' year is reset: each League's gains in its gym cities (the gym's record, presence,
// spillover, local heroes; catch-up for the far behind), renown elsewhere, the fade, then control and its tier (news
// when control changes hands in a shared city)
function cityNewYear() {
  const held = g => g.w + g.l ? g.w / (g.w + g.l) : null, byRegion = {}, avg = a => a.reduce((x, y) => x + y, 0) / a.length;
  eachLeague(() => S.gyms.forEach(g => { const h = held(g); if (h != null) (byRegion[S.region] = byRegion[S.region] || []).push(h); }));
  const m = gymMap(), gain = {}, add = (c, i, n) => { const g = gain[c.id] = gain[c.id] || {}; g[i] = (g[i] || 0) + n; };
  const wl = nLeagues() > 1 && S.worlds && S.worlds.winner != null && S.worlds.season === S.season ? lgOf(T(S.worlds.winner)) : null;
  eachLeague(i => {
    const lap = !!S.fin && lapsed(), pr = Math.max(0, S.prest || 0), rs = byRegion[S.region] || [];
    S.gyms.forEach(g => {
      const c = S.cities[g.city], h = held(g);
      if (h != null && rs.length) add(c, i, (h - avg(rs)) * 100);
      if (!lap) { const v = cityB(c).reduce((a, x) => a + builtCost(x), 0); if (v) add(c, i, v / PRESENCE_PER); }
      if (pr) add(c, i, pr * SPILL);
    });
    for (const t of staffIds().map(T).filter(Boolean)) { const hc = homeCity(t); if (hc != null && (m[hc] || []).includes(i) && HERO_PTS[t.role] && !t.acting) add(S.cities[hc], i, HERO_PTS[t.role]); }
    for (const c of Object.values(S.cities)) if (c.region !== S.region && (m[c.id] || []).length) {
      if (pr) addRenown(c, i, pr * SPILL * SPILL_AWAY);
      if (wl === i) addRenown(c, i, RN_WORLD);
    }
  });
  for (const c of Object.values(S.cities)) {
    const lgs = m[c.id] || [], g = gain[c.id] || {}, top = Math.max(0, ...lgs.map(i => standing(c, i)));
    for (const i of lgs) { let n = g[i] || 0; if (n > 0 && top > 0 && standing(c, i) < top * CATCHUP_UNDER) n *= CATCHUP_MUL; if (n) addStanding(c, n, i); }
    if (c.st) for (const k of Object.keys(c.st)) { if (!lgs.includes(+k)) delete c.st[k]; else c.st[k] = r1(c.st[k] * (1 - STAND_FADE)); }
    if (c.rn) { for (const k of Object.keys(c.rn)) { const v = r1(c.rn[k] * (1 - RN_FADE)); if (lgs.includes(+k) || +k >= nLeagues() || v < 0.1) delete c.rn[k]; else c.rn[k] = v; } if (!Object.keys(c.rn).length) delete c.rn; }
    const was = c.ctrl, s = cityState(c, lgs);
    c.ctrl = s.ctrl; c.tier = lgs.length ? s.tier : null;
    if (was != null && s.ctrl != null && was !== s.ctrl && lgs.length > 1) { const text = `The ${leagueName(s.ctrl)} took control of ${c.name} from the ${leagueName(was)} (${TIER_NAMES[s.tier]}).`; inLeague(s.ctrl, () => { news(text, 'league'); noteChange(text); }); }
  }
}
// prestige from the cities the bound League controls (Held and Stronghold), by size; read at New Year
function cityPrestige(i = S.lg || 0) {
  return S.gyms.reduce((a, g) => { const c = S.cities[g.city]; return a + (c && c.ctrl === i && c.tier != null ? TIER_PREST[c.tier] * SIZE_PREST_AT(citySize(c)) : 0); }, 0);
}
// a contender's badge at a gym of the bound League, and a title won here: renown for the sponsor
function contenderRenown(t, gi) {
  const s = t && t.spon; if (!s || s.lg === (S.lg || 0)) return;
  if (gi != null) addRenown(S.cities[S.gyms[gi].city], s.lg, RN_BADGE);
  else for (const g of S.gyms) addRenown(S.cities[g.city], s.lg, RN_TITLE);
}
// (0.16.0) what the bound League owns, at cost (its seat and the cities where it has a gym), and its weekly upkeep:
// UPKEEP of that a year, so a large estate costs to hold
function estateCost() { return myPlaces().filter(p => !p.none).reduce((a, p) => a + p.b.reduce((c, x) => c + builtCost(x), 0), 0); }
const upkeepWeek = () => Math.round(Math.max(0, estateCost() - sealedCost()) * UPKEEP / YEAR_WEEKS); // (0.37.0) sealed Sanctuaries cost nothing
// (0.16.0) the youth academy: each level raises a young prospect a year (in week ACADEMY_WEEK), a little better than
// an ordinary newcomer, who sets out on the League's circuit tagged as its own (t.academy = the League). The League
// pays them ACADEMY_PAY of the usual wage and they are ACADEMY_LOYAL likelier to take its offers. Stage 5 can later
// let a League send its own at other Leagues; nothing does yet.
const ACADEMY_WEEK = 20, ACADEMY_PAY = 0.85, ACADEMY_LOYAL = 0.25, ACADEMY_Q = 6;
const academyLv = () => S.seatB ? upLevel(S.seatB, 'academy') : 0;
const ownAcademy = t => !!t && t.academy != null && t.academy === (S.lg || 0);
function academyWeek() {
  if (S.week !== ACADEMY_WEEK) return;
  eachLeague(i => {
    if (lapsed()) return; // (0.18.0) a lapsed academy raises nobody
    for (let n = 0; n < academyLv(); n++) {
      const t = newTrainer({ age: ri(13, 16), quality: ri(36, 52) + ACADEMY_Q, role: 'prospect' });
      starterTeam(t, 9);
      t.academy = i;
      joinCircuit(t, i); t.rest = S.turn + ri(1, 3); t.early = 0;
      news(`${dn(t)} has come up through the ${S.lgName}'s youth academy and is setting out as a challenger.`, 'circuit', t.id);
    }
  });
}
// upgrade effects in the bound League
function homeEdge(where) {
  if (lapsed()) return 1;
  // (0.40.0) a gym in a city that is the League's Stronghold fights with a crowd behind it
  const c = where !== 'seat' && S.gyms[where] ? S.cities[S.gyms[where].city] : null;
  // (0.63.0) the Stadium carries the old gym feature's home edge
  return 1 + STADIUM_EDGE * placeLv(where, 'stadium') + (strongholdOf(c, S.lg || 0) ? STRONG_EDGE : 0);
}
// ---------- (0.20.0) legendary sites and sanctuaries ----------
// A gym city where a legendary appeared or was caught becomes a legendary site (c.site = { sp, from, sps } since 0.37.0),
// on the world's city object, so every League with a gym there shares it. A League with a gym in a site can build a
// Sanctuary there (a slot, 3 levels at the usual prices): it earns UPGRADES.sanct.income a week and SANCT_PRESTIGE a level
// each New Year while open.
// (0.37.0, ranch part 3) the site timer is gone: a site lasts while its legendaries are in the world (one is), and keeps
// the last SITE_KEEP legendaries found there (c.site.sps). A Sanctuary is open while one of them is with the League
// (sanctOpen, 5-engine-4) and sealed otherwise: no income, upkeep or prestige.
const SANCT_PRESTIGE = 1, SITE_KEEP = 4;
const siteOn = c => !!(c && c.site);
function noteSite(gi, sp) {
  const g = S.gyms[gi]; const c = g && S.cities[g.city]; if (!c) return;
  const was = siteOn(c), sps = was ? (c.site.sps || [c.site.sp]).filter(x => lineOf(x) !== lineOf(sp)) : [];
  c.site = { sp, from: was ? c.site.from : S.season, sps: sps.concat(sp).slice(-SITE_KEEP) };
  if (!was) news(`${c.name} is now a legendary site, where ${sp} was found. Leagues with a gym there can build a Sanctuary, open while ${sp} is with them.`, 'league');
}
function sanctIncome() { return sanctuaries().filter(s => s.open).reduce((a, s) => a + UPGRADES.sanct.income[s.lv - 1], 0); }
// open Sanctuary levels, for prestige
function sanctLevels() { return sanctuaries().filter(s => s.open).reduce((a, s) => a + s.lv, 0); }
const scoutLv = () => S.seatB && !lapsed() ? upLevel(S.seatB, 'scout') : 0;
// where a member of staff works, for the training hall: their gym, or the seat
// (0.64.0) a gym's Gym Leader and gym trainers: its Trainer's School (with a Professor's level) instead of a gym hall
function hallLv(t) { const p = postOf(t); if (!p) return 0; return p.post === 'e4' || p.post === 'champion' ? placeLv('seat', 'hall') : schoolLv(p.slot); }

// ================= CITY BUILDINGS, PART 1 (0.63.0; design doc cities-and-economy.md) =================
// Visitors, the Stadium's tickets, the Hotel, the Pokémon Center and the Berry Farm. All numbers provisional.
const STADIUM_EDGE = 0.015, STADIUM_SEATS = [500, 1000, 2000, 4000, 7000, 12000], SEAT_STADIUM = 2;
const HOTEL_ROOMS = [4, 8, 14, 22, 32], HOTEL_CTRL = [1, 1.1, 1.2, 1.3], HOTEL_AWAY_LV = 3;
const VISIT_PARTY = 3; // a challenger in town brings a party (family, friends, fans): the guests a Hotel can fill
const CENTER_HOME = 0.5, CENTER_ALL = 0.1, CENTER_CUT_MAX = 3;
const BERRY_PLOTS = [2, 4, 7, 10], BERRY_SELL = 50, BERRY_FEED = 0.02, BERRY_FEED_MAX = 0.2, BERRY_CLASSES = ['Aroma Lady', 'Gardener'];
const lgLapsed = i => { const L = lgObj(i); return !!(L && L.fin && L.fin.money < 0); };
// the seat has no city: it counts as the League's biggest gym city (a City at least, for its Stadium's crowd)
function seatSize() { return Math.max(1, ...S.gyms.map(g => citySize(S.cities[g.city]))); }
// what a city of a region pays out a week to the Leagues there (split by control, cityShare): its income by size, plus
// what last week's visitors spent in town
const cityPool = c => CITY_INCOME_AT(citySize(c)) + VISIT_SPEND_AT(citySize(c)) * ((c && c.vw) || 0);
// ---------- visitors ----------
// Each week (world-level, before the books): every challenger out on a run is a visitor-week in the city of the gym
// they are heading for; every challenger resting between runs is one in the city of the Pokémon Center they rest at
// (the League they last challenged: one in their hometown, else its best). c.vw is this week's count, c.vy this year's,
// c.vly last year's; c.away this week's from another region (the Hotel's level 3 perk). Then the city's Hotels share
// the week's guests (VISIT_PARTY a visitor): c.hg[lg] = guests in League lg's Hotel there.
function centerCity(L, lg, t) {
  if (!L || !L.gyms || lgLapsed(lg)) return null;
  let best = null, bl = 0; const hc = homeCity(t);
  for (const g of L.gyms) { const c = S.cities[g.city], lv = c ? upLevel(cityB(c, lg), 'center') : 0; if (!lv) continue; if (g.city === hc) return c; if (lv > bl) { bl = lv; best = c; } }
  return best;
}
function visitorsWeek() {
  const cs = Object.values(S.cities || {}); if (!cs.length) return;
  for (const c of cs) { c.vw = 0; c.away = 0; }
  for (let i = 0; i < nLeagues(); i++) {
    const L = lgObj(i); if (!L || !L.gyms) continue;
    for (const id of L.challengers || []) {
      const t = T(id); if (!t || t.role !== 'challenger') continue;
      let c = null;
      if (t.rest == null) { const gy = t.gymAt != null ? L.gyms[t.gymAt] : null; c = gy ? S.cities[gy.city] : null; }
      else if (t.rest > S.turn) c = centerCity(L, i, t);
      if (!c) continue;
      c.vw++; c.vy = (c.vy || 0) + 1;
      if (t.home && t.home.r !== c.region) c.away++;
    }
  }
  // the Hotels: rooms × the control weight; guests go out in proportion, no Hotel past its rooms, the rest to those with room
  const m = gymMap();
  for (const c of cs) {
    c.hg = null;
    const lgs = (m[c.id] || []).filter(i => !lgLapsed(i)), hs = lgs.map(i => ({ i, lv: upLevel(cityB(c, i), 'hotel') })).filter(x => x.lv);
    if (!hs.length || !c.vw) continue;
    let left = c.vw * VISIT_PARTY;
    const ctl = c.ctrl != null && c.tier != null ? c : null;
    for (const h of hs) { h.room = HOTEL_ROOMS[h.lv - 1]; h.w = h.room * (ctl && ctl.ctrl === h.i ? HOTEL_CTRL[ctl.tier] : 1); h.g = 0; }
    for (let pass = 0; pass < 3 && left > 0; pass++) {
      const open = hs.filter(h => h.g < h.room), tw = open.reduce((a, h) => a + h.w, 0); if (!tw) break;
      let given = 0;
      for (const h of open) { const n = Math.min(h.room - h.g, Math.floor(left * h.w / tw + 1e-9) || (pass === 2 ? 1 : 0)); h.g += n; given += n; }
      left -= given; if (!given) break;
    }
    c.hg = {}; for (const h of hs) if (h.g) c.hg[h.i] = h.g;
  }
  buildings2World(); // (0.64.0) the Department Stores' shoppers, the item bags
}
// the bound League's Hotel income this week: guests × the room rate by size (a guest from another region twice, from level 3)
function hotelIncome() {
  if (lapsed()) return 0;
  const lg = cityLg(); let a = 0;
  for (const g of S.gyms) {
    const c = S.cities[g.city]; if (!c || !c.hg || !c.hg[lg]) continue;
    const n = c.hg[lg], lv = upLevel(cityB(c), 'hotel'), away = lv >= HOTEL_AWAY_LV && c.vw ? Math.min(n, Math.round(n * c.away / c.vw)) : 0;
    a += (n + away) * ROOM_AT(citySize(c));
  }
  return Math.round(a);
}
// ---------- the Stadium's tickets ----------
// Every try at a gym, and every Elite Four and title battle at the seat, sells tickets: the crowd is CROWD_AT(size) ×
// the battle's hype, up to the Stadium's seats, at TICKET_AT(size) a seat. Hype: the challenger's badges, their prestige
// or fame (or the leader's), a local hero on either side, a legendary on either side, a gym that is holding well.
function stadiumSeats(where) {
  const lv = lapsed() ? 0 : placeLv(where, 'stadium');
  return STADIUM_SEATS[Math.min(lv, STADIUM_SEATS.length - 1)];
}
function crowdHype(t, foe, base, cityId) {
  let h = base + Math.min(0.3, trainerPrestige(t) / 200) + (t.famous || (foe && foe.famous) ? 0.2 : 0);
  if (cityId != null && (homeCity(t) === cityId || (foe && homeCity(foe) === cityId))) h += 0.25;
  if ((t.team || []).concat((foe && foe.team) || []).some(m => SP[m.sp] && SP[m.sp].legend)) h += 0.3;
  return clamp(h, 0.4, 2.6);
}
const TIX_LOG = { sold: 0, battles: 0, full: 0 };
function ticketSale(where, hype) {
  if (!booksOn() || fixedStaff()) return 0;
  const c = where === 'seat' ? null : S.cities[(S.gyms[where] || {}).city];
  const size = where === 'seat' ? seatSize() : citySize(c), seats = stadiumSeats(where);
  const crowd = Math.round(CROWD_AT(size) * hype), sold = Math.min(seats, crowd), amt = Math.round(sold * TICKET_AT(size));
  if (!amt) return 0;
  book(amt, 'tickets');
  const f = S.fin; f.tix = f.tix || {}; const key = where === 'seat' ? 'seat' : c.id; f.tix[key] = (f.tix[key] || 0) + amt;
  TIX_LOG.sold += amt; TIX_LOG.battles++; if (crowd >= seats) TIX_LOG.full++;
  return amt;
}
// a try at gym g (from gymTry): the hype of the challenger's stage and the gym's record this year
function gymTickets(g, t) {
  const gym = S.gyms[g]; if (!gym) return;
  const held = gym.w + gym.l >= 10 ? gym.w / (gym.w + gym.l) : 0;
  ticketSale(g, crowdHype(t, T(gym.leader), 0.6 + 0.8 * (t.badges.length / 7) + (held >= 0.75 ? 0.1 : 0), gym.city));
}
// an Elite Four battle (k 0 to 3) or the title battle (k 4) at the seat
const seatTickets = (t, foe, k) => ticketSale('seat', crowdHype(t, foe, k >= 4 ? 2 : 1.3 + 0.1 * k, null));
// (0.63.0) each New Year: this year's tickets and visitors become last year's
function cityYearRoll() {
  for (const c of Object.values(S.cities || {})) { c.vly = c.vy || 0; c.vy = 0; }
  eachLeague(() => { if (S.fin) { S.fin.tixL = S.fin.tix || {}; S.fin.tix = {}; } });
}
// the seat's Stadium, which every League has from its founding (initBooks): level SEAT_STADIUM, which cost nothing
function seatStadium() { const b = seatB(); if (!b.some(x => x.k === 'stadium')) b.push({ k: 'stadium', lv: SEAT_STADIUM, base: SEAT_STADIUM }); }
// ---------- the Pokémon Center ----------
// how many weeks the bound League's Centers cut off a resting challenger's rest
function centerCut() { if (lapsed()) return 0; return Math.min(CENTER_CUT_MAX, S.gyms.filter(g => S.cities[g.city] && upLevel(cityB(S.cities[g.city]), 'center')).length); }
// League i's pull in the regional draw from its Centers, for a challenger whose hometown city is hc
function centerDraw(i, hc) {
  const L = lgObj(i); if (!L || !L.gyms || lgLapsed(i)) return 0;
  let all = 0, home = 0;
  for (const g of L.gyms) { const c = S.cities[g.city], lv = c ? upLevel(cityB(c, i), 'center') : 0; all += lv; if (g.city === hc) home = lv; }
  return CENTER_HOME * home + CENTER_ALL * all;
}
// ---------- the Berry Farm ----------
// x: the Farm's building entry ({ k: 'berry', lv, feed }: plots set to feed). Its plots, and its yield in plots (one
// more with a Grass gym in its city or an Aroma Lady or Gardener on the staff)
const berryPlots = x => BERRY_PLOTS[x.lv - 1] || 0;
function berryBonus(gi) {
  const ld = T((S.gyms[gi] || {}).leader);
  return (ld && specTypes(ld).includes('Grass')) || staffIds().some(id => { const t = T(id); return t && BERRY_CLASSES.includes(t.cls); }) ? 1 : 0;
}
function berryFarms() {
  const out = [];
  S.gyms.forEach((g, gi) => { const c = S.cities[g.city], x = c && cityB(c).find(y => y.k === 'berry'); if (x) out.push({ gi, c, x, plots: berryPlots(x), feed: Math.min(x.feed || 0, berryPlots(x)) }); });
  return out;
}
// the share of the ranch's upkeep the fed plots save
function berryFeedCut() { if (lapsed()) return 0; const n = berryFarms().reduce((a, f) => a + f.feed, 0); return Math.min(BERRY_FEED_MAX, BERRY_FEED * n); }
const berryFeeding = () => !lapsed() && berryFarms().some(f => f.feed > 0);
// the weekly berry sales (booked at each harvest, every 4 weeks): the plots set to sell, plus a plot's yield for the bonus
function berrySales() {
  if (lapsed()) return 0;
  return berryFarms().reduce((a, f) => a + (f.plots - f.feed + berryBonus(f.gi)) * BERRY_SELL, 0);
}
function berryWeek() { if (S.week % 4 === 0) { const a = berrySales() * 4; if (a) book(a, 'berries'); } }
// the player sets how many of a Farm's plots feed the ranch
function setBerryFeed(gi, n) {
  const f = berryFarms().find(x => x.gi === gi); if (!f) return 'No Berry Farm there.';
  f.x.feed = clamp(Math.round(n) || 0, 0, f.plots); return null;
}
// a rival feeds every plot when a fed plot saves more than a sold one earns (a big ranch), else sells
function aiBerry() {
  const fs = berryFarms(); if (!fs.length || !S.ranch) return;
  const feed = BERRY_FEED * ranchUpkeep() > BERRY_SELL;
  let room = Math.round(BERRY_FEED_MAX / BERRY_FEED);
  for (const f of fs) { f.x.feed = feed ? Math.min(f.plots, room) : 0; room -= f.x.feed; }
}
// (0.63.0) whether a rival should buy the next level of k at a place: a Stadium only while its crowds would fill more
// seats, a Hotel only while last year's guests would fill more rooms
function aimWorth(where, k) {
  if (k === 'stadium' && aimOf() !== 'wall') { const lv = placeLv(where, k), size = where === 'seat' ? seatSize() : citySize(S.cities[S.gyms[where].city]); return STADIUM_SEATS[lv] < CROWD_AT(size) * 1.6; }
  if (k === 'hotel') { const c = S.cities[S.gyms[where].city], lv = placeLv(where, k); return (c.vly || 0) * VISIT_PARTY / YEAR_WEEKS > (lv ? HOTEL_ROOMS[lv - 1] : 0) * 0.8; }
  // (0.64.0) a money-maker's Schools and Stores stop at level 2; the Lab and the Store work from the best one, so a rival
  // raises its best rather than building a second
  if ((k === 'school' || k === 'store') && aimOf() === 'money' && placeLv(where, k) >= 2) return false;
  if (k === 'lab') return placeLv(where, k) === labBuilt();
  if (k === 'store') return placeLv(where, k) === storeBuilt();
  return true;
}
