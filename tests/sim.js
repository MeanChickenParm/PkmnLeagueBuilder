// invariants sim: node tests/sim.js <leagues> <growth 0/1> <years> [god 0/1]
// Sims whole years week by week and checks the world stays consistent after every week.
const g = require(require('path').join(__dirname, '..', 'dist', 'engine-node.js'));
// HAND (0.6.0): League 0 is founded by hand (best available), staff are made to leave, and vacancies wait with acting
// holders until they are filled
const [L, G, N, GOD, HAND] = process.argv.slice(2).map(Number);
g.newWorld({ leagues: L || 1, growth: !!G, god: !!GOD, hand: !!HAND });
// (0.30.0) the world's regions are in the save: nine built-in records, neighbours two-way, every legendary home and port
// kept; and where Leagues start (startRegions): picks honoured within room, your region only by a pick or a full world
{ const S0 = g.S, R = S0.regions, nb = g.NEIGHBOURS, fail = m => { console.log('FAIL ' + m); process.exit(1); };
  if (!Array.isArray(R) || R.length !== 9 || g.LEAGUE_SETS !== R) fail('the world has no region list of its own');
  if (R.some(r => r.towns.length !== 8 || r.extra.length !== 6 || !r.seat || !r.seat2 || !r.seat3 || !r.seat4 || r.base == null)) fail('a malformed region');
  nb.forEach((a, i) => a.forEach(x => { if (!nb[x].includes(i) || x === i) fail('neighbours not two-way ' + i + '-' + x); }));
  if (Object.keys(g.LEGEND_HOME).length < 100 || R.reduce((a, r) => a + r.legends.length, 0) !== Object.keys(g.LEGEND_HOME).length) fail('legendary homes lost');
  if (R.reduce((a, r) => a + Object.keys(r.ports).length, 0) !== 28) fail('ports lost: ' + R.reduce((a, r) => a + Object.keys(r.ports).length, 0));
  if (R[6].posts.leader !== 'Kahuna' || R[0].posts) fail('post names');
  const ord = [...Array(9).keys()], cnt = (a, r) => a.filter(x => x === r).length;
  const full = g.startRegions(ord, 36, []); if (full.length !== 36 || ord.some(r => cnt(full, r) !== 4)) fail('a full world does not fill every seat');
  const most = g.startRegions(ord, 33, []); if (cnt(most, 0) !== 1 || most.length !== 33) fail('a rival took your region unasked');
  const pick = g.startRegions(ord, 4, [0, 5, 5]); if (pick.join() !== '0,0,5,5') fail('rival picks not honoured: ' + pick);
  const over = g.startRegions(ord, 7, [3, 3, 3, 3, 3, 3]); if (cnt(over, 3) !== 4 || over.length !== 7) fail('a pick past a region\'s room: ' + over);
  if (g.maxStartLeagues() !== 36) fail('the most starting Leagues');
  const regs = g.eachLeague(() => S0.region); if (regs.length !== (L || 1) || g.LEAGUE_SETS.some((_, r) => cnt(regs, r) > g.REGION_CAP)) fail('starting Leagues ' + regs);
  const names = g.eachLeague(() => S0.lgName); if (new Set(names).size !== names.length) fail('two Leagues share a name: ' + names); }
if (HAND) { if (!g.S.founding || g.foundPool().length < 60) { console.log('FAIL no founding pool'); process.exit(1); } g.foundPlace('gym', 3, g.foundPool()[0]); g.foundingFill(); if (g.foundPlaced().length !== 13) { console.log('FAIL fill left posts empty'); process.exit(1); }
  // (0.23.0) nobody placed is above a new League's prestige, and a blocked candidate can't be placed
  if (g.foundPlaced().some(id => !g.willSign(g.T(id)))) { console.log('FAIL a founding post went to someone who would not sign'); process.exit(1); }
  const blk = g.foundPool().find(id => !g.willSign(g.T(id))); if (blk != null && g.foundPlace('gym', 0, blk)) { console.log('FAIL placed a blocked candidate'); process.exit(1); }
  g.finishFounding(); }
// (0.23.0) prestige gating: no stars or famous trainers at founding, and the start of every League's senior staff
const PG = { start: [], famous: 0 }, PGH = { blocked: 0 };
g.eachLeague(() => { const ids = [S0().champion, ...S0().e4, ...S0().gyms.map(x => x.leader)]; for (const id of ids) { const t = g.T(id); if (t.famous && !t.founded) PG.famous++; } PG.start.push(Math.round(ids.reduce((a, id) => a + g.ovr(g.T(id)), 0) / ids.length)); });
function S0() { return g.S; }
const S = () => g.S, fail = [];
let renames = 0, postSets = 0, seatSet = 0, seatPicks = 0, seatLobbies = 0, conqForced = 0, conqSeen = 0;
const moves = { let: 0, swap: 0, gt: 0, dated: 0, free: 0 }, offers = { now: 0, later: 0, refused: 0, cool: 0, withdrawn: 0, arrived: 0 };
const amb = { refusedSwap: 0, refusedMove: 0, asked: new Set(), quit: new Set() };
const CTR = { seen: 0, win: 0, yrs: {}, renewed: 0, refused: 0, let: 0, gtGo: 0, asked: 0, askMiss: 0, payUp: 0 }; // (0.52.0) contracts
const money = { built: 0, bans: 0, raises: 0, moved: 0 };
const call = { made: 0, fought: 0, won: 0, off: 0, blocked: 0, champLeft: 0, champStep: 0, champUp: 0, champRun: 0, champWish: {} };
const chal = { n: 0, claims: 0, claimWon: 0, claimNo: 0, claimPost: 0, champ: 0, leader: 0, circuit: 0, won: 0, refused: 0, lapsed: 0 };
const spon = { sent: 0, later: 0, refused: 0, recalled: 0, renewed: 0, left: 0, carried: 0 };
const red = { sold: 0, restored: 0, decayed: 0, folded: 0, myFold: 0, moved: 0, offered: 0, bought: 0, declined: 0, lapsedYears: 0 };
const LEG = { held: 0, px: 0, sites: 0, sanct: 0, sanctBuilt: 0 }; // (0.20.0)
const PART3 = { vaultMax: 0, storeMax: 0, open: 0, sealed: 0, picked: 0, pickRefused: 0, asked: 0, stored: 0, given: 0, giveRefused: 0, payMulMax: 1 }; // (0.37.0)
const MEM = { n: 0 }; // (0.21.0) gym memories seen, summed over checks
const RAN = { trips: 0, area: 0, bought: 0, lbought: 0, sold: 0, released: 0, listed: 0, unlisted: 0, locked: 0, reserved: 0, built: 0, stopMax: 0, soldFielded: 0, aiIdleMax: 0 };
// (0.36.0) conditions in the ranch
const CON = { hunts: 0, huntRefused: 0, obTrips: 0, held: 0, fielded: 0, shop: 0, kinds: {}, showMax: 0 };
const SAF = { kept: 0, stocked: 0, taken: 0, stockMax: 0, logMax: 0, keptMax: 0 }; // (0.44.0)
const BRD = { built: 0, put: 0, refused: 0, pairs: 0, pairRefused: 0, ended: 0, poolMax: 0, pairsMax: 0, waitMax: 0, rivalPool: 0 }; // (0.45.0)
const REG = { waves: 0, far: 0, lanes: 0, routes: 0, safari: 0, charters: 0, safariTrips: 0, refusedTrips: 0, gapsMax: 0, shopForeign: 0 }; // (0.27.0)
const WAVES = new Set();
const anyOrder = { out: 0, outOfOrder: 0, noAim: 0 }; // (0.32.0)
const PLAN = { set: 0, now: 0, later: 0, cleared: 0, refused: 0, sugg: 0, reviews: 0, checked: 0, kept: 0, benched: 0, restless: 0 }; // (0.39.0) team plans
const backupStat = { teams: 0, mons: 0, most: 0, stopgaps: 0 }; // (0.38.0) summed over weekly checks
const OVERDUE = new Map(); // (0.26.0) a rival's spare: the turn it was first seen overdue for selling back // (0.25.0)
let steersSet = 0, hands = 0, gods = 0, fieldSum = 0, fieldN = 0, fieldMax = 0, stops = {};
const ctrlStats = { cities: 0, tiers: [0, 0, 0, 0], renown: 0, slice: 0, homed: 0 }; // (0.40.0)
const fieldStats = { rebuildWeeks: 0, crowdMax: 0, regionMax: 0, minShare: 1, loyal: 0 }; // (0.41.0)
const TALKS = { weeks: 0, most: 0, maxOffers: 0, hand: 0, handErr: 0, refused: 0, cap: 0, red: 0, matched: 0, letGo: 0, bonusOk: 0, withdrawn: 0, fromHire: 0, promised: 0 };
function check(tag) {
  { const all = g.eachLeague(() => S().lgName).concat((S().folded || []).map(f => f.name)).map(n => String(n).toLowerCase()); if (new Set(all).size !== all.length) fail.push('two Leagues (folded included) share a name: ' + all); }
  const s = S(), bad = m => fail.push(tag + ' ' + m);
  // (0.27.0) migration waves: from another region, lines that aren't the region's own, not past their end
  for (const [r, w] of Object.entries(s.migr || {})) { if (!w || w.from === +r || !(w.from >= 0 && w.from < g.nRegionsBuilt()) || !w.lines.length || w.until < s.turn) bad('a bad migration ' + r + ' ' + JSON.stringify(w)); else { for (const b of w.lines) if (g.regionLines().sets[r].has(b)) bad('a migrant ' + b + ' already lives in region ' + r); const key = r + ':' + w.at; if (!WAVES.has(key)) { WAVES.add(key); REG.waves++; if (w.far) REG.far++; } } }
  if (s.cfg && s.cfg.hand) g.inLeague(g.ME(), () => { if (g.S.ranch && !g.S.founding) REG.gapsMax = Math.max(REG.gapsMax, g.steerGaps().length); });
  // (0.17.0) sponsored contenders and the player's League
  if (g.ME() >= g.nLeagues()) bad('the player League index is out of range');
  // (0.18.0) after folding and renumbering, every League reference points at a real League
  { const n = g.nLeagues();
    for (const t of Object.values(s.trainers)) { if (t.lg != null && (t.lg < 0 || t.lg >= n)) bad('a trainer on League ' + t.lg); if (t.academy != null && (t.academy < 0 || t.academy >= n)) bad('an academy tag for League ' + t.academy); }
    for (const c of Object.values(s.cities)) { for (const o of [c.b, c.st]) for (const k of Object.keys(o || {})) if (+k >= n || +k < 0) bad('city ' + c.name + ' holds League ' + k); if (c.ctrl != null && c.ctrl >= n) bad('city ' + c.name + ' controlled by League ' + c.ctrl); }
    if (s.leagues.length !== n) bad('League count mismatch'); }
  { const per = {};
    for (const t of Object.values(s.trainers)) { const x = t.spon; if (!x) continue;
      if (t.role !== 'challenger') bad('a contender holds role ' + t.role);
      if (x.lg === x.to || x.lg >= g.nLeagues() || x.to >= g.nLeagues()) bad('a contract between the wrong Leagues');
      if (!(s.spons || []).includes(t.id)) bad('a contender missing from S.spons');
      if (x.pending === 'send' ? g.lgOf(t) !== x.lg : x.pending !== 'home' && g.lgOf(t) !== x.to) bad('a contender on the wrong circuit (' + x.pending + ') ' + JSON.stringify({ lg: t.lg, x, mv: (t.lgMoves || []).slice(-2), turn: s.turn, rest: t.rest }));
      if (x.until <= x.at) bad('a contract that ends before it starts');
      per[x.lg] = (per[x.lg] || 0) + 1; }
    for (const k in per) if (per[k] > g.SPON_MAX) bad('League ' + k + ' has ' + per[k] + ' contenders'); }
  // (0.21.0) the Hall of Fame on winning: one entry per title, well-formed, counted on the trainer
  { const per = {}, n = g.nLeagues(), nf = (s.folded || []).length;
    for (const e of s.hof || []) { const t = s.trainers[e.id];
      if (!t || !t.hof) bad('a Hall entry for a trainer who is not a Hall of Famer');
      if (!s.trainers[e.champ]) bad('a Hall entry without the Champion beaten');
      if (!(e.lg < n && e.lg >= -nf)) bad('a Hall entry in League ' + e.lg);
      if (e.spon != null && !(e.spon < n && e.spon >= -nf)) bad('a Hall entry sponsored by League ' + e.spon);
      if (!e.team || !e.team.length || e.team.length > 6 || e.team.some(m => !g.SP[m.sp] || !Array.isArray(m.moves))) bad('a Hall entry with a bad team');
      per[e.id] = (per[e.id] || 0) + 1; }
    for (const t of Object.values(s.trainers)) if ((t.hofN || 0) !== (per[t.id] || 0) || (t.career && t.career.titles !== (per[t.id] || 0))) { bad('Hall entries differ from titles for ' + t.name); break; } }
  // (0.21.0) gym memory: per League, on trainers who exist, at real gyms, a few types each; the board's lists capped
  g.eachLeague(() => { const m = g.S.gmem || {};
    for (const [id, gs] of Object.entries(m)) { if (!s.trainers[id]) bad('gym memory for a missing trainer');
      for (const [k, x] of Object.entries(gs)) { if (!(+k >= 0 && +k < 8) || !x.ty || !x.ty.length || x.ty.length > 4 || !Array.isArray(x.sps) || typeof x.line !== 'string') bad('a bad gym memory'); MEM.n++; } }
    for (const gy of g.S.gyms) { const r = gy.recent; if (r && (r.thru.length > 8 || r.wall.length > 8)) bad('a gym keeps too many recent names'); if ((gy.out || 0) < 0) bad('negative walled count'); } });
  // (0.25.0) the ranch: every League with books has one; entries well-formed; each held by at most one senior team of
  // its League (gym trainers never), stopgaps only on senior teams, trips within the limit, listings not fielded
  g.eachLeague(i => { const z = g.S, R = z.ranch;
    if (!!R !== !!z.fin) bad('League ' + i + ' ranch without books or books without ranch');
    if (!R) return;
    g.ranchSync();
    const ids = new Set();
    for (const e of R.mons) { if (ids.has(e.uid)) bad('a ranch entry twice'); ids.add(e.uid);
      if (!(e.g >= 1 && e.g <= 5) || !g.ranchable(e.b) || !g.SP[e.sp] || g.LINE[e.sp] !== g.LINE[e.b] || !e.iv) bad('a bad ranch entry ' + JSON.stringify(e));
      if (e.res != null && !/^(champion|e4:[0-3]|gym:[0-7])$/.test(e.res)) bad('a bad reservation ' + e.res);
      if (e.sale && e.at != null) bad('a listed ranch Pokémon is being fielded');
      if (e.at != null) { const t = g.T(e.at); if (!t || !g.seniorIds().includes(t.id) || !t.team.some(m => m.rid === e.uid)) bad('a ranch entry held by someone not fielding it'); }
      // (0.36.0) a condition: real kinds, a Delta with a real type, never shiny and Radiant together, IVs to match
      if (e.c) { const ks = g.condKeys(e.c); if (!ks.length) bad('an empty ranch condition'); if (e.c.shiny && e.c.radiant) bad('a shiny Radiant in the ranch');
        if (e.c.delta && !g.TYPES.includes(e.c.delta)) bad('a Delta with no type'); if (e.c.shiny && Object.values(e.iv).some(v => v !== 31)) bad('a shiny without perfect IVs');
        if (e.at != null) { const m = g.T(e.at).team.find(x => x.rid === e.uid); if (m && ks.some(k => !m[k])) bad('a fielded ranch Pokémon lost its condition'); CON.fielded++; }
        CON.held++; ks.forEach(k => { CON.kinds[k] = (CON.kinds[k] || 0) + 1; }); } }
    for (const x of R.shop) if (x.c) { CON.shop++; if (!(x.price >= 100 * g.condMul(x.c))) bad('a conditioned market price too low'); }
    for (const tr of R.trips) if (tr.cond && !g.COND_MUL[tr.cond]) bad('a hunt with no condition');
    if (z.fin) CON.showMax = Math.max(CON.showMax, g.showcase().income);
    if (R.mons.length > g.RANCH_CAP[g.RANCH_CAP.length - 1]) bad('a ranch over every capacity');
    // (0.27.0) the market only sells what the League can reach; the safari holds foreign lines; lanes only in ports
    if (g.homeSet(z.region) && !g.lapsed()) { const ml = new Set(g.marketLines()); for (const x of R.shop) { if (!ml.has(x.b)) bad('the market sells ' + x.b + ' out of reach'); if (!g.homeSet(z.region).has(x.b)) REG.shopForeign++; }
      if (R.safari) for (const b of R.safari.lines) if (g.homeSet(z.region).has(b)) bad('a home line in the safari');
      for (const l of g.lanesOf()) { if (!g.isPort(l.city)) bad('a lane off a port'); if (l.src === z.region) bad('a lane from home'); }
      if (z.gyms.filter(gy => (g.myPlaces().find(p => p.c && p.c.id === gy.city) || { b: [] }).b.some(x => x.k === 'safari')).length > 1) bad('two safaris'); }
    // (0.44.0) the safari's stock and kept lines, and the ranch log
    { const st = R.stock || [], kp = R.keep || [], su = new Set(st.map(e => e.uid));
      if (st.length > g.stockCap()) bad('a safari stocked past its room'); if (st.length && !g.safariBuilt()) bad('stock with no safari');
      if (su.size !== st.length) bad('a Pokémon stocked twice');
      for (const e of st) { if (R.mons.includes(e) || R.mons.some(x => x.uid === e.uid)) bad('a stocked Pokémon still in the ranch'); if (e.at != null || e.sale || e.res || e.lock) bad('a stocked Pokémon fielded, listed, reserved or locked');
        if (!(e.g >= 1 && e.g <= 5) || !g.ranchable(e.b) || !g.SP[e.sp] || g.LINE[e.sp] !== g.LINE[e.b] || !e.iv) bad('a bad stocked entry ' + JSON.stringify(e)); }
      for (const id of g.seniorIds()) for (const m of g.T(id).team) if (m.rid != null && su.has(m.rid)) bad('a stocked Pokémon on a team');
      if (kp.length > g.keepCap()) bad('too many kept safari lines'); for (const b of kp) if (st.some(e => e.b === b)) bad('a kept line also stocked');
      if (R.safari && g.safariLv() === R.safari.lv) for (const b of kp) if (!R.safari.lines.includes(b)) bad('a kept line not in the safari');
      const L = R.log || []; if (L.length > g.RANCH_LOG) bad('the ranch log too long'); for (const x of L) if (typeof x.t !== 'number' || typeof x.text !== 'string' || !x.k) bad('a bad ranch log line ' + JSON.stringify(x));
      SAF.stockMax = Math.max(SAF.stockMax, st.length); SAF.logMax = Math.max(SAF.logMax, L.length); SAF.keptMax = Math.max(SAF.keptMax, kp.length); }
    // (0.45.0) breeding: one parent per line and condition, never in the ranch or on a team, years in range; pairs of
    // two parents in the pool that share an egg group (or one Ditto), within the Day Care's room, none but Ditto in two
    { const D = R.dc || { pool: [], pairs: [], wait: [] }, P = D.pool, keys = new Set(), us = new Set(P.map(e => e.uid));
      for (const e of P) { const k = g.dcKey(e); if (keys.has(k)) bad('two parents of one line and condition'); keys.add(k);
        if (R.mons.some(x => x.uid === e.uid) || (R.stock || []).some(x => x.uid === e.uid)) bad('a parent still in the ranch');
        if (e.at != null || e.sale || e.res || e.lock) bad('a parent fielded, listed, reserved or locked'); if (!g.canBreed(e.b)) bad('a parent that cannot breed');
        if (!(e.until > z.turn - 1 && e.until - e.bin === g.BREED_YEARS * 48)) bad('a parent past its years ' + JSON.stringify({ until: e.until, bin: e.bin, t: z.turn }));
        if (!(e.g >= 1 && e.g <= 5) || !e.iv) bad('a bad parent'); }
      for (const id of g.seniorIds()) for (const m of g.T(id).team) if (m.rid != null && us.has(m.rid)) bad('a parent on a team');
      if (D.pairs.length > g.dcPairs()) bad('more pairs than the Day Care takes'); const inp = {};
      for (const p of D.pairs) { const a = g.parentOf(p.a), b = g.parentOf(p.b); if (!a || !b) { bad('a pair with a parent gone'); continue; } if (!g.eggMatch(a.b, b.b)) bad('a pair with no egg group in common: ' + a.b + ' ' + b.b);
        for (const x of [a, b]) if (!g.isDitto(x.b)) { if (inp[x.uid]) bad('a parent in two pairs'); inp[x.uid] = 1; } if (!(p.due >= z.turn)) bad('a pair overdue'); }
      for (const w of D.wait) if (!(w.until >= z.turn) || !w.e || !g.ranchable(w.e.b)) bad('a bad young one waiting');
      for (const e of R.mons) if (e.from === 'bred' && (!(e.g >= 1 && e.g <= 5) || (e.c && e.c.shiny && Object.values(e.iv).some(v => v !== 31)))) bad('a bad bred Pokémon');
      BRD.poolMax = Math.max(BRD.poolMax, P.length); BRD.pairsMax = Math.max(BRD.pairsMax, D.pairs.length); BRD.waitMax = Math.max(BRD.waitMax, D.wait.length); if (i !== g.ME()) BRD.rivalPool = Math.max(BRD.rivalPool, P.length); }
    for (const tr of R.trips) if (tr.k === 'charter' && (tr.r === z.region || !(tr.r >= 0 && tr.r < g.nRegionsBuilt()))) bad('a bad charter');
    if (R.trips.length > g.TRIP_MAX + 3) bad('too many trips');
    const seen = new Set(); let stops = 0;
    for (const id of g.seniorIds()) for (const m of g.T(id).team) { if (m.rid != null) { if (seen.has(m.rid)) bad('one ranch Pokémon on two teams'); seen.add(m.rid); if (!ids.has(m.rid)) bad('a ranch Pokémon with no entry'); } if (m.stop) stops++; }
    RAN.stopMax = Math.max(RAN.stopMax, stops);
    // (0.26.0) rivals clear out: no spare beyond what their aim keeps sits unfielded much past their idle limit
    const due = new Set();
    if (z.fin && z.fin.aim) for (const e of g.ranchSpares(z.fin.aim)) { if (z.turn - (e.idle ?? z.turn) >= g.AI_IDLE[z.fin.aim]) due.add(e.uid); const w = z.turn - (e.idle ?? z.turn); RAN.aiIdleMax = Math.max(RAN.aiIdleMax, w); if (w >= g.AI_IDLE[z.fin.aim]) { if (!OVERDUE.has(e.uid)) OVERDUE.set(e.uid, z.turn); else if (z.turn - OVERDUE.get(e.uid) > 8) bad('a rival kept an unwanted ranch Pokémon ' + (z.turn - OVERDUE.get(e.uid)) + ' weeks past its limit'); } }
    for (const e of R.mons) if (!due.has(e.uid)) OVERDUE.delete(e.uid);
    for (const gy of z.gyms) for (const id of gy.trainers || []) { const t = g.T(id); if (t && t.role === 'gymtrainer' && t.team.some(m => m.rid != null || m.stop)) bad('a gym trainer fields a ranch Pokémon or stopgap: ' + t.name + ' ' + t.team.filter(m => m.rid != null || m.stop).map(m => m.sp + (m.stop ? ' stop' : ' rid')).join(',')); } });
  if (s.phase !== 'season') bad('unknown phase ' + s.phase);
  if (!(s.week >= 0 && s.week < g.YEAR_WEEKS)) bad('week out of range ' + s.week);
  if (s.turn !== (s.season - 1) * g.YEAR_WEEKS + s.week) bad('turn ' + s.turn + ' does not match year ' + s.season + ' week ' + s.week);
  for (const k of ['orgs', 'userOrg', 'draft', 'offers', 'towns', 'tourney', 'teamCup', 'pendingGifts', 'reward', 'reassign', 'banVote']) if (k in s) bad('cut state is back: S.' + k);
  // cities are world objects; every gym sits in one, in its League's region
  const seen = {}, staff = new Set();
  g.eachLeague(i => {
    const z = S();
    if (z.gyms.length !== 8 || z.e4.length !== 4 || z.champion == null) bad('League ' + i + ' is missing posts');
    const used = new Set();
    z.gyms.forEach((gym, j) => { const c = s.cities[gym.city];
      if (!c) bad('gym ' + j + ' of League ' + i + ' has no city'); else { if (c.region !== z.region) bad('gym city in the wrong region'); if (used.has(c.id)) bad('two gyms of one League in ' + c.name); used.add(c.id); if (g.townName(j) !== c.name) bad('townName mismatch'); }
      const t = g.T(gym.leader); if (!t || t.role !== 'leader' || g.lgOf(t) !== i) bad('gym ' + j + ' leader is wrong'); });
    // the wall: set team sizes, two gym trainers of the leader's type per gym, six Pokémon for the Elite Four and Champion
    z.gyms.forEach((gym, j) => { const L = g.T(gym.leader); if (!L) return;
      // an acting leader is the gym's former gym trainer: one Pokémon fewer, and one gym trainer short
      const act = !!gym.acting, gts = (gym.trainers || []).filter(x => x != null);
      if (act !== !!L.acting) bad('gym ' + j + ' acting flags disagree');
      if (act && !(s.vacancies || []).some(v => v.post === 'leader' && v.slot === j) && i === g.ME()) bad('gym ' + j + ' acting with no vacancy');
      if (L.team.length !== g.LEADER_HOLD - (act ? 1 : 0)) bad('gym ' + j + ' leader fields ' + L.team.length);
      for (const m of L.team) if (L.specialty && !g.isSpecial(m) && !m.offType && !m.backup && !g.specFit(L, m.sp) && !(m.met && ['starter', 'caught'].includes(m.met.how))) bad('gym ' + j + ' leader ' + g.typeLabel(L) + ' fields off-type ' + m.sp);
      if (gts.length !== g.GYM_TRAINERS - (act ? 1 : 0)) bad('gym ' + j + ' has ' + gts.length + ' gym trainers' + (act ? ' (acting)' : ''));
      for (const id of gts) { const t = g.T(id);
        if (!t || t.role !== 'gymtrainer' || g.lgOf(t) !== i) { bad('gym ' + j + ' trainer is wrong'); continue; }
        if (!act && !g.gymFits(t, L)) bad('gym ' + j + ' trainer type ' + g.typeLabel(t) + ' in a ' + g.typeLabel(L) + ' gym');
        for (const m of t.team) if (t.specialty && !g.isSpecial(m) && !m.offType && !g.specFit(t, m.sp)) bad('gym ' + j + ' trainer ' + g.typeLabel(t) + ' fields off-type ' + m.sp);
        if (t.team.length !== g.GT_HOLD) bad('gym ' + j + ' trainer fields ' + t.team.length + ' L' + i + ' ' + JSON.stringify((t.posts || []).slice(-3)) + ' cb ' + JSON.stringify(t.comebacks || []) + ' un ' + t.unretired + ' team ' + t.team.map(m => m.sp + '/' + ((m.met && m.met.how) || '') + (m.rid != null ? '/rid' : '') + (m.vaulted ? '/v' : '')).join(','));
        staff.add(id); } });
    for (const id of [...z.e4, z.champion]) if (g.T(id) && g.T(id).team.length !== g.E4_SIZE) bad('Elite team of ' + g.T(id).team.length);
    if (g.T(z.champion) && g.T(z.champion).acting) bad('an acting Champion');
    // steers and the meta (0.12.0): valid steers, at most one off-type Pokémon a team, readings of five at most
    { const st = z.steer || { line: 'bal', posts: {} };
      if (!g.STEERS[st.line]) bad('League ' + i + ' line steer ' + st.line);
      for (const [k, v] of Object.entries(st.posts || {})) { if (!g.STEERS[v]) bad('steer ' + v + ' on ' + k); if (!/^(champion|e4:[0-3]|gym:[0-7])$/.test(k)) bad('steer on unknown post ' + k); }
      if ((z.metaTrend || []).length > 5 || (z.metaYear || []).length > 5) bad('a meta reading of more than five');
      for (const id of [z.champion, ...z.e4, ...z.gyms.flatMap(x => [x.leader, ...(x.trainers || [])])]) { const t = g.T(id); if (t && t.team.filter(m => m.offType).length > 1) bad('two off-type Pokémon on ' + t.name + ' (' + t.role + (t.acting ? ', acting' : '') + ' ' + g.typeLabel(t) + ': ' + t.team.filter(m => m.offType).map(m => m.sp + (m.rid != null ? ' ranch' : '') + (m.backup ? ' backup' : '') + (m.met ? ' ' + m.met.how : '')).join(', ') + ')'); }
      // (0.38.0) backup types: only on typed senior staff, of one of their backup types, at most half the team
      // (marks are tidied by ranchSync, which runs weekly; a promotion later in the week can leave one stale until then)
      if (z.ranch) g.ranchSync();
      for (const id of [z.champion, ...z.e4, ...z.gyms.flatMap(x => [x.leader, ...(x.trainers || [])])]) { const t = g.T(id); if (!t) continue;
        const bk = t.team.filter(m => m.backup), alt = g.backupTypes(t);
        if (bk.length) backupStat.teams++; backupStat.mons += bk.length; backupStat.stopgaps += t.team.filter(m => m.stop).length; backupStat.most = Math.max(backupStat.most, bk.length);
        if (bk.length > g.backupMax(6)) bad('too many backup-type Pokémon on ' + t.name + ': ' + bk.length);
        if (alt.length && alt.length !== g.BACKUP_N) bad('backup types of ' + t.name + ': ' + alt.join('/'));
        if (alt.some(x => g.specTypes(t).includes(x))) bad('a backup type that is their own on ' + t.name);
        for (const m of bk) { if (!t.specialty || t.role === 'champion' || t.role === 'gymtrainer') bad('a backup-type Pokémon on ' + t.name + ' (' + t.role + ')');
          else if (m.rid == null && m.rfrom == null) bad('a backup-type Pokémon not from the ranch on ' + t.name);
          else if (!g.monTypes(m).some(x => alt.includes(x))) bad('a backup-type Pokémon of none of the backup types on ' + t.name + ': ' + m.sp); } }
      }
    z.e4.forEach((id, k) => { const t = g.T(id); if (t && t.acting && !(s.vacancies || []).some(v => v.post === 'e4' && v.slot === k)) bad('acting Elite Four member with no vacancy'); });
    if (i === g.ME()) { const held = new Set((s.vacancies || []).flatMap(v => v.outsiders || []).concat(z.gyms.flatMap(x => x.outs || []))); for (const t of Object.values(s.trainers)) if (t.role === 'prospect' && !held.has(t.id)) bad('a stranded outsider: ' + t.name); }
    // hiring (0.9.0): a challenger who accepted a post is on the circuit, out on a run, due by the notice, and the
    // post knows they are coming (and nobody else is)
    if (i === g.ME()) { const coming = new Set();
      for (const v of s.vacancies || []) if (v.incoming != null) { const t = g.T(v.incoming); coming.add(v.incoming); if (!t || !t.hired || t.hired.post !== v.post || t.hired.slot !== v.slot) bad('a vacancy waits for someone not coming'); }
      z.gyms.forEach((gy, j) => (gy.incoming || []).forEach((id, k) => { if (id == null) return; const t = g.T(id); coming.add(id); if (!t || !t.hired || t.hired.post !== 'gymtrainer' || t.hired.slot !== j || t.hired.k !== k) bad('a gym trainer place waits for someone not coming'); }));
      for (const t of Object.values(s.trainers)) if (t.hired) {
        if (!coming.has(t.id)) bad('a hire no post knows about: ' + t.name);
        if (t.role !== 'challenger' || !z.challengers.includes(t.id)) bad('a hire off the circuit: ' + t.name);
        if (t.hireDue) bad('a hire left due: ' + t.name);
        if (t.rest != null) bad('a resting hire: ' + t.name);
        if (t.hired.by < s.turn || t.hired.by - s.turn > g.HIRE_NOTICE) bad('a hire past its notice: ' + t.name); } }
    if (i === g.ME()) for (const v of s.vacancies || []) { const a = g.T(v.post === 'leader' ? z.gyms[v.slot].leader : z.e4[v.slot]); if (!a || !a.acting) bad('a vacancy with no acting holder'); }
    { const all = [z.champion, ...z.e4, ...z.gyms.flatMap(x => [x.leader, ...(x.trainers || [])])].filter(x => x != null); if (new Set(all).size !== all.length) bad('someone holds two posts'); }
    z.gyms.forEach(x => { if ((x.watch || []).length > g.GYM_WATCH) bad('too many kept battles'); if ((x.trainers || []).length > g.GYM_TRAINERS) bad('too many gym trainer places'); });
    // ambitions (0.10.0): every member of staff in a post has one; the Champion stays put; promotion runs out on
    // time (a notice, or a gym trainer gone); notices and requests for another run are within their limits
    for (const id of [z.champion, ...z.e4, ...z.gyms.flatMap(x => [x.leader, ...(x.trainers || [])])].filter(x => x != null)) { const t = g.T(id); if (!t || t.acting) continue;
      if (!t.wish || !['up', 'stay', 'run', 'step'].includes(t.wish.k)) { bad('no ambition: ' + t.name + ' ' + t.role); continue; }
      // (0.34.0) the Champion has ambitions too; only a Champion wants to step down, and a founder Champion stays put
      if (t.wish.k === 'step' && t.role !== 'champion') bad('a non-Champion wants to step down: ' + t.name);
      if (t.role === 'champion' && t.founderUntil != null && s.season < t.founderUntil && t.wish.k !== 'stay') bad('a founder Champion wants ' + t.wish.k);
      if (t.role === 'champion') call.champWish[t.wish.k] = (call.champWish[t.wish.k] || 0) + 1;
      if (t.quit && (t.quit.at < s.turn || t.quit.at - s.turn > g.RUN_HOLD)) bad('a notice out of range: ' + t.name + ' ' + JSON.stringify({ q: t.quit, c: t.con, tk: t.talk, w: t.wish, turn: s.turn, role: t.role }));
      if (t.quit && t.stepDown != null) bad('leaving and stepping down at once: ' + t.name);
      if (t.quit) amb.quit.add(t.id);
      // (0.52.0) a contract holds against ambition: overdue promotion and a run request wait for its end
      const held = t.con && (s.turn <= t.con.until || t.talk != null); // (0.53.0) in talks after a contract ran out
      if (t.wish.k === 'run' && t.wish.asked != null) { amb.asked.add(t.id); if (s.turn - t.wish.asked > g.RUN_HOLD && !held) bad('held past a year: ' + t.name); }
      if (g.ambClock(t) && t.stepDown == null && !t.quit && s.turn > g.ambDue(t) + 1 && !held) bad('promotion overdue with no notice: ' + t.name + ' ' + t.role);
      // contracts (0.52.0): every member of staff has one of a length for their kind of post, not overdue
      if (!(i === g.ME() && s.founding)) {
        const c = t.con, gt = t.role === 'gymtrainer', opts = gt ? g.CON_SHORT : g.CON_SENIOR;
        if (!c) bad('no contract: ' + t.name + ' ' + t.role);
        else {
          CTR.seen++;
          if (!opts.includes(c.len) || c.until - c.from !== c.len) bad(`a contract of the wrong length: ${t.name} ${t.role} ${c.len}`);
          if ((c.post === 'gymtrainer') !== gt) bad('a contract for the wrong kind of post: ' + t.name);
          if (s.turn > c.until && t.stepDown == null && !t.quit && t.talk == null) bad(`a contract past its end: ${t.name} ${t.role} ${c.until} < ${s.turn} ` + JSON.stringify({ c, acting: t.acting, posts: (t.posts || []).slice(-2) }));
          if (c.win != null && (c.win < c.until - g.CON_WINDOW || c.win > c.until)) bad('a renewal window out of place: ' + t.name + ' ' + t.role + ' ' + JSON.stringify({ c, tk: t.talk, q: t.quit, turn: s.turn }));
          if (c.will && !['yes', 'more', 'no'].includes(c.will)) bad('a strange answer to renewal: ' + t.name);
          if (t.quit && ['up', 'run'].includes(t.quit.k) && c.from <= s.turn && s.turn < c.until - 1 && !(t.role === 'champion' && t.quit.k === 'step')) bad(`notice given under contract: ${t.name} ${t.quit.k}`);
          if (c.win != null && c.from <= s.turn) CTR.win++;
          CTR.yrs[c.len] = (CTR.yrs[c.len] || 0) + 1;
        }
      } }
    // seat challenges (0.11.0): only the player's League keeps challenges waiting for an answer, each within its
    // answer window and naming people still on the books; kept challenge battles stay capped
    if ((z.seatLogs || []).length > g.SEAT_LOGS) bad('too many kept seat challenges');
    if (i === g.ME()) for (const x of s.chalPending || []) { if (!HAND) bad('a challenge waits in a League nobody staffs by hand');
      if (x.due < s.turn || x.due - s.turn > (x.from === 'claim' ? g.CLAIM_ANSWER : x.called ? g.CALL_WEEKS : g.CHAL_ANSWER)) bad('a challenge waits out of range');
      // (0.34.0) in the player's League the Champion's seat waits only on a call or a claim
      if (x.k === 'champ' && !x.called && x.from !== 'claim') bad('an uncalled challenge for the player\'s Champion');
      if (x.from === 'claim' && (x.k !== 'champ' || !g.claimOn(g.T(x.cand)))) bad('a malformed title claim');
      if (!g.T(x.cand) || !g.T(x.inc) || !['champ', 'e4'].includes(x.k)) bad('a malformed challenge'); }
    if (i !== g.ME() && (z.gyms.some(x => x.acting) || z.e4.some(id => g.T(id) && g.T(id).acting))) bad('a vacancy in a League not staffed by hand');
    // challengers: tries, gym trainers beaten, and Pokémon standing at the level of their next battle
    for (const id of z.challengers) { const t = g.T(id); if (!t || t.role !== 'challenger') continue;
      // (0.32.0) progress gym by gym: tries and gym trainers beaten per gym, none at a gym already beaten, the gym
      // they are heading for one they haven't beaten, and badges a set of distinct gyms
      if (t.rest == null) {
        if (typeof t.gymTries !== 'object' || typeof t.gymStage !== 'object') bad('progress not kept gym by gym for ' + t.name);
        for (const [k, n] of Object.entries(t.gymTries || {})) if (n > g.GYM_TRIES || n < 0 || !(+k >= 0 && +k < 8)) bad('tries out of range for ' + t.name);
        for (const [k, n] of Object.entries(t.gymStage || {})) if (n > g.GYM_TRAINERS || t.badges.includes(+k)) bad('stage out of range for ' + t.name);
        if (new Set(t.badges).size !== t.badges.length || t.badges.some(b => !(b >= 0 && b < 8))) bad('badges repeated or out of range for ' + t.name);
        if (t.badges.length < 8 && t.gymAt != null && t.badges.includes(t.gymAt)) bad('heading for a gym already beaten: ' + t.name);
        if (t.badges.length >= 8 && t.gymAt != null) bad('heading for a gym with eight badges: ' + t.name);
        if (t.badges.length < 8 && t.gymAt == null) anyOrder.noAim++;
        anyOrder.out++; if (t.badges.length && t.badges.some((b, k) => b !== k)) anyOrder.outOfOrder++;
      }
      // the continuous world: a challenger is either resting (with a date to set out again) or out on a run
      if (t.out != null) bad('the season out flag is back for ' + t.name);
      if (t.rest == null && t.runStart == null) bad('neither resting nor on a run: ' + t.name);
      if (t.rest != null && !(t.rest >= s.turn - 1 && t.rest <= s.turn + 14)) bad('rest date out of range for ' + t.name + ': ' + (t.rest - s.turn));
      if (t.rest == null && Object.values(t.gymTries || {}).some(n => n >= g.GYM_TRIES)) bad('still on a run after three losses: ' + t.name);
      if (t.rest == null && s.turn - t.runStart > 3 * g.YEAR_WEEKS) bad('a run of over three years: ' + t.name);
      if (t.rest == null && t.weekLog.length && t.weekLog[t.weekLog.length - 1].wk === s.week && t.team.some(m => m.lvl !== g.challengerLevel(t) && !(m.met && m.met.season === s.season && m.met.week >= s.week))) bad('team not at the set level for ' + t.name); }
    if (z.league && (z.league.season !== s.season || z.league.dethroned || z.league.e4Shot)) bad('the year record is wrong');
    if (z.league && z.league.conceded.length !== z.league.entries.filter(e => e.stage === 5).length) bad('titles conceded and title wins disagree');
    z.e4.forEach(id => { const t = g.T(id); if (!t || t.role !== 'e4') bad('Elite Four seat is wrong'); });
    { const t = g.T(z.champion); if (!t || t.role !== 'champion') bad('Champion is wrong'); }
    // no cap on a circuit, but weak challengers giving up should keep the field in a sensible range (0.5.0: an older,
    // larger field, about 50 to 75 a League; 160 is the alarm since 0.7.0: several-League worlds peaked at 122 to 147 even at 0.6.0)
    // (0.20.0, the owner's choice) 200 within five years of a League folding, when one circuit takes in a folded field
    { const lastFold = Math.max(-99, ...(z.folded || []).map(f => f.to || 0)), cap = z.season - lastFold <= 5 ? 200 : 160;
      if (z.challengers.length > cap) bad('field too big: ' + z.challengers.length); }
    // (0.41.0) challengers belong to the region's field, so one League's circuit may run thin: the region's may not
    if (g.fieldSize(z.region) < 8) bad('region field too thin: ' + g.fieldSize(z.region));
    if (z.fin && z.fin.rebuild && !z.fin.aim) bad('a League with no aim rebuilding');
    if (z.fin && z.fin.rebuild) fieldStats.rebuildWeeks++;
    fieldSum += z.challengers.length; fieldN++; fieldMax = Math.max(fieldMax, z.challengers.length);
    for (const id of z.challengers) { const t = g.T(id);
      if (!t || t.role !== 'challenger') bad('circuit lists a non-challenger ' + id); else if (g.lgOf(t) !== i) bad('challenger tagged for another League ' + t.name);
      if (seen[id] != null) bad('trainer on two circuits ' + id); seen[id] = i;
      if (t && (!t.team.length || t.team.length > 6)) bad('team size ' + t.team.length + ' for ' + t.name); }
  });
  if (Object.keys(s.cities).length % 14) bad('city count ' + Object.keys(s.cities).length);
  // (0.20.0) one of each legendary in the world, one of each Paradox Pokémon held; sanctuaries only in gym cities
  { const held = {}, px = {};
    for (const t of Object.values(s.trainers)) { if (['retired', 'prospect'].includes(t.role)) continue;
      for (const m of t.team) { if (g.SP[m.sp].legend && !g.SP[m.sp].baby) { held[m.sp] = (held[m.sp] || 0) + 1; if (held[m.sp] > g.legendCap(m.sp)) bad(held[m.sp] + ' of ' + m.sp + ' in the world'); }
        if (g.SP[m.sp].paradox) { if (px[m.sp]) bad('two of ' + m.sp + ' (Paradox) held'); px[m.sp] = 1; } } }
    { const wait = {}; for (const m of s.wPool || []) { if (g.SP[m.sp].baby) continue; wait[m.sp] = (wait[m.sp] || 0) + 1; if ((held[m.sp] || 0) + wait[m.sp] > g.legendCap(m.sp)) bad(m.sp + ' held and waiting past its places'); } }
    if (s.leagues) for (const L of s.leagues) if (L && L.legendPool) bad('a League still has its own legendary pool');
    // (0.37.0) the vault: a stored legendary counts toward one of each; a fielded one is on its holder's team
    for (const { lg, e } of g.allVault()) {
      if (!!e.m === (e.holder != null)) bad('a vault entry both stored and fielded (or neither)');
      if (e.m) { if (!g.isLegendLine(e.m.sp) || !e.m.vaulted) bad('a bad stored legendary'); if (e.m.leg) bad('a stored legendary with its clock running'); if (!(e.left >= 1)) bad('a stored legendary with no years left');
        if (g.SP[e.m.sp].legend && !g.SP[e.m.sp].baby) { held[e.m.sp] = (held[e.m.sp] || 0) + 1; if (held[e.m.sp] > g.legendCap(e.m.sp)) bad(held[e.m.sp] + ' of ' + e.m.sp + ' in the world (vault)'); } }
      else { const h = g.T(e.holder), m = h && h.team.find(x => x.uid === e.uid); if (!m || !m.vaulted || !m.leg) bad('a fielded vault legendary not on its holder'); }
      if (!s.cities[e.city]) bad('a vault entry at no city'); PART3.vaultMax = Math.max(PART3.vaultMax, g.allVault().length); }
    for (const t of Object.values(s.trainers)) { for (const m of t.team) if (m.vaulted && !g.allVault().some(x => x.e.uid === m.uid && x.e.holder === t.id)) bad('a vaulted legendary with no vault entry');
      if (t.store) { if (t.store.length > g.STORE_MAX) bad('storage past its cap'); if (t.role === 'retired' && t.store.length) bad('a retiree with storage'); if (t.store.some(x => !g.ranchKeeps(x))) bad('storage holding what a ranch could never take'); PART3.storeMax = Math.max(PART3.storeMax, t.store.length); }
      if (t.storePick && !(t.storePick.n > 0)) bad('a storage pick with nothing left'); }
    LEG.held = Math.max(LEG.held, Object.keys(held).length); LEG.px = Math.max(LEG.px, Object.keys(px).length);
    LEG.sites = Math.max(LEG.sites, Object.values(s.cities).filter(c => g.siteOn(c)).length);
    for (const c of Object.values(s.cities)) if (c.site && !(Array.isArray(c.site.sps) && c.site.sps.length && c.site.sps.length <= 4 && c.site.sps.includes(c.site.sp) && c.site.from >= 1)) bad('a bad legendary site in ' + c.name);
    g.eachLeague(() => { for (const x of g.sanctuaries()) { PART3[x.open ? 'open' : 'sealed']++; } }); }
  // money and cities (0.13.0; every League since 0.15.0): books, pay, bans and buildings; rivals have an aim
  if (!s.founding) g.eachLeague(i => { const z = S(), mine = HAND && i === g.ME();
    if (!z.fin || !Number.isFinite(z.fin.money) || Math.round(z.fin.money) !== z.fin.money) bad('books broken in League ' + i);
    if (mine ? z.fin.aim != null : !g.AIMS[z.fin.aim]) bad('aim wrong in League ' + i + ': ' + z.fin.aim);
    for (const id of g.staffIds()) { const t = g.T(id); if (t && !(t.payOvr > 0)) bad('staff with no pay ' + t.name); if (t && t.quit && t.quit.k === 'pay' && z.fin.money >= 0 && z.fin.redAt == null) bad('a pay notice out of the red'); }
    if (g.paidBans().length > g.BAN_PAID_MAX) bad('too many paid bans');
    if ((z.banBallot || null) && z.banBallot.cands && z.banBallot.cands.length) bad('a ban vote in a League with books');
    for (const p of g.myPlaces()) { if (g.slotsUsed(p.b) > p.slots) bad('more buildings than slots in ' + p.name); for (const x of p.b) if (!(x.lv >= 1 && x.lv <= g.upMax(x.k)) || !g.UPGRADES[x.k] || (g.UPGRADES[x.k].seat && !p.seat) || (g.UPGRADES[x.k].site && p.seat)) bad('bad building in ' + p.name); if (p.none && p.b.length) bad('buildings left where the League has no gym: ' + p.name); }
    if (new Set(z.gyms.map(x => x.city)).size !== 8) bad('two gyms of one League in one city');
  });
  // (0.15.0) at most REGION_CAP Leagues a region (four since 0.41.0); standing only for Leagues with a gym in the city; control by one of them
  { const regs = g.eachLeague(() => S().region), gm = g.gymMap(); for (const r of new Set(regs)) if (regs.filter(x => x === r).length > g.REGION_CAP) bad('more than four Leagues in one region');
    for (const c of Object.values(s.cities)) { const lgs = gm[c.id] || []; for (const k of Object.keys(c.st || {})) if (!lgs.includes(+k) && tag.startsWith('s')) {} if (lgs.length && !lgs.includes(g.cityCtrl(c, lgs))) bad('city controlled by a League with no gym there: ' + c.name); } 
    // (0.40.0) tiers, renown and hometowns
    for (const c of Object.values(s.cities)) { const lgs = gm[c.id] || [];
      if (c.tier != null && !(c.tier >= 0 && c.tier <= 3)) bad('a bad control tier in ' + c.name);
      for (const [k, v] of Object.entries(c.rn || {})) { if (!(+k >= 0 && +k < g.nLeagues())) bad('renown for no League in ' + c.name); if (!(v > 0)) bad('renown not positive in ' + c.name); }
      if (lgs.length) { const st = g.cityState(c, lgs); if (st.slice < 0 || st.slice > g.RN_SLICE + 1e-9) bad('a renown slice out of range in ' + c.name); for (const x of st.rn) if (lgs.includes(x.lg) || x.eff > Math.max(0, st.lead) * g.RN_CAP + 1e-9) bad('renown counted past its cap in ' + c.name);
        const inc = g.CITY_INCOME[g.citySlots(c) - 1], tot = lgs.concat(st.rn.map(x => x.lg)).reduce((a, i) => a + g.cityShare(c, lgs, i), 0); if (Math.abs(tot - inc) > lgs.length + st.rn.length + 1) bad('city income shares add to ' + tot + ' of ' + inc + ' in ' + c.name);
        if (tag.startsWith('step') && s.week === 1) { ctrlStats.cities++; ctrlStats.tiers[st.tier]++; if (st.rn.length) ctrlStats.renown++; if (st.slice) ctrlStats.slice++; } } }
    for (const t of Object.values(s.trainers)) if (t.role !== 'retired' && t.home && !(t.home.r >= 0 && t.home.i >= 0)) bad('a bad hometown: ' + t.name);
    // (0.41.0) the regional field: loyalty to a real League; how full each region is; the thinnest share of a field
    for (const t of Object.values(s.trainers)) if (t.loyal && !(t.loyal.lg >= 0 && t.loyal.lg < g.nLeagues() && t.loyal.until >= 1)) bad('loyalty to no League: ' + t.name);
    if (tag.startsWith('step') && s.week === 1) { for (const r of new Set(regs)) { const tg = g.fieldTarget(r), n = g.fieldSize(r); fieldStats.regionMax = Math.max(fieldStats.regionMax, n); if (tg) fieldStats.crowdMax = Math.max(fieldStats.crowdMax, Math.round(n / tg * 100) / 100);
        const lgs = g.regionLgs(r); if (lgs.length > 1) for (const i of lgs) fieldStats.minShare = Math.min(fieldStats.minShare, Math.round(g.fieldShare(i) * 100) / 100); }
      fieldStats.loyal = Object.values(s.trainers).filter(t => t.role === 'challenger' && t.loyal).length; }
    if (tag.startsWith('step') && s.week === 1) { let n = 0, h = 0; for (const t of Object.values(s.trainers)) if (t.role !== 'retired') { n++; if (g.homeCity(t) != null) h++; } ctrlStats.homed = Math.round(h / Math.max(1, n) * 100); } }
  for (const t of Object.values(s.trainers)) {
    if (t.role === 'challenger' && seen[t.id] == null) bad('challenger on no circuit ' + t.name);
    if (t.role === 'free' && !s.freeAgents.includes(t.id)) bad('free agent not listed ' + t.name);
    if (t.role === 'free') bad('a free agent was left without a circuit: ' + t.name);
    if (t.role === 'gymtrainer' && !staff.has(t.id)) bad('gym trainer at no gym ' + t.name);
    if (t.role === 'exchamp') bad('a dethroned Champion: ' + t.name);
    for (const k of ['org', 'user', 'slot', 'prole', 'trust', 'amb', 'promise']) if (t[k] != null && t[k] !== false) bad('cut trainer field is back: ' + k);
    for (const m of t.team || []) for (const k of ['shadow', 'pkrs', 'lucky', 'loan', 'sulk', 'ranch']) if (m[k] != null) bad('cut Pokémon field is back: ' + k);
  }
  // talks (0.53.0): every talk names a trainer pointing back to it, is open, one offer per League, real posts and terms;
  // a League in at most TALK_MAX besides its own staff's; a star a challenger; staff talks for real staff of their League
  { const seen = new Set();
    for (const k of s.talks || []) {
      const t = s.trainers[k.tid]; TALKS.weeks++;
      if (!t || t.talk !== k.id) bad('a talk whose trainer does not point back to it');
      if (seen.has(k.tid)) bad('two talks for one trainer'); seen.add(k.tid);
      if (!['star', 'expiry', 'poach', 'champ'].includes(k.kind)) bad('a talk of a strange kind');
      if (k.until < s.turn || k.until - k.opened > 7) bad('a talk past its deadline or too long: ' + (k.until - k.opened));
      const lgs = k.offers.map(o => o.lg); if (new Set(lgs).size !== lgs.length) bad('two offers from one League');
      for (const o of k.offers) { if (o.lg < 0 || o.lg >= g.nLeagues()) bad('an offer from no League'); if (!['leader', 'e4', 'champion'].includes(o.post) || o.slot < 0 || o.slot >= (o.post === 'e4' ? 4 : o.post === 'champion' ? 1 : 8)) bad('an offer for no post'); if (t && (o.post === 'champion') !== (t.role === 'champion')) bad('a Champion\'s seat offered to a non-Champion, or another post to a Champion'); if (t && o.post === 'champion' && o.lg !== k.home && !g.inLeague(o.lg, () => { const h = S().champion != null ? g.T(S().champion) : null; return !h || h.id === t.id || h.stepDown != null || !!h.quit; })) bad('a seat offered by a League whose Champion is not leaving'); if (!g.TALK_BIDS.includes(o.bid) || !g.TALK_BONUS.includes(o.bonus) || !g.conOpts(o.post).includes(o.len)) bad('an offer with strange terms'); if ((o.prom || []).some(x => !g.PROMISES[x])) bad('a strange promise'); }
      if (t && k.kind === 'star' && t.role !== 'challenger') bad('a star in talks who is no challenger: ' + t.role);
      if (t && k.kind !== 'star' && (!['leader', 'e4', 'champion'].includes(t.role) || g.homeLeague(t) !== k.home)) bad('staff talks for someone not on their staff: ' + t.role);
      if (t && k.kind === 'champ' && (t.role !== 'champion' || !t.quit || t.quit.k !== 'up')) bad('champ talks for someone not a Champion after a bigger seat');
      if (t && (t.hired || t.spon)) bad('a trainer in talks who is hired or sponsored');
      if (k.offers.length > TALKS.maxOffers) TALKS.maxOffers = k.offers.length;
    }
    for (let i = 0; i < g.nLeagues(); i++) { const n = (s.talks || []).filter(k => k.home !== i && k.offers.some(o => o.lg === i)).length; if (n > g.TALK_MAX) bad('a League in too many talks: ' + n); }
    for (const t of Object.values(s.trainers)) if (t.talk != null && !(s.talks || []).some(k => k.id === t.talk)) bad('a trainer in talks that are over: ' + t.name);
    if ((s.talks || []).length > TALKS.most) TALKS.most = s.talks.length;
  }
  // a save must survive a round trip
  if (tag.startsWith('s')) { const copy = JSON.parse(JSON.stringify(s)); if (Object.keys(copy.trainers).length !== Object.keys(s.trainers).length) bad('save round trip'); }
}
check('new');
const rnd = a => a[Math.floor(Math.random() * a.length)];
for (let i = 0; i < N; i++) {
  let guard = 0; const start = S().season;
  while (S().season === start && guard++ < 400) {
    // god mode works in any week now: open a League and edit a trainer partway through the year
    if (GOD && S().week === 20) {
      if (Math.random() < 0.3 && !g.godOpenLeague()) gods++;
      const t = rnd(Object.values(S().trainers).filter(x => x.role === 'challenger'));
      for (const [f, v] of [['age', 30], ['str', 99], ['pot', 90], ['name', 'Tester ' + i]]) { const w = g.godEdit(t.id, f, v); if (w) fail.push('godEdit ' + w); else gods++; }
    }
    // a Gym Leader, an Elite Four member and the Champion leave in year 2; vacancies are filled now and then
    if (HAND && S().season === 2 && S().week === 10) g.inLeague(g.ME(), () => { g.staffRetires(g.T(S().gyms[1].leader)); g.staffRetires(g.T(S().e4[2])); g.staffRetires(g.T(S().champion)); if ((S().vacancies || []).length < 3) fail.push('expected three vacancies, got ' + (S().vacancies || []).length); hands += S().vacancies.length; });
    // (0.54.0) a Champion in talks: a rival's Champion gives notice for a bigger seat while yours is stepping down;
    // you offer your seat (an Elite Four seat is refused), and at the deadline they take it (or don't)
    if (HAND && S().season === 3 && S().week === 20 && g.nLeagues() > 1 && !S().founding) {
      const me = g.ME(), R = [...Array(g.nLeagues()).keys()].find(i => i !== me && g.inLeague(i, () => { const c = g.T(S().champion); return c && !g.founderChamp(c) && g.canTalk(c) && !c.quit && c.stepDown == null; }));
      const h = g.inLeague(me, () => g.T(S().champion));
      if (R != null && h && !g.founderChamp(h) && h.talk == null) {
        const c = g.inLeague(R, () => g.T(S().champion));
        c.quit = { at: S().turn + 8, k: 'up' }; if (c.con) { c.con.until = S().turn; c.con.from = c.con.until - c.con.len; c.con.win = c.con.until; } // as it would be: the notice comes once the contract no longer holds
        if (g.inLeague(me, () => g.seatOpening())) fail.push('your seat opening before your Champion is leaving');
        const k = g.inLeague(R, () => g.champUpTalks(c) ? g.talkOf(c) : null);
        if (!k) fail.push('no talks for a Champion after a bigger seat');
        else {
          const len = g.conOpts('champion')[0];
          if (!g.makeOffer(k, { lg: me, post: 'champion', slot: 0, bid: 0.75, bonus: 0, len, prom: [] })) fail.push('a seat offered while your Champion stays');
          h.stepDown = S().turn + 30;
          if (!g.makeOffer(k, { lg: me, post: 'e4', slot: 0, bid: 0.75, bonus: 0, len, prom: [] })) fail.push('an Elite Four seat offered to a Champion');
          const err = g.makeOffer(k, { lg: me, post: 'champion', slot: 0, bid: 0.75, bonus: 0, len, prom: [] });
          if (err) { TALKS.champErr = err; h.stepDown = null; }
          else {
            const res = g.settleTalk(k); TALKS.champ = res;
            if (res === 'signed') { if (g.inLeague(me, () => S().champion) !== c.id || g.homeLeague(c) !== me) fail.push('a Champion signed in talks is not in your seat'); if (h.role === 'champion') fail.push('your old Champion is still Champion'); if (g.inLeague(R, () => S().champion) === c.id || g.inLeague(R, () => S().champion) == null) fail.push('the Champion\'s old League has no new Champion'); }
            else { h.stepDown = null; if (c.role === 'champion' && c.quit && c.quit.k === 'up' && g.homeLeague(c) === R) {} }
          }
        }
      }
    }
    // talks (0.53.0): make, raise and withdraw offers at random; answer rivals going after your staff (match or let go
    // for the transfer fee); offers from a hiring page for stars; promises kept (no step down, a certain grudge)
    if (HAND && S().season >= 2 && Math.random() < 0.15 && !S().founding) {
      const me = g.ME(), ks = (S().talks || []).filter(k => g.T(k.tid));
      const pk = ks.filter(k => k.kind === 'poach' && k.home === me);
      if (ks.length) { const k = pk.length ? rnd(pk) : rnd(ks), t = g.T(k.tid), mine = k.offers.find(o => o.lg === me);
        if (k.home === me && k.kind === 'poach') {
          const r = Math.random();
          if (r < 0.4) { const err = g.talkMatch(t.id); if (err) TALKS.handErr++; else { TALKS.matched++; const o = k.offers.find(o => o.lg === me), best = g.talkRank(k).find(x => x.o.lg !== me); if (!o || (best && (o.bid !== best.o.bid || o.bonus !== best.o.bonus))) fail.push('a match that does not match'); } }
          else if (r < 0.7) { const best = g.talkRank(k).find(x => x.o.lg !== me); if (best) { const fee = g.inLeague(best.o.lg, () => g.payFor(t, best.o.post, best.o.slot)), m0 = g.inLeague(me, () => S().fin.money), tr0 = g.inLeague(me, () => (S().fin.yr && S().fin.yr.in.transfers) || 0);
            const err = g.talkLetGo(t.id); if (err) fail.push('talkLetGo ' + err); else { TALKS.letGo++; if (g.homeLeague(t) !== best.o.lg || !['leader', 'e4'].includes(t.role)) fail.push('let go in talks but not at the rival: ' + t.role); if (t.talk != null) fail.push('let go but still in talks');
              const tr = g.inLeague(me, () => (S().fin.yr && S().fin.yr.in.transfers) || 0) - tr0; if (fee && tr <= 0) fail.push('no transfer fee for one let go in talks'); } } }
        } else if (Math.random() < 0.15 && mine) { if (!g.withdrawTalkOffer(k, me)) fail.push('withdraw refused'); else { TALKS.withdrawn++; if (k.offers.some(o => o.lg === me)) fail.push('withdrawn offer still there'); } }
        else {
          const p = k.home === me ? g.inLeague(me, () => g.postOf(t)) : null, post = p ? p.post : t.role === 'champion' ? 'champion' : rnd(['leader', 'e4']), slot = p ? p.slot : post === 'champion' ? 0 : Math.floor(Math.random() * (post === 'e4' ? 4 : 8));
          const o = { lg: me, post, slot, bid: rnd(g.TALK_BIDS), bonus: rnd(g.TALK_BONUS), len: rnd(g.conOpts(post)), prom: Math.random() < 0.3 ? [rnd(['nodemote', 'own'])] : [] };
          const cap = !mine && k.home !== me && g.talkCount(me) >= g.TALK_MAX, red = g.inLeague(me, () => S().fin.money < 0);
          const err = g.makeOffer(k, o); TALKS.hand++;
          if (cap && !err) fail.push('an offer past the talks limit');
          if (red && !err) fail.push('an offer in the red');
          if (err) { TALKS.handErr++; if (cap) TALKS.cap++; if (red) TALKS.red++; }
          else { const n = k.offers.find(x => x.lg === me); if (!n || n.bid !== o.bid || n.bonus !== o.bonus || n.len !== o.len) fail.push('the offer was not kept as made');
            const held = g.talkHeld(me); if (g.inLeague(me, () => S().fin.money) < held) fail.push('bonuses on the table beyond the money: ' + held); }
          if (g.makeOffer(k, { ...o, bid: 0.33 }) == null) fail.push('a strange bid was taken');
        } }
      // a star offered from a hiring page opens talks
      g.inLeague(me, () => { const v = (S().vacancies || [])[0]; if (!v || Math.random() > 0.3) return; const c = g.vacancyCands(v).find(x => x.talks && !x.refuse); if (!c) return;
        const r = g.hireForVacancy(v, c.t.id, 0); if (r && r.res === 'broke') return; if (!r || r.res !== 'talks') fail.push('a star from a hiring page did not open talks: ' + (r && r.res)); else if (!r.err) { TALKS.fromHire++; if (!g.talkOf(c.t) || !g.talkOf(c.t).offers.some(o => o.lg === me)) fail.push('talks from a hiring page without your offer'); } });
      // a promise of no step down is kept: the move is refused
      g.inLeague(me, () => { for (const t of S().e4.map(g.T)) if (t && g.promOn(t, 'nodemote', me)) { TALKS.promised++; if (!g.refusal(t, 'leader', 0)) fail.push('a promised member would take a step down'); } });
    }
    // staffing at will (0.7.0): let staff go, swap them, and place gym trainers by hand, now and then
    if (HAND && S().season >= 2) g.inLeague(g.ME(), () => {
      const z = S(), seniors = [...z.e4, ...z.gyms.map(x => x.leader)].map(g.T).filter(t => t && !t.acting);
      if (g.releaseStaff(z.champion)) fail.push('the Champion was let go');
      if (Math.random() < 0.04 && seniors.length) { const t = rnd(seniors.concat((z.gyms[rnd([0, 1, 2, 3, 4, 5, 6, 7])].trainers || []).map(g.T).filter(Boolean)));
        // (0.49.0) now and then the one let go has already announced stepping down: no severance once a date is set
        if (Math.random() < 0.3 && t.stepDown == null && !t.quit) { g.announceStepDown(t); moves.dated++; }
        const dated = g.leavingSet(t), runReq = t.wish && t.wish.k === 'run' && t.wish.asked != null, fee = g.severanceFee(t), yr0 = z.fin.yr, sev0 = (z.fin.yr && z.fin.yr.out.severance) || 0;
        const r = g.releaseStaff(t.id); if (!r) fail.push('releaseStaff refused ' + t.role); else { moves.let++; if (!['challenger', 'retired'].includes(t.role)) fail.push('let go but role ' + t.role);
          const paid = ((z.fin.yr && z.fin.yr.out.severance) || 0) - sev0;
          if (dated) { moves.free++; if (fee || paid) fail.push('severance charged for someone with a leaving date: ' + paid); }
          else if (!runReq && paid !== fee && z.fin.yr === yr0) fail.push(`severance ${paid}, expected ${fee} (${t.role} talk ${t.talk} prom ${JSON.stringify(t.prom)} week ${S().week})`); } }
      if (Math.random() < 0.03) { const role = rnd(['leader', 'e4']), ps = seniors.filter(t => t.role === role);
        if (ps.length >= 2) { const a = rnd(ps), b = rnd(ps.filter(x => x !== a)), why = g.swapRefusal(a, b), ok = g.swapStaff(a.id, b.id);
          if (why) { amb.refusedSwap++; if (ok) fail.push('a refused swap went ahead: ' + why); } else if (!ok) fail.push('swapStaff refused'); else moves.swap++; } }
      if (Math.random() < 0.04) { const i = rnd([0, 1, 2, 3, 4, 5, 6, 7]), gy = z.gyms[i], k = (gy.trainers || []).findIndex(x => x != null);
        const all = g.gymTrainerCands(i), c = all.filter(x => !x.refuse), no = all.find(x => x.refuse);
        if (no && k >= 0) { amb.refusedMove++; if (g.placeGymTrainer(i, k, no.t.id)) fail.push('a refused move went ahead'); }
        if (k >= 0 && c.length) { const pick = rnd(c.slice(0, 8)).t; if (!g.placeGymTrainer(i, k, pick.id)) fail.push('placeGymTrainer refused'); else moves.gt++; } }
    });
    // hiring (0.9.0): offers to the circuit for vacancies and gym trainer places, outsiders and retirees, withdrawals
    if (HAND && S().season >= 2) g.inLeague(g.ME(), () => { const z = S();
      const tally = o => { if (o && o.res) offers[o.res] = (offers[o.res] || 0) + 1; else fail.push('an offer failed'); };
      if ((z.vacancies || []).length && Math.random() < 0.1) { const v = rnd(z.vacancies), all = g.vacancyCands(v), c = all.filter(x => x.from === 'circuit' && !x.refuse && g.canOffer(x.t) && x.t.id !== v.incoming);
        { const bl = all.find(x => x.from === 'circuit' && x.refuse); if (bl) { PGH.blocked++; const r = g.hireForVacancy(v, bl.t.id); if (r && r.res) fail.push('a blocked candidate was offered a post'); } } // (0.23.0)
        if (c.length) { const t = rnd(c.slice(0, 12)).t, len = rnd(g.CON_SENIOR); g.setConAsk(t.id, len); CTR.asked++; if (g.conMiss(t, v.post, len)) CTR.askMiss++;
          const o = g.hireForVacancy(v, t.id, rnd(g.BIDS)); tally(o); if (o && o.res === 'now' && t.con && t.con.from === S().turn && t.con.len !== len) fail.push('a hire signed for a length not asked'); if (o && (o.res === 'refused' || o.res === 'cool') && t.conAsk) fail.push('a refused offer kept its length'); } }
      if (Math.random() < 0.05) { const i = rnd([0, 1, 2, 3, 4, 5, 6, 7]), gy = z.gyms[i], k = (gy.trainers || []).findIndex(x => x != null);
        if (Math.random() < 0.5) g.gymOutsiders(i);
        const c = g.gymTrainerCands(i).filter(x => ['circuit', 'outsider', 'retired'].includes(x.from) && !x.refuse && (x.from !== 'circuit' || g.canOffer(x.t)));
        if (k >= 0 && c.length) { const t = rnd(c.slice(0, 8)).t, len = rnd(g.CON_SHORT); g.setConAsk(t.id, len); CTR.asked++;
          const o = g.hireForGymTrainer(i, k, t.id); tally(o); if (o && o.res === 'now' && t.role === 'gymtrainer' && t.con && t.con.from === S().turn && t.con.len !== len) fail.push('a gym trainer signed for a length not asked'); } }
      if (Math.random() < 0.01) { const h = Object.values(z.trainers).find(t => t.hired); if (h && g.withdrawOffer(h.id)) offers.withdrawn++; }
    });
    // (0.36.0) a condition hunt (refused out of reach, the cost the plan's) and a trip to an outbreak
    if (HAND && Math.random() < 0.02) g.inLeague(g.ME(), () => { const z = S(); if (!z.ranch || !z.fin || z.fin.money < 0 || z.founding) return; const m0 = z.fin.money;
      { const k = rnd(g.COND_KINDS), okL = g.ranchSpecies().filter(x => g.huntOk(x, k)), b = okL.length && Math.random() < 0.6 ? rnd(okL) : rnd(g.ranchSpecies()), ok = g.huntOk(b, k), p = g.huntPlan(b, k), w = g.startTrip('target', b, k);
        if (!w) { CON.hunts++; if (!ok) fail.push('a hunt out of reach: ' + b); if (z.fin.money !== m0 - p.cost) fail.push('hunt cost wrong'); if (p.cost <= g.tripPlan(b).cost) fail.push('a hunt no dearer than a trip'); }
        else { CON.huntRefused++; if (ok && z.ranch.trips.length < g.tripMax() && m0 >= p.cost) fail.push('hunt refused: ' + w); }
        const o = g.obTrip(); if (o && z.ranch.trips.length < g.tripMax() && z.fin.money >= g.OB_TRIP_COST) { const m1 = z.fin.money; if (g.startTrip('outbreak')) fail.push('outbreak trip refused'); else { CON.obTrips++; if (z.fin.money !== m1 - g.OB_TRIP_COST) fail.push('outbreak trip cost wrong'); if (!g.startTrip('outbreak')) fail.push('two trips to one outbreak'); } } } });
    // (0.44.0) the safari: keep a line, stock a Pokémon (one not in a plan), take one back
    if (HAND && S().season >= 2) g.inLeague(g.ME(), () => { const z = S(); if (!z.ranch || !z.fin || z.founding || g.safariBuilt() || z.fin.money < 0) return; // build one as soon as it can
      const i = [0, 1, 2, 3, 4, 5, 6, 7].find(k => !g.buildCheck(k, 'safari').why); if (i != null && z.fin.money >= g.buildCheck(i, 'safari').cost && !g.build(i, 'safari')) REG.safari++; });
    if (HAND && Math.random() < 0.04) g.inLeague(g.ME(), () => { const z = S(); if (!z.ranch || z.founding || !g.safariBuilt()) return; const R = z.ranch, r = Math.random();
      if (r < 0.3) { if (!R.safari || !R.safari.lines.length) return; const b = rnd(R.safari.lines), was = g.safariKept().includes(b), w = g.keepLine(b, true);
        if (!w) { if (!was) SAF.kept++; if (!g.safariKept().includes(b)) fail.push('keeping a line'); } else if (g.safariKept().length < g.keepCap() && !R.stock.some(e => e.b === b)) fail.push('keep refused: ' + w);
        if (Math.random() < 0.3) { g.keepLine(b, false); if (g.safariKept().includes(b)) fail.push('unkeeping a line'); } }
      else if (r < 0.75) { const P = g.plansState(), pl = new Set(Object.values(P.posts || {}).flatMap(p => (p.on || []).concat(p.next || [])).filter(x => x && x.r != null).map(x => x.r));
        g.ranchSync(); const e = rnd(R.mons.filter(x => x.at == null && !pl.has(x.uid))); if (!e) return; const n0 = R.mons.length, s0 = R.stock.length, u0 = g.ranchUpkeep(), w = g.stockMon(e.uid);
        if (!w) { SAF.stocked++; if (R.mons.length !== n0 - 1 || R.stock.length !== s0 + 1 || g.ranchUpkeep() !== u0) fail.push('stocking wrong ' + JSON.stringify({ n0, n: R.mons.length, s0, s: R.stock.length, u0, u: g.ranchUpkeep() })); if (!g.lapsed() && !g.safariSet().has(e.b)) fail.push('a stocked line not in the safari'); if (g.tripOk(e.b) && !g.lapsed() && g.tripPlan(e.b).floor !== Math.max(1, g.stockFloor(e.b) - 1)) fail.push('no grade floor for a stocked line'); }
        else if (s0 < g.stockCap()) fail.push('stocking refused: ' + w); }
      else { const e = rnd(R.stock); if (!e) return; const w = g.unstockMon(e.uid); if (!w) { SAF.taken++; if (R.stock.includes(e) || !R.mons.includes(e)) fail.push('taking back wrong'); } else if (g.ranchRoom() > 0) fail.push('take back refused: ' + w); } });
    // (0.45.0) breeding: build the Day Care from year 2, put Pokémon in (refused when locked, not better, or unbreedable;
    // a reserved one only with force), start and end pairs; check upkeep at half and the pool's room
    if (HAND && S().season >= 2) g.inLeague(g.ME(), () => { const z = S(); if (!z.ranch || !z.fin || z.founding || g.dcBuilt() || z.fin.money < 0) return;
      const ck = g.buildCheck('seat', 'daycare'); if (!ck.why && z.fin.money >= ck.cost) { const m0 = z.fin.money; if (!g.build('seat', 'daycare')) { BRD.built++; if (z.fin.money !== m0 - ck.cost) fail.push('Day Care cost wrong'); } } });
    if (HAND && Math.random() < 0.05) g.inLeague(g.ME(), () => { const z = S(); if (!z.ranch || z.founding || !g.dcBuilt()) return; const R = z.ranch, D = g.dcState(), r = Math.random();
      if (r < 0.5) { g.ranchSync(); const e = rnd(R.mons); if (!e) return; const ck = g.breedCheck(e.uid), u0 = g.ranchUpkeep(), n0 = R.mons.length, old = ck && typeof ck === 'object' ? ck.old : null;
        const w = g.breedIn(e.uid); if (ck && typeof ck === 'object' && ck.ask) { if (!w) fail.push('a reserved or planned Pokémon went in without asking'); if (Math.random() < 0.5) return; const w2 = g.breedIn(e.uid, true); if (w2) fail.push('breeding with force refused: ' + w2); else BRD.put++; }
        else if (!w) { BRD.put++; if (typeof ck === 'string') fail.push('breeding allowed past ' + ck); if (R.mons.length !== n0 - 1 || !D.pool.includes(e)) fail.push('breeding moved wrong');
          const want = u0 - 0 - [8, 12, 18, 26, 36][e.g - 1] + Math.round([8, 12, 18, 26, 36][e.g - 1] * g.BREED_UPKEEP) - (old ? Math.round([8, 12, 18, 26, 36][old.g - 1] * g.BREED_UPKEEP) : 0); if (g.ranchUpkeep() !== want) fail.push('breeding upkeep wrong ' + g.ranchUpkeep() + ' ' + want); if (old && D.pool.includes(old)) fail.push('a bumped parent stayed'); }
        else { BRD.refused++; if (!ck) fail.push('breeding refused: ' + w); } }
      else if (r < 0.85) { const P = D.pool; if (P.length < 2) return; let a = rnd(P), b = rnd(P); if (Math.random() < 0.7) { const ok = []; for (const x of P) for (const y of P) if (!g.pairCheck(x.uid, y.uid)) ok.push([x, y]); if (ok.length) [a, b] = rnd(ok); } const ck = g.pairCheck(a.uid, b.uid), w = g.startPair(a.uid, b.uid);
        if (!w) { BRD.pairs++; if (ck) fail.push('a pair past ' + ck); if (!g.eggMatch(a.b, b.b)) fail.push('a pair with no egg group in common'); } else { BRD.pairRefused++; if (!ck) fail.push('pair refused: ' + w); } }
      else { const p = rnd(D.pairs); if (p && !g.endPair(p.id)) BRD.ended++; } });
    // (0.25.0) the ranch: trips, the market, other Leagues' sales, selling, releasing, locks, reserves and listings
    if (HAND && Math.random() < 0.08) g.inLeague(g.ME(), () => { const z = S(); if (!z.ranch || !z.fin || z.fin.money < 0 || z.founding) return; const r = Math.random(), m0 = z.fin.money;
      if (r < 0.15) { const ok = g.tripOk, b = Math.random() < 0.3 ? rnd(g.ranchSpecies()) : rnd(g.ranchSpecies().filter(x => ok(x))), p = g.tripPlan(b), avail = ok(b), w = g.startTrip('target', b);
        if (!w) { RAN.trips++; if (!avail) fail.push('a trip for a line out of reach: ' + b); if (z.fin.money !== m0 - p.cost) fail.push('trip cost wrong'); if (g.lineSource(b) === 'safari') REG.safariTrips++; }
        else if (!avail) REG.refusedTrips++; else if (z.ranch.trips.length < g.tripMax() && m0 >= p.cost) fail.push('trip refused: ' + w); }
      // (0.27.0) charters, a lane (where a gym city is a port) and its route, the safari
      else if (r < 0.19) { const to = rnd([...Array(g.nRegionsBuilt()).keys()].filter(x => x !== z.region)), w = g.startTrip('charter', to); if (!w) { REG.charters++; if (z.fin.money !== m0 - g.CHARTER_COST) fail.push('charter cost wrong'); } if (!g.startTrip('charter', z.region)) fail.push('a charter from home'); }
      else if (r < 0.22) { const i = [0, 1, 2, 3, 4, 5, 6, 7].find(k => !g.buildCheck(k, 'lane').why), l = g.lanesOf()[0];
        if (!g.buildCheck('seat', 'lane').why) fail.push('a lane at the seat');
        for (let k = 0; k < 8; k++) if (!g.buildCheck(k, 'lane').why && !g.isPort(z.cities[z.gyms[k].city])) fail.push('a lane allowed off a port');
        if (i != null && z.fin.money >= g.buildCheck(i, 'lane').cost) { const c = g.buildCheck(i, 'lane').cost; if (!g.build(i, 'lane')) { REG.lanes++; if (z.fin.money !== m0 - c) fail.push('lane cost wrong'); if (!g.laneSet().size) fail.push('a lane brings nothing'); } }
        else if (l) { const to = rnd([...Array(g.nRegionsBuilt()).keys()].filter(x => x !== z.region && x !== l.src)), mm = z.fin.money; if (to != null && !g.setLane(l.gym, to)) { REG.routes++; if (z.fin.money !== mm - g.LANE_ROUTE || g.lanesOf()[0].src !== to) fail.push('lane route change wrong'); } } }
      else if (r < 0.25) { const i = [0, 1, 2, 3, 4, 5, 6, 7].find(k => !g.buildCheck(k, 'safari').why); if (i != null && z.fin.money >= g.buildCheck(i, 'safari').cost) { if (!g.build(i, 'safari')) REG.safari++; if ([0, 1, 2, 3, 4, 5, 6, 7].some(k => k !== i && !g.buildCheck(k, 'safari').why)) fail.push('a second safari allowed'); } }
      else if (r < 0.25) { if (!g.startTrip('area')) { RAN.area++; if (z.fin.money !== m0 - g.AREA_COST) fail.push('area trip cost wrong'); } }
      else if (r < 0.45) { const x = rnd(z.ranch.shop); if (x) { const n0 = z.ranch.mons.length, w = g.buyShop(x.uid); if (!w) { RAN.bought++; if (z.fin.money !== m0 - x.price || z.ranch.mons.length !== n0 + 1) fail.push('market purchase wrong'); } else if (g.ranchRoom() > 0 && m0 >= x.price) fail.push('market refused: ' + w); } }
      else if (r < 0.55) { const L = g.listings(g.ME()), x = rnd(L); if (x) { const pr = x.e.sale.price, sm = g.inLeague(x.lg, () => g.S.fin.money), w = g.buyListing(x.lg, x.e.uid);
        if (!w) { RAN.lbought++; if (z.fin.money !== m0 - pr || g.inLeague(x.lg, () => g.S.fin.money) !== sm + Math.round(pr * g.SALE_SHARE)) fail.push('League sale money wrong'); if (g.inLeague(x.lg, () => g.S.ranch.mons.some(e => e.uid === x.e.uid))) fail.push('a sold Pokémon stayed with the seller'); } } }
      else { g.ranchSync(); const free = z.ranch.mons.filter(e => e.at == null), e = rnd(z.ranch.mons), q = Math.random();
        if (q < 0.2 && free.length) { const f = rnd(free); if (f.sale) g.unlistMon(f.uid); const v = Math.round(g.entryValue(f) * g.SELL_BACK), mm = z.fin.money; if (!g.sellMon(f.uid)) { RAN.sold++; if (z.fin.money !== mm + v) fail.push('sell-back value wrong'); } }
        else if (q < 0.27) { const f = rnd(z.ranch.mons.filter(x => x.at != null)); if (f) { const t = g.T(f.at), n0 = t.team.length, v = Math.round(g.entryValue(f) * g.SELL_BACK), mm = z.fin.money, rel = Math.random() < 0.3;
          if (!g.sellMon(f.uid, rel)) { RAN.soldFielded++; if (t.team.length !== n0 || t.team.some(m => m.rid === f.uid) || z.ranch.mons.includes(f)) fail.push('selling a fielded ranch Pokémon left the team wrong'); if (z.fin.money !== mm + (rel ? 0 : v)) fail.push('selling a fielded ranch Pokémon paid wrong'); } else fail.push('could not sell a fielded ranch Pokémon'); } }
        else if (q < 0.35 && free.length) { const f = rnd(free); if (f.sale) g.unlistMon(f.uid); if (!g.sellMon(f.uid, true)) RAN.released++; if (z.fin.money !== m0) fail.push('release cost money'); }
        else if (q < 0.55 && e) { if (!g.lockMon(e.uid, !e.lock)) RAN.locked++; }
        else if (q < 0.8 && e) { if (!g.reserveMon(e.uid, rnd([null, 'champion', 'e4:1', 'gym:3', 'gym:6']))) RAN.reserved++; if (!g.reserveMon(e.uid, 'nowhere')) fail.push('a reservation for no post'); }
        else if (free.length && g.nLeagues() > 1) { const f = rnd(free); if (f.sale) { if (!g.unlistMon(f.uid)) RAN.unlisted++; } else if (!g.listMon(f.uid)) RAN.listed++; } }
      // (0.37.0) take from a new hire's storage; ask a holder to store a legendary; give a stored one to the Elite Four
      for (const id of g.seniorIds()) { const t = g.T(id); if (!g.storePickOk(t)) continue; const s0 = rnd(t.store), n0 = z.ranch.mons.length, k0 = t.storePick.n;
        const w = g.pickStore(id, s0.uid); if (!w) { PART3.picked++; if (z.ranch.mons.length !== n0 + 1 || t.store.includes(s0) || (t.storePick && t.storePick.n !== k0 - 1)) fail.push('a storage pick went wrong'); } else PART3.pickRefused++; break; }
      { const c = g.vaultCands(); if (c.length && Math.random() < 0.3) { const x = rnd(c), m0 = z.fin.money, fee = x.staff ? 0 : g.vaultFee(x.m), r = g.storeLegend(x.t.id, x.m.uid); PART3.asked++;
          if (r.ok) { PART3.stored++; if (z.fin.money !== m0 - fee) fail.push('vault fee wrong'); if (x.t.team.includes(x.m) || !z.vault.some(e => e.m === x.m)) fail.push('storing a legendary went wrong'); } } }
      { const e = (z.vault || []).find(v => v.m), tk = g.vaultTakers(); if (e && tk.length && Math.random() < 0.5) { const t = rnd(tk), w = g.vaultGive(e.uid, t.id); if (!w) { PART3.given++; if (!t.team.some(m => m.uid === e.uid) || e.m) fail.push('giving a stored legendary went wrong'); } else PART3.giveRefused++; }
        const busy = g.staffIds().map(g.T).find(t => t && t.role === 'leader'); if (e && busy && !g.vaultGive(e.uid, busy.id)) fail.push('a Gym Leader was given a stored legendary'); }
      if (Math.random() < 0.1) { const ck = g.buildCheck('seat', 'ranch'); if (!ck.why && z.fin.money >= ck.cost) { const c0 = g.ranchCap(); if (!g.build('seat', 'ranch')) { RAN.built++; if (g.ranchCap() <= c0) fail.push('the Ranch did not add room'); } } } });
    // money and cities (0.13.0): build, ban, give raises and move gyms now and then
    if (HAND && S().season >= 2 && Math.random() < 0.05) g.inLeague(g.ME(), () => { const z = S(), r = Math.random();
      // (0.20.0) a Sanctuary where a gym city is a legendary site; never at the seat or a city that isn't one
      { const site = [0, 1, 2, 3, 4, 5, 6, 7].find(i => g.siteOn(z.cities[z.gyms[i].city]) && !g.buildCheck(i, 'sanct').why);
        if (site != null && Math.random() < 0.5) { const ck = g.buildCheck(site, 'sanct'), m0 = z.fin.money; if (!g.build(site, 'sanct')) { LEG.sanctBuilt++; if (z.fin.money !== m0 - ck.cost) fail.push('sanctuary cost wrong'); } }
        if (!g.buildCheck('seat', 'sanct').why) fail.push('a sanctuary allowed at the seat');
        const off = [0, 1, 2, 3, 4, 5, 6, 7].find(i => !g.siteOn(z.cities[z.gyms[i].city])); if (off != null && !g.buildCheck(off, 'sanct').why) fail.push('a sanctuary allowed off a site'); }
      if (r < 0.4) { const where = rnd(['seat', 0, 1, 2, 3, 4, 5, 6, 7]), k = rnd(Object.keys(g.UPGRADES)), ck = g.buildCheck(where, k), m0 = z.fin.money, w = g.build(where, k);
        if (!w) { money.built++; if (z.fin.money !== m0 - ck.cost) fail.push('build cost wrong'); } else if (!ck.why && z.fin.money >= ck.cost) fail.push('build refused: ' + w); }
      else if (r < 0.7) { const c = g.banCands().filter(x => !x.banned && !x.prot), x = c.length ? rnd(c.slice(0, 10)) : null; if (x) { const w = g.payBan(x.sp, rnd([1, 2, 3])); if (!w) money.bans++; else if (g.paidBans().length < g.BAN_PAID_MAX && z.fin.money >= x.price * 3) fail.push('ban refused: ' + w); } }
      else if (r < 0.85) { const t = g.staffIds().map(g.T).find(x => x && g.canRaise(x)); if (t && !g.giveRaise(t.id)) money.raises++; }
      else if (r < 0.9) { const free = g.myPlaces().filter(p => p.none); if (free.length && !g.moveGym(rnd([0, 1, 2, 3, 4, 5, 6, 7]), rnd(free).c.id)) money.moved++; }
      else if (r < 0.95) { const x = g.topLevels(); if (x.length) { const b = rnd(x), v = g.sellValue(b.where, b.k), keep = z.fin.money, inRed = Math.random() < 0.4; if (inRed) z.fin.money = -1000; const m0 = z.fin.money, e0 = g.estateCost(); if (g.sellBuilding(b.where, b.k)) fail.push('sellBuilding refused'); else { red.sold++; if (z.fin.money !== m0 + v || g.estateCost() !== e0 - b.cost || v !== Math.round(b.cost * g.SELL_SHARE)) fail.push('sale amounts wrong');
        // (0.19.0) the level sold can be restored at RESTORE_SHARE of its price
        const ck = g.buildCheck(b.where, b.k);
        // only a sale made in the red leaves a ruin
        if (!ck.why && m0 >= 0 && ck.restore && g.ruinsAt(b.where, b.k) === 0) fail.push('a restore price with no ruin');
        if (!ck.why && m0 < 0 && (!ck.restore || ck.cost !== Math.round(g.upCost(b.k, ck.lv - 1) * g.RESTORE_SHARE))) fail.push('no restore price after a sale in the red');
        if (inRed) z.fin.money = keep + v; // back to what it was, plus the sale
        if (!ck.why && ck.restore && Math.random() < 0.5 && z.fin.money >= ck.cost) { const m1 = z.fin.money, e1 = g.estateCost(); if (g.build(b.where, b.k)) fail.push('restore refused'); else { red.restored++; if (z.fin.money !== m1 - ck.cost || g.estateCost() !== e1 + b.cost ) fail.push('restore amounts wrong'); } } } } }
    });
    // (0.17.0) contenders: send, recall and renew now and then; and in year 5 leave the League to found another
    if (HAND && g.nLeagues() > 1 && Math.random() < 0.04) g.inLeague(g.ME(), () => {
      const c = g.sendCands(), to = g.sponTargets();
      if (c.length && to.length && g.contendersOf().length < g.SPON_MAX && S().fin.money >= 0) { const r = g.sendContender(rnd(c.slice(0, 10)).id, rnd(to)); if (r === 'ok') spon.sent++; else if (r === 'later') spon.later++; else if (r === 'refused') spon.refused++; else if (!/turned you down/.test(r)) fail.push('sendContender: ' + r); }
      const mine = g.contendersOf();
      if (mine.length && Math.random() < 0.15) { if (g.recallContender(rnd(mine).id)) spon.recalled++; else fail.push('recall failed'); }
      const rn = mine.find(t => g.canRenew(t)); if (rn && Math.random() < 0.5 && g.renewContender(rn.id)) spon.renewed++;
    });
    if (HAND && !spon.left && S().season === 5 && S().week === 6) {
      const old = g.ME();
      g.inLeague(old, () => { S().prest = g.PRESTIGE_BAR; S().fin.money = Math.max(S().fin.money, g.LEAVE_FEE + 100000); });
      const chk = g.leaveCheck();
      if (chk.ok) { const take = g.leaveTakers().filter(x => x.willing).slice(0, 3).map(x => x.t.id);
        const why = g.leaveLeague(chk.regions[0], take.concat(g.leaveTakers().filter(x => !x.willing).slice(0, 1).map(x => x.t.id)));
        if (why) fail.push('leaveLeague: ' + why);
        else { spon.left++; spon.carried = take.length;
          if (g.ME() === old || !S().founding || !S().founding.mid) fail.push('leaving did not open a founding');
          if (g.inLeague(old, () => S().fin.yr.out.founding) !== g.LEAVE_FEE) fail.push('leaving fee wrong');
          if (!g.inLeague(old, () => g.AIMS[S().fin.aim])) fail.push('the League left has no aim');
          if ((S().vacancies || []).length || (S().chalPending || []).length) fail.push('player state left behind');
          // (0.30.0) only those actually carried: since 0.29.0 anyone a waiting challenge moved out of their post stays behind
          const went = take.filter(id => g.T(id).carried); if (take.length && !went.length) fail.push('nobody was carried');
          for (const id of went) if (!S().founding.cands.includes(id)) fail.push('a carried member is not in the founding pool');
          g.inLeague(g.ME(), () => { g.foundingFill(); g.finishFounding(); });
          for (const id of went) if (g.lgOf(g.T(id)) !== g.ME() || !['leader', 'e4', 'champion', 'gymtrainer'].includes(g.T(id).role)) fail.push('a carried member did not join the new League');
          if (S().founding) fail.push('founding left open'); } }
      else fail.push('could not leave: ' + chk.why);
    }
    // (0.18.0) the red: a rival League forced deep into the red folds at New Year in year 7; the player's own League
    // in year 9 (each needs a third red New Year running, and debts its buildings can't cover); a decay is forced now and then
    let foldWatch = null;
    // (0.33.0) the player renames their League now and then; a rival can't be renamed without the setup option
    if (HAND && !S().founding && Math.random() < 0.01) { const me = g.ME(), nm = 'Test League ' + S().turn, was = g.leagueName(me);
      if (g.renameLeague(me, nm) || g.leagueName(me) !== nm || !g.inLeague(me, () => (S().oldNames || []).some(x => x.name === was))) fail.push('renaming your League');
      const other = g.eachLeague(i => i).find(i => i !== me); if (other != null && !g.renameLeague(other, 'Nope League')) fail.push('a rival was renamed without the option');
      renames++; }
    // (0.42.0) post names: every League's set well-formed, its words real; a rival drawn a theme once it has an aim;
    // the player sets theirs now and then (a theme and a custom name), and a rival's can't be set without the option
    g.eachLeague(i => { const ps = S().postSet;
      if (ps != null && (!g.THEMES[ps.theme] || typeof ps.names !== 'object' || Object.entries(ps.names).some(([k, v]) => !g.POST_KEYS.includes(k) || typeof v !== 'string' || !v || v.length > g.POST_MAX || /[<>&"`\\]/.test(v)))) fail.push('a malformed post set: ' + JSON.stringify(ps));
      if (S().fin && S().fin.aim && !S().founding && !(ps && ps.theme)) fail.push(`rival ${i} has no theme`);
      const w = g.postWords(i); if (g.POST_KEYS.some(k => !w[k] || typeof w[k] !== 'string')) fail.push('a post word missing: ' + JSON.stringify(w));
      if (ps && ps.names) for (const k of g.POST_KEYS) if (ps.names[k] && w[k] !== ps.names[k]) fail.push('a League\'s own post name not used');
      const h = S().history[S().history.length - 1]; if (h && h.season >= 1 && !h.posts) fail.push('a year with no post names'); });
    if (HAND && !S().founding && Math.random() < 0.01) { const me = g.ME(), th = g.THEME_KEYS[Math.floor(Math.random() * g.THEME_KEYS.length)], nm = Math.random() < 0.5 ? { e4: 'Test Four ' + (S().turn % 100) } : {};
      const err = g.setPosts(me, th, nm); if (err) fail.push('setting your posts: ' + err);
      else { const w = g.postWords(me), tw = g.themeWords(th, g.inLeague(me, () => S().region));
        if (nm.e4 && w.e4 !== nm.e4) fail.push('your own Elite Four name not used');
        if (g.POST_KEYS.some(k => !nm[k] && w[k] !== tw[k])) fail.push('a theme word not used: ' + JSON.stringify([th, w, tw])); }
      if (!g.setPosts(me, 'nope', {})) fail.push('a made-up theme was taken');
      if (!g.setPosts(me, th, { leader: 'Bad <b>' })) fail.push('a post name with < was taken');
      const other = g.eachLeague(i => i).find(i => i !== me); if (other != null && !g.setPosts(other, 'dojo', {})) fail.push('a rival\'s posts were set without the option');
      postSets++; }
    // (0.43.0) seat rules: every League's rule well-formed; called challenges and claims only under Protected; a Term
    // appointment only in your League and within its window. The player changes the rule now and then (refused inside
    // the cooldown, prestige taken), changes its timing, lobbies the Council and answers appointments at random
    g.eachLeague(i => { const sr = S().seatRule; if (sr == null) return;
      if (!g.SEAT_RULES[sr.k]) fail.push('a bad seat rule: ' + JSON.stringify(sr));
      if (g.seatSched(sr.k) && !(sr.every >= g.SEAT_EVERY_MIN && sr.every <= g.SEAT_EVERY_MAX)) fail.push('a seat rule timing out of range: ' + JSON.stringify(sr));
      if (sr.pick && (i !== g.ME() || sr.k !== 'term' || sr.pick.due > S().turn + g.TERM_ANSWER)) fail.push('a bad Term appointment: ' + JSON.stringify(sr));
      if (sr.now && sr.k !== 'conqueror') fail.push('an Instant timing on a rule that is not Conqueror: ' + JSON.stringify(sr));
      if (sr.lobby && (sr.k !== 'council' || sr.lobby.n > g.COUNCIL_LOBBY_MAX)) fail.push('a bad lobby: ' + JSON.stringify(sr));
      if (S().fin && S().fin.aim && !g.SEAT_RULES[sr.k]) fail.push('a rival with no seat rule');
      if (i === g.ME() && sr.k !== 'protected' && (S().chalPending || []).some(x => x.k === 'champ' && (x.called || x.from === 'claim'))) fail.push('a called challenge or claim waits under ' + sr.k); });
    if (HAND && !S().founding && Math.random() < 0.01) { const me = g.ME(), k = rnd(g.RULE_KEYS), cur = g.inLeague(me, () => g.seatRuleKey()), blk = g.seatChangeBlock(), p0 = g.inLeague(me, () => S().prest || 0);
      const every = g.SEAT_EVERY_MIN + Math.floor(Math.random() * (g.SEAT_EVERY_MAX - g.SEAT_EVERY_MIN + 1)), now = Math.random() < 0.5, err = g.setSeatRule(k, every, now);
      if (!err && k === 'conqueror' && !!g.inLeague(me, () => S().seatRule.now) !== now) fail.push('the Conqueror timing not set');
      if (k !== cur && blk && !err) fail.push('a seat rule changed inside the cooldown');
      if (!err && k !== cur) { seatSet++; const p1 = g.inLeague(me, () => S().prest || 0); if (Math.abs(p1 - Math.max(0, p0 - g.SEAT_CHANGE_PREST)) > 1e-9) fail.push('the seat rule change cost wrong'); if (g.inLeague(me, () => g.seatRuleKey()) !== k) fail.push('the seat rule did not change'); }
      if (!err && g.seatSched(k) && g.inLeague(me, () => S().seatRule.every) !== every) fail.push('the seat rule timing not set');
      if (!g.setSeatRule('nope', 2)) fail.push('a made-up seat rule was taken'); }
    // (0.46.0) the hand-placed sim switches to an Instant Conqueror in year 3; every instant hand-over puts its winner in the seat
    if (HAND && !S().founding && S().season === 3 && S().week === 1) { const err = g.setSeatRule('conqueror', null, true); if (!err) conqForced++; }
    g.eachLeague(() => { const ev = ((S().league || {}).seatEv || []).filter(e => e.now);
      const last = ev[ev.length - 1]; if (last && last.week === S().week - 1 && last.season === S().season) { conqSeen = Math.max(conqSeen, ev.length); if (S().champion !== last.win && g.T(last.win) && g.T(last.win).role !== 'retired' && S().e4.indexOf(last.win) < 0) fail.push('an instant Conqueror is not in the seat'); } });
    if (HAND && !S().founding && Math.random() < 0.05) g.inLeague(g.ME(), () => { const sr = S().seatRule; if (!sr) return;
      if (sr.pick && Math.random() < 0.5) { const c = rnd(g.termCands()), err = g.termPick(c.id); if (err) fail.push('termPick refused: ' + err); else { seatPicks++; if (S().champion !== c.id) fail.push('the appointed Champion did not take the seat'); } }
      if (sr.k === 'council' && Math.random() < 0.3) { const c = rnd(g.councilCands()); if (c) { const err = g.lobbySeat(c.id); if (!err) seatLobbies++; } } });
    if (HAND && S().week === 47 && ((S().season === 7 && g.nLeagues() > 1) || S().season === 9)) {
      const k = S().season === 7 ? [...Array(g.nLeagues()).keys()].find(i => i !== g.ME()) : g.ME();
      g.inLeague(k, () => { S().fin.money = -50000000; S().fin.redYears = g.FOLD_YEARS - 1; });
      foldWatch = { k, n: g.nLeagues(), mine: k === g.ME(), meName: g.inLeague(g.ME(), () => S().lgName) };
    }
    // (0.19.0) distress offers to the player: a rival's level in a shared city is offered now and then; answer them
    if (HAND && !S().founding && Math.random() < 0.02) { const gm = g.gymMap(), me = g.ME();
      for (let j = 0; j < g.nLeagues(); j++) { if (j === me) continue; const hit = g.inLeague(j, () => { const gi = S().gyms.findIndex(x => (gm[x.city] || []).includes(me) && g.inLeague(j, () => g.topLevels().some(y => y.where === S().gyms.indexOf(x)))); if (gi < 0) return null; const y = g.topLevels().find(t => t.where === gi); const n0 = (S().distress || []).length; g.distressSale(gi, y.k); return (S().distress || []).length > n0; }); if (hit) { red.offered++; break; } } }
    for (const o of S().distress || []) if (o.due - o.at !== g.DISTRESS_OFFER_WEEKS || o.from === g.ME() || !(o.price > 0)) fail.push('a bad distress offer');
    if (HAND && g.distressOffers().length && Math.random() < 0.3) { const offs = g.distressOffers(), o = offs[0];
      if (!o.why && Math.random() < 0.6) { const m0 = g.inLeague(g.ME(), () => S().fin.money), w = g.buyDistress(o.i); if (!w) { red.bought++; if (g.inLeague(g.ME(), () => S().fin.money) !== m0 - o.price) fail.push('distress price wrong'); } else if (m0 >= o.price) fail.push('distress buy refused: ' + w); }
      else { g.declineDistress(o.i); red.declined++; } }
    if (HAND && Math.random() < 0.01) g.inLeague(rnd([...Array(g.nLeagues()).keys()]), () => { const e0 = g.estateCost(); if (e0 && S().fin) { g.decayOne(); if (g.estateCost() >= e0) fail.push('decay took nothing'); else red.decayed++; } });
    // steers (0.12.0): set the League line and posts' steers now and then
    if (HAND && Math.random() < 0.06) g.inLeague(g.ME(), () => { const keys = ['line', 'champion', 'e4:0', 'e4:3', 'gym:0', 'gym:4', 'gym:7']; if (!g.setSteer(rnd(keys), Math.random() < 0.2 ? null : rnd(g.STEER_KEYS))) fail.push('setSteer failed'); steersSet++; });
    // seat challenges (0.11.0): approve some, refuse some, leave the rest to go ahead on their own
    if (HAND && (S().chalPending || []).length && Math.random() < 0.3) { const r = Math.random();
      const x0 = S().chalPending[0];
      if (r < 0.6) { if (!g.answerChallenge(0, true)) fail.push('answerChallenge yes failed'); else if (x0.called) call.fought++; } else { if (!g.answerChallenge(0, false)) fail.push('answerChallenge no failed'); else if (x0.called) call.off++; } }
    // (0.34.0) call a challenge against the player's Champion now and then, and check the limits hold
    if (HAND && !S().founding && Math.random() < 0.02) { const b = g.callBlock(), cs = g.callCands(), ok = cs.filter(c => !c.block), no = cs.find(c => c.block);
      if (no && !g.callChallenge(no.t.id)) fail.push('a blocked call went ahead');
      if (b) { call.blocked++; if (ok.length && !g.callChallenge(ok[0].t.id)) fail.push('a call went ahead past the block: ' + b); }
      else if (ok.length) { const used = g.callsUsed(), c = ok[Math.floor(Math.random() * ok.length)], err = g.callChallenge(c.t.id);
        if (err) fail.push('callChallenge refused: ' + err); else { call.made++; if (g.callsUsed() !== used + 1) fail.push('a call was not counted');
          const x = S().chalPending[S().chalPending.length - 1]; if (!x.called || x.cand !== c.t.id || x.due !== S().turn + g.CALL_WEEKS) fail.push('a malformed called challenge'); } } }
    // (0.52.0) contracts: renew most in their window at a random length (a refusal checked), let some run out, and mark
    // a gym trainer to go now and then
    if (HAND && !S().founding) for (const t of g.conPending()) { if (t.con.seenBy === S().turn) continue; t.con.seenBy = S().turn; if (Math.random() > 0.35) continue;
      if (Math.random() < 0.8) { const len = rnd(g.CON_SENIOR), u0 = t.con.until, pay0 = g.inLeague(g.ME(), () => g.payOf(t)), err = g.renewContract(t.id, len);
        if (t.con.will === 'no' || (t.con.until === u0 && err)) { if (!err) fail.push('renewed someone who refused'); else CTR.refused++; }
        else if (err) fail.push('renewContract refused: ' + err);
        else { CTR.renewed++; if (t.con.until !== u0 + len) fail.push('a renewal of the wrong length'); if (g.inLeague(g.ME(), () => g.payOf(t)) > pay0) CTR.payUp++; if (!g.renewContract(t.id, len)) fail.push('renewed twice'); } }
      else CTR.let++; }
    if (HAND && !S().founding && Math.random() < 0.02) g.inLeague(g.ME(), () => { const gts = g.staffIds().map(g.T).filter(t => t && t.role === 'gymtrainer' && !t.acting && t.con); if (gts.length) { const t = rnd(gts); if (!g.conLetRun(t.id, !t.con.go)) fail.push('conLetRun failed'); else CTR.gtGo++; } });
    const hiredBefore = new Set(Object.values(S().trainers).filter(t => t.hired).map(t => t.id));
    if (HAND && (S().vacancies || []).length && Math.random() < 0.08) { const v = S().vacancies[0], all = g.inLeague(g.ME(), () => g.vacancyCands(v)), c = all.filter(x => !x.refuse), no = all.find(x => x.refuse);
      if (no) { amb.refusedMove++; if (g.fillVacancy(v, no.t.id)) fail.push('a refused vacancy move went ahead'); }
      else if (!g.fillVacancy(v, rnd(c.slice(0, 10)).t.id)) fail.push('fillVacancy refused'); }
    // (0.39.0) team plans: set, clear or take the suggestion now and then; a plan set now is built at once; a planned
    // Pokémon stays on its holder's team through the week unless the plan, the holder or the Pokémon's place changed
    if (HAND && !S().founding && Math.random() < 0.06) g.inLeague(g.ME(), () => { const z = S(); if (!z.ranch) return; g.ranchSync();
      const key = rnd(g.planKeys()), t = g.planHolder(key), q = Math.random();
      if (!t) return;
      let refs;
      if (q < 0.15) refs = [];
      else if (q < 0.3 && (z.plans && z.plans.sugg || {})[key]) { refs = z.plans.sugg[key]; PLAN.sugg++; }
      else { const opts = t.team.filter(m => m.rid == null && !m.stop && !g.isSpecial(m)).map(m => ({ o: m.uid })).concat(z.ranch.mons.map(e => ({ r: e.uid })));
        const ok = opts.filter(r => !g.planResolve(t, r, key).gap), lines = new Set(); refs = [];
        for (const r of ok.sort(() => Math.random() - 0.5)) { const x = g.planResolve(t, r, key), sp = x.m ? x.m.sp : x.sp; if (lines.has(g.LINE[sp])) continue; lines.add(g.LINE[sp]); refs.push(r); if (refs.length >= 1 + Math.floor(Math.random() * 4)) break; }
        if (refs.length && typeof g.setPlan(key, [refs[0], refs[0]]) !== 'object') PLAN.refused++; else if (refs.length) fail.push('a plan naming one Pokémon twice was taken');
        const other = g.planKeys().find(k => k !== key && g.planOf(k) && g.planOf(k).some(r => r.r != null && !g.planResolve(g.planHolder(k), r, k).gap));
        if (other) { const r = g.planOf(other).find(r => r.r != null); if (typeof g.setPlan(key, [r]) === 'object') fail.push('an entry planned for two posts'); else PLAN.refused++; } }
      const r = g.setPlan(key, refs);
      if (typeof r !== 'object') { if (refs.every(x => !g.planResolve(t, x, key).gap) && !/plan for the review/.test(r) && !/You promised/.test(r)) fail.push('setPlan refused: ' + r); return; } // (0.45.0) planResolve doesn't see other posts' waiting plans, which setPlan rightly refuses
      if (!refs.length) PLAN.cleared++; else PLAN.set++;
      if (r.now) { PLAN.now++; const slot = g.eliteSlot(t), room = slot.size - t.team.filter(m => g.isSpecial(m) || (t.mega && t.mega.uid === m.uid)).length;
        if (refs.length && refs.slice(0, room).some(x => !t.team.some(m => (x.o != null && m.uid === x.o) || (x.r != null && m.rid === x.r)))) fail.push('a plan set now was not built on ' + t.name);
        if (t.team.length !== slot.size) fail.push('a plan left ' + t.name + ' with ' + t.team.length); }
      else { PLAN.later++; if (JSON.stringify(g.planNext(key)) !== JSON.stringify(refs)) fail.push('a plan for the review not kept'); } });
    const planSnap = HAND ? g.inLeague(g.ME(), () => g.planKeys().map(key => { const t = g.planHolder(key), on = g.planOf(key); if (!t || !on) return null;
      return { key, id: t.id, plan: JSON.stringify(on), mons: t.team.filter(m => g.isPlanned(t, m)).map(m => m.rid != null ? { r: m.rid } : { o: m.uid }) }; }).filter(Boolean)) : [];
    g.simWeek();
    if (HAND && !S().founding) g.inLeague(g.ME(), () => { const z = S(); if (!z.ranch) return;
      for (const x of planSnap) { const t = g.planHolder(x.key); if (!t || t.id !== x.id || JSON.stringify(g.planOf(x.key)) !== x.plan) continue;
        for (const r of x.mons) { PLAN.checked++; if (g.planResolve(t, r, x.key).gap) continue; if (t.team.some(m => (r.o != null && m.uid === r.o) || (r.r != null && m.rid === r.r))) PLAN.kept++; else fail.push('a planned Pokémon left ' + t.name + "'s team"); } }
      if (z.plans && z.plans.at === S().turn - 1) { PLAN.reviews++;
        if (z.plans.win !== S().turn) fail.push('the review is not open the week after');
        for (const key of g.planKeys()) { const t = g.planHolder(key), on = g.planOf(key); if (!t || !on || (z.plans.seen || {})[key] !== t.id) continue;
          const room = g.eliteSlot(t).size - t.team.filter(m => g.isSpecial(m) || (t.mega && t.mega.uid === m.uid)).length, want = on.filter(r => !g.planResolve(t, r, key).gap).slice(0, room);
          if (want.some(r => !t.team.some(m => (r.o != null && m.uid === r.o) || (r.r != null && m.rid === r.r)))) fail.push('the review did not build ' + t.name + "'s plan"); } }
      PLAN.benched = Math.max(PLAN.benched, z.ranch.mons.filter(e => e.bench != null).length);
      PLAN.restless = Math.max(PLAN.restless, g.seniorIds().filter(id => (g.T(id).benchQ || 0) >= g.BENCH_QUARTERS).length); });
    // only your League plans; plans name real posts, at most PLAN_MAX each, no entry in two posts' plans
    g.eachLeague(i => { const z = S(); if (!z.plans) return; if (i !== g.ME() && Object.keys(z.plans.posts).length) fail.push('a rival League with team plans');
      const seen = new Set(); for (const [k, p] of Object.entries(z.plans.posts)) { if (!/^(champion|e4:[0-3]|gym:[0-7])$/.test(k)) fail.push('a plan for no post: ' + k);
        for (const list of [p.on, p.next]) if (list && list.length > g.PLAN_MAX) fail.push('a plan of ' + list.length);
        for (const r of p.on || []) if (r.r != null) { if (seen.has(r.r)) fail.push('an entry in two plans'); seen.add(r.r); } } });
    if (foldWatch) {
      if (g.nLeagues() !== foldWatch.n - (foldWatch.mine ? 0 : 1)) fail.push('a League forced into the red did not fold');
      else if (foldWatch.mine) { red.myFold++;
        if (!S().founding || !S().founding.mid) fail.push('the player\'s fold opened no founding');
        // (0.19.0) the fresh League's region can be chosen before it opens
        { const rs = g.foldRegions(), cur = g.inLeague(g.ME(), () => S().region), to = rs.find(r => r !== cur);
          if (!rs.includes(cur)) fail.push('the fold region list leaves out the old region');
          if (to != null) { if (g.foldRegion(to)) fail.push('foldRegion refused'); else { red.moved++; g.inLeague(g.ME(), () => { if (S().region !== to || S().gyms.some(x => S().cities[x.city].region !== to)) fail.push('the fresh League did not move region'); }); } } }
        g.inLeague(g.ME(), () => { if (S().fin.money !== g.START_FUND || (S().prest || 0) !== 0) fail.push('the fresh League did not start fresh'); g.foundingFill(); g.finishFounding(); });
        if (S().founding) fail.push('founding left open after a fold'); }
      else { red.folded++; if (g.inLeague(g.ME(), () => S().lgName) !== foldWatch.meName) fail.push('the player\'s League changed when a rival folded'); }
      if (!(S().folded || []).length) fail.push('no record of the folded League');
      // (0.19.0) a folded League's titles still count toward the Triple Crown
      if (g.nLeagues() > 1) for (const t of Object.values(S().trainers)) if ((t.titleLgs || []).some(x => x < 0) && ![...g.champLeaguesOf(t)].some(x => x < 0)) { fail.push('a folded League\'s title dropped out of the Triple Crown'); break; }
    }
    g.eachLeague(() => { if (S().fin && S().fin.money < 0 && S().week === 0) red.lapsedYears++; });
    for (const id of hiredBefore) { const t = g.T(id); if (t && !t.hired && t.role !== 'challenger') offers.arrived++; }
    if (S().stop) stops[S().stop.why] = (stops[S().stop.why] || 0) + 1;
    check('step');
  }
  if (guard >= 400) fail.push('stuck in year ' + S().season);
  { const hs = S().history, first = hs.length ? hs[0].season : S().season; if (hs.length !== S().season - first || (hs.length && hs[hs.length - 1].season !== S().season - 1)) fail.push('history has ' + hs.length + ' years at the start of year ' + S().season); }
  // the year report's detail (0.8.0), in every League
  g.eachLeague(li => { const x = S().history[S().history.length - 1]; if (!x) return; const tag = 'year report L' + li + ' Y' + x.season + ': ';
    if (!x.gyms || x.gyms.length !== 8 || !x.seats || x.seats.length !== 5 || !x.top || !x.runsE4) { fail.push(tag + 'detail missing'); return; }
    x.gyms.forEach((gd, k) => { const gh = (S().gyms[k].hist || []).find(y => y.season === x.season);
      if (!gh || gh.w !== gd.wl + gd.wt || gh.l !== gd.l) fail.push(tag + 'gym ' + k + ' counts differ');
      if (!gd.lead.includes(gd.leader)) fail.push(tag + 'gym ' + k + ' year-end leader not among its leaders');
      if (Object.values(gd.by).reduce((a, n) => a + n, 0) !== gd.wl + gd.wt) fail.push(tag + 'gym ' + k + ' tries by holder differ'); });
    if (x.runsE4.length !== x.qualifiers || x.seats[0].faced !== x.qualifiers) fail.push(tag + 'Elite Four runs differ');
    if (x.seats.reduce((a, st) => a + st.stopped, 0) + x.titles !== x.qualifiers) fail.push(tag + 'seats stopped plus titles differ from runs');
    x.seats.forEach((st, k) => { if (!st.held.includes(st.id)) fail.push(tag + 'seat ' + k + ' holder not among its holders'); });
    { const ch = x.chal || [];
      if (ch.filter(c => c.k === 'champ' && !c.called).length > 1 || ch.filter(c => c.k === 'e4').length > 1) fail.push(tag + 'more than one challenge of a kind');
      if (ch.filter(c => c.called).length > g.CALL_MAX) fail.push(tag + 'more called challenges than allowed');
      if (!(S().myLeagues || [{ lg: 0 }]).some(m => m.lg === li) && ch.some(c => c.called)) fail.push(tag + 'a called challenge in a rival League');
      if (HAND && li === g.ME() && x.season > 1 && ch.some(c => c.k === 'champ' && !c.called && c.from !== 'claim')) fail.push(tag + 'an uncalled challenge for the player\'s Champion');
      if (!(S().myLeagues || [{ lg: 0 }]).some(m => m.lg === li) && ch.some(c => c.refused && c.from !== 'claim')) fail.push(tag + 'a rival League refused a challenge');
      if (ch.some(c => c.from === 'claim' && c.k !== 'champ')) fail.push(tag + 'a title claim not for the Champion');
      }
    if (x.top.length > 10 || x.top.some((r, k) => k && r[1] > x.top[k - 1][1]) || (x.titles && x.top[0][1] !== 13)) fail.push(tag + 'top ten wrong'); });
  check('s' + S().season);
}
// a reloaded save keeps running
{ const copy = JSON.parse(JSON.stringify(S())); g.S = copy; g.applyDex(copy.cfg && copy.cfg.dex); g.applyCfg(); g.simYear(); check('reload'); if (g.simWeeks(60, true) == null) fail.push('60 weeks without a stop for New Year'); check('stops'); }
g.eachLeague(() => { for (const n of S().news) { const m = /^Champion .* (stepped down|left the seat) and (is off on another run|heads for|returns|retired|takes)/.exec(n.text); if (m) { call.champLeft++; if (m[1] === 'stepped down') call.champStep++; else if (m[2] === 'is off on another run') call.champRun++; else call.champUp++; } }
  for (const x of S().history) for (const c of x.chal || []) if (c.called && c.won) call.won++; });
g.eachLeague(() => { for (const x of S().history) for (const c of x.chal || []) { chal.n++; if (c.won) chal.won++; if (c.refused) chal.refused++; if (c.lapsed) chal.lapsed++; if (c.k === 'champ') chal.champ++; if (c.from === 'leader') chal.leader++; if (c.from === 'circuit') chal.circuit++; if (c.from === 'claim') { chal.claims++; if (c.won) chal.claimWon++; if (c.refused) chal.claimNo++; if (c.offered) chal.claimPost++; } } });
const h = S().history;
console.log(fail.length ? 'FAIL ' + [...new Set(fail)].slice(0, 8).join(' | ') : 'ok', 'leagues', g.nLeagues(), 'year', S().season, 'trainers', Object.keys(S().trainers).length, 'cities', Object.keys(S().cities).length,
  'Elite Four runs/year', (h.reduce((a, x) => a + x.qualifiers, 0) / Math.max(1, h.length)).toFixed(1), 'perfect years', Math.round(h.filter(x => !x.titles).length / Math.max(1, h.length) * 100) + '%', 'badges conceded/year', (h.reduce((a, x) => a + x.badges, 0) / Math.max(1, h.length)).toFixed(1),
  'runs/year', (h.reduce((a, x) => a + x.runs, 0) / Math.max(1, h.length)).toFixed(0), 'field avg', (fieldSum / Math.max(1, fieldN)).toFixed(1), 'max', fieldMax, 'stops', JSON.stringify(stops), 'god edits', gods, 'vacancies', hands, 'open', (S().vacancies || []).length, 'moves', JSON.stringify(moves), 'offers', JSON.stringify(offers), 'back from retirement', Object.values(S().trainers).filter(t => t.unretired).length, 'replaced', Object.values(S().trainers).filter(t => t.letGoAt != null).length,
  'ambitions', JSON.stringify(Object.values(S().trainers).filter(t => t.wish && ['leader', 'gymtrainer', 'e4'].includes(t.role)).reduce((a, t) => (a[t.wish.k] = (a[t.wish.k] || 0) + 1, a), {})),
  'notices', amb.quit.size, 'asked for a run', amb.asked.size, 'comebacks', Object.values(S().trainers).filter(t => (t.comebacks || []).length).length, 'grudges', Object.values(S().trainers).filter(t => t.grudge != null).length,
  'refused', amb.refusedSwap + '/' + amb.refusedMove, 'seat challenges', JSON.stringify(chal), 'calls', JSON.stringify(call), 'steers set', steersSet, 'steered posts', g.eachLeague(() => Object.keys((S().steer || {}).posts || {}).length).join('/'), 'off-type', g.eachLeague(() => g.staffIds().map(g.T).filter(t => t.team.some(m => m.offType)).length).join('/'), 'trend', (S().metaTrend || []).join(','), ...(HAND ? ['money', g.money(S().fin.money), 'wages/wk', g.wageBill(), JSON.stringify(money), 'ledger', JSON.stringify(S().fin.last || S().fin.yr)] : []));
console.log('seat rules', g.eachLeague(i => `${S().lgName}: ${g.seatRuleName(g.seatRuleKey())}${S().seatRule && S().seatRule.every ? ' every ' + S().seatRule.every : ''}`).join('; '), JSON.stringify(g.SEAT_LOG), 'set by hand', seatSet, 'appointed', seatPicks, 'lobbied', seatLobbies, 'instant forced', conqForced, 'instant seen', conqSeen);
console.log('themes', g.eachLeague(i => `${S().lgName}: ${g.themeOf(i).name} (${Object.values(g.postWords(i)).join('/')})`).join('; '), 'drawn', g.THEME_LOG.picked, 'rebrands', g.THEME_LOG.rebrands, 'set by hand', postSets);
console.log('world', 'founders', Object.values(S().trainers).filter(t => t.founded).map(t => t.name + (t.founded.champ ? ' (Champion)' : '')).join(', ') || 'none', 'Leagues', g.eachLeague(() => S().lgName).join(', '), 'folded', (S().folded || []).map(f => f.name).join(', ') || 'none', 'renames', renames, 'shared cities', Object.values(g.gymMap()).filter(x => x.length > 1).length);
LEG.sanct = 0; g.eachLeague(() => { for (const p of g.myPlaces()) LEG.sanct += (p.b.find(x => x.k === 'sanct') || { lv: 0 }).lv; });
console.log('legendaries', JSON.stringify(LEG));
{ // (0.32.0) gyms in any order: how often a challenger's badges came out of number order, and gyms held by stage
  const sb = [[0, 0], [0, 0], [0, 0]], perGym = Array(8).fill(0);
  g.eachLeague(() => { for (const h of S().history) for (const [k, gy] of (h.gyms || []).entries()) { if (!gy) continue; perGym[k] += (gy.wl || 0) + (gy.wt || 0) + (gy.l || 0); for (let b = 0; b < 3; b++) { const x = (gy.sb || [])[b]; if (x) { sb[b][0] += x[0]; sb[b][1] += x[1]; } } } });
  if (anyOrder.noAim) fail.push('challengers on a run with no gym chosen: ' + anyOrder.noAim);
  console.log('any order', 'out of number order', (100 * anyOrder.outOfOrder / Math.max(1, anyOrder.out)).toFixed(0) + '%', 'held early/mid/late', sb.map(x => x[0] ? Math.round(100 * x[1] / x[0]) + '% of ' + x[0] : '—').join(' · '), 'tries by gym', perGym.join('/'));
}
console.log('hall and memory', 'Hall entries', (S().hof || []).length, 'Hall of Famers', new Set((S().hof || []).map(e => e.id)).size, 'repeat winners', Object.values(S().trainers).filter(t => (t.hofN || 0) > 1).length, 'memories now', g.eachLeague(() => Object.values(S().gmem || {}).reduce((a, x) => a + Object.keys(x).length, 0)).join('/'), 'avg memories a week', (MEM.n / Math.max(1, fieldN)).toFixed(1));
console.log('conditions', JSON.stringify(CON));
console.log('contracts', JSON.stringify(CTR), JSON.stringify(g.CON_LOG));
console.log('talks', JSON.stringify(TALKS), JSON.stringify(g.TALK_LOG));
console.log('talks by aim', JSON.stringify(g.TALK_AIM_LOG), 'tempers', JSON.stringify(Array.from({ length: g.nLeagues() }, (_, i) => g.inLeague(i, () => S().fin ? (S().fin.aim || 'you') + ':' + S().fin.temper : '-'))));
console.log('team plans', JSON.stringify(PLAN));
console.log('ranch part 3', JSON.stringify(PART3), 'storage', JSON.stringify(g.STORE_LOG), 'vault', JSON.stringify(g.VAULT_LOG));
console.log('ranch', JSON.stringify(RAN), g.eachLeague(i => { const R = S().ranch; if (!R) return `L${i} none`; g.ranchSync(); const sen = g.seniorIds().map(g.T), held = sen.reduce((a, t) => a + t.team.filter(m => m.rid != null).length, 0), st = sen.reduce((a, t) => a + t.team.filter(m => m.stop).length, 0);
console.log('backup types', JSON.stringify(backupStat));
  return `L${i} ${R.mons.length}/${g.ranchCap()} held ${held} stopgaps ${st} upkeep ${g.ranchUpkeep()}/wk grades ${[1, 2, 3, 4, 5].map(k => R.mons.filter(e => e.g === k).length).join(',')}`; }).join(' | '));
console.log('safari', JSON.stringify(SAF), JSON.stringify(g.SAFARI_LOG));
console.log('breeding', JSON.stringify(BRD), JSON.stringify(g.BREED_LOG));
console.log('regions', JSON.stringify(REG), 'moves', g.REGION_LOG.moves, 'released on moving', g.REGION_LOG.released, 'species a region', g.regionLines().size.join('/'), 'lines', g.regionLines().sets.map(x => x.size).join('/'));
console.log('city control', JSON.stringify(ctrlStats), 'tiers', g.TIER_NAMES.join('/'));
console.log('regional field', JSON.stringify(fieldStats), 'draws', JSON.stringify(g.FIELD_LOG), 'rebuild', JSON.stringify(g.REBUILD_LOG), 'regions', [...new Set(g.eachLeague(() => g.S.region))].map(r => `${g.LEAGUE_SETS[r].name}: ${g.fieldSize(r)} of ${g.fieldTarget(r)} (${g.regionLgs(r).map(i => g.inLeague(i, () => g.S.challengers.length)).join('/')})`).join('; '));
console.log('the red', JSON.stringify(red), 'folded', (S().folded || []).map(f => f.name).join(', ') || 'none');
console.log('stage 5', JSON.stringify(spon), 'player League', g.ME(), 'prestige', g.eachLeague(() => Math.round(S().prest || 0)).join('/'), 'contenders', JSON.stringify(g.eachLeague(i => g.contendersOf(i).length)), 'bounties', g.eachLeague(() => S().fin && S().fin.last ? (S().fin.last.in.bounties || 0) - (S().fin.last.out.bounties || 0) : 0).join('/'));
console.log('prestige gating', 'senior OVR at founding', PG.start.join('/'), 'famous at founding', PG.famous, 'now: prestige', g.eachLeague(() => Math.round(S().prest || 0)).join('/'), 'Champion OVR', g.eachLeague(() => g.ovr(g.T(S().champion))).join('/'), 'senior OVR', g.eachLeague(() => { const ids = [S().champion, ...S().e4, ...S().gyms.map(x => x.leader)].filter(x => x != null); return Math.round(ids.reduce((a, id) => a + g.ovr(g.T(id)), 0) / ids.length); }).join('/'));
// a trainer below a League's prestige minimum never accepts its offer, and rival hiring never picks one
g.eachLeague(i => { const blocked = g.challengers().filter(t => t && !g.willSign(t)); for (const t of blocked.slice(0, 5)) if (g.acceptsOffer(t, 'leader')) { console.log('FAIL a blocked trainer accepted an offer'); process.exitCode = 1; }
  if (i !== g.ME()) { const c = g.rivalHire(0, [], 'leader'); if (c && !g.willSign(c)) { console.log('FAIL rival hiring picked a blocked trainer'); process.exitCode = 1; } if (c) c.bidMul = null; PG.blocked = (PG.blocked || 0) + blocked.length; } });
console.log('prestige gating', 'blocked on rival circuits', PG.blocked || 0, 'blocked offers tried by hand', PGH.blocked);
if (PG.famous) { console.log('FAIL a famous trainer on a founding staff'); process.exitCode = 1; }
if (PG.start.some(x => x > 64)) { console.log('FAIL a founding staff far above the founding pool'); process.exitCode = 1; }
// (0.24.0) growth: every trainer knows when their career began, potential never below OVR, and OVR by age band
{ let bad = 0; const band = {}; for (const t of Object.values(S().trainers)) { if (t.start == null || t.start > t.age || t.pot < g.ovr(t)) bad++;
    if (t.role === 'retired') continue; const k = t.age <= 20 ? '≤20' : t.age <= 28 ? '21-28' : t.age <= 35 ? '29-35' : t.age <= 45 ? '36-45' : '46+'; (band[k] = band[k] || []).push(g.ovr(t)); }
  if (bad) { console.log('FAIL', bad, 'trainers with no career start or potential below OVR'); process.exitCode = 1; }
  console.log('growth', 'OVR by age', Object.entries(band).map(([k, v]) => `${k} ${Math.round(v.reduce((a, b) => a + b, 0) / v.length)} (${v.length})`).join(', ')); }
console.log('books', g.eachLeague(i => `L${i} ${S().fin ? (S().fin.aim || 'player') + ' ' + g.money(S().fin.money) + ' wages ' + g.wageBill() + '/wk' : 'none'}`).join(' | '));
process.exit(fail.length ? 1 : 0);
