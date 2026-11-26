// ================= CITY BUILDINGS, PART 2 (0.64.0; design docs cities-and-economy.md and design-update-city-buildings.md) =================
// Staff strength: the Trainer's School, the Move Tutor, the Research Lab and the Department Store with the League's item
// bag. The UPGRADES entries are in 5b-engine-3b. All numbers provisional.

// ---------- the Trainer's School ----------
// A gym city's own source of gym trainers. Each level (one more with a Professor anywhere on the staff) graduates one
// student a year, spread through the year: 16 to 20, from that city, of a class that fits the gym, starting at the
// regional field's gym-trainer cut (gtCircuitCut) + SCHOOL_OVR a level. A graduate takes an open gym trainer place at
// that gym, then one at the League's other gyms that they fit; a rival League also lets a holder at least SCHOOL_WEAKER
// OVR weaker go when their short contract is nearly up; otherwise they set out on the region's field, likelier to take
// their School's League's offers (as academy prospects are). A graduate is paid SCHOOL_PAY of the usual wage by their
// own League (by the School's built level when they graduated). The School also carries the old gym-city training
// hall's growth bonus for the Gym Leader and gym trainers there (hallLv in 5b); the hall itself is seat-only now.
const SCHOOL_PAY = [0.9, 0.82, 0.74, 0.65], SCHOOL_OVR = 2, SCHOOL_WEAKER = 3, SCHOOL_MAX_EFF = 5, SCHOOL_KEEP = 30;
const SCHOOL_LOG = { grads: 0, gym: 0, other: 0, renewal: 0, field: 0 };
const isProfessor = t => !!(t && /Professor/.test(t.cls || ''));
const professorOn = () => staffIds().some(id => { const t = T(id); return t && !t.acting && isProfessor(t); });
// the School's working level at gym gi (its built level, +1 for a Professor), 0 without one or in the red
function schoolLv(gi) { if (lapsed()) return 0; const lv = placeLv(gi, 'school'); return lv ? Math.min(SCHOOL_MAX_EFF, lv + (professorOn() ? 1 : 0)) : 0; }
const ownSchool = t => !!(t && t.school && t.school.lg === (S.lg || 0));
// academy prospects and School graduates both lean toward their own League's offers
const ownYouth = t => ownAcademy(t) || ownSchool(t);
const schoolPay = (t, post) => post === 'gymtrainer' && ownSchool(t) ? SCHOOL_PAY[clamp((t.school.lv || 1) - 1, 0, SCHOOL_PAY.length - 1)] : 1;
// the gym trainer picker lists the League's own graduates first
const schoolRank = t => ownSchool(t) ? 1 : 0;
function schoolGrads() { const f = S.fin; if (!f) return []; return f.grads = (f.grads || []).filter(x => x.season >= S.season - 1).slice(0, SCHOOL_KEEP); }
function schoolWeek() {
  if (!S.fin || fixedStaff() || lapsed() || S.founding) return;
  S.gyms.forEach((g, gi) => {
    const eff = schoolLv(gi); if (!eff) return;
    for (let n = 0; n < eff; n++) if (S.week === (Math.floor((n + 0.5) * YEAR_WEEKS / eff) + gi * 5) % YEAR_WEEKS) graduate(gi, placeLv(gi, 'school'), eff);
  });
}
// a place gym trainer k at gym gj that a graduate t can take now (empty, or held by nobody in post), or -1
function openGtPlace(gj, t) {
  const h = S.gyms[gj], L = h && T(h.leader); if (!L || h.acting || !gymFits(t, L)) return -1;
  for (let k = 0; k < GYM_TRAINERS; k++) { const x = T((h.trainers || [])[k]); if (!x || x.role !== 'gymtrainer') return k; }
  return -1;
}
function graduate(gi, lv, eff) {
  const g = S.gyms[gi], L = T(g.leader), c = S.cities[g.city]; if (!L || !c) return null;
  const ty = specTypes(L), cut = gtCircuitCut(), base = isFinite(cut) ? cut : 48;
  const t = newTrainer({ age: ri(16, 20), quality: base, role: 'prospect', specialty: ty.length ? pick(ty) : (rand() < 0.14 ? null : pick(TYPES)), noFamous: true });
  setOvr(t, Math.round(base + SCHOOL_OVR * eff));
  const ids = Object.values(S.cities).filter(x => x.region === c.region).sort((a, b) => a.id - b.id).map(x => x.id);
  t.home = { r: c.region, i: Math.max(0, ids.indexOf(c.id)) };
  t.school = { lg: S.lg || 0, city: c.id, gym: gi, lv, at: S.turn };
  starterTeam(t, 9);
  SCHOOL_LOG.grads++;
  const rec = { id: t.id, gym: gi, season: S.season, at: S.turn, to: 'field' };
  const order = [gi].concat(S.gyms.map((_, j) => j).filter(j => j !== gi));
  for (const gj of order) { const k = openGtPlace(gj, t); if (k < 0) continue;
    takeGymTrainer(t, gj, k, `${dn(t)} graduated from the Trainer's School in ${c.name} and became a gym trainer at ${townName(gj)} Gym.`);
    rec.to = gj === gi ? 'gym' : 'other'; rec.gj = gj; SCHOOL_LOG[rec.to]++; break; }
  // (provisional) a rival League lets a weaker gym trainer go at the end of their contract to take a graduate on; your
  // League's graduates go to the field instead, and your gym trainer picker lists them first
  if (rec.to === 'field' && !playerLeague()) {
    for (const gj of order) { const h = S.gyms[gj], Lj = T(h.leader); if (!Lj || h.acting || !gymFits(t, Lj)) continue;
      const k = (h.trainers || []).map((id, kk) => ({ x: T(id), kk })).filter(o => o.x && o.x.role === 'gymtrainer' && ovr(o.x) <= ovr(t) - SCHOOL_WEAKER && o.x.con && o.x.con.until - S.turn <= 4).sort((a, b) => ovr(a.x) - ovr(b.x))[0];
      if (!k) continue;
      const old = k.x; h.trainers[k.kk] = null; closePost(old); retireOrReturn(old, `was not kept on at ${townName(gj)} Gym when a School graduate came in`);
      takeGymTrainer(t, gj, k.kk, `${dn(t)} graduated from the Trainer's School in ${c.name} and took ${old.name}'s place at ${townName(gj)} Gym.`);
      rec.to = 'renewal'; rec.gj = gj; SCHOOL_LOG.renewal++; break; }
  }
  if (rec.to === 'field') {
    joinCircuit(t, S.lg || 0); t.rest = S.turn + ri(1, 3); t.early = 0; SCHOOL_LOG.field++;
    news(`${dn(t)} graduated from the Trainer's School in ${c.name} and is setting out as a challenger.`, 'circuit', t.id);
  }
  S.fin.grads = [rec].concat(schoolGrads()).slice(0, SCHOOL_KEEP);
  return t;
}

// ---------- the Move Tutor ----------
// Lessons for the staff at its place: the Gym Leader and gym trainers of that city's gym, or the Elite Four and the
// Champion when it is at the seat. A tutored Pokémon learns all three of its line's coverage types, each TUTOR_SOONER
// levels sooner, in the order its trainer's Strategy picks (the types that answer the year's meta first, for a sharp
// strategist); at level 3 a backup-type Pokémon puts the types that hit its trainer's own threats first. A lesson stays
// with the Pokémon (and its ranch entry) for good. Level 1 teaches TUTOR_FEW Pokémon a post (planned ones first, then
// the strongest), level 2 the whole team. Lessons are given once a month.
const TUTOR_SOONER = 10, TUTOR_FEW = 2;
const TUTOR_LOG = { taught: 0, ranch: 0 };
const tutorAt = where => lapsed() ? 0 : placeLv(where, 'tutor');
// the coverage a tutored Pokémon m of trainer t learns, best first
function tutorCov(t, m) {
  const opts = coverOptions(m.sp).map(c => ({ t: c.t, lv: Math.max(1, c.lv - TUTOR_SOONER) }));
  const meta = metaTypes('year'), sharp = clamp(((t && t.r ? t.r.str : 50) - 30) / 60, 0, 1);
  const own = t ? specTypes(t) : [], threats = own.length ? TYPES.filter(a => own.some(d => effOne(a, d) >= 2)) : [];
  const where = t && postOf(t) ? (['e4', 'champion'].includes(postOf(t).post) ? 'seat' : postOf(t).slot) : null;
  const back = m.backup && where != null && tutorAt(where) >= 3;
  const sc = c => sharp * (meta.includes(c.t) ? 2 : 0) + (back ? 2 * threats.filter(a => effOne(c.t, a) >= 2).length : 0) + (1 - sharp) * rand() - c.lv / 100;
  return opts.map(c => [c, sc(c)]).sort((a, b) => b[1] - a[1]).map(x => x[0]);
}
function teach(t, m) {
  if (!m || !SP[m.sp]) return false;
  m.cov = tutorCov(t, m); m.tut = 1;
  if (m.rid != null) { const e = ranchEntry(m.rid); if (e) e.tut = 1; }
  refreshMoves(m);
  return true;
}
function tutorPosts(where) {
  if (where === 'seat') return [S.champion, ...S.e4].map(T).filter(t => t && !t.acting);
  const g = S.gyms[where]; if (!g) return [];
  return [g.leader, ...(g.trainers || [])].map(T).filter(t => t && STAFF_ROLES.includes(t.role));
}
// once a month: lessons at every Tutor, and ranch Pokémon taught before keep their lesson on whoever fields them
function tutorWeek() {
  if (!S.fin || fixedStaff() || S.week % 4 !== 2) return;
  for (const id of seniorIds()) for (const m of T(id).team) if (!m.tut && m.rid != null) { const e = ranchEntry(m.rid); if (e && e.tut) { teach(T(id), m); TUTOR_LOG.ranch++; } }
  const f = S.fin; f.tutored = f.tutored || {};
  for (const where of ['seat'].concat(S.gyms.map((_, i) => i))) {
    const lv = tutorAt(where); if (!lv) continue;
    for (const t of tutorPosts(where)) {
      const have = t.team.filter(m => m.tut).length, room = lv >= 2 ? t.team.length - have : Math.max(0, TUTOR_FEW - have);
      if (room <= 0) continue;
      const cand = t.team.filter(m => !m.tut && !m.stop).sort((a, b) => (isPlanned(t, b) - isPlanned(t, a)) || monPower(b) - monPower(a)).slice(0, room);
      for (const m of cand) if (teach(t, m)) { TUTOR_LOG.taught++; f.tutored[where] = (f.tutored[where] || 0) + 1; }
    }
  }
}

// ---------- the Research Lab ----------
// League-wide, from the best Lab (catching trips aren't tied to a city): +LAB_SCOUT Scouting a level for catching
// trips, a grade floor of 2 from level 2 and 3 from level 4, one more trip out at a time from level 3, condition hunts
// LAB_HUNT likelier a level, and at level 4 ordinary trips roll condition odds at ×LAB_COND. A Scientist on the staff
// counts as one more level. Research grants: LAB_GRANT × the level for every new species the League's ranch takes in
// that its region is home to (a first step toward the regional Pokédex, which isn't built yet).
const LAB_SCOUT = 3, LAB_HUNT = 0.05, LAB_COND = 1.5, LAB_GRANT = 500, LAB_MAX_EFF = 5;
const LAB_LOG = { grants: 0, paid: 0 };
const scientistOn = () => staffIds().some(id => { const t = T(id); return t && !t.acting && t.cls === 'Scientist'; });
function labBuilt() { let best = 0; for (const g of S.gyms || []) { const c = S.cities[g.city]; if (c) best = Math.max(best, upLevel(cityB(c), 'lab')); } return best; }
function labLv() { if (!S.fin || lapsed()) return 0; const b = labBuilt(); return b ? Math.min(LAB_MAX_EFF, b + (scientistOn() ? 1 : 0)) : 0; }
const labScout = () => LAB_SCOUT * labLv();
const labFloor = () => labLv() >= 4 ? 3 : labLv() >= 2 ? 2 : 1;
const labTrips = () => labLv() >= 3 ? 1 : 0;
const labHunt = () => 1 + LAB_HUNT * labLv();
const labCond = () => labLv() >= 4 ? LAB_COND : 1;
// the species the League's ranch has ever held (S.ranch.dex); a new one of its region pays a grant while it has a Lab
function labWeek() {
  const R = S.ranch; if (!R) return;
  const all = R.mons.concat(R.stock || [], (R.dc && R.dc.pool) || []), first = !R.dex;
  const dex = new Set(R.dex || []), hs = homeSet(S.region), lv = labLv();
  let n = 0;
  for (const e of all) for (const sp of [e.b, e.sp]) {
    if (!sp || dex.has(sp)) continue; dex.add(sp);
    if (!first && lv && (!hs || hs.has(e.b))) n++;
  }
  R.dex = [...dex];
  if (n && booksOn()) { const a = n * LAB_GRANT * lv; book(a, 'grants', `Research grants for ${n} new species`); LAB_LOG.grants += n; LAB_LOG.paid += a; }
}

// ---------- the Department Store and the item bag ----------
// Staff keep the free supply of tier 1 items (under the old rules for who holds one). Tier 2 and 3 items come only from
// the League's item bag (S.fin.bag: { item: count }), bought at its Stores: floors (League-wide, the best Store's)
// carry shelves by STORE_SHELF; each floor above a shelf takes STORE_FLOOR_OFF off its prices. The bag serves the
// Gym Leaders, Elite Four and Champion: one item a Pokémon, back in the bag when the Pokémon leaves the team or its
// holder the League. A hired challenger's tier 2 and 3 items go into the bag. Shoppers (a city's visitors plus
// residents by size) spend at the city's Stores, shared by floors × the Hotel's gentle control weights.
const STORE_SHELF = { leftovers: 2, eviolite: 2, assaultvest: 2, expertbelt: 3, focussash: 3, lifeorb: 4, choiceband: 4, choicespecs: 4 };
const ITEM_PRICE = [2000, 8000, 25000], STORE_FLOOR_OFF = 0.1, STORE_SHOPPERS = 5;
const SHOP_RESIDENTS_AT = k => Math.round(4 * Math.pow(1.8, k)), SHOP_SPEND_AT = k => Math.round(20 * Math.pow(1.5, k));
const ITEM_LOG = { bought: 0, spent: 0, hired: 0, back: 0, aiBought: 0 };
const shelfOf = k => STORE_SHELF[k] || (ITEMS[k] && ITEMS[k].tier === 1 ? 1 : 99);
// the bag rule is on for every League that keeps books (not the wall report's fixed tiers)
const bagRule = () => !!(S.fin && !fixedStaff() && itemsOn());
const itemFreeOk = k => !bagRule() || (ITEMS[k] && ITEMS[k].tier === 1);
function storeBuilt() { let best = 0; for (const g of S.gyms || []) { const c = S.cities[g.city]; if (c) best = Math.max(best, upLevel(cityB(c), 'store')); } return best; }
const storeFloors = () => (!S.fin || lapsed()) ? 0 : storeBuilt();
const bagOf = () => (S.fin ? S.fin.bag = S.fin.bag || {} : {});
function itemPrice(k) { const fl = storeFloors(), sh = shelfOf(k); return Math.round(ITEM_PRICE[(ITEMS[k] || { tier: 1 }).tier - 1] * (1 - STORE_FLOOR_OFF * Math.max(0, fl - sh)) / 50) * 50; }
// items on sale now: every item on the floors the League's best Store has
const shelfItems = () => { const fl = storeFloors(); return Object.keys(ITEMS).filter(k => shelfOf(k) <= fl && k !== 'everstone'); };
// bag items fielded by the bound League's senior staff (leaving one trainer out)
function bagUsed(except) {
  const out = {}, lg = S.lg || 0;
  for (const id of seniorIds()) { if (id === except) continue; for (const m of T(id).team) if (m.item && m.bagLg === lg) out[m.item] = (out[m.item] || 0) + 1; }
  return out;
}
const bagFree = k => (bagOf()[k] || 0) - (bagUsed()[k] || 0);
// after the free supply: the best bag items for senior trainer t's team (from eliteItems; held = the non-type items it holds)
function bagEquip(t, held) {
  for (const m of t.team) delete m.bagLg;
  if (!['leader', 'e4', 'champion'].includes(t.role) || t.acting) return;
  const bag = bagOf(), keys = Object.keys(bag).filter(k => bag[k] > 0 && ITEMS[k]); if (!keys.length) return;
  const used = bagUsed(t.id), lg = S.lg || 0;
  for (const m of t.team.slice().sort((a, b) => b.lvl - a.lvl || SP[b.sp].bst - SP[a.sp].bst)) {
    const cur = m.item ? itemScore(m, m.item, t) : 0;
    let best = null, bv = cur + 0.5;
    for (const k of keys) { if ((bag[k] || 0) - (used[k] || 0) <= 0 || (!ITEMS[k].type && held.has(k))) continue; const v = itemScore(m, k, t); if (v > bv) { best = k; bv = v; } }
    if (!best) continue;
    if (m.item && !ITEMS[m.item].type) held.delete(m.item);
    m.item = best; m.bagLg = lg; used[best] = (used[best] || 0) + 1; if (!ITEMS[best].type) held.add(best);
  }
}
// re-equip every senior member of staff (after a purchase)
function equipSenior() { for (const id of seniorIds()) { const t = T(id); if (t && !t.acting) eliteItems(t); } }
function buyItem(k, lg = ME()) {
  return inLeague(lg, () => {
    if (!booksOn()) return 'Money is off.';
    if (!itemsOn()) return 'Held items are switched off in this world.';
    if (!ITEMS[k]) return 'No such item.';
    if (!shelfItems().includes(k)) return storeFloors() ? 'Your Department Stores have no floor that sells it.' : 'You need a Department Store.';
    const price = itemPrice(k); if (!canSpend(price)) return 'Not enough money.';
    book(-price, 'items', `Bought a ${itemName(k)} at the Department Store`);
    const bag = bagOf(); bag[k] = (bag[k] || 0) + 1;
    ITEM_LOG.bought++; ITEM_LOG.spent += price;
    equipSenior();
    return null;
  });
}
// a challenger hired to a senior post brings their tier 2 and 3 items into the League's bag (from storeHire)
function bagHire(t, role, was) {
  if (was || t.acting || !['leader', 'e4', 'champion'].includes(role) || !bagRule()) return;
  const got = [];
  t.bag = (t.bag || []).filter(k => { if (ITEMS[k] && ITEMS[k].tier >= 2) { got.push(k); return false; } return true; });
  for (const m of t.team) if (m.item && ITEMS[m.item] && ITEMS[m.item].tier >= 2 && m.bagLg == null) { got.push(m.item); m.item = null; }
  if (!got.length) return;
  const bag = bagOf(); for (const k of got) bag[k] = (bag[k] || 0) + 1;
  ITEM_LOG.hired += got.length;
  if (playerLeague()) news(`${dn(t)} brought ${got.map(itemName).join(', ')} into the League's item bag.`, 'move', t.id);
}
// world-level, monthly: a League's bag items on anyone no longer on its senior staff go back to its bag
function bagSync() {
  if (S.week % 4) return;
  const sen = []; for (let i = 0; i < nLeagues(); i++) sen.push(new Set(inLeague(i, () => seniorIds())));
  for (const t of Object.values(S.trainers)) for (const m of t.team || []) if (m.bagLg != null && !(sen[m.bagLg] && sen[m.bagLg].has(t.id))) { m.item = null; delete m.bagLg; ITEM_LOG.back++; }
}
// world-level, weekly after the Hotels: each city's shoppers (its visitors plus residents by size) shared among the Stores
// of the Leagues there (not in the red) by floors × the control weight, none past its floors' capacity: c.sg[lg]
function shoppersWeek() {
  const m = gymMap();
  for (const c of Object.values(S.cities || {})) {
    c.sg = null;
    const st = (m[c.id] || []).filter(i => !lgLapsed(i)).map(i => ({ i, lv: upLevel(cityB(c, i), 'store') })).filter(x => x.lv);
    if (!st.length) continue;
    let left = (c.vw || 0) + SHOP_RESIDENTS_AT(citySize(c));
    for (const s of st) { s.cap = s.lv * STORE_SHOPPERS; s.w = s.lv * (c.ctrl === s.i && c.tier != null ? HOTEL_CTRL[c.tier] : 1); s.g = 0; }
    for (let pass = 0; pass < 3 && left > 0; pass++) {
      const open = st.filter(s => s.g < s.cap), tw = open.reduce((a, s) => a + s.w, 0); if (!tw) break;
      let given = 0;
      for (const s of open) { const n = Math.min(s.cap - s.g, Math.floor(left * s.w / tw + 1e-9) || (pass === 2 ? 1 : 0)); s.g += n; given += n; }
      left -= given; if (!given) break;
    }
    c.sg = {}; for (const s of st) if (s.g) c.sg[s.i] = s.g;
  }
}
function storeIncome() {
  if (lapsed()) return 0;
  const lg = S.lg || 0; let a = 0;
  for (const g of S.gyms) { const c = S.cities[g.city]; if (c && c.sg && c.sg[lg]) a += c.sg[lg] * SHOP_SPEND_AT(citySize(c)); }
  return Math.round(a);
}
// a rival buys at most one item a month by aim: wall-builders tier 3 first, star-makers tier 2 and 3, money-makers only
// the cheaper tier 2 shelves; only an item none of its bag can cover and a senior Pokémon would use, within its spare
function aimItems(aim) {
  const fl = storeFloors(); if (!fl || !bagRule() || S.fin.money < 0 || rand() < 0.5) return;
  const spare = S.fin.money - AIMS[aim].reserve, maxTier = aim === 'money' ? 2 : 3;
  const ks = shelfItems().filter(k => ITEMS[k].tier >= 2 && ITEMS[k].tier <= maxTier && bagFree(k) <= 0 && itemPrice(k) <= spare);
  if (!ks.length) return;
  const mons = seniorIds().map(T).filter(t => !t.acting).flatMap(t => t.team.map(m => ({ t, m })));
  let best = null, bv = 3;
  for (const k of ks) { const g = Math.max(0, ...mons.map(x => itemScore(x.m, k, x.t) - (x.m.item ? itemScore(x.m, x.m.item, x.t) : 0))) * (aim === 'wall' && ITEMS[k].tier === 3 ? 1.3 : 1); if (g > bv) { best = k; bv = g; } }
  if (best && !buyItem(best, S.lg || 0)) ITEM_LOG.aiBought++;
}

// ---------- the weekly and world hooks ----------
// per League, from moneyWeek: Store shoppers, School graduations, Tutor lessons, Lab grants
function buildings2Week(lap) {
  if (!S.fin) return;
  if (!lap) { const s = storeIncome(); if (s) book(s, 'shops'); }
  fanWeek(lap); // (0.71.0) the Fan Clubs' members
  cornerWeek(lap); // (0.70.0) the Game Corner's take and its prize counter
  schoolWeek(); tutorWeek(); labWeek();
  buildings3Week(lap); // (0.65.0) the Airport, the Bug Catching Contest, the Fishing Pier, the Fossil Lab
  // staff equipped before the League kept books (a League founded by hand) or by another path re-equip under the bag rule
  if (bagRule()) { const lg = S.lg || 0; for (const id of staffIds()) { const t = T(id); if (t && t.team.some(m => m.item && ITEMS[m.item] && ITEMS[m.item].tier >= 2 && m.bagLg !== lg)) { eliteItems(t); ITEM_LOG.fixed = (ITEM_LOG.fixed || 0) + 1; } } }
}
// world-level, from visitorsWeek
function buildings2World() { shoppersWeek(); cornerPlayersWeek(); bagSync(); }

if (typeof module !== 'undefined') Object.assign(module.exports, { SCHOOL_PAY, SCHOOL_LOG, schoolLv, ownSchool, ownYouth, schoolPay, schoolRank, schoolGrads, graduate, isProfessor, TUTOR_LOG, TUTOR_SOONER, tutorAt, tutorCov, teach, LAB_LOG, labLv, labBuilt, labScout, labFloor, labTrips, labHunt, labCond, LAB_GRANT, ITEM_LOG, STORE_SHELF, ITEM_PRICE, shelfOf, bagRule, itemFreeOk, storeFloors, storeBuilt, bagOf, itemPrice, shelfItems, bagUsed, bagFree, buyItem, equipSenior, storeIncome, SHOP_SPEND_AT, aimItems });

// ================= CITY BUILDINGS, PART 3 (0.65.0; design docs cities-and-economy.md, design-update-city-buildings.md, design-update-buildings-part3.md) =================
// Reach and catching: the Airport, the Bug Catching Contest, the Fishing Pier and the Fossil Lab, and the keep-grade
// rule the three catching buildings share. The UPGRADES entries are in 5b-engine-3b. All numbers provisional.

// ---------- conditions for the conditioned buildings ----------
// A Bug Catching Contest needs a Bug gym in that city or a Bug Catcher or Bug Maniac on the staff; a Fishing Pier a port
// (not a railway), a Water gym there or a Fisherman on the staff; a Fossil Lab a Research Lab at level 2 there. A lost
// condition keeps the building working, but it can't be raised (buildCheck).
const CONTEST_CLASSES = ['Bug Catcher', 'Bug Maniac'], PIER_CLASSES = ['Fisherman'];
const classOn = cls => staffIds().some(id => { const t = T(id); return t && !t.acting && cls.includes(t.cls); });
const gymTyped = (gi, ty) => { const ld = T((S.gyms[gi] || {}).leader); return !!ld && specTypes(ld).includes(ty); };
function condWhy(gi, k) {
  const g = S.gyms[gi], c = g && S.cities[g.city]; if (!c) return null;
  if (k === 'contest' && !gymTyped(gi, 'Bug') && !classOn(CONTEST_CLASSES)) return 'Needs a Bug gym here, or a Bug Catcher or Bug Maniac on your staff.';
  if (k === 'pier' && portKind(c) !== 'port' && !gymTyped(gi, 'Water') && !classOn(PIER_CLASSES)) return 'Needs a port city, a Water gym here, or a Fisherman on your staff.';
  if (k === 'fossil' && placeLv(gi, 'lab') < 2) return 'Needs your Research Lab here at level 2.';
  return utilWhy(gi, k); // (0.72.0) the Power Plant, Wind Farm, Construction Yard and Quarry
}

// ---------- ranch rules and the keep grade (0.66.0; the keep grade 0.65.0) ----------
// The League's ranch rules (S.fin.rr; the Ranch page), each its own toggle: a grade floor for everything that comes in
// on its own (trips, hunts, charters, outbreak trips, Safari finds, the Day Care's young, the catching buildings),
// finds below it sold back at once; make room (a find for a full ranch replaces the weakest spare by value when it is
// worth more, no margin); idle clear-out (spares unfielded idleN weeks sold, keeping the best idleK of each line);
// list first (idle clear-outs, and the weakest spares once the ranch is within RR_NEAR of full, go on the market as
// League sales for RR_LIST_WEEKS before selling back). "Spare": not fielded, reserved, locked, named in a team plan or
// benched by one, and not conditioned unless rr.cond. The Contest, the Pier and the Fossil Lab use the floor unless
// the Cities page sets their own (S.fin.keepB). Rivals: the floor by aim (AI_KEEPG), make room on, their own clear-out
// in aimRanch; conditioned Pokémon protected except by money-makers. All numbers provisional.
const AI_KEEPG = { wall: 2, star: 3, money: 1 };
const RR_DEFAULT = { floor: 2, room: true, idle: false, idleN: 16, idleK: 2, list: false, cond: false };
const RR_LIST_WEEKS = 4, RR_LIST_MAX = 3, RR_NEAR = 3, RR_IDLE_N = [4, 52], RR_IDLE_K = [0, 6];
const RR_LOG = { floor: 0, room: 0, roomNo: 0, idle: 0, listed: 0, listSold: 0, listBack: 0 };
const FIND_LOG = { contest: 0, pier: 0, fossil: 0, kept: 0, sold: 0, full: 0, gate: 0 };
function ranchRules() {
  const f = S.fin; if (!f) return null;
  if (f.aim) return { floor: AI_KEEPG[f.aim] || 1, room: true, idle: false, idleN: 0, idleK: 0, list: false, cond: f.aim === 'money', ai: true };
  return Object.assign({}, RR_DEFAULT, f.rr || {});
}
// a patch of the player's rules: an error or null
function setRanchRules(p) {
  const f = S.fin; if (!f) return 'Money is off.'; if (f.aim) return 'A rival League sets its own.';
  const r = Object.assign({}, RR_DEFAULT, f.rr || {});
  for (const [k, v] of Object.entries(p || {})) {
    if (k === 'floor') { const n = Math.round(+v); if (!(n >= 0 && n <= 5)) return 'Pick a grade floor from 1 to 5, or off.'; r.floor = n; }
    else if (k === 'idleN') { const n = Math.round(+v); if (!(n >= RR_IDLE_N[0] && n <= RR_IDLE_N[1])) return `Pick ${RR_IDLE_N[0]} to ${RR_IDLE_N[1]} weeks.`; r.idleN = n; }
    else if (k === 'idleK') { const n = Math.round(+v); if (!(n >= RR_IDLE_K[0] && n <= RR_IDLE_K[1])) return `Keep ${RR_IDLE_K[0]} to ${RR_IDLE_K[1]} of each line.`; r.idleK = n; }
    else if (['room', 'idle', 'list', 'cond'].includes(k)) r[k] = !!v;
    else return 'No such rule.';
  }
  f.rr = r; return null;
}
// the keep grade of a catching building k: its own (S.fin.keepB[k]) or the League's floor (1 = keep everything)
function keepGrade(k) { const f = S.fin; if (!f) return 1; const o = k && f.keepB && f.keepB[k]; if (o) return o; const r = ranchRules(); return (r && r.floor) || 1; }
function setKeepGrade(k, n) {
  if (!S.fin) return 'Money is off.'; if (!['contest', 'pier', 'fossil'].includes(k)) return 'No such building.';
  if (n == null || n === '' || +n === 0) { if (S.fin.keepB) delete S.fin.keepB[k]; return null; }
  n = Math.round(+n); if (!(n >= 1 && n <= 5)) return 'Pick a grade from 1 to 5.';
  (S.fin.keepB = S.fin.keepB || {})[k] = n; return null;
}
// a spare the rules may sell
const rrSpare = (e, r) => e.at == null && !e.res && !e.lock && e.bench == null && !(e.c && !r.cond) && !plannedRefs(e.uid).length;
// this year's sales by the rules (the Ranch page)
function rrNote(v) { const f = S.fin; if (!f) return; if (!f.rrY || f.rrY.season !== S.season) f.rrY = { season: S.season, n: 0, money: 0 }; f.rrY.n++; f.rrY.money += v; }
function rrBack(e, why, text) {
  const v = Math.round(entryValue(e) * SELL_BACK), wd = entryWords(e);
  S.ranch.mons = S.ranch.mons.filter(x => x !== e);
  if (booksOn() && v) book(v, 'ranchsale', `Sold ${wd} back (${why})`);
  rrNote(v); ranchLog('rules', text, { cost: -v, sold: [wd], why });
  return v;
}
// make room for find e: sell back the weakest spare by value if e is worth more; true if room was made
function makeRoom(e) {
  const r = ranchRules(); if (!r || !r.room || !ranchOn()) return false;
  const v = entryValue(e); let w = null, wv = Infinity;
  for (const x of S.ranch.mons) if (rrSpare(x, r)) { const xv = entryValue(x); if (xv < wv) { w = x; wv = xv; } }
  if (!w || wv >= v) { RR_LOG.roomNo++; return false; }
  RR_LOG.room++; rrBack(w, `to make room for ${entryWords(e)}`, 'Make room: sold back');
  return ranchRoom() > 0;
}
// a find that comes in on its own: 'kept', 'sold' (below the floor; booked and counted here) or 'lost' (no room;
// the caller lets it go or sells it). floor: a building's keep grade (null: the League's floor; 0: none)
function ranchTake(e, floor) {
  if (!ranchOn()) return 'lost';
  const r = ranchRules(), fl = floor != null ? floor : (r && r.floor) || 0;
  if (fl > 1 && e.g < fl) { const v = Math.round(entryValue(e) * SELL_BACK); if (booksOn() && v) book(v, 'ranchsale', `Sold ${entryWords(e)} back (below your grade floor)`); rrNote(v); RR_LOG.floor++; return 'sold'; }
  if (ranchAdd(e)) return 'kept';
  if (makeRoom(e) && ranchAdd(e)) return 'kept';
  return 'lost';
}
// once a month (your League; from ranchWeek): idle clear-out and list first
function rulesMonth() {
  const r = ranchRules(); if (!r || r.ai || !ranchOn()) return;
  ranchSync();
  const R = S.ranch, canList = r.list && nLeagues() > 1;
  let listed = R.mons.filter(e => e.sale && e.sale.rule).length;
  const list = e => { e.sale = { price: entryValue(e), at: S.turn, rule: true }; listed++; RR_LOG.listed++; ranchLog('rules', 'Listed for other Leagues by your rules', { got: [entryWords(e)], why: `sold back after ${RR_LIST_WEEKS} weeks if nobody buys` }); };
  if (r.idle) {
    const by = {}; for (const e of R.mons) if (rrSpare(e, r) && !e.sale) (by[e.b] = by[e.b] || []).push(e);
    for (const l of Object.values(by)) for (const e of l.sort((x, y) => entryValue(y) - entryValue(x)).slice(r.idleK)) {
      if (S.turn - (e.idle ?? S.turn) < r.idleN) continue;
      if (canList) { if (listed < RR_LIST_MAX) list(e); } // the rest wait for room on the market
      else { RR_LOG.idle++; rrBack(e, `unfielded ${r.idleN}+ weeks`, 'Idle clear-out: sold back'); }
    }
  }
  if (canList && ranchRoom() <= RR_NEAR) for (const e of R.mons.filter(e => rrSpare(e, r) && !e.sale).sort((x, y) => entryValue(x) - entryValue(y))) { if (listed >= RR_LIST_MAX) break; list(e); }
}
// every week: a listing the rules made that nobody bought sells back
function rulesWeek() {
  if (!ranchOn()) return;
  for (const e of S.ranch.mons.slice()) if (e.sale && e.sale.rule && S.turn - e.sale.at >= RR_LIST_WEEKS) { RR_LOG.listBack++; rrBack(e, 'nobody bought it', 'Listing ran out: sold back'); }
  if (S.fin && !S.fin.aim && S.week % 4 === 0) rulesMonth();
}
// a find e from building k ('contest', 'pier', 'fossil'): into the ranch, or sold. Returns 'kept' or 'sold'.
function autoFind(e, k, text) {
  const wd = entryWords(e), kg = keepGrade(k), res = ranchTake(e, kg);
  FIND_LOG[k]++;
  if (res === 'kept') { FIND_LOG.kept++; ranchLog(k, text, { got: [wd] }); return 'kept'; }
  const low = res === 'sold', v = Math.round(entryValue(e) * SELL_BACK);
  if (!low && booksOn() && v) book(v, 'ranchsale', `Sold ${wd} (${text.toLowerCase()})`);
  FIND_LOG.sold++; if (!low) FIND_LOG.full++;
  ranchLog(k, text, { cost: -v, sold: [wd], why: low ? 'below its keep grade' : 'the ranch was full' });
  return 'sold';
}
const findNews = (k, wd, res) => { if (playerLeague()) news(res === 'kept' ? `${wd} came to the ranch from ${k}.` : `${wd} came from ${k} and was sold.`, 'league'); };

// ---------- the Bug Catching Contest ----------
// Every CONTEST_WEEKS (staggered by gym): 1 to 3 Bug finds by level from the region's Bug lines (migrants in season
// too), the first (the prize) at least CONTEST_PRIZE, all at the wild condition odds × CONTEST_COND; a crowd of
// CONTEST_VISIT visitors a level that week (they spend like any visitor) and a gate of CONTEST_GATE a level.
const CONTEST_WEEKS = 8, CONTEST_PRIZE = [3, 3, 4], CONTEST_COND = 1.5, CONTEST_VISIT = 8, CONTEST_GATE = 600;
const contestDue = gi => (S.week + gi * 3) % CONTEST_WEEKS === 0;
const typedLines = ty => hereLines().filter(b => SP[b] && ranchable(b) && lineTypes(b).has(ty));
function contestWeek() {
  S.gyms.forEach((g, gi) => {
    const lv = placeLv(gi, 'contest'); if (!lv || !contestDue(gi)) return;
    const pool = typedLines('Bug'), c = S.cities[g.city]; if (!pool.length || !c) return;
    const sc = ranchScout() + labScout(), got = [];
    for (let n = 0; n < lv; n++) {
      const b = findSpecies(pool), e = newEntry(b, Math.max(n === 0 ? CONTEST_PRIZE[lv - 1] : 1, labFloor(), gradeRoll(sc)), 'contest');
      const ks = condRoll(b, sc, CONTEST_COND); if (ks.length) condEntry(e, ks);
      const wd = entryWords(e), res = autoFind(e, 'contest', `Bug Catching Contest in ${c.name}${n === 0 ? ' (the prize)' : ''}`);
      got.push(res === 'kept' ? wd : `${wd} (sold)`);
    }
    const gate = CONTEST_GATE * lv; book(gate, 'contests'); FIND_LOG.gate += gate;
    if (playerLeague()) news(`The Bug Catching Contest in ${c.name} brought ${got.join(', ')}.`, 'league');
  });
}

// ---------- the Fishing Pier ----------
// One Water find every PIER_WEEKS (staggered by gym). The region's Water lines (migrants in season too) by their final
// form's strength in thirds: the Old Rod (level 1) the weakest third, the Good Rod adds the middle, the Super Rod the top.
const PIER_WEEKS = 4;
function rodLines(lv) {
  const all = typedLines('Water').sort((a, b) => lineTop(a) - lineTop(b) || (a < b ? -1 : 1)), n = all.length;
  return all.slice(0, lv >= 3 ? n : Math.max(1, Math.ceil(n * lv / 3)));
}
function pierWeek() {
  S.gyms.forEach((g, gi) => {
    const lv = placeLv(gi, 'pier'); if (!lv || (S.week + gi) % PIER_WEEKS !== 1) return;
    const pool = rodLines(lv), c = S.cities[g.city]; if (!pool.length || !c) return;
    const sc = ranchScout() + labScout(), b = findSpecies(pool), e = newEntry(b, Math.max(labFloor(), gradeRoll(sc)), 'pier');
    const ks = condRoll(b, sc, 1); if (ks.length) condEntry(e, ks);
    const wd = entryWords(e); findNews(`the Fishing Pier in ${c.name}`, wd, autoFind(e, 'pier', `Fishing Pier in ${c.name} (${['Old', 'Good', 'Super'][lv - 1]} Rod)`));
  });
}

// ---------- the Fossil Lab ----------
// A revival every FOSSIL_WEEKS by working level (its level, +1 with a Ruin Maniac on the staff, up to 4), at a grade no
// lower than the working level. Any region's fossils (the owner's pick), the region's own (its home lines) FOSSIL_HOME
// times as likely; a region with none of its own draws evenly. Fossils skip the regional lock here only.
const FOSSIL_BASES = ['Omanyte', 'Kabuto', 'Aerodactyl', 'Lileep', 'Anorith', 'Cranidos', 'Shieldon', 'Tirtouga', 'Archen', 'Tyrunt', 'Amaura', 'Dracozolt', 'Arctozolt', 'Dracovish', 'Arctovish'];
const FOSSIL_WEEKS = [12, 10, 8, 6], FOSSIL_HOME = 3, FOSSIL_MAX_EFF = 4;
const fossilLines = () => FOSSIL_BASES.filter(b => SP[b] && ranchable(b));
const fossilEff = lv => lv ? Math.min(FOSSIL_MAX_EFF, lv + (classOn(['Ruin Maniac']) ? 1 : 0)) : 0;
function fossilPick() {
  const ls = fossilLines(); if (!ls.length) return null;
  const home = homeSet(S.region), w = ls.map(b => home && home.has(b) ? FOSSIL_HOME : 1);
  let r = rand() * w.reduce((a, x) => a + x, 0);
  for (let i = 0; i < ls.length; i++) { r -= w[i]; if (r <= 0) return ls[i]; }
  return ls[ls.length - 1];
}
function fossilWeek() {
  S.gyms.forEach((g, gi) => {
    const c = S.cities[g.city], x = c && cityB(c).find(y => y.k === 'fossil'); if (!x) return;
    const eff = fossilEff(x.lv), wk = FOSSIL_WEEKS[eff - 1];
    if (x.next == null || x.next > S.turn + wk) { x.next = S.turn + wk; return; }
    if (S.turn < x.next) return;
    x.next = S.turn + wk;
    const b = fossilPick(); if (!b) return;
    const sc = ranchScout() + labScout(), e = newEntry(b, Math.max(eff, labFloor(), gradeRoll(sc)), 'fossil');
    const ks = condRoll(b, sc, 1); if (ks.length) condEntry(e, ks);
    const wd = entryWords(e); findNews(`the Fossil Lab in ${c.name}`, wd, autoFind(e, 'fossil', `Fossil Lab in ${c.name} revived a fossil`));
  });
}

// ---------- the Airport ----------
// One a League, in a gym city of City size or more; x.routes on the building (one at level 1, two from level 2). Each
// route works like a shipping lane (laneSet) and brings people: movers from that region lean toward the League
// (airGain on the move, airDraw in their first regional draw) and land in the Airport city (t.land: their first
// visitor-weeks there), and AIR_VISITS out-of-region visitor-weeks a month arrive there (× up to 2 with renown in that
// region). AIR_WEEK a week to run, AIR_LAND for every arrival (movers and visitors), AIR_ROUTE to change a route. Level 3:
// charters AIR_CHARTER cheaper and a week faster, and contenders win AIR_RENOWN more renown in other regions. In the red
// it lapses: no routes, no arrivals, no fee.
const AIR_WEEK = 1000, AIR_LAND = 150, AIR_ROUTE = 25000, AIR_VISITS = 4, AIR_GAIN = 0.3, AIR_DRAW = 1, AIR_LAND_WEEKS = 3;
const AIR_CHARTER = 0.4, AIR_RENOWN = 1.25;
const AIR_LOG = { movers: 0, visitors: 0, landed: 0, routes: 0, fees: 0, landing: 0 };
const routeCount = lv => Math.min(2, lv || 0);
// give an Airport (bound League) a route for each of its first two levels: neighbours first, then any other region
function airFix(x) {
  if (!x) return;
  x.routes = (x.routes || []).filter(r => r !== S.region && r >= 0 && r < nRegionsBuilt());
  const want = routeCount(x.lv), cands = (NEIGHBOURS[S.region] || []).concat(LEAGUE_SETS.map((_, r) => r)).filter(r => r !== S.region);
  for (const r of cands) { if (x.routes.length >= want) break; if (!x.routes.includes(r)) x.routes.push(r); }
}
// League i's Airport: { gi, c, x, routes } (routes empty in the red), or null
function airportAt(i = S.lg || 0) {
  const L = lgObj(i); if (!L || !L.gyms || !L.fin) return null;
  for (let gi = 0; gi < L.gyms.length; gi++) {
    const c = S.cities[L.gyms[gi].city], x = c && c.b && (c.b[i] || []).find(y => y.k === 'airport'); if (!x) continue;
    const r0 = lgRegion(i), routes = lgLapsed(i) ? [] : (x.routes || []).slice(0, routeCount(x.lv)).filter(r => r !== r0 && r >= 0 && r < nRegionsBuilt());
    return { gi, c, x, routes };
  }
  return null;
}
const airRoutes = () => { const a = airportAt(); return a ? a.routes : []; };
const airportLv = (i = S.lg || 0) => { const a = airportAt(i); return a && !lgLapsed(i) ? a.x.lv : 0; };
// change route k (0 or 1) of the bound League's Airport to region src
function setAirRoute(k, src, lg = ME()) {
  return inLeague(lg, () => {
    const a = airportAt(); if (!a) return 'You have no Airport.';
    airFix(a.x);
    if (!(k >= 0 && k < routeCount(a.x.lv))) return 'No such route.';
    if (src === S.region || !(src >= 0 && src < nRegionsBuilt())) return 'Choose another region.';
    if (a.x.routes[k] === src) return null;
    if (a.x.routes.includes(src)) return 'The other route already serves it.';
    if (!canSpend(AIR_ROUTE)) return 'Not enough money.';
    book(-AIR_ROUTE, 'airport', `The Airport in ${a.c.name} now flies to ${regionName(src)}`);
    a.x.routes[k] = src; AIR_LOG.routes++;
    return null;
  });
}
const charterCost = () => Math.round(CHARTER_COST * (airportLv() >= 3 ? 1 - AIR_CHARTER : 1));
const charterWeeks = () => CHARTER_WEEKS - (airportLv() >= 3 ? 1 : 0);
// contenders sponsored by League lg win more renown in other regions with its Airport at level 3
const airRenownMul = lg => lg != null && lgRegion(lg) !== S.region && airportLv(lg) >= 3 ? AIR_RENOWN : 1;
// League i's routes from region r (0 or 1)
const routedFrom = (i, r) => { const a = airportAt(i); return a && a.routes.includes(r) ? 1 : 0; };
// a mover choosing a League (leagueMove): League i's Airport routed from the region they are in now
function airGain(t, i) { const r = lgRegion(lgOf(t)); return r != null && lgRegion(i) !== r ? AIR_GAIN * routedFrom(i, r) : 0; }
// their first draw in the new region (drawWeights): +AIR_DRAW for an Airport routed from where they came from
function airDraw(i, t) { return t.flew != null ? AIR_DRAW * routedFrom(i, t.flew) : 0; }
// a challenger moving from region fromR to toR (shiftLeague): an Airport in toR routed from fromR (theirs, else the
// one with... the first) sees them land: they are visitors in its city for AIR_LAND_WEEKS, and its League's landing count
function airLand(t, fromR, toR) {
  if (fromR == null || toR == null || fromR === toR || !t || t.role !== 'challenger') return;
  const lgs = regionLgs(toR).filter(j => routedFrom(j, fromR)); if (!lgs.length) return;
  t.flew = fromR; AIR_LOG.movers++;
  const j = lgs.includes(t.lg) ? t.lg : lgs[0], a = airportAt(j);
  t.land = { c: a.c.id, until: S.turn + AIR_LAND_WEEKS };
  const f = lgObj(j).fin; f.air = f.air || {}; f.air.land = (f.air.land || 0) + 1; airYear(f).m++;
  AIR_LOG.landed++;
}
function airYear(f) { f.air = f.air || {}; if (!f.air.y || f.air.y.season !== S.season) f.air = Object.assign(f.air, { last: f.air.y || null, y: { season: S.season, m: 0, v: 0 } }); return f.air.y; }
// League i's best renown in region r's cities
function renownIn(i, r) { let best = 0; for (const c of Object.values(S.cities || {})) if (c.region === r) best = Math.max(best, renown(c, i)); return best; }
// world-level, from visitorsWeek before the Hotels: Airport arrivals and the Contests' crowds this week
function buildings3Visitors() {
  for (let i = 0; i < nLeagues(); i++) {
    const L = lgObj(i); if (!L || !L.fin || !L.gyms || lgLapsed(i)) continue;
    const a = airportAt(i);
    if (a && a.routes.length) {
      let n = 0;
      for (const r of a.routes) { const exp = AIR_VISITS / 4 * (1 + Math.min(1, renownIn(i, r) / 10)); n += Math.floor(exp) + (rand() < exp % 1 ? 1 : 0); }
      if (n) { a.c.vw = (a.c.vw || 0) + n; a.c.vy = (a.c.vy || 0) + n; a.c.away = (a.c.away || 0) + n; const f = L.fin; f.air = f.air || {}; f.air.land = (f.air.land || 0) + n; airYear(f).v += n; AIR_LOG.visitors += n; }
    }
    L.gyms.forEach((g, gi) => { const c = S.cities[g.city], x = c && c.b && (c.b[i] || []).find(y => y.k === 'contest'); if (!x) return;
      if ((S.week + gi * 3) % CONTEST_WEEKS === 0) { const n = CONTEST_VISIT * x.lv; c.vw = (c.vw || 0) + n; c.vy = (c.vy || 0) + n; } });
  }
}
// per League, from buildings2Week: the Airport's fee and landing income, then (not in the red) the catching buildings
function buildings3Week(lap) {
  const f = S.fin, a = airportAt();
  if (a) { airFix(a.x); if (!lap) { book(-AIR_WEEK, 'airport'); AIR_LOG.fees += AIR_WEEK; const n = (f.air && f.air.land) || 0; if (n) { book(n * AIR_LAND, 'airport'); AIR_LOG.landing += n * AIR_LAND; } } }
  if (f.air) f.air.land = 0;
  if (lap || !ranchOn()) return;
  contestWeek(); pierWeek(); fossilWeek();
}

if (typeof module !== 'undefined') Object.assign(module.exports, { condWhy, keepGrade, setKeepGrade, AI_KEEPG, ranchRules, setRanchRules, RR_DEFAULT, RR_LOG, RR_LIST_WEEKS, RR_LIST_MAX, RR_NEAR, rrSpare, ranchTake, makeRoom, rulesMonth, rulesWeek, FIND_LOG, CONTEST_WEEKS, CONTEST_PRIZE, CONTEST_GATE, rodLines, typedLines, FOSSIL_BASES, FOSSIL_WEEKS, fossilLines, fossilEff, AIR_LOG, AIR_WEEK, AIR_ROUTE, AIR_LAND, lineTypes, airportAt, airRoutes, airportLv, setAirRoute, airFix, charterCost, charterWeeks, routeCount });

// ================= THE WEATHER INSTITUTE (0.69.0) =================
// (0.69.0, the owner, design doc claude/design-update-weather-institute.md) One per League, in a gym city that is at
// least a City; its level works League-wide. It sets the field of each gym's battles and of the seat's (the Elite Four,
// title and title-claim battles): ONE of a weather (rain, sun, sand, snow), a terrain (Electric, Grassy, Psychic, Misty)
// or clear skies — never a weather and a terrain together (the owner). Level 1: only fields the place's types bring
// (a Water gym rain, an Electric gym Electric Terrain; clear skies always); a weather-themed class on your staff opens
// every field at level 1. Level 2: any field anywhere, and it holds all battle (no ability or move changes the weather).
// The field replaces the gym's own weather. A terrain powers its type's moves for both sides (as the Surge abilities do,
// adapted). A place left unset keeps the old rule (the first of the leader's types that brings weather). Challengers
// see every field: their Strategy weighs it when they pick their Pokémon and their next gym. In the red it lapses.
// All numbers provisional.
const FIELDS = {
  rain:  { name: 'Rain',              w: 'rain', types: ['Water'] },
  sun:   { name: 'Harsh sunlight',    w: 'sun',  types: ['Fire'] },
  sand:  { name: 'Sandstorm',         w: 'sand', types: ['Rock', 'Ground'] },
  snow:  { name: 'Snow',              w: 'snow', types: ['Ice'] },
  eterr: { name: 'Electric Terrain',  t: 'Electric', types: ['Electric'] },
  gterr: { name: 'Grassy Terrain',    t: 'Grass',    types: ['Grass'] },
  pterr: { name: 'Psychic Terrain',   t: 'Psychic',  types: ['Psychic'] },
  mterr: { name: 'Misty Terrain',     t: 'Fairy',    types: ['Fairy'] },
  clear: { name: 'Clear skies',       w: 'clear', types: null },
};
const FIELD_KEYS = Object.keys(FIELDS), FIELD_TERRAIN = 1.2, FIELD_PREP = 0.6, WX_CLASS = /weather|storm|forecast|meteor|rain|sun/i;
const WX_LOG = { set: 0, aiSet: 0, battles: 0, terrain: 0, held: 0 };
// the League's Institute: { gi, x } (the gym city it stands in), or null
function wxAt(i = S.lg || 0) {
  const L = lgObj(i); if (!L || !L.gyms) return null;
  for (let gi = 0; gi < L.gyms.length; gi++) { const c = S.cities[L.gyms[gi].city], x = c && c.b && (c.b[i] || []).find(y => y.k === 'wx'); if (x) return { gi, x }; }
  return null;
}
// its working level (0 in the red, in the report's fixed tiers, or with none)
function wxLv() { if (lapsed() || fixedStaff()) return 0; const a = wxAt(); return a ? a.x.lv : 0; }
const wxPicks = () => { const f = S.fin; if (!f) return { g: {}, seat: null }; f.wx = f.wx || { g: {}, seat: null }; f.wx.g = f.wx.g || {}; return f.wx; };
// a weather-themed class on the staff (by its name) opens every field at level 1
const wxClassOn = () => staffIds().map(T).some(t => t && WX_CLASS.test(t.cls || ''));
// the types a place brings: a gym's leader's (an untyped leader: their team's), the seat's staff's
function placeTypes(where) {
  const ty = t => { if (!t) return []; const s = specTypes(t); return s.length ? s : [...new Set((t.team || []).flatMap(monTypes))]; };
  if (where === 'seat') return [...new Set([S.champion, ...S.e4].map(T).flatMap(ty))];
  const g = S.gyms[where]; return g ? ty(T(g.leader)) : [];
}
// the fields a place may use now: null when the League has no Institute
function fieldOpts(where) {
  const lv = wxLv(); if (!lv) return null;
  if (lv >= 2 || wxClassOn()) return FIELD_KEYS.slice();
  const ty = placeTypes(where);
  return FIELD_KEYS.filter(k => !FIELDS[k].types || FIELDS[k].types.some(x => ty.includes(x)));
}
// the field chosen for a place (may no longer fit), and why it doesn't work, if it doesn't
const fieldPick = where => { const p = wxPicks(); return (where === 'seat' ? p.seat : p.g[where]) || null; };
function fieldWhy(where) {
  const k = fieldPick(where); if (!k) return null;
  if (!wxAt()) return 'no Weather Institute'; if (!wxLv()) return 'the League is in the red';
  return fieldOpts(where).includes(k) ? null : `${FIELDS[k].name} doesn't fit this ${where === 'seat' ? 'seat' : 'gym'}'s types until level 2`;
}
// set a place's field (key null: back to the type's own weather); returns an error or null
function setField(where, k, lg = ME()) {
  return inLeague(lg, () => {
    if (where !== 'seat' && !S.gyms[where]) return 'No such gym.';
    if (k != null && !FIELDS[k]) return 'No such field.';
    const opts = fieldOpts(where); if (!opts) return 'Build a Weather Institute first.';
    if (k != null && !opts.includes(k)) return `${FIELDS[k].name} needs the Institute at level 2 here (or a weather-themed trainer on your staff).`;
    const p = wxPicks(); if (where === 'seat') p.seat = k; else if (k == null) delete p.g[where]; else p.g[where] = k;
    WX_LOG.set++; return null;
  });
}
// what a battle at a place gets (homeOpts → battle()): { key, name, w, t, lock }, or null
function fieldOf(where, count) {
  const k = fieldPick(where); if (!k || fieldWhy(where)) return null;
  const F = FIELDS[k]; if (count) { WX_LOG.battles++; if (F.t) WX_LOG.terrain++; if (wxLv() >= 2) WX_LOG.held++; }
  return { key: k, name: F.name, w: F.w || null, t: F.t || null, lock: wxLv() >= 2 };
}
// the field a challenger sees at a gym (no counting), for routing
function fieldSeen(where) { let k = fieldPick(where); if (!k || fieldWhy(where)) k = where === 'seat' ? null : utilField(where); if (!k) return null; const F = FIELDS[k]; return { w: F.w || null, t: F.t || null }; } // (0.72.0) a level 3 Plant's or Quarry's field too
// how well a Pokémon's types suit a field: boosted types +1, weakened −1, sand and snow's own types a little
function fieldFit(types, f) {
  if (!f) return 0;
  if (f.t) return types.includes(f.t) ? 1 : 0;
  let v = 0; for (const ty of types) { const m = weatherMul(f.w, ty); v += m > 1 ? 1 : m < 1 ? -1 : 0;
    if (f.w === 'sand' && ['Rock', 'Ground', 'Steel'].includes(ty)) v += 0.5; if (f.w === 'snow' && ty === 'Ice') v += 0.5; }
  return clamp(v, -1, 1);
}
// (0.69.0) what a gym's field adds to a challenger's route pick (gymMatch): how well their team suits it, by Strategy
function fieldRoute(t, g) { const f = fieldSeen(g); if (!f || !t.team.length) return 0; return FIELD_PREP * gmemLearn(t) * t.team.reduce((a, m) => a + fieldFit(monTypes(m), f), 0) / t.team.length; }
// rivals by aim (monthly): a wall-builder sets each gym and the seat to a field its types bring (a weather first); a
// star-maker only the seat. A place already set is kept while it works.
function aiWx(aim) {
  if (!wxLv() || aim === 'money') return;
  const want = where => { const o = fieldOpts(where).filter(k => k !== 'clear'), ty = placeTypes(where);
    return o.find(k => FIELDS[k].w && FIELDS[k].types.some(x => ty.includes(x))) || o.find(k => FIELDS[k].types.some(x => ty.includes(x))) || null; };
  const places = aim === 'wall' ? ['seat', ...S.gyms.map((_, i) => i)] : ['seat'];
  for (const w of places) { if (fieldPick(w) && !fieldWhy(w)) continue; const k = want(w); if (k && !setField(w, k, S.lg || 0)) WX_LOG.aiSet++; }
}

if (typeof module !== 'undefined') Object.assign(module.exports, { FIELDS, FIELD_KEYS, FIELD_TERRAIN, FIELD_PREP, WX_LOG, wxAt, wxLv, wxPicks, wxClassOn, placeTypes, fieldOpts, fieldPick, fieldWhy, setField, fieldOf, fieldSeen, fieldFit, fieldRoute, aiWx });

// ================= THE GAME CORNER (0.70.0) =================
// (0.70.0, the owner, design doc claude/design-update-game-corner.md) Gym cities that are at least a City (level 3 a
// Metropolis), one a city per League. Players each week: the city's visitors plus residents by size, shared by every
// Corner in the city by level × the Hotel's gentle control weights, up to CORNER_SEATS a Corner; each spends
// CORNER_SPEND_AT(size). The take swings week by week (the owner: a very rare losing week, but it makes money far more
// often than not): usually ±CORNER_SWING, a jackpot week (×CORNER_JACKPOT) 1 in CORNER_JACK_N, a losing week
// (−CORNER_LOSS of an average week) 1 in CORNER_LOSS_N. The prize counter: CORNER_PRIZES slots by level, drawn each
// quarter from the region's rarest lines (the bottom CORNER_POOL share by how often they turn up; never a legendary or
// Paradox), each at grade 2 or better, priced at the market value × CORNER_MARKUP (× (1 − CORNER_OFF) at level 3);
// one of each per quarter, not repeating last quarter's lines while the pool allows. Prizes go straight to the ranch.
// Closed in the red. Rivals: money-makers build one in their busiest City; wall-builders and star-makers buy prizes
// that fit a senior post's type from Corners they own. All numbers provisional.
const CORNER_SEATS = [10, 20, 34], CORNER_PRIZES = [2, 3, 4], CORNER_MARKUP = 1.25, CORNER_OFF = 0.1, CORNER_POOL = 0.25;
const CORNER_SWING = 0.3, CORNER_JACKPOT = 3, CORNER_JACK_N = 12, CORNER_LOSS = 0.5, CORNER_LOSS_N = 50, CORNER_MIN_G = 2;
const CORNER_AI_SHARE = 0.35;
const CORNER_RESIDENTS_AT = k => Math.round(6 * Math.pow(1.8, k)), CORNER_SPEND_AT = k => Math.round(30 * Math.pow(1.5, k));
const CORNER_LOG = { weeks: 0, take: 0, jackpots: 0, losses: 0, lossAmt: 0, rotations: 0, prizes: 0, prizeSpend: 0, aiPrizes: 0 };
// world-level, from buildings2World: each city's players shared among its Corners (c.cg[lg])
function cornerPlayersWeek() {
  const m = gymMap();
  for (const c of Object.values(S.cities || {})) {
    c.cg = null;
    const st = (m[c.id] || []).filter(i => !lgLapsed(i)).map(i => ({ i, lv: upLevel(cityB(c, i), 'corner') })).filter(x => x.lv);
    if (!st.length) continue;
    let left = (c.vw || 0) + CORNER_RESIDENTS_AT(citySize(c));
    for (const s of st) { s.cap = CORNER_SEATS[s.lv - 1]; s.w = s.lv * (c.ctrl === s.i && c.tier != null ? HOTEL_CTRL[c.tier] : 1); s.g = 0; }
    for (let pass = 0; pass < 3 && left > 0; pass++) {
      const open = st.filter(s => s.g < s.cap), tw = open.reduce((a, s) => a + s.w, 0); if (!tw) break;
      let given = 0;
      for (const s of open) { const n = Math.min(s.cap - s.g, Math.floor(left * s.w / tw + 1e-9) || (pass === 2 ? 1 : 0)); s.g += n; given += n; }
      left -= given; if (!given) break;
    }
    c.cg = {}; for (const s of st) if (s.g) c.cg[s.i] = s.g;
  }
}
// the bound League's Corners: [{ gi, c, x }]
function corners() {
  const out = [];
  S.gyms.forEach((g, gi) => { const c = S.cities[g.city], x = c && cityB(c).find(y => y.k === 'corner'); if (x) out.push({ gi, c, x }); });
  return out;
}
// a week's swing on an average take: [take, 'jackpot' | 'loss' | null]
function cornerSwing(avg) {
  const r = rand();
  if (r < 1 / CORNER_LOSS_N) return [-Math.round(avg * CORNER_LOSS), 'loss'];
  if (r < 1 / CORNER_LOSS_N + 1 / CORNER_JACK_N) return [Math.round(avg * CORNER_JACKPOT), 'jackpot'];
  return [Math.round(avg * (1 - CORNER_SWING + 2 * CORNER_SWING * rand())), null];
}
function cornerYear(f) { if (!f.gc || f.gc.season !== S.season) { const o = f.gc; f.gc = { season: S.season, take: 0, jack: 0, loss: 0, last: o ? { season: o.season, take: o.take, jack: o.jack, loss: o.loss } : null }; } return f.gc; }
// the region's prize pool: the rarest share of its lines (as findSpecies weighs them), strongest first among equals
function cornerPool() {
  const all = hereLines().filter(b => ranchable(b));
  const w = b => (SP[b].rare ? 0.25 : 1) * (SP[b].starter ? 0.4 : 1) * (lineTop(b) > 540 ? 0.35 : 1);
  return all.sort((a, b) => w(a) - w(b) || lineTop(b) - lineTop(a) || (a < b ? -1 : 1)).slice(0, Math.max(1, Math.ceil(all.length * CORNER_POOL)));
}
const prizePrice = (b, g, lv) => Math.round(monValue(b, g) * CORNER_MARKUP * (lv >= 3 ? 1 - CORNER_OFF : 1) / 50) * 50;
// fill a Corner's counter: a new quarter draws every slot; a level raised mid-quarter adds slots
function cornerStock(x, fresh) {
  const want = CORNER_PRIZES[x.lv - 1] || 0, pool = cornerPool(); if (!pool.length) return;
  const sc = ranchScout() + labScout();
  if (fresh || !x.prize) { x.lastLines = x.prize ? x.prize.map(p => p.b) : x.lastLines || []; x.prize = []; x.at = S.turn; CORNER_LOG.rotations++; }
  const taken = new Set(x.prize.map(p => p.b)), avoid = new Set(x.lastLines || []);
  while (x.prize.length < want) {
    let cand = pool.filter(b => !taken.has(b) && !avoid.has(b));
    if (!cand.length) cand = pool.filter(b => !taken.has(b));
    if (!cand.length) break;
    const b = cand[Math.floor(rand() * cand.length)], g = Math.max(CORNER_MIN_G, gradeRoll(sc));
    x.prize.push({ b, g, price: prizePrice(b, g, x.lv), sold: false }); taken.add(b);
  }
  for (const p of x.prize) if (!p.sold) p.price = prizePrice(p.b, p.g, x.lv);
}
const cornerNext = x => (x.at || 0) + QUARTER_WEEKS;
// per League, from buildings2Week: the take (not in the red) and the counter
function cornerWeek(lap) {
  const cs = corners(); if (!cs.length || lap || !S.fin) return;
  const f = S.fin, y = cornerYear(f), lg = S.lg || 0;
  for (const { c, x } of cs) {
    if (!x.prize || S.turn >= cornerNext(x)) cornerStock(x, true); else cornerStock(x, false);
    const players = (c.cg && c.cg[lg]) || 0, avg = players * CORNER_SPEND_AT(citySize(c));
    if (!avg) { x.wk = { t: S.turn, amt: 0, tag: null, players }; continue; }
    const [amt, tag] = cornerSwing(avg);
    x.wk = { t: S.turn, amt, tag, players };
    if (amt) book(amt, 'corner', tag === 'loss' ? `A losing week at the Game Corner in ${c.name}` : tag === 'jackpot' ? `A jackpot week at the Game Corner in ${c.name}` : null);
    y.take += amt; CORNER_LOG.weeks++; CORNER_LOG.take += amt;
    if (tag === 'jackpot') { y.jack++; CORNER_LOG.jackpots++; if (playerLeague()) news(`A jackpot week at the Game Corner in ${c.name}: ${money(amt)} taken.`, 'league'); }
    if (tag === 'loss') { y.loss++; CORNER_LOG.losses++; CORNER_LOG.lossAmt -= amt; if (playerLeague()) news(`The house lost this week at the Game Corner in ${c.name} (${money(-amt)}).`, 'league'); }
  }
}
// buy prize i at the Corner in gym city gi: an error or null
function buyPrize(gi, i, lg = ME()) {
  return inLeague(lg, () => {
    if (!booksOn()) return 'Money is off.';
    if (lapsed()) return 'The Game Corner is closed while you are in the red.';
    const c = S.cities[(S.gyms[gi] || {}).city], x = c && cityB(c).find(y => y.k === 'corner');
    if (!x || !x.prize) return 'No Game Corner there.';
    const p = x.prize[i]; if (!p) return 'No such prize.'; if (p.sold) return 'Already taken this quarter.';
    if (!ranchOn() || ranchRoom() <= 0) return 'Your ranch is full.';
    if (!canSpend(p.price)) return 'Not enough money.';
    const e = newEntry(p.b, p.g, 'corner'); if (!ranchAdd(e)) return 'Your ranch is full.';
    p.sold = true;
    book(-p.price, 'ranchbuy', `${entryWords(e)} from the Game Corner in ${c.name}`);
    ranchLog('corner', `Game Corner prize in ${c.name}`, { cost: p.price, got: [entryWords(e)] });
    CORNER_LOG.prizes++; CORNER_LOG.prizeSpend += p.price; if (S.fin.aim) CORNER_LOG.aiPrizes++;
    return null;
  });
}
// a rival's monthly look at its own counters (from aimMonth): a wall-builder or star-maker takes one prize whose line
// fits a senior post's type and that it holds no better of, within CORNER_AI_SHARE of its money above its reserve
function aiCorner(aim) {
  if (aim === 'money' || !S.fin || S.fin.money < 0 || !ranchOn() || ranchRoom() <= 0) return;
  const spare = (S.fin.money - AIMS[aim].reserve) * CORNER_AI_SHARE; if (spare <= 0) return;
  const types = new Set(); for (const id of seniorIds()) { const t = T(id); if (t && !t.acting) for (const ty of specTypes(t)) types.add(ty); }
  for (const { gi, x } of corners()) for (let i = 0; i < (x.prize || []).length; i++) {
    const p = x.prize[i]; if (p.sold || p.price > spare) continue;
    if (types.size && ![...lineTypes(p.b)].some(ty => types.has(ty))) continue;
    if (S.ranch.mons.some(e => e.b === p.b && e.g >= p.g)) continue;
    if (!buyPrize(gi, i, S.lg || 0)) return;
  }
}
// a money-maker's one Corner: wherever it has one, else the busiest place it can build (aimSpend tries busiest first)
const aimCorner = where => placeLv(where, 'corner') > 0 || !corners().length;

if (typeof module !== 'undefined') Object.assign(module.exports, { CORNER_SEATS, CORNER_PRIZES, CORNER_MARKUP, CORNER_OFF, CORNER_LOG, CORNER_SPEND_AT, CORNER_RESIDENTS_AT, corners, cornerPool, cornerStock, cornerNext, prizePrice, buyPrize, cornerSwing, cornerYear });

// ================= THE BANK AND THE FAN CLUB (0.71.0) =================
// (0.71.0, the owner, design docs claude/design-update-bank.md and claude/design-update-fan-club.md; every answer of
// both question rounds the recommended one). The UPGRADES entries are in 5b-engine-3b. All numbers provisional.

// ---------- the Bank ----------
// One per League, in any gym city (level 3 needs a City); it earns nothing. While the League is in the red its
// buildings keep working for BANK_GRACE weeks (by level) before they lapse (lapsed() in 5-engine-3 reads graceOn());
// the grace refills only after BANK_REFILL weeks back out of the red. It doesn't cover wages: unpaid staff still leave.
// A credit line: up to BANK_LIMIT of the League's buildings at cost, borrowed at a rate by the League's place on the
// table by wealth (BANK_RATE_TOP at the top to BANK_RATE_LOW at the bottom: catch-up), simple interest over 48 or 96
// weeks, paid weekly. A week it can't pay (money short of the payment) is missed; every BANK_SEIZE missed weeks in a
// row the Bank takes the League's lowest building level at the distress value against the loan (no ruin is left).
// S.fin.bank = { left (grace weeks left), out (weeks out of the red), loan: { owed, pay, left, rate, missed, from, amt } }
const BANK_GRACE = [4, 8, 12], BANK_REFILL = 12, BANK_LIMIT = [0.2, 0.3, 0.4], BANK_RATE_TOP = 0.08, BANK_RATE_LOW = 0.04, BANK_TERMS = [48, 96], BANK_SEIZE = 4, BANK_MIN = 1000;
const BANK_LOG = { graceWeeks: 0, graces: 0, loans: 0, lent: 0, paid: 0, missed: 0, seized: 0, seizedValue: 0, aiLoans: 0, aiGrowth: 0, refused: 0 };
// the League's Bank (bound League, without checking the red): { gi, c, x } or null
function bankAt() {
  for (let gi = 0; gi < S.gyms.length; gi++) { const c = S.cities[S.gyms[gi].city], x = c && (c.b && c.b[S.lg || 0] || []).find(y => y.k === 'bank'); if (x) return { gi, c, x }; }
  return null;
}
const bankBuilt = () => { const a = S.gyms && S.cities ? bankAt() : null; return a ? a.x.lv : 0; };
function bankState() { const f = S.fin; if (!f) return null; return f.bank = f.bank || { left: null, out: BANK_REFILL, loan: null }; }
const graceFull = () => { const lv = bankBuilt(); return lv ? BANK_GRACE[lv - 1] : 0; };
// grace weeks still to come in the red (the bound League)
function graceLeft() { const B = S.fin && S.fin.bank; if (!B || !bankBuilt()) return 0; return B.left == null ? graceFull() : Math.min(B.left, graceFull()); }
// in the red, but the Bank's grace still holds the buildings up
const graceOn = () => !!(S.fin && S.fin.money < 0 && graceLeft() > 0 && !fixedStaff());
// a building level comes and goes: a new or raised Bank while solvent starts with its full grace
function bankBuiltNow() { const B = bankState(); if (B && S.fin.money >= 0) { B.left = graceFull(); B.out = BANK_REFILL; } }
// what the bound League can borrow: the limit, what is owed, and the room left (0 while the Bank isn't working)
function creditLimit() { const lv = bankBuilt(); return lv ? Math.round(estateCost() * BANK_LIMIT[lv - 1]) : 0; }
const loanOwed = () => { const B = S.fin && S.fin.bank; return B && B.loan ? B.loan.owed : 0; };
const creditRoom = () => Math.max(0, creditLimit() - loanOwed());
// the rate for League lg (the bound one by default): its place by wealth (money + buildings at cost) among the Leagues
// with books, the richest paying BANK_RATE_TOP and the poorest BANK_RATE_LOW
function loanRate(lg = S.lg || 0) {
  const w = []; for (let j = 0; j < nLeagues(); j++) { const v = inLeague(j, () => S.fin ? S.fin.money + estateCost() - loanOwed() : null); if (v != null) w.push({ j, v }); }
  if (w.length < 2) return (BANK_RATE_TOP + BANK_RATE_LOW) / 2;
  w.sort((a, b) => b.v - a.v); const r = Math.max(0, w.findIndex(x => x.j === lg));
  return Math.round((BANK_RATE_TOP - (BANK_RATE_TOP - BANK_RATE_LOW) * r / (w.length - 1)) * 1000) / 1000;
}
// what a loan of amt over n weeks would be (refinancing whatever is owed): { total, pay, rate }
function loanTerms(amt, n, lg = S.lg || 0) { const rate = loanRate(lg), total = loanOwed() + Math.round(amt * (1 + rate * n / YEAR_WEEKS)); return { total, pay: Math.ceil(total / n), rate }; }
function borrowCheck(amt, n) {
  if (!booksOn()) return 'Money is off.';
  if (!bankBuilt()) return 'You need a Bank.';
  if (lapsed()) return 'The Bank lends nothing once your buildings have lapsed.';
  if (!BANK_TERMS.includes(n)) return 'Loans run 48 or 96 weeks.';
  if (!(Number.isInteger(amt) && amt >= BANK_MIN)) return `Borrow at least ${money(BANK_MIN)}.`;
  if (amt > creditRoom()) return `You can borrow up to ${money(creditRoom())} more.`;
  return null;
}
// borrow amt over n weeks (refinances any loan): an error or null. In the red the money clears the debt first (it is
// simply booked).
function borrow(amt, n, lg = ME()) {
  return inLeague(lg, () => {
    const err = borrowCheck(amt, n); if (err) { BANK_LOG.refused++; return err; }
    const B = bankState(), t = loanTerms(amt, n), had = !!B.loan;
    B.loan = { owed: t.total, pay: t.pay, left: n, rate: t.rate, missed: 0, from: S.turn, amt: (had ? B.loan.amt : 0) + amt };
    book(amt, 'loan', `Bank loan of ${money(amt)} over ${n} weeks at ${(t.rate * 100).toFixed(1)}%${had ? ' (refinancing the old one)' : ''}`);
    BANK_LOG.loans++; BANK_LOG.lent += amt; if (S.fin.aim) BANK_LOG.aiLoans++;
    if (playerLeague()) news(`The ${S.lgName} borrowed ${money(amt)} from its Bank: ${money(t.pay)} a week for ${n} weeks.`, 'league');
    return null;
  });
}
// pay the loan off now: an error or null
function payOffLoan(lg = ME()) {
  return inLeague(lg, () => {
    const B = S.fin && S.fin.bank, L = B && B.loan; if (!L) return 'No loan to pay off.';
    if (!canSpend(L.owed)) return 'Not enough money.';
    book(-L.owed, 'bank', `Paid off the Bank loan (${money(L.owed)})`); BANK_LOG.paid += L.owed; B.loan = null;
    return null;
  });
}
// the Bank takes the League's lowest building level (the Bank itself last) at the distress value
function bankSeize() {
  const B = S.fin.bank, L = B.loan;
  const x = topLevels().sort((a, b) => (a.k === 'bank') - (b.k === 'bank') || a.lv - b.lv || a.cost - b.cost)[0]; if (!x) return;
  const pl = placeOf(x.where), val = Math.round(x.cost * DISTRESS_SHARE), nm = UPGRADES[x.k].name.toLowerCase();
  const red = lapsed(); dropLevel(pl, x.k); if (red) addRuin(pl.c ? pl.c.id : 'seat', x.k, -1); // taken, not ruined
  L.owed -= val; BANK_LOG.seized++; BANK_LOG.seizedValue += val;
  const text = `The ${S.lgName} missed ${BANK_SEIZE} loan payments: the Bank took ${x.lv > 1 ? `a level of its ${nm}` : `its ${nm}`} in ${pl.name}, worth ${money(val)} against the loan.`;
  news(text, 'league'); noteChange(text); if (playerLeague()) stopFor('money', text);
  if (L.owed <= 0) { if (L.owed < 0) book(-L.owed, 'sales', 'What the Bank owed back after taking a building'); B.loan = null; }
}
// once a week for every League with books (from moneyWeek, after the red's checks): the grace counts down in the red
// and refills after BANK_REFILL weeks out; then the loan's payment
function bankWeek(lap) {
  const f = S.fin, B = bankState(); if (!B) return;
  const lv = bankBuilt();
  if (f.money < 0) {
    f.wasRed = true; B.out = 0;
    if (lv && !lap && graceLeft() > 0) { if (B.left == null) B.left = graceFull(); if (B.left === graceFull()) BANK_LOG.graces++; B.left--; BANK_LOG.graceWeeks++;
      if (!B.left && playerLeague()) { const text = `The Bank's grace is used up: unless the ${S.lgName} is back out of the red, its buildings lapse from next week.`; news(text, 'league'); stopFor('money', text); } }
  } else { B.out = Math.min(BANK_REFILL, (B.out || 0) + 1); if (B.out >= BANK_REFILL || B.left == null) B.left = graceFull(); }
  const L = B.loan; if (!L) return;
  const pay = Math.min(L.pay, L.owed);
  if (f.money >= pay) { book(-pay, 'bank'); L.owed -= pay; L.left = Math.max(0, L.left - 1); L.missed = 0; BANK_LOG.paid += pay; if (L.owed <= 0) { B.loan = null; if (playerLeague()) news(`The ${S.lgName} has paid off its Bank loan.`, 'league'); } return; }
  L.missed++; BANK_LOG.missed++;
  if (L.missed === 1 && playerLeague()) { const text = `The ${S.lgName} missed a Bank loan payment of ${money(pay)}. After ${BANK_SEIZE} missed in a row the Bank takes a building.`; news(text, 'league'); stopFor('money', text); }
  if (L.missed % BANK_SEIZE === 0) bankSeize();
}
// a rival's (and the managed sim's) monthly look at the Bank, from aimMonth / autoMonth: in the red with the Bank still
// working, borrow enough to clear the debt and a month's wages (true if it did); a money-maker solvent with room and a
// running surplus borrows to expand now and then. Returns true when it borrowed to cover the red.
const BANK_AI_GROW = 0.25, BANK_AI_SHARE = 0.5;
function aiBank(aim) {
  const f = S.fin; if (!f || !bankBuilt() || fixedStaff()) return false;
  if (f.money < 0) {
    if (lapsed()) return false;
    const need = Math.min(creditRoom(), -f.money + 4 * wageBill()), amt = Math.round(need / 1000) * 1000;
    return amt >= BANK_MIN && !borrow(amt, 96, S.lg || 0);
  }
  if (aim === 'money' && !loanOwed() && rand() < BANK_AI_GROW) {
    const net = runningNet(), amt = Math.round(Math.min(creditRoom() * BANK_AI_SHARE, Math.max(0, net) * 0.5) / 1000) * 1000;
    if (net > 0 && amt >= BANK_MIN * 10 && loanTerms(amt, 96).pay * YEAR_WEEKS < net * 0.5 && !borrow(amt, 96, S.lg || 0)) BANK_LOG.aiGrowth++;
  }
  return false;
}
// a rival builds a Bank early as a wall-builder, otherwise only after a spell in the red (aimWorth)
const aimBank = () => aimOf() === 'wall' || !!(S.fin && S.fin.wasRed);

// (0.71.0) a Ranch level lost (sold, decayed or taken by the Bank) leaves the ranch over its new room: the cheapest
// spares (by the ranch rules' test) are sold back, then the cheapest unfielded, then the cheapest of all (TODO flake)
function ranchTrim() {
  if (!S.ranch || !ranchOn()) return;
  ranchSync();
  const r = ranchRules(), cheap = a => a.sort((x, y) => entryValue(x) - entryValue(y))[0];
  for (let n = 0; n < 300 && S.ranch.mons.length > ranchCap(); n++) {
    const pl = x => plannedRefs(x.uid).length > 0, m = S.ranch.mons;
    const e = cheap(m.filter(x => rrSpare(x, r))) || cheap(m.filter(x => x.at == null && !pl(x))) || cheap(m.filter(x => !pl(x))) || cheap(m.slice());
    if (!e || sellMon(e.uid)) break;
  }
}
// ---------- the Fan Club ----------
// One per gym city (any size; level 3 needs a City), backing that gym. Its members (x.fans, best x.best) grow monthly
// with the gym's record against the region's average this year (FAN_REC), its local heroes (staff from the city at
// the gym: FAN_HERO; the League's Elite Four and Champion from the city too) and a small trickle a level (FAN_BASE),
// up to its cap (FAN_CAP by level × (1 + FAN_SIZE a city size)). Losses come off at FAN_DOWN of the rate, and a loyal
// core (FAN_CORE of its best) never leaves while it stands. Each New Year it adds standing in its city (FAN_STAND a
// member, cityNewYear), it fills the gym's Stadium (up to FAN_FILL at a full level 3 club, ticketSale) and, at half its
// cap or more, trainers from the city need less prestige to sign (FAN_PULL, with a Stronghold's at most FAN_PULL_MAX
// together: homePull, read by prestMin). A hometown hero poached by another League takes FAN_POACH of the members
// (never the core); half join that League's club there, if it has one. Lapsed in the red (nothing works, nothing lost).
const FAN_CAP = [2000, 5000, 12000], FAN_SIZE = 0.25, FAN_REC = 4000, FAN_BASE = 30, FAN_HERO = { leader: 150, gymtrainer: 50, e4: 100, champion: 150 };
const FAN_DOWN = 0.5, FAN_CORE = 0.2, FAN_STAND = 1 / 1000, FAN_FILL = 0.1, FAN_PULL = [0.1, 0.1, 0.15], FAN_PULL_MAX = 0.3, FAN_POACH = { leader: 0.15, gymtrainer: 0.05, e4: 0.2, champion: 0.2 };
const FAN_LOG = { months: 0, grown: 0, lost: 0, poached: 0, poachedFans: 0, joined: 0, pulls: 0, standing: 0 };
// the bound League's Fan Clubs: [{ gi, c, x }]
function fanClubs() {
  const out = [], lg = S.lg || 0;
  S.gyms.forEach((g, gi) => { const c = S.cities[g.city], x = c && (c.b && c.b[lg] || []).find(y => y.k === 'fanclub'); if (x) out.push({ gi, c, x }); });
  return out;
}
const fanCap = (x, c) => Math.round(FAN_CAP[x.lv - 1] * (1 + FAN_SIZE * citySize(c)));
// League lg's club in city c (read without binding), or null
const fanClubOf = (c, lg) => (c && c.b && c.b[lg] || []).find(y => y.k === 'fanclub') || null;
// the gym's record this year against the average of every gym in its region (null with too few tries yet)
function regionHeld() {
  const a = []; for (let j = 0; j < nLeagues(); j++) { const L = j === (S.lg || 0) ? S : S.leagues[j]; if (L && L.region === S.region) for (const g of L.gyms || []) if (g.w + g.l) a.push(g.w / (g.w + g.l)); }
  return a.length ? a.reduce((x, y) => x + y, 0) / a.length : null;
}
// the month's change for the club at gym gi (before the cap and the core)
function fanGain(gi, x, c, avg) {
  const g = S.gyms[gi];
  let n = FAN_BASE * x.lv;
  if (avg != null && g.w + g.l >= 4) n += (g.w / (g.w + g.l) - avg) * FAN_REC;
  const hero = t => t && !t.acting && homeCity(t) === c.id;
  if (hero(T(g.leader))) n += FAN_HERO.leader;
  for (const id of g.trainers || []) if (hero(T(id))) n += FAN_HERO.gymtrainer;
  for (const id of S.e4) if (hero(T(id))) n += FAN_HERO.e4;
  if (hero(T(S.champion))) n += FAN_HERO.champion;
  return n;
}
// monthly, for every League with books (from buildings2Week): the clubs grow or shrink
function fanWeek(lap) {
  if (lap || S.week % 4 !== 1 || fixedStaff()) return;
  const cs = fanClubs(); if (!cs.length) return;
  const avg = regionHeld();
  for (const { gi, c, x } of cs) {
    const cap = fanCap(x, c), was = x.fans || 0; let d = fanGain(gi, x, c, avg);
    if (d < 0) d *= FAN_DOWN;
    const core = Math.round((x.best || 0) * FAN_CORE);
    x.fans = Math.round(clamp(was + d, core, cap)); x.best = Math.max(x.best || 0, x.fans);
    FAN_LOG.months++; if (x.fans > was) FAN_LOG.grown += x.fans - was; else FAN_LOG.lost += was - x.fans;
  }
}
// New Year (cityNewYear): standing a club adds in its city
const fanStanding = x => Math.round((x.fans || 0) * FAN_STAND * 10) / 10;
// the Stadium's crowd lift at gym `where` (ticketSale): up to FAN_FILL at a full level 3 club
function fanFill(where) {
  if (where === 'seat' || lapsed()) return 0;
  const c = S.cities[(S.gyms[where] || {}).city], x = fanClubOf(c, S.lg || 0); if (!x || !x.fans) return 0;
  return Math.min(FAN_FILL, FAN_FILL * x.fans / Math.round(FAN_CAP[2] * (1 + FAN_SIZE * citySize(c))));
}
// how far a hometown League's pull lowers trainer t's prestige minimum for League lg (prestMin): a Stronghold's
// (0.40.0) and a Fan Club at half its cap or more (0.71.0), at most FAN_PULL_MAX off together
function homePull(t, lg) {
  const hc = homeCity(t); if (hc == null) return 1;
  const c = S.cities[hc]; let off = strongholdOf(c, lg) ? 1 - STRONG_RECRUIT : 0;
  const x = fanClubOf(c, lg);
  if (x && (x.fans || 0) >= fanCap(x, c) / 2 && !inLeague(lg, () => !!S.fin && lapsed())) { off += FAN_PULL[x.lv - 1]; FAN_LOG.pulls++; }
  return 1 - Math.min(FAN_PULL_MAX, off);
}
// a member of staff leaves their League for a post at League `toName` (leaveForPost): if their hometown has their old
// League's club, a share of its members leaves with them (never the core) and half join the new League's club there
function fanPoach(t, toName) {
  const from = homeLeague(t), hc = homeCity(t), to = [...Array(nLeagues()).keys()].find(j => leagueName(j) === toName);
  if (from == null || from < 0 || hc == null || to == null || to === from) return;
  const c = S.cities[hc], x = fanClubOf(c, from), share = FAN_POACH[t.role]; if (!x || !x.fans || !share) return;
  const core = Math.round((x.best || 0) * FAN_CORE), n = Math.max(0, Math.min(x.fans - core, Math.round(x.fans * share))); if (!n) return;
  x.fans -= n; FAN_LOG.poached++; FAN_LOG.poachedFans += n;
  const y = fanClubOf(c, to); if (y) { const add = Math.round(n / 2); y.fans = Math.min(fanCap(y, c), (y.fans || 0) + add); y.best = Math.max(y.best || 0, y.fans); FAN_LOG.joined += add; }
  const text = `${n.toLocaleString()} members of the ${leagueName(from)}'s Fan Club in ${c.name} followed ${t.name} to the ${toName}.`;
  inLeague(from, () => { if (playerLeague()) news(text, 'league'); });
  inLeague(to, () => { if (playerLeague()) news(text, 'league'); });
}
// a rival builds a Fan Club where control of the city is close (Contested or Leaning against it), and a money-maker
// also in its Stadium cities (aimWorth)
function aimFan(where) {
  const c = S.cities[(S.gyms[where] || {}).city]; if (!c) return false;
  const lgs = gymMap()[c.id] || [], lg = S.lg || 0;
  if (lgs.length > 1 && (c.tier == null || c.tier <= 1 || c.ctrl !== lg)) return true;
  return aimOf() === 'money' && placeLv(where, 'stadium') > 0 && placeLv(where, 'fanclub') < 2;
}

if (typeof module !== 'undefined') Object.assign(module.exports, { BANK_GRACE, BANK_REFILL, BANK_LIMIT, BANK_TERMS, BANK_SEIZE, BANK_MIN, BANK_LOG, bankAt, bankBuilt, bankState, graceLeft, graceOn, graceFull, creditLimit, creditRoom, loanOwed, loanRate, loanTerms, borrowCheck, borrow, payOffLoan, bankWeek, aiBank, FAN_CAP, FAN_LOG, FAN_PULL, FAN_PULL_MAX, FAN_FILL, FAN_CORE, fanClubs, fanCap, fanClubOf, fanWeek, fanFill, fanStanding, homePull, fanPoach });

// ================= UTILITY BUILDINGS AND BUILD TIMES (0.72.0) =================
// (0.72.0, the owner, design docs claude/design-update-power-plant.md, -wind-farm.md, -construction-yard.md and
// -quarry.md) Four separate type-themed buildings, each gated by a gym type in its city or a staff class, each
// keeping working at its level but not raisable when the condition goes (the general rule):
// - Power Plant (Electric / Engineer): cuts the upkeep of the League's other buildings in its city (PLANT_CUT). Level 3:
//   an Electric gym there fights on Electric Terrain.
// - Wind Farm (Flying / Bird Keeper): the same kind of cut, cheaper and smaller (WIND_PER a turbine); a calm week (1 in
//   WIND_CALM_N, rolled per city and week, the same every time it is read) halves it. With a Plant in the city the
//   two add up to UTIL_CAP. Level 3: a Flying gym there starts its battles with a tailwind (TAILWIND_TURNS).
// - Construction Yard (Fighting / Black Belt or Worker): the League's best Yard works League-wide and keeps working in
//   the red: builds finish sooner (YARD_TIME), levels lost in the red restore cheaper (YARD_RESTORE in place of
//   RESTORE_SHARE) and lapsed buildings decay more slowly (YARD_DECAY). Decayed and sold just before the Bank.
// - Quarry (Rock or Ground / Hiker): building, raising and restoring anything else in its city costs QUARRY_CUT less.
//   Level 3: a Rock or Ground gym there fights in a sandstorm.
// The level 3 fields give way to a Weather Institute's field for that gym; a leader who would get both Electric
// Terrain and a sandstorm gets the one of their first type (a gym never runs a weather and a terrain together).
// Build times (every League): a new building or level takes BUILD_WEEKS by the level being built (a Stadium add-on
// ADDON_WEEKS); a restored level half that; a Construction Yard shortens it. Paid when it starts; the building works at
// its old level until it is done. In the red (not in a Bank's grace) builds pause. A build under way in a city the gym
// leaves ends with half back (SELL_SHARE). God mode's Instant builds finish the player's at once. All numbers provisional.
const PLANT_CUT = [0.15, 0.25, 0.35], WIND_TURBINES = [2, 4, 7], WIND_PER = 0.04, WIND_CALM_N = 8, UTIL_CAP = 0.5;
const QUARRY_CUT = [0.1, 0.2, 0.3], TAILWIND_TURNS = 3, UTIL_PAYBACK = 3;
const YARD_TIME = [0.2, 0.35, 0.5, 0.65], YARD_RESTORE = [0.26, 0.23, 0.2, 0.17], YARD_DECAY = [0.15, 0.3, 0.45, 0.6];
const BUILD_WEEKS = [2, 4, 8, 12], ADDON_WEEKS = 2;
const PLANT_CLASSES = ['Engineer'], WIND_CLASSES = ['Bird Keeper'], YARD_CLASSES = ['Black Belt', 'Worker'], QUARRY_CLASSES = ['Hiker'];
const UTIL_LOG = { started: 0, finished: 0, instant: 0, paused: 0, cancelled: 0, waited: 0, saved: 0, quarry: 0, tail: 0, eterr: 0, sand: 0, built: { plant: 0, wind: 0, yard: 0, quarry: 0 } };
// the gate of each (from condWhy)
function utilWhy(gi, k) {
  if (k === 'plant' && !gymTyped(gi, 'Electric') && !classOn(PLANT_CLASSES)) return 'Needs an Electric gym here, or an Engineer on your staff.';
  if (k === 'wind' && !gymTyped(gi, 'Flying') && !classOn(WIND_CLASSES)) return 'Needs a Flying gym here, or a Bird Keeper on your staff.';
  if (k === 'yard' && !gymTyped(gi, 'Fighting') && !classOn(YARD_CLASSES)) return 'Needs a Fighting gym here, or a Black Belt or Worker on your staff.';
  if (k === 'quarry' && !gymTyped(gi, 'Rock') && !gymTyped(gi, 'Ground') && !classOn(QUARRY_CLASSES)) return 'Needs a Rock or Ground gym here, or a Hiker on your staff.';
  return null;
}
const cityLv = (c, k, lg = S.lg || 0) => (c && c.b && (c.b[lg] || []).find(x => x.k === k) || { lv: 0 }).lv;
const windCalm = c => !!c && strHash(`${c.id}:${S.turn || 0}`) % WIND_CALM_N === 0;
// a city's upkeep cut for the bound League (0 in the red)
function plantCut(c) { const lv = cityLv(c, 'plant'); return lv ? PLANT_CUT[lv - 1] : 0; }
function windCut(c) { const lv = cityLv(c, 'wind'); return lv ? WIND_TURBINES[lv - 1] * WIND_PER * (windCalm(c) ? 0.5 : 1) : 0; }
function utilCut(c) { if (lapsed() || fixedStaff()) return 0; return Math.min(UTIL_CAP, plantCut(c) + windCut(c)); }
// what the cuts take off this week's upkeep (upkeepWeek)
function upkeepSaved() {
  if (!S.fin || lapsed() || fixedStaff()) return 0;
  let saved = 0;
  for (const g of S.gyms) {
    const c = S.cities[g.city], cut = c ? utilCut(c) : 0; if (!cut) continue;
    const cost = cityB(c).filter(x => x.k !== 'plant' && x.k !== 'wind' && !(x.k === 'sanct' && !sanctOpen(c))).reduce((a, x) => a + builtCost(x), 0);
    saved += cost * cut;
  }
  return Math.round(saved * UPKEEP / YEAR_WEEKS);
}
// a city's saving a week (for the Cities page)
function citySaved(c) { const cut = utilCut(c); if (!cut) return 0; return Math.round(cityB(c).filter(x => x.k !== 'plant' && x.k !== 'wind').reduce((a, x) => a + builtCost(x), 0) * cut * UPKEEP / YEAR_WEEKS); }
// the League's best Construction Yard (works in the red too)
function yardLv(i = S.lg || 0) {
  const L = lgObj(i); if (!L || !L.gyms) return 0;
  return Math.max(0, ...L.gyms.map(g => cityLv(S.cities[g.city], 'yard', i)));
}
const restoreShare = () => { const y = yardLv(); return y ? YARD_RESTORE[y - 1] : RESTORE_SHARE; };
const decayWeeks = () => { const y = yardLv(); return Math.round(DECAY_WEEKS / (1 - (y ? YARD_DECAY[y - 1] : 0))); };
// the Quarry's discount at a place (none at the seat, none in the red)
function quarryCut(where) { if (where === 'seat' || lapsed()) return 0; const g = S.gyms[where], lv = g ? cityLv(S.cities[g.city], 'quarry') : 0; return lv ? QUARRY_CUT[lv - 1] : 0; }
// the order buildings go in the red (decayOne, aiSell): the Construction Yard just before the Bank, the Bank last
const lastToGo = k => k === 'bank' ? 2 : k === 'yard' ? 1 : 0;
// ---------- build times ----------
const instantBuilds = () => !!(S.cfg && S.cfg.instantBuild) && playerLeague(); // god mode's switch (and the tests')
function buildWeeks(k, lv, restore) {
  if (instantBuilds()) return 0;
  let w = ADDONS.includes(k) ? ADDON_WEEKS : BUILD_WEEKS[Math.min(lv, BUILD_WEEKS.length) - 1];
  if (restore) w /= 2;
  const y = yardLv(); if (y) w *= 1 - YARD_TIME[y - 1];
  return Math.max(1, Math.ceil(w));
}
const buildQ = () => { if (!S.fin) return []; return S.fin.bq = S.fin.bq || []; };
const placeKey = where => where === 'seat' ? 'seat' : S.gyms[where] ? S.gyms[where].city : null;
const pendingAt = (where, k) => { const p = placeKey(where); return buildQ().find(q => q.place === p && q.k === k) || null; };
const pendingHere = where => { const p = placeKey(where); return buildQ().filter(q => q.place === p); };
const pendingSlots = where => pendingHere(where).filter(q => q.nw && !UPGRADES[q.k].slotless).length;
function startBuild(where, k, ck, name) {
  const pl = where === 'seat' ? seatB() : cityB(S.cities[S.gyms[where].city]);
  buildQ().push({ place: placeKey(where), k, lv: ck.lv, cost: ck.cost, at: S.turn || 0, done: (S.turn || 0) + ck.weeks, weeks: ck.weeks, restore: !!ck.restore, nw: !upLevel(pl, k) });
  UTIL_LOG.started++; UTIL_LOG.waited += ck.weeks;
  news(`The League started ${ck.restore ? 'restoring' : ck.lv > 1 ? 'raising' : 'building'} its ${UPGRADES[k].name.toLowerCase()} in ${name}${ck.lv > 1 ? ` (level ${ck.lv})` : ''}: ready ${turnDate((S.turn || 0) + ck.weeks)}.`, 'league');
}
// each week per League (moneyWeek): in the red (not in a grace) every build waits a week; otherwise those due finish
function buildWeek() {
  const Q = buildQ(); if (!Q.length) return;
  if (lapsed()) { Q.forEach(q => q.done++); UTIL_LOG.paused += Q.length; return; }
  for (const q of Q.filter(x => x.done <= (S.turn || 0))) {
    const where = q.place === 'seat' ? 'seat' : S.gyms.findIndex(g => g.city === q.place);
    Q.splice(Q.indexOf(q), 1);
    if (where !== 'seat' && where < 0) { refundBuild(q, 'the gym left the city'); continue; }
    const U = UPGRADES[q.k], pl = where === 'seat' ? seatB() : cityB(S.cities[q.place]);
    if (upLevel(pl, q.k) >= upMax(q.k)) { refundBuild(q, 'it was already fully built'); continue; }
    applyBuild(where, q.k); UTIL_LOG.finished++;
    if (UTIL_LOG.built[q.k] != null) UTIL_LOG.built[q.k]++;
    const name = where === 'seat' ? seatPlace() : townName(where), lv = upLevel(pl, q.k);
    const text = `The ${S.lgName}'s ${U.name.toLowerCase()} in ${name} is ${q.restore ? 'restored' : lv > 1 ? `finished at level ${lv}` : 'finished'}.`;
    news(text, 'league');
  }
}
function refundBuild(q, why) {
  const back = Math.round(q.cost * SELL_SHARE); UTIL_LOG.cancelled++;
  if (back) book(back, 'sales', `${UPGRADES[q.k].name} build stopped (${why})`);
  if (q.restore && q.place != null) addRuin(q.place, q.k, 1);
  news(`The ${S.lgName}'s ${UPGRADES[q.k].name.toLowerCase()} build stopped (${why}); ${money(back)} came back.`, 'league');
}
// a level lost (sold, decayed, seized): a raise under way of that building stops, half back
function dropBuild(place, k) { const Q = buildQ(), q = Q.find(x => x.place === place && x.k === k); if (q) { Q.splice(Q.indexOf(q), 1); refundBuild(q, 'a level was lost'); } }
// stop every build under way at a place (a gym moving out of the city)
function cancelBuildsAt(place, why) { const Q = buildQ(); for (const q of Q.filter(x => x.place === place)) { Q.splice(Q.indexOf(q), 1); refundBuild(q, why); } }
// the player stops a build under way: half back
function cancelBuild(where, k, lg = ME()) {
  return inLeague(lg, () => { const q = pendingAt(where, k); if (!q) return 'Nothing is being built there.'; const Q = buildQ(); Q.splice(Q.indexOf(q), 1); refundBuild(q, 'called off'); return null; });
}
// ---------- the level 3 fields and the tailwind ----------
// what a gym's battle gets from its city's utility buildings: { field (only when nothing else set one), tail }
function utilBattle(where, wantField) {
  const o = {}; if (lapsed() || fixedStaff()) return o;
  const g = S.gyms[where], c = g && S.cities[g.city], ld = g && T(g.leader); if (!c || !ld) return o;
  const ty = specTypes(ld);
  if (cityLv(c, 'wind') >= 3 && ty.includes('Flying')) { o.tail = TAILWIND_TURNS; UTIL_LOG.tail++; }
  if (wantField) { const k = utilField(where); if (k) { const F = FIELDS[k]; o.field = { key: k, name: F.name, w: F.w || null, t: F.t || null, lock: false }; UTIL_LOG[k === 'eterr' ? 'eterr' : 'sand']++; } }
  return o;
}
// the field a level 3 Power Plant or Quarry gives a gym (null if none), the leader's first type deciding between them
function utilField(where) {
  if (lapsed() || fixedStaff()) return null;
  const g = S.gyms[where], c = g && S.cities[g.city], ld = g && T(g.leader); if (!c || !ld) return null;
  const ty = specTypes(ld), e = cityLv(c, 'plant') >= 3 && ty.includes('Electric'), q = cityLv(c, 'quarry') >= 3 && (ty.includes('Rock') || ty.includes('Ground'));
  if (e && q) return ty[0] === 'Electric' ? 'eterr' : 'sand';
  return e ? 'eterr' : q ? 'sand' : null;
}
// ---------- rivals ----------
// Power Plant and Wind Farm by payback (the step's saving a year × UTIL_PAYBACK covers its price); the Yard early for a
// money-maker and after a spell in the red for everyone, raising only the best; the Quarry first where the League has
// levels to restore or room for two more builds
function aimUtil(where, k) {
  const g = S.gyms[where], c = g && S.cities[g.city]; if (!c) return false;
  if (k === 'plant' || k === 'wind') {
    const lv = cityLv(c, k), cost = cityB(c).filter(x => x.k !== 'plant' && x.k !== 'wind').reduce((a, x) => a + builtCost(x), 0);
    const cut = (kk, l) => kk === 'plant' ? (l ? PLANT_CUT[l - 1] : 0) : (l ? WIND_TURBINES[l - 1] * WIND_PER : 0);
    const other = k === 'plant' ? cut('wind', cityLv(c, 'wind')) : cut('plant', cityLv(c, 'plant'));
    const gain = Math.min(UTIL_CAP, other + cut(k, lv + 1)) - Math.min(UTIL_CAP, other + cut(k, lv));
    return gain > 0 && cost * gain * UPKEEP * UTIL_PAYBACK >= upCost(k, lv);
  }
  if (k === 'yard') return (aimOf() === 'money' || !!(S.fin && S.fin.wasRed)) && cityLv(c, 'yard') === yardLv();
  if (k === 'quarry') { const ru = S.fin && S.fin.ruins && S.fin.ruins[c.id] ? Object.keys(S.fin.ruins[c.id]).length : 0; return ru > 0 || citySlots(c) - slotsUsed(cityB(c)) - pendingSlots(where) >= 2; }
  return true;
}

if (typeof module !== 'undefined') Object.assign(module.exports, { PLANT_CUT, WIND_TURBINES, WIND_PER, WIND_CALM_N, UTIL_CAP, QUARRY_CUT, TAILWIND_TURNS, YARD_TIME, YARD_RESTORE, YARD_DECAY, BUILD_WEEKS, ADDON_WEEKS, UTIL_LOG, utilWhy, cityLv, windCalm, plantCut, windCut, utilCut, upkeepSaved, citySaved, yardLv, restoreShare, decayWeeks, quarryCut, lastToGo, instantBuilds, buildWeeks, buildQ, placeKey, pendingAt, pendingHere, pendingSlots, startBuild, buildWeek, cancelBuild, cancelBuildsAt, dropBuild, utilBattle, utilField, aimUtil, applyBuild, seatB, upLevel, cityB });
