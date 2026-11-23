// (0.50.0) the multi-year sim managing your League: node tests/simauto.js [years=6]
// For each choice (leave it, wall-builder, star-maker, money-maker) a three-League world with League 0 founded by hand
// is played the way the Sim multiple years window plays it (S.simRun set, challenges approved, vacancies filled).
// Checks: left alone, your League builds nothing and buys no bans; managed, it spends (buildings or bans) and the
// monthly step runs; your steers are never changed; a ranch Pokémon named in a team plan is never a spare; nothing
// happens outside the sim (S.simRun unset). Prints `ok`.
const g = require(require('path').join(__dirname, '..', 'dist', 'engine-node.js'));
const YEARS = +process.argv[2] || 6;
const fail = m => { console.log('FAIL ' + m); process.exit(1); };
const out = [];
for (const aim of ['', 'wall', 'star', 'money']) {
  g.seedRandom(11);
  g.newWorld({ leagues: 3, growth: false, god: false, hand: true });
  g.foundingFill(); g.finishFounding();
  const S = () => g.S, me = g.ME();
  S().simAuto = aim || undefined;
  // a steer set by hand, to check it is left alone
  g.inLeague(me, () => { g.setSteer('gym:0', 'bulk'); });
  const steer0 = g.inLeague(me, () => JSON.stringify(S().steer));
  // outside the sim nothing is managed
  if (g.inLeague(me, () => g.simAutoAim())) fail('managed outside the sim');
  const snap = () => g.inLeague(me, () => ({ money: S().fin.money, built: g.estateCost(), bans: g.paidBans().length }));
  const a = snap(), m0 = g.AUTO_LOG.months;
  let maxBuilt = a.built, planChecked = 0;
  for (let y = 0; y < YEARS; y++) {
    S().simRun = true;
    g.approveAllChallenges(); g.fillAllVacancies();
    const yr = S().season; let guard = 0;
    while (S().season === yr && guard++ < g.YEAR_WEEKS + 2) {
      g.simWeek();
      g.inLeague(me, () => { maxBuilt = Math.max(maxBuilt, g.estateCost()); });
    }
    g.approveAllChallenges(); g.fillAllVacancies();
    delete S().simRun;
    if (g.inLeague(me, () => JSON.stringify(S().steer)) !== steer0) fail(`${aim || 'off'}: your steers changed in year ${yr}`);
    // a planned, unfielded ranch Pokémon is never a spare
    g.inLeague(me, () => {
      const e = S().ranch && S().ranch.mons.find(x => x.at == null && !x.res && !x.lock);
      if (!e) return;
      const P = g.plansState(); P.posts.champion = P.posts.champion || {}; const keep = P.posts.champion.on;
      P.posts.champion.on = [...(keep || []), { r: e.uid }];
      for (const k of g.AIM_KEYS) if (g.ranchSpares(k).includes(e)) fail('a planned ranch Pokémon counted as a spare');
      P.posts.champion.on = keep; if (!keep) delete P.posts.champion; planChecked++;
    });
  }
  const b = snap(), months = g.AUTO_LOG.months - m0;
  if (!aim) {
    if (months) fail('managed with Leave it chosen');
    if (maxBuilt > a.built) fail('your League built something while left alone');
    if (b.bans > a.bans) fail('your League paid for a ban while left alone');
  } else {
    if (months < YEARS * 10) fail(`${aim}: the monthly step ran only ${months} times`);
    if (maxBuilt <= a.built && b.bans <= a.bans) fail(`${aim}: managed, but nothing was built or banned`);
  }
  out.push(`${aim || 'off'}: money ${Math.round(a.money)} -> ${Math.round(b.money)}, built ${a.built} -> ${b.built}, bans ${a.bans} -> ${b.bans}, months ${months}, plan checks ${planChecked}`);
}
console.log(out.join('\n'));
console.log('auto', JSON.stringify(g.AUTO_LOG));
console.log('ok');
