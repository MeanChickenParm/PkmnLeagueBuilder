// invariants sim: node tests/sim.js <leagues> <growth 0/1> <years> [god 0/1]
// Sims whole years week by week and checks the world stays consistent after every week.
const g = require(require('path').join(__dirname, '..', 'dist', 'engine-node.js'));
// HAND (0.6.0): League 0 is founded by hand (best available), staff are made to leave, and vacancies wait with acting
// holders until they are filled
const [L, G, N, GOD, HAND] = process.argv.slice(2).map(Number);
g.newWorld({ leagues: L || 1, growth: !!G, god: !!GOD, hand: !!HAND });
if (HAND) { if (!g.S.founding || g.foundPool().length < 60) { console.log('FAIL no founding pool'); process.exit(1); } g.foundPlace('gym', 3, g.foundPool()[0]); g.foundingFill(); if (g.foundPlaced().length !== 13) { console.log('FAIL fill left posts empty'); process.exit(1); } g.finishFounding(); }
const S = () => g.S, fail = [];
const moves = { let: 0, swap: 0, gt: 0 };
let hands = 0, gods = 0, fieldSum = 0, fieldN = 0, fieldMax = 0, stops = {};
function check(tag) {
  const s = S(), bad = m => fail.push(tag + ' ' + m);
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
      if (act && !(s.vacancies || []).some(v => v.post === 'leader' && v.slot === j) && i === 0) bad('gym ' + j + ' acting with no vacancy');
      if (L.team.length !== g.GYM_SIZE[j] - (act ? 1 : 0)) bad('gym ' + j + ' leader fields ' + L.team.length);
      for (const m of L.team) if (L.specialty && !g.isSpecial(m) && !g.specFit(L, m.sp) && !(m.met && ['starter', 'caught'].includes(m.met.how))) bad('gym ' + j + ' leader ' + g.typeLabel(L) + ' fields off-type ' + m.sp);
      if (gts.length !== g.GYM_TRAINERS - (act ? 1 : 0)) bad('gym ' + j + ' has ' + gts.length + ' gym trainers' + (act ? ' (acting)' : ''));
      for (const id of gts) { const t = g.T(id);
        if (!t || t.role !== 'gymtrainer' || g.lgOf(t) !== i) { bad('gym ' + j + ' trainer is wrong'); continue; }
        if (!act && !g.gymFits(t, L)) bad('gym ' + j + ' trainer type ' + g.typeLabel(t) + ' in a ' + g.typeLabel(L) + ' gym');
        for (const m of t.team) if (t.specialty && !g.isSpecial(m) && !g.specFit(t, m.sp)) bad('gym ' + j + ' trainer ' + g.typeLabel(t) + ' fields off-type ' + m.sp);
        if (t.team.length !== g.GYM_SIZE[j] - 1) bad('gym ' + j + ' trainer fields ' + t.team.length);
        staff.add(id); } });
    for (const id of [...z.e4, z.champion]) if (g.T(id) && g.T(id).team.length !== g.E4_SIZE) bad('Elite team of ' + g.T(id).team.length);
    if (g.T(z.champion) && g.T(z.champion).acting) bad('an acting Champion');
    z.e4.forEach((id, k) => { const t = g.T(id); if (t && t.acting && !(s.vacancies || []).some(v => v.post === 'e4' && v.slot === k)) bad('acting Elite Four member with no vacancy'); });
    if (i === 0) { const held = new Set((s.vacancies || []).flatMap(v => v.outsiders || [])); for (const t of Object.values(s.trainers)) if (t.role === 'prospect' && !held.has(t.id)) bad('a stranded outsider: ' + t.name); }
    if (i === 0) for (const v of s.vacancies || []) { const a = g.T(v.post === 'leader' ? z.gyms[v.slot].leader : z.e4[v.slot]); if (!a || !a.acting) bad('a vacancy with no acting holder'); }
    { const all = [z.champion, ...z.e4, ...z.gyms.flatMap(x => [x.leader, ...(x.trainers || [])])].filter(x => x != null); if (new Set(all).size !== all.length) bad('someone holds two posts'); }
    z.gyms.forEach(x => { if ((x.watch || []).length > g.GYM_WATCH) bad('too many kept battles'); if ((x.trainers || []).length > g.GYM_TRAINERS) bad('too many gym trainer places'); });
    if (i > 0 && (z.gyms.some(x => x.acting) || z.e4.some(id => g.T(id) && g.T(id).acting))) bad('a vacancy in a League not staffed by hand');
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
  if (Object.keys(s.cities).length % 8) bad('city count ' + Object.keys(s.cities).length);
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
    if (HAND && S().season === 2 && S().week === 10) g.inLeague(0, () => { g.staffRetires(g.T(S().gyms[1].leader)); g.staffRetires(g.T(S().e4[2])); g.staffRetires(g.T(S().champion)); if ((S().vacancies || []).length < 3) fail.push('expected three vacancies, got ' + (S().vacancies || []).length); hands += S().vacancies.length; });
    // staffing at will (0.7.0): let staff go, swap them, and place gym trainers by hand, now and then
    if (HAND && S().season >= 2) g.inLeague(0, () => {
      const z = S(), seniors = [...z.e4, ...z.gyms.map(x => x.leader)].map(g.T).filter(t => t && !t.acting);
      if (g.releaseStaff(z.champion)) fail.push('the Champion was let go');
      if (Math.random() < 0.04 && seniors.length) { const t = rnd(seniors.concat((z.gyms[rnd([0, 1, 2, 3, 4, 5, 6, 7])].trainers || []).map(g.T).filter(Boolean)));
        const r = g.releaseStaff(t.id); if (!r) fail.push('releaseStaff refused ' + t.role); else { moves.let++; if (!['challenger', 'retired'].includes(t.role)) fail.push('let go but role ' + t.role); } }
      if (Math.random() < 0.03) { const role = rnd(['leader', 'e4']), ps = seniors.filter(t => t.role === role);
        if (ps.length >= 2) { const a = rnd(ps), b = rnd(ps.filter(x => x !== a)); if (!g.swapStaff(a.id, b.id)) fail.push('swapStaff refused'); else moves.swap++; } }
      if (Math.random() < 0.04) { const i = rnd([0, 1, 2, 3, 4, 5, 6, 7]), gy = z.gyms[i], k = (gy.trainers || []).findIndex(x => x != null);
        const c = g.gymTrainerCands(i); if (k >= 0 && c.length) { const pick = rnd(c.slice(0, 8)).t; if (!g.placeGymTrainer(i, k, pick.id)) fail.push('placeGymTrainer refused'); else moves.gt++; } }
    });
    if (HAND && (S().vacancies || []).length && Math.random() < 0.08) { const v = S().vacancies[0], c = g.inLeague(0, () => g.vacancyCands(v)); if (!g.fillVacancy(v, rnd(c.slice(0, 10)).t.id)) fail.push('fillVacancy refused'); }
    g.simWeek();
    if (S().stop) stops[S().stop.why] = (stops[S().stop.why] || 0) + 1;
    check('step');
  }
  if (guard >= 400) fail.push('stuck in year ' + S().season);
  if (S().history.length !== S().season - 1) fail.push('history has ' + S().history.length + ' years at the start of year ' + S().season);
  check('s' + S().season);
}
// a reloaded save keeps running
{ const copy = JSON.parse(JSON.stringify(S())); g.S = copy; g.applyDex(copy.cfg && copy.cfg.dex); g.applyCfg(); g.simYear(); check('reload'); if (g.simWeeks(60, true) == null) fail.push('60 weeks without a stop for New Year'); check('stops'); }
const h = S().history;
console.log(fail.length ? 'FAIL ' + [...new Set(fail)].slice(0, 8).join(' | ') : 'ok', 'leagues', g.nLeagues(), 'year', S().season, 'trainers', Object.keys(S().trainers).length, 'cities', Object.keys(S().cities).length,
  'Elite Four runs/year', (h.reduce((a, x) => a + x.qualifiers, 0) / Math.max(1, h.length)).toFixed(1), 'perfect years', Math.round(h.filter(x => !x.titles).length / Math.max(1, h.length) * 100) + '%', 'badges conceded/year', (h.reduce((a, x) => a + x.badges, 0) / Math.max(1, h.length)).toFixed(1),
  'runs/year', (h.reduce((a, x) => a + x.runs, 0) / Math.max(1, h.length)).toFixed(0), 'field avg', (fieldSum / Math.max(1, fieldN)).toFixed(1), 'max', fieldMax, 'stops', JSON.stringify(stops), 'god edits', gods, 'vacancies', hands, 'open', (S().vacancies || []).length, 'moves', JSON.stringify(moves));
process.exit(fail.length ? 1 : 0);
