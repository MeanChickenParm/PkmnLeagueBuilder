// economic balance report (0.15.0): node tests/econ.js [years=25] [worlds=2] [--seed=1] [--shock=10] [--noshock]
// The design's balance target is economic (design doc section 1): success earns money, money buys more ways to succeed,
// Leagues stay close to level and one far behind can catch up. Each world is the passive player's League (hand-placed
// by best available, run as the multi-year sim runs it, buying nothing) plus three rival Leagues opened in year 1: the
// second League of the player's region (sharing five cities) and one in each of two other regions. Not a pass/fail test.
// It prints, by League slot: money at the end, income, spending and wages a year, trainers let through a year, cities
// controlled; the spread between Leagues each year (richest minus poorest, and the poorest's share of the average);
// and the shock: in year --shock League 1 (the rival sharing the player's region) is set to −START_FUND, and the
// report counts the years until it is back to 80% of the others' average (or never).
const g = require(require('path').join(__dirname, '..', 'dist', 'engine-node.js'));
const pos = process.argv.slice(2).filter(a => !a.startsWith('--')), opt = Object.fromEntries(process.argv.slice(2).filter(a => a.startsWith('--')).map(a => a.slice(2).split('=')));
const N = +pos[0] || 25, W = +pos[1] || 2, seed = opt.seed != null ? +opt.seed : 1, SHOCK = 'noshock' in opt ? null : (opt.shock != null ? +opt.shock : 10);
const L = 4, sum = o => o ? Object.values(o).reduce((a, b) => a + b, 0) : 0;
const per = Array.from({ length: L }, () => ({ money: 0, inc: 0, out: 0, wages: 0, let: 0, ctrl: 0, yrs: 0, red: 0, aims: {}, heads: {} }));
const spread = [], low = [], recov = [];
for (let w = 0; w < W; w++) {
  g.seedRandom(seed * 1000 + w);
  g.newWorld({ leagues: 1, growth: false, hand: true });
  g.foundingFill(); g.finishFounding();
  for (let i = 1; i < L; i++) g.openNewLeague();
  let shockAt = null, back = null;
  for (let y = 1; y <= N; y++) {
    g.approveAllChallenges(); g.fillAllVacancies();
    g.simYear();
    g.approveAllChallenges(); g.fillAllVacancies();
    if (SHOCK != null && y === SHOCK) { g.inLeague(1, () => { g.S.fin.money = -g.START_FUND; }); shockAt = y; }
    const m = g.eachLeague(() => g.S.fin.money), gm = g.gymMap();
    g.eachLeague(i => {
      const f = g.S.fin, last = f.last, p = per[i];
      if (last) { p.inc += sum(last.in); p.out += sum(last.out); for (const k in last.in) p.heads[k] = (p.heads[k] || 0) + last.in[k]; }
      p.wages += g.wageBill() * g.YEAR_WEEKS; p.yrs++; if (f.money < 0) p.red++;
      const h = g.S.history[g.S.history.length - 1]; p.let += h ? h.titles : 0;
      p.ctrl += g.S.gyms.filter(x => g.cityCtrl(g.S.cities[x.city], gm[x.city]) === i).length;
      p.aims[f.aim || 'player'] = (p.aims[f.aim || 'player'] || 0) + 1;
    });
    const avg = m.reduce((a, b) => a + b, 0) / m.length;
    spread.push(Math.max(...m) - Math.min(...m)); low.push(avg > 0 ? Math.min(...m) / avg : null);
    if (shockAt != null && back == null && y > shockAt) { const others = m.filter((_, i) => i !== 1), oa = others.reduce((a, b) => a + b, 0) / others.length; if (m[1] >= 0.8 * oa) back = y - shockAt; }
  }
  if (shockAt != null) recov.push(back);
  g.eachLeague(i => { per[i].money += g.S.fin.money; });
}
const k = n => (n / 1000).toFixed(0) + 'k';
console.log(`Economy report: ${W} world${W === 1 ? '' : 's'} of ${N} years, 4 Leagues (L0 the passive player; L1 shares its region; L2, L3 elsewhere), seed ${seed}${SHOCK != null ? `, shock to L1 in year ${SHOCK}` : ''}`);
console.log('  League  money at end  income/yr  spending/yr  wages/yr  let through/yr  cities held  years in red  aims');
per.forEach((p, i) => console.log(`  L${i}      ${k(p.money / W).padStart(11)}  ${k(p.inc / p.yrs).padStart(9)}  ${k(p.out / p.yrs).padStart(11)}  ${k(p.wages / p.yrs).padStart(8)}  ${(p.let / p.yrs).toFixed(2).padStart(14)}  ${(p.ctrl / p.yrs).toFixed(1).padStart(11)}  ${String(p.red).padStart(12)}  ${Object.entries(p.aims).map(([a, n]) => `${a} ${Math.round(n / p.yrs * 100)}%`).join(' ')}`));
per.forEach((p, i) => console.log(`  L${i} income by heading/yr: ${Object.entries(p.heads).map(([h, v]) => `${h} ${k(v / p.yrs)}`).join(', ')}`));
const lows = low.filter(x => x != null);
console.log(`  spread (richest minus poorest), average over years: ${k(spread.reduce((a, b) => a + b, 0) / spread.length)}; poorest League's money as a share of the average: ${(lows.reduce((a, b) => a + b, 0) / Math.max(1, lows.length)).toFixed(2)}`);
if (recov.length) console.log(`  after the shock, years until L1 is back to 80% of the others' average: ${recov.map(r => r == null ? 'never' : r).join(', ')}`);
