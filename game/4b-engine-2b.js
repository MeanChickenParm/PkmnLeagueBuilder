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
    season: S.season, name: S.lgName, posts: postWords(), champ: S.champion, champWasNew: !!S.history.length && S.history[S.history.length - 1].champ !== S.champion,
    titles: L.report.titles, badges: L.report.badges, best: L.report.best, bestId: L.report.bestId, out: L.report.out, runs: L.report.runs, field: L.report.field, winners: L.conceded.slice(),
    runner: deepest ? deepest.id : null, runnerStage: deepest ? deepest.stage : null,
    qualifiers: L.entries.length, metaMons: meta, steers: JSON.parse(JSON.stringify(steerState())), metaTrend: (S.metaTrend || []).slice(), ...yearDetail(L), ...(L.chal ? { chal: L.chal.slice() } : {}), ...(L.seatEv ? { seatEv: L.seatEv.slice() } : {}), seatRule: seatRuleKey(),
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
// (0.41.0, design doc 6.19 part 2) four Leagues a region: each region has four seats (seat, seat2, seat3, seat4)
const REGION_CAP = 4, LEAGUE_MIN_GAP = 8;
const SEAT_KEYS = ['seat', 'seat2', 'seat3', 'seat4'];
const seatOf = (reg, k) => (reg && (reg[SEAT_KEYS[k]] || reg.seat)) || 'League Seat';
// the first of region r's seats no live League holds (League `except` left out); with every seat taken, by count
function freeSeat(r, except) {
  const reg = LEAGUE_SETS[r]; if (!reg) return 0;
  const held = [];
  for (let i = 0; i < nLeagues(); i++) if (i !== except) inLeague(i, () => { if (S.region === r) held.push(S.seatName); });
  const k = SEAT_KEYS.findIndex((_, j) => !held.includes(seatOf(reg, j)));
  return k >= 0 ? k : Math.min(REGION_CAP - 1, held.length);
}
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
// (0.33.0, design doc 6.10) League names: a region's first seat is `<Region> League` and each other seat `<seat> League`
// (0.41.0: four seats), unless the region (a custom one) names them in `lgNames`. Every League takes these defaults
// unless named at setup; a name is unique in the world (folded Leagues included): a repeat becomes `New <name>`, then numbered.
const LG_NAME_MAX = 30;
const cleanLgName = s => String(s == null ? '' : s).replace(/[<>&"`\\]/g, '').replace(/\s+/g, ' ').trim().slice(0, LG_NAME_MAX);
// k: the seat (0 to 3)
function seatLgName(r, k) {
  const reg = LEAGUE_SETS[r]; if (!reg) return 'New League';
  k = k === true ? 1 : k || 0;
  return cleanLgName((reg.lgNames || [])[k]) || (k ? `${seatOf(reg, k)} League` : reg.name);
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
// ================= POST NAMES AND LEAGUE THEMES (0.42.0) =================
// Design doc 6.20. Post names belong to each League (the League field postSet = { theme, names, old }): its own names
// for any of the four posts, else its theme's (THEMES, 3-engine-1), else the region's, else the usual ones. Your League
// sets them at setup and from the League table (a rival's only with Rename rival Leagues); a rival draws a theme by its
// aim and its region, and may rebrand on a big shift (rebuild mode, a lasting change of aim). History keeps the words a
// year was played under (each year's entry carries `posts`; Hall entries `cw`). All numbers provisional.
const POST_KEYS = ['leader', 'gymtrainer', 'e4', 'champion'], POST_MAX = 20;
const AIM_THEMES = { wall: ['dojo', 'court'], star: ['academy', 'classic'], money: ['board'] };
// built-in regions' leanings (a custom region names its own in the editor: `themes`)
const REGION_THEMES = { Kanto: ['classic'], Johto: ['classic'], Kalos: ['court'], Galar: ['court'], Paldea: ['academy'], Unova: ['board'], Alola: ['island'] };
const THEME_LEAN = 2.5, THEME_REGION_OWN = 2.5, REBRAND_ODDS = 0.5;
const THEME_LOG = { picked: 0, rebrands: 0, set: 0 };
const cleanPost = x => String(x == null ? '' : x).replace(/[<>&"`\\]/g, '').replace(/\s+/g, ' ').trim().slice(0, POST_MAX);
const regionThemes = r => { const reg = LEAGUE_SETS[r]; return (reg && (reg.themes || REGION_THEMES[regionWord(r)])) || []; };
// the odds of each theme for a League in region r with aim `aim`
function themeWeights(r, aim) {
  const reg = LEAGUE_SETS[r] || {}, lean = AIM_THEMES[aim] || [], rl = regionThemes(r);
  return THEME_KEYS.map(k => ({ k, w: 1 + (lean.includes(k) ? THEME_LEAN : 0) + (rl.includes(k) ? THEME_LEAN : 0) + (k === 'region' && reg.posts ? THEME_REGION_OWN : 0) }));
}
function pickTheme(r, aim, not) {
  const ws = themeWeights(r, aim).filter(x => x.k !== not), tot = ws.reduce((a, x) => a + x.w, 0);
  let v = rand() * tot; for (const x of ws) { v -= x.w; if (v <= 0) return x.k; }
  return ws[ws.length - 1].k;
}
// the bound League (a rival) draws its theme, unless it already has one (set at setup)
function drawTheme() {
  if (S.postSet && S.postSet.theme) return;
  S.postSet = { theme: pickTheme(S.region, S.fin && S.fin.aim), names: {} }; THEME_LOG.picked++;
}
// r (when given): the League's region; a name the same as the theme's own word there is left to the theme
function normPostSet(ps, r) {
  const theme = ps && THEMES[ps.theme] ? ps.theme : 'region', names = {}, w = r === undefined ? null : themeWords(theme, r);
  for (const k of POST_KEYS) { const v = cleanPost(ps && ps.names && ps.names[k]); if (v && !(w && w[k] === v)) names[k] = v; }
  return { theme, names };
}
const postSetOf = i => { const L = lgState(i); return normPostSet(L && L.postSet); };
// League i takes a theme and its own names (blank: the theme's); returns an error or null
function setPosts(i, theme, names) {
  if (!Number.isInteger(i) || i < 0 || i >= nLeagues()) return 'No such League.';
  if (!canRename(i)) return 'Rival Leagues\' posts can be renamed only with Rename rival Leagues on (Advanced options at setup).';
  if (!THEMES[theme]) return 'No such theme.';
  for (const k of POST_KEYS) { const v = names && names[k]; if (v != null && /[<>&"`\\]/.test(String(v))) return 'Post names can\'t contain < > & " ` or \\.'; if (v != null && String(v).trim().length > POST_MAX) return `Post names can be up to ${POST_MAX} characters.`; }
  const next = normPostSet({ theme, names }, lgRegion(i)), was = postWords(i);
  inLeague(i, () => { (S.postSet = S.postSet || {}).old = S.postSet.old || []; const old = S.postSet.old; S.postSet = Object.assign(next, { old }); });
  const now = postWords(i);
  if (POST_KEYS.some(k => now[k] !== was[k])) {
    inLeague(i, () => S.postSet.old.push({ words: was, to: S.season }));
    news(`The ${leagueName(i)}'s posts are now ${now.leader}, ${now.gymtrainer}, ${now.e4} and ${now.champion}.`, 'league');
  }
  THEME_LOG.set++;
  return null;
}
// a theme's four words in region r (null: no region yet), for placeholders
function themeWords(theme, r) {
  const th = THEMES[theme], rp = r != null && LEAGUE_SETS[r] && LEAGUE_SETS[r].posts;
  return Object.fromEntries(POST_KEYS.map(k => [k, (th && th.posts && th.posts[k]) || (rp && rp[k]) || POST_WORDS[k]]));
}
// a rival rebrands (a fresh draw, REBRAND_ODDS of the time) when it enters rebuild mode or its aim changes for good
function maybeRebrand(why) {
  if (!S.fin || !S.fin.aim || fixedStaff() || rand() >= REBRAND_ODDS) return false;
  const was = postWords(), cur = (S.postSet && S.postSet.theme) || 'region', old = (S.postSet && S.postSet.old) || [];
  S.postSet = { theme: pickTheme(S.region, S.fin.aim, cur), names: {}, old };
  const now = postWords();
  if (POST_KEYS.every(k => now[k] === was[k])) return false;
  old.push({ words: was, to: S.season }); THEME_LOG.rebrands++;
  const text = `The ${S.lgName} rebrands ${why}: its ${was.champion} is now its ${now.champion}, and its ${was.e4} the ${now.e4}.`;
  news(text, 'league'); noteChange(text);
  return true;
}
const nextRegionName = () => { const r = nextRegion(); return r == null ? null : uniqueLgName(seatLgName(r, freeSeat(r))); };
// (0.17.0, stage 5) prestige: one scale for trainers and Leagues. A trainer's comes from their career (titles, the
// Hall of Fame, badges, years, World titles: the founder score of 0.15.0). A League's is earned each New Year from its
// record (a perfect year, letting through fewer than the world's average, a World Championship, cities controlled, its
// rank by wealth) and fades PRESTIGE_FADE a year. Founding a League (a retiree, or the player leaving) needs
// PRESTIGE_BAR. All provisional.
const PRESTIGE_BAR = 60, PRESTIGE_FADE = 0.1, PRESTIGE_PERFECT = 10, PRESTIGE_LET = 2, PRESTIGE_LET_MAX = 10, PRESTIGE_WORLD = 10, PRESTIGE_RANK = [6, 4, 2, 1];
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
  const wl = S.worlds && S.worlds.winner != null ? lgOf(T(S.worlds.winner)) : null;
  eachLeague(i => {
    const h = hs[i]; if (!h) return;
    const cities = cityPrestige(i); // (0.40.0) Held and Stronghold cities, by size
    const rank = nLeagues() > 1 ? PRESTIGE_RANK[order.indexOf(i)] || 0 : 0;
    const gain = (h.titles === 0 ? PRESTIGE_PERFECT : 0) + (nLeagues() > 1 ? Math.min(PRESTIGE_LET_MAX, Math.max(0, avg - lets[i]) * PRESTIGE_LET) : 0)
      + (wl === i ? PRESTIGE_WORLD : 0) + cities + rank + (S.fin && !lapsed() ? sanctLevels() * SANCT_PRESTIGE : 0) + (S.ranch ? showcase().prest : 0) + SEAT_PREST * seatOpen(); // (0.43.0) an open seat
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
  const i = nLeagues(), reg = LEAGUE_SETS[r], k = freeSeat(r);
  const champ = f && ((f.titleSeasons || []).length || f.career.titles) && f.retAge <= 55 && ovr(f) >= FOUNDER_CHAMP_OVR && rand() < FOUNDER_CHAMP_CHANCE ? f : null;
  const lgName = uniqueLgName(seatLgName(r, k));
  S.leagues.push({ gyms: [], e4: [], champion: null, challengers: [], history: [], stats: { ko: {}, use: {} }, meta: null, region: r, lgName, seatName: seatOf(reg, k), founder: f ? f.id : null });
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
  // (0.41.0) made in its region, so their hometowns are there; they join the region's field at the new League
  for (const id of inLeague(i, () => makeNewcomers(CIRCUIT_SIZE))) { const t = T(id); joinCircuit(t, i); t.rest = S.turn + ri(0, FOUNDING_STAGGER); }
  inLeague(i, () => news(`The ${lgName} opens in Year ${S.season}, with its own gyms, Elite Four and Champion.`, 'league'));
  return i;
}
// (0.17.0, stage 5) each New Year, with the growth option on: once LEAGUE_MIN_GAP years have passed since the last
// opening and there is room, the most prestigious recent retiree over PRESTIGE_BAR may found a League, likelier the
// higher their prestige (FOUNDER_ODDS at the bar, rising to 0.9). No founder, no League.
// (0.18.0) a founder's bar rose with the Leagues already open in the world. (0.41.0, design doc 6.19) it is per region
// now: FOUNDER_BARS by the Leagues already in the region (a region's first or second League 30, its third 50, its fourth
// 70). A founder opens where their prestige clears the bar, in the order nextRegion would choose. The player leaving
// still needs PRESTIGE_BAR. Provisional.
const FOUNDER_BARS = [30, 30, 50, 70];
const founderBar = r => FOUNDER_BARS[Math.min(FOUNDER_BARS.length - 1, regionCount(r == null ? nextRegion() : r))];
// regions with room for a rival League, in the order nextRegion prefers (yours, then empty ones, then any)
function growthRegions() {
  const home = regionsUsed()[ME()], ok = x => rivalOk(x) && regionCount(x) < REGION_CAP;
  const out = ok(home) ? [home] : [];
  for (const x of regionOrder()) if (!out.includes(x) && ok(x) && !regionCount(x)) out.push(x);
  for (const x of regionOrder()) if (!out.includes(x) && ok(x)) out.push(x);
  return out;
}
function worldGrowth() {
  if (!S.cfg || !S.cfg.growth) return;
  if (S.season - (S.lastOpen || 0) < LEAGUE_MIN_GAP) return;
  const f = pickFounder(), p = trainerPrestige(f);
  if (!f) return;
  const r = growthRegions().find(x => p >= founderBar(x)); if (r == null) return;
  const bar = founderBar(r);
  if (rand() < Math.min(0.9, FOUNDER_ODDS + (p - bar) / bar)) openNewLeague(f, r);
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
// ================= SEAT RULES (0.43.0) =================
// Design doc 6.21. Each League has a rule for how its Champion's seat changes hands (the League field seatRule =
// { k, every, next, at, term, lobby, pick }): Protected (the rules of 0.34.0: called challenges, title claims, the
// Champion's own ambitions), Succession (the top-ranked Elite Four member, the highest seat, moves up when the seat
// empties), Champion's Cup and Open Cup (a tournament every few years; the Open Cup invites title winners and the
// circuit's best), Gauntlet (each New Year the strongest willing candidate may try to beat the Elite Four in a row and
// then the Champion), Merit (every few years the seat goes to whoever stopped the largest share of runs), Council vote
// (every few years, and whenever the seat empties, the Elite Four vote; the manager can lobby), Term (the Champion
// serves a set number of years, then the manager appoints from the contenders) and Conqueror (the year's strongest title
// winner who wants it takes the seat at New Year). Called challenges and title claims are only for Protected Leagues.
// The manager sets each scheduled rule's timing (SEAT_EVERY years). Changing the rule costs SEAT_CHANGE_PREST prestige
// and can't be done again for SEAT_COOLDOWN years (free while founding). The less control a rule keeps (`open`), the
// more prestige a year, the more challengers it draws and the readier ambitious trainers are to sign; the two Cups sell
// tickets and the Council calms the Elite Four's ambitions. Rivals draw a rule by theme and aim, and may redraw it when
// they rebrand. A founding Champion's window protects the seat from every rule. All numbers provisional.
const SEAT_RULES = {
  protected: { name: 'Protected', open: 0, text: "The seat changes only with your say: you can call challenges against your Champion and answer title claims." },
  succession: { name: 'Succession', open: 0.15, text: 'When the Champion leaves, the highest-ranked Elite Four member (the top seat) moves up. Your control is the Elite Four\'s order.' },
  term: { name: 'Term', open: 0.3, every: 4, text: 'The Champion serves a set term; at its end you appoint the next one from the Elite Four and Gym Leaders (or keep the Champion).' },
  council: { name: 'Council vote', open: 0.45, every: 3, text: 'The Elite Four vote for the Champion on a schedule and whenever the seat empties. You can lobby for a candidate.' },
  merit: { name: 'Merit', open: 0.5, every: 3, text: 'On a schedule, the seat goes to whoever stopped the largest share of runs over that time (the Champion\'s share counts more).' },
  gauntlet: { name: 'Gauntlet', open: 0.6, text: 'Each New Year the strongest willing candidate may try to beat every Elite Four member in a row, then the Champion.' },
  cup: { name: "Champion's Cup", open: 0.6, every: 2, text: 'On a schedule, the Champion, the Elite Four and the best Gym Leaders play a tournament; the winner takes the seat. Sells tickets.' },
  opencup: { name: 'Open Cup', open: 0.85, every: 2, text: 'The Cup, open to title winners and the circuit\'s best. Bigger gate and prestige; an outsider can win the seat.' },
  conqueror: { name: 'Conqueror', open: 1, text: 'A title winner takes the seat, as in the main games: Instant, whoever beats the Champion takes it on the spot (no grace for a new Champion); At New Year, the year\'s strongest title winner who wants it.' },
};
const RULE_KEYS = Object.keys(SEAT_RULES);
const SEAT_EVERY_MIN = 1, SEAT_EVERY_MAX = 6, SEAT_CHANGE_PREST = 5, SEAT_COOLDOWN = 2;
const SEAT_PREST = 3, SEAT_HUNGRY = 0.25, DRAW_SEAT = 0.5;
const CUP_GATE = { cup: 40000, opencup: 80000 }, CUP_OPEN_PREST = 1, CUP_LEADERS = 3, CUP_INVITES = 2;
const COUNCIL_LOBBY = 20000, COUNCIL_LOBBY_MAX = 3, COUNCIL_SWAY = 4, COUNCIL_INC = 3, COUNCIL_CALM = 24;
const MERIT_MIN = 4, MERIT_CHAMP = 1.5, MERIT_EDGE = 0.05, TERM_ANSWER = 8, TERM_INC = 3, CONQ_WANT = 0.25, CONQ_NOW_AI = 0.5; // (0.46.0) CONQ_NOW_AI: a rival's odds of an Instant Conqueror
// rivals: a theme or an aim leans to some rules (SEAT_LEAN each), every rule keeps a share
const THEME_SEATS = { dojo: ['gauntlet'], court: ['succession'], board: ['council'], academy: ['merit'], classic: ['conqueror', 'cup'], island: ['gauntlet'] };
const AIM_SEATS = { wall: ['protected', 'merit'], star: ['cup', 'opencup', 'conqueror'], money: ['opencup', 'cup', 'council'] };
const SEAT_LEAN = 2, SEAT_REDRAW = 0.5;
const SEAT_LOG = { drawn: 0, changed: 0, redrawn: 0, cups: 0, gauntlets: 0, gauntletWon: 0, merit: 0, votes: 0, terms: 0, conquer: 0, conquerNow: 0, conqDrop: 0, handovers: 0, lobbies: 0, heirs: 0 };
const seatSched = k => !!(SEAT_RULES[k] && SEAT_RULES[k].every);
function normSeatRule(sr) {
  const k = sr && SEAT_RULES[sr.k] ? sr.k : 'protected';
  const every = seatSched(k) ? clamp(Math.round(+(sr && sr.every) || SEAT_RULES[k].every), SEAT_EVERY_MIN, SEAT_EVERY_MAX) : null;
  return { k, every, now: k === 'conqueror' && !!(sr && sr.now) }; // (0.46.0) now: an Instant Conqueror
}
// the bound League's rule (made on first use)
function seatRule() {
  if (!S.seatRule || !SEAT_RULES[S.seatRule.k]) S.seatRule = Object.assign(normSeatRule(S.seatRule), { at: null, next: null });
  const r = S.seatRule;
  if (seatSched(r.k) && r.next == null) r.next = (S.season || 1) + r.every;
  return r;
}
const seatRuleKey = () => seatRule().k;
const seatRuleOf = i => { const L = lgState(i); return normSeatRule(L && L.seatRule); };
const seatOpen = i => SEAT_RULES[seatRuleOf(i).k].open;
// a rule's name (in an island-trial League the Gauntlet is the Grand Trial)
function seatRuleName(k, lg) { return k === 'gauntlet' && themeOf(lg) === THEMES.island ? 'Grand Trial' : (SEAT_RULES[k] || SEAT_RULES.protected).name; }
const seatLocked = () => founderChamp(T(S.champion));
function seatRec(rec) {
  const h = S.history.find(e => e.season === rec.season);
  if (h) (h.seatEv = h.seatEv || []).push(rec); else (yearLeague().seatEv = yearLeague().seatEv || []).push(rec);
}
function pickSeatRule(not) {
  const th = Object.keys(THEMES).find(k => THEMES[k] === themeOf()), lean = [...(THEME_SEATS[th] || []), ...(AIM_SEATS[S.fin && S.fin.aim] || [])];
  const ws = RULE_KEYS.filter(k => k !== not).map(k => ({ k, w: 1 + lean.filter(x => x === k).length * SEAT_LEAN }));
  let v = rand() * ws.reduce((a, x) => a + x.w, 0);
  for (const x of ws) { v -= x.w; if (v <= 0) return x.k; }
  return ws[ws.length - 1].k;
}
// a rival's rule, drawn by its theme and aim with its own timing (unless set at setup)
function drawSeatRule() {
  if (S.seatRule && SEAT_RULES[S.seatRule.k]) return;
  const k = pickSeatRule(), every = seatSched(k) ? clamp(SEAT_RULES[k].every + ri(-1, 1), SEAT_EVERY_MIN, SEAT_EVERY_MAX) : null;
  S.seatRule = { k, every, now: k === 'conqueror' && rand() < CONQ_NOW_AI, at: null, next: every ? (S.season || 1) + every : null }; SEAT_LOG.drawn++;
}
// a rival may take a new rule when it rebrands (rebuild mode, a lasting change of aim, new management)
function maybeRedrawSeat(why) {
  if (!S.fin || !S.fin.aim || fixedStaff() || rand() >= SEAT_REDRAW) return false;
  const was = seatRuleKey(); S.seatRule = null; drawSeatRule(); SEAT_LOG.drawn--;
  if (seatRuleKey() === was) return false;
  SEAT_LOG.redrawn++;
  const text = `The ${S.lgName} changes how its ${postWord('champion')} is chosen ${why}: ${seatRuleName(was)} gives way to ${seatRuleName(seatRuleKey())}.`;
  news(text, 'league'); noteChange(text);
  return true;
}
// why the player can't change their rule now, or null (the timing alone can always be changed)
function seatChangeBlock() {
  return inLeague(ME(), () => {
    if (!handOn()) return 'No League of yours.';
    if (S.founding) return null;
    const r = seatRule();
    if (r.at != null && S.season - r.at < SEAT_COOLDOWN) return `You changed the rule in year ${r.at}; it can change again from year ${r.at + SEAT_COOLDOWN}.`;
    return null;
  });
}
// the player sets their rule (k) and its timing (every, in years; for the Conqueror, now: Instant); returns an error or null
function setSeatRule(k, every, now) {
  if (!SEAT_RULES[k]) return 'No such rule.';
  return inLeague(ME(), () => {
    const r = seatRule(), same = r.k === k, n = normSeatRule({ k, every, now });
    if (!same) {
      const b = seatChangeBlock(); if (b) return b;
      const was = r.k, free = !!S.founding;
      if (!free) S.prest = Math.max(0, (S.prest || 0) - SEAT_CHANGE_PREST);
      S.seatRule = { k, every: n.every, now: n.now, at: free ? null : S.season, next: n.every ? S.season + n.every : null, term: k === 'term' ? S.season + n.every : null };
      (S.chalPending || []).filter(x => x.k === 'champ' && (x.called || x.from === 'claim')).forEach(x => { S.chalPending.splice(S.chalPending.indexOf(x), 1); const c = T(x.cand); if (c) { c.claimOn = null; c.chalAt = null; } chalRecord(x, { lapsed: true }); });
      SEAT_LOG.changed++;
      if (!free) { const text = `The ${S.lgName} changed how its ${postWord('champion')} is chosen: ${seatRuleName(was)} gives way to ${seatRuleName(k)} (${SEAT_CHANGE_PREST} prestige).`; news(text, 'league'); noteChange(text); }
      return null;
    }
    if (k === 'conqueror') r.now = n.now; // the timing alone is free
    if (n.every && n.every !== r.every) { r.every = n.every; r.next = S.season + n.every; if (k === 'term' && r.term != null) r.term = Math.min(r.term, S.season + n.every); }
    return null;
  });
}
// ---- handing the seat over ----
// cand takes the Champion's seat: the old Champion takes their Elite Four seat or gym, or (cand from the circuit) leaves
// the post as after a claim. Returns the words, or null
// (0.46.0) conq: an Instant Conqueror's hand-over: the beaten Champion drops into a free Elite Four seat (your League's
// vacancy) if there is one, else leaves with a grudge
function seatHandOver(c, how, conq) {
  const inc = T(S.champion); if (!inc || !c || c.id === inc.id) return null;
  c.claimOn = null; SEAT_LOG.handovers++;
  const e4k = S.e4.indexOf(c.id), gi = S.gyms.findIndex(g => g.leader === c.id && !g.acting), cw = postWord('champion');
  let fate;
  if (e4k >= 0) { S.e4[e4k] = null; S.champion = null; inc.e4Poor = 0; installElite(c, 'champion'); installElite(inc, 'e4', e4k); fate = `takes ${c.name}'s ${postWord('e4')} seat (#${e4k + 1})`; }
  else if (gi >= 0) { S.gyms[gi].leader = null; S.champion = null; installElite(c, 'champion'); installElite(inc, 'leader', gi); staffGym(gi); fate = `takes over ${townName(gi)} ${gymWord()} (${typeLabel(inc)})`; }
  else if (conq && freeE4Vacancy()) {
    const v = freeE4Vacancy(), a = T(S.e4[v.slot]);
    if (v.incoming != null) cancelIncoming(v, `${inc.name} took the seat`);
    S.champion = null; inc.e4Poor = 0;
    if (a && a.acting) { S.e4[v.slot] = null; a.acting = false; retire(a, `after standing in on the ${postWord('e4')}`); }
    S.e4[v.slot] = null;
    installElite(c, 'champion'); installElite(inc, 'e4', v.slot);
    S.vacancies = S.vacancies.filter(x => x !== v);
    const rest = (v.outsiders || []).filter(x => T(x) && T(x).role === 'prospect'); rest.forEach(x => { T(x).outsider = false; }); fillCircuits(rest);
    SEAT_LOG.conqDrop++;
    fate = `drops into the empty ${postWord('e4')} seat (#${v.slot + 1})`;
  }
  else {
    S.champion = null; inc.role = 'exchamp'; inc.letGoAt = S.turn; inc.deposedBy = c.id;
    retireOrReturn(inc, `lost the ${cw}'s seat to ${c.name}`);
    if (conq && inc.role !== 'retired') { inc.grudge = S.season; inc.grudgeLg = S.lg || 0; }
    let away = null;
    if (inc.role !== 'retired' && nLeagues() > 1) { away = pick(Array.from({ length: nLeagues() }, (_, i) => i).filter(i => i !== (S.lg || 0) && !(S.founding && i === ME()))); if (away != null) shiftLeague(inc, away); }
    installElite(c, 'champion');
    fate = inc.role === 'retired' ? 'retired' : away != null ? `is heading to the ${leagueName(away)}'s circuit` : 'is heading back to the badge circuit';
  }
  // (0.48.0) someone who just won the seat came for it: no asking for another run the same week (a rival League would grant it at once)
  if (c.wish && c.wish.k === 'run') c.wish = { k: 'stay', since: S.turn };
  return `${c.name} ${how} and is the new ${cw} of the ${S.lgName}. ${inc.name} ${fate}.`;
}
// a temporary team for a seat battle: a Gym Leader topped up to six, a challenger at the level; returns the undo
function seatTeam(t, lvl) {
  const keep = t.team;
  if (t.role === 'leader') {
    t.team = t.team.slice();
    if (t.team.length < E4_SIZE) staffPicks(t, lvl, E4_SIZE - t.team.length, { lines: t.team.map(m => LINE[m.sp]), team: t.team, mixed: !t.specialty }).forEach(m => t.team.push(stamp(m, 'assigned')));
    return () => { t.team = keep; };
  }
  if (t.role === 'challenger') { setTeamLevel(t, lvl); return () => setTeamLevel(t, challengerLevel(t)); }
  return () => {};
}
// one seat battle between a and b at lvl; returns the winner (kept in S.seatLogs when keep)
function seatBattle(a, b, lvl, title, keep) {
  const ua = seatTeam(a, lvl), ub = seatTeam(b, lvl);
  const res = setBattle(a, b, lvl, 'league', title);
  ua(); ub();
  if (keep) { res.at = S.turn; res.cand = a.id; res.when = { season: S.season, week: S.week }; (S.seatLogs = S.seatLogs || []).push(res); if (S.seatLogs.length > SEAT_LOGS) S.seatLogs.shift(); }
  return res.winner === 0 ? a : b;
}
const seatCands = () => S.e4.map(T).filter(t => t && !t.acting);
const leaderCands = () => S.gyms.map((g, i) => ({ t: T(g.leader), i, g })).filter(x => x.t && !x.g.acting);
// ---- the rules at New Year (from seatChallenges) ----
function seatRuleNewYear(changes) {
  const r = seatRule(), ch = T(S.champion);
  if (!ch || seatLocked() || r.k === 'protected' || r.k === 'succession') return;
  const due = seatSched(r.k) && S.season >= r.next, say = t => { if (!t) return; changes.push(t); news(t, 'title', S.champion); noteChange(t); if (playerLeague()) stopFor('challenge', t); };
  if (due) r.next = S.season + r.every;
  if ((r.k === 'cup' || r.k === 'opencup') && due) say(seatCup(r.k === 'opencup'));
  else if (r.k === 'merit' && due) say(seatMerit(r.every));
  else if (r.k === 'council' && due) say(seatVote());
  else if (r.k === 'term' && S.season >= (r.term != null ? r.term : (r.term = S.season + r.every))) say(seatTermEnds());
  else if (r.k === 'gauntlet' && !champGrace()) say(seatGauntlet());
  else if (r.k === 'conqueror' && !r.now && !champGrace()) say(seatConquer()); // an Instant Conqueror hands over in leagueRun
}
// the Cup: the Champion, the Elite Four and the best Gym Leaders (the Open Cup: one Gym Leader and invited outsiders)
function seatCup(open) {
  SEAT_LOG.cups++;
  const ch = T(S.champion), field = [ch, ...seatCands()];
  const year = yearLeague(), gyms = leaderCands().sort((a, b) => (b.g.w - b.g.l) - (a.g.w - a.g.l) || ovr(b.t) - ovr(a.t));
  if (open) {
    const winners = [...new Set(year.conceded || [])].map(T).filter(t => claimFree(t)), deep = [...new Set((year.entries || []).map(e => e.id))].map(T).filter(t => claimFree(t) && !winners.includes(t));
    [...winners.sort((a, b) => ovr(b) - ovr(a)), ...deep.sort((a, b) => ovr(b) - ovr(a))].slice(0, CUP_INVITES).forEach(t => field.push(t));
  }
  for (const x of gyms.slice(0, open ? Math.max(1, 8 - field.length) : CUP_LEADERS)) { if (field.length >= 8) break; field.push(x.t); }
  // seeded bracket: the Champion first, then by OVR
  const seeds = [field[0], ...field.slice(1).sort((a, b) => ovr(b) - ovr(a))];
  const order = [0, 7, 3, 4, 1, 6, 2, 5].filter(i => i < seeds.length);
  let round = order.map(i => seeds[i]);
  const name = open ? 'Open Cup' : "Champion's Cup";
  while (round.length > 1) {
    const next = [];
    for (let i = 0; i < round.length; i += 2) next.push(round[i + 1] ? seatBattle(round[i + 1], round[i], CHAMP_LV, `${name} · ${round.length === 2 ? 'Final' : round.length <= 4 ? 'Semi-final' : 'Quarter-final'}`, round.length === 2) : round[i]);
    round = next;
  }
  const w = round[0], gate = CUP_GATE[open ? 'opencup' : 'cup'];
  if (S.fin) book(gate, 'seatcup', `${name} ticket sales: ${money(gate)}.`);
  if (open) S.prest = (S.prest || 0) + CUP_OPEN_PREST;
  const kept = w.id === ch.id;
  const text = kept ? `${postWord('champion')} ${ch.name} won the ${name} (${seeds.length} entrants) and keeps the seat.` : seatHandOver(w, `won the ${name} (${seeds.length} entrants)`);
  seatRec({ season: S.season, k: open ? 'opencup' : 'cup', win: w.id, inc: ch.id, kept, n: seeds.length, text });
  return text;
}
// the strongest willing candidate runs the Gauntlet: each Elite Four member in a row, then the Champion
function seatGauntlet() {
  const ch = T(S.champion), out = [];
  leaderCands().forEach(x => { if (canChallenge(x.t) && wantsUp(x.t)) out.push(x.t); });
  seatCands().forEach(t => { if (canChallenge(t) && wantsUp(t) && seatYears(t) >= CHAL_SEAT_YEARS) out.push(t); });
  [...new Set(yearLeague().conceded || [])].map(T).forEach(t => { if (claimFree(t) && canChallenge(t) && wantsSeat(t)) out.push(t); });
  const c = out.sort((a, b) => ovr(b) - ovr(a))[0]; if (!c) return null;
  SEAT_LOG.gauntlets++; c.chalAt = S.season;
  const nm = seatRuleName('gauntlet');
  let beaten = 0;
  for (let k = 0; k < S.e4.length; k++) {
    const e = T(S.e4[k]); if (!e || e.id === c.id) continue;
    if (seatBattle(c, e, E4_LV[k], `${nm} · ${postWord('e4')} #${k + 1}`, false) !== c) {
      chalRestless(c);
      const text = `${c.name} ran the ${nm} and fell to ${e.name} (${postWord('e4')} #${k + 1}) after ${beaten} win${beaten === 1 ? '' : 's'}.`;
      seatRec({ season: S.season, k: 'gauntlet', cand: c.id, inc: ch.id, at: k, text }); return text;
    }
    beaten++;
  }
  const won = seatBattle(c, ch, CHAMP_LV, `${nm} · ${postWord('champion')}`, true) === c;
  let text;
  if (won) { SEAT_LOG.gauntletWon++; text = seatHandOver(c, `ran the ${nm}, beating all ${beaten} of the ${postWord('e4')} and then ${postWord('champion')} ${ch.name},`); }
  else { chalRestless(c); text = `${c.name} beat all ${beaten} of the ${postWord('e4')} in the ${nm}, but ${postWord('champion')} ${ch.name} held the seat.`; }
  seatRec({ season: S.season, k: 'gauntlet', cand: c.id, inc: ch.id, won, text });
  return text;
}
// Merit: over the last `years` years, the share of runs each holder stopped (the Champion's counts MERIT_CHAMP times)
function meritTable(years) {
  const tally = {};
  for (const h of S.history.slice(-years)) (h.seats || []).forEach((s, k) => {
    if (!s || s.id == null) return; const x = tally[s.id] = tally[s.id] || { faced: 0, stopped: 0 };
    x.faced += s.faced || 0; x.stopped += (s.stopped || 0) * (k === 4 ? MERIT_CHAMP : 1);
  });
  return [S.champion, ...seatCands().map(t => t.id)].map(id => ({ id, ...(tally[id] || { faced: 0, stopped: 0 }) }))
    .map(x => ({ ...x, share: x.faced >= MERIT_MIN ? x.stopped / x.faced : null }));
}
function seatMerit(years) {
  SEAT_LOG.merit++;
  const ch = T(S.champion), tab = meritTable(years), mine = tab.find(x => x.id === ch.id), mShare = mine.share == null ? 0 : mine.share;
  const best = tab.filter(x => x.id !== ch.id && x.share != null).sort((a, b) => b.share - a.share)[0];
  const pct = v => `${Math.round(v * 100)}%`;
  let text, kept = true;
  if (best && best.share > mShare + MERIT_EDGE) { kept = false; text = seatHandOver(T(best.id), `stopped the largest share of runs over ${years} year${years === 1 ? '' : 's'} (${pct(best.share)} against ${pct(mShare)})`); }
  else text = `The ${S.lgName}'s merit review over ${years} year${years === 1 ? '' : 's'} keeps ${postWord('champion')} ${ch.name} in the seat${mine.share != null ? ` (${pct(mShare)} of runs stopped, weighted)` : ''}.`;
  seatRec({ season: S.season, k: 'merit', win: kept ? ch.id : best.id, inc: ch.id, kept, text });
  return text;
}
// a council vote: voters vote for themselves if they want the seat, else for the best other candidate (OVR, the
// incumbent's edge, the manager's lobbying, a little chance); most votes wins, a tie to the incumbent, then OVR
function councilVote(cands, voters, incId) {
  const lob = (S.seatRule && S.seatRule.lobby) || {}, tally = {};
  for (const v of voters) {
    let pickId;
    if (cands.includes(v) && wantsUp(v)) pickId = v.id;
    else pickId = cands.filter(c => c !== v).map(c => ({ c, s: ovr(c) + (c.id === incId ? COUNCIL_INC : 0) + (lob.id === c.id ? lob.n * COUNCIL_SWAY : 0) + rand() * 6 - (v.grudge != null ? 1 : 0) }))
      .sort((a, b) => b.s - a.s).map(x => x.c.id)[0];
    if (pickId != null) tally[pickId] = (tally[pickId] || 0) + 1;
  }
  const win = cands.slice().sort((a, b) => (tally[b.id] || 0) - (tally[a.id] || 0) || (b.id === incId) - (a.id === incId) || ovr(b) - ovr(a))[0];
  return { win, tally };
}
const councilCands = () => { const ch = T(S.champion), lead = leaderCands().filter(x => wantsUp(x.t) && canChallenge(x.t)).sort((a, b) => ovr(b.t) - ovr(a.t))[0];
  return [ch, ...seatCands().filter(t => wantsUp(t) && canChallenge(t)), ...(lead ? [lead.t] : [])].filter(Boolean); };
function seatVote() {
  SEAT_LOG.votes++;
  const ch = T(S.champion), cands = councilCands(), voters = seatCands();
  if (!voters.length) return null;
  const { win, tally } = councilVote(cands, voters, ch.id), votes = tally[win.id] || 0;
  // the Council calms ambition: Elite Four members who wanted the seat wait a little longer before turning restless
  for (const t of voters) if (t !== win && wantsUp(t) && t.wish) t.wish.since = Math.min(S.turn, t.wish.since + COUNCIL_CALM);
  if (S.seatRule) S.seatRule.lobby = null;
  const kept = win.id === ch.id;
  const text = kept ? `The ${postWord('e4')} voted to keep ${postWord('champion')} ${ch.name} (${votes} of ${voters.length} votes).` : seatHandOver(win, `won the Council vote (${votes} of ${voters.length} votes)`);
  seatRec({ season: S.season, k: 'council', win: win.id, inc: ch.id, kept, votes, of: voters.length, text });
  return text;
}
// the seat empties under Succession or Council: which Elite Four seat moves up (null: the usual strongest)
function ruleHeirSeat(ks) {
  const k = seatRuleKey();
  if (k === 'succession') { SEAT_LOG.heirs++; return Math.max(...ks); }
  if (k === 'council' && ks.length > 1) { SEAT_LOG.heirs++; const cands = ks.map(i => T(S.e4[i])); const { win } = councilVote(cands, cands, null); if (S.seatRule) S.seatRule.lobby = null; return S.e4.indexOf(win.id); }
  return null;
}
// the player lobbies the Council for a candidate (each lobby costs COUNCIL_LOBBY; up to COUNCIL_LOBBY_MAX before a vote)
function lobbySeat(id) {
  return inLeague(ME(), () => {
    if (seatRuleKey() !== 'council') return 'Your League doesn\'t choose its Champion by Council vote.';
    const t = T(id); if (!t || ![S.champion, ...S.e4].includes(id) && !S.gyms.some(g => g.leader === id && !g.acting)) return 'They can\'t stand for the seat.';
    const r = seatRule(), lob = r.lobby && r.lobby.id === id ? r.lobby : { id, n: 0 };
    if (r.lobby && r.lobby.id !== id && r.lobby.n) return `You are already lobbying for ${T(r.lobby.id) ? T(r.lobby.id).name : 'someone else'}.`;
    if (lob.n >= COUNCIL_LOBBY_MAX) return `You have lobbied ${COUNCIL_LOBBY_MAX} times before this vote.`;
    if (!canSpend(COUNCIL_LOBBY)) return `Lobbying costs ${money(COUNCIL_LOBBY)}.`;
    book(-COUNCIL_LOBBY, 'seatlobby', `Lobbied the ${postWord('e4')} for ${t.name}.`);
    lob.n++; r.lobby = lob; SEAT_LOG.lobbies++;
    return null;
  });
}
// Term: the term ends; the player appoints (TERM_ANSWER weeks, unanswered: the Champion stays), a rival at once
const termCands = () => [T(S.champion), ...seatCands(), ...leaderCands().map(x => x.t)].filter(Boolean);
function seatTermEnds() {
  SEAT_LOG.terms++;
  const r = seatRule(), ch = T(S.champion);
  if (playerLeague()) {
    r.pick = { due: S.turn + TERM_ANSWER, season: S.season };
    return `${postWord('champion')} ${ch.name}'s term is over. Appoint the next ${postWord('champion')} (or keep ${ch.name}) by ${turnDate(r.pick.due)}; unanswered, ${ch.name} serves another term.`;
  }
  const w = termCands().map(t => ({ t, s: ovr(t) + (t.id === ch.id ? TERM_INC : 0) + rand() * 2 })).sort((a, b) => b.s - a.s)[0].t;
  r.term = S.season + r.every;
  const kept = w.id === ch.id;
  const text = kept ? `The ${S.lgName} kept ${postWord('champion')} ${ch.name} for another term.` : seatHandOver(w, `was appointed at the end of ${ch.name}'s term`);
  seatRec({ season: S.season, k: 'term', win: w.id, inc: ch.id, kept, text });
  return text;
}
// the player's appointment (id: the next Champion, the current one to keep them); returns an error or null
function termPick(id) {
  return inLeague(ME(), () => {
    const r = seatRule(); if (!r.pick) return 'No term is waiting for an appointment.';
    const ch = T(S.champion), t = termCands().find(x => x.id === id); if (!t) return 'They can\'t be appointed.';
    const season = r.pick.season; r.pick = null; r.term = S.season + r.every;
    const kept = t.id === ch.id;
    const text = kept ? `You kept ${postWord('champion')} ${ch.name} for another term.` : seatHandOver(t, `was appointed by you at the end of ${ch.name}'s term`);
    seatRec({ season, k: 'term', win: t.id, inc: ch.id, kept, text });
    news(text, 'title', S.champion); noteChange(text);
    return null;
  });
}
// every week: an appointment left unanswered keeps the Champion (the multi-year sim settles it at once)
function seatWeek(now) {
  inLeague(ME(), () => {
    const r = S.seatRule; if (!r || !r.pick || (!now && S.turn < r.pick.due)) return;
    const ch = T(S.champion); if (!ch) { r.pick = null; return; }
    termPick(ch.id);
  });
}
// (0.46.0) an Instant Conqueror: the League's rule hands the seat to q the moment they win the title (leagueRun)
function conquerNow(q) {
  if (fixedStaff() || S.founding || seatLocked() || !T(S.champion)) return false;
  const r = seatRule();
  return r.k === 'conqueror' && !!r.now && claimFree(q);
}
// your League's Elite Four seat that waits for you (a vacancy with a stand-in), if any
function freeE4Vacancy() { return playerLeague() ? (S.vacancies || []).find(v => v.post === 'e4') || null : null; }
function seatConquerNow(q) {
  const ch = T(S.champion); if (!ch || q.role !== 'challenger') return null;
  SEAT_LOG.conquerNow++;
  const text = seatHandOver(q, `beat ${ch.name} for the title and, under the Conqueror rule, takes the seat at once`, true);
  if (!text) return null;
  seatRec({ season: S.season, k: 'conqueror', win: q.id, inc: ch.id, now: true, week: S.week, text });
  news(text, 'title', q.id); noteChange(text);
  if (playerLeague()) stopFor('title', text);
  return text;
}
// Conqueror at New Year: the year's strongest title winner still on the circuit who wants the seat takes it
function seatConquer() {
  const ch = T(S.champion);
  const c = [...new Set(yearLeague().conceded || [])].map(T).filter(t => claimFree(t) && (wantsSeat(t) || rand() < CONQ_WANT)).sort((a, b) => ovr(b) - ovr(a))[0];
  if (!c) return null;
  SEAT_LOG.conquer++;
  const text = seatHandOver(c, `beat ${ch.name} for the title and, under the Conqueror rule, takes the seat`);
  seatRec({ season: S.season, k: 'conqueror', win: c.id, inc: ch.id, text });
  return text;
}
// ================= CONTRACTS (0.52.0; design doc 6.24, talks part 1) =================
// Every member of staff signs a contract when they take a post: senior staff (Gym Leaders, the Elite Four and the
// Champion) for 1 to 4 years, gym trainers for 3, 6 or 9 months. The player picks the length when hiring; each trainer
// prefers one (stay-put trainers long deals, promotion-seekers short ones), and every step away from it lowers the odds
// they accept an offer and raises their pay. Staff moved within the League keep their contract (a gym trainer moving
// up to a senior post signs a new one). A contract holds against ambition: an ignored ambition no longer makes anyone
// give notice; restlessness shows and comes due at renewal. CON_WINDOW weeks before a senior contract ends only the
// current League can renew it: a content trainer renews, a restless one asks for more (pay, and a fresh clock) or
// refuses. A contract not renewed ends: they go back to the circuit (a grudge if restless) or retire, and the post
// opens. Gym trainers' contracts renew quietly unless the player marked them to go or they are restless. Ways out
// mid-contract are unchanged: let go (severance), unpaid in the red (notice), poached for a bigger post, stepping down
// after a long career, and a Champion's wish to step down. Open talks between Leagues are part 2. All numbers
// provisional.
const CON_SENIOR = [48, 96, 144, 192], CON_SHORT = [12, 24, 36], CON_WINDOW = 4;
const CON_ODDS = 0.06, CON_PAY = 0.05, CON_MORE = 0.25, CON_REFUSE = 0.5;
const CON_AI_KEEP = { wall: 0.9, star: 0.85, money: 0.75 };
const CON_LOG = { made: 0, kept: 0, renewed: 0, more: 0, quiet: 0, ended: 0, refused: 0, lapsed: 0, gtGone: 0, auto: 0 };
const conOpts = post => post === 'gymtrainer' ? CON_SHORT : CON_SENIOR;
const conShort = post => post === 'gymtrainer';
const conWords = w => w >= YEAR_WEEKS ? `${w / YEAR_WEEKS} year${w === YEAR_WEEKS ? '' : 's'}` : `${w / 4} months`;
// the length a trainer would rather sign for (an index into conOpts). Someone already on the staff goes by their
// ambition; anyone else by what they want of a post (hungry for one: short; 40 or older: long)
function conPrefIdx(t, post, fresh) {
  const n = conOpts(post).length;
  const k = !fresh && t.wish && STAFF_ROLES.includes(t.role) ? t.wish.k : hungry(t) ? 'up' : t.age >= 40 ? 'stay' : null;
  return k === 'stay' ? n - 1 : k === 'up' || k === 'run' || k === 'step' ? 0 : Math.floor((n - 1) / 2);
}
const conPref = (t, post, fresh) => conOpts(post)[conPrefIdx(t, post, fresh)];
// steps between a length and the one they prefer (0 when no length is asked)
function conMiss(t, post, len, fresh = true) {
  const o = conOpts(post), i = o.indexOf(len);
  return i < 0 ? 0 : Math.abs(i - conPrefIdx(t, post, fresh));
}
// is this member of staff held by a contract now? (not the Champion's wish to step down, which still goes ahead)
function conHolds(t) {
  const c = t && t.con;
  return !!c && !t.acting && !fixedStaff() && postOf(t) != null && (S.turn < c.until || t.talk != null) && !(t.role === 'champion' && t.wish && t.wish.k === 'step');
}
function newCon(t, post, len) { t.con = { post, len, from: S.turn, until: S.turn + len }; return t.con; }
// from openPost: a new contract, or the one they hold if they moved within the staff
function setContract(t, role, was) {
  const ask = t.conAsk; t.conAsk = null;
  if (!STAFF_ROLES.includes(role)) { t.con = null; return; }
  if (t.acting) return; // an acting holder keeps whatever they had (a stand-in has none)
  const c = t.con, opts = conOpts(role);
  if (was && c && conShort(c.post) === conShort(role) && S.turn < c.until - CON_WINDOW) { c.post = role; CON_LOG.kept++; return; }
  const len = opts.includes(ask) ? ask : rand() < 0.5 ? conPref(t, role, true) : pick(opts); // unasked: staggered
  newCon(t, role, len); CON_LOG.made++;
  const miss = conMiss(t, role, len);
  if (miss && !fixedStaff()) { t.payMul = (t.payMul || 1) * (1 + CON_PAY * miss); t.lastPay = payOf(t); }
}
// will they renew? A content trainer yes; one who asked for another run no; a restless one asks for more or refuses
function conWill(t) {
  const w = t.wish;
  if (w && w.k === 'run' && w.asked != null) return 'no';
  if (ambClock(t) && restless(t)) return rand() < CON_REFUSE ? 'no' : 'more';
  return 'yes';
}
// a renewal: the new term follows on from the old one. Asking for more: CON_MORE on their pay and a fresh clock.
function renewCon(t, len, more) {
  const c = t.con, base = Math.max(S.turn, c.until);
  t.con = { post: c.post, len, from: base, until: base + len };
  let mul = 1 + (more ? CON_MORE : 0) + CON_PAY * conMiss(t, c.post, len, false);
  if (more) { CON_LOG.more++; if (t.wish) t.wish.since = S.turn; }
  if (mul !== 1 && !fixedStaff()) { t.payMul = (t.payMul || 1) * mul; t.lastPay = payOf(t); }
}
// rival Leagues (and the multi-year sim for yours) answer the window at once: keep the willing, by aim, at the length
// they prefer; a poor record isn't kept
function aiRenew(t, auto) {
  const c = t.con;
  if (c.will === 'no') { CON_LOG.refused++; return false; }
  const aim = S.fin && S.fin.aim, keep = auto ? 1 : CON_AI_KEEP[aim] != null ? CON_AI_KEEP[aim] : 0.85;
  if (!auto && (poorRecord(t) || rand() >= keep)) { CON_LOG.lapsed++; return false; }
  renewCon(t, conPref(t, c.post), c.will === 'more'); CON_LOG.renewed++; if (auto) CON_LOG.auto++;
  return true;
}
// the contract ends: through staffQuits (the post opens in your League, is filled at once elsewhere)
function conEnd(t) {
  t.conSore = restless(t) || (t.con && t.con.will === 'no' && !(t.wish && t.wish.k === 'run'));
  t.quit = { at: S.turn, k: 'con' }; CON_LOG.ended++;
  if (t.role === 'gymtrainer') CON_LOG.gtGone++;
  staffQuits(t);
}
// where they go: another run if they asked for one; retired by the rule for a lost post; else the circuit, with a
// grudge if they left restless
function conLeave(t, was) {
  const sore = t.conSore; t.conSore = null; t.con = null;
  if (t.wish && t.wish.k === 'run' && t.wish.asked != null) return comeback(t, was);
  t.wish = null; t.letGoAt = S.turn;
  if (retiresOnLosingPost(t)) { retire(t, `after their contract as ${was} ran out`); return 'retired'; }
  returnToCircuit(t, `contract as ${was} ran out`);
  if (!sore) return 'circuit';
  t.grudge = S.season; t.grudgeLg = S.lg || 0;
  return grudgeAway(t);
}
function conText(t, was, fate) {
  return `${t.name}'s contract as ${was} ran out${fate === 'comeback' ? ', and they set off on another run as a challenger' : fate === 'retired' ? ', and they retired' : fate === 'away' ? `, and they took a grudge to the ${leagueName(lgOf(t))}` : fate === 'grudge' ? '; unhappy, they return to the circuit holding a grudge' : ', and they return to the badge circuit'}.`;
}
// once a week in each League
function contractWeek() {
  if (fixedStaff() || (S.founding && (S.lg || 0) === ME())) return;
  const mine = playerLeague(), auto = mine && !!S.simRun;
  for (const id of staffIds()) {
    const t = T(id);
    if (!t || t.acting || !postOf(t)) continue;
    if (!t.con) newCon(t, t.role, conPref(t, t.role));
    const c = t.con;
    if (t.stepDown != null || t.quit || t.talk != null) continue; // (0.53.0) in talks: the deadline settles it
    if (t.role === 'champion' && founderChamp(t)) { if (S.turn >= c.until - CON_WINDOW) renewCon(t, c.len); continue; }
    if (conShort(c.post)) {
      if (S.turn < c.until) continue;
      if (c.go || (ambClock(t) && restless(t))) conEnd(t);
      else { renewCon(t, c.len); CON_LOG.quiet++; }
      continue;
    }
    if (c.win == null && S.turn >= c.until - CON_WINDOW) {
      c.win = Math.min(S.turn, c.until); c.will = conWill(t); // (0.54.0) a window held off by a notice since withdrawn opens late
      if (!mine || auto) aiRenew(t, auto);
      else {
        const msg = `${dn(t)}'s contract as ${postName(t)} ends on ${turnDate(c.until)}. ${c.will === 'no' ? 'They won\'t renew: they leave then, and the post opens.' : c.will === 'more' ? `Restless, they will renew only for ${CON_MORE * 100}% more pay.` : 'They are happy to renew.'} Only your League can renew it until then (Your staff).`;
        news(msg, 'move', t.id); noteChange(msg); stopFor('contract', msg);
      }
    }
    if (t.con.win != null && auto && S.turn < t.con.until && t.con.from <= S.turn && t.con.will !== 'no' && t.con === c) aiRenew(t, true);
    if (S.turn >= t.con.until) { if ((t.wish && t.wish.k === 'run' && t.wish.asked != null) || !openTalks(t, 'expiry', S.lg || 0)) conEnd(t); else if (t.talk != null) talkOf(t).will = c.will; } // (0.53.0) open talks
  }
}
// (0.54.0) a notice withdrawn (out of the red, a raise) after the contract's end: the end is dealt with now, as the
// week would have (a gym trainer renews quietly or goes; senior staff go to open talks, or leave)
function conCatchUp(t) {
  const c = t && t.con;
  if (!c || t.acting || t.talk != null || t.quit || t.stepDown != null || S.turn < c.until || !postOf(t) || fixedStaff()) return;
  if (conShort(c.post)) { if (c.go || (ambClock(t) && restless(t))) conEnd(t); else { renewCon(t, c.len); CON_LOG.quiet++; } return; }
  if (c.win == null) { c.win = c.until; c.will = conWill(t); }
  if ((t.wish && t.wish.k === 'run' && t.wish.asked != null) || !openTalks(t, 'expiry', S.lg || 0)) conEnd(t); else if (t.talk != null) talkOf(t).will = c.will;
}
// the player renews a contract in its window (no cost but the pay they ask)
function renewContract(id, len) {
  return inLeague(ME(), () => {
    const t = T(id), c = t && t.con;
    if (!c || !postOf(t) || t.acting || conShort(c.post) || c.win == null || S.turn >= c.until || c.from > S.turn) return 'Their contract is not up for renewal.';
    if (c.will === 'no') return `${t.name} won't renew.`;
    if (!conOpts(c.post).includes(len)) return 'Pick a length.';
    renewCon(t, len, c.will === 'more'); CON_LOG.renewed++;
    news(`${dn(t)} renewed for ${conWords(len)} as ${postName(t)}, to ${turnDate(t.con.until)}${c.will === 'more' ? `, for ${CON_MORE * 100}% more pay` : ''}.`, 'move', t.id);
    return null;
  });
}
// a gym trainer: let them go when the contract ends (or keep them on)
function conLetRun(id, go) {
  return inLeague(ME(), () => { const t = T(id); if (!t || !t.con || !conShort(t.con.post) || !postOf(t)) return false; t.con.go = !!go; return true; });
}
// contracts in their renewal window waiting for the player
function conPending() { return inLeague(ME(), () => staffIds().map(T).filter(t => t && !t.acting && t.con && !conShort(t.con.post) && t.con.win != null && t.con.from <= S.turn && S.turn < t.con.until)); }
// the length to show and the preferred one for a candidate (hiring pages)
function setConAsk(id, len) { const t = T(id); if (t) t.conAsk = len || null; }
// ================= TALKS (0.53.0; design doc 6.24, talks part 2) =================
// When a valuable trainer becomes available, talks open with a deadline and any League can put in an offer and raise
// it each week. Three kinds: a star (a challenger who reached the Elite Four at TALK_STAR_OVR or better, or won the
// title, when their run ends; or one the player makes an offer to from a hiring page), a member of senior staff whose
// contract ended without a renewal (they stay in post until the talks end), and a rival League going after another
// League's member of staff under contract (poach: their League can answer: the Retention stop in yours). An offer is a
// senior post (a vacancy, or one whose holder it replaces), pay over the trainer's asking, a signing bonus, a contract
// length and promises. The trainer keeps an interest in each offer (talkInterest); at the deadline they sign with the
// League they are most interested in, if it is at least what they need (talkNeed); else, if there were offers, they
// may walk away from every League (TALK_WALK; a star then isn't asked again for REFUSED_WEEKS). A League is in at most
// TALK_MAX talks besides its own staff's, its bonuses on the table count against its money, and nobody makes an offer
// in the red. Rival offers are hidden: Scouting (the scouting office) shows rough, then close, offers and the
// trainer's interest. Rival Leagues bid by aim (part 3, 0.54.0, TALK_AIM). (0.54.0) A Champion is in talks when their
// contract runs out without a renewal, or when they want a bigger League's seat (kind 'champ'); only Leagues whose seat
// is about to open can offer them one (seatOpening), and their own League can offer to keep them.
// All numbers provisional.
const TALK_MAX = 3, TALK_WALK = 0.25, TALK_COOL = 48, TALK_STAR_OVR = 66, TALK_POACH_WEEKS = 2, TALK_LAST = 1;
const TALK_BIDS = [0, 0.25, 0.5, 0.75], TALK_BONUS = [0, 12, 24, 48], PROM_WEEKS = 96;
const PROMISES = { nodemote: 'No step down or release for 2 years', own: 'Keeps their own team (no team plan) for 2 years', legend: 'A legendary from your Sanctuary vault' };
const TALK_W = { pay: 1.2, bonus: 0.2, len: 0.15, post: 1, nodemote: 0.15, own: 0.12, legend: 0.4, seat: 0.4, stay: 0.2, home: 0.15, hold: 0.15, prest: 0.4, grudge: 1, academy: 0.25, loyal: 0.15, sore: 0.4, more: 0.2 };
const TALK_AI = { nodemote: 0.3 }; // (0.54.0) the rest is by aim: TALK_AIM
const TALK_LOG = { star: 0, expiry: 0, poach: 0, offers: 0, aiOffers: 0, raises: 0, signed: 0, home: 0, walked: 0, none: 0, ext: 0, broke: 0, gone: 0, matched: 0, letGo: 0, broken: 0, legend: 0, byKind: {} };
const talkList = () => (S.talks = S.talks || []);
const talkOf = t => t && t.talk != null ? talkList().find(x => x.id === t.talk) || null : null;
const promOn = (t, k, lg) => !!(t && t.prom && t.prom.until > S.turn && (lg == null || t.prom.lg === lg) && t.prom.k.includes(k));
const postVal = (post, slot) => post === 'gymtrainer' ? 0 : post === 'leader' ? 0.2 + 0.03 * (slot || 0) : post === 'e4' ? 0.5 + 0.05 * (slot || 0) : 0.9;
const offerWords = o => o.post === 'champion' ? `the ${leagueName(o.lg)}'s Champion's seat` : `${o.post === 'e4' ? `Elite Four seat #${o.slot + 1}` : `${inLeague(o.lg, () => townName(o.slot))} Gym`}`;
// a star: a challenger who won the title this year or last, or reached the Elite Four this year or last
function isStar(t) {
  if (!t || t.role !== 'challenger') return false;
  if ((t.titleSeasons || []).some(s => s >= (S.season || 1) - 1)) return true;
  const y = t.yr && t.yr.season === S.season && t.yr.st != null, h = (t.seasonHist || [])[(t.seasonHist || []).length - 1];
  return !!(y || (h && h.season === S.season - 1 && h.stage != null));
}
// may talks open for t now? (not hired, sponsored, claiming, leaving, walked away lately or in talks this past year)
function canTalk(t) {
  if (!t || t.talk != null || t.hired || t.hireDue || t.spon || t.leaving || claimOn(t) || fixedStaff()) return false;
  if (t.walkAt != null && S.turn - t.walkAt < REFUSED_WEEKS) return false;
  return !(t.talkAt != null && S.turn - t.talkAt < TALK_COOL && t.role === 'challenger');
}
// 2 to 6 weeks by stature: OVR, titles, fame
function talkWeeks(t, kind) {
  if (kind === 'poach') return TALK_POACH_WEEKS;
  const st = clamp((ovr(t) - 60) / 20 + 0.25 * (t.titleSeasons || []).length + (t.famous ? 0.25 : 0), 0, 1);
  return 2 + Math.round(4 * st);
}
// open talks: kind 'star' | 'expiry' | 'poach'; home is the League holding them (null for a challenger)
function openTalks(t, kind, home, why) {
  if (!canTalk(t)) return null;
  const n = (S.talkN = (S.talkN || 0) + 1), w = talkWeeks(t, kind);
  const k = { id: n, tid: t.id, kind, home: home == null ? null : home, from: lgOf(t), opened: S.turn, until: S.turn + w, ext: false, offers: [], lead: null, why: why || '', post: home == null ? null : inLeague(home, () => postKey(t)) };
  talkList().push(k); t.talk = n; t.talkAt = S.turn;
  TALK_LOG[kind]++;
  if (kind === 'star' && t.rest != null) t.rest = Math.max(t.rest, k.until + 1); // a star waits for the talks to end
  const msg = kind === 'champ' ? `${dn(t)} wants a bigger League's seat. Talks are open until ${turnDate(k.until)}: a League whose seat is about to open can offer it, and the ${leagueName(home)} can offer to keep them.`
    : kind === 'expiry' ? `${dn(t)}'s contract as ${inLeague(home, () => postName(t))} ran out without a renewal. Talks are open until ${turnDate(k.until)}: any League can make an offer.`
    : kind === 'star' ? `Talks are open for ${dn(t)} (${why}) until ${turnDate(k.until)}: any League can offer them a post.` : null;
  if (msg) { inLeague(kind === 'expiry' || kind === 'champ' ? home : lgOf(t), () => news(msg, 'move', t.id)); }
  return k;
}
// a star's run ended: talks open for a title winner, or for one who reached the Elite Four at TALK_STAR_OVR or better
function starTalks(t, stage) {
  if (stage == null || t.role !== 'challenger' || !canTalk(t)) return;
  if (stage !== 5 && ovr(t) < TALK_STAR_OVR) return;
  openTalks(t, 'star', null, stage === 5 ? `won the title of the ${S.lgName}` : `reached the ${S.lgName}'s Elite Four`);
}
// what the trainer needs from an offer to sign: a star chasing titles needs a lot, staff whose contract ended
// little, staff under contract going elsewhere a real reason
function talkNeed(t, k) {
  if (k.kind === 'expiry') return 0;
  if (k.kind === 'poach' || k.kind === 'champ') return 0.15;
  let n = 0.9;
  if ((t.titleSeasons || []).length) n += 0.4;
  if (t.age < 20) n += 0.2; else if (t.age >= 35) n -= 0.3;
  if (hungry(t)) n -= 0.4;
  return n;
}
// the trainer's asking pay for an offer's post, and the weekly pay offered
const talkAsk = (t, o) => inLeague(o.lg, () => askFor(t, o.post, o.slot));
const talkPay = (t, o) => Math.round(talkAsk(t, o) * (1 + o.bid));
const talkBonus = (t, o) => Math.round(o.bonus * talkPay(t, o));
// a stable draw per trainer and League, ±0.1: taste nobody can see
const talkTaste = (t, lg) => ((((t.id * 2654435761) ^ ((lg + 7) * 40503)) >>> 0) % 21 - 10) / 100;
// how interested t is in offer o (higher is better). Pay over the asking, the bonus, the post against the one they
// hold, the length they prefer, promises, the seat rule (open seats draw the hungry, protected ones the stay-put),
// hometown and its Stronghold, prestige, a grudge, their own academy, and (their own League) contentment
function talkInterest(t, k, o) {
  const cur = k.home != null && o.lg === k.home, p = cur ? null : postOf0(t);
  let v = TALK_W.pay * o.bid + TALK_W.bonus * (o.bonus / 12) - TALK_W.len * conMiss(t, o.post, o.len, !cur);
  if (!cur) v += TALK_W.post * (postVal(o.post, o.slot) - (p ? postVal(p.post, p.slot) : 0.2));
  for (const x of o.prom || []) v += TALK_W[x] || 0;
  const open = seatOpen(o.lg);
  if (hungry(t)) v += TALK_W.seat * open; else if (t.wish && t.wish.k === 'stay') v += TALK_W.stay * (1 - open);
  if (t.home && t.home.r === lgRegion(o.lg)) v += TALK_W.home;
  const hc = homeCity(t); if (hc != null && S.cities[hc] && strongholdOf(S.cities[hc], o.lg)) v += TALK_W.hold;
  v += TALK_W.prest * Math.min(100, prestOf(o.lg)) / 100;
  if (t.grudge != null && t.grudgeLg === o.lg) v -= TALK_W.grudge;
  if (t.academy === o.lg) v += TALK_W.academy;
  if (cur) v += k.will === 'no' ? -TALK_W.sore : k.will === 'more' ? -TALK_W.more : TALK_W.loyal;
  return v + talkTaste(t, o.lg);
}
// the post a trainer holds, wherever they are
function postOf0(t) { return STAFF_ROLES.includes(t.role) ? inLeague(homeLeague(t), () => postOf(t)) : null; }
// would t sign for League lg at all (its prestige)? Their own League always
const talkSigns = (t, k, lg) => (k.home != null && lg === k.home) || inLeague(lg, () => willSign(t, lg));
// the offers t would consider, best first, with their interest
function talkRank(k) {
  const t = T(k.tid); if (!t) return [];
  return k.offers.filter(o => talkSigns(t, k, o.lg)).map(o => ({ o, v: talkInterest(t, k, o) })).sort((a, b) => b.v - a.v);
}
// bonuses League lg has on the table (not counting one offer)
function talkHeld(lg, except) {
  let n = 0;
  for (const k of talkList()) for (const o of k.offers) if (o.lg === lg && o !== except) { const t = T(k.tid); if (t) n += talkBonus(t, o); }
  return n;
}
// talks League lg has offers in, besides its own staff's
const talkCount = lg => talkList().filter(k => k.home !== lg && k.offers.some(o => o.lg === lg)).length;
// can League lg make (or change to) offer o in talks k? An error in words, or null
function offerCheck(k, o) {
  const t = T(k.tid); if (!t || !talkList().includes(k)) return 'Those talks are over.';
  if (o.lg < 0 || o.lg >= nLeagues()) return 'No such League.';
  if (!['leader', 'e4', 'champion'].includes(o.post)) return 'Offer a Gym Leader\'s post or an Elite Four seat.';
  if (o.post === 'champion' ? o.slot !== 0 : o.post === 'leader' ? !(o.slot >= 0 && o.slot < 8) : !(o.slot >= 0 && o.slot < 4)) return 'No such post.';
  if ((o.post === 'champion') !== (t.role === 'champion')) return t.role === 'champion' ? 'A Champion takes only a Champion\'s seat.' : 'The Champion\'s seat is offered only to a Champion.';
  if (!TALK_BIDS.includes(o.bid) || !TALK_BONUS.includes(o.bonus) || !conOpts(o.post).includes(o.len)) return 'Pick the pay, bonus and length from the choices.';
  if ((o.prom || []).some(x => !PROMISES[x]) || new Set(o.prom || []).size !== (o.prom || []).length) return 'No such promise.';
  const cur = k.home != null && o.lg === k.home, p = cur ? postOf0(t) : null;
  if (cur && (!p || p.post !== o.post || p.slot !== o.slot)) return 'Your League can only offer them the post they hold.';
  if (k.kind === 'poach' && !cur && STAFF_ROLES.includes(t.role) && homeLeague(t) === o.lg) return 'They are your own staff.';
  if (!talkSigns(t, k, o.lg)) return inLeague(o.lg, () => prestBlock(t, o.lg)) || 'They won\'t sign for that League.';
  if ((o.prom || []).includes('legend') && !(o.post === 'e4' && inLeague(o.lg, () => (S.vault || []).some(e => e.m)))) return 'A Sanctuary legendary can only be promised with an Elite Four seat, from a vault that holds one.';
  if (!cur && o.post === 'champion' && !inLeague(o.lg, seatOpening)) return 'Only a League whose seat is about to open (its Champion leaving) can offer it.';
  if (!cur && o.post !== 'champion') {
    const blocked = inLeague(o.lg, () => { const h = o.post === 'e4' ? T(S.e4[o.slot]) : T(S.gyms[o.slot].leader); return h && !h.acting && (h.role === 'champion' || founderChamp(h) || promOn(h, 'nodemote', o.lg)) ? `${h.name} can't be replaced (${promOn(h, 'nodemote', o.lg) ? 'you promised them' : 'founder'}).` : h && h.talk != null && h.talk === k.id ? 'That is their own post.' : null; });
    if (blocked) return blocked;
  }
  if (!cur && !k.offers.some(x => x.lg === o.lg) && talkCount(o.lg) >= TALK_MAX) return `A League can be in at most ${TALK_MAX} talks at once (besides its own staff's).`;
  return inLeague(o.lg, () => {
    if (!S.fin) return null;
    if (S.fin.money < 0) return 'Nobody makes offers while the League is in the red.';
    const old = k.offers.find(x => x.lg === o.lg), need = talkBonus(t, o);
    if (S.fin.money - talkHeld(o.lg, old) < need) return `Not enough money for the bonus (${money(need)}; ${money(talkHeld(o.lg, old))} already on the table elsewhere).`;
    return null;
  });
}
// put in or change an offer (one per League per talks). Returns an error or null.
function makeOffer(k, o) {
  const err = offerCheck(k, o); if (err) return err;
  const old = k.offers.find(x => x.lg === o.lg);
  const n = { lg: o.lg, post: o.post, slot: o.slot, bid: o.bid, bonus: o.bonus, len: o.len, prom: (o.prom || []).slice(), at: S.turn, raised: old ? (old.raised || 0) + 1 : 0, ai: !!o.ai };
  if (old) k.offers[k.offers.indexOf(old)] = n; else k.offers.push(n);
  TALK_LOG.offers++; if (o.ai) TALK_LOG.aiOffers++; if (old) TALK_LOG.raises++;
  talkLead(k, true);
  return null;
}
function withdrawTalkOffer(k, lg) { const i = k.offers.findIndex(o => o.lg === lg); if (i < 0) return false; k.offers.splice(i, 1); talkLead(k, false); return true; }
// the League now leading: a change in the last week extends the talks once; your League losing the lead stops the sim
function talkLead(k, fresh) {
  const r = talkRank(k), lead = r.length ? r[0].o.lg : null, was = k.lead;
  if (lead === was) return;
  k.lead = lead;
  if (fresh && lead != null && was != null && k.until - S.turn <= TALK_LAST && !k.ext) {
    k.until++; k.ext = true; TALK_LOG.ext++;
  }
  if (handOn() && was === ME() && lead !== ME() && k.offers.some(o => o.lg === ME())) { const t = T(k.tid); inLeague(ME(), () => stopFor('talks', `You were outbid for ${t ? t.name : 'a trainer'}: the ${leagueName(lead)} leads the talks (until ${turnDate(k.until)}).`)); }
}
// ---- rival Leagues' offers (0.54.0, talks part 3: by aim, with variance) ----
// Each aim bids its own way. A star-maker chases any star who would improve one of its posts by STAR_EDGE OVR, opens
// over the asking, counters up to three times and goes as high as +75% and 48 weeks' bonus. A wall-builder goes for
// its weakest posts and for trainers whose types answer what its wall keeps losing to (the types in squads that took
// its badges this year, gym.beat): a trainer who answers them needs only GAP_EDGE OVR over the holder, and counts
// GAP_W more. A money-maker lowballs (their asking pay, no bonus, never a raise) and lets its staff go for the
// transfer fee unless they are its best. Variance: each League has a temper drawn when it is founded (bold, steady or
// tight: more or fewer offers and raises), and each talks a keenness of its own per League (TALK_KEEN either way).
// All numbers provisional.
const TALK_AIM = {
  star:  { first: 0.8, raise: 0.7, raises: 3, maxBid: 0.75, maxBonus: 48, edge: 3, bid0: 0.25, bonus0: 12, retain: 0.7, poach: 0.1 },
  wall:  { first: 0.6, raise: 0.45, raises: 2, maxBid: 0.5, maxBonus: 24, edge: 4, gapEdge: 2, bid0: null, bonus0: 12, retain: 0.8, poach: 0.08 },
  money: { first: 0.35, raise: 0, raises: 0, maxBid: 0, maxBonus: 0, edge: 6, bid0: 0, bonus0: 0, retain: 0, poach: 0.03 },
};
const BID_TEMPERS = { bold: { name: 'Bold', odds: 1.3, raises: 1 }, steady: { name: 'Steady', odds: 1, raises: 0 }, tight: { name: 'Tight', odds: 0.7, raises: -1 } };
const BID_TEMPER_KEYS = Object.keys(BID_TEMPERS), TALK_KEEN = 0.15, GAP_W = 6, GAP_TYPES = 3;
const TALK_AIM_LOG = { first: { star: 0, wall: 0, money: 0 }, raise: { star: 0, wall: 0, money: 0 }, gap: 0, poach: 0, poachYou: 0, retained: 0, countered: 0, sold: 0, champ: 0, champSigned: 0, starTalks: 0, starRival: [0, 0, 0, 0], pass: 0, miss: { full: 0, noSign: 0, noPost: 0 } };
// the bound League's temper (drawn in initBooks; any League without one draws it now)
function bidTemper() { if (!S.fin) return BID_TEMPERS.steady; if (!BID_TEMPERS[S.fin.temper]) S.fin.temper = pick(BID_TEMPER_KEYS); return BID_TEMPERS[S.fin.temper]; }
// how keen League lg is in these talks, a stable ±TALK_KEEN on its odds
const talkKeen = (k, lg) => (((((k.id + 13) * 2246822519) ^ ((lg + 3) * 3266489917)) >>> 0) % 31 - 15) / 15 * TALK_KEEN;
const talkAim = aim => TALK_AIM[aim] || TALK_AIM.wall;
// the types the bound League's wall keeps losing to: at a gym (its gym.beat), or across every gym for the Elite Four
function beatTop(post, slot) {
  const n = {};
  for (const [i, g] of S.gyms.entries()) if (post === 'e4' || i === slot) for (const [ty, c] of Object.entries(g.beat || {})) n[ty] = (n[ty] || 0) + c;
  return Object.keys(n).sort((a, b) => n[b] - n[a]).slice(0, GAP_TYPES);
}
// a seat about to open: its Champion has announced stepping down or given notice (not in talks themselves), or there
// is none. Only such a League can offer a Champion its seat.
function seatOpening() {
  if (S.founding && (S.lg || 0) === ME()) return false;
  const h = T(S.champion); if (!h) return true;
  return !founderChamp(h) && h.talk == null && (h.stepDown != null || !!h.quit);
}
// the bound League's post that t would improve most, by aim (null when none): a vacant post (acting holder), or one
// held by someone the trainer beats by the aim's edge; a wall-builder adds how well they answer the wall's losses.
// A Champion is offered only a seat about to open.
function aiTalkPost(t, aim) {
  const o = ovr(t), r = talkAim(aim);
  if (t.role === 'champion') return seatOpening() && o >= E4_HIRE_MIN ? { post: 'champion', slot: 0, gain: o - 60 } : null;
  const ok = h => h && !h.acting && h.stepDown == null && !h.quit && !founderChamp(h) && h.talk == null && !promOn(h, 'nodemote', S.lg || 0);
  const tys = aim === 'wall' ? foeTypes(t) : null, gap = (post, slot) => tys ? GAP_W * Math.max(0, counterScore(tys, beatTop(post, slot))) : 0;
  const out = [], at = (post, slot, h, base) => {
    const g = gap(post, slot);
    if (!h || (post === 'e4' ? h.acting : S.gyms[slot].acting)) out.push({ post, slot, gain: base + o - 60 + g, gap: g });
    else if (ok(h) && o >= ovr(h) + (g > 0 && r.gapEdge != null ? r.gapEdge : r.edge)) out.push({ post, slot, gain: o - ovr(h) + (post === 'e4' ? 5 : 0) + g, gap: g });
  };
  if (o >= E4_HIRE_MIN) S.e4.forEach((id, k) => at('e4', k, T(id), 20));
  if (o >= GYM_HIRE_MIN) S.gyms.forEach((g, i) => at('leader', i, T(g.leader), 15));
  return out.sort((a, b) => b.gain - a.gain)[0] || null;
}
// one raise step by aim: pay first, then the bonus; null when the aim goes no higher
function aiRaise(o, r) {
  const n = { ...o, prom: o.prom.slice(), ai: true };
  if (n.bid < r.maxBid) n.bid = Math.min(r.maxBid, n.bid + 0.25);
  else if (n.bonus < r.maxBonus) n.bonus = TALK_BONUS[TALK_BONUS.indexOf(n.bonus) + 1];
  else return null;
  return n;
}
// what the bound League can still put up in bonuses above its reserve
const talkSpare = (aim, except) => S.fin.money - talkHeld(S.lg || 0, except) - AIMS[aim].reserve;
// one League's move in talks k this week: a first offer, or a raise when behind. Rival Leagues, and your League only
// while the multi-year sim runs it by an aim
function aiTalkMove(k, lg) {
  const t = T(k.tid); if (!t) return;
  inLeague(lg, () => {
    const aim = playerLeague() ? simAutoAim() : aimOf(); if (!aim || !S.fin || S.fin.money < 0) return;
    if (k.home === lg) return; // its own staff's talks: the window (expiry) or aiRetain (poach)
    const r = talkAim(aim), tm = playerLeague() ? BID_TEMPERS.steady : bidTemper(), keen = talkKeen(k, lg), mine = k.offers.find(o => o.lg === lg);
    if (!mine) {
      if ((k.looked || []).includes(lg)) return;
      const why = talkCount(lg) >= TALK_MAX ? 'full' : !talkSigns(t, k, lg) ? 'noSign' : null;
      const p = why ? null : aiTalkPost(t, aim);
      if (k.kind === 'star') { const w = why || (p ? null : 'noPost'); if (w) (k.miss = k.miss || {})[lg] = w; else if (k.miss) delete k.miss[lg]; }
      if (!p) return;
      (k.looked = k.looked || []).push(lg); // a League decides once whether it wants them (while it has a post for them)
      if (rand() >= r.first * tm.odds + keen) { if (k.kind === 'star') TALK_AIM_LOG.pass++; return; }
      const o = { lg, post: p.post, slot: p.slot, bid: r.bid0 == null ? aimBid() : Math.max(r.bid0, aim === 'money' ? 0 : aimBid()), bonus: r.bonus0, len: conPref(t, p.post, true), prom: aim !== 'money' && p.post !== 'champion' && rand() < TALK_AI.nodemote ? ['nodemote'] : [], ai: true };
      if (talkSpare(aim) < talkBonus(t, o)) o.bonus = 0;
      if (!makeOffer(k, o)) { TALK_AIM_LOG.first[aim]++; if (p.gap > 0) TALK_AIM_LOG.gap++; if (p.post === 'champion') TALK_AIM_LOG.champ++; }
      return;
    }
    const most = r.raises ? Math.max(0, r.raises + tm.raises) : 0;
    if (k.lead === lg || (mine.raised || 0) >= most || rand() >= r.raise * tm.odds + keen) return;
    const o = aiRaise(mine, r); if (!o || talkSpare(aim, mine) < talkBonus(t, o)) return;
    if (!makeOffer(k, o)) TALK_AIM_LOG.raise[aim]++;
  });
}
// a League's best: its Champion, or its strongest Elite Four member
const isBestOf = t => t.role === 'champion' || (t.role === 'e4' && !S.e4.map(T).some(h => h && h !== t && !h.acting && ovr(h) > ovr(t)));
// a rival League (or yours, while the multi-year sim runs) answers another League going after its staff, by aim: a
// star-maker and a wall-builder match the best offer's pay and bonus in their post (odds by aim and temper) and
// counter when outbid (up to their raises); a money-maker keeps only its best and takes the fee for anyone else. The
// multi-year sim always matches for your League (and counters as a wall-builder would).
function aiRetain(k) {
  const t = T(k.tid), lg = k.home; if (!t || lg == null || k.noMatch) return;
  const auto = handOn() && lg === ME();
  if (auto && !S.simRun) return;
  inLeague(lg, () => {
    const p = postOf(t), best = talkRank(k).find(x => x.o.lg !== lg); if (!p || !best || !S.fin || S.fin.money < 0) return;
    const aim = auto ? (simAutoAim() || 'wall') : aimOf() || 'wall', r = talkAim(aim), tm = auto ? BID_TEMPERS.steady : bidTemper(), mine = k.offers.find(o => o.lg === lg);
    if (mine) { // countering when outbid
      const most = r.raises ? Math.max(0, r.raises + tm.raises) : 0;
      if (k.lead === lg || (mine.raised || 0) >= most || rand() >= r.raise * tm.odds) return;
      const o = aiRaise(mine, r); if (!o || talkSpare(aim, mine) < talkBonus(t, o)) return;
      if (!makeOffer(k, o)) TALK_AIM_LOG.countered++;
      return;
    }
    const keep = auto ? 1 : aim === 'money' ? (isBestOf(t) ? 1 : 0) : r.retain * tm.odds;
    if (rand() >= keep) { k.noMatch = true; if (aim === 'money') TALK_AIM_LOG.sold++; return; }
    const o = { lg, post: p.post, slot: p.slot, bid: Math.min(TALK_BIDS[TALK_BIDS.length - 1], best.o.bid), bonus: best.o.bonus, len: conPref(t, p.post), prom: [], ai: true };
    if (!makeOffer(k, o)) { TALK_LOG.matched++; TALK_AIM_LOG.retained++; }
  });
}
// once a month in a rival League, by aim and temper: it goes after another League's Gym Leader who wants promotion,
// under contract, for an Elite Four seat. Their League answers (aiRetain; in yours the Retention stop). Your League
// can join any of these talks with an offer of its own.
function aiPoach() {
  if (fixedStaff() || nLeagues() < 2 || !S.fin || S.fin.money < 0) return;
  const lg = S.lg || 0, aim = aimOf(); if (!aim || (handOn() && lg === ME()) || talkCount(lg) >= TALK_MAX) return;
  const r = talkAim(aim); if (rand() >= r.poach * bidTemper().odds) return;
  const cands = [];
  for (let j = 0; j < nLeagues(); j++) if (j !== lg && !(S.founding && j === ME())) inLeague(j, () => { for (const g of S.gyms) { const t = T(g.leader); if (t && !t.acting && t.wish && t.wish.k === 'up' && conHolds(t) && canTalk(t) && t.stepDown == null && !t.quit) cands.push([t, j]); } });
  for (const [t, j] of shuffle(cands)) {
    if (!willSign(t, lg)) continue;
    const p = aiTalkPost(t, aim); if (!p || p.post !== 'e4') continue;
    const k = openTalks(t, 'poach', j); if (!k) return;
    const o = { lg, post: p.post, slot: p.slot, bid: r.bid0 == null ? aimBid() : Math.max(r.bid0, aim === 'money' ? 0 : aimBid()), bonus: r.bonus0, len: conPref(t, 'e4', true), prom: [], ai: true };
    if (talkSpare(aim) < talkBonus(t, o)) o.bonus = 0;
    if (makeOffer(k, o)) { closeTalk(k); return; }
    TALK_AIM_LOG.poach++;
    const by = S.lgName;
    if (handOn() && j === ME()) {
      TALK_AIM_LOG.poachYou++;
      const msg = `The ${by} wants ${t.name} (${inLeague(ME(), () => postName(t))}) for its Elite Four seat #${p.slot + 1}. You have until ${turnDate(k.until)} to match or beat its offer, or let them go for the transfer fee (Talks).`;
      inLeague(ME(), () => { news(msg, 'move', t.id); noteChange(msg); stopFor('talks', msg); });
    } else {
      const msg = `The ${by} is after ${dn(t)} of the ${leagueName(j)} for its Elite Four seat #${p.slot + 1}: talks are open until ${turnDate(k.until)}.`;
      inLeague(j, () => news(msg, 'move', t.id));
      if (handOn() && lg !== ME()) inLeague(ME(), () => news(`${msg} Any League can make an offer (Talks).`, 'move', t.id));
    }
    return;
  }
}
// (0.54.0) a Champion who wants a bigger League's seat, when their notice comes due: talks open instead of leaving at
// once (once per notice); Leagues whose seat is about to open can offer theirs, and their own League can offer to
// keep them. True when talks opened.
function champUpTalks(t) {
  if (t.role !== 'champion' || !t.quit || t.quit.k !== 'up' || t.quit.talked || nLeagues() < 2) return false;
  t.quit.talked = true;
  const k = openTalks(t, 'champ', S.lg || 0, 'wants a bigger League\'s seat'); if (!k) return false;
  t.quit.at = Math.max(t.quit.at, k.until + 1); // they wait for the talks
  return true;
}
// ---- the week ----
function closeTalk(k) { const t = T(k.tid); if (t && t.talk === k.id) t.talk = null; S.talks = talkList().filter(x => x !== k); }
// is the trainer still where the talks found them?
function talkValid(k) {
  const t = T(k.tid); if (!t) return false;
  if (k.kind === 'star') return t.role === 'challenger' && !t.hired && !t.spon;
  if (k.kind === 'champ') return t.role === 'champion' && homeLeague(t) === k.home && inLeague(k.home, () => S.champion === t.id) && !!t.quit && t.quit.k === 'up' && t.stepDown == null;
  return ['leader', 'e4', 'champion'].includes(t.role) && homeLeague(t) === k.home && inLeague(k.home, () => postKey(t) === k.post) && t.stepDown == null && (!t.quit || t.quit.k === 'con') && !(t.wish && t.wish.k === 'run' && t.wish.asked != null);
}
function talksWeek() {
  for (const k of talkList().slice()) {
    if (!talkValid(k)) { const t = T(k.tid); TALK_LOG.gone++; closeTalk(k); if (k.kind === 'expiry' && t && STAFF_ROLES.includes(t.role) && t.con && S.turn >= t.con.until && t.stepDown == null && !t.quit) inLeague(homeLeague(t), () => { if (postOf(t)) conEnd(t); }); continue; }
    k.offers = k.offers.filter(o => o.lg >= 0 && o.lg < nLeagues());
    for (const o of k.offers.slice()) if (inLeague(o.lg, () => S.fin && S.fin.money < 0)) { k.offers.splice(k.offers.indexOf(o), 1); TALK_LOG.broke++; } // in the red: the offer falls through
    if (k.kind === 'poach') aiRetain(k);
    for (const lg of shuffle(Array.from({ length: nLeagues() }, (_, i) => i))) aiTalkMove(k, lg);
    talkLead(k, false);
    const t = T(k.tid);
    if (handOn() && k.until - S.turn === TALK_LAST && (k.offers.some(o => o.lg === ME()) || k.home === ME()) && !k.warned) { k.warned = true; inLeague(ME(), () => stopFor('talks', `Talks for ${t.name} end on ${turnDate(k.until)}.`)); }
    if (S.turn >= k.until) settleTalk(k);
  }
}
// the deadline: they sign with the League they are most interested in, if it is enough; else they may walk away
function settleTalk(k) {
  const t = T(k.tid), r = talkRank(k), need = talkNeed(t, k), win = r.find(x => x.v >= need && inLeague(x.o.lg, () => !S.fin || S.fin.money >= talkBonus(t, x.o)));
  closeTalk(k);
  if (k.kind === 'star') { TALK_AIM_LOG.starTalks++; TALK_AIM_LOG.starRival[Math.min(3, k.offers.filter(o => !(handOn() && o.lg === ME())).length)]++; for (const w of Object.values(k.miss || {})) TALK_AIM_LOG.miss[w]++; }
  const tell = (lg, msg) => inLeague(lg, () => { news(msg, 'move', t.id); noteChange(msg); });
  if (!win) {
    const walked = k.offers.length && rand() < TALK_WALK;
    if (walked) { t.walkAt = S.turn; TALK_LOG.walked++; } else TALK_LOG.none++;
    if (k.kind === 'expiry') { inLeague(k.home, () => conEnd(t)); return 'ended'; }
    if (k.kind === 'champ') { inLeague(k.home, () => staffQuits(t)); return 'ended'; } // the old way: to a bigger League's circuit
    if (walked) { const msg = `${dn(t)} walked away from talks: no offer was what they wanted.`; tell(k.home != null ? k.home : lgOf(t), msg); if (k.offers.some(o => o.lg === ME()) && handOn() && k.home !== ME()) tell(ME(), msg); }
    else if (k.kind === 'poach' && k.home === ME() && handOn()) tell(ME(), `${dn(t)} stays: no offer was enough to take them from your League.`);
    return walked ? 'walked' : 'none';
  }
  const o = win.o, n = k.offers.length;
  if (k.home != null && o.lg === k.home) {
    // their own League kept them: a new contract (expiry) or a counter in the post they hold (poach)
    inLeague(o.lg, () => {
      if (k.kind === 'expiry' || k.kind === 'champ') renewCon(t, o.len, false); // (0.54.0) a Champion kept after a bigger-seat notice signs again too
      if (k.kind === 'champ') { t.quit = null; if (t.wish) t.wish.since = S.turn; } // kept, as a raise would
      t.payMul = (t.payMul || 1) * (1 + o.bid); t.lastPay = payOf(t);
      const b = talkBonus(t, o); if (b) book(-b, 'signing', `Signing bonus: ${t.name} (${postName(t)}) stays`);
      if (o.prom.length) t.prom = { lg: o.lg, until: S.turn + PROM_WEEKS, k: o.prom.slice() };
      TALK_LOG.home++;
      tell(o.lg, `${dn(t)} stays as ${postName(t)} after talks${n > 1 ? ` with ${n} Leagues` : ''}${k.kind === 'expiry' ? `, to ${turnDate(t.con.until)}` : ''}.`);
    });
    return 'stayed';
  }
  talkSign(t, o, k, n);
  return 'signed';
}
// t signs for offer o: they leave their circuit or post (a contract that ran out brings their old League no fee), the
// post's holder is replaced (severance; let go in your League), and the bonus is paid
function talkSign(t, o, k, n) {
  const from = STAFF_ROLES.includes(t.role) ? leagueName(homeLeague(t)) : null;
  if (t.role === 'champion') { inLeague(homeLeague(t), () => champLeaves(t, leagueName(o.lg))); if (k.kind === 'expiry') { t.leftAt = null; t.leftLg = null; } t.con = null; }
  else if (STAFF_ROLES.includes(t.role)) { leaveForPost(t, leagueName(o.lg)); if (k.kind === 'expiry') { t.leftAt = null; t.leftLg = null; } t.con = null; }
  if (t.role === 'challenger') dropFromCircuits(t.id);
  t.hired = null; t.hireDue = false; t.leaving = null;
  inLeague(o.lg, () => {
    t.conAsk = o.len; t.bidMul = 1 + o.bid;
    const mine = playerLeague(), h = o.post === 'champion' ? T(S.champion) : o.post === 'e4' ? T(S.e4[o.slot]) : T(S.gyms[o.slot].leader);
    let replaced = '';
    if (o.post === 'champion') { replaced = h ? ` ${champMakeRoom(h)}` : ''; installElite(t, 'champion'); TALK_AIM_LOG.champSigned++; }
    else if (mine) {
      if (h && !h.acting) { const was = postName(h); vacate(h); const fate = letGo(h, was); replaced = ` ${h.name} was let go${fate === 'retired' ? ' and retired' : ''} to make room.`; }
      const v = vacancyAt(o.post, o.slot);
      if (v) fillVacancy(v, t.id, { talk: true });
      else installElite(t, o.post, o.slot);
    } else {
      if (h) {
        const was = postName(h);
        if (o.post === 'e4') S.e4[o.slot] = null; else S.gyms[o.slot].leader = null;
        if (h.acting) { closePost(h); h.acting = false; retire(h, `after standing in as ${was}`); }
        else { closePost(h); severance(h, was); h.letGoAt = S.turn; const fate = retireOrReturn(h, `was replaced as ${was} after talks`); replaced = ` ${h.name} ${fate === 'retired' ? 'retired' : 'returns to the circuit'}.`; }
        if (o.post === 'leader') S.gyms[o.slot].acting = false;
      }
      installElite(t, o.post, o.slot);
    }
    if (o.post === 'leader') staffGym(o.slot);
    const b = talkBonus(t, o); if (b && S.fin) book(-b, 'signing', `Signing bonus: ${t.name} (${postName(t)})`);
    if (o.prom.length) t.prom = { lg: o.lg, until: S.turn + PROM_WEEKS, k: o.prom.slice() };
    if (o.prom.includes('legend')) { const e = (S.vault || []).filter(x => x.m).sort((a, b) => monPower(b.m) - monPower(a.m))[0]; if (e && !vaultGive(e.uid, t.id)) TALK_LOG.legend++; }
    TALK_LOG.signed++; TALK_LOG.byKind[k.kind] = (TALK_LOG.byKind[k.kind] || 0) + 1;
    const msg = `${dn(t)}${from ? ` left the ${from} and` : ''} signed for the ${S.lgName} as ${postName(t)} after talks${n > 1 ? ` with ${n} Leagues` : ''}.${replaced}`;
    news(msg, 'move', t.id); noteChange(msg);
  });
  if (handOn() && k.offers.some(x => x.lg === ME()) && o.lg !== ME()) inLeague(ME(), () => { const msg = `${dn(t)} chose the ${leagueName(o.lg)} over your offer.`; news(msg, 'move', t.id); stopFor('talks', msg); });
}
// (0.54.0) a Champion signing for another League leaves their own seat as one stepping down would: the strongest
// Elite Four member (by the seat rule's heir) moves up, and that seat gets a stand-in and a vacancy (yours) or is
// filled at once (rivals)
function champLeaves(t, toName) {
  const mine = playerLeague(), was = postName(t), seat = champHeirSeat(), at = seat != null ? seat : 0, m = T(S.e4[at]);
  t.quit = null; closePost(t); S.champion = null;
  let fill = '';
  if (m) {
    S.e4[at] = null; m.acting = false; installElite(m, 'champion');
    if (mine) { const a = actingE4(at); openVacancy('e4', at); fill = ` ${a.name} stands in at seat #${at + 1} until you choose a new member.`; }
    else { const nt = rivalE4(at); fill = ` ${nt.name} (${typeLabel(nt)}) fills Elite Four seat #${at + 1}.`; }
  }
  const text = `Champion ${t.name} left ${was} for the ${toName}'s seat.${m ? ` ${dn(m)} moves up from the Elite Four to become Champion.` : ''}${fill}`;
  news(text, 'title', m ? m.id : t.id); noteChange(text);
  if (mine) stopFor('vacancy', text);
}
// (0.54.0) the bound League's leaving Champion makes way for one signed in talks: one stepping down retires now,
// one asking for another run goes on it, anyone else returns to the circuit. Returns the words for the news.
function champMakeRoom(h) {
  const was = postName(h), k = h.stepDown != null ? 'step' : h.quit ? h.quit.k : 'step';
  closePost(h); S.champion = null; h.role = 'exchamp'; h.quit = null; h.stepDown = null;
  if (k === 'run') { comeback(h, was); return `${h.name} goes on another run a little early.`; }
  if (k === 'step') { h.wish = null; retire(h, `after stepping down as ${was} of the ${S.lgName}`); return h.role === 'retired' ? `${h.name} retires a little early.` : `${h.name} returns to the badge circuit.`; }
  h.wish = null; h.letGoAt = S.turn; returnToCircuit(h, `left ${was}`);
  return `${h.name} returns to the badge circuit.`;
}
// ---- the player ----
// talks your League can take part in now: open talks for stars and other Leagues' staff, and your own staff's
function talksForMe() { return talkList().filter(k => T(k.tid)); }
// open talks with your offer: a star or another League's member of staff picked on a hiring page (instead of an
// instant offer). Returns { res: 'talks', err }.
function talkFromHire(t, post, slot, bid) {
  let k = talkOf(t);
  if (!k) {
    const home = STAFF_ROLES.includes(t.role) ? homeLeague(t) : null;
    if (!canTalk(t)) return { res: false };
    k = openTalks(t, home != null ? 'poach' : 'star', home, home != null ? '' : 'an offer from your League');
    if (!k) return { res: false };
  }
  const o = { lg: ME(), post, slot, bid: TALK_BIDS.includes(bid) ? bid : 0, bonus: 0, len: t.conAsk && conOpts(post).includes(t.conAsk) ? t.conAsk : conPref(t, post, true), prom: [] };
  t.conAsk = null;
  const err = makeOffer(k, o);
  if (err && !k.offers.length) closeTalk(k);
  return { res: 'talks', err };
}
// your League answers a rival going after one of your staff: match its pay and bonus in their post, or let them go now
function talkMatch(id) {
  const t = T(id), k = talkOf(t); if (!k || k.home !== ME()) return 'Nobody is in talks for them.';
  const best = talkRank(k).find(x => x.o.lg !== ME()); if (!best) return 'There is no offer to match.';
  const p = inLeague(ME(), () => postOf(t));
  return makeOffer(k, { lg: ME(), post: p.post, slot: p.slot, bid: best.o.bid, bonus: best.o.bonus, len: conPref(t, p.post), prom: [] });
}
function talkLetGo(id) {
  const t = T(id), k = talkOf(t); if (!k || k.home !== ME()) return 'Nobody is in talks for them.';
  const best = talkRank(k).find(x => x.o.lg !== ME()); if (!best) return 'There is no offer to take.';
  closeTalk(k); TALK_LOG.letGo++;
  talkSign(t, best.o, k, k.offers.length);
  return null;
}
// what your scouting shows of other Leagues' offers: 0 only that they are interested, 1 rough, 2 close, 3 close with
// the trainer's interest
const talkSight = () => inLeague(ME(), () => scoutLv());
// promises held: let go or stepped down while one stands is a broken promise (letGo)
function breakPromise(t) {
  if (!promOn(t, 'nodemote', S.lg || 0)) return false;
  t.prom = null; TALK_LOG.broken++;
  return true;
}
// the transfer fee you would receive if a member of your staff signed offer o
const talkFee = (t, o) => SIGN_WEEKS * talkPay(t, o);
