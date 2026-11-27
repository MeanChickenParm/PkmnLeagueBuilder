// ================= POKÉMON LEAGUE BUILDER UI =================
const GAME_NAME = 'Pokémon League Builder';
const SAVE_KEY = 'plb-save'; // this game's own save: it never reads or writes a Pokémon League GM save
const TYPE_COLOR = { Bird:'#9C8F8F', Normal:'#A8A77A', Fire:'#EE8130', Water:'#6390F0', Electric:'#F7D02C', Grass:'#7AC74C', Ice:'#96D9D6', Fighting:'#C22E28', Poison:'#A33EA1', Ground:'#E2BF65', Flying:'#A98FF3', Psychic:'#F95587', Bug:'#A6B91A', Rock:'#B6A136', Ghost:'#735797', Dragon:'#6F35FC', Dark:'#705746', Steel:'#B7B7CE', Fairy:'#D685AD' };
// Missingno's level shows as ?? (the real level is used underneath)
const lvShow = m => SP[m.sp] && SP[m.sp].glitch ? '??' : Math.floor(m.lvl);
const DARK_TEXT = new Set(['Normal','Electric','Grass','Ice','Ground','Flying','Bug','Rock','Steel','Fairy','Fire']);
let view = 'circuit';
let newsFilter = 'all';
let modal = null; // {kind, ...}
let player = null; // battle playback timer
let toastTimer = null;
let setupLoadText = '', setupLoadName = '', setupLoadErr = ''; // the advanced page's Load a save box
let viewLg = 0; // the League the league-wide pages show

const $ = s => document.querySelector(s);
// Saves are deflated with the browser's own CompressionStream (several Leagues make a big world) and packed
// 15 bits per character, so every character is ordinary text. Without CompressionStream it's plain JSON.
const CAN_DEFLATE = typeof CompressionStream !== 'undefined' && typeof DecompressionStream !== 'undefined';
const DF_TAG = 'DF1:';
function bytesToText(bytes) {
  const out = []; let acc = 0, nb = 0;
  for (let i = 0; i < bytes.length; i++) { acc = (acc << 8) | bytes[i]; nb += 8; while (nb >= 15) { nb -= 15; out.push(String.fromCharCode(((acc >> nb) & 0x7fff) + 32)); } acc &= (1 << nb) - 1; }
  if (nb) out.push(String.fromCharCode(((acc << (15 - nb)) & 0x7fff) + 32));
  return bytes.length + ':' + out.join('');
}
function textToBytes(txt) {
  const i = txt.indexOf(':'), n = +txt.slice(0, i), s = txt.slice(i + 1), bytes = new Uint8Array(n);
  let acc = 0, nb = 0, k = 0;
  for (let j = 0; j < s.length && k < n; j++) { acc = (acc << 15) | (s.charCodeAt(j) - 32); nb += 15; while (nb >= 8 && k < n) { nb -= 8; bytes[k++] = (acc >> nb) & 0xff; } acc &= (1 << nb) - 1; }
  return bytes;
}
async function deflateText(str) { const cs = new Blob([str]).stream().pipeThrough(new CompressionStream('deflate-raw')); return bytesToText(new Uint8Array(await new Response(cs).arrayBuffer())); }
// save codes (copy / download): "PLG1:" + base64 of the deflated JSON, about 4× shorter than plain JSON and only
// letters, digits and + / =, so it survives being pasted through other apps. Plain JSON saves still load.
const CODE_TAG = 'PLG1:';
function bytesToB64(bytes) { let bin = ''; for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000)); return btoa(bin); }
function b64ToBytes(b64) { const bin = atob(b64); const out = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i); return out; }
async function saveCode() {
  const raw = JSON.stringify(S);
  if (!CAN_DEFLATE) return raw;
  try { const cs = new Blob([raw]).stream().pipeThrough(new CompressionStream('deflate-raw')); return CODE_TAG + bytesToB64(new Uint8Array(await new Response(cs).arrayBuffer())); } catch (e) { return raw; }
}
async function inflateText(txt) { const ds = new Blob([textToBytes(txt)]).stream().pipeThrough(new DecompressionStream('deflate-raw')); return await new Response(ds).text(); }
let saveSeq = 0;
// (0.30.0) the save lives in IndexedDB (plb-save-db), which browsers let grow far past localStorage's ~5 MB: the deflated
// JSON as bytes under the key 'world', with its version. localStorage (SAVE_KEY, packed text) is only the fallback for
// a browser without IndexedDB, and where an older save is read from once.
const SAVE_DB = 'plb-save-db', SAVE_STORE = 'save', SAVE_REC = 'world';
let saveDbP = null;
function saveDb() {
  if (saveDbP) return saveDbP;
  saveDbP = new Promise(res => {
    try {
      if (!window.indexedDB) return res(null);
      const rq = indexedDB.open(SAVE_DB, 1);
      rq.onupgradeneeded = () => { const db = rq.result; if (!db.objectStoreNames.contains(SAVE_STORE)) db.createObjectStore(SAVE_STORE); };
      rq.onsuccess = () => res(rq.result); rq.onerror = () => res(null); rq.onblocked = () => res(null);
    } catch (e) { res(null); }
  });
  return saveDbP;
}
function saveTx(mode, fn) {
  return saveDb().then(db => db ? new Promise((res, rej) => {
    try { const tx = db.transaction(SAVE_STORE, mode), rq = fn(tx.objectStore(SAVE_STORE)); tx.oncomplete = () => res(rq ? rq.result : true); tx.onerror = tx.onabort = () => rej(tx.error || new Error('tx')); }
    catch (e) { rej(e); }
  }) : Promise.reject(new Error('no-db')));
}
async function deflateBytes(str) { const cs = new Blob([str]).stream().pipeThrough(new CompressionStream('deflate-raw')); return new Uint8Array(await new Response(cs).arrayBuffer()); }
async function inflateBytes(bytes) { const ds = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw')); return await new Response(ds).text(); }
function save() {
  if (!S) return;
  const raw = JSON.stringify(S), seq = ++saveSeq;
  const warn = () => { if (!save.warned) { save.warned = true; setTimeout(() => toast("This browser couldn't store the save. Use Download save file in the menu to keep it."), 50); } };
  const putLocal = v => { try { localStorage.setItem(SAVE_KEY, v); } catch (e) { warn(); } };
  const local = () => { if (!CAN_DEFLATE) return putLocal(raw); deflateText(raw).then(z => { if (seq === saveSeq) putLocal(DF_TAG + z); }, () => { if (seq === saveSeq) putLocal(raw); }); };
  (CAN_DEFLATE ? deflateBytes(raw).then(z => ({ v: SAVE_VERSION, z }), () => ({ v: SAVE_VERSION, json: raw })) : Promise.resolve({ v: SAVE_VERSION, json: raw }))
    .then(rec => { if (seq !== saveSeq) return; return saveTx('readwrite', st => st.put(rec, SAVE_REC)).then(() => { try { localStorage.removeItem(SAVE_KEY); } catch (e) {} }); })
    .catch(() => { if (seq === saveSeq) local(); });
}
// the old localStorage save (a browser without IndexedDB, or a save from before 0.30.0)
function load() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw && raw.startsWith(DF_TAG)) return { packed: raw.slice(DF_TAG.length) };
    if (raw) { const v = JSON.parse(raw); if (v && v.version === SAVE_VERSION) return v; }
  } catch (e) {}
  return null;
}
// the saved world, or null: IndexedDB first, then localStorage
async function loadSaved() {
  try {
    const rec = await saveTx('readonly', st => st.get(SAVE_REC));
    if (rec && rec.v === SAVE_VERSION) { const v = JSON.parse(rec.z ? await inflateBytes(rec.z) : rec.json); if (v && v.version === SAVE_VERSION) return v; }
  } catch (e) {}
  const old = load();
  if (old && old.packed) { if (!CAN_DEFLATE) return null; try { const v = JSON.parse(await inflateText(old.packed)); return v && v.version === SAVE_VERSION ? v : null; } catch (e) { return null; } }
  return old;
}
// forget the saved world (a new game)
function clearSave() { saveSeq++; try { localStorage.removeItem(SAVE_KEY); } catch (e) {} saveTx('readwrite', st => st.delete(SAVE_REC)).catch(() => {}); }

// ---------- small renderers ----------
const chip = ty => !ty ? `<span class="ty mixed">Mixed</span>` : `<span class="ty" style="--tc:${TYPE_COLOR[ty]};--tt:${DARK_TEXT.has(ty) ? '#1a1a1a' : '#fff'}">${ty}</span>`;
const chips = types => types.map(chip).join('');
const tname = id => { const t = T(id); if (!t) return '—'; return `<button class="tlink" data-act="profile" data-id="${id}">${dn(t)}${t.famous ? '<span class="star" title="Famous trainer">★</span>' : ''}</button>`; };
const babyTag = s => s.baby ? ` <span class="tag legend">${s.label}</span>` : s.ub ? ' <span class="tag ub">Ultra Beast</span>' : '';
// Battle Bond
const condTags = m => `${m.bond && T(m.bond) && T(m.bond).team.includes(m) && BOND_ROLES.includes(T(m.bond).role) ? ` <span class="tag bond" title="Battle Bond with ${esc(T(m.bond).name)}: in League battles, its first knockout turns it into ${esc(bondName(T(m.bond), m))} (+35% attack, +8% speed)">Battle Bond</span>` : ''}`;
// ---------- moves ----------
const EFFECT_TEXT = { par: 'paralyze', brn: 'burn', psn: 'poison', tox: 'badly poison', slp: 'put to sleep' };
function moveEffectText(mv) {
  const [k, x, y] = mv.eff.split(':');
  if (k === 'st') return +y >= 75 ? `${y}% to ${EFFECT_TEXT[x]}` : `${y}% chance to ${EFFECT_TEXT[x]}`;
  if (k === 'fl') return `${x}% flinch`;
  if (k === 'drain') return `heals ${x}% of damage dealt`;
  if (k === 'recoil') return `${x}% recoil`;
  if (k === 'self') return `lowers its own ${x.split(',').map(p => STAT_NAME_B[p.split('-')[0]]).join(' and ')}`;
  if (k === 'foe') { const [st] = x.split('-'); return `${y === '100' ? '' : y + '% to '}lower ${STAT_NAME_B[st]}`; }
  if (k === 'up') { const parts = x.split(','); const all = parts.length >= 5; return `${y === '100' ? '' : y + '% to '}raise its own ${all ? 'stats' : parts.map(p => STAT_NAME_B[p.split('+')[0]]).join(' and ')}${parts[0].split('+')[1] > 1 ? ` by ${parts[0].split('+')[1]}` : ''}`; }
  if (k === 'crit') return 'high critical-hit ratio';
  if (k === 'facade') return 'doubles when it has a status condition';
  if (k === 'hex') return 'doubles on a target with a status condition';
  if (k === 'knock') return 'knocks away the target’s item';
  if (k === 'boost') return `+1 ${STAT_NAME_B[x]} (once per battle)`;
  if (k === 'boost2') return `+1 ${x.split(',').map(p => STAT_NAME_B[p]).join(' and ')} (once per battle)`;
  if (k === 'dance') return `+1 to one of ${x.split(',').map(p => STAT_NAME_B[p]).join(' / ')} (once per battle)`;
  if (k === 'heal') return `heals 25% (once per battle)`;
  if (k === 'protect') return 'the next attack on it will probably miss';
  if (k === 'hazard') return x === 'rocks' ? 'hurts each Pokémon the foe sends in (Rock-type damage)' : 'hurts each grounded Pokémon the foe sends in';
  if (k === 'weather') return `summons ${WEATHER_NAME[x].toLowerCase()}`;
  if (k === 'seed') return 'drains the target every turn';
  return '';
}
function moveLine(mv, m) {
  const fl = mv.flags;
  const bits = [`${mv.cat === 'P' ? 'Physical' : 'Special'} ${mv.pw}`, fl.includes('n') ? 'never misses' : `${Math.round(squeezeAcc(mv.acc) * 100)}% accurate`];
  if (m && monTypes(m).includes(mv.type)) bits.push('same type');
  if (mv.sig) bits.push('signature move');
  if (isMulti(mv)) bits.push(fl.includes('m') ? (m && abilityOf(m) === 'Skill Link' ? 'hits 5 times (Skill Link)' : 'hits 2–5 times') : fl.includes('t') ? 'hits 3 times' : 'hits twice');
  if (fl.includes('k')) bits.push('moves first');
  if (fl.includes('c') && !(m && abilityOf(m) === 'Long Reach')) bits.push('contact');
  if (fl.includes('s')) bits.push(m && abilityOf(m) === 'Liquid Voice' && mv.type !== 'Water' ? 'sound, Water-type (Liquid Voice)' : 'sound');
  if (fl.includes('o')) bits.push('ball/bomb');
  if (fl.includes('x')) bits.push('slicing');
  if (fl.includes('r')) bits.push('must recharge');
  const fx = moveEffectText(mv); if (fx) bits.push(fx);
  return bits.join(' · ');
}
// ---------- abilities ----------
const abOn = () => featOn('abilities');
function abilityChip(m) { if (!abOn()) return ''; const a = abilityOf(m); if (a && m.radAb === a) return `<span class="abchip radiant" title="${esc(ABILITIES[a])} (Radiant ability)">✧ ${a}</span> `; return a ? `<span class="abchip${m.deltaAb === a ? ' delta' : m.abSlot === 'H' && SPECIES_AB[m.sp] && SPECIES_AB[m.sp].H === a ? ' hidden' : ''}" title="${esc(ABILITIES[a])}${m.deltaAb === a ? ' (unusual Delta ability)' : ''}">${m.deltaAb === a ? 'Δ ' : ''}${a}</span> ` : ''; }
function abilityBlock(m) {
  if (!abOn()) return '';
  const a = abilityOf(m), A = SPECIES_AB[m.sp] || {};
  const hid = a && A.H === a && m.abSlot === 'H', dab = a && m.deltaAb === a, rab = a && m.radAb === a;
  return `<div class="eyebrow">Ability</div><p>${a ? `<b>${a}</b>${rab ? ' <span class="tag radiant" title="An ability its species never has, stronger than any it does, from its Radiant nature">✧ Radiant ability</span>' : dab ? ' <span class="tag delta" title="An ability its species never has, from its Delta nature">Δ Unusual ability</span>' : hid ? ' <span class="tag gold">Hidden ability</span>' : ''} <span class="muted small">· ${ABILITIES[a]}</span>` : `<span class="muted">No ability yet</span> <span class="muted small">(${[A[0], A[1], A.H].filter(Boolean).join(', ') || '—'} not in the game yet)</span>`}</p>`;
}
const gymWeatherTag = L => abOn() && L && gymWeatherType(L) ? ` <span class="tag weather" title="Battles at this gym take place in this weather">${WEATHER_NAME[GYM_WEATHER[gymWeatherType(L)]]}</span>` : '';
// ---------- held items ----------
const itemTag = m => itemsOn() && m && m.item && ITEMS[m.item] ? ` <span class="tag item" title="${esc(ITEMS[m.item].desc)}">◆ ${ITEMS[m.item].name}</span>` : '';
const itemChip = k => `<span class="itemchip t${ITEMS[k].tier}" title="${esc(ITEMS[k].desc)}">${ITEMS[k].name}</span>`;
// holds this season's Mega Stone
const megaTag = m => { if (!m || !m.uid) return ''; const t = Object.values(S.trainers).find(x => hasMega(x) && x.mega.uid === m.uid); return t && megaFor(t, m) ? ` <span class="tag mega" title="Can become ${megaFor(t, m).name} in League battles this year">Mega Stone</span>` : ''; };
// a great legendary loose in the region
function legendBanner() {
  const L = legendState(S.legend); if (!L) return '';
  const worn = Math.min(100, Math.round(L.total / LEGEND_BARS * 100)), rank = legendRank(L).slice(0, 3);
  const board = rank.length ? `<ul class="mini">${rank.map((r, i) => `<li><span>${i + 1}. ${T(r.id) ? dn(T(r.id)) : '—'}</span><span class="num">${Math.round(r.d * 100)}% · ${r.n} attempt${r.n === 1 ? '' : 's'}</span></li>`).join('')}</ul>` : '<p class="small muted">No one has tried yet.</p>';
  return `<div class="legendbox"><span class="lg-k">Legendary</span> <b>${L.sp}</b> ${chips(SP[L.sp].types)} Lv ${L.lvl} is near <b>${L.town}</b> until ${turnDate(L.until)}.
    <div class="lg-bar"><i style="width:${worn}%"></i></div><div class="small muted">${worn}% worn down after ${L.attempts} attempt${L.attempts === 1 ? '' : 's'}. Any challenger can spend a week battling it at full strength; their damage adds to their own total. When it's worn down, or its time is up, it goes to whoever did the most (a tie is fought out). Each attempt's luck swings hard, and even a failed one earns experience.${['Groudon', 'Kyogre'].includes(L.sp) ? ` Its ${L.sp === 'Groudon' ? 'drought' : 'rain'} lasts until it's caught.` : L.sp === 'Eternatus' ? ' Every battle is chaos while it is loose.' : ''}</div>${board}</div>`;
}
// v182: a legendary roaming the region
function roamBanner() {
  const R = S.roamer; if (!R) return '';
  const trail = R.trail.slice(-5).map(i => townName(i)).join(' → ');
  return `<div class="roambox"><span class="rm-k">Roaming</span> <b>${R.sp}</b> ${chips(SP[R.sp].types)} was last seen near <b>${townName(R.town)}</b>. It leaves the region after ${turnDate(R.until)}.
    <div class="small muted">Challengers exploring on the way to its town (or the next one over) may find it among their wild Pokémon, and catch it like any other. It moves on most weeks. Seen near: ${trail}.</div></div>`;
}
// v182: a legendary's storm over the region
function stormBanner() {
  const st = S.storm; if (!st) return '';
  const s = STORMS[st.sp], rank = stormRank(st).slice(0, 3);
  const fx = stormFx(s).replace(/^./, c => c.toUpperCase());
  const board = rank.length ? `<ul class="mini">${rank.map((r, i) => `<li><span>${i + 1}. ${dn(T(r.id))}</span><span class="num">${r.w} win${r.w === 1 ? '' : 's'} · ${r.k} KO${r.k === 1 ? '' : 's'}</span></li>`).join('')}</ul>` : '<p class="small muted">No wins yet.</p>';
  return `<div class="stormbox"><span class="sm-k">${s.name}</span> <b>${st.sp}</b> ${chips(SP[st.sp].types)} is over the region until ${turnDate(st.until)}: ${fx}.
    <div class="small muted">When it passes, ${st.sp} chooses the challenger who won the most battles while it lasted (at least ${STORM_MIN}; knockouts settle a tie), whatever their type. Every battle counts.</div>${board}</div>`;
}
// v182: the region's recent legendary sightings
function skyPanel() {
  const log = (S.skyLog || []).slice(0, 6); if (!log.length) return '';
  return `<section class="panel"><div class="ph"><h3>Legendary sightings</h3><span class="muted">Roamers and storms</span></div><ul class="mini">${log.map(l => `<li><span>${l.text}</span><span class="num muted">Y${l.season} · ${weekShort(l.week - 1)}</span></li>`).join('')}</ul></section>`;
}
function outbreakBanner() {
  const ob = activeOutbreak(); if (!ob) return '';
  const sp = SP[ob.sp];
  return `<div class="outbreak"><span class="ob-k">Mass outbreak</span> <b>${ob.sp}</b> ${chips(sp.types)} swarming near ${ob.town} this week${SP[ob.sp].rare ? ' <span class="tag">rare</span>' : ''}. Challengers who explore can find one in the open slot, with alphas 4× and shinies 8× as likely.</div>`;
}
const traitChip = t => { const k = traitOf(t); return k ? ` <span class="trait" title="${TRAITS[k].text}">${TRAITS[k].name}</span>` : ''; };
function rivalLine(t) {
  const bits = [];
  const r = t.rival && T(t.rival); if (r) { const h = h2hOf(t, r); bits.push(`<span class="rv">Rival</span> ${tname(r.id)} <span class="muted">${h.w}–${h.l}${r.role === 'retired' ? ', retired' : ''}</span>`); }
  const n = t.nemesis && T(t.nemesis); if (n) { const h = h2hOf(t, n); bits.push(`<span class="rv nem">Nemesis</span> ${tname(n.id)} <span class="muted">${h.w}–${h.l}</span>`); }
  return bits.length ? `<div class="rivals-line">${bits.join(' ')}</div>` : '';
}
const specChips = t => t.specialty ? chip(t.specialty) + (t.spec2 ? ' ' + chip(t.spec2) : '') : chip(null);
const specName = t => t.specialty ? t.specialty + (t.spec2 ? ' / ' + t.spec2 : '') : 'Mixed';
const COND_RESEARCH = { delta: 'Deltas', alpha: 'alphas', shiny: 'shinies' }; // (0.76.0) a condition class's line
const specLine = t => t.specialty ? `${specChips(t)} ${t.spec2 ? 'dual-type specialist' : 'specialist'}${t.role !== 'champion' && backupTypes(t).length ? ` <span class="muted">· backups</span> ${chips(backupTypes(t))}` : ''}` : `${chip(null)} team, no type focus${t.condCls ? ` <span class="tag small" title="A rare condition class: always carries one of these">researches ${COND_RESEARCH[t.condCls]}</span>` : ''}`;
function ovrPill(t) { const o = ovr(t); const c = o >= 70 ? 'hi' : o >= 55 ? 'mid' : 'lo'; return `<span class="ovr ${c}">${o}</span>`; }
function roleLabel(t) {
  const r = roleHere(t);
  return nLeagues() > 1 && [...STAFF_ROLES, 'challenger'].includes(t.role) ? `${r} · ${leagueName(lgOf(t))}` : r;
}
function roleHere(t) {
  if (t.role === 'leader') return inLeague(lgOf(t), () => { const i = S.gyms.findIndex(g => g.leader === t.id); return `${townName(i)} ${postWord('leader')}`; });
  if (t.role === 'gymtrainer') return inLeague(lgOf(t), () => { const i = S.gyms.findIndex(g => (g.trainers || []).includes(t.id)); return `${townName(i)} ${postWord('gymtrainer')}`; });
  if (t.role === 'e4' || t.role === 'champion') return postWord(t.role, lgOf(t));
  return { challenger: 'Challenger', retired: 'Retired', exchamp: 'Former Champion', prospect: 'Newcomer', free: 'Free agent' }[t.role] || t.role;
}
function badgeRow(t, big) { return inLeague(lgOf(t), () => badgeRowHere(t, big)); }
function badgeRowHere(t, big) {
  let h = `<div class="badges${big ? ' big' : ''}" aria-label="${t.badges.length} of 8 badges">`;
  for (let i = 0; i < 8; i++) { const has = t.badges.includes(i); h += `<span class="bdg${has ? ' on' : ''}" title="${townName(i)} Badge${has ? ` (badge ${t.badges.indexOf(i) + 1} of the run)` : ' (not earned)'}">${big ? townName(i)[0] : ''}</span>`; }
  h += '</div>';
  // (0.32.0) the order they took the gyms this run, and where they're heading
  if (big && t.rest == null && (t.badges.length || t.gymAt != null)) h += `<div class="small muted">Route this run: ${t.badges.map(townName).join(' → ') || 'no badges yet'}${t.badges.length < 8 && t.gymAt != null ? ` · next: ${townName(t.gymAt)}` : t.badges.length >= 8 ? ' · the Elite Four next' : ''}</div>`;
  return h;
}
function stageText(st) {
  if (st == null) return 'No run at the Elite Four';
  if (st === 5) return 'Won the Championship';
  if (st === 4) return 'Lost in the Championship';
  return `Lost to Elite Four #${st + 1}`;
}
function evoText(s) {
  if (!s.evos) return '';
  if (s.evos.length === 1) return `→ ${s.evos[0].to} at Lv ${s.evos[0].lvl}`;
  return `→ ${s.evos.map(e => e.to).join(' / ')} at Lv ${s.evos[0].lvl}`;
}
const stOf = m => m.st || blankStat();
const ssOf = m => (m.ss && m.ss.season === S.season ? m.ss : blankStat());
const pct = st => st.b ? Math.round(st.w / st.b * 100) + '%' : '—';
const wl = st => `${st.w}–${st.l}`;
const STAT_NAME = { hp: 'HP', atk: 'Attack', def: 'Defense', spa: 'Sp. Atk', spd: 'Sp. Def', spe: 'Speed' };
const STAT_SHORT = { hp: 'HP', atk: 'Atk', def: 'Def', spa: 'SpA', spd: 'SpD', spe: 'Spe' };
// v197: the temperament a nature gives, as a line for a Pokémon's profile (a Quirky one shows this season's)
function temperLine(m) {
  const n = temperOf(m); if (!n) return '';
  const q = m.nat === 'Quirky';
  return `<p class="small"><b>${TEMPER[m.nat].name}</b>${q ? ` <span class="muted">· this year ${TEMPER[n].name} (as if ${n})</span>` : ''} <span class="muted">· ${TEMPER[n].d}</span></p>`;
}
function natureText(n) {
  const fx = natureFx(n);
  const up = Object.keys(fx).find(k => fx[k] > 1), down = Object.keys(fx).find(k => fx[k] < 1);
  return up ? `+${STAT_NAME[up]}, −${STAT_NAME[down]}` : 'neutral';
}
function ivGrade(m) { const v = ivTotal(m); return v >= 186 ? 'Perfect' : v >= 165 ? 'Outstanding' : v >= 132 ? 'Great' : v >= 93 ? 'Good' : v >= 60 ? 'Decent' : 'Weak'; }
// physical or special, from the species' spread (the battle picks per opponent when the two are close)
function attackStyle(sp) { const b = bsOf(sp); return Math.abs(b.atk - b.spa) <= 0.1 * Math.max(b.atk, b.spa) ? 'Mixed attacker' : b.atk > b.spa ? 'Physical attacker' : 'Special attacker'; }
const FORM_ICON = { 'On fire': '▲▲', Hot: '▲', Steady: '', Cold: '▼', Slumping: '▼▼' };
function formBadge(m) { const f = formTier(m.form || 0); return FORM_ICON[f] ? `<span class="form ${f === 'Hot' || f === 'On fire' ? 'up' : 'down'}" title="Form: ${f}">${FORM_ICON[f]}</span>` : ''; }
const covChip = ty => `<span class="ty cov" style="--tc:${TYPE_COLOR[ty]}" title="Coverage move">${ty}</span>`;
function monRow(m, tid) {
  ensureMon(m);
  const s = SP[m.sp];
  const evo = s.evos ? `<span class="evo">${evoText(s)}</span>` : '';
  const st = stOf(m);
  return `<button class="mon" data-act="mon" data-t="${tid}" data-u="${m.uid}" title="See ${m.sp}'s stats">
    ${monFace(m.sp, m.shiny || m.radiant, 40)}
    <span class="mon-main"><span class="mon-name">${m.sp}${s.legend ? ' <span class="tag legend">Legendary</span>' : ''}${s.paradox ? ' <span class="tag paradox">Paradox</span>' : ''}${babyTag(s)}${megaTag(m)}${itemTag(m)}${m.shiny ? ' <span class="tag shiny">✦ Shiny</span>' : ''}${m.radiant ? ' <span class="tag radiant" title="Radiant: shiny colors, at least Good IVs and a stronger ability than its species ever gets">✧ Radiant</span>' : ''}${m.delta ? ' <span class="tag delta" title="Delta Pokémon: an unusual ' + m.delta + ' type">Δ Delta</span>' : ''}${m.alpha ? ' <span class="tag alpha">Alpha</span>' : ''}${condTags(m)}${formBadge(m)}</span><span class="mon-sub">${chips(monTypes(m))} ${abilityChip(m)}<span class="muted">${m.nat}</span> ${evo}</span></span>
    <span class="mon-rec" title="${m.partners ? 'Lifetime record' : 'Career record on this team'}"><b>${wl(st)}</b><small>${st.ko} KO${m.leg && m.leg.until != null ? ` · until S${m.leg.until}` : ''}</small></span>
    <span class="mon-lv"><small>Lv</small>${lvShow(m)}</span>
  </button>`;
}
function teamDots(t) { return `<div class="tdots">${t.team.map(m => { const s = SP[m.sp], u = monImg(m.sp, m.shiny || m.radiant); return u ? `<img class="pic sm" src="${u}" alt="${esc(m.sp)}" title="${m.sp} Lv ${lvShow(m)}" width="22" height="22">` : `<span class="dot sm" title="${m.sp} Lv ${lvShow(m)}" style="--tc:${TYPE_COLOR[s.types[0]]};--tc2:${TYPE_COLOR[s.types[1] || s.types[0]]}"></span>`; }).join('')}${'<span class="dot sm empty"></span>'.repeat(Math.max(0, 6 - t.team.length))}</div>`; }
function ratingBars(t, prog) {
  return `<div class="ratings">${RK.map(k => {
    const v = t.r[k]; let d = '';
    if (prog) { const x = prog.after[k] - prog.before[k]; if (x) d = `<span class="delta ${x > 0 ? 'up' : 'down'}">${x > 0 ? '+' : ''}${x}</span>`; }
    return `<div class="rt"><span class="rt-k">${RNAME[k]}</span><span class="rt-bar"><i style="width:${v}%"></i></span><span class="rt-v">${v}${d}</span></div>`;
  }).join('')}</div>`;
}
const RHELP = { str: 'Picks counters when sending out Pokémon', trn: 'Extra levels on training weeks', bnd: 'Critical hits and holding on at 1 HP', sct: 'Better and rarer Pokémon when exploring', nrv: 'Performance in League and title battles' };
// older saves' catch news has no category yet, so it's recognized by its wording
const CATCH_WORDS = /caught (a|an) (Radiant|shiny|alpha|Delta)|caught the Ultra Beast|Ultra Wormhole|outbreak|spotted a .+ while exploring|only one in the league/i;
const isCatchNews = n => n.tag === 'catch' || CATCH_WORDS.test(n.text);
function newsList(items) {
  if (!items.length) return '<p class="muted">Nothing yet.</p>';
  return `<ul class="news">${items.map(n => `<li class="n-${n.tag}"><span class="n-when">Y${n.season} · ${weekShort(Math.min(YEAR_WEEKS - 1, n.week || 0))}${n.lg != null && nLeagues() > 1 ? ' · ' + lgShort(n.lg) : ''}</span><span>${n.text}</span></li>`).join('')}</ul>`;
}

// ---------- header & nav ----------
// the live headline: how long the wall has stood since the last title was conceded (the bound League)
function wallStanding() {
  const since = S.lastTitle == null ? (S.turn || 0) : S.turn - S.lastTitle, y = Math.floor(since / YEAR_WEEKS), w = since % YEAR_WEEKS;
  const span = y ? `${y} year${y === 1 ? '' : 's'}${w ? `, ${w} week${w === 1 ? '' : 's'}` : ''}` : `${w} week${w === 1 ? '' : 's'}`;
  return S.lastTitle == null ? `no title conceded in ${span}` : `${span} since a title was conceded`;
}
function header() {
  // one continuous world: time moves a week, a month or a year at a time, and you can act between any two weeks.
  // The longer steps stop early when something needs you (a title conceded, a vacant post, the New Year report).
  const pf = playerFin(), status = `${dateName()} · ${wallStanding()}${pf ? ` · ${money(pf.money)}` : ''}`;
  const btn = `<button class="btn primary" data-act="playweek">Next week</button><button class="btn ghost" data-act="playmonth" title="Stops early if a title is conceded or a post falls vacant">Next month</button><button class="btn ghost" data-act="playyear" title="Stops early if a title is conceded or a post falls vacant">To New Year</button>`;
  return `<header class="top"><div class="top-in">
    <div class="mark"><span class="mark-ball" aria-hidden="true"></span><div><div class="mark-name">${GAME_NAME} <span class="mark-ver">v${verName(UPDATES[0])}</span></div><div class="mark-sub">${nLeagues() > 1 ? `${nLeagues()} Leagues` : S.lgName} · ${status}</div></div></div>
    <div class="top-act">${btn}<button class="btn ghost" data-act="nav" data-v="board" title="The progress board: how far everyone has got">Board</button><button class="btn ghost" data-act="simmany">Sim years</button><button class="btn icon" data-act="menu" aria-label="Save and league options${updatesNew() ? ' (new updates)' : ''}">⋯${updatesNew() ? '<span class="newdot"></span>' : ''}</button></div>
  </div></header>`;
}
// the page menu (0.35.0): four groups by what you're doing — Manage (run your League), Circuit (watch the
// challengers), World (the other Leagues and what happened), Records — plus the Glossary and Updates.
// The progress board is the header's Board button; God mode is in the ⋯ menu.
let navOpen = null;
function navGroups() {
  const manage = [['gyms', 'Gyms & Elite']];
  if (handOn()) manage.push(['staff', 'Your staff']);
  if (playerFin()) manage.push(['ranch', 'Ranch'], ['plans', 'Team plans'], ['money', 'Money'], ['cities', 'Cities']);
  if (handOn()) manage.push(['talks', `Talks${talksForMe().length ? ` (${talksForMe().length})` : ''}${talkUnseen() ? ` · ${talkUnseen()} new result${talkUnseen() > 1 ? 's' : ''}` : ''}`]); // (0.53.0; results 0.56.0)
  if (handOn() && nLeagues() > 1) manage.push(['contenders', 'Contenders']);
  const world = [];
  if (nLeagues() > 1) world.push(['table', 'League table']);
  world.push(['news', 'News'], ['history', 'History'], ['posts', 'Post holders']);
  const records = [];
  if (S.history.some(x => x.titles != null)) records.push(['recap', 'Year report']);
  records.push(['records', 'Records'], ['hof', 'Hall of Fame'], ['dex', 'Pokémon']);
  return [
    { k: 'manage', label: 'Manage', items: manage },
    { k: 'circuit', label: 'Circuit', items: [['circuit', 'Badge circuit'], ['trainers', 'All trainers'], ['meta', 'Meta']] },
    { k: 'world', label: 'World', items: world },
    { k: 'records', label: 'Records', items: records },
  ];
}
function nav() {
  const groups = navGroups();
  const grp = g => {
    const here = g.items.some(x => x && x[0] === view), open = navOpen === g.k;
    const cur = here ? g.items.find(x => x && x[0] === view)[1] : null;
    return `<div class="navgrp${open ? ' open' : ''}"><button class="tab navbtn${here ? ' on' : ''}" data-act="navgrp" data-k="${g.k}" aria-haspopup="true" aria-expanded="${open}">${g.label}${cur && cur !== g.label ? `<span class="navcur"> · ${cur}</span>` : ''}<span class="navchev" aria-hidden="true">▾</span></button>
      <div class="navmenu" role="menu">${g.items.map(x => x ? `<button class="navitem${view === x[0] ? ' on' : ''}" role="menuitem" data-act="nav" data-v="${x[0]}">${x[1]}</button>` : '<div class="navsep" role="separator"></div>').join('')}</div></div>`;
  };
  // v195: on phones Glossary and Updates share a More menu, so the bar fits the screen
  const dot = updatesNew() ? '<span class="newdot" aria-label="new"></span>' : '', mOpen = navOpen === 'more';
  const more = `<div class="navgrp navmore${mOpen ? ' open' : ''}"><button class="tab navbtn${view === 'updates' ? ' on' : ''}" data-act="navgrp" data-k="more" aria-haspopup="true" aria-expanded="${mOpen}">More${dot}<span class="navchev">▾</span></button>
      <div class="navmenu navmenu-r" role="menu"><button class="navitem" role="menuitem" data-act="glossary">Glossary</button><button class="navitem${view === 'updates' ? ' on' : ''}" role="menuitem" data-act="updates">Updates${dot}</button></div></div>`;
  return `<nav class="tabs" aria-label="Pages"><div class="tabs-in">${groups.map(grp).join('')}<button class="tab navgloss" data-act="glossary">Glossary</button><button class="tab navgloss${view === 'updates' ? ' on' : ''}" data-act="updates">Updates${dot}</button>${more}</div></nav>`;
}
// ---------- setup ----------
let setupGrowth = true, setupPace = 8, setupGod = false, setupLeagues = 3; // (0.21.0) Leagues at the start, yours included
// (0.30.0) where each rival starts (Advanced): a region index, or null for anywhere
let setupRivals = [];
// (0.33.0) League names given at setup: [yours, rival 1, rival 2…]; blank takes the seat's default
let setupNames = [];
// (0.42.0) your League's posts at setup ({ theme, names }) and each rival's theme ('' = drawn by its aim and region)
let setupPosts = { theme: 'region', names: {} }, setupRivalThemes = [], setupSeat = { k: 'protected', every: null, now: false }; // (0.43.0) setupSeat: your seat rule
const POST_LABELS = { leader: 'Gym Leaders', gymtrainer: 'Gym trainers', e4: 'Elite Four', champion: 'Champion' };
// (0.42.0) the post-name form: a theme picker that fills the four fields, each still editable. cls: the fields' class,
// sel: the picker's id, r: the region (placeholders), ps: { theme, names }
function postsForm(sel, cls, ps, r) {
  const w = themeWords(ps.theme, r), custom = POST_KEYS.some(k => ps.names[k] != null && ps.names[k] !== '' && ps.names[k] !== w[k]);
  return `<div class="posts-form"><label class="cf-field"><span class="eyebrow">Theme${custom ? ' <span class="tag">Custom</span>' : ''}</span><select class="cf-in" id="${sel}">${THEME_KEYS.map(k => `<option value="${k}"${ps.theme === k ? ' selected' : ''}>${esc(THEMES[k].name)}</option>`).join('')}</select></label>
    <div class="cf-grid">${POST_KEYS.map(k => `<label class="cf-field"><span class="eyebrow">${POST_LABELS[k]}</span><input class="cf-in ${cls}" data-k="${k}" maxlength="${POST_MAX}" value="${esc(ps.names[k] != null ? ps.names[k] : w[k])}" placeholder="${esc(w[k])}" autocomplete="off"></label>`).join('')}</div></div>`;
}
// (0.30.0) how long a simulated year takes with n Leagues, in seconds: measured in Node at 0.29.0 (a browser may be
// slower), straight lines between the measurements and on past the last; a guide for the setup screen's warning
// (0.41.0) rescaled for the regional field's smaller fields (measured in Node at years 2 to 3, scaled to the 0.29.0 table's machine)
const SPEED_AT = [[1, 2], [3, 5.5], [6, 9.5], [10, 17], [18, 33], [36, 115]], SPEED_AMBER = 20, SPEED_RED = 40;
function speedEst(n) {
  let i = SPEED_AT.findIndex(p => p[0] >= n); if (i < 1) i = i === 0 ? 1 : SPEED_AT.length - 1;
  const [a, b] = [SPEED_AT[i - 1], SPEED_AT[i]];
  return Math.max(1, Math.round(a[1] + (b[1] - a[1]) * (n - a[0]) / (b[0] - a[0])));
}
function speedNote(n) {
  const s = speedEst(n), lvl = s > SPEED_RED ? 'red' : s > SPEED_AMBER ? 'amber' : '';
  return `<p class="small speed-est${lvl ? ' ' + lvl : ' muted'}">${lvl ? `<b>${lvl === 'red' ? 'A very big world.' : 'A big world.'}</b> ` : ''}About ${s} second${s === 1 ? '' : 's'} a simulated year on a fast computer (a phone or an older computer may be slower)${lvl ? ', and slower as the world ages. Fewer Leagues play faster.' : '.'}</p>`;
}
let setupPage = 'main', setupAdv = { newRegions: true }, setupFam = 0, setupBaseOff = false, setupPacks = {}, setupPackOpen = {}, setupOff = {};
// every section on the Advanced page folds; folded sections show a one-line summary
let setupFold = {};
function foldSec(key, title, sub, summary, body, extra = '') {
  const shut = !!setupFold[key];
  return `<section class="panel fold${shut ? ' shut' : ''}"><div class="ph fold-h"><button class="fold-btn" data-act="advfold" data-k="${key}" aria-expanded="${!shut}"><span class="fold-chev" aria-hidden="true">${shut ? '▸' : '▾'}</span><h2>${title}</h2></button><span class="muted">${shut ? summary : sub}</span></div>${shut ? '' : extra + body}</section>`;
}
// (0.30.0) where the rival Leagues start: anywhere (the default spread) or a region of your choosing. A region holds two
// Leagues; your own region (chosen on the main page) can take one rival here
function rivalsSection() {
  const n = setupLeagues - 1, placed = setupRivals.slice(0, n).filter(x => x != null).length;
  const body = n < 1 ? '<p class="muted small">The world starts with your League alone. Set Starting Leagues above 1 on the main page to place rivals.</p>'
    : `<p class="muted small">Each rival starts anywhere (spread over regions with no League first) or in the region you pick, and can be given a name (left blank, it takes its seat's default: the region's name at the first seat, the second seat's name at the second, as the Victory Road League). A region holds two Leagues; picking your own region puts a rival beside you at its second seat. Picks past a region's room start anywhere.</p>
    <div class="adv-list rival-list">${Array.from({ length: n }, (_, i) => `<label class="rival-row"><span>Rival ${i + 1}</span> <select class="rivalsel" data-i="${i}"><option value="">Anywhere</option>${LEAGUE_SETS.map((r, k) => `<option value="${k}"${setupRivals[i] === k ? ' selected' : ''}>${esc(regionName(k))}</option>`).join('')}</select> <input class="cf-in rivalname" data-i="${i + 1}" maxlength="${LG_NAME_MAX}" value="${esc(setupNames[i + 1] || '')}" placeholder="Name: the seat's default" aria-label="Rival ${i + 1}'s name" autocomplete="off"> <select class="rivaltheme" data-i="${i}" aria-label="Rival ${i + 1}'s theme"><option value="">Theme: by its aim and region</option>${THEME_KEYS.map(k => `<option value="${k}"${setupRivalThemes[i] === k ? ' selected' : ''}>${esc(THEMES[k].name)}</option>`).join('')}</select></label>`).join('')}</div>`;
  return foldSec('rivals', 'Where rival Leagues start', 'Your region is chosen on the main page', n < 1 ? 'No rivals' : (placed ? `${placed} of ${n} placed` : 'Anywhere') + (setupNames.slice(1, n + 1).some(x => x && x.trim()) ? ' · named' : ''), body);
}
function viewAdvanced() {
  const opt = (k, title, desc) => `<button class="adv-opt${setupAdv[k] ? ' on' : ''}" data-act="advtoggle" data-k="${k}" role="switch" aria-checked="${setupAdv[k]}">
    <span class="adv-switch" aria-hidden="true"><i></i></span><span class="adv-text"><b>${title}</b><span class="muted small">${desc}</span></span></button>`;
  const packKeys = Object.keys(FAMOUS_PACKS).filter(k => !FAMOUS_PACKS[k].custom), packsOn = packKeys.filter(k => setupPacks[k]).length, allPacks = packsOn === packKeys.length && !setupBaseOff;
  const famousCount = (setupBaseOff ? 0 : BASE_FAMOUS) + Object.keys(setupPacks).filter(k => setupPacks[k] && FAMOUS_PACKS[k]).reduce((a, k) => a + FAMOUS_PACKS[k].trainers.length, 0);
  const offCount = Object.values(setupOff).filter(Boolean).length;
  const groups = FEATURES.map(g => { const gk = 'feat-' + g.group, shut = !!setupFold[gk], off = g.items.filter(i => setupOff[i[0]]).length;
    return `<div class="feat-group fold${shut ? ' shut' : ''}"><button class="fold-btn small" data-act="advfold" data-k="${gk}" aria-expanded="${!shut}"><span class="fold-chev" aria-hidden="true">${shut ? '▸' : '▾'}</span><span class="eyebrow">${g.group}</span><span class="muted small">${off ? off + ' of ' + g.items.length + ' off' : 'all on'}</span></button>${shut ? '' : `<div class="adv-list">${g.items.map(([k, name, desc]) => `<button class="adv-opt${setupOff[k] ? '' : ' on'}" data-act="feattoggle" data-k="${k}" role="switch" aria-checked="${!setupOff[k]}">
        <span class="adv-switch" aria-hidden="true"><i></i></span><span class="adv-text"><b>${name}</b><span class="muted small">${desc}</span></span></button>`).join('')}</div>`}</div>`; }).join('');
  const keys = ['rules', 'rivals', 'features', 'packs', 'mypacks', 'dex', 'regions', 'images', 'load', ...FEATURES.map(g => 'feat-' + g.group)];
  const anyOpen = keys.some(k => !setupFold[k]);
  return `<main class="wrap setup"><section class="panel callout"><div class="eyebrow">New world</div><h1>Advanced options</h1>
    <p>Optional rules for the new world. These aren't balanced; they're here for fun.</p>
    <div class="confirm-row"><button class="btn small" data-act="advfoldall" data-v="${anyOpen ? 1 : 0}">${anyOpen ? 'Collapse all' : 'Expand all'}</button></div></section>
    ${foldSec('rules', 'Rules', 'Optional league rules', [setupFam && (setupFam === 100 ? 'All-famous' : `Famous trainers ${setupFam}%`), setupAdv.renameAny && 'Rename rival Leagues on', !setupAdv.newRegions && 'New regions closed'].filter(Boolean).join(' · ') || 'Nothing on', `<div class="adv-list">
      ${opt('newRegions', 'Leagues can open in new regions', 'On: a founder can open a League in a region that has no League yet, which brings its own field of challengers there. Off: new Leagues open only in regions that already have one. New Leagues never favour your region either way.')}
      ${opt('renameAny', 'Rename rival Leagues', 'Rename any League from the League table during play, not only your own (rival Leagues are always nameable here at setup, under Where rival Leagues start).')}
      <div class="adv-opt static"><span class="adv-text"><b>Famous trainers</b><span class="muted small">How many of the trainers the game creates are famous trainers from the games and anime: Gym Leaders, Elite Four, Champions, gym trainers, the founding pool, rivals and newcomers. Normal keeps the usual few (some newcomers and outside hires); 100% is an all-famous world. Gym trainers are famous ones of their leader's type, and famous trainers in the founding pool start at founding strength, like everyone there. The more famous the world, the less being famous counts for pay and prestige. Draws from ${famousCount} famous trainers${famousCount ? '' : ' (none are switched on, so the world will use ordinary trainers)'}; once every one has debuted, they come round again as V2 (Kanto Leader Misty V2), then V3, and so on.</span>
        <span class="segs setup-segs">${FAM_SHARES.map(n => `<button class="seg${setupFam === n ? ' on' : ''}" data-act="setfam" data-v="${n}" aria-pressed="${setupFam === n}">${n ? n + '%' : 'Normal'}</button>`).join('')}</span></span></div>
    </div>`)}
    ${rivalsSection()}
    ${foldSec('features', 'Game features', 'Everything is on by default. Settings are fixed once the league starts.', offCount ? `${offCount} feature${offCount === 1 ? '' : 's'} off` : 'Everything on', groups + (offCount ? '<div class="confirm-row"><button class="btn small" data-act="featreset">Turn everything back on</button></div>' : ''))}
    ${foldSec('packs', 'Famous trainer packs', "The game's own famous trainers, plus extras from outside Pokémon", `${setupBaseOff ? 'Pokémon trainers off' : 'Pokémon trainers on'} · ${packsOn} of ${packKeys.length} other pack${packKeys.length === 1 ? '' : 's'} on`, `<div class="adv-list">
      <button class="adv-opt${setupBaseOff ? '' : ' on'}" data-act="basetoggle" role="switch" aria-checked="${!setupBaseOff}">
        <span class="adv-switch" aria-hidden="true"><i></i></span><span class="adv-text"><b>Pokémon famous trainers</b><span class="muted small">The game's own ${BASE_FAMOUS} famous trainers: Gym Leaders, Elite Four members, Champions, rivals, professors, villains and anime characters. On by default.</span></span></button>
      <div class="pack-more"><button class="linkbtn" data-act="packlist" data-k="base" aria-expanded="${!!setupPackOpen.base}">${setupPackOpen.base ? 'Hide trainers' : `Show the ${BASE_FAMOUS} trainers`}</button> <span class="muted" aria-hidden="true">·</span> <button class="linkbtn" data-act="cfimport" data-k="base">Copy trainers to my packs</button> <span class="muted" aria-hidden="true">·</span> <button class="linkbtn" data-act="cfexport" data-k="base" aria-expanded="${cfExport === 'base'}">Export</button>${cfExport === 'base' ? exportBox('base') : ''}
        ${setupPackOpen.base ? `<div class="pack-names">${FAMOUS.filter(f => !f.pack).map(f => `<span class="tag">${f.name} · ${f.spec || 'Mixed'}${f.spec2 ? '/' + f.spec2 : ''}</span>`).join(' ')}</div>` : ''}</div>
      ${Object.entries(FAMOUS_PACKS).filter(([, p]) => !p.custom).map(([k, p]) => `<button class="adv-opt${setupPacks[k] ? ' on' : ''}" data-act="packtoggle" data-k="${k}" role="switch" aria-checked="${!!setupPacks[k]}">
        <span class="adv-switch" aria-hidden="true"><i></i></span><span class="adv-text"><b>${p.name}</b><span class="muted small">Adds ${p.trainers.length} famous trainers. ${p.desc}</span></span></button>
        <div class="pack-more"><button class="linkbtn" data-act="packlist" data-k="${k}" aria-expanded="${!!setupPackOpen[k]}">${setupPackOpen[k] ? 'Hide trainers' : `Show the ${p.trainers.length} trainers`}</button> <span class="muted" aria-hidden="true">·</span> <button class="linkbtn" data-act="cfimport" data-k="${k}">Copy trainers to my packs</button> <span class="muted" aria-hidden="true">·</span> <button class="linkbtn" data-act="cfexport" data-k="${k}" aria-expanded="${cfExport === k}">Export</button>${cfExport === k ? exportBox(k) : ''}
        ${setupPackOpen[k] ? `<div class="pack-names">${p.trainers.map(f => `<span class="tag">${f.name} · ${f.spec}${f.spec2 ? '/' + f.spec2 : ''}</span>`).join(' ')}</div>` : ''}</div>`).join('')}
    </div>`, `<div class="confirm-row"><button class="btn small" data-act="packall" data-v="${allPacks ? 0 : 1}">${allPacks ? 'Turn all packs off' : 'Turn on all packs'}</button><span class="muted small">${packsOn + (setupBaseOff ? 0 : 1)} of ${packKeys.length + 1} on · ${famousCount} famous trainers in all, counting your own packs</span></div>`)}
    ${myPacksSection()}
    ${dexSection()}
    ${regionsSection()}
    ${foldSec('images', 'Images', 'Your own Pokémon pictures and trainer portraits, kept in this browser', imgSummary(), imagesBody())}
    ${foldSec('load', 'Load a save', 'Pick up a league you exported earlier', 'Pick up a league you exported earlier', `
      <p class="muted small">Choose a save file from the menu's <b>Download save file</b>, or paste the text from <b>Export save</b>. Loading replaces the league on this device.</p>
      <div class="loadsave"><label class="btn" for="setupfile">Choose a save file</label><input id="setupfile" type="file" accept=".json,.txt,application/json,text/plain" class="sr">
        <span class="muted small" id="setupfilename">${setupLoadName ? esc(setupLoadName) : 'No file chosen'}</span></div>
      <label class="fine" for="setupload">Or paste a save:</label><textarea id="setupload" class="box" rows="4" spellcheck="false">${esc(setupLoadText)}</textarea>
      ${setupLoadErr ? `<p class="warn">${setupLoadErr}</p>` : ''}
      <div class="confirm-row"><button class="btn primary" data-act="setuploadgo">Load this save</button></div>`)}
    <div class="confirm-row"><button class="btn primary" data-act="setuppage" data-v="main">Back to setup</button></div></main>`;
}
// v176: My trainer packs — the pack editor (a setup page, reached from the My trainer packs section of Advanced options)
const cfBlank = (pack = cfPack) => ({ name: '', cls: '', g: 'm', age: 20, spec: '', spec2: '', trait: '', lead: '', second: ['', '', '', '', '', ''], pack });
let cfPack = null, cfDraft = cfBlank(null), cfEdit = null, cfErrs = [], cfMsg = '', cfDelArm = false, cfNewPackErr = '', cfNewPackName = '';
function cfRead() {
  if (!$('#cf-name')) return;
  const v = id => ($('#' + id) || {}).value || '';
  cfDraft = { name: v('cf-name'), cls: v('cf-cls'), g: v('cf-g'), age: v('cf-age'), spec: v('cf-spec'), spec2: v('cf-spec2'), trait: v('cf-trait'), lead: v('cf-lead'), second: [...document.querySelectorAll('.cf-second')].map(x => x.value), pack: v('cf-pack') || cfPack };
}
function cfFrom(f, pack) { const second = [].concat(f.team[1] || []); while (second.length < 6) second.push(''); return { name: f.name, cls: f.cls, g: f.g, age: f.age, spec: f.spec || '', spec2: f.spec2 || '', trait: f.trait || '', lead: [].concat(f.team[0]).join(' / '), second, pack }; }
function cfOpen(key) { cfPack = key; cfDraft = cfBlank(key); cfEdit = null; cfErrs = []; cfMsg = ''; cfDelArm = false; setupPage = 'custom'; }
// ---- export and import of trainer packs (v176) ----
let cfExport = null; // the pack whose export box is open: a custom pack key, a built-in key ('base', 'mk'...), or '__all'
function exportPacksFor(key) {
  if (key === '__all') return customLib;
  const c = customPack(key); if (c) return [c];
  const b = builtinSource(key); return b ? [b] : [];
}
const packFileName = key => `pokemon-league-builder-${(key === '__all' ? 'my-packs' : (exportPacksFor(key)[0] || {}).name || 'pack').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}.json`;
function exportBox(key) {
  const packs = exportPacksFor(key); if (!packs.length) return '';
  const n = packs.reduce((a, p) => a + p.trainers.length, 0);
  return `<div class="cf-export"><p class="muted small">${key === '__all' ? `All ${packs.length} of your packs` : esc(packs[0].name)}: ${n} trainer${n === 1 ? '' : 's'}. Copy the text or download it as a file, then use <b>Import trainers</b> under My trainer packs to bring it in on another device, or share it with a friend.</p>
    <textarea id="cf-exptext" class="box" rows="5" readonly spellcheck="false">${esc(packExportText(packs))}</textarea>
    <div class="confirm-row"><button class="btn small" data-act="cfexpcopy">Copy text</button>${canSaveFile() ? `<button class="btn small" data-act="cfexpfile" data-k="${esc(key)}">Download file</button>` : ''}<button class="btn small" data-act="cfexpclose">Close</button></div></div>`;
}
async function downloadText(filename, data) {
  if (downloadsNs) {
    try { await downloadsNs.save({ filename, data }); toast('File downloaded.'); }
    catch (e) { const c = e && e.code; if (c === 'declined') return; toast(c === 'rate_limited' ? 'A download is already waiting for your answer.' : "Couldn't download here. Use Copy text instead."); }
    return;
  }
  try { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([data], { type: 'application/json' })); a.download = filename; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); toast('File downloaded.'); }
  catch (e) { toast("Couldn't download here. Use Copy text instead."); }
}
// the import page: pick a source, tick the trainers to bring in, pick where they go
let cfImp = null;
const cfImpBlank = (src = 'text') => ({ src, text: '', fileName: '', err: '', groups: null, sel: new Set(), q: '', dest: '__new', newName: '' });
function cfImpLoad() {
  const I = cfImp; I.err = ''; I.groups = null; I.sel = new Set(); I.q = '';
  let packs;
  if (I.src === 'text') { if (!I.text.trim()) { I.err = 'Choose a file or paste a pack first.'; return; } const r = parsePackText(I.text); if (r.err) { I.err = r.err; return; } packs = r.packs; }
  else { const b = builtinSource(I.src); if (!b) return; packs = [b]; }
  I.groups = packs.map(p => ({ name: p.name, rows: prepImport(p.trainers) }));
  // a built-in pack starts with nothing ticked, so it's easy to pick a few; a file starts with everything ticked
  if (I.src === 'text') I.groups.forEach((g, gi) => g.rows.forEach((r, i) => { if (r.entry) I.sel.add(gi + ':' + i); }));
  I.dest = I.groups.length > 1 ? '__each' : '__new';
  I.newName = uniquePackName(I.src === 'text' ? I.groups[0].name : (customLib.length ? 'My picks' : 'My Trainers'));
}
const cfImpMatch = (r, q) => !q || [r.raw.name, r.raw.cls, r.raw.spec, r.raw.spec2].filter(Boolean).join(' ').toLowerCase().includes(q.toLowerCase());
function cfImpList() {
  const I = cfImp; if (!I || !I.groups) return '';
  const teamTxt = t => { const tm = Array.isArray(t.team) ? t.team : []; return [tm[0], tm[1]].filter(x => x != null).map(x => [].concat(x).join(' / ')).join(' + '); };
  const out = I.groups.map((g, gi) => {
    const rows = g.rows.map((r, i) => [r, i]).filter(([r]) => cfImpMatch(r, I.q));
    if (!rows.length) return '';
    return `${I.groups.length > 1 ? `<div class="eyebrow cf-imp-h">${esc(g.name)} · ${g.rows.length}</div>` : ''}${rows.map(([r, i]) => { const k = gi + ':' + i, t = r.raw;
      return `<label class="cf-imp-row${r.entry ? '' : ' off'}"><input type="checkbox" class="cf-imp-chk" data-k="${k}"${I.sel.has(k) ? ' checked' : ''}${r.entry ? '' : ' disabled'}>
        <span class="cf-info"><b>${esc(t.cls || '')} ${esc(t.name || '(no name)')}</b> ${TYPES.includes(t.spec) ? chips([t.spec, t.spec2].filter(x => TYPES.includes(x))) : chip(null)}
        <span class="muted small cf-imp-team">${esc(teamTxt(t))}</span>${r.entry ? '' : `<span class="warn small">${esc(r.errs[0])}</span>`}</span></label>`; }).join('')}`;
  }).join('');
  return out || '<p class="muted">No trainers match that search.</p>';
}
const cfImpCount = () => cfImp && cfImp.groups ? cfImp.sel.size : 0;
const cfImpGoLabel = () => { const n = cfImpCount(); return n ? `Import ${n} trainer${n === 1 ? '' : 's'}` : 'Tick the trainers to import'; };
function viewImport() {
  if (!cfImp) cfImp = cfImpBlank();
  const I = cfImp, srcs = [['text', 'A file or pasted text'], ...BUILTIN_SOURCES().map(([k, n]) => [k, `Built-in: ${n}`])];
  const total = I.groups ? I.groups.reduce((a, g) => a + g.rows.length, 0) : 0, ok = I.groups ? I.groups.reduce((a, g) => a + g.rows.filter(r => r.entry).length, 0) : 0;
  const destOpts = [...(I.groups && I.groups.length > 1 ? [['__each', "Keep the file's packs: one new pack each"]] : []), ['__new', 'A new pack'], ...customLib.map(p => [p.key, `Add to ${p.name} (${p.trainers.length})`])];
  return `<main class="wrap setup">
    <section class="panel callout"><div class="eyebrow">My trainer packs</div><h1>Import trainers</h1>
      <p>Bring in a pack someone exported, or a backup of your own. You can also copy trainers from the game's built-in packs into your own, then change their titles, types or teams.</p>
      <div class="confirm-row"><button class="btn" data-act="setuppage" data-v="advanced">Back to Advanced options</button></div></section>
    <section class="panel"><div class="ph"><h2>1. Where from</h2></div>
      <div class="cf-grid"><label class="cf-field wide"><span class="eyebrow">Source</span><select id="cfimpsrc">${srcs.map(([v, l]) => `<option value="${esc(v)}"${v === I.src ? ' selected' : ''}>${esc(l)}</option>`).join('')}</select></label></div>
      ${I.src === 'text' ? `<div class="loadsave"><label class="btn" for="cfimpfile">Choose a pack file</label><input id="cfimpfile" type="file" accept=".json,.txt,application/json,text/plain" class="sr">
          <span class="muted small">${I.fileName ? esc(I.fileName) : 'No file chosen'}</span></div>
        <label class="fine" for="cfimptext">Or paste a pack:</label><textarea id="cfimptext" class="box" rows="4" spellcheck="false">${esc(I.text)}</textarea>
        <div class="confirm-row"><button class="btn primary" data-act="cfimpread">Read the trainers</button></div>` : ''}
      ${I.err ? `<p class="warn">${esc(I.err)}</p>` : ''}
    </section>
    ${I.groups ? `<section class="panel"><div class="ph"><h2>2. Pick trainers</h2><span class="muted">${ok} of ${total} can be imported</span></div>
      <div class="cf-imp-tools"><div class="search"><span class="search-ic" aria-hidden="true">⌕</span><input id="cfimpq" type="search" placeholder="Search by name, title or type" value="${esc(I.q)}" autocomplete="off" aria-label="Search trainers"></div>
        <button class="btn small" data-act="cfimpall" data-v="1">Tick all shown</button><button class="btn small" data-act="cfimpall" data-v="0">Untick all shown</button></div>
      <div id="cfimplist" class="cf-imp-list">${cfImpList()}</div>
    </section>
    <section class="panel"><div class="ph"><h2>3. Where to</h2></div>
      <div class="cf-grid"><label class="cf-field wide"><span class="eyebrow">Put them in</span><select id="cfimpdest">${destOpts.map(([v, l]) => `<option value="${esc(v)}"${v === I.dest ? ' selected' : ''}>${esc(l)}</option>`).join('')}</select></label>
        ${I.dest === '__new' ? `<label class="cf-field wide"><span class="eyebrow">New pack name</span><input id="cfimpname" class="cf-in" maxlength="40" value="${esc(I.newName)}" autocomplete="off"></label>` : ''}</div>
      <p class="muted small">Trainers you import are yours to edit, like any you made. A trainer can share a name with a trainer in another pack (yours or the game's built-in ones); if both packs are on, only one of them appears in a league. A name already in the pack you import into is left out.</p>
      <div class="confirm-row"><button class="btn primary" id="cfimpgo" data-act="cfimpgo">${cfImpGoLabel()}</button></div>
    </section>` : ''}</main>`;
}
// put the ticked trainers in; packs are capped, so a big import spills into "Name (2)"
function cfImpCommit() {
  const I = cfImp; if (!I || !I.groups) return;
  const nm = $('#cfimpname'); if (nm) I.newName = nm.value;
  const picked = I.groups.map((g, gi) => ({ name: g.name, entries: g.rows.map((r, i) => [r, i]).filter(([r, i]) => r.entry && I.sel.has(gi + ':' + i)).map(([r]) => r.entry) })).filter(g => g.entries.length);
  if (!picked.length) { toast('Tick at least one trainer first.'); return; }
  const list = customLib.map(p => ({ ...p, trainers: p.trainers.slice() })), made = [];
  const newPack = name => { if (list.length >= CUSTOM_PACKS_MAX) return null; let key; do key = newCustomKey(); while (list.some(p => p.key === key)); const p = { key, name: uniquePackName(name, list), trainers: [] }; list.push(p); made.push(p); return p; };
  // (0.48.0) a name already in the pack it goes to is skipped (other packs may share it)
  let dupes = 0;
  const has = (p, e) => list.some(x => (x === p || x.name.replace(/ \(\d+\)$/, '') === p.name.replace(/ \(\d+\)$/, '')) && x.trainers.some(f => f.name.toLowerCase() === e.name.toLowerCase()));
  const fill = (pack, entries) => { let p = pack, n = 0; for (const e of entries) { if (!p) break; if (has(p, e)) { dupes++; continue; } if (p.trainers.length >= CUSTOM_MAX) p = newPack(p.name); if (!p) break; p.trainers.push(e); n++; } return n; };
  let added = 0, firstKey = null;
  if (I.dest === '__each') for (const g of picked) { const p = newPack(g.name); if (!firstKey && p) firstKey = p.key; added += fill(p, g.entries); }
  else {
    const all = picked.flatMap(g => g.entries);
    let p = I.dest === '__new' ? newPack(checkPackName(I.newName).name || I.newName || picked[0].name) : list.find(x => x.key === I.dest);
    firstKey = p && p.key; added += fill(p, all);
  }
  const wanted = picked.reduce((a, g) => a + g.entries.length, 0) - dupes;
  const ok = setCustomLib(list);
  for (const p of made) setupPacks[p.key] = true;
  cfImp = null;
  const msg = `Imported ${added} trainer${added === 1 ? '' : 's'}${made.length > 1 ? ` into ${made.length} new packs` : ''}.${dupes ? ` ${dupes} ${dupes === 1 ? 'was' : 'were'} already in that pack and left out.` : ''}${added < wanted ? ` ${wanted - added} didn't fit: you can keep up to ${CUSTOM_PACKS_MAX} packs of ${CUSTOM_MAX} trainers.` : ''}${made.length ? ' New packs are switched on.' : ''}${ok ? '' : " This browser couldn't store them, so they'll be gone when the page closes."}`;
  if (firstKey && made.length <= 1) { cfOpen(firstKey); cfMsg = msg; } else { setupPage = 'advanced'; toast(msg); }
}
// the My trainer packs section of Advanced options
function myPacksSection() {
  const packs = customLib, on = packs.filter(p => setupPacks[p.key]).length;
  const body = `<p class="muted small">Make your own packs of famous trainers. Switch a pack on and its trainers turn up like any other famous trainer: as newcomers, as Gym Leaders, Elite Four members and Champions, and in all-famous leagues. Saved in this browser; each new league keeps its own copy.</p>
    ${packs.length ? `<div class="adv-list">${packs.map(p => `<button class="adv-opt${setupPacks[p.key] ? ' on' : ''}" data-act="packtoggle" data-k="${esc(p.key)}" role="switch" aria-checked="${!!setupPacks[p.key]}">
        <span class="adv-switch" aria-hidden="true"><i></i></span><span class="adv-text"><b>${esc(p.name)}</b><span class="muted small">${p.trainers.length ? `${p.trainers.length} trainer${p.trainers.length === 1 ? '' : 's'}` : 'No trainers yet'}</span></span></button>
        <div class="pack-more"><button class="linkbtn" data-act="cfopen" data-k="${esc(p.key)}">${p.trainers.length ? 'Edit this pack' : 'Add trainers'}</button>${p.trainers.length ? ` <span class="muted" aria-hidden="true">·</span> <button class="linkbtn" data-act="cfexport" data-k="${esc(p.key)}" aria-expanded="${cfExport === p.key}">Export</button>` : ''}${cfExport === p.key ? exportBox(p.key) : ''}</div>`).join('')}</div>` : '<p class="muted">No packs yet.</p>'}
    <div class="confirm-row"><button class="btn" data-act="cfimport">Import trainers</button>${packs.some(p => p.trainers.length) && packs.length > 1 ? `<button class="btn" data-act="cfexport" data-k="__all" aria-expanded="${cfExport === '__all'}">Export all my packs</button>` : ''}</div>
    ${cfExport === '__all' ? exportBox('__all') : ''}
    <div class="cf-newpack"><label class="cf-field"><span class="eyebrow">New pack</span><input id="cf-newpack" class="cf-in" maxlength="40" placeholder="e.g. Mario &amp; Donkey Kong" value="${esc(cfNewPackName)}" autocomplete="off"></label><button class="btn" data-act="cfnewpack">Create pack</button></div>
    ${cfNewPackErr ? `<p class="warn">${esc(cfNewPackErr)}</p>` : ''}`;
  return foldSec('mypacks', 'My trainer packs', 'Famous trainers you make yourself', packs.length ? `${packs.length} pack${packs.length === 1 ? '' : 's'} · ${on} on` : 'No packs yet', body);
}
function viewCustom() {
  ensureCustom();
  const pack = customPack(cfPack);
  if (!pack) { setupPage = 'advanced'; return viewAdvanced(); }
  const d = cfDraft, sps = customSpecies(), list = pack.trainers;
  const sel = (id, cur, opts) => `<select id="${id}">${opts.map(([v, l]) => `<option value="${esc(v)}"${String(v) === String(cur) ? ' selected' : ''}>${esc(l)}</option>`).join('')}</select>`;
  const field = (label, html, cls = '') => `<label class="cf-field ${cls}"><span class="eyebrow">${label}</span>${html}</label>`;
  const inp = (id, v, extra = '') => `<input id="${id}" class="cf-in" value="${esc(v)}" autocomplete="off" ${extra}>`;
  const tys = none => [['', none], ...TYPES.map(t => [t, t])];
  const teamTxt = f => f.team.map(x => [].concat(x).join(' / ')).join(' + ');
  const editing = cfEdit != null && list[cfEdit];
  return `<main class="wrap setup">
    <section class="panel callout"><div class="eyebrow">My trainer packs</div><h1>${esc(pack.name)}</h1>
      <p class="muted small">Saved in this browser. Each new league keeps its own copy, so changes here don't affect a league you've already started.</p>
      <div class="cf-newpack">${field('Pack name', inp('cf-packname', pack.name, 'maxlength="40"'))}<button class="btn" data-act="cfrename">Rename</button>
        <button class="adv-opt mini${setupPacks[pack.key] ? ' on' : ''}" data-act="packtoggle" data-k="${esc(pack.key)}" role="switch" aria-checked="${!!setupPacks[pack.key]}"><span class="adv-switch" aria-hidden="true"><i></i></span><span class="adv-text"><b>${setupPacks[pack.key] ? 'Pack on' : 'Pack off'}</b></span></button></div>
      ${cfDelArm ? `<div class="cf-confirm"><b>Delete ${esc(pack.name)}${list.length ? ` and its ${list.length} trainer${list.length === 1 ? '' : 's'}` : ''}?</b> This can't be undone. <div class="confirm-row"><button class="btn danger" data-act="cfdelpackyes">Yes, delete it</button><button class="btn" data-act="cfdelpackno">Keep it</button></div></div>`
        : `<div class="confirm-row"><button class="btn" data-act="setuppage" data-v="advanced">Back to Advanced options</button>${list.length ? `<button class="btn small" data-act="cfexport" data-k="${esc(pack.key)}" aria-expanded="${cfExport === pack.key}">Export pack</button>` : ''}<button class="btn small danger" data-act="cfdelpack">Delete pack</button></div>${cfExport === pack.key ? exportBox(pack.key) : ''}`}</section>
    <section class="panel" id="cf-form"><div class="ph"><h2>${editing ? 'Edit ' + esc(editing.cls + ' ' + editing.name) : 'New trainer'}</h2><span class="muted">Shown in the game as title + name, like Kanto Leader Misty</span></div>
      <div class="cf-grid">
        ${field('Name', inp('cf-name', d.name, 'maxlength="30" placeholder="e.g. Mario"'))}
        ${field('Title', inp('cf-cls', d.cls, 'maxlength="30" placeholder="e.g. Plumber Hero"'))}
        ${field('Gender', sel('cf-g', d.g, [['m', 'Male'], ['f', 'Female'], ['n', 'Neither']]))}
        ${field('Age', `<input id="cf-age" class="cf-in" type="number" min="0" max="90" value="${esc(d.age)}">`)}
        ${field('Main type', sel('cf-spec', d.spec, tys('None (mixed team)')))}
        ${field('Second type', sel('cf-spec2', d.spec2, tys('None')))}
        ${field('Trait', sel('cf-trait', d.trait, [['', 'Random'], ...Object.entries(TRAITS).map(([k, t]) => [k, t.name])]))}
        ${customLib.length > 1 ? field('Pack', sel('cf-pack', d.pack || pack.key, customLib.map(p => [p.key, p.name]))) : ''}
      </div>
      ${d.trait && TRAITS[d.trait] ? `<p class="muted small">${TRAITS[d.trait].name}: ${TRAITS[d.trait].text}</p>` : ''}
      <div class="cf-grid">${field('Lead Pokémon', inp('cf-lead', d.lead, 'list="cf-species" placeholder="Start typing a Pokémon" aria-describedby="cf-leadhint"'), 'wide')}</div>
      <div class="eyebrow">Second Pokémon options</div>
      <p class="muted small" id="cf-leadhint">To give the lead a few options, separate them with a slash: Pikachu / Pichu.</p>
      <p class="muted small">One of these is picked each time they debut. Fill in up to 6, or leave them empty to start with just the lead.</p>
      <div class="cf-grid six">${d.second.map((v, i) => `<input class="cf-in cf-second" value="${esc(v)}" list="cf-species" autocomplete="off" aria-label="Second Pokémon option ${i + 1}">`).join('')}</div>
      <p class="muted small">Like the built-in famous trainers, they start with two Pokémon and build the rest of their team as they go. Each Pokémon takes the form it would have at the level of its trainer's next battle. Legendaries, mythicals, Paradox Pokémon and Ultra Beasts aren't allowed, and each Pokémon must come from a different evolution line.</p>
      ${cfErrs.length ? `<ul class="warn cf-errs">${cfErrs.map(e => `<li>${esc(e)}</li>`).join('')}</ul>` : ''}
      ${cfMsg ? `<p class="cf-msg">${esc(cfMsg)}</p>` : ''}
      <div class="confirm-row"><button class="btn primary" data-act="cfsave">${editing ? 'Save changes' : 'Add trainer'}</button><button class="btn" data-act="cfclear">${editing ? 'Cancel editing' : 'Clear form'}</button></div>
      <datalist id="cf-species">${sps.map(n => `<option value="${esc(n)}">`).join('')}</datalist>
    </section>
    <section class="panel"><div class="ph"><h2>Trainers in this pack</h2><span class="muted">${list.length} of ${CUSTOM_MAX}</span></div>
      ${list.length ? `<div class="cf-list">${list.map((f, i) => `<div class="cf-row${i === cfEdit ? ' on' : ''}"><div class="cf-info"><b>${esc(f.cls)} ${esc(f.name)}</b> ${f.spec ? chips([f.spec, f.spec2].filter(Boolean)) : chip(null)}${f.trait && TRAITS[f.trait] ? ` <span class="tag">${TRAITS[f.trait].name}</span>` : ''}
        <div class="muted small">Age ${esc(f.age)} · ${esc(teamTxt(f))}</div></div>
        <div class="cf-acts"><button class="btn small" data-act="cfedit" data-v="${i}">Edit</button><button class="btn small danger" data-act="cfdel" data-v="${i}" aria-label="Delete ${esc(f.cls + ' ' + f.name)}">Delete</button></div></div>`).join('')}</div>` : '<p class="muted">No trainers in this pack yet. Fill in the form above to add the first one.</p>'}
    </section>
    <div class="confirm-row"><button class="btn primary" data-act="setuppage" data-v="advanced">Back to Advanced options</button></div></main>`;
}
// v185: the My Pokédex section of Advanced options, and its editor page
let dxMode = null, dxDraft = null, dxWas = null, dxErrs = [], dxMsg = '', dxPickErr = '', dxPickText = '', dxExport = false, dxImpText = '', dxImpOpen = false, dxImpMsg = '', dxClearArm = false;
function dxBlank(isNew) { return { name: '', types: ['Normal', ''], stats: [50, 50, 50, 50, 50, 50], ab: ['', '', ''], from: '', lvl: 30, rare: false, starter: false, legend: false, isNew }; }
// start changing a game species: your saved change if there is one, else the game's own numbers
function dxLoad(n) {
  dexSnapshot();
  const e = dexLib.edits[n], b = DEX_BASE[n], A = b.ab || {};
  dxDraft = e ? { name: n, types: [e.types[0], e.types[1] || ''], stats: e.stats.slice(), ab: e.ab.slice(), isNew: false }
    : { name: n, types: [b.types[0], b.types[1] || ''], stats: dexBaseStats(n), ab: [A[0] || '', A[1] || '', A.H || ''], isNew: false };
  dxMode = 'edit'; dxWas = null; dxErrs = []; dxMsg = '';
}
// (0.45.0) a new Pokémon's egg groups for breeding: none chosen takes one from its main type
function eggFields(pre, egg, field) {
  const e = egg || [], opts = (cur, none) => `<option value="">${none}</option>` + EGG_KEYS.map(k => `<option value="${k}"${cur === k ? ' selected' : ''}>${esc(EGG_NAMES[k])}</option>`).join('');
  return field('Egg group', `<select id="${pre}-egg0">${opts(e[0], 'From its type')}</select>`) + field('Second egg group', `<select id="${pre}-egg1">${opts(e[1], 'None')}</select>`);
}
const eggRead = pre => [(($('#' + pre + '-egg0') || {}).value || ''), (($('#' + pre + '-egg1') || {}).value || '')].filter(Boolean);
function dxRead() {
  if (!dxDraft || !$('#dx-t1')) return;
  const v = id => ($('#' + id) || {}).value || '';
  if (dxDraft.isNew) { dxDraft.name = v('dx-name'); dxDraft.from = v('dx-from').trim(); dxDraft.lvl = Math.round(Number(v('dx-lvl'))); dxDraft.rare = !!($('#dx-rare') || {}).checked; dxDraft.starter = !!($('#dx-starter') || {}).checked; dxDraft.legend = !!($('#dx-legend') || {}).checked; dxDraft.egg = eggRead('dx'); }
  dxDraft.types = [v('dx-t1'), v('dx-t2')];
  dxDraft.stats = [0, 1, 2, 3, 4, 5].map(i => { const x = v('dx-st' + i).trim(); return x === '' ? NaN : Number(x); });
  dxDraft.ab = [0, 1, 2].map(i => v('dx-ab' + i));
}
const dxBst = st => st.reduce((a, x) => a + (Number.isFinite(x) ? x : 0), 0);
// v185: a live note under the stats: legendary-level totals on a Pokémon that isn't a legendary, or a legendary encounter that's too weak
function dxWarnText(d, bst) {
  if (!d) return '';
  const legendSp = !d.isNew && SP[d.name] && (SP[d.name].legend || DEX_BASE[d.name] && LEGENDS.includes(d.name));
  if (d.isNew && d.legend) return bst > DEX_LEGEND_BST ? '' : `Legendary encounters need a base stat total over ${DEX_LEGEND_BST}. This one's is ${bst}.`;
  if (bst <= DEX_LEGEND_BST || legendSp) return '';
  return d.isNew ? `A total of ${bst} is box-legendary strength. Unmarked, this Pokémon ${d.from ? 'is reached by evolving, like any other,' : 'is caught in the wild like any other'} and could unbalance the league.${d.from ? '' : ' Tick Legendary encounter to make it a very rare legendary instead.'}`
    : `A total of ${bst} is box-legendary strength for a Pokémon that's caught in the wild or by evolving. It could unbalance the league.`;
}
// an evolution can't be a legendary, and a legendary is never rare-in-the-wild or a starter
function dxSyncChecks() {
  const from = !!(($('#dx-from') || {}).value || '').trim(), lg = $('#dx-legend');
  const set = (k, off) => { const c = $('#' + k); if (c) { c.disabled = off; c.closest('label').classList.toggle('off', off); } };
  set('dx-legend', from); const legend = !!(lg && lg.checked && !from);
  set('dx-rare', from || legend); set('dx-starter', from || legend);
  dxSyncWarn();
}
function dxSyncWarn() {
  const w = $('#dx-warn'); if (!w || !dxDraft) return;
  const lg = $('#dx-legend'), from = $('#dx-from');
  const d = Object.assign({}, dxDraft, { legend: !!(lg && lg.checked), from: from ? from.value.trim() : dxDraft.from });
  const t = dxWarnText(d, dxBst([0, 1, 2, 3, 4, 5].map(i => Number((($('#dx-st' + i) || {}).value) || 0))));
  w.textContent = t; w.hidden = !t;
}
const dxStatLine = st => st.map((x, i) => `${DEX_STAT_SHORT[i]} ${x}`).join(' · ');
function dxSave() {
  dxRead();
  const d = dxDraft, isNew = d.isNew;
  const e = dexNorm({ name: d.name, types: d.types, stats: d.stats, ab: d.ab, from: isNew ? d.from : '', lvl: d.lvl, rare: isNew && !d.from && d.rare, starter: isNew && !d.from && d.starter, legend: isNew && d.legend, egg: isNew ? d.egg : null });
  dxErrs = checkDexEntry(e, isNew, dxWas);
  if (dxErrs.length) return;
  if (isNew) {
    if (dxWas) {
      lib: { const i = dexLib.added.findIndex(x => x.name === dxWas); if (i < 0) break lib; dexLib.added[i] = e;
        // anything that evolved from the old name follows the rename
        if (dxWas !== e.name) for (const x of dexLib.added) if (x.from === dxWas) x.from = e.name; }
    } else dexLib.added.push(e);
    dxMsg = (dxWas ? `Saved ${e.name}.` : `Added ${e.name}.`) + (e.legend ? ' It will only turn up as a very rare legendary encounter.' : '');
  } else {
    // a change that leaves it exactly as the game has it is no change at all
    const b = DEX_BASE[e.name], A = b.ab || {}, same = e.types.join('/') === b.types.join('/') && e.stats.join() === dexBaseStats(e.name).join() && e.ab.join('|') === [A[0] || '', A[1] || '', A.H || ''].join('|');
    if (same) delete dexLib.edits[e.name]; else dexLib.edits[e.name] = dexStrip(e);
    dxMsg = same ? `${e.name} is back to the game's own.` : `Saved your changes to ${e.name}.`;
  }
  { const warn = dxWarnText(Object.assign({}, d, { legend: !!e.legend, from: e.from || '' }), dxBst(e.stats)); if (warn) dxMsg += ' Warning: ' + warn; }
  // making a change switches the Pokédex on for the next league, like a new pack
  dexLib.on = true;
  if (!saveDexLib()) dxMsg += " This browser couldn't store it, so it'll be gone when the page closes.";
  dxMode = null; dxDraft = null; dxWas = null;
}
function dxDeleteNew(n) {
  const kids = dexLib.added.filter(x => x.from === n).map(x => x.name);
  if (kids.length) { dxMsg = `${kids.join(' and ')} ${kids.length === 1 ? 'evolves' : 'evolve'} from ${n}. Delete ${kids.length === 1 ? 'it' : 'them'} or change what ${kids.length === 1 ? 'it evolves' : 'they evolve'} from first.`; return; }
  dexLib.added = dexLib.added.filter(x => x.name !== n); saveDexLib();
  if (dxWas === n) { dxMode = null; dxDraft = null; dxWas = null; }
  dxMsg = `Deleted ${n}.`;
}
function dexSection() {
  const n = dexCount(dexLib), ne = Object.keys(dexLib.edits).length, nn = dexLib.added.length;
  const body = `<p class="muted small">Change any Pokémon's types, base stats and abilities, or add Pokémon of your own. Saved in this browser. A new league takes a copy of your Pokédex when it's created and keeps it for good, so later changes here never touch a league that's already running.</p>
    <div class="adv-list"><button class="adv-opt${dexLib.on ? ' on' : ''}" data-act="dextoggle" role="switch" aria-checked="${dexLib.on}">
      <span class="adv-switch" aria-hidden="true"><i></i></span><span class="adv-text"><b>Use my Pokédex in the new league</b><span class="muted small">${n ? `${ne} Pokémon changed, ${nn} new Pokémon.` : 'No changes yet: the league uses the game\'s own Pokédex.'}</span></span></button></div>
    <div class="confirm-row"><button class="btn" data-act="setuppage" data-v="dex">${n ? 'Edit my Pokédex' : 'Open the Pokédex editor'}</button></div>`;
  return foldSec('dex', 'My Pokédex', 'Change Pokémon or add your own', n ? `${ne} changed · ${nn} new · ${dexLib.on ? 'on' : 'off'}` : 'No changes yet', body);
}
function viewDexEditor() {
  dexSnapshot();
  const field = (label, html, cls = '') => `<label class="cf-field ${cls}"><span class="eyebrow">${label}</span>${html}</label>`;
  const sel = (id, cur, opts) => `<select id="${id}">${opts.map(([v, l]) => `<option value="${esc(v)}"${String(v) === String(cur) ? ' selected' : ''}>${esc(l)}</option>`).join('')}</select>`;
  const abs = dexAbilities();
  const abOpts = (cur, none) => [['', none]].concat(abs.map(a => [a, a])).concat(cur && !ABILITIES[cur] ? [[cur, cur + ' (not in battles yet)']] : []);
  const editable = Object.keys(DEX_BASE).filter(dexEditable).sort();
  const parents = editable.filter(dexParentOk).concat(dexLib.added.map(x => x.name)).filter(x => !dxDraft || x !== dxWas).sort();
  let form = '';
  if (dxDraft) {
    const d = dxDraft, b = !d.isNew && DEX_BASE[d.name], A = b ? b.ab || {} : null;
    const own = b ? `<p class="muted small">The game's own: ${chips(b.types)} ${dxStatLine(dexBaseStats(d.name))} (total ${dexBaseStats(d.name).reduce((a, x) => a + x, 0)}) · ${[A[0], A[1], A.H && A.H + ' (hidden)'].filter(Boolean).join(', ') || 'no abilities'}</p>` : '';
    form = `<section class="panel" id="dx-form"><div class="ph"><h2>${d.isNew ? (dxWas ? 'Edit ' + esc(dxWas) : 'New Pokémon') : 'Change ' + esc(d.name)}</h2><span class="muted">${d.isNew ? 'A Pokémon of your own' : 'Types, base stats and abilities'}</span></div>
      ${own}
      <div class="cf-grid">
        ${d.isNew ? field('Name', `<input id="dx-name" class="cf-in" maxlength="${DEX_NAME_MAX}" value="${esc(d.name)}" placeholder="e.g. Pyroclaw" autocomplete="off">`) : ''}
        ${field('Main type', sel('dx-t1', d.types[0], TYPES.map(t => [t, t])))}
        ${field('Second type', sel('dx-t2', d.types[1] || '', [['', 'None']].concat(TYPES.map(t => [t, t]))))}
      </div>
      <div class="eyebrow">Base stats <span class="muted" id="dx-bst">· total ${dxBst(d.stats)}</span></div>
      <div class="cf-grid six">${d.stats.map((x, i) => field(DEX_STAT_LABEL[i], `<input id="dx-st${i}" class="cf-in dx-stat" type="number" min="1" max="255" step="1" inputmode="numeric" value="${Number.isFinite(x) ? x : ''}">`)).join('')}</div>
      <p class="muted small">Each stat is 1–255. The total is its overall strength: most fully evolved Pokémon are 450–540, pseudo-legendaries 600 and the strongest legendaries 680.</p>
      <p class="warn" id="dx-warn" role="status"${dxWarnText(d, dxBst(d.stats)) ? '' : ' hidden'}>${esc(dxWarnText(d, dxBst(d.stats)))}</p>
      <div class="cf-grid">
        ${field('Ability', sel('dx-ab0', d.ab[0], abOpts(d.ab[0], 'Choose…')))}
        ${field('Second ability', sel('dx-ab1', d.ab[1], abOpts(d.ab[1], 'None')))}
        ${field('Hidden ability', sel('dx-ab2', d.ab[2], abOpts(d.ab[2], 'None')))}
      </div>
      <p class="muted small">Only abilities that work in battles can be chosen. Each Pokémon of this species gets one of its regular abilities, or now and then its hidden one.</p>
      ${d.isNew ? `<div class="cf-grid">
        ${field('Evolves from', `<input id="dx-from" class="cf-in" list="dx-parents" value="${esc(d.from || '')}" placeholder="Nothing: it's found in the wild" autocomplete="off">`, 'wide')}
        ${field('At level', `<input id="dx-lvl" class="cf-in" type="number" min="2" max="100" step="1" inputmode="numeric" value="${esc(d.lvl)}">`)}
        ${eggFields('dx', d.egg, field)}
      </div>
      <p class="muted small">Leave "Evolves from" empty for a first-stage Pokémon: it's caught in the wild like any other, and anything you add can evolve from it. Something that evolves from a game Pokémon becomes another branch of that line, picked like Eevee's.</p>
      <div class="adv-list">
        <label class="cf-imp-row${d.from ? ' off' : ''}"><input id="dx-legend" type="checkbox"${d.legend ? ' checked' : ''}${d.from ? ' disabled' : ''}><span><b>Legendary encounter</b><span class="muted small cf-imp-team">Very rare: it can take a hundred years or more to first appear. It's never found in the wild. It only appears as a legendary encounter that challengers battle for, like Regigigas or Darkrai. Only for a base stat total over ${DEX_LEGEND_BST}. Nothing can evolve from it, and one trainer holds it at a time, as a partner for a few seasons.</span></span></label>
        <label class="cf-imp-row${d.from || d.legend ? ' off' : ''}"><input id="dx-rare" type="checkbox"${d.rare && !d.legend ? ' checked' : ''}${d.from || d.legend ? ' disabled' : ''}><span><b>Rare in the wild</b><span class="muted small cf-imp-team">Turns up as seldom as Dratini or Larvitar.</span></span></label>
        <label class="cf-imp-row${d.from || d.legend ? ' off' : ''}"><input id="dx-starter" type="checkbox"${d.starter && !d.legend ? ' checked' : ''}${d.from || d.legend ? ' disabled' : ''}><span><b>Starter</b><span class="muted small cf-imp-team">New trainers can start with it, like Bulbasaur or Charmander.</span></span></label>
      </div><datalist id="dx-parents">${parents.map(n => `<option value="${esc(n)}">`).join('')}</datalist>` : ''}
      ${dxErrs.length ? `<ul class="warn cf-errs">${dxErrs.map(e => `<li>${esc(e)}</li>`).join('')}</ul>` : ''}
      <div class="confirm-row"><button class="btn primary" data-act="dxsave">${d.isNew && !dxWas ? 'Add Pokémon' : 'Save changes'}</button>
        ${!d.isNew && dexLib.edits[d.name] ? `<button class="btn" data-act="dxreset" data-k="${esc(d.name)}">Back to the game's own</button>` : ''}
        <button class="btn" data-act="dxcancel">Cancel</button></div>
    </section>`;
  }
  const edits = Object.keys(dexLib.edits).sort(), added = dexLib.added;
  const editRow = n => { const e = dexLib.edits[n], b = DEX_BASE[n], was = dexBaseStats(n).reduce((a, x) => a + x, 0), now = e.stats.reduce((a, x) => a + x, 0);
    return `<div class="cf-row${dxDraft && !dxDraft.isNew && dxDraft.name === n ? ' on' : ''}"><div class="cf-info"><b>${esc(n)}</b> ${chips(e.types)}${e.types.join('/') !== b.types.join('/') ? ` <span class="muted small">was ${b.types.join('/')}</span>` : ''}
      <div class="muted small">${dxStatLine(e.stats)} · total ${now}${now !== was ? ` (was ${was})` : ''}</div><div class="muted small">${[e.ab[0], e.ab[1]].filter(Boolean).map(esc).join(', ')}${e.ab[2] ? ' · hidden: ' + esc(e.ab[2]) : ''}</div></div>
      <div class="cf-acts"><button class="btn small" data-act="dxedit" data-k="${esc(n)}">Edit</button><button class="btn small danger" data-act="dxreset" data-k="${esc(n)}" aria-label="Put ${esc(n)} back to the game's own">Reset</button></div></div>`; };
  const newRow = e => `<div class="cf-row${dxWas === e.name ? ' on' : ''}"><div class="cf-info"><b>${esc(e.name)}</b> ${chips(e.types)} <span class="tag gold">New</span>${e.legend ? ' <span class="tag legend">Legendary encounter</span>' : ''}${e.starter && !e.from ? ' <span class="tag">Starter</span>' : ''}${e.rare && !e.from ? ' <span class="tag">Rare</span>' : ''}
      <div class="muted small">${dxStatLine(e.stats)} · total ${e.stats.reduce((a, x) => a + x, 0)}</div>
      <div class="muted small">${e.from ? `Evolves from ${esc(e.from)} at Lv ${e.lvl}` : e.legend ? 'Very rare legendary encounter' : 'Found in the wild'}${added.some(x => x.from === e.name) ? ` · evolves into ${added.filter(x => x.from === e.name).map(x => `${esc(x.name)} (Lv ${x.lvl})`).join(', ')}` : ''} · ${[e.ab[0], e.ab[1]].filter(Boolean).map(esc).join(', ')}${e.ab[2] ? ' · hidden: ' + esc(e.ab[2]) : ''}</div></div>
      <div class="cf-acts"><button class="btn small" data-act="dxeditnew" data-k="${esc(e.name)}">Edit</button><button class="btn small danger" data-act="dxdelnew" data-k="${esc(e.name)}" aria-label="Delete ${esc(e.name)}">Delete</button></div></div>`;
  return `<main class="wrap setup">
    <section class="panel callout"><div class="eyebrow">Advanced options</div><h1>My Pokédex</h1>
      <p class="muted small">Saved in this browser. A new league takes a copy when it's created and keeps it, so changes here never reach a league that's already running.</p>
      <div class="cf-newpack"><button class="adv-opt mini${dexLib.on ? ' on' : ''}" data-act="dextoggle" role="switch" aria-checked="${dexLib.on}"><span class="adv-switch" aria-hidden="true"><i></i></span><span class="adv-text"><b>${dexLib.on ? 'Used in the new league' : 'Not used in the new league'}</b></span></button></div>
      <div class="confirm-row"><button class="btn" data-act="setuppage" data-v="advanced">Back to Advanced options</button></div></section>
    ${dxMsg ? `<p class="cf-msg">${esc(dxMsg)}</p>` : ''}
    <section class="panel"><div class="ph"><h2>Change a Pokémon</h2><span class="muted">${editable.length} Pokémon, legendaries included</span></div>
      <div class="cf-newpack"><label class="cf-field"><span class="eyebrow">Pokémon</span><input id="dx-pick" class="cf-in" list="dx-species" value="${esc(dxPickText)}" placeholder="Start typing a Pokémon" autocomplete="off"></label><button class="btn" data-act="dxpick">Change it</button>
        <button class="btn" data-act="dxnew">Add a new Pokémon</button></div>
      ${dxPickErr ? `<p class="warn">${esc(dxPickErr)}</p>` : ''}
      <datalist id="dx-species">${editable.map(n => `<option value="${esc(n)}">`).join('')}</datalist></section>
    ${form}
    <section class="panel"><div class="ph"><h2>Your changes</h2><span class="muted">${edits.length} changed · ${added.length} of ${DEX_MAX_NEW} new</span></div>
      ${added.length ? `<div class="eyebrow">New Pokémon</div><div class="cf-list">${added.map(newRow).join('')}</div>` : ''}
      ${edits.length ? `<div class="eyebrow">Changed Pokémon</div><div class="cf-list">${edits.map(editRow).join('')}</div>` : ''}
      ${edits.length || added.length ? '' : '<p class="muted">No changes yet. Pick a Pokémon above to change it, or add one of your own.</p>'}
      <div class="confirm-row">${dexCount(dexLib) ? `<button class="btn small" data-act="dxexport" aria-expanded="${dxExport}">Export my Pokédex</button>` : ''}<button class="btn small" data-act="dximport" aria-expanded="${dxImpOpen}">Import</button>${dexCount(dexLib) ? '<button class="btn small danger" data-act="dxclear">Clear everything</button>' : ''}</div>
      ${dxExport ? `<div class="cf-export"><p class="muted small">Copy this text to keep it or share it. Import it on another device to get the same Pokédex.</p><textarea class="box" rows="4" readonly spellcheck="false">${esc(dexExportText())}</textarea></div>` : ''}
      ${dxImpOpen ? `<div class="cf-export"><label class="fine" for="dx-imp">Paste a Pokédex export. Pokémon in it replace yours of the same name.</label><textarea id="dx-imp" class="box" rows="4" spellcheck="false">${esc(dxImpText)}</textarea>
        <div class="confirm-row"><button class="btn" data-act="dximportgo">Import this Pokédex</button></div>${dxImpMsg ? `<p class="${/^Imported/.test(dxImpMsg) ? 'cf-msg' : 'warn'}">${esc(dxImpMsg)}</p>` : ''}</div>` : ''}
      ${dxClearArm ? `<div class="cf-confirm"><b>Clear all ${dexCount(dexLib)} changes?</b> Every Pokémon goes back to the game's own and your new Pokémon are deleted. Leagues already running keep theirs. <div class="confirm-row"><button class="btn danger" data-act="dxclearyes">Yes, clear everything</button><button class="btn" data-act="dxclearno">Keep them</button></div></div>` : ''}
    </section>
    <div class="confirm-row"><button class="btn primary" data-act="setuppage" data-v="advanced">Back to Advanced options</button></div></main>`;
}
// the editor's buttons; true when the action was one of these
function dexAction(a, el) {
  const k = el.dataset.k;
  switch (a) {
    case 'dextoggle': dxRead(); dexLib.on = !dexLib.on; saveDexLib(); return true;
    case 'dxpick': { const v = (($('#dx-pick') || {}).value || '').trim(); dxPickText = v; dexSnapshot();
      const n = Object.keys(DEX_BASE).find(x => x.toLowerCase() === v.toLowerCase());
      if (!v) dxPickErr = 'Type the name of a Pokémon first.'; else if (!n) dxPickErr = `There's no Pokémon called ${v} in the game.`; else if (!dexEditable(n)) dxPickErr = `${n} can't be changed: its stats are scrambled every battle.`;
      else { dxPickErr = ''; dxMsg = ''; dxLoad(n); }
      return true; }
    case 'dxedit': dxMsg = ''; dxLoad(k); return true;
    case 'dxnew': dxMsg = ''; dxErrs = []; dxDraft = dxBlank(true); dxDraft.ab[0] = dexAbilities()[0]; dxMode = 'new'; dxWas = null; return true;
    case 'dxeditnew': { const e = dexLib.added.find(x => x.name === k); if (!e) return true; dxMsg = ''; dxErrs = []; dxDraft = { name: e.name, types: [e.types[0], e.types[1] || ''], stats: e.stats.slice(), ab: e.ab.slice(), from: e.from || '', lvl: e.lvl || 30, rare: !!e.rare, starter: !!e.starter, legend: !!e.legend, egg: (e.egg || []).slice(), isNew: true }; dxMode = 'new'; dxWas = e.name; return true; }
    case 'dxsave': dxSave(); return true;
    case 'dxcancel': dxMode = null; dxDraft = null; dxWas = null; dxErrs = []; return true;
    case 'dxreset': delete dexLib.edits[k]; saveDexLib(); if (dxDraft && !dxDraft.isNew && dxDraft.name === k) { dxDraft = null; dxMode = null; } dxMsg = `${k} is back to the game's own.`; return true;
    case 'dxdelnew': dxDeleteNew(k); return true;
    case 'dxexport': dxExport = !dxExport; return true;
    case 'dximport': dxImpOpen = !dxImpOpen; dxImpMsg = ''; return true;
    case 'dximportgo': { const r = dexImport(dxImpText); if (r.err) { dxImpMsg = r.err; return true; }
      if (!r.ok) { dxImpMsg = `Nothing could be imported${r.bad ? `: ${r.bad} entr${r.bad === 1 ? 'y was' : 'ies were'} broken or clashed with the game's Pokémon` : ''}.`; return true; }
      dexLib = Object.assign(r.lib, { on: true }); const ok = saveDexLib();
      dxImpMsg = `Imported ${r.ok} Pokémon.${r.bad ? ` ${r.bad} couldn't be: broken, or clashing with the game's Pokémon.` : ''}${ok ? '' : " This browser couldn't store it, so it'll be gone when the page closes."}`; dxImpText = ''; return true; }
    case 'dxclear': dxClearArm = true; return true;
    case 'dxclearno': dxClearArm = false; return true;
    case 'dxclearyes': dexLib = { on: false, edits: {}, added: [] }; saveDexLib(); dxClearArm = false; dxDraft = null; dxMode = null; dxWas = null; dxMsg = 'Cleared. The next league uses the game\'s own Pokédex.'; return true;
  }
  return false;
}
// ================= CUSTOM REGIONS (0.31.0): the region editor and picking regions for a new game =================
// setupCustom: how each region in the library is used in the next new game: { id: 'add' | 'pool:<i>' | 'whole:<i>' }
let setupCustom = {};
let rgDraft = null, rgPorts = [], rgErrs = [], rgMsg = '', rgAddText = '', rgLegText = '', rgGen = { types: [], gens: [], power: 'standard' }, rgSp = null, rgSpWas = null, rgSpErrs = [];
let rgExport = null, rgImpText = '', rgImpMsg = '', rgDelArm = null;
const GEN_NAMES = ['Gen I', 'Gen II', 'Gen III', 'Gen IV', 'Gen V', 'Gen VI', 'Gen VII', 'Gen VIII', 'Gen IX'];
function setupChoices() {
  return Object.entries(setupCustom).map(([id, v]) => { const rec = libRegion(id); if (!rec || !v) return null; const [mode, of] = v.split(':'); return { rec, mode, of: of == null ? null : +of }; }).filter(Boolean);
}
// the setup screen shows the regions the new world will have (bound with no world)
function previewSetupRegions() { if (!S) applyRegions(worldRegions(regionChoices(setupChoices()))); }
const useLabel = v => { if (!v) return 'Not used'; const [m, i] = v.split(':'); return m === 'add' ? 'Added as a new region' : m === 'pool' ? `Replaces ${builtinRegionName(+i)}'s Pokémon` : `Replaces ${builtinRegionName(+i)}`; };
function regionsSection() {
  const lib = regionLib.regions, used = lib.filter(r => setupCustom[r.id]).length, clash = regionClashes(setupChoices());
  const opts = cur => ['', 'add'].concat(BUILTIN_REGIONS.flatMap((_, i) => [`pool:${i}`, `whole:${i}`])).map(v => `<option value="${v}"${(cur || '') === v ? ' selected' : ''}>${esc(useLabel(v))}</option>`).join('');
  const reps = {}; for (const r of lib) { const v = setupCustom[r.id]; if (v && v !== 'add') { const i = v.split(':')[1]; (reps[i] = reps[i] || []).push(r.name); } }
  const row = r => { const st = poolStats(r.pool);
    return `<div class="rg-lib-row"><div><b>${esc(r.name)}</b> <span class="muted small">${st.size} species · ${st.lines.length} lines${r.added.length ? ` · ${r.added.length} new Pokémon` : ''}</span>${r.lock ? ' <span class="tag">Locked</span>' : ''}${r.rivals === false ? ' <span class="tag">Your League only</span>' : ''}</div>
      <div class="confirm-row"><label class="sr" for="rguse-${r.id}">Use ${esc(r.name)} in the new world</label><select id="rguse-${r.id}" class="rguse" data-k="${r.id}">${opts(setupCustom[r.id])}</select>
        <button class="btn small" data-act="rgedit" data-k="${r.id}">Edit</button><button class="btn small" data-act="rgexport" data-k="${r.id}" aria-expanded="${rgExport === r.id}">Export</button><button class="btn small danger" data-act="rgdel" data-k="${r.id}">Delete</button></div>
      ${rgExport === r.id ? `<div class="cf-export" style="flex-basis:100%"><p class="muted small">Copy the code or download the file, then use <b>Import a region</b> on another device or share it. Its own new Pokémon come with it.</p><textarea id="rg-exptext" class="box" rows="3" readonly spellcheck="false">${esc(regionCode(r))}</textarea>
        <div class="confirm-row"><button class="btn small" data-act="rgcopy">Copy code</button>${canSaveFile() ? `<button class="btn small" data-act="rgfile" data-k="${r.id}">Download file</button>` : ''}<button class="btn small" data-act="rgexport" data-k="${r.id}">Close</button></div></div>` : ''}
      ${rgDelArm === r.id ? `<div class="cf-confirm" style="flex-basis:100%"><b>Delete ${esc(r.name)}?</b> Worlds already running keep it. <div class="confirm-row"><button class="btn danger" data-act="rgdelyes" data-k="${r.id}">Yes, delete it</button><button class="btn" data-act="rgdelno">Keep it</button></div></div>` : ''}</div>`; };
  const body = `<p class="muted small">Regions of your own, saved in this browser: a new region beside the nine, or a replacement for one of them (only its Pokémon, keeping its cities, ports and neighbours; or the whole region). Pick how each is used in the new world. A world keeps its regions for good.</p>
    ${lib.length ? lib.map(row).join('') : '<p class="muted">No regions yet.</p>'}
    ${Object.entries(reps).filter(([, n]) => n.length > 1).map(([i, n]) => `<p class="warn">${n.join(' and ')} both replace ${builtinRegionName(+i)}: only ${esc(n[n.length - 1])} is used.</p>`).join('')}
    ${clash.length ? `<p class="warn">Left out of the new world, as their names are already taken (My Pokédex or another region): ${clash.map(esc).join(', ')}.</p>` : ''}
    <div class="confirm-row"><button class="btn" data-act="rgnew">New region</button><label class="sr" for="rgcopyof">Copy a built-in region</label><select id="rgcopyof">${BUILTIN_REGIONS.map((_, i) => `<option value="${i}">${builtinRegionName(i)}</option>`).join('')}</select><button class="btn" data-act="rgcopyreg">Copy this region</button></div>
    <div class="cf-export"><label class="fine" for="rg-imp">Import a region: paste a region code, or choose a file.</label><textarea id="rg-imp" class="box" rows="3" spellcheck="false">${esc(rgImpText)}</textarea>
      <div class="confirm-row"><label class="btn small" for="rgfile">Choose a file</label><input id="rgfile" type="file" accept=".json,.txt,application/json,text/plain" class="sr"><button class="btn" data-act="rgimport">Import this region</button></div>
      ${rgImpMsg ? `<p class="${/^Imported/.test(rgImpMsg) ? 'cf-msg' : 'warn'}">${esc(rgImpMsg)}</p>` : ''}</div>`;
  return foldSec('regions', 'Custom regions', 'Your own regions, a 10th or a replacement', lib.length ? `${lib.length} region${lib.length === 1 ? '' : 's'} · ${used} in the new world` : 'No regions yet', body);
}
// ---------- the editor ----------
function rgOpen(rec) { rgDraft = JSON.parse(JSON.stringify(rec)); rgPorts = rgDraft.towns.concat(rgDraft.extra).map(n => rgDraft.ports[n] || ''); rgErrs = []; rgMsg = ''; rgSp = null; rgSpWas = null; rgSpErrs = []; rgAddText = ''; rgLegText = ''; setupPage = 'region'; }
// the draft as a region: ports back by name
function rgRec() { const d = rgDraft, names = d.towns.concat(d.extra); return Object.assign({}, d, { ports: Object.fromEntries(names.map((n, i) => [n.trim(), rgPorts[i]]).filter(([n, k]) => n && k)) }); }
function rgSet(path, v) { const ks = path.split('.'); let o = rgDraft; for (const k of ks.slice(0, -1)) { if (o[k] == null) o[k] = {}; o = o[k]; } o[ks[ks.length - 1]] = v; }
const rgField = (label, path, val, max = REGION_NAME_MAX, ph = '') => `<label class="cf-field"><span class="eyebrow">${label}</span><input class="cf-in rg-f" data-f="${path}" maxlength="${max}" value="${esc(val || '')}"${ph ? ` placeholder="${esc(ph)}"` : ''} autocomplete="off"></label>`;
function rgSpBlank() { return { name: '', types: ['Normal', ''], stats: [50, 50, 50, 50, 50, 50], ab: [dexAbilities()[0], '', ''], from: '', lvl: 30, rare: false, starter: false, legend: false, egg: [] }; }
function rgSpRead() {
  const v = id => (($(id) || {}).value || '').trim(), ck = id => !!($(id) || {}).checked;
  return dexNorm({ name: v('#rgs-name'), types: [v('#rgs-t1'), v('#rgs-t2')], stats: [0, 1, 2, 3, 4, 5].map(i => Number(v('#rgs-st' + i))), ab: [v('#rgs-ab0'), v('#rgs-ab1'), v('#rgs-ab2')], from: v('#rgs-from'), lvl: Number(v('#rgs-lvl')), rare: ck('#rgs-rare'), starter: ck('#rgs-starter'), legend: ck('#rgs-legend'), egg: eggRead('rgs') });
}
// the new Pokémon of every other region in the library, and My Pokédex's, for name and evolution checks
const rgOthers = () => dexLib.added.concat(regionLib.regions.filter(r => r.id !== rgDraft.id).flatMap(r => r.added));
function rgSpSave() {
  const e = rgSpRead(), lib = { edits: {}, added: rgOthers().concat(rgDraft.added.filter(x => x.name !== rgSpWas)) };
  const errs = checkDexEntry(e, true, rgSpWas, Object.assign({}, lib, { added: lib.added.concat(rgSpWas ? [{ name: rgSpWas }] : []) }));
  if (rgOthers().some(x => x.name.toLowerCase() === e.name.toLowerCase())) errs.push(`${e.name} is already a Pokémon in My Pokédex or another of your regions.`);
  if (rgDraft.added.some(x => x.name !== rgSpWas && x.name.toLowerCase() === e.name.toLowerCase())) errs.push(`This region already has a Pokémon called ${e.name}.`);
  if (errs.length) { rgSpErrs = [...new Set(errs)]; rgSp = Object.assign({}, e, { types: [e.types[0] || 'Normal', e.types[1] || ''] }); return; }
  if (rgSpWas) { const i = rgDraft.added.findIndex(x => x.name === rgSpWas); rgDraft.added[i] = e; rgDraft.pool = rgDraft.pool.map(b => b === rgSpWas ? e.name : b); rgDraft.added.forEach(x => { if (x.from === rgSpWas) x.from = e.name; }); }
  else rgDraft.added.push(e);
  // a legendary encounter is never on the list (it only comes as an encounter, at home in this region)
  if (e.legend) rgDraft.pool = rgDraft.pool.filter(b => b !== e.name);
  else if (!e.from && !rgDraft.pool.includes(e.name)) rgDraft.pool.push(e.name);
  rgMsg = `${rgSpWas ? 'Saved' : 'Added'} ${e.name}.`; rgSp = null; rgSpWas = null; rgSpErrs = [];
}
function rgSpDelete(n) {
  const gone = new Set([n]); for (let more = true; more;) { more = false; for (const x of rgDraft.added) if (x.from && gone.has(x.from) && !gone.has(x.name)) { gone.add(x.name); more = true; } }
  rgDraft.added = rgDraft.added.filter(x => !gone.has(x.name)); rgDraft.pool = rgDraft.pool.filter(b => !gone.has(b));
  rgMsg = `Deleted ${[...gone].join(', ')}.`; if (rgSpWas && gone.has(rgSpWas)) { rgSp = null; rgSpWas = null; }
}
function rgSpForm() {
  const d = rgSp, sel = (id, cur, opts) => `<select id="${id}">${opts.map(([v, l]) => `<option value="${esc(v)}"${String(v) === String(cur) ? ' selected' : ''}>${esc(l)}</option>`).join('')}</select>`;
  const field = (label, html) => `<label class="cf-field"><span class="eyebrow">${label}</span>${html}</label>`;
  const abs = dexAbilities(), abOpts = none => [['', none]].concat(abs.map(a => [a, a]));
  const parents = Object.keys(DEX_BASE).filter(n => dexEditable(n) && dexParentOk(n)).concat(dexLib.on ? dexLib.added.filter(x => !x.legend).map(x => x.name) : [], rgDraft.added.map(x => x.name)).filter(n => n !== rgSpWas).sort();
  return `<div class="cf-export" id="rgs-form"><div class="eyebrow">${rgSpWas ? 'Edit ' + esc(rgSpWas) : 'A new Pokémon of this region'}</div>
    <div class="cf-grid">${field('Name', `<input id="rgs-name" class="cf-in" maxlength="${DEX_NAME_MAX}" value="${esc(d.name)}" autocomplete="off">`)}${field('Main type', sel('rgs-t1', d.types[0], TYPES.map(t => [t, t])))}${field('Second type', sel('rgs-t2', d.types[1] || '', [['', 'None']].concat(TYPES.map(t => [t, t]))))}</div>
    <div class="cf-grid six">${d.stats.map((x, i) => field(DEX_STAT_LABEL[i], `<input id="rgs-st${i}" class="cf-in" type="number" min="1" max="255" step="1" inputmode="numeric" value="${Number.isFinite(x) ? x : ''}">`)).join('')}</div>
    <div class="cf-grid">${field('Ability', sel('rgs-ab0', d.ab[0], abOpts('Choose…')))}${field('Second ability', sel('rgs-ab1', d.ab[1], abOpts('None')))}${field('Hidden ability', sel('rgs-ab2', d.ab[2], abOpts('None')))}</div>
    <div class="cf-grid">${field('Evolves from', `<input id="rgs-from" class="cf-in" list="rgs-parents" value="${esc(d.from || '')}" placeholder="Nothing: found in the wild" autocomplete="off">`)}${field('At level', `<input id="rgs-lvl" class="cf-in" type="number" min="2" max="100" step="1" inputmode="numeric" value="${esc(d.lvl || 30)}">`)}</div>
    <div class="cf-grid">${eggFields('rgs', d.egg, field)}</div>
    <datalist id="rgs-parents">${parents.map(n => `<option value="${esc(n)}">`).join('')}</datalist>
    <div class="adv-list"><label class="cf-imp-row"><input id="rgs-legend" type="checkbox"${d.legend ? ' checked' : ''}><span><b>Legendary encounter</b><span class="muted small cf-imp-team">Only for a base stat total over ${DEX_LEGEND_BST}, with nothing it evolves from and nothing evolving from it. Never found in the wild: it appears as a very rare legendary encounter, three times likelier in this region (only here if its new Pokémon are kept here), and one trainer holds it at a time. Rare and Starter don't apply to it.</span></span></label>
      <label class="cf-imp-row"><input id="rgs-rare" type="checkbox"${d.rare ? ' checked' : ''}><span><b>Rare in the wild</b></span></label><label class="cf-imp-row"><input id="rgs-starter" type="checkbox"${d.starter ? ' checked' : ''}><span><b>Starter</b></span></label></div>
    <p class="muted small">It works as if added to My Pokédex, in every world that uses this region. A first-stage Pokémon joins the region's list; one that evolves from another joins that line; a legendary encounter is kept off the list.</p>
    ${rgSpErrs.length ? `<ul class="warn cf-errs">${rgSpErrs.map(e => `<li>${esc(e)}</li>`).join('')}</ul>` : ''}
    <div class="confirm-row"><button class="btn primary" data-act="rgspsave">${rgSpWas ? 'Save Pokémon' : 'Add Pokémon'}</button><button class="btn" data-act="rgspcancel">Cancel</button></div></div>`;
}
function viewRegionEditor() {
  const d = rgDraft, rec = rgRec(), chk = regionChecks(rec), st = chk.st;
  const portSel = i => `<select class="rg-port" data-i="${i}" aria-label="Port or railway">${[['', 'No port'], ['port', 'Port'], ['railway', 'Railway']].map(([v, l]) => `<option value="${v}"${rgPorts[i] === v ? ' selected' : ''}>${l}</option>`).join('')}</select>`;
  const place = (label, path, i) => `<div class="rg-place">${rgField(label, path, path.split('.').reduce((o, k) => o[k], d))}${i != null ? portSel(i) : ''}</div>`;
  const inPool = new Set(d.pool), addable = ranchSpecies().filter(b => !inPool.has(b));
  const tog = (act, k, on, label) => `<button class="seg${on ? ' on' : ''}" data-act="${act}" data-k="${esc(k)}" aria-pressed="${on}">${label}</button>`;
  const spTag = b => `<span class="rg-sp">${esc(b)}${SP[b] ? ' ' + SP[b].types.map(t => `<span class="dot sm" title="${t}" style="--tc:${TYPE_COLOR[t]};--tc2:${TYPE_COLOR[t]}"></span>`).join('') : ''}<button data-act="rgrm" data-k="${esc(b)}" aria-label="Remove ${esc(b)}">×</button></span>`;
  return `<main class="wrap setup">
    <section class="panel callout"><div class="eyebrow">Advanced options · Custom regions</div><h1>${d.id ? 'Edit ' + esc(libRegion(d.id) ? libRegion(d.id).name : d.name) : 'New region'}</h1>
      <p class="muted small">A region always has 8 gym cities, 6 towns and 4 League seats (up to four Leagues). Saved in this browser; worlds already running keep their own copy.</p>
      <div class="confirm-row"><button class="btn primary" data-act="rgsave">Save region</button><button class="btn" data-act="rgcancel">Cancel</button></div></section>
    ${rgMsg ? `<p class="cf-msg">${esc(rgMsg)}</p>` : ''}
    ${rgErrs.length ? `<ul class="warn cf-errs">${rgErrs.map(e => `<li>${esc(e)}</li>`).join('')}</ul>` : ''}
    <section class="panel"><div class="ph"><h2>The region</h2><span class="muted">Name, rules and post names</span></div>
      <div class="cf-grid">${rgField('Region name', 'name', d.name)}${rgField('Gym Leaders are called', 'posts.leader', d.posts && d.posts.leader, POST_NAME_MAX, 'Gym Leader')}${rgField('Gym trainers are called', 'posts.gymtrainer', d.posts && d.posts.gymtrainer, POST_NAME_MAX, 'Gym trainer')}${rgField('The Elite Four are called', 'posts.e4', d.posts && d.posts.e4, POST_NAME_MAX, 'Elite Four')}${rgField('The Champion is called', 'posts.champion', d.posts && d.posts.champion, POST_NAME_MAX, 'Champion')}</div>
      <p class="muted small">These are the defaults for every League here that hasn't named its own posts or taken a theme.</p>
      <div class="eyebrow">Themes rival Leagues here lean to</div><div class="rg-chips">${THEME_KEYS.filter(k => k !== 'region').map(k => tog('rgtheme', k, (d.themes || []).includes(k), THEMES[k].name)).join('')}</div>
      <div class="adv-list">
        <button class="adv-opt${d.rivals !== false ? ' on' : ''}" data-act="rgflag" data-k="rivals" role="switch" aria-checked="${d.rivals !== false}"><span class="adv-switch" aria-hidden="true"><i></i></span><span class="adv-text"><b>Open to rival Leagues</b><span class="muted small">Rival Leagues may start here and open here later (up to four to a region). Off: only your League.</span></span></button>
        <button class="adv-opt${d.lock ? ' on' : ''}" data-act="rgflag" data-k="lock" role="switch" aria-checked="${!!d.lock}"><span class="adv-switch" aria-hidden="true"><i></i></span><span class="adv-text"><b>Keep its new Pokémon here</b><span class="muted small">This region's own new Pokémon never migrate, ride lanes or charters, or leave with a challenger moving away, and its own legendaries appear only here. Off: they travel like any Pokémon.</span></span></button>
      </div></section>
    <section class="panel"><div class="ph"><h2>Places</h2><span class="muted">Mark ports and railways for shipping lanes</span></div>
      <div class="eyebrow">Gym cities</div><div class="rg-places">${d.towns.map((_, i) => place(`Gym ${i + 1}`, `towns.${i}`, i)).join('')}</div>
      <div class="eyebrow">Towns with no gym</div><div class="rg-places">${d.extra.map((_, i) => place(`Town ${i + 1}`, `extra.${i}`, 8 + i)).join('')}</div>
      <div class="eyebrow">League seats</div><div class="rg-places">${place('The League\'s seat', 'seat')}${place('A second League\'s seat', 'seat2')}${place('A third League\'s seat', 'seat3')}${place('A fourth League\'s seat', 'seat4')}</div>
      <div class="eyebrow">League names</div><p class="muted small">The names the Leagues at each seat take unless named at a new game. Blank: the region's name at the first seat (${esc((d.name || 'Region') + ' League')}), the seat's name at the others (${esc((d.seat2 || 'Second Seat') + ' League')}).</p>
      <div class="cf-grid">${rgField('League at the first seat', 'lgNames.0', (d.lgNames || {})[0], LG_NAME_MAX, (d.name || 'Region') + ' League')}${['second', 'third', 'fourth'].map((w, j) => rgField(`League at the ${w} seat`, `lgNames.${j + 1}`, (d.lgNames || {})[j + 1], LG_NAME_MAX, (d[SEAT_KEYS[j + 1]] || w[0].toUpperCase() + w.slice(1) + ' Seat') + ' League')).join('')}</div></section>
    <section class="panel"><div class="ph"><h2>Neighbours</h2><span class="muted">${d.nb.length} chosen · pick 2 or 3</span></div>
      <p class="muted small">Migrations come from neighbours (and now and then from further off). Neighbours are two-way. With none chosen, a replacement keeps the replaced region's, and a new region takes the two built-in regions sharing most of its Pokémon.</p>
      <div class="rg-chips">${BUILTIN_REGIONS.map((_, i) => tog('rgnb', builtinRegionName(i), d.nb.includes(builtinRegionName(i)), builtinRegionName(i))).join('')}</div></section>
    <section class="panel"><div class="ph"><h2>Legendaries</h2><span class="muted">${d.legends == null ? 'As the replaced region' : d.legends.length + ' at home here'}</span></div>
      <p class="muted small">The legendaries at home here turn up here more often. One already at home in another region stays there too, and the world can then hold one for each region that has it at home (two Calyrex with Galar and a region that also claims it).</p>
      <div class="adv-list"><button class="adv-opt${d.legends == null ? ' on' : ''}" data-act="rglegkeep" role="switch" aria-checked="${d.legends == null}"><span class="adv-switch" aria-hidden="true"><i></i></span><span class="adv-text"><b>Keep the replaced region's</b><span class="muted small">When it replaces a built-in region, use that region's legendaries. As a new region it has none.</span></span></button></div>
      ${d.legends == null ? '' : `<div class="rg-pool">${d.legends.length ? d.legends.map(sp => `<span class="rg-sp">${esc(sp)}<button data-act="rglegrm" data-k="${esc(sp)}" aria-label="Remove ${esc(sp)}">×</button></span>`).join('') : '<span class="muted small">None.</span>'}</div>
      <div class="rg-row"><label class="cf-field"><span class="eyebrow">Add a legendary</span><input id="rg-leg" class="cf-in" list="rg-legs" value="${esc(rgLegText)}" autocomplete="off"></label><button class="btn" data-act="rglegadd">Add</button></div>
      <datalist id="rg-legs">${LEGEND_CHOICES().filter(x => !d.legends.includes(x)).map(n => `<option value="${esc(n)}">`).join('')}</datalist>`}</section>
    <section class="panel"><div class="ph"><h2>Pokémon found here</h2><span class="muted">${st.size} species (built-in regions about ${REGION_SIZE}) · ${st.lines.length} lines</span></div>
      <div class="rg-row"><label class="cf-field"><span class="eyebrow">Copy the list of</span><select id="rg-copylist">${BUILTIN_REGIONS.map((_, i) => `<option value="${i}">${builtinRegionName(i)}</option>`).join('')}</select></label><button class="btn" data-act="rgcopylist" data-v="replace">Replace the list</button><button class="btn" data-act="rgcopylist" data-v="merge">Add to the list</button><button class="btn danger" data-act="rgclear">Clear the list</button></div>
      <div class="eyebrow">Generate a list</div>
      <p class="muted small">Pick types and generations (none picked: any), and how strong. Replaces the list with about ${REGION_SIZE} species; edit it after.</p>
      <div class="rg-chips">${TYPES.map(t => tog('rggent', t, rgGen.types.includes(t), t)).join('')}</div>
      <div class="rg-chips">${GEN_NAMES.map((g, i) => tog('rggeng', String(i), rgGen.gens.includes(i), g)).concat(tog('rggeng', 'other', rgGen.gens.includes('other'), 'Custom')).join('')}</div>
      <div class="rg-chips">${[['gentle', 'Gentle: nothing past 540, nothing rare'], ['standard', `Standard: at most ${GEN_PSEUDO} pseudo-legendaries`], ['strong', 'Strong: strong lines likelier']].map(([k, l]) => tog('rggenp', k, rgGen.power === k, l)).join('')}</div>
      <div class="confirm-row"><button class="btn" data-act="rggen">Generate</button></div>
      <div class="rg-row"><label class="cf-field"><span class="eyebrow">Add a Pokémon line</span><input id="rg-add" class="cf-in" list="rg-adds" value="${esc(rgAddText)}" placeholder="First stage, e.g. Ekans" autocomplete="off"></label><button class="btn" data-act="rgadd">Add</button></div>
      <datalist id="rg-adds">${addable.map(n => `<option value="${esc(n)}">`).join('')}</datalist>
      <div class="rg-pool" aria-label="The region's list">${st.lines.length ? st.lines.slice().sort().map(spTag).join('') : '<span class="muted small">The list is empty.</span>'}</div>
      ${st.missing.length ? `<p class="muted small">Not in the game with the Pokédex in use: ${st.missing.map(b => `<span class="rg-sp">${esc(b)}<button data-act="rgrm" data-k="${esc(b)}" aria-label="Remove ${esc(b)}">×</button></span>`).join(' ')}</p>` : ''}
      <div class="eyebrow">Strong lines by type</div><p class="muted small">${TYPES.map(t => `<span class="${st.typeN[t] < 5 ? 'bad' : ''}">${t} ${st.typeN[t]}</span>`).join(' · ')}</p></section>
    <section class="panel"><div class="ph"><h2>Its own new Pokémon</h2><span class="muted">${d.added.length} new</span></div>
      ${d.added.length ? `<div class="cf-list">${d.added.map(e => `<div class="cf-row${rgSpWas === e.name ? ' on' : ''}"><div class="cf-info"><b>${esc(e.name)}</b> ${chips(e.types)}${e.legend ? ' <span class="tag legend">Legendary encounter</span>' : ''}<div class="muted small">${dxStatLine(e.stats)} · total ${e.stats.reduce((a, x) => a + x, 0)} · ${e.from ? `evolves from ${esc(e.from)} at Lv ${e.lvl}` : e.legend ? 'a very rare legendary encounter, at home here' : 'found in the wild'}</div></div>
        <div class="cf-acts"><button class="btn small" data-act="rgspedit" data-k="${esc(e.name)}">Edit</button><button class="btn small danger" data-act="rgspdel" data-k="${esc(e.name)}" aria-label="Delete ${esc(e.name)}">Delete</button></div></div>`).join('')}</div>` : '<p class="muted small">None. Pokémon of its own come with the region when it is shared.</p>'}
      ${rgSp ? rgSpForm() : '<div class="confirm-row"><button class="btn" data-act="rgspnew">Add a new Pokémon</button></div>'}</section>
    <section class="panel"><div class="ph"><h2>Checks</h2><span class="muted">Warnings don't stop you saving</span></div>
      ${chk.errs.length ? `<ul class="warn cf-errs">${chk.errs.map(e => `<li>${esc(e)}</li>`).join('')}</ul>` : ''}
      ${chk.warns.length ? `<ul class="muted small">${chk.warns.map(e => `<li>${esc(e)}</li>`).join('')}</ul>` : chk.errs.length ? '' : '<p class="muted small">Nothing to flag.</p>'}
      <div class="confirm-row"><button class="btn primary" data-act="rgsave">Save region</button><button class="btn" data-act="rgcancel">Cancel</button></div></section></main>`;
}
// the editor's and the library's buttons; true when the action was one of these
function regionAction(a, el) {
  const k = el.dataset.k;
  switch (a) {
    case 'rgnew': rgOpen(regionBlank()); return true;
    case 'rgcopyreg': rgOpen(regionCopy(+(($('#rgcopyof') || {}).value || 0))); return true;
    case 'rgedit': { const r = libRegion(k); if (r) rgOpen(r); return true; }
    case 'rgexport': rgExport = rgExport === k ? null : k; return true;
    case 'rgcopy': { const t = $('#rg-exptext'); if (t) { t.select(); try { navigator.clipboard.writeText(t.value).then(() => toast('Copied.'), () => toast('Select the text and copy it.')); } catch (e) { toast('Select the text and copy it.'); } } return false; }
    case 'rgfile': { const r = libRegion(k); if (r) downloadText(regionFileName(r), regionFileText(r)); return false; }
    case 'rgdel': rgDelArm = k; return true;
    case 'rgdelno': rgDelArm = null; return true;
    case 'rgdelyes': deleteRegion(k); delete setupCustom[k]; rgDelArm = null; if (rgExport === k) rgExport = null; return true;
    case 'rgimport': { const r = regionRead(rgImpText);
      if (r.err) { rgImpMsg = r.err; return true; }
      const rec = addImportedRegion(r.rec), taken = r.dropped.filter(x => x.why === 'taken').map(x => x.name), broken = r.dropped.filter(x => x.why !== 'taken').map(x => x.name);
      rgImpMsg = `Imported ${rec.name}.${taken.length ? ` Left out, as the name is already taken: ${taken.join(', ')}.` : ''}${broken.length ? ` Left out as broken: ${broken.join(', ')}.` : ''}`; rgImpText = ''; return true; }
  }
  if (!rgDraft) return false;
  switch (a) {
    case 'rgsave': { const errs = saveRegion(rgRec()); if (errs.length) { rgErrs = errs; return true; } const n = rgDraft.name.trim(); rgDraft = null; rgErrs = []; setupPage = 'advanced'; setupFold.regions = false; rgImpMsg = ''; toast(`Saved ${n}.`); return true; }
    case 'rgcancel': rgDraft = null; rgErrs = []; setupPage = 'advanced'; return true;
    case 'rgflag': rgDraft[k] = k === 'rivals' ? rgDraft.rivals === false : !rgDraft[k]; return true;
    case 'rgtheme': rgDraft.themes = (rgDraft.themes || []).includes(k) ? rgDraft.themes.filter(x => x !== k) : (rgDraft.themes || []).concat(k); return true;
    case 'rgnb': rgDraft.nb = rgDraft.nb.includes(k) ? rgDraft.nb.filter(x => x !== k) : rgDraft.nb.concat(k); return true;
    case 'rglegkeep': rgDraft.legends = rgDraft.legends == null ? [] : null; return true;
    case 'rglegrm': rgDraft.legends = rgDraft.legends.filter(x => x !== k); return true;
    case 'rglegadd': { const v = (($('#rg-leg') || {}).value || '').trim(), n = LEGEND_CHOICES().find(x => x.toLowerCase() === v.toLowerCase());
      if (!n) { rgLegText = v; rgMsg = v ? `${v} isn't a legendary with a home region.` : 'Type a legendary first.'; return true; }
      if (!rgDraft.legends.includes(n)) rgDraft.legends.push(n); rgLegText = ''; rgMsg = ''; return true; }
    case 'rgrm': rgDraft.pool = rgDraft.pool.filter(b => b !== k); return true;
    case 'rgadd': { const v = (($('#rg-add') || {}).value || '').trim(), n = ranchSpecies().find(x => x.toLowerCase() === v.toLowerCase()) || (SP[v] && lineBaseOf(v));
      if (!n || !ranchable(n)) { rgAddText = v; rgMsg = v ? `${v} isn't a Pokémon line that can be found in the wild (use its first stage).` : 'Type a Pokémon first.'; return true; }
      if (!rgDraft.pool.includes(n)) rgDraft.pool.push(n); rgAddText = ''; rgMsg = `Added ${n}'s line.`; return true; }
    case 'rgcopylist': { const i = +(($('#rg-copylist') || {}).value || 0), list = [...builtinLines().sets[i]];
      rgDraft.pool = el.dataset.v === 'merge' ? [...new Set(rgDraft.pool.concat(list))] : list.concat(rgDraft.added.filter(x => !x.from).map(x => x.name)); rgMsg = `${el.dataset.v === 'merge' ? 'Added' : 'Copied'} ${builtinRegionName(i)}'s list.`; return true; }
    case 'rgclear': rgDraft.pool = []; rgMsg = 'The list is empty.'; return true;
    case 'rggent': rgGen.types = rgGen.types.includes(k) ? rgGen.types.filter(x => x !== k) : rgGen.types.concat(k); return true;
    case 'rggeng': { const g = k === 'other' ? 'other' : +k; rgGen.gens = rgGen.gens.includes(g) ? rgGen.gens.filter(x => x !== g) : rgGen.gens.concat(g); return true; }
    case 'rggenp': rgGen.power = k; return true;
    case 'rggen': { const pool = generatePool(rgGen); if (!pool.length) { rgMsg = 'Nothing fits those choices.'; return true; } rgDraft.pool = [...new Set(pool.concat(rgDraft.added.filter(x => !x.from).map(x => x.name)))]; rgMsg = `Generated a list of ${pool.length} lines.`; return true; }
    case 'rgspnew': rgSp = rgSpBlank(); rgSpWas = null; rgSpErrs = []; return true;
    case 'rgspedit': { const e = rgDraft.added.find(x => x.name === k); if (!e) return true; rgSp = Object.assign(rgSpBlank(), JSON.parse(JSON.stringify(e)), { types: [e.types[0], e.types[1] || ''] }); rgSpWas = k; rgSpErrs = []; return true; }
    case 'rgspcancel': rgSp = null; rgSpWas = null; rgSpErrs = []; return true;
    case 'rgspsave': rgSpSave(); return true;
    case 'rgspdel': rgSpDelete(k); return true;
  }
  return false;
}
function viewSetup() {
  previewSetupRegions(); // (0.31.0)
  if (setupLeagues > maxStartLeagues()) setupLeagues = maxStartLeagues();
  if (setupPage === 'region' && rgDraft) return viewRegionEditor();
  if (setupPage === 'advanced') return viewAdvanced();
  if (setupPage === 'dex') return viewDexEditor();
  if (setupPage === 'custom') return viewCustom();
  if (setupPage === 'import') return viewImport();
  const offNames = FEATURES.flatMap(g => g.items).filter(i => setupOff[i[0]]).map(i => i[1]);
  const advOn = Object.entries(setupAdv).filter(([k, v]) => k !== 'newRegions' && v).map(([k]) => ({ renameAny: 'Rename rival Leagues' }[k])).concat(setupFam ? [setupFam === 100 ? 'All-famous' : `Famous trainers ${setupFam}%`] : []).concat(setupAdv.newRegions ? [] : ['No Leagues in new regions']).concat(setupBaseOff ? ['Pokémon famous trainers off'] : []).concat(Object.keys(setupPacks).filter(k => setupPacks[k] && FAMOUS_PACKS[k]).map(k => FAMOUS_PACKS[k].name)).concat(offNames.length ? [`${offNames.length} feature${offNames.length === 1 ? '' : 's'} off`] : []).concat(dexLib.on && dexHas(dexLib) ? ['My Pokédex'] : []).concat(setupChoices().map(c => `${c.rec.name}: ${useLabel(setupCustom[c.rec.id]).toLowerCase()}`));
  const opt = (act, v, cur, label) => `<button class="seg${cur === v ? ' on' : ''}" data-act="${act}" data-v="${v}" aria-pressed="${cur === v}">${label}</button>`;
  return `<main class="wrap setup"><section class="panel callout"><div class="eyebrow">New world</div><h1>${GAME_NAME}</h1>
    <p>You run a Pokémon League and try to let nobody through. After you choose a region you place its first staff by hand: a Champion, four Elite Four members and eight Gym Leaders. It is one continuous world with no seasons: ${CIRCUIT_SIZE} challengers set out at the start and more follow every year, each travelling the badge circuit on their own clock, and the League's Gym Leaders, Elite Four and Champion try to stop them.</p>
    <div class="setup-opts">
      <div><div class="eyebrow">Starting Leagues</div><div class="segs setup-segs stepper"><button class="seg" data-act="setleagues" data-v="${setupLeagues - 1}"${setupLeagues <= 1 ? ' disabled' : ''} aria-label="Fewer">−</button><span class="seg on setleaguesn" aria-live="polite">${setupLeagues}</span><button class="seg" data-act="setleagues" data-v="${setupLeagues + 1}"${setupLeagues >= maxStartLeagues() ? ' disabled' : ''} aria-label="More">+</button></div></div>
      <div><div class="eyebrow">New Leagues open over time</div><div class="segs setup-segs">${opt('setgrowth', 1, setupGrowth ? 1 : 0, 'On')}${opt('setgrowth', 0, setupGrowth ? 1 : 0, 'Off')}</div></div>
      ${setupGrowth ? `<div><div class="eyebrow">At most one new League every</div><div class="segs setup-segs">${[4, 8, 12].map(n => opt('setpace', n, setupPace, n + ' years')).join('')}</div></div>` : ''}
      <div><div class="eyebrow">God mode</div><div class="segs setup-segs">${opt('setgod', 0, setupGod ? 1 : 0, 'Off')}${opt('setgod', 1, setupGod ? 1 : 0, 'On')}</div></div>
    </div>
    <p class="muted small">${setupLeagues > 1 ? `The world starts with ${setupLeagues} Leagues: yours in the region you choose and ${setupLeagues === 2 ? 'a rival' : `${setupLeagues - 1} rivals`}, founded on their own${setupRivals.slice(0, setupLeagues - 1).some(x => x != null) ? ' where you placed them in Advanced options, the rest' : ''} ${setupLeagues - 1 < LEAGUE_SETS.length ? 'in other regions' : 'two to a region where needed (one shares your region only when every other seat is taken or you place it there)'}. Their Champions meet in a World Championship every year. ` : 'The world starts with your League alone, in the region you choose. '}${setupGrowth ? `More Leagues open over time, at most one every ${setupPace} years, when a distinguished retired trainer founds one: in any region with room (up to four a region${setupAdv.newRegions ? ', regions with no League yet included' : ', only regions that already have one'}), likelier where there are fewer Leagues and in the founder's own region. A region's third and fourth Leagues need more prestige. ` : ''}${setupGod ? 'God mode lets you open a League and edit any trainer. ' : ''}</p>
    ${speedNote(setupLeagues)}
    <label class="cf-field setup-name"><span class="eyebrow">Your League's name</span><input class="cf-in" id="setlgname" maxlength="${LG_NAME_MAX}" value="${esc(setupNames[0] || '')}" placeholder="Left blank: named after its region (the Kanto League)" autocomplete="off"></label>
    <div class="setup-name"><div class="eyebrow">Your League's posts</div><p class="muted small">Pick a theme to fill the four names, or type your own over any of them. Region default uses the region's own names (Alola's Kahuna and Trial Captain, a custom region's), else the usual ones.</p>${postsForm('setposttheme', 'setpost', setupPosts, null)}</div>
    <div class="setup-name"><div class="eyebrow">How your Champion is chosen</div><p class="muted small">The seat rule. Free to pick now; changing it later costs prestige. The less control a rule keeps, the more prestige, challengers and ambitious hires it brings.</p>${seatForm('setseatrule', 'setseatevery', setupSeat.k, setupSeat.every, setupSeat.now)}</div>
    <div class="confirm-row"><button class="btn" data-act="setuppage" data-v="advanced">Advanced options</button>${advOn.length ? advOn.map(x => `<span class="tag gold">${x}</span>`).join(' ') : '<span class="muted small">None selected</span>'}</div></section>
    <div class="ph pick-h"><h2>Choose a region</h2><span class="muted">Its eight cities hold the League's gyms.</span></div>
    <div class="org-pick">${LEAGUE_SETS.map((r, i) => `<button class="org-card" data-act="newworld" data-v="${i}" style="--oc:var(--red)">
      <span class="org-name">${esc(r.name.replace(' League', ''))}</span><span class="org-blurb">${r.from ? `<b>${esc(r.from)}${r.pool && r.base == null && r.rep === i && r.from && r.name.replace(' League', '') !== r.from ? "'s Pokémon" : ''}</b>${r.solo ? ' · your League only' : ''} · ` : ''}${r.towns.map(esc).join(', ')}</span></button>`).join('')}</div></main>`;
}

// ---------- profiles ----------
// the trainers this one has met most often, with records
function h2hList(t) {
  const rows = Object.entries(t.h2h || {}).map(([id, h]) => ({ o: T(+id), h, n: h.w + h.l })).filter(x => x.o && x.n >= 2).sort((a, b) => b.n - a.n || b.h.last - a.h.last).slice(0, 6);
  if (!rows.length) return '<p class="muted small">No repeat opponents yet.</p>';
  return `<ul class="changes">${rows.map(({ o, h }) => `<li>${tname(o.id)} <b class="${h.w > h.l ? 'good' : h.w < h.l ? 'bad' : ''}">${h.w}–${h.l}</b>${t.rival === o.id ? ' <span class="rv">Rival</span>' : t.nemesis === o.id ? ' <span class="rv nem">Nemesis</span>' : ''}</li>`).join('')}</ul>`;
}
// gyms rotate towns every season, so back-to-back gym stints read as one reign as Gym Leader
function postReigns(posts) {
  const out = [];
  for (const p of posts) {
    const last = out[out.length - 1];
    if (p.role === 'leader' && last && last.role === 'leader' && last.lg === p.lg && last.to != null && p.from <= last.to + 1) { last.to = p.to; continue; }
    out.push(Object.assign({}, p));
  }
  return out;
}
function careerExtras(t) {
  const acc = accolades(t);
  const posts = postReigns(t.posts || []);
  if (!acc.length && !posts.length && !Object.keys(t.h2h || {}).length) return '';
  const span = (a, b) => b == null ? `Year ${a}–present` : a === b ? `Year ${a}` : `Years ${a}–${b}`;
  return `<section class="panel"><div class="ph"><h3>Honors &amp; history</h3></div><div class="hist3">
    <div><div class="eyebrow">Honors</div>${acc.length ? `<ul class="changes">${acc.map(x => `<li>${x.text}</li>`).join('')}</ul>` : '<p class="muted small">None yet.</p>'}</div>
    <div><div class="eyebrow">Positions held</div>${posts.length ? `<ul class="changes">${posts.slice().reverse().map(p => `<li><b>${p.role === 'leader' ? 'Gym Leader' : p.interim ? 'Interim Champion' : p.place}</b>${lgIn(p.lg) ? ' · ' + leagueName(p.lg) : ''} · ${span(p.from, p.to)}</li>`).join('')}</ul>` : '<p class="muted small">None.</p>'}</div>
    <div><div class="eyebrow">Head-to-head</div>${h2hList(t)}</div>
  </div></section>`;
}
function profileBody(t, full) {
  const sh = t.seasonHist.slice().reverse();
  const c = t.career;
  const elite = STAFF_ROLES.includes(t.role);
  return `<div class="profile">
    <section class="panel tcard"><div class="tcard-top">${trPortraitAce(t)}<div class="tcard-id"><div class="eyebrow">${t.famous ? '★ Famous trainer' + (famousTags(t).length ? ' (' + famousTags(t).map(k => FAMOUS_TAG_LABELS[k]).join(', ') + ')' : '') + ' · ' : ''}${roleLabel(t)} · Age ${t.age}${homeName(t) ? ` · From ${esc(homeName(t))}` : ''}${t.hof ? ' · Hall of Fame' : ''}</div>${cardName(t)}<div class="spec">${specLine(t)}<span class="muted"> · ${LEAD_STYLES[leadStyle(t)]}</span>${elite ? ` · formerly ${t.cls}` : ''}${traitChip(t)}</div>${rivalLine(t)}</div>
      <div class="tcard-ovr"><span>${ovr(t)}</span><small>OVR${t.role !== 'retired' ? ' · POT ' + t.pot : ''}</small></div></div>
      ${t.role === 'challenger' ? badgeRow(t, true) : ''}
      ${ratingBars(t)}
      ${full ? `<dl class="help">${RK.map(k => `<div><dt>${RNAME[k]}</dt><dd>${RHELP[k]}</dd></div>`).join('')}</dl>` : ''}
    </section>
    <section class="panel"><div class="ph"><h3>Team</h3><span class="muted">${t.team.length}/6${walkingPartner(t) ? ' · walks with ' + walkingPartner(t).sp : ''}</span></div>${t.team.map(m => monRow(m, t.id)).join('') || '<p class="muted">No Pokémon.</p>'}</section>
    ${(t.alumni || []).length ? `<section class="panel"><div class="ph"><h3>Former Pokémon</h3><span class="muted">${t.alumni.length}</span></div><div class="scroll"><table class="tbl"><thead><tr><th>Pokémon</th><th>Last Lv</th><th>Record</th><th>KOs</th><th>Left</th></tr></thead><tbody>${t.alumni.map((a, i) => `<tr><td><button class="tlink" data-act="alum" data-t="${t.id}" data-i="${i}">${a.sp}</button></td><td class="num">${a.lvl}</td><td class="num">${wl(a.st)}</td><td class="num">${a.st.ko}</td><td class="muted small">S${a.left} · ${a.why}</td></tr>`).join('')}</tbody></table></div></section>` : ''}
    ${careerExtras(t)}
    ${hofPanel(t)}
    <section class="panel"><div class="ph"><h3>Career</h3><span class="muted">${t.role === 'retired' ? `Retired in Year ${t.retiredSeason} after ${t.seasons || 0} years` : `Year ${(t.seasons || 0) + 1} of their career${t.role === 'challenger' ? ` · ${t.runs || 0} run${t.runs === 1 ? '' : 's'}${t.rest != null && t.last ? `, last one ${lastRunText(t)}` : ''}` : ''}${t.age >= 45 && t.role === 'challenger' ? ` · could retire for age from ${Math.max(50, t.age + Math.max(0, careerSpan(t) - (t.seasons || 0)))}` : ''}${STAFF_ROLES.includes(t.role) ? ` · career length ${careerSpan(t)} years · steer: ${inLeague(lgOf(t), () => steerName(steerOf(t)))}${wishTag(t)}` : ''}`}</span></div>
      <div class="stats">
        <div><b>${recOf(t).w}–${recOf(t).l}</b><small>All battles</small></div><div><b>${recOf(t).lw + recOf(t).tw}–${recOf(t).ll + recOf(t).tl}</b><small>League &amp; title</small></div>
        <div><b>${c.badges}</b><small>Badges</small></div><div><b>${c.gymW}–${c.gymL}</b><small>Gym record as challenger</small></div>
        <div><b>${c.leagueApps}</b><small>League runs</small></div><div><b>${c.titles}</b><small>Titles</small></div>
        <div><b>${c.defenses}</b><small>Title defenses</small></div><div><b>${c.e4Wins}</b><small>Elite Four wins</small></div>
      </div>
      ${sh.length ? `<div class="scroll"><table class="tbl"><thead><tr><th>Year</th>${nLeagues() > 1 ? '<th>League</th>' : ''}<th>OVR</th><th title="Most badges in one run that year">Badges</th><th title="Their best run that year">Best run</th><th>Pts</th></tr></thead><tbody>${sh.map(h => `<tr><td>${h.season}</td>${nLeagues() > 1 ? `<td>${lgIn(h.lg) || '<span class="muted">—</span>'}</td>` : ''}<td class="num">${h.ovr}</td><td class="num">${h.role === 'champion' ? '—' : h.badges}</td><td>${h.role === 'champion' ? 'Reigning Champion' : stageText(h.stage)}</td><td class="num">${h.pts ?? ''}</td></tr>`).join('')}</tbody></table></div>` : ''}
    </section></div>`;
}


// ================= PLAYER IMAGES (v190) =================
// The game ships and loads no Pokémon artwork. Players add their own: one image per species (plus an optional shiny one)
// and one portrait per trainer. Each is stored once at 128 × 128 in this browser's IndexedDB, never in the save file, and
// kept in memory as an object URL so the pages can draw it straight away. Anything without an image keeps its old look.
const IMG_DB = 'plb-images', IMG_STORE = 'images', IMG_PX = 128, IMG_MAX_FILE = 20 * 1024 * 1024;
const IMGS = new Map(); // key -> { url, blob, at }; keys are p:<species>, s:<species> (shiny), t:<title name>, c:<trainer class> (v196)
let imgDbP = null, imgBootDone = false, imgQ = '', imgTab = 'mon', imgMsg = '', imgBusy = false, imgClearArm = false;
function imgDb() {
  if (imgDbP) return imgDbP;
  imgDbP = new Promise(res => {
    try {
      if (!window.indexedDB) return res(null);
      const rq = indexedDB.open(IMG_DB, 1);
      rq.onupgradeneeded = () => { const db = rq.result; if (!db.objectStoreNames.contains(IMG_STORE)) db.createObjectStore(IMG_STORE, { keyPath: 'key' }); };
      rq.onsuccess = () => res(rq.result); rq.onerror = () => res(null); rq.onblocked = () => res(null);
    } catch (e) { res(null); }
  });
  return imgDbP;
}
function imgTx(mode, fn) {
  return imgDb().then(db => db ? new Promise((res, rej) => {
    try { const tx = db.transaction(IMG_STORE, mode), rq = fn(tx.objectStore(IMG_STORE)); tx.oncomplete = () => res(rq ? rq.result : true); tx.onerror = tx.onabort = () => rej(tx.error || new Error('tx')); }
    catch (e) { rej(e); }
  }) : Promise.reject(new Error('no-db')));
}
function imgCache(rec) { const old = IMGS.get(rec.key); if (old) URL.revokeObjectURL(old.url); IMGS.set(rec.key, { url: URL.createObjectURL(rec.blob), blob: rec.blob, at: rec.at || 0 }); }
function imgUncache(key) { const old = IMGS.get(key); if (old) URL.revokeObjectURL(old.url); IMGS.delete(key); }
async function imgLoadAll() {
  try { const all = await imgTx('readonly', st => st.getAll()); for (const r of all || []) if (r && r.key && r.blob) imgCache(r); } catch (e) {}
  if (IMGS.size && imgBootDone) { try { render(); if (modal && modal.kind !== 'battle') renderModal(); } catch (e) {} }
}
// store one image; if this browser won't keep it, it still shows until the page closes
async function imgSet(key, blob) {
  const rec = { key, blob, at: Date.now() }; imgCache(rec);
  try { await imgTx('readwrite', st => st.put(rec)); return true; } catch (e) { return false; }
}
async function imgDel(key) { imgUncache(key); try { await imgTx('readwrite', st => st.delete(key)); } catch (e) {} }
// ---- keys and labels ----
const IMG_SP = sp => 'p:' + sp, IMG_SHINY = sp => 's:' + sp;
const trImgName = t => `${titleOf(t)} ${t.name}`;
const IMG_TR = t => 't:' + trImgName(t);
const imgUrl = k => { const x = IMGS.get(k); return x ? x.url : null; };
// v196: a class picture covers every trainer of that class (all Hikers) who has no portrait of their own. A trainer keeps
// it after becoming a Gym Leader, Elite Four member or Champion, since they keep their class underneath the title.
const IMG_CLS = c => 'c:' + c;
const trClsImg = t => t && t.cls ? imgUrl(IMG_CLS(t.cls)) : null;
const trImg = t => t ? imgUrl(IMG_TR(t)) || trClsImg(t) : null;
// every class the game hands out, then (in a league) any other class a trainer holds, such as a famous trainer's
function imgClassList() {
  const out = [], seen = new Set(), add = c => { if (c && !seen.has(c)) { seen.add(c); out.push(c); } };
  for (const list of Object.values(CLASSES)) for (const [c] of list) add(c);
  for (const d of DUAL_CLASSES) if (!d[4] || !S || featOn('extclasses')) add(d[0]);
  for (const [c] of GENERAL) add(c);
  for (const [c] of COND_CLASSES) add(c); // (0.76.0)
  if (S) for (const t of Object.values(S.trainers)) add(t.cls);
  for (const k of IMGS.keys()) if (k[0] === 'c') add(k.slice(2));
  return out;
}
const monImg = (sp, shiny) => (shiny && imgUrl(IMG_SHINY(sp))) || imgUrl(IMG_SP(sp));
function imgLabel(k) { return k[0] === 's' ? `Shiny ${k.slice(2)}` : k[0] === 'c' ? `every ${k.slice(2)}` : k.slice(2); }
const fmtBytes = n => n < 1024 ? `${n} B` : n < 1048576 ? `${(n / 1024).toFixed(n < 10240 ? 1 : 0)} KB` : `${(n / 1048576).toFixed(1)} MB`;
// ---- drawing them ----
// a Pokémon's picture at a size, or its type-colored dot when it has none (a Mega, Delta, alpha or Shadow uses the normal image)
function monFace(sp, shiny, px, dotCls = '', flip = false) {
  const u = monImg(sp, shiny);
  if (u) return `<img class="pic${flip ? ' flip' : ''}" src="${u}" alt="" width="${px}" height="${px}" decoding="async">`;
  const s = SP[sp] || { types: ['Normal'] };
  return `<span class="dot${dotCls ? ' ' + dotCls : ''}" style="--tc:${TYPE_COLOR[s.types[0]]};--tc2:${TYPE_COLOR[s.types[1] || s.types[0]]}"></span>`;
}
// a small picture beside a name in tables and lists; nothing at all when there's no image
const monMini = (sp, shiny) => { const u = monImg(sp, shiny); return u ? `<img class="pic mini" src="${u}" alt="" width="22" height="22" decoding="async">` : ''; };
const trInitials = t => String(t.name || '?').replace(/ V\d+$/, '').split(/\s+/).filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase();
function trFace(t, px) {
  const u = trImg(t);
  return u ? `<img class="pic tpic" src="${u}" alt="" width="${px}" height="${px}" decoding="async">`
    : `<span class="tpic tinit" style="width:${px}px;height:${px}px;font-size:${Math.round(px * 0.38)}px" aria-hidden="true">${esc(trInitials(t || {}))}</span>`;
}
const trMini = (t, px = 22) => { const u = trImg(t); return u ? `<img class="pic tpic mini" src="${u}" alt="" width="${px}" height="${px}" decoding="async">` : ''; };
const CAM_SVG = '<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path fill="currentColor" d="M9 4 7.2 6H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-3.2L15 4H9zm3 4.5a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9zm0 2a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z"/></svg>';
// the portrait square on a trainer's card, with a camera badge to add or change it: the full 128 px image, or 64 px initials
function trPortrait(t) {
  const has = !!trImg(t), own = !!imgUrl(IMG_TR(t));
  return `<div class="tport${has ? ' big' : ''}">${trFace(t, has ? IMG_PX : 64)}<button class="tcam" data-act="imgup" data-k="${esc(IMG_TR(t))}" data-c="${esc(t.cls || '')}" title="${own ? 'Change' : 'Add'} portrait" aria-label="${own ? 'Change' : 'Add'} ${esc(t.name)}'s portrait">${CAM_SVG}</button></div>`;
}
// 0.73.0: a trainer's ace beside their portrait, only when the trainer and the ace both have a picture. The ace is the
// strongest Pokémon on the team (level × base stats, as `styledPick` reads it); it opens that Pokémon's page.
const profileAce = t => t && t.team && t.team.length ? t.team.reduce((a, m) => (monPower(m) > monPower(a) ? m : a), t.team[0]) : null;
function trPortraitAce(t) {
  const m = trImg(t) ? profileAce(t) : null, u = m ? monImg(m.sp, m.shiny || m.radiant) : null;
  if (!u) return trPortrait(t);
  return `<div class="tportace">${trPortrait(t)}<button class="tace" data-act="mon" data-t="${t.id}" data-u="${m.uid}" title="Their ace: ${esc(m.sp)}, Lv ${lvShow(m)}"><img class="pic" src="${u}" alt="${esc(m.sp)}" width="${IMG_PX}" height="${IMG_PX}" decoding="async"><span class="tace-lbl">Ace · ${esc(m.sp)}</span></button></div>`;
}
// the Add image / Add shiny image buttons on a Pokémon's page (they apply to the whole species)
function monImgBtns(sp) {
  const n = imgUrl(IMG_SP(sp)), s = imgUrl(IMG_SHINY(sp));
  return `<div class="imgbtns"><button class="btn small" data-act="imgup" data-k="${esc(IMG_SP(sp))}">${n ? 'Change image' : 'Add image'}</button><button class="btn small" data-act="imgup" data-k="${esc(IMG_SHINY(sp))}">${s ? 'Change shiny image' : 'Add shiny image'}</button></div>`;
}
// ---- turning a file into the stored 128 × 128 square ----
async function imgDecode(blob) {
  const url = URL.createObjectURL(blob), img = new Image();
  img.src = url;
  try { await img.decode(); } catch (e) { URL.revokeObjectURL(url); throw e; }
  URL.revokeObjectURL(url);
  if (!img.naturalWidth || !img.naturalHeight) throw new Error('empty');
  return img;
}
// trim fully transparent margins, so sprites with lots of empty space fill the square
function imgBounds(img) {
  const w = img.naturalWidth, h = img.naturalHeight; if (w * h > 4e6) return [0, 0, w, h];
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(img, 0, 0);
  let d; try { d = x.getImageData(0, 0, w, h).data; } catch (e) { return [0, 0, w, h]; }
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) for (let i = 0; i < w; i++) if (d[(y * w + i) * 4 + 3] > 8) { if (i < x0) x0 = i; if (i > x1) x1 = i; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  return x1 < 0 ? [0, 0, w, h] : [x0, y0, x1 - x0 + 1, y1 - y0 + 1];
}
// pixel art keeps hard edges (whole-number scaling, saved as PNG); anything else is smoothed and saved as WebP where the browser can
async function imgSquare(img, box, pixel, flip) {
  const [sx, sy, sw, sh] = box, c = document.createElement('canvas'); c.width = c.height = IMG_PX;
  const x = c.getContext('2d');
  let k = IMG_PX / Math.max(sw, sh);
  if (pixel && k >= 1) k = Math.floor(k);
  const dw = Math.max(1, Math.round(sw * k)), dh = Math.max(1, Math.round(sh * k)), dx = Math.floor((IMG_PX - dw) / 2), dy = Math.floor((IMG_PX - dh) / 2);
  x.imageSmoothingEnabled = !pixel || k < 1; x.imageSmoothingQuality = 'high';
  if (flip) { x.translate(IMG_PX, 0); x.scale(-1, 1); }
  x.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
  const toBlob = (type, q) => new Promise(r => { try { c.toBlob(b => r(b), type, q); } catch (e) { r(null); } });
  let b = pixel ? await toBlob('image/png') : await toBlob('image/webp', 0.9);
  if (!b) b = await toBlob('image/png');
  if (!b) throw new Error('encode');
  return b;
}
// redo the preview after a new file or a changed option
async function imgRedraft() {
  const d = modal && modal.kind === 'img' && modal.draft; if (!d) return;
  try { const b = await imgSquare(d.img, d.box, d.pixel, d.flip); if (d.url) URL.revokeObjectURL(d.url); d.blob = b; d.url = URL.createObjectURL(b); modal.err = ''; }
  catch (e) { modal.err = "Couldn't prepare that image in this browser."; }
  renderModal();
}
async function imgPickFile(f) {
  const m = modal; if (!m || m.kind !== 'img' || !f) return;
  if (f.size > IMG_MAX_FILE) { m.err = 'That file is over 20 MB. Choose a smaller image.'; renderModal(); return; }
  try {
    const img = await imgDecode(f);
    const old = m.draft;
    m.draft = { img, box: imgBounds(img), name: f.name || 'image', size: f.size, w: img.naturalWidth, h: img.naturalHeight, pixel: old ? old.pixel : true, flip: old ? old.flip : false };
    if (old && old.url) URL.revokeObjectURL(old.url);
    await imgRedraft();
  } catch (e) { m.err = "That file isn't an image this browser can open."; renderModal(); }
}
function openImgUp(key, cls) {
  // a class picture opened from a trainer's portrait window comes back to that window
  const back = modal ? (modal.kind === 'img' && key[0] !== 'c' ? modal.back : modal) : null;
  modal = { kind: 'img', key, back, draft: null, err: '', cls: key[0] === 't' && cls ? cls : null };
  renderModal();
}
function imgBody() {
  const m = modal, d = m.draft, cur = IMGS.get(m.key), isCls = m.key[0] === 'c', isTr = m.key[0] === 't' || isCls;
  const clsUrl = m.cls ? imgUrl(IMG_CLS(m.cls)) : null, shown = d ? d.url : cur ? cur.url : clsUrl;
  const name = esc(isCls ? m.key.slice(2) : imgLabel(m.key)), sp = isTr ? null : m.key.slice(2);
  const sizes = isTr ? [[32, 'In battle'], [64, 'Profile']] : [[22, 'Lists'], [40, 'Team'], [76, 'Battle']];
  const opt = (k, title, desc) => `<button class="adv-opt mini${d[k] ? ' on' : ''}" data-act="imgopt" data-k="${k}" role="switch" aria-checked="${!!d[k]}"><span class="adv-switch" aria-hidden="true"><i></i></span><span class="adv-text"><b>${title}</b><span class="muted small">${desc}</span></span></button>`;
  const note = isCls ? `Used for every ${name} without a portrait of their own, in any league on this device, and kept when one becomes a Gym Leader, Elite Four member or Champion.`
    : isTr ? `A portrait belongs to ${name}, in any league on this device.${m.cls ? ` It takes the place of the ${esc(m.cls)} class picture for this trainer only.` : ''}`
    : m.key[0] === 's' ? `Used for every shiny ${esc(sp)}. Shinies without one use the normal image.` : `Used for every ${esc(sp)} (Delta, alpha, Shadow and Mega ${esc(sp)} too), on every team.`;
  return `<div class="mh"><h2>${isCls ? 'Class picture' : isTr ? 'Portrait' : 'Image'}: ${name}</h2><button class="btn icon" data-act="close" aria-label="Close">×</button></div>
  <div class="imgup">
    <div class="checker imgprev">${shown ? `<img src="${shown}" alt="Preview of ${name}" width="128" height="128">` : `<span class="muted small">No image yet</span>`}</div>
    <div class="imgup-meta">
      ${d ? `<b class="imgup-file">${esc(d.name)}</b><span class="muted small">${fmtBytes(d.size)} · ${d.w} × ${d.h}</span><span class="small">Saved as ${IMG_PX} × ${IMG_PX}${d.blob ? ` · ${fmtBytes(d.blob.size)}` : ''}</span>`
        : cur ? `<span class="small">Current image · ${IMG_PX} × ${IMG_PX} · ${fmtBytes(cur.blob.size)}</span><span class="muted small">Choose another file to replace it.</span>`
        : clsUrl ? `<span class="small">Showing the ${esc(m.cls)} class picture.</span><span class="muted small">Choose a file to give this trainer a portrait of their own.</span>`
        : `<span class="muted small">PNG, WebP, GIF or JPEG. Empty margins are trimmed, and the picture is centered on a transparent ${IMG_PX} × ${IMG_PX} square.</span>`}
      ${shown ? `<div class="imgsizes">${sizes.map(([px, l]) => `<span class="imgsize"><span class="checker" style="width:${px}px;height:${px}px"><img src="${shown}" alt="" width="${px}" height="${px}"></span><small>${l}</small></span>`).join('')}</div>` : ''}
    </div>
  </div>
  ${d ? `<div class="adv-list">${opt('pixel', 'Pixel art (keep sharp)', 'Scales by whole steps with hard edges and saves as PNG. Turn off for drawings and photos.')}${opt('flip', 'Flip to face right', isTr ? 'Mirror the picture.' : "Your side of a battle shows it as saved; the opponent's side is mirrored automatically.")}</div>` : ''}
  ${m.err ? `<p class="warn">${m.err}</p>` : ''}
  ${m.cls && !d ? `<p class="small"><button class="btn small" data-act="imgup" data-k="${esc(IMG_CLS(m.cls))}">${clsUrl ? 'Change' : 'Add'} the picture for every ${esc(m.cls)}</button></p>` : ''}
  <div class="confirm-row"><label class="btn${d ? '' : ' primary'}" for="imgfile" tabindex="0">${d || cur ? 'Choose another' : 'Choose an image'}</label><input id="imgfile" type="file" accept="image/*" class="sr">
    ${d && d.blob ? '<button class="btn primary" data-act="imgsave">Save image</button>' : ''}
    ${cur && !d ? `<button class="btn danger" data-act="imgdel">Remove</button>` : ''}
    <button class="btn" data-act="close">${d ? 'Cancel' : 'Close'}</button></div>
  <p class="fine">${note} Images stay in this browser on this device and are never part of the save file. Move them with Export pack under Images in the menu.</p>`;
}
async function imgSaveDraft() {
  const m = modal, d = m && m.draft; if (!d || !d.blob) return;
  const ok = await imgSet(m.key, d.blob);
  if (d.url) URL.revokeObjectURL(d.url);
  const label = imgLabel(m.key);
  modal = m.back || null; renderModal(); render();
  toast(ok ? `Saved the image for ${label}.` : `Saved for now, but this browser won't keep images, so it'll be gone when the page closes.`);
}
// ---- the Images manager (Advanced options, and Images in the league menu) ----
function imgCounts() {
  let p = 0, s = 0, t = 0, c = 0, bytes = 0;
  for (const [k, v] of IMGS) { if (k[0] === 'p') p++; else if (k[0] === 's') s++; else if (k[0] === 'c') c++; else t++; bytes += v.blob.size; }
  return { p, s, t, c, bytes, all: IMGS.size };
}
function imgSummary() { const c = imgCounts(); return c.all ? `${c.p} Pokémon · ${c.s} shiny · ${c.t} trainer${c.t === 1 ? '' : 's'}${c.c ? ` · ${c.c} class${c.c === 1 ? '' : 'es'}` : ''} · ${fmtBytes(c.bytes)}` : 'No images yet'; }
function imgGrid() {
  const q = fold(imgQ.trim());
  if (imgTab === 'cls') {
    const cnt = new Map(); if (S) for (const t of Object.values(S.trainers)) if (!t.retired && t.cls) cnt.set(t.cls, (cnt.get(t.cls) || 0) + 1);
    let names = imgClassList().filter(c => !q || fold(c).includes(q));
    names.sort((a, b) => (IMGS.has(IMG_CLS(b)) - IMGS.has(IMG_CLS(a))) || 0);
    const total = names.length; names = names.slice(0, 60);
    if (!names.length) return `<p class="muted small">No class matches that search.</p>`;
    return `<div class="imggrid">${names.map(c => { const u = imgUrl(IMG_CLS(c)), n = cnt.get(c) || 0;
      return `<button class="imgtile" data-act="imgup" data-k="${esc(IMG_CLS(c))}" title="${u ? 'Change' : 'Add'} the picture for every ${esc(c)}">${u ? `<img class="pic tpic" src="${u}" alt="" width="48" height="48">` : `<span class="tpic tinit" style="width:48px;height:48px;font-size:18px" aria-hidden="true">${esc(c.split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase())}</span>`}<span class="small">${esc(c)}</span>${S ? `<span class="fine">${n} trainer${n === 1 ? '' : 's'}</span>` : ''}</button>`; }).join('')}</div>${total > 60 ? `<p class="fine">Showing 60 of ${total}. Search to narrow it down.</p>` : ''}`;
  }
  if (imgTab === 'tr') {
    const have = [...IMGS.keys()].filter(k => k[0] === 't').map(k => k.slice(2));
    const live = S ? Object.values(S.trainers).filter(t => t.role !== 'prospect') : [];
    const byName = new Map(live.map(t => [trImgName(t), t]));
    let names = q ? [...new Set(have.concat([...byName.keys()]))].filter(n => fold(n).includes(q)) : have;
    names.sort((a, b) => (IMGS.has('t:' + b) - IMGS.has('t:' + a)) || a.localeCompare(b));
    const total = names.length; names = names.slice(0, 60);
    if (!names.length) return `<p class="muted small">${q ? 'No trainer matches that search.' : `No trainer portraits yet. ${S ? 'Search a trainer by name, or add one from a trainer\'s profile.' : 'Add them from a trainer\'s profile once a league is running, or import a pack.'}`}</p>`;
    return `<div class="imggrid">${names.map(n => { const t = byName.get(n);
      return `<button class="imgtile" data-act="imgup" data-k="${esc('t:' + n)}" title="${IMGS.has('t:' + n) ? 'Change' : 'Add'} ${esc(n)}'s portrait">${t ? trFace(t, 48) : `<img class="pic tpic" src="${imgUrl('t:' + n)}" alt="" width="48" height="48">`}<span class="small">${esc(n)}</span></button>`; }).join('')}</div>${total > 60 ? `<p class="fine">Showing 60 of ${total}. Search to narrow it down.</p>` : ''}`;
  }
  let names = q ? Object.keys(SP).filter(sp => fold(sp).includes(q) || SP[sp].types.some(ty => fold(ty) === q)) : Object.keys(SP).filter(sp => IMGS.has(IMG_SP(sp)) || IMGS.has(IMG_SHINY(sp)));
  names.sort((a, b) => a.localeCompare(b));
  const total = names.length; names = names.slice(0, 60);
  if (!names.length) return `<p class="muted small">${q ? 'No Pokémon matches that search.' : 'No Pokémon images yet. Search a Pokémon to add one, or import a pack.'}</p>`;
  return `<div class="imggrid">${names.map(sp => `<div class="imgtile"><button class="imgtile-main" data-act="imgup" data-k="${esc(IMG_SP(sp))}" title="${IMGS.has(IMG_SP(sp)) ? 'Change' : 'Add'} the image for ${esc(sp)}">${monFace(sp, false, 48, 'big')}<span class="small">${esc(sp)}</span></button><button class="imgtile-shiny${IMGS.has(IMG_SHINY(sp)) ? ' on' : ''}" data-act="imgup" data-k="${esc(IMG_SHINY(sp))}" title="${IMGS.has(IMG_SHINY(sp)) ? 'Change' : 'Add'} the shiny image for ${esc(sp)}">${IMGS.has(IMG_SHINY(sp)) ? `<img class="pic" src="${imgUrl(IMG_SHINY(sp))}" alt="" width="20" height="20">` : ''}✦ Shiny</button></div>`).join('')}</div>${total > 60 ? `<p class="fine">Showing 60 of ${total}. Search to narrow it down.</p>` : ''}`;
}
function imagesBody() {
  const c = imgCounts();
  return `<p class="muted small">The game comes with no Pokémon artwork. Add your own pictures: one per Pokémon (plus a shiny one if you like) and a portrait per trainer. They're kept in this browser on this device, never in the save file. Anything without a picture keeps its colored dot or initials.</p>
    <div class="cupsum imgstats"><div><b>${c.p}</b><small>Pokémon</small></div><div><b>${c.s}</b><small>Shiny</small></div><div><b>${c.t}</b><small>Trainers</small></div><div><b>${c.c}</b><small>Classes</small></div><div><b>${fmtBytes(c.bytes)}</b><small>Space used</small></div></div>
    <div class="filters"><button class="pill${imgTab === 'mon' ? ' on' : ''}" data-act="imgtab" data-v="mon">Pokémon</button><button class="pill${imgTab === 'tr' ? ' on' : ''}" data-act="imgtab" data-v="tr">Trainers</button><button class="pill${imgTab === 'cls' ? ' on' : ''}" data-act="imgtab" data-v="cls">Classes</button></div>
    ${imgTab === 'cls' ? '<p class="fine">A class picture is used for every trainer of that class (every Hiker, say) who has no portrait of their own.</p>' : ''}
    ${searchBox('imgq', imgQ, imgTab === 'tr' ? 'Search trainers' : imgTab === 'cls' ? 'Search classes' : 'Search Pokémon', imgTab === 'tr' ? 'Search trainers by name' : imgTab === 'cls' ? 'Search trainer classes' : 'Search by Pokémon name or type')}
    <div id="imggrid">${imgGrid()}</div>
    <h3 class="imgpack-h">Image packs</h3>
    <p class="muted small">Export pack saves every image as one zip file. Import pack takes a zip or a set of image files and matches them by name: <b>Sprout.png</b> is Sprout, <b>Sprout-shiny.png</b> its shiny image, and files in a <b>trainers</b> folder (or named like <b>Hiker Ben.png</b>) are trainer portraits, and files in a <b>classes</b> folder (like <b>classes/Hiker.png</b>) are class pictures. Imported images replace ones with the same name.</p>
    <div class="confirm-row"><button class="btn" data-act="imgexport"${c.all && !imgBusy ? '' : ' disabled'}>Export pack</button><label class="btn" for="imgpackfile" tabindex="0">Import pack</label><input id="imgpackfile" type="file" accept="image/*,.zip,application/zip" multiple class="sr">
      ${c.all ? (imgClearArm ? `<span class="small">Remove all ${c.all} images?</span><button class="btn danger small" data-act="imgclearyes">Remove all</button><button class="btn small" data-act="imgclearno">Keep them</button>` : `<button class="btn danger small" data-act="imgclear">Remove all images</button>`) : ''}</div>
    ${imgBusy ? '<p class="fine">Working on it…</p>' : imgMsg ? `<p class="cf-msg">${imgMsg}</p>` : ''}`;
}
function imagesModalBody() { return `<div class="mh"><h2>Images</h2><button class="btn icon" data-act="close" aria-label="Close">×</button></div><p class="small">${imgSummary()}</p>${imagesBody()}`; }
function imgRefresh() { if (modal && modal.kind === 'images') renderModal(); else render(); }
// ---- image packs: a plain zip writer (images are already compressed, so they're stored as they are) and reader ----
const CRC_T = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
function crc32(b) { let c = 0xFFFFFFFF; for (let i = 0; i < b.length; i++) c = CRC_T[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
function zipStore(files) {
  const enc = new TextEncoder(), parts = [], cd = []; let off = 0;
  for (const f of files) {
    const nm = enc.encode(f.name), crc = crc32(f.data), n = f.data.length, h = new DataView(new ArrayBuffer(30));
    h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint16(12, 0x21, true);
    h.setUint32(14, crc, true); h.setUint32(18, n, true); h.setUint32(22, n, true); h.setUint16(26, nm.length, true);
    parts.push(h, nm, f.data);
    const c = new DataView(new ArrayBuffer(46));
    c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true); c.setUint16(14, 0x21, true);
    c.setUint32(16, crc, true); c.setUint32(20, n, true); c.setUint32(24, n, true); c.setUint16(28, nm.length, true); c.setUint32(42, off, true);
    cd.push(c, nm); off += 30 + nm.length + n;
  }
  const size = cd.reduce((a, x) => a + x.byteLength, 0), e = new DataView(new ArrayBuffer(22));
  e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true); e.setUint32(12, size, true); e.setUint32(16, off, true);
  return new Blob(parts.concat(cd, [e]), { type: 'application/zip' });
}
async function unzipFiles(buf) {
  const u = new Uint8Array(buf), v = new DataView(buf), dec = new TextDecoder(); let e = -1;
  for (let i = u.length - 22; i >= Math.max(0, u.length - 65557); i--) if (v.getUint32(i, true) === 0x06054b50) { e = i; break; }
  if (e < 0) throw new Error('zip');
  const out = [], n = v.getUint16(e + 10, true); let p = v.getUint32(e + 16, true);
  for (let k = 0; k < n && p + 46 <= u.length; k++) {
    if (v.getUint32(p, true) !== 0x02014b50) break;
    const meth = v.getUint16(p + 10, true), csz = v.getUint32(p + 20, true), nl = v.getUint16(p + 28, true), xl = v.getUint16(p + 30, true), cl = v.getUint16(p + 32, true), lo = v.getUint32(p + 42, true);
    const name = dec.decode(u.subarray(p + 46, p + 46 + nl)); p += 46 + nl + xl + cl;
    if (name.endsWith('/') || /(^|\/)(__MACOSX|\.)/.test(name)) continue;
    const ds = lo + 30 + v.getUint16(lo + 26, true) + v.getUint16(lo + 28, true), raw = u.subarray(ds, ds + csz);
    let data = null;
    if (meth === 0) data = raw;
    else if (meth === 8 && window.DecompressionStream) { try { data = new Uint8Array(await new Response(new Blob([raw]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer()); } catch (er) {} }
    out.push({ name, data });
  }
  return out;
}
const imgFileSafe = s => String(s).replace(/[\\/:*?"<>|]/g, '_');
const imgNorm = s => imgFileSafe(fold(s)).replace(/\s+/g, ' ').trim();
const IMG_EXT = { 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif', 'image/jpeg': 'jpg' };
const IMG_MIME = { png: 'image/png', webp: 'image/webp', gif: 'image/gif', jpg: 'image/jpeg', jpeg: 'image/jpeg', bmp: 'image/bmp', avif: 'image/avif' };
async function imgExport() {
  if (!IMGS.size) return;
  imgBusy = true; imgMsg = ''; imgRefresh();
  try {
    const files = [], used = new Set();
    for (const [k, v] of [...IMGS].sort((a, b) => a[0].localeCompare(b[0]))) {
      const ext = IMG_EXT[v.blob.type] || 'png', base = k[0] === 't' ? `trainers/${imgFileSafe(k.slice(2))}` : k[0] === 'c' ? `classes/${imgFileSafe(k.slice(2))}` : `pokemon/${imgFileSafe(k.slice(2))}${k[0] === 's' ? '-shiny' : ''}`;
      let name = `${base}.${ext}`; for (let i = 2; used.has(name); i++) name = `${base} (${i}).${ext}`; used.add(name);
      files.push({ name, data: new Uint8Array(await v.blob.arrayBuffer()) });
    }
    const blob = zipStore(files), filename = 'pokemon-league-builder-images.zip';
    if (downloadsNs) {
      try { await downloadsNs.save({ filename, data: blob }); imgMsg = `Exported ${files.length} images.`; }
      catch (e) { const c = e && e.code; imgMsg = c === 'declined' ? '' : c === 'rate_limited' ? 'A download is already waiting for your answer.' : "Couldn't download here."; }
    } else {
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      imgMsg = `Exported ${files.length} images (${fmtBytes(blob.size)}).`;
    }
  } catch (e) { imgMsg = "Couldn't build the image pack."; }
  imgBusy = false; imgRefresh();
}
// which key a file in an image pack belongs to, by its name (and folder)
function imgMatcher() {
  const sp = new Map(); for (const n of Object.keys(SP)) sp.set(imgNorm(n), n);
  const tr = new Map(), first = new Map();
  if (S) for (const t of Object.values(S.trainers)) { tr.set(imgNorm(trImgName(t)), trImgName(t)); const k = imgNorm(t.name); first.set(k, first.has(k) && first.get(k) !== trImgName(t) ? null : trImgName(t)); }
  for (const k of IMGS.keys()) if (k[0] === 't') tr.set(imgNorm(k.slice(2)), k.slice(2));
  const cl = new Map(); for (const c of imgClassList()) cl.set(imgNorm(c), c);
  return path => {
    const parts = String(path).split('/'), file = parts.pop(), dir = fold(parts.pop() || '');
    const em = file.match(/^(.*)\.([a-z0-9]+)$/i); if (!em || !IMG_MIME[em[2].toLowerCase()]) return null;
    let base = em[1].replace(/ \(\d+\)$/, ''), shiny = false; const sm = base.match(/^(.*?)[-_ ]shiny$/i); if (sm) { shiny = true; base = sm[1]; }
    const k = imgNorm(base);
    if (/^class(es)?$/.test(dir)) return shiny ? null : 'c:' + (cl.get(k) || base.trim());
    if (!/^trainers?$/.test(dir) && sp.has(k)) return (shiny ? 's:' : 'p:') + sp.get(k);
    if (shiny) return null;
    if (tr.has(k)) return 't:' + tr.get(k);
    if (first.get(k)) return 't:' + first.get(k);
    if (/^trainers?$/.test(dir)) return 't:' + base.trim();
    return null;
  };
}
async function imgImport(fileList) {
  const files = [...(fileList || [])]; if (!files.length) return;
  imgBusy = true; imgMsg = ''; imgRefresh();
  const items = [];
  for (const f of files) {
    if (/\.zip$/i.test(f.name) || f.type === 'application/zip' || f.type === 'application/x-zip-compressed') {
      try { for (const z of await unzipFiles(await f.arrayBuffer())) items.push(z); } catch (e) { items.push({ name: f.name, bad: true }); }
    } else items.push({ name: f.webkitRelativePath || f.name, blob: f });
  }
  const match = imgMatcher(), done = { p: 0, s: 0, t: 0, c: 0 }, skipped = [];
  let failed = 0, stored = true;
  for (const it of items) {
    const key = it.bad ? null : match(it.name);
    if (!key) { if (!/\.(txt|md|json)$/i.test(it.name)) skipped.push(it.name.split('/').pop()); continue; }
    try {
      const ext = it.name.split('.').pop().toLowerCase();
      const blob = it.blob || (it.data && new Blob([it.data], { type: IMG_MIME[ext] || 'image/png' })); if (!blob) throw new Error('data');
      const img = await imgDecode(blob), w = img.naturalWidth, h = img.naturalHeight;
      // a pack's own 128 × 128 images are kept as they are; anything else is squared like an upload (small sprites as pixel art)
      const out = w === IMG_PX && h === IMG_PX && ['image/png', 'image/webp'].includes(blob.type) ? blob : await imgSquare(img, imgBounds(img), Math.max(w, h) <= IMG_PX, false);
      if (!(await imgSet(key, out))) stored = false;
      done[key[0]]++;
    } catch (e) { failed++; }
  }
  const n = done.p + done.s + done.t + done.c;
  imgMsg = `Imported ${n} image${n === 1 ? '' : 's'}${n ? ` (${done.p} Pokémon, ${done.s} shiny, ${done.t} trainer${done.t === 1 ? '' : 's'}${done.c ? `, ${done.c} class${done.c === 1 ? '' : 'es'}` : ''})` : ''}.`
    + (skipped.length ? ` ${skipped.length} file${skipped.length === 1 ? '' : 's'} didn't match a Pokémon or trainer: ${skipped.slice(0, 6).map(esc).join(', ')}${skipped.length > 6 ? '…' : ''}.` : '')
    + (failed ? ` ${failed} couldn't be opened.` : '') + (stored ? '' : " This browser won't keep images, so they'll be gone when the page closes.");
  imgBusy = false; imgRefresh();
}
async function imgClearAll() { const keys = [...IMGS.keys()]; for (const k of keys) imgUncache(k); try { await imgTx('readwrite', st => st.clear()); } catch (e) {} imgClearArm = false; imgMsg = `Removed ${keys.length} images.`; imgRefresh(); }
