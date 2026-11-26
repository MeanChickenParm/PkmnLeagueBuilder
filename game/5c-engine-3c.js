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
  schoolWeek(); tutorWeek(); labWeek();
  // staff equipped before the League kept books (a League founded by hand) or by another path re-equip under the bag rule
  if (bagRule()) { const lg = S.lg || 0; for (const id of staffIds()) { const t = T(id); if (t && t.team.some(m => m.item && ITEMS[m.item] && ITEMS[m.item].tier >= 2 && m.bagLg !== lg)) { eliteItems(t); ITEM_LOG.fixed = (ITEM_LOG.fixed || 0) + 1; } } }
}
// world-level, from visitorsWeek
function buildings2World() { shoppersWeek(); bagSync(); }

if (typeof module !== 'undefined') Object.assign(module.exports, { SCHOOL_PAY, SCHOOL_LOG, schoolLv, ownSchool, ownYouth, schoolPay, schoolRank, schoolGrads, graduate, isProfessor, TUTOR_LOG, TUTOR_SOONER, tutorAt, tutorCov, teach, LAB_LOG, labLv, labBuilt, labScout, labFloor, labTrips, labHunt, labCond, LAB_GRANT, ITEM_LOG, STORE_SHELF, ITEM_PRICE, shelfOf, bagRule, itemFreeOk, storeFloors, storeBuilt, bagOf, itemPrice, shelfItems, bagUsed, bagFree, buyItem, equipSenior, storeIncome, SHOP_SPEND_AT, aimItems });
