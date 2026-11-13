// wall report: node tests/report.js [years=100] [worlds=1] [--seed=1] [--boost=N] [--tiers]
// Sims whole years of one League and prints how the wall held: trainers let through (titles conceded), perfect years
// (none let through), badges conceded, and how far the best challenger got. Each world is a fresh League; the numbers are for all worlds together.
// The year is the unit the wall is scored on (0.4.0): 48 weeks of a continuous world, challengers on their own clocks.
//   --seed=N    the run's random seed (default 1), so the same command prints the same numbers; --seed=random for a fresh one
//   --boost=N   every staff member is N rating points better (or worse) than the game would make them, and no
//               challenger walks into a post, so the League's staff stay in that tier for the whole run
//   --tiers     one line each for a strong (+15), an average (0) and a poor (-15) League, instead of the full report
// Years in one world share its staff, so they are not independent: for a steadier number use more worlds, not
// more years (e.g. 40 12 rather than 100 4).
const g = require(require('path').join(__dirname, '..', 'dist', 'engine-node.js'));
const pos = process.argv.slice(2).filter(a => !a.startsWith('--')), opt = Object.fromEntries(process.argv.slice(2).filter(a => a.startsWith('--')).map(a => a.slice(2).split('=')));
const N = +pos[0] || 100, W = +pos[1] || 1;
const seed = opt.seed === 'random' ? Math.floor(Math.random() * 1e9) : (opt.seed != null ? +opt.seed : 1);
function run(boost) {
  const all = [], gyms = Array.from({ length: 8 }, () => ({ held: 0, lost: 0 }));
  for (let w = 0; w < W; w++) {
    g.seedRandom(seed * 1000 + w);
    g.newWorld(Object.assign({ leagues: 1, growth: false }, boost == null ? {} : { staffBoost: boost }));
    for (let i = 0; i < N; i++) g.simYear();
    for (const h of g.S.history) all.push(h);
    g.S.gyms.forEach((gym, i) => { for (const x of gym.hist) { gyms[i].held += x.w; gyms[i].lost += x.l; } });
  }
  return { all, gyms };
}
const stats = ({ all, gyms }) => {
  const n = all.length, avg = f => (all.reduce((a, h) => a + f(h), 0) / n);
  return { n, all, avg, per100: k => (k / n * 100).toFixed(1), perfect: all.filter(h => !h.titles).length,
    held: gyms.map(x => x.held + x.lost ? Math.round(x.held / (x.held + x.lost) * 100) : 0) };
};
if ('tiers' in opt) {
  console.log(`Wall report by staff tier: ${W} world${W === 1 ? '' : 's'} of ${N} years each, seed ${seed}`);
  console.log('  tier            let through  a year  perfect/100  badges   runs  E4 runs    out  field  best  tries turned back, gyms 1 to 8');
  for (const [name, boost] of [['strong (+15)', 15], ['average (0)', 0], ['poor (-15)', -15]]) {
    const s = stats(run(boost));
    console.log(`  ${name.padEnd(14)}  ${String(s.all.reduce((a, h) => a + h.titles, 0)).padStart(11)}  ${s.avg(h => h.titles).toFixed(2).padStart(6)}  ${s.per100(s.perfect).padStart(11)}  ${s.avg(h => h.badges).toFixed(1).padStart(6)}  ${s.avg(h => h.runs).toFixed(1).padStart(5)}  ${s.avg(h => h.qualifiers).toFixed(2).padStart(7)}  ${s.avg(h => h.out).toFixed(1).padStart(5)}  ${s.avg(h => h.field).toFixed(1).padStart(5)}  ${s.avg(h => h.best).toFixed(1).padStart(4).padStart(4)}  ${s.held.map(x => x + '%').join(' ')}`);
  }
  console.log('  (let through is the total over every year of every world; a year, badges, runs begun, runs at the Elite Four and runs out on three losses are per year; field is challengers on the circuit at New Year;');
  console.log('   best is how far the best challenger got: 8 = all badges, 12 = beat the Elite Four, 13 = won the title)');
} else {
  const boost = opt.boost != null ? +opt.boost : null;
  const r = run(boost), s = stats(r), { all } = r, { n, avg, per100 } = s;
  let streak = 0, bestStreak = 0; for (const h of all) { streak = h.titles ? 0 : streak + 1; bestStreak = Math.max(bestStreak, streak); }
  const dist = {}; for (const h of all) dist[h.best] = (dist[h.best] || 0) + 1;
  console.log(`Wall report: ${n} years (${W} world${W === 1 ? '' : 's'} of ${N}), seed ${seed}${boost == null ? '' : `, staff ${boost >= 0 ? '+' : ''}${boost}`}`);
  console.log(`  trainers let through (titles conceded): ${all.reduce((a, h) => a + h.titles, 0)} in ${n} years, ${avg(h => h.titles).toFixed(2)} a year`);
  console.log(`  perfect years (none let through): ${per100(s.perfect)} in 100${W === 1 ? `   longest streak: ${bestStreak}` : ''}`);
  console.log(`  badges conceded per year: ${avg(h => h.badges).toFixed(1)} (${(avg(h => h.badges) / avg(h => h.runs)).toFixed(2)} a run)`);
  console.log(`  runs begun per year: ${avg(h => h.runs).toFixed(1)}, by ${avg(h => h.field).toFixed(1)} challengers on the circuit`);
  console.log(`  runs that reached the Elite Four per year: ${avg(h => h.qualifiers).toFixed(2)}`);
  console.log(`  runs ended on three losses per year: ${avg(h => h.out).toFixed(1)}`);
  console.log('  how far the best challenger got (years in 100):');
  for (const d of Object.keys(dist).map(Number).sort((a, b) => a - b)) console.log(`    ${g.depthName(d).padEnd(26)} ${per100(dist[d]).padStart(5)}`);
  console.log(`  average: ${avg(h => h.best).toFixed(1)} (8 = all badges, 12 = beat the Elite Four, 13 = won the title)`);
  console.log('  tries each gym turned back (share of all tries there):');
  console.log('    ' + s.held.map((x, i) => `#${i + 1} ${x}%`).join('  '));
}
