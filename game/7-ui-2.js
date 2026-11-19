// ---------- the badge circuit, gyms and Elite ----------
// (0.41.0) the circuit shows this League's challengers, or the whole region's field (circScope 'region'): challengers
// belong to the region and draw which of its Leagues to take on before each run
let circScope = 'lg';
function viewCircuit() {
  // challengers out on a run first (most badges first), then those resting between runs (soonest back first)
  const out = t => t.rest == null, r = S.region, lgs = regionLgs(r), region = circScope === 'region' && lgs.length > 1;
  const rows = (region ? fieldIds(r).map(T).filter(Boolean) : challengers()).sort((a, b) => out(b) - out(a) || (out(a) ? b.badges.length - a.badges.length || ovr(b) - ovr(a) : a.rest - b.rest));
  const onRun = rows.filter(out).length, size = fieldSize(r), aim = fieldTarget(r);
  const shares = lgs.map(i => `${i === (S.lg || 0) ? '<b>' : ''}${esc(lgShort(i))} ${(lgObj(i).challengers || []).length}${i === (S.lg || 0) ? '</b>' : ''}`).join(' · ');
  const scope = lgs.length > 1 ? `<span class="confirm-row"><button class="btn small${region ? '' : ' primary'}" data-act="circscope" data-v="lg">This League</button><button class="btn small${region ? ' primary' : ''}" data-act="circscope" data-v="region">The region's field</button></span>` : '';
  return `${staffNotices()}${legendBanner()}${roamBanner()}${stormBanner()}${outbreakBanner()}${yearSoFar()}
  <section class="panel"><div class="ph"><h2>Badge circuit${region ? ' · ' + esc(regionWord(r)) + "'s field" : nLeagues() > 1 ? ' · ' + S.lgName : ''}</h2><span class="muted">${rows.length} challengers: ${onRun} out on a run, ${rows.length - onRun} resting. Each is on their own clock: a run starts with their best ${START_TEAM} Pokémon, takes the gyms in any order, and ends on a third loss at one gym or after the Elite Four.</span></div>
  ${lgs.length > 1 ? `<p class="small">The region's field: <b>${size}</b> challengers (it aims at about ${aim}). Before each run a challenger draws which of the region's Leagues to take on, by prestige, standing in their hometown, loyalty to a League that holds it, and for weaker challengers easier walls and quieter Leagues. Now: ${shares}.</p>${scope}` : ''}
  <div class="scroll"><table class="tbl"><thead><tr><th>#</th><th>Trainer</th><th>OVR</th><th>Age</th><th>Type</th>${region ? '<th>League</th>' : ''}<th>Badges</th><th title="Gym tries won and lost this year">Gym W–L</th><th>Where they are</th><th>Pokémon</th></tr></thead><tbody>
  ${rows.map((t, i) => { const w = t.weekLog.filter(e => e.won === true).length, l = t.weekLog.filter(e => e.won === false).length;
    return `<tr${out(t) ? '' : ' class="resting"'}><td class="num">${i + 1}</td><td>${tname(t.id)}${t.joined === S.season ? ' <span class="tag">rookie</span>' : ''}${hireTags(t)}</td><td>${ovrPill(t)}</td><td class="num">${t.age}</td><td>${specChips(t)}</td>${region ? `<td class="small">${esc(lgShort(lgOf(t)))}</td>` : ''}<td>${out(t) ? badgeRow(t) : '<span class="muted">—</span>'}</td><td class="num">${w}–${l}</td><td>${inLeague(lgOf(t), () => gymStatus(t))}</td><td>${teamDots(t)}</td></tr>`; }).join('')}
  </tbody></table></div></section>${skyPanel()}`;
}
// how a run ended, in words
function lastRunText(t) {
  const r = t.last; if (!r) return 'not yet set out';
  return r.stage == null ? `out with ${r.badges} badge${r.badges === 1 ? '' : 's'}` : r.stage === 5 ? 'won the title' : r.stage === 4 ? 'lost the title match' : `lost to Elite Four #${r.stage + 1}`;
}
// the year so far for the bound League: the wall's running tally and the year's League runs
function yearSoFar() {
  const L = S.league, h = S.history.filter(x => x.titles != null);
  let streak = 0; for (let i = h.length - 1; i >= 0 && !h[i].titles; i--) streak++;
  const badges = S.gyms.reduce((a, g) => a + g.l, 0), e = L ? L.entries : [], titles = L ? L.conceded.length : 0;
  const run = x => `<li${x.route && x.route.length ? ` title="Route: ${esc(x.route.join(' → '))}"` : ''}><span>${tname(x.id)} <span class="muted small">${weekShort(x.week)}</span></span><span class="num">${x.stage === 5 ? '<span class="tag notice">won the title</span>' : x.stage === 4 ? 'lost the title match' : `lost to Elite Four #${x.stage + 1}`}</span></li>`;
  return `<section class="panel callout"><div class="eyebrow">Year ${S.season} so far${nLeagues() > 1 ? ' · ' + S.lgName : ''}</div>
    <h2>${titles ? `${titles} title${titles === 1 ? '' : 's'} conceded this year` : 'No title conceded this year'}</h2>
    <p>${streak ? `<b>${streak}</b> perfect year${streak === 1 ? '' : 's'} in a row behind you. ` : ''}${badges} badge${badges === 1 ? '' : 's'} conceded, ${L ? L.runs : 0} run${L && L.runs === 1 ? '' : 's'} begun, ${L ? L.out : 0} ended on a third loss, ${e.length} reached the Elite Four${L && L.bestId && T(L.bestId) ? `. Furthest so far: ${tname(L.bestId)} (${depthName(L.best)})` : ''}.</p>
    ${e.length ? `<ul class="mini">${e.slice(-6).reverse().map(run).join('')}</ul>` : ''}
    ${L && L.logs.length ? `<div class="logs">${L.logs.map((r, i) => `<button class="btn small" data-act="watch" data-i="${i}" data-y="now">${r.title}: ${r.sides[0].name}</button>`).join('')}</div>` : ''}</section>`;
}
// where a challenger stands: resting between runs, tries used and gym trainers beaten at their next gym, or about
// to take on the Elite Four
function gymStatus(t) {
  const b = t.badges.length, g = t.gymAt;
  if (t.rest != null) return `<span class="small muted">Resting · ${lastRunText(t)} · sets out ${turnDate(t.rest)}</span>`;
  if (b >= 8) return '<span class="tag gold">Elite Four next</span>';
  if (g == null) return `<span class="small muted">Choosing their next gym · Lv ${GYM_LV[b]}</span>`;
  const used = triesAt(t, g), st = gymStageNow(t);
  return `<span class="small">${townName(g)} · Lv ${GYM_LV[b]} · ${GYM_TRIES - used} ${GYM_TRIES - used === 1 ? 'try' : 'tries'} left${st ? ` · ${st} of ${GYM_TRAINERS} trainers beaten` : ''}</span>`;
}
function eliteCard(t, label, extra = '', foot = '') {
  return `<article class="elite"><div class="eyebrow">${label}</div><div class="elite-h">${tname(t.id)} ${ovrPill(t)}</div><div class="elite-s">${specChips(t)} <span class="muted">Age ${t.age}</span> ${staffTags(t)}${extra}</div>
    <ul class="mini">${t.team.slice().reverse().map(m => `<li><span>${monMini(m.sp, m.shiny || m.radiant)}<button class="tlink" data-act="mon" data-t="${t.id}" data-u="${m.uid}">${m.sp}</button></span><span class="num">${stOf(m).b ? wl(stOf(m)) + ' · ' : ''}Lv ${Math.floor(m.lvl)}</span></li>`).join('')}</ul>${foot}</article>`;
}
function viewGyms() {
  const ch = T(S.champion);
  return `${staffNotices()}<section class="panel champ"><div class="ph"><h2>Champion</h2><span class="muted">${ch.career.defenses} defenses · ${ch.career.conceded || 0} title${(ch.career.conceded || 0) === 1 ? '' : 's'} conceded · keeps the seat when beaten</span></div>${eliteCard(ch, `${S.lgName} Champion`)}</section>
  <section class="panel"><div class="ph"><h2>Elite Four</h2><span class="muted">Faced in this order, each at a set level for both sides (${E4_LV.join(', ')}; the Champion at ${champLv()})</span></div><div class="elite-grid">${S.e4.map((id, i) => eliteCard(T(id), `Elite Four #${i + 1} · ${T(id).career.e4Wins} career wins`)).join('')}</div></section>
  <section class="panel"><div class="ph"><h2>Gyms</h2><span class="muted">Gyms can be taken in any order, and every gym scales to the challenger: it fights at the level and team size for the badges they already hold (Lv ${GYM_LV[0]} with ${GYM_SIZE[0]} Pokémon at none, up to Lv ${GYM_LV[GYM_TOP]} with ${GYM_SIZE[GYM_TOP]} at seven), and a challenger fields as many as the trainer in front of them. Leaders hold up to ${LEADER_HOLD} Pokémon and gym trainers ${GYM_TRAINERS ? GT_HOLD : 0}, each fielding what the battle needs (gym trainers one fewer than the leader). Challengers must beat both gym trainers, then the leader, and get ${GYM_TRIES} tries at each gym on a run. Record is tries turned back–badges conceded this year. A gym's type is its leader's class; a leader with no type focus fields a mixed team. Staff build their own teams: Scouting finds stronger Pokémon, Strategy fits the team together, Training raises each Pokémon.</span></div><div class="elite-grid">${S.gyms.map((g, i) => g.leader ? eliteCard(T(g.leader), `Gym ${i + 1} · ${townName(i)}`, `${gymWeatherTag(T(g.leader))}<span class="rec">${g.w}–${g.l}</span>`, gymTrainerList(g, i) + gymWatch(g, i)) : `<article class="elite"><div class="eyebrow">Gym ${i + 1} · ${townName(i)}</div><p class="muted">Vacant</p></article>`).join('')}</div></section>${banCard()}`;
}
function gymTrainerList(g, i) {
  const ts = (g.trainers || []).map(T).filter(Boolean);
  if (!ts.length) return '';
  return `<div class="eyebrow" style="margin-top:.6rem">Gym trainers · up to ${GT_HOLD} Pokémon each</div><ul class="mini">${ts.map(t => `<li><span>${tname(t.id)} ${specChips(t)} ${ovrPill(t)} ${staffTags(t)}</span><span class="small muted">${t.team.map(m => m.sp).join(', ')}</span></li>`).join('')}</ul>`;
}
// the last few badges a gym of the player's League conceded, to watch (0.7.0)
function gymWatch(g, i) {
  const w = g.watch || []; if (!w.length) return '';
  return `<div class="eyebrow" style="margin-top:.6rem">Badges conceded lately</div><div class="logs">${w.map((r, k) => `<button class="btn small" data-act="watchgym" data-g="${i}" data-i="${k}">${esc(r.sides[0].name)} · ${weekShort(r.when.week)}, Year ${r.when.season}</button>`).reverse().join('')}</div>`;
}
// (0.17.0) a sponsored contender: whose, and against whom
const sponTag = t => t && t.spon ? ` <span class="tag small" title="Under contract until ${turnDate(t.spon.until)}">${t.spon.pending === 'send' ? 'Going' : 'Contender'}: ${esc(lgShort(t.spon.lg))} vs ${esc(lgShort(t.spon.to))}</span>` : '';
// ---------- staff notices (0.6.0) ----------
// acting holders and staff who have announced they are stepping down, tagged wherever their card shows
function staffTags(t) {
  return (t.acting ? '<span class="tag notice">Acting</span> ' : '') + (t.stepDown != null ? `<span class="tag notice">Steps down ${turnDate(t.stepDown)}</span> ` : '');
}
// (0.9.0) on the player's circuit: a challenger who impressed the League, and one hired who comes after their run
function hireTags(t) {
  const sp = sponTag(t);
  if (!handOn() || (S.lg || 0) !== ME()) return sp;
  const imp = impressed(t);
  const st = (t.store || []).length && !STAFF_ROLES.includes(t.role) ? ` <span class="tag small" title="${esc(t.store.slice(0, 6).map(s => s.top || s.sp).join(', '))}${t.store.length > 6 ? '…' : ''}. Hired to a senior post, they let you take up to ${storePickN()} into the ranch, and ask more pay the richer it is.">Storage ${t.store.length} · ${money(storeTotal(t))}</span>` : '';
  return st + sp + (claimOn(t) ? ` <span class="tag notice small" title="Claims the Champion's seat; glad to take a post instead">Claimant</span>` : '') + (imp ? ` <span class="tag gold small" title="${esc(imp)}">Impressed</span>` : '') + (t.hired ? ` <span class="tag notice small">Hired: ${hireTarget(t.hired)} by ${turnDate(t.hired.by)}</span>` : '');
}
// (0.9.0) a warning on a Gym Leader's poor years in a row, or an Elite Four member with the worst record of the four
// two or more years running. In the player's League nothing happens on its own: replacing them is the player's call.
function staffWarn(t) {
  const p = postOf(t); if (!p) return '';
  if (p.post === 'leader') { const g = S.gyms[p.slot]; if (g.poorFor === t.id && g.poor) return ` ${poorTag(g.poor)}`; }
  if (p.post === 'e4' && (t.e4Poor || 0) >= 2) return ` ${e4PoorTag(t.e4Poor)}`;
  return '';
}
const poorTag = n => `<span class="tag small${n >= POOR_YEARS ? ' notice' : ''}" title="Held under 30% of 12 or more tries">${n} poor year${n === 1 ? '' : 's'} in a row</span>`;
const e4PoorTag = n => `<span class="tag small${n >= POOR_YEARS ? ' notice' : ''}" title="Stopped the smallest share of the runs that reached them">worst of the Elite Four ${n} years running</span>`;
// (0.10.0) a member of staff's ambition, as a tag: promotion (restless in its last year, with the date they leave
// if not promoted), stay put, another run, or the date they leave
function wishTag(t) {
  const w = t && t.wish; if (!w || !STAFF_ROLES.includes(t.role) || t.acting) return '';
  if (t.quit) return ` <span class="tag notice small" title="${t.quit.k === 'run' ? 'Leaving for another run as a challenger' : 'Tired of waiting for promotion: promote them before then and they stay'}">Leaving ${turnDate(t.quit.at)}</span>`;
  if (w.k === 'stay') return ' <span class="tag small" title="Content where they are: refuses a sideways move or a swap">Stay put</span>';
  if (w.k === 'run') return ` <span class="tag notice small" title="Let them go on their run, or they leave a year after asking">${w.asked != null ? 'Asks for another run' : 'Wants another run'}</span>`;
  if (w.k === 'step') { const due = ambDue(t); return ` <span class="tag small${restless(t) ? ' notice' : ''}" title="${due != null ? `Gives notice to step down on ${turnDate(due)}; the strongest Elite Four member would move up` : 'Wants to step down'}">Wants to step down</span>`; }
  const due = ambDue(t), rest = restless(t);
  return ` <span class="tag small${rest ? ' notice' : ''}" title="${due != null ? `Leaves if not promoted by ${turnDate(due)}` : 'Waits until the seat can be challenged for'}">${rest ? 'Restless: wants ' : 'Wants '}${ambWho(t)}</span>`;
}
// (0.23.0) a candidate's prestige minimum, when they have one, for the hiring and founding pages
function prestTag(t, lg) {
  if (t.outsider || t.carried || (STAFF_ROLES.includes(t.role) && homeLeague(t) === lg)) return '';
  const m = prestMin(t, lg); if (!m) return '';
  const ok = m <= prestOf(lg);
  return ` <span class="tag small${ok ? '' : ' notice'}" title="${ok ? 'Your League has the prestige to sign them' : 'Your League needs more prestige before they will sign'}${hungry(t) ? '; hungry for a post, so their bar is lower' : ''}">Prestige ${m}</span>`;
}
// a candidate row for the hiring pages: a challenger gets an offer (and may be out on a run, or have turned you down lately)
function hireRowOf(c, warn, ask) {
  const t = c.t, bits = warn ? [warn] : [], imp = c.from === 'circuit' && impressed(t);
  let label = 'Pick', off = '';
  if (c.refuse) off = c.refuse;
  else if (c.from === 'circuit' || c.from === 'away') {
    label = 'Offer';
    if (!canOffer(t)) off = `turned you down · ask again ${turnDate(t.refusedAt + REFUSED_WEEKS)}`;
    else if (t.rest == null) bits.push(`on a run: comes by ${turnDate(S.turn + HIRE_NOTICE)}`);
  }
  return { t, from: pickFrom(c), warn: bits.join(' · '), label, off, tags: (imp ? ` <span class="tag gold small" title="${esc(imp)}">Impressed</span>` : '') + (['leader', 'e4', 'gym'].includes(c.from) ? wishTag(t) : '') + (ask != null && !['leader', 'e4', 'gym', 'acting'].includes(c.from) ? payTag(ask) : '') + (['circuit', 'retired', 'rival', 'away'].includes(c.from) ? prestTag(t, ME()) : '') };
}
// someone who accepted a post and comes after their run, with a button to withdraw the offer
const incomingLine = (id, what) => { const t = T(id); return t && t.hired ? `<p><b>${tname(id)}</b> accepted ${what} and comes after their run, by ${turnDate(t.hired.by)} at the latest. <button class="btn small" data-act="hirewd" data-id="${id}">Withdraw the offer</button></p>` : ''; };
// the player's League: open vacancies (with the picker) and announced departures, at the top of the circuit and gym pages
function staffNotices() {
  if (!handOn() || (S.lg || 0) !== ME()) return '';
  const vac = S.vacancies || [], going = staffIds().map(T).filter(t => t && t.stepDown != null).sort((a, b) => a.stepDown - b.stepDown);
  const leaving = staffIds().map(T).filter(t => t && t.quit && t.role !== 'gymtrainer').sort((a, b) => a.quit.at - b.quit.at);
  const asking = staffIds().map(T).filter(t => t && !t.quit && t.wish && t.wish.k === 'run' && t.wish.asked != null);
  const chal = S.chalPending || [];
  if (!vac.length && !going.length && !leaving.length && !asking.length && !chal.length) return '';
  return `<section class="panel callout warnbox"><div class="ph"><div class="eyebrow">Your staff</div><button class="btn small" data-act="nav" data-v="staff">Manage your staff</button></div>
    ${vac.length ? `<h2>${vac.length} post${vac.length === 1 ? '' : 's'} waiting for you</h2><ul class="mini">${vac.map((v, i) => `<li><span><b>${vacancyName(v)}</b> &nbsp;· vacant since ${turnDate(v.since)} · held by&nbsp;${tname(vacancyActing(v))}&nbsp;(acting)${v.incoming != null && T(v.incoming) && T(v.incoming).hired ? ` · ${tname(v.incoming)} comes by ${turnDate(T(v.incoming).hired.by)}` : ''}</span><span><button class="btn small primary" data-act="hire" data-v="${i}">Choose</button> <button class="btn small" data-act="hireauto" data-v="${i}">Fill it for me</button></span></li>`).join('')}</ul>
      <p class="muted small">Until you choose, the acting holder fights in the post. ${vac.some(v => v.post === 'leader') ? 'A gym with an acting leader runs one gym trainer short. ' : ''}</p>` : ''}
    ${chalNotice()}
    ${going.length ? `<div class="eyebrow">Stepping down</div><ul class="mini">${going.map(t => `<li><span>${tname(t.id)}&nbsp;· ${postName(t)}</span><span class="small">leaves ${turnDate(t.stepDown)}</span></li>`).join('')}</ul>` : ''}
    ${leaving.length ? `<div class="eyebrow">Leaving</div><ul class="mini">${leaving.map(t => `<li><span>${tname(t.id)}&nbsp;· ${postName(t)}</span><span class="small">${t.quit.k === 'run' ? 'for another run' : t.quit.k === 'step' ? 'stepping down' : t.role === 'champion' ? 'for a bigger League, unless given a raise' : `unless promoted to ${ambWho(t)}`}, ${turnDate(t.quit.at)}</span></li>`).join('')}</ul>` : ''}
    ${asking.length ? `<div class="eyebrow">Asking for another run</div><ul class="mini">${asking.map(t => `<li><span>${tname(t.id)}&nbsp;· ${postName(t)}</span><span class="small">leaves anyway ${turnDate(t.wish.asked + RUN_HOLD)}</span></li>`).join('')}</ul>` : ''}</section>`;
}
// (0.34.0) calling a challenge against your own Champion
let callOpen = false;
function callPanel() {
  const block = callBlock(), left = CALL_MAX - callsUsed();
  const head = `<section class="panel"><div class="ph"><h3>Call a challenge</h3><span class="muted">${left} of ${CALL_MAX} left this year</span></div>`;
  if (block) return `${head}<p class="muted">${esc(block)}</p></section>`;
  if (!callOpen) return `${head}<p>Name a challenger for the Champion's seat: an Elite Four member, a Gym Leader, or a title winner of this year or last still on your circuit. It is one battle at the Champion's level, ${CALL_WEEKS} weeks after you call it; you can fight it sooner or call it off. The winner takes the seat. A Champion called against may come to want to leave.</p><button class="btn small primary" data-act="callopen">Choose a challenger</button></section>`;
  const rows = callCands().map(c => `<tr><td>${tname(c.t.id)}${wishTag(c.t)}</td><td class="small">${c.from === 'e4' ? `Elite Four #${c.slot + 1}` : c.from === 'leader' ? `${townName(c.gym)} Gym Leader` : 'title winner'}</td><td>${specChips(c.t)}</td><td>${ovrPill(c.t)}</td><td>${c.block ? `<span class="muted small">${esc(c.block)}</span>` : `<button class="btn small primary" data-act="callchal" data-id="${c.t.id}">Call</button>`}</td></tr>`).join('');
  return `${head}<div class="scroll"><table class="tbl"><thead><tr><th>Challenger</th><th>Now</th><th>Type</th><th>OVR</th><th></th></tr></thead><tbody>${rows}</tbody></table></div><button class="btn small ghost" data-act="callopen">Close</button></section>`;
}
// (0.11.0) seat challenges waiting for the player's yes or no
function chalNotice() {
  const chal = S.chalPending || []; if (!chal.length) return '';
  const claims = chal.map((x, i) => [x, i]).filter(([x]) => x.from === 'claim');
  return `<div class="eyebrow">Seat challenge${chal.length === 1 ? '' : 's'} waiting for you</div><ul class="mini">${chal.map((x, i) => x.called ? `<li><span>You called ${tname(x.cand)} <span class="small">(${callFrom(x)})</span> to challenge ${tname(x.inc)} for the Champion's seat <span class="small muted">· fought ${turnDate(x.due)}</span></span><span><button class="btn small primary" data-act="chalyes" data-v="${i}">Fight it now</button> <button class="btn small" data-act="chalno" data-v="${i}">Call it off</button></span></li>` : x.from === 'claim' ? `<li><span>${tname(x.cand)} <span class="small">(won your title this year)</span> claims ${tname(x.inc)}'s Champion's seat <span class="small muted">· lapses ${turnDate(x.due)} if you don't answer</span></span><span><button class="btn small primary" data-act="chalyes" data-v="${i}">Allow the battle</button> <button class="btn small" data-act="chalno" data-v="${i}">Turn it down</button></span></li>` : `<li><span>${tname(x.cand)} <span class="small">(${x.k === 'champ' ? `Elite Four #${x.slot + 1}${x.from === 'rival' ? ` of the ${leagueName(x.lg)}` : ''}` : x.from === 'leader' ? `${townName(x.gym)} Gym Leader` : 'after a run to the Elite Four'})</span> challenges ${tname(x.inc)} for ${x.k === 'champ' ? "the Champion's seat" : `Elite Four seat #${x.slot + 1}`} <span class="small muted">· goes ahead ${turnDate(x.due)} unless you refuse</span></span><span><button class="btn small primary" data-act="chalyes" data-v="${i}">Approve</button> <button class="btn small" data-act="chalno" data-v="${i}">Refuse</button></span></li>`).join('')}</ul>
    <p class="muted small">One battle at the seat's level, the challenger with a team built for the seat. A beaten Champion takes the winner's Elite Four seat; a beaten Elite Four member takes the winning Gym Leader's gym, or returns to the circuit if a challenger beat them. Refusing, or losing, makes a member of staff restless (their promotion clock moves a year on).</p>
    ${claims.length ? `<p class="muted small">A title claim never goes ahead without you. Allowed, it is one battle at the Champion's level, your Champion with their full team and the seat's edge; a beaten Champion leaves the post. Turned down or left unanswered, your League loses ${CLAIM_PRESTIGE} prestige and the claimant leaves unhappy, perhaps to come back as another League's contender. Or offer them a post from the hiring pages while the claim stands: a claimant is glad to take one, and the claim ends there.</p>` : ''}`;
}
const vacancyName = v => v.post === 'leader' ? `${townName(v.slot)} Gym Leader (badge ${v.slot + 1})` : `Elite Four seat #${v.slot + 1}`;
const vacancyActing = v => v.post === 'leader' ? S.gyms[v.slot].leader : S.e4[v.slot];
// the hiring page for one vacancy: everyone who can take the post, best first
let hireIdx = 0, hireFit = false;
function viewHire() {
  const v = (S.vacancies || [])[hireIdx];
  if (!v) return '<section class="panel"><h2>No post is waiting</h2><p class="muted">Every post is filled.</p><button class="btn" data-act="nav" data-v="gyms">Back to the gyms</button></section>';
  const gts = v.post === 'leader' ? (S.gyms[v.slot].trainers || []).map(T).filter(t => t && !t.acting) : [];
  const fits = t => v.post === 'leader' ? gts.every(g => gymFits(g, t)) : !S.e4.some((id, k) => k !== v.slot && T(id) && !T(id).acting && specTypes(T(id)).some(x => specTypes(t).includes(x)));
  const rows = vacancyCands(v).filter(c => (!hireFit || fits(c.t)) && c.t.id !== v.incoming);
  return `<section class="panel callout"><div class="eyebrow">Choose a new ${v.post === 'leader' ? 'Gym Leader' : 'Elite Four member'}</div><h2>${vacancyName(v)}</h2>
    <p>Vacant since ${turnDate(v.since)}. ${tname(vacancyActing(v))} is acting until you choose. ${v.post === 'leader' ? `The gym scales to each challenger's badges (Lv ${GYM_LV[0]} with ${GYM_SIZE[0]} Pokémon up to Lv ${GYM_LV[GYM_TOP]} with ${GYM_SIZE[GYM_TOP]}), so its leader holds up to ${LEADER_HOLD}, and its type is the new leader's class; a gym trainer who shares no type with the new leader is let go and replaced from the circuit.` : `The seat fights at level ${E4_LV[v.slot]} with ${E4_SIZE} Pokémon.`} Whoever you pick builds their own team: Scouting finds stronger Pokémon, Strategy fits the team together, Training raises each Pokémon.</p>
    ${v.incoming != null ? incomingLine(v.incoming, 'the post') : ''}
    <div class="confirm-row"><button class="btn${hireFit ? ' on' : ''}" data-act="hirefit" aria-pressed="${hireFit}">${v.post === 'leader' ? 'Only those who keep both gym trainers' : 'Only types the Elite Four lacks'}</button><button class="btn" data-act="hireauto" data-v="${hireIdx}">Fill it for me</button><button class="btn" data-act="nav" data-v="staff">Decide later</button></div>${bidRow()}</section>
  <section class="panel"><div class="ph"><h2>Candidates</h2><span class="muted">${rows.length} trainers: the ${S.lgName} circuit, your gym trainers, your other Gym Leaders and Elite Four members, recent retirees and ${(v.outsiders || []).length} outsiders. A challenger gets an <b>offer</b>, which they can turn down (then they aren't asked again for half a year); one out on a run who accepts finishes it first, for up to ${HIRE_NOTICE} weeks, while the acting holder stays. Everyone else takes the post at once: a gym trainer leaves their place, a retiree comes out of retirement, and a Gym Leader or Elite Four member leaves their post open, with an acting holder, and you choose for it next.</span></div>
  ${pickTable(rows.map(c => hireRowOf(c, [fits(c.t) ? '' : (v.post === 'leader' ? 'gym trainers change' : 'type already on the Elite Four'), c.from === 'leader' || c.from === 'e4' ? 'their post opens' : c.from === 'rival' ? 'their League gets the signing fee' : ''].filter(Boolean).join(' · '), askFor(c.t, v.post, v.slot))), 'hirepick')}</section>`;
}
// where a candidate comes from, in words
const PICK_FROM = { circuit: 'Circuit', field: 'Region\'s field', gym: 'Gym trainer', acting: 'Acting leader', outsider: 'Outsider', leader: 'Gym Leader', e4: 'Elite Four', retired: 'Retired', rival: 'Another League', away: 'Another circuit' };
const pickFrom = c => (c.from === 'circuit' && lgOf(c.t) !== (S.lg || 0) ? `${PICK_FROM.field} · last at the ${lgShort(lgOf(c.t))}` : PICK_FROM[c.from]) + (c.from === 'rival' || c.from === 'away' ? ' · ' + lgShort(c.lg) : '') + (c.gym != null ? ' · ' + townName(c.gym) : c.seat != null ? ' #' + (c.seat + 1) : c.from === 'retired' ? ' · Year ' + c.t.retiredSeason : '');
// ---------- your staff (0.7.0) ----------
// Every post of the player's League in one place: let anyone but the Champion go, swap two Gym Leaders or two Elite
// Four members, and replace gym trainers by hand. A senior post someone leaves waits for you with an acting holder.
let staffAsk = null, staffSwap = null, gtSel = null;
function staffActs(t) {
  if (t.acting) { const vi = (S.vacancies || []).findIndex(v => vacancyActing(v) === t.id); return vi < 0 ? '' : `<button class="btn small primary" data-act="hire" data-v="${vi}">Choose</button> <button class="btn small" data-act="hireauto" data-v="${vi}">Fill it for me</button>`; }
  const run = t.wish && t.wish.k === 'run' && t.wish.asked != null;
  if (staffAsk === t.id) return `<button class="btn small primary" data-act="staffgo" data-id="${t.id}">Let ${esc(t.name)} go${run ? ' on their run' : ''}</button> <button class="btn small ghost" data-act="staffask">Cancel</button>`;
  const sw = staffSwap != null && T(staffSwap);
  if (sw && sw.id === t.id) return '<button class="btn small on" data-act="staffswap">Cancel swap</button>';
  const same = sw && sw.role === t.role && t.role !== 'gymtrainer', no = same && swapRefusal(sw, t);
  const rz = booksOn() && canRaise(t) ? ` <button class="btn small" data-act="raise" data-id="${t.id}"${canSpend(raiseCost(t)) ? '' : ' disabled'}>Raise (${money(raiseCost(t))})</button>` : '';
  return `<button class="btn small" data-act="staffask" data-id="${t.id}">${run ? 'Let go on their run' : 'Let go'}</button>${rz}${t.role === 'gymtrainer' ? '' : no ? ` <span class="small muted">No swap: ${esc(no)}</span>` : same ? ` <button class="btn small primary" data-act="staffswapto" data-id="${t.id}">Swap with ${esc(sw.name)}</button>` : ` <button class="btn small" data-act="staffswap" data-id="${t.id}">Swap</button>`}`;
}
function staffRow(t, label, info) {
  if (booksOn()) info += ` · ${money(payOf(t))}/wk`;
  return `<tr${staffSwap === t.id ? ' class="sel"' : ''}><td><b>${label}</b><div class="small muted">${info}</div></td><td>${tname(t.id)} ${staffTags(t)}${staffWarn(t)}${wishTag(t)}</td><td>${specChips(t)}</td><td class="num">${t.age}</td><td>${ovrPill(t)}</td><td class="num">${postYears(t)}</td><td>${staffActs(t)}</td></tr>`;
}
function viewStaff() {
  const ch = T(S.champion), head = '<thead><tr><th>Post</th><th>Trainer</th><th>Type</th><th>Age</th><th>OVR</th><th title="Years in posts">Years</th><th></th></tr></thead>';
  const gymRows = S.gyms.map((g, i) => {
    const L = T(g.leader), ts = (g.trainers || []).slice(0, GYM_TRAINERS);
    while (ts.length < GYM_TRAINERS) ts.push(null);
    return staffRow(L, `Gym ${i + 1} · ${townName(i)}`, `Up to ${LEADER_HOLD} Pokémon · ${g.w}–${g.l} this year`)
      + ts.map((id, k) => { const t = T(id), inc = (g.incoming || [])[k], coming = inc != null && T(inc) && T(inc).hired ? `<div class="small">Coming: ${tname(inc)} by ${turnDate(T(inc).hired.by)} <button class="btn small" data-act="hirewd" data-id="${inc}">Withdraw</button></div>` : '';
        if (!t) return `<tr class="sub"><td class="small muted">&nbsp;&nbsp;Gym trainer</td><td colspan="6" class="small muted">Left empty while the gym has an acting leader.</td></tr>`;
        return `<tr class="sub"><td class="small">&nbsp;&nbsp;Gym trainer · up to ${GT_HOLD} Pokémon</td><td>${tname(t.id)} ${staffTags(t)}${wishTag(t)}${coming}</td><td>${specChips(t)}</td><td class="num">${t.age}</td><td>${ovrPill(t)}</td><td class="num">${postYears(t)}</td><td><button class="btn small" data-act="gtpick" data-g="${i}" data-k="${k}">Replace</button> ${staffAsk === t.id ? `<button class="btn small primary" data-act="staffgo" data-id="${t.id}">Let ${esc(t.name)} go</button> <button class="btn small ghost" data-act="staffask">Cancel</button>` : `<button class="btn small" data-act="staffask" data-id="${t.id}">Let go</button>`}</td></tr>`; }).join('');
  }).join('');
  return `${staffNotices()}<section class="panel callout"><div class="eyebrow">${S.lgName}</div><h2>Your staff</h2>
    <p>Change your staff at any time. <b>Let go</b> opens a Gym Leader's or Elite Four seat, which waits for you with an acting holder, as when someone steps down; anyone let go returns to the circuit as a challenger, or retires if they are over 45 with ten years behind them. To move someone into another post, let its holder go and pick them from the list: the post they leave opens next. <b>Swap</b> trades two Gym Leaders' gyms or two Elite Four members' seats at once. A gym trainer you let go is replaced from the circuit straight away; <b>Replace</b> lets you pick one yourself. The Champion changes when they step down or leave, or lose a seat challenge. <b>Calling a challenge:</b> you decide when your Champion's seat is fought for: up to ${CALL_MAX} times a year, name an Elite Four member, a Gym Leader or a recent title winner to challenge the Champion, ${CALL_WEEKS} weeks later. A Champion called against may come to want to leave. <b>Seat challenges:</b> at New Year a Gym Leader who wants promotion (or a challenger after a run to the Elite Four) may challenge an Elite Four seat; you approve or refuse each. <b>Ambitions:</b> each member of staff wants promotion, to stay put, or another run as a challenger; the Champion may also want a bigger League's seat, or to step down. Promotion waits ${AMB_WAIT_YEARS} years (restless in the last); then a Gym Leader or Elite Four member gives ${QUIT_NOTICE} weeks' notice and leaves unless promoted, and a gym trainer just goes. Staff refuse a step down unless their record is poor, and anyone who wants to stay put refuses a sideways move or a swap. A Gym Leader's run of poor years and an Elite Four member with the worst record of the four show as warnings here; nothing happens to them unless you act.</p></section>
  ${steersPanel()}
  <section class="panel champ"><div class="ph"><h2>Champion</h2><span class="muted">The seat changes when the Champion steps down or leaves, or loses a challenge you call or a title claim you allow</span></div><div class="scroll"><table class="tbl">${head}<tbody><tr><td><b>Champion</b><div class="small muted">Lv ${champLv()} · 6 Pokémon</div></td><td>${tname(ch.id)} ${staffTags(ch)}${wishTag(ch)}</td><td>${specChips(ch)}</td><td class="num">${ch.age}</td><td>${ovrPill(ch)}</td><td class="num">${postYears(ch)}</td><td></td></tr></tbody></table></div></section>
  ${callPanel()}
  <section class="panel"><div class="ph"><h2>Elite Four</h2><span class="muted">Faced in this order</span></div><div class="scroll"><table class="tbl">${head}<tbody>${S.e4.map((id, k) => staffRow(T(id), `Elite Four #${k + 1}`, `Lv ${E4_LV[k]} · ${E4_SIZE} Pokémon`)).join('')}</tbody></table></div></section>
  <section class="panel"><div class="ph"><h2>Gyms</h2><span class="muted">A gym's type is its leader's class; gym trainers share a type with the leader</span></div><div class="scroll"><table class="tbl">${head}<tbody>${gymRows}</tbody></table></div></section>`;
}
// ---------- steers and the meta (0.12.0) ----------
// a steer picker for a post ('line' for the League line); a post's own list starts with "follow the League line"
function steerSelect(key, label) {
  const st = steerState(), cur = key === 'line' ? st.line : st.posts[key] || '';
  const opts = (key === 'line' ? [] : [['', `League line (${steerName(st.line)})`]]).concat(STEER_KEYS.map(k => [k, STEERS[k][0]]));
  return `<select class="steersel" data-k="${key}" aria-label="Steer for ${esc(label)}">${opts.map(([v, l]) => `<option value="${v}"${v === cur ? ' selected' : ''}>${esc(l)}</option>`).join('')}</select>`;
}
// the senior posts of the bound League, with their keys
function steerPosts() {
  return [{ key: 'champion', label: 'Champion', t: T(S.champion) }].concat(S.e4.map((id, k) => ({ key: 'e4:' + k, label: `Elite Four #${k + 1}`, t: T(id) })), S.gyms.map((g, i) => ({ key: 'gym:' + i, label: `Gym ${i + 1} · ${townName(i)}`, t: T(g.leader) })));
}
const followText = t => { const f = Math.round(steerFollow(t) * 100); return `${f}%`; };
function onTypeTag(t, s) { return answersOnType(t, s) ? '<span class="tag gold small">on type</span>' : specTypes(t).length ? '<span class="tag small" title="Countering, they may field one Pokémon off their type">one off-type</span>' : ''; }
function steersPanel() {
  const own = playerLeague();
  return `<section class="panel"><div class="ph"><h2>Steers</h2><span class="muted">How each post's team is built; change them any week</span></div>
    <p class="small">A steer belongs to the post, so a new holder follows it too. The <b>League line</b> applies wherever a post has no steer of its own; gym trainers follow their gym's. Everyone follows a steer, as closely as their Strategy allows (the Follows column). A team moves one Pokémon closer each month; someone new to a post builds to it at once. <b>Counter the trend</b> answers the circuit's top performers of the last 12 weeks, <b>Counter the year's meta</b> those of last year and this year so far (see the <button class="tlink" data-act="nav" data-v="meta">Meta</button> page). A countering trainer whose type has no answer may field one Pokémon off their type.</p>
    <div class="confirm-row"><label class="small"><b>League line</b> ${own ? steerSelect('line', 'League line') : steerName(steerState().line)}</label></div>
    <div class="scroll"><table class="tbl"><thead><tr><th>Post</th><th>Holder</th><th>Steer</th><th>Follows</th><th>Answers</th></tr></thead><tbody>
    ${steerPosts().map(p => `<tr><td><b>${p.label}</b></td><td>${p.t ? tname(p.t.id) + ' ' + specChips(p.t) : '—'}</td><td>${own ? steerSelect(p.key, p.label) : steerName(steerAt(p.key))}</td><td class="num">${p.t ? followText(p.t) : ''}</td><td class="small">${p.t ? `trend ${onTypeTag(p.t, 'trend')} · year ${onTypeTag(p.t, 'year')}` : ''}</td></tr>`).join('')}
    </tbody></table></div></section>`;
}
// the Meta page: the trend and the year, the types that answer them, and which posts can answer them on their type
function viewMeta() {
  const own = playerLeague();
  const reading = (s, title, about, list) => { const c = metaTypes(s);
    return `<section class="panel"><div class="ph"><h2>${title}</h2><span class="muted">${about}</span></div>
      ${list.length ? `<div class="scroll"><table class="tbl"><thead><tr><th>#</th><th>Pokémon</th><th>Type</th></tr></thead><tbody>${list.map((sp, k) => `<tr><td class="num">${k + 1}</td><td>${esc(sp)}</td><td>${chips(SP[sp] ? SP[sp].types : [])}</td></tr>`).join('')}</tbody></table></div>
      <p>Answered best by ${c.length ? chips(c) : 'no type in particular'}. On their own type, ${steerPosts().filter(p => answersOnType(p.t, s)).map(p => p.label).join(', ') || 'none of the senior posts'} can answer it.</p>
      ${own ? `<div class="confirm-row"><button class="btn small" data-act="steerall" data-v="${s}">Set ${steerName(s)} on those posts</button></div>` : ''}` : '<p class="muted">Not enough battles yet: a reading needs a month of the circuit.</p>'}</section>`; };
  return `<section class="panel callout"><div class="eyebrow">${S.lgName}</div><h2>The meta</h2>
    <p>The circuit's top performers: challengers' Pokémon ranked by knockouts per battle, then wins (8 or more battles). It is read at the start of every month${S.metaAt != null ? `, last on ${turnDate(S.metaAt)}` : ''}. The <b>trend</b> is the last 12 weeks and moves quickly; <b>the year</b> is last year plus this year so far and moves slowly. Answer either with a steer on <button class="tlink" data-act="nav" data-v="staff">Your staff</button>${own ? '' : ' (this League steers itself)'}. The sim stops when the trend shifts.</p></section>
    ${reading('trend', 'The trend', 'Last 12 weeks', S.metaTrend || [])}
    ${reading('year', "The year's meta", 'Last year and this year so far', S.metaYear || [])}
    ${banPanel()}
    ${steersPanel()}`;
}
// ---------- money and cities (0.13.0) ----------
// the Money page: the balance, the year's books by heading, salaries with raises, and the ledger
const FIN_NAMES = { bounties: 'Bounties', contenders: 'Contenders\' stipends', founding: 'Founding a League', entry: 'Entry fees', prize: 'Wall prize', attractions: 'Attractions', sanctuary: 'Sanctuaries', salaries: 'Salaries', signing: 'Signing fees', severance: 'Severance', raises: 'Raises', bans: 'Bans', building: 'Buildings', upkeep: 'Upkeep', cities: 'City income', transfers: 'Transfer fees', sales: 'Building sales', ranch: 'Ranch upkeep', ranchbuy: 'Ranch purchases', ranchsale: 'Ranch sales', trips: 'Catching trips', showcase: 'Showcase' };
function finTable(y) {
  if (!y) return '<p class="muted">Nothing yet.</p>';
  const row = (o, sign) => Object.entries(o).sort((a, b) => b[1] - a[1]).map(([k, v]) => `<tr><td>${FIN_NAMES[k] || k}</td><td class="num">${sign}${money(v)}</td></tr>`).join('');
  const tin = Object.values(y.in).reduce((a, b) => a + b, 0), tout = Object.values(y.out).reduce((a, b) => a + b, 0);
  return `<div class="scroll"><table class="tbl"><tbody><tr><th colspan="2">In</th></tr>${row(y.in, '+') || '<tr><td colspan="2" class="muted">—</td></tr>'}<tr><th colspan="2">Out</th></tr>${row(y.out, '−') || '<tr><td colspan="2" class="muted">—</td></tr>'}<tr><td><b>Net</b></td><td class="num"><b>${money(tin - tout)}</b></td></tr></tbody></table></div>`;
}
function viewMoney() { return inLeague(ME(), viewMoney0); }
function viewMoney0() {
  if (!booksOn()) return '<section class="panel"><p class="muted">Only a League you staff by hand keeps books.</p></section>';
  const f = S.fin, staff = staffIds().map(T).filter(Boolean), w = wageBill();
  return `<section class="panel callout"><div class="eyebrow">${S.lgName}</div><h2>Money: ${money(f.money)}</h2>
    <p>Your wage bill is <b>${money(w)}</b> a week (${money(w * YEAR_WEEKS)} a year). Money comes in from an entry fee of ${money(ENTRY_FEE)} for every run begun on your circuit, a wall prize at New Year (${money(WALL_PRIZE)}, less ${money(WALL_PRIZE_LOSS)} for every trainer let through), your share of your gym cities' income, and the attractions you build on the <button class="tlink" data-act="nav" data-v="cities">Cities</button> page. It goes on salaries (the post and the trainer's OVR, reviewed each New Year; famous trainers and title winners ask more), signing fees (${12} weeks' pay for anyone who joins your staff from outside), severance (${12} weeks' pay for anyone you let go), raises, bans, buildings and their upkeep. ${f.money < 0 ? '<b>You are in the red:</b> salaries are still paid, but you can\'t hire from outside, ban, build or give raises until you are back above zero.' : 'Salaries are paid even if you go into the red, but then you can\'t spend until you are back above zero.'}</p></section>
  <div class="grid-office"><section class="panel"><div class="ph"><h2>Year ${f.yr ? f.yr.season : S.season} so far</h2></div>${finTable(f.yr)}</section>
  <section class="panel"><div class="ph"><h2>Last year</h2></div>${finTable(f.last)}</section></div>
  <section class="panel"><div class="ph"><h2>Salaries</h2><span class="muted">A week. A <b>raise</b> keeps a restless member of staff (or one who gave notice over promotion) another year, once per post: ${12} weeks' pay now and a fifth more after.</span></div>
    <div class="scroll"><table class="tbl"><thead><tr><th>Post</th><th>Trainer</th><th>OVR</th><th>Pay</th><th></th></tr></thead><tbody>
    ${staff.map(t => `<tr><td class="small">${postName(t)}</td><td>${tname(t.id)}${wishTag(t)}</td><td>${ovrPill(t)}</td><td class="num">${money(payOf(t))}${t.payMul > 1 ? ' <span class="small muted">(+' + Math.round((t.payMul - 1) * 100) + '%)</span>' : ''}</td><td>${canRaise(t) ? `<button class="btn small" data-act="raise" data-id="${t.id}"${canSpend(raiseCost(t)) ? '' : ' disabled'}>Raise (${money(raiseCost(t))})</button>` : ''}</td></tr>`).join('')}
    </tbody></table></div></section>
  ${leavePanel()}
  <section class="panel"><div class="ph"><h2>Ledger</h2><span class="muted">Everything but the weekly salaries, entry fees and attractions</span></div>
    ${f.log.length ? `<div class="scroll"><table class="tbl"><tbody>${f.log.map(x => `<tr><td class="small muted">${turnDate(x.turn)}</td><td>${esc(x.text)}</td><td class="num">${x.amt >= 0 ? '+' : ''}${money(x.amt)}</td></tr>`).join('')}</tbody></table></div>` : '<p class="muted">Nothing yet.</p>'}</section>`;
}
// (0.15.0, stage 4) the League table: every League's money first (balance is economic), the wall beside it
function leagueRow(i) {
  return inLeague(i, () => {
    const f = S.fin, last = f && f.last, sum = o => o ? Object.values(o).reduce((a, b) => a + b, 0) : 0, m = gymMap();
    const h = S.history.filter(x => x.titles != null), lh = h[h.length - 1];
    return { i, name: S.lgName, aim: f ? (f.aim ? AIMS[f.aim].name : 'Yours') : '—', money: f ? f.money : null, estate: f ? estateCost() : null, inc: last ? sum(last.in) : null, out: last ? sum(last.out) : null,
      wage: f ? wageBill() : null, ctrl: S.gyms.filter(g => { const c = S.cities[g.city]; return c.ctrl === i && c.tier >= 2; }).length, strong: S.gyms.filter(g => strongholdOf(S.cities[g.city], i)).length, shared: S.gyms.filter(g => (m[g.city] || []).length > 1).length,
      let: lh ? lh.titles : null, perfect: h.filter(x => !x.titles).length, years: h.length, founder: S.founder ? T(S.founder) : null, old: (S.oldNames || []).map(x => x.name), prest: Math.round(S.prest || 0), spon: contendersOf(i).length,
      field: S.challengers.length, share: fieldShare(i), rebuild: !!(f && f.rebuild) };
  });
}
// (0.33.0) renaming from the League table: your League any time, a rival with Rename rival Leagues on
let lgRenameAt = null, lgRenameText = '', lgRenameMsg = '';
function lgNameCell(r) {
  const fy = r.founder && r.founder.founded && r.founder.founded.lg === r.i ? `, Year ${r.founder.founded.season}` : '';
  const sub = (r.founder ? `<div class="small muted">Founded by ${tname(r.founder.id)}${fy}</div>` : '') + (r.old.length ? `<div class="small muted">Formerly the ${r.old.slice().reverse().map(esc).join(', the ')}</div>` : '');
  if (lgRenameAt === r.i) return `<label class="cf-field"><input class="cf-in" id="lgrenamein" maxlength="${LG_NAME_MAX}" value="${esc(lgRenameText)}" autocomplete="off" aria-label="New name"></label><div class="confirm-row"><button class="btn small primary" data-act="lgrenamego" data-i="${r.i}">Rename</button><button class="btn small" data-act="lgrenamecancel">Cancel</button></div>${lgRenameMsg ? `<div class="small bad">${esc(lgRenameMsg)}</div>` : ''}${sub}`;
  return `<b>${esc(r.name)}</b>${handOn() && canRename(r.i) ? ` <button class="btn small" data-act="lgrename" data-i="${r.i}">Rename</button>` : ''}${sub}`;
}
function viewTable() {
  const rows = Array.from({ length: nLeagues() }, (_, i) => leagueRow(i)).sort((a, b) => (b.money ?? -1e12) - (a.money ?? -1e12));
  const avg = rows.filter(r => r.money != null), am = avg.length ? avg.reduce((a, r) => a + r.money, 0) / avg.length : 0;
  return `<section class="panel callout"><div class="eyebrow">${nLeagues()} Leagues</div><h2>League table</h2>
    <p>Ranked by money: success earns money, and money buys more ways to succeed. The world's average is <b>${money(am)}</b>. Built is what the League owns in cities and at its seat, at cost. Income and spending are last year's; cities count those where the League has a gym and Holds it or better, with how many are Strongholds (shared cities in brackets). Trainers let through are last year's. Challengers counts those taking the League on now or last, with its share of its region's field; a rival drawing well under an even share rebuilds.</p></section>
  <section class="panel"><div class="scroll"><table class="tbl"><thead><tr><th>League</th><th>Aim</th><th>Money</th><th>Built</th><th>Income</th><th>Spending</th><th>Wages/wk</th><th>Cities</th><th>Let through</th><th>Perfect years</th><th title="Earned each New Year, fading a tenth a year">Prestige</th><th title="Challengers taking it on now or last, and its share of the region's field">Challengers</th><th>Contenders</th></tr></thead><tbody>
    ${rows.map(r => `<tr${r.i === ME() && handOn() ? ' class="me"' : ''}><td>${lgNameCell(r)}</td><td class="small">${r.aim}${r.rebuild ? ' <span class="tag notice">Rebuilding</span>' : ''}</td><td class="num">${r.money == null ? '—' : money(r.money)}</td><td class="num">${r.estate == null ? '—' : money(r.estate)}</td><td class="num">${r.inc == null ? '—' : money(r.inc)}</td><td class="num">${r.out == null ? '—' : money(r.out)}</td><td class="num">${r.wage == null ? '—' : money(r.wage)}</td><td class="num">${r.ctrl} of 8${r.strong ? ` <span class="small muted">${r.strong} strong</span>` : ''}${r.shared ? ` <span class="small muted">(${r.shared} shared)</span>` : ''}</td><td class="num">${r.let ?? '—'}</td><td class="num">${r.perfect} of ${r.years}</td><td class="num">${r.prest}</td><td class="num">${r.field} <span class="small muted">${Math.round(r.share * 100)}%</span></td><td class="num">${r.spon}</td></tr>`).join('')}
  </tbody></table></div></section>`;
}
// ---------- contenders (0.17.0, stage 5) ----------
// Your League's sponsored contenders: who is out, where, how they are doing and what they have earned; who you could
// send; and the contenders other Leagues have sent at you.
let sendTo = null;
function viewContenders() { return inLeague(ME(), viewContenders0); }
function viewContenders0() {
  const mine = contendersOf(ME()), at = contendersAt(ME()), targets = sponTargets(), cands = sendCands().slice(0, 30);
  if (sendTo == null || !targets.includes(sendTo)) sendTo = targets[0] ?? null;
  const row = t => { const x = t.spon;
    return `<tr><td>${tname(t.id)}${ownAcademy(t) ? ' <span class="tag small">Academy</span>' : ''}</td><td>${ovrPill(t)}</td><td class="small">${esc(leagueName(x.to))}${x.pending === 'send' ? ' <span class="muted">(after their run)</span>' : x.pending === 'home' ? ' <span class="muted">(coming home after their run)</span>' : ''}</td><td class="small">${turnDate(x.until)}</td><td class="num">${x.runs}</td><td class="small">${x.best ? depthName(x.best) : '—'}</td><td class="num">${x.e4}</td><td class="num">${x.titles}</td><td class="num">${money(x.earned)}</td><td class="num">${money(x.paid)}</td>
      <td>${x.pending ? '' : `<button class="btn small" data-act="recallcon" data-id="${t.id}">Recall</button>`}${canRenew(t) ? ` <button class="btn small primary" data-act="renewcon" data-id="${t.id}">Renew</button>` : ''}</td></tr>`; };
  return `<section class="panel callout"><div class="eyebrow">${S.lgName}</div><h2>Contenders</h2>
    <p>Send challengers at another League as your contenders: your own academy prospects (who always agree), or anyone on your circuit you sign (who can turn it down). A contender runs only at that League for ${SPON_YEARS} years, and nobody else can hire them meanwhile. You pay a weekly stipend; the League you send them at still gets their entry fees, and pays you a bounty of ${money(SPON_BOUNTY)} for each title they win there (${money(SPON_E4_BOUNTY)} for a run that reaches the Elite Four). Recall them, renew them in their last ${Math.round(SPON_RENEW_WEEKS / 4)} months, or hire them back like anyone on another circuit. At most ${SPON_MAX} at once.</p></section>
  <section class="panel"><div class="ph"><h2>Your contenders</h2><span class="muted">${mine.length} of ${SPON_MAX}</span></div>
    ${mine.length ? `<div class="scroll"><table class="tbl"><thead><tr><th>Trainer</th><th>OVR</th><th>Against</th><th>Until</th><th>Runs</th><th>Best</th><th>Elite Four</th><th>Titles</th><th>Earned</th><th>Stipends</th><th></th></tr></thead><tbody>${mine.map(row).join('')}</tbody></table></div>` : '<p class="muted">None out.</p>'}</section>
  <section class="panel"><div class="ph"><h2>Send a contender</h2>${targets.length ? `<span class="muted">Against <select class="sendtosel">${targets.map(i => `<option value="${i}"${i === sendTo ? ' selected' : ''}>${esc(leagueName(i))}</option>`).join('')}</select></span>` : ''}</div>
    ${!targets.length ? '<p class="muted">There is no other League to send at yet.</p>' : `<div class="scroll"><table class="tbl"><thead><tr><th>Trainer</th><th>Age</th><th>OVR</th><th>Now</th><th>Stipend</th><th></th></tr></thead><tbody>${cands.map(t => `<tr><td>${tname(t.id)}${ownAcademy(t) ? ' <span class="tag small">Academy</span>' : ''}${hireTags(t)}</td><td class="num">${t.age}</td><td>${ovrPill(t)}</td><td class="small">${t.rest == null ? `out on a run (${t.badges.length} badges): goes after it` : 'resting: goes at once'}</td><td class="num">${money(sponStipend(t))}/wk</td><td>${!canOffer(t) ? '<span class="small muted">turned you down lately</span>' : `<button class="btn small" data-act="sendcon" data-id="${t.id}"${mine.length >= SPON_MAX || (S.fin && S.fin.money < 0) ? ' disabled' : ''}>Send</button>`}</td></tr>`).join('')}</tbody></table></div>`}</section>
  <section class="panel"><div class="ph"><h2>Sent at you</h2><span class="muted">${at.length} contender${at.length === 1 ? '' : 's'} of other Leagues on your circuit</span></div>
    ${at.length ? `<div class="scroll"><table class="tbl"><thead><tr><th>Trainer</th><th>OVR</th><th>From</th><th>Until</th><th>Runs</th><th>Best</th><th>Titles</th></tr></thead><tbody>${at.map(t => `<tr><td>${tname(t.id)}</td><td>${ovrPill(t)}</td><td class="small">${esc(leagueName(t.spon.lg))}</td><td class="small">${turnDate(t.spon.until)}</td><td class="num">${t.spon.runs}</td><td class="small">${t.spon.best ? depthName(t.spon.best) : '—'}</td><td class="num">${t.spon.titles}</td></tr>`).join('')}</tbody></table></div>` : '<p class="muted">None.</p>'}</section>`;
}
// leaving your League to found your own (on the Money page)
let leaveAsk = false, leaveRegion = null, leaveTake = new Set();
function leavePanel() {
  if (!handOn()) return '';
  const c = leaveCheck(), takers = leaveTakers();
  if (leaveRegion == null || !c.regions.includes(leaveRegion)) leaveRegion = c.regions[0] ?? null;
  return `<section class="panel"><div class="ph"><h2>Found a League of your own</h2><span class="muted">Prestige ${c.prest} of ${PRESTIGE_BAR} · ${money(LEAVE_FEE)}</span></div>
    <p class="small">You can leave the ${S.lgName} to found a new League. It costs ${money(LEAVE_FEE)} from the ${S.lgName}'s money, which must stay at or above zero, and the ${S.lgName}'s prestige must reach ${PRESTIGE_BAR} (earned each New Year from perfect years, letting through fewer than the world's average, World Championships, cities controlled and its rank by wealth, fading a tenth a year). The ${S.lgName} carries on as a rival with an aim of its own. Up to ${LEAVE_TAKE} members of staff who want promotion come with you (not the Champion), and your academy prospects on its circuit follow. You found the new League by hand, with ${money(START_FUND)} to start.</p>
    ${c.ok ? `<div class="confirm-row"><span class="small">Region <select class="leaveregsel">${c.regions.map(r => `<option value="${r}"${r === leaveRegion ? ' selected' : ''}>${esc(regionWord(r))}${regionsUsed().includes(r) ? ' (shared)' : ''}</option>`).join('')}</select></span></div>
    <div class="scroll"><table class="tbl"><thead><tr><th>Bring</th><th>Trainer</th><th>Post</th><th>OVR</th></tr></thead><tbody>${takers.map(x => `<tr><td>${x.willing ? `<input type="checkbox" class="leavetake" data-id="${x.t.id}"${leaveTake.has(x.t.id) ? ' checked' : ''}${!leaveTake.has(x.t.id) && leaveTake.size >= LEAVE_TAKE ? ' disabled' : ''}>` : '<span class="small muted">would stay</span>'}</td><td>${tname(x.t.id)}</td><td class="small">${esc(x.post)}</td><td>${ovrPill(x.t)}</td></tr>`).join('')}</tbody></table></div>
    <div class="confirm-row">${leaveAsk ? `<button class="btn primary" data-act="leavego">Leave the ${esc(S.lgName)} and found a League in ${esc(regionWord(leaveRegion))}</button> <button class="btn ghost" data-act="leaveask">Not now</button>` : '<button class="btn" data-act="leaveask">Found a League of your own…</button>'}</div>` : `<p class="muted small">${esc(c.why)}</p>`}</section>`;
}
// the Cities page: the seat, the gym cities and the cities with no gym of yours
function viewCities() { return inLeague(ME(), viewCities0); }
function viewCities0() {
  if (!booksOn()) return '<section class="panel"><p class="muted">Only a League you staff by hand builds in cities.</p></section>';
  const places = myPlaces(), gm = gymMap(), gymOpts = S.gyms.map((g, i) => `<option value="${i}">Gym ${i + 1} · ${townName(i)}</option>`).join('');
  const card = p => {
    const where = p.seat ? 'seat' : p.gym;
    // (0.18.0) any level can be sold for half its price; in the red everything lapses
    const built = p.b.map(x => `<li><b>${UPGRADES[x.k].name}</b> level ${x.lv} of ${upMax(x.k)}${UPGRADES[x.k].slotless ? ' <span class="small muted">(no slot)</span>' : ''}${lapsed() ? ' <span class="tag notice small">lapsed</span>' : ''}${p.none ? '' : ` <button class="btn small ghost" data-act="sellb" data-w="${where}" data-k="${x.k}" title="Sell the top level for half what it cost. Standing here drops by what it added.">Sell a level (+${money(sellValue(where, x.k))})</button>`}</li>`).join('');
    // (0.15.0) standing and control where Leagues share the city, and this League's share of its income
    const lgs = p.c ? gm[p.c.id] || [] : [], ctrl = p.c ? cityCtrl(p.c, lgs) : null;
    // (0.20.0) a legendary site: a Sanctuary can be built here while it lasts
    // (0.37.0) no timer: a Sanctuary is open while one of the site's legendaries is with your League
    const sLv = p.c && !p.none ? upLevel(p.b, 'sanct') : 0;
    const site = p.c && siteOn(p.c) ? `<p class="small"><span class="tag">Legendary site</span> Found here: ${(p.c.site.sps || [p.c.site.sp]).map(esc).join(', ')}. A Sanctuary here is open while one of them is with your League (held by your staff, by a challenger on your circuit, or stored in its vault)${p.none ? '; you need a gym here to build one' : ''}.${sLv ? ` Yours is <b>${sanctOpen(p.c) ? 'open' : 'sealed'}</b>${sanctOpen(p.c) ? '' : ': no income, upkeep or prestige until one comes back'}. Storing legendaries: the <button class="tlink" data-act="nav" data-v="ranch">Ranch</button> page.` : ''}</p>` : '';
    // (0.40.0) control by tier, standing, renown from Leagues with no gym here, and the share of the city's income
    const cs = p.c ? cityState(p.c, lgs) : null;
    const rnTxt = cs && cs.rn.length ? ` Renown here: ${cs.rn.map(x => `${lgShort(x.lg)} ${renown(p.c, x.lg)} (counts ${Math.round(x.eff * 10) / 10})`).join(', ')}${cs.slice ? `, taking ${Math.round(cs.slice * 100)}% of its income` : ''}.` : '';
    const heroes = p.c && !p.none ? staffIds().map(T).filter(t => t && homeCity(t) === p.c.id) : [];
    const heroTxt = heroes.length ? ` Local heroes: ${heroes.map(t => tname(t.id)).join(', ')}.` : '';
    const share = p.c && lgs.includes(ME()) ? `<p class="small"><span class="tag${cs.ctrl === ME() && cs.tier >= 2 ? '' : ' notice'}">${TIER_NAMES[cs.tier]}</span> ${lgs.length > 1 || cs.rn.length ? `${lgs.length > 1 ? `Shared with the ${lgs.filter(i => i !== ME()).map(leagueName).join(' and the ')}. ` : ''}Standing: ${lgs.map(i => `${lgShort(i)} ${standing(p.c, i)}`).join(', ')}. ${cs.tier ? `Controlled by the <b>${leagueName(ctrl)}</b>. ` : 'No League has the lead to control it. '}` : 'Yours alone. '}${rnTxt}${heroTxt} Your share of its income: <b>${money(cityShare(p.c, lgs, ME()))}</b> a week (of ${money(CITY_INCOME[p.slots - 1])}).</p>`
      : p.c && lgs.length ? `<p class="small muted">Gyms here: the ${lgs.map(leagueName).join(' and the ')} (${TIER_NAMES[cs.tier]}${cs.tier ? ` for the ${leagueName(cs.ctrl)}` : ''}).${rnTxt}${renown(p.c, ME()) ? ` Your renown: ${renown(p.c, ME())}, earning ${money(cityShare(p.c, lgs, ME()))} a week.` : ''}</p>` : '';
    const acts = p.none ? `<div class="confirm-row"><select id="move-${p.c.id}" aria-label="Gym to move">${gymOpts}</select><button class="btn small" data-act="movegym" data-c="${p.c.id}"${canSpend(MOVE_FEE) ? '' : ' disabled'}>Move it here (${money(MOVE_FEE)})</button></div>`
      : `<div class="confirm-row">${Object.keys(UPGRADES).map(k => { const ck = buildCheck(where, k); if (ck.why) return ''; return `<button class="btn small" data-act="build" data-w="${where}" data-k="${k}"${canSpend(ck.cost) ? '' : ' disabled'} title="${esc(UPGRADES[k].text)}${ck.restore ? ` Restoring a level you lost here in the red costs ${Math.round(RESTORE_SHARE * 100)}% of its price.` : ''}">${ck.restore ? `Restore ${UPGRADES[k].name.toLowerCase()}${ck.lv > 1 ? ` to level ${ck.lv}` : ''}` : ck.lv > 1 ? `${UPGRADES[k].name} to level ${ck.lv}` : `Build ${UPGRADES[k].name.toLowerCase()}`} (${money(ck.cost)})</button>`; }).join('')}</div>`;
    return `<section class="panel"><div class="ph"><h2>${esc(p.name)}</h2><span class="muted">${p.seat ? 'League seat: the Elite Four and the Champion' : p.none ? 'No gym of yours' : `Gym ${p.gym + 1}${T(S.gyms[p.gym].leader) ? ' · ' + typeLabel(T(S.gyms[p.gym].leader)) : ''}`} · ${slotsUsed(p.b)} of ${p.slots} slot${p.slots === 1 ? '' : 's'} used${p.c ? ` · ${money(Object.values(p.c.spent || {}).reduce((a, b) => a + b, 0))} spent here` : ''}</span></div>
      ${site}${share}${built ? `<ul>${built}</ul>` : ''}${acts}</section>`;
  };
  const red = lapsed() ? `<p class="warn">The ${S.lgName} is in the red: upkeep is going unpaid, so every building has lapsed (attractions earn nothing; halls, features, the scouting office and the academy do nothing). Every ${DECAY_WEEKS} weeks unpaid, your costliest building loses a level${S.fin.unpaid ? ` (next in ${DECAY_WEEKS - S.fin.unpaid % DECAY_WEEKS} weeks)` : ''}; in a shared city a rival may buy it at a distress price. In the red at ${FOLD_YEARS} New Years running, with debts your buildings can't cover, the League folds.</p>` : '';
  return `<section class="panel callout"><div class="eyebrow">${S.lgName} · ${money(S.fin.money)}</div><h2>Cities</h2>${red}
    <p>Build in your gym cities and at your League's seat. A city starts with one slot and gets a second once ${money(60000)} has been spent there and a third at ${money(180000)}; the seat has three. Each upgrade has three levels (${money(UP_COST[0])}, ${money(UP_COST[1])}, ${money(UP_COST[2])}); training halls and gym features go on to level 5 (${money(UP_COST[3])}, ${money(UP_COST[4])}), and the youth academy costs ${UPGRADES.academy.cost.map(money).join(', ')}. Everything you own costs upkeep of ${Math.round(UPKEEP * 100)}% of its price a year (now <b>${money(upkeepWeek())}</b> a week). ${Object.values(UPGRADES).map(u => `<b>${u.name}:</b> ${u.text}`).join(' ')} Your League can only build where it has a gym; you can move a gym to a city of the region where you have none, but everything you built in the old city is lost. Any building level can be sold for half what it cost; a level you lose while in the red (sold, or to unpaid upkeep) can be restored for ${Math.round(RESTORE_SHARE * 100)}% of its price. A city where a legendary was found becomes a <b>legendary site</b>: a League with a gym there can build a <b>Sanctuary</b>, which earns more than an attraction and adds prestige while it is open (one of the site's legendaries is with your League) and is sealed, costing and earning nothing, while none is.</p></section>
    ${distressPanel()}${places.map(card).join('')}`;
}
// ---------- the ranch (0.25.0, design doc 6.5) ----------
// Your League's pool of Pokémon: who fields what, the pool with reserves, locks and sales, catching trips and the market
let ranchType = 'Normal', ranchSp = null, charterReg = null, ranchCond = '';
// (0.36.0) a condition's tag on the Ranch page
const condTag = c => condKeys(c).map(k => ` <span class="tag ${k} small"${k === 'delta' ? ` title="An unusual ${esc(c.delta)} type"` : ''}>${k === 'delta' ? 'Δ Delta' : k === 'shiny' ? '✦ Shiny' : k === 'radiant' ? '✧ Radiant' : 'Alpha'}</span>`).join('');
function ranchPostOpts() {
  return [['champion', 'Champion']].concat(S.e4.map((_, k) => [`e4:${k}`, `Elite Four #${k + 1}`]), S.gyms.map((_, i) => [`gym:${i}`, `Gym ${i + 1} · ${townName(i)}`]));
}
function viewRanch() { return inLeague(ME(), viewRanch0); }
function viewRanch0() {
  if (!ranchOn()) return '<section class="panel"><p class="muted">Only a League that keeps books has a ranch.</p></section>';
  ranchSync();
  const R = S.ranch, sen = seniorIds().map(T), stops = stopPosts(), posts = ranchPostOpts(), sc = ranchScout();
  const holder = id => { const t = T(id); return t ? `${tname(id)} <span class="small muted">${esc(postName(t))}</span>` : '—'; };
  const monTag = m => m.stop ? '<span class="tag notice small">stopgap</span>' : m.backup ? '<span class="tag small">backup type</span>' : m.rid != null ? '<span class="tag small">ranch</span>' : '<span class="tag small">own</span>';
  const bkLine = t => { const b = t.role === 'champion' ? [] : backupTypes(t); return b.length ? `<br><span class="muted">backups</span> ${chips(b)}` : ''; };
  const backs = sen.filter(t => t.team.some(m => m.backup));
  const teams = sen.map(t => `<tr><td class="small">${esc(postName(t))}${bkLine(t)}</td><td>${tname(t.id)}</td><td class="small">${t.team.map(m => `${esc(m.sp)}${condTag(condOf(m))} <span class="muted">${gradeStars(monGrade(m))}</span> ${monTag(m)}`).join('<br>')}</td></tr>`).join('');
  const pool = R.mons.slice().sort((a, b) => (a.at == null) - (b.at == null) || entryValue(b) - entryValue(a));
  const row = e => {
    const free = e.at == null, v = entryValue(e);
    const res = `<select class="ranchressel" data-id="${e.uid}" aria-label="Reserve for a post"><option value="">Anyone</option>${posts.map(([k, n]) => `<option value="${k}"${e.res === k ? ' selected' : ''}>${esc(n)}</option>`).join('')}</select>`;
    const acts = [`<button class="btn small ghost" data-act="ranchlock" data-id="${e.uid}">${e.lock ? 'Unlock' : 'Lock'}</button>`];
    // (0.26.0) fielded ones can be sold, released or listed too: the holder swaps them out at once (said beside the buttons)
    if (!e.sale) acts.push(`<button class="btn small ghost" data-act="ranchsell" data-id="${e.uid}">Sell (+${money(Math.round(v * SELL_BACK))})</button>`, `<button class="btn small ghost" data-act="ranchrel" data-id="${e.uid}">Release</button>`);
    if (nLeagues() > 1) acts.push(e.sale ? `<button class="btn small ghost" data-act="ranchunlist" data-id="${e.uid}">Withdraw (${money(e.sale.price)})</button>` : `<button class="btn small ghost" data-act="ranchlist" data-id="${e.uid}">List for ${money(v)}</button>`);
    return `<tr><td>${esc(e.sp)}${condTag(e.c)}${e.sp !== e.b ? ` <span class="small muted">(${esc(e.b)} line)</span>` : ''}</td><td>${chips(entryTypes(e, e.sp))}</td><td class="small">${gradeStars(e.g)}</td><td class="num">${money(v)}</td><td class="small">${e.at != null ? holder(e.at) : e.sale ? '<span class="tag small">listed</span>' : e.lock ? '<span class="tag small">locked</span>' : 'in the ranch'}${e.of != null && T(e.of) ? `<br><span class="muted">from ${esc(T(e.of).name)}</span>` : ''}</td><td>${res}</td><td>${acts.join(' ')}${free ? '' : `<br><span class="small muted">Fielded by ${esc(T(e.at).name)}: selling, releasing or listing it swaps it out now for the best left in the ranch (or a stopgap). Lock it to take it back at the next monthly swap instead.</span>`}</td></tr>`;
  };
  // catching trips (0.27.0: only lines the League can reach, marked by where they come from)
  const srcTag = b => { const w = lineSource(b); return w === 'migrating' ? ', migrating' : w === 'lane' ? ', by lane' : w === 'safari' ? ', safari' : ''; };
  if (ranchCond && !featOn(ranchCond)) ranchCond = '';
  const species = ranchSpecies().filter(b => { const f = SP[b].types; return (f.includes(ranchType) || SP[formAt(b, 100)].types.includes(ranchType)) && (ranchCond ? huntOk(b, ranchCond) : tripOk(b)); }).sort();
  if (!species.includes(ranchSp)) ranchSp = species[0] || null;
  const plan = ranchSp ? (ranchCond ? huntPlan(ranchSp, ranchCond) : tripPlan(ranchSp)) : null, full = R.trips.length >= tripMax(), ob = obTrip(), dset = deltaSet(), show = showcase();
  const trips = R.trips.map(x => `<li>${x.k === 'target' ? `For <b>${x.cond ? COND_NAME[x.cond] + ' ' : ''}${esc(x.b)}</b> (${Math.round(x.odds * 100)}% odds${x.safari ? ', the safari' : ''})` : x.k === 'outbreak' ? `To the <b>${esc(x.b)}</b> outbreak` : x.k === 'charter' ? `A charter from ${esc(regionName(x.r))}` : 'An area trip'}: back ${turnDate(x.due)} <span class="muted small">(${money(x.cost)})</span></li>`).join('');
  const shop = R.shop.map(x => `<tr><td>${esc(x.b)}${condTag(x.c)}${srcTag(x.b) ? ` <span class="tag small">${srcTag(x.b).slice(2)}</span>` : ''}</td><td>${chips(entryTypes(x, x.b))}</td><td class="small">${gradeStars(x.g)}</td><td class="num">${money(x.price)}</td><td class="small muted">until ${turnDate(x.until)}</td><td><button class="btn small" data-act="ranchbuy" data-id="${x.uid}"${canSpend(x.price) && ranchRoom() > 0 ? '' : ' disabled'}>Buy</button></td></tr>`).join('');
  const others = listings(S.lg || 0).map(({ lg, e }) => `<tr><td>${esc(e.sp)}${condTag(e.c)}</td><td>${chips(entryTypes(e, e.sp))}</td><td class="small">${gradeStars(e.g)}</td><td class="num">${money(e.sale.price)}</td><td class="small">${esc(leagueName(lg))}</td><td><button class="btn small" data-act="ranchlbuy" data-lg="${lg}" data-id="${e.uid}"${canSpend(e.sale.price) && ranchRoom() > 0 ? '' : ' disabled'}>Buy</button></td></tr>`).join('');
  return `<section class="panel callout"><div class="eyebrow">${S.lgName} · ${money(S.fin.money)}</div><h2>Ranch</h2>
    <p>Your Gym Leaders, Elite Four and Champion field their own Pokémon plus Pokémon from the League's ranch; gym trainers keep their own. Each month a member of staff swaps one Pokémon for a better one from the ranch, by their steer and as well as their Strategy lets them; one they drop goes into the ranch (it is theirs to take back while they stay), and a ranch Pokémon they hold leaves with them if they go. A ranch Pokémon is fielded by one post at a time and takes the form its line has at that post's level. Its grade (1 to 5 stars) comes from its IVs; better grades cost more. <b>Reserve</b> one for a post (only that post fields it, first) or <b>lock</b> it away (nobody does); a holder gives it back at the next swap.</p>
    <p>The ranch holds <b>${R.mons.length} of ${ranchCap()}</b> (a Ranch building at the seat holds more; build it on the <button class="tlink" data-act="nav" data-v="cities">Cities</button> page). Upkeep: <b>${money(ranchUpkeep())}</b> a week (${RANCH_UPKEEP.map(money).join(', ')} a Pokémon by grade). Your Scouting for finds: <b>${sc}</b> (your best senior member's, plus ${RANCH_SCOUT_OFFICE} a scouting office level).</p>
    ${stops.length ? `<p class="warn">Fielding stopgaps (weak stand-ins, because nothing in the ranch fits): ${stops.map(t => `${esc(postName(t))} (${t.team.filter(m => m.stop).length})`).join(', ')}. Catch or buy Pokémon of their type.</p>` : ''}
    ${backs.length ? `<p class="small">Filling with backup types (Pokémon of a trainer's three backup types, used only where the ranch has none of their own type left): ${backs.map(t => `${esc(postName(t))} (${t.team.filter(m => m.backup).length})`).join(', ')}. They swap one back as soon as the ranch has one of their type.</p>` : ''}</section>
${planGapNote()}${storagePanel()}${vaultPanel()}${regionPanel()}
  <section class="panel"><div class="ph"><h2>Who fields what</h2><span class="muted">Own: the trainer's own; ranch: from the ranch; backup type: from the ranch, of one of their backup types; stopgap: a weak stand-in</span></div>
    <div class="scroll"><table class="tbl"><thead><tr><th>Post</th><th>Trainer</th><th>Team</th></tr></thead><tbody>${teams}</tbody></table></div></section>
  <section class="panel"><div class="ph"><h2>The pool</h2><span class="muted">${R.mons.length} of ${ranchCap()} · ${R.mons.filter(e => e.at == null).length} not fielded. Sell back for a third of the value or release for nothing (a fielded one is swapped out at once)${nLeagues() > 1 ? `, or list for other Leagues at its value (you get ${Math.round(SALE_SHARE * 100)}%, for up to ${SALE_WEEKS / 4} months)` : ''}.</span></div>
    ${pool.length ? `<div class="scroll"><table class="tbl"><thead><tr><th>Pokémon</th><th>Type</th><th>Grade</th><th>Value</th><th>Now</th><th>Reserved for</th><th></th></tr></thead><tbody>${pool.map(row).join('')}</tbody></table></div>` : '<p class="muted">Empty.</p>'}</section>
  <section class="panel"><div class="ph"><h2>Catching trips</h2><span class="muted">${R.trips.length} of ${tripMax()} out (one more a scouting office level)</span></div>
    ${trips ? `<ul>${trips}</ul>` : '<p class="muted">None out.</p>'}
    <p class="small">A <b>targeted trip</b> goes after one line and costs more the rarer and stronger it is; your Scouting sets the odds and the grade. An <b>area trip</b> (${money(AREA_COST)}, two weeks) brings back one to three Pokémon at random. A find that comes back to a full ranch is let go. ${homeSet(S.region) ? `Trips catch what ${esc(regionName(S.region))} has, plus any migration, your lanes' regions and your safari (the list shows only those).` : 'Every species can be caught (National Dex rules).'}</p>
    <div class="confirm-row"><select class="ranchtypesel" aria-label="Type">${TYPES.map(ty => `<option${ty === ranchType ? ' selected' : ''}>${ty}</option>`).join('')}</select>
      <select class="ranchcondsel" aria-label="Condition"><option value="">Any (a plain trip)</option>${COND_KINDS.filter(featOn).map(k => `<option value="${k}"${k === ranchCond ? ' selected' : ''}>${COND_NAME[k]} (×${COND_MUL[k]})</option>`).join('')}</select>
      <select class="ranchspsel" aria-label="Pokémon">${species.map(b => `<option value="${esc(b)}"${b === ranchSp ? ' selected' : ''}>${esc(b)} (to ${lineTop(b)} base stats${srcTag(b)}${dset.has(b) ? ', Delta line' : ''})</option>`).join('')}</select>
      ${plan ? `<button class="btn small" data-act="ranchtrip" data-b="${esc(ranchSp)}" data-c="${ranchCond}"${full || !canSpend(plan.cost) ? ' disabled' : ''}>${ranchCond ? `Hunt a ${COND_NAME[ranchCond].toLowerCase()}` : 'Send for'} ${esc(ranchSp)} (${money(plan.cost)}, ${plan.weeks} weeks, ${Math.round(plan.odds * 100)}%)</button>` : ''}
      <button class="btn small" data-act="rancharea"${full || !canSpend(AREA_COST) ? ' disabled' : ''}>Area trip (${money(AREA_COST)})</button>
      ${ob ? `<button class="btn small" data-act="ranchob"${full || !canSpend(OB_TRIP_COST) ? ' disabled' : ''}>Trip to the ${esc(ob.ob.sp)} outbreak (${money(OB_TRIP_COST)}, ${OB_TRIP_WEEKS} weeks)</button>` : ''}</div>
    <p class="small"><b>Alphas, Deltas, shinies and Radiants</b> turn up now and then on any trip, charter or market list, as they do in the wild (an outbreak trip at outbreak odds). A <b>hunt</b> goes after one line in a chosen condition for its multiple of a plain trip's price, at lower odds. A condition multiplies a Pokémon's value the same way. ${esc(regionName(S.region))}'s <b>Delta lines</b> (Deltas likelier here, and huntable even where the plain line isn't found): ${[...dset].sort().map(esc).join(', ')}. Shinies and Radiants your Elite Four and Champion field draw a crowd (${money(SHOW_BIG)} a week each, alphas and Deltas ${money(SHOW_SMALL)}, at most ${money(SHOW_CAP)}; and a little prestige at New Year): now <b>${money(show.income)}</b> a week.</p></section>
  <section class="panel"><div class="ph"><h2>The market</h2><span class="muted">A few Pokémon each week, each for two to four weeks, priced by strength, grade, rarity and your meta</span></div>
    ${shop ? `<div class="scroll"><table class="tbl"><thead><tr><th>Pokémon</th><th>Type</th><th>Grade</th><th>Price</th><th></th><th></th></tr></thead><tbody>${shop}</tbody></table></div>` : '<p class="muted">Nothing this week.</p>'}
    ${nLeagues() > 1 ? `<h3>Other Leagues' sales</h3>${others ? `<div class="scroll"><table class="tbl"><thead><tr><th>Pokémon</th><th>Type</th><th>Grade</th><th>Price</th><th>From</th><th></th></tr></thead><tbody>${others}</tbody></table></div>` : '<p class="muted">Nothing listed.</p>'}` : ''}</section>`;
}
// (0.37.0) new hires' storage: take up to the number shown into the ranch
function storagePanel() {
  const ts = seniorIds().map(T).filter(storePickOk);
  if (!ts.length) return '';
  const one = t => `<h3>${tname(t.id)} <span class="small muted">${esc(postName(t))} · take up to ${t.storePick.n} more by ${turnDate(t.storePick.until)}</span></h3>
    <div class="scroll"><table class="tbl"><thead><tr><th>Pokémon</th><th>Type</th><th>Grade</th><th>Value</th><th></th></tr></thead><tbody>${t.store.map(s => { const b = LINE_BASE[LINE[s.sp]], c = condOf(s), sp = s.top || s.sp; return `<tr><td>${esc(sp)}${condTag(c)}${b && b !== sp ? ` <span class="small muted">(${esc(b)} line)</span>` : ''}</td><td>${chips(c && c.delta ? monTypes({ sp, delta: c.delta }) : SP[sp].types)}</td><td class="small">${gradeStars(monGrade(s))}</td><td class="num">${money(storeValue(s))}</td><td><button class="btn small" data-act="storepick" data-id="${t.id}" data-u="${s.uid}"${ranchRoom() > 0 ? '' : ' disabled'}>Take into the ranch</button></td></tr>`; }).join('')}</tbody></table></div>
    <div class="confirm-row"><button class="btn small ghost" data-act="storedone" data-id="${t.id}">Done: leave the rest with them</button></div>`;
  return `<section class="panel"><div class="ph"><h2>New hires' storage</h2><span class="muted">Up to ${STORE_PICKS} (plus one a scouting office level) from each new senior hire; the rest stays theirs</span></div>${ts.map(one).join('')}</section>`;
}
// (0.37.0) Sanctuaries and the vault: open or sealed, legendaries stored, who fields them, and who could be asked
function vaultPanel() {
  const sc = sanctuaries();
  if (!sc.length) return '';
  const V = S.vault || [], takers = vaultTakers(), cands = vaultCands();
  const sl = sc.map(s => `<li><b>${esc(s.c.name)}</b> (level ${s.lv}): ${s.open ? '<span class="tag small">open</span>' : '<span class="tag notice small">sealed</span>'} <span class="small muted">site of ${siteLines(s.c).map(esc).join(', ')}</span></li>`).join('');
  const vrow = e => { const h = e.holder != null && T(e.holder); const c = S.cities[e.city];
    return `<tr><td>${esc(e.sp)}</td><td class="small">${c ? esc(c.name) : ''}</td><td class="small">${h ? `Fielded by ${tname(h.id)}` : `Stored · ${e.left} year${e.left === 1 ? '' : 's'} left with a partner`}${e.of != null && T(e.of) ? `<br><span class="muted">from ${esc(T(e.of).name)}</span>` : ''}</td>
      <td>${h ? '' : takers.length ? `<select class="vaultsel" data-u="${e.uid}" aria-label="Who fields it">${takers.map(t => `<option value="${t.id}">${esc(t.name)} (${esc(postName(t))})</option>`).join('')}</select> <button class="btn small" data-act="vaultgive" data-u="${e.uid}">Give</button>` : '<span class="small muted">Your Elite Four and Champion all hold a legendary.</span>'}</td></tr>`; };
  const crow = x => `<tr><td>${esc(x.m.sp)}</td><td>${tname(x.t.id)} <span class="small muted">${esc(x.staff ? postName(x.t) : 'challenger on your circuit')}</span></td><td class="small">${vaultBlocked(x.t) ? `Turned you down; ask again after ${turnDate(x.t.vaultNo)}` : x.staff ? `About ${Math.round(vaultOdds(x.t) * 100)}% they agree` : `Asks ${money(vaultFee(x.m))}`}</td>
      <td>${vaultBlocked(x.t) ? '' : `<button class="btn small" data-act="vaultask" data-id="${x.t.id}" data-u="${x.m.uid}"${x.staff || canSpend(vaultFee(x.m)) ? '' : ' disabled'}>${x.staff ? 'Ask them' : `Pay ${money(vaultFee(x.m))}`}</button>`}</td></tr>`;
  return `<section class="panel"><div class="ph"><h2>Sanctuaries and the vault</h2><span class="muted">A Sanctuary is open while one of its site's legendaries is with your League</span></div>
    <ul>${sl}</ul>
    <p class="small">Ask a holder to store a site legendary in your Sanctuary to keep it with the League. Staff decide by their ambition and record (they would rather keep it); a challenger asks for money, or hire them and ask again. A stored legendary's years with a partner stop counting. Give it to an Elite Four member or your Champion without a legendary: it belongs to the League and comes back when they leave the post. Staff let go after storing their own take it hard.</p>
    ${V.length ? `<h3>In the vault</h3><div class="scroll"><table class="tbl"><thead><tr><th>Legendary</th><th>Sanctuary</th><th>Now</th><th></th></tr></thead><tbody>${V.map(vrow).join('')}</tbody></table></div>` : ''}
    ${cands.length ? `<h3>Could be stored</h3><div class="scroll"><table class="tbl"><thead><tr><th>Legendary</th><th>Holder</th><th>What they want</th><th></th></tr></thead><tbody>${cands.map(crow).join('')}</tbody></table></div>` : '<p class="small muted">Nobody with your League holds one of these sites\' legendaries now.</p>'}</section>`;
}
// (0.27.0) the region: its own Pokémon, a migration, lanes, the safari, charters, and steers the region can't answer
function regionPanel() {
  const home = homeSet(S.region);
  if (!home) return `<section class="panel"><div class="ph"><h2>${esc(regionName(S.region))}</h2><span class="muted">National Dex rules</span></div><p class="small">Every species is found everywhere in this world (regional encounters are off).</p></section>`;
  const mg = migrationOf(S.region), lanes = lanesOf(), saf = S.ranch.safari && safariLv() ? S.ranch.safari : null, gaps = steerGaps();
  const others = [0, 1, 2, 3].filter(r => r !== S.region);
  if (!others.includes(charterReg)) charterReg = (NEIGHBOURS[S.region] || others)[0];
  const ports = S.gyms.map((g, i) => ({ i, c: S.cities[g.city] })).filter(x => isPort(x.c));
  const laneRow = l => `<li><b>${l.rail ? 'Railway' : 'Shipping lane'}</b> from ${esc(l.city.name)}: <select class="lanesel" data-g="${l.gym}" aria-label="Route">${others.map(r => `<option value="${r}"${r === l.src ? ' selected' : ''}>${esc(regionName(r))}</option>`).join('')}</select> <span class="small muted">${money(LANE_WEEK)} a week; a new route costs ${money(LANE_ROUTE)}${lapsed() ? '; lapsed while in the red' : ''}</span></li>`;
  const gapRow = x => `<li>${esc(postName(x.t))} (${esc(steerName(x.s))}) would want <b>${esc(x.sp)}</b>, found in ${x.regions.map(regionName).map(esc).join(' and ')}: a lane or a charter from there, a migration, or the safari could bring it.</li>`;
  return `<section class="panel"><div class="ph"><h2>${esc(regionName(S.region))}'s Pokémon</h2><span class="muted">${home.size} kinds (lines) found here · ${ports.length ? `ports: ${ports.map(x => esc(x.c.name)).join(', ')}` : 'no port among your gym cities'}</span></div>
    <p class="small">Wild Pokémon, your market, area trips and new challengers' teams come from ${esc(regionName(S.region))}'s own Pokémon, plus whatever a migration brings. Other regions' Pokémon reach your ranch through a <b>shipping lane</b> (built on the <button class="tlink" data-act="nav" data-v="cities">Cities</button> page in a port city where you have a gym, or Goldenrod's railway: its region's Pokémon on your trips and at your market all the time), a <b>charter</b> (a one-off shipment of two or three of a region's Pokémon, ${money(CHARTER_COST)}, ${CHARTER_WEEKS} weeks) or the <b>Safari Zone</b> (one per League, in a gym city: ${SAFARI_SIZE[0]} foreign Pokémon at a time, changing every ${SAFARI_WEEKS} weeks, for your targeted trips). A challenger moving to another region brings at most ${FOREIGN_MAX} Pokémon from outside it.</p>
    <p>${mg ? `<b>Migration:</b> ${mg.lines.length} kinds from ${esc(regionName(mg.from))}${mg.far ? ' (from far off)' : ''} until ${turnDate(mg.until)}: ${mg.lines.map(esc).join(', ')}.` : '<span class="muted">No migration on now. Three or four come a year, mostly from a neighbouring region, for about two months each.</span>'}</p>
    ${lanes.length ? `<ul>${lanes.map(laneRow).join('')}</ul>` : ''}
    ${saf ? `<p><b>Safari Zone</b> (level ${saf.lv}), until ${turnDate(saf.until)}: ${saf.lines.map(esc).join(', ')}.</p>` : ''}
    <div class="confirm-row"><span class="small">Charter from <select class="charterreg" aria-label="Region">${others.map(r => `<option value="${r}"${r === charterReg ? ' selected' : ''}>${esc(regionName(r))}</option>`).join('')}</select></span> <button class="btn small" data-act="ranchcharter" data-v="${charterReg}"${S.ranch.trips.length >= tripMax() || !canSpend(CHARTER_COST) ? ' disabled' : ''}>Send a charter (${money(CHARTER_COST)})</button></div>
    ${gaps.length ? `<p class="warn small">Steers ${esc(regionName(S.region))} can't answer well (staff use the best they can get meanwhile):</p><ul class="small">${gaps.map(gapRow).join('')}</ul>` : ''}</section>`;
}
// (0.19.0) distress sales offered to you: a rival's level lost in a city where you have a gym
function distressPanel() {
  const offs = distressOffers(); if (!offs.length) return '';
  return `<section class="panel"><div class="ph"><h2>Distress sales</h2><span class="muted">A rival couldn't keep these up. Each is yours to build at ${Math.round(DISTRESS_SHARE * 100)}% of the level's price until the date shown; the seller is paid if you buy.</span></div>
    <ul>${offs.map(o => `<li><b>${UPGRADES[o.k].name}</b> level ${o.lv} in ${esc(S.cities[o.city].name)}, from the ${esc(leagueName(o.from))}: <b>${money(o.price)}</b> <span class="muted small">(full price ${money(upCost(o.k, o.lv - 1))}; until ${turnDate(o.due)})</span> ${o.why ? `<span class="muted small">${esc(o.why)}</span>` : `<button class="btn small" data-act="distbuy" data-v="${o.i}"${canSpend(o.price) ? '' : ' disabled'}>Buy</button>`} <button class="btn small ghost" data-act="distno" data-v="${o.i}">Decline</button></li>`).join('')}</ul></section>`;
}
// the paid banlist, on the Meta page of your League
function banPanel() {
  if (!booksOn() || !playerLeague()) return '';
  const cands = banCands(), act = paidBans(), prot = (S.banProt || []).filter(p => p.until > S.turn);
  return `<section class="panel"><div class="ph"><h2>Your banlist</h2><span class="muted">${act.length} of ${BAN_PAID_MAX} bans in force · ${money(S.fin.money)}</span></div>
    <p class="small">Ban any Pokémon seen on your circuit (with what it evolves from and into), in any week, for one to three years. It binds both sides: challengers let theirs go and your staff get replacements. The price per year follows its rank among your circuit's performers over the last two years: three times the base for the top one, down to the base. A ban that runs out protects that Pokémon for two years.</p>
    ${act.length ? `<p>${act.map(b => `<b>${esc(b.sp)}</b> until ${turnDate(b.until)}`).join(' · ')}</p>` : ''}
    ${prot.length ? `<p class="small muted">Protected: ${prot.map(p => `${esc(p.sp)} until ${turnDate(p.until)}`).join(' · ')}</p>` : ''}
    ${cands.length ? `<div class="scroll"><table class="tbl"><thead><tr><th>#</th><th>Pokémon</th><th>Type</th><th>Battles</th><th>KOs a battle</th><th>A year</th><th></th></tr></thead><tbody>
    ${cands.slice(0, 20).map(c => `<tr><td class="num">${c.rank}</td><td>${esc(c.sp)}</td><td>${chips(SP[c.sp].types)}</td><td class="num">${c.b}</td><td class="num">${c.ko}</td><td class="num">${money(c.price)}</td><td>${c.banned ? '<span class="tag notice small">banned</span>' : c.prot ? '<span class="tag small">protected</span>' : act.length >= BAN_PAID_MAX ? '' : [1, 2, 3].map(n => `<button class="btn small" data-act="ban" data-sp="${esc(c.sp)}" data-v="${n}"${canSpend(c.price * n) ? '' : ' disabled'}>${n}y</button>`).join(' ')}</td></tr>`).join('')}
    </tbody></table></div>` : '<p class="muted">Nothing seen on your circuit yet.</p>'}</section>`;
}
let hireBid = 0;
const bidRow = () => booksOn() ? `<div class="segs">${BIDS.map(b => `<button class="seg${hireBid === b ? ' on' : ''}" data-act="hirebid" data-v="${b}" aria-pressed="${hireBid === b}">${b ? `Bid +${b * 100}%` : 'Asking pay'}</button>`).join('')}</div><p class="small muted">A bid over the asking pay makes a challenger likelier to take your offer, and they keep the higher pay.</p>` : '';
const payTag = ask => booksOn() ? ` <span class="small muted">${money(ask)}/wk</span>` : '';
// choosing a gym trainer by hand
function viewGtPick() {
  const g = S.gyms[gtSel.g], cur = T((g.trainers || [])[gtSel.k]), L = T(g.leader);
  const inc = (g.incoming || [])[gtSel.k], rows = gymTrainerCands(gtSel.g).filter(c => c.t.id !== inc);
  return `<section class="panel callout"><div class="eyebrow">Choose a gym trainer</div><h2>${townName(gtSel.g)} Gym · gym ${gtSel.g + 1}</h2>
    <p>${cur ? `${tname(cur.id)} holds this place now and is let go when you pick someone else (back to the circuit, or retired if over 45 with ten years behind them).` : 'This place is empty.'} A gym trainer holds up to ${GT_HOLD} Pokémon, fields one fewer than the leader at each challenger's stage, and must share a type with ${dn(L)} (${typeLabel(L)}).</p>
    ${inc != null ? incomingLine(inc, 'this place') : ''}
    <div class="confirm-row"><button class="btn" data-act="nav" data-v="staff">Back to your staff</button></div>${bidRow()}</section>
  <section class="panel"><div class="ph"><h2>Candidates</h2><span class="muted">${rows.length} trainers who fit: challengers on the circuit, recent retirees, outsiders, your other gym trainers, and Gym Leaders and Elite Four members (their post opens). A challenger gets an <b>offer</b>, which they can turn down; one out on a run who accepts finishes it first, for up to ${HIRE_NOTICE} weeks, while ${cur ? cur.name : 'the place'} stays${cur ? ' until then' : ' empty'}. Outsiders nobody picks join the circuit.</span></div>
  ${pickTable(rows.map(c => hireRowOf(c, c.from === 'leader' || c.from === 'e4' ? 'their post opens' : '', askFor(c.t, 'gymtrainer', 0))), 'gtplace')}</section>`;
}
// a table of trainers to pick from: type, age, OVR and the five ratings, with a button per row
function pickTable(rows, act) {
  if (!rows.length) return '<p class="muted">Nobody to show.</p>';
  return `<div class="scroll"><table class="tbl"><thead><tr><th>Trainer</th><th>From</th><th>Type</th><th>Age</th><th>OVR</th>${RK.map(k => `<th title="${RNAME[k]}">${RNAME[k].slice(0, 3)}</th>`).join('')}<th></th></tr></thead><tbody>
  ${rows.map(({ t, from, warn, label, off, tags }) => `<tr><td>${S.founding ? esc(dn(t)) + (t.famous ? '<span class="star" title="Famous trainer">★</span>' : '') : tname(t.id)}${tags || ''}</td><td class="small">${from}</td><td>${specChips(t)}${warn ? ` <span class="tag notice small">${warn}</span>` : ''}</td><td class="num">${t.age}</td><td>${ovrPill(t)}</td>${RK.map(k => `<td class="num">${t.r[k]}</td>`).join('')}<td>${off ? `<span class="small muted">${off}</span>` : `<button class="btn small primary" data-act="${act}" data-id="${t.id}">${label || 'Pick'}</button>`}</td></tr>`).join('')}
  </tbody></table></div>`;
}
// ---------- founding by hand (0.6.0) ----------
let foundSel = null, foundShow = 'all';
function foundPosts() {
  const F = S.founding;
  return [{ post: 'champion', slot: 0, id: F.champion, label: 'Champion', info: `Lv ${champLv()} · 6 Pokémon` }]
    .concat(F.e4.map((id, k) => ({ post: 'e4', slot: k, id, label: `Elite Four #${k + 1}`, info: `Lv ${E4_LV[k]} · ${E4_SIZE} Pokémon` })))
    .concat(F.gyms.map((id, k) => ({ post: 'gym', slot: k, id, label: `Gym ${k + 1} · ${townName(k)}`, info: `Scales with badges · up to ${LEADER_HOLD} Pokémon` })));
}
function viewFounding() {
  const F = S.founding, posts = foundPosts(), left = posts.filter(p => p.id == null).length;
  const sel = foundSel && posts.find(p => p.post === foundSel.post && p.slot === foundSel.slot);
  const used = sel ? foundTypesUsed(sel.post, sel.slot) : [];
  const group = id => F.field.includes(id) ? 'Founding field' : (F.carry || []).includes(id) ? 'Came with you' : 'Candidate';
  const pool = foundPool().filter(id => foundShow === 'all' || (foundShow === 'field') === F.field.includes(id)).map(T).sort((a, b) => ovr(b) - ovr(a));
  return `<main class="wrap setup" id="main"><section class="panel callout"><div class="eyebrow">Founding the ${S.lgName}</div><h1>Place your staff</h1>
    <p>Choose a Champion, four Elite Four members and eight Gym Leaders. You can pick from ${F.cands.length} candidates the game has found and the ${F.field.length} trainers of the founding field. A new League has no prestige yet, and every trainer has a prestige minimum for joining one (higher for stronger trainers and those with a record; lower for those hungry for a post), so the strongest won't sign until your League has earned some: see Prestige in the glossary. A gym's type is its leader's class, and each gym takes on two gym trainers from the circuit who share a type with the leader. Everyone you don't place sets out as a challenger.</p>
    ${F.fold ? `<div class="confirm-row"><span class="small">Your old League folded. Found the new one in <select class="foundregsel">${foldRegions().map(r => `<option value="${r}"${r === S.region ? ' selected' : ''}>${esc(regionWord(r))}${eachLeague(i => (i === ME() ? null : S.region)).includes(r) ? ' (shared)' : ''}</option>`).join('')}</select></span></div>` : ''}
    <div class="confirm-row"><button class="btn" data-act="foundfill">Fill the rest for me</button><button class="btn primary" data-act="foundgo"${left ? ' disabled' : ''}>${left ? `${left} post${left === 1 ? '' : 's'} to fill` : `Open the ${S.lgName}`}</button>${F.mid ? '' : '<button class="btn ghost" data-act="foundquit">Back to setup</button>'}</div></section>
  <section class="panel"><div class="ph"><h2>Posts</h2><span class="muted">Pick a post, then a trainer for it. Ratings: Strategy, Training, Bond, Scouting, Nerve.${booksOn() ? ` You start with ${money(START_FUND)}; your senior staff's pay comes to <b>${money(posts.reduce((a, p) => a + (p.id != null ? askFor(T(p.id), p.post === 'gym' ? 'leader' : p.post, p.slot) : 0), 0))}</b> a week (gym trainers add about ${money(16 * 35)}). There is no cap, but you can start in the red.` : ''}</span></div>
  <div class="scroll"><table class="tbl"><thead><tr><th>Post</th><th>Battles</th><th>Trainer</th><th>Type</th><th>OVR</th><th></th></tr></thead><tbody>
  ${posts.map(p => { const t = p.id != null ? T(p.id) : null, on = sel === p, dup = t && specTypes(t).some(x => foundTypesUsed(p.post, p.slot).includes(x));
    return `<tr${on ? ' class="sel"' : ''}><td><b>${p.label}</b></td><td class="small">${p.info}</td><td>${t ? esc(dn(t)) + (t.famous ? '<span class="star">★</span>' : '') : '<span class="muted">empty</span>'}</td><td>${t ? specChips(t) + (dup ? ' <span class="tag notice small">repeated type</span>' : '') : ''}</td><td>${t ? ovrPill(t) : ''}</td>
      <td><button class="btn small${on ? ' primary' : ''}" data-act="foundsel" data-k="${p.post}" data-v="${p.slot}">${t ? 'Change' : 'Choose'}</button>${t ? ` <button class="btn small ghost" data-act="foundclear" data-k="${p.post}" data-v="${p.slot}">Clear</button>` : ''}</td></tr>`; }).join('')}
  </tbody></table></div></section>
  ${sel ? `<section class="panel" id="found-pool"><div class="ph"><h2>Choose: ${sel.label}</h2><span class="muted">${sel.info}. ${pool.length} trainers free, best first.</span></div>
    <div class="segs setup-segs">${[['all', 'Everyone'], ['cands', 'Candidates'], ['field', 'Founding field']].map(([k, l]) => `<button class="seg${foundShow === k ? ' on' : ''}" data-act="foundshow" data-v="${k}" aria-pressed="${foundShow === k}">${l}</button>`).join('')}</div>
    ${pickTable(pool.map(t => ({ t, from: group(t.id), warn: specTypes(t).some(x => used.includes(x)) ? 'type already placed' : '', off: foundBlock(t.id), tags: payTag(askFor(t, sel.post === 'gym' ? 'leader' : sel.post, sel.slot)) + prestTag(t, ME()) })), 'foundpick')}</section>` : ''}</main>`;
}
// the wall report: the headline (trainers let through, then perfect years and the streak) and each year's line
function wallReport() {
  const h = S.history.filter(x => x.titles != null);
  if (!h.length) return '';
  const perfect = h.filter(x => !x.titles).length, total = h.reduce((a, x) => a + x.titles, 0);
  let streak = 0; for (let i = h.length - 1; i >= 0 && !h[i].titles; i--) streak++;
  let best = 0, run = 0; for (const x of h) { run = x.titles ? 0 : run + 1; best = Math.max(best, run); }
  const avg = f => (h.reduce((a, x) => a + f(x), 0) / h.length).toFixed(1);
  return `<section class="panel"><div class="ph"><h2>Wall report${nLeagues() > 1 ? ' · ' + S.lgName : ''}</h2><span class="muted">A trainer let through is a title conceded; a perfect year is one with none</span></div>
  <p><b>${total}</b> trainer${total === 1 ? '' : 's'} let through in ${h.length} year${h.length === 1 ? '' : 's'} · <b>${perfect}</b> perfect year${perfect === 1 ? '' : 's'} · current streak <b>${streak}</b> · longest <b>${best}</b> · ${avg(x => x.badges)} badges conceded a year · ${avg(x => x.titles)} let through a year · ${wallStanding()}</p>
  <div class="scroll"><table class="tbl"><thead><tr><th>Year</th><th>Result</th><th>Titles conceded</th><th>Badges conceded</th><th>Runs</th><th>Reached the Elite Four</th><th>Out on three losses</th><th>Best challenger</th></tr></thead><tbody>
  ${h.slice().reverse().map(x => `<tr><td class="num"><button class="tlink" data-act="repyear" data-v="${x.season}" title="Open the Year ${x.season} report">${x.season}</button></td><td>${x.titles ? '<span class="tag notice">Conceded</span>' : '<span class="tag gold">Perfect</span>'}</td><td>${x.titles ? x.winners.map(tname).join(', ') : '—'}</td><td class="num">${x.badges}</td><td class="num">${x.runs ?? '—'}</td><td class="num">${x.qualifiers}</td><td class="num">${x.out}</td><td>${x.bestId ? tname(x.bestId) + ` <span class="muted">(${depthName(x.best)})</span>` : '—'}</td></tr>`).join('')}
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
  return groups.map(g => `${g.k ? g.k + ': ' : ''}Year ${g.s.join(', ')}`).join('; ');
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
    if (t.founded) a.push({ k: 'founder', tag: 'Founder', text: `Founded the ${leagueName(t.founded.lg)} in Year ${t.founded.season}${t.founded.champ ? ', and was its first Champion' : ''}` });
    if (isGrandSlam(t)) a.push({ k: 'slam', tag: 'Triple Crown', text: `Triple Crown: won the title in three different Leagues (${[...champLeaguesOf(t)].sort().map(leagueName).join(', ')})${t.grandSlam ? ', completed in Year ' + t.grandSlam : ''}` });
    else { const cl = champLeaguesOf(t), N = nLeagues(); if (cl.size >= 2) a.push({ k: 'multi', tag: `Crown ${cl.size}/${CROWN_LEAGUES}`, text: `Won the title in ${cl.size} Leagues: ${[...cl].sort().map(leagueName).join(', ')}. One more League for the Triple Crown${N >= CROWN_LEAGUES ? ': ' + unwonLeagues(t).map(leagueName).join(' or ') : ''}${slamProtected(t) ? '. Chasing the Crown keeps them going 3 years past their usual career length' : ''}` }); }
    const wc = (t.worldSeasons || []).length; if (wc) a.push({ k: 'world', tag: `World Champion${wc > 1 ? ' ×' + wc : ''}`, text: `World Champion (Season ${t.worldSeasons.join(', ')})` });
  }
  for (const c of t.comebacks || []) a.push({ k: 'comeback', tag: '', text: `Stepped down from ${c.gym} Gym${lgIn(c.lg) ? ' (' + leagueName(c.lg) + ')' : ''} in Year ${c.season} after ${c.seasons} outstanding years in a row, to chase the title` });
  for (const c of t.classHist || []) a.push({ k: 'reinvent', tag: '', text: `Reinvented in Year ${c.season}: was ${c.from}${c.fromSpec ? ' (' + c.fromSpec + ')' : ''}, became a ${c.spec} specialist` });
  const ir = t.interim || [];
  if (ir.length) a.push({ k: 'interim', tag: `Interim Champion${ir.length > 1 ? ' ×' + ir.length : ''}`, text: ir.map(x => `Interim Champion, Year ${x.season}${lgIn(x.lg) ? ', ' + leagueName(x.lg) : ''}: beat Champion ${x.beatName || (T(x.beat) || {}).name || '?'}, then lost the title to ${x.lostToName || (T(x.lostTo) || {}).name || 'a challenger'} in the same League`).join('; ') });
  const byK = {}; for (const x of t.awards || []) (byK[x.k] = byK[x.k] || []).push(x);
  for (const k of Object.keys(AWARDS)) if (byK[k] && !['poy', 'coy'].includes(k)) a.push({ k: 'award', tag: `${AWARDS[k].short}${byK[k].length > 1 ? ' ×' + byK[k].length : ''}`, text: `${AWARDS[k].name} (${seasonsLg(byK[k])})` });
  for (const x of t.greatLegends || []) a.push({ k: 'legend', tag: x.sp, text: x.how === 'glitch' ? `${x.sp} glitched onto the team (${seasonsLg([x])})` : `${x.how === 'caught' ? 'Caught' : 'Chosen by'} ${x.sp} (${seasonsLg([x])})` });
  if (t.career.defenses) a.push({ k: 'def', tag: `${t.career.defenses} defense${t.career.defenses > 1 ? 's' : ''}`, text: `${t.career.defenses} successful title defense${t.career.defenses > 1 ? 's' : ''}` });
  if (t.hof) a.push({ k: 'hof', tag: 'Hall of Fame', text: `Hall of Fame: ${t.hofN || 1} entr${(t.hofN || 1) === 1 ? 'y' : 'ies'}, one for each title` });
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
      ${found.length ? `<div class="scroll"><table class="tbl"><thead><tr><th>Pokémon</th><th>Trainer</th><th>Lv</th><th>Year</th><th>Career</th><th>Win %</th><th>KOs</th></tr></thead><tbody>
      ${found.slice(0, 80).map(({ t, m }) => { const ss = ssOf(m), st = stOf(m); return `<tr><td>${monMini(m.sp, m.shiny || m.radiant)}<button class="tlink" data-act="mon" data-t="${t.id}" data-u="${m.uid}">${m.sp}</button> ${chips(monTypes(m))}${indivTags(m)}${(special || trait) && m.met ? ` <span class="muted small">${HOW[m.met.how] || ''}</span>` : ''}</td><td>${tname(t.id)}</td><td class="num">${Math.floor(m.lvl)}</td><td class="num">${wl(ss)}</td><td class="num">${wl(st)}</td><td class="num">${pct(st)}</td><td class="num">${st.ko}</td></tr>`; }).join('')}
      </tbody></table></div>${found.length > 80 ? `<p class="fine">Showing 80 of ${found.length}.</p>` : ''}` : '<p class="muted">No active trainer has one right now.</p>'}</section>`;
  }
  // individual traits don't apply to species stats, so the Pokédex steps aside while one is on
  const dexPanel = trait ? `<section class="panel"><p class="muted">The League Pokédex counts whole species, so it isn't filtered by ${traitLabel}. <button class="link" data-act="dextrait" data-v="any">Show all Pokémon</button></p></section>` : null;
  return `${owners}
  ${dexPanel || `<section class="panel"><div class="ph"><h2>League Pokédex</h2><span class="muted">${q ? `Every species matching “${esc(dexQ.trim())}”${special ? ' (' + kindLabel + ')' : ''}, battled or not` : special ? `${kindLabel} that have been on a team or in a battle` : 'Every battle by every trainer, gyms and League included'}</span></div>
    <div class="filters"><button class="pill${dexScope === 'season' ? ' on' : ''}" data-act="dexscope" data-v="season">Year ${S.season || 1}</button><button class="pill${dexScope === 'all' ? ' on' : ''}" data-act="dexscope" data-v="all">All time</button>
      ${q || special ? '' : `<span class="muted small">Minimum battles:</span>${[1, 5, 20].map(n => `<button class="pill${dexMin === n ? ' on' : ''}" data-act="dexmin" data-v="${n}">${n}</button>`).join('')}`}</div>
    ${rows.length ? `<div class="scroll"><table class="tbl"><thead><tr>${DEX_COLS.map(th).join('')}</tr></thead><tbody>
    ${rows.slice(0, 120).map(r => `<tr><td>${monMini(r.sp, false)}<b>${r.sp}</b> ${chips(SP[r.sp].types)}${SP[r.sp].legend ? ' <span class="tag legend">Legendary</span>' : ''}${SP[r.sp].paradox ? ' <span class="tag paradox">Paradox</span>' : ''}${babyTag(SP[r.sp])}${dexTag(r.sp)}</td><td class="num">${r.owned || '—'}</td><td class="num">${r.b}</td><td class="num">${r.w}</td><td class="num">${r.l}</td><td class="num">${r.b ? (r.pct * 100).toFixed(0) + '%' : '—'}</td><td class="num">${r.ko}</td><td class="num">${r.b ? r.kpb.toFixed(2) : '—'}</td></tr>`).join('')}
    </tbody></table></div>${rows.length > 120 ? `<p class="fine">Showing the top 120 of ${rows.length}.</p>` : ''}` : `<p class="muted">${q ? 'No Pokémon in the game match that search.' : special ? `No ${kindLabel.toLowerCase()} have been on a team or in a battle ${dexScope === 'season' ? 'this season. Try “All time”.' : 'yet.'}` : `No Pokémon have ${dexMin} or more battles ${dexScope === 'season' ? 'this year' : 'yet'}.`}</p>`}
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
// legendaries waiting for a new partner (0.20.0: the world's pool)
function pooledLegends() { return (S.wPool || []).map(m => ({ m, lg: m.lgHome != null && m.lgHome < nLeagues() ? m.lgHome : 0 })); }
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
    return { who: `${monMini(sp)} <b>${sp}</b>${live.has(sp) ? ' <span class="tag banned">Banned now</span>' : ''}`, v: v + (v === 1 ? ' ban' : ' bans'), sub: ss.length ? `banned for Year${ss.length > 1 ? 's' : ''} ${ss.join(', ')}` : '' }; });
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
    ${recBoard('Longest reign', rg.map(r => ({ who: tname(r.id), v: `${r.n} year${r.n > 1 ? 's' : ''}`, sub: (r.from === r.to ? `Year ${r.from}` : `Years ${r.from}–${r.to}`) + (lgIn(S.lg || 0) ? ' · ' + lgIn(S.lg || 0) : '') })), nLeagues() > 1 ? `Years ending as Champion in a row, in the ${S.lgName}.` : 'Seasons ending as Champion in a row.')}
    ${recBoard('Most title defenses', topBy(ts, t => t.career.defenses).map(([t, v]) => row(t, v)))}
    ${recBoard('Youngest Champion', wins.slice().sort((a, b) => a.age - b.age || a.s - b.s).slice(0, 5).map(w => row(w.t, `age ${w.age}`, seasonsLg([{ season: w.s, lg: w.lg }]))))}
    ${nLeagues() >= CROWN_LEAGUES ? recBoard('Triple Crowns', ts.filter(isGrandSlam).sort((a, b) => (a.grandSlam || 999) - (b.grandSlam || 999)).slice(0, 5).map(t => row(t, champLeaguesOf(t).size + ' Leagues', t.grandSlam ? 'completed Year ' + t.grandSlam : '')), 'Won the title in three different Leagues across a career.') : ''}
    ${nLeagues() > 1 ? recBoard('Most World Championships', topBy(ts, t => (t.worldSeasons || []).length).map(([t, v]) => row(t, v, 'Season ' + t.worldSeasons.join(', ')))) : ''}
    ${recBoard('Oldest Champion', wins.slice().sort((a, b) => b.age - a.age || a.s - b.s).slice(0, 5).map(w => row(w.t, `age ${w.age}`, seasonsLg([{ season: w.s, lg: w.lg }]))))}
  </div></section>`;
  const trainers = `<section class="panel"><div class="ph"><h2>Trainers</h2><span class="muted">Every trainer, active and retired</span></div><div class="recgrid">
    ${recBoard('Most wins', topBy(ts, t => recOf(t).w, 50).map(([t, v]) => row(t, v, `${recOf(t).w}–${recOf(t).l}`)), 'tr-most-wins')}
    ${recBoard('Best win %', topBy(ts, pctOf, 50, 0).map(([t, v]) => row(t, Math.round(v * 100) + '%', `${recOf(t).w}–${recOf(t).l}`)), 'At least 60 battles.', 'tr-best-win')}
    ${recBoard('Longest win streak', topBy(ts, t => recOf(t).bs || 0, 50).map(([t, v]) => row(t, v + (v === 1 ? ' win' : ' wins'), t.role !== 'retired' && recOf(t).cs === v ? 'ongoing, since Year ' + recOf(t).bsFrom : recOf(t).bsFrom === recOf(t).bsTo ? 'Season ' + recOf(t).bsTo : `Years ${recOf(t).bsFrom}–${recOf(t).bsTo}`)), 'Consecutive wins in any battle: gym, road, League and title.', 'tr-longest-win-streak')}
    ${recBoard('Most badges', topBy(ts, t => t.career.badges, 50).map(([t, v]) => row(t, v)), 'tr-most-badges')}
    ${recBoard('Most circuit completions', topBy(ts, circuitWins, 50).map(([t, v]) => row(t, v, 'all 8 badges')), 'tr-most-circuit-completions')}
    ${recBoard('Most title matches', topBy(ts, titleMatches, 50).map(([t, v]) => row(t, v, `won ${(t.seasonHist || []).filter(h => h.stage === 5).length}`)), 'Beat all four of the Elite Four to reach the Champion.', 'tr-most-title-matches')}
    ${recBoard('Most Elite Four members beaten', topBy(ts, e4Beaten, 50).map(([t, v]) => row(t, v, `over ${t.career.leagueApps} League run${t.career.leagueApps === 1 ? '' : 's'}`)), 'Across every League run as a challenger.', 'tr-most-elite-four-beaten')}
    ${recBoard('Most Elite Four wins', topBy(ts, t => t.career.e4Wins, 50).map(([t, v]) => row(t, v, 'as an Elite Four member')), 'tr-most-elite-four-wins')}
    ${recBoard('Longest career', topBy(ts, t => t.seasons, 50).map(([t, v]) => row(t, `${v} years`, t.role === 'retired' ? 'retired' : 'active')), 'tr-longest-career')}
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
  const seasons = `<section class="panel"><div class="ph"><h2>Years</h2></div><div class="recgrid">
    ${recBoard('Most runs at the Elite Four in a year', hist.slice().sort((a, b) => b.qualifiers - a.qualifiers).slice(0, 3).map(h => ({ who: 'Year ' + h.season, v: h.qualifiers })))}
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
  const streakSub = t => { const r = recOf(t); return t.role !== 'retired' && r.cl === r.wl ? 'ongoing, since Year ' + r.wlFrom : r.wlFrom === r.wlTo ? 'Season ' + r.wlFrom : `Years ${r.wlFrom}–${r.wlTo}`; };
  const interimOnly = ts.filter(t => (t.interim || []).length && !titles(t) && !t.hof);
  const lostFinals = t => (t.seasonHist || []).filter(h => h.stage === 4).length;
  const gymSeasons = []; S.gyms.forEach((g, i) => (g.hist || []).forEach(x => { const n = x.w + x.l; if (n >= 8 && T(x.leader)) gymSeasons.push({ t: T(x.leader), town: townName(i), season: x.season, w: x.w, l: x.l, p: x.w / n }); }));
  const shame = `<section class="panel shame"><div class="ph"><h2>Hall of Shame</h2><span class="muted">Someone has to be at the bottom</span></div><div class="recgrid">
    ${recBoard('Worst win %', bottomBy(noGym, pctOf).map(([t, v]) => row(t, Math.round(v * 100) + '%', `${recOf(t).w}–${recOf(t).l}`)), 'At least 60 battles. Gym Leaders not included.', 'tr-worst-win')}
    ${recBoard('Longest losing streak', topBy(noGym, t => recOf(t).wl || 0, 50).map(([t, v]) => row(t, v + (v === 1 ? ' loss' : ' losses'), streakSub(t))), 'Every kind of battle counts. Gym Leaders not included. Tracked from v122 on.', 'tr-losing-streak')}
    ${recBoard('Interim Champions, never Champion', topBy(interimOnly, t => t.interim.length, 50).map(([t, v]) => row(t, v + (v === 1 ? ' interim title' : ' interim titles'), seasonsLg(t.interim))), 'Took the title and lost it in the same League, without ever holding it at the end of a season.', 'tr-interim-only')}
    ${recBoard('So close: title matches lost', topBy(ts, lostFinals, 50).map(([t, v]) => row(t, v, titles(t) ? `won ${titles(t)} title${titles(t) > 1 ? 's' : ''} too` : 'never won the title')), 'Beat all four of the Elite Four, then lost to the Champion.', 'tr-lost-finals')}
    ${recBoard('Most League runs without a title', topBy(ts.filter(t => !titles(t)), t => t.career.leagueApps, 50).map(([t, v]) => row(t, v + ' runs', `${e4Beaten(t)} Elite Four wins`)), 'tr-runs-no-title')}
    ${recBoard('Longest career without a League run', topBy(ts.filter(t => !t.career.leagueApps && !STAFF_ROLES.includes(t.role) && !(t.posts || []).length), t => t.seasons, 50).map(([t, v]) => row(t, v + ' years', `best: ${Math.max(0, ...(t.seasonHist || []).map(h => h.badges || 0))} badges`)), 'Never completed the badge circuit.', 'tr-no-league')}
    ${recBoard('Most gym losses', topBy(ts.filter(t => t.role !== 'leader' && !(t.posts || []).some(p => p.role === 'leader')), t => recOf(t).gl || 0, 50).map(([t, v]) => row(t, v, `${recOf(t).gw || 0} gym wins`)), 'Challengers who never led a gym.', 'tr-gym-losses')}
    ${recBoard('Most knocked out', topBy(mons, x => x.st.f || 0, 50).map(([x, v]) => ({ who: monWho(x), v: v + ' faints', sub: `${x.st.b} battles` })), 'pk-most-faints')}
    ${recBoard('Worst Pokémon win %', bottomBy(noGymMons.filter(x => x.st.b >= 40), x => x.st.w / x.st.b).map(([x, v]) => ({ who: monWho(x), v: Math.round(v * 100) + '%', sub: `${x.st.w}–${x.st.l}` })), 'At least 40 battles. Gym Leaders\' Pokémon not included.', 'pk-worst-win')}
    ${recBoard('Pokémon losing streak', topBy(noGymMons, x => x.st.wl || 0, 50).map(([x, v]) => ({ who: monWho(x), v: v + (v === 1 ? ' loss' : ' losses'), sub: x.cur && x.st.cl === v ? 'ongoing' : '' })), 'Battles it took part in, in a row, on the losing side. Gym Leaders\' Pokémon not included. Tracked from v122 on.', 'pk-losing-streak')}
    ${recBoard('Leakiest gym year', gymSeasons.sort((a, b) => a.p - b.p || b.l - a.l).slice(0, 5).map(g => ({ who: tname(g.t.id), v: `${g.w}–${g.l}`, sub: `${g.town} Gym, Year ${g.season}${lgIn(S.lg || 0) ? ' · ' + lgIn(S.lg || 0) : ''}` })), 'Lowest share of challenges held, 8+ challenges.')}
  </div></section>`;
  const hofLink = `<section class="panel"><div class="ph"><h2>Hall of Fame</h2><span class="muted">${(S.hof || []).length} entr${(S.hof || []).length === 1 ? 'y' : 'ies'}</span></div><p>Every title win enters the Hall at once, with the team that won it. <button class="link" data-act="nav" data-v="hof">Open the Hall of Fame ›</button></p></section>`;
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
// ---------- the progress board (0.21.0) ----------
// One row per stop (gyms 1 to 8, the Elite Four, the Champion): challengers there now, let through this year, runs walled
// there this year and a bar of the share of tries held. Tapping a row opens it: who leads it and stands in its line,
// who is there now and how far they are, who got through lately (the try and the core of their team), who was walled
// (and by whom), and the types that are beating it this year. Works for any League through the League switcher.
let boardSel = null; // null, a gym index, 'e4:k' or 'champ'
const BOARD_THREATS = 14;
function boardThreats() {
  const lg = S.lg || 0, out = [];
  for (const id of S.challengers) {
    const t = T(id); if (!t || t.role !== 'challenger') continue;
    const deep = t.rest == null && (t.badges || []).length >= 6, imp = impressed(t), con = t.spon && t.spon.to === lg;
    if (deep || con || imp) out.push({ t, k: (t.rest == null ? (t.badges || []).length : 0) * 10 + (con ? 5 : 0) + (imp ? 2 : 0) + ovr(t) / 100, deep, imp, con });
  }
  return out.sort((a, b) => b.k - a.k).slice(0, BOARD_THREATS);
}
const boardBar = (w, l) => { const n = w + l, p = n ? Math.round(w / n * 100) : null; return p == null ? '<span class="muted small">no tries yet</span>' : `<span class="hbar" title="${p}% of ${n} tries held"><span style="width:${p}%"></span></span> <span class="small">${p}%</span>`; };
const stageWord = k => k === 0 ? 'gym trainer 1' : k === 1 ? 'gym trainer 2' : 'the leader';
function boardRows() {
  const out = S.challengers.map(T).filter(t => t && t.role === 'challenger' && t.rest == null);
  const L = S.league || { entries: [] }, E = L.entries || [];
  const row = (key, label, holder, now, thru, wall, w, l) => `<tr class="boardrow${String(boardSel) === String(key) ? ' on' : ''}" data-act="boardrow" data-v="${key}"><td><b>${label}</b><div class="small muted">${holder}</div></td><td class="num">${now}</td><td class="num">${thru}</td><td class="num">${wall}</td><td>${boardBar(w, l)}</td></tr>`;
  const rows = S.gyms.map((g, i) => {
    const ld = T(g.leader);
    return row(i, `Gym ${i + 1} · ${townName(i)}`, ld ? `${dn(ld)} · ${typeLabel(ld)}${ld.acting ? ' (acting)' : ''}` : 'Vacant', out.filter(t => t.badges.length < 8 && t.gymAt === i).length, g.l, g.out || 0, g.w, g.l);
  });
  const ready = out.filter(t => t.badges.length >= 8).length;
  for (let k = 0; k < 4; k++) { const h = T(S.e4[k]), faced = E.filter(e => e.stage >= k).length, st = E.filter(e => e.stage === k).length;
    rows.push(row('e4:' + k, `Elite Four #${k + 1}`, h ? `${dn(h)} · ${typeLabel(h)}` : 'Vacant', k === 0 ? ready : '—', faced - st, st, st, faced - st)); }
  { const c = T(S.champion), faced = E.filter(e => e.stage >= 4).length, won = E.filter(e => e.stage === 5).length;
    rows.push(row('champ', 'Champion', c ? `${dn(c)} · ${typeLabel(c)}` : 'Vacant', '—', won, faced - won, faced - won, won)); }
  return rows.join('');
}
// (0.32.0) with gyms in any order, how far the field has got is counted by badges held: challengers out on a run with
// 0 to 8 badges
function boardBadges() {
  const out = S.challengers.map(T).filter(t => t && t.role === 'challenger' && t.rest == null), n = Array(9).fill(0);
  for (const t of out) n[Math.min(8, t.badges.length)]++;
  const top = Math.max(1, ...n);
  return `<div class="eyebrow" style="margin-top:.6rem">Out on a run, by badges held</div><div class="scroll"><table class="tbl board"><thead><tr>${n.map((_, k) => `<th class="num" title="${k < 8 ? `Next gym at Lv ${GYM_LV[k]} with ${GYM_SIZE[k]} Pokémon` : 'Elite Four next'}">${k}</th>`).join('')}</tr></thead><tbody><tr>${n.map(x => `<td class="num"><b>${x}</b><div><span class="hbar" style="width:2.2rem"><span style="width:${Math.round(100 * x / top)}%"></span></span></div></td>`).join('')}</tr></tbody></table></div>`;
}
// the challengers' latest Elite Four runs at this League (this year, then last year's), newest first
const boardRuns = () => [...((S.league || {}).entries || []).map(e => [e, S.season]), ...((S.lastLeague || {}).entries || []).map(e => [e, S.season - 1])].reverse();
function boardDetail() {
  if (boardSel == null) return '<p class="muted small">Tap a row to open that stop: who is there now, who got through lately, who was walled and what is beating it.</p>';
  const li = (x, extra) => `<li>${tname(x)}${extra ? ` <span class="small muted">${extra}</span>` : ''}</li>`;
  const list = (title, items, none) => `<div><div class="eyebrow">${title}</div>${items.length ? `<ul class="changes">${items.join('')}</ul>` : `<p class="muted small">${none}</p>`}</div>`;
  if (typeof boardSel === 'number') {
    const i = boardSel, g = S.gyms[i]; if (!g) return '';
    const ld = T(g.leader), line = (g.trainers || []).map(T).filter(Boolean).concat(ld ? [ld] : []);
    const here = S.challengers.map(T).filter(t => t && t.role === 'challenger' && t.rest == null && t.badges.length < 8 && t.gymAt === i).sort((a, b) => b.badges.length - a.badges.length || triesAt(b, i) - triesAt(a, i) || gymStageNow(b) - gymStageNow(a));
    const rec = g.recent || { thru: [], wall: [] };
    const beat = Object.entries(g.beat || {}).sort((a, b) => b[1] - a[1]).slice(0, 4);
    return `<div class="ph"><h3>Gym ${i + 1} · ${townName(i)}</h3><span class="muted">Scales with each challenger's badges · ${g.w}–${g.l} this year</span></div>
      <ul class="mini">${line.map((t, k) => `<li><span>${k === line.length - 1 ? '<b>Leader</b> ' : `Gym trainer ${k + 1} `}${tname(t.id)} ${specChips(t)}</span><span class="small muted">${t.team.map(m => m.sp).join(', ')}</span></li>`).join('')}</ul>
      <div class="hist3">
        ${list(`Here now (${here.length})`, here.map(t => li(t.id, `${t.badges.length} badge${t.badges.length === 1 ? '' : 's'} (Lv ${GYM_LV[t.badges.length]}) · ${triesAt(t, i)} of ${GYM_TRIES} tries used · up to ${stageWord(gymStageNow(t))}`)), 'Nobody is at this gym right now.')}
        ${list('Let through lately', rec.thru.slice().reverse().map(([id, at, tr, core, b]) => li(id, `${turnDate(at)} · ${b != null ? `badge ${b + 1}, ` : ''}try ${tr} · ${(core || []).join(', ')}`)), 'Nobody yet.')}
        ${list('Walled lately', rec.wall.slice().reverse().map(([id, at, by]) => li(id, `${turnDate(at)} · lost to ${T(by) ? dn(T(by)) : '?'}`)), 'Nobody yet.')}
      </div>
      <div class="eyebrow" style="margin-top:.6rem">What's beating it this year</div>${beat.length ? `<p>${beat.map(([ty, n]) => `${chip(ty)} <span class="small muted">×${n}</span>`).join(' ')} <span class="small muted">types in the squads that took its badge</span></p>` : '<p class="muted small">No badges conceded this year.</p>'}
      ${(S.lg || 0) === ME() ? gymWatch(g, i) : ''}`;
  }
  const champ = boardSel === 'champ', k = champ ? 4 : +String(boardSel).split(':')[1], h = T(champ ? S.champion : S.e4[k]);
  const runs = boardRuns().filter(([e]) => e.stage >= k);
  const thru = runs.filter(([e]) => e.stage > k).slice(0, BOARD_KEEP), stop = runs.filter(([e]) => e.stage === k).slice(0, BOARD_KEEP);
  const ready = k === 0 ? S.challengers.map(T).filter(t => t && t.role === 'challenger' && t.rest == null && t.badges.length >= 8) : [];
  return `<div class="ph"><h3>${champ ? 'Champion' : `Elite Four #${k + 1}`}${h ? ' · ' + tname(h.id) : ''}</h3><span class="muted">${h ? `${typeLabel(h)} · Lv ${champ ? champLv() : E4_LV[k]}` : 'Vacant'}</span></div>
    ${h ? `<p class="small muted">${h.team.map(m => m.sp).join(', ')}</p>` : ''}
    <div class="hist3">
      ${k === 0 ? list(`Preparing for the Elite Four (${ready.length})`, ready.map(t => li(t.id, `${t.team.length} Pokémon`)), 'Nobody has eight badges right now.') : ''}
      ${list(champ ? 'Won the title lately' : 'Got past lately', thru.map(([e, y]) => li(e.id, `${weekShort(e.week)}, Year ${y}`)), 'Nobody yet.')}
      ${list(champ ? 'Stopped by the Champion lately' : 'Stopped here lately', stop.map(([e, y]) => li(e.id, `${weekShort(e.week)}, Year ${y}`)), 'Nobody yet.')}
    </div>`;
}
function viewBoard() {
  const th = boardThreats();
  return `<section class="panel"><div class="ph"><h2>Progress board${nLeagues() > 1 ? ' · ' + esc(S.lgName) : ''}</h2><span class="muted">${dateName()} · ${S.challengers.length} challengers on the circuit, ${S.challengers.map(T).filter(t => t && t.rest == null).length} out on a run</span></div>
    <div class="threats"><span class="eyebrow">Threats</span>${th.length ? th.map(x => `<span class="threat">${tname(x.t.id)} <span class="small">${x.t.rest == null ? `${x.t.badges.length} badge${x.t.badges.length === 1 ? '' : 's'}` : 'resting'}</span>${x.con ? ' <span class="tag small">Contender</span>' : ''}${x.imp ? ' <span class="tag gold small">Impressed</span>' : ''}</span>`).join('') : '<span class="muted small">Nobody with six badges or more, no contenders and nobody who impressed.</span>'}</div>
    <div class="scroll"><table class="tbl board"><thead><tr><th>Stop</th><th title="Challengers out on a run who are at this stop now">Here now</th><th title="This year">Let through</th><th title="Runs ended here on a third loss this year (the Elite Four and Champion: runs stopped here)">Walled</th><th>Held</th></tr></thead><tbody>${boardRows()}</tbody></table></div>${boardBadges()}</section>
    <section class="panel boarddetail">${boardDetail()}</section>`;
}
// ---------- Hall of Fame ----------
let hofQ = '', hofSort = 'new', hofLg = 'all'; // hofLg: 'all' or a League index (folded Leagues are negative)
// (0.21.0) the Hall of Fame on winning: one card per title win, with the team that won it
const HOF_SORTS = [['new', 'Newest'], ['old', 'Oldest'], ['most', 'Most entries'], ['league', 'By League']];
// the title battle of an entry, while its League keeps it: [League, 'cur' | 'last', index]
function hofLog(e) {
  if (e.lg < 0 || e.lg >= nLeagues()) return null;
  return inLeague(e.lg, () => { for (const [k, L] of [['cur', S.league], ['last', S.lastLeague]]) { const i = L && L.logs ? L.logs.findIndex(r => r.hof === e.uid) : -1; if (i >= 0) return [e.lg, k, i]; } return null; });
}
// the Leagues a Hall filter offers: every League open now and every folded League with an entry
const hofLeagues = () => [...new Set(Array.from({ length: nLeagues() }, (_, i) => i).concat((S.hof || []).map(e => e.lg)))].sort((a, b) => (a < 0) - (b < 0) || Math.abs(a) - Math.abs(b));
function hofText(e) {
  const t = T(e.id), c = T(e.champ);
  return fold([t ? dn(t) : '', t ? t.name : '', t ? t.cls : '', c ? dn(c) : '', 'year ' + e.season, leagueName(e.lg), e.spon != null ? 'contender' : '', ...e.team.map(m => m.sp)].join(' '));
}
const hofMon = m => `<span class="hofmon" title="${esc([`Lv ${m.lv}`, m.ab, m.item && ITEMS[m.item] ? ITEMS[m.item].name : '', (m.moves || []).join(', ')].filter(Boolean).join(' · '))}">${m.shiny ? '✦ ' : ''}${esc(m.sp)}${m.item && ITEMS[m.item] ? ` <small class="muted">@ ${esc(ITEMS[m.item].name)}</small>` : ''}</span>`;
function hofCard(e) {
  const t = T(e.id), n = t ? t.hofN || 1 : 1, k = (S.hof || []).filter(x => x.id === e.id && x.uid <= e.uid).length, w = hofLog(e);
  return `<article class="hofcard"><div class="eyebrow">Year ${e.season} · ${weekShort(e.week)} · ${esc(leagueName(e.lg))}${e.lg < 0 ? ' (folded)' : ''}</div><div class="hof-name">${t ? tname(t.id) : 'Unknown'}</div>
    <div class="hof-stats"><span>beat Champion ${T(e.champ) ? tname(e.champ) : '?'}</span>${n > 1 ? `<span><b>${k}</b> of ${n} entries</span>` : ''}${e.spon != null ? `<span class="tag small">Contender for the ${esc(lgShort(e.spon))}</span>` : ''}</div>
    <div class="hof-team">${e.team.map(hofMon).join('')}</div>
    ${e.route && e.route.length ? `<div class="small muted">Route: ${e.route.map(esc).join(' → ')}</div>` : ''}
    ${w ? `<button class="btn small" data-act="watchhof" data-u="${e.uid}">Watch the title battle</button>` : ''}</article>`;
}
function hofResults() {
  const q = fold(hofQ.trim());
  let list = (S.hof || []).slice();
  const all = list.length;
  if (hofLg !== 'all' && !hofLeagues().includes(+hofLg)) hofLg = 'all';
  const lgOn = hofLg !== 'all';
  if (lgOn) list = list.filter(e => e.lg === +hofLg);
  const total = list.length;
  // a search ending in a number matches that number exactly, so "year 3" doesn't also find Year 30
  if (q) { const re = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + (/\d$/.test(q) ? '(?!\\d)' : '')); list = list.filter(e => re.test(hofText(e))); }
  const nOf = e => (T(e.id) || {}).hofN || 1;
  const key = { new: (a, b) => b.uid - a.uid, old: (a, b) => a.uid - b.uid, most: (a, b) => nOf(b) - nOf(a) || a.id - b.id || b.uid - a.uid, league: (a, b) => (a.lg < 0) - (b.lg < 0) || Math.abs(a.lg) - Math.abs(b.lg) || b.uid - a.uid }[hofSort] || ((a, b) => b.uid - a.uid);
  list.sort(key);
  if (!all) return '<p class="muted">No entries yet. A challenger enters the Hall of Fame the moment they beat a Champion.</p>';
  if (!total) return `<p class="muted">Nobody has won the ${leagueName(+hofLg)} yet.</p>`;
  if (!list.length) return `<p class="muted">No entries match “${esc(hofQ.trim())}”. Try a name, a year, a League or a Pokémon.</p>`;
  const shown = list.slice(0, HOF_SHOW);
  return `<p class="muted small">${list.length} of ${total} entr${total === 1 ? 'y' : 'ies'}${lgOn ? ` in the ${leagueName(+hofLg)}` : ''}${q ? ` matching “${esc(hofQ.trim())}”` : ''}${list.length > shown.length ? ` · showing the first ${shown.length}` : ''}</p><div class="hofgrid">${shown.map(hofCard).join('')}</div>`;
}
const HOF_SHOW = 120;
function viewHof() {
  const lgs = hofLeagues(), people = new Set((S.hof || []).map(e => e.id)).size;
  return `<section class="panel"><div class="ph"><h2>Hall of Fame</h2><span class="muted">Every title win, entered the moment it is won · ${people} Hall of Famer${people === 1 ? '' : 's'}</span></div>
    ${searchBox('hofsearch', hofQ, 'Search the Hall of Fame', 'Search by name, year, League, Champion or Pokémon')}
    ${lgs.length > 1 ? `<div class="filters hof-lgf"><span class="muted small">League:</span>${[['all', 'All Leagues'], ...lgs.map(i => [String(i), leagueName(i) + (i < 0 ? ' (folded)' : '')])].map(([k, l]) => `<button class="pill${String(hofLg) === k ? ' on' : ''}" data-act="hoflg" data-v="${k}">${esc(l)}</button>`).join('')}</div>` : ''}
    <div class="filters">${HOF_SORTS.map(([k, l]) => `<button class="pill${hofSort === k ? ' on' : ''}" data-act="hofsort" data-v="${k}">${l}</button>`).join('')}</div>
    <div id="hofres">${hofResults()}</div></section>`;
}
// a trainer's own Hall of Fame entries, on their page
function hofPanel(t) {
  const es = hofOf(t); if (!es.length) return '';
  return `<section class="panel"><div class="ph"><h3>Hall of Fame</h3><span class="muted">${es.length} entr${es.length === 1 ? 'y' : 'ies'}</span></div><div class="hofgrid">${es.slice().reverse().map(hofCard).join('')}</div></section>`;
}
function viewHistory() {
  const h = S.history.slice().reverse();
  return `${worldHistory()}${wallReport()}<section class="panel"><div class="ph"><h2>History by year${nLeagues() > 1 ? ' · ' + S.lgName : ''}</h2></div>
  ${h.length ? `<div class="scroll"><table class="tbl"><thead><tr><th>Year</th><th>Champion</th><th>Deepest run short of the title</th><th>Runs at the Elite Four</th><th>Meta</th></tr></thead><tbody>
  ${h.map(x => `<tr><td class="num">${x.season}</td><td>${tname(x.champ)}${x.champWasNew ? ' <span class="tag gold">new</span>' : ''}</td><td>${x.runner ? tname(x.runner) + ` <span class="muted">(${x.runnerStage === 4 ? 'Final' : 'E4 #' + (x.runnerStage + 1)})</span>` : '—'}</td><td class="num">${x.qualifiers}</td><td>${x.metaMons && x.metaMons.length ? `<span class="small">${x.metaMons.join(', ')}</span>` : '—'}</td></tr>`).join('')}
  </tbody></table></div>` : '<p class="muted">The first year has not finished yet.</p>'}</section>
  ${h.some(x => x.awards && x.awards.length) ? `<section class="panel"><div class="ph"><h2>Awards by year</h2></div><div class="scroll"><table class="tbl"><thead><tr><th>Year</th>${Object.values(AWARDS).map(a => `<th>${a.short}</th>`).join('')}</tr></thead><tbody>
  ${h.filter(x => x.awards).map(x => `<tr><td class="num">${x.season}</td>${Object.keys(AWARDS).map(k => { const a = x.awards.find(y => y.k === k); return `<td>${a ? awardWho(a) : '<span class="muted">—</span>'}</td>`; }).join('')}</tr>`).join('')}
  </tbody></table></div></section>` : ''}
  ${banHistory()}`;
}
// v195: every banlist vote in this League, newest first: what was banned, kept and lifted, and what was in force after
function banHistory() {
  const log = S.banLog || [];
  if (!log.length) return featOn('banlist') ? `<section class="panel"><div class="ph"><h2>Banlists${nLeagues() > 1 ? ' · ' + S.lgName : ''}</h2></div><p class="muted">No vote has banned anything here yet. The League's trainers vote at New Year.</p></section>` : '';
  const by = {}; for (const e of log) (by[e.season] = by[e.season] || []).push(e);
  const seasons = Object.keys(by).map(Number).sort((a, b) => b - a);
  const inForce = new Set(), forceAt = {};
  for (const sn of seasons.slice().reverse()) { for (const e of by[sn]) { if (e.act === 'ban') inForce.add(e.sp); else inForce.delete(e.sp); } forceAt[sn] = [...inForce]; }
  const items = (sn, act, f) => by[sn].filter(e => e.act === act).map(e => `<span class="bh-i">${f(e)}</span>`).join(' ');
  const line = (label, html) => html ? `<div><span class="bh-l">${label}</span>${html}</div>` : '';
  return `<section class="panel"><div class="ph"><h2>Banlists${nLeagues() > 1 ? ' · ' + S.lgName : ''}</h2><span class="muted">${Object.keys(banCounts()).length} Pokémon banned in all</span></div>
  <div class="banhist">${seasons.map(sn => `<div class="bh-row"><div class="bh-s">Year ${sn + 1}</div>
    ${line('Banned', items(sn, 'ban', e => e.paid != null ? `<b>${e.sp}</b> <span class="muted small">paid ${money(e.paid)} · ${e.len} year${e.len === 1 ? '' : 's'}</span>` : `<b>${e.sp}</b> <span class="muted small" title="${e.ty} of ${e.tn} trainers">${e.pct}%${e.len ? ` · ${e.len} year${e.len === 1 ? '' : 's'}` : ''}</span>`))}
    ${line('Lifted', items(sn, 'lift', e => `${e.sp} <span class="muted small">time up</span>`))}
    ${line('Banlist', forceAt[sn].length ? forceAt[sn].map(sp => `<span class="bh-i">${monMini(sp)}${sp}</span>`).join(' ') : '<span class="muted">none</span>')}</div>`).join('')}</div>
  <p class="fine">Each voted ban shows the share of the League's trainers who voted for it, then its length; a paid ban shows its price. Each ban runs its full length (1 to ${BAN_MAX_SEASONS} seasons), then lifts.</p></section>`;
}

// ---------- awards ----------
function awardWho(a) {
  if (!a.sp) return tname(a.id);
  const t = T(a.id), m = t && t.team.find(x => x.uid === a.uid);
  return `${m ? `<button class="tlink" data-act="mon" data-t="${t.id}" data-u="${m.uid}">${a.sp}</button>` : `<b>${a.sp}</b>`} <span class="muted small">${tname(a.id)}</span>`;
}
function awardsPanel(h, title) {
  const aw = h && h.awards; if (!aw || !aw.length) return '';
  return `<section class="panel"><div class="ph"><h3>${title || `Year ${h.season} awards`}</h3></div><div class="awards">${aw.map(a => `<div class="award"><span class="aw-k">${AWARDS[a.k].name}</span><span class="aw-who">${awardWho(a)}</span><span class="muted small">${a.why}</span></div>`).join('')}</div></section>`;
}
// ---------- recap ----------

// ---------- the year report (0.8.0) ----------
// One year of the bound League: trainers let through first, then the perfect years and the streak, how far the best
// challenger got and the badges conceded, each against last year, the best year and the average; then each gym,
// each Elite Four seat and the Champion's, the year's ten furthest challengers and every run at the Elite Four.
// It opens at New Year (it replaced the year in review) and any year can be opened from it or the History page.
let repYear = null; // the year shown; null is the latest
// (0.15.0) every League's year side by side in the year report, with the world's average
// (0.17.0) the year's contenders: the League's own, sent at others, and those other Leagues sent at it
function sponPanel(h) {
  const x = h.spon; if (!x || (!x.out.length && !x.at.length)) return '';
  const row = (r, other) => `<tr><td>${tname(r[0])}</td><td class="small">${esc(leagueName(other))}</td><td class="num">${r[3]}</td><td class="small">${r[4] ? depthName(r[4]) : '—'}</td><td class="num">${r[5]}</td><td class="num">${r[6]}</td><td class="num">${money(r[7])}</td><td class="small muted">${r[8] ? esc(r[8]) : ''}</td></tr>`;
  const head = w => `<thead><tr><th>Contender</th><th>${w}</th><th>Runs</th><th>Best</th><th>Elite Four</th><th>Titles</th><th>Bounties</th><th></th></tr></thead>`;
  return `<section class="panel"><div class="ph"><h2>Contenders</h2><span class="muted">Sponsored challengers this year</span></div>
    ${x.out.length ? `<h3>Sent by the ${esc(S.lgName)}</h3><div class="scroll"><table class="tbl">${head('Against')}<tbody>${x.out.map(r => row(r, r[2])).join('')}</tbody></table></div>` : ''}
    ${x.at.length ? `<h3>Sent at the ${esc(S.lgName)}</h3><div class="scroll"><table class="tbl">${head('From')}<tbody>${x.at.map(r => row(r, r[1])).join('')}</tbody></table></div>` : ''}</section>`;
}
function otherLeaguesPanel(season) {
  if (nLeagues() < 2) return '';
  const rows = Array.from({ length: nLeagues() }, (_, i) => inLeague(i, () => { const e = S.history.find(x => x.season === season && x.titles != null); return e ? { i, name: S.lgName, let: e.titles, badges: e.badges, best: e.best, runs: e.runs, q: e.qualifiers } : null; })).filter(Boolean);
  if (rows.length < 2) return '';
  const av = k => (rows.reduce((a, r) => a + (r[k] || 0), 0) / rows.length).toFixed(1), me = S.lg || 0;
  return `<section class="panel"><div class="ph"><h2>Every League, Year ${season}</h2><span class="muted">Money and cities are on the League table</span></div><div class="scroll"><table class="tbl"><thead><tr><th>League</th><th>Let through</th><th>Badges conceded</th><th>Furthest</th><th>Runs</th><th>Elite Four runs</th></tr></thead><tbody>
    ${rows.map(r => `<tr${r.i === me ? ' class="me"' : ''}><td>${esc(r.name)}</td><td class="num">${r.let}</td><td class="num">${r.badges}</td><td class="small">${depthName(r.best || 0)}</td><td class="num">${r.runs}</td><td class="num">${r.q}</td></tr>`).join('')}
    <tr class="muted"><td>World average</td><td class="num">${av('let')}</td><td class="num">${av('badges')}</td><td></td><td class="num">${av('runs')}</td><td class="num">${av('q')}</td></tr></tbody></table></div></section>`;
}
function viewRecap() {
  const all = S.history.filter(x => x.titles != null);
  if (!all.length) return viewCircuit();
  const at = all.findIndex(x => x.season === repYear), i = at >= 0 ? at : all.length - 1, h = all[i];
  const latest = i === all.length - 1, upTo = all.slice(0, i + 1), prev = all[i - 1];
  const L = latest ? S.lastLeague : null;
  let streak = 0; for (let k = i; k >= 0 && !all[k].titles; k--) streak++;
  const perfect = upTo.filter(x => !x.titles).length;
  const best = upTo.slice().sort((a, b) => a.titles - b.titles || a.badges - b.badges || a.season - b.season)[0];
  // each headline measure against last year, the best year and the average so far (lower is better unless `up`)
  const measures = [['Trainers let through', x => x.titles], ['Badges conceded', x => x.badges], ['Furthest a challenger got', x => x.best, d => depthName(d)],
    ['Runs begun', x => x.runs || 0, null, 0], ['Runs that reached the Elite Four', x => x.qualifiers], ['Runs ended on a third loss', x => x.out, null, 1]];
  const delta = (v, p, up) => { if (p == null || v === p || up === 0) return ''; const good = up ? v > p : v < p; return ` <span class="small ${good ? 'dgood' : 'dbad'}">${v > p ? '▲' : '▼'}${Math.abs(v - p)}</span>`; };
  const cmp = `<div class="scroll"><table class="tbl"><thead><tr><th></th><th>Year ${h.season}</th><th>Last</th><th>Best${best ? ` <span class="muted small">(Y${best.season})</span>` : ''}</th><th>Average <span class="muted small">(${upTo.length} yr${upTo.length === 1 ? '' : 's'})</span></th></tr></thead><tbody>
    ${measures.map(([label, f, fmt, up]) => { const v = f(h), w = fmt || (x => x), p = prev ? f(prev) : null;
      return `<tr><td>${label}</td><td><b>${w(v)}</b>${fmt ? '' : delta(v, p, up)}</td><td>${prev ? w(p) : '<span class="muted">—</span>'}</td><td>${best === h ? '<span class="tag gold">this year</span>' : w(f(best))}</td><td class="num">${fmt ? '' : (upTo.reduce((a, x) => a + f(x), 0) / upTo.length).toFixed(1)}</td></tr>`; }).join('')}
    </tbody></table></div>`;
  const won = (h.runsE4 || []).filter(r => r[2] === 5);
  const names = ids => ids.filter(id => T(id)).map(tname).join(', ');
  // gyms: the leader at year's end and anyone else who led it, the gym trainers, tries turned back and badges conceded
  const watchFor = g => (S.lg || 0) === ME() ? (S.gyms[g] && S.gyms[g].watch || []).map((r, k) => ({ r, k })).filter(x => x.r.when && x.r.when.season === h.season) : [];
  const gymRows = (h.gyms || []).map((g, k) => { const tb = g.wl + g.wt, n = tb + g.l, also = g.lead.filter(id => id !== g.leader), w = watchFor(k);
    return `<tr><td class="num">${k + 1}</td><td>${townName(k)}<div class="muted small">${g.type || '—'}</div>${h.steers ? `<div class="muted small">${steerName((h.steers.posts || {})['gym:' + k] || h.steers.line)}</div>` : ''}</td><td>${g.leader != null && T(g.leader) ? tname(g.leader) : '—'}${g.acting ? ' <span class="tag">acting</span>' : ''}${g.poor ? ' ' + poorTag(g.poor) : ''}${also.length ? `<div class="muted small">also led by ${names(also)}</div>` : ''}<div class="muted small">Gym trainers: ${names(g.gt) || 'none'}</div></td>
      <td class="num">${g.wt}</td><td class="num">${g.wl}</td><td class="num">${g.l}</td><td class="num">${n ? Math.round(100 * tb / n) + '%' : '—'}</td>
      ${[0, 1, 2].map(k => { const x = (g.sb || [])[k] || [0, 0]; return `<td class="num small" title="${BAND_NAMES[k]}: ${x[1]} of ${x[0]} tries held">${x[0] ? `${Math.round(100 * x[1] / x[0])}%<div class="muted">of ${x[0]}</div>` : '<span class="muted">—</span>'}</td>`; }).join('')}
      <td>${w.map(x => `<button class="btn small" data-act="watchgym" data-g="${k}" data-i="${x.k}">${esc(x.r.sides[0].name)}</button>`).join(' ')}</td></tr>`; }).join('');
  const seatName = k => k < 4 ? `Elite Four #${k + 1}` : 'Champion';
  const seatRows = (h.seats || []).map((st, k) => { const also = st.held.filter(id => id !== st.id);
    return `<tr><td>${seatName(k)}</td><td>${st.id != null && T(st.id) ? tname(st.id) : '—'}${st.acting ? ' <span class="tag">acting</span>' : ''}${(st.poor || 0) >= 2 ? ' ' + e4PoorTag(st.poor) : ''}${also.length ? `<div class="muted small">also held by ${names(also)}</div>` : ''}</td><td class="small">${st.type || '—'}${h.steers ? `<div class="muted">${steerName((h.steers.posts || {})[k < 4 ? 'e4:' + k : 'champion'] || h.steers.line)}</div>` : ''}</td><td class="num">${st.faced}</td><td class="num">${st.stopped}</td><td class="num">${st.faced - st.stopped}</td></tr>`; }).join('');
  // (0.11.0) the year's seat challenges, held at its New Year, with the battle to watch while it is still kept
  const chalPend = latest ? (S.chalPending || []).filter(x => x.season === h.season) : [];
  const chalRows = (h.chal || []).map(c => { const li = (S.seatLogs || []).findIndex(r => r.at === c.at && r.cand === c.cand);
    return `<tr><td>${c.k === 'champ' ? 'Champion' : `Elite Four #${c.slot + 1}`}</td><td>${tname(c.cand)}<div class="muted small">${c.from === 'claim' ? 'title claim' : c.called ? `called by you · ${callFrom(c)}` : c.k === 'champ' ? `Elite Four #${c.slot + 1}` : c.from === 'leader' ? `${townName(c.gym)} Gym Leader` : 'after a run to the Elite Four'}</div></td><td>${tname(c.inc)}</td><td>${c.offered ? '<span class="tag">took a post instead</span>' : c.lapsed ? '<span class="muted">lapsed</span>' : c.unanswered ? '<span class="tag">lapsed unanswered</span>' : c.calledOff ? '<span class="muted">called off</span>' : c.refused ? `<span class="tag">${c.from === 'claim' ? 'turned down' : 'refused by you'}</span>` : c.won ? '<span class="tag notice">challenger won</span>' : '<span class="tag gold">defended</span>'}</td><td>${li >= 0 ? `<button class="btn small" data-act="watchseat" data-i="${li}">Watch</button>` : ''}</td></tr>`; }).join('')
    + chalPend.map(x => `<tr><td>${x.k === 'champ' ? 'Champion' : `Elite Four #${x.slot + 1}`}</td><td>${tname(x.cand)}</td><td>${tname(x.inc)}</td><td><span class="tag notice">waiting for you</span></td><td></td></tr>`).join('');
  const stageCells = s => [0, 1, 2, 3, 4].map(k => `<td class="st ${s > k ? 'w' : s === k ? 'l' : ''}">${s > k ? 'W' : s === k ? 'L' : ''}</td>`).join('');
  const nav = `<div class="segs setup-segs">${i > 0 ? `<button class="seg" data-act="repyear" data-v="${all[i - 1].season}">‹ Year ${all[i - 1].season}</button>` : ''}<button class="seg on" aria-pressed="true">Year ${h.season}</button>${!latest ? `<button class="seg" data-act="repyear" data-v="${all[i + 1].season}">Year ${all[i + 1].season} ›</button><button class="seg" data-act="repyear" data-v="latest">Latest</button>` : ''}</div>`;
  const ran = latest ? Object.values(S.trainers).filter(t => inLg(t) && S.progress && S.progress[t.id] && ['challenger', ...STAFF_ROLES].includes(t.role)).sort((a, b) => S.progress[b.id].after.ovr - S.progress[a.id].after.ovr).slice(0, 12) : [];
  return `${latest ? worldPanel() : ''}${nav}${otherLeaguesPanel(h.season)}${sponPanel(h)}<div class="grid-office"><div class="col">
    <section class="panel callout"><div class="eyebrow">Year ${h.season} report${nLeagues() > 1 ? ' · ' + esc(S.lgName) : ''}${h.name && h.name !== S.lgName ? ` (then the ${esc(h.name)})` : ''}</div>
      <h2>${h.titles ? `${h.titles} trainer${h.titles === 1 ? '' : 's'} let through` : 'A perfect year'}</h2>
      <p>${h.titles ? `${won.length ? won.map(r => `${tname(r[0])} <span class="muted small">${weekShort(r[1])}</span>`).join(', ') : names(h.winners)} beat the Champion. ` : 'Nobody took the title. '}${streak ? `<b>${streak}</b> perfect year${streak === 1 ? '' : 's'} in a row. ` : ''}${perfect !== streak ? `<b>${perfect}</b> perfect year${perfect === 1 ? '' : 's'} in ${upTo.length}.` : ''}
      ${h.bestId && T(h.bestId) ? `${tname(h.bestId)} got furthest (${depthName(h.best)}). ` : ''}${h.badges} badges conceded over ${h.runs} runs; ${h.qualifiers} run${h.qualifiers === 1 ? '' : 's'} reached the Elite Four and ${h.out} ended on a third loss at a gym.${h.metaMons && h.metaMons.length ? ` The year's top performers on the circuit: ${h.metaMons.join(', ')}.` : ''}${h.metaTrend && h.metaTrend.length ? ` The trend at the year's end: ${h.metaTrend.join(', ')}.` : ''}${h.steers ? ` League line: ${steerName(h.steers.line)}.` : ''}</p>
      ${L && L.logs.length ? `<div class="logs">${L.logs.map((r, k) => `<button class="btn small" data-act="watch" data-i="${k}" data-y="last">${r.title}: ${r.sides[0].name}</button>`).join('')}</div>` : ''}</section>
    <section class="panel"><div class="ph"><h3>Against other years</h3><span class="muted">Best year: fewest let through, then fewest badges</span></div>${cmp}</section>
  </div><div class="col side">
    <section class="panel"><div class="ph"><h3>Furthest challengers</h3><span class="muted">The year's top ten</span></div>${(h.top || []).length ? `<div class="scroll"><table class="tbl"><thead><tr><th>#</th><th>Trainer</th><th>How far</th><th>Runs</th></tr></thead><tbody>
      ${h.top.map((x, k) => `<tr><td class="num">${k + 1}</td><td>${tname(x[0])}</td><td class="small">${x[1] === 13 ? '<span class="tag notice">won the title</span>' : depthName(x[1])}</td><td class="num">${x[2]}</td></tr>`).join('')}</tbody></table></div>` : '<p class="muted">Nobody ran this year.</p>'}</section>
  </div></div>
    <section class="panel"><div class="ph"><h3>The gyms</h3><span class="muted">Tries turned back by the gym trainers and by the leader, badges conceded, the share of tries the gym held, and that share by the challenger's stage (badges already held)${h.steers ? '. Under each gym: its type and its steer at the year\'s end' : ''}</span></div>
      <div class="scroll"><table class="tbl"><thead><tr><th>#</th><th>Gym</th><th>Leader and gym trainers</th><th>Trainers</th><th>Leader</th><th>Badges</th><th>Held</th><th title="${BAND_NAMES[0]}">Early</th><th title="${BAND_NAMES[1]}">Mid</th><th title="${BAND_NAMES[2]}">Late</th><th></th></tr></thead><tbody>${gymRows}</tbody></table></div></section>
    <section class="panel"><div class="ph"><h3>The Elite Four and the Champion</h3><span class="muted">One run: a loss anywhere ends it</span></div>
      <div class="scroll"><table class="tbl"><thead><tr><th>Seat</th><th>Held by</th><th>Type</th><th>Runs faced</th><th>Stopped</th><th>Got past</th></tr></thead><tbody>${seatRows}</tbody></table></div></section>
    ${latest && chalPend.length && (S.lg || 0) === ME() ? `<section class="panel callout warnbox">${chalNotice()}</section>` : ''}
    <section class="panel"><div class="ph"><h3>Seat challenges</h3><span class="muted">At New Year: at most one for an Elite Four seat (and a title claim); in your League the Champion's seat is challenged when you call it</span></div>
      ${chalRows ? `<div class="scroll"><table class="tbl"><thead><tr><th>Seat</th><th>Challenger</th><th>Holder</th><th>Result</th><th></th></tr></thead><tbody>${chalRows}</tbody></table></div>` : '<p class="muted">No seat challenges.</p>'}</section>
  <div class="grid-office"><div class="col">
    <section class="panel"><div class="ph"><h3>Runs at the Elite Four</h3></div>${(h.runsE4 || []).length ? `<div class="scroll"><table class="tbl"><thead><tr><th>When</th><th>Trainer</th><th>E4 #1</th><th>#2</th><th>#3</th><th>#4</th><th>Final</th></tr></thead><tbody>
      ${h.runsE4.map(r => `<tr><td class="small">${weekShort(r[1])}</td><td>${tname(r[0])}</td>${stageCells(r[2])}</tr>`).join('')}</tbody></table></div>` : '<p class="muted">Nobody completed the badge circuit.</p>'}</section>
    ${awardsPanel(h)}
    ${latest ? `<section class="panel"><div class="ph"><h3>How the world changed</h3></div><ul class="changes">${(S.changes || []).map(c => `<li>${c}</li>`).join('') || '<li>A quiet year.</li>'}</ul></section>` : ''}
  </div><div class="col side">
    ${latest ? `<section class="panel"><div class="ph"><h3>Development</h3><span class="muted">Highest rated, on their birthday last year</span></div>${ran.map(t => { const p = S.progress[t.id]; return `<div class="devrow"><div>${tname(t.id)}<div class="muted small">Age ${t.age}</div></div><div class="ovr-change"><span>${p.before.ovr}</span><span class="arrow">→</span><b>${p.after.ovr}</b></div></div>`; }).join('') || '<p class="muted">No trainers.</p>'}</section>` : ''}
  </div></div>`;
}

// ---------- World Championship ----------
function worldPanel() {
  const W = S.worlds; if (!W) return '';
  const row = m => { const w = m.winner, l = w === m.a ? m.b : m.a; const i = W.matches.indexOf(m);
    return `<li><span class="eyebrow">${m.round}</span> ${tname(w)} <span class="muted small">${leagueName(lgOf(T(w)))}</span> beat ${tname(l)} <span class="muted small">${leagueName(lgOf(T(l)))}</span> <button class="btn small" data-act="watchworld" data-i="${i}">Watch</button></li>`; };
  return `<section class="panel callout world"><div class="eyebrow">World Championship · Year ${W.season}</div><h2>${tname(W.winner)} is World Champion</h2>
    <p>The ${W.entrants.length} League Champions met at New Year, at equal level. The titles at home are not at stake.</p>
    <ul class="worldlist">${W.matches.map(row).join('')}</ul></section>`;
}
function worldHistory() {
  const wh = (S.worldHist || []).slice().reverse(); if (!wh.length) return '';
  return `<section class="panel"><div class="ph"><h2>World Championship</h2></div><div class="scroll"><table class="tbl"><thead><tr><th>Year</th><th>World Champion</th><th>League</th><th>Runner-up</th><th>League</th></tr></thead><tbody>
    ${wh.map(x => `<tr><td class="num">${x.season}</td><td>${tname(x.winner)}</td><td>${leagueName(x.winnerLg)}</td><td>${tname(x.runner)}</td><td>${leagueName(x.runnerLg)}</td></tr>`).join('')}</tbody></table></div></section>`;
}
// ---------- League banlist (v194) ----------
// what's banned now, League by League
function banCard() {
  if (!featOn('banlist')) return '';
  const rows = Array.from({ length: nLeagues() }, (_, i) => ({ i, bans: bansIn(i) })).filter(x => x.bans.length);
  if (!rows.length) return '';
  return `<section class="panel"><div class="ph"><h3>Banlist</h3><span class="muted">Year ${curSeason()}</span></div>
    ${rows.map(x => `<p class="small">${nLeagues() > 1 ? `<b>${lgShort(x.i)}</b> · ` : ''}${x.bans.map(b => `${monFace(b.sp, false, 22)} ${b.sp} <span class="muted">(through S${b.season + (b.len || BAN_MAX_SEASONS)})</span>`).join(', ')}</p>`).join('')}
    <p class="fine">Banned for everyone in that League until its year shown. The League's trainers vote on new bans each New Year.</p></section>`;
}
// ---------- modals ----------
function renderModal() {
  const root = $('#modal');
  if (!modal) { root.hidden = true; root.innerHTML = ''; return; }
  root.hidden = false;
  let body = '';
  if (modal.kind === 'mon') body = monBody();
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
    return `<li>${T(p.id) ? tname(p.id) : p.name} · ${p.to == null ? `Year ${p.from}–now` : p.from === p.to ? `Year ${p.from}` : `Years ${p.from}–${p.to}`} · <b>${x.w}–${x.l}</b>, ${x.ko} KOs${p.to != null && p.why ? ` <span class="muted small">(${p.why})</span>` : ''}</li>`; }).join('');
  const where = here.t ? (m.leg && m.leg.until != null ? `With ${tname(here.t.id)} until the end of Year ${m.leg.until}, then it moves on.` : `With ${tname(here.t.id)}.`)
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
  const met = m.met ? `${HOW[m.met.how] || m.met.how}${m.met.how === 'caught' ? ` in Year ${m.met.season}, week ${m.met.week}` : ` · Year ${m.met.season}`}` : 'Origin not recorded';
  const metFull = met + (m.rejoined && m.rejoined.length ? m.rejoined.map(r => ` · back on the team in Year ${r.season} (for ${r.for})`).join('') : '');
  return `<div class="mh"><h2>${m.sp}</h2><button class="btn icon" data-act="close" aria-label="Close">×</button></div>
    <div class="moncard"><div class="monpic">${monFace(m.sp, m.shiny || m.radiant, IMG_PX, 'big')}${monImgBtns(m.sp)}</div>
      <div><div>${chips(monTypes(m))}${s.legend ? ' <span class="tag legend">Legendary</span>' : ''}${s.paradox ? ' <span class="tag paradox">Paradox</span>' : ''}${babyTag(s)}${megaTag(m)}${m.shiny ? ' <span class="tag shiny">✦ Shiny</span>' : ''}${m.radiant ? ' <span class="tag radiant" title="Radiant: shiny colors, at least Good IVs and a stronger ability than its species ever gets">✧ Radiant</span>' : ''}${m.delta ? ' <span class="tag delta" title="Delta Pokémon: an unusual ' + m.delta + ' type">Δ Delta</span>' : ''}${m.alpha ? ' <span class="tag alpha">Alpha</span>' : ''}${condTags(m)}</div><div class="muted small">${modal.alum != null ? 'Formerly with' : 'Lv ' + lvShow(m) + ' · with'} ${tname(t.id)} · BST ${s.bst}</div><div class="muted small">${metFull}${modal.alum != null ? ` · left in Year ${m.left} (${m.why})` : ''}</div></div></div>
    ${m.iv ? monProfile(m, modal.alum != null && !here) : ''}
    ${here ? legendPartners(m, here) : ''}
    ${ss ? `<section class="panel"><div class="ph"><h3>Year ${S.season}</h3></div>${tiles(ss)}</section>` : ''}
    <section class="panel"><div class="ph"><h3>${m.partners ? 'Lifetime' : `Career with ${t.name}`}</h3></div>${tiles(st)}
      <div class="split"><span>Gym battles <b>${st.gw}–${st.gl}</b></span><span>League &amp; title <b>${st.lw}–${st.ll}</b></span><span>Led <b>${st.lead || 0}</b> of ${st.b} battles</span><span>Damage dealt <b>${st.dmg.toLocaleString()}</b> HP</span>${m.best ? `<span>Best battle <b>${m.best} KOs</b></span>` : ''}${sweepsOf(m) ? `<span>6-0 sweeps <b>${sweepsOf(m)}</b></span>` : ''}${m.megas ? `<span>Mega Evolutions <b>${m.megas}</b></span>` : ''}${(m.awards || []).length ? `<span>${m.awards.map(x => `<b>${AWARDS[x.k].name}</b> S${x.season}${lgIn(x.lg) ? ' · ' + lgIn(x.lg) : ''}`).join(', ')}</span>` : ''}${m.bonds ? `<span>Battle Bond transformations <b>${m.bonds}</b></span>` : ''}</div></section>
    ${m.evoLog && m.evoLog.length ? `<section class="panel"><div class="ph"><h3>Evolutions</h3></div><ul class="changes">${m.evoLog.map(e => `<li>${e.from} → <b>${e.to}</b> at Lv ${e.lvl}, Year ${e.season}</li>`).join('')}</ul></section>` : ''}
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
    return `<div class="mh"><h2>${m.done ? `Simulated ${m.log.length} year${m.log.length === 1 ? '' : 's'}` : `Simulating… ${m.log.length} of ${m.n}`}</h2>${m.done ? '<button class="btn icon" data-act="simmanyclose" aria-label="Close">×</button>' : ''}</div>
      <div class="simbar" role="progressbar" aria-valuemin="0" aria-valuemax="${m.n}" aria-valuenow="${m.log.length}"><i style="width:${pct}%"></i></div>
      ${m.stopped ? '<p class="muted small">Stopped early. You pick up at New Year.</p>' : ''}
      ${m.failed ? `<p class="warn">Something went wrong during Year ${m.failed.season}, so the sim stopped. Everything up to that point is saved. If it happens again, please report this message: <span class="small">${esc(m.failed.msg).slice(0, 200)}</span></p>` : ''}
      ${rows ? `<div class="scroll"><table class="tbl"><thead><tr><th>Year</th><th>Champion${nLeagues() > 1 ? ' · ' + S.lgName : ''}</th><th>Titles</th><th>Badges conceded</th><th>Reached the Elite Four</th></tr></thead><tbody>${rows}</tbody></table></div>` : ''}
      <div class="confirm-row">${m.done ? `<button class="btn primary" data-act="simmanyclose">Continue in Year ${S.season}</button><button class="btn" data-act="simmanyrecords">See records</button>` : '<button class="btn" data-act="simmanystop">Stop at the next New Year</button>'}</div>`;
  }
  const n = m.n || 5;
  return `<div class="mh"><h2>Sim multiple years</h2><button class="btn icon" data-act="close" aria-label="Close">×</button></div>
    <p>Plays whole years in one go without stopping for anything, then stops at a New Year. Any post that falls vacant on the way is filled for you.</p>
    <div class="eyebrow">Years</div><div class="segs setup-segs sim-n">${SIM_CHOICES.map(k => `<button class="seg${n === k ? ' on' : ''}" data-act="simmanyn" data-v="${k}" aria-pressed="${n === k}">${k}</button>`).join('')}</div>
    ${S.week > 0 ? `<p class="muted small">It is ${weekName(S.week)} of Year ${S.season}, so the rest of this year counts as the first year.</p>` : ''}
    ${n >= 10 || simSaveBig() ? `<p class="warn small">Planning to sim far ahead? Saves grow every year, and browsers only keep a few megabytes per site${simSaveBig() ? ' (this league is already large)' : ''}. If the save gets too big for this browser, the game tells you and stops saving here. Use Download save file in the menu now and then, so a long league is never lost.</p>` : ''}
    <p class="muted small">You can't undo it. Copy your save from the menu first if you might want this point back.</p>
    <div class="confirm-row"><button class="btn primary" data-act="simmanygo">Sim ${n} year${n === 1 ? '' : 's'}</button><button class="btn" data-act="close">Cancel</button></div>`;
}
function simManyTick() {
  const m = modal; if (!m || m.kind !== 'simmany' || !m.running) return;
  let h;
  // if a year ever fails, stop and say so (progress so far is kept) instead of hanging on "Simulating…"
  // nobody is there to choose, so posts that fall vacant are filled for the player as the years go by
  try { approveAllChallenges(); fillAllVacancies(); h = simYear(); if (!S.founding) { approveAllChallenges(); fillAllVacancies(); } }
  catch (e) { m.running = false; m.done = true; m.failed = { season: S.season, msg: String(e && e.message || e) }; save(); view = 'circuit'; render(); renderModal(); return; }
  if (h) m.log.push(h);
  save();
  if (m.log.length >= m.n || m.stopRequested || S.founding) { // (0.18.0) a folded League stops the sim for founding
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
