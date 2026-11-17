// ================= THE RANCH (0.25.0, design doc 6.5, part 1: the core) =================
// A League's own pool of Pokémon. The 13 senior posts (Gym Leaders, the Elite Four and the Champion) field their own
// team plus Pokémon swapped in from the ranch; nothing comes free any more. Gym trainers keep their own teams.
// Every Pokémon in the ranch (an entry) has a grade (1 to 5 stars, from its IVs) and the line it belongs to; it takes
// the form its line has at the level of the post that fields it. One team at a time: an entry is held by one post.
// A swap is an exchange: a member of staff who takes a ranch Pokémon puts the one they drop into the ranch (space
// allowing), and if they leave before taking theirs back, it stays and they keep the one they took.
// The ranch is fed by catching trips (targeted or by area), a market (a rotating list each week plus other Leagues'
// sales) and what staff drop. It costs upkeep a week per Pokémon; the Ranch building (seat, no slot) sets how many it
// holds. Under National Dex rules for now: every species everywhere (regional encounters are part 2).
// The wall report's fixed tiers keep the old builder (no books, no ranch). All numbers are provisional (item 43).
//
// Data: the League field S.ranch = { mons: [entry], trips: [trip], shop: [item] } (in LEAGUE_FIELDS).
//   entry = { uid, b (the line's base, in BASES), sp (the form it came as), g, iv, nat, from, got, at (holder id, a
//             cache ranchSync keeps), res (a post key it is reserved for), lock, of (the trainer who dropped it), sale }
//   a ranch Pokémon on a team carries m.rid (the entry's uid while the League still owns it) and m.rfrom (the same,
//   kept after it leaves the ranch), m.g; a stopgap (a weak free stand-in when nothing fits) carries m.stop.
const RANCH_CAP = [60, 80, 105, 135, 170, 210];          // how many the ranch holds, by Ranch building level (0 to 5)
const RANCH_UPKEEP = [8, 12, 18, 26, 36];                // a week per Pokémon, by grade
const GRADE_MUL = [0.6, 1, 1.6, 2.6, 4.2];               // value by grade
const GRADE_IV = [0.22, 0.38, 0.53, 0.68, 0.85];         // a grade's average IV, as a share of 31
const GRADE_ODDS = [30, 34, 22, 10, 4];                  // grade weights for a find at Scouting 50 (higher Scouting shifts them up)
const GRADE_PICK = 0.15, OWN_PICK = 0.3, RES_PICK = 3;   // what a grade, one of their own and a reservation add to a pick
const RV_BASE = 1200, SELL_BACK = 1 / 3, SALE_SHARE = 0.85, SALE_WEEKS = 24;
const SHOP_SIZE = 6, TRIP_MAX = 2, AREA_COST = 2500, RANCH_SCOUT_OFFICE = 4, STOCK_EXTRA = 3;
const RANCH_AIM = { wall: 0.5, star: 0.35, money: 0.15 }, RANCH_KEEP = { wall: 6, star: 4, money: 2 };

// ---------- lines and values ----------
const LINE_BASE = {}; for (const b of BASES) if (LINE[b] && LINE_BASE[LINE[b]] == null) LINE_BASE[LINE[b]] = b;
let LINE_TOP = null;
function lineTop(b) {
  if (!LINE_TOP) { LINE_TOP = {}; for (const [n, s] of Object.entries(SP)) { const r = LINE[n]; if (r != null) LINE_TOP[r] = Math.max(LINE_TOP[r] || 0, s.bst); } }
  return LINE_TOP[LINE[b]] || SP[b].bst;
}
const ranchable = b => !!(SP[b] && !SP[b].legend && !SP[b].ub && !SP[b].paradox && !SP[b].baby && b !== 'Missingno' && LINE_BASE[LINE[b]] === b);
let RANCH_SPECIES = null;
const ranchSpecies = () => RANCH_SPECIES || (RANCH_SPECIES = BASES.filter(ranchable));
// a Pokémon's value: by the strength its line reaches, its grade, rarity and whether the line is in this League's meta
function monValue(b, g) {
  let v = RV_BASE * Math.pow(1.6, (lineTop(b) - 400) / 50) * GRADE_MUL[clamp(g, 1, 5) - 1];
  if (SP[b].rare) v *= 1.5; if (SP[b].starter) v *= 1.3;
  if ((S.metaYear || []).concat(S.metaTrend || []).some(sp => SP[sp] && LINE[sp] === LINE[b])) v *= 1.4;
  return Math.max(100, Math.round(v / 50) * 50);
}
const entryValue = e => monValue(e.b, e.g);
const gradeStars = g => '★'.repeat(g) + '☆'.repeat(5 - g);
// a grade from IVs: the average IV as a share of 31
function monGrade(m) {
  if (m.g) return m.g;
  const a = ivTotal(m) / 186;
  return a < 0.3 ? 1 : a < 0.45 ? 2 : a < 0.6 ? 3 : a < 0.75 ? 4 : 5;
}
const gradeIVs = g => { const mean = GRADE_IV[g - 1] * 31; return ivSet(() => clamp(Math.round(mean + (rand() - 0.5) * 12), 0, 31)); };
// a grade for a find, by the finder's Scouting
function gradeRoll(sc) {
  const sh = clamp((sc - 50) / 25, -1, 2), w = GRADE_ODDS.map((x, i) => x * Math.exp(0.45 * sh * (i - 2)));
  let r = rand() * w.reduce((a, b) => a + b, 0);
  for (let i = 0; i < 5; i++) { r -= w[i]; if (r <= 0) return i + 1; }
  return 5;
}
// a species for the market or an area trip: commons far likelier than rare, starter or very strong lines
function findSpecies() {
  const all = ranchSpecies(), w = all.map(b => (SP[b].rare ? 0.25 : 1) * (SP[b].starter ? 0.4 : 1) * (lineTop(b) > 540 ? 0.35 : 1));
  let r = rand() * w.reduce((a, b) => a + b, 0);
  for (let i = 0; i < all.length; i++) { r -= w[i]; if (r <= 0) return all[i]; }
  return all[all.length - 1];
}

// ---------- the ranch itself ----------
const newRanch = () => ({ mons: [], trips: [], shop: [] });
const ranchOn = () => !!(S && S.ranch);
// the ranch a trainer's team draws on: a Gym Leader, Elite Four member or Champion (not an acting holder) of a League
// that keeps one (the bound League)
const ranchFor = t => !!(t && ranchOn() && (t.role === 'leader' || t.role === 'e4' || t.role === 'champion') && !t.acting && postOf(t));
const ranchLv = () => upLevel(seatB(), 'ranch');
const ranchCap = () => RANCH_CAP[clamp(ranchLv(), 0, RANCH_CAP.length - 1)];
const ranchRoom = () => ranchOn() ? ranchCap() - S.ranch.mons.length : 0;
const ranchEntry = uid => ranchOn() ? S.ranch.mons.find(e => e.uid === uid) || null : null;
function newEntry(b, g, from) { return { uid: uid(), b, sp: b, g, iv: gradeIVs(g), nat: null, from, got: S.turn || 0, at: null, res: null, lock: false, of: null, sale: null }; }
function ranchAdd(e) { if (!ranchOn() || ranchRoom() <= 0) return false; S.ranch.mons.push(e); return true; }
// the entry a dropped Pokémon becomes, or null if it can't go in the ranch (a legendary, a shiny, a stopgap)
function entryOfMon(m, of) {
  if (!m || m.stop || isSpecial(m)) return null;
  const b = LINE_BASE[LINE[m.sp]]; if (!b || !ranchable(b)) return null;
  const top = m.top && SP[m.top] && LINE[m.top] === LINE[m.sp] ? m.top : m.sp;
  return { uid: uid(), b, sp: top, g: monGrade(m), iv: Object.assign({}, m.iv), nat: m.nat || null, from: 'staff', got: S.turn || 0, at: null, res: null, lock: false, of, sale: null };
}
// the form an entry takes at level L (following the branch it came as)
const ranchForm = (e, L, pref) => stageAt({ sp: e.b, top: e.sp }, L, pref);
// the senior staff of the bound League (the ranch serves them)
function seniorIds() { return [S.champion, ...S.e4, ...S.gyms.map(g => g.leader)].filter(id => id != null && T(id) && ['leader', 'e4', 'champion'].includes(T(id).role)); }
// who holds what: an entry is held by whichever senior team carries it. Someone who left the League (or the senior
// staff) with a ranch Pokémon keeps it, and the ranch loses it; a ranch Pokémon dropped from a team is back in the ranch.
function ranchSync() {
  const R = S.ranch; if (!R) return;
  const byUid = new Set(R.mons.map(e => e.uid)), held = new Map();
  for (const id of seniorIds()) for (const m of T(id).team) if (m.rid != null) { if (byUid.has(m.rid) && !held.has(m.rid)) held.set(m.rid, id); else m.rid = null; }
  R.mons = R.mons.filter(e => {
    if (held.has(e.uid)) { e.at = held.get(e.uid); return true; }
    if (e.at != null) { const p = T(e.at); if (p && (p.team || []).some(m => m.rfrom === e.uid)) { for (const m of p.team) if (m.rfrom === e.uid) m.rid = null; return false; } e.at = null; }
    return true;
  });
}
// the entries trainer t may take: not locked, listed or reserved for another post, held by nobody else
function ranchFree(t) {
  const key = postKey(t);
  return S.ranch.mons.filter(e => !e.lock && !e.sale && (e.res == null || e.res === key) && (e.at == null || e.at === t.id));
}
// a ranch Pokémon taken onto t's team at level L: its IVs from the entry; Training gives it a fitting nature and
// coverage as often as it does in the old builder
function ranchMon(t, e, L, form) {
  const sp = form || ranchForm(e, L, t.specialty), care = trainCare(t);
  const m = { uid: uid(), sp, lvl: L, iv: Object.assign({}, e.iv), rid: e.uid, rfrom: e.uid, g: e.g };
  if (e.nat) m.nat = e.nat;
  if (!m.nat && rand() < care) { const cat = moveCat(m, sp); if (cat) m.nat = pick(cat === 'P' ? ['Adamant', 'Jolly'] : ['Modest', 'Timid']); }
  if (rand() < care) {
    const bad = TYPES.filter(a => SP[sp].types.reduce((x, d) => x * effOne(a, d), 1) >= 2);
    const val = c => bad.filter(a => effOne(c.t, a) >= 2).length;
    m.cov = coverOptions(sp).map((c, i) => [c, val(c) - i / 10]).sort((a, b) => b[1] - a[1]).slice(0, 2).map(x => x[0]).sort((a, b) => a.lv - b.lv);
  }
  return ensureMon(m);
}
// stopgaps: when nothing in the ranch fits, the weakest commons of the trainer's type stand in (grade 1, free), so a
// post still fields its full team; a swap replaces them first
function stopPicks(t, L, n, lines, mixed) {
  const ty = mixed ? [] : specTypes(t), out = [];
  let pool = [...new Set(ranchSpecies().filter(b => !SP[b].rare && !SP[b].starter).map(b => formAt(b, L, t.specialty)))]
    .filter(f => (!ty.length || SP[f].types.some(x => ty.includes(x))) && !lines.has(LINE[f]) && !bannedIn(f, S.lg || 0)).sort((a, b) => SP[a].bst - SP[b].bst);
  pool = pool.slice(0, Math.max(n * 2, Math.ceil(pool.length * 0.3)));
  while (out.length < n && pool.length) {
    const sp = pick(pool); pool = pool.filter(x => LINE[x] !== LINE[sp]); lines.add(LINE[sp]);
    out.push(ensureMon({ uid: uid(), sp, lvl: L, iv: gradeIVs(1), stop: true, g: 1 }));
  }
  return out;
}
// the ranch's team builder (staffPicks hands over to it for senior staff of a League with a ranch): n Pokémon for t at
// level L from their own Pokémon (opts.own, when they take a post) and the ranch, scored as the old builder scores
// species, plus a grade, plus a little for their own and much for a reservation; stopgaps fill what's left unless
// opts.stop is false. The pick loop is the old builder's: Strategy sets the noise, the steer what it favours.
function ranchPicks(t, L, n, opts = {}) {
  ranchSync();
  const lines = new Set(opts.lines || []), out = [], key = postKey(t);
  const ty = opts.mixed ? [] : specTypes(t), threats = TYPES.filter(a => ty.some(d => effOne(a, d) >= 2));
  const weak = {}, addWeak = sp => { for (const a of TYPES) if (SP[sp].types.reduce((m, d) => m * effOne(a, d), 1) >= 2) weak[a] = (weak[a] || 0) + 1; };
  (opts.team || []).forEach(m => addWeak(m.sp));
  const noise = (100 - bld(t, 'str')) / 100 * STRAT_NOISE;
  const steer = opts.steer || steerOf(t), fol = steerFollow(t), meta = steerMeta(steer), sig = steer === 'keep' ? signatureLines(t) : null;
  const offOk = isCounter(steer) && meta.length && !opts.mixed && !opts.noOff && ty.length && !(opts.team || []).some(m => m.offType);
  const onType = sp => !ty.length || SP[sp].types.some(x => ty.includes(x));
  const mine = new Set(t.team.map(m => m.rid).filter(x => x != null)), lg = S.lg || 0;
  let cands = (opts.own || []).map(m => ({ sp: m.sp, g: monGrade(m), m }));
  for (const e of ranchFree(t)) {
    if (mine.has(e.uid)) continue;
    const sp = ranchForm(e, L, t.specialty); if (bannedIn(sp, lg)) continue;
    if (onType(sp)) cands.push({ sp, g: e.g, e });
    else if (offOk && steerScore('trend', sp, {}, meta) + SP[sp].bst / 300 > 2) cands.push({ sp, g: e.g, e, off: true });
  }
  cands = cands.filter(c => !lines.has(LINE[c.sp]));
  const steerV = sp => (steer === 'bal' ? 0 : fol * steerScore(steer, sp, weak, meta)) + (sig && sig.has(LINE[sp]) ? 2 * fol : 0);
  while (out.length < n && cands.length) {
    const sc = c => fitScore(c.sp, weak, threats) + steerV(c.sp) + GRADE_PICK * (c.g - 3) + (c.m ? OWN_PICK + (isSpecial(c.m) ? 5 : 0) : 0) + (c.e && c.e.res === key ? RES_PICK : 0) + (rand() - 0.5) * 2 * noise;
    const best = cands.map(c => [c, sc(c)]).sort((a, b) => b[1] - a[1])[0][0];
    const m = best.m || ranchMon(t, best.e, L, best.sp);
    if (best.off) { m.offType = true; cands = cands.filter(c => !c.off); }
    out.push(m); addWeak(best.sp); lines.add(LINE[best.sp]);
    cands = cands.filter(c => LINE[c.sp] !== LINE[best.sp]);
  }
  if (out.length < n && opts.stop !== false) out.push(...stopPicks(t, L, n - out.length, lines, opts.mixed));
  return out;
}
// a Pokémon leaves a senior team: a ranch Pokémon goes back to the ranch (ranchSync sees it), a stopgap is gone, and
// one of the trainer's own goes into the ranch if there is room (else it is let go)
function dropMon(t, m, why) {
  if (m.rid != null || m.stop) return;
  const e = ranchOn() ? entryOfMon(m, t.id) : null;
  if (e && ranchAdd(e)) return;
  farewell(t, m, why);
}
// a member of staff takes a post: their team is built from their own Pokémon that fit and the ranch, best first;
// whatever of their own they don't field goes into the ranch
function ranchInstall(t, slot, mixed, label) {
  const own = t.team.filter(m => mixed || onSpec(t, m.sp) || isSpecial(m));
  const picks = staffPicks(t, slot.lvl, slot.size, { own, mixed, team: [] }), keep = new Set(picks);
  for (const m of t.team) if (!keep.has(m)) dropMon(t, m, `left out on becoming ${label}`);
  t.team = picks.map(m => (m.met ? m : stamp(m, 'assigned')));
}

// ---------- swaps: one a month, by the steer and Strategy ----------
// value of a Pokémon in a team without it (rest), for swapping: fit, the steer, and its grade
function ranchVal(t, sp, g, rest, s, threats) { const w = weakOf(rest), meta = steerMeta(s); return fitScore(sp, w, threats) + (s === 'bal' ? 0 : steerFollow(t) * steerScore(s, sp, w, meta)) + GRADE_PICK * (g - 3); }
function ranchSwap(t, slot, s) {
  ranchSync();
  const key = postKey(t), mixed = t.role === 'champion' || !t.specialty, own = mixed ? [] : specTypes(t);
  const threats = TYPES.filter(a => own.some(d => effOne(a, d) >= 2)), mg = m => monGrade(m);
  const entryOf = m => (m.rid != null ? ranchEntry(m.rid) : null);
  // a ranch Pokémon locked, listed or reserved for another post goes back first; then an off-type one when the steer
  // isn't a counter; then a stopgap; else the one doing least
  let out = t.team.find(m => { const e = entryOf(m); return e && (e.lock || e.sale || (e.res != null && e.res !== key)); }), must = !!out, why = 'went back to the ranch';
  if (!out && !isCounter(s)) { out = t.team.find(m => m.offType); if (out) { must = true; why = 'swapped out as the steer changed'; } }
  const resIn = ranchFree(t).find(e => e.res === key && !t.team.some(m => m.rid === e.uid));
  if (!out) { out = t.team.find(m => m.stop); if (out) why = 'a stopgap replaced from the ranch'; }
  const vals = t.team.filter(m => !isSpecial(m) && !(t.mega && t.mega.uid === m.uid)).map(m => { const rest = t.team.filter(x => x !== m); return { m, v: ranchVal(t, m.sp, mg(m), rest, s, threats) }; }).sort((a, b) => a.v - b.v);
  if (!out) { if (!vals.length) return; out = vals[0].m; why = `swapped out for a better Pokémon from the ranch${s !== 'bal' ? ` (${steerName(s)})` : ''}`; }
  const rest = t.team.filter(m => m !== out);
  const inn = staffPicks(t, slot.lvl, 1, { lines: rest.map(m => LINE[m.sp]), team: rest, mixed, steer: s, stop: must, noOff: rest.some(m => m.offType) || !isCounter(s) })[0];
  if (!inn) return;
  const reserved = resIn && inn.rid === resIn.uid;
  if (!must && !out.stop && !reserved && (LINE[inn.sp] === LINE[out.sp] && mg(inn) <= mg(out) || ranchVal(t, inn.sp, mg(inn), rest, s, threats) < ranchVal(t, out.sp, mg(out), rest, s, threats) + STEER_EDGE)) return;
  dropMon(t, out, why);
  t.team = rest.concat(stamp(inn, 'assigned')); relevelElite(t);
  if (playerLeague()) news(`${dn(t)} swapped ${out.sp} for ${inn.sp}${inn.rid != null ? ' from the ranch' : ''} (${why}).`, 'move', t.id);
}

// ---------- the starting stock ----------
// A new League's ranch starts with enough low-grade commons for every senior post to field a full team (its holder's
// own Pokémon counted), plus a few more: thin, so the ranch is how a League's teams grow.
function ranchStock(posts) {
  if (!ranchOn()) return;
  const cap = ranchCap();
  for (const p of posts) {
    const t = p.t; if (!t) continue;
    const L = p.role === 'champion' ? champLv() : p.role === 'e4' ? E4_LV[p.slot] : GYM_LV[p.slot];
    const size = p.role === 'leader' ? GYM_SIZE[p.slot] : E4_SIZE, mixed = !t.specialty || p.role === 'champion', ty = mixed ? [] : specTypes(t);
    const lines = new Set(t.team.filter(m => mixed || onSpec(t, m.sp)).map(m => LINE[m.sp]));
    let need = Math.max(0, size - lines.size);
    const fit = b => { const f = formAt(b, L, t.specialty); return (!ty.length || SP[f].types.some(x => ty.includes(x))) && !lines.has(LINE[b]); };
    let pool = ranchSpecies().filter(b => !SP[b].rare && !SP[b].starter && lineTop(b) <= 500 && fit(b));
    if (pool.length < need) pool = ranchSpecies().filter(fit);
    pool.sort((a, b) => lineTop(a) - lineTop(b)); pool = pool.slice(0, Math.max(need * 2, Math.ceil(pool.length * 0.4)));
    while (need > 0 && pool.length && S.ranch.mons.length < cap) {
      const b = pick(pool); pool = pool.filter(x => LINE[x] !== LINE[b]); lines.add(LINE[b]);
      S.ranch.mons.push(newEntry(b, ri(1, 2), 'stock')); need--;
    }
  }
  for (let i = 0; i < STOCK_EXTRA && S.ranch.mons.length < cap; i++) { let b = findSpecies(); while (SP[b].rare || lineTop(b) > 500) b = findSpecies(); S.ranch.mons.push(newEntry(b, 1, 'stock')); }
}
// the senior posts of a founding, for the stock: placed = { champion, e4[4], gyms[8] } (ids)
const stockPosts = placed => [{ t: T(placed.champion), role: 'champion', slot: 0 }].concat(placed.e4.map((id, k) => ({ t: T(id), role: 'e4', slot: k })), placed.gyms.map((id, i) => ({ t: T(id), role: 'leader', slot: i })));

// ---------- Scouting, trips, the market ----------
// the League's Scouting for finds: its best senior member's (real rating) plus the scouting office
function ranchScout() { const s = seniorIds().map(T).filter(t => !t.acting).map(t => t.r.sct); return (s.length ? Math.max(...s) : 40) + RANCH_SCOUT_OFFICE * scoutLv(); }
const tripMax = () => TRIP_MAX + scoutLv();
// a targeted trip for line b: its cost, length and odds (fixed when it sets out)
function tripPlan(b) {
  const top = lineTop(b), sc = ranchScout(), rare = !!(SP[b].rare || SP[b].starter);
  return { cost: Math.round((1500 + 0.4 * monValue(b, 3)) / 50) * 50, weeks: clamp(2 + (rare ? 1 : 0) + Math.floor((top - 400) / 100), 2, 6), odds: Math.round(clamp(0.6 + (sc - 50) / 100 - (rare ? 0.2 : 0) - Math.max(0, (top - 500) / 500), 0.15, 0.95) * 100) / 100 };
}
// the bound League sends a trip: kind 'target' (line b) or 'area' (random finds); null, or why not
function startTrip(kind, b) {
  if (!ranchOn() || !booksOn()) return 'This League has no ranch.';
  if (S.ranch.trips.length >= tripMax()) return `At most ${tripMax()} trips out at once.`;
  let tr;
  if (kind === 'target') { if (!SP[b] || !ranchable(b)) return 'That Pokémon can\'t be caught on a trip.'; const p = tripPlan(b); tr = { id: uid(), k: 'target', b, cost: p.cost, odds: p.odds, due: S.turn + p.weeks, at: S.turn }; }
  else tr = { id: uid(), k: 'area', cost: AREA_COST, due: S.turn + 2, at: S.turn };
  if (!canSpend(tr.cost)) return 'Not enough money.';
  book(-tr.cost, 'trips', kind === 'target' ? `Catching trip for ${b}` : 'Catching trip (area)');
  S.ranch.trips.push(tr);
  return null;
}
function tripsWeek() {
  const R = S.ranch, due = R.trips.filter(x => x.due <= S.turn); if (!due.length) return;
  R.trips = R.trips.filter(x => x.due > S.turn);
  const sc = ranchScout(), mine = playerLeague();
  for (const tr of due) {
    const finds = tr.k === 'target' ? (rand() < tr.odds ? [tr.b] : []) : Array.from({ length: 1 + (rand() < 0.5) + (sc >= 65 && rand() < 0.5) }, findSpecies);
    const got = [], lost = [];
    for (const b of finds) { const e = newEntry(b, gradeRoll(sc), tr.k === 'target' ? 'trip' : 'area'); (ranchAdd(e) ? got : lost).push(`${b} ${gradeStars(e.g)}`); }
    if (mine) news(tr.k === 'target' ? (got.length ? `The catching trip for ${tr.b} came back with one (${got[0]}).` : lost.length ? `The catching trip for ${tr.b} found one, but the ranch was full and it was let go.` : `The catching trip for ${tr.b} came back empty-handed.`)
      : `The area catching trip came back${got.length ? ` with ${got.join(', ')}` : ' empty-handed'}${lost.length ? `; no room in the ranch for ${lost.join(', ')}` : ''}.`, 'league');
  }
}
// the market's weekly list (this League's): a few Pokémon, each for two to four weeks
function shopWeek() {
  const R = S.ranch;
  R.shop = R.shop.filter(x => x.until > S.turn);
  while (R.shop.length < SHOP_SIZE) { const b = findSpecies(), g = gradeRoll(45); R.shop.push({ uid: uid(), b, g, iv: gradeIVs(g), price: monValue(b, g), until: S.turn + ri(2, 4) }); }
}
function buyShop(id) {
  if (!ranchOn() || !booksOn()) return 'This League has no ranch.';
  const x = S.ranch.shop.find(s => s.uid === id); if (!x) return 'That one has gone.';
  if (ranchRoom() <= 0) return 'The ranch is full.';
  if (!canSpend(x.price)) return 'Not enough money.';
  book(-x.price, 'ranchbuy', `Bought ${x.b} ${gradeStars(x.g)} at the market`);
  S.ranch.shop = S.ranch.shop.filter(s => s !== x);
  ranchAdd({ uid: uid(), b: x.b, sp: x.b, g: x.g, iv: x.iv, nat: null, from: 'market', got: S.turn, at: null, res: null, lock: false, of: null, sale: null });
  return null;
}
// League sales: any League lists a ranch Pokémon it isn't using at a set price by value; the buyer pays it and the
// seller gets SALE_SHARE; a listing lasts SALE_WEEKS
const ranchOfLg = k => (k === (S.lg || 0) ? S.ranch : S.leagues && S.leagues[k] ? S.leagues[k].ranch : null);
function listings(except) {
  const out = [];
  for (let k = 0; k < nLeagues(); k++) { if (k === except) continue; const R = ranchOfLg(k); if (R) for (const e of R.mons) if (e.sale) out.push({ lg: k, e }); }
  return out;
}
function listMon(id) {
  ranchSync();
  const e = ranchEntry(id); if (!e) return 'Not in the ranch.';
  if (e.at != null) return 'Someone is fielding it.';
  if (nLeagues() < 2) return 'There is no other League to sell to.';
  e.sale = { price: entryValue(e), at: S.turn }; e.res = null;
  return null;
}
function unlistMon(id) { const e = ranchEntry(id); if (!e || !e.sale) return 'Not listed.'; e.sale = null; return null; }
// the bound League buys League k's listed entry id
function buyListing(k, id) {
  const me = S.lg || 0, R = ranchOfLg(k), e = R && R.mons.find(x => x.uid === id && x.sale);
  if (!e || k === me) return 'That one has gone.';
  if (!ranchOn() || !booksOn()) return 'This League has no ranch.';
  if (ranchRoom() <= 0) return 'The ranch is full.';
  const price = e.sale.price, buyer = S.lgName;
  if (!canSpend(price)) return 'Not enough money.';
  inLeague(k, () => { S.ranch.mons = S.ranch.mons.filter(x => x !== e); if (S.fin) book(Math.round(price * SALE_SHARE), 'ranchsale', `Sold ${e.sp} ${gradeStars(e.g)} to the ${buyer}`); });
  book(-price, 'ranchbuy', `Bought ${e.sp} ${gradeStars(e.g)} from the ${leagueName(k)}`);
  ranchAdd(Object.assign({}, e, { at: null, res: null, lock: false, of: null, sale: null, from: 'league', got: S.turn }));
  return null;
}
// sell back (a third of its value) or let go for nothing; only Pokémon nobody is fielding
function sellMon(id, release) {
  ranchSync();
  const e = ranchEntry(id); if (!e) return 'Not in the ranch.';
  if (e.at != null) return 'Someone is fielding it.';
  S.ranch.mons = S.ranch.mons.filter(x => x !== e);
  if (!release && booksOn()) book(Math.round(entryValue(e) * SELL_BACK), 'ranchsale', `Sold ${e.sp} ${gradeStars(e.g)} back`);
  return null;
}
// lock away (nobody fields it) or reserve for a post (only that post fields it, first); a holder gives it back at the
// next monthly swap
function lockMon(id, on) { const e = ranchEntry(id); if (!e) return 'Not in the ranch.'; e.lock = !!on; if (on) e.res = null; return null; }
function reserveMon(id, key) { const e = ranchEntry(id); if (!e) return 'Not in the ranch.'; if (key != null && !/^(champion|e4:[0-3]|gym:[0-7])$/.test(key)) return 'No such post.'; e.res = key || null; if (key) e.lock = false; return null; }
const ranchUpkeep = () => ranchOn() ? S.ranch.mons.reduce((a, e) => a + RANCH_UPKEEP[e.g - 1], 0) : 0;
// once a week in every League with a ranch (from moneyWeek): who holds what, upkeep, trips back, the market, listings
function ranchWeek() {
  if (!ranchOn()) return;
  ranchSync();
  const u = ranchUpkeep(); if (u && booksOn()) book(-u, 'ranch');
  tripsWeek(); shopWeek();
  for (const e of S.ranch.mons) if (e.sale && S.turn - e.sale.at >= SALE_WEEKS) e.sale = null;
}
// the posts fielding stopgaps (the Ranch page and the AI read it)
const stopPosts = () => seniorIds().map(T).filter(t => t.team.some(m => m.stop));

// ---------- rival Leagues: the ranch by aim ----------
// Once a month (aimMonth): room first (release the weakest spare Pokémon when full; build the Ranch building when it
// can be afforded and carried), then list spare Pokémon beyond what its aim keeps, then one purchase for its neediest
// post (a stopgap first, else the weakest Pokémon on a team) from the market or another League's sales, or else a
// trip. It spends at most RANCH_AIM of its spare money above the aim's reserve on one Pokémon.
function aimRanch(aim) {
  const f = S.fin, R = S.ranch; if (!R || !f || f.money < 0) return;
  ranchSync();
  const spare = f.money - AIMS[aim].reserve, budget = spare * RANCH_AIM[aim], lg = S.lg || 0;
  const free = () => R.mons.filter(e => e.at == null && !e.res && !e.lock && !e.sale).sort((a, b) => entryValue(a) - entryValue(b));
  if (ranchRoom() <= 2) {
    const ck = buildCheck('seat', 'ranch');
    if (!ck.why && ck.cost <= spare * 0.6 && runningNet() >= ck.cost * UPKEEP) { build('seat', 'ranch', lg); return; }
    const f0 = free().find(e => e.g <= 2); if (f0) sellMon(f0.uid, true);
  }
  const spareMons = free(); if (spareMons.length > RANCH_KEEP[aim] && nLeagues() > 1) listMon(spareMons[0].uid);
  if (budget <= 0) return;
  // the neediest post: a stopgap first, else its weakest Pokémon
  const posts = seniorIds().map(T).map(t => { const slot = eliteSlot(t), mixed = t.role === 'champion' || !t.specialty, ty = mixed ? [] : specTypes(t), th = TYPES.filter(a => ty.some(d => effOne(a, d) >= 2));
    const worst = t.team.filter(m => !isSpecial(m)).map(m => { const rest = t.team.filter(x => x !== m); return { m, rest, v: m.stop ? -99 : ranchVal(t, m.sp, monGrade(m), rest, 'bal', th) }; }).sort((a, b) => a.v - b.v)[0];
    return slot && worst ? { t, slot, ty, th, worst } : null; }).filter(Boolean).sort((a, b) => a.worst.v - b.worst.v);
  const p = posts[0]; if (!p) return;
  const L = p.slot.lvl, lines = new Set(p.worst.rest.map(m => LINE[m.sp]));
  const fits = b => { const sp = formAt(b, L, p.t.specialty); return (!p.ty.length || SP[sp].types.some(x => p.ty.includes(x))) && !lines.has(LINE[b]) && !bannedIn(sp, lg) ? sp : null; };
  const gain = (b, g) => { const sp = fits(b); return sp ? ranchVal(p.t, sp, g, p.worst.rest, 'bal', p.th) - p.worst.v : -99; };
  const opts = R.shop.map(x => ({ shop: x, b: x.b, g: x.g, price: x.price })).concat(listings(lg).map(x => ({ list: x, b: x.e.b, g: x.e.g, price: x.e.sale.price })))
    .filter(o => o.price <= budget).map(o => Object.assign(o, { gain: gain(o.b, o.g) })).filter(o => o.gain > (p.worst.m.stop ? 0 : STEER_EDGE)).sort((a, b) => b.gain - a.gain);
  if (opts.length && ranchRoom() > 0) { const o = opts[0]; if (o.shop) buyShop(o.shop.uid); else buyListing(o.list.lg, o.list.e.uid); return; }
  if (R.trips.length >= tripMax()) return;
  if (aim !== 'money' || p.worst.m.stop) {
    const t2 = ranchSpecies().filter(b => fits(b) && !R.trips.some(x => x.b === b)).map(b => ({ b, plan: tripPlan(b) })).filter(x => x.plan.cost <= budget)
      .map(x => Object.assign(x, { v: gain(x.b, 3) * x.plan.odds })).filter(x => x.v > 0).sort((a, b) => b.v - a.v)[0];
    if (t2) { startTrip('target', t2.b); return; }
  }
  if (AREA_COST <= budget && ranchRoom() > 3) startTrip('area');
}

if (typeof module !== 'undefined') module.exports = { ranchOn, ranchFor, ranchCap, ranchRoom, ranchEntry, ranchSync, ranchFree, ranchPicks, ranchSwap, ranchStock, ranchScout, ranchUpkeep, ranchWeek, ranchLv, ranchSpecies, ranchable, monValue, entryValue, monGrade, gradeStars, lineTop, tripPlan, tripMax, startTrip, buyShop, listings, listMon, unlistMon, buyListing, sellMon, lockMon, reserveMon, stopPosts, seniorIds, aimRanch, RANCH_CAP, RANCH_UPKEEP, SALE_SHARE, SELL_BACK, AREA_COST, SHOP_SIZE, SALE_WEEKS, TRIP_MAX, prestMin, willSign, prestBlock, hungry, foundingCands, foundSignable, PM_FREE, PM_PER, prestQ, grow, growPot, growAges, talent, coachOf, startAge, siteOn, noteSite, sanctIncome, sanctLevels, SITE_YEARS, obeyBadges, obeys, legendElsewhere, paradoxHeld, regionMul, LEGEND_HOME, AREA_ZERO, PARADOX_FIND, RESTORE_SHARE, ruinsAt, distressOffers, buyDistress, declineDistress, DISTRESS_OFFER_WEEKS, foldRegions, foldRegion, lapsed, sellBuilding, sellValue, salvage, topLevels, foldLeague, foldNewYear, removeLeague, decayOne, distressSale, prestOf, SELL_SHARE, DISTRESS_SHARE, DECAY_WEEKS, FOLD_YEARS, founderBar, sponStipend, contendersOf, contendersAt, sendCands, sponTargets, sendContender, recallContender, canRenew, renewContender, sponsorWeek, sponsorNewYear, leaveCheck, leaveTakers, leaveLeague, SPON_MAX, SPON_BOUNTY, SPON_E4_BOUNTY, LEAVE_FEE, LEAVE_TAKE, underContract, ME, trainerPrestige, leaguePrestige, prestigeNewYear, regionsWithRoom, nextRegion, MAX_LEAGUES, PRESTIGE_BAR, aimBid, aimUpgrade, runningNet, AIM_BID, AIM_UPGRADE, estateCost, upkeepWeek, builtCost, slotsUsed, upMax, upCost, UPKEEP, ACADEMY_PAY, ACADEMY_LOYAL, academyLv, gymMap, cityCtrl, cityShare, cityIncome, standing, CITY_INCOME, AIMS, AIM_KEYS, aimOf, aimMonth, redWeek, RED_BITE_WEEKS, richMul, playerFin, myBooks, booksOn, payOf, askFor, wageBill, money, canSpend, giveRaise, canRaise, raiseCost, UPGRADES, myPlaces, buildCheck, build, moveGym, homeEdge, placeLv, citySlots, banCands, payBan, paidBans, banProtected, BIDS, START_FUND, ENTRY_FEE, MOVE_FEE, BAN_PAID_MAX, scoutLv, attractionIncome, STEERS, STEER_KEYS, setSteer, steerOf, steerAt, postKey, steerMonth, answersOnType, metaTypes, answerChallenge, approveAllChallenges, runChallenge, chalValid, seatChallenges, SEAT_LOGS, CLAIM_ANSWER, claimOn, claimant, claimRefused, CLAIM_PRESTIGE, CHAL_WAIT, CHAL_ANSWER, seatYears, swapRefusal, refusal, ambClock, ambDue, restless, careerBase, promoteForVacancy, staffQuits, poorRecord, QUIT_NOTICE, AMB_WAIT_YEARS, RUN_HOLD, hireForVacancy, hireForGymTrainer, offerPost, withdrawOffer, gymOutsiders, impressed, hireRetirees, acceptsOffer, canOffer, HIRE_NOTICE, rivalHire, POOR_YEARS, REFUSED_WEEKS, releaseStaff, swapStaff, placeGymTrainer, gymTrainerCands, postOf, gymLineKey, gymStageNow, GYM_WATCH, staffRetires, announceStepDown, stepDownChance, postYears, postName, vacancyCands, fillVacancy, autoFillVacancy, fillAllVacancies, prepFounding, foundPool, foundPlace, foundingFill, finishFounding, foundTypesUsed, foundPlaced, playerLeague, handOn, godEdit, walkingPartner, openNewLeague, worldGrowth, godOn, godOpenLeague, nextRegionName, BAN_BALLOT, BAN_CAP, BAN_MAX_NEW, BAN_MAX_SEASONS, banShare, trainerBanVote, trainerBanVotes, banTrainers, banLen, banLeft, expireBans, banMembers, bansIn, banOf, bannedIn, buildBanBallot, enforceBans, startWorld, simYear, simWeeks, YEAR_WEEKS, dateName, weekName, yearOf, bweek, applyDex, dexImport, checkDexEntry, dexNorm, dexBaseStats, get dexLib() { return dexLib; }, set dexLib(v) { dexLib = v; }, BASE_STATS, SPECIES_AB, STARTERS, LINE, EVOLVED, GREAT_LEGENDS, makeMon, ROAMERS, STORMS, settleStorm, stormRank, ABILITIES, abilityOf, rollAbSlot, ITEMS, TYPE_ITEMS, itemScore, autoEquip, eliteItems, gymItemOffer, bagAdd, heldItem, crossroads, reinvent, dryStreak, isGrandSlam, champLeaguesOf, checkGrandSlams, useLeague, inLeague, eachLeague, nLeagues, lgOf, leagueFit, worldChampionship, leagueName, startLegend, legendBattle, legendWeek, legendOffseason, joinLegend, weald, wantsLegend, recordGreat, REWARD_LEGENDS, FEATURES, featOn, legacyChance, scheduleLegacy, makeLegacy, legacyLine, metaMons, counterTypesFor, metaCounters, AWARDS, seasonAwards, seasonScore, circuitLevel, bondBlocked, BOND_ROLES, checkBonds, bondMon, bondName, BOND_ATK, titleOf, titleNameTaken, famName, famBase, chooseFamous, checkCustom, checkPackName, setCustomLib, parsePackText, prepImport, builtinSource, packExportText, uniquePackName, BUILTIN_SOURCES, ensureCustom, useCustom, customSpecies, newCustomKey, get customLib() { return customLib; }, MALE, FEMALE, FAMOUS_PACKS, BASE_FAMOUS, packOn, famousAvailable, MEGA, megaFor, hasMega, megaHolder, assignMegaStone, earnMega, staffGym, staffIds, gymFits, seedRandom, typeLabel, setTeamLevel, challengerLevel, depthName, GYM_LV, GYM_SIZE, GYM_TRAINERS, GYM_TRIES, E4_LV, E4_SIZE, isSpecial, monTypes, makeDelta, DELTA_CHANCE, gymLost, adaptGym, activeOutbreak, maybeOutbreak, homeLeague, isLegendLine, legendBlocked, pooledLegend, claimLegend, legendDepartures, curSeason, eliteSlot, TRAITS, traitOf, h2hOf, isRival, roadBattles, FAMOUS_TAG_LIST, FAMOUS_BY_NAME, ULTRA_BEASTS, BABY_LEGENDS, ownedLegends, freeBabies, PARADOX, DUAL_CLASSES, specTypes, specFit, applyCfg, careerSpan, ageRetireChance, leadStyle, LEAD_STYLES, coverOptions, MOVES, idealMoves, refreshMoves, estimate, battler, natureFx, NATURES, TEMPER, temperOf, temperMul, moveLv, ensureMon, learnedCov, frTier, formTier, trainerRec, blankStat, FAMOUS, LEGENDS, dn, CLASSES, get S() { return S; }, set S(v) { S = v; }, newWorld, simWeek, aiAction, aiCatch, wildOffers, ovr, T, challengers, SP, BASES, battle, fillCircuits, circuitValue, makeNewcomers, settleBanVote, CIRCUIT_SIZE, START_TEAM, banLength, slamRoom, shiftLeague, retire, LEAGUE_SETS, regionCities, townName, gymCity, SAVE_VERSION };
