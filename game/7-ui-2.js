// ---------- the badge circuit, gyms and Elite ----------
function viewCircuit() {
  const rows = challengers().sort((a, b) => b.badges.length - a.badges.length || (a.badgeWeek || 99) - (b.badgeWeek || 99) || ovr(b) - ovr(a));
  return `${legendBanner()}${roamBanner()}${stormBanner()}${outbreakBanner()}
  <section class="panel"><div class="ph"><h2>Badge circuit${nLeagues() > 1 ? ' · ' + S.lgName : ''} · Season ${S.season || 1}</h2><span class="muted">${rows.length} challengers</span></div>
  <div class="scroll"><table class="tbl"><thead><tr><th>#</th><th>Trainer</th><th>OVR</th><th>Age</th><th>Type</th><th>Badges</th><th>Gym W–L</th><th>Next gym</th><th>Pokémon</th></tr></thead><tbody>
  ${rows.map((t, i) => { const w = t.weekLog.filter(e => e.won === true).length, l = t.weekLog.filter(e => e.won === false).length;
    return `<tr><td class="num">${i + 1}</td><td>${tname(t.id)}${t.seasons <= 1 ? ' <span class="tag">rookie</span>' : ''}</td><td>${ovrPill(t)}</td><td class="num">${t.age}</td><td>${specChips(t)}</td><td>${badgeRow(t)}</td><td class="num">${w}–${l}</td><td>${gymStatus(t)}</td><td>${teamDots(t)}</td></tr>`; }).join('')}
  </tbody></table></div></section>${skyPanel()}`;
}
// where a challenger stands at their next gym: tries used, gym trainers beaten, or out for the season
function gymStatus(t) {
  const g = t.badges.length;
  if (t.out) return `<span class="tag notice" title="Lost three times at ${townName(g)} Gym in week ${t.out}">Out · week ${t.out}</span>`;
  if (g >= 8) return '<span class="muted">Qualified</span>';
  const used = t.gymTries || 0, st = t.gymStage || 0;
  return `<span class="small">${townName(g)} · ${GYM_TRIES - used} ${GYM_TRIES - used === 1 ? 'try' : 'tries'} left${st ? ` · ${st} of ${GYM_TRAINERS} trainers beaten` : ''}</span>`;
}
function eliteCard(t, label, extra = '', foot = '') {
  return `<article class="elite"><div class="eyebrow">${label}</div><div class="elite-h">${tname(t.id)} ${ovrPill(t)}</div><div class="elite-s">${specChips(t)} <span class="muted">Age ${t.age}</span> ${extra}</div>
    <ul class="mini">${t.team.slice().reverse().map(m => `<li><span>${monMini(m.sp, m.shiny || m.radiant)}<button class="tlink" data-act="mon" data-t="${t.id}" data-u="${m.uid}">${m.sp}</button></span><span class="num">${stOf(m).b ? wl(stOf(m)) + ' · ' : ''}Lv ${Math.floor(m.lvl)}</span></li>`).join('')}</ul>${foot}</article>`;
}
function viewGyms() {
  const ch = T(S.champion);
  return `<section class="panel champ"><div class="ph"><h2>Champion</h2><span class="muted">${ch.career.defenses} defenses · ${ch.career.conceded || 0} title${(ch.career.conceded || 0) === 1 ? '' : 's'} conceded · keeps the seat when beaten</span></div>${eliteCard(ch, `${S.lgName} Champion`)}</section>
  <section class="panel"><div class="ph"><h2>Elite Four</h2><span class="muted">Faced in this order, each at a set level for both sides (${E4_LV.join(', ')}; the Champion at ${champLv()})</span></div><div class="elite-grid">${S.e4.map((id, i) => eliteCard(T(id), `Elite Four #${i + 1} · ${T(id).career.e4Wins} career wins`)).join('')}</div></section>
  <section class="panel"><div class="ph"><h2>Gyms</h2><span class="muted">Every battle is at the gym's set level for both sides, and a challenger fields as many Pokémon as the trainer in front of them. They must beat both gym trainers, then the leader, and get ${GYM_TRIES} tries a season at each gym. Record is tries turned back–badges conceded this season. A season holding under 30% of 6+ tries is a poor season; three in a row and the League replaces the leader.</span></div><div class="elite-grid">${S.gyms.map((g, i) => g.leader ? eliteCard(T(g.leader), `Badge ${i + 1} · ${townName(i)} · Lv ${GYM_LV[i]}`, `${gymWeatherTag(T(g.leader))}${g.poorFor === g.leader && g.poor ? `<span class="tag notice" title="Three poor seasons in a row and the League replaces the leader">${g.poor} poor season${g.poor > 1 ? 's' : ''}</span>` : ''}<span class="rec">${g.w}–${g.l}</span>`, gymTrainerList(g, i)) : `<article class="elite"><div class="eyebrow">Badge ${i + 1} · ${townName(i)}</div><p class="muted">Vacant</p></article>`).join('')}</div></section>${banCard()}`;
}
function gymTrainerList(g, i) {
  const ts = (g.trainers || []).map(T).filter(Boolean);
  if (!ts.length) return '';
  return `<div class="eyebrow" style="margin-top:.6rem">Gym trainers · ${GYM_SIZE[i] - 1} Pokémon each</div><ul class="mini">${ts.map(t => `<li><span>${tname(t.id)} ${ovrPill(t)}</span><span class="small muted">${t.team.map(m => m.sp).join(', ')}</span></li>`).join('')}</ul>`;
}
// the wall report: the headline (perfect seasons and the streak) and each season's line
function wallReport() {
  const h = S.history.filter(x => x.titles != null);
  if (!h.length) return '';
  const perfect = h.filter(x => !x.titles).length;
  let streak = 0; for (let i = h.length - 1; i >= 0 && !h[i].titles; i--) streak++;
  let best = 0, run = 0; for (const x of h) { run = x.titles ? 0 : run + 1; best = Math.max(best, run); }
  const avg = f => (h.reduce((a, x) => a + f(x), 0) / h.length).toFixed(1);
  return `<section class="panel"><div class="ph"><h2>Wall report${nLeagues() > 1 ? ' · ' + S.lgName : ''}</h2><span class="muted">A perfect season is one with no title conceded</span></div>
  <p><b>${perfect}</b> perfect season${perfect === 1 ? '' : 's'} in ${h.length} · current streak <b>${streak}</b> · longest <b>${best}</b> · ${avg(x => x.badges)} badges conceded a season · ${avg(x => x.titles)} titles conceded a season</p>
  <div class="scroll"><table class="tbl"><thead><tr><th>Season</th><th>Result</th><th>Titles conceded</th><th>Badges conceded</th><th>Finished the circuit</th><th>Out on three losses</th><th>Best challenger</th></tr></thead><tbody>
  ${h.slice().reverse().map(x => `<tr><td class="num">${x.season}</td><td>${x.titles ? '<span class="tag notice">Conceded</span>' : '<span class="tag gold">Perfect</span>'}</td><td>${x.titles ? x.winners.map(tname).join(', ') : '—'}</td><td class="num">${x.badges}</td><td class="num">${x.qualifiers}</td><td class="num">${x.out}</td><td>${x.bestId ? tname(x.bestId) + ` <span class="muted">(${depthName(x.best)})</span>` : '—'}</td></tr>`).join('')}
  </tbody></table></div></section>`;
}
// ---------- trainers page ----------
const recOf = t => t.rec || { w: 0, l: 0, gw: 0, gl: 0, lw: 0, ll: 0, tw: 0, tl: 0 };
const ROLE_SHORT = { challenger: 'Challenger', leader: 'Gym Leader', gymtrainer: 'Gym trainer', e4: 'Elite Four', champion: 'Champion', retired: 'Retired', exchamp: 'Former Champion', free: 'Free agent' };
function positionText(t) {
  const lg = nLeagues() > 1 && [...STAFF_ROLES, 'challenger'].includes(t.role) ? ` · ${lgShort(lgOf(t))}` : '';
  return positionHere(t) + lg;
}
function positionHere(t) {
  if (t.role === 'leader') return inLeague(lgOf(t), () => { const i = S.gyms.findIndex(g => g.leader === t.id); return `${townName(i)} Gym Leader`; });
  if (t.role === 'e4') return inLeague(lgOf(t), () => `Elite Four #${S.e4.indexOf(t.id) + 1}`);
  if (t.role === 'gymtrainer') return inLeague(lgOf(t), () => { const i = S.gyms.findIndex(g => (g.trainers || []).includes(t.id)); return `${townName(i)} Gym trainer`; });
  return ROLE_SHORT[t.role] || t.role;
}
function circuitWins(t) { return (t.seasonHist || []).filter(h => h.badges === 8).length; }
function bestFinish(t) { let b = null; for (const h of t.seasonHist || []) if (h.stage != null && (b == null || h.stage > b)) b = h.stage; return b; }
// which League an accomplishment happened in (several Leagues only; old records may not know)
const lgIn = lg => nLeagues() > 1 && lg != null && lg < nLeagues() ? lgShort(lg) : '';
// "Season 3, 5" with one League; "Season 3 (Kanto), 5 (Johto)" with several
const seasonsLg = items => {
  const plain = 'Season ' + items.map(x => x.season).join(', ');
  if (nLeagues() < 2) return plain;
  const groups = []; for (const x of items) { const k = lgIn(x.lg); let g = groups.find(y => y.k === k); if (!g) groups.push(g = { k, s: [] }); g.s.push(x.season); }
  if (groups.length === 1) return groups[0].k ? `${plain} · ${groups[0].k}` : plain;
  return groups.map(g => `${g.k ? g.k + ': ' : ''}Season ${g.s.join(', ')}`).join('; ');
};
const titleList = t => (t.titleSeasons || []).map((season, i) => ({ season, lg: (t.titleLgs || [])[i] }));
// "Kanto 2, Johto 1" for a list of { lg }
const lgCounts = items => { if (nLeagues() < 2) return ''; const c = {}; for (const x of items) if (lgIn(x.lg)) c[x.lg] = (c[x.lg] || 0) + 1; const ks = Object.keys(c); return ks.length ? ks.sort().map(k => `${lgShort(+k)} ${c[k]}`).join(', ') : ''; };
// honors shown as tags in the table and listed on the profile
function accolades(t) {
  const a = [];
  const ts = t.titleSeasons || [];
  if (ts.length || t.career.titles) a.push({ k: 'title', tag: `Champion${(ts.length || t.career.titles) > 1 ? ' ×' + (ts.length || t.career.titles) : ''}`, text: `League Champion${ts.length ? ' (' + seasonsLg(titleList(t)) + ')' : ''}` });
  if (nLeagues() > 1) {
    if (isGrandSlam(t)) a.push({ k: 'slam', tag: 'Triple Crown', text: `Triple Crown: Champion of three different Leagues (${[...champLeaguesOf(t)].sort().map(leagueName).join(', ')})${t.grandSlam ? ', completed in Season ' + t.grandSlam : ''}` });
    else { const cl = champLeaguesOf(t), N = nLeagues(); if (cl.size >= 2) a.push({ k: 'multi', tag: `Crown ${cl.size}/${CROWN_LEAGUES}`, text: `Champion of ${cl.size} Leagues: ${[...cl].sort().map(leagueName).join(', ')}. One more League for the Triple Crown${N >= CROWN_LEAGUES ? ': ' + unwonLeagues(t).map(leagueName).join(' or ') : ''}${slamProtected(t) ? '. Chasing the Crown keeps them going 3 seasons past their usual career length' : ''}` }); }
    const wc = (t.worldSeasons || []).length; if (wc) a.push({ k: 'world', tag: `World Champion${wc > 1 ? ' ×' + wc : ''}`, text: `World Champion (Season ${t.worldSeasons.join(', ')})` });
  }
  for (const c of t.comebacks || []) a.push({ k: 'comeback', tag: '', text: `Stepped down from ${c.gym} Gym${lgIn(c.lg) ? ' (' + leagueName(c.lg) + ')' : ''} in Season ${c.season} after ${c.seasons} outstanding seasons in a row, to chase the title` });
  for (const c of t.classHist || []) a.push({ k: 'reinvent', tag: '', text: `Reinvented in Season ${c.season}: was ${c.from}${c.fromSpec ? ' (' + c.fromSpec + ')' : ''}, became a ${c.spec} specialist` });
  const ir = t.interim || [];
  if (ir.length) a.push({ k: 'interim', tag: `Interim Champion${ir.length > 1 ? ' ×' + ir.length : ''}`, text: ir.map(x => `Interim Champion, Season ${x.season}${lgIn(x.lg) ? ', ' + leagueName(x.lg) : ''}: beat Champion ${x.beatName || (T(x.beat) || {}).name || '?'}, then lost the title to ${x.lostToName || (T(x.lostTo) || {}).name || 'a challenger'} in the same League`).join('; ') });
  const byK = {}; for (const x of t.awards || []) (byK[x.k] = byK[x.k] || []).push(x);
  for (const k of Object.keys(AWARDS)) if (byK[k] && !['poy', 'coy'].includes(k)) a.push({ k: 'award', tag: `${AWARDS[k].short}${byK[k].length > 1 ? ' ×' + byK[k].length : ''}`, text: `${AWARDS[k].name} (${seasonsLg(byK[k])})` });
  for (const x of t.greatLegends || []) a.push({ k: 'legend', tag: x.sp, text: x.how === 'glitch' ? `${x.sp} glitched onto the team (${seasonsLg([x])})` : `${x.how === 'caught' ? 'Caught' : 'Chosen by'} ${x.sp} (${seasonsLg([x])})` });
  if (t.career.defenses) a.push({ k: 'def', tag: `${t.career.defenses} defense${t.career.defenses > 1 ? 's' : ''}`, text: `${t.career.defenses} successful title defense${t.career.defenses > 1 ? 's' : ''}` });
  if (t.hof) a.push({ k: 'hof', tag: 'Hall of Fame', text: `Hall of Fame${t.retiredSeason ? ', inducted Season ' + t.retiredSeason : ''}` });
  const cw = circuitWins(t); if (cw) { const by = lgCounts((t.seasonHist || []).filter(h => h.badges === 8)); a.push({ k: 'circ', tag: `Circuit ×${cw}`, text: `Completed the badge circuit ${cw} time${cw > 1 ? 's' : ''}${by ? ' (' + by + ')' : ''}` }); }
  const bf = bestFinish(t); if (bf != null && bf < 5) { const where = [...new Set((t.seasonHist || []).filter(h => h.stage === bf && lgIn(h.lg)).map(h => leagueName(h.lg)))]; a.push({ k: 'run', tag: '', text: `Best League finish: ${bf === 4 ? 'Championship match' : 'Elite Four #' + (bf + 1)}${where.length ? ' (' + where.join(', ') + ')' : ''}` }); }
  if (t.career.e4Wins) a.push({ k: 'e4', tag: '', text: `${t.career.e4Wins} wins as an Elite Four member` });
  if (t.legacy) a.push({ k: 'legacy', tag: 'Legacy', text: `Child of ${tname(t.legacy.parent)}${t.legacy.skipped ? ` (their ${t.legacy.skipped} stayed behind: legendaries can't be passed down, since only one of each can exist at a time)` : ''}` });
  if ((t.children || []).length) a.push({ k: 'parent', tag: '', text: `Parent of ${t.children.map(id => tname(id)).join(', ')}` });
  if (t.famous) { const ft = famousTags(t); a.push({ k: 'famous', tag: '', text: `Famous trainer${ft.length ? ' — known as ' + ft.map(k => FAMOUS_TAG_LABELS[k]).join(', ') : ''}` });
    for (const k of ft) a.push({ k: 'fam fam-' + k, tag: '★ ' + FAMOUS_TAG_LABELS[k], text: '' }); }
  return a;
}
const accTags = t => accolades(t).filter(x => x.tag).map(x => `<span class="tag acc-${x.k}">${x.tag}</span>`).join(' ');
let trFam = 'all';
let trScope = 'active', trGroup = 'all', trSort = { k: 'w', dir: -1 }, trQ = '';
const fold = x => String(x).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const esc = x => String(x).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
function searchBox(id, val, label, ph) {
  return `<div class="search"><label class="sr" for="${id}">${label}</label><input id="${id}" type="search" autocomplete="off" spellcheck="false" placeholder="${ph}" value="${esc(val)}"><span class="search-ic" aria-hidden="true">⌕</span></div>`;
}
const TR_COLS = [['name', 'Trainer'], ['pos', 'Position'], ['age', 'Age'], ['ovr', 'OVR'], ['w', 'W'], ['l', 'L'], ['pct', 'Win %'], ['gym', 'Gym'], ['lg', 'League'], ['badges', 'Badges'], ['titles', 'Titles'], ['mons', 'Pokémon'], ['acc', 'Honors']];
function viewTrainers() {
  const pill = (v, cur, act, l) => `<button class="pill${cur === v ? ' on' : ''}" data-act="${act}" data-v="${v}">${l}</button>`;
  return `<section class="panel"><div class="ph"><h2>Trainers</h2><span class="muted">Records count every battle, gym and League, on either side</span></div>
    ${searchBox('trsearch', trQ, 'Search trainers', 'Search by name, class or Pokémon')}
    <div class="filters">${pill('active', trScope, 'trscope', 'Active')}${pill('retired', trScope, 'trscope', 'Retired')}${pill('all', trScope, 'trscope', 'Everyone')}
      <span class="tab-sep" aria-hidden="true"></span>${pill('all', trGroup, 'trgroup', 'All roles')}${pill('chal', trGroup, 'trgroup', 'Challengers')}${pill('elite', trGroup, 'trgroup', 'Leaders, E4 & Champion')}${pill('famous', trGroup, 'trgroup', 'Famous')}</div>
    ${trGroup === 'famous' ? `<div class="filters sub">${pill('all', trFam, 'trfam', 'All famous')}${Object.keys(FAMOUS_TAG_LABELS).filter(k => !FAMOUS_PACKS[k] || packOn(k)).map(k => pill(k, trFam, 'trfam', FAMOUS_TAG_PLURAL[k])).join('')}</div>` : ''}
    <div id="trres">${trainersResults()}</div>
    <p class="fine">Gym = gym battles (as challenger or as leader). League = Elite Four and title battles. Hover the Pokémon dots to see a team; click a name for the full profile.</p>
  </section>`;
}
function trainersResults() {
  let list = Object.values(S.trainers).filter(t => t.role !== 'prospect');
  if (trScope === 'active') list = list.filter(t => t.role !== 'retired' && t.role !== 'free');
  if (trScope === 'retired') list = list.filter(t => t.role === 'retired');
  if (trGroup === 'chal') list = list.filter(t => t.role === 'challenger');
  if (trGroup === 'elite') list = list.filter(t => STAFF_ROLES.includes(t.role));
  if (trGroup === 'famous') list = list.filter(t => t.famous && (trFam === 'all' || famousTags(t).includes(trFam)));
  const q = fold(trQ.trim());
  if (q) list = list.filter(t => fold([dn(t), t.name, t.cls, t.legacy ? 'legacy' : '', positionText(t), specName(t), t.spec2 ? 'dual' : '', traitOf(t) ? TRAITS[traitOf(t)].name : '', t.rival ? 'rival' : '', t.nemesis ? 'nemesis' : '', ...famousTags(t).map(k => FAMOUS_TAG_LABELS[k]), ...t.team.map(m => m.sp)].join(' ')).includes(q));
  const val = (t, k) => { const r = recOf(t); const b = r.w + r.l;
    return { name: dn(t), pos: positionText(t), age: t.age, ovr: ovr(t), w: r.w, l: r.l, pct: b ? r.w / b : -1, gym: r.gw, lg: r.lw + r.tw, badges: t.career.badges, titles: (t.titleSeasons || []).length || t.career.titles, mons: t.team.length + (t.alumni || []).length, acc: accolades(t).length }[k]; };
  list.sort((a, b) => { const x = val(a, trSort.k), y = val(b, trSort.k); const c = typeof x === 'string' ? x.localeCompare(y) : x - y; return c * trSort.dir || recOf(b).w - recOf(a).w; });
  const th = ([k, l]) => `<th><button class="sort${trSort.k === k ? ' on' : ''}" data-act="trsort" data-k="${k}">${l}${trSort.k === k ? (trSort.dir < 0 ? ' ↓' : ' ↑') : ''}</button></th>`;
  const shown = list.slice(0, 200);
  const count = `<p class="muted small">${list.length} trainer${list.length === 1 ? '' : 's'}${q ? ` matching “${esc(trQ.trim())}”` : ''}</p>`;
  if (!shown.length) return count + `<p class="muted">No trainers match${q ? ' that search' : ''}. ${q || trScope !== 'all' || trGroup !== 'all' ? 'Try “Everyone” and “All roles”, or a shorter search.' : ''}</p>`;
  return count + `<div class="scroll"><table class="tbl trainers"><thead><tr>${TR_COLS.map(th).join('')}</tr></thead><tbody>
    ${shown.map(t => { const r = recOf(t); const b = r.w + r.l; return `<tr>
      <td>${tname(t.id)}</td><td>${positionText(t)}</td><td class="num">${t.age}</td><td>${ovrPill(t)}</td>
      <td class="num">${r.w}</td><td class="num">${r.l}</td><td class="num">${b ? Math.round(r.w / b * 100) + '%' : '—'}</td><td class="num">${r.gw}–${r.gl}</td><td class="num">${r.lw + r.tw}–${r.ll + r.tl}</td>
      <td class="num">${t.career.badges}</td><td class="num">${(t.titleSeasons || []).length || t.career.titles || ''}</td>
      <td title="${t.team.map(m => m.sp + ' Lv ' + Math.floor(m.lvl)).join(', ')}">${teamDots(t)}</td><td class="acc">${accTags(t)}</td></tr>`; }).join('')}
    </tbody></table></div>${list.length > 200 ? `<p class="fine">Showing 200 of ${list.length}. Search, sort or filter to find others.</p>` : ''}`;
}

let dexScope = 'season', dexSort = { k: 'b', dir: -1 }, dexMin = 5, dexQ = '', dexKind = 'all';
// special kinds: legendaries (incl. mythicals and baby legendaries, not Ultra Beasts), Paradox, Ultra Beasts
const DEX_KINDS = [['all', 'All Pokémon'], ['legend', 'Legendary & mythical'], ['paradox', 'Paradox'], ['ub', 'Ultra Beasts']];
const kindOf = sp => { const s = SP[sp]; return s.ub ? 'ub' : s.paradox ? 'paradox' : (s.legend || (s.baby && s.label !== 'One of a kind') || (LINE[sp] && SP[LINE[sp]] && SP[LINE[sp]].baby && SP[LINE[sp]].label !== 'One of a kind')) ? 'legend' : 'all'; };
const kindOk = sp => dexKind === 'all' || kindOf(sp) === dexKind;
// traits of individual Pokémon (not species): filter the roster and league-wide lists
let dexTrait = 'any';
const DEX_TRAITS = [['any', 'Any'], ['radiant', '✧ Radiant'], ['shiny', '✦ Shiny'], ['alpha', 'Alpha'], ['delta', 'Δ Delta'], ['hidden', 'Hidden ability']];
const isHidden = m => { const A = SPECIES_AB[m.sp]; const a = abilityOf(m); return !!(a && A && m.abSlot === 'H' && A.H === a); };
const TRAIT_TEST = { radiant: m => m.radiant, shiny: m => m.shiny, alpha: m => m.alpha, delta: m => m.delta, hidden: isHidden };
const traitOk = m => dexTrait === 'any' || !!TRAIT_TEST[dexTrait](m);
const indivTags = m => `${m.radiant ? ' <span class="tag radiant" title="Radiant: shiny colors, at least Good IVs and a stronger ability than its species ever gets">✧ Radiant</span>' : ''}${m.shiny ? ' <span class="tag shiny">✦ Shiny</span>' : ''}${m.radiant ? ' <span class="tag radiant" title="Radiant: shiny colors, at least Good IVs and a stronger ability than its species ever gets">✧ Radiant</span>' : ''}${m.delta ? ` <span class="tag delta" title="Delta Pokémon: an unusual ${m.delta} type">Δ Delta</span>` : ''}${m.alpha ? ' <span class="tag alpha">Alpha</span>' : ''}${isHidden(m) ? ` <span class="tag gold" title="Hidden ability: ${esc(abilityOf(m))}">Hidden ability</span>` : ''}${condTags(m)}`;
const activeMons = () => { const out = []; for (const t of Object.values(S.trainers)) if (!['retired', 'prospect', 'free'].includes(t.role)) for (const m of t.team) out.push({ t, m }); return out; };
const DEX_COLS = [['sp', 'Pokémon'], ['owned', 'On teams'], ['b', 'Battles'], ['w', 'W'], ['l', 'L'], ['pct', 'Win %'], ['ko', 'KOs'], ['kpb', 'KO / battle']];
const monMatch = (sp, q) => fold(sp + ' ' + SP[sp].types.join(' ')).includes(q);
// v185: Pokémon this league's Pokédex changed or added
const dexTag = sp => SP[sp] && SP[sp].dexMod === 'new' ? ' <span class="tag gold" title="A Pokémon from this league\'s own Pokédex">New</span>' : SP[sp] && SP[sp].dexMod === 'edited' ? ' <span class="tag" title="Its types, stats or abilities were changed in this league\'s Pokédex">Changed</span>' : '';
function dexNote() {
  const d = S.cfg && S.cfg.dex; if (!dexHas(d)) return '';
  const ne = Object.keys(d.edits || {}).length, added = (d.added || []).map(e => e.name).filter(n => SP[n]);
  return `<section class="panel callout"><div class="eyebrow">This league's Pokédex</div><p>${ne ? `${ne} Pokémon ${ne === 1 ? 'has' : 'have'} changed types, stats or abilities` : ''}${ne && added.length ? ', and ' : ''}${added.length ? `${added.length} new Pokémon ${added.length === 1 ? 'is' : 'are'} in the game: ${added.slice(0, 12).map(esc).join(', ')}${added.length > 12 ? '…' : ''}` : ''}. It was set when the league was created and doesn't change. Search a name to see it.</p></section>`;
}
function dexRows(q) {
  const src = dexScope === 'season' ? (S.dexSeason || {}) : (S.dex || {});
  const owned = {};
  for (const t of Object.values(S.trainers)) if (!['retired', 'prospect'].includes(t.role)) for (const m of t.team) owned[m.sp] = (owned[m.sp] || 0) + 1;
  // a search looks up every species in the game, battled or not; otherwise only species with enough battles
  // a special-kind filter lists every one of that kind that's been held or battled, whatever the minimum
  const names = q ? Object.keys(SP).filter(sp => monMatch(sp, q) && kindOk(sp) && (!(SP[sp].legend || SP[sp].paradox || SP[sp].baby) || owned[sp] || src[sp]))
    : dexKind !== 'all' ? Object.keys(SP).filter(sp => kindOk(sp) && (owned[sp] || (src[sp] && src[sp].b)))
    : Object.keys(src).filter(sp => src[sp].b >= dexMin);
  return names.map(sp => { const st = src[sp] || blankStat(); return { sp, st, owned: owned[sp] || 0, b: st.b, w: st.w, l: st.l, ko: st.ko, pct: st.b ? st.w / st.b : 0, kpb: st.b ? st.ko / st.b : 0 }; });
}
function viewDex() {
  return dexNote() + `<section class="panel">${searchBox('dexsearch', dexQ, 'Search Pokémon', 'Search by Pokémon name or type')}
    <div class="filters">${DEX_KINDS.map(([k, l]) => `<button class="pill${dexKind === k ? ' on' : ''}" data-act="dexkind" data-v="${k}">${l}</button>`).join('')}</div>
    <div class="filters"><span class="muted small" style="align-self:center">Individuals:</span>${(() => { const all = activeMons(); return DEX_TRAITS.filter(([k]) => k !== 'hidden' || featOn('abilities')).map(([k, l]) => { const n = k === 'any' ? 0 : all.filter(x => TRAIT_TEST[k](x.m)).length; return `<button class="pill${dexTrait === k ? ' on' : ''}" data-act="dextrait" data-v="${k}"${k !== 'any' && !n ? ' disabled' : ''}>${l}${k !== 'any' ? ` <span class="muted">${n}</span>` : ''}</button>`; }).join(''); })()}</div></section>
  <div id="dexres">${dexResults()}</div>`;
}
function dexResults() {
  const q = fold(dexQ.trim());
  const trait = dexTrait !== 'any', traitLabel = (DEX_TRAITS.find(k => k[0] === dexTrait) || [])[1];
  const special = dexKind !== 'all', kindLabel = (DEX_KINDS.find(k => k[0] === dexKind) || [])[1];
  const rows = dexRows(q).sort((a, b) => { const k = dexSort.k; const x = k === 'sp' ? a.sp.localeCompare(b.sp) : a[k] - b[k]; return x * dexSort.dir || b.b - a.b || a.sp.localeCompare(b.sp); });
  const th = ([k, l]) => `<th><button class="sort${dexSort.k === k ? ' on' : ''}" data-act="dexsort" data-k="${k}">${l}${dexSort.k === k ? (dexSort.dir < 0 ? ' ↓' : ' ↑') : ''}</button></th>`;
  // with a search, also list every individual Pokémon of that kind on an active trainer
  let owners = '';
  if (q || special || trait) {
    const found = activeMons().filter(({ m }) => (!q || monMatch(m.sp, q)) && kindOk(m.sp) && traitOk(m));
    found.sort((a, b) => stOf(b.m).w - stOf(a.m).w);
    owners = `<section class="panel"><div class="ph"><h2>Across the league</h2><span class="muted">${found.length}${trait ? ' ' + traitLabel : ''} on active trainers</span></div>
      ${found.length ? `<div class="scroll"><table class="tbl"><thead><tr><th>Pokémon</th><th>Trainer</th><th>Lv</th><th>Season</th><th>Career</th><th>Win %</th><th>KOs</th></tr></thead><tbody>
      ${found.slice(0, 80).map(({ t, m }) => { const ss = ssOf(m), st = stOf(m); return `<tr><td>${monMini(m.sp, m.shiny || m.radiant)}<button class="tlink" data-act="mon" data-t="${t.id}" data-u="${m.uid}">${m.sp}</button> ${chips(monTypes(m))}${indivTags(m)}${(special || trait) && m.met ? ` <span class="muted small">${HOW[m.met.how] || ''}</span>` : ''}</td><td>${tname(t.id)}</td><td class="num">${Math.floor(m.lvl)}</td><td class="num">${wl(ss)}</td><td class="num">${wl(st)}</td><td class="num">${pct(st)}</td><td class="num">${st.ko}</td></tr>`; }).join('')}
      </tbody></table></div>${found.length > 80 ? `<p class="fine">Showing 80 of ${found.length}.</p>` : ''}` : '<p class="muted">No active trainer has one right now.</p>'}</section>`;
  }
  // individual traits don't apply to species stats, so the Pokédex steps aside while one is on
  const dexPanel = trait ? `<section class="panel"><p class="muted">The League Pokédex counts whole species, so it isn't filtered by ${traitLabel}. <button class="link" data-act="dextrait" data-v="any">Show all Pokémon</button></p></section>` : null;
  return `${owners}
  ${dexPanel || `<section class="panel"><div class="ph"><h2>League Pokédex</h2><span class="muted">${q ? `Every species matching “${esc(dexQ.trim())}”${special ? ' (' + kindLabel + ')' : ''}, battled or not` : special ? `${kindLabel} that have been on a team or in a battle` : 'Every battle by every trainer, gyms and League included'}</span></div>
    <div class="filters"><button class="pill${dexScope === 'season' ? ' on' : ''}" data-act="dexscope" data-v="season">Season ${S.season || 1}</button><button class="pill${dexScope === 'all' ? ' on' : ''}" data-act="dexscope" data-v="all">All time</button>
      ${q || special ? '' : `<span class="muted small">Minimum battles:</span>${[1, 5, 20].map(n => `<button class="pill${dexMin === n ? ' on' : ''}" data-act="dexmin" data-v="${n}">${n}</button>`).join('')}`}</div>
    ${rows.length ? `<div class="scroll"><table class="tbl"><thead><tr>${DEX_COLS.map(th).join('')}</tr></thead><tbody>
    ${rows.slice(0, 120).map(r => `<tr><td>${monMini(r.sp, false)}<b>${r.sp}</b> ${chips(SP[r.sp].types)}${SP[r.sp].legend ? ' <span class="tag legend">Legendary</span>' : ''}${SP[r.sp].paradox ? ' <span class="tag paradox">Paradox</span>' : ''}${babyTag(SP[r.sp])}${dexTag(r.sp)}</td><td class="num">${r.owned || '—'}</td><td class="num">${r.b}</td><td class="num">${r.w}</td><td class="num">${r.l}</td><td class="num">${r.b ? (r.pct * 100).toFixed(0) + '%' : '—'}</td><td class="num">${r.ko}</td><td class="num">${r.b ? r.kpb.toFixed(2) : '—'}</td></tr>`).join('')}
    </tbody></table></div>${rows.length > 120 ? `<p class="fine">Showing the top 120 of ${rows.length}.</p>` : ''}` : `<p class="muted">${q ? 'No Pokémon in the game match that search.' : special ? `No ${kindLabel.toLowerCase()} have been on a team or in a battle ${dexScope === 'season' ? 'this season. Try “All time”.' : 'yet.'}` : `No Pokémon have ${dexMin} or more battles ${dexScope === 'season' ? 'this season' : 'yet'}.`}</p>`}
  </section>`}`;
}
function viewNews() {
  const tags = [['all', 'All'], ['title', 'Titles'], ['move', 'Moves'], ['catch', 'Catches'], ['meta', 'Meta'], ['circuit', 'Circuit'], ['league', 'League']];
  // with several Leagues the page shows the chosen League's news plus world-wide news
  const items = S.news.filter(n => (n.lg == null || n.lg === viewLg || nLeagues() < 2) && (newsFilter === 'all' || n.tag === newsFilter || (newsFilter === 'catch' && isCatchNews(n)))).slice(0, 150);
  return `<section class="panel"><div class="ph"><h2>${nLeagues() > 1 ? S.lgName + ' news' : 'League news'}</h2></div><div class="filters">${tags.map(([k, l]) => `<button class="pill${newsFilter === k ? ' on' : ''}" data-act="nf" data-v="${k}">${l}</button>`).join('')}</div>${newsList(items)}</section>`;
}
// ---------- records ----------
// age when a trainer won a given title: stored at the time for new titles, estimated for older ones
function ageAtSeason(t, season) {
  const a = (t.titleAges || []).find(x => x.season === season); if (a) return a.age;
  return t.age - (((t.role === 'retired' ? t.retiredSeason : S.season) || S.season) - season);
}
// 6-0 sweeps; before they were counted, a best of 6 KOs in a battle means at least one
const sweepsOf = m => m.sweeps != null ? m.sweeps : (m.best || 0) >= 6 ? 1 : 0;
// every Pokémon that has battled for anyone, current teams and former ones
// legendaries waiting for a new partner, in every League
function pooledLegends() { const out = []; for (let i = 0; i < nLeagues(); i++) inLeague(i, () => { for (const m of S.legendPool || []) out.push({ m, lg: i }); }); return out; }
// a legendary by its id, wherever it is now: on a team (t) or waiting in a League (lg)
function findLegend(uid) {
  for (const t of Object.values(S.trainers)) { if (t.role === 'prospect') continue; const m = t.team.find(x => x.uid === uid && x.partners); if (m) return { m, t }; }
  const p = pooledLegends().find(x => x.m.uid === uid); return p ? { m: p.m, lg: p.lg } : null;
}
function allMons() {
  const out = [];
  for (const t of Object.values(S.trainers)) {
    for (const m of t.team) if (m.st && m.st.b) out.push({ t, sp: m.sp, st: m.st, best: m.best || 0, sweeps: sweepsOf(m), megas: m.megas || 0, bonds: m.bonds || 0, uid: m.uid, cur: true, shiny: !!m.shiny, radiant: !!m.radiant });
    // a legendary's old partners keep a pointer to it; the Pokémon itself is counted once, wherever it is now
    (t.alumni || []).forEach((m, i) => { if (m.st && m.st.b && !m.legendRef) out.push({ t, sp: m.sp, st: m.st, best: m.best || 0, sweeps: sweepsOf(m), megas: m.megas || 0, bonds: m.bonds || 0, i, shiny: !!m.shiny, radiant: !!m.radiant }); });
  }
  // legendaries waiting for a partner: listed under the last partner they battled with
  for (const { m } of pooledLegends()) {
    if (!m.st || !m.st.b) continue;
    for (const p of (m.partners || []).slice().reverse()) { const t = T(p.id); const i = t ? (t.alumni || []).findIndex(a => a.legendRef && a.uid === m.uid) : -1; if (i >= 0) { out.push({ t, sp: m.sp, st: m.st, best: m.best || 0, sweeps: sweepsOf(m), megas: m.megas || 0, bonds: m.bonds || 0, i, uid: m.uid, pooled: true }); break; } }
  }
  return out;
}
// the longest unbroken runs as the Champion at season's end, from the season history
function reigns() {
  const out = []; let cur = null;
  for (const h of S.history) {
    if (cur && cur.id === h.champ && !h.champWasNew) { cur.to = h.season; cur.n++; }
    else { cur = { id: h.champ, from: h.season, to: h.season, n: 1 }; out.push(cur); }
  }
  return out;
}
// League runs from a trainer's season history: stage 4 = lost to the Champion, 5 = won the title
const titleMatches = t => (t.seasonHist || []).filter(h => h.stage != null && h.stage >= 4).length;
const e4Beaten = t => (t.seasonHist || []).reduce((a, h) => a + (h.stage != null ? Math.min(4, h.stage) : 0), 0);
// a record board shows the top 5. Boards with a key keep their full list (up to 50) for the Top 50 view.
const REC_LISTS = {};
// a trainer or Pokémon opened from a Top 50 list closes back to that list
const recBack = () => modal && modal.kind === 'recmore' ? { kind: 'recmore', key: modal.key } : modal && modal.back ? modal.back : null;
const recRows = rows => `<ol>${rows.map((r, i) => `<li><span class="rec-rank">${i + 1}</span><span class="rec-who">${r.who}</span><b class="rec-v">${r.v}</b>${r.sub ? `<span class="rec-sub muted">${r.sub}</span>` : ''}</li>`).join('')}</ol>`;
function recBoard(title, rows, note, key) {
  if (key === undefined && /^(tr|pk)-/.test(note || '')) { key = note; note = ''; }
  if (key) REC_LISTS[key] = { title, rows, note };
  const more = key && rows.length > 5 ? `<button class="link rec-more" data-act="recmore" data-k="${key}">Top ${Math.min(50, rows.length)} ›</button>` : '';
  return `<div class="recboard"><div class="rec-h">${title}</div>${rows.length ? recRows(rows.slice(0, 5)) : '<p class="muted small">No one yet.</p>'}${note ? `<p class="fine">${note}</p>` : ''}${more}</div>`;
}
const topBy = (list, val, n = 5, min = 1) => list.map(x => [x, val(x)]).filter(([, v]) => v != null && v >= min).sort((a, b) => b[1] - a[1]).slice(0, n);
const monLink = x => monMini(x.sp, x.shiny || x.radiant) + (x.cur ? `<button class="tlink" data-act="mon" data-t="${x.t.id}" data-u="${x.uid}">${x.sp}</button>` : `<button class="tlink" data-act="alum" data-t="${x.t.id}" data-i="${x.i}">${x.sp}</button>`);
// v195: Records board for the Pokémon banned most often in this League (by species, legendaries included)
function banRecBoard() {
  if (!featOn('banlist') && !(S.banLog || []).length) return '';
  const live = new Set((S.bans || []).map(b => b.sp));
  const seasons = sp => (S.banLog || []).filter(e => e.act === 'ban' && e.sp === sp).map(e => e.season + 1).sort((a, b) => a - b);
  const rows = Object.entries(banCounts()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 50).map(([sp, v]) => { const ss = seasons(sp);
    return { who: `${monMini(sp)} <b>${sp}</b>${live.has(sp) ? ' <span class="tag banned">Banned now</span>' : ''}`, v: v + (v === 1 ? ' ban' : ' bans'), sub: ss.length ? `banned for Season${ss.length > 1 ? 's' : ''} ${ss.join(', ')}` : '' }; });
  return recBoard('Most times banned', rows, 'Each time a League vote bans it. A ban kept in later votes counts once. By species, legendaries included.', 'pk-most-times-banned');
}
function viewRecords() {
  const ts = Object.values(S.trainers).filter(t => t.role !== 'prospect');
  const champs = ts.filter(t => (t.titleSeasons || []).length || t.career.titles);
  const titles = t => (t.titleSeasons || []).length || t.career.titles;
  const pctOf = t => { const r = recOf(t); return r.w + r.l >= 60 ? r.w / (r.w + r.l) : null; };
  const wins = [];
  for (const t of champs) for (const x of titleList(t)) wins.push({ t, s: x.season, lg: x.lg, age: ageAtSeason(t, x.season) });
  const rg = reigns().sort((a, b) => b.n - a.n || a.from - b.from).slice(0, 5);
  // legendary and mythical Pokémon are stat outliers: they get their own boards and stay off the others (v167)
  const allM = allMons(), mons = allM.filter(x => !isLegendLine(x.sp)), legM = allM.filter(x => isLegendLine(x.sp));
  // rivalries: each pair once
  const pairs = [];
  for (const t of ts) if (t.rival && T(t.rival) && t.id < t.rival) { const o = T(t.rival), h = h2hOf(t, o); pairs.push({ t, o, h, n: h.w + h.l }); }
  pairs.sort((a, b) => b.n - a.n);
  const dexAll = Object.entries(S.dex || {}), dex = dexAll.filter(([sp]) => !isLegendLine(sp)), legDex = dexAll.filter(([sp]) => isLegendLine(sp));
  const hist = S.history;
  const row = (t, v, sub) => ({ who: tname(t.id), v, sub });
  const champion = `<section class="panel"><div class="ph"><h2>Champions</h2><span class="muted">${champs.length} trainer${champs.length === 1 ? '' : 's'} have won the title</span></div><div class="recgrid">
    ${recBoard('Most titles', topBy(champs, titles).map(([t, v]) => row(t, v, (t.titleSeasons || []).length ? seasonsLg(titleList(t)) : '')))}
    ${recBoard('Longest reign', rg.map(r => ({ who: tname(r.id), v: `${r.n} season${r.n > 1 ? 's' : ''}`, sub: (r.from === r.to ? `Season ${r.from}` : `Seasons ${r.from}–${r.to}`) + (lgIn(S.lg || 0) ? ' · ' + lgIn(S.lg || 0) : '') })), nLeagues() > 1 ? `Seasons ending as Champion in a row, in the ${S.lgName}.` : 'Seasons ending as Champion in a row.')}
    ${recBoard('Most title defenses', topBy(ts, t => t.career.defenses).map(([t, v]) => row(t, v)))}
    ${recBoard('Youngest Champion', wins.slice().sort((a, b) => a.age - b.age || a.s - b.s).slice(0, 5).map(w => row(w.t, `age ${w.age}`, seasonsLg([{ season: w.s, lg: w.lg }]))))}
    ${nLeagues() >= CROWN_LEAGUES ? recBoard('Triple Crowns', ts.filter(isGrandSlam).sort((a, b) => (a.grandSlam || 999) - (b.grandSlam || 999)).slice(0, 5).map(t => row(t, champLeaguesOf(t).size + ' Leagues', t.grandSlam ? 'completed Season ' + t.grandSlam : '')), 'Champion of three different Leagues across a career.') : ''}
    ${nLeagues() > 1 ? recBoard('Most World Championships', topBy(ts, t => (t.worldSeasons || []).length).map(([t, v]) => row(t, v, 'Season ' + t.worldSeasons.join(', ')))) : ''}
    ${recBoard('Oldest Champion', wins.slice().sort((a, b) => b.age - a.age || a.s - b.s).slice(0, 5).map(w => row(w.t, `age ${w.age}`, seasonsLg([{ season: w.s, lg: w.lg }]))))}
  </div></section>`;
  const trainers = `<section class="panel"><div class="ph"><h2>Trainers</h2><span class="muted">Every trainer, active and retired</span></div><div class="recgrid">
    ${recBoard('Most wins', topBy(ts, t => recOf(t).w, 50).map(([t, v]) => row(t, v, `${recOf(t).w}–${recOf(t).l}`)), 'tr-most-wins')}
    ${recBoard('Best win %', topBy(ts, pctOf, 50, 0).map(([t, v]) => row(t, Math.round(v * 100) + '%', `${recOf(t).w}–${recOf(t).l}`)), 'At least 60 battles.', 'tr-best-win')}
    ${recBoard('Longest win streak', topBy(ts, t => recOf(t).bs || 0, 50).map(([t, v]) => row(t, v + (v === 1 ? ' win' : ' wins'), t.role !== 'retired' && recOf(t).cs === v ? 'ongoing, since Season ' + recOf(t).bsFrom : recOf(t).bsFrom === recOf(t).bsTo ? 'Season ' + recOf(t).bsTo : `Seasons ${recOf(t).bsFrom}–${recOf(t).bsTo}`)), 'Consecutive wins in any battle: gym, road, League and title.', 'tr-longest-win-streak')}
    ${recBoard('Most badges', topBy(ts, t => t.career.badges, 50).map(([t, v]) => row(t, v)), 'tr-most-badges')}
    ${recBoard('Most circuit completions', topBy(ts, circuitWins, 50).map(([t, v]) => row(t, v, 'all 8 badges')), 'tr-most-circuit-completions')}
    ${recBoard('Most title matches', topBy(ts, titleMatches, 50).map(([t, v]) => row(t, v, `won ${(t.seasonHist || []).filter(h => h.stage === 5).length}`)), 'Beat all four of the Elite Four to reach the Champion.', 'tr-most-title-matches')}
    ${recBoard('Most Elite Four members beaten', topBy(ts, e4Beaten, 50).map(([t, v]) => row(t, v, `over ${t.career.leagueApps} League run${t.career.leagueApps === 1 ? '' : 's'}`)), 'Across every League run as a challenger.', 'tr-most-elite-four-beaten')}
    ${recBoard('Most Elite Four wins', topBy(ts, t => t.career.e4Wins, 50).map(([t, v]) => row(t, v, 'as an Elite Four member')), 'tr-most-elite-four-wins')}
    ${recBoard('Longest career', topBy(ts, t => t.seasons, 50).map(([t, v]) => row(t, `${v} seasons`, t.role === 'retired' ? 'retired' : 'active')), 'tr-longest-career')}
    ${recBoard('Most Trainer of the Year awards', topBy(ts, t => (t.awards || []).filter(x => x.k === 'toy').length, 50).map(([t, v]) => row(t, v, seasonsLg(t.awards.filter(x => x.k === 'toy')))), '', 'tr-most-toy')}
    ${recBoard('Legendary encounters', topBy(ts, t => (t.greatLegends || []).length, 50).map(([t, v]) => row(t, v, t.greatLegends.map(x => x.sp + ' (S' + x.season + (lgIn(x.lg) ? ', ' + lgIn(x.lg) : '') + ')').join(', '))), 'Great legendaries caught or chosen by.', 'tr-great-legends')}
    ${recBoard('Most road battle wins', topBy(ts, t => recOf(t).rw || 0, 50).map(([t, v]) => row(t, v)), 'tr-most-road-battle-wins')}
    ${recBoard('Most Interim Championships', topBy(ts, t => (t.interim || []).length, 50).map(([t, v]) => row(t, v, seasonsLg(t.interim))), 'Won the title, then lost it in the same League.', 'tr-most-interim-championships')}
  </div></section>`;
  const pokemon = `<section class="panel"><div class="ph"><h2>Pokémon</h2><span class="muted">Individual Pokémon, on any team they've played for. Legendary and mythical Pokémon have their own boards.</span></div><div class="recgrid">
    ${recBoard('Most knockouts', topBy(mons, x => x.st.ko, 50).map(([x, v]) => ({ who: `${monLink(x)} <span class="muted small">${dn(x.t)}</span>`, v })), 'pk-most-knockouts')}
    ${recBoard('Most HP damage dealt', topBy(mons, x => x.st.dmg || 0, 50).map(([x, v]) => ({ who: `${monLink(x)} <span class="muted small">${dn(x.t)}</span>`, v: Math.round(v).toLocaleString('en-US') + ' HP', sub: `${x.st.b} battles · ${Math.round(v / Math.max(1, x.st.b)).toLocaleString('en-US')} per battle` })), 'Total HP knocked off opponents across every battle.', 'pk-most-hp-damage')}
    ${recBoard('Most wins', topBy(mons, x => x.st.w, 50).map(([x, v]) => ({ who: `${monLink(x)} <span class="muted small">${dn(x.t)}</span>`, v, sub: `${x.st.w}–${x.st.l}` })), 'pk-most-wins')}
    ${recBoard('Longest win streak', topBy(mons, x => x.st.bs || 0, 50).map(([x, v]) => ({ who: `${monLink(x)} <span class="muted small">${dn(x.t)}</span>`, v: v + (v === 1 ? ' win' : ' wins'), sub: x.cur && x.st.cs === v ? 'ongoing' : '' })), 'Consecutive battles it took part in that its side won.', 'pk-longest-win-streak')}
    ${recBoard('Most 6-0 sweeps', topBy(mons, x => x.sweeps, 50).map(([x, v]) => ({ who: `${monLink(x)} <span class="muted small">${dn(x.t)}</span>`, v: v + (v === 1 ? ' sweep' : ' sweeps') })), 'Knocked out all six of the opponent\'s Pokémon alone in one battle.', 'pk-most-6-0-sweeps')}
    ${recBoard('Most Mega Evolutions', topBy(mons, x => x.megas || 0, 50).map(([x, v]) => ({ who: `${monLink(x)} <span class="muted small">${dn(x.t)}</span>`, v })), 'Mega Evolved in a League battle.', 'pk-most-mega')}
    ${recBoard('Most Battle Bond transformations', topBy(mons, x => x.bonds || 0, 50).map(([x, v]) => ({ who: `${monLink(x)} <span class="muted small">${dn(x.t)}</span>`, v })), 'Transformed through Battle Bond in a League battle.', 'pk-most-bond')}
    ${recBoard('Most-used species', dex.map(([sp, st]) => [sp, st.b]).sort((a, b) => b[1] - a[1]).slice(0, 50).map(([sp, v]) => ({ who: `<b>${sp}</b>`, v: v + ' battles' })), 'pk-most-used-species')}
    ${recBoard('Best species win %', dex.filter(([, st]) => st.b >= 300).map(([sp, st]) => [sp, st.w / st.b, st]).sort((a, b) => b[1] - a[1]).slice(0, 50).map(([sp, v, st]) => ({ who: `<b>${sp}</b>`, v: Math.round(v * 100) + '%', sub: `${st.b} battles` })), 'At least 300 battles, all time.', 'pk-best-species-win')}
    ${banRecBoard()}
  </div></section>`;
  const seasons = `<section class="panel"><div class="ph"><h2>Seasons</h2></div><div class="recgrid">
    ${recBoard('Most League qualifiers', hist.slice().sort((a, b) => b.qualifiers - a.qualifiers).slice(0, 3).map(h => ({ who: 'Season ' + h.season, v: h.qualifiers })))}
  </div></section>`;
  const rivals = `<section class="panel"><div class="ph"><h2>Rivalries</h2></div><div class="recgrid">
    ${recBoard('Most-played rivalries', pairs.slice(0, 5).map(p => ({ who: `${tname(p.t.id)} <span class="muted">vs</span> ${tname(p.o.id)}`, v: `${p.h.w}–${p.h.l}`, sub: `${p.n} meetings` })))}
    ${recBoard('Nemeses overcome', topBy(ts, t => t.nemesisBeaten || 0).map(([t, v]) => row(t, v)))}
  </div></section>`;
  // ---- Hall of Shame: the other end of every board ----
  const bottomBy = (list, val, n = 50) => list.map(x => [x, val(x)]).filter(([, v]) => v != null).sort((a, b) => a[1] - b[1]).slice(0, n);
  const monWho = x => `${monLink(x)} <span class="muted small">${dn(x.t)}</span>`;
  // Gym Leaders lose most weeks by design (the Leakiest gym board covers them), so they sit out the other boards
  const ledGym = t => t.role === 'leader' || (t.posts || []).some(p => p.role === 'leader');
  const noGym = ts.filter(t => !ledGym(t)), noGymMons = mons.filter(x => !ledGym(x.t));
  const streakSub = t => { const r = recOf(t); return t.role !== 'retired' && r.cl === r.wl ? 'ongoing, since Season ' + r.wlFrom : r.wlFrom === r.wlTo ? 'Season ' + r.wlFrom : `Seasons ${r.wlFrom}–${r.wlTo}`; };
  const interimOnly = ts.filter(t => (t.interim || []).length && !titles(t) && !t.hof);
  const lostFinals = t => (t.seasonHist || []).filter(h => h.stage === 4).length;
  const gymSeasons = []; S.gyms.forEach((g, i) => (g.hist || []).forEach(x => { const n = x.w + x.l; if (n >= 8 && T(x.leader)) gymSeasons.push({ t: T(x.leader), town: townName(i), season: x.season, w: x.w, l: x.l, p: x.w / n }); }));
  const shame = `<section class="panel shame"><div class="ph"><h2>Hall of Shame</h2><span class="muted">Someone has to be at the bottom</span></div><div class="recgrid">
    ${recBoard('Worst win %', bottomBy(noGym, pctOf).map(([t, v]) => row(t, Math.round(v * 100) + '%', `${recOf(t).w}–${recOf(t).l}`)), 'At least 60 battles. Gym Leaders not included.', 'tr-worst-win')}
    ${recBoard('Longest losing streak', topBy(noGym, t => recOf(t).wl || 0, 50).map(([t, v]) => row(t, v + (v === 1 ? ' loss' : ' losses'), streakSub(t))), 'Every kind of battle counts. Gym Leaders not included. Tracked from v122 on.', 'tr-losing-streak')}
    ${recBoard('Interim Champions, never Champion', topBy(interimOnly, t => t.interim.length, 50).map(([t, v]) => row(t, v + (v === 1 ? ' interim title' : ' interim titles'), seasonsLg(t.interim))), 'Took the title and lost it in the same League, without ever holding it at the end of a season.', 'tr-interim-only')}
    ${recBoard('So close: title matches lost', topBy(ts, lostFinals, 50).map(([t, v]) => row(t, v, titles(t) ? `won ${titles(t)} title${titles(t) > 1 ? 's' : ''} too` : 'never won the title')), 'Beat all four of the Elite Four, then lost to the Champion.', 'tr-lost-finals')}
    ${recBoard('Most League runs without a title', topBy(ts.filter(t => !titles(t)), t => t.career.leagueApps, 50).map(([t, v]) => row(t, v + ' runs', `${e4Beaten(t)} Elite Four wins`)), 'tr-runs-no-title')}
    ${recBoard('Longest career without a League run', topBy(ts.filter(t => !t.career.leagueApps && !STAFF_ROLES.includes(t.role) && !(t.posts || []).length), t => t.seasons, 50).map(([t, v]) => row(t, v + ' seasons', `best: ${Math.max(0, ...(t.seasonHist || []).map(h => h.badges || 0))} badges`)), 'Never completed the badge circuit.', 'tr-no-league')}
    ${recBoard('Most gym losses', topBy(ts.filter(t => t.role !== 'leader' && !(t.posts || []).some(p => p.role === 'leader')), t => recOf(t).gl || 0, 50).map(([t, v]) => row(t, v, `${recOf(t).gw || 0} gym wins`)), 'Challengers who never led a gym.', 'tr-gym-losses')}
    ${recBoard('Most knocked out', topBy(mons, x => x.st.f || 0, 50).map(([x, v]) => ({ who: monWho(x), v: v + ' faints', sub: `${x.st.b} battles` })), 'pk-most-faints')}
    ${recBoard('Worst Pokémon win %', bottomBy(noGymMons.filter(x => x.st.b >= 40), x => x.st.w / x.st.b).map(([x, v]) => ({ who: monWho(x), v: Math.round(v * 100) + '%', sub: `${x.st.w}–${x.st.l}` })), 'At least 40 battles. Gym Leaders\' Pokémon not included.', 'pk-worst-win')}
    ${recBoard('Pokémon losing streak', topBy(noGymMons, x => x.st.wl || 0, 50).map(([x, v]) => ({ who: monWho(x), v: v + (v === 1 ? ' loss' : ' losses'), sub: x.cur && x.st.cl === v ? 'ongoing' : '' })), 'Battles it took part in, in a row, on the losing side. Gym Leaders\' Pokémon not included. Tracked from v122 on.', 'pk-losing-streak')}
    ${recBoard('Leakiest gym season', gymSeasons.sort((a, b) => a.p - b.p || b.l - a.l).slice(0, 5).map(g => ({ who: tname(g.t.id), v: `${g.w}–${g.l}`, sub: `${g.town} Gym, Season ${g.season}${lgIn(S.lg || 0) ? ' · ' + lgIn(S.lg || 0) : ''}` })), 'Lowest share of challenges held, 8+ challenges.')}
  </div></section>`;
  const hofLink = `<section class="panel"><div class="ph"><h2>Hall of Fame</h2><span class="muted">${(S.hof || []).length} inductee${(S.hof || []).length === 1 ? '' : 's'}</span></div><p>Champions are inducted when they retire. <button class="link" data-act="nav" data-v="hof">Open the Hall of Fame ›</button></p></section>`;
  const partnersOf = x => { const f = x.uid != null ? findLegend(x.uid) : null; return f && f.m.partners ? f.m.partners.length : 1; };
  const legWho = x => `${monLink(x)} <span class="muted small">${x.pooled ? 'waiting · last with ' + dn(x.t) : dn(x.t)}</span>`;
  const legends = `<section class="panel"><div class="ph"><h2>Legendary &amp; mythical</h2><span class="muted">Each legendary counted once across all its partners, with its lifetime record</span></div><div class="recgrid">
    ${recBoard('Most knockouts', topBy(legM, x => x.st.ko, 50).map(([x, v]) => ({ who: legWho(x), v })), '', 'lg-most-knockouts')}
    ${recBoard('Most HP damage dealt', topBy(legM, x => x.st.dmg || 0, 50).map(([x, v]) => ({ who: legWho(x), v: Math.round(v).toLocaleString('en-US') + ' HP', sub: `${x.st.b} battles` })), '', 'lg-most-hp-damage')}
    ${recBoard('Most wins', topBy(legM, x => x.st.w, 50).map(([x, v]) => ({ who: legWho(x), v, sub: `${x.st.w}–${x.st.l}` })), '', 'lg-most-wins')}
    ${recBoard('Best win %', topBy(legM.filter(x => x.st.b >= 40), x => x.st.w / x.st.b, 50, 0).map(([x, v]) => ({ who: legWho(x), v: Math.round(v * 100) + '%', sub: `${x.st.w}–${x.st.l}` })), 'At least 40 battles.', 'lg-best-win')}
    ${recBoard('Longest win streak', topBy(legM, x => x.st.bs || 0, 50).map(([x, v]) => ({ who: legWho(x), v: v + (v === 1 ? ' win' : ' wins'), sub: x.cur && x.st.cs === v ? 'ongoing' : '' })), '', 'lg-longest-win-streak')}
    ${recBoard('Most 6-0 sweeps', topBy(legM, x => x.sweeps, 50).map(([x, v]) => ({ who: legWho(x), v: v + (v === 1 ? ' sweep' : ' sweeps') })), '', 'lg-most-sweeps')}
    ${legM.some(x => x.megas) ? recBoard('Most Mega Evolutions', topBy(legM, x => x.megas || 0, 50).map(([x, v]) => ({ who: legWho(x), v })), 'Mega Evolved in a League battle.', 'lg-most-mega') : ''}
    ${recBoard('Most partners', topBy(legM, partnersOf, 50, 2).map(([x, v]) => ({ who: legWho(x), v: v + ' trainers', sub: `${x.st.w}–${x.st.l} lifetime` })), 'Trainers it has moved between.', 'lg-most-partners')}
    ${recBoard('Most-used legendary species', legDex.map(([sp, st]) => [sp, st.b]).sort((a, b) => b[1] - a[1]).slice(0, 50).map(([sp, v]) => ({ who: `<b>${sp}</b>`, v: v + ' battles' })), '', 'lg-most-used-species')}
  </div></section>`;
  return champion + hofLink + trainers + pokemon + legends + seasons + rivals + shame;
}
// ---------- Hall of Fame ----------
let hofQ = '', hofSort = 'new', hofLg = 'all'; // hofLg: 'all' or a League index (multi-League saves)
const HOF_SORTS = [['new', 'Newest inductees'], ['titles', 'Most titles'], ['worlds', 'Most World titles'], ['reign', 'Longest reign'], ['winpct', 'Best win %'], ['defenses', 'Most defenses'], ['badges', 'Most badges'], ['seasons', 'Longest career']];
// every reign in every League's history, by trainer: { from, to, n (season-ends held), lg }
function reignsByTrainer() {
  const map = new Map();
  eachLeague(i => { for (const r of reigns()) { if (!map.has(r.id)) map.set(r.id, []); map.get(r.id).push({ ...r, lg: i }); } });
  for (const list of map.values()) list.sort((a, b) => a.from - b.from);
  return map;
}
const reignText = r => `${r.from === r.to ? 'Season ' + r.from : `Seasons ${r.from}–${r.to}`} (${r.n} season${r.n > 1 ? 's' : ''})${nLeagues() > 1 ? ' · ' + lgShort(r.lg) : ''}`;
function hofEntries() {
  const rbt = reignsByTrainer();
  const ids = (S.hof || []).filter(id => T(id));
  const byTrainer = new Map(); for (const x of allMons()) { const cur = byTrainer.get(x.t); if (!cur || x.st.ko > cur.st.ko) byTrainer.set(x.t, x); }
  return ids.map(id => { const t = T(id); return { t, best: byTrainer.get(t), titles: (t.titleSeasons || []).length || t.career.titles, worlds: (t.worldSeasons || []).length, reigns: rbt.get(t.id) || [] }; });
}
// everything a search can match: name, class, famous tags, type, trait, title seasons and Pokémon
function hofText(e) {
  const t = e.t;
  return fold([dn(t), t.name, t.cls, specName(t), traitOf(t) ? TRAITS[traitOf(t)].name : '', ...famousTags(t).map(k => FAMOUS_TAG_LABELS[k]), t.famous ? 'famous' : '',
    ...(t.titleSeasons || []).map(s => 'season ' + s), 'inducted ' + (t.retiredSeason || ''), (t.worldSeasons || []).length ? 'world champion' : '', t.grandSlam ? 'grand slam' : '', ...[...champLeaguesOf(t)].map(leagueName),
    ...t.team.map(m => m.sp), ...(t.alumni || []).map(m => m.sp)].join(' '));
}
function hofCard(e) {
  const t = e.t, c = t.career, b = e.best;
  return `<article class="hofcard"><div class="eyebrow">Inducted Season ${t.retiredSeason || '?'}${t.famous ? ' · ★ Famous' : ''}</div><div class="hof-name">${tname(t.id)}</div>
    <div class="hof-stats"><span><b>${e.titles}</b> title${e.titles > 1 ? 's' : ''}</span>${e.worlds ? `<span class="hof-world"><b>${e.worlds}</b> World title${e.worlds > 1 ? 's' : ''}</span>` : ''}${e.reigns.length ? `<span><b>${Math.max(...e.reigns.map(r => r.n))}</b> season${Math.max(...e.reigns.map(r => r.n)) > 1 ? 's' : ''} longest reign</span>` : ''}<span><b>${c.defenses}</b> defense${c.defenses === 1 ? '' : 's'}</span><span><b>${c.badges}</b> badges</span><span><b>${t.seasons}</b> seasons</span>${(() => { const r = recOf(t), n = r.w + r.l; return n ? `<span class="hof-wl"><b>${r.w}–${r.l}</b> career (${Math.round(r.w / n * 100)}%)</span>` : ''; })()}</div>
    ${nLeagues() > 1 && champLeaguesOf(t).size ? `<div class="hof-lgs">${[...champLeaguesOf(t)].sort().map(i => `<span class="tag lg">${lgShort(i)}</span>`).join('')}</div>` : ''}
    ${e.reigns.length ? `<div class="hof-reigns"><span class="eyebrow">Reign${e.reigns.length > 1 ? 's' : ''}</span>${e.reigns.map(r => `<span>${reignText(r)}</span>`).join('')}</div>` : ''}
    <div class="small">${(t.titleSeasons || []).length ? 'Champion in ' + seasonsLg(titleList(t)) : ''}${e.worlds ? ` · World Champion in Season ${t.worldSeasons.join(', ')}` : ''}${t.grandSlam ? ' · Grand Slam' : ''}</div>
    <div class="small muted">${specName(t)}${traitOf(t) ? ' · ' + TRAITS[traitOf(t)].name : ''}</div>
    ${b ? `<div class="small muted">Best Pokémon: ${monLink(b)} (${b.st.ko} KOs)</div>` : ''}</article>`;
}
function hofResults() {
  const q = fold(hofQ.trim());
  let list = hofEntries();
  // League filter: Champions who finished a season holding that League's title (one who won several shows in each)
  const all = list.length;
  if (hofLg !== 'all' && +hofLg >= nLeagues()) hofLg = 'all';
  const lgOn = nLeagues() > 1 && hofLg !== 'all';
  if (lgOn) list = list.filter(e => champLeaguesOf(e.t).has(+hofLg));
  const total = list.length;
  // a search ending in a number matches that number exactly, so "season 3" doesn't also find Season 30
  if (q) { const re = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + (/\d$/.test(q) ? '(?!\\d)' : '')); list = list.filter(e => re.test(hofText(e))); }
  const key = { new: e => e.t.retiredSeason || 0, winpct: e => { const r = recOf(e.t), n = r.w + r.l; return n ? r.w / n : -1; }, reign: e => Math.max(0, ...e.reigns.map(r => r.n)) * 1000 + e.reigns.reduce((a, r) => a + r.n, 0), worlds: e => e.worlds * 1e6 + e.titles * 1000 + e.t.career.defenses, titles: e => e.titles * 1000 + e.t.career.defenses, defenses: e => e.t.career.defenses, badges: e => e.t.career.badges, seasons: e => e.t.seasons }[hofSort];
  list.sort((a, b) => key(b) - key(a) || (b.t.retiredSeason || 0) - (a.t.retiredSeason || 0));
  if (!all) return '<p class="muted">No inductees yet. A Champion is inducted when they retire.</p>';
  if (!total) return `<p class="muted">No inductees have been Champion of the ${leagueName(+hofLg)} yet.</p>`;
  if (!list.length) return `<p class="muted">No inductees match “${esc(hofQ.trim())}”. Try a name, a type or a Pokémon.</p>`;
  return `<p class="muted small">${list.length} of ${total} inductee${total === 1 ? '' : 's'}${lgOn ? ` who won the ${leagueName(+hofLg)}` : ''}${q ? ` matching “${esc(hofQ.trim())}”` : ''}</p><div class="hofgrid">${list.map(hofCard).join('')}</div>`;
}
function viewHof() {
  return `<section class="panel"><div class="ph"><h2>Hall of Fame</h2><span class="muted">Champions only, inducted when they retire</span></div>
    ${searchBox('hofsearch', hofQ, 'Search the Hall of Fame', 'Search by name, type, trait, season or Pokémon')}
    ${nLeagues() > 1 ? `<div class="filters hof-lgf"><span class="muted small">Champion of:</span>${[['all', 'All Leagues'], ...Array.from({ length: nLeagues() }, (_, i) => [String(i), leagueName(i)])].map(([k, l]) => `<button class="pill${String(hofLg) === k ? ' on' : ''}" data-act="hoflg" data-v="${k}">${l}</button>`).join('')}</div>` : ''}
    <div class="filters">${HOF_SORTS.filter(([k]) => k !== 'worlds' || nLeagues() > 1 || (S.worldHist || []).length).map(([k, l]) => `<button class="pill${hofSort === k ? ' on' : ''}" data-act="hofsort" data-v="${k}">${l}</button>`).join('')}</div>
    <div id="hofres">${hofResults()}</div></section>`;
}
function viewHistory() {
  const h = S.history.slice().reverse();
  return `${worldHistory()}${wallReport()}<section class="panel"><div class="ph"><h2>Season history${nLeagues() > 1 ? ' · ' + S.lgName : ''}</h2></div>
  ${h.length ? `<div class="scroll"><table class="tbl"><thead><tr><th>Season</th><th>Champion</th><th>Deepest run</th><th>Qualifiers</th><th>Meta</th></tr></thead><tbody>
  ${h.map(x => `<tr><td class="num">${x.season}</td><td>${tname(x.champ)}${x.champWasNew ? ' <span class="tag gold">new</span>' : ''}</td><td>${x.runner ? tname(x.runner) + ` <span class="muted">(${x.runnerStage === 4 ? 'Final' : 'E4 #' + (x.runnerStage + 1)})</span>` : '—'}</td><td class="num">${x.qualifiers}</td><td>${x.metaMons && x.metaMons.length ? `<span class="small">${x.metaMons.join(', ')}</span>` : '—'}</td></tr>`).join('')}
  </tbody></table></div>` : '<p class="muted">The first season has not finished yet.</p>'}</section>
  ${h.some(x => x.awards && x.awards.length) ? `<section class="panel"><div class="ph"><h2>Season awards</h2></div><div class="scroll"><table class="tbl"><thead><tr><th>Season</th>${Object.values(AWARDS).map(a => `<th>${a.short}</th>`).join('')}</tr></thead><tbody>
  ${h.filter(x => x.awards).map(x => `<tr><td class="num">${x.season}</td>${Object.keys(AWARDS).map(k => { const a = x.awards.find(y => y.k === k); return `<td>${a ? awardWho(a) : '<span class="muted">—</span>'}</td>`; }).join('')}</tr>`).join('')}
  </tbody></table></div></section>` : ''}
  ${banHistory()}`;
}
// v195: every banlist vote in this League, newest first: what was banned, kept and lifted, and what was in force after
function banHistory() {
  const log = S.banLog || [];
  if (!log.length) return featOn('banlist') ? `<section class="panel"><div class="ph"><h2>Banlists${nLeagues() > 1 ? ' · ' + S.lgName : ''}</h2></div><p class="muted">No vote has banned anything here yet. The League's trainers vote in the offseason.</p></section>` : '';
  const by = {}; for (const e of log) (by[e.season] = by[e.season] || []).push(e);
  const seasons = Object.keys(by).map(Number).sort((a, b) => b - a);
  const inForce = new Set(), forceAt = {};
  for (const sn of seasons.slice().reverse()) { for (const e of by[sn]) { if (e.act === 'ban') inForce.add(e.sp); else inForce.delete(e.sp); } forceAt[sn] = [...inForce]; }
  const items = (sn, act, f) => by[sn].filter(e => e.act === act).map(e => `<span class="bh-i">${f(e)}</span>`).join(' ');
  const line = (label, html) => html ? `<div><span class="bh-l">${label}</span>${html}</div>` : '';
  return `<section class="panel"><div class="ph"><h2>Banlists${nLeagues() > 1 ? ' · ' + S.lgName : ''}</h2><span class="muted">${Object.keys(banCounts()).length} Pokémon banned in all</span></div>
  <div class="banhist">${seasons.map(sn => `<div class="bh-row"><div class="bh-s">Season ${sn + 1}</div>
    ${line('Banned', items(sn, 'ban', e => `<b>${e.sp}</b> <span class="muted small" title="${e.ty} of ${e.tn} trainers">${e.pct}%${e.len ? ` · ${e.len} season${e.len === 1 ? '' : 's'}` : ''}</span>`))}
    ${line('Lifted', items(sn, 'lift', e => `${e.sp} <span class="muted small">time up</span>`))}
    ${line('Banlist', forceAt[sn].length ? forceAt[sn].map(sp => `<span class="bh-i">${monMini(sp)}${sp}</span>`).join(' ') : '<span class="muted">none</span>')}</div>`).join('')}</div>
  <p class="fine">Each ban shows the share of the League's trainers who voted for it, then its length. Each ban runs its full length (1 to ${BAN_MAX_SEASONS} seasons), then lifts.</p></section>`;
}

// ---------- awards ----------
function awardWho(a) {
  if (!a.sp) return tname(a.id);
  const t = T(a.id), m = t && t.team.find(x => x.uid === a.uid);
  return `${m ? `<button class="tlink" data-act="mon" data-t="${t.id}" data-u="${m.uid}">${a.sp}</button>` : `<b>${a.sp}</b>`} <span class="muted small">${tname(a.id)}</span>`;
}
function awardsPanel(h, title) {
  const aw = h && h.awards; if (!aw || !aw.length) return '';
  return `<section class="panel"><div class="ph"><h3>${title || `Season ${h.season} awards`}</h3></div><div class="awards">${aw.map(a => `<div class="award"><span class="aw-k">${AWARDS[a.k].name}</span><span class="aw-who">${awardWho(a)}</span><span class="muted small">${a.why}</span></div>`).join('')}</div></section>`;
}
// ---------- recap ----------

function viewRecap() {
  const L = S.league, h = S.history[S.history.length - 1]; if (!L || !h) return viewCircuit();
  const ran = Object.values(S.trainers).filter(t => inLg(t) && S.progress && S.progress[t.id] && ['challenger', ...STAFF_ROLES].includes(t.role)).sort((a, b) => S.progress[b.id].after.ovr - S.progress[a.id].after.ovr).slice(0, 12);
  return `${worldPanel()}<div class="grid-office"><div class="col">
    <section class="panel callout"><div class="eyebrow">Season ${S.season} recap${nLeagues() > 1 ? ' · ' + S.lgName : ''}</div><h2>${tname(S.champion)} ${h.champWasNew ? 'took the crown' : 'is still Champion'}</h2>
      <p>${h.qualifiers} trainer${h.qualifiers === 1 ? '' : 's'} reached the League.${h.metaMons && h.metaMons.length ? ` The season's top performers on the circuit: ${h.metaMons.join(', ')}.` : ''}</p></section>
    ${awardsPanel(h)}
    <section class="panel"><div class="ph"><h3>League results</h3></div>${L.entries.length ? `<div class="scroll"><table class="tbl"><thead><tr><th>Order</th><th>Trainer</th><th>E4 #1</th><th>#2</th><th>#3</th><th>#4</th><th>Final</th></tr></thead><tbody>
      ${L.entries.map((e, i) => `<tr><td class="num">${i + 1}</td><td>${tname(e.id)}</td>${[0, 1, 2, 3, 4].map(k => `<td class="st ${e.stage > k ? 'w' : e.stage === k ? 'l' : ''}">${e.stage > k ? 'W' : e.stage === k ? 'L' : ''}</td>`).join('')}</tr>`).join('')}
      </tbody></table></div>` : '<p class="muted">No qualifiers this season.</p>'}
      ${(L.titleOrder || []).length > 1 ? `<p class="fine">Title matches came after every Elite Four run, worst gym record first: ${L.titleOrder.map(x => `${tname(x.id)} (${x.w}–${x.l})`).join(' → ')}</p>` : ''}
      ${L.logs.length ? `<div class="logs">${L.logs.map((r, i) => `<button class="btn small" data-act="watch" data-i="${i}">${r.title}: ${r.sides[0].name}</button>`).join('')}</div>` : ''}
    </section>
    <section class="panel"><div class="ph"><h3>How the world changed</h3></div><ul class="changes">${(S.changes || []).map(c => `<li>${c}</li>`).join('') || '<li>A quiet offseason.</li>'}</ul></section>
  </div><div class="col side">
    <section class="panel"><div class="ph"><h3>Development</h3><span class="muted">Highest rated</span></div>${ran.map(t => { const p = S.progress[t.id]; return `<div class="devrow"><div>${tname(t.id)}<div class="muted small">Age ${t.age}</div></div><div class="ovr-change"><span>${p.before.ovr}</span><span class="arrow">→</span><b>${p.after.ovr}</b></div></div>`; }).join('') || '<p class="muted">No trainers.</p>'}</section>
    <section class="panel"><div class="ph"><h3>Next</h3></div><p>New trainers set out, and they and the free agents compete for the ${CIRCUIT_SIZE} places on the circuit. Then the League's trainers vote on the banlist, and Season ${S.season + 1} begins.</p><button class="btn primary" data-act="nextseason">Start Season ${S.season + 1}</button></section>
  </div></div>`;
}

// ---------- World Championship ----------
function worldPanel() {
  const W = S.worlds; if (!W || S.phase !== 'offseason') return '';
  const row = m => { const w = m.winner, l = w === m.a ? m.b : m.a; const i = W.matches.indexOf(m);
    return `<li><span class="eyebrow">${m.round}</span> ${tname(w)} <span class="muted small">${leagueName(lgOf(T(w)))}</span> beat ${tname(l)} <span class="muted small">${leagueName(lgOf(T(l)))}</span> <button class="btn small" data-act="watchworld" data-i="${i}">Watch</button></li>`; };
  return `<section class="panel callout world"><div class="eyebrow">World Championship · Season ${W.season}</div><h2>${tname(W.winner)} is World Champion</h2>
    <p>The ${W.entrants.length} League Champions met once the Leagues were done, at equal level. The titles at home are not at stake.</p>
    <ul class="worldlist">${W.matches.map(row).join('')}</ul></section>`;
}
function worldHistory() {
  const wh = (S.worldHist || []).slice().reverse(); if (!wh.length) return '';
  return `<section class="panel"><div class="ph"><h2>World Championship</h2></div><div class="scroll"><table class="tbl"><thead><tr><th>Season</th><th>World Champion</th><th>League</th><th>Runner-up</th><th>League</th></tr></thead><tbody>
    ${wh.map(x => `<tr><td class="num">${x.season}</td><td>${tname(x.winner)}</td><td>${leagueName(x.winnerLg)}</td><td>${tname(x.runner)}</td><td>${leagueName(x.runnerLg)}</td></tr>`).join('')}</tbody></table></div></section>`;
}
// ---------- League banlist (v194) ----------
// what's banned now, League by League
function banCard() {
  if (!featOn('banlist')) return '';
  const rows = Array.from({ length: nLeagues() }, (_, i) => ({ i, bans: bansIn(i) })).filter(x => x.bans.length);
  if (!rows.length) return '';
  return `<section class="panel"><div class="ph"><h3>Banlist</h3><span class="muted">Season ${curSeason()}</span></div>
    ${rows.map(x => `<p class="small">${nLeagues() > 1 ? `<b>${lgShort(x.i)}</b> · ` : ''}${x.bans.map(b => `${monFace(b.sp, false, 22)} ${b.sp} <span class="muted">(through S${b.season + (b.len || BAN_MAX_SEASONS)})</span>`).join(', ')}</p>`).join('')}
    <p class="fine">Banned for everyone in that League until its season shown. The League's trainers vote on new bans each offseason.</p></section>`;
}
// ---------- modals ----------
function renderModal() {
  const root = $('#modal');
  if (!modal) { root.hidden = true; root.innerHTML = ''; return; }
  root.hidden = false;
  let body = '';
  if (modal.kind === 'mon') body = monBody();
  if (modal.kind === 'confirmsim') { const left = SEASON_WEEKS - S.week; body = `<div class="mh"><h2>Play to the League?</h2><button class="btn icon" data-act="close" aria-label="Close">×</button></div>
    <p>This plays the remaining <b>${left} week${left === 1 ? '' : 's'}</b> of Season ${S.season} in one go. You can't undo it.</p>
    <div class="confirm-row"><button class="btn primary" data-act="autoseason">Play ${left} week${left === 1 ? '' : 's'}</button><button class="btn" data-act="close">Cancel</button></div>`; }
  if (modal.kind === 'profile') body = `<div class="mh"><h2>Trainer profile</h2><button class="btn icon" data-act="close" aria-label="Close">×</button></div>${profileBody(T(modal.id), false)}`;
  if (modal.kind === 'battle') body = battleShell();
  if (modal.kind === 'img') body = imgBody();
  if (modal.kind === 'images') body = imagesModalBody();
  if (modal.kind === 'menu') body = menuBody();
  if (modal.kind === 'updates') body = updatesBody();
  if (modal.kind === 'glossary') body = glossaryBody();
  if (modal.kind === 'simmany') body = simManyBody();
  if (modal.kind === 'recmore') { const L = REC_LISTS[modal.key] || { title: 'Records', rows: [] };
    body = `<div class="mh"><h2>${L.title}</h2><button class="btn icon" data-act="close" aria-label="Close">×</button></div><p class="muted small">${modal.key.startsWith('pk-') ? 'Pokémon' : 'Trainers'} · top ${L.rows.length}${L.note ? ' · ' + L.note : ''}</p><div class="recboard big">${recRows(L.rows)}</div>`; }
  root.innerHTML = `<div class="scrim" data-act="close"></div><div class="sheet sheet-${modal.kind}" role="dialog" aria-modal="true">${body}</div>`;
  applyFolds(root, 'modal-' + modal.kind);
  if (modal.kind === 'battle') startPlayback();
}
const HOW = { glitch: 'Glitched onto the team', starter: 'Starting partner', caught: 'Caught', assigned: 'Assigned by the League', wormhole: 'Caught from an Ultra Wormhole', roamer: 'Caught while it roamed the region', swap: 'Brought in after a losing streak', legacy: 'Passed down from a parent', legend: 'A legendary encounter', find: 'A legendary found while exploring' };
function monProfile(m, former) {
  const ivOf = k => m.iv[k] ?? m.iv[k === 'spa' ? 'atk' : k === 'spd' ? 'def' : k] ?? 15;
  const ivRow = (k, l) => `<div class="rt"><span class="rt-k">${l}</span><span class="rt-bar"><i style="width:${ivOf(k) / 31 * 100}%"></i></span><span class="rt-v">${ivOf(k)}</span></div>`;
  const s = SP[m.sp], lv = Math.floor(m.lvl), ml = moveLv(m), early = ml - lv; // v197: Modest learns early
  const moves = (m.moves || []).map(n => MOVES[n]).filter(Boolean).map(mv => `<li>${chip(mv.type)} <b>${mv.name}</b> <span class="muted small">${moveLine(mv, m)}</span></li>`).join('') +
    (m.cov || []).filter(c => ml < c.lv).map(c => `<li class="muted small">${covChip(c.t)} learns ${c.t}-type moves at Lv ${c.lv - early}</li>`).join('') +
    (ml < MOVE_TIER_LV[3] ? `<li class="muted small">Stronger moves at Lv ${(ml < MOVE_TIER_LV[2] ? MOVE_TIER_LV[2] : MOVE_TIER_LV[3]) - early}</li>` : '');
  const f = formTier(m.form || 0);
  return `<section class="panel"><div class="ph"><h3>Profile</h3></div><div class="prof">
    <div>${abilityBlock(m)}${itemsOn() && !former ? `<div class="eyebrow">Held item</div><p>${m.item && ITEMS[m.item] ? `${itemChip(m.item)} <span class="muted small">· ${ITEMS[m.item].desc}</span>` : '<span class="muted">None</span>'}</p>` : ''}<div class="eyebrow">Nature</div><p><b>${m.nat}</b> <span class="muted">· ${natureText(m.nat)}</span></p>${former ? '' : temperLine(m)}
      <div class="eyebrow">Friendship</div><div class="frbar"><i style="width:${(m.fr ?? 70) / 255 * 100}%"></i></div><p class="small"><b>${frTier(m.fr ?? 70)}</b> <span class="muted">· ${m.fr ?? 70} / 255. Raises critical hits and the chance to hang on at 1 HP.</span></p>
      ${former ? '' : `<div class="eyebrow">Form</div><p><b>${f}</b> ${formBadge(m)} <span class="muted small">· ${(m.form || 0) >= 0 ? '+' : '−'}${Math.abs(Math.round((m.form || 0) * 2))}% damage. Wins and knockouts heat it up; fainting cools it down.</span></p>`}</div>
    <div><div class="eyebrow">Base stats · ${SP[m.sp].glitch ? 'scrambled' : attackStyle(m.sp)}</div>${SP[m.sp].glitch ? `<p class="small muted">Every battle deals out ${GLITCH_STATS.join(', ')} to its six stats at random.</p>` : ''}<div class="ratings basestats">${SP[m.sp].glitch ? STAT_KEYS.map(k => `<div class="rt"><span class="rt-k">${STAT_SHORT[k]}</span><span class="rt-bar"><i style="width:0%"></i></span><span class="rt-v">??</span></div>`).join('') : STAT_KEYS.map(k => { const v = Math.round(bsOf(m.sp)[k]); return `<div class="rt"><span class="rt-k">${STAT_SHORT[k]}</span><span class="rt-bar"><i style="width:${Math.min(100, v / 180 * 100)}%"></i></span><span class="rt-v">${v}</span></div>`; }).join('')}</div>
      <div class="eyebrow">IVs · ${ivGrade(m)} (${ivTotal(m)} / 186)</div><div class="ratings">${STAT_KEYS.map(k => ivRow(k, STAT_NAME[k])).join('')}</div>
      <div class="eyebrow">Moves</div><ul class="moves">${moves}</ul></div>
  </div></section>`;
}
function legendPartners(m, here) {
  if (!m.partners || !m.partners.length) return '';
  const now = { b: (m.st && m.st.b) || 0, w: (m.st && m.st.w) || 0, l: (m.st && m.st.l) || 0, ko: (m.st && m.st.ko) || 0 };
  const rows = m.partners.slice().reverse().map(p => { const x = p.st || { b: now.b - p.at.b, w: now.w - p.at.w, l: now.l - p.at.l, ko: now.ko - p.at.ko };
    return `<li>${T(p.id) ? tname(p.id) : p.name} · ${p.to == null ? `Season ${p.from}–now` : p.from === p.to ? `Season ${p.from}` : `Seasons ${p.from}–${p.to}`} · <b>${x.w}–${x.l}</b>, ${x.ko} KOs${p.to != null && p.why ? ` <span class="muted small">(${p.why})</span>` : ''}</li>`; }).join('');
  const where = here.t ? (m.leg && m.leg.until != null ? `With ${tname(here.t.id)} until the end of Season ${m.leg.until}, then it moves on.` : `With ${tname(here.t.id)}.`)
    : `Waiting in the ${leagueName(here.lg)} for a new partner. It won't go back to anyone it has been with.`;
  return `<section class="panel"><div class="ph"><h3>Partners</h3><span class="muted">${m.partners.length} trainer${m.partners.length > 1 ? 's' : ''}</span></div><p class="small">${where}</p><ul class="changes">${rows}</ul></section>`;
}
function monBody() {
  const t0 = T(modal.t);
  let t = t0;
  let m = modal.alum != null ? t0.alumni[modal.alum] : t0.team.find(x => x.uid === modal.u);
  // an old partner's entry for a legendary opens the legendary itself, wherever it is now
  let here = null;
  if (m && (m.legendRef || m.partners)) { here = findLegend(m.uid); if (here) { m = here.m; if (here.t) t = here.t; } }
  if (!m) return `<div class="mh"><h2>Pokémon</h2><button class="btn icon" data-act="close" aria-label="Close">×</button></div><p class="muted">This Pokémon is no longer on the team.</p>`;
  const s = SP[m.sp], st = m.st || blankStat(), ss = modal.alum != null && !(here && here.t) ? null : ssOf(m);
  const tiles = (x) => `<div class="stats"><div><b>${x.b}</b><small>Battles</small></div><div><b>${wl(x)}</b><small>Win–loss</small></div><div><b>${pct(x)}</b><small>Win rate</small></div><div><b>${x.ko}</b><small>Knockouts</small></div><div><b>${x.f}</b><small>Times fainted</small></div><div><b>${x.b ? (x.ko / x.b).toFixed(2) : '—'}</b><small>KOs per battle</small></div></div>`;
  const met = m.met ? `${HOW[m.met.how] || m.met.how}${m.met.how === 'caught' ? ` in Season ${m.met.season}, week ${m.met.week}` : ` · Season ${m.met.season}`}` : 'Origin not recorded';
  const metFull = met + (m.rejoined && m.rejoined.length ? m.rejoined.map(r => ` · back on the team in Season ${r.season} (for ${r.for})`).join('') : '');
  return `<div class="mh"><h2>${m.sp}</h2><button class="btn icon" data-act="close" aria-label="Close">×</button></div>
    <div class="moncard"><div class="monpic">${monFace(m.sp, m.shiny || m.radiant, IMG_PX, 'big')}${monImgBtns(m.sp)}</div>
      <div><div>${chips(monTypes(m))}${s.legend ? ' <span class="tag legend">Legendary</span>' : ''}${s.paradox ? ' <span class="tag paradox">Paradox</span>' : ''}${babyTag(s)}${megaTag(m)}${m.shiny ? ' <span class="tag shiny">✦ Shiny</span>' : ''}${m.radiant ? ' <span class="tag radiant" title="Radiant: shiny colors, at least Good IVs and a stronger ability than its species ever gets">✧ Radiant</span>' : ''}${m.delta ? ' <span class="tag delta" title="Delta Pokémon: an unusual ' + m.delta + ' type">Δ Delta</span>' : ''}${m.alpha ? ' <span class="tag alpha">Alpha</span>' : ''}${condTags(m)}</div><div class="muted small">${modal.alum != null ? 'Formerly with' : 'Lv ' + lvShow(m) + ' · with'} ${tname(t.id)} · BST ${s.bst}</div><div class="muted small">${metFull}${modal.alum != null ? ` · left in Season ${m.left} (${m.why})` : ''}</div></div></div>
    ${m.iv ? monProfile(m, modal.alum != null && !here) : ''}
    ${here ? legendPartners(m, here) : ''}
    ${ss ? `<section class="panel"><div class="ph"><h3>Season ${S.season}</h3></div>${tiles(ss)}</section>` : ''}
    <section class="panel"><div class="ph"><h3>${m.partners ? 'Lifetime' : `Career with ${t.name}`}</h3></div>${tiles(st)}
      <div class="split"><span>Gym battles <b>${st.gw}–${st.gl}</b></span><span>League &amp; title <b>${st.lw}–${st.ll}</b></span><span>Led <b>${st.lead || 0}</b> of ${st.b} battles</span><span>Damage dealt <b>${st.dmg.toLocaleString()}</b> HP</span>${m.best ? `<span>Best battle <b>${m.best} KOs</b></span>` : ''}${sweepsOf(m) ? `<span>6-0 sweeps <b>${sweepsOf(m)}</b></span>` : ''}${m.megas ? `<span>Mega Evolutions <b>${m.megas}</b></span>` : ''}${(m.awards || []).length ? `<span>${m.awards.map(x => `<b>${AWARDS[x.k].name}</b> S${x.season}${lgIn(x.lg) ? ' · ' + lgIn(x.lg) : ''}`).join(', ')}</span>` : ''}${m.bonds ? `<span>Battle Bond transformations <b>${m.bonds}</b></span>` : ''}</div></section>
    ${m.evoLog && m.evoLog.length ? `<section class="panel"><div class="ph"><h3>Evolutions</h3></div><ul class="changes">${m.evoLog.map(e => `<li>${e.from} → <b>${e.to}</b> at Lv ${e.lvl}, Season ${e.season}</li>`).join('')}</ul></section>` : ''}
    ${S.dex && S.dex[m.sp] && S.dex[m.sp].b ? `<p class="fine">Every ${m.sp} in the league: ${wl(S.dex[m.sp])} (${pct(S.dex[m.sp])}) all time.</p>` : ''}`;
}
// ---------- sim multiple seasons ----------
// v192: a league whose save text is past about 6 MB uncompressed (roughly 1.5 MB stored) gets the storage note
const simSaveBig = () => { try { return JSON.stringify(S).length > 6e6; } catch (e) { return false; } };
const SIM_CHOICES = [1, 2, 3, 5, 10, 25];
let simTimer = null;
function simManyBody() {
  const m = modal;
  if (m.running || m.done) {
    const pct = Math.round(m.log.length / m.n * 100);
    const rows = m.log.map(x => `<tr><td class="num">${x.season}</td><td>${tname(x.champ)}${x.champWasNew ? ' <span class="tag gold">new</span>' : ''}</td><td>${x.titles ? x.titles + ' conceded' : 'Perfect'}</td><td class="num">${x.badges}</td><td class="num">${x.qualifiers}</td></tr>`).join('');
    return `<div class="mh"><h2>${m.done ? `Simulated ${m.log.length} season${m.log.length === 1 ? '' : 's'}` : `Simulating… ${m.log.length} of ${m.n}`}</h2>${m.done ? '<button class="btn icon" data-act="simmanyclose" aria-label="Close">×</button>' : ''}</div>
      <div class="simbar" role="progressbar" aria-valuemin="0" aria-valuemax="${m.n}" aria-valuenow="${m.log.length}"><i style="width:${pct}%"></i></div>
      ${m.stopped ? '<p class="muted small">Stopped early. You pick up at the start of the next season.</p>' : ''}
      ${m.failed ? `<p class="warn">Something went wrong during Season ${m.failed.season}, so the sim stopped. Everything up to that point is saved. If it happens again, please report this message: <span class="small">${esc(m.failed.msg).slice(0, 200)}</span></p>` : ''}
      ${rows ? `<div class="scroll"><table class="tbl"><thead><tr><th>Season</th><th>Champion${nLeagues() > 1 ? ' · ' + S.lgName : ''}</th><th>Titles</th><th>Badges conceded</th><th>Reached the League</th></tr></thead><tbody>${rows}</tbody></table></div>` : ''}
      <div class="confirm-row">${m.done ? `<button class="btn primary" data-act="simmanyclose">Continue in Season ${S.season}${S.phase === 'season' && S.week ? `, week ${S.week + 1}` : ''}</button><button class="btn" data-act="simmanyrecords">See records</button>` : '<button class="btn" data-act="simmanystop">Stop after this season</button>'}</div>`;
  }
  const n = m.n || 5;
  return `<div class="mh"><h2>Sim multiple seasons</h2><button class="btn icon" data-act="close" aria-label="Close">×</button></div>
    <p>Plays whole seasons and offseasons in one go, then stops at the start of a season.</p>
    <div class="eyebrow">Seasons</div><div class="segs setup-segs sim-n">${SIM_CHOICES.map(k => `<button class="seg${n === k ? ' on' : ''}" data-act="simmanyn" data-v="${k}" aria-pressed="${n === k}">${k}</button>`).join('')}</div>
    ${S.phase !== 'season' || S.week > 0 ? `<p class="muted small">${S.phase === 'season' ? `Season ${S.season} is in week ${S.week + 1}, so it finishes first and counts as the first season.` : `The current ${S.phase === 'offseason' ? 'offseason' : S.phase} finishes first.`}</p>` : ''}
    ${n >= 10 || simSaveBig() ? `<p class="warn small">Planning to sim far ahead? Saves grow every season, and browsers only keep a few megabytes per site${simSaveBig() ? ' (this league is already large)' : ''}. If the save gets too big for this browser, the game tells you and stops saving here. Use Download save file in the menu now and then, so a long league is never lost.</p>` : ''}
    <p class="muted small">You can't undo it. Copy your save from the menu first if you might want this point back.</p>
    <div class="confirm-row"><button class="btn primary" data-act="simmanygo">Sim ${n} season${n === 1 ? '' : 's'}</button><button class="btn" data-act="close">Cancel</button></div>`;
}
function simManyTick() {
  const m = modal; if (!m || m.kind !== 'simmany' || !m.running) return;
  let h;
  // if a season ever fails, stop and say so (progress so far is kept) instead of hanging on "Simulating…"
  try { h = simOneSeason(); }
  catch (e) { m.running = false; m.done = true; m.failed = { season: S.season, msg: String(e && e.message || e) }; save(); view = 'circuit'; render(); renderModal(); return; }
  if (h) m.log.push(h);
  save();
  if (m.log.length >= m.n || m.stopRequested) {
    m.running = false; m.done = true; m.stopped = m.stopRequested && m.log.length < m.n; view = 'circuit'; render(); renderModal(); return; }
  renderModal();
  simTimer = setTimeout(simManyTick, 30);
}
// a trainer card's name: the title (class or post) on a small line, the name itself as the heading, so long names fit
function cardName(t) {
  const full = dn(t), nm = t.name || '';
  const title = full.endsWith(nm) ? full.slice(0, full.length - nm.length).trim() : '';
  const len = nm.length;
  return `${title ? `<div class="tcard-cls">${esc(title)}</div>` : ''}<h1 class="tcard-name${len > 22 ? ' xlong' : len > 14 ? ' long' : ''}">${esc(title ? nm : full)}</h1>`;
}
// ---------- glossary ----------
// built from the game's own data (abilities, moves, items, traits), plus hand-written terms
let glossSec = 'all', glossQ = '';
const RATING_TEXT = { str: 'Smarter move choices and send-outs in battle, and calling dodges.', trn: 'How many levels training weeks give.', bnd: 'Friendship, critical hits and hanging on at 1 HP.', sct: 'Finds better wild Pokémon when exploring.', nrv: 'Holds up under pressure, most of all in big battles.' };
const GLOSS_TERMS = {
  plans: [
    ['Challenge', 'Battle the next Gym Leader for a badge.'],
    ['Train', 'Every Pokémon gains levels; ones far behind the strongest catch up faster.'],
    ['Explore', 'Meet wild Pokémon and try to catch one. Sometimes turns up a held item.'],
    ['Seek', 'Battle a legendary that has appeared, at full strength every time. The damage adds up across weeks, and when it is worn down or its five weeks are up it goes to the trainer who did the most (ties are fought out). Luck swings each attempt hard, and a failed attempt still earns experience.'],
    ['Who decides', 'Every trainer chooses their own week.'],
    ['Newcomers', `There is no draft. Each offseason new trainers set out, and they and the free agents compete for the ${CIRCUIT_SIZE} places on a League's circuit: an open place first, then the place of the weakest challenger if the newcomer looks better.`],
    ['Free agent', 'A trainer with no place on a circuit. They wait for one, and retire after a few seasons without.'],
    ['God mode', 'An option chosen at setup. Its page opens a League and edits any trainer directly: name, age, ratings and potential.'],
    ['Walking partner', "A trainer's highest-level Pokémon walks beside them out of its ball, and its friendship grows faster."],
  ],
  battle: [
    ['Same-type attack', "A move that matches one of the user's types hits 50% harder."],
    ['Super effective', 'Hits a type weak to it for double damage (×4 against two weaknesses); "not very effective" is half.'],
    ['Critical hit', 'A hit that does 50% more. Bond and some moves and abilities make them likelier.'],
    ['Solid hit', 'Now and then (6%) a move lands cleanly and does 30% more.'],
    ['Glancing blow', 'Sometimes (8%) a move only grazes and does 40% less.'],
    ['Momentum', "A Pokémon that lands two hits in a row hits 5% harder, three or more 10% harder, until it's interrupted."],
    ['Miss', 'Moves rarely miss: their accuracy is pulled halfway toward 100% (an 80% move hits 90%).'],
    ['Dodge', "A faster Pokémon can dodge an attack (up to 12%), more often with a sharp trainer's Strategy."],
    ['Priority', 'Moves like Quick Attack go before anything else that turn; otherwise the faster Pokémon moves first.'],
    ['Stat stages', 'Boosts and drops from −6 to +6; each stage up is +50% (so +2 is double), each stage down shrinks the stat.'],
    ['Utility move', 'A move that does no damage in the games. Here it does light damage and keeps its effect. Boosting or healing works once per battle.'],
    ['Flinch', 'A Pokémon hit first by a flinching move may lose its turn.'],
    ['Burn', 'Loses a little HP each turn, and its physical attacks do half damage.'],
    ['Paralysis', "Speed is halved, and a quarter of the time it can't move."],
    ['Poison', 'Loses 1/8 of its HP each turn. Bad poison starts smaller and gets worse every turn.'],
    ['Sleep', "Can't move for 1–3 turns."],
    ['Harsh sunlight', 'Fire moves ×1.25, Water moves ×0.75. Powers Chlorophyll and Solar Power.'],
    ['Rain', 'Water moves ×1.25, Fire moves ×0.75. Powers Swift Swim and Rain Dish.'],
    ['Sandstorm', "Chips HP each turn from anything that isn't Rock, Ground or Steel; Rock types gain Sp. Def."],
    ['Snow', 'Ice types gain Defense. Powers Slush Rush and Ice Body.'],
    ['Gym weather', "Each gym has weather that suits its type (a Fire gym is sunny)."],
    ['Hazards', 'Stealth Rock and Spikes hurt every Pokémon the other side sends in afterwards.'],
    ['Mega Evolution', 'League battles only. A Pokémon holding a Mega Stone Mega Evolves when it comes out: new types and much higher stats.'],
    ['Battle Bond', 'A long-time partner at max friendship can bond with its trainer and transform after its first knockout in League battles. If it falls, the team falters.'],
    ['Stalemate', 'If nobody loses HP for 12 turns in a row, the battle is decided on remaining HP.'],
  ],
  mons: [
    ['IVs', "A Pokémon's hidden potential in each stat, graded from Poor to Perfect."],
    ['Nature', 'Raises one stat by 10% and lowers another, and gives a temperament: a small effect off the field (see Temperaments).'],
    ['Temperament', 'What a nature does off the field: nerves on the big stage, faster learning and more. Each one is listed under Temperaments.'],
    ['Friendship', 'Grows with time on a team. High friendship helps in battle and is needed for Battle Bond.'],
    ['Form', 'Recent results make a Pokémon run hot (On fire, Hot) or cold (Cold, Slumping), which nudges its strength.'],
    ['Hidden ability', 'The rarer third ability slot. 25% of Pokémon have it, 50% of shinies, alphas and Deltas.'],
    ['Alpha', 'A bigger, stronger wild Pokémon: outstanding IVs and already on a hot streak.'],
    ['Shiny (✦)', 'A rare wild Pokémon with perfect IVs that arrives on fire.'],
    ['Radiant (✧)', "Rarer than a shiny. It wears its species' shiny colors, always has at least Good IVs, and has an ability its species never gets that's stronger in battle than any it does. The ability stays through evolution."],
    ['Delta (Δ)', 'A rare Pokémon with an unusual second type and outstanding IVs.'],
    ['Legendary / Mythical', "One-of-a-kind Pokémon. The great legendaries appear through story events; others roam the region or come with storms, and more will get events of their own."],
    ['Roaming legendary', "Raikou, Entei, Suicune, Latias or Latios moving between towns for 7–9 weeks. Challengers exploring on the way to its town (or the next one) may find it among their wild Pokémon and catch it like any other."],
    ['Legendary storm', "Four weeks of weather over the whole region, brought by Articuno (blizzard), Moltres (heat wave), Zapdos (electric storm), Thundurus (thunderstorm), Tornadus (gale) or Landorus (who calms the skies after Tornadus or Thundurus). It powers up one type for everyone, and when it passes the legendary chooses the challenger who won the most battles in it, whatever their type."],
    ['Legendary partner', "A legendary or mythical Pokémon stays with a trainer for 3–5 seasons, then moves on in the offseason. It waits in the League where it was first found, keeping its lifetime record, and the next trainer to find or be given it gets that same Pokémon at their own level. It never goes back to a trainer it has already been with. Baby legendaries count from their catch. Ultra Beasts and Paradox Pokémon aren't included."],
    ['Baby legendary / Rare find', 'Pokémon like Cosmog or Meltan that grow into legendaries. Only one exists in the world at a time.'],
    ['Paradox', "Ancient and Future Pokémon. They aren't one of a kind: two trainers can have the same one. Nothing hands them out at present."],
    ['Banlist', `Each offseason a League's trainers (challengers, Gym Leaders, the Elite Four and the Champion) vote on banning five Pokémon drawn at random from the season's top 20 performers, with at most two legendaries on the ballot. They vote against Pokémon that beat them, that their team is weak to or that their rival uses, never ones on their own team. Each votes Allow or a ban of 1 to ${BAN_MAX_SEASONS} seasons, and a ban passes for the longest length that more than half of them back. A ban covers the Pokémon, what it evolves from and what it evolves into. Challengers let banned Pokémon go; Gym Leaders, the Elite Four and the Champion get a replacement.`],
    ['Ultra Beast', 'Comes through an Ultra Wormhole. One chance to catch it.'],
    ['Wildcard', "A specialist's one strong Pokémon outside their type, kept for coverage."],
  ],
  league: [
    ['Badge circuit', 'The eight gyms challengers work through each season. Eight badges qualify a trainer for the League.'],
    ['Set level', `Every battle on the circuit is fought at a set level for both sides: gyms ${GYM_LV.join(', ')}, the Elite Four ${E4_LV.join(', ')}, the Champion ${CHAMP_LV}. Challengers' Pokémon have no levels of their own: each one takes the form and moves it would have at the level of its trainer's next battle, so nobody can out-level a gym.`],
    ['Who fights', "A challenger fields as many Pokémon as the trainer in front of them, picked for the matchup. A trainer with a higher Strategy rating picks better."],
    ['Gym trainers', `Each gym has ${GYM_TRAINERS} gym trainers of the leader's type, each with one Pokémon fewer than the leader. A challenger must beat them, then the leader, and is healed between battles. A gym trainer already beaten stays beaten.`],
    ['Tries', `A challenger gets ${GYM_TRIES} tries at each gym in a season. A loss to a gym trainer or the leader costs one. A third loss at the same gym ends their season.`],
    ['Perfect season', 'A season in which no challenger beats your Champion. The wall report on the History page counts them, with badges conceded and how far the best challenger got.'],
    ['Elite Four', 'Four battles in a row at the League, then the Champion. One loss ends the run.'],
    ['Champion', 'A challenger who beats the Champion wins a title, and the League has conceded one. The Champion keeps the seat and only leaves by retiring; for now the strongest Elite Four member then moves up.'],
    ['World Championship', 'With several Leagues, their Champions meet after the season.'],
    ['Triple Crown', 'Champion of three different Leagues across a career. A trainer with titles in 2+ Leagues gets 3 extra seasons before age can retire them.'],
    ['Hall of Fame', 'Retired trainers who won a title.'],
    ['Hall of Shame', "Records nobody wants: worst win rates, longest losing streaks and the like."],
    ['Meta', 'The five best-performing species of the season. Gyms and newcomers adapt to counter them.'],
    ['Rival', 'Two challengers who keep meeting in close road battles.'],
    ['Nemesis', 'Someone a trainer has lost to five times or more without a win.'],
    ['Crossroads', 'After 10 seasons without finishing the circuit, a trainer may retire or reinvent themselves with a new class.'],
    ['Gym Leader comeback', 'A leader with 6–8 outstanding seasons in a row may return to the circuit, sharper, with five guaranteed seasons.'],
    ['Legacy trainer', 'The child of a decorated retiree, setting out as a challenger with their parent\'s type.'],
    ['Famous trainer', 'Characters from the games, anime and optional packs, who keep their own type and signature Pokémon.'],
    ['Season awards', Object.values(AWARDS).map(a => a.name).join(', ') + '.'],
  ],
};
const GLOSS_SECS = [['all', 'All'], ['abilities', 'Abilities'], ['moves', 'Moves'], ['items', 'Items'], ['traits', 'Trainer traits'], ['tempers', 'Temperaments'], ['ratings', 'Ratings'], ['plans', 'What trainers do'], ['battle', 'Battle terms'], ['mons', 'Pokémon terms'], ['league', 'League & careers']];
let glossCache = null;
function glossEntries() {
  if (glossCache) return glossCache;
  const out = { abilities: [], moves: [], items: [], traits: [], ratings: [], tempers: [] };
  const holders = {}; for (const [sp, A] of Object.entries(SPECIES_AB)) for (const k of ['0', '1', 'H']) if (A[k]) (holders[A[k]] = holders[A[k]] || []).push(sp);
  for (const [a, d] of Object.entries(ABILITIES).sort((x, y) => x[0].localeCompare(y[0]))) { const h = (holders[a] || []).filter(sp => SP[sp] && !SP[sp].legend); const eg = (h.length ? h : holders[a] || []).slice(0, 4); out.abilities.push({ n: a, d, x: eg.length ? 'e.g. ' + eg.join(', ') : '' }); }
  for (const mv of Object.values(MOVES).sort((x, y) => x.name.localeCompare(y.name))) out.moves.push({ n: mv.name, d: moveLine(mv, null), chip: chip(mv.type), x: [mv.sig && SIG_MOVES[mv.name] ? 'Signature of ' + SIG_MOVES[mv.name].join(', ') : '', mv.tier >= 3 ? 'learned from Lv 40' : mv.tier === 2 ? 'learned from Lv 22' : ''].filter(Boolean).join(' · ') });
  for (const [k, it] of Object.entries(ITEMS).sort((x, y) => x[1].name.localeCompare(y[1].name))) out.items.push({ n: it.name, d: it.desc, x: it.tier === 3 ? 'Rare' : it.tier === 2 ? 'Uncommon' : 'Common' });
  for (const t of Object.values(TRAITS)) out.traits.push({ n: t.name, d: t.text });
  for (const [n, x] of Object.entries(TEMPER)) out.tempers.push({ n: `${n} · ${x.name}`, d: x.d, x: natureText(n) });
  for (const k of RK) out.ratings.push({ n: RNAME[k], d: RATING_TEXT[k] });
  for (const [sec, list] of Object.entries(GLOSS_TERMS)) out[sec] = list.map(([n, d]) => ({ n, d }));
  return glossCache = out;
}
function glossResults() {
  const all = glossEntries(), q = fold(glossQ.trim());
  const secs = GLOSS_SECS.filter(([k]) => k !== 'all' && (glossSec === 'all' || glossSec === k));
  let total = 0;
  const html = secs.map(([k, label]) => {
    const rows = all[k].filter(e => !q || fold(e.n + ' ' + e.d.replace(/<[^>]+>/g, '') + ' ' + (e.x || '')).includes(q));
    total += rows.length; if (!rows.length) return '';
    const shown = glossSec === 'all' && !q ? rows.slice(0, 6) : rows;
    return `<section class="gl-sec"><div class="gl-h"><h3>${label}</h3><span class="muted small">${rows.length}</span></div>
      <dl class="gl">${shown.map(e => `<div class="gl-row"><dt>${esc(e.n)}${e.chip ? ' ' + e.chip : ''}</dt><dd>${e.d}${e.x ? ` <span class="muted small">· ${esc(e.x)}</span>` : ''}</dd></div>`).join('')}</dl>
      ${shown.length < rows.length ? `<button class="link" data-act="glosssec" data-v="${k}">All ${rows.length} ${label.toLowerCase()} ›</button>` : ''}</section>`;
  }).join('');
  return total ? html : `<p class="muted">Nothing matches “${esc(glossQ.trim())}”.</p>`;
}
function glossaryBody() {
  return `<div class="mh"><h2>Glossary</h2><button class="btn icon" data-act="close" aria-label="Close">×</button></div>
  ${searchBox('glosssearch', glossQ, 'Search the glossary', 'Search abilities, moves, items, terms…')}
  <div class="filters">${GLOSS_SECS.map(([k, l]) => `<button class="pill${glossSec === k ? ' on' : ''}" data-act="glosssec" data-v="${k}">${l}</button>`).join('')}</div>
  <div id="glossres">${glossResults()}</div>`;
}

// ---------- updates ----------
// newest first; add an entry with every published change.
// Versioning rule (from v179 on): every new version gets the next id, a date AND a timestamp (Eastern Time),
// and all changes made in one working session go into that one version's entry.

// ---------- god mode ----------
let godLg = 0, godPick = null, godRole = 'challenger';
const GOD_RATINGS = { str: 'Strategy', trn: 'Training', bnd: 'Bonding', sct: 'Scouting', nrv: 'Nerve' };
const GOD_ROLES = { challenger: 'Challengers', leader: 'Gym Leaders', e4: 'Elite Four and Champion' };
function godEditor() {
  if (godLg >= nLeagues()) godLg = 0;
  const list = Object.values(S.trainers).filter(x => lgOf(x) === godLg && (godRole === 'e4' ? ['e4', 'champion'].includes(x.role) : x.role === godRole)).sort((a, b) => ovr(b) - ovr(a));
  const t = godPick != null && T(godPick) && list.some(x => x.id === godPick) ? T(godPick) : null;
  const row = x => `<div class="pt-row${t === x ? ' sel' : ''}"><div class="pt-id">${tname(x.id)} ${ovrPill(x)} <span class="muted small">age ${x.age} · POT ${x.pot} · ${roleHere(x)}</span></div><div class="pt-act"><button class="btn small${t === x ? ' primary' : ''}" data-act="godpick" data-id="${x.id}">${t === x ? 'Close' : 'Edit'}</button></div></div>`;
  const num = (id, label, v, lo, hi) => `<label class="cf-field"><span class="eyebrow">${label}</span><input id="${id}" class="cf-in" type="number" inputmode="numeric" min="${lo}" max="${hi}" value="${v}"></label>`;
  const form = t ? `<div class="pt-life"><div class="ph"><h3>${dn(t)}</h3><span class="muted">OVR ${ovr(t)}</span></div>
      <div class="cf-grid six"><label class="cf-field"><span class="eyebrow">Name</span><input id="ge-name" class="cf-in" maxlength="24" value="${esc(t.name)}" autocomplete="off"></label>
        ${num('ge-age', 'Age', t.age, 10, 70)}${num('ge-pot', 'Potential', t.pot, 1, 99)}</div>
      <div class="eyebrow">Ratings</div><div class="cf-grid six">${RK.map(r => num('ge-' + r, GOD_RATINGS[r], t.r[r], 1, 99)).join('')}</div>
      <div class="confirm-row"><button class="btn primary" data-act="godsave" data-id="${t.id}">Save changes</button></div></div>` : '';
  return `<section class="panel"><div class="ph"><h3>Trainers</h3><span class="muted">${list.length} shown</span></div>
    <div class="release">${Object.keys(GOD_ROLES).map(k => `<button class="rel${godRole === k ? ' on' : ''}" data-act="godrolesel" data-k="${k}">${GOD_ROLES[k]}</button>`).join('')}</div>
    ${nLeagues() > 1 ? `<div class="release" style="margin-top:6px">${Array.from({ length: nLeagues() }, (_, i) => `<button class="rel${godLg === i ? ' on' : ''}" data-act="godlgsel" data-i="${i}">${lgShort(i)}</button>`).join('')}</div>` : ''}
    ${form}${list.map(row).join('') || '<p class="muted">Nobody here.</p>'}</section>`;
}
function viewGod() {
  if (!godOn()) return viewCircuit();
  const off = S.phase === 'offseason';
  return `<section class="panel callout"><div class="eyebrow">God mode</div><h2>Shape the world by hand</h2>
    <p>Open a League, or edit any trainer directly. These skip the usual limits.${off ? '' : ' <b>A League is opened in the offseason.</b>'}</p></section>
  <section class="panel"><div class="ph"><h3>Leagues</h3><span class="muted">${nLeagues()} of ${MAX_LEAGUES} regions open</span></div>
    <p>${Array.from({ length: nLeagues() }, (_, i) => leagueName(i)).join(' · ')}${S.nextLeague ? ` · next opening on its own in Season ${S.nextLeague.season}` : ''}</p>
    <div class="confirm-row"><button class="btn primary" data-act="godleague" ${off && nLeagues() < MAX_LEAGUES ? '' : 'disabled'}>${nLeagues() < MAX_LEAGUES ? `Open the ${nextRegionName()} now` : 'Every region is open'}</button></div></section>${godEditor()}`;
}
