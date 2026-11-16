// economic balance report (0.15.0; reworked 0.16.0): node tests/econ.js [years=25] [worlds=8] [--seed=1] [--shock=10] [--noshock] [--fold=10] [--jobs=2]
// The design's balance target is economic (design doc section 1): success earns money, money buys more ways to succeed,
// Leagues stay close to level and one far behind can catch up. Each world is the passive player's League (hand-placed
// by best available, run as the multi-year sim runs it, buying nothing) plus three rival Leagues opened in year 1: the
// second League of the player's region (sharing five cities) and one in each of two other regions. Not a pass/fail test.
// Wealth (0.16.0) is money plus what a League has built, at cost. The owner's targets (Nov 15, sixteenth chat) are
// measured on the three AI Leagues at the last year: the poorest at least 0.6 of their average, the richest at most 2×
// it, and after the shock (in year --shock League 1's wealth is cut to 40% of L2 and L3's average by taking cash) League 1
// back to 80% of their average wealth in 4 to 6 years. The passive player is shown beside them. Worlds are split over --jobs workers.
// (0.19.0) --fold=Y measures what follows a fold instead of the shock: at the end of year Y League 2 is pushed deep into
// the red (its money set to minus its buildings at cost and 2 million), so it folds at a later New Year; the report then
// follows the three Leagues left: each circuit's field, the two AI Leagues' wealth, and the passive player's.
const path = require('path');
const args = process.argv.slice(2), pos = args.filter(a => !a.startsWith('--')), opt = Object.fromEntries(args.filter(a => a.startsWith('--')).map(a => a.slice(2).split('=')));
const N = +pos[0] || 25, W = +pos[1] || 8, seed = opt.seed != null ? +opt.seed : 1, FOLD = opt.fold != null ? +opt.fold || 10 : null, SHOCK = 'noshock' in opt || FOLD != null ? null : (opt.shock != null ? +opt.shock : 10);
const L = 4, sum = o => o ? Object.values(o).reduce((a, b) => a + b, 0) : 0;

function runWorlds(list) {
  const g = require(path.join(__dirname, '..', 'dist', 'engine-node.js'));
  if (FOLD != null) return foldWorlds(g, list);
  const per = Array.from({ length: L }, () => ({ money: 0, estate: 0, inc: 0, out: 0, wages: 0, let: 0, ctrl: 0, yrs: 0, red: 0, aims: {}, heads: {}, outs: {}, sOut: 0, sT: 0, sE: 0, sOwnT: 0, top: 0 }));
  const ends = [], recov = [], marks = {}, folds = [];
  // what a League has built, at cost (the 0.15.0 fallback lets this report measure builds from before 0.16.0)
  const estate = () => g.estateCost ? g.estateCost() : g.myPlaces().filter(p => !p.none).reduce((a, p) => a + p.b.reduce((c, x) => c + [0, 25000, 75000, 175000][x.lv], 0), 0);
  for (const w of list) {
    g.seedRandom(seed * 1000 + w);
    g.newWorld({ leagues: 1, growth: false, hand: true });
    g.foundingFill(); g.finishFounding();
    for (let i = 1; i < L; i++) g.openNewLeague();
    let shockAt = null, back = null;
    for (let y = 1; y <= N; y++) {
      g.approveAllChallenges(); g.fillAllVacancies();
      g.simYear();
      // (0.18.0) a League can fold: the world's figures stop there (it no longer has four Leagues)
      if (g.nLeagues() < L) { folds.push({ w, y, lg: g.S.folded[g.S.folded.length - 1].name }); break; }
      g.approveAllChallenges(); g.fillAllVacancies();
      // the shock (0.16.0, the owner's choice: a relative crash): League 1's wealth is cut to 40% of L2 and L3's
      // average by taking cash (which goes as far below zero as needed); its buildings stay
      if (SHOCK != null && y === SHOCK) { const w0 = g.eachLeague(() => g.S.fin.money + estate()), to = 0.4 * (w0[2] + w0[3]) / 2; if (w0[1] > to) g.inLeague(1, () => { g.S.fin.money -= Math.round(w0[1] - to); }); shockAt = y; }
      const wl = g.eachLeague(() => g.S.fin.money + estate()), gm = g.gymMap();
      g.eachLeague(i => {
        const f = g.S.fin, last = f.last, p = per[i];
        if (last) { p.inc += sum(last.in); p.out += sum(last.out); for (const k in last.in) p.heads[k] = (p.heads[k] || 0) + last.in[k]; for (const k in last.out) p.outs[k] = (p.outs[k] || 0) + last.out[k]; }
        p.wages += g.wageBill() * g.YEAR_WEEKS; p.yrs++; if (f.money < 0) p.red++;
        const h = g.S.history[g.S.history.length - 1]; p.let += h ? h.titles : 0;
        p.ctrl += g.S.gyms.filter(x => g.cityCtrl(g.S.cities[x.city], gm[x.city]) === i).length;
        p.aims[f.aim || 'player'] = (p.aims[f.aim || 'player'] || 0) + 1;
        // (0.18.0) contenders: out at the year's end, titles won by its own, titles and Elite Four runs conceded to others'; the circuit's best ten
        p.sOut += g.contendersOf(i).length; if (h && h.spon) { for (const r of h.spon.at) { p.sT += r[6]; p.sE += r[5]; } for (const r of h.spon.out) p.sOwnT += r[6]; }
        { const ov = g.challengers().filter(Boolean).map(t => g.ovr(t)).sort((a, b) => b - a).slice(0, 10); p.top += ov.length ? ov.reduce((a, b) => a + b, 0) / ov.length : 0; }
      });
      if (y % 5 === 0) { const ai = wl.slice(1), a = ai.reduce((x, z) => x + z, 0) / 3; (marks[y] = marks[y] || []).push({ low: Math.min(...ai) / a, high: Math.max(...ai) / a, avg: a }); }
      if (shockAt != null && back == null && y > shockAt) { const oa = (wl[2] + wl[3]) / 2; if (wl[1] >= 0.8 * oa) back = y - shockAt; }
    }
    if (g.nLeagues() < L) { if (shockAt != null) recov.push('folded'); continue; }
    if (shockAt != null) recov.push(back);
    const wl = g.eachLeague(() => g.S.fin.money + estate()), ai = wl.slice(1), a = ai.reduce((x, z) => x + z, 0) / 3;
    ends.push({ low: Math.min(...ai) / a, high: Math.max(...ai) / a, spread: Math.max(...ai) - Math.min(...ai), p0: wl[0] / a });
    g.eachLeague(i => { per[i].money += g.S.fin.money; per[i].estate += estate(); });
  }
  return { per, ends, recov, marks, folds };
}

// (0.19.0) --fold: push League 2 into the red at the end of year FOLD and follow the world after it folds
function foldWorlds(g, list) {
  const out = [];
  for (const w of list) {
    g.seedRandom(seed * 1000 + w);
    g.newWorld({ leagues: 1, growth: false, hand: true });
    g.foundingFill(); g.finishFounding();
    for (let i = 1; i < L; i++) g.openNewLeague();
    const r = { w, foldAt: null, name: null, before: null, after: [], peak: 0 };
    for (let y = 1; y <= N; y++) {
      g.approveAllChallenges(); g.fillAllVacancies();
      // the field week by week, for the peak after the fold
      for (const y0 = g.S.season; g.S.season === y0;) { g.simWeek(); if (r.foldAt != null || g.nLeagues() < L) r.peak = Math.max(r.peak, ...g.eachLeague(() => g.challengers().length)); }
      if (g.nLeagues() < L && r.foldAt == null) { r.foldAt = y; r.name = g.S.folded[g.S.folded.length - 1].name; }
      g.approveAllChallenges(); g.fillAllVacancies();
      if (y === FOLD) { r.before = g.eachLeague(() => g.challengers().length); g.inLeague(2, () => { g.S.fin.money = -(g.estateCost() + 2000000); }); }
      if (r.foldAt != null) {
        const wl = g.eachLeague(() => g.S.fin.money + g.estateCost()), field = g.eachLeague(() => g.challengers().length);
        const ai = wl.slice(1), a = ai.reduce((x, z) => x + z, 0) / ai.length;
        r.after.push({ y, field, low: Math.min(...ai) / a, high: Math.max(...ai) / a, avg: a, p0: wl[0] / a });
      }
    }
    out.push(r);
  }
  return { fold: out };
}
function foldReport(rs) {
  const all = [].concat(...rs.map(r => r.fold)).sort((a, b) => a.w - b.w), k = n => (n / 1000).toFixed(0) + 'k', mean = a => a.reduce((x, z) => x + z, 0) / Math.max(1, a.length);
  console.log(`Fold report: ${W} worlds of ${N} years, 4 Leagues; League 2 pushed into the red at the end of year ${FOLD}, seed ${seed}`);
  for (const r of all) console.log(`  world ${r.w}: ${r.foldAt ? `folded in year ${r.foldAt} (${r.name})` : 'did not fold'}; fields before ${r.before ? r.before.join('/') : '-'}, after the fold ${r.after.length ? r.after[0].field.join('/') : '-'}, at the end ${r.after.length ? r.after[r.after.length - 1].field.join('/') : '-'}; peak circuit after it ${r.peak} (alarm 160)`);
  const by = {}; for (const r of all) r.after.forEach((x, i) => (by[i] = by[i] || []).push(x));
  for (const i of Object.keys(by).map(Number).sort((a, b) => a - b)) { const xs = by[i]; console.log(`  ${i} years after: fields ${xs[0].field.map((_, j) => mean(xs.map(x => x.field[j])).toFixed(0)).join('/')}, the two AI Leagues' wealth ${k(mean(xs.map(x => x.avg)))} on average (poorer ${mean(xs.map(x => x.low)).toFixed(2)}, richer ${mean(xs.map(x => x.high)).toFixed(2)}), the passive player ${mean(xs.map(x => x.p0)).toFixed(2)} of it (${xs.length} worlds)`); }
}
if (opt.worker != null) { process.stdout.write(JSON.stringify(runWorlds(opt.worker.split(',').map(Number)))); process.exit(0); }

const jobs = Math.max(1, Math.min(+opt.jobs || 2, W)), parts = Array.from({ length: jobs }, () => []);
for (let w = 0; w < W; w++) parts[w % jobs].push(w);
const pass = args.filter(a => !a.startsWith('--worker') && !a.startsWith('--jobs'));
let res;
if (jobs === 1) res = [runWorlds(parts[0])];
else {
  // run the workers side by side
  const { spawn } = require('child_process');
  const outs = parts.map(() => ''), procs = parts.map((p, i) => { const c = spawn(process.execPath, [__filename, ...pass, `--worker=${p.join(',')}`]); c.stdout.on('data', d => { outs[i] += d; }); c.stderr.on('data', d => process.stderr.write(d)); return c; });
  let left = procs.length;
  procs.forEach((c, i) => c.on('close', (code, sig) => { if (code || sig) console.error(`worker ${i} (worlds ${parts[i].join(',')}) stopped: code ${code}, signal ${sig}`); if (--left === 0) (FOLD != null ? foldReport : report)(outs.filter(o => o).map(o => JSON.parse(o))); }));
}
if (res) (FOLD != null ? foldReport : report)(res);

function report(rs) {
  const per = Array.from({ length: L }, () => ({ money: 0, estate: 0, inc: 0, out: 0, wages: 0, let: 0, ctrl: 0, yrs: 0, red: 0, aims: {}, heads: {}, outs: {} }));
  const ends = [], recov = [], marks = {}, folds = [];
  for (const r of rs) {
    folds.push(...(r.folds || []));
    r.per.forEach((p, i) => { const q = per[i]; for (const k of ['money', 'estate', 'inc', 'out', 'wages', 'let', 'ctrl', 'yrs', 'red', 'sOut', 'sT', 'sE', 'sOwnT', 'top']) q[k] = (q[k] || 0) + p[k]; for (const o of ['aims', 'heads', 'outs']) for (const k in p[o]) q[o][k] = (q[o][k] || 0) + p[o][k]; });
    ends.push(...r.ends); recov.push(...r.recov); for (const y in r.marks) (marks[y] = marks[y] || []).push(...r.marks[y]);
  }
  const k = n => (n / 1000).toFixed(0) + 'k', mean = a => a.reduce((x, z) => x + z, 0) / Math.max(1, a.length);
  console.log(`Economy report: ${W} worlds of ${N} years, 4 Leagues (L0 the passive player; L1 shares its region; L2, L3 elsewhere), seed ${seed}${SHOCK != null ? `, shock to L1 in year ${SHOCK}` : ''}`);
  console.log('  League  money at end  estate at end  income/yr  spending/yr  wages/yr  let through/yr  cities held  years in red  aims');
  per.forEach((p, i) => console.log(`  L${i}      ${k(p.money / W).padStart(11)}  ${k(p.estate / W).padStart(12)}  ${k(p.inc / p.yrs).padStart(9)}  ${k(p.out / p.yrs).padStart(11)}  ${k(p.wages / p.yrs).padStart(8)}  ${(p.let / p.yrs).toFixed(2).padStart(14)}  ${(p.ctrl / p.yrs).toFixed(1).padStart(11)}  ${String(p.red).padStart(12)}  ${Object.entries(p.aims).map(([a, n]) => `${a} ${Math.round(n / p.yrs * 100)}%`).join(' ')}`));
  per.forEach((p, i) => console.log(`  L${i} in/yr: ${Object.entries(p.heads).map(([h, v]) => `${h} ${k(v / p.yrs)}`).join(', ')} | out/yr: ${Object.entries(p.outs).map(([h, v]) => `${h} ${k(v / p.yrs)}`).join(', ')}`));
  per.forEach((p, i) => console.log(`  L${i} contenders: ${(p.sOut / p.yrs).toFixed(2)} out at year end; titles by its own ${(p.sOwnT / p.yrs).toFixed(2)}/yr; conceded to others' contenders ${(p.sT / p.yrs).toFixed(2)} titles and ${(p.sE / p.yrs).toFixed(2)} Elite Four runs/yr; circuit's best ten OVR ${(p.top / p.yrs).toFixed(1)}`));
  if (folds.length) console.log(`  folded: ${folds.map(f => `world ${f.w} year ${f.y} (${f.lg})`).join(', ')}; those worlds stop there and are left out of the end figures`);
  console.log('  AI Leagues\' wealth (money + buildings at cost) by year, poorest and richest as a share of their average:');
  for (const y of Object.keys(marks).sort((a, b) => a - b)) console.log(`    year ${String(y).padStart(2)}: average ${k(mean(marks[y].map(x => x.avg)))}, poorest ${mean(marks[y].map(x => x.low)).toFixed(2)}, richest ${mean(marks[y].map(x => x.high)).toFixed(2)}`);
  const lowOk = ends.filter(e => e.low >= 0.6).length, highOk = ends.filter(e => e.high <= 2).length;
  console.log(`  at the end (targets: poorest ≥ 0.60, richest ≤ 2.00): poorest ${mean(ends.map(e => e.low)).toFixed(2)} (worst ${Math.min(...ends.map(e => e.low)).toFixed(2)}; ${lowOk}/${ends.length} worlds meet it), richest ${mean(ends.map(e => e.high)).toFixed(2)} (worst ${Math.max(...ends.map(e => e.high)).toFixed(2)}; ${highOk}/${ends.length}); spread ${k(mean(ends.map(e => e.spread)))}; the passive player ${mean(ends.map(e => e.p0)).toFixed(2)} of the AI average`);
  if (recov.length) { const got = recov.filter(r => typeof r === 'number'); console.log(`  after the shock (target 4 to 6 years), years until L1 is back to 80% of L2 and L3's average: ${recov.map(r => r == null ? 'never' : r).join(', ')}; mean ${got.length ? mean(got).toFixed(1) : '-'}${recov.some(r => r == null) ? `, never in ${recov.filter(r => r == null).length}` : ''}${recov.includes('folded') ? `, folded in ${recov.filter(r => r === 'folded').length}` : ''}`); }
}
