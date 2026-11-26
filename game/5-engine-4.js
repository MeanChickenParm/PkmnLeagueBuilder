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
const entryValue = e => Math.round(monValue(e.b, e.g) * condMul(e.c) / 50) * 50; // (0.36.0) × its condition
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
const newRanch = () => ({ mons: [], trips: [], shop: [], log: [], stock: [], keep: [], dc: { pool: [], pairs: [], wait: [] } }); // (0.44.0) the ranch log, the safari's stock and kept lines
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
// the entry a dropped Pokémon becomes, or null if it can't go in the ranch (a legendary, a baby legendary, a gift, a
// stopgap; since 0.36.0 alphas, shinies, Deltas and Radiants can, keeping their condition)
function entryOfMon(m, of) {
  if (!ranchKeeps(m)) return null;
  const b = LINE_BASE[LINE[m.sp]]; if (!b || !ranchable(b)) return null;
  const top = m.top && SP[m.top] && LINE[m.top] === LINE[m.sp] ? m.top : m.sp;
  const e = { uid: uid(), b, sp: top, g: monGrade(m), iv: Object.assign({}, m.iv), nat: m.nat || null, from: 'staff', got: S.turn || 0, at: null, res: null, lock: false, of, sale: null };
  const c = condOf(m); if (c) e.c = c;
  if (m.tut) e.tut = 1; // (0.64.0) a Move Tutor's lesson stays with it
  return e;
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
  // (0.38.0) a backup-type mark only stays on a typed post's Pokémon that is still off their type (a promotion to
  // Champion, a type change at the gym or an evolution clears it)
  for (const id of seniorIds()) { const t = T(id), mixed = t.role === 'champion' || !t.specialty; for (const m of t.team) if (m.backup && (mixed || onSpec(t, m.sp) || !monTypes(m).some(x => backupTypes(t).includes(x)))) delete m.backup; }
  for (const id of seniorIds()) for (const m of T(id).team) if (m.rid != null) { if (byUid.has(m.rid) && !held.has(m.rid)) held.set(m.rid, id); else m.rid = null; }
  // (0.28.0) an acting holder sent back to a gym trainer's place keeps what they fielded, like anyone leaving the
  // senior staff, even if the entry never recorded them; their stopgaps stay behind
  const gone = new Set();
  for (const g of S.gyms || []) for (const id of g.trainers || []) { const t = id != null && T(id); if (!t || t.role !== 'gymtrainer') continue;
    if (t.team.some(m => m.stop) && t.team.some(m => !m.stop)) t.team = t.team.filter(m => !m.stop);
    for (const m of t.team) if (m.rid != null) { if (!held.has(m.rid)) gone.add(m.rid); m.rid = null; } }
  if (gone.size) R.mons = R.mons.filter(e => !gone.has(e.uid));
  R.mons = R.mons.filter(e => {
    if (held.has(e.uid)) { e.at = held.get(e.uid); e.idle = null; if (e.bench != null) delete e.bench; return true; }
    if (e.at != null) { const p = T(e.at); if (p && (p.team || []).some(m => m.rfrom === e.uid)) { for (const m of p.team) if (m.rfrom === e.uid) m.rid = null; return false; } e.at = null; }
    if (e.idle == null) e.idle = S.turn || 0; // (0.26.0) the turn it was last fielded (or came in)
    return true;
  });
}
// the entries trainer t may take: not locked, listed or reserved for another post, held by nobody else
function ranchFree(t) {
  const key = postKey(t);
  return S.ranch.mons.filter(e => !e.lock && !e.sale && (e.res == null || e.res === key) && (e.at == null || e.at === t.id) && !planClaim(e.uid, key)); // (0.39.0) not planned for another post
}
// a ranch Pokémon taken onto t's team at level L: its IVs from the entry; Training gives it a fitting nature and
// coverage as often as it does in the old builder
function ranchMon(t, e, L, form) {
  const sp = form || ranchForm(e, L, t.specialty), care = trainCare(t);
  const m = { uid: uid(), sp, lvl: L, iv: Object.assign({}, e.iv), rid: e.uid, rfrom: e.uid, g: e.g };
  if (e.nat) m.nat = e.nat;
  if (e.c) Object.assign(m, e.c); // (0.36.0) its condition: a Delta's type and ability, a Radiant's ability
  if (!m.nat && rand() < care) { const cat = moveCat(m, sp); if (cat) m.nat = pick(cat === 'P' ? ['Adamant', 'Jolly'] : ['Modest', 'Timid']); }
  if (rand() < care) {
    const bad = TYPES.filter(a => SP[sp].types.reduce((x, d) => x * effOne(a, d), 1) >= 2);
    const val = c => bad.filter(a => effOne(c.t, a) >= 2).length;
    m.cov = coverOptions(sp).map((c, i) => [c, val(c) - i / 10]).sort((a, b) => b[1] - a[1]).slice(0, 2).map(x => x[0]).sort((a, b) => a.lv - b.lv);
  }
  if (e.tut) { m.tut = 1; m.cov = tutorCov(t, m); } // (0.64.0)
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
// (0.38.0) backup types: every typed trainer has BACKUP_N types outside their own that their ranch picks fall back on
// when the ranch can't fill their team with their own type, before stopgaps. Drawn once per trainer and type (stable
// from the id, so nothing is saved and a gym that changes type redraws them), weighted toward types that answer the
// trainer's own weaknesses (Ice: Fire and Steel likelier than Dragon). At most BACKUP_SHARE of a team; the monthly swap
// trades one back for a Pokémon of their own type as soon as the ranch has one. The gym still counts as its type.
const BACKUP_N = 3, BACKUP_COVER = 2, BACKUP_SHARE = 0.5;
const backupCache = new Map();
function backupTypes(t) {
  const own = specTypes(t); if (!own.length || t.id == null) return [];
  const key = t.id + '|' + own.join('/');
  if (backupCache.has(key)) return backupCache.get(key);
  const threats = TYPES.filter(a => own.some(d => effOne(a, d) >= 2));
  let pool = TYPES.filter(x => !own.includes(x)).map(x => [x, 1 + BACKUP_COVER * threats.filter(a => effOne(a, x) < 1 || effOne(x, a) >= 2).length]);
  let h = ((t.id * 2654435761) ^ own.reduce((a, x) => a * 31 + TYPES.indexOf(x) + 1, 7)) >>> 0;
  const next = () => { h = (Math.imul(h, 1664525) + 1013904223) >>> 0; return h / 4294967296; };
  const out = [];
  while (out.length < BACKUP_N && pool.length) {
    let r = next() * pool.reduce((a, x) => a + x[1], 0), i = 0;
    while (i < pool.length - 1 && (r -= pool[i][1]) > 0) i++;
    out.push(pool[i][0]); pool = pool.filter((_, j) => j !== i);
  }
  out.sort((a, b) => TYPES.indexOf(a) - TYPES.indexOf(b));
  backupCache.set(key, out);
  return out;
}
// how many backup-type Pokémon a team of `size` may field (a Gym Leader's six, an Elite Four member's six)
const backupMax = size => Math.floor(size * BACKUP_SHARE);
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
  // (0.38.0) backup types, used only once nothing of their own type is left
  const alt = opts.mixed || opts.noAlt ? [] : backupTypes(t);
  let altLeft = alt.length ? backupMax(t.role === 'leader' ? LEADER_HOLD : E4_SIZE) - (opts.team || []).filter(m => m.backup).length : 0;
  let cands = (opts.own || []).map(m => ({ sp: m.sp, g: monGrade(m), m })), altC = [];
  for (const e of ranchFree(t)) {
    if (mine.has(e.uid)) continue;
    const sp = ranchForm(e, L, t.specialty); if (bannedIn(sp, lg)) continue;
    const ety = entryTypes(e, sp); // (0.36.0) a Delta by its own type
    if (!ty.length || ety.some(x => ty.includes(x))) { cands.push({ sp, g: e.g, e }); continue; }
    if (offOk && steerScore('trend', sp, {}, meta) + SP[sp].bst / 300 > 2) cands.push({ sp, g: e.g, e, off: true });
    if (alt.length && ety.some(x => alt.includes(x))) altC.push({ sp, g: e.g, e, alt: true });
  }
  cands = cands.filter(c => !lines.has(LINE[c.sp])); altC = altC.filter(c => !lines.has(LINE[c.sp]));
  const steerV = sp => (steer === 'bal' ? 0 : fol * steerScore(steer, sp, weak, meta)) + (sig && sig.has(LINE[sp]) ? 2 * fol : 0);
  while (out.length < n) {
    const from = cands.length ? cands : altLeft > 0 ? altC : [];
    if (!from.length) break;
    const sc = c => fitScore(c.sp, weak, threats) + steerV(c.sp) + GRADE_PICK * (c.g - 3) + (c.m ? OWN_PICK + (isSpecial(c.m) ? 5 : 0) : 0) + (c.e && c.e.res === key ? RES_PICK : 0) + (rand() - 0.5) * 2 * noise;
    const best = from.map(c => [c, sc(c)]).sort((a, b) => b[1] - a[1])[0][0];
    const m = best.m || ranchMon(t, best.e, L, best.sp);
    if (best.off) { m.offType = true; cands = cands.filter(c => !c.off); }
    if (best.alt) { m.backup = true; altLeft--; }
    out.push(m); addWeak(best.sp); lines.add(LINE[best.sp]);
    cands = cands.filter(c => LINE[c.sp] !== LINE[best.sp]); altC = altC.filter(c => LINE[c.sp] !== LINE[best.sp]);
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
  for (const m of picks) if (m.backup && (mixed || onSpec(t, m.sp))) delete m.backup; // (0.38.0)
  for (const m of t.team) if (!keep.has(m)) dropMon(t, m, `left out on becoming ${label}`);
  t.team = picks.map(m => (m.met ? m : stamp(m, 'assigned')));
  planInstall(t); // (0.39.0) the post's team plan
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
  let out = t.team.find(m => { const e = entryOf(m); return e && (e.lock || e.sale || (e.res != null && e.res !== key) || planClaim(e.uid, key)); }), must = !!out, why = 'went back to the ranch';
  // (0.39.0) a Pokémon the post's team plan names is never swapped out here
  if (!out && !isCounter(s)) { out = t.team.find(m => m.offType && !isPlanned(t, m)); if (out) { must = true; why = 'swapped out as the steer changed'; } }
  const resIn = ranchFree(t).find(e => e.res === key && !t.team.some(m => m.rid === e.uid));
  if (!out) { out = t.team.find(m => m.stop); if (out) why = 'a stopgap replaced from the ranch'; }
  // (0.38.0) a backup-type Pokémon goes back as soon as the ranch has one of their own type for its place
  if (!out && own.length) {
    const b = t.team.find(m => m.backup && !isPlanned(t, m));
    if (b) {
      const lns = new Set(t.team.filter(m => m !== b).map(m => LINE[m.sp])), lg = S.lg || 0;
      const ok = ranchFree(t).some(e => { if (t.team.some(m => m.rid === e.uid)) return false; const sp = ranchForm(e, slot.lvl, t.specialty); return !lns.has(LINE[sp]) && !bannedIn(sp, lg) && entryTypes(e, sp).some(x => own.includes(x)); });
      if (ok) { out = b; why = 'a backup-type Pokémon swapped for one of their own type'; }
    }
  }
  const vals = t.team.filter(m => !isSpecial(m) && !(t.mega && t.mega.uid === m.uid) && !isPlanned(t, m)).map(m => { const rest = t.team.filter(x => x !== m); return { m, v: ranchVal(t, m.sp, mg(m), rest, s, threats) }; }).sort((a, b) => a.v - b.v);
  if (!out) { if (!vals.length) return; out = vals[0].m; why = `swapped out for a better Pokémon from the ranch${s !== 'bal' ? ` (${steerName(s)})` : ''}`; }
  const rest = t.team.filter(m => m !== out);
  // (0.38.0) a backup type only takes a place their own type can't fill: a stopgap's, another backup's, or one that must go
  const inn = staffPicks(t, slot.lvl, 1, { lines: rest.map(m => LINE[m.sp]), team: rest, mixed, steer: s, stop: must, noAlt: !(must || out.stop || out.backup), noOff: rest.some(m => m.offType) || !isCounter(s) })[0];
  if (!inn) return;
  const reserved = resIn && inn.rid === resIn.uid, home = out.backup && !inn.backup && !inn.stop;
  if (!must && !out.stop && !reserved && !home &&(LINE[inn.sp] === LINE[out.sp] && mg(inn) <= mg(out) || ranchVal(t, inn.sp, mg(inn), rest, s, threats) < ranchVal(t, out.sp, mg(out), rest, s, threats) + STEER_EDGE)) return;
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
    const L = p.role === 'champion' ? champLv() : p.role === 'e4' ? E4_LV[p.slot] : GYM_LV[GYM_TOP];
    const size = p.role === 'leader' ? LEADER_HOLD : E4_SIZE, mixed = !t.specialty || p.role === 'champion', ty = mixed ? [] : specTypes(t);
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
const tripMax = () => TRIP_MAX + scoutLv() + labTrips(); // (0.64.0) a Research Lab from level 3
// a targeted trip for line b: its cost, length and odds (fixed when it sets out)
function tripPlan(b) {
  const top = lineTop(b), sc = ranchScout() + labScout(), rare = !!(SP[b].rare || SP[b].starter);
  // (0.44.0) through the safari: cheaper and likelier with each level, likelier still for a stocked line, whose finds
  // are no worse than a grade below the best stocked one
  const sl = safariSet().has(b) ? safariLv() : 0, st = sl ? stockFloor(b) : 0;
  const cost = Math.round((1500 + 0.4 * monValue(b, 3)) * (1 - SAFARI_DISC * sl) / 50) * 50;
  const odds = Math.round(clamp(0.6 + (sc - 50) / 100 - (rare ? 0.2 : 0) - Math.max(0, (top - 500) / 500) + SAFARI_ODDS * sl + (st ? SAFARI_STOCK_ODDS : 0), 0.15, 0.95) * 100) / 100;
  return { cost, weeks: clamp(2 + (rare ? 1 : 0) + Math.floor((top - 400) / 100), 2, 6), odds, safari: sl > 0, floor: st ? Math.max(1, st - 1) : 0 };
}
// the bound League sends a trip: kind 'target' (line b) or 'area' (random finds); null, or why not
// (0.27.0) kind 'charter' (b = a region): a shipment of two or three of that region's Pokémon; a targeted trip only for
// a line the League can reach (its region, a migration, a lane, the safari)
function startTrip(kind, b, cond) {
  if (!ranchOn() || !booksOn()) return 'This League has no ranch.';
  if (S.ranch.trips.length >= tripMax()) return `At most ${tripMax()} trips out at once.`;
  let tr;
  if (kind === 'target' && cond) { // (0.36.0) a condition hunt
    if (!SP[b] || !ranchable(b)) return 'That Pokémon can\'t be caught on a trip.';
    if (!COND_MUL[cond]) return 'No such condition.'; if (!featOn(cond)) return `${COND_NAME[cond]} Pokémon are switched off in this world.`;
    if (!huntOk(b, cond)) return `${b} isn't found in ${regionName(S.region)} now${cond === 'delta' ? ', and it isn\'t one of its Delta lines' : ''}.`;
    const p = huntPlan(b, cond); tr = { id: uid(), k: 'target', b, cond, cost: p.cost, odds: p.odds, due: S.turn + p.weeks, at: S.turn };
  } else if (kind === 'outbreak') { // (0.36.0) a trip to a mass outbreak
    const o = obTrip(); if (!o) return 'There is no outbreak to reach.';
    tr = { id: uid(), k: 'outbreak', b: o.b, ob: o.ob.turn, cost: OB_TRIP_COST, due: S.turn + OB_TRIP_WEEKS, at: S.turn };
  } else if (kind === 'target') { if (!SP[b] || !ranchable(b)) return 'That Pokémon can\'t be caught on a trip.'; if (!tripOk(b)) return `${b} isn't found in ${regionName(S.region)} now.`; const p = tripPlan(b); tr = { id: uid(), k: 'target', b, cost: p.cost, odds: p.odds, due: S.turn + p.weeks, at: S.turn, safari: p.safari || undefined, floor: p.floor || undefined }; }
  else if (kind === 'charter') { const r = +b; if (!homeSet(S.region)) return 'Every species is found everywhere (National Dex rules).'; if (!(r >= 0 && r < nRegionsBuilt()) || r === S.region) return 'Choose another region.'; tr = { id: uid(), k: 'charter', r, cost: CHARTER_COST, due: S.turn + CHARTER_WEEKS, at: S.turn }; }
  else tr = { id: uid(), k: 'area', cost: AREA_COST, due: S.turn + 2, at: S.turn };
  if (!canSpend(tr.cost)) return 'Not enough money.';
  book(-tr.cost, 'trips', kind === 'target' ? `Catching trip for ${cond ? COND_NAME[cond].toLowerCase() + ' ' : ''}${b}` : kind === 'outbreak' ? `Trip to the ${tr.b} outbreak` : kind === 'charter' ? `Charter from ${regionName(tr.r)}` : 'Catching trip (area)');
  S.ranch.trips.push(tr);
  return null;
}
function tripsWeek() {
  const R = S.ranch, due = R.trips.filter(x => x.due <= S.turn); if (!due.length) return;
  R.trips = R.trips.filter(x => x.due > S.turn);
  const sc = ranchScout() + labScout(), mine = playerLeague(); // (0.64.0) the Research Lab's Scouting
  for (const tr of due) {
    const here = hereLines(), home = homeSet(S.region), abroad = tr.k === 'charter' ? [...regionLines().sets[tr.r]].filter(b => (!home || !home.has(b)) && homeOnly(b) == null) : null;
    const finds = tr.k === 'target' ? (rand() < tr.odds ? [tr.b] : []) : tr.k === 'charter' ? Array.from({ length: 2 + (rand() < 0.5) }, () => findSpecies(abroad))
      : tr.k === 'outbreak' ? Array.from({ length: 2 + (rand() < 0.5) }, () => tr.b)
      : Array.from({ length: 1 + (rand() < 0.5) + (sc >= 65 && rand() < 0.5) }, () => findSpecies(here));
    const got = [], lost = [], gsc = sc + (tr.safari ? SAFARI_SCOUT * safariLv() : 0);
    // (0.36.0) every find rolls the wild odds for a condition (an outbreak's at outbreak odds); a hunt's find has its own
    const obMul = { alpha: OUTBREAK_ALPHA, delta: OUTBREAK_ALPHA, shiny: OUTBREAK_SHINY, radiant: OUTBREAK_SHINY };
    for (const b of finds) {
      const e = newEntry(b, Math.max(tr.floor || 1, labFloor(), gradeRoll(gsc)), tr.k === 'target' ? (tr.cond ? 'hunt' : 'trip') : tr.k === 'charter' ? 'charter' : tr.k === 'outbreak' ? 'outbreak' : 'area');
      const ks = [...new Set((tr.cond ? [tr.cond] : []).concat(condRoll(b, sc, tr.k === 'outbreak' ? obMul : tr.cond ? 1 : labCond())))];
      if (ks.length) condEntry(e, ks);
      (ranchAdd(e) ? got : lost).push(`${e.c ? condWords(e.c) + ' ' : ''}${b} ${gradeStars(e.g)}`);
    }
    const what = tr.cond ? `${COND_NAME[tr.cond].toLowerCase()} ${tr.b}` : tr.b, oddsW = tr.odds != null ? ` (${Math.round(tr.odds * 100)}% odds)` : '';
    tripLog(tr, what, got, lost); // (0.44.0)
    if (mine && tr.k === 'charter') news(`The charter from ${regionName(tr.r)} came in${got.length ? ` with ${got.join(', ')}` : ' empty'}${lost.length ? `; no room in the ranch for ${lost.join(', ')}` : ''}.`, 'league');
    else if (mine && tr.k === 'outbreak') news(`The trip to the ${tr.b} outbreak came back with ${got.length ? got.join(', ') : 'nothing it could keep'}${lost.length ? `; no room in the ranch for ${lost.join(', ')}` : ''}.`, 'league');
    else if (mine) news(tr.k === 'target' ? (got.length ? `The ${tr.cond ? 'hunt' : 'catching trip'} for ${what} came back with one (${got[0]}).` : lost.length ? `The ${tr.cond ? 'hunt' : 'catching trip'} for ${what} found one, but the ranch was full and it was let go.` : `The ${tr.cond ? 'hunt' : 'catching trip'} for ${what} came back empty-handed${oddsW}.`)
      : `The area catching trip came back${got.length ? ` with ${got.join(', ')}` : ' empty-handed'}${lost.length ? `; no room in the ranch for ${lost.join(', ')}` : ''}.`, 'league');
    else if (got.some(x => /^(Alpha|Delta|Shiny|Radiant)/.test(x))) news(`The ${S.lgName}'s ranch took in ${got.filter(x => /^(Alpha|Delta|Shiny|Radiant)/.test(x)).join(', ')}.`, 'league');
  }
}
// the market's weekly list (this League's): a few Pokémon, each for two to four weeks
function shopWeek() {
  const R = S.ranch;
  R.shop = R.shop.filter(x => x.until > S.turn);
  const pool = marketLines(); // (0.27.0) the region's lines, a migration and the League's lanes
  R.shop = R.shop.filter(x => pool.includes(x.b));
  while (R.shop.length < SHOP_SIZE) {
    const b = findSpecies(pool), g = gradeRoll(45), x = { uid: uid(), b, g, iv: gradeIVs(g), until: S.turn + ri(2, 4) };
    const ks = condRoll(b, 45, SHOP_COND); if (ks.length) condEntry(x, ks); // (0.36.0) now and then a conditioned one, at a premium
    x.price = Math.round(monValue(b, x.g) * condMul(x.c) / 50) * 50;
    R.shop.push(x);
  }
}
function buyShop(id) {
  if (!ranchOn() || !booksOn()) return 'This League has no ranch.';
  const x = S.ranch.shop.find(s => s.uid === id); if (!x) return 'That one has gone.';
  if (ranchRoom() <= 0) return 'The ranch is full.';
  if (!canSpend(x.price)) return 'Not enough money.';
  book(-x.price, 'ranchbuy', `Bought ${x.c ? condWords(x.c) + ' ' : ''}${x.b} ${gradeStars(x.g)} at the market`);
  ranchLog('buy', 'Bought at the market', { cost: x.price, got: [`${x.c ? condWords(x.c) + ' ' : ''}${x.b} ${gradeStars(x.g)}`] }); // (0.44.0)
  S.ranch.shop = S.ranch.shop.filter(s => s !== x);
  const e = { uid: uid(), b: x.b, sp: x.b, g: x.g, iv: x.iv, nat: null, from: 'market', got: S.turn, at: null, res: null, lock: false, of: null, sale: null };
  if (x.c) e.c = x.c;
  ranchAdd(e);
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
  inLeague(k, () => { S.ranch.mons = S.ranch.mons.filter(x => x !== e); if (S.fin) book(Math.round(price * SALE_SHARE), 'ranchsale', `Sold ${e.sp} ${gradeStars(e.g)} to the ${buyer}`); ranchLog('sold', `Sold to the ${buyer}`, { cost: -Math.round(price * SALE_SHARE), got: [entryWords(e)] }); });
  book(-price, 'ranchbuy', `Bought ${e.sp} ${gradeStars(e.g)} from the ${leagueName(k)}`);
  ranchLog('lbuy', `Bought from the ${leagueName(k)}`, { cost: price, got: [entryWords(e)] }); // (0.44.0)
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
  ranchLog(release ? 'rel' : 'sell', release ? 'Released' : 'Sold back', { cost: release ? 0 : -Math.round(entryValue(e) * SELL_BACK), got: [entryWords(e)] }); // (0.44.0)
  return null;
}
// lock away (nobody fields it) or reserve for a post (only that post fields it, first); a holder gives it back at the
// next monthly swap
function lockMon(id, on) { const e = ranchEntry(id); if (!e) return 'Not in the ranch.'; e.lock = !!on; if (on) e.res = null; return null; }
function reserveMon(id, key) { const e = ranchEntry(id); if (!e) return 'Not in the ranch.'; if (key != null && !/^(champion|e4:[0-3]|gym:[0-7])$/.test(key)) return 'No such post.'; e.res = key || null; if (key) e.lock = false; return null; }
const ranchUpkeep = () => ranchOn() ? S.ranch.mons.concat(S.ranch.stock || []).reduce((a, e) => a + RANCH_UPKEEP[e.g - 1], 0) + dcUpkeep() : 0; // (0.44.0) the safari's stock too; (0.45.0) the breeding pool at half
// (0.26.0) a rival's spares it won't keep, cheapest first: everything unfielded (not reserved or locked) except the best
// RANCH_KEEP of those some senior post could field on type at its level
function ranchSpares(aim) {
  const posts = seniorIds().map(T).map(t => ({ t, L: (eliteSlot(t) || {}).lvl, ty: t.role === 'champion' || !t.specialty ? [] : specTypes(t) })).filter(p => p.L);
  const usable = e => posts.some(p => { const sp = ranchForm(e, p.L, p.t.specialty); return !p.ty.length || entryTypes(e, sp).some(x => p.ty.includes(x)); });
  // (0.36.0) a wall-builder or star-maker keeps its conditioned Pokémon; (0.50.0) none a team plan names (the multi-year sim managing yours)
  const idle = S.ranch.mons.filter(e => e.at == null && !e.res && !e.lock && !(e.c && aim !== 'money') && !plannedRefs(e.uid).length).sort((a, b) => entryValue(b) - entryValue(a));
  const keep = new Set(idle.filter(usable).slice(0, RANCH_KEEP[aim]));
  return idle.filter(e => !keep.has(e)).reverse();
}
// once a week in every League with a ranch (from moneyWeek): who holds what, upkeep, trips back, the market, listings
function ranchWeek() {
  if (!ranchOn()) return;
  ranchSync();
  const u = Math.round(ranchUpkeep() * (1 - berryFeedCut())); if (u && booksOn()) book(-u, 'ranch'); // (0.63.0) less what fed Berry Farm plots save
  const lf = laneFee(); if (lf && booksOn()) book(-lf, 'lanes'); // (0.27.0)
  safariWeek(); tripsWeek(); shopWeek(); vaultWeek(); // (0.37.0)
  breedWeek(); // (0.45.0)
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
  aiStockSafari(aim); // (0.44.0) a wall-builder or star-maker stocks its safari with spares that fit its posts first
  for (const e of ranchSpares(aim)) {
    if (S.turn - (e.idle ?? S.turn) >= AI_IDLE[aim]) { e.sale = null; sellMon(e.uid); }
    else if (!e.sale && nLeagues() > 1 && listed < AI_CLEAR) { listMon(e.uid); listed++; }
  }
  aimBreed(aim); // (0.45.0) in the red too: the pool and its pairs carry on
  if (f.money < 0) return;
  const spare = f.money - AIMS[aim].reserve, budget = spare * RANCH_AIM[aim], lg = S.lg || 0;
  const free = () => R.mons.filter(e => e.at == null && !e.res && !e.lock && !e.sale).sort((a, b) => entryValue(a) - entryValue(b));
  if (ranchRoom() <= 2) {
    const ck = buildCheck('seat', 'ranch');
    if (!ck.why && ck.cost <= spare * 0.6 && runningNet() >= ck.cost * UPKEEP) { build('seat', 'ranch', lg); return; }
    const f0 = free().find(e => e.g <= 2); if (f0) sellMon(f0.uid, true);
  }
  if (budget <= 0) return;
  // the neediest post: a stopgap first, then a backup-type Pokémon (0.38.0), else its weakest Pokémon
  const posts = seniorIds().map(T).map(t => { const slot = eliteSlot(t), mixed = t.role === 'champion' || !t.specialty, ty = mixed ? [] : specTypes(t), th = TYPES.filter(a => ty.some(d => effOne(a, d) >= 2));
    const worst = t.team.filter(m => !isSpecial(m)).map(m => { const rest = t.team.filter(x => x !== m); return { m, rest, v: m.stop ? -99 : m.backup ? -50 : ranchVal(t, m.sp, monGrade(m), rest, 'bal', th) }; }).sort((a, b) => a.v - b.v)[0];
    return slot && worst ? { t, slot, ty, th, worst } : null; }).filter(Boolean).sort((a, b) => a.worst.v - b.worst.v);
  const p = posts[0]; if (!p) return;
  const L = p.slot.lvl, lines = new Set(p.worst.rest.map(m => LINE[m.sp]));
  const fits = b => { const sp = formAt(b, L, p.t.specialty); return (!p.ty.length || SP[sp].types.some(x => p.ty.includes(x))) && !lines.has(LINE[b]) && !bannedIn(sp, lg) ? sp : null; };
  const gain = (b, g) => { const sp = fits(b); return sp ? ranchVal(p.t, sp, g, p.worst.rest, 'bal', p.th) - p.worst.v : -99; };
  const opts = R.shop.map(x => ({ shop: x, b: x.b, g: x.g, price: x.price })).concat(listings(lg).map(x => ({ list: x, b: x.e.b, g: x.e.g, price: x.e.sale.price })), safariStock().map(e => ({ stock: e, b: e.b, g: e.g, price: 0 })))
    .filter(o => o.price <= budget).map(o => Object.assign(o, { gain: gain(o.b, o.g) })).filter(o => o.gain > (p.worst.m.stop || p.worst.m.backup ? 0 : STEER_EDGE)).sort((a, b) => b.gain - a.gain);
  if (opts.length && ranchRoom() > 0) { const o = opts[0]; if (o.stock) { if (!unstockMon(o.stock.uid)) SAFARI_LOG.aiTake++; } else if (o.shop) buyShop(o.shop.uid); else buyListing(o.list.lg, o.list.e.uid); return; }
  aimVault(aim, budget); // (0.37.0)
  if (aimHunt(aim, fits, gain, budget)) return; // (0.36.0)
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

// (0.44.0) a rival with a safari stocks it with its most valuable spares whose type fits one of its senior posts (one of
// a line, or a better grade of one already stocked), before it sells any; a money-maker doesn't
function aiStockSafari(aim) {
  if (aim === 'money' || !safariBuilt()) return;
  const types = new Set(seniorIds().map(T).filter(Boolean).flatMap(t => specTypes(t)));
  for (const e of ranchSpares(aim).slice().reverse()) {
    if (safariStock().length >= stockCap()) break;
    if (!entryTypes(e, e.sp).some(x => types.has(x)) || safariStock().some(x => x.b === e.b && x.g >= e.g)) continue;
    if (!stockMon(e.uid)) SAFARI_LOG.aiStock++;
  }
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
// (0.44.0, design doc 6.23) Kept lines: at each change the League keeps up to SAFARI_KEEP lines (by level) it chose.
// Stock: up to SAFARI_STOCK of the League's ranch Pokémon live in the safari (out of the ranch, the same upkeep); their
// lines stay in the safari while they do, trips for them are likelier and no worse than a grade below the best stocked
// one, and once a quarter the safari turns up one young Pokémon of a stocked line on its own (a stand-in for breeding
// until daycares). Safari trips are SAFARI_DISC cheaper and SAFARI_ODDS likelier a level. All numbers are provisional.
const SAFARI_SIZE = [10, 13, 16], SAFARI_WEEKS = 12, SAFARI_SCOUT = 6;
const SAFARI_KEEP = [1, 2, 3], SAFARI_STOCK = [4, 8, 12], SAFARI_DISC = 0.1, SAFARI_ODDS = 0.05, SAFARI_STOCK_ODDS = 0.15, SAFARI_FIND_WEEK = 6;
const SAFARI_LOG = { kept: 0, stocked: 0, unstocked: 0, finds: 0, lost: 0, returned: 0, aiStock: 0, aiTake: 0, aiKeep: 0 };
// the safari's level: 0 while in the red; safariBuilt ignores the red (the stock waits out the red, and goes back to
// the ranch only when the building is gone)
function safariBuilt() { if (!S.gyms || !S.cities) return 0; return Math.max(0, ...S.gyms.map(g => S.cities[g.city] ? upLevel(cityB(S.cities[g.city]), 'safari') : 0)); }
function safariLv() { return lapsed() ? 0 : safariBuilt(); }
const safariStock = () => (S.ranch && S.ranch.stock) || [];
const stockCap = () => { const lv = safariBuilt(); return lv ? SAFARI_STOCK[lv - 1] : 0; };
const keepCap = () => { const lv = safariBuilt(); return lv ? SAFARI_KEEP[lv - 1] : 0; };
const safariKept = () => (S.ranch && S.ranch.keep) || [];
// the best stocked grade of line b (0 if none is stocked)
const stockFloor = b => safariStock().filter(e => e.b === b).reduce((a, e) => Math.max(a, e.g), 0);
const entryWords = e => `${e.c ? condWords(e.c) + ' ' : ''}${e.sp} ${gradeStars(e.g)}`;
function safariWeek() {
  const R = S.ranch; if (!R.stock) R.stock = [];
  safariTrim();
  const lv = safariLv();
  if (lv && S.week % QUARTER_WEEKS === SAFARI_FIND_WEEK) safariFind();
  if (!lv || !homeSet(S.region)) { if (R.safari && !lv) R.safari = null; return; }
  if (R.safari && R.safari.until > S.turn && R.safari.lv === lv) return;
  const home = homeSet(S.region), pool = ranchSpecies().filter(b => !home.has(b) && homeOnly(b) == null);
  if (!playerLeague()) aiSafariKeep();
  R.keep = (R.keep || []).filter(b => pool.includes(b) && !R.stock.some(e => e.b === b)).slice(0, SAFARI_KEEP[lv - 1]);
  const lines = R.keep.slice(); let p = pool.filter(b => !lines.includes(b));
  while (lines.length < SAFARI_SIZE[lv - 1] && p.length) { const b = pick(p); lines.push(b); p = p.filter(x => x !== b); }
  const changed = !R.safari || R.safari.until <= S.turn;
  R.safari = { lines, until: R.safari && R.safari.lv !== lv && R.safari.until > S.turn ? R.safari.until : S.turn + SAFARI_WEEKS, lv };
  if (changed && playerLeague() && S.turn > 0) news(`The Safari Zone has new Pokémon${R.keep.length ? ` (kept: ${R.keep.join(', ')})` : ''}, until ${turnDate(R.safari.until)}.`, 'league');
}
// the safari lost a level or is gone (sold, lost in the red, a gym moved away): stock past its room comes back to the
// ranch (the lowest grades first; let go if the ranch is full) and kept lines past their room are dropped. Called
// weekly and as soon as a safari level is lost (dropLevel, moveGym).
function safariTrim() {
  const R = S.ranch; if (!R) return; if (!R.stock) R.stock = [];
  const cap = stockCap(), built = safariBuilt();
  if (R.stock.length > cap) {
    const back = [], gone = [], out = R.stock.slice().sort((a, b) => a.g - b.g || entryValue(a) - entryValue(b)).slice(0, R.stock.length - cap);
    for (const e of out) { delete e.stocked; e.idle = S.turn; R.stock = R.stock.filter(x => x !== e); (ranchAdd(e) ? back : gone).push(entryWords(e)); SAFARI_LOG.returned++; }
    ranchLog('safari', built ? 'The Safari Zone shrank: some of its stock came back' : 'The Safari Zone closed: its stock came back', { got: back, lost: gone });
    if (playerLeague()) news(`${built ? 'The Safari Zone lost a level' : 'With the Safari Zone gone'}, ${back.length ? `${back.join(', ')} came back to the ranch` : 'its stock had to go'}${gone.length && back.length ? `; there was no room for ${gone.join(', ')}, let go` : gone.length ? ` (no room in the ranch for ${gone.join(', ')}, let go)` : ''}.`, 'league');
  }
  if ((R.keep || []).length > keepCap()) R.keep = R.keep.slice(0, keepCap());
  if (!built && R.safari) R.safari = null;
}
// the safari's catchable lines: its own lines plus the stocked ones (none while in the red)
const safariSet = () => { if (!S.ranch || !safariLv()) return new Set(); return new Set((S.ranch.safari ? S.ranch.safari.lines : []).concat(safariStock().map(e => e.b))); };
// keep line b at the next change (on) or not; the bound League's. Returns an error or null.
function keepLine(b, on) {
  const R = S.ranch; if (!R || !safariBuilt()) return 'You have no Safari Zone.';
  const kept = safariKept();
  if (!on) { R.keep = kept.filter(x => x !== b); return null; }
  if (kept.includes(b)) return null;
  if (!R.safari || !R.safari.lines.includes(b)) return `${b} isn't in the safari now.`;
  if (R.stock.some(e => e.b === b)) return `${b} is stocked, so it stays anyway.`;
  if (kept.length >= keepCap()) return `At this level the safari keeps at most ${keepCap()} line${keepCap() === 1 ? '' : 's'}.`;
  R.keep = kept.concat(b); SAFARI_LOG.kept++;
  return null;
}
// move ranch Pokémon id into the safari's stock (a fielded one is swapped out first). Returns an error or null.
function stockMon(id) {
  ranchSync();
  const R = S.ranch, e = ranchEntry(id); if (!e) return 'Not in the ranch.';
  if (!safariBuilt()) return 'You have no Safari Zone.';
  if (!R.stock) R.stock = [];
  if (R.stock.length >= stockCap()) return `At this level the safari holds at most ${stockCap()} stocked Pokémon.`;
  freeEntry(e);
  e.sale = null; e.res = null; e.lock = false; e.stocked = S.turn;
  R.mons = R.mons.filter(x => x !== e); R.stock.push(e); SAFARI_LOG.stocked++;
  R.keep = safariKept().filter(b => b !== e.b); // a stocked line stays anyway
  ranchLog('stock', 'Stocked in the Safari Zone', { got: [entryWords(e)] });
  return null;
}
// take stocked Pokémon id back into the ranch. Returns an error or null.
function unstockMon(id) {
  const R = S.ranch, e = safariStock().find(x => x.uid === id); if (!e) return 'Not in the safari.';
  if (ranchRoom() <= 0) return 'The ranch is full.';
  R.stock = R.stock.filter(x => x !== e); delete e.stocked; e.idle = S.turn; R.mons.push(e); SAFARI_LOG.unstocked++;
  ranchLog('unstock', 'Taken back from the Safari Zone', { got: [entryWords(e)] });
  return null;
}
// once a quarter: one young Pokémon of a stocked line (lines stocked twice or more likelier), no worse than a grade
// below the best stocked one of its line, with the wild odds for a condition
function safariFind() {
  const st = safariStock(); if (!st.length) return;
  const by = {}; for (const e of st) by[e.b] = (by[e.b] || 0) + 1;
  const ls = Object.keys(by), w = ls.map(b => by[b] >= 2 ? by[b] * 2 : 1);
  let r = rand() * w.reduce((a, x) => a + x, 0), b = ls[ls.length - 1];
  for (let i = 0; i < ls.length; i++) { r -= w[i]; if (r <= 0) { b = ls[i]; break; } }
  const sc = ranchScout(), e = newEntry(b, Math.max(Math.max(1, stockFloor(b) - 1), gradeRoll(sc)), 'safari');
  const ks = condRoll(b, sc, 1); if (ks.length) condEntry(e, ks);
  const ok = ranchAdd(e), wd = entryWords(e);
  if (ok) SAFARI_LOG.finds++; else SAFARI_LOG.lost++;
  ranchLog('safari', 'Turned up in the Safari Zone', ok ? { got: [wd] } : { lost: [wd] });
  if (playerLeague()) news(ok ? `A young ${wd} turned up in the Safari Zone and joined the ranch.` : `A young ${wd} turned up in the Safari Zone, but the ranch was full.`, 'league');
}
// a rival keeps, at each change, the safari lines that fit its posts' types best
function aiSafariKeep() {
  const R = S.ranch, cap = keepCap(); if (!R.safari || !cap) return;
  const types = new Set(seniorIds().map(T).filter(Boolean).flatMap(t => specTypes(t)));
  R.keep = R.safari.lines.filter(b => !R.stock.some(e => e.b === b) && SP[formAt(b, 100)].types.some(x => types.has(x))).sort((a, c) => lineTop(c) - lineTop(a)).slice(0, cap);
  SAFARI_LOG.aiKeep += R.keep.length;
}
// ---------- the ranch log (0.44.0) ----------
// Every trip, hunt, charter and outbreak trip as it comes back, every buy, sale, release, storage pick and safari
// move, newest first, the last RANCH_LOG: { t (turn), k, text, cost (negative: money in), odds, at (set out), got, lost }
const RANCH_LOG = 40;
function ranchLog(k, text, o) {
  const R = S.ranch; if (!R) return;
  if (!R.log) R.log = [];
  R.log.unshift(Object.assign({ t: S.turn || 0, k, text }, o || {}));
  if (R.log.length > RANCH_LOG) R.log.length = RANCH_LOG;
}
function tripLog(tr, what, got, lost) {
  const k = tr.k === 'target' ? (tr.cond ? 'hunt' : 'trip') : tr.k;
  const text = tr.k === 'target' ? `${tr.cond ? 'Hunt' : 'Catching trip'} for ${what}${tr.safari ? ' in the Safari Zone' : ''}` : tr.k === 'charter' ? `Charter from ${regionName(tr.r)}` : tr.k === 'outbreak' ? `Trip to the ${tr.b} outbreak` : 'Area catching trip';
  ranchLog(k, text, { cost: tr.cost, odds: tr.odds, at: tr.at, got, lost });
}

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
// ones first); the rest go into their storage (0.37.0; they were released).
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
  for (const m of gone) farewell(t, m, `put in storage on moving to ${regionName(toR)}`); // farewell stores it (0.37.0)
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
// built-in one) can join it. A region: { name, towns (8 gym cities), extra (6 towns with no gym; 3 before 0.41.0), seat,
// seat2, seat3, seat4 (0.41.0: four Leagues a region), nb (its
// neighbours, by index), ports ({ city name: 'port' | 'railway' }), legends (the legendaries at home there), posts
// (names for its posts, e.g. Alola's Kahuna and Trial Captain), base (the built-in region whose list it uses, or
// null), pool (its own lines, or null) }. Neighbours are two-way: a region listing another is listed back.
const REGION_FMT = 2; // (0.41.0) 2: six towns with no gym, four seats, four League names
function builtinRegion(i) {
  const r = BUILTIN_REGIONS[i], names = r.towns.concat(r.extra || []);
  return { name: r.name, towns: r.towns.slice(), extra: (r.extra || []).slice(), seat: r.seat, seat2: r.seat2, seat3: r.seat3, seat4: r.seat4, nb: BUILTIN_NB[i].slice(),
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
// gym cities), extra (6 towns; 3 before 0.41.0), seat, seat2, seat3, seat4, nb (2 to 3 built-in regions next to it, by name), ports ({ place: 'port' |
// 'railway' }), legends (the legendaries at home there; null: a replacement keeps the replaced region's), posts ({
// leader, gymtrainer }: other names for the posts, or null), pool (its lines, by first stage), added (its own new
// Pokémon, My Pokédex entries; one over DEX_LEGEND_BST can be a legendary encounter, at home there), lock (its new
// Pokémon never leave it), rivals (false: only the player's League may
// start or open there) }. At a new game each one can be added as a new region, replace a built-in region's Pokémon
// (keeping its name, cities, ports and neighbours) or replace the whole region. Every number is provisional (item 44).
const REGION_KEY = 'plb-regions-v1', REGION_CODE = 'PLR1:', REGION_NAME_MAX = 24, POST_NAME_MAX = 20;
const REGION_WARN_LOW = 180, REGION_WARN_HIGH = 330, REGION_NB = [2, 3];
// older region files are brought up to REGION_FMT step by step: REGION_UPGRADES[n] turns format n into n + 1
const REGION_UPGRADES = {
  // (0.41.0) format 1 had three towns with no gym and two seats: the rest take their defaults (regionNorm)
  1: raw => raw,
};
let regionLib = (() => {
  try { const v = JSON.parse(localStorage.getItem(REGION_KEY) || 'null'); if (v && Array.isArray(v.regions)) return { regions: v.regions.map(r => regionNorm(r, { keepId: true, lib: { regions: [] } }).rec).filter(Boolean) }; } catch (e) {}
  return { regions: [] };
})();
function saveRegionLib() { try { localStorage.setItem(REGION_KEY, JSON.stringify(regionLib)); return true; } catch (e) { return false; } }
const builtinRegionName = i => BUILTIN_REGIONS[i].name.replace(' League', '');
const builtinRegionIdx = n => BUILTIN_REGIONS.findIndex((r, i) => builtinRegionName(i).toLowerCase() === String(n).toLowerCase());
const LEGEND_CHOICES = () => Object.keys(BUILTIN_LEGEND_HOME);
const regionId = () => 'r' + Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36);
const placesOf = rec => rec.towns.concat(rec.extra, [rec.seat, rec.seat2, rec.seat3, rec.seat4]);
const EXTRA_N = 6, SEAT_DEFAULTS = ['League Seat', 'Second Seat', 'Third Seat', 'Fourth Seat'];

// ---------- starting a region: blank, a copy of a built-in region, or generated ----------
function regionBlank() {
  return { fmt: REGION_FMT, id: null, name: 'New Region', towns: Array.from({ length: 8 }, (_, i) => `City ${i + 1}`), extra: Array.from({ length: EXTRA_N }, (_, i) => `Town ${i + 1}`),
    seat: SEAT_DEFAULTS[0], seat2: SEAT_DEFAULTS[1], seat3: SEAT_DEFAULTS[2], seat4: SEAT_DEFAULTS[3], nb: [], ports: {}, legends: [], posts: null, themes: [], pool: [], added: [], lock: false, rivals: true };
}
function regionCopy(i) {
  const b = builtinRegion(i), rec = regionBlank();
  return Object.assign(rec, { name: `My ${builtinRegionName(i)}`, towns: b.towns.slice(), extra: b.extra.slice(), seat: b.seat, seat2: b.seat2, seat3: b.seat3, seat4: b.seat4,
    nb: b.nb.map(builtinRegionName), ports: Object.assign({}, b.ports), legends: b.legends.slice(), posts: b.posts ? Object.assign({}, b.posts) : null, themes: (REGION_THEMES[builtinRegionName(i)] || []).slice(),
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
  if (placesOf(rec).concat([nm], Object.values(rec.posts || {}), Object.values(rec.lgNames || {})).some(x => /[<>"`\\]/.test(String(x || '')))) errs.push('Names can\'t contain < > " ` or \\.');
  if (!nm) errs.push('Give the region a name.'); else if (nm.length > REGION_NAME_MAX) errs.push(`Region names can be up to ${REGION_NAME_MAX} characters.`);
  else if (lib.regions.some(r => r.id !== rec.id && r.name.toLowerCase() === nm.toLowerCase())) errs.push(`You already have a region called ${nm}.`);
  const places = placesOf(rec).map(x => String(x || '').trim());
  if (places.some(x => !x)) errs.push('Every city, town and seat needs a name.');
  if (places.some(x => x.length > REGION_NAME_MAX)) errs.push(`Place names can be up to ${REGION_NAME_MAX} characters.`);
  const low = places.map(x => x.toLowerCase()), dup = low.filter((x, i) => x && low.indexOf(x) !== i);
  if (dup.length) errs.push(`Two places share a name (${places[low.indexOf(dup[0])]}).`);
  if (rec.posts && Object.values(rec.posts).some(x => String(x || '').length > POST_NAME_MAX)) errs.push(`Post names can be up to ${POST_NAME_MAX} characters.`);
  const lns = Object.values(rec.lgNames || {}).map(x => String(x || '').trim().toLowerCase()).filter(Boolean);
  if (lns.some(x => x.length > LG_NAME_MAX)) errs.push(`League names can be up to ${LG_NAME_MAX} characters.`);
  if (lns.some((x, i) => lns.indexOf(x) !== i)) errs.push('The seats\' Leagues need different names.');
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
    towns: list(raw.towns, 8, i => `City ${i + 1}`), extra: list(raw.extra, EXTRA_N, i => `Town ${i + 1}`) };
  SEAT_KEYS.forEach((k, j) => { rec[k] = str(raw[k]) || SEAT_DEFAULTS[j]; });
  rec.nb = [...new Set((Array.isArray(raw.nb) ? raw.nb : []).map(n => builtinRegionIdx(n)).filter(i => i >= 0))].map(builtinRegionName);
  const names = new Set(rec.towns.concat(rec.extra));
  rec.ports = Object.fromEntries(Object.entries(raw.ports && typeof raw.ports === 'object' ? raw.ports : {}).filter(([k, v]) => names.has(k) && (v === 'port' || v === 'railway')));
  rec.legends = raw.legends == null ? null : [...new Set((Array.isArray(raw.legends) ? raw.legends : []).filter(x => LEGEND_CHOICES().includes(x)))];
  // (0.31.0) any of the four posts can have a name of the region's own (blank: the usual one)
  const posts = raw.posts && typeof raw.posts === 'object' ? Object.fromEntries(['leader', 'gymtrainer', 'e4', 'champion'].map(k => [k, str(raw.posts[k], POST_NAME_MAX)]).filter(([, v]) => v)) : null;
  rec.posts = posts && Object.keys(posts).length ? posts : null;
  // (0.42.0) the League themes rival Leagues here lean to (none: no lean)
  rec.themes = [...new Set((Array.isArray(raw.themes) ? raw.themes : []).filter(k => THEMES[k] && k !== 'region'))];
  // (0.33.0) the default names of the Leagues at its seats (blank: `<Region> League`, then `<seat> League`; four since 0.41.0)
  const ln = raw.lgNames && typeof raw.lgNames === 'object' ? raw.lgNames : {}, lns = SEAT_KEYS.map((_, j) => str(ln[j], LG_NAME_MAX));
  rec.lgNames = lns.some(Boolean) ? lns : null;
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
  const make = (rec, old, at) => ({ name: rec.name + ' League', towns: rec.towns.slice(), extra: rec.extra.slice(), seat: rec.seat, seat2: rec.seat2, seat3: rec.seat3, seat4: rec.seat4,
    nb: nbOf(rec).length ? nbOf(rec) : old ? old.nb.slice() : null, ports: Object.assign({}, rec.ports),
    legends: (rec.legends ? rec.legends.slice() : old ? old.legends.slice() : []).concat(ownLegs(rec)), claims: rec.legends ? rec.legends.slice() : null,
    posts: rec.posts ? Object.assign({}, rec.posts) : null, themes: (rec.themes || []).slice(), lgNames: rec.lgNames ? rec.lgNames.slice() : null, base: null, pool: rec.pool.slice(), rep: old ? at : null, from: rec.name, lock: !!rec.lock, solo: rec.rivals === false });
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

// ================= CONDITIONS IN THE RANCH (0.36.0, design doc 6.13) =================
// Alphas, shinies, Deltas and Radiants are conditions on a Pokémon, not species. Challengers have always caught them in
// the wild; since 0.36.0 a League's ranch keeps them too, whole (an entry's c holds the condition and what comes with
// it: a Delta's type and ability, a Radiant's ability, the ability slot). A League gets them five ways: lucky finds
// (trips, charters and the market roll the wild odds, Scouting nudging alphas), condition hunts (a targeted trip for a
// line in a set condition, for much more money and lower odds), hires and staff drops (dropMon puts them in like any
// other), outbreak trips (a trip to a mass outbreak at outbreak odds) and other Leagues' sales. Deltas are regional:
// each region has its own Delta lines (deltaSet), some found nowhere else in the region; a Delta of one of them is
// likelier there, and can be hunted there even when the plain line can't be had. A condition multiplies a Pokémon's
// value (COND_MUL); shinies and Radiants fielded by the Elite Four or the Champion draw a crowd (showcase income every
// week, prestige at New Year), alphas and Deltas less. Rivals: wall-builders and star-makers hunt for their posts,
// money-makers sell theirs. All numbers are provisional (item 41).
//   entry.c = { alpha?, shiny?, radiant?, delta? (the type), deltaAb?, radAb?, abSlot? } or absent
const COND_KINDS = ['alpha', 'delta', 'shiny', 'radiant'];
const COND_NAME = { alpha: 'Alpha', delta: 'Delta', shiny: 'Shiny', radiant: 'Radiant' };
const COND_MUL = { alpha: 2, delta: 5, shiny: 8, radiant: 10 };      // value and hunt price, by condition
const HUNT_ODDS = { alpha: 0.7, delta: 0.6, shiny: 0.5, radiant: 0.45 }; // × a plain trip's odds
const HUNT_WEEKS = { alpha: 1, delta: 2, shiny: 2, radiant: 3 };     // on top of a plain trip's
const SHOP_COND = 2;                                                // the market rolls the wild odds × this
const OB_TRIP_COST = 4000, OB_TRIP_WEEKS = 2;                       // a trip to a mass outbreak
const DELTA_POOL = 12, DELTA_HOME = 4, DELTA_AWAY = 0.5, DELTA_HUNT = 1.3; // Delta lines a region; odds there, elsewhere; hunt odds
const SHOW_BIG = 80, SHOW_SMALL = 30, SHOW_CAP = 400;               // showcase income a week (shiny/Radiant, alpha/Delta)
const SHOW_PREST_BIG = 0.5, SHOW_PREST_SMALL = 0.25, SHOW_PREST_MAX = 3;
const AI_HUNT = { wall: 0.25, star: 0.25, money: 0 };               // a rival's monthly odds of a hunt
const COND_FIELDS = ['alpha', 'shiny', 'radiant', 'delta', 'deltaAb', 'radAb', 'abSlot'];
const condKeys = c => c ? COND_KINDS.filter(k => c[k]) : [];
// a Pokémon's condition, for an entry (null: a plain one)
function condOf(m) { if (!m || !(m.alpha || m.shiny || m.radiant || m.delta)) return null; const c = {}; for (const k of COND_FIELDS) if (m[k]) c[k] = m[k]; return c; }
// what a condition multiplies a value by: the rarest one's factor, × 1.25 for each other
const condMul = c => { const ks = condKeys(c); return ks.length ? Math.max(...ks.map(k => COND_MUL[k])) * Math.pow(1.25, ks.length - 1) : 1; };
const condWords = c => condKeys(c).map(k => k === 'delta' ? `Delta ${c.delta}` : COND_NAME[k]).join(' ');
const entryTypes = (e, sp) => e && e.c && e.c.delta ? monTypes({ sp, delta: e.c.delta }) : SP[sp].types;
// can a Pokémon a member of staff drops go into the ranch (0.36.0: conditions can; legendaries, babies and gifts can't)
function ranchKeeps(m) {
  if (!m || m.stop) return false;
  const s = SP[m.sp]; if (!s || s.legend || s.paradox || s.ub || s.baby || babyLine(m.sp)) return false;
  return !(m.met && (m.met.how === 'wormhole' || m.met.how === 'gift' || m.met.how === 'paradox'));
}
// a condition on a new entry: sets its IVs and grade the way the wild does (a shiny perfect, an alpha or Delta 28 to
// 31, a Radiant at least 16), rolls a Delta's type and a Radiant's ability; returns the entry
function condEntry(e, kinds) {
  const c = {}; for (const k of kinds) c[k] = true;
  if (c.shiny && c.radiant) delete c.shiny;
  if (c.delta) c.delta = rollDelta(e.b);
  if (c.shiny) e.iv = ivSet(31); else if (c.alpha || c.delta) e.iv = ivSet(() => ri(28, 31));
  if (c.radiant) { e.iv = Object.fromEntries(STAT_KEYS.map(k => [k, Math.max(e.iv[k] || 0, ri(16, 31))])); const ab = rollRadiantAbility({ sp: e.b, delta: c.delta }); if (ab) c.radAb = ab; }
  c.abSlot = rollAbSlot(Object.assign({ sp: e.b }, c));
  e.c = c; e.g = monGrade({ iv: e.iv });
  return e;
}
// the wild odds for a find of line b at Scouting sc (mul: per condition), by the feature switches; the kinds found
function condRoll(b, sc, mul = {}) {
  const m = k => (typeof mul === 'number' ? mul : mul[k] || 1), out = [];
  if (featOn('alpha') && rand() < (ALPHA_CHANCE + clamp(sc, 0, 100) / 100 * 0.01) * m('alpha')) out.push('alpha');
  if (featOn('shiny') && rand() < SHINY_CHANCE * m('shiny')) out.push('shiny');
  if (featOn('delta') && rand() < DELTA_CHANCE * deltaMul(b) * m('delta')) out.push('delta');
  if (featOn('radiant') && !out.includes('shiny') && rand() < RADIANT_CHANCE * m('radiant')) out.push('radiant');
  return out;
}
// ---------- regional Deltas ----------
// each region's Delta lines: DELTA_POOL lines picked the same way every game (by a hash of the region's name and the
// line), half from the region's own lines and half from anywhere else, so some Deltas turn up where their plain line
// is never found
let DELTA_SETS = null;
const strHash = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
function deltaSet(r = S.region) {
  if (!DELTA_SETS || DELTA_SETS.of !== LEAGUE_SETS || DELTA_SETS.n !== ranchSpecies().length) {
    const all = ranchSpecies(), B = regionLines();
    const sets = LEAGUE_SETS.map((reg, i) => {
      const key = b => strHash(reg.name + '|' + b), home = B.sets[i] || new Set();
      const own = [...home].filter(b => all.includes(b)).sort((a, b) => key(a) - key(b)).slice(0, DELTA_POOL / 2);
      const away = all.filter(b => !home.has(b)).sort((a, b) => key(a) - key(b)).slice(0, DELTA_POOL - own.length);
      return new Set(own.concat(away));
    });
    DELTA_SETS = { sets, of: LEAGUE_SETS, n: all.length };
  }
  return DELTA_SETS.sets[r] || new Set();
}
const deltaMul = b => (b && deltaSet().has(b) ? DELTA_HOME : DELTA_AWAY);
// can the bound League hunt line b in condition k (the line reachable, or a Delta of the region's Delta lines)
const huntOk = (b, k) => !!(COND_MUL[k] && featOn(k) && (tripOk(b) || (k === 'delta' && deltaSet().has(b))));
function huntPlan(b, k) {
  const p = tripPlan(b), pool = k === 'delta' && deltaSet().has(b);
  return { cost: Math.round(p.cost * COND_MUL[k] / 50) * 50, weeks: p.weeks + HUNT_WEEKS[k], odds: Math.round(clamp(p.odds * HUNT_ODDS[k] * (pool ? DELTA_HUNT : 1) * labHunt(), 0.05, 0.9) * 100) / 100 };
}
// ---------- outbreaks ----------
// the bound League's mass outbreak a trip can still reach (this week's or last week's), its line, or null
function obTrip() {
  const ob = S.outbreak; if (!ob || S.turn - ob.turn > 1) return null;
  const b = lineBaseOf(ob.sp); if (!b || !ranchable(b)) return null;
  if (S.ranch && S.ranch.trips.some(x => x.k === 'outbreak' && x.ob === ob.turn)) return null;
  return { ob, b };
}
// ---------- showcase ----------
// conditioned Pokémon on the Elite Four's and the Champion's teams: shinies and Radiants count big, alphas and Deltas small
function showcase() {
  let big = 0, small = 0;
  for (const id of [S.champion, ...S.e4]) { const t = T(id); if (!t) continue; for (const m of t.team) { if (m.shiny || m.radiant) big++; else if (m.alpha || m.delta) small++; } }
  return { big, small, income: Math.min(SHOW_CAP, big * SHOW_BIG + small * SHOW_SMALL), prest: Math.min(SHOW_PREST_MAX, big * SHOW_PREST_BIG + small * SHOW_PREST_SMALL) };
}
// ---------- rival Leagues ----------
// (from aimRanch) a wall-builder or star-maker sometimes hunts an alpha (a Delta when its region has one that fits)
// for its neediest post; a money-maker lists the conditioned Pokémon it isn't fielding
function aimHunt(aim, fits, gain, budget) {
  const R = S.ranch;
  if (aim === 'money') { if (nLeagues() > 1) for (const e of R.mons) if (e.c && e.at == null && !e.res && !e.lock && !e.sale) { listMon(e.uid); break; } return false; }
  if (rand() >= AI_HUNT[aim] || R.trips.length >= tripMax()) return false;
  const ks = ['delta', 'alpha'].filter(k => featOn(k));
  const best = ranchSpecies().filter(b => fits(b)).flatMap(b => ks.filter(k => huntOk(b, k)).map(k => ({ b, k, plan: huntPlan(b, k) })))
    .filter(x => x.plan.cost <= budget && (x.k !== 'delta' || deltaSet().has(x.b))).map(x => Object.assign(x, { v: (gain(x.b, 5) + (x.k === 'delta' ? 0.5 : 0.3)) * x.plan.odds })).filter(x => x.v > 0).sort((a, c) => c.v - a.v)[0];
  if (!best) return false;
  return !startTrip('target', best.b, best.k);
}

// ================= RANCH PART 3 (0.37.0, design doc 6.5 and 6.16): storage, picking at hire, the Sanctuary rework =================
// All numbers provisional (item 43).
// STORAGE: a challenger keeps what they drop (released for a catch, left behind for a new run, over the foreign limit on
// moving region…) in t.store, at most STORE_MAX, newest first: slim copies { uid, sp, top, iv, nat, at, met, conditions }.
// Only what a ranch could take is kept (no legendaries, babies, gifts). Retirement clears it.
// PICKING AT HIRE: a trainer new to the staff who takes a senior post (Gym Leader, Elite Four, Champion) with storage
// lets the League take up to STORE_PICKS + a scouting office level of it into the ranch; the rest stays theirs. In your
// League you pick on the Ranch page within STORE_PICK_WEEKS (t.storePick = { n, until }); rival Leagues pick at once by
// aim. A rich storage asks more pay: up to STORE_PAY_MAX more for senior posts, by its value (STORE_PAY_PER).
const STORE_MAX = 12, STORE_PICKS = 3, STORE_PICK_WEEKS = 8, STORE_PAY_MAX = 0.25, STORE_PAY_PER = 150000;
const STORE_LOG = { stored: 0, picks: 0, aiPicks: 0, offered: 0 };
function storeMon(t, m) {
  if (!t || t.role !== 'challenger' || !m || !ranchKeeps(m)) return;
  const b = LINE_BASE[LINE[m.sp]]; if (!b || !ranchable(b)) return;
  const s = { uid: m.uid, sp: m.sp, iv: Object.assign({}, m.iv || {}), at: S.turn || 0 };
  if (m.top && SP[m.top] && LINE[m.top] === LINE[m.sp]) s.top = m.top;
  if (m.nat) s.nat = m.nat;
  if (m.met && m.met.how) s.met = { how: m.met.how };
  for (const k of COND_FIELDS) if (m[k]) s[k] = m[k];
  t.store = (t.store || []).filter(x => x.uid !== m.uid);
  t.store.unshift(s);
  if (t.store.length > STORE_MAX) t.store.length = STORE_MAX;
  STORE_LOG.stored++;
}
// a stored Pokémon's value, as it would enter the ranch
function storeValue(s) { const b = LINE_BASE[LINE[s.sp]]; return b ? Math.round(monValue(b, monGrade(s)) * condMul(condOf(s)) / 50) * 50 : 0; }
const storeTotal = t => (t.store || []).reduce((a, s) => a + storeValue(s), 0);
const SENIOR_POSTS = ['leader', 'e4', 'champion'];
// what a rich storage adds to a senior post's pay
function storePayMul(t, post) { return SENIOR_POSTS.includes(post) && (t.store || []).length ? 1 + Math.min(STORE_PAY_MAX, storeTotal(t) / STORE_PAY_PER) : 1; }
const storePickN = () => STORE_PICKS + scoutLv();
// a trainer takes a post (openPost): someone new to the staff of a League with a ranch offers their storage
function storeHire(t, role, was) {
  bagHire(t, role, was); // (0.64.0) their tier 2 and 3 items go into the League's item bag
  if (was || t.acting || !SENIOR_POSTS.includes(role) || !ranchOn() || !(t.store || []).length || S.founding) return;
  STORE_LOG.offered++;
  const n = storePickN();
  if (playerLeague()) {
    t.storePick = { n, until: (S.turn || 0) + STORE_PICK_WEEKS };
    news(`${dn(t)} brings ${t.store.length} stored Pokémon. You can take up to ${n} into the ranch from the Ranch page within ${STORE_PICK_WEEKS} weeks.`, 'move', t.id);
    return;
  }
  aiStorePick(t, n, aimOf());
}
// is t's storage open to the bound League's picks?
const storePickOk = t => !!(t && t.storePick && t.storePick.until >= (S.turn || 0) && seniorIds().includes(t.id) && (t.store || []).length && t.storePick.n > 0);
function storeEntry(t, s) { const e = entryOfMon(s, t.id); if (e) e.from = 'storage'; return e; }
// take stored Pokémon uid of trainer id into the bound League's ranch (the player's pick). Returns an error or null.
function pickStore(id, sUid) {
  const t = T(id); if (!storePickOk(t)) return 'Their storage is no longer open to you.';
  const s = t.store.find(x => x.uid === sUid); if (!s) return 'Not in their storage.';
  if (ranchRoom() <= 0) return 'The ranch is full.';
  const e = storeEntry(t, s); if (!e) return "That one can't go in the ranch.";
  ranchAdd(e); t.store = t.store.filter(x => x !== s); t.storePick.n--; STORE_LOG.picks++;
  ranchLog('store', `Taken from ${t.name}'s storage`, { got: [entryWords(e)] }); // (0.44.0)
  if (t.storePick.n <= 0 || !t.store.length) t.storePick = null;
  return null;
}
function doneStore(id) { const t = T(id); if (t) t.storePick = null; }
// rival Leagues pick by aim: a wall-builder what its posts can field, a star-maker the best grades, a money-maker the most valuable
function aiStorePick(t, n, aim) {
  const posts = seniorIds().map(T).filter(Boolean), types = new Set(posts.flatMap(p => specTypes(p))), anyMixed = posts.some(p => p.role === 'champion' || !p.specialty);
  const fit = s => { const e = storeEntry(t, s); return e ? (anyMixed || entryTypes(e, e.sp).some(x => types.has(x))) : false; };
  const score = s => aim === 'star' ? monGrade(s) * 1e7 + storeValue(s) : aim === 'wall' ? storeValue(s) * (fit(s) ? 1 : 0.3) : storeValue(s);
  const pick = (t.store || []).filter(s => storeEntry(t, s)).sort((a, b) => score(b) - score(a)).slice(0, Math.min(n, Math.max(0, ranchRoom())));
  for (const s of pick) { const e = storeEntry(t, s); if (e && ranchAdd(e)) { t.store = t.store.filter(x => x !== s); STORE_LOG.aiPicks++; } }
}

// SANCTUARIES: a legendary site (c.site = { sp, from, sps }) lasts while its legendaries are in the world (no timer). A
// League's Sanctuary there is OPEN while any copy of a site legendary is with the League (held by its staff, by a
// challenger on its circuit, or stored in its vault); otherwise SEALED: no income, upkeep or prestige, levels kept.
// THE VAULT (League field S.vault): legendaries stored in its Sanctuaries, [{ uid, sp, city, m (the Pokémon while stored,
// null while fielded), holder (an Elite Four member or Champion fielding it), of (who gave it), at, left (partner years
// left, paused while stored) }]. Staff agree to store by ambition and record; a challenger asks a fee by its strength (or
// hire them, and ask again). A stored legendary can be given to one Elite Four member or the Champion (one legendary a
// trainer); it belongs to the League and comes back when they leave the post. Staff let go after storing their own take
// it hard (t.storedLg: a certain grudge).
const VAULT_ASK_WEEKS = 24, VAULT_FEE = [50000, 200000], VAULT_STAFF = 0.3, AI_VAULT = 0.25, GRUDGE_AWAY_LEG = 0.75;
const VAULT_LOG = { asked: 0, stored: 0, refused: 0, given: 0, back: 0, movedOn: 0, aiStored: 0 };
const vaultOfLg = k => (k === (S.lg || 0) ? S.vault : S.leagues && S.leagues[k] ? S.leagues[k].vault : null);
const myVault = () => S.vault || (S.vault = []);
// every vault entry in the world, with its League (no binding)
function allVault() { const out = []; for (let k = 0; k < nLeagues(); k++) for (const e of vaultOfLg(k) || []) out.push({ lg: k, e }); return out; }
const siteLines = c => c && c.site ? (c.site.sps || [c.site.sp]).map(lineOf) : [];
// the legendary lines with the bound League: its staff's, its circuit's and its vault's
function legendsWithLeague() {
  const out = new Set();
  for (const id of staffIds().concat(S.challengers || [])) { const t = id != null && T(id); if (t) for (const m of t.team) if (isLegendLine(m.sp)) out.add(lineOf(m.sp)); }
  for (const e of S.vault || []) out.add(lineOf(e.sp));
  return out;
}
function sanctOpen(c, have) { const ls = siteLines(c); if (!ls.length) return false; have = have || legendsWithLeague(); return ls.some(l => have.has(l)); }
// the bound League's Sanctuaries: [{ where (gym index), c, lv, open }]
function sanctuaries() { const have = legendsWithLeague(); return S.gyms.map((g, i) => { const c = S.cities[g.city], lv = c ? upLevel(cityB(c), 'sanct') : 0; return lv ? { where: i, c, lv, open: sanctOpen(c, have) } : null; }).filter(Boolean); }
// sealed Sanctuary levels cost no upkeep
function sealedCost() { return sanctuaries().filter(s => !s.open).reduce((a, s) => a + builtCost({ k: 'sanct', lv: s.lv }), 0); }
// legendaries the bound League could ask to store: held by its staff or circuit challengers, matching one of its Sanctuaries
function vaultCands() {
  const sc = sanctuaries(), out = [];
  if (!sc.length) return out;
  for (const id of staffIds().concat(S.challengers || [])) {
    const t = id != null && T(id); if (!t || t.team.length < 2) continue;
    for (const m of t.team) { if (!isLegendLine(m.sp) || m.vaulted) continue; const s = sc.find(x => siteLines(x.c).includes(lineOf(m.sp))); if (s) out.push({ t, m, s, staff: STAFF_ROLES.includes(t.role) }); }
  }
  return out;
}
// what a holder wants: staff agree by odds (ambition, record); a challenger names a fee by the legendary's strength
function vaultOdds(t) { let p = VAULT_STAFF; const k = t.wish && t.wish.k; if (k === 'stay') p += 0.2; if (k === 'run') p -= 0.15; if (k === 'up') p += 0.1; if (poorRecord(t)) p += 0.15; if (t.grudge) p -= 0.15; return clamp(p, 0.05, 0.8); }
function vaultFee(m) { const b = clamp((SP[m.sp].bst - 580) / 140, 0, 1); return Math.round((VAULT_FEE[0] + b * (VAULT_FEE[1] - VAULT_FEE[0])) / 1000) * 1000; }
const vaultBlocked = t => t.vaultNo != null && t.vaultNo > (S.turn || 0);
// ask trainer id to store legendary uid in the bound League's Sanctuary. Returns { ok, why }.
function storeLegend(id, mUid, ai) {
  const c = vaultCands().find(x => x.t.id === id && x.m.uid === mUid); if (!c) return { why: "That legendary can't be stored with you now." };
  const { t, m, s } = c;
  if (vaultBlocked(t)) return { why: `${t.name} turned you down lately.` };
  VAULT_LOG.asked++;
  if (c.staff) {
    if (rand() >= vaultOdds(t)) { t.vaultNo = (S.turn || 0) + VAULT_ASK_WEEKS; VAULT_LOG.refused++; if (playerLeague()) news(`${dn(t)} won't part with ${m.sp}.`, 'move', t.id); return { why: `${t.name} won't part with ${m.sp}. Ask again in ${VAULT_ASK_WEEKS / 4} months.` }; }
  } else {
    const fee = vaultFee(m); if (!canSpend(fee)) return { why: `${t.name} asks ${money(fee)}.` };
    book(-fee, 'sanctuary', `${t.name} stored ${m.sp} in the Sanctuary at ${s.c.name}`);
  }
  // the clock stops: the years left go with it
  const left = m.leg ? Math.max(1, m.leg.until - (S.season || 1) + 1) : LEGEND_TENURE[0];
  const p = (m.partners || []).find(x => x.id === t.id && x.to == null);
  if (p) { p.to = S.season || 1; p.why = 'stored in a Sanctuary'; }
  if (t.mega && t.mega.uid === m.uid) t.mega = null;
  if (m.item) { bagAdd(t, m.item); m.item = null; }
  m.leg = null; m.cap = null; m.gift = null; delete m.bond; m.vaulted = true;
  t.team = t.team.filter(x => x !== m);
  t.storedLg = S.lg || 0;
  myVault().push({ uid: m.uid, sp: m.sp, city: s.c.id, m, holder: null, of: t.id, at: S.turn || 0, left });
  VAULT_LOG.stored++; if (ai) VAULT_LOG.aiStored++;
  if (STAFF_ROLES.includes(t.role)) backfillElite(t, m);
  news(`${dn(t)} stored ${m.sp} in the ${S.lgName}'s Sanctuary at ${s.c.name}.`, 'title', t.id);
  return { ok: true };
}
// who can field a stored legendary: a non-acting Elite Four member or the Champion with no legendary
function vaultTakers() { return [S.champion, ...S.e4].map(id => id != null && T(id)).filter(t => t && !t.acting && ['e4', 'champion'].includes(t.role) && !legendFull(t)); }
function vaultGive(vUid, id) {
  const e = myVault().find(x => x.uid === vUid); if (!e || !e.m) return "It isn't in the vault.";
  const t = T(id); if (!t || !vaultTakers().includes(t)) return 'Only an Elite Four member or the Champion without a legendary can field it.';
  const slot = eliteSlot(t), m = e.m;
  if (slot && t.team.length >= slot.size) {
    const out = t.team.filter(x => !isSpecial(x) && !(t.mega && t.mega.uid === x.uid)).sort((a, b) => monPower(a) - monPower(b))[0] || t.team.filter(x => !isLegendLine(x.sp)).slice(-1)[0];
    if (!out) return 'Their team has no room.';
    dropMon(t, out, `made room for ${m.sp} from the Sanctuary`); t.team = t.team.filter(x => x !== out);
  }
  m.leg = { until: (S.season || 1) + e.left - 1, n: e.left };
  (m.partners = m.partners || []).push({ id: t.id, name: dn(t), from: S.season || 1, to: null, at: statSnap(m) });
  stamp(m, 'assigned'); t.team.push(m); relevelElite(t); refreshMoves(m);
  e.m = null; e.holder = t.id; VAULT_LOG.given++;
  news(`${dn(t)} now fields ${m.sp} from the ${S.lgName}'s Sanctuary. It belongs to the League and returns when they leave the post.`, 'title', t.id);
  return null;
}
// a vault legendary leaves a team (dropped, their post rebuilt, their trainer retired): back in its vault, the clock
// paused again. Returns true if it was one. Called by farewell; one whose partner years ran out moves on as usual.
function vaultReturn(t, m, why) {
  if (!m || !m.vaulted) return false;
  if (/^moved on after/.test(why || '')) { // its partner years ran out: it leaves the vault and moves on as usual
    m.vaulted = false; VAULT_LOG.movedOn++;
    for (let k = 0; k < nLeagues(); k++) { const V = vaultOfLg(k); const i = V ? V.findIndex(x => x.uid === m.uid && x.m == null) : -1; if (i >= 0) V.splice(i, 1); }
    return false;
  }
  for (let k = 0; k < nLeagues(); k++) {
    const e = (vaultOfLg(k) || []).find(x => x.uid === m.uid && x.m == null); if (!e) continue;
    const p = (m.partners || []).find(x => x.id === (t && t.id) && x.to == null); if (p) { p.to = S.season || 1; p.why = 'returned to the Sanctuary'; }
    e.left = m.leg ? Math.max(1, m.leg.until - (S.season || 1) + 1) : e.left;
    if (t && t.mega && t.mega.uid === m.uid) t.mega = null;
    if (m.item && t) { bagAdd(t, m.item); m.item = null; }
    m.leg = null; delete m.bond; e.m = m; e.holder = null; VAULT_LOG.back++;
    return true;
  }
  m.vaulted = false; return false;
}
// weekly in every League (ranchWeek): a holder who left the post gives it back; one that moved on leaves the vault;
// storage picks that ran out close
function vaultWeek() {
  const V = S.vault || [], takers = new Set([S.champion, ...S.e4].filter(id => id != null));
  for (const e of V.slice()) {
    if (e.m) continue;
    const h = T(e.holder), m = h && h.team.find(x => x.uid === e.uid);
    if (!m) { S.vault = S.vault.filter(x => x !== e); continue; } // moved on (or gone)
    if (takers.has(h.id) && ['e4', 'champion'].includes(h.role) && !h.acting) continue;
    if (h.team.length <= 1) { m.vaulted = false; S.vault = S.vault.filter(x => x !== e); continue; }
    h.team = h.team.filter(x => x !== m); vaultReturn(h, m, 'left the post');
    if (inLeague(lgOf(h), () => STAFF_ROLES.includes(h.role))) inLeague(lgOf(h), () => backfillElite(h, m));
    if (playerLeague()) news(`${m.sp} went back to the ${S.lgName}'s Sanctuary when ${h.name} left the post.`, 'title', h.id);
  }
  for (const id of seniorIds()) { const t = T(id); if (t && t.storePick && t.storePick.until < (S.turn || 0)) t.storePick = null; }
}
// a League folds: what its vault holds waits for new partners; what its staff field becomes theirs
function vaultFold() {
  for (const e of S.vault || []) { if (e.m) { e.m.vaulted = false; if (!legendPool().includes(e.m)) legendPool().push(e.m); } else { const h = T(e.holder), m = h && h.team.find(x => x.uid === e.uid); if (m) m.vaulted = false; } }
  S.vault = [];
}
// rival Leagues (aimRanch, monthly): now and then ask a holder to store a site legendary (a fee within their ranch
// budget); wall-builders and star-makers then give it to their strongest Elite Four member or Champion without one
function aimVault(aim, budget) {
  if (rand() < AI_VAULT) {
    const c = vaultCands().filter(x => !vaultBlocked(x.t) && (x.staff || vaultFee(x.m) <= budget)).sort((a, b) => SP[b.m.sp].bst - SP[a.m.sp].bst)[0];
    if (c) storeLegend(c.t.id, c.m.uid, true);
  }
  if (aim === 'money') return;
  const e = myVault().find(x => x.m); if (!e) return;
  const t = vaultTakers().sort((a, b) => (b.role === 'champion') - (a.role === 'champion') || ovr(b) - ovr(a))[0];
  if (t) vaultGive(e.uid, t.id);
}

// ================= TEAM PLANS (0.39.0, design doc 6.18) =================
// The player's direct say over their senior staff's teams. A plan belongs to a post (like a steer): up to PLAN_MAX
// named Pokémon from the ranch or the holder's own team, in order; empty places are filled by the steer as before.
// Plans take effect at the quarterly Team Review (weeks 0, 12, 24 and 36), when the game also suggests a team for each
// post; a plan set in the review's week, or for a post whose holder is new since the last review (or vacant), takes
// effect at once. Planned Pokémon are locked: the monthly swap never trades them out. Staff always follow a plan, but
// one whose own Pokémon the plan keeps on the bench for BENCH_QUARTERS reviews running grows restless. Legendaries and
// the Mega Evolution holder keep their places. Rival Leagues don't plan. All numbers are provisional.
const QUARTER_WEEKS = 12, PLAN_MAX = 6, BENCH_QUARTERS = 2, BENCH_PUSH = QUARTER_WEEKS, BENCH_TURN = 0.25;
// the League field S.plans = { posts: { key: { on, next } }, win, at, sugg: { key: [ref] }, seen: { key: id }, off }
// a ref is { r: entry uid } (a ranch Pokémon) or { o: Pokémon uid } (one of the holder's own)
const plansOn = () => !!(S && S.plans && playerLeague());
function plansState() { return S.plans || (S.plans = { posts: {}, win: null, at: null, sugg: {}, seen: {}, off: false }); }
const planKeys = () => ['champion', ...S.e4.map((_, k) => 'e4:' + k), ...S.gyms.map((_, i) => 'gym:' + i)];
// the post's holder, if one who fields from the ranch (not acting)
function planHolder(key) {
  const id = key === 'champion' ? S.champion : key.startsWith('e4:') ? S.e4[+key.slice(3)] : S.gyms[+key.slice(4)] && S.gyms[+key.slice(4)].leader;
  const t = id != null && T(id);
  return t && ranchFor(t) && postKey(t) === key ? t : null;
}
const planOf = key => (plansOn() && S.plans.posts[key] && S.plans.posts[key].on) || null;
const planNext = key => (plansOn() && S.plans.posts[key] && S.plans.posts[key].next) || null;
const planOpen = () => plansOn() && S.plans.win === S.turn;
// entries planned (in force) for a post other than `key`
function planClaim(uid, key) {
  if (!plansOn()) return null;
  for (const [k, p] of Object.entries(S.plans.posts)) if (k !== key && p.on && p.on.some(x => x.r === uid)) return k;
  return null;
}
// is m on t's team one their post's plan names?
function isPlanned(t, m) { const refs = planOf(postKey(t)); return !!refs && refs.some(x => (x.o != null && x.o === m.uid) || (x.r != null && m.rid === x.r)); }
// what a ref is for holder t (at level L): { m } their own, { e, sp } a ranch Pokémon, or { gap: why }
function planResolve(t, ref, key) {
  key = key || (t && postKey(t));
  // (0.40.0) a Pokémon of the same line as one the holder always keeps (a special or the Mega holder) can't be fielded beside it
  const kept = (sp, not) => t && t.team.some(x => x !== not && (isSpecial(x) || (t.mega && t.mega.uid === x.uid)) && LINE[x.sp] === LINE[sp]);
  if (ref.o != null) { const m = t && t.team.find(x => x.uid === ref.o && x.rid == null && !x.stop); return !m ? { gap: 'left with the trainer who owned it' } : kept(m.sp, m) ? { m, gap: 'the same line as a Pokémon they always keep' } : { m }; }
  const e = ranchOn() && ranchEntry(ref.r); if (!e) return { gap: 'no longer in the ranch' };
  if (e.lock) return { e, gap: 'locked' };
  if (e.sale) return { e, gap: 'listed for sale' };
  const c = planClaim(e.uid, key); if (c) return { e, gap: 'planned for another post' };
  if (e.res && e.res !== key) return { e, gap: 'reserved for another post' }; // (0.40.0) the reservation wins: the steer fills the place
  if (!t) return { e };
  const slot = eliteSlot(t), sp = ranchForm(e, slot ? slot.lvl : GYM_LV[GYM_TOP], t.specialty);
  if (bannedIn(sp, S.lg || 0)) return { e, sp, gap: 'banned' };
  const ty = t.role === 'champion' || !t.specialty ? [] : specTypes(t);
  if (ty.length && !entryTypes(e, sp).some(x => ty.includes(x))) return { e, sp, gap: 'not of the post\'s type' };
  if (kept(sp, t.team.find(x => x.rid === e.uid))) return { e, sp, gap: 'the same line as a Pokémon they always keep' };
  return { e, sp };
}
// the plan's places that can't be filled now, for the Ranch and Team plans pages: [{ key, ref, why, sp }]
function planGaps() {
  if (!plansOn()) return [];
  const out = [];
  for (const key of planKeys()) {
    const refs = planOf(key); if (!refs) continue;
    const t = planHolder(key);
    for (const ref of refs) { const x = planResolve(t, ref, key); if (x.gap) out.push({ key, ref, why: x.gap, sp: x.m ? x.m.sp : x.e ? x.e.sp : null }); }
  }
  return out;
}
// one of t's own Pokémon the plan leaves out: into the ranch, marked as benched by them (else let go)
function benchMon(t, m, why) {
  if (m.rid != null || m.stop) return;
  const e = ranchOn() ? entryOfMon(m, t.id) : null;
  if (e && ranchAdd(e)) { e.bench = t.id; return; }
  farewell(t, m, why);
}
// build t's team to their post's plan now: legendaries and the Mega holder first, then the plan in order, then the
// steer fills the rest from their own and the ranch. Returns true if a plan was applied.
function applyPlan(t) {
  if (!ranchFor(t) || promOn(t, 'own', S.lg || 0)) return false; // (0.53.0) promised their own team
  const key = postKey(t), refs = planOf(key); if (!refs) return false;
  ranchSync();
  const slot = eliteSlot(t), size = slot.size, mixed = t.role === 'champion' || !t.specialty, old = t.team.slice();
  const team = old.filter(m => isSpecial(m) || (t.mega && t.mega.uid === m.uid)).slice(0, size), lines = new Set(team.map(m => LINE[m.sp]));
  for (const ref of refs) {
    if (team.length >= size) break;
    const x = planResolve(t, ref, key); if (x.gap) continue;
    let m = x.m;
    if (!m) {
      if (x.e.at != null && x.e.at !== t.id) freeEntry(x.e); // its holder swaps it out at once
      m = old.find(y => y.rid === x.e.uid) || stamp(ranchMon(t, x.e, slot.lvl, x.sp), 'assigned');
    }
    if (team.includes(m) || lines.has(LINE[m.sp])) continue;
    if (m.backup) delete m.backup;
    team.push(m); lines.add(LINE[m.sp]);
  }
  if (team.length < size) {
    const own = old.filter(m => !team.includes(m) && m.rid == null && !m.stop && (mixed || onSpec(t, m.sp)));
    t.team = team; // so the ranch Pokémon they held but the plan didn't name are candidates again
    const picks = staffPicks(t, slot.lvl, size - team.length, { own, team: team.slice(), lines: [...lines], mixed, noOff: true });
    for (const m of picks) team.push(m.met ? m : stamp(m, 'assigned'));
  }
  const keep = new Set(team);
  for (const m of old) if (!keep.has(m)) benchMon(t, m, 'left out by the team plan');
  t.team = team; relevelElite(t); ranchSync();
  return true;
}
// a new holder takes a post: a plan waiting for the review takes effect at once, and the post's plan is built
function planInstall(t) {
  if (!plansOn() || !ranchFor(t)) return;
  const key = postKey(t), p = S.plans.posts[key];
  if (p && p.next) { p.on = p.next.length ? p.next : null; delete p.next; if (!p.on) delete S.plans.posts[key]; }
  S.plans.seen[key] = t.id;
  applyPlan(t);
}
// may a plan set for this post take effect now? (the review's week, a holder new since the review, or no holder)
function planNow(key) { const t = planHolder(key); return planOpen() || !t || (S.plans.seen || {})[key] !== t.id; }
// set (or clear, with an empty list) a post's plan. Returns an error, or { now } (applied at once, or at the review)
function setPlan(key, refs) {
  if (!ranchOn() || !playerLeague()) return 'Only your League plans teams.';
  if (!planKeys().includes(key)) return 'No such post.';
  refs = (refs || []).filter(Boolean);
  if (refs.length > PLAN_MAX) return `A plan names at most ${PLAN_MAX} Pokémon.`;
  const P = plansState(), t = planHolder(key), seenR = new Set(), seenL = new Set();
  if (t && refs.length && promOn(t, 'own', S.lg || 0)) return `You promised ${t.name} their own team until ${turnDate(t.prom.until)}.`; // (0.53.0)
  for (const ref of refs) {
    const id = ref.r != null ? 'r' + ref.r : 'o' + ref.o; if (seenR.has(id)) return 'The same Pokémon is named twice.'; seenR.add(id);
    const e0 = ref.r != null && ranchOn() ? ranchEntry(ref.r) : null, res0 = e0 ? e0.res : null;
    if (e0 && res0 != null && res0 !== key) e0.res = null; // judged as if planning had already overridden a reservation elsewhere
    const x = planResolve(t, ref, key); if (x.gap) { if (e0) e0.res = res0; return `${x.e ? x.e.sp : x.m ? x.m.sp : 'A Pokémon'} can't be planned: ${x.gap}.`; }
    const sp = x.m ? x.m.sp : x.sp || x.e.sp; if (seenL.has(LINE[sp])) { if (e0) e0.res = res0; return `Two of the ${LINE_BASE[LINE[sp]] || sp} line.`; } seenL.add(LINE[sp]);
    for (const [k, p] of Object.entries(P.posts)) if (k !== key && ref.r != null && (p.next || []).some(y => y.r === ref.r)) { if (e0) e0.res = res0; return `${x.e.sp} is in another post's plan for the review.`; }
    if (x.e && x.e.res != null && x.e.res !== key) x.e.res = null; // planning overrides a reservation elsewhere
  }
  const now = planNow(key), p = P.posts[key] = P.posts[key] || {};
  if (now) { p.on = refs.length ? refs : null; delete p.next; if (!p.on) delete P.posts[key]; if (t) { P.seen[key] = t.id; if (p.on) applyPlan(t); } }
  else p.next = refs;
  return { now };
}
// a member of staff whose own Pokémon the plan keeps benched for BENCH_QUARTERS reviews running grows restless:
// promotion's clock moves on a quarter (a notice once it runs out); a stay-put member may start wanting more
function benchDrift(t) {
  if (!t.wish || t.quit || t.stepDown != null || founderChamp(t)) return;
  if (ambClock(t)) {
    t.wish.since -= BENCH_PUSH;
    if (S.turn >= ambDue(t)) announceQuit(t, S.turn + QUIT_NOTICE);
  } else if (t.wish.k === 'stay' && rand() < BENCH_TURN) {
    const k = t.role === 'champion' ? (nLeagues() > 1 ? 'up' : 'step') : 'up';
    t.wish = { k, since: S.turn };
  } else return;
  news(`${dn(t)} is unhappy that the team plan keeps their own Pokémon on the bench.`, 'move', t.id);
}
// the quarterly Team Review in the player's League (start of weeks 0, 12, 24, 36): waiting plans take effect, every
// planned post is built to its plan, benching is counted, a team is suggested for every post, and the sim stops
function planReview() {
  if (!ranchOn() || !playerLeague()) return;
  const P = plansState();
  for (const [key, p] of Object.entries(P.posts)) if (p.next) { p.on = p.next.length ? p.next : null; delete p.next; if (!p.on) delete P.posts[key]; }
  P.sugg = {}; P.seen = {};
  for (const key of planKeys()) {
    const t = planHolder(key); if (!t) continue;
    P.seen[key] = t.id;
    if (planOf(key)) applyPlan(t);
    const benched = planOf(key) ? S.ranch.mons.filter(e => e.bench === t.id && e.at == null).length : 0;
    t.benchQ = benched ? (t.benchQ || 0) + 1 : 0;
    if (t.benchQ >= BENCH_QUARTERS) benchDrift(t);
    P.sugg[key] = planSuggest(t);
  }
  P.win = S.turn + 1; P.at = S.turn; // open for the week the player sees next
  news('The quarterly team review: plans set since the last one take effect, and the Team plans page suggests a team for every post.', 'league');
  if (!P.off) stopFor('review', 'The quarterly team review: set or change your posts\' team plans now and they take effect at once.');
}
// the team the builder would pick for t from scratch (their own and the ranch), as refs (stopgaps left out)
function planSuggest(t) {
  const slot = eliteSlot(t), mixed = t.role === 'champion' || !t.specialty, keep = t.team;
  const own = keep.filter(m => m.rid == null && !m.stop && !isSpecial(m) && (mixed || onSpec(t, m.sp)));
  const fixed = keep.filter(m => isSpecial(m));
  t.team = [];
  let picks;
  try { picks = staffPicks(t, slot.lvl, Math.max(0, slot.size - fixed.length), { own, team: fixed.slice(), lines: fixed.map(m => LINE[m.sp]), mixed, noOff: true, stop: false }); }
  finally { t.team = keep; }
  return picks.map(m => (m.rid != null ? { r: m.rid } : own.includes(m) ? { o: m.uid } : null)).filter(Boolean);
}


// ================= THE REGIONAL FIELD (0.41.0, design doc 6.19 part 2) =================
// Challengers belong to a region, not a League. Each one is still listed on one League's circuit (S.challengers): the
// League they are challenging now, or challenged last. Between runs they draw which of the region's Leagues to take on
// next (regionDraw, from endRun), weighing its prestige (more so for strong challengers), its standing in their
// hometown, hometown loyalty (a League that Held or better their hometown keeps a pull for LOYAL_YEARS), and for weaker
// challengers the beatable walls (runs reaching the Elite Four) and the underdog pull (a quieter League with fewer
// challengers). A new challenger's first draw also looks at Leagues from other regions with renown in their hometown.
// The field aims at FIELD_PER challengers a League in the region, growing by up to FIELD_GROW as the region's cities
// grow; newcomers stop coming while a region is past FIELD_FULL of it, and weak challengers give up sooner in a crowded
// field. Hiring reads the region's field: a League's own circuit plus the region's other challengers resting between
// runs. All numbers provisional (item 51).
const FIELD_PER = 30, FIELD_GROW = 0.5, FIELD_FULL = 1.1, FIELD_THIN = 0.8, FIELD_CROWD = 3, FIELD_CROWD_MAX = 4;
const DRAW_PREST = 1, DRAW_STAR = 1.5, DRAW_HOME = 1.5, DRAW_LOYAL = 1.5, LOYAL_YEARS = 3, DRAW_EASE = 1, DRAW_UNDER = 0.8, DRAW_RENOWN = 0.6, DRAW_OVR = 66;
const FIELD_LOG = { draws: 0, moved: 0, loyal: 0, renown: 0, skipped: 0, extra: 0, crowdQuit: 0 };
const lgObj = i => (i === (S.lg || 0) ? S : S.leagues[i]);
const lgRegion = i => { const L = i != null && i >= 0 && i < nLeagues() ? lgObj(i) : null; return L ? L.region : null; };
// the Leagues in region r a challenger can take on (your League while it is being founded has no gyms yet)
function regionLgs(r) {
  const out = [];
  for (let i = 0; i < nLeagues(); i++) if (lgRegion(i) === r && !(S.founding && i === ME())) out.push(i);
  return out;
}
const fieldIds = r => regionLgs(r).flatMap(i => lgObj(i).challengers || []);
const fieldSize = r => fieldIds(r).length;
// the field a region aims at: FIELD_PER a League, up to FIELD_GROW more as its cities fill their slots
function fieldTarget(r) {
  const n = regionLgs(r).length; if (!n) return 0;
  const cs = Object.values(S.cities || {}).filter(c => c.region === r);
  const grown = cs.reduce((a, c) => a + Math.min(2, citySize(c)), 0), room = cs.length * 2; // (0.63.0) by city size
  return Math.round(FIELD_PER * n * (1 + FIELD_GROW * (room ? Math.min(1, grown / room) : 0)));
}
// how full region r's field is for its aim (cached for the week: it is read on every run's end)
let crowdCache = { turn: -1, of: null, by: {} };
function fieldCrowd(r) {
  if (crowdCache.turn !== S.turn || crowdCache.of !== S) crowdCache = { turn: S.turn, of: S, by: {} };
  if (crowdCache.by[r] == null) { const tg = fieldTarget(r); crowdCache.by[r] = tg ? fieldSize(r) / tg : 1; }
  return crowdCache.by[r];
}
// how much likelier a weak challenger is to give up in a crowded field (less in a thin one)
const crowdMul = r => clamp(1 + FIELD_CROWD * (fieldCrowd(r) - 1), 0.5, FIELD_CROWD_MAX);
// hometown loyalty: a League that Holds (or better) a challenger's hometown keeps a pull on them for LOYAL_YEARS
function noteLoyal(t) {
  const hc = homeCity(t), c = hc != null ? S.cities[hc] : null;
  if (c && c.ctrl != null && c.tier >= 2 && lgRegion(c.ctrl) === c.region) {
    if (!t.loyal || t.loyal.lg !== c.ctrl) FIELD_LOG.loyal++;
    t.loyal = { lg: c.ctrl, until: S.season + LOYAL_YEARS };
  } else if (t.loyal && S.season > t.loyal.until) t.loyal = null;
}
// the draw: [{ i, w }] for each League challenger t could take on next in region r (with `renown`, also Leagues from
// other regions with renown in their hometown)
function drawWeights(t, r, opts = {}) {
  const lgs = regionLgs(r); if (!lgs.length) return [];
  const strong = ovr(t) >= DRAW_OVR, hc = homeCity(t), c = hc != null ? S.cities[hc] : null;
  const there = c ? gymMap()[c.id] || [] : [], tot = there.reduce((a, i) => a + Math.max(0, standing(c, i)), 0);
  const ease = leagueEase(), sizes = lgs.map(i => (lgObj(i).challengers || []).length);
  const avgN = sizes.reduce((a, b) => a + b, 0) / lgs.length, eAvg = lgs.reduce((a, i) => a + (ease[i] || 0), 0) / lgs.length;
  const out = lgs.map((i, k) => {
    let w = 1 + DRAW_PREST * (strong ? DRAW_STAR : 1) * Math.max(0, prestOf(i)) / 100 + DRAW_SEAT * seatOpen(i); // (0.43.0) a seat a challenger could win
    if (c && tot > 0 && there.includes(i)) w += DRAW_HOME * Math.max(0, standing(c, i)) / tot;
    if (t.loyal && t.loyal.lg === i && S.season <= t.loyal.until) w += DRAW_LOYAL;
    w += centerDraw(i, hc); // (0.63.0) its Pokémon Centers
    if (!strong) {
      if (eAvg > 0) w += DRAW_EASE * clamp((ease[i] || 0) / eAvg - 1, -0.8, 0.8);
      if (lgs.length > 1) w += DRAW_UNDER * clamp(avgN / Math.max(1, sizes[k]) - 1, -0.6, 0.6);
    }
    return { i, w: Math.max(0.1, w) };
  });
  if (opts.renown && c) for (let j = 0; j < nLeagues(); j++) if (!lgs.includes(j) && renown(c, j) > 0 && !(S.founding && j === ME())) out.push({ i: j, w: DRAW_RENOWN * Math.min(1, renown(c, j) / 10), away: true });
  return out;
}
function drawLeague(t, r, opts) {
  const ws = drawWeights(t, r, opts); if (!ws.length) return null;
  let x = rand() * ws.reduce((a, b) => a + b.w, 0);
  for (const o of ws) { x -= o.w; if (x <= 0) { if (o.away) FIELD_LOG.renown++; return o.i; } }
  return ws[ws.length - 1].i;
}
// between runs (from endRun): which of the region's Leagues a challenger takes on next. Moves them onto its circuit
// without the news and move record a change of region gets. True if they moved.
function regionDraw(t) {
  if (t.role !== 'challenger' || t.spon || t.hired || t.hireDue) return false;
  noteLoyal(t);
  const from = homeLeague(t), r = lgRegion(from);
  if (r == null || regionLgs(r).length < 2) return false;
  FIELD_LOG.draws++;
  const to = drawLeague(t, r);
  if (to == null || to === from) return false;
  inLeague(from, () => { S.challengers = S.challengers.filter(x => x !== t.id); });
  t.lg = to;
  inLeague(to, () => { if (!S.challengers.includes(t.id)) S.challengers.push(t.id); });
  FIELD_LOG.moved++;
  return true;
}
// the region a trainer joining the circuits goes to: the region of the League they were last with, else their
// hometown's, else the thinnest field
function fieldRegionFor(t) {
  const live = [...new Set(Array.from({ length: nLeagues() }, (_, i) => i).filter(i => !(S.founding && i === ME())).map(lgRegion))];
  if (!live.length) return null;
  const was = lgRegion(t.lg);
  if (live.includes(was)) return was;
  if (t.home && live.includes(t.home.r)) return t.home.r;
  return live.sort((a, b) => fieldCrowd(a) - fieldCrowd(b))[0];
}
// newcomers (from arrivals): each region with Leagues gets one per League, made there (so their hometowns are there),
// none while its field is past FIELD_FULL of its aim and one more while it is under FIELD_THIN. Each takes the draw,
// with renown from other regions counting.
function fieldArrivals() {
  const regions = [...new Set(Array.from({ length: nLeagues() }, (_, i) => i).filter(i => !(S.founding && i === ME())).map(lgRegion))];
  for (const r of regions) {
    const lgs = regionLgs(r), crowd = fieldCrowd(r);
    if (crowd >= FIELD_FULL) { FIELD_LOG.skipped += lgs.length; continue; }
    const n = lgs.length + (crowd < FIELD_THIN ? 1 : 0); if (crowd < FIELD_THIN) FIELD_LOG.extra++;
    for (const id of inLeague(lgs[0], () => makeNewcomers(n))) {
      const t = T(id); if (!t || !['prospect', 'free'].includes(t.role)) continue;
      const to = drawLeague(t, r, { renown: true });
      joinCircuit(t, to == null ? lgs[0] : to);
      if (to != null && lgRegion(to) !== r) regionMove(t, r, lgRegion(to)); // drawn by renown to another region
      t.rest = S.turn + ri(1, 3); t.early = 0;
    }
  }
}
// the bound League's hiring field: its own circuit, and the region's other challengers resting between runs (not
// hired elsewhere, not another League's contender). The report's fixed tiers keep their own circuit only.
function fieldPool() {
  const me = S.lg || 0, out = challengers().filter(Boolean);
  if (fixedStaff()) return out;
  for (const i of regionLgs(S.region)) if (i !== me) for (const id of lgObj(i).challengers || []) {
    const t = T(id); if (t && t.role === 'challenger' && t.rest != null && !t.hired && !t.hireDue && !underContract(t, me)) out.push(t);
  }
  return out;
}

// ---------- rebuild mode for rival Leagues (0.41.0, design doc 6.19 follow-up) ----------
// A rival whose share of its region's field falls under REBUILD_UNDER of an even share (at New Year, with two or more
// Leagues in the region) rebuilds until its share is back to REBUILD_BACK: it spends only in its strongest city (most
// standing among its gym cities), always tries to send a contender, and each New Year replaces its costliest
// non-Champion member of staff with someone cheaper (TRIM_DROP OVR or more below). Then it returns to its aim.
const REBUILD_UNDER = 0.6, REBUILD_BACK = 0.85, TRIM_DROP = 3;
const REBUILD_LOG = { into: 0, out: 0, years: 0, trims: 0 };
const rebuilding = () => !!(S.fin && S.fin.rebuild);
function fieldShare(i = S.lg || 0) {
  const r = lgRegion(i), n = fieldSize(r);
  return n ? (lgObj(i).challengers || []).length / n : 0;
}
function rebuildNewYear() {
  const f = S.fin; if (!f || !f.aim || fixedStaff()) return;
  const n = regionLgs(S.region).length, even = n ? 1 / n : 1, sh = fieldShare();
  if (n < 2) { f.rebuild = null; return; }
  if (!f.rebuild && sh < REBUILD_UNDER * even) {
    f.rebuild = { since: S.season }; REBUILD_LOG.into++;
    const text = `The ${S.lgName} is rebuilding: it draws only ${Math.round(sh * 100)}% of the region's challengers.`;
    news(text, 'league'); noteChange(text);
    maybeRebrand('as it rebuilds'); maybeRedrawSeat('as it rebuilds'); // (0.42.0, 0.43.0)
  } else if (f.rebuild && sh >= REBUILD_BACK * even) {
    f.rebuild = null; REBUILD_LOG.out++;
    const text = `The ${S.lgName} has finished rebuilding and returns to its aim as a ${AIMS[f.aim].name.toLowerCase()}.`;
    news(text, 'league'); noteChange(text);
  }
  if (f.rebuild) { REBUILD_LOG.years++; aimTrim(); }
}
// the gym index of the bound League's strongest city (most standing there)
function strongestGym() {
  let best = null, v = -Infinity;
  S.gyms.forEach((g, i) => { const st = standing(S.cities[g.city]); if (st > v) { v = st; best = i; } });
  return best;
}
// replace the best-paid non-Champion member of staff with a cheaper hire (a money-maker's pick, TRIM_DROP below)
function aimTrim() {
  const ok = t => t && !t.acting && t.stepDown == null && !t.quit && !founderChamp(t);
  const cands = S.e4.map((id, k) => ({ t: T(id), k })).concat(S.gyms.map((g, i) => ({ t: T(g.leader), i })).filter(x => !S.gyms[x.i].acting)).filter(x => ok(x.t)).sort((a, b) => payOf(b.t) - payOf(a.t));
  const w = cands[0]; if (!w) return;
  const post = w.k != null ? 'e4' : 'leader', old = w.t, floor = post === 'e4' ? E4_HIRE_MIN : GYM_HIRE_MIN;
  if (ovr(old) - TRIM_DROP < floor) return;
  const f = S.fin, aim = f.aim; let c;
  f.aim = 'money'; try { c = rivalHire(floor, [old.id], post, 0); } finally { f.aim = aim; }
  if (!c || ovr(c) > ovr(old) - TRIM_DROP || STAFF_ROLES.includes(c.role)) { if (c) c.bidMul = null; return; }
  const was = postName(old);
  if (post === 'e4') S.e4[w.k] = null; else S.gyms[w.i].leader = null;
  closePost(old); severance(old, was); old.letGoAt = S.turn;
  const fate = retireOrReturn(old, `was let go as ${was} while the League rebuilt`);
  if (c.role === 'retired') unretire(c);
  dropFromCircuits(c.id);
  installElite(c, post, post === 'e4' ? w.k : w.i);
  if (post === 'leader') staffGym(w.i);
  REBUILD_LOG.trims++;
  const text = `Rebuilding, the ${S.lgName} let ${old.name} go as ${was} (${fate === 'retired' ? 'retired' : 'back to the circuit'}) and brought in the cheaper ${dn(c)}.`;
  news(text, 'move', c.id); noteChange(text);
}

// ================= BREEDING (0.45.0, design doc 6.15) =================
// The Day Care (a seat building with levels, like the Ranch) breeds from a League's breeding pool. A ranch Pokémon put
// in to breed leaves the ranch and every team for good: it stays in the pool, takes no ranch space and costs half its
// upkeep, for BREED_YEARS, then it is sold automatically (a retiree's price, BREED_SELL of its value). The pool holds
// one parent per line per condition (a shiny and a plain one of a line can both stay); a better-graded one going in
// bumps the old one out, which is sold the same way. Pairs share an egg group (the real ones, EGG_RAW in the data;
// custom species by their egg field, else their type), or one parent is Ditto; Undiscovered lines can't breed. A pair
// lays an egg every few weeks until it is ended; Ditto can be in as many pairs as the Day Care allows, every other
// parent in one. The young one takes the non-Ditto parent's line, else one parent's at random; each IV comes from one
// parent (the better one more often) plus a small bump, so it usually comes out a grade above the parents' average.
// Conditions come at double the wild odds, ×5 for one a parent has (a Delta passes the Delta gene: the young one rolls
// its own unusual type, whichever line it takes); a bred condition brings at least its wild IVs. A young one hatched
// into a full ranch waits HATCH_WAIT weeks at the Day Care, then is let go. The Safari Zone stays reversible and
// passes nothing on (design doc 6.15, Nov 20). In the red the Day Care lapses: eggs pause, the pool's upkeep is still
// due. Rivals breed by aim. All numbers are provisional (item 50).
// Data: the ranch field dc = { pool: [parent], pairs: [{ id, a, b (parent uids), due, at, n }], wait: [{ e, until }] }.
//   parent = a ranch entry (at, res, lock, sale cleared) plus bin (the turn it went in) and until (the turn it leaves).
const DC_PAIRS = [0, 1, 2, 3, 4, 5];              // pairs at once, by Day Care level
const DC_WEEKS = [0, 10, 9, 8, 7, 6];             // weeks an egg, by level
const DC_LUCK = 0.1;                              // condition odds × (1 + DC_LUCK a level above the first)
const BREED_YEARS = 5, BREED_UPKEEP = 0.5, BREED_SELL = 0.5, BREED_WARN = 8, HATCH_WAIT = 8;
const BREED_BETTER = 0.7, BREED_BUMP = [1, 4];    // the better parent's IV this often; then + 1 to 4
const BREED_PUT = 2;                              // the most a rival puts in to breed a month
const BREED_LOG = { put: 0, bumped: 0, pairs: 0, eggs: 0, waited: 0, lost: 0, expired: 0, conds: 0, gradeUp: 0, aiPut: 0, aiPairs: 0 };
const EGG_NAMES = { Mon: 'Monster', W1: 'Water 1', W2: 'Water 2', W3: 'Water 3', Bug: 'Bug', Fly: 'Flying', Fld: 'Field', Fai: 'Fairy', Grs: 'Grass', HL: 'Human-Like', Min: 'Mineral', Amo: 'Amorphous', Drg: 'Dragon', Dit: 'Ditto', Und: 'Undiscovered' };
const EGG_KEYS = Object.keys(EGG_NAMES).filter(k => k !== 'Dit');
// a custom species with no egg group takes one from its main type
const TYPE_EGG = { Normal: 'Fld', Fire: 'Fld', Water: 'W1', Grass: 'Grs', Electric: 'Fld', Ice: 'Fld', Fighting: 'HL', Poison: 'Amo', Ground: 'Fld', Flying: 'Fly', Psychic: 'HL', Bug: 'Bug', Rock: 'Min', Ghost: 'Amo', Dragon: 'Drg', Dark: 'Fld', Steel: 'Min', Fairy: 'Fai' };
const EGG = {}; for (const l of EGG_RAW.split('\n')) { const [n, ...gs] = l.split('|'); EGG[n] = gs.filter(Boolean); }
// a line's egg groups (a regional form shares its species')
function eggOf(b) {
  if (EGG[b]) return EGG[b];
  const bare = String(b).replace(/^(Alolan|Galarian|Hisuian|Paldean|White-Striped) /, '').replace(/ \(.*\)$/, '');
  if (EGG[bare]) return EGG[bare];
  const s = SP[b]; if (s && Array.isArray(s.egg) && s.egg.length) return s.egg;
  return [TYPE_EGG[s ? s.types[0] : 'Normal'] || 'Fld'];
}
const eggWords = b => eggOf(b).map(k => EGG_NAMES[k] || k).join(' / ');
const isDitto = b => eggOf(b).includes('Dit');
const canBreed = b => ranchable(b) && !eggOf(b).includes('Und');
// can these two lines pair?
function eggMatch(a, b) {
  if (!canBreed(a) || !canBreed(b)) return false;
  const da = isDitto(a), db = isDitto(b);
  if (da && db) return false;
  if (da || db) return true;
  const ga = eggOf(a); return eggOf(b).some(k => ga.includes(k));
}
function dcState() { const R = S.ranch; if (!R) return null; return R.dc || (R.dc = { pool: [], pairs: [], wait: [] }); }
const dcBuilt = () => S.ranch ? upLevel(seatB(), 'daycare') : 0;   // the building, in the red too
const dcLv = () => lapsed() ? 0 : dcBuilt();                         // what works (nothing in the red)
const dcPairs = () => DC_PAIRS[clamp(dcBuilt(), 0, DC_PAIRS.length - 1)];
const dcWeeks = () => DC_WEEKS[clamp(Math.max(1, dcBuilt()), 1, DC_WEEKS.length - 1)] - (berryFeeding() ? 1 : 0); // (0.63.0) a week sooner with a fed Berry Farm plot
const dcPool = () => (S.ranch && S.ranch.dc ? S.ranch.dc.pool : []);
const dcKey = e => e.b + '|' + condKeys(e.c).join('+');
const dcUpkeep = () => dcPool().reduce((a, e) => a + Math.round(RANCH_UPKEEP[e.g - 1] * BREED_UPKEEP), 0);
const parentOf = uid => dcPool().find(e => e.uid === uid) || null;
const inPair = uid => !!(S.ranch && S.ranch.dc && S.ranch.dc.pairs.some(p => p.a === uid || p.b === uid));
const betterParent = (a, b) => a.g !== b.g ? a.g > b.g : ivTotal(a) > ivTotal(b);
const retirePrice = e => Math.round(entryValue(e) * BREED_SELL);
// the player's plans that name an entry (an entry in a plan asks first, as a reserved one does)
function plannedRefs(uid) {
  if (!plansOn()) return [];
  const P = plansState(), out = [];
  for (const [k, p] of Object.entries(P.posts || {})) for (const w of ['on', 'next']) if ((p[w] || []).some(x => x && x.r === uid)) out.push(k);
  return out;
}
// what stops ranch Pokémon id going in to breed: an error, { ask } (reserved or planned: the player confirms), or null
function breedCheck(id) {
  const e = ranchEntry(id); if (!e) return 'Not in the ranch.';
  if (!dcBuilt()) return 'Build the Day Care at the seat first.';
  if (!canBreed(e.b)) return `The ${e.b} line can't breed.`;
  if (e.lock) return 'It is locked away. Unlock it first.';
  const old = dcPool().find(x => dcKey(x) === dcKey(e));
  if (old && !betterParent(e, old)) return `The breeding pool already has a ${entryWords(old)} of that line and condition, as good or better.`;
  const pl = plannedRefs(id);
  if (e.res || pl.length) return { ask: `${e.res ? 'It is reserved' : 'It is in a team plan'}; putting it in to breed clears that.`, old };
  return old ? { old } : null;
}
// put ranch Pokémon id in to breed (force: past a reservation or a plan). Returns an error or null.
function breedIn(id, force) {
  ranchSync();
  const ck = breedCheck(id); if (typeof ck === 'string') return ck;
  if (ck && ck.ask && !force) return ck.ask;
  const D = dcState(), e = ranchEntry(id);
  if (ck && ck.old) { retireParent(ck.old, 'bumped'); BREED_LOG.bumped++; }
  for (const k of plannedRefs(id)) { const p = plansState().posts[k]; for (const w of ['on', 'next']) if (p[w]) p[w] = p[w].filter(x => !(x && x.r === id)); }
  freeEntry(e);
  S.ranch.mons = S.ranch.mons.filter(x => x !== e);
  e.at = null; e.res = null; e.lock = false; e.sale = null; delete e.bench; delete e.idle;
  e.bin = S.turn; e.until = S.turn + BREED_YEARS * YEAR_WEEKS;
  D.pool.push(e); BREED_LOG.put++;
  ranchLog('breed', 'Put in to breed at the Day Care', { got: [entryWords(e)] });
  return null;
}
// a parent leaves the pool (expired, bumped by a better one, or the League lost its ranch): sold at a retiree's price
function retireParent(e, why) {
  const D = dcState(); if (!D) return;
  D.pool = D.pool.filter(x => x !== e);
  D.pairs = D.pairs.filter(p => p.a !== e.uid && p.b !== e.uid);
  const price = retirePrice(e);
  if (booksOn()) book(price, 'ranchsale', `Retired ${e.sp} ${gradeStars(e.g)} from breeding`);
  ranchLog('retire', why === 'bumped' ? 'Bumped from the breeding pool by a better one and sold' : 'Retired from the breeding pool and sold', { cost: -price, got: [entryWords(e)] });
  if (why === 'expired') BREED_LOG.expired++;
  if (playerLeague()) news(`${entryWords(e)} ${why === 'bumped' ? 'was bumped from the breeding pool by a better one of its line' : `finished its ${BREED_YEARS} years in the breeding pool`} and was sold for ${money(price)}.`, 'league');
}
// can parents ua and ub start a pair now? an error or null
function pairCheck(ua, ub) {
  const D = dcState(), a = parentOf(ua), b = parentOf(ub);
  if (!a || !b || ua === ub) return 'Pick two Pokémon from the breeding pool.';
  if (!dcBuilt()) return 'Build the Day Care at the seat first.';
  if (D.pairs.length >= dcPairs()) return `At this level the Day Care takes ${dcPairs()} pair${dcPairs() === 1 ? '' : 's'} at once.`;
  if (!eggMatch(a.b, b.b)) return `${a.sp} and ${b.sp} don't share an egg group${isDitto(a.b) && isDitto(b.b) ? ' (two Ditto can\'t breed)' : ''}.`;
  for (const x of [a, b]) if (!isDitto(x.b) && inPair(x.uid)) return `${x.sp} is already in a pair.`;
  if (D.pairs.some(p => (p.a === ua && p.b === ub) || (p.a === ub && p.b === ua))) return 'Those two are already a pair.';
  return null;
}
function startPair(ua, ub) {
  const w = pairCheck(ua, ub); if (w) return w;
  const D = dcState(); D.n = (D.n || 0) + 1;
  D.pairs.push({ id: D.n, a: ua, b: ub, at: S.turn, due: S.turn + dcWeeks(), n: 0 }); BREED_LOG.pairs++;
  return null;
}
function endPair(id) { const D = dcState(); if (!D || !D.pairs.some(p => p.id === id)) return 'No such pair.'; D.pairs = D.pairs.filter(p => p.id !== id); return null; }
// the young one of a pair: its line, inherited and nudged IVs, a nature from the better parent, and conditions
function breedYoung(a, b) {
  const line = isDitto(a.b) ? b.b : isDitto(b.b) ? a.b : pick([a.b, b.b]);
  const best = betterParent(a, b) ? a : b, lv = dcBuilt();
  const iv = {}; for (const k of STAT_KEYS) { const x = (a.iv || {})[k] ?? 15, y = (b.iv || {})[k] ?? 15, hi = Math.max(x, y), lo = Math.min(x, y);
    iv[k] = clamp((rand() < BREED_BETTER ? hi : lo) + ri(BREED_BUMP[0], BREED_BUMP[1]) + (rand() < 0.1 * (lv - 1) ? 1 : 0), 0, 31); }
  const e = newEntry(line, 1, 'bred'); e.iv = iv; e.nat = best.nat || null; e.par = [a.sp, b.sp];
  // conditions: double the wild odds, ×5 for one a parent has (the Delta gene passes to any line); a bit more with each level
  const luck = 1 + DC_LUCK * Math.max(0, lv - 1), mul = {};
  for (const k of COND_KINDS) mul[k] = ((a.c && a.c[k]) || (b.c && b.c[k]) ? 5 : 2) * luck;
  const ks = condRoll(line, ranchScout(), mul);
  if (ks.length) { condEntry(e, ks); for (const k of STAT_KEYS) e.iv[k] = Math.max(e.iv[k], iv[k]); BREED_LOG.conds++; }
  e.g = monGrade({ iv: e.iv });
  if (e.g > Math.round((a.g + b.g) / 2)) BREED_LOG.gradeUp++;
  return e;
}
function hatch(p) {
  const D = dcState(), a = parentOf(p.a), b = parentOf(p.b); if (!a || !b) return;
  const e = breedYoung(a, b), wd = entryWords(e); p.n++; BREED_LOG.eggs++;
  if (ranchAdd(e)) { ranchLog('bred', `Hatched at the Day Care (${a.sp} × ${b.sp})`, { got: [wd] }); if (playerLeague()) news(`An egg hatched at the Day Care: ${wd} joined the ranch.`, 'league'); }
  else { D.wait.push({ e, until: S.turn + HATCH_WAIT }); BREED_LOG.waited++; if (playerLeague()) news(`An egg hatched at the Day Care: ${wd}, but the ranch is full. It waits ${HATCH_WAIT} weeks for room.`, 'league'); }
}
// once a week (from ranchWeek): parents whose years are up are sold, pairs lay eggs, young ones waiting for room join
function breedWeek() {
  const D = dcState(); if (!D) return;
  for (const e of D.pool.slice()) {
    if (e.until <= S.turn) retireParent(e, 'expired');
    else if (playerLeague() && e.until - S.turn === BREED_WARN) news(`${entryWords(e)} leaves the breeding pool in ${BREED_WARN} weeks (it will be sold for about ${money(retirePrice(e))}).`, 'league');
  }
  if (D.pairs.length > dcPairs()) D.pairs = D.pairs.slice(0, dcPairs());
  if (!dcLv()) { for (const p of D.pairs) p.due++; }
  else for (const p of D.pairs.slice()) if (p.due <= S.turn) { hatch(p); p.due = S.turn + dcWeeks(); }
  for (const w of D.wait.slice()) {
    if (ranchAdd(w.e)) { D.wait = D.wait.filter(x => x !== w); ranchLog('bred', 'Joined the ranch from the Day Care', { got: [entryWords(w.e)] }); }
    else if (w.until <= S.turn) { D.wait = D.wait.filter(x => x !== w); BREED_LOG.lost++; ranchLog('bred', 'Let go from the Day Care: the ranch stayed full', { lost: [entryWords(w.e)] }); if (playerLeague()) news(`${entryWords(w.e)} waited at the Day Care, but the ranch stayed full: it was let go.`, 'league'); }
  }
}
// ---------- rivals breed by aim ----------
// Once a month (from aimRanch): a wall-builder breeds lines its posts can field, a star-maker the best grades, a
// money-maker rarities to sell. It puts up to BREED_PUT spares in (a line's first, or a better one) and fills its pairs.
function aimBreed(aim) {
  if (!dcBuilt()) return;
  const D = dcState(), types = new Set(seniorIds().map(T).filter(Boolean).flatMap(t => specTypes(t)));
  const fits = b => !types.size || SP[formAt(b, 100)].types.some(x => types.has(x));
  const want = e => aim === 'money' ? entryValue(e) : aim === 'star' ? e.g * 10 + (e.c ? 15 : 0) : (fits(e.b) ? 30 : 0) + e.g * 5 + (e.c ? 5 : 0);
  let put = 0;
  for (const e of ranchSpares(aim).slice().sort((x, y) => want(y) - want(x))) {
    if (put >= BREED_PUT) break;
    if (aim === 'wall' && !fits(e.b) && !isDitto(e.b)) continue;
    if (aim === 'money' && !e.c && e.g < 4) continue;
    if (aim === 'star' && e.g < 3 && !isDitto(e.b)) continue;
    const ck = breedCheck(e.uid); if (typeof ck === 'string' || (ck && ck.ask)) continue;
    if (!breedIn(e.uid)) { put++; BREED_LOG.aiPut++; }
  }
  while (D.pairs.length < dcPairs()) {
    const P = D.pool, best = { v: -1 };
    for (let i = 0; i < P.length; i++) for (let j = i + 1; j < P.length; j++) {
      if (pairCheck(P[i].uid, P[j].uid)) continue;
      const lines = [P[i], P[j]].filter(x => !isDitto(x.b));
      const v = lines.reduce((a, x) => Math.max(a, want(x)), 0) + (P[i].g + P[j].g);
      if (v > best.v) Object.assign(best, { v, a: P[i].uid, b: P[j].uid });
    }
    if (best.v < 0 || startPair(best.a, best.b)) break;
    BREED_LOG.aiPairs++;
  }
}

if (typeof module !== 'undefined') module.exports = { simAutoAim, autoMonth, AUTO_LOG, SEAT_RULES, RULE_KEYS, seatRule, seatRuleOf, seatRuleKey, seatRuleName, setSeatRule, seatChangeBlock, termPick, termCands, lobbySeat, councilCands, SEAT_LOG, SEAT_EVERY_MIN, SEAT_EVERY_MAX, SEAT_CHANGE_PREST, SEAT_COOLDOWN, seatSched, TERM_ANSWER, COUNCIL_LOBBY, COUNCIL_LOBBY_MAX, meritTable, normSeatRule, seatOpen, THEMES, THEME_KEYS, POST_KEYS, POST_MAX, postWord, postWords, themeOf, setPosts, postSetOf, pickTheme, themeWeights, maybeRebrand, THEME_LOG, normPostSet, themeWords, regionThemes, REGION_THEMES, FIELD_PER, FIELD_FULL, FIELD_LOG, REBUILD_LOG, REBUILD_UNDER, REBUILD_BACK, LOYAL_YEARS, lgRegion, regionLgs, fieldIds, fieldSize, fieldTarget, fieldCrowd, crowdMul, noteLoyal, drawWeights, drawLeague, regionDraw, fieldRegionFor, fieldArrivals, fieldPool, fieldShare, rebuilding, rebuildNewYear, strongestGym, aimTrim, freeSeat, seatOf, SEAT_KEYS, FOUNDER_BARS, growthRegions, growthWeights, growthPace, newRegionsOn, founderRegion, GROWTH_LOG, GROWTH_W, GROWTH_PACES, godRegion, payFor, cityState, cityPrestige, strongholdOf, renown, addRenown, homeCity, homeName, setHome, contenderRenown, TIER_NAMES, TIER_SHARE, RN_CAP, RN_WEIGHT, RN_SLICE, HERO_PTS, QUARTER_WEEKS, PLAN_MAX, BENCH_QUARTERS, plansOn, plansState, planKeys, planHolder, planOf, planNext, planOpen, planClaim, isPlanned, planResolve, planGaps, applyPlan, planInstall, planNow, setPlan, benchDrift, planReview, planSuggest, backupTypes, backupMax, BACKUP_N, STORE_MAX, STORE_PICKS, STORE_LOG, storeMon, storeValue, storeTotal, storePayMul, storePickN, storePickOk, pickStore, doneStore, VAULT_LOG, VAULT_FEE, allVault, legendsWithLeague, sanctOpen, sanctuaries, sealedCost, vaultCands, vaultOdds, vaultFee, storeLegend, vaultTakers, vaultGive, siteLines, LEGEND_TENURE, TYPES, COND_KINDS, COND_MUL, COND_NAME, condKeys, condOf, condMul, condWords, huntOk, huntPlan, obTrip, deltaSet, showcase, entryTypes, ranchKeeps, OB_TRIP_COST, callChallenge, callCands, callBlock, callsUsed, CALL_MAX, CALL_WEEKS, champQuits, champCalledOn, LEADER_HOLD, GT_HOLD, GYM_TOP, triesAt, stageAtGym, pickGym, stageBand, regionLib, saveRegionLib, regionBlank, regionCopy, lineGen, generatePool, poolStats, regionChecks, regionNorm, regionFileText, regionFileName, regionCode, regionRead, regionUniqueName, saveRegion, addImportedRegion, deleteRegion, libRegion, regionDex, regionChoices, withRegionSpecies, worldRegions, regionClashes, homeOnly, seatLgName, uniqueLgName, cleanLgName, renameLeague, canRename, LG_NAME_MAX, rivalOk, REGION_CODE, set dexPreview(v) { dexPreview = v; }, regionLines, builtinLines, applyRegions, startRegions, maxStartLeagues, builtinRegions, REGION_FMT, portKind, get LEAGUE_SETS() { return LEAGUE_SETS; }, get LEGEND_HOME() { return LEGEND_HOME; }, get LEGEND_HOMES() { return LEGEND_HOMES; }, legendCap, legendHomes, legendHeld, greatFree, genRegion, lineTypesTop, resetRegionCaches, nRegionsBuilt, regionName, homeSet, lineBaseOf, linesRegions, migrantSet, migrationOf, migrationWeek, wildOk, regional, BUILTIN_PORTS, isPort, lanesOf, laneSet, setLane, laneFee, LANE_WEEK, LANE_ROUTE, CHARTER_COST, CHARTER_WEEKS, safariLv, safariSet, SAFARI_SIZE, safariBuilt, safariStock, stockCap, keepCap, safariKept, stockFloor, keepLine, safariTrim, stockMon, unstockMon, safariFind, SAFARI_LOG, SAFARI_KEEP, SAFARI_STOCK, SAFARI_DISC, SAFARI_ODDS, SAFARI_STOCK_ODDS, ranchLog, RANCH_LOG, hereLines, marketLines, tripOk, lineSource, FOREIGN_MAX, REGION_LOG, regionMove, steerGaps, get NEIGHBOURS() { return NEIGHBOURS; }, REGION_SIZE, regionalOn, ranchOn, ranchFor, ranchCap, ranchRoom, ranchEntry, ranchSync, ranchFree, ranchPicks, ranchSwap, ranchStock, ranchScout, ranchUpkeep, ranchWeek, ranchLv, ranchSpecies, ranchable, freeEntry, AI_IDLE, ranchSpares, monValue, entryValue, monGrade, gradeStars, lineTop, tripPlan, tripMax, startTrip, buyShop, listings, listMon, unlistMon, buyListing, sellMon, lockMon, reserveMon, stopPosts, seniorIds, aimRanch, RANCH_CAP, RANCH_UPKEEP, SALE_SHARE, SELL_BACK, AREA_COST, SHOP_SIZE, SALE_WEEKS, TRIP_MAX, prestMin, willSign, prestBlock, hungry, foundingCands, foundSignable, PM_FREE, PM_PER, prestQ, grow, growPot, growAges, talent, coachOf, startAge, siteOn, noteSite, sanctIncome, sanctLevels, obeyBadges, obeys, legendElsewhere, paradoxHeld, regionMul, AREA_ZERO, PARADOX_FIND, RESTORE_SHARE, ruinsAt, distressOffers, buyDistress, declineDistress, DISTRESS_OFFER_WEEKS, foldRegions, foldRegion, lapsed, sellBuilding, sellValue, salvage, topLevels, foldLeague, foldNewYear, removeLeague, decayOne, distressSale, prestOf, SELL_SHARE, DISTRESS_SHARE, DECAY_WEEKS, FOLD_YEARS, founderBar, sponStipend, contendersOf, contendersAt, sendCands, sponTargets, sendContender, recallContender, canRenew, renewContender, sponsorWeek, sponsorNewYear, leaveCheck, leaveTakers, leaveLeague, SPON_MAX, SPON_BOUNTY, SPON_E4_BOUNTY, LEAVE_FEE, LEAVE_TAKE, underContract, ME, trainerPrestige, leaguePrestige, prestigeNewYear, regionsWithRoom, nextRegion, REGION_CAP, PRESTIGE_BAR, aimBid, aimUpgrade, runningNet, AIM_BID, AIM_UPGRADE, estateCost, upkeepWeek, builtCost, slotsUsed, upMax, upCost, UPKEEP, ACADEMY_PAY, ACADEMY_LOYAL, academyLv, gymMap, cityCtrl, cityShare, cityIncome, standing, AIMS, AIM_KEYS, aimOf, aimMonth, redWeek, RED_BITE_WEEKS, richMul, playerFin, myBooks, booksOn, payOf, askFor, wageBill, money, canSpend, giveRaise, canRaise, raiseCost, UPGRADES, myPlaces, buildCheck, build, moveGym, homeEdge, placeLv, citySlots, banCands, payBan, paidBans, banProtected, BIDS, START_FUND, ENTRY_FEE, MOVE_FEE, BAN_PAID_MAX, scoutLv, STEERS, STEER_KEYS, setSteer, steerOf, steerAt, postKey, steerMonth, answersOnType, metaTypes, answerChallenge, approveAllChallenges, runChallenge, chalValid, seatChallenges, SEAT_LOGS, CLAIM_ANSWER, claimOn, claimant, claimRefused, CLAIM_PRESTIGE, CHAL_WAIT, CHAL_ANSWER, seatYears, swapRefusal, refusal, ambClock, ambDue, restless, careerBase, promoteForVacancy, staffQuits, poorRecord, QUIT_NOTICE, AMB_WAIT_YEARS, RUN_HOLD, hireForVacancy, hireForGymTrainer, offerPost, withdrawOffer, gymOutsiders, impressed, hireRetirees, acceptsOffer, canOffer, HIRE_NOTICE, rivalHire, POOR_YEARS, REFUSED_WEEKS, releaseStaff, swapStaff, placeGymTrainer, gymTrainerCands, postOf, gymLineKey, gymStageNow, GYM_WATCH, staffRetires, announceStepDown, stepDownChance, postYears, postName, vacancyCands, fillVacancy, autoFillVacancy, fillAllVacancies, prepFounding, foundPool, foundPlace, foundingFill, finishFounding, foundTypesUsed, foundPlaced, playerLeague, handOn, godEdit, walkingPartner, openNewLeague, worldGrowth, godOn, godOpenLeague, nextRegionName, BAN_BALLOT, BAN_CAP, BAN_MAX_NEW, BAN_MAX_SEASONS, banShare, trainerBanVote, trainerBanVotes, banTrainers, banLen, banLeft, expireBans, banMembers, bansIn, banOf, bannedIn, buildBanBallot, enforceBans, startWorld, simYear, simWeeks, YEAR_WEEKS, dateName, weekName, yearOf, bweek, applyDex, dexImport, checkDexEntry, dexNorm, dexBaseStats, get dexLib() { return dexLib; }, set dexLib(v) { dexLib = v; }, BASE_STATS, SPECIES_AB, STARTERS, LINE, EVOLVED, GREAT_LEGENDS, makeMon, ROAMERS, STORMS, settleStorm, stormRank, ABILITIES, abilityOf, rollAbSlot, ITEMS, TYPE_ITEMS, itemScore, autoEquip, eliteItems, gymItemOffer, bagAdd, heldItem, crossroads, reinvent, dryStreak, isGrandSlam, champLeaguesOf, checkGrandSlams, useLeague, inLeague, eachLeague, nLeagues, lgOf, leagueFit, worldChampionship, leagueName, startLegend, legendBattle, legendWeek, legendOffseason, joinLegend, weald, wantsLegend, recordGreat, REWARD_LEGENDS, FEATURES, featOn, legacyChance, scheduleLegacy, makeLegacy, legacyLine, metaMons, counterTypesFor, metaCounters, AWARDS, seasonAwards, seasonScore, circuitLevel, bondBlocked, BOND_ROLES, checkBonds, bondMon, bondName, BOND_ATK, titleOf, titleNameTaken, famName, famBase, chooseFamous, checkCustom, checkPackName, setCustomLib, parsePackText, prepImport, builtinSource, packExportText, uniquePackName, BUILTIN_SOURCES, ensureCustom, useCustom, customSpecies, newCustomKey, get customLib() { return customLib; }, MALE, FEMALE, FAMOUS_PACKS, BASE_FAMOUS, packOn, famousAvailable, MEGA, megaFor, hasMega, megaHolder, assignMegaStone, earnMega, staffGym, staffIds, gymFits, seedRandom, typeLabel, setTeamLevel, challengerLevel, depthName, GYM_LV, GYM_SIZE, GYM_TRAINERS, GYM_TRIES, E4_LV, E4_SIZE, isSpecial, monTypes, makeDelta, DELTA_CHANCE, gymLost, adaptGym, activeOutbreak, maybeOutbreak, homeLeague, isLegendLine, legendBlocked, pooledLegend, claimLegend, legendDepartures, curSeason, eliteSlot, TRAITS, traitOf, h2hOf, isRival, roadBattles, FAMOUS_TAG_LIST, FAMOUS_BY_NAME, ULTRA_BEASTS, BABY_LEGENDS, ownedLegends, freeBabies, PARADOX, DUAL_CLASSES, specTypes, specFit, applyCfg, careerSpan, ageRetireChance, leadStyle, LEAD_STYLES, coverOptions, MOVES, idealMoves, refreshMoves, estimate, battler, natureFx, NATURES, TEMPER, temperOf, temperMul, moveLv, ensureMon, learnedCov, frTier, formTier, trainerRec, blankStat, FAMOUS, LEGENDS, dn, CLASSES, get S() { return S; }, set S(v) { S = v; }, newWorld, simWeek, aiAction, aiCatch, wildOffers, ovr, T, challengers, SP, BASES, battle, fillCircuits, circuitValue, makeNewcomers, settleBanVote, CIRCUIT_SIZE, START_TEAM, banLength, slamRoom, shiftLeague, retire, regionCities, townName, gymCity, SAVE_VERSION };
if (typeof module !== 'undefined') Object.assign(module.exports, { leavingSet, severanceFee, EGG, EGG_NAMES, EGG_KEYS, TYPE_EGG, eggOf, eggWords, isDitto, canBreed, eggMatch, dcState, dcBuilt, dcLv, dcPairs, dcWeeks, dcPool, dcKey, dcUpkeep, parentOf, inPair, betterParent, retirePrice, plannedRefs, breedCheck, breedIn, retireParent, pairCheck, startPair, endPair, breedYoung, breedWeek, aimBreed, BREED_LOG, BREED_YEARS, BREED_UPKEEP, BREED_SELL, HATCH_WAIT, DC_PAIRS, DC_WEEKS });
if (typeof module !== 'undefined') Object.assign(module.exports, { CON_SENIOR, CON_SHORT, CON_WINDOW, CON_ODDS, CON_PAY, CON_MORE, CON_LOG, conOpts, conShort, conWords, conPrefIdx, conPref, conMiss, conHolds, setContract, conWill, renewCon, aiRenew, conEnd, contractWeek, renewContract, conLetRun, conPending, setConAsk });
if (typeof module !== 'undefined') Object.assign(module.exports, { TALK_MAX, TALK_WALK, TALK_COOL, TALK_STAR_OVR, TALK_BIDS, TALK_BONUS, PROM_WEEKS, PROMISES, TALK_LOG, talkList, talkOf, promOn, postVal, isStar, canTalk, talkWeeks, openTalks, starTalks, talkNeed, talkAsk, talkPay, talkBonus, talkInterest, talkRank, talkHeld, talkCount, offerCheck, makeOffer, withdrawTalkOffer, aiTalkPost, closeTalk, talkValid, talksWeek, settleTalk, talkSign, talkFromHire, talkMatch, talkLetGo, talkSight, talkFee, offerWords, aiPoach, TALK_AIM, BID_TEMPERS, BID_TEMPER_KEYS, TALK_AIM_LOG, bidTemper, talkKeen, beatTop, seatOpening, aiRaise, aiRetain, aiTalkMove, champUpTalks, champLeaves, champMakeRoom, isBestOf, founderChamp, conCatchUp, TALK_RES, TALK_RES_GOOD, TALK_RES_BAD, TALK_DONE_KEEP, TALK_DONE_LOG, talkDone, talkMine, talkUnseen, talkGone });
if (typeof module !== 'undefined') Object.assign(module.exports, { citySize, sizeName, sizeAt, slotAt, cityPool, CITY_INCOME_AT, VISIT_SPEND_AT, TICKET_AT, CROWD_AT, ROOM_AT, SIZE_PREST_AT, STADIUM_SEATS, STADIUM_EDGE, SEAT_STADIUM, HOTEL_ROOMS, VISIT_PARTY, BERRY_PLOTS, BERRY_SELL, BERRY_FEED, BERRY_FEED_MAX, seatSize, visitorsWeek, hotelIncome, stadiumSeats, ticketSale, TIX_LOG, centerCut, centerDraw, berryFarms, berryFeedCut, berrySales, setBerryFeed, aiBerry, aimWorth, homeEdge, lgLapsed });
