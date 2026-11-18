// ================= NEW YEAR =================
// The year is the unit the wall is scored on: a perfect year is one with no title conceded, and the streak counts
// perfect years. At New Year each League's wall report goes into its history, the awards are given, the meta
// report and the ban vote are settled, and the World Championship is held. Nothing else stops.
function newYear() {
  const changes = S.yearChanges || []; S.yearChanges = [];
  eachLeague(i => {
    const ch = [];
    leagueNewYear(ch);
    changes.push(...(nLeagues() > 1 ? ch.map(x => `${lgShort(i)}: ${x}`) : ch));
  });
  sponsorNewYear(); // (0.17.0) each League's contenders that year, into its history entry
  checkGrandSlams();
  slamReturns(changes);
  legendDepartures();
  S.worlds = null;
  if (nLeagues() > 1) worldChampionship();
  S.changes = changes; S.progress = S.yearProgress || {}; S.yearProgress = {};
  settleBanVote();
  for (const t of Object.values(S.trainers)) if (t.role !== 'retired' && t.role !== 'prospect') { t.seasons = (t.seasons || 0) + 1; t.weekLog = []; }
  cityNewYear(); // (0.15.0) city standing from the year's gym records, fading, and who controls each city
  prestigeNewYear(); // (0.17.0) each League's prestige
  S.season++; S.week = 0; S.dexSeason = {};
  eachLeague(() => {
    S.lastLeague = S.league; S.league = null;
    if (S.lastLeague) S.lastLeague.logs = S.lastLeague.logs.slice(-TITLE_LOGS);
    enforceBans();
    S.gyms.forEach(g => { g.w = 0; g.l = 0; g.out = 0; g.beat = {}; });
    gmemPrune();
    S.stats = { ko: {}, use: {} };
    for (const id of staffIds()) { const t = T(id); t.badges = []; relevelElite(t); }
  });
  foldNewYear(); // (0.18.0) a League in the red too long folds
  worldGrowth();
  const circ = eachLeague(() => S.challengers.length);
  news(`Year ${S.season} begins: ${nLeagues() > 1 ? circ.map((n, i) => `${n} challengers in the ${leagueName(i)}`).join(', ') : circ[0] + ' challengers on the circuit'}.`, 'league');
  stopFor('newyear', `Year ${S.season - 1} is over.`);
}
// the year report's detail (0.8.0), kept in the year's history entry: each gym (its leader at year's end, everyone
// who led it or was a gym trainer there, tries turned back by gym trainers and by the leader, badges conceded),
// each Elite Four seat and the Champion's (everyone who held it, runs faced and stopped), every run at the Elite Four
// ([id, week, stage]) and the year's ten furthest challengers ([id, how far, runs])
function yearDetail(L) {
  noteHolders();
  const gyms = S.gyms.map((gym, g) => { const y = yearGym(g), t = T(gym.leader);
    return { leader: gym.leader, type: t ? typeLabel(t) : '', acting: !!gym.acting, lead: y.lead.slice(), gt: y.gt.slice(), by: { ...y.by }, wl: y.wl, wt: y.wt, l: gym.l, sb: y.sb ? y.sb.map(x => x.slice()) : [[0, 0], [0, 0], [0, 0]] }; });
  const seats = [...S.e4, S.champion].map((id, k) => { const t = T(id);
    return { id, type: t ? typeLabel(t) : '', acting: !!(t && t.acting), held: (L.seats[k] || []).slice(), faced: L.entries.filter(e => e.stage >= k).length, stopped: L.entries.filter(e => e.stage === k).length }; });
  // (0.11.0) anyone who ran this year, staff included: a title winner hired mid-year stays in the top ten
  const ran = new Set([...S.challengers, ...L.entries.map(e => e.id)]);
  const top = [...ran].map(T).filter(t => t && t.yr && t.yr.season === S.season && (t.yr.runs || yearDepth(t)))
    .map(t => [t.id, yearDepth(t), t.yr.runs || 0, ovr(t)]).sort((a, b) => b[1] - a[1] || b[3] - a[3]).slice(0, 10).map(x => x.slice(0, 3));
  return { gyms, seats, runsE4: L.entries.map(e => [e.id, e.week, e.stage]), top };
}
// one League's New Year: the wall report, the awards, the gyms' year and the meta
function leagueNewYear(changes) {
  const L = yearLeague();
  const deepest = L.entries.filter(e => e.stage < 5).sort((a, b) => b.stage - a.stage)[0];
  const meta = metaMons();
  if (booksOn()) S.banBallot = null; else buildBanBallot(); // (0.15.0) a League with books bans for money, by its aim
  // the year's wall report: titles and badges conceded, how far the best challenger got (0 to 8 badges, 9 to 12
  // for each Elite Four member beaten, 13 for beating the Champion), runs that ended on three losses
  const best = T(L.bestId);
  L.report = { badges: S.gyms.reduce((a, g) => a + g.l, 0), titles: L.conceded.length, best: L.best, bestId: L.bestId, out: L.out, runs: L.runs, field: S.challengers.length };
  moneyNewYear(L.report.titles);
  news(L.report.titles ? `Year ${S.season} wall report: ${L.report.titles} title${L.report.titles === 1 ? '' : 's'} conceded, ${L.report.badges} badges conceded.` : `Year ${S.season} wall report: a perfect year! No title conceded, ${L.report.badges} badges conceded${best ? `; ${dn(best)} got furthest (${depthName(L.report.best)})` : ''}.`, 'title');
  S.history.push({
    season: S.season, name: S.lgName, champ: S.champion, champWasNew: !!S.history.length && S.history[S.history.length - 1].champ !== S.champion,
    titles: L.report.titles, badges: L.report.badges, best: L.report.best, bestId: L.report.bestId, out: L.report.out, runs: L.report.runs, field: L.report.field, winners: L.conceded.slice(),
    runner: deepest ? deepest.id : null, runnerStage: deepest ? deepest.stage : null,
    qualifiers: L.entries.length, metaMons: meta, steers: JSON.parse(JSON.stringify(steerState())), metaTrend: (S.metaTrend || []).slice(), ...yearDetail(L),
  });
  // every challenger's year: the best they did in any run of it
  const ran = new Set([...S.challengers, ...L.entries.map(e => e.id)]);
  for (const id of ran) {
    const t = T(id); if (!t || t.role === 'retired') continue;
    const y = yearOf(t);
    t.seasonHist.push({ season: S.season, lg: S.lg || 0, badges: Math.max(y.b, t.role === 'challenger' && t.rest == null ? t.badges.length : 0), stage: y.st, ovr: ovr(t), pts: y.pts, runs: y.runs });
  }
  if (!ran.has(S.champion)) T(S.champion).seasonHist.push({ season: S.season, lg: S.lg || 0, role: 'champion', ovr: ovr(T(S.champion)), pts: 0 });
  // the year's awards
  { const aw = seasonAwards(L); S.history[S.history.length - 1].awards = aw;
    if (aw.length) news(`Year ${S.season} awards: ${aw.map(a => `${AWARDS[a.k].name}, ${a.sp ? a.name + "'s " + a.sp : a.name}`).join('; ')}.`, 'title');
    legendOffseason(L, aw); }

  // --- the gyms' year
  const holdOf = g => { const p = g.w + g.l; return p ? g.w / p : 1; }, holdRank = S.gyms.map(holdOf).sort((a, b) => b - a);
  S.gyms.forEach((g, i) => {
    const t = T(g.leader); const played = g.w + g.l; const hold = played ? g.w / played : 1;
    g.hist.push({ season: S.season, w: g.w, l: g.l, leader: t.id });
    // a poor year = the gym held fewer than 30% of 12+ tries. (Three in a row cost a leader the gym in the source;
    // switched off with AUTO_STAFF_MOVES.)
    const poor = played >= 12 && hold < 0.3;
    if (g.poorFor !== t.id) { g.poorFor = t.id; g.poor = 0; }
    g.poor = poor ? (g.poor || 0) + 1 : 0;
    // an exceptional year: one of the three best-holding gyms (10+ tries). (0.10.0) After COMEBACK_STREAK of them in a
    // row a leader's ambition may turn to another run as a challenger (driftAmbition, on their birthday)
    const wall = played >= 10 && holdRank.indexOf(hold) <= 2;
    t.wallStreak = wall ? (t.wallStreak || 0) + 1 : 0;
    let leave = null, stepDown = false;
    if (AUTO_STAFF_MOVES && g.poor >= 3) { leave = `after three straight poor years at ${townName(i)} Gym (${g.w} of ${played} held this year)`; stepDown = true; }
    if (!leave) {
      if (played >= 10 && hold >= 0.7) { for (const k of RK) t.r[k] = clamp(t.r[k] + ri(0, 2), 1, 99); t.pot = Math.max(t.pot, ovr(t)); changes.push(`${townName(i)} Gym (${dn(t)}) earned a reputation as a wall: ${g.w}–${g.l} this year.`); }
      else if (AUTO_STAFF_MOVES && poor) { for (const k of RK) t.r[k] = clamp(t.r[k] + ri(1, 4), 1, 99); changes.push(`${dn(t)} rebuilt ${townName(i)} Gym's training program after going ${g.w}–${g.l}${g.poor === 2 ? '. One more poor year and the League will replace them' : ''}.`); }
      return;
    }
    if (stepDown && !retiresOnLosingPost(t)) { g.leader = null; returnToCircuit(t, `stepped down as ${townName(i)} Gym Leader ${leave}`); }
    else retire(t, leave);
    fillGym(i, changes);
  });
  // every gym is brought back to two trainers of its leader's type
  S.gyms.forEach((g, i) => staffGym(i));

  // --- poor years (0.9.0): each gym's run of poor years and the Elite Four's worst record go into the year's report;
  // a League nobody staffs by hand replaces poor staff, the player only sees the warning. Gym trainer outsiders
  // nobody picked join the circuit.
  { const h = S.history[S.history.length - 1];
    S.gyms.forEach((g, i) => { if (h.gyms && h.gyms[i]) h.gyms[i].poor = g.poorFor === g.leader ? g.poor || 0 : 0; });
    replacePoorStaff(changes, noteE4Records(h));
    S.gyms.forEach((g, i) => flushGymOutsiders(i)); }
  // --- seat challenges (0.11.0): at most one for the Champion's seat and one for an Elite Four seat
  seatChallenges(changes);

  // --- the meta report. Staff no longer swap in off-type counters for the year's top Pokémon: how a League
  // answers the meta is to be redesigned (design doc, open items), and until then a gym stays on its type.
  if (meta.length) {
    S.metaMons = meta; S.meta = null;
    changes.push(`Year ${S.season}'s top performers on the circuit: ${meta.join(', ')}.`);
    news(`Meta report: ${meta.join(', ')} knocked out the most opponents per battle on the circuit.`, 'meta');
  }
}


// ================= WORLD STRUCTURE =================
// New Leagues open as the years go by. (0.15.0, stage 4) the next League opens in the player's region while it has
// fewer than REGION_CAP, then in a region with none; (0.17.0, stage 5) then in any region with room, and openings are
// driven by founders (below). (0.29.0) No cap on the world (it was 6, MAX_LEAGUES); only REGION_CAP a region.
const REGION_CAP = 2, LEAGUE_MIN_GAP = 8;
const regionsUsed = () => eachLeague(() => S.region);
const regionOrder = () => S.regionOrder || LEAGUE_SETS.map((_, i) => i);
const regionCount = r => regionsUsed().filter(x => x === r).length;
// regions a new League could open in (the player leaving picks from these)
const regionsWithRoom = () => regionOrder().filter(r => regionCount(r) < REGION_CAP);
// (0.31.0) a custom region its creator closed to rival Leagues (solo) only ever holds the player's League
const rivalOk = r => !(LEAGUE_SETS[r] && LEAGUE_SETS[r].solo);
function nextRegion() {
  const home = regionsUsed()[ME()];
  if (rivalOk(home) && regionCount(home) < REGION_CAP) return home;
  const r = regionOrder().find(x => rivalOk(x) && !regionCount(x));
  if (r != null) return r;
  const r2 = regionOrder().find(x => rivalOk(x) && regionCount(x) < REGION_CAP);
  return r2 == null ? null : r2;
}
const regionWord = r => LEAGUE_SETS[r].name.replace(' League', '');
// (0.33.0, design doc 6.10) League names: a region's first seat is `<Region> League` and its second `<seat2> League`,
// unless the region (a custom one) names them in `lgNames`. Every League takes these defaults unless named at setup;
// a name is unique in the world (folded Leagues included): a repeat becomes `New <name>`, then numbered.
const LG_NAME_MAX = 30;
const cleanLgName = s => String(s == null ? '' : s).replace(/[<>&"`\\]/g, '').replace(/\s+/g, ' ').trim().slice(0, LG_NAME_MAX);
function seatLgName(r, second) {
  const reg = LEAGUE_SETS[r]; if (!reg) return 'New League';
  return cleanLgName((reg.lgNames || [])[second ? 1 : 0]) || (second ? `${reg.seat2} League` : reg.name);
}
function lgNamesTaken(except) {
  const a = [];
  for (let i = 0; i < nLeagues(); i++) if (i !== except && (i === (S.lg || 0) || S.leagues[i])) a.push(leagueName(i));
  (S.folded || []).forEach(f => f && a.push(f.name));
  return a.filter(Boolean).map(n => String(n).toLowerCase());
}
function uniqueLgName(name, except) {
  name = cleanLgName(name) || 'New League';
  const taken = lgNamesTaken(except), free = n => !taken.includes(n.toLowerCase());
  if (free(name)) return name;
  if (free('New ' + name)) return 'New ' + name;
  for (let k = 2; ; k++) if (free(`New ${name} ${k}`)) return `New ${name} ${k}`;
}
// your League any time; a rival only with the setup option Rename rival Leagues (S.cfg.renameAny). The old name is
// kept on the League (`oldNames`) and each year's history entry keeps the name it had then
function canRename(i) { return i === ME() || !!(S.cfg && S.cfg.renameAny); }
function renameLeague(i, name) {
  if (!Number.isInteger(i) || i < 0 || i >= nLeagues()) return 'No such League.';
  if (!canRename(i)) return 'Rival Leagues can be renamed only with Rename rival Leagues on (Advanced options at setup).';
  const n = cleanLgName(name); if (!n) return 'Give it a name.';
  const old = leagueName(i); if (n === old) return null;
  if (lgNamesTaken(i).includes(n.toLowerCase())) return `There is already a League called ${n}.`;
  inLeague(i, () => { (S.oldNames = S.oldNames || []).push({ name: old, to: S.season }); S.lgName = n; });
  news(`The ${old} is now the ${n}.`, 'league');
  return null;
}
const nextRegionName = () => { const r = nextRegion(); return r == null ? null : uniqueLgName(seatLgName(r, regionsUsed().includes(r))); };
// (0.17.0, stage 5) prestige: one scale for trainers and Leagues. A trainer's comes from their career (titles, the
// Hall of Fame, badges, years, World titles: the founder score of 0.15.0). A League's is earned each New Year from its
// record (a perfect year, letting through fewer than the world's average, a World Championship, cities controlled, its
// rank by wealth) and fades PRESTIGE_FADE a year. Founding a League (a retiree, or the player leaving) needs
// PRESTIGE_BAR. All provisional.
const PRESTIGE_BAR = 60, PRESTIGE_FADE = 0.1, PRESTIGE_PERFECT = 10, PRESTIGE_LET = 2, PRESTIGE_LET_MAX = 10, PRESTIGE_WORLD = 10, PRESTIGE_CITY = 1, PRESTIGE_RANK = [6, 4, 2, 1];
function trainerPrestige(t) {
  if (!t || !t.career) return 0;
  return Math.round(((t.titleSeasons || []).length || t.career.titles || 0) * 10 + (t.hofN || 0) * 5 + (t.career.badges || 0) / 10 + (t.seasons || 0) / 2 + (t.career.worlds || 0) * 8);
}
const leaguePrestige = i => inLeague(i == null ? (S.lg || 0) : i, () => Math.round(S.prest || 0));
// each New Year, after the World Championship and the cities' year: what each League earned, then the fade
function prestigeNewYear() {
  const hs = eachLeague(() => S.history[S.history.length - 1] || null);
  const lets = hs.map(h => h ? h.titles || 0 : 0), avg = lets.reduce((a, b) => a + b, 0) / Math.max(1, lets.length);
  const wealth = eachLeague(() => S.fin ? S.fin.money + estateCost() : 0);
  const order = wealth.map((w, i) => ({ w, i })).sort((a, b) => b.w - a.w).map(x => x.i);
  const gm = gymMap(), wl = S.worlds && S.worlds.winner != null ? lgOf(T(S.worlds.winner)) : null;
  eachLeague(i => {
    const h = hs[i]; if (!h) return;
    const cities = S.gyms.filter(g => { const c = S.cities[g.city]; return c && cityCtrl(c, gm[g.city] || [i]) === i; }).length;
    const rank = nLeagues() > 1 ? PRESTIGE_RANK[order.indexOf(i)] || 0 : 0;
    const gain = (h.titles === 0 ? PRESTIGE_PERFECT : 0) + (nLeagues() > 1 ? Math.min(PRESTIGE_LET_MAX, Math.max(0, avg - lets[i]) * PRESTIGE_LET) : 0)
      + (wl === i ? PRESTIGE_WORLD : 0) + cities * PRESTIGE_CITY + rank + (S.fin && !lapsed() ? sanctLevels() * SANCT_PRESTIGE : 0);
    S.prest = Math.round(((S.prest || 0) * (1 - PRESTIGE_FADE) + gain) * 10) / 10;
    h.prest = S.prest; h.prestGain = Math.round(gain * 10) / 10;
  });
}
// (0.15.0) a distinguished recent retiree founds a new League as a final act: usually its patron in name; rarely, a
// top performer still fit enough takes its Champion's seat, protected for FOUNDER_CHAMP_YEARS
const FOUNDER_RETIRED = 5, FOUNDER_CHAMP_CHANCE = 0.15, FOUNDER_CHAMP_YEARS = 10, FOUNDER_CHAMP_OVR = 70, FOUNDER_ODDS = 0.3;
function pickFounder() {
  return Object.values(S.trainers).filter(t => t.role === 'retired' && !t.founded && S.season - (t.retiredSeason || 0) <= FOUNDER_RETIRED && t.career)
    .sort((a, b) => trainerPrestige(b) - trainerPrestige(a))[0] || null;
}
const founderChamp = t => !!t && t.founderUntil != null && S.season < t.founderUntil;
// open a new League: gyms, Elite Four, a Champion and (when the newcomers arrive) a circuit of challengers. `f` is its
// founder (picked if not given), `r` its region (the next region if not given)
function openNewLeague(f, r) {
  if (r == null) r = nextRegion(); if (r == null || regionCount(r) >= REGION_CAP) return null;
  if (f === undefined) f = pickFounder();
  const i = nLeagues(), reg = LEAGUE_SETS[r], second = regionsUsed().includes(r);
  const champ = f && ((f.titleSeasons || []).length || f.career.titles) && f.retAge <= 55 && ovr(f) >= FOUNDER_CHAMP_OVR && rand() < FOUNDER_CHAMP_CHANCE ? f : null;
  const lgName = uniqueLgName(seatLgName(r, second));
  S.leagues.push({ gyms: [], e4: [], champion: null, challengers: [], history: [], stats: { ko: {}, use: {} }, meta: null, region: r, lgName, seatName: second ? reg.seat2 : reg.seat, founder: f ? f.id : null });
  if (S.cfg) S.cfg.leagues = nLeagues();
  if (champ) unretire(champ);
  inLeague(i, () => foundLeague({ champ }));
  if (f) {
    f.founded = { lg: i, season: S.season, champ: !!champ };
    const text = champ ? `${dn(f)} came out of retirement to found the ${lgName}, and takes its Champion's seat for ${FOUNDER_CHAMP_YEARS} years.` : `${dn(f)} founded the ${lgName} in retirement, a final act of a long career.`;
    news(text, 'league', f.id);
  }
  S.leagueOpened = { i, season: S.season }; S.lastOpen = S.season;
  // its founding field: a class of newcomers of its own, setting out over the first weeks
  for (const id of makeNewcomers(CIRCUIT_SIZE)) { const t = T(id); joinCircuit(t, i); t.rest = S.turn + ri(0, FOUNDING_STAGGER); }
  inLeague(i, () => news(`The ${lgName} opens in Year ${S.season}, with its own gyms, Elite Four and Champion.`, 'league'));
  return i;
}
// (0.17.0, stage 5) each New Year, with the growth option on: once LEAGUE_MIN_GAP years have passed since the last
// opening and there is room, the most prestigious recent retiree over PRESTIGE_BAR may found a League, likelier the
// higher their prestige (FOUNDER_ODDS at the bar, rising to 0.9). No founder, no League.
// (0.18.0) a founder's bar rises with the Leagues already open: FOUNDER_BAR_BASE for the second League, FOUNDER_BAR_STEP
// more for each after (30, 40, 50, 60, 70). The player leaving still needs PRESTIGE_BAR.
const FOUNDER_BAR_BASE = 30, FOUNDER_BAR_STEP = 10;
const founderBar = () => FOUNDER_BAR_BASE + FOUNDER_BAR_STEP * Math.max(0, nLeagues() - 1);
function worldGrowth() {
  if (!S.cfg || !S.cfg.growth || nextRegion() == null) return;
  if (S.season - (S.lastOpen || 0) < LEAGUE_MIN_GAP) return;
  const f = pickFounder(), p = trainerPrestige(f), bar = founderBar();
  if (!f || p < bar) return;
  if (rand() < Math.min(0.9, FOUNDER_ODDS + (p - bar) / bar)) openNewLeague(f);
}
// ---------- god mode: open a League by hand, and edit any trainer ----------
const godOn = () => !!(S && S.cfg && S.cfg.god);
function godOpenLeague() { if (!godOn()) return 'God mode is off.'; if (nextRegion() == null) return 'The world is full.'; return openNewLeague() == null ? 'Could not open a League.' : null; }
function godEdit(id, field, v) {
  if (!godOn()) return 'God mode is off.';
  const t = T(id); if (!t) return 'No such trainer.';
  const num = (lo, hi) => { const n = Math.round(+v); return Number.isFinite(n) ? clamp(n, lo, hi) : null; };
  if (field === 'name') { const s = String(v || '').replace(/[<>&"]/g, '').trim().slice(0, 24); if (!s) return 'A name is needed.'; t.name = s; return null; }
  if (field === 'age') { const n = num(10, 70); if (n == null) return 'Not a number.'; t.age = n; if (startAge(t) > n) t.start = n; return null; }
  if (field === 'pot') { const n = num(1, 99); if (n == null) return 'Not a number.'; t.pot = Math.max(n, ovr(t)); return null; }
  if (RK.includes(field)) { const n = num(1, 99); if (n == null) return 'Not a number.'; t.r[field] = n; if (t.pot < ovr(t)) t.pot = ovr(t); return null; }
  return 'Unknown field.';
}
