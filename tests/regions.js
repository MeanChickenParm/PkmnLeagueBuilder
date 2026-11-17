// custom regions (0.31.0): node tests/regions.js [years=5]
// Builds a world with a 10th region (its own locked Pokémon, a claimed legendary, closed to rivals), a whole
// replacement of Hoenn (a generated list, inheriting Hoenn's neighbours and legendaries) and a pool swap of Johto
// (Sinnoh's list), sims it week by week and checks: the regions as built, no rival in the closed region, locked lines
// only found at home, every line living somewhere (orphans re-homed), and that the world reloads. Also checks the
// region files: a round trip through the paste code, a newer format refused, a taken name left out and flagged.
const g = require(require('path').join(__dirname, '..', 'dist', 'engine-node.js'));
const YEARS = +process.argv[2] || 5, fails = [], fail = m => fails.push(m);
g.seedRandom(31);
// ---------- the region files ----------
const land = g.regionCopy(0); land.name = 'Testland'; land.lock = true; land.rivals = false; land.legends = ['Mewtwo']; land.nb = ['Kanto', 'Alola'];
land.added = [{ name: 'Testmon', types: ['Water'], stats: [70, 80, 70, 60, 60, 90], ab: ['Torrent', '', ''] }, { name: 'Testevo', types: ['Water', 'Dark'], stats: [90, 110, 85, 80, 80, 105], ab: ['Torrent', '', ''], from: 'Testmon', lvl: 30 }];
land.pool.push('Testmon'); land.ports = { Vermilion: 'port' }; land.posts = { leader: 'Warden', gymtrainer: '' };
{ const r = g.regionRead(g.regionCode(land));
  if (r.err || r.dropped.length || r.rec.added.length !== 2 || r.rec.pool.length !== land.pool.length || r.rec.posts.leader !== 'Warden' || r.rec.ports.Vermilion !== 'port') fail('the paste code round trip: ' + JSON.stringify(r).slice(0, 200));
  const newer = g.regionNorm({ plbRegion: 99, region: land }); if (!newer.err || !/newer/.test(newer.err)) fail('a newer format was not refused');
  // a taken name (a game Pokémon's) is left out and flagged; what evolved from it now branches from the game's own
  const clash = JSON.parse(JSON.stringify(land)); clash.added[0].name = 'Pikachu'; clash.added[1].from = 'Pikachu';
  const c = g.regionRead(g.regionFileText(clash));
  if (c.rec.added.length !== 1 || c.dropped.length !== 1 || c.dropped[0].name !== 'Pikachu' || c.dropped[0].why !== 'taken') fail('a taken name: ' + JSON.stringify(c.dropped));
  // one that evolves from a dropped Pokémon of the region's own is left out too
  const orphan = JSON.parse(JSON.stringify(land)); orphan.added[0].name = 'Pikachu'; const o2 = g.regionRead(g.regionFileText(orphan));
  if (o2.rec.added.length || !o2.dropped.some(d => d.name === 'Testevo')) fail('an evolution of a dropped Pokémon: ' + JSON.stringify(o2.dropped));
  if (!g.regionRead('not a region').err) fail('junk read as a region');
  const chk = g.regionChecks(Object.assign(g.regionBlank(), { towns: ['A', 'A', 'B', 'C', 'D', 'E', 'F', 'G'] })); if (!chk.errs.length) fail('two places with one name passed the checks');
  const thin = g.regionChecks(Object.assign(g.regionBlank(), { pool: g.generatePool({ types: ['Water'] }) })); if (!thin.warns.some(w => /Thin types/.test(w)) || thin.errs.length) fail('a themed list: no thin-type warning, or blocked');
  for (const power of ['gentle', 'standard', 'strong']) { const p = g.generatePool({ power }), st = g.poolStats(p); if (st.size < 230 || st.size > 270) fail(`generated ${power} list of ${st.size} species`);
    if (power === 'gentle' && p.some(b => g.lineTop(b) > 540)) fail('a gentle list has a strong line'); if (power === 'standard' && p.filter(b => g.lineTop(b) >= 600).length > 3) fail('too many pseudo-legendaries'); }
  const gen1 = g.generatePool({ gens: [0] }); if (gen1.some(b => g.lineGen(b) !== 0)) fail('a Gen I list has other generations'); }
// ---------- the world ----------
const aqua = Object.assign(g.regionBlank(), { name: 'Aqua', legends: null, pool: g.generatePool({ types: ['Water', 'Ice'], power: 'strong' }) });
aqua.towns = aqua.towns.map((_, i) => 'Aqua ' + i); aqua.ports = { 'Aqua 0': 'railway' };
const swap = g.regionCopy(3); swap.name = 'Sinnohish';
g.newWorld({ leagues: 8, growth: true, region: 9, regions: [{ rec: land, mode: 'add' }, { rec: aqua, mode: 'whole', of: 2 }, { rec: swap, mode: 'pool', of: 1 }] });
const S = () => g.S, R = g.S.regions, B = g.builtinLines();
if (R.length !== 10 || R[9].name !== 'Testland League' || !R[9].solo || R[9].posts.leader !== 'Warden' || R[9].nb.join() !== '0,6') fail('the 10th region: ' + JSON.stringify(R[9]).slice(0, 200));
if (R[2].name !== 'Aqua League' || R[2].nb.join() !== g.builtinRegions()[2].nb.join() || !R[2].legends.includes('Rayquaza') || R[2].ports['Aqua 0'] !== 'railway') fail('the whole replacement: ' + JSON.stringify(R[2]).slice(0, 200));
if (R[1].name !== 'Johto League' || R[1].towns[0] !== 'Violet' || !R[1].pool || R[1].from !== 'Sinnohish') fail('the pool swap');
if (g.LEGEND_HOME.Mewtwo !== 9 || R[0].legends.includes('Mewtwo')) fail('Mewtwo did not move to Testland');
g.NEIGHBOURS.forEach((a, i) => a.forEach(x => { if (!g.NEIGHBOURS[x].includes(i)) fail('neighbours not two-way ' + i + '-' + x); }));
if (!g.SP.Testmon || g.SP.Testmon.homeOnly !== 9 || !g.homeSet(9).has('Testmon') || g.lineBaseOf('Testevo') !== 'Testmon') fail('Testland\'s own Pokémon');
if (g.wildOk('Testmon', 0) || !g.wildOk('Testmon', 9)) fail('a locked line found away from home');
// orphans: every line lives in some region; Hoenn's own lines that Aqua dropped went to Hoenn's neighbours
{ const sets = g.regionLines().sets, inAny = new Set(); sets.forEach(s => s.forEach(b => inAny.add(b)));
  const lost = g.ranchSpecies().filter(b => !inAny.has(b)); if (lost.length) fail('lines in no region: ' + lost.slice(0, 5));
  const hoennOnly = [...B.sets[2]].filter(b => B.sets.every((s, r) => r === 2 || !s.has(b)) && !sets[2].has(b));
  if (hoennOnly.some(b => !g.NEIGHBOURS[2].some(r => sets[r].has(b)))) fail('a Hoenn line not re-homed to a neighbour'); }
const regs = () => g.eachLeague(() => S().region);
let maxL = 0, locked = 0;
for (let w = 0; w < YEARS * g.YEAR_WEEKS; w++) {
  g.simWeek();
  const rs = regs(), me = g.ME(); maxL = Math.max(maxL, rs.length);
  if (rs.some((r, i) => r === 9 && i !== me)) { fail('a rival League in the region closed to rivals (week ' + S().turn + ')'); break; }
  for (const [r, m] of Object.entries(S().migr || {})) if (m.lines.some(b => g.homeOnly(b) != null)) fail('a locked line migrating to ' + r);
  g.eachLeague(i => { if (S().region === 9) return;
    for (const id of S().challengers) for (const m of g.T(id).team) { const b = g.lineBaseOf(m.sp); if (b && g.homeOnly(b) != null) { locked++; fail('a challenger away from Testland holds ' + m.sp); } }
    if (g.ranchOn() && g.laneSet && [...g.laneSet()].some(b => g.homeOnly(b) != null)) fail('a locked line on a lane'); });
  if (fails.length > 5) break;
}
// the world reloads
{ const copy = JSON.parse(JSON.stringify(S())); g.S = copy; g.applyDex(copy.cfg && copy.cfg.dex); g.applyCfg(); g.simYear();
  if (g.S.regions.length !== 10 || g.LEGEND_HOME.Mewtwo !== 9 || !g.homeSet(9).has('Testmon')) fail('the reloaded world lost its regions'); }
const caught = g.eachLeague(() => S().challengers.filter(id => g.T(id).team.some(m => g.lineBaseOf(m.sp) === 'Testmon')).length);
console.log('regions', R.map(r => g.regionName(R.indexOf(r))).join('/'), 'species', g.regionLines().size.join('/'), 'Leagues', maxL, 'at', regs().join(','), 'Testmon held by challengers', caught.join('/'));
if (fails.length) { console.log(fails.slice(0, 10).map(f => 'FAIL ' + f).join('\n')); process.exit(1); }
console.log('ok');
