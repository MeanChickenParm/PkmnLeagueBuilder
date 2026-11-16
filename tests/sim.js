// invariants sim: node tests/sim.js <leagues> <growth 0/1> <years> [god 0/1]
// Sims whole years week by week and checks the world stays consistent after every week.
const g = require(require('path').join(__dirname, '..', 'dist', 'engine-node.js'));
// HAND (0.6.0): League 0 is founded by hand (best available), staff are made to leave, and vacancies wait with acting
// holders until they are filled
const [L, G, N, GOD, HAND] = process.argv.slice(2).map(Number);
g.newWorld({ leagues: L || 1, growth: !!G, god: !!GOD, hand: !!HAND });
if (HAND) { if (!g.S.founding || g.foundPool().length < 60) { console.log('FAIL no founding pool'); process.exit(1); } g.foundPlace('gym', 3, g.foundPool()[0]); g.foundingFill(); if (g.foundPlaced().length !== 13) { console.log('FAIL fill left posts empty'); process.exit(1); } g.finishFounding(); }
const S = () => g.S, fail = [];
const moves = { let: 0, swap: 0, gt: 0 }, offers = { now: 0, later: 0, refused: 0, cool: 0, withdrawn: 0, arrived: 0 };
const amb = { refusedSwap: 0, refusedMove: 0, asked: new Set(), quit: new Set() };
const money = { built: 0, bans: 0, raises: 0, moved: 0 };
const chal = { n: 0, champ: 0, leader: 0, circuit: 0, won: 0, refused: 0, lapsed: 0 };
const spon = { sent: 0, later: 0, refused: 0, recalled: 0, renewed: 0, left: 0, carried: 0 };
const red = { sold: 0, restored: 0, decayed: 0, folded: 0, myFold: 0, moved: 0, offered: 0, bought: 0, declined: 0, lapsedYears: 0 };
let steersSet = 0, hands = 0, gods = 0, fieldSum = 0, fieldN = 0, fieldMax = 0, stops = {};
function check(tag) {
  const s = S(), bad = m => fail.push(tag + ' ' + m);
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
      if (L.team.length !== g.GYM_SIZE[j] - (act ? 1 : 0)) bad('gym ' + j + ' leader fields ' + L.team.length);
      for (const m of L.team) if (L.specialty && !g.isSpecial(m) && !m.offType && !g.specFit(L, m.sp) && !(m.met && ['starter', 'caught'].includes(m.met.how))) bad('gym ' + j + ' leader ' + g.typeLabel(L) + ' fields off-type ' + m.sp);
      if (gts.length !== g.GYM_TRAINERS - (act ? 1 : 0)) bad('gym ' + j + ' has ' + gts.length + ' gym trainers' + (act ? ' (acting)' : ''));
      for (const id of gts) { const t = g.T(id);
        if (!t || t.role !== 'gymtrainer' || g.lgOf(t) !== i) { bad('gym ' + j + ' trainer is wrong'); continue; }
        if (!act && !g.gymFits(t, L)) bad('gym ' + j + ' trainer type ' + g.typeLabel(t) + ' in a ' + g.typeLabel(L) + ' gym');
        for (const m of t.team) if (t.specialty && !g.isSpecial(m) && !m.offType && !g.specFit(t, m.sp)) bad('gym ' + j + ' trainer ' + g.typeLabel(t) + ' fields off-type ' + m.sp);
        if (t.team.length !== g.GYM_SIZE[j] - 1) bad('gym ' + j + ' trainer fields ' + t.team.length + ' L' + i + ' ' + JSON.stringify((t.posts || []).slice(-3)) + ' cb ' + JSON.stringify(t.comebacks || []) + ' un ' + t.unretired);
        staff.add(id); } });
    for (const id of [...z.e4, z.champion]) if (g.T(id) && g.T(id).team.length !== g.E4_SIZE) bad('Elite team of ' + g.T(id).team.length);
    if (g.T(z.champion) && g.T(z.champion).acting) bad('an acting Champion');
    // steers and the meta (0.12.0): valid steers, at most one off-type Pokémon a team, readings of five at most
    { const st = z.steer || { line: 'bal', posts: {} };
      if (!g.STEERS[st.line]) bad('League ' + i + ' line steer ' + st.line);
      for (const [k, v] of Object.entries(st.posts || {})) { if (!g.STEERS[v]) bad('steer ' + v + ' on ' + k); if (!/^(champion|e4:[0-3]|gym:[0-7])$/.test(k)) bad('steer on unknown post ' + k); }
      if ((z.metaTrend || []).length > 5 || (z.metaYear || []).length > 5) bad('a meta reading of more than five');
      for (const id of [z.champion, ...z.e4, ...z.gyms.flatMap(x => [x.leader, ...(x.trainers || [])])]) { const t = g.T(id); if (t && t.team.filter(m => m.offType).length > 1) bad('two off-type Pokémon on ' + t.name); }
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
      if (!t.wish || !['up', 'stay', 'run'].includes(t.wish.k)) { bad('no ambition: ' + t.name + ' ' + t.role); continue; }
      if (t.role === 'champion' && t.wish.k !== 'stay') bad('a Champion wants ' + t.wish.k);
      if (t.quit && (t.quit.at < s.turn || t.quit.at - s.turn > g.RUN_HOLD)) bad('a notice out of range: ' + t.name);
      if (t.quit && t.stepDown != null) bad('leaving and stepping down at once: ' + t.name);
      if (t.quit) amb.quit.add(t.id);
      if (t.wish.k === 'run' && t.wish.asked != null) { amb.asked.add(t.id); if (s.turn - t.wish.asked > g.RUN_HOLD) bad('held past a year: ' + t.name); }
      if (g.ambClock(t) && t.stepDown == null && !t.quit && s.turn > g.ambDue(t) + 1) bad('promotion overdue with no notice: ' + t.name + ' ' + t.role); }
    // seat challenges (0.11.0): only the player's League keeps challenges waiting for an answer, each within its
    // answer window and naming people still on the books; kept challenge battles stay capped
    if ((z.seatLogs || []).length > g.SEAT_LOGS) bad('too many kept seat challenges');
    if (i === g.ME()) for (const x of s.chalPending || []) { if (!HAND) bad('a challenge waits in a League nobody staffs by hand');
      if (x.due < s.turn || x.due - s.turn > g.CHAL_ANSWER) bad('a challenge waits out of range');
      if (!g.T(x.cand) || !g.T(x.inc) || !['champ', 'e4'].includes(x.k)) bad('a malformed challenge'); }
    if (i !== g.ME() && (z.gyms.some(x => x.acting) || z.e4.some(id => g.T(id) && g.T(id).acting))) bad('a vacancy in a League not staffed by hand');
    // challengers: tries, gym trainers beaten, and Pokémon standing at the level of their next battle
    for (const id of z.challengers) { const t = g.T(id); if (!t || t.role !== 'challenger') continue;
      if ((t.gymTries || 0) > g.GYM_TRIES || (t.gymStage || 0) > g.GYM_TRAINERS) bad('tries or stage out of range for ' + t.name);
      // the continuous world: a challenger is either resting (with a date to set out again) or out on a run
      if (t.out != null) bad('the season out flag is back for ' + t.name);
      if (t.rest == null && t.runStart == null) bad('neither resting nor on a run: ' + t.name);
      if (t.rest != null && !(t.rest >= s.turn - 1 && t.rest <= s.turn + 14)) bad('rest date out of range for ' + t.name + ': ' + (t.rest - s.turn));
      if (t.rest == null && (t.gymTries || 0) >= g.GYM_TRIES) bad('still on a run after three losses: ' + t.name);
      if (t.rest == null && s.turn - t.runStart > 3 * g.YEAR_WEEKS) bad('a run of over three years: ' + t.name);
      if (t.rest == null && t.weekLog.length && t.weekLog[t.weekLog.length - 1].wk === s.week && t.team.some(m => m.lvl !== g.challengerLevel(t) && !(m.met && m.met.season === s.season && m.met.week >= s.week))) bad('team not at the set level for ' + t.name); }
    if (z.league && (z.league.season !== s.season || z.league.dethroned || z.league.e4Shot)) bad('the year record is wrong');
    if (z.league && z.league.conceded.length !== z.league.entries.filter(e => e.stage === 5).length) bad('titles conceded and title wins disagree');
    z.e4.forEach(id => { const t = g.T(id); if (!t || t.role !== 'e4') bad('Elite Four seat is wrong'); });
    { const t = g.T(z.champion); if (!t || t.role !== 'champion') bad('Champion is wrong'); }
    // no cap on a circuit, but weak challengers giving up should keep the field in a sensible range (0.5.0: an older,
    // larger field, about 50 to 75 a League; 160 is the alarm since 0.7.0: several-League worlds peaked at 122 to 147 even at 0.6.0)
    if (z.challengers.length > 160) bad('field too big: ' + z.challengers.length);
    if (z.challengers.length < 8) bad('field too thin: ' + z.challengers.length);
    fieldSum += z.challengers.length; fieldN++; fieldMax = Math.max(fieldMax, z.challengers.length);
    for (const id of z.challengers) { const t = g.T(id);
      if (!t || t.role !== 'challenger') bad('circuit lists a non-challenger ' + id); else if (g.lgOf(t) !== i) bad('challenger tagged for another League ' + t.name);
      if (seen[id] != null) bad('trainer on two circuits ' + id); seen[id] = i;
      if (t && (!t.team.length || t.team.length > 6)) bad('team size ' + t.team.length + ' for ' + t.name); }
  });
  if (Object.keys(s.cities).length % 11) bad('city count ' + Object.keys(s.cities).length);
  // money and cities (0.13.0; every League since 0.15.0): books, pay, bans and buildings; rivals have an aim
  if (!s.founding) g.eachLeague(i => { const z = S(), mine = HAND && i === g.ME();
    if (!z.fin || !Number.isFinite(z.fin.money) || Math.round(z.fin.money) !== z.fin.money) bad('books broken in League ' + i);
    if (mine ? z.fin.aim != null : !g.AIMS[z.fin.aim]) bad('aim wrong in League ' + i + ': ' + z.fin.aim);
    for (const id of g.staffIds()) { const t = g.T(id); if (t && !(t.payOvr > 0)) bad('staff with no pay ' + t.name); if (t && t.quit && t.quit.k === 'pay' && z.fin.money >= 0 && z.fin.redAt == null) bad('a pay notice out of the red'); }
    if (g.paidBans().length > g.BAN_PAID_MAX) bad('too many paid bans');
    if ((z.banBallot || null) && z.banBallot.cands && z.banBallot.cands.length) bad('a ban vote in a League with books');
    for (const p of g.myPlaces()) { if (g.slotsUsed(p.b) > p.slots) bad('more buildings than slots in ' + p.name); for (const x of p.b) if (!(x.lv >= 1 && x.lv <= g.upMax(x.k)) || !g.UPGRADES[x.k] || (g.UPGRADES[x.k].seat && !p.seat)) bad('bad building in ' + p.name); if (p.none && p.b.length) bad('buildings left where the League has no gym: ' + p.name); }
    if (new Set(z.gyms.map(x => x.city)).size !== 8) bad('two gyms of one League in one city');
  });
  // (0.15.0) at most two Leagues a region; standing only for Leagues with a gym in the city; control by one of them
  { const regs = g.eachLeague(() => S().region), gm = g.gymMap(); for (const r of new Set(regs)) if (regs.filter(x => x === r).length > 2) bad('three Leagues in one region');
    for (const c of Object.values(s.cities)) { const lgs = gm[c.id] || []; for (const k of Object.keys(c.st || {})) if (!lgs.includes(+k) && tag.startsWith('s')) {} if (lgs.length && !lgs.includes(g.cityCtrl(c, lgs))) bad('city controlled by a League with no gym there: ' + c.name); } }
  for (const t of Object.values(s.trainers)) {
    if (t.role === 'challenger' && seen[t.id] == null) bad('challenger on no circuit ' + t.name);
    if (t.role === 'free' && !s.freeAgents.includes(t.id)) bad('free agent not listed ' + t.name);
    if (t.role === 'free') bad('a free agent was left without a circuit: ' + t.name);
    if (t.role === 'gymtrainer' && !staff.has(t.id)) bad('gym trainer at no gym ' + t.name);
    if (t.role === 'exchamp') bad('a dethroned Champion: ' + t.name);
    for (const k of ['org', 'user', 'slot', 'prole', 'trust', 'amb', 'promise']) if (t[k] != null && t[k] !== false) bad('cut trainer field is back: ' + k);
    for (const m of t.team || []) for (const k of ['shadow', 'pkrs', 'lucky', 'loan', 'sulk', 'ranch']) if (m[k] != null) bad('cut Pokémon field is back: ' + k);
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
    // staffing at will (0.7.0): let staff go, swap them, and place gym trainers by hand, now and then
    if (HAND && S().season >= 2) g.inLeague(g.ME(), () => {
      const z = S(), seniors = [...z.e4, ...z.gyms.map(x => x.leader)].map(g.T).filter(t => t && !t.acting);
      if (g.releaseStaff(z.champion)) fail.push('the Champion was let go');
      if (Math.random() < 0.04 && seniors.length) { const t = rnd(seniors.concat((z.gyms[rnd([0, 1, 2, 3, 4, 5, 6, 7])].trainers || []).map(g.T).filter(Boolean)));
        const r = g.releaseStaff(t.id); if (!r) fail.push('releaseStaff refused ' + t.role); else { moves.let++; if (!['challenger', 'retired'].includes(t.role)) fail.push('let go but role ' + t.role); } }
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
      if ((z.vacancies || []).length && Math.random() < 0.1) { const v = rnd(z.vacancies), c = g.vacancyCands(v).filter(x => x.from === 'circuit' && g.canOffer(x.t) && x.t.id !== v.incoming); if (c.length) tally(g.hireForVacancy(v, rnd(c.slice(0, 12)).t.id, rnd(g.BIDS))); }
      if (Math.random() < 0.05) { const i = rnd([0, 1, 2, 3, 4, 5, 6, 7]), gy = z.gyms[i], k = (gy.trainers || []).findIndex(x => x != null);
        if (Math.random() < 0.5) g.gymOutsiders(i);
        const c = g.gymTrainerCands(i).filter(x => ['circuit', 'outsider', 'retired'].includes(x.from) && (x.from !== 'circuit' || g.canOffer(x.t)));
        if (k >= 0 && c.length) tally(g.hireForGymTrainer(i, k, rnd(c.slice(0, 8)).t.id)); }
      if (Math.random() < 0.01) { const h = Object.values(z.trainers).find(t => t.hired); if (h && g.withdrawOffer(h.id)) offers.withdrawn++; }
    });
    // money and cities (0.13.0): build, ban, give raises and move gyms now and then
    if (HAND && S().season >= 2 && Math.random() < 0.05) g.inLeague(g.ME(), () => { const z = S(), r = Math.random();
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
          for (const id of take) if (!S().founding.cands.includes(id)) fail.push('a carried member is not in the founding pool');
          g.inLeague(g.ME(), () => { g.foundingFill(); g.finishFounding(); });
          for (const id of take) if (g.lgOf(g.T(id)) !== g.ME() || !['leader', 'e4', 'champion', 'gymtrainer'].includes(g.T(id).role)) fail.push('a carried member did not join the new League');
          if (S().founding) fail.push('founding left open'); } }
      else fail.push('could not leave: ' + chk.why);
    }
    // (0.18.0) the red: a rival League forced deep into the red folds at New Year in year 7; the player's own League
    // in year 9 (each needs a third red New Year running, and debts its buildings can't cover); a decay is forced now and then
    let foldWatch = null;
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
      if (r < 0.6) { if (!g.answerChallenge(0, true)) fail.push('answerChallenge yes failed'); } else if (!g.answerChallenge(0, false)) fail.push('answerChallenge no failed'); }
    const hiredBefore = new Set(Object.values(S().trainers).filter(t => t.hired).map(t => t.id));
    if (HAND && (S().vacancies || []).length && Math.random() < 0.08) { const v = S().vacancies[0], all = g.inLeague(g.ME(), () => g.vacancyCands(v)), c = all.filter(x => !x.refuse), no = all.find(x => x.refuse);
      if (no) { amb.refusedMove++; if (g.fillVacancy(v, no.t.id)) fail.push('a refused vacancy move went ahead'); }
      else if (!g.fillVacancy(v, rnd(c.slice(0, 10)).t.id)) fail.push('fillVacancy refused'); }
    g.simWeek();
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
      if (ch.filter(c => c.k === 'champ').length > 1 || ch.filter(c => c.k === 'e4').length > 1) fail.push(tag + 'more than one challenge of a kind');
      if (!(S().myLeagues || [{ lg: 0 }]).some(m => m.lg === li) && ch.some(c => c.refused)) fail.push(tag + 'a rival League refused a challenge');
      }
    if (x.top.length > 10 || x.top.some((r, k) => k && r[1] > x.top[k - 1][1]) || (x.titles && x.top[0][1] !== 13)) fail.push(tag + 'top ten wrong'); });
  check('s' + S().season);
}
// a reloaded save keeps running
{ const copy = JSON.parse(JSON.stringify(S())); g.S = copy; g.applyDex(copy.cfg && copy.cfg.dex); g.applyCfg(); g.simYear(); check('reload'); if (g.simWeeks(60, true) == null) fail.push('60 weeks without a stop for New Year'); check('stops'); }
g.eachLeague(() => { for (const x of S().history) for (const c of x.chal || []) { chal.n++; if (c.won) chal.won++; if (c.refused) chal.refused++; if (c.lapsed) chal.lapsed++; if (c.k === 'champ') chal.champ++; if (c.from === 'leader') chal.leader++; if (c.from === 'circuit') chal.circuit++; } });
const h = S().history;
console.log(fail.length ? 'FAIL ' + [...new Set(fail)].slice(0, 8).join(' | ') : 'ok', 'leagues', g.nLeagues(), 'year', S().season, 'trainers', Object.keys(S().trainers).length, 'cities', Object.keys(S().cities).length,
  'Elite Four runs/year', (h.reduce((a, x) => a + x.qualifiers, 0) / Math.max(1, h.length)).toFixed(1), 'perfect years', Math.round(h.filter(x => !x.titles).length / Math.max(1, h.length) * 100) + '%', 'badges conceded/year', (h.reduce((a, x) => a + x.badges, 0) / Math.max(1, h.length)).toFixed(1),
  'runs/year', (h.reduce((a, x) => a + x.runs, 0) / Math.max(1, h.length)).toFixed(0), 'field avg', (fieldSum / Math.max(1, fieldN)).toFixed(1), 'max', fieldMax, 'stops', JSON.stringify(stops), 'god edits', gods, 'vacancies', hands, 'open', (S().vacancies || []).length, 'moves', JSON.stringify(moves), 'offers', JSON.stringify(offers), 'back from retirement', Object.values(S().trainers).filter(t => t.unretired).length, 'replaced', Object.values(S().trainers).filter(t => t.letGoAt != null).length,
  'ambitions', JSON.stringify(Object.values(S().trainers).filter(t => t.wish && ['leader', 'gymtrainer', 'e4'].includes(t.role)).reduce((a, t) => (a[t.wish.k] = (a[t.wish.k] || 0) + 1, a), {})),
  'notices', amb.quit.size, 'asked for a run', amb.asked.size, 'comebacks', Object.values(S().trainers).filter(t => (t.comebacks || []).length).length, 'grudges', Object.values(S().trainers).filter(t => t.grudge != null).length,
  'refused', amb.refusedSwap + '/' + amb.refusedMove, 'seat challenges', JSON.stringify(chal), 'steers set', steersSet, 'steered posts', g.eachLeague(() => Object.keys((S().steer || {}).posts || {}).length).join('/'), 'off-type', g.eachLeague(() => g.staffIds().map(g.T).filter(t => t.team.some(m => m.offType)).length).join('/'), 'trend', (S().metaTrend || []).join(','), ...(HAND ? ['money', g.money(S().fin.money), 'wages/wk', g.wageBill(), JSON.stringify(money), 'ledger', JSON.stringify(S().fin.last || S().fin.yr)] : []));
console.log('world', 'founders', Object.values(S().trainers).filter(t => t.founded).map(t => t.name + (t.founded.champ ? ' (Champion)' : '')).join(', ') || 'none', 'Leagues', g.eachLeague(() => S().lgName).join(', '), 'shared cities', Object.values(g.gymMap()).filter(x => x.length > 1).length);
console.log('the red', JSON.stringify(red), 'folded', (S().folded || []).map(f => f.name).join(', ') || 'none');
console.log('stage 5', JSON.stringify(spon), 'player League', g.ME(), 'prestige', g.eachLeague(() => Math.round(S().prest || 0)).join('/'), 'contenders', JSON.stringify(g.eachLeague(i => g.contendersOf(i).length)), 'bounties', g.eachLeague(() => S().fin && S().fin.last ? (S().fin.last.in.bounties || 0) - (S().fin.last.out.bounties || 0) : 0).join('/'));
console.log('books', g.eachLeague(i => `L${i} ${S().fin ? (S().fin.aim || 'player') + ' ' + g.money(S().fin.money) + ' wages ' + g.wageBill() + '/wk' : 'none'}`).join(' | '));
process.exit(fail.length ? 1 : 0);
