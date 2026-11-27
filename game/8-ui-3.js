// ---------- contracts (0.52.0) ----------
// the length picked on the hiring pages (null: whatever each candidate prefers)
let hireLen = null;
function conRow(post) {
  const opts = conOpts(post), cur = opts.includes(hireLen) ? hireLen : null;
  return `<div class="segs conlen"><button class="seg${cur == null ? ' on' : ''}" data-act="hirelen" data-v="" aria-pressed="${cur == null}">Their preference</button>${opts.map(w => `<button class="seg${cur === w ? ' on' : ''}" data-act="hirelen" data-v="${w}" aria-pressed="${cur === w}">${conWords(w)}</button>`).join('')}</div><p class="small muted">Contract length for anyone new to your staff (staff you move keep theirs). Each trainer prefers a length: stay-put types long deals, those after a bigger post short ones. Every step away from it makes an offer likelier to be turned down and adds ${CON_PAY * 100}% to their pay.</p>`;
}
const conPrefTag = (t, post) => { const w = conPref(t, post, true), miss = conOpts(post).includes(hireLen) ? conMiss(t, post, hireLen) : 0; return ` <span class="tag small${miss ? ' notice' : ''}" title="${miss ? `${miss} step${miss === 1 ? '' : 's'} from what they want: less likely to accept, ${CON_PAY * 100 * miss}% more pay` : 'The length they would rather sign for'}">Prefers ${conWords(w)}</span>`; };
// set the length on a candidate before an offer or install (true, so it can sit in an && chain)
function hireLenFor(id, post) { const t = T(id); if (t) setConAsk(id, conOpts(post).includes(hireLen) ? hireLen : conPref(t, post, true)); return true; }
// a staff row's contract: its end, and its renewal state
function conInfo(t) {
  const c = t && t.con; if (!c || t.acting || !handOn()) return '';
  const win = !conShort(c.post) && c.win != null && c.from <= S.turn && S.turn < c.until;
  const st = win ? (c.will === 'no' ? ' <span class="tag notice small">Won\'t renew</span>' : c.will === 'more' ? ` <span class="tag notice small">Asks +${CON_MORE * 100}% to renew</span>` : ' <span class="tag notice small">Up for renewal</span>') : c.go ? ' <span class="tag small">Goes at the end</span>' : '';
  const tk = (t.talk != null ? ' <span class="tag notice small">In talks</span>' : '') + (t.talkSigned != null && S.turn - t.talkSigned < TALK_NEW_WEEKS ? ` <span class="tag small talkres won">Signed in talks ${turnDate(t.talkSigned)}</span>` : ''); // (0.56.0)
  return ` · contract to ${turnDate(c.until)}${c.from > S.turn ? ' (renewed)' : ''}${st}${tk}`;
}
function conActs(t) {
  const c = t && t.con; if (!c || t.acting || !handOn() || (S.lg || 0) !== ME()) return '';
  if (conShort(c.post)) return ` <button class="btn small" data-act="congo" data-id="${t.id}" title="${c.go ? 'Keep them on: the contract renews as usual' : 'Let them go when the contract ends'}">${c.go ? 'Keep on' : 'Let it run out'}</button>`;
  if (c.win == null || c.from > S.turn || S.turn >= c.until || c.will === 'no') return '';
  return `<div class="segs small">${CON_SENIOR.map(w => `<button class="seg" data-act="conrenew" data-id="${t.id}" data-v="${w}">Renew ${conWords(w)}</button>`).join('')}</div>`;
}
function conNotice(list) {
  if (!list.length) return '';
  return `<div class="eyebrow">Contracts up for renewal</div><ul class="mini">${list.map(t => `<li><span>${tname(t.id)}&nbsp;· ${postName(t)} <span class="small">${t.con.will === 'no' ? 'won\'t renew' : t.con.will === 'more' ? `restless: asks ${CON_MORE * 100}% more pay` : 'happy to renew'}</span></span><span class="small">ends ${turnDate(t.con.until)}</span></li>`).join('')}</ul><p class="muted small">Renew from Your staff (prefers ${list.filter(t => t.con.will !== 'no').map(t => `${esc(t.name)} ${conWords(conPref(t, t.con.post))}`).join(', ') || 'nobody willing'}). A contract not renewed ends on its date: they return to the circuit (unhappy if restless) or retire, and the post opens.</p>`;
}
GLOSS_TERMS.league.push(['Contracts', `Everyone who takes a post signs a contract: Gym Leaders, the Elite Four and the Champion for 1 to 4 years, gym trainers for 3, 6 or 9 months. You pick the length when you hire (Their preference by default). Each trainer prefers one: those who want to stay put like long deals, those after a bigger post short ones; every step away from it makes an offer likelier to be turned down and adds ${CON_PAY * 100}% to their pay. Staff you move between posts keep their contract (a gym trainer moving up signs a new one). A contract holds against ambition: a member of staff tired of waiting for promotion, or asking for another run, stays until it ends, though their restlessness shows. For the last ${CON_WINDOW} weeks only your League can renew it, from Your staff: a content member renews at the length you pick; a restless one asks ${CON_MORE * 100}% more pay (and starts their wait afresh) or won't renew. A contract not renewed ends on its date: they go back to the circuit, holding a grudge if they were restless, or retire, and the post opens. Gym trainers renew quietly unless you mark them to go (Let it run out) or they are restless. You can still let anyone go early (severance), and staff still leave when unpaid in the red, take a bigger post in another League, step down after a long career, or (the Champion) step down. Rival Leagues renew by aim, and the multi-year sim renews yours.`]); // (0.52.0)
// ---------- talks (0.53.0, design doc 6.24 part 2) ----------
// The Talks page (Manage): open talks for stars, for staff whose contracts ran out, and rivals going after your staff
// (the Retention stop). One offer per talks, changed any week; Scouting decides how much of other offers you see.
let talkDraft = {};
// (0.59.0) what came of your last offer in each talks, shown on its panel until the next try (a toast is easy to miss)
let talkNote = {};
const TALK_KINDS = { star: 'Star', expiry: 'Contract ran out', poach: 'Under contract', champ: 'Wants a bigger seat' };
const bidWords = b => b ? `+${Math.round(b * 100)}% pay` : 'their asking pay';
const bonusWords = w => w ? `${w} weeks' pay up front` : 'no bonus';
function talkPostOpts(k, t) {
  if (k.home === ME()) { const p = postOf(t); return p ? [[`${p.post}:${p.slot}`, `${postName(t)} (their post)`]] : []; }
  if (t.role === 'champion') { const h = T(S.champion); return seatOpening() ? [['champion:0', `Your ${postWord('champion')}'s seat${h ? ` (${h.name} is leaving)` : ' (vacant)'}`]] : []; } // (0.54.0)
  const out = [];
  S.e4.forEach((id, i) => { const h = T(id); out.push([`e4:${i}`, `Elite Four seat #${i + 1}${!h || h.acting ? ' (vacant)' : ` (replaces ${h.name}, OVR ${ovr(h)})`}`]); });
  S.gyms.forEach((g, i) => { const h = T(g.leader); out.push([`leader:${i}`, `${townName(i)} Gym${!h || g.acting ? ' (vacant)' : ` (replaces ${h.name}, OVR ${ovr(h)})`}`]); });
  return out;
}
function talkDraftOf(k, t) {
  if (talkDraft[k.id]) return talkDraft[k.id];
  const mine = k.offers.find(o => o.lg === ME()), opts = talkPostOpts(k, t);
  const vac = opts.find(x => /vacant/.test(x[1])) || opts.find(x => x[0].startsWith(ovr(t) >= E4_HIRE_MIN ? 'e4' : 'leader')) || opts[0];
  const d = mine ? { post: `${mine.post}:${mine.slot}`, bid: mine.bid, bonus: mine.bonus, len: mine.len, prom: mine.prom.slice() } : { post: vac ? vac[0] : '', bid: 0, bonus: 0, len: null, prom: [] };
  if (d.len == null && d.post) d.len = conPref(t, d.post.split(':')[0], k.home !== ME());
  return (talkDraft[k.id] = d);
}
const draftOffer = d => { const [post, slot] = (d.post || ':').split(':'); return { lg: ME(), post, slot: +slot, bid: d.bid, bonus: d.bonus, len: d.len, prom: d.prom.slice() }; };
// what you can see of another League's offer, by your scouting
function seenOffer(t, k, o, sight, need) {
  const name = `the ${esc(leagueName(o.lg))}`;
  if (sight <= 0) return `${name} is interested`;
  const rough = sight === 1;
  const pay = rough ? (o.bid ? 'over their asking pay' : 'their asking pay') : bidWords(o.bid), bonus = rough ? (o.bonus ? 'a bonus' : 'no bonus') : bonusWords(o.bonus);
  let s = `${name}: ${o.post === 'champion' ? 'their Champion\'s seat' : o.post === 'e4' ? (rough ? 'an Elite Four seat' : `Elite Four seat #${o.slot + 1}`) : (rough ? 'a gym' : offerWords(o))}, ${pay}, ${bonus}${rough ? '' : `, ${conWords(o.len)}${o.prom.length ? `, promises: ${o.prom.map(x => PROMISES[x].toLowerCase()).join('; ')}` : ''}`}`;
  if (sight >= 3) s += ` ${interestBar(talkInterest(t, k, o), need)}`;
  return s;
}
function interestBar(v, need) { const p = clamp(Math.round(50 + (v - need) * 40), 2, 100); return `<span class="hbar" title="Their interest against what they need (the middle)"><span style="width:${p}%"></span></span>`; }
function talkPanel(k, sight) {
  const t = T(k.tid); if (!t) return '';
  const me = ME(), mine = k.offers.find(o => o.lg === me), others = k.offers.filter(o => o.lg !== me), need = talkNeed(t, k), lead = k.lead;
  const d = talkDraftOf(k, t), opts = talkPostOpts(k, t), dp = (d.post || ':').split(':')[0], o = d.post ? draftOffer(d) : null;
  const where = STAFF_ROLES.includes(t.role) ? `${inLeague(homeLeague(t), () => postName(t))} of the ${esc(leagueName(homeLeague(t)))}` : `a challenger on the ${esc(leagueName(lgOf(t)))} circuit`;
  const status = mine ? (lead === me ? '<span class="tag good small">Leading</span>' : '<span class="tag notice small">Behind</span>') + (sight >= 3 ? ` ${interestBar(talkInterest(t, k, mine), need)}` : '') : '';
  const retain = k.kind === 'poach' && k.home === me, best = retain ? talkRank(k).find(x => x.o.lg !== me) : null;
  const sel = (f, list, cur) => `<select class="talkf" data-k="${k.id}" data-f="${f}" aria-label="${f}">${list.map(([v, n]) => `<option value="${v}"${String(cur) === String(v) ? ' selected' : ''}>${esc(n)}</option>`).join('')}</select>`;
  const lens = dp ? conOpts(dp).map(w => [w, conWords(w) + (w === conPref(t, dp, k.home !== me) ? ' (they prefer)' : '')]) : [];
  const promBox = Object.entries(PROMISES).filter(([x]) => x !== 'legend' || (dp === 'e4' && (S.vault || []).some(e => e.m))).filter(([x]) => k.home !== me || x !== 'legend').map(([x, n]) => `<label class="small"><input type="checkbox" class="talkf" data-k="${k.id}" data-f="prom" data-v="${x}"${d.prom.includes(x) ? ' checked' : ''}> ${esc(n)}</label>`).join(' ');
  const pay = o && dp ? talkPay(t, o) : 0, bonus = o && dp ? talkBonus(t, o) : 0;
  return `<section class="panel talk" data-talk="${k.id}"><div class="ph"><h2>${tname(t.id)} <span class="tag small">${TALK_KINDS[k.kind]}</span></h2><span class="muted">OVR ${ovr(t)} · age ${t.age} · ${where} · ends ${turnDate(k.until)}${k.ext ? ' (extended)' : ''}</span></div>
    ${k.why ? `<p class="small muted">${esc(k.why)}.</p>` : ''}
    ${retain && best ? `<p class="warn">The ${esc(leagueName(best.o.lg))} offers ${tname(t.id)} ${offerWords(best.o)}, ${bidWords(best.o.bid)}, ${bonusWords(best.o.bonus)}, ${conWords(best.o.len)}. Match it in their post, beat it below, or let them go now for a transfer fee of about ${money(talkFee(t, best.o))}.</p><div class="confirm-row"><button class="btn small" data-act="talkmatch" data-id="${t.id}">Match</button> <button class="btn small ghost" data-act="talklet" data-id="${t.id}">Let them go (${money(talkFee(t, best.o))})</button></div>` : ''}
    <p class="small"><b>Other offers:</b> ${others.length ? others.map(x => seenOffer(t, k, x, sight, need)).join('; ') : 'none yet'}${others.length && lead != null && lead !== me ? `. The ${esc(leagueName(lead))} leads` : ''}.</p>
    ${mine ? `<p class="small"><b>Your offer:</b> ${offerWords(mine)}, ${bidWords(mine.bid)} (${money(talkPay(t, mine))} a week), ${bonusWords(mine.bonus)}${mine.bonus ? ` (${money(talkBonus(t, mine))})` : ''}, ${conWords(mine.len)}${mine.prom.length ? `; you promise: ${mine.prom.map(x => PROMISES[x].toLowerCase()).join('; ')}` : ''} ${status}</p>` : ''}
    ${!opts.length && t.role === 'champion' && k.home !== me ? '<p class="small muted">Only a League whose Champion is leaving (stepping down or under notice) can offer its seat to a Champion.</p>' : ''}
    ${!talkSigns(t, k, me) ? `<p class="small warn">They won't sign for your League: ${esc(prestBlock(t, me) || 'not open to your offers')}. An offer can't be made until your prestige reaches their minimum.${others.length ? '' : ' No other League has made an offer either, most likely for the same reason.'}</p>` : ''}
    ${opts.length ? `<div class="confirm-row">${sel('post', opts, d.post)} ${sel('bid', TALK_BIDS.map(b => [b, bidWords(b)]), d.bid)} ${sel('bonus', TALK_BONUS.map(w => [w, bonusWords(w)]), d.bonus)} ${lens.length ? sel('len', lens, d.len) : ''}</div>
    <div class="confirm-row">${promBox}</div>
    <p class="small muted">${dp ? `They ask ${money(talkAsk(t, o))} a week for it: this offer pays ${money(pay)}${bonus ? ` and ${money(bonus)} up front` : ''}.` : ''}</p>
    ${talkNote[k.id] ? `<p class="small ${talkNote[k.id].bad ? 'warn' : 'good'}">${esc(talkNote[k.id].text)}</p>` : ''}
    <div class="confirm-row"><button class="btn small" data-act="talkoffer" data-k="${k.id}">${mine ? 'Change your offer' : k.home === me ? 'Offer to keep them' : 'Make an offer'}</button>${mine ? ` <button class="btn small ghost" data-act="talkwd" data-k="${k.id}">Withdraw</button>` : ''}</div>` : ''}</section>`;
}
function viewTalks() { return inLeague(ME(), viewTalks0); }
// (0.56.0) how your talks came out: Won / Kept in green, Lost / Left in red, the rest plain; new ones flagged until seen
const TALK_NEW_WEEKS = 8;
const talkResCls = r => TALK_RES_GOOD.includes(r) ? 'won' : TALK_RES_BAD.includes(r) ? 'lost' : 'other';
function talkResults() {
  const list = S.talkDone || []; if (!list.length) return '';
  const row = x => `<li class="talkresrow ${talkResCls(x.res)}${x.seen ? '' : ' fresh'}"><span class="tag talkres ${talkResCls(x.res)}">${esc(TALK_RES[x.res])}</span> <span>${x.seen ? '' : '<b class="small">New · </b>'}${S.trainers[x.tid] ? tname(x.tid) : esc(x.name)}: ${esc(x.name && x.text.startsWith(x.name + ' ') ? x.text.slice(x.name.length + 1) : x.text)}</span> <span class="small muted">${esc(turnDate(x.at))}</span></li>`;
  const fresh = list.filter(x => !x.seen);
  return `<section class="panel${fresh.length ? ' callout' : ''}"><div class="ph"><h2>Results</h2><span class="muted">${fresh.length ? `${fresh.length} new` : `your last ${list.length} talks`}</span></div><ul class="mini talkreslist">${list.map(row).join('')}</ul></section>`;
}
function viewTalks0() { const h = viewTalks1(); for (const x of S.talkDone || []) x.seen = true; return h; }
function viewTalks1() {
  const me = ME(), sight = talkSight(), ks = talksForMe();
  const own = ks.filter(k => k.home === me), rest = ks.filter(k => k.home !== me);
  const sightText = ['you only see which Leagues are interested', 'you see roughly what other Leagues offer', 'you see what other Leagues offer', 'you see what other Leagues offer and how keen the trainer is on each'][Math.min(3, sight)];
  return `<section class="panel callout"><div class="eyebrow">${esc(S.lgName)}</div><h2>Talks</h2>
    <p>When a valuable trainer becomes available, talks open with a deadline: a challenger who won a title or reached the Elite Four (at OVR ${TALK_STAR_OVR}+, or anyone you make an offer to from a hiring page), a Gym Leader or Elite Four member whose contract ran out without a renewal (they stay in post until the talks end), staff under contract another League goes after (yours or any other League's), and a Champion whose contract ran out or who wants a bigger League's seat (only a League whose own Champion is leaving can offer them its seat). Any League can make one offer and change it each week: a post (a vacancy, or one whose holder it replaces: they are let go with severance), pay over their asking, a signing bonus, the contract length and promises. At the deadline they sign with the League they like best, if it is enough for them; if nothing is, they may walk away from every League. Talks last 2 to 6 weeks (bigger names longer); a new leader in the last week adds a week, once. The sim stops when you're outbid, a deadline you're in is a week off, or a rival goes after your staff.</p>
    <p class="small">You are in ${talkCount(me)} of at most ${TALK_MAX} talks (besides your own staff's) · bonuses on the table ${money(talkHeld(me))} · your scouting office (level ${sight}): ${sightText}. Nobody makes offers while the League is in the red.</p></section>
    ${talkResults()}
    ${own.length ? `<div class="eyebrow">Your staff</div>${own.map(k => talkPanel(k, sight)).join('')}` : ''}
    ${rest.length ? `<div class="eyebrow">Open talks</div>${rest.map(k => talkPanel(k, sight)).join('')}` : (own.length ? '' : '<section class="panel"><p class="muted">No talks are open now.</p></section>')}`;
}
function talkAction(a, el) {
  const k = talkList().find(x => x.id === +el.dataset.k);
  if (a === 'talkoffer') { if (!k) { toast('Those talks are over.'); render(); return; } const t = T(k.tid), d = talkDraftOf(k, t), err = makeOffer(k, draftOffer(d));
    if (err) { talkNote[k.id] = { bad: true, text: `Offer not made: ${err}` }; toast(talkNote[k.id].text, 6000); }
    else { delete talkDraft[k.id]; save(); talkNote[k.id] = { bad: k.lead !== ME(), text: `Offer made to ${t.name}: ${k.lead === ME() ? 'you lead the talks' : 'another League leads, so raise it to get ahead'}.` }; toast(talkNote[k.id].text); }
    render(); return; }
  if (a === 'talkwd') { if (k && withdrawTalkOffer(k, ME())) { delete talkDraft[k.id]; delete talkNote[k.id]; save(); toast('Offer withdrawn.'); } else toast('There is no offer of yours to withdraw.'); render(); return; }
  if (a === 'talkmatch') { const err = talkMatch(+el.dataset.id); if (err) toast(err); else { save(); toast('You matched the offer.'); } render(); return; }
  if (a === 'talklet') { const t = T(+el.dataset.id), err = talkLetGo(+el.dataset.id); if (err) toast(err); else { save(); toast(`${t.name} leaves for the ${leagueName(homeLeague(t))}.`); } render(); }
}
GLOSS_TERMS.league.push(['Talks', `Competitive negotiations between Leagues, on the Talks page (Manage). Talks open for a challenger who wins a title or reaches the Elite Four at OVR ${TALK_STAR_OVR} or better, when their run ends, and for any star (a title this year or last, or the Elite Four) or other League's member of staff you make an offer to from a hiring page; for a Gym Leader or Elite Four member whose contract ends without a renewal (they stay in post meanwhile); and when another League goes after one of your staff under contract (the Retention stop: match its pay and bonus in their post, beat it, or let them go now for the transfer fee). Talks run 2 to 6 weeks by the trainer's stature (2 when a rival goes after your staff); a new leader in the final week adds a week, once. Each League makes one offer and can change it every week: a Gym Leader's post or an Elite Four seat (a vacancy, or one whose holder it replaces, let go with severance), pay over their asking (up to +75%), a signing bonus (up to 48 weeks' pay), the contract length and promises (no step down or release for 2 years: broken by letting them go, a certain grudge; keeping their own team with no team plan for 2 years; a legendary from your Sanctuary vault with an Elite Four seat). The trainer weighs the pay, the bonus, the post against the one they hold, the length they prefer, promises, your seat rule (an open seat draws the hungry, a protected one those wanting to stay put), their hometown and its Stronghold, prestige, any grudge and their own academy; their own League gets a little loyalty, or less if they were restless. At the deadline they sign with the League they like best if it is enough for them: stars chasing titles want a lot; staff whose contract ran out little. If nothing is enough, ${Math.round(TALK_WALK * 100)}% of the time they walk away from every League (a star then isn't asked again for half a year). A League is in at most ${TALK_MAX} talks besides its own staff's, its bonuses on the table count against its money, and nobody makes offers in the red. Other offers are hidden: your scouting office shows them roughly (level 1), then closely (2), then how keen the trainer is on each (3). A Champion is in talks when their contract ends without a renewal or they want a bigger League's seat; only a League whose own Champion is leaving (stepping down or under notice) can offer them its seat, and their own League can offer to keep them. Rival Leagues bid by their aim: a star-maker chases any star who would improve one of its posts, opens over the asking and counters up to three times (as high as +75% and 48 weeks' bonus); a wall-builder goes for its weakest posts and for trainers whose types answer what its wall keeps losing to; a money-maker offers only the asking pay with no bonus, never raises, and lets its staff go for the transfer fee unless they are its best. Each rival also has a temper (bold, steady or tight, shown on the League table) that makes it bid more or less often and raise more or less, and its keenness varies from talks to talks. Rival Leagues go after each other's Gym Leaders through talks too, and you can join those with an offer of your own. The multi-year sim keeps your staff by matching and bids only when it runs your League by an aim (then by that aim's rules). Whenever talks you were in end (an offer of yours, or one of your staff), the sim stops, the Talks page opens and its Results list says how it came out: Won or Kept, Lost or Left, Let go, Walked away, No deal, or Closed (the trainer took another post, retired or their League folded), with the terms that won. The news says the same, outcome first, and a trainer you signed is tagged on Your staff for ${TALK_NEW_WEEKS} weeks.`]);
const verName = u => u.ver || u.id;
const UPDATES = [
  { id: 74, ver: '0.74.0', date: 'November 26, 2026', time: '7:45 PM ET', title: 'More pictures: the ranch, the Hall of Fame, Gyms and the Elite Four', items: [
    "Pokémon pictures now show as small sprites across the Ranch page: the pool, who fields what, the market and other Leagues' sales, the Safari Zone's lines and stock, the Day Care, new hires' storage and the vault (a shiny or Radiant one shows its shiny picture). The Game Corner's prize counter on the Cities page shows them too.",
    "Hall of Fame entries show each Pokémon's picture beside its name, and the winner's portrait beside theirs.",
    "The Gyms page shows the Champion's, Elite Four members', Gym Leaders' and gym trainers' portraits beside their names, and the progress board shows each post holder's.",
    "As everywhere else, anything without a picture of its own looks as before; a trainer with no portrait of their own uses their class picture if you've added one.",
  ] },
  { id: 73, ver: '0.73.0', date: 'November 26, 2026', time: '7:20 PM ET', title: "A trainer's ace beside their portrait", items: [
    "On a trainer's page, when the trainer has a portrait (their own or their class picture) and their ace has a picture too, the ace now stands beside the portrait, labelled Ace with its name. The ace is the strongest Pokémon on their team (level and base stats), shown shiny when it is. Tap it to open that Pokémon's page. Without both pictures the card looks as before.",
  ] },
  { id: 72, ver: '0.72.0', date: 'November 26, 2026', time: '4:46 PM ET', title: 'Build times, and four buildings for weaker types', items: [
    "Buildings now take time. Every new building or level takes 2, 4, 8 or 12 weeks to finish by its level (a Stadium add-on 2, restoring a level lost in the red half the time). You pay when it starts, and the building keeps working at its old level until it's done. Builds pause while you're in the red (a Bank's grace keeps them going). The Cities page shows each build's time on its button, what's under way and when it's ready, with a Call it off button that gives half back. Rival Leagues wait too.",
    "New, the Power Plant (an Electric gym in the city, or an Engineer on your staff): cuts the upkeep of your other buildings in that city by 15%, 25%, then 35% (25,000, 50,000, 100,000; level 3 needs a City). At level 3 an Electric gym there fights on Electric Terrain, unless your Weather Institute sets that gym a field.",
    "New, the Wind Farm (a Flying gym, or a Bird Keeper): the cheaper upkeep cut. 2, 4, then 7 turbines each cut 4% (15,000, 35,000, 70,000), and about one week in eight is calm and cuts half. A Power Plant and a Wind Farm in one city add up to at most 50%. At level 3 a Flying gym there starts its battles with a tailwind: double Speed for its first 3 turns.",
    "New, the Construction Yard (a Fighting gym, or a Black Belt or Worker): your best Yard works League-wide and keeps working in the red. Builds finish 20% to 65% sooner by level, levels lost in the red restore at 26% down to 17% of their price (instead of 30%), and lapsed buildings decay more slowly. 4 levels (30,000 to 240,000; level 3 needs a City, level 4 a Metropolis). It's among the last buildings lost in the red, just before the Bank.",
    "New, the Quarry (a Rock or Ground gym, or a Hiker): everything else you build, raise or restore in its city costs 10%, 20%, then 30% less (20,000, 40,000, 80,000; level 3 needs a City). At level 3 a Rock or Ground gym there fights in a sandstorm. A leader who would get both Electric Terrain and a sandstorm gets the one of their first type.",
    "These four keep working at their level if their gym changes type or the staff member leaves, but can't be raised until the condition is back. Rival Leagues build the Power Plant and Wind Farm where they pay back within about 3 years, the Yard early (money-makers) or after a spell in the red, and the Quarry where they have levels to restore or room to build.",
    "God mode has a new switch, Instant builds, that finishes your League's builds at once.",
    "Fixed: a League with nothing left to lose in the red no longer crashes when its upkeep goes unpaid.",
  ] },
  { id: 71, ver: '0.71.0', date: 'November 26, 2026', time: '2:30 PM ET', title: 'The Bank and the Fan Club', items: [
    "A new building, the Bank: one per League, in any of your gym cities (40,000, 80,000, then 160,000 for level 3, which needs a City). It earns nothing; it is a safety net.",
    "Its grace: when you go into the red, your buildings keep working (and their upkeep is still paid) for 4, 8 or 12 weeks by level before they lapse. You still can't buy anything new, and unpaid staff still give notice. The grace comes back once you have been out of the red for 12 weeks.",
    "Its credit line: borrow up to 20%, 30% or 40% of what your buildings cost, paid back weekly over 48 or 96 weeks. The rate runs from 8% a year for the richest League to 4% for the poorest, so a League that is behind borrows cheaper. Borrowing again refinances the old loan, and you can pay it off at any time from the Cities page. Borrowed in the red, the money clears the debt first.",
    "Miss a payment and you'll hear about it; miss 4 in a row and the Bank takes your lowest building level, at a distress value, against the loan (it leaves no ruin to restore). Once your buildings have lapsed the Bank lends nothing, but the loan is still owed, and it counts as a debt when deciding whether a League folds. The Bank is the last building to lapse, decay or be sold.",
    "A new building, the Fan Club: one in each gym city, backing that gym (15,000, 30,000, then 60,000 for level 3, which needs a City). Members join while the gym holds better than the region's gyms this year and while trainers from the city work there (its Gym Leader and gym trainers, and your Elite Four and Champion from that city), up to 2,000, 5,000 or 12,000 by level, more in bigger cities. A bad year loses them at half the speed, and a loyal core never leaves.",
    "Members add standing in their city each New Year and draw up to 10% more to the gym's Stadium. Once a club is half full, trainers from that city need 10% less prestige to sign with you (15% at level 3; together with a Stronghold's, at most 30%). When another League poaches a member of your staff from that city, some members follow them, and half of those join that League's club there if it has one.",
    "Rival Leagues: wall-builders build a Bank early and the others after a spell in the red; in the red with a Bank they borrow before selling anything, and money-makers now and then borrow to expand. Every rival builds Fan Clubs where control of a city is close, and money-makers in their Stadium cities.",
    "Fixed: losing a Ranch level (sold, lost in the red, or taken by the Bank) could leave your ranch holding more than its new room. The cheapest spare Pokémon past the room are now sold back at once.",
  ] },
  { id: 70, ver: '0.70.0', date: 'November 26, 2026', time: '1:45 PM ET', title: 'The Game Corner', items: [
    "A new building, the Game Corner: in a gym city that is at least a City (40,000, 80,000, then 160,000 for level 3, which needs a Metropolis).",
    "The city's visitors and residents play there each week, up to 10, 20 or 34 seats by level. Every Game Corner in a city shares the players; the League that controls the city gets a few more. Each player spends more in a bigger city.",
    "The take swings week by week: most weeks within 30% of its average, about one week in 12 a jackpot of about three times as much, and very rarely (about one week in 50) a losing week, when the house pays out more than it takes. Jackpots and losing weeks show in the news and on the Cities page.",
    "Its prize counter holds 2, 3, then 4 of your region's rarest Pokémon (never legendaries or Paradox Pokémon), grade 2 or better, at a quarter over their market value (10% off at level 3). It changes every quarter, each prize can be taken once, and a prize goes straight into your ranch. Take them from the Game Corner's line on the Cities page.",
    "Closed while you are in the red. Money-making rival Leagues build one in their busiest City; wall-builders and star-makers take prizes that fit their staff's types.",
  ] },
  { id: 69, ver: '0.69.0', date: 'November 26, 2026', time: '11:45 AM ET', title: 'The Weather Institute', items: [
    "A new building, the Weather Institute: one per League, in a gym city that is at least a City (50,000, then 100,000 for level 2). It works for your whole League.",
    "From its line on the Cities page, choose each gym's field and the seat's (the Elite Four, the Champion and title claims): one weather (rain, sun, sand, snow), one terrain (Electric, Grassy, Psychic, Misty) or clear skies. Never a weather and a terrain together. The field replaces the gym's own weather; a gym you leave unset keeps the weather of its leader's type.",
    "A terrain powers its type's moves 20% for both sides. At level 1 a place can only use the fields its types bring (a Water gym rain, an Electric gym Electric Terrain); a weather-themed trainer on your staff opens them all. At level 2 any field works anywhere, and it holds all battle: no ability or move can change the weather.",
    "Challengers can see every field, and the sharper ones pick their Pokémon and their next gym with it in mind. The Institute stops working in the red. Wall-building rival Leagues build one and set every gym's field; star-makers set only the seat's.",
  ] },
  { id: 68, ver: '0.68.0', date: 'November 26, 2026', time: '10:40 AM ET', title: 'Stadium add-ons', items: [
    "A Stadium's levels now add seats only: no home edge of their own. Instead each level opens an add-on for your staff, built from the Cities page. Add-ons take no slot, have 3 levels each and cost upkeep like everything else.",
    "Home stand (Stadium level 1): a home edge of up to +1.5% a level when the Stadium is full for that battle, less with empty seats. Field crew (level 2): Pokémon of the gym's type (every Pokémon at an untyped gym; at the seat, the battling trainer's type) hit 2% harder a level.",
    "Video room (level 3): your staff study the challenger, with +5 Strategy a level when they choose which Pokémon to field and when to send them out. Warm-up room (level 4): the lead Pokémon goes out a stage up in its better attacking stat, the first two at level 2, the first three at level 3.",
    "Your seat's Stadium works the same way: it starts at level 2, so a Home stand and a Field crew can be built there from the start. Add-ons stop working in the red, or if the Stadium is sold below the level they open at. Wall-building rival Leagues buy them; star-makers buy a few.",
  ] },
  { id: 67, ver: '0.67.0', date: 'November 26, 2026', time: '9:55 AM ET', title: 'A tidier Cities page', items: [
    "The Cities page is about half as long. The intro is a short summary and last year's income; the full rules, with a line for each building, fold away under How cities and buildings work.",
    "Each city shows one line of tags (size, control, legendary site) with your weekly share, its visitors and the next size; the longer notes fold away under About this city.",
    "Upgrades to buildings you have stay as buttons. New buildings are in a folded Build something new list, a row each with what it does and its price, and the levels not open yet say why.",
    "The towns where you have no gym share one panel with a single Move [gym] to [town] control. A gym's Stadium now reads Stadium to level 1, and building names keep their capitals.",
  ] },
  { id: 66, ver: '0.66.0', date: 'November 25, 2026', time: '11:30 PM ET', title: 'Ranch rules: a grade floor, making room, idle clear-out and listing first', items: [
    "Ranch rules on the Ranch page's Pool tab, each on or off. Grade floor: anything that comes in on its own (trips, hunts, charters, outbreak trips, Safari finds, the Day Care's young and the catching buildings) below the floor is sold back at once for a third of its value.",
    "Make room for better finds: when a find comes back to a full ranch, your weakest spare (by value) is sold back to make room for it if the find is worth more, instead of the find being let go.",
    "Idle clear-out: spares nobody has fielded for a number of weeks you choose are sold, keeping the best few of each line. List first: idle clear-outs, and your weakest spares when the ranch is nearly full, are listed for other Leagues for 4 weeks (85% of their value) before selling back.",
    "The rules only sell spares: never a Pokémon someone fields, a reserved, locked or planned one, or (unless you tick Conditioned too) an alpha, Delta, shiny or Radiant. A new League starts with the floor at two stars and make room on. Every sale they make is in the ranch log with its reason, and the panel shows this year's total.",
    "Bug Catching Contests, Fishing Piers and Fossil Labs now use your League's grade floor, unless you give one its own keep grade on the Cities page. Rival Leagues keep a floor and make room by their aim.",
  ] },
  { id: 65, ver: '0.65.0', date: 'November 25, 2026', time: '9:30 PM ET', title: 'City buildings, part 3: Airports, Bug Catching Contests, Fishing Piers and Fossil Labs', items: [
    "The Airport (one per League, in a gym city that is at least a City, 3 levels): each route to another region works like a shipping lane for its Pokémon and brings people, with challengers moving out of that region leaning toward your League and landing in its city, and a few visitors a month arriving from there (more with your renown there). It costs 1,000 a week to run and earns 150 for every arrival. Level 2 adds a second route; level 3 makes charters cheaper and faster and gives your contenders more renown abroad.",
    "The Bug Catching Contest (where the gym is a Bug gym, or with a Bug Catcher or Bug Maniac on your staff): every 8 weeks it brings 1 to 3 of your region's Bug Pokémon by level, the prize at a good grade, plus visitors and a gate.",
    "The Fishing Pier (in a port, at a Water gym, or with a Fisherman on your staff): one Water Pokémon every 4 weeks. The level is the rod: the Old Rod brings the weakest third of your region's Water lines, the Good Rod the middle third too, the Super Rod all of them.",
    "The Fossil Lab (where your Research Lab is at level 2): revives a fossil from any region, your own region's three times as often, every 12, 10 or 8 weeks by level and at a better grade each level; a Ruin Maniac on your staff counts as a level more.",
    "A keep grade on the Cities page: finds from the Contest, the Pier and the Fossil Lab below it, or for a full ranch, are sold back at once, and the ranch log says so.",
    "A conditioned building whose condition is lost keeps working but can't be raised. Rival Leagues build all four by aim. All numbers are first guesses.",
    "Fixed: talks for a member of staff now end when they go back to the circuit (a beaten seat holder, or someone replaced or let go) instead of lingering a week."
  ] },
  { id: 64, ver: '0.64.0', date: 'November 25, 2026', time: '7:45 PM ET', title: 'City buildings, part 2: Trainer\'s Schools, Move Tutors, Research Labs, Department Stores and the item bag', items: [
    "The Trainer's School (gym cities, 4 levels): each level graduates a young gym trainer a year from that city, of a class that fits its gym and a little stronger each level. A graduate takes an open gym trainer place, else sets out on the field likelier to take your offers (your gym trainer picker lists them first). Your graduates are paid less by you, and a Pokémon Professor on your staff counts as a level more.",
    "The School is also its gym's training hall (faster growth, slower decline for the Gym Leader and gym trainers); the training hall itself is now a seat building for the Elite Four and Champion.",
    "The Move Tutor (a gym city or the seat, 3 levels): tutored Pokémon learn all three of their line's coverage types, each 10 levels sooner, in an order their trainer's Strategy picks, and keep the lesson for good. Level 1 teaches 2 Pokémon a post, level 2 the whole team, level 3 points backup-type Pokémon at their trainer's threats. Tutored Pokémon are tagged on the Ranch page's Teams tab.",
    "The Research Lab (gym cities, 4 levels, your best one works League-wide; a Scientist on staff adds a level): better Scouting on catching trips, a grade floor, one more trip out, likelier condition hunts, and a research grant for each new species of your region the ranch takes in.",
    "The Department Store and the item bag: staff now hold only tier 1 items from the free supply. Leftovers, Eviolite, Assault Vest, Expert Belt, Focus Sash, Life Orb and the Choice items come from your League's item bag, bought at your Stores by floor (the bag is on the Cities page), and challengers you hire to senior posts bring theirs in. Stores also earn from shoppers.",
    "Rival Leagues build all four by aim and buy items for their bags.",
    "Old saves can't be loaded (save version 23).",
  ] },
  { id: 63, ver: '0.63.0', date: 'November 25, 2026', time: '6:30 PM ET', title: 'City buildings, part 1: city sizes, Stadiums, Hotels, Pokémon Centers and Berry Farms', items: [
    "Cities grow by size. Everything every League has spent in a city makes it a Town, then a City at 100,000, a Metropolis at 400,000, a Megalopolis at 1.2 million and on (three times as much each). Bigger cities pay more city income, give more prestige to the League that controls them, draw bigger crowds at dearer tickets, and are needed for the top levels of Stadiums, Hotels and Pokémon Centers.",
    "No more slot ceiling: a city gains a slot at 60,000, 180,000, 400,000 and every doubling after.",
    "Visitors: each week every challenger heading for a city's gym, or resting at a Pokémon Center there, is a visitor. What they spend in town is part of that city's income, and they fill its Hotels.",
    "Every gym now has a Stadium (500 seats at level 0), and your seat starts with a level 2 one. Each try at a gym, and each Elite Four and title battle, sells tickets: the crowd grows with the city's size and the battle's hype (how far the challenger has come, a famous or prestigious trainer, a local hero, a legendary, a gym holding well), up to the seats you have. Stadium levels (1,000 to 12,000 seats) also give the home edge the gym feature used to.",
    "New: the Hotel (rooms for the challengers in town; the League that controls the city fills a little more, and from level 3 guests from other regions count twice), the Pokémon Center (challengers from that city lean toward your League, everyone in the region a little, and each Center cuts a week off your circuit's rests, up to three) and the Berry Farm (plots that sell berries or feed the ranch, cutting its upkeep; set the split on the Cities page).",
    "The Attraction and the gym feature are gone. Rival Leagues now shop by their aim: wall-builders buy Stadiums first, star-makers Pokémon Centers, money-makers Hotels in their busiest cities and Berry Farms. The Cities page shows each city's size, visitors, tickets, Hotel guests and Berry Farm plots. All the numbers are first guesses.",
  ] },
  { id: 62, ver: '0.62.0', date: 'November 25, 2026', time: '11:05 AM ET', title: 'Fixed: talks you lost after withdrawing your offer', items: [
    "Fixed: if you withdrew your offer in talks (or it fell through while you were in the red) and another League then signed the trainer, the talks just disappeared from the Talks page with no result. They now show as Lost in the Results list. The same went for an offer you made and withdrew within the same week.",
    "Fixed: making an offer from a hiring page that couldn't go in (say, a trainer above your prestige) closed that trainer's talks for every League, if talks were already open. They now stay open.",
  ] },
  { id: 61, ver: '0.61.0', date: 'November 25, 2026', time: '8:50 AM ET', title: 'Fixed: the sim stopping on a 100th birthday', items: [
    "Fixed: the sim stopped with a \"Sim error\" about tbl.find when any trainer turned 100. Old trainers like Opal (who starts at 88) or an old custom trainer kept on staff could reach it. Ratings now keep declining at the oldest rate past 99.",
  ] },
  { id: 60, ver: '0.60.0', date: 'November 25, 2026', time: '8:15 AM ET', title: 'WWE and NBA packs taken out', items: [
    "The built-in WWE Superstars and NBA Superstars packs are gone from Advanced options for now. They'll come back later as trainer packs you import, like the others.",
  ] },
  { id: 59, ver: '0.59.0', date: 'November 24, 2026', time: '10:45 PM ET', title: 'Talks messages you can see', items: [
    "Fixed: on the Talks page, pressing Make an offer (or Change, Withdraw, Match, Let them go) showed its message and wiped it at once, so you never saw whether the offer went in or why it was refused (at most 3 talks at once, not enough money for the bonus, in the red, a post you can't offer). Messages now stay up.",
    "Each talks now shows what came of your last offer on its own panel: offer made (and whether you lead), or why it wasn't made, until you try again.",
    "A talks whose trainer won't sign for your League (their prestige minimum is above yours) now says so on its panel before you make an offer, and notes when no other League has offered either, which is usually why.",
    "The hiring pages now say so when an offer couldn't be made at all, or when a trainer who turned you down can't be asked again yet, instead of doing nothing.",
  ] },
  { id: 58, ver: '0.58.0', date: 'November 24, 2026', time: '9:50 PM ET', title: 'Custom trainers of any age', items: [
    "Custom trainers in your trainer packs no longer have a minimum age: any age up to 90 is accepted, in the editor and on import. Young trainers grow quickly, like any other young trainer.",
  ] },
  { id: 57, ver: '0.57.0', date: 'November 24, 2026', time: '9:15 PM ET', title: 'How famous the world is', items: [
    "The All-famous league switch is now a Famous trainers setting in Advanced options → Rules: Normal, 25%, 50%, 75% or 100%. Normal keeps the usual few famous trainers; at the other steps that share of every trainer the game creates is famous, and 100% really is everyone.",
    "Famous trainers can now turn up everywhere the game makes a trainer: gym trainers (always one sharing a type with their leader), the founding pool, stand-ins for empty seats and outsiders, as well as newcomers. Legacy trainers stay ordinary. Before, an all-famous world was only about 40% famous, because none of these were.",
    "Famous trainers in the founding pool start at founding strength like everyone there, so you still build your League up from modest beginnings. The more famous the world, the less being famous adds to pay and to the prestige a trainer asks of a League (in an all-famous world, nothing).",
    "Once every famous trainer has debuted they come round again as V2, then V3, at any share, as before.",
  ] },
  { id: 56, ver: '0.56.0', date: 'November 24, 2026', time: '8:45 PM ET', title: 'Talks results', items: [
    "When talks you were in end, you now always find out how they went. The sim stops (even on Next week), the Talks page opens, and a new Results list at the top says Won or Kept (green), Lost or Left (red), Let go, Walked away, No deal or Closed, with who they signed for and on what terms. New results are marked until you've seen them, and the Talks menu item counts them.",
    "This covers every kind of talks you're in: stars you bid on, your own staff whose contracts ran out, rivals going after your staff (Kept or Left), and talks that close early because the trainer took another post, retired or their League folded.",
    "News about your talks now leads with the outcome (\"Talks won: …\", \"Talks lost: …\"), and a trainer you sign in talks is tagged \"Signed in talks\" on Your staff for 8 weeks.",
  ] },
  { id: 55, ver: '0.55.0', date: 'November 24, 2026', time: '8:30 AM ET', title: 'New Leagues everywhere', items: [
    "New Leagues no longer open in your region first. A founder can open one in any region with room whose prestige bar they clear, drawn at random: likelier in regions with fewer Leagues, and twice as likely in the founder's own region (where they retired). Your region has no edge.",
    "New Advanced option, Leagues can open in new regions (on by default): a founder can open a League in a region with no League yet, bringing its own field of challengers. Switch it off to keep new Leagues to regions already in play.",
    "With New Leagues open over time switched on, setup now asks how often: at most one new League every 4, 8 (the old pace) or 12 years.",
  ] },
  { id: 54, ver: '0.54.0', date: 'November 23, 2026', time: '10:15 PM ET', title: 'Rival bidding', items: [
    "Rival Leagues now bid in talks by their aim. Star-makers chase any star who would improve one of their posts, open over the asking pay and counter up to three times, as high as +75% and 48 weeks' bonus.",
    "Wall-builders go after their weakest posts, and after trainers whose types answer what their gyms keep losing to: those need less of an edge over the holder to get an offer.",
    "Money-makers offer the asking pay with no bonus and never raise. When another League comes for their staff, they take the transfer fee unless it's their best.",
    "Each rival League has a bidding temper, Bold, Steady or Tight, shown on the League table. It sets how often the League bids and how far it raises, and each League's keenness also varies from one set of talks to the next. Each League now decides once per set of talks whether it wants the trainer, so stars draw a handful of offers rather than one from everyone.",
    "Rival Leagues now go after each other's Gym Leaders through talks instead of poaching them on the spot. The talks show on your Talks page and you can join them with an offer of your own. Gym trainers still move up to other Leagues' gyms at once.",
    "Champions can now be in talks: when their contract runs out without a renewal, or when they want a bigger League's seat. Only a League whose own Champion is leaving (stepping down or under notice) can offer its seat, and their own League can offer to keep them. A Champion who signs elsewhere leaves as one stepping down would: the heir moves up.",
    "When the multi-year sim runs your League by an aim, it bids by that aim's rules too.",
  ] },
  { id: 53, ver: '0.53.0', date: 'November 23, 2026', time: '9:30 PM ET', title: 'Talks', items: [
    "Leagues now compete for valuable trainers in talks lasting 2 to 6 weeks, on the new Talks page (Manage). Talks open for a challenger who wins a title or reaches the Elite Four as a strong trainer, for a Gym Leader or Elite Four member whose contract ends without a renewal, and when another League goes after one of your staff.",
    "Make one offer per talks and change it any week: the post (a vacancy, or one whose holder you'd replace), pay over their asking, a signing bonus, the contract length, and promises (no step down or release for 2 years, keeping their own team, or a legendary from your Sanctuary vault). At the deadline they sign with the League they like best, if it's enough for them. If nothing is, they may walk away from everyone.",
    "Offering a post to a star (a title this year or last, or the Elite Four) or to another League's staff from a hiring page now opens talks with your offer, instead of an instant answer.",
    "A trainer weighs more than money: the post against the one they hold, the length they prefer, your seat rule, their hometown, your prestige, any grudge, and their own League's loyalty.",
    "Other Leagues' offers are hidden. Your scouting office shows them roughly, then closely, then how keen the trainer is on each.",
    "The Retention stop: when a rival goes after one of your staff under contract, match its offer, beat it, or let them go now for the transfer fee.",
    "A staff member whose contract runs out without a renewal now goes to open talks instead of simply leaving. You can still bid to keep them, though a restless one is harder to win back.",
    "You can be in at most 3 talks at once (besides your own staff's), signing bonuses on the table count against your money, and nobody makes offers while in the red. The sim stops when you're outbid, a deadline you're in is a week away, or a rival goes after your staff.",
    "Rival Leagues make offers and raise them by a simple rule for now. Smarter bidding, by each League's aim, is coming next.",
  ] },
  { id: 52, ver: '0.52.0', date: 'November 23, 2026', time: '7:30 PM ET', title: 'Contracts', items: [
    "Staff now sign contracts. Gym Leaders, the Elite Four and the Champion sign for 1 to 4 years, gym trainers for 3, 6 or 9 months. Your current staff start with staggered lengths, so they don't all come up at once.",
    "Pick the length when you hire, on the hiring pages (Their preference by default). Each candidate shows the length they'd rather have: stay-put types like long deals, those after a bigger post short ones. Every step away from it makes an offer likelier to be turned down and adds 5% to their pay. Staff you move between posts keep their contract.",
    "A contract holds against ambition. A member of staff tired of waiting for promotion, or asking for another run, no longer gives notice and walks out: they stay until the contract ends, and their restlessness shows.",
    "For the last 4 weeks of a senior contract, only you can renew it, from Your staff (the game stops when one comes up). A content member renews at the length you pick. A restless one asks for 25% more pay (and their wait starts afresh) or won't renew at all. A contract you don't renew ends on its date: they go back to the circuit, holding a grudge if they were restless, or retire, and the post opens.",
    "Gym trainers' contracts renew on their own unless you mark them Let it run out, or they're restless.",
    "Letting someone go early still costs severance. Staff still leave when unpaid in the red, when another League gives them a bigger post, or when they step down after a long career, and a Champion who wants to step down still can. Rival Leagues renew by their aim, and the multi-year sim renews your contracts for you.",
    "Coming next: open talks, where Leagues compete for stars and staff whose contracts end.",
  ] },
  { id: 51, ver: '0.51.0', date: 'November 23, 2026', time: '6:45 PM ET', title: 'Sort by egg group', items: [
    "The ranch's Pool tab can be sorted by egg group (Sort → Egg group). Each Pokémon's egg groups then show under its type, Ditto comes first and Pokémon that can't breed (Undiscovered) come last, so lines that can pair sit together.",
    "The Day Care's breeding pool has a Sort switch, Line or Egg group, and the two parent pickers follow the same order.",
  ] },
  { id: 50, ver: '0.50.0', date: 'November 23, 2026', time: '6:04 PM ET', title: 'The multi-year sim can run your League', items: [
    "Sim multiple years has a new choice, While you're away: leave your League as it is (as before), or have it run as a wall-builder, star-maker or money-maker would run it. Once a month it builds and upgrades by that aim's list, pays for a ban now and then (wall-builder), buys for its weakest posts and sells spare Pokémon at the ranch, and sells a building a month if it goes into the red, the same way rival Leagues do.",
    "It never touches your steers, team plans or staff, and never sells a ranch Pokémon you reserved, locked or named in a team plan. Vacancies are still filled for you as before. Your choice is remembered for next time.",
    "When the sim finishes, the window shows what changed: money, buildings at cost, paid bans and the size of the ranch.",
  ] },
  { id: 49, ver: '0.49.0', date: 'November 23, 2026', time: '4:05 PM ET', title: 'Small fixes', items: [
    "New page: Post holders (World → Post holders). It shows who held every post (Champion, Elite Four seats and Gym Leaders) at the end of every year, with a mark where a post changed hands and anyone else who held it during the year, or post by post as tenures. Use the League buttons to see any League's.",
    "The Trainers page shows 50 trainers a page, with First, Prev, Next and Last buttons, instead of loading everyone at once. Changing a filter, search or sort goes back to page 1.",
    "Letting go a member of staff who is leaving anyway is now free: once they have announced they're stepping down or given notice (over their ambition, or over unpaid wages), no severance is paid. A raise that withdraws their notice makes severance apply again. The Let go button shows what it will cost.",
  ] },
  { id: 48, ver: '0.48.0', date: 'November 21, 2026', time: '4:45 PM ET', title: 'Trainer packs can share names', items: [
    "Your trainer packs can now have trainers with the same name as trainers in your other packs, as they already could with the game's built-in packs. If two packs with the same name are both on, only one of that name appears in a league.",
    "Names still have to differ within one pack. Importing into a pack that already has a trainer of that name leaves the repeat out and says how many were skipped.",
    "Fixed: when a Day Care level was lost (sold, or lost to unpaid upkeep), pairs beyond what it could still hold carried on for a week. They now end at once.",
    "Fixed: a trainer who won the Champion's seat (under any seat rule) could ask for another run as a challenger straight away, and a rival League would let them go the same week. A new Champion now starts out wanting to stay.",
  ] },
  { id: 47, ver: '0.47.0', date: 'November 21, 2026', time: '12:05 PM ET', title: 'More famous trainers', items: [
    "46 new famous trainers can turn up on the circuit and as hires: the Colosseum cast (Wes, Rui and Cipher's Evice, Nascour, Dakim, Venus and Ein), Legends: Arceus (Adaman, Irida, Kamado, Professor Laventon) and Legends: Z-A (AZ, Urbain, Taunie, Lida, Professor Mable, Corbeau).",
    "Also new: Kalos's Battle Chatelaines (Evelyn, Dana, Morgan, Nita), more villains (Proton, Petrel, Tabitha, Charon, Zinzolin, Xerosic, Faba, and GO Rocket's Sierra, Arlo and Cliff), story trainers (Zinnia, Eusine, Looker, and Platinum's Cheryl, Mira, Riley, Buck and Marley) and anime favourites (Jessie, James, Solidad, Harley, Nando, Amethio, Spinel).",
    "The Orre group in the famous trainer filters now covers both Colosseum and XD.",
  ] },
  { id: 46, ver: '0.46.0', date: 'November 20, 2026', time: '9:50 PM ET', title: 'An Instant Conqueror', items: [
    "The Conqueror seat rule now has a timing: Instant or At New Year. Pick it beside the rule on Your staff or at setup; changing only the timing is free.",
    "Instant: whoever beats your Champion takes the seat as soon as their run is over, any week of the year, as in the main games. There is no grace for a new Champion, so the seat can change hands several times in a year.",
    "The beaten Champion drops into an empty Elite Four seat if one is waiting for you to fill. Otherwise they go back to the circuit (or retire) with a grudge against the League.",
    "At New Year works as before: the year's strongest title winner who wants the seat takes it, and a new Champion has their first year in the seat.",
    "Rival Leagues that use the Conqueror rule pick Instant or At New Year about half the time each. The League table shows (Instant) beside the rule.",
  ] },
  { id: 45, ver: '0.45.0', date: 'November 20, 2026', time: '9:30 PM ET', title: 'Breeding and the Day Care', items: [
    "A new seat building, the Day Care (5 levels, no slot), breeds Pokémon from your breeding pool. Find it on the Ranch page's new Day Care tab.",
    "Breed on the Pool tab puts a ranch Pokémon in the breeding pool for good: it leaves the ranch and every team, takes no ranch space, costs half its upkeep, and after 5 years is sold automatically for half its value (you get a warning 8 weeks before). The pool holds one of each line and condition; putting in a better one bumps the old one out and sells it. Locked Pokémon can't go in; reserved or planned ones ask first.",
    "Pairs follow the games' egg groups, or pair anything with Ditto. Undiscovered lines can't breed. Ditto can be in several pairs at once; everyone else in one. The Day Care's level sets how many pairs run at once (1 to 5) and how often they lay (every 10 weeks, down to 6).",
    "Young ones usually come out a grade above their parents: each IV comes from one parent, the better one more often, plus a small bump. Conditions come at twice the wild odds, five times if a parent has one. A Delta parent passes on the Delta gene, so the young one rolls its own unusual type, whichever line it takes. A bred shiny, alpha or Delta has at least a wild one's IVs.",
    "A young one hatched into a full ranch waits 8 weeks at the Day Care for room, then is let go. In the red the Day Care closes: eggs wait, and the pool's upkeep is still paid. Everything shows in the ranch log.",
    "My Pokédex and the region editor have egg group fields for your own Pokémon (left empty, one comes from the main type).",
    "Rival Leagues build Day Cares and breed by aim: wall-builders for their posts' types, star-makers the best grades, money-makers rarities to sell.",
  ] },
  { id: 44, ver: '0.44.0', date: 'November 20, 2026', time: '6:40 PM ET', title: 'The ranch reorganized, the Safari Zone you can shape, and a ranch log', items: [
    "The Ranch page is in tabs: Pool, Teams, Trips & log, Market, and Region & safari. A dot on Pool means a new hire's storage is open to you.",
    "The pool shows only the Pokémon nobody is fielding by default. Filter it by fielded or not, listed, locked or reserved, type, grade, condition and where it came from, and sort it by value, grade, name, newest or type. Each row now says where it came from and when.",
    "Teams is a table with one row a Pokémon: post, trainer, Pokémon, type, grade, held item, and whether it is their own, from the ranch, a backup type, a stopgap or planned. Filter it to ranch Pokémon, trainers' own, or stopgaps and backups.",
    "The Safari Zone has its own panel. Every line in it is listed with its type, strength and home regions, and a Send button for a trip. Safari trips are now 10% cheaper and 5 points likelier for each level of the Safari Zone.",
    "Keep lines: choose 1, 2 or 3 lines (by level) that stay in the safari when it changes every 12 weeks.",
    "Stock the safari with your own Pokémon: up to 4, 8 or 12 (by level) from the Pool tab. They leave the ranch (freeing a place, at the same upkeep), their lines stay catchable in the safari for as long as they're there, and trips for a stocked line are 15 points likelier and no worse than a grade below the best stocked one. Once a quarter a young Pokémon of a stocked line turns up in the safari and joins the ranch (two or more of one line make that line likelier). Take any of them back to the ranch at any time. While you're in the red the safari is closed and the stock waits; if the safari is sold or lost, the stock comes back to the ranch.",
    "Rival Leagues use the safari too: wall-builders and star-makers keep the lines that fit their posts, stock spares that fit, and take stocked Pokémon back when a post needs them.",
    "Recent history, on the Trips & log tab: the last 40 things your ranch did, with the date, the cost, the odds and the result. Every trip, hunt, charter and outbreak trip shows what it came back with, whether it came back empty-handed, or whether a find was let go because the ranch was full. Market and League buys, sales, releases, storage picks and safari moves are there too. News of an empty trip now says what its odds were.",
  ] },
  { id: 43, ver: '0.43.0', date: 'November 19, 2026', time: '9:10 PM ET', title: 'Seat rules: how each League chooses its Champion', items: [
    "Every League now has a seat rule: how its Champion's seat changes hands. Pick yours at setup (free), and change it on Your staff under How the Champion is chosen.",
    "Nine rules. Protected: the seat changes only with your say, as before (called challenges, title claims, the Champion's own ambitions). Succession: when the Champion leaves, the top Elite Four seat moves up, so the Elite Four's order is the line of succession. Term: the Champion serves a set term, then you appoint the next one or keep them. Council vote: the Elite Four vote on a schedule and whenever the seat empties, and you can pay to lobby for a candidate. Merit: on a schedule, the seat goes to whoever stopped the largest share of runs. Gauntlet (the Grand Trial in island-trial Leagues): each New Year the strongest willing candidate may try to beat every Elite Four member in a row, then the Champion. Champion's Cup: a tournament of the Champion, the Elite Four and the best Gym Leaders; the winner takes the seat. Open Cup: the Cup with title winners and the circuit's best invited. Conqueror: the year's strongest title winner who wants the seat takes it at New Year.",
    "You set how often each scheduled rule comes round (every 1 to 6 years). Changing the rule itself costs 5 prestige and can't be done again for two years; changing the timing is free. Called challenges and title claims are only for Protected Leagues.",
    "What a rule pays: the less control it keeps, the more prestige a year it earns, the more challengers it draws and the readier ambitious trainers are to sign. The Cups sell tickets (the Open Cup more, and a little prestige), and a Council vote keeps ambitious Elite Four members patient a little longer.",
    "Rival Leagues pick a rule that suits their theme and aim, with some chance in it, and may change it when they rebrand. The League table shows each League's rule, and the year report lists what the rule did that year. A founding Champion's protected years still hold under every rule.",
    "Old saves can't be loaded (save version 21).",
  ] },
  { id: 42, ver: '0.42.0', date: 'November 19, 2026', time: '3:52 PM ET', title: 'Post names by League, and League themes', items: [
    "Each League now names its own posts, instead of the region naming them for every League in it. At setup, under your League's name, pick a theme to fill in the names of your Gym Leaders, gym trainers, Elite Four and Champion, then type over any of them. You can change them later from the League table's Posts button.",
    "Themes: Classic (Gym Leader, Gym trainer, Elite Four, Champion), Dojo (Sensei, Student, Grandmasters, Master), Court (Warden, Squire, High Council, Sovereign), Board (Branch Head, Associate, Board, Chair), Academy (Professor, Assistant, Faculty, Dean), Island trials (Kahuna, Trial Captain, Island Elders, Champion), and Region default, which uses the region's own names. A theme also changes a few lines in the news.",
    "Rival Leagues draw a theme by their aim and their region: wall-builders lean to Dojo and Court, star-makers to Academy and Classic, money-makers to Board; Kalos and Galar lean to Court, Paldea to Academy, Unova to Board and Alola to Island trials. Set a starting rival's theme under Advanced options, Where rival Leagues start. A rival may rebrand when it starts rebuilding or changes its aim for good, and the news says so.",
    "A custom region's post names are now the defaults for Leagues there, and the region editor can pick the themes rival Leagues there lean to.",
    "Staff carry the titles of the League they serve now. Each year's report keeps the titles that year was played under, and Hall of Fame entries the Champion's title of the day. If you leave your League, your post names and theme go with you.",
    "Saves from earlier versions won't load.",
  ] },
  { id: 41, ver: '0.41.0', date: 'November 19, 2026', time: '11:30 AM ET', title: 'Four Leagues a region and a shared regional field', items: [
    "A region can now hold up to four Leagues. Every region has three more towns with no gym (six in all, fourteen cities and towns) and two more League seats, so the Kanto region's third and fourth Leagues sit at Cerulean Cave and Trainer Tower, Johto's at the Bell Tower and the Battle Frontier, and so on. You can start a world with up to four Leagues in each region.",
    "Founders now face a bar set by the region: a region's first or second League needs a founder with prestige 30, its third 50 and its fourth 70. A founder opens a League where their prestige clears the bar, your region first.",
    "Challengers now belong to their region, not to one League. Before each run, a challenger draws which of the region's Leagues to take on: prestige counts (more for strong challengers), so does a League's standing in their hometown, and a League that holds their hometown keeps their loyalty for a few years even if its prestige dips. Weaker challengers favour Leagues where runs get further and quieter Leagues with fewer challengers, so a struggling League can win its share back. New challengers may even be drawn to a famous League from another region with renown in their hometown.",
    "Smaller fields: a region's field aims at about 30 challengers for each League in it, growing a little as its cities grow. Newcomers stop coming while a region is well past that, and weak challengers give up sooner in a crowded field. A new League's founding field is 30.",
    "You hire from the region's field: your own circuit plus the region's other challengers resting between runs. The Circuit page can show your League's challengers or the whole region's field with the League each is taking on, and the League table shows each League's challengers and its share of its region.",
    "Rival Leagues drawing well under an even share of their region's challengers go into rebuild mode: they spend only in their strongest city, always try to have a contender out, and replace their costliest staff with cheaper hires each New Year, returning to their aim once their share recovers.",
    "The region editor has six towns, four seats and four League names. Region files from 0.40.0 and earlier still load (the new places take default names).",
    "Saves from earlier versions can't be loaded (the regions have new cities)."
  ] },
  { id: 40, ver: '0.40.0', date: 'November 18, 2026', time: '9:50 PM ET', title: 'City control by tiers, renown and hometowns', items: [
    "Control of a city is now graded by how far the leading League is ahead of the second: Contested, Leaning, Held or Stronghold. The leader's share of the city's income grows with its tier (nothing extra when Contested, 40% Leaning, 50% Held, 60% Stronghold), Held and Stronghold cities earn prestige (more for a larger city), and a Stronghold gives your gym there a small crowd edge, makes trainers from that city cheaper to sign (less prestige needed) and gives you first refusal when a rival has to sell a building there at a distress price.",
    "Standing now comes from more than spending once. Each New Year it grows from your gym's record against the region, from your presence (buildings standing there count every year, by their value, and stop counting if they lapse or are sold), from your prestige (a share in every home city) and from local heroes (your staff from that city). A League far behind the leader gains standing half again as fast, so a lost city can be won back.",
    "Every trainer now has a hometown, shown on their profile. Staff working in their hometown lift their League's standing there, and if another League hires them away, that goes with them.",
    "Renown: a League from another region can't control your cities, but it can earn renown in them through its prestige, its contenders' badges and titles, and World titles. Renown narrows the leader's lead (it can drop you a tier) and takes up to 10% of a city's income. The Cities page shows each city's tier, standing, renown and local heroes; the League table counts cities Held or better and Strongholds.",
    "Saves from earlier versions can't be loaded (hometowns are new)."
  ] },
  { id: 39, ver: '0.39.0', date: 'November 18, 2026', time: '7:45 PM ET', title: 'Team plans and the quarterly team review', items: [
    "A new Team plans page (Manage menu): name up to six Pokémon for any Gym Leader, Elite Four member or your Champion, from their own team or your ranch (of the post's type). The steer fills any place you leave empty, as before. A plan belongs to the post, like a steer, so a new holder follows it.",
    "Plans take effect at the quarterly team review, every 12 weeks (the start of the first, fourth, seventh and tenth months). The sim stops for it (you can turn that off on the page) and the page suggests a team for every post, which you can take with one click. A plan set in the review's week takes effect at once; one set later waits for the next review, except for a post whose holder is new since the last review, or a vacant post.",
    "Planned Pokémon are locked in: the monthly swap and a Gym Leader's losing-streak shake-up never trade them out. Legendaries and the Mega Evolution holder keep their places. A ranch Pokémon another post was fielding is taken from them when your plan takes effect.",
    "Staff always go along with a plan, but one whose own Pokémon it keeps on the bench for two reviews running grows restless: promotion's clock moves on a quarter, and a member who wanted to stay put may start wanting more.",
    "A planned Pokémon you sell, lock, list or that gets banned leaves a gap the steer fills; the Ranch page and the Team plans page flag it. Rival Leagues don't plan.",
  ] },
  { id: 38, ver: '0.38.0', date: 'November 18, 2026', time: '7:15 PM ET', title: 'Backup types', items: [
    "Every typed trainer now has three backup types outside their own (shown on their profile and the Ranch page). They lean toward types that answer the trainer's weaknesses: an Ice specialist gets Fire or Steel more often than Dragon.",
    "When your ranch has nothing left of a Gym Leader's or Elite Four member's own type, they field a ranch Pokémon of one of their backup types instead of a weak stopgap. Stopgaps only stand in when neither fits.",
    "At most half a team can be backup types, and the monthly swap trades one back for a Pokémon of their own type as soon as the ranch has one. A gym still counts as its own type for challengers' routes and gym memory.",
    "Rival Leagues treat a backup-type Pokémon as the next thing to replace after a stopgap when they shop and send trips.",
  ] },
  { id: 37, ver: '0.37.0', date: 'November 18, 2026', time: '11:30 AM ET', title: 'Storage, picking at hire and Sanctuaries reworked (the ranch, part 3)', items: [
    "Challengers keep what they drop in storage: Pokémon released for a catch, left behind for a new run, or over the foreign limit when they move region (they are no longer released). Up to 12, the oldest let go.",
    "Hire a challenger with storage as a Gym Leader, Elite Four member or Champion and you can take up to 3 of their stored Pokémon into your ranch (one more a scouting office level), from the Ranch page within 8 weeks. Alphas, Deltas, shinies and Radiants can be taken too. The rest stays theirs. Hiring rows show a candidate's storage and its value, and a rich storage asks up to a quarter more pay. Rival Leagues take theirs by aim.",
    "Legendary sites no longer run out after ten years. A Sanctuary is open while one of its site's legendaries is with your League (held by your staff, by a challenger on your circuit, or stored in the Sanctuary), and sealed otherwise: no income, upkeep or prestige until one comes back. Sanctuary income and prestige when open are as before.",
    "Store legendaries in your Sanctuaries from the Ranch page. Staff agree or refuse by their ambition and record (they would rather keep theirs); a challenger asks for money by the legendary's strength, or hire them and ask again. While stored, a legendary's years with a partner stop counting.",
    "Give a stored legendary to an Elite Four member or your Champion who has none. It belongs to the League: it comes back to the vault when they leave the post. A member of staff you let go after they stored their own legendary with you takes it hard: a sure grudge, and likelier to take it to another League.",
    "Legendaries stay with their partners longer: 5 to 8 years (was 3 to 5).",
    "Rival Leagues store legendaries now and then; wall-builders and star-makers give them to their Elite Four or Champion. A League that folds lets its stored legendaries go to wait for new partners.",
    "Old saves can't be loaded.",
  ] },
  { id: 36, ver: '0.36.0', date: 'November 17, 2026', time: '11:59 PM ET', title: 'Alphas, Deltas, shinies and Radiants in the ranch', items: [
    "Your ranch can hold alphas, Deltas, shinies and Radiants now, and keeps them whole: a Delta keeps its unusual type and ability, a Radiant its ability, a shiny its perfect IVs. Staff field them as they are, and a Delta counts by its own types when a gym picks on type.",
    "They turn up now and then on catching trips, charters and the market, at the same odds challengers get in the wild (Scouting nudges alphas). Staff who drop one, and new hires who don't field theirs, put them in the ranch like any other.",
    "Hunts: pick a condition on the Ranch page to send a trip after a line in that condition. It costs that condition's multiple of a plain trip (alpha ×2, Delta ×5, shiny ×8, Radiant ×10), takes a little longer, and has lower odds.",
    "Outbreak trips: while a mass outbreak is on in your region (that week or the next), send a trip to it for two or three of the swarming Pokémon at outbreak odds.",
    "Every region has its own Delta lines, some of them found nowhere else in that region. Deltas of those lines are likelier there and can be hunted there even when the plain Pokémon can't. The Ranch page lists yours.",
    "A condition multiplies a Pokémon's value (and so its price at the market, in League sales and when sold back). Shinies and Radiants your Elite Four and Champion field draw a crowd: showcase income every week and a little prestige at New Year (alphas and Deltas less).",
    "Rival Leagues play by the same rules: wall-builders and star-makers sometimes hunt alphas and Deltas for their posts and keep them, and money-makers sell theirs to other Leagues.",
  ] },
  { id: 35, ver: '0.35.0', date: 'November 17, 2026', time: '10:55 PM ET', title: 'A tidier page menu', items: [
    "The page menu is split by what you're doing. Manage: Gyms & Elite, Your staff, Ranch, Money, Cities and Contenders. Circuit: the badge circuit, all trainers and the meta. World: the League table, news and history. Records: the year report, records, the Hall of Fame and Pokémon.",
    "The progress board opens from the Board button in the header (it's no longer in the menu as well), and God mode, when it's on, is in the ⋯ menu.",
  ] },
  { id: 34, ver: '0.34.0', date: 'November 17, 2026', time: '8:45 PM ET', title: 'Calling challenges and Champion ambitions', items: [
    "You now decide when your Champion's seat is fought for. On Your staff, Call a challenge up to three times a year and name the challenger: one of your Elite Four members or Gym Leaders, or a title winner of this year or last still on your circuit. It is one battle at the Champion's level four weeks later, and you can fight it sooner or call it off. The winner takes the seat.",
    "The New Year challenge for your Champion's seat is gone: your own Elite Four members, and other Leagues' Elite Four, no longer challenge your Champion on their own. Title claims still come, and still wait for your answer. Gym Leaders' New Year challenges for an Elite Four seat are unchanged.",
    "A Champion called against is put out by it, more so with each call in a year, and may start wanting to leave.",
    "Champions have ambitions like the rest of your staff. Most stay put, but a Champion may want a bigger League's seat (they give notice after three years; a raise holds them a year), another run as a challenger, or to step down (they give notice after three years, then retire at 40 or older, or else take an Elite Four seat). When a Champion leaves, your strongest Elite Four member moves up and their seat waits for you. A League's founding Champion stays put through their window.",
    "Rival Leagues' managers call their New Year challenge for the Champion's seat by their aim.",
    "Easier to reach the seat: a new Champion is safe from claims and other Leagues for one year (was two), an Elite Four member needs one year in the seat before challenging (was two), and about half of title winners now claim the seat (was about three in ten).",
    "The year report marks the challenges you called and the ones you called off; glossary entries for Calling a challenge and Champion ambitions.",
  ] },
  { id: 33, ver: '0.33.0', date: 'November 17, 2026', time: '7:05 PM ET', title: 'League names', items: [
    "Leagues are now named for their seats. A region's first League is named for the region (the Kanto League) and its second for its own seat (the Victory Road League, the Dragon's Den League, the Sky Pillar League…), for your League, the starting rivals, Leagues founded later and a League refounded after a fold alike. No more Leagues named after their founder's surname, and no more Founders League.",
    "Name your League on the setup screen, and each starting rival under Advanced options → Where rival Leagues start. Leave a name blank and it takes its seat's default.",
    "Rename your League any time from the League table. A new Advanced option, Rename rival Leagues, lets you rename any League there too. Past names show on the League table, and each year's report keeps the name the League had that year.",
    "Founders now show beside the League they founded on the League table, with the year (Founded by …, Year 9).",
    "Names are unique in the world, folded Leagues included: a League opening at a seat whose old League folded becomes the New … League.",
    "Custom regions can set the default names of the Leagues at their two seats in the region editor (under Places), saved in the region file.",
    "Titles follow the League's name, so a Champion of a League you named the Indigo Cup is the Indigo Cup Champion."
  ] },
  { id: 32, ver: '0.32.0', date: 'November 17, 2026', time: '5:35 PM ET', title: 'Gyms in any order', items: [
    "Challengers can now take the eight gyms in any order. Every gym scales to the challenger in front of it: it fights at the level and team size for the badges they already hold (level 16 with three Pokémon at none, up to level 77 with six at seven badges), whichever gym it is. Every gym now sees beginners and challengers close to the Elite Four alike, so the later gyms face far more battles than before.",
    "Gym Leaders hold up to six Pokémon and gym trainers up to five. For each battle they field the number that stage needs (gym trainers one fewer than the leader), in the form each Pokémon would have at that level, picked by their Strategy against the challenger. Deeper teams draw more on the ranch.",
    "Challengers choose their route: after every badge and every loss they pick the gym their team matches best, putting off gyms that beat them before and gyms where they've used tries. Sharp trainers read the gyms well; poor ones pick close to randomly.",
    "After a loss a challenger may go to another gym and come back later. Tries used stay used and gym trainers beaten stay beaten, but by then the gym fields more Pokémon at a higher level. A third loss at any gym still ends the run.",
    "Gym numbers are now a pecking order you set: later gyms still pay more, a Gym Leader who wants promotion still wants a later gym, and the leader of gym 8 is still the usual step to the Elite Four.",
    "The year report shows each gym's share of tries held by the challenger's stage (early 0–2 badges, mid 3–5, late 6–7). The progress board counts who is heading to each gym and adds a row of everyone out on a run by badges held; the circuit page shows where each challenger is heading and at what level.",
    "A challenger's profile shows the route of their current run and their next gym, Hall of Fame entries show the route the winner took, and runs at the Elite Four carry their route.",
    "Old saves can't be loaded: start a new world.",
  ] },
  { id: 31, ver: '0.31.0', date: 'November 17, 2026', time: '3:45 PM ET', title: 'Custom regions: the region editor and sharing', items: [
    "Advanced options has a new section, Custom regions, beside My Pokédex. Make a region of your own from nothing, as a copy of a built-in region, or with a generated list, then edit it: its name, its eight gym cities, three towns and two League seats, which places are ports or railways, two or three neighbouring regions, the legendaries at home there, and other names for its Gym Leaders, gym trainers, Elite Four and Champion (as Alola has Kahunas and Trial Captains). Its staff carry those titles everywhere their name is shown.",
    "A Champion's title no longer starts with \"Defending\": the Kanto League's Champion now shows as Kanto Champion and their name.",
    "The list of Pokémon found in a region can be copied from a built-in region, added to, cleared, or generated by type, generation and strength (gentle, standard with at most three pseudo-legendaries, or strong), then edited line by line. The editor flags thin types (fewer than five strong lines) and a list far from the usual 250 species, but never stops you: an all-Water archipelago is allowed.",
"A region can have new Pokémon of its own. They work as if added to My Pokédex in any world that uses the region, and come along when the region is shared. Tick Keep its new Pokémon here and they never migrate, ride lanes or charters, or leave with a challenger moving away.",
    "A region's own new Pokémon with a base stat total over 650 can be tagged as a legendary encounter, as in My Pokédex. It's never found in the wild; it turns up as a very rare legendary encounter, three times likelier in its own region (and only there if the region keeps its new Pokémon), with one trainer holding it at a time.",
    "Fixed: a trainer coming out of retirement (hired back, or founding a new League as its Champion) could bring back an Ultra Beast, Paradox Pokémon or other legendary while another of the same was already out in the world. One whose places are taken has now moved on by the time they return.",
    "Each region can be open to rival Leagues or kept for your League alone.",
    "Share a region as a file or a paste code, and import either. A region from a newer version of the game is refused with a message. If one of its new Pokémon has a name that's already taken (a game Pokémon, one in My Pokédex or in another of your regions), it's left out and the import tells you which.",
    "When starting a new world, each of your regions can be left out, added as a new region beside the nine, swapped in for a built-in region's Pokémon only (keeping its name, cities, ports and neighbours), or swapped in for the whole region. A legendary a custom region claims stays at home where it was too, and the world can then hold one of it for each region that has it at home: a world with Galar and a region that also claims Calyrex can have two Calyrex at once. Pokémon that only lived in a replaced region move to its neighbours, so nothing disappears.",
  ] },
  { id: 30, ver: '0.30.0', date: 'November 17, 2026', time: '3:30 PM ET', title: 'Bigger worlds: more starting Leagues, a larger save', items: [
    "Your world is now saved in the browser's larger storage (IndexedDB) instead of the small one, so long games and big worlds no longer run out of room. An existing save is moved over the first time it's saved again.",
    "Starting Leagues now goes up to eighteen, two to a region, using the − and + buttons. The setup screen shows roughly how long a simulated year will take, and warns when a world will be slow.",
    "Advanced options has a new section, Where rival Leagues start: leave a rival to start anywhere, or pick its region. Picking your own region puts a rival beside you from the first week. Otherwise rivals spread over the other regions first, and only share your region when every other seat is taken.",
    "A second League in a region at the start is named for its seat (Hoenn's is the Sky Pillar League).",
    "Behind the scenes, each world now keeps its own list of regions, the groundwork for custom regions. Nothing about the nine regions has changed.",
  ] },
  { id: 29, ver: '0.29.0', date: 'November 17, 2026', time: '1:10 PM ET', title: 'No League cap', items: [
    "The world no longer stops at six Leagues. New Leagues still open only when a distinguished retiree founds one, each needing more prestige than the last, and still at most two to a region, so a world can hold up to eighteen.",
    "With many Leagues the world gets slower and the save larger: in testing, eighteen Leagues took about a minute a simulated year, against about thirteen seconds for six. If your browser can't store a very large save, the game says so; Download save file in the menu still keeps it.",
  ] },
  { id: 28, ver: '0.28.0', date: 'November 17, 2026', time: '11:40 AM ET', title: 'Nine regions', items: [
    "Five new regions: Unova, Kalos, Alola, Galar and Paldea. Each has a League of the same size as the others (eight gyms, the Elite Four and a Champion), eight gym cities, three towns without a gym, its seat and a second League's seat. Unova's gyms follow Black 2 and White 2; Galar's and Paldea's are their own.",
    "Alola has no gyms, so its League is built on the island challenge: its gym cities are the challenge's stops in order (Hau'oli, Iki Town, Paniola, Konikoni, Malie, Tapu Village, Po Town, Seafolk), its Gym Leaders are Kahunas and their gym trainers Trial Captains, and the League sits on Mount Lanakila (a second Alolan League takes the Battle Tree).",
    "Every generation now has its own region, so the regional lists were rebuilt: about 250 species a region (was 350), each line in two or three regions on average. Regional forms belong to their region as well as their family's (Alolan Vulpix to Alola, Galarian Meowth to Galar, Paldean Wooper to Paldea; Hisuian forms stay with Sinnoh). Every type still has at least five strong lines in every region.",
    "Migration has a bigger map: the four Japanese regions keep their ring, Alola sits between Kanto, Hoenn and Unova, Unova faces Kalos and Galar across the sea, and Kalos, Galar and Paldea neighbour each other.",
    "New ports for shipping lanes: Castelia, Virbank, Humilau, Coumarine, Shalour, Ambrette, Hau'oli, Konikoni, Seafolk, Heahea, Hulbury, Spikemuth, Levincia, Cascarrafa and Porto Marinada, with railways at Nimbasa, Lumiose and Hammerlocke.",
    "Every region's own legendaries now turn up three times as often there (Unova's Swords of Justice and Forces of Nature, Kalos's Xerneas and Yveltal, Alola's Tapus and Ultra Beasts, Galar's Zacian and Zamazenta, Paldea's Treasures of Ruin, and so on).",
    "The world still holds at most six Leagues, two to a region; with nine regions the starting rivals and new Leagues have more places to open.",
    "Fixed: a member of staff whose type has few common Pokémon in a small region could be left a Pokémon short when a stopgap was needed (stopgaps now come from anywhere if the region has none).",
    "Fixed: an acting Gym Leader sent back to their gym trainer's place could keep a ranch Pokémon or stopgap the ranch still counted.",
    "Old saves don't load (save version 15).",
  ] },
  { id: 27, ver: '0.27.0', date: 'November 17, 2026', time: '11:20 AM ET', title: 'Regional encounters', items: [
    "Pokémon are regional now. Kanto, Johto, Hoenn and Sinnoh each have their own species (about 350, counting evolutions): a family belongs to every region of its generations (Pichu is found in Kanto and Johto), regional forms go with the species they are forms of (Hisuian ones with Sinnoh), and Generations V to IX are shared out among the four regions until their own regions are added. Every type has at least five strong lines in every region. Wild Pokémon, new challengers' teams, mass outbreaks, the market, area trips and stopgaps all come from the region.",
    "Migration: three or four times a year, 10 to 20 kinds of Pokémon from a neighbouring region (now and then from further off) arrive for about two months, for challengers and for your ranch alike.",
    "Shipping lanes: build one in a port city where you have a gym (Goldenrod has the railway instead) and choose a region on the Ranch page. Its Pokémon can then be caught on your targeted trips and turn up at your market all the time. 60,000 to build, 400 a week to run, 10,000 to change the route.",
    "Charters: a one-off shipment of two or three Pokémon from any other region, 12,000, three weeks.",
    "The Safari Zone: one per League, in a gym city. It holds 10 Pokémon from other regions (13 and 16 at higher levels), changing every 12 weeks, that only your own targeted trips can catch; higher levels also bring back better grades.",
    "When a steer asks for something your region can't give (say, a Ground type to cover weaknesses), staff use the best they can get, and the Ranch page flags it and says where that Pokémon lives.",
    "A challenger moving to a League in another region brings at most three Pokémon from outside it (their best, special ones first). For now the rest are released.",
    "Rival Leagues build lanes and safaris by their aim and send charters when a post is stuck with stopgaps.",
    "Fixed: leaving your League to found another could crash if a waiting seat challenge moved one of the staff coming with you.",
    "Regional encounters is a feature in Advanced options (on by default). Turn it off to play with every species everywhere.",
  ] },
  { id: 26, ver: '0.26.0', date: 'November 17, 2026', time: '9:40 AM ET', title: 'Clearing out the ranch', items: [
    "Any ranch Pokémon can now be sold, released or listed straight from the Ranch page, even one a member of staff is fielding: they swap it out on the spot for the best fitting Pokémon left in the ranch (or a stopgap if nothing fits). The page says who is fielding it and what will happen.",
    "Rival Leagues clear out their ranches: spares beyond the few their aim keeps are listed for other Leagues, then sold back once they have sat unused for a while (two months for a money-maker, three for a star-maker, four for a wall-builder).",
  ] },
  { id: 25, ver: '0.25.0', date: 'November 16, 2026', time: '11:59 PM ET', title: 'The ranch', items: [
    "Every League now has a ranch: its own pool of Pokémon. Your Gym Leaders, Elite Four and Champion field their own Pokémon plus Pokémon from the ranch, and nothing comes free any more, so a new League starts thin and its teams grow as it catches and buys. Gym trainers keep their own teams.",
    "A new Ranch page (League menu) shows who fields what, the whole pool, catching trips and the market. Each Pokémon has a grade, 1 to 5 stars from its IVs, and takes the form its line has at the level of the post that fields it, one post at a time.",
    "Staff swap one Pokémon a month for a better one from the ranch, by their steer and as well as their Strategy lets them. A swap is an exchange: what they drop goes into the ranch (theirs to take back while they stay), and a ranch Pokémon they hold leaves with them if they go. Reserve a Pokémon for a post, or lock it away.",
    "Pokémon come in from catching trips (a targeted trip after one line, or a cheaper area trip; your best senior member's Scouting and the scouting office set the odds and grades), from the market (a few each week, plus other Leagues' sales) and from what staff drop. Sell back for a third of the value, release, or list for other Leagues.",
    "A new League starts with a small stock of low-grade commons, about enough for every post to field a full team. Each Pokémon costs upkeep a week by grade, and the ranch holds 60 until you build the Ranch at your seat (no slot, five levels). If nothing fits a post, weak stopgaps stand in and the page warns you.",
    "Every species can be caught anywhere for now; regional encounters, migration, ports and the safari come next. Rival Leagues run their ranches by their aim. All the numbers are provisional.",
  ] },
  { id: 24, ver: '0.24.0', date: 'November 16, 2026', time: '11:45 PM ET', title: 'Growth', items: [
    "Everyone grows on one curve, staff and challengers alike. Trainers improve on each birthday, fastest while young: a teenager is typically 6 to 10 OVR better within three years, a young adult 4 to 6. They peak in their late 20s, hold, and decline slowly from their mid 30s, faster with age. This replaces the old potential ceiling.",
    "Late starters grow too. Growth counts from the start of a career, not age, so someone who comes to the circuit or a post at 30 still improves for four years, and only declines six years in (by 40 at the latest).",
    "Talent varies from trainer to trainer, and so does coaching: a gym trainer is coached by their Gym Leader, Gym Leaders and the Elite Four by the Champion, and a coach with high Training speeds growth. A cheap young Gym Leader under a good Champion can grow into the post.",
    "The training hall now speeds growth at its post (12% a level) and slows the decline of older staff, in place of its flat rating point a level.",
    "Potential (POT) on a trainer's card is where their growth is heading at their own pace. The glossary has a Growth entry.",
    "Old saves don't load (save version 13).",
  ] },
  { id: 23, ver: '0.23.0', date: 'November 16, 2026', time: '10:30 PM ET', title: 'Prestige decides who will sign', items: [
    "A weaker start. Every League now founds from a pool of about 40 candidates who are mostly OVR 45 to 55, with four to six standouts at 58 to 62, plus the founding field. There are no stars and no famous trainers at founding. Your rival Leagues found the same way, from the same kind of pool, so the early years are a level race and walls start loose.",
    "Every trainer has a prestige minimum for joining a League. Nothing up to OVR 62, then 4.5 for each point above it, plus part of their own record (titles, the Hall of Fame, badges and years) and more for a famous trainer. Trainers hungry for a post sign below their bar: another League's staff who want promotion, a claimant, and about one challenger in four. So do trainers holding a grudge against another League. A new League starts with no prestige, so a Champion-calibre trainer (around OVR 72) waits until your League has earned about 45, usually in three to five years.",
    "The founding screen and the hiring pages show each candidate's minimum as Prestige X. Anyone your League can't sign yet shows needs prestige X (you have Y) instead of a button. Rival Leagues are held to the same rule, and they hire Gym Leaders from OVR 48 and Elite Four members from 54.",
    "Outsiders the game finds for a vacancy are no stronger than your League's prestige can attract (scouting still finds a little better), and a famous outsider turns up only once a League could sign one. Your own staff moving between posts, and staff who follow you to a new League, are never held back.",
    "Old saves don't load (save version 12).",
  ] },
  { id: 22, ver: '0.22.0', date: 'November 16, 2026', time: '7:45 PM ET', title: 'Title claims', items: [
    "Title claims. Beating the Champion still wins the title, not the seat, but at New Year the strongest of the year's title winners who wants a seat can claim the Champion's seat. Most would rather keep travelling, so most titles stay just titles. A claim takes the place of the year's other challenge for the Champion's seat.",
    "In your League a claim never goes ahead without you. Allow the claim battle (one battle at the Champion's level, your Champion with their full team and a little more than the seat's usual edge), turn it down, or offer the claimant a post from the hiring pages: a claimant is glad to take one (tagged Claimant), and the claim ends there. A claim you turn down, or leave unanswered for eight weeks, costs your League 2 prestige, and the claimant leaves unhappy, often for another League, which may sign them as a contender against you.",
    "A Champion who loses a claim battle leaves the post: they retire after a long career, or head for another League's circuit, from where they can challenge you again.",
    "A new Champion can't be challenged for the seat, by a claim or by anyone else, in their first two calendar years.",
    "Rival Leagues allow or turn down claims by their aim; the multi-year sim turns every claim down for you. The year report lists claims among the seat challenges, and the glossary has a Title claims entry.",
  ] },
  { id: 21, ver: '0.21.0', date: 'November 16, 2026', time: '7:30 PM ET', title: 'Three Leagues, the progress board and the Hall of Fame on winning', items: [
    "The world starts with three Leagues: yours in the region you choose and two rivals, each in a different region, founded on their own. A new setup option, Starting Leagues (1 to 3), keeps the one-League start. The rivals count toward the prestige a founder needs, so the next League to open needs 50, then 60 and 70.",
    "The progress board, a page of its own (League menu, or Board in the header). One row per gym, Elite Four seat and the Champion: who is there now, how many it let through and walled this year, and the share of tries it held. Open a row for the line, who is there and on which try, who got through lately with the core of their team, who was walled and by whom, and the types beating it this year. A threats strip lists challengers with six badges or more, contenders and anyone who impressed. The League switcher shows any League's board.",
    "The Hall of Fame on winning. Every title win enters the Hall at once, with the team that beat the Champion (species, moves, items and abilities), the year, the League, the Champion beaten and a contender tag, and a Watch button while the title battle is kept. A trainer who wins again gets another entry, and their page gathers them all. Anyone with an entry is a Hall of Famer; each entry adds to their prestige. Nobody is inducted at retirement any more, and folded Leagues stay in the Hall's League filter.",
    "Gym memory. A challenger who loses at a gym remembers the types of the trainer who beat them there, picks their squad against those types on later tries and leans their catches toward counters; Strategy sets how well they learn. The memory stays with that League across runs and is wiped when the gym changes (a new leader or gym trainer, or enough of its Pokémon replaced), so gyms that change hold and gyms that don't wear down.",
    "Old saves don't load (save version 11).",
  ] },
  { id: 20, ver: '0.20.0', date: 'November 16, 2026', time: '1:45 PM ET', title: 'Legendaries reworked', items: [
    "Legendaries obey by badges. A legendary (an Ultra Beast, Missingno or a Paradox Pokémon too) only battles for a challenger with enough badges for its strength: base stats under 600 from 4 badges, under 680 from 6, the box legendaries from 8. Below that it sits out and the challenger fields the rest of the team. At the Elite Four and the title every Pokémon obeys. Your staff are never held back. Legendaries used to sweep the early gyms, so walls are now much harder to get past.",
    "One of each legendary in the world. A legendary held or waiting anywhere can't turn up in another League, and one that moves on waits for a new partner from wherever it is. A world with several Leagues has far fewer legendaries.",
    "Legendaries belong to regions. Kanto's, Johto's, Hoenn's and Sinnoh's own legendaries turn up about three times as often in a League of their region and half as often elsewhere.",
    "Six legendaries that had no way in since the start get events: the Swords of Justice (Cobalion, Terrakion, Virizion) and Keldeo choose challengers by how their year went, Genesect breaks out of a laboratory, and Xerneas awakens.",
    "Paradox Pokémon are back. When an expedition to Area Zero finds Koraidon, Miraidon or Terapagos, the crater stays open in that League for a year and exploring challengers may find a Paradox Pokémon. One of each in the world at a time; they aren't legendaries, so a trainer can hold one beside a legendary.",
    "Legendary sites and Sanctuaries. A gym city where a legendary appeared or was caught becomes a legendary site for ten years. Every League with a gym there can build a Sanctuary (a city slot, three levels): it earns 250, 500 or 800 a week while the site lasts (an attraction's income after) and adds a point of prestige a level each New Year. Rival Leagues build them too. Sites show on the Cities page.",
    "Old saves don't load (save version 10).",
  ] },
  { id: 19, ver: '0.19.0', date: 'November 16, 2026', time: '5:30 AM ET', title: 'Restoring what was lost', items: [
    "Restore what the red cost you. A building level a League lost while in the red (sold in the red, or lost to unpaid upkeep) leaves a ruin, and rebuilding that level in the same place costs only 30% of its price. The Cities page shows it as a Restore button. A level sold while you are solvent leaves no ruin. A League that crashed now climbs back in about six years instead of ten.",
    "Distress sales come to you first. When a rival League loses a building level in a city where you have a gym (to unpaid upkeep, or when it folds), you're offered that level at 30% of its price for four weeks, with a stop and a Distress sales panel on the Cities page. The rival is paid if you buy; otherwise the level is simply lost.",
    "Choose where to start again. When your League folds, the founding screen lets you pick the region of your new League (any region with room) before it opens.",
    "Titles won in a League that has since folded count toward the Triple Crown again.",
    "Fixed: the game could stop when a folded League's former staff were taken on as gym trainers the same week it folded.",
  ] },
  { id: 18, ver: '0.18.0', date: 'November 15, 2026', time: '9:45 PM ET', title: 'Debts, sales and Leagues that fold', items: [
    "Being in the red now costs your buildings. While a League is below zero it stops paying upkeep and everything it has built lapses: attractions earn nothing, and training halls, gym features, the scouting office and the youth academy do nothing until it is back in the black.",
    "Unpaid upkeep wears buildings down. Every 24 weeks in the red in a row, a League's costliest building loses a level. In a city it shares with another League, that League may buy the level at a distress price of 30% of its cost, and the seller gets the money.",
    "Sell buildings. Any building level can now be sold from the Cities page for half what it cost (your standing in that city drops by what it had added). Rival Leagues in the red sell one a month, attractions last.",
    "Leagues can fold. A League in the red at three New Years running, whose buildings sold at half could no longer clear its debts, closes for good: rivals buy what they can, the rest is lost, its staff and challengers scatter to other circuits (older or struggling ones retire) and contracts with it end. Old records still name it. If it is yours, you found a fresh League by hand in your region, with the usual starting fund. You get a warning after two years in the red.",
    "New Leagues come sooner. A retired trainer needs prestige 30 to found the world's second League, then 40, 50, 60 and 70 for the third to sixth. Leaving your own League still needs 60.",
    "Prestige draws trainers. Challengers and staff are up to 6% likelier to take an offer or a sponsorship from a prestigious League, and challengers moving between Leagues lean toward the more prestigious ones.",
  ] },
  { id: 17, ver: '0.17.0', date: 'November 15, 2026', time: '7:30 PM ET', title: 'Contenders, prestige and a League of your own', items: [
    "Send contenders. From the new Contenders page you can send challengers at another League: your academy prospects (who always agree) or anyone on your circuit you sign (who may say no). They run only at that League for two years, and nobody else can hire them meanwhile. You pay a weekly stipend; that League pays you a bounty of 40,000 for each title they win there and 5,000 for each run that reaches its Elite Four. Recall them, renew them, or hire them back. At most four at once.",
    "Rival Leagues send contenders too, by their aim (star-makers most), at Leagues where runs go further, and may send them at you. The year report lists each year's contenders, yours and those sent at you; the League table counts them.",
    "Prestige: every League earns it each New Year from a perfect year, letting through fewer than the world's average, the World Championship, the cities it controls and its rank by wealth, and it fades by a tenth a year. Trainers have it from their careers. The League table shows it.",
    "Found a League of your own. Once your League's prestige reaches 60, you can leave it for 750,000 (on the Money page) if the world has room. Your old League carries on as a rival. Up to three members of staff who want promotion come with you, your academy prospects follow, and you place the new League's staff by hand.",
    "New Leagues are founded by retirees with a prestige of 60 or more, at least eight years apart, instead of on a timer. The world now holds up to six Leagues, two to a region.",
    "Fixed: the League table page could not be opened from the menu.",
    "Fixed: a new Gym Leader could keep a Pokémon that evolved off the gym's type at its level.",
  ] },
  { id: 16, ver: '0.16.0', date: 'November 15, 2026', time: '1:45 PM ET', title: 'Tuning the economy', items: [
    "Leagues now stay closer to level. Attractions pay less (120, 240 and 360 a week by level), the entry fee is 700 a run, and the wall prize falls by 15,000 for each trainer let through (was 20,000).",
    "Money has more to buy. Training halls and gym features go on to levels 4 and 5 (200,000 and 400,000). A new youth academy at your seat (no slot; 100,000, 200,000 and 400,000) raises a young prospect a year per level. They set out on your circuit as one of your own: likelier to take your offers and paid 15% less by you.",
    "Buildings cost upkeep: 5% of what you paid for them a year, paid weekly. The Cities page shows the levels, your upkeep and the academy; the Money page lists upkeep and city income.",
    "Rich rival Leagues now bid over the asking pay when they hire, so challengers and other Leagues' staff are likelier to come to them. With plenty to spare, a rival may also pay at New Year to replace its weakest Elite Four member or Gym Leader with a clearly better trainer. Rivals never build more than their income can keep up.",
    "A rival League in the red now turns money-maker only until it is back on its feet, then goes back to its old aim. It used to stay a money-maker and race ahead of everyone.",
    "Bids and the scouting office now help every League's offers, not just yours. The League table shows what each League has built.",
  ] },
  { id: 15, ver: '0.15.0', date: 'November 15, 2026', time: '10:02 AM ET', title: 'Rival Leagues', items: [
    "Every League now keeps books, not just yours. Rival Leagues earn and spend like you do, each by its aim: a wall-builder hires the best, counters the meta, builds gym features and pays for bans; a star-maker hires young and builds training halls; a money-maker keeps wages down and builds attractions. A rival changes aim when it falls into the red or a money-maker grows rich. Aims replace rivals' old steering rule and their trainers' ban vote.",
    "Being in the red now costs you: every four weeks in the red, your best-paid member of staff (never the Champion) gives twelve weeks' notice, and leaves unless you are back above zero by then. While in the red, automatic hires take the cheapest trainer who fits and cost no signing fee.",
    "The second League of a region opens in yours: when a new League is due it opens in your region first (then elsewhere, four Leagues at most), taking the region's three towns with no gym and five of your cities. A distinguished recent retiree founds each new League as a final act and gives it their name; rarely, a champion still fit enough takes its Champion's seat for ten years.",
    "Cities: a League gains standing in a city where it has a gym by spending there and by how its gym holds against the region's average, and standing fades each year. The League with most standing controls the city. Every city with a gym now earns income each week by its size; its controller takes half and the rest is shared by standing.",
    "Catch-up, gently: challengers whose runs keep ending early drift toward Leagues where runs go further, so a leaky wall draws more entry fees; and stars ask a little more (up to a fifth) of a League far richer than the world's average.",
    "Hiring between Leagues: staff who want promotion can take a bigger post in another League (a gym trainer leading a gym, a Gym Leader joining the Elite Four), and their old League receives the signing fee. Any League can also offer a post to a challenger resting between runs on another League's circuit. Your hiring page lists both, and rival Leagues can take yours.",
    "Title challenges across Leagues: a restless Elite Four member of another League can challenge your Champion at New Year (you approve or refuse); if they win, the two trade places.",
    "A League table page ranks every League by money, with income, spending, wages, cities held and the wall beside it; the year report shows every League's year side by side; the Cities page shows standing, control and your share of each city's income.",
    "The Triple Crown now counts title wins (beating a League's Champion) in three Leagues, not who held a Champion's seat at a year's end.",
    "Saves are smaller: trainers keep fewer former Pokémon and head-to-head records.",
  ] },
  { id: 14, ver: '0.14.0', date: 'November 14, 2026', time: '9:54 PM ET', title: 'Balance retune', items: [
    "The wall was far too hard to get past, so it has been retuned: staff build their teams a little less well than before, and the best challengers stay on the circuit to chase the title instead of being taken onto Leagues' staff.",
    "A challenger who impressed (reached the Elite Four, or won six or more badges in a run, this year or last) is much likelier to turn down an offer of a post, from your League or any other.",
    "Gym trainer places filled automatically go to challengers from the lower half of the circuit, who can turn the place down; the circuit's best are left to chase the title. You can still pick anyone by hand.",
    "A challenger who reached the Elite Four challenges for an Elite Four seat only when its holder is 50 or older.",
  ] },
  { id: 13, ver: '0.13.0', date: 'November 14, 2026', time: '7:34 PM ET', title: 'Money and cities', items: [
    "Your League has money. It comes from an entry fee for every run begun on your circuit, a wall prize at New Year that shrinks with every trainer you let through, and attractions you build. It pays your staff's salaries every week, signing fees, severance, raises, bans and buildings. The new Money page has the books.",
    "Salaries follow the post and the trainer's OVR, reviewed each New Year; famous trainers and title winners ask more. Hiring from outside costs a signing fee and letting someone go costs severance; moves, swaps and steers within your staff are free.",
    "Give a raise to a restless member of staff, or one who gave notice over promotion, to keep them another year (once per post). Bid over the asking pay when you make an offer to improve the odds it is taken.",
    "The founding screen shows each candidate's pay and your wage bill. You start with a fund; there is no cap, but you can start in the red.",
    "In the red, salaries are still paid but you can't hire from outside, ban, build or give raises until you are back above zero.",
    "Cities: build in your gym cities and at your League's seat on the new Cities page. Training halls help staff grow, gym features give a home edge, attractions bring in money, and a scouting office at the seat brings better outsiders and better odds on offers. A city gets more slots as money is spent there. Each region has three more cities without a gym, and you can move a gym to one (everything you built in the old city is lost).",
    "Your banlist is a paid League rule now: ban any Pokémon seen on your circuit, in any week, for one to three years, priced by how high it ranks in the meta. Up to three at once, and a ban that runs out protects that Pokémon for two years. Other Leagues still vote.",
  ] },
  { id: 12, ver: '0.12.0', date: 'November 14, 2026', time: '10:15 AM ET', title: 'Steers and the meta', items: [
    "Steer how your staff build their teams. Each Gym Leader's gym, each Elite Four seat and the Champion's seat can have a steer: Balanced, Counter the trend, Counter the year's meta, Favour bulk, Hit hard, Cover weaknesses or Keep their own Pokémon. A League line covers every post without one, and gym trainers follow their gym's steer. Set them on Your staff in any week.",
    "A steer belongs to the post, so a new holder follows it too. Everyone follows a steer, as closely as their Strategy allows, and each steer trades a little raw strength for what it asks.",
    "Teams follow a steer one Pokémon a month, swapping the Pokémon that fits it worst for a better fit. Someone new to a post builds to the steer at once.",
    "The meta is now read every month: the trend (the circuit's top performers of the last 12 weeks) and the year (last year plus this year so far). The new Meta page shows both, the types that answer them, which of your posts can answer them on their own type, and a button to counter on those posts. The sim stops when the trend shifts.",
    "A trainer steered to counter the meta may field one Pokémon off their type that answers it.",
    "Keep their own Pokémon stops the monthly swaps. A move keeps up to four of the trainer's own Pokémon instead of two, and a famous trainer works their signature Pokémon back in, one a month.",
    "Rival Leagues steer themselves: a gym that can answer the trend on its type counters it, and so does an Elite Four member or Champion who can answer the year's meta. Everyone else stays Balanced.",
    "A staff member who loses a Pokémon to a ban now leans toward the meta's counters only when their post is steered to counter it. A Gym Leader's swap after a losing streak is unchanged, and newcomers still lean toward types that counter the year's top performers.",
    "The year report shows each gym's and seat's steer, the League line and the trend at the year's end. The profile shows a staff member's steer. Glossary entries for Steers and The meta.",
    "Saves from earlier versions can't be loaded." ] },
  { id: 11, ver: '0.11.0', date: 'November 14, 2026', time: '12:09 AM ET', title: 'Seat challenges', items: [
    "Seats can now be won in battle. At New Year each League holds at most one challenge for the Champion's seat and one for an Elite Four seat.",
    "An Elite Four member who wants promotion, has held the seat in two calendar years and didn't have the worst record of the four can challenge the Champion. A Gym Leader who wants promotion and whose gym was one of the year's three best-holding, or a challenger who reached the Elite Four this year and is clearly stronger than the seat's holder (or whose holder is 50 or older), can challenge the weakest Elite Four seat.",
    "A challenge is one battle at the seat's level. The challenger fields a team built for the seat, and keeps it if they win. A beaten Champion takes the winner's Elite Four seat; a beaten Elite Four member takes over the winning Gym Leader's gym, or goes back to the circuit (or retires) if a challenger beat them.",
    "In your League each challenge waits for your answer: approve or refuse it from the staff notices or the year report, within four weeks (unanswered, it goes ahead). A member of staff whose challenge you refuse, or who loses, turns restless: their promotion clock moves a year on. Anyone who challenged waits two years to try again. The Champion still can't be replaced by hand.",
    "Elite Four members' wish for promotion now has a clock for every seat, seat #4 included, since the Champion's seat can be challenged for.",
    "Every challenge shows as news, stops the sim in your League, and appears in a new Seat challenges section of the year report. The last six challenge battles of each League are kept to watch. Rival Leagues hold their challenges at once, and the multi-year sim approves yours.",
    "Fixed: a legendary joining a gym trainer or Gym Leader was added on top of their team, so they could field one Pokémon more than the gym allows.",
    "Fixed: a challenger who won the title and was hired by a League later that year dropped out of the year report's top ten.",
    "A glossary entry for Seat challenges. Saves from earlier versions no longer load.",
  ] },
  { id: 10, ver: '0.10.0', date: 'November 13, 2026', time: '10:13 PM ET', title: 'Ambitions', items: [
    "Every member of staff now has an ambition: promotion (a gym trainer wants a gym of their own, a Gym Leader a later gym or the Elite Four, an Elite Four member a higher seat), staying put, or another run as a challenger. It is set when they take a post, from their age, ratings, post and record, and can change on a birthday. The Champion always stays put. It shows on Your staff, the hiring pages and their profile.",
    "Promotion waits three years in the post, and shows as Restless in the last. Then a Gym Leader or Elite Four member gives 12 weeks' notice (a news item, a stop and a line in the staff notices) and leaves unless you promote them; the post opens with an acting holder, as when someone steps down. A gym trainer just goes, and their place is refilled. Seat #4 of the Elite Four wants the Champion's seat and waits for it.",
    "Staff who leave over an ignored ambition hold a grudge: back to the circuit (or retired, if over 45 with ten years behind them), and with another League open, half the time to that League's circuit, where it can hire them. Staff let go after announcing they would step down can take their grudge to another League the same way.",
    "Another run: a Gym Leader with five outstanding years in a row (and now and then a younger member of staff without a title) may ask to go back to the circuit as a challenger. Let them go on their run, and they come back sharper, guaranteed five years on the circuit; hold them, and they leave anyway a year after asking. This replaces the old automatic Gym Leader comeback.",
    "Staff can refuse a move. Anyone takes a move up. A step down (Elite Four to a gym, a gym to a gym trainer's place) is refused unless their record is poor (two poor years in a row, or the Elite Four's worst record two years running). Anyone who wants to stay put or wants another run refuses a sideways move or a swap. Letting someone go always works, and retirees and outsiders always accept.",
    "Career length now depends on the trainer: those who start young have the longest careers (about 22 to 30 years from age 10 to 14), late starters the shortest (about 8 to 16 from 35). Strong ratings and a title add up to three years, and long service in posts up to two more. Staff step down once past it (and ten years in posts), more likely each year past it.",
    "Rival Leagues answer ambitions: when a post opens they promote one of their own staff who wants it if they're nearly as good as the best newcomer, and fill the post they leave. The multi-year sim does the same for your League.",
    "A challenger who accepted your offer and then wins the title on their last run before arriving backs out half the time.",
    "Glossary entries for Ambitions, Another run, Refusing a move and Career length. Saves from earlier versions no longer load.",
  ] },
  { id: 9, ver: '0.9.0', date: 'November 13, 2026', time: '9:36 PM ET', title: 'Hiring and turnover', items: [
    "Hiring a challenger is now an offer. They can turn it down (and then aren't asked again for half a year); younger trainers, title winners, those doing well on a run and anyone holding a grudge are less keen. One out on a run who accepts finishes it first, for up to 8 weeks, and the post's holder (an acting holder, or the gym trainer you're replacing) stays until they arrive. You can withdraw an offer that was accepted.",
    "Recent retirees can be hired: trainers who retired in the last three years, under 55 and still OVR 55 or better. They come out of retirement at once, and a Hall of Famer stays one.",
    "Picking a gym trainer by hand now offers recent retirees and two outsiders of the leader's type as well. Outsiders nobody picks set out as challengers.",
    "When a gym trainer's place is filled automatically, the best fitting challenger takes it as before, then a recent retiree who fits, and only then a new trainer.",
    "Challengers who impressed you (reached the Elite Four, or won six or more badges in a run, this year or last) are tagged on the circuit and the hiring pages. A hired challenger shows where they're headed.",
    "Warnings: a Gym Leader's poor years in a row (the gym held under 30% of its tries) and an Elite Four member with the worst record of the four two or more years running show on Your staff and in the year report. In your League nothing happens unless you act.",
    "Rival Leagues now replace poor staff: a Gym Leader after three poor years in a row, and an Elite Four member after three years with the worst record of the four if someone clearly better is available. At most one gym and one seat a year.",
    "Rival Leagues fill a vacant post with the best of their circuit and recent retirees (a challenger can turn them down too), and bring in an outsider only when nobody fits. That holds for Elite Four seats as well as gyms.",
    "Glossary entries for Hiring, Impressed and Poor years.",
  ] },
  { id: 8, ver: '0.8.0', date: 'November 13, 2026', time: '8:45 PM ET', title: 'The year report', items: [
    "The year report replaces the year in review. It opens at New Year from the League menu and leads with the trainers let through (who beat the Champion, and when), then perfect years and the streak, how far the best challenger got and the badges conceded.",
    "Each headline number is set against last year, your best year (fewest let through, then fewest badges) and your average so far.",
    "The gyms: for each gym, its leader at year's end and anyone else who led it that year (acting leaders, swaps, moves), its gym trainers, the tries turned back by the gym trainers and by the leader, the badges conceded and the share of tries held. Badges conceded that your gyms still keep can be watched from the row.",
    "The Elite Four and the Champion: for each seat, who held it, how many runs reached it, how many it stopped and how many got past.",
    "The year's ten furthest challengers, every run at the Elite Four, and the year's awards.",
    "Any past year can be opened: step back and forward from the report, or click a year's number in the History page's wall report. Every League keeps its own reports, through the League switcher.",
    "Saves from earlier versions no longer load.",
  ] },
  { id: 7, ver: '0.7.0', date: 'November 13, 2026', time: '7:50 PM ET', title: 'Manage your staff', items: [
    "A new page, Your staff (under League), lists every post in your League. You can change your staff at any time, with no cost or limit for now.",
    "Let go: a Gym Leader's or Elite Four seat you open waits for you with an acting holder, just as when someone steps down. Whoever you let go returns to the circuit as a challenger, or retires if they are over 45 with ten years behind them. Someone who had already announced they were stepping down usually just retires, but now and then they take it as a slight and come back to the circuit to challenge you.",
    "Moving staff: the list of candidates for an open post now includes your other Gym Leaders and Elite Four members. Pick one and they move up, down or sideways; the post they leave opens with an acting holder, and you go straight to choosing for it. Fill it for me still picks only from the circuit, your gym trainers and outsiders, so nothing else opens.",
    "Swap trades two Gym Leaders' gyms or two Elite Four members' seats in one step. Each builds a team for their new post, and a gym trainer who no longer shares a type with the new leader is replaced from the circuit.",
    "Gym trainers: places still fill automatically from the circuit, but you can now Replace a gym trainer with someone you pick (a challenger, another gym trainer, or a Gym Leader or Elite Four member who fits), or let one go and have the place filled at once.",
    "The Champion can't be replaced by hand: the seat changes only when the Champion steps down.",
    "A challenger part-way through a gym whose staff change keeps the tries they have used, but must beat the gym's line from the first trainer again.",
    "Badges conceded lately: each of your gyms keeps its last three badges conceded (the battles its leader lost), to watch from the gym's card on the Gyms page.",
    "Fixes: a new gym trainer whose Pokémon would evolve off the gym's type at its level (a Dartrix becoming Decidueye in a Flying gym) gets an on-type Pokémon instead; a gym whose acting leader steps down takes on a gym trainer so it is never left with none; and the outsiders offered for a post that opens again join the circuit instead of waiting forever.",
  ] },
  { id: 6, ver: '0.6.0', date: 'November 13, 2026', time: '5:45 PM ET', title: 'Found your League by hand', items: [
    "You now found your League yourself. After choosing a region you place its Champion, four Elite Four members and eight Gym Leaders. You can pick from about 40 candidates the game finds (with a few stars and a handful of famous trainers among them) and from the founding field. Each trainer shows their type, age, OVR and all five ratings, and a type that another post already holds is flagged. Repeats are allowed.",
    "A gym's type is still its leader's class. Each gym takes on two gym trainers from the circuit, the best challengers who share a type with the leader, and the game makes one only when nobody fits. Anyone you don't place sets out as a challenger. The founding field is larger (36 instead of 24), so the circuit stays full.",
    "Fill the rest for me places the best available trainer in every empty post, preferring types that aren't taken yet. Your choices are saved as you go, and Back to setup starts again.",
    "Staff now step down only after a long career: once they are past their career length and have held posts for at least ten years. They announce it a year ahead with a news item, a stop and a Steps down tag, and they leave on their next birthday.",
    "When a Gym Leader or Elite Four member leaves your League, the post waits for you. Until you choose, the gym's stronger gym trainer is acting leader (the gym runs one gym trainer short), or a stand-in holds the Elite Four seat. The Champion's seat is never empty: the strongest Elite Four member moves up, and their seat is the one that waits.",
    "To fill a post, choose from everyone on the circuit, your own gym trainers and two outsiders, or press Fill it for me. Open posts and coming departures are listed at the top of the circuit and gym pages. Rival Leagues still fill their posts at once, and the multi-year sim fills yours for you.",
    "The sim now stops only for your own League (and for New Year).",
  ] },
  { id: 5, ver: '0.5.0', date: 'November 13, 2026', time: '4:30 PM ET', title: 'The wall, tuned', items: [
    "The wall is tuned. Every League's staff now build their teams as a trainer 45 rating points weaker would have before. Scouting, Strategy and Training still decide how good a team is, and the gap between strong and poor staff is unchanged, but no League is close to unbeatable any more. Even a League with excellent staff should expect to let a few trainers through each year, and a perfect year is now a rare feat.",
    "The Elite Four and Champion are still one run: a single loss ends it. Only an excellent challenger gets through all five battles.",
    "Challengers stay on the circuit longer. One who keeps going out early now gives up only after their first three years, and less often, so the field is older and larger (about 50 to 70 in a one-League world).",
    "A challenger who reached the Elite Four now takes their next run to another League three times in four, where there is one.",
    "The wall report on the History page leads with the number of trainers let through (titles conceded), then perfect years and the streak.",
  ] },
  { id: 4, ver: '0.4.0', date: 'November 13, 2026', time: '11:30 AM ET', title: 'One continuous world: no more seasons', items: [
    "There are no seasons any more. The world runs week by week on one calendar that never stops: a year is 48 weeks, twelve months of four. Nothing waits for a League tournament or an offseason.",
    "Every challenger is on their own clock. They set out on a run from the first gym with their best three Pokémon, get three tries at each gym, and take on the Elite Four and the Champion as soon as they have eight badges and are ready (up to three weeks spent filling their team first). A third loss at one gym ends the run. Then they rest for 6 to 10 weeks and set out again from the first gym with no badges.",
    "The wall is scored by the calendar year. A perfect year is one with no title conceded, and the streak counts perfect years in a row. The header also shows how long it has been since a title was last conceded, and the circuit page keeps a running tally of the year so far.",
    "Time moves with three buttons: Next week, Next month and To New Year. The longer steps stop early when something needs you: a title conceded, a post that fell vacant, or the New Year report. Sim years still plays whole years without stopping.",
    "The world's slow changes are spread through the year. Every trainer has a birthday week, when they grow a year older and their ratings move. Staff retire on their birthday and the post is filled at once; a challenger who decides to retire sees their run through first. New trainers set out one at a time, about eight a year.",
    "A circuit no longer has 24 places. Everyone who wants to challenge does. A challenger who keeps going out early (three or more runs in a row that end sooner than a typical run) gives up after their first two years, which keeps the field at around 30 to 40.",
    "New Year brings the year in review: the wall report, the awards, the meta report, the ban vote and, with two or more Leagues, the World Championship. History, records and profiles now count years, and a profile shows a challenger's best run of each year.",
    "Legendary encounters, roaming legendaries, storms, outbreaks and Ultra Wormholes can now begin in any week and leave on their own timers. They happen about as often per year as before.",
    "With more than one League, a challenger who reached the Elite Four often takes their next run to a different League after only 2 or 3 weeks of rest.",
    "Not tuned yet. The wall is still far too strong for a well-staffed League: tests showed that starting teams, squad picking, gym trainers and tries per gym barely move it, because almost nobody gets through the Elite Four and Champion. What to change instead is the next decision.",
    "Saves from earlier versions can't be loaded: the calendar changed too much. Start a new world.",
  ] },
  { id: 3, ver: '0.3.0', date: 'November 13, 2026', time: '9:50 AM ET', title: 'Gym types from the class, and staff who build their own teams', items: [
    "A gym's type is now its leader's class. A dual-type leader keeps both types: a Rock/Flying leader leads a Rock/Flying gym. A leader with no type focus (an Ace Trainer or a Veteran) leads a gym with a mixed team.",
    "Gym trainers follow the leader. In a typed gym each gym trainer shares at least one type with the leader and fields Pokémon of their own class's types, so a Rock/Flying gym can have a Rock/Fighting or a Flying/Fairy gym trainer. In an untyped gym they can be of any class. Gym trainers can now have a dual-type class too.",
    "Staff build their own teams, and their ratings decide how well. Scouting sets how strong the Pokémon they can find. Strategy decides how well the team fits together (fewer shared weaknesses, answers to what beats their type) and how many of their Pokémon hold an item. Training raises each Pokémon: better IVs, and more often a nature that suits it and coverage moves that cover its weak spots. Bond and Nerve still act inside the battle.",
    "Gym teams stay on their type. A leader on a losing streak, a ban replacement or a returning former Pokémon now always comes from the leader's own types, so a Fire gym can no longer end up with no Fire Pokémon.",
    "The meta report still names the season's top Pokémon, but the Gym Leaders and Elite Four no longer swap in off-type counters for them. How a League answers the meta will be redesigned.",
    "Staff now leave only by retiring with age. A leader is no longer replaced after three poor seasons, a leader no longer returns to the circuit after a long run of strong ones, and a challenger no longer takes an Elite Four seat after a deep League run. These come back later as your decisions.",
    "Gym weather now comes from the gym: the first of its leader's types that brings weather sets it for every battle there, gym trainers included.",
    "Not tuned yet. Strong staff now hold the wall far better than poor staff, and the wall is still too strong overall. Tuning waits for the next change to how the calendar works.",
  ] },
  { id: 2, ver: '0.2.0', date: 'November 12, 2026', time: '9:45 PM ET', title: 'The wall: set levels, three tries and gym trainers', items: [
    "Every battle on the circuit is now fought at a set level for both sides: gyms at 16, 24, 32, 41, 51, 61, 70 and 77, the Elite Four at 81, 84, 87 and 89, and the Champion at 96. Nobody can out-level a gym any more, so gym 1 can be a wall too.",
    "Challengers' Pokémon no longer have levels of their own. Each one takes the form and moves it would have at the level of its trainer's next battle, so a trainer with a Charizard meets gym 1 with a Charmander. Challengers spend the season building a team and taking on the gyms. The Lucky Egg is gone, since there are no levels to gain.",
    "A challenger fields as many Pokémon as the trainer in front of them, picked for the matchup. A higher Strategy rating picks better.",
    "Gym teams are bigger at the early gyms: 3, 3, 4, 4, 5, 5, 6 and 6 Pokémon. Every Elite Four member now fields six.",
    "Every gym has two gym trainers of the leader's type, each with one Pokémon fewer than the leader. A challenger must beat both, then the leader, and is healed between battles. A gym trainer already beaten stays beaten. Gym trainers are placed automatically for now.",
    "Three tries per gym. A loss to a gym trainer or the leader costs one, and a third loss at the same gym ends that challenger's season. The circuit page shows each challenger's tries left, or the week they went out.",
    "Your Champion keeps the seat when beaten. The winner is credited with a title and stays a challenger, and the League records a title conceded. If several challengers beat the Champion in one season, each win counts.",
    "The Champion now leaves only by retiring with age; the strongest Elite Four member moves up, automatically for now. The Elite Four title shot and the Interim Champion rule are gone.",
    "Gym rotation is removed: leaders and their gym trainers stay at their gym.",
    "New wall report on the History page: perfect seasons (no title conceded) and the streak, and for each season the titles and badges conceded and how far the best challenger got. The Gyms page shows each gym's set level, its gym trainers and its record of tries turned back and badges conceded.",
    "Saves from 0.1.0 can't be loaded, because the rules of the world changed. Start a new League.",
    "Nothing is balanced yet. These rules are measured, not tuned; tuning comes with the next version.",
  ] },
  { id: 1, ver: '0.1.0', date: 'November 12, 2026', time: '9:03 PM ET', title: 'The seed: a world that runs on its own', items: [
    "Pokémon League Builder starts here, seeded from Pokémon League GM 2.0.2. It has its own save, its own version numbers and this fresh changelog. The two games don't share saves.",
    "You don't run a League yet. For now the world runs itself: 24 challengers travel the badge circuit each season, and the Gym Leaders, the Elite Four and the Champion try to stop them. You pick the region, play or sim the seasons, and watch.",
    "Taken out, because they don't serve a game about running a League: the draft, teams and travelling parties, trust and sit-downs, trades and road trades, the ranch, the Team Battle Cup, the Midseason Tournament, villain events and Shadow Pokémon, Pokérus and Lucky Pokémon, and the office, party and trade screens.",
    "With no draft, new trainers set out on their own each offseason. They and the free agents compete for the 24 places on a League's circuit.",
    "The banlist is decided by the League's trainers alone for now. Challengers let banned Pokémon go.",
    "Kept: the battle engine and all Pokémon, move and ability data; catching and wild Pokémon; trainer ratings, traits and classes; famous trainers, trainer packs and My Pokédex; Gym Leaders adapting and gym weather; legendary events; several Leagues and the World Championship; records, the Hall of Fame and god mode (open a League, edit any trainer).",
    "Cities are now things of their own in the world, and a gym sits in a city. Nothing looks different yet; it is groundwork for Leagues sharing cities later.",
  ] },
];
const UPDATES_SEEN_KEY = 'plb-updates-seen';
const updatesSeen = () => { try { return +(localStorage.getItem(UPDATES_SEEN_KEY) || 0); } catch (e) { return 0; } };
const updatesNew = () => UPDATES.length && UPDATES[0].id > updatesSeen();
function markUpdatesSeen() { try { localStorage.setItem(UPDATES_SEEN_KEY, String(UPDATES[0].id)); } catch (e) {} }
const UPDATES_RULE = 'Every version is numbered, dated and timestamped (Eastern Time). All the changes made in one round of work are listed together under that one version.';
function updStamp(u) { return `v${verName(u)} · ${u.date}${u.time ? ` · ${u.time}` : ''}`; }
function viewUpdates() {
  const back = S ? '' : '<button class="btn small" data-act="nav" data-v="circuit">← Back to setup</button>';
  return `<section class="panel callout"><div class="ph"><h1>Updates</h1>${back}</div>
    <p class="muted">What's changed in ${GAME_NAME}, newest first. Current version: <span class="num">${updStamp(UPDATES[0])}</span></p>
    <p class="fine"><strong>Versioning rule:</strong> ${UPDATES_RULE}</p></section>
  <section class="panel"><div class="ph"><h2>Changelog</h2><span class="muted">${UPDATES.length} updates</span></div>
    ${UPDATES.map(u => `<section class="upd"><div class="upd-h"><h3>${u.title}</h3><span class="muted small num">${updStamp(u)}</span></div><ul class="changes">${u.items.map(x => `<li>${x}</li>`).join('')}</ul></section>`).join('')}</section>
  <section class="panel"><div class="ph"><h2>Copyright disclaimer</h2></div>
    <p>${GAME_NAME} is an unofficial, fan-made game. It is not affiliated with, endorsed, sponsored or approved by Nintendo, Creatures Inc., GAME FREAK inc. or The Pokémon Company.</p>
    <p>Pokémon, Pokémon names, moves, abilities, items and all related names and trademarks are © and ™ Nintendo, Creatures Inc. and GAME FREAK inc. They are used here for non-commercial fan purposes only, and no infringement is intended.</p>
    <p>Any other names, including real people, teams and brands in optional trainer packs, are trademarks of their respective owners and are used only for fun. Those owners have no connection to this game.</p>
    <p>${GAME_NAME} is open source. To get access to the project, ask in the Discord: <a href="https://discord.gg/2mbaC7gUMk" target="_blank" rel="noopener noreferrer">discord.gg/2mbaC7gUMk</a>.</p></section>
  <section class="panel"><div class="ph"><h2>AI use disclosure</h2></div>
    <p>This game was made with generative AI. Its code, in-game text and game data were written with Claude, an AI model made by Anthropic, following the creator's design, direction and testing.</p>
    <p>The game uses no AI-generated images, music or voices. Pokémon data is adapted from the main series games, and AI-written content may contain mistakes.</p></section>`;
}
function updatesBody() {
  return `<div class="mh"><h2>Updates</h2><button class="btn icon" data-act="close" aria-label="Close">×</button></div>
  <p class="muted small">What's changed in ${GAME_NAME}, newest first.</p>
  ${UPDATES.map(u => `<section class="upd"><div class="upd-h"><h3>${u.title}</h3><span class="muted small">${u.date}</span></div><ul class="changes">${u.items.map(x => `<li>${x}</li>`).join('')}</ul></section>`).join('')}`;
}
function menuBody() {
  const m = modal;
  return `<div class="mh"><h2>World file</h2><button class="btn icon" data-act="close" aria-label="Close">×</button></div>
  <div class="confirm-row"><button class="btn" data-act="simmany">Sim multiple years…</button><button class="btn" data-act="glossary">Glossary</button><button class="btn" data-act="images">Images</button>${godOn() ? '<button class="btn" data-act="nav" data-v="god">God mode</button>' : ''}<button class="btn" data-act="updates">Updates${updatesNew() ? ' <span class="newdot" aria-label="new"></span>' : ''}</button></div>
  <p class="muted">Progress saves automatically in this browser after every week. Copy the save to back it up or move it to another device.</p>
  <div class="confirm-row"><button class="btn" data-act="export">Copy save to clipboard</button>${canSaveFile() ? '<button class="btn" data-act="savefile">Download save file</button>' : ''}<button class="btn" data-act="importshow">Load a save</button></div>
  ${m.copying ? '<p class="fine">Preparing the save…</p>' : m.copied ? '<p class="fine">Save copied to the clipboard. Paste it into Load a save to bring this world back.</p>' : ''}
  ${m.exportText ? `<textarea id="exportbox" class="box" readonly rows="4">${m.exportText}</textarea><p class="fine">The clipboard isn't available here. Select the text above and copy it.</p>` : ''}
  ${m.importing ? `<label class="fine" for="importbox">Paste a save:</label><textarea id="importbox" class="box" rows="4"></textarea><div class="confirm-row"><button class="btn primary" data-act="importgo">Load this save</button></div>${m.err ? `<p class="warn">${m.err}</p>` : ''}` : ''}
  <hr><div class="confirm-row">${m.confirmNew ? `<span>This erases the current world.</span><button class="btn danger" data-act="newgo">Erase and start over</button><button class="btn" data-act="newcancel">Cancel</button>` : `<button class="btn danger" data-act="newask">Start a new world</button>`}</div>`;
}

// ---------- battle viewer ----------
function battleShell() {
  const r = modal.r;
  const side = (s, si) => `<div class="bside s${si}"><div class="bname">${trMini(T(s.id), 32)}<span>${s.name}</span></div><div class="pips">${s.team.map((m, i) => `<span class="pip" id="pip-${si}-${i}" title="${m.sp}"></span>`).join('')}</div>
    <div class="active" id="act-${si}"><span class="a-pic" id="apic-${si}"></span><span class="a-name">—</span><span class="a-lv"></span><div class="hp"><i id="hp-${si}"></i></div></div></div>`;
  return `<div class="mh"><h2>${r.title}</h2><button class="btn icon" data-act="close" aria-label="Close">×</button></div>
  <div class="arena">${side(r.sides[0], 0)}<div class="vs">VS</div>${side(r.sides[1], 1)}</div>
  <ol class="blog" id="blog"></ol>
  <div class="bspeed" id="bspeed"><span class="bspeed-l">Speed</span><span class="segs bspeed-segs" role="group" aria-label="Battle speed">${BSPEEDS.map(([k, , label]) => `<button class="seg${bSpeed === k ? ' on' : ''}" data-act="bspeed" data-v="${k}" aria-pressed="${bSpeed === k}">${label}</button>`).join('')}</span><button class="btn small" data-act="bpause" id="bpause">Pause</button></div>
  <div class="confirm-row"><button class="btn" data-act="bskip" id="bskip">Skip to the result</button><span class="bresult" id="bres"></span></div>`;
}
// Battle speed (v202): milliseconds per line of the battle log; the choice is remembered in this browser.
const BSPEEDS = [['slow', 1100, 'Slow'], ['normal', 600, 'Normal'], ['fast', 260, 'Fast'], ['vfast', 80, 'Very fast']];
const BSPEED_KEY = 'plb-battle-speed';
let bSpeed = (() => { try { const v = localStorage.getItem(BSPEED_KEY); return BSPEEDS.some(b => b[0] === v) ? v : 'normal'; } catch (e) { return 'normal'; } })();
const bSpeedMs = () => (BSPEEDS.find(b => b[0] === bSpeed) || BSPEEDS[1])[1];
function setBattleSpeed(v) {
  if (!BSPEEDS.some(b => b[0] === v)) return; bSpeed = v; try { localStorage.setItem(BSPEED_KEY, v); } catch (e) {}
  document.querySelectorAll('[data-act="bspeed"]').forEach(b => { const on = b.dataset.v === v; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
  if (modal && modal.kind === 'battle' && modal.resume && !modal.paused && !modal.done) modal.resume();
}
function toggleBattlePause() {
  if (!modal || modal.kind !== 'battle' || modal.done) return;
  modal.paused = !modal.paused; const b = $('#bpause'); if (b) b.textContent = modal.paused ? 'Play' : 'Pause';
  if (modal.paused) clearInterval(player); else modal.resume && modal.resume();
}
function startPlayback() {
  clearInterval(player);
  const r = modal.r; let k = 0;
  const hp = [[], []]; r.sides.forEach((s, si) => s.team.forEach((m, i) => hp[si][i] = m.max));
  const act = [-1, -1];
  const logEl = $('#blog');
  const megaName = [{}, {}];
  const nm = (si, i) => megaName[si][i] || r.sides[si].team[i].sp;
  function line(text, cls = '') { const li = document.createElement('li'); li.className = cls; li.innerHTML = text; logEl.appendChild(li); logEl.scrollTop = logEl.scrollHeight; }
  function updActive(si) { const i = act[si]; if (i < 0) return; const m = r.sides[si].team[i]; const box = $('#act-' + si);
    { const pic = $('#apic-' + si), key = m.sp + (m.shiny ? '*' : ''); if (pic && pic.dataset.k !== key) { pic.dataset.k = key; const u = monImg(m.sp, m.shiny || m.radiant); pic.innerHTML = u ? `<img class="pic${si ? ' flip' : ''}" src="${u}" alt="" width="76" height="76">` : ''; } } box.querySelector('.a-name').textContent = m.sp; box.querySelector('.a-lv').textContent = 'Lv ' + (SP[m.sp] && SP[m.sp].glitch ? '??' : m.L); const pct = Math.max(0, hp[si][i] / m.max * 100); const bar = $('#hp-' + si); bar.style.width = pct + '%'; bar.className = pct < 25 ? 'red' : pct < 50 ? 'amb' : ''; }
  function step() {
    const e = r.ev[k++]; if (!e) { clearInterval(player); return false; }
    if (e.k === 'send') { act[e.s] = e.i; $(`#pip-${e.s}-${e.i}`)?.classList.add('out'); line(`<b>${r.sides[e.s].name}</b> sends out <b>${nm(e.s, e.i)}</b> (Lv ${SP[r.sides[e.s].team[e.i].sp] && SP[r.sides[e.s].team[e.i].sp].glitch ? '??' : r.sides[e.s].team[e.i].L}).`, 'send'); updActive(e.s); }
    if (e.k === 'hit') { const ts = 1 - e.s; const prev = hp[ts][e.ti]; hp[ts][e.ti] = e.hp; const pct = Math.round((prev - e.hp) / r.sides[ts].team[e.ti].max * 100);
      const tags = (e.mult >= 2 ? ' <em class="se">super effective</em>' : e.mult < 1 ? ' <em class="nve">not very effective</em>' : '') + (e.crit ? ' <em class="crit">critical hit</em>' : '') + (e.feel === 'solid' ? ' <em class="solid">solid hit</em>' : e.feel === 'glance' ? ' <em class="glance">glancing blow</em>' : '') + (e.mo ? ' <em class="mo">on a roll</em>' : '');
      line(e.mn ? `${nm(e.s, e.i)} used <b>${e.mn}</b>! ${nm(ts, e.ti)} loses ${pct}%.${tags}` : `${nm(e.s, e.i)} hits ${nm(ts, e.ti)}${e.mt ? ` with a ${e.mt} move` : ''} for ${pct}%.${tags}`, 'hit s' + e.s); updActive(ts); }
    if (e.k === 'miss') line(`${nm(e.s, e.i)} used <b>${e.mn}</b>, but it missed${e.guard ? ` — ${nm(1 - e.s, e.ti)} was ready for it` : ''}!`, 'miss');
    if (e.k === 'dodge') line(`${nm(e.s, e.i)} used <b>${e.mn}</b>, but ${nm(1 - e.s, e.ti)} dodged it!`, 'miss');
    if (e.k === 'use') line(`${nm(e.s, e.i)} used <b>${e.mn}</b>!`, 'hit s' + e.s);
    if (e.k === 'mega') { line(`<b>${r.sides[e.s].name}</b>'s Key Stone reacts! ${nm(e.s, e.i)} Mega Evolved into <b>${e.to}</b>!`, 'mega'); megaName[e.s][e.i] = e.to; updActive(e.s); }
    if (e.k === 'bond') { line(`${nm(e.s, e.i)} and <b>${r.sides[e.s].name}</b> are in perfect sync! It became <b>${e.to}</b>!`, 'bond'); megaName[e.s][e.i] = e.to; updActive(e.s); }
    if (e.k === 'pain') line(`<b>${r.sides[e.s].name}</b> feels ${nm(e.s, e.i)}'s pain, and the rest of the team falters.`, 'pain');
    if (e.k === 'endure') line(`${nm(e.s, e.i)} hung on at 1 HP!`, 'endure');
    if (e.k === 'note') { if (e.hp != null && e.s >= 0) { hp[e.s][e.i] = e.hp; updActive(e.s); }
      line(e.txt.replace('{0}', e.s >= 0 ? `<b>${nm(e.s, e.i)}</b>` : '').replace('{1}', e.os != null ? `<b>${nm(e.os, e.oi)}</b>` : ''), 'note ' + (e.cls || '')); }
    if (e.k === 'item') { const it = ITEMS[e.it] ? ITEMS[e.it].name : e.it; if (e.hp != null) { hp[e.s][e.i] = e.hp; updActive(e.s); }
      line(e.it === 'focussash' ? `${nm(e.s, e.i)} hung on with its <b>${it}</b>!` : e.it === 'sitrus' ? `${nm(e.s, e.i)} ate its <b>${it}</b> and restored some HP.` : e.it === 'leftovers' ? `${nm(e.s, e.i)} restored a little HP with its <b>${it}</b>.` : e.it === 'lifeorb' ? `${nm(e.s, e.i)} lost some HP to its <b>${it}</b>.` : `${nm(e.s, e.i)}'s ${it}.`, 'item'); }
    if (e.k === 'faint') { $(`#pip-${e.s}-${e.i}`)?.classList.add('down'); line(`${nm(e.s, e.i)} fainted.`, 'faint'); }
    if (e.k === 'end') { const w = r.sides[e.w]; line(`<b>${w.name}</b> wins with ${w.left} Pokémon left.`, 'end'); $('#bres').textContent = w.name + ' wins'; $('#bskip').hidden = true; modal.done = true; const sp = $('#bspeed'); if (sp) sp.hidden = true; }
    return true;
  }
  modal.skip = () => { while (step()) {} };
  const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  modal.paused = false; modal.done = false;
  modal.resume = () => { clearInterval(player); player = setInterval(step, bSpeedMs()); };
  if (reduce) modal.skip(); else modal.resume();
}

// ---------- render ----------
// ---------- playing inside another site's page (itch.io and the like) ----------
// There the game is a frame from another site, and many browsers (every iPhone / iPad browser, Safari, Brave) keep its
// storage only until the browser closes. Opening the game in its own tab saves normally; the league is handed over.
const EMBEDDED = (() => { if (window.claude) return false; try { return window.self !== window.top && !window.top.location.href; } catch (e) { return true; } })();
let embedNoteHidden = (() => { try { return sessionStorage.getItem('plb-embed-note') === '1'; } catch (e) { return false; } })();
function embedNote() {
  if (!EMBEDDED || embedNoteHidden) return '';
  return `<div class="embednote" role="note"><div class="embednote-in"><span><b>Your saves may not last here.</b> Some browsers (every iPhone and iPad browser, Safari, Brave) wipe a game's saves when it's played inside another site's page. Open the game in its own tab to keep your progress${S ? ' (your world comes with it)' : ''}, and copy your save from the ⋯ menu now and then as a backup.</span>
    <span class="embednote-act"><button class="btn small primary" data-act="ownTab">Open in its own tab</button><button class="btn small ghost" data-act="embedhide">Hide</button></span></div></div>`;
}
// the itch page's copy opens a new tab and, when that tab says it's ready, hands it the current league as a save code
function openOwnTab() {
  const url = location.href.split('#')[0] + '#from-embed';
  const w = window.open(url, '_blank');
  if (!w) { toast("The browser blocked the new tab. Allow pop-ups for this page, or copy your save and load it in a new tab."); return; }
  const onMsg = async ev => {
    if (ev.source !== w || ev.origin !== location.origin || !ev.data || ev.data.type !== 'plb-ready') return;
    window.removeEventListener('message', onMsg);
    w.postMessage({ type: 'plb-save-msg', code: S ? await saveCode() : null }, location.origin);
  };
  window.addEventListener('message', onMsg);
  setTimeout(() => window.removeEventListener('message', onMsg), 60000);
}
// the new tab: ask the page that opened it for its league, and take it unless this tab already has a later season
function receiveFromEmbed() {
  if (typeof location === 'undefined' || location.hash !== '#from-embed' || !window.opener) return;
  history.replaceState(null, '', location.href.split('#')[0]);
  const onMsg = async ev => {
    if (ev.source !== window.opener || ev.origin !== location.origin || !ev.data || ev.data.type !== 'plb-save-msg') return;
    window.removeEventListener('message', onMsg);
    if (!ev.data.code) return;
    const v = await parseSave(ev.data.code); if (!v) return;
    if (S && (S.season || 0) > (v.season || 0)) { toast('This tab already has a later year of your world, so it was kept.'); return; }
    adoptSave(v); save(); render(); toast(`Your world came over from the other page: Year ${S.season || 1}. Progress now saves in this tab.`);
  };
  window.addEventListener('message', onMsg);
  try { window.opener.postMessage({ type: 'plb-ready' }, location.origin); } catch (e) {}
}
// (0.59.0) a redraw rebuilds the toast's element, so a message shown just before it (the Talks page's offers, the
// hiring pages' talks) was wiped at once: render() puts a message still showing back on the new element
function render() { render0(); keepToast(); }
function render0() {
  if (!S) dexPreview = setupPage === 'region' && rgDraft ? regionDex(rgRec()) : null; // (0.31.0) the region editor's own Pokémon
  applyDex(dexWanted());
  ensureCustom();
  const app = $('#app');
  if (S) fixView();
  if (!S) { app.innerHTML = `<header class="top"><div class="top-in"><div class="mark"><span class="mark-ball" aria-hidden="true"></span><div><div class="mark-name">${GAME_NAME} <span class="mark-ver">v${verName(UPDATES[0])}</span></div><div class="mark-sub">New world</div></div></div><div class="top-act"><button class="btn ghost" data-act="glossary">Glossary</button><button class="btn ghost" data-act="updates">Updates${updatesNew() ? '<span class="newdot"></span>' : ''}</button></div></div></header>` + embedNote() + (view === 'updates' ? `<main class="wrap" id="main">${viewUpdates()}</main>` : viewSetup()); if (view === 'updates') applyFolds(app, 'updates'); return; }
  if (S.founding) useLeague(ME());
  if (S.founding) { app.innerHTML = `<header class="top"><div class="top-in"><div class="mark"><span class="mark-ball" aria-hidden="true"></span><div><div class="mark-name">${GAME_NAME} <span class="mark-ver">v${verName(UPDATES[0])}</span></div><div class="mark-sub">Founding the ${S.lgName}</div></div></div><div class="top-act"><button class="btn ghost" data-act="glossary">Glossary</button></div></div></header>` + embedNote() + viewFounding() + '<div id="toast" class="toast" role="status" hidden></div>'; return; }
  bindView();
  if (['hire', 'staff', 'gtpick', 'money', 'cities', 'contenders', 'ranch', 'plans', 'talks'].includes(view)) useLeague(ME());
  let v = '';
  if (view === 'circuit') v = viewCircuit();
  if (view === 'gyms') v = viewGyms();
  if (view === 'news') v = viewNews();
  if (view === 'history') v = viewHistory();
  if (view === 'posts') v = viewPosts();
  if (view === 'records') v = viewRecords();
  if (view === 'hof') v = viewHof();
  if (view === 'dex') v = viewDex();
  if (view === 'trainers') v = viewTrainers();
  if (view === 'recap') v = viewRecap();
  if (view === 'god') v = viewGod();
  if (view === 'hire') v = viewHire();
  if (view === 'staff') v = viewStaff();
  if (view === 'meta') v = viewMeta();
  if (view === 'money') v = viewMoney();
  if (view === 'table') v = viewTable();
  if (view === 'board') v = viewBoard();
  if (view === 'cities') v = viewCities();
  if (view === 'ranch') v = viewRanch();
  if (view === 'plans') v = viewPlans();
  if (view === 'talks') v = viewTalks(); // (0.53.0)
  if (view === 'contenders') v = viewContenders();
  if (view === 'gtpick') v = viewGtPick();
  if (view === 'updates') v = viewUpdates();
  app.innerHTML = header() + nav() + embedNote() + `<main class="wrap" id="main">${lgBar()}${v}</main><div id="toast" class="toast" role="status" hidden></div>`;
  applyFolds(app, foldScope());
}
// ---------- collapsible boxes (v171) ----------
// Any panel with a heading, and each Records board, folds down to its header when its title is tapped. What's
// folded is remembered per page (a trainer's page counts as one page for every trainer), in this browser only.
const FOLD_STORE = 'plb-folds';
let folded = (() => { try { return new Set(JSON.parse(localStorage.getItem(FOLD_STORE) || '[]')); } catch (e) { return new Set(); } })();
const foldScope = () => view;
function saveFolds() { try { localStorage.setItem(FOLD_STORE, JSON.stringify([...folded].slice(-400))); } catch (e) {} }
function applyFolds(root, scope) {
  if (!root || !root.querySelectorAll) return;
  const mark = (box, head, key) => {
    if (!head || head.dataset.act || head.querySelector('.fchev')) return;
    key = key.replace(/▾/g, '').replace(/\d+/g, '#').replace(/\s+/g, ' ');
    const shut = folded.has(key);
    box.classList.add('can-fold'); box.classList.toggle('folded', shut); head.classList.add('fold-head');
    head.dataset.act = 'fold'; head.dataset.k = key;
    head.setAttribute('role', 'button'); head.setAttribute('tabindex', '0'); head.setAttribute('aria-expanded', String(!shut));
    head.insertAdjacentHTML('afterbegin', '<span class="fchev" aria-hidden="true">▾</span>');
  };
  for (const box of root.querySelectorAll('section.panel')) {
    if (box.classList.contains('fold')) continue; // the Advanced page has its own folding
    const head = box.querySelector(':scope > .ph > h2, :scope > .ph > h3') || box.querySelector(':scope > h2, :scope > h3');
    if (head) mark(box, head, `${scope}|${head.textContent.trim()}`);
  }
  for (const box of root.querySelectorAll('.upd')) { const head = box.querySelector(':scope > .upd-h > h3'); if (head) mark(box, head, `${scope}|upd|${head.textContent.trim()}`); }
  for (const box of root.querySelectorAll('.gl-sec')) { const head = box.querySelector(':scope > .gl-h > h3'); if (head) mark(box, head, `${scope}|gloss|${head.textContent.trim()}`); }
  for (const box of root.querySelectorAll('.recboard:not(.big)')) {
    const head = box.querySelector(':scope > .rec-h');
    const sec = box.closest('section.panel'), secH = sec && sec.querySelector(':scope > .ph > h2');
    if (head) mark(box, head, `${scope}|board|${secH ? secH.textContent.replace('▾', '').trim() : ''}|${head.textContent.trim()}`);
  }
}
function toggleFold(el) {
  const k = el.dataset.k, box = el.closest('.can-fold'); if (!k || !box) return;
  const shut = !folded.has(k);
  if (shut) folded.add(k); else folded.delete(k);
  box.classList.toggle('folded', shut); el.setAttribute('aria-expanded', String(!shut));
  saveFolds();
}
// with several Leagues, the league-wide pages show one League at a time; a trainer's page shows their own League
const VIEWS = ['circuit', 'gyms', 'news', 'history', 'posts', 'records', 'hof', 'dex', 'trainers', 'recap', 'god', 'updates', 'hire', 'staff', 'meta', 'money', 'cities', 'gtpick', 'contenders', 'table', 'board', 'ranch', 'plans', 'talks'];
const LG_VIEWS = ['circuit', 'gyms', 'news', 'history', 'posts', 'recap', 'records', 'board'];
function bindView() {
  if (!S || nLeagues() < 2) return;
  viewLg = Math.min(viewLg, nLeagues() - 1);
  useLeague(viewLg);
}
function lgBar() {
  if (nLeagues() < 2 || !LG_VIEWS.includes(view)) return '';
  return `<nav class="lgbar segs" aria-label="League">${Array.from({ length: nLeagues() }, (_, i) => `<button class="seg${i === viewLg ? ' on' : ''}" data-act="lgview" data-v="${i}" aria-pressed="${i === viewLg}">${leagueName(i)}</button>`).join('')}</nav>`;
}
let toastMsg = null;
function keepToast() { const el = $('#toast'); if (!el || toastMsg == null) return; el.textContent = toastMsg; el.hidden = false; }
function toast(msg, ms = 3400) { toastMsg = msg; keepToast(); clearTimeout(toastTimer); toastTimer = setTimeout(() => { toastMsg = null; const el = $('#toast'); if (el) el.hidden = true; }, ms); }
function go(v) { view = v; render(); window.scrollTo(0, 0); }
// a view that no longer fits (a year in review before the first New Year, god mode in a world without it) falls back to the circuit
function fixView() { if (!VIEWS.includes(view) || (view === 'recap' && !S.history.some(x => x.titles != null)) || (view === 'god' && !godOn()) || (['staff', 'gtpick', 'contenders', 'plans', 'talks'].includes(view) && !handOn()) || (view === 'gtpick' && !gtSel)) view = 'circuit'; }

// after a staffing move: a post it opened (a vacancy) goes straight to its hiring page; otherwise back to the staff page
function afterMove(r, msg) {
  const vi = typeof r === 'object' ? (S.vacancies || []).indexOf(r) : -1;
  if (vi >= 0) { hireIdx = vi; hireFit = false; go('hire'); toast(`${msg} ${vacancyName(r)} is now waiting for you.`); }
  else { go('staff'); toast(msg); }
}
// what came of picking someone on a hiring page (0.9.0): taken at once, accepted for after their run, or turned down
function hireResult(o, id, name) {
  const t = T(id);
  if (!o || !o.res || (o.res === 'now' && !o.r)) { render(); if (t) toast(`No offer was made to ${t.name}: they can't be offered that post now.`, 6000); return; } // (0.59.0) say so
  save();
  if (o.res === 'now') afterMove(o.r, `${dn(t)} takes the post: ${name}.`);
  else if (o.res === 'later') { go('staff'); toast(`${t.name} accepted (${name}) and comes after their run, by ${turnDate(t.hired.by)} at the latest.`); }
  else if (o.res === 'refused') { render(); toast(`${t.name} turned the offer down.`); }
  else if (o.res === 'talks') { if (o.err) { render(); toast(`No talks opened with ${t.name}: ${o.err}`, 6000); } else { talkDraft = {}; go('talks'); toast(`Talks are open for ${t.name} with your offer: see Talks.`); } }
  else if (o.res === 'broke') { render(); toast('The League is in the red: nobody new can be hired until it is back above zero.'); }
  else if (o.res === 'cool') { render(); toast(`${t.name} turned you down lately: ask again ${turnDate(t.refusedAt + REFUSED_WEEKS)}.`); }
  else render();
}
// ---------- actions ----------


// ---------- team plans (0.39.0, design doc 6.18) ----------
// Each senior post's team plan: up to six named Pokémon (their own or the ranch's), the steer filling the rest.
// Set at the quarterly Team Review they take effect at once; otherwise they wait for the next review.
let planDraft = {};
const planVal = ref => !ref ? '' : ref.r != null ? 'r' + ref.r : 'o' + ref.o;
const planRefOf = v => !v ? null : v[0] === 'r' ? { r: +v.slice(1) } : { o: +v.slice(1) };
function planRefName(t, ref, key) {
  const x = planResolve(t, ref, key);
  const sp = x.m ? x.m.sp : x.sp || (x.e && x.e.sp);
  return sp ? `${esc(sp)}${x.e ? condTag(x.e.c) : ''}` : '<span class="muted">(gone)</span>';
}
// what a post's plan can name: its holder's own Pokémon and the ranch's of the post's type, free of other plans
function planOptions(t, key) {
  const out = [], slot = eliteSlot(t), ty = t.role === 'champion' || !t.specialty ? [] : specTypes(t);
  for (const m of t.team) if (m.rid == null && !m.stop && !isSpecial(m) && !(t.mega && t.mega.uid === m.uid)) out.push([planVal({ o: m.uid }), `${m.sp} (their own)`]);
  for (const e of S.ranch.mons) {
    if (e.lock || e.sale || planClaim(e.uid, key)) continue;
    const sp = ranchForm(e, slot.lvl, t.specialty); if (bannedIn(sp, S.lg || 0)) continue;
    if (ty.length && !entryTypes(e, sp).some(x => ty.includes(x))) continue;
    const h = e.at != null && e.at !== t.id && T(e.at);
    out.push([planVal({ r: e.uid }), `${sp} ${'★'.repeat(e.g)}${e.c ? ' ' + condKeys(e.c).join('/') : ''}${h ? ` (fielded by ${h.name})` : ''}`]);
  }
  return out;
}
// ---------- seat rules (0.43.0) ----------
// the rule picker (setup and Your staff): a select of the nine rules and the timing in years for the scheduled ones
let seatDraft = null;
// (0.46.0) the Conqueror's timing: Instant (now) or At New Year, a select with id ev + '-now'
function seatForm(sel, ev, k, every, now) {
  const sched = seatSched(k), ev0 = every || (sched ? SEAT_RULES[k].every : null);
  const conq = k === 'conqueror' ? `<label class="small">hand-over <select id="${ev}-now" aria-label="Conqueror timing"><option value="1"${now ? ' selected' : ''}>Instant</option><option value="0"${now ? '' : ' selected'}>At New Year</option></select></label>` : '';
  return `<div class="confirm-row"><select id="${sel}" aria-label="Seat rule">${RULE_KEYS.map(x => `<option value="${x}"${x === k ? ' selected' : ''}>${esc(SEAT_RULES[x].name)}</option>`).join('')}</select>${sched ? `<label class="small">every <input id="${ev}" type="number" min="${SEAT_EVERY_MIN}" max="${SEAT_EVERY_MAX}" value="${ev0}" style="width:4em"> year${ev0 === 1 ? '' : 's'}</label>` : ''}${conq}</div><p class="muted small">${esc(SEAT_RULES[k].text)}</p>`;
}
const seatNext = r => r.k === 'conqueror' ? (r.now ? 'Instant: whoever beats the Champion takes the seat.' : 'The hand-over waits for New Year.') : r.k === 'term' ? (r.term != null ? `The term ends at New Year after year ${r.term}.` : '') : seatSched(r.k) && r.next != null ? `Next at New Year after year ${r.next}.` : '';
function seatPanel() {
  const r = seatRule(), k = r.k, d = seatDraft || { k, every: r.every, now: !!r.now }, block = seatChangeBlock(), cw = esc(postWord('champion'));
  const pct = v => v == null ? '–' : `${Math.round(v * 100)}%`;
  let extra = '';
  if (r.pick) extra += `<div class="eyebrow">Appoint the next ${cw} by ${turnDate(r.pick.due)}</div><ul class="mini">${termCands().map(t => `<li><span>${tname(t.id)} <span class="small">(${t.id === S.champion ? 'keep the ' + cw : postName(t)})</span> ${ovrPill(t)}</span><button class="btn small primary" data-act="seatpick" data-id="${t.id}">${t.id === S.champion ? 'Keep' : 'Appoint'}</button></li>`).join('')}</ul>`;
  if (k === 'council') { const lob = r.lobby;
    extra += `<p class="small">Standing: ${councilCands().map(t => `${tname(t.id)}${lob && lob.id === t.id ? ` <span class="tag">lobbied ×${lob.n}</span>` : ''}`).join(', ')}. Voters: the ${esc(postWord('e4'))} who aren't standing vote for the strongest candidate, with an edge for the ${cw} and for anyone you lobby for (${money(COUNCIL_LOBBY)} a time, up to ${COUNCIL_LOBBY_MAX} before each vote).</p>
      <div class="confirm-row">${councilCands().map(t => `<button class="btn small" data-act="seatlobby" data-id="${t.id}">Lobby for ${esc(t.name)}</button>`).join('')}</div>`; }
  if (k === 'merit') extra += `<p class="small">Share of runs stopped over the last ${r.every} year${r.every === 1 ? '' : 's'} (the ${cw}'s counts ×${MERIT_CHAMP}): ${meritTable(r.every).map(x => `${tname(x.id)} ${pct(x.share)}`).join(', ')}.</p>`;
  if (k === 'succession') { const ks = S.e4.map((id, i) => i).filter(i => T(S.e4[i]) && !T(S.e4[i]).acting); if (ks.length) extra += `<p class="small">Next in line: ${tname(S.e4[Math.max(...ks)])} (${esc(postWord('e4'))} #${Math.max(...ks) + 1}). Swap ${esc(postWord('e4'))} seats to change the order.</p>`; }
  if (seatLocked()) extra += `<p class="muted small">${tname(S.champion)} is the founding ${cw}: the seat is protected until year ${T(S.champion).founderUntil}.</p>`;
  const changing = d.k !== k;
  return `<section class="panel"><div class="ph"><h3>How the ${cw} is chosen: ${esc(seatRuleName(k))}</h3><span class="muted">${esc(seatNext(r))}</span></div><p>${esc(SEAT_RULES[k].text)}</p>${extra}
    <details${changing ? ' open' : ''}><summary class="small">Change the rule or its timing</summary>${seatForm('seatrulesel', 'seatevery', d.k, d.every, d.now)}
    <p class="muted small">Changing the rule costs ${SEAT_CHANGE_PREST} prestige and it can't change again for ${SEAT_COOLDOWN} years; the timing alone is free. The less control a rule keeps, the more prestige a year it earns, the more challengers it draws and the readier ambitious trainers are to sign. Called challenges and title claims are only for the Protected rule.</p>
    ${changing && block ? `<p class="muted small">${esc(block)}</p>` : `<button class="btn small primary" data-act="seatset">${changing ? `Change to ${esc(seatRuleName(d.k))}` : 'Set timing'}</button>`}</details></section>`;
}
function viewPlans() { return inLeague(ME(), viewPlans0); }
function viewPlans0() {
  if (!ranchOn()) return '<section class="panel"><p class="muted">Only a League that keeps books has a ranch, and so team plans.</p></section>';
  ranchSync();
  const P = plansState(), gaps = planGaps(), open = planOpen();
  const nextAt = S.turn + (QUARTER_WEEKS - S.week % QUARTER_WEEKS) % QUARTER_WEEKS;
  const post = key => {
    const t = planHolder(key), on = planOf(key), next = planNext(key), sugg = (P.sugg || {})[key];
    const label = key === 'champion' ? 'Champion' : key.startsWith('e4:') ? `Elite Four #${+key.slice(3) + 1}` : `Gym ${+key.slice(4) + 1} · ${townName(+key.slice(4))}`;
    if (!t) return `<section class="panel"><div class="ph"><h2>${esc(label)}</h2><span class="muted">No holder who fields from the ranch now (vacant or acting)${on ? '; the plan is kept for the next holder' : ''}</span></div></section>`;
    const now = planNow(key), slot = eliteSlot(t);
    const team = t.team.map(m => `${esc(m.sp)}${condTag(condOf(m))} <span class="muted">${gradeStars(monGrade(m))}</span>${isPlanned(t, m) ? ' <span class="tag small">planned</span>' : isSpecial(m) || (t.mega && t.mega.uid === m.uid) ? ' <span class="tag small">keeps their place</span>' : m.stop ? ' <span class="tag notice small">stopgap</span>' : ''}`).join(', ');
    const d = planDraft[key] || (planDraft[key] = Array.from({ length: PLAN_MAX }, (_, i) => planVal((next || on || [])[i])));
    const opts = planOptions(t, key);
    const sel = i => `<select class="plansel" data-k="${key}" data-i="${i}" aria-label="Place ${i + 1}"><option value="">The steer picks</option>${opts.map(([v, n]) => `<option value="${v}"${d[i] === v ? ' selected' : ''}>${esc(n)}</option>`).join('')}${d[i] && !opts.some(o => o[0] === d[i]) ? `<option value="${d[i]}" selected>${planRefName(t, planRefOf(d[i]), key)} (can't be fielded)</option>` : ''}</select>`;
    const pgaps = gaps.filter(g => g.key === key);
    return `<section class="panel"><div class="ph"><h2>${esc(label)}: ${tname(t.id)}</h2><span class="muted">${esc(t.specialty && t.role !== 'champion' ? typeLabel(t) : 'any type')} · steer ${esc(steerName(steerOf(t)))} · ${slot.size} Pokémon</span></div>
      <p class="small"><b>Now:</b> ${team || '—'}</p>
      ${on ? `<p class="small"><b>Plan in force:</b> ${on.map(r => planRefName(t, r, key)).join(', ')}</p>` : '<p class="small muted">No plan: the steer picks the whole team, one swap a month.</p>'}
      ${next ? `<p class="small"><b>At the next review (${turnDate(nextAt)}):</b> ${next.length ? next.map(r => planRefName(t, r, key)).join(', ') : 'the plan is cleared'}</p>` : ''}
      ${pgaps.length ? `<p class="warn small">Can't be fielded: ${pgaps.map(g => `${esc(g.sp || 'a Pokémon')} (${esc(g.why)})`).join(', ')}. The steer fills those places.</p>` : ''}
      ${sugg && sugg.length ? `<p class="small"><b>Suggested at the review:</b> ${sugg.map(r => planRefName(t, r, key)).join(', ')} <button class="btn small ghost" data-act="plansugg" data-k="${key}">Use it</button></p>` : ''}
      <div class="confirm-row">${d.map((_, i) => sel(i)).join('')}</div>
      <div class="confirm-row"><button class="btn small" data-act="planset" data-k="${key}">${now ? 'Set the plan now' : 'Set for the next review'}</button>${on || next ? ` <button class="btn small ghost" data-act="planclear" data-k="${key}">Clear the plan</button>` : ''}</div></section>`;
  };
  return `<section class="panel callout"><div class="eyebrow">${S.lgName}</div><h2>Team plans</h2>
    <p>Name up to ${PLAN_MAX} Pokémon for any Gym Leader, Elite Four member or your Champion, from their own team or your ranch (of the post's type; one fielded by another post is taken from them). The steer fills any place left empty, as before. A plan belongs to the post, like a steer, so a new holder follows it. Planned Pokémon are locked in: the monthly swap never trades them out. Legendaries and the Mega Evolution holder keep their places.</p>
    <p>Plans take effect at the <b>quarterly team review</b> (every ${QUARTER_WEEKS} weeks: the start of the first, fourth, seventh and tenth months), when the game also suggests a team for every post. ${open ? '<b>The review is open this week: plans you set now take effect at once.</b>' : `The next is ${turnDate(nextAt)}. A plan set before then waits for it, except for a post whose holder is new since the last review.`} Staff always go along with a plan, but one whose own Pokémon it keeps on the bench for ${BENCH_QUARTERS} reviews running grows restless.</p>
    <div class="confirm-row"><label class="small"><input type="checkbox" class="planstop"${P.off ? '' : ' checked'}> Stop the sim for the review</label></div></section>
    ${planKeys().map(post).join('')}`;
}
// the Ranch page's note: plans that name Pokémon that can't be fielded
function planGapNote() {
  const g = plansOn() ? planGaps() : [];
  return g.length ? `<section class="panel"><p class="warn small">Team plans with places that can't be filled (the steer fills them): ${g.map(x => `${esc(x.sp || 'a Pokémon')} for ${esc(planHolder(x.key) ? postName(planHolder(x.key)) : x.key)} (${esc(x.why)})`).join(', ')}. See <button class="tlink" data-act="nav" data-v="plans">Team plans</button>.</p></section>` : '';
}
GLOSS_TERMS.league.push(['Breeding and the Day Care', `The Day Care is a seat building (no slot, ${DC_PAIRS.length - 1} levels) that breeds from your breeding pool, on the Ranch page's Day Care tab. Breed on the Pool tab moves a ranch Pokémon there for good: it leaves the ranch and every team, takes no ranch space, costs half its upkeep and stays ${BREED_YEARS} years, then is sold automatically for ${Math.round(BREED_SELL * 100)}% of its value. The pool holds one of each line and condition; a better one bumps the old one out (sold the same way). A locked Pokémon can't go in; a reserved or planned one asks first. Pairs share an egg group (the games' own; your own Pokémon take one from My Pokédex or the region editor, else from their type), or one parent is Ditto; Undiscovered lines can't breed. Ditto can be in several pairs, everyone else in one. A pair lays an egg every ${DC_WEEKS[1]} weeks at level 1, down to ${DC_WEEKS[DC_WEEKS.length - 1]} at the top level, until you end it. The young one takes the non-Ditto parent's line (else either's), each IV from one parent (the better more often) plus a small bump, so it usually comes out a grade above its parents. Conditions come at twice the wild odds and five times for one a parent has; a Delta parent passes on the Delta gene, so the young one rolls its own unusual type, whichever line it takes. A bred shiny, alpha or Delta has at least the IVs a wild one would. A young one hatched into a full ranch waits ${HATCH_WAIT} weeks, then is let go. In the red the Day Care closes: eggs wait, the pool's upkeep is still paid. The Safari Zone's quarterly finds stay plain: only the Day Care passes anything on. Rival Leagues breed too: wall-builders for their posts' types, star-makers the best grades, money-makers rarities to sell.`]); // (0.45.0)
GLOSS_TERMS.league.push(['Team plans', `The Team plans page: up to ${PLAN_MAX} named Pokémon for a Gym Leader, Elite Four member or your Champion, from their own team or your ranch, with the steer filling the rest. A plan belongs to the post. It takes effect at the quarterly team review (every ${QUARTER_WEEKS} weeks, when the game suggests a team for each post), or at once when set in the review's week, for a post whose holder is new since the review, or for a vacant post. Planned Pokémon are never swapped out by the monthly swap or a Gym Leader's losing-streak shake-up. Staff always follow a plan, but one whose own Pokémon it keeps benched for ${BENCH_QUARTERS} reviews running grows restless (promotion's clock moves on a quarter; a stay-put member may start wanting more). A planned Pokémon sold, locked, listed or banned leaves a gap, flagged on the Ranch page, that the steer fills.`]);

// Move time on by up to n weeks. A step of more than a week stops early when something needs you: a title
// conceded, a post that fell vacant, or the New Year report (which opens the year report).
function playWeeks(n) {
  const y = S.season, fresh0 = talkUnseen(), stop = simWeeks(n, n > 1);
  const res = talkUnseen() > fresh0 ? S.talkDone[0] : null; // (0.56.0) a talks result opens the Talks page even after a single week
  save();
  if (S.season !== y) { repYear = null; go('recap'); toast(`Year ${y} is over. Here is the year report.`); return; }
  if (stop && stop.why === 'review' && playerFin()) { view = 'plans'; planDraft = {}; window.scrollTo(0, 0); } // (0.39.0)
  if ((stop && stop.why === 'talks') || res) { view = 'talks'; talkDraft = {}; window.scrollTo(0, 0); } // (0.53.0)
  render();
  toast(stop ? `Stopped in ${weekName(S.week)}: ${stop.text}` : res ? `${weekName(S.week)}: Talks ${TALK_RES[res.res].toLowerCase()}: ${res.text}` : `It is now ${weekName(S.week)}, Year ${S.season}.`);
}

// open / close the page menu's dropdowns in place (no full re-render)
function syncNav() { document.querySelectorAll('.navgrp').forEach(g => { const b = g.querySelector('.navbtn'), on = !!b && b.dataset.k === navOpen; g.classList.toggle('open', on); if (b) b.setAttribute('aria-expanded', String(on)); }); }
document.addEventListener('click', ev => {
  if (navOpen && !ev.target.closest('.navgrp')) { navOpen = null; syncNav(); }
  const el = ev.target.closest('[data-act]'); if (!el) return;
  if (el.dataset.act === 'fold') { toggleFold(el); return; }
  const a = el.dataset.act;
  if (el.disabled) return;
  if (!S && dexAction(a, el)) { render(); return; }
  if (!S && regionAction(a, el)) { render(); if (['rgnew', 'rgcopyreg', 'rgedit', 'rgsave', 'rgcancel'].includes(a)) window.scrollTo(0, 0); return; }
  // an action on a trainer works in that trainer's League
  if (S && nLeagues() > 1 && el.dataset.id && T(+el.dataset.id)) useLeague(lgOf(T(+el.dataset.id)));
  if (a.startsWith('talk')) { inLeague(ME(), () => talkAction(a, el)); return; } // (0.53.0)
  switch (a) {
    case 'imgup': openImgUp(el.dataset.k, el.dataset.c); break;
    case 'imgopt': if (modal && modal.draft) { modal.draft[el.dataset.k] = !modal.draft[el.dataset.k]; imgRedraft(); } break;
    case 'imgsave': imgSaveDraft(); break;
    case 'imgdel': { const k = modal.key; imgDel(k).then(() => { modal = modal && modal.kind === 'img' ? modal.back || null : modal; renderModal(); render(); toast(`Removed the image for ${imgLabel(k)}.`); }); break; }
    case 'images': imgMsg = ''; imgClearArm = false; modal = { kind: 'images', back: modal }; renderModal(); break;
    case 'imgtab': imgTab = el.dataset.v; imgQ = ''; imgRefresh(); break;
    case 'imgexport': imgExport(); break;
    case 'imgclear': imgClearArm = true; imgRefresh(); break;
    case 'imgclearno': imgClearArm = false; imgRefresh(); break;
    case 'imgclearyes': imgClearAll().then(() => render()); break;
    case 'setleagues': setupLeagues = Math.max(1, Math.min(maxStartLeagues(), +el.dataset.v)); render(); break;
    case 'setgrowth': setupGrowth = el.dataset.v === '1'; render(); break;
    case 'setpace': setupPace = +el.dataset.v; render(); break;
    case 'setfam': setupFam = +el.dataset.v; render(); break;
    case 'setgod': setupGod = el.dataset.v === '1'; render(); break;
    case 'godleague': { const why = godOpenLeague(); save(); render(); toast(why || `The ${leagueName(nLeagues() - 1)} is open.`); break; }
    case 'lgview': viewLg = +el.dataset.v; boardSel = null; render(); break;
    case 'setuppage': setupPage = el.dataset.v; render(); window.scrollTo(0, 0); break;
    case 'lgrename': lgRenameAt = +el.dataset.i; lgRenameText = leagueName(lgRenameAt); lgRenameMsg = ''; render(); break;
    case 'lgrenamecancel': lgRenameAt = null; lgRenameMsg = ''; render(); break;
    case 'lgposts': lgPostsAt = +el.dataset.i; lgPostsDraft = postSetOf(lgPostsAt); lgPostsMsg = ''; lgRenameAt = null; render(); break;
    case 'lgpostscancel': lgPostsAt = null; lgPostsDraft = null; lgPostsMsg = ''; render(); break;
    case 'lgpostsgo': { const i = +el.dataset.i, d = lgPostsDraft || postSetOf(i), err = setPosts(i, d.theme, d.names);
      if (err) lgPostsMsg = err; else { lgPostsAt = null; lgPostsDraft = null; lgPostsMsg = ''; save(); } render(); break; }
    case 'lgrenamego': { const i = +el.dataset.i, inp = $('#lgrenamein'), err = renameLeague(i, inp ? inp.value : lgRenameText);
      if (err) lgRenameMsg = err; else { lgRenameAt = null; lgRenameMsg = ''; save(); } render(); break; }
    case 'advtoggle': setupAdv[el.dataset.k] = !setupAdv[el.dataset.k]; render(); break;
    case 'packlist': setupPackOpen[el.dataset.k] = !setupPackOpen[el.dataset.k]; render(); break;
    case 'feattoggle': setupOff[el.dataset.k] = !setupOff[el.dataset.k]; render(); break;
    case 'featreset': setupOff = {}; render(); break;
    case 'cfexport': cfExport = cfExport === el.dataset.k ? null : el.dataset.k; if (setupPage === 'custom') cfRead(); render(); { const b = $('.cf-export'); if (b) b.scrollIntoView({ block: 'nearest' }); } break;
    case 'cfexpclose': cfExport = null; if (setupPage === 'custom') cfRead(); render(); break;
    case 'cfexpcopy': { const ta = $('#cf-exptext'); if (!ta) break; const done = () => toast('Pack copied. Paste it into Import trainers on another device.');
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(ta.value).then(done, () => { ta.select(); toast('Select all and copy the text.'); }); else { ta.select(); toast('Select all and copy the text.'); } break; }
    case 'cfexpfile': { const k = el.dataset.k, packs = exportPacksFor(k); if (packs.length) downloadText(packFileName(k), packExportText(packs)); break; }
    case 'cfimport': cfImp = cfImpBlank(el.dataset.k || 'text'); if (cfImp.src !== 'text') cfImpLoad(); setupPage = 'import'; cfExport = null; render(); window.scrollTo(0, 0); break;
    case 'cfimpread': { const ta = $('#cfimptext'); if (ta) cfImp.text = ta.value; cfImpLoad(); render(); break; }
    case 'cfimpall': { const on = el.dataset.v === '1'; cfImp.groups.forEach((g, gi) => g.rows.forEach((r, i) => { if (r.entry && cfImpMatch(r, cfImp.q)) { if (on) cfImp.sel.add(gi + ':' + i); else cfImp.sel.delete(gi + ':' + i); } }));
      const nm = $('#cfimpname'); if (nm) cfImp.newName = nm.value; render(); break; }
    case 'cfimpgo': cfImpCommit(); render(); window.scrollTo(0, 0); break;
    case 'cfopen': cfOpen(el.dataset.k); render(); window.scrollTo(0, 0); break;
    case 'cfnewpack': { const inp = $('#cf-newpack'); cfNewPackName = inp ? inp.value : ''; const r = checkPackName(cfNewPackName); cfNewPackErr = r.err || '';
      if (r.name) { const key = newCustomKey(); const ok = setCustomLib(customLib.concat([{ key, name: r.name, trainers: [] }])); setupPacks[key] = true; cfNewPackName = ''; cfOpen(key);
        cfMsg = `Created ${r.name} and switched it on.${ok ? '' : " This browser couldn't store it, so it will be gone when the page closes."}`; window.scrollTo(0, 0); }
      render(); break; }
    case 'cfrename': { cfRead(); const pk = customPack(cfPack); if (!pk) break; const r = checkPackName(($('#cf-packname') || {}).value, pk.key); cfErrs = []; cfMsg = '';
      if (r.err) cfErrs = [r.err]; else { setCustomLib(customLib.map(p => p.key === pk.key ? { ...p, name: r.name } : p)); cfMsg = `Renamed the pack to ${r.name}.`; }
      render(); break; }
    case 'cfdelpack': cfRead(); cfDelArm = true; render(); break;
    case 'cfdelpackno': cfRead(); cfDelArm = false; render(); break;
    case 'cfdelpackyes': { const pk = customPack(cfPack); cfDelArm = false; if (pk) { setCustomLib(customLib.filter(p => p.key !== pk.key)); delete setupPacks[pk.key]; toast(`Deleted ${pk.name}.`); } cfPack = null; setupPage = 'advanced'; render(); window.scrollTo(0, 0); break; }
    case 'cfsave': { cfRead(); const target = cfDraft.pack || cfPack, ed = cfEdit != null ? { key: cfPack, i: cfEdit } : null;
      const r = checkCustom(cfDraft, target, ed); cfErrs = r.errs; cfMsg = '';
      if (r.entry) {
        const list = customLib.map(p => ({ ...p, trainers: p.trainers.slice() })), from = ed && list.find(p => p.key === ed.key), to = list.find(p => p.key === target);
        if (from && from === to) to.trainers[ed.i] = r.entry; else { if (from) from.trainers.splice(ed.i, 1); to.trainers.push(r.entry); }
        const ok = setCustomLib(list);
        cfMsg = `${ed ? 'Saved' : 'Added'} ${r.entry.cls} ${r.entry.name}${target !== cfPack ? ` to ${to.name}` : ''}.${ok ? '' : " This browser couldn't store it, so it will be gone when the page closes."}`;
        cfDraft = cfBlank(); cfEdit = null;
      }
      render(); if (!r.entry) { const e = $('.cf-errs'); if (e) e.scrollIntoView({ block: 'center' }); } break; }
    case 'cfclear': cfDraft = cfBlank(); cfEdit = null; cfErrs = []; cfMsg = ''; render(); break;
    case 'cfedit': { const pk = customPack(cfPack), i = +el.dataset.v; if (!pk || !pk.trainers[i]) break; cfEdit = i; cfDraft = cfFrom(pk.trainers[i], pk.key); cfErrs = []; cfMsg = ''; render(); const f = $('#cf-form'); if (f) f.scrollIntoView({ block: 'start' }); break; }
    case 'cfdel': { cfRead(); const pk = customPack(cfPack), i = +el.dataset.v, f = pk && pk.trainers[i]; if (!f) break;
      setCustomLib(customLib.map(p => p.key === pk.key ? { ...p, trainers: p.trainers.filter((_, j) => j !== i) } : p));
      if (cfEdit === i) { cfEdit = null; cfDraft = cfBlank(); } else if (cfEdit != null && cfEdit > i) cfEdit--; cfErrs = []; cfMsg = `Deleted ${f.cls} ${f.name}.`; render(); break; }
    case 'packtoggle': if (setupPage === 'custom') cfRead(); setupPacks[el.dataset.k] = !setupPacks[el.dataset.k]; render(); break;
    case 'basetoggle': setupBaseOff = !setupBaseOff; render(); break;
    case 'packall': { const on = el.dataset.v === '1'; setupBaseOff = !on; setupPacks = { ...setupPacks, ...Object.fromEntries(Object.keys(FAMOUS_PACKS).filter(k => !FAMOUS_PACKS[k].custom).map(k => [k, on])) }; render(); break; }
    case 'advfold': setupFold[el.dataset.k] = !setupFold[el.dataset.k]; render(); break;
    case 'advfoldall': { const shut = el.dataset.v === '1'; setupFold = Object.fromEntries(['rules', 'features', 'packs', 'mypacks', 'dex', 'images', 'load', ...FEATURES.map(g => 'feat-' + g.group)].map(k => [k, shut])); render(); break; }
    case 'newworld': viewLg = 0; newWorld({ hand: true, regions: setupChoices(), leagues: setupLeagues, rivals: setupRivals.slice(0, setupLeagues - 1), names: setupNames.slice(0, setupLeagues), seatRule: setupSeat, posts: [setupPosts].concat(Array.from({ length: setupLeagues - 1 }, (_, i) => setupRivalThemes[i] ? { theme: setupRivalThemes[i] } : null)), renameAny: setupAdv.renameAny, newRegions: setupAdv.newRegions, pace: setupPace, region: +el.dataset.v, growth: setupGrowth, god: setupGod, famShare: setupFam, baseOff: setupBaseOff, packs: Object.keys(setupPacks).filter(k => setupPacks[k]), off: Object.keys(setupOff).filter(k => setupOff[k]) }); setupPage = 'main'; view = 'circuit'; foundSel = { post: 'champion', slot: 0 }; foundShow = 'all'; save(); render(); window.scrollTo(0, 0); break;
    case 'foundsel': foundSel = { post: el.dataset.k, slot: +el.dataset.v }; render(); { const p = $('#found-pool'); if (p) p.scrollIntoView({ block: 'start' }); } break;
    case 'foundshow': foundShow = el.dataset.v; render(); break;
    case 'foundpick': if (foundSel && foundPlace(foundSel.post, foundSel.slot, +el.dataset.id)) { const nx = foundPosts().find(p => p.id == null); foundSel = nx ? { post: nx.post, slot: nx.slot } : null; save(); } render(); break;
    case 'foundclear': foundPlace(el.dataset.k, +el.dataset.v, null); foundSel = { post: el.dataset.k, slot: +el.dataset.v }; save(); render(); break;
    case 'foundfill': foundingFill(); foundSel = null; save(); render(); break;
    case 'foundgo': { const mid = !!S.founding.mid; finishFounding(); view = 'circuit'; viewLg = ME(); save(); render(); window.scrollTo(0, 0); toast(mid ? `The ${S.lgName} is open.` : `The ${S.lgName} is open. Year 1 is underway.`); break; }
    case 'ranchtab': ranchTab = el.dataset.v; render(); break; // (0.44.0)
    case 'ranchteams': teamShow = el.dataset.v; render(); break;
    case 'ranchfreset': ranchF = { show: 'free', type: '', g: 0, cond: '', from: '', sort: 'value' }; render(); break;
    case 'ranchstock': { const who = inLeague(ME(), () => { const e = ranchEntry(+el.dataset.id); return e && e.at != null && T(e.at) ? T(e.at).name : null; }); const w = inLeague(ME(), () => stockMon(+el.dataset.id)); save(); render(); toast(w || 'Stocked in the Safari Zone.' + (who ? ` ${who} swapped it out.` : '')); break; }
    case 'ranchbreed': { const w = inLeague(ME(), () => breedIn(+el.dataset.id, !!el.dataset.ask)); save(); render(); toast(w || 'In the breeding pool. Pair it on the Day Care tab.'); break; } // (0.45.0)
    case 'dcsort': dcSort = el.dataset.v === 'egg' ? 'egg' : 'line'; render(); break; // (0.51.0)
    case 'dcpair': { const w = inLeague(ME(), () => startPair(dcPick.a, dcPick.b)); save(); render(); toast(w || 'The pair has started.'); break; }
    case 'dcend': { const w = inLeague(ME(), () => endPair(+el.dataset.id)); save(); render(); if (w) toast(w); break; }
    case 'safaritake': { const w = inLeague(ME(), () => unstockMon(+el.dataset.id)); save(); render(); toast(w || 'Back in the ranch.'); break; }
    case 'safarikeep': { const on = el.dataset.v === '1', w = inLeague(ME(), () => keepLine(el.dataset.b, on)); save(); render(); toast(w || (on ? `${el.dataset.b} stays through the next change.` : `${el.dataset.b} is no longer kept.`)); break; }
    case 'ranchob': { const w = inLeague(ME(), () => startTrip('outbreak')); save(); render(); toast(w || 'The trip has set out for the outbreak.'); break; }
    case 'ranchtrip': case 'rancharea': { const w = inLeague(ME(), () => startTrip(a === 'ranchtrip' ? 'target' : 'area', el.dataset.b, el.dataset.c || undefined)); save(); render(); toast(w || 'The trip has set out.'); break; }
    case 'storepick': { const w = inLeague(ME(), () => pickStore(+el.dataset.id, +el.dataset.u)); save(); render(); toast(w || 'Taken into the ranch.'); break; }
    case 'storedone': { inLeague(ME(), () => doneStore(+el.dataset.id)); save(); render(); toast('The rest stays with them.'); break; }
    case 'vaultask': { const r = inLeague(ME(), () => storeLegend(+el.dataset.id, +el.dataset.u)); save(); render(); toast(r.ok ? 'Stored in the Sanctuary.' : r.why); break; }
    case 'vaultgive': { const sel = document.querySelector(`.vaultsel[data-u="${el.dataset.u}"]`); const w = sel ? inLeague(ME(), () => vaultGive(+el.dataset.u, +sel.value)) : 'Pick who fields it.'; save(); render(); toast(w || 'Given from the vault.'); break; }
    case 'ranchcharter': { const w = inLeague(ME(), () => startTrip('charter', +el.dataset.v)); save(); render(); toast(w || 'The charter is on its way.'); break; }
    case 'ranchbuy': { const w = inLeague(ME(), () => buyShop(+el.dataset.id)); save(); render(); toast(w || 'Bought: it is in the ranch.'); break; }
    case 'ranchlbuy': { const w = inLeague(ME(), () => buyListing(+el.dataset.lg, +el.dataset.id)); save(); render(); toast(w || 'Bought: it is in the ranch.'); break; }
    case 'ranchsell': case 'ranchrel': { const who = inLeague(ME(), () => { const e = ranchEntry(+el.dataset.id); return e && e.at != null && T(e.at) ? T(e.at).name : null; }); const w = inLeague(ME(), () => sellMon(+el.dataset.id, a === 'ranchrel')); save(); render(); toast(w || (a === 'ranchrel' ? 'Released.' : 'Sold back.') + (!w && who ? ` ${who} swapped it out.` : '')); break; }
    case 'planset': case 'planclear': case 'plansugg': { const k = el.dataset.k;
      const refs = a === 'planclear' ? [] : a === 'plansugg' ? inLeague(ME(), () => (plansState().sugg || {})[k] || []) : (planDraft[k] || []).map(planRefOf).filter(Boolean);
      const r = inLeague(ME(), () => setPlan(k, refs)); delete planDraft[k];
      if (typeof r === 'string') { render(); toast(r); break; }
      save(); render(); toast(a === 'planclear' ? (r.now ? 'Plan cleared.' : 'The plan is cleared at the next review.') : r.now ? 'Plan set: the team is built to it now.' : 'Plan set: it takes effect at the next review.'); break; }
    case 'ranchlock': { const w = inLeague(ME(), () => { const e = ranchEntry(+el.dataset.id); return e ? lockMon(e.uid, !e.lock) : 'Not in the ranch.'; }); save(); render(); if (w) toast(w); break; }
    case 'ranchlist': case 'ranchunlist': { const w = inLeague(ME(), () => (a === 'ranchlist' ? listMon : unlistMon)(+el.dataset.id)); save(); render(); toast(w || (a === 'ranchlist' ? 'Listed for other Leagues.' : 'Withdrawn.')); break; }
    case 'sendcon': { const r = inLeague(ME(), () => sendContender(+el.dataset.id, sendTo)); save(); render(); toast(r === 'ok' ? `${T(+el.dataset.id).name} is on the way.` : r === 'later' ? `${T(+el.dataset.id).name} signed, and goes after their run.` : r === 'refused' ? `${T(+el.dataset.id).name} turned the contract down.` : r); break; }
    case 'recallcon': { const ok = recallContender(+el.dataset.id); save(); render(); toast(ok ? `${T(+el.dataset.id).name} is coming home.` : 'Could not recall them.'); break; }
    case 'renewcon': { const ok = renewContender(+el.dataset.id); save(); render(); toast(ok ? `Renewed for ${SPON_YEARS} more years.` : 'Could not renew.'); break; }
    case 'leaveask': leaveAsk = !leaveAsk; render(); break;
    case 'leavego': { const w = leaveLeague(leaveRegion, [...leaveTake]); leaveAsk = false; leaveTake = new Set(); save(); render(); window.scrollTo(0, 0); toast(w || 'Place your new League\'s staff.'); break; }
    case 'foundquit': clearSave(); S = null; view = 'circuit'; foundSel = null; render(); break;
    case 'circscope': circScope = el.dataset.v === 'region' ? 'region' : 'lg'; render(); break;
    case 'repyear': repYear = el.dataset.v === 'latest' ? null : +el.dataset.v; go('recap'); break;
    case 'hire': hireIdx = +el.dataset.v; hireFit = false; go('hire'); break;
    case 'hirefit': hireFit = !hireFit; render(); break;
    case 'hirepick': { const v = (S.vacancies || [])[hireIdx], name = v && vacancyName(v), id = +el.dataset.id; if (v) hireLenFor(id, v.post); hireResult(v && hireForVacancy(v, id, hireBid), id, name); break; }
    case 'hirelen': hireLen = el.dataset.v ? +el.dataset.v : null; render(); break;
    case 'conrenew': { const t = T(+el.dataset.id), err = renewContract(+el.dataset.id, +el.dataset.v); if (err) toast(err); else { save(); render(); toast(`${t.name} renewed to ${turnDate(t.con.until)}.`); } break; }
    case 'congo': { const t = T(+el.dataset.id); if (t && conLetRun(t.id, !t.con.go)) { save(); render(); toast(t.con.go ? `${t.name} goes when their contract ends, ${turnDate(t.con.until)}.` : `${t.name} renews as usual.`); } break; }
    case 'hirebid': hireBid = +el.dataset.v; render(); break;
    case 'raise': { const w = giveRaise(+el.dataset.id); save(); render(); toast(w || `${T(+el.dataset.id).name} took the raise.`); break; }
    case 'distbuy': { const w = buyDistress(+el.dataset.v); save(); render(); toast(w || 'Bought at a distress price.'); break; }
    case 'distno': { declineDistress(+el.dataset.v); save(); render(); break; }
    case 'bankborrow': { const amt = Math.round(+((document.getElementById('bankamt') || {}).value || 0)), n = +((document.getElementById('bankterm') || {}).value || 0), w = borrow(amt, n); save(); render(); toast(w || `Borrowed ${money(amt)} from the Bank.`, w ? 6000 : undefined); break; } // (0.71.0)
    case 'cancelbuild': { const wh = el.dataset.w === 'seat' ? 'seat' : +el.dataset.w, w = cancelBuild(wh, el.dataset.k); save(); render(); toast(w || 'Build called off; half came back.', w ? 6000 : undefined); break; } // (0.72.0)
    case 'godinstant': S.cfg.instantBuild = !S.cfg.instantBuild; save(); render(); toast(`Instant builds ${S.cfg.instantBuild ? 'on' : 'off'}.`); break; // (0.72.0)
    case 'bankpayoff': { const w = payOffLoan(); save(); render(); toast(w || 'The Bank loan is paid off.', w ? 6000 : undefined); break; } // (0.71.0)
    case 'cornerbuy': { const gi = +el.dataset.g, x = (cityB(S.cities[S.gyms[gi].city]).find(y => y.k === 'corner') || {}), pz = (x.prize || [])[+el.dataset.i], w = buyPrize(gi, +el.dataset.i); save(); render(); toast(w || `${pz.b} came to the ranch from the Game Corner.`, w ? 6000 : undefined); break; } // (0.70.0)
    case 'buyitem': { const w = buyItem(el.dataset.k); save(); render(); toast(w || `Bought a ${itemName(el.dataset.k)} for the item bag.`); break; } // (0.64.0)
    case 'sellb': { const wh = el.dataset.w === 'seat' ? 'seat' : +el.dataset.w, w = sellBuilding(wh, el.dataset.k); save(); render(); toast(w || `Sold a level of ${UPGRADES[el.dataset.k].name.toLowerCase()}.`); break; }
    case 'build': { const wh = el.dataset.w === 'seat' ? 'seat' : +el.dataset.w, w = build(wh, el.dataset.k); save(); render(); toast(w || `${UPGRADES[el.dataset.k].name} built.`); break; }
    case 'movegym': { const sel = $('#movegymsel'), to = $('#movetownsel'), i = sel ? +sel.value : 0, c = to ? +to.value : 0, w = moveGym(i, c); save(); render(); toast(w || `Gym ${i + 1} moved to ${townName(i)}.`); break; }
    case 'ban': { const w = payBan(el.dataset.sp, +el.dataset.v); save(); render(); toast(w || `${el.dataset.sp} is banned.`); break; }
    case 'hireauto': { const v = (S.vacancies || [])[+el.dataset.v], name = v && vacancyName(v); if (booksOn() && S.fin.money < 0) { toast('The League is in the red: nobody new can be hired until it is back above zero.'); break; } const r = v && autoFillVacancy(v); if (r) { save(); go('staff'); toast(r === 'later' && v.incoming != null ? `${T(v.incoming).name} accepted ${name} and comes after their run.` : `${name} is filled.`); } else render(); break; }
    case 'hirewd': { const t = T(+el.dataset.id); if (t && withdrawOffer(t.id)) { save(); render(); toast(`You withdrew the offer to ${t.name}.`); } break; }
    case 'staffask': staffAsk = el.dataset.id ? +el.dataset.id : null; staffSwap = null; render(); break;
    case 'staffgo': { const t = T(+el.dataset.id), r = t && releaseStaff(t.id); staffAsk = null; if (r) { save(); afterMove(r, `${t.name} was let go.`); } else render(); break; }
    case 'staffswap': staffSwap = el.dataset.id ? +el.dataset.id : null; staffAsk = null; render(); break;
    case 'staffswapto': { const a = staffSwap; staffSwap = null; if (a != null && swapStaff(a, +el.dataset.id)) { save(); toast(`${T(a).name} and ${T(+el.dataset.id).name} swapped posts.`); } render(); break; }
    case 'gtpick': gtSel = { g: +el.dataset.g, k: +el.dataset.k }; gymOutsiders(gtSel.g); save(); go('gtpick'); break;
    case 'gtplace': { const id = +el.dataset.id, name = gtSel && `gym trainer at ${townName(gtSel.g)} Gym`, o = gtSel && hireLenFor(id, 'gymtrainer') && hireForGymTrainer(gtSel.g, gtSel.k, id, hireBid); if (o && o.res === 'now' && o.r) gtSel = null; hireResult(o, id, name); break; }
    case 'watchgym': { const g = S.gyms[+el.dataset.g], r = g && (g.watch || [])[+el.dataset.i]; if (r) { modal = { kind: 'battle', r }; renderModal(); } break; }
    case 'nav': navOpen = null; modal = null; renderModal(); go(el.dataset.v); break;
    case 'navgrp': navOpen = navOpen === el.dataset.k ? null : el.dataset.k; syncNav(); break;
    case 'profile': modal = { kind: 'profile', id: +el.dataset.id, back: recBack() }; renderModal(); break;
    case 'ownTab': openOwnTab(); break;
    case 'embedhide': embedNoteHidden = true; try { sessionStorage.setItem('plb-embed-note', '1'); } catch (e) {} render(); break;
    case 'glossary': navOpen = null; syncNav(); modal = { kind: 'glossary' }; renderModal(); break;
    case 'glosssec': glossSec = el.dataset.v; if (modal && modal.kind === 'glossary') { renderModal(); const sh = document.querySelector('.sheet'); if (sh) sh.scrollTop = 0; } break;
    case 'updates': navOpen = null; modal = null; renderModal(); markUpdatesSeen(); go('updates'); break;
    case 'close': if (modal && modal.kind === 'simmany' && modal.running) break; clearInterval(player); modal = modal && modal.back ? modal.back : null; renderModal(); break;
    case 'simmany': modal = { kind: 'simmany', n: 5 }; renderModal(); break;
    case 'hoflg': hofLg = el.dataset.v; render(); break;
    case 'hofsort': hofSort = el.dataset.v; render(); break;
    case 'recmore': modal = { kind: 'recmore', key: el.dataset.k }; renderModal(); break;
    case 'simmanyn': modal.n = +el.dataset.v; renderModal(); break;
    case 'simmanyauto': S.simAuto = el.dataset.v || undefined; save(); renderModal(); break;
    case 'simmanygo': modal.running = true; modal.log = []; modal.auto = S.simAuto && booksOn0() ? { aim: S.simAuto, ...simAutoSnap() } : null; renderModal(); simTimer = setTimeout(simManyTick, 30); break;
    case 'simmanystop': modal.stopRequested = true; renderModal(); break;
    case 'simmanyclose': modal = null; renderModal(); go('circuit'); break;
    case 'simmanyrecords': modal = null; renderModal(); go('records'); break;
    case 'playweek': playWeeks(1); break;
    case 'playmonth': playWeeks(4); break;
    case 'playyear': playWeeks(YEAR_WEEKS - S.week); break;
    case 'godlgsel': godLg = +el.dataset.i; godPick = null; render(); break;
    case 'godpick': godPick = godPick === +el.dataset.id ? null : +el.dataset.id; render(); break;
    case 'godsave': { const id = +el.dataset.id, val = k => { const x = $('#ge-' + k); return x ? x.value : null; }; const errs = [];
      for (const f of ['name', 'age', ...RK, 'pot']) { const v = val(f); if (v != null) { const w = godEdit(id, f, v); if (w) errs.push(w); } }
      save(); render(); toast(errs[0] || 'Saved.'); break; }
    case 'godrolesel': godRole = el.dataset.k; godPick = null; render(); break;
    case 'watchworld': { const m = S.worlds && S.worlds.matches[+el.dataset.i]; if (m) { modal = { kind: 'battle', r: m.log }; renderModal(); } break; }
    case 'boardrow': { const v = el.dataset.v; boardSel = /^\d+$/.test(v) ? +v : v; render(); break; }
    case 'watchhof': { const e = (S.hof || []).find(x => x.uid === +el.dataset.u), w = e && hofLog(e); const r = w && inLeague(w[0], () => (w[1] === 'last' ? S.lastLeague : S.league).logs[w[2]]); if (r) { modal = { kind: 'battle', r }; renderModal(); } break; }
    case 'watchseat': { const r = (S.seatLogs || [])[+el.dataset.i]; if (r) { modal = { kind: 'battle', r }; renderModal(); } break; }
    case 'steerall': { const st = el.dataset.v; let n = 0; inLeague(ME(), () => { for (const p of steerPosts()) if (answersOnType(p.t, st)) { setSteer(p.key, st); n++; } }); save(); render(); toast(`${steerName(st)} set on ${n} post${n === 1 ? '' : 's'}`); break; }
    case 'callopen': callOpen = !callOpen; render(); break;
    case 'seatset': { const d = seatDraft || inLeague(ME(), () => ({ k: seatRuleKey(), every: seatRule().every, now: !!seatRule().now })); const w = setSeatRule(d.k, d.every, d.now); if (!w) seatDraft = null; save(); render(); toast(w || 'Seat rule set.'); break; }
    case 'seatlobby': { const w = lobbySeat(+el.dataset.id); save(); render(); toast(w || 'You lobbied the Council.'); break; }
    case 'seatpick': { const w = termPick(+el.dataset.id); save(); render(); toast(w || 'Appointed.'); break; }
    case 'callchal': { const err = callChallenge(+el.dataset.id); if (!err) callOpen = false; save(); render(); toast(err || 'Challenge called.'); break; }
    case 'chalyes': case 'chalno': { const msg = answerChallenge(+el.dataset.v, a === 'chalyes'); if (msg) { save(); render(); toast(msg); } break; }
    case 'watch': { const L = el.dataset.y === 'last' ? S.lastLeague : S.league, r = L && L.logs[+el.dataset.i]; if (r) { modal = { kind: 'battle', r }; renderModal(); } break; }
    case 'bskip': clearInterval(player); modal.skip && modal.skip(); break;
    case 'bspeed': setBattleSpeed(el.dataset.v); break;
    case 'bpause': toggleBattlePause(); break;
    case 'nf': newsFilter = el.dataset.v; render(); break;
    case 'mon': modal = { kind: 'mon', t: +el.dataset.t, u: +el.dataset.u, back: recBack() }; renderModal(); break;
    case 'alum': modal = { kind: 'mon', t: +el.dataset.t, alum: +el.dataset.i, back: recBack() }; renderModal(); break;
    case 'dexsort': { const k = el.dataset.k; dexSort = dexSort.k === k ? { k, dir: -dexSort.dir } : { k, dir: k === 'sp' ? 1 : -1 }; render(); break; }
    case 'dexkind': dexKind = el.dataset.v; render(); break;
    case 'dextrait': dexTrait = el.dataset.v; render(); break;
    case 'dexscope': dexScope = el.dataset.v; render(); break;
    case 'postsmode': postsMode = el.dataset.v === 'post' ? 'post' : 'year'; render(); break;
    case 'trsort': { const k = el.dataset.k; trSort = trSort.k === k ? { k, dir: -trSort.dir } : { k, dir: ['name', 'pos'].includes(k) ? 1 : -1 }; trPage = 0; render(); break; }
    case 'trscope': trScope = el.dataset.v; trPage = 0; render(); break;
    case 'trgroup': trGroup = el.dataset.v; trFam = 'all'; trPage = 0; render(); break;
    case 'trfam': trFam = el.dataset.v; trPage = 0; render(); break;
    case 'trpage': { trPage = +el.dataset.v || 0; const r = $('#trres'); if (r) { r.innerHTML = trainersResults(); r.scrollIntoView({ block: 'start' }); } else render(); break; }
    case 'dexmin': dexMin = +el.dataset.v; render(); break;
    case 'menu': modal = { kind: 'menu' }; renderModal(); break;
    case 'export': {
      const m0 = modal; m0.exportText = null; m0.copied = false; m0.copying = true; renderModal();
      saveCode().then(txt => {
        const showBox = () => { if (modal !== m0) return; m0.copying = false; m0.exportText = txt.replace(/</g, '\\u003c'); renderModal(); const b = $('#exportbox'); if (b) b.select(); };
        try { navigator.clipboard.writeText(txt).then(() => { if (modal !== m0) return; m0.copying = false; m0.copied = true; renderModal(); }, showBox); } catch (e) { showBox(); }
      });
      break; }
    case 'importshow': modal.importing = true; renderModal(); break;
    case 'importgo': { const m0 = modal; parseSave($('#importbox').value).then(v => { if (modal !== m0) return; if (!v) { m0.err = SAVE_ERR; renderModal(); return; } adoptSave(v); save(); modal = null; renderModal(); go(view); toast('Save loaded.'); }); break; }
    case 'savefile': saveFile(); break;
    case 'setuploadgo': { parseSave(($('#setupload') || {}).value).then(v => { if (!v) { setupLoadErr = SAVE_ERR; render(); return; } setupLoadErr = ''; setupPage = 'main'; adoptSave(v); save(); go(view); toast(`Loaded Year ${S.season || 1}.`); }); break; }
    case 'newask': modal.confirmNew = true; renderModal(); break;
    case 'newcancel': modal.confirmNew = false; renderModal(); break;
    case 'newgo': clearSave(); S = null; modal = null; renderModal(); render(); break;
  }
});
document.addEventListener('input', e => {
  const id = e.target && e.target.id;
  if (id === 'trsearch') { trQ = e.target.value; trPage = 0; const r = $('#trres'); if (r) r.innerHTML = trainersResults(); }
  if (id === 'glosssearch') { glossQ = e.target.value; const r = $('#glossres'); if (r) { r.innerHTML = glossResults(); applyFolds(r, 'modal-glossary'); } }
  if (id === 'dexsearch') { dexQ = e.target.value; const r = $('#dexres'); if (r) r.innerHTML = dexResults(); }
  if (id === 'setupload') setupLoadText = e.target.value;
  if (id === 'setlgname') setupNames[0] = e.target.value;
  if (id === 'lgrenamein') lgRenameText = e.target.value;
  if (e.target && e.target.classList && e.target.classList.contains('setpost')) setupPosts.names[e.target.dataset.k] = e.target.value;
  if (e.target && e.target.classList && e.target.classList.contains('lgpostin') && lgPostsDraft) lgPostsDraft.names[e.target.dataset.k] = e.target.value;
  if (e.target && e.target.classList && e.target.classList.contains('rivalname')) setupNames[+e.target.dataset.i] = e.target.value;
  if (id === 'dx-pick') dxPickText = e.target.value;
  if (id === 'dx-imp') dxImpText = e.target.value;
  if (id === 'rg-imp') rgImpText = e.target.value;
  if (id === 'rg-add') rgAddText = e.target.value;
  if (id === 'rg-leg') rgLegText = e.target.value;
  if (rgDraft && e.target && e.target.classList && e.target.classList.contains('rg-f')) rgSet(e.target.dataset.f, e.target.value);
  if (id === 'dx-from' || id === 'dx-legend') dxSyncChecks();
  if (e.target && e.target.classList && e.target.classList.contains('dx-stat')) { const b = $('#dx-bst'); if (b) b.textContent = '· total ' + dxBst([0, 1, 2, 3, 4, 5].map(i => Number((($('#dx-st' + i) || {}).value) || 0))); dxSyncWarn(); }
  if (id === 'cfimpq' && cfImp) { cfImp.q = e.target.value; const r = $('#cfimplist'); if (r) r.innerHTML = cfImpList(); }
  if (id === 'cfimptext' && cfImp) cfImp.text = e.target.value;
  if (id === 'cfimpname' && cfImp) cfImp.newName = e.target.value;
  if (id === 'imgq') { imgQ = e.target.value; const r = $('#imggrid'); if (r) r.innerHTML = imgGrid(); }
  if (id === 'hofsearch') { hofQ = e.target.value; const r = $('#hofres'); if (r) r.innerHTML = hofResults(); }
});
// a chosen save file is read into the paste box, so it can be checked and loaded the same way
document.addEventListener('change', e => {
  if (e.target && e.target.classList && e.target.classList.contains('talkf')) { const k = talkList().find(x => x.id === +e.target.dataset.k), t = k && T(k.tid); if (!k || !t) return; const d = inLeague(ME(), () => talkDraftOf(k, t)), f = e.target.dataset.f;
    if (f === 'prom') { const x = e.target.dataset.v; d.prom = e.target.checked ? [...new Set(d.prom.concat([x]))] : d.prom.filter(y => y !== x); }
    else if (f === 'post') { d.post = e.target.value; d.len = inLeague(ME(), () => conPref(t, d.post.split(':')[0], k.home !== ME())); if (!d.post.startsWith('e4')) d.prom = d.prom.filter(y => y !== 'legend'); }
    else d[f] = +e.target.value;
    render(); return; } // (0.53.0)
  if (e.target && e.target.classList && e.target.classList.contains('sendtosel')) { sendTo = +e.target.value; return; }
  if (e.target && e.target.classList && e.target.classList.contains('ranchf')) { const f = e.target.dataset.f; ranchF[f] = f === 'g' ? +e.target.value : e.target.value; render(); return; } // (0.44.0)
  if (e.target && e.target.classList && e.target.classList.contains('ranchtypesel')) { ranchType = e.target.value; ranchSp = null; render(); return; }
  if (e.target && e.target.classList && e.target.classList.contains('ranchspsel')) { ranchSp = e.target.value; render(); return; }
  if (e.target && e.target.classList && e.target.classList.contains('ranchcondsel')) { ranchCond = e.target.value; render(); return; }
  if (e.target && e.target.classList && e.target.classList.contains('charterreg')) { charterReg = +e.target.value; render(); return; }
  if (e.target && e.target.classList && e.target.classList.contains('lanesel')) { const w = setLane(+e.target.dataset.g, +e.target.value); save(); render(); toast(w || 'The route has changed.'); return; }
  if (e.target && e.target.classList && e.target.classList.contains('plansel')) { const k = e.target.dataset.k; (planDraft[k] = planDraft[k] || Array(PLAN_MAX).fill(''))[+e.target.dataset.i] = e.target.value; return; }
  if (e.target && e.target.classList && e.target.classList.contains('planstop')) { inLeague(ME(), () => { plansState().off = !e.target.checked; }); save(); return; }
  if (e.target && e.target.classList && e.target.classList.contains('dcsel')) { dcPick[e.target.dataset.k] = e.target.value === '' ? null : +e.target.value; render(); return; } // (0.45.0)
  if (e.target && e.target.classList && e.target.classList.contains('ranchressel')) { const w = inLeague(ME(), () => reserveMon(+e.target.dataset.id, e.target.value || null)); save(); render(); if (w) toast(w); return; }
  if (e.target && e.target.classList && e.target.classList.contains('foundregsel')) { const w = foldRegion(+e.target.value); if (w) toast(w); save(); render(); return; }
  if (e.target && e.target.classList && e.target.classList.contains('rg-port')) { rgPorts[+e.target.dataset.i] = e.target.value; return; }
  if (e.target && e.target.classList && e.target.classList.contains('rguse')) { if (e.target.value) setupCustom[e.target.dataset.k] = e.target.value; else delete setupCustom[e.target.dataset.k]; render(); return; }
  if (e.target && e.target.id === 'rgfile' && e.target.files && e.target.files[0]) { const f = e.target.files[0], rd = new FileReader();
    rd.onload = () => { rgImpText = String(rd.result || ''); rgImpMsg = `Read ${f.name}. Press Import this region.`; render(); }; rd.onerror = () => { rgImpMsg = "Couldn't read that file."; render(); }; rd.readAsText(f); return; }
  // (0.42.0) a theme picked fills the four fields (typed names are cleared)
  if (e.target && e.target.id === 'setposttheme') { setupPosts = { theme: e.target.value, names: {} }; render(); return; }
  // (0.43.0) the seat rule pickers
  if (e.target && e.target.id === 'setseatrule') { setupSeat = { k: e.target.value, every: null, now: false }; render(); return; }
  if (e.target && e.target.id === 'setseatevery-now') { setupSeat.now = e.target.value === '1'; render(); return; }
  if (e.target && e.target.id === 'seatevery-now') { seatDraft = Object.assign(seatDraft || inLeague(ME(), () => ({ k: seatRuleKey(), every: seatRule().every, now: !!seatRule().now })), { now: e.target.value === '1' }); render(); return; }
  if (e.target && e.target.id === 'setseatevery') { setupSeat.every = +e.target.value; render(); return; }
  if (e.target && e.target.id === 'seatrulesel') { seatDraft = { k: e.target.value, every: null, now: false }; render(); return; }
  if (e.target && e.target.id === 'seatevery') { seatDraft = Object.assign(seatDraft || inLeague(ME(), () => ({ k: seatRuleKey(), every: seatRule().every, now: !!seatRule().now })), { every: +e.target.value }); render(); return; }
  if (e.target && e.target.id === 'lgposttheme' && lgPostsDraft) { lgPostsDraft = { theme: e.target.value, names: {} }; render(); return; }
  if (e.target && e.target.classList && e.target.classList.contains('rivaltheme')) { setupRivalThemes[+e.target.dataset.i] = e.target.value; render(); return; }
  if (e.target && e.target.classList && e.target.classList.contains('rivalsel')) { setupRivals[+e.target.dataset.i] = e.target.value === '' ? null : +e.target.value; render(); return; }
  if (e.target && e.target.classList && e.target.classList.contains('leaveregsel')) { leaveRegion = +e.target.value; render(); return; }
  if (e.target && e.target.classList && e.target.classList.contains('leavetake')) { const id = +e.target.dataset.id; if (e.target.checked) leaveTake.add(id); else leaveTake.delete(id); render(); return; }
  if (e.target && e.target.classList && e.target.classList.contains('wxsel')) { const w = e.target.dataset.w, err = setField(w === 'seat' ? 'seat' : +w, e.target.value || null); save(); render(); toast(err || 'The field is set.', err ? 6000 : undefined); return; } // (0.69.0)
  if (e.target && e.target.classList && e.target.classList.contains('airsel')) { const w = setAirRoute(+e.target.dataset.i, +e.target.value); save(); render(); toast(w || 'The Airport\'s route has changed.'); return; } // (0.65.0)
  if (e.target && e.target.classList && e.target.classList.contains('keepgsel')) { const w = inLeague(ME(), () => setKeepGrade(e.target.dataset.k, +e.target.value)); save(); render(); toast(w || 'Keep grade set.'); return; } // (0.65.0); (0.66.0) per building
  if (e.target && e.target.classList && e.target.classList.contains('rrf')) { const f = e.target.dataset.f, v = e.target.type === 'checkbox' ? e.target.checked : +e.target.value; const w = inLeague(ME(), () => setRanchRules({ [f]: v })); save(); render(); toast(w || 'Ranch rules set.'); return; } // (0.66.0)
  if (e.target && e.target.classList && e.target.classList.contains('berryfeed')) { const err = inLeague(ME(), () => setBerryFeed(+e.target.dataset.g, +e.target.value)); save(); render(); toast(err || 'Berry Farm plots set.'); return; } // (0.63.0)
  if (e.target && e.target.classList && e.target.classList.contains('steersel')) { const k = e.target.dataset.k, v = e.target.value || null; inLeague(ME(), () => setSteer(k, v)); save(); render(); toast(k === 'line' ? `League line: ${steerName(v)}` : `Steer set: ${v ? steerName(v) : 'follows the League line'}`); return; }
  if (e.target && e.target.id === 'imgfile' && e.target.files && e.target.files[0]) { imgPickFile(e.target.files[0]); return; }
  if (e.target && e.target.id === 'imgpackfile' && e.target.files && e.target.files.length) { imgImport(e.target.files).then(() => render()); return; }
  if (e.target && e.target.id === 'dx-legend') { dxSyncChecks(); return; }
  if (e.target && e.target.id === 'cf-trait') { cfRead(); render(); return; }
  if (e.target && e.target.classList && e.target.classList.contains('cf-imp-chk') && cfImp) { const k = e.target.dataset.k; if (e.target.checked) cfImp.sel.add(k); else cfImp.sel.delete(k); const b = $('#cfimpgo'); if (b) b.textContent = cfImpGoLabel(); return; }
  if (e.target && e.target.id === 'cfimpsrc' && cfImp) { const src = e.target.value; cfImp = cfImpBlank(src); if (src !== 'text') cfImpLoad(); render(); return; }
  if (e.target && e.target.id === 'cfimpdest' && cfImp) { const nm = $('#cfimpname'); if (nm) cfImp.newName = nm.value; cfImp.dest = e.target.value; render(); return; }
  if (e.target && e.target.id === 'cfimpfile' && e.target.files && e.target.files[0] && cfImp) { const f = e.target.files[0], rd = new FileReader();
    rd.onload = () => { cfImp.text = String(rd.result || ''); cfImp.fileName = f.name; cfImpLoad(); render(); }; rd.onerror = () => { cfImp.err = "Couldn't read that file."; render(); }; rd.readAsText(f); return; }
  if (!e.target || e.target.id !== 'setupfile' || !e.target.files || !e.target.files[0]) return;
  const f = e.target.files[0], rd = new FileReader();
  rd.onload = async () => { setupLoadText = String(rd.result || ''); setupLoadName = f.name; setupLoadErr = (await parseSave(setupLoadText)) ? '' : SAVE_ERR; render(); };
  rd.onerror = () => { setupLoadErr = "Couldn't read that file."; render(); };
  rd.readAsText(f);
});
document.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target && e.target.dataset && e.target.dataset.act === 'fold') { e.preventDefault(); toggleFold(e.target); return; } if (e.key === 'Escape' && navOpen) { navOpen = null; syncNav(); return; } if (e.key === 'Escape' && modal && !(modal.kind === 'simmany' && modal.running)) { clearInterval(player); modal = modal.back || null; renderModal(); } });

// take over a save and open the right screen for its phase
function adoptSave(v, keepView) {
  S = v; applyDex(S.cfg && S.cfg.dex); applyCfg();
  view = keepView || 'circuit';
}
// Download save file: inside claude.ai the viewer's downloads capability offers the file (with a confirmation);
// opened as a plain local file, an ordinary browser download does it
let downloadsNs = null, downloadsChecked = !window.claude;
if (window.claude && window.claude.use) window.claude.use('downloads').then(ns => { downloadsNs = ns; downloadsChecked = true; if (modal && modal.kind === 'menu') renderModal(); }, () => { downloadsChecked = true; });
const canSaveFile = () => !window.claude || !!downloadsNs;
async function saveFile() {
  const data = await saveCode(), filename = `pokemon-league-builder-year-${S.season || 1}.${data.startsWith(CODE_TAG) ? 'txt' : 'json'}`;
  if (downloadsNs) {
    try { await downloadsNs.save({ filename, data }); toast('Save file downloaded.'); }
    catch (e) { const c = e && e.code; if (c === 'declined') return; toast(c === 'rate_limited' ? 'A download is already waiting for your answer.' : "Couldn't download here. Use Copy save to clipboard instead."); }
    return;
  }
  try { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([data], { type: data.startsWith(CODE_TAG) ? 'text/plain' : 'application/json' })); a.download = filename; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); toast('Save file downloaded.'); }
  catch (e) { toast("Couldn't download here. Use Copy save to clipboard instead."); }
}
// a save from the menu's export: pasted text or the contents of a downloaded file
async function parseSave(txt) {
  try {
    let t = String(txt || '').replace(/\s+/g, '');
    if (t.startsWith(CODE_TAG)) {
      if (!CAN_DEFLATE) return null;
      const ds = new Blob([b64ToBytes(t.slice(CODE_TAG.length))]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
      t = await new Response(ds).text();
    } else t = String(txt || '').trim();
    const v = JSON.parse(t); return v && v.trainers && v.version === SAVE_VERSION ? v : null;
  } catch (e) { return null; }
}
const SAVE_ERR = "That isn't a save from this version of Pokémon League Builder. Use the whole save text, or a file from the menu's Download save file.";
function boot(data) {
  imgBootDone = false; imgLoadAll();
  const done = () => { imgBootDone = true; render(); receiveFromEmbed(); };
  if (data && data.S && data.S.version === SAVE_VERSION) { adoptSave(data.S, data.view); return done(); }
  // (0.30.0) the save is read from IndexedDB, which takes a moment
  $('#app').innerHTML = '<p class="muted" style="padding:24px">Loading your world…</p>';
  loadSaved().then(v => { if (v) adoptSave(v, data && data.view); else S = null; done(); }, () => { S = null; done(); });
}
window.claude?.hot?.snapshot?.(() => ({ S, view }));
window.claude?.hot?.ready ? window.claude.hot.ready(boot) : boot(window.claude?.hot?.data ?? {});
