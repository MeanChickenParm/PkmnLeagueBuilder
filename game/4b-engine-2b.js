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
    qualifiers: L.entries.length, metaMons: meta, steers: JSON.parse(JSON.stringify(steerState())), metaTrend: (S.metaTrend || []).slice(), ...yearDetail(L), ...(L.chal ? { chal: L.chal.slice() } : {}),
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
      + (wl === i ? PRESTIGE_WORLD : 0) + cities + rank + (S.fin && !lapsed() ? sanctLevels() * SANCT_PRESTIGE : 0) + (S.ranch ? showcase().prest : 0);
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
