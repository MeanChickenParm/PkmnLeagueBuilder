// wall report: node tests/report.js [seasons=100] [worlds=1]
// Sims whole seasons of one League and prints how the wall held: perfect seasons, badges conceded, and how far the
// best challenger got. Each world is a fresh League; the numbers are for all worlds together.
const g = require(require('path').join(__dirname, '..', 'dist', 'engine-node.js'));
const N = +process.argv[2] || 100, W = +process.argv[3] || 1;
const all = [], gyms = Array.from({ length: 8 }, () => ({ held: 0, lost: 0 }));
for (let w = 0; w < W; w++) {
  g.newWorld({ leagues: 1, growth: false });
  for (let i = 0; i < N; i++) g.simOneSeason();
  for (const h of g.S.history) all.push(h);
  g.S.gyms.forEach((gym, i) => { for (const x of gym.hist) { gyms[i].held += x.w; gyms[i].lost += x.l; } });
}
const n = all.length, avg = f => (all.reduce((a, h) => a + f(h), 0) / n);
const per100 = k => (k / n * 100).toFixed(1);
const perfect = all.filter(h => !h.titles).length;
let streak = 0, bestStreak = 0; for (const h of all) { streak = h.titles ? 0 : streak + 1; bestStreak = Math.max(bestStreak, streak); }
const dist = {}; for (const h of all) dist[h.best] = (dist[h.best] || 0) + 1;
console.log(`Wall report: ${n} seasons (${W} world${W === 1 ? '' : 's'} of ${N})`);
console.log(`  perfect seasons (no title conceded): ${per100(perfect)} in 100${W === 1 ? `   longest streak: ${bestStreak}` : ''}`);
console.log(`  titles conceded per season: ${avg(h => h.titles).toFixed(2)}`);
console.log(`  badges conceded per season: ${avg(h => h.badges).toFixed(1)} (of ${(avg(h => h.field) * 8).toFixed(0)} possible, ${avg(h => h.field).toFixed(1)} challengers)`);
console.log(`  challengers finishing the circuit per season: ${avg(h => h.qualifiers).toFixed(2)}`);
console.log(`  challengers out on three losses per season: ${avg(h => h.out).toFixed(1)}`);
console.log('  how far the best challenger got (seasons in 100):');
for (const d of Object.keys(dist).map(Number).sort((a, b) => a - b)) console.log(`    ${g.depthName(d).padEnd(26)} ${per100(dist[d]).padStart(5)}`);
console.log(`  average: ${avg(h => h.best).toFixed(1)} (8 = all badges, 12 = beat the Elite Four, 13 = won the title)`);
console.log('  tries each gym turned back (share of all tries there):');
console.log('    ' + gyms.map((x, i) => `#${i + 1} ${x.held + x.lost ? Math.round(x.held / (x.held + x.lost) * 100) : 0}%`).join('  '));
