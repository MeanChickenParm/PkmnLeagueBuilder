const verName = u => u.ver || u.id;
const UPDATES = [
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
  <div class="confirm-row"><button class="btn" data-act="simmany">Sim multiple seasons…</button><button class="btn" data-act="glossary">Glossary</button><button class="btn" data-act="images">Images</button><button class="btn" data-act="updates">Updates${updatesNew() ? ' <span class="newdot" aria-label="new"></span>' : ''}</button></div>
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
    if (S && (S.season || 0) > (v.season || 0)) { toast('This tab already has a later season of your world, so it was kept.'); return; }
    adoptSave(v); save(); render(); toast(`Your world came over from the other page: Season ${S.season || 1}. Progress now saves in this tab.`);
  };
  window.addEventListener('message', onMsg);
  try { window.opener.postMessage({ type: 'plb-ready' }, location.origin); } catch (e) {}
}
function render() {
  applyDex(dexWanted());
  ensureCustom();
  const app = $('#app');
  if (S) fixView();
  if (!S) { app.innerHTML = `<header class="top"><div class="top-in"><div class="mark"><span class="mark-ball" aria-hidden="true"></span><div><div class="mark-name">${GAME_NAME} <span class="mark-ver">v${verName(UPDATES[0])}</span></div><div class="mark-sub">New world</div></div></div><div class="top-act"><button class="btn ghost" data-act="glossary">Glossary</button><button class="btn ghost" data-act="updates">Updates${updatesNew() ? '<span class="newdot"></span>' : ''}</button></div></div></header>` + embedNote() + (view === 'updates' ? `<main class="wrap" id="main">${viewUpdates()}</main>` : viewSetup()); if (view === 'updates') applyFolds(app, 'updates'); return; }
  bindView();
  let v = '';
  if (view === 'circuit') v = viewCircuit();
  if (view === 'gyms') v = viewGyms();
  if (view === 'news') v = viewNews();
  if (view === 'history') v = viewHistory();
  if (view === 'records') v = viewRecords();
  if (view === 'hof') v = viewHof();
  if (view === 'dex') v = viewDex();
  if (view === 'trainers') v = viewTrainers();
  if (view === 'recap') v = viewRecap();
  if (view === 'god') v = viewGod();
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
const VIEWS = ['circuit', 'gyms', 'news', 'history', 'records', 'hof', 'dex', 'trainers', 'recap', 'god', 'updates'];
const LG_VIEWS = ['circuit', 'gyms', 'news', 'history', 'recap', 'records'];
function bindView() {
  if (!S || nLeagues() < 2) return;
  viewLg = Math.min(viewLg, nLeagues() - 1);
  useLeague(viewLg);
}
function lgBar() {
  if (nLeagues() < 2 || !LG_VIEWS.includes(view)) return '';
  return `<nav class="lgbar segs" aria-label="League">${Array.from({ length: nLeagues() }, (_, i) => `<button class="seg${i === viewLg ? ' on' : ''}" data-act="lgview" data-v="${i}" aria-pressed="${i === viewLg}">${leagueName(i)}</button>`).join('')}</nav>`;
}
function toast(msg) { const el = $('#toast'); if (!el) return; el.textContent = msg; el.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => { el.hidden = true; }, 3400); }
function go(v) { view = v; render(); window.scrollTo(0, 0); }
// a view that no longer fits (a recap outside the offseason, god mode in a world without it) falls back to the circuit
function fixView() { if (!VIEWS.includes(view) || (view === 'recap' && S.phase !== 'offseason') || (view === 'god' && !godOn())) view = 'circuit'; }

// ---------- actions ----------


function playWeek() {
  if (S.phase !== 'season') return;
  simWeek();
  save();
  render();
  toast(S.phase === 'league' ? 'The regular season is over. Time for the Pokémon League.' : `Week ${S.week} complete.`);
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
  // an action on a trainer works in that trainer's League
  if (S && nLeagues() > 1 && el.dataset.id && T(+el.dataset.id)) useLeague(lgOf(T(+el.dataset.id)));
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
    case 'setgrowth': setupGrowth = el.dataset.v === '1'; render(); break;
    case 'setgod': setupGod = el.dataset.v === '1'; render(); break;
    case 'godleague': { const why = godOpenLeague(); save(); render(); toast(why || `The ${leagueName(nLeagues() - 1)} is open.`); break; }
    case 'lgview': viewLg = +el.dataset.v; render(); break;
    case 'setuppage': setupPage = el.dataset.v; render(); window.scrollTo(0, 0); break;
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
    case 'newworld': viewLg = 0; newWorld({ region: +el.dataset.v, growth: setupGrowth, god: setupGod, allFamous: setupAdv.allFamous, baseOff: setupBaseOff, packs: Object.keys(setupPacks).filter(k => setupPacks[k]), off: Object.keys(setupOff).filter(k => setupOff[k]) }); setupPage = 'main'; view = 'circuit'; save(); render(); window.scrollTo(0, 0); toast(`The ${S.lgName} is open. Season 1 is underway.`); break;
    case 'nextseason': if (S.phase !== 'offseason') break; nextSeason(); save(); go('circuit'); toast(`Season ${S.season} is underway.`); break;
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
    case 'simmanygo': modal.running = true; modal.log = []; renderModal(); simTimer = setTimeout(simManyTick, 30); break;
    case 'simmanystop': modal.stopRequested = true; renderModal(); break;
    case 'simmanyclose': modal = null; renderModal(); go('circuit'); break;
    case 'simmanyrecords': modal = null; renderModal(); go('records'); break;
    case 'playweek': playWeek(); break;
    case 'autoseasonask': modal = { kind: 'confirmsim' }; renderModal(); setTimeout(() => { const b = document.querySelector('[data-act="autoseason"]'); if (b && b.focus) b.focus(); }, 0); break;
    case 'autoseason': modal = null; renderModal(); while (S.phase === 'season') simWeek(); save(); go('circuit'); toast('Played to the end of the regular season.'); break;
    case 'runleague': runLeague(); save(); go('recap'); break;
    case 'godlgsel': godLg = +el.dataset.i; godPick = null; render(); break;
    case 'godpick': godPick = godPick === +el.dataset.id ? null : +el.dataset.id; render(); break;
    case 'godsave': { const id = +el.dataset.id, val = k => { const x = $('#ge-' + k); return x ? x.value : null; }; const errs = [];
      for (const f of ['name', 'age', ...RK, 'pot']) { const v = val(f); if (v != null) { const w = godEdit(id, f, v); if (w) errs.push(w); } }
      save(); render(); toast(errs[0] || 'Saved.'); break; }
    case 'godrolesel': godRole = el.dataset.k; godPick = null; render(); break;
    case 'watchworld': { const m = S.worlds && S.worlds.matches[+el.dataset.i]; if (m) { modal = { kind: 'battle', r: m.log }; renderModal(); } break; }
    case 'watch': { const r = S.league.logs[+el.dataset.i]; if (r) { modal = { kind: 'battle', r }; renderModal(); } break; }
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
    case 'trsort': { const k = el.dataset.k; trSort = trSort.k === k ? { k, dir: -trSort.dir } : { k, dir: ['name', 'pos'].includes(k) ? 1 : -1 }; render(); break; }
    case 'trscope': trScope = el.dataset.v; render(); break;
    case 'trgroup': trGroup = el.dataset.v; trFam = 'all'; render(); break;
    case 'trfam': trFam = el.dataset.v; render(); break;
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
    case 'setuploadgo': { parseSave(($('#setupload') || {}).value).then(v => { if (!v) { setupLoadErr = SAVE_ERR; render(); return; } setupLoadErr = ''; setupPage = 'main'; adoptSave(v); save(); go(view); toast(`Loaded Season ${S.season || 1}.`); }); break; }
    case 'newask': modal.confirmNew = true; renderModal(); break;
    case 'newcancel': modal.confirmNew = false; renderModal(); break;
    case 'newgo': try { localStorage.removeItem(SAVE_KEY); } catch (e) {} S = null; modal = null; renderModal(); render(); break;
  }
});
document.addEventListener('input', e => {
  const id = e.target && e.target.id;
  if (id === 'trsearch') { trQ = e.target.value; const r = $('#trres'); if (r) r.innerHTML = trainersResults(); }
  if (id === 'glosssearch') { glossQ = e.target.value; const r = $('#glossres'); if (r) { r.innerHTML = glossResults(); applyFolds(r, 'modal-glossary'); } }
  if (id === 'dexsearch') { dexQ = e.target.value; const r = $('#dexres'); if (r) r.innerHTML = dexResults(); }
  if (id === 'setupload') setupLoadText = e.target.value;
  if (id === 'dx-pick') dxPickText = e.target.value;
  if (id === 'dx-imp') dxImpText = e.target.value;
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
  view = keepView || (S.phase === 'offseason' ? 'recap' : 'circuit');
}
// Download save file: inside claude.ai the viewer's downloads capability offers the file (with a confirmation);
// opened as a plain local file, an ordinary browser download does it
let downloadsNs = null, downloadsChecked = !window.claude;
if (window.claude && window.claude.use) window.claude.use('downloads').then(ns => { downloadsNs = ns; downloadsChecked = true; if (modal && modal.kind === 'menu') renderModal(); }, () => { downloadsChecked = true; });
const canSaveFile = () => !window.claude || !!downloadsNs;
async function saveFile() {
  const data = await saveCode(), filename = `pokemon-league-builder-season-${S.season || 1}.${data.startsWith(CODE_TAG) ? 'txt' : 'json'}`;
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
  const saved = (data && data.S && data.S.version === SAVE_VERSION && data.S) || load();
  if (saved && saved.packed) {
    $('#app').innerHTML = '<p class="muted" style="padding:24px">Loading your world…</p>';
    if (!CAN_DEFLATE) { S = null; imgBootDone = true; render(); return; }
    inflateText(saved.packed).then(txt => { const v = JSON.parse(txt); if (v && v.version === SAVE_VERSION) adoptSave(v, data && data.view); else S = null; imgBootDone = true; render(); receiveFromEmbed(); }, () => { S = null; imgBootDone = true; render(); receiveFromEmbed(); });
    return;
  }
  if (saved) adoptSave(saved, data && data.view);
  else S = null;
  imgBootDone = true;
  render();
  receiveFromEmbed();
}
window.claude?.hot?.snapshot?.(() => ({ S, view }));
window.claude?.hot?.ready ? window.claude.hot.ready(boot) : boot(window.claude?.hot?.data ?? {});
