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
// (0.26.0) a rival sells back a spare it won't keep once it has sat unfielded this many weeks, listing up to AI_CLEAR a
// month for other Leagues first
const AI_IDLE = { wall: 16, star: 12, money: 8 }, AI_CLEAR = 3;

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
// a species for the market or an area trip: commons far likelier than rare, starter or very strong lines (0.27.0: from
// the lines given, default every line)
function findSpecies(pool) {
  const all = pool && pool.length ? pool : ranchSpecies(), w = all.map(b => (SP[b].rare ? 0.25 : 1) * (SP[b].starter ? 0.4 : 1) * (lineTop(b) > 540 ? 0.35 : 1));
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
  // (0.28.0) an acting holder sent back to a gym trainer's place keeps what they fielded, like anyone leaving the
  // senior staff, even if the entry never recorded them; their stopgaps stay behind
  const gone = new Set();
  for (const g of S.gyms || []) for (const id of g.trainers || []) { const t = id != null && T(id); if (!t || t.role !== 'gymtrainer') continue;
    if (t.team.some(m => m.stop) && t.team.some(m => !m.stop)) t.team = t.team.filter(m => !m.stop);
    for (const m of t.team) if (m.rid != null) { if (!held.has(m.rid)) gone.add(m.rid); m.rid = null; } }
  if (gone.size) R.mons = R.mons.filter(e => !gone.has(e.uid));
  R.mons = R.mons.filter(e => {
    if (held.has(e.uid)) { e.at = held.get(e.uid); e.idle = null; return true; }
    if (e.at != null) { const p = T(e.at); if (p && (p.team || []).some(m => m.rfrom === e.uid)) { for (const m of p.team) if (m.rfrom === e.uid) m.rid = null; return false; } e.at = null; }
    if (e.idle == null) e.idle = S.turn || 0; // (0.26.0) the turn it was last fielded (or came in)
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
  // (0.28.0) a region too thin for the type (250 species since nine regions) falls back to every species
  const poolOf = list => [...new Set(list.filter(b => !SP[b].rare && !SP[b].starter).map(b => formAt(b, L, t.specialty)))]
    .filter(f => (!ty.length || SP[f].types.some(x => ty.includes(x))) && !lines.has(LINE[f]) && !bannedIn(f, S.lg || 0)).sort((a, b) => SP[a].bst - SP[b].bst);
  let pool = poolOf(regional(ranchSpecies()));
  if (pool.length < n) pool = poolOf(ranchSpecies());
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
    const here = regional(ranchSpecies()); // (0.27.0) the region's own lines
    let pool = here.filter(b => !SP[b].rare && !SP[b].starter && lineTop(b) <= 500 && fit(b));
    if (pool.length < need) pool = here.filter(fit);
    if (pool.length < need) pool = ranchSpecies().filter(fit);
    pool.sort((a, b) => lineTop(a) - lineTop(b)); pool = pool.slice(0, Math.max(need * 2, Math.ceil(pool.length * 0.4)));
    while (need > 0 && pool.length && S.ranch.mons.length < cap) {
      const b = pick(pool); pool = pool.filter(x => LINE[x] !== LINE[b]); lines.add(LINE[b]);
      S.ranch.mons.push(newEntry(b, ri(1, 2), 'stock')); need--;
    }
  }
  { const pool = hereLines().filter(b => !SP[b].rare && lineTop(b) <= 500); for (let i = 0; i < STOCK_EXTRA && S.ranch.mons.length < cap && pool.length; i++) S.ranch.mons.push(newEntry(findSpecies(pool), 1, 'stock')); }
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
// (0.27.0) kind 'charter' (b = a region): a shipment of two or three of that region's Pokémon; a targeted trip only for
// a line the League can reach (its region, a migration, a lane, the safari)
function startTrip(kind, b) {
  if (!ranchOn() || !booksOn()) return 'This League has no ranch.';
  if (S.ranch.trips.length >= tripMax()) return `At most ${tripMax()} trips out at once.`;
  let tr;
  if (kind === 'target') { if (!SP[b] || !ranchable(b)) return 'That Pokémon can\'t be caught on a trip.'; if (!tripOk(b)) return `${b} isn't found in ${regionName(S.region)} now.`; const p = tripPlan(b); tr = { id: uid(), k: 'target', b, cost: p.cost, odds: p.odds, due: S.turn + p.weeks, at: S.turn, safari: lineSource(b) === 'safari' || undefined }; }
  else if (kind === 'charter') { const r = +b; if (!homeSet(S.region)) return 'Every species is found everywhere (National Dex rules).'; if (!(r >= 0 && r < nRegionsBuilt()) || r === S.region) return 'Choose another region.'; tr = { id: uid(), k: 'charter', r, cost: CHARTER_COST, due: S.turn + CHARTER_WEEKS, at: S.turn }; }
  else tr = { id: uid(), k: 'area', cost: AREA_COST, due: S.turn + 2, at: S.turn };
  if (!canSpend(tr.cost)) return 'Not enough money.';
  book(-tr.cost, 'trips', kind === 'target' ? `Catching trip for ${b}` : kind === 'charter' ? `Charter from ${regionName(tr.r)}` : 'Catching trip (area)');
  S.ranch.trips.push(tr);
  return null;
}
function tripsWeek() {
  const R = S.ranch, due = R.trips.filter(x => x.due <= S.turn); if (!due.length) return;
  R.trips = R.trips.filter(x => x.due > S.turn);
  const sc = ranchScout(), mine = playerLeague();
  for (const tr of due) {
    const here = hereLines(), home = homeSet(S.region), abroad = tr.k === 'charter' ? [...regionLines().sets[tr.r]].filter(b => (!home || !home.has(b)) && homeOnly(b) == null) : null;
    const finds = tr.k === 'target' ? (rand() < tr.odds ? [tr.b] : []) : tr.k === 'charter' ? Array.from({ length: 2 + (rand() < 0.5) }, () => findSpecies(abroad))
      : Array.from({ length: 1 + (rand() < 0.5) + (sc >= 65 && rand() < 0.5) }, () => findSpecies(here));
    const got = [], lost = [], gsc = sc + (tr.safari ? SAFARI_SCOUT * safariLv() : 0);
    for (const b of finds) { const e = newEntry(b, gradeRoll(gsc), tr.k === 'target' ? 'trip' : tr.k === 'charter' ? 'charter' : 'area'); (ranchAdd(e) ? got : lost).push(`${b} ${gradeStars(e.g)}`); }
    if (mine && tr.k === 'charter') news(`The charter from ${regionName(tr.r)} came in${got.length ? ` with ${got.join(', ')}` : ' empty'}${lost.length ? `; no room in the ranch for ${lost.join(', ')}` : ''}.`, 'league');
    else if (mine) news(tr.k === 'target' ? (got.length ? `The catching trip for ${tr.b} came back with one (${got[0]}).` : lost.length ? `The catching trip for ${tr.b} found one, but the ranch was full and it was let go.` : `The catching trip for ${tr.b} came back empty-handed.`)
      : `The area catching trip came back${got.length ? ` with ${got.join(', ')}` : ' empty-handed'}${lost.length ? `; no room in the ranch for ${lost.join(', ')}` : ''}.`, 'league');
  }
}
// the market's weekly list (this League's): a few Pokémon, each for two to four weeks
function shopWeek() {
  const R = S.ranch;
  R.shop = R.shop.filter(x => x.until > S.turn);
  const pool = marketLines(); // (0.27.0) the region's lines, a migration and the League's lanes
  R.shop = R.shop.filter(x => pool.includes(x.b));
  while (R.shop.length < SHOP_SIZE) { const b = findSpecies(pool), g = gradeRoll(45); R.shop.push({ uid: uid(), b, g, iv: gradeIVs(g), price: monValue(b, g), until: S.turn + ri(2, 4) }); }
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
// (0.26.0) a fielded ranch Pokémon is freed at once: its holder swaps it for the best fitting Pokémon left in the ranch
// (never this one), or a stopgap; returns the holder, or null if nobody was fielding it
function freeEntry(e) {
  ranchSync(); if (e.at == null) return null;
  const t = T(e.at), m = t && t.team.find(x => x.rid === e.uid); if (!m) { e.at = null; return null; }
  const slot = eliteSlot(t), mixed = t.role === 'champion' || !t.specialty, rest = t.team.filter(x => x !== m);
  const was = e.lock; e.lock = true;
  const inn = staffPicks(t, slot.lvl, 1, { lines: rest.map(x => LINE[x.sp]), team: rest, mixed, stop: true, noOff: rest.some(x => x.offType) })[0];
  e.lock = was;
  t.team = inn ? rest.concat(stamp(inn, 'assigned')) : rest; relevelElite(t);
  e.at = null; e.idle = S.turn;
  if (playerLeague() && inn) news(`${dn(t)} gave up ${m.sp} and fields ${inn.sp}${inn.stop ? ' (a stopgap)' : ' from the ranch'} instead.`, 'move', t.id);
  return t;
}
function listMon(id) {
  ranchSync();
  const e = ranchEntry(id); if (!e) return 'Not in the ranch.';
  if (nLeagues() < 2) return 'There is no other League to sell to.';
  freeEntry(e);
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
// sell back (a third of its value) or let go for nothing; since 0.26.0 a fielded one too (its holder swaps it out first)
function sellMon(id, release) {
  ranchSync();
  const e = ranchEntry(id); if (!e) return 'Not in the ranch.';
  freeEntry(e); // (0.26.0) a fielded one is swapped out at once
  S.ranch.mons = S.ranch.mons.filter(x => x !== e);
  if (!release && booksOn()) book(Math.round(entryValue(e) * SELL_BACK), 'ranchsale', `Sold ${e.sp} ${gradeStars(e.g)} back`);
  return null;
}
// lock away (nobody fields it) or reserve for a post (only that post fields it, first); a holder gives it back at the
// next monthly swap
function lockMon(id, on) { const e = ranchEntry(id); if (!e) return 'Not in the ranch.'; e.lock = !!on; if (on) e.res = null; return null; }
function reserveMon(id, key) { const e = ranchEntry(id); if (!e) return 'Not in the ranch.'; if (key != null && !/^(champion|e4:[0-3]|gym:[0-7])$/.test(key)) return 'No such post.'; e.res = key || null; if (key) e.lock = false; return null; }
const ranchUpkeep = () => ranchOn() ? S.ranch.mons.reduce((a, e) => a + RANCH_UPKEEP[e.g - 1], 0) : 0;
// (0.26.0) a rival's spares it won't keep, cheapest first: everything unfielded (not reserved or locked) except the best
// RANCH_KEEP of those some senior post could field on type at its level
function ranchSpares(aim) {
  const posts = seniorIds().map(T).map(t => ({ t, L: (eliteSlot(t) || {}).lvl, ty: t.role === 'champion' || !t.specialty ? [] : specTypes(t) })).filter(p => p.L);
  const usable = e => posts.some(p => { const sp = ranchForm(e, p.L, p.t.specialty); return !p.ty.length || SP[sp].types.some(x => p.ty.includes(x)); });
  const idle = S.ranch.mons.filter(e => e.at == null && !e.res && !e.lock).sort((a, b) => entryValue(b) - entryValue(a));
  const keep = new Set(idle.filter(usable).slice(0, RANCH_KEEP[aim]));
  return idle.filter(e => !keep.has(e)).reverse();
}
// once a week in every League with a ranch (from moneyWeek): who holds what, upkeep, trips back, the market, listings
function ranchWeek() {
  if (!ranchOn()) return;
  ranchSync();
  const u = ranchUpkeep(); if (u && booksOn()) book(-u, 'ranch');
  const lf = laneFee(); if (lf && booksOn()) book(-lf, 'lanes'); // (0.27.0)
  safariWeek(); tripsWeek(); shopWeek();
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
  const f = S.fin, R = S.ranch; if (!R || !f) return;
  ranchSync();
  // (0.26.0) clearing out, in the red too: spares it won't keep are sold back once idle AI_IDLE weeks, and listed for
  // other Leagues before that (up to AI_CLEAR a month)
  let listed = 0;
  for (const e of ranchSpares(aim)) {
    if (S.turn - (e.idle ?? S.turn) >= AI_IDLE[aim]) { e.sale = null; sellMon(e.uid); }
    else if (!e.sale && nLeagues() > 1 && listed < AI_CLEAR) { listMon(e.uid); listed++; }
  }
  if (f.money < 0) return;
  const spare = f.money - AIMS[aim].reserve, budget = spare * RANCH_AIM[aim], lg = S.lg || 0;
  const free = () => R.mons.filter(e => e.at == null && !e.res && !e.lock && !e.sale).sort((a, b) => entryValue(a) - entryValue(b));
  if (ranchRoom() <= 2) {
    const ck = buildCheck('seat', 'ranch');
    if (!ck.why && ck.cost <= spare * 0.6 && runningNet() >= ck.cost * UPKEEP) { build('seat', 'ranch', lg); return; }
    const f0 = free().find(e => e.g <= 2); if (f0) sellMon(f0.uid, true);
  }
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
    const t2 = ranchSpecies().filter(b => fits(b) && tripOk(b) && !R.trips.some(x => x.b === b)).map(b => ({ b, plan: tripPlan(b) })).filter(x => x.plan.cost <= budget)
      .map(x => Object.assign(x, { v: gain(x.b, 3) * x.plan.odds })).filter(x => x.v > 0).sort((a, b) => b.v - a.v)[0];
    if (t2) { startTrip('target', t2.b); return; }
  }
  // (0.27.0) a stopgap of a type the region can't answer: a charter from the region with most of that type
  if (p.worst.m.stop && homeSet(S.region) && CHARTER_COST <= budget && ranchRoom() > 3 && p.ty.length) {
    const has = r => [...regionLines().sets[r]].filter(b => !homeSet(S.region).has(b) && fits(b)).length;
    const r = [...Array(nRegionsBuilt()).keys()].filter(x => x !== S.region).sort((a, c) => has(c) - has(a))[0];
    if (r != null && has(r) && !ranchSpecies().some(b => fits(b) && tripOk(b))) { startTrip('charter', r); return; }
  }
  if (AREA_COST <= budget && ranchRoom() > 3) startTrip('area');
}

// ================= REGIONS (0.27.0, design doc 6.6: ranch part 2, regional) =================
// Encounters are regional: each region has its own lines (about REGION_SIZE species), and everything else turns up
// only through migration waves (from a neighbouring region, now and then from further off), a League's shipping lanes
// (a port city's lane, or Goldenrod's railway), charters and the safari. The feature 'regional' (on by default) turns
// it on; off is National Dex rules (every species everywhere). (0.28.0) All nine regions exist, each with about 250.
// A line belongs to every region of its family's generations (Pichu: Kanto and Johto); regional forms go with the
// species they are a form of, and Hisuian ones (and the lines Hisui gave new evolutions) with Sinnoh. Lines with no
// generation of the four are spread over them, each to the region with the fewest species, by type. Then each region
// borrows lines from its neighbours until every type has REGION_FLOOR usable lines (reaching FLOOR_BST), and evens out
// to REGION_SIZE. Built once from the data (the same every game); custom species without a family here are spread
// like Gen V to IX. All numbers are provisional (item 41).
const GEN_SPECIES = [
  // Gen I
  'Rattata Raticate Pidgey Pidgeotto Pidgeot Spearow Fearow Eevee Vaporeon Jolteon Flareon Porygon Tauros Kangaskhan Charmander Charmeleon Charizard Growlithe Arcanine Vulpix Ninetales Ponyta Rapidash Squirtle Wartortle Blastoise Psyduck Golduck Poliwag Poliwhirl Poliwrath Magikarp Gyarados Staryu Starmie Seel Dewgong Lapras Omanyte Omastar Bulbasaur Ivysaur Venusaur Oddish Gloom Vileplume Bellsprout Weepinbell Victreebel Exeggcute Exeggutor Tangela Magnemite Magneton Voltorb Electrode Machop Machoke Machamp Mankey Primeape Ekans Arbok Grimer Muk Koffing Weezing Venonat Venomoth Sandshrew Sandslash Diglett Dugtrio Cubone Marowak Rhyhorn Rhydon Aerodactyl Abra Kadabra Alakazam Drowzee Hypno Scyther Pinsir Geodude Graveler Golem Onix Gastly Haunter Gengar Horsea Seadra Dratini Dragonair Dragonite Pikachu Raichu Clefairy Clefable Jynx Electabuzz Magmar Hitmonlee Hitmonchan Snorlax Caterpie Metapod Butterfree Weedle Kakuna Beedrill Krabby Kingler Zubat Golbat Goldeen Seaking Mr._Mime Nidoran♀ Nidorina Nidoqueen Nidoran♂ Nidorino Nidoking Meowth Persian Doduo Dodrio Tentacool Tentacruel Jigglypuff Wigglytuff Paras Parasect Slowpoke Slowbro Farfetch\'d Shellder Cloyster Lickitung Chansey Ditto Kabuto Kabutops',
  // Gen II
  'Umbreon Espeon Porygon2 Cyndaquil Quilava Typhlosion Houndour Houndoom Totodile Croconaw Feraligatr Politoed Chikorita Bayleef Meganium Bellossom Mareep Flaaffy Ampharos Swinub Piloswine Sneasel Heracross Skarmory Murkrow Scizor Steelix Larvitar Pupitar Tyranitar Misdreavus Kingdra Snubbull Granbull Pichu Cleffa Marill Azumarill Smoochum Elekid Magby Tyrogue Hitmontop Hoothoot Noctowl Phanpy Donphan Crobat Pineco Forretress Sudowoodo Togepi Togetic Corsola Hoppip Skiploom Jumpluff Spinarak Ariados Slugma Magcargo Miltank Natu Xatu Igglybuff Slowking Blissey Sentret Furret Ledyba Ledian Chinchou Lanturn Aipom Sunkern Sunflora Yanma Wooper Quagsire Unown Wobbuffet Girafarig Dunsparce Gligar Qwilfish Shuckle Teddiursa Ursaring Remoraid Octillery Delibird Mantine Stantler Smeargle',
  // Gen III
  'Snorunt Glalie Ralts Kirlia Gardevoir Shuppet Banette Duskull Dusclops Swablu Altaria Trapinch Vibrava Flygon Bagon Shelgon Salamence Absol Aron Lairon Aggron Beldum Metang Metagross Mawile Azurill Treecko Grovyle Sceptile Torchic Combusken Blaziken Mudkip Marshtomp Swampert Taillow Swellow Corphish Crawdaunt Torkoal Lotad Lombre Ludicolo Luvdisc Nosepass Makuhita Hariyama Meditite Medicham Electrike Manectric Numel Camerupt Slakoth Vigoroth Slaking Spinda Zigzagoon Linoone Wingull Pelipper Tropius Lunatone Solrock Baltoy Claydol Feebas Milotic Wailmer Wailord Carvanha Sharpedo Barboach Whiscash Spheal Sealeo Walrein Wynaut Poochyena Mightyena Wurmple Silcoon Beautifly Cascoon Dustox Seedot Nuzleaf Shiftry Surskit Masquerain Shroomish Breloom Nincada Ninjask Shedinja Whismur Loudred Exploud Skitty Delcatty Sableye Plusle Minun Volbeat Illumise Roselia Gulpin Swalot Spoink Grumpig Cacnea Cacturne Zangoose Seviper Lileep Cradily Anorith Armaldo Castform Kecleon Chimecho Clamperl Huntail Gorebyss Relicanth',
  // Gen IV (and Hisui's new evolutions and forms, below)
  'Leafeon Glaceon Porygon-Z Tangrowth Magnezone Mamoswine Weavile Froslass Riolu Lucario Gible Gabite Garchomp Honchkrow Gallade Rhyperior Mismagius Dusknoir Bronzor Bronzong Probopass Electivire Magmortar Munchlax Togekiss Mime_Jr. Lickilicky Happiny Yanmega Gliscor Mantyke Ambipom Croagunk Toxicroak Bonsly Budew Roserade Chingling Turtwig Grotle Torterra Chimchar Monferno Infernape Piplup Prinplup Empoleon Starly Staravia Staraptor Bidoof Bibarel Kricketot Kricketune Shinx Luxio Luxray Cranidos Rampardos Shieldon Bastiodon Burmy Wormadam Mothim Combee Vespiquen Pachirisu Buizel Floatzel Cherubi Cherrim Shellos Gastrodon Drifloon Drifblim Buneary Lopunny Glameow Purugly Stunky Skuntank Chatot Spiritomb Hippopotas Hippowdon Skorupi Drapion Carnivine Finneon Lumineon Snover Abomasnow Rotom Kleavor Ursaluna Wyrdeer Sneasler Overqwil Basculegion',
  // Gen V
  'Snivy Servine Serperior Tepig Pignite Emboar Oshawott Dewott Samurott Patrat Watchog Lillipup Herdier Stoutland Purrloin Liepard Pansage Simisage Pansear Simisear Panpour Simipour Munna Musharna Pidove Tranquill Unfezant Blitzle Zebstrika Roggenrola Boldore Gigalith Woobat Swoobat Drilbur Excadrill Audino Timburr Gurdurr Conkeldurr Tympole Palpitoad Seismitoad Throh Sawk Sewaddle Swadloon Leavanny Venipede Whirlipede Scolipede Cottonee Whimsicott Petilil Lilligant Basculin Sandile Krokorok Krookodile Darumaka Darmanitan Maractus Dwebble Crustle Scraggy Scrafty Sigilyph Yamask Cofagrigus Tirtouga Carracosta Archen Archeops Trubbish Garbodor Zorua Zoroark Minccino Cinccino Gothita Gothorita Gothitelle Solosis Duosion Reuniclus Ducklett Swanna Vanillite Vanillish Vanilluxe Deerling Sawsbuck Emolga Karrablast Escavalier Foongus Amoonguss Frillish Jellicent Alomomola Joltik Galvantula Ferroseed Ferrothorn Klink Klang Klinklang Tynamo Eelektrik Eelektross Elgyem Beheeyem Litwick Lampent Chandelure Axew Fraxure Haxorus Cubchoo Beartic Cryogonal Shelmet Accelgor Stunfisk Mienfoo Mienshao Druddigon Golett Golurk Pawniard Bisharp Bouffalant Rufflet Braviary Vullaby Mandibuzz Heatmor Durant Deino Zweilous Hydreigon Larvesta Volcarona',
  // Gen VI
  'Chespin Quilladin Chesnaught Fennekin Braixen Delphox Froakie Frogadier Greninja Bunnelby Diggersby Fletchling Fletchinder Talonflame Scatterbug Spewpa Vivillon Litleo Pyroar Flabébé Floette Florges Skiddo Gogoat Pancham Pangoro Furfrou Espurr Meowstic Honedge Doublade Aegislash Spritzee Aromatisse Swirlix Slurpuff Inkay Malamar Binacle Barbaracle Skrelp Dragalge Clauncher Clawitzer Helioptile Heliolisk Tyrunt Tyrantrum Amaura Aurorus Sylveon Hawlucha Dedenne Carbink Goomy Sliggoo Goodra Klefki Phantump Trevenant Pumpkaboo Gourgeist Bergmite Avalugg Noibat Noivern',
  // Gen VII
  'Rowlet Dartrix Decidueye Litten Torracat Incineroar Popplio Brionne Primarina Pikipek Trumbeak Toucannon Yungoos Gumshoos Grubbin Charjabug Vikavolt Crabrawler Crabominable Oricorio Cutiefly Ribombee Rockruff Lycanroc Wishiwashi Mareanie Toxapex Mudbray Mudsdale Dewpider Araquanid Fomantis Lurantis Morelull Shiinotic Salandit Salazzle Stufful Bewear Bounsweet Steenee Tsareena Comfey Oranguru Passimian Wimpod Golisopod Sandygast Palossand Pyukumuku Minior Komala Turtonator Togedemaru Mimikyu Bruxish Drampa Dhelmise Jangmo-o Hakamo-o Kommo-o',
  // Gen VIII (Hisui's are with Gen IV)
  'Grookey Thwackey Rillaboom Scorbunny Raboot Cinderace Sobble Drizzile Inteleon Skwovet Greedent Rookidee Corvisquire Corviknight Blipbug Dottler Orbeetle Nickit Thievul Gossifleur Eldegoss Wooloo Dubwool Chewtle Drednaw Yamper Boltund Rolycoly Carkol Coalossal Applin Flapple Appletun Silicobra Sandaconda Cramorant Arrokuda Barraskewda Toxel Toxtricity Sizzlipede Centiskorch Clobbopus Grapploct Sinistea Polteageist Hatenna Hattrem Hatterene Impidimp Morgrem Grimmsnarl Obstagoon Perrserker Cursola Sirfetch\'d Mr._Rime Runerigus Milcery Alcremie Falinks Pincurchin Snom Frosmoth Stonjourner Eiscue Indeedee Morpeko Cufant Copperajah Dracozolt Arctozolt Dracovish Arctovish Duraludon Dreepy Drakloak Dragapult',
  // Gen IX
  'Sprigatito Floragato Meowscarada Fuecoco Crocalor Skeledirge Quaxly Quaxwell Quaquaval Lechonk Oinkologne Tarountula Spidops Nymble Lokix Pawmi Pawmo Pawmot Tandemaus Maushold Fidough Dachsbun Smoliv Dolliv Arboliva Squawkabilly Nacli Naclstack Garganacl Charcadet Armarouge Ceruledge Tadbulb Bellibolt Wattrel Kilowattrel Maschiff Mabosstiff Shroodle Grafaiai Bramblin Brambleghast Toedscool Toedscruel Klawf Capsakid Scovillain Rellor Rabsca Flittle Espathra Tinkatink Tinkatuff Tinkaton Wiglett Wugtrio Bombirdier Finizen Palafin Varoom Revavroom Cyclizar Orthworm Glimmet Glimmora Greavard Houndstone Flamigo Cetoddle Cetitan Veluza Dondozo Tatsugiri Annihilape Clodsire Farigiraf Dudunsparce Kingambit Frigibax Arctibax Baxcalibur Gimmighoul Gholdengo Dipplin Poltchageist Sinistcha Archaludon Hydrapple',
].map(s => s.split(' ').map(n => n.replace(/_/g, ' ')));
const GEN_OF = {}; GEN_SPECIES.forEach((list, g) => { for (const n of list) GEN_OF[n] = g; });
// the regions next to each other (migration comes from these), by canon geography: the four Japanese regions in a ring
// (Kanto–Johto–Hoenn–Sinnoh–Kanto), Alola between Kanto, Hoenn and Unova, Unova across the ocean from Kalos and
// Galar, and Kalos, Galar and Paldea next to each other
const BUILTIN_NB = [[1, 3, 6], [0, 2], [1, 3, 6], [2, 0], [6, 5, 7], [4, 7, 8], [0, 2, 4], [5, 8, 4], [5, 7]];
// (0.30.0) the bound world's neighbour map, two-way (applyRegions)
let NEIGHBOURS = BUILTIN_NB;
const REGION_SIZE = 250, REGION_FLOOR = 5, FLOOR_BST = 450;
const regionalOn = () => featOn('regional');
// the region a species name belongs to on its own (null: none of the four)
// (0.28.0) regional forms belong to their region (Alolan to Alola, Galarian to Galar, Paldean to Paldea; Hisuian and
// White-Striped to Sinnoh, as Hisui) on top of their family's generations
const FORM_REGION = { Alolan: 6, Galarian: 7, Hisuian: 3, 'White-Striped': 3, Paldean: 8 };
function genRegion(n) {
  const f = n.match(/^(Alolan|Galarian|Hisuian|Paldean|White-Striped) /); if (f) return FORM_REGION[f[1]];
  const base = n.replace(/^(Alolan|Galarian|Hisuian|Paldean|White-Striped) /, '').replace(/ \(.*\)$/, '');
  return GEN_OF[base] != null ? GEN_OF[base] : GEN_OF[n] != null ? GEN_OF[n] : null;
}
let REGION_LINES = null, BUILTIN_LINES = null, LINE_MEMBERS = null;
const lineMembers = () => { if (!LINE_MEMBERS) { LINE_MEMBERS = {}; for (const n of Object.keys(SP)) { const b = LINE_BASE[LINE[n]]; if (b) (LINE_MEMBERS[b] = LINE_MEMBERS[b] || []).push(n); } } return LINE_MEMBERS; };
// the types a line can field at its strongest (its forms at or near the top)
const lineTypesTop = b => { const ms = lineMembers()[b] || [b], top = Math.max(...ms.map(n => SP[n].bst)); return [...new Set(ms.filter(n => SP[n].bst >= top - 60).flatMap(n => SP[n].types))]; };
// (0.30.0) the built-in nine's lists, always worked out on the built-in map so they stay the same in every world
function builtinLines() {
  if (BUILTIN_LINES) return BUILTIN_LINES;
  // (0.31.0) a custom region's own new Pokémon (regionSp) belong to that region's pool, never to the built-in lists
  const NEIGHBOURS = BUILTIN_NB, nR = BUILTIN_NB.length, mem = lineMembers(), lines = ranchSpecies().filter(b => !SP[b].regionSp);
  const sets = Array.from({ length: nR }, () => new Set()), size = Array(nR).fill(0), home = {};
  const n = b => (mem[b] || [b]).length;
  const add = (r, b) => { if (!sets[r].has(b)) { sets[r].add(b); size[r] += n(b); } };
  const spread = [];
  for (const b of lines) {
    const rs = new Set((mem[b] || [b]).map(genRegion).filter(r => r != null));
    home[b] = rs; if (rs.size) for (const r of rs) add(r, b); else spread.push(b);
  }
  // Gen V to IX (and anything else without a home): the smallest region, weighed against how many lines of its types it has
  const typeCount = (r, ty) => [...sets[r]].filter(x => lineTypesTop(x).some(t => ty.includes(t))).length;
  for (const b of spread.sort((a, c) => lineTop(c) - lineTop(a))) {
    const ty = lineTypesTop(b);
    const r = [...Array(nR).keys()].sort((a, c) => (size[a] + 6 * typeCount(a, ty)) - (size[c] + 6 * typeCount(c, ty)) || a - c)[0];
    add(r, b); home[b] = new Set([r]);
  }
  // borrowing, from neighbours first: commons before rare, starters and pseudo-legends
  const borrowOrder = (r, ok) => lines.filter(b => !sets[r].has(b) && ok(b))
    .sort((a, c) => (NEIGHBOURS[r].some(x => home[c].has(x)) - NEIGHBOURS[r].some(x => home[a].has(x))) || ((SP[a].rare || SP[a].starter ? 1 : 0) - (SP[c].rare || SP[c].starter ? 1 : 0)) || lineTop(a) - lineTop(c) || (a < c ? -1 : 1));
  for (let r = 0; r < nR; r++) {
    for (const ty of TYPES) {
      const usable = b => lineTop(b) >= FLOOR_BST && lineTypesTop(b).includes(ty);
      let have = [...sets[r]].filter(usable).length;
      for (const b of borrowOrder(r, usable)) { if (have >= REGION_FLOOR) break; add(r, b); have++; }
    }
  }
  for (let r = 0; r < nR; r++) {
    const cands = borrowOrder(r, b => NEIGHBOURS[r].some(x => home[b].has(x)));
    while (size[r] < REGION_SIZE && cands.length) {
      // the type the region has least of decides the next line
      const tc = {}; for (const b of sets[r]) for (const t of lineTypesTop(b)) tc[t] = (tc[t] || 0) + 1;
      cands.sort((a, c) => Math.min(...lineTypesTop(a).map(t => tc[t] || 0)) - Math.min(...lineTypesTop(c).map(t => tc[t] || 0)));
      add(r, cands.shift());
    }
  }
  BUILTIN_LINES = { sets, home, size };
  return BUILTIN_LINES;
}
// the bound world's lists: a built-in region uses its own list (or a pool given to it), a region with no list has none
function regionLines() {
  if (REGION_LINES && REGION_LINES.of === LEAGUE_SETS) return REGION_LINES;
  const B = builtinLines(), mem = lineMembers();
  const sets = LEAGUE_SETS.map(r => r.pool ? new Set(r.pool.filter(b => mem[b] && ranchable(b))) : r.base != null && B.sets[r.base] ? B.sets[r.base] : new Set());
  const size = sets.map(st => [...st].reduce((a, b) => a + (mem[b] || [b]).length, 0));
  // (0.31.0) orphans: lines no region of this world has (a replaced region's own, a region's new Pokémon left out of
  // its list) are re-homed by the spread rule: to the replaced region's neighbours (else the region's own neighbours,
  // else anywhere), the smallest weighed by type
  const inAny = new Set(); sets.forEach(st => st.forEach(b => inAny.add(b)));
  const orphans = ranchSpecies().filter(b => !inAny.has(b));
  if (orphans.length) {
    for (let r = 0; r < sets.length; r++) sets[r] = new Set(sets[r]);
    const all = [...Array(sets.length).keys()];
    const typeCount = (r, ty) => [...sets[r]].filter(x => lineTypesTop(x).some(t => ty.includes(t))).length;
    for (const b of orphans.sort((a, c) => lineTop(c) - lineTop(a))) {
      let from = LEAGUE_SETS.findIndex(r => r.rep != null && B.sets[r.rep] && B.sets[r.rep].has(b));
      if (from < 0 && SP[b].regionSp) from = LEAGUE_SETS.findIndex(r => r.from === SP[b].regionSp);
      const ty = lineTypesTop(b), cands = from >= 0 && (NEIGHBOURS[from] || []).length ? NEIGHBOURS[from] : all;
      const r = cands.slice().sort((a, c) => (size[a] + 6 * typeCount(a, ty)) - (size[c] + 6 * typeCount(c, ty)) || a - c)[0];
      sets[r].add(b); size[r] += (mem[b] || [b]).length;
    }
  }
  REGION_LINES = { sets, size, of: LEAGUE_SETS };
  return REGION_LINES;
}

// (0.27.0) the caches above are rebuilt when a custom Pokédex changes the species (applyDex)
function resetRegionCaches() {
  REGION_LINES = null; BUILTIN_LINES = null; LINE_MEMBERS = null; RANCH_SPECIES = null; LINE_TOP = null; MIGR_CACHE = { turn: -1 };
  for (const k of Object.keys(LINE_BASE)) delete LINE_BASE[k];
  for (const b of BASES) if (LINE[b] && LINE_BASE[LINE[b]] == null) LINE_BASE[LINE[b]] = b;
}
const nRegionsBuilt = () => LEAGUE_SETS.length;
const regionName = r => LEAGUE_SETS[r] ? LEAGUE_SETS[r].name.replace(' League', '') : 'elsewhere';
// a region's own lines (null: no list, so everything: National Dex rules, or a region not built yet)
const homeSet = r => (regionalOn() && r != null && r < nRegionsBuilt()) ? regionLines().sets[r] : null;
const lineBaseOf = sp => LINE_BASE[LINE[sp]] || null;
// (0.31.0) a custom region's new line its creator locked to the region: the region's index, else null
const homeOnly = b => (SP[b] && SP[b].homeOnly != null ? SP[b].homeOnly : null);
// the regions a line lives in
const linesRegions = b => { const R = regionLines(); return [...Array(nRegionsBuilt()).keys()].filter(r => R.sets[r].has(b)); };

// ---------- migration waves ----------
// Each region has MIGR_YEAR waves a year on average (a weekly chance while none is on), each MIGR_WEEKS long, bringing
// MIGR_LINES lines from a neighbouring region (MIGR_FAR of the time from further off) into wild finds, the market and
// catching trips there. World-level: S.migr[r] = { from, lines, at, until } while a wave is on.
const MIGR_ODDS = 0.175, MIGR_WEEKS = [6, 10], MIGR_LINES = [10, 20], MIGR_FAR = 0.15;
let MIGR_CACHE = { turn: -1 };
function migrantSet(r) {
  if (MIGR_CACHE.turn !== S.turn || MIGR_CACHE.migr !== S.migr) MIGR_CACHE = { turn: S.turn, migr: S.migr };
  if (!MIGR_CACHE[r]) { const w = S.migr && S.migr[r]; MIGR_CACHE[r] = new Set(w ? w.lines : []); }
  return MIGR_CACHE[r];
}
const migrationOf = r => (S.migr && S.migr[r]) || null;
// news of a wave in every League of the region
function regionNews(r, text) { eachLeague(() => { if (S.region === r) news(text, 'catch'); }); }
function migrationWeek() {
  if (!regionalOn()) { S.migr = null; return; }
  S.migr = S.migr || {};
  const used = new Set(eachLeague(() => S.region));
  for (let r = 0; r < nRegionsBuilt(); r++) {
    const w = S.migr[r];
    if (w && w.until <= S.turn) { delete S.migr[r]; MIGR_CACHE = { turn: -1 }; regionNews(r, `The migration from ${regionName(w.from)} has moved on; ${regionName(w.from)}'s Pokémon are no longer found in ${regionName(r)}.`); continue; }
    if (w || !used.has(r) || rand() >= MIGR_ODDS) continue;
    const far = rand() < MIGR_FAR, srcs = far ? [...Array(nRegionsBuilt()).keys()].filter(x => x !== r && !NEIGHBOURS[r].includes(x)) : NEIGHBOURS[r];
    if (!srcs.length) continue;
    const from = pick(srcs), home = regionLines().sets[r];
    let pool = [...regionLines().sets[from]].filter(b => !home.has(b) && homeOnly(b) == null);
    const n = ri(MIGR_LINES[0], MIGR_LINES[1]), lines = [];
    while (lines.length < n && pool.length) {
      const wts = pool.map(b => (SP[b].rare ? 0.3 : 1) * (SP[b].starter ? 0.3 : 1) * (lineTop(b) > 540 ? 0.4 : 1));
      let x = rand() * wts.reduce((a, c) => a + c, 0), i = 0; for (; i < pool.length - 1; i++) { x -= wts[i]; if (x <= 0) break; }
      lines.push(pool[i]); pool.splice(i, 1);
    }
    if (!lines.length) continue;
    S.migr[r] = { from, lines, at: S.turn, until: S.turn + ri(MIGR_WEEKS[0], MIGR_WEEKS[1]), far };
    MIGR_CACHE = { turn: -1 };
    regionNews(r, `Migration! ${lines.length} kinds of Pokémon from ${regionName(from)} have arrived in ${regionName(r)} (${lines.slice(0, 5).join(', ')}${lines.length > 5 ? '…' : ''}) and can be found here until ${turnDate(S.migr[r].until)}.`);
  }
}
// can line b be found in the wild in region r now (its own lines plus a migration)? Anything without a line (a
// legendary) is left to its own rules
function wildOk(sp, r = S.region) {
  const h = homeSet(r); if (!h) return true;
  const b = lineBaseOf(sp); if (!b) return true;
  const ho = homeOnly(b); if (ho != null) return ho === r; // (0.31.0) a locked custom line
  return h.has(b) || migrantSet(r).has(b);
}
// a list kept to what the region has, unless that leaves nothing (then all of it)
function regional(list, r = S.region) { if (!homeSet(r)) return list; const out = list.filter(sp => wildOk(sp, r)); return out.length ? out : list; }

// ---------- shipping lanes, Goldenrod's railway, charters ----------
// A lane is a building in a port city where the League has a gym (Goldenrod's is a railway): it serves one source region
// (x.src on the building), whose lines the League can then catch on targeted trips and find at its market all the time.
// LANE_WEEK a week on top of the usual upkeep; changing the route costs LANE_ROUTE. It lapses in the red. A charter is a
// one-off shipment from any other region: CHARTER_COST, CHARTER_WEEKS, two or three of that region's Pokémon.
const BUILTIN_PORTS = { Vermilion: 'port', Cinnabar: 'port', Olivine: 'port', Cianwood: 'port', Goldenrod: 'railway', Slateport: 'port', Lilycove: 'port', Dewford: 'port', Canalave: 'port', Sunyshore: 'port',
  // (0.28.0) the later regions: Nimbasa's Gear Station, Lumiose's and Hammerlocke's stations are railways
  Castelia: 'port', Virbank: 'port', Humilau: 'port', Nimbasa: 'railway', Coumarine: 'port', Shalour: 'port', Ambrette: 'port', Lumiose: 'railway',
  "Hau'oli": 'port', Konikoni: 'port', Seafolk: 'port', Heahea: 'port', Hulbury: 'port', Spikemuth: 'port', Hammerlocke: 'railway',
  Levincia: 'port', 'Porto Marinada': 'port', Cascarrafa: 'port' };
const LANE_WEEK = 400, LANE_ROUTE = 10000, CHARTER_COST = 12000, CHARTER_WEEKS = 3;
// (0.30.0) a city's port or railway comes from its region's own list (ports by name)
const portKind = c => (c && LEAGUE_SETS[c.region] && (LEAGUE_SETS[c.region].ports || {})[c.name]) || null;
const isPort = c => !!portKind(c);
// the bound League's lanes: [{ gym, city, src, rail }]
function lanesOf() {
  if (!S.gyms) return [];
  return S.gyms.map((g, i) => { const c = S.cities[g.city], x = c && cityB(c).find(y => y.k === 'lane'); return x ? { gym: i, city: c, x, src: laneSrc(x), rail: portKind(c) === 'railway' } : null; }).filter(Boolean);
}
const laneSrc = x => (x.src != null && x.src !== S.region && x.src < nRegionsBuilt() ? x.src : (NEIGHBOURS[S.region] || [0])[0]);
function laneSet() {
  const out = new Set(); if (!homeSet(S.region) || lapsed()) return out;
  const home = homeSet(S.region);
  for (const l of lanesOf()) for (const b of regionLines().sets[l.src]) if (!home.has(b) && homeOnly(b) == null) out.add(b);
  return out;
}
// change lane i's route (gym index) to region src
function setLane(gi, src) {
  return inLeague(ME(), () => {
    const l = lanesOf().find(x => x.gym === gi); if (!l) return 'No lane there.';
    if (src === S.region || !(src >= 0 && src < nRegionsBuilt())) return 'Choose another region.';
    if (src === l.src) return null;
    if (!canSpend(LANE_ROUTE)) return 'Not enough money.';
    book(-LANE_ROUTE, 'lanes', `${l.rail ? 'Railway' : 'Shipping lane'} from ${l.city.name} now serves ${regionName(src)}`);
    l.x.src = src;
    return null;
  });
}
const laneFee = () => lapsed() ? 0 : lanesOf().length * LANE_WEEK;

// ---------- the safari ----------
// A building in one of the League's gym cities: SAFARI_SIZE foreign lines from mixed regions, changing every
// SAFARI_WEEKS, catchable only on the League's own targeted trips (each level adds lines and SAFARI_SCOUT to the grade).
const SAFARI_SIZE = [10, 13, 16], SAFARI_WEEKS = 12, SAFARI_SCOUT = 6;
function safariLv() { if (!S.gyms || lapsed()) return 0; return Math.max(0, ...S.gyms.map(g => S.cities[g.city] ? upLevel(cityB(S.cities[g.city]), 'safari') : 0)); }
function safariWeek() {
  const R = S.ranch, lv = safariLv();
  if (!lv || !homeSet(S.region)) { if (R.safari && !lv) R.safari = null; return; }
  if (R.safari && R.safari.until > S.turn && R.safari.lv === lv) return;
  const home = homeSet(S.region), pool = ranchSpecies().filter(b => !home.has(b) && homeOnly(b) == null);
  const lines = []; let p = pool.slice();
  while (lines.length < SAFARI_SIZE[lv - 1] && p.length) { const b = pick(p); lines.push(b); p = p.filter(x => x !== b); }
  R.safari = { lines, until: R.safari && R.safari.lv !== lv && R.safari.until > S.turn ? R.safari.until : S.turn + SAFARI_WEEKS, lv };
}
const safariSet = () => new Set(S.ranch && S.ranch.safari && safariLv() ? S.ranch.safari.lines : []);

// ---------- what the bound League can get ----------
// wild finds here (area trips): the region's lines plus a migration; the market: those plus lanes; targeted trips:
// those plus the safari
function hereLines() { const h = homeSet(S.region); return h ? ranchSpecies().filter(b => h.has(b) || migrantSet(S.region).has(b)) : ranchSpecies(); }
function marketLines() { if (!homeSet(S.region)) return ranchSpecies(); const ln = laneSet(); return ranchSpecies().filter(b => wildOk(b) || ln.has(b)); }
function tripOk(b) { if (!homeSet(S.region)) return true; return wildOk(b) || laneSet().has(b) || safariSet().has(b); }
// where a line can be had by the bound League, in words (for the Ranch page)
function lineSource(b) {
  const h = homeSet(S.region); if (!h || h.has(b)) return 'home';
  if (migrantSet(S.region).has(b)) return 'migrating';
  if (laneSet().has(b)) return 'lane';
  if (safariSet().has(b)) return 'safari';
  return null;
}

// ---------- moving region with at most FOREIGN_MAX foreign Pokémon ----------
// A challenger who moves to a League in another region keeps their best FOREIGN_MAX Pokémon from outside it (special
// ones first); the rest are released (part 3 will put them in storage instead).
const FOREIGN_MAX = 3;
const REGION_LOG = { released: 0, moves: 0 };
function regionMove(t, fromR, toR) {
  if (fromR === toR || !homeSet(toR)) return;
  const home = homeSet(toR), foreign = t.team.filter(m => { const b = lineBaseOf(m.sp); return b && !home.has(b); });
  REGION_LOG.moves++;
  // (0.31.0) a line locked to its custom region never leaves it
  const keepable = foreign.filter(m => homeOnly(lineBaseOf(m.sp)) == null);
  if (foreign.length <= FOREIGN_MAX && keepable.length === foreign.length) return;
  const keep = new Set(keepable.sort((a, b) => (isSpecial(b) - isSpecial(a)) || monPower(b) - monPower(a)).slice(0, FOREIGN_MAX));
  const gone = foreign.filter(m => !keep.has(m));
  for (const m of gone) farewell(t, m, `released on moving to ${regionName(toR)}`);
  t.team = t.team.filter(m => !gone.includes(m));
  REGION_LOG.released += gone.length;
  if (t.mega && !t.team.some(m => m.uid === t.mega.uid)) t.mega = null;
}

// ---------- steers the region can't answer ----------
// For each senior post with a steer, the best Pokémon of its type the steer would want, against the best the League
// can get (its region, a migration, lanes, the safari and the ranch). A gap of STEER_GAP or more is flagged on the
// Ranch page with where that Pokémon lives; nothing is bought. Staff just use the best they can get meanwhile.
const STEER_GAP = 0.5;
function steerGaps() {
  if (!ranchOn() || !homeSet(S.region)) return [];
  const have = new Set(S.ranch.mons.map(e => e.b)), out = [];
  for (const t of seniorIds().map(T)) {
    const s = steerOf(t); if (s === 'bal' || s === 'keep') continue;
    const slot = eliteSlot(t); if (!slot) continue;
    const mixed = t.role === 'champion' || !t.specialty, ty = mixed ? [] : specTypes(t), meta = steerMeta(s), weak = weakOf(t.team);
    const score = b => { const sp = formAt(b, slot.lvl, t.specialty); if (ty.length && !SP[sp].types.some(x => ty.includes(x))) return null; if (bannedIn(sp, S.lg || 0)) return null; return steerScore(s, sp, weak, meta) + SP[sp].bst / 300; };
    let best = null, mine = -99;
    for (const b of ranchSpecies()) {
      const v = score(b); if (v == null) continue;
      if (tripOk(b) || have.has(b)) mine = Math.max(mine, v);
      else if (!best || v > best.v) best = { b, v };
    }
    if (best && best.v - mine >= STEER_GAP) out.push({ t, s, b: best.b, sp: formAt(best.b, slot.lvl, t.specialty), regions: linesRegions(best.b) });
  }
  return out;
}

// ================= THE WORLD'S REGIONS (0.30.0, design doc 6.8) =================
// A world keeps its own list of regions in the save (S.regions), so custom regions (a 10th region, or one replacing a
// built-in one) can join it. A region: { name, towns (8 gym cities), extra (3 towns with no gym), seat, seat2, nb (its
// neighbours, by index), ports ({ city name: 'port' | 'railway' }), legends (the legendaries at home there), posts
// (names for its posts, e.g. Alola's Kahuna and Trial Captain), base (the built-in region whose list it uses, or
// null), pool (its own lines, or null) }. Neighbours are two-way: a region listing another is listed back.
const REGION_FMT = 1;
function builtinRegion(i) {
  const r = BUILTIN_REGIONS[i], names = r.towns.concat(r.extra || []);
  return { name: r.name, towns: r.towns.slice(), extra: (r.extra || []).slice(), seat: r.seat, seat2: r.seat2, nb: BUILTIN_NB[i].slice(),
    ports: Object.fromEntries(names.filter(n => BUILTIN_PORTS[n]).map(n => [n, BUILTIN_PORTS[n]])),
    legends: Object.keys(BUILTIN_LEGEND_HOME).filter(sp => BUILTIN_LEGEND_HOME[sp] === i), posts: r.posts ? Object.assign({}, r.posts) : null, base: i, pool: null };
}
const builtinRegions = () => BUILTIN_REGIONS.map((_, i) => builtinRegion(i));
// bind the world's regions: S.regions (made the first time), the two-way neighbour map, the legendaries' homes
// (0.31.0) `given`: a list to bind with no world (the setup screen's preview of the regions chosen)
function applyRegions(given) {
  const regs = given || (S && S.regions ? S.regions : builtinRegions());
  if (S && !S.regions && !given) S.regions = regs;
  LEAGUE_SETS = regs;
  NEIGHBOURS = regs.map(r => (r.nb || []).filter(x => x >= 0 && x < regs.length && regs[x] !== r));
  NEIGHBOURS.forEach((nb, i) => nb.forEach(x => { if (!NEIGHBOURS[x].includes(i)) NEIGHBOURS[x].push(i); }));
  // (0.31.0) a legendary can be at home in several regions: LEGEND_HOME keeps the first, LEGEND_HOMES all of them
  LEGEND_HOME = {}; LEGEND_HOMES = {};
  regs.forEach((r, i) => (r.legends || []).forEach(sp => { if (LEGEND_HOME[sp] == null) LEGEND_HOME[sp] = i; (LEGEND_HOMES[sp] = LEGEND_HOMES[sp] || []).includes(i) || LEGEND_HOMES[sp].push(i); }));
  REGION_LINES = null; MIGR_CACHE = { turn: -1 };
}

// ================= CUSTOM REGIONS (0.31.0, design doc 6.8) =================
// The player's own regions, kept in this browser (REGION_KEY) like My Pokédex and trainer packs, made in the region
// editor (Advanced options) and shared as a file or a paste code. A region in the library: { fmt, id, name, towns (8
// gym cities), extra (3 towns), seat, seat2, nb (2 to 3 built-in regions next to it, by name), ports ({ place: 'port' |
// 'railway' }), legends (the legendaries at home there; null: a replacement keeps the replaced region's), posts ({
// leader, gymtrainer }: other names for the posts, or null), pool (its lines, by first stage), added (its own new
// Pokémon, My Pokédex entries; one over DEX_LEGEND_BST can be a legendary encounter, at home there), lock (its new
// Pokémon never leave it), rivals (false: only the player's League may
// start or open there) }. At a new game each one can be added as a new region, replace a built-in region's Pokémon
// (keeping its name, cities, ports and neighbours) or replace the whole region. Every number is provisional (item 44).
const REGION_KEY = 'plb-regions-v1', REGION_CODE = 'PLR1:', REGION_NAME_MAX = 24, POST_NAME_MAX = 20;
const REGION_WARN_LOW = 180, REGION_WARN_HIGH = 330, REGION_NB = [2, 3];
// older region files are brought up to REGION_FMT step by step: REGION_UPGRADES[n] turns format n into n + 1
const REGION_UPGRADES = {};
let regionLib = (() => {
  try { const v = JSON.parse(localStorage.getItem(REGION_KEY) || 'null'); if (v && Array.isArray(v.regions)) return { regions: v.regions.map(r => regionNorm(r, { keepId: true, lib: { regions: [] } }).rec).filter(Boolean) }; } catch (e) {}
  return { regions: [] };
})();
function saveRegionLib() { try { localStorage.setItem(REGION_KEY, JSON.stringify(regionLib)); return true; } catch (e) { return false; } }
const builtinRegionName = i => BUILTIN_REGIONS[i].name.replace(' League', '');
const builtinRegionIdx = n => BUILTIN_REGIONS.findIndex((r, i) => builtinRegionName(i).toLowerCase() === String(n).toLowerCase());
const LEGEND_CHOICES = () => Object.keys(BUILTIN_LEGEND_HOME);
const regionId = () => 'r' + Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36);
const placesOf = rec => rec.towns.concat(rec.extra, [rec.seat, rec.seat2]);

// ---------- starting a region: blank, a copy of a built-in region, or generated ----------
function regionBlank() {
  return { fmt: REGION_FMT, id: null, name: 'New Region', towns: Array.from({ length: 8 }, (_, i) => `City ${i + 1}`), extra: ['Town 1', 'Town 2', 'Town 3'],
    seat: 'League Seat', seat2: 'Second Seat', nb: [], ports: {}, legends: [], posts: null, pool: [], added: [], lock: false, rivals: true };
}
function regionCopy(i) {
  const b = builtinRegion(i), rec = regionBlank();
  return Object.assign(rec, { name: `My ${builtinRegionName(i)}`, towns: b.towns.slice(), extra: b.extra.slice(), seat: b.seat, seat2: b.seat2,
    nb: b.nb.map(builtinRegionName), ports: Object.assign({}, b.ports), legends: b.legends.slice(), posts: b.posts ? Object.assign({}, b.posts) : null,
    pool: [...builtinLines().sets[i]].sort() });
}
// the generation a line comes from (0 = Gen I … 8 = Gen IX), 'other' for custom lines
function lineGen(b) { const g = genRegion(b); return g == null || SP[b].dexMod === 'new' ? 'other' : g; }
// a generated list: lines of the chosen types (any, if none) and generations (any, if none), to about `size` species.
// power: 'gentle' (nothing past 540, nothing rare), 'standard' (at most GEN_PSEUDO lines reaching 600), 'strong'
// (strong lines likelier, no limit)
const GEN_PSEUDO = 3;
function generatePool(o = {}) {
  const types = o.types || [], gens = o.gens || [], size = o.size || REGION_SIZE, power = o.power || 'standard', mem = lineMembers();
  let cands = ranchSpecies().filter(b => (!types.length || lineTypesTop(b).some(t => types.includes(t))) && (!gens.length || gens.includes(lineGen(b))));
  if (power === 'gentle') cands = cands.filter(b => lineTop(b) <= 540 && !SP[b].rare);
  const out = []; let n = 0, pseudo = 0;
  const wt = b => power === 'strong' ? Math.pow(lineTop(b) / 450, 3) : (SP[b].rare || SP[b].starter ? 0.5 : 1);
  while (n < size && cands.length) {
    const w = cands.map(wt); let x = rand() * w.reduce((a, c) => a + c, 0), i = 0;
    for (; i < cands.length - 1; i++) { x -= w[i]; if (x <= 0) break; }
    const b = cands.splice(i, 1)[0];
    if (lineTop(b) >= 600 && power === 'standard') { if (pseudo >= GEN_PSEUDO) continue; pseudo++; }
    out.push(b); n += (mem[b] || [b]).length;
  }
  return out.sort();
}

// ---------- checks (warn, don't block, except for names) ----------
// a list's size in species, its lines, and the types under the floor (REGION_FLOOR lines reaching FLOOR_BST)
function poolStats(pool) {
  const mem = lineMembers(), lines = [...new Set(pool)].filter(b => mem[b] && ranchable(b));
  const size = lines.reduce((a, b) => a + mem[b].length, 0);
  const typeN = Object.fromEntries(TYPES.map(t => [t, 0]));
  for (const b of lines) if (lineTop(b) >= FLOOR_BST) for (const t of lineTypesTop(b)) typeN[t]++;
  return { lines, size, typeN, thin: TYPES.filter(t => typeN[t] < REGION_FLOOR), missing: pool.filter(b => !mem[b]) };
}
function regionChecks(rec, lib = regionLib) {
  const errs = [], warns = [], st = poolStats(rec.pool), nm = String(rec.name || '').trim();
  if (placesOf(rec).concat([nm], Object.values(rec.posts || {})).some(x => /[<>"`\\]/.test(String(x || '')))) errs.push('Names can\'t contain < > " ` or \\.');
  if (!nm) errs.push('Give the region a name.'); else if (nm.length > REGION_NAME_MAX) errs.push(`Region names can be up to ${REGION_NAME_MAX} characters.`);
  else if (lib.regions.some(r => r.id !== rec.id && r.name.toLowerCase() === nm.toLowerCase())) errs.push(`You already have a region called ${nm}.`);
  const places = placesOf(rec).map(x => String(x || '').trim());
  if (places.some(x => !x)) errs.push('Every city, town and seat needs a name.');
  if (places.some(x => x.length > REGION_NAME_MAX)) errs.push(`Place names can be up to ${REGION_NAME_MAX} characters.`);
  const low = places.map(x => x.toLowerCase()), dup = low.filter((x, i) => x && low.indexOf(x) !== i);
  if (dup.length) errs.push(`Two places share a name (${places[low.indexOf(dup[0])]}).`);
  if (rec.posts && Object.values(rec.posts).some(x => String(x || '').length > POST_NAME_MAX)) errs.push(`Post names can be up to ${POST_NAME_MAX} characters.`);
  if (builtinRegionIdx(nm) >= 0) warns.push(`${nm} is also a built-in region's name; added as a new region the two would share it.`);
  if (!st.lines.length) warns.push('The list is empty: challengers will find every Pokémon here until you add some.');
  else if (st.size < REGION_WARN_LOW || st.size > REGION_WARN_HIGH) warns.push(`${st.size} species: the built-in regions have about ${REGION_SIZE}.`);
  if (st.lines.length && st.thin.length) warns.push(`Thin types (fewer than ${REGION_FLOOR} lines reaching ${FLOOR_BST}): ${st.thin.join(', ')}. Staff of those types will fall back on what they can get.`);
  if (rec.nb.length && (rec.nb.length < REGION_NB[0] || rec.nb.length > REGION_NB[1])) warns.push(`${rec.nb.length} neighbour${rec.nb.length === 1 ? '' : 's'}: regions usually have ${REGION_NB[0]} or ${REGION_NB[1]}.`);
  if (!rec.nb.length) warns.push('No neighbours chosen: as a new region it takes the two built-in regions that share most of its Pokémon; as a replacement, the replaced region\'s.');
  if (st.missing.length) warns.push(`${st.missing.length} Pokémon on the list aren't in the game with the Pokédex you're using (${st.missing.slice(0, 4).join(', ')}${st.missing.length > 4 ? '…' : ''}); they're skipped.`);
  return { errs, warns, st };
}

// ---------- the shape of a region, from the editor or a file ----------
// a region file or library entry made tidy, upgraded from older formats; Pokémon of its own whose names are taken
// (the game's, My Pokédex's or another region's in the library) are left out and listed in `dropped`
function regionNorm(raw, o = {}) {
  if (raw && raw.plbRegion != null && raw.region) raw = Object.assign({}, raw.region, { fmt: raw.plbRegion });
  if (!raw || typeof raw !== 'object' || !Array.isArray(raw.towns)) return { err: "That isn't a region file." };
  let fmt = Number.isInteger(raw.fmt) ? raw.fmt : 1;
  if (fmt > REGION_FMT) return { err: 'That region was made with a newer version of the game. Update the game to load it.' };
  raw = JSON.parse(JSON.stringify(raw));
  while (fmt < REGION_FMT) { raw = (REGION_UPGRADES[fmt] || (x => x))(raw); fmt++; }
  const str = (x, max = REGION_NAME_MAX) => String(x == null ? '' : x).replace(/[<>"`\\]/g, '').trim().replace(/\s+/g, ' ').slice(0, max);
  const list = (x, n, def) => Array.from({ length: n }, (_, i) => str(Array.isArray(x) && x[i] != null ? x[i] : def(i)));
  const rec = { fmt: REGION_FMT, id: o.keepId && typeof raw.id === 'string' ? raw.id : null, name: str(raw.name) || 'Region',
    towns: list(raw.towns, 8, i => `City ${i + 1}`), extra: list(raw.extra, 3, i => `Town ${i + 1}`), seat: str(raw.seat) || 'League Seat', seat2: str(raw.seat2) || 'Second Seat' };
  rec.nb = [...new Set((Array.isArray(raw.nb) ? raw.nb : []).map(n => builtinRegionIdx(n)).filter(i => i >= 0))].map(builtinRegionName);
  const names = new Set(rec.towns.concat(rec.extra));
  rec.ports = Object.fromEntries(Object.entries(raw.ports && typeof raw.ports === 'object' ? raw.ports : {}).filter(([k, v]) => names.has(k) && (v === 'port' || v === 'railway')));
  rec.legends = raw.legends == null ? null : [...new Set((Array.isArray(raw.legends) ? raw.legends : []).filter(x => LEGEND_CHOICES().includes(x)))];
  // (0.31.0) any of the four posts can have a name of the region's own (blank: the usual one)
  const posts = raw.posts && typeof raw.posts === 'object' ? Object.fromEntries(['leader', 'gymtrainer', 'e4', 'champion'].map(k => [k, str(raw.posts[k], POST_NAME_MAX)]).filter(([, v]) => v)) : null;
  rec.posts = posts && Object.keys(posts).length ? posts : null;
  rec.lock = !!raw.lock; rec.rivals = raw.rivals !== false;
  // its own Pokémon: My Pokédex entries (a legendary encounter too, over DEX_LEGEND_BST), checked with every other new
  // Pokémon in view
  const dropped = [], others = (o.lib || regionLib).regions.filter(r => !rec.id || r.id !== rec.id).flatMap(r => r.added || []);
  let added = (Array.isArray(raw.added) ? raw.added : []).map(e => dexNorm(e)).filter(x => { if (dexEntryOk(x) && x.name) return true; dropped.push({ name: x.name || '?', why: 'broken' }); return false; });
  if (!o.keepId) {
    dexSnapshot();
    const taken = n => { const low = n.toLowerCase(); return Object.keys(DEX_BASE).some(x => x.toLowerCase() === low) || Object.values(MEGA).flat().some(f => f.name.toLowerCase() === low) || dexLib.added.some(x => x.name.toLowerCase() === low) || others.some(x => x.name.toLowerCase() === low); };
    added = added.filter(x => { if (!taken(x.name)) return true; dropped.push({ name: x.name, why: 'taken' }); return false; });
    for (let changed = true; changed;) {
      changed = false;
      const lib = { edits: {}, added: dexLib.added.concat(others, added) };
      for (const x of added.slice()) if (checkDexEntry(x, true, x.name, lib).length) { added.splice(added.indexOf(x), 1); dropped.push({ name: x.name, why: 'broken' }); changed = true; }
    }
  }
  rec.added = added;
  const gone = new Set(dropped.map(d => d.name));
  const legs = new Set(added.filter(x => x.legend).map(x => x.name));
  rec.pool = [...new Set((Array.isArray(raw.pool) ? raw.pool : []).map(x => String(x)).filter(x => x && !gone.has(x) && !legs.has(x)))];
  return { rec, dropped };
}

// ---------- sharing: a file (JSON) or a paste code ----------
const regionFileText = rec => JSON.stringify({ plbRegion: REGION_FMT, region: Object.assign({}, rec, { id: undefined }) });
const regionFileName = rec => `pokemon-league-builder-region-${String(rec.name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'region'}.json`;
function utf8B64(str) { const b = new TextEncoder().encode(str); let bin = ''; for (let i = 0; i < b.length; i += 0x8000) bin += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000)); return btoa(bin); }
const b64Utf8 = b64 => new TextDecoder().decode(Uint8Array.from(atob(b64), c => c.charCodeAt(0)));
const regionCode = rec => REGION_CODE + utf8B64(regionFileText(rec));
// read a file's text or a paste code into a region for the library (not saved yet)
function regionRead(txt) {
  let raw; txt = String(txt || '').trim();
  try { raw = JSON.parse(txt.startsWith(REGION_CODE) ? b64Utf8(txt.slice(REGION_CODE.length).replace(/\s+/g, '')) : txt); } catch (e) { return { err: "That isn't a region file or code. Paste the whole code from Export." }; }
  return regionNorm(raw);
}
// a name not yet used in the library
function regionUniqueName(n, id) {
  const used = new Set(regionLib.regions.filter(r => r.id !== id).map(r => r.name.toLowerCase()));
  if (!used.has(n.toLowerCase())) return n;
  for (let k = 2; ; k++) { const x = `${n.slice(0, REGION_NAME_MAX - 3)} ${k}`; if (!used.has(x.toLowerCase())) return x; }
}
// save a region to the library (new or changed); returns the problems that stop it, else []
function saveRegion(rec) {
  const c = regionChecks(rec); if (c.errs.length) return c.errs;
  rec = JSON.parse(JSON.stringify(rec)); rec.fmt = REGION_FMT; rec.name = rec.name.trim();
  const at = rec.id ? regionLib.regions.findIndex(r => r.id === rec.id) : -1;
  if (at >= 0) regionLib.regions[at] = rec; else { rec.id = regionId(); regionLib.regions.push(rec); }
  saveRegionLib();
  return [];
}
function addImportedRegion(rec) { rec = Object.assign({}, rec, { id: regionId(), name: regionUniqueName(rec.name, null) }); regionLib.regions.push(rec); saveRegionLib(); return rec; }
function deleteRegion(id) { regionLib.regions = regionLib.regions.filter(r => r.id !== id); saveRegionLib(); }
const libRegion = id => regionLib.regions.find(r => r.id === id) || null;
// the editor's preview: the region's own Pokémon on top of My Pokédex, so its lists and checks see them
function regionDex(rec) {
  const base = dexLib.on ? dexLib : { edits: {}, added: [] };
  return rec && rec.added.length ? { edits: base.edits, added: base.added.concat(rec.added.map(e => Object.assign({}, e, { reg: rec.name }))) } : (dexLib.on ? dexLib : null);
}

// ---------- a new game's regions ----------
// choices: [{ rec, mode: 'add' | 'pool' | 'whole', of: a built-in region (pool and whole) }]; a later replacement of
// the same region wins, and anything broken is left out. Each gets the index it will have in the world (`at`).
function regionChoices(list) {
  const out = [];
  for (const c of Array.isArray(list) ? list : []) {
    if (!c || !c.rec || !['add', 'pool', 'whole'].includes(c.mode)) continue;
    const n = regionNorm(c.rec, { keepId: true }); if (!n.rec) continue;
    if (c.mode !== 'add') { if (!BUILTIN_REGIONS[c.of]) continue; const k = out.findIndex(x => x.mode !== 'add' && x.of === c.of); if (k >= 0) out.splice(k, 1); }
    out.push({ rec: n.rec, mode: c.mode, of: c.mode === 'add' ? null : c.of });
  }
  let next = BUILTIN_REGIONS.length;
  for (const c of out) c.at = c.mode === 'add' ? next++ : c.of;
  return out;
}
// the world's Pokédex with the chosen regions' own Pokémon (tagged with their region, and its index if locked)
function withRegionSpecies(dex, choices) {
  const extra = [], names = new Set(dex ? (dex.added || []).map(x => x.name.toLowerCase()) : []);
  for (const c of choices) for (const e of c.rec.added) {
    const low = e.name.toLowerCase(); if (names.has(low)) continue; names.add(low);
    extra.push(Object.assign({}, e, { reg: c.rec.name, home: c.rec.lock ? c.at : undefined }));
  }
  if (!extra.length) return dex;
  return { edits: dex ? dex.edits || {} : {}, added: (dex ? dex.added || [] : []).concat(extra) };
}
function worldRegions(choices) {
  const regs = builtinRegions(), adds = [];
  const nbOf = rec => rec.nb.map(builtinRegionIdx).filter(i => i >= 0);
  // (0.31.0) a region's own legendaries (legendary encounters among its new Pokémon) are at home there
  const ownLegs = rec => rec.added.filter(e => e.legend && !e.from).map(e => e.name);
  const make = (rec, old, at) => ({ name: rec.name + ' League', towns: rec.towns.slice(), extra: rec.extra.slice(), seat: rec.seat, seat2: rec.seat2,
    nb: nbOf(rec).length ? nbOf(rec) : old ? old.nb.slice() : null, ports: Object.assign({}, rec.ports),
    legends: (rec.legends ? rec.legends.slice() : old ? old.legends.slice() : []).concat(ownLegs(rec)), claims: rec.legends ? rec.legends.slice() : null,
    posts: rec.posts ? Object.assign({}, rec.posts) : null, base: null, pool: rec.pool.slice(), rep: old ? at : null, from: rec.name, lock: !!rec.lock, solo: rec.rivals === false });
  for (const c of choices) {
    if (c.mode === 'pool') Object.assign(regs[c.of], { pool: c.rec.pool.slice(), base: null, rep: c.of, from: c.rec.name, lock: !!c.rec.lock, solo: c.rec.rivals === false, legends: regs[c.of].legends.concat(ownLegs(c.rec)) });
    else if (c.mode === 'whole') regs[c.of] = make(c.rec, regs[c.of], c.of);
    else adds.push(make(c.rec, null, null));
  }
  regs.push(...adds);
  // a new region with no neighbours (or none left) takes the two built-in regions sharing most of its Pokémon
  const B = builtinLines();
  for (const r of regs) if (!r.nb || !r.nb.length) {
    const pool = new Set(r.pool || []);
    r.nb = BUILTIN_REGIONS.map((_, i) => i).filter(i => regs[i] !== r).sort((a, b) => [...B.sets[b]].filter(x => pool.has(x)).length - [...B.sets[a]].filter(x => pool.has(x)).length || a - b).slice(0, 2);
  }
  // (0.31.0, the owner) legendaries a custom region claims stay at home where they were too: one more can be in the world
  // for each region that has it at home (legendCap)
  regs.forEach(r => { delete r.claims; });
  return regs;
}
// what the chosen regions' own Pokémon lose at a new game: names already in My Pokédex or another chosen region
function regionClashes(choices) {
  const seen = new Set((dexLib.on ? dexLib.added : []).map(x => x.name.toLowerCase())), out = [];
  for (const c of regionChoices(choices)) for (const e of c.rec.added) { const low = e.name.toLowerCase(); if (seen.has(low)) out.push(`${e.name} (${c.rec.name})`); seen.add(low); }
  return out;
}

if (typeof module !== 'undefined') module.exports = { regionLib, saveRegionLib, regionBlank, regionCopy, lineGen, generatePool, poolStats, regionChecks, regionNorm, regionFileText, regionFileName, regionCode, regionRead, regionUniqueName, saveRegion, addImportedRegion, deleteRegion, libRegion, regionDex, regionChoices, withRegionSpecies, worldRegions, regionClashes, homeOnly, rivalOk, REGION_CODE, set dexPreview(v) { dexPreview = v; }, regionLines, builtinLines, applyRegions, startRegions, maxStartLeagues, builtinRegions, REGION_FMT, portKind, get LEAGUE_SETS() { return LEAGUE_SETS; }, get LEGEND_HOME() { return LEGEND_HOME; }, get LEGEND_HOMES() { return LEGEND_HOMES; }, legendCap, legendHomes, legendHeld, greatFree, genRegion, lineTypesTop, resetRegionCaches, nRegionsBuilt, regionName, homeSet, lineBaseOf, linesRegions, migrantSet, migrationOf, migrationWeek, wildOk, regional, BUILTIN_PORTS, isPort, lanesOf, laneSet, setLane, laneFee, LANE_WEEK, LANE_ROUTE, CHARTER_COST, CHARTER_WEEKS, safariLv, safariSet, SAFARI_SIZE, hereLines, marketLines, tripOk, lineSource, FOREIGN_MAX, REGION_LOG, regionMove, steerGaps, get NEIGHBOURS() { return NEIGHBOURS; }, REGION_SIZE, regionalOn, ranchOn, ranchFor, ranchCap, ranchRoom, ranchEntry, ranchSync, ranchFree, ranchPicks, ranchSwap, ranchStock, ranchScout, ranchUpkeep, ranchWeek, ranchLv, ranchSpecies, ranchable, freeEntry, AI_IDLE, ranchSpares, monValue, entryValue, monGrade, gradeStars, lineTop, tripPlan, tripMax, startTrip, buyShop, listings, listMon, unlistMon, buyListing, sellMon, lockMon, reserveMon, stopPosts, seniorIds, aimRanch, RANCH_CAP, RANCH_UPKEEP, SALE_SHARE, SELL_BACK, AREA_COST, SHOP_SIZE, SALE_WEEKS, TRIP_MAX, prestMin, willSign, prestBlock, hungry, foundingCands, foundSignable, PM_FREE, PM_PER, prestQ, grow, growPot, growAges, talent, coachOf, startAge, siteOn, noteSite, sanctIncome, sanctLevels, SITE_YEARS, obeyBadges, obeys, legendElsewhere, paradoxHeld, regionMul, AREA_ZERO, PARADOX_FIND, RESTORE_SHARE, ruinsAt, distressOffers, buyDistress, declineDistress, DISTRESS_OFFER_WEEKS, foldRegions, foldRegion, lapsed, sellBuilding, sellValue, salvage, topLevels, foldLeague, foldNewYear, removeLeague, decayOne, distressSale, prestOf, SELL_SHARE, DISTRESS_SHARE, DECAY_WEEKS, FOLD_YEARS, founderBar, sponStipend, contendersOf, contendersAt, sendCands, sponTargets, sendContender, recallContender, canRenew, renewContender, sponsorWeek, sponsorNewYear, leaveCheck, leaveTakers, leaveLeague, SPON_MAX, SPON_BOUNTY, SPON_E4_BOUNTY, LEAVE_FEE, LEAVE_TAKE, underContract, ME, trainerPrestige, leaguePrestige, prestigeNewYear, regionsWithRoom, nextRegion, REGION_CAP, PRESTIGE_BAR, aimBid, aimUpgrade, runningNet, AIM_BID, AIM_UPGRADE, estateCost, upkeepWeek, builtCost, slotsUsed, upMax, upCost, UPKEEP, ACADEMY_PAY, ACADEMY_LOYAL, academyLv, gymMap, cityCtrl, cityShare, cityIncome, standing, CITY_INCOME, AIMS, AIM_KEYS, aimOf, aimMonth, redWeek, RED_BITE_WEEKS, richMul, playerFin, myBooks, booksOn, payOf, askFor, wageBill, money, canSpend, giveRaise, canRaise, raiseCost, UPGRADES, myPlaces, buildCheck, build, moveGym, homeEdge, placeLv, citySlots, banCands, payBan, paidBans, banProtected, BIDS, START_FUND, ENTRY_FEE, MOVE_FEE, BAN_PAID_MAX, scoutLv, attractionIncome, STEERS, STEER_KEYS, setSteer, steerOf, steerAt, postKey, steerMonth, answersOnType, metaTypes, answerChallenge, approveAllChallenges, runChallenge, chalValid, seatChallenges, SEAT_LOGS, CLAIM_ANSWER, claimOn, claimant, claimRefused, CLAIM_PRESTIGE, CHAL_WAIT, CHAL_ANSWER, seatYears, swapRefusal, refusal, ambClock, ambDue, restless, careerBase, promoteForVacancy, staffQuits, poorRecord, QUIT_NOTICE, AMB_WAIT_YEARS, RUN_HOLD, hireForVacancy, hireForGymTrainer, offerPost, withdrawOffer, gymOutsiders, impressed, hireRetirees, acceptsOffer, canOffer, HIRE_NOTICE, rivalHire, POOR_YEARS, REFUSED_WEEKS, releaseStaff, swapStaff, placeGymTrainer, gymTrainerCands, postOf, gymLineKey, gymStageNow, GYM_WATCH, staffRetires, announceStepDown, stepDownChance, postYears, postName, vacancyCands, fillVacancy, autoFillVacancy, fillAllVacancies, prepFounding, foundPool, foundPlace, foundingFill, finishFounding, foundTypesUsed, foundPlaced, playerLeague, handOn, godEdit, walkingPartner, openNewLeague, worldGrowth, godOn, godOpenLeague, nextRegionName, BAN_BALLOT, BAN_CAP, BAN_MAX_NEW, BAN_MAX_SEASONS, banShare, trainerBanVote, trainerBanVotes, banTrainers, banLen, banLeft, expireBans, banMembers, bansIn, banOf, bannedIn, buildBanBallot, enforceBans, startWorld, simYear, simWeeks, YEAR_WEEKS, dateName, weekName, yearOf, bweek, applyDex, dexImport, checkDexEntry, dexNorm, dexBaseStats, get dexLib() { return dexLib; }, set dexLib(v) { dexLib = v; }, BASE_STATS, SPECIES_AB, STARTERS, LINE, EVOLVED, GREAT_LEGENDS, makeMon, ROAMERS, STORMS, settleStorm, stormRank, ABILITIES, abilityOf, rollAbSlot, ITEMS, TYPE_ITEMS, itemScore, autoEquip, eliteItems, gymItemOffer, bagAdd, heldItem, crossroads, reinvent, dryStreak, isGrandSlam, champLeaguesOf, checkGrandSlams, useLeague, inLeague, eachLeague, nLeagues, lgOf, leagueFit, worldChampionship, leagueName, startLegend, legendBattle, legendWeek, legendOffseason, joinLegend, weald, wantsLegend, recordGreat, REWARD_LEGENDS, FEATURES, featOn, legacyChance, scheduleLegacy, makeLegacy, legacyLine, metaMons, counterTypesFor, metaCounters, AWARDS, seasonAwards, seasonScore, circuitLevel, bondBlocked, BOND_ROLES, checkBonds, bondMon, bondName, BOND_ATK, titleOf, titleNameTaken, famName, famBase, chooseFamous, checkCustom, checkPackName, setCustomLib, parsePackText, prepImport, builtinSource, packExportText, uniquePackName, BUILTIN_SOURCES, ensureCustom, useCustom, customSpecies, newCustomKey, get customLib() { return customLib; }, MALE, FEMALE, FAMOUS_PACKS, BASE_FAMOUS, packOn, famousAvailable, MEGA, megaFor, hasMega, megaHolder, assignMegaStone, earnMega, staffGym, staffIds, gymFits, seedRandom, typeLabel, setTeamLevel, challengerLevel, depthName, GYM_LV, GYM_SIZE, GYM_TRAINERS, GYM_TRIES, E4_LV, E4_SIZE, isSpecial, monTypes, makeDelta, DELTA_CHANCE, gymLost, adaptGym, activeOutbreak, maybeOutbreak, homeLeague, isLegendLine, legendBlocked, pooledLegend, claimLegend, legendDepartures, curSeason, eliteSlot, TRAITS, traitOf, h2hOf, isRival, roadBattles, FAMOUS_TAG_LIST, FAMOUS_BY_NAME, ULTRA_BEASTS, BABY_LEGENDS, ownedLegends, freeBabies, PARADOX, DUAL_CLASSES, specTypes, specFit, applyCfg, careerSpan, ageRetireChance, leadStyle, LEAD_STYLES, coverOptions, MOVES, idealMoves, refreshMoves, estimate, battler, natureFx, NATURES, TEMPER, temperOf, temperMul, moveLv, ensureMon, learnedCov, frTier, formTier, trainerRec, blankStat, FAMOUS, LEGENDS, dn, CLASSES, get S() { return S; }, set S(v) { S = v; }, newWorld, simWeek, aiAction, aiCatch, wildOffers, ovr, T, challengers, SP, BASES, battle, fillCircuits, circuitValue, makeNewcomers, settleBanVote, CIRCUIT_SIZE, START_TEAM, banLength, slamRoom, shiftLeague, retire, regionCities, townName, gymCity, SAVE_VERSION };
